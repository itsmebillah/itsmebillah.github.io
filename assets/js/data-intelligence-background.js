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
        { type: 'term', text: 'MODEL' }
    ];

    const positions = [
        [5, 18], [86, 13], [4, 43], [84, 39], [8, 70], [69, 82],
        [91, 62], [22, 87], [77, 23], [14, 55], [88, 91], [3, 31],
        [66, 8], [92, 49], [7, 94], [79, 71], [20, 26], [74, 55]
    ];

    function chartMarkup(bars) {
        return `<span class="data-chart-bars">${bars.map(height => `<i style="--bar-height:${height}px"></i>`).join('')}</span>`;
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
