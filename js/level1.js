"use strict";
/* Level 1 (Bryan: "it's still really hard... this has to be a tutorial map/first level... save this map for level two and add
   an easier map"; the plan is docs/level1.md). A small night mission on its own map, swapped in the way the office building's
   inside is (interior.js): the big map (Level 2) waits in STASH.out, untouched.
   South to north, one lesson each:
   1 the beach: no enemies; the boot camp (tutorial steps, below)
   2 the shed: one guard with his back to the beach (a takedown)
   3 the gate: two guards looking away from each other (Alpha's silencers, a volley)
   4 the yard: four guards round a fire barrel and the sandbags, who fight once they find you (a forgiving firefight)
   5 the relay hut: a wounded scout to bring round; clearing the yard makes a checkpoint there (a medic station, an ammo drop)
   6 the radio relay, a mast beside the hut: a rocket or a grenade close to it brings it down. Mission complete, then Level 2.
   Its guards aim worse, go down faster and see less far (L1E), and have no radio, grenades, dogs or reinforcements. */
let LEVEL=2,L1=null;
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
  for(let i=0;i<24;i++){const x=X+20+r()*(w-40),y=Y+40+r()*(h-140),rx=8+r()*26,ry=5+r()*12;g.save();g.translate(x,y);g.rotate(r()*3);g.fillStyle='rgba(30,44,56,.32)';g.beginPath();g.ellipse(0,0,rx,ry,0,0,7);g.fill();g.restore();}
}
// how rough each bit of Level 1's ground is: the same puddles as the colour picture (same seed and order), mirror-smooth
function paintL1Rough(q){
  const w=L1B.x1-L1B.x0,h=L1B.y1-L1B.y0,X=L1B.x0,Y=L1B.y0;q.setTransform(1,0,0,1,-X,-Y);
  q.fillStyle='rgb(186,186,186)';q.fillRect(X,Y,w,h);
  q.fillStyle='rgb(232,232,232)';q.fillRect(X,780,w,82);   // dry sand up the beach
  q.fillStyle='rgb(150,150,150)';q.fillRect(40,150,640,142);   // the concrete pad
  // (the puddles: replay paintL1Ground's random numbers up to its puddles)
  const r=rng(4242);for(let i=0;i<11000;i++){r();r();r();r();r();}for(let i=0;i<46;i++){r();r();r();}for(let i=0;i<900;i++){r();r();r();r();r();}
  for(let i=0;i<24;i++){const x=X+20+r()*(w-40),y=Y+40+r()*(h-140),rx=8+r()*26,ry=5+r()*12;q.save();q.translate(x,y);q.rotate(r()*3);q.fillStyle='rgb(14,14,14)';q.beginPath();q.ellipse(0,0,rx,ry,0,0,7);q.fill();q.restore();}
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
    const d=makeDinghy();d.position.set(138,.1,858);d.rotation.y=.4;d.rotation.z=.05;   // pulled up on the beach
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
function resetL1(){Object.assign(l1,{yardClear:false,scoutUp:false,relayHP:100,relayDown:false,won:false,t0:simT});}
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
  resetL1();mission.t0=simT;contact=false;sel=[];cardGroup=[];
  VB={x0:L1B.x0,z0:L1B.y0,x1:L1B.x1,z1:L1B.y1};FIT.w=L1B.x1-L1B.x0+40;FIT.h=L1B.y1-L1B.y0+40;fitDist();
  zoom=2.4;yaw=0;tilt=0;camT={x:250,z:770};clampCam();updateCamera();
  l1Acts();updateObjUI();setStatus();buildCards();hud();
}
// back to the big map at once (a new game, Level 2 after this one, or Run it again)
function leaveLevel1Now(){
  if(MAPID!=='l1')return;const out=STASH.out;tut.on=false;extraFigs.length=0;tut.tip=null;for(const el of document.querySelectorAll('.tutGlow'))el.classList.remove('tutGlow');
  for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';
  for(const p of players){p.offMap=false;moveMesh(p,out.scene);}
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=[];
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();tutShow();
}
function startLevel1(again){   // again: "Try Level 1 again"
  reset();   // (Level 2's squad, outdoors; back from Level 1 first if need be)
  $('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  enterLevel1();state='play';tutStart(again);
  banner('Level 1: knock out the enemy radio relay up north.',3200);hud();
}
function startLevel2(){
  LEVEL=2;clearSave();refreshSaveButtons();reset();startView();
  $('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  state='play';startLanding();banner('Coming in to the dock…',2400);hud();
}

/* ---------- the scout, the checkpoint, the relay ---------- */
function l1Acts(){
  for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].map==='l1')ACTS.splice(i,1);
  ACTS.push({id:'scout',map:'l1',x:L1_SCOUT.x,y:L1_SCOUT.y,r:16,standY:16,secs:3,label:'WOUNDED SCOUT',avail:()=>!l1.scoutUp,act:u=>scoutUp(u)});
}
function scoutUp(u){
  l1.scoutUp=true;const s=L1.scout;
  if(s&&s.m){s.downed=false;s.x=L1_SCOUT.x-10;s.y=L1_SCOUT.y-18;s.ang=-Math.PI/2;}   // up on his feet by the door
  if(u)u.stats.revives++;
  callouts.push({x:L1_SCOUT.x,y:L1_SCOUT.y,t:0,dur:4,text:'Thanks. The relay\'s the mast, east of the hut.',col:'#dfe6ea',small:true});
  banner('Scout back on his feet. Now bring down the relay mast.',3000);hud();
}
function l1Blast(x,y,by){   // (from tankBlast: every grenade and rocket)
  if(MAPID!=='l1'||!L1||!L1.relay||l1.relayDown)return;
  const d=rectDist(x,y,L1.relay);if(d>60)return;
  l1.relayHP-=d<25?100:70*(1-d/60);L1.relay.hitT=simT;
  if(l1.relayHP<=0)relayDown();else banner('The relay\'s damaged. Hit it again.',2000);
}
function relayDown(){
  l1.relayDown=true;const R=L1.relay,cx=R.x+R.w/2,cy=R.y+R.h/2;
  if(R.mesh){R.mesh.rotation.z=.6;R.mesh.rotation.x=.15;R.mesh.position.y=-3;}   // it buckles and leans over
  if(R.light)R.light.visible=false;
  for(let k=0;k<6;k++)sparks.push({x:cx+(Math.random()-.5)*20,y:cy+(Math.random()-.5)*20,t:-k*.06});
  booms.push({x:cx,y:cy,t:0});shake(.9);if(typeof sfxSparks==='function')sfxSparks(cx,cy);
  banner('Relay down. They\'re deaf and blind.',2600);
  setTimeout(()=>l1Win(),1800);
}
function l1Win(){
  if(l1.won||state!=='play'||MAPID!=='l1')return;l1.won=true;tutStop();
  try{localStorage.setItem(L1_DONE_KEY,'1');}catch(e){}
  state='end';setStatus();bigText('Mission complete!','complete');setTimeout(showAAR,2600);
}
function l1Threat(){   // before anyone's seen: where previews judge cover from
  if(!L1.fence.every(beaten))return{x:500,y:652};if(!L1.gate.every(beaten))return{x:331,y:576};if(!L1.yard.every(beaten))return{x:380,y:365};return{x:480,y:190};
}

/* ---------- every tick (from update) ---------- */
function l1Tick(dt){
  if(MAPID!=='l1'||!L1)return;
  stationTick(dt);useTick(dt);tutTickL1(dt);   // the medic station and ammo drop; the scout (interior.js's things to use); the tutorial
  if(L1.relay&&L1.relay.light)L1.relay.light.visible=!l1.relayDown&&Math.sin(simT*4)>0;   // the mast's warning light blinks
  if(!l1.yardClear&&L1.yard.every(beaten)&&simT-lastNoiseT>2){   // the yard clear: a checkpoint by the relay hut
    l1.yardClear=true;addZones(L1_REST);bigText('Checkpoint','clear');
    banner('Yard clear. A medic station and an ammo drop are by the relay hut.',3200);chatSecured();updateObjUI();
  }
}
function l1Hint(){
  if(tutStep())return '';   // (the boot camp's box says it)
  if(l1.relayDown)return 'Relay down.';
  if(!L1.yard.every(beaten))return L1.fence.every(beaten)?(L1.gate.every(beaten)?'Clear the yard: get into cover first, then fire. The ambush gives you an edge.':'Two guards at the gate: Alpha\'s silencers can drop them together. Select Alpha and tap each one.'):'One guard by the shed has his back to you: select one soldier and tap him to take him down.';
  if(!l1.scoutUp)return 'A wounded scout lies by the relay hut: select a soldier and tap him to bring him round.';
  return 'Bring down the relay mast east of the hut: Hayes\'s RPG or a grenade close to it.';
}

/* ---------- drawn on the overlay ---------- */
function drawL1(now){
  if(MAPID!=='l1'||!L1||!L1.relay)return;
  const st=tutStep(),m=st&&(st.pick?tut.mk:st.mark);if(m){const p=(Math.sin(now*4)+1)/2;gPath(m.x,m.y,m.r+p*4);ox.strokeStyle='#4df3ff';ox.lineWidth=2.4;ox.setLineDash([6,5]);ox.lineDashOffset=-now*12;ox.stroke();ox.setLineDash([]);const[lx,ly]=below(m.x,m.y+m.r,6);label('HERE',lx,ly,'#4df3ff',10,700);}   // the boot camp's spot on the ground
  const R=L1.relay,cx=R.x+R.w/2,cy=R.y+R.h/2;
  if(!l1.relayDown){const[lx,ly]=below(cx,cy+R.h/2,10);label(l1.relayHP<100?`RADIO RELAY · ${Math.max(0,Math.round(l1.relayHP))}%`:'RADIO RELAY',lx,ly,'#ff8a6a',10,700);}
}

/* ---------- the tutorial (docs/tutorial.md): the boot camp on the beach, then tips the first time things come up ----------
   A step ends when the player does the thing; what to touch pulses (a tab, a card, a ring on the ground). Tips wait until the
   boot camp is over and show once each. "Skip tutorial" turns both off. */
const cardOf=id=>{const p=players.find(u=>u.id===id);return p?[...document.querySelectorAll('#cards .ucard')].find(el=>{const n=el.querySelector('.uc-name');return n&&n.textContent===p.name;})||null:null;};
const l1NearSpot=(team,x,y,r)=>players.filter(p=>p.team===team&&alive(p)).every(p=>hyp(p.x-x,p.y-y)<r&&!p.path.length);
const TUT_STEPS=[
  {text:'<b>Look around.</b> Drag the map with one finger. Pinch to zoom in and out.',done:()=>hyp(camT.x-tut.cam0.x,camT.z-tut.cam0.z)>50||Math.abs(zoom-tut.cam0.zoom)>.25},
  {text:'<b>Pick a team.</b> Tap <b>ALPHA</b> at the bottom to select Reyes and Kowalski.',glow:()=>$('.tab[data-team="A"]'),done:()=>sel.length===2&&sel.every(u=>u.team==='A')},
  {text:'<b>Move into cover.</b> Tap the cyan ring behind the container. Green ghosts are in cover, red are exposed. Tap the same spot again to go.',mark:{x:334,y:781,r:24},done:()=>l1NearSpot('A',334,781,50)},
  {text:'<b>One man.</b> Tap Reyes\'s card to give orders to him alone. Tap it again for the whole team.',glow:()=>cardOf('A1'),done:()=>sel.length===1&&sel[0].id==='A1'},
  {text:'<b>Draw a route.</b> Drag from Reyes along the ground to draw his path, then lift your finger.',done:()=>tut.drew},
  {text:'<b>Bring Bravo up.</b> Tap <b>BRAVO</b>, then the ring by the container, twice. <b>ALL</b> selects everyone.',glow:()=>$('.tab[data-team="B"]'),
   pick:()=>{const far=c=>Math.min(...players.filter(p=>p.team==='A'&&alive(p)).map(p=>hyp(p.x-c.x,p.y-c.y)));return[{x:266,y:781,r:24},{x:334,y:781,r:24}].sort((a,b)=>far(b)-far(a))[0];},   // the half of the container Alpha isn't in (a tap on one of Alpha would pick him instead)
   done:()=>l1NearSpot('B',tut.mk.x,tut.mk.y,50)},
  {text:'<b>Stay hidden.</b> Near guards your men sneak by themselves. The ring at the top fills as a guard notices you; red wedges show where they look.',glow:()=>$('#alert'),timed:8},
];
const TUT_TIPS=[
  {k:'seen',when:()=>enemies.some(e=>e.vis&&!e.dead&&!e.alerted),text:'<b>A guard.</b> His red wedge is where he\'s looking. Stay out of it and he won\'t see you.'},
  {k:'tk',when:()=>sel.length===1&&enemies.some(e=>canTakedown(sel[0],e)),text:'<b>Takedown.</b> He has his back to your man: tap him and your man sneaks up and takes him out without a sound.'},
  {k:'volley',when:()=>L1.fence.every(beaten)&&sel.filter(alive).length>=2&&L1.gate.some(e=>!beaten(e)&&!e.alerted&&canVolley(sel,e)),text:'<b>Silencers.</b> Alpha\'s rifles are silenced. Tap one guard, then the other, and they fire together on a count.'},
  {k:'contact',when:()=>contact,text:'<b>You\'ve been seen.</b> Your men fire on their own now. Tap an enemy to focus fire: the % is the chance to hit. Cover cuts theirs.'},
  {k:'pinned',when:()=>players.some(p=>alive(p)&&p.sup>.65),text:'<b>Pinned down.</b> Select Hayes, press <b>SUPPRESS</b>, then tap the enemy: his machine gun keeps their heads down.'},
  {k:'nade',when:()=>contact&&enemies.some(e=>!beaten(e)&&e.vis&&players.some(p=>alive(p)&&p.grenade>0&&hyp(p.x-e.x,p.y-e.y)<170)),text:'<b>Grenades.</b> Tap the grenade on a soldier\'s card, then tap where to throw it.'},
  {k:'down',when:()=>players.some(p=>p.downed&&!p.dead),text:'<b>Man down.</b> Select another soldier and tap him to revive him. You have 60 seconds.'},
  {k:'cp',when:()=>l1.yardClear,text:'<b>Checkpoint.</b> Stand in the green ring to heal, the orange ring to refill grenades and gear.'},
  {k:'scout',when:()=>l1.yardClear&&!l1.scoutUp&&tut.said.has('cp')&&simT-tut.tipAt>6,text:'<b>The scout.</b> Select a soldier and tap the wounded scout by the hut to bring him round.'},
  {k:'rpg',when:()=>l1.scoutUp&&!l1.relayDown,text:'<b>The relay.</b> Select Hayes, tap the <b>RPG</b> on his card, then tap the mast. A grenade close to it works too.',glow:()=>{const c=cardOf('B1');return c&&c.querySelector('.uc-spec');}},
];
const tut={on:false,i:0,t0:0,drew:false,said:new Set(),cam0:{x:0,z:0,zoom:1},tip:null,tipAt:-99,mk:null,campDone:false,skipped:false};
const L1_BEACH={x0:60,x1:440,y0:700,y1:860};   // the boot camp's ground: anyone beyond it, a guard down or alerted, and it's over
// again: "Try Level 1 again" after a failed run: no second boot camp if the first was done or skipped, no tips at all if skipped
function tutStart(again){
  if(!again){tut.campDone=false;tut.skipped=false;}
  const keep=again&&(tut.campDone||tut.skipped);
  Object.assign(tut,{on:!(again&&tut.skipped),i:keep?TUT_STEPS.length:0,t0:simT,drew:false,said:keep?tut.said:new Set(),cam0:{x:camT.x,z:camT.z,zoom},tip:null,tipAt:-99,mk:null,hid:false});
  tutShow();
}
function tutStop(){tut.on=false;tut.tip=null;tut.i=TUT_STEPS.length;tutShow();}
function tutStep(){return tut.on&&tut.i<TUT_STEPS.length?TUT_STEPS[tut.i]:null;}
// the bubble (Bryan: "a small bubble and when clicked it clears. Because currently, I click it and it moves my troops"): the
// boot camp's step or a tip, low on the left, out of the way; a tap on it hides it (the tap stops there), and a small "?" in
// its place brings it back. A new step or tip shows again by itself. Skip tutorial / No more tips sit inside it.
function tutShow(){
  const box=$('#tut'),pin=$('#tutPin');if(!box)return;
  const s=MAPID==='l1'&&state==='play'?tutStep():null,tip=MAPID==='l1'&&state==='play'&&tut.on&&!s?tut.tip:null,has=!!(s||tip);
  if(has)box.innerHTML=`<small>${s?`Boot camp ${tut.i+1}/${TUT_STEPS.length}`:'Tip'}</small>${(s||tip).text}<span class="tfoot"><span>Tap to hide</span><button type="button" class="tskip">${s?'Skip tutorial':'No more tips'}</button></span>`;
  box.hidden=!has||tut.hid;if(pin)pin.hidden=!has||!tut.hid;
}
function placeBanner(){const b=$('#banner');if(b)b.style.top='';}   // (the banner keeps its place at the top: the bubble is low on the left now)
function tutTickL1(dt){
  if(MAPID!=='l1'||!tut.on||state!=='play')return;
  // what to touch pulses (cards are rebuilt as the selection changes, so it's looked up every tick)
  const s=tutStep(),want=s&&s.glow?s.glow():tut.tip&&tut.tip.glow?tut.tip.glow():null;
  for(const el of document.querySelectorAll('.tutGlow'))if(el!==want)el.classList.remove('tutGlow');
  if(want&&!want.classList.contains('tutGlow'))want.classList.add('tutGlow');
  if(s&&(contact||enemies.some(e=>e.dead||e.alerted)||players.some(p=>alive(p)&&!(p.x>L1_BEACH.x0&&p.x<L1_BEACH.x1&&p.y>L1_BEACH.y0&&p.y<L1_BEACH.y1)))){   // gone on ahead: the rest of the boot camp is dropped, the tips take over
    tut.i=TUT_STEPS.length;tut.campDone=true;tut.tipAt=simT-2;tutShow();return;}
  if(s){if(s.timed?simT-tut.t0>=s.timed:s.done()){tut.i++;tut.t0=simT;tut.tipAt=simT;tut.hid=false;const n=tutStep();if(n&&n.pick)tut.mk=n.pick();if(!n)tut.campDone=true;tutShow();}return;}
  if(tut.tip&&simT-tut.tipAt>8){tut.tip=null;tutShow();}   // a tip stays up 8 s (or until the next one)
  if(simT-tut.tipAt<2.5)return;   // (not one on top of another)
  for(const t of TUT_TIPS)if(!tut.said.has(t.k)&&t.when()){tut.said.add(t.k);tut.tip=t;tut.tipAt=simT;tut.hid=false;tutShow();break;}
}
