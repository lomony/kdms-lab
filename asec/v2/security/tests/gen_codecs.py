# Generates synthetic PDFs with a CCITT G4 (fax) image and a JPEG2000 (JPX) image. Usage: python3 gen_codecs.py OUTDIR
import sys,io,os
from PIL import Image,ImageDraw
out=sys.argv[1] if len(sys.argv)>1 else '.';os.makedirs(out,exist_ok=True)
def pdf(path,w,h,imgdict,data):
    objs=[b"<< /Type /Catalog /Pages 2 0 R >>",b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
     f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 {w} {h}] /Resources << /XObject << /Im0 5 0 R >> >> /Contents 4 0 R >>".encode()]
    cs=f"q {w} 0 0 {h} 0 0 cm /Im0 Do Q".encode()
    objs.append(b"<< /Length %d >>\nstream\n"%len(cs)+cs+b"\nendstream")
    objs.append(imgdict.encode()+b" /Length %d >>\nstream\n"%len(data)+data+b"\nendstream")
    b=io.BytesIO();b.write(b"%PDF-1.7\n%\xe2\xe3\xcf\xd3\n");off=[]
    for i,o in enumerate(objs):off.append(b.tell());b.write(b"%d 0 obj\n"%(i+1)+o+b"\nendobj\n")
    x=b.tell();b.write(b"xref\n0 %d\n0000000000 65535 f \n"%(len(objs)+1))
    for o in off:b.write(b"%010d 00000 n \n"%o)
    b.write(b"trailer\n<< /Size %d /Root 1 0 R >>\nstartxref\n%d\n%%%%EOF\n"%(len(objs)+1,x));open(path,'wb').write(b.getvalue())
W,H=400,300
im=Image.new('1',(W,H),1);d=ImageDraw.Draw(im);d.rectangle([20,20,380,280],outline=0,width=6);d.text((60,140),'SYNTHETIC CCITT G4 TEST',fill=0);d.line([20,20,380,280],fill=0,width=4)
t=io.BytesIO();im.save(t,'TIFF',compression='group4');t.seek(0);ti=Image.open(t)
offs=ti.tag_v2[273];cnts=ti.tag_v2[279];raw=t.getvalue();g4=b''.join(raw[o:o+c] for o,c in zip(offs,cnts))
pdf(out+'/ccitt-g4.pdf',W,H,f"<< /Type /XObject /Subtype /Image /Width {W} /Height {H} /BitsPerComponent 1 /ColorSpace /DeviceGray /Filter /CCITTFaxDecode /DecodeParms << /K -1 /Columns {W} /Rows {H} /BlackIs1 false >>",g4)
im=Image.new('RGB',(W,H),(240,120,20));d=ImageDraw.Draw(im);d.ellipse([60,40,340,260],fill=(30,90,200));d.text((120,140),'SYNTHETIC JPEG2000',fill=(255,255,0))
j=io.BytesIO();im.save(j,'JPEG2000');pdf(out+'/jpx.pdf',W,H,f"<< /Type /XObject /Subtype /Image /Width {W} /Height {H} /BitsPerComponent 8 /ColorSpace /DeviceRGB /Filter /JPXDecode",j.getvalue())
print('ok')
