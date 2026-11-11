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

## Graphics pass and more troops (Version 128)

Bryan, after the first playable: "Remember to have dozens of ai units running in too. The drafts you are sending me look
very barren and ugly. The graphics are very bad. If we can have something like Tiny Troopers but not as cute looking."
(A bright, chunky, busy look of our own; nothing copied from that game.)

- The ground is worked out point by point from its height and steepness: golden sand with ripples, wet sand at the water,
  layered rock on the steep faces, grass on the cliff tops and the base, worn earth in the draw; lit from the sun's side.
- `js/ddlook.js`, scenery: about 2,000 grass tufts, gorse and bushes on the tops, hedgerow trees, stones on the faces,
  stakes in the surf, sand lips round the shell holes, dropped crates and helmets, mine signs; at the base trucks, tents,
  fuel drums and a radio mast (these block the way and give cover); a pitched roof on the barracks.
- Beyond the map: a sky with cloud, ships on the horizon, barrage balloons, landing craft and 96 men going up the beaches
  either side (cheap instanced figures, looks only), three lines of surf, a painted moving sea.
- Daylight picture: more colour, no cold night shadows, less vignette, grain and glow (post.js, this map only).
- Soldiers drawn 30 % bigger, olive drab against the defenders' grey-blue, without the night levels' blue rim light.
- Other troops: five boats in the first wave (about 34 men besides the squads), then two boats of 6-8 every 9-15 s while
  fewer than 24 are alive; up to ~40 in play at once.
- Found on the way: the sea drew nearly black, then washed white: the ripple map and the distance haze both go wrong on
  that sheet here, so the sea has a painted surface and no haze.

Still plain: the bunkers and walls (flat concrete), the figures themselves (the Warehouse Yard's), no dust or water
splashes from shell bursts. Not measured: speed on a phone with ~90 figures.

## Bryan's second round (same day, also in Version 128)

"I don't like the hum in the background, and the audio is too modern sounding. It needs to fit the aesthetic of D-Day. The
troops should look bubblier and better drawn, show me some drafts of different character model. The turrets should have a
THUD THUD THUD sounding like a heavy machine gunner would. The first bunker should share the same hill going up to the
second bunker, just at the edge of the beach. I'd also like to add a new unit, radioman, which will unlock after the first
mission or two. He calls in artillery, airstrikes, and maybe even balloon (like in Battlefield 1). Make the camera much
closer to the units by default, like a third person for the full squad, think Full Spectrum Warrior. Also make sure the
camera is angled so the player can see the horizon. I'd like the camera semi-fixed to the team."

Built:
- Camera (`DD_CAM`, `ddCam` in ddplay.js): close behind the squad being played (zoom 8.5, 11 allowed here), low (about
  17°) with the picture moved down so the hill and the horizon are in; it keeps a little ahead of the squad's middle. A
  drag still moves the view and it eases back about 2 s after the finger lifts; pinch, twist and tilt work as before; Fit
  map gives the overview. It rides with the boat on the way in.
- The first bunker: on a shelf cut into the foot of the hill the nests stand on, right of the middle gate, at the beach's
  edge (`DD_LEDGE`), reached from the bottom of the draw. The pocket behind the left gate keeps a sandbag line and two men.
- Sound: no drone under the fight (that was the hum), more wind; mounted guns thud, about six heavy beats a second
  (`sfxShotDD` in audio.js); the BAR a slower, deeper bark; rifles the older semi-automatic's crack, pitched down, with a
  ping as an M1's clip goes; none of the Warehouse squad's radio talk here (their lines and words are modern).
  Still the same recordings underneath (no period recordings in the project yet): real M1, MG42 and BAR recordings, if
  free ones can be found, would do more than any of this.
- Character drafts: `docs/drafts/troops-sheet.jpg`, `troops-A.jpg`, `-B.jpg`, `-C.jpg`, `troops-gameview.jpg`, made by
  `tools/drafts/troops.html` (?opt=A|B|C|all, &top=1): rounded parts, a toon shade, an ink outline. A Bubble (big head,
  small round body), B Stocky (barrel chest, thick short limbs), C Lean toon (longer limbs, smaller head). The game's
  figures are unchanged until Bryan picks; the pick then needs the 21-bone animation fitted to it.

Not built, recorded: the radioman, a fifth type who unlocks after the first mission or two: he calls in artillery (a
barrage on a marked spot after a delay), air strikes (a pass along a line), and perhaps an observation balloon (sight over
a wide area while it's up, and it can be shot down). Questions for then: does he take a squad slot or come as a fifth man;
how often each call; whether the defenders get the same.

## Bryan's third round (Version 129)

"I think I like stocky the most, but lean looks good too. Let's go with stocky for now. The left side pill box needs to
share a path with the upper pill box. The mountain face runs along the path. The current mountain between them should be a
path running horizontally to both bases. A fence blocks all access and has to be climbed or blown up. A fence runs across
the beach blocking access to the paths and pillboxes. Climbing would hurt because of barbed wire. The units items are so
hard to see and they are not visible. [...] a squad shares an equipment menu. So the whole bar at the bottom where the
cards are currently, is a mix of the units selected. The names and unit stats on the top, and at the bottom, their
collective tools. If they have an rpg unit, and two medics, the player would see 1 rpg ready (used by rpg unit only) and
have a defibrillator (revive) and 2 (or however many) medic packs. The players with that skill/tool will only be able to
use that skill or tool. Smoke would also act the same, and the player would get 4x grenades per unit. Only the unit with
the grenade would use it."

Built:
- Stocky soldiers (figure.js: `STOCKY`, a flag `S` in the kit key on this map): the same skeleton and animation, each
  bone's parts thicker, the head, hands and boots bigger, the whole man a little wider than tall, and an ink outline
  (`figInk`: the mesh drawn again, back faces, pushed out). Not yet the draft's own helmet shapes and webbing.
- One path (`DD_LEDGE`, `ddPathH`): along the foot of the mountain's face at the beach's edge, from the first bunker at
  its west end (by the bottom of the draw) up 4 m to the second at its east end. The old shelf above it keeps two men.
- The wire (`ddwire`, 20 stretches of 5 m right across the beach in front of everything): climbing it costs 13-19 health
  ("Cut on the wire"), a grenade or a rocket blows a stretch open. The gates are gone: the gaps behind the wire are open.
- The squad's bar (`ddBar`, `DD_TOOLS`, `ddToolUse` in ddplay.js; `#sq`): the men of the squad being played along the top
  (role, name, health, what he's doing; a tap picks just him), and under them what they carry between them, added up, as
  big buttons: grenades, smoke, Bazooka rockets, medic kits, Revive. A tap gives the job to a man who has that item (one
  who isn't pinned or busy first) and aims it; afterwards the squad is selected again. Revive sends the medic to the
  nearest man down.

Open: one grenade a man for now (so a squad shows 4): Bryan's "4x grenades per unit" could mean four each. Whether the
bar should replace the cards in the Warehouse Yard too. Whether the path is what he pictured.

## Bryan's answers and the bunkers (Version 130)

One grenade a man (the squad shows 4). The wire alone is the barrier, no gates. The path is right. The squad's bar is
for D-Day only for now. And: "Make the bunkers interiors. Like the wall goes transparent when they get in there. Units are
only seen if looking from the front hole or entry way. When it becomes transparent because troops are inside, then the
units are fully visible."

Built: the two bunkers on the path and the heavy gun's emplacement are closed rooms (dday.js: `bk` on their `ddpb` walls):
walls to the roof, a firing slit along the front, open at the back. The side walls block sight and shots (`full`), so the
men inside are seen and hit only through the slit or the entry. With one of ours inside, the walls and roof of that bunker
go clear together (`ddFrame`, the roof's `userData.walls`). The camera sits a little higher over the squad so the bar
doesn't cover them (`DD_CAM` look 30, shift .09).

## Bryan's fourth round (Version 131)

"1) there needs to be a fixed gun up that first hill too. 2) unclear on how to cut fences. An RPG should have much longer
range but less accuracy from far away. So shooting one from the water to the first gun nest will be inaccurate. 3) there
should be a new unit that builds makeshift defenses under fire. Also, some ai units will build defenses when storming the
beach. 4) the pillboxes look bad. They can be designed better."

Built:
- A machine gun nest part way up the draw (`DD_SPOT.drawMG`, behind the sandbags at its second bend, firing down it), and
  a barrel on a tripod drawn at every gun's place.
- The wire: tap it, or the Blow wire button that shows in the squad's bar while the squad is on the beach near it: the
  nearest man with a grenade walks up and throws at that stretch (a rocket if nobody has a grenade); one blast opens about
  15 m. The label on it says so. Climbing still works and still cuts.
- The Bazooka reaches 90 m here (38 m elsewhere), and past 24 m its rocket strays, up to 17 cm for every metre beyond: from
  the waterline to the first bunker it lands 1.5 to 3.5 m off; from 20 m, dead on.
- The Engineer (`DD_ROLES.eng`: build.js's kit, three barricades; heavier armour): Barricade in the squad's bar, then tap
  where: he walks there and puts up heavy cover in 2.5 s. For now Bravo starts with one in its sharpshooter's place
  (`DD_CORE`), so he can be tried: Bryan to say whether he's a fifth man or takes someone's place.
- About one in six of the other troops is an engineer too: pinned on the sand, he digs in (a barricade in front of him, at
  most seven on the beach) and the others use it.
- The bunkers redrawn: board-marked, stained concrete, a front wall that leans back to a deep firing slit under a heavy
  lintel, piers, earth banked up the sides with turf, a thick roof with sandbags and a vent, the gun's barrel in the slit.
  They still go clear, all of it, with one of ours inside.

Found and fixed: with the low camera a tap near rising ground went to the wrong place (the wire tap landed 160 m away): the
tap's ray is now walked along the ground and halved (`toW` in scene.js). Taps near the cliffs in Versions 128 to 130 will
have been unreliable.


## Version 132 (Bryan, after 131)

Bryan: "Throwing and using items isn't clear. Also squad tracking is a bit sloppy. I feel like my camera was moving around by itself and selection was confusing. Also, the intro to the map doesn't feel right." Then, on my list: "Wrong camera, it should be behind the last units head inside. It should feel like they are under heavy fire approaching the beach. Maybe someone dies or a boat gets blown up. There should be multiple boats landing. There is no noice until they land. Nobody moves until the troops exit. They all pile out of the boat and wait, the should all be running to cover and engaging." "Maybe the camera shouldnt move unless dragged by the user. But i do want the camera to switch to the selected squad still." "The bunker on the left needs to be on the path. No wall divides the bunker on the left with the bunker on the right." "Artiellyer and another bunker are on top of the hill on the right too. Right now its empty."

Built:
- The ride in (`ddCam`, `ddRideFx`, `ddBoatHit`, `ddLandPlan`, `ddBoatsTick`): 17 s, the camera inside the squads' boat just behind the last man's head, looking over the others at the beach, rocking with the boat and jolting at near misses. Seven boats abreast (`ddBoat(dx,men,own,{y0,T,pw,doom})`); the one ahead and to the right is hit at 9.4 s and sinks with everyone in it. Machine gun tracers from the four bunkers into the water and onto the hulls (splashes: dday.js's `ddSplash`), shells in the sea, the diesel (audio.js, the 'truck' loop), the guns' thud, rounds on the hull. None of it hurts the squads' boat. Nothing is written over the picture meanwhile but the banners.
- The landing: each man runs from the ramp straight to cover on the sand (the squads' spots picked together as the ramp drops, `u.landDest`; the other troops by `ddNpcThink` at once), and the other boats' men fight from the moment their own ramps drop (the early `return` in `ddTick` is gone). The player has the squad as the last man leaves the ramp. For 8 s after it the squads take 0.55 of every hit and nobody is killed outright by a bullet (`dd.graceT`).
- The camera stays where the player puts it. It moves by itself only as they land (swinging out of the boat to the usual view, `dd.cam.k`) and when a squad is picked (`ddSelected`: a pan to it, and a banner saying which squad is the player's now). `DD_CAM.look`/`boat` are left over from the follow.
- The squad bar: under each tool, who carries it (a name, or "3 men carry one"); with a tool in hand a strip above the bar says what it is, whose it is, what a tap does and that a tap on the strip puts it away (`.sq-aim`), and his name tile is outlined white.
- The map: no concrete walls on the beach line (sandbags there instead); no earth banks between the two bunkers on the path; the path painted as one track from the draw's mouth past both. The top of the hill on the right is ground (`DD_TOP`, height 96, reached from the draw by the old nests' shelf; a rim of rock between it and the path): a third bunker at its south rim (`bk:'p3'`, `DD_SPOT.hillMG`, tag 'hill', a gunner and a rifleman) and an artillery piece behind sandbags (`ddgun` tag 'art', two crew, shelling the beach every 13 to 18 s until it's blown or its crew is down). Labels HILL BUNKER and ARTILLERY, a line in the objective list.
- Tests: `$SP/dd16.js [w h]` steps the ride and the landing with pictures; `dd15.js` the path, the hilltop and the aiming strip. The bot (`dd2.js`), two runs: won at 378 s with 7 lost and at 418 s with 13 lost (v131: 205 s, 3 lost), before the grace was added.

Not built: voices for the ride (a coxswain's shout), a man of the squads' own dying in the boat (Bryan's "maybe"; the boat beside them goes instead), range and blast rings while aiming beyond what the game already drew.

## Version 133

Bryan: "Let's make a fifth slot for engineer". Each squad is five: medic, gunner, sharpshooter, demolition, engineer (`DD_CORE`); Bravo has its sharpshooter back. The boat seats ten (rows 13 apart), the squad bar takes five names (its columns set in `ddBar`) and on a phone the tools are narrower with no owner line so seven fit.

## Version 134 (Bryan, on screenshots of 133)

"1) a little farther back on the boat and looking slightly from above. The camera can move around from this fixed spot so the player can look around. 2) the left side bunker is still there. Remove the circled part and make it a road, move the bunker more the right so it's at the center left of the map. 3) the top is blocked off by the reinforcements left. How about just three people emoji and a count 20/20 and it goes down. Also get rid of sneak and fit map."

- The ride's camera: above and behind the stern, looking a little down; a drag turns it from that spot (`dd.land.look`, read from how far the drag moved `camT`; `VB.z1` is out at sea until `ddAshore`).
- The block of rock he circled (the left mass's foot at dx 330-470) is gone (`DD_FACE`): a road along the top of the beach from the left edge to the draw's mouth, where it meets the path to the other bunkers (`ddRawH`, painted in `paintDDGround`). What he calls the left bunker was the old sandbag position in the left pocket: it's a real bunker now (`bk:'p0'`, `DD_SPOT.leftMG`, tag 'left': a machine gun and three riflemen) on that road at dx 300-384.
- The replacements chip is three heads and "20/20", top right (`#ddChip`, moved out of `#tl`). No Fit map or gait button on this map (css), and the squad that runs itself no longer sneaks.
- The bot won in 157 s with 2 lost: with the rock gone and five a squad it's a good deal easier than 132.

## Version 135

Bryan: "Get rid of the level name on top, it's just in the way. Maybe show it for the first five seconds. Maybe flash it in front of the screen. Chapter 1: D-Day". No objective box on this map (`ddObjUI`, hud.js); "Chapter 1: D-Day" in the middle of the screen for 5 s at the start (`bigText` with the class `chapter`), then the "Thirty seconds" banner.

## Version 136

Bryan: "The camera is really bad in the beginning. It gets stuck and moves very clunky, we can limit so the player can only see left to right. Also, the sounds of bullets hitting metal and helmets sound like a xylophone not bullet ricochet. The bullets should make a spark when hitting metal or a helmet."

- The ride's look-around turns left and right only, about 60 degrees each way, read straight from the finger (`ddLookBind`, `dd.land.look.to`) and eased. Version 134 read it from how far the map's own drag had moved the view, which stuck at that drag's limits.
- `sfxRicochet` (audio.js): a crack, the plate's knock and often a falling whine, made in code. On this map `sfxImpact` on metal uses it too. The recorded metal hit at random pitches was the xylophone.
- `ddSpark` (dday.js): a flash and five sparks in 3D where a round strikes steel: the boats' ramps and sides and now and then a helmet on the ride in, steel obstacles and wrecks in the fight. Helmet hits in the fight itself have no spark yet.

To come, with Bryan's script (he'll write it; the ride may get longer for it): "seeing a player in front get hit by a sniper, he takes his helmet off and looks at it and then gets sniped in the head."

## Version 137

Bryan: "The player doesn't need to destroy the barracks, just control it to win. The hill up should have a mg nest facing downwards. Can there be a blue highlight around each bunker or pill box when the team takes control of it. Every area under control of the ally is highlighted in very light transparent blue. Only the buildings and the borders of the allies territory. Maybe the ground can be very light blue. Show me a draft. Using equipment feels to complicated and clunky. Can the unit that is doing the action be highlighted orange. Like the outline of their body. Can medics heal automatically when they are not being shot out, or not pinned down. Artillery should be on the second hill and should rain down on the beach. A voice bubble from one of the lead units on the boat has a text bubble saying Move! Get off the beach!!, that will also be a script later on. He says this when they land and first step onto the beach. Have someone die in the boat on its way to the beach. I'm thinking of making it first person to the back player... Just like how Medal of Honor started it out. And then when the player moves forward he steps out of the first person and it turns to the moveable camera."

- The win: the barracks held (`ddZones`): nobody of theirs alive within 32 m of it and two of the squads' men within 14 m of its door for 4 s. Nobody comes out of it while one of ours is within 15 m of the door. Blowing it up still wins.
- Ground taken, a draft (`DD_ZONES`, `dd.held`, `ddDrawZones`): a place is ours once its defenders are down and one of ours has stood in it; a faint blue wash and a blue border on the ground (drawn on the overlay, so it lies over the men too), and its bunker turns blue (`DD.bk`). Nine places: the beach, the left bunker, the pillbox, the upper bunker, the hill bunker, the way up, the heavy gun, the artillery, the base.
- The man doing what the bar ordered is outlined in orange (`ddHot`, figure.js's `figInkHot`) until it's done: the tool in hand, a throw, a build, the wire, a revive.
- Medics by themselves (`ddMedics`): not pinned and not shot at for 3 s, a squad's medic goes to a downed man of his squad and mends anyone of it within 5 m, himself too, 5 HP a second.
- The artillery: two guns on the second hill's top (`DD_TOP2`, reached from the base), three crew; a salvo of three shells on the beach every 8 to 12 s until a gun is wrecked or the crew is down. The heavy gun fires out to sea more. The right hill keeps its bunker.
- The nest up the draw has bags on three sides and its label from the start. (My reading of "the hill up": the way up. If he meant the right hill's top, that's the bunker there.)
- The landing: "Move! Get off the beach!!" in a bubble over the first man onto the sand. A2 is killed in the boat at 12 s (a replacement comes for him). The ride is seen through the last man's eyes (`ddCam`), left and right to look; the view leaves him as he goes off the ramp.
- The bot won in 215 s with 4 lost.

## Version 138

Bryan: "get rid of the engineer for this round. He unlocks in the next level. Only 4 per squad." Four a squad again (medic, gunner, sharpshooter, demolition); `DD_ENG` false keeps the Engineer, his barricades and the other troops' digging in out until the next level.
