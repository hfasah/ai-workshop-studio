# Script v2 — ep002: What Really Happens When You Ask AI a Question?

v2 applies the African AI Story Director's review (`authenticity-review-v1.md`, items 1–9): Ebot and Njume now set the rules in their own words (listening chat), the crew builds to their spec, "borrowed phone" removed, the 2017 outage stated once, value recipient added to ownership, approval reject label changed to "Hold for Njume's visit", and the guidance sheet uses the now-cleared sanitation-first wording (B15).

Source of truth: `episodes/ep002/episode.json`. Disclosure: *Fictional teaching scenario based on researched conditions in Cameroon's South-West cocoa region*.

## Spoken lines
| Scene | Speaker | Line |
|---|---|---|
| hook (statement) | tanyi | Ebot grows cocoa near Kumba, in Cameroon's South-West. After heavy rains, her pods turn brown. |
| hook (statement) | tanyi | A chatbot on her phone answers: spray product X at dose Y. Nobody asked where her farm is. |
| listening (demo) | amara | Tanyi, Ebot's message: brown pods since the rains, the field agent comes next week, what do I spray? |
| listening (demo) | amara | Njume, the only field agent, keeps a checked guidance sheet. His rule: products and doses come to him, not from a machine. |
| listening (demo) | tanyi | No context about her farm, no source. Ebot and Njume told us what they need. We build to that. |
| decide (compare) | tanyi | A general chatbot knows nothing about Ebot's farm. It predicts a fluent answer, no source. |
| decide (compare) | tanyi | Ebot's rule: ask about her farm first. Njume's rule: answer only from his sheet, and show the source. |
| decide (compare) | gatekeeper | Njume's hard rule becomes ours. No product name, no dose, ever comes from the model. Those go to him. |
| decide-flow (flow) | tanyi | First, tokens. Your question is cut into pieces: words, parts of words, sometimes single characters. |
| decide-flow (flow) | tanyi | Then it predicts: it was trained to guess the next word from the words before it. |
| decide-flow (flow) | tanyi | Its context is its working memory. Anything not in there, it does not know. |
| decide-flow (flow) | tanyi | Alone, it cannot check anything. With a tool, it asks, your software fetches a checked page into its context. |
| build (demo) | kito | I ask before I answer: crop stage, where, when the rains came, what Ebot sees. |
| build (demo) | amara | Njume's guidance sheet. Kito, why his sheet and not the whole internet? |
| build (demo) | kito | My answer is only as good as the page I read. Retrieval puts the matching entry, entry four, into my context. |
| build (demo) | kito | Then I answer plainly and show the source: guidance sheet, entry four, updated by Njume. |
| constraint-fix (demo) | hallucinator | Simple. Spray product X at dose Y every week, and your problem is solved. |
| constraint-fix (demo) | kito | No product entry in my sheet, so I will not guess. Not covered, sent to Njume. |
| constraint-fix (demo) | tanyi | That is a hallucination: a fluent answer that is wrong. OpenAI researchers showed that training and testing reward a confident guess over saying I don't know. |
| constraint-outage (demo) | tanyi | In twenty seventeen, the two English-speaking regions lost the internet for three months. Kito, this must work offline. |
| constraint-outage (demo) | kito | I queue questions on the phone. Unanswered ones reach Njume by text or a visit. |
| user-test (demo) | kito | Ebot asks again. I ask stage, place, what she sees, then answer from entry four with its source. |
| user-test (demo) | gatekeeper | Product and dose? Not from the model. Send to Njume. A person answers that. |
| ownership (bullets) | gatekeeper | The cooperative owns the sheet and the assistant. Njume maintains it; the assistant only reads. Questions, locations and any value stay with the members. |
| ownership (bullets) | tanyi | If advice is wrong, the cooperative and its agent answer for it, not the AI. Tokens, prediction, context, tool. Right context, a checked source, a person to escalate to. |
| challenge (statement) | tanyi | Build challenge: take one question you ask AI at work. Write down the context it needs. Add: tell me where this comes from. Compare the answers. |
| outro (outro) | tanyi | Don't just use AI. Build it to work reliably. Next: prompting versus context engineering. |

Spoken words: **485**. Estimated speech at 140 wpm: 3.5 min; about 3.5 min with title hold and gaps.

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


## Reviewer items for Hippolyte (gate 3)
1. Names: Ebot (farmer, she) and Njume (field agent, he); proposed pronunciations EH-bot, n-JOO-meh.
2. Cooperative name: "Meme Cocoa Farmers Cooperative Society" (fictional, OHADA style); any collision to avoid?
3. Pronunciations: Kumba (KOOM-bah), Meme (MEH-meh; TTS may say the English "meme"), Buea (BOY-ah, not spoken in v2).
4. Njume's chat lines now read as a field agent texting; confirm they sound natural for the South-West.
5. Guidance sheet entry 4 now reads: take off diseased pods, keep the farm clear, spray on the cooperative's schedule. No product, dose or interval anywhere.
