# Bridge drafts (after v112)

Bryan: "The bridge is just a flat road, it looks like it's floating. Can we draft some different bridge types? I'm thinking the
south side of the bridge can be more of the warehouse level."

Four bridge types, rendered in the game's own scene at night (`tools/drafts/bridges.js` with `bridges-page.js`; pictures in
`docs/drafts/bridge-*.jpg`, all four side by side in `docs/drafts/bridges-overview.jpg`). Each picture set: 1, along the bridge
from the gate; 2, low over the dock basin, its side; 3, the game's own camera over the squad. Nothing here is in the game yet:
the pick goes in next.

Found on the way, and fixed in v113 whichever is picked: the dark ground that stands in for the world beyond the old map lay
over the whole lake and bay at road height, so near the bridge there was no water at all, just a flat dark floor with the deck
lying on it. That is most of why it looked like it was floating. The water shows now.

## The options

- **A · Concrete beams on piers.** The current look done properly: deep edge beams, girders under the deck, pairs of round
  columns on footings in the water, abutments at each end. Plain, modern, nothing above the road.
- **B · Steel truss on concrete piers.** Low green steel trusses either side, nothing overhead, so the squad stays in sight from
  the game's camera. Four spans on concrete piers with cutwaters. Old and industrial, fits a warehouse district.
- **C · Stone arches.** Eight masonry arches over the water, stone parapets in place of the railings, cutwaters at the piers.
  The oldest-looking; reads well from above.
- **D · Steel lift bridge with towers.** Steel girder approaches either side of a middle span that lifts between four lattice
  towers (machinery houses on top, red lights, an operator's cabin with lit windows). The strongest silhouette and the most
  "harbour"; the towers do stand in the game camera's way over the middle of the crossing.

## The south side

All four drafts show the same dockyard south of the bridge, like the warehouse level: the bay becomes a dock basin with quays
round it, two warehouses with roll doors, stacked containers, a gantry crane on a pier, a tug at the quay, lamps. Drawn only for
now (nothing walkable).

## Defaults I took

- The water is 3.4 m below the deck in the drafts (1 m in the game now), so what holds each bridge up shows. Whichever is picked,
  the water drops to suit it.
- The road over the bridge stays as it is for play: the same width, the same railings or parapets as cover.

## Questions for Bryan

1. Which bridge: A, B, C or D (or a mix: for example B's trusses on C's stone piers)?
2. The dockyard on the south side: is that what "more of the warehouse level" meant? Should any of it be walkable later (a level
   there), or is it scenery for now?
