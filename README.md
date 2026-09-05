# AI Workshop Studio

Turn a topic into a short animated lesson: script, voices, captions and rendered video, from a web page on your own computer. Built for **AI With Hippolyte: The AI Workshop**, and reusable for any explainer series with its own cast and style.

- Type a topic (or your own storyline) → a 45–60 second script is drafted by a **local model** (free) → voices, captions and a 9:16 and 16:9 video are rendered on your machine.
- Review at six gates (brief, story, script, storyboard, preview, publication) in the Studio.
- Diagrams with real icons and connectors, illustrations, a fixed animated cast, word-by-word captions.
- Publishing kit per platform (titles, descriptions, hashtags) and a schedule for YouTube, Shorts, Instagram, Facebook and TikTok.
- Runs at $0: no paid API is required.

## Requirements

- macOS, Windows or Linux with **Node 20+** (https://nodejs.org). An Apple Silicon Mac or a machine with 16 GB+ RAM is recommended for the local model.
- **Ollama** for free script drafting (https://ollama.com/download), about 9 GB of disk for the model. Optional: without it you can write scripts by hand or use the Claude CLI engine.
- About 3 GB of disk for dependencies and the headless browser that renders video (downloaded automatically on first render).

## Install (5 minutes)

```bash
git clone https://github.com/hfasah/ai-workshop-studio.git
cd ai-workshop-studio
npm run setup      # installs everything, builds the UI, pulls the local model if Ollama is running
npm start          # opens http://localhost:4600
```

`npm run doctor` re-checks the machine at any time.

## First lesson

1. Click **New episode**, type a topic such as "MCP vs API in one minute", keep **Short lesson** and **Produce automatically**, and submit.
2. Wait for the job log: draft (2–4 min on a local model), voices, captions, preview renders.
3. Open the **Preview** tab to watch it in the browser, edit lines in **Script** if needed, then **Render finals** in **Build & render**.
4. **Publish** tab: generate titles, descriptions and hashtags, pick the asset per platform, schedule.

Two finished sample episodes and a short are included in `episodes/` to learn the format from.

## Make it yours

Everything that defines the series lives in plain files:

| File | What to change |
|---|---|
| `SERIES.md` | series name, tagline, audience, episode formats, tone |
| `characters/characters.json` | cast names, voices (Microsoft Edge neural voices, free), colours, pronunciations |
| `src/theme.ts` | colours and fonts |
| `src/characters/Placeholder.tsx` or `public/characters/<id>/` | character artwork (SVG placeholders, or drop in PNG layers) |
| `team/GLOSSARY.md` | fixed definitions the writer must use |
| `team/STORY-BANK.md` | starting story concepts |

The Workshop Crew (`.claude/skills/`, `.claude/agents/`, `team/CONTRACT.md`) is an optional set of AI employees for Claude Code users who want researched, reviewed episodes; the Studio works without it.

## Command line

```bash
npm run voice ep006                       # build voices and timings
npm run render ep006 -- --format both     # 16:9 and 9:16 finals (add --preview for a fast check)
npm run render ep006 -- --cut short1      # vertical cutdown defined in episode.json "cuts"
node scripts/captions.mjs ep006           # SRT and VTT
node scripts/validate.mjs ep006           # check an episode file
npm run dev                               # Remotion Studio for frame-by-frame preview
```

## How it works

Remotion (React) renders the video from `episodes/<id>/episode.json`; Microsoft Edge neural voices provide speech with word timings; Ollama runs the drafting model locally; an Express API and a Vite/React front end make the Studio. See `CLAUDE.md` for the code map, `TEAM.md` for the full spec and style guide, `studio/README.md` for the Studio and publishing details.

## License

Private, all rights reserved, unless a license file says otherwise.
