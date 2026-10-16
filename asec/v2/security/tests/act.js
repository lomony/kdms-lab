const pw=require('playwright');const {PDFDocument,PDFName,PDFDict,PDFArray}=require('pdf-lib');const fs=require('fs');
function inv(f){return PDFDocument.load(fs.readFileSync(f)).then(d=>d.getPages().map(p=>{const a=p.node.lookup(PDFName.of('Annots'));const r=[];if(a instanceof PDFArray)for(let i=0;i<a.size();i++){const x=a.lookup(i);const A=x.lookup(PDFName.of('A'));const par=x.lookup(PDFName.of('Parent'));r.push(String(x.get(PDFName.of('Subtype')))+':'+(A?String(A.get(PDFName.of('S')))+(A.get(PDFName.of('Next'))?'+Next':''):'none')+(x.get(PDFName.of('AA'))||(par&&par.get(PDFName.of('AA')))?'+AA':''));}return r;}));}
(async()=>{const url=process.argv[2];console.log('input :',JSON.stringify(await inv(''+(process.env.FX||'/tmp/fx')+'/actions.pdf')));
const b=await pw.chromium.launch();const p=await b.newPage({acceptDownloads:true});const dl=[];p.on('dialog',d=>{dl.push(d.message());d.accept()});
await p.goto(url);await p.setInputFiles('#fileInput',[''+(process.env.FX||'/tmp/fx')+'/actions.pdf']);await p.waitForTimeout(1500);await p.click('#mergeBtn');await p.waitForSelector('#result a');
const [d]=await Promise.all([p.waitForEvent('download'),p.click('#result a')]);await d.saveAs(''+require('os').tmpdir()+'/act-out.pdf');console.log('output:',JSON.stringify(await inv('/tmp/pwt/act-out.pdf')),'dialogs',dl);
// duplicates
await p.goto(url);await p.setInputFiles('#fileInput',[''+(process.env.FX||'/tmp/fx')+'/base.pdf']);await p.waitForTimeout(400);await p.setInputFiles('#fileInput',[''+(process.env.FX||'/tmp/fx')+'/base.pdf']);await p.waitForTimeout(800);
console.log('dup: cards',await p.$$eval('#fileList li',x=>x.length),'tags',await p.$$eval('.tag-duplicate',x=>x.map(e=>e.textContent)),'|',await p.$eval('#limits',e=>e.textContent));
await p.click('.is-duplicate [data-act=remove]');console.log('after remove cards',await p.$$eval('#fileList li',x=>x.length));
console.log('banner on localhost:',await p.$('.demo-banner')!==null);await b.close();})();
