# Recorded sounds

`z1.mp3` … `z24.mp3`: "Zombies Sound Pack" by artisticdude, from OpenGameArt
(https://opengameart.org/content/zombies-sound-pack), released under CC0 (public domain).
Converted here to mono 22 kHz MP3. No changes to the performances.

Which clip is used for what is in `ZCLIPS` in `src/10-audio.js`. They were sorted by length and loudness
only (long = roar, medium = groan, short = snarl): nobody has yet listened and corrected the sorting.

`v_*.mp3`: the game's spoken lines, generated with the Kokoro-82M text-to-speech model (hexgrad, Apache 2.0) through
kokoro-onnx, by `make_voices.py`. Voices used: am_michael (Hal), af_bella (Denise), bf_emma (Ruth), bm_george (Walt),
am_onyx (Dunn), af_sky (Jules), af_nicole (Marisol).
