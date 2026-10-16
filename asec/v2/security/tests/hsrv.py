import http.server,functools
H={"Content-Security-Policy":"default-src 'self'; script-src 'self'; style-src 'self'; img-src 'self' data: blob:; worker-src 'self' blob:; connect-src 'self' blob: data:; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'","X-Content-Type-Options":"nosniff","X-Frame-Options":"SAMEORIGIN","Referrer-Policy":"no-referrer","Permissions-Policy":"camera=(), microphone=(), geolocation=(), payment=()","Cross-Origin-Opener-Policy":"same-origin"}
class R(http.server.SimpleHTTPRequestHandler):
    extensions_map={**http.server.SimpleHTTPRequestHandler.extensions_map,'.mjs':'text/javascript'}
    def end_headers(self):
        [self.send_header(k,v) for k,v in H.items()];super().end_headers()
http.server.ThreadingHTTPServer(('',int(__import__('os').environ.get('PORT','8811'))),functools.partial(R,directory=__import__('os').environ.get('SITE_ROOT','.'))).serve_forever()
