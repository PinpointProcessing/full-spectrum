# The office building (objective 4): Bryan's design and the review

Status: Bryan answered the decisions (below). Step 1 of the build plan is in (the interior map, going in and out, local noise, the use system; the ground floor is a placeholder layout until the floor plans are settled).

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
