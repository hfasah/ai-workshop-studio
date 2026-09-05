import React from "react";
import {theme} from "../theme";

// Reusable flat illustrations in the series palette. All share a 200x160 canvas.
type P = {size?: number; accent?: string};
const wrap = (children: React.ReactNode, size = 220) => (
  <svg width={size} height={size * 0.8} viewBox="0 0 200 160" style={{overflow: "visible", filter: "drop-shadow(0 10px 18px rgba(15,23,42,0.12))"}}>
    {children}
  </svg>
);
const ink = theme.ink, blue = theme.blue, soft = theme.blueSoft, amber = theme.accent, teal = theme.teal, coral = theme.coral;

export const ILLUSTRATIONS: Record<string, React.FC<P>> = {
  phone: ({size}) => wrap(<g><rect x="70" y="8" width="60" height="144" rx="12" fill={ink} /><rect x="76" y="20" width="48" height="112" rx="6" fill="#fff" /><rect x="84" y="34" width="32" height="8" rx="4" fill={soft} /><rect x="84" y="50" width="22" height="8" rx="4" fill={soft} /><rect x="84" y="70" width="32" height="26" rx="6" fill={blue} /><circle cx="100" cy="142" r="4" fill="#fff" /></g>, size),
  laptop: ({size}) => wrap(<g><rect x="30" y="24" width="140" height="92" rx="8" fill={ink} /><rect x="38" y="32" width="124" height="76" rx="4" fill="#fff" /><rect x="48" y="44" width="60" height="8" rx="4" fill={soft} /><rect x="48" y="60" width="90" height="8" rx="4" fill={soft} /><rect x="48" y="76" width="40" height="20" rx="5" fill={blue} /><rect x="14" y="118" width="172" height="12" rx="6" fill="#CBD5E1" /></g>, size),
  server: ({size}) => wrap(<g>{[0, 1, 2].map((i) => <g key={i}><rect x="40" y={20 + i * 42} width="120" height="34" rx="8" fill={i === 1 ? blue : ink} /><circle cx="58" cy={37 + i * 42} r="5" fill={i === 1 ? "#fff" : teal} /><rect x="74" y={33 + i * 42} width="60" height="8" rx="4" fill={i === 1 ? "#fff" : "#475569"} /></g>)}</g>, size),
  database: ({size}) => wrap(<g><ellipse cx="100" cy="34" rx="60" ry="18" fill={blue} /><path d="M40 34 v80 a60 18 0 0 0 120 0 v-80" fill={soft} /><ellipse cx="100" cy="74" rx="60" ry="18" fill="none" stroke={blue} strokeWidth="4" /><ellipse cx="100" cy="114" rx="60" ry="18" fill="none" stroke={blue} strokeWidth="4" /></g>, size),
  document: ({size}) => wrap(<g><path d="M50 10 h70 l30 30 v110 h-100 z" fill="#fff" stroke={ink} strokeWidth="5" strokeLinejoin="round" /><path d="M120 10 v30 h30" fill={soft} stroke={ink} strokeWidth="5" strokeLinejoin="round" /><rect x="66" y="64" width="68" height="8" rx="4" fill={soft} /><rect x="66" y="82" width="52" height="8" rx="4" fill={soft} /><rect x="66" y="100" width="60" height="8" rx="4" fill={amber} /></g>, size),
  cloud: ({size}) => wrap(<g><path d="M56 118 a30 30 0 0 1 8 -58 a40 40 0 0 1 76 -8 a28 28 0 0 1 8 66 z" fill={soft} stroke={blue} strokeWidth="5" strokeLinejoin="round" /></g>, size),
  shield: ({size}) => wrap(<g><path d="M100 10 l64 26 v50 c0 36 -30 60 -64 68 c-34 -8 -64 -32 -64 -68 v-50 z" fill={coral} /><path d="M100 26 l46 19 v42 c0 26 -22 44 -46 50 c-24 -6 -46 -24 -46 -50 v-42 z" fill="#fff" opacity="0.18" /><rect x="84" y="74" width="32" height="28" rx="6" fill="#fff" /><path d="M90 74 v-10 a10 10 0 0 1 20 0 v10" stroke="#fff" strokeWidth="6" fill="none" /></g>, size),
  person: ({size}) => wrap(<g><circle cx="100" cy="50" r="30" fill="#8D5524" /><path d="M40 156 c0 -40 27 -60 60 -60 s60 20 60 60 z" fill={blue} /><path d="M70 42 q30 -30 60 0 q-6 -24 -30 -26 q-24 2 -30 26z" fill="#1A1A1A" /></g>, size),
  farm: ({size}) => wrap(<g><rect x="0" y="120" width="200" height="40" rx="6" fill={theme.tealSoft} />{[30, 70, 110, 150].map((x) => <g key={x}><path d={`M${x} 120 v-46`} stroke={teal} strokeWidth="6" strokeLinecap="round" /><ellipse cx={x - 14} cy="90" rx="14" ry="8" fill={teal} transform={`rotate(-30 ${x - 14} 90)`} /><ellipse cx={x + 14} cy="78" rx="14" ry="8" fill={teal} transform={`rotate(30 ${x + 14} 78)`} /></g>)}<circle cx="164" cy="34" r="18" fill={amber} /></g>, size),
  truck: ({size}) => wrap(<g><rect x="14" y="50" width="110" height="70" rx="8" fill={blue} /><path d="M124 70 h36 l26 28 v22 h-62 z" fill={ink} /><rect x="136" y="78" width="22" height="18" rx="3" fill="#fff" /><circle cx="50" cy="126" r="16" fill={ink} /><circle cx="50" cy="126" r="7" fill="#fff" /><circle cx="156" cy="126" r="16" fill={ink} /><circle cx="156" cy="126" r="7" fill="#fff" /></g>, size),
  envelope: ({size}) => wrap(<g><rect x="20" y="36" width="160" height="100" rx="10" fill="#fff" stroke={ink} strokeWidth="5" /><path d="M24 44 l76 56 l76 -56" fill="none" stroke={ink} strokeWidth="5" strokeLinejoin="round" /><circle cx="160" cy="44" r="16" fill={coral} /></g>, size),
  calendar: ({size}) => wrap(<g><rect x="24" y="30" width="152" height="120" rx="12" fill="#fff" stroke={ink} strokeWidth="5" /><rect x="24" y="30" width="152" height="34" rx="12" fill={ink} />{[0, 1, 2].map((r) => [0, 1, 2, 3].map((c) => <rect key={`${r}${c}`} x={40 + c * 34} y={76 + r * 22} width="24" height="14" rx="3" fill={r === 1 && c === 1 ? amber : soft} />))}</g>, size),
  storefront: ({size}) => wrap(<g><rect x="24" y="70" width="152" height="80" rx="6" fill="#fff" stroke={ink} strokeWidth="5" /><path d="M16 70 l12 -36 h144 l12 36 z" fill={amber} stroke={ink} strokeWidth="5" strokeLinejoin="round" /><rect x="86" y="100" width="28" height="50" rx="3" fill={blue} /><rect x="40" y="96" width="30" height="24" rx="3" fill={soft} /></g>, size),
  clinic: ({size}) => wrap(<g><rect x="30" y="40" width="140" height="110" rx="8" fill="#fff" stroke={ink} strokeWidth="5" /><rect x="86" y="14" width="28" height="26" rx="4" fill={coral} /><rect x="90" y="62" width="20" height="60" fill={coral} /><rect x="70" y="82" width="60" height="20" fill={coral} /></g>, size),
  chat: ({size}) => wrap(<g><path d="M20 30 h110 a12 12 0 0 1 12 12 v44 a12 12 0 0 1 -12 12 h-60 l-26 22 v-22 h-24 a12 12 0 0 1 -12 -12 v-44 a12 12 0 0 1 12 -12 z" fill={soft} stroke={blue} strokeWidth="5" strokeLinejoin="round" /><path d="M78 80 h100 a12 12 0 0 1 12 12 v36 a12 12 0 0 1 -12 12 h-22 v20 l-24 -20 h-54 a12 12 0 0 1 -12 -12 v-36 a12 12 0 0 1 12 -12 z" fill="#fff" stroke={ink} strokeWidth="5" strokeLinejoin="round" /></g>, size),
  robot: ({size}) => wrap(<g><rect x="50" y="40" width="100" height="80" rx="20" fill="#F1F5F9" stroke={blue} strokeWidth="5" /><rect x="66" y="60" width="26" height="16" rx="5" fill={blue} /><rect x="108" y="60" width="26" height="16" rx="5" fill={blue} /><rect x="80" y="94" width="40" height="8" rx="4" fill={blue} /><line x1="100" y1="40" x2="100" y2="16" stroke="#94A3B8" strokeWidth="5" /><circle cx="100" cy="12" r="8" fill={amber} /><rect x="64" y="122" width="72" height="28" rx="10" fill={ink} /></g>, size),
};

export const Illustration: React.FC<{name: string; size?: number}> = ({name, size = 220}) => {
  const Cmp = ILLUSTRATIONS[name];
  return Cmp ? <Cmp size={size} /> : null;
};
export const ILLUSTRATION_NAMES = Object.keys(ILLUSTRATIONS);
