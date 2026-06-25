const DEFAULT_METADATA_CONFIG = {
    siteUrl: "https://itsmebillah.github.io",
    siteName: "Md Masum Billah Portfolio",
    homepageTitle: "Md. Masum Billah | Business Intelligence Analyst",
    homepageDescription: "Portfolio of Md. Masum Billah, a Business Intelligence Analyst specializing in dashboards, data analysis, automation, and decision intelligence.",
    defaultImage: "https://i.postimg.cc/26DtqzQr/1777886932477.jpg",
    author: "Md. Masum Billah",
    authorUrl: "https://itsmebillah.github.io/#person",
    defaultCategory: "Blog",
    defaultKeywords: ["Business Intelligence", "Data Analysis", "Dashboard", "Portfolio"]
};

function normalizeText(value) {
    return String(value ?? "").replace(/\s+/g, " ").trim();
}

function stripHtml(value) {
    return normalizeText(String(value || "").replace(/<[^>]+>/g, " "));
}

function trimTrailingSlash(value) {
    return String(value || "").replace(/\/$/, "");
}

function normalizeSlug(slug) {
    return String(slug || "")
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

function splitList(value) {
    if (Array.isArray(value)) return value.map(item => normalizeText(item)).filter(Boolean);
    return String(value || "").split(",").map(item => normalizeText(item)).filter(Boolean);
}

function uniqueList(values) {
    return Array.from(new Set(values.map(item => normalizeText(item)).filter(Boolean)));
}

function excerptFromContent(content, maxLength = 155) {
    const text = stripHtml(content);
    if (!text) return "";
    if (text.length <= maxLength) return text;

    const trimmed = text.slice(0, maxLength + 1);
    const lastSpace = trimmed.lastIndexOf(" ");
    return `${trimmed.slice(0, lastSpace > 80 ? lastSpace : maxLength - 3).trim()}...`;
}

function ensureLength(value, fallback, maxLength) {
    const text = normalizeText(value) || normalizeText(fallback);
    if (!maxLength || text.length <= maxLength) return text;

    const trimmed = text.slice(0, maxLength + 1);
    const lastSpace = trimmed.lastIndexOf(" ");
    return `${trimmed.slice(0, lastSpace > 30 ? lastSpace : maxLength - 3).trim()}...`;
}

function normalizeDate(value) {
    const raw = normalizeText(value);
    if (!raw) return "";

    const parsed = new Date(raw);
    return Number.isNaN(parsed.getTime()) ? raw : parsed.toISOString();
}

function generateCanonical(slug, siteUrl = DEFAULT_METADATA_CONFIG.siteUrl) {
    const cleanSlug = normalizeSlug(slug);
    if (!cleanSlug) return `${trimTrailingSlash(siteUrl)}/`;
    return `${trimTrailingSlash(siteUrl)}/blog/${cleanSlug}/`;
}

function generateKeywords(blog = {}, title = "", options = {}) {
    const config = { ...DEFAULT_METADATA_CONFIG, ...options };
    const explicit = splitList(blog.Keywords || blog.keywords);
    if (explicit.length) return uniqueList(explicit).join(", ");

    const category = normalizeText(blog.Category || blog.category || config.defaultCategory);
    const titleTerms = normalizeText(title)
        .split(/\s+/)
        .filter(word => word.length > 2);

    return uniqueList([category, ...titleTerms, ...config.defaultKeywords]).join(", ");
}

function generateHomepageMetadata(options = {}) {
    const config = { ...DEFAULT_METADATA_CONFIG, ...options };
    const canonical = `${trimTrailingSlash(config.siteUrl)}/`;
    const title = ensureLength(config.homepageTitle, config.siteName, 60);
    const description = ensureLength(config.homepageDescription, config.siteName, 160);
    const image = normalizeText(config.defaultImage);

    return {
        title,
        description,
        keywords: uniqueList(config.defaultKeywords).join(", "),
        canonical,
        image,
        imageAlt: `${config.siteName} social preview image`,
        author: config.author,
        robots: "index, follow",
        og: {
            type: "website",
            locale: "en_US",
            title,
            description,
            url: canonical,
            siteName: config.siteName,
            image,
            imageAlt: `${config.siteName} social preview image`
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            image,
            imageAlt: `${config.siteName} social preview image`
        }
    };
}

function generateBlogMetadata(blog = {}, content = "", options = {}) {
    const config = { ...DEFAULT_METADATA_CONFIG, ...options };
    const rawTitle = normalizeText(blog.Title || blog.title);
    const slug = normalizeSlug(blog.Slug || blog.slug || rawTitle || "untitled-article");
    const title = ensureLength(rawTitle, "Untitled Article", 60);
    const contentSource = content || blog.Content || blog.content || "";
    const descriptionFallback = excerptFromContent(contentSource) || `Read ${title} by ${config.author}.`;
    const description = ensureLength(blog.Description || blog.description, descriptionFallback, 160);
    const canonical = generateCanonical(slug, config.siteUrl);
    const image = normalizeText(blog.Thumbnail || blog.thumbnail || blog.featuredImage || config.defaultImage);
    const category = normalizeText(blog.Category || blog.category || config.defaultCategory);
    const keywords = generateKeywords(blog, rawTitle || title, config);
    const author = normalizeText(blog.Author || blog.author || config.author);
    const publishedTime = normalizeDate(blog.Date || blog.date || blog.publishDate);
    const modifiedTime = normalizeDate(blog.UpdatedAt || blog.updatedAt || blog.modifiedDate || blog.Date || blog.date);
    const imageAlt = `${title} featured image`;

    return {
        slug,
        title,
        description,
        keywords,
        canonical,
        image,
        imageAlt,
        category,
        publishDate: publishedTime,
        modifiedDate: modifiedTime,
        author,
        robots: "index, follow",
        og: {
            type: "article",
            locale: "en_US",
            title,
            description,
            url: canonical,
            siteName: config.siteName,
            image,
            imageAlt
        },
        twitter: {
            card: "summary_large_image",
            title,
            description,
            image,
            imageAlt
        },
        article: {
            publishedTime,
            modifiedTime,
            authorUrl: config.authorUrl,
            section: category
        }
    };
}

function validateMetadata(meta = {}) {
    const errors = [];
    const warnings = [];

    if (!normalizeText(meta.title)) errors.push("Missing title.");
    if (!normalizeText(meta.description)) errors.push("Missing description.");
    if (!normalizeText(meta.canonical)) errors.push("Missing canonical URL.");
    if (!normalizeText(meta.og && meta.og.image)) errors.push("Missing Open Graph image.");
    if (!meta.twitter || !normalizeText(meta.twitter.card) || !normalizeText(meta.twitter.title) || !normalizeText(meta.twitter.description) || !normalizeText(meta.twitter.image)) {
        errors.push("Missing Twitter Card metadata.");
    }
    if (normalizeText(meta.title).length > 60) warnings.push("Title is longer than 60 characters.");
    if (normalizeText(meta.description).length < 50) warnings.push("Description is shorter than 50 characters.");
    if (normalizeText(meta.description).length > 160) warnings.push("Description is longer than 160 characters.");

    return { valid: errors.length === 0, errors, warnings };
}

function validateMetadataCollection(items = []) {
    const seenTitles = new Map();
    const seenDescriptions = new Map();
    const errors = [];
    const warnings = [];

    items.forEach((meta, index) => {
        const label = meta.slug || meta.canonical || `item-${index + 1}`;
        const result = validateMetadata(meta);
        result.errors.forEach(error => errors.push(`${label}: ${error}`));
        result.warnings.forEach(warning => warnings.push(`${label}: ${warning}`));

        const titleKey = normalizeText(meta.title).toLowerCase();
        const descriptionKey = normalizeText(meta.description).toLowerCase();

        if (titleKey) {
            if (seenTitles.has(titleKey)) errors.push(`${label}: Duplicate title also used by ${seenTitles.get(titleKey)}.`);
            seenTitles.set(titleKey, label);
        }

        if (descriptionKey) {
            if (seenDescriptions.has(descriptionKey)) errors.push(`${label}: Duplicate description also used by ${seenDescriptions.get(descriptionKey)}.`);
            seenDescriptions.set(descriptionKey, label);
        }
    });

    return { valid: errors.length === 0, errors, warnings };
}

if (typeof module !== "undefined") {
    module.exports = {
        DEFAULT_METADATA_CONFIG,
        normalizeText,
        stripHtml,
        normalizeSlug,
        splitList,
        excerptFromContent,
        generateCanonical,
        generateKeywords,
        generateHomepageMetadata,
        generateBlogMetadata,
        validateMetadata,
        validateMetadataCollection
    };
}
