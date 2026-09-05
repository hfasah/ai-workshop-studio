# Quality report — ep002 v2 (preview, gate 5)

Episode: What Really Happens When You Ask AI a Question? · Reviewed 2026-09-04 by the Quality Editor.

Reviewed: `team/CONTRACT.md`, `TEAM.md` §6, `episodes/ep002/{episode-brief.md, story-brief.md, claim-ledger.csv, episode.json, storyboard.md, status.json}`, `public/episodes/ep002/build.json` and `build.short1.json`, `characters/characters.json` (`_pronunciations`), `scripts/voice.mjs` (lines 83–84), all 24 stills in `out/ep002/stills/` plus both contact sheets, and 18 frames sampled from the three previews (`out/ep002/stills/qa-*.png`). Audio measured with `ffmpeg -af volumedetect`.

## Verdict: APPROVE WITH MINOR FIXES

Nothing blocks release. The issues below are cosmetic; items 1–3 should be fixed before the final render, items 4–7 can be accepted as they are if Hippolyte prefers.

## Issues (by severity)

1. **Stale caption on the title card** — scene `title`, 15.3 s to 20.7 s, both orientations. Evidence: `out/ep002/stills/qa-L-title-pill.png` (17.5 s), `qa-P-title-pill.png`, `L-02-title.png`, `P-02-title.png`. The last caption chunk of the hook ("asked where her farm is.") stays on screen for the whole 5 s title hold and through the 6.1 s silence, overlapping the title composition. Correction: clear the caption at scene end, or at most 700 ms after the last word of a line, so the title scene shows no caption. Responsible: Renderer Engineer (caption component); Animation Producer to re-render and re-check the same frame. Regression check after the fix: `decide` at 60.7 s (`L-04-decide.png`) where the residual "the source." caption is expected to disappear inside the 350 ms line gap, and every scene-to-scene boundary (1.1 s gaps).

2. **Landscape three-character stage overlap** — scene `constraint-fix`, 128–152 s, landscape only. Evidence: `out/ep002/stills/L-07-constraint-fix.png` (142.6 s: Tanyi's left hand sits on Kito's right arm), `qa-L-cfix-halluc.png` (130 s, same). Portrait has no overlap (`P-07-constraint-fix.png`, `qa-P-cfix-tanyi.png`, `qa-S-cfix.png`). This is the limit the Storyboard Director declared and Hippolyte accepted at gate 4. It reads as crowding rather than a bug; the speaker highlight still identifies the speaker. Correction if wanted: drop `hallucinator` from `characters` in this scene only and let its line play from the chat bubble (no style change), or request a wider demo stage in `src/layout.ts` (needs Hippolyte's approval). Responsible: Storyboard Director (decision), Renderer Engineer (if the layout route is chosen). Same overlap appears in the short (`ep002-short1-9x16-preview.mp4` is portrait, so no issue there).

3. **Kito's pointing arm touches Tanyi's hand** — scene `constraint-outage`, 160.9–167.6 s, landscape. Evidence: `out/ep002/stills/L-08-constraint-outage.png` (Kito's `point_left` arm ends on Tanyi's right hand at x≈1600). Correction: use `gesture: "explain"` for Kito's line, or keep as is. Responsible: Storyboard Director.

4. **Kito partly washed out before the approval click** — scene `user-test`, about 178.9–179.2 s, landscape preview. Evidence: `out/ep002/stills/qa-L-usertest-kito.png`, `qa-L-usertest-preclick.png` (Kito's lower body looks semi-transparent), while the full-resolution still at 178.5 s (`L-09-user-test.png`) and the 180.2 s frame (`qa-L-usertest-click.png`) are clean. Likely a half-resolution encode artefact over the light floor band, but it could be the speaker-dim transition. Correction: none unless the final 1920x1080 render shows the same; Animation Producer to check the frame at 179 s in the final. Responsible: Animation Producer.

5. **Portrait caption box and name pill nearly touch** — scenes `hook` and `constraint-fix` in portrait when the caption wraps to two lines. Evidence: `out/ep002/stills/P-01-hook.png` (caption box bottom at y≈1080, Tanyi pill top at y≈1080), `qa-S-cfix.png`. No overlap, but no breathing room. Correction: optional; cap portrait caption chunks at one line (shorter chunks) or add 12 px of margin between the caption band and the name pills. Responsible: Renderer Engineer (only with Hippolyte's approval, since `src/layout.ts` is frozen); otherwise accept.

6. **Six seconds of total silence over the title** — 14.6 s to 20.7 s (700 ms scene tail + 5 s title hold + 400 ms lead-in), measured at −91 dB. This is the designed 5 s title hold from `TEAM.md`, not a fault, but it is the only gap over 1.5 s and it is long for a Shorts audience. Correction: none required; if a sound bed is ever added to the series, this is where it earns its place. Responsible: Showrunner (series decision).

7. **Level spread between voices** — 3-second spot checks: Tanyi −21.6 / −22.7 / −24.0 dB mean, Amara −23.5, Gatekeeper −22.2 / −20.1, Kito −24.4, Hallucinator −24.0; peaks −5.1 to −9.5 dB, whole files −23.8 dB mean, −5.2 dB peak. A 4.3 dB spread between the Gatekeeper's ownership line and Kito is audible but within tolerance for stock voices. Correction: optional per-character gain trim (Kito +1.5 dB, Gatekeeper −1.5 dB) at the voice step. Responsible: Animation Producer.

## Accuracy

Every spoken claim was checked against the ledger's `script_safe_wording`; all 27 lines in `build.json` are byte-identical to the approved `episode.json` lines.

| Spoken or on-screen claim | Ledger | Result |
|---|---|---|
| Ebot grows cocoa near Kumba, in Cameroon's South-West; after heavy rains her pods turn brown (hook) | B4 safe, B13 safe | matches |
| Many farmers here never see an extension officer (Njume bubble, listening step 2) | B8 safe ("more than nine in ten... no access to extension services") | weaker than the source, no number: safe |
| Tokens: words, parts of words, sometimes single characters (decide-flow 1) | A1 safe | matches |
| Trained to guess the next word from the words before it (decide-flow 2) | A2 safe | matches |
| Context is its working memory; anything not in there it does not know (decide-flow 3) | A3, A4 safe | matches |
| Alone it cannot check anything; with a tool it asks, your software fetches a checked page into its context (decide-flow 4) | A8, A9 safe | matches |
| My answer is only as good as the page I read; retrieval puts the matching entry into my context (build 3) | A9 safe | matches |
| Hallucination: a fluent answer that is wrong; OpenAI researchers showed training and testing reward a confident guess over saying I don't know (constraint-fix 3) | A7 safe | matches the safe wording; on-screen card "Rewarded in training: a confident guess / 'I don't know' scores nothing" is a fair paraphrase |
| Registered products, labels, safety: unchecked (constraint-fix card) | B16, B17 safe | supported |
| In 2017 the two English-speaking regions lost the internet for three months; on screen "months without internet in this region (2017)" (constraint-outage) | B12 safe | matches; one mention spoken, one on screen, no cause, no conflict wording: gate-2 intent respected |
| Guidance sheet entry 4: take off diseased pods, keep the farm clear, spray on the cooperative's schedule (build, user-test) | B13, B15 safe | matches; no spray counts, intervals or product names |

No `blocked` claim (A12, B19, B20) appears. No `recheck` claim appears (A11, B1, B3, B7, B18, B23 unused; names were confirmed by Hippolyte at gate 3, closing B23). No statistic, percentage, ratio, tonnage or infection rate appears anywhere. "Njume, the only field agent" describes the fictional cooperative, not an agent-to-farmer ratio. "Product X at dose Y" is spoken only by the hallucinator and shown only in the chatbot bubble and hook card, never in an assistant answer. Diagrams: the flow (Tokens → Predict → Context → Tool) shows the Tool node as a pull into context, consistent with A8; no falsehood implied.

## Learning

- Objective met: the four steps are named on the flow and repeated by Tanyi in ownership ("Tokens, prediction, context, tool"), and the reason a wrong answer sounds sure is stated with its source.
- Terms defined on first use: tokens, predict, context, tool (decide-flow), retrieval (build 3), hallucination (constraint-fix 3).
- Nine story beats present: hook, title, listening, decide (compare + flow), build, constraint and fix (guess + outage), user test, ownership, challenge and closing. `TEAM.md` §6's 8-beat format is satisfied by the same scenes.
- Action step is one concrete thing (one work question, context, "tell me where this comes from", compare), doable today.
- Signature closing present: Tanyi says "Don't just use AI. Build it to work reliably." (outro, 222.2–228.4 s), rendered as the amber emphasis in both orientations and in the short's last frame (`qa-S-last.png`, `qa-L-last.png`, `qa-P-last.png`).
- Gatekeeper appears in the safety beats (decide, user-test, ownership).
- Demo steps and flow nodes match line counts: listening 3/3, decide-flow 4/4, build 4/4, constraint-fix 3/3, constraint-outage 2/2, user-test 2/2; the stills confirm the active step follows the spoken line in every sampled frame.

## Continuity

- Cast ids and looks unchanged (tanyi, amara, kito, hallucinator, gatekeeper); labels render as "Tanyi", "Amara", "Kito", "The Hallucinator", "The Gatekeeper", the same as ep001.
- Background `workshop`; branding "AI with Hippolyte" top left and "EP 02" top right on every frame; amber progress bar reaches the right edge on the last frame (`qa-L-last.png`, `qa-P-last.png`, `qa-S-last.png`).
- Caption style unchanged: white rounded box, dark ink, current word highlighted in the speaker's colour.
- No real name used as a character: "Hippolyte" appears only in the series title and the episode badge. No Professor Glitch material.
- Style files untouched per the storyboard's continuity report; no new scene type or asset.

## Audio

- 27 lines, longest 12.8 s (ownership line 2), all under 15 s. Total 229.05 s (3 min 49 s), within 2–4 min. Short: 46.95 s.
- Gaps: 350 ms between lines, 1.1 s between scenes, one 6.1 s designed silence over the title (issue 6). No unintended gap over 1.5 s.
- Levels: see issue 7. No clipping (peak −5.1 dB).
- Pronunciation: `scripts/voice.mjs` reads `characters.json._pronunciations` and applies Tanyi "Tang-yee", Kito "Kee-toh", Amara "Ah-mah-rah", Ebot "Eh-bot", Njume "n-Joo-meh", Kumba "Koom-bah", Meme "Meh-meh" as spoken-only substitutions; captions keep the canonical spelling (confirmed in `build.json` word timings: "Ebot", "Njume", "Kumba"). Local Whisper is not installed on this machine, so the spoken result could not be transcribed for a machine check. Hippolyte should listen to hook line 1 (Ebot, Kumba, 0.4–7.6 s), listening line 2 (Njume, 28.8–38.4 s), build line 2 (Kito, 104.6–110.8 s) and listening line 1 (Tanyi, 20.7–28.5 s) at the preview. Note: "Meme" is never spoken (only shown in app titles), so its entry is unexercised.

## Visuals

- Landscape: no panel or window overlaps a character or caption in any of the 12 stills; text fits every card, including the three-line guidance entry (build step 2) and the four-turn user-test chat (`qa-L-usertest-chat.png`). Characters stand on the floor line with shadows. Active speaker highlighted with glow and coloured pill; the non-speaker is dimmed. Exceptions: issues 2, 3, 4.
- Portrait: content on top, caption in the middle, characters at the bottom in all 12 stills. The two tight fits flagged at gate 4 both clear the caption band: compare 3+3 rows (`P-04-decide.png`), ownership 4 bullets (`P-10-ownership.png`), and the four-turn chat with its inline source line (`qa-P-usertest-chat.png`). Flow arrows draw on in sequence in both layouts (`qa-L-flow-mid.png`, `qa-P-flow-mid.png`, including the curved arrow into the second row).
- Approval card: cursor moves to "Send to Njume" before the click (`L-09-user-test.png`, `P-09-user-test.png`) and the button shows the filled tick after it (`qa-L-usertest-click.png`, `qa-P-usertest-click.png`, 180.2 s); the reject label "Hold for Njume's visit" reads as a hold. The click lands while the Gatekeeper says "Send to Njume" (177.35 s + 2.2 s): in sync.
- Title: disclosure pill "Fictional teaching scenario based on researched conditions in Cameroon's South-West cocoa region" present in both orientations (`qa-L-title-pill.png`, `qa-P-title-pill.png`).
- Right compare column activates on line 2 as storyboarded (`qa-L-decide-right.png`).
- Short: first frame is the hook card, last frame the outro (`qa-S-first.png`, `qa-S-last.png`); three characters across the bottom band without overlap in constraint-fix (`qa-S-cfix.png`).

## Accessibility

- Captions match speech word for word (build text equals episode text on all 27 lines; word timings present for every line).
- Contrast: dark ink on white cards and caption boxes; highlighted caption words are white on the speaker colour (amber-brown, teal, blue, red, purple), all heavy enough at caption size.
- Meaning never by colour alone: compare columns use dash versus tick glyphs; demo steps use numbers and tick badges; the speaker is named by pill text, not only colour; queue items use empty checkboxes plus text.

## African authenticity

- Setting is specific and ledger-backed: Kumba, Meme division, South-West Cameroon (B2, B4); fictional cooperative in OHADA naming style (B5); no village, no real organisation, no Pidgin phrase, no currency.
- Agency: Ebot sets the first rule ("Ask about my farm before you answer. And say where the advice comes from.") and Njume sets the hard rule; the crew builds to their spec. No saviour framing, no poverty spectacle, no conflict mention (one factual 2017 outage line only, as decided at gate 2).
- The AI addresses the real need in the story brief (black pod after heavy rain, one agent for many farms, questions arriving faster than visits).
- Local constraints changed the build: the context form (unknown farm), sheet-only retrieval with a source line (no source, harmful advice), escalation of products and doses to Njume (registration and safety), offline queue and text or visit fallback (documented outages).
- Maintenance (Njume writes the sheet), accountability (the cooperative and its agent), data (questions and locations stay with members), ownership (cooperative owns sheet and assistant) and value (stays with members, intended not measured) are all on screen in the ownership scene and spoken.
- Disclosure line present on the title scene and truthful. No measured impact claimed.

## Rights

- `status.json.assets` is empty and `public/screen/` is empty: every app view is a mock-up. Five stock Edge voices documented in `status.json.voices`; no cloned voice. Cost $0.

## Platform

- Previews are half resolution by design: 960x540 (`ep002-16x9-preview.mp4`) and 540x960 (`ep002-9x16-preview.mp4`, `ep002-short1-9x16-preview.mp4`), 30 fps, AAC 48 kHz stereo. Stills are at full 1920x1080 and 1080x1920. Finals must be rendered at full resolution after this gate.
- Durations: both main previews 229.12 s container (229.07 s video, 6872 frames) against `build.json` `totalMs` 229052: a two-frame rounding difference, matched. Short 47.02 s container against `build.short1.json` 46950 ms: matched. Short is +2.0 s against the 45 s target, inside ±5 s; scenes hook + constraint-fix + outro as decided at gate 3.
- The task brief quoted `totalMs` as 229120; the file says 229052. The preview length is consistent with the file.

## Re-check list after fixes

- Title scene at 16–20 s in both orientations for a clean card (issue 1) and every scene boundary for captions clearing without flicker.
- If the hallucinator is removed from the constraint-fix stage: `L-07-constraint-fix.png`, the short's constraint-fix frames, and the speaker highlight on Kito and Tanyi.
- Final 1920x1080 frame at 179 s (issue 4).
- Any voice re-render: line durations, `totalMs`, and the short's 45 ± 5 s window.

---
```
Episode: ep002 v2 · Stage: Preview quality review · Status: needs-review
Inputs used: team/CONTRACT.md, .claude/skills/ai-animation-quality-editor/SKILL.md, TEAM.md §6, episodes/ep002/{episode-brief.md, story-brief.md, claim-ledger.csv, episode.json, storyboard.md, status.json}, public/episodes/ep002/{build.json, build.short1.json}, characters/characters.json (_pronunciations), scripts/voice.mjs, out/ep002/stills/*.png (24 stills, 2 sheets, 18 sampled qa-*.png frames), out/ep002/*-preview.mp4 (ffprobe, volumedetect)
Deliverable: episodes/ep002/quality-report.md
Assumptions: half-resolution previews are the intended gate-5 deliverable and finals will be 1920x1080 / 1080x1920; the 5 s silent title hold is by design; the gate-4 acceptance of the three-character landscape overlap stands unless Hippolyte says otherwise
Open questions: (1) fix the stale caption over the title card before finals (recommended); (2) keep or drop the hallucinator from the constraint-fix landscape stage; (3) Hippolyte to confirm by ear the spoken names Ebot, Njume, Kumba, Tanyi, Kito, Amara, since local Whisper is not installed for a machine check
Claims: 22 safe / 10 recheck / 3 blocked (ledger unchanged; every spoken and on-screen claim traces to a safe row; no recheck or blocked claim used)
Rights concerns: none
Next: Animation Producer (caption fix with the Renderer Engineer, then final render), Showrunner presents gate 5 to Hippolyte
```
