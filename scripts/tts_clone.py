"""Batch voice cloning with F5-TTS (MLX) + Whisper word alignment.
Usage: .venv/bin/python scripts/tts_clone.py jobs.json
jobs.json: {"ref_audio": "...wav", "ref_text": "...", "speed": 1.0, "jobs": [{"text": "...", "out": "path.wav"}]}
Writes each out wav (24 kHz) and a sibling .whisper.json with word timings.
"""
import json, sys, pathlib, time, warnings
warnings.filterwarnings("ignore")
import mlx.core as mx
import soundfile as sf
from f5_tts_mlx.cfm import F5TTS
from f5_tts_mlx.utils import convert_char_to_pinyin
import mlx_whisper

SR = 24000
HOP = 256
spec = json.load(open(sys.argv[1]))
model = F5TTS.from_pretrained("lucasnewman/f5-tts-mlx")
ref, sr = sf.read(spec["ref_audio"])
assert sr == SR, "reference must be 24 kHz"
ref = mx.array(ref, dtype=mx.float32)
rms = mx.sqrt(mx.mean(mx.square(ref)))
if rms < 0.1:
    ref = ref * 0.1 / rms
ref_text = spec["ref_text"].strip()
speed = float(spec.get("speed", 1.0))
ref_dur = ref.shape[0] / SR

def synth(text):
    # duration heuristic from f5-tts-mlx: proportional to byte length of text vs reference text
    ref_len = len(ref_text.encode("utf-8"))
    gen_len = len(text.encode("utf-8"))
    frames = ref.shape[0] // HOP
    dur_frames = int(frames + frames / ref_len * gen_len / speed)
    full = convert_char_to_pinyin([ref_text + " " + text])
    wave, _ = model.sample(mx.expand_dims(ref, axis=0), text=full, duration=dur_frames, steps=16, method="rk4", speed=speed, cfg_strength=2.0, sway_sampling_coef=-1.0, seed=int(spec.get("seed", 1234)))
    wave = wave[ref.shape[0]:]
    mx.eval(wave)
    return wave

for j in spec["jobs"]:
    t = time.time()
    out = pathlib.Path(j["out"])
    out.parent.mkdir(parents=True, exist_ok=True)
    # split long text into sentences to keep prosody stable
    import re
    sents = [s.strip() for s in re.split(r"(?<=[.!?])\s+", j["text"]) if s.strip()]
    pieces = []
    for s in sents:
        pieces.append(synth(s))
        pieces.append(mx.zeros((int(SR * 0.28),)))
    wave = mx.concatenate(pieces)[: -int(SR * 0.28)] if len(pieces) > 1 else pieces[0]
    sf.write(str(out), wave, SR)
    r = mlx_whisper.transcribe(str(out), path_or_hf_repo="mlx-community/whisper-large-v3-turbo", word_timestamps=True, language="en", initial_prompt=j["text"])
    words = [{"text": w["word"].strip(), "startMs": int(w["start"] * 1000), "endMs": int(w["end"] * 1000)} for s in r["segments"] for w in s.get("words", [])]
    json.dump({"words": words, "transcript": r["text"].strip()}, open(str(out) + ".whisper.json", "w"))
    print(f"{out.name}: {wave.shape[0] / SR:.1f}s in {time.time() - t:.1f}s  | heard: {r['text'].strip()[:80]}", flush=True)
