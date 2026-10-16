# KDMS PDF Merger v2 – Reproducing the tests

## Requirements
- Linux, macOS or WSL with **Node.js 20+**, **Python 3.11+** and about 1 GB of free disk space for the browsers.
- Node packages (pinned in `tests/package.json`): `playwright@1.64.1`, `pdf-lib@1.17.1`. The latter is used only to **inspect** the output.
- Python packages (pinned in `tests/requirements.txt`): `reportlab==5.0.1`, `pypdf==6.20.1`, `pillow==12.3.0`. These generate synthetic test PDFs.
- Browsers: `npx playwright install chromium firefox webkit`. On a fresh Linux box, add `--with-deps`. Edge is optional: `npx playwright install msedge`.
- Versions used for the recorded results: Chromium 156.0.8078.4, Firefox 157.0, WebKit 27.2 (**not real Safari**), Microsoft Edge 155.0.4283.60.

## One command
```bash
bash asec/v2/security/tests/run-all.sh                                  # local server with production-like headers
bash asec/v2/security/tests/run-all.sh https://lomony.github.io/kdms-lab/asec/v2/   # against a deployed URL
```
The script installs the packages, generates the synthetic fixtures in `tests/.fixtures/` (dummy data only, about 200 MB), serves the repo with the headers from `web.config` (`hsrv.py`), and runs:
- `m.js` + `cases.js`: edge cases (encrypted, corrupt, non-PDF, 0-byte, Thai/Unicode names, JS + form, 500 pages / 92 MB, page limit, size limit) on Chromium, Firefox and WebKit, and the 30-file / 69-page / 34 MB merge on desktop, Pixel 7 emulation, iPhone 14 emulation, and Edge if it is installed. Each run checks page count, full page order, external requests, CSP violations, console errors and dialogs, and records timing and memory.
- `act.js`: action removal (`/URI`, `/GoToR`, `/Launch`, nested `/Next` JavaScript, field-parent `/AA`; internal `/GoTo` must be kept) and duplicate tagging.
- `dup.js`: same name and size with different content, and `file://` behaviour.

Results are written as JSON/TXT to `results/run-<timestamp>/`.

## Security scans (from `asec/v2/security/`)
```bash
npm install --package-lock-only --ignore-scripts && npm audit --json > npm-audit.json
osv-scanner scan source --lockfile package-lock.json --format json > osv-scanner.json   # osv-scanner 2.7.0
npx retire@6.1.0 --path ../vendor --outputformat json --outputpath retire.json
npx @cyclonedx/cyclonedx-npm@6.0.1 --package-lock-only --output-format JSON --output-file sbom.json
```
