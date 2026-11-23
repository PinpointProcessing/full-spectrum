from lib import rep, before

# the numbers, and switching them on and off with the chapter
before('js/ddplay.js', "const DD_SURGE={",
"""// Version 223 (Bryan: "Give me power and accuracy to bazookas"). Until now a rocket could not kill a defender it landed on (120 at the middle, and they
// take .72 of it), and it strayed from 24 m out, 11 m wide of the mark at its full reach. blast, dmg: its blast against men (combat.js's PRPG while a
// chapter runs, ddBaz); true0, stray: dead on out to true0, then this much off for each unit further (combat.js's fireRPG, ddRocketClear below);
// tank, obj: what a rocket does to a tank and to a gun, a barracks or the wire, against what a grenade does (ddTankHit, ddBlast; dd.rkt from mission.js's rpgBlast)
const DD_BAZ={blast:75,dmg:260,true0:450,stray:.08,tank:1.5,obj:1.9};
function ddBaz(on){if(on){if(!ddBaz.o)ddBaz.o={blast:PRPG.blast,dmg:PRPG.dmg};PRPG.blast=DD_BAZ.blast;PRPG.dmg=DD_BAZ.dmg;}else if(ddBaz.o){PRPG.blast=ddBaz.o.blast;PRPG.dmg=ddBaz.o.dmg;ddBaz.o=null;}}
""")
for f, n in (('js/ddplay.js', 1), ('js/ddcounter.js', 1), ('js/ddvillage.js', 2)):
    rep(f, "PRPG.range=900;dd.rpgA=PRPG.aim;PRPG.aim=1.15;", "PRPG.range=900;dd.rpgA=PRPG.aim;PRPG.aim=1.15;ddBaz(1);", n)
rep('js/ddplay.js', "PRPG.range=dd.rpgR;PRPG.aim=dd.rpgA;", "PRPG.range=dd.rpgR;PRPG.aim=dd.rpgA;ddBaz(0);")
rep('js/ddplay.js', "const R=(PRPG.blast||55)+15+Math.max(0,(d-240)*.17);", "const R=(PRPG.blast||55)+15+Math.max(0,(d-DD_BAZ.true0)*DD_BAZ.stray);")
rep('js/ddplay.js', "is it safe for one of ours to fire a rocket at (x,y) from d away? Nobody of ours within its blast and how far it can stray (combat.js's fireRPG: past 24 m)",
    "is it safe for one of ours to fire a rocket at (x,y) from d away? Nobody of ours within its blast and how far it can stray (combat.js's fireRPG: past DD_BAZ.true0)")
# the stray
rep('js/combat.js', "if(MAPID==='dd'&&d>240){const k=(d-240)*.17,a=Math.random()*TAU",
    "if(MAPID==='dd'&&d>DD_BAZ.true0){const k=(d-DD_BAZ.true0)*DD_BAZ.stray,a=Math.random()*TAU")
rep('js/combat.js', "(D-Day: the Bazooka reaches a long way, but past 24 m it strays, more the further it goes: Bryan)",
    "(D-Day: the Bazooka reaches a long way, but past 24 m it strays, more the further it goes: Bryan; since Version 223 past 45 m and half as much, ddplay.js's DD_BAZ)")
# a rocket against a tank, a gun, a barracks
rep('js/mission.js', "booms.push({x,y,t:0});paintDecal({k:'scorch',x,y,r:Math.random()});tankBlast(x,y,by);",
    "booms.push({x,y,t:0});paintDecal({k:'scorch',x,y,r:Math.random()});if(MAPID==='dd'&&dd)dd.rkt=by&&by.side==='P'?1:0;tankBlast(x,y,by);if(MAPID==='dd'&&dd)dd.rkt=0;   // (D-Day: one of our rockets does more to a tank or a gun than a grenade does, ddplay.js's DD_BAZ)")
rep('js/ddplay.js', "  ddTankHit(x,y);if(typeof vgBlast==='function')vgBlast(x,y);", "  const rk=dd.rkt?1:0;ddTankHit(x,y,1,rk?DD_BAZ.tank:1);if(typeof vgBlast==='function')vgBlast(x,y);")
rep('js/ddplay.js', "    o.hp-=110*(1-d/52);\n", "    o.hp-=110*(rk?DD_BAZ.obj:1)*(1-d/52);\n")
rep('js/ddplay.js', "function ddTankHit(x,y,k=1){", "function ddTankHit(x,y,k=1,pw=1){")
rep('js/ddplay.js', "    K.hp-=170*k*(1-d/(75*k));", "    K.hp-=170*k*pw*(1-d/(75*k));")
