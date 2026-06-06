#!/usr/bin/env python3
# build_vision_montage.py — 각 데크의 대표(최대) 래스터 이미지 N장을 추출해 1장의 몽타주로 합치고
# 인덱스→데크/파일 매핑을 _vision_legend.json 으로 저장. (Vision 판독용)
import sys, os, glob, zipfile, io, json, re
from PIL import Image, ImageDraw

TOP = int(sys.argv[2]) if len(sys.argv) > 2 else 3
d = sys.argv[1] if len(sys.argv) > 1 else "assets"
raster = re.compile(r"ppt/media/.*\.(png|jpe?g|gif|bmp)$", re.I)

tiles, legend, idx = [], [], 0
for p in sorted(glob.glob(os.path.join(d, "*.pptx"))):
    name = os.path.splitext(os.path.basename(p))[0]
    with zipfile.ZipFile(p) as z:
        media = sorted([n for n in z.namelist() if raster.match(n)],
                       key=lambda n: z.getinfo(n).file_size, reverse=True)
        picked, seen = [], set()
        for n in media:
            sz = z.getinfo(n).file_size
            if sz in seen:  # 동일 크기 중복 스킵
                continue
            seen.add(sz); picked.append(n)
            if len(picked) >= TOP:
                break
        for n in picked:
            try:
                im = Image.open(io.BytesIO(z.read(n))).convert("RGB")
            except Exception:
                continue
            idx += 1
            tiles.append(im)
            legend.append({"idx": idx, "deck": name, "file": os.path.basename(n),
                           "px": list(im.size), "ext": os.path.splitext(n)[1].lower()})

cols = 6
TH = 360
rows = (len(tiles) + cols - 1) // cols
pad = 8
cell = TH + pad
sheet = Image.new("RGB", (cols * cell + pad, rows * (cell + 22) + pad), (250, 250, 252))
dr = ImageDraw.Draw(sheet)
for i, im in enumerate(tiles):
    t = im.copy(); t.thumbnail((TH, TH))
    cx = (i % cols) * cell + pad
    cy = (i // cols) * (cell + 22) + pad
    sheet.paste(t, (cx, cy))
    dr.rectangle([cx, cy + TH + 2, cx + TH, cy + TH + 20], fill=(40, 40, 60))
    dr.text((cx + 4, cy + TH + 4), f"#{i+1}", fill=(255, 255, 255))
out_png = os.path.join(d, "_vision_montage.png")
sheet.save(out_png)
json.dump(legend, open(os.path.join(d, "_vision_legend.json"), "w", encoding="utf-8"),
          ensure_ascii=False, indent=1)
print(f"OK montage={out_png} tiles={len(tiles)}")
