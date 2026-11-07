# Level 4: The Old Radio Tower

Bryan, after v98: "Show me a draft". The first try (`docs/map-draft-H.png`) put the tower in a valley past the tunnel's far
end. Bryan: "No, so the east road is over a bridge to the tunnel. In the tunnel there's an interior that leads to a tunnel
which will reach the radio tower on top of the hill the tunnel is under." That became `docs/map-draft-I.png`, and with his
answers to its five questions, `docs/map-draft-J.png` (a side view of the hill, plans of the plant and the summit).

## Bryan's answers (after draft I)

1. The road tunnel's north end: "yes caved in (for now)".
2. The summit: "enemy soldiers are in the radio tower/summit".
3. The way home: "a zip line leads to the bridge and they can make a quick route back."
4. The way up: "let the player choose. Going up the lift alerts more enemy monsters and the guards hear them coming. Enemy
   monsters will come up and attack not only the player but the enemy troops too. Taking the stairs is quiet and the enemy
   troops are unaware. The player can split the teams and keep one group undetected."
5. The name: "The Old Radio Tower is a good name".

## The story

The HQ's radio needs parts. The scientist said the decommissioned radio tower "accessible from the tunnel down the road"
would have them: it stands on top of the hill the road tunnel runs under, and the way up is from inside the tunnel.

## The way through, bottom to top

1. **The road tunnel** (built in v96 to v98): over the bridge and in, pitch black, the dead. Its north end has caved in, so
   the way on is the service door in its wall.
2. **The plant**: the tunnel's control rooms in the rock (its own map with floors, like the office building). The corridor
   from the service door; the staff room and the store (two bonus crates); the control room (the summit's cameras: look
   and their men are marked when you get up there); the generator room (power for the lift); the fan hall, where the
   brood has nested (eggs, hatchlings); the lower station with the lift and the foot of the stairs.
3. **Up to the summit**, the player's choice, and the teams can split:
   - **The stairs**: a long access tunnel climbing through the rock. Quiet: the guards up top stay unaware. The Crawler,
     the centipede the squad saw go in, lives in it. They come out of a hut on the summit's west edge.
   - **The lift**: needs the generator. Loud: it wakes more of the brood, and the guards hear it coming and wait at the
     bunker it comes up into, by the mast. The monsters come up the shaft after it and attack everyone, the guards too.
   - Split: one team up the lift to draw the guards and the monsters to the bunker, the other up the stairs and out of the
     hut unseen.
4. **The summit**, The Old Radio Tower: enemy soldiers, a sniper on the mast, a machine gun over their track up the north
   side, men round the radio building (two rooms: a Breach) and their containers. Take the transmitter, the amplifier and
   the cable drum; the radio log is intel.
5. **Home**: the zip line from a pylon on the summit's south edge, down to the bridge on the road east. Mission complete.

## What comes back

- 3 supplies: enough for radio control at the HQ, then the radio tower on its roof (the next steps in `docs/hq-base.md`).
  The 2 bonus crates are 1 more each.
- 1 intel: the radio log says where the next mission is.

## Numbers (first guesses)

- The summit: about 8 men in helmets and vests (20% less damage, as at Alert II; Bryan: "As the game progresses enemies get
  stronger too"), one sniper, one machine gun. No guards inside the hill: it belongs to the monsters.
- The brood in the fan hall: hatchlings like the HQ's newborns, and her young. The Crawler: one of her young grown big.
- About 15 to 20 minutes.

## Built (v99)

Level 4 is in the game (`js/level4.js`). How to get there: the intro card's **Level 4 · The Old Radio Tower** button starts
at the road east in sight of the tunnel (the 'road' checkpoint), or play on from Level 3's end. Walk everyone into the
tunnel, up to its caved-in north end, and into the service door under the red light in the east wall: the hill fades in by
itself.

- **The plant**: dark until the generator's started (red emergency lights, the squad's torches). The control room's
  cameras mark every man on the summit for two and a half minutes. A crate of supplies in the staff room and one in the
  store. The fan hall: the brood asleep among her eggs (two young, three for a squad of more than five); walk in, or
  shoot or throw near it, and they wake, a newborn or two hatching. The lower station: the lift and the foot of the
  stairs. The service door is the way back out (a tap; the hill starts fresh next time).
- **The stairs**: a long climb through the rock, red lamps, the Crawler in its chamber halfway (it wakes when you're
  about 23 m off). Nothing done in the rock is heard on the summit. Out of a hut on the summit's west edge.
- **The lift**: needs the generator. The moment it starts up, the team riding it counts as heard (caught), every man on
  the summit is alerted and the riflemen leave their posts to wait round the bunker's door, the sniper and the machine
  gun turn to it, and the brood wakes and goes up the shaft after it. Five seconds after the car's up they come out of
  the shaft's vent by the bunker, more from below with them, one after another, and go for whoever's nearest: their men
  too, and their men shoot back. A team that went up the stairs stays hidden while the guards are hurrying to the bunker.
- **The summit**: 9 men (11 for a squad of more than five) in helmets and vests: a sniper up the mast facing their track,
  a machine gun over the track, the radio man and another in the radio building (two rooms: a Breach), two by the
  containers, a patrol round the mast, one at the bunker's door, one out by the zip line. All of them down: a checkpoint
  (a medic station and an ammo drop by the mast, saved).
- **The parts**: the transmitter (radio building), the amplifier (by their containers), the cable drum (the mast's
  foot). A man carrying one moves at sneaking speed and can't shoot; Put down is on the run/sneak button; it drops
  where he falls and anyone can take it up. The radio log on the office desk is intel (walk over it).
- **Home**: the zip line's gather area on the south edge, ready once everyone who's up is in it with the three parts
  (anyone down carried). Tap it: they go one after another out over the edge, then down the last of the cable onto the
  bridge on the road east. Mission complete and the report. The cable can be seen from the bridge from the start.
- Saves: inside the hill, the summit taken, back at the bridge with the parts. The supplies and the radio log are kept
  for what's next at the HQ (radio control). The HQ roof's radio tower base says the parts are back.

Not done yet: voiced lines for this level (callouts are text), the Crawler doesn't crawl on the ceiling in the fight (it
does in the road's cutscene), and the plant's lift is always at both ends (no calling it down).
