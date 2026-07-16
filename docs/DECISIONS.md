# Architecture Decisions

## GitHub Pages for hosting

The production site consists of static files, so GitHub Pages provides simple, low-maintenance hosting with direct Git integration. The tradeoff is no server runtime, custom response headers, or dynamic routing.

## Google Sheets as CMS

Sheets lets portfolio content be updated without editing HTML or deploying a database-backed CMS. Header-driven parsing keeps the schema understandable. The tradeoff is schema drift, spreadsheet quotas, and weaker validation than a typed content system.

## Apps Script as backend

Apps Script is close to Sheets, Docs, Mail, and triggers. It exposes one lightweight public API without separate infrastructure. The tradeoff is execution quotas, versioned deployment steps, limited observability, and an anonymously callable surface.

## Vanilla frontend

The repository avoids a framework and production build step. This fits GitHub Pages and keeps the site understandable to one maintainer. Component partials and focused scripts provide modularity without React, Next.js, SSR, or bundling.

## Static blog generation

Static article pages give crawlers stable URLs and complete metadata while preserving Sheets as the authoring system. Generated files are committed so GitHub Pages can serve them directly. The tradeoff is regeneration latency and the need to keep artifacts synchronized.

## GitHub Actions for publishing

Actions provides a controlled, observable environment for Node generation and artifact-only commits. The workflow uses an explicit staging allowlist, minimal `contents: write`, concurrency protection, and no schedule.

## Apps Script repository dispatch

Installable spreadsheet triggers provide automatic publishing without storing GitHub credentials in the browser or repository. A header-scoped digest, lock, debounce, and deferred retries minimize duplicate events and quota waste.

## Current AI architecture

Apps Script builds the system prompt from live portfolio data and sends it to Groq. This keeps the API key server-side and keeps answers grounded in current CMS data. It also means each chat request reads the portfolio dataset and consumes Apps Script/Groq quotas.

## Deployment strategy

Frontend/artifact releases and backend releases are intentionally separate. Git pushes publish static content; clasp plus an updated versioned deployment publishes Apps Script changes without changing the public web-app URL.

## Decision guardrails

Do not migrate hosting, CMS, backend, or frontend framework without an explicit architecture decision. New decisions should be appended here with date, context, choice, consequences, and rollback strategy.
