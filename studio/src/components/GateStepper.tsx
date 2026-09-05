import {useState} from "react";
import {api, gateState, GATES, type Gate, type GateDecision, type Status} from "../api";

type Props = {episodeId: string; status: Status; onChange: (s: Status) => void};

export const GateStepper = ({episodeId, status, onChange}: Props) => {
  const [selected, setSelected] = useState<Gate | null>(null);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const decide = async (decision: GateDecision) => {
    if (!selected) return;
    setBusy(true);
    setError(null);
    try {
      onChange(await api.gate(episodeId, selected, decision, note));
      setNote("");
      setSelected(null);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  const approvals = (status.approvals ?? []).filter((a) => a.gate === selected);

  return (
    <div>
      <div className="stepper">
        {GATES.map((g, i) => {
          const value = status.gates[g];
          return (
            <div key={g} className={`step ${gateState(value)} ${selected === g ? "selected" : ""}`} onClick={() => setSelected(selected === g ? null : g)} title={value}>
              <div className="n">Gate {i + 1}</div>
              <div className="name">{g}</div>
              <div className="small muted" style={{overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"}}>
                {value ?? "pending"}
              </div>
            </div>
          );
        })}
      </div>
      {selected && (
        <div className="gate-panel">
          <div style={{display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap"}}>
            <div>
              <h3 style={{textTransform: "capitalize"}}>
                Gate {GATES.indexOf(selected) + 1}: {selected}
              </h3>
              <div className="small muted">
                Current: <strong>{status.gates[selected]}</strong> · version {status.version}. "Request changes" bumps the version; the decision is recorded in status.json with a timestamp.
              </div>
            </div>
            <button className="ghost sm" onClick={() => setSelected(null)}>
              Close
            </button>
          </div>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="Note (what was decided, what must change)" style={{margin: "10px 0"}} />
          <div className="btn-row">
            <button className="approve" disabled={busy} onClick={() => decide("approved")}>
              Approve
            </button>
            <button className="changes" disabled={busy} onClick={() => decide("changes")}>
              Request changes
            </button>
            <button className="ghost sm" disabled={busy} onClick={() => decide("pending")}>
              Reset to pending
            </button>
            {error && <span className="error">{error}</span>}
          </div>
          {approvals.length > 0 && (
            <div style={{marginTop: 12}}>
              <div className="kicker">History</div>
              {approvals
                .slice()
                .reverse()
                .map((a, i) => (
                  <div key={i} className="small" style={{marginTop: 4}}>
                    <span className={`chip ${gateState(a.decision ?? "approved")}`}>{a.decision ?? "approved"}</span> {a.by} · {new Date(a.at).toLocaleString()}
                    {a.note ? <span className="muted"> — {a.note}</span> : null}
                  </div>
                ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
