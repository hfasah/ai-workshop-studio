"""Cut a voice reference clip for cloning.
Usage: .venv/bin/python scripts/reference.py <character> --from 7.0 --to 17.3
Reads public/characters/<id>/voice/source.wav (+ source.transcript.json from whisper),
snaps to word boundaries, writes reference.wav (24 kHz mono) and reference.txt.
"""
import argparse, json, subprocess, pathlib
ap = argparse.ArgumentParser()
ap.add_argument("character"); ap.add_argument("--from", dest="start", type=float, required=True); ap.add_argument("--to", dest="end", type=float, required=True)
a = ap.parse_args()
d = pathlib.Path("public/characters") / a.character / "voice"
tr = json.load(open(d / "source.transcript.json"))
words = [w for s in tr["segments"] for w in s.get("words", [])]
sel = [w for w in words if w["start"] >= a.start - 0.05 and w["end"] <= a.end + 0.05]
if not sel:
    raise SystemExit("no words in range")
t0, t1 = max(0, sel[0]["start"] - 0.15), sel[-1]["end"] + 0.25
text = "".join(w["word"] for w in sel).strip()
subprocess.run(["ffmpeg", "-y", "-loglevel", "error", "-i", str(d / "source.wav"), "-ss", f"{t0:.3f}", "-to", f"{t1:.3f}", "-ac", "1", "-ar", "24000", "-af", "loudnorm=I=-18:TP=-2", str(d / "reference.wav")], check=True)
(d / "reference.txt").write_text(text)
print(f"reference.wav {t1 - t0:.2f}s\n{text}")
