const { test, expect } = require('@playwright/test');

const baseUrl = 'http://127.0.0.1:4173/';
const responseBody = JSON.stringify({
    success: true, schemaVersion: 1,
    data: {
        profile: { Name: 'Md. Masum Billah', Title: 'Data Analyst | Automation Developer' },
        config: { experience_title: 'Experience & Education' }, siteFeatures: {}, skills: [], projects: [], certificates: [], blogs: [], faq: [], aiContext: {},
        experience: [
            { Period: 'June 2026 – Present', Title: 'MIS Executive', Company: 'P.T. Consumer Products Industries', Description: 'Prepared MIS and KPI reports, analyzed sales performance, built dashboards, managed datasets, and automated reporting workflows.' },
            { Period: 'June 2025 – May 2026', Title: 'Data Analyst', Company: 'Data Solution 360', Description: 'Developed automated data pipelines, designed Apps Script automations, and built custom reporting systems.' },
            { Period: '2023 – 2025', Title: 'Accounts Executive', Company: 'Orient Button Ltd.', Description: 'Created advanced Excel dashboards and automated recurring monthly reporting.' }
        ],
        education: [{ Period: '2018 – 2022', Degree: 'Bachelor of Business Administration (BBA)', Institution: 'Mohammadpur Kendriya College', Description: 'Specialized in Marketing with coursework in business analytics, statistics, and strategic management.' }]
    }
});

async function loadTree(page, path) {
    await page.route('https://script.google.com/**', route => route.fulfill({ status: 200, contentType: 'application/json; charset=utf-8', body: responseBody }));
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    await page.waitForFunction(() => document.getElementById('loader')?.style.display === 'none', null, { timeout: 15000 });
    await page.locator('#experience').scrollIntoViewIfNeeded();
    if (path.includes('preview=career-tree')) {
        await page.waitForFunction(() => {
            const image = document.querySelector('.career-tree-art');
            return image && image.complete && image.naturalWidth > 0;
        }, null, { timeout: 15000 });
    }
}

test('normal timeline remains unchanged', async ({ page }) => {
    await loadTree(page, '#experience');
    await expect(page.locator('html')).not.toHaveClass(/career-tree-preview/);
    await expect(page.locator('.career-data-ground')).toHaveCount(0);
});

for (const theme of ['light', 'dark']) {
    test(`career tree renders on desktop in ${theme} mode`, async ({ page }) => {
        await page.addInitScript(value => localStorage.setItem('portfolio-public-theme', value), theme);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loadTree(page, '?preview=career-tree#experience');
        await expect(page.locator('.timeline-item')).toHaveCount(4);
        await expect(page.locator('.career-tree-art')).toBeVisible();
        await page.locator('.career-tree-art').screenshot({ path: `test-results/career-tree-art-${theme}.png` });
        await expect(page.locator('.career-data-ground')).toHaveCount(0);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: `test-results/career-tree-desktop-${theme}.png`, fullPage: false });
    });
}

test('career tree remains readable on mobile', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-public-theme', 'dark'));
    await page.setViewportSize({ width: 390, height: 844 });
    await loadTree(page, '?preview=career-tree#experience');
    await expect(page.locator('.timeline-content').first()).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/career-tree-mobile-dark.png', fullPage: false });
});
