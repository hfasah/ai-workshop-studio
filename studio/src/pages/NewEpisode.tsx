import {useEffect, useState, type FormEvent} from "react";
import {useNavigate} from "react-router-dom";
import {api, type EngineInfo, type Format, type Meta} from "../api";
import {EngineLine} from "../components/EngineLine";

export const NewEpisode = () => {
  const navigate = useNavigate();
  const [meta, setMeta] = useState<Meta | null>(null);
  const [topic, setTopic] = useState("");
  const [storyline, setStoryline] = useState("");
  const [format, setFormat] = useState<Format>("build");
  const [auto, setAuto] = useState(true);
  const [episode, setEpisode] = useState<number>(0);
  const [audience, setAudience] = useState("");
  const [minutes, setMinutes] = useState(3.5);
  const [setting, setSetting] = useState("");
  const [story, setStory] = useState("");
  const [cutSeconds, setCutSeconds] = useState(45);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [engine, setEngine] = useState<EngineInfo | null>(null);

  useEffect(() => {
    api
      .meta()
      .then((m) => {
        setMeta(m);
        setEpisode(m.nextEpisode);
        setAudience(m.audience);
        setMinutes(m.minutes);
        setCutSeconds(m.cutSeconds);
      })
      .catch((e) => setError(String(e.message ?? e)));
  }, []);

  const submit = async (ev: FormEvent) => {
    ev.preventDefault();
    if (!topic.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const r = await api.createEpisode({topic: topic.trim(), episode, audience, minutes: format === "short" ? 1.25 : minutes, setting, story, cutSeconds, storyline: storyline.trim(), format, auto});
      navigate(`/ep/${r.id}?job=${r.job.id}&tab=${auto ? "build" : "script"}`);
    } catch (e) {
      setError(String((e as Error).message ?? e));
      setBusy(false);
    }
  };

  const concept = meta?.storyBank.find((s) => s.name === story);
  const short = format === "short";

  return (
    <>
      <div className="page-head">
        <div>
          <div className="kicker">Gate 1 · Brief</div>
          <h1>New episode</h1>
          <div className="muted">Type a topic or your own storyline. Creates episodes/epNNN with a brief and status.json, drafts episode.json with the selected engine (Ollama on this machine at $0 by default, or the Claude CLI, metered at roughly $0.30 to $1), then, if auto-produce is on, builds voice, captions and preview MP4s so the story is ready to watch and download.</div>
        </div>
      </div>

      <form className="card" onSubmit={submit} style={{maxWidth: 860}}>
        <EngineLine onChange={setEngine} />
        {engine && !engine.ready && (
          <div className="notice warn">
            {engine.engine === "ollama" ? `The local engine is not ready: ${engine.ollama.reachable ? `the model ${engine.ollamaModel} is not pulled` : `Ollama is not reachable at ${engine.ollamaUrl}`}. In a terminal: ${engine.fix}` : "The claude CLI was not found on PATH. Switch the engine to Ollama, or install Claude Code."} The episode folder will still be created, but the script draft will fail; you can write episode.json by hand.
          </div>
        )}
        <label className="field">
          <span>Topic *</span>
          <input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="MCP vs API" required autoFocus />
        </label>
        <label className="field">
          <span>Storyline or notes (optional)</span>
          <textarea value={storyline} onChange={(e) => setStoryline(e.target.value)} rows={5} placeholder={"Your own story idea, the characters' situation, a real problem you saw, anything the writer should follow.\nExample: Amara runs a small bakery ordering system in Douala. She asks whether the assistant needs an API or an MCP server. Kito wires both and the Hallucinator invents an endpoint that does not exist."} />
          <div className="hint">Sent to the writer as "Hippolyte's storyline (follow it; verify setting facts)". Leave empty to let the writer propose the story.</div>
        </label>
        <div className="grid-2">
          <label className="field">
            <span>Format</span>
            <select value={format} onChange={(e) => setFormat(e.target.value as Format)}>
              <option value="build">Build story (default, 3–4 min)</option>
              <option value="short">Short lesson (60–90 s, concept format)</option>
            </select>
            <div className="hint">{short ? "Hook, explanation, example, action, closing: about 150 to 200 words in 5 or 6 scenes." : "Nine beats from the series bible, about 140 words per minute."}</div>
          </label>
          <label className="field">
            <span>Episode number</span>
            <input type="number" min={1} value={episode || ""} onChange={(e) => setEpisode(Number(e.target.value))} />
          </label>
        </div>
        <div className="grid-2">
          <label className="field">
            <span>Target minutes</span>
            <input type="number" min={1} max={8} step={0.5} value={short ? 1.25 : minutes} onChange={(e) => setMinutes(Number(e.target.value))} disabled={short} />
            {short && <div className="hint">Fixed by the short lesson format.</div>}
          </label>
          <label className="field">
            <span>Vertical cut seconds</span>
            <input type="number" min={15} max={120} value={cutSeconds} onChange={(e) => setCutSeconds(Number(e.target.value))} />
          </label>
        </div>
        <label className="field">
          <span>Audience</span>
          <input value={audience} onChange={(e) => setAudience(e.target.value)} />
        </label>
        <label className="field">
          <span>African setting hint (optional)</span>
          <input value={setting} onChange={(e) => setSetting(e.target.value)} placeholder="Cameroon, cocoa cooperative near Kumba, English and Pidgin" />
          <div className="hint">Treated as a proposal to verify by research; the script will not name anything the hint does not support.</div>
        </label>
        <label className="field">
          <span>Story bank concept (optional)</span>
          <select value={story} onChange={(e) => setStory(e.target.value)}>
            <option value="">none</option>
            {meta?.storyBank.map((s) => (
              <option key={s.name} value={s.name}>
                {s.name}
              </option>
            ))}
          </select>
        </label>
        {concept && (
          <div className="notice">
            <strong>{concept.name}</strong> · {concept.people}
            <br />
            Builds: {concept.build}
            <br />
            Lesson: {concept.lesson}
            <br />
            Reality that changes the design: {concept.reality}
          </div>
        )}
        <label className="check">
          <input type="checkbox" checked={auto} onChange={(e) => setAuto(e.target.checked)} />
          <span>
            <strong>Produce automatically after drafting</strong> (voice + preview render, both formats + cut)
            <div className="hint">One job: script → voice → captions → preview MP4s → cut preview. Gates stay pending as review records; you decide what to publish in the Publish tab.</div>
          </span>
        </label>
        {error && <div className="notice bad">{error}</div>}
        <div className="btn-row">
          <button className="primary" type="submit" disabled={busy || !topic.trim()}>
            {busy ? "Creating…" : auto ? "Create episode, draft and produce" : "Create episode and draft script"}
            {engine ? (engine.engine === "ollama" ? " · $0" : " · metered") : ""}
          </button>
          <span className="muted small">Writes episodes/ep{String(episode || 0).padStart(3, "0")}/</span>
        </div>
      </form>
    </>
  );
};
