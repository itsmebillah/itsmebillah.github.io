const DEFAULT_SITE_CONFIG = {
    siteUrl: "https://itsmebillah.github.io",
    siteName: "Md Masum Billah Portfolio",
    language: "en",
    author: "Md. Masum Billah",
    authorUrl: "https://itsmebillah.github.io/#person",
    defaultImage: "https://i.postimg.cc/26DtqzQr/1777886932477.jpg",
    organizationId: "https://itsmebillah.github.io/#organization",
    websiteId: "https://itsmebillah.github.io/#website",
    personId: "https://itsmebillah.github.io/#person"
};

const FUTURE_SCHEMA_TYPES = [
    "FAQPage",
    "HowTo",
    "VideoObject",
    "ImageObject",
    "CollectionPage",
    "SearchAction"
];

function trimTrailingSlash(value) {
    return String(value || "").replace(/\/$/, "");
}

function safeText(value, fallback = "") {
    const text = String(value ?? "").replace(/\s+/g, " ").trim();
    return text || fallback;
}

function stripHtml(value) {
    return safeText(String(value || "").replace(/<[^>]+>/g, " "));
}

function splitSchemaList(value) {
    if (Array.isArray(value)) {
        return value.map(item => safeText(item)).filter(Boolean);
    }

    return String(value || "")
        .split(",")
        .map(item => safeText(item))
        .filter(Boolean);
}

function toAbsoluteUrl(value, siteUrl = DEFAULT_SITE_CONFIG.siteUrl) {
    const raw = safeText(value);
    if (!raw) return "";
    if (/^https?:\/\//i.test(raw)) return raw;
    return `${trimTrailingSlash(siteUrl)}/${raw.replace(/^\/+/, "")}`;
}

function normalizeDate(value) {
    if (value instanceof Date && !Number.isNaN(value.getTime())) {
        return value.toISOString();
    }

    const raw = safeText(value);
    const parsed = raw ? new Date(raw) : null;
    if (parsed && !Number.isNaN(parsed.getTime())) {
        return parsed.toISOString();
    }

    return new Date().toISOString();
}

function withContext(graph) {
    return {
        "@context": "https://schema.org",
        "@graph": graph.filter(Boolean)
    };
}

function generatePersonSchema(options = {}) {
    const site = { ...DEFAULT_SITE_CONFIG, ...options };

    return {
        "@type": "Person",
        "@id": site.personId,
        name: safeText(site.author, DEFAULT_SITE_CONFIG.author),
        url: trimTrailingSlash(site.siteUrl),
        image: toAbsoluteUrl(site.defaultImage, site.siteUrl),
        worksFor: {
            "@id": site.organizationId
        }
    };
}

function generateOrganizationSchema(options = {}) {
    const site = { ...DEFAULT_SITE_CONFIG, ...options };

    return {
        "@type": "Organization",
        "@id": site.organizationId,
        name: safeText(site.siteName, DEFAULT_SITE_CONFIG.siteName),
        url: trimTrailingSlash(site.siteUrl),
        logo: {
            "@type": "ImageObject",
            url: toAbsoluteUrl(site.defaultImage, site.siteUrl)
        },
        founder: {
            "@id": site.personId
        }
    };
}

function generateWebsiteSchema(options = {}) {
    const site = { ...DEFAULT_SITE_CONFIG, ...options };

    return {
        "@type": "WebSite",
        "@id": site.websiteId,
        name: safeText(site.siteName, DEFAULT_SITE_CONFIG.siteName),
        url: `${trimTrailingSlash(site.siteUrl)}/`,
        inLanguage: safeText(site.language, DEFAULT_SITE_CONFIG.language),
        publisher: {
            "@id": site.organizationId
        },
        author: {
            "@id": site.personId
        }
    };
}

function generateHomepageJsonLd(options = {}) {
    return JSON.stringify(withContext([
        generatePersonSchema(options),
        generateOrganizationSchema(options),
        generateWebsiteSchema(options)
    ]), null, 2);
}

function generateBlogPostingSchema(meta = {}, content = "", options = {}) {
    const site = { ...DEFAULT_SITE_CONFIG, ...options };
    const canonical = toAbsoluteUrl(meta.canonical || "blog/", site.siteUrl);
    const publishDate = normalizeDate(meta.publishDate || meta.datePublished || meta.Date);
    const modifiedDate = normalizeDate(meta.modifiedDate || meta.dateModified || meta.UpdatedAt || meta.publishDate);
    const title = safeText(meta.title || meta.Title, "Untitled Article");
    const description = safeText(meta.description || meta.Description, "Blog article by Md. Masum Billah.");
    const image = toAbsoluteUrl(meta.image || meta.Thumbnail || site.defaultImage, site.siteUrl);
    const authorName = safeText(meta.author || meta.Author, site.author);
    const keywords = splitSchemaList(meta.keywords || meta.Keywords);
    const articleSection = safeText(meta.category || meta.Category, "Blog");
    const articleBody = stripHtml(content);

    const schema = {
        "@type": "BlogPosting",
        headline: title,
        description,
        image: [image],
        author: {
            "@type": "Person",
            name: authorName,
            url: toAbsoluteUrl(site.authorUrl, site.siteUrl)
        },
        publisher: {
            "@id": site.organizationId
        },
        datePublished: publishDate,
        dateModified: modifiedDate,
        mainEntityOfPage: {
            "@type": "WebPage",
            "@id": canonical
        },
        keywords,
        articleSection,
        url: canonical
    };

    if (articleBody) {
        schema.articleBody = articleBody;
    }

    return schema;
}

function generateBreadcrumbSchema(meta = {}, options = {}) {
    const site = { ...DEFAULT_SITE_CONFIG, ...options };
    const siteUrl = trimTrailingSlash(site.siteUrl);
    const title = safeText(meta.title || meta.Title, "Untitled Article");
    const canonical = toAbsoluteUrl(meta.canonical || "blog/", site.siteUrl);

    return {
        "@type": "BreadcrumbList",
        itemListElement: [
            {
                "@type": "ListItem",
                position: 1,
                name: "Home",
                item: `${siteUrl}/`
            },
            {
                "@type": "ListItem",
                position: 2,
                name: "Blog",
                item: `${siteUrl}/blog/`
            },
            {
                "@type": "ListItem",
                position: 3,
                name: title,
                item: canonical
            }
        ]
    };
}

function generateBlogPageJsonLd(meta = {}, content = "", options = {}) {
    return JSON.stringify(withContext([
        generateOrganizationSchema(options),
        generateBlogPostingSchema(meta, content, options),
        generateBreadcrumbSchema(meta, options)
    ]), null, 2);
}

function validateJsonLd(jsonLd) {
    const parsed = typeof jsonLd === "string" ? JSON.parse(jsonLd) : jsonLd;
    const graph = Array.isArray(parsed["@graph"]) ? parsed["@graph"] : [parsed];
    const types = graph.map(item => item && item["@type"]).filter(Boolean);

    return {
        validJson: true,
        hasContext: parsed["@context"] === "https://schema.org",
        types,
        hasBlogPosting: types.includes("BlogPosting"),
        hasBreadcrumb: types.includes("BreadcrumbList"),
        hasHomepageSchemas: ["Person", "Organization", "WebSite"].every(type => types.includes(type))
    };
}

if (typeof module !== "undefined") {
    module.exports = {
        DEFAULT_SITE_CONFIG,
        FUTURE_SCHEMA_TYPES,
        safeText,
        stripHtml,
        splitSchemaList,
        toAbsoluteUrl,
        normalizeDate,
        generatePersonSchema,
        generateOrganizationSchema,
        generateWebsiteSchema,
        generateHomepageJsonLd,
        generateBlogPostingSchema,
        generateBreadcrumbSchema,
        generateBlogPageJsonLd,
        validateJsonLd
    };
}
