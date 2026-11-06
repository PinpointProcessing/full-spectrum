# The monsters and the Headquarters, second round: drafts for Bryan

Bryan, on the first round: "right now they look like a kids drawing", "it's a pink blob, it should be black, grey and brown -
natural colors", "If it looks blocky and childlike we'd lose players after this battle", "Have the mother look like a large
indoor centipede", "I'd like the HQ to look scary with goo and stuff on the walls and floor", "Let's get the design down
before we test the level."

These are original designs with that kind of horror feel (glossy black chitin, wet, insect-like); they don't copy any
film's creature. Nothing here is in the level yet: the pictures in `docs/drafts` are rendered with the game's own renderer,
lights and post-processing (`tools/drafts`), from `js/creatures.js`, which the page doesn't load yet.

## The Brood Mother: a giant centipede
- About 15 m long: 21 body segments under overlapping armour plates, black-brown with an umber band on each plate's hind
  edge; a pale, matte belly; a pair of legs on every segment (42), amber-brown with paler joints, a hooked claw at each tip;
  the last pair long and trailing like pincers, spined.
- The head: a domed shield, small glossy eyes in clusters at its front corners, long antennae, the venom claws (the
  forcipules) curving round the front, black at the points, mandibles between them and strings of drool.
- How she'd move in the game: the body follows the head's path, the legs ripple down it in a wave; to slam she rears the
  front third up (about 5 m) and drops onto the violet ring; she coils round her clutch in the lair.

## Her brood: two options
- **A, her young**: 3.5 m centipedes of the same stock, smoky grey-brown. For the lunge they rear up, claws open (the
  current crouch), then strike.
- **B, the hunter**: an arched back of spiked plates on four long legs, a pair of scythe arms folded under the chest, a
  low wedge of a head with six small eyes and hooked side jaws, a forked tail. It would crouch, then the arms snap out.

## The Headquarters as her nest
- Resin down the walls of the hall and the rooms (ropes, lumps, pooling at the foot), wet resin sheeted over the lair's
  floor and spreading along the hall's walls and out of the rooms, egg clutches (pale, leathery) in the lair and the
  rooms, strands across the rooms' doorways, drag marks toward the lair, the old fittings grimed over.
- Light: the violet lamps become a low amber glow from the lair and the nests; the red emergency lamps stay.

## Not done yet
- Animation in the game (the wave of the legs, rearing, the lunge), and putting the new bodies on the existing
  behaviour (`houndThink`, `bossThink`).
- A cost check on a phone (the mother is about ten draw calls: her parts are instanced).
- Shed skins in the rooms, spores in the air.

## Questions for Bryan
1. Brood: A (her young) or B (the hunter)?
2. The mother: the right size and look, or more of something (spikes, size, darker)?
3. The nest: enough goo, or more over the walls and floor?
