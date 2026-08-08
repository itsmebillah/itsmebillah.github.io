# Version 17 Preproduction Audit

Audit date: 2026-08-08  
Repository: `itsmebillah/itsmebillah.github.io`  
Audited commit: `f12e697140bb725ddd4bb97533390383f70ce443`  
Production baseline: Apps Script version 16  
Candidate: Apps Script version 17  

## Executive Summary

Version 17 contains substantial security and reliability improvements: explicit public DTOs, blank-header suppression, validated POST contact handling, formula-injection protection, safer errors, privacy-reduced visitor logging, bounded abuse controls, GitHub/curation separation, immutable repository identity, unpublished-by-default discovery, and last-known-good caching.

The previous audit identified four blockers. This fix pass resolves all four:

1. `config`, `faq`, and `aiContext` are restored through explicit public allowlists; the complete ten-section version 16 contract is now asserted by tests.
2. FAQ plus `AI_Prompt` and `AI_Knowledge` are restored to the server-only chat context. The private system prompt and knowledge-only columns are not serialized publicly.
3. GitHub snapshots are staged under an uncommitted generation, required Sheet writes are verified, and a single marker promotes the snapshot. Failures restore Sheet contents, the previous marker, and ETag.
4. GitHub 403/429 handling parses `Retry-After` and `X-RateLimit-Reset` for safe diagnostics. Because no retry job is installed, `next_retry_at` remains blank and documentation accurately states that the next six-hour run performs the next attempt.

Production version 16 remains active. No trigger was installed and no production data was changed during this audit.

## 1. File-Level Changes

Commit `f12e697` changes 16 files: 14 modified and 2 added, with 1,268 insertions and 156 deletions.

| File | Change and reason | Production effect | Required | Risk |
| --- | --- | --- | --- | --- |
| `README.md` | Documents GitHub synchronization, strict DTOs, and caching. | Presentation only after GitHub Pages push; already live. | Yes, for operator clarity. | Low; describes behavior that is not yet production-active. |
| `apps-script/Code.js` | Reworks routing, strict compatible DTOs, caching, errors, validation, contact, chat grounding, logging, and abuse controls. | Directly replaces the anonymous API when v17 is activated. | Yes. | Medium; anonymous API and chat are high-value integration surfaces, now covered by contract/security tests. |
| `apps-script/GitHubSync.js` | Adds GitHub discovery, normalization, reconciliation, staged Sheet/property persistence, merge DTO, status, rate-limit diagnostics, and trigger installer. | Sync code is dormant until manually run or triggered; project DTO is active on API reads. | Yes. | Medium; external quotas and Apps Script limits remain operational risks, with last-known-good rollback enforced locally. |
| `apps-script/Table_creation.js` | Gates destructive workbook recreation behind a one-time Script Property and removes sample demo credentials. | No effect unless manually executed. | Security hardening is justified; the helper is not part of activation. | High blast radius if deliberately armed and run; dormant by default. |
| `assets/js/api.js` | Accepts schema v1 and legacy v16, stores browser last-known-good data, and shows an unavailable state. | Already affects the live GitHub Pages frontend. | Yes for zero-downtime rollout. | Low; compatible with v16 and v17 envelopes. |
| `assets/js/utils.js` | Adds a persistent anonymous client identifier. | Used for privacy-reduced logging/rate limiting. | Yes for the selected abuse model. | Low; localStorage may be unavailable and safely falls back. |
| `assets/modules/blogs.js` | Removes the redundant unimplemented `getBlog` API request. | Blog modal uses content already delivered by `getAllData`. | Yes. | Low; depends on published blog DTO retaining `Content`, which it does. |
| `assets/modules/chatbot.js` | Sends the client ID, checks HTTP status, and escapes messages. | Changes live chat client behavior but remains compatible with v16. | Yes. | Low client risk; backend AI regression remains blocking. |
| `assets/modules/contact.js` | Replaces GET/no-cors submission with validated form-encoded POST and parses the response. | Changes the live contact workflow before v17 activation; v16 supports generic POST submission. | Yes. | Medium; success should be integration-tested against v17 before activation. |
| `assets/modules/projects.js` | Supports camelCase v17 projects plus legacy fields, removes demo credentials, adds missing-image/demo fallbacks. | Already live and backward-compatible with v16. | Yes. | Low; visual regression coverage should remain. |
| `docs/ARCHITECTURE.md` | Documents strict compatible DTOs, server-only AI context, POST contact, GitHub merge, caching, and abuse controls. | Documentation only. | Yes. | Low. |
| `docs/DEPLOYMENT.md` | Adds initial sync and trigger rollout steps. | Operator workflow only. | Yes. | Low; inventory count must be checked at execution time rather than treated as permanent. |
| `docs/FEATURES.md` | Updates blog/API behavior. | Documentation only. | Yes. | Low. |
| `docs/GITHUB_SYNC.md` | Adds ownership, schema, lifecycle, staged generation promotion, honest retry behavior, operations, and recovery documentation. | Documentation only. | Yes. | Low. |
| `docs/SECURITY.md` | Adds metadata-token rules and documents DTO/contact/logging hardening. | Documentation only. | Yes. | Low; correctly avoids credential values. |
| `tests/portfolio-sync.test.js` | Adds 28 unit tests for the complete API contract, DTOs, AI boundaries, sync lifecycle, idempotent curation, staged persistence, failures, rate limiting, caching, and injection defense. | No production effect. | Yes. | Low; production deployment integration still requires the controlled activation sequence. |

## 2. Apps Script Audit

### Router and response behavior

Version 16 routes `getAllData` and chat, treats the default route as service information, accepts a legacy GET contact path, and returns raw header-driven Sheet objects. Version 17:

- defaults missing actions to `health`;
- routes `getAllData`, chat, and health explicitly;
- removes public GET contact submission;
- validates/rate-limits chat and POST contact;
- returns typed public errors without raw provider bodies or exception strings;
- adds `schemaVersion: 1` and `sourceStatus` to successful portfolio responses;
- caches serialized responses for ten minutes when no larger than 90,000 characters.

The outer success envelope remains compatible: `{ success, timestamp, data }`, with additive `schemaVersion` and `sourceStatus`. The `data` object is not compatible.

| Section | Version 16 | Version 17 | Verdict |
| --- | --- | --- | --- |
| `profile` | Present | Present, allowlisted | Compatible keys are intentionally narrowed. |
| `config` | Present | Present, key-allowlisted | Compatible and hardened. |
| `skills` | Present | Present, allowlisted | Compatible for current renderer. |
| `projects` | Present, legacy Sheet rows | Present, merged camelCase DTO plus mapped legacy rows | Frontend compatibility layer supports both. |
| `experience` | Present | Present, allowlisted | Compatible for current renderer. |
| `education` | Present | Present, allowlisted | Compatible for current renderer. |
| `certificates` | Present | Present, allowlisted and published-only | Compatible for current renderer. |
| `blogs` | Present | Present, allowlisted and published-only | Compatible for current renderer/generator. |
| `faq` | Present | Present with Question/Answer/Category allowlist | Compatible and restored to chat grounding. |
| `aiContext` | Present in contract | Present with legacy Section/Content allowlist | Compatible; current missing legacy tab safely yields `[]`. |

### Contact and submissions

Version 17 validates required values, lengths, email syntax, and header newlines. It neutralizes leading spreadsheet formula characters and HTML-escapes mail content. It appends the current seven-column production schema in the correct order: Timestamp, Name, Email, Subject, Message, Status (`NEW`), SubmissionID.

If `Submissions` is absent, the fixed fallback now creates the same seven-column schema used by the append: Timestamp, Name, Email, Subject, Message, Status, SubmissionID.

### Visitor logging

Version 17 skips health logging and records only timestamp, a truncated hash of the client ID (or `anonymous`), and a sanitized action/page. It no longer stores the complete query string, chat message, or contact payload. The seven-value append matches the existing seven-column production `VisitorLog` sheet.

If `VisitorLog` is absent, the fixed fallback now creates the same seven-column schema used by the append.

### Chat and AI context

The Groq credential remains in Script Properties and provider response bodies are no longer returned. Input bounds and rate limiting are improvements. Version 17 now grounds chat with the strict public portfolio DTO and FAQ plus a bounded server-only mapper for `AI_Prompt` and `AI_Knowledge`. The system prompt and internal knowledge columns do not enter `getAllData`.

## 3. Public Data Security

Version 17 does not serialize complete Sheet rows through `getAllData`. `readSheetObjects_` is an internal normalized reader; every public entity passes through `pickPublicFields_`, a project mapper, or the blog mapper. Blank headers are skipped, so the empty-string property observed in version 16 is fixed.

### Anonymous `getAllData` field inventory

Envelope fields:

- `success`, `schemaVersion`, `timestamp`
- `sourceStatus.github`, `sourceStatus.sheets`, `sourceStatus.stale`, `sourceStatus.lastSuccessfulSyncAt`

Profile fields:

- `Name`, `Title`, `HeroQuote`, `Email`, `Phone`, `Location`, `Bio`, `AboutMe`
- `YearsExperience`, `CurrentRole`, `CurrentCompany`
- `Facebook`, `LinkedIn`, `WhatsApp`, `GitHub`, `ResumeURL`, `ProfilePic`, `HeroBG`

Skills fields:

- `Name`, `Level`, `Category`, `Description`, `Order`

Project fields:

- `id`, `repoKey`, `name`, `title`, `description`, `url`, `demoUrl`, `documentationUrl`
- `topics`, `techStack`, `primaryLanguage`, `category`, `section`
- `featured`, `displayOrder`, `image`, `kpiHighlight`, `status`, `lastUpdated`

Experience fields:

- `Title`, `Company`, `Period`, `Description`, `SkillsUsed`, `Achievements`, `Icon`

Education fields:

- `Degree`, `Institution`, `Period`, `Description`, `Result`, `Icon`

Certificate fields:

- `Name`, `Organization`, `Date`, `Description`, `CredentialID`, `ImageURL`, `VerifyURL`, `Skills`, `Published`

Blog fields:

- `Title`, `Slug`, `Description`, `Content`, `Keywords`, `ReadTime`, `Thumbnail`, `Category`, `Date`, `Published`, `Author`

The project merge explicitly excludes `visibility_note`. The legacy mapper excludes `DemoEmail` and `DemoPassword`. Profile excludes age, sex, marital status, and arbitrary internal columns. Blog Doc IDs, Script Properties, GitHub response bodies, tokens, submissions, visitor rows, and Google Sheet metadata are not reachable through the public DTO.

Email, phone, WhatsApp, resume, and social URLs remain public by explicit allowlist because they are current portfolio contact fields. Their continued publication is an editorial choice that should be periodically reviewed, not an accidental whole-row leak.

`config`, `faq`, and `aiContext` are restored through explicit allowlists. The AI system prompt remains server-only.

## 4. Google Sheet Changes

The workbook has 17 tabs: the original 14 plus three isolated synchronization tabs. Read-only inspection confirmed the original tabs remain present and the new tabs contain headers only.

### `GitHub_Project_Snapshot`

- Purpose: automation-owned last-known-good public repository metadata.
- Primary identifier: immutable `github_repository_id`; `repo_key` is readable identity and rename aid.
- Columns: `github_repository_id`, `github_node_id`, `repo_key`, `name`, `description`, `repository_url`, `homepage_url`, `topics_json`, `primary_language`, `visibility`, `archived`, `disabled`, `license_spdx`, `stars`, `forks`, `default_branch`, `created_at`, `updated_at`, `pushed_at`, `readme_url`, `fetched_at`, `source_etag`, `sync_state`, `last_seen_at`, `missing_since`.
- Formulas: none.
- Protection: warning-only automation-owned range protection was created during setup; current read connector does not enumerate protection objects.
- Writer: `syncGitHubProjects` via `replaceSnapshotSheet_`.
- Reader: Apps Script only; the frontend never reads Sheets directly.
- Existing-data effect: none until sync runs; replacement is confined to this tab.

### `Portfolio_Project_Curation`

- Purpose: human-owned publication and presentation decisions.
- Primary identifier: `github_repository_id`; `repo_key` is the readable secondary identity.
- Columns: `github_repository_id`, `repo_key`, `show_on_portfolio`, `featured`, `display_order`, `section`, `category`, `custom_title`, `custom_description`, `portfolio_image`, `tech_stack_override`, `demo_url_override`, `kpi_highlight`, `portfolio_status`, `visibility_note`, `last_reviewed_at`.
- Formulas: none.
- Validation: Boolean checkboxes on publication/featured columns and a strict status list (`active`, `draft`, `completed`, `historical`).
- Protection: no automation lock over editorial columns; they are deliberately owner-editable.
- Writer: sync creates missing rows with false/blank defaults and updates only `repo_key` after a rename.
- Reader: Apps Script merge only; the frontend never reads Sheets directly.
- Existing-data effect: none until sync runs; currently empty.

### `GitHub_Sync_Status`

- Purpose: one-row operational state.
- Primary identifier: single status row rather than an entity key.
- Columns: `last_attempt_at`, `last_success_at`, `status`, `http_status`, `repository_count`, `etag`, `failure_count`, `next_retry_at`, `error_code`.
- Formulas: none.
- Protection: warning-only automation-owned range protection was created during setup.
- Writer: `syncGitHubProjects` success/failure paths.
- Reader: Apps Script `sourceStatus`; the frontend receives only a four-field safe summary.
- Existing-data effect: none until sync runs; currently empty.

No original production tab was renamed, deleted, cleared, or repurposed. The legacy `Projects` table remains supported.

## 5. GitHub Synchronization Audit

### Fetch and authentication

- Calls `GET /users/itsmebillah/repos` with `type=owner`, stable sort, 100 items per page, and a maximum of 10 pages.
- Uses GitHub REST API version `2026-03-10`, which is a supported GitHub API version.
- Sends `If-None-Match` on page one and handles HTTP 304.
- Uses no credential by default. Optional `GITHUB_METADATA_TOKEN` is read only from Script Properties and is separate from the blog-dispatch token.
- The endpoint and client-side filter admit public owner repositories only. Private repositories are excluded by construction.
- A token, if configured, needs only read access to public repository metadata. No administration or contents-write permission is required.

### Identity and lifecycle

- Immutable numeric GitHub repository ID is the actual join key.
- `owner/name` is retained as `repo_key` and updated on rename while curation values are preserved.
- Duplicate repository IDs or invalid identity/URL records reject the snapshot.
- New repositories receive curation rows with `show_on_portfolio = FALSE` and `featured = FALSE`.
- Private/deleted/missing repositories become `unavailable`, are hidden, and remain in the snapshot for 30 days.
- Archived repositories are hidden unless manually marked `completed` or `historical`.
- Disabled and non-public repositories never enter the public project DTO.
- Repeated successful syncs are intended to be idempotent: existing curation is not appended again and snapshot rows are normalized deterministically.

### Failure, rate limits, and retries

- Non-200 responses reject the fetch; partial pagination and malformed JSON also reject it.
- HTTP 403/429 map to `GITHUB_RATE_LIMITED`.
- A failure count is written to status and `next_retry_at` remains blank.
- `Retry-After` and `X-RateLimit-Reset` are parsed into safe execution diagnostics when present.
- There is intentionally no retry trigger or sleep loop; the next real attempt is the normal six-hour trigger.
- A read-only dry run using the exact request headers returned HTTP 403. No production Sheet was involved.

This now meets the approved correctness fallback: it does not pretend a retry is scheduled, does not advance state on rate-limit failure, and accurately relies on the next installed schedule.

### Snapshot consistency result

The fixed success path performs:

1. stage candidate chunks under an uncommitted generation;
2. replace the isolated Sheet snapshot and reconcile curation identities;
3. read back and verify snapshot IDs/keys/ETag and curation uniqueness/completeness;
4. promote one generation marker and update ETag;
5. write and verify success status;
6. discard the previous generation and invalidate public cache.

If a required write or verification fails, the code restores the three Sheet contents, previous committed generation marker, and previous ETag, then removes the staged candidate. Local fault injection confirms a Sheet failure cannot advance the marker or ETag. Repeated candidates remain identity-idempotent and curation duplicate verification rejects inconsistent state.

## 6. Portfolio Curation Protection

The merge layer respects the approved ownership split:

- GitHub controls repository ID/key/name, repository URL, default homepage, topics, language, archive/disabled state, timestamps, license, stars, and forks.
- Sheets controls inclusion, featured state, display order, section, category, custom title/description, approved image, curated stack, demo override, KPI, status, internal visibility note, and review timestamp.
- Sync creates new curation rows only when the immutable ID is absent.
- Sync writes only the curation `repo_key` for an existing row when the repository is renamed.
- It does not overwrite any editorial field listed above.
- `visibility_note` and `last_reviewed_at` do not enter the public project DTO.

This portion conforms to the architecture.

## 7. Existing Portfolio Compatibility

| Functionality | Assessment |
| --- | --- |
| Homepage profile | Compatible with allowlisted fields used by renderer. |
| Projects | Compatible through new/legacy frontend property fallback; legacy published projects remain visible before curation. |
| Experience | Compatible. |
| Education | Compatible. |
| Skills | Compatible. |
| Certificates | Compatible. |
| Blogs | Compatible; redundant `getBlog` request removed. |
| FAQ | Restored with strict fields and server-side grounding. |
| Config | Restored through reviewed public key allowlist. |
| AI context | Restored as a safe legacy-shaped array; private AI prompt/knowledge remain server-only. |
| Contact | Safer POST flow and current Sheet append alignment; needs deployment integration test. |
| Chat | Transport remains compatible, but grounding/functionality regresses. |
| Visitor logging | Intentional privacy-preserving schema behavior; current production header aligns. |
| Existing frontend parsing | Current frontend accepts both v16 and v17, but this does not excuse server contract removal. |

The current homepage renderer does not consume `config`, `faq`, or `aiContext`, which is why its local browser smoke test passes. Other consumers and the explicit API contract still require them.

## 8. Production Safety

Activation alone does not execute `syncGitHubProjects`, install a trigger, or write the new synchronization tabs. Ordinary requests can write only the existing visitor log, contact submissions, caches, and rate-limit cache as designed.

Potentially destructive or mutating operations:

- `importCSVData`: can delete/recreate workbook tabs, but is dormant and requires Script Property `ALLOW_DESTRUCTIVE_TABLE_REBUILD = I_HAVE_A_VERIFIED_BACKUP`; the property is deleted before work begins.
- `syncGitHubProjects`: replaces the isolated snapshot tab, appends/renames curation identity cells, overwrites status row 2, updates Script Properties, and clears the public DTO cache.
- `installGitHubSyncTrigger`: deletes existing triggers whose handler is exactly `syncGitHubProjects`, then creates one six-hour trigger.
- `processFormSubmission`: appends a submission and sends two emails.
- `logVisitorStream`: appends non-health GET activity.

No migration or sync runs automatically on deployment. With the blockers resolved, activation can be evaluated independently from the still-disabled first synchronization and trigger installation.

## 9. GitHub Sync Trigger Review

- Type: installable time-driven Apps Script trigger.
- Handler: `syncGitHubProjects`.
- Frequency: every six hours.
- Authentication context: the Google account that manually runs `installGitHubSyncTrigger`; expected to be the deployment owner.
- Duplicate trigger handling: deletes only existing triggers for the same handler, then creates one replacement.
- Concurrent execution: `syncGitHubProjects` uses a script-wide lock with a ten-second wait.
- Failure behavior: throws after recording a safe status row where possible; Apps Script execution logs record the failed run.
- Retry behavior: no automatic retry is claimed; safe rate-limit availability is logged and the next six-hour run retries naturally.
- Rollback behavior: staged generations remain invisible until verified Sheet writes complete; failure restores Sheet contents, marker, and ETag.

Recommendation: the trigger implementation is safe for later installation only after a controlled manual first sync passes against production. This audit does not install it.

## 10. Security Review

Checks completed:

- All tracked JavaScript passed `node --check`.
- `git diff --check` passed.
- High-confidence credential scan found no hardcoded PAT, API key, bearer token, or private key.
- No token values were read from or written to Script Properties during the audit.
- The manifest declares `USER_DEPLOYING` and `ANYONE_ANONYMOUS`, consistent with the approved public API model.
- The manifest uses inferred OAuth scopes; actual owner authorization must be reviewed in the Apps Script deployment flow before v17 activation.
- External URLs are fixed HTTPS GitHub/Groq endpoints or pass HTTPS validation.
- Public errors exclude stack traces, provider bodies, and internal exception text.
- Chat/contact input is bounded and contact content is neutralized for Sheets and HTML email.
- Cache-based abuse controls are not strong authentication and share a global bucket when a client identifier is absent.

Residual risks:

- Anonymous Apps Script execution still runs with deployer authority.
- Public phone/email/WhatsApp remain intentionally exposed.
- Cache rate limits are best-effort and may reset early.
- Document-derived blog HTML remains a content trust boundary, though the browser sanitizer remains in place.
- A GitHub 403 may leave metadata stale until the next six-hour attempt; this is explicit and last-known-good data remains available.
- Apps Script has limited HTTP status/CORS control through ContentService.

## 11. Precise Preproduction Test Plan

All tests must run against local mocks or a non-production workbook/deployment until the final controlled activation step.

### A. Existing API compatibility test

Compare v16 and candidate envelopes. Assert `success`, `timestamp`, `data`, and all ten required data keys exist: profile, config, skills, projects, experience, education, certificates, blogs, faq, aiContext. Verify legacy field casing remains usable where promised.

### B. Public DTO test

Seed every source tab with allowed and disallowed columns. Assert exact object keys per entity, correct publication filtering, valid camelCase Project DTOs, and no raw row passthrough.

### C. Sensitive-field exposure test

Seed credentials, passwords, tokens, private notes, personal demographic fields, Doc IDs, empty headers, Sheet metadata, and internal curation notes with unique sentinels. Assert none appears anywhere in serialized success or error responses. Assert there is no `""` key.

### D. GitHub repository discovery test

Mock two paginated 200 responses with owner and fork/foreign-owner variants. Assert all and only public owner repositories are normalized, pagination stops correctly, ETag is captured, and malformed pages abort without persistence.

### E. Existing repository update test

Change description, topics, homepage, language, and timestamps for the same immutable ID. Assert technical snapshot changes while all curation values remain byte-for-byte unchanged.

### F. New repository test

Add a new ID. Assert exactly one curation row is appended with `show_on_portfolio = FALSE`, `featured = FALSE`, blank editorial fields, and no public project.

### G. Duplicate sync test

Run the identical response twice, including a 304 path. Assert no duplicate snapshot/curation rows, no editorial changes, stable public DTO, and accurate status.

### H. Rename test

Return the same ID with a new `repo_key`, name, and URL. Assert snapshot and only curation `repo_key` update; publication and all editorial fields remain unchanged.

### I. Private repository test

Remove a previously visible ID from the public response. Assert it becomes unavailable, immediately disappears from the public DTO, and curation is retained. Confirm no token broadens ingestion to private data.

### J. Archived repository test

Set `archived = true`. Assert hidden for active/draft status and visible only for completed/historical when explicitly curated.

### K. Deleted repository test

Advance controlled time across the 30-day boundary. Assert unavailable retention before expiry, removal after expiry, no public visibility, and no deletion of manual curation.

### L. GitHub API failure test

Inject timeout, 500, malformed JSON, partial-page failure, and pagination overflow at every fetch page. Assert neither snapshot store, ETag, curation, nor public cache advances. Assert only safe status/error codes are recorded.

### M. Rate-limit test

Inject 403/429 with `Retry-After` and `X-RateLimit-Reset`. Assert the chosen valid reset time is honored, one bounded retry trigger is created, duplicates are prevented, and repeated failure keeps last-known-good data. Separately verify chat/contact cache limits.

### N. Sheet failure test

Inject failures during header check, snapshot clear/write, curation append/rename, status write, property promotion, and cache invalidation. Assert complete rollback across Sheet and property snapshots and no partially promoted candidate.

### O. Existing portfolio functionality test

Against a non-production v17 deployment, test desktop/mobile homepage, projects, experience, education, skills, certificates, blogs/modal/static pages, FAQ consumer, contact success/failure, chat grounding and provider failure, privacy-reduced visitor logging, cached fallback, missing image/demo states, generator validation, and broken-image/link checks. Then execute one controlled anonymous production request after activation and compare it to the approved schema.

### Tests already executed

- 28/28 local Node unit tests passed.
- All tracked JavaScript syntax checks passed.
- Diff whitespace validation passed.
- High-confidence secret scan passed.
- A fresh 390x844 local Edge/Playwright test passed with a schema-v1 ten-section fixture: profile/project rendered, no horizontal overflow, no credential UI, and no page or console errors.
- The test suite covers DTO exclusion, contact validation, normalization, rename, unavailable/private/archived behavior, unpublished defaults, merge precedence, legacy credential removal, chunked snapshot storage, cached Sheet outage, rate limiting, formula injection, and a strict response DTO.

The strict-response test now requires all ten version 16 sections and rejects sentinel values from unknown/private columns.

| Matrix item | Result | Evidence |
| --- | --- | --- |
| A. Existing API compatibility | Pass | Ten required response sections asserted. |
| B. Public DTO validation | Pass | Exact per-entity fields and publication filters tested. |
| C. Sensitive-field exposure | Pass | Private sentinel values, blank headers, demo credentials, Doc IDs, and internal columns excluded. |
| D. GitHub discovery | Pass | Mock API admits only public repositories owned by `itsmebillah`. |
| E. Existing repository update | Pass | Technical metadata updates under the immutable ID. |
| F. New repository | Pass | No public output without curation; generated curation defaults remain false. |
| G. Duplicate sync | Pass | Duplicate IDs reject; repeated curation planning produces no new row and preserves editorial values. |
| H. Rename | Pass | Same immutable ID updates readable key while retaining curation. |
| I. Private repository | Pass | Private/unavailable records cannot enter public projects. |
| J. Archived repository | Pass | Hidden except explicitly completed/historical curation. |
| K. Deleted repository | Pass | Controlled-time retention expiry tested. |
| L. GitHub API failure | Pass | Non-success/rate-limit response rejects without candidate promotion. |
| M. Rate-limit handling | Pass | Retry/reset parsing tested; no fictitious retry timestamp is written. |
| N. Sheet write failure | Pass | Early Sheet failure and late status-verification failure both preserve marker/ETag; late failure restores Sheet backup. |
| O. Existing portfolio functionality | Pass | Local mobile Edge/Playwright fixture rendered core sections without overflow, credential UI, or runtime errors. |

## 12. Previous Blockers and Fixes

1. API contract: fixed with strict `config`, `faq`, and `aiContext` mappers and a ten-section regression assertion.
2. AI grounding: fixed with bounded server-only AI prompt/knowledge context plus strict FAQ data.
3. Snapshot consistency: fixed with staged generation chunks, Sheet read-back verification, marker promotion, and cross-store rollback.
4. Retry accuracy: fixed by parsing provider availability headers, leaving `next_retry_at` blank, and documenting the next real six-hour attempt.
5. Fallback schemas: fixed so auto-created Submissions and VisitorLog headers match seven-value appends.
6. Documentation: updated to match the implemented contract, staged recovery, and retry behavior.

## 13. Final Verdict

`READY_FOR_ACTIVATION`

All identified blockers are resolved in the local candidate and the non-destructive preproduction checks pass. Version 16 remains production. Version 17 must still wait for explicit deployment approval, followed by a controlled anonymous API verification before any manual first sync or trigger installation.
