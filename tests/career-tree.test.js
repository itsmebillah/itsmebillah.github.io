const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const index = fs.readFileSync('index.html', 'utf8');
const component = fs.readFileSync('components/experience.html', 'utf8');
const script = fs.readFileSync('assets/modules/experience.js', 'utf8');
const styles = fs.readFileSync('assets/css/main.css', 'utf8');

test('career tree is enabled on the normal portfolio', () => {
    assert.match(index, /class="data-intelligence-preview career-tree-preview"/);
    assert.doesNotMatch(index, /get\('preview'\) === 'career-tree'/);
    assert.match(styles, /\.career-tree-preview \.timeline-container::before/);
});

test('career tree preserves dynamic records without formula ground decoration', () => {
    assert.match(script, /timeline-\$\{item\.blockType\}/);
    assert.match(script, /career-tree-trunk\.png/);
    assert.match(styles, /timeline-item:nth-child\(odd\)::before/);
    assert.match(styles, /timeline-item:nth-child\(even\)::before/);
    assert.doesNotMatch(component, /ROOTED IN DATA|SUM|XLOOKUP|QUERY|ARRAYFORMULA|IFERROR|FILTER|INDEX/);
    assert.doesNotMatch(styles, /\.career-tree-preview \.data-grass/);
});
