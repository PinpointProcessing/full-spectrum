# The office building (objective 4): Bryan's design and the review

Status: all six steps are built, to Bryan's later version (next section). Code: `interior.js` (the map) and `office.js` (what happens in it).

## Bryan's later version (what's built)

His words: "the bridge needs bio scanning to lower it. The bio scanner only works with the scientists. So the player enters the data center and goes to the top floor to detain the scientists. The bottom floor has the prisoners, four of them, all alive, one tortured on the wall that needs to be carried or medkitted. The prisoners do not have weapons but pick it up when they see a dead body. They are also dressed in grey prison clothes, not armored like the players. Two join alpha and two join bravo. The scientists are freaking out begging not to open the door and saying we are all going to die, but stay cryptic. When the drawbridge goes down the monsters begin."

As built:
- Ground floor as designed: the shared room's three guards; the access card drops where the door guard fell once all three are down (walk over it). The computer (2 s) opens the steel door: it sinks into the floor over 2.4 s and the three men on the landing come out, unready if the shared room went down quietly. Voices behind the steel door ("Help! Down here!") reveal the basement.
- The card works the stairs' reader and the lift. Stairs (UP / DOWN) and the lift take everyone selected, each on his own, so the teams can split. Up top, the lift's doors stay shut until someone inside taps OPEN: men against the walls beside the doors are out of the gun's line; the stairs come out behind it.
- Basement: Brennan (cell C1), Abara (C2) and Lindqvist (C3) behind bars, OPEN CELL with the card; Sgt Marsh strapped to the wall, CUT DOWN (3 s), then a medic kit or carrying him to a medical box (no clock on him). Freed men join: Abara and Brennan Alpha (A3, A4), Lindqvist and Marsh Bravo (B3, B4). Grey prison clothes, no armour (they take 30 % more damage), no special item, and no rifle until they see a body with one: they go and take it by themselves unless just given an order. They can pick up a grenade at a supply box.
- Top floor: the turret room (manned gun facing the lift, two guards; two more at the stair door), the science lobby (five guards, four scientists). Scientists cower where they are once they see the squad or there's a fight; they beg and mutter, cryptic ("It isn't a bridge. It's a lid."). ZIP-TIE (2 s) detains one: he follows the soldier who tied him, floors and all. Nobody shoots or blasts the scientists or the men still locked up.
- Leaving: everyone who's up at the front doors with at least one detained scientist on the ground floor (Marsh may be carried out). Saves as "Scientists detained".
- Outside: the drawbridge panel is a bio scanner. Send a soldier with a detained scientist nearby: the scientist puts his hand on it (3 s, begging), the drawbridge comes down, mission complete. Without one: it says the scanner needs a scientist.
- Defaults I took (for Bryan to change): the prisoners are a bonus (not required, revealed by the voices); one scientist is enough for the scanner; nobody can kill a scientist, so there's no way to lose them.
- Not built from the first design: destroying the lab equipment, the farewell (the freed men now come along), the bonus list in the report (it gives counts), voice lines for the new characters. The monsters start after the drawbridge (next build).

## Bryan's design (his words, lightly tidied)

1. The whole squad enters (unless downed).
2. A main lobby with two hallways at the opposite side; a staircase on the right, an elevator lobby on the left; the front desk between the two hallway entrances.
3. Each hallway has rooms on either side: some with troops, some with just office equipment.
4. Both hallways end in a large shared room with a steel door and three guards. Killing them reveals an access card, which opens the steel door from a computer at the edge of the room. Opening it springs an ambush by three troops.
5. Behind the door, stairs down to a basement with four prison cells. In the middle a man strapped to the wall, dead; beside him another, injured and mumbling. Two men in the cells ask to be freed. The keycard opens the cages. The two become new units: one joins Alpha, one Bravo. They're unequipped (underwear) and pick up weapons from downed enemies on the way back to the lobby by themselves, visibly.
6. The injured man can be cut down; he needs extraction and one soldier can carry him.
7. Back in the lobby the squad goes up by the stairs or the elevator.
   - Elevator: when it opens, a turret nest and two guards face it; the only cover is inside the car against the walls by the doors.
   - Stairs: lead to a door guarded by two soldiers at the top; the door comes out behind the turret nest, which can be ambushed.
8. From the turret room one hallway leads to another large lobby with scientists and guards. Kill the guards, destroy the equipment, take the decryption keycard (it unlocks the drawbridge). The scientists can be detained with zip ties and left there; detained scientists become the people inside the new HQ once it's taken.
9. At the main entrance on the way out, the two freed men say they're staying to treat their partner and guard the scientists, and will meet up later. The original four leave.
10. Main objective: get the decryption key. Three secondary objectives the player isn't told about: save the injured prisoner, save the two prisoners, detain the scientists.

## Review (six angles: pacing, stealth vs loud, phone controls, story and rewards, indoor combat, code)

### Needed for the design to work
- **Noise stays local, and contact can end.** Today one shot alerts every enemy on the map and contact lasts until the objective is done, which would wake the turret crew from the first hallway fight (no stairs ambush), switch off takedowns indoors and make every later room a plain firefight. Alerts should reach only the room or floor that hears them, and contact should end once that area's alerted enemies are down.
- **Low cutaway walls** (waist height, dark top edge, Dark Descent/XCOM style) so soldiers in rooms and hallways stay visible from the angled camera; they still block sight and movement.
- **One way to use things.** Every interactive thing gets a word label like TAKEDOWN (USE the computer, OPEN the cells, CUT DOWN, CARRY, PUT DOWN, ZIP-TIE, DESTROY, OPEN the elevator); tap it, the nearest selected soldier walks over, a ring fills, it happens. Keycards are picked up by walking over them and belong to the whole squad (an icon on the objective box), so a downed carrier can't lose them. The next main step is ringed, with an edge arrow when off screen.
- **Floors as one map laid side by side**, one floor on screen at a time; the whole squad changes floor together through a gather area ("UP 4/6", then GO) and a short fade.
- **Checkpoints and a rest stop inside**: medical and supply boxes in the lobby once it's clear, and saves going in, back in the lobby after the basement, and leaving with the key.
- **Six soldiers on a phone**: cards in two rows of three (or a compact strip for All), and a faster spot-picking search for six men.

### Additions (most valuable first)
1. **Steel door you can react to**: a 2 s card swipe, the door grinds open over 2–3 s under a red rotating light with shouts behind it, the ambushers push out from cover. If the shared room's guards went down quietly, the ambushers are caught unready.
2. **Elevator you can fight out of**: the doors open only when you tap OPEN after the ride, so you can put men against the walls first (marked spots, like the medical boxes); the turret spins up with a visible sweep line before its first burst; men at the door jambs can lean out to shoot or throw.
3. **Turret as a manned machine gun** facing the elevator, sandbags only on that side, so from the stair door it can be taken down from behind.
4. **Stairs as an informed choice**: a freed prisoner (or the wounded man's mumbling) warns that the gun watches the lift and the stairs come out behind it. Place the stair guards so a quiet approach is possible.
5. **Scientists as civilians**: white coats, a CIVILIAN label, never auto-targeted, hands up and cowering when shooting starts, ZIP-TIE when a soldier is selected; grenade and C4 aims warn when a civilian is in the blast.
6. **Hidden bonuses revealed when found**: off the list until met, then a radio line ("Friendlies in the cells!") and a "Bonus" line under the main objective; the after-action report shows "Bonus 2/3" with XP, missed ones as ???.
7. **Hallway rooms you can read**: occupied rooms give themselves away (light and radio chatter through the doorway), empty ones are dark and quiet; some troops have their backs to the door (takedowns); rooms you skip can come out behind you when the alarm goes.
8. **Carrying with clear rules**: the carrier moves at sneak speed, can't shoot or vault, PUT DOWN takes the gait button's place; if he goes down the man is laid beside him to be picked up again. Set down in the lobby rest stop, the man counts as saved.
9. **Story touches**: the burnt-out car outside is the prisoners' truck ("That's one of ours. No bodies."); the dead man's tags are picked up; the farewell matches what happened (who's alive, scientists or not); placeholder names (Wren team: Abara and Lindqvist in the cells, Brennan wounded, Sgt Marsh dead).
10. **Optional, later**: breachable doors (stack up, OPEN / BREACH / FLASH) with flashbangs as a card item; a close burst killing a man who hasn't reacted; the alarm as a radio call you can cut short; guards noticing takedowns and bodies; paired takedowns.

### Gaps, with the defaults I'd use unless Bryan says otherwise
- A soldier downed outside when the squad goes in is stabilised and rejoins at the exit.
- The outside of the data center has to be taken first (the usual quiet spell); its container wall and guards stay; the current roofless building, its five inside guards and the server core go; the decryption key replaces the panel's "turn on the power".
- The injured man doesn't bleed out on a clock, but blasts and gunfire can kill him (the bonus fails).
- Unarmed prisoners follow their team and hang back from fights; they can be downed and revived.
- Farewell versions for what happened; none if the prisoners were never freed.
- Game-scale rooms (about 3 m doors, 4 m corridors), as the current movement and cover grid needs.

### Decisions (Bryan's answers)
1. Turret: a manned machine gun (the gunner can be taken from behind).
2. The basement is optional, but pull players in (cries behind the steel door; the access card also unlocks the way up).
3. The teams can split between floors if they want (every floor runs at once; the floor chip switches the view).
4. Doorways first (open gaps; real doors with breaching and flashbangs maybe later).
5. Yes: the freed men stay for good (XP and ranks kept, rejoining at the HQ).
6. Scientists cower where they are when the shooting starts.

Defaults taken where Bryan didn't say otherwise: those under "Gaps" above.

### Build plan (each step playable)
1. Going in: the interior map (floors side by side, one on screen), entering and leaving through the front doors, cutaway walls, indoor lights from the shared pool (no rain inside), local alerts, the use-labels, the lobby and hallway rooms. Large.
2. The shared room: three guards, the access card, the computer, the steel door ambush. Medium.
3. The basement: cells, the dead and the wounded man, the prisoners joining (unarmed, picking up rifles), six-man cards, carrying, hidden bonuses. Large.
4. Upstairs: the floor change, the elevator (doors on tap, wall spots, turret) and the stairs (guards, the door behind the turret). Medium–large.
5. The science lobby: guards, scientists and zip ties, the equipment, the decryption key; the drawbridge panel takes the key. Medium.
6. The exit: the farewell, the men who stay, the report with bonuses and XP, saves, voice lines. Medium.

Roughly two weeks of work in all; steps 1–3 plus a simple exit make a first slice of about a week.
