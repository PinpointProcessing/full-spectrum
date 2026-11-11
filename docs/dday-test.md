# D-Day test game (to build when Bryan's back)

Bryan, after v125: "I want to try something new when I return. I want to build a D-Day test game. Let's see if that works
better than what we currently have. Don't delete what we currently have."

His brief:
- Two teams of four, each with a medic, a gunner, a sniper and an anti-tank soldier.
- They start in a landing craft that has reached the beach.
- Pillboxes on the slope, and hills with cover to run up.
- Dozens of other allied NPC troops landing too.
- Setting undecided: the Pacific (Japan) or Normandy.

Plan (my proposal):
- A separate page (e.g. `dday.html`) with its own folder of scripts. Warehouse Yard stays as it is.
- Reuse what already works: the squad controls, cover, pathfinding, the soldier figures, post-processing, sound and voices.
- Setting: Normandy first (a wide beach, beach obstacles, a seawall, bluffs with pillboxes and trenches, landing craft coming
  in), our own invented sector, not any real game's or film's.
- Open question for Bryan: whether this is a quick test in the current engine or the first Godot test (the Godot scene was
  already next on the list).

## Bryan's breakdown and drawing (after v125, 11 Nov)

His answers: Normandy. The NPC allies fight, but couldn't win without the player. The current engine first (Godot later),
"but I would also like to enhance our graphics as much as possible".

His drawing of the first map: `docs/dday-map-draft.jpg` (portrait, the sea at the bottom). My reading of it, bottom to top:
- Water, then the beach: coils of barbed wire on the left, a deep shell hole, a hole with four men sheltering in it, a
  little hole on the right, and dark obstacles low on the left.
- A line across the top of the beach: a gate at the far left, a run of sandbags, two stretches of concrete wall with a gate
  beside them in the middle, then a mountain rock wall running off to the right.
- Behind the left gate and the sandbags: a pillbox with a machine gun, facing the beach.
- From the middle gate a way up between rock: "Mountain Face" on its left, more rock or slope on its right; it climbs
  diagonally up and to the left.
- On the right, above the rock wall, a bunker with two machine gun nests covering the beach and the gate.
- Upper left: a heavy gun in an emplacement, its barrel pointing down at the beach.
- Along the top: a long position with a sniper at its left end, a cannon in the middle and a machine gun at its right end.
- Top right: the barracks ("troop gather") and, below it, artillery: mortars.

His rules:
- Copies of the map on both sides so it looks like a large battle; the far left and right are visuals only, do no harm to the
  player and can't be played in. Wandering too far out darkens the screen with a warning; more than 10 s out and the unit dies.
- Two squads of four, always full: when a man dies, a fresh one who has just landed joins, with a random type, name and
  stats/personality.
- The screams and yells already in the game are used here; and new voices, screaming in battle the way actors do in a war
  film (original lines, our own voices).
- Changing squad moves the camera to it. The squad not being played runs itself: it doesn't advance "unless everyone is
  dead" and then slowly; it can use special items and grenades, rarely, and more the longer the player ignores it.

Checked: the voice tool (Zonos, its model, the scream reference) still runs in this environment, so new voices can be made.

## Bryan's nine answers (11 Nov)

1. The only way up is the path. The rock face is too steep to climb. The gates are passable: climbed or destroyed.
2. The match ends when the barracks is destroyed. The top of the hill is a moderately sized flat base; the barracks keeps
   sending troops down to the fight until it's destroyed. The base becomes the player's.
3. 20 replacement troops. No tutorial here (a boot camp level will come before it).
4. Replacements: random, but a missing type is filled first (demolition man / anti-tank, assault / gunner, medic,
   sharpshooter). My recommendation, built: fill a missing type first, random only when all four are there.
5. The squad that runs itself: "enemies in front of them" dead before it moves.
6. New screaming voices: a follow-up. For now the screams of men dying, bullets, explosions, machine guns and ambience
   already in the game.
7. A man can be killed outright by a headshot or a blast dead on. Graphic: limbs and body parts fly off, blood, "war is hell".
8. The graphics plan is fine; the day goes by as the level advances (evening at the top of the hill).
9. The kind of level in Medal of Honor: Allied Assault, with our own rules, models and map: start on a transport boat,
   bullets overhead, bombs in the water, a close camera; maybe a man or two dies before the beach, or a boat is hit and
   they swim. "The intro part does not negate units for the player." A small script for the ride in: a follow-up.

## The first playable (v126 code, published as Version 127)

Intro card: "D-Day test · Normandy". Nothing of the Warehouse Yard was removed. Code: `js/dday.js` (the map and its look)
and `js/ddplay.js` (the rules); the engine's hooks are listed in CLAUDE.md.

What's in:
- The map from the drawing, with real height (the first map here with it): the beach, shell holes and steel obstacles, wire,
  the line of gate / sandbags / concrete / gate, the pillbox behind the left gate, the draw up between the rock (the only
  way up), the two nests on the right, the heavy gun, the long position with sniper, cannon and machine gun, the mortars,
  the barracks. Mirror copies of the land either side, sea to the horizon, a sky that goes from grey dawn to a warm evening
  as the squads climb.
- Landing craft: the two squads ride in together (nobody can be hurt on the ride yet), other boats either side, more waves
  every 16-26 s.
- Two squads of four (medic, gunner with a BAR, sharpshooter with a Springfield, demolition man with a Bazooka, 4 rockets),
  random names and one trait each (steady, sharp-eyed, quick, tough, green, hothead, careful, old hand).
- One squad is played; picking the other (its tab or one of its men) changes over and the camera goes to it. The other runs
  itself: gets its own wounded up, fights, moves up only when nobody's left in front of it and never more than about 17 m
  ahead of the squad being played, and uses a rocket, a grenade or smoke now and then, more often the longer it's left.
- A man killed (bled out, a headshot: 4 % of hits, a blast of 70+ on him) leaves the squad; a replacement lands 5-8 s
  later in a boat near his squad and runs up to it, while the 20 last. Missing type first.
- Other troops (grey rings, not selectable) land and fight but hold at lines behind what the squads have opened.
- Defenders: 32 to start, dug in (they take 28 % less), the guns reach further than rifles; the barracks sends a man down
  every 8-12 s (at most 9 at a time) until it's destroyed. Mortars, the heavy gun and the cannon shell the beach with a
  red INCOMING circle while they're crewed.
- Gates and the wire blow open with a grenade or a rocket; the guns can be wrecked; the barracks takes four blasts.
- Gore: blood, and body parts thrown from a blast dead on.
- Off the map's sides: the screen darkens with "Turn back" and a count; at 10 s the man is lost.
- Lost when nobody's left standing and nobody's coming.

Tested headless: loads with no errors; the landing; taps land where aimed on the hill (five spots, exact); squad switch;
the off-map count and death at 10.0 s; replacements arriving and joining; a gate blown and the way open; the loss screen
and "Land again"; Level 1 afterwards (height hook off, weapon names back). A reckless bot playing Alpha (moves only, a hop
every 40 s at most) won in 4 min 10 s with 6 of the squads' men killed and 50 of the other troops: so it can be won, and
it kills. Not judged yet: pacing with a real player, performance on a phone (up to ~70 figures), sound mix.

Not in yet (follow-ups): the ride-in script (men lost before the beach, a boat hit, swimming ashore), the new screaming
voices, enemy vehicles, a report with XP, saves.
