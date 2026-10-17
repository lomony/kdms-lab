# Extra UAT fixtures (synthetic): XSS file names, reorder set, decompression bomb.
import zlib,shutil,os
from reportlab.pdfgen import canvas
c=canvas.Canvas('base.pdf',pagesize=(350,600));c.drawString(30,300,'BASE');c.showPage();c.save()
shutil.copy('base.pdf','<img src=x onerror=alert(1)>.pdf'); shutil.copy('base.pdf','"><svg onload=alert(2)>&amp;.pdf'); os.remove('base.pdf')
for i,w in enumerate([310,320,330]):
    c=canvas.Canvas(f'r{i+1}.pdf',pagesize=(w,600));c.drawString(30,300,f'R{i+1}');c.showPage();c.save()
raw=b' '*(400*1024*1024); comp=zlib.compress(raw,9)
objs=[b'<< /Type /Catalog /Pages 2 0 R >>',b'<< /Type /Pages /Kids [3 0 R] /Count 1 >>',b'<< /Type /Page /Parent 2 0 R /MediaBox [0 0 345 600] /Contents 4 0 R >>',b'<< /Length %d /Filter /FlateDecode >>\nstream\n'%len(comp)+comp+b'\nendstream']
out=b'%PDF-1.7\n';offs=[]
for n,o in enumerate(objs,1): offs.append(len(out)); out+=b'%d 0 obj\n'%n+o+b'\nendobj\n'
x=len(out); out+=b'xref\n0 %d\n0000000000 65535 f \n'%(len(objs)+1)+b''.join(b'%010d 00000 n \n'%o for o in offs)+b'trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n'%(len(objs)+1,x)
open('bomb-400MB-inflated.pdf','wb').write(out)
