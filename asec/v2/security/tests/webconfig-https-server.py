import http.server,ssl,functools,xml.etree.ElementTree as ET
t=ET.parse('/workspace/kdms-lab/asec/v2/web.config');H=[(a.get('name'),a.get('value')) for a in t.iter('add') if a.get('name')]
M={m.get('fileExtension'):m.get('mimeType') for m in t.iter('mimeMap')}
class R(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,**M}
    def end_headers(self):
        [self.send_header(k,v) for k,v in H];super().end_headers()
    def log_message(self,*a):pass
s=http.server.ThreadingHTTPServer(('',8843),functools.partial(R,directory='/workspace/kdms-lab'))
c=ssl.SSLContext(ssl.PROTOCOL_TLS_SERVER);c.load_cert_chain('c.pem','k.pem');s.socket=c.wrap_socket(s.socket,server_side=True);s.serve_forever()
