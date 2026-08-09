const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const baseURL = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:4173';
const dtoPath = process.env.PORTFOLIO_DTO_PATH || path.join(os.tmpdir(), 'portfolio-image-audit-dto.json');
const responseBody = fs.existsSync(dtoPath) ? fs.readFileSync(dtoPath, 'utf8') : '';

async function prepare(page) {
  test.skip(!responseBody, 'A captured portfolio DTO is required.');
  await page.route('https://script.google.com/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body: responseBody
  }));
}

async function themeState(page) {
  return page.evaluate(() => ({
    preference: document.documentElement.dataset.themePreference,
    theme: document.documentElement.getAttribute('data-theme'),
    background: getComputedStyle(document.body).backgroundImage,
    text: getComputedStyle(document.body).color,
    meta: document.querySelector('meta[name="theme-color"]').content
  }));
}

test('System mode follows live operating-system color scheme changes', async ({ page }) => {
  await prepare(page);
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(baseURL);
  await expect(page.locator('[data-public-theme-select]').first()).toHaveValue('system');
  const light = await themeState(page);
  expect(light.theme).toBeNull();
  expect(light.meta.toLowerCase()).toBe('#f6f8f7');

  await page.emulateMedia({ colorScheme: 'dark' });
  await expect.poll(async () => (await themeState(page)).meta.toLowerCase()).toBe('#0b1120');
  const dark = await themeState(page);
  expect(dark.background).not.toBe(light.background);
  expect(dark.text).not.toBe(light.text);
  expect(dark.theme).toBeNull();
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`${viewport.name} manual themes persist and all public surfaces remain usable`, async ({ page }) => {
    await prepare(page);
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.goto(baseURL);
    if (viewport.name === 'mobile') await page.locator('#mobileNavToggle').click();
    const control = page.locator('[data-public-theme-select]:visible');

    await control.selectOption('light');
    let light = await themeState(page);
    expect(light.theme).toBe('light');
    await page.reload();
    if (viewport.name === 'mobile') await page.locator('#mobileNavToggle').click();
    await expect(page.locator('[data-public-theme-select]:visible')).toHaveValue('light');

    await page.locator('[data-public-theme-select]:visible').selectOption('dark');
    const dark = await themeState(page);
    expect(dark.theme).toBe('dark');
    expect(dark.background).not.toBe(light.background);
    await page.reload();
    await expect(page.locator('[data-public-theme-select]').first()).toHaveValue('dark');

    await page.locator('#chatToggle').click();
    await expect(page.locator('#chatWindow')).toBeVisible();
    await expect(page.locator('#chatInput')).toBeEditable();
    await page.locator('#closeChat').click();
    await expect(page.locator('#contactForm input').first()).toBeEditable();
    if (await page.locator('button[onclick^="openBlogArticle"]').count()) {
      await page.evaluate(() => openBlogModal(0));
      await expect(page.locator('#blogModal')).toBeVisible();
      await page.locator('.modal-close').click();
    }
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}

test('manual theme overrides the operating-system preference and System restores it', async ({ page }) => {
  await prepare(page);
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.goto(baseURL);
  const control = page.locator('[data-public-theme-select]:visible');
  await control.selectOption('light');
  expect((await themeState(page)).theme).toBe('light');
  await control.selectOption('system');
  const system = await themeState(page);
  expect(system.theme).toBeNull();
  expect(system.preference).toBe('system');
  expect(system.meta.toLowerCase()).toBe('#0b1120');
});
