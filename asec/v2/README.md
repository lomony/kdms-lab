# KDMS PDF Merger — ASEC edition · v2.0 (16 Oct 2026)

Demo/test URL: https://lomony.github.io/kdms-lab/asec/v2/ (the old `/asec/` link redirects here).

A small web app to merge PDF files **100% client‑side**. No server uploads; everything runs in your browser.

## Features
- Select multiple PDFs (button or drag & drop) and reorder them (drag, or ↑ / ↓ buttons)
- First‑page thumbnails via [PDF.js](https://mozilla.github.io/pdf.js/)
- Merge with [pdf‑lib](https://pdf-lib.js.org/) and download right away as `ASEC-merged-YYYYMMDD-HHMM.pdf`
- ASEAN‑inspired color theme, KDMS logo in the header, works on phones

> For speed and browser memory, keep totals under ~100MB or ~500 pages (device‑dependent).
> **Memory:** a 500-page / 92 MB merge peaked at about **0.9 GB** of browser memory (Chromium, all processes). Machines with little RAM (≤ 4 GB) or many open tabs may be slow or fail on very large merges, so split big jobs.
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
