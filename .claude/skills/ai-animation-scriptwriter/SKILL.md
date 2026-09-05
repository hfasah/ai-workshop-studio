---
name: ai-animation-scriptwriter
description: Write the spoken narration and dialogue for an AI With Hippolyte episode directly into episodes/epNNN/episode.json (scene order, characters, lines) from the approved brief, evidence pack and learning design, plus a readable script table.
---

# AI Animation Scriptwriter

Read `team/CONTRACT.md`, `SERIES.md`, `TEAM.md` section 4, and the episode's brief, `evidence-pack.md`, `claim-ledger.csv`, `story-brief.md`, `learning-design.md`. Build the drama around making something work for the real user in the story brief: characters decide, create, test, hit a meaningful failure or constraint, and improve the system. Explanations emerge from the build; no detached lecture. Study `episodes/ep001/episode.json` as the structural template.

## Write
- Produce `episodes/epNNN/episode.json`: `id`, `series`, `tagline`, `episode`, `title`, `disclosure` (from the story brief), `background: "workshop"`, `scenes[]` in the build-story beat order (or the concept order if the brief says so), and `cuts[]`. For each scene set `id`, `type`, `label`, `characters`, `lines[]` and a first-pass `onScreen` block (the Storyboard Director refines it).
- Cast ids only: `tanyi`, `amara`, `kito`, `hallucinator`, `gatekeeper`. tanyi explains, amara asks, kito does, hallucinator interferes, gatekeeper guards.
- Each line: `speaker`, `text`, `expression` (neutral, happy, confident, serious, confused, surprised), `gesture` (neutral, explain, point_left, point_right, warning).
- Speech: plain English, one idea per sentence, numbers as words, no markdown. **Short format (default): 110–150 words, 5 scenes, no title scene, no line over 20 words, the claim in the first sentence, `format: "short"` at top level.** Long build-story: 125 to 150 words per minute, about 400 to 470 words, no line over 40 words.
- Demo, flow, diagram and examples scenes: one spoken line per step, node or tile.
- Every episode names at least three real-world uses (jobs, businesses, public services) where the idea applies, as an `examples` scene or inside the fix; concrete, one line each.
- Use only claims marked `safe` in the ledger, with their script-safe wording. Never invent a personal story; put `[HIPPOLYTE STORY NEEDED: ...]` in `script-vN.md`, never in the JSON.
- Do not imitate Professor Glitch's characters, catchphrases or scripts.
- Name the country, city, community, language or market only as the story brief and ledger support; never substitute generic scenery, slogans or invented phrases for context. African characters are competent agents with different expertise and viewpoints. The user's and specialist's words appear in demo chat, list or email UI and through amara; do not add new animated characters.
- Make clear what is fictional: the disclosure line carries it; do not claim measured impact.
- Last line, spoken by tanyi: "Don't just use AI. Build it to work reliably." followed by a pointer to the next episode.
- `cuts`: propose one vertical cutdown, e.g. `[{"id": "short1", "targetSec": 45, "scenes": ["hook", "four-parts", "safety", "outro"]}]`.

## Also produce `episodes/epNNN/script-vN.md`
A table: scene, speaker, line, on-screen idea, claim id. Then total words, estimated runtime, pronunciation list (names go to `_pronunciations` in `characters/characters.json` via the Animation Producer), required approvals, and the proposed cutdown.

Run `node scripts/validate.mjs epNNN` and fix every error before handing off. End with the handoff block.
