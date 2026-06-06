#!/usr/bin/env python3
# render_contact.py — .pptx → PDF 렌더 + 페이지 컨택트시트(자가검수용)
# 사용: python render_contact.py <output.pptx> [--soffice PATH] [--dpi 150] [--cols 3]
# 폴백(검수자 L): soffice 없으면 .pptx만, PyMuPDF/PIL 없으면 단계 생략. 크래시 대신 경고.
import sys, os, subprocess, argparse, shutil

SOFFICE_DEFAULT = r"C:\Program Files\LibreOffice\program\soffice.exe"

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("pptx")
    ap.add_argument("--soffice", default=SOFFICE_DEFAULT)
    ap.add_argument("--dpi", type=int, default=150)
    ap.add_argument("--cols", type=int, default=3)
    a = ap.parse_args()

    pptx = a.pptx
    if not os.path.exists(pptx):
        print(f"ERROR: 파일 없음 — {pptx}", file=sys.stderr); return 1
    base = os.path.splitext(os.path.abspath(pptx))[0]
    outdir = os.path.dirname(os.path.abspath(pptx)) or "."

    # 1) soffice 사전검사 → PDF 변환
    soffice = a.soffice if os.path.exists(a.soffice) else (shutil.which("soffice") or "")
    if not soffice:
        print("WARN: LibreOffice(soffice) 미설치 — 렌더/컨택트시트 생략, .pptx만 사용", file=sys.stderr); return 2
    subprocess.run([soffice, "--headless", "--norestore", "--convert-to", "pdf", "--outdir", outdir, pptx],
                   stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    pdf = base + ".pdf"
    if not os.path.exists(pdf):
        print("ERROR: PDF 변환 실패(soffice 인스턴스 충돌 시 taskkill /F /IM soffice.exe 후 재시도)", file=sys.stderr); return 1

    # 2) 페이지 렌더 (PyMuPDF)
    try:
        import fitz
    except ImportError:
        print(f"WARN: PyMuPDF 미설치 — 컨택트시트 생략. PDF: {pdf}", file=sys.stderr); return 2
    doc = fitz.open(pdf); n = doc.page_count; m = a.dpi / 72.0
    pngs = []
    for i, p in enumerate(doc):
        fn = f"{base}_p{i+1:02d}.png"
        p.get_pixmap(matrix=fitz.Matrix(m, m)).save(fn); pngs.append(fn)

    # 3) 컨택트시트 (PIL)
    try:
        from PIL import Image
        ims = [Image.open(f) for f in pngs]; w, h = ims[0].size
        cols = a.cols; rows = (n + cols - 1) // cols
        tw, th = w // 2, h // 2
        sheet = Image.new("RGB", (tw * cols + 10 * (cols + 1), th * rows + 12 * (rows + 1)), (245, 245, 248))
        for i, im in enumerate(ims):
            t = im.resize((tw, th))
            x = (i % cols) * tw + 10 * ((i % cols) + 1)
            y = (i // cols) * th + 12 * ((i // cols) + 1)
            sheet.paste(t, (x, y))
        cs = base + "_contact.png"; sheet.save(cs)
        for f in pngs:
            os.remove(f)  # 개별 페이지 정리, 컨택트시트만 남김
        print(f"OK pages={n} contact={cs}")
    except ImportError:
        print(f"OK pages={n} (PIL 미설치 — 개별 PNG 유지: {base}_pNN.png)", file=sys.stderr)
    return 0

if __name__ == "__main__":
    sys.exit(main())
