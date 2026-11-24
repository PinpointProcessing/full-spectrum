# Recorded sounds

`z1.mp3` … `z24.mp3`: "Zombies Sound Pack" by artisticdude, from OpenGameArt
(https://opengameart.org/content/zombies-sound-pack), released under CC0 (public domain).
Converted here to mono 22 kHz MP3. No changes to the performances.

Which clip is used for what is in `ZCLIPS` in `src/10-audio.js`. They were sorted by length and loudness
only (long = roar, medium = groan, short = snarl): nobody has yet listened and corrected the sorting.

`v_*.mp3`: the game's spoken lines, generated with the Kokoro-82M text-to-speech model (hexgrad, Apache 2.0) through
kokoro-onnx, by `make_voices.py`. Voices used: am_michael (Hal), af_bella (Denise), bf_emma (Ruth), bm_george (Walt),
am_onyx (Dunn), af_sky (Jules), af_nicole (Marisol).

Recorded screams and gore for the broadcast attack, all CC0 from OpenGameArt, cut and level-matched here:
- `s_m1`, `s_m2`, `s_m3`: from "grunts of male death and pain" by thebardofblasphemy (https://opengameart.org/content/grunts-male-death-and-pain), at 3.9 s, 0.45 s and 23.8 s of the original.
- `s_f1`: the first 3 s of "Horror scream1" by Vinrax (https://opengameart.org/content/horror-scream1).
- `s_f2`: "Female Scream 1" by NocturnalVanguard (https://opengameart.org/content/female-scream-1).
- `s_wet1`, `s_wet4`, `s_wet8`: from "Fleshy Bone Break/Snap SFX" by Zane Little Music (https://opengameart.org/content/fleshy-bone-breaksnap-sfx).
These were picked by length, loudness and pitch measurements, not by ear.
