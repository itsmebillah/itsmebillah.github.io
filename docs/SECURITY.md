# Security

## Secret inventory

| Property | Location | Purpose | Required |
|---|---|---|---|
| `GROQ_API_KEY` | Apps Script Script Properties | Groq authentication | For chat |
| `GITHUB_TOKEN` | Apps Script Script Properties | GitHub repository dispatch | For automatic publishing |
| `GITHUB_OWNER` | Apps Script Script Properties | Dispatch repository owner | For automatic publishing |
| `GITHUB_REPOSITORY` | Apps Script Script Properties | Dispatch repository name | For automatic publishing |
| `GITHUB_EVENT_TYPE` | Apps Script Script Properties | Workflow event; defaults to `publish-blogs` | Optional |
| `SPREADSHEET_ID` | Apps Script Script Properties or `MASTER_CONFIG` fallback | Deferred worker spreadsheet | Recommended |
| `BLOG_SHEET_NAME` | Apps Script Script Properties or config fallback | Blog tab name | Optional |

Spreadsheet, script, deployment, and public web-app IDs are identifiers, not credentials. They still should not be mistaken for authorization controls.

## Security rules

- Never hardcode API keys, PATs, OAuth tokens, or bearer credentials.
- Never log secrets or request headers containing secrets.
- Never expose Script Properties through `doGet`, `doPost`, generated files, or browser code.
- Use a least-privilege GitHub token scoped to the single repository and repository dispatch requirement.
- Revoke/rotate immediately after suspected exposure; cleanup does not make an exposed key trustworthy again.
- Search both the working tree and all reachable commits before pushing a remediation.
- Do not use secret-scanning bypass links.

## GitHub security

The workflow itself uses the built-in GitHub Actions token with only `contents: write`. Apps Script uses its separate token only to call `/repos/{owner}/{repo}/dispatches`. Branch protection must deliberately allow the workflow's artifact push or route it through an approved review process.

## Deployment security

The Apps Script manifest allows anonymous access and executes as the deployer. Therefore:

- Treat every request and spreadsheet value as untrusted.
- Preserve HTML/URL sanitization and JSON encoding.
- Limit owner permissions because MailApp, Sheets, Docs, triggers, and external fetches execute with owner authority.
- Review logs and quotas for abuse.
- Keep the production deployment versioned and owned by a durable account.

## Secret rotation procedure

1. Revoke the exposed credential at the provider.
2. Create a least-privilege replacement.
3. Update the matching Script Property.
4. Verify no secret is in source, generated output, logs, or reachable Git commits.
5. Redeploy Apps Script if code changed; property-only changes do not require a source push.
6. Test the affected endpoint and record rotation date outside the repository.

## Known risks

- Anonymous chat/contact requests have no explicit rate limiting or caller authentication.
- Every chat request compiles live CMS data and consumes Apps Script/Groq quota.
- Contact uses GET query parameters, which can appear in request logs, and the browser cannot verify a `no-cors` response.
- Visitor logging writes a row for web-app requests and may increase quota/storage use.
- Third-party CDN scripts are not pinned with subresource integrity.
- `Table_creation.js` contains sample demo access values and destructive spreadsheet operations.
- Provider error text is returned in the chat error payload and should never include credentials.
- Google Docs content and CMS HTML remain trust boundaries even with sanitization.

Report security issues privately to the repository owner; do not open an issue containing a credential or exploit payload.
