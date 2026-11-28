# Drafts after Version 258: Alpha on the guns, Bravo on foot (not built)

Bryan, after Version 258: "Alpha squad man's the guns and Bravo squad is on foot. When Bravo is selected, it goes to the player cards with access to the tools. When Alpha is selected, it goes to the stationary guns. If they are not on a gun, their name will appear above the gun and when pressed expands the card to be used. Write out some drafts of this."

Picture: `v259-alpha-bravo-drafts.jpg`, three ways side by side (A, B, C), each in three states: 1 Alpha picked with one man off his gun, 2 a tap on his name opens his card, 3 Bravo. It's Chapter 2 in wave 1 on a phone held upright (390 by 760): the game's own picture and bars as they are in Version 258, with the new parts laid over them. For the pictures Zielinski (Alpha's gunner) was taken off the heavy MG and stood 5 m behind it, Bravo's four were put in cover in front of the guns, and the banner and NO REINFORCEMENTS were hidden. Made by `tools/drafts/v259-alpha-bravo-draft.js` and `tools/drafts/v259-alpha-bravo-sheet.py`.

## The same in all three
- Alpha's four are on the guns and the row of guns at the bottom is theirs. Bravo's bar is the squad bar from the beach: their four, their health and the tools they carry between them (grenades, rifle grenades, smoke, bazooka, medic kits, 1st person). In Chapter 2 today that bar is hidden: the row of guns is there whichever squad you pick.
- An Alpha man off his gun has a card: his face, health, his own tools (Zielinski: a grenade and two smoke), 1st person, why he's there ("the HEAVY MG is empty, 5 m away") and BACK ON THE HEAVY MG, which sends him back to the gun he left (the dashed arrow on the map). With the card open, a tap on the map moves him and his tools work like the squad bar's (tap one, then the map).
- When the card opens, the view slides up a little so he and his gun stay in sight above it.

## A · His name over the gun on the map (Bryan's words read one way)
- ALPHA | BRAVO tabs along the bottom, just above the bar. Each says what it is (GUNS · 3 OF 4 MANNED, ON FOOT · TOOLS) and has a dot for each man; the man off his gun is a hollow yellow dot.
- ALPHA shows the row of guns. A man off his gun gets a tag with his name over his gun on the map, replacing the game's HEAVY MG · TAP TO MAN. A tap on the tag opens his card, and the rest of the map dims.
- BRAVO shows the squad bar. No tag.
- Weak spot: the four guns stretch over about 36 m and an upright phone shows about 20 m at the guns, so at most two guns are on screen at once. In the game's own view after the opening only one of the four guns was on screen, at its left edge. So the tag is often off screen and would need an arrow at the edge with his name. It also adds to everything else drawn over the battle, and the tabs along the bottom take about 50 px off the map.

## B · His name over the gun's tile (my pick; Bryan's words read the other way)
- "Above the gun" read as above the gun's tile in the row at the bottom.
- The tabs stay where they are today, bottom left.
- ALPHA shows the row of guns. A man off his gun gets a tab with his face and name over his gun's tile. A tap on it opens his card from the bottom, over the row. CLOSE, or a tap on the map, brings the row back.
- BRAVO shows the squad bar. A yellow note beside ALPHA's tab says who's off his gun, so he isn't forgotten while you play Bravo.
- Nothing new is drawn over the map.

## C · One bar, no tabs
- Both squads are always at the bottom: Alpha's four guns as small tiles on the left, Bravo's four and their tools on the right.
- A tap on the map always goes to Bravo, since Alpha doesn't walk. A gun's tile works as it does today.
- The man off his gun has his name on his gun's tile. A tap on it opens his card over the bar.
- Bravo's tools are always one tap away. The third picture has a grenade taken straight from the bar, its reach in orange as the game draws it today.
- Weak spot: it's the tallest. The bar is about 170 px, against about 115 for A's tabs and row and 70 for B's row (B's tabs float over the map at the left, as today). Bravo's tools shrink to icons with no words, there was no room for 1st person, and both squads' details are always there to read.

## My pick: B
His name goes where your thumb already is, and it's always on screen whatever the camera is looking at. It adds nothing over the battle.

## Questions for Bryan
1. By "their name will appear above the gun", do you mean over the gun on the map (A) or over the gun's tile in the row at the bottom (B)?
2. Should BACK ON THE GUN always send him to his own gun, or to the nearest empty one (for example if his own gun was knocked out)?
3. Are the guns Alpha's only? Today a tap on an empty gun sends the nearest free man of either squad (a medic last), so a Bravo man can end up on one.
4. While Alpha is on the guns, should the FOLLOW / HOLD switch on its tab go, along with the ALPHA · HOLDING label? That label stands at the middle of the squad, which with Alpha spread over the four guns is in front of the command post, over nothing.
