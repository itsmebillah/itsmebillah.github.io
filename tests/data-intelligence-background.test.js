const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const script = fs.readFileSync('assets/js/data-intelligence-background.js', 'utf8');
const styles = fs.readFileSync('assets/css/main.css', 'utf8');
const component = fs.readFileSync('components/particles.html', 'utf8');
const loader = fs.readFileSync('components/loader.html', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

test('data intelligence layer is limited to the explicit draft query', () => {
    assert.match(script, /params\.get\(PREVIEW_PARAM\) !== PREVIEW_VALUE/);
    assert.match(script, /data-intelligence-preview/);
    assert.match(styles, /\.data-intelligence-preview \.data-intelligence-background \{ display: block; \}/);
});

test('background enhancement preserves the existing particle layer', () => {
    assert.match(component, /id="particles-js"/);
    assert.match(component, /id="data-intelligence-background"/);
    assert.match(index, /particles\.min\.js/);
});

test('background supports mobile density reduction and reduced motion', () => {
    assert.match(styles, /@media \(max-width: 768px\)[\s\S]*\.data-visual:nth-child\(n\+10\)/);
    assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.data-visual \{ animation: none;/);
});

test('background defines independent light and dark color tokens', () => {
    assert.match(styles, /\.data-intelligence-background \{[\s\S]*--data-text: rgba\(27, 73, 47/);
    assert.match(styles, /:root\[data-theme="dark"\] \.data-intelligence-background \{[\s\S]*--data-text: rgba\(220, 231, 242/);
    assert.match(styles, /\.data-tool-icon \{[\s\S]*stroke: var\(--data-accent\)/);
});

test('draft loader presents an analytics pipeline while preserving the legacy loader', () => {
    assert.match(loader, /legacy-loader-stage/);
    assert.match(loader, /intelligence-loader-stage/);
    assert.match(loader, /SOURCES/);
    assert.match(loader, /PROCESSING/);
    assert.match(loader, /OUTPUTS/);
    assert.match(loader, /RAW DATA[\s\S]*CLEAN[\s\S]*MODEL[\s\S]*DECISION/);
    assert.match(styles, /\.data-intelligence-preview \.legacy-loader-stage \{ display: none; \}/);
    assert.match(styles, /\.data-intelligence-preview \.intelligence-loader-stage/);
});

test('visual distribution is deterministic and bounded', () => {
    assert.match(script, /const positions = \[/);
    assert.doesNotMatch(script, /Math\.random/);
    assert.match(script, /visuals\.forEach/);
    for (const tool of ['MICROSOFT POWER BI', 'TABLEAU', 'PYTHON', 'SQL', 'MICROSOFT EXCEL', 'GOOGLE LOOKER STUDIO', 'QLIK SENSE', 'KNIME', 'RAPIDMINER', 'SAS', 'APACHE SPARK', 'JUPYTER NOTEBOOKS', 'ALTERYX']) {
        assert.match(script, new RegExp(tool));
    }
    assert.match(script, /class="data-tool-icon"/);
    assert.match(styles, /\.data-tool-icon/);
    for (const formula of ['SUMIFS', 'XLOOKUP', 'INDEX', 'MATCH', 'QUERY', 'FILTER', 'ARRAYFORMULA', 'IFERROR', 'VLOOKUP']) {
        assert.match(script, new RegExp(formula));
    }
    assert.match(styles, /\.data-formula-icon/);
});
