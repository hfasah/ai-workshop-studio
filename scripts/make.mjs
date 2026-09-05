// One-shot: voice + render. Usage: node scripts/make.mjs ep001 [--format both] [--preview]
import {spawnSync} from "node:child_process";
import {ROOT} from "./lib.mjs";
const argv = process.argv.slice(2);
const id = argv[0];
const run = (script, extra) => {
  const r = spawnSync("node", [`scripts/${script}`, id, ...extra], {cwd: ROOT, stdio: "inherit"});
  if (r.status !== 0) process.exit(r.status ?? 1);
};
run("voice.mjs", argv.slice(1).filter((a) => a === "--force"));
run("render.mjs", argv.slice(1).filter((a) => a !== "--force"));
