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
