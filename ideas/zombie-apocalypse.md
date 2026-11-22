# Zombie apocalypse (working title: First Light)

Status: first level rebuilt 2026-11-22 as `first-light.html` (source in `first-light/src`). An earlier top-down draft ("Day One") was scrapped.

## Pitch
An end-of-the-world zombie game. You start alone at home in the suburbs, waking up to the news on TV. It starts as survival through the first attack, then grows into team building, base building and scavenging.

## Bryan's decisions
- **Opening feel:** a classic zombie film's opening: a normal suburban morning that falls apart fast.
- **The TV:** on and making noise. An EMERGENCY BROADCAST bubble opens the broadcast: two anchors warn of a highly contagious virus that makes people go mad, then zombies attack and kill them on air.
- **Camera:** third person or fixed, not bird's-eye.
- **Zombies:** both runners and shamblers.
- **Tone:** serious mixed with over-the-top.
- **The leader:** the first character is "You". Best stats of anyone, a true leader, and the only one who has to stay alive: if You die it's game over. You name them in the post-battle sequence after the first level.
- **Other survivors:** can die. Whoever is left at the end shelters with you.
- **Setting:** an active, chaotic suburbia. The escape route is a large drainage pipe where a secure shelter gets set up.
- **Structure:** a survival game, with story and sandbox elements. How they mix is still open.

## Level 1: Sycamore Court (what's built)
1. **Bedroom, 6:07 AM.** You're asleep. The morning show is on. An EMERGENCY BROADCAST bubble appears over the TV.
2. **The broadcast.** Hal Brenner and Denise Carroway read the warning. Something bangs on the studio door, the infected come in from both sides, blood hits the lens, the camera falls over, static, then a standby card. You can stop watching at any time; it keeps playing in the room.
3. **Break-in.** A runner comes through the front window. Bat by the bedroom window, pistol on the nightstand, first aid in the bathroom. Another is waiting on the porch when the door opens.
4. **The street.** Fires, wrecks, bodies, fleeing neighbors, a helicopter with a searchlight, a pizza car that plows through zombies and crashes (its alarm pulls zombies away), burning zombies out of the burning house, an ambush from between the houses, a school bus that isn't empty, a downed power line.
5. **The pile-up.** A box truck and a burning wreck block the road. Go round through a broken fence (west) or a gate (east), or stay near the wreck until it explodes and clears the road.
6. **Four people to rescue (all optional):** Walt on his van roof (7-iron), Jules on a shed roof (skateboard), Marisol trapped in her car (nurse with a butcher knife: heals the group when it's quiet), Officer Dunn behind his cruiser (pistol). Clear the zombies around them and they join.
7. **Big Earl.** A huge zombie eating in the turnaround at the end of the street.
8. **The storm drain.** Turn the rusted wheel to raise the grate (about 9 seconds standing at it) while a wave comes down the bank. Then get inside.
9. **Shelter.** The grate is shut behind you. Zombies claw at the bars. You name your leader and see who made it, with a role for each (keeps watch, scout, medic, guard) as a hook for base building.

### Rules in the build (first guesses, lightly tuned by a test bot, not by a person)
- **You:** 160 hp, speed 61. Bat 24–32 per hit, three-swing combo (the third is an overhead smash: more damage, big knockback, then a short pause). 14% crits take heads off. Dash: 0.2 s, can't be hit, 0.8 s cooldown.
- **Walls, windows, the door.** Nothing passes through a wall. Windows: 30 hp, a swing from You breaks one, a shambler takes about 3 s; climbing through takes 0.75 s for people, 0.8 s for runners, 1.5 s for shamblers. Front door: 130 hp, about 16 s of pounding by one shambler; You can still just open it by walking up to it after the break-in.
- **Household weapons (Bryan: not everyone gets a bat).** Walking over one takes it and leaves the one you were carrying in its place, so you can swap back. Butcher knife 15–20, fast, short reach (your living room). Frying pan 16–21, biggest knockback (your house). Clothes iron 26–34, slow, short reach (a house up the street). Hammer 20–26 (a house up the street). Tire iron 14–18 (by the cars). Each survivor keeps their own: Walt the 7-iron, Jules the skateboard, Marisol the butcher knife, Dunn his pistol and a baton.
- **Guns:** pistol 38–52, auto-aims at the nearest zombie in front. Shotgun 60–85 in a cone. Both make noise that pulls in anything not already chasing someone.
- **Shamblers:** 58–76 hp, speed 18–24. Wind up 0.42 s, then lunge. A hit also slows you.
- **Runners:** 36–44 hp, speed 72–80 (faster than you). They don't stop to wind up. Red eyes.
- **Big Earl:** 330 hp, hits for 22–28, barely flinches.
- **Followers:** take 40% damage, can't be hit more than once per 0.7 s, recover health when it's quiet, back off below 35% health, and hit 35% harder near you.
- **Pressure:** one or two zombies arrive behind you every 5–8 s once you're outside.

## Not built yet
- Base building in the drain, scavenging runs, more levels.
- Orders for followers (they only follow and fight).
- A save: the name is remembered on the device, nothing else.
