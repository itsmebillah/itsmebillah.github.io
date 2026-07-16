# Changelog

This is a curated milestone history derived from Git history, not a release-version ledger.

## 2026-07-16

- Updated the chatbot to Groq production model `openai/gpt-oss-120b`.
- Updated request token limits to the current API field and improved provider error responses.
- Added repository-local VS Code settings and extension recommendations.

## 2026-07-12

- Added automated blog generation and publishing through GitHub Actions.
- Added `workflow_dispatch` and `repository_dispatch` event `publish-blogs`.
- Fixed API decoding and consistent title-derived slug fallback across homepage and generators.
- Made the page generator refresh the manifest, blog index, sitemap, RSS, and search index together.
- Added Apps Script source control through clasp.
- Added spreadsheet-triggered GitHub dispatch with digest deduplication, debounce, locks, retries, and security-conscious logging.
- Moved Groq and GitHub credentials to Script Properties and cleaned leaked secret history before normal push.

## 2026-06-26

- Modularized the portfolio into HTML components, shared browser scripts, feature modules, and extracted CSS.
- Introduced static SEO-friendly blog pages and the blog index.
- Added reusable metadata, structured-data, template, sitemap, RSS, and search-index generators.
- Added generated 404, sitemap, RSS, and search artifacts.
- Improved production assets, caching guidance, and frontend performance.

## 2026-06-24 to 2026-06-25

- Added Search Console verification and corrected root GitHub Pages URLs.
- Added dynamic-content sanitization and XSS defenses.
- Improved resource hints, lazy loading, script deferral, accessibility, and loader behavior.
- Restored mixed HTML/plain-text blog rendering after sanitization changes.

## 2026-05 to 2026-06

- Added the portfolio chatbot UI and Apps Script integration.
- Expanded CMS-driven portfolio rendering and improved API response compatibility.
- Added responsive and performance refinements.

## 2025-12 to 2026-01

- Established the static portfolio, homepage SEO, crawler files, and early GitHub Pages structure.
