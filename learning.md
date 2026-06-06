# learning.md — 사용자 피드백 학습 로그

> 모든 프로젝트에서 **산출물에 대해 사용자가 준 의견**을 즉시 누적 기록한다.
> 사용자가 **"랩업 / wrap up / 학습 반영"** 을 요청하면 `status: pending` 항목을
> 대상 에이전트 정의(`.claude/agents/*.md`)에 영구 반영하고 `status: applied` 로 갱신한다.
> → 이후 모든 PPTX 제작에 자동 적용.

---

## 누적 학습 (Pending)

(없음 — 2026-06-06 랩업으로 L1~L8 전부 반영 완료)

---

## 적용 이력 (Applied)

### 2026-06-06 랩업 — L1~L8 일괄 반영 (출처: 20260606_AI민생10대프로젝트)

| # | 학습 | 도출 규칙 | 반영 파일 |
|---|------|----------|-----------|
| L1 | 무관한 사진 캡션 제외 | 원문의 본문 무관 캡션·출처 문구는 콘텐츠/슬라이드에서 제외 | `pptx-researcher.md`, `pptx-planner.md` |
| L2 | 어절 중간 줄바꿈 금지 | 자연 경계 수동 개행 + 박스 폭 맞춤 | `pptx-designer.md`(하우스룰) |
| L3 | 폰트 전체 확대 | 제목 ≥34 / 디바이더 ≥40 / 카드 18~24 / 본문 14~16 / 캡션 11~12 | `pptx-designer.md`(하우스룰) |
| L4 | 분량·줄 수 균형 | 카드·슬라이드 줄 수·밀도 균일 | `pptx-designer.md`(하우스룰) |
| L5 | 박스 상하좌우 균등 여백 | PAD 상수+세로중앙+margin:0, 라벨 valign·align center | `pptx-designer.md`, `pptx-inspector.md`(검수) |
| L6 | 연관 이미지 다수 배치 | Codex 생성 다수 → 표지·디바이더·마무리 곳곳, 모든 슬라이드 시각요소 1+ | `pptx-imagegen.md`, `pptx-designer.md` |
| L7 | 중요 키워드 색 강조 | 핵심어만 색+볼드(밝은 배경=보라 #7C6BFF / 보라·다크=골드 #F4B740), 텍스트당 1~2개 | `pptx-designer.md`(하우스룰) |
| L8 | 사용자 수정본 역반영 | 수정 .pptx ↔ 빌드본 정밀 비교 후 build 소스 역반영 | `pptx-designer.md`, `pptx-inspector.md` |
| L9 | 실사 이미지 우선 | 과제별로 다르되 **원칙적으로 실사(photorealistic) 이미지를 우선** 고려, 일러스트/플랫은 과제·디자인이 적합할 때만 | `pptx-imagegen.md`, `pptx-planner.md` |

> 이후 designer/inspector/imagegen은 작업 전 본 Applied 규칙을 항상 참조한다.
