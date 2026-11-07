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

## Lines made on their own (not in the main sheet)

After v101, Level 3's sniper nest (Bryan: "The players should say Sniper Nest NorthWest of us against the data center or
something like that"): `chat_snipernest_1` "Sniper nest. Up north, against the data center. Stay out of his sights." for A1,
A2, B1 and B2 (chatter.js's `CHAT.snipernest`, said a few seconds after they're out by whoever leads), made with
`gen_sniper.py` (the leader's steady 'firm' style from `gen_road.py`; two takes each), every take heard word for word by
`check_zonos.py`, the first take of each put on the end of the speakers' files by `add_lines.py` (B2's second added a word).
A full repack of these four with `pack_zonos.py` drops it: add it again the same way.

A soldier who can't do what he's told says why (Bryan, after v104: "it would say I'm Pinned, I can't do that!... maybe even
have them say it", then the circle round him, "Let make a small imaginary circle around the unit"), for all eight (voice.js's
`VOICE_LINES`), both made by `gen_refusals.py` (two takes each) and scored by `check_zonos.py`: `cant_1`, "I'm pinned! I
can't do that!", in the 'urgent' style the other pinned lines have (Reyes from his shouted reference), put on the end of the
files by `add_lines.py` as 'shout', packed like the pinned group (every speaker had a take heard word for word: Reyes's
second, the others' first); and `far_1`, "Too far. Move me closer.", said steady ('calm'), added as 'plain' (Okafor's second
take, the others' first: his first lost "Too far"). A full repack of a speaker drops them: add them again the same way
(voice.js falls back to his "Can't move, I'm pinned!" for the first meanwhile, and says nothing for the second).

Three lines were added after the cast was done, outside `extract.js`'s sheet, with the same Zonos settings: Level 1's
helicopter pilot (a new speaker, `PL`, voice from `refs/PL.flac`, made with Kokoro's `am_michael` like the other refs):
`heli_in_1` "Thirty seconds to the beach. Get ready." and `heli_out_1` "You're on your own now. Good luck." (calm, over the
radio, `PL.mp3`), and Reyes's `boatgo_1` "Tower's down. Everyone back to the boat." (urgent), added onto the end of `A1.mp3`
with its manifest entry pointing past the old end. Three takes each, the best by `check_zonos.py`. A full repack of A1 with
`pack_zonos.py` would drop `boatgo_1` (it isn't in `lines.json`): make it again the same way, or add it to the sheet for
everyone who could say it.

After v83, the scene after the gate (`gateAftermath` and `tieScientists` in `js/monsters.js`), 19 lines made with
`gen_gate.py` (its own `STYLE`: 'scream', 'firm' for the leader, 'panic' for the scientists; two takes each, four of the
scream): `gate_wth_1` "What the hell was that?!" for Kowalski, Hayes and Okafor (A2, B1, B2: whoever screams it),
`gate_lead_1` "No. We're moving in. Team on me. Be careful." and `gate_stay_1` "You stay on the bridge till we've cleared
it." for Reyes and Hayes (A1, B1: whoever leads), and for each scientist (S1-S4) `sci_leave_1` "We can still leave! Please.
We can save ourselves!", `sci_bred_1` "We bred those things. There's worse in there!" and `sci_left_1` "Don't leave us out
here! Please!". The best take of each by `check_zonos.py` (two more of S2's and S4's `sci_bred_1`, which came out slurred).
Zonos shouts rather than screams: its scream takes came out at a man's speaking pitch (95-155 Hz) in under a second, so the
chosen ones (A2's second take, B1's and B2's first) went through `scream.py` (the WORLD vocoder, `pyworld`): pitched up to
about 300-350 Hz, rising to the last word, which is drawn out, with a waver, a crack, more breath, the formants opened up a
little, then driven; a speech recogniser still hears every word. `add_lines.py` put them all on the end of the speakers'
files. A full repack of any of these speakers drops them: add them again with `add_lines.py`.

After v91 Bryan found the reshaped scream weird, so `gate_wth_1` is a natural take again, nothing reshaped: six more takes
for each of the three (`gen_yell.py`, styles 'yell' and 'yell2': fear and surprise up, a wide pitch range, quicker),
all heard right by `check_zonos.py`, and the loudest, brightest of each by loudness, pitch and spectral brightness (A2's
second 'yell', B1's third, B2's second) put in with `add_lines.py`'s replace (a fifth item, true, in its spec: the old take
is cut off the file's end when it was the last line there, else left unused). `scream.py` stays, unused.

After v92 (Bryan: "Can't the 'What the hell was that!?' be screamed?") it is screamed: `gen_scream.py`. Zonos stayed at a
shouting pitch (115-155 Hz) whatever the emotion and pitch settings, and even continuing from a recorded scream as an audio
prefix, but it copies a voice from its reference, and a reference of a man screaming brings the scream with it:
`refs/SCREAM.flac` is five of HaelDB's CC0 yells end to end (one man at 300-330 Hz; `sounds/CREDITS.md`), its speaker
embedding blended with the soldier's own. Three takes at each of 0.6, 0.75 and 1.0 of the screamer for each of the three, all
heard right by the speech recogniser; the pitch measured with WORLD's harvest (`pyworld`). In: B2 at 0.6 (342 Hz, still partly
his own voice), A2 and B1 at 1.0 (306 and 385 Hz; their blends stayed under 260 Hz), packed as 'shout'.

After v95, the two lines on the road east (`ROAD_TALK` in `js/road.js`; Bryan wrote them): `road_1` "Alright, we need to
get our radio communication up." for Reyes and Hayes (A1, B1: whoever leads; 'firm', like the gate's leader) and `road_2`
"There's a decommissioned radio tower accessible from the tunnel down the road. You'll probably find the supplies you need
from there." for each scientist (S1-S4: whichever comes out with them; 'tell', even, a little wary), made with
`gen_road.py` (no pause at the comma, as `gen_zonos.py` does), scored by `check_zonos.py`, the best of each put on the
end of the speakers' files with `add_lines.py` ('plain'). Two or three takes did for A1, B1, S1 and S3; S2 took four. S4's
voice runs slower and every take at the usual rate stopped at about 8 s, before the last word, so his are made at a faster
rate (`RATE` in `gen_road.py`).
After v96 (Bryan: "make the conversation end with once we get the radio tower we can request more advanced equipment"), a
third line for the leader, `road_3` "Once we get that radio tower running, we can request more advanced equipment." (A1, B1;
'firm'), made, scored and added the same way: three takes each, all heard word for word, the first kept.
