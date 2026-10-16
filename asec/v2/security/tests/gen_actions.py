from reportlab.pdfgen import canvas
from pypdf import PdfWriter
from pypdf.generic import DictionaryObject as D, NameObject as N, TextStringObject as T, ArrayObject as A, FloatObject as F, NumberObject
c=canvas.Canvas('actions.pdf',pagesize=(380,600)); c.drawString(30,500,'ACTIONS p1'); c.showPage(); c.drawString(30,500,'ACTIONS p2'); c.showPage(); c.save()
w=PdfWriter(clone_from='actions.pdf')
def link(i,act,y):
    an=D({N('/Type'):N('/Annot'),N('/Subtype'):N('/Link'),N('/Rect'):A([F(30),F(y),F(200),F(y+15)]),N('/A'):act}); w.add_annotation(0,an)
js=lambda s:D({N('/S'):N('/JavaScript'),N('/JS'):T(s)})
link(0,D({N('/S'):N('/URI'),N('/URI'):T('https://evil.example/x')}),100)
link(0,D({N('/S'):N('/GoToR'),N('/F'):T('other.pdf'),N('/D'):A([NumberObject(0),N('/Fit')])}),130)
link(0,D({N('/S'):N('/Launch'),N('/F'):T('calc.exe')}),160)
p2=w.pages[1].indirect_reference
link(0,D({N('/S'):N('/GoTo'),N('/D'):A([p2,N('/Fit')]),N('/Next'):js("app.alert('NESTED')")}),190)
link(0,D({N('/S'):N('/GoTo'),N('/D'):A([p2,N('/Fit')])}),220)  # safe internal link: must be kept
field=w._add_object(D({N('/FT'):N('/Tx'),N('/T'):T('f'),N('/AA'):D({N('/K'):js("app.alert('FIELD')")})}))
wid=D({N('/Type'):N('/Annot'),N('/Subtype'):N('/Widget'),N('/Rect'):A([F(30),F(300),F(200),F(320)]),N('/Parent'):field})
w.add_annotation(0,wid)
w.write('actions.pdf')
