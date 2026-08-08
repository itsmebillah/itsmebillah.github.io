const fs = require('node:fs');
const { test, expect } = require('@playwright/test');

const dtoPath = process.env.PORTFOLIO_DTO_PATH;
const baseURL = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:4173';
const responseBody = dtoPath ? fs.readFileSync(dtoPath, 'utf8') : '';
const payload = responseBody ? JSON.parse(responseBody).data : null;

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`${viewport.name} renders the captured public DTO`, async ({ page }) => {
    test.skip(!payload, 'PORTFOLIO_DTO_PATH is required.');
    const errors = [];
    page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
    page.on('pageerror', error => errors.push(error.message));
    await page.setViewportSize(viewport);
    await page.route('https://script.google.com/**', route => route.fulfill({
      status: 200,
      contentType: 'application/json; charset=utf-8',
      body: responseBody
    }));
    await page.goto(baseURL, { waitUntil: 'domcontentloaded' });
    await expect(page.locator('#heroName')).toHaveText(String(payload.profile.Name));
    await expect(page.locator('#skillsContainer .skill-container')).toHaveCount(payload.skills.length);
    await expect(page.locator('[data-project-image], .project-image-fallback').first()).toBeVisible();
    await expect(page.locator('#faqContainer details')).toHaveCount(payload.faq.length);
    await expect(page.locator('#portfolioFooter')).not.toBeEmpty();
    const expectedTitle = payload.config.site_title || [payload.profile.Name, payload.profile.Title].filter(Boolean).join(' | ');
    await expect(page).toHaveTitle(expectedTitle);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
    expect(errors).toEqual([]);
  });
}
