# Script v1 — ep002: What Really Happens When You Ask AI a Question?

Source of truth: `episodes/ep002/episode.json`. Disclosure (title scene): *Fictional teaching scenario based on researched conditions in Cameroon's South-West cocoa region.* Ledger ids refer to `claim-ledger.csv`; only `safe` claims are used, in their script-safe wording. B14, B15, B16 were still `recheck` at write time and are not used (no Phytophthora, no "remove infected pods", no registration-law line).

## Script table

| # | Scene (type) | Speaker | Line | On-screen idea | Claim ids |
|---|---|---|---|---|---|
| 1 | hook (statement) | tanyi | Ebot grows cocoa near Kumba, in Cameroon's South-West. After heavy rains, her pods turn brown. | Statement: "Brown pods after the rains. A chatbot answers: spray product X at dose Y." | B4, B13 |
| 1 | hook | tanyi | A chatbot on a borrowed phone answers: spray product X at dose Y. Nobody asked where her farm is. | Emphasis: "Nobody asked where her farm is." | B11 (plausible fiction, no figure) |
| 2 | title (title) | — | (no narration; scene held 5 s) | Title + disclosure line as subtitle | — |
| 3 | listening (demo, chat) | amara | Tanyi, Ebot's message: brown pods since the rains, the field agent comes next week, what do I spray? | Chat: Ebot's message (user bubble) in "Meme Cocoa Farmers Cooperative Society · Messages" | B13, B23 |
| 3 | listening | amara | Njume, the only field agent: questions come faster than he can visit. He keeps a checked guidance sheet. | Chat: two Njume messages; on-screen "many farmers here have no extension officer at all" | B8, B23 |
| 3 | listening | tanyi | No context about her farm, no source. We fix that. | Text: "Context about her farm: none / Source: none / Product and dose: named anyway" | A4 |
| 4 | decide (compare) | tanyi | A general chatbot knows nothing about Ebot's farm. It predicts a fluent answer, no source. | Compare left: General chatbot (4 items) | A2, A4 |
| 4 | decide | tanyi | Ours asks about her farm first, answers only from Njume's sheet, and shows its source. | Compare right: Cooperative assistant (4 items) | A9 |
| 4 | decide | gatekeeper | One hard rule. No product name, no dose, ever comes from the model. Those go to Njume. | Right column item "Product and dose: to Njume" | B17 |
| 4 | decide-flow (flow) | tanyi | First, tokens. Your question is cut into pieces: words, parts of words, sometimes single characters. | Node 1 Tokens: "Text cut into pieces" | A1 |
| 4 | decide-flow | tanyi | Then it predicts: it was trained to guess the next word from the words before it. | Node 2 Predict: "Next word, from patterns" | A2 |
| 4 | decide-flow | tanyi | Its context is its working memory. Anything not in there, it does not know. | Node 3 Context: "All it can see, resent each time" | A3, A4 |
| 4 | decide-flow | tanyi | Alone, it cannot check anything. With a tool, it asks, your software fetches a checked page into its context. | Node 4 Tool: "Fetches a checked page" | A8, A9 |
| 5 | build (demo) | kito | I ask before I answer: crop stage, where, when the rains came, what Ebot sees. | List: context form (stage, where, when, what she sees) | — (design) |
| 5 | build | amara | Njume's guidance sheet. Kito, why his sheet and not the whole internet? | List: guidance sheet maintained by Njume; entry 4 highlighted (clear the farm, sanitation, spray on the cooperative's schedule); entry 5 "Products and doses: ask Njume" | B13, B17 |
| 5 | build | kito | My answer is only as good as the page I read. Retrieval puts the matching entry, entry four, into my context. | Text: "Context sent to the model" (question, farm, retrieved entry 4, rule: no products, no doses) | A9, A3 |
| 5 | build | kito | Then I answer plainly and show the source: guidance sheet, entry four, updated by Njume. | Chat: sourced answer with source line | A9, B13 |
| 6 | constraint-fix (demo) | hallucinator | Simple. Spray product X at dose Y every week, and your problem is solved. | Chat: agent bubble "Spray product X at dose Y every week. Problem solved." | — (placeholder, never endorsed) |
| 6 | constraint-fix | kito | No product entry in my sheet, so I will not guess. Not covered, sent to Njume. | Chat: "Product and dose: not covered by the guidance sheet. Sent to Njume." | A9, B17 |
| 6 | constraint-fix | tanyi | That is a hallucination: a fluent answer that is wrong. OpenAI researchers showed that training and testing reward a confident guess over saying I don't know. | Text: why a wrong answer sounds sure; "Label, registration, protection: unknown to it" | A7, B17 |
| 6 | constraint-outage (demo) | tanyi | In twenty seventeen, the two English-speaking regions lost the internet for three months. Kito, this must work offline. | Text: "2017: the two English-speaking regions lost the internet for 3 months" + design rule | B12 |
| 6 | constraint-outage | kito | I queue questions on the phone. Unanswered ones reach Njume by text or a visit. | List: queue (queued, sends when network returns, unanswered → Njume) | B12 (design consequence) |
| 7 | user-test (demo) | kito | Ebot asks again. I ask stage, place, what she sees, then answer from entry four with its source. | Chat: 4-message exchange ending with the sourced answer | A9, B13 |
| 7 | user-test | gatekeeper | Product and dose? Not from the model. Send to Njume. A person answers that. | Approval card "Product and dose: send to Njume", approve label "Send to Njume", click at 2.2 s | B17 |
| 8 | ownership (bullets) | gatekeeper | The cooperative owns the sheet and the assistant. Njume maintains it; the assistant only reads. Questions and locations stay cooperative data. | Bullets 1 to 3 | — (governance, story brief) |
| 8 | ownership | tanyi | If advice is wrong, the cooperative and its agent answer for it, not the AI. Tokens, prediction, context, tool. Right context, a checked source, a person to escalate to. | Bullet 4 "Accountable: the cooperative and its agent, not the AI"; recap | A1–A4, A8, A9 |
| 9 | challenge (statement) | tanyi | Build challenge: take one question you ask AI at work. Write down the context it needs. Add: tell me where this comes from. Compare the answers. | Statement: build challenge text | — |
| 9 | outro (outro) | tanyi | Don't just use AI. Build it to work reliably. Next: prompting versus context engineering. | Signature line; CTA "Next episode: Prompting vs. Context Engineering" | — |

## Totals
- Spoken words: **465** (target 430–470). Longest line: 27 words (limit 40). No digits, no markdown in spoken text.
- Estimated runtime at 140 wpm: **3 min 19 s** of speech; with the 5 s title hold, 350 ms line gaps and 700 ms scene gaps, roughly **3 min 35 s**.
- Scenes: 12 (hook, title, listening, decide, decide-flow, build, constraint-fix, constraint-outage, user-test, ownership, challenge, outro). Demo and flow scenes have one step or node per line.
- "hallucination" is spoken once, defined in place (constraint-fix, tanyi).
- Never stated: a product name, a dose, a percentage, a ratio, a tonnage, measured impact, conflict or insecurity. The 2017 outage appears in one factual line (B12).

## Cut: short1 (target 45 s)
Scenes `hook` → `constraint-fix` → `outro`. 104 spoken words, about 45 s at 140 wpm before gaps (roughly 48 s with gaps). If it runs long at voice build, drop the hook's first line in the cut only; if Hippolyte prefers the outage beat in the vertical, add `constraint-outage` (+33 words, about +15 s).

## Pronunciation list (for `_pronunciations` in `characters/characters.json`, via the Animation Producer)
| Word | Spoken as | Status |
|---|---|---|
| Kumba | KOOM-bah | B22 (recheck): confirm |
| Buea | BOY-ah (often heard) | not spoken in v1; listed for the description and future use; confirm |
| Ebot | EH-bot (proposed) | fictional name, B23: Hippolyte to confirm spelling and pronunciation |
| Njume | n-JOO-meh (proposed) | fictional name, B23: Hippolyte to confirm |
| Meme | MEH-meh (division name; proposed) | confirm; the TTS may read it as the English word "meme" |
| Phytophthora | fy-TOF-thor-uh | not used (B14 recheck) |
| Tanyi, Kito, Amara | already mapped | — |

Check at voice build: "X" and "Y" should be read as letters; "twenty seventeen" and "entry four" are already words.

## Required approvals
- Gate 3 Script: Hippolyte approves every spoken line and claim (this file and `episode.json`).
- Names and cooperative name: Ebot, Njume, "Meme Cocoa Farmers Cooperative Society" (fictional, OHADA naming style, B5/B23) reviewed by Hippolyte.
- No cost incurred: the JSON was written by the agent, not by `npm run script`.
- No new characters, scene types, ui kinds, assets or style changes requested. Ebot and Njume appear only in chat, list and approval mock-ups and through amara.

## Reviewer items for Hippolyte
1. **Names.** Ebot (farmer, she) and Njume (field agent, he): do they fit the Meme/Manyu area, and are the proposed pronunciations right?
2. **Cooperative name.** "Meme Cocoa Farmers Cooperative Society": plausible OHADA-style name for a fictional South-West cooperative? Any collision with a real cooperative to avoid?
3. **Pronunciations.** Kumba, Buea, Meme, Ebot, Njume (table above).
4. **Guidance-sheet wording.** Entry 4 uses only B13 wording (keep the farm clear, keep up sanitation, prune on time, spray on the cooperative's schedule). "Remove infected pods" (B15) is held back until the ledger clears it; add it to entry 4 if cleared, on screen only.
5. **Njume's on-screen line** "Many farmers here have no extension officer at all" is the no-figure form of B8; confirm it reads naturally for a South-West field agent.
6. **Chat labelling.** In the listening scene, Njume's messages use the left-hand ("agent") bubble so they are visually distinct from Ebot's; the Storyboard Director may prefer a list card for him instead.
7. **Outage line.** One factual line only ("In twenty seventeen, the two English-speaking regions lost the internet for three months"), as decided at gate 2; no conflict or insecurity mention anywhere.
8. **Title scene.** Follows the learning design (no narration, 5 s hold with the disclosure). If you prefer a spoken welcome as in ep001, one 10-word line fits inside the word budget.

No `[HIPPOLYTE STORY NEEDED]` items: the scenario is declared fictional and no personal story is used.

---
Episode: ep002 v1 · Stage: Script · Status: needs-review
Inputs used: team/CONTRACT.md, .claude/skills/ai-animation-scriptwriter/SKILL.md, SERIES.md, TEAM.md §4, episodes/ep001/episode.json, ep002 episode-brief.md, story-brief.md, learning-design.md, evidence-pack.md, claim-ledger.csv (re-read at write time), status.json
Deliverable: episodes/ep002/episode.json, episodes/ep002/script-v1.md
Assumptions: B14, B15, B16 still recheck, so not used; title scene silent with minMs 5000 per the learning design; Njume shown in the left chat bubble; cut excludes the outage scene to hold 45 s
Open questions: names, cooperative name and pronunciations (Hippolyte at gate 3); whether the cut should include constraint-outage
Claims: 22 safe / 10 recheck / 3 blocked (script uses A1–A4, A7–A9, B4, B5, B8, B12, B13, B17, B23-flagged names)
Rights concerns: none
Next: Storyboard Director
