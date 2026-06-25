# Project Overview

## Purpose

This repository is the GitHub Pages frontend for Md Masum Billah's portfolio website. The site presents profile details, skills, projects, certificates, experience and education timeline, case studies/blogs, contact form, and an AI-style portfolio assistant.

This file is for AI coding assistants. It summarizes the current project state so future changes can be made safely without rediscovering the whole architecture.

## Current Status

- The website is already live.
- The current UI is final and must remain pixel-perfect unless a task explicitly approves visual changes.
- The frontend has already been modularized into HTML partials, CSS files, JavaScript utility/config files, and feature modules.
- SEO foundation exists for the homepage.
- Blog content still opens in a popup/modal and does not yet have individual static URLs.

## Technology Stack

- GitHub Pages for static frontend hosting
- HTML partials loaded into `index.html`
- CSS in `assets/css/`
- Vanilla JavaScript only
- Google Sheets as CMS
- Google Apps Script as backend API
- Apps Script V8 runtime
- Tailwind runtime CDN
- AOS CDN
- particles.js CDN
- Google Fonts CDN

No React, Next.js, SSR, database migration, or non-static frontend hosting is present.

## Deployment

Frontend deployment target:

- GitHub Pages from the static frontend repository at `D:\Files\Portfilio_G_Script`.

Backend deployment target:

- Google Apps Script web app from the backend project at `D:\Files\Portfolio_Backend`.
- Apps Script manifest uses `executeAs: USER_DEPLOYING` and `access: ANYONE_ANONYMOUS`.

## Architecture Summary

Current runtime flow:

```text
GitHub Pages serves index.html
↓
index.html loads CSS, CDN libraries, config, SEO, component loader, modules, and app startup
↓
component-loader.js fetches HTML partials from components/
↓
app.js waits for portfolio:components-loaded
↓
app.js initializes SEO, particles, API fetch, render modules, icons, chatbot, mobile nav, form, loader
↓
api.js fetches Apps Script ?action=getAllData
↓
modules render Google Sheets data into existing containers
```

Backend data flow:

```text
Google Sheets
↓
Apps Script Code.js
↓
JSON API
↓
Frontend fetch
↓
Vanilla JS render functions
```

# Frontend Architecture

## HTML Structure

`index.html` is now a shell. It contains:

- Static `<head>` metadata and resource hints
- CSS and script references
- `data-component` placeholders for HTML partials
- No full visible section markup directly in the body

HTML partials live in `components/`:

- `loader.html`
- `particles.html`
- `navbar.html`
- `hero.html`
- `about.html`
- `skills.html`
- `projects.html`
- `certificates.html`
- `blogs.html`
- `experience.html`
- `contact.html`
- `chat.html`
- `blog-modal.html`

Important rule: component files contain markup that existing CSS and JavaScript depend on. Do not rename IDs or classes casually.

## CSS Organization

CSS files live in `assets/css/`:

- `main.css`: contains the real visual styles, loader styles, modal styles, timeline styles, animations, responsive rules, etc.
- `components.css`: placeholder/minimal file. Component-specific styles are intentionally preserved in `main.css` to keep cascade order stable.
- `animations.css`: placeholder/minimal file. Animation styles are intentionally preserved in `main.css` to keep cascade order stable.

Do not change CSS unless a task explicitly allows visual changes.

## JavaScript Organization

Core JS files:

- `assets/js/config.js`
  - Defines `GAS_API_URL`.
  - Defines global `allBlogs`.
  - Defines loader task tracking.
  - Defines local Font Awesome SVG path registry.

- `assets/js/component-loader.js`
  - Finds `[data-component]` placeholders.
  - Fetches same-origin component HTML files.
  - Replaces placeholders with parsed template content.
  - Emits `portfolio:components-loaded`.
  - Sets `window.__portfolioComponentsLoaded = true`.

- `assets/js/app.js`
  - Defines `initializePortfolioApp()`.
  - Waits for component loading before starting.
  - Initializes SEO config, AOS, particles, data fetch, icon replacement, chatbot, loader, mobile nav, and form submission.

- `assets/js/api.js`
  - Fetches `GAS_API_URL?action=getAllData`.
  - Calls section render functions.
  - Updates loader milestones.

- `assets/js/utils.js`
  - `readObjProp`
  - `escapeHtml`
  - `sanitizeUrl`
  - `sanitizeHtml`
  - `sanitizeIconClass`
  - `sanitizePercent`

- `assets/js/seo.js`
  - Defines `SEO_CONFIG`.
  - Applies title, description, keywords, robots, canonical, OG, Twitter Card, and homepage JSON-LD.

Feature modules:

- `assets/modules/ui.js`
  - Icon replacement
  - Loader progress/completion
  - Mobile navigation

- `assets/modules/hero.js`
  - `renderProfile`
  - Populates nav name, hero, about, contact info, social links, and profile image

- `assets/modules/skills.js`
  - `renderSkills`

- `assets/modules/projects.js`
  - `renderProjects`

- `assets/modules/certificates.js`
  - `renderCertificates`

- `assets/modules/blogs.js`
  - `renderBlogs`
  - `openBlogModal`
  - `closeBlogModal`

- `assets/modules/experience.js`
  - `renderTimeline`

- `assets/modules/chatbot.js`
  - `initializeChatbotEngine`

- `assets/modules/contact.js`
  - `initializeFormSubmission`

## Rendering Flow

1. Component markup is loaded into the DOM.
2. `loadDataPipelineStream()` fetches `getAllData`.
3. The response payload is read as `result.data || result`.
4. Render modules populate existing containers:
   - `renderProfile(payload.profile)`
   - `renderSkills(payload.skills)`
   - `renderProjects(payload.projects)`
   - `renderCertificates(payload.certificates)`
   - `renderBlogs(payload.blogs)`
   - `renderTimeline(payload.experience, payload.education)`
5. `replaceFontAwesomeIcons()` converts `<i class="fa...">` tags to inline SVGs using `localIconPaths`.

## Initialization Flow

Script order in `index.html` matters:

```text
config.js
seo.js
component-loader.js
ui.js
utils.js
api.js
section modules
app.js
```

`component-loader.js` begins fetching components immediately when loaded. `app.js` waits for `window.__portfolioComponentsLoaded` or the `portfolio:components-loaded` event.

The site must be served over HTTP/GitHub Pages. Direct `file://` usage is not a supported runtime because component loading uses `fetch()`.

# Backend Architecture

## Apps Script

Backend code lives in `D:\Files\Portfolio_Backend`.

Important files:

- `Code.js`: main Apps Script backend
- `Table_creation.js`: helper/import script for creating seed sheets
- `appsscript.json`: Apps Script manifest
- `.clasp.json`: clasp project config

`Code.js` contains:

- `MASTER_CONFIG`
- `doGet`
- `doPost`
- portfolio data compilation
- Google Sheets parsing helpers
- blog content loading
- Groq chatbot integration
- contact submission handling
- visitor logging

## API Endpoints

Apps Script is exposed as an anonymous web app.

Base frontend API URL:

```text
https://script.google.com/macros/s/AKfycbwmQcArmH_TZ9Y8mP_XiyWgSCzU1QpmK7Iw3y5exUOKenl6p4ZOhTd7dxh-E8fpeJj1Mg/exec
```

Current endpoint router is `doGet(e)` and `doPost(e)`.

## Data Flow

Apps Script opens one Google Spreadsheet by ID:

```text
1ZnoWdyyqzutrIs6SBnYfwN3a9aVsPNPJjzw9lWu76iE
```

Apps Script reads configured tabs, parses them, filters published projects/certificates/blogs where applicable, caches the compiled portfolio payload, and returns JSON.

## Authentication

- Frontend API access is anonymous through Apps Script web app settings.
- Apps Script executes as the deploying user.
- Groq API key is read from Apps Script script properties under `GROQ_API_KEY`.
- No frontend authentication is present.
- Contact form currently sends data by GET query params with `mode: 'no-cors'`.

# Google Sheets CMS

The backend expects these tab names through `MASTER_CONFIG.tabs`:

- `Profile`
- `Config`
- `Skills`
- `Projects`
- `Experience`
- `Education`
- `Certificates`
- `Blogs`
- `FAQ`
- `AI_CONTEXT`
- `Submissions`
- `VisitorLog`

## Profile

Parsed by `parseProfileSheet` as a single horizontal data row. Major fields used by frontend:

- `Name`
- `Title`
- `Bio`
- `Location`
- `Email`
- `Phone`
- `Facebook`
- `LinkedIn`
- `WhatsApp`
- `GitHub`
- `ProfilePic`

Used by:

- Navbar name
- Hero section
- About section
- Contact info
- Social links
- Chat context

## Config

Parsed as key-value rows by `parseKeyValueSheet`. Current frontend does not visibly depend on this directly, but it is included in `getAllData`.

## Skills

Parsed by `parseTableSheet`.

Major fields:

- `Name`
- `Level`
- `Category`
- `Order` if present

Used by `renderSkills`.

## Projects

Parsed by `parseTableSheet` with published filtering.

Major fields:

- `Name`
- `Description`
- `Image`
- `Tags`
- `LiveURL`
- `GitHubURL`
- `Featured`
- `DemoEmail`
- `DemoPassword`
- `Published`

Used by `renderProjects`.

Relationship:

- Featured projects go to `featuredProjectsContainer`.
- Non-featured projects go to `otherProjectsContainer`.

## Experience

Parsed by `parseTableSheet`.

Major fields:

- `Title`
- `Company`
- `Period`
- `Description`
- `Icon`

Used by `renderTimeline`.

## Education

Parsed by `parseTableSheet`.

Major fields:

- `Degree`
- `Institution`
- `Period`
- `Description`
- `Icon`

Used by `renderTimeline` together with Experience.

## Certificates

Parsed by `parseTableSheet` with published filtering.

Major fields:

- `Name`
- `Organization`
- `Date`
- `ImageURL`
- `VerifyURL`
- `Skills`
- `Published`

Used by `renderCertificates`.

## Blogs

Summaries are extracted by `extractBlogSummaries`.

Fields returned in blog summaries:

- `Title`
- `Slug`
- `Description`
- `Thumbnail`
- `Category`
- `Date`
- `Published`
- `DocID`

Additional fields used by full content retrieval if present:

- `GoogleDocID`
- `Content`

Publishing flow:

- `parseTableSheet(..., true)` includes rows where `Published` is `TRUE`, boolean `true`, or `1`.
- Published blogs appear on the homepage blog grid.
- Full blog content is fetched on modal open via `getBlog`.

## FAQ

Parsed by `parseTableSheet` and used in chatbot context.

Likely fields:

- `Question`
- `Answer`

## AI_CONTEXT

Parsed by `parseTableSheet` and used in chatbot context.

Likely fields:

- `Section`
- `Content`

This is a Google Sheet tab, not a repository file.

## Submissions

Contact form submissions are appended here.

Fields created by backend if missing:

- `Timestamp`
- `Name`
- `Email`
- `Subject`
- `Message`
- `Submission ID`

## VisitorLog

Backend logs requests here.

Fields created by backend if missing:

- `Timestamp`
- `ViewParameter`
- `ParametersJson`

# API Documentation

## GET default

Purpose:

- Health/basic API response.

Request:

```text
GET {GAS_API_URL}
```

Response:

```json
{
  "success": true,
  "message": "Portfolio Data Engine Core is Live.",
  "endpoints": ["?action=getAllData", "?action=chat&message=hello"]
}
```

Errors:

- Wrapped by `doGet` handling where possible.

## GET `?action=getAllData`

Purpose:

- Returns all portfolio data needed by the homepage.

Request:

```text
GET {GAS_API_URL}?action=getAllData
```

Response shape:

```json
{
  "success": true,
  "timestamp": "ISO timestamp",
  "data": {
    "profile": {},
    "config": {},
    "skills": [],
    "projects": [],
    "experience": [],
    "education": [],
    "certificates": [],
    "blogs": [],
    "faq": [],
    "aiContext": []
  }
}
```

Caching:

- Uses Apps Script `CacheService`.
- Cache key: `portfolio_all_data_v2`.
- TTL: 300 seconds.
- Payload may be chunked.

Errors:

- If sheet parsing fails, Apps Script may return an error response or log an exception depending on failure point.

## GET `?action=getBlog`

Purpose:

- Loads full blog content for modal display.

Request:

```text
GET {GAS_API_URL}?action=getBlog&docId={docId}&slug={slug}&title={title}
```

At least one identifier should be supplied:

- `docId`
- `slug`
- `title`

Response:

```json
{
  "success": true,
  "content": "<p>...</p>"
}
```

Errors:

```json
{
  "success": false,
  "content": "",
  "message": "Blog identifier is missing."
}
```

or:

```json
{
  "success": false,
  "content": "",
  "message": "Blog content could not be loaded."
}
```

Content source:

- If a matching blog row has `DocID` or `GoogleDocID`, backend loads Google Doc text with `DocumentApp`.
- Otherwise backend normalizes the sheet `Content` field.

## GET `?action=chat&message=...`

Purpose:

- Sends a visitor message to the portfolio assistant.

Request:

```text
GET {GAS_API_URL}?action=chat&message=hello
```

Response:

```json
{
  "success": true,
  "reply": "..."
}
```

Errors:

- If `GROQ_API_KEY` is missing: returns a fallback reply.
- If Groq/API processing fails: returns an interruption or timeout message.

## Contact Form GET

Purpose:

- Saves contact submission to Google Sheets.

Request:

```text
GET {GAS_API_URL}?name=...&email=...&subject=...&message=...
```

Frontend sends:

```js
fetch(url, { method: 'GET', mode: 'no-cors' })
```

Response:

- Frontend does not read response because `no-cors` is used.
- Backend returns JSON if called normally.

Errors:

- Missing `name`, `email`, or `message` triggers backend validation error.

## POST

Purpose:

- Accepts JSON or form payloads.
- If payload is `{ action: "chat", message: "..." }`, routes to chat.
- Otherwise routes to form submission processing.

Request:

```text
POST {GAS_API_URL}
```

Response:

- JSON response from chat or form submission.

# Website Sections

## Hero

Component:

- `components/hero.html`

Renderer:

- `renderProfile` in `assets/modules/hero.js`

Data source:

- `Profile` sheet via `payload.profile`

Fields used:

- `Name`
- `Title`
- `Bio`
- `ProfilePic`
- Social links indirectly through social container

## About

Component:

- `components/about.html`

Renderer:

- `renderProfile`

Data source:

- `Profile` sheet

Fields used:

- `Bio`
- `Location`
- `Email`
- `Phone`

## Skills

Component:

- `components/skills.html`

Renderer:

- `renderSkills`

Data source:

- `Skills` sheet via `payload.skills`

Fields used:

- `Name`
- `Level`
- `Category`
- `Order`

## Experience

Component:

- `components/experience.html`

Renderer:

- `renderTimeline`

Data sources:

- `Experience` sheet
- `Education` sheet

Fields used:

- Experience: `Title`, `Company`, `Period`, `Description`, `Icon`
- Education: `Degree`, `Institution`, `Period`, `Description`, `Icon`

## Projects

Component:

- `components/projects.html`

Renderer:

- `renderProjects`

Data source:

- `Projects` sheet via `payload.projects`

Fields used:

- `Name`
- `Description`
- `Image`
- `Tags`
- `LiveURL`
- `GitHubURL`
- `Featured`
- `DemoEmail`
- `DemoPassword`
- `Published`

## Certificates

Component:

- `components/certificates.html`

Renderer:

- `renderCertificates`

Data source:

- `Certificates` sheet via `payload.certificates`

Fields used:

- `Name`
- `Organization`
- `Date`
- `ImageURL`
- `VerifyURL`
- `Published`

## Blogs

Component:

- `components/blogs.html`

Renderer:

- `renderBlogs`
- `openBlogModal`
- `closeBlogModal`

Data source:

- `Blogs` sheet summaries via `payload.blogs`
- Full content via `?action=getBlog`

Fields used:

- `Title`
- `Slug`
- `Description`
- `Thumbnail`
- `Category`
- `Date`
- `ReadTime` if present
- `DocID` or `GoogleDocID`

## Contact

Component:

- `components/contact.html`

Initializer:

- `initializeFormSubmission`

Data destination:

- `Submissions` sheet through Apps Script GET submission.

Fields submitted:

- `name`
- `email`
- `subject`
- `message`

# Current Blog System

## Popup Architecture

Blogs are rendered as cards in the homepage `#blogs` section. Each card has a `Read Segment` button with an inline `onclick="openBlogModal(index)"`.

When a blog opens:

1. `openBlogModal(index)` reads the blog summary from global `allBlogs`.
2. It writes a loading state into `#modalBody`.
3. It displays `#blogModal`.
4. It builds query params for `action=getBlog`.
5. It fetches full content from Apps Script using `docId`, `slug`, and `title`.
6. It sanitizes HTML with `sanitizeHtml`.
7. It replaces modal content with the blog content.

## Current Workflow

Content editor flow:

```text
Edit Blog row in Google Sheets
↓
Set Published to TRUE
↓
Frontend getAllData receives summary
↓
Homepage renders blog card
↓
User clicks Read Segment
↓
Frontend calls getBlog
↓
Modal displays full content
```

## Current Limitations

- No dedicated blog URLs.
- No `/blog/{slug}/` pages.
- Blog articles are not individually represented in `sitemap.xml`.
- Blog pages do not currently have per-post canonical URLs.
- Blog pages do not currently have per-post Open Graph/Twitter metadata.
- BlogPosting JSON-LD is not implemented.
- Full content loads only after modal interaction.
- Social sharing of individual blog posts is not currently supported as separate pages.

## Future Roadmap

Agreed direction from prior architecture discussions:

- Keep Google Sheets as CMS.
- Keep Apps Script as API.
- Keep GitHub Pages as hosting.
- Preserve current homepage and popup UX.
- Add generated static blog pages later at `/blog/{slug}/`.
- Generate per-blog metadata, canonical URLs, BlogPosting schema, sitemap entries, and optional RSS/search index later.

# Configuration

## API URL

Defined in `assets/js/config.js`:

```text
https://script.google.com/macros/s/AKfycbwmQcArmH_TZ9Y8mP_XiyWgSCzU1QpmK7Iw3y5exUOKenl6p4ZOhTd7dxh-E8fpeJj1Mg/exec
```

## Constants

Important frontend globals:

- `GAS_API_URL`
- `allBlogs`
- `portfolioLoaderTasks`
- `portfolioLoaderTaskList`
- `localIconPaths`
- `SEO_CONFIG`

Important backend config:

- `MASTER_CONFIG.sheetId`
- `MASTER_CONFIG.adminEmail`
- `MASTER_CONFIG.groqApiKeyProperty`
- `MASTER_CONFIG.groqModel`
- `MASTER_CONFIG.tabs`

## Runtime Assumptions

- Site is served over HTTP/GitHub Pages.
- `fetch()` can retrieve same-origin component partials.
- Apps Script web app is publicly reachable.
- Google Sheets tab names match `MASTER_CONFIG.tabs`.
- Existing DOM IDs remain stable.
- External CDNs are available for Tailwind runtime, AOS, particles.js, and Google Fonts.

# Deployment

## GitHub Pages

Frontend is static and served from `D:\Files\Portfilio_G_Script` repository.

Important files:

- `index.html`
- `components/`
- `assets/`
- `robots.txt`
- `sitemap.xml`
- `googlef7041b623edd6e4a.html`

## Apps Script

Backend is maintained in `D:\Files\Portfolio_Backend`.

Important files:

- `Code.js`
- `Table_creation.js`
- `appsscript.json`
- `.clasp.json`

Deployment settings from manifest:

- Runtime: V8
- Time zone: Asia/Dhaka
- Execute as deploying user
- Access: anyone anonymous

## Google Search Console

There is a verification file:

- `googlef7041b623edd6e4a.html`

Do not remove or rename it unless Search Console ownership changes.

## Sitemap

Current `sitemap.xml` includes only the homepage:

```text
https://itsmebillah.github.io/
```

It contains a comment noting future generated blog URLs should be added as `/blog/{slug}/` entries.

## Robots

Current `robots.txt`:

```text
User-agent: *
Allow: /
Sitemap: https://itsmebillah.github.io/sitemap.xml
```

# Known Technical Debt

- Blog posts have no dedicated URLs.
- Blog content is modal-only for users and not independently crawlable as full static pages.
- Sitemap only contains homepage.
- No generated static pages exist yet for blogs, projects, certificates, or experience.
- Contact form sends PII through GET query params and uses `mode: 'no-cors'`.
- Frontend depends on runtime component loading via `fetch()`, so direct `file://` opening is unsupported.
- Tailwind is loaded from runtime CDN rather than a compiled CSS build.
- Several files contain mojibake/encoding artifacts in comments or visible fallback strings, inherited from earlier edits.
- README also contains encoding artifacts.
- Blog full content from Google Docs is converted with simple text replacement, not rich semantic HTML conversion.
- Component loading is sequential, not parallel.
- No automated visual regression tests exist.
- No build-time validators exist for slugs, links, images, metadata, or duplicate content.
- No RSS feed or search index exists.
- No category, tag, pagination, related-post, draft, or scheduled-publishing system exists.
- No browser-based automated test suite is present.

# Future Architecture

## Modular Frontend

Current state:

- Implemented with `components/`, `assets/js/`, `assets/modules/`, and `assets/css/`.

Future improvement:

- Keep components stable.
- Avoid visual changes.
- Consider build-time inclusion later if a static generator is introduced, so runtime component fetches can be removed without changing rendered output.

## SEO Layer

Current state:

- Homepage SEO foundation exists in static head and `assets/js/seo.js`.
- Supports title, description, keywords, canonical, robots, author, language, Open Graph, Twitter Card, and Person/Organization/WebSite JSON-LD.

Future improvement:

- Generate per-page metadata for static pages.
- Add BlogPosting only when dedicated blog pages exist.

## Static Generator

Agreed roadmap:

```text
Google Sheets
↓
Apps Script API
↓
Build-time fetch
↓
Validation
↓
Normalization
↓
Template rendering
↓
Static HTML output
↓
Sitemap/RSS/search index
↓
GitHub Pages deployment
```

No generator is implemented yet.

## Blog URLs

Recommended future route format:

```text
/blog/{slug}/
```

Popup previews should continue to coexist with dedicated static blog pages.

## Validation Engine

Future validators should cover:

- Duplicate slugs
- Duplicate titles
- Missing images
- Missing SEO fields
- Broken internal links
- Broken external links
- Invalid dates
- Missing published fields
- Invalid schema

# AI Instructions

Before changing anything:

- Read `PROJECT_RULES.md`.
- Read `AI_CONTEXT.md`.
- Inspect affected files.
- Never redesign UI.
- Never modify unrelated files.
- Always preserve backward compatibility.
- Always preserve pixel-perfect rendering.
- Preserve existing public URLs.
- Preserve existing Apps Script API behavior unless explicitly asked to change it.
- Preserve Google Sheets as the CMS.
- Preserve GitHub Pages as hosting.
- Use vanilla HTML/CSS/JavaScript only.
- Do not introduce React, Next.js, SSR, or a database.
- Explain conflicts and stop if a request violates project rules.
- Do not invent missing architecture; document what actually exists.
- If a task says "do not implement," do not modify code.
- If browser visual validation is required but unavailable, say so clearly.
