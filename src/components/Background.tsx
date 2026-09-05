import React from "react";
import {AbsoluteFill, useCurrentFrame, useVideoConfig} from "remotion";
import {theme} from "../theme";

// Clean paper background: white, faint dot grid, two soft colour washes, a floor line for the characters.
export const Background: React.FC<{kind: string}> = () => {
  const frame = useCurrentFrame();
  const {width, height} = useVideoConfig();
  const portrait = height > width;
  const floorY = portrait ? height * 0.86 : height * 0.84;
  const drift = Math.sin(frame / 90) * 30;

  return (
    <AbsoluteFill style={{background: theme.bg}}>
      <svg width={width} height={height} style={{position: "absolute", inset: 0}}>
        <defs>
          <pattern id="dots" width="44" height="44" patternUnits="userSpaceOnUse">
            <circle cx="2" cy="2" r="2" fill={theme.grid} />
          </pattern>
          <radialGradient id="washA" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={theme.accent} stopOpacity={0.16} />
            <stop offset="1" stopColor={theme.accent} stopOpacity={0} />
          </radialGradient>
          <radialGradient id="washB" cx="50%" cy="50%" r="50%">
            <stop offset="0" stopColor={theme.blue} stopOpacity={0.10} />
            <stop offset="1" stopColor={theme.blue} stopOpacity={0} />
          </radialGradient>
        </defs>
        <rect width={width} height={height} fill="url(#dots)" />
        <circle cx={width * 0.85 + drift} cy={height * 0.2} r={portrait ? width * 0.6 : height * 0.55} fill="url(#washA)" />
        <circle cx={width * 0.12 - drift} cy={height * 0.75} r={portrait ? width * 0.6 : height * 0.5} fill="url(#washB)" />
        {/* floor */}
        <rect x={0} y={floorY} width={width} height={height - floorY} fill={theme.bg2} />
        <line x1={0} y1={floorY} x2={width} y2={floorY} stroke={theme.panelBorder} strokeWidth={2} />
      </svg>
    </AbsoluteFill>
  );
};
