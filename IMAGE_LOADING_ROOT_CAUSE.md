# Image Loading Root Cause

## Final status

`IMAGE_LOADING_VERIFIED`

## Root cause

The Sheet, Apps Script, merged project DTO, URL sanitation, and image hosts were working. The production defect was in frontend failure handling:

1. A single transient cross-origin image error immediately and permanently displayed initials or `Project preview unavailable` for that page session.
2. Project `<img src>` attributes were inserted before JavaScript attached error handlers, creating a load/error event race.
3. JavaScript and component partials used stable, unversioned URLs. GitHub Pages returns `Cache-Control: max-age=600`, so a mobile browser could temporarily combine different frontend revisions.

Mobile networks and Brave are more likely to encounter a transient connection or cached-resource failure. That explains why desktop could render a healthy URL while a mobile session retained fallback UI. It was not a responsive CSS, `object-fit`, lazy-loading, HTTPS, CORS, GitHub API, or Next.js optimization failure.

This portfolio is a static JavaScript application. It does not use React or the Next.js Image optimizer.

## Profile pipeline

```text
Profile Sheet.ProfilePic
-> buildPublicProfile_ strict allowlist
-> getAllData.data.profile.ProfilePic
-> central window.portfolioData
-> renderProfile()
-> sanitized native <img id="profileImage">
```

- Expected Sheet/API URL: `https://i.postimg.cc/26DtqzQr/1777886932477.jpg`
- Actual rendered URL: identical
- Desktop Chrome: HTTP 200, `image/jpeg`, 136,938 bytes
- Android Chrome user agent: HTTP 200, `image/jpeg`, 136,938 bytes
- Android Brave user agent: HTTP 200, `image/jpeg`, 136,938 bytes
- Cross-site portfolio referrer: HTTP 200
- Decode result after deployment: successful in every tested browser

The initials avatar remains available only after all bounded attempts fail or no manual profile URL is configured.

## Published project pipeline

```text
GitHub Snapshot + Project Curation + Manual Projects
-> buildPublicProjects_ merged allowlisted DTO
-> getAllData.data.projects
-> central window.portfolioData
-> renderProjects()
-> sanitized native <img data-project-image>
```

| Project | Ownership/source | Expected and actual URL | HTTP/MIME | Result |
| --- | --- | --- | --- | --- |
| Autopilot Business System | Manual project image | `https://images.unsplash.com/photo-1551288049-bebda4e38f71?ixlib=rb-4.0.3&w=400` | 200, `image/jpeg` | Verified |
| Car Sales Analysis | Manual project image | `https://i.postimg.cc/Hnp5vTtn/Screenshot-2025-07-28-110516.png` | 200, `image/png` | Verified |
| HR Analytics Dashboard | Manual project image | `https://i.postimg.cc/bNZdyGd8/Screenshot-2025-07-28-110453.png` | 200, `image/png` | Verified |
| Wealth OS | GitHub project with preserved curation `portfolio_image` override | `https://i.postimg.cc/W1RKttLM/Screenshot-2026-06-26-121244.png` | 200, `image/png` | Verified |
| company-hub | README-discovered GitHub Raw screenshot | `https://raw.githubusercontent.com/itsmebillah/company-hub/main/assets/screenshots/dashboard-desktop.png` | 200, `image/png` | Verified |
| itsmebillah.github.io | README-discovered GitHub Raw screenshot | `https://raw.githubusercontent.com/itsmebillah/itsmebillah.github.io/main/assets/screenshots/portfolio-home.png` | 200, `image/png` | Verified |
| Sales_Report_Reminder | GitHub Open Graph fallback | `https://opengraph.githubassets.com/portfolio/itsmebillah/Sales_Report_Reminder` | 200, `image/png` | Verified |

All URLs returned the same successful status and MIME type for desktop Chrome, Android Chrome, Android Brave, and portfolio-referrer requests. Manual URLs were not replaced or edited. GitHub synchronization and project curation were not changed.

## Exact fixes

- Added shared `loadImageWithRetry()` with two bounded delayed retries.
- Fallback UI is now shown only after retry exhaustion.
- Project renderers attach load/failure behavior before assigning `src`.
- Successful retry restores the image and hides any fallback state.
- Profile image remains eager/high-priority and manually sourced.
- Project images remain lazy-loaded with their existing source priority.
- Added build version `20260809.2` to scripts, CSS, and component requests to prevent mixed cached revisions.
- No image URL, curation value, Sheet data, synchronization setting, or visual design was changed.

## Browser verification

Production browser checks after deployment:

- Desktop Chromium, 1440 x 1000: profile and 7/7 published project images decoded with nonzero natural dimensions.
- Android Chrome emulation, 390 x 844 with touch/mobile user agent: profile and 7/7 images decoded.
- Installed Brave executable with Android viewport/user agent: profile and 7/7 images decoded.
- Forced first-request network failure for every target: all 8 images recovered on retry; no fallback remained visible.
- Mobile and desktop object sizing: no layout or horizontal-overflow regression.
- Direct host tests: 24/24 profile/project combinations returned HTTP 200 with an image MIME type.
- Unit/contract tests: 55/55 passed.
- Complete local Playwright suite: 8/8 passed.
- Post-deployment production image suite: 3/3 passed.

## Working and failed images

After deployment, no profile or published-project image remains failed.

During full-page diagnostics, one unrelated published blog thumbnail was found broken at its upstream source:

- Blog: `Revenue Optimization & Customer Segmentation for a Telecom Giant`
- Manual URL: `https://www.subex.com/wp-content/uploads/2024/10/Customer-Segmentation-in-the-Telecom-Industry.jpg`
- Desktop and mobile response: HTTP 404; Chromium reports `ERR_BLOCKED_BY_ORB` in the image context
- Cause: the third-party file no longer exists, not the portfolio image pipeline
- Required content fix: provide a valid replacement through the existing manual Blog Thumbnail field

That manual URL was intentionally not overwritten during this task. It does not affect the verified profile or project cards.

## Deployment

- Git commit: `e40e6ce`
- GitHub Pages deployment: successful
- Apps Script remained on Version 27 because the public DTO and synchronization code required no change.
