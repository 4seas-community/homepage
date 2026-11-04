#!/usr/bin/env python3
"""Local static preview using the same public 404 document as production."""
import argparse
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit


class PreviewHandler(SimpleHTTPRequestHandler):
    public = {"index.html", "404.html", "favicon.ico", "css", "images", "js", "longevity", "coliving-community"}

    def send_head(self):
        parts = [part for part in unquote(urlsplit(self.path).path).split("/") if part]
        if any(part in (".", "..") or part.startswith(".") for part in parts) or (parts and parts[0] not in self.public):
            self.send_error(404)
            return None
        return super().send_head()

    def list_directory(self, path):
        self.send_error(404)
        return None

    def send_error(self, code, message=None, explain=None):
        if code != 404:
            return super().send_error(code, message, explain)
        document = Path(self.directory, "404.html").read_bytes()
        self.send_response(404)
        self.send_header("Content-Type", "text/html; charset=utf-8")
        self.send_header("Content-Length", str(len(document)))
        self.end_headers()
        if self.command != "HEAD":
            self.wfile.write(document)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--port", type=int, default=4200)
    parser.add_argument("--directory", type=Path, default=Path(__file__).resolve().parent.parent)
    args = parser.parse_args()
    root = args.directory.resolve()
    if not (root / "404.html").is_file():
        parser.error("The preview directory must contain the generated 404.html")
    handler = lambda *a, **kw: PreviewHandler(*a, directory=str(root), **kw)
    with ThreadingHTTPServer(("127.0.0.1", args.port), handler) as server:
        print(f"Preview: http://127.0.0.1:{server.server_port}", flush=True)
        try:
            server.serve_forever()
        except KeyboardInterrupt:
            pass
