import React, {useContext} from "react";
import {interpolate, spring, useCurrentFrame, useVideoConfig} from "remotion";
import {theme} from "../theme";
import {LayoutContext} from "../Episode";
import {layoutFor} from "../layout";
import type {Scene} from "../types";

export const useContentBox = (scene: Scene) => {
  const {orientation} = useContext(LayoutContext);
  const {width, height} = useVideoConfig();
  return layoutFor(orientation, width, height, scene.type, scene.characters.length > 0);
};

// Pop-in with a little overshoot, the signature "explainer" entrance.
export const useEnter = (delayFrames = 0, distance = 40) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delayFrames, fps, config: {damping: 14, stiffness: 140, mass: 0.7}});
  return {opacity: interpolate(s, [0, 0.4], [0, 1], {extrapolateRight: "clamp"}), transform: `translateY(${interpolate(s, [0, 1], [distance, 0])}px) scale(${interpolate(s, [0, 1], [0.92, 1])})`};
};

export const usePop = (delayFrames = 0) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const s = spring({frame: frame - delayFrames, fps, config: {damping: 10, stiffness: 180, mass: 0.6}});
  return {opacity: interpolate(s, [0, 0.3], [0, 1], {extrapolateRight: "clamp"}), transform: `scale(${interpolate(s, [0, 1], [0.6, 1])})`};
};

export const Card: React.FC<{children: React.ReactNode; style?: React.CSSProperties; accent?: string}> = ({children, style, accent}) => (
  <div style={{background: theme.panel, border: `2px solid ${accent ?? theme.panelBorder}`, borderRadius: 24, boxShadow: theme.shadow, ...style}}>{children}</div>
);

export const Panel: React.FC<{scene: Scene; children: React.ReactNode; align?: "start" | "center"; bare?: boolean}> = ({scene, children, align = "start", bare}) => {
  const {content, portrait} = useContentBox(scene);
  const enter = useEnter();
  return (
    <div
      style={{
        position: "absolute",
        left: content.x,
        top: content.y,
        width: content.w,
        height: content.h,
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: align === "center" ? "center" : "flex-start",
        textAlign: align === "center" ? "center" : "left",
        padding: bare ? 0 : portrait ? 44 : 60,
        boxSizing: "border-box",
        borderRadius: 28,
        background: bare ? "transparent" : theme.panel,
        border: bare ? "none" : `2px solid ${theme.panelBorder}`,
        boxShadow: bare ? "none" : theme.shadow,
        color: theme.ink,
        ...enter,
      }}
    >
      {children}
    </div>
  );
};

export const Kicker: React.FC<{children: React.ReactNode; color?: string}> = ({children, color}) => (
  <div style={{display: "inline-block", fontSize: 22, fontWeight: 900, letterSpacing: 2, textTransform: "uppercase", color: theme.ink, background: color ?? theme.accent, padding: "6px 14px", borderRadius: 8, marginBottom: 22}}>{children}</div>
);
