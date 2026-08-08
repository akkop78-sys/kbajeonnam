# -*- coding: utf-8 -*-
"""한국권투협회(kbaboxing.co.kr) 게시판을 가져와 website/data/kba.json 갱신."""

from __future__ import annotations

import json
import re
import urllib.request
from datetime import datetime, timezone
from html import unescape
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "website" / "data" / "kba.json"
BASE = "http://www.kbaboxing.co.kr"

# XE mid 경로 (중앙회 사이트 메뉴)
SOURCES = {
    "notices": f"{BASE}/",  # 메인 공지 블록도 파싱 시도; 실패 시 별도 보드
    "schedule": f"{BASE}/schedule",
    "results": f"{BASE}/board_ROOX28",
    "protest": f"{BASE}/Information",
    "ranking": f"{BASE}/status_ranking",
    "video": f"{BASE}/video",
}

# 공지 전용 mid가 메인과 다를 수 있어 후보 추가
NOTICE_CANDIDATES = [
    f"{BASE}/notice",
    f"{BASE}/index.php?mid=notice",
    f"{BASE}/",
]

SKIP_TITLES = {
    "번호",
    "제목",
    "글쓴이",
    "날짜",
    "조회 수",
    "조회수",
    "더보기",
    "more",
    "MORE",
    "게시글 관리",
    "전체 선택",
    "정렬",
    "설정",
}

UA = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36"
    )
}


def fetch(url: str) -> str:
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=30) as res:
        return res.read().decode("utf-8", "replace")


def clean_text(text: str) -> str:
    text = re.sub(r"<[^>]+>", "", text)
    text = unescape(text)
    text = re.sub(r"\s+", " ", text).strip()
    return text


def abs_url(href: str) -> str:
    href = href.strip()
    if href.startswith("//"):
        return "http:" + href
    if href.startswith("/"):
        return BASE + href
    if href.startswith("http"):
        return href
    return BASE + "/" + href.lstrip("./")


def sort_by_date(items: list[dict]) -> list[dict]:
    def key(item: dict):
        d = (item.get("date") or "").replace(".", "")
        return d if len(d) >= 8 else "00000000"

    return sorted(items, key=key, reverse=True)


def parse_board_rows(html: str, limit: int = 12) -> list[dict]:
    items: list[dict] = []
    # 테이블 행 단위
    for row in re.findall(r"<tr[^>]*>.*?</tr>", html, flags=re.I | re.S):
        if "no data" in row.lower():
            continue
        link = re.search(
            r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>',
            row,
            flags=re.I | re.S,
        )
        if not link:
            continue
        href, title_html = link.group(1), link.group(2)
        title = clean_text(title_html)
        if not title or len(title) < 2 or title in SKIP_TITLES:
            continue
        if any(x in title for x in ("게시글 관리", "전체 선택", "정렬", "설정")):
            continue
        # 문서 링크만 (XE: /mid/문서번호 또는 document_srl)
        if not re.search(r"document_srl=\d+|/\d+(?:$|\?)", href):
            continue
        date_m = re.search(r"(\d{4}[.\-/]\d{2}[.\-/]\d{2})", row)
        date = date_m.group(1).replace("-", ".").replace("/", ".") if date_m else ""
        is_notice = "공지" in row[:120] or 'class="notice"' in row or ">공지<" in row
        items.append(
            {
                "title": title,
                "url": abs_url(href).replace("&amp;", "&"),
                "date": date,
                "notice": is_notice,
            }
        )
        if len(items) >= max(limit * 3, 24):
            break

    # 폴백: 메인 위젯 목록
    if not items:
        for m in re.finditer(
            r'<a[^>]+href="([^"]+)"[^>]*>([^<]{4,120})</a>',
            html,
            flags=re.I,
        ):
            href, title = m.group(1), clean_text(m.group(2))
            if title in SKIP_TITLES:
                continue
            if not re.search(r"document_srl=\d+|/\d+(?:$|\?)", href):
                continue
            items.append(
                {
                    "title": title,
                    "url": abs_url(href).replace("&amp;", "&"),
                    "date": "",
                    "notice": False,
                }
            )
            if len(items) >= limit * 2:
                break

    # 최신 날짜 우선 (고정공지가 오래돼도 최근 글이 위에 오게)
    items = sort_by_date(items)
    return items[:limit]


def parse_home_lists(html: str) -> dict[str, list[dict]]:
    """메인 페이지 섹션 헤딩 근처 링크를 느슨하게 수집."""
    sections = {
        "notices": [],
        "schedule": [],
        "protest": [],
    }
    # 섹션 키워드 주변 블록
    patterns = {
        "notices": r"공지사항[\s\S]{0,4000}",
        "schedule": r"경기\s*일정[\s\S]{0,4000}",
        "protest": r"프로테스트\s*일정[\s\S]{0,4000}",
    }
    for key, pat in patterns.items():
        block_m = re.search(pat, html)
        if not block_m:
            continue
        block = block_m.group(0)
        for m in re.finditer(r'<a[^>]+href="([^"]+)"[^>]*>(.*?)</a>', block, flags=re.I | re.S):
            title = clean_text(m.group(2))
            href = m.group(1)
            if len(title) < 4 or title in SKIP_TITLES:
                continue
            if not re.search(r"document_srl=\d+|/\d+(?:$|\?)", href):
                continue
            sections[key].append(
                {
                    "title": title,
                    "url": abs_url(href).replace("&amp;", "&"),
                    "date": "",
                    "notice": key == "notices",
                }
            )
            if len(sections[key]) >= 8:
                break
    return sections


def sync() -> dict:
    data = {
        "source": BASE,
        "updated_at": datetime.now(timezone.utc).astimezone().isoformat(timespec="seconds"),
        "hq": {
            "name": "사단법인 한국권투협회",
            "address": "서울특별시 관악구 남부순환로 1361 3층 (신림동)",
            "tel": "02-838-1233",
            "fax": "02-838-1232",
            "email": "kba122@hanmail.net",
            "url": BASE + "/",
        },
        "links": {
            "home": BASE + "/",
            "schedule": BASE + "/schedule",
            "results": BASE + "/board_ROOX28",
            "protest": BASE + "/Information",
            "ranking": BASE + "/status_ranking",
            "video": BASE + "/video",
        },
        "notices": [],
        "schedule": [],
        "results": [],
        "protest": [],
        "ranking": [],
        "video": [],
        "errors": [],
    }

    # 보드별
    for key in ("schedule", "results", "protest", "ranking", "video"):
        url = SOURCES[key]
        try:
            html = fetch(url)
            data[key] = parse_board_rows(html)
            if not data[key]:
                data["errors"].append(f"{key}: 목록 파싱 결과 없음")
        except Exception as exc:  # noqa: BLE001
            data["errors"].append(f"{key}: {exc}")

    # 공지
    notices = []
    for url in NOTICE_CANDIDATES:
        try:
            html = fetch(url)
            if url.rstrip("/").endswith("kbaboxing.co.kr") or url.endswith("/"):
                home = parse_home_lists(html)
                notices = home.get("notices") or []
                if not data["schedule"]:
                    data["schedule"] = home.get("schedule") or data["schedule"]
                if not data["protest"]:
                    data["protest"] = home.get("protest") or data["protest"]
            else:
                notices = parse_board_rows(html)
            if notices:
                break
        except Exception as exc:  # noqa: BLE001
            data["errors"].append(f"notices({url}): {exc}")
    data["notices"] = notices

    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding="utf-8")
    return data


if __name__ == "__main__":
    result = sync()
    print("저장:", OUT)
    print("updated_at:", result["updated_at"])
    for key in ("notices", "schedule", "results", "protest", "ranking", "video"):
        print(f"  {key}: {len(result.get(key) or [])}건")
    if result["errors"]:
        print("경고:")
        for e in result["errors"]:
            print(" -", e)
