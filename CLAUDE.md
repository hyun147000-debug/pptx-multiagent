# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

# 중앙부처 PPTX 기획·제작 멀티에이전트 시스템

사용자가 **주제** 또는 **자료**를 제시하면, 브리프 → 리서치 → 검증 → 기획 → 평가 → 디자인 → 이미지 → 제작 → 검수 과정을 거쳐 중앙부처에서 바로 쓸 수 있는 **편집 가능한 .pptx + 발표 스크립트**를 산출한다.

## 오케스트레이션 원칙 (반자동 + 병렬)

메인 세션이 **오케스트레이터**로서 아래 파이프라인을 진행하되, **4개 HITL 게이트(승인 5회: Gate 0·1·2+3·4)**에서만 멈춰 승인을 받는다. 게이트가 아닌 구간은 자동 진행하며, **병렬 가능한 구간은 동시에 실행**해 시간을 단축한다.

각 단계는 `.claude/agents/`의 서브에이전트를 **Task 도구로 호출**한다. 병렬 구간은 **한 메시지에서 여러 Task를 동시에 호출**한다. 모든 산출물은 `projects/<YYYYMMDD_주제>/`에 저장한다.

## 파이프라인

```
[입력: 주제 또는 자료]
        ▼
① pptx-intake (Sonnet) → brief.md
   ╔════ Gate 0: 발표 브리프 확정 ════╗
        ▼
┌─ 병렬(P-A) ──────────────────────────────────────────────┐
│ ② pptx-researcher (Sonnet)        ②' pptx-design-analyst │
│    insane-search · 콘텐츠/레퍼런스      (Sonnet)          │
│    → research.md(+데이터부록)        insane-design · 애셋  │
│    ┌ 병렬(P-B): 주제리서치 ∥ 레퍼런스조사 ┐ → design-ref.md │
└──────────────┬───────────────────────────────────────────┘
        ▼ (research 완료 후)
③ pptx-factchecker (Sonnet) → factcheck.md   ※ ②'와 동시 진행 가능
        │ ❌ 0건 통과
        ▼
④ pptx-planner (Opus) → plan.md(+비주얼의도·이미지요구·발표자노트) + script.md
        ▼
⑤ pptx-reviewer (Opus, 다관점) → review.md ──IF≥80──╗
        │ 미달 ↻ planner 재작성(최대 3회, 수렴추적)    ║
   ╔════ Gate 1: 기획안 확정 ════╗◀═════════════════════╝
        ▼
┌─ 병렬(P-C) ──────────────────────────────────────────────┐
│ ⑥ pptx-designer (Sonnet)          ⑦ pptx-imagegen        │
│    디자인 3안(+design-ref)             (Sonnet)           │
│   ╔ Gate 2+3: 디자인 택1 + 필요요소 ╗   Codex 이미지 생성  │
│                                       → assets/generated/ │
└──────────────┬───────────────────────────────────────────┘
        ▼ (디자인 확정 + 이미지 준비 동기화)
⑧ pptx-designer 제작 (Sonnet, pptxgenjs + lib/build_helpers.mjs) → output_vN.pptx
        ▼
⑨ pptx-inspector (Opus, 6축) → inspection.md ──IF≥85──╗
        │ 미달 ↻ designer 재제작(최대 3회, fallback)     ║
   ╔════ Gate 4: 최종 인수 ════╗◀═════════════════════════╝
        ▼
[산출: output.pptx + script.md + decisions.md]
```

## 에이전트 명세 (9개)

| 단계 | 에이전트 | 모델 | 역할 | 핵심 스킬 | 산출물 |
|------|----------|------|------|-----------|--------|
| ① | `pptx-intake` | **Sonnet** | 발표 브리프 확정(목적·청중·시간·분량·톤·마감) | — | `brief.md` |
| ② | `pptx-researcher` | **Sonnet** | 콘텐츠·레퍼런스 수집, 데이터부록(출처) | **insane-search**, document-skills:pptx | `research.md` |
| ②' | `pptx-design-analyst` | **Sonnet** | 사용자 제공 디자인 자산 분석 | **insane-design** | `design-ref.md` |
| ③ | `pptx-factchecker` | **Sonnet** | 수치·출처 검증(환각 차단) | insane-search | `factcheck.md` |
| ④ | `pptx-planner` | **Opus** | 스토리·슬라이드·비주얼·이미지요구·발표자노트 | — | `plan.md`, `script.md` |
| ⑤ | `pptx-reviewer` | **Opus** | 기획안 5축 다관점 평가(출처 hard-fail) | — | `review.md` |
| ⑥⑧ | `pptx-designer` | **Sonnet** | 디자인 3안 추천 + pptxgenjs 제작 | pptx-design-styles, lib/build_helpers.mjs | `design.md`, `output_vN.pptx` |
| ⑦ | `pptx-imagegen` | **Sonnet** | 이미지 조달(사용자 제공/Codex 생성) | **codex-imagegen** | `image-manifest.md`, `assets/generated/*` |
| ⑨ | `pptx-inspector` | **Opus** | 산출물 6축 검수(정부양식·접근성·이미지) | document-skills:pptx, LibreOffice | `inspection.md`, `output.pptx` |

> 모델 배정: 전략 기획(planner)·평가(reviewer)·최종 검증(inspector)에 **Opus**(평가자 ≥ 생성자 원칙). 수집·정리·제작·이미지는 **Sonnet**으로 비용효율.

## 병렬 수행 구간 (속도 최적화)

오케스트레이터는 아래 구간에서 Task를 **동시 호출**한다.

| 구간 | 병렬 대상 | 근거 |
|------|----------|------|
| **P-A** | ② Researcher ∥ ②' Design-Analyst | 콘텐츠 리서치와 디자인 자산 분석은 상호 독립 |
| **P-B** | (researcher 내부) 주제 리서치 ∥ 레퍼런스 조사 | 두 검색은 독립 |
| **P-C** | ⑥ Designer(디자인 추천) ∥ ⑦ Imagegen(Codex 생성) | 둘 다 plan.md만 의존. 빌드 전 동기화 |
| P-D(옵션) | ⑤ Reviewer 3개 렌즈(논리·청중·팩트) 병렬 | 평가 관점 독립 — 비용 여유 시 |

동기화 지점: ③ factcheck는 ② 완료 후 시작(데이터부록 의존), ②'와는 무관하게 병행. ⑧ 빌드는 ⑥ 디자인 확정 + ⑦ 이미지 준비가 **모두** 끝난 뒤 시작.

## 피드백 루프 (재작업)

- **Loop A — 기획안**: reviewer < 80(또는 축 < 12, 또는 출처 hard-fail) → planner 재작성. **최대 3회.**
- **Loop B — 산출물**: inspector < 102/120(85%, 또는 축 < 13, 기술무결성 < 18, 치명결함) → designer 재제작. **최대 3회.**
- 재작업은 **결함 리스트로 지적된 부분만 표적 수정**(외과적). 통과 부분 보존.
- **수렴 추적**: 회차별 총점 추세 기록, 동일 결함 2회 반복 시 명시.
- **3회 후 미달 시**: 자동 중단하고 **최선 버전 + 잔여 결함 리포트**를 제출(fallback) 후 사용자 수동 개입 요청.

## HITL 게이트 (반드시 승인)

| 게이트 | 시점 | 승인 내용 |
|--------|------|----------|
| **Gate 0** | intake 후 | 발표 브리프(brief.md) 확정 |
| **Gate 1** | reviewer 통과 후 | 기획안(plan.md) 확정 |
| **Gate 2+3** | designer 디자인 3안 제시 | 디자인 택1 **+** 필요요소(폰트·템플릿·로고·보유 이미지) **한 번에** |
| **Gate 4** | inspector 통과 후 | 최종 output.pptx 인수 |

## 활용 스킬

| 스킬 | 용도 | 사용 단계 |
|------|------|----------|
| `insane-search` | 자료 검색(차단·로그인 사이트 우회, 정부 누리집/통계/보도자료) | ② researcher, ③ factchecker |
| `insane-design` | (URL/CSS) 디자인 시스템 추출 | ②' design-analyst (웹 레퍼런스 한정) |
| **`pptx-analyze`** (프로젝트 전용) | **로컬 .pptx 디자인·구조·이미지·마스터·그리드 분석 → `<파일명>.design.md` + `.elements.json`(+ 카탈로그·Vision)** | **②' design-analyst (로컬 pptx 분석의 기본)** |
| `codex-imagegen` | Codex로 슬라이드 이미지 직접 생성 | ⑦ imagegen |
| `pptx-design-styles` | 30종 모던 디자인 스타일 참고 | ⑥ designer |
| `document-skills:pptx` | python-pptx로 .pptx 생성·읽기 | ⑥⑧ designer, ⑨ inspector |
| LibreOffice (`soffice.exe`) | HWP 변환 / 검수용 PDF 렌더 | ② researcher, ⑨ inspector |

## 평가 기준 요약

**기획안(reviewer, 100점)** — 통과: ≥80 AND 각 축 ≥12. **Hard-fail**: 출처 없는 수치/ factcheck ❌ 사용.
논리흐름 · 메시지명확성 · 청중적합성 · 분량적정성 · 근거정확성 (각 20)

**산출물(inspector, 120점)** — 통과: ≥102(85%) AND 각 축 ≥13 AND 기술무결성 ≥18. **치명결함 즉시 미달**.
기획충실도 · 디자인완성도 · 가독성 · 콘텐츠정확성 · 기술무결성 · 정부양식/접근성 (각 20)

## 발표 유형별 스토리 구조

| 유형 | 구조 |
|------|------|
| 업무계획 발표 | 추진배경 → 성과/한계 → 비전·목표 → 핵심과제(3~5) → 일정·재원 → 기대효과 |
| 정책 소개 | 현황·문제 → 필요성 → 정책내용(대상·혜택·방법) → 기대효과 → 신청 안내 |
| 일반 강의 | 도입 → 개념·이론 → 사례·적용 → 정리·요약 → Q&A/실습 |

## 명령어

환경: Windows · Node v24 · Python(pptx·fitz·PIL) · LibreOffice · Codex CLI. (모두 설치됨)

- **의존성**: `npm install pptxgenjs` — 루트에서 1회(`lib/`와 모든 프로젝트가 공유)
- **덱 빌드**: `cd projects/<...> && node build.mjs` — build.mjs는 `import * as H from "../../lib/build_helpers.mjs"`
- **검수 렌더**: `python lib/render_contact.py <output_vN.pptx>` → PDF + 컨택트시트 PNG
- **pptx 분석**: `pptx-analyze` 스킬, 또는 `python lib/extract_design.py <a.pptx>` → `extract_layout.py` → `analyze_more.py` → `aggregate_catalog.py assets`
- **HWP 변환**: `"C:\Program Files\LibreOffice\program\soffice.exe" --headless --convert-to "txt:Text" <file.hwp>`
- **이미지 생성**: `codex exec --skip-git-repo-check "다음 설명의 이미지를 생성해줘: ..."` (gpt-image, 결과 `~/.codex/generated_images/<세션>/`)

## 폴더 구조

```
PPTX 기획/
├─ CLAUDE.md                  # 오케스트레이션 규칙
├─ .claude/agents/            # 9개 서브에이전트
│   ├─ pptx-intake.md  pptx-researcher.md  pptx-design-analyst.md
│   ├─ pptx-factchecker.md  pptx-planner.md  pptx-reviewer.md
│   └─ pptx-designer.md  pptx-imagegen.md  pptx-inspector.md
├─ .claude/skills/pptx-analyze/  # 프로젝트 전용 pptx 분석 스킬 (md+json 생성)
├─ references/                # 사용자 제공 자료(HWP/PDF/PPTX/이미지) — ②·②' 분석
├─ assets/                    # 폰트·템플릿·로고·CI색
│   └─ generated/             # ⑦ Codex 생성 이미지
├─ lib/                       # 재사용 빌드·분석 자산
│   ├─ build_helpers.mjs      # pptxgenjs 헬퍼 + 하우스룰(L2~L7)·색 안전처리(normHex)
│   ├─ render_contact.py      # .pptx → PDF 렌더 + 컨택트시트(검수용)
│   ├─ design-tokens.md       # design.md 미제공 시 기본 정부 스타일 토큰
│   ├─ extract_design.py · extract_layout.py · analyze_more.py    # pptx 분석 → design.md/elements.json
│   └─ aggregate_catalog.py · build_vision_montage.py · append_vision.py
├─ workflow/                  # n8n 워크플로우(JSON) + 시각화(HTML)
└─ projects/
    └─ <YYYYMMDD_주제>/
        ├─ brief.md  research.md  design-ref.md  factcheck.md
        ├─ plan.md  script.md  review.md  design.md  image-manifest.md
        ├─ inspection.md  decisions.md       # 의사결정·승인·재작업 로그
        ├─ output_v1.pptx …                  # 제작 버전
        └─ output.pptx                       # 최종 통과본
```

## 작업 시작 방법

사용자가 주제/자료를 주면:
1. `projects/<YYYYMMDD_주제>/` 생성, `references/`·`assets/` 제공물 확인
2. ① intake 실행 → **Gate 0**
3. **P-A 병렬**(② researcher ∥ ②' design-analyst) → ③ factcheck → ④ planner → ⑤ reviewer → **Gate 1**
4. **P-C 병렬**(⑥ designer ∥ ⑦ imagegen) → **Gate 2+3** → ⑧ build → ⑨ inspector → **Gate 4**
5. 모든 게이트 승인·재작업 사유를 `decisions.md`에 누적 기록

## 학습 누적 & 랩업(Wrap-up) 일괄 반영

산출물에 대한 사용자 피드백을 모아 워크플로우에 영구 반영하는 학습 루프.

- **즉시 누적**: 사용자가 산출물에 대해 의견을 주면, `learning.md`(시스템 루트)에 즉시 기록한다 — 피드백 · 도출 규칙 · 대상 에이전트 · `status: pending`.
- **랩업 트리거**: 사용자가 **"랩업 / wrap up / 학습 반영 / 마무리 반영"** 을 요청하면 오케스트레이터는 아래를 수행한다:
  1. `learning.md`의 `status: pending` 항목을 모두 읽는다.
  2. 각 학습을 **대상 에이전트 정의(`.claude/agents/*.md`)에 영구 규칙으로 반영**한다(해당 에이전트의 "원칙/제작 규칙/검수 항목"에 추가·수정).
  3. 반영한 항목을 `learning.md`의 **Applied 섹션으로 이동**하고 반영된 파일을 기록, `decisions.md`에도 로그.
  4. 무엇을 어디에 반영했는지 요약 보고한다.
- **효과**: 이후 모든 PPTX 제작에서 `pptx-designer`·`pptx-inspector` 등이 누적 학습을 자동으로 따른다. (designer/inspector는 작업 전 `learning.md`의 Applied 규칙도 참조한다.)
- 적용된 학습(L1~L9, Applied): 캡션 제외 · 어절 줄바꿈 금지 · 폰트 확대 · 분량 균형 · 박스 균등 여백 · 연관 이미지 다수 배치 · 키워드 색강조 · 사용자 수정본 역반영 · **실사 이미지 우선**.

## 주의사항 (Gotchas)

- **폰트**: Pretendard 미설치 시 `맑은 고딕`(정부표준)으로 폴백. 미설치 폰트는 LibreOffice 렌더에서 깨질 수 있음(임베딩/설치 필요).
- **pptxgenjs 색**: 6자리 hex 문자열만 허용(3자리·객체·숫자면 크래시) → `build_helpers.normHex()`로 안전 처리.
- **캔버스 2배**: 일부 외부 데크는 26.67×15in(표준 13.33×7.5의 2배) → pt 값도 2배. 분석값 차용 시 배율 감안.
- **이모지**: LibreOffice 렌더에서 흑백/박스로 나올 수 있음(원본 PowerPoint와 다름). 검수 시 이 차이 인지.
- **soffice 충돌**: LibreOffice가 이미 실행 중이면 변환 실패 → `taskkill /F /IM soffice.exe` 후 재시도.

## 작성 원칙

- **출처 없는 수치·사실을 만들지 않는다.** 불확실하면 "확인 필요". (factchecker가 hard-gate)
- 이미지는 **사용자 제공 또는 Codex 생성만** 사용(웹 무단 수집 금지).
- 중앙부처 톤: 단정·신뢰·근거 중심. 가독성 우선.
- 재작업은 지적 부분만 외과적으로 수정한다.
