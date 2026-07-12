const fs = require("fs");
const path = require("path");
const { normalizeSlug } = require("./seo-helpers");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SITE_URL = "https://itsmebillah.github.io";
const OUTPUT_FILE = path.join(ROOT_DIR, "search-index.json");
const CONFIG_FILE = path.join(ROOT_DIR, "assets", "js", "config.js");

function readApiUrl() {
    const config = fs.readFileSync(CONFIG_FILE, "utf8");
    const match = config.match(/GAS_API_URL\s*=\s*['"]([^'"]+)['"]/);
    if (!match) throw new Error("GAS_API_URL could not be found in assets/js/config.js");
    return match[1];
}

function normalizeText(value) {
    return String(value ?? "")
        .replace(/<[^>]+>/g, " ")
        .normalize("NFKD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/\s+/g, " ")
        .trim();
}

function normalizeSearchText(value) {
    return normalizeText(value).toLowerCase();
}

function splitList(value) {
    if (Array.isArray(value)) return value.map(item => normalizeText(item)).filter(Boolean);
    return String(value || "").split(",").map(item => normalizeText(item)).filter(Boolean);
}

function isPublished(record) {
    if (!Object.prototype.hasOwnProperty.call(record, "Published")) return true;
    const status = String(record.Published).trim().toUpperCase();
    return record.Published === true || status === "TRUE" || status === "1";
}

function compactRecord(record) {
    return Object.fromEntries(Object.entries(record).filter(([, value]) => {
        if (Array.isArray(value)) return value.length > 0;
        return String(value ?? "").trim() !== "";
    }));
}

function makeUrl(pathname) {
    const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return new URL(cleanPath, SITE_URL).href;
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}: ${url}`);
    const result = await response.json();
    return typeof result === "string" ? JSON.parse(result) : result;
}

async function fetchPortfolioData() {
    const apiUrl = readApiUrl();
    const result = await fetchJson(`${apiUrl}?action=getAllData`);
    return result.data || result;
}

async function fetchBlogContent(blog) {
    const apiUrl = readApiUrl();
    const params = new URLSearchParams({ action: "getBlog" });
    const docId = blog.DocID || blog.GoogleDocID || blog.docId || blog.googleDocId;
    const slug = blog.Slug || blog.slug;
    const title = blog.Title || blog.title;

    if (docId) params.set("docId", docId);
    if (slug) params.set("slug", slug);
    if (title) params.set("title", title);
    if (!docId && !slug && !title) return "";

    try {
        const result = await fetchJson(`${apiUrl}?${params.toString()}`);
        return result && result.success && result.content ? result.content : "";
    } catch (error) {
        return "";
    }
}

function addRecord(records, seenIds, report, record) {
    if (!record.id || seenIds.has(record.id)) {
        report.duplicates.push(record.id || "(missing id)");
        return;
    }

    seenIds.add(record.id);
    records.push(compactRecord(record));
}

async function buildBlogRecords(blogs = [], report) {
    const records = [];
    const seenSlugs = new Map();
    const publishedBlogs = blogs.filter(isPublished);

    publishedBlogs.forEach(blog => {
        const slug = normalizeSlug(blog.Slug || blog.slug || blog.Title || blog.title);
        if (!slug) {
            report.invalid.blogs.push(blog.Title || "(untitled)");
            return;
        }
        seenSlugs.set(slug, (seenSlugs.get(slug) || 0) + 1);
    });

    const duplicateSlugs = [...seenSlugs.entries()]
        .filter(([, count]) => count > 1)
        .map(([slug]) => slug);
    report.duplicateSlugs.push(...duplicateSlugs);

    for (const blog of publishedBlogs) {
        const slug = normalizeSlug(blog.Slug || blog.slug || blog.Title || blog.title);
        if (!slug || duplicateSlugs.includes(slug)) continue;

        const content = normalizeText(blog.Content || blog.content || await fetchBlogContent(blog));
        records.push({
            type: "blog",
            id: `blog:${slug}`,
            url: makeUrl(`/blog/${slug}/`),
            title: normalizeText(blog.Title || blog.title),
            description: normalizeText(blog.Description || blog.description),
            content,
            keywords: splitList(blog.Keywords || blog.keywords),
            category: normalizeText(blog.Category || blog.category)
        });
    }

    return records;
}

function buildProjectRecords(projects = []) {
    return projects.filter(isPublished).map(project => {
        const title = normalizeText(project.Title || project.Name || project.title || project.name);
        const technologies = splitList(project.Technologies || project.Tags || project.technologies || project.tags);
        const idSource = normalizeSlug(project.Slug || title || project.LiveURL || project.GitHubURL);

        return {
            type: "project",
            id: `project:${idSource || normalizeSearchText(title)}`,
            url: normalizeText(project.LiveURL || project.GitHubURL || "#projects"),
            title,
            description: normalizeText(project.Description || project.description),
            technologies
        };
    });
}

function buildCertificateRecords(certificates = []) {
    return certificates.filter(isPublished).map(certificate => {
        const title = normalizeText(certificate.Title || certificate.Name || certificate.title || certificate.name);
        const issuer = normalizeText(certificate.Issuer || certificate.Organization || certificate.issuer || certificate.organization);
        const skills = splitList(certificate.Skills || certificate.skills);
        const idSource = normalizeSlug(certificate.Slug || `${title}-${issuer}` || certificate.VerifyURL);

        return {
            type: "certificate",
            id: `certificate:${idSource || normalizeSearchText(title)}`,
            url: normalizeText(certificate.VerifyURL || "#certifications"),
            title,
            issuer,
            skills
        };
    });
}

function buildExperienceRecords(experience = []) {
    return experience.map(item => {
        const title = normalizeText(item.Title || item.title);
        const company = normalizeText(item.Company || item.company);
        const idSource = normalizeSlug(`${title}-${company}-${item.Period || ""}`);

        return {
            type: "experience",
            id: `experience:${idSource || normalizeSearchText(title)}`,
            url: "#experience",
            title,
            organization: company,
            description: normalizeText(item.Description || item.description)
        };
    });
}

function buildSkillRecords(skills = []) {
    return skills.map(skill => {
        const title = normalizeText(skill.Title || skill.Name || skill.title || skill.name);
        const category = normalizeText(skill.Category || skill.category);
        const idSource = normalizeSlug(`${title}-${category}`);

        return {
            type: "skill",
            id: `skill:${idSource || normalizeSearchText(title)}`,
            url: "#skills",
            title,
            category
        };
    });
}

function validateSearchIndex(index) {
    if (!index || !Array.isArray(index.items)) throw new Error("Search index must contain an items array.");
    const ids = new Set();
    index.items.forEach(item => {
        if (!item.type || !item.id || !item.title) {
            throw new Error(`Search index item is missing required fields: ${JSON.stringify(item)}`);
        }
        if (ids.has(item.id)) throw new Error(`Duplicate search index id detected: ${item.id}`);
        ids.add(item.id);
    });
}

async function generateSearchIndex() {
    const report = {
        generatedAt: new Date().toISOString(),
        output: "search-index.json",
        counts: {},
        duplicates: [],
        duplicateSlugs: [],
        invalid: {
            blogs: []
        }
    };
    const payload = await fetchPortfolioData();
    const seenIds = new Set();
    const items = [];

    [
        ...(await buildBlogRecords(payload.blogs || [], report)),
        ...buildProjectRecords(payload.projects || []),
        ...buildCertificateRecords(payload.certificates || []),
        ...buildExperienceRecords(payload.experience || []),
        ...buildSkillRecords(payload.skills || [])
    ].forEach(record => addRecord(items, seenIds, report, record));

    const index = {
        version: 1,
        generatedAt: report.generatedAt,
        source: "Google Sheets via Apps Script",
        fields: {
            blog: ["title", "description", "content", "keywords", "category"],
            project: ["title", "description", "technologies"],
            certificate: ["title", "issuer", "skills"],
            experience: ["title", "organization", "description"],
            skill: ["title", "category"]
        },
        items
    };

    validateSearchIndex(index);
    fs.writeFileSync(OUTPUT_FILE, `${JSON.stringify(index, null, 2)}\n`, "utf8");

    report.counts = items.reduce((counts, item) => {
        counts[item.type] = (counts[item.type] || 0) + 1;
        return counts;
    }, {});

    return report;
}

if (require.main === module) {
    generateSearchIndex()
        .then(report => {
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    normalizeText,
    normalizeSearchText,
    splitList,
    buildBlogRecords,
    buildProjectRecords,
    buildCertificateRecords,
    buildExperienceRecords,
    buildSkillRecords,
    validateSearchIndex,
    generateSearchIndex
};
