# Tutorial draft: how to use your soldiers

Bryan: "For a newbie, they would have no idea what to do. Can we draft a tutorial on how to use your soldier?"
Built in Level 1 (`js/level1.js`; Bryan approved the Level 1 plan in `docs/level1.md`, which puts the boot camp on its beach).
What came out differently from the draft below:
- Part 1 is on Level 1's beach, not after Level 2's landing. Step 1 leaves out twisting the view (drag and pinch only).
- The box became a small bubble low on the left (Bryan, playtesting: the box sat in the middle of the screen and a tap on it
  moved the troops). A tap on it carries on from a notice or hides it to a "?".
- Instead of a Tutorial on/off switch on the intro card: "Skip tutorial" in the bubble (it reads "Turn off tips" while a tip
  shows, Bryan's wording). The boot camp ends early if the player goes on ahead (leaves the beach, a guard down or alerted, contact).
  "Try Level 1 again" doesn't repeat the boot camp, and keeps the tips off after a skip. Starting Level 1 from the intro card
  always begins with the boot camp; Bryan to say if it should switch itself off once Level 1 is finished (that's stored).
- Part 2: the tips for Level 1's situations are in (a guard seen, takedown, silencers, contact, pinned, grenades, man down,
  the checkpoint, the scout, the relay and the RPG). Level 2's (the canal, the tower sniper, the pillbox gun, Breach, the
  wounded on the exposed spot) are not built yet.
- Bryan, playtesting: "It should also not allow any other actions to happen unless you do the tip." So a step or a tip holds
  everything else back until it's done (picking soldiers is allowed where the tip needs it; the camera, Pause and Fit map
  always work); anything else shakes the bubble ("Do this first"). Tips that only tell you something end with a tap on them.
  The slow motion is for tips that ask for something, not the boot camp's steps (nothing's happening on the beach).
- Bryan, playtesting v65: the level after the beach is led step by step: a dotted line for the boot camp's drawn route, then
  the takedown (Reyes to a ring behind the shed guard, then tap him), the double silent shot (Alpha to a ring by the gate, then
  tap one guard, then the other), into the yard (everyone to a ring by the barrels), suppress (hold a finger on a guard: the
  Suppress button is gone) and a grenade; then the checkpoint, the scout and the radio tower (a ring under it, the RPG button
  lit in Bravo's colour). Move steps end once the move is ordered, so the game isn't in slow motion while they walk. No tips
  in Level 2.
- Bryan, playtesting v68: Level 1 is a real mission with a tutorial, not a training ground. It opens with a helicopter that
  drops the squad on the beach (the pilot on the radio, "You're on your own now. Good luck."), and the tutorial starts as it
  flies off; the bubble says "Tutorial n/7" (no "boot camp"). The double silent shot is now: tap one guard, then the other,
  and they split, one each, on the same count (a single tap has both shoot that one, and the tip then asks for the other).
  After the radio tower: back to the boat on the beach (a green ring), push off, the report, and the squad at sea with the
  loadout before Level 2.
- Text only, as planned.

The draft:

## How it works

- Teach by doing, one thing at a time. Each step shows one short line in the hint bar and a pulsing ring on what to touch
  (a tab, a card button, a spot on the ground). The game runs in slow motion while a step is up.
- A step ends when the player does the thing, not when they tap "OK".
- **Skip tutorial** is always on screen. A **Tutorial on/off** switch on the intro card; it switches itself off after
  the first finished run (saved in the browser).
- Part 1 is a short boot camp right after the landing, where the warehouse guards can't see the squad (about 2 minutes).
  Part 2 is tips that pop up once each, the first time the situation comes up in the mission.
- Text only at first. The squad can say a few of the lines later (new voice lines).

## Part 1: on the beach (after the landing)

1. **Camera.** "Drag to look around. Pinch to zoom. Twist two fingers to turn the view." Done when the player has
   dragged and zoomed. (The Fit map button puts it back.)
2. **Pick a team.** Ring on the ALPHA tab: "Tap ALPHA to select Reyes and Kowalski." Done when Alpha is selected.
3. **Move into cover.** A marker by the containers: "Tap the ground to see where they'll stand. Green means in cover,
   red means exposed. Tap the same spot again to go." Done when they arrive.
4. **One soldier.** "Tap Reyes's card to give orders to him alone. Tap it again for the whole team." Done when he's
   been picked alone.
5. **Send him.** "With one man selected, a single tap sends him." Done when Reyes is sent to the ring by the crate. (It was "Draw a route"; Bryan took route drawing out after v90: "Too many times I accidentally dragged a unit to a different spot.")
6. **The rest of the squad.** Ring on BRAVO: "Bring Hayes and Okafor up too. ALL selects everyone." Done when all four
   are by the containers.
7. **Sneaking.** "While nobody has seen you, your men sneak by themselves. The ring at the top fills when an enemy starts
   to notice you. Red wedges show where enemies are looking." Ends after a few seconds.

## Part 2: tips when they come up (once each)

| When | Tip |
| --- | --- |
| First enemy seen | "Red wedge: where he's looking. Stay out of it. Tap him to open fire, and the ambush gives you a bonus." |
| An unaware enemy with his back to one selected soldier | "TAKEDOWN: tap him and your man sneaks up and takes him out without a sound." |
| Alpha selected, an unaware enemy in range | "Alpha's rifles have silencers: tap an enemy who hasn't seen you to drop him quietly. Select both to mark two and fire together." |
| First contact | "You've been seen. Your men fire on their own now. Tap an enemy to focus fire; the % is the chance to hit." |
| A soldier pinned down | "Pinned! Select Hayes, press SUPPRESS, then tap the enemy. His machine gun keeps their heads down." |
| Grenade or RPG in range of a group | "Tap the grenade on a soldier's card, then tap where to throw it. Hayes's RPG works the same way." |
| First soldier down | "Hayes is down. Select a soldier and tap him to revive (you have 60 s). After that: Okafor's medic kit, or carry him to a medic station." |
| First checkpoint | "Checkpoint, saved. Stand in the green ring to heal and the orange ring to refill grenades and gear." |
| Reaching the canal | "The bridge is guarded. Our pillboxes give heavy cover. Or go quietly: the drain pipe in the west." |
| The tower sniper seen | "Sniper in the tower. Stay in heavy cover, or take him out and climb up for his rifle." |
| The pillbox gunner down | "Tap MAN THE GUN and a soldier takes their machine gun." |
| At the warehouse, or the first room inside | "BREACH: press it, then tap a room. The team stacks up at the door and goes in together." |
| A soldier exposed and hurt | "Healthier soldiers take the exposed spots. Move the wounded back into cover." |

## Questions for Bryan

- Part 1 as a short boot camp, or tips only (no forced steps)?
- Text only for now, or the squad saying the lines too?
- Anything missing from the list, or anything to cut?
