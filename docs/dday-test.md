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

## Version 139

Bryan: "I hit squad Alpha and tried to shoot a bazooka. Instead the whole team ran. We have to make sure when the tool icon is selected, no other action can be performed. I am thinking we should keep it on that action until all of it is used up. So a medic can run around and heal while a bazooka guy can unload on a location. When the player selects a location for a tool it should be a filled in circle. Orange for the to the rocket shows and orange area of intended impact. Same with grenades and when they land. Smoke could be a grey circle. Medic would be a deep green around the player targeted for a heal or revive. Revive didn't need to be an option, medics can automatically revive. If the player has a dead unit the medics can revive. It takes a lot longer than a heal and shouldn't be done in battle. The bunker's embrasure should be much larger, the player can see inside the bunker from the ground. But add more stationary machine tunes in each one, three on the bottom, three on the right, artillery units behind the upper right bunker, and two machine guns and a grander in the upper right bunker. Two sniper in the highest bunker looking down with a regular machine gun. A light machine gun nest at the top of the path in front of the highest bunker."

- A tool stays in hand (`dd.toolK`, `ddToolArm`, `ddToolKeep`, `ddToolEnd`, `ddToolFree`): every tap on the map uses it again, by whoever of the squad has one and is free, until none are left or it's put away (its button, the strip, another tool, a name tile, a team tab). While it's in hand a tap does nothing else (`ddTap`). What went wrong before: after the first rocket the whole squad was selected again, so the next tap was a move.
- Where it's going (`ddDrawTargets`): a filled circle from the order until it lands: orange the size of the blast for a rocket or a grenade, grey for smoke, deep green round the man a medic is going to.
- No Revive button. A squad's medic, when it's quiet round him (not pinned, not shot at for 3 s), also brings back a dead man of his squad: 12 s beside the body (`m.raise`, `ddRaise`, REVIVING n% over it), starting over if he's shot at. The replacement for a man who can be brought back holds off 32 s (`dd.queue`'s `body`); brought back, the replacement is cancelled and the pool gets it back. Not a man blown apart, the medic himself, or the man killed in the boat.
- Bunkers: a low wall and a tall opening you can see into (the dark panel behind the slit is gone, piers at the ends only). Guns: three in the left bunker, three in the pillbox and three in the upper bunker on the right, fanned out with a narrow swing each (`leftMGs`, `pillMGs`, `nests`), so a bunker covers about what its one gun did; the hill bunker two and a grenadier who lobs rifle grenades at whoever's within 43 m (`lob`); the back bunker at the top closed in like the others (`bk:'tp'`) with two snipers and its machine gun; a light machine gun in a sandbag nest at the top of the way up (`pathMG`). The artillery is on the hill behind the hill bunker, as since 137. My reading of "three on the bottom, three on the right" and of which bunker is the highest: his to correct.
- The bot won in 413 s with 13 lost (137: 215 s, 4 lost): fourteen machine guns now.

## Version 140

Bryan: "The pov camera should be the last man in the boat to the bottom right corner from above. So every unit is seen in the boat, not just the first two." The ride's camera is over the last man's shoulder at the boat's back right corner, a little above, looking down its length (`ddCam`); left and right to look, as before.

## Version 141: picking squads, one use a press, the scope, the Bazooka

Bryan, after Version 140: "I had a problem selecting squads. It would take a couple of presses. I don't like the 'throw/use as many as you can' idea with the equipment. Let's just make sure the player is able to clearly use a tool so they aren't spamming press. Maybe a press after using a tool doesn't do anything. They would double press to move towards it. Can we make a scoop emoji around the unit selected for that squad to attack? Can we draw a large bazooka and see the player actually use it, and watch a rocket go through the air?"

- Picking a squad: a team tab never deselects on this map (pressed on the squad already picked it used to clear the selection, so the next press picked it again: the "couple of presses"); pressed again it takes the camera to that squad (`ddGoSquad`). A tap on one of ours on the map is always his whole squad, never just him.
- Tools: one use a press again (Version 139's "stays in hand" is gone). The tool's button, then one tap on the map: he does it, the tool is put away and the squad is picked again (`ddToolKeep`). For 2.5 s after that a tap on the ground does nothing but say "Double tap to move." (taps on an enemy or one of ours still work); a double tap there moves the squad at once (`ddTap`, `dd.usedAt`, `dd.lastTap`).
- The scope: a red scope ring with cross-hairs on the man the squad you play was told to shoot (`u.focus`), drawn in `ddDrawTargets`. "Scoop emoji" read as a scope/cross-hair: Bryan to say if he meant something else.
- The Bazooka: a big M1 on this map (figure.js: a long open tube with a flared muzzle, a wooden shoulder stock, two grips, a sight), shouldered and aimed for 1.15 s before it fires (`PRPG.aim`, put back on leaving) and kept up a second after. The rocket is a 3D model with fins and a burning tail on a shallow arc, a white smoke trail behind it, a flash at the muzzle and the back-blast behind the man (dday.js's `ddRockets` from `ddFrame`).
- Test: `$SP/dd25.js` (tabs, one rocket a press, the ignored tap, the double tap), `$SP/dd26.js` (close-up pictures).

After it (Bryan: "The messages that show up on the screen should be all the way on top, to the left of the reinforcement count"; "when you select a squad, it shows you the direction they are facing?"): on this map the banner sits top left, beside the count (`body.dd #banner`), and each selected man's ring has an arrowhead in his team's colour the way he faces (overlay.js).

## Version 144: the phone on its side, first person in the boat

Bryan: "Can we make it work horizontal too? If I flip my phone sideways? Also, the view make it first person to the last unit in the boat."

- Landscape on a phone (`@media (orientation:landscape) and (max-height:540px)`, `body.dd` only, at the end of css/style.css): the map takes the whole screen; the title, status chip, hint line and Clear are hidden; Sound and Pause sit over the top right corner with the count beside them; the Alpha and Bravo tabs go down the left edge; the squad's men and tools share one row along the bottom (`#sq` as a grid), the aim strip above it. Only D-Day has this layout: the other levels are as before.
- The ride in is first person again, through the eyes of the last man in the boat (`ddCam`), with the left-right look as before. (Version 140's view from the back corner is gone.)
- Test: `$SP/dd31.js 844 390` (pictures of the ride, play and a tool in hand).

## Version 145: the counterattack, a second barracks, "Too far" at the finger

Bryan, on Version 144: the squad's menu on a wide screen "is perfectly laid out", horizontal should look like it; the scope "should be the size of the players upper torso"; "if something is too far, can a message pop up where the using is selecting. 'Too far' or 'Not in range'"; "Have a tank come out of the far base with 4 squads from the barracks to the right of the level's barracks"; "Make another large barrack directly behind the top bunker... Units regenerate from here too"; "The mission is 'take control of the beach' that shows on top for 5-10 seconds when the match starts".

- The phone on its side keeps the squad's bar as on a wide screen (men over tools with their names), not the one-row version of 144.
- The scope is the size of a man's upper body (`ddDrawTargets`).
- A refusal is said where the finger was: "Too far", "Not in range", "Too close" (`ddNote`, `dd.tapW` set in input.js's `tap`, `dd.notes`; from combat.js's `tooFar`, `throwNade` and `fireRPG`), as well as the bubble over the man.
- A second barracks behind the highest bunker (`DD_SPOT.barr2`, `door2`, tag 'barr2', 380 HP): the barracks' men come out of both in turn (`ddBarracks`), up to 8 at once; blown, it sends nobody.
- The counterattack (`ddCounter`, `dd.ctr`): the first time one of the squads' men is within 33 m of the barracks' door, a tank drives in from the right edge (`DD_SPOT.tankWay`, `ddTankSpawn`, `ddTankTick`, `dd.tank`) and four squads of four (tag 'counter') come out of the far base's barracks beyond the map's right edge (`barr3`, `door3`, scenery). The tank is not a unit: bullets do nothing to it, it shells the nearest of ours it has a line to every 5.5-7.5 s, and blasts hurt it (`ddTankHit` from `ddBlast`: two close rockets, or three). The barracks can't be held while it's alive nearby.
- "Mission: take control of the beach" in the banner for 8 s at the start, then "Thirty seconds to the beach!".
- For later (Bryan): "Parts of buildings can collapse and kill people within it. Bunkers don't collapse. We can talk about that later." Open question to him: the scope on gun nests, tanks and buildings (wanted there too, or seen there by mistake?).
- Test: `$SP/dd33.js`.

## Version 146: anyone picks a man up, quicker turnover, 30 men, the squad plainly shown, a rocket for the tank

Bryan's answers on 145: the counterattack starts "when you are near the barracks" (as built); the scope on a tank only if "our units use explosives only for heavily armored vehicles when targeted? Like a rocket?"; "I wonder if we should make a long press a quick way for a rocket strike or suppression" (a hold on an enemy already suppresses, input.js; not extended yet). Then: "When a user is downed, anyone can pick them up. It just take a while for non medics. I'm wondering they should be cycled through faster - like die off. And increase the troops to 30 for this match. I would also like the squad to be seen more predominantly, right now I was getting confused with what squad I was using and where they were."

- Anyone gets a downed man up: 8 s beside him for a rifleman (`DD_REVIVE`, combat.js's revive), a medic as quick as before. With no medic left in the squad the nearest man who isn't being shot at goes by himself (`ddHelpers`, `u.helpGo`); a tap on the downed man still sends whoever's selected.
- Quicker turnover: 20 s down (`DD_BLEED`), 10 s critical (`DD_CRIT`), then dead; his replacement 4-7 s later, 14 s if the squad's medic might still raise him (it was 32).
- 30 replacements (`DD_POOL`).
- The squad being played: a filled disc and thick ring in its colour under each man and a marker over his head, the other squad a thin ring (overlay.js); its tab filled in its colour (`.tab.ddon`) and "ALPHA SQUAD" / "BRAVO SQUAD" over the bar (`#sq[data-team]::before`).
- A tap on the tank sends a rocket from the squad's Bazooka man (a grenade if that's all there is and he's near enough), with the scope on the tank meanwhile (`ddTap`, `dd.tankAim`).
- Test: `$SP/dd34.js` (pool 30; with no medic a helper set off and had him up at 18.5 s; left alone, critical at 20 s and dead at 30 s).

## Version 147: full screen, the bar at the bottom

Bryan: "I do not like the black border at all. Also the menu is way too up on the screen to work with." Read as the dark page frame round the map (title bar, side padding, hint line, tabs row) that pushed the squad's bar up. On D-Day the map now fills the screen in both orientations (`body.dd` rules at the end of css/style.css, no media query): no title, status chip, hint line or Clear; Sound and Pause over the top right corner; the Alpha and Bravo tabs down the left edge; the squad's bar at the very bottom. The dark edge over the picture is gone too (`#stage::after` off, post.js's vignette 0 in dd). If he meant the black outline on the soldiers, that's figure.js's `figInk`.

## The first military base: draft (not built)

Bryan, after Version 147: "Instead of ending the battle. What about adding a full military after the tank? The path can continue down that road is and that can be the first military base. Two more tanks, and 30 more soldiers at the base. Please draw me a draft of the base first."

Draft: `docs/drafts/dday-base-draft.png` (source `tools/drafts/dday-base.html`, a top-down plan, north up). The road runs on east from the barracks to a checkpoint and the base's west gate. An earth bank and trench along the west face with two watchtowers, wire round the other three sides; inside: two barracks, mortar pits, a fuel dump that blows up, a parade ground, the motor pool, an ammo store, an anti-aircraft gun, and the command post at the east end (hold it to win). Tank 1 dug in behind the gate covering the road, Tank 2 in the motor pool, coming out when the gate falls. 30 men: 3 at the checkpoint, 2 in the towers, 8 in the trenches, 6 by the barracks, 2 on the mortars, 2 in the motor pool, 2 on the AA gun, 5 at the command post. Three ways in: A the road, B a sunken lane north to a gap in the wire behind the barracks, C an orchard south to the motor pool's back gate. Waiting for Bryan's changes before building; it needs the map made longer to the east.

## Version 148: the first military base (built)

Bryan's answers on the draft: "One hard front but keep the other options and secondary optional entries. The enemy will be still sending troops to attack. There is no sneaking in this match"; "Barracks keeps sending men out"; no refill of replacements ("the game is basically a limit on numbers (like battlefield tickets)"); "Ammo drop at the captured barracks".

- The battle doesn't end at the barracks on the hill. Held (two men at the door 4 s, nobody of theirs within 20 m), it becomes an ammo drop (`ddBaseOpen` in the new `js/ddbase.js`) and the road runs on east along the top to the base.
- The map: the top is real, flat ground east of the old play area now (dday.js's `ddBuildH`, x 1290 on, y -330 and north; `EAST_X` is `NAV_W`; the edge-of-battle rule lets men past x 1200 on the top). The base is x 1300-1790, y -752 to -462 (`DB`): about 49 m by 29 m, smaller than the draft because the nav grid ends at x 1800 and the map's north edge is the base's north fence. Everything else out there is blocked (the ground drawn east of x 1400 is the mirror image of the battle next door). The mirror copies of props are hidden where the base stands.
- The west face is the hard front: an earth bank with a trench behind it, the gate in the middle, a checkpoint in front, a tank dug in behind. The other ways in: the wire at the north and south ends of that face (climb it, or blow it), and a gap in the south wire by the south-west corner. The draft's sunken lane round the north and the orchard round the south aren't there: there is no ground to put them on.
- Inside: barracks A and B (380 HP each, a man out of one of them every 10-15 s toward the squads, up to 7 at once, until blown or ours are within 15 m of the door), two mortars, a fuel dump (50 HP: it goes up, hurting theirs within 12 m and any tank beside it), the motor pool with two lorries, an ammo store, an anti-aircraft gun, the command post at the east end.
- 30 men (`ddBaseGarrison`, posted when the counterattack starts): 3 at the checkpoint, 2 snipers up the towers, 8 in the trench, 6 by the barracks, 2 on the mortars, 2 at the motor pool, 2 on the AA gun, 5 at the command post. Two more tanks: one dug in behind the gate (fires out to 40 m), one in the motor pool that rolls out to the gate once 3 or fewer of the west face's men are left or one of ours is inside. Tanks are a list now (`dd.tanks`, `ddTankSpawn(o)`, `ddTanksUp`).
- The win: two of ours at the command post's door for 4 s with none of theirs within 24 m and no tank within 34 m (`ddBaseTick`).
- The squad that runs itself and the other troops carry on east once the barracks is ours (`ddSquadEast`, `ddNpcEast`).
- Test: `$SP/dd40.js` (the ground, paths, 30 men, three tanks, pictures), `$SP/dd41.js` (the barracks held, the ammo drop, the camera's bounds, men out of the barracks, the second tank, a tank knocked out, the fuel dump, the command post held: won). Not run: a whole battle played through by the bot, so how hard the base is isn't known.

## Version 149

Bryan: "Can the camera pan to the unit farthest ahead. Also, can the units have icons over their head with what unit type they are?"

- Picking a squad (its tab, pressing the tab again, or a tap on one of its men) pans to that squad's man who is furthest ahead, not the squad's middle: furthest north on the beach and up the draw, furthest east once on the top. The camera still never follows by itself.
- A round badge over every squad man's head with his role: a cross (medic), a belt of rounds (gunner), a scope (sharpshooter), a rocket (demolition). Filled in the squad's colour with a pointer for the squad being played, an outline for the other squad. Not on the other troops or the enemy.

## Version 150

Bryan, on the mock-up: "Let's make the change and see how it feels". The Alpha and Bravo tabs are at the bottom left, stacked just above the squad's bar, in both orientations.

## Version 151

Bryan: "I saw a sniper shoot but got the too far sign." A shot (or suppress) order: if anyone in the squad can fire on the target, nothing shows at the finger; each man who can't reach says "Too far" over his own head. Only when nobody can does "Too far" show at the finger (once, no bubbles). A tool (bazooka, grenade, smoke) only ever reports for the tool's own user.

## Version 152

Bryan: "If the soldiers can get too cover to shoot they won't move on their own. The player would have to then move them up to shoot. From each area the player controls, that's where the units will respawn from. So reinforcements come quicker. Crank up the reinforcements to 50 units. The upper right barracks is awkward to turn too. Can we make it more direct on the path? Or within the mountain."

- A shoot or suppress order moves nobody. A man fires from where he stands, or says "Too far" (out of range) or "No clear shot" (in range, something in the way) over his head. If nobody can, the finger says it once.
- Replacements come on foot out of the held place nearest the squad's men who are ashore: the left bunker, the pillbox, the upper bunker, the hill bunker, the way up, the heavy gun, the artillery, the barracks. With nothing held nearer than the waterline, a boat as before. The banner says where he comes from.
- The pool is 50.
- The hill's barracks (the one that opens the road to their base) stood far to the right along the top. It now stands straight ahead where the way up comes out, beside the other barracks behind the top bunker. Not built: a barracks set into the mountain.

## Version 153

Bryan, after 152: "my troops are dying at a much higher rate. AI units aren't moving up, and medics don't appear to be reviving/healing on their own when giving an opportunity."

- Found: with the barracks moved to the top of the way up, "near the barracks" was true as soon as the squads came out on top, so the tank, sixteen men and the base's garrison arrived while the top bunker, the cannon and both barracks were still in the fight. The counterattack now waits until the top's own guns are down to one, or a man is at the barracks' door.
- Medics went to a downed man only after 3 s without being shot at, which in a fight is never. Now only being pinned stops them. When it's quiet they also patch up a squad mate under 55 HP (one kit, kept to the last but one). They never healed men who were up before this.
- Not found: a crash, or a change in how the other troops advance. Hands-off test battles on 150, 151 and 152 differ more from run to run than from version to version.

## Version 154

Bryan: "Bullets go through the hill at the top. Enemies can shoot right through it. The bunker on top of the first hill, on the right, should be positioned better so it can shoot down the path onto the beach and the beach itself. Draw me a draft."

- The ground now stops bullets and sight on this map. Before, rock only stopped feet. Measured per fixed gun: the bunkers at beach level see exactly what they saw; the hill bunker was hitting 77-82% of the beach in its reach through the rock rim in front of it and now hits none.
- Draft, not built: `docs/drafts/dday-hill-bunker-draft.png`. The hilltop carried about 4 m south to the cliff's edge and the bunker put on that lip, three guns (one down the path, two on the beach): 87% of the path and 99% of the beach in a 42 m reach, worked out from the terrain. Questions for Bryan: its reach, whether the upper bunker below stays, whether the grenadier stays.

## Version 155

Bryan's answers to the hill bunker draft: "1) longer but much more inaccurate after 42m. 2) that can stay. 3) yes."

- Built as drawn: the hilltop carried south to the cliff's edge and the bunker on that lip, over the upper bunker and the path. Three guns (one down the path, two on the beach), the grenadier behind them.
- Its guns reach 70 m. Past 42 m they lose a lot of accuracy (measured: 36% at 30 m, the 5% floor at 60 m, on a man in the open).
- The upper bunker below it stays as it was.

## Version 156: the camera stays with who you picked

Bryan: "when a player's name is selected in the squad menu, can the camera go to them and track them. The camera should go to the squad or player selected and then track that team or unit until the player moves the camera."

- Picking a squad (its tab, a tap on one of its men) sends the camera to its man furthest ahead, as before, and now it stays with him as the squad moves.
- Tapping a man's name in the squad bar selects just him, sends the camera to him and follows him. Tapping his name again goes back to the squad.
- Dragging the map lets go: the camera stays where you put it until the next pick. Pinching or turning the view doesn't let go.
- If the man being followed dies, the camera goes back to following his squad.
- Not followed from the landing: the first pick starts it (tap the squad's tab again to start following the squad you're already playing).

## After the battle, the base, the barracks: Bryan's answers and the draft (not built)

Draft picture: `docs/drafts/dday-after-battle-draft.png` (three phone screens: the report, the base, the barracks).

Bryan's answers (after Version 156):
- The report shows the two squads the player ended with, standing, stats growing above them; the dead are shown too.
- Stats: kills, revives, guns/bunkers knocked out, XP and level-ups. One **unit** MVP (not a squad). Open: may a dead man be MVP?
- Whoever the player ends with is the roster. The dead stay dead, gone for good with their equipment, unless a man of the same class swaps gear with the dead man (only with a dead man, only the same class).
- Rifleman: Bryan asks what his special would be; if added he'd take the Sharpshooter's place in the starting four and the Sharpshooter becomes a later unlock. Open.
- Stats shown as bars to the right of the unit, the unit's body on a stand like a character select: Health, Aim, Speed, Bravery. All rise a little per level; some units start better. Special traits with their own description: Nerves of Steel (never pinned), Double Life (two health bars), Marathon Runner (bonus speed), 20/20 (bonus aim).
- Upgraded weapons from the start on some: a Gunner with a minigun, a Sharpshooter with a .50 cal, a Demo with a guided rocket, a Medic with a dart gun.
- Lots of extra equipment per class. Some can be saved and replicated in the armory; some exist only while the man carrying it stays alive.
- The base is the one taken; the beach is no longer part of the map.
- Recruits are unlimited and start at the lowest level available (after chapter 1 that's level 2, and so on). Special-equipment troops should cost something: Bryan's idea, a Medal of Honor awarded each match unlocks them. Open: one every match with the MVP?
- Armory sharing within a class; grenades and smoke for everyone.
- Vehicles: after this round.

### Draft 2 (Bryan's sketches)

`docs/drafts/dday-after-battle-draft-2.png`; his two notebook pages are `docs/drafts/dday-barracks-sketch-1.jpg` and `-2.jpg`.

Bryan, on draft 1: each squad lines up diagonally across from the other; the stats look fine; then a bird's-eye view of the base with Armory, Barracks and Vehicle Depot each over its own building. The barracks from his sketches:
- Top: Alpha and Bravo rows of four slots showing unit types; an empty one is an open slot (+).
- Click a unit: name and type, the man on a stand, level and rank under him, stats and equipment to the right, two buttons: Reserve (he goes to the reserve pool) and Replace (goes to the recruits).
- Recruits: grey boxes, a small gold star top right if they have something special. Reserve: green boxes with type and level, a gold star for special equipment.

### Draft 3: inside the barracks

`docs/drafts/dday-after-battle-draft-3.png` (the bunk room is a 3D scene built for the draft by `tools/drafts/dday-barracks-room.js`, run from the scratchpad harness).

Bryan, on draft 2: "Take" should be "Recruit". Equipment can be changed from within the barracks, but only equipment from reserves, squad mates, or equipment placed in the armory (saved for later by the player, like a supply chest in Kingdom Come: Deliverance). Going into the barracks should look like the inside of the barracks: a line of bunks with each unit standing in front of his bunk, his equipment laid out on a trunk to his right; pressing a piece of equipment changes it out.

### Draft 4: Alpha left, Bravo right

`docs/drafts/dday-after-battle-draft-4.png` (room: `tools/drafts/dday-barracks-room.js`, which swaps `figKitKey` so a man with `atEase` has no rifle in his hands).

Bryan, on draft 3: Alpha's bunks on the left side, Bravo's on the right. Along the top, large squares with the unit type's icon instead of names; when one is chosen his name appears above him. The men stand at ease: fidgeting with their hands, stretching and so on. The gun lies across the bunk, and the change-equipment menu appears under the man's feet and across to under the gun.

### Draft 5: two more looks for the barracks

`docs/drafts/dday-after-battle-draft-5.png` (`tools/drafts/dday-barracks-room.js B|C`, run from the scratchpad harness; hanging spot lamps with shadows, the game's own lights off for the shot).

Bryan, on draft 4: "This works, but I think it could look better. Can you give me another version or two before we commit?"
- Version B: a wooden hut (plank walls and floor, roof beams, hanging lamps, a stove, a flag and notice board), bunks head to the wall as in draft 4.
- Version C: a painted hut, darker, bunks lengthwise along the walls; the chosen man's view is square on to his bunk like a character select, the gun in full view along the lower bunk above its slot in the equipment bar.
Draft notes: a figure's mesh needs `frustumCulled=false` for a camera other than the game's, and the draft holds the men at the floor's height.
