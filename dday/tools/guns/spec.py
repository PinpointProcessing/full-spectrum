# A spectrogram picture of part of a WAV (log frequency, 30 Hz-20 kHz), with a 50 ms loudness curve under it and second ticks.
# python3 -I spec.py IN.wav OUT.png T0 T1 [W]
import sys, numpy as np, wave
from PIL import Image, ImageDraw
w = wave.open(sys.argv[1]); sr = w.getframerate(); n = w.getnframes(); ch = w.getnchannels()
x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64).reshape(-1, ch).mean(axis=1) / 32767
t0, t1 = float(sys.argv[3]), float(sys.argv[4]); W = int(sys.argv[5]) if len(sys.argv) > 5 else 1600; H = 300
m = x[int(t0 * sr):int(t1 * sr)]; nfft = 1024; step = max(1, (len(m) - nfft) // W)
win = np.hanning(nfft); cols = []
for i in range(W):
    s = m[i * step:i * step + nfft]
    if len(s) < nfft: s = np.pad(s, (0, nfft - len(s)))
    cols.append(np.abs(np.fft.rfft(s * win)))
S = np.array(cols).T; f = np.fft.rfftfreq(nfft, 1 / sr); fl = np.geomspace(40, 20000, H); idx = np.searchsorted(f, fl).clip(0, len(f) - 1)
img = 20 * np.log10(S[idx] + 1e-9); img = np.clip((img + 20 - 0) / 80, 0, 1)[::-1]   # fixed scale: -60..+20 dB re 1 (comparable between pictures)
rgb = np.stack([np.clip(img * 3, 0, 1), np.clip(img * 3 - 1, 0, 1), np.clip(img * 3 - 2, 0, 1)], -1)
pic = Image.new('RGB', (W, H + 130), 'white'); pic.paste(Image.fromarray((rgb * 255).astype(np.uint8)), (0, 0)); d = ImageDraw.Draw(pic)
for fr in [100, 300, 1000, 3000, 10000]:
    y = H - 1 - int(np.searchsorted(fl, fr)); d.line([(0, y), (12, y)], fill='white'); d.text((14, y - 6), str(fr), fill='white')
hop = int(.02 * sr); nf = len(m) // hop; db = 20 * np.log10(np.sqrt(np.mean(m[:nf * hop].reshape(nf, hop) ** 2, axis=1)) + 1e-9)
for k in range(W):
    j = min(nf - 1, int(k / W * nf)); y = H + 120 - int((db[j] + 60) / 60 * 110); d.line([(k, H + 120), (k, max(H + 10, y))], fill=(60, 90, 160))
for s in np.arange(np.ceil(t0), t1 + 1e-9, 1.0):
    X = int((s - t0) / (t1 - t0) * W); d.line([(X, H), (X, H + 8)], fill='black'); d.text((X + 2, H + 10), str(int(s)), fill='black')
for lv in [-20, -40]:
    y = H + 120 - int((lv + 60) / 60 * 110); d.line([(0, y), (W, y)], fill=(200, 80, 80))
pic.save(sys.argv[2])
