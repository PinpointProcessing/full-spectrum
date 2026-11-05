# Making the voices

The game's voice lines (`sounds/voice/<speaker>.mp3` plus `sounds/voice/manifest.json`) are generated offline with
[Kokoro-82M](https://github.com/hexgrad/kokoro), an open neural text-to-speech model (Apache-2.0), run through
[kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx). The lines themselves live in the game's code (`VOICE_LINES` in
`js/voice.js`, `BARKS` in `js/hunt.js`, the scientists' and prisoners' lines in `js/office.js`); change them there, then
regenerate.

1. `python3 -m venv venv && ./venv/bin/pip install kokoro-onnx soundfile lameenc`
2. Download `kokoro-v1.0.onnx` and `voices-v1.0.bin` from the kokoro-onnx GitHub release `model-files-v1.0` into this folder
   (about 350 MB; don't commit them).
3. `node extract.js` (writes `lines.json` from the game's code)
4. `./venv/bin/python gen.py ../../sounds/voice` (all speakers; about 10 minutes on a laptop CPU), or
   `./venv/bin/python gen.py ../../sounds/voice A1,B2` for just some of them.

Who sounds like whom is `CAST` in `gen.py`. Real recordings can replace any speaker's file later: same file name, and the
clip times in `manifest.json` (start and length in seconds of each line in the file).

## Zonos (the voices in the game now)

Bryan picked [Zonos v0.1](https://github.com/Zyphra/Zonos) (Zyphra, Apache-2.0) over Kokoro and Chatterbox after a side-by-side
test: it takes an emotion mix, a pitch range and a speaking rate per line, so shouts sound shouted instead of read.
Kokoro's `gen.py` stays for quick drafts. Each speaker's voice is copied from a short clip in `refs/`.

1. Python 3.11 venv with `torch==2.6.0 torchaudio==2.6.0` (CPU), `transformers<5`, `phonemizer`, `espeakng-loader`,
   `inflect`, `kanjize`, `soundfile`, plus a clone of the Zonos repo on `PYTHONPATH`. Its Japanese text support pulls in
   `sudachipy` (and data from a host that may be blocked); English doesn't use it, so a stub module named `sudachipy` works.
   Point phonemizer at espeak with `PHONEMIZER_ESPEAK_LIBRARY` and `ESPEAK_DATA_PATH` (from `espeakng_loader`).
2. `zonos_refs.py` (Kokoro venv) makes `refs/<speaker>.flac` for everyone but Reyes, whose two clips Bryan approved and
   are kept as they are.
3. `gen_zonos.py CACHE [speakers] [--budget seconds]`: one take per line into `CACHE/<speaker>/` (about half a day for
   everyone on a 4-core CPU). It can be stopped and picks up where it left off. `--max-lines 50` makes it stop after 50 takes
   (run it in a loop: memory creeps up over a long run), `--shard k/n` takes every n-th line so two copies on 2 threads each
   (`ZONOS_THREADS=2`, about a quarter faster than one on 4) can share a speaker, each with its own CACHE, merged afterwards.
4. `check_zonos.py CACHE` (a venv with `faster-whisper`): a speech recogniser scores each take against its script and flags
   bad lines. `gen_zonos.py CACHE --redo` then makes another take of each flagged line (up to 3 in all), and you check again.
5. `pack_zonos.py CACHE ../../sounds/voice [speakers]` (Kokoro venv): the best take of each line, tidied, into the game's
   files and `manifest.json`. A speaker whose lines aren't all done is skipped and keeps his old voice.

How each line is said (`style_of` in `voicelib.py`, settings in `STYLE` in `gen_zonos.py`) comes from the line's group;
names Zonos gets wrong are respelled for it (`SAY`).
