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
