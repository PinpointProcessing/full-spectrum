# Level 1 draft: a small first mission that teaches

Bryan: "It's still really hard to get through. This has to be a tutorial map, a first level. Maybe we should just scrap the
warehouse? Maybe we should save this map for level two and add an easier map?"

Built (Bryan: "okay lets build that and then keep the level 2 map in it's entirety"): `js/level1.js`, notes in `CLAUDE.md`.

Bryan's playtest: "at the end, the radio relay - its confusing how your supposed to take it down. We will redesign Level 1 but
for now it's good." Level 1 stays as it is until the redesign.
What came out differently from the plan below:
- The scout (beat 5) gets up when a soldier is sent to him (tap him with a soldier selected, 3 s); there's no carrying him. The
  checkpoint's medic station and ammo drop appear by the hut once the yard is clear, and a tip explains them.
- Its guards also see less far (21 m instead of 30).
- The tips are only in Level 1 for now, so there's nothing to switch off in Level 2 yet.
- Level 1 has no saves: a failed run starts again from the beach (without the boot camp the second time).

The plan as approved:

## The idea

- **The current map becomes Level 2**, warehouse included. The warehouse is where a player first gets to use takedowns and
  stealth for real, and it's the gentlest part of that map; the hard parts are the bridge and the data center's front.
- **Level 1 is new and small**, about a third of the size, and doubles as the tutorial: the boot camp and the tips from
  `docs/tutorial.md` happen there, one lesson per beat, with enemies that are slow to spot you and bad at shooting.
- Same rainy night, same squad, same controls. About 10 minutes.

## Level 1: knock out the radio relay

The enemy has a radio relay on the river. Knock it out so the main landing (Level 2) goes in unseen.

1. **The beach** (no enemies): the dinghy lands, then boot camp. Move the camera, tap ALPHA, move into cover (green and red
   ghosts), tap a card to order one man, draw a route, bring Bravo up, how sneaking and the detection ring work.
2. **The fence**: one guard with his back to you. TAKEDOWN. He's alone, so getting it wrong is cheap.
3. **The gate**: two guards looking away from each other. Alpha's silencers: mark both, they fire together.
4. **The yard**: four guards who will fight. Plenty of cover. Focus fire and the hit %, Suppress with Hayes, a grenade from
   the card. These guards aim far worse, go down faster, and have no machine guns, radio, reinforcements, grenades or dogs.
5. **The wounded scout**: a friendly soldier down by the relay hut. Revive him, or carry him to the medic station; the
   checkpoint's medic station and ammo drop are explained here.
6. **The relay**: destroy it with Hayes's RPG or a grenade. Mission complete, a short report, and Level 2 opens.

## How it's built

- Its own small map, swapped in the way the office building's inside already is, so the big map isn't touched.
- The intro card gets Level 1 and Level 2 (Level 2 open from the start for now, so Bryan can still test it).
- The tips switch off in Level 2 for anyone who has finished Level 1.

## Questions for Bryan (answered)

- Go with this, or change the beats? Bryan: "okay lets build that".
- Keep the warehouse in Level 2 (my suggestion), or cut it there too? Bryan: "keep the level 2 map in it's entirety".
