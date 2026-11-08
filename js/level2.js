"use strict";
/* Level 2, "Lights Out" (Bryan: "Maybe level 2 can be level 3 and something a little easier for level 2"; the draft is
   docs/map-draft-G.png): a power station on the coast that runs the data center's floodlights. The squad comes in by dinghy
   to the cove in the south-west, past the fishermen's shacks (two men at a fire) and the road checkpoint (two more), into the
   fenced station: the main gate under a machine gun, or the hole in the fence on the west side behind the cooling tanks.
   Through the transformer yard (a patrol and two posts; the transformers block sight), the generator hall (one man), and the
   control building (two rooms, two men: a Breach), where the panel shuts the generators down. Every lamp goes out, the siren
   goes, and the guards who are left hunt the squad in the dark with torches, seeing less; get to the boat on the bay's shore
   in the east and away. Then the report, the sea and the loadout, and the data center (Level 3), whose floodlights and the
   heavy gun's searchlight are dark once this is done (darkFront).
   Its own small map, swapped in the way Level 1's is (MAPID 'l2', the big map waiting in STASH.out); the same squad with the
   loadout picked between missions. Its guards are between Level 1's and the data center's: aim 0.08 worse, ×1.25 damage
   taken, 25 m eyes; no radios, dogs or grenades. No saves: a failed run starts again from the cove. */
const L2B={x0:0,x1:1000,y0:-100,y1:900};
const L2E={aim:.08,dmgIn:1.25,eye:{r:250,cone:1.05},reach:300,dark:{r:150,cone:.85},darkReach:170,nightAim:.1};   // (reach: how far an alerted man sees all round and shoots, 30 m where elsewhere it's 38; dark: once the lights are out, torches only: an unaware man's eyes, his reach, and his aim worse still)
const L2_START=[[78,786],[108,782],[88,808],[118,806]];   // A1, A2, B1, B2 on the cove
const L2_BOAT={x0:836,x1:898,y0:690,y1:770};              // the boat out, on the bay's shore (south-east)
const L2_REST=[{k:'med',x:232,y:428},{k:'sup',x:452,y:424}];   // inside the gate, once the yard's quiet
const L2_DONE_KEY='warehouseYard.l2done';
const L2S=1.4;   // ground texture: px per unit
const L2_LAMPS=[
  {x:236,y:640,h:7,c:0xff8a3a,i:1.8,d:150,flick:1,fire:1},   // the fire at the shacks (it doesn't go out with the power)
  {x:690,y:420,h:24,c:0xffa860,i:2.2,d:220,pole:1},          // the road checkpoint, up by the east gate
  {x:290,y:500,h:30,c:0xc4d6ff,i:2.6,d:260,pole:1},{x:380,y:500,h:30,c:0xc4d6ff,i:2.6,d:260,pole:1},   // the main gate's floodlights
  {x:250,y:240,h:32,c:0xc4d6ff,i:2.3,d:260,pole:1},{x:520,y:320,h:32,c:0xc4d6ff,i:2.3,d:260,pole:1},   // the transformer yard
  {x:170,y:184,h:20,c:0xffd9a8,i:1.8,d:170},{x:440,y:176,h:20,c:0xffd9a8,i:1.8,d:170},            // the hall's door, the control building's door
  {x:880,y:700,h:16,c:0xffc27a,i:1.6,d:160,pole:1},          // the bay, by the boat
];
const l2={};   // the run: {land, yardClear, powerDown, exfil, away, won, t0}
let L2=null;

/* ---------- the map ---------- */
function l2Objects(){
  const out=[],O2=(kind,x,y,w,h,extra)=>out.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind)},extra||{}));
  O2('water',0,830,1000,70);O2('water',900,520,100,310);   // the sea along the south, the bay in the east
  // the fishermen's camp: two old containers for sheds, the fire barrel, crates; more cover on the way north
  O2('container',150,590,90,34,{col:'#6a3324',tag:'MSKU 1180'});O2('container',300,556,34,84,{col:'#4a5230',tag:'CMAU 0412'});
  O2('barrel',229,633,14,14,{col:'#4a3a2a'});O2('crate',252,700,26,22);O2('crate',96,700,24,20);O2('pallet',56,742,30,20);
  O2('container',330,700,90,30,{col:'#2c4a63',tag:'OOLU 7713'});O2('sandbag',440,702,50,12);O2('crate',520,610,26,22);
  // the road checkpoint, up by the station's east gate
  O2('sandbag',660,402,12,32);O2('sandbag',672,402,40,12);O2('barrier',628,452,52,10);
  // the station's fence (see and shoot through it, not walk): the main gate (x 300-370) south, the hole (y 320-360) west,
  // the east gate (y 290-340) out to the road
  O2('fence',40,20,568,8);O2('fence',40,28,8,292);O2('fence',40,360,8,130);O2('fence',40,490,260,8);O2('fence',370,490,238,8);
  O2('fence',600,28,8,262);O2('fence',600,340,8,150);
  O2('sandbag',314,463,42,10);O2('sandbag',314,443,10,20);O2('sandbag',346,443,10,20);   // the gate's machine-gun nest
  O2('ctank',62,374,46,46);O2('ctank',128,404,46,46);   // the cooling tanks by the hole
  O2('container',92,294,34,96,{col:'#4f565b',tag:'TGHU 2201'});   // a store container just inside the hole: it screens the hole from the yard's patrol
  for(const y of[200,270,340])for(let k=0;k<5;k++)O2('xfmr',240+k*62,y,40,26);   // the transformer yard (full: they block sight)
  // the generator hall: its door south (x 150-190), two generators inside
  O2('wall',80,60,170,8);O2('wall',80,68,8,102);O2('wall',242,68,8,102);O2('wall',80,170,70,8);O2('wall',190,170,60,8);
  O2('rack',100,76,56,16);O2('rack',172,76,56,16);
  // the control building: two rooms; the front door into the west one (x 420-460), the back door into the east one
  // (x 530-570) off the strip along the north fence, a doorway between them (y 94-134); the panel on the east room's north wall
  O2('wall',400,64,130,8);O2('wall',570,64,10,8);O2('wall',400,72,8,92);O2('wall',572,72,8,92);O2('wall',400,156,20,8);O2('wall',460,156,120,8);
  O2('wall',486,72,8,22);O2('wall',486,134,8,22);
  O2('desk',414,80,40,12);O2('console',497,76,30,12);   // (the console west of the back door: the doorway stays clear)
  out.push(...voidRects([L2B]));
  return out;
}
// the two rooms of the control building, for the Breach marker (orders.js)
const L2_ROOMS=[{x0:408,y0:72,x1:486,y1:156,name:'the control room'},{x0:494,y0:72,x1:572,y1:156,name:'the panel room'}];
const L2_ROAD=[[905,740],[800,720],[720,650],[668,560],[650,450],[642,340],[604,315]];   // the coast road: from the bay up to the east gate
function paintL2Ground(g){
  const w=L2B.x1-L2B.x0,h=L2B.y1-L2B.y0,r=rng(5151),X=L2B.x0,Y=L2B.y0;
  g.setTransform(L2S,0,0,L2S,-X*L2S,-Y*L2S);
  g.fillStyle='#34372f';g.fillRect(X,Y,w,h);   // wet scrub and gravel
  for(let i=0;i<14000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.05)':'rgba(0,0,0,.22)';g.fillRect(X+r()*w,Y+r()*h,r()*1.8+.4,r()*1.8+.4);}
  const blot=(x,y,rad,a)=>{const gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,`rgba(0,0,0,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();};
  for(let i=0;i<60;i++)blot(X+r()*w,Y+r()*h,10+r()*40,.32);
  // the shore: sand down to the sea, and along the bay
  {const gr=g.createLinearGradient(0,760,0,832);gr.addColorStop(0,'rgba(124,110,86,0)');gr.addColorStop(.35,'rgba(124,110,86,.5)');gr.addColorStop(1,'rgba(48,43,34,.95)');g.fillStyle=gr;g.fillRect(X,760,w,72);}
  {const gr=g.createLinearGradient(850,0,902,0);gr.addColorStop(0,'rgba(124,110,86,0)');gr.addColorStop(1,'rgba(60,52,40,.9)');g.fillStyle=gr;g.fillRect(850,500,52,332);}
  for(let i=0;i<1200;i++){g.fillStyle=`rgba(${150+r()*40|0},${135+r()*30|0},${100+r()*30|0},.12)`;g.fillRect(X+r()*w,772+r()*58,1.2,1.2);}
  g.fillStyle='#0b1216';g.fillRect(X,830,w,80);g.fillRect(900,520,100,320);
  // the station: a concrete pad inside the fence, a lighter gravel yard round the transformers, the buildings' floors
  g.fillStyle='#4a4d4f';g.fillRect(48,28,552,462);
  g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1;for(let x=48;x<=600;x+=40){g.beginPath();g.moveTo(x+.5,28);g.lineTo(x+.5,490);g.stroke();}for(let y=28;y<=490;y+=40){g.beginPath();g.moveTo(48,y+.5);g.lineTo(600,y+.5);g.stroke();}
  g.fillStyle='rgba(120,124,118,.35)';g.fillRect(228,188,326,190);for(let i=0;i<2600;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.18)';g.fillRect(228+r()*326,188+r()*190,1.2,1.2);}
  g.fillStyle='#3d4043';g.fillRect(88,68,154,102);g.fillRect(408,72,164,84);
  // the coast road: asphalt from the bay up to the east gate, a broken centre line
  g.strokeStyle='#26282b';g.lineWidth=36;g.lineCap='round';g.lineJoin='round';g.beginPath();g.moveTo(...L2_ROAD[0]);for(const p of L2_ROAD.slice(1))g.lineTo(...p);g.stroke();
  g.strokeStyle='rgba(220,200,120,.55)';g.lineWidth=1.6;g.setLineDash([10,12]);g.beginPath();g.moveTo(...L2_ROAD[0]);for(const p of L2_ROAD.slice(1))g.lineTo(...p);g.stroke();g.setLineDash([]);
  // worn tracks: up from the cove past the shacks to the gate; to the hole in the fence; across the station
  g.strokeStyle='#2b2e28';g.lineWidth=22;g.beginPath();g.moveTo(110,800);g.lineTo(200,700);g.lineTo(330,640);g.lineTo(335,520);g.lineTo(335,470);g.stroke();
  g.beginPath();g.moveTo(130,700);g.lineTo(60,560);g.lineTo(30,360);g.stroke();
  g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=14;g.beginPath();g.moveTo(335,470);g.lineTo(335,180);g.lineTo(440,150);g.stroke();g.beginPath();g.moveTo(170,175);g.lineTo(335,180);g.stroke();
  // hazard stripes across the main gate, a warning panel by the transformers
  g.save();g.beginPath();g.rect(300,492,70,6);g.clip();g.fillStyle='rgba(228,182,40,.8)';for(let x=290;x<380;x+=10){g.beginPath();g.moveTo(x,498);g.lineTo(x+5,498);g.lineTo(x+12,492);g.lineTo(x+7,492);g.fill();}g.restore();
  // scorched ground round the fire
  blot(236,640,26,.5);
  // puddles catching the light
  for(let i=0;i<32;i++){const x=X+20+r()*(w-40),y=Y+40+r()*(h-170),rx=8+r()*26,ry=5+r()*12;puddle(g,'col',x,y,rx,ry,r()*3);}
}
function paintL2Rough(q){   // how rough each bit is (the same puddles as the colour picture: same seed and order), mirror-smooth
  const w=L2B.x1-L2B.x0,h=L2B.y1-L2B.y0,X=L2B.x0,Y=L2B.y0;q.setTransform(1,0,0,1,-X,-Y);
  q.fillStyle='rgb(186,186,186)';q.fillRect(X,Y,w,h);q.fillStyle='rgb(232,232,232)';q.fillRect(X,772,w,58);q.fillStyle='rgb(140,140,140)';q.fillRect(48,28,552,462);
  const r=rng(5151);for(let i=0;i<14000;i++){r();r();r();r();r();}for(let i=0;i<60;i++){r();r();r();}for(let i=0;i<1200;i++){r();r();r();r();r();}for(let i=0;i<2600;i++){r();r();r();}
  for(let i=0;i<32;i++){const x=X+20+r()*(w-40),y=Y+40+r()*(h-170),rx=8+r()*26,ry=5+r()*12;puddle(q,'rough',x,y,rx,ry,r()*3);}
}
function disposeL2(){
  if(!L2||!L2.scene)return;
  L2.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of[].concat(o.material)){if(m.map&&m.map!==L2.tex)m.map.dispose();m.dispose();}}});
  if(L2.tex)L2.tex.dispose();if(L2.rtex)L2.rtex.dispose();L2=null;
}
function buildLevel2(){
  disposeL2();
  const objsL=l2Objects();
  L2={objs:objsL,lamps:L2_LAMPS.map(l=>Object.assign({},l)),hq:[],scene:null,lights:null,canvas:null,tex:null,camp:[],chk:[],gate:[],yard:[],hall:[],ctrl:[]};
  const sc=new T.Scene();sc.background=new T.Color(FOG);sc.fog=new T.FogExp2(FOG,0.0004);L2.scene=sc;
  const fc=document.createElement('canvas');fc.width=Math.round((L2B.x1-L2B.x0)*L2S);fc.height=Math.round((L2B.y1-L2B.y0)*L2S);
  paintL2Ground(fc.getContext('2d'));
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;L2.canvas=fc;L2.tex=tex;
  const rc=document.createElement('canvas');rc.width=L2B.x1-L2B.x0;rc.height=L2B.y1-L2B.y0;paintL2Rough(rc.getContext('2d'));L2.rtex=new T.CanvasTexture(rc);
  const keep=scene;scene=sc;   // build into Level 2's scene (addMesh, meshObjs, makeDinghy and makeSoldier add to `scene`)
  try{
    const gw=L2B.x1-L2B.x0,gh=L2B.y1-L2B.y0;
    const ground=new T.Mesh(new T.PlaneGeometry(gw,gh),wetGround(new T.MeshStandardMaterial({map:tex,roughnessMap:L2.rtex,roughness:1,metalness:.14}),gw,gh));
    ground.rotation.x=-Math.PI/2;ground.position.set((L2B.x0+L2B.x1)/2,0,(L2B.y0+L2B.y1)/2);ground.receiveShadow=true;sc.add(ground);
    const om=new T.MeshStandardMaterial({color:0x1c1f22,roughness:1}),E=2500;   // dark ground beyond the west and north edges
    for(const[x0,z0,x1,z1]of[[-E,L2B.y0-E,L2B.x1+E,L2B.y0],[-E,L2B.y0,L2B.x0,830]]){const m=new T.Mesh(new T.PlaneGeometry(x1-x0,z1-z0),om);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,-.3,(z0+z1)/2);sc.add(m);}
    const wm=new T.MeshStandardMaterial({color:0x0a141b,roughness:.12,metalness:.7});   // the sea: south, and the bay running off the east edge
    const sea=new T.Mesh(new T.PlaneGeometry(gw+2*E,E),wm);sea.rotation.x=-Math.PI/2;sea.position.set((L2B.x0+L2B.x1)/2,.15,830+E/2);sea.receiveShadow=true;sc.add(sea);
    const bay=new T.Mesh(new T.PlaneGeometry(E,830-500+.1),wm);bay.rotation.x=-Math.PI/2;bay.position.set(900+E/2,.15,(500+830)/2);sc.add(bay);
    const bayN=new T.Mesh(new T.PlaneGeometry(E,600),om);bayN.rotation.x=-Math.PI/2;bayN.position.set(1000+E/2,-.3,200);sc.add(bayN);
    meshObjs(objsL.filter(o=>o.kind!=='void'&&o.kind!=='water'));
    // a wooden pier out into the bay (to look at), and the boat out pulled up on the shore beside it
    const wood=new T.MeshStandardMaterial({color:0x5c4a38,roughness:.9});addMesh(new T.BoxGeometry(80,2,22),wood,940,2.2,714);
    for(let x=908;x<=978;x+=14)for(const z of[705,723])addMesh(new T.CylinderGeometry(1.1,1.1,7,6),wood,x,-1,z);
    const d=makeDinghy();if(d.parent)d.parent.remove(d);sc.add(d);d.position.set(912,.2,742);d.rotation.y=-Math.PI/2+.15;L2.boat=d;
    const ld=makeDinghy();if(ld.parent)ld.parent.remove(ld);sc.add(ld);ld.position.set(110,.2,1000);L2.landBoat=ld;   // the one they come in on
    const poleM=new T.MeshStandardMaterial({color:0x1d2124,roughness:.6,metalness:.6});
    for(const L of L2.lamps){
      if(L.fire){const fl=new T.Mesh(new T.ConeGeometry(4.2,7,8,1,true),new T.MeshBasicMaterial({color:0xff7a2a,transparent:true,opacity:.75,toneMapped:false,depthWrite:false}));fl.position.set(L.x-7,13.5,L.y);sc.add(fl);L.flame=fl;continue;}   // flames over the fire barrel
      const hd=new T.Mesh(new T.BoxGeometry(6,2,4),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(L.x,L.h+1.6,L.y);sc.add(hd);L.head=hd;
      if(L.pole)addMesh(new T.CylinderGeometry(1.2,1.6,L.h+2,8),poleM,L.x,(L.h+2)/2,L.y);
    }
    const hemi2=new T.HemisphereLight(0x5a6e96,0x140f0b,.17);hemi2.userData.base=.17;sc.add(hemi2);
    const moon2=new T.DirectionalLight(0x9fb4ff,.24);moon2.position.set(500-300,620,400-400);moon2.target.position.set(500,0,400);
    const phone=matchMedia('(pointer:coarse)').matches;moon2.castShadow=true;moon2.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);
    Object.assign(moon2.shadow.camera,{left:-720,right:720,top:720,bottom:-720,near:50,far:2000});moon2.shadow.bias=-0.0008;sc.add(moon2,moon2.target);
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
    L2.lights={hemi:hemi2,moon:moon2,lampPool:pool,muzzle:mz,boomL:bl};
  }finally{scene=keep;}
}

/* ---------- its guards ---------- */
function spawnL2(){
  const G=(id,x,y,ang,zone,o={})=>hostile(id,x,y,Object.assign({ang,zone,jumpy:false,aimPen:L2E.aim,dmgIn:L2E.dmgIn,eye:L2E.eye,reach:L2E.reach,nade:0},o));
  const CAMP={x0:140,x1:430,y0:560,y1:760},CHK={x0:620,x1:760,y0:370,y1:490},YARD={x0:220,x1:592,y0:176,y1:480},HALL={x0:88,x1:242,y0:92,y1:168},CW={x0:410,x1:484,y0:98,y1:154},CE={x0:496,x1:570,y0:98,y1:154};
  L2.camp=[G('S1',210,640,0,CAMP),G('S2',236,664,-Math.PI/2,CAMP)];                   // at the fire (one west of it facing east, one south of it facing north): the cove and the west edge behind them both
  L2.chk=[G('C1',678,394,2.5,CHK),G('C2',700,434,Math.PI/2,CHK)];                      // the road checkpoint by the east gate, looking south-west and down the road
  L2.gate=[G('M1',335,452,Math.PI/2,YARD,{name:'Gunner',gunner:true,post:true})];       // the machine gun on the main gate
  L2.yard=[G('Y1',230,318,0,YARD,{route:[{x:230,y:318},{x:562,y:318}],ri:0}),         // walking the yard's south aisle end to end
           G('Y2',470,384,Math.PI/2,YARD),G('Y3',332,172,Math.PI/2,YARD)];             // watching the gate from inside; the yard from the north
  L2.hall=[G('G1',170,112,Math.PI/2,HALL)];                                           // in the generator hall, facing its door
  L2.ctrl=[G('K1',440,114,Math.PI/2,CW),G('K2',540,126,0,CE)];                          // the control room (facing the front door); the panel room (his back to the doorway between them)
}
const l2All=()=>[...L2.camp,...L2.chk,...L2.gate,...L2.yard,...L2.hall,...L2.ctrl];

/* ---------- in and out ---------- */
function resetL2(){Object.assign(l2,{land:null,yardClear:false,powerDown:false,exfil:false,away:null,won:false,t0:simT});}
function enterLevel2(){
  buildLevel2();
  stashOut(players);
  useMap({objs:L2.objs,hq:L2.hq,slow:[],lamps:L2.lamps,scene:L2.scene,lights:L2.lights});
  tankFires=[];rockets=[];charges=[];
  for(const p of players){moveMesh(p,L2.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,inBoat:false,offMap:false});}
  players.forEach((p,i)=>{const s=L2_START[i]||L2_START[0];p.x=s[0];p.y=s[1];p.ang=-Math.PI/2;});
  units=[...players];MAPID='l2';LEVEL=2;
  spawnL2();enemies=units.filter(u=>u.side==='E');civs=[];
  resetL2();mission.t0=simT;contact=false;clearTeams();sel=[];cardGroup=[];
  VB={x0:L2B.x0,z0:L2B.y0,x1:L2B.x1,z1:L2B.y1};FIT.w=L2B.x1-L2B.x0+40;FIT.h=L2B.y1-L2B.y0+40;fitDist();
  zoom=2.2;yaw=0;tilt=0;camT={x:200,z:740};clampCam();updateCamera();
  l2Acts();updateObjUI();setStatus();buildCards();hud();
}
function leaveLevel2Now(){   // back to the big map at once (a new game, Level 3 after this one, Run it again)
  if(MAPID!=='l2')return;const out=STASH.out;for(const p of players){p.inBoat=false;}
  for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';
  for(const p of players){p.offMap=false;moveMesh(p,out.scene);}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=[];
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();
}
function startLevel2(again){   // from the between-missions screen (or "Try Level 2 again": straight onto the cove, no boat in)
  reset();if(typeof applyLoadout==='function')applyLoadout();
  $('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  enterLevel2();state='play';
  if(again)banner('Level 2: shut the power station down, then out by the boat in the east.',3200);
  else{l2.land={t:0};l2LandPose();banner('Coming in to the cove…',2400);}
  hud();
}
// the dinghy comes in to the cove with them sitting in it (like the data center's landing), then they hop out to their spots
const L2_LAND_T=4.2;
function l2LandPose(){
  const k=Math.min(1,l2.land.t/L2_LAND_T),e=1-Math.pow(1-k,3),bx=110,by=846+150*(1-e),B=L2.landBoat;
  if(B){B.position.set(bx,.2,by);B.rotation.set(0,0,Math.sin(simT*1.7)*.035);}
  players.forEach((p,i)=>{const s=LAND_SEATS[i%4];p.x=bx+s[0];p.y=by+s[1];p.elev=1.2;p.path=[];p.inBoat=true;p.ang=-Math.PI/2;});
  return k>=1;
}
function l2LandTick(dt){
  const L=l2.land;if(!L)return;L.t+=dt;
  if(!l2LandPose())return;
  l2.land=null;
  players.forEach((p,i)=>{p.inBoat=false;p.elev=0;const st=L2_START[i]||L2_START[0],q={x:p.x,y:820},path=findPath(q.x,q.y,st[0],st[1]);p.path=[q,...(path||[{x:st[0],y:st[1]}])];p.lastOrder=simT;});
  banner('Level 2: shut the power station down. Then out by the boat in the east.',3400);hud();
}

/* ---------- the panel: lights out ---------- */
function l2Acts(){
  for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].map==='l2')ACTS.splice(i,1);
  ACTS.push({id:'genpanel',map:'l2',x:512,y:96,r:14,standY:14,secs:3,label:'SHUT DOWN',avail:()=>!l2.powerDown,act:u=>powerDown(u)});
}
function powerDown(u){
  if(l2.powerDown)return;l2.powerDown=true;l2.darkT=simT;
  for(const L of L2.lamps){if(L.fire)continue;L.off=true;if(L.head)L.head.material.color.setHex(0x1c1f22);}
  if(L2.lights&&L2.lights.hemi){L2.lights.hemi.userData.base=.1;}
  shake(.4);if(typeof sfxSiren==='function')sfxSiren();
  callout(u,'Power’s out',C.good);bigText('Lights out','inbound');
  // the guards who are left: torches on, seeing less and shooting worse in the dark; the station's own hunt round the control
  // building, the camp and the checkpoint hold where they are, on alert
  const lk={x:490,y:114},inside=e=>e.x>48&&e.x<600&&e.y>28&&e.y<490;
  for(const e of enemies){if(beaten(e))continue;e.eye=L2E.dark;e.reach=L2E.darkReach;e.aimPen=(e.aimPen||0)+L2E.nightAim;torchOn(e);
    if(inside(e)){if(typeof alertOne==='function')alertOne(e,lk,false);}else{e.alerted=true;e.jumpy=true;e.aware=1;}}
  updateObjUI();hud();
}
function torchOn(e){   // a hostile's torch in the dark: the squad's beam on his chest (looks only: no light, cheap)
  const ch=e.m&&e.m.fig&&e.m.fig.bones[BI.chest];if(!ch||e.torch)return;
  const b=new T.Mesh(SG.beam,SG.beamMat);b.position.set(2.0,1.2,1.0);b.rotation.z=-.24;b.renderOrder=2;ch.add(b);e.torch=b;
}

/* ---------- the way out ---------- */
const l2BoatNeed=()=>players.filter(p=>!p.dead);
const l2BoatIn=p=>p.x>=L2_BOAT.x0&&p.x<=L2_BOAT.x1&&p.y>=L2_BOAT.y0&&p.y<=L2_BOAT.y1;
function l2ExfilTick(dt){
  if(!l2.exfil||l2.won)return;
  if(l2.away!=null){   // pushing off: east out of the bay with them in it
    l2.away+=dt;const B=L2.boat,k=Math.min(1,l2.away/3.2),e=k*k,bx=912+e*200,by=742+e*40;
    if(B){B.position.set(bx,.2,by);B.rotation.set(0,-Math.PI/2,Math.sin(simT*1.7)*.035);}
    l2BoatNeed().forEach((p,i)=>{const s=LAND_SEATS[i%4];p.x=bx-s[1];p.y=by+s[0];p.path=[];p.ang=0;});
    if(l2.away>=1.4&&!l2.won)l2Win();return;
  }
  const need=l2BoatNeed();if(!need.length)return;
  if(need.every(l2BoatIn)){   // all aboard (a man who's down carried in): push off
    l2.away=0;sel=[];cardGroup=[];preview=null;mode=null;
    for(const p of need){if(p.carry){const c=p.carry;c.carriedBy=null;p.carry=null;}Object.assign(p,{inBoat:true,path:[],supT:null,focus:null,silent:null,elev:1.2});}
    bigText('Pushing off','clear');hud();
  }
}
function l2Win(){
  if(l2.won||state!=='play'||MAPID!=='l2')return;l2.won=true;
  try{localStorage.setItem(L2_DONE_KEY,'1');}catch(e){}
  state='end';setStatus();bigText('Mission complete!','complete');setTimeout(showAAR,2600);
}
const l2Done=()=>{try{return localStorage.getItem(L2_DONE_KEY)==='1';}catch(e){return false;}};
function l2Threat(){   // before anyone's seen: where previews judge cover from
  if(!L2.camp.every(beaten))return{x:232,y:640};if(!L2.gate.every(beaten))return{x:335,y:452};if(!L2.ctrl.every(beaten))return{x:490,y:114};return{x:400,y:300};
}

/* ---------- every tick (from update) ---------- */
function l2Tick(dt){
  if(MAPID!=='l2'||!L2)return;
  l2LandTick(dt);stationTick(dt);useTick(dt);patrolTick();l2ExfilTick(dt);
  if(l2.powerDown&&!l2.exfil&&simT-l2.darkT>1.6){l2.exfil=true;banner('Every light’s gone. They’re hunting you in the dark. Get to the boat on the bay, south-east.',3600);updateObjUI();hud();}   // (game time: a pause holds it)
  for(const L of L2.lamps)if(L.flame){L.flame.scale.set(1+Math.sin(simT*9)*.08,1+Math.sin(simT*13.3)*.18,1);}
  if(!l2.yardClear&&[...L2.gate,...L2.yard].every(beaten)&&simT-lastNoiseT>3){   // the yard quiet: a checkpoint inside the gate
    l2.yardClear=true;addZones(L2_REST);bigText('Checkpoint','clear');banner('Yard clear. A medic station and an ammo drop are inside the gate.',3200);chatSecured();updateObjUI();
  }
}
function l2Hint(){
  if(l2.land)return '';
  if(l2.exfil)return 'Lights out: get to the boat on the bay’s shore, south-east: tap its arrows and everyone goes. Out by the main gate and across the open ground; the checkpoint holds the road by the east gate. Carry anyone who’s down.';
  if(l2.powerDown)return 'The power’s out.';
  const inside=players.some(p=>alive(p)&&p.x>48&&p.x<600&&p.y>28&&p.y<490);
  if(!inside)return 'The power station is north. Two men at the fire by the shacks, two at the road checkpoint by its east gate. In by the main gate (a machine gun covers it) or the hole in the fence on the west side.';
  if(!L2.ctrl.every(beaten))return 'The control building is north-east (two rooms, two men): Breach it, then shut the power down at the panel.';
  return 'Shut the power down: select a soldier and tap SHUT DOWN at the panel in the control building.';
}

/* ---------- drawn on the overlay ---------- */
function drawL2(now){
  if(MAPID!=='l2'||!L2)return;
  // (the way out, the boat on the bay's shore, is a marker with the other ways through since v116: interior.js's boatExit and drawGather)
  if(!l2.powerDown){toSBack=false;const[lx,ly]=below(512,76,8);if(!toSBack)label('PANEL',lx,ly-30,'#ffcf4a',9,700);}
}
// the data center (Level 3) once the power's been cut: its front's floodlights, lamps and the heavy gun's searchlight dark
function darkFront(on){
  HEAVY.dark=!!on;
  for(const L of lamps)if(L.front){L.off=!!on;if(L.head)L.head.material.color.setHex(on?0x1c1f22:L.c);}
  if(typeof FLOOD_HEADS!=='undefined')for(const m of FLOOD_HEADS)m.material.color.setHex(on?0x1c1f22:0xfff3d6);
  for(const u of enemies)if(u.heavy&&u.slight)u.slight.visible=!on&&!u.dead;
}
