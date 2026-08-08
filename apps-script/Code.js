// ==========================================
// CENTRAL ARCHITECTURE CONFIGURATION
// ==========================================
const MASTER_CONFIG = {
  sheetId: "1ZnoWdyyqzutrIs6SBnYfwN3a9aVsPNPJjzw9lWu76iE", // আপনার স্প্রেডশিট আইডি
  adminEmail: "itsmbillah@gmail.com",                     // নোটিফিকেশন ইমেইল
  groqModel: "openai/gpt-oss-120b",                     // ফাস্ট এবং রিলায়েবল এআই মডেল
  tabs: {
    profile: "Profile",
    config: "Config",
    skills: "Skills",
    projects: "Projects",
    experience: "Experience",
    education: "Education",
    certificates: "Certificates",
    blogs: "Blogs",
    faq: "FAQ",
    aiContextLegacy: "AI_CONTEXT",
    aiPrompt: "AI_Prompt",
    aiKnowledge: "AI_Knowledge",
    submissions: "Submissions",
    visitorLog: "VisitorLog",
    githubSnapshot: "GitHub_Project_Snapshot",
    projectCuration: "Portfolio_Project_Curation",
    syncStatus: "GitHub_Sync_Status"
  },
  publicCacheKey: "portfolio_public_dto_v1_contract11",
  publicCacheSeconds: 600,
  limits: {
    chatMessage: 500,
    contactName: 100,
    contactEmail: 254,
    contactSubject: 200,
    contactMessage: 5000,
    aiPrompt: 12000,
    aiKnowledgeRows: 100,
    aiKnowledgeField: 2000,
    chatPerMinute: 40,
    contactPerHour: 20
  }
};

function getSecret_(key) {
  const value = PropertiesService.getScriptProperties().getProperty(key);
  if (!value) throw new Error("Missing required Script Property: " + key);
  return value;
}

// ==========================================
// CORE APP ROUTER (doGet & doPost)
// ==========================================
function doGet(e) {
  const params = e && e.parameter ? e.parameter : {};
  const action = String(params.action || "health").trim();

  try {
    try { logVisitorStream(e, action); } catch (logError) { logSafeError_("VISITOR_LOG_FAILED", logError); }

    switch (action) {
      case "getAllData":
        return buildSecureJsonResponse(compileAllPortfolioData());
      case "chat":
        enforceRateLimit_("chat", params.clientId, MASTER_CONFIG.limits.chatPerMinute, 60);
        return buildSecureJsonResponse(executeGroqAiPipeline(validateChatMessage_(params.message)));
      case "health":
        return buildSecureJsonResponse({ success: true, service: "portfolio-data", schemaVersion: 1 });
      default:
        return buildSecureJsonResponse(publicError_("UNKNOWN_ACTION", "The requested action is not available."));
    }
  } catch (error) {
    logSafeError_("GET_FAILED", error);
    return buildSecureJsonResponse(publicError_(publicErrorCode_(error), publicErrorMessage_(error)));
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e.postData && e.postData.type === "application/json") {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }

    if (payload.action === "chat" && payload.message) {
      enforceRateLimit_("chat", payload.clientId, MASTER_CONFIG.limits.chatPerMinute, 60);
      return buildSecureJsonResponse(executeGroqAiPipeline(validateChatMessage_(payload.message)));
    }

    enforceRateLimit_("contact", payload.clientId || payload.email, MASTER_CONFIG.limits.contactPerHour, 3600);
    return buildSecureJsonResponse(processFormSubmission(validateContactPayload_(payload)));
  } catch (error) {
    logSafeError_("POST_FAILED", error);
    return buildSecureJsonResponse(publicError_(publicErrorCode_(error), publicErrorMessage_(error)));
  }
}

function handleContactFormPipeline(params) {
  try {
    enforceRateLimit_("contact", params.clientId || params.email, MASTER_CONFIG.limits.contactPerHour, 3600);
    return buildSecureJsonResponse(processFormSubmission(validateContactPayload_(params)));
  } catch (error) {
    logSafeError_("CONTACT_FAILED", error);
    return buildSecureJsonResponse(publicError_(publicErrorCode_(error), publicErrorMessage_(error)));
  }
}

function buildSecureJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

function publicError_(code, message) {
  return { success: false, error: { code: code, message: message } };
}

function publicErrorCode_(error) {
  return error && error.publicCode ? error.publicCode : "REQUEST_FAILED";
}

function publicErrorMessage_(error) {
  return error && error.publicMessage
    ? error.publicMessage
    : "The request could not be completed. Please try again later.";
}

function createPublicError_(code, message) {
  const error = new Error(code);
  error.publicCode = code;
  error.publicMessage = message;
  return error;
}

function logSafeError_(code, error) {
  console.error(code + ": " + (error && error.name ? error.name : "Error"));
}

// ==========================================
// DATA EXTRACTOR & SCHEMA PARSER ENGINE
// ==========================================
function compileAllPortfolioData() {
  const cache = CacheService.getScriptCache();
  const cached = cache.get(MASTER_CONFIG.publicCacheKey);
  if (cached) {
    try { return JSON.parse(cached); } catch (error) { logSafeError_("CACHE_PARSE_FAILED", error); }
  }

  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  const result = {
    success: true,
    schemaVersion: 1,
    timestamp: new Date().toISOString(),
    sourceStatus: getPublicSourceStatus_(ss),
    data: {
      profile: buildPublicProfile_(ss),
      config: buildPublicConfig_(ss),
      skills: mapPublicTable_(ss, MASTER_CONFIG.tabs.skills, ["Name", "Level", "Category", "Description", "Order"]),
      projects: buildPublicProjects_(ss),
      experience: mapPublicTable_(ss, MASTER_CONFIG.tabs.experience, ["Title", "Company", "Period", "Description", "SkillsUsed", "Achievements", "Icon"]),
      education: mapPublicTable_(ss, MASTER_CONFIG.tabs.education, ["Degree", "Institution", "Period", "Description", "Result", "Icon"]),
      certificates: mapPublicTable_(ss, MASTER_CONFIG.tabs.certificates, ["Name", "Organization", "Date", "Description", "CredentialID", "ImageURL", "VerifyURL", "Skills", "Published"], { publishedOnly: true }),
      blogs: extractDynamicBlogsWithDocs(ss),
      faq: mapPublicTable_(ss, MASTER_CONFIG.tabs.faq, ["Question", "Answer", "Category"]),
      aiContext: mapPublicTable_(ss, MASTER_CONFIG.tabs.aiContextLegacy, ["Section", "Content"])
    }
  };

  const serialized = JSON.stringify(result);
  if (serialized.length <= 90000) {
    try { cache.put(MASTER_CONFIG.publicCacheKey, serialized, MASTER_CONFIG.publicCacheSeconds); }
    catch (error) { logSafeError_("CACHE_WRITE_FAILED", error); }
  }
  return result;
}

// ১. Profile শিট পার্সার (Horizontal Single-Row Data)
function readSheetObjects_(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  const headers = values[0].map(header => String(header || "").trim());
  return values.slice(1).filter(row => row.some(value => value !== "" && value !== null)).map(row => {
    const item = {};
    headers.forEach((header, index) => { if (header) item[header] = row[index]; });
    return item;
  });
}

function pickPublicFields_(source, fields) {
  const result = {};
  fields.forEach(field => { result[field] = source && Object.prototype.hasOwnProperty.call(source, field) ? source[field] : ""; });
  return result;
}

function buildPublicProfile_(ss) {
  const sheet = ss.getSheetByName(MASTER_CONFIG.tabs.profile);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return {};
  const headers = values[0].map(h => h.toString().trim());
  const rowData = values[1];
  const source = {};
  headers.forEach((header, idx) => { if (header) source[header] = rowData[idx]; });
  return pickPublicFields_(source, [
    "Name", "Title", "HeroQuote", "Email", "Phone", "Location", "Bio", "AboutMe",
    "YearsExperience", "CurrentRole", "CurrentCompany", "Facebook", "LinkedIn", "WhatsApp",
    "GitHub", "ResumeURL", "ProfilePic", "HeroBG"
  ]);
}

// ২. Config বা Key-Value শিট পার্সার
function parseKeyValueSheet(ss, sheetName) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  const data = {};
  for (let i = 1; i < values.length; i++) {
    if (values[i][0]) data[values[i][0].toString().trim()] = values[i][1];
  }
  return data;
}

function buildPublicConfig_(ss) {
  const source = parseKeyValueSheet(ss, MASTER_CONFIG.tabs.config);
  return pickPublicFields_(source, [
    "name", "site_tagline", "chatbot_name", "chatbot_welcome", "footer_text",
    "about_section_title", "projects_section_title", "skills_section_title",
    "experience_section_title", "contact_section_title"
  ]);
}

function buildPrivateAiContext_(ss) {
  const promptValues = parseKeyValueSheet(ss, MASTER_CONFIG.tabs.aiPrompt);
  const systemPrompt = String(promptValues.system_prompt || "").trim().slice(0, MASTER_CONFIG.limits.aiPrompt);
  const knowledge = readSheetObjects_(ss, MASTER_CONFIG.tabs.aiKnowledge)
    .slice(0, MASTER_CONFIG.limits.aiKnowledgeRows)
    .map(item => ({
      type: cleanAiContextField_(item.Type),
      title: cleanAiContextField_(item.Title),
      content: cleanAiContextField_(item.Content)
    }))
    .filter(item => item.type || item.title || item.content);
  return { systemPrompt: systemPrompt, knowledge: knowledge };
}

function cleanAiContextField_(value) {
  return String(value || "").replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, " ")
    .trim().slice(0, MASTER_CONFIG.limits.aiKnowledgeField);
}

function mapPublicTable_(ss, sheetName, fields, options) {
  const config = options || {};
  return readSheetObjects_(ss, sheetName).filter(item => {
    if (!config.publishedOnly) return true;
    return normalizeBoolean_(item.Published);
  }).map(item => pickPublicFields_(item, fields));
}

// ৩. জেনারেল টেবিল শিট পার্সার (Skills, Projects, etc.)
function parseTableSheet(ss, sheetName, checkPublished = false) {
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];
  
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return [];
  
  const headers = values[0].map(h => h.toString().trim());
  const dataList = [];
  
  for (let i = 1; i < values.length; i++) {
    const row = values[i];
    const item = {};
    headers.forEach((header, index) => {
      item[header] = row[index];
    });
    
    if (checkPublished && item.hasOwnProperty("Published")) {
      const pubStatus = String(item["Published"]).toUpperCase();
      if (pubStatus === "TRUE" || item["Published"] === true || pubStatus === "1") {
        dataList.push(item);
      }
    } else {
      dataList.push(item);
    }
  }
  return dataList;
}

// ৪. গুগল ডক্স ইন্টিগ্রেশনসহ অ্যাডভান্সড ব্লগ এক্সট্র্যাক্টর
function extractDynamicBlogsWithDocs(ss) {
  const rawBlogs = readSheetObjects_(ss, MASTER_CONFIG.tabs.blogs).filter(blog => normalizeBoolean_(blog.Published));
  return rawBlogs.map(blog => {
    let content = blog.Content || "";
    const docId = blog.DocID || blog.GoogleDocID || "";
    
    if (docId && docId.toString().trim() !== "") {
      try {
        const doc = DocumentApp.openById(docId.toString().trim());
        const body = doc.getBody();
        content = body.getText().replace(/\n\n/g, '</p><p>').replace(/\n/g, '<br>');
        content = `<p>${content}</p>`;
      } catch (err) {
        console.error("Doc conversion stream error on ID: " + docId, err);
      }
    }
    const mapped = pickPublicFields_(blog, [
      "Title", "Slug", "Description", "Content", "Keywords", "ReadTime", "Thumbnail",
      "Category", "Date", "Published", "Author"
    ]);
    mapped.Content = content;
    mapped.ReadTime = Math.ceil((content.length || 1) / 1000) + 1;
    return mapped;
  });
}

function normalizeBoolean_(value) {
  return value === true || value === 1 || String(value || "").trim().toUpperCase() === "TRUE";
}

function invalidatePublicPortfolioCache_() {
  CacheService.getScriptCache().remove(MASTER_CONFIG.publicCacheKey);
}

// ==========================================
// INTELLIGENT AI CORE - GROQ API PIPELINE
// ==========================================
function executeGroqAiPipeline(userMessage) {
  if (!userMessage) return publicError_("EMPTY_MESSAGE", "Please enter a message.");

  try {
    const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
    const dataset = compileAllPortfolioData().data;
    const prof = dataset.profile;
    const privateAiContext = buildPrivateAiContext_(ss);
    
    // ১. আপনার দেওয়া প্রম্পট স্ট্রাকচার অনুযায়ী Live Unified Context স্ট্রিং বিল্ড
    let dynamicSystemContext = privateAiContext.systemPrompt || `You are the exclusive AI Knowledge Agent for ${prof.Name || "Md. Masum Billah"}. Answer accurately and professionally using only the supplied portfolio context. If the answer is not supported, say so and offer the public contact path.`;
    dynamicSystemContext += "\n\n";
    
    dynamicSystemContext += `[CORE IDENTITIES]\nName: ${prof.Name}\nTitle: ${prof.Title}\nBio: ${prof.Bio}\nLocation: ${prof.Location}\nEmail: ${prof.Email}\nPhone: ${prof.Phone}\nLinkedIn: ${prof.LinkedIn}\nGitHub: ${prof.GitHub}\n\n`;
    
    dynamicSystemContext += `[TECHNICAL CAPABILITIES]\n` + dataset.skills.map(s => `- ${s.Name}: ${s.Level}% expertise in ${s.Category} (Order: ${s.Order})`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[ENGINEERING PROJECTS]\n` + dataset.projects.map(p => `- Project Name: ${p.title || p.name}\n  Description: ${p.description}\n  Technologies: ${(p.techStack || []).join(", ")}\n  Live Deployment: ${p.demoUrl || "Not published"}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[PROFESSIONAL EXPERIENCES]\n` + dataset.experience.map(e => `- Role: ${e.Title} at ${e.Company} (${e.Period})\n  Deliverables: ${e.Description}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[ACADEMIC CREDENTIALS]\n` + dataset.education.map(ed => `- Qualification: ${ed.Degree} from ${ed.Institution} (${ed.Period})\n  Focus: ${ed.Description}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[VERIFIED CERTIFICATIONS]\n` + dataset.certificates.map(c => `- Certificate: ${c.Name} issued by ${c.Organization} on ${c.Date}`).join("\n") + "\n\n";

    dynamicSystemContext += `[FREQUENTLY ASKED QUESTIONS]\n` + dataset.faq.map(item => `- Question: ${item.Question}\n  Answer: ${item.Answer}\n  Category: ${item.Category}`).join("\n") + "\n\n";

    dynamicSystemContext += `[REVIEWED PORTFOLIO KNOWLEDGE]\n` + privateAiContext.knowledge.map(item => `- Type: ${item.type}\n  Title: ${item.title}\n  Content: ${item.content}`).join("\n") + "\n\n";
    
    // ২. Groq API-র কাছে পে-লোড ট্রান্সমিশন
    const url = "https://api.groq.com/openai/v1/chat/completions";
    const payload = {
      model: MASTER_CONFIG.groqModel,
      messages: [
        { role: "system", content: dynamicSystemContext },
        { role: "user", content: userMessage }
      ],
      temperature: 0.15, // ফ্যান্টাসি কমাতে এবং টেকনিক্যাল অ্যাকুরেসি হাই রাখতে টেম্পারেচার লো
      max_completion_tokens: 500
    };
    
    const options = {
      method: "post",
      headers: {
        "Authorization": "Bearer " + getSecret_("GROQ_API_KEY"),
        "Content-Type": "application/json"
      },
      payload: JSON.stringify(payload),
      muteHttpExceptions: true
    };
    
    const response = UrlFetchApp.fetch(url, options);
    const statusCode = response.getResponseCode();
    const resText = response.getContentText();
    let resJson;

    try {
      resJson = JSON.parse(resText);
    } catch (parseError) {
      console.error("Groq API returned invalid JSON with status " + statusCode);
      return { success: false, reply: "AI service returned an invalid response. Please try again later." };
    }

    if (statusCode < 200 || statusCode >= 300 || resJson.error) {
      const errorMessage = resJson.error && resJson.error.message
        ? resJson.error.message
        : "Request failed with HTTP status " + statusCode + ".";
      console.error("Groq API request failed with status " + statusCode + ": " + errorMessage);
      return { success: false, reply: "AI service is temporarily unavailable. Please try again later." };
    }
    
    if (resJson.choices && resJson.choices[0] && resJson.choices[0].message && resJson.choices[0].message.content) {
      return { success: true, reply: resJson.choices[0].message.content };
    } else {
      return { success: false, reply: "AI service returned an empty response. Please try again later." };
    }
  } catch (err) {
    logSafeError_("CHAT_PIPELINE_FAILED", err);
    return { success: false, reply: "Chat is temporarily unavailable. Please try again later." };
  }
}

// ==========================================
// DATA LOGGER & FORM SUBMISSION INTAKE
// ==========================================
function processFormSubmission(formData) {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  let sheet = ss.getSheetByName(MASTER_CONFIG.tabs.submissions);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_CONFIG.tabs.submissions);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Subject', 'Message', 'Status', 'SubmissionID']);
  }
  
  const submissionId = Utilities.getUuid();
  const timestamp = new Date();
  
  sheet.appendRow([
    timestamp,
    safeSheetText_(formData.name),
    safeSheetText_(formData.email),
    safeSheetText_(formData.subject || "General Inquiry"),
    safeSheetText_(formData.message),
    "NEW",
    submissionId
  ]);
  
  try { triggerAdminMailAlert(formData, timestamp, submissionId); } catch(e) {}
  try { triggerAutoConfirmationResponse(formData); } catch(e) {}
  
  return { success: true, message: "Your message was received.", submissionId: submissionId };
}

function triggerAdminMailAlert(f, t, id) {
  const body = `<h3>New Contact Pipeline Entry</h3><b>Name:</b> ${escapeHtmlServer_(f.name)}<br><b>Email:</b> ${escapeHtmlServer_(f.email)}<br><b>Subject:</b> ${escapeHtmlServer_(f.subject)}<br><b>Message:</b><br>${escapeHtmlServer_(f.message).replace(/\n/g, "<br>")}<br><br><small>Token ID: ${escapeHtmlServer_(id)}</small>`;
  MailApp.sendEmail({ to: MASTER_CONFIG.adminEmail, subject: `Portfolio Core Pipeline: ${f.subject || 'General'}`, htmlBody: body });
}

function triggerAutoConfirmationResponse(f) {
  const body = `<p>Hello ${escapeHtmlServer_(f.name)},</p><p>Thank you for reaching out. I have received your message regarding "${escapeHtmlServer_(f.subject || 'General Inquiry')}". I will get back to you as soon as possible.</p><br><p>Best Regards,<br>Md. Masum Billah</p>`;
  MailApp.sendEmail({ to: f.email, subject: "Secure Notification Confirmation - Md. Masum Billah", htmlBody: body });
}

function logVisitorStream(e, action) {
  if (!e) return;
  const normalizedAction = String(action || "health").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "health";
  if (normalizedAction === "health") return;
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  let sheet = ss.getSheetByName(MASTER_CONFIG.tabs.visitorLog);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_CONFIG.tabs.visitorLog);
    sheet.appendRow(['Timestamp', 'VisitorID', 'Page', 'Referrer', 'ScreenSize', 'UserAgent', 'TimeSpent']);
  }
  const params = e.parameter || {};
  const visitorId = params.clientId ? hashIdentifier_(params.clientId) : "anonymous";
  const page = String(params.view || normalizedAction).slice(0, 100);
  sheet.appendRow([new Date(), visitorId, page, "", "", "", ""]);
}

function validateChatMessage_(value) {
  const message = String(value || "").trim();
  if (!message) throw createPublicError_("EMPTY_MESSAGE", "Please enter a message.");
  if (message.length > MASTER_CONFIG.limits.chatMessage) {
    throw createPublicError_("MESSAGE_TOO_LONG", "The message is too long.");
  }
  return message;
}

function validateContactPayload_(payload) {
  const input = payload || {};
  const result = {
    name: String(input.name || "").trim(),
    email: String(input.email || "").trim().toLowerCase(),
    subject: String(input.subject || "General Inquiry").trim(),
    message: String(input.message || "").trim()
  };
  if (!result.name || !result.email || !result.message) {
    throw createPublicError_("INVALID_CONTACT", "Name, email, and message are required.");
  }
  if (result.name.length > MASTER_CONFIG.limits.contactName ||
      result.email.length > MASTER_CONFIG.limits.contactEmail ||
      result.subject.length > MASTER_CONFIG.limits.contactSubject ||
      result.message.length > MASTER_CONFIG.limits.contactMessage) {
    throw createPublicError_("CONTACT_TOO_LONG", "One or more contact fields are too long.");
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(result.email)) {
    throw createPublicError_("INVALID_EMAIL", "Enter a valid email address.");
  }
  if (/\r|\n/.test(result.email) || /\r|\n/.test(result.subject)) {
    throw createPublicError_("INVALID_CONTACT", "The contact request contains invalid characters.");
  }
  return result;
}

function enforceRateLimit_(scope, identifier, limit, windowSeconds) {
  const cache = CacheService.getScriptCache();
  const lock = LockService.getScriptLock();
  const key = "rate:" + scope + ":" + hashIdentifier_(identifier || "global");
  lock.waitLock(3000);
  try {
    const count = Number(cache.get(key) || 0);
    if (count >= limit) throw createPublicError_("RATE_LIMITED", "Too many requests. Please try again later.");
    cache.put(key, String(count + 1), windowSeconds);
  } finally {
    lock.releaseLock();
  }
}

function hashIdentifier_(value) {
  const bytes = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(value || "anonymous"), Utilities.Charset.UTF_8);
  return bytes.slice(0, 8).map(byte => ("0" + ((byte < 0 ? byte + 256 : byte).toString(16))).slice(-2)).join("");
}

function safeSheetText_(value) {
  const text = String(value || "");
  return /^[=+\-@]/.test(text) ? "'" + text : text;
}

function escapeHtmlServer_(value) {
  return String(value || "").replace(/[&<>"']/g, character => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}
