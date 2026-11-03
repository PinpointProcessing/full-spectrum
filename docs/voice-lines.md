# Voice line sheet

Short radio callouts for the four soldiers. The game plays a line when that soldier does the thing (see "When it plays"). Every line is already voiced by an open neural text-to-speech model (Kokoro-82M; `tools/voices/`, credits in `sounds/CREDITS.md`), and so are the freed prisoners, the scientists and the hostiles' barks (their lines are in the code: `js/office.js`, `js/hunt.js`). Those are stand-ins for actors: this sheet is for recording real ones. If the files can't load, the browser's built-in speech reads the squad's lines (robotic).

## The squad

| ID | Name | Voice direction |
| --- | --- | --- |
| A1 | Reyes | Alpha lead. Calm, clipped, in control. Mid voice, never shouts unless it's urgent. |
| A2 | Kowalski | Gruff and heavy. Older, low voice, dry. Says the minimum. |
| B1 | Hayes | The youngest. Quick, higher energy, a little edge of nerves under fire. |
| B2 | Okafor | Steady and measured. Warm low voice, unhurried even when it's bad. |

All lines: spoken as if into a radio handset, close to the mic, no echo or effects (the game adds the radio filter and squelch). Urgent lines (contact, man down, RPG, charge) with real tension; routine ones (moving, restocked) flat and quick.

## Files

- Record one file per line, named `<key>_<n>`, for example `contact_2` (mono, 44.1 or 48 kHz, WAV or MP3; trim silence at both ends; peak around −3 dB; no music or effects).
- The game plays one file per speaker with all his lines in a row (`sounds/voice/<ID>.mp3`) and a list of where each line starts and how long it is (`sounds/voice/manifest.json`). Send the separate files and I'll put them together (the same script that made the stand-ins can do it), or replace a whole speaker at once.
- Every soldier records the same set; the three variants keep repeats from sounding canned. Feel free to rewrite lines to suit each character (change them in `js/voice.js`, same keys).

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

| `silent` | He takes a silent shot (silencer) | Taking the shot. | Quiet shot. | Lining it up. |
| `takedown` | He moves in for a takedown | Moving in. | Going quiet. | I've got him. |
| `watch` | A Watch order | Watching. | Eyes on. | Covering that way. |
| `breach` | The team goes in on a Breach order | Breach! Breach! | Going in! | Clear the room! |
| `zip` | He goes to zip-tie someone | Hands where I can see them! | On your knees! | Don't move! |
| `card` | He picks up the access card | Got the access card. | The card's ours. | I've got the card. |
| `lab` | He wrecks a lab bench | Equipment's wrecked. | One less lab. | Smashed it. |

That's 23 lines × 3 variants = 69 per soldier. The four freed prisoners (Abara, Brennan, Lindqvist, Marsh) have the same set (they shout them, no radio), plus their own lines in `js/office.js` (freed, a rifle picked up, cries for help, Marsh back on his feet, goodbye).

## Conversations

The squad also talks to each other (`js/chatter.js`): name-to-name exchanges ("Kowalski, on me." / "Right behind you, Reyes."), contact calls by the clock, stealth whispers, check-ins and banter in quiet spells. Those lines are in that file (`NAMED`, `CHAT`, `CDIR`, `BANTER`); recording them for real would follow the same pattern, one file per line.

## Later

- Enemy shouts and the scientists' lines are voiced now (their text is in `js/hunt.js` and `js/office.js`); a sheet for recording them would follow the same pattern.
- Orders from you (the player as commander) and a squad leader briefing at each objective are other options.
