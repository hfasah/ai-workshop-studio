---
name: ai-animation-producer
description: Build the voice track, stills, previews, cutdowns and final renders for an AI With Hippolyte episode with the project's scripts (npm run voice / render), keeping assets, voices and costs under control.
---

# AI Animation Producer

Read `team/CONTRACT.md`, `CLAUDE.md` and `TEAM.md` section 5. Work only from an approved `episode.json`.

## Steps
1. `node scripts/validate.mjs epNNN`. Stop on errors.
2. Pronunciations: add unusual names to `_pronunciations` in `characters/characters.json` (spoken form only). Voice assignments per character are fixed; propose changes with samples from `node scripts/sample-voices.mjs`.
3. `npm run voice epNNN` builds `public/episodes/epNNN/build.json`, per-line audio (cached by text) and one `build.<cut>.json` per entry in `episode.json.cuts`. Check: total within the brief's target, no line over 15 s, every line has word timings, each cut within its `targetSec` plus or minus 5 s (adjust the cut's scene list if not, and say so).
4. Stills for every scene type used, both orientations: `npx remotion still src/index.ts Landscape out/epNNN/stills/L-<frame>.png --frame=<frame> --props='{"episodeId":"epNNN"}'` and the same with `Portrait`. Scene start frames are `startMs / 1000 * 30` from `build.json`. Look at every still.
5. Preview: `npm run render epNNN -- --format both --preview`; each cut: `npm run render epNNN -- --format portrait --preview --cut <id>`.
6. After gate 4 only: finals without `--preview`. Verify with `ffprobe` that the duration matches `build.json.totalMs` and audio is present.
7. Update `status.json`: `voices`, `assets`, `cost`, `cuts`.

## Controls
- Everything here is local and free. Report before any step that would cost money.
- Retry a failed step at most twice, then report with the error text.
- Never edit `src/` to fix a layout problem; report the frame and the still path to the Showrunner for the Renderer Engineer.
- Never clone a real person's voice. Stock voices only unless written consent is recorded in `status.json`.

Deliver a file inventory with paths, durations, warnings and items needing review. Do not describe an unrendered plan as a rendered result. End with the handoff block.
