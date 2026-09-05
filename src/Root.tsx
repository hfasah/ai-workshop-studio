import React from "react";
import {Composition, staticFile} from "remotion";
import {Episode} from "./Episode";
import type {Build, EpisodeProps} from "./types";

const calculateMetadata = async ({props}: {props: EpisodeProps}) => {
  const file = props.cut ? `build.${props.cut}.json` : "build.json";
  const res = await fetch(staticFile(`episodes/${props.episodeId}/${file}`));
  if (!res.ok) throw new Error(`Missing ${file} for ${props.episodeId}. Run: npm run voice ${props.episodeId}`);
  const build = (await res.json()) as Build;
  return {
    durationInFrames: Math.ceil((build.totalMs / 1000) * build.fps),
    fps: build.fps,
    props: {...props, build},
  };
};

export const RemotionRoot: React.FC = () => {
  return (
    <>
      <Composition
        id="Landscape"
        component={Episode}
        durationInFrames={300}
        fps={30}
        width={1920}
        height={1080}
        defaultProps={{episodeId: "ep001"}}
        calculateMetadata={calculateMetadata}
      />
      <Composition
        id="Portrait"
        component={Episode}
        durationInFrames={300}
        fps={30}
        width={1080}
        height={1920}
        defaultProps={{episodeId: "ep001"}}
        calculateMetadata={calculateMetadata}
      />
    </>
  );
};
