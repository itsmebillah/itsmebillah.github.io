# GitHub Sync Schema Fix Report

**Audit date:** 2026-08-09  
**Production baseline:** Apps Script Version 22  
**Spreadsheet:** `Masum_Portfolio_Database`  
**Spreadsheet ID:** `1ZnoWdyyqzutrIs6SBnYfwN3a9aVsPNPJjzw9lWu76iE`  
**Mode:** Controlled schema audit and backward-compatible migration

## 1. Exact Root Cause

Version 22 added five repository screenshot fields to `GITHUB_SYNC_CONFIG.snapshotHeaders` immediately after `readme_url`:

1. `screenshot_url`
2. `screenshot_path`
3. `screenshot_alt`
4. `screenshot_source`
5. `screenshot_discovery_status`

The existing production `GitHub_Project_Snapshot` retained the Version 21-era 25-column header. In that schema, `fetched_at` immediately followed `readme_url`.

`ensureSheetWithHeaders_()` read the first 30 cells and compared each nonblank existing value with the Version 22 header at the same index. At column U it found `fetched_at`, while Version 22 expected `screenshot_url`. It therefore raised `SHEET_SCHEMA_CONFLICT` before any synchronization write occurred.

This was a positional schema conflict, not a duplicate sheet, duplicate header, malformed repository row, or curation problem.

## 2. Conflicting Sheet

`GitHub_Project_Snapshot`

- Sheet ID: `2100000001`
- Existing data before migration: 15 repository rows
- Frozen rows: 1
- Ownership: synchronization-owned snapshot mirror
- Protection: warning-only automation-owned protected range

The other synchronization sheets were compatible:

- `Portfolio_Project_Curation`: all 16 Version 22 headers matched exactly.
- `GitHub_Sync_Status`: all 9 Version 22 headers matched exactly.
- `Manual_Portfolio_Projects`: not part of `ensureGitHubSyncSheets_()` and was not changed.

## 3. Expected Schema

Version 22 expects this exact 30-column snapshot order:

```text
github_repository_id
github_node_id
repo_key
name
description
repository_url
homepage_url
topics_json
primary_language
visibility
archived
disabled
license_spdx
stars
forks
default_branch
created_at
updated_at
pushed_at
readme_url
screenshot_url
screenshot_path
screenshot_alt
screenshot_source
screenshot_discovery_status
fetched_at
source_etag
sync_state
last_seen_at
missing_since
```

## 4. Actual Schema Before Fix

The production snapshot had these 25 populated headers:

```text
github_repository_id
github_node_id
repo_key
name
description
repository_url
homepage_url
topics_json
primary_language
visibility
archived
disabled
license_spdx
stars
forks
default_branch
created_at
updated_at
pushed_at
readme_url
fetched_at
source_etag
sync_state
last_seen_at
missing_since
```

Exact first mismatch:

| Position | Column | Version 22 expected | Production contained |
|---:|---|---|---|
| 21 | U | `screenshot_url` | `fetched_at` |

The following four old trailing headers were consequently also offset from their expected Version 22 positions.

## 5. Existing Data In The Affected Sheet

Before migration, the snapshot contained 15 nonblank repository rows with 15 unique `github_repository_id` values. The old trailing fields contained fetch timestamps, source ETag values, active sync state, last-seen timestamps, and blank missing-since values.

The curation sheet contained 15 repository-linked rows plus one pre-existing validation-only blank row. The migration did not write to that sheet. All publication, featured, ordering, category, title, description, image, technology, demo, KPI, status, visibility-note, and review values were preserved.

The status row remained unchanged and still records the safe failed attempt:

- status: `failed`
- repository count: `15`
- failure count: `3`
- error code: `SHEET_SCHEMA_CONFLICT`
- last successful sync: `2026-08-08T17:05:54.729Z`

## 6. Fix Applied

One atomic Google Sheets batch update was applied only to `GitHub_Project_Snapshot`:

1. Insert five columns at U:Y, immediately after `readme_url`.
2. Inherit the preceding column structure/style.
3. Write the five Version 22 screenshot header names to U1:Y1.

The insertion shifted the existing `fetched_at` through `missing_since` columns and all 15 rows intact to Z:AD. No row was cleared, deleted, recreated, renamed, or reordered.

No Apps Script source change was required. The Version 22 implementation already expects the correct schema and now matches production.

## 7. Why The Fix Is Safe

- The affected tab is owned by the synchronization engine.
- The exact legacy schema was positively identified before the write.
- Only missing columns were inserted at their intended semantic position.
- Existing values moved through a structural insertion rather than a values rewrite.
- The operation was atomic.
- No curation field or row was touched.
- No project, profile, career, blog, FAQ, AI, contact, visitor, or manual-project tab was modified.
- No duplicate tab or header was created.
- Screenshot cells remain blank until the next approved sync populates them.
- Header formatting was inherited and verified to match the surrounding dark, centered, wrapped, bold header style.

## 8. Data-Preservation Result

Post-migration verification confirmed:

- 15 snapshot rows remain.
- The same 15 immutable repository IDs remain in the same order.
- Old `fetched_at`, `source_etag`, `sync_state`, `last_seen_at`, and `missing_since` values remain aligned with their repositories.
- All 30 headers are unique and match Version 22 exactly.
- The five new screenshot columns contain no fabricated data.
- All 16 curation headers match.
- All repository-linked curation rows and their values remain intact.
- The status sheet and failed-attempt record remain intact.
- Workbook metadata still contains exactly one snapshot, one curation, one sync-status, and one manual-project tab.
- No data loss or unintended production-data mutation was detected.

## 9. Automated Test Result

- Node integration tests: **36/36 passed**
- JavaScript syntax check: **passed**
- Git diff check: **passed**
- Tracked-source secret pattern scan: **passed; no matches**
- Live header/order verification: **passed**
- Live row-count and immutable-ID verification: **passed**
- Live curation preservation verification: **passed**
- Header formatting/structure verification: **passed**

No live GitHub synchronization was executed during this fix.

## 10. Trigger Status

The prior first-sync production report documents that the authenticated owner installed exactly one time-driven `syncGitHubProjects` trigger on the approved six-hour schedule. The installer removes duplicate handler triggers before creating one.

The trigger was not uninstalled, changed, or reconfigured during this work. It no longer faces the known schema conflict because the production headers now match Version 22.

A read-only `clasp logs --json` query could not retrieve live execution history because the Apps Script project has no linked GCP project ID. This limitation does not change the documented trigger configuration. No attempt was made to bypass it, execute the function, or create an API-executable deployment.

## 11. Is A Live Sync Now Safe?

Yes, with respect to the diagnosed `SHEET_SCHEMA_CONFLICT`.

The three sync-owned sheet schemas now match Version 22. The existing ScriptLock, staged snapshot validation, curation-preserving reconciliation, last-known-good snapshot, and rollback logic remain unchanged. A future run can populate the five blank screenshot fields without shifting or overwriting existing snapshot values.

This conclusion does not claim that a live sync has succeeded; no sync was authorized or run in this phase.

## 12. Exact Next Manual Action

After explicit approval, run `syncGitHubProjects` exactly once from the authenticated Apps Script editor. Do not install another trigger or change curation values. Then stop and report the execution result before making any additional request or synchronization attempt.

Because the existing six-hour trigger remains installed, first confirm in the Apps Script Executions view that it has not already completed a successful run since this report. If it has, do not run a redundant manual sync; report that execution instead.

## Final Status

**GITHUB_SYNC_SCHEMA_FIXED**
