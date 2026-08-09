const { test, expect } = require('@playwright/test');

const baseUrl = 'http://127.0.0.1:4173/';

async function holdPortfolioApi(page) {
    await page.addInitScript(() => {
        const nativeFetch = window.fetch.bind(window);
        window.fetch = (input, init) => String(input).includes('script.google.com')
            ? new Promise(() => {})
            : nativeFetch(input, init);
    });
}

async function waitForPortfolio(page) {
    await page.waitForFunction(() => window.__portfolioComponentsLoaded === true, null, { timeout: 15000 });
    await expect(page.locator('body')).not.toHaveClass(/portfolio-loading/, { timeout: 30000 });
    await expect(page.locator('#loader')).toBeHidden();
    await page.waitForTimeout(1200);
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
        await expect(page.locator('.data-visual')).toHaveCount(42);
        await expect(page.locator('body')).toBeVisible();
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        expect(errors).toEqual([]);
        await page.screenshot({ path: `test-results/data-intelligence-desktop-${theme}.png`, fullPage: false });
    });
}

test('analytics loader remains readable on mobile', async ({ page }) => {
    await holdPortfolioApi(page);
    await page.addInitScript(() => localStorage.setItem('portfolio-public-theme', 'dark'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}?preview=data-intelligence`);
    await page.waitForFunction(() => window.__portfolioComponentsLoaded === true);

    await expect(page.locator('.intelligence-loader-stage')).toBeVisible();
    await expect(page.locator('.pipeline-core')).toBeVisible();
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
    await page.screenshot({ path: 'test-results/intelligence-loader-mobile-dark.png', fullPage: false });
});

test('data intelligence draft reduces density on mobile', async ({ page }) => {
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => localStorage.setItem('portfolio-public-theme', 'dark'));
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${baseUrl}?preview=data-intelligence`);
    await waitForPortfolio(page);
    await expect(page.locator('.data-visual')).toHaveCount(42);
    const visibleCount = await page.locator('.data-visual').evaluateAll(nodes => nodes.filter(node => getComputedStyle(node).display !== 'none').length);
    expect(visibleCount).toBe(15);
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

test('added text and icons change color when the theme changes', async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem('portfolio-public-theme', 'dark'));
    await page.goto(`${baseUrl}?preview=data-intelligence`);
    await waitForPortfolio(page);

    const tool = page.locator('.data-visual-tool').first();
    const icon = tool.locator('.data-brand-icon svg');
    const darkText = await tool.evaluate(element => getComputedStyle(element).color);
    const darkIcon = await icon.evaluate(element => getComputedStyle(element).stroke);

    await page.locator('[data-public-theme-select]').first().selectOption('light');
    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
    await expect(tool).toHaveCSS('color', 'rgba(27, 73, 47, 0.38)');
    await page.waitForTimeout(300);
    const lightText = await tool.evaluate(element => getComputedStyle(element).color);
    const lightIcon = await icon.evaluate(element => getComputedStyle(element).stroke);

    expect(lightText).not.toBe(darkText);
    expect(lightIcon).not.toBe(darkIcon);
});

for (const theme of ['light', 'dark']) {
    test(`analytics loader renders in ${theme} mode without changing the legacy loader`, async ({ page }) => {
        await holdPortfolioApi(page);
        await page.addInitScript(value => localStorage.setItem('portfolio-public-theme', value), theme);
        await page.setViewportSize({ width: 1440, height: 1000 });
        await page.goto(`${baseUrl}?preview=data-intelligence`);
        await page.waitForFunction(() => window.__portfolioComponentsLoaded === true);

        await expect(page.locator('#loader')).toBeVisible();
        await expect(page.locator('.legacy-loader-stage')).toBeHidden();
        await expect(page.locator('.intelligence-loader-stage')).toBeVisible();
        await expect(page.locator('#loaderCorePercent')).toHaveText(/\d+%/);
        expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
        await page.screenshot({ path: `test-results/intelligence-loader-${theme}.png`, fullPage: false });
    });
}
