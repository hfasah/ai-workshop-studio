# Learning design — ep002 v1: What Really Happens When You Ask AI a Question?

Build-story format on the story brief's beat plan. Target 3.5 min, 430–470 spoken words. Safe ledger claims only, by id. No dialogue.

## Audience
Professionals and beginners in Africa and the diaspora, no coding. Prerequisite: has used a chatbot.

## Learning objective
The viewer can explain the four things between question and answer (text becomes tokens; the model predicts next words from patterns; it knows only its context; it cannot check without a tool) and say why an answer can sound confident and still be wrong.

## Core ideas (three)
1. **Prediction, not lookup.** Tokens in, predicted tokens out [A1, A2].
2. **Context is all it knows.** Working memory, resent every request; what is absent does not exist [A3, A4]. More is not always better [A5].
3. **Checking needs a tool; confidence is style.** Retrieval puts a checked page in the context; the answer is only as good as that page [A8, A9]. Training rewards a guess over "I don't know" [A7].

## Central analogy
A well-read colleague with amnesia after every meeting: knows a lot, remembers nothing unless it is in the meeting notes. The notes are the context; the retrieved guidance entry is a page added to them. **Breaks:** a colleague can go and check, or say "not sure"; the model cannot check without a tool [A8] and is trained to guess [A7]. The break motivates retrieval and escalation.

## Misconception addressed
"Confident means correct." Confidence is fluency from patterns, not evidence [A7]. Secondary, in Decide: "It looks things up" [A8, A9].

## Constraint that changes the design
The region lost the internet for three months in 2017 [B12], so questions queue on the phone and unanswered ones reach Njume by text or visit. Guardrail: pesticide use follows label, registration, protection [B17], so the AI never names a product or dose. Both in beat 6.

## Beat plan
| Beat | Time | Learning content | Scene type | Characters | Words |
|---|---|---|---|---|---|
| Hook | 10 s | Ebot, brown pods after rain [B13], chatbot says "spray product X at dose Y"; nobody asked where her farm is. | statement | tanyi | 25 |
| Title | 5 s | Title, disclosure line. | title | none | 0 |
| Listening | 25 s | User and specialist words in chat; Njume keeps a guidance sheet; many farmers lack extension access [B8], no figure. tanyi: no context, no source. | dialogue, demo (chat) | amara, tanyi | 55 |
| Decide | 30 s | Mental model. compare: chatbot vs cooperative assistant. flow: tokens → predict → context → tool/retrieval [A1–A4, A8, A9]; screen labels the steps. gatekeeper: products and doses only from Njume. | compare, flow | tanyi, gatekeeper | 65 |
| Build | 45 s | One step per line: context form; Njume's sheet (B13 wording); retrieval puts entry 4 in context; answer with source line. amara: why the sheet, not the internet? [A9, A5] | demo | kito, amara | 100 |
| Constraint and fix | 30 s | Failure case: hallucinator's product-and-dose answer, fluent, no source; kito finds no entry, routes to Njume. tanyi: training rewards the guess [A7]; label, registration, protection unknown [B17]. Outage line [B12]; queue and fallback added. | demo, dialogue | kito, hallucinator, tanyi | 65 |
| User test | 20 s | Human-control point: sourced answer; approval card "Product and dose: sent to Njume"; gatekeeper confirms. Queued state once. | demo (chat, approval) | kito, gatekeeper | 45 |
| Ownership | 20 s | Cooperative owns sheet and tool; Njume maintains, assistant reads only; questions and locations are cooperative data; value stays with members (not measured); accountability never "the AI". tanyi recap: tokens, prediction, context, tool; then context, source, human. | bullets | gatekeeper, tanyi | 45 |
| Challenge and closing | 20 s | Action step, signature line. | statement, outro | tanyi | 45 |

205 s, about 445 words. 45 s cut: hook, constraint and fix, closing.

## Action step (beat 9)
On screen: take one question you ask AI at work, write down the context it needs, add "and tell me where this comes from", compare the two answers. Description variants: learners, tomorrow's real question; builders, add a source line and a "not covered" path; business owners, list questions staff may only answer from checked documents; policymakers, ask which advisory tools show a source and an accountable human; diaspora collaborators, help an association back home turn an expert's notes into a checked sheet, expert as maintainer.

## Comprehension check
Q: Both systems got "What do I spray?" Why did only the chatbot name a product?
A: It predicted a fluent answer from patterns, with no farm context and no source; training rewards the guess [A2, A7]. The assistant answers only from the sheet in its context; no product entry exists, so it routes to Njume [A9, B17].

## Duration fit
Fits at 430–470 words. Risk: beat 4 carries four concepts in 30 s; on-screen labels keep narration short. If long, cut temperature [A6], not the 2017 line, which justifies the queue.

---
Episode: ep002 v1 · Stage: Learning design · Status: needs-review
Inputs used: CONTRACT.md, SKILL.md, SERIES.md, ep002 brief, evidence pack, ledger, story brief
Deliverable: episodes/ep002/learning-design.md
Assumptions: sheet wording from B13 (safe), not B15 (recheck); no insecurity per gate 2; A6 optional
Open questions: none; names and pronunciations reviewed at gate 3
Claims: 22 safe / 10 recheck / 3 blocked
Rights concerns: none
Next: Scriptwriter
