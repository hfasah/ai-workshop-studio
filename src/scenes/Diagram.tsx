import React from "react";
import {interpolate, useCurrentFrame, useVideoConfig} from "remotion";
import type {Scene} from "../types";
import {theme} from "../theme";
import {useContentBox, useEnter, usePop} from "./Panel";
import {useStepTiming} from "./Demo";
import {Icon, paletteFor} from "../components/Icon";
import {Marker} from "../components/Marker";
import {Illustration} from "../components/Illustrations";

// Boxes-and-connectors diagram on a grid.
// onScreen: { title, cols, nodes:[{id,label,sub,icon,col,row,color,shape:"box"|"pill"|"cylinder"|"illustration",illustration}],
//            edges:[{from,to,label,style:"solid"|"dashed",kind:"arrow"|"line"|"x",color}], groups:[{label,cols:[a,b],rows:[a,b],color}] }
// Nodes activate one per line when counts match (otherwise evenly); an edge draws once both ends are active.
type Node = {id: string; label: string; sub?: string; icon?: string; col: number; row: number; color?: string; shape?: string; illustration?: string};
type Edge = {from: string; to: string; label?: string; style?: string; kind?: string; color?: string};
type Group = {label?: string; cols: [number, number]; rows: [number, number]; color?: string};

export const Diagram: React.FC<{scene: Scene}> = ({scene}) => {
  const {content, portrait} = useContentBox(scene);
  const nodes: Node[] = scene.onScreen.nodes ?? [];
  const edges: Edge[] = scene.onScreen.edges ?? [];
  const groups: Group[] = scene.onScreen.groups ?? [];
  const {active} = useStepTiming(scene, nodes.length);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = useEnter();
  const cols = scene.onScreen.cols ?? Math.max(...nodes.map((n) => n.col)) + 1;
  const rows = Math.max(...nodes.map((n) => n.row)) + 1;
  const titleH = scene.onScreen.title ? (portrait ? 70 : 90) : 0;
  const gapX = portrait ? 28 : 48;
  const gapY = portrait ? 40 : 70;
  const nodeW = (content.w - gapX * (cols - 1)) / cols;
  const nodeH = Math.min(portrait ? 150 : 170, (content.h - titleH - gapY * (rows - 1)) / rows);
  const pos = (n: Node) => ({x: n.col * (nodeW + gapX), y: titleH + n.row * (nodeH + gapY)});
  const center = (n: Node) => ({cx: pos(n).x + nodeW / 2, cy: pos(n).y + nodeH / 2});
  const byId = Object.fromEntries(nodes.map((n) => [n.id, n]));
  const idx = (id: string) => nodes.findIndex((n) => n.id === id);
  const totalH = titleH + rows * nodeH + (rows - 1) * gapY;
  const offsetY = Math.max(0, (content.h - totalH) / 2);

  const edgePath = (a: Node, b: Node) => {
    const A = center(a), B = center(b);
    const sameRow = a.row === b.row, sameCol = a.col === b.col;
    let x1 = A.cx, y1 = A.cy, x2 = B.cx, y2 = B.cy;
    if (sameRow) { x1 += (b.col > a.col ? 1 : -1) * nodeW / 2 + (b.col > a.col ? 6 : -6); x2 -= (b.col > a.col ? 1 : -1) * nodeW / 2 + (b.col > a.col ? 6 : -6); return {d: `M ${x1} ${y1} L ${x2} ${y2}`, mx: (x1 + x2) / 2, my: y1, lx: (x1 + x2) / 2, ly: y1 - nodeH / 2 - 26, len: Math.abs(x2 - x1)}; }
    if (sameCol) { y1 += (b.row > a.row ? 1 : -1) * nodeH / 2 + (b.row > a.row ? 6 : -6); y2 -= (b.row > a.row ? 1 : -1) * nodeH / 2 + (b.row > a.row ? 6 : -6); return {d: `M ${x1} ${y1} L ${x2} ${y2}`, mx: x1, my: (y1 + y2) / 2, lx: x1, ly: (y1 + y2) / 2, len: Math.abs(y2 - y1)}; }
    // different row and column: leave from the bottom/top, arrive at the side with a smooth curve
    y1 += (b.row > a.row ? 1 : -1) * nodeH / 2 + 6;
    x2 -= (b.col > a.col ? 1 : -1) * nodeW / 2 + 6;
    const d = `M ${x1} ${y1} C ${x1} ${y2}, ${x1} ${y2}, ${x2} ${y2}`;
    return {d, mx: (x1 + x2) / 2, my: (y1 + y2) / 2 + 10, lx: (x1 + x2) / 2, ly: (y1 + y2) / 2 + 10, len: Math.abs(x2 - x1) + Math.abs(y2 - y1)};
  };

  return (
    <div style={{position: "absolute", left: content.x, top: content.y + offsetY, width: content.w, height: totalH, ...enter}}>
      {scene.onScreen.title ? <div style={{fontSize: portrait ? 34 : 42, fontWeight: 900, color: theme.ink, letterSpacing: -1, textAlign: "center", height: titleH}}>{scene.onScreen.title}</div> : null}
      {/* groups */}
      {groups.map((g, i) => {
        const x = g.cols[0] * (nodeW + gapX) - 18, y = titleH + g.rows[0] * (nodeH + gapY) - 18;
        const w = (g.cols[1] - g.cols[0] + 1) * nodeW + (g.cols[1] - g.cols[0]) * gapX + 36;
        const h = (g.rows[1] - g.rows[0] + 1) * nodeH + (g.rows[1] - g.rows[0]) * gapY + 36;
        const c = g.color ?? theme.muted;
        return (
          <div key={i} style={{position: "absolute", left: x, top: y, width: w, height: h, borderRadius: 26, border: `3px dashed ${c}66`, background: `${c}0d`}}>
            {g.label ? <div style={{position: "absolute", top: -16, left: 18, padding: "2px 12px", borderRadius: 999, background: theme.bg, border: `2px solid ${c}66`, color: c, fontSize: 20, fontWeight: 800}}>{g.label}</div> : null}
          </div>
        );
      })}
      <svg width={content.w} height={totalH} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
        <defs>
          <marker id="dg-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={theme.ink} /></marker>
          <marker id="dg-arrow-red" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M 0 0 L 10 5 L 0 10 z" fill={theme.coral} /></marker>
        </defs>
        {edges.map((e, i) => {
          const a = byId[e.from], b = byId[e.to];
          if (!a || !b) return null;
          const on = Math.max(idx(e.from), idx(e.to)) <= active;
          const start = Math.round(fps * 0.3);
          const p = on ? interpolate(frame, [start, start + 14], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
          const {d, mx, my, lx, ly, len} = edgePath(a, b);
          const red = e.kind === "x";
          const color = e.color ?? (red ? theme.coral : theme.ink);
          return (
            <g key={i} opacity={p > 0 ? 1 : 0}>
              <path d={d} stroke={color} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={e.style === "dashed" ? "14 12" : len + 40} strokeDashoffset={e.style === "dashed" ? 0 : (len + 40) * (1 - p)} markerEnd={e.kind === "line" ? undefined : p > 0.9 ? (red ? "url(#dg-arrow-red)" : "url(#dg-arrow)") : undefined} />
              {red && p > 0.9 ? <g stroke={theme.coral} strokeWidth={7} strokeLinecap="round"><line x1={mx - 16} y1={my - 16} x2={mx + 16} y2={my + 16} /><line x1={mx + 16} y1={my - 16} x2={mx - 16} y2={my + 16} /></g> : null}
              {e.label && p > 0.9 ? (
                <g>
                  <rect x={lx - e.label.length * 5.6 - 12} y={ly - 16} width={e.label.length * 11.2 + 24} height={32} rx={16} fill={theme.bg} stroke={theme.panelBorder} strokeWidth={2} />
                  <text x={lx} y={ly + 7} textAnchor="middle" fontSize={20} fontWeight={700} fill={theme.muted} fontFamily={theme.font}>{e.label}</text>
                </g>
              ) : null}
            </g>
          );
        })}
      </svg>
      {nodes.map((n, i) => (
        <DNode key={n.id} i={i} node={n} x={pos(n).x} y={pos(n).y} w={nodeW} h={nodeH} state={i < active ? "done" : i === active ? "active" : "todo"} portrait={portrait} />
      ))}
    </div>
  );
};

const DNode: React.FC<{i: number; node: Node; x: number; y: number; w: number; h: number; state: "done" | "active" | "todo"; portrait: boolean}> = ({i, node, x, y, w, h, state, portrait}) => {
  const pop = usePop(6 + i * 5);
  const {color, soft} = paletteFor(i, node.color);
  const cyl = node.shape === "cylinder";
  const pill = node.shape === "pill";
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, ...pop}}>
      <div style={{position: "relative", width: "100%", height: "100%", boxSizing: "border-box", borderRadius: pill ? 999 : cyl ? "50% / 18%" : 22, background: theme.bg, border: `3px solid ${state === "todo" ? theme.panelBorder : color}`, boxShadow: state === "active" ? `0 0 0 8px ${color}22, ${theme.shadow}` : theme.shadowSoft, display: "flex", flexDirection: node.illustration ? "column" : "row", alignItems: "center", justifyContent: "center", gap: 14, padding: "10px 16px", opacity: state === "todo" ? 0.55 : 1}}>
        {node.illustration ? <Illustration name={node.illustration} size={Math.min(w * 0.6, h * 0.7)} /> : node.icon ? <div style={{width: portrait ? 52 : 64, height: portrait ? 52 : 64, borderRadius: 16, background: soft, display: "grid", placeItems: "center", flex: "none"}}><Icon name={node.icon} size={portrait ? 30 : 36} color={color} /></div> : null}
        <div style={{minWidth: 0}}>
          <div style={{fontSize: portrait ? 24 : 28, fontWeight: 900, color: theme.ink, letterSpacing: -0.5, lineHeight: 1.1}}>{node.label}</div>
          {node.sub ? <div style={{fontSize: portrait ? 17 : 19, color: theme.muted, fontWeight: 500, marginTop: 4}}>{node.sub}</div> : null}
        </div>
        {state === "active" ? <Marker kind="circle" color={theme.accent} inset={-14} width={5} /> : null}
      </div>
    </div>
  );
};
