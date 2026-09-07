import React from "react";
import {AbsoluteFill} from "remotion";
import {theme} from "./theme";
import {PlaceholderCharacter} from "./characters/Placeholder";
import {PackCharacter, hasPack} from "./characters/PackCharacter";
import {ILLUSTRATIONS} from "./components/Illustrations";
import type {Build} from "./types";

export type ThumbnailProps = {
  episodeId: string;
  headline: string; // 2 to 5 big words
  kicker: string; // "AI Fundamentals · Lesson 1"
  title: string; // the episode title, small
  illustration?: string; // name from Illustrations.tsx
  characterId?: string; // defaults to the host
  build?: Build; // filled by calculateMetadata
};

// 1920x1080 still that matches the videos: white paper, one amber shape, the host large on the right, the claim in
// very big type on the left so it reads at 200 px wide in a YouTube list. Render at frame 40 so the marker is drawn.
export const Thumbnail: React.FC<ThumbnailProps> = ({headline, kicker, title, illustration, characterId = "tanyi", build}) => {
  const ch = build?.characters?.[characterId];
  const words = headline.trim().split(/\s+/).filter(Boolean);
  const last = words.pop() ?? "";
  const Ill = illustration ? ILLUSTRATIONS[illustration] : null;
  const big = headline.length > 22 ? 132 : headline.length > 14 ? 156 : 176;
  return (
    <AbsoluteFill style={{background: theme.bg, fontFamily: theme.font, color: theme.ink, overflow: "hidden"}}>
      {/* dotted paper */}
      <AbsoluteFill style={{backgroundImage: `radial-gradient(${theme.grid} 2px, transparent 2px)`, backgroundSize: "44px 44px", opacity: 0.9}} />
      {/* amber shape behind the host */}
      <div style={{position: "absolute", left: 1210, top: -140, width: 1000, height: 1000, borderRadius: 500, background: theme.accent}} />
      <div style={{position: "absolute", left: 1150, top: 700, width: 900, height: 900, borderRadius: 450, background: "#FFE08A"}} />

      {/* left column */}
      <div style={{position: "absolute", left: 100, top: 110, width: 1080, display: "flex", flexDirection: "column", gap: 34}}>
        <div style={{alignSelf: "flex-start", background: theme.blueSoft, color: theme.blue, fontWeight: 900, fontSize: 36, letterSpacing: 2, textTransform: "uppercase", padding: "12px 26px", borderRadius: 999}}>{kicker}</div>
        <div style={{fontSize: big, lineHeight: 1.08, fontWeight: 900, letterSpacing: -3, textWrap: "balance" as never}}>
          {words.join(" ")}
          {words.length ? " " : ""}
          <span style={{display: "inline-block", whiteSpace: "nowrap", background: theme.accent, padding: "0 0.14em", margin: "0 -0.06em", borderRadius: "0.12em", boxDecorationBreak: "clone" as never}}>{last}</span>
        </div>
        <div style={{fontSize: 46, lineHeight: 1.2, fontWeight: 700, color: theme.muted, maxWidth: 980}}>{title}</div>
      </div>

      {/* brand */}
      <div style={{position: "absolute", left: 100, bottom: 84, display: "flex", alignItems: "center", gap: 18}}>
        <div style={{width: 64, height: 64, borderRadius: 18, background: theme.accent, color: theme.ink, fontWeight: 900, fontSize: 40, display: "grid", placeItems: "center"}}>H</div>
        <div style={{fontSize: 44, fontWeight: 900}}>
          <span style={{color: theme.ink}}>AI</span> <span style={{color: theme.muted, fontWeight: 700}}>with</span> Hippolyte
        </div>
      </div>

      {/* illustration card */}
      {Ill ? (
        <div style={{position: "absolute", left: 1010, top: 660, width: 300, height: 260, borderRadius: 36, background: theme.panel, boxShadow: theme.shadow, display: "grid", placeItems: "center"}}>
          <Ill size={240} />
        </div>
      ) : null}

      {/* host */}
      {ch ? (
        <div style={{position: "absolute", left: 1400, bottom: -30, filter: "drop-shadow(0 24px 30px rgba(15,23,42,0.22))"}}>
          {hasPack(ch.files) ? (
            <PackCharacter character={ch} amplitude={0} speaking={false} expression="confident" gesture="explain" height={980} flip={false} />
          ) : (
            <PlaceholderCharacter character={ch} amplitude={0} speaking={false} expression="confident" gesture="explain" height={980} flip={false} />
          )}
        </div>
      ) : null}
    </AbsoluteFill>
  );
};
