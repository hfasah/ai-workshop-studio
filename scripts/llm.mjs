// Pluggable text generation for the Studio: a local model through Ollama ($0, default) or the Claude CLI (metered).
// Settings: studio/settings.json {engine, ollamaModel, ollamaUrl, claudeModel}; env LLM_ENGINE, OLLAMA_MODEL, OLLAMA_URL win over the file.
// Usage: const {text, json, engine, model, costUsd, durationMs} = await generate({prompt, system, json: true, maxTokens});
import {spawn, spawnSync} from "node:child_process";
import fs from "node:fs";
import http from "node:http";
import https from "node:https";
import path from "node:path";
import {ROOT, readJson, writeJson} from "./lib.mjs";

export const SETTINGS_PATH = path.join(ROOT, "studio", "settings.json");
export const ENGINES = ["ollama", "claude"];
export const DEFAULT_SETTINGS = {engine: "ollama", ollamaModel: "qwen2.5:14b", ollamaUrl: "http://localhost:11434", claudeModel: ""};

// ---------- settings ----------
export const readSettings = () => {
  let s = {};
  if (fs.existsSync(SETTINGS_PATH)) {
    try {
      s = readJson(SETTINGS_PATH);
    } catch {
      s = {};
    }
  }
  return {...DEFAULT_SETTINGS, ...s};
};

export const writeSettings = (patch) => {
  const next = {...readSettings(), ...patch};
  if (!ENGINES.includes(next.engine)) throw new Error(`engine must be one of ${ENGINES.join(", ")}`);
  if (!next.ollamaModel || typeof next.ollamaModel !== "string") throw new Error("ollamaModel must be a non-empty string");
  next.ollamaUrl = String(next.ollamaUrl || DEFAULT_SETTINGS.ollamaUrl).replace(/\/+$/, "");
  next.claudeModel = String(next.claudeModel ?? "");
  writeJson(SETTINGS_PATH, next);
  return next;
};

// Effective engine after environment overrides. `overrides` lists which settings the environment replaced.
export const getEngine = () => {
  const s = readSettings();
  const overrides = {};
  let engine = s.engine;
  if (process.env.LLM_ENGINE && ENGINES.includes(process.env.LLM_ENGINE)) overrides.engine = engine = process.env.LLM_ENGINE;
  let ollamaModel = s.ollamaModel;
  if (process.env.OLLAMA_MODEL) overrides.ollamaModel = ollamaModel = process.env.OLLAMA_MODEL;
  let ollamaUrl = s.ollamaUrl;
  if (process.env.OLLAMA_URL) overrides.ollamaUrl = ollamaUrl = process.env.OLLAMA_URL;
  ollamaUrl = String(ollamaUrl).replace(/\/+$/, "");
  const claudeModel = s.claudeModel || "";
  return {
    name: engine,
    model: engine === "ollama" ? ollamaModel : claudeModel || "default",
    ollamaModel,
    ollamaUrl,
    claudeModel,
    overrides,
    settings: s,
  };
};

// ---------- helpers ----------
const OLLAMA_FIX = (url, model) => `Fix: brew install ollama; ollama serve; ollama pull ${model}   (Ollama URL: ${url})`;

// Plain node:http request: fetch()'s undici client times out after 300 s without headers, and a non-streaming
// Ollama reply sends no headers until the whole answer is generated.
const requestJson = (url, {method = "GET", body, signal} = {}) =>
  new Promise((resolve, reject) => {
    const u = new URL(url);
    const lib = u.protocol === "https:" ? https : http;
    const payload = body === undefined ? undefined : JSON.stringify(body);
    const req = lib.request(
      u,
      {method, headers: payload ? {"Content-Type": "application/json", "Content-Length": Buffer.byteLength(payload)} : {}, timeout: 0},
      (res) => {
        let data = "";
        res.setEncoding("utf8");
        res.on("data", (d) => (data += d));
        res.on("end", () => {
          let parsed = null;
          try {
            parsed = data ? JSON.parse(data) : null;
          } catch {
            parsed = {error: data.slice(0, 500)};
          }
          resolve({status: res.statusCode ?? 0, body: parsed});
        });
      },
    );
    req.on("error", reject);
    if (signal) {
      const onAbort = () => req.destroy(new Error("aborted"));
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, {once: true});
    }
    if (payload) req.write(payload);
    req.end();
  });

// {reachable, models: [names]} for the Engine indicator. Never throws.
export const ollamaStatus = async (url = getEngine().ollamaUrl) => {
  try {
    const r = await requestJson(`${url}/api/tags`);
    if (r.status !== 200) return {reachable: false, models: [], error: `HTTP ${r.status}`};
    return {reachable: true, models: (r.body?.models ?? []).map((m) => m.name)};
  } catch (e) {
    return {reachable: false, models: [], error: e.code ?? String(e.message ?? e)};
  }
};

export const claudeAvailable = () => {
  const r = spawnSync("claude", ["--version"], {encoding: "utf8"});
  return !r.error && r.status === 0;
};

// First balanced {...} block in a text (strings and escapes respected); falls back to first "{" … last "}".
export const extractJsonBlock = (text) => {
  const start = text.indexOf("{");
  if (start < 0) return null;
  let depth = 0;
  let inString = false;
  for (let i = start; i < text.length; i++) {
    const ch = text[i];
    if (inString) {
      if (ch === "\\") i++;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") depth++;
    else if (ch === "}") {
      depth--;
      if (depth === 0) return text.slice(start, i + 1);
    }
  }
  const end = text.lastIndexOf("}");
  return end > start ? text.slice(start, end + 1) : null;
};

// ---------- engines ----------
const generateOllama = async ({prompt, system, json, maxTokens, signal, onLog}, engine) => {
  const {ollamaUrl: url, ollamaModel: model} = engine;
  const body = {
    model,
    messages: [...(system ? [{role: "system", content: system}] : []), {role: "user", content: prompt}],
    stream: false,
    format: json ? "json" : undefined,
    options: {temperature: 0.4, num_ctx: 16384, num_predict: maxTokens ?? 4096},
  };
  onLog?.(`→ ollama ${model} (${url}), ${Math.round((system?.length ?? 0) / 4)} + ${Math.round(prompt.length / 4)} tokens in, up to ${body.options.num_predict} out${json ? ", json" : ""}`);
  const t0 = Date.now();
  let r;
  try {
    r = await requestJson(`${url}/api/chat`, {method: "POST", body, signal});
  } catch (e) {
    if (e.message === "aborted") throw new Error("Generation cancelled.");
    throw new Error(`Ollama is not reachable at ${url} (${e.code ?? e.message}). ${OLLAMA_FIX(url, model)}`);
  }
  if (r.status === 404 || /not found|pull/i.test(String(r.body?.error ?? ""))) {
    throw new Error(`Ollama does not have the model "${model}" (${r.body?.error ?? `HTTP ${r.status}`}). ${OLLAMA_FIX(url, model)}`);
  }
  if (r.status !== 200) throw new Error(`Ollama returned HTTP ${r.status}: ${r.body?.error ?? JSON.stringify(r.body).slice(0, 300)}. ${OLLAMA_FIX(url, model)}`);
  const durationMs = Date.now() - t0;
  const text = r.body?.message?.content ?? "";
  const usage = {promptTokens: r.body?.prompt_eval_count ?? null, completionTokens: r.body?.eval_count ?? null};
  onLog?.(`← ${usage.completionTokens ?? "?"} tokens in ${(durationMs / 1000).toFixed(0)} s${r.body?.done_reason === "length" ? " (stopped at the token limit, output may be cut)" : ""}`);
  return {text, engine: "ollama", model, costUsd: 0, durationMs, usage, truncated: r.body?.done_reason === "length"};
};

// claude -p <prompt> --output-format json [--system-prompt …] [--model …]; the envelope carries result and total_cost_usd.
const generateClaude = ({prompt, system, maxTokens, signal, onLog}, engine) =>
  new Promise((resolve, reject) => {
    if (!claudeAvailable()) return reject(new Error(`The "claude" CLI is not available on PATH. Install Claude Code, or switch the engine to Ollama (Engine line in the Studio, or studio/settings.json).`));
    const args = ["-p", prompt, "--output-format", "json"];
    if (system) args.push("--system-prompt", system);
    if (engine.claudeModel) args.push("--model", engine.claudeModel);
    onLog?.(`→ claude -p … --output-format json${system ? " --system-prompt …" : ""}${engine.claudeModel ? ` --model ${engine.claudeModel}` : ""}`);
    const t0 = Date.now();
    const env = {...process.env, FORCE_COLOR: "0"};
    if (maxTokens) env.CLAUDE_CODE_MAX_OUTPUT_TOKENS = String(maxTokens);
    let child;
    try {
      child = spawn("claude", args, {cwd: ROOT, env, stdio: ["ignore", "pipe", "pipe"]});
    } catch (e) {
      return reject(e);
    }
    let out = "";
    let err = "";
    child.stdout.on("data", (d) => (out += d));
    child.stderr.on("data", (d) => (err += d));
    child.on("error", (e) => reject(new Error(e.code === "ENOENT" ? `"claude" is not installed or not on PATH` : String(e.message ?? e))));
    child.on("close", (code) => {
      const durationMs = Date.now() - t0;
      if (signal?.aborted) return reject(new Error("Generation cancelled."));
      if (code !== 0) return reject(new Error(`claude exited with code ${code}${err.trim() ? `: ${err.trim().slice(0, 500)}` : ""}`));
      let envelope;
      try {
        envelope = JSON.parse(out);
      } catch {
        return reject(new Error(`Could not parse the claude envelope:\n${out.slice(0, 500)}`));
      }
      if (envelope.is_error) return reject(new Error(`claude reported an error: ${String(envelope.result ?? "").slice(0, 500)}`));
      const model = engine.claudeModel || Object.keys(envelope.modelUsage ?? {})[0] || "default";
      const costUsd = Number(envelope.total_cost_usd ?? 0);
      onLog?.(`← ${model} in ${(durationMs / 1000).toFixed(0)} s, $${costUsd.toFixed(4)}`);
      resolve({text: String(envelope.result ?? ""), engine: "claude", model, costUsd, durationMs, usage: envelope.usage ?? null});
    });
    if (signal) signal.addEventListener("abort", () => child.kill("SIGTERM"), {once: true});
  });

// ---------- public API ----------
// generate({prompt, system?, json?, maxTokens?, signal?, onLog?}) → {text, json?, engine, model, costUsd, durationMs, usage, attempts}
// In json mode the first {...} block is parsed; when that fails the request is retried once with "Return only valid JSON." appended.
export const generate = async ({prompt, system, json = false, maxTokens, signal, onLog} = {}) => {
  if (!prompt || typeof prompt !== "string") throw new Error("generate: prompt is required");
  const engine = getEngine();
  const run = engine.name === "claude" ? generateClaude : generateOllama;
  const once = (p) => run({prompt: p, system, json, maxTokens, signal, onLog}, engine);
  let r = await once(prompt);
  r.attempts = 1;
  if (!json) return r;
  const parse = (text) => {
    const block = extractJsonBlock(text);
    if (!block) throw new Error("no JSON object in the reply");
    return JSON.parse(block);
  };
  try {
    r.json = parse(r.text);
    return r;
  } catch (e) {
    onLog?.(`Reply was not valid JSON (${e.message}); asking once more.`);
    const retry = await once(`${prompt}\n\nReturn only valid JSON.`);
    retry.costUsd = (r.costUsd ?? 0) + (retry.costUsd ?? 0);
    retry.durationMs = (r.durationMs ?? 0) + (retry.durationMs ?? 0);
    retry.attempts = 2;
    try {
      retry.json = parse(retry.text);
    } catch (e2) {
      throw new Error(`The model did not return valid JSON after two attempts (${e2.message}):\n${retry.text.slice(0, 500)}`);
    }
    return retry;
  }
};
