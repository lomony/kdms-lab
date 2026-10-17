# Synthetic attack fixtures for sec.js: metadata XSS, JS + /Launch + embedded file, CVE-2024-4367-style FontMatrix PoC. Usage: python3 gen_secfx.py OUTDIR
import sys,os,shutil
from reportlab.pdfgen import canvas
from pypdf import PdfWriter
from pypdf.generic import NameObject,DictionaryObject,TextStringObject
out=sys.argv[1] if len(sys.argv)>1 else '.';os.makedirs(out,exist_ok=True);os.chdir(out)
for n,w in [('a',300),('b',310)]:
    c=canvas.Canvas(n+'.pdf',pagesize=(w,400));c.drawString(20,200,'synthetic '+n);c.save()
w=PdfWriter(clone_from='a.pdf');w.add_metadata({'/Title':'<img src=x onerror="window.__PWN=1;alert(1)"><script>alert(2)</script>','/Author':'"><svg onload=alert(3)>','/Subject':"';alert(4)//"});w.write('meta-xss.pdf')
w=PdfWriter(clone_from='b.pdf');w.add_js("app.alert('JS');");w.add_attachment('payload.exe',b'MZ synthetic not a real exe')
w._root_object[NameObject('/OpenAction')]=DictionaryObject({NameObject('/S'):NameObject('/Launch'),NameObject('/F'):TextStringObject('cmd.exe')});w.write('js-embed-launch.pdf')
import subprocess;subprocess.run([sys.executable,os.path.join(os.path.dirname(os.path.abspath(__file__)),'cve_poc.py'),"window.__PWN=1;alert('CVE-2024-4367')"],check=True,stdout=subprocess.DEVNULL);os.replace('poc.pdf','cve-2024-4367.pdf')
