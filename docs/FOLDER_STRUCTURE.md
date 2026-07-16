# Folder Structure

```text
/
├── .github/workflows/       Blog publishing workflow
├── .vscode/                 Repository-local editor recommendations
├── apps-script/             Apps Script backend and automation
├── assets/                  Frontend styles, scripts, modules, and images
├── blog/                    Blog source templates, generators, and generated output
├── components/              Homepage HTML partials
├── docs/                    Project knowledge base
├── index.html               Homepage shell and static SEO
├── 404.html                 GitHub Pages not-found page
├── PROJECT_RULES.md         Non-negotiable engineering constraints
├── AI_CONTEXT.md            Earlier root AI guidance; docs/ is authoritative context
├── PROJECT_STATE.md         Short current-state snapshot
├── cache-policy.json        Advisory cache policy for a future edge layer
├── robots.txt               Crawler policy
├── sitemap.xml              Generated URL inventory
├── rss.xml                  Generated RSS feed
└── search-index.json        Generated client-search dataset
```

## Major folders

### `.github/workflows/`

Contains `publish-blogs.yml`, which responds to manual and repository dispatch events, runs the generator, validates its report, and commits an explicit generated-artifact allowlist. Change only when publishing behavior is intentionally changing.

### `.vscode/`

Contains workspace terminal/Git/search settings and extension recommendations. It does not participate in production builds or GitHub Actions.

### `apps-script/`

- `Code.js`: public `doGet`/`doPost`, CMS parsers, Google Docs enrichment, AI chat, contact intake, mail, and visitor logging.
- `BlogAutomation.js`: spreadsheet triggers, digest, debounce, GitHub dispatch, deferred retry, and automation diagnostics.
- `Table_creation.js`: destructive one-time spreadsheet bootstrap/sample-data utility. It deletes sheets other than the first before rebuilding them. Do not run in production.
- `appsscript.json`: V8 web-app manifest; anonymous access and deploy-as-owner behavior.
- `.clasp.json`: local clasp project mapping. It contains a script identifier, not a secret, but is intentionally hidden from normal workspace browsing.

### `assets/`

- `css/main.css`: production visual system. `animations.css` and `components.css` currently contain only minimal content.
- `js/config.js`: Apps Script endpoint, shared loader state, and local SVG icon paths.
- `js/api.js`: CMS fetch and rendering orchestration.
- `js/app.js`: startup lifecycle.
- `js/component-loader.js`: HTML partial loading.
- `js/seo.js`: homepage metadata synchronization.
- `js/utils.js`: escaping, URL/HTML sanitization, and rendering helpers.
- `js/search-engine.js`: optional search-index client; currently not loaded by the homepage.
- `modules/`: section renderers and interaction controllers.
- `images/`: repository-owned visual assets.

### `components/`

Static markup for loader, particles, navbar, hero, about, skills, projects, certificates, blogs, experience, contact, chat, and blog modal. IDs and classes form contracts with JavaScript and CSS.

### `blog/`

- `generator/`: Node generator and SEO/feed/index helpers.
- `templates/`: source templates for article HTML and SEO.
- `blogs-manifest.json`: generated route inventory plus declarative metadata.
- `index.html`: generated blog listing.
- `{slug}/index.html`: generated article pages.
- `README.md`: older route notes; parts describing generated pages as future work are stale.

## Files not to edit manually

The following are generated and should be changed through CMS data, templates, or generators:

- `blog/index.html`
- `blog/blogs-manifest.json`
- `blog/*/index.html`
- `sitemap.xml`
- `rss.xml`
- `search-index.json`

Also avoid casual edits to `PROJECT_RULES.md`, public URLs, API request shapes, workflow permissions, `.clasp.json`, and `appsscript.json`. Never run `importCSVData()` from `Table_creation.js` against production without an approved backup and explicit migration plan.
