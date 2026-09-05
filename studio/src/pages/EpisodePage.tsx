import {useCallback, useEffect, useState} from "react";
import {Link, useParams, useSearchParams} from "react-router-dom";
import {api, engineLabel, fmtDuration, FORMAT_LABELS, type EpisodeDetail, type EpisodeJson, type Job, type Output, type Status} from "../api";
import {GateStepper} from "../components/GateStepper";
import {Doc} from "../components/Markdown";
import {ScriptEditor} from "../components/ScriptEditor";
import {Storyboard} from "../components/Storyboard";
import {Preview} from "../components/Preview";
import {BuildRender} from "../components/BuildRender";
import {PublishTab} from "../components/PublishTab";
import {Downloads} from "../components/Downloads";
import {LogView} from "../components/JobLog";
import {useJobStream} from "../components/useJobStream";

const TABS = [
  ["brief", "Brief & story"],
  ["script", "Script"],
  ["storyboard", "Storyboard"],
  ["preview", "Preview"],
  ["build", "Build & render"],
  ["publish", "Publish"],
] as const;
type Tab = (typeof TABS)[number][0];

const BRIEF_DOCS = (name: string) => name !== "storyboard.md" && name !== "quality-report.md" && name !== "publish.md";

export const EpisodePage = () => {
  const {id = ""} = useParams();
  const [params, setParams] = useSearchParams();
  const requested = params.get("tab") === "quality" ? "publish" : params.get("tab");
  const tab = (TABS.some(([t]) => t === requested) ? requested : "brief") as Tab;
  const [detail, setDetail] = useState<EpisodeDetail | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | null>(params.get("job"));
  const [dockOpen, setDockOpen] = useState(true);

  const load = useCallback(() => {
    api
      .episode(id)
      .then((d) => {
        setDetail(d);
        setError(null);
        if (d.job && d.job.status === "running") setJobId((j) => j ?? d.job!.id);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, [id]);

  useEffect(load, [load]);

  const stream = useJobStream(jobId, () => {
    // A finished job may have written episode.json, status.json, build.json, captions or MP4s.
    setTimeout(load, 300);
  });

  // Chained jobs write files stage by stage; refresh while one runs so new outputs show up as they land.
  const activeJob: Job | null = stream.job ?? detail?.job ?? null;
  const jobRunning = Boolean(activeJob && activeJob.status === "running" && !stream.done);
  useEffect(() => {
    if (!jobRunning) return;
    const t = setInterval(load, 10000);
    return () => clearInterval(t);
  }, [jobRunning, load]);

  const setTab = (t: Tab) => {
    const next = new URLSearchParams(params);
    next.set("tab", t);
    setParams(next, {replace: true});
  };

  const onJobStarted = (job: Job) => {
    setJobId(job.id);
    setDockOpen(true);
    setDetail((d) => (d ? {...d, job} : d));
  };

  if (error) {
    return (
      <div className="notice bad">
        {error} · <Link to="/">Back to episodes</Link>
      </div>
    );
  }
  if (!detail) return <div className="muted">Loading {id}…</div>;

  const {episode, status, docs, build, outputs, cast, stage} = detail;
  const doc = (name: string) => docs.find((d) => d.name === name)?.content;
  const hasBuild = Boolean(build && !build.error);
  const costs = [status.cost?.script_usd ? `script $${status.cost.script_usd.toFixed(2)}` : "", status.cost?.publish_usd ? `kit $${status.cost.publish_usd.toFixed(2)}` : ""].filter(Boolean);
  if (!costs.length && status.engine?.name === "ollama") costs.push("$0.00");
  if (status.engine) costs.push(engineLabel(status.engine));

  return (
    <>
      <div className="page-head">
        <div style={{minWidth: 0}}>
          <div className="kicker">
            <Link to="/" style={{color: "inherit"}}>
              Episodes
            </Link>{" "}
            · {id} · v{status.version} · {FORMAT_LABELS[status.format ?? "build"] ?? status.format}
            {status.auto ? " · auto-produce" : ""}
          </div>
          <h1>{episode.title}</h1>
          <div className="muted small">
            Episode {episode.episode} · {episode.scenes.length} scenes · {hasBuild ? `${fmtDuration(build!.totalMs)} built` : "no voice build"} · {outputs.filter((o) => o.type === "video").length} MP4 · <span className="chip other">{stage}</span> · disclosure: {episode.disclosure ?? status.disclosure ?? "none"}
            {status.publication ? ` · publish: ${status.publication.plan}${status.publication.date ? ` ${status.publication.date}` : ""}` : ""}
            {costs.length ? ` · cost ${costs.join(", ")}` : ""}
          </div>
        </div>
        <div className="btn-row">
          {jobRunning ? (
            <span className="chip blue">
              <span className="spinner" /> {activeJob?.label}
            </span>
          ) : null}
          <Downloads outputs={outputs} />
          <button onClick={load}>Refresh</button>
        </div>
      </div>

      <div className="card">
        <GateStepper episodeId={id} status={status} onChange={(s: Status) => setDetail({...detail, status: s})} />
      </div>

      <div className="tabs">
        {TABS.map(([key, label]) => (
          <button key={key} className={tab === key ? "active" : ""} onClick={() => setTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "brief" && (
        <div>
          {status.storyline ? (
            <div className="card tight" style={{marginBottom: 12}}>
              <div className="kicker">Hippolyte's storyline</div>
              <div style={{whiteSpace: "pre-wrap"}}>{status.storyline}</div>
            </div>
          ) : null}
          {docs.filter((d) => BRIEF_DOCS(d.name)).length === 0 && <div className="notice">No brief or story documents in episodes/{id}/ yet.</div>}
          {docs.filter((d) => BRIEF_DOCS(d.name)).map((d, i) => (
            <Doc key={d.name} name={d.name} content={d.content} open={i === 0} />
          ))}
          <div className="card tight small muted" style={{marginTop: 12}}>
            Setting: {status.setting?.country || "—"} · {status.setting?.place || "—"} · {status.setting?.community || "—"} · languages: {(status.setting?.languages ?? []).join(", ") || "—"} · reviewer: {status.setting?.reviewer || "—"}
          </div>
        </div>
      )}

      {tab === "script" && <ScriptEditor key={`${id}-${detail.status.version}-${episode.scenes.length}`} episodeId={id} episode={episode} cast={cast} onSaved={(e: EpisodeJson) => setDetail({...detail, episode: e})} />}

      {tab === "storyboard" && <Storyboard episode={episode} storyboardMd={doc("storyboard.md")} />}

      {tab === "preview" && <Preview episodeId={id} build={build} />}

      {tab === "build" && <BuildRender episodeId={id} episode={episode} build={build} outputs={outputs} activeJob={activeJob} stream={stream} onJobStarted={onJobStarted} onOutputs={(o: Output[]) => setDetail({...detail, outputs: o})} />}

      {tab === "publish" && <PublishTab episodeId={id} status={status} publishKit={detail.publishKit} schedule={detail.schedule} onReload={load} publishMd={doc("publish.md")} qualityMd={doc("quality-report.md")} hasBuild={hasBuild} running={jobRunning} onJobStarted={onJobStarted} onStatus={(s: Status) => setDetail({...detail, status: s, stage: s.publication && s.publication.plan !== "Hold" ? "published" : detail.stage})} />}

      {jobId && tab !== "build" && (
        <div className="job-dock">
          <div className="head">
            {jobRunning ? <span className="spinner" /> : null}
            <strong>{activeJob?.label ?? "Job"}</strong>
            <span className="muted small">
              {activeJob?.status}
              {stream.exitCode !== null ? ` · exit ${stream.exitCode}` : ""}
            </span>
            <span style={{flex: 1}} />
            <button className="ghost sm" onClick={() => setTab("build")}>
              Open Build & render
            </button>
            <button className="ghost sm" onClick={() => setDockOpen((o) => !o)}>
              {dockOpen ? "Hide" : "Show"}
            </button>
            {!jobRunning && (
              <button className="ghost sm" onClick={() => setJobId(null)}>
                Dismiss
              </button>
            )}
          </div>
          {dockOpen && <LogView lines={stream.lines} />}
        </div>
      )}
    </>
  );
};
