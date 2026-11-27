# Version 188: D-Day's guns and blasts, cut from CC0 recordings into one mp3 per kind plus a manifest (dday/sounds/guns/).
# Sources: The Free Firearm Sound Library ("Prepared" set, CC0) and four CC0 explosion packs on opengameart (see CREDITS).
# Usage: python3 -I build_guns.py RAWDIR OUTDIR   (RAWDIR: every source converted to mono 44.1 kHz float WAV, named as below)
import sys, os, json, subprocess, numpy as np
from scipy import signal
SR = 44100
RAW, OUT = sys.argv[1], sys.argv[2]
os.makedirs(OUT, exist_ok=True)

def load(name):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', os.path.join(RAW, name), '-f', 'f32le', '-ac', '1', '-ar', str(SR), '-'], capture_output=True).stdout
    x = np.frombuffer(raw, dtype=np.float32).astype(np.float64)
    return signal.sosfilt(signal.butter(2, 35, 'highpass', fs=SR, output='sos'), x)   # no rumble or DC under anything

def onset(x, t):
    # the true start of a shot near t: the first sample over a tenth of the peak just after it, less 3 ms
    a, b = max(0, int((t - .03) * SR)), int((t + .06) * SR)
    seg = np.abs(x[a:b]); i = int(np.argmax(seg > seg.max() * .1))
    return max(0, a + i - int(.003 * SR))

def cut(x, t, maxlen, fade=.3, floor=-50):
    # from the shot's start until it has died away (floor dB under its peak) or maxlen; the last part faded out
    s = onset(x, t); seg = x[s:s + int(maxlen * SR)].copy()
    hop = int(.01 * SR); n = len(seg) // hop
    rms = np.sqrt(np.mean(seg[:n * hop].reshape(n, hop) ** 2, axis=1) + 1e-12); db = 20 * np.log10(rms / rms.max())
    above = np.nonzero(db >= floor)[0]; end = int(above[-1]) + 1 if len(above) else n   # (the last bit still above the floor: a near take dips to silence before its echo comes back)
    seg = seg[:end * hop]
    f = int(len(seg) * fade); seg[-f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2
    seg[:int(.0015 * SR)] *= np.linspace(0, 1, int(.0015 * SR))
    return seg

def norm(y, db=-1.5): return y / (np.abs(y).max() + 1e-12) * 10 ** (db / 20)
def lp(y, f, o=2): return signal.sosfilt(signal.butter(o, f, 'lowpass', fs=SR, output='sos'), y)
def pitch(y, k):   # play it k times as fast (k<1: lower and longer)
    n = int(len(y) / k); return np.interp(np.arange(n) * k, np.arange(len(y)), y)

def thud(x, t):
    # the bunkers' machine gun (Bryan: "a THUD THUD THUD sounding like a heavy machine gunner would"): a .30-06-class report
    # taken down in pitch, its top rolled off, its chest (140-650 Hz, what a phone's speaker can still play) brought up with a
    # little sub-bass knock under it, driven a little into a soft clip and cut short so six a second stay separate beats
    y = cut(x, t, .6, fade=.5, floor=-60); y = pitch(y, .8); y = lp(y, 3600)
    body = signal.sosfilt(signal.butter(2, [140, 650], 'bandpass', fs=SR, output='sos'), y)
    y = norm(y, 0) + 1.0 * norm(body, 0)
    y = norm(y, 0)
    n = int(.12 * SR); tt = np.arange(n) / SR
    sub = np.sin(2 * np.pi * np.cumsum(np.geomspace(85, 55, n)) / SR) * np.exp(-tt / .04) * .28
    y[:n] += sub[:len(y[:n])]
    y = np.tanh(1.8 * y) / np.tanh(1.8)
    L = int(.3 * SR); y = y[:L]; env = np.ones(len(y)); a = int(.07 * SR); env[a:] = np.exp(-(np.arange(len(y) - a) / SR) / .06); y *= env
    # (Version 188 pass 1: the report's own first crack, 20 ms of it above 1.2 kHz, laid back on top, so each beat has an edge and
    # six a second stay six distinct punches rather than a drone)
    e = cut(x, t, .05, fade=.6, floor=-80)[:int(.02 * SR)]; e = signal.sosfilt(signal.butter(2, 1200, 'highpass', fs=SR, output='sos'), e)
    e *= np.exp(-np.arange(len(e)) / SR / .006); y = norm(y); y[:len(e)] += EDGE * e / (np.abs(e).max() + 1e-12)
    return norm(np.tanh(1.5 * y) / np.tanh(1.5))   # (the edge's spike rounded off, so it doesn't set the take's level)
EDGE = .35

def short(x, t, L=.2):
    # one round of an automatic burst: the report and its first slap, cut off quickly (the echo adds the rest)
    y = cut(x, t, .5, fade=.3, floor=-60)[:int(L * SR)].copy(); a = int(.05 * SR); y[a:] *= np.exp(-(np.arange(len(y) - a) / SR) / .045)
    return norm(y)

def whole(name, t0=0., L=None, fade=.25):
    x = load(name); s = int(t0 * SR); y = x[s:s + int(L * SR)] if L else x[s:]
    y = y.copy(); f = int(len(y) * fade); y[-f:] *= np.cos(np.linspace(0, np.pi / 2, f)) ** 2; y[:64] *= np.linspace(0, 1, 64)
    return norm(y)


def bp(y, lo, hi, o=2): return signal.sosfilt(signal.butter(o, [lo, hi], 'bandpass', fs=SR, output='sos'), y)
def phone(y, sub=.5, drive=4., harm=.8, mid=1.5):
    # Version 188 pass 1: a blast as a phone's speaker hears it. Those speakers play next to nothing under ~250 Hz, where most of
    # an explosion recording's weight is, so a shell sounded no louder than a rifle there (8-19 dB less in 300 Hz-6 kHz than
    # overall, a rifle 3). So: the deepest lows taken down a little (sub: how much of what's under 100 Hz is taken off), the low
    # band driven into a soft clip for harmonics a small speaker can play (250 Hz-2 kHz, the way game audio makes bass heard on
    # phones), and the body (300 Hz-1.2 kHz) brought up. A shell now sits about 4 dB down there, a far one 7-8
    pk = np.abs(y).max() + 1e-12; y = y / pk
    low = lp(y, 220); h = np.tanh(drive * low / (np.abs(low).max() + 1e-12)); h = bp(h, 250, 2000)
    out = y - sub * lp(y, 100) + harm * h / (np.abs(h).max() + 1e-12) * .5 + mid * bp(y, 300, 1200)
    # every blast take as loud as the others (its loudest 50 ms at -12.5 dBFS), the odd spike over that rounded off, so which take
    # comes up doesn't decide how big a shell sounds
    w = int(.05 * SR); k = max(1, len(out) // w); r = np.sqrt(np.mean(out[:k * w].reshape(k, w) ** 2, axis=1)).max()
    out = out / (r + 1e-12) * 10 ** (-12.5 / 20)
    return np.tanh(out / .89) * .89
def fadeout(y, f=.3):
    y = y.copy(); n = int(len(y) * f); y[-n:] *= np.cos(np.linspace(0, np.pi / 2, n)) ** 2; y[:64] *= np.linspace(0, 1, 64); return y
def seg(name, t0, L): x = load(name); return fadeout(x[int(t0 * SR):int((t0 + L) * SR)].copy())

srcs = {k: load(k + '.wav') for k in ['B_24P', 'B_16P', 'W_29P', 'W_24P', 'M_21P', 'M_26P', 'E_25P', 'E_18P', 'G_33P', 'G_22P', 'K_22P']}
S = lambda k, t, L, **o: norm(cut(srcs[k], t, L, **o))
KINDS = {
    # US .30-06 rifles (the M1 Garand, the Springfield): the M1917 Enfield and a Tikka in .30-06, near and mid distance
    'us': [S('B_24P', 1.307, 1.3), S('B_24P', 6.73, 1.3), S('W_29P', .574, 1.3), S('W_29P', 5.662, 1.3)],
    'usfar': [S('B_16P', .604, 1.6), S('B_16P', 5.971, 1.6), S('W_24P', .753, 1.6), S('W_24P', 5.373, 1.6)],
    # German bolt rifles (the Kar98k): a Mosin-Nagant and an Arisaka, near and mid
    'kar': [S('M_21P', 1.033, 1.3), S('M_21P', 5.019, 1.3), S('M_21P', 9.154, 1.3), S('E_25P', .524, 1.3), S('E_25P', 4.026, 1.3)],
    'karfar': [S('M_26P', 1.137, 1.6), S('M_26P', 6.101, 1.6), S('M_26P', 10.741, 1.6), S('E_18P', .359, 1.6), S('E_18P', 4.485, 1.6)],
    # an MP40's short bursts (the Carl Gustav M45, the nearest in rate and calibre), near and mid
    'smg': [S('G_33P', .289, 1.4, fade=.35), S('G_33P', 4.25, 1.3, fade=.35), S('G_33P', 7.997, 1.3, fade=.35)],
    'smgfar': [S('G_22P', .269, 1.6, fade=.35), S('G_22P', 3.906, 1.6, fade=.35)],
    # a trench gun (Winchester Model 12), should anyone carry a shotgun
    'trench': [S('K_22P', .838, 1.2), S('K_22P', 7.443, 1.2)],
    # the BAR's rounds inside a burst (its last round plays a whole 'us' take)
    'bar': [short(srcs['B_24P'], 1.307), short(srcs['B_24P'], 6.73), short(srcs['W_29P'], .574), short(srcs['W_29P'], 5.662)],
    # the mounted machine guns' thud
    'thud': [thud(srcs['B_24P'], 1.307), thud(srcs['W_29P'], .574), thud(srcs['M_21P'], 5.019), thud(srcs['W_29P'], 5.662)],
    # blasts (Version 188 pass 1: each through phone(), so it carries on a phone's speaker; a kind each, ddsfx.js's ddsBoom):
    # a shell or a big blast close (Joth's Chunky Explosion; Thimras's cannonball hits), a tank shell, a mortar bomb or a rocket
    # (Thimras's cannonball hits: into a wall, into the ground), a grenade (the old boom-1 and boom-2), one far off (pauliuw's Explosion
    # somewhere far; a cannonball hit with its top taken off), a shell into the sea (Thimras's cannonball missing into the water),
    # a gun firing (Thimras's cannon fire)
    'xbig': [phone(seg('x_chunky.wav', 0, 2.8)), phone(seg('x_cannon_hit_1.wav', 0, 1.5), sub=.65, drive=5, harm=1.1, mid=2.)],
    'xmid': [phone(seg('x_cannon_hit_wall_no_splash.wav', 0, 1.6)), phone(seg('x_cannon_hit_1.wav', 1.52, 1.45)), phone(seg('x_cannon_hit_wall_1.wav', 1.7, 1.3))],   # (not the cannonball into a cannon: it rings like a bell)
    'xfrag': [phone(seg('old_boom-1.wav', 0, 1.6), sub=.55, mid=1.2), phone(seg('old_boom-2.wav', 0, 1.4), sub=.55, mid=1.2)],
    'xfar': [phone(seg('x_far.wav', 0, 3.0), sub=.6, drive=6, harm=1.2), phone(lp(seg('x_cannon_hit_1.wav', 0, 1.5), 900, 4), sub=.6, drive=6, harm=1.2)],   # (a near one heard from far off: its top gone)
    'xsea': [whole('x_cannon_miss_1.wav', 0, 1.65, .3)],
    'xgun': [phone(seg('x_cannon_fire_1.wav', .17, 2.4), sub=.6, drive=6, harm=1.2)],
}
man = {}
for k, clips in KINDS.items():
    parts = [np.zeros(int(.14 * SR))]; spans = []; t = .14
    for c in clips:
        spans.append([round(t, 4), round(len(c) / SR, 4)]); parts += [c, np.zeros(int(.15 * SR))]; t += len(c) / SR + .15
    y = np.concatenate(parts).astype(np.float32); man[k] = spans
    wav = os.path.join(OUT, k + '.f32')
    y.tofile(wav)
    br = '128k' if k in ('us', 'kar', 'thud', 'bar', 'smg', 'xfrag') else '96k'
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-f', 'f32le', '-ar', str(SR), '-ac', '1', '-i', wav, '-c:a', 'libmp3lame', '-b:a', br, '-ar', str(SR), '-ac', '1', os.path.join(OUT, k + '.mp3')], check=True)
    os.remove(wav)
    print(k, len(clips), 'clips', round(len(y) / SR, 2), 's', os.path.getsize(os.path.join(OUT, k + '.mp3')), 'bytes')
json.dump(man, open(os.path.join(OUT, 'manifest.json'), 'w'), separators=(',', ':'))
print('total', sum(os.path.getsize(os.path.join(OUT, f)) for f in os.listdir(OUT)))
