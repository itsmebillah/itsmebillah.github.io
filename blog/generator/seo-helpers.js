const SITE_CONFIG = {
    siteUrl: "https://itsmebillah.github.io",
    siteName: "Md Masum Billah Portfolio",
    language: "en",
    author: "Md. Masum Billah",
    authorUrl: "https://itsmebillah.github.io/#person",
    defaultImage: "https://i.postimg.cc/26DtqzQr/1777886932477.jpg"
};

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
    const site = { ...SITE_CONFIG, ...options };
    const slug = normalizeSlug(blog.Slug || blog.slug);
    const title = String(blog.Title || blog.title || "").trim();
    const description = String(blog.Description || blog.description || "").trim();
    const keywords = splitList(blog.Keywords || blog.keywords).join(", ");
    const canonical = generateCanonical(slug, site.siteUrl);
    const image = String(blog.Thumbnail || blog.featuredImage || site.defaultImage).trim();
    const category = String(blog.Category || blog.category || "").trim();
    const publishDate = String(blog.Date || blog.publishDate || "").trim();
    const author = String(blog.Author || blog.author || site.author).trim();

    return {
        slug,
        title,
        description,
        keywords,
        canonical,
        image,
        imageAlt: `${title} featured image`,
        category,
        publishDate,
        author,
        robots: "index, follow"
    };
}

function generateOpenGraph(meta, options = {}) {
    const site = { ...SITE_CONFIG, ...options };
    return {
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
    return {
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
    return JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: meta.title,
        description: meta.description,
        image: meta.image,
        author: {
            "@type": "Person",
            name: meta.author,
            url: site.authorUrl
        },
        publisher: {
            "@type": "Organization",
            name: site.siteName,
            logo: {
                "@type": "ImageObject",
                url: site.defaultImage
            }
        },
        mainEntityOfPage: meta.canonical,
        datePublished: meta.publishDate,
        dateModified: meta.publishDate,
        articleSection: meta.category,
        keywords: meta.keywords,
        articleBody: String(content || "").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
    }, null, 2);
}

if (typeof module !== "undefined") {
    module.exports = {
        SITE_CONFIG,
        normalizeSlug,
        generateCanonical,
        generateMeta,
        generateOpenGraph,
        generateTwitterCard,
        generateBreadcrumb,
        generateBlogJsonLd
    };
}
