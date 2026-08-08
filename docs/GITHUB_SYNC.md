# GitHub Project Synchronization

## Ownership model

- GitHub owns repository identity and technical metadata.
- Google Sheets owns portfolio inclusion and presentation choices.
- Apps Script validates, snapshots, merges, caches, and publishes strict DTOs.
- The browser renders the DTO and never calls GitHub directly.

## Workbook tabs

| Tab | Owner | Purpose |
| --- | --- | --- |
| `GitHub_Project_Snapshot` | Apps Script | Last-known-good public repository metadata |
| `Portfolio_Project_Curation` | Portfolio owner | Inclusion, featured state, order, narrative, and approved assets |
| `GitHub_Sync_Status` | Apps Script | Last attempt/success, status, count, ETag, retry, and safe error code |

The snapshot and status tabs are automation-owned. Warning-only range protection helps prevent accidental edits. The curation tab uses checkboxes for `show_on_portfolio` and `featured`, plus a validated project-status list.

## Normal workflow

1. Create or update a public repository on GitHub.
2. Wait up to six hours for `syncGitHubProjects`, or run it manually from the Apps Script editor.
3. Open `Portfolio_Project_Curation` and find the new repository.
4. Review its technical metadata in `GitHub_Project_Snapshot`.
5. Add only portfolio-specific curation, such as category, custom title, image, and display order.
6. Set `show_on_portfolio` to `TRUE` when the project is ready.
7. The next public API read rebuilds the cache and the portfolio displays the project.

Do not manually duplicate repository URL, GitHub description, topics, homepage, language, archive state, or update timestamps.

## Curation fields

- `github_repository_id` and `repo_key`: synchronization identity; do not edit.
- `show_on_portfolio`: explicit publication gate; new repositories default to `FALSE`.
- `featured`: puts the project in the featured group.
- `display_order`: nonnegative integer; lower values appear first.
- `section` and `category`: portfolio grouping.
- `custom_title` and `custom_description`: optional editorial overrides.
- `portfolio_image`: approved HTTPS project image.
- `tech_stack_override`: comma-separated curated stack when GitHub topics/language are insufficient.
- `demo_url_override`: optional HTTPS demo override.
- `kpi_highlight`: evidence-backed outcome only.
- `portfolio_status`: `active`, `draft`, `completed`, or `historical`.
- `visibility_note`: internal note; never published.
- `last_reviewed_at`: owner review timestamp.

## Repository lifecycle

- New repositories are snapshotted and receive an unpublished curation row.
- Renames are reconciled by immutable GitHub repository ID; curation is preserved.
- Private or deleted repositories disappear from GitHub's public result, remain temporarily as `unavailable`, and are excluded from the public DTO.
- Missing snapshot records are retained for 30 days to permit recovery without losing curation.
- Archived repositories are hidden unless their curation status is `completed` or `historical`.
- Missing demo URLs omit the demo button.
- Missing images render a neutral unavailable-preview state.
- Missing descriptions remain blank unless a reviewed custom description exists.

## Scheduling and caching

`installGitHubSyncTrigger()` replaces any existing `syncGitHubProjects` trigger and installs a six-hour time-driven trigger. Run it once as the deployment owner after deployment.

The synchronizer uses conditional GitHub requests with ETag, bounded pagination, and a public-repository-only query. Candidate snapshots are staged in chunked Script Properties, required Sheet writes are verified, and a single generation marker promotes the candidate only after verification. The final public response is cached for ten minutes when it fits within the Apps Script cache-item limit. The frontend also stores the last valid public DTO locally for temporary API outages.

GitHub 403/429 responses are rejected without advancing the snapshot. `Retry-After` and `X-RateLimit-Reset` are parsed into safe execution diagnostics when present. The synchronizer does not create an automatic retry job, so `next_retry_at` remains blank and the next installed six-hour trigger run performs the next attempt.

## Optional authentication

Initial synchronization uses GitHub's public API. If shared unauthenticated limits prove unreliable, configure a separate fine-grained read-only token as `GITHUB_METADATA_TOKEN` in Apps Script Script Properties. Do not reuse `GITHUB_TOKEN`, which belongs to the independent blog repository-dispatch pipeline.

Never place either token in Sheets, source, generated files, frontend JavaScript, logs, or documentation values.

## Manual operations

- `syncGitHubProjects()`: fetch and reconcile immediately.
- `installGitHubSyncTrigger()`: install the six-hour schedule.
- `invalidatePublicPortfolioCache_()`: internal cache invalidation helper.

After curation changes, allow the ten-minute cache to expire. A deployment owner may run the internal invalidation helper when an immediate refresh is required.

## Recovery

- GitHub/API failure: retain and serve the last-known-good snapshot.
- Partial or malformed response: reject the refresh; do not treat missing rows as deletions.
- Required Sheet write or verification failure: restore the previous Sheet values, committed generation marker, and ETag; discard the uncommitted staged generation.
- Public DTO cache miss: rebuild from validated Sheet/snapshot data.
- Apps Script outage: returning visitors receive the last browser-cached DTO; new visitors see a restrained unavailable state.
- Faulty deployment: point the existing `/exec` deployment back to the prior Apps Script version.

Consult [Security](SECURITY.md) and [Deployment](DEPLOYMENT.md) before changing the synchronization code or trigger.
