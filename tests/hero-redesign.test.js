const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const index = fs.readFileSync('index.html', 'utf8');
const hero = fs.readFileSync('components/hero.html', 'utf8');
const heroScript = fs.readFileSync('assets/modules/hero.js', 'utf8');
const styles = fs.readFileSync('assets/css/main.css', 'utf8');

test('hero redesign remains isolated behind its preview query', () => {
    assert.match(index, /get\('preview'\) === 'hero-redesign'/);
    assert.match(index, /classList\.add\('hero-redesign-preview'\)/);
    assert.match(styles, /\.hero-redesign-preview \.hero-section/);
});

test('hero draft reuses dynamic profile fields and existing actions', () => {
    assert.match(hero, /id="profileImage"/);
    assert.match(hero, /id="heroName"/);
    assert.match(hero, /id="heroTitle"/);
    assert.match(hero, /id="heroBio"/);
    assert.match(hero, /id="resumeLink"/);
    assert.match(heroScript, /String\(title \|\| ''\)\.split\('\|'\)/);
    assert.match(heroScript, /escapeHtml\(role\.trim\(\)\)/);
});

test('hero draft expresses the analyst and automation workflow', () => {
    assert.match(hero, /DATA INTELLIGENCE · AUTOMATION SYSTEMS/);
    assert.match(hero, /SQL/);
    assert.match(hero, /POWER BI/);
    assert.match(hero, /APPS SCRIPT/);
    assert.match(hero, /Data[\s\S]*Analysis[\s\S]*Automation[\s\S]*Decision/);
    assert.match(styles, /:root\[data-theme="dark"\]\.hero-redesign-preview/);
    assert.match(styles, /@media \(prefers-color-scheme: dark\)[\s\S]*hero-redesign-preview/);
});
