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

// ---------- publishing (scripts/publish.mjs) ----------
export const PLATFORM_IDS = ["youtube", "shorts", "instagram", "facebook", "facebook_reel", "tiktok", "linkedin", "manual"] as const;
export type PlatformId = (typeof PLATFORM_IDS)[number];
export type PlatformDef = {label: string; aspect: "16:9" | "9:16" | null; direct: "youtube" | "facebook" | null; blotato: string | null; titleMax: number; textMax: number};
export const VIAS = ["direct", "blotato", "manual"] as const;
export type Via = (typeof VIAS)[number];
export const ENTRY_STATUSES = ["draft", "scheduled", "uploading", "published", "failed", "needs_url", "due"] as const;
export type EntryStatus = (typeof ENTRY_STATUSES)[number];

// Badge letters and colours for chips; labels come from /api/connections.platforms.
export const PLATFORM_META: Record<PlatformId, {short: string; color: string; label: string}> = {
  youtube: {short: "YT", color: "#e11d48", label: "YouTube"},
  shorts: {short: "SH", color: "#be123c", label: "YouTube Shorts"},
  instagram: {short: "IG", color: "#c026d3", label: "Instagram Reel"},
  facebook: {short: "FB", color: "#1d4ed8", label: "Facebook Page video"},
  facebook_reel: {short: "FR", color: "#3b82f6", label: "Facebook Reel (beta)"},
  tiktok: {short: "TT", color: "#0f172a", label: "TikTok"},
  linkedin: {short: "LI", color: "#0369a1", label: "LinkedIn"},
  manual: {short: "MN", color: "#64748b", label: "Manual"},
};

export type ScheduleEntry = {
  id: string;
  episodeId: string;
  platform: PlatformId;
  via: Via;
  asset: string;
  title: string;
  description: string;
  hashtags: string[];
  tags?: string[];
  publicUrl: string;
  scheduledAt: string;
  status: EntryStatus;
  note?: string;
  remoteId?: string;
  remoteUrl?: string;
  remoteAccount?: string;
  error?: string;
  createdAt: string;
  updatedAt?: string;
  publishedAt?: string;
  sentAt?: string;
  postedBy?: string;
  scheduledNatively?: boolean;
  episodeTitle: string;
  assetUrl: string;
  caption: string;
};

export type ScheduleInput = {
  episodeId: string;
  platform: PlatformId;
  via: Via;
  asset: string;
  title?: string;
  description?: string;
  hashtags?: string[];
  tags?: string[];
  publicUrl?: string;
  scheduledAt: string;
  note?: string;
  status?: "draft" | "scheduled";
};

export type ConnectionStatus = "connected" | "not configured" | "needs auth" | "error";
export type BlotatoAccount = {id: string; platform: string; username: string; fullname: string; pages?: {id: string; name: string}[]};
export type Connections = {
  youtube: {status: ConnectionStatus; clientId: string; hasSecret: boolean; channelTitle: string; channelId: string; connectedAt: string | null; testedAt: string | null; error: string | null; redirectUri: string};
  facebook: {status: ConnectionStatus; pageId: string; hasToken: boolean; pageName: string; testedAt: string | null; error: string | null};
  blotato: {status: ConnectionStatus; hasKey: boolean; accounts: BlotatoAccount[]; testedAt: string | null; error: string | null};
  mediaHost: {baseUrl: string; uploadCommand: string};
  platforms: Record<PlatformId, PlatformDef>;
  vias: Via[];
  statuses: EntryStatus[];
  fixedTags: string[];
  defaults: Record<string, string>;
};
export type ConnectionsPatch = {
  youtube?: {clientId?: string; clientSecret?: string; disconnect?: boolean};
  facebook?: {pageId?: string; pageToken?: string};
  blotato?: {apiKey?: string};
  mediaHost?: {baseUrl?: string; uploadCommand?: string};
};

export type Asset = {name: string; asset: string; url: string; size: number; mtime: string; preview: boolean; width: number | null; height: number | null; durationMs: number | null; aspect: "16:9" | "9:16" | "1:1" | null};

export type PublishKit = {
  youtube: {titles: string[]; description: string; tags: string[]; hashtags: string[]};
  shorts: {titles: string[]; description: string; hashtags: string[]};
  instagram: {caption: string; hashtags: string[]};
  facebook: {caption: string; hashtags: string[]};
  tiktok: {caption: string; hashtags: string[]};
  linkedin: {post: string; hashtags: string[]};
  thumbnailText: string;
  hashtagBank: string[];
  generatedAt?: string;
  engine?: string | null;
  model?: string | null;
  chapters?: {at: string; label: string}[];
  disclosure?: string;
};

export type EpisodeSchedule = {count: number; published: number; next: {id: string; platform: PlatformId; via: Via; scheduledAt: string; status: EntryStatus} | null};

export type LogLine = {at: string; action: string; entryId?: string; episodeId?: string; platform?: string; via?: string; detail?: string; error?: string; remoteUrl?: string; [k: string]: unknown};

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
  schedule: EpisodeSchedule;
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
  publishKit: PublishKit | null;
  schedule: ScheduleEntry[];
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
  // publishing
  connections: () => request<Connections>("/api/connections"),
  setConnections: (patch: ConnectionsPatch) => request<Connections>("/api/connections", {method: "PUT", body: JSON.stringify(patch)}),
  testConnection: (platform: "youtube" | "facebook" | "blotato") => request<{ok: boolean; channelTitle?: string; pageName?: string; accounts?: BlotatoAccount[]; connections: Connections}>(`/api/connections/${platform}/test`, {method: "POST"}),
  youtubeAuthUrl: () => request<{url: string; redirectUri: string}>("/api/connections/youtube/auth-url"),
  schedule: () => request<ScheduleEntry[]>("/api/schedule"),
  addSchedule: (input: ScheduleInput) => request<ScheduleEntry>("/api/schedule", {method: "POST", body: JSON.stringify(input)}),
  updateSchedule: (id: string, patch: Partial<ScheduleInput> & {remoteUrl?: string}) => request<ScheduleEntry>(`/api/schedule/${id}`, {method: "PUT", body: JSON.stringify(patch)}),
  deleteSchedule: (id: string) => request<{deleted: boolean; warning: string | null}>(`/api/schedule/${id}`, {method: "DELETE"}),
  publishNow: (id: string) => request<ScheduleEntry>(`/api/schedule/${id}/publish-now`, {method: "POST"}),
  markPosted: (id: string, url: string) => request<ScheduleEntry>(`/api/schedule/${id}/posted`, {method: "POST", body: JSON.stringify({url})}),
  assets: (id: string) => request<Asset[]>(`/api/episodes/${id}/assets`),
  savePublishKit: (id: string, kit: PublishKit) => request<PublishKit>(`/api/episodes/${id}/publish-kit`, {method: "PUT", body: JSON.stringify(kit)}),
  publishLog: (limit = 100) => request<LogLine[]>(`/api/publish-log?limit=${limit}`),
};

// datetime-local <-> ISO. The API stores whatever instant it receives with the machine's local offset.
export const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (s: string) => (s ? new Date(s).toISOString() : "");
export const fmtWhen = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {weekday: "short", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit"});
};
export const fmtTime = (iso: string) => new Date(iso).toLocaleTimeString(undefined, {hour: "2-digit", minute: "2-digit"});
export const statusChip = (s: EntryStatus): string => ({draft: "other", scheduled: "blue", uploading: "pending", published: "approved", failed: "changes", needs_url: "pending", due: "pending"})[s] ?? "other";
export const splitTags = (s: string) => s.split(/[\s,]+/).map((t) => t.trim()).filter(Boolean).map((t) => (t.startsWith("#") ? t : `#${t}`));

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
