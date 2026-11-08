"use strict";
/* Level 4, "The Old Radio Tower" (Bryan, after v98: "So the east road is over a bridge to the tunnel. In the tunnel there's an
   interior that leads to a tunnel which will reach the radio tower on top of the hill the tunnel is under"; his answers to
   draft I in docs/level4.md, the plan in docs/map-draft-J.png). The HQ's radio needs parts: the decommissioned radio tower on
   top of the hill the road tunnel runs under has them. The road tunnel's north end has caved in (for now), so the way on is
   the service door in its east wall (tunnel.js), into the hill: its own map (MAPID 'l4', the big map waiting in STASH.out),
   three floors side by side in the frame like the Headquarters' upstairs (hqfloors.js), one on screen at a time, every one
   live (interior.js's mapFloors: the chip, the camera going to a squad, noise kept to its floor):
   - the PLANT (PL): the tunnel's old control rooms in the rock. The staff room and the store (Bryan, after v99: the bonus finds
     are "a heavy machine gun and an M203 grenade launcher attachment (goes in the place of the grenade - goes farther and is
     stronger)": the M203 in a case in the staff room, an M240 in a case in the store, whoever takes one has it from then on),
     the control room (the summit's cameras: watch them and its men are marked for a while), the generator (power for the
     lift), the fan hall where her brood has nested (eggs, young asleep), the lower station with the lift and the foot of the
     stairs. In by the service door, out the same way (a tap: the hill starts fresh next time).
   - up to the summit, the player's choice (Bryan: "let the player choose. Going up the lift alerts more enemy monsters and the
     guards hear them coming. Enemy monsters will come up and attack not only the player but the enemy troops too. Taking the
     stairs is quiet and the enemy troops are unaware. The player can split the teams and keep one group undetected"):
     the STAIRS (ST), a long climb through the rock, quiet, where the Crawler lives (the centipede the squad saw go in, one of
     her young grown big); or the LIFT, which needs the generator and is loud: the riders' team is heard (caught), the
     summit's men leave their posts to wait round the bunker it comes up into, and the brood wakes and comes up the shaft
     after it, out of a hatch by the bunker, going for whoever's nearest, their men too (brawl; their men shoot back: l4).
   - the SUMMIT (SU), The Old Radio Tower: their men in helmets and vests (Bryan: "As the game progresses enemies get stronger
     too"), a sniper on the mast, a machine gun over their track up the north side, the radio building (two rooms: a Breach;
     the transmitter, the radio log), their containers (the receiver, already packed), the antenna taken down at the mast's
     foot (Bryan, after v99: "the parts for the radio is a transmitter, a receiver, and an Antenna"). A checkpoint once
     they're all down. The three parts are carried (slow, no shooting) to the zip line on the south edge (Bryan: "a zip line
     leads to the bridge and they can make a quick route back"): everyone down it, out over the edge to the bridge on the
     road east, Mission complete and the report.
   Saves: 'hill' (inside), 'summit' (taken), 'home' (back at the bridge with the parts). The parts and the bonus crates are
   kept (warehouseYard.l4) for what's built at the HQ next (docs/hq-base.md): radio control, then the radio tower. */
const L4F={SU:{x0:20,y0:-740,x1:900,y1:140},PL:{x0:20,y0:380,x1:700,y1:880},ST:{x0:1040,y0:-360,x1:1330,y1:880}};   // the floors in the shared frame
const L4_FLOOR_IDS=['SU','ST','PL'];   // (the chip, top first)
function l4FloorOf(x,y){for(const id of L4_FLOOR_IDS){const b=L4F[id];if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)return id;}return null;}
const FLOORS_L4={ids:L4_FLOOR_IDS,of:(x,y)=>l4FloorOf(x,y),set:(id,at)=>setL4Floor(id,at),get flights(){return L4?L4.flights:null;}};   // (interior.js's mapFloors)
const l4Out=()=>MAPID==='l4'&&!!L4&&curFloor==='SU';   // the summit: rain, wind and lightning (overlay.js, main.js, audio.js)
const l4In=()=>MAPID==='l4'&&!!L4&&curFloor!=='SU';    // the plant and the stairs: in the rock
const L4_LOOK={SU:{hemi:.27,moon:.3,bg:FOG,fog:.0003},PL:{hemi:.12,moon:0,bg:0x050607,fog:.0003},ST:{hemi:.08,moon:0,bg:0x030405,fog:.0003}};
// the summit's edge: inside this the hilltop, outside it the drop (SU_POLY clockwise; their track leaves it at the top)
const SU_POLY=[[160,-560],[262,-652],[400,-690],[560,-690],[596,-740],[664,-740],[700,-664],[806,-562],[852,-408],[850,-216],[796,-60],[690,46],[520,100],[340,94],[194,36],[100,-74],[74,-246],[92,-420]];
// the plant's rooms
const PL_ROOMS={hall:{x0:50,y0:410,x1:120,y1:850},staff:{x0:130,y0:410,x1:300,y1:540,name:'STAFF ROOM'},ctrl:{x0:310,y0:410,x1:490,y1:540,name:'CONTROL ROOM'},
  gen:{x0:500,y0:410,x1:670,y1:540,name:'GENERATOR'},chall:{x0:130,y0:550,x1:670,y1:600},store:{x0:130,y0:610,x1:290,y1:850,name:'STORE'},
  fan:{x0:300,y0:610,x1:520,y1:850,name:'FAN HALL'},stn:{x0:530,y0:610,x1:670,y1:850,name:'LOWER STATION'}};
const PL_OUT={x0:50,y0:772,x1:120,y1:850};   // the service door's gather area (a tap: back out into the road tunnel)
const PL_IN={x0:50,y0:620,x1:120,y1:752};    // where they come in
// the flights (interior.js's buildFlight and stairElev)
const L4_FL={
  plUp:{x0:612,y0:740,x1:660,y1:840,dir:'s',up:true,floor:'PL'},       // the foot of the stairs in the lower station: up into the rock
  stDown:{x0:1078,y0:812,x1:1122,y1:866,dir:'s',up:false,floor:'ST'},  // the bottom of the climb: back down to the plant
  stUp:{x0:1248,y0:-346,x1:1292,y1:-280,dir:'n',up:true,floor:'ST'},   // the top: up into the hut
  suDown:{x0:114,y0:-206,x1:150,y1:-154,dir:'n',up:false,floor:'SU'}}; // in the hut on the summit: down
const L4_TR=[
  {from:'PL',to:'ST',z:L4_FL.plUp,arrive:{x:1100,y:780},label:'STAIRS UP'},
  {from:'ST',to:'PL',z:L4_FL.stDown,arrive:{x:636,y:716},label:'DOWN'},
  {from:'ST',to:'SU',z:L4_FL.stUp,arrive:{x:186,y:-180},label:'UP TO THE HUT'},
  {from:'SU',to:'ST',z:L4_FL.suDown,arrive:{x:1270,y:-250},label:'DOWN'}];
const L4_CAR={PL:{x0:536,y0:616,x1:600,y1:696},SU:{x0:410,y0:-214,x1:510,y1:-150}};   // the lift's car: in the lower station, and in the bunker on the summit
const L4_RIDE=6;   // the ride up through the rock (s)
const L4_DOOR={x:460,y:-124};    // the bunker's door (the guards wait round it)
const L4_HATCH={x:578,y:-110};   // the shaft's vent by the bunker: the brood comes out of it
const L4_MAST={x:470,y:-330,elev:56};
const L4_ZIP={x0:440,y0:-4,x1:560,y1:70};   // the gather area at the zip line's pylon
const L4_PYLON={x:500,y:84};
const L4_ROOMS=[{x0:180,y0:-550,x1:265,y1:-460,name:'the equipment room'},{x0:275,y0:-550,x1:350,y1:-460,name:'the radio office'}];   // the radio building (orders.js's Breach)
const L4_REST=[{k:'med',x:330,y:-380},{k:'sup',x:600,y:-380}];   // on the summit once it's taken
const L4_INTEL={x:314,y:-520};   // the radio log, on the office desk
const L4_AMBUSH=[[400,-62],[462,-40],[524,-52],[582,-84],[612,-150],[380,-100],[560,-18],[430,-8],[650,-62],[350,-56],[500,4]];   // round the bunker's door: where the guards wait for the lift
const L4E={dmgIn:.8};   // their men: helmets and vests (20 % less damage, Alert II's)
const L4_BROOD={young:2,youngBig:3,hatch:1,hatchBig:2,wave:3,waveBig:5,waveHatch:2,waveHatchBig:3,delay:5,gap:.45};   // the fan hall's brood (asleep), what the lift wakes below it, the wave out of the hatch
const L4_CRAWLER={hp:360,perMan:40,reach:26,lunge:120,hit:1.5,spd:84,wake:230};
const L4_KEY='warehouseYard.l4';   // what came back (the parts, the radio log, the finds): for the HQ's radio control, next
const L4_PARTS=[{id:'tx',name:'the first power pack',label:'POWER PACK',x:204,y:-528,standY:20,secs:4},{id:'rx',name:'the second power pack',label:'POWER PACK',x:651,y:-461,standY:20,secs:3},{id:'ant',name:'the third power pack',label:'POWER PACK',x:600,y:-104,standY:18,secs:3}];   // (since v124 the three power packs the tower needs, Bryan's plan: "carry's three large items to their correct positions to power the radio tower"; until v123 the transmitter, the receiver and the antenna, carried home)
const L4_SOCKETS=[{x:426,y:-330},{x:514,y:-348},{x:470,y:-376}];   // where they go: round the mast's foot
const L4_QUEEN={x:470,y:-666,hpK:.85,babies:3,babiesBig:6,roarBabies:2,roarBabiesBig:3};   // she comes up over the north edge; her young with her, more at each roar
const L4_SLAUGHTER={hunters:6,perMan:1,killT:14,milDmg:3};   // the militia torn apart as the squad comes up: hunters out of the vent and up their track; any man still up after killT s goes down anyway
const L4_PACKWAVE={every:28,n:2,nBig:3,max:4};   // while the packs are carried: her young out of the vent, every so often
let L4=null,l4Run=null;   // the hill while it's built; the mission's run (from the first step inside to the report)
const l4Done=()=>{try{const v=JSON.parse(localStorage.getItem(L4_KEY));return!!(v&&v.done);}catch(e){return false;}};   // (the HQ's roof: hqfloors.js)
const l4Busy=()=>MAPID==='l4'&&!!L4&&!!L4.zip;   // going down the zip line: no orders (input.js)

/* ---------- the map ---------- */
function l4Objects(){
  const o=[],O=(floor,kind,x,y,w,h,ex)=>{const q=Object.assign({kind,x,y,w,h,full:FULL.has(kind),floor},ex||{});o.push(q);return q;};
  // --- the plant: outer walls (the service door in the west, y 790-830), the rooms off the halls
  const P='PL';
  O(P,'owall',40,400,640,10);O(P,'owall',40,850,640,10);O(P,'owall',40,410,10,380);O(P,'owall',40,830,10,20);O(P,'owall',670,410,10,440);
  O(P,'iwall',120,410,10,50);O(P,'iwall',120,500,10,50);O(P,'iwall',120,600,10,90);O(P,'iwall',120,730,10,120);   // the west hall's east side: the staff room's door, the opening to the hall, the store's door
  O(P,'iwall',300,410,10,130);O(P,'iwall',490,410,10,130);
  O(P,'iwall',130,540,240,10);O(P,'iwall',410,540,150,10);O(P,'iwall',600,540,70,10);   // the north rooms' doors: control x 370-410, generator x 560-600
  O(P,'iwall',130,600,250,10);O(P,'iwall',420,600,190,10);O(P,'iwall',650,600,20,10);   // the south rooms': the fan hall x 380-420, the station x 610-650
  O(P,'iwall',290,610,10,240);O(P,'iwall',520,610,10,240);
  O(P,'liftwall',600,610,6,86);   // the lift's shaft, open to the south
  O(P,'table',176,452,60,36);O(P,'locker',136,412,90,10);O(P,'crate',262,500,22,20,{bonus:0});   // the staff room: a table, lockers, a case with the M203 in it
  O(P,'console',322,413,156,14);O(P,'desk',356,484,64,14);   // the control room: the camera screens along the north wall
  O(P,'xfmr',520,438,94,48,{gen:1});O(P,'console',630,413,32,12);O(P,'barrel',640,498,12,12);O(P,'barrel',654,512,12,12);O(P,'barrel',626,514,12,12);   // the generator, its panel, fuel
  O(P,'rack',138,616,140,14);O(P,'rack',138,826,140,14);O(P,'crate',150,640,26,24);O(P,'crate',180,744,24,22);O(P,'crate',234,722,22,20,{bonus:1});   // the store: shelves, crates, a long case with an M240 in it
  O(P,'ctank',318,770,64,70,{fanh:1});O(P,'ctank',440,770,64,70,{fanh:1});   // the fan hall's two great fans (the nest between them)
  // --- the stairs: a long climb north through the rock, the Crawler's chamber where it turns
  const S='ST';
  O(S,'owall',1066,240,10,640);O(S,'owall',1124,390,10,490);O(S,'owall',1076,870,48,10);
  O(S,'owall',1076,240,170,10);O(S,'owall',1134,380,180,10);O(S,'owall',1304,240,10,140);
  O(S,'owall',1236,-360,10,600);O(S,'owall',1294,-360,10,610);O(S,'owall',1246,-360,48,10);
  O(S,'rock',1150,262,22,16);O(S,'rock',1262,350,18,14);   // fallen slabs in the chamber
  // --- the summit
  const U='SU';
  // the radio building: the equipment room (the front door south, x 205-245) and the office (a side door east, y -530..-495), a doorway between them
  O(U,'owall',170,-560,190,10);O(U,'owall',170,-460,35,10);O(U,'owall',245,-460,115,10);O(U,'owall',170,-550,10,90);O(U,'owall',350,-550,10,20);O(U,'owall',350,-495,10,35);
  O(U,'iwall',265,-550,10,25);O(U,'iwall',265,-495,10,35);
  O(U,'cabinet',182,-550,44,14,{tx:1});O(U,'rack',232,-550,28,14);O(U,'desk',290,-550,50,16);O(U,'cabinet',330,-488,16,24);
  // the bunker over the lift (its door south, x 440-480) and the shaft's vent by it
  O(U,'owall',390,-230,140,10);O(U,'owall',390,-220,10,90);O(U,'owall',520,-220,10,90);O(U,'owall',390,-140,50,10);O(U,'owall',480,-140,50,10);
  O(U,'vent',L4_HATCH.x-12,L4_HATCH.y-12,24,24,{hatch:1});
  // the hut over the stairs (its door east, y -200..-160; room inside for everyone)
  O(U,'owall',100,-220,130,10);O(U,'owall',100,-210,10,70);O(U,'owall',100,-150,130,10);O(U,'owall',220,-210,10,10);O(U,'owall',220,-160,10,10);
  O(U,'container',262,-238,34,98,{col:'#4f565b',tag:'TGHU 5512'});   // a container screening the hut's door from their camp (the way out: round either end)
  // the mast's concrete base, their containers and generator, the receiver packed on a pallet, the antenna on a pallet
  O(U,'plinth',448,-352,44,44);
  O(U,'container',620,-560,110,34,{col:'#4a5230',tag:'CMAU 7241'});O(U,'container',620,-518,110,34,{col:'#5b2f2a',tag:'HLXU 3390'});
  O(U,'xfmr',760,-520,40,28,{gs:1});O(U,'barrel',768,-484,12,12);O(U,'barrel',784,-484,12,12);
  O(U,'pallet',636,-472,30,22,{rx:1});O(U,'pallet',492,-304,38,26,{ant:1});
  // the machine gun's nest over their track, sandbags by the bunker
  O(U,'sandbag',596,-672,70,10);O(U,'sandbag',596,-662,10,22);O(U,'sandbag',656,-662,10,22);
  O(U,'sandbag',418,-96,46,10);O(U,'sandbag',508,-78,40,10);
  for(const[x,y,w,h]of[[700,-430,22,20],[585,-432,20,20],[380,-470,22,20],[250,-440,20,20],[150,-400,20,18]])O(U,'crate',x,y,w,h);
  for(const[x,y,w,h]of[[260,-300,30,24],[330,-168,26,22],[640,-300,28,24],[720,-170,30,22],[226,-376,24,20],[588,-60,26,20],[300,6,30,22],[700,-360,26,22],[180,-60,28,20],[760,-80,24,20],[420,-620,26,20]])O(U,'rock',x,y,w,h);
  O(U,'cliff',168,-330,50,40,{full:true});O(U,'cliff',742,-262,46,40,{full:true});   // two big boulders
  O(U,'post',488,74,24,14,{pylon:1});   // the zip line's pylon on the edge
  // the edge: the drop all round the hilltop (blocks the way, not sight: there's nothing past it)
  const b=L4F.SU;
  for(let y=b.y0;y<b.y1;y+=20){const yc=y+10,xs=[];
    for(let i=0;i<SU_POLY.length;i++){const[ax,ay]=SU_POLY[i],[bx,by]=SU_POLY[(i+1)%SU_POLY.length];if((ay<=yc&&by>yc)||(by<=yc&&ay>yc))xs.push(ax+(yc-ay)*(bx-ax)/(by-ay));}
    if(!xs.length){O(U,'drop',b.x0,y,b.x1-b.x0,20);continue;}
    const xl=Math.min(...xs),xr=Math.max(...xs);if(xl>b.x0)O(U,'drop',b.x0,y,xl-b.x0,20);if(xr<b.x1)O(U,'drop',xr,y,b.x1-xr,20);}
  return o;
}
const inPoly=(x,y,P=SU_POLY)=>{let c=false;for(let i=0,j=P.length-1;i<P.length;j=i++){const[xi,yi]=P[i],[xj,yj]=P[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;};

/* ---------- their grounds ---------- */
function paintSU(x){
  const b=L4F.SU,r=rng(4404);x.clearRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);
  x.save();x.beginPath();x.moveTo(...SU_POLY[0]);for(const p of SU_POLY)x.lineTo(...p);x.closePath();x.clip();
  x.fillStyle='#3a3e35';x.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);
  for(let i=0;i<900;i++){const px=b.x0+r()*(b.x1-b.x0),py=b.y0+r()*(b.y1-b.y0),rr=8+r()*40;x.fillStyle=r()<.5?`rgba(70,80,56,${(.15+r()*.25).toFixed(2)})`:`rgba(24,25,22,${(.12+r()*.24).toFixed(2)})`;x.beginPath();x.ellipse(px,py,rr,rr*(.4+r()*.6),r()*3,0,7);x.fill();}   // tussock and bare rock
  for(let i=0;i<5200;i++){x.fillStyle=r()<.5?'rgba(200,205,190,.06)':'rgba(0,0,0,.28)';x.fillRect(b.x0+r()*(b.x1-b.x0),b.y0+r()*(b.y1-b.y0),r()*2+.4,r()*2+.4);}
  const track=(pts,w,c)=>{x.strokeStyle=c;x.lineWidth=w;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(...pts[0]);for(const p of pts.slice(1))x.lineTo(...p);x.stroke();};
  track([[630,-760],[630,-690],[600,-610],[560,-520],[520,-440],[470,-400]],40,'rgba(62,58,50,.85)');track([[630,-760],[630,-690],[600,-610],[560,-520],[520,-440],[470,-400]],2,'rgba(0,0,0,.35)');   // their track up the north side
  track([[232,-180],[300,-240],[400,-280],[470,-300]],14,'rgba(70,66,56,.55)');track([[225,-450],[300,-400],[420,-380]],14,'rgba(70,66,56,.55)');track([[460,-120],[480,-40],[500,40]],16,'rgba(70,66,56,.6)');   // worn paths
  const pad=(px,py,w,h,c)=>{x.fillStyle=c;x.fillRect(px,py,w,h);x.strokeStyle='rgba(0,0,0,.4)';x.lineWidth=1.5;x.strokeRect(px,py,w,h);};
  pad(164,-566,202,122,'#55585a');pad(384,-236,152,112,'#4e5153');pad(94,-226,142,92,'#4b4e50');pad(612,-566,126,96,'#3e403c');pad(440,-360,60,60,'#5d5f5c');   // concrete under the buildings, the containers, the mast
  {x.fillStyle='#4b4f4e';x.fillRect(180,-550,85,90);x.fillStyle='#575a58';x.fillRect(275,-550,75,90);}   // the radio building's floors
  hGrid(x,{x0:180,y0:-550,x1:265,y1:-460},15,.2);hGrid(x,{x0:275,y0:-550,x1:350,y1:-460},15,.2);
  {const c=L4_CAR.SU;x.fillStyle='#2a2d30';x.fillRect(c.x0,c.y0,c.x1-c.x0,c.y1-c.y0);hStripes(x,440,-150,40,8);}   // the lift's car in the bunker
  for(let i=0;i<22;i++){const px=120+r()*700,py=-640+r()*700;if(!inPoly(px,py))continue;puddle(x,'col',px,py,8+r()*26,5+r()*12,r()*3);}   // puddles
  x.fillStyle='rgba(0,0,0,.4)';for(const[gx,gy]of[[340,-460],[600,-460],[600,-200],[340,-200]]){x.beginPath();x.arc(gx,gy,5,0,7);x.fill();}   // the guy wires' anchors
  hShade(x,L4.objs.filter(o=>o.floor==='SU'&&o.kind!=='drop'&&o.kind!=='plinth'));
  x.restore();
  {const f=L4_FL.suDown;x.clearRect(f.x0,f.y0,f.x1-f.x0,f.y1-f.y0);}   // the hole the stairs go down
}
function paintPL(x){
  const b=L4F.PL,r=rng(5505);x.fillStyle='#08090a';x.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);
  const room=(q,c,s,a)=>{x.fillStyle=c;x.fillRect(q.x0,q.y0,q.x1-q.x0,q.y1-q.y0);if(s)hGrid(x,q,s,a);};
  room({x0:40,y0:400,x1:680,y1:860},'#2b2e30',0,0);
  room(PL_ROOMS.hall,'#3a3d3f',30,.16);room(PL_ROOMS.chall,'#3a3d3f',30,.16);room(PL_ROOMS.staff,'#3c3a33',20,.2);room(PL_ROOMS.ctrl,'#33393f',20,.22);
  room(PL_ROOMS.gen,'#34342f',40,.2);room(PL_ROOMS.store,'#36383a',40,.2);room(PL_ROOMS.fan,'#2a2724',40,.22);room(PL_ROOMS.stn,'#3b3e40',40,.2);
  for(let i=0;i<2600;i++){const px=50+r()*620,py=410+r()*440;x.fillStyle=r()<.5?'rgba(255,255,255,.03)':'rgba(0,0,0,.2)';x.fillRect(px,py,r()*2+.4,r()*2+.4);}
  for(let i=0;i<120;i++){const px=50+r()*620,py=410+r()*440,rr=3+r()*14,gr=x.createRadialGradient(px,py,0,px,py,rr);gr.addColorStop(0,'rgba(8,8,6,.3)');gr.addColorStop(1,'rgba(8,8,6,0)');x.fillStyle=gr;x.fillRect(px-rr,py-rr,rr*2,rr*2);}   // oil, damp
  {const g=x.createRadialGradient(570,462,0,570,462,60);g.addColorStop(0,'rgba(0,0,0,.55)');g.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=g;x.fillRect(500,410,170,130);}   // oil under the generator
  // the fan hall: her brood's floor, dark and veined
  {const q=PL_ROOMS.fan;for(let i=0;i<70;i++){const a=r()*6.28,d=20+r()*110;let px=410,py=705;x.strokeStyle=`rgba(14,10,8,${(.3+r()*.4).toFixed(2)})`;x.lineWidth=1+r()*3;x.beginPath();x.moveTo(px,py);
    for(let k=0;k<5;k++){px+=Math.cos(a+(r()-.5))*d/5;py+=Math.sin(a+(r()-.5))*d/5;x.lineTo(clamp(px,q.x0,q.x1),clamp(py,q.y0,q.y1));}x.stroke();}}
  hStripes(x,536,696,64,7);hStripes(x,612,732,48,7);hStripes(x,40,790,8,40);   // the lift's threshold, the foot of the stairs, the service door
  const dq=l4Dummy();bloodTrail(x,dq,[[52,812],[82,790],[90,700],[96,600],[140,576],[300,578],[400,590],[404,612]],606);bloodTrail(x,dq,[[300,572],[470,574],[600,584],[628,606],[632,660]],607);   // dragged in by the service door: to the fan hall, and on to the stairs
  bloodPool(x,dq,404,640,11,608);
  hShade(x,L4.objs.filter(o=>o.floor==='PL'));
}
function paintST(x){
  const b=L4F.ST,r=rng(6606);x.fillStyle='#060707';x.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);
  const legs=[{x0:1076,y0:390,x1:1124,y1:870},{x0:1246,y0:-350,x1:1294,y1:250}];
  x.fillStyle='#3a3d40';for(const q of legs)x.fillRect(q.x0,q.y0,q.x1-q.x0,q.y1-q.y0);
  x.fillStyle='#302f2b';x.fillRect(1076,250,228,130);   // the chamber: rough rock floor
  for(let i=0;i<1600;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.25)';x.fillRect(1076+r()*228,250+r()*130,r()*2.6+.4,r()*2.6+.4);}
  // the steps: every 9 a tread edge, a landing every 150 or so (flat); a worn path up the middle
  for(const q of legs){for(let y=q.y1-6;y>q.y0+6;y-=9){if(((q.y1-y)%160)<26)continue;x.fillStyle='rgba(0,0,0,.42)';x.fillRect(q.x0,y,q.x1-q.x0,2.4);x.fillStyle='rgba(190,160,70,.32)';x.fillRect(q.x0+3,y-1.2,q.x1-q.x0-6,1.1);}
    x.fillStyle='rgba(255,255,255,.04)';x.fillRect((q.x0+q.x1)/2-7,q.y0,14,q.y1-q.y0);}
  const dq=l4Dummy();for(let i=0;i<4;i++){const px=1110+r()*170,py=262+r()*110;bloodPool(x,dq,px,py,7+r()*8,620+i);}   // the Crawler's den: what it brought up
  bloodTrail(x,dq,[[1100,860],[1104,700],[1096,520],[1104,400],[1150,330],[1190,312]],630);
  hShade(x,L4.objs.filter(o=>o.floor==='ST'&&o.kind!=='owall'));
  {const f=L4_FL.stDown;x.clearRect(f.x0,f.y0,f.x1-f.x0,f.y1-f.y0);}
}

/* ---------- building it ---------- */
function disposeHill(){
  if(!L4||!L4.scene)return;
  L4.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.keep)o.geometry.dispose();});
  for(const t of L4.texs||[])t.dispose();L4=null;
}
// a lamp on a floor (scene.js's lamp pool lights the nearest on the floor on screen)
function l4Lamp(g,x,y,h,c,i,d,floor,o={}){const L=Object.assign({x,y,h,c,i,d,floor},o);L4.lamps.push(L);
  if(!o.noHead){const hd=new T.Mesh(new T.BoxGeometry(o.pole?6:7,1.6,o.pole?4:3),new T.MeshBasicMaterial({color:L.off?0x24262a:c,toneMapped:false}));hd.position.set(x,h+1,y);g.add(hd);L.head=hd;}
  if(o.pole){const pm=new T.Mesh(new T.CylinderGeometry(1.2,1.6,h+2,8),L4.mat.pole);pm.position.set(x,(h+2)/2,y);pm.castShadow=true;g.add(pm);}
  return L;}
// steel beams (a lattice): [ax,ay,az, bx,by,bz, thickness] merged into one mesh
function l4Beams(list,mat){
  const gs=[],m=new T.Matrix4(),q=new T.Quaternion(),z=new T.Vector3(0,0,1),d=new T.Vector3(),p=new T.Vector3(),s=new T.Vector3(1,1,1);
  for(const[ax,ay,az,bx,by,bz,t]of list){d.set(bx-ax,by-ay,bz-az);const L=d.length();d.normalize();q.setFromUnitVectors(z,d);p.set((ax+bx)/2,(ay+by)/2,(az+bz)/2);m.compose(p,q,s);const g=new T.BoxGeometry(t,t,L);g.applyMatrix4(m);gs.push(g);}
  const mesh=new T.Mesh(crMerge(gs),mat);mesh.castShadow=true;return mesh;}
function buildHill(){
  disposeHill();
  L4={objs:l4Objects(),lamps:[],scene:null,lights:null,groups:null,flights:Object.values(L4_FL),texs:[],mat:null,built:false,
    parts:L4_PARTS.map(p=>Object.assign({},p,{holder:null,gone:false,ox:p.x,oy:p.y})),bonus:l4Run&&l4Run.found?l4Run.found.slice():[false,false],   // (the finds stay found if they go out and come back in)
    intel:false,power:false,cams:false,
    ride:null,heardT:0,heard:[],wave:null,waveQ:[],woke:false,lifted:false,crawler:null,brood:[],mil:[],clear:false,zip:null,been:{SU:false},nest:null,camFeed:null};
  for(const z of L4.flights)L4.objs.push(...flightRails(z,z.floor));
  L4.objs.push(...voidRects([L4F.SU,L4F.PL,L4F.ST],NAV_W));
  const sc=new T.Scene();sc.background=new T.Color(L4_LOOK.PL.bg);sc.fog=new T.FogExp2(L4_LOOK.PL.bg,L4_LOOK.PL.fog);L4.scene=sc;
  const G={SU:new T.Group(),PL:new T.Group(),ST:new T.Group()};for(const k in G)sc.add(G[k]);L4.groups=G;
  const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.1},o)),ML=c=>new T.MeshLambertMaterial({color:c});
  const mat=L4.mat={wall:ML(0x3d434a),owall:ML(0x30363b),cap:ML(0x8a9097),rockw:ML(0x3a3833),conc:ML(0x6e706c),bunker:ML(0x5a5c58),steel:M(0x5b636a,{metalness:.65,roughness:.38}),dark:M(0x1f2327,{metalness:.4,roughness:.5}),
    wood:ML(0x6a5038),olive:ML(0x4b5536),locker:M(0x58623f,{metalness:.45,roughness:.5}),seat:ML(0x23282d),hazard:M(0xc8a02a),pole:M(0x1d2124,{roughness:.6,metalness:.6}),
    lattice:M(0x6d6a62,{metalness:.55,roughness:.5}),cable:M(0x15171a,{roughness:.5,metalness:.4}),
    screen:new T.MeshBasicMaterial({color:0x5fb8e8,toneMapped:false}),red:new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}),green:new T.MeshBasicMaterial({color:0x37e08a,toneMapped:false}),amber:new T.MeshBasicMaterial({color:0xffa83a,toneMapped:false})};
  const keep=scene;scene=sc;
  try{
    const S=1.2;L4.texs.push(hGround(G.SU,L4F.SU,S,paintSU,true),hGround(G.PL,L4F.PL,S,paintPL,false),hGround(G.ST,L4F.ST,S,paintST,false));
    L4.gS={SU:S,PL:S,ST:S};
    const fm={step:ML(0x5a5f65),nose:ML(0xb79a3c),pit:ML(0x16191c),rail:M(0x8a9097,{metalness:.6,roughness:.4})};
    for(const z of L4.flights)buildFlight(z,G[z.floor],fm);
    l4PlantLook(G.PL,mat);l4StairsLook(G.ST,mat);l4SummitLook(G.SU,mat);
    const hemi=new T.HemisphereLight(0x7d8a9a,0x14110e,L4_LOOK.PL.hemi);hemi.userData.base=L4_LOOK.PL.hemi;sc.add(hemi);
    const moon=new T.DirectionalLight(0x9fb4ff,0);moon.position.set(200,620,-700);moon.target.position.set(460,0,-300);
    const phone=matchMedia('(pointer:coarse)').matches;moon.castShadow=true;moon.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);
    Object.assign(moon.shadow.camera,{left:-560,right:560,top:560,bottom:-560,near:50,far:2000});moon.shadow.bias=-0.0008;sc.add(moon,moon.target);
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
    L4.lights={hemi,moon,lampPool:pool,muzzle:mz,boomL:bl};
  }finally{scene=keep;meshOwner=null;}
  L4.built=true;
}
// the plant: walls cut away low, the rooms' things, the lift and the foot of the stairs, the fans and her brood's nest
function l4PlantLook(g,m){
  const fl=L4.objs.filter(o=>o.floor==='PL');
  for(const o of fl){if(o.kind==='owall')hWall(g,o,m.owall,m.cap,15);else if(o.kind==='iwall')hWall(g,o,m.wall,m.cap,13);else if(o.kind==='liftwall')hWall(g,o,m.steel,m.dark,15);}
  const keepS=scene;scene=g;try{meshObjs(fl.filter(o=>['crate','barrel','rack'].includes(o.kind)));}finally{scene=keepS;}
  for(const o of fl){const cx=o.x+o.w/2,cz=o.y+o.h/2;
    if(o.kind==='table'){hBox(g,o.w,1.4,o.h,m.wood,cx,7.6,cz);hBox(g,o.w-8,6.6,o.h-10,m.dark,cx,3.3,cz);for(const s of[-1,1])for(let k=0;k<2;k++)hBox(g,6,5,6,m.seat,cx-14+k*28,2.5,cz+s*(o.h/2+6));hBox(g,8,2,6,m.olive,cx-10,9.2,cz);}
    else if(o.kind==='locker'){for(let k=0;k<Math.floor(o.w/18);k++){const x=o.x+9+k*18;hBox(g,17,18,o.h,m.locker,x,9,cz);hBox(g,1,7,.4,m.dark,x+4,11,o.y+o.h+.2);}}
    else if(o.kind==='console'){hBox(g,o.w,9,o.h,m.dark,cx,4.5,cz);const n=Math.max(1,Math.floor(o.w/26));for(let k=0;k<n;k++){const sx=o.x+13+k*26;hBox(g,20,11,1.2,m.dark,sx,15,o.y+2);
      const s=new T.Mesh(new T.PlaneGeometry(18,9),o.x<600?l4FeedMat():m.red);s.position.set(sx,15,o.y+2.8);g.add(s);if(o.x<600)(L4.screens=L4.screens||[]).push(s);}}
    else if(o.kind==='desk'){hBox(g,o.w,1.2,o.h,m.wood,cx,8,cz);hBox(g,o.w-6,7.4,o.h-4,m.dark,cx,3.7,cz);for(let k=0;k<3;k++)hBox(g,6,5,6,m.seat,o.x+12+k*20,2.5,o.y+o.h+8);}
    else if(o.gen){const b=hBox(g,o.w,20,o.h,M2(0x4c5a3a),cx,10,cz);o.meshes=[b];hBox(g,o.w-10,4,o.h-10,m.dark,cx,22,cz);const ex=new T.Mesh(new T.CylinderGeometry(2.4,2.4,18,10),m.dark);ex.position.set(o.x+12,30,o.y+10);g.add(ex);
      for(const s of[-1,1])hBox(g,3,14,o.h+4,m.dark,cx+s*(o.w/2-6),7,cz);
      L4.genLight=new T.Mesh(new T.SphereGeometry(1.4,10,8),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));L4.genLight.position.set(646,15,416);g.add(L4.genLight);}
    else if(o.fanh){const d=new T.Mesh(new T.CylinderGeometry(30,30,o.h,22,1,true),M2(0x55595b,{metalness:.6,roughness:.45}));d.rotation.x=Math.PI/2;d.position.set(cx,31,cz);d.material.side=T.DoubleSide;d.castShadow=true;g.add(d);o.meshes=[d];
      const face=new T.Mesh(new T.CircleGeometry(28,22),M2(0x141617));face.position.set(cx,31,o.y+2);face.rotation.y=Math.PI;g.add(face);
      for(let k=0;k<6;k++){const bl=hBox(g,5,26,1,m.steel,cx,31,o.y+1);bl.rotation.z=k*Math.PI/3;}
      for(const s of[-1,1])hBox(g,6,4,o.h-10,m.dark,cx+s*22,2,cz);}
  }
  // the service door (west): a steel door standing open, a green sign over it; the doorway's frame
  hBox(g,1.2,14,4,m.steel,44,7,786);hBox(g,1.2,14,4,m.steel,44,7,834);hBox(g,3,2,48,m.steel,44,15,810);
  {const d=hBox(g,1,14,38,M2(0x56606a,{metalness:.6,roughness:.5}),58,7,792);d.rotation.y=-1.2;d.position.set(62,7,808);}
  hBox(g,.8,2.4,10,m.green,50,17.5,810).castShadow=false;
  // the lift: the car's floor, its doors slid open, a call panel (red without power)
  {const c=L4_CAR.PL;hBox(g,c.x1-c.x0,.4,c.y1-c.y0,m.dark,(c.x0+c.x1)/2,.2,(c.y0+c.y1)/2);hBox(g,c.x1-c.x0+12,3,8,m.steel,(c.x0+c.x1)/2,16.5,c.y1-3);
    for(const s of[-1,1])hBox(g,8,15,2,m.steel,(c.x0+c.x1)/2+s*((c.x1-c.x0)/2-4),7.5,c.y1-1);
    hBox(g,4,4,1.2,m.dark,606,9,700);L4.liftLight=new T.Mesh(new T.BoxGeometry(1,1,.8),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));L4.liftLight.position.set(606,10,701);g.add(L4.liftLight);}
  // pipes along the halls' walls
  {const pm=M2(0x4a4f52,{metalness:.5,roughness:.5});for(const[x0,z0,x1,z1,y]of[[130,553,670,553,11],[130,556,670,556,7],[53,420,53,780,12],[117,420,117,600,9]]){const len=Math.hypot(x1-x0,z1-z0),p=new T.Mesh(new T.CylinderGeometry(1.2,1.2,len,8),pm);p.position.set((x0+x1)/2,y,(z0+z1)/2);if(z0===z1)p.rotation.z=Math.PI/2;else p.rotation.x=Math.PI/2;g.add(p);}}
  // the fan hall: her brood's nest (creatures.js's resin, creep and eggs)
  L4.nest=l4Nest(g);
  // light: red emergency lamps (always), white ones that come on with the generator, the nest's amber glow
  for(const[x,y]of[[85,600],[400,575],[598,640],[85,822]])l4Lamp(g,x,y,13,0xff3020,.75,110,'PL',{flick:x===400?1:0});
  for(const[x,y]of[[215,475],[400,476],[585,476],[85,480],[85,700],[250,575],[550,575],[210,730],[600,770]])l4Lamp(g,x,y,26,0xf2f0e6,1.35,190,'PL',{off:true,power:1});
  l4Lamp(g,410,705,18,0xd88a3e,.75,150,'PL',{noHead:true});
}
const M2=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.1},o));
let l4DQ=null;const l4Dummy=()=>l4DQ||(l4DQ=document.createElement('canvas').getContext('2d'));   // (the blood's roughness strokes: these floors have no roughness picture)
// the control room's screens: the summit from its cameras (grainy, a red dot for each man)
function l4FeedMat(){
  if(L4.camFeed)return L4.camFeed;
  const t=canvasTex(160,80,(x,w,h)=>{x.fillStyle='#0b1a12';x.fillRect(0,0,w,h);const r=rng(77);for(let i=0;i<600;i++){x.fillStyle=`rgba(140,220,170,${(r()*.15).toFixed(2)})`;x.fillRect(r()*w,r()*h,1,1);}
    x.strokeStyle='rgba(150,230,180,.65)';x.lineWidth=1.5;x.beginPath();x.moveTo(80,8);x.lineTo(70,70);x.moveTo(80,8);x.lineTo(90,70);for(let y=18;y<70;y+=10){x.moveTo(80-(y-8)*.16,y);x.lineTo(80+(y-8)*.16,y);}x.stroke();
    x.fillStyle='rgba(150,230,180,.5)';x.fillRect(12,48,36,18);x.fillRect(116,44,34,14);x.fillStyle='#ff5040';for(const[px,py]of[[30,44],[58,62],[110,60],[130,40],[80,6]]){x.fillRect(px,py,3,3);}
    x.fillStyle='rgba(180,240,200,.8)';x.font='8px monospace';x.fillText('CAM 2 · SUMMIT',4,9);});
  L4.camFeed=new T.MeshBasicMaterial({map:t,toneMapped:false});return L4.camFeed;}
// the fan hall's nest: resin down its walls, creep over its floor, three clutches of eggs (a group with userData.eggs, so crEggBurst can split them)
function l4Nest(g){
  const goo=crGooMat(),grp=new T.Group();g.add(grp);const r=rng(4141),gooG=[],creepG=[];
  const cm=crMat('creep',{nmap:crNormalTex('goo',512,crGooH),ns:.22,rough:.3,coat:1,coatR:.12,env:.7,rimK:.04,rim:0x8a7056});
  const drape=(len,px,pz,ry,sd)=>{const gg=crDrape(len,14+r()*10,sd),o=new T.Object3D();o.rotation.y=ry;o.position.set(px,0,pz);o.updateMatrix();gg.applyMatrix4(o.matrix);gooG.push(gg);};
  drape(240,300.2,850,Math.PI/2,11.3);drape(240,519.8,610,-Math.PI/2,12.7);drape(220,520,849.8,Math.PI,13.1);drape(60,300,610.2,0,14.9);
  creepG.push(crCreep(410,705,96,74,0,1.3,2.2),crCreep(345,662,46,32,.4,2.4,1.6),crCreep(478,668,44,30,-.3,3.1,1.6),crCreep(402,628,26,14,0,4.2,1.1));
  for(let i=0;i<5;i++){const a=new T.Vector3(380+i*10,8+r()*12,603),b=new T.Vector3(386+i*8,6+r()*12,620+r()*8);gooG.push(crStrand(a,b,.22+r()*.3,3+r()*5));}   // strands across the door
  {const mm=new T.Mesh(crMerge(gooG),goo);mm.receiveShadow=true;grp.add(mm);const c=new T.Mesh(crMerge(creepG),cm);c.receiveShadow=true;grp.add(c);}
  const eggs=[],clutches=[],cl=(x,z,R,n,sz,sd)=>{const a=eggs.length;crClutch(x,z,R,n,sz,sd,eggs);clutches.push({x,z,R,a,b:eggs.length});};
  cl(410,712,22,60,2.2,81);cl(345,662,14,26,2,82);cl(478,668,14,26,2,83);
  const eg=new T.SphereGeometry(1,8,6);{const p=eg.attributes.position,C=[];for(let i=0;i<p.count;i++){const y=p.getY(i);C.push(...crMix(crLin('#4e473d'),crLin('#a39a86'),crS(-.9,.8,y)));}eg.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  const E=new T.InstancedMesh(eg,crEggMat(),eggs.length),m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler();E.receiveShadow=true;E.frustumCulled=false;
  const white=new T.Color(1,1,1);eggs.forEach((e,i)=>{q4.setFromEuler(e4.set(e.rx,e.ry,0));m4.compose(new T.Vector3(e.x,e.y,e.z),q4,new T.Vector3(e.s,e.s*1.22,e.s));E.setMatrixAt(i,m4);E.setColorAt(i,white);});grp.add(E);
  grp.userData.eggs={list:eggs,mesh:E,clutches};return grp;
}
// the stairs: rock-hewn walls cut away low, a handrail up the west side, cable trays up the east, dead lights, red emergency lamps
function l4StairsLook(g,m){
  const fl=L4.objs.filter(o=>o.floor==='ST');
  const rw=texMat(canvasTex(128,64,(x,w,h)=>{x.fillStyle='#4a4842';x.fillRect(0,0,w,h);const r=rng(91);for(let i=0;i<500;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.25)';x.fillRect(r()*w,r()*h,1+r()*4,1+r()*3);}
    const gr=x.createLinearGradient(0,h*.5,0,h);gr.addColorStop(0,'rgba(20,18,15,0)');gr.addColorStop(1,'rgba(20,18,15,.7)');x.fillStyle=gr;x.fillRect(0,0,w,h);}),4,1,{roughness:.95});
  for(const o of fl)if(o.kind==='owall')hWall(g,o,rw,m.cap,16);
  const L=[];const rr=rng(707);for(const o of fl)if(o.kind==='rock'){const sy=5+rr()*3;L.push([o.x+o.w/2,o.y+o.h/2,o.w*.62,sy,o.h*.62,rr()*6,(rr()*1e4)|0,sy*.42]);}
  for(let k=0;k<10;k++){const sy=4+rr()*6;L.push([1090+rr()*200,256+rr()*10,8+rr()*8,sy,6+rr()*6,rr()*6,(rr()*1e4)|0,sy*.3]);}   // scree along the chamber's walls
  g.add(rockMesh(L));
  // the handrail (west side) and the cable trays (east side) up both legs
  const legs=[{x0:1076,y0:392,x1:1124,y1:868},{x0:1246,y0:-348,x1:1294,y1:248}],rail=[],tray=[];
  for(const q of legs){rail.push([q.x0+2,9,q.y0,q.x0+2,9,q.y1,.8]);for(let y=q.y0+10;y<q.y1;y+=40)rail.push([q.x0+2,0,y,q.x0+2,9,y,.7]);tray.push([q.x1-2,12,q.y0,q.x1-2,12,q.y1,2.2],[q.x1-2,13.4,q.y0,q.x1-2,13.4,q.y1,.9]);}
  g.add(l4Beams(rail,m.steel));g.add(l4Beams(tray,m.dark));
  const dead=new T.MeshStandardMaterial({color:0x2a2c2e,roughness:.5,metalness:.4});
  for(const q of legs)for(let y=q.y0+30;y<q.y1;y+=70){const dm=new T.Mesh(new T.BoxGeometry(1.2,2,6),dead);dm.position.set(q.x1-.8,14,y);g.add(dm);}
  for(const[x,y]of[[1100,720],[1100,470],[1190,316],[1270,140],[1270,-60],[1270,-250]])l4Lamp(g,x<1200?(x<1150?1123:x):1293,y,13,0xff3020,x===1190?.5:.7,110,'ST',{flick:x===1270&&y===40?1:0});
  // the Crawler's den: resin on the chamber's walls, two of the dead it dragged up
  {const goo=crGooMat(),gs=[],r=rng(2121);const drape=(len,px,pz,ry,sd)=>{const gg=crDrape(len,10+r()*8,sd),o=new T.Object3D();o.rotation.y=ry;o.position.set(px,0,pz);o.updateMatrix();gg.applyMatrix4(o.matrix);gs.push(gg);};
    drape(170,1076,250.2,0,21.1);drape(160,1304,379.8,Math.PI,22.3);drape(120,1303.8,250,-Math.PI/2,23.7);
    const mm=new T.Mesh(crMerge(gs),goo);mm.receiveShadow=true;g.add(mm);}
  l4Dead(g,[[1146,346,2.4,'#3c4a5a'],[1238,292,-.6,'#6a4a3a']]);
}
// the dead (people posed once where they fell; no units)
function l4Dead(g,list){
  const keepS=scene;scene=g;
  try{list.forEach(([x,y,a,cloth],i)=>{const u={side:'C',team:'C',kind:'prisoner',id:'LD'+i,name:'The dead',x,y,ang:a,path:[],dead:true,hp:0,cloth};makeFigure(u);
    const mm=u.m;mm.ring.visible=false;mm.g.position.set(x,0,y);mm.g.rotation.y=-a;figAnimate(u,mm);});}finally{scene=keepS;}
}
// the summit: the radio building, the bunker over the lift, the hut over the stairs, the old mast, their camp, the zip line, the edge
function l4SummitLook(g,m){
  const fl=L4.objs.filter(o=>o.floor==='SU');
  for(const o of fl){
    if(o.kind==='owall'){const bunk=o.x>=390&&o.x<=520&&o.y>=-230&&o.y<=-140,hut=o.x<=220&&o.y>=-220&&o.y<=-150;hWall(g,o,bunk?m.bunker:hut?m.conc:m.owall,m.cap,bunk?20:15);}
    else if(o.kind==='iwall')hWall(g,o,m.wall,m.cap,13);}
  const keepS=scene;scene=g;try{meshObjs(fl.filter(o=>['crate','barrel','sandbag','container','pallet'].includes(o.kind)));}finally{scene=keepS;}
  // inside the radio building: the transmitter's rack (dials glowing), old equipment, the office desk with the radio set, a filing cabinet
  for(const o of fl){const cx=o.x+o.w/2,cz=o.y+o.h/2;
    if(o.tx){o.meshes=[hBox(g,o.w,22,o.h,m.dark,cx,11,cz)];const tx=new T.Group();g.add(tx);hBox(tx,o.w-8,8,4,M2(0x6c7074,{metalness:.5,roughness:.4}),cx,12,o.y+o.h+1);
      for(let k=0;k<4;k++){const d=new T.Mesh(new T.CircleGeometry(1.3,10),k%2?m.amber:m.green);d.position.set(o.x+8+k*9,12.5,o.y+o.h+3.1);tx.add(d);}L4.partMesh={tx};}
    else if(o.kind==='rack'){o.meshes=[hBox(g,o.w,20,o.h,m.dark,cx,10,cz)];for(let k=0;k<3;k++)hBox(g,o.w-4,3,1,m.steel,cx,5+k*6,o.y+o.h+.6);}
    else if(o.kind==='desk'){hBox(g,o.w,1.2,o.h,m.wood,cx,8,cz);hBox(g,o.w-6,7.4,o.h-4,m.dark,cx,3.7,cz);hBox(g,16,7,9,M2(0x3e4438),cx-8,12.2,cz);const dl=new T.Mesh(new T.PlaneGeometry(10,3),m.amber);dl.position.set(cx-8,13,cz+4.6);g.add(dl);
      const log=hBox(g,7,1.2,9,M2(0x2c5a7a),cx+12,9.2,cz+3);L4.logMesh=log;hBox(g,6,5,6,m.seat,cx,2.5,o.y+o.h+8);}
    else if(o.kind==='cabinet'){o.meshes=[hBox(g,o.w,18,o.h,M2(0x5a5f55,{metalness:.4}),cx,9,cz)];}
    else if(o.kind==='xfmr'&&o.gs){o.meshes=[hBox(g,o.w,13,o.h,M2(0x7a6a2a,{metalness:.4,roughness:.5}),cx,6.5,cz)];hBox(g,o.w-6,3,o.h-6,m.dark,cx,14.5,cz);}
    else if(o.kind==='plinth'){hBox(g,o.w,3,o.h,m.conc,cx,1.5,cz);}
    else if(o.kind==='vent'){o.meshes=[hBox(g,o.w,5,o.h,m.conc,cx,2.5,cz)];const gr=hBox(g,o.w-4,.8,o.h-4,m.steel,cx,5.4,cz);L4.hatch=gr;for(let k=-2;k<=2;k++)hBox(g,1,.6,o.h-5,m.dark,cx+k*4,5.9,cz);}
    else if(o.pylon){}   // (below)
  }
  // the parts on show: the receiver (packed, strapped on its pallet: a grey set with its dials), the antenna taken down at the
  // mast's foot (a yagi: a boom with its elements across, its mount)
  {const p=L4.parts.find(q=>q.id==='rx'),a=new T.Group();g.add(a);hBox(a,18,9,12,M2(0x5a5f62,{metalness:.5,roughness:.45}),p.x,7.5,p.y-3);hBox(a,16,6,.6,m.dark,p.x,8,p.y+3.2);
    for(let k=0;k<3;k++){const d=new T.Mesh(new T.CircleGeometry(1.2,10),k===1?m.amber:m.green);d.position.set(p.x-5+k*5,8.5,p.y+3.6);a.add(d);}hBox(a,1.2,6,1.2,m.steel,p.x+7,14,p.y-6);   // (its own whip on top)
    for(const s2 of[-1,1])hBox(a,.6,9.4,12.4,m.olive,p.x+s2*6,7.6,p.y-3);L4.partMesh.rx=a;}
  {const p=L4.parts.find(q=>q.id==='ant'),a=new T.Group();g.add(a);hBox(a,16,9,12,M2(0x3c4248,{metalness:.5,roughness:.45}),p.x,4.5,p.y);hBox(a,16.4,1.6,12.4,M2(0xd8b030),p.x,6,p.y);   // (a power pack by the bunker's sandbags)
    for(const s2 of[-1,1])hBox(a,1,2,6,m.dark,p.x+s2*8.4,9,p.y);L4.partMesh.ant=a;}
  // the sockets round the mast's foot: dark housings with a yellow ring, a pack's lights when one's in
  L4.sockets=L4_SOCKETS.map(S=>{const a=new T.Group();g.add(a);hBox(a,18,2,14,m.dark,S.x,1,S.y);const r=new T.Mesh(new T.RingGeometry(9,10.4,24),new T.MeshBasicMaterial({color:0xd8b030,toneMapped:false,side:T.DoubleSide}));r.rotation.x=-Math.PI/2;r.position.set(S.x,2.2,S.y);a.add(r);
    const pk=new T.Group();a.add(pk);hBox(pk,16,9,12,M2(0x3c4248,{metalness:.5,roughness:.45}),S.x,6.5,S.y);hBox(pk,16.4,1.6,12.4,M2(0xd8b030),S.x,8,S.y);const lt=new T.Mesh(new T.BoxGeometry(2,1,1),new T.MeshBasicMaterial({color:0x37e08a,toneMapped:false}));lt.position.set(S.x,11.6,S.y+6.4);pk.add(lt);pk.visible=false;
    return Object.assign({},S,{pack:null,mesh:pk,ring:r});});
  // the bunker: the lift's call panel, the car's floor
  hBox(g,4,4,1.2,m.dark,486,9,-139);L4.liftLight2=new T.Mesh(new T.BoxGeometry(1,1,.8),m.red.clone());L4.liftLight2.position.set(486,10,-138.2);g.add(L4.liftLight2);
  {const c=L4_CAR.SU;hBox(g,c.x1-c.x0,.4,c.y1-c.y0,m.dark,(c.x0+c.x1)/2,.2,(c.y0+c.y1)/2);}
  // the mast: four legs tapering from the plinth, braced, a platform at elev, dishes, a red beacon on top; guy wires
  {const X=L4_MAST.x,Z=L4_MAST.y,H=96,b0=18,b1=4,lv=[0,14,28,42,56,70,84,96],w=y=>b0+(b1-b0)*y/H,L=[];
   const c=(sx,sz,y)=>[X+sx*w(y),y,Z+sz*w(y)];const cs=[[-1,-1],[1,-1],[1,1],[-1,1]];
   for(const[sx,sz]of cs)L.push([...c(sx,sz,0),...c(sx,sz,H),1.6]);
   for(let i=0;i<lv.length-1;i++){const y0=lv[i],y1=lv[i+1];for(let k=0;k<4;k++){const[a1,a2]=cs[k],[b1x,b2x]=cs[(k+1)%4];L.push([...c(a1,a2,y0),...c(b1x,b2x,y1),.7],[...c(b1x,b2x,y0),...c(a1,a2,y1),.7],[...c(a1,a2,y1),...c(b1x,b2x,y1),.8]);}}
   for(const[gx,gz]of[[340,-460],[600,-460],[600,-200],[340,-200]])L.push([X+(gx>X?1:-1)*w(70),70,Z+(gz>Z?1:-1)*w(70),gx,0,gz,.35]);   // the guy wires
   g.add(l4Beams(L,m.lattice));
   const E=L4_MAST.elev;hBox(g,26,1.2,26,m.steel,X,E-1,Z);for(const[s1,s2]of[[1,0],[-1,0],[0,1],[0,-1]])hBox(g,s1?1:26,6,s2?1:26,m.steel,X+s1*13,E+3,Z+s2*13);
   for(const[a,y]of[[.6,80],[2.6,66]]){const d=new T.Mesh(new T.CylinderGeometry(6,6,1.4,16),M2(0xb8bab4,{metalness:.3}));d.rotation.z=Math.PI/2;d.rotation.y=a;d.position.set(X+Math.cos(a)*6,y,Z-Math.sin(a)*6);g.add(d);}
   const bc=new T.Mesh(new T.SphereGeometry(1.8,10,8),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));bc.position.set(X,H+2,Z);g.add(bc);L4.beacon=bc;}
  // the zip line: an A-frame on the edge, the cable out over the drop and down into the dark towards the bridge
  {const p=L4_PYLON,L=[[p.x-10,0,p.y-6,p.x,34,p.y,1.4],[p.x+10,0,p.y-6,p.x,34,p.y,1.4],[p.x-10,0,p.y+6,p.x,34,p.y,1.4],[p.x+10,0,p.y+6,p.x,34,p.y,1.4],[p.x-6,14,p.y,p.x+6,14,p.y,.8]];
   g.add(l4Beams(L,m.steel));const cab=l4Beams([[p.x,33,p.y,p.x+60,-260,p.y+1100,.5]],m.cable);cab.castShadow=false;g.add(cab);
   const wh=new T.Mesh(new T.CylinderGeometry(2.2,2.2,1.4,12),m.steel);wh.rotation.x=Math.PI/2;wh.position.set(p.x,33,p.y+1);g.add(wh);}
  // the edge: boulders along it and the rock falling away below; far below, the dark
  {const r=rng(808),L=[];
   for(let i=0;i<SU_POLY.length;i++){const[ax,ay]=SU_POLY[i],[bx,by]=SU_POLY[(i+1)%SU_POLY.length],n=Math.ceil(Math.hypot(bx-ax,by-ay)/26);
     for(let k=0;k<n;k++){const t=(k+r())/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;if(y<-728)continue;const nx=-(by-ay),ny=bx-ax,nl=Math.hypot(nx,ny)||1,ox=nx/nl,oy=ny/nl;   // (outward: clockwise in the frame)
       const sy=6+r()*10;L.push([x+ox*4,y+oy*4,10+r()*10,sy,9+r()*8,r()*6,(r()*1e4)|0,sy*.2]);
       const sy2=30+r()*30;L.push([x+ox*(22+r()*16),y+oy*(22+r()*16),22+r()*14,sy2,20+r()*12,r()*6,(r()*1e4)|0,-sy2*.9]);}}
   for(const o of fl)if(o.kind==='rock'||o.kind==='cliff'){const big=o.kind==='cliff',sy=big?22+r()*10:6+r()*3;L.push([o.x+o.w/2,o.y+o.h/2,o.w*.62,sy,o.h*.62,r()*6,(r()*1e4)|0,sy*(big?.35:.42)]);}
   g.add(rockMesh(L));
   const far=new T.Mesh(new T.PlaneGeometry(3200,3000),new T.MeshStandardMaterial({color:0x0a0d0e,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(460,-160,-300);g.add(far);}
  // light: floodlights on poles round their camp, the radio building, the hut's door, the zip line, the genset
  for(const[x,y]of[[300,-420],[650,-420],[470,-86],[624,-606]])l4Lamp(g,x,y,30,0xc4d6ff,2.2,260,'SU',{pole:1});
  l4Lamp(g,226,-500,16,0xffd9a8,1.4,140,'SU');l4Lamp(g,312,-500,16,0xffd9a8,1.2,130,'SU');l4Lamp(g,790,-498,14,0xffb060,1.1,120,'SU',{flick:1});
  l4Lamp(g,238,-180,14,0xffe2b0,.9,110,'SU');l4Lamp(g,510,58,18,0xffc98a,1.1,140,'SU');
}

/* ---------- which floor is on screen ---------- */
function setL4Floor(id,at){
  if(MAPID!=='l4'||!L4||!L4F[id])return;curFloor=id;const b=L4F[id],o=L4_LOOK[id];
  for(const k in L4.groups)L4.groups[k].visible=k===id;
  VB={x0:b.x0,z0:b.y0,x1:b.x1,z1:b.y1};FIT.w=b.x1-b.x0+40;FIT.h=b.y1-b.y0+40;fitDist();
  const L=L4.lights,hb=id==='PL'&&L4.power?.3:o.hemi;if(L){L.hemi.userData.base=hb;L.hemi.intensity=hb;L.moon.intensity=o.moon;}
  L4.scene.background.setHex(o.bg);L4.scene.fog.color.setHex(o.bg);L4.scene.fog.density=o.fog;
  camT=at?{x:at.x,z:at.y}:{x:(b.x0+b.x1)/2,z:(b.y0+b.y1)/2};clampCam();updateCamera();floorChip();
}

/* ---------- who's up there, and what lives in the rock ---------- */
function spawnHill(summitClear){
  L4.mil=[];L4.brood=[];
  const big=players.filter(p=>alive(p)&&!p.offMap).length>5;
  if(!summitClear){
    const G=(id,x,y,ang,zone,o={})=>{const u=hostile(id,x,y,Object.assign({ang,zone,jumpy:false,dmgIn:L4_SLAUGHTER.milDmg,helm:true,l4:true,doomed:true},o));L4.mil.push(u);return u;};   // (doomed since v124: they never notice the squad, and the brood tears through them: below)
    G('S1',L4_MAST.x,L4_MAST.y,-Math.PI/2,null,{name:'Sniper',post:true,elev:L4_MAST.elev,weapon:'sniper',eye:{r:620,cone:.75}});   // up the mast, watching their track
    {const u=mgGunner('M1',630,-650);Object.assign(u,{ang:-Math.PI/2,dmgIn:L4_SLAUGHTER.milDmg,helm:true,l4:true,jumpy:false,doomed:true});L4.mil.push(u);}   // over their track up the north side
    G('R1',318,-526,-Math.PI/2,{x0:278,y0:-528,x1:346,y1:-466},{radio:true});   // the radio man at his desk (his back to the doorways)
    G('R2',222,-496,Math.PI/2,{x0:186,y0:-528,x1:262,y1:-466});                 // the equipment room, watching the front door
    G('C1',602,-468,0,{x0:560,y0:-500,x1:800,y1:-420});G('C2',690,-468,Math.PI,{x0:560,y0:-500,x1:800,y1:-420});   // by their containers, talking over the receiver they packed
    G('P1',380,-420,0,{x0:360,y0:-440,x1:580,y1:-230},{route:[{x:380,y:-420},{x:560,y:-420},{x:560,y:-250},{x:380,y:-250}],ri:0});   // round the mast
    G('B1',460,-110,Math.PI/2,{x0:380,y0:-125,x1:560,y1:-50});   // at the bunker's door
    G('Z1',612,28,-2.4,{x0:430,y0:-20,x1:690,y1:60});            // by the zip line, out on the edge
    if(big){G('N1',432,-600,-.7,{x0:380,y0:-660,x1:560,y1:-560});G('N2',790,-340,Math.PI,{x0:740,y0:-420,x1:840,y1:-260});}
  }
  // the brood in the fan hall, asleep among her eggs
  const ys=[[400,732],[345,690],[470,700],[430,648],[410,806]].slice(0,big?L4_BROOD.youngBig:L4_BROOD.young);
  for(const[x,y]of ys){const h=hound(x,y,{kind:'young',dormant:true,ang:Math.random()*6.28,l4nest:true});L4.brood.push(h);}
  // the Crawler, in its chamber halfway up the stairs
  if(!(l4Run&&l4Run.crawlerDead)){const up=players.filter(p=>alive(p)&&!p.offMap).length,hp=L4_CRAWLER.hp+L4_CRAWLER.perMan*up;
    const c=hound(1200,314,{kind:'crawler',dormant:true,ang:Math.PI,hp,maxHp:hp,reachX:L4_CRAWLER.reach,lungeX:L4_CRAWLER.lunge,monSpd:L4_CRAWLER.spd});c.hitK=L4_CRAWLER.hit;L4.crawler=c;}
}

/* ---------- things to use (interior.js's ACTS) ---------- */
function l4Acts(){
  for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].map==='l4')ACTS.splice(i,1);
  const on=()=>MAPID==='l4'&&!!L4&&!L4.zip;
  for(const tr of L4_TR){const z=tr.z;ACTS.push({id:'l4st-'+tr.from+tr.to,map:'l4',floor:tr.from,x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2,r:16,label:tr.label,multi:true,avail:on,go:list=>l4Go(list,tr)});}
  for(const[from,to]of[['PL','SU'],['SU','PL']]){const c=L4_CAR[from];ACTS.push({id:'l4lift-'+from,map:'l4',floor:from,x:(c.x0+c.x1)/2,y:(c.y0+c.y1)/2,r:18,label:to==='SU'?'LIFT UP':'LIFT DOWN',multi:true,
    avail:()=>on()&&!L4.ride,need:()=>L4.power?null:'No power: start the generator first (north-east, past the control room).',go:list=>l4GoLift(list,from,to)});}
  ACTS.push({id:'l4-gen',map:'l4',floor:'PL',x:646,y:448,r:14,standY:12,secs:4,label:'START GENERATOR',avail:()=>on()&&!L4.power,act:u=>l4Power(u)});
  ACTS.push({id:'l4-cams',map:'l4',floor:'PL',x:400,y:446,r:14,standY:10,secs:3,label:'WATCH THE CAMERAS',avail:()=>on()&&!L4.cams,act:u=>l4Cams(u)});
  for(const k of[0,1]){const o=L4.objs.find(q=>q.bonus===k);ACTS.push({id:'l4-bonus'+k,map:'l4',floor:'PL',x:o.x+o.w/2,y:o.y+o.h/2,r:14,standY:20,secs:2,label:k?'TAKE HEAVY MG':'TAKE M203',avail:()=>on()&&!L4.bonus[k],act:u=>l4Bonus(u,k)});}
  for(const p of L4.parts){const a={id:'l4-'+p.id,map:'l4',floor:'SU',part:p,x:p.x,y:p.y,r:14,standY:p.standY,secs:p.secs,label:'TAKE '+p.label,avail:()=>on()&&!p.holder&&!p.gone,act:u=>takePart(u,p)};p.act=a;ACTS.push(a);}
  ACTS.push({id:'l4-power',map:'l4',floor:'SU',x:470,y:-298,r:14,standY:14,secs:3,label:'POWER THE TOWER ON',avail:()=>on()&&!!L4.packed&&!L4.towerOn,act:u=>l4TowerOn(u)});   // (once the three packs are in: below)
  ACTS.push({id:'l4-log',map:'l4',floor:'SU',x:L4_INTEL.x,y:L4_INTEL.y,r:12,label:'RADIO LOG',pickup:true,avail:()=>on()&&!L4.intel,act:u=>{L4.intel=true;if(L4.logMesh)L4.logMesh.visible=false;callout(u,'Got the radio log',C.good);
    banner('The radio log: their schedule, and where their next shipments come from. Intel: where the next mission is.',3400);updateObjUI();}});
}
function l4PowerOn(){   // the plant's lights, the lift's panels green
  L4.power=true;
  for(const L of L4.lamps)if(L.power){L.off=false;if(L.head)L.head.material.color.setHex(L.c);}
  if(L4.genLight)L4.genLight.material.color.setHex(0x37e08a);if(L4.liftLight)L4.liftLight.material.color.setHex(0x37e08a);if(L4.liftLight2)L4.liftLight2.material.color.setHex(0x37e08a);
  if(curFloor==='PL'&&L4.lights){L4.lights.hemi.userData.base=.3;}
}
function l4Power(u){
  if(L4.power)return;l4PowerOn();
  if(typeof playSample==='function'){playSample('steel',u.x,u.y,.7,.8);setTimeout(()=>{if(MAPID==='l4')playSample('scan',u.x,u.y,.5,.6);},700);}
  shake(.15);callout(u,'Generator running',C.good);banner('The generator\'s running: the lights are on, and the lift has power. It\'s loud going up: they\'ll hear it on the summit.',3600);
}
function l4Cams(u){
  L4.cams=true;let n=0;
  for(const e of L4.mil){if(beaten(e))continue;e.seen=true;e.last={x:e.x,y:e.y};e.markT=simT+150;e.revealT=Math.max(e.revealT||0,simT+150);n++;}
  if(typeof playSample==='function')playSample('computer',u.x,u.y,.6);
  callout(u,'Eyes on the summit',C.good);
  banner(`The cameras: ${n} of their men on the summit, and something moving in the vents round them. Marked for the next few minutes.`,4200);
}
// the finds (Bryan, after v99): k 0 the M203 (the staff room), k 1 an M240 (the store). Whoever takes one keeps it: the M203 in his
// grenade's place (combat.js's M203: three rounds, further, a bigger blast; ammo drops refill it), the M240 his main weapon
// with his own gun on his back (the card's SWAP); both saved with him
function l4Bonus(u,k){
  if(k===0){if(u.gl){banner(`${u.name} already has an M203. Send someone else.`,2000);return;}
    L4.bonus[0]=true;u.gl=true;u.grenade=M203.rounds;figRefresh(u);callout(u,'M203',C.good);
    banner(`An M203 grenade launcher: ${u.name} fits it under his rifle. It takes his grenade's place: ${M203.rounds} rounds, twice the range, a bigger blast. Ammo drops refill it.`,4200);}
  else{if(u.weapon==='hmg'){banner(`${u.name} already has a machine gun. Send someone else.`,2000);return;}
    L4.bonus[1]=true;u.weapon2=u.weapon||'rifle';u.weapon='hmg';u.cool=Math.max(u.cool||0,.8);figRefresh(u);callout(u,'Heavy machine gun',C.good);
    banner(`A heavy machine gun: ${u.name} takes the M240. His ${WEAPON[u.weapon2].label} goes on his back: tap the gun on his card to swap.`,4200);}
  if(l4Run){l4Run.found=l4Run.found||[false,false];l4Run.found[k]=true;}
  if(typeof playSample==='function')playSample('gear',u.x,u.y,.7);buildCards();updateObjUI();hud();
}

/* ---------- the parts: carried, slow, no shooting (combat.js reads u.cargo) ---------- */
function takePart(u,p){
  if(u.cargo){banner(`${u.name} is already carrying ${u.cargo.name}.`,2000);return;}
  p.holder=u;u.cargo=p;const g=L4.partMesh&&L4.partMesh[p.id];if(g)g.visible=false;
  cargoMesh(u,p);if(typeof playSample==='function')playSample('gear',u.x,u.y,.7);
  callout(u,'Got a power pack',C.good);
  banner(`${u.name} has a power pack. Carry it to a socket at the mast's foot: he's slow and can't shoot while he carries it.`,3000);
  updateObjUI();hud();
}
function cargoMesh(u,p){
  if(!u.m||!u.m.g)return;if(u.cargoM){u.cargoM.parent&&u.cargoM.parent.remove(u.cargoM);u.cargoM=null;}
  const g=new T.Group(),mt=M2(0x3c4248,{metalness:.5});
  {const b=new T.Mesh(new T.BoxGeometry(5.5,8,8),mt);g.add(b);const y=new T.Mesh(new T.BoxGeometry(5.7,1.2,8.2),M2(0xd8b030));y.position.y=1.5;g.add(y);}   // (a power pack strapped on his back)
  g.position.set(-3.6,10.5,0);u.m.g.add(g);u.cargoM=g;
}
function dropCargo(u){   // (damage() when he goes down; Put down)
  const p=u.cargo;if(!p)return;u.cargo=null;if(u.cargoM){if(u.cargoM.parent)u.cargoM.parent.remove(u.cargoM);u.cargoM=null;}
  if(!L4||MAPID!=='l4'){p.holder=null;return;}
  const s=openSpot(u.x,u.y,[])||{x:u.x,y:u.y};p.holder=null;p.x=s.x;p.y=s.y-6;if(p.act){p.act.x=p.x;p.act.y=p.y;p.act.standY=14;}
  const g=L4.partMesh&&L4.partMesh[p.id];if(g){g.visible=true;g.position.set(p.x-p.ox,-(p.id==='tx'?10:4),p.y-p.oy);}
  callout(u,'Dropped '+p.name,C.warn);updateObjUI();
}

/* ---------- the stairs and the lift ---------- */
const onL4Floor=(list,f)=>list.filter(u=>l4FloorOf(u.x,u.y)===f);
function l4Go(list,tr){   // everyone selected on this floor up (or down) the whole flight, each on his own (like the Headquarters')
  const go=onL4Floor(list,tr.from);if(!go.length){banner('Select soldiers on this floor first.',1600);return;}
  const z=tr.z,fp=farPart(z),mid={x:(fp.x0+fp.x1)/2,y:(fp.y0+fp.y1)/2},spots=slotsIn(fp,go.length,players.filter(p=>!go.includes(p)&&!p.dead).map(destOf)).filter(s=>inZone(s,fp));
  let n=0;go.forEach((u,i)=>{const s=spots[i]||mid,p=findPath(u.x,u.y,s.x,s.y);if(!p)return;n++;
    Object.assign(u,{path:p,lastOrder:simT,l4Stairs:{tr,t0:simT},l4Lift:null,watch:null,supT:null,focus:null,silent:null,ret:null});});
  if(!n){banner('No way there from here.',1600);return;}
  callout(go[0],tr.to==='PL'||(tr.from==='SU')?'Going down':'Going up',C.good);
}
function l4GoLift(list,from,to){   // into the car: it goes once everyone sent is in it
  const go=onL4Floor(list,from);if(!go.length){banner('Select soldiers on this floor first.',1600);return;}
  const z=L4_CAR[from],spots=slotsIn(z,go.length,[]);
  go.forEach((u,i)=>{const s=spots[i]||{x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2},p=findPath(u.x,u.y,s.x,s.y);if(!p)return;
    Object.assign(u,{path:p,lastOrder:simT,l4Lift:{from,to,t0:simT},l4Stairs:null,watch:null,supT:null,focus:null,silent:null,ret:null});});
  callout(go[0],'Into the lift',C.good);
}
function l4After(to,who){   // the camera follows when nobody selected is left on the floor on screen
  const s=sel.filter(alive);
  if(who.some(u=>sel.includes(u))&&!s.some(u=>l4FloorOf(u.x,u.y)===curFloor)){const on=onL4Floor(s,to);setL4Floor(to,on.length?midOf(on):null);}
  floorChip();hud();
}
function l4FloorTick(){
  const moved={};
  for(const u of players){
    const st=u.l4Stairs;if(!st)continue;
    if(!alive(u)||u.lastOrder>st.t0+.01){u.l4Stairs=null;continue;}
    if(u.path.length)continue;const z=st.tr.z;u.l4Stairs=null;
    if(!inZone(u,{x0:z.x0-10,x1:z.x1+10,y0:z.y0-10,y1:z.y1+10}))continue;
    transit(u,st.tr.to,st.tr.arrive);(moved[st.tr.to]=moved[st.tr.to]||[]).push(u);
  }
  for(const to in moved)l4After(to,moved[to]);
  if(L4.ride){
    const R=L4.ride;if(simT-R.t<L4_RIDE)return;L4.ride=null;
    const dz=L4_CAR[R.to],fz=L4_CAR[R.from],taken=[];
    for(const u of R.units){u.away=false;if(u.dead)continue;transit(u,R.to,{x:dz.x0+(u.x-fz.x0)*(dz.x1-dz.x0)/(fz.x1-fz.x0),y:dz.y0+(u.y-fz.y0)*(dz.y1-dz.y0)/(fz.y1-fz.y0)},taken);}
    sfxLift((dz.x0+dz.x1)/2,(dz.y0+dz.y1)/2,'ding');l4After(R.to,R.units);
    if(R.to==='SU'&&L4.lifted&&L4.wave&&!L4.wave.at)L4.wave.at=simT+L4_BROOD.delay;   // the brood comes up the shaft after it
    return;
  }
  for(const u of players)if(u.l4Lift&&(!alive(u)||u.lastOrder>u.l4Lift.t0+.01))u.l4Lift=null;
  const riders=players.filter(u=>u.l4Lift);if(!riders.length)return;
  const lf=riders[0].l4Lift,z=L4_CAR[lf.from],set=riders.filter(u=>u.l4Lift.from===lf.from);
  if(set.some(u=>u.path.length||!inZone(u,{x0:z.x0-6,x1:z.x1+6,y0:z.y0-6,y1:z.y1+6})))return;
  L4.ride={t:simT,from:lf.from,to:lf.to,units:set};
  for(const u of set){u.l4Lift=null;u.away=true;u.path=[];if(u.carry){u.carry.x=u.x;u.carry.y=u.y;}}   // (the car's gone: they're in the shaft until it gets there)
  sfxLift(set[0].x,set[0].y,'door');if(typeof playSample==='function')playSample('steel',set[0].x,set[0].y,.8,.7);
  l4LiftNoise(set,lf.to);
  if(sel.some(u=>set.includes(u))){sel=sel.filter(u=>!set.includes(u));cardGroup=cardGroup.filter(u=>!set.includes(u));hud();}
}
// the lift is loud (Bryan: "the guards hear them coming and wait at the bunker it comes up into"; it wakes the brood)
function l4LiftNoise(set,to){
  const teams=[...new Set(set.map(u=>u.team))];for(const t of teams)startContact(null,false,set.find(u=>u.team===t),true);   // heard: their team is caught (the other one can stay hidden)
  L4.heard=teams;L4.heardT=simT+L4_RIDE+3;
  const up=to==='SU';
  for(const e of L4.mil){if(beaten(e))continue;
    if(!up&&hyp(e.x-L4_DOOR.x,e.y-L4_DOOR.y)>300)continue;
    if(!e.alerted)alertOne(e,null,false);e.sawT=simT;
    if(e.post||e.gunner){e.ang=Math.atan2(L4_DOOR.y-e.y,L4_DOOR.x-e.x);continue;}
    if(!up){e.lkp={x:L4_DOOR.x,y:L4_DOOR.y,t:simT};continue;}
  }
  if(up){   // the riflemen go to wait round the bunker's door
    const men=L4.mil.filter(e=>!beaten(e)&&!e.post&&!e.gunner).sort((a,b)=>hyp(a.x-L4_DOOR.x,a.y-L4_DOOR.y)-hyp(b.x-L4_DOOR.x,b.y-L4_DOOR.y)),taken=[];
    men.forEach((e,i)=>{const[sx,sy]=L4_AMBUSH[i%L4_AMBUSH.length],s=openSpot(sx,sy,taken)||{x:sx,y:sy};taken.push(s);const p=findPath(e.x,e.y,s.x,s.y,FOOT);if(p){e.path=p;e.moveCool=simT+12;}e.route=null;e.lkp=null;e.l4wait={x:L4_DOOR.x,y:L4_DOOR.y};});
    if(!L4.lifted){L4.lifted=true;l4WakeNest('lift');L4.wave={at:0,n:0};}
    banner('The lift grinds up through the rock. They\'ll hear it on the summit, and something below heard it too.',3200);
  }
}

/* ---------- the brood ---------- */
function l4WakeNest(why){
  if(L4.woke)return;L4.woke=why;const big=players.filter(p=>alive(p)&&!p.offMap&&!p.away).length>5||players.filter(p=>!p.dead).length>5;
  for(const h of L4.brood){if(h.dead)continue;h.dormant=false;h.againT=simT+1.6+Math.random();h.growlT=simT+Math.random()*2;h.alerted=true;h.slowT=simT+1.2;if(why==='lift')h.shaft=true;}   // (a moment to uncurl: the squad gets the first shots)
  // her eggs hatch too: five split for each newborn that crawls out
  const D=L4.nest&&L4.nest.userData.eggs,n=big?L4_BROOD.hatchBig:L4_BROOD.hatch;
  if(D)for(let q=0;q<n;q++){const c=D.clutches[q%D.clutches.length],left=[];for(let i=c.a;i<c.b;i++)if(!D.list[i].burst)left.push(i);if(!left.length)continue;
    for(let r=0;r<5&&r<left.length;r++)crEggBurst(L4.nest,left[r]);const e=D.list[left[0]];
    const h=hound(e.x,e.z,{kind:'young',hatched:true,hp:HATCH.hp,maxHp:HATCH.hp,againT:simT+1.5,ang:Math.random()*6.28});h.hitK=HATCH.hit;if(why==='lift')h.shaft=true;L4.brood.push(h);}
  const s=L4.brood.find(h=>!h.dead)||{x:410,y:705};sfxMon('mon_scream',s,.9,.9);if(typeof playSample==='function')playSample('flesh',410,705,.8);
  if(why!=='lift'){const p=players.filter(p=>alive(p)&&l4FloorOf(p.x,p.y)==='PL').sort((a,b)=>hyp(a.x-410,a.y-705)-hyp(b.x-410,b.y-705))[0];if(p)callout(p,'They\'re waking up!',C.bad);}
}
// one woken by the lift: it makes for the shaft and goes up it after the car (unless one of ours is right there): houndThink asks first (monsters.js)
function l4Shaft(u){
  if(MAPID!=='l4'||!L4)return false;
  const c=L4_CAR.PL,cx=(c.x0+c.x1)/2,cy=(c.y0+c.y1)/2;
  if(players.some(p=>alive(p)&&!p.away&&l4FloorOf(p.x,p.y)==='PL'&&hyp(p.x-u.x,p.y-u.y)<90)){u.shaft=false;return false;}   // one of ours right there: it goes for him
  if(hyp(u.x-cx,u.y-cy)<30){   // into the shaft
    L4.waveQ.push({kind:u.kind,hp:u.hp,maxHp:u.maxHp,hitK:u.hitK,hatched:u.hatched});u.dead=true;u.gone=true;u.path=[];
    if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);units=units.filter(q=>q!==u);enemies=enemies.filter(q=>q!==u);return true;}
  if(simT>(u.repath||0)){u.repath=simT+.6;const p=findPath(u.x,u.y,cx,cy,FOOT);if(p)u.path=p;}
  return true;
}
// up the shaft, out of the vent by the bunker, one after another: for whoever's nearest, their men too (brawl)
function l4WaveTick(){
  const W=L4.wave;if(!W||!W.at||simT<W.at)return;
  if(!W.extra){W.extra=true;const big=players.filter(p=>!p.dead).length>5;
    for(let k=0;k<(big?L4_BROOD.waveBig:L4_BROOD.wave);k++)L4.waveQ.push({kind:'young'});for(let k=0;k<(big?L4_BROOD.waveHatchBig:L4_BROOD.waveHatch);k++)L4.waveQ.push({kind:'young',hatched:true,hp:HATCH.hp,maxHp:HATCH.hp,hitK:HATCH.hit});
    sfxMon('mon_horde',L4_HATCH,1,.95);if(L4.hatch){L4.hatch.rotation.z=1.1;L4.hatch.position.y=9;}shake(.25);
    const p=players.filter(p=>alive(p)&&l4FloorOf(p.x,p.y)==='SU').sort((a,b)=>hyp(a.x-L4_HATCH.x,a.y-L4_HATCH.y)-hyp(b.x-L4_HATCH.x,b.y-L4_HATCH.y))[0];if(p)callout(p,'Out of the vent! Everything\'s coming up!',C.bad);}
  if(!L4.waveQ.length||simT<(W.next||0))return;W.next=simT+L4_BROOD.gap;
  const q=L4.waveQ.shift(),a=Math.random()*6.28,s=openSpot(L4_HATCH.x+Math.cos(a)*16,L4_HATCH.y+Math.sin(a)*16,[])||{x:L4_HATCH.x+18,y:L4_HATCH.y};
  const h=hound(s.x,s.y,Object.assign({kind:'young',brawl:true,ang:a,againT:simT+.6+Math.random()*.6},q.hp?{hp:q.hp,maxHp:q.maxHp||q.hp}:{},q.hatched?{hatched:true}:{}));if(q.hitK)h.hitK=q.hitK;W.n++;
  sfxMon('mon_snarl',h,.8,1.1);
}
// the nest wakes: one of ours in the fan hall, or gunfire or a blast near it (a silenced shot doesn't carry)
function l4NestTick(dt){
  if(L4.woke)return;const q=PL_ROOMS.fan,c={x:410,y:720};
  const inside=players.some(p=>alive(p)&&!p.away&&p.x>q.x0&&p.x<q.x1&&p.y>q.y0+8&&p.y<q.y1);
  if(inside){L4.nestT=(L4.nestT||0)+dt;if(L4.nestT>1.2)l4WakeNest('in');}else L4.nestT=0;
  if(flashes.some(f=>f.t<=dt+1e-6&&hyp(f.x-c.x,f.y-c.y)<300&&l4FloorOf(f.x,f.y)==='PL')||booms.some(b=>b.t<=dt+1e-6&&hyp(b.x-c.x,b.y-c.y)<360&&l4FloorOf(b.x,b.y)==='PL'))l4WakeNest('noise');
  if(L4.brood.some(h=>!h.dormant||(h.hp<h.maxHp)))l4WakeNest('hurt');
}
// the Crawler: asleep in its chamber until one of ours comes close, or shoots near it
function l4CrawlerTick(dt){
  const c=L4.crawler;if(!c)return;
  if(c.dead){if(!c.saidDead){c.saidDead=true;if(l4Run)l4Run.crawlerDead=true;const p=players.find(p=>alive(p)&&l4FloorOf(p.x,p.y)==='ST');if(p)callout(p,'It\'s down. The big one\'s down.',C.good);}return;}
  if(!c.dormant)return;
  const near=players.some(p=>alive(p)&&!p.away&&l4FloorOf(p.x,p.y)==='ST'&&hyp(p.x-c.x,p.y-c.y)<L4_CRAWLER.wake);
  const loud=flashes.some(f=>f.t<=dt+1e-6&&l4FloorOf(f.x,f.y)==='ST'&&hyp(f.x-c.x,f.y-c.y)<520);
  if(near||loud||c.hp<c.maxHp){c.dormant=false;c.againT=simT+.5;c.growlT=simT+.4;c.alerted=true;sfxMon('mon_scream',c,1,.62);shake(.2);
    const n=Math.max(1,players.filter(p=>alive(p)&&!p.away&&l4FloorOf(p.x,p.y)==='ST').length),hp=L4_CRAWLER.hp+L4_CRAWLER.perMan*n;
    if(hp<c.maxHp){c.hp*=hp/c.maxHp;c.maxHp=hp;}   // sized for the men on the stairs, not the whole squad: two split off up them face one for two (v110: the squad is four from here)
    const p=players.filter(p=>alive(p)&&l4FloorOf(p.x,p.y)==='ST').sort((a,b)=>hyp(a.x-c.x,a.y-c.y)-hyp(b.x-c.x,b.y-c.y))[0];if(p)callout(p,'Big one! Up ahead!',C.bad);}
}

/* ---------- the summit (since v124, Bryan's plan: "the top floor initial shows other troops being wiped out by the monsters. The
   team fights the monsters and carry's three large items to their correct positions to power the radio tower, all while under
   attack... once they place the packs in the right spot they get a checkpoint resupply and medic station. They then power the
   tower and the queen appears with its babies"; she dies here: "I'm leaning to her dying here so we can introduce more
   enemies"). The first time one of ours is on the summit, the brood comes out of the vent and up their track and tears into
   their men (doomed: they never notice the squad; L4_SLAUGHTER), the camera turned to it a moment; then it's the squad's fight.
   Three power packs (L4.parts: the radio building, by their containers, by the bunker's sandbags) carried to the sockets round
   the mast's foot (L4.sockets: a carrier who stands in one 1.2 s sets his pack in), her young out of the vent now and then while
   they're at it (L4_PACKWAVE). All three in: a checkpoint (a medic station, an ammo drop, the save 'summit') and POWER THE
   TOWER ON at the mast's foot; the tower lights up and the Queen comes up over the north edge with her young (L4_QUEEN, her
   fight queenThink, more young at two roars); dead, the zip line home. ---------- */
const l4OnSU=p=>alive(p)&&!p.away&&l4FloorOf(p.x,p.y)==='SU';
function l4SummitTick(dt){
  if(!L4)return;
  if(!L4.slaughter&&!L4.packed&&players.some(l4OnSU))l4Slaughter();
  const S=L4.slaughter;
  if(S&&!S.done){
    if(simT-S.t0>L4_SLAUGHTER.killT)for(const e of L4.mil)if(!e.dead){e.hp=0;e.dead=true;e.path=[];if(typeof sfxScream==='function')sfxScream(e,.8);paintDecal({k:'blood',x:e.x,y:e.y,r:Math.random()});}
    if(L4.mil.every(e=>e.dead)){S.done=true;const p=players.filter(l4OnSU)[0];if(p)callout(p,'They\u2019re all dead. It\u2019s us now.',C.warn);
      banner('Their men are dead. The packs: one in the radio building, one by their containers, one by the bunker. Get them to the sockets round the mast.',4200);updateObjUI();}
  }
  // the carriers at the sockets
  for(const u of players){if(!u.cargo||!alive(u)||l4FloorOf(u.x,u.y)!=='SU'){if(u)u.placeT=0;continue;}
    const s=L4.sockets.filter(q=>!q.pack).sort((a,b)=>hyp(a.x-u.x,a.y-u.y)-hyp(b.x-u.x,b.y-u.y))[0];
    if(s&&hyp(s.x-u.x,s.y-u.y)<24&&!u.path.length){u.placeT=(u.placeT||0)+dt;if(u.placeT>=1.2){u.placeT=0;l4PlacePack(u,s);}}else u.placeT=0;}
  // her young out of the vent while the packs are carried
  if(S&&S.done&&!L4.packed){const W=L4.packWave||(L4.packWave={t:simT+L4_PACKWAVE.every*.6,n:0});
    if(simT>W.t&&W.n<L4_PACKWAVE.max){W.t=simT+L4_PACKWAVE.every;W.n++;const big=players.filter(p=>!p.dead).length>5;
      for(let k=0;k<(big?L4_PACKWAVE.nBig:L4_PACKWAVE.n);k++){const a=Math.random()*6.28,q=openSpot(L4_HATCH.x+Math.cos(a)*18,L4_HATCH.y+Math.sin(a)*18,[])||{x:L4_HATCH.x+20,y:L4_HATCH.y};hound(q.x,q.y,{kind:'young',ang:a,againT:simT+.8+Math.random()*.6});}
      sfxMon('mon_horde',L4_HATCH,.9,1);if(L4.hatch){L4.hatch.rotation.z=1.1;L4.hatch.position.y=9;}const p=players.filter(l4OnSU).sort((a,b)=>hyp(a.x-L4_HATCH.x,a.y-L4_HATCH.y)-hyp(b.x-L4_HATCH.x,b.y-L4_HATCH.y))[0];if(p)callout(p,'More out of the vent!',C.bad);}}
  if(L4.queen&&!L4.queenDead&&L4.queen.dead)queenDied(L4.queen);
}
function l4Slaughter(){
  const men=players.filter(p=>!p.dead).length,n=L4_SLAUGHTER.hunters+L4_SLAUGHTER.perMan*Math.max(0,men-4);
  L4.slaughter={t0:simT,done:!L4.mil.some(e=>!e.dead)};
  for(const e of L4.mil){if(e.dead)continue;e.alerted=true;e.aware=1;e.post=e.post&&!e.elev?false:e.post;}
  const at=[L4_HATCH,{x:640,y:-640},{x:430,y:-600}];
  for(let k=0;k<n;k++){const A=at[k%at.length],a=Math.random()*6.28,q=openSpot(A.x+Math.cos(a)*20,A.y+Math.sin(a)*20,[])||{x:A.x,y:A.y+20};hound(q.x,q.y,{brawl:true,ang:a,againT:simT+.3+Math.random()*.8});}
  sfxMon('mon_horde',L4_HATCH,1.1,.95);if(L4.hatch){L4.hatch.rotation.z=1.1;L4.hatch.position.y=9;}shake(.3);
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:520,z:-360,zoom:1.7},t:0,dur:1.4};
  const p=players.filter(l4OnSU)[0];if(p)setTimeout(()=>{if(state==='play'&&MAPID==='l4')callout(p,'Something\u2019s tearing into them!',C.bad);},600);
  banner('Up top their men are being torn apart: the brood\u2019s out of the vent and coming up their track.',4200);
}
function l4PlacePack(u,s){
  const p=u.cargo;if(!p)return;u.cargo=null;if(u.cargoM){if(u.cargoM.parent)u.cargoM.parent.remove(u.cargoM);u.cargoM=null;}
  p.holder=null;p.placed=true;p.gone=true;s.pack=p.id;s.mesh.visible=true;s.ring.material.color.setHex(0x37e08a);
  if(typeof playSample==='function'){playSample('steel',s.x,s.y,.6,1.1);setTimeout(()=>{if(MAPID==='l4')playSample('scan',s.x,s.y,.45,1.2);},300);}
  const k=L4.sockets.filter(q=>q.pack).length;callout(u,'Pack in',C.good);
  if(k>=3)l4Packed();else banner(`A power pack in (${k} of 3).`,2200);
  updateObjUI();hud();
}
function l4Packed(quiet){
  L4.packed=true;addZones(L4_REST,L4.groups.SU);
  if(quiet)return;bigText('Checkpoint','clear');banner('All three packs in. A medic station and an ammo drop by the mast. POWER THE TOWER ON at its foot when you\u2019re ready.',4200);
  if(typeof chatSecured==='function')chatSecured();saveGame('summit');
}
function l4TowerOn(u){
  if(L4.towerOn)return;L4.towerOn=true;l4TowerLights();
  if(typeof playSample==='function'){playSample('steel',L4_MAST.x,L4_MAST.y,.8,.7);setTimeout(()=>{if(MAPID==='l4')playSample('scan',L4_MAST.x,L4_MAST.y,.7,.6);},600);}
  shake(.25);callout(u,'It\u2019s live!',C.good);banner('The old radio tower is live. The Headquarters can talk to the outside again...',3200);updateObjUI();
  setTimeout(()=>{if(state==='play'&&MAPID==='l4'&&L4&&!L4.queen)queenArrive();},3200);
}
function l4TowerLights(){   // the beacon steady and bright, the dishes lit, a glow up the mast
  if(L4.beacon){L4.beacon.material.color.setHex(0xff5a3a);L4.beacon.scale.setScalar(1.6);}
  if(!L4.towerGlow){const g=new T.Group(),mt=new T.MeshBasicMaterial({color:0x8fe6f2,toneMapped:false});
    for(const y of[28,56,84]){const b=new T.Mesh(new T.SphereGeometry(1.1,8,6),mt);b.position.set(L4_MAST.x+6,y,L4_MAST.y+6);g.add(b);}L4.groups.SU.add(g);L4.towerGlow=g;}
}
function queenArrive(){
  const men=players.filter(p=>!p.dead).length,big=men>5,hp=Math.round((BOSS.hp+BOSS.perMan*men)*L4_QUEEN.hpK);
  const u=mk('E','E','QN','The Queen',L4_QUEEN.x,L4_QUEEN.y,Math.PI/2);
  Object.assign(u,{mon:'boss',queen:true,dog:true,hp,maxHp:hp,alerted:true,aware:1,seen:true,grp:null,ms:'roar',mt0:simT,slamCdT:simT+4,swipeCdT:0,stepT:0,big:true,qPhase:0});
  makeQueen(u);enemies.push(u);L4.queen=u;sfxMon('boss_roar',u,1.6,.9);shake(.9);
  for(let k=0;k<(big?L4_QUEEN.babiesBig:L4_QUEEN.babies);k++){const a=Math.PI/2+(k-2)*.5,q=openSpot(u.x+Math.cos(a)*40,u.y+Math.sin(a)*40+20,[])||{x:u.x,y:u.y+40};hound(q.x,q.y,{kind:'young',ang:Math.PI/2,againT:simT+1.6+Math.random()});}
  if(typeof startContact==='function')startContact('',false,null,true);
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:L4_QUEEN.x,z:L4_QUEEN.y+120,zoom:1.9},t:0,dur:1.3};
  bigText('The Queen','inbound');const p=players.filter(l4OnSU).sort((a,b)=>hyp(a.x-u.x,a.y-u.y)-hyp(b.x-u.x,b.y-u.y))[0];if(p)callout(p,'Over the edge! It\u2019s her! The big one from the tunnel!',C.bad);
  updateObjUI();
}
function makeQueen(u){   // her body: the Brood Mother's, coming up over the north edge (the trail behind her down the drop)
  const g=new T.Group(),ring=monRing(u,g,2.4);scene.add(g);const pool=crPool(scene,'mother');u.m={g,ring,spot:null,pool,slot:crSlotFor(pool,u)};
  const pts=[{x:u.x,y:u.y}];for(let k=1;k<160;k++)pts.push({x:u.x+Math.sin(k*.05)*6,y:u.y-k*2});crTrailInit(u,MOTHER,pts);
}
function queenThink(u,dt){   // the Brood Mother's way of fighting (fortress.js's bossThink) without her hall
  if(u.ms==='roar'){u.path=[];if(simT-u.mt0>2.4)u.ms='walk';return;}
  const tg=monPrey(u,2000);if(!tg){u.path=[];return;}monSaw(tg);
  const dx=tg.x-u.x,dy=tg.y-u.y,d=hyp(dx,dy)||1;
  if(u.ms==='slam'){u.path=[];
    if(simT-u.mt0>=BOSS.slamT){const s=u.slamAt;sfxMon('boss_slam',s,1.3,1);shake(1);booms.push({x:s.x,y:s.y,t:0});paintDecal({k:'scorch',x:s.x,y:s.y,r:Math.random()});
      for(const p of players){if(!alive(p))continue;const dd=hyp(p.x-s.x,p.y-s.y);if(dd<BOSS.slamR)monHit(u,p,BOSS.slamDmg*(1-dd/(BOSS.slamR*1.2)),.9);}
      u.ms='walk';u.slamCdT=simT+BOSS.slamCd;u.slamDownT=simT;}
    return;}
  if(u.ms==='swipe'){u.path=[];if(simT-u.mt0>=.5){for(const p of players){if(!alive(p))continue;const dd=hyp(p.x-u.x,p.y-u.y);let da=Math.atan2(p.y-u.y,p.x-u.x)-u.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(dd<BOSS.swipeR+10&&Math.abs(da)<1.3)monHit(u,p,BOSS.swipeDmg,.6);}
    u.ms='walk';u.swipeCdT=simT+BOSS.swipeCd;}return;}
  u.ang=turn(u.ang,Math.atan2(dy,dx),dt*1.6);
  if(d<BOSS.swipeR&&simT>u.swipeCdT){u.ms='swipe';u.mt0=simT;sfxMon('boss_hurt',u,.9,1.15);return;}
  if(d<230&&simT>u.slamCdT&&los(u.x,u.y,tg.x,tg.y)){u.ms='slam';u.mt0=simT;u.slamAt={x:tg.x,y:tg.y};sfxMon('boss_roar',u,.8,1.25);return;}
  if(u.path.length&&simT>u.stepT){u.stepT=simT+.75;sfxMon('boss_step',u,.9);shake(.15);}
  if(simT>(u.repath||0)){u.repath=simT+.6;const p=findPath(u.x,u.y,tg.x,tg.y,FOOT);if(p)u.path=p;}
}
function queenHurt(u){   // two roars, at two thirds and a third: more of her young out of the vent
  const k=u.hp/u.maxHp,ph=k<.33?2:k<.66?1:0;if(ph<=u.qPhase)return;u.qPhase=ph;
  u.ms='roar';u.mt0=simT;u.path=[];sfxMon('boss_roar',u,1.5,.95);shake(.7);
  const big=players.filter(p=>!p.dead).length>5;
  for(let k2=0;k2<(big?L4_QUEEN.roarBabiesBig:L4_QUEEN.roarBabies);k2++){const a=Math.random()*6.28,q=openSpot(L4_HATCH.x+Math.cos(a)*18,L4_HATCH.y+Math.sin(a)*18,[])||{x:L4_HATCH.x+20,y:L4_HATCH.y};hound(q.x,q.y,{kind:'young',ang:a,againT:simT+1+Math.random()*.6});}
  if(L4.hatch){L4.hatch.rotation.z=1.1;L4.hatch.position.y=9;}sfxMon('mon_horde',L4_HATCH,.9,1);
}
function queenDied(u){
  if(L4.queenDead)return;L4.queenDead=true;if(l4Run)l4Run.queen=true;
  bigText('The Queen is dead','clear');shake(.9);
  setTimeout(()=>{if(state==='play'&&MAPID==='l4')banner('The tower\u2019s live and the Queen is dead. Everyone to the zip line on the south edge.',4200);},1800);
  saveGame('summit',true);updateObjUI();
}

/* ---------- the gather areas (road.js's roadGather): out by the service door; down the zip line ---------- */
function l4PartsHeld(){return L4.parts.filter(p=>p.holder&&alive(p.holder)).length;}
function l4Gather(){
  if(!L4||state!=='play')return null;
  const need=players.filter(p=>alive(p)&&!p.offMap),down=players.some(p=>p.downed&&!p.dead&&!p.carriedBy),all=z=>need.length>0&&!down&&!L4.ride&&need.every(p=>inZone(p,z)),why=down?'CARRY THE WOUNDED':null;
  const out=[{key:'hillout',z:PL_OUT,ready:all(PL_OUT),go:'LEAVE THE HILL',title:'ROAD TUNNEL',at:{x:64,y:810},dir:Math.PI,need,why,fn:leaveHill,floor:'PL'}];   // (since v116 ways through with a marker: interior.js's exitGo)
  if(!L4.zip){const k=L4.sockets?L4.sockets.filter(q=>q.pack).length:0,block=k<3?`POWER PACKS ${k}/3`:!L4.towerOn?'POWER THE TOWER ON':!L4.queenDead?'THE QUEEN':null;
    out.push({key:'zip',z:L4_ZIP,ready:all(L4_ZIP)&&!block,go:'GO DOWN THE ZIP LINE',title:'ZIP LINE',at:{x:500,y:58},dir:Math.PI/2,need,why:block||why,fn:zipGo,floor:'SU'});}
  return out;
}
// back out into the road tunnel (the hill starts fresh next time)
function leaveHill(){
  if(MAPID!=='l4'||fading)return;
  fadeThen(()=>{
    for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
    for(const p of players){if(p.cargo){p.cargo=null;if(p.cargoM&&p.cargoM.parent)p.cargoM.parent.remove(p.cargoM);p.cargoM=null;}p.away=false;}
    for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].map==='l4')ACTS.splice(i,1);
    HQ_ZONES.length=0;disposeHill();curFloor='GF';floorChip();
    buildTunnel();useMap({objs:TUN.objs,hq:[],slow:[],lamps:TUN.lamps,scene:TUN.scene,lights:TUN.lights});
    tankFires=[];rockets=[];charges=[];
    for(const p of players){moveMesh(p,TUN.scene);tunReset(p);}
    const taken=[];players.filter(p=>!p.dead&&!p.gone&&!p.carriedBy).forEach((p,i)=>{const t=openSpot(740-(i%3)*22,TUN_SVC.y1+34+Math.floor(i/3)*22,taken)||{x:720,y:-140};taken.push(t);p.x=t.x;p.y=t.y;p.ang=Math.PI/2;});
    units=[...players];MAPID='tun';enemies=[];civs=[];LEVEL=3;
    contact=false;clearTeams();sel=[];cardGroup=[];preview=null;mode=null;
    tunCam();zoom=2.3;yaw=0;tilt=0;camT={x:730,z:-150};camPan=null;clampCam();updateCamera();
    updateObjUI();setStatus();buildCards();hud();banner('Back in the road tunnel. The hill will be as it was if you go back in.',3200);
  });
}
// the zip line: one after another off the pylon, out over the edge and down to the bridge on the road east
function zipGo(){
  if(!L4||L4.zip)return;const up=players.filter(p=>alive(p)&&!p.offMap);if(!up.length)return;
  L4.zip={t0:simT,order:up.sort((a,b)=>hyp(a.x-L4_PYLON.x,a.y-L4_PYLON.y)-hyp(b.x-L4_PYLON.x,b.y-L4_PYLON.y)),i:0,done:false};
  sel=[];cardGroup=[];preview=null;mode=null;hud();
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:L4_PYLON.x,z:L4_PYLON.y+40,zoom:2.5},t:0,dur:1.2};
}
function l4ZipTick(dt){
  const Z=L4.zip;if(!Z||Z.done)return;
  const gap=.55,slide=1.7;
  Z.order.forEach((u,i)=>{const t0=Z.t0+.6+i*gap;if(simT<t0)return;
    if(!u.zipT){u.zipT=t0;u.path=[];u.x=L4_PYLON.x+(i%2?4:-4);u.y=L4_PYLON.y-6;u.ang=Math.PI/2;if(typeof playSample==='function')playSample('zip',u.x,u.y,.7,.7);if(u.carry){u.carry.x=u.x;u.carry.y=u.y;}}
    const k=Math.min(1,(simT-u.zipT)/slide),e=k*k;u.y=L4_PYLON.y-6+e*360;u.x=L4_PYLON.x+(i%2?4:-4)+e*20;u.elev=8-e*130;u.away=k>=1;
    if(u.carry){u.carry.x=u.x;u.carry.y=u.y;u.carry.elev=u.elev;}});
  const last=Z.order[Z.order.length-1];if(last.zipT&&simT-last.zipT>slide+.25){Z.done=true;zipArrive();}
}
// the bridge on the road east: they come down the cable's last stretch onto the deck; Mission complete
function zipArrive(){
  fadeThen(()=>{
    const order=L4.zip?L4.zip.order:players.filter(alive);
    const took=L4.sockets.filter(q=>q.pack).length,bonus=L4.bonus.filter(Boolean).length,intel=L4.intel,finds=[L4.bonus[0]?'an M203':null,L4.bonus[1]?'a heavy machine gun':null].filter(Boolean);
    l4Run=Object.assign(l4Run||{},{took,bonus,intel,finds,home:true,tower:!!L4.towerOn,queen:!!L4.queenDead});
    hillOut();
    for(const p of players){p.elev=0;p.away=false;p.zipT=0;if(p.cargo){p.cargo=null;if(p.cargoM&&p.cargoM.parent)p.cargoM.parent.remove(p.cargoM);p.cargoM=null;}}
    const taken=[];order.forEach((u,i)=>{const t=openSpot(1300-(i%4)*24,-300+Math.floor(i/4)*24,taken)||{x:1290,y:-280};taken.push(t);u.zipIn={t0:simT+.2+i*.4,to:t};u.x=L4_ANCHOR.x+60;u.y=L4_ANCHOR.y-70;u.elev=60;u.away=true;u.path=[];});
    for(const p of players)if(p.carriedBy&&order.includes(p.carriedBy)){p.x=p.carriedBy.x;p.y=p.carriedBy.y;}
    obj=Math.max(obj,9);
    try{localStorage.setItem(L4_KEY,JSON.stringify({done:1,tower:1,queen:1,intel:intel?1:0,finds:[L4.bonus[0]?'m203':null,L4.bonus[1]?'hmg':null].filter(Boolean),when:Date.now()}));}catch(e){}
    zoom=2.4;yaw=0;tilt=.25;camT={x:1300,z:-300};camPan=null;clampCam();updateCamera();
    updateObjUI();setStatus();buildCards();hud();
  });
}
const L4_ANCHOR={x:1318,y:-336};   // the zip line's lower end, on the bridge's north railing (the big map: l4Cable)
function l4ZipInTick(){   // (on the big map, after the zip line)
  let any=false,done=true;
  for(const u of players){const Z=u.zipIn;if(!Z)continue;any=true;
    if(simT<Z.t0){done=false;continue;}const k=Math.min(1,(simT-Z.t0)/1.1),e=1-(1-k)*(1-k);
    u.x=L4_ANCHOR.x+60+(Z.to.x-L4_ANCHOR.x-60)*e;u.y=L4_ANCHOR.y-70+(Z.to.y-L4_ANCHOR.y+70)*e;u.elev=60*(1-e);u.away=false;
    if(k>=1){u.zipIn=null;u.elev=0;u.x=Z.to.x;u.y=Z.to.y;u.ang=-Math.PI/2;}else done=false;}
  if(any&&done&&l4Run&&l4Run.home&&!l4Run.won&&!l4Run.back)l4Back();
}
function l4Back(){   // (since v121, Bryan, after v120: "Let's keep the zip line and running back for the radio tower": down the line, then back to the Headquarters on foot; the report once they're in, base.js's enterBase)
  l4Run.back=true;saveGame('home');banner('Down. Now back to the Headquarters: over the bridge to the drawbridge.',4200);updateObjUI();
}
function l4Win(){
  if(!l4Run||l4Run.won||state!=='play')return;l4Run.won=true;
  saveGame(MAPID==='hq'?'base':'home',true);state='end';setStatus();bigText('Mission complete!','complete');setTimeout(showAAR,2600);
}
// the big map back (the zip line, a Retry): the hill gone
function hillOut(){
  const out=STASH.out;if(!out)return;
  for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].map==='l4')ACTS.splice(i,1);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';curFloor='GF';floorChip();
  for(const p of players){p.offMap=false;p.away=false;moveMesh(p,out.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,throwGo:null,medGo:null,ret:null,l4Stairs:null,l4Lift:null});}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=units.filter(u=>u.side==='C');
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();disposeHill();
}
function leaveHillNow(){if(MAPID==='l4')hillOut();l4Run=null;}   // (a Retry, a New game: state.js's reset)

/* ---------- in ---------- */
// from the road tunnel's service door (tunnel.js, an auto gather area), or a Continue (opt.cont: 'hill' or 'summit', opt.l4: the save's)
function enterHill(opt){
  opt=opt||{};if(fading||(MAPID!=='tun'&&MAPID!=='out'))return;
  fadeThen(()=>{
    if(MAPID==='tun'){for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);disposeTunnel();}
    else stashOut(players);
    buildHill();
    useMap({objs:L4.objs,hq:[],slow:[],lamps:L4.lamps,scene:L4.scene,lights:L4.lights,x1:NAV_W});
    tankFires=[];rockets=[];charges=[];
    for(const p of players){moveMesh(p,L4.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,offMap:false,throwGo:null,medGo:null,work:null,away:false,ret:null,l4Stairs:null,l4Lift:null,zipT:0,zipIn:null,cargo:null,cargoM:null});}
    units=[...players];MAPID='l4';LEVEL=4;enemies=[];civs=[];
    if(!l4Run||opt.cont){l4Run={t0:simT,crawlerDead:!!(opt.l4&&opt.l4.crawler)};mission.t0=simT;alertT=0;alertMax=0;downCount=0;
      for(const p of players)p.stats={kills:0,streak:0,best:0,lastKill:-99,revives:0,items:0,downs:0,ties:0};}   // (the report counts this mission alone)
    const summit=opt.cont==='summit';
    spawnHill(summit);enemies=units.filter(u=>u.side==='E');
    l4Acts();
    const live=players.filter(p=>!p.dead&&!p.gone&&!p.carriedBy);
    if(summit){
      L4.clear=true;L4.clearSaved=true;
      const d=opt.l4||{};L4.slaughter={t0:simT,done:true};
      for(const s of L4.sockets){s.pack='old';s.mesh.visible=true;s.ring.material.color.setHex(0x37e08a);}for(const p of L4.parts){p.placed=true;p.gone=true;const g=L4.partMesh&&L4.partMesh[p.id];if(g)g.visible=false;}
      l4Packed(true);if(d.towerOn||d.queenDead){L4.towerOn=true;l4TowerLights();}if(d.queenDead){L4.queenDead=true;l4Run.queen=true;}if(d.power)l4PowerOn();L4.intel=!!d.intel;if(L4.intel&&L4.logMesh)L4.logMesh.visible=false;(d.bonus||[]).forEach((b,k)=>{L4.bonus[k]=!!b;});l4Run.found=L4.bonus.slice();
      const taken=[];live.forEach((p,i)=>{const t=openSpot(470+(i%4-1.5)*24,-400+Math.floor(i/4)*24,taken)||{x:470,y:-400};taken.push(t);p.x=t.x;p.y=t.y;p.ang=Math.PI/2;});
      setL4Floor('SU',{x:470,y:-380});
    }else{
      const sp=slotsIn(PL_IN,live.length);live.forEach((p,i)=>{const s=sp[i]||{x:85,y:700};p.x=s.x;p.y=s.y;p.ang=0;});
      setL4Floor('PL',{x:200,y:700});
    }
    for(const p of players)if(p.carriedBy){p.x=p.carriedBy.x;p.y=p.carriedBy.y;}
    contact=false;clearTeams();sel=[];cardGroup=[];preview=null;mode=null;camPan=null;
    zoom=summit?2.0:2.2;yaw=0;tilt=0;clampCam();updateCamera();
    updateObjUI();setStatus();buildCards();hud();
    if(!opt.cont){bigText('The Old Radio Tower','inbound');banner('Inside the hill: the tunnel\'s old plant. Up to the summit from the lower station, east: the stairs (quiet) or the lift (it needs the generator, and it\'s loud).',4600);saveGame('hill');}
    else banner(summit?'Continuing: the summit.':'Continuing: inside the hill.',2400);
  });
}
function takePartQuiet(u,p){p.holder=u;u.cargo=p;const g=L4.partMesh&&L4.partMesh[p.id];if(g)g.visible=false;cargoMesh(u,p);}

/* ---------- saving (save.js) ---------- */
function l4Save(){if(!L4)return null;return{parts:L4.parts.filter(p=>p.holder).map(p=>p.id),placed:L4.sockets?L4.sockets.filter(q=>q.pack).length:0,towerOn:!!L4.towerOn,queenDead:!!L4.queenDead,bonus:L4.bonus.slice(),intel:L4.intel,power:L4.power,crawler:!!(l4Run&&l4Run.crawlerDead)};}
// a Continue from 'home': the big map with the road open, the squad on the bridge where the zip line comes down
function homeContinue(){
  const taken=[];players.filter(p=>!p.dead&&!p.gone).forEach((p,i)=>{const t=openSpot(1300-(i%4)*24,-300+Math.floor(i/4)*24,taken)||{x:1290,y:-280};taken.push(t);p.x=t.x;p.y=t.y;p.path=[];p.ang=-Math.PI/2;});
  camT={x:1290,z:-260};zoom=2.0;clampCam();updateCamera();updateObjUI();
}

/* ---------- every tick (from update) ---------- */
function l4Tick(dt){
  if(MAPID!=='l4'||!L4){if(MAPID==='out'&&players.some(p=>p.zipIn))l4ZipInTick();return;}
  const hqRun=wave.phase==='hq'&&!!hq;if(!hqRun){stationTick(dt);patrolTick();}
  useTick(dt);l4FloorTick();l4WaveTick();l4NestTick(dt);l4CrawlerTick(dt);l4SummitTick(dt);l4ZipTick(dt);
  if(simT<L4.heardT)for(const t of L4.heard)teamSawT[t]=simT;   // (the lift: they're heard until it's up and they're out)
  for(const u of players)if(u.cargo&&(u.dead||u.downed))dropCargo(u);
  if(L4.beacon)L4.beacon.visible=(simT%1.6)<.8;
  if(L4.screens&&!reduced)for(const s of L4.screens)s.material.color.setScalar(.85+Math.random()*.15);
  for(const e of L4.mil)if(e.l4wait&&!e.dead&&!e.path.length&&simT-e.aimT>2&&!players.some(p=>alive(p)&&!p.away&&l4FloorOf(p.x,p.y)==='SU'))e.ang=turn(e.ang,Math.atan2(e.l4wait.y-e.y,e.l4wait.x-e.x),dt*3);   // waiting: eyes on the bunker's door
  if((L4.chipT=(L4.chipT||0)-dt)<=0){L4.chipT=.5;floorChip();if(!L4.been.SU&&players.some(p=>alive(p)&&!p.away&&l4FloorOf(p.x,p.y)==='SU')){L4.been.SU=true;updateObjUI();}}
}
// before anyone's seen: where previews judge cover from
function l4Threat(){return curFloor==='SU'?{x:L4_MAST.x,y:L4_MAST.y}:curFloor==='ST'?{x:1190,y:314}:{x:410,y:720};}

/* ---------- the hint line, the objective tracker ---------- */
function l4Hint(){
  if(!L4)return'';
  if(L4.zip)return'';
  if(curFloor==='ST')return L4.crawler&&!L4.crawler.dead?'The stairs: a long climb through the rock to a hut on the summit. Quiet: the guards up top won\'t hear you. Something big lives up here: the Crawler. Shoot it when it rears, step out of the violet line.':'The stairs up to the hut on the summit. The UP TO THE HUT ring at the top takes everyone selected up.';
  if(curFloor==='PL'){
    if(!L4.been.SU)return`The plant: the tunnel's old control rooms. Up to the summit from the lower station (east): the STAIRS are quiet (something lives in them); the LIFT ${L4.power?'has power. It\u2019s loud, and it wakes the brood nesting in the fan hall.':'needs the generator (north-east). It\u2019s loud, and it wakes the brood nesting in the fan hall.'} Bonus finds in the staff room and the store.`;
    return'The plant. The stairs and the lift in the lower station go back up to the summit. The service door (west) takes you back out to the road tunnel.';}
  if(L4.queenDead)return'The tower\u2019s live and the Queen is dead. Tap the zip line\u2019s arrows on the south edge and everyone goes. Anyone down has to be carried.';
  if(L4.queen)return'The Queen: stay out of the scorch where she rears to slam, keep moving, and keep her young off the men shooting her.';
  if(L4.towerOn)return'The tower\u2019s live. Something\u2019s coming up over the north edge.';
  if(L4.packed)return'All three packs in. The medic station and the ammo drop are by the mast. POWER THE TOWER ON at its foot when you\u2019re ready: it will bring something.';
  const k=L4.sockets?L4.sockets.filter(q=>q.pack).length:0,left=L4.parts.filter(p=>!p.holder&&!p.placed).length;
  return`The summit, the old radio tower. Three power packs (${k} in): ${left?'one in the radio building (north-west), one by their containers (east), one by the bunker\u2019s sandbags (south): ':''}carry them to the sockets round the mast\u2019s foot. A carrier is slow and can\u2019t shoot: keep the others round him. Her young keep coming out of the vent by the bunker.`;
}
function l4ObjUI(el){
  const up=!!(L4&&L4.been.SU),k=L4&&L4.sockets?L4.sockets.filter(q=>q.pack).length:0;
  el.querySelector('b').textContent='Level 4 · The Old Radio Tower';
  el.querySelector('span').textContent=!L4?'':L4.zip?'Down the zip line':L4.queenDead?'To the zip line (the south edge)':L4.queen?'Kill the Queen':L4.towerOn?'Something\u2019s coming':L4.packed?'Power the tower on':up?`Power packs to the mast (${k}/3)`:'Up to the summit: the stairs or the lift';
  const items=[['Up to the summit (the stairs or the lift)',up],[`Three power packs to the mast (${k}/3)`,k>=3],['Power the tower on',!!L4.towerOn],['Kill the Queen',!!L4.queenDead],['Down the zip line, back to the Headquarters',!!L4.zip]];
  el.querySelector('ol').innerHTML=items.map(([t,d])=>`<li class="${d?'done':''}">${t}</li>`).join('')+`<li class="${L4.intel?'done':''}">Bonus: the radio log (intel)</li><li class="${L4.bonus[0]?'done':''}">Bonus: the M203 (the staff room)</li><li class="${L4.bonus[1]?'done':''}">Bonus: the heavy machine gun (the store)</li>`;
  el.hidden=state!=='play';
}
function l4AfterHint(){return'The old radio tower is live. Back to the Headquarters: over the bridge, and the arrows at the drawbridge take you in.';}

/* ---------- drawn on the overlay ---------- */
function drawL4(now){
  if(MAPID!=='l4'||!L4)return;
  const lb=(t,x,y,c,s=10,yo=0)=>{toSBack=false;const[lx,ly]=below(x,y,6);if(!toSBack)label(t,lx,ly+yo,c,s,700);};
  if(curFloor==='PL'){for(const k of['staff','ctrl','gen','store','fan','stn']){const q=PL_ROOMS[k];lb(q.name,(q.x0+q.x1)/2,q.y0+16,'rgba(200,210,220,.55)',9);}
    lb('SERVICE DOOR',85,846,'rgba(200,210,220,.55)',9);
    if(!L4.woke){const pulse=(Math.sin(now*2)+1)/2;lb('THE NEST',410,760,`rgba(214,160,255,${(.35+pulse*.3).toFixed(2)})`,9);}}
  else if(curFloor==='SU'){lb('THE OLD RADIO TOWER',L4_MAST.x-60,L4_MAST.y+8,'#8fe6f2',10);lb('RADIO BUILDING',265,-446,'rgba(200,210,220,.6)',9);lb('BUNKER · LIFT',460,-118,'rgba(200,210,220,.6)',9);lb('HUT · STAIRS',165,-136,'rgba(200,210,220,.6)',9);
    if(L4.sockets&&!L4.packed){const pulse=(Math.sin(now*3)+1)/2,carrying=players.some(p=>p.cargo&&alive(p));
      for(const s of L4.sockets){if(s.pack)continue;toSBack=false;gPath(s.x,s.y,14+(carrying?pulse*4:0));if(toSBack)continue;ox.strokeStyle=`rgba(216,176,48,${carrying?.6+pulse*.4:.45})`;ox.lineWidth=2;ox.setLineDash([5,4]);ox.stroke();ox.setLineDash([]);lb('SOCKET',s.x,s.y+14,'#ffcf4a',8);}}
    for(const u of players)if(u.placeT>0&&alive(u)){gPath(u.x,u.y,14,-Math.PI/2,-Math.PI/2+u.placeT/1.2*TAU);ox.strokeStyle='#37e08a';ox.lineWidth=2.4;ox.stroke();}}
  for(const u of players){if(!u.cargo||offFloor(u)||!alive(u))continue;toSBack=false;const[x,y]=toS(u.x,u.y,26);if(!toSBack)label(u.cargo.label,x,y,'#ffcf4a',8,700);}
  if(L4.ride){const R=L4.ride,z=L4_CAR[R.from];if(R.from===curFloor){const k=(simT-R.t)/L4_RIDE;toSBack=false;const[lx,ly]=toS((z.x0+z.x1)/2,(z.y0+z.y1)/2,30);if(!toSBack){label(R.to==='SU'?'GOING UP':'GOING DOWN',lx,ly,'#ffcf4a',10,700);bar(lx-20,ly+8,40,k,'#ffcf4a');}}}
  const W=L4.wave;if(W&&W.at&&curFloor==='SU'&&(L4.waveQ.length||simT<W.at)){const pulse=(Math.sin(now*8)+1)/2;toSBack=false;const[x,y]=toS(L4_HATCH.x,L4_HATCH.y,10);if(!toSBack){gPath(L4_HATCH.x,L4_HATCH.y,20+pulse*6);ox.strokeStyle=`rgba(214,160,255,${(.5+pulse*.4).toFixed(2)})`;ox.lineWidth=2.5;ox.stroke();label(simT<W.at?'SOMETHING\'S COMING UP':'THE SHAFT',x,y-16,'#e2b8ff',9,700);}}
}

/* ---------- the big map: the zip line's cable down to the bridge (from road.js's buildEast) ---------- */
function l4Cable(grp){
  const st=new T.MeshStandardMaterial({color:0x5b636a,metalness:.65,roughness:.38}),cb=new T.MeshStandardMaterial({color:0x15171a,roughness:.5,metalness:.4}),A=L4_ANCHOR;
  grp.add(l4Beams([[A.x-5,0,A.y,A.x,20,A.y,1.2],[A.x+5,0,A.y,A.x,20,A.y,1.2],[A.x,0,A.y-5,A.x,20,A.y,1.2],[A.x-3,10,A.y,A.x+3,10,A.y,.6]],st));
  const c=l4Beams([[A.x,19,A.y,2060,560,-1460,.6]],cb);c.castShadow=false;grp.add(c);
}
