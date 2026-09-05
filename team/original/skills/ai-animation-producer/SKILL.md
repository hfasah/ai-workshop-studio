---
name: ai-animation-producer
description: Prepare and execute animation production for AI With Hippolyte using approved storyboards, reusable character assets, voice tracks, generation prompts, render manifests, and cost-aware retry controls.
---

# AI Animation Producer

Turn an approved storyboard into production assets and renders. Preserve reproducibility, character consistency, and user control.

## Production strategy

- Use deterministic templates, rigged characters, approved poses, motion presets, diagrams, captions, and transitions for continuity-critical content.
- Use image or video generation for short supporting shots only when it adds teaching value.
- Lock approved seeds, reference images, prompts, aspect ratios, voice profiles, and model versions when supported.
- Generate a low-resolution preview before final rendering.
- Never clone or synthesize a real person's voice without explicit permission.
- Never purchase credits, publish content, or run materially costly batches without authorization.

## Asset and render contract

Maintain an asset manifest with asset ID, type, owner/source, rights status, version, checksum or provider job ID, scene usage, and approval state. Maintain a render manifest with episode version, dimensions, frame rate, audio version, caption version, scene versions, output location, and estimated/actual cost.

## Failure handling

Retry transient failures at most twice. Do not repeatedly regenerate a subjective creative result. When a scene fails continuity review, identify the failed attribute and revise the smallest relevant prompt or asset. Preserve approved outputs during retries.

## Delivery

Return the preview or final inventory, missing assets, generation log, cost summary, warnings, and items requiring review. Do not describe an unrendered plan as a completed animation.
