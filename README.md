# KDMS Lab
*Developed by KM Team*

Web tools for KDMS. Each edition lives in its own folder.

| Folder | Tool | For |
|---|---|---|
| [`asec/`](asec/) | KDMS PDF Merger | ASEC |

## Use it
- **Online (GitHub Pages):** after Pages is enabled, open `https://<owner>.github.io/kdms-lab/asec/`
  (the site root redirects to `asec/`).
- **Offline/local:** download the repo and open `asec/index.html` in Chrome, Edge or Firefox.
  An internet connection is needed the first time to load the PDF libraries from the CDN.

## Enable GitHub Pages (one time)
1. Merge this branch into `main`.
2. Go to **Settings → Pages → Build and deployment → Source** and choose **GitHub Actions**.
3. The workflow in `.github/workflows/pages.yml` deploys on every push to `main`
   (or run it from the **Actions** tab).

## License
[MIT](LICENSE)
