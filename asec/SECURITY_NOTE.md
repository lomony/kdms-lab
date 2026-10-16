# KDMS PDF Merger (ASEC) – Security Note for IT

- **Client-side only:** a static HTML/JS/CSS app. No backend, no uploads; PDFs are read and merged in the browser memory and downloaded via a local `blob:` URL.
- **No external network calls:** every resource loads from the same origin. Tested in headless Chrome (16 Oct 2026, after the upgrade): 0 external requests, no console errors or warnings; 3 test PDFs (2 + 3 + 1 pages) merged into a valid 6-page PDF in the correct order, with first-page thumbnails rendered by PDF.js.
- **Content-Security-Policy (meta tag):** `default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' blob: data:; object-src 'none'` – the browser blocks any load from another origin.
  - No inline scripts: `'unsafe-inline'` was removed from script-src (the PDF.js worker path is now set in pdfjs-init.mjs). `'unsafe-inline'` remains only for style-src (inline style attributes).
- **Bundled libraries** (byte-identical to the official npm packages, upgraded 16 Oct 2026):

| File | Library | Version | License | SHA-256 |
|---|---|---|---|---|
| vendor/pdf-lib.min.js | @cantoo/pdf-lib (maintained fork of pdf-lib) | 2.11.1 | MIT | 2294a0bb8742d8948ae2d49a60cb6a3600c0b5deae6de198e57fb368d1b79ba9 |
| vendor/pdf.min.mjs | PDF.js (pdfjs-dist, legacy build) | 6.4.299 | Apache-2.0 | bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259 |
| vendor/pdf.worker.min.mjs | PDF.js worker (legacy build) | 6.4.299 | Apache-2.0 | 145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6 |
| pdfjs-init.mjs | KM Unit loader (sets worker path) | — | — | 1934d75731e1d86335d857686fbff8f9c18b1a48b8bcfbf6eb21b1d5ab250f7b |
| script.js | KM Unit app code | — | — | b446378f8cf6c2af6e02634a49afd78f88627f6e2839e9f72368e85b4bc402ff |

- The only `http(s)://` strings in the vendor files are license URLs, XML namespace identifiers and library code paths that are not used by this app (and the CSP would block them anyway).
- **Hosting:** copy the folder to any static web server (IIS/Apache/nginx/SharePoint-free static host). No build step. Only requirement: serve `.mjs` files as `text/javascript` (IIS: add a MIME map `.mjs` → `text/javascript`; Apache/nginx usually already do).
- App license: MIT (LICENSE).


**Upgrade 16 Oct 2026:** PDF.js 3.11.174 → 6.4.299 (fixes CVE-2024-4367); pdf-lib 1.17.1 (unmaintained since 2021) → @cantoo/pdf-lib 2.11.1 (actively maintained, API-compatible).
