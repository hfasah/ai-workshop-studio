import type {EpisodeJson} from "../api";
import {Doc} from "./Markdown";

export const Storyboard = ({episode, storyboardMd}: {episode: EpisodeJson; storyboardMd?: string}) => (
  <div>
    {storyboardMd ? <Doc name="storyboard.md" content={storyboardMd} open /> : <div className="notice">No storyboard.md yet. The Storyboard Director writes it at gate 4.</div>}
    {episode.cuts?.length ? (
      <div className="card tight" style={{marginBottom: 12}}>
        <strong>Cuts:</strong>{" "}
        {episode.cuts.map((c) => (
          <span key={c.id} className="chip blue" style={{marginRight: 6}}>
            {c.id} · {c.targetSec ?? "?"}s · {c.scenes.join(", ")}
          </span>
        ))}
      </div>
    ) : null}
    <div className="sb-grid">
      {episode.scenes.map((s, i) => (
        <div key={`${s.id}-${i}`} className="card tight sb-card">
          <div style={{display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap"}}>
            <span className="idx" style={{background: "var(--blue)", color: "#fff", borderRadius: 8, padding: "1px 8px", fontWeight: 900, fontSize: 12}}>
              {i + 1}
            </span>
            <strong>{s.label ?? s.id}</strong>
            <span className="mono muted">{s.id}</span>
            <span className="mono" style={{color: "var(--violet)"}}>
              {s.type}
            </span>
          </div>
          <div className="chips" style={{marginTop: 6}}>
            {(s.characters ?? []).length ? (s.characters ?? []).map((c) => <span key={c} className="chip blue">{c}</span>) : <span className="chip other">no characters</span>}
            <span className="chip other">{(s.lines ?? []).length} lines</span>
          </div>
          <pre className="mono">{JSON.stringify(s.onScreen ?? {}, null, 2)}</pre>
        </div>
      ))}
    </div>
  </div>
);
