# KDMS PDF Merger (ASEC) v2.0 – Maintenance

When releasing a new version, bump the header badge, the footer version line, the `<title>` and the `?v=` parameters for `style.css`/`script.js` in `index.html`. Branding assets: `assets/kdms-lab-logo.svg` (lockup), `assets/kdms-lab-mark.svg`, `assets/favicon.svg`/`.png`. These are a riff on the original KDMS logo from kdms.asean.org, with no ASEAN emblem.

## Provenance
The app was developed by the ASEC KM Unit with **AI-assisted coding**. All code was reviewed and tested by the KM Unit (UAT 14–15 Oct 2026; automated security and browser tests 16 Oct 2026, see `TEST_REPORT.md`). Third-party code is limited to two unmodified, pinned open-source libraries.

## Proposed ownership
- ITSD hosts the **source in an ASEC-owned repository** (e.g. an ASEC GitHub organisation or internal Git) and deploys from it to ITSD-approved infrastructure. The `lomony/kdms-lab` GitHub Pages copy is a demo/test site for dummy data only.
- KM Unit = functional owner (requirements, UAT). ITSD = technical owner (hosting, headers, access control, security review).
- **Quarterly dependency check** (Jan/Apr/Jul/Oct), plus ad hoc when a PDF.js or pdf-lib advisory is published (watch https://github.com/mozilla/pdf.js/security/advisories and https://github.com/advisories?query=ecosystem%3Anpm+pdf).

## Updating the libraries
1. Check the latest versions: `npm view pdfjs-dist version` and `npm view @cantoo/pdf-lib version`.
2. Edit the pinned versions in `security/package.json`, then in `security/`: `npm install --package-lock-only --ignore-scripts`.
3. Get the files: `npm pack pdfjs-dist@X @cantoo/pdf-lib@Y`, extract, and copy:
   - `pdfjs-dist/legacy/build/pdf.min.mjs` → `vendor/pdf.min.mjs`
   - `pdfjs-dist/legacy/build/pdf.worker.min.mjs` → `vendor/pdf.worker.min.mjs` (main and worker **must** be the same version)
   - `@cantoo/pdf-lib/dist/pdf-lib.min.js` → `vendor/pdf-lib.min.js`
4. Update the version string in `pdfjs-init.mjs` (both `?v=` cache-busting parameters and the version check) and the `?v=` parameters in `index.html`.
5. Read the release notes for API changes (e.g. PDF.js 5 removed `PDFDocumentProxy.destroy()`; use `loadingTask.destroy()`).
6. Re-run the scanners (in `security/`): `npm audit --json > npm-audit.json`, `osv-scanner scan source --lockfile package-lock.json --format json > osv-scanner.json`, `npx retire --path ../vendor --outputformat json --outputpath retire.json`, `npx @cyclonedx/cyclonedx-npm --package-lock-only --output-format JSON --output-file sbom.json`.
7. Re-run the tests in `TEST_REPORT.md` (at minimum: merge + page order, encrypted/corrupt files, 0 external requests, no CSP violations) on Chrome/Edge and Firefox.
8. Update the SHA-256 table in `VENDOR.md` / `SECURITY_NOTE.md` (`sha256sum vendor/* *.mjs script.js`).

## Release integrity (recommendations; settings were not changed)
- Releases are frozen as git tags (e.g. `v2.0.0`) with a GitHub Release that attaches the zip and lists the commit SHA and the zip SHA-256. ITSD should deploy only from a tagged release and check the SHA-256 first.
- Recommended for the ASEC-owned repo, on the default and release branches:
  - **Branch protection**: require a pull request with at least 1 review from ITSD/KM, require status checks to pass, no force pushes, no deletions.
  - **Tag protection** for `v*`.
  - Optionally, signed commits.
- To turn off the demo banner in production, set `<meta name="kdms-demo-banner" content="off">` in index.html.
