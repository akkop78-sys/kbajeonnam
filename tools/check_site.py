# -*- coding: utf-8 -*-
"""공개/로컬 홈페이지 링크·이미지 점검."""

from __future__ import annotations

import re
import sys
import urllib.error
import urllib.request
from html.parser import HTMLParser
from urllib.parse import urljoin, urlparse

UA = {"User-Agent": "kbajeonnam-check/1.0"}


class LinkFinder(HTMLParser):
    def __init__(self) -> None:
        super().__init__()
        self.urls: list[str] = []

    def handle_starttag(self, tag, attrs):
        d = dict(attrs)
        if tag == "a" and "href" in d:
            self.urls.append(d["href"])
        if tag in ("img", "script") and "src" in d:
            self.urls.append(d["src"])
        if tag == "link" and "href" in d:
            self.urls.append(d["href"])
        style = d.get("style") or ""
        for m in re.findall(r"url\((['\"]?)(.+?)\1\)", style):
            self.urls.append(m[1])


def fetch(url: str, timeout: float = 25):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=timeout) as r:
        return r.status, r.read(), r.headers.get_content_type() or ""


def same_site(base: str, url: str) -> bool:
    b, u = urlparse(base), urlparse(url)
    if u.scheme in ("mailto", "tel", "javascript"):
        return False
    if not u.netloc:
        return True
    return u.netloc == b.netloc and u.path.startswith(b.path.rstrip("/") + "/") or u.geturl().startswith(base)


def audit(base: str) -> int:
    if not base.endswith("/"):
        base += "/"
    seed = [
        "",
        "pages/about.html",
        "pages/organization.html",
        "pages/history.html",
        "pages/bylaws.html",
        "pages/events.html",
        "pages/news.html",
        "pages/register.html",
        "pages/gallery.html",
        "pages/contact.html",
        "data/kba.json",
        "css/style.css",
        "js/main.js",
        "js/kba-feed.js",
    ]
    broken: list[tuple[str, str]] = []
    checked: set[str] = set()
    queue = [urljoin(base, p) for p in seed]

    print("=== CHECK", base, "===")
    while queue:
        url = queue.pop(0)
        if url in checked:
            continue
        checked.add(url)
        try:
            status, body, ctype = fetch(url)
            ok = status == 200
            print(("OK" if ok else "BAD"), status, len(body), url)
            if not ok:
                broken.append((str(status), url))
                continue
            if "html" in ctype or url.endswith(".html") or url.endswith("/"):
                parser = LinkFinder()
                parser.feed(body.decode("utf-8", errors="replace"))
                for rel in parser.urls:
                    if not rel or rel.startswith("#"):
                        continue
                    full = urljoin(url, rel)
                    if not same_site(base, full):
                        continue
                    # drop query/hash for dedupe
                    clean = full.split("#", 1)[0]
                    if clean not in checked:
                        queue.append(clean)
        except Exception as exc:  # noqa: BLE001
            print("FAIL", url, "::", exc)
            broken.append((str(exc), url))

    print("\nchecked:", len(checked), "broken:", len(broken))
    for item in broken:
        print("BROKEN", item[0], item[1])
    return 1 if broken else 0


if __name__ == "__main__":
    target = sys.argv[1] if len(sys.argv) > 1 else "https://akkop78-sys.github.io/kbajeonnam/"
    raise SystemExit(audit(target))
