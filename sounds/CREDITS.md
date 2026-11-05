# Sound credits

Every recording here is CC0 (public domain). The clips were cut and mastered by the
[smokeem](https://github.com/mrellcrane/smokeem) project (`src/audio/samples`, whose CREDITS.md
states every recording there is CC0) and copied from there unchanged, renamed:

| File here | smokeem file | Original recording |
| --- | --- | --- |
| `shot-1` to `shot-4` (squad rifles) | `shot-1` to `shot-4` | AK-47 single shots, near (C_28P), [The Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library) (Still North Media, CC0) |
| `enemy-1` to `enemy-3` (enemy rifles) | `marksman-1` to `marksman-3` | Norinco SKS, near (U_14P), same library |
| `shotgun-1`, `shotgun-2` (squad shotguns) | `shotgun-1`, `shotgun-2` | Benelli Nova 12 gauge, near (O_21P), same library |
| `mg-1` to `mg-3` (machine guns) | `rotisserie-1` to `rotisserie-3` | PPSh-41, near (P_34P), sliced from one burst, same library |
| `boom-1`, `boom-2` (explosions) | `boom-1`, `boom-2` | cannon_02, bang_03, bang_09, fw_06, [25 CC0 bang / firework SFX](https://opengameart.org/content/25-cc0-bang-firework-sfx), layered with a synthesised sub-bass thump |
| `launch` (RPG launch) | `launch` | shot_01 from the same bang pack, plus a synthesised rocket roar |

Everything else (engines, outboard, rain, thunder, the low rumble added to explosions, the
outdoor echo) is synthesised in `js/audio.js`.

## Effects

Everything in `sfx/` (one mp3 per kind, all its clips in a row; `sfx/manifest.json` says where each clip is) was cut from
CC0 packs by `tools/sfx/build_sfx.py`:

| Kind | Recording | Pack, author |
| --- | --- | --- |
| `foot_out`, `foot_in` | footsteps on concrete and carpet; wet footsteps; gravel | [Impact Sounds](https://kenney.nl/assets/impact-sounds), Kenney; [100 CC0 SFX #2](https://opengameart.org/content/100-cc0-sfx-2), rubberduck; [42 Snow and Gravel Footsteps](https://opengameart.org/content/42-snow-and-gravel-footsteps), qubodup (recorded by Corsica_S) |
| `gear` | cloth, leather and metal rattles | [Footsteps Leather, Cloth, Armor](https://opengameart.org/content/footsteps-leather-cloth-armor), HaelDB (CC0 option) |
| `hit_metal`, `hit_wood`, `hit_ground`, `flesh`, `bodyfall` | bullet and body impacts | Impact Sounds, Kenney |
| `grunt` | hurt and strain sounds | [15 vocal male strain/hurt/pain/jump sounds](https://opengameart.org/content/15-vocal-male-strainhurtpainjump-sounds), qubodup |
| `grunt_down` | pain and death grunts | [Pain sounds by EmoPreben](https://opengameart.org/content/pain-sounds-by-emopreben); [grunts of male death and pain](https://opengameart.org/content/grunts-male-death-and-pain), thebardofblasphemy |
| `dog` | dog barks | [Dog sounds](https://opengameart.org/content/dog-sounds), pauliuw; [Dog barking mono](https://opengameart.org/content/dog-barking-mono), HaelDB (CC0 option) |
| `siren` | air-raid siren | [Sirens and Alarm Noise](https://opengameart.org/content/sirens-and-alarm-noise), aquinn |
| `static` | radio static | [Static](https://opengameart.org/content/static), xhunterko |
| `steel`, `slam`, `cell`, `smash`, `reload` | machinery, metal doors, locks, falling metal | [100 CC0 metal and wood SFX](https://opengameart.org/content/100-cc0-metal-and-wood-sfx), rubberduck; [Mechanical Sounds](https://opengameart.org/content/mechanical-sounds), BMacZero; [RPG Audio](https://kenney.nl/assets/rpg-audio), Kenney |
| `lift_ding`, `lift_door` | elevator ding, old elevator door | [Elevator ding](https://opengameart.org/content/elevator-ding), fvcalderan; [old elevator door](https://opengameart.org/content/old-elevator-door), sinny |
| `glass` | glass breaking | [100 CC0 SFX](https://opengameart.org/content/100-cc0-sfx), rubberduck |
| `thunder` | thunder | [Rain + Long Thunder](https://opengameart.org/content/rain-long-thunder), WuxiaScrub; 100 CC0 SFX #2, rubberduck |
| `zip` | zipper (for zip ties) | [Zipper](https://opengameart.org/content/zipper), AntumDeluge |
| `pin`, `cloth` | metal click and latch, cloth | RPG Audio, Kenney |
| `computer`, `scan` | computer noise, force field | [Sci-fi Sounds](https://kenney.nl/assets/sci-fi-sounds), Kenney |

## Voices

Every voice line in `voice/` (one mp3 per speaker, all his lines in a row; `voice/manifest.json` says where each line
starts and how long it is) was generated offline with [Zonos v0.1](https://github.com/Zyphra/Zonos) (Zyphra; code and
model weights Apache-2.0, with the DAC audio codec by Descript, MIT) from the line lists in the game's code. Zonos copies
each speaker's voice from a short reference clip (`tools/voices/refs/`). Those clips were made with
[Kokoro-82M](https://github.com/hexgrad/kokoro) (model and voices Apache-2.0) through
[kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT), and Reyes's shouted one with
[Chatterbox](https://github.com/resemble-ai/chatterbox) (Resemble AI, MIT). The scripts and steps are in `tools/voices/`.
Casting (the Kokoro voice behind each reference clip):

| Speaker | Who | Reference voice |
| --- | --- | --- |
| A1, A2, B1, B2 | Reyes, Kowalski, Hayes, Okafor | am_michael, am_fenrir (pitched down), am_puck, bm_george |
| A3, A4, B3, B4 | the freed prisoners Abara, Brennan, Lindqvist, Marsh | bm_lewis, bm_fable, am_liam, am_onyx |
| S1 to S4 | the four scientists | af_bella, bf_emma, af_sarah, am_eric |
| E1 to E3 | hostiles (barks) | am_onyx with am_echo, bm_daniel, am_onyx with bm_daniel |

They're machine voices standing in for actors; `docs/voice-lines.md` is the sheet for recording real ones.
