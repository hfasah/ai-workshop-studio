// Writes the per-platform publishing kit (titles, descriptions, hashtags, tags) for one episode with the text engine.
// Usage: node scripts/kit.mjs ep101 [--force]   (skips episodes whose kit is newer than episode.json unless --force)
// Same code path as the Studio's automatic kit stage; used by the CLI pipeline and by hand.
import fs from "node:fs";
import path from "node:path";
import {EPISODES, parseArgs, readJson, writeJson} from "./lib.mjs";
import {generate, getEngine} from "./llm.mjs";
import * as pub from "./publish.mjs";

export const kitIsCurrent = (id) => {
  const kitPath = path.join(EPISODES, id, "publish.json");
  const epPath = path.join(EPISODES, id, "episode.json");
  if (!fs.existsSync(kitPath)) return false;
  return fs.statSync(kitPath).mtimeMs >= fs.statSync(epPath).mtimeMs;
};

// Generates and writes the kit. Returns the kit, or null when it was skipped as current. Throws on model failure.
export const buildKit = async (id, {force = false, onLog = () => {}} = {}) => {
  if (!force && kitIsCurrent(id)) {
    onLog(`Kit for ${id} is newer than episode.json, skipped (use --force to rewrite).`);
    return null;
  }
  const engine = getEngine();
  onLog(`Writing episodes/${id}/publish.json (YouTube, Shorts, Instagram, Facebook, TikTok, LinkedIn) with ${engine.name === "ollama" ? `Ollama ${engine.model} (local, $0)` : "Claude CLI (metered)"}…`);
  const {system, prompt, context} = pub.kitPrompt(id);
  const a = await generate({system, prompt, json: true, maxTokens: 4096, onLog});
  if (!a.json || typeof a.json !== "object") throw new Error(`The model did not return a JSON object:\n${String(a.text ?? "").slice(0, 500)}`);
  const kit = pub.finalizeKit(a.json, context);
  const missing = ["youtube", "shorts", "instagram", "facebook", "tiktok", "linkedin"].filter((k) => !a.json[k]);
  if (missing.length) onLog(`The model skipped ${missing.join(", ")}; those sections were filled with fallbacks. Edit them in the Publish tab.`);
  pub.writeKit(id, kit, {engine: a.engine, model: a.model});
  const statusPath = path.join(EPISODES, id, "status.json");
  if (fs.existsSync(statusPath)) {
    const status = readJson(statusPath);
    status.cost ??= {};
    status.cost.publish_usd = Math.round(((status.cost.publish_usd ?? 0) + (a.costUsd ?? 0)) * 10000) / 10000;
    writeJson(statusPath, status);
  }
  onLog(`Wrote episodes/${id}/publish.json and publish.md. Titles: ${kit.youtube.titles.map((t) => `"${t}"`).join(" · ")}. Cost: ${a.engine === "ollama" ? "$0.00 (local)" : `$${(a.costUsd ?? 0).toFixed(2)}`}`);
  return kit;
};

const isMain = process.argv[1] && path.resolve(process.argv[1]) === path.resolve(new URL(import.meta.url).pathname);
if (isMain) {
  const args = parseArgs(process.argv.slice(2));
  const id = args._[0];
  if (!id) {
    console.error("Usage: node scripts/kit.mjs <episodeId> [--force]");
    process.exit(1);
  }
  if (!fs.existsSync(path.join(EPISODES, id, "episode.json"))) {
    console.error(`No episode at episodes/${id}/episode.json`);
    process.exit(1);
  }
  buildKit(id, {force: Boolean(args.force), onLog: (l) => console.log(l)}).catch((e) => {
    console.error(String(e.message ?? e));
    process.exit(1);
  });
}
