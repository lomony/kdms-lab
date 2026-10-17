# Bundled libraries (no external network calls)
- vendor/pdf-lib.min.js: @cantoo/pdf-lib 2.11.1 (MIT), maintained fork of pdf-lib (upstream pdf-lib is still 1.17.1 from 2021), from npm dist/pdf-lib.min.js
- vendor/pdf.min.mjs, vendor/pdf.worker.min.mjs: PDF.js (pdfjs-dist) 6.4.299 legacy build (Apache-2.0), from npm. Not affected by CVE-2024-4367 (fixed in 4.2.67).
- Licence texts: vendor/LICENSE-pdf-lib.md, vendor/LICENSE-pdfjs.txt
A Content-Security-Policy meta tag (script-src 'self'; style-src 'self'; no 'unsafe-inline') blocks loading anything from other origins.
SHA-256:
bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259  vendor/pdf.min.mjs
145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6  vendor/pdf.worker.min.mjs
2294a0bb8742d8948ae2d49a60cb6a3600c0b5deae6de198e57fb368d1b79ba9  vendor/pdf-lib.min.js
ffbd7c0e05da45b0f9f87ab251a0743c583e91631a2d00c7c2209e40e7df5dc8  pdfjs-init.mjs
c7f726bbdcc8db0105b8c32731cec6b1e079815d76123538fc3475c838446284  script.js
