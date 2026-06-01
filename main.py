"""本地启动脚本：运行后浏览器打开 http://127.0.0.1:8000

用法：
    python main.py

说明：
    本项目是 H5 互动游戏新闻，Python 只负责启动本地静态服务器，
    游戏逻辑在 index.html / styles.css / game.js 中。
"""

from __future__ import annotations

import os
import socket
import webbrowser
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path


def find_free_port(start: int = 8000, end: int = 8100) -> int:
    for port in range(start, end + 1):
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
            sock.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
            try:
                sock.bind(("127.0.0.1", port))
            except OSError:
                continue
            return port
    raise RuntimeError("没有找到可用端口，请关闭占用 8000-8100 的程序后重试。")


class NoCacheHandler(SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


def main() -> None:
    root = Path(__file__).resolve().parent
    os.chdir(root)
    port = find_free_port()
    server = ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler)
    url = f"http://127.0.0.1:{port}"
    print(f"项目目录：{root}")
    print(f"本地地址：{url}")
    print("按 Ctrl+C 停止服务器。")
    webbrowser.open(url)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n服务器已停止。")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
