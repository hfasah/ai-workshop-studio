import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
export const EPISODES = path.join(ROOT, "episodes");
export const PUBLIC = path.join(ROOT, "public");
export const CHARACTERS = JSON.parse(fs.readFileSync(path.join(ROOT, "characters", "characters.json"), "utf8"));

export const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
export const writeJson = (p, v) => {
  fs.mkdirSync(path.dirname(p), {recursive: true});
  fs.writeFileSync(p, JSON.stringify(v, null, 2));
};

export const episodePath = (id) => path.join(EPISODES, id, "episode.json");

export const loadEpisode = (id) => {
  const p = episodePath(id);
  if (!fs.existsSync(p)) {
    console.error(`No episode found at ${p}`);
    process.exit(1);
  }
  return readJson(p);
};

export const parseArgs = (argv) => {
  const args = {_: []};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const [k, v] = a.slice(2).split("=");
      if (v !== undefined) args[k] = v;
      else if (argv[i + 1] && !argv[i + 1].startsWith("--")) args[k] = argv[++i];
      else args[k] = true;
    } else args._.push(a);
  }
  return args;
};
