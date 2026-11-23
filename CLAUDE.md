# Warehouse Yard — squad tactics prototype

Combat demo for Bryan's next game after Ashvale: modern squad tactics (Full Spectrum Warrior squad control + Aliens: Dark Descent look and campaign feel) with base building and async PvP planned later. This demo only tests the battle layer.

## The game idea (long term)
- Main HQ: level up, research weapons, build defenses, store vehicles, collect resources. Modern setting, human vs human.
- Missions: overlay of enemy territory, scouting options, pick the first target, take it, then push to the next outpost/checkpoint. Captured areas become sub-bases (recruit locals, repair gear, heal the wounded, build makeshift tech). Clear the region, upgrade HQ, continue the war.
- Later: async online raids. Players build base defenses, and their forces defend on their own when attacked.
- Visual target: close to Aliens: Dark Descent.

## The demo (warehouse-yard.html)
Single self-contained HTML page. Three.js r128 from cdnjs (global `THREE`) renders the 3D world; a 2D canvas overlay on top draws the HUD bits (hp bars, hit %, previews, tracers, rain).

Scenario: rainy night, 600x900 map (units ≈ 10 cm). 4 soldiers start in the SW corner by containers: Alpha (A1 Reyes, A2 Kowalski) and Bravo (B1 Hayes, B2 Okafor). One big warehouse in the middle with 4 hostiles behind crates watching the south roll door. Sandbag nest (U shape with single bags off each side) ahead-left. Flank routes: west window, east window and east door.

### Decisions made (keep unless Bryan changes them)
- Real-time with slow-mo (quarter speed) while giving orders, plus Pause. Not turn-based.
- Squad is the main unit, split into two 2-man fire teams. Individuals are for special moves (flank, grenade, revive).
- Group move = two taps: first tap previews ghost positions (green = in cover, red = exposed, from known enemies), tap the marker again to go. Single soldier moves on one tap.
- Soldiers act on their own to survive: return fire, shift to nearby cover if exposed ~2 s, but never wander off on a plan of their own. Player orders lock out auto-moves for 4 s.
- Angled 3D camera from the south (pitch 60° zoomed out → 46° zoomed in). Bryan liked this far more than top-down.
- Hit chance shown per shot as "64% · open / cover / heavy", XCOM style.

### Controls
- One-finger drag: pan the map (with glide). Pinch: zoom 1–4×. Fit map button resets.
- Tap a soldier: select his fire team. Hold a soldier (380 ms): select just him.
- Box select: hold empty ground then drag, or press Box then drag.
- Tap a visible enemy: focus fire. Suppress button then tap an enemy: pin that area. Grenade (single soldier, 1 each, 170 range). Tap a downed teammate with a soldier selected: go revive.
- Keyboard: Space pause, Esc clear, 1/2 select teams, wheel zoom.

### Rules and numbers (first guesses, not tuned)
- Hit chance: 0.86 − dist/900; half cover −0.28, heavy −0.42; shooter moving −0.15, target moving −0.08; suppression up to −0.25; enemies −0.10. Clamped 5–95 %.
- Bursts of 3, every 1.6–2.2 s, range 380. Damage 11–16 per hit (enemies ×0.6).
- Suppression: +0.06 per incoming shot, +0.17 per suppress-fire shot, decays 0.18/s. Pinned above 0.65: fires at 40 % rate, −0.25 accuracy, enemies stop repositioning.
- Cover = an object within 15 of the target that the shot line crosses. Full objects (containers, walls, truck, racks, fence) block line of sight; half cover (sandbags, crates, barrels, pallets, barrier, window sills) doesn't.
- Downed players bleed out in 45 s; a teammate standing still within 24 revives in 3 s at 35 hp.
- Enemies: cone vision (±62°, 300) until alerted, then reposition inside the warehouse when exposed, fall back below 40 hp.
- Pathfinding: A* on a 10-unit grid with string-pulling. Cover points are generated around every object edge.

### Known gaps / next ideas
- Balance untested at real speed. Bryan's playtests matter more than the numbers above.
- Enemy AI only shifts and falls back: no pushing, flanking, or grenades.
- Phone performance of the 3D lighting is unverified. If it stutters: drop the 4 flashlight spotlights first, then shadow map size (2048 → 1024).
- Bryan plans to add a second squad of 4 once the one-squad mechanics feel right.
- File should be split into modules (map data, pathfinding, combat/AI, 3D scene, overlay, input, HUD).
- Bryan has mentioned a WW2 version of this squad game, and may want its soldiers in the cartoon character style from the First Light character lab (see "Character redesign" below). The soldiers here are still the simple pawn shapes.

## Second prototype: First Light (first-light.html)
A zombie survival level on a new third-person engine (not the Warehouse Yard tactics code). An earlier top-down version ("Day One") was scrapped: Bryan didn't like it. Design notes and numbers are in `ideas/zombie-apocalypse.md`.

- **Source is split into modules** in `first-light/src/*.js` (core, audio, map, textures, world, build, figures, tv, game, script, hud, main). `python3 first-light/build.py` concatenates them into `first-light/shell.html` and writes the single-file `first-light.html`. Edit the modules, never the built file.
- **Decisions made (keep unless Bryan changes them):**
  - Third-person follow camera with direct control (stick/WASD, Attack, Fire, Dash). Not tap-to-move. Cam button switches to over-the-shoulder or high.
  - The first character is "You": best stats, the leader, and the only one whose death ends the game. You name them on the shelter screen after the level.
  - Rescued survivors follow and fight on their own. They can die for good.
  - The TV must be on and audible. An EMERGENCY BROADCAST bubble opens the broadcast: two anchors warn of the virus, then get attacked on air.
  - The street is loud and busy (fires, wrecks, fleeing people, helicopter, car crash, explosion). The escape is a large storm-drain pipe that becomes the first shelter.
  - Walls count (Bryan). Your house can only be entered or left through the front door and the windows (`PORTALS` in `70-game.js`). A window has to be broken first (a swing from You, or a zombie pounding on it) and is then climbed through, which takes a moment. Zombies pound on a shut door until it gives; a scripted one starts on the front door a few seconds after the break-in. Survivors only use ways that are already open.
  - The broadcast is read flat, like a newsreader, in the device's own speech voices (best male and female English voice it has, normal speed and pitch). When the studio is attacked both anchors get a gurgling scream (`gurgle` in `10-audio.js`). Bryan found the earlier voices annoying.
  - Direction is shown, not told (Bryan): a trail of road flares and county EVACUATION / STORM DRAIN signs lead north (`FLARES`, `SIGNS` in `20-map.js`), and the goal line names what is near (a survivor who needs help, the light in the garage). No floating sound-effect words on vehicles.
  - A breather half way: Ruth's boarded-up garage (`SAFE` in `20-map.js`, `safeTick` in `75-script.js`). Walk up, she lets you in and bars the door, everyone heals, she talks for about 20 s, you walk out through the door. One visit.
  - You carry two melee weapons; SWAP (or Q) changes hands; a third replaces the one in hand. Weapons wear out per hit landed and break (`uses` in `MELEE`, `giveMelee`/`swapMelee`/`wearMelee`). Survivors' weapons do not wear.
  - Voices (`62-ai.js`): Bryan wants AI for the sound of voices, not for writing lines (he turned down Claude-written dialogue on 2026-11-23). The words are always the set lines. With the `tts` capability the anchors, Ruth and each survivor's joining line are spoken in Claude voices; otherwise the device's own speech. Publish the artifact with `capabilities: {tts:{}}`.
  - Characters are made in code, never imported (Bryan: no Mixamo).
  - Not everyone gets a bat (Bryan). Each survivor carries their own weapon (Walt 7-iron, Jules skateboard, Marisol butcher knife, Dunn pistol and baton), and household weapons lie around the level for You to swap to (butcher knife, frying pan, clothes iron, hammer, tire iron). Picking one up leaves the old one in its place.
- **Characters (`first-light/src/50-figures.js`, also what the character lab shows).** Bryan rejected the first stick-like figures and a round of realistic ones, then sent reference pictures (big-headed cartoon soldiers; a smooth white mannequin) and picked two builds from the drafts: **brawler** (his favourite: 3.6 heads tall, egg-shaped head with a jaw, heavy brows, broad chest, big fists) and **slim** (the "Mannequin with a face": 4 heads tall, round head, simple dark eyes). Everyone in the game is one of those two. He approved putting them in on 2026-11-22.
  - Who is on which build: You, Walt, Officer Dunn and Big Earl on `brawler`; Jules and Marisol on `slim`; zombies and bystanders are a mix.
  - How a figure is built: the body is one solid made of blended shapes (`loft`, `ell`, `cone` in a `Solid`), wrapped in a single surface by `polygonize` (surface nets), with bone weights taken from the nearest shapes. Clothes and face are painted on a canvas texture (`paintBody`, `paintFace`). `BUILD` holds the two builds; `person(id, name, group, build, blurb, overrides)` defines one look with its own body tweaks, head (hair, cap, beanie, ponytail, long hair, glasses, moustache, zombie face), outfit (`out`: sleeve lengths, robe, shorts, tie, badge, blood, torn hem) and colours (`look`).
  - Each look is sculpted once (`archetype`) and shared: `makeFig` only makes a skeleton and a material. The cast gets a fine wrap (You 0.16 cell and a 2048 texture, about 55k triangles; the others 0.19 and 1024, about 40k). Zombies and bystanders come from pools (`ZPOOL`, `CPOOL`) with a coarse wrap (0.46 cell, 512 texture, about 8k triangles) and differ per body by height and a slight tint. Coarse wraps set the legs and arms a little wider apart so limbs never web together.
  - `preloadFigs` sculpts all 22 looks behind the title card before the level starts (about 3.5 s in a headless test; the Wake up button counts them).
  - Keep arms hanging clear of the trunk and thighs in the rest pose: the paint is projected from the front and back, and hands that sit within a cell of the leg get webbed to it.
  - Weapons (`WEAP`): two-handed ones (bat, 7-iron, skateboard) are swung with a grip position and bat direction and both arms solved to it by two-bone IK; one-handed ones (knife, pan, clothes iron, hammer, tire iron, baton) use the forehand, backhand and overhead swings; guns are built round a pistol grip with the barrel along the forearm and are fired one-handed: only the gun arm comes up (Bryan). Hands close into fists round anything held. Add a weapon by adding it to `WEAP` and, if You can use it, to `MELEE` and `ITEMN` in `70-game.js`.
  - A critical kill takes the head off: `popHead` shrinks the head bone to nothing and hands back a loose head for the debris list. A missing arm is a shoulder bone scaled to nothing. Bodies already lying in the street are ordinary figures posed once and never animated again.
  - **Character lab (`character-lab.html`, source in `first-light/lab/`):** the same module on a turntable, showing the cast and three zombies with pose buttons and a button that steps through every weapon. Build it with `python3 first-light/lab/build.py` after changing `50-figures.js`.
  - **Possible second use (Bryan, 2026-11-22):** he asked to keep this character style in mind for a WW2 version of the Full Spectrum squad game, "maybe we'll use it". Nothing else about that game is written down in this repo yet. If it goes ahead, the soldiers would be new `person()` entries on the same two builds (uniform, helmet and gear as outfit and head options).
- Three.js r128 from cdnjs, plus the r128 bloom scripts from jsdelivr (optional: the game runs without them). All art, textures and sound are generated in code.
- Quality steps down automatically if frames are slow (bloom off, then smaller shadows and resolution, then no shadows).

### Testing note
Headless browsers here have no GPU, so WebGL runs in software at ~3 fps: fine for screenshots and checking layout, useless for judging pacing. For local tests without network, install `three@0.128.0` from npm and inline `build/three.min.js` in place of the CDN tag (for First Light, also inline the six `examples/js` bloom scripts). To test First Light logic, add `window.__ev=c=>eval(c)` after `boot();` in a test copy, set `paused=true`, then step `update(1/30)` yourself and drive `input.mx/my/atkP`.
