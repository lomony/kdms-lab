# Bundled libraries (no external network calls)
- vendor/pdf-lib.min.js: @cantoo/pdf-lib 2.11.1 (MIT), maintained fork of pdf-lib (upstream pdf-lib is still 1.17.1 from 2021), from npm dist/pdf-lib.min.js
- vendor/pdf.min.mjs, vendor/pdf.worker.min.mjs: PDF.js (pdfjs-dist) 6.4.299 legacy build (Apache-2.0), from npm. Not affected by CVE-2024-4367 (fixed in 4.2.67).
- Licence texts: vendor/LICENSE-pdf-lib.md, vendor/LICENSE-pdfjs.txt
A Content-Security-Policy meta tag (script-src 'self'; style-src 'self'; no 'unsafe-inline') blocks loading anything from other origins.
SHA-256:
f2c9fc00fdb66eb99ac156ba52d734af66d8d309f65753ae809ad34ee2883bcb  vendor/LICENSE-pdf-lib.md
2294a0bb8742d8948ae2d49a60cb6a3600c0b5deae6de198e57fb368d1b79ba9  vendor/pdf-lib.min.js
bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259  vendor/pdf.min.mjs
145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6  vendor/pdf.worker.min.mjs
2294a0bb8742d8948ae2d49a60cb6a3600c0b5deae6de198e57fb368d1b79ba9  vendor/pdf-lib.min.js
898c0053e808770ab555ba0734a4329fb1ce5adf85feb9140ddc20f274f9ba28  pdfjs-init.mjs
74c4ab8b0cbe36e0369b33e57ae0f9a31248370ea20a01ad199ea961adb4c88f  script.js
