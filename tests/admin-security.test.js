const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');
const crypto = require('node:crypto');

const root = path.resolve(__dirname, '..');
const admin = fs.readFileSync(path.join(root, 'apps-script', 'Admin.js'), 'utf8');
const code = fs.readFileSync(path.join(root, 'apps-script', 'Code.js'), 'utf8');
const dashboard = fs.readFileSync(path.join(root, 'admin', 'index.html'), 'utf8');
const config = fs.readFileSync(path.join(root, 'assets', 'js', 'config.js'), 'utf8');
const navbar = fs.readFileSync(path.join(root, 'components', 'navbar.html'), 'utf8');

test('admin backend and dashboard JavaScript parse successfully', () => {
  new vm.Script(admin);
  const scripts = [...dashboard.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(match => match[1]);
  assert.equal(scripts.length, 1);
  new vm.Script(scripts[0]);
});

test('temporary password and credential material are absent from source', () => {
  const joined = [admin, code, dashboard, config, navbar].join('\n');
  const samplePassword = ['123', '456'].join('');
  assert.equal(joined.includes(samplePassword), false);
  assert.equal(/ADMIN_PASSWORD_V1\s*[:=]\s*["'][^"']+["']/.test(joined), false);
  assert.equal(/gh[pousr]_[A-Za-z0-9]{20,}/.test(joined), false);
});

test('dashboard keeps session token in memory and uses storage only for theme preference', () => {
  assert.match(dashboard, /let token=''/);
  assert.doesNotMatch(dashboard, /sessionStorage|google\.script\.run/);
  assert.match(dashboard, /portfolio-dashboard-theme/);
  assert.doesNotMatch(dashboard, /localStorage\.(setItem|getItem)\([^\n]*token/i);
  assert.match(dashboard, /action:'admin'/);
  assert.match(code, /payload\.action === "admin"/);
  assert.match(code, /adminCall\(request\)/);
});

test('dashboard implements system, light, dark, and centralized theme tokens', () => {
  assert.match(dashboard, /prefers-color-scheme:dark/);
  assert.match(dashboard, /value="system"/);
  assert.match(dashboard, /value="light"/);
  assert.match(dashboard, /value="dark"/);
  assert.match(dashboard, /--bg:/);
  assert.match(dashboard, /--panel:/);
  assert.match(dashboard, /--text:/);
  assert.match(dashboard, /applyTheme\(localStorage\.getItem/);
});

test('admin API exposes commands, not arbitrary sheet or range operations', () => {
  assert.doesNotMatch(admin, /payload\.(sheet|sheetName|range)/);
  assert.doesNotMatch(admin, /getSheetByName\(payload/);
  assert.match(admin, /case "projects\.github\.update"/);
  assert.match(admin, /case "entity\.save"/);
  assert.match(admin, /throw adminError_\("UNKNOWN_ADMIN_COMMAND"/);
});

test('authentication requires forced password change and server-side sessions', () => {
  assert.match(admin, /ADMIN_REQUIRE_PASSWORD_CHANGE/);
  assert.match(admin, /mustChangePassword/);
  assert.match(admin, /ADMIN_SESSION_/);
  assert.match(admin, /SESSION_EXPIRED/);
  assert.match(admin, /revokeAllAdminSessions_/);
  assert.match(admin, /pbkdf2-sha256/);
  assert.match(admin, /constantTimeEqual_/);
});

test('frontend and backend enforce the same six-character password policy', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(admin, context);
  assert.equal(context.isAdminPasswordValid_('Aa1!aa'), true);
  assert.equal(context.isAdminPasswordValid_('Aa1!a'), false);
  assert.equal(context.isAdminPasswordValid_('aa1!aa'), false);
  assert.equal(context.isAdminPasswordValid_('AA1!AA'), false);
  assert.equal(context.isAdminPasswordValid_('Aaa!aa'), false);
  assert.equal(context.isAdminPasswordValid_('Aa11aa'), false);
  const message = 'Use at least 6 characters with uppercase, lowercase, number, and symbol.';
  assert.match(admin, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(dashboard, new RegExp(message.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')));
  assert.match(dashboard, /minlength="6"/);
  assert.match(dashboard, /const isPasswordValid=/);
});

test('password verifier uses byte-array HMAC, unique salt, and rejects wrong password', () => {
  const context = {
    Utilities: {
      newBlob(value) { return { getBytes: () => [...Buffer.from(String(value), 'utf8')] }; },
      base64EncodeWebSafe(value) { return Buffer.from(value).toString('base64url'); },
      base64DecodeWebSafe(value) { return [...Buffer.from(value, 'base64url')]; },
      computeHmacSha256Signature(value, key) {
        assert.ok(Array.isArray(value), 'HMAC message must be a byte array');
        assert.ok(Array.isArray(key), 'HMAC key must be a byte array');
        return [...crypto.createHmac('sha256', Buffer.from(key)).update(Buffer.from(value)).digest()];
      },
      computeDigest(_algorithm, value) { return [...crypto.createHash('sha256').update(String(value)).digest()]; },
      getUuid() { return crypto.randomUUID(); },
      DigestAlgorithm: { SHA_256: 'SHA_256' }
    }
  };
  vm.createContext(context);
  vm.runInContext(admin, context);
  const first = context.createPasswordVerifier_('temporary-test-value');
  const second = context.createPasswordVerifier_('temporary-test-value');
  assert.notEqual(first, second);
  assert.equal(context.verifyPassword_('temporary-test-value', first), true);
  assert.equal(context.verifyPassword_('wrong-value', first), false);
  assert.equal(first.includes('temporary-test-value'), false);
  assert.match(first, /^pbkdf2-sha256\$20000\$/);
});

test('bootstrap property is deleted only after verifier persistence succeeds', () => {
  const setIndex = admin.indexOf('setProperty(ADMIN_CONFIG.properties.password, createPasswordVerifier_(bootstrap))');
  const deleteIndex = admin.indexOf('deleteProperty(ADMIN_CONFIG.properties.bootstrap)');
  assert.ok(setIndex >= 0);
  assert.ok(deleteIndex > setIndex);
});

test('dashboard schema cleanup shifts only an exact schema behind an empty leading column', () => {
  const context = {};
  vm.createContext(context);
  vm.runInContext(admin, context);
  const required = ['record_id', 'title', 'active'];
  assert.equal(context.dashboardSchemaMigrationState_(required, required, false), 'ready');
  assert.equal(context.dashboardSchemaMigrationState_(['', ...required], required, false), 'shift');
  assert.throws(() => context.dashboardSchemaMigrationState_(['', ...required], required, true), /DASHBOARD_SCHEMA_CONFLICT/);
  assert.throws(() => context.dashboardSchemaMigrationState_(['', 'wrong', 'title', 'active'], required, false), /DASHBOARD_SCHEMA_CONFLICT/);
  assert.match(admin, /function cleanupDashboardSchema\(\)/);
  assert.match(admin, /normalizeLeadingBlankSchemaColumn_\(sheet, config\)/);
});

test('private and GitHub-owned boundaries remain explicit', () => {
  assert.match(admin, /private: true/);
  assert.match(admin, /GITHUB_SYNC_CONFIG\.curationHeaders\.slice\(2\)/);
  assert.doesNotMatch(admin, /updateTableRecordById_\(MASTER_CONFIG\.tabs\.githubSnapshot/);
  assert.match(code, /buildPrivateAiContext_/);
});

test('public Login link uses one centralized dashboard URL', () => {
  assert.match(config, /const DASHBOARD_URL = 'https:\/\/itsmebillah\.github\.io\/admin\/'/);
  assert.equal((navbar.match(/data-dashboard-login/g) || []).length, 2);
  assert.match(fs.readFileSync(path.join(root, 'assets', 'js', 'app.js'), 'utf8'), /link\.href = DASHBOARD_URL/);
});

test('profile image remains manual, responsive, eager, and failure-safe', () => {
  const hero = fs.readFileSync(path.join(root, 'assets', 'modules', 'hero.js'), 'utf8');
  const heroMarkup = fs.readFileSync(path.join(root, 'components', 'hero.html'), 'utf8');
  const css = fs.readFileSync(path.join(root, 'assets', 'css', 'main.css'), 'utf8');
  assert.match(hero, /readObjProp\(p, 'ProfilePic'\)/);
  assert.doesNotMatch(hero, /ProfilePic[^\n]*(github|opengraph)/i);
  assert.match(hero, /loadImageWithRetry\(profileImage, manualImage/);
  assert.match(hero, /onFailure: showProfileFallback/);
  assert.match(hero, /profileImage\.loading = 'eager'/);
  assert.match(heroMarkup, /profileImageFallback/);
  assert.match(css, /\.profile-image-frame/);
  assert.match(css, /object-fit: cover/);
  assert.match(css, /object-position: center/);
});
