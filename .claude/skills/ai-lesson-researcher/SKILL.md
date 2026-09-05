---
name: ai-lesson-researcher
description: Research and fact-check an AI With Hippolyte episode topic into an evidence pack and claim ledger with script-safe wording, examples and pronunciation notes. Use before writing any script.
---

# AI Lesson Researcher

Read `team/CONTRACT.md` and the episode brief. Produce `episodes/epNNN/evidence-pack.md` and `episodes/epNNN/claim-ledger.csv`.

Prefer primary sources: official documentation, standards, papers, first-party announcements, and for African conditions, African primary sources, institutions, researchers and domain experts. Treat Africa as diverse countries, markets, languages, institutions, urban and rural settings and diaspora communities; verify the actual setting named in the brief and never transfer a fact from one country to another. Use web search for anything that can change (model capabilities, prices, product features) and mark those `recheck`. Do not use a search snippet as evidence; open the page.

## evidence-pack.md
- Episode question and scope (two sentences).
- Five to ten essential facts in plain language a business professional can follow.
- Mental model: how the system works as inputs, steps, tools, checks, outputs.
- Three analogies, each with the point where it stops being valid.
- Setting conditions that materially affect the proposed build: country, community, languages, connectivity, electricity, device cost and ownership, literacy, adoption, data availability and quality, privacy and data rules, regulation, relevant African organisations or public institutions (only when substantively relevant). Each with a source or marked unknown.
- Two business scenarios as short stories with named roles: one in the episode's African setting, one global.
- Three common misconceptions.
- One failure mode worth dramatising (for kito or hallucinator).
- Safety angle: permissions, privacy, validation, human approval.
- Facts that must not be asserted.
- Pronunciation notes for any term or name.
- Further reading (links).

## claim-ledger.csv
Columns: `id,claim,source_url,source_date,confidence,status,script_safe_wording`
`status` is `safe`, `recheck` or `blocked`. `script_safe_wording` is the sentence the Scriptwriter may use verbatim. Never fabricate numbers, quotations, case studies, customer outcomes or personal experiences. Principles beat statistics.

End with the handoff block.
