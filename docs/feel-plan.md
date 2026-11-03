# The feel plan: getting closer to Aliens: Dark Descent

Status (November 2026): Bryan approved the plan ("I like all these ideas"). The quick fixes are in; the rest is in order below. Where this says "Bryan", it's his decision; everything else is a recommendation he can change.

The research behind it (Dark Descent's systems and presentation, how other games make human enemies tense, melee and creature design, and an audit of our build) was done from reviews, guides, developer interviews and player reports found by web search; some sites couldn't be fetched, so treat specific Dark Descent numbers as approximate. Key sources are at the end.

## Why it didn't feel right yet (audit of the build at fd658e6)
1. **The enemy never takes the initiative.** Alerted enemies only move between cover near their post. In a measured warehouse fight none of the four guards moved even 1 m in 40 s. Nobody chases, searches, raises an alarm or calls for help, so waiting is always safe. The only code that advanced on the squad (`assaultThink`) stopped running when the counterattack was taken out.
2. **Nothing was unknown.** The last-foes markers ringed all four warehouse guards from the first second, and enemy machine gunners showed through walls (both fixed). The night is evenly lit, so the map reads at a glance.
3. **The light doesn't carve the dark.** Torches only light the floor; every room inside has the same lamp.
4. **Silence between shots.** No background sound or tension music; enemies never speak.
5. **Hits have no weight.** No flinch (the hit flash is computed but never drawn), no shake; reviving was free and instant, so going down cost about 3 s.
6. **Every objective ends the same way** (kill everyone, walk in, 5 s quiet).
7. **The interior is a lit floor plan,** and labels and pills sit on everything all the time.

## What gives Dark Descent its feel
- **Every mission is a race.** Supplies only go down, stress only goes up, the enemy's aggression keeps climbing; staying costs something every minute.
- **Being hunted.** A sighting starts a hunt: enemies go to where you were last seen and search. A meter climbs while you're hunted, and a warning and countdown come before a big attack.
- **Not knowing.** Darkness carved by the squad's torches, fog of war, and a motion tracker whose beeps speed up as things close in.
- **Marines as people.** Voices, stress, permanent deaths.
- Downed marines there: no free revive in the field. A medic with a kit (an upgrade) can wake one; otherwise he's carried out to the extraction vehicle (slow, sidearm only). Creatures drag the downed away, and if the dragger isn't killed he's gone. No bleed-out countdown was found.

## The order of work
1. **Quick fixes (done).** See-through fences; C4 off for this level and smoke grenades in its place; the healthiest soldier takes the exposed spot and the hurt or just-revived keep their heads down; no reviving while pinned and a 60 s window; tapping one soldier of a selected group selects just him; the two marker bugs.
2. **Enemies that hunt and call it in.** The biggest change to the feel.
   - Being spotted no longer wakes the whole map: a shout reaches about 25 m, gunfire further; contact can end outdoors too (as it already does inside the office).
   - Hunters go to the squad's last known position, search nearby hiding places and flank; they give up after 30–40 s and take new posts nearer where they lost you.
   - Radio men call for help (about 5 s, a ring over his head); killing or pinning him stops the call. Alarm panels where there's no radio man.
   - Reinforcements come with a warning and a countdown, from a place you can empty first, and they're capped. An alarm never loses the mission; it brings reinforcements (Bryan).
   - Enemies shout to each other ("There!", "Lost him!", "Flanking left!").
   - Guard dogs with handlers count as human and belong in level 1 (Bryan). A dog follows the squad's trail and barks to alert its handler.
3. **The dark, sound and weight.** Darker nights; visible torch beams; inside: dark empty rooms, lit occupied ones, flickering and emergency lights, clutter and small story scenes; background hum, a tighter echo inside, a low drone that swells as you're being spotted; flinches, muzzle flashes, camera shake, a red edge flash when hit; labels only when they matter.
4. **The container maze and the run** (replaces the fuel depot; Bryan). A container maze about 2.5 times bigger, and a straight lane of about 37 m to the data center covered by a manned heavy machine gun (Bryan: manned) with a sweeping searchlight. Ways past: run for it, pin the gunner with one team while the other runs, flank him through the maze, dash while he reloads, or smoke.
5. **Later layers.** An alert level for the base that only goes up (helmets, searchlights, flares); dead guards that get found and missed radio check-ins; enemies who surrender (zip ties); enemy grenades that flush out campers; a contact sensor that pings, our own take on the motion tracker.

## Squad orders
- **Watch** (Full Spectrum Warrior's fire sector): drag a cone from a fire team; the team takes the nearest cover that still covers the cone and fires first at anything that enters it, with a small aim bonus. The main answer to anything that rushes the squad, and useful against humans.
- **Breach room** (Bryan: after Watch, a similar order): the team stacks up at a doorway and clears the room.
- **The breach pair** (asked, waiting on Bryan's yes or no): two enemies who push together, a shield man in front (shots from the front hit the shield) and a shotgunner behind. Beaten by flanking, a grenade behind them, or pinning them. They'd fit the ambush behind the steel door and the response team after an alarm.

## Downed soldiers (Bryan)
- For the first 60 s a teammate can revive him by hand (3 s beside him), not while that teammate is pinned. Built.
- After 60 s he can be carried out (to a medical box: the carrier moves at sneaking speed and can't shoot or climb through windows) or revived with a medic kit (about 6 s, not while pinned). To finalise with the HQ work. Open: can he still die after that (a further countdown, or a blast), and how many medic kits (say one per fire team, restocked at supply boxes)? Until then he bleeds out at 60 s as before.

## The other thing (creatures for the next levels)
Bryan: a mix of all six concepts, brought in one at a time, and the list can grow. Level 1 stays human. Grabs are a rescue race you can lose, and sometimes the captured soldier has been turned into a trap: our own versions, for example an implant that takes over his mind and turns him on the squad unless it's jammed in time, or a brood that bursts out of him as crawlers if the timer runs out (not the films' stomach-burster).

The six (placeholder names):
1. **Heat-hunters.** Lab-bred pack animals that see body heat. They stalk out of the squad's facing, lunge from 4–8 m and pin a soldier, then pull back. Rain blinds them, so they hunt indoors; a soldier who just fired is easier to see, so holding fire is a tactic.
2. **The Underfloor.** Lives in the data center's raised floors; drags a soldier toward an open tile. Running on the tiles attracts it, sneaking doesn't; his buddy shoots it to free him.
3. **The Growth.** A spreading mat that hatches small crawlers; destroy its hearts. It grows the longer you stay, Dark Descent's one-way clock. The biggest build.
4. **Orphaned machines.** Security robots whose friend-or-foe list is tied to the stolen key: they attack everyone. They see only movement, so freezing hides you. The same robots can later defend players' bases in the planned base building and PvP.
5. **Relays.** Prisoners with implants driven by a broadcast; they hunt radio signals, so the squad's voice lines give them away. They can be saved (jam, then zip-tie).
6. **A water ambusher.** Lives in the moat and canal; a set piece for crossing to the fortress.

Rules that make melee enemies fair and scary (from the research):
- Few at a time, each one mattering; a swarm only as a forecast punishment, with a source you can shut.
- Every attack telegraphed on three channels: a ground marker, a sound, a pose. Violet is free as their colour.
- They must come unseen and charge only from the last 10–15 m: four rifles deal about 190 damage to something crossing 30 m of open ground. So the stalking behaviour is the heart of it, and it builds on step 2's hunting.
- Hit and fade: strike, pull back, come again.
- A first sighting slows the game for 2 s and says in one line what the creature does.
- Introduce each one on a guard before it reaches the squad. Level 1 plants hints in the office: damaged empty cells, a mumbled warning from the wounded prisoner, a scientist's note, a sealed lab door, the key causing level 2's problem.

Shared pieces to build once: grab and rescue, the telegraph layer, Watch, an automatic snap shot at a close attacker, the first-sighting slow-down, sound tells, hit and fade; later a tracker and doors.

## Key sources
- Romain Clavier on design intent (fog of war, avoiding swarms, flanking and retreating): https://blog.playstation.com/2023/05/25/aliens-dark-descent-combines-horror-and-strategy-to-create-a-bone-chilling-tactical-thriller/
- Reviews: PC Gamer https://www.pcgamer.com/aliens-dark-descent-review/ ; GamesRadar+ https://www.gamesradar.com/aliens-dark-descent-review ; GameTyrant https://gametyrant.com/news/aliens-dark-descent-review-tactical-terrifying-terrific ; Game Informer https://gameinformer.com/review/aliens-dark-descent/new-terrifying-potential
- Mechanics guides: https://gamepressure.com/aliens-dark-descent/how-to-reset-aggressiveness-level/ze10cee ; https://www.trueachievements.com/game/Aliens-Dark-Descent/walkthrough/2
- Human-enemy tension: Klei's alarm design for Invisible, Inc. https://gamedeveloper.com/design/game-design-deep-dive-alarm-systems-in-klei-s-i-invisible-inc-i- ; F.E.A.R.'s AI (barks make movement read as tactics) https://gdcvault.com/play/1013282/Three-States-and-a-Plan ; The Last of Us search behaviour https://gdcvault.com/play/1020338/The-Last-of-Us-Human
- Melee enemies: Alien: Isolation's AI https://www.gamedeveloper.com/design/the-perfect-organism-the-ai-of-alien-isolation ; telegraphing https://gamedeveloper.com/design/enemy-attacks-and-telegraphing
