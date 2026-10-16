# KDMS Lab · PDF Merge Tool (KDMS PDF Merger, ASEC) v2.1 – Security Note for ITSD

v2.1.0 (16 Oct 2026) is a UI re-skin with KDMS Lab branding. Errors are shown inline, with no `alert()`, and the security behaviour is unchanged from v2.0.0. The new SVG logo files are static and contain no scripts. They load as `<img>`, which is allowed by `img-src 'self'`.

Version 2.0 (16 Oct 2026), demo/test URL https://lomony.github.io/kdms-lab/asec/v2/. Changes from v1 (**deprecated**: the 2025 prototype at jeenalomo.github.io/kdms-pdf-merger-client and the 15 Oct 2026 build at /asec/): no CDN, PDF.js 3.11.174 → 6.4.299, pdf-lib 1.17.1 → @cantoo/pdf-lib 2.11.1, CSP without unsafe-inline, input validation, page limit, PDF script stripping.

_Updated 16 Oct 2026. Developed by the ASEC KM Unit with AI-assisted coding; reviewed and tested by the KM Unit (see TEST_REPORT.md, MAINTENANCE.md)._

## Architecture
- A static HTML/CSS/JS app with no backend. PDFs are read and merged in browser memory and downloaded through a local `blob:` URL. Nothing is uploaded.
- **No external internet dependency**, but it must be **served by a web server**, because ES modules are blocked on `file://`.
- **GitHub Pages (lomony.github.io/kdms-lab/asec/v2/) is a demo/test site for dummy data only.** Production must be hosted on ITSD-approved infrastructure, with access control decided by ITSD.

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
| script.js | KM Unit app code | – | MIT | b375623ad9badf48822ae28a2588674f7e754c60e4625577b002576dfe0871d8 |
| style.css | KM Unit styles | – | MIT | d086106a751942be5e2eacb74ccdd7290dac50c11c9340a176d2f037910fb494 |
| index.html | KM Unit page | – | MIT | 85dc44389f496733f8229eeaa85c800ffb021a033cf1f1bfed2888de744fe9d0 |

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
- Duplicates are detected by content SHA-256. Different files with the same name are both kept. Byte-identical copies are **added and tagged "Duplicate (identical content)"** with a notice, so the user can remove them; nothing is skipped silently.
- PDF actions: see the next section for the exact scope (not a sanitizer).
- File names are shown with `textContent`, never as HTML.
- **Output is a working copy.** Digital signatures, forms, bookmarks and PDF/A conformance may not be preserved. The UI says this too.
- **Memory:** a 500-page / 92 MB merge peaked at about **0.9 GB** of browser memory (Chromium, all processes). Machines with little RAM (≤ 4 GB) or many open tabs may be slow or fail on very large merges, so split big jobs.

## PDF actions
**PDF actions: what the code removes (exact scope). This is not a PDF sanitizer.**
On every copied page, `stripPageScripts()` in script.js removes:
- the page's `/AA` (additional actions);
- `/AA` on every annotation;
- `/A` on every annotation, when that action, or any action in its `/Next` chain, is anything other than an internal `/GoTo`. This covers `/JavaScript`, `/URI`, `/GoToR`, `/GoToE`, `/Launch`, `/SubmitForm`, `/ResetForm`, `/ImportData`, `/Named`, `/Rendition` and so on;
- `/AA` on the form-field parents of widget annotations.

It keeps internal page links (`/GoTo`, `/Dest`).

pdf-lib's `copyPages` never copies document-level objects: `/OpenAction`, `/Names` (including `/JavaScript` and embedded files), `/AcroForm` (form logic) and outlines/bookmarks.

It does **not** inspect or change page content streams, fonts, images, XObjects, file-attachment annotations, or malformed or obfuscated structures. Untrusted PDFs still need to be scanned by ASEC's normal antivirus and content controls.

Merging itself never executes PDF JavaScript: pdf-lib has no script engine, and PDF.js renders thumbnails only, with no scripting.

## Demo banner (config)
`index.html` contains `<meta name="kdms-demo-banner" content="auto">`. It has three values:
- `auto` (default): the red **"DEMO ONLY – Use synthetic test documents. Not approved for official or restricted documents."** banner shows only when the hostname ends in `github.io`.
- `off`: never shown. Use this for the ITSD/IIS production build once it is approved.
- `on`: always shown, for example on an internal test server.

## v1 is deprecated
- The **2025 prototype** at https://jeenalomo.github.io/kdms-pdf-merger-client/ (repo JeenaLomo/kdms-pdf-merger-client) and the **15 Oct 2026 build** formerly at `/asec/` are **deprecated and must not be used**.
- The 2025 prototype loads PDF.js 3.11.174 from cdnjs (affected by CVE-2024-4367) and an unpinned pdf-lib from unpkg. As of 16 Oct 2026 it is still online. It is in a separate GitHub account (JeenaLomo), not in lomony/kdms-lab, and has to be taken down or archived by that account's owner.
- `/asec/` now redirects to `/asec/v2/`.

## Frozen release v2.0.0
| Item | Value |
|---|---|
| Git tag | `v2.0.0` |
| Release commit | `09e31d298037de8f4bdc496cbe1eb73395bfdf8c` |
| Release | https://github.com/lomony/kdms-lab/releases/tag/v2.0.0 |
| Zip asset | `KDMS-PDF-Merger-ASEC-v2.0.zip` |
| Zip SHA-256 | `584a40f51d11b427f7fb10c34ff8a0ed79568cc87d217d2c468a52af78572db5` |
| Source | https://github.com/lomony/kdms-lab/tree/v2.0.0/asec/v2 |

This section was added in a docs-only commit after the tag. A file cannot contain the checksum of the zip it is packed in, so the copy of this note inside the zip does not have it. ITSD should check the zip against `SHA256SUMS.txt` on the release page before deploying.

## Frozen release v2.1.0 (current)
| Item | Value |
|---|---|
| Git tag | `v2.1.0` |
| Release commit | `58e39c9ab5d532dd7ba8b60715a2e7ade4dead0c` |
| Release | https://github.com/lomony/kdms-lab/releases/tag/v2.1.0 |
| Zip asset | `KDMS-PDF-Merger-ASEC-v2.1.zip` |
| Zip SHA-256 | `e22e256cb212f25a823c00041f6dfc2a64bac1f687cb69f7f6f9dd6eac1473c9` |
| Source | https://github.com/lomony/kdms-lab/tree/v2.1.0/asec/v2 |

v2.0.0 (above) is superseded by v2.1.0. As before, this section was added after the tag, so ITSD should check the zip against `SHA256SUMS.txt` on the release page.
