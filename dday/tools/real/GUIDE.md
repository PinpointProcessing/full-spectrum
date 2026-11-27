# The real-hardware draft (Version 246): rules for whoever models a piece

Bryan sent a screenshot of another WWII game (a first-person view from a bunker behind a machine gun: a correctly shaped gun in dark steel with a
wooden butt, hands on it, a plank shelf, the beach beyond) and asked: "Can you make the vehicles and stationary weapons look more real? Look at
the example I attached. Graphics like this would be awesome". Today they are a few boxes and cylinders (pictures: the scratchpad's
`veh/before-*.jpg`). The reference picture: `/root/.claude/uploads/06534f05-c23e-508f-8c0c-c1774a77e081/d14ba960-image.png` (look at it; do not copy
that game's art: we model the real historical hardware ourselves).

The bar: someone who knows the real thing recognises it at a glance from its silhouette and its parts, from the battle's camera (high, 30 to 60
units away, the piece 60 to 150 px across on a phone) and close up (a few units away). Right proportions, the parts that make its outline, worn
paint and steel that catch the light. Not a toy, not a stack of boxes.

## Where things are
- `js/ddreal.js`: the kit (read its top comment and the builder) and the first finished piece, `ddrMG42` (the German machine gun on its mount):
  the standard to match for part count, proportion and finish.
- Your own file (one each, already loaded by index.html after ddreal.js): `js/ddrart.js` (guns and mortars), `js/ddrtank.js` (tanks),
  `js/ddrveh.js` (trucks, cars, the landing craft). Put everything you write there: your builders, extra colours, pictures and helpers.
  **Do not edit `js/ddreal.js`, index.html or any other game file** (three people work at once; I merge and wire the models in afterwards).
  If the kit lacks something, add a helper in your own file and say so in your report.
- Plain scripts in one global scope, no modules, no build step, three.js r128 (global `THREE`). Prefix every global you add with `ddr`
  plus your area (`ddrArt...`, `ddrTank...`, `ddrVeh...`) so nothing collides.

## The kit in short
- Frame of every model: **+x the way it points, +y up, +z its right; the origin on the ground** (under its pivot or its middle). 1 unit = 10 cm.
- `const B=ddrB(lod)`: a builder. `lod` 0 = the battle's camera (few sides, plain boxes), 1 = close up (rounded edges, more sides, small parts).
  Write each model once with `B.lod` deciding the small stuff. Parts go in by **material key** and **colour** (a hex number, the colour it should
  look): `B.box(mk,c,w,h,d,x,y,z,rx,ry,rz)`, `B.rbox(mk,c,w,h,d,r,x,y,z,rx,ry,rz)` (edges rounded at lod 1), `B.tube(mk,c,[a],[b],ra,rb,n)`
  (a bar between two points), `B.cyl(mk,c,r,len,x,y,z,'x'|'y'|'z',n,r2)`, `B.lathe(mk,c,[[t,r],...],x,y,z,axis,n)` (a turned shape: barrels,
  wheels, drums), `B.ext(mk,c,[[x,y],...],th,x,y,z,rx,ry,rz,bev)` (an outline pushed through: side plates, shields, stocks, hull sides),
  `B.ball`, `B.torus`, `B.put(mk,geometry,c,x,y,z,rx,ry,rz,sx,sy,sz)` (any geometry), `B.wheel(col,r,w,x,y,z,{dual,rim,n})` (a tyre on its rim,
  the axle along z), `B.decal(cell,w,h,x,y,z,rx,ry,rz)` (a painted mark: cells in `DDR_MARK`: star, starc, cross, redx, usa, wh, pa, tac, n3,
  stripe), `B.both(s=>...)` (s = -1 and 1: the two sides), `B.N(n0,n1)` (sides by lod), `B.count()` (triangles so far).
  `B.geos()` merges everything into **one geometry a material** with the wear picture laid over the parts by where they are and a little shade
  toward the ground.
- Materials (`ddrMat(key)`, shared): `steel` (bare gun steel), `paint` (painted metal), `matte` (canvas, rubber, leather, bakelite), `wood`,
  `glass`, `brass`, `decal`. All take the colour from the part. Your own (a camouflage picture, a deck's planks): `ddrMatDef('ddrTankCamo',
  {r,m,e,map:texture,tile})` then use that key in the builder (`tile`: how many units the picture covers; it's laid on by position, or give a part
  its own coordinates with the option `{uv:[su,sv,ou,ov]}` as `B.decal` does). Pictures: `ddrCanvas(w,h,draw,srgb)`.
- `ddrModel(key,()=>({part:B.geos(),...}))`: built once and cached; `ddrPart(geos)` makes the meshes (a Group). Parts that move apart from each
  other (a turret, a recoiling barrel, a ramp, the gun on its mount) are separate builders and separate Groups; put them in `g.userData`.
- `ddrBurn(group)`: draws a model in the burnt copies of its materials (a knocked-out gun or vehicle). Nothing for you to do for it.
- Colours in `DDRC` (gun steel, field grey `feld`, dunkelgelb `gelb`, olive drab `od`, canvas, rubber, wood...). Add your own in your file.
- Sizes: true dimensions times a factor so the piece reads beside the chunky men (a man is about 18.5 units tall and 7 wide). Machine guns use
  `DDR_S` 1.45. Guns on carriages and vehicles: about 1.1 to 1.2 (say which you used), unless the old model's footprint is given: then fit it.

## Looking at your work
The game's own light and render, the model on flat grass, optionally a man beside it:

```bash
cd /tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad
DDROOT=<your worktree>/dday SIZE=2.5 MAN=stand:22 node <your worktree>/dday/tools/real/look.js <outdir> "name=ddrYourThing(0);;hi=ddrYourThing(1)" <your port>
python3 <your worktree>/dday/tools/real/sheet.py <outdir>/sheet.jpg 3 520 <outdir>/name-q.png <outdir>/name-side.png ...
```
- The expression must give a `THREE.Group` (or `{g:Group}`). The model is turned to point north (up the picture in the `game` shot).
- `SIZE`: 1 a machine gun, 2 a field gun, 2.6 a truck, 3 a tank (scales the camera distances). `MAN=none|stand:<units to its right>|gunner`.
  `SHOTS=game,q,side,rear,close,top,front,low,left,q2` (default game,q,side,rear,close). It prints triangles and meshes for each model.
- One run takes 30 to 60 s (software rendering). Use your own port and your own out directory under the scratchpad. Look at the pictures with
  the Read tool, compare with what you know of the real thing, fix, repeat. At least four rounds: silhouette first, then parts, then finish.
- Don't run the game's test suites; don't start more than one browser at a time.

## Budgets (lod 0, the one the battle draws)
Triangles: a machine gun or mortar 1,000; a gun on a carriage 3,500; a truck 5,000; a car 2,500; the landing craft 3,500 (there are up to
twenty on screen); a tank 9,000. Meshes (draw calls): 3 a static piece, up to 5 for one with moving parts. lod 1 may be about twice lod 0.

## What I need back
- Your file, committed in your worktree (`git add` only your file; commit message "Version 246 draft: <area> models"; do not push).
- For each model: its function, what it returns (`g`, the moving parts in `userData`, sizes: length, width, height, where the muzzle is),
  the scale factor used, triangles and meshes at lod 0 and 1.
- A sheet per model (five or six views) saved under the scratchpad, and the path.
- What you'd still improve, and anything that doesn't look right yet: say it plainly.
