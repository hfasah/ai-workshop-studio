import {useCallback, useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {api, type Connections, type LogLine, type ScheduleEntry} from "../api";
import {ScheduleList} from "../components/Schedule";
import {WeekCalendar, mondayOf} from "../components/WeekCalendar";
import {AccountGrid} from "./Accounts";

// /publishing: week calendar (left), account readiness (right), upcoming list and the publish log below.
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
          <div className="muted">Put finished episodes on the calendar. YouTube and Facebook entries are uploaded right away and held by the platform until the slot, so this computer does not need to stay on. Only entries you add are ever published.</div>
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
        <div className="card" style={{padding: 14}}>
          <div className="conn-head">
            <h3 style={{margin: 0}}>Accounts</h3>
            <Link to="/accounts" className="small">
              Connect or manage
            </Link>
          </div>
          {conns ? <AccountGrid conns={conns} /> : <div className="muted small">Loading accounts…</div>}
        </div>
      </div>

      <div className="card" style={{marginTop: 16}}>
        <h3>Upcoming</h3>
        <div className="small muted" style={{marginBottom: 10}}>
          YouTube and Facebook entries are uploaded as soon as they are added, private, with the platform's own publish time, and go live at the slot whether or not this computer is on (Facebook only accepts slots within 30 days; later ones wait for the scheduler). Blotato entries were handed to Blotato when added. Manual entries become due at the slot. The scheduler checks every minute while the Studio runs, as a fallback.
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
