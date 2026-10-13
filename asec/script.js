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
    progressText.textContent = 'Merge failed ❌';
    alert('An error occurred while merging: ' + err.message);
    console.error(err);
  } finally {
    clearBtn.disabled = false;
    mergeBtn.disabled = files.length === 0 || totalSize() > LIMIT_BYTES;
  }
});

function handleFiles(selected){
  const combined = [...files.map(f => f.file), ...selected];
  // de-duplicate by name+size (simple heuristic)
  const map = new Map();
  for(const f of combined){
    const key = `${f.name}__${f.size}`;
    if(!map.has(key)) map.set(key, f);
  }
  const all = Array.from(map.values());
  if(all.length > LIMIT_FILES){
    alert(`Only the first ${LIMIT_FILES} files were added.`);
  }
  const existing = new Map(files.map(f => [f.file, f]));
  files = all.slice(0, LIMIT_FILES).map((f, i) => existing.get(f) || ({
    id: `${f.name}-${f.size}-${i}-${Math.random().toString(36).slice(2,7)}`,
    file: f,
    name: f.name,
    size: f.size,
    thumb: null
  }));
  fileInput.value = '';

  renderList();
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
    renderThumbnail(item, thumb).catch(() => {
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
    if(typeof pdfjsLib === 'undefined') throw new Error('PDF.js not loaded');
    const arrayBuffer = await item.file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({data: arrayBuffer}).promise;
    try {
      const page = await pdf.getPage(1);
      const viewport = page.getViewport({ scale: 0.35 });
      const canvas = document.createElement('canvas');
      canvas.width = viewport.width;
      canvas.height = viewport.height;
      await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      item.thumb = canvas.toDataURL('image/png');
    } finally {
      pdf.destroy();
    }
  }
  const img = document.createElement('img');
  img.src = item.thumb;
  img.alt = `First page of ${item.name}`;
  container.innerHTML = '';
  container.appendChild(img);
}

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
    throw new Error('pdf-lib could not be loaded. Check your internet connection and reload the page.');
  }
  clearResult();

  progressEl.hidden = false;
  progressBar.style.width = '0%';
  progressText.textContent = 'Merging…';

  const { PDFDocument } = PDFLib;
  const merged = await PDFDocument.create();

  let processed = 0;
  const total = files.length;

  for(const item of files){
    const bytes = await item.file.arrayBuffer();
    let src;
    try {
      src = await PDFDocument.load(bytes, { ignoreEncryption: true });
    } catch (err) {
      throw new Error(`"${item.name}" could not be read (${err.message})`);
    }
    const pages = await merged.copyPages(src, src.getPageIndices());
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
