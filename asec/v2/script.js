/* KDMS PDF Merger — ASEC edition v2.1 (client-side)
 * - @cantoo/pdf-lib merges; PDF.js 6 renders first-page thumbnails
 * - UI: KDMS Lab "PDF Merge Tool" design (card layout, dashed drop zone)
 */
const $ = id => document.getElementById(id);
const fileInput = $('fileInput'), browseBtn = $('browseBtn'), dropzone = $('dropzone');
const fileListEl = $('fileList'), mergeBtn = $('mergeBtn'), clearBtn = $('clearBtn');
const limitsEl = $('limits'), progressEl = $('progress'), progressBar = $('progressBar');
const progressText = $('progressText'), resultEl = $('result'), errEl = $('err');
const emptyEl = $('empty'), countEl = $('count'), mlabel = $('mlabel'), fnameEl = $('fname');

// Limits (enforced)
const LIMIT_BYTES = 100 * 1024 * 1024; // 100 MB total
const LIMIT_FILES = 50;
const LIMIT_PAGES = 500;

let files = []; // [{file, id, name, size, hash, dup, thumb, pages}]
let dragId = null, busy = false, downloadUrl = null;

const ICONS = {
  grip:'<circle cx="9" cy="6" r="1"/><circle cx="15" cy="6" r="1"/><circle cx="9" cy="12" r="1"/><circle cx="15" cy="12" r="1"/><circle cx="9" cy="18" r="1"/><circle cx="15" cy="18" r="1"/>',
  up:'<path d="M6 15l6-6 6 6"/>', down:'<path d="M6 9l6 6 6-6"/>', x:'<path d="M6 6l12 12M18 6L6 18"/>'
};
function icon(n){
  const s = document.createElementNS('http://www.w3.org/2000/svg','svg');
  s.setAttribute('class','icon'); s.setAttribute('viewBox','0 0 24 24'); s.setAttribute('aria-hidden','true');
  s.innerHTML = ICONS[n]; // static, trusted markup only
  return s;
}
function el(tag, cls, text){ const e = document.createElement(tag); if(cls) e.className = cls; if(text != null) e.textContent = text; return e; }

function showErr(list, title){
  errEl.textContent = '';
  if(!list.length){ errEl.hidden = true; return; }
  errEl.appendChild(el('strong', null, title || (list.length === 1 ? 'Something needs your attention' : `${list.length} issues need your attention`)));
  const ul = el('ul'); list.forEach(m => ul.appendChild(el('li', null, m))); errEl.appendChild(ul);
  errEl.hidden = false;
}

browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => { handleFiles(Array.from(e.target.files)); });
['dragenter','dragover'].forEach(t => dropzone.addEventListener(t, e => { if(dragId != null) return; e.preventDefault(); dropzone.classList.add('over'); }));
['dragleave','drop'].forEach(t => dropzone.addEventListener(t, () => dropzone.classList.remove('over')));
dropzone.addEventListener('drop', (e) => {
  if(dragId != null) return;
  e.preventDefault();
  handleFiles(Array.from(e.dataTransfer.files));
});
window.addEventListener('dragover', e => e.preventDefault());
window.addEventListener('drop', e => e.preventDefault());

clearBtn.addEventListener('click', () => { files = []; progressEl.hidden = true; showErr([]); renderList(); });

mergeBtn.addEventListener('click', async () => {
  busy = true; updateButtons(); showErr([]);
  try {
    await mergeFiles();
  } catch (err) {
    progressText.textContent = 'Merge failed ❌ ' + err.message;
    progressEl.classList.add('is-error');
    showErr([err.message], 'Merge stopped');
    console.error(err);
  } finally {
    busy = false; updateButtons();
  }
});

async function handleFiles(selected){
  const seen = new Set(files.map(f => f.hash));
  const dups = [], rejected = [];
  const added = [];
  for(const f of selected){
    if(!(f.type === 'application/pdf' || /\.pdf$/i.test(f.name))){ rejected.push(`${f.name}: not a PDF. Only .pdf files can be merged.`); continue; }
    const hash = await fileKey(f);
    const dup = seen.has(hash);
    if(dup) dups.push(f.name);
    seen.add(hash);
    added.push({ id: `${hash.slice(0,12)}-${Math.random().toString(36).slice(2,7)}`, file: f, name: f.name, size: f.size, hash, dup, thumb: null, pages: null });
  }
  let all = [...files, ...added];
  const notices = [];
  if(all.length > LIMIT_FILES){ notices.push(`Only the first ${LIMIT_FILES} files were added.`); all = all.slice(0, LIMIT_FILES); }
  if(dups.length) notices.push(`${dups.length} file(s) are identical copies of files already in the list and are marked "Duplicate": ${dups.join(', ')}. Remove them if you do not want them twice.`);
  files = all;
  fileInput.value = '';
  showErr(rejected, rejected.length === 1 ? '1 file was not added' : `${rejected.length} files were not added`);
  // App started: remove the static "not started" warning (shown only if this script never runs, e.g. file:// or a failed integrity check).
document.getElementById('startupWarning')?.remove();
renderList();
  if(notices.length) limitsEl.textContent += (limitsEl.textContent ? ' — ' : '') + notices.join(' ');
}

function totalSize(){ return files.reduce((s,f)=>s+f.size,0); }
function knownPages(){ return files.reduce((s,f)=>s+(f.pages||0),0); }

function updateButtons(){
  const n = files.length;
  mergeBtn.disabled = busy || n === 0 || totalSize() > LIMIT_BYTES;
  clearBtn.disabled = busy || n === 0;
  mlabel.textContent = busy ? 'Merging…' : n >= 2 ? `Merge ${n} PDFs` : 'Merge PDFs';
}
function updateCount(){
  const n = files.length, p = knownPages();
  countEl.textContent = n ? `${n} file${n>1?'s':''}${p ? ` · ${p} page${p>1?'s':''}` : ''} · ${formatBytes(totalSize())}` : '';
}

function renderList(){
  fileListEl.textContent = '';
  clearResult();
  const n = files.length, totalBytes = totalSize();
  emptyEl.hidden = n > 0; fileListEl.hidden = n === 0;
  limitsEl.textContent = totalBytes > LIMIT_BYTES ? `Total size ${formatBytes(totalBytes)} is over the 100 MB limit — please remove some files.` : '';
  updateCount(); updateButtons();

  files.forEach((item, idx) => {
    const li = el('li', 'file-card');
    li.dataset.index = idx; li.dataset.id = item.id; li.draggable = true;
    if(item.dup) li.classList.add('is-duplicate');
    const handle = el('span', 'handle'); handle.title = 'Drag to reorder'; handle.appendChild(icon('grip'));
    const num = el('span', 'idx', String(idx + 1));
    const thumb = el('div', 'thumb');
    const meta = el('div', 'meta');
    const nameEl = el('div', 'name', item.name); nameEl.title = item.name;
    const sub = el('div', 'sub', (item.pages ? `${item.pages} page${item.pages>1?'s':''} · ` : '') + formatBytes(item.size));
    meta.append(nameEl, sub);
    if(item.dup) meta.appendChild(el('span', 'tag tag-duplicate', 'Duplicate (identical content)'));
    const acts = el('div', 'acts');
    const mk = (act, ic, label, disabled, extra) => { const b = el('button', 'ib' + (extra||'')); b.type = 'button'; b.dataset.act = act; b.setAttribute('aria-label', `${label} ${item.name}`); b.title = label; b.disabled = disabled; b.appendChild(icon(ic)); return b; };
    acts.append(mk('up','up','Move up', idx === 0), mk('down','down','Move down', idx === n-1), mk('remove','x','Remove', false, ' del'));
    li.append(handle, num, thumb, meta, acts);
    fileListEl.appendChild(li);
    renderThumbnail(item, thumb, sub).catch((err) => {
      console.warn('Thumbnail failed:', err);
      thumb.textContent = ''; thumb.appendChild(el('span', 'tag', 'Preview not available'));
    });
  });
}

fileListEl.addEventListener('click', (e) => {
  const b = e.target.closest('button'); if(!b || busy) return;
  const idx = Number(b.closest('li').dataset.index), act = b.dataset.act;
  if(act === 'remove') files.splice(idx, 1);
  else if(act === 'up' && idx > 0) [files[idx-1], files[idx]] = [files[idx], files[idx-1]];
  else if(act === 'down' && idx < files.length-1) [files[idx+1], files[idx]] = [files[idx], files[idx+1]];
  // App started: remove the static "not started" warning (shown only if this script never runs, e.g. file:// or a failed integrity check).
document.getElementById('startupWarning')?.remove();
renderList();
});
fileListEl.addEventListener('dragstart', e => { const li = e.target.closest('li'); if(!li) return; dragId = li.dataset.id; li.classList.add('dragging'); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setData('text/plain','x'); });
fileListEl.addEventListener('dragend', () => { dragId = null; renderList(); });
fileListEl.addEventListener('dragover', e => { if(dragId == null) return; e.preventDefault(); fileListEl.querySelectorAll('.target').forEach(x => x.classList.remove('target')); e.target.closest('li')?.classList.add('target'); });
fileListEl.addEventListener('drop', e => {
  if(dragId == null) return; e.preventDefault(); e.stopPropagation();
  const li = e.target.closest('li'); if(!li) return;
  const i = files.findIndex(f => f.id === dragId), j = files.findIndex(f => f.id === li.dataset.id);
  dragId = null; if(i < 0 || j < 0) return;
  const [x] = files.splice(i, 1); files.splice(j, 0, x); // App started: remove the static "not started" warning (shown only if this script never runs, e.g. file:// or a failed integrity check).
document.getElementById('startupWarning')?.remove();
renderList();
});

async function renderThumbnail(item, container, subEl){
  if(!item.thumb){
    if(typeof pdfjsLib === 'undefined') await new Promise((res,rej)=>{window.addEventListener('pdfjs-ready',res,{once:true});setTimeout(()=>rej(new Error('PDF.js not loaded')),10000);});
    const arrayBuffer = await item.file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;
    try {
      item.pages = pdf.numPages;
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width; canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      item.thumb = canvas.toDataURL('image/png');
    } finally {
      await loadingTask.destroy();
    }
  }
  if(subEl && item.pages) subEl.textContent = `${item.pages} page${item.pages>1?'s':''} · ${formatBytes(item.size)}`;
  updateCount();
  const img = document.createElement('img');
  img.src = item.thumb; img.alt = `First page of ${item.name}`;
  container.textContent = ''; container.appendChild(img);
}

function clearResult(){
  resultEl.textContent = ''; resultEl.hidden = true;
  if(downloadUrl){ URL.revokeObjectURL(downloadUrl); downloadUrl = null; }
}

function outputFileName(){
  const typed = (fnameEl.value || '').trim().replace(/\.pdf$/i,'').replace(/[\\/:*?"<>|\u0000-\u001f]+/g,'-').slice(0,150);
  if(typed) return typed + '.pdf';
  const d = new Date(), pad = n => String(n).padStart(2,'0');
  return `ASEC-merged-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.pdf`;
}

function formatBytes(bytes){
  if(bytes === 0) return '0 B';
  const k=1024,sizes=['B','KB','MB','GB'];const i=Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+sizes[i];
}

function setProgress(pct, text){
  progressBar.style.width = pct + '%';
  progressBar.parentNode.setAttribute('aria-valuenow', String(Math.round(pct)));
  progressText.textContent = text;
}

async function mergeFiles(){
  if(files.length === 0) return;
  if(typeof PDFLib === 'undefined') throw new Error('pdf-lib could not be loaded. Please reload the page.');
  clearResult();
  progressEl.hidden = false; progressEl.classList.remove('is-error');
  setProgress(0, 'Merging…');

  const { PDFDocument } = PDFLib;
  const merged = await PDFDocument.create();
  let processed = 0;
  const total = files.length;

  for(const item of files){
    const src = await loadForMerge(item);
    if(merged.getPageCount() + src.getPageCount() > LIMIT_PAGES){
      throw new Error(`The merged file would exceed the ${LIMIT_PAGES}-page limit (adding "${item.name}" brings it to ${merged.getPageCount() + src.getPageCount()} pages). Please split the job into smaller merges.`);
    }
    let pages;
    try {
      pages = await merged.copyPages(src, src.getPageIndices());
    } catch (err) {
      throw new Error(`"${item.name}" appears to be damaged and its pages could not be copied. Please re-export or re-save it and try again.`);
    }
    pages.forEach(stripPageScripts);
    for(const p of pages) merged.addPage(p);
    processed++;
    const pct = Math.round((processed/total)*95);
    setProgress(pct, `Adding ${item.name} (${processed} of ${total})…`);
    await new Promise(r => setTimeout(r, 0));
  }

  setProgress(97, 'Saving…');
  const out = await merged.save();
  const blob = new Blob([out], { type: 'application/pdf' });
  downloadUrl = URL.createObjectURL(blob);
  const fileName = outputFileName();

  resultEl.textContent = '';
  resultEl.appendChild(el('span', null, `Merged ${total} file${total>1?'s':''} (${merged.getPageCount()} pages, ${formatBytes(blob.size)}) into ${fileName}.`));
  const dlBtn = el('a', 'btn btn-primary', `Download ${fileName}`);
  dlBtn.href = downloadUrl; dlBtn.download = fileName;
  resultEl.appendChild(dlBtn);
  resultEl.hidden = false;
  setProgress(100, `Done ✅ ${merged.getPageCount()} pages • ${formatBytes(blob.size)}`);
}

async function fileKey(f){
  // Content hash so different files with the same name/size are kept,
  // byte-identical duplicates are still added, but tagged "Duplicate" so the user can remove them.
  try {
    const d = await crypto.subtle.digest('SHA-256', await f.arrayBuffer());
    return Array.from(new Uint8Array(d), x => x.toString(16).padStart(2,'0')).join('');
  } catch (e) {
    return `${f.name}__${f.size}__${f.lastModified}`;
  }
}


// Friendly, per-file validation before merging.
async function loadForMerge(item){
  const { PDFDocument } = PDFLib;
  if(item.size === 0) throw new Error(`"${item.name}" is empty (0 bytes). Please remove it and try again.`);
  const bytes = new Uint8Array(await item.file.arrayBuffer());
  const head = new TextDecoder('latin1').decode(bytes.subarray(0, 1024));
  if(!head.includes('%PDF-')) throw new Error(`"${item.name}" is not a PDF file (it may have been renamed to .pdf). Please remove it and try again.`);
  let src;
  try {
    src = await PDFDocument.load(bytes, { updateMetadata: false });
  } catch (err) {
    if(err && (err.name === 'EncryptedPDFError' || /encrypt/i.test(err.message))){
      throw new Error(`"${item.name}" is password-protected or encrypted. Please remove the password (open it and save an unprotected copy) and try again.`);
    }
    throw new Error(`"${item.name}" appears to be damaged and could not be read. Please re-export or re-save it and try again.`);
  }
  let count;
  try { count = src.getPageCount(); } catch (err) { count = -1; }
  if(count < 0) throw new Error(`"${item.name}" appears to be damaged (its page tree cannot be read). Please re-export or re-save it and try again.`);
  if(count === 0) throw new Error(`"${item.name}" has no pages.`);
  return src;
}

// Remove interactive actions from copied pages. This is NOT a PDF sanitizer.
// Removed: page /AA; on every annotation: /AA, and /A when the action (or any
// action in its /Next chain) is not an internal /GoTo; /AA on form-field
// parents of widget annotations. Internal page links (/GoTo, /Dest) are kept.
// Document-level items (/OpenAction, /Names /JavaScript, /AcroForm) are never
// copied by pdf-lib's copyPages. Content streams, fonts, images and embedded
// files inside annotations are copied unchanged.
const ALLOWED_ACTIONS = new Set(['GoTo']);
function actionChainIsUnsafe(act, depth = 0){
  const { PDFName, PDFDict, PDFArray } = PDFLib;
  if(!(act instanceof PDFDict) || depth > 32) return depth > 32;
  const s = act.lookup(PDFName.of('S'));
  const type = s ? (s.decodeText ? s.decodeText() : String(s).replace('/','')) : '';
  if(!ALLOWED_ACTIONS.has(type)) return true;
  const next = act.lookup(PDFName.of('Next'));
  if(next instanceof PDFDict) return actionChainIsUnsafe(next, depth + 1);
  if(next instanceof PDFArray){
    for(let i = 0; i < next.size(); i++) if(actionChainIsUnsafe(next.lookup(i), depth + 1)) return true;
  }
  return false;
}
function stripPageScripts(page){
  const { PDFName, PDFDict, PDFArray } = PDFLib;
  const node = page.node;
  node.delete(PDFName.of('AA'));
  const annots = node.lookup(PDFName.of('Annots'));
  if(!(annots instanceof PDFArray)) return;
  for(let i = 0; i < annots.size(); i++){
    const a = annots.lookup(i);
    if(!(a instanceof PDFDict)) continue;
    a.delete(PDFName.of('AA'));
    const act = a.lookup(PDFName.of('A'));
    if(act && actionChainIsUnsafe(act)) a.delete(PDFName.of('A'));
    let parent = a.lookup(PDFName.of('Parent'));
    for(let d = 0; parent instanceof PDFDict && d < 32; d++){
      parent.delete(PDFName.of('AA'));
      parent = parent.lookup(PDFName.of('Parent'));
    }
  }
}

// Demo banner. Controlled by <meta name="kdms-demo-banner" content="auto|on|off">.
// auto (default) = shown only on *.github.io. Production (IIS) builds set "off".
(function demoBanner(){
  const meta = document.querySelector('meta[name="kdms-demo-banner"]');
  const mode = (meta && meta.content || 'auto').toLowerCase();
  const show = mode === 'on' || (mode === 'auto' && /(^|\.)github\.io$/i.test(location.hostname));
  if(!show) return;
  const b = document.createElement('div');
  b.className = 'demo-banner';
  b.setAttribute('role', 'alert');
  b.textContent = 'DEMO ONLY – Use synthetic test documents. Not approved for official or restricted documents.';
  document.body.prepend(b);
})();


// PDF.js is an ES module; browsers block modules on file://. Tell the user instead of failing silently.
if(location.protocol === 'file:'){
  const warn = el('p', 'file-warning', 'This app must be opened from a web server (e.g. the ASEC intranet link), not by double-clicking index.html. Previews and merging may not work from a local file.');
  document.querySelector('.uploader').prepend(warn);
}

// App started: remove the static "not started" warning (shown only if this script never runs, e.g. file:// or a failed integrity check).
document.getElementById('startupWarning')?.remove();
renderList();
