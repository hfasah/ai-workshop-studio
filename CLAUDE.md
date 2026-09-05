# AI Workshop Studio

Renderer for the animated series **AI With Hippolyte: The AI Workshop**. Turns a structured episode JSON into finished MP4s (16:9 and 9:16) with voice, characters, captions and branding. Built on Remotion.

Read `SERIES.md` before writing any script. It is the series bible (positioning, cast, episode format, signature closing).

## Workshop Crew (AI employees)

Eight skills in `.claude/skills/` and seven subagents in `.claude/agents/` form the production team. Entry point: `/ai-workshop-showrunner` (the Showrunner runs in the main session so it can stop at the six approval gates: brief, story, script, storyboard, preview, publication). The binding rules, learning model (Understand AI → Recognize Africa's opportunity → Take action, BUILD framework) and story standard are in `team/CONTRACT.md`; story concepts in `team/STORY-BANK.md`; the original package in `team/original/`. Episodes carry a top-level `disclosure` string shown on the title scene. Per-episode deliverables live in `episodes/epNNN/` (brief, evidence pack, claim ledger, learning design, script table, storyboard, status.json, quality report). `SEASON.md` is the log.

## Pipeline

```
npm run script -- "Why AI Hallucinates" --episode 6   # topic → episodes/ep006/episode.json (uses `claude -p`)
npm run voice ep006                                    # episode.json → public/episodes/ep006/build.json + audio (Edge TTS, word timings)
npm run render ep006 -- --format both [--preview]      # build.json → out/ep006/ep006-16x9.mp4 and -9x16.mp4
npm run render ep006 -- --cut short1 [--preview]       # vertical cutdown from episode.json "cuts" → ep006-short1-9x16.mp4
node scripts/validate.mjs ep006                        # schema, cast, closing line, word budget, digits in speech
npm run dev                                            # Remotion Studio, live preview (compositions: Landscape, Portrait)
```

`voice` caches audio by content hash, so re-running after editing one line only re-synthesizes that line.

Two voice engines, chosen per character in `characters/characters.json` via `engine`: `edge` (Microsoft Edge neural TTS, fast, free) and `f5` (local F5-TTS voice clone via `.venv` + `scripts/tts_clone.py`, slow: ~30 s per sentence, words aligned with mlx-whisper). Tanyi uses `edge` with en-US-AndrewNeural (the user rejected both the Nigerian-accented voice and a clone made from a YouTube clip). `_pronunciations` in characters.json rewrites names for speech only (Tanyi → Tang-yee). The venv has a one-line patch in `f5_tts_mlx/cfm.py` (`int(dur)`) for a newer-mlx typing error; reapply it if the venv is rebuilt.

## Files

- `episodes/<id>/episode.json` — the source of truth for an episode. Human-edited. Scenes have `type`, `characters`, `onScreen`, `lines`. Optional `cuts: [{id, targetSec, scenes: [ids]}]` define vertical cutdowns that reuse the same audio (built as `build.<id>.json`).
- `characters/characters.json` — cast: voice engine, colour, placeholder look. Speaker ids in episodes must match these keys. Cast: tanyi (host, animated stand-in for the real Hippolyte), amara (learner), kito (small AI assistant robot), hallucinator, gatekeeper. The series name stays "AI With Hippolyte"; the host never appears under his real name as a character.
- `public/characters/<id>/` — optional drawn character pack (poses/, expressions/, gestures/, mouth/). If `poses/*.png` exists the pack is used instead of the SVG placeholder. All layers must share one canvas size.
- `public/episodes/<id>/build.json` — generated. Never edit by hand.
- `src/scenes/SceneView.tsx` — one component per scene type: title, statement, bullets, steps, compare, dialogue, screen, code, outro. `src/scenes/Demo.tsx` holds the flow and demo scenes.
- Visual style: white background, flat cards with soft shadows, Inter 900 headlines, one warm accent (amber) and one cool accent (blue). Light theme tokens live in `src/theme.ts`.
- `src/components/Icon.tsx` (lucide icons by name), `Illustrations.tsx` (named flat drawings), `Marker.tsx` (hand-drawn circle/underline/box that draws on); `src/scenes/Diagram.tsx`, `Examples.tsx`.
- `src/characters/Placeholder.tsx` — SVG characters (human, robot, wisp, shield) with amplitude-driven mouths.
- `src/components/Stage.tsx` — places characters, picks the active speaker from line timings, reads audio amplitude for lip movement.
- `src/layout.ts` — content/stage boxes per orientation and scene type.

## Scene reference

| type | onScreen |
|---|---|
| title | `title`, `subtitle` |
| statement | `text`, `emphasis` |
| bullets | `title`, `items[]` |
| steps | `title`, `steps[{label, icon}]` |
| flow | `title`, `nodes[{label, icon, sub, color}]` — arrows draw on, nodes activate one per line (or evenly) |
| demo | `title`, `app`, `steps[{title, detail, ui}]` — numbered rail + mock app window; `ui.kind` is chat, calendar, email, approval, list or text. Steps activate one per line when counts match |
| compare | `left{title, items[]}`, `right{title, items[]}` (right column lights up when the 2nd line starts) |
| dialogue | `caption` (characters take the stage) |
| screen | `src` (under public/), `startMs`, `muted`, `zoom[{atMs, x, y, scale}]`, `title` |
| code | `title`, `code` |
| diagram | `title`, `cols`, `nodes[{id,label,sub,icon,col,row,shape,illustration}]`, `edges[{from,to,label,style,kind}]`, `groups` |
| examples | `title`, `items[{icon,label,text,illustration}]` |
| outro | `line`, `emphasis`, `cta` |

Line fields: `speaker`, `text`, `expression` (neutral, happy, confident, serious, confused, surprised), `gesture` (neutral, explain, point_left, point_right, warning). Optional `audio` for recorded narration (path under public/), with an optional sibling `.words.json` of `{text,startMs,endMs}[]` for word-level captions.

## Conventions

- Spoken numbers in words ("five hundred"), on-screen numbers as digits.
- Every episode ends with tanyi saying "Don't just use AI. Build it to work reliably."
- Keep scene components pure functions of frame; no state, no effects.
- Check visuals with stills before full renders: `npx remotion still src/index.ts Landscape out/x.png --frame=N --props='{"episodeId":"ep001"}'`.
