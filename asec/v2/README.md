# KDMS PDF Merger — ASEC edition · v2.0 (16 Oct 2026)

Demo/test URL: https://lomony.github.io/kdms-lab/asec/v2/ (the old `/asec/` link redirects here).

A small web app to merge PDF files **100% client‑side**. No server uploads; everything runs in your browser.

## Features
- Select multiple PDFs (button or drag & drop) and reorder them (drag, or ↑ / ↓ buttons)
- First‑page thumbnails via [PDF.js](https://mozilla.github.io/pdf.js/)
- Merge with [pdf‑lib](https://pdf-lib.js.org/) and download right away as `ASEC-merged-YYYYMMDD-HHMM.pdf`
- ASEAN‑inspired color theme, KDMS logo in the header, works on phones

> For speed and browser memory, keep totals under ~100MB or ~500 pages (device‑dependent).
> Hard limits enforced in code: 100 MB total, 500 pages, 50 files. Password‑protected, damaged, empty or non‑PDF files are rejected with a clear message.
> The output is a merged **working copy**: digital signatures, fillable forms, bookmarks and PDF/A conformance may not be preserved.

## Running it
The app has **no external internet dependency**, but it **must be served by a web server** (any static server: IIS, Apache, nginx; or `python3 -m http.server` for a local test). Opening `index.html` by double-click (`file://`) does **not** work, because browsers block ES modules (PDF.js 6) on `file://`; the page shows a warning in that case. No build step.

The GitHub Pages copy (https://lomony.github.io/kdms-lab/asec/v2/) is a **demo/test site for dummy data only**. Production must be hosted on ITSD-approved infrastructure, with access control decided by ITSD. See `web.config` for IIS and `SECURITY_NOTE.md` for the recommended headers.

## File structure
```
asec/v2/
├── assets/
│   ├── kdms-logo.png    # KDMS logo in the header
│   └── favicon.png      # browser tab icon
├── index.html           # UI + strict CSP; loads bundled libraries from vendor/
├── script.js            # Merge logic, thumbnails, reordering
├── style.css            # Styles and color theme
├── vendor/              # @cantoo/pdf-lib 2.11.1 (MIT), PDF.js 6.4.299 legacy build (Apache-2.0), bundled locally
└── VENDOR.md            # versions + SHA-256 of bundled libraries
```

## Privacy & security
No CDN or external network requests: all libraries are bundled in `vendor/` and a Content-Security-Policy restricts loading to the same origin. No internet connection is needed once the app is served from an internal server.

No files are uploaded anywhere. All processing happens in the browser. Still, use trusted devices and networks for sensitive documents.

## License
MIT, see [LICENSE](../LICENSE).
