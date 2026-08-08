# Admin Bootstrap Password Hash Fix

## Final status

`ADMIN_BOOTSTRAP_HASH_FIXED`

## Root cause

The bootstrap failed in `pbkdf2_()` on the second HMAC invocation. The first invocation returned an Apps Script byte array (`number[]`), but the implementation then called:

```javascript
Utilities.computeHmacSha256Signature(block, password)
```

That supplied `(number[], String)`. Google Apps Script does not provide a `computeHmacSha256Signature` overload for that mixed pair, which produced the reported method-signature exception.

## Corrected implementation

`Admin.js` now converts the password to UTF-8 bytes once, decodes the serialized base64url salt back to bytes, appends the PBKDF2 block index as four bytes, and uses the supported byte-array overload for every HMAC operation:

```javascript
const keyBytes = Utilities.newBlob(String(password)).getBytes();
const saltBytes = Utilities.base64DecodeWebSafe(String(salt));
let block = Utilities.computeHmacSha256Signature(
  saltBytes.concat([0, 0, 0, 1]),
  keyBytes
);

for (let i = 1; i < iterations; i++) {
  block = Utilities.computeHmacSha256Signature(block, keyBytes);
  // XOR accumulation is unchanged.
}
```

Both arguments are now `Byte[]`/`number[]` at each HMAC call. The verifier format remains:

```text
pbkdf2-sha256$20000$<base64url-salt>$<base64url-digest>
```

## Security implications

- The configured 20,000 iterations were not reduced.
- The salt remains a fresh 24-byte value generated for every verifier.
- The salt and digest remain base64url encoded; the plaintext password is not serialized into the verifier.
- The temporary `ADMIN_BOOTSTRAP_PASSWORD` is still deleted only after the verifier and required password-state properties have been written.
- No plaintext fallback or alternative credential store was introduced.

## Failed-execution inspection

The exception occurred while evaluating the value argument of `properties.setProperty(..., createPasswordVerifier_(bootstrap))`. Consequently, that failed statement could not persist a verifier. The later password-state writes and bootstrap-property deletion did not execute.

Spreadsheet access begins only after all password-property operations. Therefore the failed execution could not create tabs, add IDs or columns, or alter rows, curation, Media, SEO, or Activity Log data. A read-only production tab inventory after the failure still contained the pre-bootstrap 18 tabs and did not contain `Portfolio_Media`, `Portfolio_SEO`, or `Admin_Activity_Log`.

Script Properties are not exposed by the available read-only connector. Based on the exact execution order, and absent an independent owner edit after the failure:

- `ADMIN_BOOTSTRAP_PASSWORD` remains present.
- The password verifier remains absent.
- No partial dashboard schema migration occurred.

The setup remains idempotent: once a verifier exists it will not recreate it, and schema setup uses ensure-style operations.

## Verification

- Node test suite: **47/47 passed**.
- Apps Script JavaScript syntax checks: **passed**.
- Git diff validation: **passed**.
- Credential/secret-pattern scan: **passed**.
- Correct password verifies: **passed**.
- Wrong password is rejected: **passed**.
- Two verifiers for the same password have distinct salts and digests: **passed**.
- Verifier does not contain the plaintext password: **passed**.
- Bootstrap deletion is ordered after successful verifier persistence: **passed**.
- HMAC test mock rejects non-array message/key arguments: **passed**.

Neither `setupMasterDashboard` nor `syncGitHubProjects` was executed during this fix.

## Deployment and rollback

- Immutable Apps Script version created: **24**.
- Existing production deployment updated in place to Version 24.
- Deployment identity: `AKfycbwmQcArmH_TZ9Y8mP_XiyWgSCzU1QpmK7Iw3y5exUOKenl6p4ZOhTd7dxh-E8fpeJj1Mg`.
- Immutable Version 24 `Admin.js` was downloaded independently and matched the tested local source exactly.
- Local and Version 24 SHA-256: `E5446ABC0DFF0CFABCDD45DD2642D19E82F71C957D9B250D8FA30E7D7ECEFC23`.
- Version 23 remains available as the last previous production version for rollback.

## Bootstrap readiness

`setupMasterDashboard` is now safe to run once after confirming the temporary bootstrap property is still set. It has intentionally **not** been run. Explicit owner approval is required before that next execution.
