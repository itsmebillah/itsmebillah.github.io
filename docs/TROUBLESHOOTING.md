# Troubleshooting

## Blog publishing did not start

Check in order:

1. Apps Script execution logs for `handleBlogSheetEdit`, `handleBlogSheetChange`, and `dispatchBlogPublishing`.
2. Script Properties `BLOG_LAST_DISPATCH_STATUS`, `BLOG_LAST_DISPATCH_AT`, `BLOG_LAST_ERROR_STATUS`, and `BLOG_LAST_ERROR_RESPONSE`.
3. That installable triggers exist and were installed by an authorized account.
4. `GITHUB_OWNER`, `GITHUB_REPOSITORY`, `GITHUB_TOKEN`, and event type `publish-blogs`.
5. GitHub Actions runs for repository dispatch.

Formatting-only changes and unrelated helper columns intentionally do not publish. On Change reacts only to inserted/removed rows or columns; cell edits are handled by On Edit.

## Workflow ran but no commit appeared

This is valid when generated output is already current. Otherwise inspect the generator and validation steps. The workflow stages only its artifact allowlist; source changes are intentionally ignored. Confirm branch protection permits the workflow token to push and repository workflow permissions allow read/write.

## New blog URL returns 404

- Confirm `Published` is true.
- Resolve the slug using the same normalization as the generator: explicit Slug, otherwise Title; lowercase; non-alphanumeric runs become hyphens.
- Confirm the slug exists exactly once in `blog/blogs-manifest.json`.
- Confirm `blog/{slug}/index.html` exists and was pushed.
- Confirm the URL is in `sitemap.xml` and the GitHub Pages deployment completed.
- Allow for Pages propagation after a successful push.

## Duplicate or invalid slug

The workflow fails validation for duplicates/invalid slugs. Give each row a unique explicit Slug or unique Title, rerun generation, and verify all four generator reports.

## Future-dated blog published early

Current generation filters on `Published` but does not enforce Date or ScheduledAt. Set `Published` false until the intended date. Scheduled publishing enforcement is a known pending task.

## Missing SEO metadata

Do not edit generated HTML. Verify source fields, then inspect `metadata-helpers.js`, `schema-helpers.js`, templates, and generator report. Regenerate and confirm title, description, canonical, Open Graph, Twitter, and JSON-LD in the output page.

## Broken sitemap, RSS, or search index

Run `node blog/generator/blog-page-generator.js` from the repository root. Check its JSON report. Sitemap omits a blog when its static page does not exist. RSS and search reject duplicate slugs. Do not hand-edit outputs.

## Search returns nothing

`search-index.json` is generated, but `assets/js/search-engine.js` is not currently loaded by the homepage and no visible search UI is implemented. This is current behavior, not necessarily a broken artifact.

## Apps Script changes are not live

`clasp push` updates source, not an already versioned production deployment. Update the existing deployment to a new version while preserving its deployment ID and URL. Verify `.clasp.json` points to the intended script project.

## Common clasp issues

- Unauthorized: run `clasp login` with the correct Google account and ensure the Apps Script API is enabled.
- Wrong project: compare the local script ID with Apps Script Project Settings.
- Unexpected overwrite: `clasp push` uploads the local project; inspect `clasp status` first.
- Live endpoint unchanged: redeploy the existing versioned web app.

## Groq/chat errors

- Missing-property error: add `GROQ_API_KEY` to Script Properties.
- Authentication/provider error: rotate the key and verify model permission.
- Model error: compare `MASTER_CONFIG.groqModel` with Groq's production models.
- Frontend generic network error: inspect the Apps Script execution and the returned `{success, reply}` payload.
- Do not log or return the API key.

## Contact submission appears successful but data is missing

The browser sends a GET request using `no-cors`, so it cannot inspect the backend response and may display success after transport alone. Check Apps Script executions and the Submissions sheet. Confirm required fields and MailApp quotas.

## Git secret scanning blocks a push

Do not use the unblock URL. Revoke the credential first. Find the introducing commit, confirm reachability from HEAD, make a backup reference, rewrite only local unpublished history, and verify no secret pattern remains in every reachable commit. A normal push is sufficient only when the leaked commit was never accepted by the remote; otherwise coordinate a reviewed force push.

## Git conflicts or failed bot push

Do not discard work. Fetch, inspect branch divergence and staged artifacts, then resolve only conflicting generated files by regenerating from current source data. Concurrency prevents overlapping workflow runs but does not override branch protection or simultaneous human pushes.

## Deployment failure

Check the first failing stage rather than regenerating blindly: trigger, dispatch, workflow, CMS fetch, generator, manifest, page creation, stage, commit, push, then Pages deployment. Preserve logs and the generator JSON report.
