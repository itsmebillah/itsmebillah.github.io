# Site Feature Control

## Architecture

`Master Dashboard -> authenticated Admin API -> Site_Features Sheet -> public DTO -> portfolio runtime`

Feature visibility is separate from record visibility. Disabling FAQ hides the complete FAQ section; enabling FAQ still returns and renders only FAQ rows whose existing `Active` value is true. The same existing record-level behavior remains for skills, experience, education, certificates, blogs, projects, and other managed collections.

## Feature List

The implemented controls reflect actual portfolio functionality: Hero, About / Profile, Skills, Projects, Certificates, Blog, Experience, Education, FAQ, Contact, Chatbot, Resume / CV, and Social Links. Experience and Education share the timeline section but their records are controlled independently.

## Sheet Schema

The idempotent `Site_Features` table uses:

| Field | Purpose |
| --- | --- |
| `RecordID` | Immutable row identity |
| `FeatureKey` | Strict allowlisted runtime key |
| `FeatureName` | Administrator-facing name |
| `Description` | Administrator-facing purpose |
| `Active` | Feature-level visibility |
| `DisplayOrder` | Dashboard ordering |
| `UpdatedAt` | Last mutation timestamp |

Existing rows are preserved. Missing allowlisted feature rows are added active by default during idempotent initialization.

## APIs

- `siteFeatures.list` requires an authenticated administrator session.
- `siteFeatures.update` requires an authenticated administrator session, validates `FeatureKey`, boolean `Active`, and optional non-negative `DisplayOrder`, then updates only the selected row.
- Every mutation invalidates the centralized public cache and writes a sanitized enabled/disabled activity record.
- Public schema v1 adds `siteFeatures` backward-compatibly. Only `active` and `displayOrder` are exposed for known keys.

## Frontend Behavior

Disabled sections use the native hidden state, leaving no visual gap. Matching desktop and mobile navigation links are hidden. Chatbot controls, resume action, and social links follow their own feature states. Missing feature configuration defaults to active so an older API response cannot unexpectedly remove the portfolio.

The website refreshes through the existing centralized data request; no polling or frontend deployment is needed after an administrator changes a toggle.

## Safety

- No unrestricted Sheet or range operations are exposed.
- No content rows are deleted when a feature is disabled.
- Existing Active, Published, and project curation values remain independent.
- GitHub synchronization is not involved.
- Private configuration and notes are absent from the public DTO.

## Verification

Tests cover strict API allowlisting, admin routing and validation, activity logging, FAQ record filtering, disabled section and navigation behavior, independent Education/Experience behavior, chat and contact visibility, desktop/mobile layouts, themes, and existing DTO/security/synchronization regressions.

## Production Release

- Apps Script production deployment: immutable Version 29
- Sheet: `Site_Features!A1:G14`, 13 active defaults, frozen header, boolean validation
- Public API: HTTP 200, JSON schema v1, backward-compatible `siteFeatures` section
- Production verification write: one expected `VisitorLog` row from the single anonymous `getAllData` request
- GitHub synchronization and project curation: unchanged

SITE_FEATURE_CONTROL_VERIFIED
