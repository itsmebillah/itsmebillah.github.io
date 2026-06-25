# Blog URL Architecture

This folder reserves the future static blog URL space for GitHub Pages.

## Route Contract

Published blog pages must be generated at:

```text
/blog/{slug}/
```

Examples:

```text
/blog/what-is-business-intelligence/
/blog/data-analysis-best-practices/
/blog/retail-business-intelligence/
```

The slug must come from the existing `Slug` column in the Google Sheets `Blogs` tab. The Google Sheets structure must not change.

## Current Runtime Behavior

- The homepage blog section remains unchanged visually.
- Blog cards keep opening the existing popup/modal.
- Each rendered blog card now exposes future routing metadata through `data-blog-slug` and `data-blog-url`.
- No generated article pages are committed yet.
- No blog URLs are added to `sitemap.xml` until static pages actually exist.

## Future Data Flow

```text
Google Sheets Blogs tab
↓
Apps Script API
↓
Static generator
↓
Validate slug, title, description, thumbnail, date, status
↓
Render blog/template/blog-page.template.html
↓
Write /blog/{slug}/index.html
↓
Update sitemap.xml, RSS, search index, and related-post data
```

## Future Page Requirements

Every generated blog page must include:

- Unique canonical URL
- Open Graph metadata
- Twitter Card metadata
- BlogPosting JSON-LD
- Breadcrumb JSON-LD
- Published status filtering
- Scheduled publishing validation
- Related posts support
- Category and tag support

## Validation Rules

The generator must fail production output when a published blog has:

- Missing slug
- Duplicate slug
- Missing title
- Duplicate title
- Missing description
- Missing thumbnail
- Invalid date
- Broken internal link
- Duplicate canonical URL

## Scaling Notes

This architecture supports hundreds of posts because each post becomes a static directory with its own `index.html`. GitHub Pages can serve the generated files directly without runtime routing, SSR, React, Next.js, or backend changes.
