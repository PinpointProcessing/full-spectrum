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
