// CCITT G4 / JPEG2000 preview check (v2.1.2 wasm fallbacks). Usage: node codecs.js URL FIXDIR [OUT]
const pw=require('playwright');const fs=require('fs');const [,,URL_,FX,OUT]=process.argv;
(async()=>{const res=[];for(const bt of ['chromium','firefox','webkit']){const b=await pw[bt].launch();const p=await b.newPage();const ev={csp:[],err:[],reqs:[]};
 await p.addInitScript(()=>document.addEventListener('securitypolicyviolation',e=>console.error('CSP-VIOLATION '+e.violatedDirective+' '+e.blockedURI)));
 p.on('console',m=>{if(m.type()==='error'||m.type()==='warning'){ev.err.push(m.text());if(/CSP-VIOLATION/.test(m.text()))ev.csp.push(m.text());}});
 p.on('request',r=>ev.reqs.push(r.url()));
 await p.goto(URL_,{waitUntil:'networkidle'});
 for(const f of ['ccitt-g4.pdf','jpx.pdf']){
  await p.click('#clearBtn').catch(()=>{});const c0=ev.csp.length;
  await p.setInputFiles('#fileInput',[FX+'/'+f]);
  await p.waitForFunction(()=>{const t=document.querySelector('#fileList li .thumb, #fileList li');return t&&(t.querySelector('img')||/Preview not available/.test(t.textContent));},null,{timeout:20000}).catch(()=>{});
  await p.waitForTimeout(800);
  const r=await p.evaluate(async()=>{const li=document.querySelector('#fileList li');const img=li&&li.querySelector('img');if(!img)return {img:false,txt:li?li.textContent:''};
   await img.decode().catch(()=>{});const c=document.createElement('canvas');c.width=img.naturalWidth;c.height=img.naturalHeight;const x=c.getContext('2d');x.drawImage(img,0,0);
   const d=x.getImageData(0,0,c.width,c.height).data;let dark=0,col=0;for(let i=0;i<d.length;i+=4){if(d[i]+d[i+1]+d[i+2]<300)dark++;if(Math.abs(d[i]-d[i+2])>80)col++;}return {img:true,w:c.width,h:c.height,darkPx:dark,colouredPx:col};});
  const wasmReq=ev.reqs.filter(u=>/vendor\/wasm\//.test(u)).map(u=>u.split('/').pop());
  const ok=r.img&&(f.startsWith('ccitt')?r.darkPx>500:r.colouredPx>1000)&&ev.csp.length===c0;
  const row={browser:bt+' '+b.version(),file:f,preview:r,cspViolations:ev.csp.length-c0,wasmFilesFetched:[...new Set(wasmReq)],result:ok?'PASS':'FAIL'};res.push(row);console.log(JSON.stringify(row));}
 row2={browser:bt,consoleErrorsAndWarnings:ev.err.filter(e=>!/DevTools/.test(e)).slice(0,5)};console.log(JSON.stringify(row2));res.push(row2);
 await b.close();}
 if(OUT)fs.writeFileSync(OUT,JSON.stringify(res,null,1));})();
