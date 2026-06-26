const fs = require("fs");
const path = require("path");
const { createTemplateEngine, escapeHtml } = require("./template-engine");
const {
    SITE_CONFIG,
    normalizeSlug,
    generatePageSeo,
    validateJsonLd,
    validateMetadata
} = require("./seo-helpers");

const ROOT_DIR = path.resolve(__dirname, "..", "..");
const CONFIG_FILE = path.join(ROOT_DIR, "assets", "js", "config.js");
const BLOG_TEMPLATE_FILE = path.join(ROOT_DIR, "blog", "templates", "blog.template.html");
const SEO_TEMPLATE_FILE = path.join(ROOT_DIR, "blog", "templates", "seo.template.html");
const MANIFEST_FILE = path.join(ROOT_DIR, "blog", "blogs-manifest.json");

function readApiUrl() {
    const config = fs.readFileSync(CONFIG_FILE, "utf8");
    const match = config.match(/GAS_API_URL\s*=\s*['"]([^'"]+)['"]/);
    if (!match) throw new Error("GAS_API_URL could not be found in assets/js/config.js");
    return match[1];
}

function readField(record, key) {
    if (!record) return "";
    if (Object.prototype.hasOwnProperty.call(record, key)) return record[key];
    const lowerKey = key.toLowerCase();
    const actualKey = Object.keys(record).find(item => item.toLowerCase() === lowerKey);
    return actualKey ? record[actualKey] : "";
}

function isPublished(blog) {
    if (!Object.prototype.hasOwnProperty.call(blog, "Published")) return true;
    const status = String(blog.Published).trim().toUpperCase();
    return blog.Published === true || status === "TRUE" || status === "1";
}

function stripHtml(value) {
    return String(value || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}

function estimateReadingTime(content) {
    const words = stripHtml(content).split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.ceil(words / 220));
}

function formatDate(value) {
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return String(value || "").trim();
    return parsed.toLocaleDateString("en", { year: "numeric", month: "long", day: "numeric" });
}

function dateIso(value) {
    const parsed = new Date(value);
    return Number.isNaN(parsed.getTime()) ? "" : parsed.toISOString().slice(0, 10);
}

function absoluteBlogUrl(slug) {
    return `${SITE_CONFIG.siteUrl.replace(/\/$/, "")}/blog/${slug}/`;
}

function sanitizeUrl(value, options = {}) {
    const url = String(value || "").trim();
    if (!url || url === "#") return url === "#" ? "#" : "";
    if (options.allowImageData && /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=]+$/i.test(url)) return url;

    try {
        const parsed = new URL(url, SITE_CONFIG.siteUrl);
        const allowed = options.image ? ["http:", "https:"] : ["http:", "https:", "mailto:", "tel:"];
        return allowed.includes(parsed.protocol) ? parsed.href : "";
    } catch (error) {
        return "";
    }
}

function sanitizeInlineStyle(value) {
    return String(value || "")
        .split(";")
        .map(rule => rule.trim())
        .filter(rule => rule && rule.includes(":"))
        .filter(rule => !/(expression\s*\(|javascript\s*:|vbscript\s*:|data\s*:|@import)/i.test(rule))
        .join("; ");
}

function sanitizeHtml(value) {
    return String(value || "")
        .replace(/<!--[\s\S]*?-->/g, "")
        .replace(/<(script|iframe|object|embed|svg|math|style|link|meta)\b[\s\S]*?<\/\1>/gi, "")
        .replace(/<(script|iframe|object|embed|svg|math|style|link|meta)\b[^>]*\/?>/gi, "")
        .replace(/\s(on[a-z]+|srcdoc)\s*=\s*(".*?"|'.*?'|[^\s>]+)/gi, "")
        .replace(/\sstyle\s*=\s*("([^"]*)"|'([^']*)')/gi, (match, quoted, doubleValue, singleValue) => {
            const safeStyle = sanitizeInlineStyle(doubleValue || singleValue || "");
            return safeStyle ? ` style="${escapeHtml(safeStyle)}"` : "";
        })
        .replace(/\shref\s*=\s*("([^"]*)"|'([^']*)')/gi, (match, quoted, doubleValue, singleValue) => {
            const safeHref = sanitizeUrl(doubleValue || singleValue || "");
            return safeHref ? ` href="${escapeHtml(safeHref)}" target="_blank" rel="noopener noreferrer"` : "";
        })
        .replace(/\ssrc\s*=\s*("([^"]*)"|'([^']*)')/gi, (match, quoted, doubleValue, singleValue) => {
            const safeSrc = sanitizeUrl(doubleValue || singleValue || "", { image: true, allowImageData: true });
            return safeSrc ? ` src="${escapeHtml(safeSrc)}" loading="lazy" decoding="async"` : "";
        });
}

function renderPlainText(value) {
    const text = String(value || "").trim();
    if (!text) return "";
    return text
        .replace(/\r\n/g, "\n")
        .split(/\n{2,}/)
        .map(paragraph => `<p>${escapeHtml(paragraph).replace(/\n/g, "<br>")}</p>`)
        .join("\n");
}

function renderMixedContent(content, description) {
    const source = String(content || description || "No content available.").trim();
    if (/<[a-z][\s\S]*>/i.test(source)) return sanitizeHtml(source);
    return renderPlainText(source);
}

async function fetchJson(url) {
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Request failed with status ${response.status}: ${url}`);
    return response.json();
}

async function fetchPortfolioData(apiUrl) {
    const result = await fetchJson(`${apiUrl}?action=getAllData`);
    return result.data || result;
}

async function fetchBlogContent(apiUrl, blog) {
    const params = new URLSearchParams({ action: "getBlog" });
    const docId = readField(blog, "DocID") || readField(blog, "GoogleDocID");
    const slug = readField(blog, "Slug");
    const title = readField(blog, "Title");

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

function buildNavigationCard(label, article) {
    if (!article) {
        return `<div class="glass rounded-2xl p-5 border border-white/5 opacity-60"><span class="text-xs uppercase tracking-wider text-gray-500">${escapeHtml(label)}</span><p class="mt-2 text-sm text-gray-400">No ${escapeHtml(label.toLowerCase())} article.</p></div>`;
    }

    return `<a class="article-card-link glass rounded-2xl p-5 border border-white/5 hover:border-orange-500/30 transition" href="../${escapeHtml(article.slug)}/">
        <span class="text-xs uppercase tracking-wider text-orange-400">${escapeHtml(label)}</span>
        <h2 class="mt-2 text-base font-bold text-white leading-snug">${escapeHtml(article.title)}</h2>
        <p class="mt-2 text-xs text-gray-400 line-clamp-2">${escapeHtml(article.description)}</p>
    </a>`;
}

function buildRelatedCard(article) {
    return `<a class="article-card-link glass rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/30 transition" href="../${escapeHtml(article.slug)}/">
        <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)} thumbnail" loading="lazy" decoding="async" width="360" height="180" class="h-32 w-full object-cover">
        <div class="p-4">
            <span class="text-[10px] font-bold uppercase tracking-wider text-orange-400">${escapeHtml(article.category || "Case Study")}</span>
            <h3 class="mt-1 text-sm font-bold text-white leading-snug">${escapeHtml(article.title)}</h3>
        </div>
    </a>`;
}

function normalizeBlog(blog, content, index) {
    const slug = normalizeSlug(readField(blog, "Slug"));
    const title = String(readField(blog, "Title") || "Untitled Article").trim();
    const description = String(readField(blog, "Description") || stripHtml(content).slice(0, 155) || "No description available.").trim();
    const category = String(readField(blog, "Category") || "Case Study").trim();
    const image = sanitizeUrl(readField(blog, "Thumbnail") || SITE_CONFIG.defaultImage, { image: true, allowImageData: true }) || SITE_CONFIG.defaultImage;
    const author = String(readField(blog, "Author") || SITE_CONFIG.author).trim();
    const date = readField(blog, "Date");

    return {
        source: blog,
        index,
        slug,
        title,
        description,
        category,
        image,
        author,
        date,
        dateTime: new Date(date).getTime() || 0,
        content: content || readField(blog, "Content") || description
    };
}

function updateManifest(pages, generatedAt) {
    const manifest = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8"));
    manifest.generatedAt = generatedAt;
    manifest.pages = pages.map(page => ({
        title: page.title,
        slug: page.slug,
        url: `/blog/${page.slug}/`,
        output: `blog/${page.slug}/index.html`,
        category: page.category,
        published: true
    }));
    fs.writeFileSync(MANIFEST_FILE, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

function ensureCleanOutputDir(slug) {
    const outputDir = path.join(ROOT_DIR, "blog", slug);
    fs.mkdirSync(outputDir, { recursive: true });
    return outputDir;
}

function buildTemplateData(article, articles, templateContent) {
    const previous = articles[article.index - 1];
    const next = articles[article.index + 1];
    const related = articles
        .filter(item => item.slug !== article.slug)
        .sort((a, b) => {
            const categoryScore = Number(b.category === article.category) - Number(a.category === article.category);
            return categoryScore || Math.abs(article.index - a.index) - Math.abs(article.index - b.index);
        })
        .slice(0, 3);
    const renderedContent = renderMixedContent(article.content, article.description);
    const seo = generatePageSeo(article.source, article.content, { content: article.content });
    seo.jsonLd = generatePageSeo({ ...article.source, Slug: article.slug }, article.content).jsonLd;

    const metadataValidation = validateMetadata(seo);
    if (!metadataValidation.valid) throw new Error(`${article.slug}: ${metadataValidation.errors.join(" ")}`);
    const schemaValidation = validateJsonLd(seo.jsonLd);
    if (!schemaValidation.validJson || !schemaValidation.hasBlogPosting || !schemaValidation.hasBreadcrumb) {
        throw new Error(`${article.slug}: invalid blog structured data.`);
    }

    return {
        language: SITE_CONFIG.language,
        slug: article.slug,
        canonical: absoluteBlogUrl(article.slug),
        category: article.category,
        title: article.title,
        description: article.description,
        author: article.author,
        publishDate: formatDate(article.date),
        publishDateIso: dateIso(article.date),
        readingTime: estimateReadingTime(article.content),
        featuredImage: article.image,
        featuredImageAlt: `${article.title} featured image`,
        featuredImageWidth: 1200,
        featuredImageHeight: 675,
        content: renderedContent,
        previousArticle: buildNavigationCard("Previous Article", previous),
        nextArticle: buildNavigationCard("Next Article", next),
        relatedArticles: related.length ? related.map(buildRelatedCard).join("\n") : `<p class="text-sm text-gray-400">No related articles available yet.</p>`,
        share: {
            linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(absoluteBlogUrl(article.slug))}`,
            x: `https://twitter.com/intent/tweet?url=${encodeURIComponent(absoluteBlogUrl(article.slug))}&text=${encodeURIComponent(article.title)}`
        },
        seo
    };
}

async function generateBlogPages() {
    const apiUrl = readApiUrl();
    const payload = await fetchPortfolioData(apiUrl);
    const publishedBlogs = (payload.blogs || []).filter(isPublished);
    const duplicateTracker = new Map();
    const invalidSlugs = [];

    publishedBlogs.forEach(blog => {
        const slug = normalizeSlug(readField(blog, "Slug"));
        if (!slug) {
            invalidSlugs.push(readField(blog, "Title") || "(untitled)");
            return;
        }
        duplicateTracker.set(slug, (duplicateTracker.get(slug) || 0) + 1);
    });

    const duplicateSlugs = [...duplicateTracker.entries()]
        .filter(([, count]) => count > 1)
        .map(([slug]) => slug);
    const usableBlogs = publishedBlogs.filter(blog => {
        const slug = normalizeSlug(readField(blog, "Slug"));
        return slug && !duplicateSlugs.includes(slug);
    });

    const articles = [];
    for (const blog of usableBlogs) {
        const content = readField(blog, "Content") || await fetchBlogContent(apiUrl, blog);
        articles.push(normalizeBlog(blog, content, articles.length));
    }
    articles.sort((a, b) => b.dateTime - a.dateTime || a.title.localeCompare(b.title));
    articles.forEach((article, index) => { article.index = index; });

    const pageTemplate = fs.readFileSync(BLOG_TEMPLATE_FILE, "utf8");
    const seoTemplate = fs.readFileSync(SEO_TEMPLATE_FILE, "utf8");
    const engine = createTemplateEngine({ seo: seoTemplate }, {
        rawFields: ["content", "seo.jsonLd", "previousArticle", "nextArticle", "relatedArticles"]
    });

    const generatedPages = [];
    articles.forEach(article => {
        const outputDir = ensureCleanOutputDir(article.slug);
        const html = engine.render(pageTemplate, buildTemplateData(article, articles, pageTemplate));
        fs.writeFileSync(path.join(outputDir, "index.html"), html, "utf8");
        generatedPages.push(article);
    });

    const generatedAt = new Date().toISOString();
    updateManifest(generatedPages, generatedAt);

    return {
        generatedAt,
        generatedCount: generatedPages.length,
        generatedUrls: generatedPages.map(article => absoluteBlogUrl(article.slug)),
        duplicateSlugs,
        invalidSlugs
    };
}

if (require.main === module) {
    generateBlogPages()
        .then(report => {
            console.log(JSON.stringify(report, null, 2));
        })
        .catch(error => {
            console.error(error);
            process.exit(1);
        });
}

module.exports = {
    generateBlogPages,
    renderMixedContent,
    sanitizeHtml,
    estimateReadingTime
};
