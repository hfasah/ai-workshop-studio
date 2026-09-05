// Usage: node scripts/sample-voices.mjs "text" en-US-AndrewNeural en-CA-LiamNeural ...
import fs from "node:fs";
import path from "node:path";
import {MsEdgeTTS, OUTPUT_FORMAT} from "msedge-tts";
const [text, ...voices] = process.argv.slice(2);
fs.mkdirSync("out/voices", {recursive: true});
for (const v of voices) {
  const tts = new MsEdgeTTS();
  await tts.setMetadata(v, OUTPUT_FORMAT.AUDIO_24KHZ_96KBITRATE_MONO_MP3);
  const tmp = fs.mkdtempSync("out/voices/.tmp-");
  const {audioFilePath} = await tts.toFile(tmp, text);
  fs.renameSync(audioFilePath, path.join("out/voices", `${v}.mp3`));
  fs.rmSync(tmp, {recursive: true, force: true});
  console.log("wrote", v);
}
