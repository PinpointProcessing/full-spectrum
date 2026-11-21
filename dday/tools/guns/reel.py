# The demo reel: pieces of offline renders one after another with short crossfades, levelled together, as an mp3.
# python3 -I reel.py OUT.mp3 FILE:T0:LEN[:GAIN_DB] ...
import sys, wave, subprocess, numpy as np
sr = 44100; XF = .7
def load(p):
    w = wave.open(p); return np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float64).reshape(-1, 2) / 32767
out = None
for spec in sys.argv[2:]:
    f, t0, L, *g = spec.split(':'); x = load(f)[int(float(t0) * sr):int((float(t0) + float(L)) * sr)].copy()
    if g: x *= 10 ** (float(g[0]) / 20)
    n = int(XF * sr); r = np.linspace(0, 1, n)[:, None]
    if out is None: x[:n] *= r; out = x
    else: out[-n:] = out[-n:] * (1 - r) + x[:n] * r; out = np.concatenate([out, x[n:]])
n = int(1.2 * sr); out[-n:] *= np.linspace(1, 0, n)[:, None]
out *= 10 ** (-1 / 20) / np.abs(out).max()
pcm = (out * 32767).astype(np.int16).tobytes()
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 's16le', '-ar', str(sr), '-ac', '2', '-i', '-', '-c:a', 'libmp3lame', '-b:a', '160k', sys.argv[1]], input=pcm, check=True)
print('wrote', sys.argv[1], round(len(out) / sr, 1), 's')
