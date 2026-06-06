// build_helpers.mjs — 재사용 pptxgenjs 헬퍼 라이브러리
// GrowUp 디자인 시스템 + learning.md L1~L9 하우스룰 내장.
// 사용: import * as H from "../../lib/build_helpers.mjs";
//       const pptx = H.newDeck(); const s = pptx.addSlide(); H.header(s,"OVERVIEW","제목");
import pptxgen from "pptxgenjs";

export const PW = 13.333, PH = 7.5, MX = 0.9;
export let FONT = "맑은 고딕"; // Pretendard 미설치 시 정부표준 대체. setFont()로 변경.
export const setFont = (f) => { FONT = f; };

// 기본 색 토큰(보라 시그니처). design.md / design-ref.md 가 있으면 호출부에서 덮어쓴다.
export const C = {
  primary: "7C6BFF", primaryDk: "5A49C9", primaryLt: "EDEAFB",
  warm: "FCEFE6", lilac: "EEEAF7", white: "FFFFFF",
  dark: "241C45", darkCard: "33295E",
  ink: "1F1B2E", body: "4A4658", gray: "8A8696", teal: "2BB6A3",
  gold: "F4B740", // 보라/다크 배경 강조용
};

// 색상 정규화(검수자 L: 색 타입 크래시 방지) — 3자리→6자리, #제거, 객체/숫자 폴백
export function normHex(c, fallback = "333333") {
  if (typeof c === "number") c = c.toString(16).padStart(6, "0");
  if (c && typeof c === "object" && "r" in c)
    c = [c.r, c.g, c.b].map((v) => Number(v).toString(16).padStart(2, "0")).join("");
  if (typeof c !== "string") return fallback;
  c = c.replace("#", "");
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  return /^[0-9a-fA-F]{6}$/.test(c) ? c.toUpperCase() : fallback;
}

export function newDeck(font) {
  if (font) setFont(font);
  const pptx = new pptxgen();
  pptx.defineLayout({ name: "W", width: PW, height: PH });
  pptx.layout = "W";
  return pptx;
}

export const shadow = (color = "9B86FF", opacity = 0.28, blur = 16, offset = 5) =>
  ({ type: "outer", color: normHex(color), opacity, blur, offset, angle: 90 });

// 도형 — 색은 normHex로 안전 처리
const fillOf = (o) => (o.fill && o.fill.color ? { ...o.fill, color: normHex(o.fill.color) } : o.fill);
export const txt = (s, t, o = {}) => s.addText(t, { fontFace: FONT, color: normHex(o.color || C.ink), margin: 0, ...o, color: normHex(o.color || C.ink) });
export const rrect = (s, x, y, w, h, o = {}) => s.addShape("roundRect", { x, y, w, h, rectRadius: o.rectRadius ?? 0.14, ...o, fill: fillOf(o) });
export const rect = (s, x, y, w, h, o = {}) => s.addShape("rect", { x, y, w, h, ...o, fill: fillOf(o) });
export const ell = (s, x, y, w, h, o = {}) => s.addShape("ellipse", { x, y, w, h, ...o, fill: fillOf(o) });
export const deco = (s, x, y, w, h, color) => ell(s, x, y, w, h, { fill: { color }, line: { type: "none" } });

// L7 키워드 강조 — 키워드만 색+볼드, \n 자연 개행 유지(L2)
export function runs(text, keys = [], base = C.body, hi = C.primary) {
  const out = [], lines = String(text).split("\n");
  lines.forEach((line, li) => {
    let segs = [{ t: line, hl: false }];
    keys.forEach((k) => {
      const next = [];
      segs.forEach((sg) => {
        if (sg.hl || !sg.t.includes(k)) { next.push(sg); return; }
        const parts = sg.t.split(k);
        parts.forEach((p, i) => { if (p) next.push({ t: p, hl: false }); if (i < parts.length - 1) next.push({ t: k, hl: true }); });
      });
      segs = next;
    });
    if (!segs.length) segs = [{ t: "", hl: false }];
    segs.forEach((sg, si) => {
      const end = si === segs.length - 1 && li < lines.length - 1;
      out.push({ text: sg.t, options: { color: normHex(sg.hl ? hi : base), bold: !!sg.hl, breakLine: end } });
    });
  });
  return out;
}

export const eyebrow = (s, t, x, y, color = C.primary, align = "left", w = 9) =>
  txt(s, t, { x, y, w, h: 0.32, fontSize: 13.5, bold: true, color, charSpacing: 3, align });

// L3 폰트 확대 기준 내장(슬라이드 제목 34)
export const header = (s, eb, title, titleKeys = []) => {
  eyebrow(s, eb, MX, 0.6);
  txt(s, titleKeys.length ? runs(title, titleKeys, C.ink, C.primary) : title,
    { x: MX, y: 0.95, w: 11.5, h: 0.95, fontSize: 34, bold: true, color: C.ink });
};

export const pageNo = (s, n, total) =>
  txt(s, `${n} / ${total}`, { x: PW - 1.6, y: PH - 0.5, w: 1.2, h: 0.3, fontSize: 9.5, color: C.gray, align: "right" });

export const iconCircle = (s, x, y, d, emoji, bg = C.primaryLt, fs = 30) => {
  ell(s, x, y, d, d, { fill: { color: bg }, line: { type: "none" } });
  txt(s, emoji, { x, y, w: d, h: d, fontSize: fs, align: "center", valign: "middle" });
};

// 이미지 + 흰 라운드 프레임(없으면 빈 카드). 종횡비 안전 cover 크롭(L6 이미지).
export const imgCard = (s, path, x, y, w, h) => {
  if (!path) { rrect(s, x, y, w, h, { rectRadius: 0.18, fill: { color: C.white }, line: { type: "none" }, shadow: shadow("C9BEEA", 0.25, 14, 4) }); return; }
  rrect(s, x - 0.12, y - 0.12, w + 0.24, h + 0.24, { rectRadius: 0.2, fill: { color: C.white }, line: { type: "none" }, shadow: shadow("9B86FF", 0.22, 16, 5) });
  s.addImage({ path, x, y, w, h, sizing: { type: "cover", w, h } });
};

// L5 균등 여백 헬퍼 — 카드 내부 박스를 PAD로 좌우 동일·세로 중앙 정렬할 좌표 계산
export const pad = (x, y, w, h, p = 0.34) => ({ x: x + p, y: y + p, w: w - p * 2, h: h - p * 2 });

/* 하우스룰 요약 (learning.md Applied 와 동기화 — 빌드 시 반드시 준수)
 * L2 줄바꿈: 어절 경계에서만 \n. 박스 폭을 가장 긴 줄에 맞춘다.
 * L3 폰트: 제목≥34 / 디바이더≥40 / 카드 18~24 / 본문 14~16 / 캡션 11~12.
 * L4 분량: 카드·슬라이드 줄 수·밀도 균일(카드 본문 2줄).
 * L5 여백: pad()로 좌우 동일 + 세로 중앙, margin:0, 라벨 valign·align center.
 * L6 이미지: 실사 우선, 표지·디바이더·마무리 등 곳곳. imgCard 사용.
 * L7 강조: runs()로 키워드만 색+볼드(밝은 배경 primary / 보라·다크 gold), 텍스트당 1~2개.
 */
