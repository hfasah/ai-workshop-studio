import {useEffect, useState} from "react";
import {Link, useNavigate} from "react-router-dom";
import {api, engineLabel, fmtDuration, FORMAT_LABELS, gateState, GATES, STAGES, type EpisodeSummary, type Stage} from "../api";

// Script + kit spend. $0.00 in green when the episode was written by the local engine.
const CostCell = ({e}: {e: EpisodeSummary}) => {
  const total = (e.cost?.script_usd ?? 0) + (e.cost?.publish_usd ?? 0) + (e.cost?.other_usd ?? 0);
  if (e.engine?.name === "ollama" && total === 0) {
    return (
      <span className="cost-free" title={engineLabel(e.engine)}>
        $0.00
      </span>
    );
  }
  if (!e.engine && total === 0) return <span className="muted">—</span>;
  return <span title={engineLabel(e.engine) || "recorded in status.json"}>${total.toFixed(2)}</span>;
};

const stageChip = (stage: Stage) => ({drafting: "other", "preview ready": "pending", "finals ready": "blue", published: "approved"})[stage];

export const Episodes = () => {
  const [episodes, setEpisodes] = useState<EpisodeSummary[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<Stage | "">("");
  const navigate = useNavigate();

  useEffect(() => {
    let alive = true;
    const load = () =>
      api
        .episodes()
        .then((e) => alive && setEpisodes(e))
        .catch((e) => alive && setError(String(e.message ?? e)));
    load();
    const t = setInterval(load, 5000);
    return () => {
      alive = false;
      clearInterval(t);
    };
  }, []);

  const shown = episodes?.filter((e) => !filter || e.stage === filter) ?? null;
  const count = (s: Stage) => episodes?.filter((e) => e.stage === s).length ?? 0;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">AI With Hippolyte · The AI Workshop</div>
          <h1>Episodes</h1>
          <div className="muted">Files under episodes/, public/episodes/ and out/ are the source of truth. Stories line up here; you decide what gets published.</div>
        </div>
        <Link to="/new">
          <button className="accent">New episode</button>
        </Link>
      </div>

      {error && <div className="notice bad">Cannot reach the API on port 4600: {error}. Start it with npm run api.</div>}

      <div className="filter-row">
        <button className={filter === "" ? "primary sm" : "sm"} onClick={() => setFilter("")}>
          All{episodes ? ` (${episodes.length})` : ""}
        </button>
        {STAGES.map((s) => (
          <button key={s} className={filter === s ? "primary sm" : "sm"} onClick={() => setFilter(s)}>
            {s} ({count(s)})
          </button>
        ))}
      </div>

      <div className="card" style={{padding: 0}}>
        <table className="list">
          <thead>
            <tr>
              <th>#</th>
              <th>Title</th>
              <th>Format</th>
              <th>Status</th>
              <th>Gates</th>
              <th>Duration</th>
              <th>Outputs</th>
              <th>Cost</th>
              <th>Publish plan</th>
              <th>v</th>
            </tr>
          </thead>
          <tbody>
            {shown?.map((e) => (
              <tr key={e.id} className="row-link" onClick={() => navigate(`/ep/${e.id}`)}>
                <td className="mono">{e.id}</td>
                <td>
                  <strong>{e.title}</strong>
                  <div className="small muted">
                    {e.scenes} scenes · {e.disclosure || "no disclosure"}
                    {e.job ? (
                      <>
                        {" "}
                        · <span className="spinner" /> {e.job.label}
                      </>
                    ) : null}
                  </div>
                </td>
                <td>{FORMAT_LABELS[e.format] ?? e.format}</td>
                <td>
                  <span className={`chip ${stageChip(e.stage)}`}>{e.stage}</span>
                </td>
                <td>
                  <div className="chips">
                    {GATES.map((g) => (
                      <span key={g} className={`chip ${gateState(e.gates[g])}`} title={`${g}: ${e.gates[g] ?? "pending"}`}>
                        {g}
                      </span>
                    ))}
                  </div>
                </td>
                <td>{e.hasBuild ? fmtDuration(e.totalMs) : <span className="muted">no build</span>}</td>
                <td>
                  {e.outputs.length ? `${e.outputs.length} MP4` : <span className="muted">none</span>}
                  {e.captions.length ? <div className="small muted">{e.captions.length} caption files</div> : null}
                </td>
                <td>
                  <CostCell e={e} />
                </td>
                <td>
                  {e.publication ? (
                    <>
                      <strong>{e.publication.plan}</strong>
                      {e.publication.date ? <div className="small muted">{e.publication.date}</div> : null}
                    </>
                  ) : (
                    <span className="muted">—</span>
                  )}
                </td>
                <td>{e.version}</td>
              </tr>
            ))}
            {shown && shown.length === 0 && (
              <tr>
                <td colSpan={10} className="muted">
                  {episodes?.length ? `No episodes at "${filter}".` : "No episodes yet."}
                </td>
              </tr>
            )}
            {!episodes && !error && (
              <tr>
                <td colSpan={10} className="muted">
                  Loading…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );
};
