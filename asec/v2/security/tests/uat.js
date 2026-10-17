// Extra UAT / IT-readiness checks for KDMS PDF Merger v2.1. Usage: node uat.js URL OUT.json
const pw=require('playwright');const fs=require('fs');const path=require('path');const os=require('os');
const {PDFDocument}=require('pdf-lib');
const URL_=process.argv[2];const OUT=process.argv[3];const FX=process.env.FX||'/tmp/fxrc';const FU=process.env.FU||'/tmp/fxu';
const R=[];const add=(id,area,steps,expected,actual,pass)=>{R.push({id,area,steps,expected,actual,result:pass?'PASS':'FAIL'});console.log(id,pass?'PASS':'FAIL','-',actual);};
const widths=async f=>(await PDFDocument.load(fs.readFileSync(f))).getPages().map(p=>Math.round(p.getWidth()));
async function fresh(b,opt={}){const c=await b.newContext({acceptDownloads:true,...opt});const p=await c.newPage();const ev={dialogs:[],errors:[],ext:[],csp:[]};
 const host=new URL(URL_).host;
 await p.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>console.error('CSP-VIOLATION '+e.violatedDirective+' '+e.blockedURI)));
 p.on('dialog',d=>{ev.dialogs.push(d.message());d.dismiss();});p.on('console',m=>{if(m.type()==='error'){ev.errors.push(m.text());if(/CSP-VIOLATION/.test(m.text()))ev.csp.push(m.text());}});
 p.on('request',r=>{const u=new URL(r.url());if(!['blob:','data:'].includes(u.protocol)&&u.host!==host)ev.ext.push(r.url());});
 return {c,p,ev};}
async function merge(p){await p.click('#mergeBtn');await Promise.race([p.waitForSelector('#result a',{timeout:120000}),p.waitForFunction(()=>/failed/.test(document.getElementById('progressText').textContent),null,{timeout:120000})]);}
async function download(p){const [d]=await Promise.all([p.waitForEvent('download'),p.click('#result a')]);const f=path.join(os.tmpdir(),'uat-'+Date.now()+'.pdf');await d.saveAs(f);return {f,name:d.suggestedFilename()};}
(async()=>{const b=await pw.chromium.launch();const ver=b.version();
 // ---------- Functional
 let {c,p,ev}=await fresh(b);await p.goto(URL_,{waitUntil:'networkidle'});
 await p.setInputFiles('#fileInput',[FU+'/r1.pdf',FU+'/r2.pdf',FU+'/r3.pdf']);await p.waitForTimeout(1500);
 const cards=await p.$$eval('#fileList li',x=>x.length);const cnt=await p.textContent('#count');
 add('F-01','Functional','Choose 3 PDFs','3 rows; count shows files, pages, size',`${cards} rows; "${cnt}"`,cards===3&&/3 files · 3 pages/.test(cnt));
 await p.click('#fileList li:nth-child(1) [data-act=down]');
 let names=await p.$$eval('#fileList .name',x=>x.map(e=>e.textContent));
 add('F-02','Functional','Click ↓ on row 1','Order r2, r1, r3',names.join(', '),names.join()==='r2.pdf,r1.pdf,r3.pdf');
 await p.click('#fileList li:nth-child(3) [data-act=up]');names=await p.$$eval('#fileList .name',x=>x.map(e=>e.textContent));
 add('F-03','Functional','Click ↑ on row 3','Order r2, r3, r1',names.join(', '),names.join()==='r2.pdf,r3.pdf,r1.pdf');
 const upDis=await p.$eval('#fileList li:nth-child(1) [data-act=up]',b=>b.disabled),dnDis=await p.$eval('#fileList li:nth-child(3) [data-act=down]',b=>b.disabled);
 add('F-04','Functional','Inspect first/last row buttons','↑ disabled on first row, ↓ disabled on last row',`first ↑ disabled=${upDis}, last ↓ disabled=${dnDis}`,upDis&&dnDis);
 await p.fill('#fname','Report: Q3/"final"*?<>|.pdf');await merge(p);let dl=await download(p);let w=await widths(dl.f);
 add('F-05','Functional','Type output name with illegal characters, merge, download','Illegal characters replaced; .pdf added once',`downloaded as "${dl.name}"`,!/[\\/:*?"<>|]/.test(dl.name)&&/\.pdf$/.test(dl.name)&&!/\.pdf\.pdf$/.test(dl.name));
 add('F-06','Functional','Check merged page order after reordering','Pages in on-screen order (r2, r3, r1 → widths 320, 330, 310)',JSON.stringify(w),JSON.stringify(w)==='[320,330,310]');
 await p.fill('#fname','');await merge(p);dl=await download(p);
 add('F-07','Functional','Clear output name, merge again','Default name ASEC-merged-YYYYMMDD-HHMM.pdf',dl.name,/^ASEC-merged-\d{8}-\d{4}\.pdf$/.test(dl.name));
 await p.click('#fileList li:nth-child(2) [data-act=remove]');names=await p.$$eval('#fileList .name',x=>x.map(e=>e.textContent));
 add('F-08','Functional','Click ✕ on row 2','Row removed; result cleared',`${names.join(', ')}; result hidden=${await p.$eval('#result',e=>e.hidden)}`,names.join()==='r2.pdf,r1.pdf'&&await p.$eval('#result',e=>e.hidden));
 await p.click('#clearBtn');add('F-09','Functional','Click "Clear all"','List empty; empty-state text shown; buttons disabled',`rows=${await p.$$eval('#fileList li',x=>x.length)}, empty visible=${await p.isVisible('#empty')}, merge disabled=${await p.$eval('#mergeBtn',b=>b.disabled)}`,await p.isVisible('#empty')&&await p.$eval('#mergeBtn',b=>b.disabled));
 // F-10 drag reorder
 await p.setInputFiles('#fileInput',[FU+'/r1.pdf',FU+'/r2.pdf',FU+'/r3.pdf']);await p.waitForTimeout(1200);
 await p.dragAndDrop('#fileList li:nth-child(3)','#fileList li:nth-child(1)');names=await p.$$eval('#fileList .name',x=>x.map(e=>e.textContent));
 add('F-10','Functional','Drag row 3 onto row 1 (mouse drag & drop)','r3 moves to the top',names.join(', '),names[0]==='r3.pdf');
 const nonpdf=path.join(os.tmpdir(),'notes.txt');fs.writeFileSync(nonpdf,'hello');await p.setInputFiles('#fileInput',[nonpdf]);await p.waitForTimeout(500);
 const errTxt=await p.textContent('#err');add('F-11','Functional','Choose a .txt file','Not added; inline message',errTxt.slice(0,120),/not a PDF/.test(errTxt)&&!(await p.$$eval('#fileList .name',x=>x.map(e=>e.textContent))).includes('notes.txt'));
 add('S-01','Security','Functional session above','0 external requests, 0 CSP violations, no dialogs',`ext=${ev.ext.length}, csp=${ev.csp.length}, dialogs=${ev.dialogs.length}`,!ev.ext.length&&!ev.csp.length&&!ev.dialogs.length);
 // storage / cookies / telemetry
 const st=await p.evaluate(async()=>({ls:localStorage.length,ss:sessionStorage.length,cookie:document.cookie,idb:indexedDB.databases?(await indexedDB.databases()).length:'n/a',sw:navigator.serviceWorker?(await navigator.serviceWorker.getRegistrations()).length:'n/a'}));
 const ck=await c.cookies();add('S-02','Security','Inspect storage after a full session','No cookies, localStorage, sessionStorage, IndexedDB or service worker',`cookies=${ck.length}, localStorage=${st.ls}, sessionStorage=${st.ss}, IndexedDB=${st.idb}, SW=${st.sw}`,ck.length===0&&st.ls===0&&st.ss===0&&!st.idb&&!st.sw);
 await c.close();
 // ---------- XSS file names
 ({c,p,ev}=await fresh(b));await p.goto(URL_,{waitUntil:'networkidle'});
 await p.setInputFiles('#fileInput',[FU+'/<img src=x onerror=alert(1)>.pdf',FU+'/"><svg onload=alert(2)>&amp;.pdf']);await p.waitForTimeout(1500);await merge(p);
 const inj=await p.evaluate(()=>({img:document.querySelectorAll('img[src="x"]').length,svg:document.querySelectorAll('svg[onload]').length,names:[...document.querySelectorAll('#fileList .name')].map(e=>e.textContent)}));
 add('S-03','Security','Add files named <img src=x onerror=alert(1)>.pdf and "><svg onload=alert(2)>&amp;.pdf, then merge','Names shown as literal text; no element injected; no script runs',`dialogs=${ev.dialogs.length}, injected img=${inj.img}, svg=${inj.svg}, shown: ${inj.names.join(' | ')}`,!ev.dialogs.length&&!inj.img&&!inj.svg&&inj.names[0].includes('<img src=x onerror=alert(1)>'));
 await c.close();
 // ---------- Decompression bomb
 ({c,p,ev}=await fresh(b));const cdp=await c.newCDPSession(p);await p.goto(URL_,{waitUntil:'networkidle'});
 let t0=Date.now();await p.setInputFiles('#fileInput',[FU+'/bomb-400MB-inflated.pdf',FX+'/base.pdf']);
 await p.waitForFunction(()=>document.querySelectorAll('.thumb img, .thumb .tag').length>=2,null,{timeout:120000}).catch(()=>{});const tThumb=Date.now()-t0;
 t0=Date.now();await merge(p);const tMerge=Date.now()-t0;const st2=await p.textContent('#progressText');const alive=await p.evaluate(()=>1+1).catch(()=>0);
 add('S-04','Security/robustness','Add a 0.4 MB PDF whose content stream inflates to 400 MB, plus a normal PDF; merge','No crash or hang; merge completes or a clear error',`thumbnails settled in ${tThumb} ms; merge ${tMerge} ms; status "${st2}"; page responsive=${alive===2}`,alive===2&&/Done|failed/.test(st2));
 await c.close();
 // ---------- Offline after first load
 ({c,p,ev}=await fresh(b));await p.goto(URL_,{waitUntil:'networkidle'});await c.setOffline(true);
 await p.setInputFiles('#fileInput',[FU+'/r1.pdf',FU+'/r2.pdf']);await p.waitForTimeout(1500);const th=await p.$$eval('.thumb img',x=>x.length);await merge(p);const offOk=!!(await p.$('#result a'));
 add('O-01','Offline','Load the page, go offline, then add 2 files and merge','Thumbnails and merge work without a network',`thumbnails=${th}/2, merge ok=${offOk}`,th===2&&offOk);
 const rl=await p.reload().then(()=>'loaded').catch(e=>'failed: '+e.message.split('\n')[0]);
 add('O-02','Offline','Reload the page while offline','(Informational) No service worker, so a reload needs the server',rl,true);
 await c.close();
 // ---------- Redirect, banner on/off, file://
 ({c,p,ev}=await fresh(b));await p.goto(URL_.replace(/v2\/?$/,''),{waitUntil:'networkidle'});await p.waitForTimeout(1500);
 add('O-03','Navigation','Open the old /asec/ link','Redirects to /asec/v2/ (meta refresh, no script)',p.url(),/\/asec\/v2\/$/.test(p.url()));
 const ban=await p.isVisible('.demo-banner');const gh=/github\.io$/.test(new URL(URL_).hostname);add('O-04','Banner',`Open with default setting (auto) on ${new URL(URL_).hostname}`,gh?'Red DEMO ONLY banner visible (github.io)':'Banner hidden (not github.io)',`visible=${ban}`,gh?ban:!ban);
 await c.close();({c,p,ev}=await fresh(b));
 await p.route('**/asec/v2/',async r=>{const res=await r.fetch();let body=await res.text();body=body.replace('name="kdms-demo-banner" content="auto"','name="kdms-demo-banner" content="off"');r.fulfill({response:res,body});});
 await p.goto(URL_,{waitUntil:'networkidle'});const ban2=await p.isVisible('.demo-banner');
 add('O-05','Banner','Serve index.html with <meta name="kdms-demo-banner" content="off">','Banner hidden (production setting)',`visible=${ban2}`,!ban2);await c.close();
 ({c,p,ev}=await fresh(b));await p.goto('file://'+(process.env.APPDIR||'')+'/index.html');await p.waitForTimeout(1500);
 const fw=await p.textContent('.file-warning').catch(()=>null);add('O-06','file://','Open index.html by double-click (file://)','Warning shown that a web server is needed',fw||'no warning',!!fw);await c.close();

 // ---------- Static / HTTP checks
 const crypto=require('crypto');const get=async u=>{const r=await fetch(u);return {r,buf:Buffer.from(await r.arrayBuffer())};};
 const base=URL_.endsWith('/')?URL_:URL_+'/';
 {const {r}=await get(base);const h=['content-security-policy','x-content-type-options','x-frame-options','referrer-policy','strict-transport-security','permissions-policy','cross-origin-opener-policy'];const present=h.filter(k=>r.headers.get(k));
  add('S-05','Security headers',`GET ${base} and list response headers`,'(Informational) GitHub Pages cannot set custom headers; CSP comes from the <meta> tag. web.config supplies all 7 headers on IIS',`present: ${present.join(', ')||'none'}; cache-control: ${r.headers.get('cache-control')}; server: ${r.headers.get('server')}`,true);
  const m=await get(base+'pdfjs-init.mjs');add('S-06','Security headers','GET pdfjs-init.mjs','Served as JavaScript (module MIME type)',m.r.headers.get('content-type'),/javascript/.test(m.r.headers.get('content-type')||''));}
 {const exp={'vendor/pdf.min.mjs':'bccc24ea711db8e44503629519904a5292d73b9daaa214bbe7cdcc282b0f4259','vendor/pdf.worker.min.mjs':'145d2dd3ab0c86151011dba95acfa2d5336e2accd59388ea43dbee0efddaaec6','vendor/pdf-lib.min.js':'2294a0bb8742d8948ae2d49a60cb6a3600c0b5deae6de198e57fb368d1b79ba9'};
  const out=[];let ok=true;for(const [f,h] of Object.entries(exp)){const {buf}=await get(base+f);const got=crypto.createHash('sha256').update(buf).digest('hex');out.push(`${f.split('/')[1]} ${got===h?'match':'MISMATCH'}`);ok=ok&&got===h;}
  add('S-07','Supply chain','SHA-256 of served vendor files vs the files in the official npm tarballs (pdfjs-dist 6.4.299 legacy/build, @cantoo/pdf-lib 2.11.1 dist)','Byte-identical',out.join('; '),ok);
  let ev2=0;for(const f of [...Object.keys(exp),'script.js','pdfjs-init.mjs']){const {buf}=await get(base+f);const t=buf.toString('latin1');ev2+=(t.match(/\beval\(/g)||[]).length;}
  add('S-08','Security','Search all shipped JS for eval(','No eval( in shipped code; CSP has no unsafe-eval',`eval( occurrences: ${ev2}`,ev2===0);}
 // SRI tamper test
 ({c,p,ev}=await fresh(b));await p.route(/script\.js\?v=/,async r=>{const res=await r.fetch();const body=(await res.text())+'\n;window.__tampered=1;';r.fulfill({response:res,body});});
 await p.goto(URL_,{waitUntil:'networkidle'});const tam=await p.evaluate(()=>window.__tampered===1);const sriErr=ev.errors.filter(e=>/integrity/i.test(e)).length;
 add('S-09','Supply chain','Serve a modified script.js (one extra line) to the page','Browser refuses to run it (Subresource Integrity)',`tampered code ran=${tam}; integrity errors in console=${sriErr}`,!tam&&sriErr>0);await c.close();
 // ---------- Keyboard-only
 ({c,p,ev}=await fresh(b));await p.goto(URL_,{waitUntil:'networkidle'});
 const seq=[];let fc=null;p.on('filechooser',f=>fc=f);
 for(let i=0;i<8&&!(await p.evaluate(()=>document.activeElement&&document.activeElement.id==='browseBtn'));i++){await p.keyboard.press('Tab');}
 seq.push('Tab→'+await p.evaluate(()=>document.activeElement.id||document.activeElement.tagName));await p.keyboard.press('Enter');await p.waitForTimeout(500);
 if(fc){await fc.setFiles([FU+'/r1.pdf',FU+'/r2.pdf']);}await p.waitForTimeout(1500);
 let reached=false;for(let i=0;i<20;i++){await p.keyboard.press('Tab');const a=await p.evaluate(()=>({act:document.activeElement.dataset&&document.activeElement.dataset.act,id:document.activeElement.id,vis:getComputedStyle(document.activeElement).outlineStyle}));if(a.act==='down'){seq.push('Tab→↓ (focus outline '+a.vis+')');await p.keyboard.press('Enter');reached=true;break;}}
 names=await p.$$eval('#fileList .name',x=>x.map(e=>e.textContent));
 for(let i=0;i<25&&!(await p.evaluate(()=>document.activeElement.id==='mergeBtn'));i++)await p.keyboard.press('Tab');
 seq.push('Tab→'+await p.evaluate(()=>document.activeElement.id));await p.keyboard.press('Enter');await p.waitForSelector('#result a',{timeout:30000}).catch(()=>{});
 const kOk=!!fc&&reached&&names[0]==='r2.pdf'&&!!(await p.$('#result a'));
 add('A-01','Accessibility','Keyboard only: Tab to "Choose PDF files" + Enter, pick 2 files, Tab to ↓ + Enter, Tab to Merge + Enter','The whole flow works without a mouse; focus is visible',`${seq.join(', ')}; file chooser opened=${!!fc}; order after ↓: ${names.join(', ')}; result=${!!(await p.$('#result a'))}`,kOk);
 // axe
 const axeSrc=fs.readFileSync(require.resolve('axe-core/axe.min.js'),'utf8');
 const runAxe=async label=>{await p.addScriptTag({content:axeSrc}).catch(async()=>{await p.evaluate(axeSrc);});return p.evaluate(async()=>{const r=await axe.run(document,{runOnly:['wcag2a','wcag2aa','wcag21a','wcag21aa','best-practice']});return r.violations.map(v=>({id:v.id,impact:v.impact,n:v.nodes.length,help:v.help,targets:v.nodes.slice(0,3).map(n=>n.target.join(' '))}));});};
 R.axe={};
 await c.close();({c,p,ev}=await fresh(b,{bypassCSP:true}));await p.goto(URL_,{waitUntil:'networkidle'});R.axe.empty=await runAxe('empty');
 await p.setInputFiles('#fileInput',[FX+'/base.pdf',FX+'/base.pdf']);await p.waitForTimeout(1500);await merge(p);R.axe.merged=await runAxe('merged');
 for(const [k,v] of Object.entries(R.axe)){const crit=v.filter(x=>['critical','serious'].includes(x.impact));add('A-02-'+k,'Accessibility',`axe-core ${require('axe-core/package.json').version} scan (WCAG 2.1 A/AA + best practice), state: ${k}`,'No critical/serious violations',v.length?v.map(x=>`${x.id} (${x.impact}, ${x.n})`).join('; '):'0 violations',crit.length===0);}
 await c.close();await b.close();
 fs.writeFileSync(OUT,JSON.stringify({browser:'chromium '+ver,url:URL_,date:new Date().toISOString(),results:R,axe:R.axe},null,1));
})();
