/* KDMS PDF Merger — ASEC edition (client-side)
 * - Uses pdf-lib to merge
 * - Uses PDF.js for first-page thumbnails
 * - Drag to reorder cards
*/

const fileInput = document.getElementById('fileInput');
const browseBtn = document.getElementById('browseBtn');
const dropzone = document.getElementById('dropzone');
const fileListEl = document.getElementById('fileList');
const mergeBtn = document.getElementById('mergeBtn');
const clearBtn = document.getElementById('clearBtn');
const limitsEl = document.getElementById('limits');
const progressEl = document.getElementById('progress');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const resultEl = document.getElementById('result');

// Limits
const LIMIT_BYTES = 100 * 1024 * 1024; // ~100MB total
const LIMIT_FILES = 50; // reasonable bound
const LIMIT_PAGES_EST = 500;
const LIMIT_PAGES = 500; // enforced while merging

let files = []; // [{file, id, name, size, thumb}]
let dragSrcIndex = null;
let downloadUrl = null;

browseBtn.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', (e) => handleFiles(Array.from(e.target.files)));

;['dragenter','dragover'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); e.stopPropagation();
  dropzone.classList.add('is-over');
}));
;['dragleave','drop'].forEach(evt => dropzone.addEventListener(evt, e => {
  e.preventDefault(); e.stopPropagation();
  dropzone.classList.remove('is-over');
}));
dropzone.addEventListener('drop', (e) => {
  const dropped = Array.from(e.dataTransfer.files).filter(f => f.type === 'application/pdf' || f.name.toLowerCase().endsWith('.pdf'));
  handleFiles(dropped);
});

clearBtn.addEventListener('click', () => {
  files = [];
  progressEl.hidden = true;
  renderList();
});

mergeBtn.addEventListener('click', async () => {
  mergeBtn.disabled = true;
  clearBtn.disabled = true;
  try {
    await mergeFiles();
  } catch (err) {
    progressText.textContent = 'Merge failed ❌ ' + err.message;
    progressEl.classList.add('is-error');
    alert('Merge stopped: ' + err.message);
    console.error(err);
  } finally {
    clearBtn.disabled = false;
    mergeBtn.disabled = files.length === 0 || totalSize() > LIMIT_BYTES;
  }
});

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

async function handleFiles(selected){
  const seen = new Set(files.map(f => f.hash));
  const skipped = [];
  const added = [];
  for(const f of selected){
    const hash = await fileKey(f);
    const dup = seen.has(hash);
    if(dup) skipped.push(f.name);
    seen.add(hash);
    added.push({
      id: `${hash.slice(0,12)}-${Math.random().toString(36).slice(2,7)}`,
      file: f, name: f.name, size: f.size, hash, dup, thumb: null
    });
  }
  let all = [...files, ...added];
  const notices = [];
  if(all.length > LIMIT_FILES){
    notices.push(`Only the first ${LIMIT_FILES} files were added.`);
    all = all.slice(0, LIMIT_FILES);
  }
  if(skipped.length){
    notices.push(`${skipped.length} file(s) are identical copies of files already in the list and are marked "Duplicate": ${skipped.join(', ')}. Remove them if you do not want them twice.`);
  }
  files = all;
  fileInput.value = '';
  renderList();
  if(notices.length) limitsEl.textContent += ' — ' + notices.join(' ');
}

function renderList(){
  fileListEl.innerHTML = '';
  clearResult();
  const totalBytes = totalSize();
  limitsEl.textContent = files.length
    ? `Files: ${files.length} • Total size: ${formatBytes(totalBytes)} (recommended ≤ ~100MB / ~${LIMIT_PAGES_EST} pages for speed)`
    : '';
  if(totalBytes > LIMIT_BYTES){
    limitsEl.textContent += ' — over the limit, please remove some files.';
  }

  mergeBtn.disabled = files.length === 0 || totalBytes > LIMIT_BYTES;

  files.forEach((item, idx) => {
    const li = document.createElement('li');
    li.className = 'file-card';
    li.setAttribute('data-index', idx);
    li.setAttribute('draggable', 'true');

    const thumb = document.createElement('div');
    thumb.className = 'thumb';
    li.appendChild(thumb);
    renderThumbnail(item, thumb).catch((err) => { console.warn('Thumbnail failed:', err);
      thumb.innerHTML = '<span class="tag">Preview not available</span>';
    });

    const meta = document.createElement('div');
    meta.className = 'meta';
    meta.innerHTML = `
      <div class="name"></div>
      <div class="size">${formatBytes(item.size)}</div>
      <div class="controls">
        <button type="button" class="btn subtle" data-act="up" title="Move up">↑</button>
        <button type="button" class="btn subtle" data-act="down" title="Move down">↓</button>
        <button type="button" class="btn subtle" data-act="remove">Remove</button>
      </div>
      <span class="tag">Drag to reorder</span>
    `;
    const nameEl = meta.querySelector('.name');
    nameEl.textContent = `${idx + 1}. ${item.name}`;
    nameEl.title = item.name;
    if(item.dup){
      li.classList.add('is-duplicate');
      const tag = document.createElement('span');
      tag.className = 'tag tag-duplicate';
      tag.textContent = 'Duplicate (identical content)';
      meta.insertBefore(tag, nameEl.nextSibling);
    }
    li.appendChild(meta);

    // Drag & Drop reorder
    li.addEventListener('dragstart', (e) => {
      dragSrcIndex = idx;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      dragSrcIndex = null;
      renderList();
    });
    li.addEventListener('dragover', (e) => {
      e.preventDefault();
      if(dragSrcIndex === null) return;
      const target = e.currentTarget;
      const targetIndex = Number(target.getAttribute('data-index'));
      if(targetIndex !== dragSrcIndex){
        const children = Array.from(fileListEl.children);
        const srcEl = children[dragSrcIndex];
        const tgtEl = children[targetIndex];
        if(!srcEl || !tgtEl) return;
        if(dragSrcIndex < targetIndex){
          fileListEl.insertBefore(srcEl, tgtEl.nextSibling);
        }else{
          fileListEl.insertBefore(srcEl, tgtEl);
        }
        const newOrder = Array.from(fileListEl.children).map(el => Number(el.getAttribute('data-index')));
        files = newOrder.map(i => files[i]);
        Array.from(fileListEl.children).forEach((el, i) => el.setAttribute('data-index', i));
        dragSrcIndex = Array.from(fileListEl.children).indexOf(srcEl);
      }
    });

    // Buttons
    meta.querySelectorAll('button').forEach(btn => {
      btn.addEventListener('click', (e) => {
        const act = e.currentTarget.getAttribute('data-act');
        if(act === 'remove'){
          files.splice(idx,1);
        }else if(act === 'up' && idx>0){
          [files[idx-1], files[idx]] = [files[idx], files[idx-1]];
        }else if(act === 'down' && idx<files.length-1){
          [files[idx+1], files[idx]] = [files[idx], files[idx+1]];
        }
        renderList();
      });
    });

    fileListEl.appendChild(li);
  });
}

async function renderThumbnail(item, container){
  if(!item.thumb){
    if(typeof pdfjsLib === 'undefined') await new Promise((res,rej)=>{window.addEventListener('pdfjs-ready',res,{once:true});setTimeout(()=>rej(new Error('PDF.js not loaded')),10000);});
    const arrayBuffer = await item.file.arrayBuffer();
    const loadingTask = pdfjsLib.getDocument({data: arrayBuffer});
    const pdf = await loadingTask.promise;
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      item.thumb = canvas.toDataURL('image/png');
    } finally {
      await loadingTask.destroy();
    }
  }
  const img = document.createElement('img');
  img.src = item.thumb;
  img.alt = `First page of ${item.name}`;
  container.innerHTML = '';
  container.appendChild(img);
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

function totalSize(){
  return files.reduce((s,f)=>s+f.size,0);
}

function clearResult(){
  resultEl.innerHTML = '';
  if(downloadUrl){
    URL.revokeObjectURL(downloadUrl);
    downloadUrl = null;
  }
}

function outputFileName(){
  const d = new Date();
  const pad = n => String(n).padStart(2,'0');
  return `ASEC-merged-${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.pdf`;
}

function formatBytes(bytes){
  if(bytes === 0) return '0 B';
  const k=1024,sizes=['B','KB','MB','GB','TB'];const i=Math.floor(Math.log(bytes)/Math.log(k));
  return parseFloat((bytes/Math.pow(k,i)).toFixed(2))+' '+sizes[i];
}

async function mergeFiles(){
  if(files.length === 0) return;
  if(typeof PDFLib === 'undefined'){
    throw new Error('pdf-lib could not be loaded. Please reload the page.');
  }
  clearResult();

  progressEl.hidden = false;
  progressEl.classList.remove('is-error');
  progressBar.style.width = '0%';
  progressText.textContent = 'Merging…';

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
    const pct = Math.round((processed/total)*100);
    progressBar.style.width = pct + '%';
    progressText.textContent = `Merging: ${processed}/${total} (${pct}%)`;
    await new Promise(r => setTimeout(r, 0));
  }

  const out = await merged.save();
  const blob = new Blob([out], { type: 'application/pdf' });
  downloadUrl = URL.createObjectURL(blob);
  const fileName = outputFileName();

  resultEl.innerHTML = '';
  const dlBtn = document.createElement('a');
  dlBtn.className = 'btn success';
  dlBtn.href = downloadUrl;
  dlBtn.download = fileName;
  dlBtn.textContent = `Download ${fileName}`;
  resultEl.appendChild(dlBtn);

  progressText.textContent = `Done ✅ ${merged.getPageCount()} pages • ${formatBytes(blob.size)}`;
}

// PDF.js is an ES module; browsers block modules on file://. Tell the user instead of failing silently.
if(location.protocol === 'file:'){
  const warn = document.createElement('p');
  warn.className = 'file-warning';
  warn.textContent = 'This app must be opened from a web server (e.g. the ASEC intranet link), not by double-clicking index.html. Previews and merging may not work from a local file.';
  document.querySelector('.uploader').prepend(warn);
}
