import {useState} from "react";
import {api, type Connections, type ConnectionStatus} from "../api";

type Props = {conns: Connections; onChange: (c: Connections) => void};

const StatusChip = ({status, name}: {status: ConnectionStatus; name?: string}) => {
  const cls = {connected: "approved", "not configured": "other", "needs auth": "pending", error: "changes"}[status];
  return (
    <span className={`chip ${cls}`}>
      {status}
      {status === "connected" && name ? `: ${name}` : ""}
    </span>
  );
};

// Cards for YouTube (OAuth), Facebook Page (token), Blotato (API key) and the optional media host. Test never posts.
export const ConnectionsPanel = ({conns, onChange}: Props) => {
  const [yt, setYt] = useState({clientId: conns.youtube.clientId, clientSecret: ""});
  const [fb, setFb] = useState({pageId: conns.facebook.pageId, pageToken: ""});
  const [bl, setBl] = useState({apiKey: ""});
  const [mh, setMh] = useState({baseUrl: conns.mediaHost.baseUrl, uploadCommand: conns.mediaHost.uploadCommand});
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<Record<string, {ok: boolean; text: string}>>({});

  const say = (k: string, ok: boolean, text: string) => setMsg((m) => ({...m, [k]: {ok, text}}));
  const run = async (k: string, fn: () => Promise<Connections | void>, ok?: string) => {
    setBusy(k);
    try {
      const c = await fn();
      if (c) onChange(c);
      if (ok) say(k, true, ok);
    } catch (e) {
      say(k, false, String((e as Error).message ?? e));
      api.connections().then(onChange).catch(() => undefined);
    } finally {
      setBusy(null);
    }
  };

  const saveYt = () => run("youtube", () => api.setConnections({youtube: {clientId: yt.clientId, ...(yt.clientSecret ? {clientSecret: yt.clientSecret} : {})}}), "Saved. Now click Connect Google account.");
  const connectYt = () =>
    run("youtube", async () => {
      const r = await api.youtubeAuthUrl();
      window.open(r.url, "_blank", "noopener");
      say("youtube", true, "Google consent opened in a new tab. Approve, then come back and click Test.");
    });
  const testYt = () => run("youtube", async () => (await api.testConnection("youtube")).connections, "Channel found. Nothing was posted.");
  const disconnectYt = () => run("youtube", () => api.setConnections({youtube: {disconnect: true}}), "Tokens removed.");

  const saveFb = () => run("facebook", () => api.setConnections({facebook: {pageId: fb.pageId, ...(fb.pageToken ? {pageToken: fb.pageToken} : {})}}), "Saved. Click Test to read the page name.");
  const testFb = () => run("facebook", async () => (await api.testConnection("facebook")).connections, "Page found. Nothing was posted.");

  const saveBl = () => run("blotato", () => api.setConnections({blotato: {apiKey: bl.apiKey}}), "Saved. Click Test to list the connected accounts.");
  const testBl = () => run("blotato", async () => (await api.testConnection("blotato")).connections, "Accounts listed. Nothing was posted.");

  const saveMh = () => run("mediaHost", () => api.setConnections({mediaHost: mh}), "Saved.");

  const Msg = ({k}: {k: string}) => (msg[k] ? <div className={`notice small ${msg[k].ok ? "ok" : "bad"}`}>{msg[k].text}</div> : null);

  return (
    <div className="conn-panel">
      <div className="card tight conn-card">
        <div className="conn-head">
          <h3>YouTube</h3>
          <StatusChip status={conns.youtube.status} name={conns.youtube.channelTitle} />
        </div>
        <div className="small muted">Posts: main videos (16:9) and Shorts (9:16), scheduled natively (private + publish time). Free. Needs a Google Cloud project with the YouTube Data API v3 enabled and an OAuth client of type Desktop app; paste its id and secret.</div>
        <label className="field">
          <span>OAuth client id</span>
          <input value={yt.clientId} onChange={(e) => setYt({...yt, clientId: e.target.value})} placeholder="…apps.googleusercontent.com" />
        </label>
        <label className="field">
          <span>Client secret {conns.youtube.hasSecret ? "(stored; leave blank to keep)" : ""}</span>
          <input type="password" value={yt.clientSecret} onChange={(e) => setYt({...yt, clientSecret: e.target.value})} placeholder={conns.youtube.hasSecret ? "••••••••" : "GOCSPX-…"} />
        </label>
        <div className="small muted" style={{marginBottom: 8}}>
          Redirect URI: <code>{conns.youtube.redirectUri}</code>
        </div>
        <div className="btn-row">
          <button className="sm" disabled={busy === "youtube"} onClick={saveYt}>
            Save
          </button>
          <button className="sm accent" disabled={busy === "youtube" || !conns.youtube.clientId || !conns.youtube.hasSecret} onClick={connectYt}>
            Connect Google account
          </button>
          <button className="sm" disabled={busy === "youtube" || conns.youtube.status !== "connected"} onClick={testYt}>
            Test
          </button>
          {conns.youtube.status === "connected" && (
            <button className="sm ghost" disabled={busy === "youtube"} onClick={disconnectYt}>
              Disconnect
            </button>
          )}
        </div>
        {conns.youtube.error && <div className="small warn-text">{conns.youtube.error}</div>}
        <Msg k="youtube" />
      </div>

      <div className="card tight conn-card">
        <div className="conn-head">
          <h3>Facebook Page</h3>
          <StatusChip status={conns.facebook.status} name={conns.facebook.pageName} />
        </div>
        <div className="small muted">Posts: Page videos (16:9, scheduled natively) and Reels (9:16, beta). Free. Needs the Page id and a Page access token with pages_manage_posts and pages_read_engagement (Meta Graph API Explorer or your own Meta app; long-lived tokens last about 60 days).</div>
        <label className="field">
          <span>Page id</span>
          <input value={fb.pageId} onChange={(e) => setFb({...fb, pageId: e.target.value})} placeholder="1234567890" />
        </label>
        <label className="field">
          <span>Page access token {conns.facebook.hasToken ? "(stored; leave blank to keep)" : ""}</span>
          <input type="password" value={fb.pageToken} onChange={(e) => setFb({...fb, pageToken: e.target.value})} placeholder={conns.facebook.hasToken ? "••••••••" : "EAAB…"} />
        </label>
        <div className="btn-row">
          <button className="sm" disabled={busy === "facebook"} onClick={saveFb}>
            Save
          </button>
          <button className="sm" disabled={busy === "facebook" || conns.facebook.status === "not configured"} onClick={testFb}>
            Test
          </button>
        </div>
        {conns.facebook.error && <div className="small warn-text">{conns.facebook.error}</div>}
        <Msg k="facebook" />
      </div>

      <div className="card tight conn-card">
        <div className="conn-head">
          <h3>Blotato</h3>
          <StatusChip status={conns.blotato.status} name={conns.blotato.accounts.length ? `${conns.blotato.accounts.length} accounts` : undefined} />
        </div>
        <div className="small muted">Posts: Instagram Reels and TikTok (and Facebook, YouTube or LinkedIn if those are connected in Blotato). Paid Blotato plan; the video must be at a public URL (paste one per entry, or set a media host below).</div>
        <label className="field">
          <span>API key {conns.blotato.hasKey ? "(stored; leave blank to keep)" : ""}</span>
          <input type="password" value={bl.apiKey} onChange={(e) => setBl({apiKey: e.target.value})} placeholder={conns.blotato.hasKey ? "••••••••" : "from my.blotato.com → Settings → API"} />
        </label>
        <div className="btn-row">
          <button className="sm" disabled={busy === "blotato" || !bl.apiKey} onClick={saveBl}>
            Save
          </button>
          <button className="sm" disabled={busy === "blotato" || !conns.blotato.hasKey} onClick={testBl}>
            Test
          </button>
        </div>
        {conns.blotato.accounts.length > 0 && (
          <div className="small" style={{marginTop: 8}}>
            {conns.blotato.accounts.map((a) => (
              <div key={a.id}>
                <span className="chip other">{a.platform}</span> @{a.username || a.fullname || a.id}
                {a.pages?.length ? ` · pages: ${a.pages.map((p) => p.name || p.id).join(", ")}` : ""}
              </div>
            ))}
          </div>
        )}
        {conns.blotato.error && <div className="small warn-text">{conns.blotato.error}</div>}
        <Msg k="blotato" />
      </div>

      <div className="card tight conn-card">
        <div className="conn-head">
          <h3>Media host (optional)</h3>
          <StatusChip status={conns.mediaHost.baseUrl && conns.mediaHost.uploadCommand ? "connected" : "not configured"} />
        </div>
        <div className="small muted">
          For Blotato entries without a pasted URL: the Studio runs this command to copy the MP4 somewhere public, then uses base URL + file name. Placeholders: <code>{"{file}"}</code> (quoted absolute path), <code>{"{name}"}</code>, <code>{"{episode}"}</code>.
        </div>
        <label className="field">
          <span>Public base URL</span>
          <input value={mh.baseUrl} onChange={(e) => setMh({...mh, baseUrl: e.target.value})} placeholder="https://africaaimoment.com/media" />
        </label>
        <label className="field">
          <span>Upload command</span>
          <input className="mono" value={mh.uploadCommand} onChange={(e) => setMh({...mh, uploadCommand: e.target.value})} placeholder="cp {file} /path/to/site/public/media/ && (cd /path/to/site && vercel deploy --prod)" />
        </label>
        <div className="btn-row">
          <button className="sm" disabled={busy === "mediaHost"} onClick={saveMh}>
            Save
          </button>
        </div>
        <Msg k="mediaHost" />
      </div>

      <div className="small muted" style={{padding: "4px 2px"}}>
        Manual is always available: the entry shows the asset, the caption to copy and a "Mark as posted" button. LinkedIn is manual unless a LinkedIn account is connected in Blotato. Secrets live in studio/connections.json (gitignored). Nothing is posted unless you add it to the schedule.
      </div>
    </div>
  );
};
