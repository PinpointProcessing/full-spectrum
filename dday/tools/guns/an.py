# Analyse an offline render: overall levels, a loudness curve and a spectrogram picture with a time axis.
# python3 -I an.py IN.wav OUT.png [t0 t1 label ...]   (optional windows to report)
import sys, numpy as np, wave
from PIL import Image, ImageDraw
w = wave.open(sys.argv[1]); sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels()
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64).reshape(-1, ch) / 32767
m = x.mean(axis=1)
pk = np.abs(x).max(); rms = np.sqrt(np.mean(m ** 2))
clip = int(np.sum(np.abs(x) > .995))
hop = int(.05 * sr); nf = len(m) // hop
fr = np.sqrt(np.mean(m[:nf * hop].reshape(nf, hop) ** 2, axis=1) + 1e-12); db = 20 * np.log10(fr)
print(f'len {len(m)/sr:.1f}s peak {20*np.log10(pk+1e-9):.1f} dBFS  rms {20*np.log10(rms+1e-9):.1f} dBFS  clipped samples {clip}  50ms-rms p10 {np.percentile(db,10):.1f} p50 {np.percentile(db,50):.1f} p95 {np.percentile(db,95):.1f} max {db.max():.1f}  silent(<-60) {np.mean(db<-60)*100:.0f}%')
L = x[:, 0]; R = x[:, 1]; print(f'L/R rms {20*np.log10(np.sqrt(np.mean(L**2))+1e-9):.1f} / {20*np.log10(np.sqrt(np.mean(R**2))+1e-9):.1f}')
# windows
a = sys.argv[3:]
for i in range(0, len(a), 3):
    t0, t1, lab = float(a[i]), float(a[i + 1]), a[i + 2]; s = m[int(t0 * sr):int(t1 * sr)]
    if not len(s): continue
    sp = np.abs(np.fft.rfft(s * np.hanning(len(s)))) ** 2; f = np.fft.rfftfreq(len(s), 1 / sr)
    cen = (sp * f).sum() / (sp.sum() + 1e-12); low = sp[f < 200].sum() / (sp.sum() + 1e-12); hi = sp[f > 4000].sum() / (sp.sum() + 1e-12)
    S2 = np.fft.rfft(s); S2[(f < 300) | (f > 6000)] = 0; b = np.fft.irfft(S2, len(s)); hh = int(.1 * sr); k = max(1, len(b) // hh)
    ph = 20 * np.log10(np.sqrt(np.mean(b[:k * hh].reshape(k, hh) ** 2, axis=1)).max() + 1e-9)   # (the loudest 100 ms in what a phone's speaker plays, 300 Hz-6 kHz)
    S2 = np.fft.rfft(s); b2 = np.fft.irfft(S2, len(s)); full = 20 * np.log10(np.sqrt(np.mean(b2[:k * hh].reshape(k, hh) ** 2, axis=1)).max() + 1e-9)
    print(f'{lab:12s} {t0:6.2f}-{t1:6.2f} loud100 {full:6.1f} phone100 {ph:6.1f} peak {20*np.log10(np.abs(s).max()+1e-9):6.1f} rms {20*np.log10(np.sqrt(np.mean(s**2))+1e-9):6.1f}  centroid {cen:6.0f} Hz  <200Hz {low*100:4.0f}%  >4k {hi*100:4.0f}%')
# picture: spectrogram (log freq) over a loudness curve
W = min(2400, max(800, int(len(m) / sr * 40))); H = 260
nfft = 2048; step = max(1, (len(m) - nfft) // W)
cols = []
win = np.hanning(nfft)
for i in range(W):
    s = m[i * step:i * step + nfft]
    if len(s) < nfft: s = np.pad(s, (0, nfft - len(s)))
    cols.append(np.abs(np.fft.rfft(s * win)))
S = np.array(cols).T; f = np.fft.rfftfreq(nfft, 1 / sr)
fl = np.geomspace(30, 20000, H); idx = np.searchsorted(f, fl).clip(0, len(f) - 1)
img = 20 * np.log10(S[idx] + 1e-9); img = np.clip((img - img.max() + 90) / 90, 0, 1)[::-1]
rgb = np.stack([np.clip(img * 3, 0, 1), np.clip(img * 3 - 1, 0, 1), np.clip(img * 3 - 2, 0, 1)], -1)
pic = Image.new('RGB', (W, H + 140), 'white'); pic.paste(Image.fromarray((rgb * 255).astype(np.uint8)), (0, 0))
d = ImageDraw.Draw(pic)
for k in range(W):   # 50 ms rms curve, -60..0 dBFS
    t = k / W * len(m) / sr; j = min(nf - 1, int(t / .05)); y = H + 120 - int((db[j] + 60) / 60 * 110)
    d.line([(k, H + 120), (k, max(H + 10, y))], fill=(60, 90, 160))
for sec in range(0, int(len(m) / sr) + 1):
    X = int(sec / (len(m) / sr) * W); d.line([(X, H), (X, H + 8)], fill='black')
    if sec % 5 == 0: d.text((X + 2, H + 122), str(sec), fill='black')
d.line([(0, H + 120 - int(40 / 60 * 110)), (W, H + 120 - int(40 / 60 * 110))], fill=(200, 80, 80))   # -20 dBFS
pic.save(sys.argv[2])
