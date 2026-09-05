import React, {useContext, useMemo} from "react";
import {Sequence, useCurrentFrame, useVideoConfig} from "remotion";
import {createTikTokStyleCaptions, type TikTokPage} from "@remotion/captions";
import type {CaptionWord} from "../types";
import {theme} from "../theme";
import {LayoutContext} from "../Episode";

const PAGE_MS = 1800;

const Page: React.FC<{page: TikTokPage; color: string}> = ({page, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const {orientation} = useContext(LayoutContext);
  const nowMs = page.startMs + (frame / fps) * 1000;
  const portrait = orientation === "portrait";

  return (
    <div style={{position: "absolute", left: 0, right: 0, top: portrait ? "48.5%" : undefined, bottom: portrait ? undefined : 92, display: "flex", justifyContent: "center", padding: "0 6%", pointerEvents: "none"}}>
      <div
        style={{
          background: theme.bg,
          border: `2px solid ${theme.panelBorder}`,
          boxShadow: theme.shadow,
          borderRadius: 20,
          padding: portrait ? "14px 26px" : "12px 28px",
          fontSize: portrait ? 46 : 44,
          fontWeight: 900,
          lineHeight: 1.3,
          textAlign: "center",
          whiteSpace: "pre-wrap",
          maxWidth: portrait ? "94%" : "70%",
          color: theme.ink,
          letterSpacing: -0.5,
        }}
      >
        {page.tokens.map((t, i) => {
          const active = t.fromMs <= nowMs && t.toMs > nowMs;
          return (
            <span key={i} style={{background: active ? color : "transparent", color: active ? "#fff" : theme.ink, borderRadius: 8, padding: active ? "0 6px" : 0, margin: active ? "0 -6px" : 0}}>
              {t.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

export const Captions: React.FC<{captions: CaptionWord[]}> = ({captions}) => {
  const {fps} = useVideoConfig();
  const {build} = useContext(LayoutContext);
  const {pages} = useMemo(() => createTikTokStyleCaptions({captions, combineTokensWithinMilliseconds: PAGE_MS, breakOnSilenceAfterMilliseconds: 500}), [captions]);
  const speakerAt = (ms: number) => captions.find((c) => c.startMs === ms)?.speaker;

  return (
    <>
      {pages.map((page, i) => {
        const next = pages[i + 1];
        const from = Math.round((page.startMs / 1000) * fps);
        // end 350 ms after the last spoken word of the page (never linger into a silent scene)
        const lastTo = page.tokens[page.tokens.length - 1]?.toMs ?? page.startMs + page.durationMs;
        const endMs = Math.min(next ? next.startMs : Infinity, lastTo + 350);
        const dur = Math.round((endMs / 1000) * fps) - from;
        if (dur <= 0) return null;
        const sp = speakerAt(page.startMs);
        const color = (sp && build.characters[sp]?.captionColor) || theme.blue;
        return (
          <Sequence key={i} from={from} durationInFrames={dur} name="captions" layout="none">
            <Page page={page} color={color} />
          </Sequence>
        );
      })}
    </>
  );
};
