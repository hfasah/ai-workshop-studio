import {useEffect, useState} from "react";
import {api, EXPRESSIONS, GESTURES, type EpisodeJson, type EpisodeLine, type Validation} from "../api";

type Props = {episodeId: string; episode: EpisodeJson; cast: string[]; onSaved: (episode: EpisodeJson) => void};

const countWords = (t: string) => t.split(/\s+/).filter(Boolean).length;

export const ScriptEditor = ({episodeId, episode, cast, onSaved}: Props) => {
  const [draft, setDraft] = useState<EpisodeJson>(episode);
  const [dirty, setDirty] = useState(false);
  const [raw, setRaw] = useState(false);
  const [rawText, setRawText] = useState("");
  const [rawError, setRawError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [validation, setValidation] = useState<Validation | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!dirty) setDraft(episode);
  }, [episode, dirty]);

  const update = (fn: (e: EpisodeJson) => EpisodeJson) => {
    setDraft((d) => fn(structuredClone(d)));
    setDirty(true);
  };

  const setLine = (si: number, li: number, patch: Partial<EpisodeLine>) =>
    update((e) => {
      const lines = e.scenes[si].lines ?? [];
      lines[li] = {...lines[li], ...patch};
      e.scenes[si].lines = lines;
      return e;
    });

  const addLine = (si: number) =>
    update((e) => {
      const lines = e.scenes[si].lines ?? [];
      const prev = lines[lines.length - 1];
      lines.push({speaker: prev?.speaker ?? cast[0] ?? "tanyi", text: "", expression: "neutral", gesture: "neutral"});
      e.scenes[si].lines = lines;
      return e;
    });

  const removeLine = (si: number, li: number) =>
    update((e) => {
      e.scenes[si].lines?.splice(li, 1);
      return e;
    });

  const moveLine = (si: number, li: number, dir: -1 | 1) =>
    update((e) => {
      const lines = e.scenes[si].lines ?? [];
      const j = li + dir;
      if (j < 0 || j >= lines.length) return e;
      [lines[li], lines[j]] = [lines[j], lines[li]];
      return e;
    });

  const toggleRaw = () => {
    if (!raw) {
      setRawText(JSON.stringify(draft, null, 2));
      setRawError(null);
      setRaw(true);
    } else {
      try {
        const parsed = JSON.parse(rawText) as EpisodeJson;
        if (!Array.isArray(parsed.scenes)) throw new Error("scenes must be an array");
        setDraft(parsed);
        setDirty(true);
        setRawError(null);
        setRaw(false);
      } catch (e) {
        setRawError(String((e as Error).message ?? e));
      }
    }
  };

  const save = async () => {
    let toSave = draft;
    if (raw) {
      try {
        toSave = JSON.parse(rawText) as EpisodeJson;
        setDraft(toSave);
        setRawError(null);
      } catch (e) {
        setRawError(String((e as Error).message ?? e));
        return;
      }
    }
    setSaving(true);
    setError(null);
    try {
      const r = await api.saveEpisode(episodeId, toSave);
      setValidation(r.validation);
      setDirty(false);
      onSaved(toSave);
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setSaving(false);
    }
  };

  const discard = () => {
    setDraft(episode);
    setRawText(JSON.stringify(episode, null, 2));
    setDirty(false);
    setRawError(null);
  };

  const totalWords = draft.scenes.reduce((n, s) => n + (s.lines ?? []).reduce((m, l) => m + countWords(l.text ?? ""), 0), 0);

  return (
    <div>
      <div className="sticky-bar">
        <button className="primary" onClick={save} disabled={saving || (!dirty && !raw)}>
          {saving ? "Saving…" : "Save and validate"}
        </button>
        <button onClick={discard} disabled={!dirty && !raw}>
          Discard
        </button>
        <button onClick={toggleRaw}>{raw ? "Back to table" : "Raw JSON"}</button>
        <span className="muted small">
          {draft.scenes.length} scenes · {totalWords} spoken words · ~{(totalWords / 140).toFixed(1)} min at 140 wpm{dirty ? " · unsaved changes" : ""}
        </span>
        {error && <span className="error">{error}</span>}
        {rawError && <span className="error">JSON: {rawError}</span>}
      </div>

      {validation && (
        <div className={`notice ${validation.ok ? (validation.warnings.length ? "warn" : "ok") : "bad"}`}>
          <strong>{validation.ok ? "Validator passed" : "Validator found errors"}</strong>
          {validation.errors.map((e, i) => (
            <div key={`e${i}`}>ERROR: {e}</div>
          ))}
          {validation.warnings.map((w, i) => (
            <div key={`w${i}`}>warn: {w}</div>
          ))}
          <details>
            <summary className="small">Full output</summary>
            <pre className="mono">{validation.output}</pre>
          </details>
        </div>
      )}

      {raw ? (
        <textarea
          className="json"
          value={rawText}
          onChange={(e) => {
            setRawText(e.target.value);
            setDirty(true);
          }}
          spellCheck={false}
        />
      ) : (
        draft.scenes.map((scene, si) => (
          <div key={`${scene.id}-${si}`} className="scene-card">
            <div className="scene-head">
              <span className="idx">{si + 1}</span>
              <input
                value={scene.label ?? ""}
                placeholder="label"
                onChange={(e) =>
                  update((ep) => {
                    ep.scenes[si].label = e.target.value;
                    return ep;
                  })
                }
              />
              <span className="mono muted">{scene.id}</span>
              <span className="type">{scene.type}</span>
              <span className="chips">
                {(scene.characters ?? []).map((c) => (
                  <span key={c} className="chip blue">
                    {c}
                  </span>
                ))}
              </span>
              <span style={{flex: 1}} />
              <button className="sm" onClick={() => addLine(si)}>
                + line
              </button>
            </div>
            <table className="lines">
              <tbody>
                {(scene.lines ?? []).map((line, li) => (
                  <tr key={li}>
                    <td className="col-speaker">
                      <select value={line.speaker} onChange={(e) => setLine(si, li, {speaker: e.target.value})}>
                        {(cast.includes(line.speaker) ? cast : [line.speaker, ...cast]).map((c) => (
                          <option key={c} value={c}>
                            {c}
                          </option>
                        ))}
                      </select>
                      <div className="words">{countWords(line.text ?? "")} words</div>
                    </td>
                    <td>
                      <textarea value={line.text ?? ""} onChange={(e) => setLine(si, li, {text: e.target.value})} rows={Math.max(1, Math.ceil((line.text ?? "").length / 90))} />
                      {line.audio ? <div className="words">recorded: {line.audio}</div> : null}
                    </td>
                    <td className="col-expr">
                      <select value={line.expression ?? "neutral"} onChange={(e) => setLine(si, li, {expression: e.target.value})}>
                        {EXPRESSIONS.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="col-gest">
                      <select value={line.gesture ?? "neutral"} onChange={(e) => setLine(si, li, {gesture: e.target.value})}>
                        {GESTURES.map((x) => (
                          <option key={x} value={x}>
                            {x}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="col-actions">
                      <div style={{display: "flex", flexDirection: "column", gap: 2}}>
                        <button className="ghost sm" title="Move up" onClick={() => moveLine(si, li, -1)}>
                          ↑
                        </button>
                        <button className="ghost sm" title="Move down" onClick={() => moveLine(si, li, 1)}>
                          ↓
                        </button>
                        <button className="ghost sm" title="Remove line" onClick={() => removeLine(si, li)}>
                          ×
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(scene.lines ?? []).length === 0 && (
                  <tr>
                    <td className="muted small" colSpan={5}>
                      No lines (silent scene).
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        ))
      )}
      {!raw && draft.scenes.length === 0 && <div className="notice">No scenes yet. Use Raw JSON to paste a script, or wait for the draft job to finish.</div>}
    </div>
  );
};
