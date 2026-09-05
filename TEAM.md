# Workshop Crew — Production Handbook

The team that produces **AI With Hippolyte: The AI Workshop**.
Team name: **Workshop Crew**. Every agent, skill and future employee belongs to the Workshop Crew and follows this handbook. Add members over time; the handbook is the single source of truth they all read first.

This document contains everything the renderer, the pilot episode and the style were built from. Paste sections of it into prompts when you create skills, agents or team members.

---

## 1. Mission and non-negotiables

**Mission.** Turn one topic into one finished, consistent animated training episode (YouTube 16:9 plus vertical 9:16), in the same world, with the same characters, background, colours and voice, every time.

**Non-negotiables (every member obeys these):**
1. The episode file `episodes/<id>/episode.json` is the source of truth. Nothing is "in the video" unless it is in that file.
2. Never change the style system files without an explicit approval from Hippolyte: `src/theme.ts`, `src/layout.ts`, `src/components/Background.tsx`, `src/characters/Placeholder.tsx`, `characters/characters.json`, `SERIES.md`.
3. Characters are always called by their fixed names and rendered by the renderer. Never invent new characters or rename existing ones.
4. The host never appears under the real name. The series is "AI With Hippolyte"; the on-screen host character is **Tanyi**.
5. Every factual claim must be something the host could defend on camera. No invented statistics, no unverifiable numbers. If unsure, phrase it as a principle, not a statistic.
6. Every episode ends with Tanyi saying: **"Don't just use AI. Build it to work reliably."**
7. Spoken text is plain English with numbers written as words. On-screen text uses digits.
8. Preview before final. Stills or a half-resolution preview are checked before a full render.

---

## 2. Series bible

**Series:** AI With Hippolyte: The AI Workshop
**Tagline:** Complex AI. Explained visually. Built practically.
**Signature closing:** "Don't just use AI. Build it to work reliably."
**World:** The AI Workshop, a virtual laboratory where business problems arrive and are turned into working AI systems.
**Audience:** founders, operators, job seekers and professionals in Africa and worldwide who want to build with AI, not just use it. Adults. Professional education with characters as memory aids, never children's content.

**Positioning (never a generic "AI tips" channel):**
- How AI systems actually work
- How to build AI employees and agents
- Reliability, hallucination control, evaluation
- AI infrastructure and production deployment
- Practical AI for businesses and job seekers
- Responsible AI implementation
- African and global examples missing from mainstream AI education

**Tone and writing rules:**
- Plain English. One idea per sentence. Short sentences.
- Analogy before jargon. Define a technical term once, the first time it appears.
- Show systems thinking: inputs, steps, tools, checks, outputs.
- Humour comes from the characters (Kito's believable mistakes, the Hallucinator's confidence). Never sarcasm aimed at the viewer.
- Direct, warm, practical, no hype. The host has built and operated production systems and speaks from that.
- Include at least one African business example per episode, plus global ones.
- Business contexts to prefer: recruiting, IT operations, customer service, sales follow-up, finance admin, logistics, small business operations.

### Cast (ids are lowercase and fixed)

| id | Name | Role | Voice (Edge TTS) | Colour | Caption colour | Look / kind |
|---|---|---|---|---|---|---|
| `tanyi` | Tanyi | Host. AI engineer and instructor. Animated stand-in for the real host: a middle-aged Black African man, calm, direct, practical. Glasses, short hair with grey, beard, blue shirt. | en-US-AndrewNeural, rate 0.97 | #F5B700 | #B45309 | human |
| `amara` | Amara | Curious learner. Asks the questions beginners are thinking. Young Black African woman, orange top. | en-ZA-LeahNeural, rate 1.05, pitch +10Hz | #2DD4BF | #0D9488 | human |
| `kito` | Kito | Small AI assistant robot. Demonstrates concepts, occasionally makes believable mistakes. Light body, blue trim, antenna. | en-US-AnaNeural, rate 1.1, pitch +15Hz | #60A5FA | #2563EB | robot |
| `hallucinator` | The Hallucinator | Mischievous purple wisp. Confident but incorrect AI output. | en-US-GuyNeural, rate 1.05, pitch -20Hz | #C084FC | #7C3AED | wisp |
| `gatekeeper` | The Gatekeeper | Red shield with a lock. Security, privacy, governance, human approval. Stern, fair. | en-GB-SoniaNeural, rate 0.95, pitch -5Hz | #F87171 | #E11D48 | shield |

**Pronunciations (spoken only, captions keep the spelling):** Tanyi → "Tang-yee", Kito → "Kee-toh", Amara → "Ah-mah-rah".

**Character usage rules:**
- Tanyi explains. Amara asks and reacts. Kito does. The Hallucinator interferes with confident wrong answers. The Gatekeeper appears in every safety lesson and whenever an action needs approval.
- Two to three characters on stage at once at most. Dialogue scenes: the speakers only.
- Expressions: neutral, happy, confident, serious, confused, surprised. Gestures: neutral, explain, point_left, point_right, warning. Point toward the content panel (point_left when the character stands on the right).

### Default product: the short (45–60 s)
Since 2026-09-04 the short format is the main product: one concept, claim in the first sentence, a failure moment, one mechanism, the African characters making it work, one action. 110–150 words, 5 scenes, no title scene, vertical first. Long build-story episodes (3–4 min) are for courses and occasional long-form. Production runs at $0: local model (Ollama) for drafting in the Studio, local voices and rendering.

### Learning model and story engine
Arc: **Understand AI → Recognize Africa's opportunity → Take action.** BUILD lens: Build African capability, Use AI to solve African problems, Invest in African innovation, Lead responsibly, Develop African ownership. Central story: African characters do not simply discuss AI; they use local knowledge to build real systems Africans can use, maintain and own. Default episode spine (build-story format, 3 to 4 minutes): hook (a named person's problem) → title with disclosure → listening (user and local specialist) → decide what AI should and should not do → kito builds a small version → a realistic constraint or failure and the fix → user test → ownership and accountability → build challenge and closing. Authenticity rules and the twelve-concept story bank are in `SERIES.md` and `team/STORY-BANK.md`. Every episode carries a `disclosure` ("Fictional teaching scenario…" or "Verified case study: source") shown on the title scene.

### Concept format (2 to 4 minutes, in this order; used by the pilot)

| # | Beat | Target | What happens | Typical scene types |
|---|---|---|---|---|
| 1 | Hook | 10 s | One striking, concrete consequence. Example: "An AI agent can send 500 emails while you sleep. But what if it sends the wrong information?" | statement |
| 2 | Title | 5 s | Series, episode number, title. | title |
| 3 | Problem | 20 s | A familiar workplace situation, usually Amara asking Tanyi. | dialogue |
| 4 | Visual explanation | 60 to 90 s | Characters, diagrams, metaphors, short demonstrations. | compare, bullets, flow, steps |
| 5 | Practical example | 45 to 60 s | The concept applied to a business workflow. Kito demonstrates step by step. | demo, screen |
| 6 | Safety lesson | 20 s | Validation, permissions, privacy, human approval. The Gatekeeper speaks. | bullets |
| 7 | Action step | 15 s | One thing the viewer can try today. | statement |
| 8 | Closing | 8 s | Signature line by Tanyi, plus the next episode. | outro |

Spoken word budget: about 140 words per minute. A 3 minute episode is about 420 spoken words across 12 to 20 lines.

### Season 1 episode list

1. Chatbot or AI Agent: What Is the Difference? (pilot, built)
2. What Really Happens When You Ask AI a Question?
3. Prompting vs. Context Engineering
4. From Chatbot to AI Agent
5. The Five Parts of an AI Employee
6. Why AI Hallucinates
7. How RAG Gives AI a Reliable Memory
8. AI Agents Need Tools, and Permissions
9. When Should a Human Approve the AI's Work?
10. How Multiple AI Agents Work as a Team
11. Building Your First AI Employee

---

## 3. Visual style guide

Look: clean flat-vector explainer on white paper, in the spirit of Professor Glitch, with our own characters.

**Colours**
| Token | Hex | Use |
|---|---|---|
| bg | #FFFFFF | page background |
| bg2 | #F6F7FA | floor, secondary surfaces, inactive cards |
| ink | #0F172A | all headline and body text, arrows |
| muted | #64748B | secondary text |
| faint | #CBD5E1 | disabled outlines |
| panelBorder | #E6E8EE | card borders |
| accent (amber) | #F5B700 | kicker labels, active step, progress bar, highlight box on the signature line |
| accentInk | #7A5A00 | text on amber when needed |
| blue | #2563EB | second accent: emphasis text, numbered bullets, "AI Agent" column, user chat bubbles |
| blueSoft | #DBEAFE | soft blue fills |
| teal | #0D9488 | done states, approve buttons |
| tealSoft | #CCFBF1 | soft teal fills |
| coral | #E11D48 | danger, Gatekeeper |
| violet | #7C3AED | Hallucinator, flow node 2 |

**Typography:** Inter (Google Fonts) weights 500, 700, 900. Headlines 900 with negative letter spacing (-1 to -3 px). Body 500. Monospace for code: JetBrains Mono / Menlo.
Sizes at 1920x1080: title 100, statement 62, section title 48 to 52, bullets 40, captions 44 (portrait 46), kicker 22 uppercase with letter spacing 2.

**Surfaces:** cards with 24 px radius, 2 px #E6E8EE border, shadow `0 18px 50px rgba(15,23,42,0.10), 0 2px 6px rgba(15,23,42,0.06)`. Active cards get a coloured 2 to 3 px border and a soft glow ring.

**Background:** white, faint dot grid (2 px dots every 44 px at 6% ink), one amber radial wash top right and one blue wash bottom left drifting slowly, a floor band (#F6F7FA) below 84% of the height (86% in portrait) with a 2 px border line. Characters stand on the floor line.

**Branding:** top left wordmark "AI with Hippolyte" with an amber square "H" badge; top right pill "EP 01"; bottom edge 8 px progress bar in amber.

**Layout, landscape 1920x1080:**
- Content panel: x 5%, y 15%, w 58%, h 61%. Wide scenes (demo, flow): w 64%.
- Stage for characters: right side, x 66% to 96%, standing on the floor at 84%. Dialogue scenes: characters spread across the centre 76%.
- Title and outro: centred, no panel.
- Captions: centred, 92 px above the bottom, max 70% width.

**Layout, portrait 1080x1920:**
- Content panel: x 5%, y 10%, w 90%, h 37%.
- Captions: top at 48.5%.
- Characters: bottom band, standing on the floor at 86%, about 27% of the height tall.

**Motion rules:**
- Entrance: spring pop with slight overshoot (damping 14, stiffness 140), 40 px rise, scale 0.92 to 1. Items stagger 8 to 14 frames apart.
- Arrows draw on with a dash offset over 12 frames; nodes activate in order with a soft glow ring and a 1.5% pulse.
- Demo windows switch with a pop (scale 0.6 to 1). Cursor moves with a slow spring and clicks with a ring ripple.
- Characters idle-bob 3 px, blink every 110 to 180 frames, mouths open with audio loudness while their line plays. Active speaker gets a coloured name tag and drop shadow.
- No camera shake, no glitch effects, no particle noise. Calm, deliberate, readable.

**Captions:** white pill with 2 px border and shadow, Inter 900, ink text; the word being spoken gets a filled rounded chip in the speaker's caption colour with white text. Pages combine about 1.8 s of words, break on silences over 0.5 s.

**Output:** 30 fps, H.264, CRF 18 final, CRF 30 at half scale for previews. 16:9 for YouTube, 9:16 for Shorts, Reels and TikTok.

---

## 4. Episode file specification

Location: `episodes/<id>/episode.json`. Ids are `ep001`, `ep002`, ...

```json
{
  "id": "ep006",
  "series": "AI With Hippolyte",
  "tagline": "Complex AI. Explained visually. Built practically.",
  "episode": 6,
  "title": "Why AI Hallucinates",
  "background": "workshop",
  "scenes": [ ... ]
}
```

Each scene:
```json
{
  "id": "hook",
  "type": "statement",
  "label": "Hook",
  "characters": ["tanyi"],
  "onScreen": { ... },
  "lines": [
    { "speaker": "tanyi", "text": "Spoken sentence.", "expression": "confident", "gesture": "explain" }
  ]
}
```

Scene types and their `onScreen` fields:

| type | onScreen | Notes |
|---|---|---|
| title | `title`, `subtitle` | centred, no characters |
| statement | `text`, `emphasis`, `illustration` | big claim plus a blue second line with a marker underline; optional illustration beside it |
| bullets | `title`, `items[]` (strings or `{icon, text}`) | numbered or icon-badged, staggered |
| steps | `title`, `steps[{label, icon}]` | horizontal chips with connectors |
| flow | `title`, `nodes[{label, icon, sub, color}]` | diagram; arrows draw on; one node activates per line when counts match, otherwise evenly |
| diagram | `title`, `cols`, `nodes[{id, label, sub, icon, col, row, color, shape: box/pill/cylinder, illustration}]`, `edges[{from, to, label, style: solid/dashed, kind: arrow/line/x}]`, `groups[{label, cols:[a,b], rows:[a,b], color}]` — boxes and connectors on a grid; one node activates per line; edges draw on; `x` marks a blocked path |
| examples | `title`, `items[{icon, label, text, illustration}]` — real-world uses as icon tiles, one activates per line |
| demo | `title`, `app`, `steps[{title, detail, ui}]` | numbered rail plus a mock app window; one step per line when counts match |
| compare | `left{title, items[]}`, `right{title, items[]}` | right column lights up when line 2 starts |
| dialogue | `caption` | characters take the stage; caption pill at the top |
| screen | `src`, `startMs`, `muted`, `zoom[{atMs, x, y, scale}]`, `title` | real screen recording from `public/` with zoom keyframes |
| code | `title`, `code` | dark code block revealed line by line |
| outro | `line`, `emphasis`, `cta` | signature closing |

**Icons** are real vector icons by name (lucide set, kebab-case: `calendar`, `database`, `shield-check`, `truck`, `users`, `headset`, `brain`, `search`, `globe`, `layers`, `message-square`, `wrench`, `zap`, `target`, `smartphone`, `wifi-off`, `lock`, `file-text`, `sprout`, `store`, `landmark`, `stethoscope`, `graduation-cap`…, 1,800 available). Emoji still render but are not preferred. **Illustrations** are named flat drawings: phone, laptop, server, database, document, cloud, shield, person, farm, truck, envelope, calendar, storefront, clinic, chat, robot. **Markers**: the active node, tile or emphasis gets a hand-drawn amber circle, box or underline that draws itself on.

Top-level `cuts`: `[{"id": "short1", "targetSec": 45, "scenes": ["hook", "four-parts", "safety", "outro"]}]`. A cut reuses the episode's audio and captions, re-timed, and renders with `npm run render epNNN -- --cut short1`.

Demo `ui.kind` values and fields:
- `chat`: `messages[{from: "user"|"agent", text}]`
- `calendar`: `days[]`, `slots[{day, hour (9..13), label, highlight}]`
- `email`: `to`, `subject`, `body[]` (types itself)
- `approval`: `title`, `summary[]`, `approve`, `reject`, `clickAt` seconds (cursor clicks approve)
- `list`: `title`, `items[{text, done}]`
- `text`: `title`, `lines[]`

Line fields: `speaker` (cast id), `text` (spoken), `expression`, `gesture`, optional `audio` (recorded narration path under `public/`, with optional sibling `.words.json`), optional `voice`, `rate`, `pitch` overrides.

Timing is automatic: each line is synthesized, lines are spaced 350 ms apart, scenes 700 ms apart with a 400 ms lead-in, minimum 2.5 s per scene. Captions come from word timestamps.

---

## 5. Production pipeline

Project: `~/dev/ai-workshop-studio` (Remotion 4, React, TypeScript, Node 26). Run from that folder.

| Step | Command | Produces | Owner |
|---|---|---|---|
| Script | `npm run script -- "Topic" --episode N` | `episodes/epNNN/episode.json` via the Claude Code CLI with `SERIES.md` as the brief | Script Writer |
| Voice | `npm run voice epNNN` | `public/episodes/epNNN/build.json` and one audio file per line with word timings (Edge TTS, cached by text hash) | Voice Producer |
| Stills | `npx remotion still src/index.ts Landscape out/x.png --frame=N --props='{"episodeId":"epNNN"}'` | a frame to check layout | QA |
| Preview | `npm run render epNNN -- --format both --preview` | half-resolution MP4s in `out/epNNN/` | Render Operator |
| Final | `npm run render epNNN -- --format both` | full-quality MP4s | Render Operator |
| Studio | `npm run dev` | Remotion Studio to scrub through an episode | anyone |
| Voice audition | `node scripts/sample-voices.mjs "line" en-US-AndrewNeural en-CA-LiamNeural` | mp3 samples in `out/voices/` | Voice Producer |

Key files:
- `SERIES.md` series bible (what the script generator reads)
- `characters/characters.json` cast, voices, colours, pronunciations
- `episodes/<id>/episode.json` scripts
- `src/theme.ts` colours and fonts; `src/layout.ts` boxes; `src/scenes/*.tsx` scene components; `src/characters/Placeholder.tsx` SVG cast; `src/components/Captions.tsx`, `Brand.tsx`, `Background.tsx`, `Stage.tsx`
- `public/characters/<id>/` optional drawn character packs (`poses/`, `expressions/`, `gestures/`, `mouth/` PNG layers on one canvas); when present they replace the SVG placeholder automatically
- `public/screen/` screen recordings; `public/music/` optional bed music
- `CLAUDE.md` instructions for any Claude Code session in the repo; `README.md` human guide

Voice engines: `edge` (default, fast, free). `f5` local voice cloning exists but is off; it needs a clean real recording, and a clip from a produced video was not good enough.

---

## 6. Quality gates (definition of done)

**Script gate (before voice):**
- Follows the 8-beat format and the word budget.
- Hook is concrete and consequence-driven. Action step is one thing, doable today.
- Every claim is defensible. No statistics without a source the host has actually seen.
- Cast used correctly; Gatekeeper appears in the safety beat; Tanyi speaks the closing line.
- Each scene's `onScreen` supports the spoken words (does not repeat them verbatim, does not contradict them).
- Demo and flow scenes have the same number of steps or nodes as lines, so they animate in sync.
- Spoken numbers in words; on-screen numbers as digits. Names spelled canonically (the pronunciation map handles speech).

**Voice gate:** all lines synthesized; total length within 2 to 4 minutes; no line over 15 seconds; captions readable (word timings present).

**Visual gate (stills of every scene type used, both orientations):** nothing overlaps the characters or captions; text fits its card; characters stand on the floor line; active speaker is highlighted; portrait layout has content on top, captions in the middle, characters at the bottom.

**Final gate:** both MP4s play with audio, durations match `build.json`, progress bar ends at the last frame, signature line present, no real name on a character.

---

## 7. Workshop Crew roster (agents)

**Installed in the project (2026-09-04, eight employees).** The roles below map onto the skills in `.claude/skills/` and subagents in `.claude/agents/`, adapted from the "AI Workshop Animation Team" package (originals in `team/original/`). Binding rules: `team/CONTRACT.md`. Story concepts: `team/STORY-BANK.md`. Entry point: `/ai-workshop-showrunner`. Six approval gates: brief, story, script, storyboard, preview, publication.

| Installed skill | Role in this section | Gate it serves |
|---|---|---|
| ai-workshop-showrunner | Showrunner | all five gates |
| ai-lesson-researcher | Researcher | feeds story and script |
| african-ai-story-director | (new) African AI Story Director: setting, user, artifact, constraints, agency, ownership, authenticity review | 2 Story, reviews at 3 and 4 |
| ai-learning-designer | (new) Learning Designer: objective, sequence, analogy, comprehension check | feeds script |
| ai-animation-scriptwriter | Script Writer + Script Editor | 3 Script |
| ai-storyboard-director | Scene Designer | 4 Storyboard |
| ai-animation-producer | Voice Producer + Render Operator | 5 Preview, finals |
| ai-animation-quality-editor | QA Reviewer (incl. African authenticity) | 5 Preview, 6 Publication |

Renderer Engineer and Publisher remain roles for a person or a future agent; the Showrunner writes `publish.md` itself for now.

### Prompt to start an episode
> Use /ai-workshop-showrunner to create an episode of AI With Hippolyte: The AI Workshop about <topic>. Ground it in <African place, community or market> and follow the crew building <useful product or service> for <real user>. Show the local constraints, testing, human responsibility and ownership. Treat it as a fictional teaching scenario unless a case study is verified. The audience is <audience>. Target three minutes for YouTube and a 45-second vertical version. Stop for my approval after the brief, story, script, storyboard and preview. Do not publish without my explicit approval.


Each member below can be created as an agent. The prompt block is written to be pasted as the agent's system instructions. All members read this handbook, `SERIES.md` and `CLAUDE.md` before acting.

### 7.1 Showrunner (orchestrator)
Role: owns an episode from topic to final files. Assigns work, enforces gates, keeps the season log.
Inputs: topic, episode number, any research notes. Outputs: approved episode.json, final MP4s, publishing kit.
Prompt:
> You are the Showrunner of the Workshop Crew for "AI With Hippolyte: The AI Workshop". You take a topic and drive it through: research brief → script → script review → voice build → stills check → preview → final render → publishing kit. You never write the script yourself; you delegate to the Script Writer and gate its output with the Script Editor. You enforce the handbook's non-negotiables and quality gates and refuse to advance an episode that fails a gate. You keep `episodes/<id>/notes.md` with decisions, open questions and what changed between versions. Report status as: beat coverage, word count, duration, gates passed, blockers.

### 7.2 Researcher
Role: produces a research brief with defensible claims, examples (at least one African) and analogies.
Prompt:
> You are the Researcher of the Workshop Crew. For a given episode topic, produce `episodes/<id>/research.md` with: a plain-English explanation of the concept in five sentences, three analogies, two business scenarios (one African, one global) written as short stories with named roles, common misconceptions, the safety angle (permissions, privacy, approval, validation), and a claims list where each claim is marked "safe to say" or "needs a source" with the source. Never invent statistics. Prefer principles over numbers.

### 7.3 Script Writer
Role: turns the brief into `episode.json`.
Prompt:
> You are the Script Writer of the Workshop Crew. Write episodes as `episodes/<id>/episode.json` following the episode file specification and the 8-beat format exactly: hook, title, problem, visual explanation, practical example, safety lesson, action step, closing. Target about 140 spoken words per minute for a 2 to 4 minute episode. Use the cast by id: tanyi explains, amara asks, kito demonstrates, hallucinator interferes, gatekeeper guards. Use scene types deliberately: compare for two-way contrasts, flow for processes, demo with a mock app for step-by-step examples (one step per spoken line), bullets for the safety lesson, statement for hook and action step. Spoken text is plain English with numbers as words; on-screen text uses digits and never repeats the narration verbatim. End with tanyi saying "Don't just use AI. Build it to work reliably." Output only valid JSON matching the pilot's structure.

### 7.4 Script Editor
Role: reviews scripts against the bible and the script gate; edits for clarity and pacing.
Prompt:
> You are the Script Editor of the Workshop Crew. Review `episodes/<id>/episode.json` against the handbook's script gate. Check beat order and timing, word budget, claim safety, cast usage, on-screen text versus narration, step-to-line counts in demo and flow scenes, spoken numbers as words, canonical name spellings, and the signature closing. Tighten sentences to one idea each. Return the corrected JSON plus a short change list. Do not change the visual style, the cast or the format.

### 7.5 Scene Designer
Role: makes sure every scene's `onScreen` is the best visual for the words; designs demo mock UIs and flow diagrams.
Prompt:
> You are the Scene Designer of the Workshop Crew. For each scene in an episode, choose the scene type and write the `onScreen` block so the visual teaches what the narration says: a flow for processes, a compare for contrasts, a demo with chat, calendar, email, approval, list or text windows for step-by-step examples, a screen scene when a real recording exists. Keep on-screen text short (under 8 words per item). Match the number of demo steps or flow nodes to the number of lines. Respect the style guide; you cannot add new colours, fonts or scene types. If a needed scene type does not exist, write a one-paragraph spec for the Renderer Engineer instead of hacking around it.

### 7.6 Voice Producer
Role: runs the voice build, checks pronunciations and timing.
Prompt:
> You are the Voice Producer of the Workshop Crew. Run `npm run voice <id>`, then inspect `public/episodes/<id>/build.json`: total length 2 to 4 minutes, no line over 15 seconds, every line has word timings. Add mispronounced names to `_pronunciations` in `characters/characters.json` (spoken form only; captions keep the spelling). Voice assignments are fixed per character; propose a change with audition samples from `scripts/sample-voices.mjs`, never by editing silently.

### 7.7 Render Operator
Role: stills, previews, finals; keeps `out/` organised.
Prompt:
> You are the Render Operator of the Workshop Crew. Produce stills for every scene type used in the episode in both orientations, then a half-resolution preview with `npm run render <id> -- --format both --preview`, and only after the visual gate passes, the final render without `--preview`. Verify each MP4 has audio and the expected duration. Never edit source files; report rendering problems to the Renderer Engineer with the frame number and a still.

### 7.8 QA Reviewer
Role: applies the visual and final gates; watches the previews like a viewer.
Prompt:
> You are the QA Reviewer of the Workshop Crew. Check stills and previews against the visual gate and final gate in the handbook: overlaps, clipped text, characters off the floor, wrong speaker highlighted, captions covering faces in portrait, missing signature line, any real name used for a character, pacing dead spots longer than 1.5 seconds. Report findings as a numbered list with frame numbers and the file to fix, ordered by severity. Approve only when the list is empty.

### 7.9 Renderer Engineer
Role: the only member allowed to change renderer code, and only on request.
Prompt:
> You are the Renderer Engineer of the Workshop Crew. You maintain the Remotion project in `~/dev/ai-workshop-studio`. You add scene types, mock UI kinds and character packs on request, keeping the style guide intact: same tokens in `src/theme.ts`, same layout boxes, same motion rules. Every change is verified with stills in both orientations before you report it done. You never change colours, fonts, cast or layout without written approval, and you update `CLAUDE.md` and `TEAM.md` when you add a capability.

### 7.10 Publisher (later)
Role: titles, descriptions, thumbnails brief, shorts selection, LinkedIn post, newsletter blurb.
Prompt:
> You are the Publisher of the Workshop Crew. From a finished episode produce `episodes/<id>/publish.md`: three title options under 60 characters, a YouTube description with timestamps from `build.json`, tags, a thumbnail brief in the style guide's colours, three short-clip suggestions with start and end times and a hook line each, a LinkedIn post in the host's voice, and a two-paragraph newsletter blurb. Always include the call to action agreed for the season. Never publish; you prepare.

---

## 8. Skills to create (slash commands)

| Skill | What it does | Steps |
|---|---|---|
| `/new-episode "Topic" N` | full pipeline to preview | Researcher brief → Script Writer → Script Editor → Scene Designer pass → `npm run voice` → stills → preview → QA report |
| `/review-script epNNN` | script gate only | Script Editor checklist, returns corrected JSON and change list |
| `/design-scenes epNNN` | improve visuals | Scene Designer rewrites `onScreen` blocks, keeps lines |
| `/build epNNN` | voice + preview | `npm run voice`, stills for each scene type, preview render |
| `/qa epNNN` | visual and final gates | stills both orientations, report |
| `/final epNNN` | final render | only if `/qa` passed; full-quality both formats |
| `/publish-kit epNNN` | publishing assets | Publisher output |
| `/style-check` | drift detection | diff `src/theme.ts`, `layout.ts`, `characters.json`, `SERIES.md` against the last approved commit and report any change |
| `/new-mock-ui` | extend demo scene | Renderer Engineer adds a `ui.kind` with a spec and stills |

---

## 9. Season log format

Keep `SEASON.md` at the project root:

```
| Ep | Title | Status (brief/script/voice/preview/final/published) | Duration | Notes |
```

---

## 10. Pilot reference (built)

`episodes/ep001/episode.json`: "Chatbot or AI Agent: What Is the Difference?" — 9 scenes, 19 lines, about 2 minutes.
Beats: statement hook → title → dialogue (Amara asks Tanyi about a chatbot that "gave steps but did nothing") → compare (Chatbot vs AI Agent) → demo (Kito: chat goal, calendar check with Tuesday 10:00 highlighted, invitation typing itself, approval click by the Gatekeeper) → flow (Goal → Reasoning → Tools → Action, one node per line) → bullets safety lesson (Gatekeeper then Tanyi) → statement action step → outro signature.
Use it as the structural template for every new script.

---

## 11. Roadmap

1. Character pack artwork for Tanyi, Amara and Kito (replaces SVG placeholders automatically).
2. Real narration option: record Tanyi's lines, drop them in with `audio`, align words with Whisper.
3. Screen recording import from Screen Studio with zoom keyframes for real tool demos (n8n, Claude Code, Gmail).
4. More mock UI kinds: spreadsheet, CRM record, terminal, n8n canvas.
5. Short-clip cutter: render a scene range as a 9:16 clip with its own hook card.
6. Web dashboard (FastAPI + Supabase): episode list, script editor, storyboard cards, render centre, approvals.
7. Automated publishing and analytics feedback into topic selection.
