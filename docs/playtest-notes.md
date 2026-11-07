# Playtest notes (Bryan, testing v64; the changes are in v65)

Bryan: "I am testing now so take my notes into consideration and then we can make the changes."
His notes, collected here as they come; the changes are made together once he's done.

1. Level 1's ending: "at the end, the radio relay - its confusing how your supposed to take it down. We will redesign
   Level 1 but for now it's good." (Level 1 stays as it is until the redesign.)
2. Instructions in the middle of the screen: "the instructions are right in the middle of the screen - we should place them
   somewhere else. Same with in the warehouse." That's the cyan box near the top of the map (`#tut`): Level 1's boot camp
   and tips, and Level 2's checkpoint tour after the warehouse (`hqGotIt` in hq.js uses the same box).
   Bryan: "Can you show me a draft on how the hint bar would look? I was thinking a small bubble and when clicked it clears.
   Because currently, I click it and it moves my troops." (The box let taps through to the map.) Draft:
   `docs/tutorial-bubble-draft.png`: a small bubble low on the left (above the cards when they're up); a tap hides it and
   stops there (nobody moves), a "?" in its place brings it back, a new step or tip shows by itself; Skip tutorial / No more
   tips inside it. Built as a prototype to make the draft.
   Bryan: "Okay this is better. Instead of No more tips, say Turn off tips. Everything else is good. It should also not allow
   any other actions to happen unless you do the tip." Built, published in v65: the button
   reads "Turn off tips"; while a step or tip is up only what it asks for works (and picking soldiers, where the tip needs it;
   the camera, Pause and Fit map always), anything else shakes the bubble and it says "Do this first". A tip that only tells
   you something ends with a tap on it ("Tap to continue"); one that asks for something waits until it's done, at quarter
   speed. If the moment passes the tip goes, and if its action can't be done from there (no way behind the guard, no safe
   throw) the game says why and lets you move again.
3. Level 2 north of the canal: "Make the containers horizontal and run along the canal. There is a large road before the
   data center, like a runway road, not small. The jeep patrols that road, from left to right continuously (the user can
   sneak by or engage). The containers are lightly guarded with most in front of the data center and at the bridge. The
   whole point of the containers is for stealth. Show me a draft image of the level and I will tell you if it's right."
   Draft: `docs/map-draft-F.png` (three rows of containers along the canal's north bank; a 13 m runway road across the
   map; the gun jeep driving it end to end; guards: containers 3, bridge 6, data center front 7 plus the jeep).
   Bryan: "Yes this works! And let's make the truck just a light jeep." Built, published in v65
   (was held until he'd finished testing). Two changes from the draft, found by testing the quiet route: a container closes the west half's first aisle
   at its east end (the tower's sniper could look down it and spot the squad leaving the pipe), and the data center's guns
   and riflemen stand a little further east (x 350-710) so the far west end of the road is the quiet crossing.

# Playtest notes (Bryan, testing v65; the changes are in v66)

Bryan: "Here is everything from my testing."

1. Level 1, boot camp 5/7: "Draw a route. Have a dotted line to the box to the right of the container closest to the team."
   A dotted guide line from Reyes to a ring by the crate right of the container; only a route that ends there is taken.
2. "There should also be a tutorial point that teaches the unit how to take out a troop with a takedown. Like move Reyes
   towards the troop to stage a takedown." After the boot camp: Reyes alone to a ring behind the shed guard, then tap him.
3. "Then the next tip would be a double silent shot at the two guards near the fence." Alpha to a ring by the gate, then
   tap one guard, then the other; they fire together.
4. "The watch and suppress buttons look bad. Can we just have the user choose suppress by holding down the location where
   they suppress? We would have to add a tip for that. Let's get rid of the buttons on the bottom. Just the teams and
   'Clear'. Maybe 'watch' can just be automatic?" The bottom bar is the three team tabs and Clear. Suppress: hold a finger
   on an enemy (or where one was last seen) with soldiers selected; a ring fills, then they pin him down (and a tip teaches
   it in Level 1's yard). Watch is automatic in a fight (a soldier holding still watches the nearest enemy and fires first);
   never before contact. Breach (it had a button inside the office building and at the warehouse) is a BREACH marker at a
   room's doorway when selected soldiers are next to it.
5. "Level 1 should also give scenarios for grenades on the enemy and suppress on the enemy." The yard: everyone to a ring
   by the barrels, then suppress (hold on a guard), then a grenade.
6. "The RPG to the mast was a bit confusing, it should say Radio Tower - RPG and the tools should be highlighted in a bold
   color that matches the team selected. A circle underneath the radio tower should have been presented so the user knows
   what to press." The label reads RADIO TOWER · RPG, a ring pulses under it once the scout is up, and what a tip asks for
   glows in the team's colour (the RPG button in Bravo's amber, filled).
7. "Get rid of the tips on Level 2." The checkpoint's camera tour (the only tip box in Level 2) is gone.
8. "Players equipment is refilled at the start of each level." It already was (checked: grenades and special items full at
   the start of Level 1, Level 2 and Level 1 again); Continue and Retry bring back what was saved at the checkpoint.
9. "I was playing through Level 2 and once I got to the containers the camera stopped moving. I was only able to spin the
   camera around but not move it. THIS IS A BIG ISSUE." Found: a finger's lift that never reached the game (likely taken by
   the page around it) left a phantom finger, and every one-finger drag after that was read as a two-finger twist and zoom.
   Reproduced on v65 with a simulated lost lift; fixed: a new first touch starts clean, and a lost capture, the page losing
   focus or being hidden drop every finger.
10. "When my players are behind a wall or object, that object should turn translucent." Anything tall between the camera
   and one of ours fades to see-through and comes back once he's clear (outdoors and in Level 1; inside the office building
   the walls are cut low already).
11. "Not all corners of the containers were able to place the units. Spaces in between the containers and the edge of the
   map were inaccessible." The rows stop 4.5 m short of both edges (a strip you can walk and hide in); a slot between two
   containers that looked like a gap but wasn't is closed; a script tapped round all 17 containers and every corner takes a
   soldier.
12. "The corner near the bridge, can you open that up instead of enclosing it. That would make it easier to ambush/flank the
   bridge." The container that closed the first aisle by the bridge is gone; the tower's sniper now faces the bridge's
   south approach, so he can't look down the aisle at the pipe (the quiet route still went unseen in the scripted run).

13. "Nobody should be able to see the units inside the warehouse while they are collecting medical and resupply. Can you move
   the two circles to the middle of the warehouse? Right after the boxes and before the center box in the back." Moved there;
   a script checked every spot in both rings against every enemy post (none sees in). The old ones were partly in a line of
   sight through the back door.
14. "If one squad is caught and the other remains undetected, then that squad can continue in a covert fashion." Detection is
   by fire team now: the hidden team keeps sneaking, holds fire, can take men down quietly and ambush, and isn't shot at;
   alerted men have to notice it (their cone, or close by) instead of seeing it all round; each team breaks contact on its own.

# Playtest notes (Bryan, testing v68; the changes are in v69)

1. "My unit doesn't stand in the sniper nest." The height of whoever climbed was eased back to the ground every tick (the
   vault hop's easing); he stands on the platform now, his label and ring with him.
2. "When I get a sniper, how can I switch back?" He keeps his own rifle on his back: the gun on his card shows a SWAP tag
   (⇄ M4); tap it to swap, and again for the sniper rifle. Both are saved.
3. "'The lift needs and access card from a shared room' just say 'Find an access card'." The lift, the computer and the
   cells all say "Find an access card." now.
4. "Can they go up the stairs just to see an access card door at the top? Also, the stairs look terrible." The stairs up
   are open without the card; at the top the stairwell's door is locked (a red strip, LOCKED, a card reader beside it) and
   opens with the card. Every flight is real 3D steps now (yellow nosings, handrails): up a block of steps, down into a
   hole in the floor, and men climb and sink with them. You step on at the bottom or top only.
5. "The last unit in the data warehouse was unkillable. Nothing happened when I clicked him." The operator sits right on the
   COMPUTER's ring, and a tap there went to the computer ("needs the access card") before it reached him. A hostile under
   the finger now comes before anything on the ground.
6. "When I select an enemy unit, whoever I have selected on my squad should open fire on that individual. If they don't have
   an open line of fire, they need to find one." Done: everyone selected takes him; anyone without a clear shot walks to the
   nearest spot that has one (in a fight in cover, unseen out of the other guards' sight) and fires from there. Against a man
   who hasn't noticed them, the silenced ones take him together on a count (those not in range move up first; tap him again
   to fire at once), and anyone without a silencer waits for that shot. Tapping a second man during the count splits them,
   one each, still together. Found on the way: in a volley only the first shot ever went off (his miss alerted the man and
   called off the second); the shots land together now.
7. "All the units should have silenced assault rifles for this level. Maybe start upgrading them or going to the store?"
   Level 2 hands out silenced M4s (M4 SD: quiet like the silencer, never wears out). The store is a question for Bryan
   (below).
8. "Maybe level 2 can be level 3 and something a little easier for level 2." A draft for the new Level 2 is in
   `docs/map-draft-G.png` ("Lights Out", the power station), waiting for his OK before anything is built.
9. "I also want a screen between missions to equip your soldiers." Between missions: the squad in the dinghy on a night sea
   (swell, rain, a far light or two, the camera drifting round), and each soldier's main weapon (M4 SD or the one M240) and
   special item (smoke, one of two medic kits, the one RPG). Kept for next time. It comes after Level 1's report and before
   Level 2 from the intro card.
10. "The first training level should be a real level with a tutorial (no trainer on the grounds) then after blowing the
   radio tower, you hop on a dinghy... In between the missions, you see your squad in the middle of the ocean." The tutorial
   box says "Tutorial n/7" (no "boot camp"); after the radio tower they go back to the boat on the beach (a green ring,
   BOAT n/4; anyone down is carried), push off, and the report and the sea come after.
11. "To start level 1, maybe a helicopter drops off the players, and a voice says, you're on your own now - good luck!" A
   helicopter comes in low over the river, hovers over the beach, the four jump out, and it flies off; the pilot on the
   radio: "Thirty seconds to the beach. Get ready." and "You're on your own now. Good luck." (a new Zonos voice). "Try
   Level 1 again" starts on the beach without it.

Open for Bryan: a store or upgrades (what you'd buy with, what's for sale), and the new Level 2 draft.

# Bryan after v69 (the changes are in v70)

1. "Yes lets keep designing the map then go to horizontal later." The new Level 2 is built from the draft
   (`docs/map-draft-G.png`): Lights Out, the power station on the coast (`js/level2.js`, notes in `docs/level2.md`). In from
   the sea at a cove, past a fishermen's camp, into a fenced station by the main gate (a machine gun over it) or a hole in the
   fence, through a transformer yard with a patrol, to the control building (a Breach), where a panel shuts the power down:
   every light goes out, the guards hunt with torches, and the squad gets out by boat. The data center is Level 3 now, and
   after Lights Out its front is dark (its lamps, floodlights and the heavy gun's searchlight). The intro card has a button
   for each level; Level 1's report leads to Level 2, Level 2's to Level 3, each through the sea and the loadout.
2. "Lets wait to do the graphics enhance until level 1 and level 2 is working functionally." Noted: the graphics pass waits,
   and so does the landscape layout (after the maps).
3. The soldier classes (Spec Ops, Medic, Support, Assault, Recon, Cyber Ops, Captain; a class at level 3; Class Attribute
   Slots): written up in `docs/classes.md`, not built. With today's XP the choice would come after the second mission,
   before the data center.

Open for Bryan: Lights Out to play; the four questions in `docs/classes.md` (can a soldier retrain, can two share a class,
can the Medic bring back the dead, does the player pick); a store or upgrades.

# Bryan testing v70 (the changes are in v71)

1. "Theres a problem when throwing smokes. and shooting RPGs they dont read where i want to deploy it right away and directs my
   unit to that location instead." Out of reach, or with anything solid in the straight line (a container, a crate, even a
   smoke cloud), they walked off to find a spot. Now smoke is lobbed over low cover from where he stands and reaches 26 m (was
   17); a rocket flies up to the height of what it's aimed at, so Hayes hits Level 1's radio mast over the hut from the
   checkpoint (that's where the walk came from); too close, or a building in the way, he takes a few steps; out of range he
   says so and keeps aiming. Frags still walk to a safe spot first, as Bryan asked before.
2. "Breach room is showing up in locatins where there are no entries to rooms." The office's shared room and its two wings are
   one open space, and the open side counted as a doorway. A doorway needs a wall on both sides now and a doorway's width.
3. "Can we add doors to break down. We can have them kick it in, later incoporate C4s or flashbangs." Next (not in v71).
4. Eight units on screen: Alpha's row on top, Bravo's under it, each man always in his own slot, the name instead of callsign
   and rank (a line less). Bryan's "maybe we keep it" holds otherwise.
5. Squads on different floors: picking the other one takes you there; not while the squad on screen is under fire (unless both
   are).
6. The lab table: a tap anywhere on it now (the DESTROY ring at one end was a small target); a frag or a rocket wrecks it too.
7. The scientists: stubborn when found ("I'm not talking." "You people are terrorists."), grumbling on the way, panicking only
   near the HQ ("Don't open it!"), and a third as chatty. The new lines show as words until they're voiced.
8. "One soldier does each task": zip-ties and things to use (cells, benches, the computer) are one soldier's job each, so two
   taps send two men.
9. Chatter: no "Brennan, on me" with a team round him; small talk at most twice a mission.
10. Voices: the radio is a real radio now (squashed, clipped, a waver in the throat, narrow, hiss under it) and the dead air at
   commas is cut out of every line; a listening page compares it with v70 and with lines re-recorded without names or commas.

Still to build from this round: the classes, the monsters pouring out of the HQ and the HQ itself (the boss room), monster
sounds, doors to kick in, the scientists' and the unnamed lines voiced.

# Bryan after v71 (the changes are in v72)

1. "Re-Recorded is the best, hands down." Every squad line whose words to the voice model change is being made again (no
   names but for who's down and who's asked if he's alright, no pauses at commas): 298 lines across the eight squad
   voices, recorded in the background, checked by the speech recogniser, then packed. The rest keep their takes.
2. "The scout would only come in after the mission when you are back to HQ or base." Noted for the roster: he joins at base
   after Level 1, not in the field.
3. "I'm ready to build the HQ and everything else in your order." Built:
   - When the drawbridge comes down, the Brood Mother roars somewhere inside and hounds pour out: 20 in four waves, out of
     the gate and up over the moat's edge right beside the squad. They run you down, crouch and snarl (a violet line on
     the ground shows where they'll go), lunge, knock a man down, pull back and come again. They go for the scientists
     too.
   - The gate clear is a checkpoint. Everyone gathers at the drawbridge and goes in.
   - The Headquarters: a long hall with three rooms down each side and an entry hall with a medic station and an ammo
     drop. The Brood Mother sleeps at the far end; stepping into the hall wakes her. Her roar opens two side rooms; at two
     thirds and a third of her health two more; another every 40 s. A slam you can see coming (a violet ring fills), a
     swipe up close. When nothing is left alive: "Headquarters taken", the freed men's goodbye, the report.
   - Sounds: CC0 creature recordings layered, slowed and roughened (a listening page has every take).
   - Tested with a bot that only moves the squad (the shooting is automatic): four soldiers won 3 runs of 3, with one or
     two men down by the end; eight won with nobody down inside.
4. The scientists' new lines are voiced.

Next: the classes, then doors to kick in.

# v73: the classes, step 1

Built from `docs/classes.md` ("Every private can use a basic assault rifle. When they reach level 3 their class type
should be chosen"): a PROMOTE button on the between-missions screen for anyone at level 3 without a class, the picker
with the seven classes, the class on his card in place of his rank, each class's weapon (the shotgun for Assault, with
its own 3D model; the sniper rifle for Recon) and one passive each, measured like for like in a test (table in
`docs/classes.md`). Defaults until Bryan answers the four questions: the player picks, a class is for good, one Captain,
the freed men have none. Fixed on the way: a frag throw emptied a soldier's grenades instead of using one (it didn't
matter while everyone carried one). Still to come: the Class Attribute Slots, the new class gear, the store.

# v74: doors to kick in

Bryan (testing v70): "can we add doors to break down. We can have them kick it in, later incorporate C4s or flashbangs."
The nine offices off the office building's halls have doors now, shut to start (but for the meeting room's onto the east
hall, which its guard watches through). A shut door hides the room until it's opened. Walking through opens it quietly
in half a second (guards open them too), tapping it sends the nearest selected soldier to open it and look in, and a
breach kicks it in: the team stacks up, the nearest man kicks, the door bangs open off its hinges and they go in. It's
loud, but the men inside are caught off guard. Tested: sight blocked shut and clear open; a soldier and a guard each
walking through; a tap from the hall; a breach on the security office (kick at 1.7 s, both guards down by 4 s); the office
suites (the story, stairs, carrying, floors, the tasks, the breach marker). The warehouse and Level 2's control building
have no doors yet: their quiet routes were tested on open doorways. C4 and flashbangs on doors come later.

# v75: the Defender

Bryan: "Add another class 'defender' who can build mobile fortifications and wall amongst other things." The eighth
class. Heavy armour (a quarter off every hit), and a build kit as his special item (three uses; a new Defender takes it,
an ammo drop fills it). Tap the kit, then a spot inside the circle: he goes round behind it and builds across the line to
the nearest threat:
- a barricade (one use, 2.5 s): a steel shield on wheels, waist high, heavy cover the squad shoots over. Tap it with him
  selected and he packs it up (2 s) and gets the use back: the mobile fortification, rolled on to the next position.
- a wall (tap the kit again; two uses, 5 s): sand-filled barriers taller than a man. It blocks sight, shots, rockets
  and blasts: cover a crossing, cut a machine gun's line. It stays.
A frag close by wrecks a barricade; a wall takes two. Hostiles can use them for cover too. They're cleared at a level's
start or a retry and not kept by a save. Tested: promotion and the kit on the loadout; both built and measured (see over
the barricade, heavy cover; the wall blocks sight and the way); an empty kit refused; packing up; blasts; a reset.
Still to come for him ("amongst other things"): razor wire, a sandbagged gun nest, barring a door, repairs.

# v76: class skills

From the classes plan (step 3, Bryan's own descriptions of the classes): a third button on a classed soldier's card.
- Medic, field station: once a mission he sets a medic station down where he stands (2 s). Heals inside, gets a carried
  downed man back up.
- Support, ammo bag: once a mission, an ammo drop where he stands (2 s). Grenades and special items refill inside.
- Recon, binoculars: every 30 s, tap a spot he can see (out to 60 m): every hostile within 20 m of it that he has a line
  to is marked for the whole squad for 12 s.
- Spec Ops, distraction: twice a mission, a clatter where you tap (within 20 m): unaware guards within 12 m go to look,
  then back. The stealth roadmap's distraction throw.
- Assault, flashbang (Bryan, on the doors: "later incorporate C4s or flashbangs"): twice a mission, thrown where you tap
  (within 20 m): 1.1 s later every hostile within 9 m who sees it is stunned for 3.5 s and can't shoot. Loud, but heard as
  an ambush. Open or kick a door, throw one in, go in.
- Cyber Ops, hacking: no button. Anything that needs the access card inside the office building, a selected Cyber gets
  into without it (4 s).
Tested each one; on a phone's four cards the three gear buttons shrink to fit.

# v77: barring doors, the controls list

- The Defender's build kit also bars a door: in a build mode, tap a shut door inside the office building (one use,
  1.5 s at it). From then on it only opens by being kicked in, by anyone, and that's loud: seal a room behind you or cut
  off a flank. Tested: a guard walking out of the barred security office had to kick his way out; one of ours walking
  into a barred door kicked it in after 1.2 s.
- The intro card's Controls list now covers doors, classes and the Defender.
- The Captain's skill, rally (from docs/classes.md: "rallies a pinned team"): every 60 s, everyone of ours within 20 m
  of him shakes off being pinned and gets +0.1 to hit for 8 s. Every class but the Defender (whose build kit is his
  special item) and Cyber Ops (whose hacking needs no button) now has a skill button.

# v80: the re-recorded squad voices

Bryan: "Re-Recorded is the best, hands down." Every squad line whose words to the voice model changed was made again with
Zonos, the commas taken out of what it's given and no names but for who's down and who's asked if he's alright, checked by
the speech recogniser and made again where it was bad (two rounds), then packed: Reyes, Kowalski, Hayes, Okafor and the
four freed men, and the scientists' files repacked with their best takes. The conversations' unnamed lines ("On me.",
"Right behind you.", "Hang on. I've got you.", "Thanks. I owe you.", "Nice shot.") are voiced now; before they were skipped.
Reyes keeps his "Tower's down. Everyone back to the boat." (made on its own). 32 of about 2,000 lines are still flagged by
the recogniser, nearly all one- or two-word shouts ("Frag!", "Dog! Dog!") or names it mishears; their takes match the
length of the ones already in the game.

# v81: the Brood Mother awake when you come in

Bryan: "I think they should be awake upon entering. The battle commences immediately, right? Why would it roar from
inside before the fight then?" Right: she roared at the drawbridge, so she knows they're coming. Now she roars the moment
the squad comes in (0.6 s after the fade) and comes down the hall for them; her roar opens the first two side rooms as
before. The entry banner about something breathing in the dark is gone; her banner says where the medic station and ammo
are. Tested with the bot that only moves the squad: four soldiers won 3 of 3, eight won. A squad that comes in and does
nothing: she walks the hall under fire and reaches the entry hall in about 40 s; 1 of 2 won.
Found while taking pictures of the monsters for Bryan:
- She couldn't be seen beyond 36 m (everyone's sight limit), so from the entry hall she was invisible at the far end and
  nobody shot at her until she was close. She's seen wherever there's a line to her now.
- The lair's violet lamp sat right on her and burned her out to white up close: it's behind her and higher now, the two
  red lamps in the hall are a little dimmer, and the monsters' skin a little darker.
- "Flanked" came up over hounds (they don't take cover): not over monsters now.

# v82: puddles that look wet

Bryan: the puddles "just look like grey circles (I noticed this on the normal map too". They're ragged now, with a damp
darker ring, flat (the ground's fine bumps made them glitter), and the wet ground reflects a dim night sky with a few lamp
glows. Before and after: `docs/drafts/puddles-before-after.jpg`.

# v83: the new monsters and her nest, in the game

Bryan picked: "the hunters come out of the gate, the young fight alongside with her." The mother ("the mother is great for
now. They will get more fierce as the game goes on"), the eggs and the goo were already right; the slime rocks are as in
the round-3 drafts.
- At the drawbridge: the hunters pour out (the hounds' behaviour as before: they crouch with the violet line, lunge, pull
  back and come again), black, spined, scythe arms raised as they crouch, splayed flat when they die.
- Inside: the Headquarters is her nest (resin down the walls, wet resin over the lair's floor, egg clutches, slime rocks
  in black, deep purple, dark red and brown up every fitting and wall and out over the floor; a low amber glow over the
  lair, the red lamps deep orange-red, no pink). She lies coiled round her clutch, rears up to roar as you come in, comes
  down the hall with her body following her head, rears and crashes down to slam, strikes with her claws up close, and
  collapses when she dies. Her young (small centipedes) wait in the side rooms; they rear up before they lunge (their
  crouch) and die on their backs.
- What it costs: all the hunters share a dozen or so draw calls, and so do all her young; the gate with every hunter out
  fell from 1,639 draw calls to 428 (triangles 124k to 354k), the Headquarters from 611 to 340 (triangles 34k to about
  650k, most of it the slime rocks). Not yet measured on a real phone.
- Tested with the bot that only moves the squad: four soldiers won 2 of 2 (one or two down by the end: she now starts
  7 m nearer, coiled round her eggs), eight won with nobody down; the pour-out killed all 20 hunters each time.


# v84: her eggs hatch, and the scene after the gate

Bryan: "Her young as the swarm coming from the side rooms and from the nest eggs. The hunters pour out the gate." "The slime
rocks look fine." And after the attack at the gate: a soldier screams "What the hell was that?!" ("scream it, not say it
loudly"), the scientists say they can leave now and save themselves, the leader says no, they're moving in, team on him, be
careful; the scientists follow behind and are told to stay on the bridge till it's cleared, zip-tied to the railings. "Make
it feel natural, fear from scientists and one of the soldiers, then fearless reassurance from the leader."
- The eggs: each side room's clutch hatches as the room opens, and her own clutch hatches every time she roars (as you come
  in, at two thirds and at a third of her health). Five eggs split for each newborn that crawls out; newborns are smaller
  game (40 HP, a weaker bite). So the swarm doesn't double, one young waits in each room for a squad of four (two for
  eight), and the rest hatch. "Her eggs are hatching!" the first time.
- The scene: once the last hunter's down, one of the soldiers screams it (Okafor, else Kowalski, else Hayes: whoever isn't
  leading), a scientist begs to leave ("We can still leave! Please. We can save ourselves!"), another says what they made
  ("We bred those things. There's worse in there!"), and the leader answers ("No. We're moving in. Team on me. Be
  careful." Reyes, or Hayes if Reyes is down). The lines wait for each other; the chatter and the scientists' own panic
  lines keep quiet meanwhile. At the gather, when you tap to go in: "You stay on the bridge till we've cleared it.", the
  scientists walk out onto the drawbridge to its railings, one of the others follows and zip-ties them (they kneel, hands
  behind them), a scientist pleads "Don't leave us out here! Please!", and in. A tap to go in while the leader's still
  talking is kept for when he's done.
- The scream: the voice model shouts rather than screams (its takes came out at a man's speaking pitch, under a second), so
  the chosen takes were reshaped into screams with a vocoder: pitched up into a scream's range (about 300-350 Hz), rising to
  the last word, which is drawn out, with a waver, a crack, more breath and strain, then driven. A speech recogniser still
  hears every word. Bryan to judge by ear (`tools/voices/scream.py`).
- Continue from the drawbridge's or the gate's save brings the scientists back too (before, they only came back from the
  bio scanner's save), so they're there to be tied up.
- Once the drawbridge is down the scientists no longer say "Don't open it!".
- Found on the way: a hint line said "medic station and ammo drop" twice by the gate.
- Tested: the scene plays in order on its own and from both saves; the bot that only moves the squad, tapping to go in the
  moment the gate's clear: four soldiers won 2 of 2 (nobody down at the end), eight won; hatchlings and burst eggs
  counted inside; every new line decodes in the browser and the scene finds and plays each one with sound on.

# v85: the scientists tied up straight after the swarm

Bryan: "The scientists are detained AFTER the hunter swarm. Before the squads enter the HQ building the scientists are left
outside when it's all clear." In v84 they were only tied up when you tapped to go in. Now it's all one scene the moment the
last hunter is down: the scream, the two scientists, the leader's "No. We're moving in. Team on me. Be careful.", a beat,
then to the scientists "You stay on the bridge till we've cleared it." They walk out onto the drawbridge (round anything in
the way to its foot, then out along the deck), one of the soldiers follows them out, ties them to the railings and walks back
to the others, one pleads "Don't leave us out here! Please!", and the banner says to gather to go in. The tap then goes
straight in; they stay tied outside. A tap during the scene still waits for its end. A Continue from the gate's save puts
them back at the railings, tied.
Tested: in that order from the drawbridge's save, the tap straight in, the scientists outside on the bridge in the
Headquarters' saved outdoor state; from the gate's save tied at the railings at once.

# v86: the scientists brought in at the end, and a talk

Bryan: "Yes, one of the surviving soldiers exits the HQ off screen and returns with the scientist. Then a sequence happens.
Do you think we can handle longer conversations? Or do you think we should fall back to text conversations outside of
battle?"
- Once the Headquarters is taken: everyone who's up gathers in the entry hall ("Bring the scientists in." / "On it."), one
  of them walks out of a new door in its south wall into the dark, and comes back a couple of seconds later with the
  scientists who were tied on the drawbridge. They stop in front of the squad and the talk starts.
- The talk is a panel along the bottom of the map: the speaker's portrait, name and words, a tap for the next line, Skip
  for the rest. The words are a draft for Bryan (12 lines: the scientist, the leader, one more soldier) and have no voices
  yet: once he's happy with them they get voiced like the rest, and the panel plays each line's voice with its words.
  Then the freed men's goodbye and the report, as before.
- Meanwhile no orders, and nobody down bleeds out. The objective box reads "Headquarters taken" after the win, and the
  hint line "The Headquarters is yours." (it said "Here she comes." if she died before waking).
- Tested: the whole end on a phone and a wide screen (the fetch, the 12 lines through real clicks, then the report);
  the bot's fight through to the report, tapping through the talk; Levels 1, 2 and 3 start without errors.

# v87: start at a checkpoint (in front of the Headquarters)

Bryan: "Can you set me up in front of the HQ with both squads (from the prisoners-armed) and the scientists? This wouldn't
be a separate level, just a checkpoint. Btw, if players exit and come back to the game they can start off at checkpoints or
have a decision to start the level over."
- A new checkpoint, "In front of the Headquarters": it saves itself when the squad reaches the drawbridge with a scientist,
  before the bio scanner (the drawbridge's own save comes once it's down, as before).
- On the intro card, under Level 3: "Level 3 · start at a checkpoint" opens the list of Level 3's checkpoints (the
  warehouse, the bridge, the container maze, the data center's front, inside the data center, the scientists detained, in
  front of the Headquarters, the drawbridge down, the gate cleared). Every one is open for now, like the levels. Each
  starts at full health with the loadout from the between-missions screen; from the scientists on, with the four freed men
  armed with rifles and all four scientists. It becomes the save, so Continue comes back to it.
- Coming back to the game: Level 3 already offers Continue (with the checkpoint's name) or New game. Levels 1 and 2 still
  have no saves: they start from the beginning.
- Found on the way: "Stick to the containers. Out of sight." was said on arriving at any checkpoint north of the canal,
  even at the drawbridge; now only among the containers.
- Tested: the list on a phone; in front of the Headquarters with eight armed men and four scientists, the scan from there
  (the drawbridge down, the hunters, its save); from the scientists' save, walking up to the drawbridge saves the new
  checkpoint by itself.

# v88: the freed men stay

Bryan: "the freed prisoners are now part of the players squad. They never say bye." The goodbye at the end is gone: after
the talk in the Headquarters it goes straight to the report. (Their recorded goodbye lines are still in their voice files,
unused, and the voice tools no longer make them.) Bryan on the talk: "We will work on the script and after battle sequence
more after the testing of the HQ battle."

# v89: the bio scanner calls a scientist over

Bryan: "When using the bio scanner, a scientist should be called over no matter who detained him. When I press the bio
scanner, a unit and a scientist go over together. Right now, a scientist doesn't go." Before, only the soldier went, and
on arriving he looked for a scientist already within 14 m of the scanner; the scientists follow whoever tied them, so
usually none was. Now the press sends the soldier and the nearest scientist together, whoever tied him; the scan starts
once both are there. If the soldier is sent somewhere else on the way, the scientist goes back to the squad.
Tested from the "Scientists detained" checkpoint, about 70 m away, with a soldier who wasn't minding any scientist: they
walked over side by side and the drawbridge came down 17 s after the press; sent elsewhere at 3 s, the scientist turned back.

# v90: the hunters in one stream

Bryan: "I think all the hunters should attack at once, the waves were too long of a gap, make them run out of the HQ
entrance over the bridge continuously." The four waves over about half a minute (some climbing up over the moat's edge
beside the squad) are gone: all 20 hunters run out of the gate's mouth and down the drawbridge in one stream, about 0.3 s
apart, starting just after her roar, so all of them are out in about 6 s. The fight at the gate is over in 13-15 s.
Tested with the bot that only moves the squad (the shooting is automatic): four soldiers had one or two men go down on
each of 3 seeds and won every time (one man still down at the end on one seed); eight soldiers, nobody down. At a half
second apart it was easier with four (one seed nobody went down, the other two men left at 31 and 8 HP).

# v91: no dragging soldiers

Bryan: "I think we need to make it so when a soldier is clicked then they can be directed to move. I don't think I like
the dragging feature. Can we get rid of that? Too many times I accidentally dragged a unit to a different spot." Route
drawing is gone: a drag that starts on a soldier moves the map, like any other drag, and never moves anyone. Moving is by
tapping: tap a soldier (his fire team), tap him again for just him (or hold him, or tap his card), then tap where he
should go; a team's move is still the two-tap preview. Level 1's tutorial step 5 was "Draw a route"; it's "Send him" now
(Reyes selected, tap the ring by the crate; the dotted guide line stays). The controls list on the intro card says so.
Tested with real mouse input: a drag from Reyes moved the camera and nobody; tap, tap, tap the ground moved Reyes alone;
the tutorial lock test passes all 25 checks with the new step 5.

# v92: back to the group, harder monsters, no words over them, a natural yell

Bryan: "1) the player at the bioscanner should run back to the group (any time a unit does an action, they run back to the
group if they were originally with them. If not, they move independently, until the squad is back together. 2) the
monsters are a bit too easy, make it a little challenging. I wouldn't mind if some units got knocked down. 3) the text
above when they appear should be removed entirely. 4) “What the Hell was that” sounds weird."

1. A soldier sent off on his own to do something (the bio scanner, the drawbridge's panel, a thing to use or hack, a zip
   tie, a revive or a medic kit, a takedown, a frag or a rocket he has to walk for) who was with others when he went
   (within 8 m of one of them) runs back to them once it's done, to wherever they are by then ("Regrouping"); a man he was
   sent to revive comes back with him. One who was already off on his own stays where he finishes. Another order on the
   way, or in the moment after, and he does that instead. Posts are kept: the pillbox's gun, the tower, a door opened to
   look through. Tested from the "In front of the Headquarters" checkpoint: the scanner soldier walked over, the scan ran,
   and he was back with the others 3 s later; one sent from 29 m away from everyone stayed by the scanner; one sent to
   revive a man 15 m out of the group came back with him. Level 2's quiet run (takedowns, the panel) still wins unseen.
2. The gate: hunters have 80 HP (70), run 110 (86), lunge for 22 (18) and bite for 12 (10); two in three swing out to one
   side once off the drawbridge and come in from there; a bigger squad gets more of them closer together (four men: 20,
   0.2 s apart; eight men: 36, about 0.08 s apart). The drawbridge's medic station and ammo drop now come once the gate is
   clear: standing in the medic ring healed 8 HP a second through the whole fight. The bot (it only stands in a line and
   revives; the shooting is automatic) with eight men: 0 to 3 down (usually 1) over 7 seeds, all won (before: nobody
   down); four men: 0 or 1 down on 7 of 8 seeds, 3 on one, all won. Denser streams for four men wiped them now and then,
   so they keep the wider spacing.
   Inside: the Brood Mother has 600 + 230 a man (180), her slam does 65 (55) and her swipe 34 (28), a big squad (six or
   more) meets three young in each side room (two), and another room opens every 30 s (40). Eight men: 3 down inside on the
   test seed (before: nobody, her down in half a minute).
3. No words over the monsters at all: no contact banner or "Contact!" call when they come, no PINNED, and no hit-chance
   pill under them (with a swarm out that was a wall of numbers); their health bars stay.
4. The scream is a natural yelled take now, no reshaping: Zonos made several takes per soldier with fear and surprise in
   the voice, all checked by the speech recogniser, and the loudest, brightest one of each is in (Okafor's is the one
   usually heard). The pitch-raised version (scream.py) is no longer used.

# v93: the scream, screamed

Bryan: "Can't the 'What the hell was that!?' be screamed?" The voice model (Zonos) only shouts: with any emotion and pitch
settings, and even carrying on from a recorded scream, its takes stayed at a man's shouting pitch (115-155 Hz; real screams
are 280-370). It copies a voice from a reference recording, though, and a reference of a man screaming brings the scream with
it: five CC0 screams (HaelDB's yells, already used for the pain screams) end to end, blended with the soldier's own reference.
Now Okafor screams it at about 340 Hz with some of his own voice kept (40 %); Kowalski and Hayes, who say it only when Okafor
is down, from the screamer's voice alone, at about 310 and 390 Hz (their blends stayed under 260 Hz). Nothing reshaped
afterwards, and a speech recogniser hears every word of all of them. Still over the radio, like the squad's other lines.

# v94: a bigger gather box, and a clear screen when the drawbridge comes down

Bryan: "1) make the green box larger. 2) don't say Drawbridge Down and don't expand the objective list. I want full visual
when the monsters attack." The green box at the drawbridge (gather everyone there to go into the Headquarters) is about
three times the area: 15 x 13 m, it was 12 x 6, which eight men sent there together didn't always fit in. The drawbridge's
medic station and ammo drop (they come once the gate is clear) moved 5 m west, out of it. Lowering the drawbridge shows
nothing now: no "Drawbridge down!", the objective list doesn't open (it's crossed off quietly), and the save happens without
its "Saved" chip; a Continue from that save doesn't put up "Continuing: Drawbridge down." either.

# v95: after the boss: the wounded, the scientists, the clean-up, the finished HQ

Bryan: "Okay that was a pretty awesome boss battle lol. Hard but winnable. Now, when the match is over. The player should
revive any downed unit, if there save bar hasn't depleted, remember only a medic can revive when it's depleted completely,
so if one managed to survive they can survive them all. Then the player should send someone to go get the scientist. When
the scientists come in, they all walk to the center while the conversation is happening. Then after the conversation the
screen shows a montage of the units and scientists cleaning the HQ. It then goes to the complete HQ which has a command
center, medic table, supply table." (His ideas for more stations and rooms are in docs/hq-base.md, as a proposal.)

- Once nothing's left alive, nobody bleeds out: each downed man's bar stops where it is. A teammate beside him gets him up
  while his bar lasts; once it has run out (CRITICAL) it takes a medic kit, or carrying him to the medic station. The
  ammo drop refills a medic kit, so one medic can get everyone up.
- BRING THE SCIENTISTS at the entry hall's south door: select a soldier and tap it (while anyone's down it says "Get the
  wounded up first."). He goes out and comes back with the scientists left tied on the drawbridge; as they come in,
  everyone walks to the middle of the hall while they talk.
- Then the montage: four shots with a fade between: her lair, the squad and scientists kneeling round the clutch while
  the eggs come away; a side room, the resin and slime rocks coming off the walls; the hall, clean, the scientists at the
  old consoles and the squad hauling the debris out while the lights come back on one by one; and the finished HQ.
- The finished HQ: the hall clean and lit, a command center in the middle (a map table that lights up, three screens,
  chairs), a medic table and a supply table (they heal and refill like the stations did), the six side rooms empty and
  labelled for what's built next. "Mission complete!", the report, and a save: Continue (or the new last checkpoint,
  "The Headquarters") goes straight back in.
- If every scientist died at the gate, there's nobody to fetch: the clean-up starts by itself once the wounded are up.
- Found on the way: the side rooms' floor creep in her nest had never shown (its seed read room fields that don't exist,
  so every vertex was NaN); it shows now, as designed. Scorch marks inside the HQ were being painted onto the big map's
  ground. And the test harness only reported page errors from loading, so errors after that never showed in any test; it
  reports them all now (the nest's NaN was the only one).
- Tested headless: two men down after the fight (one still bleeding, one critical), their bars frozen for 10 s, the fetch
  refused until both were up (9 s: a hand revive and a medic kit), the fetch, all twelve lines while everyone gathered in
  the middle, the montage and the finished HQ, the save, Continue straight back in (healing at the medic table). With a
  real fight, eight men: won with one down, the bot got him up and went on through the talk and the montage to the report.
  Four men lost to her on that seed. With no scientists, the clean-up started on its own. Level 1's tutorial lock test,
  Level 2's quiet run and the regroup test still pass.

# v96: out of the HQ, the road east to a dark tunnel
Bryan, after v95: "1) supplies and Intel to start 2) the moment you get the supplies. 3) both, upgraded to strikes later
one. Extra men start at level 1 and are limitedly available 4) Yes it should grow. 5) Both 6) yes. As for the map outside.
When the user exits, the map now extends to the right. The road continues out to a dark tunnel. The leader says, alright,
we need to get our radio communication up. Then a scientist responds, there's a decommissioned radio tower accessible from
the tunnel down the road. You'll probably find the supplies you need from there. And that opens up to the next mission."
(His six answers are in docs/hq-base.md, with the plan rewritten to follow them.)

- In the finished HQ, gather everyone at the entry hall's south door (GO OUT n/m, then TAP TO GO OUT). They come out of
  the gate two by two and walk off the drawbridge; the first time, one of the scientists walks out with them.
- The big map now goes on past its old east edge. The piece of the east fence across the runway road is gone (its two
  gate leaves stand open), and the road runs on, narrower, past an empty sentry hut and a failing lamp, round a bend to the
  left and into a tunnel in a hillside: a concrete portal, chevrons either side, black inside, a dim work light over the
  mouth and a red light far in. Rock along the north and east, the canal along the south, boulders and a burnt-out car to
  take cover behind. It stays open from then on, saves included; a new game closes it again.
- The first time out, the camera goes down the road to the tunnel, the leader (Reyes, or Hayes if Reyes is gone) says
  "Alright, we need to get our radio communication up." and the scientist answers "There's a decommissioned radio tower
  accessible from the tunnel down the road. You'll probably find the supplies you need from there." Both are voiced
  (Zonos, as before). Then the camera comes back to the squad and the scientist walks back in. Objective: "Next mission ·
  The old radio tower". A save: "The road east" (the last checkpoint on the intro card).
- Then Bryan: "The tunnel could be it's own map. When approaching it it changes to it." So it is: walk everyone into the
  mouth (TUNNEL n/m) and half a second after the last one's in, it fades into the tunnel by itself, no tap. Inside: a dark
  two-lane road tunnel running north under the hill, about 125 m, walls cut away low so the floor reads (like the office
  building), glowing studs along both kerbs, most wall lights dead and a few flickering, red lights by two cross-passage
  doors. On the way: the old checkpoint's barrier arm down across one lane, a car slewed across the other, a lorry left in
  the east lane, a jet fan fallen from the roof, and a collapse that leaves one way through on the east side. At the far
  end the portal opens on the night; the old radio tower's mission isn't built yet, so the gather area there says so. Walk
  back to the south end and it takes you out the same way. Nothing is waiting in it yet: that's yours to say.
- Classes (Bryan: "when the team finishes the HQ, I think classes should be assigned to the units... Maybe we should wait
  for the radio control"): today the choice is only on the boat screen before Levels 2 and 3, nothing after the HQ offers
  it, and the freed men can't take one. Agreed to wait: with radio control, promote at the HQ and bring the class weapons
  in on a supply drop (docs/classes.md, docs/hq-base.md).
- The drawbridge's green area takes the squad back into the HQ (in at the south door); going out again doesn't replay the
  talk.
- Under the hood: the pathfinding grid is wider than the old map now (1440 instead of 1000), and the old edge still counts
  as the edge on every map until the road opens.
- Found on the way: every scientist brought into the HQ (the fetch, a Continue) was in the game's list of people twice, so
  they moved at double speed (fixed). After a Continue into the HQ there was no way back in from outside, because the
  drawbridge's gather area only existed after the gate fight (fixed).
- Tested headless: from the HQ save, GO OUT, the walk-out, the camera, both lines, the save, real paths to the tunnel for
  all eight (about 10 s), a tap on the new ground, back into the HQ and out again; into the tunnel by walking (it switched
  0.5 s after the last man was in), real paths to the far end round every wreck and through the gap at the collapse
  (about 22 s), the far end's message, back to the south end and out by itself (short of the mouth, so it doesn't send
  them straight back in), in again, a reset from inside; the same from the end of
  a real fight, the fetch and the montage; Continue from every Level 3 checkpoint; a new game. Regressions: Level 1's
  tutorial lock (0 fails), Level 2's quiet run (won, never seen), back to the group after a job, the gate and the HQ fight
  (eight men, won, three down at the end), the HQ's end.

## After v96: classes (decisions, not built yet)
Bryan, on the two class questions: "1) yes, freed men turn into normal soldiers. 2) I think it first unlocks at the HQ.
Maybe [any] class upgrades happen when the team returns to the HQ." And: "each class will start to unlock special tools
they can equip. Like support can get a mobile turret. Medic gets a heal dart, assault gets C4. And they continue to unlock
as the game progresses. They don't unlock on every level, just big milestones. We can discuss more." Recorded in
docs/classes.md with a draft table of tools per class and milestone for him to adjust; built with radio control.
Then, on the draft's three questions: "1) Free/unlocked. The equipment is radio'd in and arrives in a helicopter on the top
floor (needs a radio tower). 2) hmm I'm not sure, maybe unlock slots as they level up. 3) tools and better versions of the
class. As the game progresses enemies get stronger too." Recorded in docs/classes.md; the order of work in docs/hq-base.md
now puts radio control and the roof (helipad, radio tower) before classes at the HQ.

# v97: the HQ's upstairs (the stairs and the lift, the second floor, the roof)
Bryan, after v96: "I think we should build the HQ, and then the story to continue to the radio tower. Let's make the
conversation end with once we get the radio tower we can request more advanced equipment. Or something like that." The
road east and the tunnel the way he describes them next (the bridge, the lake, the lighthouse, the bus, the centipede, the
dark tunnel): v98.
- Where her lair was, at the north end of the hall: a flight of stairs up (UP) and a lift (LIFT UP). With soldiers
  selected, tap one: everyone selected on that floor goes, each up the whole flight on his own, or into the car (it goes
  once they're all in, a ride of about 2 s). The camera follows them when nobody selected is left on the floor on screen.
  The floor chip on the right (ROOF, 2F, GF) switches floors, with a dot for each man on each, like the office building's;
  picking a team or a card whose men are upstairs takes the camera there too.
- The second floor: a corridor north to the stairs up to the roof; the briefing room (a long table, a wall screen with the
  area's map and the old radio tower marked, a whiteboard) and the barracks (ten bunks, lockers, a table) west of it; two
  empty rooms east of it, for what's built next; a landing along the south side with the stairs down and the lift.
- The roof: a parapet round it, the stairs' housing, the helipad (a yellow ring and a white H, green lights round it, a
  windsock), the radio tower's base (a concrete plinth and the stub of a lattice mast with a blinking red light; it says
  NEEDS PARTS: the next mission), air conditioning units, vents and lamps. It's outdoors: rain and lightning up there, and
  the rain is only a hiss on the floors below.
- The road talk ends with the leader: "Once we get that radio tower running, we can request more advanced equipment."
  Voiced for Reyes and Hayes (whoever leads); the speech recogniser heard every take word for word.
- Under the hood: the pathfinding grid is wider again (1800), with the second floor east of the ground floor in the same
  frame, and the roof north of it.
- Found on the way: the lift could set a man down outside the hall's north wall (the nearest free spot to where he stood
  in the car); the ground outside the walls is closed off now.
- Tested headless: from the HQ's save, all eight up the stairs by real paths (about 11 s) with the camera following, every
  room on the second floor reachable, up to the roof (about 13 s), the helipad, the tower's base and the corners reachable,
  everyone over to the helipad, down to the second floor and the lift down (a 2.2 s ride), two men up in the lift, the
  floor chip and picking the men upstairs taking the camera there, GO OUT only on the ground floor, out, Continue back in.
  The road talk's three lines in order. Regressions: the road east and the tunnel, Continue from every Level 3 checkpoint,
  the HQ's end and its montage, the office building's stairs, lift, doors, breach and carrying (its floors share the chip),
  back to the group after a job, Level 1's tutorial lock (0 fails), Level 2's quiet run (won, never seen); no page errors.

# v98: the road to the radio tower
Bryan, after v96: "So to start the next mission, the soldiers exit the level. And move east on the road that now appears,
the screen slides over with the troops when they move. It's over a bridge, a larger river/lake is north of the soldiers and
a lighthouse circling is seen in the distance. The soldiers continue to the right/east where they see the tunnel entrance.
A centipede monster can be seen crawling into the tunnel from above it and crawls on the ceiling. The tunnel is pitch
black. A broken down bus is scene on the left lane. Inside the tunnel will have other broken down cars and dead bodies
hanging outside the car and on the road. Blood is pools around the bodies and trails can be seen."
- The road east is laid out again, further: out through the gap in the east fence, east over a bridge across a river
  that runs out of a lake to the north (the canal runs into it), on to the foot of a hill at the far east of the map, round
  a bend into the tunnel. The lake runs on north past the map's edge, round the fortress's moat; out on it a lighthouse in
  red and white bands, its lantern lit and its beam going round.
- The first time out: the talk by the drawbridge (the leader, the scientist, the leader's new last line), then the
  scientist goes back in and the squad sets off east by itself, two by two, the camera sliding along with them, tilted a
  little so the lake shows; over the bridge, to where the tunnel's mouth is in sight. There the camera goes to the tunnel: a
  centipede (one of her young, bigger) comes over the hill, down the headwall's face, under the arch and in along the
  tunnel's roof upside down; a growl, and "Movement! Over the tunnel." Then back to the squad, the objective (the old radio
  tower, through the tunnel) and the save. About 35 s in all if you let the talk play.
- A coach broken down in the left lane at the mouth, its nose in the tunnel, one tyre flat, panes gone, its door open. The
  gather area at the mouth is the east lane and the verge beside it.
- Inside, pitch black: every wall light dead but one sputtering tube, the red emergency lights by the cross-passage doors,
  three road flares burning red by the wrecks, and the squad's torches (brighter in here). The coach across the left lane at
  the way in, three more cars left with their doors open, the slewed car and the lorry as before, the fallen fan and the
  collapse; eight dead, three half out of a car's door, the rest in the road, blood pooled round each and four trails where
  someone was dragged, one of them off north into the dark. Still nothing alive in there: yours to say.
- Continue from the road's save puts the squad back where it stopped, in sight of the tunnel.
- Found on the way: with the coach in the left lane the mouth's gather area was one man too narrow for eight (the last
  always stood outside it, so the tunnel never came in); it takes in the verge now.
- Tested headless: from the HQ's save, GO OUT the first time: the three lines, the walk east (about 13 s, the camera
  following them over the bridge), the stop in sight of the tunnel, the centipede (about 7 s from the hill to gone inside),
  the save; all eight into the mouth and the tunnel by itself (about 6 s); inside, real paths round every wreck and the
  dead to the far end (about 20 s); back out by itself; Continue from the road's save. Regressions: Continue from every
  Level 3 checkpoint, the HQ's end, its upstairs, the office building's stairs and doors, back to the group after a job,
  Level 1's tutorial lock (0 fails), Level 2's quiet run (won, never seen), the HQ fight (won); no page errors.

## After v98: a draft of the next mission
Bryan: "Show me a draft". `docs/map-draft-H.png` and `docs/level4-draft.md`: Level 4, "Dead Air", the old radio tower
through the tunnel. The Crawler in the tunnel, a valley road with a roadblock, woods with hunters in them, the compound
on the hill (a sniper on the dead mast, a machine gun at the gate, a radio man who calls a truck in), three supplies to
carry home and a radio log for intel. Five questions for him at the end of the write-up. Nothing built yet.
Bryan: "No, so the east road is over a bridge to the tunnel. In the tunnel there's an interior that leads to a tunnel which
will reach the radio tower on top of the hill the tunnel is under." Redrawn as `docs/map-draft-I.png`: a side view of the
hill (the road tunnel along its foot, its north end caved in; a service door in it up into the plant, the tunnel's control
rooms in the rock, where the brood has nested; the incline, an access tunnel with steps and a rail car up through the rock,
where the Crawler lives; the old radio tower on the summit, a militia outpost that watches its own track and the road, not
the bunker the squad comes out of), with plans of the plant and the summit. `docs/level4-draft.md` rewritten to match, with
five questions.
Bryan's answers: "1) yes caved in (for now) 2) enemy soldiers are in the radio tower/summit 3) a zip line leads to the
bridge and they can make a quick route back. 4) let the player choose. Going up the lift alerts more enemy monsters and the
guards hear them coming. Enemy monsters will come up and attack not only the player but the enemy troops too. Taking the
stairs is quiet and the enemy troops are unaware. The player can split the teams and keep one group undetected. 5) The Old
Radio Tower is a good name". Recorded in `docs/level4.md` (renamed from level4-draft.md), drawn as `docs/map-draft-J.png`.

# Bryan testing v100 (from Level 1; the changes once he's done)

Bryan: "Im testing from level 1 - I'l write down what needs to be improved or changed. When I am done I will tell you."
Then: "No upgrades until I sy im done testing - so we can go over them all togerther." His notes, collected here as they
come; nothing new is published until he's done and we've gone over them together.

1. "The tutorial level doesnt show the yellow and green circles for the suplly and med" (Level 1's checkpoint by the hut).
   Found: no checkpoint anywhere has drawn its rings since v71. hq.js's ring drawing was called `drawHQ`, the same name as
   fortress.js's health bar for the Brood Mother, which loads later and replaced it. Fixed after v100 (renamed
   `drawStations`), committed, not published; the ammo drops' strobes blink again too (the same function blinked them).
   Seen in the same screenshot: on a phone the "BASE · CALM" line under the ring at the top ran into the objective box.
   Fixed (the box is narrower while that line shows), committed, not published.
2. "After Level 1 my units leveled up to select a new class - but it is not available. It should say Unlock Radio Tower
   for upgrades." The report said "Level up · choose his class next"; the class choice is on the boat screen after it
   (PROMOTE under his name). Then: "or maybe we should allow level ups but no new equipment until the Radio Tower is
   built. - Yeah lets do that." To do: soldiers keep levelling up; the report's line says Unlock Radio Tower for upgrades;
   no PROMOTE, no classes and no new equipment until the radio tower is built at the HQ (radio control, after Level 4).
3. "Also a level up should make a sound. Maybe the exp bar moving up can make a noise too." To do. They'd be the game's
   first interface sounds (the beeps and jingles were taken out as too arcade), so they should be low-key.
4. "for some reason controlling units is harder. I dont like the hard switch to the squad I select. Maybe I liked the
   dragging the troops before, but I kept on accidentally moving them scrolling around - is there any way we can fix that
   (answer when testing is done.)" What's there now: picking a team (its tab, a card, one of its men) whose men are all
   off the screen or on another floor cuts the camera straight to them, no glide (`selectAway`, `goTo` in input.js;
   Bryan: "if selecting the other squad, it should bring you to them"); dragging soldiers was taken out in v91 (after
   v90: "Too many times I accidentally dragged a unit to a different spot"). Neither changed in v99-v100 (the floors were
   made one interface for Level 4; Level 1 has no floors). To answer when he's done.
5. "The med pack should cure players to 100% health while they stand." Built in v101: the kit on a man who's hurt but
   up, or on the man carrying it, brings him back to 100 in 3 s (the medic walks over and keeps up if he's moving; not
   while pinned; another order calls it off). A downed man still gets up at 50.
6. "Players should hold two smoke and 1 grenade." His answer to which: the smoke item holds 2 (a soldier who takes smoke
   gets two); the frag stays one each. Built in v101.
7. "Move the sniper to the left side of the bridge, but sneaking through the pipes can avoid the tower's sights. The
   sniper should be able to be reached so fighting across the road is doable. It's still a little tough." His answer
   to which road: the runway road. Built in v101: the tower stands west of the bridge's road on the strip between the
   containers' last row and the runway road, its ladder by the gap in that row; its sniper (one of the data center
   front's men now) faces up the road to the east, so nothing on the pipe route, the road's far west end or the strip to
   the doors is in his sight (checked by script); from the gap a soldier gets a clear silent shot at him; up there the
   rifle covers the whole front across the road, 20-40 m. The bridge is lighter for it (no sniper over it).
8. "I dont want to make the enemies easier but I want to make it eaesier for the player to sneak around. Can we lower the
   enemies sights a tad bit?" Built in v101: every unaware man sees a tenth less far (30 m to 27; the snipers 62 to 56,
   Level 1's guards 21 to 19, Level 2's 25 to 22.5); an alerted man's sight in a fight is unchanged.

Bryan: "Im ready for these changes." Then, on his questions: the camera "Don't move the camera to the other squad
UNLESS they are in another screen. I think that is where I confused you." (note 4: built in v101, the camera goes only
to another floor; a team merely off the screen is just selected), and dragging: "Hold, then drag" (built: hold a soldier
a moment, he's picked out, then drag his route; a drag that starts straight away moves the map). Notes 2 and 3 built in
v101 too: classes wait on the radio tower (the report and the boat screen say Unlock Radio Tower for upgrades), and the
report has a level-up chime and soft ticks as the XP bars fill.

Bryan, before v101 went up: "Actually can we place it at the far left corner against the containers looking towards the
entrance of the data warehouse and up the road?" Moved: the tower stands at the container yard's north-west corner,
against the west end of the last row, its ladder on the yard's west strip behind him; the sniper faces between the doors
and up the road. The pipe, the first aisle and the west strip are out of his sight, so the squad can come up behind him
and take him with a silent shot from the foot of his ladder; from the platform the rifle covers the doors and the whole
front (31-66 m). The old quiet way (behind the barrier, along the building to the doors) is in his sight now. Found in a
scripted run: killing him quietly starts the radio's clock; the check-in came 9 s later and sent the yard's patrol to
him, who saw the squad crossing the road. Question for Bryan: take the sniper off the radio check-in?
Bryan: "That way, hugging the left side all the way down will get to it. But going straight through the bridge means you
will fight it." Built in v101: the tower's sniper is off the radio check-in and his body up on the platform isn't seen from
below, so taking him quietly from the west strip doesn't send anyone; the loud way up the bridge's road comes out onto the
runway road in his sight. Scripted: timing the yard's patrol, up the west strip, a silent shot from his ladder, across the
road's far west end behind the jeep: at the doors unseen on 4 of 4.

# After v101: the sniper nest

Bryan: "Or what if it was across the road, and the sniper looked out towards the road and the entrance from the bridge. We
should also put a large red cone where the sniper sees. The players should say Sniper Nest NorthWest of us against the data
center or something like that. Really make sure the players knows the sniper tower is there." Built in v102: the nest stands
against the data center's south wall, between its doors and the heavy gun's nest; the sniper looks out over the runway road
and down the bridge's road to the canal (straight up from the bridge you fight him; the quiet ways in are behind him). A big
red cone on the ground shows where he sees, from the start, cut off where the buildings and containers block his view; SNIPER
NEST over the tower; the hint line says where he is; and a few seconds after they're out the leader says "Sniper nest. Up north,
against the data center. Stay out of his sights." (from where they come ashore the nest is due north, so not "north-west";
recorded for Reyes, Kowalski, Hayes and Okafor). A silent shot from the doors takes him quietly. Scripted: the old quiet way
and the way up the west strip both reach the doors unseen.

Bryan, after v102, with an arrow drawn on a screenshot (his camera turned so the road ran up the screen; the arrow from the
road's far west end, by the data center, up the screen to the doors): "No I want the watchtower to look like this, looking
north." Up his screen is east on the map. Built in v103: the tower stands at the road's far west end against the data
center's south-west corner, looking along the building's front to its doors and up the road (his cone, the label and the
warning line as before). Hugging the left side (up the yard's west strip, over the road's far west end) gets to the foot of
his tower unseen; up there he only watches his cone, so a silent shot from his ladder takes him; then along the front to the
doors. Coming straight up from the bridge, the bridge road's mouth is in his sight.

Bryan, after v103: "Yes the location is good but can you just it out and put it on the sidewalk adjacent to the road?"
Built in v104: the tower stands out from the wall on the sidewalk at the road's far west end, its south side at the road's
edge, still looking east up the road to the doors (his cone, the label and the warning line as before). The way to it is
the same: up the yard's west strip and over the road's far west end to his ladder, out of his cone. A single silent shot
from there hits about 9 times in 10 (the rails are half cover) and a miss wakes him, so two silenced men on the count are
the sure way. Scripted: unseen to the doors on 6 of 7 runs; the seventh was that miss. From the platform the rifle still
has all seven of the front's men in sight.

# Bryan testing v104 (the changes are in v105)

1. "So I am trying to throw smoke with Alpha up ahead near the dead body but they say I can't. He's not pinned, so he should
   be able to move to the corner and throw it. The only time someone can't do an action is if they are pinned and it would
   say I'm Pinned, I can't do that! And it should be a voice bubble above them, maybe even have them say it. Or do you think
   the flashing on top would be better". Since v71 smoke and the rocket only ever went from where he stood: round a corner,
   past a stacked container or out of reach, the game said "No clear throw from here" and he stayed put. Now a frag, smoke
   and the RPG all go from where he stands when they can, and otherwise he walks to where they can (a safe spot first, else
   the nearest that works, however far) and throws there. A fire order with no line within a short walk looks further, and
   the silencer's aim moves him up for a quiet shot. Pinned, he still throws from where he stands if he can, but won't
   leave his spot: a speech bubble over him, "I'm pinned! I can't do that!", and he says it (recorded for all eight).
   Moving him is still an order he takes, so he can always be got out. My answer to his question: the bubble over him, with
   his voice, rather than flashing text at the top: it says who (with two teams and eight men a banner doesn't), it's where
   the player is looking when giving the order, and the top of the screen already carries the objective, the detection
   ring and the banners he found piling up before.
2. "All actions should work like that. But there should be a limit on how far they can move. Let make a small imaginary
   circle around the unit. You can draft it if you want a precise distance". The circle is 10 m round the soldier (one
   number, `ACT_R`; a picture of it sent with v105 as the draft). Every action now works the same way: from where he
   stands if he can, else he goes where he can, but only inside that circle and by a way that stays inside it: throws,
   shots, hold-to-suppress, silent shots and volleys, takedowns, revives, medic kits, carrying, zip ties, anything to use,
   the pillbox gun, the watchtower, the bio scanner, doors, Breach, the class skills and building. Beyond it he says "Too far.
   Move me closer." (a bubble and his voice, recorded for all eight) and stays put. Getting about has no circle: moves, the
   stairs, the lift, the gather areas, and sending a man out for the scientists. While aiming a throw a dotted ring outside
   the dashed one shows how far it reaches once he's moved up. Things that used to go further: frags walked up to 36 m to a
   safe spot, revives, kits, zip ties and things to use had no limit, a takedown worked from 14 m and Breach from 15 m.

# Bryan, after v105 (the changes are in v106)

1. "We can keep all these like this: Frags used to walk up to 36 m to a safe spot. Revives, medic kits, zip ties and using
   things had no limit at all. Takedowns worked from 14 m, and Breach from 15 m." Those are back as they were before the
   circle: a frag (and the M203) walks up to 36 m, a safe spot first; a revive, a medic kit, carrying a man, a zip tie and
   anything to use (with the pillbox gun, the watchtower, the bio scanner and doors, all "using things") go however far; a
   takedown from 14 m; Breach within 15 m. The 10 m circle stays for the actions where the soldier picks the spot himself:
   smoke, the RPG, getting a line on a man you tap, suppressing, a silent shot, the class skills and building. Pinned, he
   still won't leave his spot for any of them.

# Bryan, after v106 (the changes are in v107)

1. "When I press an action, can all available teammates go to the action to provide cover? Do you think that will be a good
   idea? Maybe if you hold an action down the whole team goes? Let's discuss before committing". My proposal: let the
   selection decide, no hold (a hold on the ground is already the lasso and on a hostile it's suppress). Bryan: "I like how
   it depends on who is selected. If you have a team, they all go. If you have just one unit, he goes." Built: with a team
   selected, one man does the job as before (the nearest who isn't pinned or busy) and the others go with him and take cover
   round where he'll be, the way a group move places them. That's for a revive, a medic kit or carrying a critical man, a zip
   tie, anything to use, the pillbox's gun, the watchtower, the bio scanner and a door. With one soldier selected he goes
   alone and comes back to the group afterwards, as before. A man picked from his card (a throw, his kit, a skill) is always
   alone. Who stays put: anyone pinned, anyone busy with a job of his own, and anyone already standing within 4 m of the
   spot with a line to it. Defaults I took: they go even when there's nothing to hide behind there, they sneak if the team
   is hidden, and the lift's doors and the card door at the top of the office's stairs stay one-man jobs so the men put
   beside those doors don't move. Found on the way: the spot-finder ignores doors, so it could put a man in a shut door's
   doorway; it can't now.
