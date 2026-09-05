// Typed client for scripts/api.mjs. Files on disk are the source of truth; the API is a thin layer over them.

export const GATES = ["brief", "story", "script", "storyboard", "preview", "publication"] as const;
export type Gate = (typeof GATES)[number];
export type GateDecision = "approved" | "changes" | "pending";

export const EXPRESSIONS = ["neutral", "happy", "confident", "serious", "confused", "surprised"] as const;
export const GESTURES = ["neutral", "explain", "point_left", "point_right", "warning"] as const;
export const SCENE_TYPES = ["title", "statement", "bullets", "steps", "flow", "demo", "compare", "dialogue", "screen", "code", "outro"] as const;

export type EpisodeLine = {
  speaker: string;
  text: string;
  expression?: string;
  gesture?: string;
  audio?: string;
  [k: string]: unknown;
};

export type EpisodeScene = {
  id: string;
  type: string;
  label?: string;
  characters?: string[];
  onScreen?: Record<string, unknown>;
  lines?: EpisodeLine[];
  [k: string]: unknown;
};

export type EpisodeJson = {
  id: string;
  series?: string;
  tagline?: string;
  episode: number;
  title: string;
  disclosure?: string;
  background?: string;
  scenes: EpisodeScene[];
  cuts?: {id: string; targetSec?: number; scenes: string[]}[];
  [k: string]: unknown;
};

export type Approval = {gate: string; decision?: string; by: string; at: string; note?: string};

// Text engine (scripts/llm.mjs): Ollama local ($0, default) or the Claude CLI (metered). Settings live in studio/settings.json.
export const ENGINE_NAMES = ["ollama", "claude"] as const;
export type EngineName = (typeof ENGINE_NAMES)[number];
export type EngineRef = {name: EngineName; model: string};
export type EngineInfo = {
  engine: EngineName;
  model: string;
  engines: EngineName[];
  ollamaModel: string;
  ollamaUrl: string;
  claudeModel: string;
  ollama: {reachable: boolean; models: string[]; modelPresent: boolean; error: string | null};
  claudeAvailable: boolean;
  ready: boolean;
  overrides: Partial<Record<"engine" | "ollamaModel" | "ollamaUrl", string>>;
  settings: {engine: EngineName; ollamaModel: string; ollamaUrl: string; claudeModel: string};
  fix: string;
};
export type EnginePatch = Partial<Pick<EngineInfo, "engine" | "ollamaModel" | "ollamaUrl" | "claudeModel">>;
export const engineLabel = (e: EngineRef | null | undefined) => (!e ? "" : e.name === "ollama" ? `Ollama ${e.model} · $0` : `Claude CLI${e.model && e.model !== "default" ? ` ${e.model}` : ""}`);

export const FORMATS = ["build", "short"] as const;
export type Format = (typeof FORMATS)[number];
export const FORMAT_LABELS: Record<Format, string> = {build: "Build story", short: "Short lesson"};

export const PLANS = ["YouTube", "Shorts", "LinkedIn", "Hold"] as const;
export type Plan = (typeof PLANS)[number];
export type Publication = {plan: Plan; date: string; note: string; decidedAt: string};

export const STAGES = ["drafting", "preview ready", "finals ready", "published"] as const;
export type Stage = (typeof STAGES)[number];

export type Status = {
  id: string;
  title: string;
  version: number;
  gates: Record<string, string>;
  disclosure?: string;
  format?: Format;
  auto?: boolean;
  storyline?: string;
  publication?: Publication | null;
  setting?: {country?: string; place?: string; community?: string; languages?: string[]; reviewer?: string};
  approvals?: Approval[];
  cost?: {script_usd?: number; publish_usd?: number; other_usd?: number};
  engine?: EngineRef | null;
  cuts?: string[];
  [k: string]: unknown;
};

export type Job = {
  id: string;
  episodeId: string;
  kind: "script" | "auto" | "voice" | "preview" | "final" | "cut" | "produce" | "finalize" | "publish-kit";
  status: "running" | "done" | "failed";
  exitCode: number | null;
  startedAt: string;
  endedAt: string | null;
  label: string;
  lineCount: number;
};

export type JobLine = {line: string; stream: "stdout" | "stderr"; at: number; progress?: boolean; replace?: boolean};

export type EpisodeSummary = {
  id: string;
  title: string;
  episode: number;
  gates: Record<string, string>;
  version: number;
  disclosure: string;
  format: Format;
  publication: Publication | null;
  stage: Stage;
  hasBuild: boolean;
  totalMs: number | null;
  scenes: number;
  outputs: string[];
  captions: string[];
  cost: {script_usd: number; publish_usd: number; other_usd: number};
  engine: EngineRef | null;
  job: Job | null;
};

export type BuildSummary = {
  totalMs: number;
  fps: number;
  scenes: number;
  builtAt: string;
  file: string;
  cuts: {id: string; totalMs: number; file: string}[];
  error?: string;
};

export type Output = {name: string; type: "video" | "captions"; preview: boolean; size: number; mtime: string; url: string};

export type EpisodeDetail = {
  id: string;
  episode: EpisodeJson;
  status: Status;
  stage: Stage;
  docs: {name: string; content: string}[];
  build: BuildSummary | null;
  outputs: Output[];
  cast: string[];
  job: Job | null;
};

export type Validation = {ok: boolean; exitCode: number | null; output: string; errors: string[]; warnings: string[]};

export type Meta = {
  nextEpisode: number;
  audience: string;
  minutes: number;
  cutSeconds: number;
  storyBank: {name: string; people: string; build: string; lesson: string; reality: string}[];
  cast: string[];
  gates: Gate[];
  formats: Format[];
  plans: Plan[];
  claudeAvailable: boolean;
  engine: EngineRef;
};

export type NewEpisodeForm = {topic: string; episode: number; audience: string; minutes: number; setting: string; story: string; cutSeconds: number; storyline: string; format: Format; auto: boolean};

export type CaptionFile = {cut: string | null; srt: string; vtt: string; cues: number; totalMs: number};

export class ApiError extends Error {
  status: number;
  body: unknown;
  constructor(status: number, message: string, body?: unknown) {
    super(message);
    this.status = status;
    this.body = body;
  }
}

const request = async <T>(url: string, init?: RequestInit): Promise<T> => {
  const res = await fetch(url, {...init, headers: {"Content-Type": "application/json", ...(init?.headers ?? {})}});
  const text = await res.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }
  if (!res.ok) {
    const msg = (body as {error?: string} | null)?.error ?? `${res.status} ${res.statusText}`;
    throw new ApiError(res.status, msg, body);
  }
  return body as T;
};

export const api = {
  meta: () => request<Meta>("/api/meta"),
  engine: () => request<EngineInfo>("/api/engine"),
  setEngine: (patch: EnginePatch) => request<EngineInfo>("/api/engine", {method: "PUT", body: JSON.stringify(patch)}),
  episodes: () => request<EpisodeSummary[]>("/api/episodes"),
  episode: (id: string) => request<EpisodeDetail>(`/api/episodes/${id}`),
  saveEpisode: (id: string, episode: EpisodeJson) => request<{saved: boolean; validation: Validation}>(`/api/episodes/${id}/episode`, {method: "PUT", body: JSON.stringify(episode)}),
  validate: (id: string) => request<Validation>(`/api/episodes/${id}/validate`, {method: "POST"}),
  gate: (id: string, gate: Gate, decision: GateDecision, note: string) => request<Status>(`/api/episodes/${id}/gates/${gate}`, {method: "POST", body: JSON.stringify({decision, note})}),
  createEpisode: (form: NewEpisodeForm) => request<{id: string; job: Job}>("/api/episodes", {method: "POST", body: JSON.stringify(form)}),
  startJob: (id: string, kind: "voice" | "preview" | "final" | "cut", cut?: string, preview?: boolean) => request<Job>(`/api/episodes/${id}/jobs`, {method: "POST", body: JSON.stringify({kind, cut, preview})}),
  produce: (id: string) => request<Job>(`/api/episodes/${id}/produce`, {method: "POST"}),
  finalize: (id: string) => request<Job>(`/api/episodes/${id}/finalize`, {method: "POST"}),
  captions: (id: string, cut?: string) => request<{files: CaptionFile[]; outputs: Output[]}>(`/api/episodes/${id}/captions`, {method: "POST", body: JSON.stringify({cut})}),
  publishKit: (id: string) => request<Job>(`/api/episodes/${id}/publish-kit`, {method: "POST"}),
  publication: (id: string, plan: Plan, date: string, note: string) => request<Status>(`/api/episodes/${id}/publication`, {method: "POST", body: JSON.stringify({plan, date, note})}),
  job: (jobId: string) => request<Job & {lines: JobLine[]}>(`/api/jobs/${jobId}`),
  cancelJob: (jobId: string) => request<Job>(`/api/jobs/${jobId}/cancel`, {method: "POST"}),
};

export const fmtDuration = (ms: number | null | undefined) => {
  if (!ms) return "–";
  const s = Math.round(ms / 1000);
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;
};

export const fmtBytes = (n: number) => (n > 1e6 ? `${(n / 1e6).toFixed(1)} MB` : `${Math.round(n / 1e3)} KB`);

export const gateState = (value: string | undefined): "approved" | "changes" | "pending" | "other" => {
  if (value === "approved") return "approved";
  if (value === "changes") return "changes";
  if (!value || value === "pending") return "pending";
  return "other";
};
