#!/usr/bin/env python3
"""Render every spoken line in the game to sounds/v_*.mp3 with the Kokoro voice model (Apache 2.0), and write sounds/voices.json (text -> clip).
Run again whenever a line changes:  python3 first-light/sounds/make_voices.py <dir holding kokoro-v1.0.onnx and voices-v1.0.bin>
Needs: pip install kokoro-onnx soundfile, and ffmpeg. The words are always the set lines from the source; nothing is written by the model."""
import os, re, sys, json, subprocess, tempfile
import soundfile as sf
from kokoro_onnx import Kokoro
here = os.path.dirname(os.path.abspath(__file__)); src = os.path.join(here, '..', 'src'); md = sys.argv[1]
rd = lambda f: open(os.path.join(src, f), encoding='utf-8').read()
# who says what, with which voice, and how long the line may run (seconds; None = no limit)
VOICE = {'hal': ('am_michael', 1.0), 'denise': ('af_bella', 1.0), 'ruth': ('bf_emma', .95), 'walt': ('bm_george', 1.0), 'dunn': ('am_onyx', 1.0), 'jules': ('af_sky', 1.08), 'marisol': ('af_nicole', 1.0)}
lines = []
for m in re.finditer(r"\{t:[\d.]+,who:(\d),d:([\d.]+),text:'([^']*)'\}", rd('60-tv.js')): lines.append((('hal', 'denise')[int(m.group(1))], m.group(3), float(m.group(2))))
ruth = re.search(r"const RUTH_LINES=\[(.*?)\];", rd('75-script.js'), re.S).group(1)
for t in re.findall(r"'([^']*)'", ruth): lines.append(('ruth', t, None))
for m in re.finditer(r"^\s+(\w+):\{name:'[^']*'.*?line:'([^']*)'", rd('70-game.js'), re.M): lines.append((m.group(1), m.group(2), None))
k = Kokoro(os.path.join(md, 'kokoro-v1.0.onnx'), os.path.join(md, 'voices-v1.0.bin'))
for f in os.listdir(here):
    if f.startswith('v_') and f.endswith('.mp3'): os.remove(os.path.join(here, f))
out = {}
for i, (who, text, limit) in enumerate(lines):
    voice, speed = VOICE[who]
    while True:
        a, sr = k.create(text.replace('’', "'"), voice=voice, speed=speed, lang='en-gb' if voice[0] == 'b' else 'en-us')
        if limit is None or len(a) / sr <= limit + .25 or speed > 1.5: break
        speed += .06
    key = 'v_%s%d' % (who, i)
    with tempfile.NamedTemporaryFile(suffix='.wav') as w:
        sf.write(w.name, a, sr)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', w.name, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-17:TP=-1.5', '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '40k', os.path.join(here, key + '.mp3')])
    out[text] = key
    print('%-8s %-10s speed %.2f  %.1fs%s  %s' % (who, voice, speed, len(a) / sr, '' if limit is None else ' (slot %.1f)' % limit, text[:60]))
json.dump(out, open(os.path.join(here, 'voices.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
