# Making the sound effects

`build_sfx.py` cuts the recorded effects (`sounds/sfx/<kind>.mp3` and `sounds/sfx/manifest.json`) from CC0 packs. Which
recording goes into which kind, and how it's trimmed, is `KINDS` in the script; the packs and their authors are listed in
`sounds/CREDITS.md`.

1. Download the packs listed there (Kenney's from kenney.nl, the rest from opengameart.org) and unpack each into its own
   folder under one source folder, with the folder names `build_sfx.py` uses (`k_impact-sounds/x/...`, `dog2/x/...`).
2. `python3 -m venv venv && ./venv/bin/pip install soundfile numpy scipy lameenc`
3. `./venv/bin/python build_sfx.py <source folder> ../../sounds/sfx`
