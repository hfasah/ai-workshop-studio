// Writes SubRip (.srt) and WebVTT (.vtt) caption files from a voice build.
// Usage: node scripts/captions.mjs <episodeId> [--cut <cutId>]
// Reads public/episodes/<id>/build.json (or build.<cut>.json) and writes out/<id>/<id>[-<cut>]-captions.srt and .vtt.
// Cues: lines of at most 42 characters, at most two lines, at most 3.5 s, and a new cue whenever the speaker changes.
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
import {CHARACTERS, PUBLIC, ROOT, parseArgs, readJson} from "./lib.mjs";

export const MAX_LINE_CHARS = 42;
export const MAX_LINES = 2;
export const MAX_CUE_MS = 3500;
const MIN_CUE_MS = 600; // a cue shorter than this is stretched (without overlapping the next one)
const SILENCE_BREAK_MS = 1200; // a pause longer than this ends the cue, so captions do not hang over silence

// Splits text into at most MAX_LINES lines of at most MAX_LINE_CHARS, balanced around the middle. Returns null when it does not fit.
export const wrapLines = (text) => {
  if (text.length <= MAX_LINE_CHARS) return [text];
  if (MAX_LINES < 2) return null;
  const words = text.split(" ");
  let best = null;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" ");
    const b = words.slice(i).join(" ");
    if (a.length > MAX_LINE_CHARS || b.length > MAX_LINE_CHARS) continue;
    const score = Math.abs(a.length - b.length);
    if (!best || score < best.score) best = {score, lines: [a, b]};
  }
  return best?.lines ?? null;
};

// Groups word-level captions ({text, startMs, endMs, speaker}) into cues ({startMs, endMs, speaker, lines}).
export const buildCues = (words) => {
  const cues = [];
  let cur = null;
  const flush = () => {
    if (cur && cur.words.length) cues.push({startMs: cur.startMs, endMs: cur.endMs, speaker: cur.speaker, lines: wrapLines(cur.words.join(" "))});
    cur = null;
  };
  for (const w of words) {
    const text = String(w.text ?? "").trim();
    if (!text) continue;
    if (cur) {
      const joined = [...cur.words, text].join(" ");
      const prev = cur.words[cur.words.length - 1];
      const sentenceEnd = /[.!?]["')]?$/.test(prev) && joined.length > MAX_LINE_CHARS * 0.6;
      const tooLong = w.endMs - cur.startMs > MAX_CUE_MS;
      const silence = w.startMs - cur.endMs > SILENCE_BREAK_MS;
      if (w.speaker !== cur.speaker || tooLong || silence || sentenceEnd || !wrapLines(joined)) flush();
    }
    if (!cur) cur = {startMs: w.startMs, endMs: w.endMs, speaker: w.speaker, words: []};
    cur.words.push(text);
    cur.endMs = Math.max(cur.endMs, w.endMs);
  }
  flush();
  // Stretch very short cues, never past the next cue's start.
  for (let i = 0; i < cues.length; i++) {
    const next = cues[i + 1];
    const wanted = cues[i].startMs + MIN_CUE_MS;
    if (cues[i].endMs < wanted) cues[i].endMs = next ? Math.min(wanted, next.startMs) : wanted;
  }
  return cues;
};

const pad = (n, w = 2) => String(n).padStart(w, "0");
export const timestamp = (ms, sep) => {
  const h = Math.floor(ms / 3600000);
  const m = Math.floor((ms % 3600000) / 60000);
  const s = Math.floor((ms % 60000) / 1000);
  return `${pad(h)}:${pad(m)}:${pad(s)}${sep}${pad(ms % 1000, 3)}`;
};

export const toSrt = (cues) => cues.map((c, i) => `${i + 1}\n${timestamp(c.startMs, ",")} --> ${timestamp(c.endMs, ",")}\n${c.lines.join("\n")}\n`).join("\n");

export const toVtt = (cues, speakerName = (s) => s) =>
  `WEBVTT\n\n${cues.map((c) => `${timestamp(c.startMs, ".")} --> ${timestamp(c.endMs, ".")}\n<v ${speakerName(c.speaker)}>${c.lines.join("\n")}\n`).join("\n")}`;

// Generates both files for one build. Returns {srt, vtt, cues} with paths relative to the repo root.
export const generateCaptions = (id, cut) => {
  const buildFile = path.join(PUBLIC, "episodes", id, cut ? `build.${cut}.json` : "build.json");
  if (!fs.existsSync(buildFile)) throw new Error(`No build at ${path.relative(ROOT, buildFile)}. Run: npm run voice ${id}`);
  const build = readJson(buildFile);
  const cues = buildCues(build.captions ?? []);
  const outDir = path.join(ROOT, "out", id);
  fs.mkdirSync(outDir, {recursive: true});
  const base = path.join(outDir, `${id}${cut ? `-${cut}` : ""}-captions`);
  const name = (s) => CHARACTERS[s]?.name ?? s;
  fs.writeFileSync(`${base}.srt`, toSrt(cues));
  fs.writeFileSync(`${base}.vtt`, toVtt(cues, name));
  return {srt: path.relative(ROOT, `${base}.srt`), vtt: path.relative(ROOT, `${base}.vtt`), cues: cues.length, totalMs: build.totalMs};
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const id = args._[0];
  if (!id) {
    console.error("Usage: node scripts/captions.mjs <episodeId> [--cut <cutId>]");
    process.exit(1);
  }
  try {
    const r = generateCaptions(id, typeof args.cut === "string" ? args.cut : undefined);
    console.log(`Wrote ${r.srt} and ${r.vtt} (${r.cues} cues, ${(r.totalMs / 1000).toFixed(1)}s)`);
  } catch (e) {
    console.error(e.message ?? e);
    process.exit(1);
  }
}
