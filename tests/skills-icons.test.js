const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const config = fs.readFileSync('assets/js/config.js', 'utf8');
const skills = fs.readFileSync('assets/modules/skills.js', 'utf8');
const component = fs.readFileSync('components/skills.html', 'utf8');
const index = fs.readFileSync('index.html', 'utf8');

test('technical skills use supported local icons', () => {
    for (const icon of ['fa-code', 'fa-database', 'fa-table', 'fa-chart-line', 'fa-robot', 'fa-briefcase']) {
        assert.match(config, new RegExp(`'${icon}'`));
        assert.match(skills, new RegExp(icon));
    }
    assert.match(skills, /skill-name-icon/);
});

test('rejected skills draft copy is absent and component cache is refreshed', () => {
    assert.doesNotMatch(component, /Tools and disciplines I use/);
    assert.doesNotMatch(component, /CAPABILITY MATRIX/);
    assert.match(index, /data-build="20260809\.17"/);
});
