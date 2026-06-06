#!/usr/bin/env python3
# extract_design.py — pptx의 디자인 시스템(테마 색·폰트·타입스케일·실사용 색)을 추출해 <파일명>.design.md 생성
# 사용: python extract_design.py <a.pptx> [b.pptx ...]
import sys, os, zipfile, re, collections, xml.etree.ElementTree as ET

A = "{http://schemas.openxmlformats.org/drawingml/2006/main}"
P = "{http://schemas.openxmlformats.org/presentationml/2006/main}"

def theme_tokens(z):
    names = [n for n in z.namelist() if re.match(r"ppt/theme/theme\d+\.xml", n)]
    colors, fonts = {}, {}
    if not names:
        return colors, fonts
    root = ET.fromstring(z.read(sorted(names)[0]))
    cs = root.find(f".//{A}clrScheme")
    if cs is not None:
        for child in cs:
            tag = child.tag.replace(A, "")
            srgb = child.find(f"{A}srgbClr"); sysc = child.find(f"{A}sysClr")
            if srgb is not None:
                colors[tag] = srgb.get("val", "").upper()
            elif sysc is not None:
                colors[tag] = (sysc.get("lastClr") or sysc.get("val") or "").upper()
    fs = root.find(f".//{A}fontScheme")
    if fs is not None:
        for which in ("majorFont", "minorFont"):
            f = fs.find(f"{A}{which}")
            if f is not None:
                latin = f.find(f"{A}latin"); ea = f.find(f"{A}ea")
                fonts[which] = {
                    "latin": latin.get("typeface") if latin is not None else "",
                    "ea": ea.get("typeface") if ea is not None and ea.get("typeface") else "",
                }
    return colors, fonts

def slide_stats(z):
    sizes, srgb, faces = collections.Counter(), collections.Counter(), collections.Counter()
    slide_xmls = [n for n in z.namelist() if re.match(r"ppt/slides/slide\d+\.xml", n)]
    for n in slide_xmls:
        x = z.read(n).decode("utf-8", "ignore")
        for m in re.findall(r'<a:(?:rPr|defRPr|endParaRPr)[^>]*\bsz="(\d{3,5})"', x):
            sizes[round(int(m) / 100)] += 1            # 폰트 크기만(런 속성에 한정)
        for c in re.findall(r'srgbClr val="([0-9A-Fa-f]{6})"', x):
            srgb[c.upper()] += 1
        for f in re.findall(r'typeface="([^"]+)"', x):
            if f and not f.startswith("+"):
                faces[f] += 1
    return len(slide_xmls), sizes, srgb, faces

def slide_size(z):
    try:
        root = ET.fromstring(z.read("ppt/presentation.xml"))
        sz = root.find(f"{P}sldSz")
        return round(int(sz.get("cx")) / 914400, 2), round(int(sz.get("cy")) / 914400, 2)
    except Exception:
        return None, None

def build_md(path):
    name = os.path.splitext(os.path.basename(path))[0]
    with zipfile.ZipFile(path) as z:
        colors, fonts = theme_tokens(z)
        n_slides, sizes, srgb, faces = slide_stats(z)
        w, h = slide_size(z)
    if w and h:
        ratio = w / h
        aspect = "16:9" if abs(ratio - 16/9) < 0.05 else ("4:3" if abs(ratio - 4/3) < 0.05 else f"{w}:{h}")
        canvas = f"**{aspect}**  ({w} × {h} inch)"
    else:
        canvas = "(크기 추출 실패)"
    accents = [colors.get(f"accent{i}") for i in range(1, 7) if colors.get(f"accent{i}")]
    top_used = [c for c, _ in srgb.most_common(12)]
    def is_neutral(h):
        r, g, b = int(h[0:2], 16), int(h[2:4], 16), int(h[4:6], 16)
        return max(r, g, b) - min(r, g, b) < 18  # 흑·백·회색 계열
    real_palette = [c for c in top_used if not is_neutral(c)]
    distinct = sorted({s for s in sizes if s >= 6}, reverse=True)
    big = distinct[0] if distinct else "?"
    body_pool = [s for s in distinct if 10 <= s <= 28]
    body = max(body_pool, key=lambda s: sizes[s]) if body_pool else (distinct[-1] if distinct else "?")
    top_faces = [f for f, _ in faces.most_common(5)]
    # primary는 '실사용 유채색'에서 우선(테마는 Office 기본값인 경우가 많음)
    primary = real_palette[0] if real_palette else (accents[0] if accents else "7C6BFF")

    scale_rows = "\n".join(
        f"| {s} | {sizes[s]} | {'제목' if s==big else ('본문' if s==body else '')} |"
        for s in distinct[:12]
    )
    out = f"""# {name} — 디자인 시스템 분석

> `assets/{os.path.basename(path)}` 에서 자동 추출(테마 XML + 슬라이드 런 스캔). 슬라이드 {n_slides}장.

## 캔버스
- 비율: {canvas}
- 슬라이드 수: {n_slides}

## 폰트
- 제목(major): **{fonts.get('majorFont',{}).get('ea') or fonts.get('majorFont',{}).get('latin','?')}**
- 본문(minor): **{fonts.get('minorFont',{}).get('ea') or fonts.get('minorFont',{}).get('latin','?')}**
- 슬라이드 실사용 폰트: {', '.join(top_faces) if top_faces else '(테마 폰트 사용)'}

## 대표 색 — 실사용 유채색 (중성 흑·백·회색 제외, 빈도순) ★실제 디자인 신호
{', '.join('`#'+c+'`' for c in real_palette[:8]) if real_palette else '(유채색 없음 — 무채색 위주 디자인)'}

## 실사용 색 전체 (상위 12, 빈도순)
{', '.join('`#'+c+'`' for c in top_used) if top_used else '(추출 없음)'}

## 색 팔레트 (테마 — 데크가 Office 기본 테마를 그대로 둔 경우 기본값일 수 있음)
| 토큰 | HEX |
|------|-----|
| dk1 / dk2 | `{colors.get('dk1','?')}` / `{colors.get('dk2','?')}` |
| lt1 / lt2 | `{colors.get('lt1','?')}` / `{colors.get('lt2','?')}` |
| accent1~6 | {', '.join('`'+a+'`' for a in accents) if accents else '?'} |
| hlink | `{colors.get('hlink','?')}` |

## 타입 스케일 (실사용 폰트 크기 · pt → 빈도)
| pt | 빈도 | 추정 역할 |
|----|------|-----------|
{scale_rows}

## 요약 (빌드 차용 가이드)
- primary(강조) 후보: `#{primary}`
- 제목 ~{big}pt / 본문 ~{body}pt.
- `lib/build_helpers.mjs`의 `C` 토큰을 위 값으로 덮어쓰면 동일 톤으로 빌드 가능.
"""
    return name, out

def main():
    if len(sys.argv) < 2:
        print("usage: python extract_design.py <pptx ...>", file=sys.stderr); return 1
    for p in sys.argv[1:]:
        try:
            name, content = build_md(p)
            outp = os.path.join(os.path.dirname(os.path.abspath(p)), name + ".design.md")
            with open(outp, "w", encoding="utf-8") as f:
                f.write(content)
            print(f"OK  {name}.design.md")
        except Exception as e:
            print(f"FAIL {p}: {e}", file=sys.stderr)
    return 0

if __name__ == "__main__":
    sys.exit(main())
