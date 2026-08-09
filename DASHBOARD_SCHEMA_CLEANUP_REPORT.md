# Dashboard Schema Cleanup Report

## Final status

`DASHBOARD_SCHEMA_CLEANUP_VERIFIED`

## Scope

Only these production tabs were migrated:

- `Portfolio_Media` (`sheetId: 27888938`)
- `Portfolio_SEO` (`sheetId: 395199350`)

No GitHub synchronization, project curation operation, public API change, or unrelated Sheet edit was performed.

## Preflight inspection

The production cell-level read confirmed:

- Column A was empty in both tabs.
- Media headers occupied `B1:K1` and matched the expected ten-field schema exactly.
- SEO headers occupied `B1:M1` and matched the expected twelve-field schema exactly.
- Both tabs contained headers only; there were no production records.
- The inspected ranges contained no formulas, validation, notes, hyperlinks, or other values to preserve below the headers.
- Both tabs had one frozen header row.

## Root cause

Apps Script represents a newly inserted blank sheet as a one-cell data range. `ensureAdminEntitySchema_()` treated that empty cell as an existing header entry, so its first required header was written into column B.

## Migration

One atomic Google Sheets batch deleted only column A from the two preflighted sheet IDs. Native column deletion shifted all cells and formatting one column left without rewriting field values.

Post-migration schemas:

### Portfolio_Media

`media_id`, `drive_file_id`, `public_url`, `alt_text`, `usage`, `project_id`, `mime_type`, `active`, `display_order`, `updated_at`

### Portfolio_SEO

`seo_id`, `scope`, `entity_id`, `page_title`, `meta_description`, `canonical_url`, `og_title`, `og_description`, `og_image`, `active`, `display_order`, `updated_at`

Both schemas now begin at `A1`, remain empty below the header, and retain a frozen header row.

## Idempotency and safety

`Admin.js` now provides `cleanupDashboardSchema()` and a shared guarded normalizer used by `setupMasterDashboard()`.

The migration logic returns without changes when headers already begin at A. It shifts a column only when all conditions are true:

1. The entire leading column is empty.
2. The first header is blank.
3. Every following header exactly matches the expected schema in order.

Any nonblank leading value, missing field, extra field, renamed field, or reordered schema raises `DASHBOARD_SCHEMA_CONFLICT` instead of changing the sheet. New blank sheets are now treated as having zero headers, preventing recurrence.

## Data preservation

- Existing Media rows preserved: no rows existed.
- Existing SEO rows preserved: no rows existed.
- Header meanings and ID fields preserved exactly.
- Existing project curation was not read or modified.
- Other production tabs were excluded from the batch.
- No rows were deleted, appended, or overwritten.

## Dashboard CRUD readiness

The normalized header lists exactly match `ADMIN_ENTITIES.media` and `ADMIN_ENTITIES.seo`, including their respective `media_id` and `seo_id` keys. Dashboard list, create, update, and archive operations can now resolve all configured fields from column A onward.

No test records were inserted into production. CRUD contract readiness was verified from the live schema and server field mapping without creating cleanup data.

## Tests

- Unit and contract tests: **53/53 passed**.
- Apps Script syntax checks: **passed**.
- Git diff/schema checks: **passed**.
- Exact ready schema returns without mutation: **passed**.
- Exact schema behind an empty leading column produces a shift plan: **passed**.
- Nonblank leading column is rejected: **passed**.
- Header mismatch is rejected: **passed**.
- Live post-migration header verification: **passed**.

## Deployment and rollback

- Immutable Apps Script version: **26**.
- Production deployment updated in place to Version 26.
- Deployment ID: `AKfycbwmQcArmH_TZ9Y8mP_XiyWgSCzU1QpmK7Iw3y5exUOKenl6p4ZOhTd7dxh-E8fpeJj1Mg`.
- Version 26 `Admin.js` SHA-256: `8603E436018E82C090C8F5593309AF63A04A099CDA6ADF69EDC0D1DE68045782`.
- Independently downloaded immutable source matched the tested local file exactly.
- Version 25 remains available for code rollback. The normalized Sheet layout is also compatible with Version 25 CRUD logic.

## Master Dashboard continuation

The schema blocker is resolved. The next production verification is the owner-only first login and required password change. That action requires the owner's temporary bootstrap password and intentionally cannot be executed without owner credentials. `syncGitHubProjects` remains untouched.
