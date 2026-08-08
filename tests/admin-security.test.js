const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');
const vm = require('node:vm');

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
  assert.equal(joined.includes('123456'), false);
  assert.equal(/ADMIN_PASSWORD_V1\s*[:=]\s*["'][^"']+["']/.test(joined), false);
  assert.equal(/gh[pousr]_[A-Za-z0-9]{20,}/.test(joined), false);
});

test('dashboard keeps session token in memory and uses the explicit admin router', () => {
  assert.match(dashboard, /let token=''/);
  assert.doesNotMatch(dashboard, /localStorage|sessionStorage|google\.script\.run/);
  assert.match(dashboard, /action:'admin'/);
  assert.match(code, /payload\.action === "admin"/);
  assert.match(code, /adminCall\(request\)/);
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
