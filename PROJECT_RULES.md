# 1. Project Overview

## Purpose

This repository contains the public frontend for Md Masum Billah's portfolio website. The site presents profile information, skills, projects, certificates, experience, case studies/blogs, contact options, and a portfolio assistant interface.

The current website is already live and its visual design is final. All future engineering work must preserve the current user interface and user experience unless a future task explicitly authorizes a visual change.

## Current Stack

- GitHub Pages for static hosting
- HTML for page structure
- CSS for all visual styling
- Vanilla JavaScript for data loading, rendering, UI interactions, SEO helpers, and component loading
- Google Sheets as the content management system
- Google Apps Script as the backend API
- External CDNs for Tailwind runtime, AOS, particles.js, and Google Fonts

## Deployment

The frontend is deployed as static files through GitHub Pages. There is no server-side rendering layer, no Node runtime in production, and no separate hosting platform.

## Architecture Summary

The frontend is a static GitHub Pages site with a modularized HTML, CSS, and JavaScript structure:

- `index.html` is the page shell.
- `components/` contains reusable HTML partials for major visible sections.
- `assets/css/` contains the extracted CSS.
- `assets/js/` contains configuration, API, utility, SEO, app startup, and component-loading logic.
- `assets/modules/` contains feature-specific rendering and interaction modules.
- `robots.txt` and `sitemap.xml` provide current crawl infrastructure.

Current content flow:

```text
Google Sheets
↓
Google Apps Script API
↓
Frontend fetch
↓
Vanilla JavaScript render functions
↓
Static GitHub Pages UI
```

The site currently loads most portfolio content dynamically from the Apps Script API. HTML partials provide the static section structure, while JavaScript fills dynamic content into existing IDs and containers.

# 2. Non-Negotiable Rules

- Pixel-perfect UI is mandatory.
- No visual changes unless explicitly approved.
- No redesign.
- Existing UX must remain identical.
- Existing layout must remain identical.
- Existing colors must remain identical.
- Existing typography must remain identical.
- Existing spacing must remain identical.
- Existing animations must remain identical.
- Existing responsive behavior must remain identical.
- Google Sheets remains the CMS.
- Apps Script remains the backend.
- GitHub Pages remains the hosting.
- Vanilla HTML/CSS/JavaScript only.
- No React.
- No Next.js.
- No SSR.
- No database migration.
- Maintain backward compatibility.
- Existing public URLs must continue working.
- Existing API calls must continue working.
- Existing JavaScript selectors, IDs, and class dependencies must not be broken.

# 3. Engineering Principles

- Simplicity: prefer clear static files and plain JavaScript over complex tooling.
- Maintainability: keep files focused by responsibility.
- Reusability: shared markup, utilities, and SEO logic should have one source of truth.
- Separation of concerns: API, rendering, UI behavior, configuration, and utilities must remain separate.
- DRY: do not duplicate markup, API calls, SEO metadata logic, templates, or validation logic.
- Progressive enhancement: the site should remain static-hosting friendly and should not require SSR or a runtime framework.
- Backward compatibility: preserve existing behavior while improving structure.
- Minimal change surface: edit only files required for the current task.

# 4. Code Standards

## HTML

- Keep `index.html` as the public page shell.
- Store reusable section markup in `components/`.
- Preserve existing IDs used by JavaScript.
- Preserve existing classes used by CSS.
- Do not reorder visible sections unless explicitly approved.
- Do not change visible text unless the task explicitly requests content changes.
- Do not introduce duplicate IDs.

## CSS

- Keep visual styles in `assets/css/`.
- Do not change colors, typography, spacing, layout, animations, or responsive behavior without explicit approval.
- Do not rename CSS classes unless a compatibility plan is provided.
- Avoid new CSS when a task is not visual.
- Preserve cascade order.

## JavaScript

- Use vanilla JavaScript only.
- Keep startup orchestration in `assets/js/app.js`.
- Keep Apps Script communication in `assets/js/api.js` or a future service layer.
- Keep reusable helpers in `assets/js/utils.js`.
- Keep SEO configuration and metadata helpers in `assets/js/seo.js`.
- Keep feature-specific rendering and interaction code in `assets/modules/`.
- Preserve required global functions such as modal handlers when existing inline behavior depends on them.

## Naming Conventions

- Use lowercase folder names.
- Use kebab-case for HTML partials and future generated page files.
- Use clear responsibility-based JavaScript file names.
- Use stable IDs for DOM nodes that JavaScript depends on.

## Comments

- Preserve comments that explain business logic, API behavior, or architectural constraints.
- Add comments only when they clarify non-obvious implementation decisions.
- Avoid comments that merely restate the code.

## Documentation

- Document any new folder, build step, content field, route, or deployment requirement.
- Keep this `PROJECT_RULES.md` updated when architecture changes are approved.

## Folder Organization

Current frontend structure:

```text
/
├── index.html
├── components/
├── assets/
│   ├── css/
│   ├── js/
│   └── modules/
├── data/
├── robots.txt
├── sitemap.xml
├── README.md
└── googlef7041b623edd6e4a.html
```

# 5. Architecture Rules

Separate these responsibilities:

- API
- Rendering
- UI
- Utilities
- Components
- Configuration

Never mix responsibilities.

## API

- API calls to Apps Script must remain centralized.
- Do not hardcode the Apps Script endpoint in multiple places.
- Do not change API request shapes unless the backend contract is updated intentionally.
- Preserve `getAllData`, `getBlog`, chat, and contact submission behavior unless explicitly changed.

## Rendering

- Rendering modules should receive data and update existing containers.
- Rendering modules must preserve existing DOM IDs, classes, and interaction hooks.
- Rendering modules should not own API fetching.

## UI

- UI modules should handle interactions only.
- UI behavior must remain backward compatible.
- Existing popup/modal behavior must continue working.

## Utilities

- Shared escaping, sanitization, URL handling, formatting, and validation helpers belong in utilities.
- Do not duplicate utility logic inside feature modules.

## Components

- Static reusable HTML belongs in `components/`.
- Component files must preserve existing markup structure.
- Component loading must complete before JavaScript selectors initialize.
- Component partials must be served over HTTP or GitHub Pages; direct `file://` viewing is not a supported runtime.

## Configuration

- Configuration belongs in centralized files such as `assets/js/config.js` and `assets/js/seo.js`.
- Do not scatter canonical URLs, API URLs, default metadata, or route patterns across unrelated files.

# 6. SEO Standards

Every future page must support:

- Title
- Description
- Canonical
- Open Graph
- Twitter Card
- JSON-LD

SEO rules:

- Homepage canonical remains the root site URL.
- Every generated future page must have a unique canonical URL.
- SEO defaults should come from shared configuration.
- Do not duplicate SEO logic across templates or modules.
- JSON-LD must be valid JSON.
- Social metadata must match the page content.
- Blog article schema must not be added to non-article pages.

# 7. Blog Standards

Every blog must have:

- Unique slug
- Unique URL
- Published status
- Thumbnail
- Description
- Canonical
- Article schema
- Publication date
- Author

Blog rules:

- Google Sheets remains the source of blog data.
- Apps Script remains the source API.
- Existing popup previews must continue working.
- Future SEO-friendly blog URLs should use path-based routes such as `/blog/{slug}/`.
- Hash routes must not be used for SEO-critical articles.
- Draft posts must not be included in production static output.
- Scheduled posts must not publish before their scheduled date.

# 8. Validation Rules

Validate:

- Duplicate slug
- Duplicate title
- Missing image
- Missing SEO fields
- Broken links

Validation requirements:

- Published content must include all required fields.
- Duplicate slugs must block generation.
- Duplicate canonical URLs must block generation.
- Missing required SEO fields must block generation for public pages.
- Broken internal links must block production deployment.
- Broken external links should produce warnings unless they affect critical navigation.
- Image URLs should be HTTPS and reachable.

# 9. Performance Rules

## Caching

- Preserve Apps Script caching behavior unless a task explicitly changes backend performance.
- Future static generation should cache raw API snapshots for repeatable builds and debugging.

## Lazy Loading

- Non-critical images should use lazy loading.
- Above-the-fold critical images may use `fetchpriority="high"` when appropriate.

## Image Optimization

- Do not replace existing images without approval.
- Preserve existing width, height, lazy loading, and decoding attributes unless intentionally improving image delivery.
- Future generated pages should support validated thumbnail metadata.

## Preload Strategy

- Use preload only for truly critical resources.
- Use preconnect and dns-prefetch sparingly for required third-party origins.
- Do not add excessive resource hints.

# 10. Development Workflow

Every feature must follow:

```text
Analyze
↓
Plan
↓
Implement
↓
Test
↓
Review
↓
Commit
```

Workflow rules:

- One task at a time.
- Keep each change narrowly scoped.
- Do not bundle unrelated refactors.
- Do not modify unrelated files.
- Run validation before final handoff.
- Report any tests or checks that could not be run.
- Request approval before architecture, routing, schema, deployment, or visual changes.

# 11. AI Development Rules

Before modifying code:

- Read `PROJECT_RULES.md`.
- Read `AI_CONTEXT.md` if present.
- Inspect affected files.
- Explain the implementation plan.
- Never modify unrelated files.
- Never rewrite working code unnecessarily.
- Stop and explain if a request conflicts with project rules.
- Preserve existing user changes.
- Do not revert files unless explicitly asked.
- Do not invent architecture that is not present.
- Do not implement beyond the requested task.

# Project Philosophy

This project should remain durable, simple, and static-first. The portfolio's current visual identity is considered complete and protected. Engineering work should improve maintainability, crawlability, performance, and reliability without disturbing the user-facing experience.

Prefer boring, predictable architecture over fashionable tooling. The site should be understandable by a single developer, deployable on GitHub Pages, and editable through Google Sheets.

# Future Vision

The project may evolve into a CMS-driven static portfolio where Google Sheets remains the single source of truth and generated pages are produced for blogs, projects, certificates, experience, skills, categories, tags, RSS, and search.

Future capabilities may include:

- Static blog pages
- Static project pages
- Static certificate pages
- Multi-language support
- Search
- RSS
- Categories
- Tags
- Pagination
- Related posts
- Draft mode
- Scheduled publishing
- Build validation reports
- Visual regression checks

All future capabilities must preserve the current UI unless a redesign is explicitly approved.

# Maintenance Guidelines

- Keep the frontend framework-free.
- Keep Google Sheets schema changes documented.
- Keep Apps Script API contracts stable.
- Keep public URLs stable.
- Keep SEO logic centralized.
- Keep component markup reusable.
- Keep validation strict for generated content.
- Audit broken links and images regularly.
- Review external CDN dependencies periodically.
- Add visual regression testing before any UI-adjacent changes.
- Keep `PROJECT_RULES.md` current as the architecture evolves.
