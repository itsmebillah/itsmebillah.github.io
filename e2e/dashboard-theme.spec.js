const { test, expect } = require('@playwright/test');

const baseURL = `${process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:4173'}/admin/`;

async function themeState(page) {
  return page.evaluate(() => ({
    selected: document.getElementById('themeSelect').value,
    attribute: document.documentElement.getAttribute('data-theme'),
    background: getComputedStyle(document.body).backgroundColor,
    text: getComputedStyle(document.body).color
  }));
}

test('system preference follows light and dark operating-system modes', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'light' });
  await page.goto(baseURL);
  const light = await themeState(page);
  expect(light.selected).toBe('system');
  expect(light.attribute).toBeNull();

  await page.emulateMedia({ colorScheme: 'dark' });
  const dark = await themeState(page);
  expect(dark.selected).toBe('system');
  expect(dark.background).not.toBe(light.background);
  expect(dark.text).not.toBe(light.text);
});

for (const viewport of [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`${viewport.name} manual light and dark themes persist`, async ({ page }) => {
    await page.setViewportSize(viewport);
    await page.goto(baseURL);
    await page.locator('#themeSelect').selectOption('light');
    const light = await themeState(page);
    expect(light.attribute).toBe('light');
    await page.reload();
    expect((await themeState(page)).selected).toBe('light');

    await page.locator('#themeSelect').selectOption('dark');
    const dark = await themeState(page);
    expect(dark.attribute).toBe('dark');
    expect(dark.background).not.toBe(light.background);
    await page.reload();
    expect((await themeState(page)).selected).toBe('dark');
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    await expect(page.locator('#loginView')).toBeVisible();
  });
}
