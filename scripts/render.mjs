// Usage: node scripts/render.mjs ep001 [--format landscape|portrait|both] [--preview]
import {spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {PUBLIC, ROOT, parseArgs} from "./lib.mjs";

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id) {
  console.error("Usage: node scripts/render.mjs <episodeId> [--format landscape|portrait|both] [--preview] [--cut <id>]");
  process.exit(1);
}
if (!fs.existsSync(path.join(PUBLIC, "episodes", id, "build.json"))) {
  console.error(`No build for ${id}. Run: npm run voice ${id}`);
  process.exit(1);
}
const cut = args.cut;
if (cut && !fs.existsSync(path.join(PUBLIC, "episodes", id, `build.${cut}.json`))) {
  console.error(`No build for cut "${cut}". Add it to episode.json "cuts" and run: npm run voice ${id}`);
  process.exit(1);
}
const format = args.format ?? (cut ? "portrait" : "landscape");
const targets = format === "both" ? ["landscape", "portrait"] : [format];
const outDir = path.join(ROOT, "out", id);
fs.mkdirSync(outDir, {recursive: true});

for (const f of targets) {
  const comp = f === "portrait" ? "Portrait" : "Landscape";
  const suffix = f === "portrait" ? "9x16" : "16x9";
  const out = path.join(outDir, `${id}${cut ? "-" + cut : ""}-${suffix}${args.preview ? "-preview" : ""}.mp4`);
  const cmd = [
    "remotion", "render", "src/index.ts", comp, out,
    `--props=${JSON.stringify(cut ? {episodeId: id, cut} : {episodeId: id})}`,
    ...(args.preview ? ["--scale=0.5", "--crf=30"] : ["--crf=18"]),
    "--log=warn",
  ];
  console.log(`Rendering ${comp} → ${path.relative(ROOT, out)}`);
  const r = spawnSync("npx", cmd, {cwd: ROOT, stdio: "inherit"});
  if (r.status !== 0) process.exit(r.status ?? 1);
}
