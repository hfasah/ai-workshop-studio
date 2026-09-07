// Renders the YouTube thumbnail for an episode from the Thumbnail composition: out/<id>/<id>-thumb.jpg (1280x720, < 2 MB).
// Usage: node scripts/thumbnail.mjs ep101 [--text "Four big words"] [--illustration truck] [--png]
// Words: --text, else publish.json thumbnailText, else the episode title. Kicker: course + lesson, else "Episode N".
import fs from "node:fs";
import path from "node:path";
import {spawnSync} from "node:child_process";
import {EPISODES, ROOT, loadEpisode, parseArgs, readJson} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id) {
  console.error('Usage: node scripts/thumbnail.mjs <episodeId> [--text "…"] [--illustration name] [--png]');
  process.exit(1);
}
const ep = loadEpisode(id);
const kitPath = path.join(EPISODES, id, "publish.json");
const kit = fs.existsSync(kitPath) ? readJson(kitPath) : null;
// Headline: --text, else the kit's thumbnail text, else the title. The small line under it is the title, or the series
// when the headline already is the title.
const headline = String(args.text ?? kit?.thumbnailText ?? ep.title ?? id).trim();
const course = ep.course ? String(ep.course).replace(/^Series \d+:\s*/i, "") : "";
const kicker = course && ep.lesson ? `${course} · Lesson ${ep.lesson}` : `Episode ${ep.episode ?? id.replace(/\D/g, "")}`;
const subline = headline.replace(/[?!.]$/, "").toLowerCase() === String(ep.title ?? "").replace(/[?!.]$/, "").toLowerCase() ? `${ep.series ?? "AI With Hippolyte"} · ${ep.course ?? "The AI Workshop"}` : ep.title ?? id;
const firstIll = (ep.scenes ?? []).map((s) => s.onScreen?.illustration).find(Boolean);
const illustration = args.illustration ?? firstIll ?? "robot";
const outDir = path.join(ROOT, "out", id);
fs.mkdirSync(outDir, {recursive: true});
const png = Boolean(args.png);
const out = path.join(outDir, `${id}-thumb.${png ? "png" : "jpg"}`);
const props = {episodeId: id, headline, kicker, title: subline, illustration};
const cmd = ["remotion", "still", "src/index.ts", "Thumbnail", out, "--frame=40", `--props=${JSON.stringify(props)}`, "--scale=0.6667", ...(png ? [] : ["--image-format=jpeg", "--jpeg-quality=92"]), "--log=warn"];
console.log(`Thumbnail ${id}: "${headline}" · ${kicker} · ${illustration}`);
const r = spawnSync("npx", cmd, {cwd: ROOT, stdio: "inherit", shell: process.platform === "win32"});
if (r.status !== 0) process.exit(r.status ?? 1);
const size = fs.statSync(out).size;
console.log(`Wrote ${path.relative(ROOT, out)} (${Math.round(size / 1024)} KB)`);
if (size > 2 * 1024 * 1024) console.warn("Warning: over YouTube's 2 MB thumbnail limit.");
