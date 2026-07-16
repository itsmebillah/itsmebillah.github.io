# Work History

## Foundation

The repository evolved from a basic static profile into a public GitHub Pages portfolio with structured homepage content, SEO metadata, crawler configuration, responsive behavior, and external Apps Script data loading.

## Dynamic portfolio and chatbot

Google Sheets became the content source through Apps Script. Profile, project, skills, certificates, timeline, blogs, contact submissions, and AI context were integrated. A Groq-backed portfolio assistant and contact/mail pipeline were added.

## Frontend modularization and hardening

The monolithic frontend was separated into component partials, shared scripts, feature modules, and CSS assets. Work added resource hints, lazy loading, deferred scripts, accessibility improvements, loader behavior, URL validation, HTML escaping/sanitization, and Search Console verification.

## Static blog and SEO platform

Dedicated static article routes replaced the blog modal as the primary reading experience. Reusable templates and helpers added metadata, canonical URLs, Open Graph, Twitter cards, BlogPosting/breadcrumb JSON-LD, related articles, RSS, sitemap, and search-index generation.

## Publishing automation

The generator was made resilient to API encoding and missing Sheet slugs, and all artifacts were regenerated as one pipeline. GitHub Actions added manual/repository triggers, validation, concurrency, minimal write permission, artifact-only staging, and no-op success behavior.

## Apps Script automation and security

Apps Script source was added to the repository. Spreadsheet edit/change triggers gained header-scoped digesting, locking, debounce, worker reuse, deferred retry, sanitized failure diagnostics, and GitHub repository dispatch. Hardcoded API credentials were moved to Script Properties and leaked local Git history was safely rewritten before push.

## Current maintenance

The deprecated Groq model was replaced with `openai/gpt-oss-120b`, backend provider errors were improved, and repository-local VS Code configuration was added.
