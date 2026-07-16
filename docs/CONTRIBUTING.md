# Contributing

## Before starting

Read `PROJECT_STATE.md`, `PROJECT_RULES.md`, `docs/AI_CONTEXT.md`, and the relevant architecture document. Confirm the task scope and inspect existing uncommitted work. Do not redesign, migrate the stack, or refactor unrelated code.

## Branch workflow

1. Start from current `main`.
2. Use a short-lived branch for reviewed work, such as `fix/blog-slug-validation` or `docs/project-knowledge-base`.
3. Make one narrowly scoped logical change.
4. Rebase/update before merge without rewriting other contributors' work.
5. Merge to `main` only after validation.

## Commit style

Use conventional, scoped messages where practical:

```text
fix(chatbot): handle provider errors
feat(blog): validate scheduled publication
docs(project): update deployment guide
chore(vscode): update workspace configuration
```

Automation reserves `chore(blog): auto publish generated blog content` for generated artifact commits.

## Testing checklist

- Inspect `git diff --check` and the exact changed-file list.
- Run `node --check` for changed Node/browser/Apps Script JavaScript where applicable.
- Run the blog generator for generator, CMS schema, slug, SEO, RSS, sitemap, or search changes.
- Verify generated manifest/page/sitemap/RSS/search parity.
- Serve frontend over HTTP and test affected desktop/mobile interactions.
- Verify `getAllData`, chat, and contact contracts after backend changes.
- Confirm no secrets or unrelated source are staged.
- Document checks that could not be run.

## Deployment workflow

- Frontend/docs: commit and push through the normal Git workflow.
- Generated content: prefer the generator/workflow and stage only allowed artifacts.
- Apps Script: `clasp status`, `clasp push`, then update the existing production deployment to a new version.
- Follow [Deployment](DEPLOYMENT.md) and preserve rollback options.

## Documentation requirements

Update documentation in the same task when changing architecture, routes, Sheet fields, API contracts, secrets, workflow triggers, generated artifacts, deployment steps, or known production state. At minimum update `PROJECT_STATE.md`; update `MEMORY.md`, `CHANGELOG.md`, and the relevant subject guide for major work. Do not document planned behavior as implemented.

## Review expectations

Review for backward compatibility, stable URLs, UI preservation, public endpoint safety, generated/source separation, Apps Script quotas, secret exposure, and deployment impact. Reject broad unrelated refactors.
