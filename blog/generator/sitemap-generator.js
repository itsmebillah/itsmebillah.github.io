const fs = require("fs");
const path = require("path");
const { normalizeSlug } = require("./seo-helpers");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const SITE_URL = "https://itsmebillah.github.io";
const OUTPUT_FILE = path.join(ROOT_DIR, "sitemap.xml");
const CONFIG_FILE = path.join(ROOT_DIR, "assets", "js", "config.js");

const PRIORITY = {
    home: "1.0",
    blogIndex: "0.9",
    blogArticle: "0.8",
    project: "0.8",
    certificate: "0.7",
    other: "0.6"
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

function todayIsoDate() {
    return new Date().toISOString().slice(0, 10);
}

function normalizeDate(value) {
    if (!value) return todayIsoDate();
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) return parsed.toISOString().slice(0, 10);
    return todayIsoDate();
}

function fileExists(relativePath) {
    return fs.existsSync(path.join(ROOT_DIR, relativePath));
}

function makeUrl(pathname) {
    const cleanPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
    return new URL(cleanPath, SITE_URL).href;
}

function isValidSiteUrl(url) {
    try {
        const parsed = new URL(url);
        return parsed.origin === SITE_URL && parsed.protocol === "https:";
    } catch (error) {
        return false;
    }
}

function addEntry(entries, seenUrls, report, entry) {
    if (!entry.loc || !isValidSiteUrl(entry.loc)) {
        report.invalidUrls.push(entry.loc || "(empty)");
        return;
    }

    if (seenUrls.has(entry.loc)) {
        report.duplicateUrls.push(entry.loc);
        return;
    }

    seenUrls.add(entry.loc);
    entries.push(entry);
}

function discoverStaticEntries() {
    const entries = [];
    entries.push({
        loc: makeUrl("/"),
        lastmod: normalizeDate(fs.statSync(path.join(ROOT_DIR, "index.html")).mtime),
        changefreq: "weekly",
        priority: PRIORITY.home,
        image: {
            loc: "https://i.postimg.cc/26DtqzQr/1777886932477.jpg",
            title: "Md Masum Billah",
            caption: "Portrait of Md Masum Billah"
        }
    });

    if (fileExists("blog/index.html")) {
        entries.push({
            loc: makeUrl("/blog/"),
            lastmod: normalizeDate(fs.statSync(path.join(ROOT_DIR, "blog", "index.html")).mtime),
            changefreq: "weekly",
            priority: PRIORITY.blogIndex
        });
    }

    return entries;
}

function discoverFutureSectionEntries(section, priority) {
    const sectionDir = path.join(ROOT_DIR, section);
    if (!fs.existsSync(sectionDir)) return [];

    return fs.readdirSync(sectionDir, { withFileTypes: true })
        .filter(dirent => dirent.isDirectory())
        .map(dirent => {
            const indexPath = path.join(sectionDir, dirent.name, "index.html");
            if (!fs.existsSync(indexPath)) return null;
            return {
                loc: makeUrl(`/${section}/${dirent.name}/`),
                lastmod: normalizeDate(fs.statSync(indexPath).mtime),
                changefreq: "monthly",
                priority
            };
        })
        .filter(Boolean);
}

async function fetchPublishedBlogs() {
    const apiUrl = readApiUrl();
    const response = await fetch(`${apiUrl}?action=getAllData`);
    if (!response.ok) throw new Error(`Apps Script API request failed with status ${response.status}`);
    const result = await response.json();
    const payload = result.data || result;
    return Array.isArray(payload.blogs) ? payload.blogs : [];
}

function buildBlogEntries(blogs, report) {
    const slugCounts = new Map();
    const publishedBlogs = blogs.filter(blog => {
        if (!Object.prototype.hasOwnProperty.call(blog, "Published")) return true;
        const status = String(blog.Published).trim().toUpperCase();
        return blog.Published === true || status === "TRUE" || status === "1";
    });

    publishedBlogs.forEach(blog => {
        const slug = normalizeSlug(blog.Slug || blog.slug);
        if (!slug) {
            report.invalidSlugs.push(blog.Title || "(untitled)");
            return;
        }
        slugCounts.set(slug, (slugCounts.get(slug) || 0) + 1);
    });

    const duplicateSlugs = [...slugCounts.entries()]
        .filter(([, count]) => count > 1)
        .map(([slug]) => slug);
    report.duplicateSlugs.push(...duplicateSlugs);

    return publishedBlogs.map(blog => {
        const slug = normalizeSlug(blog.Slug || blog.slug);
        if (!slug || duplicateSlugs.includes(slug)) return null;

        const outputPath = path.join("blog", slug, "index.html");
        if (!fileExists(outputPath)) {
            report.skippedUnbuiltBlogs.push({
                title: blog.Title || "",
                slug,
                expectedOutput: outputPath,
                expectedUrl: makeUrl(`/blog/${slug}/`)
            });
            return null;
        }

        const indexPath = path.join(ROOT_DIR, outputPath);
        return {
            loc: makeUrl(`/blog/${slug}/`),
            lastmod: normalizeDate(blog.UpdatedAt || blog.Date || fs.statSync(indexPath).mtime),
            changefreq: "monthly",
            priority: PRIORITY.blogArticle
        };
    }).filter(Boolean);
}

function renderUrl(entry) {
    const lines = [
        "  <url>",
        `    <loc>${xmlEscape(entry.loc)}</loc>`,
        `    <lastmod>${xmlEscape(entry.lastmod)}</lastmod>`,
        `    <changefreq>${xmlEscape(entry.changefreq)}</changefreq>`,
        `    <priority>${xmlEscape(entry.priority)}</priority>`
    ];

    if (entry.image && entry.image.loc) {
        lines.push("    <image:image>");
        lines.push(`      <image:loc>${xmlEscape(entry.image.loc)}</image:loc>`);
        if (entry.image.title) lines.push(`      <image:title>${xmlEscape(entry.image.title)}</image:title>`);
        if (entry.image.caption) lines.push(`      <image:caption>${xmlEscape(entry.image.caption)}</image:caption>`);
        lines.push("    </image:image>");
    }

    lines.push("  </url>");
    return lines.join("\n");
}

function renderSitemap(entries) {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<urlset',
        '  xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"',
        '  xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"',
        '  xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"',
        '  xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">',
        entries.map(renderUrl).join("\n"),
        "</urlset>",
        ""
    ].join("\n");
}

function renderSitemapIndex(sitemaps) {
    return [
        '<?xml version="1.0" encoding="UTF-8"?>',
        '<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
        sitemaps.map(item => [
            "  <sitemap>",
            `    <loc>${xmlEscape(item.loc)}</loc>`,
            `    <lastmod>${xmlEscape(item.lastmod || todayIsoDate())}</lastmod>`,
            "  </sitemap>"
        ].join("\n")).join("\n"),
        "</sitemapindex>",
        ""
    ].join("\n");
}

function validateXml(xml) {
    if (!xml.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
        throw new Error("Sitemap must start with a UTF-8 XML declaration.");
    }
    if (!xml.includes("<urlset") || !xml.includes("</urlset>")) {
        throw new Error("Sitemap XML urlset root is missing.");
    }
    if ((xml.match(/<url>/g) || []).length !== (xml.match(/<\/url>/g) || []).length) {
        throw new Error("Sitemap XML url tags are unbalanced.");
    }
}

async function generateSitemap() {
    const report = {
        generatedAt: new Date().toISOString(),
        duplicateUrls: [],
        duplicateSlugs: [],
        invalidUrls: [],
        invalidSlugs: [],
        brokenUrls: [],
        skippedUnbuiltBlogs: [],
        includedUrls: []
    };
    const seenUrls = new Set();
    const entries = [];

    [
        ...discoverStaticEntries(),
        ...discoverFutureSectionEntries("projects", PRIORITY.project),
        ...discoverFutureSectionEntries("certificates", PRIORITY.certificate),
        ...discoverFutureSectionEntries("experience", PRIORITY.other)
    ].forEach(entry => addEntry(entries, seenUrls, report, entry));

    const blogs = await fetchPublishedBlogs();
    buildBlogEntries(blogs, report).forEach(entry => addEntry(entries, seenUrls, report, entry));

    report.includedUrls = entries.map(entry => entry.loc);
    const xml = renderSitemap(entries);
    validateXml(xml);

    fs.writeFileSync(OUTPUT_FILE, xml, "utf8");
    return report;
}

if (require.main === module) {
    generateSitemap()
        .then(report => {
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    generateSitemap,
    renderSitemap,
    renderSitemapIndex,
    validateXml,
    xmlEscape
};
