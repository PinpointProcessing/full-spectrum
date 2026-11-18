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

## D-Day's guns and blasts (Version 188)

D-Day doesn't load the modern rifle, machine gun and shotgun clips above any more (only `boom-1`, `boom-2` and `launch`).
Everything in `guns/` (one mp3 per kind, its takes in a row; `guns/manifest.json` says where each take is) was cut, and the blasts
EQ'd and given harmonics a phone's speaker can play, by the guns unit's `build_guns2.py` (Version 188's work files, not in the repo).
All CC0:

| Kind | Heard as | Recording | Pack, author |
| --- | --- | --- | --- |
| `us`, `usfar` | the M1 Garand, the Springfield, the BAR's last round of a burst; an octave down, the crack inside a blast | Springfield M1917 (.30-06), near (B_24P) and mid distance (B_16P); Tikka T3 (.30-06), near (W_29P) and mid (W_24P) | [The Free Firearm Sound Library](https://opengameart.org/content/the-free-firearm-sound-library), Still North Media ("Prepared" set) |
| `bar` | the BAR's rounds inside a burst | the same .30-06 takes, cut short | same library |
| `kar`, `karfar` | the Germans' Kar98k | Mosin-Nagant, near (M_21P) and mid (M_26P); Arisaka, near (E_25P) and mid (E_18P) | same library |
| `smg`, `smgfar` | an MP40 | Carl Gustav M45 short bursts, near (G_33P) and mid (G_22P) | same library |
| `trench` | a trench gun | Winchester Model 12, near (K_22P) | same library |
| `thud` | the bunkers' machine guns, about six beats a second (Bryan: "THUD THUD THUD") | .30-06 and 7.62x54 reports (B_24P, W_29P, M_21P) pitched down, the body brought up, a little sub-bass under it, the first crack laid back on top | same library |
| `xbig` | a shell landing, a bunker or barracks going up | Chunky Explosion; cannon_hit_1 | [Chunky Explosion](https://opengameart.org/content/chunky-explosion), Joth; [Battle at sea](https://opengameart.org/content/battle-at-sea), Thimras |
| `xmid` | a tank's shell, a mortar bomb, a bazooka rocket | cannon_hit_wall_no_splash, cannon_hit_1 (its second hit), cannon_hit_wall_1 (its second hit) | Battle at sea, Thimras |
| `xfrag` | a grenade or a rifle grenade | `boom-1`, `boom-2` above | smokeem (see the first table) |
| `xfar` | a blast far off | Explosion somewhere far; cannon_hit_1 with its top taken off | [Explosion somewhere far](https://opengameart.org/content/explosion-somewhere-far), pauliuw; Battle at sea, Thimras |
| `xsea` | a shell into the sea | cannon_miss_1 | Battle at sea, Thimras |
| `xgun` | a tank's gun or a field gun firing | cannon_fire_1 | Battle at sea, Thimras |

The Garand's clip ping, the incoming shells' whistle, a round cracking past, the bolt worked on the Springfield, the slap back off
the bluffs and walls, and the sand and grit falling after a blast are synthesised in `js/ddsfx.js`.

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
| `scream`, `yelp`, `fear` | screams, pained cries and yells of "No!" (Bryan: pain and fear should be screaming); five of the same pack's yells (3yell1, 3yell2, 3yell6, 3yell9, 3yell11) are also `tools/voices/refs/SCREAM.flac`, the voice reference that makes "What the hell was that?!" a scream (`tools/voices/gen_scream.py`) | [Male Grunt/Yelling sounds](https://opengameart.org/content/male-gruntyelling-sounds), HaelDB (CC0 option) |
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
| A1, A2, B1, B2 | Reyes, Kowalski, Hayes, Okafor | am_michael, am_onyx with am_fenrir, am_puck, bm_george |
| A3, A4, B3, B4 | the freed prisoners Abara, Brennan, Lindqvist, Marsh | bm_lewis, bm_fable, am_liam, am_onyx |
| S1 to S4 | the four scientists | af_bella, bf_emma, af_sarah, am_eric |
| E1 to E3 | hostiles (barks) | am_onyx with am_echo, bm_daniel, am_onyx with bm_daniel |

They're machine voices standing in for actors; `docs/voice-lines.md` is the sheet for recording real ones.

## The monsters (`sfx/mon_*.mp3`, `sfx/boss_*.mp3`)

Built by `tools/sfx/build_monsters.py`: two or three of these recordings layered, slowed down (deeper, bigger), driven a
little into distortion and given a room, so none is used as it was. All CC0, from opengameart.org:

| Pack | Author | Used for |
|---|---|---|
| [80 CC0 creature SFX](https://opengameart.org/content/80-cc0-creature-sfx) | rubberduck | screams, roars, hurt, growls |
| [80 CC0 creture SFX #2](https://opengameart.org/content/80-cc0-creture-sfx-2) | rubberduck | deaths, attacks, roars, the boss's footsteps (stomp) |
| [Monster Sound Effects Pack](https://opengameart.org/content/monster-sound-effects-pack) | Ogrebane | the hounds' growls |
| [Monster Sound Effects 2](https://opengameart.org/content/monster-sound-effects-2) | Ogrebane | growls |
| [Monster Sound Pack, Volume 1](https://opengameart.org/content/monster-sound-pack-volume-1) | Ogrebane | the hounds' hurt cries |
| [CC0 Deep Monster Roar](https://opengameart.org/content/cc0-deep-monster-roar) | trazzz123 | the Brood Mother's roar and death |
| [Monster snarls](https://opengameart.org/content/monster-snarls) | Darsycho | the snarl before a lunge |
| [Insect or alien scream](https://opengameart.org/content/insect-or-alien-scream) | qubodup | the lunge's screech, the roar's edge |
| [Alien Sounds](https://opengameart.org/content/alien-sounds-0) | EZduzziteh | a hiss under the snarls |

The slam also uses the game's own `boom-1.wav` (listed above).

## D-Day's sound bed (`amb/`, Version 188)

Four files, all CC0 from opengameart.org; everything else in the bed (the wind, the waves' swell, the ships' guns and their shells
going over, aircraft, the landing craft's diesel and the hull on the swell, tanks, tracks, trucks, fires) is synthesised by
`js/ddamb.js` when D-Day starts, and the constant crackle of the battle round about is mixed there from the guns' far recordings
(`guns/usfar`, `guns/karfar`, `guns/smgfar`, above).

| File | What | Source |
| --- | --- | --- |
| `amb/surf.mp3` | eight washes of breaking surf in a row (four from each pack), each levelled; `js/ddamb.js`'s `DDA.wash` says where each is | [Beach Ocean Waves](https://opengameart.org/content/beach-ocean-waves), jasinski (from freesound 18363, "alkaibeach"), CC0; [Water Waves](https://opengameart.org/content/water-waves), transitking (from freesound 11505), CC0 |
| `amb/far.mp3` | a muffled far-off explosion, one of the distant artillery's voices | [Muffled Distant Explosion](https://opengameart.org/content/muffled-distant-explosion), NenadSimic, CC0 |
| `amb/water.mp3` | 18 s of waves on a shore, made into a loop (0.2 s of its own end before it and of its start after it, so it goes round without a seam whatever the mp3 decoder does); the waves' lanes and the open sea round the landing craft are this filtered | [Sea and river wave sounds](https://opengameart.org/content/sea-and-river-wave-sounds), randommind ("VistulaShort", 2:30-2:49), CC0 |
| `amb/birds.mp3` | 24.5 s of small birds in a copse, the low end taken off, made into a loop the same way; the woods, the field and the quiet spells, silent while guns are going | [Park ambiences](https://opengameart.org/content/park-ambiences), "park_ambience_birds" (2:20-2:46), CC0 |
