from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
import sys

class FastHandler(SimpleHTTPRequestHandler):
    def log_message(self, *a, **k): pass
    def end_headers(self):
        self.send_header('Cache-Control', 'public, max-age=3600')
        super().end_headers()

if __name__ == '__main__':
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    srv = ThreadingHTTPServer(('127.0.0.1', port), FastHandler)
    srv.daemon_threads = True
    print(f'Serving on http://127.0.0.1:{port}/')
    srv.serve_forever()
