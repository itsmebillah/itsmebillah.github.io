# AI Agent Context

## Philosophy

This is a production, static-first portfolio. Preserve the finished visual identity, stable URLs, Google Sheets CMS, Apps Script backend, vanilla frontend, GitHub Actions automation, and GitHub Pages hosting. Prefer small, reversible changes over redesign or abstraction for its own sake.

## Required reading

Before code changes, read:

1. `PROJECT_STATE.md`
2. `PROJECT_RULES.md`
3. The relevant document in `docs/`
4. Every affected source file and its callers/consumers

Use the repository as truth. Mark external deployment state uncertain unless verified in the external console.

## Coding and architecture rules

- No React, Next.js, SSR, database migration, or production bundler.
- Do not change UI, copy, layout, colors, spacing, animation, or responsiveness unless explicitly authorized.
- Preserve DOM IDs/classes and public request/response shapes.
- Keep API communication, rendering, UI behavior, utilities, components, and configuration separate.
- Centralize shared slug, sanitization, SEO, and validation behavior.
- Do not refactor unrelated code.
- Use header names, not fixed spreadsheet column indexes, for evolving CMS data.

## Files requiring extra caution

- `assets/js/config.js`: public Apps Script endpoint and global runtime dependencies.
- `assets/css/main.css`, `index.html`, and `components/`: protected production UI contracts.
- `apps-script/Code.js`: public API, contact, visitor, and AI behavior.
- `apps-script/BlogAutomation.js`: triggers, credentials, dispatch, and retry state.
- `apps-script/appsscript.json`: public access/execution model.
- `.github/workflows/publish-blogs.yml`: write permissions and artifact commit boundary.
- `blog/generator/`: source of every generated blog artifact.
- `Table_creation.js`: destructive bootstrap code; never execute against production casually.

## Files not to rewrite manually

Never implement a lasting fix directly in `blog/index.html`, `blog/blogs-manifest.json`, `blog/*/index.html`, `sitemap.xml`, `rss.xml`, or `search-index.json`. Change CMS/source/template/generator behavior, then regenerate.

## Naming conventions

- Lowercase folders.
- Kebab-case HTML routes and generated slugs.
- Responsibility-based JavaScript filenames.
- Existing Apps Script public/trigger handler names remain stable.
- Internal Apps Script helpers use a trailing underscore where established.

## Deployment and Git rules

- `main` is production.
- Stage specific files; never use a broad add when unrelated work exists.
- Do not commit secrets, `.clasprc` credentials, or token-bearing logs.
- Do not rewrite shared history or force push without explicit approval.
- Blog workflow commits only the documented artifact allowlist.
- Apps Script source requires clasp push plus update of the existing versioned deployment.

## Apps Script rules

- Preserve `doGet` and `doPost` behavior unless the task explicitly changes an API contract.
- Read secrets only from Script Properties through server-side helpers.
- Keep anonymous-web-app exposure in mind; never trust request input.
- Avoid `Utilities.sleep` for retries; use deferred triggers.
- Use LockService around shared trigger/property state.
- Do not log authorization headers, tokens, or API keys.

## Blog generation rules

- Source: Blogs sheet via `getAllData`.
- Publish state: true/`TRUE`/`1`; missing Published currently counts as published.
- Slug: normalized Slug, falling back to normalized Title.
- Duplicate or invalid slugs must fail validation.
- Generate page, blog index, manifest, sitemap, RSS, and search index as one operation.
- Preserve unique canonical URLs and complete social/structured metadata.
- Remember that scheduled publishing is not currently enforced despite manifest declarations.

## Safe implementation sequence

Analyze → identify exact contract → make the smallest scoped edit → run syntax/validation checks → inspect diff → update affected documentation → provide deployment steps. If the task requires an external secret, setting, permission, or destructive migration, stop and request authority rather than guessing.
