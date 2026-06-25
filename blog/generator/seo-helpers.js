const SITE_CONFIG = {
    siteUrl: "https://itsmebillah.github.io",
    siteName: "Md Masum Billah Portfolio",
    language: "en",
    author: "Md. Masum Billah",
    authorUrl: "https://itsmebillah.github.io/#person",
    defaultImage: "https://i.postimg.cc/26DtqzQr/1777886932477.jpg"
};

const {
    generateBlogPageJsonLd,
    generateBreadcrumbSchema,
    generateHomepageJsonLd,
    validateJsonLd
} = require("./schema-helpers");

const {
    generateBlogMetadata,
    generateHomepageMetadata,
    validateMetadata,
    validateMetadataCollection
} = require("./metadata-helpers");

function normalizeSlug(slug) {
    return String(slug || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function generateCanonical(slug, siteUrl = SITE_CONFIG.siteUrl) {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return "";
    return `${siteUrl.replace(/\/$/, "")}/blog/${cleanSlug}/`;
}

function splitList(value) {
    if (Array.isArray(value)) return value.map(item => String(item).trim()).filter(Boolean);
    return String(value || "").split(",").map(item => item.trim()).filter(Boolean);
}

function generateMeta(blog, options = {}) {
    return generateBlogMetadata(blog, options.content || blog.Content || blog.content || "", { ...SITE_CONFIG, ...options });
}

function generateOpenGraph(meta, options = {}) {
    const site = { ...SITE_CONFIG, ...options };
    return meta.og || {
        type: "article",
        locale: "en_US",
        title: meta.title,
        description: meta.description,
        url: meta.canonical,
        siteName: site.siteName,
        image: meta.image,
        imageAlt: meta.imageAlt
    };
}

function generateTwitterCard(meta) {
    return meta.twitter || {
        card: "summary_large_image",
        title: meta.title,
        description: meta.description,
        image: meta.image,
        imageAlt: meta.imageAlt
    };
}

function generateBreadcrumb(meta, options = {}) {
    const site = { ...SITE_CONFIG, ...options };
    return [
        { name: "Home", url: `${site.siteUrl.replace(/\/$/, "")}/` },
        { name: "Blog", url: `${site.siteUrl.replace(/\/$/, "")}/blog/` },
        { name: meta.title, url: meta.canonical }
    ];
}

function generateBlogJsonLd(meta, content, options = {}) {
    const site = { ...SITE_CONFIG, ...options };
    return generateBlogPageJsonLd(meta, content, site);
}

function generatePageSeo(blog, content = "", options = {}) {
    const meta = generateBlogMetadata(blog, content, { ...SITE_CONFIG, ...options });
    return {
        ...meta,
        og: generateOpenGraph(meta, options),
        twitter: generateTwitterCard(meta),
        jsonLd: generateBlogJsonLd(meta, content, options)
    };
}

function generateHomepageSeo(options = {}) {
    return generateHomepageMetadata({ ...SITE_CONFIG, ...options });
}

if (typeof module !== "undefined") {
    module.exports = {
        SITE_CONFIG,
        normalizeSlug,
        generateCanonical,
        generateMeta,
        generatePageSeo,
        generateHomepageSeo,
        generateOpenGraph,
        generateTwitterCard,
        generateBreadcrumb,
        generateBreadcrumbSchema,
        generateHomepageJsonLd,
        generateBlogPageJsonLd,
        generateBlogJsonLd,
        validateJsonLd,
        validateMetadata,
        validateMetadataCollection
    };
}
