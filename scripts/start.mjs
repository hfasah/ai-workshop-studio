// Starts the Studio (API + built front end) and opens the browser. Usage: npm start
import {spawn, spawnSync} from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import {fileURLToPath} from "node:url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
if (!fs.existsSync(path.join(ROOT, "studio", "dist"))) {
  console.log("Studio front end not built yet, building…");
  if (spawnSync("npm", ["run", "build", "--prefix", "studio"], {stdio: "inherit", cwd: ROOT, shell: process.platform === "win32"}).status !== 0) process.exit(1);
}
const port = process.env.PORT || "4600";
const api = spawn(process.execPath, [path.join(ROOT, "scripts", "api.mjs")], {stdio: "inherit", cwd: ROOT, env: {...process.env, PORT: port}});
setTimeout(() => {
  const url = `http://localhost:${port}`;
  const opener = process.platform === "darwin" ? "open" : process.platform === "win32" ? "cmd" : "xdg-open";
  const args = process.platform === "win32" ? ["/c", "start", "", url] : [url];
  try { spawn(opener, args, {stdio: "ignore", detached: true}).unref(); } catch {}
  console.log(`\nAI Workshop Studio → ${url}\n`);
}, 1500);
api.on("exit", (c) => process.exit(c ?? 0));
