import {useEffect, useState} from "react";
import {Player} from "@remotion/player";
import {Episode} from "@video/Episode";
import type {Build} from "@video/types";
import {fmtDuration, type BuildSummary} from "../api";

type LoadedBuild = Build & {builtAt?: string};

type Props = {episodeId: string; build: BuildSummary | null};

export const Preview = ({episodeId, build}: Props) => {
  const [orientation, setOrientation] = useState<"landscape" | "portrait">("landscape");
  const [cut, setCut] = useState<string>("");
  const [data, setData] = useState<LoadedBuild | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!build || build.error) return;
    let alive = true;
    setData(null);
    setError(null);
    const file = cut ? `build.${cut}.json` : "build.json";
    // Same file the renderer reads (public/episodes/<id>/build.json); cache-busted so a fresh voice build shows up.
    fetch(`/public/episodes/${episodeId}/${file}?t=${Date.now()}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status} loading ${file}`))))
      .then((b: LoadedBuild) => alive && setData(b))
      .catch((e) => alive && setError(String(e.message ?? e)));
    return () => {
      alive = false;
    };
  }, [episodeId, build, cut]);

  if (!build || build.error) {
    return (
      <div className="notice warn">
        <strong>Build voice first.</strong> The preview plays public/episodes/{episodeId}/build.json, which "Build voice" creates from episode.json.
        {build?.error ? <div className="small">build.json could not be read: {build.error}</div> : null}
      </div>
    );
  }

  const width = orientation === "portrait" ? 1080 : 1920;
  const height = orientation === "portrait" ? 1920 : 1080;

  return (
    <div>
      <div className="btn-row" style={{marginBottom: 12}}>
        <button className={orientation === "landscape" ? "primary" : ""} onClick={() => setOrientation("landscape")}>
          Landscape 1920x1080
        </button>
        <button className={orientation === "portrait" ? "primary" : ""} onClick={() => setOrientation("portrait")}>
          Portrait 1080x1920
        </button>
        {build.cuts.length > 0 && (
          <select value={cut} onChange={(e) => setCut(e.target.value)} style={{width: "auto"}}>
            <option value="">Full episode · {fmtDuration(build.totalMs)}</option>
            {build.cuts.map((c) => (
              <option key={c.id} value={c.id}>
                Cut {c.id} · {fmtDuration(c.totalMs)}
              </option>
            ))}
          </select>
        )}
        <span className="muted small">
          {data ? `${data.scenes.length} scenes · ${fmtDuration(data.totalMs)} · ${data.fps} fps ${data.builtAt ? ` · built ${new Date(data.builtAt).toLocaleString()}` : ""}` : error ? "" : "Loading build…"}
        </span>
      </div>
      {error && <div className="notice bad">{error}</div>}
      {data && (
        <div className="player-wrap">
          <div className={`player-box ${orientation}`}>
            <Player
              key={`${orientation}-${cut}-${data.builtAt ?? data.totalMs}`}
              component={Episode}
              inputProps={{episodeId, cut: cut || undefined, build: data}}
              durationInFrames={Math.max(1, Math.ceil((data.totalMs / 1000) * data.fps))}
              fps={data.fps}
              compositionWidth={width}
              compositionHeight={height}
              style={{width: "100%", height: "100%"}}
              controls
              loop
              clickToPlay
              spaceKeyToPlayOrPause
              showVolumeControls
              acknowledgeRemotionLicense
            />
          </div>
        </div>
      )}
      <div className="hint" style={{marginTop: 8}}>
        Live render of the same React composition the MP4s use (src/Episode.tsx); the browser plays it, nothing is written to disk. Audio and character packs load from public/.
      </div>
    </div>
  );
};
