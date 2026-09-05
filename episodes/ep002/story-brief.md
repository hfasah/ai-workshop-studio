# Story brief — ep002 v1: What Really Happens When You Ask AI a Question?

Ledger ids in brackets. `safe` stated; `recheck` marked "to confirm"; `blocked` (A12, B19, B20) excluded.

## Setting
- Cameroon, South-West region, cocoa belt around Kumba, Meme division [B2, B4, B8]. Buea is the regional capital [B21].
- Community: the **Meme Cocoa Farmers Cooperative Society**, fictional, OHADA naming style [B5]. Real cooperatives exist nearby [B6]; none is portrayed. No real village.
- Languages: English and Cameroon Pidgin (Kamtok) [B9]. No Pidgin line is scripted; chat UI in English.
- Sector: smallholder cocoa; black pod after heavy rain is the seasonal problem [B13].
- Care: internet outages are documented [B12]; insecurity gets one line only after B18 is confirmed, no dramatised violence.

## Status
`Fictional teaching scenario based on researched conditions in Cameroon's South-West cocoa region` → `disclosure` in `episode.json`.

## User and need
**Ebot** (fictional, to confirm [B23]), cooperative member. Workflow: checks pods after the rains, messages the cooperative, waits for the field agent. What breaks: brown pods, agent unavailable for a week, so she asks a general chatbot on a borrowed phone (plausible fiction, unsourced [B11]). It answers "spray product X at dose Y every week": no source, no question about her farm.

## Local specialist
**Njume** (fictional), the cooperative's one field agent. Knows what the crew does not: which pods to remove, the local spray calendar, which products are registered and sold here (to confirm [B16]). He keeps the checked guidance sheet.

## Protagonist agency
- Njume: the assistant answers only from the sheet and sends every product or dose question to him.
- Ebot: it must ask about her farm first and say where the answer comes from.
- The cooperative board: questions and locations stay cooperative data; the tool runs under the cooperative's control.

## Artifact being built
A small question assistant that (1) asks for context: crop stage, where, when, what the farmer sees; (2) answers only from the guidance sheet, with a source line ("Guidance sheet, entry 4, updated by Njume"); (3) escalates product names, doses and anything not covered to Njume; (4) queues questions during outages, falls back to the agent. Lesson carried: tokens, prediction, context window, tools and retrieval, why confident answers can be wrong [A1–A9].

## Constraint map
| Constraint | Evidence | Design change |
|---|---|---|
| Connectivity interruptions | 2017 shutdowns [B12]; under half use the internet, national [B11] | Questions queue on the phone; unanswered ones reach Njume by text or visit |
| Rural electricity | Fewer than half of rural Cameroonians have electricity at home [B10] | Short text exchanges; no long sessions or video |
| Extension access gap | 2021 survey: many South-West cocoa farmers lack access to extension services [B8] | Njume's time is scarce; covered questions handled, escalations arrive with context |
| Language | English and Kamtok [B9] | Plain English, short sentences; Pidgin only if a Cameroonian reviewer writes it |
| Harmful advice | Pesticide use follows label, registration, protection [B17] | Hard rule: no product, no dose from the AI |

## AI role and human role
AI: collect context, retrieve the matching entry, phrase it plainly, show its source, say "not covered". Not AI: name products or doses, diagnose from a photo, edit the sheet, answer when nothing matches. Humans: Njume writes guidance and answers chemical questions; Ebot decides on her farm.

## Build → test → improve (nine beats)
| # | Beat | ~s | What happens | Cast |
|---|---|---|---|---|
| 1 | Hook | 10 | Ebot sees brown pods, asks a chatbot, gets "spray X at Y". Nobody asked where her farm is. | tanyi |
| 2 | Title | 5 | Title and disclosure line. | none |
| 3 | Listening | 25 | Chat mock-up relayed by amara: Ebot ("brown pods since the rains, agent comes next week, what do I spray?"), Njume ("one agent, many farms; I keep a guidance sheet, questions come faster than I can visit"). tanyi: no context, no source. | amara, tanyi |
| 4 | Decide | 30 | compare: general chatbot vs cooperative assistant. flow: tokens → predict → context window → tool/retrieval [A1–A4, A8, A9]. gatekeeper: products and doses only from Njume. | tanyi, gatekeeper |
| 5 | Build | 45 | kito demo: context form; guidance sheet as a list mock-up by Njume (wording from [B13]: remove affected pods, keep the farm clear, spray on the cooperative's schedule); retrieval puts entry 4 in context; answer with source line. amara: why the sheet, not the internet? [A5] | kito, amara |
| 6 | Constraint and fix | 30 | hallucinator: "Spray product X at dose Y every week", fluent, no source. kito finds no product entry in the sheet, routes to Njume instead of guessing. tanyi: training rewards a confident guess over "I don't know" [A7]. Then the outage: the region lost the internet for three months in 2017 [B12]; kito adds the queue and agent fallback. | kito, hallucinator, tanyi |
| 7 | User test | 20 | Ebot asks again; assistant asks stage, place, what she sees; sourced answer; approval card "Product and dose: sent to Njume"; gatekeeper confirms the hand-off. Queued state shown once. | kito, gatekeeper |
| 8 | Ownership | 20 | Bullets below. | gatekeeper, tanyi |
| 9 | Challenge and closing | 20 | Build challenge, signature line. | tanyi |

45-second cut: hook, constraint-and-fix, closing.

## Governance and ownership
- The cooperative owns the guidance sheet and the assistant.
- Njume maintains the sheet; the assistant reads it and cannot change it.
- Farmer questions and locations are cooperative data.
- Value stays with members (intended, not measured).
- Accountability for advice stays with the cooperative and its agent, never "the AI".

## Practical outcome and build challenge
A working question path with context, source and escalation. Challenge: take one question you ask AI at work, write down the context it would need, add "and tell me where this comes from", compare the two answers.

## BUILD alignment
- **B**: the cooperative learns to run a checked-guidance assistant.
- **U**: a real seasonal cocoa question, framed locally.
- **L**: no product or dose from the model; escalation; disclosure line.
- **D**: cooperative owns sheet, data and tool. (I not claimed.)

## Authenticity risks and how the script avoids them
1. Conflict or poverty spectacle → one factual outage line [B12]; insecurity only if B18 confirms; no violence imagery.
2. Generic village → named region, division, hub town; fictional cooperative.
3. Invented Pidgin → none scripted.
4. Invented statistics → no percentages, ratios, tonnages, infection rates; "many farmers lack access" only.
5. Real organisations as setting → ONCC, BAFIACOOP, SWACU not portrayed.
6. Fake product advice → placeholders "product X, dose Y", hallucinator only, never endorsed.
7. Saviour narrative → Njume and Ebot set the rules; the crew builds to their spec.
8. Claimed impact → none.

## Facts requiring research
- Black pod cause and spread [B14]; sanitation-first practice [B15]; registration law [B16].
- Insecurity line [B18].
- Names and cooperative name pattern [B23]; pronunciation of Buea and names [B22].
- Chat-based farmer-agent messaging as an existing South-West cooperative workflow (unsourced).

## Recommended reviewer
A Cameroonian from the South-West with cocoa cooperative or extension experience (agronomist or cooperative officer), before the script gate.

## On-screen appearance of Ebot and Njume
Mock-ups only: Ebot in chat (beats 3, 7) and the approval card; Njume in chat (beat 3), as guidance-sheet author (beat 5) and escalation recipient (beat 7). amara relays their words. No guest character request.
