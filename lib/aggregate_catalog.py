#!/usr/bin/env python3
# aggregate_catalog.py — 여러 데크의 *.elements.json + *.design.md 를 집계해
# 공통 슬라이드 레이아웃 아키타입 + 디자인 모티프 통계를 _layout-catalog.md 로 정리.
# 사용: python aggregate_catalog.py <dir(=assets)>
import sys, os, json, glob, re, collections

def feat(sl, W, H, idx, last):
    imgs = [s for s in sl["shapes"] if s["type"] == "image" and s.get("w") and s.get("h")]
    texts = [s for s in sl["shapes"] if s["type"] == "text" and s.get("text")]
    fullbleed = any(s["w"] >= 0.72*W and s["h"] >= 0.72*H for s in imgs)
    content_imgs = [s for s in imgs if min(s["w"], s["h"]) >= 0.8 and not (s["w"] >= 0.72*W and s["h"] >= 0.72*H)]
    numbered = sum(1 for t in texts if re.fullmatch(r"0?\d", t["text"].strip()) or "키워드0" in t["text"] or t["text"].strip().lower().startswith("step"))
    joined = " ".join(t["text"] for t in texts).lower()
    cover_kw = any(k in joined for k in ["presenter", "감사", "thank", "studio", "목차", "contents", "agenda"])
    return dict(n_img=len(content_imgs), n_text=len(texts), fullbleed=fullbleed,
                numbered=numbered, cover_kw=cover_kw, edge=(idx == 1 or idx == last))

def classify(f):
    if f["edge"] and f["n_text"] <= 6 and f["n_img"] <= 1:
        return "표지·마무리 (Cover/Closing)"
    if f["numbered"] >= 3:
        return "목차·스텝 그리드 (Index/Steps)"
    if f["n_img"] == 0 and f["n_text"] <= 2:
        return "섹션 디바이더 (Section divider)"
    if f["n_img"] >= 3:
        return "갤러리·카드 그리드 (Gallery/Grid)"
    if f["n_img"] in (1, 2) and f["n_text"] >= 1:
        return "이미지+텍스트 2단 (Image + Text)"
    if f["fullbleed"] and f["n_text"] <= 3:
        return "풀블리드 이미지+오버레이 (Full-bleed)"
    if f["n_text"] >= 4:
        return "본문 텍스트·카드 (Body text/cards)"
    return "기타 (Other)"

def parse_design_md(path):
    t = open(path, encoding="utf-8").read() if os.path.exists(path) else ""
    prim = re.search(r"primary\(강조\) 후보: `#?([0-9A-Fa-f]{6})`", t)
    fonts = re.search(r"슬라이드 실사용 폰트: (.+)", t)
    ratio = re.search(r"비율: \*\*([^*]+)\*\*", t)
    return (prim.group(1) if prim else "?"), (fonts.group(1) if fonts else "?"), (ratio.group(1).strip() if ratio else "?")

def main():
    d = sys.argv[1] if len(sys.argv) > 1 else "assets"
    files = sorted(glob.glob(os.path.join(d, "*.elements.json")))
    arch = collections.Counter()
    arch_decks = collections.defaultdict(set)
    motif = collections.Counter(); total_slides = 0
    decks = []
    for fp in files:
        name = os.path.basename(fp)[:-len(".elements.json")]
        data = json.load(open(fp, encoding="utf-8"))
        W, H = data["canvas_in"]; n = data["n_slides"]; total_slides += n
        prim, fonts, ratio = parse_design_md(os.path.join(d, name + ".design.md"))
        deck_fb = 0; deck_icon = 0
        for sl in data["slides"]:
            f = feat(sl, W, H, sl["slide"], n)
            a = classify(f); arch[a] += 1; arch_decks[a].add(name)
            if f["fullbleed"]: deck_fb += 1
            if any(s["type"] == "image" and s.get("w") and s["w"] < 0.6 and (s.get("y") or 9) < H*0.18 for s in sl["shapes"]): deck_icon += 1
        if deck_fb >= n*0.5: motif["풀블리드 배경 이미지(슬라이드 과반)"] += 1
        if deck_icon >= n*0.4: motif["상단 아이콘/로고 모티프 반복"] += 1
        only_blank = set(data["layouts"].keys()) <= {"Blank", ""}
        if only_blank: motif["Blank 레이아웃(템플릿 없이 자유 디자인)"] += 1
        decks.append((name, n, ratio, prim, fonts[:48]))

    lines = []
    lines.append("# 재사용 레이아웃 카탈로그 — 9개 데크 공통 패턴\n")
    lines.append(f"> `assets/*.elements.json` {len(files)}개 데크 · 총 {total_slides}슬라이드 집계.\n")
    lines.append("## 1. 데크 개요\n| 데크 | 장수 | 비율 | primary | 실사용 폰트 |")
    lines.append("|------|-----|------|---------|------------|")
    for nm, n, r, p, fo in decks:
        lines.append(f"| {nm} | {n} | {r} | `#{p}` | {fo} |")
    lines.append("\n## 2. 공통 슬라이드 아키타입 (빈도순)\n| 레이아웃 패턴 | 슬라이드 수 | 사용 데크 수 |")
    lines.append("|---------------|------------|------------|")
    for a, c in arch.most_common():
        lines.append(f"| {a} | {c} | {len(arch_decks[a])}/{len(files)} |")
    lines.append("\n## 3. 공통 디자인 모티프 (몇 개 데크에서 관찰)\n| 모티프 | 데크 수 |")
    lines.append("|--------|--------|")
    for m, c in motif.most_common():
        lines.append(f"| {m} | {c}/{len(files)} |")
    lines.append("""
## 4. 재현 빌드 가이드 (lib/build_helpers.mjs)
공통 아키타입 → 헬퍼 매핑:
- **표지·마무리**: `deco()` 배경원 + 50pt 헤드라인(강조어 색) + `imgCard()` 우측 이미지 + 하단 알약. (풀블리드형이면 배경 이미지 + 오버레이 텍스트)
- **섹션 디바이더**: primary 풀배경 + 40~44pt 흰 제목 + `runs()` 골드 강조.
- **목차·스텝 그리드**: 번호 배지(`iconCircle` 또는 ell+번호) + 행/카드 반복, 균등 간격.
- **이미지+텍스트 2단**: 한쪽 `imgCard()`, 반대쪽 제목+본문(`runs()` 키워드 강조), `pad()` 균등 여백.
- **갤러리·카드 그리드**: 2×N/3×N `rrect()` 카드 + `iconCircle()` + 캡션, 동일 gap.
- **본문 텍스트·카드**: `header()` + 불릿/카드, 좌정렬 본문.

> 각 데크의 primary/폰트/타입스케일은 해당 `*.design.md`에서, 정확한 좌표·크기는 `*.elements.json`에서 가져와 위 헬퍼에 주입하면 동일 톤·레이아웃으로 재현된다.
""")
    out = os.path.join(d, "_layout-catalog.md")
    open(out, "w", encoding="utf-8").write("\n".join(lines))
    print("OK", out)

if __name__ == "__main__":
    main()
