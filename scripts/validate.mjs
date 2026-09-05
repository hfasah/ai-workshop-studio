// Validates episodes/<id>/episode.json against the spec. Usage: node scripts/validate.mjs ep001
import {CHARACTERS, loadEpisode, parseArgs} from "./lib.mjs";
const args = parseArgs(process.argv.slice(2));
const id = args._[0];
if (!id) { console.error("Usage: node scripts/validate.mjs <episodeId>"); process.exit(1); }
const e = loadEpisode(id);
const errors = [], warnings = [];
const TYPES = ["title", "statement", "bullets", "steps", "flow", "diagram", "examples", "demo", "compare", "dialogue", "screen", "code", "outro"];
const EXPR = ["neutral", "happy", "confident", "serious", "confused", "surprised"];
const GEST = ["neutral", "explain", "point_left", "point_right", "warning"];
const UI = ["chat", "calendar", "email", "approval", "list", "text"];
const cast = Object.keys(CHARACTERS).filter((k) => !k.startsWith("_"));
const need = {title: ["title"], statement: ["text"], bullets: ["title", "items"], steps: ["title", "steps"], flow: ["nodes"], diagram: ["nodes"], examples: ["items"], demo: ["steps"], compare: ["left", "right"], dialogue: [], screen: ["src"], code: ["code"], outro: ["line", "emphasis"]};

if (e.id !== id) errors.push(`id "${e.id}" does not match folder "${id}"`);
if (!e.title) errors.push("missing title");
if (!Number.isInteger(e.episode)) errors.push("episode must be an integer");
if (!Array.isArray(e.scenes) || e.scenes.length === 0) errors.push("no scenes");
const ids = new Set();
let words = 0;
for (const sc of e.scenes ?? []) {
  const at = `scene "${sc.id}"`;
  if (!sc.id) errors.push("scene without id");
  if (ids.has(sc.id)) errors.push(`duplicate scene id ${sc.id}`);
  ids.add(sc.id);
  if (!TYPES.includes(sc.type)) errors.push(`${at}: unknown type "${sc.type}"`);
  for (const c of sc.characters ?? []) if (!cast.includes(c)) errors.push(`${at}: unknown character "${c}"`);
  if ((sc.characters ?? []).length > 3) warnings.push(`${at}: more than 3 characters on stage`);
  for (const k of need[sc.type] ?? []) if (sc.onScreen?.[k] === undefined) errors.push(`${at}: onScreen.${k} required for type ${sc.type}`);
  if (sc.type === "demo") {
    for (const [i, st] of (sc.onScreen?.steps ?? []).entries()) {
      if (!st.title) errors.push(`${at}: demo step ${i + 1} needs a title`);
      if (st.ui && !UI.includes(st.ui.kind)) errors.push(`${at}: demo step ${i + 1} unknown ui.kind "${st.ui.kind}"`);
    }
    if ((sc.onScreen?.steps ?? []).length !== (sc.lines ?? []).length) warnings.push(`${at}: ${sc.onScreen?.steps?.length} demo steps vs ${sc.lines?.length} lines (steps will spread evenly)`);
  }
  if (sc.type === "flow" && (sc.onScreen?.nodes ?? []).length !== (sc.lines ?? []).length) warnings.push(`${at}: ${sc.onScreen?.nodes?.length} flow nodes vs ${sc.lines?.length} lines`);
  if (sc.type === "diagram") {
    const ids = new Set((sc.onScreen?.nodes ?? []).map((n) => n.id));
    for (const n of sc.onScreen?.nodes ?? []) if (!n.id || !n.label || n.col === undefined || n.row === undefined) errors.push(`${at}: diagram nodes need id, label, col, row`);
    for (const e of sc.onScreen?.edges ?? []) if (!ids.has(e.from) || !ids.has(e.to)) errors.push(`${at}: diagram edge ${e.from}→${e.to} references an unknown node`);
  }
  if (sc.type === "examples" && (sc.onScreen?.items ?? []).some((it) => !it.label)) errors.push(`${at}: examples items need a label`);
  if (sc.type === "screen" && sc.onScreen?.src && !/^screen\//.test(sc.onScreen.src)) warnings.push(`${at}: screen src should live under public/screen/`);
  for (const [i, l] of (sc.lines ?? []).entries()) {
    const lat = `${at} line ${i + 1}`;
    if (!cast.includes(l.speaker)) errors.push(`${lat}: unknown speaker "${l.speaker}"`);
    if (!l.text || !l.text.trim()) errors.push(`${lat}: empty text`);
    if (l.expression && !EXPR.includes(l.expression)) errors.push(`${lat}: unknown expression "${l.expression}"`);
    if (l.gesture && !GEST.includes(l.gesture)) errors.push(`${lat}: unknown gesture "${l.gesture}"`);
    const n = (l.text ?? "").split(/\s+/).filter(Boolean).length;
    words += n;
    if (n > 40) warnings.push(`${lat}: ${n} words, split it`);
    if (/\d/.test(l.text ?? "")) warnings.push(`${lat}: digits in spoken text, write numbers as words`);
    if (/[*_#`]/.test(l.text ?? "")) errors.push(`${lat}: markdown characters in spoken text`);
  }
}
const last = e.scenes?.at(-1);
const lastLine = last?.lines?.at(-1);
if (last?.type !== "outro") errors.push("last scene must be an outro");
if (!lastLine || lastLine.speaker !== "tanyi" || !/Don't just use AI\. Build it to work reliably\./.test(lastLine.text)) errors.push('closing line must be spoken by tanyi and contain "Don\'t just use AI. Build it to work reliably."');
if (!e.scenes?.some((s) => (s.characters ?? []).includes("gatekeeper"))) warnings.push("no gatekeeper scene (safety lesson)");
if (!e.disclosure) warnings.push('no "disclosure" (fictional teaching scenario or verified case study) — required for build-story episodes');
for (const c of e.cuts ?? []) for (const sid of c.scenes ?? []) if (!ids.has(sid)) errors.push(`cut "${c.id}": unknown scene "${sid}"`);
const minutes = words / 140;
if (e.format === "short") {
  if (words > 160) warnings.push(`short format: ${words} words, target 110–150`);
  if ((e.scenes ?? []).length > 6) warnings.push(`short format: ${e.scenes.length} scenes, target 5`);
  if (e.scenes?.some((s) => s.type === "title")) warnings.push("short format: drop the title scene, the claim goes first");
  for (const sc of e.scenes ?? []) for (const [i, l] of (sc.lines ?? []).entries()) if ((l.text ?? "").split(/\s+/).filter(Boolean).length > 22) warnings.push(`short format: scene "${sc.id}" line ${i + 1} over 20 words`);
}
console.log(`${id}: ${e.scenes?.length ?? 0} scenes, ${words} spoken words, ~${minutes.toFixed(1)} min at 140 wpm`);
for (const w of warnings) console.log("  warn:", w);
for (const er of errors) console.log("  ERROR:", er);
if (e.format !== "short" && (minutes < 1.5 || minutes > 4.5)) console.log("  warn: outside the 2–4 minute target");
if (e.format === "short" && (minutes < 0.6 || minutes > 1.2)) console.log("  warn: short format outside the 45–60 second target");
process.exit(errors.length ? 1 : 0);
