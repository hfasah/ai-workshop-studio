// Uploads one episode's final to the connected YouTube channel as a PRIVATE video, with the title, description and
// tags from its publishing kit. Proves the connection end to end without publishing anything.
// Usage: node scripts/yt-private-upload.mjs ep101 [--shorts]   (--shorts uploads the short1 9:16 cut instead)
import fs from "node:fs";
import path from "node:path";
import {EPISODES, ROOT, parseArgs, readJson} from "./lib.mjs";
import {youtubePrivateUpload, captionFor} from "./publish.mjs";

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id) {
  console.error("Usage: node scripts/yt-private-upload.mjs <episodeId> [--shorts]");
  process.exit(1);
}
const kitPath = path.join(EPISODES, id, "publish.json");
if (!fs.existsSync(kitPath)) {
  console.error(`No publishing kit at episodes/${id}/publish.json. Run: node scripts/kit.mjs ${id}`);
  process.exit(1);
}
const kit = readJson(kitPath);
const shorts = Boolean(args.shorts);
const asset = shorts ? `${id}/${id}-short1-9x16.mp4` : `${id}/${id}-16x9.mp4`;
if (!fs.existsSync(path.join(ROOT, "out", asset))) {
  console.error(`No final at out/${asset}. Render finals first.`);
  process.exit(1);
}
const k = shorts ? kit.shorts : kit.youtube;
const title = k.titles[0];
const description = captionFor({description: k.description, hashtags: k.hashtags ?? []});
const tags = kit.youtube.tags ?? [];
const size = fs.statSync(path.join(ROOT, "out", asset)).size;
console.log(`Uploading out/${asset} (${(size / 1048576).toFixed(1)} MB) as PRIVATE\n  title: ${title}\n  tags: ${tags.join(", ")}`);
const t0 = Date.now();
youtubePrivateUpload({asset, title, description, tags, shorts})
  .then((r) => console.log(`Done in ${Math.round((Date.now() - t0) / 1000)} s: ${r.remoteUrl} (video id ${r.remoteId}, private)`))
  .catch((e) => {
    console.error(`Failed: ${e.message ?? e}`);
    process.exit(1);
  });
