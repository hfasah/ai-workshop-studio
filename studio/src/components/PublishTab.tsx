import {useEffect, useState} from "react";
import {Link} from "react-router-dom";
import {api, engineLabel, fromLocalInput, PLANS, splitTags, toLocalInput, type Asset, type Connections, type EngineInfo, type Job, type Plan, type PlatformId, type PublishKit, type ScheduleEntry, type Status, type Via} from "../api";
import {Doc} from "./Markdown";
import {EngineLine} from "./EngineLine";
import {PlatformBadge, ScheduleList, platformLabel, viaOptions} from "./Schedule";

type Props = {
  episodeId: string;
  status: Status;
  publishKit: PublishKit | null;
  schedule: ScheduleEntry[];
  publishMd?: string;
  qualityMd?: string;
  hasBuild: boolean;
  running: boolean;
  onJobStarted: (job: Job) => void;
  onStatus: (s: Status) => void;
  onReload: () => void;
};

const PLAN_HINT: Record<Plan, string> = {
  YouTube: "Main 16:9 episode on the channel.",
  Shorts: "Vertical cut on Shorts, Reels or TikTok.",
  LinkedIn: "Post with the LinkedIn text from the kit.",
  Hold: "Keep it in the queue; no gate change.",
};

// Cards, in the default stagger order. Recommended lengths come from the kit rules; hard limits from the platform.
const CARDS: {platform: PlatformId; titleRec?: number; textRec?: number; tagsRec: number; note: string}[] = [
  {platform: "youtube", titleRec: 60, textRec: 5000, tagsRec: 2, note: "16:9 final. Description with chapters + disclosure; 10 tags go with the upload."},
  {platform: "shorts", titleRec: 40, textRec: 150, tagsRec: 4, note: "9:16 cut. #Shorts + 3 hashtags in the description."},
  {platform: "instagram", textRec: 2200, tagsRec: 5, note: "9:16 Reel via Blotato. Hook, two paragraphs, a question, 5 hashtags on the last line."},
  {platform: "tiktok", textRec: 150, tagsRec: 4, note: "9:16 via Blotato. Caption ≤ 150 characters + 4 hashtags."},
  {platform: "facebook", textRec: 500, tagsRec: 2, note: "16:9 Page video, scheduled natively. Caption ≤ 500 characters, 0–2 hashtags."},
  {platform: "facebook_reel", textRec: 500, tagsRec: 2, note: "9:16 Reel on the Page (beta two-phase upload)."},
  {platform: "linkedin", textRec: 3000, tagsRec: 0, note: "16:9. Post in the host's voice, no hashtags, no links in the body. Manual unless LinkedIn is connected in Blotato."},
];

type CardState = {asset: string; title: string; description: string; hashtags: string; when: string; via: Via; publicUrl: string; titleIdx: number};

const kitFor = (kit: PublishKit | null, platform: PlatformId) => {
  if (!kit) return {titles: [] as string[], text: "", hashtags: [] as string[]};
  switch (platform) {
    case "youtube":
      return {titles: kit.youtube.titles, text: kit.youtube.description, hashtags: kit.youtube.hashtags};
    case "shorts":
      return {titles: kit.shorts.titles, text: kit.shorts.description, hashtags: kit.shorts.hashtags};
    case "instagram":
      return {titles: [], text: kit.instagram.caption, hashtags: kit.instagram.hashtags};
    case "tiktok":
      return {titles: [], text: kit.tiktok.caption, hashtags: kit.tiktok.hashtags};
    case "facebook":
    case "facebook_reel":
      return {titles: kit.youtube.titles, text: kit.facebook.caption, hashtags: kit.facebook.hashtags};
    case "linkedin":
      return {titles: [], text: kit.linkedin.post, hashtags: []};
    default:
      return {titles: [], text: "", hashtags: []};
  }
};

const pickAsset = (assets: Asset[], aspect: "16:9" | "9:16" | null) => {
  const finals = assets.filter((a) => !a.preview);
  const pool = finals.length ? finals : assets;
  const match = pool.filter((a) => !aspect || a.aspect === aspect);
  // Prefer the short cut for vertical platforms, the full episode for horizontal ones.
  const pref = aspect === "9:16" ? match.find((a) => /short/.test(a.name)) : match.find((a) => !/short/.test(a.name));
  return (pref ?? match[0] ?? pool[0])?.asset ?? "";
};

export const PublishTab = ({episodeId, status, publishKit, schedule, publishMd, qualityMd, hasBuild, running, onJobStarted, onStatus, onReload}: Props) => {
  const current = status.publication ?? null;
  const [plan, setPlan] = useState<Plan>(current?.plan ?? "Hold");
  const [date, setDate] = useState(current?.date ?? "");
  const [note, setNote] = useState(current?.note ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineInfo | null>(null);
  const [conns, setConns] = useState<Connections | null>(null);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [cards, setCards] = useState<Partial<Record<PlatformId, CardState>>>({});
  const [added, setAdded] = useState<Record<string, string>>({});
  const [adding, setAdding] = useState<PlatformId | null>(null);
  const [kitDraft, setKitDraft] = useState<PublishKit | null>(publishKit);
  const [kitDirty, setKitDirty] = useState(false);
  const [showKit, setShowKit] = useState(false);

  useEffect(() => {
    api.connections().then(setConns).catch(() => undefined);
    api.assets(episodeId).then(setAssets).catch(() => setAssets([]));
  }, [episodeId, schedule.length]);

  useEffect(() => {
    setKitDraft(publishKit);
    setKitDirty(false);
  }, [publishKit]);

  // A regenerated kit replaces the card text; edits made before that are dropped on purpose.
  const kitStamp = publishKit?.generatedAt ?? "";
  useEffect(() => {
    setCards({});
    setAdded({});
  }, [kitStamp]);

  // Card defaults: kit text, first matching asset, staggered slot, best available via.
  useEffect(() => {
    if (!conns) return;
    setCards((prev) => {
      const next = {...prev};
      for (const c of CARDS) {
        const k = kitFor(publishKit, c.platform);
        const vias = viaOptions(c.platform, conns);
        const via = (vias.find((v) => v.enabled)?.value ?? "manual") as Via;
        const fresh: CardState = {
          asset: pickAsset(assets, conns.platforms[c.platform].aspect),
          title: k.titles[0] ?? "",
          description: k.text,
          hashtags: k.hashtags.join(" "),
          when: toLocalInput(conns.defaults[c.platform] ?? ""),
          via,
          publicUrl: "",
          titleIdx: 0,
        };
        const old = prev[c.platform];
        // Keep what Hippolyte typed on this kit; only the asset list and via availability refresh underneath.
        next[c.platform] = old ? {...fresh, ...old, asset: old.asset || fresh.asset, via: vias.some((v) => v.value === old.via && v.enabled) ? old.via : via} : fresh;
      }
      return next;
    });
  }, [conns, assets, publishKit]);

  const generate = async () => {
    setError(null);
    try {
      onJobStarted(await api.publishKit(episodeId));
    } catch (e) {
      setError(String((e as Error).message ?? e));
    }
  };

  const saveKit = async () => {
    if (!kitDraft) return;
    setBusy(true);
    setError(null);
    try {
      await api.savePublishKit(episodeId, kitDraft);
      setKitDirty(false);
      onReload();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
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

  const update = (p: PlatformId, patch: Partial<CardState>) => setCards((c) => ({...c, [p]: {...(c[p] as CardState), ...patch}}));

  const add = async (p: PlatformId, draft = false) => {
    const c = cards[p];
    if (!c) return;
    setAdding(p);
    setError(null);
    try {
      const e = await api.addSchedule({
        episodeId,
        platform: p,
        via: c.via,
        asset: c.asset,
        title: c.title,
        description: c.description,
        hashtags: splitTags(c.hashtags),
        tags: p === "youtube" || p === "shorts" ? (publishKit?.youtube.tags ?? []) : [],
        publicUrl: c.publicUrl,
        scheduledAt: fromLocalInput(c.when),
        status: draft ? "draft" : "scheduled",
      });
      setAdded((a) => ({...a, [p]: `${e.status === "needs_url" ? "Added, but it needs a public URL" : e.status === "scheduled" && e.via === "blotato" ? "Sent to Blotato" : draft ? "Saved as draft" : "Added to the schedule"} (${new Date(e.scheduledAt).toLocaleString()}).`}));
      onReload();
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setAdding(null);
    }
  };

  return (
    <div>
      <div className="card">
        <div style={{display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: "wrap"}}>
          <div>
            <h3>Publishing kit</h3>
            <div className="small muted">
              Titles, YouTube description with chapters, tags, Shorts, Instagram, Facebook, TikTok and LinkedIn text, thumbnail text and a hashtag bank, written by the text engine from the script and build.json timestamps into episodes/{episodeId}/publish.json (and publish.md). Limits are enforced in code; every field below is editable before scheduling.
              {status.cost?.publish_usd ? ` Spent so far: $${status.cost.publish_usd.toFixed(2)}.` : ""}
              {publishKit?.generatedAt ? ` Last generated ${new Date(publishKit.generatedAt).toLocaleString()} with ${publishKit.engine ?? "?"} ${publishKit.model ?? ""}.` : status.engine ? ` Engine: ${engineLabel(status.engine)}.` : ""}
            </div>
          </div>
          <div style={{display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 8}}>
            <button className="accent" disabled={running || !hasBuild || (engine ? !engine.ready : false)} onClick={generate} title={hasBuild ? (engine ? `Runs the ${engine.engine === "ollama" ? `local model ${engine.ollamaModel}` : "Claude CLI"}` : "Runs the text engine") : "Build voice first: the kit needs scene timestamps"}>
              {publishKit ? "Regenerate kit" : "Generate kit"}
              {engine ? (engine.engine === "ollama" ? " · $0" : " · metered") : ""}
            </button>
            <EngineLine compact onChange={setEngine} />
          </div>
        </div>
        {!hasBuild && <div className="notice warn">Build voice first (Build & render → Produce preview): the kit takes chapter timestamps from build.json.</div>}
        {running && <div className="notice small">A job is running for this episode; the kit appears here when it finishes.</div>}
        {error && <div className="notice bad">{error}</div>}
        {kitDraft && (
          <div style={{marginTop: 10}}>
            <div className="grid-2">
              <label className="field">
                <span>Thumbnail text (≤ 4 words)</span>
                <input
                  value={kitDraft.thumbnailText}
                  onChange={(e) => {
                    setKitDraft({...kitDraft, thumbnailText: e.target.value});
                    setKitDirty(true);
                  }}
                />
              </label>
              <label className="field">
                <span>Hashtag bank ({kitDraft.hashtagBank.length})</span>
                <input
                  value={kitDraft.hashtagBank.join(" ")}
                  onChange={(e) => {
                    setKitDraft({...kitDraft, hashtagBank: splitTags(e.target.value)});
                    setKitDirty(true);
                  }}
                />
              </label>
            </div>
            <div className="btn-row">
              {kitDirty && (
                <button className="primary sm" disabled={busy} onClick={saveKit}>
                  Save kit edits
                </button>
              )}
              <button className="ghost sm" onClick={() => setShowKit((v) => !v)}>
                {showKit ? "Hide publish.md" : "Show publish.md"}
              </button>
              {publishKit?.chapters?.length ? <span className="small muted">{publishKit.chapters.length} chapters · disclosure: {publishKit.disclosure}</span> : null}
            </div>
          </div>
        )}
      </div>

      {showKit && publishMd ? <Doc name="publish.md" content={publishMd} open /> : null}

      {!publishKit && !running && <div className="notice">No kit yet. Generate it, or fill the cards by hand: they still work without a kit.</div>}

      <div className="pcards">
        {CARDS.map((c) => {
          const s = cards[c.platform];
          const def = conns?.platforms[c.platform];
          if (!s || !def) return null;
          const k = kitFor(publishKit, c.platform);
          const tagList = splitTags(s.hashtags);
          const caption = `${s.description.trim()}${tagList.length ? `\n\n${tagList.join(" ")}` : ""}`;
          const vias = viaOptions(c.platform, conns);
          const matching = assets.filter((a) => !def.aspect || a.aspect === def.aspect);
          const others = assets.filter((a) => def.aspect && a.aspect !== def.aspect);
          const titleOver = def.titleMax ? s.title.length > def.titleMax : false;
          const textOver = caption.length > def.textMax;
          const existing = schedule.filter((e) => e.platform === c.platform);
          return (
            <div key={c.platform} className="card tight pcard">
              <div className="conn-head">
                <div style={{display: "flex", alignItems: "center", gap: 8}}>
                  <PlatformBadge platform={c.platform} />
                  <h3 style={{margin: 0}}>{def.label}</h3>
                </div>
                {existing.length ? <span className="chip other">{existing.length} scheduled</span> : null}
              </div>
              <div className="small muted" style={{marginBottom: 8}}>
                {c.note}
              </div>
              <label className="field">
                <span>Asset {def.aspect ? `(${def.aspect})` : ""}</span>
                <select value={s.asset} onChange={(e) => update(c.platform, {asset: e.target.value})}>
                  {assets.length === 0 && <option value="">No MP4 in out/{episodeId}/ yet</option>}
                  {matching.map((a) => (
                    <option key={a.asset} value={a.asset}>
                      {a.name} · {a.width && a.height ? `${a.width}x${a.height}` : a.aspect ?? "?"}
                      {a.preview ? " · preview" : ""}
                    </option>
                  ))}
                  {others.length > 0 && (
                    <optgroup label="Other orientation">
                      {others.map((a) => (
                        <option key={a.asset} value={a.asset}>
                          {a.name} · {a.width && a.height ? `${a.width}x${a.height}` : a.aspect ?? "?"}
                          {a.preview ? " · preview" : ""}
                        </option>
                      ))}
                    </optgroup>
                  )}
                </select>
              </label>
              {def.titleMax > 0 && (
                <label className="field">
                  <span>
                    Title{" "}
                    <em className={`counter ${titleOver ? "over" : c.titleRec && s.title.length > c.titleRec ? "warn" : ""}`}>
                      {s.title.length} / {c.titleRec ?? def.titleMax}
                      {c.titleRec && c.titleRec !== def.titleMax ? ` (max ${def.titleMax})` : ""}
                    </em>
                  </span>
                  {k.titles.length > 1 && (
                    <div className="chips" style={{marginBottom: 6}}>
                      {k.titles.map((t, i) => (
                        <button key={i} type="button" className={`sm ${s.titleIdx === i && s.title === t ? "primary" : ""}`} onClick={() => update(c.platform, {title: t, titleIdx: i})} title={t}>
                          Option {i + 1}
                        </button>
                      ))}
                    </div>
                  )}
                  <input value={s.title} onChange={(e) => update(c.platform, {title: e.target.value})} />
                </label>
              )}
              <label className="field">
                <span>
                  {c.platform === "youtube" ? "Description" : c.platform === "linkedin" ? "Post" : "Caption"}{" "}
                  <em className={`counter ${textOver ? "over" : c.textRec && caption.length > c.textRec ? "warn" : ""}`}>
                    {caption.length} / {c.textRec ?? def.textMax}
                    {c.textRec && c.textRec !== def.textMax ? ` (max ${def.textMax})` : ""} with hashtags
                  </em>
                </span>
                <textarea value={s.description} rows={c.platform === "youtube" || c.platform === "instagram" || c.platform === "linkedin" ? 8 : 4} onChange={(e) => update(c.platform, {description: e.target.value})} />
              </label>
              {c.tagsRec > 0 && (
                <label className="field">
                  <span>
                    Hashtags <em className={`counter ${tagList.length > c.tagsRec ? "warn" : ""}`}>{tagList.length} / {c.tagsRec}</em>
                  </span>
                  <input value={s.hashtags} onChange={(e) => update(c.platform, {hashtags: e.target.value})} placeholder={(conns?.fixedTags ?? []).join(" ")} />
                </label>
              )}
              <div className="grid-2">
                <label className="field">
                  <span>When (local)</span>
                  <input type="datetime-local" value={s.when} onChange={(e) => update(c.platform, {when: e.target.value})} />
                </label>
                <label className="field">
                  <span>Via</span>
                  <select value={s.via} onChange={(e) => update(c.platform, {via: e.target.value as Via})}>
                    {vias.map((o) => (
                      <option key={o.value} value={o.value} disabled={!o.enabled} title={o.hint}>
                        {o.label}
                        {o.enabled ? "" : " (not connected)"}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
              {s.via === "blotato" && (
                <label className="field">
                  <span>Public video URL {conns?.mediaHost.baseUrl ? "(blank = use the media host)" : "(required: Blotato fetches the file from here)"}</span>
                  <input value={s.publicUrl} onChange={(e) => update(c.platform, {publicUrl: e.target.value})} placeholder="https://…/video.mp4" />
                </label>
              )}
              <div className="small muted" style={{marginBottom: 8}}>
                {vias.find((v) => v.value === s.via)?.hint}
              </div>
              <div className="btn-row">
                <button className="accent sm" disabled={adding === c.platform || !s.asset || !s.when || titleOver || textOver} onClick={() => add(c.platform)} title={s.via === "blotato" ? "Sends to Blotato right away for the chosen time" : "Adds the entry; the scheduler uploads it at the slot (or it becomes due for manual)"}>
                  {adding === c.platform ? "Adding…" : "Add to schedule"}
                </button>
                <button className="sm ghost" disabled={adding === c.platform || !s.asset || !s.when} onClick={() => add(c.platform, true)} title="Saved on the calendar as a draft; never published until you edit it out of draft">
                  Save as draft
                </button>
                {added[c.platform] && <span className="small" style={{color: "#065f56"}}>{added[c.platform]}</span>}
              </div>
            </div>
          );
        })}
      </div>

      <div className="card">
        <div className="conn-head">
          <h3>Scheduled for this episode</h3>
          <Link to="/publishing" className="small">
            Open the calendar
          </Link>
        </div>
        <ScheduleList entries={schedule} conns={conns} onChanged={onReload} compact showPublished />
      </div>

      <div className="card">
        <h3>Publishing decision (record)</h3>
        <div className="small muted" style={{marginBottom: 10}}>
          The team never posts. Adding an entry above is your authorization for that post. This panel keeps the gate 6 record in status.json under "publication"; any plan other than Hold marks gate 6 as approved with the note "authorized by Hippolyte via Studio".
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
      <div className="small muted" style={{marginTop: 8}}>
        Platform labels: {CARDS.map((c) => platformLabel(c.platform, conns)).join(" · ")}.
      </div>
    </div>
  );
};
