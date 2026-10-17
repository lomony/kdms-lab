// Loads PDF.js (ES module) locally and exposes it to script.js.
import * as pdfjsLib from './vendor/pdf.min.mjs?v=6.4.299';
const workerUrl = new URL('./vendor/pdf.worker.min.mjs?v=6.4.299', import.meta.url).href;
pdfjsLib.GlobalWorkerOptions.workerSrc = workerUrl;
// v2.1.1: start the worker at page load (not on the first file), so previews
// still work if the network drops after the page has loaded.
try {
  pdfjsLib.GlobalWorkerOptions.workerPort = new Worker(workerUrl, { type: 'module' });
} catch (e) {
  console.warn('PDF.js worker preload failed; falling back to lazy load', e);
}
if (pdfjsLib.version !== '6.4.299') console.error('PDF.js version mismatch: ' + pdfjsLib.version);
window.pdfjsLib = pdfjsLib;
window.dispatchEvent(new Event('pdfjs-ready'));
