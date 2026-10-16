// Loads PDF.js (ES module) locally and exposes it to script.js.
import * as pdfjsLib from './vendor/pdf.min.mjs';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs', import.meta.url).href;
window.pdfjsLib = pdfjsLib;
window.dispatchEvent(new Event('pdfjs-ready'));
