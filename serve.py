import http.server
import socketserver
import os
import sys
import mimetypes
import urllib.parse
import hashlib
import re

PORT = 3001
DIRECTORY = os.path.dirname(os.path.abspath(__file__))

mimetypes.add_type("application/javascript", ".js")
mimetypes.add_type("application/javascript", ".mjs")
mimetypes.add_type("application/wasm", ".wasm")
mimetypes.add_type("font/woff2", ".woff2")
mimetypes.add_type("font/woff", ".woff")
mimetypes.add_type("font/otf", ".otf")
mimetypes.add_type("image/webp", ".webp")
mimetypes.add_type("image/avif", ".avif")
mimetypes.add_type("image/svg+xml", ".svg")
mimetypes.add_type("video/mp4", ".mp4")
mimetypes.add_type("video/webm", ".webm")

def resolve_file(req_path):
    unquoted = urllib.parse.unquote(req_path)
    parts = unquoted.split('?', 1)
    path = parts[0].replace('\\(', '(').replace('\\)', ')').lstrip('/')
    if path == "api":
        path = "api-docs"
    elif path.startswith("api/"):
        path = "api-docs/" + path[4:]
    query = parts[1] if len(parts) > 1 else ""

    target = os.path.join(DIRECTORY, path)
    if os.path.isfile(target):
        return target

    if query:
        q_hash = hashlib.md5(query.encode('utf-8')).hexdigest()[:8]
        base_p, ext_p = os.path.splitext(path)
        hashed = os.path.join(DIRECTORY, f"{base_p}_{q_hash}{ext_p}")
        if os.path.isfile(hashed):
            return hashed

    if os.path.isdir(target):
        idx = os.path.join(target, "index.html")
        if os.path.isfile(idx):
            return idx

    if os.path.isfile(target + ".html"):
        return target + ".html"
    if os.path.isfile(os.path.join(target, "index.html")):
        return os.path.join(target, "index.html")

    return None

class CloneHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_HEAD(self):
        resolved = resolve_file(self.path)
        if resolved and os.path.isfile(resolved):
            self.send_response(200)
            ctype, _ = mimetypes.guess_type(resolved)
            self.send_header("Content-Type", ctype or "application/octet-stream")
            self.send_header("Content-Length", str(os.path.getsize(resolved)))
            self.send_header("Access-Control-Allow-Origin", "*")
            self.send_header("Accept-Ranges", "bytes")
            self.end_headers()
        else:
            super().do_HEAD()

    def do_GET(self):
        resolved = resolve_file(self.path)
        if not resolved or not os.path.isfile(resolved):
            return super().do_GET()

        ctype, _ = mimetypes.guess_type(resolved)
        ctype = ctype or "application/octet-stream"
        file_size = os.path.getsize(resolved)

        range_header = self.headers.get('Range')
        if range_header and 'bytes=' in range_header:
            range_match = re.search(r'bytes=(\d+)-(\d*)', range_header)
            if range_match:
                start = int(range_match.group(1))
                end = int(range_match.group(2)) if range_match.group(2) else file_size - 1
                end = min(end, file_size - 1)
                length = end - start + 1
                self.send_response(206)
                self.send_header("Content-Type", ctype)
                self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
                self.send_header("Content-Length", str(length))
                self.send_header("Access-Control-Allow-Origin", "*")
                self.send_header("Accept-Ranges", "bytes")
                self.end_headers()
                with open(resolved, 'rb') as f:
                    f.seek(start)
                    self.wfile.write(f.read(length))
                return

        self.send_response(200)
        self.send_header("Content-Type", ctype)
        self.send_header("Content-Length", str(file_size))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Cache-Control", "no-cache, no-store, must-revalidate")
        self.end_headers()
        with open(resolved, 'rb') as f:
            self.wfile.write(f.read())

if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else PORT
    socketserver.TCPServer.allow_reuse_address = True
    with socketserver.TCPServer(("", port), CloneHandler) as httpd:
        print(f"🚀 DreamTeam Clone live at: http://localhost:{port}")
        print("Press Ctrl+C to stop.")
        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\nServer stopped.")
