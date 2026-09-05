// Turns episodes/<id>/episode.json into public/episodes/<id>/build.json + per-line audio.
// Usage: node scripts/voice.mjs ep001 [--force]
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";
import {spawnSync} from "node:child_process";
import {ROOT} from "./lib.mjs";
import {Input, ALL_FORMATS, FilePathSource} from "mediabunny";
import {CHARACTERS, PUBLIC, loadEpisode, parseArgs, writeJson, readJson} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id) {
  console.error("Usage: node scripts/voice.mjs <episodeId> [--force]");
  process.exit(1);
}
const episode = loadEpisode(id);
const outDir = path.join(PUBLIC, "episodes", id);
const audioDir = path.join(outDir, "audio");
fs.mkdirSync(audioDir, {recursive: true});

const SHORT = episode.format === "short";
// Shorts are cut tight: less air between lines and scenes, no long holds.
const LINE_GAP_MS = SHORT ? 220 : 350;
const SCENE_GAP_MS = SHORT ? 380 : 700;
const SCENE_LEAD_MS = SHORT ? 200 : 400;
const MIN_SCENE_MS = SHORT ? 1500 : 2500;
const FPS = 30;

const ttsCache = new Map();
const getTts = async (voice) => {
  if (ttsCache.has(voice)) return ttsCache.get(voice);
  const tts = new MsEdgeTTS();
  await tts.setMetadata(voice, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3, {
    wordBoundaryEnabled: true,
    sentenceBoundaryEnabled: false,
  });
  ttsCache.set(voice, tts);
  return tts;
};

const durationMs = async (file) => {
  const input = new Input({formats: ALL_FORMATS, source: new FilePathSource(file)});
  const s = await input.computeDuration();
  return Math.round(s * 1000);
};

// Re-attach punctuation from the original text to the TTS word boundaries.
const alignWords = (text, boundaries, totalMs) => {
  const tokens = text.split(/\s+/).filter(Boolean);
  const strip = (s) => s.replace(/[^\p{L}\p{N}']/gu, "").toLowerCase();
  const words = [];
  if (boundaries.length === tokens.length) {
    return tokens.map((tok, i) => ({text: tok, startMs: boundaries[i].startMs, endMs: boundaries[i].endMs}));
  }
  let b = 0;
  for (let i = 0; i < tokens.length; i++) {
    const tok = tokens[i];
    const clean = strip(tok);
    // find next boundary whose text matches the start of this token
    let match = null;
    for (let j = b; j < Math.min(boundaries.length, b + 3); j++) {
      const bt = strip(boundaries[j].text);
      if (bt && (clean.startsWith(bt) || bt.startsWith(clean))) {
        match = boundaries[j];
        b = j + 1;
        break;
      }
    }
    if (match) {
      words.push({text: tok, startMs: match.startMs, endMs: match.endMs});
    } else {
      // fall back: interpolate between neighbours
      const prevEnd = words.length ? words[words.length - 1].endMs : 0;
      const nextStart = boundaries[b]?.startMs ?? totalMs;
      words.push({text: tok, startMs: prevEnd, endMs: Math.max(prevEnd + 120, nextStart)});
    }
  }
  return words;
};

const escapeXml = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

// Spoken-only substitutions (captions keep the original spelling). Configured in characters.json under "_pronunciations".
const PRON = CHARACTERS._pronunciations ?? {};
const spoken = (text) => Object.entries(PRON).reduce((t, [word, say]) => t.replace(new RegExp(`\\b${word}\\b`, "g"), say), text);

const lineParams = (line) => {
  const ch = CHARACTERS[line.speaker];
  if (!ch) throw new Error(`Unknown speaker "${line.speaker}" — add it to characters/characters.json`);
  const engine = line.engine ?? ch.engine ?? "edge";
  if (engine === "f5") {
    const refText = fs.readFileSync(path.join(PUBLIC, ch.ref.text), "utf8").trim();
    const speed = line.speed ?? ch.ref.speed ?? 1;
    const hash = crypto.createHash("sha1").update(JSON.stringify({engine, ref: ch.ref.audio, refText, speed, text: line.text})).digest("hex").slice(0, 10);
    return {engine, ch, refText, speed, hash, ext: "wav"};
  }
  const voice = line.voice ?? ch.voice;
  const rate = line.rate ?? ch.rate ?? 1;
  const pitch = line.pitch ?? ch.pitch ?? "+0Hz";
  const hash = crypto.createHash("sha1").update(JSON.stringify({voice, rate, pitch, text: spoken(line.text)})).digest("hex").slice(0, 10);
  return {engine, ch, voice, rate, pitch, hash, ext: "mp3"};
};

// Cloned voices (F5-TTS, local) are slow per call, so all uncached lines run in one Python process.
const cloneBatch = async () => {
  const jobsByChar = new Map();
  for (const scene of episode.scenes) {
    for (const [li, line] of (scene.lines ?? []).entries()) {
      if (line.audio) continue;
      const p = lineParams(line);
      if (p.engine !== "f5") continue;
      const key = `${scene.id}-${li}`;
      const out = path.join(audioDir, `${key}-${p.hash}.wav`);
      if (!args.force && fs.existsSync(out) && fs.existsSync(out.replace(/\.wav$/, ".json"))) continue;
      if (!jobsByChar.has(line.speaker)) jobsByChar.set(line.speaker, {ref_audio: path.join(PUBLIC, p.ch.ref.audio), ref_text: p.refText, speed: p.speed, jobs: []});
      jobsByChar.get(line.speaker).jobs.push({text: line.text, out});
    }
  }
  for (const [speaker, spec] of jobsByChar) {
    console.log(`Cloning ${spec.jobs.length} line(s) for ${speaker} with F5-TTS (local, slow)…`);
    const jobFile = path.join(audioDir, `.jobs-${speaker}.json`);
    writeJson(jobFile, spec);
    const r = spawnSync(path.join(ROOT, ".venv", "bin", "python"), [path.join(ROOT, "scripts", "tts_clone.py"), jobFile], {stdio: ["ignore", "inherit", "pipe"], encoding: "utf8"});
    if (r.status !== 0) {
      console.error(r.stderr.split("\n").filter((l) => !/Warning|re_/.test(l)).slice(-15).join("\n"));
      throw new Error("voice cloning failed");
    }
    for (const j of spec.jobs) {
      const w = readJson(`${j.out}.whisper.json`);
      const total = await durationMs(j.out);
      const words = alignWords(j.text, w.words, total);
      writeJson(j.out.replace(/\.wav$/, ".json"), {durationMs: total, words, heard: w.transcript});
      fs.rmSync(`${j.out}.whisper.json`, {force: true});
    }
    fs.rmSync(jobFile, {force: true});
  }
};

const synthesize = async (line, key) => {
  const p = lineParams(line);
  const out = path.join(audioDir, `${key}-${p.hash}.${p.ext}`);
  const meta = path.join(audioDir, `${key}-${p.hash}.json`);
  if (!args.force && fs.existsSync(out) && fs.existsSync(meta)) {
    return {file: out, ...readJson(meta)};
  }
  if (p.engine === "f5") throw new Error(`Missing cloned audio for ${key}; cloneBatch should have produced it`);
  const {voice, rate, pitch} = p;
  const mp3 = out;
  const tts = await getTts(voice);
  const tmp = fs.mkdtempSync(path.join(audioDir, ".tts-"));
  const {audioFilePath, metadataFilePath} = await tts.toFile(tmp, escapeXml(spoken(line.text)), {rate, pitch});
  fs.renameSync(audioFilePath, mp3);
  const raw = readJson(metadataFilePath);
  fs.rmSync(tmp, {recursive: true, force: true});
  const boundaries = raw.Metadata.filter((m) => m.Type === "WordBoundary").map((m) => ({
    text: m.Data.text.Text,
    startMs: Math.round(m.Data.Offset / 10000),
    endMs: Math.round((m.Data.Offset + m.Data.Duration) / 10000),
  }));
  const total = await durationMs(mp3);
  const words = alignWords(line.text, boundaries, total);
  const info = {durationMs: total, words};
  writeJson(meta, info);
  return {file: mp3, ...info};
};

const useRecorded = async (line) => {
  // line.audio: path relative to public/, e.g. "episodes/ep001/recorded/hook-0.mp3"
  const file = path.join(PUBLIC, line.audio);
  if (!fs.existsSync(file)) throw new Error(`Recorded audio not found: ${file}`);
  const total = await durationMs(file);
  const wordsFile = file.replace(/\.[a-z0-9]+$/i, ".words.json");
  let words;
  if (fs.existsSync(wordsFile)) {
    words = readJson(wordsFile);
  } else {
    // No timings: spread words evenly so captions still work.
    const tokens = line.text.split(/\s+/).filter(Boolean);
    const per = total / tokens.length;
    words = tokens.map((t, i) => ({text: t, startMs: Math.round(i * per), endMs: Math.round((i + 1) * per)}));
  }
  return {file, durationMs: total, words};
};

const characterPacks = () => {
  const packs = {};
  for (const [cid, ch] of Object.entries(CHARACTERS)) {
    if (cid.startsWith("_")) continue;
    const dir = path.join(PUBLIC, "characters", cid);
    const files = fs.existsSync(dir)
      ? fs.readdirSync(dir, {recursive: true}).filter((f) => /\.(png|svg|webp)$/i.test(f)).map((f) => f.replaceAll(path.sep, "/"))
      : [];
    packs[cid] = {...ch, id: cid, files};
  }
  return packs;
};

await cloneBatch();

let cursor = 0;
const scenes = [];
const captions = [];
console.log(`Building ${id}: ${episode.title}`);
for (const [si, scene] of episode.scenes.entries()) {
  const sceneStart = cursor;
  let t = sceneStart + SCENE_LEAD_MS;
  const lines = [];
  for (const [li, line] of (scene.lines ?? []).entries()) {
    const key = `${scene.id}-${li}`;
    const r = line.audio ? await useRecorded(line) : await synthesize(line, key);
    const rel = path.relative(PUBLIC, r.file).replaceAll(path.sep, "/");
    lines.push({
      ...line,
      audio: rel,
      startMs: t,
      durationMs: r.durationMs,
      words: r.words,
    });
    for (const w of r.words) {
      captions.push({
        text: (captions.length ? " " : "") + w.text,
        startMs: t + w.startMs,
        endMs: t + w.endMs,
        timestampMs: t + Math.round((w.startMs + w.endMs) / 2),
        confidence: null,
        speaker: line.speaker,
      });
    }
    t += r.durationMs + LINE_GAP_MS;
    process.stdout.write(`  ${key} ${line.speaker} ${(r.durationMs / 1000).toFixed(1)}s\n`);
  }
  const sceneEnd = Math.max(t - LINE_GAP_MS + SCENE_GAP_MS, sceneStart + (scene.minMs ?? MIN_SCENE_MS));
  scenes.push({...scene, index: si, startMs: sceneStart, durationMs: sceneEnd - sceneStart, lines});
  cursor = sceneEnd;
}

const build = {
  id,
  fps: FPS,
  builtAt: new Date().toISOString(),
  episode: {...episode, scenes: undefined},
  totalMs: cursor,
  scenes,
  captions,
  characters: characterPacks(),
};
writeJson(path.join(outDir, "build.json"), build);
console.log(`Done. ${(cursor / 1000).toFixed(1)}s total → public/episodes/${id}/build.json`);

// Cutdowns: re-time a subset of scenes (same audio, same words) into build.<cut>.json
for (const cut of episode.cuts ?? []) {
  const chosen = cut.scenes.map((sid) => scenes.find((s) => s.id === sid)).filter(Boolean);
  if (chosen.length !== cut.scenes.length) console.warn(`  cut ${cut.id}: unknown scene id in ${JSON.stringify(cut.scenes)}`);
  let t = 0;
  const cutScenes = [];
  const cutCaptions = [];
  for (const [i, sc] of chosen.entries()) {
    const shift = t - sc.startMs;
    const lines = sc.lines.map((l) => ({...l, startMs: l.startMs + shift}));
    cutScenes.push({...sc, index: i, startMs: t, lines});
    for (const l of lines) {
      for (const w of l.words) {
        cutCaptions.push({text: (cutCaptions.length ? " " : "") + w.text, startMs: l.startMs + w.startMs, endMs: l.startMs + w.endMs, timestampMs: l.startMs + Math.round((w.startMs + w.endMs) / 2), confidence: null, speaker: l.speaker});
      }
    }
    t += sc.durationMs;
  }
  const cutBuild = {...build, cut: cut.id, totalMs: t, scenes: cutScenes, captions: cutCaptions};
  writeJson(path.join(outDir, `build.${cut.id}.json`), cutBuild);
  const target = cut.targetSec ? ` (target ${cut.targetSec}s)` : "";
  console.log(`  cut ${cut.id}: ${(t / 1000).toFixed(1)}s${target} → build.${cut.id}.json`);
}
