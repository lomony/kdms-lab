# Bundled libraries (no external network calls)
- vendor/pdf-lib.min.js: @cantoo/pdf-lib 2.11.1 (MIT), maintained fork of pdf-lib (upstream pdf-lib is still 1.17.1 from 2021), from npm dist/pdf-lib.min.js
- vendor/pdf.min.mjs, vendor/pdf.worker.min.mjs: PDF.js (pdfjs-dist) 6.4.299 legacy build (Apache-2.0), from npm. Not affected by CVE-2024-4367 (fixed in 4.2.67).
- Licence texts: vendor/LICENSE-pdf-lib.md, vendor/LICENSE-pdfjs.txt
A Content-Security-Policy meta tag (script-src 'self', no 'unsafe-inline' for scripts) blocks loading anything from other origins.
SHA-256:
2294a0bb8742d8948ae2d49a60cb6a3600c0b5deae6de198e57fb368d1b79ba9  pdf-lib.min.js
bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259  pdf.min.mjs
145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6  pdf.worker.min.mjs
1934d75731e1d86335d857686fbff8f9c18b1a48b8bcfbf6eb21b1d5ab250f7b  ../pdfjs-init.mjs
b446378f8cf6c2af6e02634a49afd78f88627f6e2839e9f72368e85b4bc402ff  ../script.js
