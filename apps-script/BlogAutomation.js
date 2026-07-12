// ==========================================
// AUTOMATED BLOG PUBLISHING PIPELINE
// ==========================================
const BLOG_AUTOMATION_CONFIG = {
  editHandler: "handleBlogSheetEdit",
  changeHandler: "handleBlogSheetChange",
  workerHandler: "dispatchBlogPublishing",
  debounceMs: 30000,
  lockTimeoutMs: 10000,
  recoveryDelaysMs: [60000, 300000, 900000],
  githubApiVersion: "2026-03-10",
  eventType: "publish-blogs",
  allowedChangeTypes: ["INSERT_ROW", "REMOVE_ROW", "INSERT_COLUMN", "REMOVE_COLUMN"],
  digestFields: [
    "Title", "Slug", "Description", "Content", "Thumbnail", "Category",
    "Date", "Published", "Author", "Keywords", "UpdatedAt", "DocID", "GoogleDocID"
  ],
  properties: {
    token: "GITHUB_TOKEN",
    owner: "GITHUB_OWNER",
    repository: "GITHUB_REPOSITORY",
    eventType: "GITHUB_EVENT_TYPE",
    spreadsheetId: "SPREADSHEET_ID",
    blogSheetName: "BLOG_SHEET_NAME",
    pending: "BLOG_PUBLISH_PENDING",
    notBefore: "BLOG_PUBLISH_NOT_BEFORE",
    workerTriggerId: "BLOG_PUBLISH_TRIGGER_ID",
    lastDigest: "BLOG_LAST_DISPATCHED_DIGEST",
    lastStatus: "BLOG_LAST_DISPATCH_STATUS",
    lastDispatchAt: "BLOG_LAST_DISPATCH_AT",
    lastSuccessAt: "BLOG_LAST_SUCCESS_AT",
    lastErrorAt: "BLOG_LAST_ERROR_AT",
    lastErrorStatus: "BLOG_LAST_ERROR_STATUS",
    lastErrorResponse: "BLOG_LAST_ERROR_RESPONSE",
    observedDigest: "BLOG_LAST_OBSERVED_DIGEST",
    recoveryCount: "BLOG_RECOVERY_COUNT"
  }
};

function installBlogPublishingTriggers() {
  const config = getBlogAutomationSettings_();
  validateBlogAutomationSettings_(config);
  const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);

  removeBlogAutomationTriggers_(BLOG_AUTOMATION_CONFIG.editHandler);
  removeBlogAutomationTriggers_(BLOG_AUTOMATION_CONFIG.changeHandler);
  removeBlogAutomationTriggers_(BLOG_AUTOMATION_CONFIG.workerHandler);

  ScriptApp.newTrigger(BLOG_AUTOMATION_CONFIG.editHandler)
    .forSpreadsheet(spreadsheet)
    .onEdit()
    .create();

  ScriptApp.newTrigger(BLOG_AUTOMATION_CONFIG.changeHandler)
    .forSpreadsheet(spreadsheet)
    .onChange()
    .create();

  clearBlogAutomationRuntimeState_();
  const blogSheet = spreadsheet.getSheetByName(config.blogSheetName);
  if (blogSheet) {
    PropertiesService.getScriptProperties().setProperty(
      BLOG_AUTOMATION_CONFIG.properties.observedDigest,
      calculateBlogDataDigest_(blogSheet)
    );
  }
  console.log("Blog publishing triggers installed for sheet: " + config.blogSheetName);
}

function uninstallBlogPublishingTriggers() {
  removeBlogAutomationTriggers_(BLOG_AUTOMATION_CONFIG.editHandler);
  removeBlogAutomationTriggers_(BLOG_AUTOMATION_CONFIG.changeHandler);
  removeBlogAutomationTriggers_(BLOG_AUTOMATION_CONFIG.workerHandler);
  clearBlogAutomationRuntimeState_();
  console.log("Blog publishing triggers removed.");
}

function handleBlogSheetEdit(e) {
  if (!e || !e.range) return;

  const config = getBlogAutomationSettings_();
  const sheet = e.range.getSheet();
  if (sheet.getName() !== config.blogSheetName) return;

  const lastEditedRow = e.range.getRow() + e.range.getNumRows() - 1;
  if (lastEditedRow <= 1) return;

  markBlogPublishingPending_();
}

function handleBlogSheetChange(e) {
  if (!e || !e.source || !e.changeType) return;
  if (BLOG_AUTOMATION_CONFIG.allowedChangeTypes.indexOf(e.changeType) === -1) return;

  const config = getBlogAutomationSettings_();
  const sheet = e.source.getSheetByName(config.blogSheetName);
  if (!sheet) return;

  const properties = PropertiesService.getScriptProperties();
  const currentDigest = calculateBlogDataDigest_(sheet);
  const observedDigest = properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.observedDigest);
  properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.observedDigest, currentDigest);
  if (currentDigest === observedDigest) return;

  markBlogPublishingPending_();
}

function markBlogPublishingPending_() {
  const lock = LockService.getScriptLock();
  lock.waitLock(BLOG_AUTOMATION_CONFIG.lockTimeoutMs);

  try {
    const properties = PropertiesService.getScriptProperties();
    properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.pending, "true");
    properties.setProperty(
      BLOG_AUTOMATION_CONFIG.properties.notBefore,
      String(Date.now() + BLOG_AUTOMATION_CONFIG.debounceMs)
    );
    properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.recoveryCount, "0");
    ensureBlogDispatchWorker_(BLOG_AUTOMATION_CONFIG.debounceMs);
  } finally {
    lock.releaseLock();
  }
}

function dispatchBlogPublishing() {
  const lock = LockService.getScriptLock();
  lock.waitLock(BLOG_AUTOMATION_CONFIG.lockTimeoutMs);

  try {
    const config = getBlogAutomationSettings_();
    validateBlogAutomationSettings_(config);
    const properties = PropertiesService.getScriptProperties();
    properties.deleteProperty(BLOG_AUTOMATION_CONFIG.properties.workerTriggerId);
    removeBlogAutomationTriggers_(BLOG_AUTOMATION_CONFIG.workerHandler);

    if (properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.pending) !== "true") return;

    const notBefore = Number(properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.notBefore) || 0);
    const remainingDelay = notBefore - Date.now();
    if (remainingDelay > 0) {
      ensureBlogDispatchWorker_(Math.max(remainingDelay, 1000));
      return;
    }

    const spreadsheet = SpreadsheetApp.openById(config.spreadsheetId);
    const blogSheet = spreadsheet.getSheetByName(config.blogSheetName);
    if (!blogSheet) throw new Error("Configured blog sheet was not found.");

    const digest = calculateBlogDataDigest_(blogSheet);
    properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.observedDigest, digest);
    const previousDigest = properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.lastDigest);

    if (digest === previousDigest) {
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.pending, "false");
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastStatus, "skipped-unchanged");
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastDispatchAt, new Date().toISOString());
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.recoveryCount, "0");
      console.log("GitHub dispatch skipped because blog data is unchanged.");
      return;
    }

    const result = sendBlogRepositoryDispatch_(config, digest);
    if (result.success) {
      const completedAt = new Date().toISOString();
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastDigest, digest);
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.pending, "false");
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastStatus, "success");
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastDispatchAt, completedAt);
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastSuccessAt, completedAt);
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.recoveryCount, "0");
      properties.deleteProperty(BLOG_AUTOMATION_CONFIG.properties.lastErrorStatus);
      properties.deleteProperty(BLOG_AUTOMATION_CONFIG.properties.lastErrorResponse);
      console.log("GitHub repository_dispatch accepted successfully.");
      return;
    }

    recordBlogDispatchFailure_(result);
    if (result.transient) {
      scheduleBlogRecoveryAttempt_();
    } else {
      properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.pending, "false");
    }
    throw new Error(result.transient
      ? "GitHub dispatch failed after transient retries."
      : "GitHub dispatch failed with a permanent error.");
  } finally {
    lock.releaseLock();
  }
}

function calculateBlogDataDigest_(sheet) {
  const values = sheet.getDataRange().getValues();
  const headerMap = {};
  if (values.length) {
    values[0].forEach((value, index) => {
      const header = normalizeBlogHeader_(value);
      if (header && !Object.prototype.hasOwnProperty.call(headerMap, header)) {
        headerMap[header] = index;
      }
    });
  }
  const rows = [];

  for (let rowIndex = 1; rowIndex < values.length; rowIndex++) {
    const normalizedRow = {};
    BLOG_AUTOMATION_CONFIG.digestFields.forEach(field => {
      const columnIndex = headerMap[normalizeBlogHeader_(field)];
      normalizedRow[field] = typeof columnIndex === "undefined"
        ? null
        : normalizeBlogDigestValue_(values[rowIndex][columnIndex]);
    });
    const isBlank = BLOG_AUTOMATION_CONFIG.digestFields.every(field =>
      normalizedRow[field] === null || normalizedRow[field] === ""
    );
    if (!isBlank) rows.push(normalizedRow);
  }

  return createBlogDigest_(JSON.stringify({
    fields: BLOG_AUTOMATION_CONFIG.digestFields,
    rows: rows
  }));
}

function normalizeBlogHeader_(value) {
  return String(value || "").replace(/^\uFEFF/, "").trim().toLowerCase();
}

function normalizeBlogDigestValue_(value) {
  if (value === null || typeof value === "undefined") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? "" : value.toISOString();
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return isFinite(value) ? value : "";
  return String(value).replace(/\r\n/g, "\n").replace(/\r/g, "\n");
}

function createBlogDigest_(value) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    value,
    Utilities.Charset.UTF_8
  );
  return bytes.map(byte => {
    const unsigned = byte < 0 ? byte + 256 : byte;
    return ("0" + unsigned.toString(16)).slice(-2);
  }).join("");
}

function sendBlogRepositoryDispatch_(config, digest) {
  const endpoint = "https://api.github.com/repos/" +
    encodeURIComponent(config.githubOwner) + "/" +
    encodeURIComponent(config.githubRepository) + "/dispatches";
  const payload = JSON.stringify({
    event_type: config.githubEventType,
    client_payload: {
      source: "google-sheets",
      sheet: config.blogSheetName,
      digest: digest,
      requested_at: new Date().toISOString()
    }
  });
  try {
    const response = UrlFetchApp.fetch(endpoint, {
      method: "post",
      contentType: "application/json",
      payload: payload,
      muteHttpExceptions: true,
      headers: {
        Accept: "application/vnd.github+json",
        Authorization: "Bearer " + config.githubToken,
        "X-GitHub-Api-Version": BLOG_AUTOMATION_CONFIG.githubApiVersion
      }
    });
    const status = response.getResponseCode();
    if (status === 204) return { success: true, transient: false, status: status, responseText: "" };

    console.warn("GitHub dispatch returned HTTP " + status + ".");
    return {
      success: false,
      transient: isTransientBlogDispatchStatus_(status),
      status: status,
      responseText: sanitizeBlogDispatchResponse_(response.getContentText())
    };
  } catch (error) {
    console.warn("GitHub dispatch encountered a transport error.");
    return { success: false, transient: true, status: "network-error", responseText: "Transport error" };
  }
}

function ensureBlogDispatchWorker_(delayMs) {
  const existingTrigger = ScriptApp.getProjectTriggers().find(trigger =>
    trigger.getHandlerFunction() === BLOG_AUTOMATION_CONFIG.workerHandler
  );
  if (existingTrigger) {
    PropertiesService.getScriptProperties().setProperty(
      BLOG_AUTOMATION_CONFIG.properties.workerTriggerId,
      existingTrigger.getUniqueId()
    );
    return;
  }

  const trigger = ScriptApp.newTrigger(BLOG_AUTOMATION_CONFIG.workerHandler)
    .timeBased()
    .after(Math.max(Number(delayMs) || 1000, 1000))
    .create();
  PropertiesService.getScriptProperties().setProperty(
    BLOG_AUTOMATION_CONFIG.properties.workerTriggerId,
    trigger.getUniqueId()
  );
}

function scheduleBlogRecoveryAttempt_() {
  const properties = PropertiesService.getScriptProperties();
  const recoveryCount = Number(
    properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.recoveryCount) || 0
  ) + 1;
  properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.recoveryCount, String(recoveryCount));

  if (recoveryCount > BLOG_AUTOMATION_CONFIG.recoveryDelaysMs.length) {
    properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.pending, "false");
    properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastStatus, "failed-recovery-exhausted");
    console.error("GitHub dispatch recovery limit was exhausted.");
    return;
  }

  properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.pending, "true");
  const recoveryDelay = BLOG_AUTOMATION_CONFIG.recoveryDelaysMs[recoveryCount - 1];
  properties.setProperty(
    BLOG_AUTOMATION_CONFIG.properties.notBefore,
    String(Date.now() + recoveryDelay)
  );
  ensureBlogDispatchWorker_(recoveryDelay);
}

function getBlogAutomationSettings_() {
  const properties = PropertiesService.getScriptProperties();
  return {
    githubToken: properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.token),
    githubOwner: properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.owner),
    githubRepository: properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.repository),
    githubEventType: properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.eventType) || BLOG_AUTOMATION_CONFIG.eventType,
    spreadsheetId: properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.spreadsheetId) || MASTER_CONFIG.sheetId,
    blogSheetName: properties.getProperty(BLOG_AUTOMATION_CONFIG.properties.blogSheetName) || MASTER_CONFIG.tabs.blogs
  };
}

function validateBlogAutomationSettings_(config) {
  const missing = [];
  if (!config.githubToken) missing.push(BLOG_AUTOMATION_CONFIG.properties.token);
  if (!config.githubOwner) missing.push(BLOG_AUTOMATION_CONFIG.properties.owner);
  if (!config.githubRepository) missing.push(BLOG_AUTOMATION_CONFIG.properties.repository);
  if (!config.spreadsheetId) missing.push(BLOG_AUTOMATION_CONFIG.properties.spreadsheetId);
  if (missing.length) throw new Error("Missing required Script Properties: " + missing.join(", "));

  if (!/^[A-Za-z0-9_.-]+$/.test(config.githubOwner)) throw new Error("GITHUB_OWNER contains invalid characters.");
  if (!/^[A-Za-z0-9_.-]+$/.test(config.githubRepository)) throw new Error("GITHUB_REPOSITORY contains invalid characters.");
  if (!/^[A-Za-z0-9_.-]+$/.test(config.githubEventType)) throw new Error("GITHUB_EVENT_TYPE contains invalid characters.");
}

function recordBlogDispatchFailure_(result) {
  const properties = PropertiesService.getScriptProperties();
  const failedAt = new Date().toISOString();
  properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastStatus, result.transient ? "transient-failure" : "permanent-failure");
  properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastDispatchAt, failedAt);
  properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastErrorAt, failedAt);
  properties.setProperty(BLOG_AUTOMATION_CONFIG.properties.lastErrorStatus, String(result.status));
  properties.setProperty(
    BLOG_AUTOMATION_CONFIG.properties.lastErrorResponse,
    sanitizeBlogDispatchResponse_(result.responseText || "")
  );
  console.error("GitHub dispatch failed. Status: " + String(result.status) + "; transient: " + String(result.transient) + ".");
}

function sanitizeBlogDispatchResponse_(value) {
  return String(value || "")
    .replace(/Bearer\s+[A-Za-z0-9._~-]+/gi, "Bearer [REDACTED]")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .slice(0, 1000);
}

function isTransientBlogDispatchStatus_(status) {
  return [408, 429, 500, 502, 503, 504].indexOf(status) !== -1;
}

function removeBlogAutomationTriggers_(handlerName) {
  ScriptApp.getProjectTriggers().forEach(trigger => {
    if (trigger.getHandlerFunction() === handlerName) ScriptApp.deleteTrigger(trigger);
  });
}

function clearBlogAutomationRuntimeState_() {
  const properties = PropertiesService.getScriptProperties();
  [
    BLOG_AUTOMATION_CONFIG.properties.pending,
    BLOG_AUTOMATION_CONFIG.properties.notBefore,
    BLOG_AUTOMATION_CONFIG.properties.workerTriggerId,
    BLOG_AUTOMATION_CONFIG.properties.observedDigest,
    BLOG_AUTOMATION_CONFIG.properties.recoveryCount
  ].forEach(key => properties.deleteProperty(key));
}
