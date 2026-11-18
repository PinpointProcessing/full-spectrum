# Each take in a sounds/guns kind: its loudest 50 ms overall and in a phone speaker's band (300 Hz-6 kHz), and where its energy sits.
# python3 -I clipstat.py GUNSDIR [kinds...]
import sys, os, json, subprocess, numpy as np
D = sys.argv[1]; man = json.load(open(os.path.join(D, 'manifest.json'))); sr = 44100
kinds = sys.argv[2:] or list(man)
def band(s, lo, hi):
    S = np.fft.rfft(s); f = np.fft.rfftfreq(len(s), 1 / sr); S[(f < lo) | (f > hi)] = 0; return np.fft.irfft(S, len(s))
def l50(s):
    h = int(.05 * sr); k = max(1, len(s) // h); return 20 * np.log10(np.sqrt(np.mean(s[:k * h].reshape(k, h) ** 2, axis=1)).max() + 1e-9)
for k in kinds:
    x = np.frombuffer(subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(D, k + '.mp3'), '-f', 'f32le', '-ac', '1', '-ar', str(sr), '-'], capture_output=True).stdout, dtype=np.float32).astype(float)
    for i, (t, d) in enumerate(man[k]):
        s = x[int(t * sr):int((t + d) * sr)]
        S = np.abs(np.fft.rfft(s)) ** 2; f = np.fft.rfftfreq(len(s), 1 / sr); tot = S.sum() + 1e-12
        b = [S[(f >= a) & (f < c)].sum() / tot * 100 for a, c in [(0, 150), (150, 600), (600, 3000), (3000, 22050)]]
        print(f"{k:8s}{i} {d:5.2f}s full50 {l50(s):6.1f} phone50 {l50(band(s,300,6000)):6.1f}  <150 {b[0]:3.0f} 150-600 {b[1]:3.0f} .6-3k {b[2]:3.0f} >3k {b[3]:3.0f}")
