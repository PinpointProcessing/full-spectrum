# Playtest notes (Bryan, testing v64)

Bryan: "I am testing now so take my notes into consideration and then we can make the changes."
His notes, collected here as they come; the changes are made together once he's done.

1. Level 1's ending: "at the end, the radio relay - its confusing how your supposed to take it down. We will redesign
   Level 1 but for now it's good." (Level 1 stays as it is until the redesign.)
2. Instructions in the middle of the screen: "the instructions are right in the middle of the screen - we should place them
   somewhere else. Same with in the warehouse." That's the cyan box near the top of the map (`#tut`): Level 1's boot camp
   and tips, and Level 2's checkpoint tour after the warehouse (`hqGotIt` in hq.js uses the same box). Where to: to agree.
3. Level 2 north of the canal: "Make the containers horizontal and run along the canal. There is a large road before the
   data center, like a runway road, not small. The jeep patrols that road, from left to right continuously (the user can
   sneak by or engage). The containers are lightly guarded with most in front of the data center and at the bridge. The
   whole point of the containers is for stealth. Show me a draft image of the level and I will tell you if it's right."
   Draft: `docs/map-draft-F.png` (three rows of containers along the canal's north bank; a 13 m runway road across the
   map; the gun jeep driving it end to end; guards: containers 3, bridge 6, data center front 7 plus the jeep).
   Bryan: "Yes this works! And let's make the truck just a light jeep." Built and committed (not published until he's done
   testing). Two changes from the draft, found by testing the quiet route: a container closes the west half's first aisle
   at its east end (the tower's sniper could look down it and spot the squad leaving the pipe), and the data center's guns
   and riflemen stand a little further east (x 350-710) so the far west end of the road is the quiet crossing.
