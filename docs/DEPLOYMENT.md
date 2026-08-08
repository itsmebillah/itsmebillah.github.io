# Deployment

## Git workflow and branch strategy

`main` is the current production branch. Use short-lived task branches when collaboration or review is needed; otherwise make narrowly scoped commits. Never mix source changes with regenerated artifacts unless the task requires both. Pull/rebase before pushing and do not rewrite shared history without explicit approval.

## Frontend deployment

1. Validate only intended files changed.
2. Test the site over HTTP, because component loading does not work from `file://`.
3. Commit and push to `main`.
4. Confirm the repository's GitHub Pages source points at the intended branch/root.
5. Verify the production URL and 404 behavior after Pages propagation.

No Pages deployment workflow is stored in this repository; the Pages source is an external repository setting.

## Blog publishing

Manual generation from the repository root:

```powershell
node blog/generator/blog-page-generator.js
```

Review changes only in:

- `blog/index.html`
- `blog/blogs-manifest.json`
- `blog/*/index.html`
- `sitemap.xml`
- `rss.xml`
- `search-index.json`

Automated publishing can be started from **Actions → Publish generated blog content → Run workflow** or through repository dispatch event `publish-blogs`. With no artifact changes, the workflow exits successfully without a commit.

## Apps Script/clasp workflow

Run from `apps-script/`:

```powershell
clasp status
clasp push
clasp deployments
```

`clasp push` updates project source but a public versioned web app must also be updated to a new version while retaining the existing deployment ID/URL. Use the installed clasp version's redeploy command or Apps Script **Deploy → Manage deployments → Edit → New version → Deploy**. Test `getAllData`, chat, and contact behavior afterward.

## Publishing automation setup

Apps Script requires Script Properties documented in [Security](SECURITY.md), then one manual execution of `installBlogPublishingTriggers()` under the deployment owner's account. GitHub must allow Actions to write repository contents, and the workflow must exist on the default branch.

## GitHub project synchronization setup

After deploying the synchronization source:

1. Run `syncGitHubProjects()` once as the deployment owner.
2. Verify 15 current public repositories appear in `GitHub_Project_Snapshot` and new curation rows are unchecked.
3. Run `installGitHubSyncTrigger()` once and verify exactly one six-hour trigger exists.
4. Review `GitHub_Sync_Status` for `success`, HTTP 200, repository count, and last-success timestamp.
5. Enable projects only through `Portfolio_Project_Curation.show_on_portfolio`.

The initial implementation needs no GitHub credential. Configure `GITHUB_METADATA_TOKEN` only if public shared-IP rate limits are operationally unreliable. See [GitHub Project Synchronization](GITHUB_SYNC.md).

## Deployment checklist

- Working tree contains only intended changes.
- Syntax checks and generator validation pass.
- Generated artifact counts agree with the manifest.
- No secret patterns appear in source or reachable commits.
- Apps Script Script Properties exist; secrets are not logged.
- Public API has `schemaVersion: 1`, strict DTO fields, and no demo credentials/private Sheet columns.
- GitHub snapshot, curation, sync status, ETag, last-known-good recovery, and six-hour trigger are verified.
- Existing web-app deployment is updated, not replaced with a new public URL.
- GitHub Actions has `contents: write` and branch rules allow the bot push.
- Homepage, `/blog/`, newest article, sitemap, RSS, search index, chat, and contact path are verified.

## Emergency rollback

- Static site: revert the faulty commit and push the revert. Do not edit generated HTML individually.
- Generated blog: revert the bot artifact commit or correct CMS data and rerun generation.
- Apps Script: point the existing deployment back to a known-good version in Manage deployments.
- Secret incident: revoke/rotate first, update Script Properties, remove the secret from reachable history, then redeploy.

See [Troubleshooting](TROUBLESHOOTING.md).
