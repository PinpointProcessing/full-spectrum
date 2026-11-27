/* ddcounter.js: Chapter 2, the counterattack on the base the player took (Version 159). Bryan, after Version 157: "Next up is a counter
   attack on the base the player just took"; his answers: from inland, a large force seen marching toward the base ahead of time, tanks and
   troops; the base has MGs the player can put troops on by selecting them; leaving the barracks triggers it, about 20 seconds to set up;
   artillery and MG nests in the field in front of the base; three waves, hold until all of them are dead; the other troops fight too;
   the forward nests as drawn (strong, exposed); reserve men come out of the barracks as replacements; a loss is a retry; a field gun fires
   where it's told, or by itself if ignored. Draft: docs/drafts/counterattack-draft.png.

   The same engine and scene builder as the beach with DD_MODE 'counter' (dday.js asks dcHeights, dcObjects, dcPaint, dcScenery, dcBuild):
   the base at the south facing inland (north), a field, a hedgerow, a farm and an orchard, the tree line, one road. `dd.counter` is true
   and ddTick hands over to dcTick. `dd.dc` is the fight: ph 'intro' (the camera up the road to the column) -> 'setup' (DCA.setup s) ->
   'w1' -> 'lull' -> 'w2' -> 'lull' -> 'w3' -> won. DCA.guns are the mounted guns (three forward nests, two on the wall, two field guns): a
   tap on one with a squad picked sends its nearest free man (dcTap, dcMan), the other troops take what's left (dcNpc).
   (Version 254: seven waves, 'push' after the second, dcWaveDone; see the notes at DCA and at their checkpoint below) */
// Version 231 (Bryan's plan, docs/drafts/v231-base-defence-plan-2.jpg): Chapter 2 is fought from the D-Day base, looking down the road their
// reinforcements come along, the beach down a cliff on the right. Drawn here turned a quarter: the story's east is this map's north, so the camera,
// the waves and the guns keep working as they did. South to north: the square, the two barracks on its left, the command post in the gap of the
// north bank with the road through it; the guns outside (two nests on the left, the field gun and the heavy MG on the right by the cliff); the
// field; the fork (left into the woods, right down the cliffs to the beach); their checkpoint between the branches.
const DCA={x0:200,x1:1010,wallY:556,gate:[624,776],road:700,setup:10,fixT:8,fixN:3,lull:10,gunHit:42,flagT:14,dug:.6,   // (dug: a man on a gun takes this share of what hits him)
  // Version 254 (Bryan, after Version 253: "this game should mostly take place on the stationary weapons"; "Can the light machine guns have a
  // higher rate of fire, 2x faster. The heavy machine gun can stay slow but has more damage"; "A stationary weapon should be destroyed first and
  // just hurt the soldier. It doesn't kill the soldier. Have the machine be destroyed first and the soldier has no less than 50% health").
  // gw: a gun's own fire when its man shoots by himself (combat.js's burst, resolveShot and updateUnit read u.gunW while he's on it): the nests'
  // light guns twice the rounds a second (10 a burst, 0.035 s apart, where a gunner fired 5 at 0.07), the heavy gun as slow as before with more
  // than twice the damage a round. shield (dcShield, from combat.js's damage): what hits a man on a gun hits the gun (gun x); he takes man x of it
  // the usual way, never below floor, never killed outright (ddplay.js's ddDamage); the gun blown up throws him off it, off more, not below floor
  gw:{lt:{n:10,gap:.035,cool:[1.3,1.8],dmg:[11,16],sup:.09},hv:{n:5,gap:.12,cool:[1.4,1.9],dmg:[26,36],sup:.16}},
  shield:{gun:.6,man:.3,floor:50,off:30,stun:1.1},
  // Version 254 (Bryan: "After the first wave show Wave 1 complete. And give a timer on the rest time until the next wave"; "At the end of Wave 2,
  // have NPC soldiers run to the second checkpoint, with the lead NPC saying Move Forward!! Take the checkpoint ahead!! After that, show an
  // objective highlight over the checkpoint base to capture"; "Let's test with 7 waves - increasingly harder. Heavy units can start appearing at
  // Wave 5, starting with less reinforcements troops"): the push after wave 2 (pushMax: the next wave comes anyway; capT: ours in the zone and none
  // of theirs that long takes it; loseT: theirs in it and none of ours that long loses it again), the other troops kept at npcN between waves,
  // cpFrom: the share of a wave that comes out of their checkpoint while it's theirs
  pushMax:100,capT:5,loseT:10,npcN:10,cpFrom:.25,cpAtt:.4,
  cz:{x0:560,y0:-372,x1:852,y1:-96},   // (the checkpoint to take: the blockhouse and its bags, and their two light guns left of the fork)
  cliffX:1010,beachH:-78,
  cp:{x:624,y:562,w:152,h:80,arch:[686,714]},cpZone:{x0:620,y0:462,x1:780,y1:558},flag:{x:756,y:548},   // (the ground in front of the command post: theirs for flagT s with none of ours in it and the base is lost)
  barracks:[{x:396,y:600,w:46,h:118},{x:396,y:742,w:46,h:118}],door:{x:700,y:550},cpIn:{x:700,y:650},   // (the right-hand barracks is the first, by the command post; door: where the squad comes out of the command post)
  armory:{x:900,y:626,w:84,h:56},depot:{x:876,y:790,w:108,h:60},
  square:{x:700,y:756},
  hedgeY:-70,treeY:-430,forkY:-150,checkHp:650,slit:{range:520,every:[1.3,2.3],rounds:4,hit:.42,dmg:[7,12]},   // (the blockhouse's machine guns: Version 233)
  check:{x:694,y:-316,w:84,h:54,zone:{x0:600,y0:-360,x1:850,y1:-200}},eguns:[{x:612,y:-116},{x:578,y:-162}],   // (eguns: their light machine guns left of the fork, pointed at the beach until they're turned on us)   // (their checkpoint: the woods road runs through its left side)
  guns:[{k:'n1',n:'MG NEST',x:540,y:486,t:'mg',arc:1.15,hp:260},{k:'n2',n:'MG NEST',x:604,y:438,t:'mg',arc:1.15,hp:260},
    {k:'h1',n:'HEAVY MG',x:900,y:410,t:'mg',hv:1,arc:1.5,hp:340,face:0},{k:'a1',n:'FIELD GUN',x:858,y:490,t:'art',hp:420,face:0}],   // (face 0: it stands pointing at the beach until it's turned)
  hold:[[660,478],[700,500],[740,478]],   // (where the men not on a gun stand: in front of the command post)
  lee:[[560,584],[840,584],[480,584],[920,584]],   // (Version 254: behind the bank, where a man thrown off his gun goes to get his breath back)
  // (Version 254, Bryan: "Make more defensive points in the fields between the base and checkpoint 2"; "Have the NPCs pushing forward to distract
  // the enemy") def: the horseshoes of bags across the field, two men in each (the first two were the only ones); lines: where the other troops
  // stand, back to front: the near posts, the middle of the field, the line short of the hedgerow (its gaps in sight), and, once it's ours, their
  // checkpoint (bags north of the blockhouse's corners, its corners). Line 0 is each man's own spot on the wall (u.back)
  def:[[450,250],[940,236],[330,150],[520,140],[860,150],[470,10],[600,20],[790,20],[930,10]],
  lines:[[[440,248],[460,248],[930,234],[950,234],[578,360],[602,360],[818,360],[842,360]],
    [[320,148],[340,148],[510,138],[530,138],[850,148],[870,148]],
    [[460,8],[480,8],[590,18],[610,18],[780,18],[800,18],[920,8],[940,8]],
    [[614,-342],[638,-342],[794,-342],[818,-342],[712,-325],[760,-325]]],
  posts:[[440,248],[460,248],[930,234],[950,234],[578,360],[602,360],[818,360],[842,360],[320,148],[870,148]],   // (where the ten run to as it starts: the near line, two in the middle)
  // the push on their checkpoint: from the line short of the hedgerow, into it (round their light guns, beside the blockhouse); their men in it
  // (garr: two at their light guns, five round the blockhouse, all posted)
  storm:[[598,-128],[640,-150],[662,-236],[800,-226],[842,-238],[612,-186],[700,-208],[760,-206]],
  garr:[[662,-252],[801,-246],[700,-224],[760,-224],[640,-292]],
  hv:{tank:14,every:1.1,range:560,shell:100,mortar:70,hold:.8},   // (hold: how long one burst of the heavy gun puts a tank's next shot back; ddplay.js's ddTankHold caps the total. Version 254: tank 9 to 14, "more damage"; man .5 is gone: what hits a gun's man goes to the gun, dcShield. Version 255: shell, a tank's shell on a gun, 130 to 100: with a tank in every wave a nest went in two of them, three again as in Version 160)
  art:{min:170,max:960,reload:7.5,auto:6,R:84,D:150,fast:1500},   // (fast: how fast a shell fired from behind the gun flies, units a second: flat, where the crosshair is)
  // (Version 255) a helicopter: hp, alt its height over the field (about 5 m: Chapter 2's camera is low, and anything much higher is off the top of
  // the screen; altIn over the trees), spd and turn (rad/s), c and r the circle it flies over
  // the field, orbitT the seconds between runs, fire from how near and how far it lets its rockets go, rk two a run (their speed, spread round the
  // gun, blast R and D, and what one does to a gun it lands by), dmg what our fire does to it (a rifle, a nest's light gun, the heavy gun), its
  // door gunner's reach and aim, first and next the seconds into its wave it comes in and the next one after it, the crash's blast
  heli:{hp:1100,alt:48,altIn:150,spd:82,turn:.8,c:{x:700,y:110},r:240,orbitT:[8,12],fire:[200,440],rk:{n:2,gap:.32,spd:380,spread:34,R:62,D:75,gun:55},
    dmg:{rifle:.3,lt:.8,hv:1.6},longR:400,aimPen:.22,first:12,next:22,crashR:70,crashD:90,runs:6,stay:120},
  // (runs, stay: it turns for home after that many rocket runs or that many seconds over the field, shot down or not: in a test fight two of them
  // circled for the rest of it over a base with every gun knocked out and its last man out of their sight, and it could neither be won nor lost)
  // (Version 255, Bryan: "NPC can have rocket launchers (if that's there class)"; "Enemy units are equipped with smoke") bz: two of the other troops
  // are bazooka men (n rockets, made up between waves), firing at a tank by themselves (ddvillage.js's vgBazooka); smk: one in `every` of their men
  // carries a smoke grenade, thrown toward our nearest manned gun (gap: seconds between two across the field). bz.r: their reach, 60 m (the
  // village's are 48 m: the field gun had the tanks before they came that close)
  bz:{men:2,n:3,at:[4,6],r:600},smk:{every:4,gap:[5,9]},
  // (Version 255) how near a tank makes one of the other troops drop back a line, and keeps him from moving up to a spot: with a tank in every
  // wave now, Version 254's 25 and 30 m kept them all at the wall the whole time one was in the field
  npcTank:[180,200],
  tankR:700,tankHp:230,tankRoll:30,   // (Version 247: how far their tanks shoot here, in the open field; 520 elsewhere. At 520 the field gun and the heavy gun had them before they came into their own reach. Version 255: tankHp, a tank's health here, 230 against 330 elsewhere: with one to three in every wave they lived long enough to knock out the guns faster than they were put right)
  // (Version 254: seven waves, each harder than the last. inf: men as it starts, more: a second lot moreAt s in, tanks: the ways they come down
  // (DCA.ways), started from tankAt one every 7 s, mortar: shells on our manned nests. Version 255, Bryan: "The waves should be more hectic. Add
  // one tank to wave 1 and 2, two tanks on 3 and 4, two tanks and a helicopter on 5, three tanks on 6, three tanks and two helicopters on 7":
  // helis, dcHeliSpawn. Waves 6 and 7 with a few fewer men than in Version 254, 20 and 24 for 24 and 30: with three tanks and the helicopters the
  // bots' fights were lost there, as Bryan had it in Version 254, "starting with less reinforcements troops" where the heavy units come.
  // Version 254 had tanks from wave 5 only, until Version 253 three waves with a tank in each)
  waves:[{inf:16,more:8,moreAt:20,tanks:['road']},{inf:18,more:8,moreAt:18,tanks:['east']},{inf:20,more:10,moreAt:18,tanks:['road','west'],mortar:true},
    {inf:24,more:10,moreAt:16,tanks:['road','east'],mortar:true},{inf:12,more:6,moreAt:22,tanks:['west','east'],helis:1,mortar:true},
    {inf:14,more:6,moreAt:18,tanks:['west','road','east'],mortar:true},{inf:16,more:8,moreAt:16,tanks:['west','road','east'],helis:2,mortar:true}],
  tankAt:{road:[430,-396],west:[300,-450],east:[190,-500]},
  roads:{west:[[700,-150],[672,-210],[640,-262],[560,-330],[420,-400],[250,-470],[60,-560]],east:[[700,-150],[790,-190],[900,-250],[990,-320],[1040,-380],[1120,-470],[1200,-520]]},   // (the fork's two branches, as drawn)
  ways:{road:[[560,-330],[640,-262],[690,-150],[700,100],[700,300],[700,440]],west:[[420,-400],[560,-330],[640,-262],[690,-150],[660,150],[640,300],[690,400],[700,450]],east:[[560,-330],[640,-262],[700,-150],[760,-40],[790,150],[770,300],[712,400],[700,450]]}};
const dcIn=(u,z)=>u.x>z.x0&&u.x<z.x1&&u.y>z.y0&&u.y<z.y1;

/* ---------- the ground ---------- */
function dcHeights(){
  const{nx,ny}=DDG,a=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=i*10,y=DDB.y0+j*10;
    let h=Math.max(0,-90-y)*.036+Math.sin(x*.011+1)*Math.cos(y*.009)*1.6;                       // the land rises a little to the tree line
    if(y>530)h=0;
    if(x>DCA.cliffX){const k=clamp((x-DCA.cliffX)/46,0,1);h=h*(1-k)+(DCA.beachH+Math.min(6,(x-DCA.cliffX-46)*-.012))*k*k*(3-2*k)+Math.sin(y*.05)*3*k*(1-k)*4;}   // (Version 231: the cliff down to the beach, the sand shelving to the water)
    a[j*nx+i]=h;}
  return a;
}
function dcObjects(){
  const L=[],o=(kind,x,y,w,h,ex)=>{const q=Object.assign({kind,x,y,w,h,full:false},ex||{});L.push(q);return q;};
  o('drop',0,-760,200,1660);o('drop',DCA.cliffX,-760,800,1660);   // (the cliff: nobody goes down it)
  // the base: bank and wire across the north either side of the command post, wire down the sides and the back
  for(const[x0,x1]of[[384,DCA.gate[0]],[DCA.gate[1],996]]){o('dcbank',x0,DCA.wallY,x1-x0,12,{cover:2});for(let x=x0;x<x1;x+=50)o('ddwire',x,DCA.wallY-18,Math.min(50,x1-x)-.01,8,{hp:60,tag:'wire'});}
  for(const x of[376,996])o('dcside',x,DCA.wallY-18,8,340,{full:false});
  o('dcside',384,884,612,8,{ew:1});
  for(const b of DCA.barracks)o('ddbarr',b.x,b.y,b.w,b.h,{full:true});
  o('dcbld',DCA.armory.x,DCA.armory.y,DCA.armory.w,DCA.armory.h,{full:true,look:'store'});o('dcbld',DCA.depot.x,DCA.depot.y,DCA.depot.w,DCA.depot.h,{full:true,look:'shed'});
  // (Version 236, Bryan: "The building should be wider so there are no alleyways to the left and right") the command post fills the gap in the
  // bank; the way through it is its own archway, the road running under it
  {const c=DCA.cp;o('dcbld',c.x,c.y,c.arch[0]-c.x,c.h,{full:true,look:'cpL'});o('dcbld',c.arch[1],c.y,c.x+c.w-c.arch[1],c.h,{full:true,look:'cpR'});}
  for(const[x,y]of[[560,620],[840,700],[610,690],[790,598],[470,668],[560,850],[780,850],[470,850],[850,740]])o('ddcrate',x,y,22,20,{cover:1});
  // the guns' bags; a short line either side of the road in front of the command post
  for(const g of DCA.guns){if(g.t==='mg'){o('sandbag',g.x-24,g.y-20,48,10);o('sandbag',g.x-30,g.y-16,10,28);o('sandbag',g.x+20,g.y-16,10,28);if(g.face===0)o('sandbag',g.x+26,g.y-6,10,30);}
    else{o('sandbag',g.x-34,g.y-36,68,10);o('sandbag',g.x-40,g.y-30,10,34);o('sandbag',g.x+30,g.y-30,10,44);}}
  o('sandbag',636,452,44,10);o('sandbag',720,452,44,10);o('sandbag',626,456,10,34);o('sandbag',764,456,10,34);   // (the entrance's own breastworks, either side of the road)
  for(const[x,y]of DCA.def){o('sandbag',x-24,y-20,48,10);o('sandbag',x-30,y-16,10,28);o('sandbag',x+20,y-16,10,28);}o('sandbag',566,344,48,10);o('sandbag',806,344,48,10);   // (the other troops' forward posts; Version 254: more across the field, DCA.def)
  // the field: boulders, the hedgerow with its gaps
  for(const[x,y]of[[560,40],[840,80],[390,130],[960,10],[300,-10],[930,140],[620,170],[790,-20],[480,-200],[900,-120]])o('ddbould',x,y,18,15,{cover:1});
  for(const[x0,x1]of[[220,520],[560,640],[760,840],[880,1000]])o('dchedge',x0,DCA.hedgeY,x1-x0,14,{full:true,cover:2});
  // their checkpoint between the fork's branches: a blockhouse, bags, a wall along its right; the woods road through its left
  // (after Version 231, Bryan: "No walls blocking any roadway (it looks like it blocks beach access)": nothing of it stands on either branch)
  {const c=DCA.check;o('dcbld',c.x,c.y,c.w,c.h,{full:true,look:'check',hp:DCA.checkHp,tag:'check'});
    o('sandbag',c.x-4,c.y+c.h+16,c.w+8,10);o('sandbag',c.x-12,c.y+c.h+2,10,24);o('sandbag',c.x+c.w+2,c.y+c.h+2,10,24);   // a breastwork in front of it, facing the base
    o('sandbag',c.x-22,c.y+6,10,40);o('sandbag',c.x+c.w+14,c.y+6,10,40);                                                  // short lines at its sides
    for(const[x,y]of[[c.x+c.w+34,c.y+46],[c.x+c.w+40,c.y-6],[c.x-34,c.y-14]])o('ddcrate',x,y,22,20,{cover:1});
    for(const e of DCA.eguns){o('sandbag',e.x+16,e.y-18,10,36);o('sandbag',e.x-18,e.y+16,36,10);o('sandbag',e.x-18,e.y-28,36,10);}   // their light machine guns' bags: toward the beach, and toward us (Version 254: and north, for when they're ours)
    o('sandbag',604,-362,44,10);o('sandbag',784,-362,44,10);o('sandbag',700,-345,72,10);}                                                                   // (Version 254) bags north of the blockhouse's corners: for whoever holds it against what comes out of the woods
  for(const[x,y]of[[300,-420],[430,-440],[560,-450],[860,-430],[950,-410]])o('ddbould',x,y,20,16,{cover:1});
  return L;
}
function dcPaint(g){
  const S=DDS,r=rng(1945);g.setTransform(S,0,0,S,0,-DDB.y0*S);
  g.fillStyle='#6f8a4b';g.fillRect(0,DDB.y0,1400,1660);
  for(let i=0;i<420;i++){const x=r()*1400,y=DDB.y0+r()*1660,k=r();g.fillStyle=k<.4?`rgba(62,92,44,${.12+r()*.16})`:k<.75?`rgba(136,158,82,${.1+r()*.14})`:`rgba(150,146,84,${.1+r()*.14})`;g.beginPath();g.ellipse(x,y,20+r()*70,12+r()*40,r()*3,0,7);g.fill();}   // (Version 188) the meadow in patches: lusher, paler, gone to seed
  for(let i=0;i<5200;i++){const x=r()*1400,y=DDB.y0+r()*1660;g.fillStyle=`rgba(${r()<.5?'58,82,40':'150,170,96'},${.06+r()*.12})`;g.fillRect(x,y,3+r()*9,2+r()*5);}
  // plough land and pasture beyond the hedgerow
  g.fillStyle='rgba(132,156,84,.55)';g.fillRect(230,-330,300,250);g.fillStyle='rgba(150,150,86,.5)';g.fillRect(830,-130,170,50);
  g.strokeStyle='rgba(70,60,40,.18)';g.lineWidth=2;for(let x=236;x<530;x+=9){g.beginPath();g.moveTo(x,-330);g.lineTo(x,-82);g.stroke();}
  // the road in from inland, worn and rutted
  g.fillStyle='#b4a47c';g.fillRect(DCA.road-30,DCA.forkY,60,DCA.wallY-DCA.forkY+10);
  for(const k of['west','east']){const P=DCA.roads[k];g.strokeStyle='#b4a47c';g.lineWidth=k==='west'?54:46;g.lineJoin='round';g.lineCap='round';g.beginPath();g.moveTo(P[0][0],P[0][1]+12);for(const p of P.slice(1))g.lineTo(p[0],p[1]);g.stroke();}
  {const gr=g.createLinearGradient(DCA.cliffX,0,DCA.cliffX+60,0);gr.addColorStop(0,'rgba(128,112,88,0)');gr.addColorStop(.35,'#857458');gr.addColorStop(1,'#d8c696');g.fillStyle=gr;g.fillRect(DCA.cliffX,DDB.y0,60,1660);g.fillStyle='#d8c696';g.fillRect(DCA.cliffX+60,DDB.y0,400,1660);
    for(let i=0;i<2600;i++){g.fillStyle=`rgba(${r()<.5?'150,132,96':'236,222,180'},${.1+r()*.2})`;g.fillRect(DCA.cliffX+50+r()*340,DDB.y0+r()*1660,2+r()*6,1+r()*3);}
    for(let i=0;i<70;i++){const x=DCA.cliffX+70+r()*250,y=DDB.y0+60+r()*1500;g.fillStyle='rgba(60,52,40,.5)';g.beginPath();g.ellipse(x,y,5+r()*4,2+r()*2,r()*3,0,7);g.fill();}}
  g.fillStyle='rgba(90,80,58,.45)';for(let y=DCA.forkY;y<560;y+=7){g.fillRect(DCA.road-13+Math.sin(y*.05)*2,y,2,5);g.fillRect(DCA.road+11+Math.sin(y*.043)*2,y,2,5);}
  // trampled earth round the nests, the guns and the trench
  for(const q of DCA.guns){const gr=g.createRadialGradient(q.x,q.y,4,q.x,q.y,q.t==='art'?58:44);gr.addColorStop(0,'rgba(120,100,66,.85)');gr.addColorStop(1,'rgba(120,100,66,0)');g.fillStyle=gr;g.fillRect(q.x-60,q.y-60,120,120);}
  // the base: hard-packed yard, the parade square
  g.fillStyle='#a69c7e';g.fillRect(382,DCA.wallY-6,616,340);
  for(let i=0;i<2400;i++){g.fillStyle=`rgba(${r()<.5?'70,64,48':'214,204,172'},${.05+r()*.1})`;g.fillRect(382+r()*616,DCA.wallY-6+r()*340,2+r()*5,2+r()*4);}
  {const gr=g.createLinearGradient(0,430,0,556);gr.addColorStop(0,'rgba(166,156,126,0)');gr.addColorStop(.3,'rgba(166,156,126,.95)');gr.addColorStop(1,'#a69c7e');g.fillStyle=gr;g.fillRect(590,430,220,128);g.strokeStyle='rgba(240,236,220,.55)';g.lineWidth=2;g.setLineDash([10,8]);g.beginPath();g.moveTo(672,440);g.lineTo(672,556);g.moveTo(728,440);g.lineTo(728,556);g.stroke();g.setLineDash([]);}   // (Version 238: a gravel forecourt in front of the command post, the road's edges marked)
  g.fillStyle='#b6ad90';g.fillRect(610,690,180,130);g.strokeStyle='rgba(240,236,220,.6)';g.lineWidth=2;g.strokeRect(614,694,172,122);g.fillStyle='#b4a47c';g.fillRect(DCA.road-22,640,44,52);
  g.fillStyle='rgba(60,54,40,.45)';g.fillRect(384,DCA.wallY+12,240,10);g.fillRect(776,DCA.wallY+12,220,10);
  // (Version 188) the yard's gravel and oil stains, wheel tracks off the road, the field churned by yesterday's shelling: craters with their
  // thrown earth, scorched grass, a few trodden paths out to the nests
  for(let i=0;i<3000;i++){g.fillStyle=`rgba(${r()<.5?'80,74,60':'200,194,170'},${.12+r()*.2})`;g.fillRect(382+r()*616,DCA.wallY-6+r()*340,1+r()*1.6,1+r()*1.6);}
  for(let i=0;i<14;i++){const x=400+r()*580,y=DCA.wallY+10+r()*300,gr=g.createRadialGradient(x,y,1,x,y,8+r()*14);gr.addColorStop(0,'rgba(30,28,24,.5)');gr.addColorStop(1,'rgba(30,28,24,0)');g.fillStyle=gr;g.fillRect(x-24,y-24,48,48);}
  for(const sd of[-1,1]){g.strokeStyle='rgba(84,72,50,.3)';g.lineWidth=7;g.beginPath();g.moveTo(DCA.road+sd*44,-300);g.bezierCurveTo(DCA.road+sd*60,0,DCA.road+sd*30,300,DCA.road+sd*14,560);g.stroke();}
  for(const[x,y]of[[450,250],[940,236],[590,345],[540,486],[900,410]]){g.strokeStyle='rgba(120,102,70,.35)';g.lineWidth=6;g.beginPath();g.moveTo(x,y+20);g.quadraticCurveTo((x+700)/2+(r()-.5)*60,(y+560)/2,700+(r()-.5)*100,DCA.wallY);g.stroke();}
  DD.dcHoles=[];for(let i=0;i<16;i++){const x=260+r()*720,y=-60+r()*340,R=7+r()*9;if(Math.abs(x-DCA.road)<40)continue;DD.dcHoles.push({x,y,r:R});
    for(let k=0;k<12;k++){const a=r()*TAU,l=R*(1.3+r());g.strokeStyle='rgba(92,76,50,.2)';g.lineWidth=2+r()*3;g.beginPath();g.moveTo(x+Math.cos(a)*R*.8,y+Math.sin(a)*R*.8);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
    const gr=g.createRadialGradient(x,y,1,x,y,R+4);gr.addColorStop(0,'rgba(40,32,22,.85)');gr.addColorStop(.6,'rgba(84,68,44,.6)');gr.addColorStop(1,'rgba(84,68,44,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,R+4,0,7);g.fill();
    for(let k=0;k<30;k++){const a=r()*TAU,d=R*(.9+r()*.6);g.fillStyle=r()<.5?'rgba(60,48,32,.5)':'rgba(140,120,84,.45)';g.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d,1.5+r()*2,1.5+r()*2);}}
  for(let i=0;i<9000;i++){const x=r()*DCA.cliffX,y=DDB.y0+r()*(DCA.wallY-DDB.y0);g.fillStyle=`rgba(${r()<.6?'44,64,30':'170,176,104'},${.08+r()*.14})`;g.fillRect(x,y,1+r()*1.5,1+r()*2);}
}
function dcScenery(sc){
  const far=new T.Mesh(new T.PlaneGeometry(9000,5000),typeof ddgFarMat==='function'?ddgFarMat(9000,5000):new T.MeshStandardMaterial({color:0x6f8a4b,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(DCA.cliffX-4500,-1.2,0);far.receiveShadow=true;sc.add(far);   // (Version 190: bocage fading into the haze, ddground.js)
  const hill=new T.Mesh(new T.PlaneGeometry(9000,1800),typeof ddgFarMat==='function'?ddgFarMat(9000,1800,0xe4e8dc):new T.MeshStandardMaterial({color:0x5b7340,roughness:1}));hill.rotation.x=-Math.PI/2+.06;hill.position.set(DCA.cliffX-4500,60,DDB.y0-880);sc.add(hill);
  // (Version 231) down the cliff on the right: the sand running on north and south, the sea, the cliff's face beyond the map
  const sand=new T.Mesh(new T.PlaneGeometry(700,9000),new T.MeshStandardMaterial({color:0xd8c696,roughness:1}));sand.rotation.x=-Math.PI/2;sand.position.set(DCA.cliffX+350,DCA.beachH-1.5,0);sand.receiveShadow=true;sc.add(sand);
  const sea=new T.Mesh(new T.PlaneGeometry(9000,9000),new T.MeshStandardMaterial({color:0x3f7f96,roughness:.35,metalness:.1}));sea.rotation.x=-Math.PI/2;sea.position.set(DCA.cliffX+330+4500,DCA.beachH+1.2,0);sc.add(sea);
  const foam=new T.Mesh(new T.PlaneGeometry(14,9000),new T.MeshBasicMaterial({color:0xf2f6f4,transparent:true,opacity:.7}));foam.rotation.x=-Math.PI/2;foam.position.set(DCA.cliffX+332,DCA.beachH+1.4,0);sc.add(foam);
  for(const[z,l]of[[DDB.y0-2250,4500],[900+2250,4500]]){const face=new T.Mesh(new T.PlaneGeometry(l,90),new T.MeshStandardMaterial({color:0x857458,roughness:1}));face.rotation.y=Math.PI/2;face.position.set(DCA.cliffX+10,DCA.beachH/2,z);sc.add(face);}
}
function dcBuild(G,sc,M,add){
  const earth=M(0x6a5c40,1),turf=M(0x7d8a4c,1),wall=M(0x9a9482,.95),roofM=M(0x55584e,.9),cpM=M(0x8d9298,.9),dark=M(0x26282a,.7,.5),wood=M(0x5d4a34,.95),steel=M(0x3a3632,.6,.7),wm=M(0x55504a,.5,.7),hedge=new T.MeshStandardMaterial({color:0x35542c,roughness:1}),leaf=new T.MeshStandardMaterial({color:0x3f6a34,roughness:1,flatShading:true}),leaf2=new T.MeshStandardMaterial({color:0x577a3a,roughness:1,flatShading:true});
  const H=(x,y)=>ddH(x,y);
  for(const o of DD.objs){const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=H(cx,cy);
    if(o.kind==='dcbank')o.meshes=[add(ddgBoxUV(o.w,9,o.h+4,24),ddgMat('earth'),cx,g0+4.5,cy),add(ddgBoxUV(o.w-2,3,o.h-2,24),ddgMat('turf'),cx,g0+10,cy)];   // (Version 188: dug earth, turf along the top)
    else if(o.kind==='dcside'){o.meshes=[];if(o.ew){for(let x=o.x;x<=o.x+o.w;x+=25)o.meshes.push(add(new T.BoxGeometry(1,19,1),wood,x,g0+9.5,cy));for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(o.w,.35,.35),wm,cx,g0+hh,cy));}
      else{for(let y=o.y;y<=o.y+o.h;y+=25)o.meshes.push(add(new T.BoxGeometry(1,19,1),wood,cx,g0+9.5,y));for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(.35,.35,o.h),wm,cx,g0+hh,cy));}}
    else if(o.kind==='dcbld'){const cp=o.look==='cp'||o.look==='cpL'||o.look==='cpR'||o.look==='check',h=o.look==='check'?26:cp?40:30;o.meshes=[add(ddgBoxUV(o.w,h,o.h,cp?24:32,[.5,.02]),ddgMat(cp?'stone':'boards'),cx,g0+h/2,cy),add(new T.BoxGeometry(o.w+8,4,o.h+8),roofM,cx,g0+h+2,cy),add(new T.BoxGeometry(o.w+2,3,o.h+2),dark,cx,g0+1.2,cy)];   // (Version 188: weatherboards, the post in stone)
      if(o.look==='cpL'){const c=DCA.cp,ax=(c.arch[0]+c.arch[1])/2,aw=c.arch[1]-c.arch[0],st=ddgMat('stone');   // (the archway between the halves: wall over it front and back, the roof across, a dark floor under)
        o.meshes.push(add(ddgBoxUV(aw,15,3,24),st,ax,g0+32.5,c.y+1.5),add(ddgBoxUV(aw,15,3,24),st,ax,g0+32.5,c.y+c.h-1.5),add(new T.BoxGeometry(aw+2,4,c.h+8),roofM,ax,g0+h+2,cy),add(new T.BoxGeometry(aw,.6,c.h),dark,ax,g0+.3,cy),add(new T.BoxGeometry(aw,1.2,c.h-6),dark,ax,g0+24.4,cy));const pole=add(new T.CylinderGeometry(.6,.6,44,6),steel,cx,g0+h+24,cy);o.meshes.push(pole,add(new T.BoxGeometry(16,9,.5),M(0x2b4a8a,.8),cx+8.5,g0+h+40,cy));}
      else if(o.look==='check'){o.meshes.push(add(new T.BoxGeometry(12,17,1.4),dark,cx-28,g0+8.5,o.y-.5));}
      else if(o.look==='shed'){for(let k=0;k<3;k++)o.meshes.push(add(new T.BoxGeometry(o.w/3-8,22,1.4),dark,o.x+o.w*(k+.5)/3,g0+11,o.y-.5));}
      else o.meshes.push(add(new T.BoxGeometry(14,18,1.4),dark,cx,g0+9,o.y-.5));}
    else if(o.kind==='dchedge'){o.meshes=[];const r=rng(Math.round(o.x));for(let x=o.x+7;x<o.x+o.w;x+=13){const m=add(DD.hedgeG||(DD.hedgeG=ddgSmooth(ddgJitter(new T.DodecahedronGeometry(9,0),1.2,31))),hedge,x,H(x,cy)+7+r()*2,cy+(r()-.5)*3,r()*6);m.scale.set(1.1,1+r()*.5,.95);o.meshes.push(m);}}
  }
  // watchtowers at the north corners, the flag on the square
  for(const[tx,ty]of[[400,580],[980,580]]){for(const[dx,dz]of[[-7,-7],[7,-7],[-7,7],[7,7]])add(new T.BoxGeometry(1.6,30,1.6),wood,tx+dx,15,ty+dz);
    add(new T.BoxGeometry(18,1.6,18),wood,tx,30,ty);for(const[dx,dz,w,d]of[[0,-9,18,1],[-9,0,1,18],[9,0,1,18]])add(new T.BoxGeometry(w,7,d),wood,tx+dx,34,ty+dz);add(new T.BoxGeometry(22,1.4,22),roofM,tx,50,ty);for(const[dx,dz]of[[-8,-8],[8,-8],[-8,8],[8,8]])add(new T.BoxGeometry(1,20,1),wood,tx+dx,40,ty+dz);}
  // (Version 238, Bryan: "The front yard should look more like a legitimate base entrance") stone gate pillars either side of the arch with lamps on
  // them, the boom raised, a sentry box each side, a flag on both sides, a painted board over the arch
  {const c=DCA.cp,ax=(c.arch[0]+c.arch[1])/2,y0=c.y-8,st=ddgMat('stone'),white=M(0xe8e4d8,.8),red=M(0xb02a22,.8);
    for(const sd of[-1,1]){const px=ax+sd*22;add(ddgBoxUV(7,24,7,24),st,px,12,y0);add(new T.BoxGeometry(9,2,9),roofM,px,25,y0);add(new T.SphereGeometry(1.6,8,6),M(0xfff2c8,.4),px,27.6,y0);
      add(new T.BoxGeometry(10,22,10),wood,ax+sd*46,11,y0+2);add(new T.BoxGeometry(13,1.6,13),roofM,ax+sd*46,23,y0+2);add(new T.BoxGeometry(5,14,.6),dark,ax+sd*46,8,y0-3.2);
      if(sd<0)add(new T.CylinderGeometry(.6,.6,52,6),steel,ax+sd*64,26,y0);}
    add(new T.BoxGeometry(18,10,.5),M(0x2b4a8a,.8),ax-64+10,46,y0);
    const pv=add(new T.BoxGeometry(2.4,9,2.4),steel,ax-17,4.5,y0-4);const boom=add(new T.BoxGeometry(40,1.4,1.4),white,ax-17+14,22,y0-4);boom.rotation.z=1.05;for(let k=0;k<4;k++){const b=add(new T.BoxGeometry(5,1.6,1.6),red,ax-17+5+k*5.2,6.4+k*9.1,y0-4);b.rotation.z=1.05;}
    add(new T.BoxGeometry(34,7,.8),M(0x2c3a2a,.9),ax,34,c.y-.6);add(new T.BoxGeometry(26,1.2,.9),white,ax,34,c.y-.7);}
  add(new T.CylinderGeometry(.7,.7,60,6),steel,DCA.flag.x,30,DCA.flag.y);DD.dcFlag=add(new T.BoxGeometry(22,12,.5),M(0x2b4a8a,.8),DCA.flag.x+12,52,DCA.flag.y);
  // (Version 231) the barrier across the woods road at their checkpoint, its sentry box; the lost landing down on the beach: craft wrecked in the
  // surf, burnt black, and the dead on the sand and up the cliff's foot
  {const c=DCA.check,bx=626,by=-250;
    // the barrier across the woods road with its counterweight and sentry box, off the road's edge
    add(new T.BoxGeometry(2,10,2),wood,bx+34,5+H(bx+34,by),by);const bar=add(new T.BoxGeometry(60,1.5,1.5),M(0xe8e4d8,.8),bx+6,9.4+H(bx,by),by);bar.rotation.z=.03;for(let k=0;k<5;k++)add(new T.BoxGeometry(6,1.6,1.6),M(0xb02a22,.8),bx-18+k*12,9.4+H(bx,by),by);
    add(new T.BoxGeometry(5,5,5),steel,bx+38,7+H(bx,by),by);add(new T.BoxGeometry(10,22,10),wood,bx+48,11+H(bx+48,by+14),by+14);add(new T.BoxGeometry(13,1.6,13),roofM,bx+48,23+H(bx+48,by+14),by+14);
    // the blockhouse dressed: a thick roof slab, firing slits toward the base and the roads, a lookout post on stilts behind it, their flag, an aerial, stores, wire
    const cx=c.x+c.w/2,cy=c.y+c.h/2,g0=H(cx,cy),co=DD.objs.find(q=>q.tag==='check'),cm=m=>{if(co&&co.meshes)co.meshes.push(m);return m;};co.roof=cm(add(new T.BoxGeometry(c.w+14,5,c.h+14),M(0x7d8076,.95),cx,g0+29,cy));cm(add(new T.BoxGeometry(c.w-20,6,c.h-18),M(0x6c7066,.95),cx,g0+34,cy));
    for(const dx of[-24,0,24])cm(add(new T.BoxGeometry(14,2.6,1.2),dark,cx+dx,g0+17,c.y+c.h+.7));for(const dz of[-12,12]){cm(add(new T.BoxGeometry(1.2,2.6,14),dark,c.x-.7,g0+17,cy+dz));cm(add(new T.BoxGeometry(1.2,2.6,14),dark,c.x+c.w+.7,g0+17,cy+dz));}
    {const tx=c.x+c.w-12,ty=c.y-26;for(const[dx,dz]of[[-7,-7],[7,-7],[-7,7],[7,7]])add(new T.BoxGeometry(1.6,40,1.6),wood,tx+dx,20+H(tx,ty),ty+dz);add(new T.BoxGeometry(18,1.6,18),wood,tx,40+H(tx,ty),ty);
      for(const[dx,dz,w,d]of[[0,9,18,1],[-9,0,1,18],[9,0,1,18],[0,-9,18,1]])add(new T.BoxGeometry(w,7,d),wood,tx+dx,44+H(tx,ty),ty+dz);add(new T.BoxGeometry(22,1.4,22),roofM,tx,58+H(tx,ty),ty);for(const[dx,dz]of[[-8,-8],[8,-8],[-8,8],[8,8]])add(new T.BoxGeometry(1,14,1),wood,tx+dx,51+H(tx,ty),ty+dz);}
    add(new T.CylinderGeometry(.7,.7,54,6),steel,c.x+10,g0+27,c.y+c.h+30);add(new T.BoxGeometry(20,11,.5),M(0xa8201c,.8),c.x+21,g0+47,c.y+c.h+30);add(new T.BoxGeometry(6,6,.6),M(0xf0f0ea,.8),c.x+21,g0+47,c.y+c.h+30.2);
    add(new T.CylinderGeometry(.25,.25,30,5),steel,c.x+c.w-8,g0+50,c.y+8);
    for(const[x,y,w,h2,d]of[[c.x-40,c.y+30,16,12,12],[c.x-44,c.y+46,12,9,10],[c.x+c.w+54,c.y+20,18,12,12]])add(new T.BoxGeometry(w,h2,d),M(0x5a6248,.9),x,h2/2+H(x,y),y);
    for(let k=0;k<3;k++){const b=add(new T.CylinderGeometry(4,4,10,10),M(0x4a4e44,.7),c.x+c.w+50+k*9,5+H(c.x+c.w+50,c.y+44),c.y+44+(k%2)*6);}
    // their light machine guns left of the fork: on tripods, pointed at the beach
    DD.dcEGuns=[];for(const e of DCA.eguns){
      if(typeof ddReal==='function'&&ddReal()){const rg=ddrGun('mg42',e.x,e.y,H(e.x,e.y),0);G.add(rg);DD.dcEGuns.push(rg);continue;}   // (Version 246, the draft's guns: ddreal.js)
      const g=new T.Group();g.position.set(e.x,H(e.x,e.y),e.y);g.rotation.y=0;const P=(geo,m,x,y,z,rz)=>{const b=new T.Mesh(geo,m);b.position.set(x,y,z);if(rz)b.rotation.z=rz;b.castShadow=true;g.add(b);return b;};
      P(new T.CylinderGeometry(.7,.7,16,7),steel,8,10.6,0,Math.PI/2);P(new T.BoxGeometry(5,3,2.2),steel,-2,10.4,0);P(new T.BoxGeometry(3,2.4,4.4),steel,1,9.8,2.4);
      for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,12,5),steel);l.position.set(Math.cos(a)*3.2,5,Math.sin(a)*3.2);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}G.add(g);DD.dcEGuns.push(g);}
    const burnt=M(0x2a2826,.95),rust=M(0x4a3a30,.95),r2=rng(231);
    for(const[x,y,a,tilt]of[[1330,380,.4,.2],[1352,120,-.3,-.25],[1318,-160,.9,.15],[1360,-420,-.6,.3],[1300,620,1.3,-.2],[1390,-20,.2,.1]]){
      if(typeof ddrHas==='function'&&ddrHas('ddrVehLCVP')){const w=ddrVehLCVP(true);ddrBurn(w);w.userData.real=true;w.scale.setScalar(.8);w.position.set(x,DCA.beachH+1,y);w.rotation.set(tilt*.5,a+Math.PI/2,tilt*.4);G.add(w);continue;}   // (Version 246, the draft: yesterday's landing craft, burnt out, ddrveh.js)
      const g=new T.Group();g.position.set(x,DCA.beachH+2,y);g.rotation.set(tilt,a,tilt*.6);
      for(const[w,hh,dd2,px,py,pz]of[[70,10,26,0,5,0],[70,12,1.6,0,10,13],[70,12,1.6,0,10,-13],[1.6,14,26,35,9,0],[10,9,16,-28,12,0]]){const b=new T.Mesh(new T.BoxGeometry(w,hh,dd2),px<0?rust:burnt);b.position.set(px,py,pz);b.castShadow=true;g.add(b);}G.add(g);}
    const dead=[];for(let i=0;i<64;i++){const x=DCA.cliffX+30+r2()*290,y=DDB.y0+80+r2()*1480;dead.push({x,y,h:ddH(Math.min(x,1390),y)+.8,ry:r2()*6,sx:1,c:r2()<.8?0x5a6240:0x3a3a36});}
    ddgInst(G,new T.BoxGeometry(11,2.2,4.4),new T.MeshLambertMaterial({color:0xffffff,vertexColors:true}),dead,true,400,false);}
  // the guns: a machine gun on its tripod, or a field gun on its carriage (its group turns to where it fires)
  const gm=M(0x2a2c2e,.5,.7),ol=M(0x4d5540,.9);DD.dcGuns={};
  for(const q of DCA.guns){
    if(typeof ddReal==='function'&&ddReal()){const rg=dcRealGun(q,H);if(rg){G.add(rg);DD.dcGuns[q.k]=rg;continue;}}   // (Version 246, the draft's guns)
    const g=new T.Group();g.position.set(q.x,H(q.x,q.y),q.y-(q.t==='art'?14:9));g.rotation.y=q.face===0?0:Math.PI/2;const P=(geo,m,x,y,z,rz,rx)=>{const b=new T.Mesh(geo,m);b.position.set(x,y,z);if(rz)b.rotation.z=rz;if(rx)b.rotation.x=rx;b.castShadow=true;g.add(b);return b;};
    if(q.t==='mg'){if(q.hv){P(new T.CylinderGeometry(1.15,1.15,22,8),gm,12,11.6,0,Math.PI/2);P(new T.BoxGeometry(.9,10,13),ol,5.5,12.4,0);P(new T.BoxGeometry(5,4,5),ol,0,10.6,-3.4);}   // (a heavy one: a longer, thicker barrel, a shield, a bigger box)
      P(new T.CylinderGeometry(.75,.75,17,7),gm,9,11.6,0,Math.PI/2);P(new T.CylinderGeometry(1.25,1.25,7,8),gm,3,11.6,0,Math.PI/2);P(new T.BoxGeometry(5,3,2.2),gm,-2,11.2,0);P(new T.BoxGeometry(3,2.4,4.6),gm,1,10.6,2.6);
      for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,13,5),gm);l.position.set(Math.cos(a)*3.4,5.4,Math.sin(a)*3.4);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}}
    else{P(new T.BoxGeometry(22,5,14),ol,-2,8,0);P(new T.BoxGeometry(3,16,26),ol,6,13,0);const b=P(new T.CylinderGeometry(1.9,2.4,58,8),gm,30,15,0,Math.PI/2-.16);b.userData.rest=30;g.userData.barrel=b;
      for(const z of[-12,12]){const w=P(new T.CylinderGeometry(8,8,3,14),gm,0,8,z,0,Math.PI/2);w.castShadow=true;}P(new T.BoxGeometry(34,2.4,3),ol,-20,4,6);P(new T.BoxGeometry(34,2.4,3),ol,-20,4,-6);}
    G.add(g);DD.dcGuns[q.k]=g;}
  // trees: the tree line across the north, the orchard, a few along the road and round the farm
  // (Version 188: instanced, a few draw calls for all of them where there were three a tree, each crown shaded darker underneath and its own shape)
  const tr=rng(77),TK=[],C1=[],C2=[],tree=(x,y,s,m)=>{const g0=H(x,y),c=m===leaf?[0x3f6a34,0x456e36,0x3a6230]:[0x577a3a,0x5e8240,0x4e7034],pc=()=>c[(tr()*3)|0];TK.push({x,y,h:g0+8*s,sx:s,ry:tr()*6});
    C1.push({x,y,h:g0+24*s,sx:13*s,sy:15.6*s,sz:13*s,ry:tr()*6,c:pc()});C2.push({x:x+5*s,y:y-3*s,h:g0+33*s,sx:9*s,ry:tr()*6,c:pc()});};
  const onRoad=(x,y)=>['west','east'].some(k=>{const P=DCA.roads[k];for(let i=0;i<P.length-1;i++){const[ax,ay]=P[i],[bx,by]=P[i+1],t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2),0,1);if(hyp(x-ax-(bx-ax)*t,y-ay-(by-ay)*t)<44)return true;}return false;});
  for(let x=-600;x<DCA.cliffX-20;x+=30)for(let k=0;k<2;k++){const tx=x+(tr()-.5)*20,ty=DCA.treeY-30-k*46+(tr()-.5)*30;if(!onRoad(tx,ty))tree(tx,ty,1.2+tr()*.7,tr()<.5?leaf:leaf2);}
  for(let i=0;i<260;i++){const tx=-500+tr()*1120,ty=-1250+tr()*960;if(ty>-330-(620-tx)*.12||onRoad(tx,ty)||hyp(tx-DCA.check.x-40,ty-DCA.check.y)<130)continue;tree(tx,ty,1.1+tr()*.8,tr()<.6?leaf:leaf2);}   // (the woods the left branch goes into)
  for(const[x,y]of[[300,-290],[470,-180],[250,-130],[930,-200],[880,-40]])tree(x,y,1,leaf);
  {const lv=new T.MeshLambertMaterial({vertexColors:true});
    ddgInst(G,ddgShade(new T.CylinderGeometry(1.4,2,16,6),.5,1.05),new T.MeshLambertMaterial({color:0x5d4a34,vertexColors:true}),TK,true,350,false);
    ddgInst(G,ddgShade(ddgSmooth(ddgJitter(new T.DodecahedronGeometry(1,0),.16,11)),.48,1.12),lv,C1,true,350,false);ddgInst(G,ddgShade(ddgSmooth(ddgJitter(new T.DodecahedronGeometry(1,0),.16,12)),.55,1.12),lv,C2,true,350,false);}
  // (Version 188) grass in tufts over the fields, and banks of thrown earth round yesterday's shell holes (dcPaint's DD.dcHoles), clods about them
  {const tr2=rng(1188),tf=[],pk=a=>a[(tr2()*a.length)|0];for(let i=0;i<4600;i++){const x=tr2()*(DCA.cliffX-6),y=DDB.y0+tr2()*(DCA.wallY-DDB.y0-10);if(Math.abs(x-DCA.road)<36)continue;
      tf.push({x,y,h:H(x,y)-.2,ry:tr2()*6,sx:.8+tr2()*.9,sy:.7+tr2()*1.2,c:pk([0x5c8238,0x6a8c40,0x527a32,0x7e8a44,0x668a3c,0x8e8c56])});}
    ddgInst(G,ddgTuftGeo(1188),new T.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide}),tf,false);
    if(DD.dcHoles&&DD.dcHoles.length){const earthC=[96,78,52],spoilC=[128,108,74];ddgCraters(G,DD.dcHoles,{seed:1945,spoil:spoilC,earth:earthC,lift:.75});
      ddgInst(G,ddgShade(ddgJitter(new T.DodecahedronGeometry(1,0),.25,9),.55,1.05),new T.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true}),ddgClods(DD.dcHoles,tr2,30,spoilC,earthC),false);}}
}

/* ---------- starting it ---------- */
function startCounter(retry,noSeq){   // (noSeq: straight to the fight, no opening: the start card's after-battle shortcut, ddplay.js's ddAfter)
  if(!ddRoster)ddRoster=ddmRead();
  if(retry&&startCounter.snap){ddRoster=JSON.parse(startCounter.snap);ddmSave();}   // (a loss is a retry: the roster as it was when they left the barracks)
  if(!retry&&typeof ddmReady==='function')ddmReady(2);   // (from the start card before it's reached: squads made for it, ddmeta.js, Version 178)
  if(!ddmFit().length){banner('Nobody fit: treat the wounded or add reserves.',3200);return;}
  startCounter.snap=JSON.stringify(ddRoster);
  startCounter.noSeq=!!retry||!!noSeq;reset();DD_MODE='counter';$('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  enterCounter();state='play';endAt=0;
  bigText('Chapter 2: Hold the base','chapter');hud();
}
function enterCounter(){
  buildDDay();stashOut(players);
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap({objs:DD.objs,hq:DD.hq,slow:[],lamps:DD.lamps,scene:DD.scene,lights:DD.lights,x1:NAV_W});
  tankFires=[];rockets=[];charges=[];units=[];players=[];enemies=[];civs=[];
  MAPID='dd';LEVEL=5;groundH=ddH;
  dd={counter:true,t0:simT,pool:ddmReserveFit().length,lost:0,queue:[],npcs:[],npcN:0,nid:0,eid:0,active:'A',idle:{A:0,B:0},hop:{A:0,B:0},wp:{A:0,B:0},front:800,won:false,over:false,
    land:{t:0,done:true},boats:[],waveT:0,spawnT:1e9,aiT:0,npcT:0,shellT:{},oob:0,ambT:0,killed:0,npcLost:0,blown:{},labels0:{},tanks:[],held:{},wires:[],
    dc:{ph:'intro',t:0,wave:0,cpT:0,guns:DCA.guns.map(g=>({...g,hp0:g.hp,man:null,going:null,fireT:0,orderT:-99,aim:null,hits:0,dead:false,smokeT:0,hvT:0})),art:null,col:[],shells:[],focus:null,focusK:null,picked:false,
      cpOurs:false,cpGo:false,capT:0,spawned:0,rest:0}};   // (Version 254: their checkpoint ours or not, the push on it under way, the taking's clock; their men so far; the rest's length)
  for(const k in DD_LABELS){dd.labels0[k]=WEAPON[k].label;WEAPON[k].label=DD_LABELS[k];}
  dd.rpg0=SPECIALS.rpg.label;SPECIALS.rpg.label='Bazooka';dd.rpgR=PRPG.range;PRPG.range=900;dd.rpgA=PRPG.aim;PRPG.aim=1.15;ddBaz(1);
  // the squads on the parade square, the other troops along the wall
  // (Version 236: out in front of the command post, where the opening leaves them)
  ['A','B'].forEach((t,ti)=>[0,1,2,3].forEach(i=>{const rm=ddmSlotMan(t,i);if(!rm)return;const u=ddNewMan(t,t+(i+1),rm.role,(ti?724:612)+i*18,498+(i%2)*14,rm);u.inBoat=false;u.seen=true;}));
  players=units.filter(u=>u.side==='P'&&!u.npc);
  for(let i=0;i<10;i++){const u=ddNpc(i<5?400+i*44:790+(i-5)*40,DCA.wallY+22+(i%2)*10);u.inBoat=false;u.seen=true;u.back={x:u.x,y:u.y};u.post={x:DCA.posts[i][0],y:DCA.posts[i][1]};u.ln=i<8?1:2;u.hopT=simT+.3+i*.25;if(DCA.bz.at.includes(i))dcBzMan(u);}   // (Version 224: they run out to forward posts in the field as it starts, and fall back to the line when it gets too close: dcNpc)
  if(typeof dcFrantic==='function'){const r=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4711);for(const u of dd.npcs){u.hopT=simT+.2+r()*1.9;dcFrantic(u,r);}}   // (Version 249, Bryan: "run frantically to the front, not orderly march": each when he's ready and at his own speed; they went one every quarter second. Its own random numbers: the battle's are as they were)
  dd.pool=0;dd.sup={A:'hold',B:'hold'};   // (both squads hold: nobody follows anybody off the line)
  // the column on the road: the first wave's men marching in, the tanks behind them
  const W=DCA.waves[0];for(let i=0;i<W.inf;i++){const e=ddFoe('w1',DCA.road-DDX+((i%3)-1)*13,-560-((i/3)|0)*22,{ang:Math.PI/2,nade:i%7===0?1:0});e.lane=250+(i/(W.inf-1))*720;e.cool=99;e.stage=-1;e.smk=i%DCA.smk.every===2?1:0;
    const p=findPath(e.x,e.y,e.lane,DCA.treeY+30+((i%2)*18),FOOT);if(p)e.path=p;e.zone={x0:e.lane-80,x1:e.lane+80,y0:DCA.treeY-20,y1:DCA.treeY+90};}
  // (Version 238 had four tanks waiting up the woods road from the start, the first with wave 1. Version 254, Bryan: "Heavy units can start
  // appearing at Wave 5": they're made when their wave starts, dcSpawnWave)
  dd.dc.spawned=W.inf;
  enemies=units.filter(u=>u.side==='E');
  contact=true;clearTeams();teamSeen.A=true;teamSeen.B=true;teamSeen.N=true;
  mission.t0=simT;sel=[];cardGroup=[];
  VB={x0:DCA.x0,z0:-720,x1:DCA.x1+150,z1:900};FIT.w=1040;FIT.h=1560;fitDist();
  MAXZ=11;camShift=0;zoom=DD_CAM.zoom;yaw=0;tilt=ddTilt(DD_CAM.zoom);camT={x:DCA.road,z:DCA.wallY-230+DD_CAM.look};clampCam();updateCamera();   // (Version 236: on the guns in front of the command post; Version 224: on the line of guns, the barracks behind the camera)
  document.body.classList.add('dd');ddSky(.35);DD.day=.35;DD.dayShown=.35;
  updateObjUI();setStatus();buildCards();hud();
  select(players.filter(p=>p.team==='A').length?players.filter(p=>p.team==='A'):players.filter(p=>p.team==='B'));dd.track=null;
  // the look up the road: there they are; then back, and the clock starts
  if(typeof dcSeqStart==='function'&&dcSeqStart())return;   // (Version 228: the opening sequence, ddcseq.js; not on a retry)
  dcAuto();camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:DCA.road,z:-470+DD_CAM.look,zoom:6.5},t:0,dur:2.2};
  banner('They are coming out of the woods.',4000);
}

/* ---------- the guns ---------- */
const dcGunAt=(x,y,r=30)=>dd.dc.guns.reduce((b,g)=>{if(g.off)return b;const d=hyp(x-g.x,y-g.y);return d<r&&(!b||d<hyp(x-b.x,y-b.y))?g:b;},null);
// Version 246 (a draft, ddreal.js): the gun as the real thing: a Browning .30 in a nest, a .50 for the heavy gun, the anti-tank gun for the field gun
function dcRealGun(q,H){
  const a=q.face===0?0:-Math.PI/2;
  if(q.t==='mg')return ddrGun(q.hv?'m2':'m1919',q.x,q.y-9,H(q.x,q.y),a);
  if(typeof ddrArtM1AT!=='function')return null;
  const g=ddrArtM1AT(0);g.position.set(q.x,H(q.x,q.y),q.y-14);g.rotation.y=-a;g.userData.real=true;if(g.userData.barrel&&g.userData.barrel.userData.rest==null)g.userData.barrel.userData.rest=g.userData.barrel.position.x;return g;
}
function dcSeat(g){return{x:g.x,y:g.y+(g.t==='art'?12:0)};}
// he takes it: on its seat, facing the way it points, a machine gun's swing and its own fire (DCA.gw: the light guns twice as fast, the heavy one
// slower and harder hitting: combat.js reads u.gunW). From dcGunsTick when he gets there, and from dcTile at once (Version 254)
function dcSit(g,u){
  if(g.man&&g.man!==u){const o=g.man;dcOff(o);if(o.dcGun===g)o.dcGun=null;}   // (one of the other troops on it gives it up to the squad mate who's come for it)
  const s=dcSeat(g),f=g.face0??-Math.PI/2;g.going=null;g.man=u;g.manT=simT;u.path=[];u.x=s.x;u.y=s.y;u.ang=f;u.aimT=simT;u.dcGun=g;
  dcGunOn(g,u,f);
  if(!u.npc)callout(u,g.t==='art'?'On the field gun':'On the gun',C0());
}
// his hands on a machine gun: its arc, its fire (Version 255: also put back by dcGunsTick if anything has taken them off it while he holds it)
function dcGunOn(g,u,f){if(g.t==='mg'){u.onGun={x:g.x,y:g.y,ang:f??(u.onGun?u.onGun.ang:g.face0??-Math.PI/2),arc:g.arc,lt:!g.hv,hv:!!g.hv};u.gunner=true;u.gunW=DCA.gw[g.hv?'hv':'lt'];}}
function dcOff(u){if(!u)return;if(u.onGun){u.onGun=null;u.gunner=false;}u.gunW=null;}
// Version 254 (Bryan: "A stationary weapon should be destroyed first and just hurt the soldier. It doesn't kill the soldier. Have the machine be
// destroyed first and the soldier has no less than 50% health"): from combat.js's damage, for one of ours on a gun that's still up. The gun takes
// the hit (shield.gun of it); he takes shield.man of it the usual way, never below shield.floor (or what he had, if he took the gun with less) and
// never killed outright (ddplay.js's ddDamage reads t.hpFloor). Until now a man on a gun was hurt like any other, a round in four in a hundred
// killed him outright ("shot through the head"), and the gun only took half of what hit him: Bryan, "The soldiers killed me before I could even
// shoot"; in tests three men on guns in one fight were killed outright by a single round, from 32 to 100 HP. Returns what's left for him.
function dcShield(t,dmg,src){
  const g=t.dcGun,S=DCA.shield;if(!dd||!dd.dc||!(dmg>0))return dmg;
  if(t.shieldT>simT&&!(g&&g.man===t&&!g.dead)){t.hpFloor=Math.min(t.hp,S.floor);return dmg*S.man;}   // (just thrown off his gun: the shell that blew it up doesn't kill him a moment later)
  if(!g||g.man!==t||g.dead)return dmg;
  t.hpFloor=Math.min(t.hp,S.floor);dcGunHit(g,dmg*S.gun);
  return g.dead?0:dmg*S.man;   // (the hit that blew the gun up threw him off it: dcGunHit has hurt him already)
}
function dcMan(u,g){   // send him to it; he takes it when he gets there (dcGunsTick)
  const s=dcSeat(g),p=findPath(u.x,u.y,s.x,s.y);if(!p)return false;
  // (one of the other troops on it stays on it until the squad mate gets there: dcSit)
  if(u.dcGun&&u.dcGun!==g){u.dcGun.man=u.dcGun.man===u?null:u.dcGun.man;u.dcGun.going=null;}
  dcOff(u);Object.assign(u,{path:p,lastOrder:simT,watch:null,supT:null,focus:null,dcGun:g});g.going=u;g.goT=simT;return true;
}
// Version 224 (Bryan): the squad takes the guns itself as it starts; a tap on an empty gun, on the map or on its tile, sends the nearest free squad
// mate, and one of the other troops only when no squad mate is left ("it only says NPC if no squad mates are left"); a tap on a gun a squad mate
// holds puts the player behind it (first person, ddfp.js); from there BACK leaves the view with him still on it and LEAVE GUN takes him off it.
const dcFreeMen=()=>players.filter(u=>alive(u)&&!u.dcGun&&!u.onGun&&!u.carry&&!u.fp&&!u.inBoat&&!dd.dc.guns.some(g=>g.fix&&g.fix.u===u));   // (Version 255: not an Engineer on his way to a repair: the gun he'd left was manned again by him, which called the repair off)
function dcFill(g){
  const by=(a,b)=>(a.ddRole==='medic')-(b.ddRole==='medic')||hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y);
  for(const u of dcFreeMen().sort(by))if(dcMan(u,g)){callout(u,g.t==='art'?'To the field gun':'To the gun',C0());return u;}
  if(g.man||g.going)return null;
  for(const u of dd.npcs.filter(u=>alive(u)&&!u.dcGun).sort(by))if(dcMan(u,g))return u;
  return null;
}
// as it starts: the gunners to the heavy guns, a Demo man to the field gun, the riflemen to the nests; then whoever is left (a medic last)
function dcAuto(){
  const C=dd.dc,want={a1:'demo',h1:'gunner',n1:'rifle',n2:'rifle'},free=()=>players.filter(u=>alive(u)&&!u.dcGun);
  for(const g of C.guns){const u=free().filter(q=>q.ddRole===want[g.k]).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(u)dcMan(u,g);}
  for(const g of C.guns)if(!g.going){const u=free().sort((a,b)=>(a.ddRole==='medic')-(b.ddRole==='medic')||hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(u&&players.filter(alive).length>C.guns.filter(q=>q.going).length+2)dcMan(u,g);}
  free().forEach((u,i)=>{const s=DCA.hold[i%DCA.hold.length],p=findPath(u.x,u.y,s[0],s[1]);if(p)u.path=p;});   // (the rest at the flag: it's lost if none of ours is by it)
}
function dcLeave(g){const u=g&&g.man;if(!u)return;dcOff(u);u.dcGun=null;g.man=null;if(isFree(u.x,u.y+14,5))u.y+=14;}
function dcTile(k){
  const C=dd.dc,g=C.guns.find(q=>q.k===k);if(!g||g.off||C.ph==='intro'||state!=='play'||endAt)return;C.picked=true;
  if(g.dead){dcFixSend(g,true);return;}
  // (Version 254, Bryan: "I try to go on the field gun and it took about three clicks": as the fight starts every gun's man is still walking to
  // it, and a tap on a gun whose man was on his way did nothing until he got there: five taps half a second apart in a test. Now he's on it at
  // once and you're behind it)
  {const u=g.going;if((!g.man||g.man.npc)&&u&&!u.npc&&alive(u)&&u.dcGun===g&&hyp(u.x-g.x,u.y-g.y)<450)dcSit(g,u);}   // (from as far as 45 m: across the base; not from the base to their checkpoint)
  const m=g.man;
  if(m&&!m.npc){if(typeof fpEnter==='function'&&(!dd.fp||dd.fp.u!==m)){fpEnter(m,'1p');if(dd.fp){dd.fp.a=g.face0??-Math.PI/2;dd.fp.p=-.04;}}return;}
  if(g.going&&!g.going.npc){banner(`${g.going.name} is on his way to the ${dcName(g)}.`,1600);return;}
  if(!dcFill(g)&&!(g.man||g.going))banner('Nobody left to man it.',1600);
}
function dcTap(wx,wy){const C=dd.dc;if(C.ph==='intro')return true;const g=dcGunAt(wx,wy);if(!g)return false;dcTile(g.k);return true;}
// a thumb on one of theirs, from above: every gun that can bear turns on him until he's down (dcGunsTick); a tank the same
function dcFocus(e,K){const C=dd.dc;C.focus=e||null;C.focusK=K||null;C.focusT=simT;}
const C0=()=>typeof C!=='undefined'&&C.good?C.good:'#5fe08e';
// o (Version 247, from behind the gun: ddfp.js's fpArtAim): direct: it flies flat and fast to where the crosshair is; tank: the tank the
// crosshair was on, which it follows in (dcGunsTick), so a shot aimed at a tank hits the tank. Until then a shell always went to the spot on the
// ground under the crosshair, which for a shot aimed at a tank's hull is far behind it (Bryan: "The field gun was not doing anything to the tank")
function dcFire(g,x,y,o){
  g.fireT=simT+DCA.art.reload;g.aim=null;const by=g.man,direct=!!(o&&o.direct);let tk=o&&o.tank||null,hitCheck=false;
  // (Version 238, Bryan: "I can't blow up the blockhouse with the field gun, that should be an option. Like 3 hits") a shell aimed at it, or whose
  // line runs through it (in first person the crosshair's spot on the ground is behind the wall), strikes its front: each one a third of it
  {const co=objs.find(q=>q.tag==='check'),c=DCA.check;if(!tk&&co&&!co.gone&&(hyp(x-(c.x+c.w/2),y-(c.y+c.h/2))<90||segHitsRect(g.x,g.y,x,y,co,6))){x=c.x+c.w/2+(Math.random()-.5)*40;y=c.y+c.h+3;hitCheck=true;}}
  const d=hyp(x-g.x,y-g.y),dur=direct?clamp(d/DCA.art.fast,.14,.65):clamp(d/520,.7,1.9);
  if(hitCheck)(dd.dc.artLand||(dd.dc.artLand=[])).push({at:simT+dur,by});
  nades.push({x0:g.x,y0:g.y-14,x1:x,y1:y,t:0,dur,by,R:DCA.art.R,D:DCA.art.D,shell:true,direct,tk});
  if(direct)tracers.push({x1:g.x,y1:g.y-14,x2:x,y2:y,t:0,col:'255,236,190'});
  flashes.push({x:g.x,y:g.y-44,t:0});if(typeof sfxCannon==='function')sfxCannon(g.x,g.y);shake(.35);
  const m=DD.dcGuns&&DD.dcGuns[g.k];if(m){m.rotation.y=-Math.atan2(y-g.y,x-g.x);m.userData.kick=1;}
}
// a tank's shell on a gun (Bryan, after Version 159: "A tank can knock a gun out, in three hits. You can see it smoke after one, then dark smoke
// after 2"): a shell landing within DCA.gunHit of it is a hit; one and it smokes, two and the smoke is dark, three and it's wrecked for the fight
function dcGunHit(g,d){
  if(g.dead)return;g.hp-=d??DCA.hv.shell;const m=DD.dcGuns&&DD.dcGuns[g.k],h0=g.hits;g.hits=g.hp<=0?3:g.hp<g.hp0*.4?2:g.hp<g.hp0*.75?1:0;
  if(g.hp>0){if(g.hits>h0)banner(g.hits===1?`${g.n} is hit.`:`${g.n} is badly hit.`,2200);return;}
  // (Version 224, Bryan: "Stationary guns can be destroyed ... they can blow up, incapacitating the squad mate (can be healed by a medic)")
  g.dead=true;g.aim=null;if(dd.dc.art===g)dd.dc.art=null;const man=g.man;
  for(const u of[g.man,g.going])if(u){dcOff(u);if(u.dcGun===g)u.dcGun=null;}g.man=null;g.going=null;
  // (Version 254, Bryan: "Have the machine be destroyed first and the soldier has no less than 50% health": thrown off it, hurt, on his feet. It
  // was down to 1 HP and then 30 more, so he went down and waited for a medic)
  if(man&&alive(man)){const S=DCA.shield;if(man.fp&&typeof fpExit==='function')fpExit(`${g.n} is knocked out. ${man.name} is hurt.`);if(isFree(man.x,man.y+12,5))man.y+=12;
    if(man.hp>S.floor)man.hp=Math.max(S.floor,man.hp-S.off);man.hitFlash=.25;man.stunT=simT+S.stun;man.shieldT=simT+S.stun+.6;man.path=[];if(!man.npc&&typeof hitCue==='function')hitCue(.5);
    if(!man.npc){const h=DCA.lee.slice().sort((a,b)=>hyp(a[0]-man.x,a[1]-man.y)-hyp(b[0]-man.x,b[1]-man.y))[0],p=findPath(man.x,man.y,h[0],h[1]);if(p){man.path=p;man.lastOrder=simT;}}}   // (once he's on his feet, behind the bank: in tests the men thrown off went to the flag and were shot there)
  if(m){m.userData.dcDown=1;m.rotation.z=.32;m.rotation.x=.12;m.position.y-=2;m.traverse(o=>{if(o.material){o.userData.dcM0=o.material;o.material=o.material.clone();if(typeof ddgBurnMat==='function')ddgBurnMat(o.material);else o.material.color.setHex(0x1b1a18);}});}   // (Version 190: charred brown-grey, not black)
  for(let q=0;q<3;q++)booms.push({x:g.x+(Math.random()-.5)*24,y:g.y+(Math.random()-.5)*20,t:-q*.1,size:1});tankFires.push({x:g.x,y:g.y-8,r:9,t0:simT,puffs:[],emit:0});
  shake(.6);if(typeof sfxBoom==='function')sfxBoom(g.x,g.y,1.1);banner(`${g.n} is knocked out.`,3200);
}
// a heavy machine gun on a tank: a little off it each burst, and its next shot put back while it's being hit
function dcHvTank(K,k,by){if(!K||K.hp<=0)return;K.hp-=DCA.hv.tank*(k||1);ddTankHold(K,DCA.hv.hold);if(by&&simT-(K.hitT||-99)>3){K.hitBy=by;K.hitT=simT;}if(K.hp<=0){K.hp=1;ddTankHit(K.x,K.y,1,3,by);}}   // (Version 247: it was K.fireT put back 1.6 s every 1.1 s: the tank never fired; and now it turns on the gun that's doing it, unless a shell or a rocket has hit it in the last 3 s)
// Version 226 (Bryan, asked whether the Engineer should repair destroyed guns: "yes"): a knocked-out gun is put right by an Engineer (the bazooka
// man) standing at it DCA.fixT seconds. A tap on the gun sends the nearest one (off his own gun if need be); one with nothing to do goes by himself.
function dcFixSend(g,say){
  if(!g.dead)return false;if(g.fix&&alive(g.fix.u)){if(say)banner(`${g.fix.u.name} is repairing the ${g.n.toLowerCase()}.`,1600);return true;}
  const E=players.filter(u=>alive(u)&&u.ddRole==='demo'&&!u.fp&&(u.fixN||0)<DCA.fixN&&!dd.dc.guns.some(q=>q.fix&&q.fix.u===u)).sort((a,b)=>(!!a.dcGun-!!b.dcGun)||hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y));
  const rest=dd.dc.ph==='lull'||dd.dc.ph==='push',u=say||rest?E[0]:E.find(q=>!q.dcGun);if(!u){if(say)banner(players.some(q=>alive(q)&&q.ddRole==='demo'&&(q.fixN||0)<DCA.fixN)?'No Engineer free to repair it.':'The Engineers are out of repair supplies.',2000);return false;}
  if(u.dcGun){const o=u.dcGun;if(o.man===u)dcLeave(o);else{o.going=null;u.dcGun=null;}if(!say)u.fixFrom=o;}   // (in a rest, by himself: back to his own gun after, Version 254)
  const p=findPath(u.x,u.y,g.x,g.y+16)||findPath(u.x,u.y,g.x+16,g.y+10);if(p){u.path=p;u.lastOrder=simT;}g.fix={u,t:0};
  if(say)banner(`${u.name} goes to repair the ${g.n.toLowerCase()}.`,2000);return true;}
// a knocked-out gun working again: upright, its own paint, its fire out (an Engineer's repair; their checkpoint's light guns, taken again, Version 254)
function dcGunUp(g,hp){
  g.dead=false;g.fix=null;g.hp=hp;g.hits=hp<g.hp0*.75?1:0;g.fireT=simT+2;
  const m=DD.dcGuns&&DD.dcGuns[g.k];if(m){if(m.userData.dcDown){m.userData.dcDown=0;m.rotation.z=0;m.rotation.x=0;m.position.y+=2;}m.traverse(o=>{if(o.userData.dcM0){o.material=o.userData.dcM0;o.userData.dcM0=null;}});}
  for(let i=tankFires.length-1;i>=0;i--)if(hyp(tankFires[i].x-g.x,tankFires[i].y+8-g.y)<4)tankFires.splice(i,1);
}
const dcFixLeft=()=>players.some(q=>alive(q)&&q.ddRole==='demo'&&(q.fixN||0)<DCA.fixN);
function dcFixTick(dt){
  const C=dd.dc;C.fixT=(C.fixT||0)-dt;const look=C.fixT<=0;if(look)C.fixT=1.5;
  for(const g of C.guns){if(!g.dead){g.fix=null;continue;}const f=g.fix;
    if(!f){if(look&&C.ph!=='intro')dcFixSend(g,false);continue;}
    const u=f.u;if(!alive(u)||u.dcGun||u.fp){g.fix=null;continue;}
    u.lastOrder=simT;if(hyp(u.x-g.x,u.y-g.y)>34){if(!u.path||!u.path.length){f.w=(f.w||0)+dt;if(f.w>2)g.fix=null;}continue;}
    u.lastOrder=simT;if(u.sup>PINNED)continue;f.t+=dt;
    if(f.t>=DCA.fixT){dcGunUp(g,Math.round(g.hp0*.6));
      u.fixN=(u.fixN||0)+1;banner(`${u.name} has the ${g.n.toLowerCase()} working again. ${u.fixN>=DCA.fixN?'He is out of supplies.':(DCA.fixN-u.fixN)+' repair left.'}`,3000);
      const o=u.fixFrom;u.fixFrom=null;if(o&&!o.dead&&!o.off&&!o.man&&!o.going)dcMan(u,o);dcFill(g);}}}
// Version 233 (Bryan: "light machine guns shooting through the windows. Keep them as small slits as now. The building can be destroyed with
// explosions, that's how you kill them"): the blockhouse's three slits toward the base each hold a light machine gun. Nothing reaches the men
// inside but a blast: it takes DCA.checkHp of our explosions (ddplay.js's ddBlast, as any object with hp; ddWreck hands it to dcCheckWreck).
function dcSlits(){const C=dd.dc,c=DCA.check;return C.slits||(C.slits=[-24,0,24].map((dx,i)=>({x:c.x+c.w/2+dx,y:c.y+c.h+3,t:2+i*.6})));}
function dcSlitTick(dt){
  const C=dd.dc,co=objs.find(o=>o.tag==='check');if(!co||co.gone)return;const P=DCA.slit;
  // (Version 234, Bryan: "It should open up and be exposed a little bit more") it breaks open as it's hit: a third of the way a hole is blown in
  // its front and the gun behind it is gone; two thirds, a second hole and half the roof off, and another gun gone
  const st=co.hp<=DCA.checkHp/3?2:co.hp<=DCA.checkHp*2/3?1:0;while((co.breach||0)<st)dcCheckBreach(co,co.breach=(co.breach||0)+1);
  if(!C.cpGo||C.cpOurs)return;   // (Version 254: its guns are manned only from the push on it until it's taken; until then its men were out in the waves)
  for(const s of dcSlits()){if(s.out||(s.t-=dt)>0)continue;s.t=P.every[0]+Math.random()*(P.every[1]-P.every[0]);
    let best=null,bd=P.range;for(const u of[...players,...dd.npcs]){if(!alive(u)||u.y<s.y+10)continue;const d=hyp(u.x-s.x,u.y-s.y);if(d<bd&&Math.abs(u.x-s.x)<d*.85&&los(s.x,s.y+6,u.x,u.y)){bd=d;best=u;}}
    if(!best){s.t=.5;continue;}
    const cv=coverAt(best.x,best.y,s.x,s.y),k=cv>=2?.4:cv>=1?.65:1,p=clamp(P.hit*(1-bd/(P.range*1.25))*k,.05,.4);
    for(let r=0;r<P.rounds;r++){const hit=Math.random()<p,tx=best.x+(hit?0:(Math.random()-.5)*26),ty=best.y+(hit?0:(Math.random()-.5)*26);tracers.push({x1:s.x,y1:s.y,x2:tx,y2:ty,t:-r*.07,col:'255,140,100'});
      if(hit)damage(best,P.dmg[0]+Math.random()*(P.dmg[1]-P.dmg[0]),null);}
    best.sup=Math.min(1,(best.sup||0)+.1);best.firedOnT=simT;if(typeof ddSpark==='function')ddSpark(s.x,ddH(s.x,s.y)+17,s.y,1);
    try{if(typeof sfxShotDD==='function')sfxShotDD({x:s.x,y:s.y,side:'E',id:'SL'+s.x,weapon:'mg',gunner:true});}catch(e){}}
}
function dcCheckBreach(o,n){
  const T=THREE,c=DCA.check,S=dcSlits(),sl=S[n===1?2:0],g0=ddH(sl.x,sl.y),dark=new T.MeshStandardMaterial({color:0x121110,roughness:1}),rub=new T.MeshStandardMaterial({color:0x8a8478,roughness:1,flatShading:true}),G=o.meshes&&o.meshes[0]&&o.meshes[0].parent||scene;
  sl.out=true;const add=(geo,m,x,h,z,r)=>{const q=new T.Mesh(geo,m);q.position.set(x,g0+h,z);if(r)q.rotation.set(r,r*1.7,r*.6);q.castShadow=true;G.add(q);(o.meshes||(o.meshes=[])).push(q);return q;};
  // the hole: dark, ragged, floor to roof, a little proud of the wall so it reads as the inside; rubble spilled out in front of it
  for(const[dx,w,h,y]of[[0,20,22,11],[-11,7,15,9],[11,8,17,10],[-4,12,5,24],[6,9,4,25]])add(new T.BoxGeometry(w,h,1.6),dark,sl.x+dx,y,c.y+c.h+.9);
  for(let k=0;k<11;k++){const r=1.6+((k*7)%5)*.7;add(new T.DodecahedronGeometry(r,0),rub,sl.x-13+((k*37)%27),r*.6,c.y+c.h+5+((k*13)%15),k*.7);}
  for(let k=0;k<2;k++)booms.push({x:sl.x+(k?8:-6),y:sl.y+2,t:-k*.12,size:1.1});tankFires.push({x:sl.x,y:sl.y-8,r:6,t0:simT,puffs:[],emit:0});shake(.7);
  if(n===2&&o.roof){o.roof.scale.x=.56;o.roof.position.x+=c.w*.2;o.roof.rotation.z=-.07;const cx=c.x+c.w*.24,cy=c.y+c.h/2;add(new T.BoxGeometry(c.w*.42,1.5,c.h-6),dark,cx,26.6,cy);   // half the roof off: you see down into it
    const slab=add(new T.BoxGeometry(c.w*.36,5,c.h*.7),new T.MeshStandardMaterial({color:0x7d8076,roughness:.95}),c.x-16,6,cy+6);slab.rotation.set(.1,.3,1.05);}
  dd.killed=(dd.killed||0)+1;banner(n===1?'The blockhouse is breached. One of its guns is out.':'The blockhouse is breaking up. One gun left.',2800);
}
function dcCheckWreck(o){
  const C=dd.dc;C.checkDead=true;const cx=o.x+o.w/2,cy=o.y+o.h/2;for(const sl of dcSlits())sl.out=true;
  // (Version 235, Bryan: "Make it look better destroyed, it just looks like it loses color") the building comes down: what stood is taken away and
  // a ruin is built in its place: broken wall stubs of uneven height round its footprint, the roof fallen in as three cracked slabs, a mound of
  // rubble inside and spilling out of the front, bent reinforcing bars, charred beams, fire and smoke
  const T=THREE,G=o.meshes&&o.meshes[0]&&o.meshes[0].parent||scene,g0=ddH(cx,cy),r=rng(235),old=o.meshes||[];for(const m of old)m.visible=false;o.meshes=[];
  const wallM=(typeof ddgMat==='function'?ddgMat('stone'):new T.MeshStandardMaterial({color:0x9a9482})).clone();wallM.color=new T.Color(0x6a6458);if(typeof ddLinClone==='function'){}
  const soot=new T.MeshStandardMaterial({color:0x3a3632,roughness:1}),slabM=new T.MeshStandardMaterial({color:0x44463f,roughness:.95}),rub=[0x5e594f,0x4a463e,0x38342e,0x6c665a].map(c=>new T.MeshStandardMaterial({color:c,roughness:1,flatShading:true})),bar=new T.MeshStandardMaterial({color:0x2a2420,roughness:.6,metalness:.6}),beam=new T.MeshStandardMaterial({color:0x1c1814,roughness:1});
  const add=(geo,m,x,h,z,rx,ry,rz)=>{const q=new T.Mesh(geo,m);q.position.set(x,g0+h,z);q.rotation.set(rx||0,ry||0,rz||0);q.castShadow=q.receiveShadow=true;G.add(q);o.meshes.push(q);return q;};
  // wall stubs: each side cut into pieces, the front lowest (it took the blasts), corners standing tallest
  const side=(x0,z0,x1,z1,lo,hi)=>{const L=hyp(x1-x0,z1-z0),n=Math.max(3,Math.round(L/11)),ew=Math.abs(x1-x0)>Math.abs(z1-z0);for(let k=0;k<n;k++){const t=(k+.5)/n,edge=Math.min(t,1-t)*2,h=Math.max(2.5,(lo+(hi-lo)*r())*(1.25-edge*.75));if(r()<.14)continue;
      const w=L/n-.3-r()*1.2,q=add(new T.BoxGeometry(ew?w:3.2,h,ew?3.2:w),r()<.3?soot:wallM,x0+(x1-x0)*t,h/2,z0+(z1-z0)*t,(r()-.5)*.08,0,(r()-.5)*.1);
      if(r()<.5)add(new T.BoxGeometry(ew?w*.5:3.2,2+r()*3,ew?3.2:w*.5),wallM,q.position.x+(ew?(r()-.5)*w*.4:0),h+1,q.position.z+(ew?0:(r()-.5)*w*.4),0,0,(r()-.5)*.3);}};
  side(o.x,o.y+o.h,o.x+o.w,o.y+o.h,3,10);side(o.x,o.y,o.x+o.w,o.y,10,24);side(o.x,o.y,o.x,o.y+o.h,6,20);side(o.x+o.w,o.y,o.x+o.w,o.y+o.h,6,18);
  // the roof, fallen in: one slab leaning against the back wall, one flat on the rubble, one tipped out over the front
  add(new T.BoxGeometry(o.w*.5,4,o.h*.6),slabM,cx-o.w*.18,11,cy-o.h*.12,.5,.15,.08);add(new T.BoxGeometry(o.w*.42,4,o.h*.5),slabM,cx+o.w*.2,6,cy+2,-.12,-.3,.14);add(new T.BoxGeometry(o.w*.36,4,o.h*.42),slabM,cx+4,5,cy+o.h*.5+7,-.6,.2,-.1);
  // rubble: heaped inside, spilling through the front
  for(let k=0;k<46;k++){const out=k>30,x=cx+(r()-.5)*o.w*(out?1.1:.86),z=out?o.y+o.h+2+r()*20:cy+(r()-.5)*o.h*.8,sz=1.6+r()*3.4,h=out?sz*.5:2+r()*6*(1-Math.abs(x-cx)/(o.w*.55));add(new T.DodecahedronGeometry(sz,0),rub[(r()*4)|0],x,h,z,r()*3,r()*3,r()*3);}
  for(let k=0;k<9;k++){const x=cx+(r()-.5)*o.w*.8,z=cy+(r()-.5)*o.h*.7,l=8+r()*12;add(new T.CylinderGeometry(.3,.3,l,4),bar,x,l/2+2,z,(r()-.5)*.9,0,(r()-.5)*.9);}
  for(let k=0;k<4;k++)add(new T.BoxGeometry(2.4,2.4,26+r()*16),beam,cx+(r()-.5)*o.w*.6,7+r()*6,cy+(r()-.5)*o.h*.4,(r()-.5)*.7,r()*3,(r()-.5)*.4);
  for(let k=0;k<5;k++)booms.push({x:cx+(Math.random()-.5)*o.w,y:cy+(Math.random()-.5)*o.h,t:-k*.14,size:1.4});
  tankFires.push({x:cx-10,y:cy,r:o.w/4,t0:simT,puffs:[],emit:0},{x:cx+18,y:cy+6,r:o.w/6,t0:simT,puffs:[],emit:0});if(typeof paintDecal==='function')for(let k=0;k<3;k++)paintDecal({k:'scorch',x:cx+(k-1)*26,y:cy+10+(k%2)*14,r:Math.random()});
  dd.killed=(dd.killed||0)+1;shake(1.2);if(typeof sfxBoom==='function')sfxBoom(cx,cy,1.6);banner('Their blockhouse comes down. Its machine guns are silent.',3200);
}
function dcArtLand(){
  const C=dd.dc,L=C.artLand;if(!L||!L.length)return;const co=objs.find(o=>o.tag==='check');
  for(let i=L.length-1;i>=0;i--){if(simT<L[i].at)continue;const h=L.splice(i,1)[0];if(!co||co.gone)continue;co.artHits=(co.artHits||0)+1;co.hp=Math.min(co.hp,DCA.checkHp*(1-co.artHits/3));
    if(co.hp<=0)ddWreck(co,h.by);else banner(`Direct hit on the blockhouse. ${3-co.artHits} more.`,2200);}
}
function dcGunsTick(dt){
  dcFixTick(dt);dcArtLand();dcSlitTick(dt);
  const C=dd.dc,foes=enemies.filter(e=>!beaten(e)&&!e.air),tanks=ddTanksUp();   // (not the helicopter's gunner: a shell bursts on the ground)
  for(const p of dd.allies||[]){const on=!!(p.dcGun&&p.dcGun.man===p);if(on&&!p.dug){p.dug=1;p.dmgIn=(p.dmgIn||1)*DCA.dug;}else if(!on&&p.dug){p.dug=0;p.dmgIn=(p.dmgIn||1)/DCA.dug;}}   // (behind his gun's bags)
  for(const sh of C.shells.slice())if(simT>=sh.at){C.shells.splice(C.shells.indexOf(sh),1);for(const g of C.guns)if(hyp(sh.x-g.x,sh.y-g.y)<DCA.gunHit)dcGunHit(g,sh.D||DCA.hv.shell);}
  if(C.focus&&beaten(C.focus))C.focus=null;if(C.focusK&&!(C.focusK.hp>0))C.focusK=null;
  for(const n of nades)if(n.tk&&n.tk.hp>0){n.x1=n.tk.x;n.y1=n.tk.y;}   // (Version 247: a shell aimed at a tank from behind the gun lands on the tank, wherever it has got to)
  for(const g of C.guns){if(g.off)continue;   // (Version 254: their checkpoint's light guns while it isn't ours)
    if(g.hits&&(g.smokeT-=dt)<=0&&DD.rk&&DD.rk.puff){g.smokeT=g.hits>=2?.11:.22;const h=ddH(g.x,g.y)+(g.t==='art'?16:12);   // one hit: thin grey smoke; two: thick and dark; wrecked: black
      DD.rk.puff(g.x+(Math.random()-.5)*8,h,g.y-8+(Math.random()-.5)*8,g.hits>=2?7+Math.random()*4:4+Math.random()*2.5,g.hits>=2?3.4:2.4,g.hits>=3?0x161514:g.hits===2?0x2b2927:0x9a9690,g.hits>=2?13:9);}
    if(g.dead)continue;
    const m=g.man;if(m&&alive(m)&&m.dcGun===g&&m.path.length){m.path=[];m.x=dcSeat(g).x;m.y=dcSeat(g).y;}   // (he stays on it: only LEAVE GUN, or a tap that sends him to another gun, takes him off: Version 224)
    if(m&&alive(m)&&m.dcGun===g&&g.t==='mg'&&!m.onGun)dcGunOn(g,m,m.ang);   // (Version 255: his hands back on it, see dcGunOn)
    if(m&&alive(m)&&m.dcGun===g){   // (Version 254: what hits its man goes to the gun first, dcShield from combat.js's damage; it was half of what hurt him, worked out here)
      if(g.t==='mg'&&!m.fp){if(C.focus&&m.focus!==C.focus)m.focus=C.focus;   // (every gun on the one the player put his thumb on)
        const K=g.hv?(C.focusK||(simT-(m.shotAtT||-9)<1.5?null:tanks.filter(q=>!q.hold&&hyp(q.x-g.x,q.y-g.y)<DCA.hv.range&&q.y<g.y).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0])):null;
        if(K&&simT>=g.hvT&&hyp(K.x-g.x,K.y-g.y)<DCA.hv.range&&Math.abs(Math.atan2(Math.sin(Math.atan2(K.y-g.y,K.x-g.x)+Math.PI/2),Math.cos(Math.atan2(K.y-g.y,K.x-g.x)+Math.PI/2)))<g.arc){g.hvT=simT+DCA.hv.every;dcHvTank(K,1,m);m.ang=Math.atan2(K.y-g.y,K.x-g.x);m.aimT=simT;
          for(let q=0;q<4;q++)tracers.push({x1:g.x,y1:g.y-8,x2:K.x+(Math.random()-.5)*26,y2:K.y+(Math.random()-.5)*20,t:-q*.05,col:'255,231,163'});flashes.push({x:g.x,y:g.y-10,t:0});sparks.push({x:K.x,y:K.y,t:0});if(typeof sfxShotDD==='function')sfxShotDD(m);}}}
    if(m&&(!alive(m)||m.path.length||m.dcGun!==g)){dcOff(m);if(m.dcGun===g)m.dcGun=null;g.man=null;if(C.art===g)C.art=null;}
    const u=g.going;if(u){const s=dcSeat(g);if(!alive(u)||u.dcGun!==g||simT-g.goT>40)g.going=null;
      else if(!u.path.length){g.going=null;if(hyp(u.x-s.x,u.y-s.y)<16&&(!g.man||g.man.npc&&!u.npc))dcSit(g,u);else if(u.dcGun===g)u.dcGun=null;}}
    const mesh=DD.dcGuns&&DD.dcGuns[g.k];if(mesh&&mesh.userData.barrel){const k=mesh.userData.kick=Math.max(0,(mesh.userData.kick||0)-dt*2.5);mesh.userData.barrel.position.x=(mesh.userData.barrel.userData.rest??30)-k*9;}
    if(g.t!=='art'||!g.man||simT<g.fireT||C.ph==='setup'||C.ph==='intro')continue;
    if(g.man.fp)continue;   // (the player is behind it: it fires when he does, ddfp.js)
    if(g.aim){dcFire(g,g.aim.x,g.aim.y);continue;}
    {const fo=C.focusK?{x:C.focusK.x+Math.cos(C.focusK.ang)*30,y:C.focusK.y+Math.sin(C.focusK.ang)*30}:C.focus?{x:C.focus.x,y:C.focus.y}:null;   // (the one the player put his thumb on, first)
      if(fo){const d=hyp(fo.x-g.x,fo.y-g.y);if(d>DCA.art.min&&d<DCA.art.max&&!dd.allies.some(a=>hyp(a.x-fo.x,a.y-fo.y)<100)){dcFire(g,fo.x+(Math.random()-.5)*24,fo.y+(Math.random()-.5)*24);continue;}}}
    // (Version 254) the push on their checkpoint: the blockhouse, while it stands and no tank is in reach (three direct hits bring it down)
    {const co=C.cpGo&&!C.cpOurs&&objs.find(o=>o.tag==='check'&&!o.gone),c=DCA.check;if(co&&!tanks.some(K=>!K.hold&&hyp(K.x-g.x,K.y-g.y)<DCA.art.max)&&hyp(c.x+c.w/2-g.x,c.y+c.h/2-g.y)<DCA.art.max){dcFire(g,c.x+c.w/2,c.y+c.h/2);continue;}}
    // by itself: the nearest tank in reach, else where their men are thickest
    let best=null,bs=0;for(const K of tanks){const d=hyp(K.x-g.x,K.y-g.y);if(d>DCA.art.min&&d<DCA.art.max&&K.y>DCA.treeY-40){const s=900-d;if(s>bs){bs=s;best={x:K.x+Math.cos(K.ang)*30,y:K.y+Math.sin(K.ang)*30};}}}
    if(!best)for(const e of foes){const d=hyp(e.x-g.x,e.y-g.y);if(d<DCA.art.min||d>DCA.art.max||e.y<DCA.treeY-20)continue;const n=foes.filter(o=>hyp(o.x-e.x,o.y-e.y)<70).length;
      if(dd.allies.some(a=>hyp(a.x-e.x,a.y-e.y)<110))continue;if(n>bs){bs=n;best={x:e.x,y:e.y};}}
    if(best&&(bs>=2||tanks.length))dcFire(g,best.x+(Math.random()-.5)*36,best.y+(Math.random()-.5)*36);
  }
}
// the other troops (Version 254, Bryan: "Have the NPCs pushing forward to distract the enemy"). Each holds a spot on one of DCA.lines (u.ln, u.post;
// line 0 is his own spot on the wall, u.back). While a wave is on, a man in good shape moves up a line every 9 to 15 s when the spot he'd take isn't
// under their feet (none of theirs within 16 m of it, no tank within 30 m), so their men meet him first, out in the field, away from the guns; he
// drops back a line when they close on him (two within 14 m, one within 9 m, a tank within 25 m), and to the wall once he's hurt (under 45). In a
// rest they go up to the middle of the field. No further than the line short of the hedgerow, or their checkpoint once it's ours. On the push on
// the checkpoint they're dcStorm's. As before, one of them takes a gun the squads have left empty once no squad mate is free for it.
// (Until Version 254: out to a forward post as it started, back to the wall when theirs came within 26 m, and there for the rest of the fight)
const dcLineSpots=k=>k<=0?null:DCA.lines[Math.min(k,DCA.lines.length)-1];
function dcNpcSpot(u,k){   // the free spot on line k nearest him (one man a spot)
  if(k<=0)return u.back;const L=dcLineSpots(k);if(!L)return null;let b=null,bd=1e9;
  for(const[x,y]of L){if(dd.npcs.some(o=>o!==u&&alive(o)&&o.post&&o.post.x===x&&o.post.y===y))continue;const d=hyp(x-u.x,y-u.y);if(d<bd){bd=d;b={x,y};}}
  return b;
}
const dcNpcSafe=s=>!enemies.some(e=>!beaten(e)&&!e.air&&hyp(e.x-s.x,e.y-s.y)<160)&&!dd.tanks.some(K=>K.hp>0&&!K.hold&&hyp(K.x-s.x,K.y-s.y)<DCA.npcTank[1]);
function dcNpc(){
  const C=dd.dc,fight=/^w/.test(C.ph),rest=C.ph==='lull'||C.ph==='push',maxL=C.cpOurs?4:3;
  for(const u of dd.npcs){if(!alive(u)||u.dcGun||!u.back||u.seqHop)continue;
    if(u.cpGo){dcStorm(u);continue;}
    if(u.ln==null)u.ln=u.post&&u.post!==u.back?1:0;const P=u.post||u.back;
    const close=enemies.filter(e=>!beaten(e)&&!e.air&&hyp(e.x-P.x,e.y-P.y)<140),tank=!(u.spec==='rpg'&&u.specN>0)&&dd.tanks.some(K=>K.hp>0&&!K.hold&&hyp(K.x-P.x,K.y-P.y)<DCA.npcTank[0]);   // (Version 255: a bazooka man holds for a tank: it's his)
    let k=u.ln;
    if(u.hp<(u.ln===4?35:45))k=u.ln===4?2:0;                                                                          // hurt: back to the wall (from the checkpoint, to the middle of the field)
    else if(k>0&&k<4&&(close.length>=2||close.some(e=>hyp(e.x-P.x,e.y-P.y)<90)||tank)){k=u.ln-1;u.advT=simT+8;}       // they're on him: back a line (at their checkpoint he holds: they fight for it)
    else if(simT>(u.advT||0)&&C.ph!=='intro'&&C.ph!=='setup'){
      const want=fight?maxL:C.cpOurs?4:2;
      if(u.ln<want){const s=dcNpcSpot(u,u.ln+1);if(s&&dcNpcSafe(s))k=u.ln+1;}
      u.advT=simT+(fight?9+Math.random()*6:2+Math.random()*2);}
    if(k!==u.ln){const s=dcNpcSpot(u,k);if(s){u.ln=k;u.post=s;u.hopT=0;}}
    if(!u.path.length&&hyp(u.x-u.post.x,u.y-u.post.y)>24&&simT>(u.hopT||0)){const p=findPath(u.x,u.y,u.post.x,u.post.y);if(p)u.path=p;u.hopT=simT+4;}}
  if(C.ph==='intro'||C.ph==='setup')return;
  // their light guns at the checkpoint once they're ours: one of the other troops up there takes each (a tap on its tile sends a squad mate instead)
  for(const g of C.guns){if(!g.cp||g.off||g.man||g.going||g.dead)continue;
    const u=dd.npcs.filter(n=>alive(n)&&!n.dcGun&&n.ln>=3).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(u)dcMan(u,g);}
  if(dcFreeMen().length)return;   // (a squad mate is free: the gun waits for the player's tap)
  for(const g of C.guns){if(g.man||g.going||g.dead||g.off||g.cp)continue;
    const free=dd.npcs.filter(u=>alive(u)&&!u.dcGun&&!u.cpGo).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(free)dcMan(free,g);}
}

/* ---------- their checkpoint (Version 254) ----------
   Bryan: "At the end of Wave 2, have NPC soldiers run to the second checkpoint, with the lead NPC saying Move Forward!! Take the checkpoint ahead!!
   After that, show an objective highlight over the checkpoint base to capture"; his plan for this map (after Version 230): "an advance choke point
   ... Troops will stop regenerating from there making it somewhat easier. The enemy will then fight for that. Losing it would just push back the
   player". After wave 2, and after any later wave while it isn't ours, the other troops go (the squad stays on its guns: the game is the guns): the
   one out in front (Sgt. Kane) shouts it, and they run (dcStorm: up to the line short of the hedgerow, then into it, round their light guns and the
   blockhouse). It has men in it now (dcGarrison: a man at each of their two light guns, turned on us, five round the blockhouse, and its slits' guns
   firing while it stands): the field gun, left to itself, shells the blockhouse. Taken (dcCpTick: ours in DCA.cz, none of theirs, DCA.capT s): its
   slits silent, their light guns turned round and ours (FORWARD MG 1 and 2 in the row, the other troops up there on them until a tap sends a squad
   mate), none of their next waves come out of it, and nearly half of each wave goes for it first (dcEnemy). Theirs again (theirs in it and none of
   ours, DCA.loseT s): its light guns lost, our men up there back, and the push again after the wave. */
function dcGarrison(){
  const C=dd.dc;if((C.garr||[]).some(e=>!beaten(e)))return;C.garr=[];
  for(const g of C.guns)if(g.cp&&g.dead)dcGunUp(g,g.hp0);   // (their light guns working again for their own men, if we'd knocked them out)
  DCA.eguns.forEach((e,i)=>{const u=ddFoe('cp',e.x-DDX,e.y-6,{name:'Machine gunner',gunner:true,post:true,ang:Math.PI/2});u.onGun={x:e.x,y:e.y,ang:Math.PI/2,arc:1.1};enemies.push(u);C.garr.push(u);
    const m=DD.dcEGuns&&DD.dcEGuns[i];if(m&&!m.userData.real)m.rotation.y=-Math.PI/2;});   // (their light guns turned on us: they pointed at the beach)
  for(const[x,y]of DCA.garr){const u=ddFoe('cp',x-DDX,y,{post:true,ang:Math.PI/2,nade:Math.random()<.4?1:0});enemies.push(u);C.garr.push(u);}
  C.spawned+=C.garr.length;
}
function dcPushStart(){
  const C=dd.dc;C.pushOn=true;C.cpGo=true;C.capT=0;C.pushT0=simT;dcGarrison();
  const go=dd.npcs.filter(u=>alive(u)&&!u.dcGun);for(const u of go){u.cpGo=true;u.stormSt=null;}
  // the one out in front leads it
  const lead=go.filter(u=>u.hp>=60).sort((a,b)=>a.y-b.y)[0]||go[0];
  if(lead){C.lead=lead;lead.name='Sgt. Kane';lead.lead=true;bubble(lead,C.lost?'Move Forward!! Take the checkpoint back!!':'Move Forward!! Take the checkpoint ahead!!','#ff6a3d',5200);}
}
// one of the other troops on the push: up to the line short of the hedgerow, then on into the checkpoint, where he stays and fights; hurt (under 35)
// he drops out and goes back
function dcStormSpot(u){
  let b=null,bd=1e9;for(const[x,y]of DCA.storm){const n=dd.npcs.filter(o=>o!==u&&alive(o)&&o.stormTo&&o.stormTo.x===x&&o.stormTo.y===y).length;if(n>=2)continue;
    const d=hyp(x-u.x,y-u.y)+n*90;if(d<bd){bd=d;b={x,y};}}
  return b||{x:DCA.storm[0][0],y:DCA.storm[0][1]};
}
function dcStorm(u){
  const C=dd.dc;if(!C.cpGo||C.cpOurs){u.cpGo=false;return;}
  if(u.hp<35){u.cpGo=false;u.stormSt=null;u.stormTo=null;u.ln=0;u.post=u.back;u.hopT=0;return;}
  if(u.stormSt==null){const L=DCA.lines[2],q=L.reduce((b,q)=>hyp(q[0]-u.x,q[1]-u.y)<hyp(b[0]-u.x,b[1]-u.y)?q:b,L[0]);
    u.stormSt=0;u.stormTo=dcNpcSpot(u,3)||{x:q[0],y:q[1]};u.post=u.stormTo;u.ln=3;u.stormT=simT+3+Math.random()*5;u.hopT=0;}
  const T=u.stormTo,there=hyp(u.x-T.x,u.y-T.y)<40;
  if(u.stormSt===0&&simT>u.stormT&&(there||!u.path.length&&simT>u.stormT+6)){u.stormSt=1;u.stormTo=dcStormSpot(u);u.post=u.stormTo;u.hopT=0;}
  if(!u.path.length&&hyp(u.x-T.x,u.y-T.y)>20&&simT>(u.hopT||0)){const p=findPath(u.x,u.y,u.stormTo.x,u.stormTo.y);if(p&&p.length)u.path=p;u.hopT=simT+3;}
}
function dcCpTick(dt){
  const C=dd.dc;if(!C.cpGo&&!C.cpOurs)return;const Z=DCA.cz;
  const theirs=enemies.filter(e=>!beaten(e)&&!e.onTank&&!e.air&&dcIn(e,Z)).length,ours=(dd.allies||[]).filter(u=>alive(u)&&dcIn(u,Z)).length;C.czN=[ours,theirs];
  if(!C.cpOurs){if(!C.pushOn)return;if(ours&&!theirs){C.capT+=dt;if(C.capT>=DCA.capT)dcCpTaken();}else C.capT=Math.max(0,C.capT-dt*(theirs?2:.5));}
  else{if(theirs&&!ours){C.capT+=dt;if(C.capT>=DCA.loseT)dcCpLost();}else C.capT=Math.max(0,C.capT-dt*2);}
}
function dcCpTaken(){
  const C=dd.dc;C.cpOurs=true;C.cpGo=false;C.pushOn=false;C.capT=0;C.cpAt=simT;C.lost=false;
  bigText('Checkpoint taken','complete');banner('The checkpoint is ours. Their two light guns are turned on the woods.',3800);
  DCA.eguns.forEach((e,i)=>{const k='c'+(i+1);let g=C.guns.find(q=>q.k===k);
    if(!g){g={k,n:'FORWARD MG',sub:String(i+1),x:e.x,y:e.y,t:'mg',arc:1.2,hp:420,hp0:420,cp:1,man:null,going:null,fireT:0,orderT:-99,aim:null,hits:0,dead:false,smokeT:0,hvT:0};C.guns.push(g);}
    g.off=false;const m=DD.dcEGuns&&DD.dcEGuns[i];if(m){if(!m.userData.real)m.rotation.y=Math.PI/2;DD.dcGuns[k]=m;}
    if(g.dead)dcGunUp(g,g.hp0);else{g.hp=g.hp0;g.hits=0;}});   // (taken again: whatever we knocked out, their men had working)
  for(const u of dd.npcs)if(alive(u)&&u.cpGo){u.cpGo=false;u.stormSt=null;u.stormTo=null;u.ln=4;u.post=dcNpcSpot(u,4)||dcNpcSpot(u,3)||u.back;u.hopT=0;}
  dcNpc();if(C.ph==='push'){C.ph='lull';C.t=0;C.rest=DCA.lull;}
}
function dcCpLost(){
  const C=dd.dc;C.cpOurs=false;C.capT=0;C.lost=true;
  banner('They have taken the checkpoint back. Fall back!',3800);
  for(const g of C.guns)if(g.cp){if(g.man)dcLeave(g);if(g.going){g.going.dcGun=null;g.going=null;}g.off=true;const m=DD.dcEGuns&&DD.dcEGuns[+g.sub-1];if(m&&!m.userData.real)m.rotation.y=-Math.PI/2;}
  if(dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.cp&&typeof fpExit==='function')fpExit();
  for(const u of players)if(alive(u)&&!u.dcGun&&dcIn(u,DCA.cz)){const s=DCA.hold[(players.indexOf(u))%DCA.hold.length],p=findPath(u.x,u.y,s[0],s[1]);if(p){u.path=p;u.lastOrder=simT;}}
  for(const u of dd.npcs)if(alive(u)&&u.ln>=3){u.ln=2;u.post=dcNpcSpot(u,2)||u.back;u.hopT=0;}
}

/* ---------- the enemy ---------- */
// a lot of their men for wave n: out of the woods along the whole front, some of them out of their checkpoint while it's theirs and nobody's
// pushing on it; with it ours, most go for it first (cpAtt: dcEnemy), the rest down the flanks round it
function dcSpawnLot(n,count){
  const C=dd.dc,tag='w'+n,fromCp=!C.cpOurs&&!C.cpGo?Math.round(count*DCA.cpFrom):0,L=[];
  for(let i=0;i<count;i++){let x,y,lane;
    if(i<fromCp){x=704+Math.random()*70;y=-352-Math.random()*16;lane=520+Math.random()*360;}
    else{lane=250+(i/Math.max(1,count-1))*720+(Math.random()-.5)*30;x=lane+(Math.random()-.5)*30;y=-600-Math.random()*100;}
    const e=ddFoe(tag,x-DDX,y,{ang:Math.PI/2,nade:i%5===0?1:0});e.lane=lane;e.stage=-1;e.smk=i%DCA.smk.every===2?1:0;   // (Version 255: a smoke grenade, dcEnemySmoke)
    if(C.cpOurs){if(Math.random()<DCA.cpAtt)e.cpAtt=1;else e.lane=e.lane<DCA.road?250+Math.random()*190:870+Math.random()*100;}
    enemies.push(e);L.push(e);}
  C.spawned+=count;return L;
}
function dcSpawnWave(n){
  const C=dd.dc,W=DCA.waves[n-1],tag='w'+n;if(!W)return;C.more=0;
  if(n>1)dcSpawnLot(n,W.inf);   // (wave 1's men are on the road already: enterCounter)
  for(const e of enemies)if(e.tag===tag){e.cool=Math.min(e.cool,1+Math.random()*2);e.stage=0;e.advT=simT+Math.random()*3;e.gait=null;}
  (W.tanks||[]).forEach((k,i)=>{const at=DCA.tankAt[k]||DCA.tankAt.road,K=ddTankSpawn({x:at[0],y:at[1],ang:.4,hold:true,way:DCA.ways[k],name:'Tank',range:DCA.tankR});K.w=n;K.relT=simT+i*7;K.hp=K.hp0=DCA.tankHp;});
  for(let i=0;i<(W.helis||0);i++)dcHeliSpawn(n,simT+DCA.heli.first+i*DCA.heli.next);   // (Version 255)
  const tk=W.tanks?W.tanks.length:0,hl=W.helis||0,what=[tk?(tk>1?tk+' tanks':'a tank'):'',hl?(hl>1?hl+' helicopters':'a helicopter'):''].filter(Boolean).join(' and ');
  if(n>1){bigText(`Wave ${n}`,'inbound');banner(what?`Wave ${n} of ${DCA.waves.length}: ${what} with them.`:`Wave ${n} of ${DCA.waves.length}.`,3200);}
  else banner(what?`Here they come: infantry across the whole field, ${what} behind them.`:'Here they come: infantry across the whole field.',3600);
}
function dcSpawnMore(n){const W=DCA.waves[n-1];if(!W||!W.more)return;for(const e of dcSpawnLot(n,W.more)){e.stage=0;e.advT=simT+Math.random()*3;e.cool=1+Math.random()*2;}}
// each man works his way down the field in bounds: the hedgerow, the open ground, the trench, the wire, then the gate and the command post
const DC_STAGE=[-96,90,240,430];
function dcEnemy(){
  const C=dd.dc,taken=enemies.filter(o=>!o.dead&&!o.air).map(destOf),Z=DCA.cz;
  for(const e of enemies){if(beaten(e)||e.stage==null||e.stage<0||e.path.length||simT<(e.advT||0))continue;
    if(e.sup>.7){e.advT=simT+1.5;continue;}
    let tx,ty;const st=e.stage;
    if(e.cpAtt&&C.cpOurs&&st<=1){   // (Version 254: their checkpoint is ours: into it, and they keep at it until it's theirs again)
      tx=Z.x0+30+Math.random()*(Z.x1-Z.x0-60);ty=Z.y0+14+Math.random()*130;const s=openSpot(tx,ty,taken)||{x:tx,y:ty},p=findPath(e.x,e.y,s.x,s.y,FOOT);
      if(p&&p.length){e.path=p;e.zone={x0:s.x-110,x1:s.x+110,y0:s.y-90,y1:s.y+90};e.stage=1;e.advT=simT+5+Math.random()*5;}else e.advT=simT+2;continue;}
    if(st<DC_STAGE.length){ty=DC_STAGE[st]+(Math.random()-.5)*40;const pull=st/DC_STAGE.length;tx=e.lane+(DCA.road-e.lane)*pull*.75+(Math.random()-.5)*50;}
    else if(st===DC_STAGE.length){tx=DCA.road+(Math.random()-.5)*70;ty=DCA.wallY+50+Math.random()*30;}
    else{tx=DCA.flag.x+(Math.random()-.5)*90;ty=DCA.flag.y+(Math.random()-.5)*60;}   // (the flag)
    const s=openSpot(clamp(tx,DCA.x0+30,DCA.x1-30),ty,taken)||{x:tx,y:ty},p=findPath(e.x,e.y,s.x,s.y,FOOT);
    if(p&&p.length){e.path=p;e.zone={x0:s.x-110,x1:s.x+110,y0:s.y-90,y1:s.y+90};e.stage=Math.min(st+1,DC_STAGE.length+1);e.advT=simT+(st>=DC_STAGE.length?2:3.5+Math.random()*4.5);}
    else e.advT=simT+2;}
  dcEnemySmoke();
  // mortars (from wave 3): a shell now and then on a manned nest
  const W=DCA.waves[C.wave-1];
  if(W&&W.mortar&&/^w/.test(C.ph)&&simT>(C.mortT||0)){C.mortT=simT+11+Math.random()*6;const L=C.guns.filter(g=>g.k[0]==='n'&&g.man&&!g.dead);if(L.length){const g=L[(Math.random()*L.length)|0],mx=g.x+(Math.random()-.5)*56,my=g.y+(Math.random()-.5)*56;ddShell({x:g.x+(Math.random()-.5)*300,y:DCA.treeY-200,side:'E',name:'Mortar',stats:{}},mx,my,44,62,2.4);C.shells.push({x:mx,y:my,at:simT+2.4,D:DCA.hv.mortar});}}
}
// (Version 255, Bryan: "Enemy units are equipped with smoke") a man with a smoke grenade, out past the hedgerow and close to a gun of ours (or
// pinned down further off), throws it toward the nearest manned gun, so he and those behind him come on behind it (combat.js's popSmoke as it
// lands: nobody sees through it, our guns neither); one every few seconds across the whole field, never onto smoke already there
function dcEnemySmoke(){
  const C=dd.dc;if(!/^w/.test(C.ph)||simT<(C.smkT||0))return;const guns=C.guns.filter(g=>!g.dead&&!g.off&&g.man);if(!guns.length)return;
  for(const e of enemies){if(!e.smk||beaten(e)||e.air||e.onTank||e.stage==null||e.stage<2)continue;
    const g=guns.reduce((b,q)=>hyp(q.x-e.x,q.y-e.y)<hyp(b.x-e.x,b.y-e.y)?q:b),d=hyp(g.x-e.x,g.y-e.y);if(d>520||d<120||(e.sup<.3&&d>380))continue;
    const k=Math.min(SMOKE.range*.85,d*.55)/d,tx=e.x+(g.x-e.x)*k,ty=e.y+(g.y-e.y)*k;
    if(smokes.some(c=>hyp(c.x-tx,c.y-ty)<SMOKE.r*1.6)||nades.some(n=>n.smoke&&hyp(n.x1-tx,n.y1-ty)<SMOKE.r*1.6))continue;
    e.smk=0;e.ang=Math.atan2(ty-e.y,tx-e.x);e.aimT=simT;e.throwT=simT;e.advT=Math.min(e.advT||0,simT+1.4);
    nades.push({x0:e.x,y0:e.y,x1:tx,y1:ty,t:0,dur:.9,by:e,smoke:true});if(typeof sfxPin==='function')sfxPin(e.x,e.y);
    C.smkT=simT+DCA.smk.gap[0]+Math.random()*(DCA.smk.gap[1]-DCA.smk.gap[0]);C.smkN=(C.smkN||0)+1;return;}
}
// (Version 255, Bryan: "NPC can have rocket launchers (if that's there class)") one of the other troops made a bazooka man: the launcher on him,
// rockets made up between waves (dcNpcTopUp); he fires at a tank by himself (ddvillage.js's vgBazooka, from dcTick)
function dcBzMan(u){u.spec='rpg';u.specN=DCA.bz.n;u.bzT=0;u.bzAim=null;if(typeof figRefresh==='function'&&u.m)figRefresh(u);}
// (Version 255) the last one or two of a wave out of every gun's reach (in the trees, round the blockhouse) once its tanks and helicopters are
// gone: 25 s with nobody of theirs down and they fall back into the woods, and the wave is over. In a test a wave waited 400 s on one man
function dcStragglers(n,all){
  const C=dd.dc,L=enemies.filter(e=>e.tag==='w'+n&&!beaten(e));
  if(!all||L.length>2||dd.tanks.some(K=>K.w===n&&K.hp>0)||(C.helis||[]).some(H=>H.w===n&&H.hp>0)){C.strT=null;return;}
  const k=L.length;if(C.strT==null||C.strN!==k){C.strT=simT;C.strN=k;return;}
  if(simT-C.strT<25)return;for(const e of L){e.dead=true;e.gone=true;e.hp=0;e.path=[];}C.strT=null;banner(k>1?'The last of them fall back into the woods.':'The last of them falls back into the woods.',2600);
}
// (Version 255) a tank at the end of its road with nothing in its sights for DCA.tankRoll s rolls on onto the ground in front of the command post
// (DCA.cpZone, where it counts for the flag's clock). The roads end just short of it: in a test fight, with every gun knocked out and the last man
// out of their sight, two tanks sat there for the rest of it and the fight could be neither won nor lost. Its shot put back (ddTankHold) or a
// shot fired starts the clock again
function dcTankRoll(){
  for(const K of dd.tanks){if(K.hp<=0||K.hold||K.rolled||!K.way||K.i<K.way.length)continue;
    if(K.endT==null||K.fireT!==K.ft0){K.endT=simT;K.ft0=K.fireT;continue;}
    if(simT-K.endT<DCA.tankRoll)continue;
    K.rolled=true;K.way.push([700+(((K.id.charCodeAt(K.id.length-1)||0)%3)-1)*40,505]);if(!dd.dc.rollSaid){dd.dc.rollSaid=1;banner('A tank rolls up to the gate!',3000);}}
}
// a man lost, and somebody in the reserve: he comes out of the barracks for him
function dcReplace(){   // (Version 224, Bryan: "No reinforcements this time": nobody comes out of the barracks for a man lost)
  for(const q of dd.queue)if(q.body)q.body.noRev=true;dd.queue.length=0;dd.pool=0;
}
function dcNoRe(){let el=$('#dcNoRe');if(!el){el=document.createElement('div');el.id='dcNoRe';el.textContent='NO REINFORCEMENTS';stage.appendChild(el);}el.classList.remove('on');void el.offsetWidth;el.classList.add('on');}

/* ---------- Version 255: helicopters ---------- */
// (Bryan, after Version 254: "two tanks and a helicopter on 5 ... three tanks and two helicopters on 7". Neither side flew one in a fight in
// 1944: a game's what-if, as he asked.) Each comes in over the trees after its wave has begun (DCA.heli.first s in, the next DCA.heli.next s
// later), circles over the field and every few seconds makes a run at one of our manned guns: two rockets at it from 20 to 44 m out (on a gun
// they count as a tank's shell does, dcGunHit; and they hurt whoever's near, combat.js's explode), then breaks away and circles again. Its door
// gunner is one of their men (ddFoe 'heli': a machine gunner, all round) carried with it (dcHeliCrew): he picks his own targets, from the air
// over walls and hedges (combat.js's fireLine, air), and our cover counts one step less from up there (shotCover). What hits him hits the
// helicopter (combat.js's damage -> dcHeliHit): a rifle a little, the nests' light guns more, the heavy gun most; nothing on the ground reaches it
// (explode leaves it out). Shot down it spins, smoking, falls and burns where it lands (dcHeliDown), hurting whoever's under it. It is one of
// its wave's (dcTick's left(), the objective's count) and its gunner one of ENEMY DOWN. Its sound: audio.js's 'heli' loop (dcHeliSound).
const dcHeliUp=()=>(dd&&dd.dc&&dd.dc.helis||[]).filter(H=>H.st!=='wait'&&H.st!=='dead'&&H.hp>0);
function dcHeliSpawn(n,at){
  const C=dd.dc,P=DCA.heli,L=C.helis||(C.helis=[]),k=L.length;
  const H={id:'HELI'+(k+1),w:n,hp:P.hp,hp0:P.hp,st:'wait',relT:at,x:360+((k*317)%600),y:-1050,alt:P.altIn,ang:Math.PI/2,turnR:0,sp:P.spd,dir:k%2?-1:1,t:0,runT:0,q:[],g:null,e:null,smokeT:0};
  L.push(H);return H;
}
// its door gunner, made when it comes in: one of their men, carried with it (and its weight on the report: one of ENEMY DOWN)
function dcHeliCrew(H){
  const P=DCA.heli,e=ddFoe('heli',H.x-DDX,H.y,{name:'Door gunner',gunner:true,post:true,ang:H.ang,longR:P.longR,aimPen:P.aimPen,nade:0});
  e.air=H;e.onGun={x:H.x,y:H.y,ang:H.ang,arc:Math.PI};e.alerted=true;e.elev=H.alt;H.e=e;if(!enemies.includes(e))enemies.push(e);dd.dc.spawned++;dcHeliPose(H);
}
function dcHeliPose(H){
  const e=H.e;if(!e||e.dead)return;const c=Math.cos(H.ang),s=Math.sin(H.ang);
  e.x=H.x+c*6-s*10;e.y=H.y+s*6+c*10;e.elev=Math.max(0,H.alt-8);e.path=[];e.onGun.x=e.x;e.onGun.y=e.y;e.onGun.ang=H.ang;e.alerted=true;e.revealT=Math.max(e.revealT||0,simT+.5);e.seen=true;
}
// a gun for a run: one of ours that's manned, the one the player is on now and then, else the nearest to where it is
function dcHeliPick(H){
  const L=dd.dc.guns.filter(g=>!g.dead&&!g.off&&g.man&&alive(g.man));if(!L.length)return null;
  const fp=L.find(g=>g.man.fp);if(fp&&Math.random()<.45)return fp;
  return L.sort((a,b)=>hyp(a.x-H.x,a.y-H.y)-hyp(b.x-H.x,b.y-H.y))[Math.random()<.6?0:Math.min(L.length-1,1)];
}
function dcHeliTick(dt){
  const C=dd.dc,L=C.helis;if(!L||!L.length)return;const P=DCA.heli,turn=(a,b,m)=>{const d=((b-a+Math.PI*3)%(Math.PI*2))-Math.PI;return a+clamp(d,-m,m);};
  for(const H of L){
    if(H.st==='dead'||H.st==='gone')continue;
    if(H.st==='wait'){if(simT<H.relT)continue;H.st='in';H.t=0;dcHeliCrew(H);
      bigText(L.filter(q=>q.st!=='wait').length>1?'Another helicopter':'Helicopter!','inbound');banner(C.heliSaid?'Another helicopter over the trees.':'A helicopter over the trees! The heavy MG tears it up.',3600);C.heliSaid=1;continue;}
    H.t+=dt;
    if(H.st==='crash'){dcHeliFall(H,dt);continue;}
    if((H.st==='orbit'||H.st==='brk')&&!H.q.length&&((H.runs||0)>=P.runs||simT-(H.onT??simT)>P.stay)){H.st='out';H.t=0;banner((H.runs||0)>=P.runs?'The helicopter has fired off its rockets and turns for home.':'The helicopter turns for home.',3000);}
    let tx,ty,alt=P.alt,sp=P.spd;
    if(H.st==='in'){const a=Math.atan2(H.y-P.c.y,H.x-P.c.x);tx=P.c.x+Math.cos(a)*P.r;ty=P.c.y+Math.sin(a)*P.r;alt=H.y<DCA.treeY?P.altIn:P.alt;
      if(hyp(tx-H.x,ty-H.y)<70){H.st='orbit';H.t=0;H.runT=simT+3+Math.random()*3;H.onT=H.onT??simT;}}
    else if(H.st==='orbit'){const a=Math.atan2(H.y-P.c.y,H.x-P.c.x)+H.dir*.55;tx=P.c.x+Math.cos(a)*P.r;ty=P.c.y+Math.sin(a)*P.r;
      if(simT>=H.runT){const g=dcHeliPick(H);if(g){H.st='run';H.t=0;H.tg=g;}else H.runT=simT+3;}}
    else if(H.st==='run'){const g=H.tg;if(!g||g.dead||!g.man){H.st='orbit';H.ap=null;H.runT=simT+2;continue;}
      const d=hyp(g.x-H.x,g.y-H.y);
      if(!H.ap&&H.t<.1&&d<P.fire[0]+90)H.ap={x:clamp(g.x+(H.x-g.x)/(d||1)*400,DCA.x0+40,DCA.x1-40),y:clamp(g.y+(H.y-g.y)/(d||1)*400,-320,260)};   // (too close to turn in: out first, then round at it)
      if(H.ap){tx=H.ap.x;ty=H.ap.y;if(hyp(tx-H.x,ty-H.y)<70||H.t>7)H.ap=null;}
      else{tx=g.x;ty=g.y;alt=P.alt-8;sp=P.spd*1.15;const off=Math.abs(((Math.atan2(g.y-H.y,g.x-H.x)-H.ang+Math.PI*3)%(Math.PI*2))-Math.PI);
        if(d<P.fire[1]&&d>P.fire[0]&&off<.3&&!H.q.length){H.runs=(H.runs||0)+1;for(let i=0;i<P.rk.n;i++)H.q.push({at:simT+i*P.rk.gap,x:g.x+(Math.random()-.5)*2*P.rk.spread,y:g.y+(Math.random()-.5)*2*P.rk.spread});dcHeliBreak(H);}
        else if(d<=P.fire[0]||H.t>16)dcHeliBreak(H);}}
    else if(H.st==='brk'){tx=H.bx;ty=H.by;if(hyp(tx-H.x,ty-H.y)<70||H.t>5){H.st='orbit';H.t=0;H.runT=simT+P.orbitT[0]+Math.random()*(P.orbitT[1]-P.orbitT[0]);}}
    else if(H.st==='out'){tx=H.x;ty=-1400;alt=H.y<DCA.treeY+200?P.altIn:P.alt+30;sp=P.spd*1.1;   // (home: north over the trees and away; the wave no longer waits on it)
      if(H.y<-1150){H.st='gone';H.hp=0;const e=H.e;if(e&&!e.dead){e.dead=true;e.gone=true;e.hp=0;e.path=[];}if(H.g)H.g.visible=false;continue;}}
    const a0=H.ang;H.ang=turn(H.ang,Math.atan2(ty-H.y,tx-H.x),P.turn*dt);H.turnR+=((H.ang-a0)/Math.max(dt,1e-4)-H.turnR)*Math.min(1,dt*3);
    H.sp+=(sp-H.sp)*Math.min(1,dt*1.2);H.x+=Math.cos(H.ang)*H.sp*dt;H.y+=Math.sin(H.ang)*H.sp*dt;H.alt+=(alt-H.alt)*Math.min(1,dt*.7);
    for(let i=H.q.length-1;i>=0;i--)if(simT>=H.q[i].at){dcHeliRocket(H,H.q[i]);H.q.splice(i,1);}
    dcHeliPose(H);
  }
  dcHeliRockets(dt);
}
// the break after a run: off to one side and on past the gun, then round again
function dcHeliBreak(H){
  const a=H.ang+H.dir*1.25;H.st='brk';H.t=0;H.bx=clamp(H.x+Math.cos(a)*320,DCA.x0+60,DCA.x1-60);H.by=clamp(H.y+Math.sin(a)*320,-260,300);
}
// a rocket off its pods: straight down its line to the spot, a smoke trail behind it (dday.js's rocket mesh and puffs)
function dcHeliRocket(H,T){
  const C=dd.dc,P=DCA.heli,c=Math.cos(H.ang),s=Math.sin(H.ang),side=(C.hrkN=(C.hrkN||0)+1)%2?1:-1;
  const x=H.x+c*4-s*side*12,y=H.y+s*4+c*side*12,z=ddH(H.x,H.y)+H.alt-6,tz=ddH(T.x,T.y)+2,d=Math.hypot(T.x-x,T.y-y,tz-z)||1,v=P.rk.spd;
  (C.hrk||(C.hrk=[])).push({x,y,z,vx:(T.x-x)/d*v,vy:(T.y-y)/d*v,vz:(tz-z)/d*v,by:H.e,left:d/v,m:null});
  flashes.push({x,y,t:0});if(typeof playSample==='function')playSample('launch',x,y,.45,1.1);
}
function dcHeliRockets(dt){
  const C=dd.dc,L=C.hrk;if(!L||!L.length)return;const P=DCA.heli;
  for(let i=L.length-1;i>=0;i--){const r=L[i];r.left-=dt;r.x+=r.vx*dt;r.y+=r.vy*dt;r.z+=r.vz*dt;
    if(r.left>0&&r.z>ddH(r.x,r.y)+1)continue;
    L.splice(i,1);if(r.m)r.m.visible=false;const by=r.by&&!r.by.dead?r.by:null;
    explode(r.x,r.y,by,false,P.rk.R,P.rk.D);for(const g of C.guns)if(!g.off&&hyp(r.x-g.x,r.y-g.y)<DCA.gunHit)dcGunHit(g,P.rk.gun);}
}
// what hits its door gunner (combat.js's damage): the helicopter takes it, by what fired
function dcHeliHit(H,dmg,src){
  if(!H||H.hp<=0||H.st==='crash'||H.st==='dead')return;const P=DCA.heli.dmg;
  const k=src&&src.onGun?(src.onGun.hv?P.hv:P.lt):P.rifle;
  H.hp-=dmg*k;H.hitT=simT;if(src&&src.side==='P')H.hitBy=src;if(H.e)H.e.hitFlash=.25;
  if(H.hp<=0){H.hp=0;dcHeliDown(H);}
}
// shot down: its gunner with it (the kill to whoever brought it down), a burst, then it spins and falls
function dcHeliDown(H){
  const e=H.e;H.st='crash';H.t=0;H.q.length=0;H.vz=0;H.spin=1.6;
  if(e&&!e.dead){e.dead=true;e.hp=0;e.gone=true;e.path=[];const by=H.hitBy;if(by&&by.side==='P'&&by.stats)creditKill(by);}
  H.burst=1;if(typeof sfxBoom==='function')sfxBoom(H.x,H.y,.8);shake(.5);banner(`The helicopter is hit${H.hitBy&&H.hitBy.side==='P'&&!H.hitBy.npc?` · ${H.hitBy.name}`:''}! It's going down.`,3200);
}
function dcHeliFall(H,dt){
  const P=DCA.heli;H.spin=Math.min(7,H.spin+dt*2.4);H.ang+=H.spin*dt;H.sp=Math.max(10,H.sp-dt*24);H.vz-=40*dt;H.alt+=H.vz*dt;
  H.x+=Math.cos(H.ang)*H.sp*dt*.6;H.y+=Math.sin(H.ang)*H.sp*dt*.6;
  if(H.alt>4)return;
  H.alt=0;H.st='dead';H.hp=0;explode(H.x,H.y,H.hitBy||null,true,P.crashR,P.crashD);
  for(let q=0;q<4;q++)booms.push({x:H.x+(Math.random()-.5)*36,y:H.y+(Math.random()-.5)*30,t:-q*.13,size:1.3});
  tankFires.push({x:H.x,y:H.y,r:12,t0:simT,puffs:[],emit:0});shake(1);bigText('Helicopter down','complete');
}
// the nearest one in the air, for its sound (audio.js)
function dcHeliSound(){
  let b=null,bd=1e9;for(const H of(dd&&dd.dc&&dd.dc.helis)||[]){if(H.st==='wait'||H.st==='dead'||H.st==='gone')continue;const d=hyp(H.x-camT.x,H.y-camT.z);if(d<bd){bd=d;b=H;}}return b;
}
// its look: field grey over pale blue, crosses on the boom and the cabin, rocket pods on stubs, the gunner in the open door; one mesh for the body
// (merged, colours baked in: ddground.js's ddgMerge), the rotors their own (they turn), and a faint disc where the blades blur
function dcHeliMesh(){
  const T=THREE,hz=Math.PI/2,top=0x4a5341,dk=0x1d1f20,pale=0x8d9aa2,wh=0xe6e4da,bk=0x121212,P=[];
  const add=(g,p,c,r,s)=>P.push({g,p,c,r,s});
  add(new T.BoxGeometry(40,14,18),[2,0,0],top);add(new T.BoxGeometry(38,2,17),[2,-7.6,0],pale);                       // the cabin, its belly
  add(new T.SphereGeometry(9.5,14,10),[22,-.5,0],top,null,[1.2,.78,.95]);                                                   // the nose
  add(new T.SphereGeometry(8.8,14,10,0,Math.PI*2,0,Math.PI*.55),[23,1.2,0],0x15222a,[0,0,-.35],[1.12,.8,.98]);            // the cockpit glass
  add(new T.BoxGeometry(22,5,14),[-2,9.4,0],0x3e4636);add(new T.CylinderGeometry(1.4,1.7,6,8),[0,14,0],dk);               // the engine housing, the mast
  add(new T.CylinderGeometry(2.2,4.2,62,10),[-48,3.5,0],top,[0,0,hz]);                                                     // the tail boom (thin end aft)
  add(new T.BoxGeometry(9,15,1.4),[-77,10,0],top,[0,0,.25]);add(new T.BoxGeometry(5,1,14),[-66,4,0],top);               // the fin, the tail plane
  for(const sz of[-1,1]){add(new T.CylinderGeometry(.9,.9,52,8),[2,-12.5,sz*11],dk,[0,0,hz]);                            // the skids
    for(const x of[-10,14])add(new T.BoxGeometry(1.4,6,1.2),[x,-9.5,sz*9.5],dk,[-sz*.35,0,0]);
    add(new T.BoxGeometry(5,1.2,7),[3,-3,sz*12.4],top);add(new T.CylinderGeometry(2.1,2.1,13,9),[4,-5.4,sz*16],dk,[0,0,hz]);   // the stub wing, the rocket pod
    add(new T.BoxGeometry(15,9,.4),[4,-.5,sz*9.1],0x0b0c0d);                                                                // the open door: dark inside
    // the crosses: white round black, on the cabin's back half and on the boom
    for(const[x,y,z,k]of[[-11,1,sz*9.15,1],[-40,4,sz*3.5,.7]]){add(new T.BoxGeometry(7.4*k,1.9*k,.3),[x,y,z],wh);add(new T.BoxGeometry(1.9*k,7.4*k,.3),[x,y,z],wh);
      add(new T.BoxGeometry(6*k,1*k,.5),[x,y,z],bk);add(new T.BoxGeometry(1*k,6*k,.5),[x,y,z],bk);}}
  // the gunner in the right-hand door and his gun out over the sill
  add(new T.BoxGeometry(4.6,8,4),[5,0,7.2],0x575a50);add(new T.SphereGeometry(2.4,8,6),[5,5.6,7.2],0x4b4f47,null,[1,.8,1]);
  add(new T.CylinderGeometry(.45,.45,11,6),[6,1.6,13],dk,[hz,0,0]);add(new T.BoxGeometry(2.4,1.6,4),[6,1.4,9.4],dk);
  const mat=new T.MeshStandardMaterial({color:0xffffff,vertexColors:true,roughness:.62,metalness:.22});mat.userData.ddKeep=true;
  const geo=ddgMerge(P.map(q=>({g:q.g,p:q.p,c:q.c,r:q.r,s:q.s})),true);
  const g=new T.Group(),b=new T.Group();g.add(b);const body=new T.Mesh(geo,mat);body.castShadow=true;b.add(body);
  const rm=new T.MeshStandardMaterial({color:0x1a1c1d,roughness:.6,metalness:.4});rm.userData.ddKeep=true;
  const rotor=new T.Mesh(ddgMerge([{g:new T.BoxGeometry(148,.5,5),p:[0,0,0]},{g:new T.BoxGeometry(5,.5,148),p:[0,0,0]}]),rm);rotor.position.set(0,17.5,0);rotor.castShadow=true;b.add(rotor);
  const tr=new T.Mesh(ddgMerge([{g:new T.BoxGeometry(1.6,13,.3),p:[0,0,0]},{g:new T.BoxGeometry(13,1.6,.3),p:[0,0,0]}]),rm);tr.position.set(-79,12,1.6);b.add(tr);
  const disc=new T.Mesh(new T.CircleGeometry(74,40),new T.MeshBasicMaterial({color:0x8a949c,transparent:true,opacity:.08,depthWrite:false,side:T.DoubleSide}));disc.rotation.x=-hz;disc.position.y=17.3;b.add(disc);
  g.userData={b,rotor,tr,disc,mats:[mat,rm]};return g;
}
// each frame (dday.js's ddFrame): the helicopters where they are, leaning into their turns and nose down, the blades turning; the rockets
function dcFrame(rdt,now){
  const C=dd&&dd.dc;if(!C)return;
  for(const H of C.helis||[]){
    if(H.st==='wait'||H.st==='gone'){if(H.g)H.g.visible=false;continue;}
    if(!H.g){H.g=dcHeliMesh();DD.scene.add(H.g);}
    const g=H.g,U=g.userData,fall=H.st==='crash',dead=H.st==='dead';g.visible=true;
    g.position.set(H.x,ddH(H.x,H.y)+H.alt+(dead?4:0),H.y);g.rotation.y=-H.ang;
    const bank=dead?.38:fall?clamp(H.turnR*.06,-.5,.5)+.2:clamp(H.turnR*.45,-.42,.42),pitch=dead?.1:fall?-.35:-(H.st==='run'?.2:.13)*clamp(H.sp/DCA.heli.spd,0,1.3);
    U.b.rotation.set(bank,0,pitch);
    if(!dead){U.rotor.rotation.y+=rdt*(fall?14:30);U.tr.rotation.z+=rdt*44;U.disc.material.opacity=fall?.04:.08;}
    else if(!U.burnt){U.burnt=1;U.disc.visible=false;U.rotor.rotation.z=.3;for(const m of U.mats)if(typeof ddgBurnMat==='function')ddgBurnMat(m);else m.color.setHex(0x2a2826);}
    // smoke from it once it's badly hit, black and thick as it falls
    if(!dead&&(H.hp<H.hp0*.5||fall)&&DD.rk&&DD.rk.puff&&(H.smokeT-=rdt)<=0){H.smokeT=fall?.04:H.hp<H.hp0*.25?.08:.16;
      const c=Math.cos(H.ang),s=Math.sin(H.ang);DD.rk.puff(H.x-c*6,g.position.y+10,H.y-s*6,fall?7:5,fall?3:2.4,fall||H.hp<H.hp0*.25?0x1c1a18:0x55524d,6);}
    if(H.burst&&DD.rk&&DD.rk.puff){H.burst=0;const y0=g.position.y;for(let k=0;k<10;k++)DD.rk.puff(H.x+(Math.random()-.5)*20,y0+(Math.random()-.5)*10,H.y+(Math.random()-.5)*20,k<5?7+k:9+k,k<5?.7:2.6,k<5?0xffb040:0x2a2724,k<5?4:10);}   // (hit: a burst of flame and smoke up there)
    if(H.e&&H.e.m)H.e.m.g.visible=false;   // (he's drawn in the door, as part of it)
  }
  const P=C.hrk||[];let i=0;C.hrkM=C.hrkM||[];
  for(const r of P){if(!DD.rk||!DD.rk.mk)break;const m=r.m||(r.m=C.hrkM.find(q=>!q.visible&&!q.userData.busy)||(()=>{const q=DD.rk.mk();C.hrkM.push(q);return q;})());
    m.visible=true;m.position.set(r.x,r.z,r.y);m.rotation.set(0,-Math.atan2(r.vy,r.vx),0);m.rotateZ(Math.atan2(r.vz,Math.hypot(r.vx,r.vy)));
    if(DD.rk.puff)for(let k=0;k<2;k++)DD.rk.puff(r.x-r.vx*.02*(k+1),r.z-r.vz*.02*(k+1),r.y-r.vy*.02*(k+1),4,1.6,0xe8e6de,3);i++;}
  for(const m of C.hrkM)if(!P.some(r=>r.m===m))m.visible=false;
}

/* ---------- the fight's clock ---------- */
// a wave beaten (Version 254, Bryan: "After the first wave show Wave 1 complete. And give a timer on the rest time until the next wave"): WAVE n
// COMPLETE, the guns patched up (not one knocked out: that's still an Engineer's job), the Engineers' repair kit made up again, the other troops
// made up, then the rest with its clock (dcRestHud), or the push on their checkpoint (after wave 2, and after any later wave while it isn't ours)
// the other troops between waves: those still up patched up, and fresh men out through the arch up to DCA.npcN again
function dcNpcTopUp(){
  for(const u of dd.npcs)if(alive(u))u.hp=Math.max(u.hp,100);
  const BX=[420,470,520,570,810,860,910,950,445,835],n=DCA.npcN-dd.npcs.filter(alive).length;
  for(let i=0;i<n;i++){const u=ddNpc(688+(i%4)*8,DCA.cp.y+DCA.cp.h+8+((i/4)|0)*9);u.inBoat=false;u.seen=true;u.back={x:BX[i%BX.length],y:DCA.wallY+24};u.ln=0;u.post=u.back;u.hopT=simT+.3+i*.2;}
  const bz=dd.npcs.filter(u=>alive(u)&&u.spec==='rpg');for(const u of bz)u.specN=Math.max(u.specN||0,DCA.bz.n);   // (Version 255: the bazooka men's rockets made up, and two of them again)
  for(const u of dd.npcs.filter(u=>alive(u)&&!u.spec&&!u.dcGun).reverse()){if(bz.length>=DCA.bz.men)break;dcBzMan(u);bz.push(u);}
}
function dcWaveDone(){
  const C=dd.dc,n=C.wave;
  if(n>=DCA.waves.length){if(!dd.won){dd.won=true;if(dd.fp&&typeof fpExit==='function')fpExit('The last of them is down.');endAt=performance.now()+2600;bigText(`All ${DCA.waves.length} waves held`,'complete');banner('The last of them is down. Base held.',4000);}return;}
  bigText(`Wave ${n} complete`,'complete');
  for(const g of C.guns)if(!g.dead&&g.hp<g.hp0){g.hp=g.hp0;g.hits=0;}
  for(const u of players)u.fixN=0;
  dcNpcTopUp();
  if(n>=2&&!C.cpOurs){C.ph='push';C.t=0;C.pushOn=false;}
  else{C.ph='lull';C.t=0;C.rest=DCA.lull;}
}
function dcTick(dt){
  const C=dd.dc;C.t+=dt;
  ddAllDown();ddDeadTick();dd.pool=0;
  dcGunsTick(dt);ddHot();ddTankTick(dt);dcTankRoll();dcHeliTick(dt);dcCpTick(dt);
  for(const K of dd.tanks)if(K.hold&&K.relT!=null&&simT>=K.relT){K.hold=false;K.i=0;K.relT=null;}   // (a wave's tanks let loose one after another)
  if((dd.aiT-=dt)<=0){dd.aiT=1;ddMedics();if(!dd.seq&&typeof ddcLead==='function'&&ddcLead()){ddcLeadCheck();ddcSupport(dd.active==='A'?'B':'A');}}   // (Version 168: ddctl.js)
  if((dd.npcT-=dt)<=0){dd.npcT=.5;dcNpc();dcEnemy();dcReplace();ddHelpers();ddTidy();updateObjUI();if(typeof vgBazooka==='function')vgBazooka();if(typeof dcFranticTick==='function')dcFranticTick();}
  const left=n=>enemies.filter(e=>e.tag==='w'+n&&!beaten(e)).length+dd.tanks.filter(K=>K.w===n&&K.hp>0).length+(C.helis||[]).filter(H=>H.w===n&&H.hp>0).length;   // (a helicopter still to come counts: Version 255)
  if(dd.seq&&dd.seq.dc){dcSeqTick(dt);}   // (Version 228: the opening, ddcseq.js; it ends in the first wave)
  else if(C.ph==='intro'){if(C.t>4.2&&!C.back){C.back=1;camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:DCA.square.x,z:DCA.wallY-34+DD_CAM.look,zoom:7.4},t:0,dur:1.6};}
    if(C.t>6){C.ph='setup';C.t=0;dcNoRe();}}
  else if(C.ph==='setup'){if(C.t>=DCA.setup){C.ph='w1';C.wave=1;C.t=0;dcSpawnWave(1);}}
  else if(C.ph==='lull'){if(C.t>=(C.rest||DCA.lull)){C.wave++;C.ph='w'+C.wave;C.t=0;dcSpawnWave(C.wave);}}
  else if(C.ph==='push'){if(!C.pushOn&&C.t>=2)dcPushStart();
    if(C.t>=DCA.pushMax){C.wave++;C.ph='w'+C.wave;C.t=0;dcSpawnWave(C.wave);}}   // (not taken in time: the next wave comes anyway, and the push goes on)
  else if(/^w/.test(C.ph)){const W=DCA.waves[C.wave-1]||{};
    if(!C.more&&W.more&&C.t>=W.moreAt){C.more=1;dcSpawnMore(C.wave);}   // (the wave's second lot, out of the trees)
    else if(C.t>4&&left(C.wave)===0&&(C.more||!W.more))dcWaveDone();
    else dcStragglers(C.wave,C.more||!W.more);}
  // the flag: theirs if they stand at it for DCA.flagT s with none of ours there (it was the command post, and 20 s, until Version 224)
  const inCp=enemies.filter(e=>!beaten(e)&&!e.air&&dcIn(e,DCA.cpZone)).length+dd.tanks.filter(K=>K.hp>0&&dcIn(K,DCA.cpZone)).length,ours=dd.allies.filter(u=>alive(u)&&dcIn(u,DCA.cpZone)).length;
  C.cpT=inCp&&!ours?C.cpT+dt:Math.max(0,C.cpT-dt*2);C.cpN=inCp;
  if(!endAt&&!dd.won){
    if(C.cpT>=DCA.flagT){dd.over=true;dd.why='cp';if(dd.fp&&typeof fpExit==='function')fpExit('They have the flag.');endAt=performance.now()+1500;}
    else if(!players.some(alive)&&!dd.queue.length&&players.every(p=>p.dead||p.revive===0)){dd.over=true;dd.why='dead';endAt=performance.now()+1800;}}
}
function dcHint(){
  const C=dd.dc;
  if(C.ph==='intro')return'They are coming. In a moment the guns are yours.';
  if(C.cpGo&&!C.cpOurs)return'Take their checkpoint: the other troops and your free men are going in. Cover them from the guns: the field gun brings the blockhouse down in three hits, the machine guns keep their heads down.';
  return`${DCA.waves.length} waves. Your men are on the guns: tap a gun, on the map or in the row at the bottom, to fire it yourself; an empty one, to send a man to it. A thumb on one of theirs turns every gun on him. The field gun and the bazookas are for the tanks, a tank or more every wave. A helicopter comes over in waves 5 and 7: the machine guns, the heavy one most of all. A gun takes the hits before its man does. Nobody comes to replace the fallen: lose the flag, or everyone, and it is lost.`;
}
function dcDraw(){
  const C=dd.dc,lab=(x,y,h,text,col,sz=9)=>{toSBack=false;const[sx,sy]=toS(x,y,h);if(!toSBack&&sx>-40&&sx<cw+40&&sy>0&&sy<ch)label(text,sx,sy,col,sz,700);};
  // (Version 254) their checkpoint while it's the one to take: a yellow box over it that pulses, and how far the taking has got (blue once it's ours)
  const cpShow=C.cpOurs||C.cpGo&&C.pushT0!=null&&simT-C.pushT0>2.5;
  if(cpShow){const Z=DCA.cz,pu=.5+.5*Math.sin(performance.now()/260),c=DCA.check;
    if(C.cpOurs)dcZoneRect(Z,'rgba(96,165,255,.09)','rgba(130,190,255,.7)',1.8);else dcZoneRect(Z,`rgba(255,207,74,${(.07+.07*pu).toFixed(3)})`,`rgba(255,215,106,${(.55+.4*pu).toFixed(2)})`,2.8);
    const tk=C.capT>0,pc=Math.min(99,Math.round(C.capT/(C.cpOurs?DCA.loseT:DCA.capT)*100));
    lab(c.x+c.w/2,c.y+c.h/2,58,C.cpOurs?(tk?`CHECKPOINT · THEY'RE TAKING IT ${pc}%`:'CHECKPOINT · OURS'):tk?`TAKING THE CHECKPOINT · ${pc}%`:'TAKE THE CHECKPOINT',C.cpOurs?(tk?'#ff8a7e':'#8fd0ff'):'#ffcf4a',11);}
  {const co=objs.find(o=>o.tag==='check');if(co&&!cpShow){const c=DCA.check;lab(c.x+c.w/2,c.y+c.h/2,48,co.gone?'BLOCKHOUSE · DESTROYED':co.hp<DCA.checkHp?`BLOCKHOUSE · ${Math.max(1,Math.round(co.hp/DCA.checkHp*100))}%`:'BLOCKHOUSE · BLOW IT UP',co.gone?'#8b949c':'#ff8a7e');}}
  // each gun's circle: gold and dashed for one to man, the squad's blue for one a squad mate holds, grey for one knocked out (not from behind a gun)
  if(!dd.fp)for(const g of C.guns){if(g.off)continue;const m=g.man,mine=m&&!m.npc;toSBack=false;const p=toS(g.x,g.y,1);if(toSBack||p[0]<-60||p[0]>cw+60||p[1]<0||p[1]>ch)continue;
    ox.save();ox.beginPath();ox.ellipse(p[0],p[1],30,15,0,0,7);ox.lineWidth=2.5;ox.strokeStyle=g.dead?'rgba(139,148,156,.7)':mine?'rgba(88,196,246,.9)':m?'rgba(255,138,126,.9)':'rgba(255,215,106,.95)';if(!m&&!g.dead)ox.setLineDash([7,5]);ox.stroke();ox.restore();
    lab(g.x,g.y,g.t==='art'?34:24,g.dead?(g.fix&&hyp(g.fix.u.x-g.x,g.fix.u.y-g.y)<=34?`${g.n} · REPAIRING ${Math.max(1,Math.ceil(DCA.fixT-g.fix.t))}`:g.fix?`${g.n} · ENGINEER COMING`:dcFixLeft()?`${g.n} · TAP TO REPAIR`:`${g.n} · KNOCKED OUT`):m?(mine?`${g.n} · ${m.name.toUpperCase()}`:`${g.n} · NPC`):g.going?`${g.n} · ON HIS WAY`:`${g.n} · TAP TO MAN`,g.dead?'#8b949c':m?(mine?'#8fd0ff':'#ff8a7e'):'#ffcf4a');
    if(!g.dead&&g.hp<g.hp0){toSBack=false;const q=toS(g.x,g.y,g.t==='art'?44:33);if(!toSBack)bar(q[0]-16,q[1],32,Math.max(0,g.hp/g.hp0),g.hp<g.hp0*.4?'#ff7a4a':'#ffcf4a');}}
  // the one every gun is on
  {const e=dd.fp?null:C.focusK||C.focus;if(e){toSBack=false;const q=toS(e.x,e.y,C.focusK?18:10);if(!toSBack){ox.save();ox.strokeStyle='rgba(255,179,107,.8)';ox.lineWidth=1.6;ox.setLineDash([7,6]);
      for(const g of C.guns){if(g.dead||!g.man)continue;toSBack=false;const p=toS(g.x,g.y,8);if(toSBack)continue;ox.beginPath();ox.moveTo(p[0],p[1]);ox.lineTo(q[0],q[1]);ox.stroke();}
      ox.setLineDash([]);ox.lineWidth=3;ox.strokeStyle='#ff5a4e';ox.beginPath();ox.arc(q[0],q[1],16,0,7);ox.stroke();for(const[a,b]of[[0,-1],[0,1],[-1,0],[1,0]]){ox.beginPath();ox.moveTo(q[0]+a*10,q[1]+b*10);ox.lineTo(q[0]+a*25,q[1]+b*25);ox.stroke();}ox.restore();}}}
  // (Version 167: the tanks' health is ddplay.js's ddDrawTargets' bar; the flag and its clock are in the objective pill, ddhud.js)
  // (Version 255) a helicopter's health over it while it's up (C here is the fight, not the colours)
  for(const H of C.helis||[]){if(H.st==='wait'||H.st==='dead'||H.hp<=0)continue;toSBack=false;const q=toS(H.x,H.y,H.alt+30);if(!toSBack)bar(q[0]-24,q[1],48,H.hp/H.hp0,'#ff6a55');}
  for(const m of players)if(m.raise&&m.raise.t.raiseP>0&&alive(m)){const c=m.raise.t,[sx,sy]=toS(c.x,c.y,20);label(`REVIVING ${Math.round(c.raiseP/DD_RAISE*100)}%`,sx,sy,'#5fe08e',10,700);}
  dcBar();dcRestHud();
}
// a box on the ground (ddplay.js's ddBlueRect in any colour)
function dcZoneRect(Z,fill,stroke,lw){
  const P=[];let bad=false;const add=(x,y)=>{toSBack=false;const q=toS(x,y,1.5);if(toSBack)bad=true;P.push(q);};
  for(let x=Z.x0;x<Z.x1;x+=24)add(x,Z.y0);for(let y=Z.y0;y<Z.y1;y+=24)add(Z.x1,y);for(let x=Z.x1;x>Z.x0;x-=24)add(x,Z.y1);for(let y=Z.y1;y>Z.y0;y-=24)add(Z.x0,y);
  if(bad||!P.some(q=>q[0]>-200&&q[0]<cw+200&&q[1]>-200&&q[1]<ch+200))return;
  ox.save();ox.beginPath();ox.moveTo(P[0][0],P[0][1]);for(const q of P)ox.lineTo(q[0],q[1]);ox.closePath();ox.fillStyle=fill;ox.fill();ox.strokeStyle=stroke;ox.lineWidth=lw;ox.stroke();ox.restore();
}
// the rest's clock (Version 254, Bryan: "give a timer on the rest time until the next wave"): WAVE n IN s across the top, a bar running down under it
function dcRestHud(){
  let el=$('#dcRest');const C=dd&&dd.dc,R=C&&(C.rest||DCA.lull),on=!!C&&state==='play'&&!endAt&&!dd.seq&&!dd.won&&C.ph==='lull'&&C.t<R;
  if(!el){if(!on)return;el=document.createElement('div');el.id='dcRest';el.innerHTML='<b></b><i><em></em></i>';stage.appendChild(el);}
  if(el.hidden!==!on)el.hidden=!on;if(!on)return;
  const t=`WAVE ${C.wave+1} IN ${Math.max(1,Math.ceil(R-C.t))}`,b=el.firstChild,w=(100*clamp(1-C.t/R,0,1)).toFixed(1)+'%',e=el.querySelector('em');
  if(b.textContent!==t)b.textContent=t;if(e.style.width!==w)e.style.width=w;
}
/* Version 248 (Bryan: "Can you make the most powerful stationary weapon to the left and weakest to the right? I feel like players won't know what
   to select right away and might naturally select the first one to the left. Also, is there a cycle button so the player can switch stationary
   guns?"): the row shows the guns strongest first (dcRow: the field gun, the heavy machine gun, then the nests; it was the order they stand in on
   the map, the nests first), and from behind a gun NEXT GUN goes on to the next gun along the row that one of the squads' men is on, round again
   at the end (dcNextGun; Tab on a keyboard, ddfp.js's fpNext). Until now the only way across was a tap on another gun's tile. */
const dcPw=g=>g.t==='art'?3:g.hv?2:1,dcSub=g=>g.sub?' '+g.sub:g.k==='n1'?' 1':g.k==='n2'?' 2':'',dcName=g=>g.t==='art'?'field gun':g.hv?'heavy MG':(g.cp?'forward MG':'MG nest')+dcSub(g);
function dcRow(){return dd.dc.guns.filter(g=>!g.off).sort((a,b)=>dcPw(b)-dcPw(a));}   // (Version 254: not their checkpoint's light guns while it isn't ours)   // (a steady sort: guns as strong as each other keep their own order)
function dcNextOf(u){   // the gun NEXT GUN would go to from the one u is on, or null when no other is held by a squad mate
  const L=dcRow().filter(g=>!g.dead&&g.man&&!g.man.npc&&alive(g.man)),i=u?L.indexOf(u.dcGun):-1;if(i<0||L.length<2)return null;return L[(i+1)%L.length];
}
function dcNextGun(){const F=dd&&dd.fp,n=F&&dd.dc?dcNextOf(F.u):null;if(!n)return false;dcTile(n.k);return true;}
// (Version 255) the one before it along the row: PREV on the gun screen's left (ddfp.js), Shift+Tab
function dcPrevOf(u){const L=dcRow().filter(g=>!g.dead&&g.man&&!g.man.npc&&alive(g.man)),i=u?L.indexOf(u.dcGun):-1;if(i<0||L.length<2)return null;return L[(i-1+L.length)%L.length];}
function dcPrevGun(){const F=dd&&dd.fp,n=F&&dd.dc?dcPrevOf(F.u):null;if(!n)return false;dcTile(n.k);return true;}
// the row of guns (Bryan's pick of the drafts, docs/drafts/v225-guns.jpg): a tile a gun, who is on it and what it's doing; a white arrow and
// "Man a Gun" until the player has picked his first; along the bottom from above, along the top from behind a gun
function dcBar(){
  let el=$('#dcBar');const C=dd&&dd.dc,show=!!C&&state==='play'&&C.ph!=='intro'&&!dd.seq&&!endAt;
  if(!el){if(!show){document.body.classList.remove('dcg');return;}el=document.createElement('div');el.id='dcBar';stage.appendChild(el);
    el.addEventListener('click',ev=>{const b=ev.target.closest('[data-k]');if(!b||!dd||!dd.dc)return;ev.stopPropagation();dcTile(b.dataset.k);dcBar();});
    for(const t of['pointerdown','pointerup','touchstart'])el.addEventListener(t,ev=>ev.stopPropagation());}
  if(el.hidden!==!show)el.hidden=!show;document.body.classList.toggle('dcg',show);if(!show)return;   // (dcg: the squad's own bar gives way to the guns')
  const fpU=dd.fp?dd.fp.u:null,foc=!!(C.focus||C.focusK),row=dcRow();   // (Version 255: no BACK / NEXT GUN / LEAVE GUN under it from behind a gun: EXIT GUN, PREV and NEXT GUN are on the gun screen itself, ddfp.js)
  // (Version 254) the buttons are made only when what's in the row changes (its guns, the arrow, the buttons under it), and their words and colours
  // are set in place every frame. The row was made again whole whenever a word in it changed (the field gun's reload counting down, a gun FIRING
  // or READY): about three times a second, and a tap whose finger went down on one button and came up on its replacement did nothing
  const cols=row.length>4&&innerWidth<560?Math.ceil(row.length/2):row.length,key=[C.picked||fpU?0:1,row.map(g=>g.k).join(),cols].join('|');
  if(el.dataset.key!==key){el.dataset.key=key;
    el.innerHTML=(C.picked||fpU?'':'<div class="dcb-hd"><svg viewBox="0 0 22 26"><path d="M8 0h6v14h6L11 26 2 14h6z" fill="#fff"/></svg>Man a Gun</div>')+`<div class="dcb-row" style="grid-template-columns:repeat(${cols},1fr)">`
      +row.map(g=>`<button type="button" data-k="${g.k}" class="dcb-t"><u hidden>NPC</u><i></i><b></b><span></span><em></em></button>`).join('')+'</div>';}
  {const sz=key+'|'+innerWidth+'x'+innerHeight+'|'+!!fpU;if(el.dataset.sz!==sz){el.dataset.sz=sz;document.body.style.setProperty('--dcbh',el.offsetHeight+'px');}}   // (Version 255: how tall the row is, for the gun screen's buttons to sit over it, css/style.css)
  const set=(n,p,v)=>{if(n&&n[p]!==v)n[p]=v;};
  for(const g of row){const b=el.querySelector(`.dcb-t[data-k="${g.k}"]`);if(!b)continue;const m=g.man,you=!!fpU&&m===fpU,npc=!!m&&m.npc;
    const who=g.dead?'destroyed':you?'YOU':m?(npc?'Private':m.name):g.going?'coming':'empty',st=g.dead?(g.fix?'REPAIRING':dcFixLeft()?'TAP TO REPAIR':'KNOCKED OUT'):!m?(g.going?'ON HIS WAY':'TAP TO MAN'):g.t==='art'?(simT<g.fireT?'RELOAD '+Math.ceil(g.fireT-simT):foc?'ON TARGET':'LOADED'):foc?'ON TARGET':simT-(m.shotT||-9)<1.6||simT<g.hvT+.4?'FIRING':'READY';
    set(b,'className','dcb-t'+(you?' you':'')+(g.dead?' dead':'')+(!m&&!g.dead&&!g.going?' empty':'')+(foc&&m&&!g.dead?' tg':''));
    const[tu,ti,tb,ts,te]=b.children;set(tu,'hidden',!npc);set(ti,'textContent',g.n+dcSub(g));set(tb,'textContent',who);set(ts,'textContent',st);
    const w=Math.max(0,Math.round(g.hp/g.hp0*100))+'%';if(te&&te.style.width!==w)te.style.width=w;}
}
function dcFinishLost(){
  state='end';setStatus();$('#status').textContent='Lost';
  $('#endEyebrow').textContent='Base lost';$('#endTitle').textContent=dd.why==='cp'?'They took the flag':'The squads are gone';{const b=$('#dcBar');if(b)b.hidden=true;}
  $('#endText').textContent=`The counterattack got through in wave ${dd.dc.wave||1}. Your men are as they were when it began: try it again. The field gun and the bazookas for the tanks, the machine guns for the men in the open.`;
  {const q=$('#sq');if(q)q.hidden=true;}$('#againBtn').textContent='Try the counterattack again';$('#retryBtn').hidden=true;$('#end').hidden=false;
}
