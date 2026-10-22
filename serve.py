# Dev server for Abyss. Two things plain `python3 -m http.server` gets wrong here:
#   1. It caches. Across eight script tags that means the browser runs a mix of
#      old and new files -- the "baffling bugs" docs/code.md warns about. A human
#      hits Cmd+Shift+R; Claude cannot, so the server forbids caching instead.
#   2. It is single-threaded, so a browser holding a keep-alive connection blocks
#      every other request, including the curl you are using to check on it.
import http.server, socketserver, sys

class NoCache(http.server.SimpleHTTPRequestHandler):
    protocol_version = 'HTTP/1.0'          # no keep-alive, so nothing hogs a worker
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, must-revalidate')
        self.send_header('Pragma', 'no-cache')
        super().end_headers()
    def log_message(self, *a):
        pass

class Threaded(socketserver.ThreadingMixIn, http.server.HTTPServer):
    daemon_threads = True
    allow_reuse_address = True

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8222
Threaded(('127.0.0.1', port), NoCache).serve_forever()
