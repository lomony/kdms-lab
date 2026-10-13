# KDMS Lab
*Developed by KM Team*

Web tools for KDMS. Each edition lives in its own folder.

| Folder | Tool | For |
|---|---|---|
| [`asec/`](asec/) | KDMS PDF Merger | ASEC |

## Use it
- **Online (GitHub Pages):** after Pages is enabled, open `https://<owner>.github.io/kdms-lab/asec/`
  (the site root redirects to `asec/`).
- **Streamlit:** see below, or run locally with `pip install -r requirements.txt && streamlit run streamlit_app.py`.
- **Offline/local:** download the repo and open `asec/index.html` in Chrome, Edge or Firefox.
  An internet connection is needed the first time to load the PDF libraries from the CDN.

## Deploy on Streamlit Community Cloud
On [share.streamlit.io](https://share.streamlit.io) → **Create app → Deploy a public app from GitHub**:

| Field | Value |
|---|---|
| Repository | `lomony/kdms-lab` |
| Branch | `main` (or `claude/github-asec-setup-u7mxcf` before merging) |
| Main file path | `streamlit_app.py` |
| App URL | e.g. `kdms-asec` → `https://kdms-asec.streamlit.app` |

`streamlit_app.py` only embeds the static app from `asec/`; merging still runs in the
viewer's browser and no PDF is sent to the Streamlit server.

## Enable GitHub Pages (one time)
1. Merge this branch into `main`.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` deploys on every push to `main`
   (or run it from the **Actions** tab).

## License
[MIT](LICENSE)
