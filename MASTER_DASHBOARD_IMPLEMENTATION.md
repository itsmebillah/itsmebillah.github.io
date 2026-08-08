# Master Portfolio Dashboard Implementation

## Architecture

The dashboard is a static, responsive GitHub Pages application at `/admin/`. It sends form-encoded requests to the existing Apps Script deployment using the single `action=admin` route. Apps Script authenticates the request, dispatches a fixed command, validates values, and reads or writes only the mapped Google Sheet fields.

The existing public portfolio API, Google Sheets backend, GitHub snapshot/curation merge, manual projects, six-hour trigger, screenshot discovery, chat, contact, and blog automation remain in place.

## Authentication

- Administrator: `itsmbillah@gmail.com`
- Initial secret is provisioned through the one-time `ADMIN_BOOTSTRAP_PASSWORD` Script Property.
- The setup function replaces it with a salted password verifier and deletes the bootstrap value.
- Initial login creates a restricted session that can only change the password or log out.
- Replacement passwords require 12+ characters with upper/lowercase, a number, and a symbol.
- Sessions expire after 30 minutes idle or eight hours absolute and are revoked after password changes.

No password, token, verifier, or private AI configuration is included in public/browser source or Google Sheets.

## Modules

The dashboard provides Overview, Projects, Profile, Skills, Experience, Education, Certificates, Blog, FAQ, Configuration, Media, SEO, AI / Chat, GitHub Sync, Activity Log, and Account / Security.

GitHub project technical fields remain read-only. Dashboard changes are limited to `Portfolio_Project_Curation`. Manual projects remain independent of GitHub and support the existing Autopilot, Car Sales, and HR Analytics case studies.

## Media And SEO

The owner setup creates fixed Media and SEO registries. Media records store public URLs or Drive file IDs, alt text, use, association, MIME type, status, and order. The dashboard does not change Drive sharing; an image must already be anonymously accessible before public use.

SEO records store scoped manual overrides. Automatic public defaults remain derived from existing portfolio content. Static crawler-visible metadata still requires the existing GitHub Pages generation/deployment flow.

## GitHub Synchronization

The Sync Center displays sanitized status and can invoke the existing sync engine. It preserves the ScriptLock, GitHub rate-limit handling, staged/committed snapshots, curation reconciliation, last-known-good data, and six-hour trigger. New repositories remain unpublished.

## Rollback

Repoint the existing Apps Script deployment to Version 22 and revert the dashboard commits through normal follow-up commits. Added Sheet columns/tabs are backward-compatible and should be retained for recovery; do not delete or clear them during rollback.

## Usage

1. Open the portfolio and select the subtle **Login** link.
2. Sign in with the administrator email and temporary owner-provisioned password.
3. Complete the required password change.
4. Use the module navigation to manage content. Archive records instead of deleting them when possible.
5. Review Sync Center status before using **Sync now**.

