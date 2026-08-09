const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const read = file => fs.readFileSync(path.join(root, file), 'utf8');
const api = read('assets/js/api.js');
const content = read('assets/modules/content.js');
const hero = read('assets/modules/hero.js');
const seo = read('assets/js/seo.js');
const code = read('apps-script/Code.js');
const admin = read('apps-script/Admin.js');
const index = read('index.html');

test('one public payload feeds centralized portfolio state and every collection', () => {
  assert.match(api, /window\.portfolioData = payload/);
  for (const section of ['profile', 'config', 'skills', 'projects', 'experience', 'education', 'certificates', 'blogs', 'faq']) {
    assert.match(api + content, new RegExp(`payload\\.${section}`));
  }
  assert.equal((api.match(/fetch\(/g) || []).length, 1);
});

test('profile content, resume, social links, and manual image come from the profile DTO', () => {
  for (const field of ['Name', 'Title', 'HeroQuote', 'Bio', 'AboutMe', 'Email', 'Phone', 'Location', 'Facebook', 'LinkedIn', 'WhatsApp', 'GitHub', 'ResumeURL', 'ProfilePic']) {
    assert.match(hero + content, new RegExp(`['\"]${field}['\"]`));
  }
  assert.doesNotMatch(hero, /Masum Billah|Data Analyst|drive\.google\.com|postimg/);
  assert.match(index, /assets\/modules\/content\.js/);
});

test('config DTO allowlists section text and public SEO without exposing private settings', () => {
  for (const key of ['footer_text', 'chatbot_name', 'faq_section_title', 'site_title', 'meta_description', 'canonical_url', 'og_image']) {
    assert.match(code, new RegExp(`['\"]${key}['\"]`));
    assert.match(admin, new RegExp(`['\"]${key}['\"]`));
  }
  assert.doesNotMatch(code.match(/function buildPublicConfig_[\s\S]*?\n}/)[0], /system_prompt|AI_Knowledge|password|token|credential/i);
});

test('FAQ, footer, runtime SEO, and empty image fallbacks are data-driven', () => {
  assert.match(content, /function renderFAQ/);
  assert.match(content, /footer_text/);
  assert.match(content, /buildPortfolioSEO/);
  assert.match(seo, /function buildPortfolioSEO/);
  assert.match(read('components/faq.html'), /faqContainer/);
  assert.match(read('components/footer.html'), /portfolioFooter/);
  assert.doesNotMatch(read('assets/modules/certificates.js'), /images\.unsplash\.com/);
});

test('profile and project images retry transient failures before showing fallback', () => {
  const utils = read('assets/js/utils.js');
  const projects = read('assets/modules/projects.js');
  assert.match(utils, /function loadImageWithRetry/);
  assert.match(utils, /attempt < retries/);
  assert.match(hero, /loadImageWithRetry\(profileImage, manualImage/);
  assert.match(projects, /data-project-src=/);
  assert.doesNotMatch(projects, /<img src="\$\{escapeHtml\(image\)\}/);
  assert.match(projects, /loadImageWithRetry\(image, source/);
});

test('GitHub-backed and manual projects remain merged exclusively on the server', () => {
  const sync = read('apps-script/GitHubSync.js');
  assert.match(sync, /githubProjects\.concat\(manualProjects\)/);
  assert.match(api, /renderProjects\(payload\.projects\)/);
  assert.doesNotMatch(read('assets/modules/projects.js'), /GitHub_Project_Snapshot|Portfolio_Project_Curation|Manual_Portfolio_Projects/);
});
