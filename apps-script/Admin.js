const ADMIN_CONFIG = {
  email: "itsmbillah@gmail.com",
  sessionIdleSeconds: 1800,
  sessionAbsoluteSeconds: 28800,
  passwordIterations: 20000,
  properties: {
    password: "ADMIN_PASSWORD_V1",
    bootstrap: "ADMIN_BOOTSTRAP_PASSWORD",
    passwordVersion: "ADMIN_PASSWORD_VERSION",
    requireChange: "ADMIN_REQUIRE_PASSWORD_CHANGE"
  },
  tabs: {
    media: "Portfolio_Media",
    seo: "Portfolio_SEO",
    audit: "Admin_Activity_Log"
  }
};

const ADMIN_ENTITIES = {
  skills: { tab: "Skills", id: "RecordID", active: "Active", order: "Order", fields: ["Name", "Level", "Category", "Description", "Order", "Active"] },
  experience: { tab: "Experience", id: "RecordID", active: "Active", order: "DisplayOrder", fields: ["Title", "Company", "Period", "Description", "SkillsUsed", "Achievements", "Icon", "DisplayOrder", "Active"] },
  education: { tab: "Education", id: "RecordID", active: "Active", order: "DisplayOrder", fields: ["Degree", "Institution", "Period", "Description", "Result", "Icon", "DisplayOrder", "Active"] },
  certificates: { tab: "Certificates", id: "RecordID", active: "Published", order: "DisplayOrder", fields: ["Name", "Organization", "Date", "Description", "CredentialID", "ImageURL", "VerifyURL", "Skills", "Published", "DisplayOrder"] },
  blogs: { tab: "Blogs", id: "RecordID", active: "Published", order: "DisplayOrder", fields: ["Title", "Slug", "Description", "Content", "Keywords", "ReadTime", "Thumbnail", "Category", "DocID", "Date", "Published", "Author", "DisplayOrder", "SEOTitle", "SEODescription"] },
  faq: { tab: "FAQ", id: "RecordID", active: "Active", order: "DisplayOrder", fields: ["Question", "Answer", "Category", "DisplayOrder", "Active"] },
  media: { tab: "Portfolio_Media", id: "media_id", active: "active", order: "display_order", fields: ["drive_file_id", "public_url", "alt_text", "usage", "project_id", "mime_type", "active", "display_order", "updated_at"] },
  seo: { tab: "Portfolio_SEO", id: "seo_id", active: "active", order: "display_order", fields: ["scope", "entity_id", "page_title", "meta_description", "canonical_url", "og_title", "og_description", "og_image", "active", "display_order", "updated_at"] },
  aiKnowledge: { tab: "AI_Knowledge", id: "RecordID", active: "Active", order: "DisplayOrder", private: true, fields: ["Type", "Title", "Content", "DisplayOrder", "Active"] }
};

function setupMasterDashboard() {
  const properties = PropertiesService.getScriptProperties();
  const bootstrap = properties.getProperty(ADMIN_CONFIG.properties.bootstrap);
  if (!properties.getProperty(ADMIN_CONFIG.properties.password)) {
    if (!bootstrap) throw new Error("Set ADMIN_BOOTSTRAP_PASSWORD in Script Properties before setup.");
    properties.setProperty(ADMIN_CONFIG.properties.password, createPasswordVerifier_(bootstrap));
    properties.setProperty(ADMIN_CONFIG.properties.passwordVersion, "1");
    properties.setProperty(ADMIN_CONFIG.properties.requireChange, "true");
    properties.deleteProperty(ADMIN_CONFIG.properties.bootstrap);
  }
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  Object.keys(ADMIN_ENTITIES).forEach(key => ensureAdminEntitySchema_(ss, ADMIN_ENTITIES[key]));
  ensureSheetWithHeaders_(ss, ADMIN_CONFIG.tabs.audit, ["event_id", "timestamp", "admin", "action", "entity", "entity_id", "success", "error_code", "changed_fields"]);
  return { success: true, initialized: true };
}

function adminCall(request) {
  const input = request && typeof request === "object" ? request : {};
  const command = String(input.command || "");
  try {
    if (command === "auth.login") return adminLogin_(input.payload || {});
    const session = requireAdminSession_(input.token, command !== "auth.changePassword");
    let result;
    switch (command) {
      case "auth.session": result = adminSessionDto_(session); break;
      case "auth.changePassword": result = changeAdminPassword_(session, input.payload || {}); break;
      case "auth.logout": result = adminLogout_(input.token); break;
      case "overview.read": result = buildAdminOverview_(); break;
      case "profile.read": result = readAdminProfile_(); break;
      case "profile.update": result = updateAdminProfile_(input.payload || {}, session); break;
      case "config.read": result = readAdminConfig_(); break;
      case "config.update": result = updateAdminConfig_(input.payload || {}, session); break;
      case "projects.list": result = listAdminProjects_(); break;
      case "projects.github.update": result = updateGitHubCuration_(input.payload || {}, session); break;
      case "projects.manual.save": result = saveManualProject_(input.payload || {}, session); break;
      case "projects.manual.archive": result = archiveManualProject_(input.payload || {}, session); break;
      case "ai.prompt.read": result = readPrivateAiPrompt_(); break;
      case "ai.prompt.update": result = updatePrivateAiPrompt_(input.payload || {}, session); break;
      case "sync.status": result = buildAdminSyncStatus_(); break;
      case "sync.run": result = runAdminSync_(session); break;
      case "activity.list": result = listAdminActivity_(); break;
      case "entity.list": result = listAdminEntity_(input.payload && input.payload.entity); break;
      case "entity.save": result = saveAdminEntity_(input.payload || {}, session); break;
      case "entity.archive": result = archiveAdminEntity_(input.payload || {}, session); break;
      default: throw adminError_("UNKNOWN_ADMIN_COMMAND", "This dashboard action is not available.");
    }
    return { success: true, data: result };
  } catch (error) {
    logSafeError_("ADMIN_CALL_FAILED", error);
    return { success: false, error: { code: error.publicCode || "ADMIN_REQUEST_FAILED", message: error.publicMessage || "The dashboard request failed." } };
  }
}

function adminLogin_(payload) {
  enforceRateLimit_("admin-login", payload.clientId || payload.email, 8, 900);
  const email = String(payload.email || "").trim().toLowerCase();
  const password = String(payload.password || "");
  const verifier = PropertiesService.getScriptProperties().getProperty(ADMIN_CONFIG.properties.password);
  if (email !== ADMIN_CONFIG.email || !verifier || !verifyPassword_(password, verifier)) {
    auditAdmin_(email || "unknown", "login", "authentication", "", false, "INVALID_CREDENTIALS", []);
    throw adminError_("INVALID_CREDENTIALS", "Email or password is incorrect.");
  }
  const session = createAdminSession_(propertiesBoolean_(ADMIN_CONFIG.properties.requireChange, true));
  auditAdmin_(ADMIN_CONFIG.email, "login", "authentication", "", true, "", []);
  return { success: true, data: { token: session.token, session: adminSessionDto_(session.record) } };
}

function changeAdminPassword_(session, payload) {
  const current = String(payload.currentPassword || "");
  const next = String(payload.newPassword || "");
  if (next.length < 12 || !/[a-z]/.test(next) || !/[A-Z]/.test(next) || !/[0-9]/.test(next) || !/[^A-Za-z0-9]/.test(next)) {
    throw adminError_("WEAK_PASSWORD", "Use at least 12 characters with upper, lower, number, and symbol.");
  }
  const properties = PropertiesService.getScriptProperties();
  if (!verifyPassword_(current, properties.getProperty(ADMIN_CONFIG.properties.password) || "")) throw adminError_("INVALID_CURRENT_PASSWORD", "Current password is incorrect.");
  properties.setProperty(ADMIN_CONFIG.properties.password, createPasswordVerifier_(next));
  properties.setProperty(ADMIN_CONFIG.properties.passwordVersion, String(Number(properties.getProperty(ADMIN_CONFIG.properties.passwordVersion) || 1) + 1));
  properties.setProperty(ADMIN_CONFIG.properties.requireChange, "false");
  revokeAllAdminSessions_();
  const replacement = createAdminSession_(false);
  auditAdmin_(ADMIN_CONFIG.email, "change_password", "authentication", "", true, "", []);
  return { token: replacement.token, session: adminSessionDto_(replacement.record) };
}

function createPasswordVerifier_(password) {
  const salt = Utilities.base64EncodeWebSafe(randomBytes_(24)).replace(/=+$/, "");
  const digest = pbkdf2_(String(password), salt, ADMIN_CONFIG.passwordIterations);
  return ["pbkdf2-sha256", ADMIN_CONFIG.passwordIterations, salt, digest].join("$");
}

function verifyPassword_(password, stored) {
  const parts = String(stored || "").split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2-sha256") return false;
  return constantTimeEqual_(pbkdf2_(String(password), parts[2], Number(parts[1])), parts[3]);
}

function pbkdf2_(password, salt, iterations) {
  const keyBytes = Utilities.newBlob(String(password)).getBytes();
  const saltBytes = Utilities.base64DecodeWebSafe(String(salt));
  let block = Utilities.computeHmacSha256Signature(saltBytes.concat([0, 0, 0, 1]), keyBytes);
  const result = block.slice();
  for (let i = 1; i < iterations; i++) {
    block = Utilities.computeHmacSha256Signature(block, keyBytes);
    for (let j = 0; j < result.length; j++) result[j] = result[j] ^ block[j];
  }
  return Utilities.base64EncodeWebSafe(result).replace(/=+$/, "");
}

function randomBytes_(length) {
  const bytes = [];
  while (bytes.length < length) Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, Utilities.getUuid() + new Date().getTime()).forEach(b => bytes.push(b));
  return bytes.slice(0, length);
}

function createAdminSession_(mustChangePassword) {
  const token = Utilities.base64EncodeWebSafe(randomBytes_(32)).replace(/=+$/, "");
  const now = Date.now();
  const record = { email: ADMIN_CONFIG.email, issuedAt: now, lastUsedAt: now, expiresAt: now + ADMIN_CONFIG.sessionAbsoluteSeconds * 1000, mustChangePassword: !!mustChangePassword, passwordVersion: getPasswordVersion_() };
  PropertiesService.getScriptProperties().setProperty("ADMIN_SESSION_" + sha256Hex_(token), JSON.stringify(record));
  return { token: token, record: record };
}

function requireAdminSession_(token, requireChangedPassword) {
  const key = "ADMIN_SESSION_" + sha256Hex_(String(token || ""));
  const properties = PropertiesService.getScriptProperties();
  const raw = properties.getProperty(key);
  if (!raw) throw adminError_("UNAUTHORIZED", "Your session is invalid. Please sign in again.");
  const session = JSON.parse(raw);
  const now = Date.now();
  if (session.expiresAt <= now || now - session.lastUsedAt > ADMIN_CONFIG.sessionIdleSeconds * 1000 || session.passwordVersion !== getPasswordVersion_()) {
    properties.deleteProperty(key);
    throw adminError_("SESSION_EXPIRED", "Your session has expired. Please sign in again.");
  }
  if (requireChangedPassword && session.mustChangePassword) throw adminError_("PASSWORD_CHANGE_REQUIRED", "Change the temporary password to continue.");
  session.lastUsedAt = now;
  properties.setProperty(key, JSON.stringify(session));
  return session;
}

function adminSessionDto_(session) { return { email: session.email, expiresAt: new Date(session.expiresAt).toISOString(), mustChangePassword: !!session.mustChangePassword }; }
function getPasswordVersion_() { return Number(PropertiesService.getScriptProperties().getProperty(ADMIN_CONFIG.properties.passwordVersion) || 1); }
function propertiesBoolean_(key, fallback) { const value = PropertiesService.getScriptProperties().getProperty(key); return value === null ? fallback : value === "true"; }
function adminLogout_(token) { PropertiesService.getScriptProperties().deleteProperty("ADMIN_SESSION_" + sha256Hex_(String(token || ""))); return { loggedOut: true }; }
function revokeAllAdminSessions_() { const p = PropertiesService.getScriptProperties(); Object.keys(p.getProperties()).filter(k => k.indexOf("ADMIN_SESSION_") === 0).forEach(k => p.deleteProperty(k)); }
function sha256Hex_(value) { return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, value).map(b => (b + 256).toString(16).slice(-2)).join(""); }
function constantTimeEqual_(a, b) { if (a.length !== b.length) return false; let diff = 0; for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i); return diff === 0; }

function buildAdminOverview_() {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  const github = listAdminProjects_();
  const counts = {};
  Object.keys(ADMIN_ENTITIES).forEach(key => { if (!ADMIN_ENTITIES[key].private) counts[key] = readSheetObjects_(ss, ADMIN_ENTITIES[key].tab).length; });
  return { counts: Object.assign(counts, { totalProjects: github.github.length + github.manual.length, githubProjects: github.github.length, manualProjects: github.manual.length, publishedProjects: github.github.concat(github.manual).filter(x => x.showOnPortfolio).length, featuredProjects: github.github.concat(github.manual).filter(x => x.featured).length }), sync: buildAdminSyncStatus_() };
}

function readAdminProfile_() { const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId); return buildPublicProfile_(ss); }
function updateAdminProfile_(payload, session) {
  const allowed = ["Name", "Title", "HeroQuote", "Email", "Phone", "Location", "Bio", "AboutMe", "YearsExperience", "CurrentRole", "CurrentCompany", "Facebook", "LinkedIn", "WhatsApp", "GitHub", "ResumeURL", "ProfilePic", "HeroBG"];
  const changed = updateHorizontalRecord_(MASTER_CONFIG.tabs.profile, payload, allowed);
  invalidatePublicPortfolioCache_(); auditAdmin_(session.email, "update", "profile", "profile", true, "", changed); return readAdminProfile_();
}

const SAFE_CONFIG_KEYS = ["name", "site_tagline", "chatbot_name", "chatbot_welcome", "footer_text", "about_section_title", "projects_section_title", "skills_section_title", "experience_section_title", "contact_section_title", "dashboard_url"];
function readAdminConfig_() { return pickPublicFields_(parseKeyValueSheet(SpreadsheetApp.openById(MASTER_CONFIG.sheetId), MASTER_CONFIG.tabs.config), SAFE_CONFIG_KEYS); }
function updateAdminConfig_(payload, session) { const changed = updateKeyValueRecord_(MASTER_CONFIG.tabs.config, payload, SAFE_CONFIG_KEYS); invalidatePublicPortfolioCache_(); auditAdmin_(session.email, "update", "config", "config", true, "", changed); return readAdminConfig_(); }

function listAdminProjects_() {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  const curations = readSheetObjects_(ss, MASTER_CONFIG.tabs.projectCuration).reduce((m, x) => { if (x.github_repository_id) m[String(x.github_repository_id)] = x; return m; }, {});
  const github = loadLastGoodSnapshot_().map(repo => {
    const c = curations[String(repo.github_repository_id)] || {};
    const thumb = resolveProjectThumbnail_(repo, c);
    return { source: "GITHUB", id: String(repo.github_repository_id), repoKey: repo.repo_key, name: repo.name, description: repo.description, repositoryUrl: repo.repository_url, demoUrl: repo.homepage_url, topics: parseJsonArray_(repo.topics_json), language: repo.primary_language, stars: Number(repo.stars || 0), forks: Number(repo.forks || 0), status: repo.sync_state, updatedAt: repo.updated_at, fetchedAt: repo.fetched_at, thumbnail: thumb.url, thumbnailSource: thumb.source, showOnPortfolio: normalizeBoolean_(c.show_on_portfolio), featured: normalizeBoolean_(c.featured), displayOrder: normalizeDisplayOrder_(c.display_order), curation: pickPublicFields_(c, GITHUB_SYNC_CONFIG.curationHeaders.slice(2)) };
  });
  const manual = readSheetObjects_(ss, MASTER_CONFIG.tabs.manualProjects).map(x => ({ source: "MANUAL", id: String(x.manual_project_id), name: x.title, description: x.description, demoUrl: x.demo_url, thumbnail: x.image, thumbnailSource: "manual", showOnPortfolio: normalizeBoolean_(x.show_on_portfolio), featured: normalizeBoolean_(x.featured), displayOrder: normalizeDisplayOrder_(x.display_order), record: pickPublicFields_(x, GITHUB_SYNC_CONFIG.manualHeaders || Object.keys(x)) }));
  return { github: github, manual: manual };
}

function updateGitHubCuration_(payload, session) {
  const id = String(payload.github_repository_id || payload.id || "");
  const allowed = GITHUB_SYNC_CONFIG.curationHeaders.slice(2);
  const changed = updateTableRecordById_(MASTER_CONFIG.tabs.projectCuration, "github_repository_id", id, payload, allowed, false);
  invalidatePublicPortfolioCache_(); auditAdmin_(session.email, "update", "github_project", id, true, "", changed); return listAdminProjects_();
}

function saveManualProject_(payload, session) {
  const allowed = ["title", "description", "category", "display_order", "featured", "show_on_portfolio", "kpi_highlight", "image", "image_alt", "demo_url", "tech_stack", "portfolio_status", "last_reviewed_at"];
  const id = String(payload.manual_project_id || "manual-" + Utilities.getUuid()).trim();
  const changed = updateTableRecordById_(MASTER_CONFIG.tabs.manualProjects, "manual_project_id", id, payload, allowed, true);
  invalidatePublicPortfolioCache_(); auditAdmin_(session.email, "save", "manual_project", id, true, "", changed); return listAdminProjects_();
}
function archiveManualProject_(payload, session) { payload.portfolio_status = "historical"; payload.show_on_portfolio = false; return saveManualProject_(payload, session); }

function listAdminEntity_(key) { const config = ADMIN_ENTITIES[String(key || "")]; if (!config) throw adminError_("UNKNOWN_ENTITY", "Unknown content type."); return readSheetObjects_(SpreadsheetApp.openById(MASTER_CONFIG.sheetId), config.tab).map(row => pickPublicFields_(row, [config.id].concat(config.fields))); }
function saveAdminEntity_(payload, session) { const key = String(payload.entity || ""); const config = ADMIN_ENTITIES[key]; if (!config) throw adminError_("UNKNOWN_ENTITY", "Unknown content type."); const id = String(payload.id || payload.record && payload.record[config.id] || Utilities.getUuid()); const changed = updateTableRecordById_(config.tab, config.id, id, payload.record || {}, config.fields, true); invalidatePublicPortfolioCache_(); auditAdmin_(session.email, "save", key, id, true, "", changed); return listAdminEntity_(key); }
function archiveAdminEntity_(payload, session) { const key = String(payload.entity || ""); const config = ADMIN_ENTITIES[key]; if (!config) throw adminError_("UNKNOWN_ENTITY", "Unknown content type."); const record = {}; record[config.active] = false; const changed = updateTableRecordById_(config.tab, config.id, String(payload.id || ""), record, [config.active], false); invalidatePublicPortfolioCache_(); auditAdmin_(session.email, "archive", key, String(payload.id || ""), true, "", changed); return listAdminEntity_(key); }

function readPrivateAiPrompt_() { return parseKeyValueSheet(SpreadsheetApp.openById(MASTER_CONFIG.sheetId), MASTER_CONFIG.tabs.aiPrompt); }
function updatePrivateAiPrompt_(payload, session) { const allowed = ["system_prompt", "fallback_message"]; const changed = updateKeyValueRecord_(MASTER_CONFIG.tabs.aiPrompt, payload, allowed); auditAdmin_(session.email, "update", "ai_prompt", "private", true, "", changed); return readPrivateAiPrompt_(); }
function buildAdminSyncStatus_() { const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId); const status = readGitHubSyncStatus_(ss); return { lastAttemptAt: normalizeDateForJson_(status.last_attempt_at), lastSuccessAt: normalizeDateForJson_(status.last_success_at), status: status.status || "unknown", httpStatus: status.http_status || "", repositoryCount: Number(status.repository_count || 0), failureCount: Number(status.failure_count || 0), nextRetryAt: normalizeDateForJson_(status.next_retry_at), errorCode: status.error_code || "", nextScheduledEstimate: status.last_attempt_at ? new Date(new Date(status.last_attempt_at).getTime() + 21600000).toISOString() : "" }; }
function runAdminSync_(session) { const before = buildAdminSyncStatus_(); if (before.nextRetryAt && new Date(before.nextRetryAt) > new Date()) throw adminError_("SYNC_RATE_LIMITED", "GitHub rate limit has not reset."); const result = syncGitHubProjects(); auditAdmin_(session.email, "run", "github_sync", "", true, "", []); return { result: result, status: buildAdminSyncStatus_() }; }
function listAdminActivity_() { return readSheetObjects_(SpreadsheetApp.openById(MASTER_CONFIG.sheetId), ADMIN_CONFIG.tabs.audit).slice(-100).reverse().map(x => pickPublicFields_(x, ["event_id", "timestamp", "admin", "action", "entity", "entity_id", "success", "error_code", "changed_fields"])); }

function ensureAdminEntitySchema_(ss, config) {
  let sheet = ss.getSheetByName(config.tab);
  if (!sheet) sheet = ss.insertSheet(config.tab);
  const values = sheet.getDataRange().getValues();
  const headers = values.length ? values[0].map(x => String(x || "").trim()) : [];
  const required = [config.id].concat(config.fields).filter((x, i, a) => a.indexOf(x) === i);
  required.forEach(header => {
    if (headers.indexOf(header) >= 0) return;
    const column = headers.length + 1;
    sheet.getRange(1, column).setValue(header);
    headers.push(header);
    if (header === config.active && sheet.getLastRow() > 1) sheet.getRange(2, column, sheet.getLastRow() - 1, 1).setValue(true);
  });
  if (sheet.getLastRow() > 1) {
    const idCol = headers.indexOf(config.id) + 1;
    const ids = sheet.getRange(2, idCol, sheet.getLastRow() - 1, 1).getValues();
    ids.forEach((row, index) => { if (!row[0]) sheet.getRange(index + 2, idCol).setValue(Utilities.getUuid()); });
  }
  sheet.setFrozenRows(1);
}

function updateHorizontalRecord_(tab, payload, allowed) { const sheet = SpreadsheetApp.openById(MASTER_CONFIG.sheetId).getSheetByName(tab); const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(String); const changed = []; allowed.forEach(field => { if (Object.prototype.hasOwnProperty.call(payload, field) && headers.indexOf(field) >= 0) { sheet.getRange(2, headers.indexOf(field) + 1).setValue(adminCellValue_(field, payload[field])); changed.push(field); } }); return changed; }
function updateKeyValueRecord_(tab, payload, allowed) { const sheet = SpreadsheetApp.openById(MASTER_CONFIG.sheetId).getSheetByName(tab); const values = sheet.getDataRange().getValues(); const changed = []; allowed.forEach(key => { if (!Object.prototype.hasOwnProperty.call(payload, key)) return; let row = values.findIndex((x, i) => i > 0 && String(x[0]).trim() === key) + 1; if (!row) { row = sheet.getLastRow() + 1; sheet.getRange(row, 1).setValue(key); } sheet.getRange(row, 2).setValue(adminCellValue_(key, payload[key])); changed.push(key); }); return changed; }
function updateTableRecordById_(tab, idHeader, id, payload, allowed, allowCreate) { const sheet = SpreadsheetApp.openById(MASTER_CONFIG.sheetId).getSheetByName(tab); if (!sheet) throw adminError_("MISSING_ENTITY_SHEET", "Content storage is unavailable."); const values = sheet.getDataRange().getValues(); const headers = values[0].map(x => String(x || "").trim()); const idIndex = headers.indexOf(idHeader); if (idIndex < 0) throw adminError_("MISSING_ENTITY_ID", "Content schema is not initialized."); let row = values.findIndex((x, i) => i > 0 && String(x[idIndex]) === id) + 1; if (!row && !allowCreate) throw adminError_("ENTITY_NOT_FOUND", "The selected record no longer exists."); if (!row) { row = sheet.getLastRow() + 1; sheet.getRange(row, idIndex + 1).setValue(id); } const changed = []; allowed.forEach(field => { const index = headers.indexOf(field); if (index >= 0 && Object.prototype.hasOwnProperty.call(payload, field)) { sheet.getRange(row, index + 1).setValue(adminCellValue_(field, payload[field])); changed.push(field); } }); return changed; }
function adminCellValue_(field, value) { if (/^(Active|Published|active|featured|show_on_portfolio)$/.test(field)) return normalizeBoolean_(value); if (/url|image|github|linkedin|facebook|whatsapp|canonical/i.test(field) && value && !safeHttpsUrl_(value)) throw adminError_("INVALID_URL", "Use a valid HTTPS URL."); return typeof value === "string" ? safeSheetText_(value.slice(0, field === "Content" || field === "system_prompt" ? 50000 : 5000)) : value; }

function auditAdmin_(admin, action, entity, entityId, success, errorCode, changedFields) { try { const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId); const sheet = ensureSheetWithHeaders_(ss, ADMIN_CONFIG.tabs.audit, ["event_id", "timestamp", "admin", "action", "entity", "entity_id", "success", "error_code", "changed_fields"]); sheet.appendRow([Utilities.getUuid(), new Date(), admin, action, entity, entityId, success, errorCode || "", (changedFields || []).join(",")]); } catch (error) { logSafeError_("ADMIN_AUDIT_FAILED", error); } }
function adminError_(code, message) { const error = new Error(code); error.publicCode = code; error.publicMessage = message; return error; }
