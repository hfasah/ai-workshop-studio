import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {api, fmtWhen, fromLocalInput, PLATFORM_META, splitTags, statusChip, toLocalInput, type Asset, type Connections, type PlatformId, type ScheduleEntry, type Via} from "../api";

export const PlatformBadge = ({platform, size = 22}: {platform: PlatformId; size?: number}) => {
  const m = PLATFORM_META[platform] ?? PLATFORM_META.manual;
  return (
    <span className="pbadge" style={{background: m.color, width: size, height: size, fontSize: Math.round(size * 0.42)}} title={m.label}>
      {m.short}
    </span>
  );
};

export const platformLabel = (platform: PlatformId, conns: Connections | null) => conns?.platforms[platform]?.label ?? PLATFORM_META[platform]?.label ?? platform;

// Which "via" values are usable for a platform given the connections: direct when its connection is connected, Blotato when a key is set, manual always.
export const viaOptions = (platform: PlatformId, conns: Connections | null): {value: Via; label: string; enabled: boolean; hint: string}[] => {
  const p = conns?.platforms[platform];
  const directConn = p?.direct ? (p.direct === "youtube" ? conns?.youtube : conns?.facebook) : null;
  const directOk = Boolean(directConn && directConn.status === "connected");
  const directName = p?.direct === "youtube" ? conns?.youtube.channelTitle : conns?.facebook.pageName;
  const blAcc = p?.blotato ? conns?.blotato.accounts.find((a) => a.platform === p.blotato) : undefined;
  const blotatoOk = Boolean(p?.blotato && conns?.blotato.status === "connected");
  const out: {value: Via; label: string; enabled: boolean; hint: string}[] = [];
  if (p?.direct) out.push({value: "direct", label: `Direct (${p.direct === "youtube" ? "YouTube" : "Facebook Page"}${directName ? `: ${directName}` : ""})`, enabled: directOk, hint: directOk ? "Uploaded by the Studio at the scheduled time, free" : `Connect ${p.direct === "youtube" ? "YouTube" : "the Facebook Page"} on the Publishing page`});
  if (p?.blotato) out.push({value: "blotato", label: `Blotato${blAcc ? ` (@${blAcc.username || blAcc.fullname})` : ""}`, enabled: blotatoOk, hint: blotatoOk ? "Sent to Blotato now; needs a public video URL" : "Paste a Blotato API key on the Publishing page"});
  out.push({value: "manual", label: "Manual (copy the caption, post yourself)", enabled: true, hint: "The entry becomes due at the slot; mark it posted with the URL"});
  return out;
};

const canEdit = (e: ScheduleEntry) => e.status !== "published" && e.status !== "uploading";
const canPublishNow = (e: ScheduleEntry) => e.via !== "manual" && ["scheduled", "failed", "needs_url", "draft"].includes(e.status) && !(e.via === "blotato" && e.remoteId && e.status === "scheduled");
const canMarkPosted = (e: ScheduleEntry) => e.status !== "published" && e.status !== "uploading";

type EditorProps = {entry: ScheduleEntry; conns: Connections | null; onSaved: (e: ScheduleEntry) => void; onCancel: () => void};

// Inline editor for one entry (title, caption, hashtags, slot, via, public URL, asset).
export const EntryEditor = ({entry, conns, onSaved, onCancel}: EditorProps) => {
  const [title, setTitle] = useState(entry.title);
  const [description, setDescription] = useState(entry.description);
  const [hashtags, setHashtags] = useState(entry.hashtags.join(" "));
  const [when, setWhen] = useState(toLocalInput(entry.scheduledAt));
  const [via, setVia] = useState<Via>(entry.via);
  const [publicUrl, setPublicUrl] = useState(entry.publicUrl ?? "");
  const [asset, setAsset] = useState(entry.asset);
  const [draft, setDraft] = useState(entry.status === "draft");
  const [assets, setAssets] = useState<Asset[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .assets(entry.episodeId)
      .then(setAssets)
      .catch(() => setAssets([]));
  }, [entry.episodeId]);

  const p = conns?.platforms[entry.platform];
  const caption = `${description.trim()}${hashtags.trim() ? `\n\n${splitTags(hashtags).join(" ")}` : ""}`;
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      onSaved(await api.updateSchedule(entry.id, {title, description, hashtags: splitTags(hashtags), scheduledAt: fromLocalInput(when), via, publicUrl, asset, status: draft ? "draft" : "scheduled"}));
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="entry-editor">
      <div className="grid-2">
        <label className="field">
          <span>
            Title {p?.titleMax ? <em className={`counter ${title.length > p.titleMax ? "over" : ""}`}>{title.length} / {p.titleMax}</em> : null}
          </span>
          <input value={title} onChange={(e) => setTitle(e.target.value)} />
        </label>
        <label className="field">
          <span>Asset (out/{entry.episodeId}/)</span>
          <select value={asset} onChange={(e) => setAsset(e.target.value)}>
            {!assets.some((a) => a.asset === asset) && <option value={asset}>{asset}</option>}
            {assets.map((a) => (
              <option key={a.asset} value={a.asset}>
                {a.name} · {a.width && a.height ? `${a.width}x${a.height}` : a.aspect ?? "?"}
                {a.preview ? " · preview" : ""}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="field">
        <span>
          Caption <em className={`counter ${p && caption.length > p.textMax ? "over" : ""}`}>{caption.length} / {p?.textMax ?? "–"} with hashtags</em>
        </span>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4} />
      </label>
      <div className="grid-2">
        <label className="field">
          <span>Hashtags ({splitTags(hashtags).length})</span>
          <input value={hashtags} onChange={(e) => setHashtags(e.target.value)} placeholder="#AIWithHippolyte #AfricaAIMoment" />
        </label>
        <label className="field">
          <span>When (local time)</span>
          <input type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} />
        </label>
      </div>
      <div className="grid-2">
        <label className="field">
          <span>Via</span>
          <select value={via} onChange={(e) => setVia(e.target.value as Via)}>
            {viaOptions(entry.platform, conns).map((o) => (
              <option key={o.value} value={o.value} disabled={!o.enabled} title={o.hint}>
                {o.label}
                {o.enabled ? "" : " (not connected)"}
              </option>
            ))}
          </select>
        </label>
        {via === "blotato" ? (
          <label className="field">
            <span>Public video URL (Drive, Dropbox, your site)</span>
            <input value={publicUrl} onChange={(e) => setPublicUrl(e.target.value)} placeholder="https://…/ep002-short1-9x16.mp4" />
          </label>
        ) : (
          <label className="check" style={{marginTop: 22}}>
            <input type="checkbox" checked={draft} onChange={(e) => setDraft(e.target.checked)} />
            <span className="small">Keep as draft (never published until unchecked)</span>
          </label>
        )}
      </div>
      {error && <div className="notice bad">{error}</div>}
      <div className="btn-row">
        <button className="primary sm" disabled={busy} onClick={save}>
          {busy ? "Saving…" : "Save"}
        </button>
        <button className="sm" disabled={busy} onClick={onCancel}>
          Cancel
        </button>
      </div>
    </div>
  );
};

type ListProps = {
  entries: ScheduleEntry[];
  conns: Connections | null;
  onChanged: () => void;
  selectedId?: string | null;
  compact?: boolean; // episode page: hide the episode column
  showPublished?: boolean;
};

// Upcoming list with edit / delete / publish now / mark as posted.
export const ScheduleList = ({entries, conns, onChanged, selectedId, compact = false, showPublished = false}: ListProps) => {
  const [editing, setEditing] = useState<string | null>(null);
  const [posting, setPosting] = useState<string | null>(null);
  const [postUrl, setPostUrl] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [withPublished, setWithPublished] = useState(showPublished);

  useEffect(() => {
    if (selectedId) setEditing(null);
  }, [selectedId]);

  const shown = entries.filter((e) => withPublished || e.status !== "published").sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const publishedCount = entries.filter((e) => e.status === "published").length;

  const run = async (id: string, fn: () => Promise<unknown>, ok?: string) => {
    setBusy(id);
    setError(null);
    setInfo(null);
    try {
      const r = (await fn()) as {warning?: string | null} | ScheduleEntry;
      if (r && "warning" in r && r.warning) setInfo(r.warning);
      else if (ok) setInfo(ok);
      onChanged();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(null);
    }
  };

  const publishNow = (e: ScheduleEntry) => {
    const what = e.via === "blotato" ? `send ${platformLabel(e.platform, conns)} to Blotato now` : `upload ${e.asset} to ${platformLabel(e.platform, conns)} now`;
    if (!window.confirm(`This will ${what}${e.via === "direct" ? " and publish it immediately" : ""}. Continue?`)) return;
    run(e.id, () => api.publishNow(e.id), "Sent.");
  };
  const remove = (e: ScheduleEntry) => {
    if (!window.confirm(`Delete the ${platformLabel(e.platform, conns)} entry for ${e.episodeId} on ${fmtWhen(e.scheduledAt)}?`)) return;
    run(e.id, () => api.deleteSchedule(e.id));
  };

  return (
    <div>
      {error && <div className="notice bad">{error}</div>}
      {info && <div className="notice">{info}</div>}
      {shown.length === 0 && <div className="muted small">{entries.length ? "Nothing pending." : compact ? "No schedule entries for this episode yet." : "Nothing scheduled yet. Open an episode → Publish tab → Add to schedule."}</div>}
      {shown.map((e) => (
        <div key={e.id} className={`entry ${selectedId === e.id ? "selected" : ""} status-${e.status}`} id={`entry-${e.id}`}>
          <div className="entry-row">
            <PlatformBadge platform={e.platform} />
            <div className="entry-main">
              <div>
                <strong>{platformLabel(e.platform, conns)}</strong> · {fmtWhen(e.scheduledAt)} · <span className={`chip ${statusChip(e.status)}`}>{e.status.replace("_", " ")}</span> <span className="chip other">via {e.via}</span>
                {e.scheduledNatively ? <span className="small muted"> · scheduled on the platform</span> : null}
              </div>
              <div className="small muted">
                {!compact && (
                  <>
                    <Link to={`/ep/${e.episodeId}?tab=publish`}>{e.episodeId}</Link> {e.episodeTitle} ·{" "}
                  </>
                )}
                {e.title ? <>“{e.title}” · </> : null}
                <a href={e.assetUrl} target="_blank" rel="noreferrer" className="mono">
                  {e.asset}
                </a>
                {e.remoteUrl ? (
                  <>
                    {" "}
                    ·{" "}
                    <a href={e.remoteUrl} target="_blank" rel="noreferrer">
                      {e.remoteUrl}
                    </a>
                  </>
                ) : null}
                {e.remoteId && !e.remoteUrl ? ` · id ${e.remoteId}` : ""}
              </div>
              {e.error && <div className="small warn-text">{e.error}</div>}
              {e.status === "due" && e.via === "manual" && <div className="small" style={{color: "#7a5a00"}}>Due: post it yourself, then mark it posted.</div>}
            </div>
            <div className="btn-row entry-actions">
              {(e.via === "manual" || e.status === "due") && canMarkPosted(e) && (
                <button className="sm" disabled={busy === e.id} onClick={() => (posting === e.id ? setPosting(null) : (setPosting(e.id), setPostUrl(""), setEditing(null)))}>
                  Mark as posted
                </button>
              )}
              {canPublishNow(e) && (
                <button className="sm accent" disabled={busy === e.id} onClick={() => publishNow(e)} title={e.via === "blotato" ? "Send to Blotato now" : "Upload and publish now"}>
                  {e.status === "failed" ? "Retry now" : "Publish now"}
                </button>
              )}
              {canEdit(e) && (
                <button className="sm" disabled={busy === e.id} onClick={() => (setEditing(editing === e.id ? null : e.id), setPosting(null))}>
                  {editing === e.id ? "Close" : "Edit"}
                </button>
              )}
              <button className="sm ghost" disabled={busy === e.id} onClick={() => remove(e)}>
                Delete
              </button>
            </div>
          </div>
          {posting === e.id && (
            <div className="entry-editor">
              <div className="small muted" style={{marginBottom: 6}}>Caption to copy:</div>
              <pre className="caption-box">{e.caption}</pre>
              <div className="btn-row">
                <input value={postUrl} onChange={(ev) => setPostUrl(ev.target.value)} placeholder="URL of the published post (optional)" style={{flex: 1, minWidth: 240}} />
                <button className="approve sm" disabled={busy === e.id} onClick={() => run(e.id, () => api.markPosted(e.id, postUrl), "Marked as posted.")}>
                  Mark as posted
                </button>
                <button className="sm ghost" onClick={() => navigator.clipboard?.writeText(e.caption)}>
                  Copy caption
                </button>
              </div>
            </div>
          )}
          {editing === e.id && (
            <EntryEditor
              entry={e}
              conns={conns}
              onCancel={() => setEditing(null)}
              onSaved={() => {
                setEditing(null);
                onChanged();
              }}
            />
          )}
        </div>
      ))}
      {publishedCount > 0 && (
        <button className="ghost sm" style={{marginTop: 6}} onClick={() => setWithPublished((v) => !v)}>
          {withPublished ? "Hide published" : `Show ${publishedCount} published`}
        </button>
      )}
    </div>
  );
};
