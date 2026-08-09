const assert = require('node:assert/strict');
const fs = require('node:fs');
const test = require('node:test');

const config = fs.readFileSync('assets/js/config.js', 'utf8');
const skills = fs.readFileSync('assets/modules/skills.js', 'utf8');

test('technical skills use supported local icons', () => {
    for (const icon of ['fa-code', 'fa-database', 'fa-table', 'fa-chart-line', 'fa-robot', 'fa-briefcase']) {
        assert.match(config, new RegExp(`'${icon}'`));
        assert.match(skills, new RegExp(icon));
    }
    assert.match(skills, /skill-name-icon/);
});
