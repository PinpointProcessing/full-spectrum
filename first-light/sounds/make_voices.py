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
# Only the two anchors are voiced. Ruth and the survivors are text on screen (Bryan found their voices annoying, 2026-11-24).
# lines that break off or are shouted: read in pieces (text, speed factor, pause after in seconds, pitch factor), since one flat reading sounded robotic (Bryan)
PIECES = {
 # Bryan's wording (2026-11-24). The '@' pieces are finished takes kept in sounds/takes/ (made with the Chatterbox model, see CREDITS.md):
 # Kokoro cannot do fright, so only the calm first half of Hal's line is read here.
 'If you have been bitten, you must... Huh? What was that?': [('If you have been bitten, you must', 1.0, .5, 1.0), ('@takes/hal_huh.wav', 1, 0, 1)],
 'Hal? HAL! THE STUDIO DOOR!': [('@takes/denise_door.wav', 1, 0, 1)],
}
import numpy as np
k = Kokoro(os.path.join(md, 'kokoro-v1.0.onnx'), os.path.join(md, 'voices-v1.0.bin'))
for f in os.listdir(here):
    if f.startswith('v_') and f.endswith('.mp3'): os.remove(os.path.join(here, f))
out = {}
for i, (who, text, limit) in enumerate(lines):
    voice, speed = VOICE[who]
    while True:
        lang = 'en-gb' if voice[0] == 'b' else 'en-us'
        if text in PIECES:
            parts = []
            for t, f, gap, pitch in PIECES[text]:
                if t[0] == '@':
                    b, fsr = sf.read(os.path.join(here, t[1:]), dtype='float32'); sr = 24000
                    assert fsr == sr, 'takes are 24 kHz mono'
                else:
                    b, sr = k.create(t, voice=voice, speed=speed * f * pitch, lang=lang)      # read a touch slower, then played faster: that raises the pitch
                    b = np.interp(np.arange(0, len(b), pitch), np.arange(len(b)), b).astype('float32')
                    nz = np.nonzero(np.abs(b) > .01)[0]; b = b[max(0, nz[0] - 200):nz[-1] + 800] if len(nz) else b
                parts += [b, np.zeros(int(sr * gap), 'float32')]
            a = np.concatenate(parts)
        else: a, sr = k.create(text.replace('’', "'"), voice=voice, speed=speed, lang=lang)
        if limit is None or len(a) / sr <= limit + .25 or speed > 1.5 or text in PIECES: break
        speed += .06
    key = 'v_%s%d' % (who, i)
    with tempfile.NamedTemporaryFile(suffix='.wav') as w:
        sf.write(w.name, a, sr)
        subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', w.name, '-af', 'silenceremove=start_periods=1:start_threshold=-50dB,loudnorm=I=-17:TP=-1.5', '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '40k', os.path.join(here, key + '.mp3')])
    out[text] = key
    print('%-8s %-10s speed %.2f  %.1fs%s  %s' % (who, voice, speed, len(a) / sr, '' if limit is None else ' (slot %.1f)' % limit, text[:60]))
json.dump(out, open(os.path.join(here, 'voices.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
