import {useCallback, useEffect, useState} from "react";
import {api, type Connections, type LogLine, type ScheduleEntry} from "../api";
import {ConnectionsPanel} from "../components/Connections";
import {ScheduleList} from "../components/Schedule";
import {WeekCalendar, mondayOf} from "../components/WeekCalendar";

// /publishing: week calendar (left), connections (right), upcoming list and the publish log below.
export const Publishing = () => {
  const [entries, setEntries] = useState<ScheduleEntry[] | null>(null);
  const [conns, setConns] = useState<Connections | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [week, setWeek] = useState<Date>(() => mondayOf(new Date()));
  const [selected, setSelected] = useState<string | null>(null);
  const [log, setLog] = useState<LogLine[]>([]);

  const load = useCallback(() => {
    api
      .schedule()
      .then((e) => {
        setEntries(e);
        setError(null);
      })
      .catch((e) => setError(String(e.message ?? e)));
    api.publishLog(40).then(setLog).catch(() => undefined);
  }, []);

  useEffect(() => {
    load();
    api
      .connections()
      .then(setConns)
      .catch((e) => setError(String(e.message ?? e)));
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
  }, [load]);

  const select = (e: ScheduleEntry) => {
    setSelected(e.id);
    document.getElementById(`entry-${e.id}`)?.scrollIntoView({behavior: "smooth", block: "center"});
  };

  const pending = entries?.filter((e) => e.status !== "published") ?? [];
  const attention = pending.filter((e) => ["failed", "needs_url", "due"].includes(e.status));

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">AI With Hippolyte · The AI Workshop</div>
          <h1>Publishing</h1>
          <div className="muted">Connect platforms, put finished assets on the calendar, and let the Studio upload them at the slot. Only entries you add here are ever published.</div>
        </div>
        <div className="btn-row">
          {attention.length > 0 && <span className="chip pending">{attention.length} need attention</span>}
          <button onClick={load}>Refresh</button>
        </div>
      </div>

      {error && <div className="notice bad">Cannot reach the API: {error}</div>}

      <div className="pub-layout">
        <div className="card" style={{padding: 14}}>
          {entries ? <WeekCalendar entries={entries} week={week} onWeek={setWeek} onSelect={select} selectedId={selected} /> : <div className="muted">Loading schedule…</div>}
        </div>
        <div>
          <div className="kicker" style={{margin: "4px 0 8px"}}>
            Connections
          </div>
          {conns ? <ConnectionsPanel conns={conns} onChange={setConns} /> : <div className="muted small">Loading connections…</div>}
        </div>
      </div>

      <div className="card" style={{marginTop: 16}}>
        <h3>Upcoming</h3>
        <div className="small muted" style={{marginBottom: 10}}>
          Direct entries are uploaded 10 minutes before the slot (Facebook: 20) with the platform's own scheduling; Blotato entries were handed to Blotato when added; manual entries become due at the slot. The scheduler checks every minute while the API runs.
        </div>
        {entries ? <ScheduleList entries={entries} conns={conns} onChanged={load} selectedId={selected} /> : null}
      </div>

      <details className="card" style={{marginTop: 16}}>
        <summary className="small muted" style={{cursor: "pointer"}}>
          Publish log (studio/publish-log.jsonl, last {log.length})
        </summary>
        <div className="log" style={{height: 220, marginTop: 10}}>
          {log.length === 0 ? <span className="muted">Nothing logged yet.</span> : null}
          {log
            .slice()
            .reverse()
            .map((l, i) => (
              <div key={i} className={l.action === "failed" ? "err" : undefined}>
                {new Date(l.at).toLocaleString()} · {l.action} · {l.episodeId ?? ""} {l.platform ?? ""} {l.via ? `via ${l.via}` : ""} {l.error ?? l.detail ?? l.remoteUrl ?? ""}
              </div>
            ))}
        </div>
      </details>
    </>
  );
};
