const pw=require('playwright');(async()=>{const b=await pw.chromium.launch();const p=await b.newPage();await p.goto(process.argv[2]);
await p.setInputFiles('#fileInput',['/tmp/fx/d1/same.pdf']);await p.waitForTimeout(500);await p.setInputFiles('#fileInput',['/tmp/fx/d2/same.pdf']);await p.waitForTimeout(500);
const a=await p.$$eval('#fileList li',x=>x.length);await p.setInputFiles('#fileInput',['/tmp/fx/d1/same.pdf']);await p.waitForTimeout(500);
console.log('same name+size, different content ->',a,'cards; re-adding identical file ->',await p.$$eval('#fileList li',x=>x.length),'cards; notice:',await p.$eval('#limits',e=>e.textContent));
const f=await b.newPage();const errs=[];f.on('console',m=>m.type()==='error'&&errs.push(m.text()));await f.goto('file:///workspace/kdms-lab/asec/index.html');await f.waitForTimeout(1500);
console.log('file:// pdfjs loaded:',await f.evaluate(()=>typeof window.pdfjsLib),'errors:',errs.join(' | ').slice(0,300));await b.close();})();
