# Version 252. loudness of an opening-sound-render.js wav, every half second, full band and a phone speaker's band (300 Hz to 6 kHz), with what was on screen.
# python3 -I opening-sound-levels.py IN.wav [win=0.5]
import sys, json, numpy as np, wave
w = wave.open(sys.argv[1]); sr = w.getframerate(); n = w.getnframes(); win = float(sys.argv[2]) if len(sys.argv) > 2 else .5
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64).reshape(-1, 2).mean(axis=1) / 32767
meta = json.load(open(sys.argv[1] + '.json')); T = meta['T']; marks = meta['marks']
S = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / sr); S[(f < 300) | (f > 6000)] = 0; xp = np.fft.irfft(S, len(x))
db = lambda v: 20 * np.log10(v + 1e-9)
h = int(win * sr)
def mark(t):
    best = None
    for m in marks:
        if m[0] <= t + 1e-6: best = m
    return best
for i in range(len(x) // h):
    s = x[i * h:(i + 1) * h]; p = xp[i * h:(i + 1) * h]; t = i * win; m = mark(t)
    seq = m[2] if m else None; ph = m[1] if m else '?'
    tag = ''
    if seq is not None and T.get('hush') and T['inc'] - T['hush'] <= seq < T['inc']: tag = 'QUIET'
    print(f"{t:5.1f}s  seq {('%.1f' % seq) if seq is not None else '  -  ':>5s} {ph:6s} rms {db(np.sqrt(np.mean(s**2))):6.1f}  phone {db(np.sqrt(np.mean(p**2))):6.1f}  peak {db(np.abs(s).max()):6.1f}  {tag:5s} {m[3] if m else ''}")
