const fs = require('node:fs');
const { test, expect, chromium } = require('@playwright/test');

const dtoPath = process.env.PORTFOLIO_DTO_PATH;
const responseBody = dtoPath ? fs.readFileSync(dtoPath, 'utf8') : '';
const payload = responseBody ? JSON.parse(responseBody).data : null;
const productionURL = process.env.PORTFOLIO_PRODUCTION_URL || 'https://itsmebillah.github.io/';
test.setTimeout(120000);

async function verifyImages(browser, options, diagnostic = {}) {
  const context = await browser.newContext(options);
  const page = await context.newPage();
  const failures = [];
  const targetURLs = new Set([payload.profile.ProfilePic, ...payload.projects.map(project => project.image)]);
  page.on('requestfailed', request => {
    if (request.resourceType() === 'image' && targetURLs.has(request.url())) failures.push({ url: request.url(), error: request.failure()?.errorText });
  });
  await page.route('https://script.google.com/**', route => route.fulfill({
    status: 200,
    contentType: 'application/json; charset=utf-8',
    body: responseBody
  }));
  if (diagnostic.failFirstAttempt) {
    for (const url of targetURLs) {
      let failed = false;
      await page.route(url, route => {
        if (!failed) {
          failed = true;
          return route.abort('internetdisconnected');
        }
        return route.continue();
      });
    }
  }
  await page.goto(productionURL, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#heroName')).toHaveText(String(payload.profile.Name));
  const images = page.locator('#profileImage, [data-project-image]');
  await expect(images).toHaveCount(payload.projects.length + 1);
  for (let index = 0; index < await images.count(); index++) {
    const image = images.nth(index);
    await image.evaluate(node => node.scrollIntoView({ block: 'center' }));
    await expect.poll(() => image.evaluate(node => node.complete ? node.naturalWidth : 0), { timeout: 15000 })
      .toBeGreaterThan(0);
  }
  const state = await images.evaluateAll(nodes => nodes.map(node => ({
    src: node.currentSrc || node.src,
    complete: node.complete,
    naturalWidth: node.naturalWidth,
    naturalHeight: node.naturalHeight,
    hidden: node.classList.contains('hidden')
  })));
  expect(state.every(image => image.complete && image.naturalWidth > 0 && image.naturalHeight > 0 && !image.hidden)).toBe(true);
  if (diagnostic.failFirstAttempt) {
    expect(failures).toHaveLength(targetURLs.size);
    expect(new Set(failures.map(failure => failure.url)).size).toBe(targetURLs.size);
  } else {
    expect(failures).toEqual([]);
  }
  await context.close();
  return state;
}

test('production images decode in desktop Chrome and Android Chrome', async ({ browser }) => {
  test.skip(!payload, 'PORTFOLIO_DTO_PATH is required.');
  await verifyImages(browser, { viewport: { width: 1440, height: 1000 } });
  await verifyImages(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36'
  });
});

test('production images decode in installed Brave with an Android viewport', async () => {
  test.skip(!payload, 'PORTFOLIO_DTO_PATH is required.');
  const browser = await chromium.launch({ executablePath: 'C:\\Program Files\\BraveSoftware\\Brave-Browser\\Application\\brave.exe', headless: true });
  try {
    await verifyImages(browser, {
      viewport: { width: 390, height: 844 },
      isMobile: true,
      hasTouch: true,
      userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36'
    });
  } finally {
    await browser.close();
  }
});

test('profile and project images recover from one transient mobile failure', async ({ browser }) => {
  test.skip(!payload, 'PORTFOLIO_DTO_PATH is required.');
  await verifyImages(browser, {
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/138.0.0.0 Mobile Safari/537.36'
  }, { failFirstAttempt: true });
});
