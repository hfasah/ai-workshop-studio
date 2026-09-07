// Uploads one episode's final to the connected YouTube channel as a PRIVATE video, with the title, description and
// tags from its publishing kit, then sets the rendered thumbnail if out/<id>/<id>-thumb.jpg exists.
// Proves the connection end to end without publishing anything.
// Usage: node scripts/yt-private-upload.mjs ep101 [--shorts]        (--shorts uploads the short1 9:16 cut instead)
//        node scripts/yt-private-upload.mjs ep101 --thumbnail-only <videoId>   (only set the thumbnail on an existing video)
import fs from "node:fs";
import path from "node:path";
import {EPISODES, ROOT, parseArgs, readJson} from "./lib.mjs";
import {youtubePrivateUpload, youtubeSetThumbnail, thumbnailFor, captionFor} from "./publish.mjs";

const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id) {
  console.error("Usage: node scripts/yt-private-upload.mjs <episodeId> [--shorts] [--thumbnail-only <videoId>]");
  process.exit(1);
}
const setThumb = async (videoId) => {
  const thumb = thumbnailFor(id);
  if (!thumb) return console.log(`No thumbnail at out/${id}/${id}-thumb.jpg (run: node scripts/thumbnail.mjs ${id}); skipped.`);
  try {
    await youtubeSetThumbnail(videoId, thumb);
    console.log(`Thumbnail set on ${videoId} from ${path.relative(ROOT, thumb)}.`);
  } catch (e) {
    console.log(`Thumbnail not set: ${e.message ?? e}`);
  }
};
if (args["thumbnail-only"]) {
  setThumb(String(args["thumbnail-only"])).then(() => process.exit(0));
} else {
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
  .then(async (r) => {
    console.log(`Done in ${Math.round((Date.now() - t0) / 1000)} s: ${r.remoteUrl} (video id ${r.remoteId}, private)`);
    if (!shorts) await setThumb(r.remoteId);
  })
  .catch((e) => {
    console.error(`Failed: ${e.message ?? e}`);
    process.exit(1);
  });
}
