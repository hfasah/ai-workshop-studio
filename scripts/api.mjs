// AI Workshop Studio API. Local Express server that exposes the episode pipeline to the studio/ front end.
// Usage: node scripts/api.mjs   (port 4600, or PORT=…)
// Files on disk are the source of truth: episodes/<id>/*, public/episodes/<id>/build.json, out/<id>/*.mp4.
import {createRequire} from "node:module";
import {spawn, spawnSync} from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {CHARACTERS, EPISODES, PUBLIC, ROOT, readJson, writeJson} from "./lib.mjs";
import {generateCaptions} from "./captions.mjs";
import {ENGINES, claudeAvailable, generate, getEngine, ollamaStatus, writeSettings} from "./llm.mjs";

// Express lives in studio/node_modules so the renderer's own package.json stays untouched.
const requireStudio = createRequire(path.join(ROOT, "studio", "package.json"));
let express;
try {
  express = requireStudio("express");
} catch {
  console.error("Express is not installed. Run: npm install --prefix studio");
  process.exit(1);
}

const PORT = Number(process.env.PORT ?? 4600);
const OUT = path.join(ROOT, "out");
const STUDIO_DIST = path.join(ROOT, "studio", "dist");
const GATES = ["brief", "story", "script", "storyboard", "preview", "publication"];
const DOC_ORDER = ["episode-brief.md", "story-brief.md", "evidence-pack.md", "claim-ledger.csv", "learning-design.md", "script-v", "authenticity-review", "storyboard.md", "quality-report.md", "publish.md"];
const CAST = Object.keys(CHARACTERS).filter((k) => !k.startsWith("_"));
const DEFAULT_AUDIENCE = "business professionals and curious beginners in Africa and the diaspora, no coding background";
const FORMATS = ["build", "short"]; // build story (3–4 min) or short lesson (60–90 s, concept format)
const PLANS = ["YouTube", "Shorts", "LinkedIn", "Hold"];
const OUTPUT_EXT = /\.(mp4|srt|vtt)$/;

// ---------- helpers ----------
const isEpisodeId = (id) => /^ep\d{3,}$/.test(id);
const episodeDir = (id) => path.join(EPISODES, id);
const exists = (p) => fs.existsSync(p);
const safeJson = (p) => {
  try {
    return readJson(p);
  } catch (e) {
    return {__error: String(e.message ?? e)};
  }
};

const defaultStatus = (id, title, format = "build") => ({
  id,
  title,
  version: 1,
  format,
  gates: Object.fromEntries(GATES.map((g) => [g, "pending"])),
  disclosure: "fictional",
  setting: {country: "", place: "", community: "", languages: [], reviewer: ""},
  approvals: [],
  assets: [],
  voices: Object.fromEntries(CAST.map((c) => [c, `${CHARACTERS[c].voice ?? "?"} (stock)`])),
  cost: {script_usd: 0, other_usd: 0},
  cuts: [],
});

const readStatus = (id, ep) => {
  const p = path.join(episodeDir(id), "status.json");
  if (!exists(p)) return defaultStatus(id, ep?.title ?? id);
  const s = safeJson(p);
  s.gates = {...Object.fromEntries(GATES.map((g) => [g, "pending"])), ...(s.gates ?? {})};
  return s;
};

const buildSummary = (id) => {
  const p = path.join(PUBLIC, "episodes", id, "build.json");
  if (!exists(p)) return null;
  const b = safeJson(p);
  if (b.__error) return {error: b.__error};
  const cuts = fs
    .readdirSync(path.join(PUBLIC, "episodes", id))
    .filter((f) => /^build\.[^.]+\.json$/.test(f))
    .map((f) => {
      const cb = safeJson(path.join(PUBLIC, "episodes", id, f));
      return {id: f.slice(6, -5), totalMs: cb.totalMs ?? 0, file: `/public/episodes/${id}/${f}`};
    });
  return {totalMs: b.totalMs, fps: b.fps, scenes: b.scenes?.length ?? 0, builtAt: b.builtAt, file: `/public/episodes/${id}/build.json`, cuts};
};

const listOutputs = (id) => {
  const dir = path.join(OUT, id);
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => OUTPUT_EXT.test(f))
    .sort()
    .map((f) => {
      const st = fs.statSync(path.join(dir, f));
      return {name: f, type: f.endsWith(".mp4") ? "video" : "captions", preview: /-preview\.mp4$/.test(f), size: st.size, mtime: st.mtime.toISOString(), url: `/out/${id}/${f}`};
    });
};

// Where the episode stands, derived from files and status.json: drafting → preview ready → finals ready → published.
const episodeStage = (id, status) => {
  const plan = status.publication?.plan;
  if ((plan && plan !== "Hold") || status.gates?.publication === "approved") return "published";
  const outputs = listOutputs(id).filter((o) => o.type === "video");
  if (outputs.some((o) => !o.preview)) return "finals ready";
  if (outputs.length) return "preview ready";
  return "drafting";
};

// Cuts that have a build (build.<cut>.json), in episode.json order.
const builtCuts = (id) => {
  const ep = safeJson(path.join(episodeDir(id), "episode.json"));
  return (ep.cuts ?? []).map((c) => c.id).filter((c) => c && exists(path.join(PUBLIC, "episodes", id, `build.${c}.json`)));
};

const listDocs = (id) => {
  const dir = episodeDir(id);
  const rank = (f) => {
    const i = DOC_ORDER.findIndex((k) => f.startsWith(k));
    return i < 0 ? 99 : i;
  };
  return fs
    .readdirSync(dir)
    .filter((f) => /\.(md|csv)$/.test(f))
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((f) => ({name: f, content: fs.readFileSync(path.join(dir, f), "utf8")}));
};

const episodeIds = () =>
  exists(EPISODES)
    ? fs
        .readdirSync(EPISODES)
        .filter((d) => isEpisodeId(d) && exists(path.join(EPISODES, d, "episode.json")))
        .sort()
    : [];

const nextEpisodeNumber = () => {
  const nums = exists(EPISODES) ? fs.readdirSync(EPISODES).map((d) => (isEpisodeId(d) ? Number(d.slice(2)) : 0)) : [];
  return (nums.length ? Math.max(...nums) : 0) + 1;
};

const runValidator = (id) => {
  const r = spawnSync(process.execPath, [path.join(ROOT, "scripts", "validate.mjs"), id], {cwd: ROOT, encoding: "utf8"});
  const output = `${r.stdout ?? ""}${r.stderr ?? ""}`.trim();
  const lines = output.split("\n");
  return {
    ok: r.status === 0,
    exitCode: r.status,
    output,
    errors: lines.filter((l) => /^\s*ERROR:/.test(l)).map((l) => l.replace(/^\s*ERROR:\s*/, "")),
    warnings: lines.filter((l) => /^\s*warn:/.test(l)).map((l) => l.replace(/^\s*warn:\s*/, "")),
  };
};

const storyBank = () => {
  const p = path.join(ROOT, "team", "STORY-BANK.md");
  if (!exists(p)) return [];
  const rows = [];
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    if (!line.startsWith("|")) continue;
    const cells = line.split("|").slice(1, -1).map((c) => c.trim());
    if (cells.length < 5 || cells[0] === "Build story" || /^-+$/.test(cells[0])) continue;
    rows.push({name: cells[0], people: cells[1], build: cells[2], lesson: cells[3], reality: cells[4]});
  }
  return rows;
};

const sectionOf = (text, startRe, endRe) => {
  const s = text.search(startRe);
  if (s < 0) return "";
  const rest = text.slice(s);
  const e = rest.slice(1).search(endRe);
  return e < 0 ? rest : rest.slice(0, e + 1);
};

// ---------- jobs ----------
const jobs = new Map();
const activeJobFor = (episodeId) => [...jobs.values()].find((j) => j.episodeId === episodeId && j.status === "running");

const publicJob = (j) => ({id: j.id, episodeId: j.episodeId, kind: j.kind, status: j.status, exitCode: j.exitCode, startedAt: j.startedAt, endedAt: j.endedAt, label: j.label, lineCount: j.lines.length});

const createJob = (episodeId, kind, label) => {
  const job = {
    id: crypto.randomUUID().slice(0, 8),
    episodeId,
    kind,
    label,
    status: "running",
    exitCode: null,
    startedAt: new Date().toISOString(),
    endedAt: null,
    lines: [],
    listeners: new Set(),
  };
  jobs.set(job.id, job);
  return job;
};

const emit = (job, payload) => {
  const data = `data: ${JSON.stringify(payload)}\n\n`;
  for (const res of job.listeners) res.write(data);
};

const log = (job, text, stream = "stdout") => {
  for (const raw of String(text).split(/\r\n|\n|\r/)) {
    const line = raw.replace(/\x1b\[[0-9;]*[A-Za-z]/g, "").trimEnd();
    if (!line) continue;
    // Remotion progress lines ("Rendered 12/3627, time remaining …", "Bundling 64%") replace the previous progress line.
    const progress = /^(Rendered \d+\/\d+|Bundling \d+%|Encoded \d+\/\d+|Stitching \d+\/\d+)/.test(line);
    const last = job.lines[job.lines.length - 1];
    const replace = progress && last?.progress === true;
    const entry = {line, stream, at: Date.now(), ...(progress ? {progress: true} : {}), ...(replace ? {replace: true} : {})};
    if (replace) job.lines.pop();
    job.lines.push(entry);
    if (job.lines.length > 5000) job.lines.splice(0, job.lines.length - 5000);
    emit(job, entry);
  }
};

const finish = (job, exitCode, error) => {
  if (job.status !== "running") return;
  job.status = exitCode === 0 ? "done" : "failed";
  job.exitCode = exitCode;
  job.endedAt = new Date().toISOString();
  if (error) log(job, error, "stderr");
  emit(job, {done: true, exitCode, status: job.status});
  for (const res of job.listeners) res.end();
  job.listeners.clear();
  if (job.onDone) job.onDone(job);
};

// Spawns a command and pipes its output into the job. Resolves with {code, stdout}.
const runInJob = (job, cmd, args, {captureStdout = false, env} = {}) =>
  new Promise((resolve) => {
    log(job, `$ ${[cmd, ...args.map((a) => (a.length > 120 ? `${a.slice(0, 117)}…` : a))].join(" ")}`);
    let child;
    try {
      child = spawn(cmd, args, {cwd: ROOT, env: {...process.env, ...env, FORCE_COLOR: "0"}, stdio: ["ignore", "pipe", "pipe"]});
    } catch (e) {
      resolve({code: 1, stdout: "", error: String(e.message ?? e)});
      return;
    }
    let stdout = "";
    child.stdout.on("data", (d) => {
      if (captureStdout) stdout += d;
      else log(job, d, "stdout");
    });
    child.stderr.on("data", (d) => log(job, d, "stderr"));
    child.on("error", (e) => resolve({code: 1, stdout, error: e.code === "ENOENT" ? `"${cmd}" is not installed or not on PATH` : String(e.message ?? e)}));
    child.on("close", (code) => resolve({code: code ?? 1, stdout}));
    job.child = child;
  });

const pipelineArgs = (episodeId, kind, cut, preview) => {
  const script = kind === "voice" ? "voice.mjs" : "render.mjs";
  const args = [path.join(ROOT, "scripts", script), episodeId];
  if (kind === "preview") args.push("--format", "both", "--preview");
  if (kind === "final") args.push("--format", "both");
  if (kind === "cut") {
    args.push("--cut", cut, "--format", "portrait");
    if (preview) args.push("--preview");
  }
  const label = {voice: "Build voice", preview: "Render preview (both)", final: "Render final (both)", cut: `Render cut ${cut}${preview ? " (preview)" : ""}`}[kind];
  return {label, args};
};

const startPipelineJob = (episodeId, kind, cut, preview) => {
  const {label, args} = pipelineArgs(episodeId, kind, cut, preview);
  const job = createJob(episodeId, kind, label);
  runInJob(job, process.execPath, args).then((r) => finish(job, r.code, r.error));
  return job;
};

// ---------- chained jobs (auto-produce, produce, finalize) ----------
// A stage is {label, args} (a script to run) or {label, fn} (a synchronous step such as captions).
const stageHeader = (job, i, total, label) => log(job, `━━ Stage ${i}/${total} · ${label} ━━`);

const captionStage = (episodeId) => ({
  label: "Captions (.srt/.vtt)",
  fn: (job) => {
    for (const cut of [undefined, ...builtCuts(episodeId)]) {
      const r = generateCaptions(episodeId, cut);
      log(job, `Wrote ${r.srt} and ${r.vtt} (${r.cues} cues)`);
    }
  },
});

// Voice → captions → render (both formats) → each cut. `preview` picks half-resolution previews or finals.
const produceStages = (episodeId, {preview, voice}) => {
  const stages = [];
  if (voice) stages.push(pipelineArgs(episodeId, "voice"));
  stages.push(captionStage(episodeId));
  stages.push(pipelineArgs(episodeId, preview ? "preview" : "final"));
  const ep = safeJson(path.join(episodeDir(episodeId), "episode.json"));
  for (const c of ep.cuts ?? []) if (c.id) stages.push(pipelineArgs(episodeId, "cut", c.id, preview));
  return stages;
};

// Runs stages in order inside one job; stops at the first failure. Resolves true when every stage passed.
const runStages = async (job, stages, offset = 0, total = stages.length + offset) => {
  for (const [i, stage] of stages.entries()) {
    stageHeader(job, offset + i + 1, total, stage.label);
    if (stage.fn) {
      try {
        await stage.fn(job);
      } catch (e) {
        finish(job, 1, `${stage.label} failed: ${e.message ?? e}`);
        return false;
      }
      continue;
    }
    const r = await runInJob(job, process.execPath, stage.args);
    if (r.error || r.code !== 0) {
      finish(job, r.code || 1, r.error ?? `${stage.label} exited with code ${r.code}`);
      return false;
    }
  }
  return true;
};

const startProduceJob = (episodeId) => {
  const job = createJob(episodeId, "produce", `Produce preview for ${episodeId}`);
  (async () => {
    const stages = produceStages(episodeId, {preview: true, voice: true});
    if (await runStages(job, stages)) {
      log(job, `Preview ready: ${listOutputs(episodeId).filter((o) => o.preview).map((o) => o.name).join(", ")}`);
      finish(job, 0);
    }
  })().catch((e) => finish(job, 1, String(e.stack ?? e)));
  return job;
};

const startFinalizeJob = (episodeId) => {
  const job = createJob(episodeId, "finalize", `Render finals for ${episodeId}`);
  (async () => {
    const stages = produceStages(episodeId, {preview: false, voice: false});
    if (await runStages(job, stages)) {
      log(job, `Finals ready: ${listOutputs(episodeId).filter((o) => o.type === "video" && !o.preview).map((o) => o.name).join(", ")}`);
      finish(job, 0);
    }
  })().catch((e) => finish(job, 1, String(e.stack ?? e)));
  return job;
};

// ---------- script generation (Ollama local by default, Claude CLI optional; see scripts/llm.mjs) ----------
const engineLabel = (e = getEngine()) => (e.name === "ollama" ? `Ollama ${e.model} (local, $0)` : `Claude CLI${e.claudeModel ? ` ${e.claudeModel}` : ""} (metered)`);

// ep001 with each scene's onScreen cut down to the fields its type needs, so the example stays small for a local model.
const compactUi = (ui) => {
  if (!ui) return undefined;
  const k = ui.kind;
  if (k === "chat") return {kind: k, messages: (ui.messages ?? []).slice(0, 2)};
  if (k === "calendar") return {kind: k, days: ui.days, slots: (ui.slots ?? []).filter((s, i) => i < 2 || s.highlight).slice(0, 3)};
  if (k === "email") return {kind: k, to: ui.to, subject: ui.subject, body: (ui.body ?? []).slice(0, 2)};
  if (k === "approval") return {kind: k, title: ui.title, summary: (ui.summary ?? []).slice(0, 2), approve: ui.approve, reject: ui.reject, clickAt: ui.clickAt};
  return ui;
};
const compactOnScreen = (type, o = {}) => {
  switch (type) {
    case "title":
      return {title: o.title, subtitle: o.subtitle};
    case "statement":
      return {text: o.text, emphasis: o.emphasis};
    case "dialogue":
      return {caption: o.caption};
    case "compare":
      return {left: {title: o.left?.title, items: o.left?.items}, right: {title: o.right?.title, items: o.right?.items}};
    case "demo":
      return {title: o.title, app: o.app, steps: (o.steps ?? []).map((s) => ({title: s.title, detail: s.detail, ui: compactUi(s.ui)}))};
    case "flow":
      return {title: o.title, nodes: (o.nodes ?? []).map((n) => ({label: n.label, icon: n.icon, sub: n.sub}))};
    case "bullets":
      return {title: o.title, items: o.items};
    case "steps":
      return {title: o.title, steps: o.steps};
    case "outro":
      return {line: o.line, emphasis: o.emphasis, cta: o.cta};
    case "code":
      return {title: o.title, code: o.code};
    case "screen":
      return {src: o.src, title: o.title};
    default:
      return o;
  }
};
const compactExample = () => {
  const ep = safeJson(path.join(EPISODES, "ep001", "episode.json"));
  const out = {
    id: ep.id,
    series: ep.series,
    tagline: ep.tagline,
    episode: ep.episode,
    title: ep.title,
    disclosure: ep.disclosure,
    background: ep.background,
    scenes: (ep.scenes ?? []).map((s) => ({
      id: s.id,
      type: s.type,
      label: s.label,
      characters: s.characters ?? [],
      onScreen: compactOnScreen(s.type, s.onScreen),
      lines: (s.lines ?? []).map((l) => ({speaker: l.speaker, text: l.text, expression: l.expression, gesture: l.gesture})),
    })),
    cuts: ep.cuts ?? [],
  };
  return JSON.stringify(out, null, 1);
};

// Fixed material for every script request: identity, story standard, file format, cast, one compact example, rules. Under ~6k tokens.
const scriptSystemPrompt = () => {
  const bible = fs.readFileSync(path.join(ROOT, "SERIES.md"), "utf8");
  const glossary = fs.existsSync(path.join(ROOT, "team", "GLOSSARY.md")) ? fs.readFileSync(path.join(ROOT, "team", "GLOSSARY.md"), "utf8") : "";
  const contract = fs.readFileSync(path.join(ROOT, "team", "CONTRACT.md"), "utf8");
  const team = fs.readFileSync(path.join(ROOT, "TEAM.md"), "utf8");
  const storyStandard = sectionOf(contract, /^## Series learning model and story standard/m, /^## /m);
  // The spec's JSON skeletons duplicate the example; keep the scene-type table, ui kinds and line fields.
  const spec = sectionOf(team, /^## 4\. Episode file specification/m, /^## /m)
    .replace(/```json[\s\S]*?```\n?/g, "")
    .replace(/^Each scene:\s*$/m, "")
    .replace(/\n{3,}/g, "\n\n");
  const cast = CAST.map((c) => `- ${c}: ${CHARACTERS[c].name} — ${CHARACTERS[c].role}`).join("\n");
  return `You are the head writer for the animated AI education series "AI With Hippolyte". You write episode files as JSON.

=== SERIES BIBLE (SERIES.md) ===
${bible.trim()}

=== STORY STANDARD (team/CONTRACT.md) ===
${storyStandard.trim()}

=== EPISODE FILE FORMAT (TEAM.md section 4) ===
${spec.trim()}

=== CAST (the only allowed values for "speaker" and "characters") ===
${cast}

=== GLOSSARY (team/GLOSSARY.md; the only allowed definitions) ===
${glossary.trim()}

=== EXAMPLE EPISODE FILE (episodes/ep001/episode.json, concept format; copy its structure exactly) ===
${compactExample()}

=== WRITING RULES ===
1. Spoken "text": plain English, no markdown, numbers written as words. On-screen text may use digits.
2. Allowed "expression": neutral, happy, confident, serious, confused, surprised. Allowed "gesture": neutral, explain, point_left, point_right, warning.
3. Scene "type" must be one of: title, statement, bullets, steps, flow, demo, compare, dialogue, screen, code, outro. Give every scene the onScreen fields its type requires. Every scene needs a unique "id".
4. Demo scenes have the same number of steps as lines; flow scenes have the same number of nodes as lines.
5. Real users and local specialists appear only through the mock-app UI and through amara relaying their words; the cast is fixed, no new speakers.
6. The gatekeeper appears in the ownership or safety beat.
7. The last scene has type "outro" and its last line is spoken by tanyi and contains exactly: Don't just use AI. Build it to work reliably.
8. Include "disclosure": "Fictional teaching scenario based on researched conditions". Do not invent statistics, organisations, customs or local-language phrases.
9. Use the glossary's definitions exactly. Never expand an acronym that is not in the glossary; describe what it does instead. No invented facts, numbers or product names.
10. Return only one JSON object: no markdown fences, no commentary.`;
};

// The task: topic, storyline, format and budget. Returns {system, prompt, maxTokens}.
const buildScriptPrompt = ({id, episode, topic, audience, minutes, setting, story, cutSeconds, storyline = "", format = "build"}) => {
  const bank = story ? storyBank().find((r) => r.name === story) : null;
  const short = format === "short";
  const words = Math.round(minutes * 140);
  const length = short
    ? `- Length: a short lesson of 60 to 90 seconds (about 150 to 200 spoken words) in 5 or 6 scenes.
- Format: the concept format from the series bible: hook, explanation, one practical example, one action step, then the signature closing. One idea only; no build-story beats, no title card unless it fits the budget.`
    : `- Length: about ${minutes} minutes (roughly ${words} spoken words at 140 words per minute).
- Format: the build-story format from the series bible (nine beats: hook, title, listening, decide, build, constraint and fix, user test, ownership, build challenge and closing).`;
  const cutRule = short
    ? `- Include a top-level "cuts" array with one vertical cut {"id": "short1", "targetSec": ${cutSeconds}, "scenes": [...]} using existing scene ids that add up to roughly ${cutSeconds} seconds (it may reuse most of the episode).`
    : `- Include a top-level "cuts" array with one vertical cut {"id": "short1", "targetSec": ${cutSeconds}, "scenes": [...]} using three or four existing scene ids that add up to roughly ${cutSeconds} seconds.`;
  const lines = [
    `Write episode ${episode} of the series, about: "${topic}".`,
    `- "id" must be "${id}", "episode" must be ${episode}, "series" must be "AI With Hippolyte".`,
    `- Audience: ${audience}.`,
    length,
    storyline.trim() ? `- Hippolyte's storyline (follow it; verify setting facts):\n${storyline.trim().split("\n").map((l) => `    ${l}`).join("\n")}` : "",
    setting
      ? `- Proposed African setting (fictional teaching scenario, treat as unverified; name only what the setting hint supports): ${setting}.`
      : "- Choose a plausible African setting for a fictional teaching scenario. Do not invent statistics, organisations, customs or local-language phrases.",
    bank ? `- Story bank concept: ${bank.name} — people: ${bank.people}; what the crew builds: ${bank.build}; AI lesson: ${bank.lesson}; reality that changes the design: ${bank.reality}.` : "",
    cutRule,
    `Return only the JSON object for the episode file, matching the structure of the example.`,
  ].filter(Boolean);
  return {system: scriptSystemPrompt(), prompt: lines.join("\n"), maxTokens: short ? 4096 : 8192};
};

const buildRepairPrompt = (ep, errors) => `The episode JSON below failed validation. Errors:
${errors.map((e) => `- ${e}`).join("\n")}

Fix every error and return the complete corrected episode JSON, nothing else. Keep everything that was not reported as an error.

${JSON.stringify(ep, null, 1)}`;

const writeBrief = (dir, f) => {
  const brief = `# Episode brief — ${f.id} v1
Title (working): ${f.topic}
Audience: ${f.audience}
Learning objective (one, observable): after watching, the viewer can ... (to be refined at gate 1)
Supporting ideas (max 3): to be refined at gate 1
Duration: ${f.minutes} min main · cutdown: ${f.cutSeconds} s vertical (scenes: chosen at storyboard)
Platforms: YouTube 16:9, Shorts/Reels/TikTok 9:16
Characters: tanyi, amara, kito, gatekeeper (+ hallucinator if a failure mode is shown)
Central teaching point: ${f.topic}
Proposed African setting (country, place, community, languages): ${f.setting || "to be proposed by the Story Director"} (to be verified by research)
User need: to be defined from the story bank concept and research
Artifact the crew builds: to be defined
Story status: fictional teaching scenario
Story bank concept used: ${f.story || "none"}
Format: ${f.format === "short" ? "short lesson (60–90 s, concept format)" : "build story (3–4 min)"}
Hippolyte's storyline: ${f.storyline ? `\n${f.storyline.trim()}` : "none"}
Safety angle: to be defined
Call to action: to be defined
Must-use facts / stories: none
Constraints: ${f.format === "short" ? "short lesson" : "build-story"} format, no invented statistics, stock voices only
Open questions: none yet
Status: needs-review
`;
  fs.writeFileSync(path.join(dir, "episode-brief.md"), brief);
};

// Runs generate() inside a job, streaming engine notes into the log. Resolves the result, or finishes the job with an error and resolves null.
const askModel = async (job, req) => {
  const ac = new AbortController();
  job.abort = () => ac.abort();
  try {
    return await generate({...req, signal: ac.signal, onLog: (l) => log(job, l)});
  } catch (e) {
    finish(job, 1, String(e.message ?? e));
    return null;
  } finally {
    job.abort = null;
  }
};

const addCost = (status, key, usd) => {
  status.cost = {...(status.cost ?? {}), [key]: Number(((status.cost?.[key] ?? 0) + usd).toFixed(4))};
};

const costNote = (r) => (r.engine === "ollama" ? "$0.00 (local)" : `$${r.costUsd.toFixed(2)}`);

const applyEpisodeDefaultsBase = (ep, form) => {
  if (!ep || typeof ep !== "object" || Array.isArray(ep)) throw new Error("The model did not return an episode object.");
  ep.id = form.id;
  ep.episode = form.episode;
  ep.series ??= "AI With Hippolyte";
  ep.tagline ??= "Complex AI. Explained visually. Built practically.";
  ep.background ??= "workshop";
  ep.disclosure ??= "Fictional teaching scenario based on researched conditions";
  if (!Array.isArray(ep.scenes)) ep.scenes = [];
  return ep;
};

// Script stage: asks the engine for episode.json, validates it, runs one automatic repair round on validator errors, records cost and engine.
// Resolves true on success (the job is finished on failure).
const runScriptStage = async (job, form) => {
  const engine = getEngine();
  const {system, prompt, maxTokens} = buildScriptPrompt(form);
  log(job, `Drafting "${form.topic}" → episodes/${form.id}/episode.json with ${engineLabel(engine)}…`);
  const a = await askModel(job, {system, prompt, json: true, maxTokens});
  if (!a) return false;
  let ep;
  try {
    ep = applyEpisodeDefaults(a.json, form);
  } catch (e) {
    return finish(job, 1, `${e.message}\n${a.text.slice(0, 500)}`), false;
  }
  let cost = a.costUsd;
  writeJson(path.join(episodeDir(form.id), "episode.json"), ep);
  log(job, `Wrote episodes/${form.id}/episode.json (${ep.scenes.length} scenes). Cost: ${costNote(a)}`);
  let v = runValidator(form.id);
  log(job, v.output, v.ok ? "stdout" : "stderr");
  if (!v.ok) {
    log(job, `Validator found ${v.errors.length} error(s). Asking ${engineLabel(engine)} for one repair round…`);
    const r = await askModel(job, {system, prompt: buildRepairPrompt(ep, v.errors), json: true, maxTokens});
    if (!r) return false;
    cost += r.costUsd;
    try {
      ep = applyEpisodeDefaults(r.json, form);
      writeJson(path.join(episodeDir(form.id), "episode.json"), ep);
      log(job, `Wrote repaired episodes/${form.id}/episode.json (${ep.scenes.length} scenes). Cost: ${costNote(r)}`);
      v = runValidator(form.id);
      log(job, v.output, v.ok ? "stdout" : "stderr");
    } catch (e) {
      log(job, `Repair round did not return an episode object (${e.message}); keeping the first draft.`, "stderr");
    }
  }
  const status = readStatus(form.id, ep);
  status.title = ep.title ?? status.title;
  addCost(status, "script_usd", cost);
  status.engine = {name: a.engine, model: a.model};
  status.cuts = (ep.cuts ?? []).map((c) => c.id);
  writeJson(path.join(episodeDir(form.id), "status.json"), status);
  log(job, v.ok ? "Validator passed." : "Validator still reports errors. Fix them in the Script tab.");
  if (!v.ok && form.auto) {
    finish(job, 1, "Auto-produce stopped: the script did not pass the validator. Fix it in the Script tab, then click Produce preview.");
    return false;
  }
  return true;
};

// Script job, or (auto) the whole chain: script → voice → captions → preview renders → cut previews.
const startScriptJob = (form) => {
  const job = createJob(form.id, form.auto ? "auto" : "script", form.auto ? `Draft and produce ${form.id}` : `Draft script for ${form.id}`);
  (async () => {
    if (!form.auto) {
      if (await runScriptStage(job, form)) finish(job, 0);
      return;
    }
    // Stage count is only known once the script exists (cuts), so the header for stage 1 is written by hand.
    log(job, `━━ Stage 1 · Draft script ━━`);
    if (!(await runScriptStage(job, form))) return;
    const stages = produceStages(form.id, {preview: true, voice: true});
    log(job, `Script done. Producing automatically: ${stages.map((s) => s.label).join(" → ")}. Gates stay pending for your review.`);
    if (await runStages(job, stages, 1)) {
      log(job, `Preview ready: ${listOutputs(form.id).filter((o) => o.preview).map((o) => o.name).join(", ")}. Review it in the Preview tab, then decide in Publish.`);
      finish(job, 0);
    }
  })().catch((e) => finish(job, 1, String(e.stack ?? e)));
  return job;
};

// ---------- publishing kit (same engine as the script) ----------
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;

// Fixed material: tone, style colours, cast, and the section spec of publish.md.
const publishSystemPrompt = () => {
  const bible = fs.readFileSync(path.join(ROOT, "SERIES.md"), "utf8");
  const team = fs.readFileSync(path.join(ROOT, "TEAM.md"), "utf8");
  const colours = sectionOf(team, /^\*\*Colours\*\*/m, /^\*\*Surfaces/m);
  const castTable = sectionOf(team, /^### Cast/m, /^\*\*Character usage/m);
  return `You are the showrunner of the animated AI education series "AI With Hippolyte", preparing the publishing kit for one finished episode. The host never publishes through you: this kit is handed to him and he posts it himself.

=== SERIES BIBLE (SERIES.md) — match its tone: plain English, direct, warm, practical, no hype ===
${bible.trim()}

=== STYLE GUIDE COLOURS AND CAST (TEAM.md) — for the thumbnail brief ===
${colours.trim()}
${castTable.trim()}

=== OUTPUT: publish.md in Markdown with exactly these sections, in this order ===
1. "## Titles" — three title options, each at most 60 characters, as a numbered list.
2. "## YouTube description" — two or three short paragraphs, then a "Chapters" list with one timestamp per scene group (format m:ss Title, first one 0:00), then the disclosure line verbatim on its own line, then the series tagline.
3. "## Tags" — ten tags, comma-separated, lowercase.
4. "## Thumbnail brief" — one paragraph for a designer: composition, the character(s) shown, the 3 to 5 words of text, and the exact hex colours from the style guide to use for background, text and accent.
5. "## Short clips" — three suggestions for vertical clips, each with start and end time (m:ss–m:ss), the hook line to caption, and why it stands alone.
6. "## LinkedIn post" — 120 to 180 words in the host's first-person voice (he is an AI engineer who has run production systems; direct, warm, practical, no hype, no emojis, no hashtags in the body), ending with one question to the reader.
7. "## Newsletter blurb" — 60 to 90 words introducing the episode to subscribers, with a one-line call to action.
Rules: no invented statistics, no claims the episode does not make, no new characters, the host's real name only in the series name. Return ONLY the Markdown, no preamble, no code fences.`;
};

// The task: this episode's title, disclosure, timing, cuts and every spoken line. Returns {system, prompt}.
const buildPublishPrompt = (id) => {
  const ep = safeJson(path.join(episodeDir(id), "episode.json"));
  const status = readStatus(id, ep);
  const buildPath = path.join(PUBLIC, "episodes", id, "build.json");
  const build = exists(buildPath) ? safeJson(buildPath) : null;
  const timing = new Map((build?.scenes ?? []).map((s) => [s.id, s]));
  const name = (s) => CHARACTERS[s]?.name ?? s;
  const scenes = (ep.scenes ?? [])
    .map((s, i) => {
      const t = timing.get(s.id);
      const head = `Scene ${i + 1} "${s.label ?? s.id}" (${s.id}, ${s.type})${t ? ` — ${mmss(t.startMs)} to ${mmss(t.startMs + t.durationMs)}` : ""}`;
      const lines = (s.lines ?? []).map((l) => `  ${name(l.speaker)}: ${l.text}`).join("\n");
      return `${head}\n${lines || "  (no spoken lines)"}`;
    })
    .join("\n\n");
  const cuts = (ep.cuts ?? []).map((c) => `- ${c.id}: target ${c.targetSec ?? "?"} s, scenes ${c.scenes.join(", ")}`).join("\n");
  const total = build ? mmss(build.totalMs) : "unknown (no voice build yet)";
  const disclosure = ep.disclosure ?? status.disclosure ?? "Fictional teaching scenario";
  const prompt = `=== EPISODE ===
Episode ${ep.episode ?? Number(id.slice(2))} (${id}): "${ep.title ?? status.title}"
Disclosure line (must appear verbatim in the description): ${disclosure}
Total running time: ${total}
Setting: ${[status.setting?.country, status.setting?.place, status.setting?.community].filter(Boolean).join(" · ") || "none stated"}
Vertical cuts:
${cuts || "- none"}

=== SPOKEN LINES WITH SCENE TIMESTAMPS (from build.json) ===
${scenes}

=== TASK ===
Write publish.md for this episode with the seven sections in the required order. Return only the Markdown.`;
  return {system: publishSystemPrompt(), prompt};
};

const startPublishKitJob = (id) => {
  const job = createJob(id, "publish-kit", `Publishing kit for ${id}`);
  (async () => {
    const engine = getEngine();
    log(job, `Writing episodes/${id}/publish.md with ${engineLabel(engine)}…`);
    const {system, prompt} = buildPublishPrompt(id);
    const a = await askModel(job, {system, prompt, maxTokens: 4096});
    if (!a) return;
    const text = a.text.replace(/^```(?:markdown|md)?\s*\n/, "").replace(/\n```\s*$/, "").trim();
    if (!/## Titles/i.test(text)) return finish(job, 1, `The model did not return the expected Markdown:\n${text.slice(0, 500)}`);
    const stamp = `\n\n---\nGenerated by AI Workshop Studio (${a.engine} ${a.model}) on ${new Date().toISOString().slice(0, 10)}. Publishing decision: recorded in status.json → publication. The team never posts.\n`;
    fs.writeFileSync(path.join(episodeDir(id), "publish.md"), `${text}${stamp}`);
    const ep = safeJson(path.join(episodeDir(id), "episode.json"));
    const status = readStatus(id, ep);
    addCost(status, "publish_usd", a.costUsd);
    status.engine = {name: a.engine, model: a.model};
    writeJson(path.join(episodeDir(id), "status.json"), status);
    log(job, `Wrote episodes/${id}/publish.md. Cost: ${costNote(a)}`);
    finish(job, 0);
  })().catch((e) => finish(job, 1, String(e.stack ?? e)));
  return job;
};

// ---------- app ----------
const app = express();
app.use(express.json({limit: "5mb"}));

const requireEpisode = (req, res, next) => {
  const {id} = req.params;
  if (!isEpisodeId(id) || !exists(path.join(episodeDir(id), "episode.json"))) return res.status(404).json({error: `No episode ${id}`});
  next();
};

app.get("/api/meta", (_req, res) => {
  const e = getEngine();
  res.json({nextEpisode: nextEpisodeNumber(), audience: DEFAULT_AUDIENCE, minutes: 3.5, cutSeconds: 45, storyBank: storyBank(), cast: CAST, gates: GATES, formats: FORMATS, plans: PLANS, claudeAvailable: claudeAvailable(), engine: {name: e.name, model: e.model}});
});

// ---------- text engine (studio/settings.json; env LLM_ENGINE / OLLAMA_MODEL / OLLAMA_URL win) ----------
const hasModel = (models, m) => models.includes(m) || models.includes(`${m}:latest`);
const engineInfo = async () => {
  const e = getEngine();
  const ollama = await ollamaStatus(e.ollamaUrl);
  return {
    engine: e.name,
    model: e.model,
    engines: ENGINES,
    ollamaModel: e.ollamaModel,
    ollamaUrl: e.ollamaUrl,
    claudeModel: e.claudeModel,
    ollama: {reachable: ollama.reachable, models: ollama.models, modelPresent: ollama.reachable && hasModel(ollama.models, e.ollamaModel), error: ollama.error ?? null},
    claudeAvailable: claudeAvailable(),
    ready: e.name === "ollama" ? ollama.reachable && hasModel(ollama.models, e.ollamaModel) : claudeAvailable(),
    overrides: e.overrides,
    settings: e.settings,
    fix: `brew install ollama; ollama serve; ollama pull ${e.ollamaModel}`,
  };
};

app.get("/api/engine", async (_req, res) => res.json(await engineInfo()));

app.put("/api/engine", async (req, res) => {
  const b = req.body ?? {};
  const patch = {};
  if (b.engine !== undefined) patch.engine = String(b.engine);
  if (b.ollamaModel !== undefined) patch.ollamaModel = String(b.ollamaModel).trim();
  if (b.ollamaUrl !== undefined) patch.ollamaUrl = String(b.ollamaUrl).trim();
  if (b.claudeModel !== undefined) patch.claudeModel = String(b.claudeModel).trim();
  if (!Object.keys(patch).length) return res.status(400).json({error: "Body must contain engine, ollamaModel, ollamaUrl or claudeModel"});
  try {
    writeSettings(patch);
  } catch (e) {
    return res.status(400).json({error: String(e.message ?? e)});
  }
  res.json(await engineInfo());
});

app.get("/api/episodes", (_req, res) => {
  const list = episodeIds().map((id) => {
    const ep = safeJson(path.join(episodeDir(id), "episode.json"));
    const status = readStatus(id, ep);
    const build = buildSummary(id);
    const outputs = listOutputs(id);
    return {
      id,
      title: ep.title ?? status.title ?? id,
      episode: ep.episode ?? Number(id.slice(2)),
      gates: status.gates,
      version: status.version ?? 1,
      disclosure: status.disclosure ?? ep.disclosure ?? "",
      format: FORMATS.includes(status.format) ? status.format : "build",
      publication: status.publication ?? null,
      stage: episodeStage(id, status),
      hasBuild: Boolean(build && !build.error),
      totalMs: build?.totalMs ?? null,
      scenes: ep.scenes?.length ?? 0,
      outputs: outputs.filter((o) => o.type === "video").map((o) => o.name),
      captions: outputs.filter((o) => o.type === "captions").map((o) => o.name),
      cost: {script_usd: Number(status.cost?.script_usd ?? 0), publish_usd: Number(status.cost?.publish_usd ?? 0), other_usd: Number(status.cost?.other_usd ?? 0)},
      engine: status.engine ?? null,
      job: activeJobFor(id) ? publicJob(activeJobFor(id)) : null,
    };
  });
  res.json(list);
});

app.get("/api/episodes/:id", requireEpisode, (req, res) => {
  const {id} = req.params;
  const episode = safeJson(path.join(episodeDir(id), "episode.json"));
  const status = readStatus(id, episode);
  const active = activeJobFor(id);
  res.json({id, episode, status, stage: episodeStage(id, status), docs: listDocs(id), build: buildSummary(id), outputs: listOutputs(id), cast: CAST, job: active ? publicJob(active) : null});
});

// Chained jobs: voice + captions + preview renders (+ cut previews), or final renders (+ cut finals).
app.post("/api/episodes/:id/produce", requireEpisode, (req, res) => {
  const {id} = req.params;
  const running = activeJobFor(id);
  if (running) return res.status(409).json({error: `A job is already running for ${id}: ${running.label}`, job: publicJob(running)});
  const ep = safeJson(path.join(episodeDir(id), "episode.json"));
  if (!ep.scenes?.length) return res.status(409).json({error: "The script has no scenes yet"});
  res.status(201).json(publicJob(startProduceJob(id)));
});

app.post("/api/episodes/:id/finalize", requireEpisode, (req, res) => {
  const {id} = req.params;
  const running = activeJobFor(id);
  if (running) return res.status(409).json({error: `A job is already running for ${id}: ${running.label}`, job: publicJob(running)});
  if (!exists(path.join(PUBLIC, "episodes", id, "build.json"))) return res.status(409).json({error: "Build voice first (Produce preview does it)"});
  res.status(201).json(publicJob(startFinalizeJob(id)));
});

// Captions: synchronous, writes out/<id>/<id>[-cut]-captions.srt and .vtt for the full episode and every built cut (or one cut).
app.post("/api/episodes/:id/captions", requireEpisode, (req, res) => {
  const {id} = req.params;
  const {cut} = req.body ?? {};
  if (!exists(path.join(PUBLIC, "episodes", id, "build.json"))) return res.status(409).json({error: "Build voice first"});
  try {
    const targets = cut ? [String(cut)] : [undefined, ...builtCuts(id)];
    const files = targets.map((c) => ({cut: c ?? null, ...generateCaptions(id, c)}));
    res.json({files, outputs: listOutputs(id)});
  } catch (e) {
    res.status(400).json({error: String(e.message ?? e)});
  }
});

// Publishing kit: the text engine → episodes/<id>/publish.md. ?dryRun=1 returns {system, prompt} instead of calling the model.
app.post("/api/episodes/:id/publish-kit", requireEpisode, (req, res) => {
  const {id} = req.params;
  if (req.query.dryRun) {
    const e = getEngine();
    return res.json({dryRun: true, engine: {name: e.name, model: e.model}, ...buildPublishPrompt(id)});
  }
  const running = activeJobFor(id);
  if (running) return res.status(409).json({error: `A job is already running for ${id}: ${running.label}`, job: publicJob(running)});
  if (!exists(path.join(PUBLIC, "episodes", id, "build.json"))) return res.status(409).json({error: "Build voice first: the kit needs scene timestamps from build.json"});
  res.status(201).json(publicJob(startPublishKitJob(id)));
});

// Publishing decision. Records {plan, date, note} in status.json; a plan other than Hold approves gate 6 for the record. Nothing is posted.
app.post("/api/episodes/:id/publication", requireEpisode, (req, res) => {
  const {id} = req.params;
  const {plan, date = "", note = ""} = req.body ?? {};
  if (!PLANS.includes(plan)) return res.status(400).json({error: `plan must be one of ${PLANS.join(", ")}`});
  if (date && !/^\d{4}-\d{2}-\d{2}$/.test(String(date))) return res.status(400).json({error: "date must be YYYY-MM-DD"});
  const ep = safeJson(path.join(episodeDir(id), "episode.json"));
  const status = readStatus(id, ep);
  status.publication = {plan, date: String(date), note: String(note), decidedAt: new Date().toISOString()};
  status.approvals ??= [];
  if (plan !== "Hold") {
    status.gates.publication = "approved";
    status.approvals.push({gate: "publication", decision: "approved", by: "Hippolyte", at: status.publication.decidedAt, note: `authorized by Hippolyte via Studio — ${plan}${date ? ` on ${date}` : ""}${note ? `: ${note}` : ""}`});
  }
  writeJson(path.join(episodeDir(id), "status.json"), status);
  res.json(status);
});

app.put("/api/episodes/:id/episode", requireEpisode, (req, res) => {
  const {id} = req.params;
  const ep = req.body;
  if (!ep || typeof ep !== "object" || Array.isArray(ep)) return res.status(400).json({error: "Body must be the episode JSON object"});
  if (!Array.isArray(ep.scenes)) return res.status(400).json({error: "episode.scenes must be an array"});
  ep.id = id;
  writeJson(path.join(episodeDir(id), "episode.json"), ep);
  const statusPath = path.join(episodeDir(id), "status.json");
  if (exists(statusPath)) {
    const status = readStatus(id, ep);
    status.title = ep.title ?? status.title;
    status.cuts = (ep.cuts ?? []).map((c) => c.id);
    writeJson(statusPath, status);
  }
  res.json({saved: true, validation: runValidator(id)});
});

app.post("/api/episodes/:id/validate", requireEpisode, (req, res) => res.json(runValidator(req.params.id)));

app.post("/api/episodes/:id/gates/:gate", requireEpisode, (req, res) => {
  const {id, gate} = req.params;
  const {decision, note = ""} = req.body ?? {};
  if (!GATES.includes(gate)) return res.status(400).json({error: `Unknown gate "${gate}"`});
  if (!["approved", "changes", "pending"].includes(decision)) return res.status(400).json({error: 'decision must be "approved", "changes" or "pending"'});
  const ep = safeJson(path.join(episodeDir(id), "episode.json"));
  const status = readStatus(id, ep);
  status.gates[gate] = decision;
  status.approvals ??= [];
  if (decision !== "pending") status.approvals.push({gate, decision, by: "Hippolyte", at: new Date().toISOString(), note: String(note)});
  if (decision === "changes") status.version = (Number(status.version) || 1) + 1;
  writeJson(path.join(episodeDir(id), "status.json"), status);
  res.json(status);
});

app.post("/api/episodes", (req, res) => {
  const b = req.body ?? {};
  const topic = String(b.topic ?? "").trim();
  if (!topic) return res.status(400).json({error: "topic is required"});
  const episode = Number.isInteger(Number(b.episode)) && Number(b.episode) > 0 ? Number(b.episode) : nextEpisodeNumber();
  const id = `ep${String(episode).padStart(3, "0")}`;
  const dir = episodeDir(id);
  const format = FORMATS.includes(b.format) ? b.format : "build";
  const form = {
    id,
    episode,
    topic,
    audience: String(b.audience ?? "").trim() || DEFAULT_AUDIENCE,
    minutes: Number(b.minutes) > 0 ? Number(b.minutes) : format === "short" ? 1.25 : 3.5,
    setting: String(b.setting ?? "").trim(),
    story: String(b.story ?? "").trim(),
    cutSeconds: Number(b.cutSeconds) > 0 ? Number(b.cutSeconds) : 45,
    storyline: String(b.storyline ?? "").trim().slice(0, 8000),
    format,
    auto: b.auto !== false && b.auto !== "false" && b.auto !== 0,
  };
  // ?dryRun=1: return the system and task prompts that would be sent to the engine, create nothing.
  if (req.query.dryRun) {
    const e = getEngine();
    return res.json({dryRun: true, id, form, engine: {name: e.name, model: e.model}, ...buildScriptPrompt(form)});
  }
  if (exists(dir)) return res.status(409).json({error: `${id} already exists`});
  fs.mkdirSync(dir, {recursive: true});
  writeBrief(dir, form);
  const status = defaultStatus(id, topic, format);
  status.auto = form.auto;
  if (form.storyline) status.storyline = form.storyline;
  if (form.setting) status.setting.place = form.setting;
  writeJson(path.join(dir, "status.json"), status);
  // A placeholder episode.json makes the page loadable while the draft is being written.
  writeJson(path.join(dir, "episode.json"), {id, series: "AI With Hippolyte", tagline: "Complex AI. Explained visually. Built practically.", episode, title: topic, disclosure: "Fictional teaching scenario based on researched conditions", background: "workshop", scenes: [], cuts: []});
  const job = startScriptJob(form);
  res.status(201).json({id, job: publicJob(job)});
});

app.post("/api/episodes/:id/jobs", requireEpisode, (req, res) => {
  const {id} = req.params;
  const {kind, cut, preview = false} = req.body ?? {};
  if (!["voice", "preview", "final", "cut"].includes(kind)) return res.status(400).json({error: 'kind must be "voice", "preview", "final" or "cut"'});
  if (kind === "cut" && !cut) return res.status(400).json({error: "cut id is required"});
  const running = activeJobFor(id);
  if (running) return res.status(409).json({error: `A job is already running for ${id}: ${running.label}`, job: publicJob(running)});
  if (kind !== "voice" && !exists(path.join(PUBLIC, "episodes", id, "build.json"))) return res.status(409).json({error: "Build voice first"});
  res.status(201).json(publicJob(startPipelineJob(id, kind, cut, Boolean(preview))));
});

app.get("/api/jobs", (_req, res) => res.json([...jobs.values()].map(publicJob)));

app.get("/api/jobs/:jobId", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({error: "No such job"});
  res.json({...publicJob(job), lines: job.lines});
});

app.post("/api/jobs/:jobId/cancel", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({error: "No such job"});
  if (job.status === "running" && job.abort) {
    job.abort();
    log(job, "Cancelled by user.", "stderr");
  } else if (job.status === "running" && job.child) {
    job.child.kill("SIGTERM");
    log(job, "Cancelled by user.", "stderr");
  }
  res.json(publicJob(job));
});

app.get("/api/jobs/:jobId/stream", (req, res) => {
  const job = jobs.get(req.params.jobId);
  if (!job) return res.status(404).json({error: "No such job"});
  res.writeHead(200, {"Content-Type": "text/event-stream", "Cache-Control": "no-cache", Connection: "keep-alive", "X-Accel-Buffering": "no"});
  res.write(`data: ${JSON.stringify({job: publicJob(job)})}\n\n`);
  for (const entry of job.lines) res.write(`data: ${JSON.stringify(entry)}\n\n`);
  if (job.status !== "running") {
    res.write(`data: ${JSON.stringify({done: true, exitCode: job.exitCode, status: job.status})}\n\n`);
    res.end();
    return;
  }
  job.listeners.add(res);
  const ping = setInterval(() => res.write(": ping\n\n"), 15000);
  req.on("close", () => {
    clearInterval(ping);
    job.listeners.delete(res);
  });
});

// Static files: rendered videos, generated builds/audio, and the built front end.
app.use("/out", express.static(OUT));
app.use("/public", express.static(PUBLIC));
app.use(express.static(PUBLIC)); // staticFile() in the Remotion Player resolves to /episodes/…, /characters/…
if (exists(STUDIO_DIST)) {
  app.use(express.static(STUDIO_DIST));
  app.get(/^\/(?!api\/).*/, (_req, res) => res.sendFile(path.join(STUDIO_DIST, "index.html")));
} else {
  app.get("/", (_req, res) => res.type("text").send("AI Workshop Studio API is running. Start the front end with: npm run studio (dev) or build it with: npm run studio:build"));
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.type === "entity.parse.failed" ? 400 : 500).json({error: err.message ?? String(err)});
});

app.listen(PORT, () => {
  console.log(`AI Workshop Studio API on http://localhost:${PORT} (episodes: ${episodeIds().join(", ") || "none"})`);
  if (exists(STUDIO_DIST)) console.log(`Serving the built front end from studio/dist`);
});


// Wrap the defaults: carry the requested format into episode.json and sanitize values a small model gets wrong.
const EXPR_OK = new Set(["neutral", "happy", "confident", "serious", "confused", "surprised"]);
const GEST_OK = new Set(["neutral", "explain", "point_left", "point_right", "warning"]);
const GEST_MAP = {point: "point_right", pointing: "point_right", left: "point_left", right: "point_right", warn: "warning", alert: "warning", question: "explain", explaining: "explain", talk: "explain", gesture: "explain", wave: "explain", think: "neutral", thinking: "neutral"};
const EXPR_MAP = {smile: "happy", smiling: "happy", excited: "happy", calm: "neutral", worried: "serious", concerned: "serious", stern: "serious", curious: "confused", puzzled: "confused", shocked: "surprised", amazed: "surprised", proud: "confident", sure: "confident"};
const applyEpisodeDefaults = (raw, form) => {
  const ep = applyEpisodeDefaultsBase(raw, form);
  if (form?.format) ep.format = form.format;
  for (const sc of ep.scenes ?? []) {
    sc.characters = (sc.characters ?? []).filter((c) => CAST.includes(c));
    for (const l of sc.lines ?? []) {
      const g = String(l.gesture ?? "neutral").toLowerCase().replace(/[\s-]+/g, "_");
      l.gesture = GEST_OK.has(g) ? g : (GEST_MAP[g] ?? "neutral");
      const x = String(l.expression ?? "neutral").toLowerCase();
      l.expression = EXPR_OK.has(x) ? x : (EXPR_MAP[x] ?? "neutral");
      if (!CAST.includes(l.speaker)) l.speaker = "tanyi";
      if (typeof l.text === "string") l.text = l.text.replace(/[*_#`]/g, "").trim();
    }
    if (sc.lines?.length && !sc.characters.length) sc.characters = [...new Set(sc.lines.map((l) => l.speaker))].slice(0, 3);
  }
  return ep;
};
