# -*- coding: utf-8 -*-
"""책자 스캔에서 인물 얼굴만 타이트하게 추출·보정."""

from pathlib import Path

import cv2
import numpy as np
from PIL import Image, ImageEnhance, ImageFilter, ImageOps

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / "website" / "images"
OUT = ROOT / "website" / "images" / "portraits"
CASCADE = cv2.CascadeClassifier(
    cv2.data.haarcascades + "haarcascade_frontalface_default.xml"
)


def load_bgr(path: Path):
    pil = Image.open(path).convert("RGB")
    return cv2.cvtColor(np.array(pil), cv2.COLOR_RGB2BGR)


def enhance_pil(img: Image.Image) -> Image.Image:
    img = ImageOps.autocontrast(img, cutoff=0.8)
    img = ImageEnhance.Color(img).enhance(1.18)
    img = ImageEnhance.Contrast(img).enhance(1.2)
    img = ImageEnhance.Sharpness(img).enhance(1.55)
    img = ImageEnhance.Brightness(img).enhance(1.05)
    img = img.filter(ImageFilter.UnsharpMask(radius=1.1, percent=140, threshold=2))
    return img


def rotate_bgr(bgr, k: int):
    if k % 4 == 0:
        return bgr
    return np.ascontiguousarray(np.rot90(bgr, k=k % 4))


def detect_faces(bgr):
    gray = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    gray = cv2.equalizeHist(gray)
    faces = CASCADE.detectMultiScale(
        gray, scaleFactor=1.06, minNeighbors=3, minSize=(22, 22)
    )
    return list(faces)


def best_orientation(bgr):
    best = (-1, bgr, [])
    for k in range(4):
        img = rotate_bgr(bgr, k)
        faces = detect_faces(img)
        score = len(faces)
        area = sum(int(w) * int(h) for (_, _, w, h) in faces)
        key = (score, area)
        prev = (best[0], sum(int(w) * int(h) for (_, _, w, h) in best[2]) if best[2] else 0)
        if key > prev:
            best = (score, img, faces)
    return best[1], best[2]


def crop_face(bgr, face, pad=0.55, out_size=420):
    x, y, w, h = [int(v) for v in face]
    cx, cy = x + w / 2.0, y + h / 2.0
    side = max(w, h) * (1.0 + pad * 2)
    # 헤어라인 여유
    cy -= side * 0.06
    x1 = int(cx - side / 2)
    y1 = int(cy - side / 2)
    x2 = int(x1 + side)
    y2 = int(y1 + side)
    H, W = bgr.shape[:2]
    x1, y1 = max(0, x1), max(0, y1)
    x2, y2 = min(W, x2), min(H, y2)
    crop = bgr[y1:y2, x1:x2]
    if crop.size == 0:
        return None
    pil = Image.fromarray(cv2.cvtColor(crop, cv2.COLOR_BGR2RGB))
    pil = ImageOps.fit(pil, (out_size, out_size), method=Image.Resampling.LANCZOS)
    return enhance_pil(pil)


def is_colorful(bgr, face):
    x, y, w, h = [int(v) for v in face]
    patch = bgr[y : y + h, x : x + w]
    if patch.size == 0:
        return False
    hsv = cv2.cvtColor(patch, cv2.COLOR_BGR2HSV)
    sat = float(np.mean(hsv[:, :, 1]))
    return sat > 25


def save(pil, path: Path):
    pil.convert("RGB").save(path, quality=94, optimize=True)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    for old in OUT.glob("*"):
        if old.suffix.lower() in {".jpg", ".jpeg", ".png", ".csv"}:
            old.unlink()

    mapping = []

    # --- 회장 이현만 (취임사, 컬러·큰 얼굴 우선)
    img, faces = best_orientation(load_bgr(SRC / "inauguration-speech.png"))
    faces = sorted(faces, key=lambda f: f[2] * f[3], reverse=True)
    print("inauguration", len(faces))
    for face in faces:
        if is_colorful(img, face):
            pil = crop_face(img, face, pad=0.62, out_size=520)
            if pil:
                save(pil, OUT / "lee-hyunman.jpg")
                mapping.append(("lee-hyunman.jpg", "이현만", "회장"))
            break

    # --- 프로필 페이지: 컬러=이현만, 흑백=방호남
    img, faces = best_orientation(load_bgr(SRC / "profile-page.png"))
    faces = sorted(faces, key=lambda f: f[1])  # 위→아래
    print("profile", len(faces))
    color_faces = [f for f in faces if is_colorful(img, f)]
    mono_faces = [f for f in faces if not is_colorful(img, f)]
    if color_faces:
        pil = crop_face(img, max(color_faces, key=lambda f: f[2] * f[3]), pad=0.6, out_size=500)
        if pil:
            save(pil, OUT / "lee-hyunman-alt.jpg")
            mapping.append(("lee-hyunman-alt.jpg", "이현만", "회장"))
    if mono_faces:
        pil = crop_face(img, max(mono_faces, key=lambda f: f[2] * f[3]), pad=0.65, out_size=500)
        if pil:
            save(pil, OUT / "bang-ho-nam.jpg")
            mapping.append(("bang-ho-nam.jpg", "방호남", "고문·여수북싱 초대관장"))

    # 액션 컷 (프로필 페이지 큰 흑백 영역 — 왼쪽 절반)
    H, W = img.shape[:2]
    action = img[int(H * 0.1) : int(H * 0.9), 0 : int(W * 0.45)]
    if action.size:
        pil = ImageOps.fit(
            Image.fromarray(cv2.cvtColor(action, cv2.COLOR_BGR2RGB)),
            (800, 520),
            method=Image.Resampling.LANCZOS,
        )
        save(enhance_pil(pil), OUT / "action-vintage.jpg")
        mapping.append(("action-vintage.jpg", "권투 경기 장면", "역사"))

    champ_pages = [
        (
            "champions-1.png",
            [
                ("kim-ki-soo.jpg", "김기수"),
                ("hong-soo-hwan.jpg", "홍수환"),
                ("yoo-je-du.jpg", "유제두"),
                ("park-chan-hee.jpg", "박찬희"),
                ("kim-chul-ho.jpg", "김철호"),
            ],
        ),
        (
            "champions-2.png",
            [
                ("jang-jung-koo.jpg", "장정구"),
                ("yuh-myung-woo.jpg", "유명우"),
                ("park-jong-pal.jpg", "박종팔"),
                ("kim-yong-kang.jpg", "김용강"),
                ("moon-sung-kil.jpg", "문성길"),
            ],
        ),
        (
            "champions-3.png",
            [
                ("lee-yul-woo.jpg", "이열우"),
                ("baek-in-chul.jpg", "백인철"),
                ("choi-yong-soo.jpg", "최용수"),
                ("ji-in-jin.jpg", "지인진"),
                ("choi-hyun-mi.jpg", "최현미"),
                ("lee-eun-hye.jpg", "이은혜"),
            ],
        ),
    ]

    for file, metas in champ_pages:
        img, faces = best_orientation(load_bgr(SRC / file))
        print(file, len(faces))
        ordered = sorted(faces, key=lambda f: (f[1] // 30, f[0]))
        # 너무 작은 오탐 제거
        ordered = [f for f in ordered if f[2] * f[3] >= 900]
        for i, (fname, kor) in enumerate(metas):
            if i >= len(ordered):
                break
            pil = crop_face(img, ordered[i], pad=0.5, out_size=420)
            if pil:
                save(pil, OUT / fname)
                mapping.append((fname, kor, "세계챔피언"))

    # 갤러리용 추가 얼굴
    idx = 1
    seen = set()
    for file in ("champions-1.png", "champions-2.png", "champions-3.png", "profile-page.png", "inauguration-speech.png"):
        img, faces = best_orientation(load_bgr(SRC / file))
        for face in sorted(faces, key=lambda f: f[2] * f[3], reverse=True):
            key = (file, int(face[0] // 10), int(face[1] // 10))
            if key in seen or face[2] * face[3] < 800:
                continue
            seen.add(key)
            pil = crop_face(img, face, pad=0.48, out_size=380)
            if not pil:
                continue
            fname = f"gallery-{idx:02d}.jpg"
            save(pil, OUT / fname)
            mapping.append((fname, f"인물 {idx}", "갤러리"))
            idx += 1
            if idx > 24:
                break
        if idx > 24:
            break

    (OUT / "manifest.csv").write_text(
        "filename,name,role\n" + "\n".join(",".join(r) for r in mapping),
        encoding="utf-8",
    )
    print("saved", len(list(OUT.glob('*.jpg'))), "portraits ->", OUT)


if __name__ == "__main__":
    main()
