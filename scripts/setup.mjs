// One-command setup for a fresh machine. Usage: npm run setup   (or: node scripts/setup.mjs --check)
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import {fileURLToPath} from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const ok = (m) => console.log(`  ✓ ${m}`);
const warn = (m) => console.log(`  ! ${m}`);
const bad = (m) => console.log(`  ✗ ${m}`);
const has = (cmd) => spawnSync(process.platform === "win32" ? "where" : "which", [cmd], {encoding: "utf8"}).status === 0;
const run = (cmd, args, opts = {}) => spawnSync(cmd, args, {stdio: "inherit", cwd: ROOT, shell: process.platform === "win32", ...opts});
const fetchJson = async (url) => { try { const r = await fetch(url); return r.ok ? await r.json() : null; } catch { return null; } };

console.log(`\nAI Workshop Studio setup (${os.platform()} ${os.arch()}, Node ${process.version})\n`);
let problems = 0;

// 1. Node
const major = Number(process.version.slice(1).split(".")[0]);
if (major >= 20) ok(`Node ${process.version}`); else { bad(`Node 20 or newer is required (found ${process.version}). Install from https://nodejs.org`); problems++; }

// 2. Dependencies
const need = (dir) => !fs.existsSync(path.join(ROOT, dir, "node_modules"));
if (checkOnly) {
  need(".") ? warn("root dependencies not installed (npm install)") : ok("root dependencies installed");
  need("studio") ? warn("studio dependencies not installed (npm install --prefix studio)") : ok("studio dependencies installed");
} else {
  if (need(".")) { console.log("Installing renderer dependencies…"); if (run("npm", ["install"]).status !== 0) problems++; } else ok("root dependencies installed");
  if (need("studio")) { console.log("Installing Studio dependencies…"); if (run("npm", ["install", "--prefix", "studio"]).status !== 0) problems++; } else ok("studio dependencies installed");
  if (!fs.existsSync(path.join(ROOT, "studio", "dist"))) { console.log("Building the Studio front end…"); if (run("npm", ["run", "build", "--prefix", "studio"]).status !== 0) problems++; } else ok("studio front end built");
}

// 3. Local model (free drafting)
const tags = await fetchJson("http://localhost:11434/api/tags");
const settings = fs.existsSync(path.join(ROOT, "studio", "settings.json")) ? JSON.parse(fs.readFileSync(path.join(ROOT, "studio", "settings.json"), "utf8")) : {ollamaModel: "qwen2.5:14b"};
const model = settings.ollamaModel ?? "qwen2.5:14b";
if (tags) {
  const present = (tags.models ?? []).some((m) => m.name === model || m.name.startsWith(model.split(":")[0]));
  if (present) ok(`Ollama running with ${model} (free script drafting)`);
  else if (checkOnly) warn(`Ollama running but ${model} is missing: ollama pull ${model}`);
  else { console.log(`Pulling ${model} (about 9 GB, once)…`); run("ollama", ["pull", model]); }
} else if (has("ollama")) {
  warn("Ollama is installed but not running. Start it with: ollama serve   (then rerun npm run setup to pull the model)");
} else {
  warn("Ollama not found. Free local drafting needs it: https://ollama.com/download  then: ollama pull " + model + "\n    Without it, the Studio can use the Claude CLI engine (needs a Claude account) or you can write episode.json by hand.");
}

// 4. Optional tools
has("ffmpeg") ? ok("ffmpeg found (used for audio checks; rendering does not need it)") : warn("ffmpeg not found (optional): https://ffmpeg.org/download.html");
has("claude") ? ok("Claude CLI found (optional engine)") : warn("Claude CLI not found (optional): the local engine is the default");

// 5. Sanity: an episode exists
const eps = fs.existsSync(path.join(ROOT, "episodes")) ? fs.readdirSync(path.join(ROOT, "episodes")).filter((d) => fs.existsSync(path.join(ROOT, "episodes", d, "episode.json"))) : [];
ok(`${eps.length} episode(s) in episodes/: ${eps.join(", ")}`);

console.log(problems ? `\nSetup finished with ${problems} problem(s). Fix them and rerun: npm run setup\n` : `\nReady. Start the Studio with: npm start   → http://localhost:4600\nFirst run of an episode builds its voices; the first render downloads a headless Chrome once.\n`);
process.exit(problems ? 1 : 0);
