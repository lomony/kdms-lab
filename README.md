# KDMS Lab

Web tools for KDMS. Each edition lives in its own folder.

| Folder | Tool | For |
|---|---|---|
| [`asec/v2/`](asec/v2/) | KDMS PDF Merger v2 (current) | ASEC |
| [`asec/`](asec/) | Redirect to `asec/v2/` | – |

## Use it
- **Demo (GitHub Pages, synthetic test documents only):** https://lomony.github.io/kdms-lab/asec/v2/
- **Production / intranet:** deploy the release zip (e.g. `KDMS-PDF-Merger-ASEC-v2.1.2.zip`) on a web server
  such as IIS with the included `web.config`. A web server is required, but no internet connection: the PDF
  libraries are bundled in `asec/v2/vendor/` (no CDN).
- **Local testing:** serve the folder with any static web server, e.g. `python3 -m http.server` from the repo root,
  then open `http://localhost:8000/asec/v2/`. Opening `index.html` directly from disk (`file://`) is **not supported**:
  browsers block the ES modules and Subresource Integrity checks there, so the app shows a "not started" warning.

## Legacy: Streamlit wrapper (not maintained, not part of the ASEC release)
`streamlit_app.py` is a **legacy** wrapper for the old `asec/` (v1) build. It is not included in the release zip, is not reviewed for ITSD, and should not be used for v2. The notes below are kept for reference only.

### Deploy on Streamlit Community Cloud (legacy)
On [share.streamlit.io](https://share.streamlit.io) → **Create app → Deploy a public app from GitHub**:

| Field | Value |
|---|---|
| Repository | `lomony/kdms-lab` |
| Branch | `main` (or `claude/github-asec-setup-u7mxcf` before merging) |
| Main file path | `streamlit_app.py` |
| App URL | e.g. `kdms-asec` → `https://kdms-asec.streamlit.app` |

`streamlit_app.py` only embeds the static app from `asec/`; merging still runs in the
viewer's browser and no PDF is sent to the Streamlit server.

## GitHub Pages deployment
1. The workflow in `.github/workflows/pages.yml` deploys on push to `main` or `claude/github-asec-setup-u7mxcf`.
2. Pages source is **GitHub Actions**. Production should use a tagged release only (verify `SHA256SUMS.txt`).

## License
[MIT](LICENSE)
