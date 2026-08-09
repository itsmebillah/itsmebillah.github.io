const { test, expect } = require('@playwright/test');

const baseUrl = 'http://127.0.0.1:4173/';
const skillData = [
    ['Google Apps Script', 80, 'Automation'], ['SQL', 85, 'Data Analysis'],
    ['Python', 80, 'Programming'], ['Excel', 80, 'Data Analysis'],
    ['Power BI', 85, 'Data Visualization'], ['Data Analysis', 88, 'Analytics'],
    ['Automation', 75, 'Technical'], ['Google Sheet', 80, 'Data Analysis']
];
const responseBody = JSON.stringify({
    success: true,
    schemaVersion: 1,
    data: {
        profile: { Name: 'Md. Masum Billah', Title: 'Data Analyst | Automation Developer' },
        config: { skills_title: 'Technical Skills' }, siteFeatures: {},
        skills: skillData.map(([Name, Level, Category], index) => ({ Name, Level, Category, Order: index + 1 })),
        projects: [], certificates: [], blogs: [], experience: [], education: [], faq: [], aiContext: {}
    }
});

async function loadSkills(page, path = '') {
    await page.route('https://script.google.com/**', route => route.fulfill({
        status: 200, contentType: 'application/json; charset=utf-8', body: responseBody
    }));
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('loader')?.style.display === 'none', null, { timeout: 15000 });
    await page.locator('#skills').scrollIntoViewIfNeeded();
    await expect(page.locator('#skills')).toBeVisible();
}

test('normal skills presentation remains unchanged', async ({ page }) => {
    await loadSkills(page);
    await expect(page.locator('html')).not.toHaveClass(/skills-redesign-preview/);
    await expect(page.locator('.skills-eyebrow')).toBeHidden();
    await expect(page.locator('.skill-container')).toHaveCount(8);
});

for (const theme of ['light', 'dark']) {
    test(`skills matrix renders on desktop in ${theme} mode`, async ({ page }) => {
        await page.addInitScript(value => localStorage.setItem('portfolio-public-theme', value), theme);
        await page.setViewportSize({ width: 1440, height: 900 });
        await loadSkills(page, '?preview=skills-redesign#skills');
        await expect(page.locator('html')).toHaveClass(/skills-redesign-preview/);
        await expect(page.locator('.skill-icon')).toHaveCount(8);
        await expect(page.locator('.skill-segments')).toHaveCount(8);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: `test-results/skills-redesign-desktop-${theme}.png`, fullPage: false });
    });
}

test('skills matrix remains readable on mobile', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-public-theme', 'dark'));
    await page.setViewportSize({ width: 390, height: 844 });
    await loadSkills(page, '?preview=skills-redesign#skills');
    await expect(page.locator('.skill-container').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/skills-redesign-mobile-dark.png', fullPage: false });
});
