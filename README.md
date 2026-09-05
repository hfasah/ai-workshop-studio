# AI Workshop Studio

Episode renderer for **AI With Hippolyte** — an animated AI education series. Give it a topic, get back a YouTube video and a vertical short, with voice, characters, captions and branding, from one JSON file.

## Quick start

```bash
npm install
npm run voice ep001                 # synthesize voices + timings for the pilot
npm run render ep001 -- --format both --preview   # fast half-res check
npm run render ep001 -- --format both             # final quality
npm run dev                          # open Remotion Studio to scrub through the episode
```

Outputs land in `out/ep001/`.

## The Workshop Crew (recommended way to make an episode)

Inside Claude Code, in this folder:

```
/ai-workshop-showrunner create an episode about <topic>. Audience: <who>. Target three minutes for YouTube and a 45-second vertical version. Stop for my approval after the brief, script, storyboard and preview. Do not publish without my explicit approval.
```

The Showrunner coordinates seven specialist subagents (researcher, African AI story director, learning designer, scriptwriter, storyboard director, animation producer, quality editor) and stops at six gates (brief, story, script, storyboard, preview, publication). Everything it produces lands in `episodes/epNNN/`; the rules it follows are in `team/CONTRACT.md`.

## Make a new episode by hand

```bash
npm run script -- "Why AI Hallucinates" --episode 6
# edit episodes/ep006/episode.json until you are happy with the words
npm run voice ep006
npm run render ep006 -- --format both
npm run render ep006 -- --cut short1      # 45 s vertical cutdown defined in episode.json "cuts"
```

`npm run script` calls the Claude Code CLI (`claude -p`) with the series bible in `SERIES.md`, so it needs a logged-in Claude Code and no separate API key.

## Voices

Every character has an Edge neural voice in `characters/characters.json`. Tanyi uses `en-US-AndrewNeural` (neutral North American). Names that TTS mispronounces go in the `_pronunciations` map in the same file; the substitution is spoken only, captions keep the real spelling (Tanyi is spoken "Tang-yee"). To audition voices:

```bash
node scripts/sample-voices.mjs "Any line you like" en-US-AndrewNeural en-CA-LiamNeural en-US-BrianNeural
```

Optional local voice cloning (F5-TTS, Apple Silicon) is still wired in: set `"engine": "f5"` and a `ref` on a character and put a clean 10 s reference in `public/characters/<id>/voice/`. It needs a real, quiet recording to sound right; a clip from a produced video was not good enough.

## Use your own voice

For any line, record the narration and set `"audio": "episodes/ep006/recorded/hook-0.mp3"` (file under `public/`). Captions will spread words evenly across the clip unless a `hook-0.words.json` with word timings sits beside it.

## Replace the placeholder characters

Drop a character pack into `public/characters/tanyi/`:

```
poses/standing.png
expressions/{neutral,happy,confident,serious,confused,surprised}.png
gestures/{neutral,explain,point-left,point-right,warning}.png
mouth/{neutral,M-B-P,E,A,O}.png
```

All images on the same transparent canvas. The renderer layers pose + expression + gesture + mouth, and picks the mouth shape from the audio loudness each frame.

## Screen recordings

Put the recording under `public/screen/` and add a scene:

```json
{ "id": "demo", "type": "screen", "characters": ["tanyi"],
  "onScreen": { "src": "screen/n8n-demo.mp4", "zoom": [ { "atMs": 4000, "x": 0.7, "y": 0.3, "scale": 1.8 } ] },
  "lines": [ { "speaker": "tanyi", "text": "Here is the workflow..." } ] }
```
