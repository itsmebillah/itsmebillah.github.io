const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const baseURL = process.env.PORTFOLIO_TEST_URL || 'http://127.0.0.1:4173';
const dtoPath = process.env.PORTFOLIO_DTO_PATH || path.join(os.tmpdir(), 'portfolio-image-audit-dto.json');

for (const viewport of [
  { name: 'desktop', width: 1440, height: 1000 },
  { name: 'mobile', width: 390, height: 844 }
]) {
  test(`${viewport.name} hides disabled sections, data, navigation, and widgets`, async ({ page }) => {
    test.skip(!fs.existsSync(dtoPath), 'A captured portfolio DTO is required.');
    const response = JSON.parse(fs.readFileSync(dtoPath, 'utf8'));
    response.data.siteFeatures = {
      hero: { active: true, displayOrder: 10 }, about: { active: true, displayOrder: 20 },
      skills: { active: false, displayOrder: 30 }, projects: { active: false, displayOrder: 40 },
      certificates: { active: false, displayOrder: 50 }, blog: { active: false, displayOrder: 60 },
      experience: { active: false, displayOrder: 70 }, education: { active: true, displayOrder: 80 },
      faq: { active: false, displayOrder: 90 }, contact: { active: false, displayOrder: 100 },
      chatbot: { active: false, displayOrder: 110 }, resume: { active: false, displayOrder: 120 },
      social_links: { active: false, displayOrder: 130 }
    };
    await page.setViewportSize(viewport);
    await page.route('https://script.google.com/**', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(response) }));
    await page.goto(baseURL);
    await expect(page.locator('#loader')).toBeHidden();
    for (const id of ['skills', 'projects', 'certificates', 'blogs', 'faq', 'contact']) await expect(page.locator(`#${id}`)).toBeHidden();
    await expect(page.locator('#chatToggle')).toBeHidden();
    await expect(page.locator('#socialContainer')).toBeHidden();
    await expect(page.locator('#experience')).toBeVisible();
    await expect(page.locator('#timelineContainer')).not.toBeEmpty();
    if (viewport.name === 'mobile') await page.locator('#mobileNavToggle').click();
    await expect(page.locator('[data-feature-nav="skills"]:visible')).toHaveCount(0);
    await expect(page.locator('[data-feature-nav="experience,education"]:visible')).toHaveCount(1);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBe(false);
  });
}
