# Project Memory

Last synchronized with repository: 2026-07-16 (`df24d00`).

## Current status

Production static portfolio with dynamic CMS-backed homepage, static generated blog, automated publishing infrastructure, and Apps Script/Groq chatbot.

## Current production URL

`https://itsmebillah.github.io/`

## Current Apps Script deployment

- Public endpoint configured in `assets/js/config.js`: `https://script.google.com/macros/s/AKfycbwmQcArmH_TZ9Y8mP_XiyWgSCzU1QpmK7Iw3y5exUOKenl6p4ZOhTd7dxh-E8fpeJj1Mg/exec`
- Script project ID is stored in `apps-script/.clasp.json`.
- Runtime: V8; timezone: Asia/Dhaka; web app executes as deployer and allows anonymous access.
- Exact live deployment version is external and unverified by repository state.

## Current spreadsheet

- Spreadsheet ID: `1ZnoWdyyqzutrIs6SBnYfwN3a9aVsPNPJjzw9lWu76iE`
- Blog sheet default: `Blogs`
- IDs are identifiers, not authentication secrets.

## Current GitHub Actions

`Publish generated blog content` accepts `workflow_dispatch` and repository event `publish-blogs`, runs Node 24.18.0 generation, validates slugs, and commits only generated artifacts with `contents: write` and concurrency protection.

## Current AI provider and model

Groq Chat Completions API using `openai/gpt-oss-120b`; credential is `GROQ_API_KEY` in Script Properties.

## Current deployment process

- Static frontend: commit/push to production branch; GitHub Pages publishes according to external repository settings.
- Apps Script: `clasp push`, create/update a version, and update the existing web-app deployment.

## Current publishing pipeline

Blogs sheet → installable edit/change trigger → 30-second debounce → digest → GitHub repository dispatch → Action → generator → validation → artifact-only bot commit → push → GitHub Pages.

## Current known issues

- Scheduled/future-dated posts are not gated when Published is true.
- `getBlog` is requested by clients/generators but is not implemented in `doGet`; current content normally arrives in `getAllData`.
- Search index exists but no production UI loads the search engine.
- `blog/README.md` and parts of manifest feature declarations overstate current functionality.
- Contact `no-cors` UX cannot confirm backend success.
- Public Apps Script chat/contact endpoints have no explicit rate limiting.

## Current security status

Groq and GitHub credentials are designed to live in Script Properties. The known Groq secret leak was removed from reachable local history before a normal push and required credential rotation. Generated/user content is escaped or sanitized, but public endpoints and third-party CDNs remain risk surfaces.

## Current active features

CMS rendering, static blog pages, SEO/social/schema generation, RSS, sitemap, search-index generation, automated publishing, AI chat, contact intake, visitor logging, responsive navigation, and 404 handling.

## Current pending tasks / next sprint

Enforce scheduled publication, formalize or remove the stale `getBlog` contract, add parity/orphan validation, and verify all external production settings.

## Long-term goals

Extend deterministic static generation to more portfolio entities while retaining the existing stack and UI.
