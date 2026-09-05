# AI Workshop Studio (web interface)

A local web interface for the episode pipeline: type a topic or your own storyline, draft an episode, let it produce itself (voice, captions, preview MP4s), review the six gates, preview the animation live in the browser, render finals, download everything, and record the publishing decision. Stories line up in the list; Hippolyte decides what gets published. The team never posts.

- **API**: `scripts/api.mjs` (Express, port 4600). Thin layer over the files on disk; no database, no auth.
- **Front end**: this folder (Vite + React + TypeScript). Imports the video composition straight from `../src` so the browser preview is the same React tree the MP4s are rendered from.

Files on disk stay the source of truth: `episodes/<id>/episode.json` and `status.json`, `public/episodes/<id>/build.json`, `out/<id>/*.mp4`. Anything the crew or Hippolyte edits by hand shows up on the next refresh.

## Run

Once, from the repo root:

```
npm install                 # renderer dependencies (Remotion)
npm install --prefix studio # front-end dependencies + express (used by scripts/api.mjs)
```

Development (two terminals, from the repo root):

```
npm run api      # API on http://localhost:4600
npm run studio   # Vite dev server on http://localhost:4610 (proxies /api, /out, /public, /episodes, /characters, /music, /screen to 4600)
```

Open http://localhost:4610.

Production-style (one process):

```
npm run studio:build   # type-checks and builds studio/dist
npm run api            # serves the built front end and the API on http://localhost:4600
```

## Screens

**Episodes** (`/`). Every folder under `episodes/` with an `episode.json`: title, number, **Format** (build story / short lesson, from `status.json.format`), **Status** (drafting → preview ready → finals ready → published, derived from the MP4s in `out/<id>/` and the publishing decision), the six gate chips (pending / approved / changes; any other text in `status.json` shows as grey), duration from `build.json`, number of MP4s and caption files, **Publish plan** (`status.json.publication.plan` or "—"), version. A filter row above the table narrows the list by status. Refreshes every 5 seconds so running jobs show up. "New episode" opens the form.

**New episode** (`/new`). Topic (required), **Storyline or notes** (optional: his own story idea, the characters' situation, anything; sent to the writer as "Hippolyte's storyline (follow it; verify setting facts)"), **Format** ("Build story", default, 3–4 min, nine beats; or "Short lesson", 60–90 s in the concept format: hook, explanation, example, action, closing, about 150 to 200 words in 5 or 6 scenes), episode number (default: next free), target minutes (3.5; fixed for short lessons), vertical cut seconds (45), audience, African setting hint, story bank concept (rows of `team/STORY-BANK.md`), and **Produce automatically after drafting** (checkbox, default on). Submit creates `episodes/epNNN/` with `episode-brief.md` (Status: needs-review, includes the format and storyline), `status.json` (six gates pending, disclosure "fictional", `format`, `auto`, `storyline`) and a placeholder `episode.json`, then starts a **script job**: a prompt made of `SERIES.md`, the story standard from `team/CONTRACT.md`, the file spec from `TEAM.md` section 4, `episodes/ep001/episode.json` as the example, the form fields, the storyline and the format's word budget, sent to `claude -p … --output-format json`. The result is written to `episode.json`, the validator runs, and `cost.script_usd` is recorded in `status.json`. This is the only metered step (roughly $0.30 to $1). If the `claude` CLI is missing the job fails with a clear message and the folder stays usable (paste a script in the Script tab).

With auto-produce on, the same job continues as a chain: **script → voice → captions → preview renders (both formats) → one cut preview per cut**. The log shows a stage header (`━━ Stage 2/5 · Build voice ━━`) for each step and stops at the first failure (a script that fails the validator stops the chain, so it can be fixed in the Script tab and produced with one click). Gates stay pending in this mode: they are review records, not blockers. When the chain ends the episode is "preview ready" and its files are in the Downloads menu.

**Episode** (`/ep/:id`). Header with title, version, format, duration, output count, status, disclosure, publishing plan and costs; a **Downloads** dropdown lists every MP4, SRT and VTT in `out/<id>/` with sizes and download links. The **gate stepper** shows the six gates; click one to Approve, Request changes or reset to pending, with a note. Decisions go to `status.json` (`gates`, plus an `approvals` entry with timestamp, by "Hippolyte" and the note); "Request changes" bumps `version`. Tabs:

- **Brief & story**: Hippolyte's storyline when one was typed, then every `.md` and `.csv` in the episode folder except the storyboard, quality report and publish kit (brief, story brief, evidence pack, claim ledger, learning design, script tables, authenticity reviews), rendered as Markdown, plus the setting from `status.json`.
- **Script**: one card per scene (label editable, id, type, characters) with a table of lines: speaker select, text, expression, gesture, move up/down, remove, add line. "Raw JSON" switches to a full editor of `episode.json` (cuts, onScreen, anything). "Save and validate" writes the file and shows the output of `node scripts/validate.mjs <id>` (errors and warnings).
- **Storyboard**: read-only cards with each scene's type, characters, line count and `onScreen` JSON; `storyboard.md` and the cuts when present.
- **Preview**: Remotion `<Player>` running `src/Episode.tsx` on `public/episodes/<id>/build.json`. Landscape 1920x1080 / Portrait 1080x1920 toggle, cut selector when `build.<cut>.json` files exist, controls, loop. Shows "Build voice first" when there is no build.
- **Build & render**: **Produce preview** (chain: voice → captions → preview MP4s in both formats → cut previews), **Render finals** (chain: captions → final MP4s in both formats → cut finals), **Generate captions** (instant: `.srt` and `.vtt` for the episode and every built cut). "Single steps" folds out the individual jobs: Build voice (`node scripts/voice.mjs <id>`), Render preview (both), Render final (both), Render cut (portrait, preview optional). One job at a time per episode. The log streams live over Server-Sent Events; Remotion's per-frame progress collapses into one updating line; chained jobs print a stage header per step. Below: every MP4 in `out/<id>/` with an inline player and a download link, then the caption files with sizes and download links.
- **Publish**: the publishing kit and the decision. **Generate publishing kit** runs `claude -p` with `SERIES.md` (tone), the style-guide colours and cast from `TEAM.md`, the episode's title and disclosure, every spoken line with scene timestamps from `build.json`, and the cuts, and asks for three title options (≤ 60 characters), a YouTube description with chapter timestamps and the disclosure line, ten tags, a thumbnail brief in the style colours, three short-clip suggestions with times, a LinkedIn post in the host's voice and a newsletter blurb. The result is written to `episodes/<id>/publish.md` (shown on the tab) and `cost.publish_usd` is recorded (metered, roughly $0.05 to $0.30). The **Publishing decision** panel records "Publish on YouTube / Shorts / LinkedIn / Hold" with a date and a note into `status.json.publication` (`{plan, date, note, decidedAt}`); any plan other than Hold marks gate 6 "approved" with an `approvals` entry noting "authorized by Hippolyte via Studio". Nothing is posted anywhere; this is the record. `quality-report.md` is shown below when present.

While a job runs, a dock in the bottom-right corner shows its log on every tab; when it ends the page reloads its data (new build, new MP4s, new captions, new script). During a chained job the page also refreshes every 10 seconds so outputs appear as each stage lands.

## Captions

`node scripts/captions.mjs <id> [--cut <cut>]` writes `out/<id>/<id>[-<cut>]-captions.srt` and `.vtt` from the word timings in `build.json` (or `build.<cut>.json`): cues of at most two lines of 42 characters, at most 3.5 seconds, a new cue on every speaker change, on a pause longer than 1.2 s and after a sentence end once the cue is long enough. The VTT carries the speaker as a `<v Name>` voice tag; the SRT is plain. The API runs the same code for `POST /api/episodes/:id/captions` and inside the produce and finalize chains.

## API

| Method and path | What it does |
|---|---|
| `GET /api/meta` | next episode number, default audience, story bank rows, cast, formats, publishing plans, whether `claude` is on PATH |
| `GET /api/episodes` | list with gates, version, disclosure, format, publication, stage (drafting / preview ready / finals ready / published), build duration, MP4 and caption names, running job |
| `GET /api/episodes/:id` | `episode.json`, `status.json`, stage, docs (`{name, content}`), build summary (totalMs, scenes, cuts), outputs (`{name, type: video \| captions, preview, size, mtime, url}`) |
| `PUT /api/episodes/:id/episode` | save `episode.json`; returns `{saved, validation}` |
| `POST /api/episodes/:id/validate` | run the validator |
| `POST /api/episodes/:id/gates/:gate` | `{decision: "approved" \| "changes" \| "pending", note}` |
| `POST /api/episodes` | `{topic, episode, audience, minutes, setting, story, cutSeconds, storyline, format: "build" \| "short", auto}` → creates the folder and starts the script job (or, with `auto`, the script → produce chain). `?dryRun=1` returns `{form, prompt}` without creating anything or calling `claude` |
| `POST /api/episodes/:id/jobs` | `{kind: "voice" \| "preview" \| "final" \| "cut", cut?, preview?}` |
| `POST /api/episodes/:id/produce` | chained job: voice → captions → preview renders (both) → cut previews |
| `POST /api/episodes/:id/finalize` | chained job: captions → final renders (both) → cut finals |
| `POST /api/episodes/:id/captions` | `{cut?}` → writes `.srt` and `.vtt` for the episode and every built cut (or one cut); returns `{files, outputs}` |
| `POST /api/episodes/:id/publish-kit` | starts the `claude -p` job that writes `publish.md`; `?dryRun=1` returns the prompt instead |
| `POST /api/episodes/:id/publication` | `{plan: "YouTube" \| "Shorts" \| "LinkedIn" \| "Hold", date?: "YYYY-MM-DD", note?}` → `status.json.publication`; a plan other than Hold approves gate 6 for the record |
| `GET /api/jobs`, `GET /api/jobs/:jobId` | job table (in memory), buffered log lines |
| `GET /api/jobs/:jobId/stream` | Server-Sent Events: `{job}`, then `{line, stream}` entries, then `{done, exitCode, status}` |
| `POST /api/jobs/:jobId/cancel` | SIGTERM the job's process |
| `/out/*`, `/public/*` | rendered MP4s and generated builds/audio; `public/` is also mounted at `/` because `staticFile()` resolves to `/episodes/…` inside the Player |

## Known limits

- Jobs live in memory: restarting the API forgets finished logs (files on disk are unaffected). A job's child process is not killed when the API stops. Restart the API to pick up code changes: kill the old `node scripts/api.mjs` and run `npm run api` again (wait for running renders to finish first).
- Job kinds: `script`, `auto` (script + produce chain), `voice`, `preview`, `final`, `cut`, `produce`, `finalize`, `publish-kit`. "Cancel job" stops the current stage of a chain; the chain then ends as failed.
- Auto-produce runs the whole chain without stopping at the gates. The gates stay "pending" as review records; approve them afterwards if the record matters, or go straight to the publishing decision.
- No authentication and no CSRF protection: run it on localhost only.
- The script job passes the whole prompt (bible, contract excerpt, spec, ep001 example) as one CLI argument, the same way `scripts/script.mjs` does.
- The Script tab edits lines and labels; scene types, characters, `onScreen` and `cuts` are edited in Raw JSON.
- The gate stepper records whoever is at the keyboard as "Hippolyte".
- The Preview tab needs the API for audio and character packs (`/episodes/...`, `/characters/...`); in dev these paths are proxied by Vite.
- `express` is installed in `studio/node_modules` and loaded from there by `scripts/api.mjs`, so the renderer's root `package.json` dependencies stay untouched.
