# Roadmap

Roadmap items are constrained by [Project Rules](../PROJECT_RULES.md). They require explicit task approval before implementation.

## Completed

- Static GitHub Pages portfolio with modular frontend.
- Google Sheets and Apps Script CMS.
- Static blog routes and automated SEO artifacts.
- GitHub Actions publishing.
- Apps Script spreadsheet-to-GitHub dispatch.
- Script Property secret migration and Groq model migration.

## In progress

- Production hardening and operational documentation.
- Keeping repository documentation synchronized with implementation.

## Next sprint

- Enforce scheduled publication dates consistently across page, sitemap, RSS, search, and homepage data.
- Resolve the stale `getBlog` contract: either document content-only fallback as final or implement the existing advertised endpoint without changing clients.
- Add repeatable generator validation for manifest/page/artifact parity and orphan pages.
- Confirm external deployment settings, triggers, permissions, and Script Properties against this documentation.

## Future ideas

- Connect a visible search UI to `search-index.json`.
- Generate category/tag archives and pagination.
- Add static project and certificate detail pages.
- Add link checks, schema validation, and visual regression tests to deployment gates.
- Add draft preview and multilingual publishing only if the static-first model is preserved.

## Long-term vision

Maintain Google Sheets as the editor-friendly source of truth while expanding deterministic static generation across portfolio content. Keep GitHub Pages, Apps Script, plain JavaScript, stable public URLs, and minimal operational complexity.
