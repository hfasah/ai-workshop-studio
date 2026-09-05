import React from "react";
import {AbsoluteFill, Audio, Sequence, staticFile, useVideoConfig} from "remotion";
import type {Build, EpisodeProps, Orientation, Scene} from "./types";
import {theme} from "./theme";
import {Background} from "./components/Background";
import {Brand} from "./components/Brand";
import {Captions} from "./components/Captions";
import {Stage} from "./components/Stage";
import {SceneView} from "./scenes/SceneView";

export const LayoutContext = React.createContext<{orientation: Orientation; build: Build}>({
  orientation: "landscape",
  build: undefined as unknown as Build,
});

export const Episode: React.FC<EpisodeProps> = ({build}) => {
  const {width, height, fps} = useVideoConfig();
  if (!build) {
    return (
      <AbsoluteFill style={{background: theme.bg, color: theme.text, justifyContent: "center", alignItems: "center", fontFamily: theme.font, fontSize: 40}}>
        Loading build…
      </AbsoluteFill>
    );
  }
  const orientation: Orientation = height > width ? "portrait" : "landscape";
  const toFrame = (ms: number) => Math.round((ms / 1000) * fps);

  return (
    <LayoutContext.Provider value={{orientation, build}}>
      <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font, color: theme.text}}>
        <Background kind={build.episode.background ?? "workshop"} />

        {build.scenes.map((scene: Scene) => (
          <Sequence key={scene.id} name={`${scene.index + 1}. ${scene.label ?? scene.id}`} from={toFrame(scene.startMs)} durationInFrames={Math.max(1, toFrame(scene.durationMs))}>
            <SceneView scene={scene} />
            <Stage scene={scene} />
          </Sequence>
        ))}

        {build.scenes.flatMap((scene) =>
          scene.lines.map((line, i) => (
            <Sequence key={`${scene.id}-${i}`} name={`🔊 ${line.speaker}`} from={toFrame(line.startMs)} durationInFrames={Math.max(1, toFrame(line.durationMs))}>
              <Audio src={staticFile(line.audio)} />
            </Sequence>
          )),
        )}

        {build.episode.music ? <Audio src={staticFile(build.episode.music)} volume={0.08} loop /> : null}

        <Captions captions={build.captions} />
        <Brand />
      </AbsoluteFill>
    </LayoutContext.Provider>
  );
};
