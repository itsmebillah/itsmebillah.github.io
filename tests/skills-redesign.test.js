const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const index = fs.readFileSync('index.html', 'utf8');
const skills = fs.readFileSync('components/skills.html', 'utf8');
const script = fs.readFileSync('assets/modules/skills.js', 'utf8');
const styles = fs.readFileSync('assets/css/main.css', 'utf8');

test('skills redesign is preview-only and preserves dynamic content', () => {
    assert.match(index, /get\('preview'\) === 'skills-redesign'/);
    assert.match(index, /classList\.add\('skills-redesign-preview'\)/);
    assert.match(skills, /id="skillsSectionTitle"/);
    assert.match(skills, /id="skillsContainer"/);
    assert.match(script, /readObjProp\(s, 'Name'\)/);
    assert.match(script, /readObjProp\(s, 'Level'\)/);
});

test('skills draft provides icons, categories, and segmented levels', () => {
    assert.match(script, /iconForSkill/);
    assert.match(script, /activeSegments/);
    assert.match(styles, /\.skills-redesign-preview \.skill-segments/);
    assert.match(styles, /:root\[data-theme="dark"\]\.skills-redesign-preview/);
});
