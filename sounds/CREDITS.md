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

## Voices

Every voice line in `voice/` (one mp3 per speaker, all his lines in a row; `voice/manifest.json` says where each line
starts and how long it is) was generated offline with [Kokoro-82M](https://github.com/hexgrad/kokoro) (model and voices
Apache-2.0) through [kokoro-onnx](https://github.com/thewh1teagle/kokoro-onnx) (MIT), from the line lists in the game's
code. The scripts and steps are in `tools/voices/`. Casting (Kokoro voice names):

| Speaker | Who | Voice |
| --- | --- | --- |
| A1, A2, B1, B2 | Reyes, Kowalski, Hayes, Okafor | am_michael, am_fenrir, am_puck, bm_george |
| A3, A4, B3, B4 | the freed prisoners Abara, Brennan, Lindqvist, Marsh | bm_lewis, bm_fable, am_liam, am_onyx |
| S1 to S4 | the four scientists | af_nicole, bf_emma, af_sarah, am_eric |
| E1 to E3 | hostiles (barks) | am_echo, bm_daniel, and a blend of the two |

They're machine voices standing in for actors; `docs/voice-lines.md` is the sheet for recording real ones.
