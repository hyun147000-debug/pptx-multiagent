// 'AI 민생 10대 프로젝트' — GrowUp 디자인 시스템(pptxgenjs) 차용 · v3
// 반영: 사용자 수정(폰트 확대) / 키워드 색상 강조 / 박스 내 상하좌우 균등 여백 / 자연 개행 / Codex 이미지
import pptxgen from "pptxgenjs";
import fs from "fs";

const pptx = new pptxgen();
const PW = 13.333, PH = 7.5, MX = 0.9;
pptx.defineLayout({ name: "W", width: PW, height: PH });
pptx.layout = "W";

const FONT = "맑은 고딕";
const C = {
  primary: "7C6BFF", primaryDk: "5A49C9", primaryLt: "EDEAFB",
  warm: "FCEFE6", lilac: "EEEAF7", white: "FFFFFF",
  dark: "241C45", darkCard: "33295E",
  ink: "1F1B2E", body: "4A4658", gray: "8A8696", teal: "2BB6A3",
  gold: "F4B740", // 디바이더(보라 배경) 강조용
};
const TOTAL = 12;
const IMG = (p) => (fs.existsSync(p) ? p : null);
const RR = pptx.ShapeType.roundRect, EL = pptx.ShapeType.ellipse, RC = pptx.ShapeType.rect;
const shadow = (color = "9B86FF", opacity = 0.28, blur = 16, offset = 5) => ({ type: "outer", color, opacity, blur, offset, angle: 90 });
const txt = (s, t, o) => s.addText(t, { fontFace: FONT, color: C.ink, margin: 0, ...o });
const rrect = (s, x, y, w, h, o = {}) => s.addShape(RR, { x, y, w, h, rectRadius: o.rectRadius ?? 0.14, ...o });
const rect = (s, x, y, w, h, o = {}) => s.addShape(RC, { x, y, w, h, ...o });
const ell = (s, x, y, w, h, o = {}) => s.addShape(EL, { x, y, w, h, ...o });
const deco = (s, x, y, w, h, color) => ell(s, x, y, w, h, { fill: { color }, line: { type: "none" } });

// 키워드 강조 runs 생성 (\n 자연 개행 유지, 키워드만 색+볼드)
function runs(text, keys = [], base = C.body, hi = C.primary) {
  const out = [];
  const lines = String(text).split("\n");
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
    if (segs.length === 0) segs = [{ t: "", hl: false }];
    segs.forEach((sg, si) => {
      const isLineEnd = si === segs.length - 1 && li < lines.length - 1;
      out.push({ text: sg.t, options: { color: sg.hl ? hi : base, bold: sg.hl ? true : false, breakLine: isLineEnd } });
    });
  });
  return out;
}

const eyebrow = (s, t, x, y, color = C.primary, align = "left", w = 9) =>
  txt(s, t, { x, y, w, h: 0.32, fontSize: 13.5, bold: true, color, charSpacing: 3, align });
const header = (s, eb, title, titleKeys = []) => {
  eyebrow(s, eb, MX, 0.6);
  txt(s, titleKeys.length ? runs(title, titleKeys, C.ink, C.primary) : title, { x: MX, y: 0.95, w: 11.5, h: 0.95, fontSize: 34, bold: true, color: C.ink });
};
const pageNo = (s, n) => txt(s, `${n} / ${TOTAL}`, { x: PW - 1.6, y: PH - 0.5, w: 1.2, h: 0.3, fontSize: 9.5, color: C.gray, align: "right" });
const iconCircle = (s, x, y, d, emoji, bg = C.primaryLt, fs = 30) => {
  ell(s, x, y, d, d, { fill: { color: bg }, line: { type: "none" } });
  txt(s, emoji, { x, y, w: d, h: d, fontSize: fs, align: "center", valign: "middle" });
};
const imgCard = (s, path, x, y, w, h) => {
  if (!path) { rrect(s, x, y, w, h, { rectRadius: 0.18, fill: { color: C.white }, line: { type: "none" }, shadow: shadow("C9BEEA", 0.25, 14, 4) }); return; }
  rrect(s, x - 0.12, y - 0.12, w + 0.24, h + 0.24, { rectRadius: 0.2, fill: { color: C.white }, line: { type: "none" }, shadow: shadow("9B86FF", 0.22, 16, 5) });
  s.addImage({ path, x, y, w, h, sizing: { type: "cover", w, h } });
};

const I_COVER = IMG("img/cover.png"), I_AGENT = IMG("img/agent.png"), I_NET = IMG("img/network.png"), I_CLOSE = IMG("img/closing.png");

// ---------- DATA ----------
const FOUR = [
  { e: "🛒", t: "농축산물 알뜰 소비정보 플랫폼", d: "가격 동향 분석과 위치 기반 최적 구매처·\n대체 식재료 추천으로 합리적 소비 지원", hl: ["합리적 소비"], m: "농식품부", k: "아일리스프런티어" },
  { e: "🧾", t: "AI 국세상담 시스템", d: "납세자에게 개인화된 AI 전화·챗봇 상담을\n제공해 상담 편의를 극대화", hl: ["상담 편의"], m: "국세청", k: "아이티센엔텍" },
  { e: "🛡️", t: "아동·청소년 위기대응", d: "온라인 성착취물 자동 탐지와 SNS 위기징후\nAI 분석으로 신속한 상담 연계 지원", hl: ["신속한 상담 연계"], m: "성평등가족부", k: "에이펙스이에스씨·이투온" },
  { e: "🏛️", t: "AI 국가유산 해설 솔루션", d: "시간·공간·언어 제약 없이 수요자별\n맞춤형 AI 해설 서비스를 제공", hl: ["맞춤형 AI 해설"], m: "국가유산청", k: "올포랜드" },
];
const SIX = [
  { e: "🏪", t: "소상공인 AI\n창업·경영 컨설팅", m: "중기부", k: "업스테이지" },
  { e: "💊", t: "인체적용제품\nAI 안전 지킴이", m: "식약처", k: "포티투마루" },
  { e: "👮", t: "AI 모두의 경찰관", m: "경찰청", k: "씨에스리" },
  { e: "📋", t: "AI 통합인허가\n사전진단", m: "국토부", k: "비아이매트릭스" },
  { e: "📞", t: "AI 보이스피싱\n공동대응 플랫폼", m: "과기정통부", k: "엑셈" },
  { e: "🚁", t: "항공 채증영상\n해양 위험분석 AI", m: "해양경찰청", k: "지엠티" },
];

// ========== S1. 표지 ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.warm };
  deco(s, -2.4, 4.2, 5.6, 5.6, C.lilac);
  eyebrow(s, "AI FOR THE PEOPLE  ·  과학기술정보통신부", MX, 1.45);
  txt(s, [
    { text: "‘AI 민생 10대 프로젝트’\n", options: { color: C.ink } },
    { text: "본격 가동", options: { color: C.primary } },
  ], { x: MX, y: 1.95, w: 7.7, h: 2.2, fontSize: 47, bold: true, lineSpacingMultiple: 1.14 });
  txt(s, runs("국민이 일상에서 체감하는 AI 서비스를\n신속히 도입해 순차적으로 개시합니다", ["체감하는 AI", "순차적으로 개시"], C.body, C.primaryDk),
    { x: MX, y: 4.45, w: 7.4, h: 1.1, fontSize: 19, lineSpacingMultiple: 1.4 });
  rrect(s, MX, 5.85, 3.9, 0.6, { rectRadius: 0.3, fill: { color: C.primary }, line: { type: "none" }, shadow: shadow("9B86FF", 0.3, 10, 3) });
  txt(s, "2026. 6. 5.  합동보고회 개최", { x: MX, y: 5.85, w: 3.9, h: 0.6, fontSize: 14.5, bold: true, color: C.white, align: "center", valign: "middle" });
  imgCard(s, I_COVER, 8.75, 1.1, 3.7, 5.3);
})();

// ========== S2. 추진 개요 ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.warm };
  deco(s, 9.3, 3.1, 6.4, 6.4, C.lilac);
  header(s, "OVERVIEW", "국민이 일상에서 체감하는 AI", ["체감하는 AI"]);
  txt(s, runs("국민 효능감이 높은 분야에 인공지능 서비스를 신속히 도입해\nAI 혁신의 혜택을 전 국민에게 확산하는 핵심 프로젝트입니다", ["효능감이 높은", "신속히 도입", "전 국민", "핵심 프로젝트"], C.body, C.primaryDk),
    { x: MX, y: 2.1, w: 11.2, h: 1.0, fontSize: 17.5, lineSpacingMultiple: 1.4 });
  const rows = [
    ["목적", "국민 체감형 AI 서비스 확산", ["국민 체감형 AI"]],
    ["선정", "2024. 11. 과학기술관계장관회의 심의", ["심의"]],
    ["방식", "공모를 통해 우수 AI 기업 선정·개발", ["우수 AI 기업"]],
    ["지향", "AI 3대 강국 도약을 국민 체감 성과로", ["AI 3대 강국"]],
  ];
  let y = 3.45;
  rows.forEach(([k, v, hl]) => {
    rrect(s, MX, y, 1.85, 0.72, { rectRadius: 0.28, fill: { color: C.primary }, line: { type: "none" }, shadow: shadow("9B86FF", 0.22, 8, 3) });
    txt(s, k, { x: MX, y, w: 1.85, h: 0.72, fontSize: 16, bold: true, color: C.white, align: "center", valign: "middle" });
    txt(s, runs(v, hl, C.ink, C.primaryDk), { x: MX + 2.15, y, w: 8.9, h: 0.72, fontSize: 18, valign: "middle" });
    y += 0.9;
  });
  pageNo(s, 2);
})();

// ========== S3. 추진 경과 ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.warm };
  deco(s, -2.4, 3.7, 6.0, 6.0, C.lilac);
  header(s, "TIMELINE", "추진 경과");
  const steps = [
    ["2024. 11", "10대 과제 선정", "과학기술관계장관회의\n심의·확정"],
    ["~ 2025", "수행기업 선정", "공모를 통한\n서비스 개발 착수"],
    ["2026. 6. 5", "합동보고회", "추진계획 공유와\n핵심 과업 점검"],
    ["2026", "4대 서비스 개시", "올해 순차 개시·\n기능 고도화"],
    ["2027 상반기", "6대 서비스 개시", "나머지 과제\n서비스 완성"],
  ];
  const n = steps.length, gap = 11.533 / n, y0 = 3.5;
  rect(s, MX + 0.4, y0 + 0.4, 11.533 - 0.8, 0.04, { fill: { color: "D8CFF2" }, line: { type: "none" } });
  steps.forEach(([dt, t1, t2], i) => {
    const cx = MX + gap * i + gap / 2, last = i >= 3;
    ell(s, cx - 0.42, y0, 0.84, 0.84, { fill: { color: last ? C.primary : C.white }, line: { color: C.primary, width: 2.5 }, shadow: shadow("9B86FF", 0.25, 8, 3) });
    txt(s, String(i + 1), { x: cx - 0.42, y: y0, w: 0.84, h: 0.84, fontSize: 24, bold: true, color: last ? C.white : C.primary, align: "center", valign: "middle" });
    txt(s, dt, { x: cx - gap / 2 + 0.1, y: y0 - 0.6, w: gap - 0.2, h: 0.38, fontSize: 14, bold: true, color: last ? C.primary : C.primaryDk, align: "center" });
    txt(s, t1, { x: cx - gap / 2 + 0.1, y: y0 + 1.05, w: gap - 0.2, h: 0.42, fontSize: 16, bold: true, color: C.ink, align: "center" });
    txt(s, t2, { x: cx - gap / 2 + 0.1, y: y0 + 1.52, w: gap - 0.2, h: 0.8, fontSize: 13, color: C.body, align: "center", lineSpacingMultiple: 1.3 });
  });
  pageNo(s, 3);
})();

// ========== S4. 10대 한눈에 ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.white };
  deco(s, 9.6, 3.6, 6.4, 6.4, C.warm);
  header(s, "10 PROJECTS", "AI 민생 10대 프로젝트 한눈에", ["10대 프로젝트"]);
  const col = (x, w, title, items, accent) => {
    rrect(s, x, 2.25, w, 4.75, { rectRadius: 0.18, fill: { color: C.white }, line: { type: "none" }, shadow: shadow("C9BEEA", 0.22, 13, 4) });
    rrect(s, x, 2.25, w, 0.78, { rectRadius: 0.18, fill: { color: accent }, line: { type: "none" } });
    rect(s, x, 2.62, w, 0.41, { fill: { color: accent }, line: { type: "none" } });
    txt(s, title, { x: x + 0.35, y: 2.25, w: w - 0.7, h: 0.78, fontSize: 17.5, bold: true, color: C.white, valign: "middle" });
    let yy = 3.3;
    items.forEach((it, i) => {
      ell(s, x + 0.33, yy + 0.03, 0.4, 0.4, { fill: { color: accent }, line: { type: "none" } });
      txt(s, String(i + 1), { x: x + 0.33, y: yy + 0.03, w: 0.4, h: 0.4, fontSize: 13, bold: true, color: C.white, align: "center", valign: "middle" });
      txt(s, it.t.replace(/\n/g, " "), { x: x + 0.9, y: yy, w: w - 2.6, h: 0.46, fontSize: 13.5, bold: true, color: C.ink, valign: "middle" });
      txt(s, it.m, { x: x + w - 1.72, y: yy, w: 1.5, h: 0.46, fontSize: 11.5, color: C.gray, align: "right", valign: "middle" });
      yy += 0.6;
    });
  };
  col(MX, 5.5, "2026 · 올해 개시 4대", FOUR, C.primary);
  col(MX + 5.83, 5.5, "2027 상반기 · 6대", SIX, C.teal);
  pageNo(s, 4);
})();

// ========== Divider ==========
const divider = (eb, title, titleKeys, sub, subKeys, page, img) => {
  const s = pptx.addSlide(); s.background = { color: C.primary };
  deco(s, -2.6, -2.6, 7.4, 7.4, "8A79FF");
  deco(s, 8.0, 4.4, 7.2, 7.2, "6E5CF0");
  eyebrow(s, eb, MX, 2.55, C.primaryLt);
  txt(s, runs(title, titleKeys, C.white, C.gold), { x: MX, y: 2.95, w: 7.4, h: 1.6, fontSize: 44, bold: true, lineSpacingMultiple: 1.12 });
  txt(s, runs(sub, subKeys, "E5E0FB", C.white), { x: MX, y: 4.75, w: 7.0, h: 1.2, fontSize: 18, lineSpacingMultiple: 1.4 });
  txt(s, "과학기술정보통신부  ·  AI 민생 10대 프로젝트", { x: MX, y: PH - 0.7, w: 8, h: 0.32, fontSize: 11.5, color: "CFC7F4" });
  imgCard(s, img, 8.55, 1.75, 3.9, 3.95);
  pageNo(s, page);
};

// ========== S5. 디바이더 — 올해 4대 ==========
divider("PHASE 1 · 2026", "올해, 4대 서비스\n순차 개시", ["4대 서비스"], "AI 에이전트 기반 4대 프로젝트로 개발한\n대국민 서비스를 연내 선보입니다.", ["연내"], 5, I_AGENT);

// ========== S6. 올해 4대 카드 (균등 여백) ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.white };
  deco(s, 9.8, -2.2, 6.0, 6.0, C.warm);
  header(s, "PHASE 1 SERVICES", "2026년 개시 4대 프로젝트", ["4대 프로젝트"]);
  const cw = (11.533 - 0.5) / 2, ch = 2.0, gx = 0.5, gy = 0.4, x0 = MX, y0 = 2.3;
  const PAD = 0.34;
  FOUR.forEach((it, i) => {
    const x = x0 + (i % 2) * (cw + gx), y = y0 + Math.floor(i / 2) * (ch + gy);
    rrect(s, x, y, cw, ch, { rectRadius: 0.16, fill: { color: C.warm }, line: { type: "none" }, shadow: shadow("C9BEEA", 0.22, 11, 4) });
    iconCircle(s, x + PAD, y + (ch - 1.08) / 2, 1.08, it.e, C.white, 30);
    const tx = x + PAD + 1.28, tw = cw - PAD * 2 - 1.28;
    txt(s, it.t, { x: tx, y: y + 0.3, w: tw, h: 0.46, fontSize: 18.5, bold: true, color: C.ink, valign: "middle" });
    txt(s, runs(it.d, it.hl, C.body, C.primary), { x: tx, y: y + 0.78, w: tw, h: 0.62, fontSize: 13.5, lineSpacingMultiple: 1.3 });
    rrect(s, tx, y + ch - 0.5, tw, 0.4, { rectRadius: 0.2, fill: { color: C.primaryLt }, line: { type: "none" } });
    txt(s, `${it.m}  ·  ${it.k}`, { x: tx, y: y + ch - 0.5, w: tw, h: 0.4, fontSize: 11.5, bold: true, color: C.primaryDk, align: "center", valign: "middle" });
  });
  pageNo(s, 6);
})();

// ========== S7. 디바이더 — 내년 6대 ==========
divider("PHASE 2 · 2027 상반기", "내년 상반기,\n6대 서비스 개시", ["6대 서비스"], "소상공인 AI 컨설팅 등 나머지 6대 과제를\n국민이 실제 이용하도록 추진합니다.", ["실제 이용"], 7, I_NET);

// ========== S8. 내년 6대 그리드 (폰트 확대·균등) ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.warm };
  deco(s, -2.4, 3.8, 5.8, 5.8, C.lilac);
  header(s, "PHASE 2 SERVICES", "2027 상반기 개시 6대 프로젝트", ["6대 프로젝트"]);
  const cols = 3, cw = (11.533 - 0.5 * 2) / 3, ch = 2.25, gx = 0.5, gy = 0.38, x0 = MX, y0 = 2.25;
  const PAD = 0.34;
  SIX.forEach((it, i) => {
    const x = x0 + (i % cols) * (cw + gx), y = y0 + Math.floor(i / cols) * (ch + gy);
    rrect(s, x, y, cw, ch, { rectRadius: 0.16, fill: { color: C.white }, line: { type: "none" }, shadow: shadow("C9BEEA", 0.2, 10, 3) });
    iconCircle(s, x + PAD, y + PAD - 0.02, 0.9, it.e, C.primaryLt, 25);
    txt(s, runs(it.t, ["AI"], C.ink, C.primary), { x: x + PAD, y: y + 1.22, w: cw - PAD * 2, h: 0.62, fontSize: 16, bold: true, lineSpacingMultiple: 1.08 });
    txt(s, `${it.m} · ${it.k}`, { x: x + PAD, y: y + ch - PAD - 0.06, w: cw - PAD * 2, h: 0.34, fontSize: 12, bold: true, color: C.primaryDk });
  });
  pageNo(s, 8);
})();

// ========== S9. 추진 체계 (폰트 확대·균등) ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.white };
  deco(s, 9.6, 3.2, 6.2, 6.2, C.warm);
  header(s, "GOVERNANCE", "정부 · 민간 협력 추진 체계", ["협력"]);
  const card = (x, eb, title, lines, accent) => {
    const cw = 5.5, PAD = 0.4;
    rrect(s, x, 2.35, cw, 3.5, { rectRadius: 0.18, fill: { color: C.white }, line: { type: "none" }, shadow: shadow("C9BEEA", 0.22, 13, 4) });
    rrect(s, x + PAD, 2.72, 2.85, 0.58, { rectRadius: 0.29, fill: { color: accent }, line: { type: "none" } });
    txt(s, eb, { x: x + PAD, y: 2.72, w: 2.85, h: 0.58, fontSize: 13.5, bold: true, color: C.white, align: "center", valign: "middle" });
    txt(s, title, { x: x + PAD, y: 3.46, w: cw - PAD * 2, h: 0.5, fontSize: 20, bold: true, color: C.ink });
    txt(s, lines.map((t) => ({ text: t, options: { bullet: { code: "2022", indent: 16 }, breakLine: true } })),
      { x: x + PAD, y: 4.1, w: cw - PAD * 2, h: 1.5, fontSize: 16, color: C.body, lineSpacingMultiple: 1.4 });
  };
  const L1 = ["농식품부·국세청·성평등가족부·국가유산청", "중기부·식약처·경찰청·국토부·해양경찰청", "과기정통부 총괄, 과업·일정 점검"];
  const L2 = ["공모로 선정된 국내 우수 AI 기업", "프로젝트별 서비스 개발·고도화 수행", "정부·민간 역량 결집"];
  card(MX, "정부 · 협업부처", "9개 부처·기관 협업", L1, C.primary);
  card(MX + 5.83, "민간 · 수행기업", "우수 AI 기업이 개발", L2, C.teal);
  rrect(s, MX, 6.15, 11.533, 0.68, { rectRadius: 0.22, fill: { color: C.primaryLt }, line: { type: "none" } });
  txt(s, runs("신뢰하고 활용할 수 있는 국민 체감형 AI 서비스를 차질 없이 개발·개시", ["국민 체감형 AI", "차질 없이"], C.primaryDk, C.primary),
    { x: MX, y: 6.15, w: 11.533, h: 0.68, fontSize: 15, bold: false, align: "center", valign: "middle" });
  pageNo(s, 9);
})();

// ========== S10. 기대효과 (폰트 확대·균등) ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.white };
  deco(s, -2.2, -2.2, 5.8, 5.8, C.lilac);
  header(s, "IMPACT", "기대 효과");
  const items = [
    ["🤝", "국민 체감 확산", "일상에서 누리는 AI 혜택을\n효능감 높은 분야부터 도입", ["AI 혜택"]],
    ["⚙️", "공공행정 효율", "대국민 공공행정의\n편의성과 효율성을 제고", ["효율성"]],
    ["🛡️", "국민 안전 강화", "위기대응·보이스피싱 등\n국민 안전 영역을 강화", ["국민 안전"]],
  ];
  const cw = (11.533 - 0.6 * 2) / 3, ch = 3.5, gx = 0.6, y0 = 2.4;
  items.forEach(([e, t, d, hl], i) => {
    const x = MX + i * (cw + gx);
    rrect(s, x, y0, cw, ch, { rectRadius: 0.18, fill: { color: C.warm }, line: { type: "none" }, shadow: shadow("C9BEEA", 0.22, 11, 4) });
    iconCircle(s, x + cw / 2 - 0.7, y0 + 0.5, 1.4, e, C.white, 36);
    txt(s, t, { x: x + 0.3, y: y0 + 2.15, w: cw - 0.6, h: 0.55, fontSize: 24, bold: true, color: C.ink, align: "center" });
    txt(s, runs(d, hl, C.body, C.primary), { x: x + 0.3, y: y0 + 2.78, w: cw - 0.6, h: 0.6, fontSize: 16, align: "center", lineSpacingMultiple: 1.35 });
  });
  pageNo(s, 10);
})();

// ========== S11. 마무리 (인용) ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.warm };
  deco(s, -2.2, -2.0, 5.6, 5.6, C.lilac);
  eyebrow(s, "CLOSING", MX, 1.4);
  txt(s, [
    { text: "전 국민이 일상에서\n", options: { color: C.ink } },
    { text: "AI 혜택", options: { color: C.primary } },
    { text: "을 누리도록", options: { color: C.ink } },
  ], { x: MX, y: 1.85, w: 7.6, h: 1.9, fontSize: 44, bold: true, lineSpacingMultiple: 1.16 });
  txt(s, runs("“AI 3대 강국으로의 도약을 국민이 체감하는\n성과로 연결하기 위한 첫걸음이자,\n전 국민이 일상에서 AI 혜택을 누리게 하는 것도\n중요한 정책의 축입니다.”", ["AI 3대 강국", "국민이 체감", "AI 혜택"], C.body, C.primaryDk),
    { x: MX, y: 4.05, w: 7.5, h: 1.5, italic: true, fontSize: 16, lineSpacingMultiple: 1.4 });
  txt(s, "— 이도규 과학기술정보통신부 정보통신정책실장", { x: MX, y: 5.65, w: 7.5, h: 0.4, fontSize: 13.5, bold: true, color: C.primaryDk });
  const tags = ["국민 체감 AI", "민관 협력", "차질 없는 개시"];
  let tx = MX;
  tags.forEach((t) => {
    const w = 0.7 + t.length * 0.22;
    rrect(s, tx, 6.35, w, 0.54, { rectRadius: 0.28, fill: { color: C.white }, line: { color: C.primary, width: 1 }, shadow: shadow("C9BEEA", 0.2, 8, 2) });
    txt(s, t, { x: tx, y: 6.35, w, h: 0.54, fontSize: 13.5, bold: true, color: C.primaryDk, align: "center", valign: "middle" });
    tx += w + 0.3;
  });
  imgCard(s, I_CLOSE, 8.5, 1.5, 4.0, 4.8);
  pageNo(s, 11);
})();

// ========== S12. 다크 액션 ==========
(() => {
  const s = pptx.addSlide(); s.background = { color: C.dark };
  deco(s, -2.6, 3.6, 6.4, 6.4, "2E2456");
  deco(s, 9.8, -2.2, 6.4, 6.4, "2E2456");
  eyebrow(s, "WHAT'S NEXT", MX, 0.65, "B7A9FF");
  txt(s, runs("국민 삶의 질 향상으로 이어지는 AI", ["삶의 질 향상"], C.white, "B7A9FF"), { x: MX, y: 1.0, w: 11.5, h: 0.85, fontSize: 34, bold: true });
  const items = [
    ["2026", "4대 서비스\n순차 개시·고도화", "농축산물 · 국세상담\n아동·청소년 · 국가유산"],
    ["2027 상반기", "6대 서비스 개시", "소상공인 · 경찰관 · 안전\n인허가 · 보이스피싱 · 해양"],
    ["지속", "민관 협력 강화", "신뢰·활용 가능한 AI를\n차질 없이 구현"],
  ];
  const cw = (11.533 - 0.5 * 2) / 3, y0 = 2.4, ch = 3.55, PAD = 0.36;
  items.forEach(([dt, t, d], i) => {
    const x = MX + i * (cw + 0.5);
    rrect(s, x, y0, cw, ch, { rectRadius: 0.14, fill: { color: C.darkCard }, line: { type: "none" } });
    ell(s, x + PAD, y0 + PAD, 0.7, 0.7, { fill: { color: C.primary }, line: { type: "none" } });
    txt(s, String(i + 1), { x: x + PAD, y: y0 + PAD, w: 0.7, h: 0.7, fontSize: 20, bold: true, color: C.white, align: "center", valign: "middle" });
    txt(s, dt, { x: x + PAD, y: y0 + 1.25, w: cw - PAD * 2, h: 0.4, fontSize: 16.5, bold: true, color: C.gold });
    txt(s, t, { x: x + PAD, y: y0 + 1.72, w: cw - PAD * 2, h: 0.8, fontSize: 16, bold: true, color: C.white, lineSpacingMultiple: 1.2 });
    txt(s, d, { x: x + PAD, y: y0 + 2.62, w: cw - PAD * 2, h: 0.8, fontSize: 12.5, color: "C9C2E8", lineSpacingMultiple: 1.35 });
  });
  txt(s, "과학기술정보통신부  ·  2026. 6. 5. 합동보고회", { x: MX, y: PH - 0.62, w: 11.533, h: 0.35, fontSize: 11.5, color: "9A8FD0", align: "center" });
  pageNo(s, 12);
})();

const OUT = "output_v3.pptx";
await pptx.writeFile({ fileName: OUT });
console.log("BUILT:", OUT);
