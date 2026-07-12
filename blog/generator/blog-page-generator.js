const fs = require("fs");
const path = require("path");
const { createTemplateEngine, escapeHtml } = require("./template-engine");
const { generateSitemap } = require("./sitemap-generator");
const { generateRssFeed } = require("./rss-generator");
const { generateSearchIndex } = require("./search-index-generator");
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
const BLOG_INDEX_FILE = path.join(ROOT_DIR, "blog", "index.html");

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

function escapeJsonForScript(value) {
    return String(value || "").replace(/<\//g, "<\\/");
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
    const result = await response.json();
    return typeof result === "string" ? JSON.parse(result) : result;
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

function buildBlogIndexCard(article) {
    return `<a class="article-card-link glass rounded-2xl overflow-hidden border border-white/5 hover:border-orange-500/30 transition" href="./${escapeHtml(article.slug)}/">
        <img src="${escapeHtml(article.image)}" alt="${escapeHtml(article.title)} thumbnail" loading="lazy" decoding="async" width="600" height="338" class="h-44 w-full object-cover">
        <div class="p-5">
            <span class="text-[10px] font-bold uppercase tracking-wider text-orange-400">${escapeHtml(article.category || "Case Study")}</span>
            <h2 class="mt-2 text-lg font-bold text-white leading-snug">${escapeHtml(article.title)}</h2>
            <p class="mt-3 text-sm text-gray-400 line-clamp-3">${escapeHtml(article.description)}</p>
            <div class="mt-4 flex flex-wrap gap-2 text-xs text-gray-500">
                <span>${escapeHtml(article.author)}</span>
                <span aria-hidden="true">&middot;</span>
                <time datetime="${escapeHtml(dateIso(article.date))}">${escapeHtml(formatDate(article.date))}</time>
                <span aria-hidden="true">&middot;</span>
                <span>${estimateReadingTime(article.content)} min read</span>
            </div>
        </div>
    </a>`;
}

function buildBlogIndexJsonLd(articles) {
    const siteUrl = SITE_CONFIG.siteUrl.replace(/\/$/, "");
    const pageUrl = `${siteUrl}/blog/`;
    return escapeJsonForScript(JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
            {
                "@type": "CollectionPage",
                "@id": `${pageUrl}#collection`,
                "name": "Case Studies",
                "description": "Published data analytics, business intelligence, and automation case studies by Md. Masum Billah.",
                "url": pageUrl,
                "inLanguage": SITE_CONFIG.language,
                "isPartOf": {
                    "@id": `${siteUrl}/#website`
                },
                "mainEntity": {
                    "@type": "ItemList",
                    "itemListElement": articles.map((article, index) => ({
                        "@type": "ListItem",
                        "position": index + 1,
                        "url": absoluteBlogUrl(article.slug),
                        "name": article.title
                    }))
                }
            },
            {
                "@type": "BreadcrumbList",
                "itemListElement": [
                    {
                        "@type": "ListItem",
                        "position": 1,
                        "name": "Home",
                        "item": `${siteUrl}/`
                    },
                    {
                        "@type": "ListItem",
                        "position": 2,
                        "name": "Blog",
                        "item": pageUrl
                    }
                ]
            }
        ]
    }, null, 2));
}

function buildBlogIndexHtml(articles) {
    const siteUrl = SITE_CONFIG.siteUrl.replace(/\/$/, "");
    const pageUrl = `${siteUrl}/blog/`;
    const title = "Case Studies | Md Masum Billah";
    const description = "Explore published data analytics, business intelligence, and automation case studies by Md. Masum Billah.";
    const keywords = "Md Masum Billah blog, data analytics case studies, business intelligence case studies, automation case studies, Power BI, SQL";
    const image = SITE_CONFIG.defaultImage;
    const cards = articles.length
        ? articles.map(buildBlogIndexCard).join("\n")
        : `<p class="text-sm text-gray-400">No published articles are available yet.</p>`;

    return `<!DOCTYPE html>
<html lang="${escapeHtml(SITE_CONFIG.language)}">
<head>
    <meta charset="UTF-8">
    <meta http-equiv="X-UA-Compatible" content="IE=edge">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${escapeHtml(title)}</title>
    <meta name="description" content="${escapeHtml(description)}">
    <meta name="keywords" content="${escapeHtml(keywords)}">
    <meta name="robots" content="index, follow">
    <meta name="googlebot" content="index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1">
    <meta name="author" content="${escapeHtml(SITE_CONFIG.author)}">
    <link rel="canonical" href="${escapeHtml(pageUrl)}">
    <link rel="alternate" type="application/rss+xml" title="Md Masum Billah Portfolio Blog RSS Feed" href="${escapeHtml(`${siteUrl}/rss.xml`)}">
    <meta property="og:type" content="website">
    <meta property="og:locale" content="en_US">
    <meta property="og:title" content="${escapeHtml(title)}">
    <meta property="og:description" content="${escapeHtml(description)}">
    <meta property="og:image" content="${escapeHtml(image)}">
    <meta property="og:image:secure_url" content="${escapeHtml(image)}">
    <meta property="og:image:alt" content="Md Masum Billah Portfolio Blog social preview image">
    <meta property="og:image:width" content="1200">
    <meta property="og:image:height" content="630">
    <meta property="og:url" content="${escapeHtml(pageUrl)}">
    <meta property="og:site_name" content="${escapeHtml(SITE_CONFIG.siteName)}">
    <meta name="twitter:card" content="summary_large_image">
    <meta name="twitter:title" content="${escapeHtml(title)}">
    <meta name="twitter:description" content="${escapeHtml(description)}">
    <meta name="twitter:image" content="${escapeHtml(image)}">
    <script type="application/ld+json">${buildBlogIndexJsonLd(articles)}</script>
    <link rel="dns-prefetch" href="//cdn.tailwindcss.com">
    <link rel="dns-prefetch" href="//fonts.googleapis.com">
    <link rel="dns-prefetch" href="//fonts.gstatic.com">
    <link rel="dns-prefetch" href="//i.postimg.cc">
    <link rel="preconnect" href="https://cdn.tailwindcss.com">
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link rel="preconnect" href="https://i.postimg.cc">
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
    <link href="../assets/css/main.css" rel="stylesheet">
    <style>
        .blog-index-shell { min-height: 100vh; padding: 6rem 1.25rem 3rem; }
        .blog-index-container { width: min(100%, 1120px); margin: 0 auto; }
        .article-card-link { display: block; height: 100%; }
        @media (max-width: 768px) { .blog-index-shell { padding-top: 5rem; } }
    </style>
</head>
<body>
    <main class="blog-index-shell" id="blog-index">
        <section class="blog-index-container">
            <nav class="mb-8 text-xs text-gray-400" aria-label="Breadcrumb">
                <a href="../" class="hover:text-white transition">Home</a>
                <span class="mx-2 text-gray-600">/</span>
                <span class="text-orange-400">Case Studies</span>
            </nav>
            <header class="mb-10">
                <span class="inline-flex items-center rounded-full bg-orange-500/15 px-3 py-1 text-xs font-bold uppercase tracking-wider text-orange-400">Blog</span>
                <h1 class="mt-4 text-3xl md:text-5xl font-extrabold leading-tight text-white">Case Studies</h1>
                <p class="mt-5 text-base md:text-lg text-gray-300 leading-relaxed max-w-3xl">${escapeHtml(description)}</p>
            </header>
            <div class="grid gap-5 md:grid-cols-2 lg:grid-cols-3">
                ${cards}
            </div>
        </section>
    </main>
</body>
</html>
`;
}

function writeBlogIndex(articles) {
    fs.writeFileSync(BLOG_INDEX_FILE, buildBlogIndexHtml(articles), "utf8");
}

function normalizeBlog(blog, content, index) {
    const title = String(readField(blog, "Title") || "Untitled Article").trim();
    const slug = normalizeSlug(readField(blog, "Slug") || title);
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
    const seo = generatePageSeo({ ...article.source, Slug: article.slug }, article.content, { content: article.content });
    seo.jsonLd = escapeJsonForScript(seo.jsonLd);

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
        const slug = normalizeSlug(readField(blog, "Slug") || readField(blog, "Title"));
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
        const slug = normalizeSlug(readField(blog, "Slug") || readField(blog, "Title"));
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
    writeBlogIndex(generatedPages);

    const generatedAt = new Date().toISOString();
    updateManifest(generatedPages, generatedAt);

    const [sitemap, rss, searchIndex] = await Promise.all([
        generateSitemap(),
        generateRssFeed(),
        generateSearchIndex()
    ]);

    return {
        generatedAt,
        generatedCount: generatedPages.length,
        blogIndex: `${SITE_CONFIG.siteUrl.replace(/\/$/, "")}/blog/`,
        generatedUrls: generatedPages.map(article => absoluteBlogUrl(article.slug)),
        duplicateSlugs,
        invalidSlugs,
        sitemap,
        rss,
        searchIndex
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
    estimateReadingTime,
    buildBlogIndexHtml
};
