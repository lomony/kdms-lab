// Security control verification for KDMS PDF Merger v2. Usage: node sec.js URL OUT.json FIXDIR [FRAMER_URL]
const pw=require('playwright');const fs=require('fs');const path=require('path');const os=require('os');const {PDFDocument,PDFName}=require('pdf-lib');
const [,,URL_,OUT,FX,FRAMER]=process.argv;const R=[];
const add=(id,control,method,expected,actual,pass,ev)=>{R.push({id,control,method,expected,actual,result:pass?'PASS':'FAIL',evidence:ev});console.log(id,pass?'PASS':'FAIL','-',actual);};
async function fresh(b){const c=await b.newContext({acceptDownloads:true});const p=await c.newPage();const ev={dialogs:[],csp:[],reqs:[],errors:[]};
 await p.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>console.error('CSP-VIOLATION '+e.violatedDirective+' '+e.blockedURI)));
 p.on('dialog',d=>{ev.dialogs.push(d.message());d.dismiss();});p.on('console',m=>{if(m.type()==='error'){ev.errors.push(m.text());if(/CSP-VIOLATION/.test(m.text()))ev.csp.push(m.text());}});
 c.on('request',r=>ev.reqs.push({m:r.method(),u:r.url(),t:r.resourceType()}));return {c,p,ev};}
async function merge(p){await p.click('#mergeBtn');await Promise.race([p.waitForSelector('#result a',{timeout:120000}),p.waitForFunction(()=>/failed/.test(document.getElementById('progressText').textContent),null,{timeout:120000})]);}
async function dl(p){const [d]=await Promise.all([p.waitForEvent('download'),p.click('#result a')]);const f=path.join(os.tmpdir(),'sec-'+Date.now()+'.pdf');await d.saveAs(f);return f;}
(async()=>{const b=await pw.chromium.launch();const origin=new URL(URL_).origin;
 // SEC-NET: full network capture during a merge
 let {c,p,ev}=await fresh(b);await p.goto(URL_,{waitUntil:'networkidle'});const loadReqs=ev.reqs.length;
 await p.setInputFiles('#fileInput',[FX+'/a.pdf',FX+'/b.pdf']);await p.waitForTimeout(1500);const before=ev.reqs.length;await merge(p);let f=await dl(p);
 const mergeReqs=ev.reqs.slice(before).filter(r=>!/^(blob|data):/.test(r.u));const ext=ev.reqs.filter(r=>!/^(blob|data):/.test(r.u)&&new URL(r.u).origin!==origin);
 const nonGet=ev.reqs.filter(r=>r.m!=='GET');
 fs.writeFileSync(OUT.replace('.json','-network.json'),JSON.stringify(ev.reqs,null,1));
 add('SEC-01','No outbound / upload during merge (network capture)','Record every request from page load through merge and download','Only same-origin GETs for static files at load; 0 requests during merge; 0 POST/PUT',`load requests=${loadReqs} (all same-origin GET); requests during add+merge+download (excl. blob:)=${mergeReqs.length}; external=${ext.length}; non-GET=${nonGet.length}`,mergeReqs.length===0&&ext.length===0&&nonGet.length===0,'network.json');
 const st=await p.evaluate(async()=>({cookie:document.cookie.length,ls:localStorage.length,ss:sessionStorage.length,idb:(await indexedDB.databases()).length,sw:(await navigator.serviceWorker.getRegistrations()).length}));
 add('SEC-02','No client storage / cookies','Inspect document.cookie, localStorage, sessionStorage, IndexedDB, service workers after a merge','All zero',JSON.stringify(st),Object.values(st).every(v=>v===0),'sec.json');
 const tele=ev.reqs.filter(r=>/google|analytics|gtag|segment|sentry|hotjar|clarity|facebook|doubleclick|telemetry|beacon/i.test(r.u));
 add('SEC-03','No telemetry / analytics','Scan captured requests for analytics/telemetry endpoints; sendBeacon/WebSocket usage checked in code review','0 telemetry requests',`telemetry requests=${tele.length}`,tele.length===0,'network.json');
 await c.close();
 // SEC-04: output encoding of file names + metadata
 ({c,p,ev}=await fresh(b));await p.goto(URL_,{waitUntil:'networkidle'});
 const xdir=fs.mkdtempSync(path.join(os.tmpdir(),'x-'));const nm=['<img src=x onerror=alert(1)>.pdf','"><svg onload=alert(2)>&amp;.pdf',"'-alert(3)-'<script>alert(4)<\\script>.pdf"];
 nm.forEach((n,i)=>fs.copyFileSync(FX+(i==1?'/meta-xss.pdf':'/a.pdf'),path.join(xdir,n.replace(/\//g,'_'))));
 await p.setInputFiles('#fileInput',fs.readdirSync(xdir).map(n=>path.join(xdir,n)));await p.waitForTimeout(2000);
 const shown=await p.$$eval('#fileList .name',x=>x.map(e=>e.textContent));const inj=await p.evaluate(()=>({img:document.querySelectorAll('#fileList img:not([src^="blob:"]):not([src^="data:"])').length,svg:document.querySelectorAll('#fileList svg[onload]').length,script:document.querySelectorAll('#fileList script').length,pwn:!!window.__PWN}));
 add('SEC-04','Output encoding: file names (ASVS V5.3.3, WSTG-CLNT-01)','Add 3 PDFs named with HTML/JS payloads; inspect DOM','Names shown as literal text; no element injected; no dialog',`shown=${JSON.stringify(shown)}; injected=${JSON.stringify(inj)}; dialogs=${ev.dialogs.length}`,shown.length===3&&shown.some(s=>s.includes('<img'))&&!inj.img&&!inj.svg&&!inj.script&&!inj.pwn&&ev.dialogs.length===0,'sec.json');
 await merge(p);f=await dl(p);const md=await PDFDocument.load(fs.readFileSync(f),{updateMetadata:false});const tt=md.getTitle()||'';
 const bodyHasMeta=await p.evaluate(()=>/onerror|alert\(1\)|svg onload=alert\(3\)/.test(document.body.innerText.replace(/<img src=x onerror=alert\(1\)>|"><svg onload=alert\(2\)>/g,'')));
 add('SEC-05','Output encoding: PDF metadata (Title/Author/Subject with HTML payloads)','Merge a PDF whose metadata holds <img onerror>, <script>, "><svg onload>; inspect page and output','Metadata never rendered as HTML; no script runs',`metadata text rendered on page=${bodyHasMeta}; dialogs=${ev.dialogs.length}; window.__PWN=${await p.evaluate(()=>!!window.__PWN)}; output Title="${tt}" (inert string in PDF)`,!bodyHasMeta&&ev.dialogs.length===0&&!(await p.evaluate(()=>!!window.__PWN)),'sec.json');
 await c.close();
 // SEC-06/07: CSP blocks inline + third-party script
 ({c,p,ev}=await fresh(b));await p.goto(URL_,{waitUntil:'networkidle'});
 const hdr=(await (await c.request.get(URL_)).headers())['content-security-policy']||'';const r1=await p.evaluate(async()=>{const s=document.createElement('script');s.textContent='window.__INLINE=1';document.body.appendChild(s);
   const t=document.createElement('script');t.src='https://cdn.jsdelivr.net/npm/jquery@3.7.1/dist/jquery.min.js';document.body.appendChild(t);
   const d=document.createElement('div');d.innerHTML='<img src=x onerror="window.__ATTR=1">';document.body.appendChild(d);
   let fe='blocked';try{await fetch('https://example.com/');fe='allowed'}catch(e){}
   await new Promise(r=>setTimeout(r,2500));return {inline:!!window.__INLINE,third:typeof window.jQuery!=='undefined',attr:!!window.__ATTR,fetch:fe};});
 await p.waitForTimeout(500);
 add('SEC-06','CSP blocks inline script, inline event handlers and eval (ASVS V14.4.3)','Inject <script> with inline code and an <img onerror> into the live DOM; check served CSP has no unsafe-inline/unsafe-eval (eval() cannot be tested from the harness because DevTools evaluation is exempt from CSP)','Neither executes; CSP violations reported; no unsafe-* in script-src',`inline ran=${r1.inline}; onerror ran=${r1.attr}; violations=${ev.csp.length}; unsafe-inline/eval in header=${/unsafe/.test(hdr)}`,!r1.inline&&!r1.attr&&ev.csp.length>=2&&!/unsafe/.test(hdr),'sec.json');
 add('SEC-07','CSP blocks third-party script and outbound fetch','Inject <script src=cdn.jsdelivr.net/...jquery> and fetch(https://example.com)','Script not loaded; fetch refused by connect-src',`jQuery loaded=${r1.third}; fetch=${r1.fetch}; CSP log: ${ev.csp.slice(0,5).join(' | ')}`,!r1.third&&r1.fetch==='blocked','sec.json');
 await c.close();
 // SEC-08: CVE-2024-4367 PoC + SEC-09 JS/Launch/embedded file
 ({c,p,ev}=await fresh(b));await p.goto(URL_,{waitUntil:'networkidle'});
 const ver=await p.evaluate(()=>window.pdfjsLib&&window.pdfjsLib.version);
 await p.setInputFiles('#fileInput',[FX+'/cve-2024-4367.pdf',FX+'/a.pdf']);await p.waitForTimeout(4000);
 const pwn=await p.evaluate(()=>!!window.__PWN);
 add('SEC-08','PDF.js arbitrary JS (CVE-2024-4367) not exploitable','Load public-style PoC PDF (FontMatrix injection, payload alert + window flag) so PDF.js renders its preview','Payload not executed; PDF.js ≥ 4.2.67',`PDF.js ${ver}; payload ran=${pwn}; dialogs=${ev.dialogs.length}`,!pwn&&ev.dialogs.length===0&&ver==='6.4.299','sec.json');
 await p.click('#clearBtn').catch(()=>{});await p.setInputFiles('#fileInput',[FX+'/js-embed-launch.pdf',FX+'/a.pdf']);await p.waitForTimeout(2500);await merge(p);f=await dl(p);
 const raw=fs.readFileSync(f,'latin1');const od=await PDFDocument.load(fs.readFileSync(f));const cat=od.catalog;
 const has={js:/\/JavaScript|\/JS\s*[\(<]/.test(raw),launch:/\/Launch/.test(raw),embedded:/\/EmbeddedFile|payload\.exe/.test(raw),openAction:!!cat.get(PDFName.of('OpenAction')),names:!!cat.get(PDFName.of('Names'))};
 add('SEC-09','PDF document JavaScript, /Launch action and embedded file not carried to output','Merge a PDF with document-level JS, OpenAction /Launch cmd.exe and an embedded file; inspect output bytes','No JS executed in browser; output has no /JavaScript, /Launch or /EmbeddedFile',`dialogs=${ev.dialogs.length}; output contains: ${JSON.stringify(has)}`,ev.dialogs.length===0&&!has.js&&!has.launch&&!has.embedded&&!has.openAction,'sec.json');
 await c.close();
 // SEC-10: framing protection (cross-origin iframe)
 if(FRAMER){({c,p,ev}=await fresh(b));await p.goto(FRAMER,{waitUntil:'load'});await p.waitForTimeout(2000);
  const fr=p.frames().find(x=>x!==p.mainFrame());let loaded=false;try{loaded=await fr.evaluate(()=>!!document.getElementById('mergeBtn'))}catch(e){}
  add('SEC-10','Clickjacking: framing refused (X-Frame-Options SAMEORIGIN + frame-ancestors \'self\')','Embed the app in an <iframe> on a different origin ('+new URL(FRAMER).origin+')','Browser refuses to render the app inside the frame',`frame url=${fr&&fr.url()}; app rendered in frame=${loaded}`,!loaded,'sec.json');await c.close();}
 await b.close();fs.writeFileSync(OUT,JSON.stringify({url:URL_,date:new Date().toISOString(),results:R},null,1));})();
