# Evidence pack — ep002 v1: What Really Happens When You Ask AI a Question?

Research date: 2026-09-04. Ids refer to `claim-ledger.csv`; only `safe` claims may be spoken.

## Question and scope
Between a typed question and an answer, a language model turns text into tokens, predicts the next tokens from learned patterns, sees only what is inside its context window, and cannot check anything unless it is given a tool. The episode uses a fictional cocoa cooperative in Cameroon's South-West region to show why context, a checked source and a human escalation path make an answer useful.

## Essential facts (plain English)
1. Words become tokens: small pieces (words, parts of words, characters). For Claude a token is roughly 3.5 English characters. [A1]
2. The core model is pre-trained to predict the next word given the text before it; later training (fine-tuning, RLHF) makes it behave like an assistant. [A2]
3. The context window is the model's working memory: everything it can look at while writing the answer. It is separate from the training data. [A3]
4. Each turn, the request contains the whole conversation so far plus the new message. Anything not in that request does not exist for the model. [A4]
5. Longer context is not automatically better: as the window fills, accuracy and recall degrade ("context rot"). [A5]
6. Temperature controls randomness in word choice; even at temperature 0, outputs are not fully deterministic. [A6]
7. Hallucinations are plausible but incorrect statements. A 2025 OpenAI paper argues they arise from statistical pressure in pre-training and from training and evaluation that reward guessing over admitting uncertainty. [A7]
8. A model never executes anything itself. With tools, it emits a structured request; the application runs it and returns the result into the conversation. [A8]
9. Retrieval (RAG) passes documents from an external knowledge base into the context at answer time; its quality depends on the quality of that knowledge base. Providing provenance was named an open problem in the original 2020 paper. [A9, A10]
10. "Memory" across chats is a product feature layered on top of the model (on by default for some Claude plans, off for others, disabled in incognito), not something the model does by itself. [A11]

## Mental model
Inputs: the farmer's question + context the app adds (crop, place, season, what she sees) + the cooperative's checked guidance retrieved for that question. Steps: tokenize → predict tokens → detokenize. Checks: answers must cite a guidance entry; "not covered" or risky cases escalate to the field agent. Outputs: an answer with its source, or a hand-off to a human.

## Analogies (and where they stop)
- Phone autocomplete, scaled up: predicts the next word from patterns. Stops: it holds long conversations and follows instructions; autocomplete cannot.
- A well-read colleague with amnesia after every meeting: knows a lot, remembers nothing unless it is in the meeting notes (the context). Stops: a colleague can go and check; the model cannot unless given a tool.
- An exam where blank answers score zero, so students guess confidently. Stops: the model has no intent; it is not choosing to bluff.

## Setting conditions that affect the build
- Country and crop: Cameroon is one of the world's largest cocoa producers (ICCO tonnage not yet re-read) [B1 recheck]. ONCC, the National Cocoa and Coffee Board, names the South-West and Centre as the heavy production zones, the South-West at around 40 per cent [B2, B3]. Muyuka, Mbonge and Kumba are major hubs; a cooperative-run processing mill opened in Kumba in December 2025 [B4, B6].
- Cooperative structures: cooperatives in Cameroon fall under the OHADA Uniform Act (in force 15 May 2011), with two forms, SCOOPS and COOP-CA [B5]. Real South-West examples: BAFIACOOP (325 members, 2017) and SWACU, a 2023 association of four cooperative unions reported to represent nearly 30,000 farmers [B6]. Common Initiative Groups and Licensed Buying Agents are part of the marketing chain but were not confirmed from an opened source [B7 recheck].
- Extension: in a 2021 survey of 120 South-West cocoa farmers, 91.7 per cent lacked access to extension services and 68.3 per cent were not in a producer association; fungicide was the second-largest cost, applied against black pod [B8]. This supports "one field agent for many farmers" as plausible, not as a statistic.
- Languages: English and Cameroon Pidgin English (Kamtok) are used in the South-West; Kamtok is a regional lingua franca among about 280 indigenous languages; speaker counts are unreliable [B9]. Do not script Pidgin lines without a Cameroonian reviewer.
- Electricity: 72 per cent of Cameroonians had access in 2024; rural access 42.7 per cent (World Bank, note a data jump from 26 per cent in 2023) [B10]. Regional figures: unknown.
- Phones and network: 29.0 million mobile connections (96 per cent of population), 87.5 per cent on 3G/4G/5G; 12.6 million internet users (41.9 per cent), October 2025, national only [B11]. South-West coverage, device ownership and shared-phone use: unknown; the shared phone is plausible fiction, not a sourced fact. The Anglophone regions were cut off from the internet for 94 days in 2017 and again from October 2017 to March 2018 [B12]. Design implication: the assistant must tolerate outages (queued questions, SMS or agent fallback).
- Plant health: black pod is caused by Phytophthora; wet weather drives it. In September 2025 the South-West agriculture delegate blamed heavy rain since July and advised farmers to intensify spraying; authorities also cited late pruning, poor field clearing and irregular fungicide timing [B13]. Standard management (remove infected pods, harvest regularly, prune and clear, timed copper-based fungicides, resistant material) and loss figures come from CABI and IRAD-related papers that could not be opened in time [B14, B15 recheck].
- Chemical safety: pesticides need registration under Cameroon's Law 2003/003 [B16 recheck]; the FAO/WHO Code of Conduct on Pesticide Management is the international reference [B17]. A generic answer naming a product or dose can be wrong for the country, the registration, the season and the sprayer's protection.
- Security: an armed conflict between government forces and separatist groups has affected the North-West and South-West since 2017, with displacement, lockdowns and humanitarian need continuing in 2026 [B18, B19 recheck; see recommendation].

## Business scenarios
- South-West (fictional): Ebot, a member of a fictional Meme-area cooperative, photographs brown pods and asks a general chatbot on a borrowed phone; it names a fungicide and dose. Njume, the cooperative's one field agent, cannot visit for a week. The crew's assistant asks where, when and what she sees, answers only from the cooperative's guidance sheet, shows the sheet reference, and flags "product and dose: ask the field agent".
- Global: a compliance officer at a logistics firm asks a chatbot about a customs rule; the answer cites a regulation that does not exist. Same fix: context (country, goods), retrieval from the firm's checked rulebook, a named human for anything not covered.

## Misconceptions
1. "It looks things up." It predicts; it retrieves only when given a retrieval tool [A8, A9].
2. "It remembers me." Nothing persists unless the product stores it and re-inserts it into the context [A4, A11].
3. "Confident means correct." Training rewards fluent guesses; confidence is style, not evidence [A7].

## Failure mode to dramatise
hallucinator answers "Spray [product] at [dose] every week" with no source; kito finds no product entry in the guidance base and routes to the field agent instead of guessing.

## Safety angle
Permissions: the assistant reads the guidance base, never edits it. Privacy: questions and locations are cooperative data. Validation: every answer carries its source line or is escalated. Human approval: chemical names and doses only from the field agent (gatekeeper's moment).

## Do not assert
Cocoa's share of GDP or exports; "nearly a million people depend on cocoa"; infection percentages; agent-to-farmer ratios; any Pidgin phrase; any real cooperative as the setting; any fungicide product or dose; that the story is a real farmer's.

## Pronunciation
Phytophthora: fy-TOF-thor-uh (dictionary, recheck). Kumba: KOOM-bah. Buea: capital of the South-West; pronunciation to confirm with a Cameroonian speaker (often heard as BOY-ah). Kamtok: KAM-tok. Ewondo: eh-WON-doh (only if the Centre region is chosen). Names (fictional, reviewer to confirm they fit the Meme/Manyu area): Ebot, Ayuk, Enow, Njume, Tabe.

## Setting recommendation
Proceed with the South-West, with care and specific framing. For: it is Cameroon's leading cocoa region, Kumba is a real cocoa hub with cooperatives, and English plus Kamtok match the brief. Care: conflict, displacement and connectivity interruptions are documented. Framing: fictional cooperative and names, no real village, no dramatised violence, one honest line that the region has worked through years of insecurity and outages (hence offline fallback and a human path), and review by a Cameroonian from the region before the script gate. Fallback if Hippolyte prefers no conflict context: Centre region (French/Ewondo), which changes the language plan.

## Further reading
All URLs are in `claim-ledger.csv`: Anthropic glossary and context-window docs, Kalai et al. 2025, Lewis et al. 2020, ONCC production zones, OHADA cooperative law, Ngwang and Meliko 2021, DataReportal 2026, World Bank electricity data, Access Now, TRT Afrika, OCHA.

## Follow-up 2026-09-04
Cleared B14, B15, B16, B22. B14: Nembot, Takam Soh, Ambang, ten Hoopen, Dumont (University of Yaoundé I, CIRAD), ISCR 2017 paper hosted by ICCO: P. megakarya causes black pod in Cameroon; soil inoculum activates in wet, humid conditions and spreads by rain splash. B15: Merga 2022, Plant Pathology & Quarantine (open access): P. megakarya is the most significant cocoa pathogen in Central and West Africa; management is regular harvesting, removal of diseased pods, pruning and weeding, targeted fungicide, less susceptible material; cultural steps alone did not control it in Cameroon. B16: Law 2003/003 Article 21(1), FAOLEX LEX-FAOC050036. B22: Dictionary.com "fahy-TOF-ther-uh"; Buea and names still for Hippolyte's reviewer. CABI, Plantwise, Merriam-Webster and WCF return 403 or 404.
