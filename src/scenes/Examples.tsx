import React from "react";
import type {Scene} from "../types";
import {theme} from "../theme";
import {Kicker, Panel, useContentBox, useEnter} from "./Panel";
import {useStepTiming} from "./Demo";
import {IconBadge, paletteFor} from "../components/Icon";
import {Marker} from "../components/Marker";
import {Illustration} from "../components/Illustrations";

// Real-world uses: a grid of icon tiles, each one place where the idea applies.
// onScreen: { title, items:[{icon, label, text, illustration?}] }. One tile activates per line when counts match.
export const Examples: React.FC<{scene: Scene}> = ({scene}) => {
  const {portrait} = useContentBox(scene);
  const items: {icon?: string; label: string; text?: string; illustration?: string}[] = scene.onScreen.items ?? [];
  const {active} = useStepTiming(scene, items.length);
  const cols = portrait ? 2 : Math.min(3, items.length);
  return (
    <Panel scene={scene} bare>
      {scene.label ? <Kicker>{scene.label}</Kicker> : null}
      {scene.onScreen.title ? <div style={{fontSize: portrait ? 36 : 44, fontWeight: 900, color: theme.ink, letterSpacing: -1, marginBottom: 22}}>{scene.onScreen.title}</div> : null}
      <div style={{display: "grid", gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: portrait ? 16 : 22, width: "100%"}}>
        {items.map((it, i) => (
          <Tile key={i} i={i} item={it} state={i < active ? "done" : i === active ? "active" : "todo"} portrait={portrait} />
        ))}
      </div>
    </Panel>
  );
};

const Tile: React.FC<{i: number; item: {icon?: string; label: string; text?: string; illustration?: string}; state: string; portrait: boolean}> = ({i, item, state, portrait}) => {
  const st = useEnter(6 + i * 7, 24);
  const {color, soft} = paletteFor(i);
  return (
    <div style={{position: "relative", background: theme.bg, border: `2px solid ${state === "active" ? color : theme.panelBorder}`, borderRadius: 22, padding: portrait ? 18 : 22, boxShadow: state === "active" ? `0 0 0 8px ${color}22, ${theme.shadow}` : theme.shadowSoft, display: "flex", flexDirection: "column", gap: 12, ...st, opacity: state === "todo" ? 0.6 : st.opacity}}>
      {item.illustration ? <Illustration name={item.illustration} size={portrait ? 120 : 150} /> : <IconBadge name={item.icon} size={portrait ? 56 : 64} color={color} soft={soft} />}
      <div style={{fontSize: portrait ? 26 : 28, fontWeight: 900, color: theme.ink, letterSpacing: -0.5, lineHeight: 1.15}}>{item.label}</div>
      {item.text ? <div style={{fontSize: portrait ? 20 : 22, color: theme.muted, fontWeight: 500, lineHeight: 1.3}}>{item.text}</div> : null}
      {state === "active" ? <Marker kind="box" color={theme.accent} inset={-8} width={4} /> : null}
    </div>
  );
};
