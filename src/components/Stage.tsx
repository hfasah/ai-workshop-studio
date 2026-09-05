import React, {useContext} from "react";
import {staticFile, useCurrentFrame, useVideoConfig} from "remotion";
import {useAudioData, visualizeAudio} from "@remotion/media-utils";
import type {Line, Scene} from "../types";
import {LayoutContext} from "../Episode";
import {layoutFor} from "../layout";
import {PlaceholderCharacter} from "../characters/Placeholder";
import {PackCharacter, hasPack} from "../characters/PackCharacter";
import {theme} from "../theme";

const Row: React.FC<{scene: Scene; activeLine: Line | null; amplitude: number}> = ({scene, activeLine, amplitude}) => {
  const {orientation, build} = useContext(LayoutContext);
  const {width, height} = useVideoConfig();
  const {stage, portrait} = layoutFor(orientation, width, height, scene.type, scene.characters.length > 0);
  const ids = scene.characters.filter((id) => build.characters[id]);
  if (ids.length === 0) return null;
  // three characters on a narrow side stage: scale them down so they do not overlap
  const crowd = !portrait && ids.length >= 3 && stage.w < width * 0.35 ? 0.66 : 1;
  const baseH = (portrait ? height * 0.27 : scene.type === "dialogue" ? height * 0.5 : height * 0.46) * crowd;
  const slot = stage.w / ids.length;

  return (
    <>
      {ids.map((id, i) => {
        const ch = build.characters[id];
        const speaking = activeLine?.speaker === id;
        const h = baseH * (ch.look?.height ?? (ch.kind === "robot" ? 0.7 : ch.kind === "wisp" ? 0.75 : 0.85));
        const cx = stage.x + slot * (i + 0.5);
        // characters on the right half face left
        const flip = cx > width / 2;
        const expression = speaking ? (activeLine?.expression ?? "neutral") : "neutral";
        const gesture = speaking ? (activeLine?.gesture ?? "neutral") : "neutral";
        const props = {character: ch, amplitude, speaking, expression, gesture, height: h, flip} as const;
        return (
          <div key={id} style={{position: "absolute", left: cx, top: stage.y, transform: "translate(-50%, -100%)", display: "flex", flexDirection: "column", alignItems: "center"}}>
            <div
              style={{
                marginBottom: 10,
                padding: "6px 14px",
                borderRadius: 999,
                fontSize: portrait ? 26 : 22,
                fontWeight: 700,
                color: speaking ? "#fff" : theme.muted,
                background: speaking ? (ch.captionColor ?? ch.color) : theme.bg2,
                border: `2px solid ${speaking ? "transparent" : theme.panelBorder}`,
                opacity: speaking ? 1 : 0.8,
              }}
            >
              {ch.name}
            </div>
            <div style={{filter: speaking ? `drop-shadow(0 12px 18px ${ch.color}55)` : "drop-shadow(0 8px 12px rgba(15,23,42,0.12))"}}>
              {hasPack(ch.files) ? <PackCharacter {...props} /> : <PlaceholderCharacter {...props} />}
            </div>
          </div>
        );
      })}
    </>
  );
};

const SpeakingRow: React.FC<{scene: Scene; line: Line}> = ({scene, line}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const audioData = useAudioData(staticFile(line.audio));
  let amplitude = 0;
  if (audioData) {
    const lineStart = Math.round(((line.startMs - scene.startMs) / 1000) * fps);
    const values = visualizeAudio({fps, frame: Math.max(0, frame - lineStart), audioData, numberOfSamples: 4, smoothing: true});
    const avg = values.reduce((a, b) => a + b, 0) / values.length;
    amplitude = Math.min(1, avg * 3.2);
  }
  return <Row scene={scene} activeLine={line} amplitude={amplitude} />;
};

export const Stage: React.FC<{scene: Scene}> = ({scene}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const nowMs = scene.startMs + (frame / fps) * 1000;
  const line = scene.lines.find((l) => nowMs >= l.startMs && nowMs < l.startMs + l.durationMs) ?? null;
  if (line) return <SpeakingRow scene={scene} line={line} />;
  return <Row scene={scene} activeLine={null} amplitude={0} />;
};
