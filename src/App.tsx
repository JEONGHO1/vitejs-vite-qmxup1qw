import React, { useState, useMemo } from "react";
import {
  Telescope, LayoutGrid, SlidersHorizontal, Newspaper, Sparkles,
  ArrowUpRight, X, Flame, AlertTriangle, Loader2, ChevronRight,
  Globe, Coins, Building2, Copy, Check, Activity, KeyRound, RefreshCw, Database
} from "lucide-react";

/* ----------------------------------------------------------------
   SIGNAL · 유망주 발굴 데스크  (v2 — 발행본 / FMP 실데이터 연결)
   - 기본: 샘플 데이터(실데이터 아님). 설정에서 FMP 키 입력 → 실시간 전환
   - 키는 이 세션 메모리에만 보관(저장 안 함)
   - 발굴점수 = 역발상 조기발굴 산식 v1 · 콘텐츠 시드 = 내장 Claude
   - 외부 API가 막힌 환경(미리보기 등)에선 샘플로 자동 폴백
------------------------------------------------------------------ */

const FMP_BASE = "https://financialmodelingprep.com/stable";

const THEMES = [
  { key: "에이전틱 AI", tag: "AGENTIC", note: "에이전트가 진짜 일을 시작한다 — 디지털 노동 시장" },
  { key: "피지컬 AI", tag: "PHYSICAL", note: "몸을 가진 지능 — 휴머노이드·로봇" },
  { key: "AI 인프라", tag: "INFRA", note: "데이터가 진짜 자산 — 전력·냉각·메모리·광통신" },
  { key: "AI 보안", tag: "SECURITY", note: "선택이 아닌 구조 — 에이전트가 넓힌 공격 표면" },
  { key: "차세대 기술", tag: "FRONTIER", note: "양자·RWA·도메인 LLM·6G — 장기 고위험 고잠재" },
];

const STOCKS = [
  { t: "PATH", n: "UiPath", theme: "에이전틱 AI", sub: "RPA·에이전트", region: "미국", type: "주식", rev: 12, cap: "$5.7B", risk: "중간", why: "SaaS 우려로 눌렸다가 첫 GAAP 흑자전환·5억$ 자사주 매입", revAccel: 6, marginTr: 8, epsTurn: true, capB: 5.7, analysts: 30, peg: 1.2, debt: -0.5, fcfm: 15, themeFit: 82, ret12: 10 },
  { t: "CRM", n: "Salesforce", theme: "에이전틱 AI", sub: "Agentforce", region: "미국", type: "주식", rev: 9, cap: "$300B+", risk: "낮음", why: "Agentforce ARR 5.4억$·고객 1.85만, CRM 데이터 해자", revAccel: 2, marginTr: 3, epsTurn: false, capB: 300, analysts: 45, peg: 1.5, debt: 0.2, fcfm: 30, themeFit: 78, ret12: 15 },
  { t: "NOW", n: "ServiceNow", theme: "에이전틱 AI", sub: "AI Agent Studio", region: "미국", type: "주식", rev: 21, cap: "$180B", risk: "중간", why: "엔터프라이즈 워크플로 자동화 + 에이전트 스튜디오", revAccel: 5, marginTr: 4, epsTurn: false, capB: 180, analysts: 42, peg: 1.3, debt: 0, fcfm: 28, themeFit: 80, ret12: 25 },
  { t: "SOUN", n: "SoundHound AI", theme: "에이전틱 AI", sub: "음성 에이전트", region: "미국", type: "주식", rev: 60, cap: "$3B", risk: "높음", why: "호스피탈리티·차량용 음성 에이전트 순수주, 변동성 큼", revAccel: 25, marginTr: 10, epsTurn: false, capB: 3, analysts: 12, peg: 2.5, debt: 0.5, fcfm: -20, themeFit: 70, ret12: 120 },
  { t: "TSLA", n: "Tesla", theme: "피지컬 AI", sub: "옵티머스", region: "미국", type: "주식", rev: 8, cap: "$1.1T", risk: "높음", why: "옵티머스 양산 베팅, 단 시장은 26년 출하 확률 14%로 회의적", revAccel: 2, marginTr: -2, epsTurn: false, capB: 1100, analysts: 50, peg: 4.0, debt: -0.5, fcfm: 8, themeFit: 80, ret12: 30 },
  { t: "NVDA", n: "NVIDIA", theme: "피지컬 AI", sub: "로봇 두뇌·컴퓨트", region: "미국", type: "주식", rev: 55, cap: "$4.8T", risk: "중간", why: "에이전트·로봇·6G 컴퓨트의 공통 길목, 다만 이미 4.8조$", revAccel: 10, marginTr: 5, epsTurn: false, capB: 4800, analysts: 60, peg: 0.9, debt: -1, fcfm: 45, themeFit: 95, ret12: 45 },
  { t: "011070.KS", n: "LG이노텍", theme: "피지컬 AI", sub: "옵티머스 카메라", region: "한국", type: "주식", rev: 6, cap: "₩4조대", risk: "중간", why: "휴머노이드 카메라 모듈 — 한국형 '곡괭이' 부품주", revAccel: 3, marginTr: 3, epsTurn: false, capB: 3, analysts: 25, peg: 1.1, debt: 1.2, fcfm: 5, themeFit: 78, ret12: 8 },
  { t: "009150.KS", n: "삼성전기", theme: "피지컬 AI", sub: "MLCC·카메라", region: "한국", type: "주식", rev: 10, cap: "₩9조대", risk: "중간", why: "로봇·전장용 MLCC·카메라 수혜 부품주", revAccel: 4, marginTr: 4, epsTurn: false, capB: 6, analysts: 22, peg: 1.0, debt: 0.8, fcfm: 7, themeFit: 75, ret12: 12 },
  { t: "KOID", n: "KraneShares 휴머노이드 ETF", theme: "피지컬 AI", sub: "테마 ETF", region: "미국", type: "ETF", rev: 0, cap: "AUM ~$0.24B", risk: "높음", why: "두뇌·몸체·통합기업 전 밸류체인 분산 노출", revAccel: 0, marginTr: 0, epsTurn: false, capB: 0.24, analysts: 0, peg: 1.5, debt: 0, fcfm: 0, themeFit: 85, ret12: 35 },
  { t: "HUMN", n: "Roundhill 휴머노이드 ETF", theme: "피지컬 AI", sub: "테마 ETF", region: "미국", type: "ETF", rev: 0, cap: "美 최초 휴머노이드 ETF", risk: "높음", why: "임베디드 AI·휴머노이드 액티브 ETF", revAccel: 0, marginTr: 0, epsTurn: false, capB: 0.3, analysts: 0, peg: 1.5, debt: 0, fcfm: 0, themeFit: 82, ret12: 40 },
  { t: "SNDK", n: "SanDisk", theme: "AI 인프라", sub: "NAND 메모리", region: "미국", type: "주식", rev: 31, cap: "$230B", risk: "높음", why: "기준점 — 1년 4,000%+ 급등(이미 많이 반영, 추격 주의)", revAccel: 12, marginTr: 18, epsTurn: false, capB: 230, analysts: 28, peg: 0.5, debt: 1.0, fcfm: 12, themeFit: 85, ret12: 4000 },
  { t: "MU", n: "Micron", theme: "AI 인프라", sub: "메모리·HBM", region: "미국", type: "주식", rev: 45, cap: "$170B", risk: "높음", why: "SanDisk와 같은 메모리 슈퍼사이클 직접 동종", revAccel: 20, marginTr: 15, epsTurn: false, capB: 170, analysts: 35, peg: 0.4, debt: 0.5, fcfm: 15, themeFit: 88, ret12: 90 },
  { t: "000660.KS", n: "SK하이닉스", theme: "AI 인프라", sub: "HBM", region: "한국", type: "주식", rev: 40, cap: "₩200조대", risk: "높음", why: "HBM 슈퍼사이클의 한국판 핵심", revAccel: 18, marginTr: 14, epsTurn: false, capB: 140, analysts: 30, peg: 0.4, debt: 0.6, fcfm: 18, themeFit: 88, ret12: 85 },
  { t: "005930.KS", n: "삼성전자", theme: "AI 인프라", sub: "메모리·파운드리", region: "한국", type: "주식", rev: 15, cap: "₩400조대", risk: "중간", why: "메모리 + 파운드리 + 6G까지 광범위 노출", revAccel: 6, marginTr: 5, epsTurn: false, capB: 300, analysts: 35, peg: 0.7, debt: -0.5, fcfm: 12, themeFit: 80, ret12: 18 },
  { t: "VRT", n: "Vertiv", theme: "AI 인프라", sub: "전력·냉각", region: "미국", type: "주식", rev: 34, cap: "$140B대", risk: "중간", why: "엔비디아와 800V 전력 공동개발, 데이터센터 곡괭이", revAccel: 10, marginTr: 6, epsTurn: false, capB: 140, analysts: 26, peg: 1.0, debt: 1.2, fcfm: 14, themeFit: 85, ret12: 55 },
  { t: "NVT", n: "nVent Electric", theme: "AI 인프라", sub: "액체냉각", region: "미국", type: "주식", rev: 25, cap: "$15B대", risk: "중간", why: "액체냉각 분기 주문 +65%, 1GW+ 냉각 레퍼런스", revAccel: 8, marginTr: 5, epsTurn: false, capB: 15, analysts: 14, peg: 1.1, debt: 1.0, fcfm: 13, themeFit: 78, ret12: 28 },
  { t: "LITE", n: "Lumentum", theme: "AI 인프라", sub: "광부품", region: "미국", type: "주식", rev: 77, cap: "$10B대", risk: "높음", why: "엔비디아 실리콘 포토닉스 파트너, 매출 급성장", revAccel: 30, marginTr: 8, epsTurn: false, capB: 10, analysts: 20, peg: 0.8, debt: 1.5, fcfm: 10, themeFit: 82, ret12: 110 },
  { t: "CEG", n: "Constellation Energy", theme: "AI 인프라", sub: "원전 전력", region: "미국", type: "주식", rev: 12, cap: "$90B대", risk: "중간", why: "AI 전력 병목의 핵심, 원전 베이스로드 + MS 장기계약", revAccel: 5, marginTr: 3, epsTurn: false, capB: 90, analysts: 22, peg: 1.4, debt: 2.0, fcfm: 12, themeFit: 75, ret12: 20 },
  { t: "CRWD", n: "CrowdStrike", theme: "AI 보안", sub: "엔드포인트", region: "미국", type: "주식", rev: 23, cap: "$120B대", risk: "중간", why: "AI 네이티브 보안, ARR 52.5억$, 실적이 받쳐주는 성장", revAccel: 5, marginTr: 4, epsTurn: false, capB: 120, analysts: 48, peg: 1.8, debt: -0.5, fcfm: 30, themeFit: 85, ret12: 35 },
  { t: "ZS", n: "Zscaler", theme: "AI 보안", sub: "제로트러스트", region: "미국", type: "주식", rev: 29, cap: "$50B대", risk: "중간", why: "순수 제로트러스트 — AI 워크플로 보안에 구조적 수혜", revAccel: 7, marginTr: 5, epsTurn: false, capB: 50, analysts: 44, peg: 1.6, debt: -0.3, fcfm: 22, themeFit: 80, ret12: 30 },
  { t: "CYBR", n: "CyberArk", theme: "AI 보안", sub: "아이덴티티", region: "미국", type: "주식", rev: 30, cap: "PANW가 250억$ 인수中", risk: "낮음", why: "비인간 ID 폭증 수혜, 단 인수 진행으로 업사이드 제한", revAccel: 6, marginTr: 5, epsTurn: false, capB: 25, analysts: 32, peg: 1.3, debt: 0, fcfm: 18, themeFit: 75, ret12: 25 },
  { t: "NET", n: "Cloudflare", theme: "AI 보안", sub: "엣지·에이전트", region: "미국", type: "주식", rev: 30, cap: "$80B (P/E 175x)", risk: "높음", why: "에이전틱 포지셔닝 기대 큼, 단 밸류 최상단·실행 리스크", revAccel: 4, marginTr: 4, epsTurn: false, capB: 80, analysts: 40, peg: 3.5, debt: 0.5, fcfm: 8, themeFit: 78, ret12: 60 },
  { t: "PANW", n: "Palo Alto Networks", theme: "AI 보안", sub: "플랫폼", region: "미국", type: "주식", rev: 16, cap: "$130B대", risk: "중간", why: "플랫폼화 전략 + CyberArk 인수로 ID까지 확장", revAccel: 3, marginTr: 4, epsTurn: false, capB: 130, analysts: 46, peg: 1.5, debt: 0.3, fcfm: 25, themeFit: 80, ret12: 18 },
  { t: "IONQ", n: "IonQ", theme: "차세대 기술", sub: "양자", region: "미국", type: "주식", rev: 90, cap: "$19B (P/S 109x)", risk: "매우높음", why: "유일하게 매출 1억$ 넘긴 양자 순수주, 단 초고밸류", revAccel: 40, marginTr: 5, epsTurn: false, capB: 19, analysts: 14, peg: 9.0, debt: -1, fcfm: -80, themeFit: 70, ret12: 200 },
  { t: "RGTI", n: "Rigetti", theme: "차세대 기술", sub: "양자", region: "미국", type: "주식", rev: 5, cap: "P/S 836x", risk: "매우높음", why: "초전도 양자, 마일스톤 의존·내부자 순매도 경고", revAccel: -2, marginTr: 3, epsTurn: false, capB: 5, analysts: 8, peg: 12, debt: 0, fcfm: -200, themeFit: 60, ret12: 150 },
  { t: "QBTS", n: "D-Wave", theme: "차세대 기술", sub: "양자 어닐링", region: "미국", type: "주식", rev: 83, cap: "P/S 791x", risk: "매우높음", why: "어닐링 특화, 고마진이나 밸류 극단·상용화 5~10년", revAccel: 30, marginTr: 8, epsTurn: false, capB: 4, analysts: 10, peg: 11, debt: 0.5, fcfm: -150, themeFit: 62, ret12: 180 },
  { t: "QTUM", n: "Defiance 양자 ETF", theme: "차세대 기술", sub: "양자 ETF", region: "미국", type: "ETF", rev: 0, cap: "분산 노출", risk: "높음", why: "개별 양자주 단일 베팅 위험을 ETF로 분산", revAccel: 0, marginTr: 0, epsTurn: false, capB: 1, analysts: 0, peg: 1.5, debt: 0, fcfm: 0, themeFit: 70, ret12: 45 },
  { t: "COIN", n: "Coinbase", theme: "차세대 기술", sub: "RWA·크립토 인프라", region: "미국", type: "주식", rev: 25, cap: "—", risk: "높음", why: "온체인 RWA 32B$+ 성장의 인프라 수혜주", revAccel: 8, marginTr: 10, epsTurn: false, capB: 90, analysts: 38, peg: 1.5, debt: 1.0, fcfm: 20, themeFit: 72, ret12: 40 },
  { t: "HOOD", n: "Robinhood", theme: "차세대 기술", sub: "토큰화 주식", region: "미국", type: "주식", rev: 35, cap: "—", risk: "높음", why: "EU 토큰화 주식 등 RWA 직접 노출", revAccel: 10, marginTr: 8, epsTurn: false, capB: 60, analysts: 36, peg: 1.2, debt: 0, fcfm: 25, themeFit: 70, ret12: 70 },
  { t: "ONDO", n: "Ondo Finance", theme: "차세대 기술", sub: "RWA 토큰", region: "크립토", type: "토큰", rev: 0, cap: "토큰화 주식 점유 60%", risk: "매우높음", why: "RWA 토큰 선두 — 주식 아닌 코인, 변동성 매우 큼", revAccel: 0, marginTr: 0, epsTurn: false, capB: 3, analysts: 0, peg: 1.5, debt: 0, fcfm: 0, themeFit: 65, ret12: 50 },
  { t: "TEM", n: "Tempus AI", theme: "차세대 기술", sub: "도메인 LLM·헬스케어", region: "미국", type: "주식", rev: 35, cap: "—", risk: "높음", why: "임상 데이터 기반 헬스케어 버티컬 AI", revAccel: 12, marginTr: 6, epsTurn: false, capB: 12, analysts: 18, peg: 1.4, debt: 1.0, fcfm: -5, themeFit: 75, ret12: 15 },
  { t: "TRI", n: "Thomson Reuters", theme: "차세대 기술", sub: "도메인 LLM·법률", region: "미국", type: "주식", rev: 9, cap: "—", risk: "낮음", why: "CaseText 인수로 법률 버티컬 AI 선점", revAccel: 2, marginTr: 3, epsTurn: false, capB: 90, analysts: 24, peg: 1.0, debt: 0.5, fcfm: 30, themeFit: 70, ret12: 10 },
  { t: "VEEV", n: "Veeva Systems", theme: "차세대 기술", sub: "도메인 LLM·라이프사이언스", region: "미국", type: "주식", rev: 16, cap: "—", risk: "낮음", why: "제약·바이오 버티컬 SaaS + AI", revAccel: 3, marginTr: 4, epsTurn: false, capB: 30, analysts: 30, peg: 1.3, debt: -1, fcfm: 35, themeFit: 72, ret12: 12 },
  { t: "SKM", n: "SK텔레콤", theme: "차세대 기술", sub: "6G", region: "한국", type: "주식", rev: 3, cap: "₩, KR", risk: "낮음", why: "엔비디아 AI 네이티브 6G 연합 참여 — 한국 6G 선두", revAccel: 1, marginTr: 1, epsTurn: false, capB: 20, analysts: 20, peg: 1.0, debt: 1.5, fcfm: 10, themeFit: 65, ret12: 5 },
  { t: "NOK", n: "Nokia", theme: "차세대 기술", sub: "6G 장비", region: "미국", type: "주식", rev: 5, cap: "—", risk: "중간", why: "6G 네트워크 장비, 상용화는 ~2029 장기", revAccel: 1, marginTr: 2, epsTurn: false, capB: 25, analysts: 28, peg: 1.2, debt: 0.5, fcfm: 6, themeFit: 60, ret12: 8 },
];

/* ===== 발굴점수 산식 v1 ===== */
function pctRank(arr, v, hi) {
  const xs = arr.filter(x => x != null);
  if (xs.length <= 1 || v == null) return 50;
  let c = 0;
  for (const x of xs) { if (hi ? x < v : x > v) c += 1; else if (x === v) c += 0.5; }
  return (c / xs.length) * 100;
}
const ohFactor = (r) => r <= 20 ? 1 : r <= 50 ? 0.9 : r <= 100 ? 0.7 : r <= 300 ? 0.45 : 0.25;
function computeAll(rows) {
  const fund = rows.filter(s => s.type === "주식");
  const col = k => fund.map(s => s[k]);
  const C = { revAccel: col("revAccel"), marginTr: col("marginTr"), capB: col("capB"), analysts: col("analysts"), peg: col("peg"), debt: col("debt"), fcfm: col("fcfm") };
  return rows.map(s => {
    let f1, f2, f3;
    if (s.type === "주식") {
      f1 = Math.min(100, (pctRank(C.revAccel, s.revAccel, true) + pctRank(C.marginTr, s.marginTr, true)) / 2 + (s.epsTurn ? 10 : 0));
      f2 = (pctRank(C.capB, s.capB, false) + pctRank(C.analysts, s.analysts, false) + pctRank(C.peg, s.peg, false)) / 3;
      f3 = (pctRank(C.debt, s.debt, false) + pctRank(C.fcfm, s.fcfm, true)) / 2;
    } else { f1 = 50; f2 = 50; f3 = 50; }
    const f4 = s.themeFit;
    const base = 0.4 * f1 + 0.3 * f2 + 0.2 * f3 + 0.1 * f4;
    const oh = ohFactor(s.ret12);
    return { ...s, f1: Math.round(f1), f2: Math.round(f2), f3: Math.round(f3), f4: Math.round(f4), base: Math.round(base), oh, score: Math.round(base * oh) };
  });
}
const SAMPLE = computeAll(STOCKS);

/* ===== FMP 실데이터 fetch ===== */
const numOr = (v, fb) => (typeof v === "number" && isFinite(v) ? v : fb);
const arr = (a) => (Array.isArray(a) ? a : a ? [a] : []);
async function fetchInputs(s, key) {
  const get = async (path) => {
    const url = `${FMP_BASE}/${path}${path.includes("?") ? "&" : "?"}apikey=${encodeURIComponent(key)}`;
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 9000);
    try {
      const r = await fetch(url, { signal: ctrl.signal });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return r.json();
    } finally { clearTimeout(timer); }
  };
  let ret12 = s.ret12;
  try { const c = arr(await get(`stock-price-change?symbol=${s.t}`))[0] || {}; ret12 = numOr(c["1Y"] ?? c.oneYear, s.ret12); } catch {}
  if (s.type !== "주식") return { ...s, ret12 };
  const inc = arr(await get(`income-statement?symbol=${s.t}&period=quarter&limit=8`));
  const prof = arr(await get(`profile?symbol=${s.t}`));
  let km = []; try { km = arr(await get(`key-metrics-ttm?symbol=${s.t}`)); } catch {}
  let cf = []; try { cf = arr(await get(`cash-flow-statement?symbol=${s.t}&period=quarter&limit=4`)); } catch {}
  const yoy = [];
  for (let i = 0; i + 4 < inc.length; i++) { const a = inc[i].revenue, b = inc[i + 4].revenue; if (a && b) yoy.push(((a - b) / Math.abs(b)) * 100); }
  const revAccel = yoy.length >= 2 ? yoy[0] - yoy.slice(1, 5).reduce((x, y) => x + y, 0) / Math.min(4, yoy.length - 1) : s.revAccel;
  const opm = (q) => (q && q.revenue ? (q.operatingIncome / q.revenue) * 100 : null);
  const marginTr = inc.length >= 5 && opm(inc[0]) != null && opm(inc[4]) != null ? opm(inc[0]) - opm(inc[4]) : s.marginTr;
  const epsTurn = inc.length >= 5 ? inc[0].netIncome > 0 && inc[4].netIncome <= 0 : s.epsTurn;
  const mc = numOr(prof?.[0]?.marketCap, null);
  const capB = mc ? mc / 1e9 : s.capB;
  const peg = numOr(km?.[0]?.priceToEarningsGrowthRatioTTM ?? km?.[0]?.pegRatioTTM, s.peg);
  const debt = numOr(km?.[0]?.netDebtToEBITDATTM ?? km?.[0]?.netDebtToEBITDA, s.debt);
  const revTTM = inc.slice(0, 4).reduce((a, q) => a + (q.revenue || 0), 0);
  const fcfTTM = cf.slice(0, 4).reduce((a, q) => a + (q.freeCashFlow || 0), 0);
  const fcfm = revTTM ? (fcfTTM / revTTM) * 100 : s.fcfm;
  return { ...s, revAccel, marginTr, epsTurn, capB, analysts: s.analysts, peg, debt, fcfm, ret12, rev: yoy.length ? Math.round(yoy[0]) : s.rev, cap: capB ? `$${capB.toFixed(1)}B` : s.cap };
}
async function mapPool(items, size, fn, onProgress) {
  const out = []; let i = 0, done = 0;
  const worker = async () => {
    while (i < items.length) {
      const idx = i++;
      try { out[idx] = await fn(items[idx]); } catch (e) { out[idx] = { ...items[idx], _err: true, _errMsg: String(e?.message || e) }; }
      done++; onProgress(done);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

const NEWS = [
  { h: "엔비디아, 글로벌 통신사들과 AI 네이티브 6G 연합 발표", theme: "차세대 기술", tickers: ["NVDA", "NOK", "SKM"], time: "2시간 전" },
  { h: "SanDisk, AI 메모리 수요 슈퍼사이클로 신고가 경신", theme: "AI 인프라", tickers: ["SNDK", "MU", "000660.KS"], time: "오늘" },
  { h: "휴머노이드, 차세대 AI 투자 기회로 부상 — 중국이 선두", theme: "피지컬 AI", tickers: ["NVDA", "TSLA", "KOID"], time: "1일 전" },
  { h: "에이전틱 AI 시장 90억$ 돌파, 연말 기업앱 40%가 에이전트 탑재 전망", theme: "에이전틱 AI", tickers: ["NOW", "CRM", "PATH"], time: "2일 전" },
  { h: "Vertiv, 엔비디아 Rubin Ultra용 800V 전력 아키텍처 공동개발", theme: "AI 인프라", tickers: ["VRT", "LITE"], time: "3일 전" },
  { h: "온체인 RWA 320억$ 돌파, 1년새 200%+ 성장", theme: "차세대 기술", tickers: ["COIN", "HOOD", "ONDO"], time: "3일 전" },
  { h: "AI 위협 급증에 사이버보안 예산 별도 항목화 — 제로트러스트 부각", theme: "AI 보안", tickers: ["CRWD", "ZS", "PANW"], time: "4일 전" },
  { h: "양자 순수주 변동성 경고: 내부자 누적 9.3억$ 순매도", theme: "차세대 기술", tickers: ["IONQ", "RGTI", "QBTS"], time: "5일 전" },
];

const RISK_COLOR = { "낮음": "var(--green)", "중간": "var(--blue)", "높음": "var(--amber)", "매우높음": "var(--red)" };
const REGION_ICON = { "미국": Globe, "한국": Building2, "크립토": Coins };
const scoreColor = (v) => v >= 70 ? "var(--green)" : v >= 45 ? "var(--blue)" : "var(--txt-dim)";

function spark(seedStr) {
  let s = 0; for (let i = 0; i < seedStr.length; i++) s += seedStr.charCodeAt(i) * (i + 1);
  let v = 45; const out = [];
  for (let i = 0; i < 10; i++) { s = (s * 1103515245 + 12345) & 0x7fffffff; v = Math.max(8, Math.min(92, v + ((s % 23) - 9))); out.push(v); }
  return out;
}
function Sparkline({ seed }) {
  const pts = spark(seed), W = 220, H = 56, mx = Math.max(...pts), mn = Math.min(...pts), sp = Math.max(1, mx - mn);
  const co = pts.map((p, i) => [(i / (pts.length - 1)) * W, H - ((p - mn) / sp) * (H - 8) - 4]);
  const line = co.map((c, i) => `${i === 0 ? "M" : "L"}${c[0].toFixed(1)},${c[1].toFixed(1)}`).join(" ");
  const up = pts[pts.length - 1] >= pts[0], st = up ? "var(--green)" : "var(--red)";
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="spk" preserveAspectRatio="none">
      <defs><linearGradient id={`g-${seed}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={st} stopOpacity="0.28" /><stop offset="100%" stopColor={st} stopOpacity="0" /></linearGradient></defs>
      <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#g-${seed})`} />
      <path d={line} fill="none" stroke={st} strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}
const ScoreBar = ({ v }) => <div className="sbar"><div className="sbar-fill" style={{ width: `${v}%` }} /></div>;

function StockCard({ s, onClick, idx }) {
  const RIcon = REGION_ICON[s.region] || Globe;
  return (
    <button className="card stagger" style={{ animationDelay: `${Math.min(idx, 10) * 28}ms` }} onClick={() => onClick(s)}>
      <div className="card-top">
        <div><div className="card-ticker">{s.t.replace(".KS", "")}<span className="kssub">{s.t.includes(".KS") ? ".KS" : ""}</span></div><div className="card-name">{s.n}</div></div>
        <div className="card-score" style={{ color: scoreColor(s.score) }}>{s.score}</div>
      </div>
      <div className="card-sub">{s.sub}</div>
      <ScoreBar v={s.score} />
      <div className="card-foot">
        <span className="chip" style={{ color: RISK_COLOR[s.risk], borderColor: RISK_COLOR[s.risk] }}>{s.risk}</span>
        <span className="card-meta">{s.oh < 1 ? <span className="ov"><AlertTriangle size={10} />과열</span> : <><RIcon size={11} /> {s.type}</>}</span>
      </div>
    </button>
  );
}
const Metric = ({ label, value, accent, small }) => <div className="metric"><div className="metric-label">{label}</div><div className="metric-val mono" style={{ color: accent || "var(--txt)", fontSize: small ? "14px" : undefined }}>{value}</div></div>;
const BdRow = ({ label, v }) => <div className="bd-row"><span className="lab">{label}</span><span className="bd-bar"><i style={{ width: `${v}%` }} /></span><span className="num">{v}</span></div>;
const Fsel = ({ label, value, set, opts, labels }) => <div className="fsel"><label>{label}</label><select value={value} onChange={e => set(e.target.value)}>{opts.map(o => <option key={o} value={o}>{labels?.[o] || o}</option>)}</select></div>;

export default function App() {
  const [view, setView] = useState("스크리너");
  const [sel, setSel] = useState(null);
  const [fTheme, setFTheme] = useState("전체");
  const [fRegion, setFRegion] = useState("전체");
  const [fType, setFType] = useState("전체");
  const [minScore, setMinScore] = useState(0);
  const [sortKey, setSortKey] = useState("score");
  const [seed, setSeed] = useState(null);
  const [genLoading, setGenLoading] = useState(false);
  const [genError, setGenError] = useState(null);
  const [copied, setCopied] = useState(null);
  // 데이터 소스
  const [apiKey, setApiKey] = useState("");
  const [mode, setMode] = useState("sample");
  const [liveData, setLiveData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState({ done: 0, total: 0 });
  const [dataErr, setDataErr] = useState(null);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [showSettings, setShowSettings] = useState(false);

  const data = mode === "live" && liveData ? liveData : SAMPLE;
  const openStock = (s) => { setSel(s); setSeed(null); setGenError(null); };

  const filtered = useMemo(() => {
    let r = data.filter(s => (fTheme === "전체" || s.theme === fTheme) && (fRegion === "전체" || s.region === fRegion) && (fType === "전체" || s.type === fType) && s.score >= minScore);
    return [...r].sort((a, b) => sortKey === "name" ? a.n.localeCompare(b.n) : b[sortKey] - a[sortKey]);
  }, [data, fTheme, fRegion, fType, minScore, sortKey]);

  async function loadLive() {
    if (!apiKey.trim()) { setDataErr("FMP API 키를 입력해 주세요."); return; }
    setLoading(true); setDataErr(null); setSel(null); setProgress({ done: 0, total: STOCKS.length });
    try {
      const rows = await mapPool(STOCKS, 4, (s) => fetchInputs(s, apiKey.trim()), (d) => setProgress(p => ({ ...p, done: d })));
      const failed = rows.filter(r => r._err);
      if (failed.length === rows.length) throw new Error(failed[0]?._errMsg || "unknown");
      setLiveData(computeAll(rows)); setMode("live"); setLastUpdated(new Date()); setShowSettings(false);
      if (failed.length) {
        const m = String(failed[0]?._errMsg || "unknown");
        const hint = /Failed to fetch|NetworkError|TypeError/i.test(m) ? "외부 API 호출이 차단된 것 같아요(샌드박스/CORS). 이 미리보기 밖에서 실행해야 합니다."
          : /401|403|402/.test(m) ? "키 또는 요금제 권한 문제예요(해당 plan에 미포함된 엔드포인트일 수 있음)."
          : /Abort/i.test(m) ? "응답 지연(타임아웃)이에요."
          : failed.length <= 4 ? "보통 심볼 표기 차이예요." : "대부분 같은 원인으로 보여요.";
        setDataErr(`${failed.length}/${STOCKS.length}개 미수신 → 샘플 폴백. 이유: ${m}. ${hint}`);
      }
    } catch (e) {
      const m = String(e?.message || e);
      const hint = /Failed to fetch|NetworkError|TypeError/i.test(m)
        ? "외부 API 호출이 차단된 것 같아요(샌드박스 또는 CORS). 이 코드를 직접 호스팅하면 동작합니다."
        : /401|403/.test(m) ? "API 키 또는 요금제 권한 문제일 수 있어요. 키와 plan을 확인해 주세요."
        : /Abort/i.test(m) ? "응답 지연으로 타임아웃됐어요. 네트워크·차단 여부를 확인해 주세요."
        : "잠시 후 다시 시도해 주세요.";
      setDataErr(`실데이터 호출 실패 (${m}). ${hint}`);
    } finally { setLoading(false); }
  }

  async function generateSeed(s) {
    setGenLoading(true); setGenError(null); setSeed(null);
    const prompt = `너는 한국어 경제·투자 유튜브/블로그 콘텐츠 기획자야. 아래 종목으로 영상·포스팅 콘텐츠 시드를 만들어줘.

종목: ${s.n} (${s.t})
테마: ${s.theme} / ${s.sub}
메모: ${s.why}

아래 JSON 형식으로만 답해. 코드펜스(\`\`\`)나 다른 설명은 절대 넣지 마.
{
  "thesis": "이 종목이 왜 지금 주목받는지 핵심 포인트 2~3문장 (한국어, 단정적 매수 권유 톤은 피하고 분석 톤으로)",
  "angles": ["콘텐츠 각도1", "각도2", "각도3"],
  "titles": ["호기심 자극형 제목 후보1", "후보2", "후보3"]
}
각도는 1편으로 만들 수 있는 구체 주제로, 제목은 한국 유튜브/블로그에 어울리게.`;
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: "claude-sonnet-4-20250514", max_tokens: 1000, messages: [{ role: "user", content: prompt }] }),
      });
      const d = await res.json();
      const text = d.content.filter(b => b.type === "text").map(b => b.text).join("");
      setSeed(JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim()));
    } catch (e) { setGenError("생성에 실패했어요. 잠시 후 다시 시도해 주세요."); }
    finally { setGenLoading(false); }
  }
  const copy = async (txt, id) => { try { await navigator.clipboard.writeText(txt); setCopied(id); setTimeout(() => setCopied(null), 1400); } catch (e) {} };

  const NAV = [{ k: "테마", icon: LayoutGrid, label: "테마 톱다운" }, { k: "스크리너", icon: SlidersHorizontal, label: "데이터 스크리너" }, { k: "뉴스", icon: Newspaper, label: "뉴스·이슈" }];
  const live = mode === "live" && liveData;

  return (
    <div className="root">
      <style>{CSS}</style>
      <div className="bg-grid" /><div className="bg-glow" />

      {(loading || dataErr) && (
        <div className={`toast ${dataErr && !loading ? "err" : ""}`}>
          {loading
            ? <><Loader2 size={15} className="spin" /> FMP 실데이터 불러오는 중… {progress.done}/{progress.total}</>
            : <><AlertTriangle size={15} /><span>{dataErr}</span><button className="toast-x" onClick={() => setDataErr(null)}><X size={14} /></button></>}
        </div>
      )}

      <header className="hdr">
        <div className="hdr-brand">
          <div className="logo"><Telescope size={18} /></div>
          <div><div className="brand-title">SIGNAL<span className="brand-dot">·</span>유망주 발굴 데스크</div><div className="brand-sub">메가트렌드 → 발굴점수(산식 v1) → 콘텐츠 시드</div></div>
        </div>
        <div className="hdr-right">
          <button className={`src-pill ${live ? "on" : ""}`} onClick={() => setShowSettings(v => !v)}>
            <Database size={12} />
            {live ? <>실시간 <span className="ts">{lastUpdated?.toLocaleTimeString("ko-KR", { hour: "2-digit", minute: "2-digit" })}</span></> : "샘플 데이터"}
          </button>
          {showSettings && (
            <div className="settings">
              <div className="set-title"><KeyRound size={13} /> FMP 실데이터 연결</div>
              <input className="set-key" type="password" placeholder="FMP API 키 입력" value={apiKey} onChange={e => setApiKey(e.target.value)} />
              <button className="set-load" onClick={loadLive} disabled={loading}>
                {loading ? <><Loader2 size={14} className="spin" /> 불러오는 중… {progress.done}/{progress.total}</> : <><RefreshCw size={14} /> 실데이터 불러오기</>}
              </button>
              {live && <button className="set-sample" onClick={() => setMode("sample")}>샘플로 전환</button>}
              {dataErr && <div className="set-err">{dataErr}</div>}
              <div className="set-note">키는 이 세션 메모리에만 보관되고 저장·전송되지 않습니다. 일부 필드는 FMP 플랜에 따라 폴백(샘플)될 수 있어요.</div>
            </div>
          )}
        </div>
      </header>

      <nav className="nav">
        {NAV.map(n => <button key={n.k} className={`nav-btn ${view === n.k ? "on" : ""}`} onClick={() => setView(n.k)}><n.icon size={15} /> <span>{n.label}</span></button>)}
        <div className="nav-note">발굴점수 = 역발상 조기발굴 산식 v1 · {live ? "FMP 실데이터" : "샘플 데이터"}</div>
      </nav>

      <main className="main">
        {view === "테마" && (
          <div className="themes">
            {THEMES.map(th => {
              const items = data.filter(s => s.theme === th.key).sort((a, b) => b.score - a.score);
              return (
                <section key={th.key} className="theme-block">
                  <div className="theme-head"><div className="theme-tag">{th.tag}</div><div><h2 className="theme-name">{th.key}</h2><p className="theme-note">{th.note}</p></div><div className="theme-count">{items.length}</div></div>
                  <div className="grid">{items.map((s, i) => <StockCard key={s.t} s={s} idx={i} onClick={openStock} />)}</div>
                </section>
              );
            })}
          </div>
        )}

        {view === "스크리너" && (
          <div className="screener">
            <div className="filters">
              <Fsel label="테마" value={fTheme} set={setFTheme} opts={["전체", ...THEMES.map(t => t.key)]} />
              <Fsel label="지역" value={fRegion} set={setFRegion} opts={["전체", "미국", "한국", "크립토"]} />
              <Fsel label="유형" value={fType} set={setFType} opts={["전체", "주식", "ETF", "토큰"]} />
              <Fsel label="정렬" value={sortKey} set={setSortKey} opts={["score", "rev", "name"]} labels={{ score: "발굴점수", rev: "매출성장", name: "이름순" }} />
              <div className="fslide"><label>최소 점수 <b>{minScore}</b></label><input type="range" min="0" max="90" value={minScore} onChange={e => setMinScore(+e.target.value)} /></div>
              <div className="fcount">{filtered.length}개</div>
            </div>
            <div className="tbl">
              <div className="tr th"><div className="c-tk">티커</div><div className="c-nm">종목</div><div className="c-th">테마</div><div className="c-rv">매출</div><div className="c-rk">리스크</div><div className="c-sc">발굴점수</div><div className="c-go" /></div>
              {filtered.map((s, i) => {
                const RIcon = REGION_ICON[s.region] || Globe;
                return (
                  <button key={s.t} className="tr stagger" style={{ animationDelay: `${Math.min(i, 14) * 18}ms` }} onClick={() => openStock(s)}>
                    <div className="c-tk mono">{s.t.replace(".KS", "")}<span className="kssub">{s.t.includes(".KS") ? ".KS" : ""}</span></div>
                    <div className="c-nm"><RIcon size={12} className="rg" /> {s.n} <span className="subtle">{s.sub}</span>{s.oh < 1 && <span className="ovtag">과열</span>}</div>
                    <div className="c-th"><span className="thpill">{s.theme}</span></div>
                    <div className="c-rv mono">{s.rev > 0 ? `+${s.rev}%` : "—"}</div>
                    <div className="c-rk"><span className="dot" style={{ background: RISK_COLOR[s.risk] }} />{s.risk}</div>
                    <div className="c-sc"><span className="scnum mono" style={{ color: scoreColor(s.score) }}>{s.score}</span><ScoreBar v={s.score} /></div>
                    <div className="c-go"><ChevronRight size={15} /></div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {view === "뉴스" && (
          <div className="news">
            <p className="news-intro">그날 이슈에서 테마·종목을 역추적합니다. <span className="subtle">(샘플 헤드라인 — 실제 뉴스 API 연결 지점)</span></p>
            {NEWS.map((nw, i) => (
              <div key={i} className="news-row stagger" style={{ animationDelay: `${i * 30}ms` }}>
                <div className="news-time">{nw.time}</div>
                <div className="news-body">
                  <div className="news-h">{nw.h}</div>
                  <div className="news-tags"><span className="thpill sm">{nw.theme}</span>{nw.tickers.map(tk => { const st = data.find(x => x.t === tk); return st ? <button key={tk} className="tkpill" onClick={() => openStock(st)}>{tk.replace(".KS", "")} <ArrowUpRight size={10} /></button> : null; })}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {sel && (
        <>
          <div className="scrim" onClick={() => setSel(null)} />
          <aside className="panel">
            <div className="panel-hd">
              <div><div className="panel-tk mono">{sel.t.replace(".KS", "")}<span className="kssub">{sel.t.includes(".KS") ? ".KS" : ""}</span></div><div className="panel-nm">{sel.n}</div><div className="panel-th"><span className="thpill">{sel.theme}</span><span className="subtle"> · {sel.sub}</span></div></div>
              <button className="x" onClick={() => setSel(null)}><X size={18} /></button>
            </div>
            <Sparkline seed={sel.t} />
            <div className="metrics">
              <Metric label="매출성장(YoY)" value={sel.rev > 0 ? `+${sel.rev}%` : "—"} />
              <Metric label="12개월 수익률" value={`+${sel.ret12.toLocaleString()}%`} accent={sel.oh < 1 ? "var(--red)" : "var(--txt)"} />
              <Metric label="시총/규모" value={sel.cap} small />
              <Metric label="리스크" value={sel.risk} accent={RISK_COLOR[sel.risk]} />
            </div>
            <div className="breakdown">
              <div className="bd-head"><div className="bd-title"><Activity size={13} /> 발굴점수 분해</div><div className="bd-final mono" style={{ color: scoreColor(sel.score) }}>{sel.score}</div></div>
              <BdRow label="① 개선 (40%)" v={sel.f1} /><BdRow label="② 저평가·덜붐빔 (30%)" v={sel.f2} /><BdRow label="③ 품질·안전 (20%)" v={sel.f3} /><BdRow label="④ 테마 (10%)" v={sel.f4} />
              <div className="bd-calc">기본 <b>{sel.base}</b> <span>×</span> 과열배수 <b className={sel.oh < 1 ? "pen" : ""}>{sel.oh.toFixed(2)}</b> <span>=</span> <b className="final">{sel.score}</b></div>
              {sel.oh < 1 && <div className="bd-warn"><AlertTriangle size={12} /> 12개월 +{sel.ret12.toLocaleString()}% → 과열 감점</div>}
              {sel.type !== "주식" && <div className="bd-note">※ {sel.type}는 펀더멘털 요인을 중립(50)으로 처리</div>}
            </div>
            <div className="why-card"><div className="why-label"><Flame size={13} /> 왜 유망한지</div><p>{sel.why}</p></div>
            <div className="seed">
              <div className="seed-hd"><div className="seed-label"><Sparkles size={14} /> 콘텐츠 시드</div><span className="seed-by">Claude 생성</span></div>
              {!seed && !genLoading && <button className="gen-btn" onClick={() => generateSeed(sel)}><Sparkles size={15} /> 콘텐츠 각도·제목 생성</button>}
              {genLoading && <div className="gen-loading"><Loader2 size={18} className="spin" /> 콘텐츠 각도를 짜는 중…</div>}
              {genError && <div className="gen-err"><AlertTriangle size={14} /> {genError}<button className="retry" onClick={() => generateSeed(sel)}>다시</button></div>}
              {seed && (
                <div className="seed-out">
                  <div className="seed-thesis">{seed.thesis}</div>
                  <div className="seed-sec-label">콘텐츠 각도</div>
                  {(seed.angles || []).map((a, i) => <div key={i} className="seed-item"><span className="seed-num">{i + 1}</span><span>{a}</span></div>)}
                  <div className="seed-sec-label">제목 후보</div>
                  {(seed.titles || []).map((tt, i) => <div key={i} className="seed-title"><span>{tt}</span><button className="cp" onClick={() => copy(tt, `t${i}`)}>{copied === `t${i}` ? <Check size={13} /> : <Copy size={13} />}</button></div>)}
                  <button className="regen" onClick={() => generateSeed(sel)}>다시 생성</button>
                </div>
              )}
            </div>
            <div className="panel-foot">발굴점수는 검증된 모델이 아닌 '발굴 1차 필터'용 휴리스틱입니다. 본 화면은 투자 자문이 아닙니다.</div>
          </aside>
        </>
      )}
    </div>
  );
}

const CSS = `
@import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500;600&family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap');
:root{--bg:#080b11;--bg-2:#0e131c;--bg-3:#0b1018;--panel:#0f1521;--line:rgba(255,255,255,.07);--line-2:rgba(255,255,255,.13);--txt:#e8eef6;--txt-dim:#8a97aa;--txt-faint:#566273;--green:#5ef2b3;--blue:#6aa6ff;--amber:#f5b740;--red:#ff6f6f;}
*{box-sizing:border-box}
.root{position:relative;min-height:100vh;background:var(--bg);color:var(--txt);font-family:'IBM Plex Sans KR',sans-serif;overflow-x:hidden}
.mono{font-family:'IBM Plex Mono',monospace;font-feature-settings:"tnum"}
.subtle{color:var(--txt-faint);font-size:11px;font-weight:400}
.bg-grid{position:fixed;inset:0;pointer-events:none;z-index:0;background-image:linear-gradient(var(--line) 1px,transparent 1px),linear-gradient(90deg,var(--line) 1px,transparent 1px);background-size:46px 46px;opacity:.35;mask-image:radial-gradient(ellipse 90% 70% at 50% 0%,#000 30%,transparent 80%)}
.bg-glow{position:fixed;top:-220px;left:50%;transform:translateX(-50%);width:900px;height:520px;z-index:0;pointer-events:none;background:radial-gradient(ellipse at center,rgba(94,242,179,.10),transparent 65%);filter:blur(20px)}
.hdr{position:relative;z-index:30;display:flex;align-items:center;justify-content:space-between;padding:18px 26px;border-bottom:1px solid var(--line);gap:16px;flex-wrap:wrap}
.hdr-brand{display:flex;align-items:center;gap:13px}
.logo{width:38px;height:38px;border-radius:10px;display:grid;place-items:center;color:#04140d;background:linear-gradient(135deg,var(--green),#37c98c);box-shadow:0 0 22px rgba(94,242,179,.35)}
.brand-title{font-weight:700;letter-spacing:.3px;font-size:16px}
.brand-dot{color:var(--green);margin:0 5px}
.brand-sub{color:var(--txt-dim);font-size:11.5px;margin-top:2px}
.hdr-right{position:relative}
.src-pill{display:flex;align-items:center;gap:6px;font-size:11.5px;font-weight:500;color:var(--amber);border:1px solid rgba(245,183,64,.35);background:rgba(245,183,64,.08);padding:7px 12px;border-radius:999px;cursor:pointer;font-family:inherit;transition:.14s}
.src-pill:hover{filter:brightness(1.1)}
.src-pill.on{color:var(--green);border-color:rgba(94,242,179,.4);background:rgba(94,242,179,.1)}
.src-pill .ts{font-family:'IBM Plex Mono',monospace;opacity:.8}
.settings{position:absolute;top:46px;right:0;width:280px;background:var(--panel);border:1px solid var(--line-2);border-radius:13px;padding:15px;z-index:40;box-shadow:0 20px 50px rgba(0,0,0,.5);animation:fade .15s ease}
.set-title{display:flex;align-items:center;gap:7px;font-size:12.5px;font-weight:600;color:var(--txt);margin-bottom:11px}
.set-key{width:100%;background:var(--bg-3);border:1px solid var(--line-2);color:var(--txt);border-radius:8px;padding:9px 11px;font-family:'IBM Plex Mono',monospace;font-size:12px;margin-bottom:9px}
.set-key:focus{outline:none;border-color:var(--green)}
.set-load{width:100%;display:flex;align-items:center;justify-content:center;gap:7px;padding:10px;border-radius:8px;background:linear-gradient(135deg,var(--green),#34c389);color:#04140d;border:none;font-family:inherit;font-size:12.5px;font-weight:600;cursor:pointer;transition:.14s}
.set-load:hover{filter:brightness(1.06)}
.set-load:disabled{opacity:.7;cursor:default}
.set-sample{width:100%;margin-top:7px;background:var(--bg-2);border:1px solid var(--line-2);color:var(--txt-dim);font-family:inherit;font-size:11.5px;padding:8px;border-radius:8px;cursor:pointer}
.set-err{margin-top:10px;font-size:11px;line-height:1.5;color:var(--red);background:rgba(255,111,111,.07);border:1px solid rgba(255,111,111,.25);border-radius:8px;padding:9px 10px}
.set-note{margin-top:10px;font-size:10px;line-height:1.5;color:var(--txt-faint)}
.nav{position:relative;z-index:2;display:flex;align-items:center;gap:8px;padding:14px 26px 0;flex-wrap:wrap}
.nav-btn{display:flex;align-items:center;gap:7px;padding:9px 15px;border-radius:9px 9px 0 0;border:1px solid transparent;border-bottom:none;background:transparent;color:var(--txt-dim);font-family:inherit;font-size:13px;font-weight:500;cursor:pointer;transition:.16s}
.nav-btn:hover{color:var(--txt)}
.nav-btn.on{color:var(--green);background:var(--bg-2);border-color:var(--line);position:relative}
.nav-btn.on::after{content:"";position:absolute;left:0;right:0;bottom:-1px;height:2px;background:var(--green)}
.nav-note{margin-left:auto;color:var(--txt-faint);font-size:10.5px;font-family:'IBM Plex Mono',monospace;padding-bottom:6px}
.main{position:relative;z-index:1;padding:24px 26px 60px;max-width:1180px;margin:0 auto;border-top:1px solid var(--line);margin-top:-1px}
.theme-block{margin-bottom:34px}
.theme-head{display:flex;align-items:center;gap:14px;margin-bottom:14px}
.theme-tag{font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1.5px;color:var(--green);border:1px solid rgba(94,242,179,.3);padding:5px 8px;border-radius:6px;background:rgba(94,242,179,.06)}
.theme-name{font-size:17px;font-weight:700;margin:0}
.theme-note{font-size:12px;color:var(--txt-dim);margin:2px 0 0}
.theme-count{margin-left:auto;font-family:'IBM Plex Mono',monospace;color:var(--txt-faint);font-size:13px}
.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(218px,1fr));gap:12px}
.card{text-align:left;background:var(--bg-2);border:1px solid var(--line);border-radius:13px;padding:15px;cursor:pointer;font-family:inherit;color:var(--txt);transition:.18s;position:relative;overflow:hidden}
.card::before{content:"";position:absolute;inset:0;background:linear-gradient(135deg,rgba(94,242,179,.05),transparent 60%);opacity:0;transition:.18s}
.card:hover{border-color:var(--line-2);transform:translateY(-2px);box-shadow:0 10px 30px rgba(0,0,0,.35)}
.card:hover::before{opacity:1}
.card-top{display:flex;justify-content:space-between;align-items:flex-start}
.card-ticker{font-family:'IBM Plex Mono',monospace;font-weight:600;font-size:14px;letter-spacing:.3px}
.card-name{font-size:12px;color:var(--txt-dim);margin-top:1px}
.card-score{font-family:'IBM Plex Mono',monospace;font-size:22px;font-weight:600;line-height:1}
.card-sub{font-size:11px;color:var(--txt-faint);margin:8px 0 9px}
.card-foot{display:flex;align-items:center;justify-content:space-between;margin-top:11px}
.chip{font-size:10px;border:1px solid;padding:2px 7px;border-radius:999px;font-weight:500}
.card-meta{display:flex;align-items:center;gap:4px;font-size:10px;color:var(--txt-faint);font-family:'IBM Plex Mono',monospace}
.card-meta .ov{display:flex;align-items:center;gap:3px;color:var(--red)}
.sbar{height:4px;border-radius:99px;background:rgba(255,255,255,.07);overflow:hidden}
.sbar-fill{height:100%;border-radius:99px;background:linear-gradient(90deg,#37c98c,var(--green));box-shadow:0 0 8px rgba(94,242,179,.4)}
.filters{display:flex;align-items:flex-end;gap:14px;flex-wrap:wrap;padding:14px 16px;background:var(--bg-2);border:1px solid var(--line);border-radius:12px;margin-bottom:14px}
.fsel{display:flex;flex-direction:column;gap:5px}
.fsel label,.fslide label{font-size:10.5px;color:var(--txt-faint);font-family:'IBM Plex Mono',monospace;letter-spacing:.5px}
.fsel select{background:var(--bg-3);border:1px solid var(--line-2);color:var(--txt);border-radius:8px;padding:7px 10px;font-family:inherit;font-size:12.5px;cursor:pointer;min-width:96px}
.fslide{display:flex;flex-direction:column;gap:7px;min-width:150px}
.fslide b{color:var(--green);font-family:'IBM Plex Mono',monospace}
.fslide input{accent-color:var(--green);cursor:pointer}
.fcount{margin-left:auto;font-family:'IBM Plex Mono',monospace;color:var(--txt-dim);font-size:13px;align-self:center}
.tbl{border:1px solid var(--line);border-radius:12px;overflow:hidden;background:var(--bg-2)}
.tr{display:grid;grid-template-columns:96px 1.7fr 1.1fr .7fr .8fr 1.1fr 28px;align-items:center;gap:10px;width:100%;text-align:left;background:transparent;border:none;border-bottom:1px solid var(--line);padding:12px 16px;font-family:inherit;color:var(--txt);cursor:pointer;transition:.13s;font-size:13px}
.tr:last-child{border-bottom:none}
.tr:not(.th):hover{background:rgba(94,242,179,.04)}
.tr.th{background:var(--bg-3);cursor:default;font-size:10.5px;color:var(--txt-faint);font-family:'IBM Plex Mono',monospace;letter-spacing:.6px;text-transform:uppercase}
.c-tk{font-family:'IBM Plex Mono',monospace;font-weight:600}
.kssub{color:var(--txt-faint);font-size:9px}
.c-nm{display:flex;align-items:center;gap:7px}
.c-nm .rg{color:var(--txt-faint);flex-shrink:0}
.ovtag{font-size:9px;color:var(--red);border:1px solid rgba(255,111,111,.35);padding:1px 5px;border-radius:5px}
.thpill{font-size:10px;color:var(--blue);background:rgba(106,166,255,.1);border:1px solid rgba(106,166,255,.25);padding:2px 7px;border-radius:6px;white-space:nowrap}
.thpill.sm{font-size:9.5px}
.c-rk{display:flex;align-items:center;gap:6px;font-size:12px;color:var(--txt-dim)}
.dot{width:7px;height:7px;border-radius:99px;flex-shrink:0}
.c-sc{display:flex;align-items:center;gap:9px}
.scnum{font-weight:600;font-size:14px;min-width:22px}
.c-sc .sbar{flex:1}
.c-go{color:var(--txt-faint);display:flex;justify-content:flex-end}
.news-intro{font-size:13px;color:var(--txt-dim);margin:0 0 16px}
.news-row{display:flex;gap:16px;padding:15px 0;border-bottom:1px solid var(--line)}
.news-time{font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--txt-faint);min-width:60px;padding-top:2px}
.news-h{font-size:14.5px;font-weight:500;line-height:1.45}
.news-tags{display:flex;align-items:center;gap:7px;margin-top:9px;flex-wrap:wrap}
.tkpill{display:flex;align-items:center;gap:3px;font-family:'IBM Plex Mono',monospace;font-size:11px;color:var(--green);background:rgba(94,242,179,.08);border:1px solid rgba(94,242,179,.25);padding:3px 8px;border-radius:6px;cursor:pointer;transition:.14s;font-weight:500}
.tkpill:hover{background:rgba(94,242,179,.16)}
.scrim{position:fixed;inset:0;background:rgba(4,6,10,.62);backdrop-filter:blur(3px);z-index:40;animation:fade .2s ease}
.panel{position:fixed;top:0;right:0;bottom:0;width:440px;max-width:92vw;z-index:50;background:var(--panel);border-left:1px solid var(--line-2);padding:24px;overflow-y:auto;animation:slide .26s cubic-bezier(.2,.8,.2,1);box-shadow:-30px 0 60px rgba(0,0,0,.5)}
.panel-hd{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:16px}
.panel-tk{font-family:'IBM Plex Mono',monospace;font-size:13px;color:var(--green);font-weight:600}
.panel-nm{font-size:22px;font-weight:700;margin-top:2px}
.panel-th{margin-top:8px}
.x{background:var(--bg-3);border:1px solid var(--line);color:var(--txt-dim);width:34px;height:34px;border-radius:9px;display:grid;place-items:center;cursor:pointer;transition:.14s}
.x:hover{color:var(--txt);border-color:var(--line-2)}
.spk{width:100%;height:56px;display:block;margin:4px 0 18px}
.metrics{display:grid;grid-template-columns:1fr 1fr;gap:9px;margin-bottom:14px}
.metric{background:var(--bg-3);border:1px solid var(--line);border-radius:10px;padding:11px 13px}
.metric-label{font-size:10px;color:var(--txt-faint);font-family:'IBM Plex Mono',monospace;letter-spacing:.5px}
.metric-val{font-size:18px;font-weight:600;margin-top:4px}
.breakdown{background:linear-gradient(160deg,rgba(106,166,255,.05),var(--bg-3) 55%);border:1px solid var(--line);border-radius:12px;padding:15px;margin-bottom:14px}
.bd-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:13px}
.bd-title{display:flex;align-items:center;gap:7px;font-size:11px;color:var(--txt-dim);font-weight:500}
.bd-final{font-size:30px;font-weight:600;line-height:1}
.bd-row{display:grid;grid-template-columns:130px 1fr 26px;align-items:center;gap:10px;margin-bottom:8px}
.bd-row .lab{font-size:11px;color:var(--txt-dim)}
.bd-row .num{font-family:'IBM Plex Mono',monospace;font-size:12px;text-align:right;color:var(--txt)}
.bd-bar{height:6px;border-radius:99px;background:rgba(255,255,255,.06);overflow:hidden}
.bd-bar i{display:block;height:100%;border-radius:99px;background:linear-gradient(90deg,#3d7fff,var(--blue))}
.bd-calc{margin-top:12px;padding-top:12px;border-top:1px solid var(--line);font-size:13px;color:var(--txt-dim);display:flex;align-items:center;gap:6px;flex-wrap:wrap}
.bd-calc b{font-family:'IBM Plex Mono',monospace;color:var(--txt)}
.bd-calc b.final{color:var(--green);font-size:16px}
.bd-calc b.pen{color:var(--red)}
.bd-warn{margin-top:9px;font-size:11px;color:var(--red);display:flex;align-items:center;gap:6px}
.bd-note{margin-top:8px;font-size:10.5px;color:var(--txt-faint)}
.why-card{background:var(--bg-3);border:1px solid var(--line);border-radius:11px;padding:14px;margin-bottom:16px}
.why-label{display:flex;align-items:center;gap:6px;font-size:11px;color:var(--amber);font-weight:500;margin-bottom:7px}
.why-card p{margin:0;font-size:13.5px;line-height:1.55;color:var(--txt)}
.seed{background:linear-gradient(160deg,rgba(94,242,179,.06),var(--bg-3) 55%);border:1px solid rgba(94,242,179,.2);border-radius:13px;padding:15px;margin-bottom:14px}
.seed-hd{display:flex;align-items:center;justify-content:space-between;margin-bottom:12px}
.seed-label{display:flex;align-items:center;gap:7px;font-size:13px;font-weight:600;color:var(--green)}
.seed-by{font-family:'IBM Plex Mono',monospace;font-size:9.5px;color:var(--txt-faint);border:1px solid var(--line);padding:2px 6px;border-radius:5px}
.gen-btn{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;padding:12px;border-radius:10px;background:linear-gradient(135deg,var(--green),#34c389);color:#04140d;border:none;font-family:inherit;font-size:13.5px;font-weight:600;cursor:pointer;transition:.15s;box-shadow:0 4px 18px rgba(94,242,179,.25)}
.gen-btn:hover{filter:brightness(1.06);transform:translateY(-1px)}
.gen-loading{display:flex;align-items:center;gap:9px;padding:13px;color:var(--txt-dim);font-size:13px;justify-content:center}
.gen-err{display:flex;align-items:center;gap:8px;font-size:12.5px;color:var(--red);padding:6px 2px}
.retry,.regen{margin-left:auto;background:var(--bg-2);border:1px solid var(--line-2);color:var(--txt);font-family:inherit;font-size:11px;padding:5px 11px;border-radius:7px;cursor:pointer}
.seed-thesis{font-size:13px;line-height:1.6;color:var(--txt);padding:11px 12px;background:var(--bg-2);border-radius:9px;border:1px solid var(--line);margin-bottom:14px}
.seed-sec-label{font-size:10px;color:var(--txt-faint);font-family:'IBM Plex Mono',monospace;letter-spacing:1px;text-transform:uppercase;margin:0 0 8px}
.seed-item{display:flex;gap:10px;align-items:flex-start;padding:7px 0;font-size:13px;line-height:1.5}
.seed-num{flex-shrink:0;width:18px;height:18px;border-radius:5px;background:rgba(94,242,179,.12);color:var(--green);font-family:'IBM Plex Mono',monospace;font-size:11px;display:grid;place-items:center;margin-top:1px}
.seed-title{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:9px 11px;margin-bottom:6px;background:var(--bg-2);border:1px solid var(--line);border-radius:8px;font-size:13px;line-height:1.4}
.cp{flex-shrink:0;background:transparent;border:none;color:var(--txt-faint);cursor:pointer;display:grid;place-items:center;transition:.14s}
.cp:hover{color:var(--green)}
.regen{margin-top:10px;width:100%;padding:9px}
.panel-foot{font-size:10.5px;color:var(--txt-faint);line-height:1.5;border-top:1px solid var(--line);padding-top:12px}
@keyframes fade{from{opacity:0}to{opacity:1}}
@keyframes slide{from{transform:translateX(30px);opacity:0}to{transform:translateX(0);opacity:1}}
@keyframes rise{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
.stagger{animation:rise .4s ease backwards}
.spin{animation:spin 1s linear infinite}
@keyframes spin{to{transform:rotate(360deg)}}
.toast{position:fixed;bottom:22px;left:50%;transform:translateX(-50%);z-index:60;display:flex;align-items:center;gap:9px;max-width:min(560px,92vw);padding:12px 16px;border-radius:12px;background:var(--bg-2);border:1px solid var(--line-2);color:var(--txt);font-size:12.5px;line-height:1.5;box-shadow:0 16px 40px rgba(0,0,0,.5);animation:rise .25s ease}
.toast.err{border-color:rgba(255,111,111,.4);background:linear-gradient(180deg,rgba(255,111,111,.08),var(--bg-2));color:#ffd0d0}
.toast-x{flex-shrink:0;background:transparent;border:none;color:inherit;opacity:.7;cursor:pointer;display:grid;place-items:center}
.toast-x:hover{opacity:1}
@media(max-width:720px){
  .main{padding:18px 14px 50px}
  .grid{grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
  .tr{grid-template-columns:70px 1.4fr .8fr .9fr;font-size:12px}
  .tr .c-th,.tr .c-rv,.tr .c-go{display:none}
  .tr.th .c-th,.tr.th .c-rv,.tr.th .c-go{display:none}
  .panel{width:100%;max-width:100vw;padding:18px}
  .hdr{padding:14px 16px}.nav{padding:12px 14px 0}.nav-note{display:none}
  .settings{position:fixed;top:64px;right:14px;left:14px;width:auto}
}
`;
