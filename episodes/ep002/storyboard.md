# Storyboard — ep002 v2: What Really Happens When You Ask AI a Question?

Storyboard Director pass over the gate-3-approved `episodes/ep002/episode.json`. Changed: `onScreen` blocks, one scene `type` (challenge: statement → bullets), scene `label` (challenge), `expression` and `gesture` per line, `cuts`. Unchanged: every spoken `text` and `speaker` (27 lines, verified identical to the approved file), scene ids and order, cast. `node scripts/validate.mjs ep002`: 12 scenes, 485 words, ~3.5 min, 0 errors, 0 warnings.

Duration estimates: 140 wpm plus 400 ms lead-in, 350 ms between lines, 700 ms after each scene, 2.5 s scene minimum (title 5 s hold). Total ≈ 3 min 51 s.

## Scene table
| # | Scene | Est. | Teaching purpose | Type | Composition (landscape / portrait) | Characters and gestures | On-screen text (summary) | Transition |
|---|---|---|---|---|---|---|---|---|
| 1 | hook | 15.6 s (33 w) | A confident answer with no context and no source is the problem | statement | Card left 58% / card top 37% | tanyi right, explain → surprised + warning when the wrong answer lands | "Brown cocoa pods near Kumba. The chatbot: 'Spray product X at dose Y.'" / blue: "No question about her farm. No source." | pop-in card |
| 2 | title | 5.0 s hold | Name the episode, declare fictional status | title | centred, no characters | none | Title; subtitle "Tokens · prediction · context · tools. Built with a cocoa cooperative near Kumba."; disclosure pill (auto from `disclosure`) | scene gap |
| 3 | listening | 27.1 s (59 w) | The users state the need and the rules in their own words | demo (chat, chat, text) | rail 38% + Messages window 64% wide / rail row above window | amara (confused → serious, point_left), tanyi (confident, point_left); both on the right stage | Step 1 Ebot: two blue bubbles (14, 15 words). Step 2 Njume: three grey bubbles (16, 14, 10 words). Step 3 "What the chatbot had": Her farm: unknown / Source: none / Product and dose: named anyway | window pop per step |
| 4 | decide | 24.1 s (52 w) | What AI should and should not do, decided from Ebot's and Njume's rules | compare | two cards, right lights up at line 2 / stacked cards | tanyi (serious → confident, point_left), gatekeeper (serious, warning) | Left "General chatbot": Her farm: unknown to it / Predicts a fluent answer / No source, names a product anyway. Right "Cooperative assistant": Asks about her farm first / Reads only Njume's sheet, shows source / Product and dose: to Njume, never the model | right column activates |
| 5 | decide-flow | 29.6 s (64 w) | Tokens → predict → context → tool, one node per line | flow | 4 nodes in a row / 2×2 grid | tanyi, point_left ×3, explain on the tool line | Title "From your question to its answer". Tokens 🔤 Words, parts, characters · Predict 🎲 Guesses the next word · Context 🧠 All it can see right now · Tool 🔎 Pulls in a checked page | arrows draw on |
| 6 | build | 29.1 s (63 w) | Context form, read-only sheet, retrieval, sourced answer | demo (list, list, text, chat) | rail + Assistant window | kito (happy, point_left; confident, explain; happy, point_left), amara (confused, point_left) | Steps: Ask first / Njume's guidance sheet / Retrieval (tool call: sheet.search) / Answer with source. Sheet entries 3, 4 (highlighted), 5. Context block 4 lines. Answer + separate source bubble | window pop per step |
| 7 | constraint-fix | 25.8 s (56 w) | Hallucination: fluent, wrong, rewarded by training | demo (chat, chat, text) | rail + test-run window; three on the right stage | hallucinator (confident, explain), kito (serious, point_left), tanyi (serious, explain) | Same question twice: "Spray product X at dose Y every week. Problem solved." vs "Not covered by the guidance sheet. Sent to Njume". Card: Rewarded in training: a confident guess / "I don't know" scores nothing / Registered products, labels, safety: unchecked / Fluent is not the same as right | window pop per step |
| 8 | constraint-outage | 15.6 s (33 w) | Design for a failing network: queue and human fallback | demo (text, list) | rail + offline window | tanyi (serious, point_left), kito (confident, point_left) | Connectivity card: one documented-outage line (wording unchanged from gate 2) + design rule. Queue: Ebot · brown pods · queued / Sends when the network returns / Unanswered → Njume by text or visit | window pop |
| 9 | user-test | 15.2 s (32 w) | Ebot tries it: asks first, sourced answer, escalation card | demo (chat, approval) | rail + Assistant window; cursor clicks "Send to Njume" at 2.2 s | kito (happy, point_left), gatekeeper (confident, point_left toward the card) | 4-turn chat ending with entry-4 answer + source. Approval: "Product and dose: send to Njume" / 3 summary lines / Send to Njume · Hold for Njume's visit | click ripple |
| 10 | ownership | 24.2 s (53 w) | Owner, maintainer, data, value, accountability | bullets | numbered card / card | gatekeeper (serious, point_left), tanyi (confident, explain) | The cooperative owns sheet and assistant / Njume writes the sheet; the AI only reads / Questions, locations, value stay with members / Accountable: the cooperative and its agent | stagger |
| 11 | challenge | 12.2 s (26 w) | One copyable build challenge | bullets (was statement) | numbered card | tanyi (happy, explain) | "Your build challenge": Pick one question you ask AI at work / Write down the context it needs / Add: "tell me where this comes from" / Compare the two answers | stagger |
| 12 | outro | 7.1 s (14 w) | Signature closing | outro | centred | tanyi (confident, point_right) | Don't just use AI. / Build it to work reliably. / Next episode: Prompting vs. Context Engineering | amber highlight pop |

## Readability decisions (measured against the renderer)
- Chat bubbles: all ≤ 17 words. Portrait chat window inner height is 336 px; the four-turn user-test chat sums to ≈ 324 px (three one-line bubbles + one two-line bubble), so its last answer carries a compressed source line ("Source: entry 4, by Njume"). Njume's three bubbles were shortened from the authenticity-review wording to fit the same box; meaning kept (covers all farms alone, many farmers never see an extension officer, keeps the advice sheet, products and doses come to him).
- Compare columns reduced from 4 to 3 rows each. In portrait the two stacked cards with 4 rows measure ≈ 838 px against a 710 px content box and would run 100+ px into the caption band; with 3 rows they measure ≈ 713 px. No idea was dropped: "no source" and "names a product anyway" share a row; "reads only the sheet" and "shows source" share a row.
- Ownership merged from 5 to 4 rows: "Questions and locations are cooperative data" and "any value stays in the cooperative" became "Questions, locations, value stay with members". "Accountable: the cooperative and its agent" kept. Five wrapped rows measured ≈ 796 px inside a 622 px portrait panel.
- Title scene: the subtitle no longer repeats the disclosure, which the Title component already renders as a pill.
- Demo step titles are ≤ 4 words so the portrait rail wraps to at most two rows; details show only on the active step.
- Flow nodes: each has an icon and a 3–5 word sub; the title was shortened to six words. Node subs paraphrase rather than repeat the narration.
- Build answer split into an answer bubble and a separate source bubble, so the source line is visually distinct; the answer now mirrors entry 4 (authenticity review item 9) instead of the older "keep up sanitation" wording.
- The 2017 outage: one spoken line; on-screen wording kept exactly as reduced after gate 2.

## Continuity report
- Reused assets only: background "workshop", the five placeholder characters, existing scene types (statement, title, demo, compare, flow, bullets, outro) and existing demo ui kinds (chat, list, text, approval). No screen recording (`public/screen/` is empty), so all app views are mock-ups.
- Style-file change requests: none. `src/theme.ts`, `src/layout.ts`, `Background.tsx`, `Placeholder.tsx`, `characters.json` untouched.
- Known layout limit to check at preview: constraint-fix places three characters on the landscape demo stage (461 px). Placeholder widths are about 248 (tanyi), 191 (kito) and 205 px (hallucinator), so adjacent figures overlap by roughly 50–70 px at the arms. Portrait has no overlap. If the Quality Editor finds it distracting, the only no-style-change option is to drop the hallucinator from `characters` and let its line play from the chat bubble; the alternative (a wider demo stage) would be a `layout.ts` change and needs Hippolyte's approval.

## Contextual-accuracy notes
- Place names on screen: Kumba, Meme division (both in the story brief, B2/B4). No village named. "Cameroon" appears only in the disclosure pill.
- Cooperative name: "Meme Cocoa Farmers Cooperative Society" (fictional, OHADA style, confirmed by Hippolyte at gate 3) as the app title of the Messages and Assistant windows.
- Currency: none used anywhere.
- Languages: English only on screen; no Pidgin scripted or shown.
- Products and doses: only the placeholders "product X" and "dose Y", spoken by the hallucinator and shown once in the chatbot bubble; never in an assistant answer. Guidance sheet entry 4 carries the B13/B15 practice wording only (take off diseased pods, keep the farm clear, spray on the cooperative's schedule).
- No statistics, ratios or infection rates on screen. The outage card says "months without internet in this region (2017)" and nothing about cause.

## Cost estimate
$0. JSON and storyboard written by the agent; no `npm run script`, no external image or video service, no paid voices.

## Items flagged for enhanced review (gate 4 and preview)
1. **The chatbot's wrong answer** (hook text, constraint-fix step 1): "Spray product X at dose Y every week. Problem solved." Confirm the placeholder form is acceptable and that nobody could read it as advice.
2. **Guidance sheet wording** (build step 2, echoed in the build and user-test answers): entry 4 "Black pod after heavy rain: take off diseased pods, keep the farm clear, spray on the cooperative's schedule". Longest on-screen item (wraps to 3 lines in landscape).
3. **Approval card** (user-test step 2): "Product and dose: send to Njume" / approve "Send to Njume" / reject "Hold for Njume's visit". Confirm the reject label reads as a hold, not a discard.
4. **Outage line** (constraint-outage): spoken line unchanged; on-screen "Documented: months without internet in this region (2017)". Confirm one mention on screen is still the gate-2 intent.
5. **Three-character stage** in constraint-fix (see continuity report).
6. **Portrait fit** of the user-test chat and the ownership bullets: both computed to fit with under 15 px to spare; confirm on the 9:16 stills.
7. **Njume's shortened bubbles** (listening step 2): the authenticity reviewer's sentences were compressed for the portrait box; confirm they still read as a field agent texting.

## Asset requests
None required. For a future episode where Ebot or Njume should appear on stage: a guest character pack (`public/characters/<id>/` with poses/, expressions/, gestures/, mouth/ on one canvas) for an adult woman cocoa farmer and an adult male field agent, drawn in the placeholder style (flat vector, same proportions as tanyi/amara), would let a real user speak instead of being relayed by amara. Spec only; not needed for ep002.

## Cut: short1
Scenes `hook` → `constraint-fix` → `outro`. 103 spoken words; ≈ 49 s with gaps at 140 wpm (target 45 s). Vertical composition: hook card on top, three characters across the bottom band in constraint-fix (no overlap in portrait), outro centred. If it must land under 45 s at voice build, the scriptwriter's fallback (drop the hook's first line in the cut only) needs a Showrunner decision; the storyboard does not cut lines.

## Not reviewed
- Rendered stills: no `build.json` exists for ep002 yet (voice step not run), so every fit figure above is computed from the component code, not from a frame.

## Wording proposals for the Scriptwriter (not applied)
None. All line text stands as approved.

---
```
Episode: ep002 v2 · Stage: Storyboard · Status: needs-review
Inputs used: team/CONTRACT.md, .claude/skills/ai-storyboard-director/SKILL.md, TEAM.md §3–4, CLAUDE.md, episodes/ep001/episode.json, src/scenes/Demo.tsx, src/scenes/SceneView.tsx, src/scenes/Panel.tsx, src/layout.ts, src/components/Stage.tsx, src/characters/Placeholder.tsx, episodes/ep002/{story-brief.md, script-v2.md, authenticity-review-v1.md, episode.json, status.json}
Deliverable: episodes/ep002/episode.json (onScreen, type/label of challenge, expressions, gestures, cuts), episodes/ep002/storyboard.md
Assumptions: portrait fit computed from component metrics (no stills rendered); compare 3 rows and ownership 4 rows chosen to fit the 9:16 content box; Njume's bubbles shortened with meaning kept; three characters on the constraint-fix stage accepted with a small landscape overlap
Open questions: (1) accept 3 compare rows per column instead of 4; (2) accept the constraint-fix three-character overlap or drop the hallucinator from the stage; (3) cut short1 estimates 49 s vs 45 s target, keep as is or shorten at voice build
Claims: 22 safe / 10 recheck / 3 blocked (unchanged from the ledger; no new claims on screen)
Rights concerns: none
Next: Showrunner (gate 4 review with Hippolyte), then Animation Producer (npm run voice ep002, preview render)
```
