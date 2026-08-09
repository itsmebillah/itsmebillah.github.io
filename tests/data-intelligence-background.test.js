const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const script = fs.readFileSync('assets/js/data-intelligence-background.js', 'utf8');
const styles = fs.readFileSync('assets/css/main.css', 'utf8');
const component = fs.readFileSync('components/particles.html', 'utf8');
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
    assert.match(styles, /@media \(max-width: 768px\)[\s\S]*\.data-visual:nth-child\(n\+8\)/);
    assert.match(styles, /@media \(prefers-reduced-motion: reduce\)[\s\S]*\.data-visual \{ animation: none;/);
});

test('visual distribution is deterministic and bounded', () => {
    assert.match(script, /const positions = \[/);
    assert.doesNotMatch(script, /Math\.random/);
    assert.match(script, /visuals\.forEach/);
});
