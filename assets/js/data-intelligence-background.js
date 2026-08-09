(() => {
    const PREVIEW_PARAM = 'preview';
    const PREVIEW_VALUE = 'data-intelligence';

    const visuals = [
        { type: 'term', text: 'DATA' },
        { type: 'value', text: '42.7%' },
        { type: 'query', text: 'SELECT *\nFROM sales' },
        { type: 'chart', text: '72.4%', bars: [3, 6, 10, 14, 11] },
        { type: 'term', text: 'INSIGHT' },
        { type: 'pipeline', text: 'DATA  →  CLEAN  →  ANALYZE' },
        { type: 'value', text: '1.24M' },
        { type: 'query', text: 'SUM(revenue)' },
        { type: 'term', text: 'AUTOMATION' },
        { type: 'chart', text: 'TREND', bars: [4, 8, 7, 12, 16] },
        { type: 'query', text: 'GROUP BY region' },
        { type: 'term', text: 'KPI' },
        { type: 'pipeline', text: 'RAW  →  PROCESS  →  KPI' },
        { type: 'value', text: '87.4%' },
        { type: 'term', text: 'PIPELINE' },
        { type: 'query', text: 'AVG(value)' },
        { type: 'chart', text: 'BI', bars: [5, 9, 13, 10, 15] },
        { type: 'term', text: 'MODEL' },
        { type: 'tool', text: 'MICROSOFT POWER BI', brand: 'powerbi', mobile: [6, 12] },
        { type: 'tool', text: 'TABLEAU', brand: 'tableau' },
        { type: 'tool', text: 'PYTHON', brand: 'python', mobile: [86, 18] },
        { type: 'tool', text: 'R', brand: 'r' },
        { type: 'tool', text: 'SQL', brand: 'sql', mobile: [6, 68] },
        { type: 'tool', text: 'MICROSOFT EXCEL', brand: 'excel', mobile: [86, 72] },
        { type: 'tool', text: 'GOOGLE LOOKER STUDIO', brand: 'looker' },
        { type: 'tool', text: 'QLIK SENSE', brand: 'qlik' },
        { type: 'tool', text: 'KNIME', brand: 'knime' },
        { type: 'tool', text: 'RAPIDMINER', brand: 'rapidminer' },
        { type: 'tool', text: 'SAS', brand: 'sas' },
        { type: 'tool', text: 'APACHE SPARK', brand: 'spark' },
        { type: 'tool', text: 'JUPYTER NOTEBOOKS', brand: 'jupyter' },
        { type: 'tool', text: 'ALTERYX', brand: 'alteryx' },
        { type: 'tool', text: 'GOOGLE APPS SCRIPT', brand: 'appsscript', mobile: [6, 38] },
        { type: 'tool', text: 'AI AUTOMATION', brand: 'ai', mobile: [86, 43] },
        { type: 'formula', text: '=SUMIFS(revenue, region, "East")' },
        { type: 'formula', text: '=XLOOKUP(id, data[id], data[value])' },
        { type: 'formula', text: '=INDEX(result, MATCH(key, range, 0))' },
        { type: 'formula', text: '=QUERY(A:F, "select A, sum(F)")' },
        { type: 'formula', text: '=FILTER(data, status="Active")' },
        { type: 'formula', text: '=ARRAYFORMULA(A2:A * B2:B)' },
        { type: 'formula', text: '=IFERROR(value, 0)' },
        { type: 'formula', text: '=VLOOKUP(key, range, 3, FALSE)' }
    ];

    const positions = [
        [5, 18], [86, 13], [4, 43], [84, 39], [8, 70], [69, 82],
        [91, 62], [22, 87], [77, 23], [14, 55], [88, 91], [3, 31],
        [66, 8], [92, 49], [7, 94], [79, 71], [20, 26], [74, 55],
        [2, 12], [90, 28], [13, 79], [82, 95], [4, 63], [71, 34],
        [87, 76], [17, 39], [95, 18], [28, 93], [68, 65], [9, 24],
        [83, 47], [24, 73], [3, 86], [75, 15], [89, 68], [15, 47],
        [62, 91], [93, 36], [31, 17], [72, 76], [37, 8], [56, 88]
    ];

    function chartMarkup(bars) {
        return `<span class="data-chart-bars">${bars.map(height => `<i style="--bar-height:${height}px"></i>`).join('')}</span>`;
    }

    function toolIconMarkup(brand) {
        const marks = {
            powerbi: '<rect class="icon-fill icon-bar" x="4" y="11" width="3" height="9" rx="1"/><rect class="icon-fill icon-bar" x="9" y="7" width="3" height="13" rx="1"/><rect class="icon-fill icon-bar" x="14" y="3" width="3" height="17" rx="1"/><rect class="icon-fill icon-bar" x="19" y="9" width="2" height="11" rx="1"/>',
            tableau: '<path d="M12 2v7M9 5h6M5 9v6M2 12h6m11-3v6m-3-3h6M12 15v7m-3-3h6"/>',
            python: '<path class="icon-fill icon-python-top" d="M12 3c-5 0-5 2-5 5v2h9v2H6c-3 0-4 2-4 5s2 4 5 4h2v-3c0-3 2-5 5-5h4c2 0 4-2 4-5s-2-5-5-5h-5Z"/><path class="icon-fill-secondary" d="M12 21c5 0 5-2 5-5v-2H8v-2h10c3 0 4-2 4-5 0 4-2 6-5 6h-4c-3 0-5 2-5 5 0 2 1 3 4 3Z"/><circle class="icon-cut" cx="15" cy="6" r="1"/>',
            r: '<ellipse cx="12" cy="12" rx="9" ry="6"/><path d="M9 16V8h4c3 0 3 4 0 4H9m4 0 4 5"/>',
            sql: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
            excel: '<rect class="icon-fill" x="3" y="3" width="18" height="18" rx="2"/><path class="icon-cut" d="m7 8 5 8m0-8-5 8m7-8h4m-4 4h4m-4 4h4"/>',
            looker: '<circle cx="10" cy="10" r="6"/><circle class="icon-fill" cx="17.5" cy="17.5" r="3.5"/>',
            qlik: '<circle cx="12" cy="12" r="8"/><path d="M12 7v5l4 3"/><circle class="icon-fill" cx="12" cy="12" r="2"/>',
            knime: '<circle class="icon-fill" cx="12" cy="5" r="2"/><circle class="icon-fill" cx="5" cy="18" r="2"/><circle class="icon-fill" cx="19" cy="18" r="2"/><path d="m12 7-7 9m7-9 7 9M7 18h10"/>',
            rapidminer: '<path d="M4 17c4-9 8 3 12-7m-8 9c4-8 8 1 12-8"/><circle class="icon-fill" cx="18" cy="6" r="2"/>',
            sas: '<path d="M3 14c4-8 7 8 11 0s5 2 7-4"/>',
            spark: '<path class="icon-fill" d="m13 2-2 8-7 3 7 2 2 7 2-7 6-2-6-3-2-8Z"/>',
            jupyter: '<circle cx="12" cy="12" r="6"/><path d="M6 6a9 9 0 0 1 12 0M6 18a9 9 0 0 0 12 0"/><circle class="icon-fill" cx="5" cy="4" r="1.5"/><circle class="icon-fill" cx="19" cy="20" r="1.5"/>',
            alteryx: '<path d="M3 18 9 6l4 8 3-6 5 10M6 14h12"/>',
            appsscript: '<path class="icon-fill" d="M7 3h8l4 4v14H7z"/><path class="icon-cut" d="M15 3v5h4m-8 3-2 2 2 2m4-4 2 2-2 2"/>',
            ai: '<circle cx="12" cy="12" r="3"/><circle class="icon-fill" cx="5" cy="6" r="2"/><circle class="icon-fill" cx="19" cy="6" r="2"/><circle class="icon-fill" cx="5" cy="18" r="2"/><circle class="icon-fill" cx="19" cy="18" r="2"/><path d="m7 7 3 3m4 0 3-3m-7 7-3 3m7-3 3 3"/>'
        };
        return `<span class="data-brand-icon data-brand-${brand}"><svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">${marks[brand] || marks.ai}</svg></span>`;
    }

    function createVisual(item, index) {
        const element = document.createElement('span');
        const [left, top] = positions[index];
        element.className = `data-visual data-visual-${item.type}`;
        element.style.setProperty('--data-left', `${left}%`);
        element.style.setProperty('--data-top', `${top}%`);
        element.style.setProperty('--data-delay', `${(index % 7) * -2.7}s`);
        element.style.setProperty('--data-duration', `${18 + (index % 5) * 4}s`);
        element.style.setProperty('--data-rotate', `${((index * 7) % 11) - 5}deg`);
        element.dataset.visualIndex = String(index);
        if (item.mobile) {
            element.classList.add('data-mobile-featured');
            element.style.setProperty('--mobile-left', `${item.mobile[0]}%`);
            element.style.setProperty('--mobile-top', `${item.mobile[1]}%`);
        }

        if (item.type === 'chart') {
            element.innerHTML = `<b>${item.text}</b>${chartMarkup(item.bars)}`;
        } else if (item.type === 'tool') {
            element.innerHTML = `${toolIconMarkup(item.brand)}<b>${item.text}</b>`;
        } else if (item.type === 'formula') {
            element.innerHTML = `<b class="data-formula-icon">fx</b><span>${item.text}</span>`;
        } else {
            element.textContent = item.text;
        }
        return element;
    }

    function initializeDataIntelligenceBackground() {
        const params = new URLSearchParams(window.location.search);
        if (params.get(PREVIEW_PARAM) !== PREVIEW_VALUE) return;

        const layer = document.getElementById('data-intelligence-background');
        if (!layer || layer.dataset.initialized === 'true') return;

        document.documentElement.classList.add('data-intelligence-preview');
        const fragment = document.createDocumentFragment();
        visuals.forEach((item, index) => fragment.appendChild(createVisual(item, index)));
        layer.appendChild(fragment);
        layer.dataset.initialized = 'true';
    }

    window.initializeDataIntelligenceBackground = initializeDataIntelligenceBackground;
})();
