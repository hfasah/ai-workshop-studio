import type {Orientation, SceneType} from "./types";

export type Box = {x: number; y: number; w: number; h: number};

export const layoutFor = (orientation: Orientation, width: number, height: number, type: SceneType, hasCharacters: boolean) => {
  const portrait = orientation === "portrait";
  const floorY = portrait ? height * 0.86 : height * 0.84;
  const centered = type === "title" || type === "outro" || !hasCharacters;
  const wide = type === "demo" || type === "flow";
  let content: Box;
  let stage: Box;
  if (portrait) {
    content = {x: width * 0.05, y: height * 0.1, w: width * 0.9, h: height * 0.37};
    stage = {x: width * 0.05, y: floorY, w: width * 0.9, h: height * 0.34};
  } else if (centered) {
    content = {x: width * 0.12, y: height * 0.17, w: width * 0.76, h: height * 0.58};
    stage = {x: width * 0.7, y: floorY, w: width * 0.26, h: height * 0.62};
  } else if (wide) {
    content = {x: width * 0.05, y: height * 0.15, w: width * 0.64, h: height * 0.61};
    stage = {x: width * 0.72, y: floorY, w: width * 0.24, h: height * 0.62};
  } else if (type === "dialogue") {
    content = {x: width * 0.2, y: height * 0.15, w: width * 0.6, h: height * 0.12};
    stage = {x: width * 0.12, y: floorY, w: width * 0.76, h: height * 0.62};
  } else {
    content = {x: width * 0.05, y: height * 0.15, w: width * 0.58, h: height * 0.61};
    stage = {x: width * 0.66, y: floorY, w: width * 0.3, h: height * 0.62};
  }
  return {portrait, floorY, content, stage};
};
