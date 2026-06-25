const TOKEN_PATTERN = /{{\s*([#/>\w.-]+(?:\s+[\w.-]+)?)\s*}}/g;

function readPath(data, path) {
    return String(path || "")
        .split(".")
        .filter(Boolean)
        .reduce((value, key) => (value && Object.prototype.hasOwnProperty.call(value, key) ? value[key] : ""), data);
}

function escapeHtml(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[char]);
}

function renderTemplate(template, data = {}, partials = {}, options = {}) {
    const rawFields = new Set(options.rawFields || ["content", "seo.jsonLd"]);

    return String(template || "").replace(TOKEN_PATTERN, (match, token) => {
        if (token.startsWith(">")) {
            const partialName = token.slice(1).trim();
            return renderTemplate(partials[partialName] || "", data, partials, options);
        }

        const value = readPath(data, token);
        return rawFields.has(token) ? String(value ?? "") : escapeHtml(value);
    });
}

function createTemplateEngine(partials = {}, options = {}) {
    return {
        render(template, data) {
            return renderTemplate(template, data, partials, options);
        }
    };
}

if (typeof module !== "undefined") {
    module.exports = {
        createTemplateEngine,
        renderTemplate,
        readPath,
        escapeHtml
    };
}
