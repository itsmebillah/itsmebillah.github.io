(function () {
    const DEFAULT_INDEX_URL = "/search-index.json";
    let cachedIndexPromise = null;

    function normalizeText(value) {
        return String(value ?? "")
            .replace(/<[^>]+>/g, " ")
            .normalize("NFKD")
            .replace(/[\u0300-\u036f]/g, "")
            .replace(/\s+/g, " ")
            .trim()
            .toLowerCase();
    }

    function searchableValues(item) {
        return Object.entries(item || {})
            .filter(([key]) => !["id", "type", "url"].includes(key))
            .flatMap(([, value]) => Array.isArray(value) ? value : [value])
            .map(normalizeText)
            .filter(Boolean);
    }

    function tokenize(query) {
        return normalizeText(query).split(/\s+/).filter(Boolean);
    }

    function scoreItem(item, tokens) {
        const title = normalizeText(item.title);
        const category = normalizeText(item.category || item.issuer || item.organization);
        const values = searchableValues(item);
        const haystack = values.join(" ");

        return tokens.reduce((score, token) => {
            if (title === token) return score + 20;
            if (title.includes(token)) return score + 10;
            if (category.includes(token)) return score + 6;
            if (haystack.includes(token)) return score + 2;
            return score;
        }, 0);
    }

    async function loadIndex(indexUrl = DEFAULT_INDEX_URL) {
        if (!cachedIndexPromise) {
            cachedIndexPromise = fetch(indexUrl)
                .then(response => {
                    if (!response.ok) throw new Error(`Search index request failed with status ${response.status}`);
                    return response.json();
                })
                .then(index => Array.isArray(index.items) ? index : { ...index, items: [] });
        }

        return cachedIndexPromise;
    }

    async function search(query, options = {}) {
        const tokens = tokenize(query);
        if (!tokens.length) return [];

        const index = await loadIndex(options.indexUrl || DEFAULT_INDEX_URL);
        const filters = options.filters || {};
        const limit = Number.isFinite(options.limit) ? options.limit : 20;

        return index.items
            .filter(item => !filters.type || item.type === filters.type)
            .filter(item => !filters.category || normalizeText(item.category).includes(normalizeText(filters.category)))
            .map(item => ({ ...item, score: scoreItem(item, tokens) }))
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score || String(a.title).localeCompare(String(b.title)))
            .slice(0, limit);
    }

    window.PortfolioSearch = {
        loadIndex,
        search,
        normalizeText
    };
})();
