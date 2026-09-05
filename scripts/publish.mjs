// Publishing for the Studio: platform connections (YouTube direct, Facebook Page direct, Blotato for Instagram/TikTok),
// the per-platform publishing kit, the schedule and the scheduler loop. Used by scripts/api.mjs.
// Files: studio/connections.json (secrets, gitignored), studio/schedule.json, studio/publish-log.jsonl.
// Nothing is ever posted unless an entry exists in schedule.json, which only Hippolyte creates from the Studio.
import {spawnSync} from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {CHARACTERS, EPISODES, PUBLIC, ROOT, readJson, writeJson} from "./lib.mjs";

const STUDIO = path.join(ROOT, "studio");
export const CONNECTIONS_PATH = path.join(STUDIO, "connections.json");
export const SCHEDULE_PATH = path.join(STUDIO, "schedule.json");
export const LOG_PATH = path.join(STUDIO, "publish-log.jsonl");
const OUT = path.join(ROOT, "out");

const GRAPH = "https://graph.facebook.com/v21.0";
const GRAPH_VIDEO = "https://graph-video.facebook.com/v21.0";
const BLOTATO = "https://backend.blotato.com/v2";
const GOOGLE_AUTH = "https://accounts.google.com/o/oauth2/v2/auth";
const GOOGLE_TOKEN = "https://oauth2.googleapis.com/token";
const YT_SCOPES = ["https://www.googleapis.com/auth/youtube.upload", "https://www.googleapis.com/auth/youtube.readonly"];

// ---------- platforms ----------
// direct: which connection posts natively; blotato: the Blotato targetType; aspect: the asset orientation the card lists first.
export const PLATFORMS = {
  youtube: {label: "YouTube", aspect: "16:9", direct: "youtube", blotato: "youtube", titleMax: 100, textMax: 5000},
  shorts: {label: "YouTube Shorts", aspect: "9:16", direct: "youtube", blotato: "youtube", titleMax: 100, textMax: 5000},
  instagram: {label: "Instagram Reel", aspect: "9:16", direct: null, blotato: "instagram", titleMax: 0, textMax: 2200},
  facebook: {label: "Facebook Page video", aspect: "16:9", direct: "facebook", blotato: "facebook", titleMax: 255, textMax: 63206},
  facebook_reel: {label: "Facebook Reel (beta)", aspect: "9:16", direct: "facebook", blotato: "facebook", titleMax: 0, textMax: 63206},
  tiktok: {label: "TikTok", aspect: "9:16", direct: null, blotato: "tiktok", titleMax: 90, textMax: 2200},
  linkedin: {label: "LinkedIn", aspect: "16:9", direct: null, blotato: "linkedin", titleMax: 0, textMax: 3000},
  manual: {label: "Manual (any platform)", aspect: null, direct: null, blotato: null, titleMax: 100, textMax: 5000},
};
export const PLATFORM_IDS = Object.keys(PLATFORMS);
export const VIAS = ["direct", "blotato", "manual"];
export const STATUSES = ["draft", "scheduled", "uploading", "published", "failed", "needs_url", "due"];
export const FIXED_TAGS = ["#AIWithHippolyte", "#AfricaAIMoment"];
// Direct uploads start this long before the slot: YouTube takes publishAt; Facebook needs scheduled_publish_time ≥ 10 min ahead.
const LEAD_MS = {youtube: 10 * 60000, facebook: 20 * 60000};
const FB_MIN_AHEAD_MS = 10 * 60000 + 30000;

// ---------- small helpers ----------
const exists = (p) => fs.existsSync(p);
const safeJson = (p, fallback) => {
  try {
    return readJson(p);
  } catch {
    return fallback;
  }
};
const pad = (n) => String(Math.abs(Math.trunc(n))).padStart(2, "0");
// ISO with the machine's local offset (America/Toronto on Hippolyte's Mac), so schedule.json reads as local time.
export const localIso = (d) => {
  const off = -d.getTimezoneOffset();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}${off >= 0 ? "+" : "-"}${pad(off / 60)}:${pad(off % 60)}`;
};
const mmss = (ms) => `${Math.floor(ms / 60000)}:${String(Math.floor((ms % 60000) / 1000)).padStart(2, "0")}`;
const isEpisodeId = (id) => /^ep\d{3,}$/.test(String(id));
const episodeTitle = (id) => {
  const ep = safeJson(path.join(EPISODES, id, "episode.json"), {});
  const st = safeJson(path.join(EPISODES, id, "status.json"), {});
  return ep.title ?? st.title ?? id;
};

export const appendLog = (entry) => {
  fs.mkdirSync(STUDIO, {recursive: true});
  fs.appendFileSync(LOG_PATH, `${JSON.stringify({at: new Date().toISOString(), ...entry})}\n`);
};

const fetchJson = async (url, init = {}) => {
  const r = await fetch(url, init);
  const text = await r.text();
  let body = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = {raw: text.slice(0, 500)};
  }
  return {ok: r.ok, status: r.status, headers: r.headers, body};
};
const errText = (b, status) => b?.error?.message ?? b?.error_description ?? (typeof b?.error === "string" ? b.error : null) ?? b?.message ?? b?.raw ?? `HTTP ${status}`;

// ---------- connections ----------
export const readConnections = () => (exists(CONNECTIONS_PATH) ? safeJson(CONNECTIONS_PATH, {}) : {});
export const writeConnections = (c) => writeJson(CONNECTIONS_PATH, c);
const patchConnection = (platform, patch) => {
  const c = readConnections();
  c[platform] = {...(c[platform] ?? {}), ...patch};
  writeConnections(c);
  return c[platform];
};

export const redirectUri = (port) => `http://localhost:${port}/api/connections/youtube/callback`;

// What the front end sees: secrets replaced by booleans, plus a status per card.
export const publicConnections = (port) => {
  const c = readConnections();
  const yt = c.youtube ?? {};
  const fb = c.facebook ?? {};
  const bl = c.blotato ?? {};
  const status = (ok, configured, error) => (error ? "error" : ok ? "connected" : configured ? "needs auth" : "not configured");
  return {
    youtube: {
      status: status(Boolean(yt.refreshToken), Boolean(yt.clientId), yt.error),
      clientId: yt.clientId ?? "",
      hasSecret: Boolean(yt.clientSecret),
      channelTitle: yt.channelTitle ?? "",
      channelId: yt.channelId ?? "",
      connectedAt: yt.connectedAt ?? null,
      testedAt: yt.testedAt ?? null,
      error: yt.error ?? null,
      redirectUri: redirectUri(port),
    },
    facebook: {
      status: fb.error ? "error" : fb.pageId && fb.pageToken ? "connected" : "not configured",
      pageId: fb.pageId ?? "",
      hasToken: Boolean(fb.pageToken),
      pageName: fb.pageName ?? "",
      testedAt: fb.testedAt ?? null,
      error: fb.error ?? null,
    },
    blotato: {
      status: bl.error ? "error" : bl.apiKey ? "connected" : "not configured",
      hasKey: Boolean(bl.apiKey),
      accounts: bl.accounts ?? [],
      testedAt: bl.testedAt ?? null,
      error: bl.error ?? null,
    },
    mediaHost: {baseUrl: c.mediaHost?.baseUrl ?? "", uploadCommand: c.mediaHost?.uploadCommand ?? ""},
  };
};

// PUT /api/connections: only the fields present are changed; "" clears a field. Secrets are never echoed back.
export const applyConnectionsPatch = (b = {}) => {
  const c = readConnections();
  const setStr = (obj, key, v) => {
    if (v === undefined) return;
    const s = String(v).trim();
    if (s) obj[key] = s;
    else delete obj[key];
  };
  if (b.youtube) {
    c.youtube ??= {};
    const before = c.youtube.clientId;
    setStr(c.youtube, "clientId", b.youtube.clientId);
    setStr(c.youtube, "clientSecret", b.youtube.clientSecret);
    // A new client id invalidates the stored tokens.
    if (b.youtube.clientId !== undefined && c.youtube.clientId !== before) for (const k of ["refreshToken", "accessToken", "expiresAt", "channelTitle", "channelId", "connectedAt"]) delete c.youtube[k];
    if (b.youtube.disconnect) for (const k of ["refreshToken", "accessToken", "expiresAt", "channelTitle", "channelId", "connectedAt"]) delete c.youtube[k];
    delete c.youtube.error;
  }
  if (b.facebook) {
    c.facebook ??= {};
    setStr(c.facebook, "pageId", b.facebook.pageId);
    setStr(c.facebook, "pageToken", b.facebook.pageToken);
    delete c.facebook.error;
    if (b.facebook.pageId !== undefined || b.facebook.pageToken !== undefined) delete c.facebook.pageName;
  }
  if (b.blotato) {
    c.blotato ??= {};
    setStr(c.blotato, "apiKey", b.blotato.apiKey);
    delete c.blotato.error;
    if (b.blotato.apiKey !== undefined) delete c.blotato.accounts;
  }
  if (b.mediaHost) {
    c.mediaHost ??= {};
    setStr(c.mediaHost, "baseUrl", b.mediaHost.baseUrl);
    setStr(c.mediaHost, "uploadCommand", b.mediaHost.uploadCommand);
  }
  writeConnections(c);
  return c;
};

// ---------- YouTube (Google OAuth 2, installed app; plain fetch) ----------
export const youtubeAuthUrl = (port) => {
  const c = readConnections().youtube ?? {};
  if (!c.clientId) throw new Error("Paste the Google OAuth client id first (Google Cloud → APIs & Services → Credentials, Desktop app).");
  const state = crypto.randomBytes(8).toString("hex");
  patchConnection("youtube", {oauthState: state});
  const q = new URLSearchParams({client_id: c.clientId, redirect_uri: redirectUri(port), response_type: "code", scope: YT_SCOPES.join(" "), access_type: "offline", prompt: "consent", include_granted_scopes: "true", state});
  return `${GOOGLE_AUTH}?${q}`;
};

const googleToken = async (params) => {
  const r = await fetchJson(GOOGLE_TOKEN, {method: "POST", headers: {"Content-Type": "application/x-www-form-urlencoded"}, body: new URLSearchParams(params)});
  if (!r.ok) throw new Error(`Google token error: ${errText(r.body, r.status)}`);
  return r.body;
};

// Returns a valid access token, refreshing it when it expires within a minute.
const youtubeAccessToken = async () => {
  const c = readConnections().youtube ?? {};
  if (!c.clientId || !c.clientSecret) throw new Error("YouTube: client id and secret are not configured.");
  if (!c.refreshToken) throw new Error("YouTube: not connected. Click Connect to run the Google consent screen.");
  if (c.accessToken && c.expiresAt && Date.parse(c.expiresAt) - Date.now() > 60000) return c.accessToken;
  const t = await googleToken({client_id: c.clientId, client_secret: c.clientSecret, refresh_token: c.refreshToken, grant_type: "refresh_token"});
  patchConnection("youtube", {accessToken: t.access_token, expiresAt: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString()});
  return t.access_token;
};

const youtubeChannel = async (token) => {
  const r = await fetchJson("https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true", {headers: {Authorization: `Bearer ${token}`}});
  if (!r.ok) throw new Error(`YouTube channels.list: ${errText(r.body, r.status)}`);
  const ch = r.body?.items?.[0];
  return {channelId: ch?.id ?? "", channelTitle: ch?.snippet?.title ?? ""};
};

export const youtubeCallback = async ({code, state, port}) => {
  const c = readConnections().youtube ?? {};
  if (!code) throw new Error("Google did not return a code.");
  if (c.oauthState && state && state !== c.oauthState) throw new Error("OAuth state mismatch. Start again from the Studio.");
  const t = await googleToken({code, client_id: c.clientId, client_secret: c.clientSecret, redirect_uri: redirectUri(port), grant_type: "authorization_code"});
  if (!t.refresh_token) throw new Error("Google returned no refresh token. Remove the app's access at myaccount.google.com/permissions and connect again.");
  const patch = {refreshToken: t.refresh_token, accessToken: t.access_token, expiresAt: new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString(), connectedAt: new Date().toISOString(), oauthState: undefined};
  try {
    Object.assign(patch, await youtubeChannel(t.access_token));
  } catch (e) {
    patch.error = String(e.message ?? e);
  }
  patchConnection("youtube", patch);
  appendLog({action: "connect", platform: "youtube", detail: patch.channelTitle || "connected"});
  return patch;
};

export const youtubeTest = async () => {
  try {
    const token = await youtubeAccessToken();
    const ch = await youtubeChannel(token);
    patchConnection("youtube", {...ch, testedAt: new Date().toISOString(), error: undefined});
    return {ok: true, ...ch};
  } catch (e) {
    patchConnection("youtube", {error: String(e.message ?? e)});
    throw e;
  }
};

// Resumable upload. publishAt (Date | null): private + publishAt when in the future, public otherwise.
const youtubeUpload = async ({file, title, description, tags, publishAt, shorts}) => {
  const token = await youtubeAccessToken();
  const buf = fs.readFileSync(file);
  const scheduled = publishAt && publishAt.getTime() - Date.now() > 60000;
  const meta = {
    snippet: {title: String(title).slice(0, 100), description: String(description).slice(0, 5000), tags: (tags ?? []).slice(0, 30), categoryId: "27"},
    status: {privacyStatus: scheduled ? "private" : "public", selfDeclaredMadeForKids: false, ...(scheduled ? {publishAt: publishAt.toISOString()} : {})},
  };
  const start = await fetch("https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status", {
    method: "POST",
    headers: {Authorization: `Bearer ${token}`, "Content-Type": "application/json; charset=UTF-8", "X-Upload-Content-Type": "video/mp4", "X-Upload-Content-Length": String(buf.length)},
    body: JSON.stringify(meta),
  });
  if (!start.ok) throw new Error(`YouTube upload start: ${errText(await start.json().catch(() => ({})), start.status)}`);
  const location = start.headers.get("location");
  if (!location) throw new Error("YouTube did not return an upload session URL.");
  const up = await fetchJson(location, {method: "PUT", headers: {Authorization: `Bearer ${token}`, "Content-Type": "video/mp4", "Content-Length": String(buf.length)}, body: buf});
  if (!up.ok) throw new Error(`YouTube upload: ${errText(up.body, up.status)}`);
  const id = up.body?.id;
  if (!id) throw new Error("YouTube returned no video id.");
  return {remoteId: id, remoteUrl: shorts ? `https://www.youtube.com/shorts/${id}` : `https://youtu.be/${id}`, scheduledNatively: Boolean(scheduled)};
};

// ---------- Facebook Page (Graph API, page access token) ----------
const facebookConn = () => {
  const c = readConnections().facebook ?? {};
  if (!c.pageId || !c.pageToken) throw new Error("Facebook: page id and page access token are not configured.");
  return c;
};

export const facebookTest = async () => {
  try {
    const c = facebookConn();
    const r = await fetchJson(`${GRAPH}/${encodeURIComponent(c.pageId)}?fields=id,name&access_token=${encodeURIComponent(c.pageToken)}`);
    if (!r.ok) throw new Error(`Facebook: ${errText(r.body, r.status)}`);
    const out = {pageName: r.body.name ?? "", testedAt: new Date().toISOString(), error: undefined};
    patchConnection("facebook", out);
    return {ok: true, pageId: r.body.id, pageName: r.body.name};
  } catch (e) {
    patchConnection("facebook", {error: String(e.message ?? e)});
    throw e;
  }
};

const facebookVideo = async ({file, title, description, publishAt}) => {
  const c = facebookConn();
  const buf = fs.readFileSync(file);
  const fd = new FormData();
  fd.append("source", new Blob([buf], {type: "video/mp4"}), path.basename(file));
  fd.append("description", description);
  if (title) fd.append("title", String(title).slice(0, 255));
  fd.append("access_token", c.pageToken);
  const scheduled = publishAt && publishAt.getTime() - Date.now() > FB_MIN_AHEAD_MS;
  if (scheduled) {
    fd.append("published", "false");
    fd.append("scheduled_publish_time", String(Math.floor(publishAt.getTime() / 1000)));
  }
  const r = await fetchJson(`${GRAPH_VIDEO}/${encodeURIComponent(c.pageId)}/videos`, {method: "POST", body: fd});
  if (!r.ok) throw new Error(`Facebook video: ${errText(r.body, r.status)}`);
  const id = r.body?.id;
  if (!id) throw new Error("Facebook returned no video id.");
  return {remoteId: id, remoteUrl: `https://www.facebook.com/${c.pageId}/videos/${id}`, scheduledNatively: Boolean(scheduled)};
};

// Reels (beta): start → upload the binary to the returned URL → finish with PUBLISHED or SCHEDULED.
const facebookReel = async ({file, description, publishAt}) => {
  const c = facebookConn();
  const buf = fs.readFileSync(file);
  const base = `${GRAPH}/${encodeURIComponent(c.pageId)}/video_reels`;
  const start = await fetchJson(base, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify({upload_phase: "start", access_token: c.pageToken})});
  if (!start.ok) throw new Error(`Facebook reel start: ${errText(start.body, start.status)}`);
  const {video_id: videoId, upload_url: uploadUrl} = start.body ?? {};
  if (!videoId || !uploadUrl) throw new Error("Facebook reel start returned no upload URL.");
  const up = await fetchJson(uploadUrl, {method: "POST", headers: {Authorization: `OAuth ${c.pageToken}`, offset: "0", file_size: String(buf.length), "Content-Type": "application/octet-stream"}, body: buf});
  if (!up.ok || up.body?.success === false) throw new Error(`Facebook reel upload: ${errText(up.body, up.status)}`);
  const scheduled = publishAt && publishAt.getTime() - Date.now() > FB_MIN_AHEAD_MS;
  const finishBody = {upload_phase: "finish", video_id: videoId, access_token: c.pageToken, description, video_state: scheduled ? "SCHEDULED" : "PUBLISHED", ...(scheduled ? {scheduled_publish_time: Math.floor(publishAt.getTime() / 1000)} : {})};
  const fin = await fetchJson(base, {method: "POST", headers: {"Content-Type": "application/json"}, body: JSON.stringify(finishBody)});
  if (!fin.ok || fin.body?.success === false) throw new Error(`Facebook reel finish: ${errText(fin.body, fin.status)}`);
  return {remoteId: videoId, remoteUrl: `https://www.facebook.com/reel/${videoId}`, scheduledNatively: Boolean(scheduled)};
};

// ---------- Blotato (Instagram, TikTok, and any other account connected there) ----------
const blotatoKey = () => {
  const k = readConnections().blotato?.apiKey;
  if (!k) throw new Error("Blotato: no API key configured (Blotato → Settings → API).");
  return k;
};
const blotatoFetch = (p, init = {}) => fetchJson(`${BLOTATO}${p}`, {...init, headers: {"blotato-api-key": blotatoKey(), "Content-Type": "application/json", ...(init.headers ?? {})}});

export const blotatoTest = async () => {
  try {
    const r = await blotatoFetch("/users/me/accounts");
    if (!r.ok) throw new Error(`Blotato: ${errText(r.body, r.status)}`);
    const items = Array.isArray(r.body?.items) ? r.body.items : Array.isArray(r.body) ? r.body : [];
    const accounts = [];
    for (const a of items) {
      const acc = {id: String(a.id), platform: String(a.platform ?? "").toLowerCase(), username: a.username ?? "", fullname: a.fullname ?? a.name ?? ""};
      if (acc.platform === "facebook") {
        const s = await blotatoFetch(`/users/me/accounts/${encodeURIComponent(acc.id)}/subaccounts`);
        acc.pages = s.ok ? (s.body?.items ?? []).map((p) => ({id: String(p.id), name: p.name ?? ""})) : [];
      }
      accounts.push(acc);
    }
    patchConnection("blotato", {accounts, testedAt: new Date().toISOString(), error: undefined});
    return {ok: true, accounts};
  } catch (e) {
    patchConnection("blotato", {error: String(e.message ?? e)});
    throw e;
  }
};

const blotatoAccountFor = (platform) => {
  const target = PLATFORMS[platform]?.blotato;
  const acc = (readConnections().blotato?.accounts ?? []).find((a) => a.platform === target);
  if (!acc) throw new Error(`Blotato: no ${target ?? platform} account connected. Click Test on the Blotato card after connecting the account at my.blotato.com.`);
  return acc;
};

const blotatoTarget = (platform, entry, acc) => {
  const t = PLATFORMS[platform].blotato;
  switch (t) {
    case "instagram":
      return {targetType: "instagram", mediaType: "reel"};
    case "tiktok":
      return {targetType: "tiktok", privacyLevel: "PUBLIC_TO_EVERYONE", disabledComments: false, disabledDuet: false, disabledStitch: false, isBrandedContent: false, isYourBrand: false, isAiGenerated: true, ...(entry.title ? {title: String(entry.title).slice(0, 90)} : {})};
    case "facebook": {
      const pageId = readConnections().facebook?.pageId || acc.pages?.[0]?.id;
      if (!pageId) throw new Error("Blotato: the Facebook account has no page id (set the page id on the Facebook card or reconnect the page in Blotato).");
      return {targetType: "facebook", pageId: String(pageId), ...(platform === "facebook_reel" ? {mediaType: "reel"} : {})};
    }
    case "youtube":
      return {targetType: "youtube", title: String(entry.title || episodeTitle(entry.episodeId)).slice(0, 100).replace(/[<>]/g, ""), privacyStatus: "public", shouldNotifySubscribers: true, isMadeForKids: false, containsSyntheticMedia: true};
    default:
      return {targetType: t};
  }
};

const blotatoPost = async ({entry, text, mediaUrl, scheduledTime}) => {
  const acc = blotatoAccountFor(entry.platform);
  const m = await blotatoFetch("/media", {method: "POST", body: JSON.stringify({url: mediaUrl})});
  if (!m.ok) throw new Error(`Blotato media: ${errText(m.body, m.status)}`);
  const hosted = m.body?.url ?? mediaUrl;
  const target = blotatoTarget(entry.platform, entry, acc);
  const body = {post: {accountId: acc.id, content: {text, mediaUrls: [hosted], platform: target.targetType}, target}, ...(scheduledTime ? {scheduledTime: scheduledTime.toISOString()} : {})};
  const r = await blotatoFetch("/posts", {method: "POST", body: JSON.stringify(body)});
  if (!r.ok) throw new Error(`Blotato post: ${errText(r.body, r.status)}`);
  const id = r.body?.postSubmissionId ?? r.body?.id ?? "";
  return {remoteId: String(id), remoteUrl: "https://my.blotato.com/scheduler", account: acc.username || acc.fullname || acc.id};
};

// ---------- assets ----------
const probeCache = new Map();
const ffprobeDims = (file) => {
  const r = spawnSync("ffprobe", ["-v", "error", "-select_streams", "v:0", "-show_entries", "stream=width,height:format=duration", "-of", "json", file], {encoding: "utf8"});
  if (r.error || r.status !== 0) return null;
  try {
    const j = JSON.parse(r.stdout);
    const s = j.streams?.[0] ?? {};
    return {width: s.width ?? null, height: s.height ?? null, durationMs: j.format?.duration ? Math.round(Number(j.format.duration) * 1000) : null};
  } catch {
    return null;
  }
};
const aspectOf = (w, h, name) => {
  if (w && h) return w > h ? "16:9" : w < h ? "9:16" : "1:1";
  return /9x16/.test(name) ? "9:16" : /16x9/.test(name) ? "16:9" : null;
};
// MP4s under out/<id>/ with real dimensions (ffprobe, cached by mtime) or the ratio implied by the file name.
export const listAssets = (id) => {
  const dir = path.join(OUT, id);
  if (!exists(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mp4"))
    .sort()
    .map((name) => {
      const file = path.join(dir, name);
      const st = fs.statSync(file);
      const key = `${file}:${st.mtimeMs}`;
      if (!probeCache.has(key)) probeCache.set(key, ffprobeDims(file));
      const d = probeCache.get(key) ?? {};
      return {name, asset: `${id}/${name}`, url: `/out/${id}/${name}`, size: st.size, mtime: st.mtime.toISOString(), preview: /-preview\.mp4$/.test(name), width: d.width ?? null, height: d.height ?? null, durationMs: d.durationMs ?? null, aspect: aspectOf(d.width, d.height, name)};
    });
};
const assetFile = (asset) => {
  const rel = String(asset ?? "").replace(/^\/?out\//, "");
  const file = path.resolve(OUT, rel);
  if (!file.startsWith(OUT + path.sep) || !file.endsWith(".mp4")) throw new Error("asset must be an MP4 under out/");
  if (!exists(file)) throw new Error(`asset not found: out/${rel}`);
  return {file, rel};
};

// Media host: an upload command template ({file}, {name}, {episode}) plus the public base URL the file will have afterwards.
const hostMedia = (entry) => {
  const mh = readConnections().mediaHost ?? {};
  if (!mh.baseUrl || !mh.uploadCommand) return null;
  const {file, rel} = assetFile(entry.asset);
  const name = path.basename(file);
  const cmd = mh.uploadCommand.replaceAll("{file}", JSON.stringify(file)).replaceAll("{name}", name).replaceAll("{episode}", entry.episodeId);
  const r = spawnSync("/bin/sh", ["-c", cmd], {cwd: ROOT, encoding: "utf8", timeout: 10 * 60000});
  if (r.error || r.status !== 0) throw new Error(`upload command failed (${r.error?.message ?? `exit ${r.status}`}): ${(r.stderr || r.stdout || "").trim().slice(0, 300)}`);
  appendLog({action: "host-media", entryId: entry.id, episodeId: entry.episodeId, detail: `${rel} → ${mh.baseUrl}`});
  return `${mh.baseUrl.replace(/\/+$/, "")}/${encodeURIComponent(name)}`;
};

// ---------- schedule ----------
export const readSchedule = () => {
  const s = exists(SCHEDULE_PATH) ? safeJson(SCHEDULE_PATH, []) : [];
  return Array.isArray(s) ? s : Array.isArray(s.entries) ? s.entries : [];
};
export const writeSchedule = (entries) => writeJson(SCHEDULE_PATH, entries);
const saveEntry = (entry) => {
  const all = readSchedule();
  const i = all.findIndex((e) => e.id === entry.id);
  entry.updatedAt = new Date().toISOString();
  if (i < 0) all.push(entry);
  else all[i] = entry;
  writeSchedule(all);
  return entry;
};
const patchEntry = (id, patch) => {
  const e = readSchedule().find((x) => x.id === id);
  if (!e) return null;
  return saveEntry({...e, ...patch});
};

// The text posted with the video: description, then the hashtags on their own line.
export const captionFor = (e) => {
  const tags = (e.hashtags ?? []).filter(Boolean);
  const body = String(e.description ?? "").trim();
  return tags.length ? `${body}\n\n${tags.join(" ")}`.trim() : body;
};

// Public view of an entry with the episode title and asset URL added.
export const publicEntry = (e) => ({...e, episodeTitle: episodeTitle(e.episodeId), assetUrl: `/out/${e.asset}`, caption: captionFor(e)});

const viaAllowed = (platform, via, conns) => {
  const p = PLATFORMS[platform];
  if (via === "manual") return true;
  if (via === "direct") return Boolean(p.direct) && conns[p.direct]?.status === "connected";
  if (via === "blotato") return Boolean(p.blotato) && conns.blotato.status === "connected";
  return false;
};

const cleanTags = (tags) => {
  const list = Array.isArray(tags) ? tags : String(tags ?? "").split(/[\s,]+/);
  const out = [];
  for (const raw of list) {
    const t = `#${String(raw).replace(/^#+/, "").replace(/[^\p{L}\p{N}_]/gu, "")}`;
    if (t.length > 1 && !out.some((x) => x.toLowerCase() === t.toLowerCase())) out.push(t);
  }
  return out;
};

// Validates a create/update body. Returns a normalized entry (throws with a user-facing message).
export const validateEntry = (b = {}, existing = null, {port} = {}) => {
  const e = {...(existing ?? {})};
  const episodeId = String(b.episodeId ?? e.episodeId ?? "");
  if (!isEpisodeId(episodeId) || !exists(path.join(EPISODES, episodeId, "episode.json"))) throw new Error(`Unknown episode "${episodeId}"`);
  const platform = String(b.platform ?? e.platform ?? "");
  if (!PLATFORMS[platform]) throw new Error(`platform must be one of ${PLATFORM_IDS.join(", ")}`);
  const via = String(b.via ?? e.via ?? "manual");
  if (!VIAS.includes(via)) throw new Error(`via must be one of ${VIAS.join(", ")}`);
  const conns = publicConnections(port);
  if (!viaAllowed(platform, via, conns)) throw new Error(`${PLATFORMS[platform].label} cannot be posted via ${via}: connect it on the Publishing page or choose manual.`);
  const {rel} = assetFile(b.asset ?? e.asset);
  if (!rel.startsWith(`${episodeId}/`)) throw new Error(`asset must be under out/${episodeId}/`);
  const at = new Date(String(b.scheduledAt ?? e.scheduledAt ?? ""));
  if (Number.isNaN(at.getTime())) throw new Error("scheduledAt must be an ISO date-time");
  const title = String(b.title ?? e.title ?? "").trim();
  const max = PLATFORMS[platform].titleMax;
  if (max && title.length > max) throw new Error(`title is ${title.length} characters; ${PLATFORMS[platform].label} allows ${max}`);
  if ((platform === "youtube" || platform === "shorts") && !title) throw new Error("YouTube needs a title");
  const description = String(b.description ?? e.description ?? "").trim();
  const hashtags = cleanTags(b.hashtags ?? e.hashtags ?? []);
  const caption = captionFor({description, hashtags});
  if (caption.length > PLATFORMS[platform].textMax) throw new Error(`caption is ${caption.length} characters; ${PLATFORMS[platform].label} allows ${PLATFORMS[platform].textMax}`);
  const publicUrl = String(b.publicUrl ?? e.publicUrl ?? "").trim();
  if (publicUrl && !/^https?:\/\//.test(publicUrl)) throw new Error("publicUrl must start with http:// or https://");
  const tags = Array.isArray(b.tags ?? e.tags) ? (b.tags ?? e.tags).map((t) => String(t).trim()).filter(Boolean).slice(0, 30) : [];
  return {...e, episodeId, platform, via, asset: rel, title, description, hashtags, tags, publicUrl, scheduledAt: localIso(at), note: String(b.note ?? e.note ?? "").slice(0, 500)};
};

// ---------- publishing ----------
const inFlight = new Set();

// Performs the upload for one entry (direct or Blotato). `now` = ignore the slot and publish immediately.
export const publishEntry = async (id, {now = false, onLog} = {}) => {
  const entry = readSchedule().find((e) => e.id === id);
  if (!entry) throw new Error("No such schedule entry");
  if (inFlight.has(id)) throw new Error("This entry is already being published");
  if (entry.status === "published") throw new Error("Already published");
  const say = (m) => {
    onLog?.(m);
    console.log(`[publish ${id}] ${m}`);
  };
  inFlight.add(id);
  try {
    const slot = new Date(entry.scheduledAt);
    const publishAt = now ? null : slot;
    if (entry.via === "manual") {
      const e = patchEntry(id, {status: "due", error: undefined});
      appendLog({action: "due", entryId: id, episodeId: e.episodeId, platform: e.platform, via: e.via});
      return e;
    }
    patchEntry(id, {status: "uploading", error: undefined});
    appendLog({action: "upload-start", entryId: id, episodeId: entry.episodeId, platform: entry.platform, via: entry.via, now});
    const {file} = assetFile(entry.asset);
    const text = captionFor(entry);
    let result;
    if (entry.via === "direct") {
      const p = PLATFORMS[entry.platform];
      say(`Uploading ${entry.asset} to ${p.label}${publishAt ? ` for ${publishAt.toLocaleString()}` : " now"}…`);
      if (p.direct === "youtube") result = await youtubeUpload({file, title: entry.title, description: text, tags: entry.tags, publishAt, shorts: entry.platform === "shorts"});
      else if (entry.platform === "facebook") result = await facebookVideo({file, title: entry.title, description: text, publishAt});
      else if (entry.platform === "facebook_reel") result = await facebookReel({file, description: text, publishAt});
      else throw new Error(`${p.label} has no direct connection`);
      const e = patchEntry(id, {status: "published", remoteId: result.remoteId, remoteUrl: result.remoteUrl, publishedAt: new Date().toISOString(), scheduledNatively: result.scheduledNatively, error: undefined});
      appendLog({action: "published", entryId: id, episodeId: e.episodeId, platform: e.platform, via: e.via, remoteId: e.remoteId, remoteUrl: e.remoteUrl, scheduledNatively: e.scheduledNatively});
      say(`Done: ${e.remoteUrl}${e.scheduledNatively ? ` (goes live ${slot.toLocaleString()})` : ""}`);
      return e;
    }
    if (entry.via === "blotato") {
      let mediaUrl = entry.publicUrl;
      if (!mediaUrl) {
        say("No public URL: trying the media host upload command…");
        mediaUrl = hostMedia(entry);
        if (!mediaUrl) {
          const e = patchEntry(id, {status: "needs_url", error: "Blotato needs a public URL for the video: paste one (Drive, Dropbox, your site) or set a media host on the Publishing page."});
          appendLog({action: "needs-url", entryId: id, episodeId: e.episodeId, platform: e.platform});
          return e;
        }
        patchEntry(id, {publicUrl: mediaUrl});
      }
      const scheduledTime = publishAt && publishAt.getTime() > Date.now() + 60000 ? publishAt : null;
      say(`Sending to Blotato (${PLATFORMS[entry.platform].label})${scheduledTime ? ` for ${scheduledTime.toLocaleString()}` : " now"}…`);
      result = await blotatoPost({entry: {...entry, publicUrl: mediaUrl}, text, mediaUrl, scheduledTime});
      const e = patchEntry(id, {status: scheduledTime ? "scheduled" : "published", remoteId: result.remoteId, remoteUrl: result.remoteUrl, remoteAccount: result.account, sentAt: new Date().toISOString(), ...(scheduledTime ? {} : {publishedAt: new Date().toISOString()}), error: undefined});
      appendLog({action: scheduledTime ? "sent-to-blotato" : "published", entryId: id, episodeId: e.episodeId, platform: e.platform, via: e.via, remoteId: e.remoteId, account: result.account});
      say(`Blotato accepted it (submission ${result.remoteId}).`);
      return e;
    }
    throw new Error(`Unknown via "${entry.via}"`);
  } catch (err) {
    const msg = String(err.message ?? err);
    const e = patchEntry(id, {status: "failed", error: msg});
    appendLog({action: "failed", entryId: id, episodeId: entry.episodeId, platform: entry.platform, via: entry.via, error: msg});
    say(`Failed: ${msg}`);
    return e;
  } finally {
    inFlight.delete(id);
  }
};

// Creation: Blotato entries are sent right away (Blotato holds the slot); direct entries wait for the scheduler; manual entries wait for the slot.
export const createEntry = async (body, {port}) => {
  const e = validateEntry(body, null, {port});
  const draft = body.status === "draft";
  const at = new Date(e.scheduledAt).getTime();
  if (!draft && e.via !== "manual" && at < Date.now() - 60000) throw new Error("scheduledAt is in the past. Pick a future slot, or use Publish now after adding it.");
  const entry = saveEntry({id: crypto.randomUUID().slice(0, 8), ...e, status: draft ? "draft" : "scheduled", createdAt: new Date().toISOString()});
  appendLog({action: "create", entryId: entry.id, episodeId: entry.episodeId, platform: entry.platform, via: entry.via, scheduledAt: entry.scheduledAt, status: entry.status});
  if (!draft && entry.via === "blotato") return publishEntry(entry.id);
  return entry;
};

export const updateEntry = async (id, body, {port}) => {
  const existing = readSchedule().find((x) => x.id === id);
  if (!existing) throw new Error("No such schedule entry");
  if (existing.status === "uploading") throw new Error("This entry is uploading right now");
  if (existing.status === "published") {
    // Only the record can change once it is out.
    const e = saveEntry({...existing, note: String(body.note ?? existing.note ?? "").slice(0, 500), remoteUrl: body.remoteUrl !== undefined ? String(body.remoteUrl) : existing.remoteUrl});
    return e;
  }
  if (existing.via === "blotato" && existing.remoteId && existing.status === "scheduled") throw new Error("Blotato already holds this post: change it at my.blotato.com/scheduler, or delete this entry (and the Blotato post) and add it again.");
  const v = validateEntry(body, existing, {port});
  // An edit re-arms the entry: failed / needs_url / due go back to scheduled; drafts stay drafts unless asked.
  let status = "scheduled";
  if (body.status === "draft") status = "draft";
  else if (existing.status === "draft" && body.status !== "scheduled") status = "draft";
  if (status === "scheduled" && v.via !== "manual" && new Date(v.scheduledAt).getTime() < Date.now() - 60000) throw new Error("scheduledAt is in the past. Pick a future slot, or use Publish now.");
  const entry = saveEntry({...v, status, error: status === "scheduled" ? undefined : existing.error});
  appendLog({action: "update", entryId: id, episodeId: entry.episodeId, platform: entry.platform, via: entry.via, scheduledAt: entry.scheduledAt, status: entry.status});
  if (entry.status === "scheduled" && entry.via === "blotato" && !entry.remoteId) return publishEntry(entry.id);
  return entry;
};

export const deleteEntry = (id) => {
  const all = readSchedule();
  const e = all.find((x) => x.id === id);
  if (!e) throw new Error("No such schedule entry");
  if (inFlight.has(id)) throw new Error("This entry is uploading right now");
  writeSchedule(all.filter((x) => x.id !== id));
  appendLog({action: "delete", entryId: id, episodeId: e.episodeId, platform: e.platform, via: e.via, status: e.status, remoteId: e.remoteId});
  const warning = e.via === "blotato" && e.remoteId && e.status === "scheduled" ? "Removed from the Studio schedule. Blotato still holds the post: cancel it at my.blotato.com/scheduler." : null;
  return {deleted: true, warning};
};

export const markPosted = (id, url) => {
  const e = readSchedule().find((x) => x.id === id);
  if (!e) throw new Error("No such schedule entry");
  const u = String(url ?? "").trim();
  if (u && !/^https?:\/\//.test(u)) throw new Error("URL must start with http:// or https://");
  const out = saveEntry({...e, status: "published", remoteUrl: u || e.remoteUrl, publishedAt: new Date().toISOString(), postedBy: "Hippolyte (manual)", error: undefined});
  appendLog({action: "marked-posted", entryId: id, episodeId: e.episodeId, platform: e.platform, via: e.via, remoteUrl: out.remoteUrl});
  return out;
};

// Next scheduled/due slot per episode, for the episodes list.
export const nextForEpisode = (episodeId, entries = readSchedule()) => {
  const mine = entries.filter((e) => e.episodeId === episodeId);
  const upcoming = mine.filter((e) => ["scheduled", "due", "uploading", "needs_url", "draft"].includes(e.status)).sort((a, b) => Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt));
  const published = mine.filter((e) => e.status === "published").length;
  const next = upcoming[0] ?? null;
  return {count: mine.length, published, next: next ? {id: next.id, platform: next.platform, via: next.via, scheduledAt: next.scheduledAt, status: next.status} : null};
};

// ---------- scheduler loop ----------
// Every minute: direct entries within their lead time are uploaded with native scheduling; manual entries past their slot become "due".
export const schedulerTick = async () => {
  const now = Date.now();
  for (const e of readSchedule()) {
    if (e.status !== "scheduled") continue;
    const at = Date.parse(e.scheduledAt);
    if (Number.isNaN(at)) continue;
    if (e.via === "manual") {
      if (at <= now) {
        patchEntry(e.id, {status: "due"});
        appendLog({action: "due", entryId: e.id, episodeId: e.episodeId, platform: e.platform, via: e.via});
      }
      continue;
    }
    if (e.via === "direct" && !inFlight.has(e.id)) {
      const lead = LEAD_MS[PLATFORMS[e.platform]?.direct] ?? LEAD_MS.youtube;
      if (at <= now + lead) await publishEntry(e.id).catch((err) => console.error(`[scheduler] ${e.id}: ${err.message}`));
    }
  }
};

export const startScheduler = (intervalMs = 60000) => {
  setTimeout(() => schedulerTick().catch((e) => console.error("[scheduler]", e)), 5000);
  const t = setInterval(() => schedulerTick().catch((e) => console.error("[scheduler]", e)), intervalMs);
  t.unref?.();
  return t;
};

// ---------- publishing kit (per platform) ----------
export const KIT_LIMITS = {
  youtube: {title: 60, tags: 10},
  shorts: {title: 40, description: 150, hashtags: 3},
  instagram: {caption: 2200, hashtags: 5},
  facebook: {caption: 500, hashtags: 2},
  tiktok: {caption: 150, hashtags: 4},
  linkedin: {post: 3000},
  thumbnailWords: 4,
  bank: 15,
};

const readStatusFile = (id) => safeJson(path.join(EPISODES, id, "status.json"), {});

// Chapter list from build.json: one per scene, scenes under 10 s folded into the previous one (YouTube's rule).
export const chaptersFor = (id) => {
  const build = safeJson(path.join(PUBLIC, "episodes", id, "build.json"), null);
  if (!build?.scenes?.length) return [];
  const out = [];
  for (const s of build.scenes) {
    if (out.length && s.durationMs < 10000) continue;
    out.push({at: mmss(s.startMs), label: s.label ?? s.id});
  }
  if (out.length) out[0].at = "0:00";
  return out;
};

export const kitContext = (id) => {
  const ep = safeJson(path.join(EPISODES, id, "episode.json"), {});
  const status = readStatusFile(id);
  const build = safeJson(path.join(PUBLIC, "episodes", id, "build.json"), null);
  const timing = new Map((build?.scenes ?? []).map((s) => [s.id, s]));
  const name = (s) => CHARACTERS[s]?.name ?? s;
  const scenes = (ep.scenes ?? [])
    .map((s, i) => {
      const t = timing.get(s.id);
      const head = `Scene ${i + 1} "${s.label ?? s.id}" (${s.type})${t ? ` — ${mmss(t.startMs)} to ${mmss(t.startMs + t.durationMs)}` : ""}`;
      const lines = (s.lines ?? []).map((l) => `  ${name(l.speaker)}: ${l.text}`).join("\n");
      return `${head}\n${lines || "  (no spoken lines)"}`;
    })
    .join("\n\n");
  const disclosure = ep.disclosure ?? status.disclosure ?? "Fictional teaching scenario based on researched conditions";
  const cast = [...new Set((ep.scenes ?? []).flatMap((s) => s.characters ?? []))].map((c) => `${name(c)} (${CHARACTERS[c]?.role ?? c})`).join(", ");
  return {id, ep, status, build, scenes, disclosure, cast, chapters: chaptersFor(id), title: ep.title ?? status.title ?? id, total: build ? mmss(build.totalMs) : "unknown", setting: [status.setting?.country, status.setting?.place, status.setting?.community].filter(Boolean).join(" · ")};
};

export const kitSystemPrompt = () => {
  const bible = fs.readFileSync(path.join(ROOT, "SERIES.md"), "utf8");
  return `You are the showrunner of the animated AI education series "AI With Hippolyte", writing the social publishing kit for one finished episode as JSON. The host posts it himself; you only write the words.

=== SERIES BIBLE (SERIES.md) — match its tone: plain English, direct, warm, practical, no hype, no emojis ===
${bible.trim()}

=== PLATFORM RULES ===
- youtube: "titles": 3 options, each at most ${KIT_LIMITS.youtube.title} characters, the claim or question first, no clickbait. "description": two short paragraphs (what happens, what the viewer learns), then a line "Chapters" followed by the chapter list given in the task exactly as provided (one per line, "m:ss Title"), then the disclosure line verbatim on its own line, then the series tagline. "tags": ${KIT_LIMITS.youtube.tags} lowercase tags without #, including "ai with hippolyte" and "africa ai moment".
- shorts: "titles": 3 options, each at most ${KIT_LIMITS.shorts.title} characters, the claim first. "description": at most ${KIT_LIMITS.shorts.description} characters, one or two sentences. "hashtags": 3 hashtags (with #), relevant to the topic.
- instagram: "caption": a hook line, then 2 short paragraphs, then one question to the reader; at most 1,800 characters; no hashtags inside (they are added on the last line). "hashtags": 5 hashtags.
- facebook: "caption": at most ${KIT_LIMITS.facebook.caption} characters, conversational, ends with a question. "hashtags": at most 2.
- tiktok: "caption": at most ${KIT_LIMITS.tiktok.caption} characters, punchy. "hashtags": 4 hashtags.
- linkedin: "post": 120 to 180 words in the host's first-person voice (an AI engineer who has run production systems; direct, warm, practical), no hashtags, no links, no emojis, ending with one question.
- "thumbnailText": at most ${KIT_LIMITS.thumbnailWords} words for the thumbnail.
- "hashtagBank": ${KIT_LIMITS.bank} relevant hashtags (with #), starting with #AIWithHippolyte and #AfricaAIMoment.
Rules: no invented statistics, no claims the episode does not make, the host's real name only in the series name, characters named only as in the episode. Return ONLY one JSON object with exactly these keys: youtube, shorts, instagram, facebook, tiktok, linkedin, thumbnailText, hashtagBank.`;
};

export const kitPrompt = (id) => {
  const c = kitContext(id);
  const chapters = c.chapters.map((ch) => `${ch.at} ${ch.label}`).join("\n");
  const cuts = (c.ep.cuts ?? []).map((x) => `- ${x.id}: target ${x.targetSec ?? "?"} s, scenes ${x.scenes.join(", ")}`).join("\n");
  const prompt = `=== EPISODE ===
Episode ${c.ep.episode ?? Number(id.slice(2))} (${id}): "${c.title}"
Disclosure line (must appear verbatim in the YouTube description): ${c.disclosure}
Total running time: ${c.total}
Setting: ${c.setting || "none stated"}
Cast in this episode: ${c.cast || "tanyi"}
Vertical cuts (the Shorts, Reels and TikTok asset):
${cuts || "- none"}

=== CHAPTERS (copy into the YouTube description exactly) ===
${chapters || "(no build yet)"}

=== SPOKEN LINES WITH SCENE TIMESTAMPS ===
${c.scenes}

=== TASK ===
Write the publishing kit JSON for this episode: {"youtube": {"titles": [], "description": "", "tags": []}, "shorts": {"titles": [], "description": "", "hashtags": []}, "instagram": {"caption": "", "hashtags": []}, "facebook": {"caption": "", "hashtags": []}, "tiktok": {"caption": "", "hashtags": []}, "linkedin": {"post": ""}, "thumbnailText": "", "hashtagBank": []}. Return only the JSON.`;
  return {system: kitSystemPrompt(), prompt, context: c};
};

// Trim at a word boundary, never mid-word when a space exists in the last third.
const clip = (s, n) => {
  const t = String(s ?? "")
    .replace(/\s+/g, " ")
    .trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const sp = cut.lastIndexOf(" ");
  return (sp > n * 0.6 ? cut.slice(0, sp) : cut).replace(/[\s,;:\-–—]+$/, "");
};
const clipText = (s, n) => {
  const t = String(s ?? "").trim();
  if (t.length <= n) return t;
  const cut = t.slice(0, n);
  const br = Math.max(cut.lastIndexOf("\n"), cut.lastIndexOf(". "));
  return (br > n * 0.5 ? cut.slice(0, br + 1) : clip(cut, n)).trim();
};
const asList = (v) => (Array.isArray(v) ? v : typeof v === "string" ? v.split(/\n|,/) : []).map((x) => String(x).trim()).filter(Boolean);
const withFixed = (tags, n, first = []) => cleanTags([...first, ...FIXED_TAGS, ...cleanTags(tags)]).slice(0, n);
const tagWord = (t) => String(t).replace(/^#/, "").replace(/[^\p{L}\p{N} ]/gu, "").toLowerCase().trim();

// Enforces every platform limit in code; the model's output is a draft.
export const finalizeKit = (raw, ctx) => {
  const r = raw && typeof raw === "object" ? raw : {};
  const y = r.youtube ?? {};
  const titles = asList(y.titles).map((t) => clip(t, KIT_LIMITS.youtube.title)).filter(Boolean);
  while (titles.length < 3) titles.push(clip(ctx.title, KIT_LIMITS.youtube.title));
  let desc = String(y.description ?? "").trim();
  if (ctx.chapters.length && !/(^|\n)0:00 /.test(desc)) desc += `\n\nChapters\n${ctx.chapters.map((ch) => `${ch.at} ${ch.label}`).join("\n")}`;
  if (!desc.includes(ctx.disclosure)) desc += `\n\n${ctx.disclosure}`;
  const tagline = ctx.ep.tagline ?? "Complex AI. Explained visually. Built practically.";
  if (!desc.includes(tagline)) desc += `\n${tagline}`;
  desc = clipText(desc, 4800);
  const ytTags = [];
  for (const t of ["ai with hippolyte", "africa ai moment", ...asList(y.tags).map(tagWord)]) if (t && !ytTags.includes(t) && t.length <= 30) ytTags.push(t);
  const youtube = {titles: titles.slice(0, 3), description: desc, tags: ytTags.slice(0, KIT_LIMITS.youtube.tags), hashtags: [...FIXED_TAGS]};

  const s = r.shorts ?? {};
  const sTitles = asList(s.titles).map((t) => clip(t, KIT_LIMITS.shorts.title)).filter(Boolean);
  while (sTitles.length < 3) sTitles.push(clip(titles[sTitles.length] ?? ctx.title, KIT_LIMITS.shorts.title));
  const shorts = {titles: sTitles.slice(0, 3), description: clip(String(s.description ?? "").replace(/#\w+/g, "").trim(), KIT_LIMITS.shorts.description), hashtags: withFixed(s.hashtags, KIT_LIMITS.shorts.hashtags + 1, ["#Shorts"])};

  const ig = r.instagram ?? {};
  const igTags = withFixed(ig.hashtags, KIT_LIMITS.instagram.hashtags);
  const instagram = {caption: clipText(String(ig.caption ?? "").replace(/(^|\s)#[\p{L}\p{N}_]+/gu, "$1").trim(), KIT_LIMITS.instagram.caption - igTags.join(" ").length - 2), hashtags: igTags};

  const fb = r.facebook ?? {};
  const facebook = {caption: clipText(String(fb.caption ?? "").trim(), KIT_LIMITS.facebook.caption), hashtags: withFixed(fb.hashtags, KIT_LIMITS.facebook.hashtags)};

  const tt = r.tiktok ?? {};
  const tiktok = {caption: clip(String(tt.caption ?? "").replace(/#\w+/g, "").trim(), KIT_LIMITS.tiktok.caption), hashtags: withFixed(tt.hashtags, KIT_LIMITS.tiktok.hashtags)};

  const li = r.linkedin ?? {};
  const linkedin = {post: clipText(String(li.post ?? "").replace(/https?:\/\/\S+/g, "").replace(/(^|\s)#[\p{L}\p{N}_]+/gu, "$1").replace(/[ \t]+\n/g, "\n").trim(), KIT_LIMITS.linkedin.post), hashtags: []};

  const thumbnailText = String(r.thumbnailText ?? "")
    .replace(/["“”]/g, "")
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, KIT_LIMITS.thumbnailWords)
    .join(" ");
  const hashtagBank = withFixed(r.hashtagBank, KIT_LIMITS.bank);
  return {youtube, shorts, instagram, facebook, tiktok, linkedin, thumbnailText: thumbnailText || clip(ctx.title, 24), hashtagBank};
};

export const kitToMarkdown = (kit, ctx, stamp = "") => {
  const list = (a) => a.map((x, i) => `${i + 1}. ${x}`).join("\n");
  return `# Publishing kit — ${ctx.id} "${ctx.title}"

## Titles
${list(kit.youtube.titles)}

## YouTube description
${kit.youtube.description}

${kit.youtube.hashtags.join(" ")}

## Tags
${kit.youtube.tags.join(", ")}

## Thumbnail text
${kit.thumbnailText}

## Shorts
Titles:
${list(kit.shorts.titles)}

${kit.shorts.description}
${kit.shorts.hashtags.join(" ")}

## Instagram
${kit.instagram.caption}

${kit.instagram.hashtags.join(" ")}

## Facebook
${kit.facebook.caption}

${kit.facebook.hashtags.join(" ")}

## TikTok
${kit.tiktok.caption}
${kit.tiktok.hashtags.join(" ")}

## LinkedIn post
${kit.linkedin.post}

## Hashtag bank
${kit.hashtagBank.join(" ")}
${stamp}`;
};

export const readKit = (id) => {
  const p = path.join(EPISODES, id, "publish.json");
  return exists(p) ? safeJson(p, null) : null;
};

export const writeKit = (id, kit, meta) => {
  const ctx = kitContext(id);
  const full = {...kit, generatedAt: new Date().toISOString(), engine: meta?.engine ?? null, model: meta?.model ?? null, chapters: ctx.chapters, disclosure: ctx.disclosure, limits: KIT_LIMITS};
  writeJson(path.join(EPISODES, id, "publish.json"), full);
  const stamp = `\n---\nGenerated by AI Workshop Studio (${meta?.engine ?? "?"} ${meta?.model ?? ""}) on ${full.generatedAt.slice(0, 10)}. Every field is editable in the Publish tab before scheduling. The team never posts.\n`;
  fs.writeFileSync(path.join(EPISODES, id, "publish.md"), kitToMarkdown(kit, ctx, stamp));
  return full;
};

// Default slots: next weekday at 9:00 local, platforms staggered by 15 minutes in this order.
export const DEFAULT_ORDER = ["youtube", "shorts", "instagram", "tiktok", "facebook", "facebook_reel", "linkedin"];
export const defaultSlots = (from = new Date()) => {
  const d = new Date(from);
  d.setHours(9, 0, 0, 0);
  do d.setDate(d.getDate() + 1);
  while (d.getDay() === 0 || d.getDay() === 6);
  return Object.fromEntries(DEFAULT_ORDER.map((p, i) => [p, localIso(new Date(d.getTime() + i * 15 * 60000))]));
};
