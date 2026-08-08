const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

function createContext() {
    const cache = new Map();
    const properties = new Map();
    const context = vm.createContext({
        console: { error() {}, warn() {}, log() {} },
        CacheService: {
            getScriptCache: () => ({
                get: key => cache.get(key) || null,
                put: (key, value) => cache.set(key, value),
                remove: key => cache.delete(key)
            })
        },
        LockService: {
            getScriptLock: () => ({ waitLock() {}, releaseLock() {} })
        },
        PropertiesService: {
            getScriptProperties: () => ({
                getProperty: key => properties.get(key) || null,
                setProperty: (key, value) => properties.set(key, String(value)),
                deleteProperty: key => properties.delete(key)
            })
        },
        Utilities: {
            DigestAlgorithm: { SHA_256: 'SHA_256' },
            Charset: { UTF_8: 'UTF_8' },
            computeDigest: () => [1, 2, 3, 4, 5, 6, 7, 8],
            getUuid: () => 'test-uuid'
        },
        ContentService: {
            MimeType: { JSON: 'JSON' },
            createTextOutput: value => ({ setMimeType: () => value })
        }
    });
    const root = path.resolve(__dirname, '..');
    vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', 'Code.js'), 'utf8'), context);
    vm.runInContext(fs.readFileSync(path.join(root, 'apps-script', 'GitHubSync.js'), 'utf8'), context);
    return { context, cache, properties };
}

function evaluate(context, expression) {
    return vm.runInContext(expression, context);
}

function repository(overrides = {}) {
    return {
        github_repository_id: '101',
        github_node_id: 'R_101',
        repo_key: 'itsmebillah/example',
        name: 'example',
        description: 'Technical description',
        repository_url: 'https://github.com/itsmebillah/example',
        homepage_url: 'https://example.com',
        topics_json: '["data-analytics","automation"]',
        primary_language: 'JavaScript',
        visibility: 'public',
        archived: false,
        disabled: false,
        updated_at: '2026-08-08T00:00:00.000Z',
        readme_url: 'https://github.com/itsmebillah/example#readme',
        screenshot_url: '',
        screenshot_path: '',
        screenshot_alt: '',
        screenshot_source: '',
        screenshot_discovery_status: 'none',
        fetched_at: '2026-08-08T00:00:00.000Z',
        sync_state: 'active',
        last_seen_at: '2026-08-08T00:00:00.000Z',
        missing_since: '',
        ...overrides
    };
}

test('public profile mapper excludes private and unrelated columns', () => {
    const { context } = createContext();
    context.__sheet = {
        getDataRange: () => ({
            getValues: () => [
                ['Name', 'Title', 'Email', 'Phone', 'sex', 'Age', 'Maritial status', 'InternalNote'],
                ['Masum', 'Data Analyst', 'public@example.com', 'public-phone', 'private', 'private', 'private', 'private']
            ]
        })
    };
    context.__ss = { getSheetByName: () => context.__sheet };
    const result = evaluate(context, 'buildPublicProfile_(__ss)');
    assert.equal(result.Name, 'Masum');
    assert.equal(result.Email, 'public@example.com');
    assert.equal(Object.hasOwn(result, 'sex'), false);
    assert.equal(Object.hasOwn(result, 'Age'), false);
    assert.equal(Object.hasOwn(result, 'Maritial status'), false);
    assert.equal(Object.hasOwn(result, 'InternalNote'), false);
});

test('contact validation rejects malformed and unsafe input', () => {
    const { context } = createContext();
    assert.throws(() => evaluate(context, `validateContactPayload_({name:'A',email:'invalid',message:'hello'})`));
    assert.throws(() => evaluate(context, `validateContactPayload_({name:'A',email:'a@example.com',subject:'bad\\nheader',message:'hello'})`));
    const valid = evaluate(context, `validateContactPayload_({name:' Masum ',email:'USER@Example.com',subject:'Hello',message:'Question'})`);
    assert.deepEqual(JSON.parse(JSON.stringify(valid)), {
        name: 'Masum', email: 'user@example.com', subject: 'Hello', message: 'Question'
    });
});

test('repository normalization allowlists fields and requires HTTPS URLs', () => {
    const { context } = createContext();
    context.__repo = {
        id: 101,
        node_id: 'R_101',
        full_name: 'itsmebillah/example',
        name: 'example',
        description: 'Description',
        html_url: 'https://github.com/itsmebillah/example',
        homepage: 'javascript:alert(1)',
        topics: ['data-analytics', 'Bad Topic'],
        language: 'JavaScript',
        visibility: 'public',
        archived: false,
        disabled: false,
        license: { spdx_id: 'MIT' },
        stargazers_count: 2,
        forks_count: 1,
        default_branch: 'main',
        created_at: '2026-01-01T00:00:00Z',
        updated_at: '2026-02-01T00:00:00Z',
        pushed_at: '2026-02-01T00:00:00Z',
        secret: 'must-not-survive'
    };
    const result = evaluate(context, `normalizeGitHubRepository_(__repo, '2026-08-08T00:00:00.000Z')`);
    assert.equal(result.homepage_url, '');
    assert.deepEqual(JSON.parse(result.topics_json), ['data-analytics']);
    assert.equal(Object.hasOwn(result, 'secret'), false);
});

test('repository rename preserves immutable identity and curation join', () => {
    const { context } = createContext();
    context.__previous = [repository({ repo_key: 'itsmebillah/old-name', name: 'old-name' })];
    context.__current = [repository({ repo_key: 'itsmebillah/new-name', name: 'new-name' })];
    const result = evaluate(context, `reconcileRepositorySnapshot_(__previous, __current, new Date('2026-08-08T00:00:00Z'))`);
    assert.equal(result.length, 1);
    assert.equal(result[0].github_repository_id, '101');
    assert.equal(result[0].repo_key, 'itsmebillah/new-name');
});

test('missing repository is retained as unavailable without being public', () => {
    const { context } = createContext();
    context.__previous = [repository()];
    const retained = evaluate(context, `reconcileRepositorySnapshot_(__previous, [], new Date('2026-08-08T00:00:00Z'))`);
    assert.equal(retained.length, 1);
    assert.equal(retained[0].sync_state, 'unavailable');
    assert.ok(retained[0].missing_since);
});

test('new repository is not published without explicit curation', () => {
    const { context } = createContext();
    context.loadLastGoodSnapshot_ = () => [repository()];
    context.readSheetObjects_ = (ss, name) => name === 'Portfolio_Project_Curation' ? [] : [];
    context.__ss = {};
    const result = evaluate(context, 'buildPublicProjects_(__ss)');
    assert.equal(result.length, 0);
});

test('curated repository merges technical facts with editorial overrides', () => {
    const { context } = createContext();
    context.loadLastGoodSnapshot_ = () => [repository()];
    context.readSheetObjects_ = (ss, name) => {
        if (name === 'Portfolio_Project_Curation') return [{
            github_repository_id: '101',
            repo_key: 'itsmebillah/example',
            show_on_portfolio: true,
            featured: true,
            display_order: 2,
            category: 'Business Intelligence',
            custom_title: 'Example Platform',
            custom_description: 'Reviewed portfolio description',
            portfolio_image: 'https://example.com/preview.png',
            visibility_note: 'must remain internal'
        }];
        return [];
    };
    context.__ss = {};
    const result = evaluate(context, 'buildPublicProjects_(__ss)');
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Example Platform');
    assert.equal(result[0].url, 'https://github.com/itsmebillah/example');
    assert.equal(result[0].source, 'GITHUB');
    assert.equal(result[0].featured, true);
    assert.equal(result[0].image, 'https://example.com/preview.png');
    assert.equal(result[0].imageAlt, 'Example Platform project preview');
    assert.equal(Object.hasOwn(result[0], 'visibility_note'), false);
});

test('archived repository is hidden unless curated as completed', () => {
    const { context } = createContext();
    context.loadLastGoodSnapshot_ = () => [repository({ archived: true })];
    context.__curation = [{ github_repository_id: '101', show_on_portfolio: true, portfolio_status: 'active' }];
    context.readSheetObjects_ = (ss, name) => name === 'Portfolio_Project_Curation' ? context.__curation : [];
    context.__ss = {};
    assert.equal(evaluate(context, 'buildPublicProjects_(__ss)').length, 0);
    context.__curation[0].portfolio_status = 'completed';
    assert.equal(evaluate(context, 'buildPublicProjects_(__ss)').length, 1);
});

test('missing demo and description use a GitHub-hosted project thumbnail', () => {
    const { context } = createContext();
    context.__repo = repository({ description: '', homepage_url: '' });
    context.__curation = { show_on_portfolio: true };
    const result = evaluate(context, 'mapMergedProjectDto_(__repo, __curation)');
    assert.equal(result.description, '');
    assert.equal(result.demoUrl, '');
    assert.equal(result.image, 'https://opengraph.githubassets.com/portfolio/itsmebillah/example');
    assert.equal(result.imageAlt, 'example project preview');
});

test('screenshot discovery prefers representative README UI over social cards', () => {
    const { context } = createContext();
    context.__repo = { full_name: 'itsmebillah/Sales-Dashboard', default_branch: 'main', name: 'Sales-Dashboard' };
    context.__readme = `![Social](assets/social-preview/card.png)\n![Executive dashboard overview](assets/screenshots/sales-dashboard-overview.png)`;
    const candidates = evaluate(context, 'extractReadmeImageCandidates_(__readme, __repo)');
    context.__selected = evaluate(context, 'selectScreenshotCandidate_(__candidates = extractReadmeImageCandidates_(__readme, __repo))');
    const result = evaluate(context, 'buildScreenshotDiscovery_(__repo, __selected, "readme")');
    assert.equal(candidates.length, 2);
    assert.equal(result.path, 'assets/screenshots/sales-dashboard-overview.png');
    assert.equal(result.alt, 'Sales Dashboard analytics overview');
});

test('manual image overrides discovered Wealth OS screenshot', () => {
    const { context } = createContext();
    context.__repo = repository({ screenshot_url: 'https://raw.githubusercontent.com/itsmebillah/Wealth-OS/main/assets/screenshots/wealth-os-login.png', screenshot_alt: 'Wealth OS sign-in interface' });
    context.__curation = { portfolio_image: 'https://example.com/wealth-dashboard.png', custom_title: 'Wealth OS' };
    const result = evaluate(context, 'mapMergedProjectDto_(__repo, __curation)');
    assert.equal(result.image, 'https://example.com/wealth-dashboard.png');
    assert.equal(result.imageAlt, 'Wealth OS project preview');
});

test('selector recognizes SubPro, website, and AI interface screenshots', () => {
    const { context } = createContext();
    context.__cases = [
        { name: 'SubPro', path: 'assets/screenshots/subpro-pricing.png', expected: 'SubPro subscription interface' },
        { name: 'Reyon-Online', path: 'assets/screenshots/reyon-storefront-desktop.png', expected: 'Reyon Online storefront interface' },
        { name: 'InsightFlowAi', path: 'assets/screenshots/insightflow-upload.png', expected: 'InsightFlowAi data upload interface' }
    ];
    for (let index = 0; index < 3; index++) {
        context.__index = index;
        assert.ok(evaluate(context, 'scoreScreenshotCandidate_({path:__cases[__index].path,alt:"",readme:true,size:50000})') > 0);
        assert.equal(evaluate(context, 'buildScreenshotAlt_(__cases[__index].name, __cases[__index].path, "")'), context.__cases[index].expected);
    }
});

test('repository without a suitable screenshot uses GitHub OG fallback', () => {
    const { context } = createContext();
    context.__repo = repository({ screenshot_url: '', screenshot_discovery_status: 'none' });
    context.__curation = {};
    const result = evaluate(context, 'mapMergedProjectDto_(__repo, __curation)');
    assert.equal(result.image, 'https://opengraph.githubassets.com/portfolio/itsmebillah/example');
});

test('transient screenshot discovery failure preserves the last good image', () => {
    const { context } = createContext();
    context.__previous = [repository({ screenshot_url: 'https://raw.githubusercontent.com/itsmebillah/example/main/assets/screenshots/dashboard.png', screenshot_path: 'assets/screenshots/dashboard.png', screenshot_alt: 'Example dashboard', screenshot_source: 'readme', screenshot_discovery_status: 'found' })];
    context.__current = [repository({ screenshot_discovery_status: 'error' })];
    const result = evaluate(context, `reconcileRepositorySnapshot_(__previous, __current, new Date('2026-08-08T00:00:00Z'))`);
    assert.equal(result[0].screenshot_url, context.__previous[0].screenshot_url);
    assert.equal(result[0].screenshot_discovery_status, 'preserved');
});

test('legacy Projects sheet is not read by the production project builder', () => {
    const { context } = createContext();
    context.loadLastGoodSnapshot_ = () => [repository()];
    context.readSheetObjects_ = (ss, name) => {
        if (name === 'Portfolio_Project_Curation') return [{ github_repository_id: '101', show_on_portfolio: true }];
        if (name === 'Projects') throw new Error('legacy source must not be read');
        return [];
    };
    context.__ss = {};
    assert.equal(evaluate(context, 'buildPublicProjects_(__ss)').length, 1);
});

test('published manual projects merge without fake GitHub identity', () => {
    const { context } = createContext();
    context.loadLastGoodSnapshot_ = () => [];
    context.readSheetObjects_ = (ss, name) => name === 'Manual_Portfolio_Projects' ? [{
        manual_project_id: 'car-sales-analysis',
        title: 'Car Sales Analysis',
        description: 'Power BI portfolio project',
        display_order: 2,
        featured: false,
        show_on_portfolio: true,
        image: 'https://example.com/car-sales.png',
        image_alt: 'Car Sales Analysis dashboard',
        demo_url: 'https://example.com/demo',
        tech_stack: 'Power BI, SQL',
        private_note: 'must-not-survive'
    }] : [];
    context.__ss = {};
    const result = evaluate(context, 'buildPublicProjects_(__ss)');
    assert.equal(result.length, 1);
    assert.equal(result[0].id, 'manual:car-sales-analysis');
    assert.equal(result[0].source, 'MANUAL');
    assert.equal(result[0].repoKey, '');
    assert.equal(result[0].url, '');
    assert.deepEqual(JSON.parse(JSON.stringify(result[0].techStack)), ['Power BI', 'SQL']);
    assert.equal(Object.hasOwn(result[0], 'private_note'), false);
});

test('manual projects require publication and a unique stable id', () => {
    const { context } = createContext();
    context.loadLastGoodSnapshot_ = () => [];
    context.readSheetObjects_ = (ss, name) => name === 'Manual_Portfolio_Projects' ? [
        { manual_project_id: 'valid-project', title: 'Visible', show_on_portfolio: true },
        { manual_project_id: 'valid-project', title: 'Duplicate', show_on_portfolio: true },
        { manual_project_id: 'Invalid ID', title: 'Invalid', show_on_portfolio: true },
        { manual_project_id: 'hidden-project', title: 'Hidden', show_on_portfolio: false }
    ] : [];
    context.__ss = {};
    const result = evaluate(context, 'buildPublicProjects_(__ss)');
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Visible');
});

test('legacy project mapper excludes demo credentials', () => {
    const { context } = createContext();
    context.__legacy = {
        Name: 'Legacy Project',
        Description: 'Description',
        DemoEmail: 'sensitive@example.com',
        DemoPassword: 'sensitive-password',
        Published: true
    };
    const result = evaluate(context, 'mapLegacyProjectDto_(__legacy, 0)');
    assert.equal(Object.hasOwn(result, 'DemoEmail'), false);
    assert.equal(Object.hasOwn(result, 'DemoPassword'), false);
    assert.equal(JSON.stringify(result).includes('sensitive'), false);
});

test('last-known-good repository snapshot is chunked and restored', () => {
    const { context, properties } = createContext();
    context.__snapshot = Array.from({ length: 40 }, (_, index) => repository({
        github_repository_id: String(1000 + index),
        repo_key: `itsmebillah/repository-${index}`,
        name: `repository-${index}`,
        description: 'x'.repeat(500)
    }));
    evaluate(context, 'saveLastGoodSnapshot_(__snapshot)');
    const partCount = Number(properties.get('GITHUB_LAST_GOOD_SNAPSHOT_PARTS'));
    assert.ok(partCount > 1);
    for (let index = 0; index < partCount; index++) {
        assert.ok(properties.get(`GITHUB_LAST_GOOD_SNAPSHOT_JSON_${index}`).length <= 8000);
    }
    const restored = evaluate(context, 'loadLastGoodSnapshot_()');
    assert.equal(restored.length, 40);
    assert.equal(restored[39].github_repository_id, '1039');
});

test('cached public response survives a spreadsheet outage', () => {
    const { context, cache } = createContext();
    const cached = { success: true, schemaVersion: 1, data: { profile: { Name: 'Cached' }, projects: [], skills: [] } };
    cache.set('portfolio_public_dto_v1_contract12', JSON.stringify(cached));
    context.SpreadsheetApp = { openById: () => { throw new Error('Sheets unavailable'); } };
    const result = evaluate(context, 'compileAllPortfolioData()');
    assert.equal(result.data.profile.Name, 'Cached');
});

test('private and unavailable repositories never enter the public DTO', () => {
    const { context } = createContext();
    context.loadLastGoodSnapshot_ = () => [
        repository({ github_repository_id: '101', visibility: 'private' }),
        repository({ github_repository_id: '102', sync_state: 'unavailable' })
    ];
    context.readSheetObjects_ = (ss, name) => name === 'Portfolio_Project_Curation' ? [
        { github_repository_id: '101', show_on_portfolio: true },
        { github_repository_id: '102', show_on_portfolio: true }
    ] : [];
    context.__ss = {};
    assert.equal(evaluate(context, 'buildPublicProjects_(__ss)').length, 0);
});

test('rate limiter returns a typed public error at the configured boundary', () => {
    const { context } = createContext();
    evaluate(context, `enforceRateLimit_('chat', 'client', 2, 60)`);
    evaluate(context, `enforceRateLimit_('chat', 'client', 2, 60)`);
    assert.throws(
        () => evaluate(context, `enforceRateLimit_('chat', 'client', 2, 60)`),
        error => error.publicCode === 'RATE_LIMITED'
    );
});

test('sheet text protection neutralizes spreadsheet formulas', () => {
    const { context } = createContext();
    assert.equal(evaluate(context, `safeSheetText_('=IMPORTXML("https://example.com")')`), `'=IMPORTXML("https://example.com")`);
    assert.equal(evaluate(context, `safeSheetText_('normal message')`), 'normal message');
});

test('complete public API response uses strict entity DTOs', () => {
    const { context } = createContext();
    const tables = {
        Profile: [
            ['Name', 'Title', 'Email', 'Phone', 'sex', 'Age ', 'Maritial status', 'InternalNote'],
            ['Masum', 'Data Analyst', 'public@example.com', 'public-phone', 'private', 'private', 'private', 'private']
        ],
        Config: [['Key', 'Value'], ['name', 'Masum'], ['private_token', 'private-config']],
        Skills: [['Name', 'Level', 'Category', 'InternalNote'], ['SQL', 90, 'Analytics', 'private']],
        Projects: [['Name', 'Description', 'DemoEmail', 'DemoPassword', 'Published'], ['Legacy', 'Safe', 'private', 'private', true]],
        Experience: [['Title', 'Company', 'Period', 'Description'], ['Analyst', 'Company', '2026', 'Work']],
        Education: [['Degree', 'Institution', 'Period', 'Description'], ['BBA', 'College', '2022', 'Study']],
        Certificates: [['Name', 'Organization', 'Published', 'InternalNote'], ['SQL', 'Provider', true, 'private']],
        Blogs: [['Title', 'Slug', 'Content', 'Published', 'DocID'], ['Post', 'post', 'Public article', true, 'private-doc-id']],
        FAQ: [['Question', 'Answer', 'Category', 'InternalNote'], ['Question', 'Answer', 'General', 'private-faq']],
        AI_CONTEXT: [['Section', 'Content', 'PrivatePrompt'], ['Public', 'Reviewed context', 'private-prompt']],
        Portfolio_Project_Curation: [['github_repository_id', 'repo_key', 'show_on_portfolio']],
        GitHub_Sync_Status: [['status', 'last_success_at']]
    };
    const spreadsheet = {
        getSheetByName(name) {
            if (!tables[name]) return null;
            return { getDataRange: () => ({ getValues: () => tables[name] }) };
        }
    };
    context.SpreadsheetApp = { openById: () => spreadsheet };
    const result = evaluate(context, 'compileAllPortfolioData()');
    const serialized = JSON.stringify(result);
    assert.equal(result.schemaVersion, 1);
    assert.deepEqual(Object.keys(result.data).sort(), ['aiContext', 'blogs', 'certificates', 'config', 'education', 'experience', 'faq', 'profile', 'projects', 'skills']);
    for (const forbidden of ['sex', 'Maritial status', 'InternalNote', 'DemoEmail', 'DemoPassword', 'private-doc-id', 'private-config', 'private-faq', 'private-prompt']) {
        assert.equal(serialized.includes(forbidden), false, `forbidden field leaked: ${forbidden}`);
    }
    assert.equal(Object.hasOwn(result.data.profile, ''), false);
    assert.deepEqual(JSON.parse(JSON.stringify(result.data.faq[0])), { Question: 'Question', Answer: 'Answer', Category: 'General' });
    assert.deepEqual(JSON.parse(JSON.stringify(result.data.aiContext[0])), { Section: 'Public', Content: 'Reviewed context' });
});

test('public config is key-allowlisted and ignores unknown keys', () => {
    const { context } = createContext();
    const tables = {
        Config: [['Key', 'Value'], ['name', 'Masum'], ['site_tagline', 'Analytics'], ['GROQ_API_KEY', 'must-not-survive']]
    };
    context.__ss = { getSheetByName: name => tables[name] ? { getDataRange: () => ({ getValues: () => tables[name] }) } : null };
    const result = evaluate(context, 'buildPublicConfig_(__ss)');
    assert.equal(result.name, 'Masum');
    assert.equal(result.site_tagline, 'Analytics');
    assert.equal(Object.hasOwn(result, 'GROQ_API_KEY'), false);
    assert.equal(JSON.stringify(result).includes('must-not-survive'), false);
});

test('private AI prompt and knowledge are server-only bounded context', () => {
    const { context } = createContext();
    const tables = {
        AI_Prompt: [['Key', 'Value'], ['system_prompt', 'Private owner prompt']],
        AI_Knowledge: [['Type', 'Title', 'Content', 'InternalNote'], ['Profile', 'Masum', 'Reviewed knowledge', 'private-note']]
    };
    context.__ss = { getSheetByName: name => tables[name] ? { getDataRange: () => ({ getValues: () => tables[name] }) } : null };
    const result = evaluate(context, 'buildPrivateAiContext_(__ss)');
    assert.equal(result.systemPrompt, 'Private owner prompt');
    assert.deepEqual(JSON.parse(JSON.stringify(result.knowledge)), [{ type: 'Profile', title: 'Masum', content: 'Reviewed knowledge' }]);
    assert.equal(JSON.stringify(result).includes('private-note'), false);
});

test('existing repository technical metadata updates under the same immutable id', () => {
    const { context } = createContext();
    context.__previous = [repository({ description: 'Old', topics_json: '["old"]' })];
    context.__current = [repository({ description: 'New', topics_json: '["new"]', updated_at: '2026-08-09T00:00:00.000Z' })];
    const result = evaluate(context, `reconcileRepositorySnapshot_(__previous, __current, new Date('2026-08-09T00:00:00Z'))`);
    assert.equal(result.length, 1);
    assert.equal(result[0].github_repository_id, '101');
    assert.equal(result[0].description, 'New');
    assert.equal(result[0].topics_json, '["new"]');
});

test('duplicate repository ids reject the candidate snapshot', () => {
    const { context } = createContext();
    context.__repos = [repository(), repository({ repo_key: 'itsmebillah/duplicate' })];
    assert.throws(() => evaluate(context, 'validateRepositorySnapshot_(__repos)'), error => error.publicCode === 'DUPLICATE_REPOSITORY');
});

test('deleted repository expires after the retention window using controlled time', () => {
    const { context } = createContext();
    context.__previous = [repository({ sync_state: 'unavailable', missing_since: '2026-06-01T00:00:00.000Z' })];
    const result = evaluate(context, `reconcileRepositorySnapshot_(__previous, [], new Date('2026-08-08T00:00:00Z'))`);
    assert.equal(result.length, 0);
});

test('GitHub discovery normalizes only public repositories owned by the configured user', () => {
    const { context } = createContext();
    const payload = [
        { id: 101, node_id: 'R1', full_name: 'itsmebillah/example', name: 'example', owner: { login: 'itsmebillah' }, private: false, html_url: 'https://github.com/itsmebillah/example', topics: [] },
        { id: 102, node_id: 'R2', full_name: 'someone/foreign', name: 'foreign', owner: { login: 'someone' }, private: false, html_url: 'https://github.com/someone/foreign', topics: [] },
        { id: 103, node_id: 'R3', full_name: 'itsmebillah/private', name: 'private', owner: { login: 'itsmebillah' }, private: true, html_url: 'https://github.com/itsmebillah/private', topics: [] }
    ];
    context.UrlFetchApp = { fetch: () => ({ getResponseCode: () => 200, getAllHeaders: () => ({ ETag: 'etag-1' }), getContentText: () => JSON.stringify(payload) }) };
    const result = evaluate(context, 'fetchGitHubRepositories_()');
    assert.equal(result.repositories.length, 1);
    assert.equal(result.repositories[0].github_repository_id, '101');
    assert.equal(result.etag, 'etag-1');
});

test('GitHub API failure records real rate-limit availability without scheduling a retry', () => {
    const { context } = createContext();
    context.UrlFetchApp = { fetch: () => ({
        getResponseCode: () => 429,
        getAllHeaders: () => ({ 'Retry-After': '120', 'X-RateLimit-Reset': '1786200000' }),
        getContentText: () => '{}'
    }) };
    assert.throws(
        () => evaluate(context, 'fetchGitHubRepositories_()'),
        error => error.publicCode === 'GITHUB_RATE_LIMITED' && error.httpStatus === 429 && /T/.test(error.retryAvailableAt)
    );
    assert.equal(evaluate(context, `getGitHubRetryAvailableAt_({'Retry-After':'60'}, new Date('2026-08-08T00:00:00Z'))`), '2026-08-08T00:01:00.000Z');
});

test('staged snapshot remains invisible until its generation marker is committed', () => {
    const { context, properties } = createContext();
    context.__repos = [repository()];
    const generation = evaluate(context, 'stageSnapshotGeneration_(__repos)');
    assert.equal(properties.has('GITHUB_LAST_GOOD_SNAPSHOT_GENERATION'), false);
    assert.equal(evaluate(context, 'loadSnapshotGeneration_(PropertiesService.getScriptProperties(), ' + JSON.stringify(generation) + ').length'), 1);
});

test('sheet write failure preserves the committed snapshot marker and etag', () => {
    const { context, properties } = createContext();
    properties.set('GITHUB_LAST_GOOD_SNAPSHOT_GENERATION', 'previous-generation');
    properties.set('GITHUB_REPOSITORIES_ETAG', 'old-etag');
    context.SpreadsheetApp = { openById: () => ({}) };
    context.captureGitHubSyncSheets_ = () => ({});
    context.replaceSnapshotSheet_ = () => { throw new Error('sheet write failed'); };
    context.restoreGitHubSyncSheets_ = () => {};
    context.__repos = [repository()];
    context.__response = { etag: 'new-etag', status: 200, repositories: context.__repos };
    assert.throws(() => evaluate(context, `commitGitHubSnapshot_(__repos, __response, new Date('2026-08-08T00:00:00Z'))`));
    assert.equal(properties.get('GITHUB_LAST_GOOD_SNAPSHOT_GENERATION'), 'previous-generation');
    assert.equal(properties.get('GITHUB_REPOSITORIES_ETAG'), 'old-etag');
});

test('successful staged commit promotes one validated snapshot generation', () => {
    const { context, properties } = createContext();
    context.SpreadsheetApp = { openById: () => ({}) };
    context.captureGitHubSyncSheets_ = () => ({});
    context.replaceSnapshotSheet_ = () => {};
    context.ensureCurationRows_ = () => {};
    context.verifySnapshotSheet_ = () => {};
    context.verifyCurationSheet_ = () => {};
    context.writeGitHubSyncStatus_ = () => {};
    context.verifyGitHubSyncStatus_ = () => {};
    context.__repos = [repository()];
    context.__response = { etag: 'new-etag', status: 200, repositories: context.__repos };
    evaluate(context, `commitGitHubSnapshot_(__repos, __response, new Date('2026-08-08T00:00:00Z'))`);
    assert.equal(properties.get('GITHUB_LAST_GOOD_SNAPSHOT_GENERATION'), 'test-uuid');
    assert.equal(properties.get('GITHUB_REPOSITORIES_ETAG'), 'new-etag');
    assert.equal(evaluate(context, 'loadLastGoodSnapshot_().length'), 1);
});

test('duplicate sync planning is idempotent and preserves manual curation', () => {
    const { context } = createContext();
    context.__repos = [repository()];
    context.__existing = [{
        github_repository_id: '101', repo_key: 'itsmebillah/example',
        show_on_portfolio: true, featured: true, custom_title: 'Manual title'
    }];
    const first = evaluate(context, 'planCurationReconciliation_(__repos, __existing)');
    const second = evaluate(context, 'planCurationReconciliation_(__repos, __existing)');
    assert.equal(first.newRows.length, 0);
    assert.equal(first.renames.length, 0);
    assert.deepEqual(JSON.parse(JSON.stringify(first)), JSON.parse(JSON.stringify(second)));
    assert.equal(context.__existing[0].custom_title, 'Manual title');
    assert.equal(context.__existing[0].show_on_portfolio, true);
});

test('late status verification failure rolls back the promoted marker and sheets', () => {
    const { context, properties } = createContext();
    properties.set('GITHUB_LAST_GOOD_SNAPSHOT_GENERATION', 'previous-generation');
    properties.set('GITHUB_REPOSITORIES_ETAG', 'old-etag');
    context.SpreadsheetApp = { openById: () => ({}) };
    context.captureGitHubSyncSheets_ = () => ({ snapshot: [['old']] });
    context.replaceSnapshotSheet_ = () => {};
    context.ensureCurationRows_ = () => {};
    context.verifySnapshotSheet_ = () => {};
    context.verifyCurationSheet_ = () => {};
    context.writeGitHubSyncStatus_ = () => {};
    context.verifyGitHubSyncStatus_ = () => { throw new Error('status verification failed'); };
    context.__restored = false;
    context.restoreGitHubSyncSheets_ = () => { context.__restored = true; };
    context.__repos = [repository()];
    context.__response = { etag: 'new-etag', status: 200, repositories: context.__repos };
    assert.throws(() => evaluate(context, `commitGitHubSnapshot_(__repos, __response, new Date('2026-08-08T00:00:00Z'))`));
    assert.equal(context.__restored, true);
    assert.equal(properties.get('GITHUB_LAST_GOOD_SNAPSHOT_GENERATION'), 'previous-generation');
    assert.equal(properties.get('GITHUB_REPOSITORIES_ETAG'), 'old-etag');
});
