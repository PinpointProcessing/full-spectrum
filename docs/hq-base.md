# The Headquarters after it's taken: a proposal for Bryan

Bryan, when the Headquarters went in: "Once they kill all of them it's the players new HQ - which we can then discuss."
This is a starting point for that discussion. Nothing here is built. It pulls together what's already decided
(CLAUDE.md, "The game idea" and "The roster") and suggests a first small step.

## What's already decided
- Long term: a main HQ where you level up, research weapons, build defenses, store vehicles and collect resources;
  captured areas become sub-bases (recruit locals, repair gear, heal the wounded, build makeshift tech); later, async
  raids where your defenses fight on their own.
- The roster (after v71): everyone saved or captured joins one roster, and not everyone fights. Level 1's scout joins
  back at base after the mission, not in the field. Civilians and the scientists brought out become HQ staff once the HQ
  is the squad's. Captured men give intel or labour first.
- The between-missions screen is the squad in the dinghy at sea (equip.js), and its store or upgrades are still open
  ("Maybe start upgrading them or going to the store?").

## The proposal
1. **The HQ becomes the between-missions screen** once it's taken. You see the fortress hall from above, the squad and
   the roster standing about. Before then, the dinghy at sea stays as it is.
2. **The six side rooms become facilities.** Each one is cleared already (they're where the hounds came from), and each
   needs work to get going, paid for with what the missions bring back:
   - **Infirmary:** the wounded heal between missions. Later, life support for a fallen man carried back (Bryan's
     earlier idea), so a death isn't always final.
   - **Armory:** the loadout screen moves here, and the store. Class gear is bought and fitted here (the classes plan's
     step 4).
   - **Barracks:** the roster. Who's in the squad for the next mission (up to two teams of four), who stays behind. The
     scout from Level 1 is here, and so are the freed prisoners.
   - **Workshop:** the scientists work here. Research opens new gear (heal darts, the scout drone, heavier rockets)
     over a mission or two.
   - **Comms room:** intel. Captured men are questioned here. Intel shows more of the next region's map before you go
     in: where the guards are, the quiet way in, the radio men.
   - **Training room:** retraining a class (question 1 in docs/classes.md) and the class attribute slots.
3. **Two things to collect, kept simple:** supplies (salvage, ammo, materials, from every mission and every area you
   clear) and intel (from radio men cut off, captured men, binoculars and hacking). Supplies build and buy; intel
   reveals.
4. **Staff from the roster:** soldiers fight; scientists speed research; civilians build and repair; captured men work,
   or give intel and then work.
5. **Defending it:** the Defender's barricades and walls can be set up round the HQ. That's the seed of base defense
   for the later async raids, where your fortifications and the men you leave behind fight on their own.

## A first small step (if you like the direction)
- After the Headquarters is taken, the report leads to the HQ screen instead of the dinghy. Three rooms work: Barracks
  (the roster and the scout), Infirmary (healing between missions) and Armory (the loadout, moved from the dinghy).
- Supplies counted from the missions so far, shown but not spent yet.
- The other three rooms are shown boarded up, with what they'll do.

## Questions for Bryan
1. Should the HQ be a screen you look at (rooms as cards over the 3D hall), or a place you walk the squad around?
2. One currency (supplies) and intel, or more resources (fuel, parts, medicine)?
3. Should the scientists you bring out be staff only, or can they be lost or traded?
4. When does the next region start: right after the HQ, or does Level 3 continue from it?
