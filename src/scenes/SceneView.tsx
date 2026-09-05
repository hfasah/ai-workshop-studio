import React, {useContext} from "react";
import {AbsoluteFill, OffthreadVideo, interpolate, staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import type {Scene} from "../types";
import {theme} from "../theme";
import {LayoutContext} from "../Episode";
import {Card, Kicker, Panel, useContentBox, useEnter, usePop} from "./Panel";
import {Demo, Flow} from "./Demo";
import {Diagram} from "./Diagram";
import {Examples} from "./Examples";
import {Icon, paletteFor, IconBadge} from "../components/Icon";
import {Illustration} from "../components/Illustrations";
import {Marker} from "../components/Marker";

const Stagger: React.FC<{i: number; children: React.ReactNode; step?: number}> = ({i, children, step = 10}) => {
  const st = useEnter(8 + i * step, 24);
  return <div style={st}>{children}</div>;
};

const fs = (portrait: boolean, base: number) => (portrait ? base * 1.05 : base);

const Title: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const {build} = useContext(LayoutContext);
  return (
    <Panel scene={scene} align="center" bare>
      <Kicker>
        {build.episode.series} · Episode {build.episode.episode}
      </Kicker>
      <div style={{fontSize: fs(portrait, 100), fontWeight: 900, lineHeight: 1.02, letterSpacing: -3, color: theme.ink}}>{scene.onScreen.title}</div>
      {scene.onScreen.subtitle ? (
        <Stagger i={1}>
          <div style={{fontSize: fs(portrait, 38), color: theme.muted, marginTop: 28, maxWidth: 1100, fontWeight: 500}}>{scene.onScreen.subtitle}</div>
        </Stagger>
      ) : null}
      {build.episode.disclosure ? (
        <Stagger i={3}>
          <div style={{fontSize: fs(portrait, 24), color: theme.muted, marginTop: 36, padding: "8px 18px", borderRadius: 999, border: `2px solid ${theme.panelBorder}`, fontWeight: 700}}>{build.episode.disclosure}</div>
        </Stagger>
      ) : null}
    </Panel>
  );
};

const Statement: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const ill = scene.onScreen.illustration as string | undefined;
  return (
    <Panel scene={scene}>
      <div style={{display: "flex", flexDirection: portrait ? "column" : "row", alignItems: portrait ? "flex-start" : "center", gap: portrait ? 18 : 40, width: "100%"}}>
        <div style={{flex: 1, minWidth: 0}}>
          {scene.label ? <Kicker>{scene.label}</Kicker> : null}
          <div style={{fontSize: fs(portrait, ill ? 54 : 62), fontWeight: 900, lineHeight: 1.1, letterSpacing: -2}}>{scene.onScreen.text}</div>
          {scene.onScreen.emphasis ? (
            <Stagger i={2} step={18}>
              <div style={{position: "relative", display: "inline-block", fontSize: fs(portrait, 40), color: theme.blue, fontWeight: 700, marginTop: 28, lineHeight: 1.3}}>
                {scene.onScreen.emphasis}
                <Marker kind="underline" color={theme.accent} delay={30} inset={-4} width={5} />
              </div>
            </Stagger>
          ) : null}
        </div>
        {ill ? (
          <Stagger i={1} step={12}>
            <Illustration name={ill} size={portrait ? 220 : 300} />
          </Stagger>
        ) : null}
      </div>
    </Panel>
  );
};

const Bullets: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const raw: (string | {icon?: string; text: string})[] = scene.onScreen.items ?? [];
  const items = raw.map((it) => (typeof it === "string" ? {text: it} : it));
  return (
    <Panel scene={scene}>
      {scene.label ? <Kicker>{scene.label}</Kicker> : null}
      <div style={{fontSize: fs(portrait, 52), fontWeight: 900, marginBottom: 30, letterSpacing: -1.5}}>{scene.onScreen.title}</div>
      {items.map((it, i) => (
        <Stagger key={i} i={i} step={14}>
          <div style={{display: "flex", gap: 22, alignItems: "flex-start", fontSize: fs(portrait, 40), lineHeight: 1.3, marginBottom: 18, fontWeight: 500}}>
            {it.icon ? <IconBadge name={it.icon} size={50} color={paletteFor(i).color} soft={paletteFor(i).soft} radius={14} /> : <div style={{flex: "none", width: 46, height: 46, borderRadius: 14, background: theme.blue, color: "#fff", fontWeight: 900, display: "grid", placeItems: "center", fontSize: 26, marginTop: 2}}>{i + 1}</div>}
            <div>{it.text}</div>
          </div>
        </Stagger>
      ))}
    </Panel>
  );
};

const Steps: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const steps: {label: string; icon?: string}[] = scene.onScreen.steps ?? [];
  const frame = useCurrentFrame();
  return (
    <Panel scene={scene} align="center" bare>
      <div style={{fontSize: fs(portrait, 48), fontWeight: 900, marginBottom: portrait ? 24 : 40, letterSpacing: -1.5}}>{scene.onScreen.title}</div>
      <div style={{display: "flex", flexDirection: "row", flexWrap: portrait ? "wrap" : "nowrap", alignItems: "center", gap: portrait ? 18 : 8, width: "100%", justifyContent: "center"}}>
        {steps.map((s, i) => {
          const on = frame > 10 + i * 14;
          const lineW = interpolate(frame, [12 + i * 14, 24 + i * 14], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
          return (
            <React.Fragment key={i}>
              <Stagger i={i} step={14}>
                <Card accent={on ? theme.accent : undefined} style={{display: "flex", flexDirection: "column", alignItems: "center", gap: 10, padding: portrait ? "16px 24px" : "26px 30px", minWidth: portrait ? 200 : 190, boxSizing: "border-box"}}>
                  <Icon name={s.icon} size={portrait ? 44 : 52} color={theme.blue} />
                  <div style={{fontSize: portrait ? 30 : 34, fontWeight: 900}}>{s.label}</div>
                </Card>
              </Stagger>
              {i < steps.length - 1 && !portrait ? (
                <div style={{width: 56, height: 6, background: theme.panelBorder, borderRadius: 3, overflow: "hidden", flex: "none"}}>
                  <div style={{width: `${lineW * 100}%`, height: "100%", background: theme.ink}} />
                </div>
              ) : null}
            </React.Fragment>
          );
        })}
      </div>
    </Panel>
  );
};

const Compare: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const cols = [scene.onScreen.left, scene.onScreen.right] as {title: string; items: string[]}[];
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = scene.startMs + (frame / fps) * 1000;
  const second = scene.lines[1]?.startMs ?? Infinity;
  return (
    <Panel scene={scene} bare>
      <div style={{display: "flex", flexDirection: portrait ? "column" : "row", gap: 28, width: "100%", height: "100%"}}>
        {cols.map((c, ci) => {
          const active = ci === 0 ? nowMs < second : nowMs >= second;
          const color = ci === 0 ? theme.muted : theme.blue;
          const soft = ci === 0 ? theme.bg2 : theme.blueSoft;
          return (
            <Stagger key={ci} i={ci} step={12}>
              <Card accent={active ? color : undefined} style={{flex: 1, height: "100%", padding: portrait ? 34 : 44, boxSizing: "border-box", opacity: active ? 1 : 0.6, background: active ? theme.bg : theme.bg2}}>
                <div style={{display: "inline-block", fontSize: fs(portrait, 44), fontWeight: 900, color: ci === 0 ? theme.ink : theme.blue, background: soft, padding: "4px 18px", borderRadius: 12, marginBottom: 24, letterSpacing: -1}}>{c.title}</div>
                {c.items.map((it, i) => (
                  <Stagger key={i} i={i + ci * 2} step={10}>
                    <div style={{fontSize: fs(portrait, 34), lineHeight: 1.35, marginBottom: 14, display: "flex", gap: 16, fontWeight: 500}}>
                      <span style={{color, fontWeight: 900}}>{ci === 0 ? "–" : "✓"}</span>
                      <span>{it}</span>
                    </div>
                  </Stagger>
                ))}
              </Card>
            </Stagger>
          );
        })}
      </div>
    </Panel>
  );
};

const Dialogue: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  if (!scene.onScreen.caption) return null;
  return (
    <Panel scene={scene} align="center" bare>
      <div style={{fontSize: fs(portrait, 38), fontWeight: 900, color: theme.ink, background: theme.bg, padding: "14px 34px", borderRadius: 999, border: `2px solid ${theme.panelBorder}`, boxShadow: theme.shadowSoft}}>
        {scene.onScreen.caption}
      </div>
    </Panel>
  );
};

type Zoom = {atMs: number; x: number; y: number; scale: number};
const Screen: React.FC<{scene: Scene}> = ({scene}) => {
  const {content} = useContentBox(scene);
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = (frame / fps) * 1000;
  const zooms: Zoom[] = [{atMs: 0, x: 0.5, y: 0.5, scale: 1}, ...(scene.onScreen.zoom ?? [])];
  let cur = zooms[0];
  let next: Zoom | null = null;
  for (let i = 0; i < zooms.length; i++) {
    if (zooms[i].atMs <= nowMs) {
      cur = zooms[i];
      next = null;
    } else {
      next = zooms[i];
      break;
    }
  }
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  let {x, y, scale} = cur;
  if (next) {
    const t = interpolate(nowMs, [next.atMs - 600, next.atMs], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
    const e = t * t * (3 - 2 * t);
    x = lerp(cur.x, next.x, e);
    y = lerp(cur.y, next.y, e);
    scale = lerp(cur.scale, next.scale, e);
  }
  const enter = useEnter();
  return (
    <div style={{position: "absolute", left: content.x, top: content.y, width: content.w, height: content.h, ...enter}}>
      {scene.onScreen.title ? <div style={{position: "absolute", top: -54, left: 0, fontSize: 28, fontWeight: 800, color: theme.muted}}>{scene.onScreen.title}</div> : null}
      <div style={{width: "100%", height: "100%", borderRadius: 22, overflow: "hidden", border: `2px solid ${theme.panelBorder}`, background: "#000", boxShadow: theme.shadow}}>
        <div style={{width: "100%", height: "100%", transform: `scale(${scale})`, transformOrigin: `${x * 100}% ${y * 100}%`}}>
          <OffthreadVideo src={staticFile(scene.onScreen.src)} startFrom={Math.round(((scene.onScreen.startMs ?? 0) / 1000) * fps)} muted={scene.onScreen.muted ?? true} style={{width: "100%", height: "100%", objectFit: "cover"}} />
        </div>
      </div>
    </div>
  );
};

const Code: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const lines: string[] = String(scene.onScreen.code ?? "").split("\n");
  const frame = useCurrentFrame();
  return (
    <Panel scene={scene}>
      {scene.onScreen.title ? <div style={{fontSize: fs(portrait, 40), fontWeight: 900, marginBottom: 20}}>{scene.onScreen.title}</div> : null}
      <pre style={{fontFamily: theme.mono, fontSize: fs(portrait, 28), lineHeight: 1.5, margin: 0, background: theme.ink, color: "#E2E8F0", padding: 28, borderRadius: 16, width: "100%", boxSizing: "border-box", overflow: "hidden", whiteSpace: "pre-wrap"}}>
        {lines.map((l, i) => (
          <div key={i} style={{opacity: frame > 6 + i * 5 ? 1 : 0, color: l.trim().startsWith("#") || l.trim().startsWith("//") ? "#94A3B8" : "#E2E8F0"}}>
            {l || " "}
          </div>
        ))}
      </pre>
    </Panel>
  );
};

const Outro: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const pop = usePop(24);
  return (
    <Panel scene={scene} align="center" bare>
      <div style={{fontSize: fs(portrait, 64), fontWeight: 900, color: theme.muted, letterSpacing: -2}}>{scene.onScreen.line}</div>
      <div style={{fontSize: fs(portrait, 88), fontWeight: 900, color: theme.ink, letterSpacing: -3, lineHeight: 1.1, ...pop}}>
        <span style={{background: theme.accent, padding: "0 20px", borderRadius: 18, boxDecorationBreak: "clone"}}>{scene.onScreen.emphasis}</span>
      </div>
      {scene.onScreen.cta ? (
        <Stagger i={5} step={14}>
          <div style={{fontSize: fs(portrait, 32), marginTop: 44, padding: "16px 36px", borderRadius: 999, background: theme.ink, color: "#fff", fontWeight: 700}}>{scene.onScreen.cta}</div>
        </Stagger>
      ) : null}
    </Panel>
  );
};

export const SceneView: React.FC<{scene: Scene}> = ({scene}) => {
  const view = (() => {
    switch (scene.type) {
      case "title":
        return <Title scene={scene} />;
      case "statement":
        return <Statement scene={scene} />;
      case "bullets":
        return <Bullets scene={scene} />;
      case "steps":
        return <Steps scene={scene} />;
      case "flow":
        return <Flow scene={scene} />;
      case "demo":
        return <Demo scene={scene} />;
      case "diagram":
        return <Diagram scene={scene} />;
      case "examples":
        return <Examples scene={scene} />;
      case "compare":
        return <Compare scene={scene} />;
      case "dialogue":
        return <Dialogue scene={scene} />;
      case "screen":
        return <Screen scene={scene} />;
      case "code":
        return <Code scene={scene} />;
      case "outro":
        return <Outro scene={scene} />;
      default:
        return null;
    }
  })();
  return <AbsoluteFill style={{pointerEvents: "none"}}>{view}</AbsoluteFill>;
};
