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

## Round 2, Bryan's answers
"The monster looks great", "The eggs look great too", "the mother is great for now. They will get more fierce as the game
goes on", "the goo looks great"; but "the resin and slime on the floor looks bad, they just look like grey circles", and:
"I was thinking like hard purple, black, red, brown slime rocks growing up furniture and walls, extending to the ground".
"No pink." The lore: "the scientists bred mutated predator insects that could be used as military weapons but they lost
control."

## Round 3
- The slime puddles are gone. Slime rocks instead: hardened lumps in black, deep purple, dark red and brown (`hqRocks`,
  `crRockGeo`), heaped round the foot of every crate, tank, console and barrel and along the walls' feet, climbing them in
  streams (lying flat against the side), a broken rim round each clutch; under them a crust of the same colours flowing
  out over the floor, its ragged edge sinking under it (`crCrust`). The creep sheets' edges sink under the floor too (no
  stepped edge), and the strips of creep along the walls are gone (the crust took their place).
- No pink: the red lamps a deeper orange-red, the hall's floor darker and browner (grey went lavender under red light),
  the old fittings grimed darker, the purple kept deep.
- The hunter (option B), fiercer: a crest of spines on a flatter, wedge-shaped head, heavier jaws with teeth, a dark red
  mouth under them, bigger spines down its back, dark red flesh between its plates, darker legs, the scythes raised to
  strike (`threat`).
- Pictures: `hq-3-slime-rocks-game-camera.jpg`, `hq-4-slime-rocks-hall.jpg`, `hq-5-slime-rocks-close.jpg`,
  `brood-B-hunter-2.jpg`, `brood-A-her-young-2.jpg`.

## Questions for Bryan
1. The smaller monsters: her young, the hunter, or both (the young as the swarm in the side rooms, the hunters pouring out
   of the gate)?
2. The slime rocks: right, or more of them up the walls?
