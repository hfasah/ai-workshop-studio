import React from "react";
import {icons} from "lucide-react";
import {theme} from "../theme";

const toPascal = (s: string) => s.trim().split(/[-_\s]+/).map((w) => (w ? w[0].toUpperCase() + w.slice(1) : "")).join("");
export const isEmoji = (s: string) => /\p{Extended_Pictographic}/u.test(s);
export const hasIcon = (name?: string) => Boolean(name && (isEmoji(name) || (icons as Record<string, unknown>)[toPascal(name)]));

// Real vector icons (lucide). Names are kebab-case ("shield-check") or PascalCase; emoji still work as a fallback.
export const Icon: React.FC<{name?: string; size?: number; color?: string; strokeWidth?: number; style?: React.CSSProperties}> = ({name, size = 48, color, strokeWidth = 2.2, style}) => {
  if (!name) return null;
  if (isEmoji(name)) return <span style={{fontSize: size, lineHeight: 1, display: "inline-block", ...style}}>{name}</span>;
  const Cmp = (icons as Record<string, React.FC<any>>)[toPascal(name)];
  if (!Cmp) return <span style={{fontSize: size * 0.5, color: theme.muted, ...style}}>{name}</span>;
  return <Cmp size={size} color={color ?? theme.ink} strokeWidth={strokeWidth} absoluteStrokeWidth style={style} />;
};

// Icon on a soft rounded tile, the standard way icons appear in nodes, examples and bullets.
export const IconBadge: React.FC<{name?: string; size?: number; color?: string; soft?: string; radius?: number}> = ({name, size = 64, color = theme.blue, soft = theme.blueSoft, radius = 18}) => (
  <div style={{width: size, height: size, borderRadius: radius, background: soft, display: "grid", placeItems: "center", flex: "none"}}>
    <Icon name={name} size={Math.round(size * 0.56)} color={color} />
  </div>
);

export const PALETTE = [
  {color: theme.blue, soft: theme.blueSoft},
  {color: theme.violet, soft: theme.violetSoft},
  {color: theme.teal, soft: theme.tealSoft},
  {color: theme.accentInk, soft: "#FFF3C4"},
  {color: theme.coral, soft: theme.coralSoft},
];
export const paletteFor = (i: number, color?: string) => (color ? {color, soft: color + "22"} : PALETTE[i % PALETTE.length]);
