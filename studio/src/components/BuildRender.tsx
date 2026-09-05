import {useState} from "react";
import {api, fmtBytes, fmtDuration, type BuildSummary, type EpisodeJson, type Job, type Output} from "../api";
import {LogView} from "./JobLog";
import type {StreamState} from "./useJobStream";

type Props = {
  episodeId: string;
  episode: EpisodeJson;
  build: BuildSummary | null;
  outputs: Output[];
  activeJob: Job | null;
  stream: StreamState;
  onJobStarted: (job: Job) => void;
  onOutputs: (outputs: Output[]) => void;
};

export const BuildRender = ({episodeId, episode, build, outputs, activeJob, stream, onJobStarted, onOutputs}: Props) => {
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [cut, setCut] = useState<string>(episode.cuts?.[0]?.id ?? "");
  const [cutPreview, setCutPreview] = useState(true);
  const running = Boolean(activeJob && activeJob.status === "running");
  const hasBuild = Boolean(build && !build.error);
  const hasScript = episode.scenes.length > 0;
  const videos = outputs.filter((o) => o.type === "video");
  const captions = outputs.filter((o) => o.type === "captions");

  const guard = async (fn: () => Promise<Job>) => {
    setError(null);
    setInfo(null);
    try {
      onJobStarted(await fn());
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  };

  const start = (kind: "voice" | "preview" | "final" | "cut", cutId?: string, preview?: boolean) => guard(() => api.startJob(episodeId, kind, cutId, preview));

  const makeCaptions = async () => {
    setError(null);
    setInfo(null);
    try {
      const r = await api.captions(episodeId);
      onOutputs(r.outputs);
      setInfo(`Captions written: ${r.files.map((f) => `${f.cut ?? "full"} (${f.cues} cues)`).join(", ")}`);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  };

  const cancel = async () => {
    if (!activeJob) return;
    try {
      await api.cancelJob(activeJob.id);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  };

  return (
    <div>
      <div className="card">
        <h3>Produce</h3>
        <div className="small muted" style={{marginBottom: 10}}>
          {hasBuild ? (
            <>
              Build: {build!.scenes} scenes · {fmtDuration(build!.totalMs)} · built {new Date(build!.builtAt).toLocaleString()}
              {build!.cuts.length ? ` · cuts: ${build!.cuts.map((c) => `${c.id} (${fmtDuration(c.totalMs)})`).join(", ")}` : ""}
            </>
          ) : (
            "No build yet. Produce preview synthesizes every line with Edge TTS (free, cached by text hash), writes captions and renders half-resolution MP4s in both formats plus each cut."
          )}
        </div>
        <div className="btn-row">
          <button className="accent" disabled={running || !hasScript} onClick={() => guard(() => api.produce(episodeId))} title="Voice → captions → preview MP4s (both formats) → cut previews">
            Produce preview
          </button>
          <button className="primary" disabled={running || !hasBuild} onClick={() => guard(() => api.finalize(episodeId))} title="Captions → final MP4s (both formats, CRF 18) → cut finals">
            Render finals
          </button>
          <button disabled={running || !hasBuild} onClick={makeCaptions} title="Writes out/<id>/<id>-captions.srt and .vtt for the episode and every built cut">
            Generate captions
          </button>
          {running && (
            <button className="changes sm" onClick={cancel}>
              Cancel job
            </button>
          )}
        </div>
        <details style={{marginTop: 10}}>
          <summary className="small muted" style={{cursor: "pointer"}}>
            Single steps
          </summary>
          <div className="btn-row" style={{marginTop: 8}}>
            <button disabled={running || !hasScript} onClick={() => start("voice")}>
              Build voice
            </button>
            <button disabled={running || !hasBuild} onClick={() => start("preview")} title="Half resolution, CRF 30, both formats (~3 min)">
              Render preview (both)
            </button>
            <button disabled={running || !hasBuild} onClick={() => start("final")} title="Full quality, CRF 18, both formats">
              Render final (both)
            </button>
            <span style={{display: "inline-flex", gap: 6, alignItems: "center"}}>
              <select value={cut} onChange={(e) => setCut(e.target.value)} style={{width: "auto"}} disabled={!episode.cuts?.length}>
                {(episode.cuts ?? []).map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.id}
                  </option>
                ))}
                {!episode.cuts?.length && <option value="">no cuts in episode.json</option>}
              </select>
              <label className="small" style={{display: "inline-flex", gap: 4, alignItems: "center"}}>
                <input type="checkbox" checked={cutPreview} onChange={(e) => setCutPreview(e.target.checked)} style={{width: "auto"}} /> preview
              </label>
              <button disabled={running || !hasBuild || !cut} onClick={() => start("cut", cut, cutPreview)} title="Vertical cutdown, 9:16">
                Render cut
              </button>
            </span>
          </div>
        </details>
        {error && <div className="notice bad">{error}</div>}
        {info && <div className="notice ok">{info}</div>}
      </div>

      <div className="card">
        <div style={{display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8}}>
          <h3 style={{margin: 0}}>Job log</h3>
          <span className="small muted">
            {activeJob ? (
              <>
                {activeJob.status === "running" ? <span className="spinner" /> : null} {activeJob.label} · {activeJob.status}
                {stream.exitCode !== null ? ` (exit ${stream.exitCode})` : ""}
              </>
            ) : (
              "No job yet"
            )}
          </span>
        </div>
        <LogView lines={stream.lines} />
      </div>

      <div className="card">
        <h3>Outputs in out/{episodeId}/</h3>
        {videos.length === 0 && <div className="muted small">No MP4s yet.</div>}
        <div className="outputs">
          {videos.map((o) => (
            <div key={o.name} className="output">
              <video src={`${o.url}?t=${encodeURIComponent(o.mtime)}`} controls preload="metadata" />
              <div className="meta">
                <span className="mono">{o.name}</span>
                <span>
                  {o.preview ? "preview · " : ""}
                  {fmtBytes(o.size)} · <a href={o.url} download={o.name}>download</a>
                </span>
              </div>
            </div>
          ))}
        </div>
        {captions.length > 0 && (
          <div style={{marginTop: 14}}>
            <div className="kicker">Captions</div>
            <table className="list">
              <tbody>
                {captions.map((o) => (
                  <tr key={o.name}>
                    <td className="mono">{o.name}</td>
                    <td className="muted">{fmtBytes(o.size)}</td>
                    <td className="muted small">{new Date(o.mtime).toLocaleString()}</td>
                    <td style={{textAlign: "right"}}>
                      <a href={o.url} download={o.name}>
                        download
                      </a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
