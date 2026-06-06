#!/usr/bin/env python3
# append_vision.py — Vision 판독 결과(대표 3장 샘플)를 각 design.md에 반영.
import os
ASSETS = os.path.join(os.path.dirname(__file__), "..", "assets")
V = {
 "OJT": ("비즈니스 회의 사진 · 평면도/도식 · 배너", "사진+도식 혼합", "실사 비중 높음(인물·오피스)"),
 "ai서비스": ("업무 중 인물 사진 · 스마트폰을 든 손", "사진 중심", "비즈니스 스톡 사진 위주"),
 "codex_AI_slide_workflow_design_system_pro_with_images": ("플랫 벡터 일러스트(아이콘·도식, 그린 톤)", "일러스트 중심(유일)", "실사 거의 없음 — 일러스트/도식 기반"),
 "결산보고": ("상승 막대그래프·그래디언트 그래픽 · 비즈니스 사진", "그래픽(차트)+사진", "데이터 그래픽과 사진 혼합"),
 "깔끔핑크": ("인물 헤드샷 사진 2 · 막대차트", "인물 사진+차트", "사람 중심 사진 + 차트"),
 "브랜드 제안": ("악수·핸즈 비즈니스 사진 · 실루엣 그래픽", "사진 중심+그래픽", "신뢰감 비즈니스 사진 위주"),
 "세미나 샘플": ("세미나 청중 사진(차분한 톤) · 배너", "사진 중심", "행사/청중 사진 위주"),
 "시스템 구축": ("인물·서재(라이브러리) 사진 · 도형", "사진 중심", "인물·공간 사진 + 도형"),
 "심플그린": ("자연 풀밭(그린) 사진 3", "사진(자연) 중심", "녹색 자연 사진으로 톤 구성"),
}
MARK = "## 이미지 내용 분석 (Vision"
for deck, (reading, character, note) in V.items():
    dm = os.path.join(ASSETS, deck + ".design.md")
    if not os.path.exists(dm):
        print("skip", deck); continue
    block = f"""## 이미지 내용 분석 (Vision · 대표 3장 샘플)
- 판독: {reading}
- 성격: **{character}**  ·  {note}
- ⚠️ 형식 기반 '실사(JPEG) 0%'는 오해 소지 — 실제로는 **사진이 PNG로 저장**됨(Vision 확인). 형식이 아니라 픽셀이 진실.
"""
    cur = open(dm, encoding="utf-8").read()
    if MARK in cur:
        cur = cur[:cur.index(MARK)].rstrip() + "\n\n"
    open(dm, "w", encoding="utf-8").write(cur.rstrip() + "\n\n" + block)
    print("OK", deck)
