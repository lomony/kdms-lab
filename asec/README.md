# KDMS PDF Merger — ASEC edition
*Developed by KM Team*

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
├── index.html           # UI + loads libraries via CDN (pdf-lib 1.17.1, PDF.js 3.11.174)
├── script.js            # Merge logic, thumbnails, reordering
└── style.css            # Styles and color theme
```

## Privacy
No files are uploaded anywhere. All processing happens in the browser. Still, use trusted devices and networks for sensitive documents.

## License
MIT, see [LICENSE](../LICENSE).
