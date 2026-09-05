import {useState} from "react";
import {api, engineLabel, PLANS, type EngineInfo, type Job, type Plan, type Status} from "../api";
import {Doc} from "./Markdown";
import {EngineLine} from "./EngineLine";

type Props = {
  episodeId: string;
  status: Status;
  publishMd?: string;
  qualityMd?: string;
  hasBuild: boolean;
  running: boolean;
  onJobStarted: (job: Job) => void;
  onStatus: (s: Status) => void;
};

const PLAN_HINT: Record<Plan, string> = {
  YouTube: "Main 16:9 episode on the channel.",
  Shorts: "Vertical cut on Shorts, Reels or TikTok.",
  LinkedIn: "Post with the LinkedIn text from the kit.",
  Hold: "Keep it in the queue; no gate change.",
};

export const PublishTab = ({episodeId, status, publishMd, qualityMd, hasBuild, running, onJobStarted, onStatus}: Props) => {
  const current = status.publication ?? null;
  const [plan, setPlan] = useState<Plan>(current?.plan ?? "Hold");
  const [date, setDate] = useState(current?.date ?? "");
  const [note, setNote] = useState(current?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineInfo | null>(null);

  const generate = async () => {
    setError(null);
    try {
      onJobStarted(await api.publishKit(episodeId));
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  };

  const decide = async () => {
    setBusy(true);
    setError(null);
    setSaved(null);
    try {
      const s = await api.publication(episodeId, plan, date, note);
      onStatus(s);
      setSaved(plan === "Hold" ? "Recorded: on hold. Gate 6 unchanged." : `Recorded: ${plan}${date ? ` on ${date}` : ""}. Gate 6 marked approved for the record.`);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap"}}>
          <div>
            <h3>Publishing kit</h3>
            <div className="small muted">
              Titles, YouTube description with chapters, tags, thumbnail brief, short-clip suggestions, LinkedIn post and newsletter blurb, written by the text engine from the script and build.json timestamps into episodes/{episodeId}/publish.md (Ollama: $0; Claude CLI: metered, roughly $0.05 to $0.30).
              {status.cost?.publish_usd ? ` Spent so far: $${status.cost.publish_usd.toFixed(2)}.` : ""}
              {status.engine ? ` Last written with ${engineLabel(status.engine)}.` : ""}
            </div>
          </div>
          <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8}}>
            <button className="accent" disabled={running || !hasBuild || (engine ? !engine.ready : false)} onClick={generate} title={hasBuild ? (engine ? `Runs the ${engine.engine === "ollama" ? `local model ${engine.ollamaModel}` : "Claude CLI"}` : "Runs the text engine") : "Build voice first: the kit needs scene timestamps"}>
              {publishMd ? "Regenerate publishing kit" : "Generate publishing kit"}
              {engine ? (engine.engine === "ollama" ? " · $0" : " · metered") : ""}
            </button>
            <EngineLine compact onChange={setEngine} />
          </div>
        </div>
        {!hasBuild && <div className="notice warn">Build voice first (Build & render → Produce preview): the kit takes chapter timestamps from build.json.</div>}
        {error && <div className="notice bad">{error}</div>}
      </div>

      {publishMd ? <Doc name="publish.md" content={publishMd} open /> : <div className="notice">No publish.md yet. Generate the kit, or let the Showrunner write it after gate 5.</div>}

      <div className="card">
        <h3>Publishing decision</h3>
        <div className="small muted" style={{marginBottom: 10}}>
          The team never posts. This records your decision in status.json under "publication"; any plan other than Hold marks gate 6 as approved with the note "authorized by Hippolyte via Studio".
        </div>
        <div className="plans">
          {PLANS.map((p) => (
            <label key={p} className={`plan ${plan === p ? "selected" : ""}`}>
              <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} />
              <span>
                <strong>{p}</strong>
                <div className="small muted">{PLAN_HINT[p]}</div>
              </span>
            </label>
          ))}
        </div>
        <div className="grid-2">
          <label className="field">
            <span>Date (optional)</span>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className="field">
            <span>Note</span>
            <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Which title, which clip, anything for the record" />
          </label>
        </div>
        <div className="btn-row">
          <button className={plan === "Hold" ? "" : "approve"} disabled={busy} onClick={decide}>
            {busy ? "Saving…" : plan === "Hold" ? "Record: hold" : `Record: publish on ${plan}`}
          </button>
          {current && (
            <span className="small muted">
              Current: <strong>{current.plan}</strong>
              {current.date ? ` on ${current.date}` : ""} · decided {new Date(current.decidedAt).toLocaleString()}
              {current.note ? ` — ${current.note}` : ""}
            </span>
          )}
          {saved && <span className="small" style={{color: "#065f56"}}>{saved}</span>}
        </div>
      </div>

      {qualityMd ? <Doc name="quality-report.md" content={qualityMd} /> : <div className="notice small">No quality-report.md yet. The Quality Editor writes it before gate 5.</div>}
    </div>
  );
};
