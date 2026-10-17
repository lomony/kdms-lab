# LEGACY / NOT MAINTAINED: wraps the old asec/ v1 build. Not part of the KDMS PDF Merger v2 release reviewed by ITSD. Do not use for v2.
"""Streamlit Community Cloud entry point for the KDMS PDF Merger (ASEC edition).

The merger runs entirely in the viewer's browser: this script only inlines the
static app in asec/ into a Streamlit HTML component. No PDF reaches the server.
"""

import base64
from pathlib import Path

import streamlit as st
import streamlit.components.v1 as components

APP_DIR = Path(__file__).parent / "asec"
LOGO = APP_DIR / "assets" / "kdms-logo.png"
FAVICON = APP_DIR / "assets" / "favicon.png"

st.set_page_config(
    page_title="KDMS PDF Merger — ASEC",
    page_icon=str(FAVICON),
    layout="wide",
    initial_sidebar_state="collapsed",
)

# Let the embedded app use the full page.
st.markdown(
    """
    <style>
      .block-container {padding: 0 !important; max-width: 100% !important;}
      header[data-testid="stHeader"] {display: none;}
      iframe {display: block;}
    </style>
    """,
    unsafe_allow_html=True,
)


@st.cache_data
def build_page() -> str:
    html = (APP_DIR / "index.html").read_text(encoding="utf-8")
    css = (APP_DIR / "style.css").read_text(encoding="utf-8")
    js = (APP_DIR / "script.js").read_text(encoding="utf-8")
    logo = "data:image/png;base64," + base64.b64encode(LOGO.read_bytes()).decode()

    replacements = {
        '<link rel="stylesheet" href="style.css" />': f"<style>{css}</style>",
        '<link rel="icon" type="image/png" href="assets/favicon.png" />': "",
        'src="assets/kdms-logo.png"': f'src="{logo}"',
        '<script src="script.js"></script>': f"<script>{js}</script>",
    }
    for old, new in replacements.items():
        if old not in html:
            raise RuntimeError(f"asec/index.html changed; cannot find: {old}")
        html = html.replace(old, new)
    return html


components.html(build_page(), height=1600, scrolling=True)
