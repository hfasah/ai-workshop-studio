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

**Episodes** (`/`). Every folder under `episodes/` with an `episode.json`: title, number, **Format** (build story / short lesson, from `status.json.format`), **Status** (drafting → preview ready → finals ready → published, derived from the MP4s in `out/<id>/` and the publishing decision), the six gate chips (pending / approved / changes; any other text in `status.json` shows as grey), duration from `build.json`, number of MP4s and caption files, **Publish plan** (next scheduled platform and slot from `studio/schedule.json`, else the recorded decision, else "—"), version. A filter row above the table narrows the list by status. Refreshes every 5 seconds so running jobs show up. "New episode" opens the form.

**New episode** (`/new`). Topic (required), **Storyline or notes** (optional: his own story idea, the characters' situation, anything; sent to the writer as "Hippolyte's storyline (follow it; verify setting facts)"), **Format** ("Build story", default, 3–4 min, nine beats; or "Short lesson", 60–90 s in the concept format: hook, explanation, example, action, closing, about 150 to 200 words in 5 or 6 scenes), episode number (default: next free), target minutes (3.5; fixed for short lessons), vertical cut seconds (45), audience, African setting hint, story bank concept (rows of `team/STORY-BANK.md`), and **Produce automatically after drafting** (checkbox, default on). Submit creates `episodes/epNNN/` with `episode-brief.md` (Status: needs-review, includes the format and storyline), `status.json` (six gates pending, disclosure "fictional", `format`, `auto`, `storyline`) and a placeholder `episode.json`, then starts a **script job**: a prompt made of `SERIES.md`, the story standard from `team/CONTRACT.md`, the file spec from `TEAM.md` section 4, `episodes/ep001/episode.json` as the example, the form fields, the storyline and the format's word budget, sent to `claude -p … --output-format json`. The result is written to `episode.json`, the validator runs, and `cost.script_usd` is recorded in `status.json`. This is the only metered step (roughly $0.30 to $1). If the `claude` CLI is missing the job fails with a clear message and the folder stays usable (paste a script in the Script tab).

With auto-produce on, the same job continues as a chain: **script → voice → captions → preview renders (both formats) → one cut preview per cut**. The log shows a stage header (`━━ Stage 2/5 · Build voice ━━`) for each step and stops at the first failure (a script that fails the validator stops the chain, so it can be fixed in the Script tab and produced with one click). Gates stay pending in this mode: they are review records, not blockers. When the chain ends the episode is "preview ready" and its files are in the Downloads menu.

**Episode** (`/ep/:id`). Header with title, version, format, duration, output count, status, disclosure, publishing plan and costs; a **Downloads** dropdown lists every MP4, SRT and VTT in `out/<id>/` with sizes and download links. The **gate stepper** shows the six gates; click one to Approve, Request changes or reset to pending, with a note. Decisions go to `status.json` (`gates`, plus an `approvals` entry with timestamp, by "Hippolyte" and the note); "Request changes" bumps `version`. Tabs:

- **Brief & story**: Hippolyte's storyline when one was typed, then every `.md` and `.csv` in the episode folder except the storyboard, quality report and publish kit (brief, story brief, evidence pack, claim ledger, learning design, script tables, authenticity reviews), rendered as Markdown, plus the setting from `status.json`.
- **Script**: one card per scene (label editable, id, type, characters) with a table of lines: speaker select, text, expression, gesture, move up/down, remove, add line. "Raw JSON" switches to a full editor of `episode.json` (cuts, onScreen, anything). "Save and validate" writes the file and shows the output of `node scripts/validate.mjs <id>` (errors and warnings).
- **Storyboard**: read-only cards with each scene's type, characters, line count and `onScreen` JSON; `storyboard.md` and the cuts when present.
- **Preview**: Remotion `<Player>` running `src/Episode.tsx` on `public/episodes/<id>/build.json`. Landscape 1920x1080 / Portrait 1080x1920 toggle, cut selector when `build.<cut>.json` files exist, controls, loop. Shows "Build voice first" when there is no build.
- **Build & render**: **Produce preview** (chain: voice → captions → preview MP4s in both formats → cut previews), **Render finals** (chain: captions → final MP4s in both formats → cut finals), **Generate captions** (instant: `.srt` and `.vtt` for the episode and every built cut). "Single steps" folds out the individual jobs: Build voice (`node scripts/voice.mjs <id>`), Render preview (both), Render final (both), Render cut (portrait, preview optional). One job at a time per episode. The log streams live over Server-Sent Events; Remotion's per-frame progress collapses into one updating line; chained jobs print a stage header per step. Below: every MP4 in `out/<id>/` with an inline player and a download link, then the caption files with sizes and download links.
- **Publish**: the per-platform publishing kit, the platform cards and the schedule for this episode (see "Publishing" below). **Generate kit** (engine indicator; Ollama $0, Claude CLI metered) writes `episodes/<id>/publish.json` and `publish.md`. One card per platform (YouTube, Shorts, Instagram, TikTok, Facebook, Facebook Reel, LinkedIn) with an asset selector, title options, caption and hashtag editors with live counts, a date-time picker (next weekday 9:00 local, platforms staggered by 15 minutes), a "via" selector (direct / Blotato / manual, limited to what is connected) and **Add to schedule**. Below: the entries already scheduled for the episode, the **Publishing decision** record (`status.json.publication`, gate 6) and `quality-report.md`.

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
| `POST /api/episodes/:id/publish-kit` | starts the engine job that writes `publish.json` + `publish.md` (per-platform kit, limits enforced in code); `?dryRun=1` returns the prompt instead |
| `GET /api/episodes/:id/publish-kit`, `PUT …` | read the kit / store a hand-edited kit (re-validated, rewrites both files) |
| `GET /api/episodes/:id/assets` | MP4s under `out/<id>/` with width, height, duration (ffprobe, cached) and aspect |
| `GET /api/connections`, `PUT /api/connections` | connection status (secrets masked) and settings: `{youtube: {clientId, clientSecret, disconnect}, facebook: {pageId, pageToken}, blotato: {apiKey}, mediaHost: {baseUrl, uploadCommand}}` |
| `POST /api/connections/:platform/test` | lists the channel / page / Blotato accounts; posts nothing |
| `GET /api/connections/youtube/auth-url`, `GET …/callback` | Google consent URL and the OAuth callback (stores the refresh token) |
| `GET /api/schedule`, `POST /api/schedule`, `PUT /api/schedule/:id`, `DELETE /api/schedule/:id` | the schedule (`studio/schedule.json`) |
| `POST /api/schedule/:id/publish-now` | upload now (direct / Blotato) or mark a manual entry due |
| `POST /api/schedule/:id/posted` | `{url?}` marks a manual entry published |
| `GET /api/publish-log?limit=` | last lines of `studio/publish-log.jsonl` |
| `POST /api/episodes/:id/publication` | `{plan: "YouTube" \| "Shorts" \| "LinkedIn" \| "Hold", date?: "YYYY-MM-DD", note?}` → `status.json.publication`; a plan other than Hold approves gate 6 for the record |
| `GET /api/jobs`, `GET /api/jobs/:jobId` | job table (in memory), buffered log lines |
| `GET /api/jobs/:jobId/stream` | Server-Sent Events: `{job}`, then `{line, stream}` entries, then `{done, exitCode, status}` |
| `POST /api/jobs/:jobId/cancel` | SIGTERM the job's process |
| `/out/*`, `/public/*` | rendered MP4s and generated builds/audio; `public/` is also mounted at `/` because `staticFile()` resolves to `/episodes/…` inside the Player |

## Publishing

Top-level page **Publishing** (`/publishing`): a week calendar (Mon–Sun, prev/next, entries as chips with platform badge, time, episode title and status colour), the **Connections** panel, the **Upcoming** list (edit, delete, publish now, mark as posted) and the publish log. Files: `studio/connections.json` (secrets, gitignored), `studio/schedule.json` (gitignored), `studio/publish-log.jsonl` (gitignored; one JSON line per action). The scheduler runs inside the API every 60 s (`STUDIO_SCHEDULER=off` disables it). **Nothing is ever posted unless a schedule entry exists, and only Hippolyte creates entries from the Studio.** The crew agents never touch `schedule.json`.

### Connections and what each needs

| Connection | Posts | Cost | What to paste | Status |
|---|---|---|---|---|
| **YouTube** (direct) | main video (16:9) and Shorts (9:16); scheduled natively: uploaded `private` with `publishAt`, or `public` when published now; `selfDeclaredMadeForKids: false`, category Education, tags from the kit | free (YouTube Data API quota: one upload ≈ 1,600 units of the 10,000 daily default) | a Google Cloud project with **YouTube Data API v3** enabled, an OAuth client of type **Desktop app**; paste client id + secret, click **Connect Google account** (scopes `youtube.upload` + `youtube.readonly`, redirect `http://localhost:4600/api/connections/youtube/callback`; while the app is in "Testing" add your Google account as a test user). Token refresh is automatic. | implemented against the documented API; not yet exercised with a real channel |
| **Facebook Page** (direct) | Page videos (16:9) with `published=false` + `scheduled_publish_time` (must be 10 min to 30 days ahead; nearer slots publish immediately); **Reels (beta)**: two-phase `video_reels` start → binary upload → finish with `PUBLISHED` / `SCHEDULED` | free | Page id + a Page access token with `pages_manage_posts` and `pages_read_engagement` (Graph API Explorer or your own Meta app; long-lived tokens last about 60 days, then paste a new one) | implemented against Graph API v21.0 docs; not yet exercised with a real page; Reels marked beta |
| **Blotato** | Instagram Reels and TikTok (and Facebook, YouTube, LinkedIn when those accounts are connected in Blotato) | paid Blotato plan | the API key from my.blotato.com → Settings → API; click **Test** to list accounts (Facebook accounts also fetch their page ids) | endpoints verified against help.blotato.com on 2026-09-04: `GET /v2/users/me/accounts`, `GET …/accounts/{id}/subaccounts`, `POST /v2/media {url}`, `POST /v2/posts {post:{accountId, content:{text, mediaUrls, platform}, target:{targetType, …}}, scheduledTime}` → `{postSubmissionId}`; TikTok targets send `privacyLevel: PUBLIC_TO_EVERYONE` and `isAiGenerated: true`; Instagram sends `mediaType: reel`. Not yet exercised with a real key |
| **Manual** | anything | free | nothing; the entry shows the asset, the caption to copy and **Mark as posted** with a URL field | works |

Blotato needs the video at a **public URL** (local files are not reachable). Either paste one per entry (Drive, Dropbox, the site), or set the **Media host**: a public base URL plus an upload command template (`{file}` quoted absolute path, `{name}`, `{episode}`), for example `cp {file} /path/to/site/public/media/ && (cd /path/to/site && vercel deploy --prod)`. When neither exists the entry stays `needs_url`; add the URL and save.

### Kit (`publish.json` + `publish.md`)

Written with `generate()` (JSON mode) from `SERIES.md`, the spoken lines with scene timestamps, the cast, the disclosure line and the platform rules: YouTube (3 titles ≤ 60, description with chapters from `build.json` scenes — scenes under 10 s fold into the previous chapter — the disclosure line and the tagline, 10 tags), Shorts (3 titles ≤ 40, description ≤ 150 + `#Shorts` + 3 hashtags), Instagram (hook, two paragraphs, a question, 5 hashtags on the last line, ≤ 2,200 total), Facebook (≤ 500, 0–2 hashtags), TikTok (≤ 150 + 4 hashtags), LinkedIn (host's voice, no hashtags, links stripped), thumbnail text (≤ 4 words) and a bank of 15 hashtags. `#AIWithHippolyte` and `#AfricaAIMoment` are always included (except LinkedIn). Every limit is enforced in code after generation, so a small local model's overruns are trimmed rather than rejected. On qwen2.5:14b the kit takes about 4 minutes and costs $0.

### Schedule entries

`{id, episodeId, platform: youtube|shorts|instagram|facebook|facebook_reel|tiktok|linkedin|manual, via: direct|blotato|manual, asset (path under out/), title, description, hashtags[], tags[], publicUrl?, scheduledAt (ISO with the local offset, America/Toronto), status: draft|scheduled|uploading|published|failed|needs_url|due, remoteId?, remoteUrl?, error?, createdAt}`.

- **direct**: the scheduler uploads 10 minutes before the slot (Facebook: 20) using the platform's native scheduling and marks the entry `published` with the remote URL (the video goes live at the slot on the platform). `Publish now` uploads immediately as public.
- **blotato**: sent to Blotato when the entry is created (or when a URL is added), with `scheduledTime`; Blotato holds the post, the entry is `scheduled` with the submission id. Edits after that must be made at my.blotato.com/scheduler; deleting the entry does not cancel the Blotato post.
- **manual**: becomes `due` at the slot; copy the caption, post, click **Mark as posted**.
- **draft** entries are never published until edited out of draft. Entries in the past are rejected unless manual or draft.

### Unverified

Real uploads to YouTube, Facebook and Blotato have not been run from this machine (no credentials were available and the contract forbids posting without authorization). The request shapes follow the current public docs; the first real run of each connection should be a `Publish now` on a private or test asset. Facebook Reels is beta. LinkedIn has no direct connection (manual, or Blotato when a LinkedIn account is connected there).

## Known limits

- Jobs live in memory: restarting the API forgets finished logs (files on disk are unaffected). A job's child process is not killed when the API stops. Restart the API to pick up code changes: kill the old `node scripts/api.mjs` and run `npm run api` again (wait for running renders to finish first).
- Job kinds: `script`, `auto` (script + produce chain), `voice`, `preview`, `final`, `cut`, `produce`, `finalize`, `publish-kit`. Schedule uploads run inside the API process (not as jobs); their progress goes to the API console and `studio/publish-log.jsonl`. "Cancel job" stops the current stage of a chain; the chain then ends as failed.
- Auto-produce runs the whole chain without stopping at the gates. The gates stay "pending" as review records; approve them afterwards if the record matters, or go straight to the publishing decision.
- No authentication and no CSRF protection: run it on localhost only.
- The script job passes the whole prompt (bible, contract excerpt, spec, ep001 example) as one CLI argument, the same way `scripts/script.mjs` does.
- The Script tab edits lines and labels; scene types, characters, `onScreen` and `cuts` are edited in Raw JSON.
- The gate stepper records whoever is at the keyboard as "Hippolyte".
- The Preview tab needs the API for audio and character packs (`/episodes/...`, `/characters/...`); in dev these paths are proxied by Vite.
- `express` is installed in `studio/node_modules` and loaded from there by `scripts/api.mjs`, so the renderer's root `package.json` dependencies stay untouched.
