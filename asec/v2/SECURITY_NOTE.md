# KDMS Lab · PDF Merge Tool (KDMS PDF Merger, ASEC) v2.1.2 – Security Note for ITSD

**v2.1.2 (17 Oct 2026)** is a patch release from an external review of the ITSD package:
- **Image codecs:** PDF.js now gets `wasmUrl: vendor/wasm/` and `useWasm: false`, and the pure-JavaScript JBIG2/OpenJPEG decoders (`jbig2_nowasm_fallback.js`, `openjpeg_nowasm_fallback.js`, from pdfjs-dist 6.4.299, with licences) are bundled in `vendor/wasm/`. Previews of PDFs with CCITT G4 / JBIG2 / JPEG2000 images now render with no CSP change (no `wasm-unsafe-eval`) and 0 CSP violations (tested in Chromium, Firefox and WebKit).
- **UI note:** the page now says that external web links and other link actions are removed from the merged output (internal page links are kept).
- **Docs:** HSTS below matches `web.config` (no `includeSubDomains`); the root README no longer suggests opening `index.html` from disk, and `streamlit_app.py` is marked legacy.
- **SRI scope:** `integrity` covers 4 files (`style.css`, `vendor/pdf-lib.min.js`, `pdfjs-init.mjs`, `script.js`). `vendor/pdf.min.mjs`, `vendor/pdf.worker.min.mjs` and `vendor/wasm/*.js` are loaded by module import/worker and are controlled by the release checksum (`SHA256SUMS.txt`) and the vendor-vs-npm hash comparison.


**v2.1.1 (17 Oct 2026)** is a patch release from the UAT / IT-readiness pass. It makes three changes:
- **Subresource Integrity:** `integrity="sha384-…"` is now on `style.css`, `vendor/pdf-lib.min.js`, `pdfjs-init.mjs` and `script.js`. A modified file is refused by the browser, and this was tested. **The web server must serve the files byte-for-byte (no minifying, no injected code), or the page will not start.**
- **Worker preload:** the PDF.js worker now starts at page load. Previously, previews failed if the network dropped after the page loaded (defect D-01).
- **Startup warning:** a static warning is shown if the app's script never starts, for example on `file://` or after an integrity failure.

**Response headers:** GitHub Pages sends no security headers and none can be set (only `cache-control: max-age=600` and `access-control-allow-origin: *`). The CSP is applied through the `<meta>` tag. On IIS, `web.config` adds all recommended headers.

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
| Strict-Transport-Security | max-age=31536000 (HTTPS only; no includeSubDomains – ITSD decides whether to add it for the real domain) |
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
| pdfjs-init.mjs | KM Unit loader | – | MIT | ffbd7c0e05da45b0f9f87ab251a0743c583e91631a2d00c7c2209e40e7df5dc8 |
| script.js | KM Unit app code | – | MIT | c7f726bbdcc8db0105b8c32731cec6b1e079815d76123538fc3475c838446284 |
| style.css | KM Unit styles | – | MIT | e836a41301299e0911e1793b3b37181b7b70019446bf2e8555d1f6ea673378ff |
| index.html | KM Unit page | – | MIT | 22dd65bfab27c040d116019bcca91b4be4effe02145f12db650ef7e88ac22ef9 |

## Vulnerability scanning (16 Oct 2026; reports in `security/`)
| Scanner | Scope | Result |
|---|---|---|
| npm audit (npm 9.2.0) | security/package-lock.json, pinned versions, 19 packages incl. optional Node-only deps | **0 vulnerabilities** |
| osv-scanner 2.2.3 | same lockfile | **0 vulnerabilities** |
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

## Frozen release v2.1.1 (superseded by v2.1.2)
| Item | Value |
|---|---|
| Git tag | `v2.1.1` |
| Release commit | `d04b380b171ed723024689e8711965113ff731f1` |
| Release | https://github.com/lomony/kdms-lab/releases/tag/v2.1.1 |
| Zip asset | `KDMS-PDF-Merger-ASEC-v2.1.1.zip` |
| Zip SHA-256 | `576d19b264e67ea0ba25bb1b3df5f3bc6ac20d602191fc68065ed6d83bb9e168` |
| Source | https://github.com/lomony/kdms-lab/tree/v2.1.1/asec/v2 |

v2.1.1 supersedes v2.1.0. Check the zip against `SHA256SUMS.txt` on the release page.

## Frozen release v2.1.2 (current)
| Item | Value |
|---|---|
| Git tag | `v2.1.2` |
| Release commit | `5f70eb980fe29c49eade2fb95c2f4967cbe60a64` |
| Release | https://github.com/lomony/kdms-lab/releases/tag/v2.1.2 |
| Zip asset | `KDMS-PDF-Merger-ASEC-v2.1.2.zip` |
| Zip SHA-256 | `e7e1ad7f3a349fb4f4d75bbfdc9589e366091ba159ba2c9bfc482203afff2157` |
| SBOM asset | `sbom-v2.1.2.cdx.json` (SHA-256 `31ae979e9ada0076e218d59057f62223fe9e4f4ad3dcc5fe51bf270552ae9d94`) |
| Source | https://github.com/lomony/kdms-lab/tree/v2.1.2/asec/v2 |

v2.1.2 supersedes v2.1.1. This section was added after the tag; check the zip against `SHA256SUMS.txt` on the release page.
