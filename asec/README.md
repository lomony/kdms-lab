# KDMS PDF Merger — ASEC edition

A small web app to merge PDF files **100% client‑side**. No server uploads; everything runs in your browser.

## Features
- Select multiple PDFs (button or drag & drop) and reorder them (drag, or ↑ / ↓ buttons)
- First‑page thumbnails via [PDF.js](https://mozilla.github.io/pdf.js/)
- Merge with [pdf‑lib](https://pdf-lib.js.org/) and download right away as `ASEC-merged-YYYYMMDD-HHMM.pdf`
- ASEAN‑inspired color theme, KDMS logo in the header, works on phones

> For speed and browser memory, keep totals under ~100MB or ~500 pages (device‑dependent).
> Password‑protected PDFs can't be merged correctly; remove the password first.

## Local use
Open `index.html` in a modern browser (Chrome/Edge/Firefox). No build step.

## File structure
```
asec/
├── assets/
│   ├── kdms-logo.png    # KDMS logo in the header
│   └── favicon.png      # browser tab icon
├── index.html           # UI + strict CSP; loads bundled libraries from vendor/
├── script.js            # Merge logic, thumbnails, reordering
├── style.css            # Styles and color theme
├── vendor/              # pdf-lib 1.17.1 (MIT), PDF.js 3.11.174 (Apache-2.0), bundled locally
└── VENDOR.md            # versions + SHA-256 of bundled libraries
```

## Privacy & security
No CDN or external network requests: all libraries are bundled in `vendor/` and a Content-Security-Policy restricts loading to the same origin. Works offline.

No files are uploaded anywhere. All processing happens in the browser. Still, use trusted devices and networks for sensitive documents.

## License
MIT, see [LICENSE](../LICENSE).
