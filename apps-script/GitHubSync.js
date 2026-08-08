const GITHUB_SYNC_CONFIG = {
  owner: "itsmebillah",
  apiBase: "https://api.github.com",
  apiVersion: "2026-03-10",
  snapshotProperty: "GITHUB_LAST_GOOD_SNAPSHOT_JSON",
  snapshotPartCountProperty: "GITHUB_LAST_GOOD_SNAPSHOT_PARTS",
  snapshotPartSize: 8000,
  etagProperty: "GITHUB_REPOSITORIES_ETAG",
  missingRetentionDays: 30,
  snapshotHeaders: [
    "github_repository_id", "github_node_id", "repo_key", "name", "description",
    "repository_url", "homepage_url", "topics_json", "primary_language", "visibility",
    "archived", "disabled", "license_spdx", "stars", "forks", "default_branch",
    "created_at", "updated_at", "pushed_at", "readme_url", "fetched_at", "source_etag",
    "sync_state", "last_seen_at", "missing_since"
  ],
  curationHeaders: [
    "github_repository_id", "repo_key", "show_on_portfolio", "featured", "display_order",
    "section", "category", "custom_title", "custom_description", "portfolio_image",
    "tech_stack_override", "demo_url_override", "kpi_highlight", "portfolio_status",
    "visibility_note", "last_reviewed_at"
  ],
  statusHeaders: [
    "last_attempt_at", "last_success_at", "status", "http_status", "repository_count",
    "etag", "failure_count", "next_retry_at", "error_code"
  ]
};

function syncGitHubProjects() {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  const attemptedAt = new Date();
  try {
    ensureGitHubSyncSheets_();
    const response = fetchGitHubRepositories_();
    if (response.notModified) {
      writeGitHubSyncStatus_({
        lastAttemptAt: attemptedAt,
        lastSuccessAt: attemptedAt,
        status: "not-modified",
        httpStatus: 304,
        repositoryCount: loadLastGoodSnapshot_().length,
        etag: response.etag,
        failureCount: 0
      });
      return { success: true, status: "not-modified" };
    }

    const previous = loadLastGoodSnapshot_();
    const reconciled = reconcileRepositorySnapshot_(previous, response.repositories, attemptedAt);
    validateRepositorySnapshot_(reconciled);
    saveLastGoodSnapshot_(reconciled);
    replaceSnapshotSheet_(reconciled, response.etag);
    ensureCurationRows_(reconciled);
    PropertiesService.getScriptProperties().setProperty(GITHUB_SYNC_CONFIG.etagProperty, response.etag || "");
    writeGitHubSyncStatus_({
      lastAttemptAt: attemptedAt,
      lastSuccessAt: attemptedAt,
      status: "success",
      httpStatus: response.status,
      repositoryCount: response.repositories.length,
      etag: response.etag,
      failureCount: 0
    });
    invalidatePublicPortfolioCache_();
    return { success: true, status: "success", repositoryCount: response.repositories.length };
  } catch (error) {
    const previousStatus = readGitHubSyncStatus_();
    const failureCount = Number(previousStatus.failure_count || 0) + 1;
    try {
      writeGitHubSyncStatus_({
        lastAttemptAt: attemptedAt,
        lastSuccessAt: previousStatus.last_success_at || "",
        status: "failed",
        httpStatus: error.httpStatus || "",
        repositoryCount: loadLastGoodSnapshot_().filter(item => item.sync_state === "active").length,
        etag: PropertiesService.getScriptProperties().getProperty(GITHUB_SYNC_CONFIG.etagProperty) || "",
        failureCount: failureCount,
        nextRetryAt: new Date(Date.now() + Math.min(Math.pow(2, failureCount) * 60000, 21600000)),
        errorCode: error.publicCode || "GITHUB_SYNC_FAILED"
      });
    } catch (statusError) { logSafeError_("SYNC_STATUS_WRITE_FAILED", statusError); }
    logSafeError_("GITHUB_SYNC_FAILED", error);
    throw error;
  } finally {
    lock.releaseLock();
  }
}

function fetchGitHubRepositories_() {
  const properties = PropertiesService.getScriptProperties();
  const etag = properties.getProperty(GITHUB_SYNC_CONFIG.etagProperty) || "";
  const token = properties.getProperty("GITHUB_METADATA_TOKEN") || "";
  const headers = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": GITHUB_SYNC_CONFIG.apiVersion,
    "User-Agent": "itsmebillah-portfolio-sync"
  };
  if (etag) headers["If-None-Match"] = etag;
  if (token) headers.Authorization = "Bearer " + token;

  const allRepositories = [];
  let responseEtag = etag;
  let status = 200;
  for (let page = 1; page <= 10; page++) {
    const pageHeaders = Object.assign({}, headers);
    if (page > 1) delete pageHeaders["If-None-Match"];
    const url = GITHUB_SYNC_CONFIG.apiBase + "/users/" + encodeURIComponent(GITHUB_SYNC_CONFIG.owner) + "/repos?type=owner&sort=full_name&direction=asc&per_page=100&page=" + page;
    const response = UrlFetchApp.fetch(url, { method: "get", headers: pageHeaders, muteHttpExceptions: true });
    status = response.getResponseCode();
    const responseHeaders = response.getAllHeaders();
    if (page === 1) responseEtag = responseHeaders.ETag || responseHeaders.Etag || responseHeaders.etag || etag;
    if (page === 1 && status === 304) return { notModified: true, status: status, etag: responseEtag };
    if (status !== 200) {
      const error = createPublicError_(status === 403 || status === 429 ? "GITHUB_RATE_LIMITED" : "GITHUB_UNAVAILABLE", "GitHub synchronization failed.");
      error.httpStatus = status;
      throw error;
    }
    let payload;
    try { payload = JSON.parse(response.getContentText()); } catch (error) {
      throw createPublicError_("INVALID_GITHUB_RESPONSE", "GitHub returned invalid data.");
    }
    if (!Array.isArray(payload)) throw createPublicError_("INVALID_GITHUB_RESPONSE", "GitHub returned invalid data.");
    allRepositories.push.apply(allRepositories, payload);
    if (payload.length < 100) break;
    if (page === 10) throw createPublicError_("GITHUB_PAGINATION_LIMIT", "GitHub synchronization exceeded the configured page limit.");
  }
  const fetchedAt = new Date().toISOString();
  const repositories = allRepositories.filter(repo => repo && repo.owner && String(repo.owner.login).toLowerCase() === GITHUB_SYNC_CONFIG.owner.toLowerCase() && repo.private !== true)
    .map(repo => normalizeGitHubRepository_(repo, fetchedAt));
  return { notModified: false, status: status, etag: responseEtag, repositories: repositories };
}

function normalizeGitHubRepository_(repo, fetchedAt) {
  return {
    github_repository_id: String(repo.id),
    github_node_id: String(repo.node_id || ""),
    repo_key: String(repo.full_name || ""),
    name: String(repo.name || ""),
    description: String(repo.description || "").slice(0, 500),
    repository_url: safeHttpsUrl_(repo.html_url),
    homepage_url: safeHttpsUrl_(repo.homepage),
    topics_json: JSON.stringify(Array.isArray(repo.topics) ? repo.topics.filter(isSafeTopic_) : []),
    primary_language: String(repo.language || "").slice(0, 100),
    visibility: String(repo.visibility || "public"),
    archived: repo.archived === true,
    disabled: repo.disabled === true,
    license_spdx: repo.license && repo.license.spdx_id && repo.license.spdx_id !== "NOASSERTION" ? String(repo.license.spdx_id) : "",
    stars: Math.max(0, Number(repo.stargazers_count) || 0),
    forks: Math.max(0, Number(repo.forks_count) || 0),
    default_branch: String(repo.default_branch || "").slice(0, 255),
    created_at: normalizeIsoDate_(repo.created_at),
    updated_at: normalizeIsoDate_(repo.updated_at),
    pushed_at: normalizeIsoDate_(repo.pushed_at),
    readme_url: safeHttpsUrl_(String(repo.html_url || "") + "#readme"),
    fetched_at: fetchedAt,
    sync_state: "active",
    last_seen_at: fetchedAt,
    missing_since: ""
  };
}

function reconcileRepositorySnapshot_(previous, current, now) {
  const nowIso = now instanceof Date ? now.toISOString() : new Date(now).toISOString();
  const currentById = {};
  current.forEach(item => { currentById[item.github_repository_id] = item; });
  const result = current.slice();
  previous.forEach(oldItem => {
    if (currentById[oldItem.github_repository_id]) return;
    const missingSince = oldItem.missing_since || nowIso;
    const age = Date.now() - new Date(missingSince).getTime();
    if (!isFinite(age) || age <= GITHUB_SYNC_CONFIG.missingRetentionDays * 86400000) {
      const retained = Object.assign({}, oldItem, { sync_state: "unavailable", missing_since: missingSince, fetched_at: nowIso });
      result.push(retained);
    }
  });
  return result.sort((a, b) => a.repo_key.localeCompare(b.repo_key));
}

function validateRepositorySnapshot_(repositories) {
  if (!Array.isArray(repositories)) throw createPublicError_("INVALID_SNAPSHOT", "Repository snapshot validation failed.");
  const ids = {};
  repositories.forEach(repo => {
    if (!/^\d+$/.test(String(repo.github_repository_id || "")) || !/^[^/]+\/[^/]+$/.test(repo.repo_key || "") || !/^https:\/\//.test(repo.repository_url || "")) {
      throw createPublicError_("INVALID_REPOSITORY", "Repository snapshot validation failed.");
    }
    if (ids[repo.github_repository_id]) throw createPublicError_("DUPLICATE_REPOSITORY", "Repository snapshot validation failed.");
    ids[repo.github_repository_id] = true;
  });
}

function buildPublicProjects_(ss) {
  const snapshot = loadLastGoodSnapshot_();
  const curations = readSheetObjects_(ss, MASTER_CONFIG.tabs.projectCuration);
  const curationById = {};
  curations.forEach(item => { if (item.github_repository_id) curationById[String(item.github_repository_id)] = item; });
  const merged = snapshot.filter(repo => repo.sync_state === "active" && repo.visibility === "public" && !repo.disabled)
    .filter(repo => {
      const curation = curationById[repo.github_repository_id];
      if (!curation || !normalizeBoolean_(curation.show_on_portfolio)) return false;
      if (!repo.archived) return true;
      return ["completed", "historical"].indexOf(String(curation.portfolio_status || "").trim().toLowerCase()) !== -1;
    }).map(repo => mapMergedProjectDto_(repo, curationById[repo.github_repository_id]));

  const mergedNames = {};
  merged.forEach(project => { mergedNames[String(project.name || "").trim().toLowerCase()] = true; });
  const legacy = readSheetObjects_(ss, MASTER_CONFIG.tabs.projects)
    .filter(item => normalizeBoolean_(item.Published))
    .filter(item => !mergedNames[String(item.Name || "").trim().toLowerCase()])
    .map(mapLegacyProjectDto_);
  return merged.concat(legacy).sort((a, b) => Number(a.displayOrder || 999) - Number(b.displayOrder || 999) || a.title.localeCompare(b.title));
}

function mapMergedProjectDto_(repo, curation) {
  const topics = parseJsonArray_(repo.topics_json);
  const stackOverride = splitList_(curation.tech_stack_override);
  return {
    id: repo.github_repository_id,
    repoKey: repo.repo_key,
    name: repo.name,
    title: cleanPublicText_(curation.custom_title || repo.name, 150),
    description: cleanPublicText_(curation.custom_description || repo.description, 1000),
    url: repo.repository_url,
    demoUrl: safeHttpsUrl_(curation.demo_url_override || repo.homepage_url),
    documentationUrl: repo.readme_url,
    topics: topics,
    techStack: stackOverride.length ? stackOverride : topics.concat(repo.primary_language ? [repo.primary_language] : []).filter(uniqueValue_),
    primaryLanguage: repo.primary_language,
    category: cleanPublicText_(curation.category, 100),
    section: cleanPublicText_(curation.section || "projects", 100),
    featured: normalizeBoolean_(curation.featured),
    displayOrder: normalizeDisplayOrder_(curation.display_order),
    image: safeHttpsUrl_(curation.portfolio_image),
    kpiHighlight: cleanPublicText_(curation.kpi_highlight, 300),
    status: cleanPublicText_(curation.portfolio_status || (repo.archived ? "archived" : "active"), 50),
    lastUpdated: repo.updated_at
  };
}

function mapLegacyProjectDto_(item, index) {
  return {
    id: "legacy:" + slugifyProjectKey_(item.Name || String(index || "project")),
    repoKey: "",
    name: cleanPublicText_(item.Name, 150),
    title: cleanPublicText_(item.Name, 150),
    description: cleanPublicText_(item.Description, 1000),
    url: safeHttpsUrl_(item.GitHubURL),
    demoUrl: safeHttpsUrl_(item.LiveURL),
    documentationUrl: "",
    topics: splitList_(item.Tags),
    techStack: splitList_(item.TechStack || item.Tags),
    primaryLanguage: "",
    category: cleanPublicText_(item.Category, 100),
    section: "projects",
    featured: normalizeBoolean_(item.Featured),
    displayOrder: normalizeDisplayOrder_(item.Order || 999),
    image: safeHttpsUrl_(item.Image),
    kpiHighlight: cleanPublicText_(item.Impact, 300),
    status: "active",
    lastUpdated: ""
  };
}

function getPublicSourceStatus_(ss) {
  const status = readGitHubSyncStatus_(ss);
  const lastSuccess = status.last_success_at || "";
  return {
    github: status.status === "failed" ? "stale" : (lastSuccess ? "fresh" : "not-configured"),
    sheets: "fresh",
    stale: status.status === "failed",
    lastSuccessfulSyncAt: normalizeDateForJson_(lastSuccess)
  };
}

function ensureGitHubSyncSheets_() {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  ensureSheetWithHeaders_(ss, MASTER_CONFIG.tabs.githubSnapshot, GITHUB_SYNC_CONFIG.snapshotHeaders);
  ensureSheetWithHeaders_(ss, MASTER_CONFIG.tabs.projectCuration, GITHUB_SYNC_CONFIG.curationHeaders);
  ensureSheetWithHeaders_(ss, MASTER_CONFIG.tabs.syncStatus, GITHUB_SYNC_CONFIG.statusHeaders);
}

function ensureSheetWithHeaders_(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  const existing = sheet.getRange(1, 1, 1, headers.length).getValues()[0];
  if (existing.some((value, index) => String(value || "").trim() && String(value).trim() !== headers[index])) {
    throw createPublicError_("SHEET_SCHEMA_CONFLICT", "A synchronization sheet has an incompatible schema.");
  }
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.setFrozenRows(1);
  return sheet;
}

function replaceSnapshotSheet_(repositories, etag) {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  const sheet = ensureSheetWithHeaders_(ss, MASTER_CONFIG.tabs.githubSnapshot, GITHUB_SYNC_CONFIG.snapshotHeaders);
  const previous = sheet.getDataRange().getValues();
  const rows = repositories.map(repo => GITHUB_SYNC_CONFIG.snapshotHeaders.map(header => {
    const value = header === "source_etag" ? (etag || "") : (repo[header] === undefined ? "" : repo[header]);
    return typeof value === "string" ? safeSheetText_(value) : value;
  }));
  try {
    sheet.getRange(2, 1, Math.max(sheet.getLastRow() - 1, 1), GITHUB_SYNC_CONFIG.snapshotHeaders.length).clearContent();
    if (rows.length) sheet.getRange(2, 1, rows.length, GITHUB_SYNC_CONFIG.snapshotHeaders.length).setValues(rows);
  } catch (error) {
    sheet.clearContents();
    sheet.getRange(1, 1, previous.length, previous[0].length).setValues(previous);
    throw error;
  }
}

function ensureCurationRows_(repositories) {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  const sheet = ensureSheetWithHeaders_(ss, MASTER_CONFIG.tabs.projectCuration, GITHUB_SYNC_CONFIG.curationHeaders);
  const existing = readSheetObjects_(ss, MASTER_CONFIG.tabs.projectCuration);
  const ids = {};
  existing.forEach((item, index) => {
    if (!item.github_repository_id) return;
    const id = String(item.github_repository_id);
    ids[id] = true;
    const current = repositories.find(repo => repo.github_repository_id === id);
    if (current && String(item.repo_key || "") !== current.repo_key) sheet.getRange(index + 2, 2).setValue(current.repo_key);
  });
  const newRows = repositories.filter(repo => repo.sync_state === "active" && !ids[repo.github_repository_id]).map(repo =>
    GITHUB_SYNC_CONFIG.curationHeaders.map(header => {
      if (header === "github_repository_id") return repo.github_repository_id;
      if (header === "repo_key") return repo.repo_key;
      if (header === "show_on_portfolio" || header === "featured") return false;
      return "";
    })
  );
  if (newRows.length) sheet.getRange(sheet.getLastRow() + 1, 1, newRows.length, GITHUB_SYNC_CONFIG.curationHeaders.length).setValues(newRows);
}

function writeGitHubSyncStatus_(status) {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  const sheet = ensureSheetWithHeaders_(ss, MASTER_CONFIG.tabs.syncStatus, GITHUB_SYNC_CONFIG.statusHeaders);
  const values = {
    last_attempt_at: normalizeDateForJson_(status.lastAttemptAt),
    last_success_at: normalizeDateForJson_(status.lastSuccessAt),
    status: status.status || "",
    http_status: status.httpStatus || "",
    repository_count: Number(status.repositoryCount) || 0,
    etag: status.etag || "",
    failure_count: Number(status.failureCount) || 0,
    next_retry_at: normalizeDateForJson_(status.nextRetryAt),
    error_code: status.errorCode || ""
  };
  sheet.getRange(2, 1, 1, GITHUB_SYNC_CONFIG.statusHeaders.length).setValues([GITHUB_SYNC_CONFIG.statusHeaders.map(header => values[header])]);
}

function readGitHubSyncStatus_(spreadsheet) {
  const ss = spreadsheet || SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  const rows = readSheetObjects_(ss, MASTER_CONFIG.tabs.syncStatus);
  return rows[0] || {};
}

function saveLastGoodSnapshot_(repositories) {
  const properties = PropertiesService.getScriptProperties();
  const serialized = JSON.stringify(repositories);
  const previousCount = Number(properties.getProperty(GITHUB_SYNC_CONFIG.snapshotPartCountProperty) || 0);
  const parts = [];
  for (let offset = 0; offset < serialized.length; offset += GITHUB_SYNC_CONFIG.snapshotPartSize) {
    parts.push(serialized.slice(offset, offset + GITHUB_SYNC_CONFIG.snapshotPartSize));
  }
  parts.forEach((part, index) => properties.setProperty(GITHUB_SYNC_CONFIG.snapshotProperty + "_" + index, part));
  for (let index = parts.length; index < previousCount; index++) properties.deleteProperty(GITHUB_SYNC_CONFIG.snapshotProperty + "_" + index);
  properties.setProperty(GITHUB_SYNC_CONFIG.snapshotPartCountProperty, String(parts.length));
}

function loadLastGoodSnapshot_() {
  const properties = PropertiesService.getScriptProperties();
  const partCount = Number(properties.getProperty(GITHUB_SYNC_CONFIG.snapshotPartCountProperty) || 0);
  let raw = "";
  for (let index = 0; index < partCount; index++) raw += properties.getProperty(GITHUB_SYNC_CONFIG.snapshotProperty + "_" + index) || "";
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed;
    } catch (error) { logSafeError_("SNAPSHOT_PROPERTY_PARSE_FAILED", error); }
  }
  try {
    const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
    return readSheetObjects_(ss, MASTER_CONFIG.tabs.githubSnapshot).map(snapshotRowToObject_);
  } catch (error) {
    logSafeError_("SNAPSHOT_SHEET_READ_FAILED", error);
    return [];
  }
}

function snapshotRowToObject_(item) {
  const result = {};
  GITHUB_SYNC_CONFIG.snapshotHeaders.forEach(header => { result[header] = item[header] === undefined ? "" : item[header]; });
  result.archived = normalizeBoolean_(result.archived);
  result.disabled = normalizeBoolean_(result.disabled);
  return result;
}

function installGitHubSyncTrigger() {
  ScriptApp.getProjectTriggers().filter(trigger => trigger.getHandlerFunction() === "syncGitHubProjects")
    .forEach(trigger => ScriptApp.deleteTrigger(trigger));
  ScriptApp.newTrigger("syncGitHubProjects").timeBased().everyHours(6).create();
  return { success: true, schedule: "every-6-hours" };
}

function safeHttpsUrl_(value) {
  const url = String(value || "").trim();
  return /^https:\/\/[^\s]+$/i.test(url) ? url.slice(0, 2048) : "";
}

function isSafeTopic_(value) {
  return /^[a-z0-9][a-z0-9-]{0,49}$/.test(String(value || ""));
}

function normalizeIsoDate_(value) {
  const date = new Date(value);
  return isNaN(date.getTime()) ? "" : date.toISOString();
}

function normalizeDateForJson_(value) {
  if (!value) return "";
  const date = value instanceof Date ? value : new Date(value);
  return isNaN(date.getTime()) ? "" : date.toISOString();
}

function cleanPublicText_(value, maxLength) {
  return String(value || "").replace(/[\u0000-\u001F\u007F]/g, " ").replace(/\s+/g, " ").trim().slice(0, maxLength);
}

function splitList_(value) {
  return String(value || "").split(",").map(item => cleanPublicText_(item, 100)).filter(Boolean).filter(uniqueValue_);
}

function uniqueValue_(value, index, values) {
  return values.indexOf(value) === index;
}

function parseJsonArray_(value) {
  try {
    const parsed = JSON.parse(value || "[]");
    return Array.isArray(parsed) ? parsed.map(item => cleanPublicText_(item, 100)).filter(Boolean).filter(uniqueValue_) : [];
  } catch (error) { return []; }
}

function normalizeDisplayOrder_(value) {
  const number = Number(value);
  return isFinite(number) && number >= 0 ? Math.floor(number) : 999;
}

function slugifyProjectKey_(value) {
  return String(value || "project").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 100) || "project";
}
