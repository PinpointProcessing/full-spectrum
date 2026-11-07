# Soldier classes (Bryan's design; step 1 built in v73)

Bryan: "Every private can use a basic assault rifle. When they reach level 3 their class type should be chosen... Each unit
unlocks different Class Attribute Slots for skills and equipment." He wants Level 1 and Level 2 working first; this is the
plan for when we get to it.

## How it works

- **Privates (levels 1 and 2):** the basic assault rifle (the M4, silenced from Level 2 on), a frag, and one common special
  item (smoke or a medic kit). That's what the squad has now.
- **Level 3: pick a class.** On the between-missions screen (the squad in the dinghy at sea, `equip.js`), anyone who has
  reached level 3 gets "Promotion: choose a class". With today's XP (215 XP to level 3; a soldier earns roughly 150 to 250 a
  mission) that lands after the second mission, before the data center.
- **Class Attribute Slots:** each class has its own slots for skills and for equipment, and more of them open as the
  soldier levels up (a suggestion: one of each at level 3, a second skill at 6, a second piece of gear at 10, when his rank
  changes, and so on). Equipment slots take that class's gear; skill slots take passive or active skills, picked from a
  short list per slot.

## The classes

| Class | Bryan's description | Weapons | Class gear | Skills (examples) |
|---|---|---|---|---|
| **Spec Ops** | stealth skills and equipment bonuses | silenced rifles | silencer, smoke, C4 (in the code, switched off), a distraction throw (new) | harder to spot while sneaking; faster, quieter takedowns; leads the silent volley |
| **Medic** | heals units when down and up to 100%, uses med packs and carries far more of them; heal darts from a distance; an emergency medical station made in the field, to use under heavy fire | assault rifle | med packs (3 to 4, others carry 1), heal darts (new), field medical station (new: a medic ring he sets down anywhere) | revives anyone downed or critical to full health with a pack; faster revives; works while under fire |
| **Support** | heavy machine gun, resupplies other units, RPGs and heavy rockets | M240, assault rifle | RPG (more rockets), heavy rockets (new, bigger blast), ammo bag (new: refills teammates near him, a walking ammo drop) | suppresses harder; carries more |
| **Assault** | heavy firepower, strong and quick attacks | shotgun (in the code, dormant), assault rifle | extra grenades, breaching charge (new) | fires better on the move; a stronger Breach; tougher (more armour) |
| **Recon** | sniper expert, scopes out areas, gets to places others can't; works well with Spec Ops | sniper rifle (in the game: the watchtower's), assault rifle | binoculars (new: mark enemies for the whole squad), climbing kit (new) | sees further (the sniper's 70 m), climbs ladders and towers faster, uses routes others can't (vents, rooftops) |
| **Cyber Ops** | robotics, drones, hacks equipment, other tech bonuses | assault rifle | scout drone (new), hacking kit (new) | hacks card doors, the lift and cells without the card; takes over cameras and turrets; cuts a radio call short; a better contact sensor (it's in the game) |
| **Defender** (added after v74: "another class 'defender' who can build mobile fortifications and wall amongst other things") | builds mobile fortifications and walls | assault rifle | build kit: barricades he can pack up and move, walls (both in, v75), barring a door (in, v77); later: razor wire, a sandbagged gun nest, repairs | heavy armour (in) |
| **Captain** | a great leader who raises the whole team | assault rifle | radio (call-ins from HQ later) | an aura near him: better aim, steadier under fire, quicker reactions; rallies a pinned team; one per squad |

What's already in the code and only needs handing to a class: the silencer, smoke, the medic kit and carrying, the RPG, the
M240, the sniper rifle and climbing the tower, the shotgun, C4, Breach, the contact sensor, the ammo drop and medic station
(today only at checkpoints). The squad's four already lean this way: Hayes is Support (M240, RPG), Okafor a Medic.

## Built: step 1 (v73, `js/classes.js`)

- **The choice.** On the between-missions screen a soldier at level 3 or above with no class has a pulsing PROMOTE button
  under his name. It opens the picker: the seven classes, each with Bryan's line, its passive and any weapon it adds.
  "Not now" closes it. The choice is kept in this browser (`warehouseYard.classes.v1`) and shown on his card and his
  loadout row in place of his rank (A2 · RECON). The report says "Level up · choose his class next" when a soldier
  reaches level 3 without one. "Reset squad XP, ranks and classes" on the intro card clears them.
- **Defaults until Bryan answers the questions below:** the player picks; a class is for good (retraining at HQ later);
  two soldiers can share a class, but there's only one Captain; the freed prisoners have no class.
- **A class adds, it doesn't take away:** everyone still picks from the M4 SD, the armory's one M240, smoke, the two
  medic kits and the RPG. Assault adds the shotgun to his loadout (a pump gun of his own in the 3D model), Recon the
  sniper rifle.
- **One passive each** (`CLS` in classes.js; every one measured like for like in a test, the same man, weapon and spot
  with and without the class):

| Class | Passive | Measured |
|---|---|---|
| Spec Ops | Ghost: a third harder to spot while sneaking (×0.65, in and out of a guard's cone, and for the hidden team's covert sense); takedowns 0.4 s instead of 0.6 | a guard's awareness 0.034/0.1 s instead of 0.052 |
| Medic | Field medic: revives a man in 2 s (not 3) and brings him up at 60 (not 35); a medic kit in his hands has 3 uses and brings a man up at 80 (not 50); a Medic beside a downed man does the revive if there is one | 2.0 s, 60 HP |
| Support | Suppressor: his fire pins half as hard again (shots and Suppress); an RPG in his hands has 3 rockets (not 2) | +0.09 pin a shot instead of +0.06 |
| Assault | Breacher: carries 2 frags (a throw uses one), and loses half as much aim firing on the move (−0.075, not −0.15) | 0.72 to hit on the move instead of 0.64 |
| Recon | Eyes: sees 46 m instead of 36, and 80 m with the sniper rifle instead of 70 | sees a man at 42 m |
| Cyber Ops | Tracker: the contact sensor reaches 70 m (not 45) and sweeps faster (its interval ×0.7) | a mover at 60 m blips |
| Captain | Leader: men within 20 m of him get +0.05 to hit and pin a quarter slower. One per squad | +0.05; pin ×0.75 |
| Defender (v75) | Bulwark: heavy armour takes a quarter off every hit (on top of the vest). His build kit (3 uses, his special item; a new Defender takes it): tap it, then a spot inside a 32 m circle; he builds across the line to the nearest threat: a barricade (1 use, 2.5 s: a steel shield on wheels, heavy cover you shoot over, packed up again in 2 s by tapping it with him selected) or, tapping the kit again, a wall (2 uses, 5 s: sand-filled barriers taller than a man that block sight, shots, rockets and blasts). A close frag wrecks a barricade; a wall takes two. Cleared at a reset; not kept by a save. Inside the office building, a shut door tapped in a build mode is barred (1 use, 1.5 s): from then on it only opens by being kicked in, by anyone, loud (v77) | barricade built 2.5 s after he's there, see over it, heavy cover; wall blocks sight and the way; one frag at 1.2 m wrecks a barricade, a wall stands one (76 HP left) and falls to the second |

The class gear (a Medic's kits, a Support's rockets, an Assault's frags) is handed out at every mission start and at
every ammo drop.

## Built: class skills (v76, `js/skills.js`)

From Bryan's own descriptions of each class: a third button on the card of a soldier whose class has one (left of his
special item; on a narrow card the three buttons shrink to fit). Counts start full at every mission start.

| Class | Skill | How it works | Tested |
|---|---|---|---|
| Medic | Field station ("an emergency medical station made in the field, to use under heavy fire") | once a mission: 2 s and a medic station stands where he is; its green ring heals anyone inside and gets a downed man carried in back up, like a checkpoint's | a hurt man inside: 50 to 74 HP in 3 s |
| Support | Ammo bag ("resupplies other units") | once a mission: 2 s and an ammo drop stands where he is; grenades and special items refill inside its ring | an empty grenade refilled |
| Recon | Binoculars ("scopes out areas") | every 30 s: tap a spot he can see, out to 60 m: every hostile within 20 m of it that he has a line to is marked for the squad for 12 s (shown wherever he goes, a blue pin over him) | a man 45 m off marked and shown; the button waits 30 s |
| Spec Ops | Distraction (the stealth roadmap's "distraction throw") | twice a mission: tap a spot within 20 m he can throw to: a clatter, and unaware hostiles within 12 m who hear it (through a wall only within 6 m) go over to look for 4 s, then back to where they were. A man who goes to look may see someone on the way | a guard walked 4.6 m over, looked, went back to his post unalerted |
| Assault | Flashbang (Bryan on the doors: "later incorporate C4s or flashbangs") | twice a mission: tap a spot within 20 m he can throw to: 1.1 s later every hostile within 9 m who has a line to it is stunned for 3.5 s (can't fire, pinned); loud, but heard as an ambush; ours within 6 m are shaken. Throw one through a door, then breach | both guards in the security office, through its opened door: stunned 3.5 s, no shots |
| Captain | Rally ("rallies a pinned team") | every 60 s: everyone of ours within 20 m of him shakes off being pinned (suppression gone) and gets +0.1 to hit for 8 s | two pinned men 2–4 m off unpinned, one 24 m off not; the button waits 60 s |
| Cyber Ops | Hacking ("hacks equipment") | no button: inside the office building anything that needs the access card (the computer, the lift, the stair door, the cells), a Cyber selected gets into without it, 4 s at it | the computer opened the steel door without the card; with no Cyber selected it still says "Find an access card." |

Not yet: the Assault's breaching charge (C4 on a door), the Captain's call-ins from HQ, the Cyber's drone, cameras and turrets.

## Order of work (a suggestion)

1. The class choice at level 3 on the between-missions screen, each class's weapons and one passive bonus. (Built.)
2. Class gear that already exists, moved into the class slots.
3. New gear, one at a time: heal darts, the field medical station, the ammo bag, heavy rockets, binoculars, the scout drone,
   hacking, the Captain's aura. (In: the field station, the ammo bag, binoculars, hacking, a distraction throw; the aura is
   the Captain's passive.)
4. Skill slots opening with level, and the store (Bryan: "Maybe start upgrading them or going to the store?") selling class
   gear.

## Questions for Bryan

1. Is a class for good, or can a soldier retrain later (at HQ, say)?
2. Can two soldiers share a class? Only one Captain per squad?
3. The Medic "can heal units when dead": back to full health from downed and critical, or can he bring a killed soldier
   back too? (Today the dead stay dead; Bryan's earlier idea was life support at HQ.)
4. Does the player pick the class, or does the game suggest one from how the soldier has been used?

## Classes after the Headquarters (Bryan, after v96)

Bryan: "when the team finishes the HQ, I think classes should be assigned to the units. Did we work that out yet? Because
that's not in the game yet. Maybe we should wait for the radio control to come in because then it would make sense how the
troops can get weapons."

Where it stands: the class choice exists (step 1 above), but only on the between-missions screen at sea, which comes before
Levels 2 and 3. Nothing after the Headquarters offers it (the report says "Level up · choose his class next", and then
there's no screen to choose on), and the freed prisoners can't take a class at all (`canPromote` in classes.js leaves them
out).

The plan, as Bryan suggests: wait for radio control (docs/hq-base.md). Once it's built, promotion happens at the
Headquarters (the command center, or the barracks when there is one), and a class's weapons and gear (the shotgun, the
sniper rifle, the Support's extra rockets, the Defender's build kit, the Medic's kits) come in on a supply drop called on
the radio.

Bryan's answers (after v96):
1. **The freed men turn into normal soldiers**: they get classes like everyone else (today `canPromote`, `classOf` and the
   report's "choose his class next" all leave them out).
2. **Classes first unlock at the HQ**, not on the boat screen, and class upgrades happen when the team returns to the HQ.

And the class tools: "each class will start to unlock special tools they can equip. Like support can get a mobile turret.
Medic gets a heal dart, assault gets C4. And they continue to unlock as the game progresses. They don't unlock on every
level, just big milestones. We can discuss more."

Not built yet. Until promotion moves to the HQ, the boat screen's PROMOTE stays, so classes can still be tried.

## Class tools at milestones (a draft to discuss)

Bryan's three are fixed; the rest are suggestions for him to keep, swap or drop. A tool is something a soldier equips in
his class's tool slot (on top of his weapon, grenade and special item), used from a button on his card like the class
skills. Each class gets one new tool at each big milestone, never every level.

| Class | First tool (the HQ taken) | Second (the radio tower) | Later |
|---|---|---|---|
| **Support** | mobile turret (Bryan): set down, fires on its own at what the squad can see, limited ammo | turret upgrade: armoured, more ammo | resupply drop on call (needs the radio) |
| **Medic** | heal dart (Bryan): heals a soldier from range | adrenaline: a downed man back up from range | life support at the HQ (Bryan's earlier idea): a fallen man brought back |
| **Assault** | C4 (Bryan): on doors, walls and vehicles (the demolition charge code is already in the game, switched off) | breaching charge: blow a door and stun the room | heavy rockets |
| **Recon** | motion sensor: marks movement round where he puts it | scout drone | marks guards before a mission starts |
| **Spec Ops** | throwing knife: a silent kill from a short range | grappling hook: up onto roofs and walls | a disguise to walk past one post |
| **Cyber Ops** | jammer: a radio man can't call it in while he's near | turret hack: an enemy gun fights for us for a while | camera network: see what their cameras see |
| **Captain** | radio call-in: the radio's reinforcements (level 1 men, a few a mission) | mortar strike | air strike |
| **Defender** | deployable shield: cover he carries and sets down anywhere | barricade upgrade: a firing slit | a fixed gun on a barricade |

Milestones, as a suggestion: taking the HQ (classes open, first tools), the radio tower (radio control comes online: second
tools and the Captain's call-ins), then whatever big missions come after.

Bryan's answers on the draft (after v96):
1. **Free once unlocked.** The equipment is radioed in and arrives by helicopter on the HQ's top floor, so it needs the
   radio tower (the roof's helipad and tower: docs/hq-base.md).
2. **Tool slots:** not decided; maybe more slots open as a soldier levels up.
3. **Class upgrades** are both: the tools, and better versions of the class itself (its passive and its skill).

And: as the game goes on, the enemies get stronger too.
