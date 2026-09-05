import React, {useContext} from "react";
import {useCurrentFrame, useVideoConfig} from "remotion";
import {theme} from "../theme";
import {LayoutContext} from "../Episode";

export const Brand: React.FC = () => {
  const {build, orientation} = useContext(LayoutContext);
  const frame = useCurrentFrame();
  const {durationInFrames, width} = useVideoConfig();
  const progress = Math.min(1, frame / durationInFrames);
  const s = orientation === "portrait" ? 0.9 : 1;

  return (
    <>
      <div style={{position: "absolute", top: 36 * s, left: 48 * s, display: "flex", alignItems: "center", gap: 14 * s, fontWeight: 900, fontSize: 28 * s, letterSpacing: -0.5, color: theme.ink}}>
        <div style={{width: 40 * s, height: 40 * s, borderRadius: 12, background: theme.accent, display: "grid", placeItems: "center", color: theme.ink, fontSize: 24 * s, boxShadow: theme.shadowSoft}}>H</div>
        <span>
          AI <span style={{color: theme.muted, fontWeight: 500}}>with</span> Hippolyte
        </span>
      </div>
      <div style={{position: "absolute", top: 40 * s, right: 48 * s, padding: `${8 * s}px ${16 * s}px`, borderRadius: 999, background: theme.bg, border: `2px solid ${theme.panelBorder}`, fontSize: 20 * s, fontWeight: 700, color: theme.muted}}>
        EP {String(build.episode.episode).padStart(2, "0")}
      </div>
      <div style={{position: "absolute", left: 0, bottom: 0, height: 8, width, background: theme.panelBorder}}>
        <div style={{height: "100%", width: `${progress * 100}%`, background: theme.accent}} />
      </div>
    </>
  );
};
