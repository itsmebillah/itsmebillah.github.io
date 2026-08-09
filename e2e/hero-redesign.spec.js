const { test, expect } = require('@playwright/test');

const baseUrl = 'http://127.0.0.1:4173/';
const responseBody = JSON.stringify({
    success: true,
    schemaVersion: 1,
    data: {
        profile: {
            Name: 'Md. Masum Billah',
            Title: 'Data Analyst | Automation Developer | Business Intelligence Specialist',
            HeroQuote: 'Transforming Data into Business Decisions',
            ProfilePic: 'https://avatars.githubusercontent.com/u/230885789?v=4',
            LinkedIn: 'https://linkedin.com/in/itsmebillah',
            GitHub: 'https://github.com/itsmebillah',
            Facebook: 'https://www.facebook.com/itsmebillah',
            WhatsApp: 'https://wa.me/8801915966721'
        },
        config: {}, siteFeatures: {}, skills: [], projects: [], certificates: [], blogs: [],
        experience: [], education: [], faq: [], aiContext: {}
    }
});

async function loadHero(page, path = '') {
    await page.route('https://script.google.com/**', route => route.fulfill({
        status: 200,
        contentType: 'application/json; charset=utf-8',
        body: responseBody
    }));
    await page.goto(`${baseUrl}${path}`, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#heroName')).toHaveText('Md. Masum Billah');
    await expect(page.locator('#loader')).toBeHidden({ timeout: 15000 });
    await page.waitForFunction(() => {
        const image = document.getElementById('profileImage');
        return image && image.complete && image.naturalWidth > 0 && !image.classList.contains('hidden');
    }, null, { timeout: 15000 });
}

test('normal hero remains unchanged while the redesign is a draft', async ({ page }) => {
    await loadHero(page);
    await expect(page.locator('html')).not.toHaveClass(/hero-redesign-preview/);
    await expect(page.locator('.hero-kicker')).toBeHidden();
    await expect(page.locator('.hero-role')).toHaveCount(0);
    await expect(page.locator('#heroTitle')).toHaveText('Data Analyst | Automation Developer | Business Intelligence Specialist');
});

for (const theme of ['light', 'dark']) {
    test(`hero redesign renders on desktop in ${theme} mode`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(value => localStorage.setItem('portfolio-public-theme', value), theme);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await loadHero(page, '?preview=hero-redesign');

        await expect(page.locator('html')).toHaveClass(/hero-redesign-preview/);
        await expect(page.locator('.hero-role')).toHaveCount(3);
        await expect(page.locator('.hero-system-flow')).toBeVisible();
        await expect(page.locator('.hero-orbit')).toHaveCount(4);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(errors).toEqual([]);
        await page.screenshot({ path: `test-results/hero-redesign-desktop-${theme}.png`, fullPage: false });
    });
}

test('hero redesign remains readable on mobile', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-public-theme', 'dark'));
    await page.setViewportSize({ width: 390, height: 844 });
    await loadHero(page, '?preview=hero-redesign');

    await expect(page.locator('.hero-role')).toHaveCount(3);
    await expect(page.locator('.hero-system-flow')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/hero-redesign-mobile-dark.png', fullPage: false });
});
