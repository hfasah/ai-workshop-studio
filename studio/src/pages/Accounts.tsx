import {useEffect, useState} from "react";
import {api, PLATFORM_META, type Connections, type PlatformId} from "../api";
import {ConnectionsPanel} from "../components/Connections";
import {PlatformBadge, viaOptions} from "../components/Schedule";

const ORDER: PlatformId[] = ["youtube", "shorts", "facebook", "facebook_reel", "instagram", "tiktok", "linkedin"];

// One row per platform: how the Studio can post there right now (direct, Blotato or manual) and what is missing.
export const AccountGrid = ({conns}: {conns: Connections}) => (
  <div className="acct-grid">
    {ORDER.map((p) => {
      const vias = viaOptions(p, conns);
      const best = vias.find((v) => v.enabled && v.value !== "manual");
      const state = best ? "ready" : "manual";
      const directName = conns.platforms[p].direct === "youtube" ? "YouTube" : conns.platforms[p].direct === "facebook" ? "the Facebook Page" : "";
      const how = best ? best.label : directName ? `Manual until ${directName} is connected` : conns.platforms[p].blotato ? "Manual until Blotato is connected" : "Manual: copy the caption and post yourself";
      return (
        <div key={p} className={`acct-row ${state}`}>
          <PlatformBadge platform={p} />
          <div className="acct-name">{PLATFORM_META[p].label}</div>
          <div className="acct-how small">{how}</div>
          <span className={`chip ${state === "ready" ? "approved" : "other"}`}>{state === "ready" ? "ready to post" : "manual"}</span>
        </div>
      );
    })}
  </div>
);

// /accounts: every social account in one place. Connect once; every episode's Publish tab then posts through these.
export const Accounts = () => {
  const [conns, setConns] = useState<Connections | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .connections()
      .then(setConns)
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const ready = conns ? ORDER.filter((p) => viaOptions(p, conns).some((v) => v.enabled && v.value !== "manual")).length : 0;

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">AI With Hippolyte · The AI Workshop</div>
          <h1>Accounts</h1>
          <div className="muted">Link the social accounts once. Every episode's Publish tab then posts through them: YouTube and Facebook directly, Instagram and TikTok through Blotato, anything else by copy and paste. Secrets stay in studio/connections.json on this computer.</div>
        </div>
        <div className="btn-row">{conns ? <span className={`chip ${ready ? "approved" : "pending"}`}>{ready} of {ORDER.length} platforms ready</span> : null}</div>
      </div>

      {error && <div className="notice bad">Cannot reach the API: {error}</div>}

      {conns ? (
        <>
          <div className="card" style={{marginBottom: 16}}>
            <h3>Where the Studio can post right now</h3>
            <AccountGrid conns={conns} />
          </div>
          <ConnectionsPanel conns={conns} onChange={setConns} />
        </>
      ) : (
        <div className="muted">Loading accounts…</div>
      )}
    </>
  );
};
