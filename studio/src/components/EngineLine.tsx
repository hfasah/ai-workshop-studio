import {useCallback, useEffect, useState} from "react";
import {api, type EngineInfo, type EngineName} from "../api";

type Props = {
  compact?: boolean;
  onChange?: (info: EngineInfo) => void;
};

// "Engine" line: Ollama (local, $0, with a model dropdown from /api/engine) or the Claude CLI, plus a status dot.
// Changes are written to studio/settings.json through PUT /api/engine.
export const EngineLine = ({compact = false, onChange}: Props) => {
  const [info, setInfo] = useState<EngineInfo | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apply = useCallback(
    (i: EngineInfo) => {
      setInfo(i);
      setError(null);
      onChange?.(i);
    },
    [onChange],
  );

  const load = useCallback(() => {
    api
      .engine()
      .then(apply)
      .catch((e) => setError(String((e as Error).message ?? e)));
  }, [apply]);

  useEffect(load, [load]);

  const update = async (patch: {engine?: EngineName; ollamaModel?: string}) => {
    setBusy(true);
    try {
      apply(await api.setEngine(patch));
    } catch (e) {
      setError(String((e as Error).message ?? e));
    } finally {
      setBusy(false);
    }
  };

  if (!info) {
    return (
      <div className={`engine-line ${compact ? "compact" : ""}`}>
        <span className="label">Engine</span>
        <span className="dot" />
        <span className="small muted">{error ?? "checking…"}</span>
      </div>
    );
  }

  const models = info.ollama.models.includes(info.ollamaModel) ? info.ollama.models : [info.ollamaModel, ...info.ollama.models];
  const status =
    info.engine === "ollama"
      ? !info.ollama.reachable
        ? `Ollama not reachable at ${info.ollamaUrl}. ${info.fix}`
        : !info.ollama.modelPresent
          ? `Model not pulled: ollama pull ${info.ollamaModel}`
          : `Ollama reachable · ${info.ollamaModel} · $0`
      : info.claudeAvailable
        ? `claude on PATH${info.claudeModel ? ` · ${info.claudeModel}` : ""} · metered`
        : "The claude CLI is not on PATH";

  return (
    <div className={`engine-line ${compact ? "compact" : ""}`}>
      <span className="label">Engine</span>
      <select value={info.engine} disabled={busy || Boolean(info.overrides.engine)} onChange={(e) => update({engine: e.target.value as EngineName})} title={info.overrides.engine ? "Fixed by the LLM_ENGINE environment variable" : "Where scripts and publishing kits are written"}>
        <option value="ollama">Ollama local · $0</option>
        <option value="claude">Claude CLI · metered</option>
      </select>
      {info.engine === "ollama" && (
        <select value={info.ollamaModel} disabled={busy || Boolean(info.overrides.ollamaModel)} onChange={(e) => update({ollamaModel: e.target.value})} title={info.overrides.ollamaModel ? "Fixed by the OLLAMA_MODEL environment variable" : "Local models from ollama list"}>
          {models.map((m) => (
            <option key={m} value={m}>
              {m}
              {info.ollama.reachable && !info.ollama.models.includes(m) ? " (not pulled)" : ""}
            </option>
          ))}
        </select>
      )}
      <span className={`dot ${info.ready ? "ok" : "bad"}`} title={status} />
      <span className={`small ${info.ready ? "muted" : "warn-text"}`}>{status}</span>
      <button type="button" className="ghost sm" onClick={load} disabled={busy}>
        {busy ? "…" : "Refresh"}
      </button>
      {error && <span className="small warn-text">{error}</span>}
    </div>
  );
};
