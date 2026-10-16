// Loads PDF.js (ES module) locally and exposes it to script.js.
import * as pdfjsLib from './vendor/pdf.min.mjs?v=6.4.299';
pdfjsLib.GlobalWorkerOptions.workerSrc = new URL('./vendor/pdf.worker.min.mjs?v=6.4.299', import.meta.url).href;
if (pdfjsLib.version !== '6.4.299') console.error('PDF.js version mismatch: ' + pdfjsLib.version);
window.pdfjsLib = pdfjsLib;
window.dispatchEvent(new Event('pdfjs-ready'));
