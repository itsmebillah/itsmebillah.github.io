# Reusable Codex Prompts

Each prompt assumes `PROJECT_STATE.md`, `PROJECT_RULES.md`, and the relevant `docs/` file are read first.

## Frontend

> Implement [change] in the production portfolio. Preserve the current UI, layout, selectors, responsive behavior, vanilla architecture, and Apps Script API. Inspect the affected component, renderer, utilities, styles, and startup order. Modify only required files and validate over HTTP.

## Apps Script

> Implement [backend change] in `apps-script/`. Preserve `doGet`, `doPost`, response shapes, Script Properties, trigger behavior, and anonymous web-app compatibility unless explicitly scoped otherwise. Do not log secrets. Return clasp push/redeployment steps.

## GitHub Actions

> Update blog publishing automation for [requirement]. Keep minimum permissions, concurrency, manual/repository dispatch compatibility, artifact-only staging, no-op success, and loop prevention. Do not change generator/frontend behavior.

## SEO

> Audit/fix [SEO issue] using generated HTML as evidence. Trace CMS fields through metadata helpers, schema helpers, templates, page generation, sitemap, RSS, and search index. Preserve canonical route contracts and do not hand-edit generated artifacts.

## Blog

> Diagnose [blog symptom] in order: Sheet row, Apps Script response, publish filter, slug resolution, generator, manifest, page, sitemap, RSS, search index, workflow commit, Pages route. Identify the first failing stage and make the smallest fix.

## Security

> Perform a read-only security review for [scope]. Search current files and reachable Git history for credentials, unsafe input handling, excessive permissions, public endpoint risk, and third-party exposure. Do not bypass protection or print secret values.

## Deployment

> Prepare a deployment checklist for [change]. Separate GitHub Pages, generated artifact, and Apps Script versioned-deployment steps. Include validation, rollback, and external settings that cannot be proven from the repository.

## Debugging

> Debug [symptom] without redesign. Reproduce if safe, trace the exact request/data path, identify the first failing function and line, distinguish verified facts from uncertainty, then implement only the confirmed fix and run focused validation.

## Performance

> Audit [performance area] without visual changes. Measure/inspect actual assets and request flow, prioritize user-visible bottlenecks, preserve GitHub Pages compatibility, and do not add dependencies or a build system unless explicitly approved.
