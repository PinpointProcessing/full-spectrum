# Drafts after v117: the run, and the Queen going into the tunnel

Bryan, after v117: "The units run on the bridge pretty awkwardly. There legs move but the upper part of their body is stiff. The
monsters walk on top of each other when going into the bridge. It doesn't need to be so many, maybe one giant Queen and some
babies. Also, make sure the legs aren't seen when it goes into the bridge. Wana show me some drafts?"

Read as: the things that crawl into the tunnel's mouth at the end of the bridge, the first time the squad crosses it (road.js's
'see' phase). Nothing below is in the game yet: these are drawn with the game's own renderer, lights and post-processing
(`tools/drafts/run.js` and `run-page.js`, `queen.js` and `queen-page.js`, put together by `compose.py`; film grain off in the
Queen drafts so the animations stay small). Pick one of each (or say what to change) and it goes in.

## The run

Why it looks stiff now (figure.js): while running, the hips' bob and twist are part of the pose the body eases toward, and at four
steps a second the easing takes about half of the bob away and puts it late; the chest turns back almost all of the hips' twist,
so the shoulders hardly move; the rifle is fixed to the chest with both hands on it, so the arms don't move either. Only the legs
do. In both drafts the movement that repeats with each stride goes on top of the eased pose, so nothing eases it away.

- **A · combat run** (my pick): both hands on the rifle, carried lower across his front, the muzzle down and out to the left
  (now it's across his chest, the muzzle up). The body does the work: the hips drop about 11 cm at each footfall and rise in the
  stride, they twist about 14° with the legs and the shoulders twist back about 14° the other way (so the rifle swings a little
  side to side), the weight shifts over the foot that's down, the chest dips at each footfall, the rifle bounces a moment after
  it, the lean is a little deeper (17°), and the head stays steady, looking ahead.
- **B · sprint**: the same body with more of it (a 13 cm drop, 16° and 18° of twist, a 22° lean); the rifle in his right hand
  down at his side, the muzzle forward and down, swinging a little; his left arm pumping.

A keeps the squad looking like soldiers moving through danger. B reads more athletic, but from the game's camera on the walk across
(from the south) his pumping left arm is mostly behind his body. Either would be for everyone armed who runs, the hostiles too.

Pictures (the soldier from three-quarters in front, one stride in 16 frames; from the side, the way the walk sees them; and the
four two by two at the game's own camera for the walk across, real speed):
- `drafts/run-sheet.jpg`: every other frame of one stride, Now / A / B.
- `drafts/run-front.mp4`, `drafts/run-side.mp4` (half speed), `drafts/run-game.mp4` (real speed): Now, A and B one above the other.

## The Queen and her babies

What goes wrong now (road.js's `CENTI_SET` and `CENTI_PATH`, creatures.js's `crPoseCentiCore`): five big young (1.8 to 2.4 times
their size elsewhere) on paths that meet at the arch, under a second apart, so they pile up there. Their legs reach for the ground
at height 0, not the surface they're on, so high up they swing out to a fixed reach "down" along their own up: on the roof that's
up through it and out of the hill over the mouth, on the hill they dig into it, over the headwall's top they wave in the air. And
the paths sit too close to the surfaces (on the roof the body is half in it).

In both drafts:
- One **Queen**: the Brood Mother's kind (her dark colours, the spines on her legs) at 85 % of her size, about 12 m long and nearly
  2 m across. And five **babies**: her young at 0.85 to 1.1 of the size the squad fights in the Headquarters and the tunnel, about
  3 to 4 m long.
- Every path is the surface's own outline moved out by the creature's height off it, so the body rides clear of the hill, the
  headwall's top and face, the arch and the roof. Each foot goes on the surface under its own segment (the hill's ground, the
  face, the roof, the tunnel's walls), and a foot that would land inside rock or concrete (past a corner) is drawn back along the
  leg to where it meets it. **No leg goes through the hill, the headwall or the roof.**
- Each one has a lane and a time of its own, so none crosses another. The Queen comes over the middle (a little to the right of
  the work light over the mouth), goes down the face, curls under the arch and goes in along the roof upside down. The babies come
  down the face beside the opening and go round its edge into the tunnel along its side walls, sideways, or come over the top
  behind her and go in along the roof.

- **A · the Queen first**: she comes over the hill and in (about 6 s for all of her); as her back half goes in, three babies come
  down the face beside the opening, two on the right and one on the left over the bus, and go in along the side walls; then two
  more over the top behind her. About 10 s, as long as now.
- **B · the babies first**: the five pour over the headwall in under 2 s, in their lanes; then she comes up to the edge, rears up
  over it with her jaws open (about 2 s), and comes down and in, faster. About 11 s.

The camera: the game's view of the mouth from the bridge cuts off just above the headwall, so B's rearing would be out of the
picture. In the drafts it's raised a little (the picture moved down, as on the walk across). That's part of the proposal.

Pictures (the game's view, raised; and a closer one from higher up and to the side, where the legs used to come through):
- `drafts/queen-game-sheet.jpg`: a frame a second, Now / A / B.
- `drafts/queen-close-sheet.jpg`: the same for A and B from closer.
- `drafts/queen-now-game.mp4`, `queen-A-game.mp4`, `queen-B-game.mp4`, `queen-A-close.mp4`, `queen-B-close.mp4`.

### Questions

1. A or B for each (the run, the Queen)?
2. Who is she? She goes into the tunnel the squad then fights through (her young asleep among the wrecks). My suggestion: for now
   she only goes in and on, deep into the hill, and she's met later (her own level, or Level 4's Crawler becomes her). Or should
   the squad meet her soon, in the tunnel or in Level 4?
3. Five babies the right number?
