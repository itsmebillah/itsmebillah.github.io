const fs = require("fs");
const path = require("path");
const { normalizeSlug } = require("./seo-helpers");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SITE_URL = "https://itsmebillah.github.io";
const OUTPUT_FILE = path.join(ROOT_DIR, "rss.xml");
const CONFIG_FILE = path.join(ROOT_DIR, "assets", "js", "config.js");
const FEED_CONFIG = {
    title: "Md Masum Billah Portfolio Blog",
    description: "Latest portfolio articles, case studies, and business intelligence insights by Md. Masum Billah.",
    language: "en",
    managingEditor: "Md. Masum Billah",
    webMaster: "Md. Masum Billah",
    ttl: 60
};

function readApiUrl() {
    const config = fs.readFileSync(CONFIG_FILE, "utf8");
    const match = config.match(/GAS_API_URL\s*=\s*['"]([^'"]+)['"]/);
    if (!match) throw new Error("GAS_API_URL could not be found in assets/js/config.js");
    return match[1];
}

function xmlEscape(value) {
    return String(value ?? "").replace(/[<>&'"]/g, char => ({
        "<": "&lt;",
        ">": "&gt;",
        "&": "&amp;",
        "'": "&apos;",
        '"': "&quot;"
    })[char]);
}

function stripHtml(value) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function cdata(value) {
    return `<![CDATA[${String(value ?? "").replace(/\]\]>/g, "]]]]><![CDATA[>")}]]>`;
}

function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
}

function isPublished(blog) {
    if (!Object.prototype.hasOwnProperty.call(blog, "Published")) return true;
    const status = String(blog.Published).trim().toUpperCase();
    return blog.Published === true || status === "TRUE" || status === "1";
}

function parseDate(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
}

function pubDate(value) {
    const parsed = parseDate(value);
    return (parsed || new Date()).toUTCString();
}

function blogUrl(slug) {
    return `${SITE_URL.replace(/\/$/, "")}/blog/${slug}/`;
}

function descriptionFor(blog) {
    const description = normalizeText(blog.Description || blog.description);
    if (description) return description;

    const contentExcerpt = stripHtml(blog.Content || blog.content).slice(0, 280).trim();
    return contentExcerpt || "Read the latest blog article by Md. Masum Billah.";
}

function contentFor(blog) {
    const content = String(blog.Content || blog.content || "").trim();
    if (content) return content;
    return descriptionFor(blog);
}

function toRssItem(blog, slug) {
    const link = blogUrl(slug);
    const title = normalizeText(blog.Title || blog.title || "Untitled Article");
    const author = normalizeText(blog.Author || blog.author || FEED_CONFIG.managingEditor);
    const category = normalizeText(blog.Category || blog.category || "Blog");
    const thumbnail = normalizeText(blog.Thumbnail || blog.thumbnail);

    return {
        title,
        description: descriptionFor(blog),
        link,
        guid: link,
        pubDate: pubDate(blog.Date || blog.date || blog.publishDate),
        dateValue: parseDate(blog.Date || blog.date || blog.publishDate) || new Date(0),
        author,
        category,
        content: contentFor(blog),
        thumbnail
    };
}

function buildRssItems(blogs = [], report = {}) {
    const duplicateSlugCandidates = new Map();
    const duplicateGuidCandidates = new Map();
    const publishedBlogs = blogs.filter(isPublished);

    publishedBlogs.forEach(blog => {
        const slug = normalizeSlug(blog.Slug || blog.slug);
        if (!slug) {
            report.invalidSlugs.push(blog.Title || "(untitled)");
            return;
        }

        const guid = blogUrl(slug);
        duplicateSlugCandidates.set(slug, (duplicateSlugCandidates.get(slug) || 0) + 1);
        duplicateGuidCandidates.set(guid, (duplicateGuidCandidates.get(guid) || 0) + 1);
    });

    const duplicateSlugs = [...duplicateSlugCandidates.entries()]
        .filter(([, count]) => count > 1)
        .map(([slug]) => slug);
    const duplicateGuids = [...duplicateGuidCandidates.entries()]
        .filter(([, count]) => count > 1)
        .map(([guid]) => guid);

    report.duplicateSlugs.push(...duplicateSlugs);
    report.duplicateGuids.push(...duplicateGuids);

    return publishedBlogs
        .map(blog => {
            const slug = normalizeSlug(blog.Slug || blog.slug);
            if (!slug || duplicateSlugs.includes(slug)) return null;
            return toRssItem(blog, slug);
        })
        .filter(Boolean)
        .sort((a, b) => b.dateValue.getTime() - a.dateValue.getTime());
}

function renderRssItem(item) {
    const lines = [
        "    <item>",
        `      <title>${xmlEscape(item.title)}</title>`,
        `      <description>${cdata(item.description)}</description>`,
        `      <link>${xmlEscape(item.link)}</link>`,
        `      <guid isPermaLink="true">${xmlEscape(item.guid)}</guid>`,
        `      <pubDate>${xmlEscape(item.pubDate)}</pubDate>`,
        `      <author>${xmlEscape(item.author)}</author>`,
        `      <category>${xmlEscape(item.category)}</category>`,
        `      <content:encoded>${cdata(item.content)}</content:encoded>`
    ];

    if (item.thumbnail) {
        lines.push(`      <media:content url="${xmlEscape(item.thumbnail)}" medium="image" />`);
    }

    lines.push("    </item>");
    return lines.join("\n");
}

function renderRss(items, options = {}) {
    const config = { ...FEED_CONFIG, ...options };
    const now = new Date().toUTCString();

    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<rss version="2.0"',
        '  xmlns:content="http://purl.org/rss/1.0/modules/content/"',
        '  xmlns:media="http://search.yahoo.com/mrss/"',
        '  xmlns:atom="http://www.w3.org/2005/Atom">',
        "  <channel>",
        `    <title>${xmlEscape(config.title)}</title>`,
        `    <description>${xmlEscape(config.description)}</description>`,
        `    <link>${xmlEscape(SITE_URL.replace(/\/$/, ""))}/</link>`,
        `    <atom:link href="${xmlEscape(SITE_URL.replace(/\/$/, ""))}/rss.xml" rel="self" type="application/rss+xml" />`,
        `    <language>${xmlEscape(config.language)}</language>`,
        `    <lastBuildDate>${xmlEscape(now)}</lastBuildDate>`,
        `    <pubDate>${xmlEscape(items[0] ? items[0].pubDate : now)}</pubDate>`,
        `    <managingEditor>${xmlEscape(config.managingEditor)}</managingEditor>`,
        `    <webMaster>${xmlEscape(config.webMaster)}</webMaster>`,
        `    <ttl>${xmlEscape(config.ttl)}</ttl>`,
        items.map(renderRssItem).join("\n"),
        "  </channel>",
        "</rss>",
        ""
    ].join("\n");
}

function validateRss(xml, items = []) {
    if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
        throw new Error("RSS must start with a UTF-8 XML declaration.");
    }
    if (!xml.includes('<rss version="2.0"') || !xml.includes("</rss>")) {
        throw new Error("RSS 2.0 root element is missing.");
    }
    if (!xml.includes("<channel>") || !xml.includes("</channel>")) {
        throw new Error("RSS channel is missing.");
    }
    if ((xml.match(/<item>/g) || []).length !== items.length) {
        throw new Error("RSS item count does not match generated items.");
    }
    if (new Set(items.map(item => item.guid)).size !== items.length) {
        throw new Error("RSS contains duplicate GUIDs.");
    }
}

async function fetchBlogs() {
    const apiUrl = readApiUrl();
    const response = await fetch(`${apiUrl}?action=getAllData`);
    if (!response.ok) throw new Error(`Apps Script API request failed with status ${response.status}`);
    const result = await response.json();
    const payload = result.data || result;
    return Array.isArray(payload.blogs) ? payload.blogs : [];
}

async function generateRssFeed() {
    const report = {
        generatedAt: new Date().toISOString(),
        output: "rss.xml",
        includedItems: [],
        duplicateSlugs: [],
        duplicateGuids: [],
        invalidSlugs: [],
        futureFeeds: ["Atom Feed", "Podcast Feed", "Category Feeds", "Tag Feeds", "Author Feeds"]
    };

    const blogs = await fetchBlogs();
    const items = buildRssItems(blogs, report);
    const xml = renderRss(items);
    validateRss(xml, items);

    report.includedItems = items.map(item => item.link);
    fs.writeFileSync(OUTPUT_FILE, xml, "utf8");
    return report;
}

if (require.main === module) {
    generateRssFeed()
        .then(report => {
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    FEED_CONFIG,
    buildRssItems,
    renderRss,
    renderRssItem,
    validateRss,
    generateRssFeed,
    xmlEscape
};
