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
    assert.equal(result[0].featured, true);
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

test('missing demo, description, and image degrade to empty optional fields', () => {
    const { context } = createContext();
    context.__repo = repository({ description: '', homepage_url: '' });
    context.__curation = { show_on_portfolio: true };
    const result = evaluate(context, 'mapMergedProjectDto_(__repo, __curation)');
    assert.equal(result.description, '');
    assert.equal(result.demoUrl, '');
    assert.equal(result.image, '');
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
    cache.set('portfolio_public_dto_v1', JSON.stringify(cached));
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
        Skills: [['Name', 'Level', 'Category', 'InternalNote'], ['SQL', 90, 'Analytics', 'private']],
        Projects: [['Name', 'Description', 'DemoEmail', 'DemoPassword', 'Published'], ['Legacy', 'Safe', 'private', 'private', true]],
        Experience: [['Title', 'Company', 'Period', 'Description'], ['Analyst', 'Company', '2026', 'Work']],
        Education: [['Degree', 'Institution', 'Period', 'Description'], ['BBA', 'College', '2022', 'Study']],
        Certificates: [['Name', 'Organization', 'Published', 'InternalNote'], ['SQL', 'Provider', true, 'private']],
        Blogs: [['Title', 'Slug', 'Content', 'Published', 'DocID'], ['Post', 'post', 'Public article', true, 'private-doc-id']],
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
    assert.deepEqual(Object.keys(result.data).sort(), ['blogs', 'certificates', 'education', 'experience', 'profile', 'projects', 'skills']);
    for (const forbidden of ['sex', 'Maritial status', 'InternalNote', 'DemoEmail', 'DemoPassword', 'private-doc-id']) {
        assert.equal(serialized.includes(forbidden), false, `forbidden field leaked: ${forbidden}`);
    }
});
