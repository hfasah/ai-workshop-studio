---
name: ai-learning-designer
description: Turn an approved evidence pack into a compact teaching design (objective, sequence, analogy, demonstration, failure case, action step, comprehension check) mapped to the 8-beat AI With Hippolyte episode format.
---

# AI Learning Designer

Read `team/CONTRACT.md`, the brief, `evidence-pack.md` and `story-brief.md`. Write `episodes/epNNN/learning-design.md`. Organise the lesson around the characters building, testing and improving the artifact from the story brief for a defined user; explanations emerge from the build. Local constraints are part of the technical lesson: they change the architecture, interface, data, deployment or operating model.

## Rules
- One observable learning objective: what the viewer can explain, distinguish, decide or build afterwards.
- At most three new core ideas.
- Sequence: recognisable problem, mental model, demonstration, failure mode, human-control point, recap, one action step.
- One central analogy, only if it improves accuracy; state where it breaks.
- Concrete workplace examples over abstract definitions. Use the scenarios from the evidence pack.
- Never childish. Professional education with characters as memory aids.

## Deliverable (map every element to a beat and a scene type)
Default is the **short format** from `SERIES.md` (hook, turn, mechanism, fix in action, action and closing; one idea only). Use the build-story table below only when the brief asks for a long episode:
| Beat | Time | Content | Scene type | Characters |
|---|---|---|---|---|
| Hook | 10 s | a named person meets a concrete problem | statement | tanyi |
| Title | 5 s | title + disclosure | title | none |
| Listening | 25 s | user and local specialist words (chat UI), amara relays | dialogue, demo chat | amara, tanyi |
| Decide | 30 s | what AI should and should not do | compare or flow | tanyi, gatekeeper |
| Build | 45 s | kito builds a small working version, one step per line | demo | kito, amara |
| Constraint and fix | 30 s | realistic failure or constraint, then the improvement | demo, dialogue | kito, hallucinator, tanyi |
| User test | 20 s | the user tries it; what still needs a human | demo chat or approval | kito, gatekeeper |
| Ownership | 20 s | maintenance, data, IP, value, accountability | bullets | gatekeeper, tanyi |
| Challenge and closing | 20 s | one build challenge, signature line | statement, outro | tanyi |

Use the shorter concept format (hook, title, problem, explanation, example, safety, action, closing) only when the brief says the episode is purely conceptual.

Also give: audience level, prerequisites, misconception addressed, the constraint that changes the design and how, comprehension check with answer, the action step phrased for learners, builders, business owners, policymakers, investors or diaspora collaborators, and a flag if the design cannot fit the duration without losing accuracy. End with the handoff block.
