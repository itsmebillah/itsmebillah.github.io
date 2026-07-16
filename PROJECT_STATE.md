# Project State

Last updated: 2026-07-16

- Production URL: `https://itsmebillah.github.io/`
- Branch: `main`
- Architecture: static GitHub Pages frontend + Google Sheets CMS + Apps Script backend.
- Blog: 11 generated article pages; generator also refreshes blog index, manifest, sitemap, RSS, and search index.
- Publishing: Apps Script edit/change triggers dispatch `publish-blogs`; GitHub Actions generates, validates, and commits artifacts.
- AI: Groq Chat Completions using `openai/gpt-oss-120b`; key stored as `GROQ_API_KEY` in Script Properties.
- Known gaps: scheduled publication is not enforced; `getBlog` is not implemented; search index has no connected UI; external deployment/trigger/property state must be verified in service consoles.
- Project rules: preserve UI, public URLs, vanilla frontend, Sheets, Apps Script, GitHub Actions, and GitHub Pages.
- Full knowledge base: [`docs/PROJECT_OVERVIEW.md`](docs/PROJECT_OVERVIEW.md)
