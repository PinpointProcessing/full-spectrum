# Per-event numbers for the 'unit' render (render.js's scripted timeline): loudness overall and in a phone speaker's band,
# where the energy sits, how long it rings. python3 -I ev.py IN.wav
import sys, numpy as np, wave
w = wave.open(sys.argv[1]); sr = w.getframerate(); n = w.getnframes()
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64).reshape(-1, 2).mean(axis=1) / 32767
ev = []; t = .3
def step(d, lab): global t; ev.append((t, lab)); t += d
for g in ['m1', 'bar', 'spring', 'kar', 'mp40', 'ksnip', 'mg']: step(1.4, g + '-near'); step(1.8, g + '-far')
for k in range(3): step(.9, 'm1-8th' + str(k))
for k in ['frag', 'mortar', 'art', 'tank', 'big', 'rocket']: step(3, 'x-' + k)
step(3.5, 'x-far'); step(3, 'x-sea'); step(3, 'cannon'); step(3, 'whistle-art'); step(3, 'whistle-mort')
for k in range(6): step(.18, 'crack' + str(k))
t += 1
for m in ['sand', 'sand2', 'stone', 'stone2', 'wood', 'metal']: step(.5, 'hit-' + m)
ev.append((t, 'end'))
def band(s, lo, hi):
    S = np.fft.rfft(s); f = np.fft.rfftfreq(len(s), 1 / sr); S[(f < lo) | (f > hi)] = 0; return np.fft.irfft(S, len(s))
def l100(s):
    h = int(.05 * sr); k = max(1, len(s) // h); r = np.sqrt(np.mean(s[:k * h].reshape(k, h) ** 2, axis=1)); return 20 * np.log10(r.max() + 1e-9), r
print(f"{'event':14s} {'start':>6s} {'peak':>6s} {'full50':>7s} {'phone50':>7s} {'<150':>5s} {'150-600':>7s} {'.6-3k':>6s} {'>3k':>5s} {'ring(-30)':>9s}")
for i in range(len(ev) - 1):
    t0, lab = ev[i]; t1 = ev[i + 1][0]; s = x[int(t0 * sr):int(t1 * sr)]
    if not len(s): continue
    full, r = l100(s); ph, _ = l100(band(s, 300, 6000))
    S = np.abs(np.fft.rfft(s)) ** 2; f = np.fft.rfftfreq(len(s), 1 / sr); tot = S.sum() + 1e-12
    b = [S[(f >= a) & (f < c)].sum() / tot * 100 for a, c in [(0, 150), (150, 600), (600, 3000), (3000, 22050)]]
    db = 20 * np.log10(r + 1e-9); above = np.nonzero(db > db.max() - 30)[0]; ring = (above[-1] - above[0] + 1) * .05 if len(above) else 0
    print(f"{lab:14s} {t0:6.2f} {20*np.log10(np.abs(s).max()+1e-9):6.1f} {full:7.1f} {ph:7.1f} {b[0]:5.0f} {b[1]:7.0f} {b[2]:6.0f} {b[3]:5.0f} {ring:9.2f}")
