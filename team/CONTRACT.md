# Workshop Crew — Working Contract

Read this before any episode work. It binds the eight AI employees together.

## Identity
- Series: **AI With Hippolyte: The AI Workshop**. Tagline: Complex AI. Explained visually. Built practically.
- Host character: **Tanyi** (id `tanyi`, spoken "Tang-yee"). The real host's name appears only in the series title, never as a character.
- Cast ids: `tanyi` (host, explains), `amara` (learner, asks), `kito` (small robot assistant, demonstrates and makes believable mistakes), `hallucinator` (confident wrong output), `gatekeeper` (permissions, privacy, human approval). No other characters exist. Never rename them.
- Bible: `SERIES.md`. Style and spec: `TEAM.md`. Renderer instructions: `CLAUDE.md`.

## Files per episode (`episodes/epNNN/`)
| File | Written by | Gate |
|---|---|---|
| `episode-brief.md` | Showrunner | 1 Brief |
| `evidence-pack.md`, `claim-ledger.csv` | Lesson Researcher | feeds 2 and 3 |
| `story-brief.md` | African AI Story Director | 2 Story |
| `learning-design.md` | Learning Designer | feeds 3 |
| `episode.json` | Scriptwriter (lines) + Storyboard Director (`onScreen`, scene types, characters) | 3 Script, 4 Storyboard |
| `script-vN.md` | Scriptwriter | 3 Script |
| `storyboard.md` | Storyboard Director | 4 Storyboard |
| `status.json` | Showrunner | tracks all gates |
| `public/episodes/epNNN/build.json` (+ audio) | Animation Producer via `npm run voice` | feeds 5 |
| `out/epNNN/*-preview.mp4`, `out/epNNN/stills/` | Animation Producer via `npm run render -- --preview` | 5 Preview |
| `quality-report.md` | Quality Editor | 5 Preview / 6 Publication |
| `out/epNNN/*.mp4` finals, `publish.md` | Animation Producer, then Showrunner | 6 Publication |

`episode.json` is both the script and the scene manifest. Spoken lines live in `scenes[].lines[]`; visuals live in `scenes[].onScreen`; vertical cutdowns in `cuts[]`. Specification: `TEAM.md` section 4.

## Six human-approval gates (Hippolyte decides)
1. **Brief** — audience, objective, duration, platforms, characters, call to action, proposed African setting and build.
2. **Story** — the African story brief: setting, user, need, artifact being built, local constraints, agency, ownership, authenticity risks, fictional-versus-verified status.
3. **Script** — every spoken line and claim, in `episode.json`.
4. **Storyboard** — scene types, `onScreen` visuals, contextual accuracy, character placement, any new asset or scene type request, cost estimate.
5. **Preview** — half-resolution MP4s in both formats plus the quality report, including the African-authenticity review.
6. **Publication** — explicit authorization to post anywhere. The team never publishes.

The Showrunner stops at each gate: it presents the deliverable, records `"pending"` in `status.json`, and ends its turn asking for approval. It resumes only when Hippolyte answers. Approval wording must be explicit ("approved", "go ahead"). Silence is not approval. If Hippolyte requests changes, the affected artifact is versioned (`version` in `status.json`) and the gate is presented again.

## Cost and retry controls
- Production runs at $0. Voices (Edge TTS), captions, previews and finals are local and free. Script drafting and publishing kits in the Studio run on a local model through Ollama (engine setting in `studio/settings.json`); the Claude CLI engine is optional and is only used when Hippolyte switches it on. Inside a Claude Code session the crew agents draft scripts themselves. Never call a paid API. Report any step that would cost money before running it.
- Default product is the short format (45–60 s) from `SERIES.md`; long build-story episodes only when the brief asks for one.
- Retry a failed tool step at most twice, then report. Never regenerate a subjective creative result more than once without a specific reason.
- Preview (`--preview`) before final. Finals only after gate 4.
- Never install paid services, buy credits, or call external generative image or video APIs without written approval.

## Rights, consent, copyright
- Voices are stock neural voices configured in `characters/characters.json`. Never clone any real person's voice without their written consent recorded in `status.json`. The host's voice is not cloned.
- Do not imitate Professor Glitch's characters, catchphrases, scripts or visual identity. Inspiration is limited to clarity, pacing and the explainer format.
- Screen recordings and any imported media must be listed in `status.json.assets` with source and rights.
- No invented personal stories. Insert `[HIPPOLYTE STORY NEEDED: <prompt>]` in `script-vN.md` and ask.
- No invented statistics. Claims marked `blocked` in the ledger cannot appear in the script.

## Series learning model and story standard
- Arc of every episode: **Understand AI → Recognize Africa's opportunity → Take action.**
- BUILD lens, applied where it genuinely fits: **B**uild African capability, **U**se AI to solve African problems, **I**nvest in African innovation, **L**ead responsibly, **D**evelop African ownership.
- Story engine (default spine, see `SERIES.md`): a person meets a concrete problem → the crew listens to users and a local specialist → they decide what AI should and should not do → they build a small working version → a realistic constraint or failure appears → they improve data, interface, architecture or guardrails → a user tries the improved system → maintenance, accountability, data, IP and value ownership are named → viewers get one build challenge.
- Africa is the source of the problem, the knowledge, the design choices and the value. African characters are builders and decision-makers, never passive recipients. No saviour narratives, poverty spectacle, generic villages, token symbols, invented customs, invented local-language phrases, or one country standing in for the continent.
- Name a country, city, community, language or market only when research supports it. Constraints (connectivity, electricity, device cost, language, literacy, data scarcity, privacy, regulation, maintenance, affordability) are used only where they really apply, and when used they must change the design.
- Every episode declares its status: `"disclosure": "Fictional teaching scenario based on researched conditions"` or `"Based on a verified case study: <source>"`. The title scene shows it. Never imply measured impact without evidence.
- Real users and local specialists are portrayed through the mock-app UI (chat messages, lists, emails carrying their words) and through amara relaying what they said, because the animated cast is fixed. A request for a guest character pack goes to the Renderer Engineer via `storyboard.md`.
- Starting concepts live in `team/STORY-BANK.md`; each needs setting-specific research before use.

## Continuity rules
- Style files are frozen: `src/theme.ts`, `src/layout.ts`, `src/components/Background.tsx`, `src/characters/Placeholder.tsx`, `characters/characters.json` (except `_pronunciations`), `SERIES.md`. Changes require a written request in `storyboard.md` and Hippolyte's approval.
- Same background ("workshop"), same branding, same caption style, same cast look in every episode.
- Every episode ends with `tanyi` saying "Don't just use AI. Build it to work reliably."

## Handoff format (end of every stage)
```
Episode: epNNN vN · Stage: <name> · Status: needs-review | approved | blocked
Inputs used: ...
Deliverable: <file paths>
Assumptions: ...
Open questions: ...
Claims: n safe / n recheck / n blocked
Rights concerns: none | ...
Next: <role>
```

## status.json shape
```json
{
  "id": "ep006", "title": "...", "version": 1,
  "gates": {"brief": "pending", "story": "pending", "script": "pending", "storyboard": "pending", "preview": "pending", "publication": "pending"},
  "disclosure": "fictional | verified",
  "setting": {"country": "", "place": "", "community": "", "languages": [], "reviewer": "recommended cultural or domain reviewer"},
  "approvals": [{"gate": "brief", "by": "Hippolyte", "at": "2026-09-05T10:00:00Z", "note": ""}],
  "assets": [{"path": "public/screen/x.mp4", "source": "own recording", "rights": "owned"}],
  "voices": {"tanyi": "en-US-AndrewNeural (stock)"},
  "cost": {"script_usd": 0, "other_usd": 0},
  "cuts": ["short1"]
}
```
Gate values: `pending`, `approved`, `changes`.
