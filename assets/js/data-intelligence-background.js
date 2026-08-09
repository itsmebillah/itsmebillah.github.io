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
        { type: 'tool', text: 'MICROSOFT POWER BI', icon: 'chart' },
        { type: 'tool', text: 'TABLEAU', icon: 'chart' },
        { type: 'tool', text: 'PYTHON', icon: 'code' },
        { type: 'tool', text: 'R', icon: 'code' },
        { type: 'tool', text: 'SQL', icon: 'database' },
        { type: 'tool', text: 'MICROSOFT EXCEL', icon: 'grid' },
        { type: 'tool', text: 'GOOGLE LOOKER STUDIO', icon: 'chart' },
        { type: 'tool', text: 'QLIK SENSE', icon: 'chart' },
        { type: 'tool', text: 'KNIME', icon: 'workflow' },
        { type: 'tool', text: 'RAPIDMINER', icon: 'workflow' },
        { type: 'tool', text: 'SAS', icon: 'chart' },
        { type: 'tool', text: 'APACHE SPARK', icon: 'workflow' },
        { type: 'tool', text: 'JUPYTER NOTEBOOKS', icon: 'notebook' },
        { type: 'tool', text: 'ALTERYX', icon: 'workflow' },
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
        [62, 91], [93, 36], [31, 17], [72, 76]
    ];

    function chartMarkup(bars) {
        return `<span class="data-chart-bars">${bars.map(height => `<i style="--bar-height:${height}px"></i>`).join('')}</span>`;
    }

    function toolIconMarkup(icon) {
        const paths = {
            chart: '<path d="M4 19V9m6 10V5m6 14v-7m4 7H2"/>',
            code: '<path d="m8 9-3 3 3 3m8-6 3 3-3 3m-3-8-2 10"/>',
            database: '<ellipse cx="12" cy="5" rx="7" ry="3"/><path d="M5 5v6c0 1.7 3.1 3 7 3s7-1.3 7-3V5M5 11v6c0 1.7 3.1 3 7 3s7-1.3 7-3v-6"/>',
            grid: '<rect x="4" y="4" width="16" height="16" rx="1"/><path d="M4 10h16M10 4v16m5-10v10"/>',
            workflow: '<circle cx="5" cy="12" r="2"/><circle cx="19" cy="6" r="2"/><circle cx="19" cy="18" r="2"/><path d="M7 12h4c3 0 3-6 6-6M11 12c3 0 3 6 6 6"/>',
            notebook: '<rect x="5" y="3" width="14" height="18" rx="2"/><path d="M9 3v18m3-13h4m-4 4h4"/>'
        };
        return `<svg class="data-tool-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">${paths[icon] || paths.chart}</svg>`;
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

        if (item.type === 'chart') {
            element.innerHTML = `<b>${item.text}</b>${chartMarkup(item.bars)}`;
        } else if (item.type === 'tool') {
            element.innerHTML = `${toolIconMarkup(item.icon)}<b>${item.text}</b>`;
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
