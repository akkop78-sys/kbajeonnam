# (사)한국권투협회 전남지회 — 전남권투협회

발대식·취임식 책자(2026. 4. 23.)를 반영한 **사단법인 정관·설립 서류**와 **공식 홈페이지 초안**입니다.

## 공식 명칭

- **법인명**: 사단법인 한국권투협회 전남지회  
- **통칭**: 전남권투협회  
- **회장**: 이현만  
- **상급**: 사단법인 한국권투협회(중앙회)

## 미리보기 (로컬)

```bash
python 전남권투협회.py
```

`http://127.0.0.1:8080/`

서버 시작 시 [한국권투협회(중앙회)](http://www.kbaboxing.co.kr/) 자료를 가져와 `website/data/kba.json`에 저장하고, **30분마다** 갱신합니다.

```bash
python tools/sync_kba.py
```

## 배포

### Vercel (권장 · 짧은 주소)

- **공개 주소**: https://kbajeonnam.vercel.app/
- 프로젝트: `website/` 정적 사이트

다시 배포:

```bash
npx vercel deploy website --prod --yes
```

### GitHub Pages (백업)

- **공개 주소**: https://akkop78-sys.github.io/kbajeonnam/
- **저장소**: https://github.com/akkop78-sys/kbajeonnam
- `website/` 내용이 `gh-pages` 브랜치로 배포됩니다.

```bash
python tools/sync_kba.py
git add -A
git commit -m "Update site"
git push origin main
git subtree split --prefix website -b gh-pages
git push origin gh-pages --force
```

## 주요 페이지

| 경로 | 내용 |
|------|------|
| `website/index.html` | 홈 |
| `website/pages/about.html` | 취임사·회장 프로필 |
| `website/pages/organization.html` | 조직도(책자 반영) |
| `website/pages/history.html` | 복싱 역사·세계챔피언 |
| `website/pages/bylaws.html` | 정관 요약 |
| `docs/정관.md` | 정관 전문 |

## 폴더

- `docs/` — 정관, 취지서, 임원구성안 등  
- `website/` — 정적 홈페이지 + 책자 스캔 이미지  

## 고지

지회사무실: 전라남도 여수시 소라면 죽림리 1164-8번지 1층  
허가·등기 전 초안이며, 전화·수수료 등은 확정 후 수정하십시오.
