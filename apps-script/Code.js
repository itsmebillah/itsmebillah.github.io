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
    aiContext: "AI_CONTEXT",
    submissions: "Submissions",
    visitorLog: "VisitorLog"
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
  try { logVisitorStream(e); } catch(err) { console.error("Visitor logging bypassed", err); }
  
  const action = e && e.parameter ? e.parameter.action : null;
  
  // ফর্ম সাবমিশন যদি GET কুয়েরি দিয়ে পাঠানো হয় (CORS সেফটি বাইপাস)
  if (e && e.parameter && (e.parameter.name || e.parameter.email) && !action) {
    return handleContactFormPipeline(e.parameter);
  }
  
  switch (action) {
    case "getAllData":
      return buildSecureJsonResponse(compileAllPortfolioData());
    case "chat":
      const message = e.parameter.message || "";
      return buildSecureJsonResponse(executeGroqAiPipeline(message));
    default:
      return buildSecureJsonResponse({
        success: true,
        message: "Portfolio Data Engine Core is Live.",
        endpoints: ["?action=getAllData", "?action=chat&message=hello"]
      });
  }
}

function doPost(e) {
  try {
    let payload;
    if (e.postData && e.postData.type === "application/json") {
      payload = JSON.parse(e.postData.contents);
    } else {
      payload = e.parameter;
    }
    
    if (payload.action === "chat" && payload.message) {
      return buildSecureJsonResponse(executeGroqAiPipeline(payload.message));
    }
    
    return buildSecureJsonResponse(processFormSubmission(payload));
  } catch (error) {
    return buildSecureJsonResponse({ success: false, message: "POST Error: " + error.toString() });
  }
}

function handleContactFormPipeline(params) {
  try {
    const result = processFormSubmission(params);
    return buildSecureJsonResponse({ success: true, message: "Message transmitted successfully!", submissionId: result.submissionId });
  } catch (error) {
    return buildSecureJsonResponse({ success: false, message: error.toString() });
  }
}

function buildSecureJsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
                       .setMimeType(ContentService.MimeType.JSON);
}

// ==========================================
// DATA EXTRACTOR & SCHEMA PARSER ENGINE
// ==========================================
function compileAllPortfolioData() {
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  
  return {
    success: true,
    timestamp: new Date().toISOString(),
    data: {
      profile: parseProfileSheet(ss),
      config: parseKeyValueSheet(ss, MASTER_CONFIG.tabs.config),
      skills: parseTableSheet(ss, MASTER_CONFIG.tabs.skills),
      projects: parseTableSheet(ss, MASTER_CONFIG.tabs.projects, true), // Published Filtering Active
      experience: parseTableSheet(ss, MASTER_CONFIG.tabs.experience),
      education: parseTableSheet(ss, MASTER_CONFIG.tabs.education),
      certificates: parseTableSheet(ss, MASTER_CONFIG.tabs.certificates, true),
      blogs: extractDynamicBlogsWithDocs(ss),
      faq: parseTableSheet(ss, MASTER_CONFIG.tabs.faq),
      aiContext: parseTableSheet(ss, MASTER_CONFIG.tabs.aiContext)
    }
  };
}

// ১. Profile শিট পার্সার (Horizontal Single-Row Data)
function parseProfileSheet(ss) {
  const sheet = ss.getSheetByName(MASTER_CONFIG.tabs.profile);
  if (!sheet) return {};
  const values = sheet.getDataRange().getValues();
  if (values.length <= 1) return {};
  
  const headers = values[0].map(h => h.toString().trim());
  const rowData = values[1];
  const profileObj = {};
  
  headers.forEach((header, idx) => {
    profileObj[header] = rowData[idx];
  });
  return profileObj;
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
  const rawBlogs = parseTableSheet(ss, MASTER_CONFIG.tabs.blogs, true);
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
    blog.Content = content;
    blog.ReadTime = Math.ceil((content.length || 1) / 1000) + 1;
    return blog;
  });
}

// ==========================================
// INTELLIGENT AI CORE - GROQ API PIPELINE
// ==========================================
function executeGroqAiPipeline(userMessage) {
  if (!userMessage) return { success: false, reply: "Message token stream remains empty." };
  
  try {
    const dataset = compileAllPortfolioData().data;
    const prof = dataset.profile;
    
    // ১. আপনার দেওয়া প্রম্পট স্ট্রাকচার অনুযায়ী Live Unified Context স্ট্রিং বিল্ড
    let dynamicSystemContext = `You are the exclusive AI Knowledge Agent for ${prof.Name || "Md. Masum Billah"}. You must answer questions accurately, professionally, and strictly based ONLY on the context provided below. If the answer cannot be confidently deduced from the data, state that you do not possess that data and politely ask them to drop a message or contact directly via ${prof.Email || "itsmbillah@gmail.com"}.\n\n`;
    
    dynamicSystemContext += `[CORE IDENTITIES]\nName: ${prof.Name}\nTitle: ${prof.Title}\nBio: ${prof.Bio}\nLocation: ${prof.Location}\nEmail: ${prof.Email}\nPhone: ${prof.Phone}\nLinkedIn: ${prof.LinkedIn}\nGitHub: ${prof.GitHub}\n\n`;
    
    dynamicSystemContext += `[TECHNICAL CAPABILITIES]\n` + dataset.skills.map(s => `- ${s.Name}: ${s.Level}% expertise in ${s.Category} (Order: ${s.Order})`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[ENGINEERING PROJECTS]\n` + dataset.projects.map(p => `- Project Name: ${p.Name}\n  Description: ${p.Description}\n  Technologies: ${p.Tags}\n  Live Deployment: ${p.LiveURL}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[PROFESSIONAL EXPERIENCES]\n` + dataset.experience.map(e => `- Role: ${e.Title} at ${e.Company} (${e.Period})\n  Deliverables: ${e.Description}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[ACADEMIC CREDENTIALS]\n` + dataset.education.map(ed => `- Qualification: ${ed.Degree} from ${ed.Institution} (${ed.Period})\n  Focus: ${ed.Description}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[VERIFIED CERTIFICATIONS]\n` + dataset.certificates.map(c => `- Certificate: ${c.Name} issued by ${c.Organization} on ${c.Date}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[KNOWLEDGE FAQS]\n` + dataset.faq.map(f => `Question: ${f.Question}\nAnswer: ${f.Answer}`).join("\n") + "\n\n";
    
    dynamicSystemContext += `[STRATEGIC DIRECTIONS & VISION]\n` + dataset.aiContext.map(ai => `### Section: ${ai.Section}\nContent: ${ai.Content}`).join("\n") + "\n\n";

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
      return { success: false, reply: "AI service returned an invalid response. Please try again later.", raw: resText };
    }

    if (statusCode < 200 || statusCode >= 300 || resJson.error) {
      const errorMessage = resJson.error && resJson.error.message
        ? resJson.error.message
        : "Request failed with HTTP status " + statusCode + ".";
      console.error("Groq API request failed with status " + statusCode + ": " + errorMessage);
      return { success: false, reply: "AI service request failed: " + errorMessage, raw: resText };
    }
    
    if (resJson.choices && resJson.choices[0] && resJson.choices[0].message && resJson.choices[0].message.content) {
      return { success: true, reply: resJson.choices[0].message.content };
    } else {
      return { success: false, reply: "AI service returned an empty response. Please try again later.", raw: resText };
    }
  } catch (err) {
    return { success: false, reply: "Data connection pipeline timed out: " + err.toString() };
  }
}

// ==========================================
// DATA LOGGER & FORM SUBMISSION INTAKE
// ==========================================
function processFormSubmission(formData) {
  if (!formData.name || !formData.email || !formData.message) {
    throw new Error("Missing structural payload tokens (Name, Email, Message).");
  }
  
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  let sheet = ss.getSheetByName(MASTER_CONFIG.tabs.submissions);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_CONFIG.tabs.submissions);
    sheet.appendRow(['Timestamp', 'Name', 'Email', 'Subject', 'Message', 'Submission ID']);
  }
  
  const submissionId = Utilities.getUuid();
  const timestamp = new Date();
  
  sheet.appendRow([timestamp, formData.name, formData.email, formData.subject || "General Inquiry", formData.message, submissionId]);
  
  try { triggerAdminMailAlert(formData, timestamp, submissionId); } catch(e) {}
  try { triggerAutoConfirmationResponse(formData); } catch(e) {}
  
  return { submissionId: submissionId };
}

function triggerAdminMailAlert(f, t, id) {
  const body = `<h3>New Contact Pipeline Entry</h3><b>Name:</b> ${f.name}<br><b>Email:</b> ${f.email}<br><b>Subject:</b> ${f.subject}<br><b>Message:</b><br>${f.message}<br><br><small>Token ID: ${id}</small>`;
  MailApp.sendEmail({ to: MASTER_CONFIG.adminEmail, subject: `Portfolio Core Pipeline: ${f.subject || 'General'}`, htmlBody: body });
}

function triggerAutoConfirmationResponse(f) {
  const body = `<p>Hello ${f.name},</p><p>Thank you for reaching out. I have received your message regarding "${f.subject || 'General Inquiry'}". My automated data orchestrator has queued your request, and I will get back to you within 24 hours.</p><br><p>Best Regards,<br>Md. Masum Billah</p>`;
  MailApp.sendEmail({ to: f.email, subject: "Secure Notification Confirmation - Md. Masum Billah", htmlBody: body });
}

function logVisitorStream(e) {
  if (!e) return;
  const ss = SpreadsheetApp.openById(MASTER_CONFIG.sheetId);
  let sheet = ss.getSheetByName(MASTER_CONFIG.tabs.visitorLog);
  if (!sheet) {
    sheet = ss.insertSheet(MASTER_CONFIG.tabs.visitorLog);
    sheet.appendRow(['Timestamp', 'ViewParameter', 'ParametersJson']);
  }
  sheet.appendRow([new Date(), e.parameter.view || "Home", JSON.stringify(e.parameter)]);
}
