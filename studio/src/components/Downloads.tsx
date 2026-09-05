import {fmtBytes, type Output} from "../api";

// Every MP4, SRT and VTT for the episode, with sizes, as a dropdown in the page header.
export const Downloads = ({outputs}: {outputs: Output[]}) => {
  const videos = outputs.filter((o) => o.type === "video");
  const captions = outputs.filter((o) => o.type === "captions");
  const total = outputs.reduce((n, o) => n + o.size, 0);
  return (
    <details className="downloads">
      <summary className={`btn ${outputs.length ? "accent" : "disabled"}`}>Downloads{outputs.length ? ` (${outputs.length})` : ""}</summary>
      <div className="menu">
        {videos.length > 0 && <div className="kicker">Video</div>}
        {videos.map((o) => (
          <a key={o.name} href={o.url} download={o.name} className="item">
            <span className="mono">{o.name}</span>
            <span className="muted">
              {o.preview ? "preview · " : ""}
              {fmtBytes(o.size)}
            </span>
          </a>
        ))}
        {captions.length > 0 && <div className="kicker">Captions</div>}
        {captions.map((o) => (
          <a key={o.name} href={o.url} download={o.name} className="item">
            <span className="mono">{o.name}</span>
            <span className="muted">{fmtBytes(o.size)}</span>
          </a>
        ))}
        {outputs.length === 0 && <div className="muted small">Nothing rendered yet.</div>}
        {outputs.length > 0 && <div className="small muted foot">{outputs.length} files · {fmtBytes(total)}</div>}
      </div>
    </details>
  );
};
