import React from "react";
import {interpolate, useCurrentFrame} from "remotion";
import {theme} from "../theme";

// Hand-drawn marker annotations that draw themselves on: a loose circle, an underline or a box.
// Place inside a `position: relative` parent; it overlays the parent's bounds.
export const Marker: React.FC<{kind?: "circle" | "underline" | "box"; color?: string; delay?: number; width?: number; inset?: number}> = ({kind = "circle", color = theme.accent, delay = 0, width = 6, inset = -10}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame - delay, [0, 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  if (p <= 0) return null;
  // paths in a 100x100 box, slightly imperfect like a marker pen
  const d =
    kind === "circle"
      ? "M 8 55 C 4 20, 40 2, 68 8 C 96 14, 100 46, 92 70 C 84 96, 30 100, 12 78 C 2 66, 6 60, 10 52"
      : kind === "underline"
        ? "M 2 92 C 30 86, 60 96, 98 90"
        : "M 4 6 L 96 4 L 97 95 L 3 96 Z";
  const len = kind === "underline" ? 110 : 340;
  return (
    <svg viewBox="0 0 100 100" preserveAspectRatio="none" style={{position: "absolute", inset, width: `calc(100% - ${inset * 2}px)`, height: `calc(100% - ${inset * 2}px)`, pointerEvents: "none", overflow: "visible"}}>
      <path d={d} fill="none" stroke={color} strokeWidth={width} strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" strokeDasharray={len} strokeDashoffset={len * (1 - p)} opacity={0.9} />
    </svg>
  );
};
