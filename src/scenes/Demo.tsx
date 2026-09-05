import React from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import type {Scene} from "../types";
import {theme} from "../theme";
import {useContentBox, useEnter, usePop} from "./Panel";
import {Icon, paletteFor} from "../components/Icon";
import {Marker} from "../components/Marker";

// Step-by-step demo: numbered steps on the left, a mock app window on the right that changes per step.
// onScreen: { title, steps: [{ title, detail?, ui: {...} }] }
// Steps are timed to the scene's lines when the counts match, otherwise spread evenly.

type Ui =
  | {kind: "chat"; messages: {from: "user" | "agent"; text: string}[]}
  | {kind: "calendar"; title?: string; days: string[]; slots: {day: number; hour: number; label: string; highlight?: boolean}[]}
  | {kind: "email"; to: string; subject: string; body: string[]}
  | {kind: "approval"; title: string; summary: string[]; approve?: string; reject?: string; clickAt?: number}
  | {kind: "list"; title?: string; items: {text: string; done?: boolean}[]}
  | {kind: "text"; title?: string; lines: string[]};

type Step = {title: string; detail?: string; ui?: Ui};

export const useStepTiming = (scene: Scene, count: number) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = scene.startMs + (frame / fps) * 1000;
  const starts: number[] = [];
  if (scene.lines.length === count) {
    for (const l of scene.lines) starts.push(l.startMs);
  } else {
    const lead = 400;
    const per = (scene.durationMs - lead) / count;
    for (let i = 0; i < count; i++) starts.push(scene.startMs + lead + per * i);
  }
  let active = 0;
  for (let i = 0; i < count; i++) if (nowMs >= starts[i]) active = i;
  const activeStartFrame = Math.round(((starts[active] - scene.startMs) / 1000) * fps);
  return {active, starts, nowMs, frameInStep: frame - activeStartFrame};
};

const Window: React.FC<{title?: string; children: React.ReactNode; width: number; height: number}> = ({title, children, width, height}) => (
  <div style={{width, height, background: theme.bg, borderRadius: 20, border: `2px solid ${theme.panelBorder}`, boxShadow: theme.shadow, overflow: "hidden", display: "flex", flexDirection: "column"}}>
    <div style={{height: 52, background: theme.bg2, borderBottom: `2px solid ${theme.panelBorder}`, display: "flex", alignItems: "center", gap: 10, padding: "0 18px"}}>
      {["#FF5F57", "#FEBC2E", "#28C840"].map((c) => (
        <div key={c} style={{width: 14, height: 14, borderRadius: 7, background: c}} />
      ))}
      <div style={{marginLeft: 12, fontSize: 20, fontWeight: 700, color: theme.muted}}>{title ?? "AI Workshop"}</div>
    </div>
    <div style={{flex: 1, padding: 26, position: "relative", overflow: "hidden"}}>{children}</div>
  </div>
);

const Cursor: React.FC<{x: number; y: number; clickAtFrame: number; from?: {x: number; y: number}}> = ({x, y, clickAtFrame, from = {x: 80, y: 80}}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const move = spring({frame, fps, config: {damping: 18, stiffness: 60}});
  const cx = interpolate(move, [0, 1], [from.x, x]);
  const cy = interpolate(move, [0, 1], [from.y, y]);
  const click = frame >= clickAtFrame ? spring({frame: frame - clickAtFrame, fps, config: {damping: 8, stiffness: 300}}) : 0;
  const ring = interpolate(click, [0, 1], [0, 1]);
  return (
    <div style={{position: "absolute", left: cx, top: cy, pointerEvents: "none"}}>
      {frame >= clickAtFrame ? <div style={{position: "absolute", left: -20 + 4, top: -20 + 4, width: 40, height: 40, borderRadius: 20, border: `4px solid ${theme.blue}`, transform: `scale(${1 + ring})`, opacity: 1 - ring}} /> : null}
      <svg width={34} height={40} viewBox="0 0 24 28" style={{filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.35))", transform: `scale(${1 - (click > 0 && click < 0.6 ? 0.15 : 0)})`}}>
        <path d="M2 2 L2 22 L7.5 17 L11 25 L14.5 23.5 L11 15.5 L18 15.5 Z" fill="#111" stroke="#fff" strokeWidth={1.5} strokeLinejoin="round" />
      </svg>
    </div>
  );
};

const Bubble: React.FC<{from: "user" | "agent"; text: string; delay: number}> = ({from, text, delay}) => {
  const st = useEnter(delay, 16);
  const agent = from === "agent";
  return (
    <div style={{display: "flex", justifyContent: agent ? "flex-start" : "flex-end", marginBottom: 14, ...st}}>
      <div style={{maxWidth: "80%", padding: "14px 20px", borderRadius: 18, fontSize: 26, lineHeight: 1.3, fontWeight: 500, background: agent ? theme.bg2 : theme.blue, color: agent ? theme.ink : "#fff", border: agent ? `2px solid ${theme.panelBorder}` : "none", borderBottomLeftRadius: agent ? 4 : 18, borderBottomRightRadius: agent ? 18 : 4}}>
        {text}
      </div>
    </div>
  );
};

const UiView: React.FC<{ui: Ui; frameInStep: number}> = ({ui, frameInStep}) => {
  const {fps} = useVideoConfig();
  switch (ui.kind) {
    case "chat":
      return (
        <div>
          {ui.messages.map((m, i) => (
            <Bubble key={i} from={m.from} text={m.text} delay={6 + i * 14} />
          ))}
        </div>
      );
    case "calendar": {
      const days = ui.days;
      const hours = [9, 10, 11, 12, 13];
      return (
        <div style={{display: "grid", gridTemplateColumns: `70px repeat(${days.length}, 1fr)`, gridAutoRows: 46, gap: 4, fontSize: 20, color: theme.muted, fontWeight: 700}}>
          <div />
          {days.map((d) => (
            <div key={d} style={{textAlign: "center", color: theme.ink}}>{d}</div>
          ))}
          {hours.map((h) => (
            <React.Fragment key={h}>
              <div style={{textAlign: "right", paddingRight: 8}}>{h}:00</div>
              {days.map((_, di) => {
                const slot = ui.slots.find((s) => s.day === di && s.hour === h);
                return <CalCell key={di} label={slot?.label} highlight={slot?.highlight} filled={Boolean(slot)} />;
              })}
            </React.Fragment>
          ))}
        </div>
      );
    }
    case "email": {
      const typed = Math.floor(interpolate(frameInStep, [10, 10 + fps * 2.2], [0, ui.body.join(" ").length], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}));
      let remaining = typed;
      return (
        <div style={{fontSize: 24, color: theme.ink, lineHeight: 1.5}}>
          <div style={{display: "flex", gap: 12, borderBottom: `2px solid ${theme.panelBorder}`, padding: "6px 0"}}>
            <span style={{color: theme.muted, width: 110}}>To</span>
            <span style={{background: theme.blueSoft, padding: "0 12px", borderRadius: 999, fontWeight: 700}}>{ui.to}</span>
          </div>
          <div style={{display: "flex", gap: 12, borderBottom: `2px solid ${theme.panelBorder}`, padding: "6px 0"}}>
            <span style={{color: theme.muted, width: 110}}>Subject</span>
            <span style={{fontWeight: 700}}>{ui.subject}</span>
          </div>
          <div style={{paddingTop: 16}}>
            {ui.body.map((l, i) => {
              const take = Math.max(0, Math.min(l.length, remaining));
              remaining -= l.length + 1;
              return <div key={i}>{l.slice(0, take)}{take < l.length && take > 0 ? "▌" : ""}</div>;
            })}
          </div>
        </div>
      );
    }
    case "approval": {
      const clickAt = Math.round(fps * (ui.clickAt ?? 1.8));
      const clicked = frameInStep >= clickAt;
      return (
        <div style={{position: "relative", height: "100%"}}>
          <div style={{fontSize: 28, fontWeight: 900, marginBottom: 12}}>{ui.title}</div>
          {ui.summary.map((s, i) => (
            <div key={i} style={{fontSize: 24, color: theme.muted, marginBottom: 6}}>• {s}</div>
          ))}
          <div style={{display: "flex", gap: 16, marginTop: 28}}>
            <div style={{padding: "14px 32px", borderRadius: 14, background: clicked ? theme.teal : theme.tealSoft, color: clicked ? "#fff" : theme.teal, fontWeight: 900, fontSize: 26, border: `2px solid ${theme.teal}`}}>{clicked ? "✓ " : ""}{ui.approve ?? "Approve"}</div>
            <div style={{padding: "14px 32px", borderRadius: 14, background: theme.bg, color: theme.muted, fontWeight: 900, fontSize: 26, border: `2px solid ${theme.panelBorder}`}}>{ui.reject ?? "Reject"}</div>
          </div>
          <Cursor x={150} y={ui.summary.length * 36 + 118} clickAtFrame={clickAt} from={{x: 520, y: 40}} />
        </div>
      );
    }
    case "list":
      return (
        <div>
          {ui.title ? <div style={{fontSize: 28, fontWeight: 900, marginBottom: 14}}>{ui.title}</div> : null}
          {ui.items.map((it, i) => (
            <ListRow key={i} i={i} text={it.text} done={it.done} />
          ))}
        </div>
      );
    default:
      return (
        <div>
          {ui.title ? <div style={{fontSize: 28, fontWeight: 900, marginBottom: 14}}>{ui.title}</div> : null}
          {ui.lines.map((l, i) => (
            <ListRow key={i} i={i} text={l} plain />
          ))}
        </div>
      );
  }
};

const CalCell: React.FC<{label?: string; highlight?: boolean; filled: boolean}> = ({label, highlight, filled}) => {
  const pop = usePop(highlight ? 12 : 0);
  return (
    <div style={{background: filled ? (highlight ? theme.accent : theme.blueSoft) : theme.bg2, borderRadius: 8, display: "grid", placeItems: "center", color: theme.ink, fontSize: 18, fontWeight: 800, border: highlight ? `3px solid ${theme.accentInk}` : "none", ...(highlight ? pop : {})}}>
      {label ?? ""}
    </div>
  );
};

const ListRow: React.FC<{i: number; text: string; done?: boolean; plain?: boolean}> = ({i, text, done, plain}) => {
  const st = useEnter(6 + i * 8, 14);
  return (
    <div style={{display: "flex", alignItems: "center", gap: 14, fontSize: 25, padding: "10px 0", borderBottom: `2px solid ${theme.panelBorder}`, color: theme.ink, ...st}}>
      {plain ? null : <div style={{width: 30, height: 30, borderRadius: 8, background: done ? theme.teal : theme.bg, border: `2px solid ${done ? theme.teal : theme.faint}`, color: "#fff", display: "grid", placeItems: "center", fontSize: 20, fontWeight: 900}}>{done ? "✓" : ""}</div>}
      <span style={{textDecoration: done ? "line-through" : "none", opacity: done ? 0.6 : 1}}>{text}</span>
    </div>
  );
};

const StepRow: React.FC<{i: number; step: Step; state: "done" | "active" | "todo"; portrait: boolean}> = ({i, step, state, portrait}) => {
  const st = useEnter(4 + i * 6, 20);
  const active = state === "active";
  return (
    <div style={{display: "flex", gap: 16, alignItems: "flex-start", padding: portrait ? "10px 12px" : "14px 16px", borderRadius: 16, background: active ? theme.bg : "transparent", border: `2px solid ${active ? theme.accent : "transparent"}`, boxShadow: active ? theme.shadowSoft : "none", ...st, opacity: state === "todo" ? 0.5 : st.opacity}}>
      <div style={{flex: "none", width: 40, height: 40, borderRadius: 20, background: state === "done" ? theme.teal : active ? theme.accent : theme.bg2, color: state === "done" ? "#fff" : theme.ink, fontWeight: 900, fontSize: 22, display: "grid", placeItems: "center", border: `2px solid ${state === "todo" ? theme.faint : "transparent"}`}}>{state === "done" ? "✓" : i + 1}</div>
      <div>
        <div style={{fontSize: portrait ? 26 : 28, fontWeight: 800, color: theme.ink, lineHeight: 1.2}}>{step.title}</div>
        {step.detail && active ? <div style={{fontSize: 21, color: theme.muted, marginTop: 4}}>{step.detail}</div> : null}
      </div>
    </div>
  );
};

export const Demo: React.FC<{scene: Scene}> = ({scene}) => {
  const {content, portrait} = useContentBox(scene);
  const steps: Step[] = scene.onScreen.steps ?? [];
  const {active, frameInStep} = useStepTiming(scene, steps.length);
  const enter = useEnter();
  const railW = portrait ? content.w : content.w * 0.38;
  const winW = portrait ? content.w : content.w - railW - 28;
  const winH = portrait ? content.h * 0.62 : content.h - 70;
  const pop = usePop(0);
  const ui = steps[active]?.ui;
  return (
    <div style={{position: "absolute", left: content.x, top: content.y, width: content.w, height: content.h, ...enter}}>
      {scene.onScreen.title ? <div style={{fontSize: portrait ? 30 : 34, fontWeight: 900, color: theme.ink, marginBottom: 16, letterSpacing: -0.5}}>{scene.onScreen.title}</div> : null}
      <div style={{display: "flex", flexDirection: portrait ? "column" : "row", gap: 28, height: portrait ? undefined : winH}}>
        <div style={{width: railW, display: "flex", flexDirection: portrait ? "row" : "column", flexWrap: portrait ? "wrap" : "nowrap", gap: portrait ? 8 : 6}}>
          {steps.map((s, i) => (
            <StepRow key={i} i={i} step={s} state={i < active ? "done" : i === active ? "active" : "todo"} portrait={portrait} />
          ))}
        </div>
        <div key={active} style={{...pop}}>
          <Window title={scene.onScreen.app} width={winW} height={winH}>
            {ui ? <UiView ui={ui} frameInStep={frameInStep} /> : null}
          </Window>
        </div>
      </div>
    </div>
  );
};

// Flow diagram: nodes joined by arrows that draw on, activating in order.
// onScreen: { title, nodes: [{label, icon?, sub?, color?}] }
export const Flow: React.FC<{scene: Scene}> = ({scene}) => {
  const {content, portrait} = useContentBox(scene);
  const nodes: {label: string; icon?: string; sub?: string; color?: string}[] = scene.onScreen.nodes ?? [];
  const {active} = useStepTiming(scene, nodes.length);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const enter = useEnter();
  const colors = [theme.blue, theme.violet, theme.teal, theme.accentInk, theme.coral];
  const n = nodes.length;
  const cols = portrait ? 2 : n;
  const rows = Math.ceil(n / cols);
  const nodeW = portrait ? (content.w - 40) / 2 : Math.min(300, (content.w - (n - 1) * 70) / n);
  const nodeH = portrait ? 150 : 190;
  const gapX = portrait ? 40 : (content.w - nodeW * n) / (n - 1 || 1);
  const gapY = 90;
  const titleH = scene.onScreen.title ? 90 : 0;
  const pos = (i: number) => {
    const r = Math.floor(i / cols);
    const c = i % cols;
    return {x: c * (nodeW + gapX), y: titleH + r * (nodeH + gapY)};
  };
  const totalH = titleH + rows * nodeH + (rows - 1) * gapY;
  const offsetY = Math.max(0, (content.h - totalH) / 2);
  return (
    <div style={{position: "absolute", left: content.x, top: content.y + offsetY, width: content.w, height: content.h, ...enter}}>
      {scene.onScreen.title ? <div style={{fontSize: portrait ? 34 : 44, fontWeight: 900, color: theme.ink, letterSpacing: -1, textAlign: "center", height: titleH}}>{scene.onScreen.title}</div> : null}
      <svg width={content.w} height={totalH} style={{position: "absolute", left: 0, top: 0, overflow: "visible"}}>
        <defs>
          <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="8" markerHeight="8" orient="auto-start-reverse">
            <path d="M 0 0 L 10 5 L 0 10 z" fill={theme.ink} />
          </marker>
        </defs>
        {nodes.slice(0, -1).map((_, i) => {
          const a = pos(i);
          const b = pos(i + 1);
          const sameRow = Math.floor(i / cols) === Math.floor((i + 1) / cols);
          const x1 = sameRow ? a.x + nodeW : a.x + nodeW / 2;
          const y1 = sameRow ? a.y + nodeH / 2 : a.y + nodeH;
          const x2 = sameRow ? b.x : b.x + nodeW / 2;
          const y2 = sameRow ? b.y + nodeH / 2 : b.y;
          const d = sameRow ? `M ${x1 + 6} ${y1} L ${x2 - 6} ${y2}` : `M ${x1} ${y1 + 6} C ${x1} ${y1 + 50}, ${x2} ${y2 - 50}, ${x2} ${y2 - 6}`;
          const len = Math.hypot(x2 - x1, y2 - y1) + 60;
          const startFrame = Math.round(fps * 0.35) + i * 0;
          const shown = i < active;
          const p = shown ? interpolate(frame, [startFrame, startFrame + 12], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}) : 0;
          return <path key={i} d={d} stroke={theme.ink} strokeWidth={5} fill="none" strokeLinecap="round" strokeDasharray={len} strokeDashoffset={len * (1 - p)} markerEnd={p > 0.95 ? "url(#arrow)" : undefined} opacity={p > 0 ? 1 : 0} />;
        })}
      </svg>
      {nodes.map((nd, i) => {
        const p = pos(i);
        const c = nd.color ?? colors[i % colors.length];
        const state = i < active ? "done" : i === active ? "active" : "todo";
        return <FlowNode key={i} i={i} x={p.x} y={p.y} w={nodeW} h={nodeH} node={nd} color={c} state={state} portrait={portrait} />;
      })}
    </div>
  );
};

const FlowNode: React.FC<{i: number; x: number; y: number; w: number; h: number; node: {label: string; icon?: string; sub?: string}; color: string; state: "done" | "active" | "todo"; portrait: boolean}> = ({i, x, y, w, h, node, color, state, portrait}) => {
  const pop = usePop(6 + i * 5);
  const frame = useCurrentFrame();
  const pulse = state === "active" ? 1 + Math.sin(frame / 6) * 0.015 : 1;
  return (
    <div style={{position: "absolute", left: x, top: y, width: w, height: h, ...pop}}>
      <div style={{position: "relative", width: "100%", height: "100%", boxSizing: "border-box", borderRadius: 22, background: theme.bg, border: `3px solid ${state === "todo" ? theme.panelBorder : color}`, boxShadow: state === "active" ? `0 0 0 8px ${color}22, ${theme.shadow}` : theme.shadowSoft, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 6, transform: `scale(${pulse})`, opacity: state === "todo" ? 0.55 : 1}}>
        <div style={{width: portrait ? 60 : 72, height: portrait ? 60 : 72, borderRadius: 18, background: paletteFor(i, color).soft, display: "grid", placeItems: "center"}}><Icon name={node.icon} size={portrait ? 34 : 40} color={color} /></div>
        <div style={{fontSize: portrait ? 26 : 30, fontWeight: 900, color: theme.ink, letterSpacing: -0.5}}>{node.label}</div>
        {node.sub ? <div style={{fontSize: 19, color: theme.muted, fontWeight: 500, textAlign: "center", padding: "0 10px"}}>{node.sub}</div> : null}
        {state === "active" ? <Marker kind="circle" color={theme.accent} inset={-12} width={5} /> : null}
      </div>
    </div>
  );
};
