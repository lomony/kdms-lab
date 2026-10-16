const F=(process.env.FX||'/tmp/fx')+'/';const fs=require('fs');const U=process.argv[2];const which=process.argv[3];
const uat=fs.readdirSync(F+'uat30').sort().map(f=>F+'uat30/'+f), big=fs.readdirSync(F+'big').sort().map(f=>F+'big/'+f);
const edge=[['password-protected (AES-256, user pw)',[F+'base.pdf',F+'protected.pdf']],['owner-password only encryption (RC4)',[F+'base.pdf',F+'owner-only-encrypted.pdf']],['corrupted PDF',[F+'base.pdf',F+'corrupt.pdf']],['non-PDF renamed .pdf',[F+'base.pdf',F+'notpdf.pdf']],['0-byte file',[F+'base.pdf',F+'empty.pdf']],['Thai/Unicode filenames',[F+'เอกสารภาษาไทย_รายงาน ๒๕๖๙.pdf',F+'文件_ünïcødé.pdf',F+'base.pdf']],['JavaScript actions + AcroForm',[F+'jsform.pdf',F+'base.pdf']],['large: 10 files / 500 pages / 91.7 MiB',big,{to:600000,thumbWait:8000}],['page limit: 503 pages (big + base)',[...big,F+'base.pdf'],{to:600000,thumbWait:8000}],['over limit: 116 MB (all big + uat30)',[...big,...uat.slice(0,15)],{}]];
const B=[['chromium',null],['firefox',null],['webkit',null],['chromium','Pixel 7'],['webkit','iPhone 14']];
let c=[];
if(which==='edge')for(const [n,f,o] of edge)c.push({name:n,bt:process.env.BT||'chromium',url:U,files:f,...(o||{})});
if(which==='xb'){for(const [bt,dev] of B)c.push({name:'UAT-like: 30 files / 69 pages / 33.7 MiB',bt,dev,url:U,files:uat,to:300000,thumbWait:6000});
 if(fs.existsSync('/opt/microsoft/msedge/msedge'))c.push({name:'UAT-like: 30 files / 69 pages / 33.7 MiB',bt:'chromium',url:U,files:uat,to:300000,thumbWait:6000,launch:{channel:'msedge'}});}
if(which==='quick')for(const [bt,dev] of B)c.push({name:'live smoke: 3 files',bt,dev,url:U,files:[F+'base.pdf',F+'เอกสารภาษาไทย_รายงาน ๒๕๖๙.pdf',F+'jsform.pdf']});
console.log(JSON.stringify(c));
