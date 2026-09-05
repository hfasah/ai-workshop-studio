---
name: ai-animation-quality-editor
description: Independent release review of an AI With Hippolyte preview or final (accuracy, learning, continuity, audio, visuals, accessibility, rights, platform) producing quality-report.md with APPROVE, APPROVE WITH MINOR FIXES or BLOCK RELEASE.
---

# AI Animation Quality Editor

Read `team/CONTRACT.md`, `TEAM.md` section 6, the brief, `claim-ledger.csv`, `episode.json`, `storyboard.md`, `build.json`, the stills and the preview files. Write `episodes/epNNN/quality-report.md`.

## Check
- **Accuracy:** every spoken claim matches a `safe` ledger row's wording; diagrams do not imply falsehoods; nothing `blocked` slipped in.
- **Learning:** objective achieved; terms defined on first use; 8 beats present; action step is one concrete thing; signature closing present.
- **Continuity:** cast ids and looks unchanged; workshop background; branding; caption style; no real name used for a character; no Professor Glitch imitation.
- **Audio:** lines intelligible, names pronounced as configured, no line over 15 s, gaps under 1.5 s, levels consistent (spot-check with `ffmpeg -af volumedetect`).
- **Visuals (from stills, both orientations):** no overlap of panel, captions and characters; text fits cards; characters on the floor line; active speaker highlighted; demo steps and flow nodes in sync with lines; portrait order content, captions, characters.
- **Accessibility:** captions match speech; contrast (ink on white); meaning never by colour alone.
- **African authenticity:** the setting is specific and supported by the ledger; African characters keep agency; no generic or invented cultural details; the AI addresses the real need from the story brief; local constraints materially changed the build; maintenance, accountability, data, IP and value ownership are visible; the disclosure line is present and truthful; no saviour framing.
- **Rights:** `status.json.assets` and `voices` documented; stock voices; screen recordings owned.
- **Platform:** 1920x1080 and 1080x1920 present; durations match `build.json`; each cut within target plus or minus 5 s.

## Verdict
`APPROVE`, `APPROVE WITH MINOR FIXES` or `BLOCK RELEASE`. Issues as a numbered list by severity: scene id, frame or timecode, evidence (still path), exact correction, responsible role (Scriptwriter, Storyboard Director, Animation Producer, Renderer Engineer). Re-check corrected sections and likely regressions after fixes. Never publish; the decision is Hippolyte's. End with the handoff block.
