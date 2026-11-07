# Level 2: Lights Out

Bryan: "Maybe level 2 can be level 3 and something a little easier for level 2." The draft is `docs/map-draft-G.png`; he
said "Yes lets keep designing the map", and this is it built (`js/level2.js`). The data center is Level 3 now.

## The story

The power station on the coast runs the data center's floodlights. Cut it, and the data center's front is dark when you
get there.

## The map, south to north

- **The cove** (south-west): the dinghy brings the squad in (they come from the sea, between missions).
- **The fishermen's camp:** two old containers for sheds and two men at a fire barrel. The cove and the west edge are
  behind them both.
- **The road checkpoint:** two men by the station's east gate, looking south-west and down the road.
- **The station**, inside a chain-link fence you can see and shoot through but not walk through:
  - the **main gate** (south) under a **machine gun**,
  - the **hole in the fence** (west), screened from the yard by a store container just inside it: the quiet way in,
  - the **east gate** out to the road.
- **The transformer yard:** three rows of transformers that block sight, a patrol walking the south aisle end to end, a
  guard watching the gate from inside and one watching the yard from the north.
- **The generator hall:** one man, facing his door.
- **The control building:** two rooms, two men (a Breach). The panel is in the east room; its back door opens onto the
  strip along the north fence.
- **The boat out:** on the bay's shore, south-east.

## How it plays

1. Get past the camp and into the station: the gate (loud) or the hole (quiet; wait for the patrol to walk away).
2. Take the control building and shut the power down at the panel (3 s).
3. Every light goes out, the siren goes. The station's guards hunt round the control building with torches, seeing less
   and shooting worse; the camp and the checkpoint hold where they are.
4. Get everyone to the boat (anyone down carried in), push off. Mission complete.

The yard quiet gives a checkpoint (a medic station and an ammo drop) inside the gate. No saves: a failed run starts again
at the cove.

## Numbers

11 guards (Level 1 has 7; the data center's outside has 20). They aim 0.08 worse than the data center's, take ×1.25 damage,
see 25 m; once alerted they see 30 m all round and shoot no further (the data center's 38 m); no radios, dogs or grenades.
In the dark: 15 m eyes unaware, 17 m once alerted, aim 0.1 worse again.

## Tested (headless, seeded)

- The quiet way is noticed by nobody on 3 of 3 seeds; the whole level that way (takedowns in the control building, the
  panel, out through the main gate to the boat): 3 of 3 won, nobody down.
- Charging the main gate with no tactics (the bot only moves; the shooting is automatic): through every fight on 3 of 3
  seeds; 1 won outright, the other two left one or two men down that the bot never carried to the boat. Picking up the
  wounded on the way and carrying them in: 3 of 3 won.
- Found on the way: the road checkpoint shot into the station through the fence from 35 m, and the charge was wiped on 2 of
  3 seeds; hence the 30 m reach.
