# Features

## Completed

- Responsive static portfolio with componentized homepage sections.
- Google Sheets-driven profile, skills, projects, certificates, blogs, experience, education, FAQ, and AI context.
- Published filtering for projects, certificates, and blogs.
- Google Docs blog-content enrichment by document ID.
- Dedicated static blog index and `/blog/{slug}/` article routes.
- Title-derived slug fallback and duplicate/invalid slug reporting.
- Article sanitization, navigation, related articles, sharing links, and reading-time estimates.
- Article title, description, canonical, Open Graph, Twitter, BlogPosting, and breadcrumb metadata.
- Generated sitemap, RSS 2.0 feed, and multi-entity search index.
- Automated GitHub Actions generation, validation, artifact-only commit, and push.
- Apps Script On Edit/On Change publishing triggers with locking, debounce, digest deduplication, deferred retry, and sanitized diagnostics.
- Groq-powered portfolio chatbot using live CMS context.
- Contact submission storage, admin email, and confirmation email.
- Visitor request logging.
- Client-side escaping, URL validation, and HTML sanitization.
- 404 page, robots policy, Search Console verification file, and homepage structured data.

## Experimental or partially integrated

- `assets/js/search-engine.js` implements client search, but no production page loads it or presents a search UI.
- Blog modal content loading remains in code as a fallback, while primary card navigation uses static pages.
- Google Docs content retrieval works through `getAllData`; the attempted `getBlog` endpoint is not implemented by `doGet`.
- Cache rules are documented in `cache-policy.json`, but GitHub Pages cannot apply these custom headers directly.
- Analytics and Microsoft Clarity blocks are inert placeholders (`type="text/plain"`).

## Planned

These items are documented intentions in `PROJECT_RULES.md`, not implemented features:

- Static project, certificate, experience, and other CMS-driven detail pages.
- Enforced scheduled publishing.
- Category/tag archive routes and pagination.
- Draft preview mode.
- Multi-language content.
- Build validation reports, broken-link validation, and visual regression checks.
- A visible search experience using the existing index.

## Deprecated or retired

- The Groq model `llama-3.1-70b-versatile` was replaced by `openai/gpt-oss-120b`.
- Homepage blog cards no longer use the modal as their primary reading route; they navigate to static articles.
- Earlier monolithic homepage scripts/styles and earlier PWA/deployment experiments are no longer present in the current tree.
- Statements in `blog/README.md` saying static pages are not committed are obsolete.
