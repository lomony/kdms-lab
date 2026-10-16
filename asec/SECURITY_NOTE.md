# KDMS PDF Merger (ASEC) – Security Note for ITSD

_Updated 16 Oct 2026. Developed by the ASEC KM Unit with AI-assisted coding; reviewed and tested by the KM Unit (see TEST_REPORT.md, MAINTENANCE.md)._

## Architecture
- A static HTML/CSS/JS app with no backend. PDFs are read and merged in browser memory and downloaded through a local `blob:` URL. Nothing is uploaded.
- **No external internet dependency**, but it must be **served by a web server**, because ES modules are blocked on `file://`.
- **GitHub Pages (lomony.github.io/kdms-lab/asec/) is a demo/test site for dummy data only.** Production must be hosted on ITSD-approved infrastructure, with access control decided by ITSD.

## Content-Security-Policy
- Meta tag in index.html: `default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'none'`.
- **No `'unsafe-inline'` and no `'unsafe-eval'`.** There are no inline scripts, `<style>` blocks or `style=` attributes. Tests recorded 0 CSP violations.

## Recommended production headers (provided in `web.config` for IIS)
| Header | Value |
|---|---|
| Content-Security-Policy | the policy above + `frame-ancestors 'self'` (frame-ancestors only works as a header) |
| X-Content-Type-Options | nosniff |
| X-Frame-Options | SAMEORIGIN |
| Referrer-Policy | no-referrer |
| Strict-Transport-Security | max-age=31536000; includeSubDomains (HTTPS only) |
| Permissions-Policy | camera=(), microphone=(), geolocation=(), payment=() |
| Cross-Origin-Opener-Policy | same-origin |
| MIME | `.mjs` → `text/javascript` (required) |

## Bundled libraries
These are byte-identical to the npm packages. The PDF.js main file and worker are the same version, and `pdfjs-init.mjs` checks this. A `?v=` query string busts the cache.

| File | Library | Version | Licence | SHA-256 |
|---|---|---|---|---|
| vendor/pdf-lib.min.js | @cantoo/pdf-lib (maintained fork of pdf-lib) | 2.11.1 | MIT | 2294a0bb8742d8948ae2d49a60cb6a3600c0b5deae6de198e57fb368d1b79ba9 |
| vendor/pdf.min.mjs | PDF.js (pdfjs-dist, legacy build) | 6.4.299 | Apache-2.0 | bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259 |
| vendor/pdf.worker.min.mjs | PDF.js worker (legacy build) | 6.4.299 | Apache-2.0 | 145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6 |
| pdfjs-init.mjs | KM Unit loader | – | MIT | 898c0053e808770ab555ba0734a4329fb1ce5adf85feb9140ddc20f274f9ba28 |
| script.js | KM Unit app code | – | MIT | 74c4ab8b0cbe36e0369b33e57ae0f9a31248370ea20a01ad199ea961adb4c88f |
| style.css | KM Unit styles | – | MIT | 2516f94c180fb5455db4d870ccc8f6597d42459ac154ea8c37f1b0723c6582a3 |
| index.html | KM Unit page | – | MIT | 36d28084cd44a37aadc172d264cdcf23c5f12741e595512baa5ba544256c3b09 |

## Vulnerability scanning (16 Oct 2026; reports in `security/`)
| Scanner | Scope | Result |
|---|---|---|
| npm audit (npm 9.2.0) | security/package-lock.json, pinned versions, 19 packages incl. optional Node-only deps | **0 vulnerabilities** |
| osv-scanner 2.7.0 | same lockfile | **0 vulnerabilities** |
| retire.js 6.1.0 | vendor/ (the shipped files) | **0 findings**. Control run on the old 3.11.174 files correctly flagged CVE-2024-4367 (security/retire-baseline-old-3.11.174.json). |
| GitHub Advisory DB | pdfjs-dist | CVE-2024-4367 (≤ 4.1.392) and CVE-2026-16633 / GHSA-hq66-cqwq-w95j (≥ 5.6.83, < 6.2.108). **6.4.299 is not affected by either.** |
| GitHub Advisory DB | @cantoo/pdf-lib, pdf-lib | no advisories |

SBOM: `security/sbom.json` (CycloneDX 1.6, generated from the pinned lockfile). Note: `@napi-rs/canvas` is an optional dependency of pdfjs-dist used only in Node.js. It is listed in the SBOM but **not shipped** in the browser app.

## Dependency due diligence (npm registry API and GitHub API, queried 16 Oct 2026)
| | @cantoo/pdf-lib | pdfjs-dist (Mozilla) | pdf-lib (upstream, replaced) |
|---|---|---|---|
| Weekly downloads (6–12 Oct 2026) | 1,140,576 | 33,256,167 | 18,167,409 |
| Latest version / publish date | 2.11.1 / 15 Sep 2026 | 6.4.299 / 3 Oct 2026 | 1.17.1 / 6 Nov 2021 |
| Releases in last 12 months | 21 | 12 (roughly monthly) | 0 |
| npm maintainers | 6 | 5 (Mozilla + release bot) | 1 |
| Repository | github.com/cantoo-scribe/pdf-lib (356 stars, 55 contributors, last push 11 Sep 2026, 24 open issues) | github.com/mozilla/pdf.js (54k stars, last push 16 Oct 2026) | github.com/Hopding/pdf-lib |
| Open security advisories | none | none affecting 6.4.299 | none |

## App hardening
- Hard limits are enforced in code: 100 MB, 500 pages, 50 files.
- Rejected with a clear message: password-protected or encrypted, damaged, empty and non-PDF files.
- Duplicate detection uses a content SHA-256, so different files with the same name are both kept.
- JavaScript and automatic actions are stripped from the merged pages, and PDF.js runs without scripting.
- File names are shown with `textContent`, never as HTML.
- **Output is a working copy.** Digital signatures, forms, bookmarks and PDF/A conformance may not be preserved. The UI says this too.
