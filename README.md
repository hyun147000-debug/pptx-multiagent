# PPTX 기획·제작 멀티에이전트 시스템

주제 또는 자료를 입력하면 **브리프 → 리서치 → 검증 → 기획 → 평가 → 디자인 → 이미지 → 제작 → 검수** 과정을 거쳐 실무에서 바로 쓸 수 있는 **편집 가능한 `.pptx` + 발표 스크립트**를 산출하는 Claude Code 기반 멀티에이전트 파이프라인입니다.

메인 세션이 **오케스트레이터**로서 파이프라인을 진행하며, **4개 HITL 게이트**(승인)에서만 멈춰 사용자 확인을 받고 나머지 구간은 자동 진행합니다. 병렬 가능한 구간은 동시에 실행해 시간을 단축합니다.

## 파이프라인

```
[입력: 주제 또는 자료]
   ① intake ─────────────────────── Gate 0: 브리프 확정
        │
   ┌─ 병렬 ──────────────────────────────────────┐
   │ ② researcher        ②' design-analyst       │
   │   (콘텐츠·레퍼런스)     (디자인 자산 분석)        │
   └───────┬──────────────────────────────────────┘
   ③ factchecker (수치·출처 검증, 환각 차단)
        │
   ④ planner (스토리·슬라이드·발표자노트)
        │
   ⑤ reviewer (5축 평가) ── ≥80 ── Gate 1: 기획안 확정
        │
   ┌─ 병렬 ──────────────────────────────────────┐
   │ ⑥ designer(디자인 3안)   ⑦ imagegen(이미지)   │
   └───────┬──────────────────────────────────────┘
   Gate 2+3: 디자인 택1 + 필요요소
        │
   ⑧ build (pptxgenjs)
        │
   ⑨ inspector (6축 검수) ── ≥85% ── Gate 4: 최종 인수
        │
[산출: output.pptx + script.md]
```

## 에이전트 (9개)

| 단계 | 에이전트 | 모델 | 역할 | 산출물 |
|------|----------|------|------|--------|
| ① | `pptx-intake` | Sonnet | 발표 브리프 확정(목적·청중·시간·톤·마감) | `brief.md` |
| ② | `pptx-researcher` | Sonnet | 콘텐츠·레퍼런스 수집, 데이터부록(출처) | `research.md` |
| ②' | `pptx-design-analyst` | Sonnet | 사용자 제공 디자인 자산 분석 | `design-ref.md` |
| ③ | `pptx-factchecker` | Sonnet | 수치·출처 검증(환각 차단) | `factcheck.md` |
| ④ | `pptx-planner` | Opus | 스토리·슬라이드·비주얼·발표자노트 | `plan.md`, `script.md` |
| ⑤ | `pptx-reviewer` | Opus | 기획안 5축 다관점 평가 | `review.md` |
| ⑥⑧ | `pptx-designer` | Sonnet | 디자인 3안 추천 + pptxgenjs 제작 | `design.md`, `output_vN.pptx` |
| ⑦ | `pptx-imagegen` | Sonnet | 이미지 조달(사용자 제공/Codex 생성) | `image-manifest.md` |
| ⑨ | `pptx-inspector` | Opus | 산출물 6축 검수(양식·접근성·이미지) | `inspection.md`, `output.pptx` |

> 모델 배정: 전략 기획·평가·최종 검증에 **Opus**(평가자 ≥ 생성자 원칙), 수집·정리·제작·이미지에 **Sonnet**(비용효율).

## 평가 기준

- **기획안**(reviewer, 100점) — 통과: ≥80 AND 각 축 ≥12. 출처 없는 수치는 hard-fail.
  논리흐름 · 메시지명확성 · 청중적합성 · 분량적정성 · 근거정확성 (각 20)
- **산출물**(inspector, 120점) — 통과: ≥102(85%) AND 각 축 ≥13 AND 기술무결성 ≥18.
  기획충실도 · 디자인완성도 · 가독성 · 콘텐츠정확성 · 기술무결성 · 양식/접근성 (각 20)

## 피드백 루프 (재작업)

- **Loop A — 기획안**: reviewer 미달 → planner 재작성(최대 3회)
- **Loop B — 산출물**: inspector 미달 → designer 재제작(최대 3회)
- 재작업은 결함 리스트로 지적된 부분만 **표적 수정**(통과 부분 보존), 회차별 수렴 추적
- 3회 후에도 미달 시 최선 버전 + 잔여 결함 리포트 제출 후 수동 개입 요청

## 학습 누적 (Wrap-up)

산출물 피드백을 `learning.md`에 즉시 누적하고, "랩업" 요청 시 대상 에이전트 정의(`.claude/agents/*.md`)에 **영구 규칙으로 반영**합니다. 이후 모든 제작에서 자동 적용됩니다.

## 발표 유형별 스토리 구조

| 유형 | 구조 |
|------|------|
| 업무계획 발표 | 추진배경 → 성과/한계 → 비전·목표 → 핵심과제 → 일정·재원 → 기대효과 |
| 정책 소개 | 현황·문제 → 필요성 → 정책내용 → 기대효과 → 신청 안내 |
| 일반 강의 | 도입 → 개념·이론 → 사례·적용 → 정리·요약 → Q&A/실습 |

## 환경 & 명령어

환경: Windows · Node v24 · Python(pptx·fitz·PIL) · LibreOffice · Codex CLI

```bash
# 의존성 (루트에서 1회, lib/와 모든 프로젝트가 공유)
npm install pptxgenjs

# 덱 빌드
cd projects/<...> && node build.mjs

# 검수 렌더 (PDF + 컨택트시트 PNG)
python lib/render_contact.py <output_vN.pptx>

# pptx 분석 (design.md + elements.json 생성)
python lib/extract_design.py <a.pptx>
```

## 폴더 구조

```
.
├─ CLAUDE.md              # 오케스트레이션 규칙
├─ .claude/agents/        # 9개 서브에이전트
├─ .claude/skills/        # pptx-analyze (로컬 pptx 분석 스킬)
├─ lib/                   # 빌드·분석·렌더 자산
│   ├─ build_helpers.mjs  # pptxgenjs 헬퍼 + 하우스룰·색 안전처리
│   └─ extract_design.py · render_contact.py · ...
├─ workflow/              # n8n 워크플로우(JSON) + 시각화(HTML)
├─ learning.md           # 학습 누적 로그
└─ projects/<YYYYMMDD_주제>/   # 프로젝트별 산출물(기획 문서·빌드 스크립트)
```

> **참고**: 디자인 애셋(`assets/`)과 PPTX 산출물(`*.pptx` · `*.pdf` · 이미지)은 `.gitignore`로 제외되어 로컬에만 보관됩니다.

## 작성 원칙

- 출처 없는 수치·사실을 만들지 않는다. 불확실하면 "확인 필요" (factchecker가 hard-gate)
- 이미지는 사용자 제공 또는 Codex 생성만 사용
- 신뢰·근거 중심, 가독성 우선
- 재작업은 지적 부분만 외과적으로 수정
