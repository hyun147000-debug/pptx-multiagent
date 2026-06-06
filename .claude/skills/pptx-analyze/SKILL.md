---
name: pptx-analyze
description: This skill should be used when the user wants to analyze, dissect, or extract the design and layout of a .pptx file into reusable references — triggers include "pptx 분석", "슬라이드 분석", "이 pptx 디자인 뽑아줘", "design.md 만들어줘", "레이아웃 분석", "디자인 시스템 추출", "이 덱 분석해줘", "analyze pptx", "extract pptx design". It extracts colors, fonts, type scale, used elements, templates, element placement, content composition, image character, masters/placeholders, and grid/spacing/margins into design.md + elements.json, so a deck's design can be reproduced. Make sure to use this skill whenever a .pptx needs design analysis, even if the user only says "이 덱 분석해줘".
---

# PPTX 디자인 분석

> pptx → `<파일명>.design.md`(사람이 읽는 디자인 레퍼런스) + `<파일명>.elements.json`(정밀 좌표 데이터). 여러 데크면 `_layout-catalog.md`로 공통 패턴 집계.

분석 스크립트는 이 프로젝트 `lib/` 에 있다(단일 출처). 모든 단계는 imperative 명령 그대로 실행한다.

## 입력 확정
- 대상: 단일 `.pptx` 또는 폴더(보통 `assets/`)의 여러 `.pptx`.
- 분석 깊이(기본=full): `tokens`(색·폰트만) / `full`(요소·구조·이미지·마스터·그리드) / `full+vision`(이미지 픽셀 판독까지).
- 산출물은 pptx와 **같은 폴더**에 같은 basename으로 만든다.

## 워크플로우 (script 순서대로)

### Step 1 — 디자인 토큰  →  `<name>.design.md`
```
python lib/extract_design.py <pptx ...>
```
테마 색·실사용 유채색·폰트·타입스케일 추출. (테마가 Office 기본값이면 '실사용 색·폰트'가 진짜 신호)

### Step 2 — 구조(요소·템플릿·배치·내용)  →  design.md + `<name>.elements.json`
```
python lib/extract_layout.py <pptx ...>
```
레이아웃(템플릿)·요소 타입 분포·zone(L/C/R×상/중/하)+크기·슬라이드별 내용 구성·이미지 인벤토리.

### Step 3 — 심화(이미지·마스터·그리드)  →  design.md 섹션 추가
```
python lib/analyze_more.py <pptx ...>
```
이미지 역할/형식 분포·실사 추정, 마스터·플레이스홀더, 그리드·정렬 기준선·마진·요소 간격.

### Step 4 — (다중 데크) 공통 패턴 카탈로그  →  `_layout-catalog.md`
```
python lib/aggregate_catalog.py <folder=assets>
```
데크 개요 + 공통 슬라이드 아키타입 + 공통 모티프 + 재현 빌드 가이드.

### Step 5 — (full+vision 일 때만) 이미지 픽셀 판독
형식(JPEG/PNG)만으론 사진/일러스트를 단정할 수 없다 — PNG에 사진이 흔하다. 픽셀로 확인한다:
```
python lib/build_vision_montage.py <folder> 3
```
생성된 `_vision_montage.png`를 Read 도구로 직접 보고, `_vision_legend.json`의 인덱스→데크 매핑으로 각 타일을 분류(사진/일러스트/아이콘/차트 + 피사체)한다. 판독 결과를 각 `<name>.design.md`의 "이미지 내용 분석 (Vision)" 섹션에 반영하고, 임시 `_vision_montage.png`·`_vision_legend.json`은 삭제한다.

## 보고
완료 후 산출 파일 목록과 핵심 발견(데크별 primary·폰트·아키타입·이미지 성격)을 3~6줄로 요약한다.

## Settings
| 설정 | 기본값 | 변경 방법 |
|------|--------|-----------|
| 분석 깊이 | full | 요청에 "토큰만/빠르게"→Step1만, "이미지까지 정확히"→Step5 포함 |
| 출력 위치 | pptx와 동일 폴더·동일 basename | 사용자 지정 시 따른다 |

## Dependencies (이 프로젝트 환경에 설치됨)
- `python-pptx`, `Pillow`, `PyMuPDF`(fitz) — 분석/렌더
- LibreOffice `soffice` — (선택) PDF 렌더
- 색·구조 추출은 외부 API 불필요(로컬 파싱). Vision 판독은 Read 도구(모델 비전) 사용.

## Notes
- 외부 데이터를 만들지 않는다. 추출은 pptx 내부 사실(XML·미디어)만 근거로 한다.
- 토큰/구조는 결정론적 스크립트, 이미지 성격만 모델 판독 → 형식 추정과 픽셀 판독이 다르면 **픽셀(Vision)이 우선**.
