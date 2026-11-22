# Zombie apocalypse (working title: Day One)

Status: first level drafted 2026-11-22 as `day-one.html`. Built on the Full Spectrum engine (same camera, map/collision, A* pathfinding, overlay HUD and touch controls as `warehouse-yard.html`).

## Pitch
An end-of-the-world survival game. You start alone in a suburban house and work up to a group of survivors, a base, and scavenging runs.

## Decisions so far
- **Opening feel:** like the start of a classic zombie film. A quiet suburban morning goes wrong fast, and the TV news falls apart while you listen. The level is our own: none of the film's scenes or characters.
- **Zombies:** both kinds. Shamblers are slow and tough. Runners are fast and fragile, with red eyes so you can tell them apart.
- **Tone:** serious with over-the-top moments. The news, the blood and the permadeath are played straight. Gary from next door coming through the glass, Dale in a bathrobe with a 7-iron, the car alarm and "Fore!" are the over-the-top bits.
- **Death:** dead stays dead. Nobody revives.
- **Structure:** a survival game with a story, plus sandbox (still open how the two mix).

## Level 1: Maple Court (what's built)
1. **5:42 AM.** Riley wakes up in bed with the TV on. The news runs: state of emergency, hospitals full, "don't approach them", then a field reporter gets cut off live, PLEASE STAND BY, and an emergency alert.
2. **Arm up.** Pistol on the nightstand (12 rounds, loud). Bat in the garage (quiet). Car keys on the kitchen island. First aid in the bathroom.
3. **Gary.** Once you grab a weapon (or after about 30 s anyway), the neighbor smashes through the back glass slider and goes straight for you.
4. **The street.** A cul-de-sac at dawn. The house across the way is on fire, a police cruiser is crashed up the road, and zombies are wandering. More arrive over time from the edges.
5. **Dale (optional).** A neighbor is stuck on his minivan roof, yelling, with zombies clawing at it. Clear them and he climbs down and joins you. This is the first taste of team building.
6. **Scavenging.** Pistol rounds in a crashed car's trunk. A shotgun and a first aid kit by the police cruiser.
7. **Exit.** Everyone alive has to reach Route 9 at the north end.

### Rules in the draft (first guesses, not tuned)
- **Noise is the core rule.** Pistol 330 range, shotgun 430, car alarm 460 (pulses for 16 s, 3 uses), breaking glass 260, Dale's yelling 120, melee 45. Zombies that hear something go to check it out.
- **Guns are held by default.** Survivors fight hand-to-hand on their own. They only shoot if you set Guns: free, or if you tap a zombie.
- **Zombie sight:** shamblers 160, runners 220, needs line of sight (windows don't block it).
- **Speed:** Riley 50, Dale 44, shambler 17, runner 58. Runners are faster than you.
- **Health:** shambler 70 hp, runner 45 hp. Shamblers hit for 9–13 every 1.3 s, runners for 6–9 every 0.95 s.
- **Melee:** fists 6–9, bat 24–32, 7-iron 19–26. Every hit knocks the zombie back and stuns it for a moment.
- **Guns:** pistol 30–42 damage, range 260. Shotgun 48–66 in a cone, range 130.
- **Spawns:** after you leave the house, a new zombie every 9 s, dropping to 7 s and then 5 s, capped at 20 alive. Spawns happen out of sight. New zombies head toward the last loud noise.
- **Slow-mo:** time runs at 0.3× after you tap a survivor and drops back to normal once you give an order. Pause works as in Warehouse Yard.

## Next ideas
- Barricading doors and windows: first steps toward base building.
- Infection and bites as a separate threat from damage.
- Lighting at dawn and dusk tied to how far zombies can see.
- After Maple Court: find a shelter before dark. That's where the base, recruiting and scavenging runs start.
- Open questions: how story and sandbox mix, and whether runs are a fixed campaign or randomized.
