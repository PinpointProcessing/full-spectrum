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
