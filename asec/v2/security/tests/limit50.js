const pw=require('playwright');const fs=require('fs');(async()=>{const b=await pw.chromium.launch();const p=await b.newPage();await p.goto(process.argv[2],{waitUntil:'networkidle'});
const fs_=fs.readdirSync(process.argv[3]).map(f=>process.argv[3]+'/'+f);await p.setInputFiles('#fileInput',fs_);await p.waitForTimeout(4000);
const n=await p.$$eval('#fileList li',x=>x.length);const msg=await p.textContent('#limits');const ok=n===50&&/first 50/.test(msg);
console.log(`LIM-50 ${ok?'PASS':'FAIL'} - selected=${fs_.length}; rows=${n}; notice="${msg.trim()}"`);await b.close();})();
