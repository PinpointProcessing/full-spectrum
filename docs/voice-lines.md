# Voice line sheet

Short radio callouts for the four soldiers. The game plays a line when that soldier does the thing (see "When it plays"). Until a soldier has recordings, the browser's built-in speech reads the line instead (robotic, a stand-in only).

## The squad

| ID | Name | Voice direction |
| --- | --- | --- |
| A1 | Reyes | Alpha lead. Calm, clipped, in control. Mid voice, never shouts unless it's urgent. |
| A2 | Kowalski | Gruff and heavy. Older, low voice, dry. Says the minimum. |
| B1 | Hayes | The youngest. Quick, higher energy, a little edge of nerves under fire. |
| B2 | Okafor | Steady and measured. Warm low voice, unhurried even when it's bad. |

All lines: spoken as if into a radio handset, close to the mic, no echo or effects (the game adds the radio filter and squelch). Urgent lines (contact, man down, RPG, charge) with real tension; routine ones (moving, restocked) flat and quick.

## Files

- One file per line per soldier: `sounds/voice/<ID>/<key>_<n>.mp3`, for example `sounds/voice/A1/contact_2.mp3`.
- Mono, 44.1 or 48 kHz, MP3 (128 kbps or better) or tell me if you'd rather use WAV.
- Trim silence at both ends; peak around −3 dB; no music or effects.
- Then list the files you have in `sounds/voice/manifest.json`, like this (only what exists; anything missing falls back to the stand-in):

```json
{
  "A1": ["contact_1", "contact_2", "ack_move_1"],
  "B2": ["man_down_1"]
}
```

You don't need all of them at once: a soldier can start with a few lines and the rest stay on the stand-in. Every soldier records the same set; the three variants keep repeats from sounding canned. Feel free to rewrite lines to suit each character (same file names).

## Lines

| Key | When it plays | Variant 1 | Variant 2 | Variant 3 |
| --- | --- | --- | --- | --- |
| `ack_move` | You order a move | Moving. | On it. | Copy, moving. |
| `ack_attack` | You tap an enemy to focus fire / open fire | Engaging! | Target, firing! | On him! |
| `contact` | The squad is spotted (first contact) | Contact! | Contact front! | We're spotted! |
| `man_down` | A teammate goes down (said by the nearest soldier) | Man down! | He's down, he's down! | Medic! Man down! |
| `hit_down` | (reserved: the downed soldier himself) | I'm hit! | I'm down! | Argh, I'm hit! |
| `revive` | He heads over to revive someone | I've got you. | Hang on, coming to you. | Moving to him. |
| `revived` | He's been revived | I'm good, I'm back in. | Back in it. | Thanks. Let's go. |
| `frag` | He throws a grenade | Frag out! | Grenade out! | Frag! |
| `kill` | He kills a hostile (not every time) | Tango down. | Got him. | Hostile down. |
| `suppress` | He's ordered to suppress | Suppressing! | Keep their heads down! | Laying it on! |
| `pinned` | He gets pinned by fire | I'm pinned! | Can't move, I'm pinned! | Taking heavy fire! |
| `charge` | He sets a demolition charge | Charge set! Get clear! | Fire in the hole! | Charge is live, move! |
| `rpg` | An RPG is aimed at him (or near him) | RPG! | Rocket! Move! | RPG, get down! |
| `objective` | An objective is completed | Objective secure. | Area clear. | That's done. Moving on. |
| `heal` | He starts healing in a medical box | Patching up. | Bandaging. | Fixing myself up. |
| `restock` | He restocks at a supply box | Restocked. | Topped up. | Grabbing ammo. |

That's 16 lines × 3 variants = 48 files per soldier, 192 in all.

## Later

- Enemy shouts (alarm, "reloading", calling for help on the radio) would fit the stealth plans: a separate sheet when we get there.
- Orders from you (the player as commander) and a squad leader briefing at each objective are other options.
