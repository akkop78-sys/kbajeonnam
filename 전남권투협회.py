"""사단법인 한국권투협회 전남지회 — 로컬 미리보기 + 중앙회 자료 자동 동기화."""

import http.server
import socketserver
import threading
import time
import webbrowser
from pathlib import Path

HOST = "127.0.0.1"
PORT = 8080
ROOT = Path(__file__).resolve().parent / "website"
SYNC_INTERVAL_SEC = 30 * 60  # 30분마다 중앙회 재수집


class QuietHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(ROOT), **kwargs)

    def end_headers(self):
        # HTML·JS·CSS·JSON은 개발 중 항상 최신 파일 제공
        path = self.path.split("?", 1)[0].lower()
        if path.endswith((".html", ".htm", ".js", ".css", ".json")) or path in ("", "/"):
            self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
            self.send_header("Pragma", "no-cache")
        super().end_headers()

    def log_message(self, format, *args):
        print("[{0}] {1}".format(self.log_date_time_string(), args[0]))


def sync_kba(quiet=False):
    try:
        import sys

        root = Path(__file__).resolve().parent
        if str(root) not in sys.path:
            sys.path.insert(0, str(root))
        from tools.sync_kba import sync

        data = sync()
        if not quiet:
            print("중앙회(KBA) 자료 갱신 완료:", data.get("updated_at"))
            for key in ("notices", "schedule", "results", "protest"):
                print(" - {0}: {1}건".format(key, len(data.get(key) or [])))
            if data.get("errors"):
                for err in data["errors"]:
                    print(" !", err)
        return True
    except Exception as exc:
        print("중앙회 동기화 실패:", exc)
        return False


def start_sync_loop():
    def worker():
        while True:
            time.sleep(SYNC_INTERVAL_SEC)
            sync_kba(quiet=True)

    t = threading.Thread(target=worker, daemon=True)
    t.start()


def main():
    if not ROOT.is_dir():
        raise SystemExit("website 폴더가 없습니다: {0}".format(ROOT))

    print("(사)한국권투협회 전남지회 미리보기", flush=True)
    print("중앙회 사이트: http://www.kbaboxing.co.kr/", flush=True)

    # 서버를 먼저 띄운 뒤 동기화(네트워크 지연으로 미리보기가 막히지 않게)
    socketserver.TCPServer.allow_reuse_address = True
    httpd = socketserver.TCPServer((HOST, PORT), QuietHandler)
    url = "http://{0}:{1}/".format(HOST, PORT)
    print("열기:", url, flush=True)
    print("종료: Ctrl+C (백그라운드에서 {0}분마다 자동 갱신)".format(SYNC_INTERVAL_SEC // 60), flush=True)

    def boot():
        sync_kba(quiet=False)
        start_sync_loop()

    threading.Thread(target=boot, daemon=True).start()
    try:
        webbrowser.open(url)
    except Exception:
        pass
    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n서버를 종료합니다.", flush=True)
    finally:
        httpd.server_close()


if __name__ == "__main__":
    main()
