// Generates episodes/<slug>/episode.json from a topic using the Claude Code CLI (no API key needed).
// Usage: node scripts/script.mjs "Why AI Hallucinates" --episode 5 [--slug ep005] [--minutes 3]
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {CHARACTERS, EPISODES, ROOT, parseArgs, writeJson} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const topic = args._.join(" ");
if (!topic) {
  console.error('Usage: node scripts/script.mjs "<topic>" --episode N [--slug epNNN] [--minutes 3]');
  process.exit(1);
}
const episodeNo = Number(args.episode ?? 0);
const slug = args.slug ?? (episodeNo ? `ep${String(episodeNo).padStart(3, "0")}` : topic.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40));
const minutes = Number(args.minutes ?? 3);
const bible = fs.readFileSync(path.join(ROOT, "SERIES.md"), "utf8");
const example = fs.readFileSync(path.join(EPISODES, "ep001", "episode.json"), "utf8");
const cast = Object.entries(CHARACTERS).map(([id, c]) => `- ${id}: ${c.name} — ${c.role}`).join("\n");

const prompt = `You are the head writer for the animated AI education series described below.

${bible}

CAST (use these ids as "speaker"):
${cast}

TASK: Write episode ${episodeNo || "(next)"} titled or about: "${topic}".
Target spoken length: about ${minutes} minutes (roughly ${Math.round(minutes * 140)} spoken words).
Follow the episode format from the series bible (hook, problem, visual explanation, practical example, safety lesson, action step, signature closing).

OUTPUT FORMAT: Return ONLY a JSON object, no markdown fences, no commentary, matching exactly the structure of this example episode file:
${example}

Rules:
- "id" must be "${slug}", "episode" must be ${episodeNo || 0}.
- Scene "type" must be one of: title, statement, bullets, steps, compare, dialogue, screen, code, outro.
- Every line has speaker, text, expression (neutral|happy|confident|serious|confused|surprised) and gesture (neutral|explain|point_left|point_right|warning).
- Spoken text must be plain English, no markdown, numbers written as words when they are spoken.
- Include at least one African or global business example.
- End with the signature closing spoken by tanyi.`;

console.log(`Asking Claude for "${topic}" → episodes/${slug}/episode.json ...`);
const r = spawnSync("claude", ["-p", prompt, "--output-format", "json"], {encoding: "utf8", maxBuffer: 50 * 1024 * 1024});
if (r.status !== 0) {
  console.error(r.stderr || r.stdout);
  process.exit(1);
}
const envelope = JSON.parse(r.stdout);
const text = envelope.result ?? "";
const start = text.indexOf("{");
const end = text.lastIndexOf("}");
if (start < 0 || end < 0) {
  console.error("Claude did not return JSON:\n", text.slice(0, 500));
  process.exit(1);
}
const episode = JSON.parse(text.slice(start, end + 1));
episode.id = slug;
const out = path.join(EPISODES, slug, "episode.json");
if (fs.existsSync(out) && !args.force) {
  console.error(`${out} exists. Use --force to overwrite.`);
  process.exit(1);
}
writeJson(out, episode);
console.log(`Wrote ${path.relative(ROOT, out)} (${episode.scenes.length} scenes). Cost: $${(envelope.total_cost_usd ?? 0).toFixed(2)}`);
console.log(`Next: npm run voice ${slug} && npm run render ${slug} -- --format both`);
