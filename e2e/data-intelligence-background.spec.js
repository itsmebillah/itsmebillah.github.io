const { test, expect } = require('@playwright/test');

const baseUrl = 'http://127.0.0.1:4173/';

async function waitForPortfolio(page) {
    const loader = page.locator('#loader');
    await expect(loader).toBeAttached({ timeout: 10000 });
    await expect(loader).toBeHidden({ timeout: 30000 });
}

test('normal portfolio keeps the draft background disabled', async ({ page }) => {
    await page.goto(baseUrl);
    await waitForPortfolio(page);
    await expect(page.locator('html')).not.toHaveClass(/data-intelligence-preview/);
    await expect(page.locator('.data-visual')).toHaveCount(0);
});

for (const theme of ['light', 'dark']) {
    test(`data intelligence draft renders cleanly on desktop in ${theme} mode`, async ({ page }) => {
        const errors = [];
        page.on('pageerror', error => errors.push(error.message));
        await page.addInitScript(value => localStorage.setItem('portfolio-public-theme', value), theme);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(`${baseUrl}?preview=data-intelligence`);
        await waitForPortfolio(page);
        await expect(page.locator('html')).toHaveClass(/data-intelligence-preview/);
        await expect(page.locator('.data-visual')).toHaveCount(18);
        await expect(page.locator('body')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(errors).toEqual([]);
        await page.screenshot({ path: `test-results/data-intelligence-desktop-${theme}.png`, fullPage: false });
    });
}

test('data intelligence draft reduces density on mobile', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('portfolio-public-theme', 'dark'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}?preview=data-intelligence`);
    await waitForPortfolio(page);
    await expect(page.locator('.data-visual')).toHaveCount(18);
    const visibleCount = await page.locator('.data-visual').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length);
    expect(visibleCount).toBe(7);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await page.screenshot({ path: 'test-results/data-intelligence-mobile-dark.png', fullPage: false });
});

test('reduced motion disables ambient animation', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(`${baseUrl}?preview=data-intelligence`);
    await waitForPortfolio(page);
    await expect(page.locator('.data-visual').first()).toHaveCSS('animation-name', 'none');
});
