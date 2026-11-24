#!/usr/bin/env python3
"""Synthesize the news ident that plays when the emergency broadcast cuts in -> sounds/s_sting.mp3.
Timpani, brass stabs, a string pulse and a held last chord, about 3.4 s. Needs numpy and ffmpeg. Nobody has listened to it yet."""
import os, subprocess, tempfile, wave
import numpy as np
SR = 22050; N = int(SR * 3.9); out = np.zeros(N); rng = np.random.default_rng(4)
def hz(n): return 440 * 2 ** ((n - 69) / 12)
def lp(x, fc):                       # one-pole low-pass, run twice
    a = np.exp(-2 * np.pi * fc / SR)
    for _ in range(2):
        y = np.empty_like(x); z = 0.0
        for i, v in enumerate(x): z = (1 - a) * v + a * z; y[i] = z
        x = y
    return x
def add(sig, t, g=1.0):
    i = int(t * SR); sig = sig[:max(0, N - i)]; out[i:i + len(sig)] += sig * g
def env(n, a, d, hold=1.0):
    t = np.arange(n) / SR; return np.minimum(1, t / a) * np.exp(-np.maximum(0, t - hold) / d)
def brass(notes, dur, bright=2600):
    n = int(dur * SR); t = np.arange(n) / SR; s = np.zeros(n)
    for m in notes:
        for det in (-.004, 0, .005):
            f = hz(m) * (1 + det); s += 2 * ((t * f) % 1) - 1
    return lp(s / len(notes) / 3, bright) * env(n, .012, .16, dur - .12)
def strings(m, dur):
    n = int(dur * SR); t = np.arange(n) / SR; s = sum(2 * ((t * hz(m) * (1 + d)) % 1) - 1 for d in (-.006, 0, .007)) / 3
    return lp(s, 3400) * env(n, .008, .05, dur * .55)
def timp(m, dur=.9):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m) * (1 + .5 * np.exp(-t * 30))
    return (np.sin(2 * np.pi * np.cumsum(f) / SR) + .25 * lp(rng.standard_normal(n), 900) * np.exp(-t * 40)) * np.exp(-t * 4.5)
def swell(dur):
    n = int(dur * SR); t = np.arange(n) / SR; x = rng.standard_normal(n); x = x - lp(x, 3500)
    return x * (t / dur) ** 2.5 * .5
add(timp(38), 0, .9); add(brass([50, 57, 62, 65], .42), 0, .9)                    # D minor stab
for i in range(8): add(strings(74 if i % 2 == 0 else 69, .11), .44 + i * .11, .5)  # the urgent pulse
add(timp(38, .5), .88, .5)
add(timp(34), 1.32, .8); add(brass([46, 53, 58, 62], .4), 1.32, .85)              # B flat
for i in range(4): add(strings(77 if i % 2 == 0 else 70, .1), 1.5 + i * .1, .45)
add(timp(36), 1.76, .8); add(brass([48, 55, 60, 64], .4), 1.76, .9)               # C
add(swell(.5), 1.72, .6)
add(timp(38, 1.6), 2.2, 1.0); add(brass([38, 50, 57, 62, 69], 1.25, 3000), 2.2, 1.0)   # D, held
for i in range(9): add(timp(38, .3), 2.5 + i * .075, .18 + i * .02)               # roll under the last chord
ir = rng.standard_normal(int(SR * .9)) * np.exp(-np.arange(int(SR * .9)) / SR * 6); ir[0] = 0
wet = np.convolve(out, ir)[:N] / np.sqrt((ir ** 2).sum())
out = out + .22 * wet; out = np.tanh(out * 1.1); out /= np.abs(out).max() / .95
here = os.path.dirname(os.path.abspath(__file__))
with tempfile.NamedTemporaryFile(suffix='.wav') as f:
    w = wave.open(f.name, 'wb'); w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((out * 32767).astype('<i2').tobytes()); w.close()
    subprocess.check_call(['ffmpeg', '-v', 'error', '-y', '-i', f.name, '-af', 'loudnorm=I=-15:TP=-1.5', '-ac', '1', '-ar', '22050', '-c:a', 'libmp3lame', '-b:a', '56k', os.path.join(here, 's_sting.mp3')])
print('s_sting.mp3', os.path.getsize(os.path.join(here, 's_sting.mp3')), 'bytes')
