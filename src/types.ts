export type Expression = "neutral" | "happy" | "confident" | "serious" | "confused" | "surprised";
export type Gesture = "neutral" | "explain" | "point_left" | "point_right" | "warning";
export type SceneType = "title" | "statement" | "bullets" | "steps" | "flow" | "diagram" | "examples" | "demo" | "compare" | "dialogue" | "screen" | "code" | "outro";

export type Word = {text: string; startMs: number; endMs: number};

export type Line = {
  speaker: string;
  text: string;
  expression?: Expression;
  gesture?: Gesture;
  audio: string;
  startMs: number;
  durationMs: number;
  words: Word[];
};

export type Scene = {
  id: string;
  type: SceneType;
  label?: string;
  characters: string[];
  background?: string;
  onScreen: Record<string, any>;
  lines: Line[];
  index: number;
  startMs: number;
  durationMs: number;
};

export type CharacterLook = {
  skin: string;
  hair: string;
  hairGrey: string | null;
  shirt: string;
  glasses: boolean;
  beard: boolean;
  height: number;
};

export type Character = {
  id: string;
  name: string;
  role: string;
  color: string;
  captionColor?: string;
  kind: "human" | "robot" | "wisp" | "shield";
  look?: CharacterLook;
  files: string[];
};

export type CaptionWord = {
  text: string;
  startMs: number;
  endMs: number;
  timestampMs: number;
  confidence: null;
  speaker: string;
};

export type Build = {
  id: string;
  fps: number;
  episode: {series: string; tagline?: string; episode: number; title: string; background?: string; music?: string; disclosure?: string};
  totalMs: number;
  scenes: Scene[];
  captions: CaptionWord[];
  characters: Record<string, Character>;
};

export type Orientation = "landscape" | "portrait";

export type EpisodeProps = {
  episodeId: string;
  cut?: string;
  build?: Build;
};
