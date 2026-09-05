import React from "react";
import {useCurrentFrame} from "remotion";
import type {Character, Expression, Gesture} from "../types";

export type CharacterRenderProps = {
  character: Character;
  amplitude: number; // 0..1
  speaking: boolean;
  expression: Expression;
  gesture: Gesture;
  height: number; // px
  flip: boolean; // true = faces left
};

const blinkScale = (frame: number, seed: number) => {
  const period = 110 + (seed % 5) * 17;
  const t = (frame + seed * 13) % period;
  return t < 4 ? 0.1 : 1;
};

const browAngle = (e: Expression): [number, number] => {
  switch (e) {
    case "serious":
      return [12, -12];
    case "confused":
      return [-10, 8];
    case "surprised":
      return [0, 0];
    case "happy":
    case "confident":
      return [-4, 4];
    default:
      return [0, 0];
  }
};

// Outward swing of each arm in degrees (0 = hanging down, 90 = horizontal, 150 = raised).
// "left"/"right" are the VIEWER's left/right after any mirroring.
const armAngles = (g: Gesture, flip: boolean): {left: number; right: number; raise: boolean} => {
  let a: {left: number; right: number; raise: boolean};
  switch (g) {
    case "explain":
      a = {left: 35, right: 35, raise: false};
      break;
    case "point_right":
      a = {left: 6, right: 92, raise: false};
      break;
    case "point_left":
      a = {left: 92, right: 6, raise: false};
      break;
    case "warning":
      a = {left: 8, right: 150, raise: true};
      break;
    default:
      a = {left: 6, right: 6, raise: false};
  }
  // the SVG is mirrored for flipped characters, so swap sides to keep viewer semantics
  return flip ? {left: a.right, right: a.left, raise: a.raise} : a;
};

const Mouth: React.FC<{amplitude: number; speaking: boolean; expression: Expression; color: string}> = ({amplitude, speaking, expression, color}) => {
  if (speaking) {
    const ry = 3 + amplitude * 13;
    const rx = 12 + amplitude * 4;
    return (
      <g>
        <ellipse cx={100} cy={152} rx={rx} ry={ry} fill="#3A1F1A" />
        <ellipse cx={100} cy={152 + ry * 0.45} rx={rx * 0.6} ry={Math.max(1, ry * 0.4)} fill="#C0504D" />
        <rect x={100 - rx * 0.7} y={152 - ry} width={rx * 1.4} height={Math.min(5, ry)} fill="#F4F4F4" />
      </g>
    );
  }
  const curve = expression === "happy" || expression === "confident" ? 10 : expression === "serious" ? -4 : expression === "confused" ? -2 : 2;
  if (expression === "surprised") return <ellipse cx={100} cy={152} rx={9} ry={11} fill="#3A1F1A" />;
  return <path d={`M 84 150 Q 100 ${150 + curve * 1.6} 116 150`} stroke={color} strokeWidth={4} fill="none" strokeLinecap="round" />;
};

const Human: React.FC<CharacterRenderProps> = ({character, amplitude, speaking, expression, gesture, height, flip}) => {
  const frame = useCurrentFrame();
  const look = character.look ?? {skin: "#8D5524", hair: "#222", hairGrey: null, shirt: "#1F5F8B", glasses: false, beard: false, height: 1};
  const seed = character.id.length * 7;
  const bob = Math.sin(frame / 14 + seed) * 3;
  const blink = blinkScale(frame, seed);
  const [bl, br] = browAngle(expression);
  const arms = armAngles(gesture, flip);
  const w = height * 0.5;
  const shirtDark = "#0F2E44";

  return (
    <svg width={w} height={height} viewBox="0 0 200 400" style={{transform: `${flip ? "scaleX(-1)" : ""} translateY(${bob}px)`, overflow: "visible"}}>
      <ellipse cx={100} cy={396} rx={70} ry={9} fill="#0F172A" opacity={0.12} />
      <g stroke="#0F172A" strokeWidth={0} strokeLinejoin="round">
      {/* legs */}
      <rect x={70} y={300} width={26} height={90} rx={8} fill="#1C2333" />
      <rect x={104} y={300} width={26} height={90} rx={8} fill="#1C2333" />
      <rect x={64} y={380} width={38} height={16} rx={6} fill="#0B0F17" />
      <rect x={98} y={380} width={38} height={16} rx={6} fill="#0B0F17" />
      {/* torso */}
      <path d="M 55 200 Q 100 180 145 200 L 150 310 L 50 310 Z" fill={look.shirt} />
      <path d="M 100 190 L 88 215 L 100 240 L 112 215 Z" fill={shirtDark} />
      {/* arms */}
      <g transform={`rotate(${arms.left} 60 205)`}>
        <rect x={44} y={200} width={26} height={110} rx={13} fill={look.shirt} />
        <circle cx={57} cy={312} r={14} fill={look.skin} />
      </g>
      <g transform={`rotate(${-arms.right} 140 205)`}>
        <rect x={130} y={200} width={26} height={110} rx={13} fill={look.shirt} />
        <circle cx={143} cy={312} r={14} fill={look.skin} />
        {arms.raise ? <rect x={139} y={318} width={8} height={22} rx={4} fill={look.skin} /> : null}
      </g>
      {/* neck + head */}
      <rect x={88} y={165} width={24} height={30} fill={look.skin} />
      <ellipse cx={100} cy={120} rx={52} ry={58} fill={look.skin} />
      {/* ears */}
      <ellipse cx={48} cy={125} rx={9} ry={13} fill={look.skin} />
      <ellipse cx={152} cy={125} rx={9} ry={13} fill={look.skin} />
      {/* hair */}
      <path d="M 48 108 Q 50 52 100 52 Q 150 52 152 108 Q 140 78 100 74 Q 60 78 48 108 Z" fill={look.hair} />
      {look.hairGrey ? <path d="M 60 84 Q 80 66 100 66 Q 120 66 140 84" stroke={look.hairGrey} strokeWidth={5} fill="none" opacity={0.7} strokeLinecap="round" /> : null}
      {/* beard */}
      {look.beard ? <path d="M 58 140 Q 62 185 100 182 Q 138 185 142 140 Q 128 168 100 166 Q 72 168 58 140 Z" fill={look.hair} opacity={0.9} /> : null}
      {look.beard && look.hairGrey ? <path d="M 74 160 Q 100 178 126 160" stroke={look.hairGrey} strokeWidth={4} fill="none" opacity={0.6} strokeLinecap="round" /> : null}
      {/* eyes */}
      <g transform={`translate(78 118) scale(1 ${blink}) translate(-78 -118)`}>
        <ellipse cx={78} cy={118} rx={9} ry={7} fill="#fff" />
        <circle cx={80} cy={118} r={4.5} fill="#1a1a1a" />
      </g>
      <g transform={`translate(122 118) scale(1 ${blink}) translate(-122 -118)`}>
        <ellipse cx={122} cy={118} rx={9} ry={7} fill="#fff" />
        <circle cx={124} cy={118} r={4.5} fill="#1a1a1a" />
      </g>
      {/* brows */}
      <line x1={66} y1={102} x2={90} y2={102} stroke={look.hair} strokeWidth={5} strokeLinecap="round" transform={`rotate(${bl} 78 102)`} />
      <line x1={110} y1={102} x2={134} y2={102} stroke={look.hair} strokeWidth={5} strokeLinecap="round" transform={`rotate(${br} 122 102)`} />
      {/* glasses */}
      {look.glasses ? (
        <g stroke="#E5E7EB" strokeWidth={3} fill="rgba(255,255,255,0.08)">
          <rect x={62} y={106} width={32} height={24} rx={7} />
          <rect x={106} y={106} width={32} height={24} rx={7} />
          <line x1={94} y1={116} x2={106} y2={116} />
        </g>
      ) : null}
      {/* nose */}
      <path d="M 100 128 L 94 142 L 106 142 Z" fill="rgba(0,0,0,0.18)" />
      <Mouth amplitude={amplitude} speaking={speaking} expression={expression} color="#3A1F1A" />
      </g>
    </svg>
  );
};

const Robot: React.FC<CharacterRenderProps> = ({character, amplitude, speaking, expression, gesture, height, flip}) => {
  const frame = useCurrentFrame();
  const c = character.color;
  const hover = Math.sin(frame / 12) * 8;
  const pulse = 0.6 + 0.4 * Math.sin(frame / 6);
  const mouthH = speaking ? 4 + amplitude * 22 : 4;
  const [bl, br] = browAngle(expression);
  const arms = armAngles(gesture, flip);
  const w = height * 0.55;
  return (
    <svg width={w} height={height} viewBox="0 0 220 400" style={{transform: `${flip ? "scaleX(-1)" : ""} translateY(${hover}px)`, overflow: "visible"}}>
      <ellipse cx={110} cy={392} rx={70} ry={10} fill="#0F172A" opacity={0.12} />
      {/* antenna */}
      <line x1={110} y1={95} x2={110} y2={60} stroke="#94A3B8" strokeWidth={6} />
      <circle cx={110} cy={52} r={12} fill={c} opacity={pulse} />
      {/* body */}
      <rect x={45} y={220} width={130} height={120} rx={30} fill="#F1F5F9" stroke={c} strokeWidth={4} />
      <circle cx={110} cy={280} r={16} fill={c} opacity={0.5} />
      {/* arms */}
      <g transform={`rotate(${arms.left} 45 235)`}>
        <rect x={20} y={225} width={26} height={80} rx={13} fill="#334155" />
        <circle cx={33} cy={310} r={14} fill={c} />
      </g>
      <g transform={`rotate(${-arms.right} 175 235)`}>
        <rect x={174} y={225} width={26} height={80} rx={13} fill="#334155" />
        <circle cx={187} cy={310} r={14} fill={c} />
      </g>
      {/* head */}
      <rect x={30} y={95} width={160} height={120} rx={34} fill="#F1F5F9" stroke={c} strokeWidth={4} />
      <rect x={45} y={110} width={130} height={90} rx={20} fill="#0B1220" />
      {/* eyes */}
      <g transform={`rotate(${bl} 80 145)`}>
        <rect x={64} y={135} width={32} height={20} rx={6} fill={c} />
      </g>
      <g transform={`rotate(${br} 140 145)`}>
        <rect x={124} y={135} width={32} height={20} rx={6} fill={c} />
      </g>
      {/* mouth bar */}
      <rect x={110 - 30} y={185 - mouthH / 2} width={60} height={mouthH} rx={4} fill={c} opacity={0.9} />
      {/* wheels/feet */}
      <rect x={70} y={340} width={80} height={14} rx={7} fill="#334155" />
    </svg>
  );
};

const Wisp: React.FC<CharacterRenderProps> = ({character, amplitude, speaking, expression, height, flip}) => {
  const frame = useCurrentFrame();
  const c = character.color;
  const float = Math.sin(frame / 10) * 10;
  const wob = (i: number) => Math.sin(frame / 7 + i) * 6;
  const mouthH = speaking ? 4 + amplitude * 18 : 3;
  const [bl, br] = browAngle(expression);
  const w = height * 0.55;
  const d = `M 40 120 Q 40 40 110 40 Q 180 40 180 120 L 180 ${300 + wob(0)} Q 160 ${330 + wob(1)} 140 ${300 + wob(2)} Q 120 ${335 + wob(3)} 100 ${300 + wob(4)} Q 80 ${335 + wob(5)} 60 ${300 + wob(6)} Q 40 ${330 + wob(7)} 40 ${300 + wob(8)} Z`;
  return (
    <svg width={w} height={height} viewBox="0 0 220 400" style={{transform: `${flip ? "scaleX(-1)" : ""} translateY(${float}px)`, overflow: "visible"}}>
      <defs>
        <filter id={`wglow-${character.id}`}>
          <feGaussianBlur stdDeviation="14" />
        </filter>
      </defs>
      <path d={d} fill={c} opacity={0.35} filter={`url(#wglow-${character.id})`} />
      <path d={d} fill={c} opacity={0.85} />
      {/* sly eyes */}
      <g transform={`rotate(${bl + 14} 82 130)`}>
        <ellipse cx={82} cy={130} rx={16} ry={10} fill="#fff" />
        <circle cx={86} cy={131} r={5} fill="#2E1065" />
      </g>
      <g transform={`rotate(${br - 14} 138 130)`}>
        <ellipse cx={138} cy={130} rx={16} ry={10} fill="#fff" />
        <circle cx={142} cy={131} r={5} fill="#2E1065" />
      </g>
      {/* grin */}
      {speaking ? <ellipse cx={110} cy={185} rx={26} ry={mouthH} fill="#2E1065" /> : <path d="M 78 178 Q 110 210 142 178" stroke="#2E1065" strokeWidth={5} fill="none" strokeLinecap="round" />}
      {/* sparkles: confident but wrong */}
      {[0, 1, 2].map((i) => (
        <text key={i} x={30 + i * 70} y={70 + Math.sin(frame / 9 + i) * 10} fontSize={26} fill="#fff" opacity={0.6 + 0.3 * Math.sin(frame / 5 + i)}>
          {["!", "?", "✦"][i]}
        </text>
      ))}
    </svg>
  );
};

const Shield: React.FC<CharacterRenderProps> = ({character, amplitude, speaking, expression, height, flip}) => {
  const frame = useCurrentFrame();
  const c = character.color;
  const bob = Math.sin(frame / 20) * 2;
  const mouthH = speaking ? 4 + amplitude * 16 : 3;
  const [bl, br] = browAngle(expression === "neutral" ? "serious" : expression);
  const w = height * 0.5;
  return (
    <svg width={w} height={height} viewBox="0 0 200 400" style={{transform: `${flip ? "scaleX(-1)" : ""} translateY(${bob}px)`, overflow: "visible"}}>
      <path d="M 100 40 L 180 75 L 175 220 Q 165 320 100 380 Q 35 320 25 220 L 20 75 Z" fill="#7F1D1D" stroke={c} strokeWidth={6} strokeLinejoin="round" />
      <path d="M 100 70 L 160 95 L 156 215 Q 148 295 100 345 Q 52 295 44 215 L 40 95 Z" fill="#991B1B" opacity={0.8} />
      {/* eyes */}
      <g transform={`rotate(${bl} 72 150)`}>
        <rect x={54} y={140} width={36} height={16} rx={5} fill="#FEE2E2" />
        <circle cx={74} cy={148} r={5} fill="#450A0A" />
      </g>
      <g transform={`rotate(${br} 128 150)`}>
        <rect x={110} y={140} width={36} height={16} rx={5} fill="#FEE2E2" />
        <circle cx={126} cy={148} r={5} fill="#450A0A" />
      </g>
      <line x1={50} y1={126} x2={92} y2={126} stroke="#FEE2E2" strokeWidth={6} strokeLinecap="round" transform={`rotate(${bl} 72 126)`} />
      <line x1={108} y1={126} x2={150} y2={126} stroke="#FEE2E2" strokeWidth={6} strokeLinecap="round" transform={`rotate(${br} 128 126)`} />
      {/* mouth */}
      <rect x={70} y={200 - mouthH / 2} width={60} height={mouthH} rx={4} fill="#FEE2E2" />
      {/* lock */}
      <rect x={78} y={255} width={44} height={36} rx={6} fill={c} />
      <path d="M 86 255 V 240 A 14 14 0 0 1 114 240 V 255" stroke={c} strokeWidth={7} fill="none" />
      <circle cx={100} cy={272} r={5} fill="#450A0A" />
    </svg>
  );
};

export const PlaceholderCharacter: React.FC<CharacterRenderProps> = (props) => {
  switch (props.character.kind) {
    case "robot":
      return <Robot {...props} />;
    case "wisp":
      return <Wisp {...props} />;
    case "shield":
      return <Shield {...props} />;
    default:
      return <Human {...props} />;
  }
};
