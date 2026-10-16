const pw=require('playwright');const {PDFDocument,PDFName,PDFDict,PDFArray}=require('pdf-lib');const fs=require('fs');const path=require('path');
const FX=process.env.FX||'/tmp/fx';
async function widthsOf(f){const d=await PDFDocument.load(fs.readFileSync(f),{ignoreEncryption:true});return d.getPages().map(p=>Math.round(p.getWidth()));}
function scripts(d){let n=0;const c=d.catalog;if(c.get(PDFName.of('OpenAction')))n++;const names=c.lookup(PDFName.of('Names'));if(names instanceof PDFDict&&names.get(PDFName.of('JavaScript')))n++;
 for(const p of d.getPages()){if(p.node.get(PDFName.of('AA')))n++;const a=p.node.lookup(PDFName.of('Annots'));if(a instanceof PDFArray)for(let i=0;i<a.size();i++){const x=a.lookup(i);if(!(x instanceof PDFDict))continue;if(x.get(PDFName.of('AA')))n++;const A=x.lookup(PDFName.of('A'));if(A instanceof PDFDict&&String(A.get(PDFName.of('S')))==='/JavaScript')n++;}}return n;}
async function run(o){const {bt,dev,url,files,name}=o;const br=await pw[bt].launch(o.launch||{});const ctx=await br.newContext({acceptDownloads:true,...(dev?pw.devices[dev]:{})});const pg=await ctx.newPage();
 const host=new URL(url).host;const ext=[],errs=[],dialogs=[];
 await pg.addInitScript(()=>{document.addEventListener('securitypolicyviolation',e=>console.error('CSP-VIOLATION '+e.violatedDirective+' '+e.blockedURI));});
 pg.on('request',r=>{const u=new URL(r.url());if(!['blob:','data:'].includes(u.protocol)&&u.host!==host)ext.push(r.url());});
 pg.on('console',m=>{if(m.type()==='error')errs.push(m.text().slice(0,200));});pg.on('pageerror',e=>errs.push('pageerror: '+e.message));
 pg.on('dialog',d=>{dialogs.push(d.message());d.accept();});
 await pg.goto(url,{waitUntil:'networkidle'});const ver=await pg.evaluate(()=>window.pdfjsLib&&pdfjsLib.version);const ua=await pg.evaluate(()=>navigator.userAgent);
 await pg.setInputFiles('#fileInput',files);await pg.waitForTimeout(o.thumbWait||2500);
 const thumbs=await pg.$$eval('#fileList img',x=>x.length);const preview=await pg.$$eval('.thumb .tag',x=>x.length);
 const disabled=await pg.$eval('#mergeBtn',b=>b.disabled);const limits=await pg.$eval('#limits',e=>e.textContent);
 let r={name,browser:bt+' '+br.version(),dev:dev||'desktop',ua,pdfjs:ver,files:files.length,thumbs,previewUnavailable:preview};
 if(disabled){r.result='merge button disabled';r.limits=limits;}else{
 let peak=0,poll=null;if(bt==='chromium'&&!o.launch){const cdp=await ctx.newCDPSession(pg);await cdp.send('Performance.enable');poll=setInterval(async()=>{try{const rss=+require('child_process').execSync("ps -eo rss,args | awk '/ms-playwright/ && !/awk/ {s+=$1} END{print s}'").toString();if(rss>(r.peakBrowserRSSMB||0)*1024)r.peakBrowserRSSMB=Math.round(rss/1024);const m=(await cdp.send('Performance.getMetrics')).metrics.find(x=>x.name==='JSHeapUsedSize');if(m&&m.value>peak)peak=m.value;}catch(e){}},300);}
 const t0=Date.now();await pg.click('#mergeBtn');
 await Promise.race([pg.waitForSelector('#result a',{timeout:o.to||120000}),pg.waitForFunction(()=>/failed/.test(document.getElementById('progressText').textContent),null,{timeout:o.to||120000})]).catch(e=>r.timeout=true);
 r.ms=Date.now()-t0;if(poll){clearInterval(poll);r.peakJSHeapMB=Math.round(peak/1048576);}r.status=await pg.$eval('#progressText',e=>e.textContent);
 if(await pg.$('#result a')){const [dl]=await Promise.all([pg.waitForEvent('download'),pg.click('#result a')]);const out=`${require('os').tmpdir()}/out-${Date.now()}.pdf`;await dl.saveAs(out);
  const got=await widthsOf(out);let exp=[];for(const f of files)exp=exp.concat(await widthsOf(f));r.pages=got.length;r.orderOK=JSON.stringify(got)===JSON.stringify(exp);
  r.scriptsInOutput=scripts(await PDFDocument.load(fs.readFileSync(out)));r.outMB=+(fs.statSync(out).size/1048576).toFixed(1);fs.unlinkSync(out);}
 }
 r.dialogs=dialogs;r.ext=ext;r.consoleErrors=errs.filter(e=>!/Thumbnail failed/.test(e));r.csp=errs.filter(e=>/CSP|Content.Security/i.test(e)).length;
 await br.close();return r;}
module.exports={run,FX};
if(require.main===module){(async()=>{const cases=JSON.parse(process.argv[2]);const out=[];for(const c of cases){try{out.push(await run(c));}catch(e){out.push({name:c.name,bt:c.bt,crash:String(e).slice(0,300)});}console.error(JSON.stringify(out.at(-1)));}fs.writeFileSync(process.argv[3],JSON.stringify(out,null,1));})();}
