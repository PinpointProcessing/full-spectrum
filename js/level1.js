"use strict";
/* Level 1 (Bryan: "it's still really hard... this has to be a tutorial map/first level... save this map for level two and add
   an easier map"; the plan is docs/level1.md). A small night mission on its own map, swapped in the way the office building's
   inside is (interior.js): the big map (Level 2) waits in STASH.out, untouched.
   South to north, one lesson each:
   1 the beach: no enemies; the boot camp (tutorial steps, below)
   2 the shed: one guard with his back to the beach (a takedown)
   3 the gate: two guards looking away from each other (Alpha's silencers: both take one, then the other)
   4 the yard: four guards round a fire barrel and the sandbags, who fight once they find you (a forgiving firefight)
   5 the relay hut: a wounded scout to bring round; clearing the yard makes a checkpoint there (a medic station, an ammo drop)
   6 the radio relay, a mast beside the hut: a rocket or a grenade close to it brings it down. Mission complete, then Level 2.
   Its guards aim worse, go down faster and see less far (L1E), and have no radio, grenades, dogs or reinforcements. */
let LEVEL=3,L1=null;   // 1 the radio tower, 2 Lights Out (level2.js), 3 the data center
const L1B={x0:0,x1:720,y0:120,y1:900};   // the map (inside the shared frame; void all round it)
const L1E={aim:.15,dmgIn:1.6,eye:{r:210,cone:1}};   // its guards: on top of ENEMY_AIM; damage taken ×1.6 (about 60 HP); eyes 21 m, ±57°
const L1_START=[[170,818],[198,814],[180,840],[208,838]];   // A1, A2, B1, B2 on the beach
const L1_REST=[{k:'med',x:180,y:244},{k:'sup',x:590,y:236}];   // the checkpoint by the relay hut, once the yard is clear
const L1_SCOUT={x:360,y:262};
const L1_DONE_KEY='warehouseYard.l1done';
const L1S=1.5;   // ground texture: px per unit
const L1_LAMPS=[
  {x:120,y:850,h:14,c:0xffc27a,i:1.4,d:150,pole:1},   // the beach, by the dinghy
  {x:538,y:632,h:20,c:0xffa860,i:2.2,d:200},          // a work lamp on the shed
  {x:284,y:596,h:30,c:0xc4d6ff,i:2.4,d:240,pole:1},{x:376,y:596,h:30,c:0xc4d6ff,i:2.4,d:240,pole:1},   // the gate
  {x:120,y:432,h:36,c:0xffa860,i:2.4,d:280,pole:1},{x:646,y:330,h:36,c:0xffa860,i:2.4,d:280,pole:1},   // the yard
  {x:360,y:254,h:20,c:0xffd9a8,i:2,d:180},            // over the hut's door
];
const l1={};   // the run: {yardClear,scoutUp,relayHP,relayDown,won,t0}
const l1Done=()=>{try{return localStorage.getItem(L1_DONE_KEY)==='1';}catch(e){return false;}};

/* ---------- the map ---------- */
function l1Objects(){
  const out=[],O1=(kind,x,y,w,h,extra)=>out.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind)},extra||{}));
  O1('water',0,862,720,38);   // the river along the south edge; the squad lands on its north bank
  // the beach: a container and a few crates to take cover behind (the boot camp)
  O1('container',250,735,104,34,{col:'#4a5230',tag:'CMAU 2210'});
  O1('crate',118,742,26,22);O1('crate',422,768,26,22);O1('barrel',84,796,16,16,{col:'#3a5160'});O1('barrel',100,800,16,16,{col:'#6b3a28'});
  // the shed (a container) the first guard stands by, and cover on the way to it
  O1('container',520,640,34,104,{col:'#6a3324',tag:'MSKU 7731'});
  O1('crate',382,690,26,22);O1('pallet',296,700,30,20);
  // the compound's chain-link fence, the gate a gap in it (x 290-370); you can see and shoot through the fence, not walk through it
  O1('fence',0,600,290,8);O1('fence',370,600,350,8);
  // the yard: cover on the way in
  O1('crate',236,498,28,28);O1('crate',418,480,28,28);O1('barrel',326,520,16,16,{col:'#3a5160'});O1('barrel',344,524,16,16,{col:'#6b3a28'});
  O1('truck',560,440,46,90,{col:'#3a4433'});O1('sandbag',150,470,60,12);O1('sandbag',468,540,50,12);
  // the guards' sandbags at the north end, and the fire barrel two of them stand round
  O1('sandbag',178,388,56,12);O1('sandbag',298,372,56,12);O1('sandbag',440,380,56,12);O1('sandbag',572,398,56,12);
  O1('barrel',257,346,14,14,{col:'#4a3a2a'});
  // the low wall between the yard and the relay compound, a gap in the middle
  O1('wall',40,292,240,10);O1('wall',360,292,320,10);
  // the relay hut (its door in the south wall) and the relay mast beside it
  O1('wall',300,160,120,10);O1('wall',300,170,10,70);O1('wall',410,170,10,70);O1('wall',300,240,40,10);O1('wall',380,240,40,10);
  O1('rack',318,178,64,12);
  O1('relay',468,178,24,24);
  out.push(...voidRects([L1B]));
  return out;
}
function paintL1Ground(g){
  const w=L1B.x1-L1B.x0,h=L1B.y1-L1B.y0,r=rng(4242),X=L1B.x0,Y=L1B.y0;
  g.setTransform(L1S,0,0,L1S,-X*L1S,-Y*L1S);
  g.fillStyle='#363935';g.fillRect(X,Y,w,h);   // dark wet gravel and mud
  for(let i=0;i<11000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.055)':'rgba(0,0,0,.22)';g.fillRect(X+r()*w,Y+r()*h,r()*1.8+.4,r()*1.8+.4);}
  const blot=(x,y,rad,a)=>{const gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,`rgba(0,0,0,${a})`);gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();};
  for(let i=0;i<46;i++)blot(X+r()*w,Y+r()*h,10+r()*40,.35);
  // the beach: sand darkening to the waterline, then the river (a glossy plane over it in the scene)
  {const gr=g.createLinearGradient(0,766,0,862);gr.addColorStop(0,'rgba(124,110,86,0)');gr.addColorStop(.3,'rgba(124,110,86,.5)');gr.addColorStop(1,'rgba(48,43,34,.95)');g.fillStyle=gr;g.fillRect(X,766,w,96);}
  for(let i=0;i<900;i++){g.fillStyle=`rgba(${150+r()*40|0},${135+r()*30|0},${100+r()*30|0},.12)`;g.fillRect(X+r()*w,780+r()*76,1.2,1.2);}
  g.fillStyle='#161918';g.fillRect(X,855,w,8);g.fillStyle='#0b1216';g.fillRect(X,862,w,40);
  // the yard: compacted gravel, a little lighter, with tyre tracks round the truck
  g.fillStyle='rgba(130,134,136,.16)';g.fillRect(40,302,640,296);
  g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=5;
  for(const o of[-12,12]){g.beginPath();g.moveTo(583+o,598);g.bezierCurveTo(590+o,560,585+o,520,583+o,440);g.stroke();}
  // the relay compound: a concrete pad, and the hut's floor
  g.fillStyle='#4f5255';g.fillRect(40,150,640,142);
  g.strokeStyle='rgba(0,0,0,.2)';g.lineWidth=1;for(let x=40;x<=680;x+=40){g.beginPath();g.moveTo(x+.5,150);g.lineTo(x+.5,292);g.stroke();}for(let y=150;y<=292;y+=40){g.beginPath();g.moveTo(40,y+.5);g.lineTo(680,y+.5);g.stroke();}
  g.fillStyle='#424548';g.fillRect(310,170,100,70);
  // worn tracks: up from the beach to the gate, through the yard to the hut
  g.strokeStyle='#2c2f2c';g.lineWidth=26;g.lineCap='round';g.lineJoin='round';
  g.beginPath();g.moveTo(200,826);g.lineTo(300,720);g.lineTo(330,640);g.lineTo(330,560);g.lineTo(326,420);g.lineTo(320,300);g.lineTo(360,252);g.stroke();
  g.strokeStyle='rgba(0,0,0,.25)';g.lineWidth=2;for(const o of[-7,7]){g.beginPath();g.moveTo(200+o,826);g.lineTo(300+o,720);g.lineTo(330+o,640);g.lineTo(330+o,560);g.lineTo(326+o,420);g.lineTo(320+o,300);g.stroke();}
  // hazard stripes across the gate
  g.save();g.beginPath();g.rect(290,606,80,8);g.clip();g.fillStyle='rgba(228,182,40,.8)';for(let x=280;x<380;x+=10){g.beginPath();g.moveTo(x,614);g.lineTo(x+5,614);g.lineTo(x+14,606);g.lineTo(x+9,606);g.fill();}g.restore();
  // puddles catching the lamplight
  for(let i=0;i<24;i++){const x=X+20+r()*(w-40),y=Y+40+r()*(h-140),rx=8+r()*26,ry=5+r()*12;puddle(g,'col',x,y,rx,ry,r()*3);}
}
// how rough each bit of Level 1's ground is: the same puddles as the colour picture (same seed and order), mirror-smooth
function paintL1Rough(q){
  const w=L1B.x1-L1B.x0,h=L1B.y1-L1B.y0,X=L1B.x0,Y=L1B.y0;q.setTransform(1,0,0,1,-X,-Y);
  q.fillStyle='rgb(186,186,186)';q.fillRect(X,Y,w,h);
  q.fillStyle='rgb(232,232,232)';q.fillRect(X,780,w,82);   // dry sand up the beach
  q.fillStyle='rgb(150,150,150)';q.fillRect(40,150,640,142);   // the concrete pad
  // (the puddles: replay paintL1Ground's random numbers up to its puddles)
  const r=rng(4242);for(let i=0;i<11000;i++){r();r();r();r();r();}for(let i=0;i<46;i++){r();r();r();}for(let i=0;i<900;i++){r();r();r();r();r();}
  for(let i=0;i<24;i++){const x=X+20+r()*(w-40),y=Y+40+r()*(h-140),rx=8+r()*26,ry=5+r()*12;puddle(q,'rough',x,y,rx,ry,r()*3);}
}
function disposeL1(){
  if(!L1||!L1.scene)return;
  L1.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of[].concat(o.material)){if(m.map&&m.map!==L1.tex)m.map.dispose();m.dispose();}}});
  if(L1.tex)L1.tex.dispose();if(L1.rtex)L1.rtex.dispose();L1=null;
}
function buildLevel1(){
  disposeL1();
  const objsL=l1Objects();
  L1={objs:objsL,lamps:L1_LAMPS.map(l=>Object.assign({},l)),hq:[],scene:null,lights:null,canvas:null,tex:null,relay:null,scout:null,fence:[],gate:[],yard:[]};
  const sc=new T.Scene();sc.background=new T.Color(FOG);sc.fog=new T.FogExp2(FOG,0.00042);L1.scene=sc;
  const fc=document.createElement('canvas');fc.width=Math.round((L1B.x1-L1B.x0)*L1S);fc.height=Math.round((L1B.y1-L1B.y0)*L1S);
  paintL1Ground(fc.getContext('2d'));
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;L1.canvas=fc;L1.tex=tex;
  const rc=document.createElement('canvas');rc.width=L1B.x1-L1B.x0;rc.height=L1B.y1-L1B.y0;paintL1Rough(rc.getContext('2d'));L1.rtex=new T.CanvasTexture(rc);
  const keep=scene;scene=sc;   // build into Level 1's scene (addMesh, meshObjs, makeDinghy and makeSoldier add to `scene`)
  try{
    const gw=L1B.x1-L1B.x0,gh=L1B.y1-L1B.y0;
    const ground=new T.Mesh(new T.PlaneGeometry(gw,gh),wetGround(new T.MeshStandardMaterial({map:tex,roughnessMap:L1.rtex,roughness:1,metalness:.14}),gw,gh));
    ground.rotation.x=-Math.PI/2;ground.position.set((L1B.x0+L1B.x1)/2,0,(L1B.y0+L1B.y1)/2);ground.receiveShadow=true;sc.add(ground);
    // beyond the edges: dark ground west, north and east; the river runs on south
    const om=new T.MeshStandardMaterial({color:0x1c1f22,roughness:1}),E=2500;
    for(const[x0,z0,x1,z1]of[[-E,L1B.y0-E,L1B.x1+E,L1B.y0],[-E,L1B.y0,L1B.x0,862],[L1B.x1,L1B.y0,L1B.x1+E,862]]){const m=new T.Mesh(new T.PlaneGeometry(x1-x0,z1-z0),om);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,-.3,(z0+z1)/2);sc.add(m);}
    const water=new T.Mesh(new T.PlaneGeometry(gw+2*E,E),new T.MeshStandardMaterial({color:0x0a141b,roughness:.12,metalness:.7}));
    water.rotation.x=-Math.PI/2;water.position.set((L1B.x0+L1B.x1)/2,.15,862+E/2);water.receiveShadow=true;sc.add(water);
    meshObjs(objsL.filter(o=>o.kind!=='void'&&o.kind!=='water'));
    const d=makeDinghy();if(d.parent)d.parent.remove(d);sc.add(d);d.position.set(138,.1,858);d.rotation.y=.4;d.rotation.z=.05;L1.boat=d;   // pulled up on the beach: the way out (l1Exfil)
    const poleM=new T.MeshStandardMaterial({color:0x1d2124,roughness:.6,metalness:.6});
    for(const L of L1.lamps){const hd=new T.Mesh(new T.BoxGeometry(6,2,4),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(L.x,L.h+1.6,L.y);sc.add(hd);if(L.pole)addMesh(new T.CylinderGeometry(1.2,1.6,L.h+2,8),poleM,L.x,(L.h+2)/2,L.y);}
    // the wounded scout, lying by the hut's door (a soldier's model, no torch)
    const s={side:'P',team:'B',id:'SC',name:'Scout',x:L1_SCOUT.x,y:L1_SCOUT.y,ang:.4,path:[],downed:true,hp:20};makeSoldier(s);
    for(const k of['spot','beam'])if(s.m[k]&&s.m[k].parent)s.m[k].parent.remove(s.m[k]);s.m.ring.material.color.set(0xe8e8e8);
    s.m.g.position.set(s.x,0,s.y);s.m.g.rotation.y=-s.ang;L1.scout=s;extraFigs.length=0;extraFigs.push(s);   // (figure.js animates him)
    // the lights: a dark night like Level 2's, the lamps sharing a pool of six, two for muzzle flashes, one for blasts
    const hemi1=new T.HemisphereLight(0x5a6e96,0x140f0b,.17);hemi1.userData.base=.17;sc.add(hemi1);
    const moon1=new T.DirectionalLight(0x9fb4ff,.24);moon1.position.set(360-300,620,500-400);moon1.target.position.set(360,0,500);
    const phone=matchMedia('(pointer:coarse)').matches;moon1.castShadow=true;moon1.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);
    Object.assign(moon1.shadow.camera,{left:-620,right:620,top:620,bottom:-620,near:50,far:1900});moon1.shadow.bias=-0.0008;sc.add(moon1,moon1.target);
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
    L1.lights={hemi:hemi1,moon:moon1,lampPool:pool,muzzle:mz,boomL:bl};
  }finally{scene=keep;}
  L1.relay=objsL.find(o=>o.kind==='relay');
}

/* ---------- its guards ---------- */
function spawnL1(){
  const G=(id,x,y,ang,zone)=>hostile(id,x,y,{ang,zone,jumpy:false,l1:true,eye:L1E.eye,nade:0});
  const GZ={x0:250,x1:420,y0:520,y1:596},YZ={x0:60,x1:680,y0:310,y1:590};
  L1.fence=[G('L1',500,652,-Math.PI/2,{x0:440,x1:610,y0:612,y1:770})];   // by the shed, looking north: his back to the beach
  L1.gate=[G('L2',310,576,-2.25,GZ),G('L3',352,576,-.9,GZ)];             // either side of the gate, looking away from each other
  L1.yard=[G('L4',240,360,-.2,YZ),G('L5',288,360,Math.PI,YZ),G('L6',468,362,-Math.PI/2,YZ),G('L7',600,380,-2.3,YZ)];   // round the fire barrel and the sandbags
}

/* ---------- in and out ---------- */
function resetL1(){Object.assign(l1,{yardClear:false,scoutUp:false,relayHP:100,relayDown:false,won:false,exfil:false,away:null,t0:simT});leaveHeli();}
// Level 1 in play: the big map stashed, Level 1's built fresh (a clean ground, the relay standing, the scout down)
function enterLevel1(){
  buildLevel1();
  stashOut(players);
  useMap({objs:L1.objs,hq:L1.hq,slow:[],lamps:L1.lamps,scene:L1.scene,lights:L1.lights});
  tankFires=[];rockets=[];charges=[];
  for(const p of players){moveMesh(p,L1.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,inBoat:false,offMap:false});}
  players.forEach((p,i)=>{const s=L1_START[i]||L1_START[0];p.x=s[0];p.y=s[1];p.ang=-Math.PI/2;});
  units=[...players];MAPID='l1';LEVEL=1;
  spawnL1();enemies=units.filter(u=>u.side==='E');civs=[];
  resetL1();mission.t0=simT;contact=false;clearTeams();sel=[];cardGroup=[];
  VB={x0:L1B.x0,z0:L1B.y0,x1:L1B.x1,z1:L1B.y1};FIT.w=L1B.x1-L1B.x0+40;FIT.h=L1B.y1-L1B.y0+40;fitDist();
  zoom=2.4;yaw=0;tilt=0;camT={x:250,z:770};clampCam();updateCamera();
  l1Acts();updateObjUI();setStatus();buildCards();hud();
}
// back to the big map at once (a new game, Level 2 after this one, or Run it again)
function leaveLevel1Now(){
  if(MAPID!=='l1')return;const out=STASH.out;tut.on=false;extraFigs.length=0;leaveHeli();for(const p of players)p.inBoat=false;tut.tip=null;for(const el of document.querySelectorAll('.tutGlow'))el.classList.remove('tutGlow');
  for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';
  for(const p of players){p.offMap=false;moveMesh(p,out.scene);}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=[];
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();tutShow();
}
function startLevel1(again){   // again: "Try Level 1 again" (straight onto the beach, no helicopter)
  reset();   // (Level 2's squad, outdoors; back from Level 1 first if need be)
  $('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  enterLevel1();state='play';
  const go=()=>{tutStart(again);banner('Level 1: knock out the enemy radio tower up north.',3200);hud();};
  if(again)go();else startHeli(go);
  hud();
}
function startLevel3(){   // the data center (it was Level 2 until Bryan asked for an easier one before it: level2.js)
  LEVEL=3;clearSave();refreshSaveButtons();reset();if(typeof applyLoadout==='function')applyLoadout();darkFront(l2Done());startView();   // (what was picked between missions: equip.js; its front dark once Level 2's power was cut)
  $('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  state='play';startLanding();banner('Coming in to the dock…',2400);hud();
}

/* ---------- the start: a helicopter drops them on the beach (Bryan: "To start level 1, maybe a helicopter drops off the
   players, and a voice says, you're on your own now - good luck!") ----------
   It comes in low over the river from the south-east, hovers over the sand, the four jump out one after another and move
   up to their spots, and it climbs away to the south-west; the pilot on the radio as it comes in and as it goes. No orders
   until they're all down (heliBusy, input.js); the tutorial starts as it lifts away. */
const HELI={hover:{x:250,y:824,h:34},from:{x:600,y:1240,h:150},to:{x:-300,y:1200,h:190},T:{in:4.8,drop:5.3,gap:.42,out:7.6,gone:12}};
let heli=null;
function startHeli(onDone){
  const m=makeHeli();if(m.parent)m.parent.remove(m);L1.scene.add(m);
  heli={t:0,m,done:onDone,out:0,said:{}};
  for(const p of players){p.inHeli=true;p.x=HELI.hover.x;p.y=HELI.hover.y;p.path=[];}
  zoom=2.1;camT={x:240,z:790};clampCam();updateCamera();heliTick(0);
}
const heliBusy=()=>!!heli&&heli.out<players.length;   // (input.js: no orders until they're all on the ground)
function heliTick(dt){
  const H=heli;if(!H)return;H.t+=dt;const t=H.t,T=HELI.T,m=H.m,ud=m.userData,A=HELI.from,P=HELI.hover,Z=HELI.to;
  let x,y,h,yaw,pitch=0,roll=0;
  if(t<T.in){const k=t/T.in,e=1-Math.pow(1-k,2.4);x=A.x+(P.x-A.x)*e;y=A.y+(P.y-A.y)*e;h=A.h+(P.h-A.h)*(1-Math.pow(1-k,1.6));yaw=Math.atan2(P.x-A.x,P.y-A.y);pitch=k<.75?.12:-.18*(k-.75)/.25;}   // nose down coming in, flaring at the end
  else if(t<T.out){x=P.x+Math.sin(t*1.3)*1.5;y=P.y+Math.cos(t*1.1)*1.2;h=P.h+Math.sin(t*2.1)*.8;yaw=Math.atan2(P.x-A.x,P.y-A.y)+Math.sin(t*.6)*.03;}
  else{const k=Math.min(1,(t-T.out)/(T.gone-T.out)),e=k*k;x=P.x+(Z.x-P.x)*e;y=P.y+(Z.y-P.y)*e;h=P.h+(Z.h-P.h)*Math.min(1,k*1.6);const y0=Math.atan2(P.x-A.x,P.y-A.y),y1=Math.atan2(Z.x-P.x,Z.y-P.y);yaw=y0+(y1-y0)*Math.min(1,k*3);pitch=.14*Math.min(1,k*4);roll=-.2*Math.sin(Math.min(1,k*3)*Math.PI);}
  m.position.set(x,h,y);m.rotation.set(0,0,0);m.rotateY(yaw);m.rotateX(pitch);m.rotateZ(roll);
  ud.rotor.rotation.y+=dt*15;ud.tr.rotation.x+=dt*42;ud.strobe.visible=Math.sin(t*9)>.85;ud.beacon.visible=Math.sin(t*5)>.2;ud.lamp.intensity=t<T.out+1.5?3:0;
  H.pos={x,y,h};
  if(t>=T.drop){const n=Math.min(players.length,Math.floor((t-T.drop)/T.gap)+1);   // out of the doors one after another
    while(H.out<n){const i=H.out++,p=players[i];if(!p)break;const sd=i%2?1:-1,c=Math.cos(yaw),sn=Math.sin(yaw);
      p.inHeli=false;p.x=x+sd*12*c+(i<2?6:-6)*sn;p.y=y-sd*12*sn+(i<2?6:-6)*c;p.elev=24;p.ang=-Math.PI/2;
      const st=L1_START[i]||L1_START[0],path=findPath(p.x,p.y,st[0],st[1]);p.path=path||[];p.lastOrder=simT;}}
  if(t>.8&&!H.said.in&&(pilotSay('heli_in','Thirty seconds to the beach. Get ready.',t>2.4)))H.said.in=1;   // (a moment for his file to load: voice.js)
  if(t>T.out+.3&&!H.said.out&&(pilotSay('heli_out','You\u2019re on your own now. Good luck.',t>T.out+1.6)))H.said.out=1;
  if(t>=T.out+2.6&&H.done){const f=H.done;H.done=null;f();}   // (after the pilot's last word: the tutorial and the mission's line)
  if(t>=T.gone){if(m.parent)m.parent.remove(m);heli=null;}
}
function pilotSay(key,text,anyway){   // the pilot over the radio (his voice: sounds/voice/PL.mp3); false while his file's still loading, unless anyway
  const d=typeof voiceClip==='function'?voiceClip('PL',key+'_1',{radio:true}):0;
  if(!d&&!anyway&&sndOn&&typeof VSPR!=='undefined'&&VSPR&&VSPR.speakers.PL)return false;
  if(d&&typeof squelch==='function'){squelch(0);setTimeout(()=>squelch(0),(d+.1)*1000);}
  banner(`Pilot: \u201c${text}\u201d`,Math.max(2400,(d||1.8)*1000+700));return true;
}
function leaveHeli(){if(heli&&heli.m&&heli.m.parent)heli.m.parent.remove(heli.m);heli=null;for(const p of players)p.inHeli=false;}   // (leaving Level 1, or starting it again)

/* ---------- the scout, the checkpoint, the relay ---------- */
function l1Acts(){
  for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].map==='l1')ACTS.splice(i,1);
  ACTS.push({id:'scout',map:'l1',x:L1_SCOUT.x,y:L1_SCOUT.y,r:16,standY:16,secs:3,label:'WOUNDED SCOUT',avail:()=>!l1.scoutUp,act:u=>scoutUp(u)});
}
function scoutUp(u){
  l1.scoutUp=true;const s=L1.scout;
  if(s&&s.m){s.downed=false;s.x=L1_SCOUT.x-10;s.y=L1_SCOUT.y-18;s.ang=-Math.PI/2;}   // up on his feet by the door
  if(u)u.stats.revives++;
  callouts.push({x:L1_SCOUT.x,y:L1_SCOUT.y,t:0,dur:4,text:'Thanks. The radio tower\'s east of the hut.',col:'#dfe6ea',small:true});
  banner('Scout back on his feet. Now bring down the radio tower: Hayes\'s RPG.',3000);hud();
}
function l1Blast(x,y,by){   // (from tankBlast: every grenade and rocket)
  if(MAPID!=='l1'||!L1||!L1.relay||l1.relayDown)return;
  const d=rectDist(x,y,L1.relay);if(d>60)return;
  l1.relayHP-=d<25?100:70*(1-d/60);L1.relay.hitT=simT;
  if(l1.relayHP<=0)relayDown();else banner('The tower\'s damaged. Hit it again.',2000);
}
function relayDown(){
  l1.relayDown=true;const R=L1.relay,cx=R.x+R.w/2,cy=R.y+R.h/2;
  if(R.mesh){R.mesh.rotation.z=.6;R.mesh.rotation.x=.15;R.mesh.position.y=-3;}   // it buckles and leans over
  if(R.light)R.light.visible=false;
  for(let k=0;k<6;k++)sparks.push({x:cx+(Math.random()-.5)*20,y:cy+(Math.random()-.5)*20,t:-k*.06});
  booms.push({x:cx,y:cy,t:0});shake(.9);if(typeof sfxSparks==='function')sfxSparks(cx,cy);
  banner('Radio tower down. They\'re deaf and blind.',2600);
  setTimeout(()=>l1Exfil(),2200);
}
/* ---------- the way out (Bryan: "after blowing the radio tower, you hop on a dinghy, which brings you to where level 2 is
   now"): back to the boat on the beach; once everyone who's alive is in its ring (a man who's down carried in), they push
   off, the boat heads out over the river, and the mission's complete. ---------- */
const L1_BOAT={x0:110,x1:240,y0:804,y1:858};
function l1Exfil(){
  if(l1.exfil||l1.won||state!=='play'||MAPID!=='l1')return;l1.exfil=true;updateObjUI();
  const r=players.find(p=>p.id==='A1'&&alive(p)&&!p.joined)||players.find(alive);
  const d=r&&typeof voiceClip==='function'?voiceClip(r.id,'boatgo_1',{radio:true}):0;if(d&&typeof squelch==='function'){squelch(0);setTimeout(()=>squelch(0),(d+.1)*1000);}
  if(r)callouts.push({x:r.x,y:r.y,t:0,dur:3,text:'Tower\u2019s down. Everyone back to the boat.',col:'#dfe6ea',small:true});
  banner('Back to the boat on the beach.',2600);hud();
}
const boatNeed=()=>players.filter(p=>!p.dead);
const boatIn=p=>p.x>=L1_BOAT.x0&&p.x<=L1_BOAT.x1&&p.y>=L1_BOAT.y0&&p.y<=L1_BOAT.y1;
function exfilTick(dt){
  if(!l1.exfil||l1.won)return;
  if(l1.away!=null){   // pushing off: the boat heads out over the river with them in it
    l1.away+=dt;const B=L1.boat,k=Math.min(1,l1.away/3.2),e=k*k,bx=138,by=858+e*190;
    if(B){B.position.set(bx,.2,by);B.rotation.y=Math.PI;B.rotation.z=Math.sin(simT*1.7)*.035;}
    players.filter(p=>!p.dead).forEach((p,i)=>{const s=LAND_SEATS[i%4];p.x=bx-s[0];p.y=by-s[1];p.path=[];p.ang=Math.PI/2;});
    if(l1.away>=1.4&&!l1.won)l1Win();return;
  }
  const need=boatNeed();if(!need.length)return;
  if(need.every(boatIn)&&need.every(p=>!p.downed||p.carriedBy||boatIn(p))){   // all aboard: push off
    l1.away=0;tutStop();sel=[];cardGroup=[];preview=null;mode=null;
    for(const p of need){if(p.carry){const c=p.carry;c.carriedBy=null;p.carry=null;}Object.assign(p,{inBoat:true,path:[],supT:null,focus:null,silent:null,elev:1.2});}
    bigText('Pushing off','clear');hud();
  }
}
function l1Win(){
  if(l1.won||state!=='play'||MAPID!=='l1')return;l1.won=true;tutStop();if(typeof setLoop==='function'&&AC)setLoop('boat',0,null,null);
  try{localStorage.setItem(L1_DONE_KEY,'1');}catch(e){}
  state='end';setStatus();bigText('Mission complete!','complete');setTimeout(showAAR,2600);
}
function l1Threat(){   // before anyone's seen: where previews judge cover from
  if(!L1.fence.every(beaten))return{x:500,y:652};if(!L1.gate.every(beaten))return{x:331,y:576};if(!L1.yard.every(beaten))return{x:380,y:365};return{x:480,y:190};
}

/* ---------- every tick (from update) ---------- */
function l1Tick(dt){
  if(MAPID!=='l1'||!L1)return;
  stationTick(dt);useTick(dt);tutTickL1(dt);heliTick(dt);exfilTick(dt);   // the medic station and ammo drop; the scout (interior.js's things to use); the tutorial; the helicopter in, the boat out
  if(L1.relay&&L1.relay.light)L1.relay.light.visible=!l1.relayDown&&Math.sin(simT*4)>0;   // the mast's warning light blinks
  if(!l1.yardClear&&L1.yard.every(beaten)&&simT-lastNoiseT>2){   // the yard clear: a checkpoint by the relay hut
    l1.yardClear=true;addZones(L1_REST);bigText('Checkpoint','clear');
    banner('Yard clear. A medic station and an ammo drop are by the hut.',3200);chatSecured();updateObjUI();
  }
}
function l1Hint(){
  if(tutStep())return '';   // (the boot camp's box says it)
  if(l1.relayDown)return l1.exfil?'Get everyone back to the boat on the beach (the green ring). Carry anyone who\'s down.':'Radio tower down.';
  if(!L1.yard.every(beaten))return L1.fence.every(beaten)?(L1.gate.every(beaten)?'Clear the yard: get into cover first, then fire. The ambush gives you an edge.':'Two guards at the gate: Alpha\'s silencers can drop them together. Select Alpha and tap each one.'):'One guard by the shed has his back to you: select one soldier and tap him to take him down.';
  if(!l1.scoutUp)return 'A wounded scout lies by the hut: select a soldier and tap him to bring him round.';
  return 'Bring down the radio tower east of the hut: Hayes\'s RPG (on his card) at the ring under it, or a grenade close to it.';
}

/* ---------- drawn on the overlay ---------- */
function drawL1(now){
  if(MAPID!=='l1'||!L1||!L1.relay)return;
  const st=tutStep(),tip=!st&&tut.on&&tut.tip&&!tut.ack&&!tut.loose?tut.tip:null,src=st||tip;
  const m0=src&&(st&&st.pick?tut.mk:typeof src.mark==='function'?src.mark():src.mark);
  if(src&&src.guide){   // a dotted line from the soldier to where his route should go (Bryan: boot camp 5/7)
    const u=players.find(p=>p.id===src.guide.id),g=src.guide;
    if(u&&alive(u)){toSBack=false;const a=toS(u.x,u.y,1),b=toS(g.x,g.y,1);if(!toSBack){ox.setLineDash([3,7]);ox.lineDashOffset=-now*14;ox.strokeStyle='rgba(77,243,255,.85)';ox.lineWidth=2.6;ox.lineCap='round';ox.beginPath();ox.moveTo(...a);ox.lineTo(...b);ox.stroke();ox.setLineDash([]);ox.lineCap='butt';}}
  }
  if(m0){const p=(Math.sin(now*4)+1)/2,col=m0.col||'#4df3ff';toSBack=false;gPath(m0.x,m0.y,m0.r+p*4);if(!toSBack){ox.strokeStyle=col;ox.lineWidth=2.6;ox.setLineDash([6,5]);ox.lineDashOffset=-now*12;ox.stroke();ox.setLineDash([]);const[lx,ly]=below(m0.x,m0.y+m0.r,6);label(m0.label||'HERE',lx,ly,col,10,700);}}   // the spot to tap
  if(l1.exfil&&l1.away==null){   // the way out: the boat's ring on the beach, and how many are in it
    const z=L1_BOAT,need=boatNeed(),n=need.filter(boatIn).length,pulse=(Math.sin(now*4)+1)/2;toSBack=false;
    const c=[[z.x0,z.y0],[z.x1,z.y0],[z.x1,z.y1],[z.x0,z.y1]].map(([x,y])=>toS(x,y,.4));
    if(!toSBack){ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();ox.fillStyle=`rgba(95,224,142,${(.06+pulse*.07).toFixed(3)})`;ox.fill();
      ox.setLineDash([10,7]);ox.lineDashOffset=-now*14;ox.strokeStyle='rgba(95,224,142,.95)';ox.lineWidth=2.4;ox.stroke();ox.setLineDash([]);
      const[lx,ly]=below((z.x0+z.x1)/2,z.y0,10);label(`BOAT ${n}/${need.length}`,lx,ly-26,C.good,10,700);}
  }
  const R=L1.relay,cx=R.x+R.w/2,cy=R.y+R.h/2;
  if(l1.scoutUp&&!l1.relayDown&&!(tip&&tip.k==='rpg')){const p=(Math.sin(now*3)+1)/2;toSBack=false;gPath(cx,cy,30+p*3);if(!toSBack){ox.strokeStyle='rgba(255,138,106,.85)';ox.lineWidth=2.4;ox.setLineDash([7,5]);ox.lineDashOffset=-now*10;ox.stroke();ox.setLineDash([]);}}   // the ring under the tower: what to aim at (Bryan)
  if(!l1.relayDown){const[lx,ly]=below(cx,cy+R.h/2,10);label(l1.relayHP<100?`RADIO TOWER · RPG · ${Math.max(0,Math.round(l1.relayHP))}%`:'RADIO TOWER · RPG',lx,ly,'#ff8a6a',10,700);}   // (Bryan: "it should say Radio Tower - RPG")
}

/* ---------- the tutorial (docs/tutorial.md): the boot camp on the beach, then tips the first time things come up ----------
   A step ends when the player does the thing; what to touch pulses (a tab, a card, a button, a ring on the ground). Tips wait
   until the boot camp is over and show once each. "Skip tutorial" / "Turn off tips" turn both off.
   The lock (Bryan: "it should also not allow any other actions to happen unless you do the tip"): while a step or a tip is up,
   only what it asks for goes through (tutAllows, called from input.js, hud.js and cards.js), plus what it takes to get there
   (picking soldiers, for most tips). The camera, Pause, Fit map and sound always work; anything else gives the bubble a shake.
   A tip that only tells you something ends with a tap on it ("Tap to continue"); one that asks for something ends when it's
   done, and time runs at quarter speed meanwhile (tutSlow, in state.js's timeScale). If the moment it's about passes (the guard
   turns round, the fight's over) the tip goes; if its action is tried and can't be done from there (no way behind him, no safe
   throw: the game says why), the lock lifts so the player can sort it out. */
const cardOf=id=>{const p=players.find(u=>u.id===id);return p?[...document.querySelectorAll('#cards .ucard')].find(el=>{const n=el.querySelector('.uc-name');return n&&n.textContent===p.name;})||null:null;};
const cardUp=c=>!!c&&!c.hidden&&!$('#cards').hidden;
const ROUTE_SPOT={x:414,y:796,r:22},TK_SPOT={x:494,y:726,r:24},VOL_SPOT={x:332,y:650,r:26},YARD_SPOT={x:334,y:505,r:30};   // where the steps send the squad
const l1NearSpot=(team,x,y,r)=>players.filter(p=>p.team===team&&alive(p)).every(p=>hyp(p.x-x,p.y-y)<r&&!p.path.length);
// what a tap at screen point (sx,sy) lands on, in tap()'s order: one of ours, else a hostile, else the ground (the world point
// and the spot tapTarget picks for a tap on a container's side)
function tutHit(sx,sy){
  const[wx,wy]=toW(sx,sy),[bx,by]=toS(wx,wy),t=tapTarget(sx,sy),u=unitAtScreen(sx,sy,false);
  return{u,e:u?null:enemyAtScreen(sx,sy),x:wx,y:wy,tx:t.x,ty:t.y,inMap:hyp(bx-sx,by-sy)<4&&wx>=VB.x0&&wy>=VB.z0&&wx<=VB.x1&&wy<=VB.z1};
}
const tutNear=(h,x,y,r)=>!h.u&&!h.e&&(hyp(h.x-x,h.y-y)<r||hyp(h.tx-x,h.ty-y)<r);   // the ground near (x,y)
const ourMan=(h,t)=>!!h.u&&!h.u.downed&&(!t||h.u.team===t);
// changing who's selected: the tabs, a card, holding a soldier, the lasso, Clear, a tap on one of ours who's up
const tutPick=(k,x)=>k==='tab'||k==='card'||k==='hold'||k==='lasso'||(k==='btn'&&x==='clear')||(k==='tap'&&ourMan(x));
const fromUs=a=>a.some(n=>n.by&&n.by.side==='P'&&!n.smoke);   // a frag or a rocket of ours in the air
const blastLeft=()=>players.some(p=>alive(p)&&!p.downed&&((p.spec==='rpg'&&p.specN>0)||p.grenade>0));
// a step or tip: text; glow() what to touch; need(kind,x) what goes through while it's up (kind: 'tap' with x what it lands on,
// 'draw'/'hold'/'card' with x the soldier, 'gear' with x {u,id,item}, 'tab' with x 'A'/'B'/'all', 'btn' with x its name,
// 'lasso'); done() when it's been done; ack: a notice, ended by a tap on it; still() whether the moment's still there;
// act(kind,x) the input that should do it (if it doesn't, the lock lifts); modes an aiming mode it keeps
const TUT_STEPS=[
  {text:'<b>Look around.</b> Drag the map with one finger. Pinch to zoom in and out.',cam:true,done:()=>hyp(camT.x-tut.cam0.x,camT.z-tut.cam0.z)>50||Math.abs(zoom-tut.cam0.zoom)>.25},
  {text:'<b>Pick a team.</b> Tap <b>ALPHA</b> at the bottom to select Reyes and Kowalski.',glow:()=>$('.tab[data-team="A"]'),
   need:(k,x)=>(k==='tab'&&x==='A')||(k==='tap'&&ourMan(x,'A')),done:()=>sel.length===2&&sel.every(u=>u.team==='A')},
  {text:'<b>Move into cover.</b> Tap the cyan ring behind the container. Green ghosts are in cover, red are exposed. Tap the same spot again to go.',mark:{x:334,y:781,r:24},
   need:(k,x)=>(k==='tab'&&x==='A')||(k==='tap'&&((ourMan(x,'A')&&!sel.includes(x.u))||tutNear(x,334,781,70))),done:()=>l1NearSpot('A',334,781,50)},   // (a tap on one of a selected pair would split them)
  {text:'<b>One man.</b> Tap Reyes\'s card to give orders to him alone. Tap it again for the whole team.',glow:()=>cardOf('A1'),
   need:(k,x)=>((k==='card'||k==='hold')&&x.id==='A1')||(k==='tap'&&!!x.u&&x.u.id==='A1'),done:()=>sel.length===1&&sel[0].id==='A1'},
  {text:'<b>Draw a route.</b> Drag from Reyes along the dotted line to the crate, then lift your finger.',guide:{id:'A1',...ROUTE_SPOT},mark:{...ROUTE_SPOT,label:'DRAW TO HERE'},   // (Bryan: a dotted line to the box right of the container)
   need:(k,x)=>((k==='draw'||k==='card')&&x.id==='A1')||(k==='drawEnd'&&hyp(x.x-ROUTE_SPOT.x,x.y-ROUTE_SPOT.y)<48),done:()=>tut.drew&&!!tut.drewEnd&&hyp(tut.drewEnd.x-ROUTE_SPOT.x,tut.drewEnd.y-ROUTE_SPOT.y)<48},
  {text:'<b>Bring Bravo up.</b> Tap <b>BRAVO</b>, then the ring by the container, twice. <b>ALL</b> selects everyone.',glow:()=>$('.tab[data-team="B"]'),
   pick:()=>{const far=c=>Math.min(...players.filter(p=>p.team==='A'&&alive(p)).map(p=>hyp(p.x-c.x,p.y-c.y)));return[{x:266,y:781,r:24},{x:334,y:781,r:24}].sort((a,b)=>far(b)-far(a))[0];},   // the half of the container Alpha isn't in (a tap on one of Alpha would pick him instead)
   need:(k,x)=>(k==='tab'&&(x==='B'||x==='all'))||(k==='tap'&&((ourMan(x,'B')&&!sel.includes(x.u))||tutNear(x,tut.mk.x,tut.mk.y,70))),done:()=>l1NearSpot('B',tut.mk.x,tut.mk.y,50)},
  {text:'<b>Stay hidden.</b> Near guards your men sneak by themselves. The ring at the top fills as a guard notices you; red wedges show where they look.',glow:()=>$('#alert'),timed:8,ack:true},
];
// After the boot camp (Bryan, playtesting): the takedown, then the double silent shot at the gate, then into the yard to
// suppress and throw a grenade, each led step by step (a ring where to go, then what to tap); the rest come up as they happen
const shedG=()=>L1.fence[0],reyes=()=>players.find(p=>p.id==='A1');
const quiet=()=>!contact&&!enemies.some(e=>e.alerted&&!beaten(e));
const onlyReyes=()=>sel.length===1&&sel[0].id==='A1';
const alphaSel=()=>{const a=players.filter(p=>p.team==='A'&&alive(p));return a.length>0&&sel.length===a.length&&a.every(u=>sel.includes(u));};
const allSel=()=>{const a=players.filter(alive);return sel.length===a.length&&a.every(u=>sel.includes(u));};
const atSpot=(list,s,r)=>list.length>0&&list.every(p=>!p.path.length&&hyp(p.x-s.x,p.y-s.y)<r);
// sent there (or there already): a move step is done once it's ordered, so the game isn't held in slow motion while they walk
const headedTo=(list,s,r)=>list.length>0&&list.every(p=>{const e=p.path.length?p.path[p.path.length-1]:p;return hyp(e.x-s.x,e.y-s.y)<r;});
const ringOn=(e,label,col)=>e&&{x:e.x,y:e.y,r:15,label,col};
const nadeTarget=()=>{let best=null,bd=1e9;for(const e of enemies){if(beaten(e)||!e.vis)continue;for(const p of players)if(alive(p)&&p.grenade>0){const d=hyp(p.x-e.x,p.y-e.y);if(d<170&&d<bd){bd=d;best=e;}}}return best;};
const TUT_TIPS=[
  {k:'seen',ack:true,when:()=>enemies.some(e=>e.vis&&!e.dead&&!e.alerted),text:'<b>A guard.</b> His red wedge is where he\'s looking. Stay out of it and he won\'t see you.'},
  // the takedown: Reyes alone to the ring behind the shed guard, then tap the guard
  {k:'tkmove',when:()=>{const g=shedG(),r=reyes();return!!g&&!beaten(g)&&!g.alerted&&quiet()&&!!r&&alive(r)&&!r.tk&&!canTakedown(r,g)&&!atSpot([r],TK_SPOT,45);},
   still:()=>{const g=shedG(),r=reyes();return!!g&&!beaten(g)&&!g.alerted&&quiet()&&!!r&&alive(r);},
   mark:{...TK_SPOT,label:'REYES HERE'},glow:()=>onlyReyes()?null:cardUp(cardOf('A1'))?cardOf('A1'):$('.tab[data-team="A"]'),
   need:(k,x)=>((k==='card'||k==='hold'||k==='draw')&&x.id==='A1')||(k==='tab'&&x==='A')||(k==='tap'&&!!x.u&&x.u.id==='A1')||(k==='tap'&&onlyReyes()&&tutNear(x,TK_SPOT.x,TK_SPOT.y,60))||(k==='drawEnd'&&hyp(x.x-TK_SPOT.x,x.y-TK_SPOT.y)<60),
   done:()=>{const r=reyes();return!!r&&(!!r.tk||headedTo([r],TK_SPOT,45)||(onlyReyes()&&canTakedown(r,shedG())));},
   text:'<b>Takedown.</b> Tap Reyes\'s card to take him alone, then the ring behind the guard by the shed. Stay out of his red wedge.'},
  {k:'tk',gap:.4,when:()=>sel.length===1&&enemies.some(e=>canTakedown(sel[0],e)),still:()=>sel.length===1&&enemies.some(e=>canTakedown(sel[0],e)),
   mark:()=>ringOn(enemies.find(e=>canTakedown(sel[0],e)),'TAP HIM'),
   need:(k,x)=>k==='tap'&&!!x.e&&sel.length===1&&canTakedown(sel[0],x.e),act:k=>k==='tap',done:()=>players.some(p=>p.tk),
   text:'<b>Takedown.</b> His back is to your man: tap the guard and he sneaks up and takes him out without a sound.'},
  // the double silent shot: Alpha to the ring by the gate, then tap one guard, then the other
  {k:'volmove',when:()=>L1.fence.every(beaten)&&L1.gate.every(e=>!beaten(e)&&!e.alerted)&&quiet()&&volleyCrew(players.filter(p=>p.team==='A')).length>1&&!l1NearSpot('A',VOL_SPOT.x,VOL_SPOT.y,60),
   still:()=>L1.gate.some(e=>!beaten(e)&&!e.alerted)&&quiet(),
   mark:{...VOL_SPOT,label:'ALPHA HERE'},glow:()=>alphaSel()?null:$('.tab[data-team="A"]'),
   need:(k,x)=>(k==='tab'&&x==='A')||(k==='tap'&&ourMan(x,'A')&&!sel.includes(x.u))||(k==='tap'&&alphaSel()&&tutNear(x,VOL_SPOT.x,VOL_SPOT.y,60))||(k==='btn'&&x==='clear'),
   done:()=>headedTo(players.filter(p=>p.team==='A'&&alive(p)),VOL_SPOT,60),
   text:'<b>Silent shots.</b> Both of Alpha\'s rifles are silenced. Tap <b>ALPHA</b>, then the ring by the gate, twice.'},
  {k:'volley',gap:.4,when:()=>L1.fence.every(beaten)&&sel.filter(alive).length>=2&&L1.gate.some(e=>!beaten(e)&&!e.alerted&&canVolley(sel,e)),
   still:()=>L1.gate.some(e=>!beaten(e)&&!e.alerted&&canQuiet(sel,e))||players.some(p=>p.silent),   // (the second guard: one silent shooter in reach is enough)
   mark:()=>ringOn(L1.gate.find(e=>!beaten(e)&&canQuiet(sel,e)&&!players.some(p=>p.silent&&p.silent.e===e)),'TAP'),
   need:(k,x)=>k==='tap'&&!!x.e&&canQuiet(sel,x.e),act:k=>k==='tap',progress:()=>!!volley||players.some(p=>p.silent)||L1.gate.some(beaten),done:()=>L1.gate.every(beaten),
   text:'<b>Silent shots.</b> Tap one guard, then the other: Reyes and Kowalski take one each, on the same count.'},
  // the yard: everyone into cover by the barrels, then suppress and a grenade
  {k:'yardmove',when:()=>L1.gate.every(beaten)&&L1.yard.some(e=>!beaten(e))&&quiet()&&!atSpot(players.filter(alive),YARD_SPOT,75),
   still:()=>L1.yard.some(e=>!beaten(e))&&quiet(),
   mark:{...YARD_SPOT,label:'EVERYONE HERE'},glow:()=>allSel()?null:$('#allBtn'),
   need:(k,x)=>(k==='tab'&&x==='all')||(k==='tap'&&allSel()&&tutNear(x,YARD_SPOT.x,YARD_SPOT.y,70))||(k==='btn'&&x==='clear'),
   done:()=>headedTo(players.filter(alive),YARD_SPOT,75),
   text:'<b>Into the yard.</b> Four guards ahead. Tap <b>ALL</b>, then the ring by the barrels, twice. Quietly.'},
  {k:'suppress',gap:.4,when:()=>(tut.said.has('yardmove')&&atSpot(players.filter(alive),YARD_SPOT,80)&&L1.yard.some(e=>!beaten(e)&&e.vis))||(contact&&enemies.some(e=>e.vis&&!beaten(e))),
   still:()=>enemies.some(e=>e.seen&&!beaten(e)),
   mark:()=>{let best=null,bd=1e9;for(const e of enemies){if(beaten(e)||!e.vis)continue;const d=Math.min(...players.filter(alive).map(p=>hyp(p.x-e.x,p.y-e.y)));if(d<bd){bd=d;best=e;}}return ringOn(best,'HOLD','#ffcf4a');},
   need:(k,x)=>tutPick(k,x)||k==='suppress',done:()=>players.some(p=>alive(p)&&p.supT),
   text:'<b>Suppress.</b> Hold your finger on a guard until the ring fills: your men pin him down. Pinned men barely shoot back.'},
  {k:'nade',when:()=>contact&&!!nadeTarget(),still:()=>contact&&enemies.some(e=>!beaten(e)&&e.seen)&&players.some(p=>alive(p)&&p.grenade>0),modes:['grenade'],
   mark:()=>mode==='grenade'?ringOn(nadeTarget(),'THROW HERE','#ffcf4a'):null,
   glow:()=>{if(mode==='grenade')return null;const p=sel.find(u=>alive(u)&&u.grenade>0),c=p&&cardOf(p.id);return cardUp(c)?c.querySelector('.uc-nade'):sel.some(alive)?null:$('#allBtn');},
   need:(k,x)=>tutPick(k,x)||(k==='gear'&&x.item==='nade')||(k==='tap'&&mode==='grenade'),act:(k,x)=>k==='tap'&&mode==='grenade'&&(!!x.e||x.inMap),
   done:()=>players.some(p=>p.throwGo&&p.throwGo.kind==='nade')||fromUs(nades),
   text:'<b>Grenade.</b> Tap the grenade on a soldier\'s card (it glows), then tap the guards behind the sandbags.'},
  {k:'contact',when:()=>contact&&enemies.some(e=>e.vis&&!beaten(e)),still:()=>contact&&enemies.some(e=>e.vis&&!beaten(e)),
   need:(k,x)=>tutPick(k,x)||(k==='tap'&&!!x.e),act:(k,x)=>k==='tap'&&!!x.e&&sel.some(alive),done:()=>players.some(p=>alive(p)&&(p.focus||p.silent))||volleyPending(),
   text:'<b>You\'ve been seen.</b> Your men fire on their own now. Tap an enemy to focus fire: the % is the chance to hit. Cover cuts theirs.'},
  {k:'down',when:()=>players.some(p=>p.downed&&!p.dead)&&players.some(p=>alive(p)&&!p.downed),still:()=>players.some(p=>p.downed&&!p.dead)&&players.some(p=>alive(p)&&!p.downed),modes:['medkit'],
   need:(k,x)=>tutPick(k,x)||(k==='tap'&&(mode==='medkit'||(!!x.u&&x.u.downed)))||(k==='gear'&&x.item==='spec'&&x.u.spec==='medkit'),
   act:(k,x)=>k==='tap'&&!!x.u&&x.u.downed&&(mode==='medkit'||sel.some(u=>u!==x.u&&alive(u)&&!u.downed&&!u.carry)),
   done:()=>{const d=players.filter(p=>p.downed&&!p.dead);return!d.length||players.some(p=>p.medGo||p.carryGo||p.carry)||d.some(q=>q.revive>0||players.some(h=>h!==q&&alive(h)&&!h.downed&&h.path.length&&hyp(h.path[h.path.length-1].x-q.x,h.path[h.path.length-1].y-q.y)<30));},
   text:'<b>Man down.</b> Select another soldier and tap him to revive him. You have 60 seconds.'},
  {k:'cp',when:()=>l1.yardClear,need:(k,x)=>tutPick(k,x)||(k==='tap'&&!x.u&&!x.e&&!!(zoneAt(x.tx,x.ty)||zoneAt(x.x,x.y))),
   done:()=>players.some(p=>alive(p)&&!p.downed&&(zoneAt(p.x,p.y)||(p.path.length&&zoneAt(p.path[p.path.length-1].x,p.path[p.path.length-1].y)))),
   text:'<b>Checkpoint.</b> Stand in the green ring to heal, the orange ring to refill grenades and gear. Select your men and tap inside one.'},
  {k:'scout',when:()=>l1.yardClear&&!l1.scoutUp&&tut.said.has('cp')&&simT-tut.tipAt>6,still:()=>!l1.scoutUp&&players.some(p=>alive(p)&&!p.downed),
   mark:{x:L1_SCOUT.x,y:L1_SCOUT.y,r:18,label:'TAP HIM'},
   need:(k,x)=>tutPick(k,x)||(k==='tap'&&!x.u&&(a=>!!a&&a.id==='scout')(actAt(x.x,x.y))),act:(k,x)=>k==='tap'&&!x.u&&sel.some(alive),done:()=>l1.scoutUp||useGos.some(g=>g.a.id==='scout'),
   text:'<b>The scout.</b> Select a soldier and tap the wounded scout by the hut to bring him round.'},
  // the radio tower (Bryan: say "Radio Tower - RPG", light the RPG up in the team's colour, a ring under the tower)
  {k:'rpg',when:()=>l1.scoutUp&&!l1.relayDown&&blastLeft(),still:()=>!l1.relayDown&&blastLeft(),modes:['rpg','grenade'],
   mark:()=>{const R=L1.relay;return{x:R.x+R.w/2,y:R.y+R.h/2,r:30,label:mode==='rpg'||mode==='grenade'?'TAP HERE':'TARGET',col:'#ff8a6a'};},
   glow:()=>{if(mode==='rpg'||mode==='grenade')return null;const c=cardOf('B1'),b=cardUp(c)&&c.querySelector('.uc-spec');return b&&!b.disabled?b:(c&&!c.hidden?null:$('.tab[data-team="B"]'));},
   need:(k,x)=>tutPick(k,x)||(k==='gear'&&(x.item==='nade'||(x.item==='spec'&&x.u.spec==='rpg')))||(k==='tap'&&(mode==='rpg'||mode==='grenade')),
   act:(k,x)=>k==='tap'&&(mode==='rpg'||mode==='grenade')&&(!!x.e||x.inMap),
   done:()=>l1.relayDown||players.some(p=>p.rpgAim||(p.throwGo&&p.throwGo.kind!=='smoke'))||fromUs(rockets)||fromUs(nades),
   text:'<b>The radio tower.</b> Select Hayes, tap the <b>RPG</b> on his card (it glows), then tap the ring under the tower.'},
];
const tut={on:false,i:0,t0:0,drew:false,drewEnd:null,said:new Set(),cam0:{x:0,z:0,zoom:1},tip:null,tipAt:-99,tipEnd:-99,ack:false,loose:false,off:0,nudgeT:-1e9,mk:null,campDone:false,skipped:false,hid:false};
const L1_BEACH={x0:60,x1:440,y0:700,y1:860};   // the boot camp's ground: anyone beyond it, a guard down or alerted, and it's over
// again: "Try Level 1 again" after a failed run: no second boot camp if the first was done or skipped, no tips at all if skipped
function tutStart(again){
  if(!again){tut.campDone=false;tut.skipped=false;}
  const keep=again&&(tut.campDone||tut.skipped);
  Object.assign(tut,{on:!(again&&tut.skipped),i:keep?TUT_STEPS.length:0,t0:simT,drew:false,drewEnd:null,said:keep?tut.said:new Set(),cam0:{x:camT.x,z:camT.z,zoom},tip:null,tipAt:-99,tipEnd:-99,ack:false,loose:false,off:0,mk:null,hid:false});
  tutShow();
}
function tutStop(){tut.on=false;tut.tip=null;tut.ack=false;tut.loose=false;tut.i=TUT_STEPS.length;tutShow();}
function tutStep(){return tut.on&&tut.i<TUT_STEPS.length?TUT_STEPS[tut.i]:null;}
function tutNext(){tut.i++;tut.t0=simT;tut.tipEnd=simT;tut.hid=false;const n=tutStep();if(n&&n.pick)tut.mk=n.pick();if(!n)tut.campDone=true;tutShow();}   // the boot camp's next step
// a tip comes up: a notice if it only tells you something, or if what it asks for is already being done; an aiming mode it
// doesn't use is dropped, so the tap it asks for does what it says
function tutBegin(t){
  tut.said.add(t.k);tut.tip=t;tut.tipAt=simT;tut.ack=!!t.ack||!!(t.done&&t.done());tut.loose=false;tut.off=0;tut.hid=false;
  if(!tut.ack&&mode&&!(t.modes||[]).includes(mode))mode=null;
  tutShow();hud();
}
function tutEnd(){tut.tip=null;tut.tipEnd=simT;tut.ack=false;tut.loose=false;tutShow();}
// what's holding everything else back: the boot camp's step or the tip (none once a tip's action was tried and couldn't be done)
function tutLock(){
  if(MAPID!=='l1'||state!=='play'||!tut.on)return null;
  return tutStep()||(tut.tip&&!tut.loose?tut.tip:null);
}
// does this input go through? (kind and x as for need above; a tap passes its screen point). If not, the bubble shakes.
function tutAllows(kind,a,b){
  const L=tutLock();if(!L)return true;
  const x=kind==='tap'?tutHit(a,b):a,need=L===tut.tip&&tut.ack?null:L.need;
  if(need&&need(kind,x)){
    if(L.act&&L.act(kind,x))queueMicrotask(()=>{if(tut.tip===L&&!L.done()&&!(L.progress&&L.progress())){tut.loose=true;tutShow();}});   // it didn't take (the game says why): the lock lifts
    return true;
  }
  if(!(kind==='draw'&&L.cam))tutNudge();   // (on the "look around" step a drag that starts on a soldier just moves the camera)
  return false;
}
function tutNudge(){   // the bubble comes back if hidden, shakes, and says "Do this first" for a moment
  const box=$('#tut');if(!box)return;
  tut.hid=false;tut.nudgeT=performance.now();tutShow();
  box.classList.remove('nudge');void box.offsetWidth;box.classList.add('nudge');
  clearTimeout(tut.nudgeTimer);tut.nudgeTimer=setTimeout(()=>{tut.nudgeT=-1e9;box.classList.remove('nudge');tutShow();},2200);
  try{navigator.vibrate&&navigator.vibrate(20);}catch(_){}
}
function tutSlow(){return MAPID==='l1'&&state==='play'&&tut.on&&!!tut.tip&&!tut.loose&&!tutStep();}   // quarter speed while a tip waits (state.js)
// the bubble (Bryan: "a small bubble and when clicked it clears. Because currently, I click it and it moves my troops"): the
// boot camp's step or a tip, low on the left, out of the way. A tap on a notice carries on; on anything else it hides it (the
// tap stops there), and a small "?" in its place brings it back. A new step or tip shows by itself, and so does a blocked input.
function tutShow(){
  const box=$('#tut'),pin=$('#tutPin');if(!box)return;
  const s=MAPID==='l1'&&state==='play'?tutStep():null,tip=MAPID==='l1'&&state==='play'&&tut.on&&!s?tut.tip:null,has=!!(s||tip);
  const note=s?!!s.ack:tut.ack,nudged=tut.nudgeT>0&&!(tip&&tut.loose);
  if(has)box.innerHTML=`<small>${s?`Tutorial ${tut.i+1}/${TUT_STEPS.length}`:'Tip'}</small>${(s||tip).text}<span class="tfoot"><span${nudged?' class="now"':''}>${note?'Tap to continue':nudged?'Do this first':'Tap to hide'}</span><button type="button" class="tskip">${s?'Skip tutorial':'Turn off tips'}</button></span>`;
  box.hidden=!has||tut.hid;if(pin)pin.hidden=!has||!tut.hid;
}
function tutTap(){   // a tap on the bubble (hud.js)
  const s=tutStep();
  if(s?s.ack:tut.tip&&tut.ack){if(s)tutNext();else tutEnd();return;}
  tut.hid=true;tutShow();
}
function placeBanner(){const b=$('#banner');if(b)b.style.top='';}   // (the banner keeps its place at the top: the bubble is low on the left now)
function tutTickL1(dt){
  if(MAPID!=='l1'||!tut.on||state!=='play')return;
  // what to touch pulses (cards are rebuilt as the selection changes, so it's looked up every tick)
  const s=tutStep(),want=s&&s.glow?s.glow():tut.tip&&tut.tip.glow?tut.tip.glow():null;
  for(const el of document.querySelectorAll('.tutGlow'))if(el!==want)el.classList.remove('tutGlow');
  if(want&&!want.classList.contains('tutGlow'))want.classList.add('tutGlow');
  if(s&&(contact||enemies.some(e=>e.dead||e.alerted)||players.some(p=>alive(p)&&!(p.x>L1_BEACH.x0&&p.x<L1_BEACH.x1&&p.y>L1_BEACH.y0&&p.y<L1_BEACH.y1)))){   // gone on ahead: the rest of the boot camp is dropped, the tips take over
    tut.i=TUT_STEPS.length;tut.campDone=true;tut.tipEnd=simT-2;tutShow();return;}
  if(s){if(s.timed?simT-tut.t0>=s.timed:s.done&&s.done())tutNext();return;}
  const t=tut.tip;
  if(t){   // one at a time: a notice waits for its tap; anything else until it's done, or the moment's gone
    if(tut.ack)return;
    if(t.done()){tutEnd();return;}
    if(t.still&&!t.still()){if((tut.off+=dt)>.6)tutEnd();}else tut.off=0;
    return;
  }
  for(const t of TUT_TIPS)if(!tut.said.has(t.k)&&simT-tut.tipEnd>=(t.gap??2.5)&&t.when()){tutBegin(t);break;}   // (a breather between them; a step's second half comes straight after its first)
}
