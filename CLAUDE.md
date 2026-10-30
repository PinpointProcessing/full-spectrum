# Warehouse Yard — squad tactics prototype

Combat demo for Bryan's next game after Ashvale: modern squad tactics (Full Spectrum Warrior squad control + Aliens: Dark Descent look and campaign feel) with base building and async PvP planned later. This demo only tests the battle layer.

## The game idea (long term)
- Main HQ: level up, research weapons, build defenses, store vehicles, collect resources. Modern setting, human vs human.
- Missions: overlay of enemy territory, scouting options, pick the first target, take it, then push to the next outpost/checkpoint. Captured areas become sub-bases (recruit locals, repair gear, heal the wounded, build makeshift tech). Clear the region, upgrade HQ, continue the war.
- Later: async online raids. Players build base defenses, and their forces defend on their own when attacked.
- Visual target: close to Aliens: Dark Descent.

## The demo (warehouse-yard.html)
`warehouse-yard.html` is the page shell (markup only). Three.js r128 from cdnjs (global `THREE`) renders the 3D world; a 2D canvas overlay on top draws the HUD bits (hp bars, hit %, previews, tracers, rain). No build step: open the HTML directly or serve the folder statically.

### Code layout
Styles in `css/style.css`. Game code in `js/` as plain `<script>` files (not ES modules, so it still runs from `file://`). They share one global scope, so load order matters and is set in the HTML:
1. `core.js` constants (map size, colours), DOM handles, `hyp`/`clamp`/`rng`, `teamCol`
2. `map.js` map objects (`objs`), lamp/post data, LOS, cover, free-space queries
3. `pathfinding.js` nav grid, A* + string-pulling, cover points
4. `scene.js` `initGL()` (renderer, scene, camera), camera maths (`toS`/`toW`), textures, world meshes, lights, soldier models, `render()`
5. `state.js` battle state variables, `mk`, `reset`, `timeScale`
6. `combat.js` hit chance, shots, suppression, grenades, move assignment, enemy and squad AI, `update(dt)`
7. `overlay.js` 2D overlay drawing and rain
8. `input.js` pointer/pinch/wheel handling (`bindInput`), `tap`
9. `hud.js` banner, status chip, squad rows, buttons, keyboard (`bindHud`), end screen
10. `main.js` resize, frame loop, boot (shows the no-WebGL message and stops if `initGL()` fails)

Only `main.js` does work at load time beyond building pure data (map, nav grid, cover points); everything touching THREE or wiring events runs from boot.

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

### Testing note
Headless browsers here have no GPU, so WebGL runs in software at ~3 fps: fine for screenshots and checking layout, useless for judging pacing. For local tests without network, install `three@0.128.0` from npm and serve `build/three.min.js` for the CDN URL (e.g. Playwright `page.route`), or swap the CDN tag for a local copy. Because the game state is global, tests can drive it straight from `page.evaluate` (`update(1/60)`, `tap(...)`, `units`), and seeding `Math.random` makes runs repeatable.
