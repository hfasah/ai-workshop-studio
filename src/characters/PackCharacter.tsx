import React from "react";
import {Img, staticFile, useCurrentFrame} from "remotion";
import type {CharacterRenderProps} from "./Placeholder";

// Renders a drawn character pack from public/characters/<id>/:
//   poses/<pose>.png (base), expressions/<expression>.png, gestures/<gesture>.png, mouth/<viseme>.png
// All layers must share the same canvas size so they stack.
export const hasPack = (files: string[]) => files.some((f) => f.startsWith("poses/"));

const viseme = (amplitude: number, speaking: boolean) => {
  if (!speaking || amplitude < 0.08) return "neutral";
  if (amplitude < 0.3) return "M-B-P";
  if (amplitude < 0.6) return "E";
  return amplitude < 0.85 ? "A" : "O";
};

export const PackCharacter: React.FC<CharacterRenderProps & {pose?: string}> = ({character, amplitude, speaking, expression, gesture, height, flip, pose = "standing"}) => {
  const frame = useCurrentFrame();
  const files = new Set(character.files);
  const pick = (...candidates: string[]) => candidates.find((c) => files.has(c));
  const base = pick(`poses/${pose}.png`, "poses/standing.png", character.files.find((f) => f.startsWith("poses/")) ?? "");
  const expr = pick(`expressions/${expression}.png`);
  const gest = pick(`gestures/${gesture.replace("_", "-")}.png`, `gestures/${gesture}.png`);
  const mouth = pick(`mouth/${viseme(amplitude, speaking)}.png`, "mouth/neutral.png");
  const bob = Math.sin(frame / 14) * 3;
  const src = (f: string) => staticFile(`characters/${character.id}/${f}`);
  return (
    <div style={{position: "relative", height, aspectRatio: "1 / 2", transform: `${flip ? "scaleX(-1)" : ""} translateY(${bob}px)`}}>
      {[base, expr, gest, mouth].filter(Boolean).map((f, i) => (
        <Img key={i} src={src(f as string)} style={{position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "contain"}} />
      ))}
    </div>
  );
};
