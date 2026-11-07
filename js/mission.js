"use strict";
/* The mission (Bryan's rework): one objective outdoors, get into the data center, then the scientists inside, the drawbridge's
   bio scanner, and the Headquarters (to come). Every area's defenders are on the map from the start (the warehouse, the
   bridge with its watchtower sniper, the container maze, the data center's front with its patrol and gun truck), and none of
   them has to be cleared: clearing one is a checkpoint (a medic station and an ammo drop, and a save: hq.js, save.js). The
   front doors open unless the alarm is going or they're out hunting the squad (interior.js). Also: the gun truck, the
   watchtower (climbing it, the sniper's rifle), the demolition charges and fuel tanks (dormant), the enemy RPG and rockets,
   the drawbridge and its panel, the objective tracker, and their overlay drawing. */
const OBJECTIVES=['Get into the data center','Detain the scientists','Lower the drawbridge','Take the Headquarters'];
// obj (internal): 3 outdoors and in the data center, 4 once the scientists are out (the drawbridge), 5 the Headquarters (0-2 were the old objectives)
const RPG={aim:1.3,reload:8,speed:170,spread:[18,42],range:400,blast:40,dmg:85};
const CHARGE={plant:3,fuse:8,away:130};
let rockets=[],tankFires=[],tankQueue=[],charges=[],obj=0,groups={},finished={},panelGo=null,bridgeDown=0,pendingSpawns=[];
let mission={name:'yard',t0:0};
function resetMission(){
  rockets=[];tankFires=[];tankQueue=[];charges=[];obj=0;objDone=0;groups={};finished={};panelGo=null;mission={name:'yard',t0:0};pendingSpawns=[];
  lastNoiseT=-99;spotBannerT=-99;
  for(const z of HQ_ZONES)if(z.mesh&&z.mesh.parent)z.mesh.parent.remove(z.mesh);HQ_ZONES.length=0;   // (their models too)
  for(const o of objs)if(o.kind==='tank'){o.hp=100;o.burst=false;if(o.meshes)for(const m of o.meshes)if(m.userData.c0!=null)m.material.color.setHex(m.userData.c0);}
  sciOut=0;scanGo=null;for(const q of pickups)if(q.mesh&&q.mesh.parent)q.mesh.parent.remove(q.mesh);pickups=[];   // (the sniper's floating rifle too)
  setBridge(0);if(PANEL.button)PANEL.button.material.emissive.setHex(0);
  updateObjUI();
}
/* ---------- objectives ---------- */
// spawn helpers: a rifleman, an MG gunner on a tripod gun (never moves), a sentry inside a structure
function hostile(id,x,y,extra){const u=mk('E','E',id,extra.name||'Hostile',x,y,extra.ang??Math.PI/2);Object.assign(u,{jumpy:true},extra);makeSoldier(u);if(u.radio)addRadioKit(u);return u;}
// the pillbox's gunner: on its mounted gun (PBOX in map.js), standing behind it, only firing within its swing
function pillGunner(id){const g=PBOX.gun,u=hostile(id,g.x,g.y-7,{name:'Gunner',gunner:true,post:true,ang:g.ang});u.onGun=g;return u;}
/* ---------- a soldier on the pillbox gun (Bryan: the player can walk in and take it over) ---------- */
const gunMan=()=>units.find(u=>u.onGun===PBOX.gun&&!u.dead&&!u.downed)||null;
function orderMan(list){
  const g=PBOX.gun,c=list.filter(p=>alive(p)&&!p.carry).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y));if(!c.length)return false;
  const r=reachFor(c,u=>findPath(u.x,u.y,g.x,g.y-7),'No way to the gun from here.');if(!r)return false;const u=r.u,path=r.p;   // (inside his circle: Bryan, after v104)
  Object.assign(u,{path,lastOrder:simT,watch:null,supT:null,focus:null,manGo:{t0:simT}});callout(u,'To the gun',C.good);return true;
}
function manTick(){
  for(const u of players){
    if(u.onGun&&(u.path.length||!alive(u))){u.onGun=null;u.gunner=false;}   // a move order (or going down) takes him off it
    const m=u.manGo;if(!m)continue;
    if(!alive(u)||u.lastOrder>m.t0+.01||gunMan()){u.manGo=null;continue;}
    if(u.path.length)continue;u.manGo=null;
    if(hyp(u.x-PBOX.gun.x,u.y-(PBOX.gun.y-7))>10)continue;
    Object.assign(u,{onGun:PBOX.gun,gunner:true,ang:PBOX.gun.ang,aimT:simT});callout(u,'On the gun',C.good);if(typeof gen==='function')chat('mgman',20,gen(u,'mgman'));
  }
}
// MAN THE GUN over the pillbox's gun once nobody's on it and a soldier is near
function drawGunMark(now){
  if(MAPID!=='out'||gunMan()||!players.some(p=>alive(p)&&hyp(p.x-PBOX.gun.x,p.y-PBOX.gun.y)<300))return;
  const g=PBOX.gun,p=(Math.sin(now*3)+1)/2;gPath(g.x,g.y,12);ox.strokeStyle=`rgba(127,224,138,${(.5+p*.4).toFixed(2)})`;ox.lineWidth=2;ox.setLineDash([5,4]);ox.stroke();ox.setLineDash([]);
  toSBack=false;const[lx,ly]=toS(g.x,g.y,20);if(!toSBack)label('MAN THE GUN',lx,ly-6,C.good,9,700);
}
function mgGunner(id,x,y){
  const u=hostile(id,x,y,{name:'Gunner',gunner:true,post:true});
  const mg=new T.Group(),dm=new T.MeshStandardMaterial({color:0x1b1e1b,roughness:.7,metalness:.45});
  const barrel=new T.Mesh(new T.BoxGeometry(14,1.4,1.4),dm);barrel.position.set(9,9.5,0);mg.add(barrel);
  for(const a of[0,2.1,4.2]){const leg=new T.Mesh(new T.CylinderGeometry(.35,.35,9,4),dm);leg.position.set(8+Math.cos(a)*2,4.5,Math.sin(a)*2);leg.rotation.z=Math.cos(a)*.3;leg.rotation.x=Math.sin(a)*.3;mg.add(leg);}
  u.m.pose.add(mg);return u;
}
// the run's heavy machine gun (Bryan: manned): hits harder than the other guns, sweeps the lane with a searchlight while he
// hasn't seen you (spotting faster in it), and reloads after every HEAVY.bursts bursts (HEAVY.reload s, RELOADING over him):
// the window to dash. The searchlight is its own mesh in the scene, so you see it even when you can't see him.
const HEAVY={bursts:6,reload:3,dmg:.8,sweep:.42};
function addSearchlight(u){
  const L=230,g=new T.ConeGeometry(L*Math.tan(.2),L,20,1,true);g.rotateZ(Math.PI/2);g.translate(L/2,0,0);
  const c=document.createElement('canvas');c.width=4;c.height=128;const x=c.getContext('2d'),gr=x.createLinearGradient(0,0,0,128);
  gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.3,'rgba(255,255,255,.4)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,4,128);
  const m=new T.Mesh(g,new T.MeshBasicMaterial({map:new T.CanvasTexture(c),color:0xfff1c8,transparent:true,opacity:.3,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
  m.renderOrder=2;scene.add(m);u.slight=m;heavyPose(u);
}
function heavyPose(u){const m=u.slight;if(!m)return;m.visible=!u.dead&&!HEAVY.dark;m.position.set(u.x,17,u.y);m.rotation.set(0,-u.ang,-.1);}
function heavyTick(){   // sweep the lane while unaware; keep the light on him
  for(const u of enemies){if(!u.heavy)continue;if(!u.dead&&!u.alerted)u.ang=Math.PI/2+Math.sin(simT*.55)*HEAVY.sweep;heavyPose(u);}
}
// Each area's defenders: [x,y,make,stay] for each post. They take their posts at the start (after the landing), but never in
// front of the squad: a post a soldier could see (within 360) or that's within 100 of one waits (pendingSpawns) until it isn't;
// after SPAWN_WAIT s the man turns up out of sight nearby instead and walks to his post (stay: he waits instead).
function groupSpecs(n){
  const g=[];
  if(n===1){   // the bridge: an MG nest at its north end, a gunner on the pillbox's gun, riflemen behind sandbags; calm, not on edge
    g.push([476,20,()=>mgGunner('E20',476,20)],[PBOX.gun.x,PBOX.gun.y-7,()=>pillGunner('E21'),true]);   // (the pillbox's: he never walks in)
    for(const[i,[x,y]]of[[422,14],[614,16],[372,12]].entries())g.push([x,y,()=>hostile('E'+(22+i),x,y,{zone:BR_ZONE,radio:i===0})]);   // E22 carries the radio
    for(const q of g){const make0=q[2];q[2]=()=>{const u=make0();u.jumpy=false;return u;};}
  }else if(n===2){   // the container yard (Bryan: "lightly guarded"): one posted with the radio and one walking the west half's middle aisle, one posted in the east half
    g.push([250,-107,()=>hostile('E30',250,-107,{zone:CONT_W,ang:0,radio:true})],
      [60,-107,()=>hostile('E32',60,-107,{name:'Patrol',zone:CONT_W,route:[{x:400,y:-107},{x:60,y:-107}],ri:0,waitT:0})],
      [760,-107,()=>hostile('E31',760,-107,{zone:CONT_E,ang:Math.PI})]);
  }else if(n===3){   // the data center's front (Bryan: most of the guards here): the heavy gun and an MG in nests, five riflemen behind the sandbags, the gun jeep on the road, the sniper up the watchtower across it (after v100)
    const N=DC_NESTS;
    g.push([N[0].x,N[0].y,()=>{const u=mgGunner('E40',N[0].x,N[0].y);Object.assign(u,{heavy:true,name:'Heavy MG'});addSearchlight(u);return u;},true],[N[1].x,N[1].y,()=>mgGunner('E41',N[1].x,N[1].y),true]);
    for(const[i,[x,y]]of[[468,-398],[370,-404],[576,-404],[630,-392],[682,-400]].entries())g.push([x,y,()=>hostile('E'+(42+i),x,y,{zone:DC_OUT,radio:i===0})]);   // E42 carries the radio
    g.push([GJEEP.route[0].x,GJEEP.route[0].y,()=>makeTruck('E48'),true],[TOWER.x,TOWER.y,()=>{const u=towerSniper('E25');u.jumpy=false;return u;},true]);
  }
  return g;
}
const SPAWN_WAIT=12;let spawnTick=0;
function spawnGroup(n){
  groups[n]=[];
  for(const[x,y,make,stay]of groupSpecs(n))pendingSpawns.push({n,x,y,make,stay,t0:simT});
  spawnPending();
}
function postSeen(x,y){return players.some(p=>{if(!alive(p))return false;const d=hyp(p.x-x,p.y-y);return d<100||(d<360&&los(p.x,p.y,x,y));});}
// somewhere out of the squad's sight (and not close to it) within reach of a post, to walk in from
function hiddenNear(x,y){
  let best=null,bd=1e9;
  for(const c of coverPts){const d=hyp(c.x-x,c.y-y);if(d>220||d>=bd||postSeen(c.x,c.y)||players.some(p=>alive(p)&&hyp(p.x-c.x,p.y-c.y)<140))continue;bd=d;best=c;}
  return best;
}
function spawnPending(){
  let any=false;
  for(let i=0;i<pendingSpawns.length;i++){
    const s=pendingSpawns[i];let u=null;
    if(!postSeen(s.x,s.y))u=s.make();
    else if(!s.stay&&simT-s.t0>SPAWN_WAIT){   // still in view: he turns up out of sight and walks to his post (the pillbox sentry keeps waiting)
      const h=hiddenNear(s.x,s.y),p=h&&findPath(h.x,h.y,s.x,s.y,FOOT);
      if(p){u=s.make();u.x=h.x;u.y=h.y;u.path=p;}
    }
    if(!u&&simT-s.t0>30)u=s.make();   // never hold one back for good: the location couldn't be cleared without him
    if(!u)continue;
    u.grp=s.n;groups[s.n].push(u);pendingSpawns.splice(i--,1);any=true;
  }
  if(any)enemies=units.filter(u=>u.side==='E');
}
function groupDone(n){return !!groups[n]&&groups[n].every(beaten)&&!pendingSpawns.some(s=>s.n===n)&&!reinfPending(n);}   // (and no reinforcements on the way: hunt.js)
function groupLeft(n){return (groups[n]||[]).filter(e=>!beaten(e)).length+pendingSpawns.filter(s=>s.n===n).length;}

/* ---------- checkpoints (Bryan: "Killing all the units in the area opens up the checkpoint"; none has to be cleared) ----------
   An area whose defenders are all down (or gave up), with no reinforcements on the way, and CP_QUIET s without a shot is a
   checkpoint: a medic station and an ammo drop appear there and the game saves. */
const CP_QUIET=3;
const AREAS={
  0:{k:'wh',name:'the warehouse',zone:{x0:150,x1:470,y0:240,y1:580}},
  1:{k:'br',name:'the bridge',zone:BR_ZONE},
  2:{k:'maze',name:'the container yard',zone:CONT_ZONE},
  3:{k:'dco',name:'the data center\'s front',zone:DC_OUT},
};
let lastNoiseT=-99;
function inZone(p,z){return p.x>=z.x0&&p.x<=z.x1&&p.y>=z.y0&&p.y<=z.y1;}
function tanksGone(){return objs.every(o=>o.kind!=='tank'||o.burst);}
// after the landing (or a Continue): every area not yet cleared gets its defenders
function startMissionAreas(){
  obj=3;wave.phase='hq';if(!hq)hq={t0:simT,tour:null};
  if(!finished[0])groups[0]=enemies.filter(e=>e.grp===0&&!e.gone);
  for(const n of[1,2,3])if(!finished[n]&&!groups[n])spawnGroup(n);
  updateObjUI();setStatus();hud();
}
// the area the squad is nearest (reinforcements and the lockdown's hunters belong to it); threat points for previews before anyone's seen
const AREA_THREAT={0:{x:310,y:540},1:{x:476,y:30},2:{x:160,y:-220},3:{x:400,y:-385}};
function nearArea(){
  const ups=players.filter(p=>alive(p)&&!p.offMap);if(!ups.length)return 3;
  const cx=ups.reduce((a,p)=>a+p.x,0)/ups.length,cy=ups.reduce((a,p)=>a+p.y,0)/ups.length;let best=3,bd=1e9;
  for(const n of[0,1,2,3]){if(finished[n])continue;const t=AREA_THREAT[n],d=hyp(t.x-cx,t.y-cy);if(d<bd){bd=d;best=n;}}
  return best;
}
function checkpointTick(){
  if(MAPID!=='out'||state!=='play')return;
  for(const n of[0,1,2,3])if(!finished[n]&&groups[n]&&groupDone(n)&&simT-lastNoiseT>=CP_QUIET)clearArea(n);
}
function clearArea(n){
  const A=AREAS[n];finished[n]=true;contact=false;clearTeams();
  bigText('Checkpoint','clear');banner(`${A.name[0].toUpperCase()+A.name.slice(1)} is clear. A medic station and an ammo drop are here.`,3200);chatSecured();
  addZones(REST_ZONES[A.k]);saveGame(A.k);setStatus();updateObjUI();
  // (Bryan: no tips in Level 2: the first checkpoint's camera tour of the station and the drop is gone; their rings say what they are)
}
function patrolTick(){   // patrols walk their route and back, pausing at each end, until they're alerted (Level 2's too: level2.js)
  for(const e of enemies){
    if(e.dead||e.alerted||e.surr||e.bodyGo||!e.route||e.path.length)continue;   // (gone to look at a body: layers.js)
    if(!e.waitT){e.waitT=simT+2.5;continue;}
    if(simT<e.waitT)continue;
    e.ri=(e.ri+1)%e.route.length;const p=e.route[e.ri],path=findPath(e.x,e.y,p.x,p.y,FOOT);if(path)e.path=path;e.waitT=0;
  }
}
// every tick once the warehouse is taken (from hqTick)
function missionTick(dt){
  heavyTick();
  chargeTick(dt);
  if(MAPID==='in')interiorTick(dt);   // inside the office building (interior.js)
  else if(pendingSpawns.length&&(spawnTick-=dt)<=0){spawnTick=.5;spawnPending();}   // twice a second is plenty
  patrolTick();
  checkpointTick();truckTick(dt);towerTick(dt);for(const e of enemies)if(e.cone)sniperConePose(e);
  if(panelGo){
    const u=panelGo;
    if(!alive(u)||(!u.path.length&&hyp(u.x-PANEL.x,u.y-PANEL.y)>26))panelGo=null;
    else if(hyp(u.x-PANEL.x,u.y-PANEL.y)<=22){
      panelGo=null;
      if(obj<4){banner('The drawbridge has a bio scanner. It only opens for one of the scientists inside the data center.',4000);callout(u,'Locked',C.warn);if(PANEL.button)PANEL.button.material.emissive.setHex(0x991a10);backSoon(u,1.2);}
      else if(obj===4&&!scanGo)startScan(u);   // a detained scientist's hand on the scanner (office.js)
    }
  }
}
// rockets in flight, tanks waiting to go up in a chain reaction, the drawbridge coming down: these run every tick
function missionFx(dt){
  rocketTick(dt);
  for(let i=tankQueue.length-1;i>=0;i--)if(simT>=tankQueue[i].at){const o=tankQueue[i].o;tankQueue.splice(i,1);tankExplode(o,null);}
  if(bridgeDown&&BRIDGE.lower<1)setBridge(Math.max(1e-4,Math.min(1,(simT-bridgeDown)/3)));   // (never 0 here: setBridge(0) means a reset, and the scan can lower it in the same tick)
}
// the scan took: the drawbridge comes down (Bryan: the monsters start here, next build)
function lowerBridge(u){
  if(obj!==4)return;callout(u,'Lowering the bridge',C.good);if(PANEL.button)PANEL.button.material.emissive.setHex(0x1a9930);bridgeDown=simT;obj=5;
  objDone=Math.max(objDone,3);saveGame('dc',true);updateObjUI();   // (Bryan: no "Drawbridge down!", no objective list opening, no Saved chip: the screen clear for what comes out of the gate; the objective is crossed off quietly. Its medic station and ammo drop once the gate's clear: monsters.js)
  monGateStart();   // and what was behind it comes out (monsters.js); the freed men's goodbye waits for the end, in the Headquarters (fortress.js)
}
function setBridge(k){BRIDGE.lower=k;if(BRIDGE.grp)BRIDGE.grp.rotation.x=-.12-(Math.PI/2-.12)*(k<1?k*k*(3-2*k):1);if(!k)bridgeDown=0;}
function tapPanel(){
  const foot=sel.filter(u=>alive(u)&&!u.inVeh).sort((a,b)=>hyp(a.x-PANEL.x,a.y-PANEL.y)-hyp(b.x-PANEL.x,b.y-PANEL.y));
  if(!foot.length){banner('Select a soldier, then tap the bio scanner.',2000);return;}
  const r=reachFor(foot,u=>{const s=openSpot(PANEL.x,PANEL.y+14,players.filter(p=>p!==u&&!p.dead).map(destOf))||{x:PANEL.x,y:PANEL.y+14};return findPath(u.x,u.y,s.x,s.y);},'No way to reach the panel from here.');
  if(!r)return;const u=r.u,p=r.p;   // (inside his circle: Bryan, after v104)
  if(obj===4&&!scanGo&&!startScan(u))return;   // a scientist goes over with him, whoever tied him (office.js)
  u.path=p;u.lastOrder=simT;callout(u,obj===4?'To the scanner':'Checking the controls',C.good);panelGo=u;markRet(u);   // (back to the others once it's done: retTick in combat.js)
}

/* ---------- the gun jeep (Bryan: "The jeep patrols that road, from left to right continuously (the user can sneak by or
   engage)"; "let's make the truck just a light jeep") ----------
   It drives the runway road end to end and back without stopping (one lane each way, a U-turn at each end), its driver and
   its gunner in plain sight, looking where it's going. If it spots the squad it stops and the gunner fights from there; once
   they've lost the squad (the hunt gives up) it drives on. Light: bullets hurt it (a little less than a man), a rocket or
   two grenades wreck it. */
const GJEEP={speed:26,hp:130,bullet:.6,route:[{x:70,y:-252},{x:930,y:-252},{x:958,y:-275},{x:930,y:-298},{x:70,y:-298},{x:42,y:-275}]};
function makeTruck(id){   // (the defenders' list still calls it this)
  const r=GJEEP.route,u=mk('E','E',id,'Gun jeep',r[0].x,r[0].y,0);
  Object.assign(u,{veh:true,gunner:true,post:true,hp:GJEEP.hp,jumpy:false,eye:{r:360,cone:1.6},drive:{i:0},aimA:0});
  const g=new T.Group(),olive=new T.MeshStandardMaterial({color:0x4b5536,roughness:.75,metalness:.2}),dark=new T.MeshStandardMaterial({color:0x1c1f21,roughness:.6,metalness:.4});
  const B=(w,h,d,m,x,y,z,p=g)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=true;p.add(o);return o;};
  B(36,6,19,olive,0,7.5,0);B(12,3.2,18,olive,13,11.2,0);B(1,5,14,dark,19.4,8.6,0);   // the tub, the hood, the grille
  B(1.2,6.5,18.4,dark,7,14.4,0);B(5,2.6,6,dark,1,10.6,-4.5);B(5,2.6,6,dark,1,10.6,4.5);   // the windscreen's frame, two seats
  const sw=new T.Mesh(new T.TorusGeometry(1.8,.3,6,14),dark);sw.position.set(5.2,13.4,-4.5);sw.rotation.y=Math.PI/2;sw.rotation.x=.5;g.add(sw);   // the steering wheel
  for(const s of[-1,1]){B(1,9.5,1,dark,-4,15,s*9);}B(1,1,19,dark,-4,19.7,0);   // the roll bar
  const wheels=[];for(const x of[-12,12])for(const z of[-10,10]){const wg=new T.Group();wg.position.set(x,4.2,z);const w=new T.Mesh(new T.CylinderGeometry(4.2,4.2,3.4,14),dark);w.rotation.x=Math.PI/2;w.castShadow=true;wg.add(w);g.add(wg);wheels.push(wg);}
  const sp=new T.Mesh(new T.CylinderGeometry(4,4,2,12),dark);sp.rotation.z=Math.PI/2;sp.position.set(-19,10.5,0);g.add(sp);   // the spare wheel
  const tur=new T.Group();tur.position.set(-9,13,0);g.add(tur);
  const ringM=new T.Mesh(new T.TorusGeometry(5,.6,6,18),dark);ringM.rotation.x=Math.PI/2;tur.add(ringM);
  B(1.2,4,1.2,dark,2.5,2,0,tur);B(4.5,2.2,2,dark,4,4.4,0,tur);B(2,2,2,olive,3.6,3.2,-1.7,tur);   // the mount, the gun's body, its ammo box
  const bar=new T.Mesh(new T.CylinderGeometry(.45,.45,12,8),dark);bar.rotation.z=Math.PI/2;bar.position.set(11.5,4.6,0);tur.add(bar);
  const hl=new T.MeshBasicMaterial({color:0xfff2c8,toneMapped:false}),tl=new T.MeshBasicMaterial({color:0xff3a2a,toneMapped:false});
  for(const z of[-6,6]){B(.6,1.6,2.6,hl,19.8,10,z);B(.6,1.2,2,tl,-18.2,9.5,z*1.3);}   // headlights and tail lights (they bloom; no real light)
  const ring=new T.Mesh(new T.RingGeometry(20,22.5,32),new T.MeshBasicMaterial({color:0xff4a3a,transparent:true,opacity:.85,side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.4;g.add(ring);
  // its crew: a driver at the wheel and a gunner standing at the gun, turning with it (figure.js)
  const crew=[{id:id+'d',name:'Driver',inBoat:true,driving:true,noGun:true,at:[1.4,7.2,-4.5],par:g},{id:id+'g',name:'Gunner',gunner:true,at:[-4.4,-6.2,0],par:tur}].map(c=>{
    const v=Object.assign({side:'E',team:'E',x:0,y:0,ang:0,path:[],hp:100},c);makeFigure(v);v.m.ring.visible=false;c.par.add(v.m.g);v.m.g.position.set(...c.at);return v;});
  scene.add(g);u.m={g,ring,tur,olive,pose:g,wheels,crew,px:u.x,py:u.y};return u;
}
function truckPose(u){   // the gun follows its aim, the wheels turn, the crew moves; a wreck goes black and its crew is gone
  const m=u.m;if(u.dead){if(!m.dead){m.dead=true;m.olive.color.setHex(0x161716);m.tur.rotation.z=.25;for(const c of m.crew)c.m.g.visible=false;}m.ring.visible=false;return;}
  let da=u.aimA-u.ang;m.tur.rotation.y=-Math.atan2(Math.sin(da),Math.cos(da));m.ring.visible=true;
  const d=hyp(u.x-m.px,u.y-m.py);m.px=u.x;m.py=u.y;if(d<20)for(const w of m.wheels)w.rotation.z-=d/4.2;
  if(m.g.visible)for(const c of m.crew){c.shotT=u.shotT;c.hitFlash=u.hitFlash;figAnimate(c,c.m);}
}
function truckTick(dt){   // round and round the road; stopped while it fights
  const u=enemies.find(e=>e.veh&&!e.dead);if(!u||MAPID!=='out')return;const D=u.drive;
  if(u.alerted){if(u.path.length)u.path=[];return;}   // it's seen them: it stops and fights where it is (and drives on once they've lost the squad)
  u.aimA=u.ang;   // (driving: the gun looks where it's going)
  if(u.path.length)return;
  D.i=(D.i+1)%GJEEP.route.length;const q=GJEEP.route[D.i];u.path=[{x:q.x,y:q.y}];u.aimA=u.ang;
}
// knocked out: a blast, a burning wreck (no body to find)
function truckWreck(u,src){
  u.dead=true;u.path=[];booms.push({x:u.x,y:u.y,t:0,size:1.2});shake(clamp(1-hyp(u.x-camT.x,u.y-camT.z)/700,0,1));paintDecal({k:'scorch',x:u.x,y:u.y,r:Math.random()});
  callout(u,'Jeep down',C.good);if(src&&src.side==='P'){creditKill(src);if(typeof gen==='function')chat('kill',8,gen(src,'tkdone'));}
}

/* ---------- the watchtower (Bryan: a sniper up it; when he's dropped his rifle floats over him, and a soldier can climb up,
   take it and use it from there) ----------
   Tap the tower with soldiers selected: the nearest walks to the ladder and climbs (1.6 s). Up there he's in half cover behind
   the rails, sees a long way with the rifle, and climbs down first if you send him anywhere. One man at a time. */
const CLIMB_T=1.6;
let pickups=[];
function towerSniper(id){
  const u=hostile(id,TOWER.x,TOWER.y,{name:'Sniper',post:true,onTower:true,elev:TOWER.elev,weapon:'sniper',eye:{r:620,cone:.75},ang:Math.atan2(-340-TOWER.y,500-TOWER.x)});
  if(typeof T!=='undefined'&&scene)addSniperCone(u);return u;   // facing along the building's front to its doors and up the runway road (just south of east): the doors, the strip before them, the road east to the bridge road's mouth and his own front in his cone; the road's far west end, the yard and the pipe behind him. (His cone shows from the start, below; he isn't marked as seen: known men count as threats anywhere for the squad's cover, and a sniper 30 m off put them on the yard's patrol aisle)   // facing out over the runway road and down the bridge's road (SSE): the road east of him, the bridge road's mouth and the road down to the canal in his cone; the doors, the strip in front of the building, the road's far west end and the yard's west side behind him or out of it
}
const towerMan=()=>units.find(u=>u.onTower&&!u.dead&&!u.downed)||null;
// his cone on the ground (Bryan, after v101: "We should also put a large red cone where the sniper sees... Really make sure the
// players knows the sniper tower is there"): big and red from the start, alerted or not, as far as he sees and cut off where
// the buildings and containers block his view (the sight grid, sightBlk); it turns with him and goes when he's down. In 3D on
// the ground, so it's there zoomed in too (on the overlay, a cone this size often has corners behind the camera)
const NEST_N=48;
function addSniperCone(u){
  const g=new T.Group(),fg=new T.BufferGeometry(),lg=new T.BufferGeometry(),idx=[];
  for(let i=1;i<=NEST_N;i++)idx.push(0,i,i+1);
  fg.setAttribute('position',new T.BufferAttribute(new Float32Array((NEST_N+2)*3),3));fg.setIndex(idx);
  lg.setAttribute('position',new T.BufferAttribute(new Float32Array((NEST_N+2)*3),3));
  const fill=new T.Mesh(fg,new T.MeshBasicMaterial({color:0xff2414,transparent:true,opacity:.2,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
  const edge=new T.LineLoop(lg,new T.LineBasicMaterial({color:0xff5040,transparent:true,opacity:.85,depthWrite:false,toneMapped:false}));
  fill.renderOrder=2;edge.renderOrder=3;fill.frustumCulled=edge.frustumCulled=false;g.add(fill,edge);scene.add(g);
  u.cone=g;u.coneAng=null;u.coneT=-1;sniperConePose(u);
}
function sniperConePose(u){
  const g=u.cone;if(!g)return;
  if(u.dead||beaten(u)){g.visible=false;return;}
  g.visible=true;const[fill,edge]=g.children;fill.material.opacity=.22+.1*(Math.sin(simT*2.4)+1)/2+(u.alerted?.08:0);
  if(u.coneAng!==null&&Math.abs(u.ang-u.coneAng)<.01&&simT-u.coneT<.5)return;   // (re-cut when he turns, and twice a second: a Defender's wall)
  u.coneAng=u.ang;u.coneT=simT;
  const{r:R,cone:A}=eyeOf(u),fp=fill.geometry.attributes.position,lp=edge.geometry.attributes.position,set=(i,x,y)=>{fp.setXYZ(i,x,1.2,y);lp.setXYZ(i,x,1.6,y);};
  set(0,u.x,u.y);
  for(let i=0;i<=NEST_N;i++){const a=u.ang-A+2*A*i/NEST_N,dx=Math.cos(a),dy=Math.sin(a);let r=14;
    for(;r<R;r+=8){const x=u.x+dx*r,y=u.y+dy*r,gx=Math.floor(x/CS),gy=Math.floor((y-TOP)/CS);if(gx<0||gy<0||gx>=GW||gy>=GH||sightBlk[gy*GW+gx])break;}
    r=Math.min(r,R);set(i+1,u.x+dx*r,u.y+dy*r);}
  fp.needsUpdate=lp.needsUpdate=true;fill.geometry.computeBoundingSphere();
}
function enemyDown(e){   // from damage() and silentKill(): the sniper's rifle stays up the tower
  if(e.weapon!=='sniper'||!e.onTower)return;
  const g=new T.Group(),m=new T.MeshStandardMaterial({color:0x1d2124,roughness:.5,metalness:.5,emissive:0x2a4a2a});
  const parts=[[22,1.6,1.6,0,0],[7,2.6,2.2,-6,-.4],[9,1.6,1.4,3,1.8]];for(const[w,h,d,x,y]of parts){const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,0);g.add(o);}
  g.position.set(TOWER.x,TOWER.elev+10,TOWER.y);scene.add(g);pickups.push({kind:'sniper',x:TOWER.x,y:TOWER.y,tower:true,mesh:g});
  setTimeout(()=>{if(state==='play'&&typeof tutLine==='function')tutLine('sniperdown',tutBy(e.x,e.y));},1200);   // "Sniper's down. That rifle's ours if we want it." (chatter.js)
}
const towerTop=()=>{const L=TOWER.ladder,d=hyp(L.x-TOWER.x,L.y-TOWER.y)||1;return{x:TOWER.x+(L.x-TOWER.x)/d*4,y:TOWER.y+(L.y-TOWER.y)/d*4};};   // where the ladder comes up onto the platform
function orderClimb(list){
  if(enemies.some(e=>e.onTower&&!beaten(e))){banner('The sniper is still up there.',1800);return false;}
  if(towerMan()){banner(`${towerMan().name} is already up the tower.`,1600);return false;}
  const L=TOWER.ladder,c=list.filter(p=>alive(p)&&!p.carry).sort((a,b)=>hyp(a.x-L.x,a.y-L.y)-hyp(b.x-L.x,b.y-L.y));if(!c.length)return false;
  const r=reachFor(c,u=>hyp(u.x-L.x,u.y-L.y)<6?[]:findPath(u.x,u.y,L.x,L.y),'No way to the ladder from here.');if(!r)return false;const u=r.u,path=r.p;   // (inside his circle: Bryan, after v104)
  Object.assign(u,{path,lastOrder:simT,watch:null,supT:null,focus:null,climbGo:{t0:simT}});callout(u,'To the tower',C.good);return true;
}
function towerTick(dt){
  for(const u of players){
    if(u.climb){   // on the ladder
      const c=u.climb;c.t+=dt;const k=clamp(c.t/CLIMB_T,0,1),L=TOWER.ladder,top=towerTop();
      if(!alive(u)){u.climb=null;u.elev=0;u.onTower=false;u.x=L.x;u.y=L.y;continue;}
      const f=c.up?k:1-k;u.x=L.x+(top.x-L.x)*f;u.y=L.y+(top.y-L.y)*f;u.elev=TOWER.elev*f;
      if(k<1)continue;u.climb=null;
      if(c.up){u.onTower=true;callout(u,'Up the tower',C.good);
        const pk=pickups.find(q=>q.tower&&q.kind!==u.weapon);
        if(pk){u.weapon2=u.weapon||'rifle';u.weapon=pk.kind;pickups=pickups.filter(q=>q!==pk);if(pk.mesh&&pk.mesh.parent)pk.mesh.parent.remove(pk.mesh);callout(u,'Sniper rifle',C.good);buildCards();hud();
          if(typeof gen==='function')chat('gotrifle',20,gen(u,'gotrifle'));}}
      else{const p=c.then&&findPath(u.x,u.y,c.then.x,c.then.y);u.path=p||[];}
      continue;
    }
    if(u.onTower){u.elev=TOWER.elev;
      if(u.downed||u.dead){u.onTower=false;u.elev=0;u.x=TOWER.ladder.x;u.y=TOWER.ladder.y;continue;}   // he goes down with the ladder (no reviving him up there)
      if(u.path.length){const dst=u.path[u.path.length-1];u.path=[];u.onTower=false;u.climb={t:0,up:false,then:{x:dst.x,y:dst.y}};callout(u,'Climbing down',C.good);}   // sent somewhere: down the ladder first
      continue;
    }
    const g=u.climbGo;if(!g)continue;
    if(!alive(u)||u.lastOrder>g.t0+.01||towerMan()){u.climbGo=null;continue;}
    if(u.path.length)continue;u.climbGo=null;
    if(hyp(u.x-TOWER.ladder.x,u.y-TOWER.ladder.y)<10){u.climb={t:0,up:true};u.ang=Math.atan2(TOWER.y-TOWER.ladder.y,TOWER.x-TOWER.ladder.x);}
  }
}
// CLIMB at the ladder once the tower's free and a soldier's near; the sniper's rifle floating over the platform
function drawTower(now){
  {const s=enemies.find(e=>e.onTower&&!beaten(e));if(s){toSBack=false;const[lx,ly]=toS(TOWER.x,TOWER.y,TOWER.elev+28);if(!toSBack)label('SNIPER NEST',lx,ly,'#ff6a55',10,800);}}   // (Bryan, after v101: make sure they know it's there)
  for(const p of pickups)if(p.mesh){p.mesh.rotation.y=now*1.6;p.mesh.position.y=TOWER.elev+10+Math.sin(now*2.2)*1.4;
    toSBack=false;const[lx,ly]=toS(p.x,p.y,TOWER.elev+20);if(!toSBack&&players.some(q=>alive(q)&&hyp(q.x-p.x,q.y-p.y)<420))label('SNIPER RIFLE',lx,ly,'#9fe8a0',9,700);}
  if(towerMan()||enemies.some(e=>e.onTower&&!beaten(e))||!players.some(p=>alive(p)&&hyp(p.x-TOWER.x,p.y-TOWER.y)<300))return;
  const L=TOWER.ladder,k=(Math.sin(now*3)+1)/2;gPath(L.x,L.y,9);ox.strokeStyle=`rgba(127,224,138,${(.5+k*.4).toFixed(2)})`;ox.lineWidth=2;ox.setLineDash([4,3]);ox.stroke();ox.setLineDash([]);
  toSBack=false;const[lx,ly]=toS(L.x,L.y,8);if(!toSBack)label('CLIMB',lx,ly+14,C.good,9,700);
}

/* ---------- demolition charges ---------- */
// tap the charge on a soldier's card, then a fuel tank: he walks up, plants it (CHARGE.plant s),
// runs clear by himself, and it goes off CHARGE.fuse s later. Quiet until it blows.
function chargeTargetAt(x,y){
  const t=objs.find(o=>o.kind==='tank'&&!o.burst&&rectDist(x,y,o)<26);if(t)return t;
  return null;
}
function orderCharge(u,x,y){
  const t=chargeTargetAt(x,y);if(!t){banner(obj===2?'Tap a fuel tank.':'Charges are for the fuel tanks.',2000);return false;}
  if(!u.charges){banner(`${u.name} has no charge left. Restock at a supply box.`,2000);return false;}
  const cx=t.x+t.w/2,cy=t.y+t.h/2;let best=null,bd=1e9;
  for(let a=0;a<TAU;a+=TAU/16){const r=Math.max(t.w,t.h)/2+11,px=cx+Math.cos(a)*r,py=cy+Math.sin(a)*r;if(!isFree(px,py))continue;const d=hyp(px-u.x,py-u.y);if(d<bd){bd=d;best={x:px,y:py};}}
  const p=best&&findPath(u.x,u.y,best.x,best.y);if(!p){banner('No way to reach it from here.',2000);return false;}
  u.path=p;u.lastOrder=simT;u.plant={t,x:best.x,y:best.y,prog:0};u.focus=null;u.supT=null;callout(u,'Setting a charge',C.warn);return true;
}
function chargeTick(dt){
  for(const u of players){
    const pl=u.plant;if(!pl)continue;
    if(!alive(u)||(u.path.length&&hyp(u.path[u.path.length-1].x-pl.x,u.path[u.path.length-1].y-pl.y)>4)){u.plant=null;continue;}   // ordered elsewhere: cancelled
    if(u.path.length)continue;
    if(hyp(u.x-pl.x,u.y-pl.y)>6){u.plant=null;continue;}
    pl.prog+=dt;
    if(pl.prog>=CHARGE.plant){
      u.plant=null;u.charges--;u.stats.items++;const t=pl.t;
      charges.push({t,x:(u.x+t.x+t.w/2)/2,y:(u.y+t.y+t.h/2)/2,at:simT+CHARGE.fuse,by:u});
      callout(u,'Charge set! Get clear!',C.warn);
      // run clear by himself: the nearest cover point far enough away, out of the blast's sight if possible
      const away=CHARGE.away,cx=t.x+t.w/2,cy=t.y+t.h/2;let best=null,bs=-1e9;
      for(const c of coverPts){const d=hyp(c.x-cx,c.y-cy);if(d<away||d>away+120)continue;const sc=(los(cx,cy,c.x,c.y)?0:2)-hyp(c.x-u.x,c.y-u.y)/80;if(sc>bs){bs=sc;best=c;}}
      const p=best&&findPath(u.x,u.y,best.x,best.y);if(p){u.path=p;u.lastOrder=simT;u.gaitForce='run';}
      for(const o of players)if(o!==u&&alive(o)&&!o.path.length&&hyp(o.x-cx,o.y-cy)<away)callout(o,'Too close!',C.bad);
    }
  }
  for(let i=charges.length-1;i>=0;i--){
    const c=charges[i];if(simT<c.at)continue;charges.splice(i,1);
    booms.push({x:c.x,y:c.y,t:0});tankExplode(c.t,c.by);
    if(c.by&&c.by.gaitForce==='run')c.by.gaitForce=null;
  }
}

/* ---------- RPG ---------- */
// called from updateUnit instead of rifle fire: aim at a soldier (the jeep if it's crewed) for RPG.aim s, then fire
function rpgThink(u){
  if(u.aimAt){
    if(simT<u.aimAt.until)return;
    const a=Math.random()*TAU,off=RPG.spread[0]+Math.random()*(RPG.spread[1]-RPG.spread[0]);
    const tx=u.aimAt.x+Math.cos(a)*off,ty=u.aimAt.y+Math.sin(a)*off,d=hyp(tx-u.x,ty-u.y)||1;
    rockets.push({x:u.x,y:u.y,dx:(tx-u.x)/d,dy:(ty-u.y)/d,left:d,by:u,trail:[]});
    flashes.push({x:u.x,y:u.y,t:0});u.aimAt=null;u.cool=RPG.reload;return;
  }
  if(u.cool>0)return;
  const jv=jeepOf(),cands=players.filter(p=>alive(p)&&p.seat!=='pass'&&hyp(p.x-u.x,p.y-u.y)<=RPG.range&&fireLine(u,p));
  if(!cands.length){u.cool=.5;return;}
  let t=cands.find(p=>p.inVeh&&p.inVeh===jv)||cands.reduce((a,b)=>hyp(a.x-u.x,a.y-u.y)<hyp(b.x-u.x,b.y-u.y)?a:b);
  const tx=t.inVeh?t.inVeh.x:t.x,ty=t.inVeh?t.inVeh.y:t.y;
  u.aimAt={x:tx,y:ty,until:simT+RPG.aim};u.ang=Math.atan2(ty-u.y,tx-u.x);u.aimT=simT+RPG.aim;u.revealT=simT+RPG.aim+3;
  if(u.vis)callout(u,'RPG!',C.bad);banner('RPG! Get moving!',1600);say(t.inVeh?crewOf(t.inVeh)[0]:t,'rpg');
}
function rocketTick(dt){
  for(let i=rockets.length-1;i>=0;i--){
    const r=rockets[i],step=Math.min(r.left,(r.speed||RPG.speed)*dt),nx=r.x+r.dx*step,ny=r.y+r.dy*step;
    r.trail.push({x:r.x,y:r.y,t:0});if(r.trail.length>14)r.trail.shift();
    let hitX=null,hitY=null;
    if(r.total?rocketHits(r.x,r.y,nx,ny,...(f=>[r.z0+(r.z1-r.z0)*f,r.z0+(r.z1-r.z0)*Math.min(1,f+step/r.total)])(1-r.left/r.total)):!los(r.x,r.y,nx,ny,true)){hitX=r.x;hitY=r.y;}   // slammed into a container, wall or tank (ours fly at a height: over what's lower; smoke doesn't stop any)
    const jv=jeepOf(),mine=r.by&&r.by.side==='P';
    if(hitX==null&&!mine&&jv&&jv.state!=='wreck'&&hyp(jv.x-nx,jv.y-ny)<16){hitX=nx;hitY=ny;}
    r.x=nx;r.y=ny;r.left-=step;
    if(hitX==null&&r.left<=0){hitX=r.x;hitY=r.y;}
    if(hitX!=null){rockets.splice(i,1);rpgBlast(hitX,hitY,r.by,r.spec);}
  }
}
function rpgBlast(x,y,by,spec=RPG){
  const jv=jeepOf();if(jv&&jv.state!=='wreck'&&hyp(jv.x-x,jv.y-y)<30)vehDestroy(jv,'rpg');
  booms.push({x,y,t:0});paintDecal({k:'scorch',x,y,r:Math.random()});tankBlast(x,y,by);
  for(const v of units){
    if(v.dead||v.seat==='driver')continue;const d=hyp(v.x-x,v.y-y);if(d>spec.blast||!los(x,y,v.x,v.y))continue;
    v.sup=Math.min(1.2,v.sup+0.9);if(!v.downed)damage(v,spec.dmg*(1-d/(spec.blast+4)),by);
  }
}

/* ---------- fuel tanks ---------- */
function tankHit(o,dmg,by){if(o.burst)return;o.hp=(o.hp??100)-dmg;if(o.hp<=0)tankExplode(o,by);}
// a blast near the tanks (from explode): close enough and they go up
function tankBlast(x,y,by){l1Blast(x,y,by);if(typeof labBlast==='function')labBlast(x,y,by);buildBlast(x,y);for(const o of objs)if(o.kind==='tank'&&!o.burst){const d=rectDist(x,y,o);if(d<25)tankExplode(o,by);else if(d<45)tankHit(o,80*(1-d/45),by);}}   // right next to it: it goes up
function tankExplode(o,by){
  if(o.burst)return;o.burst=true;o.hp=0;shake(clamp(1.4-hyp(o.x-camT.x,o.y-camT.z)/600,0,1.2));
  const cx=o.x+o.w/2,cy=o.y+o.h/2;
  for(let k=0;k<4;k++)booms.push({x:cx+(Math.random()-.5)*o.w,y:cy+(Math.random()-.5)*o.h,t:-k*0.06});
  paintDecal({k:'scorch',x:cx,y:cy,r:Math.random()});
  for(const v of units){
    if(v.dead||v.seat==='driver')continue;const d=hyp(v.x-cx,v.y-cy)-o.w/2;if(d>95||!los(cx,cy,v.x,v.y))continue;
    v.sup=Math.min(1.2,v.sup+1);if(!v.downed)damage(v,140*(1-Math.max(0,d)/100),by);if(v.side==='E')v.alerted=true;
  }
  const jv=jeepOf();if(jv&&jv.state!=='wreck'&&hyp(jv.x-cx,jv.y-cy)<85)vehDestroy(jv,'blast');
  for(const t of objs)if(t.kind==='tank'&&!t.burst&&t!==o&&rectDist(cx,cy,t)<70&&!tankQueue.some(q=>q.o===t))tankQueue.push({o:t,at:simT+0.45+Math.random()*0.3});   // chain reaction
  if(o.meshes)for(const m of o.meshes){if(m.userData.c0==null)m.userData.c0=m.material.color.getHex();m.material.color.setHex(0x1a1816);}
  tankFires.push({x:cx,y:cy,r:o.w/2,t0:simT,puffs:[],emit:0});
  banner('Fuel tank explosion!',1800);updateObjUI();
  if(enemies.some(e=>!e.dead))alertAll('Contact. Weapons free.',!!(by&&by.side==='P'));
}
// soldiers ordered to shoot a tank (u.focusTank, set by tapping it): one burst every 1.6–2.2 s
function shootTank(u){
  const o=u.focusTank;if(o.burst){u.focusTank=null;return false;}
  const cx=o.x+o.w/2,cy=o.y+o.h/2,f=sightOf(u,cx,cy);
  if(!f||hyp(cx-u.x,cy-u.y)>wRange(u))return false;
  u.ang=Math.atan2(cy-f.y,cx-f.x);u.aimT=simT;leanOut(u,{lean:f.x!==u.x||f.y!==u.y,fx:f.x,fy:f.y});
  for(let k=0;k<3;k++)tracers.push({x1:f.x,y1:f.y,x2:cx+(Math.random()-.5)*o.w*.6,y2:cy+(Math.random()-.5)*o.h*.6,t:0,col:'255,231,163'});
  flashes.push({x:f.x,y:f.y,t:0});
  if(!contact&&enemies.some(e=>!e.dead))alertAll('Contact. Weapons free.',true);
  tankHit(o,22+Math.random()*8,u);u.cool=1.6+Math.random()*.6;return true;
}


/* ---------- the objective tracker (top left; tap to see the whole list) ---------- */
const OBJ_LIST=['Get into the data center','Detain the scientists and bring them out','Lower the drawbridge with a scientist','Take the Headquarters'];
const OBJ_LIST_T=3400;   // how long the list stays open with the newly crossed-off objective (ms); the next messages wait for it
let objDone=0,objFlashT=0;   // objectives finished (0..4); the list pops open for a few seconds to cross the new one off
function objCompleted(n){
  if(n<=objDone)return;objDone=n;updateObjUI(true);
  const el=$('#obj');if(!el)return;el.classList.add('open');clearTimeout(objFlashT);objFlashT=setTimeout(()=>{el.classList.remove('open');el.setAttribute('aria-expanded','false');},OBJ_LIST_T);
}
function updateObjUI(flash){
  const el=$('#obj');if(!el)return;
  if(MAPID==='l4'&&typeof l4ObjUI==='function'&&L4){l4ObjUI(el);return;}   // (level4.js)
  if(MAPID==='l2'){el.querySelector('b').textContent='Level 2';el.querySelector('span').textContent=l2.exfil?'Get to the boat (the bay, east)':l2.powerDown?'Lights out':'Shut down the power station';el.querySelector('ol').innerHTML='';el.hidden=state!=='play';return;}   // (level2.js)
  if(MAPID==='l1'){el.querySelector('b').textContent='Level 1';el.querySelector('span').textContent=l1.exfil?'Back to the boat (the beach)':l1.relayDown?'Radio tower down':l1.yardClear?'Bring down the radio tower':'Knock out the radio tower (north)';el.querySelector('ol').innerHTML='';el.hidden=state!=='play';return;}
  if(typeof road!=='undefined'&&road&&road.talked){el.querySelector('b').textContent=obj>=9?'Next':'Next mission';el.querySelector('span').textContent=obj>=9?'Radio control at the HQ (coming next)':'Level 4 · The old radio tower: through the tunnel down the road (east)';   // (road.js)
    el.querySelector('ol').innerHTML=OBJ_LIST.map(t=>`<li class="done">${t}</li>`).join('');el.hidden=state!=='play';return;}
  const n=MAPID==='in'?detained().length:0,num=Math.min(objDone+1,4);
  const label=objDone===0?'Get into the data center':objDone===1?(n?`Bring them out the front doors (${n} detained)`:'Detain the scientists (top floor)'):objDone===2?'Take a scientist to the bio scanner':typeof hqs!=='undefined'&&hqs.won?'Headquarters taken':MAPID==='hq'?'Kill everything in the Headquarters':mon.out&&!mon.out.done?'Hold them off at the drawbridge':'Take the Headquarters: gather at the drawbridge';
  el.querySelector('b').textContent=`Objective ${num}/4`;el.querySelector('span').textContent=label;
  el.querySelector('ol').innerHTML=OBJ_LIST.map((t,i)=>`<li class="${i<objDone?'done':''}${flash&&i===objDone-1?' justdone':''}${i===objDone?' now':''}">${t}</li>`).join('');
  el.hidden=state!=='play';
}

/* ---------- drawn on the overlay ---------- */
// the last few of the area the squad is fighting for (Bryan couldn't find them): once at least half its men are down and 3 or
// fewer are left, each gets a pulsing ring, seen or not, and an arrow with the distance at the screen's edge when he's off it
function drawLastFoes(now){
  if(state!=='play')return;
  const ups=players.filter(p=>alive(p)&&!p.offMap);if(!ups.length)return;
  let all=null,bd=1e9;
  for(const n of[0,1,2,3]){if(finished[n]||!groups[n])continue;const z=AREAS[n].zone,cx=(z.x0+z.x1)/2,cy=(z.y0+z.y1)/2,d=Math.min(...ups.map(p=>hyp(p.x-cx,p.y-cy)));if(d<bd&&d<520){bd=d;all=groups[n];}}
  if(!all)return;const foes=all.filter(e=>!beaten(e));
  if(!foes.length||!(foes.length<=3&&foes.length*2<=all.length))return;
  const pulse=(Math.sin(now*5)+1)/2,[mx,my]=[cw/2,ch/2];
  for(const e of foes){
    toSBack=false;const[sx,sy]=toS(e.x,e.y,6);
    if(!toSBack&&sx>18&&sy>18&&sx<cw-18&&sy<ch-18){   // on screen: a pulsing ring (the label already says where a seen one is)
      gPath(e.x,e.y,12+pulse*3);ox.strokeStyle=`rgba(255,80,60,${(.6+pulse*.4).toFixed(2)})`;ox.lineWidth=2;ox.setLineDash(e.vis?[]:[4,3]);ox.stroke();ox.setLineDash([]);
      if(!e.vis){const[lx,ly]=toS(e.x,e.y,22);label('HOSTILE',lx,ly,'#ff6a50',9,700);}
      continue;
    }
    // off screen: which way he is, from the middle of the view (a step towards him stays in front of the camera)
    const d=hyp(e.x-camT.x,e.y-camT.z)||1,[ax,ay]=toS(camT.x,camT.z),[bx,by]=toS(camT.x+(e.x-camT.x)/d*40,camT.z+(e.y-camT.z)/d*40);
    let vx=bx-ax,vy=by-ay;const vl=hyp(vx,vy)||1;vx/=vl;vy/=vl;
    const m=30,k=Math.min((vx>0?cw-m-mx:mx-m)/Math.abs(vx||1e-6),(vy>0?ch-m-my:my-m)/Math.abs(vy||1e-6)),px=mx+vx*k,py=my+vy*k,a=Math.atan2(vy,vx);
    ox.save();ox.translate(px,py);ox.rotate(a);ox.beginPath();ox.moveTo(11,0);ox.lineTo(-7,-8);ox.lineTo(-3,0);ox.lineTo(-7,8);ox.closePath();
    ox.fillStyle=`rgba(255,80,60,${(.7+pulse*.3).toFixed(2)})`;ox.fill();ox.lineWidth=1.5;ox.strokeStyle='rgba(0,0,0,.6)';ox.stroke();ox.restore();
    label(`${Math.round(hyp(e.x-camT.x,e.y-camT.z)/10)} m`,px-vx*20,py-vy*20,'#ff8a70',9,700);
  }
}
function drawMission(rdt,now){
  drawGunMark(now);
  if(MAPID==='out'){drawLastFoes(now);drawTower(now);}drawL1(now);drawL2(now);if(typeof drawL4==='function')drawL4(now);drawMonsters(now);drawHQ(now);drawGather(now);drawActs(now);drawOffice(now);   // (the last three: interior.js, office.js)
  const pulse=(Math.sin(now*9)+1)/2,slow=(Math.sin(now*3)+1)/2;
  // objective markers: the tanks while they're the target, the panel once it works
  const mark=(x,y,r,text,col)=>{gPath(x,y,r+slow*4);ox.strokeStyle=col;ox.lineWidth=2;ox.setLineDash([5,5]);ox.lineDashOffset=-now*10;ox.stroke();ox.setLineDash([]);const[lx,ly]=below(x,y+r,6);label(text,lx,ly,col,9,700);};
  if(obj===2)for(const o of objs)if(o.kind==='tank'&&!o.burst)mark(o.x+o.w/2,o.y+o.h/2,o.w/2+6,'DESTROY','#ffcf4a');
  if(obj===4)mark(PANEL.x,PANEL.y,14,'BIO SCANNER','#5fe08e');
  // charges: planting progress, then a countdown on the charge itself
  for(const u of players)if(u.plant&&!u.path.length&&alive(u)){gPath(u.x,u.y,14,-Math.PI/2,-Math.PI/2+u.plant.prog/CHARGE.plant*TAU);ox.strokeStyle='#ffcf4a';ox.lineWidth=2.4;ox.stroke();}
  for(const c of charges){const left=Math.max(0,c.at-simT),[sx,sy]=toS(c.x,c.y,4);ox.fillStyle=pulse>.5?'#ff3b2a':'#7a1510';ox.beginPath();ox.arc(sx,sy,4,0,TAU);ox.fill();label(left.toFixed(1),sx,sy-12,'#ff6a50',10,700);gPath(c.x,c.y,100);ox.strokeStyle='rgba(255,70,50,.35)';ox.setLineDash([4,6]);ox.lineWidth=1.2;ox.stroke();ox.setLineDash([]);}
  // RPG gunners taking aim: a red reticle where they're aiming (always shown, so you can react)
  for(const e of enemies){
    if(e.dead||!e.aimAt||!e.rpg)continue;
    const a=e.aimAt;gPath(a.x,a.y,RPG.blast);ox.fillStyle=`rgba(255,40,30,${(.08+pulse*.12).toFixed(3)})`;ox.fill();
    ox.strokeStyle=`rgba(255,70,50,${(.6+pulse*.4).toFixed(2)})`;ox.lineWidth=2;ox.setLineDash([6,5]);ox.stroke();ox.setLineDash([]);
    const[rx,ry]=toS(a.x,a.y);label('RPG',rx,ry,'#ff5040',11,700);
    if(e.vis){ox.strokeStyle='rgba(255,60,40,.55)';ox.lineWidth=1.2;ox.setLineDash([3,4]);ox.beginPath();ox.moveTo(...toS(e.x,e.y,14));ox.lineTo(...toS(a.x,a.y,2));ox.stroke();ox.setLineDash([]);}
  }
  for(const r of rockets){
    for(const t of r.trail){t.t+=rdt;const[sx,sy]=toS(t.x,t.y,10);ox.fillStyle=`rgba(170,170,170,${Math.max(0,.35-t.t*.4).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,2+t.t*6,0,TAU);ox.fill();}
    const[hx,hy]=toS(r.x,r.y,10);ox.globalCompositeOperation='lighter';
    const gr=ox.createRadialGradient(hx,hy,0,hx,hy,12);gr.addColorStop(0,'rgba(255,250,220,1)');gr.addColorStop(.35,'rgba(255,170,60,.85)');gr.addColorStop(1,'rgba(255,80,20,0)');
    ox.fillStyle=gr;ox.beginPath();ox.arc(hx,hy,12,0,TAU);ox.fill();ox.globalCompositeOperation='source-over';
  }
  for(const o of objs)if(o.kind==='tank'&&!o.burst&&o.hp<100){const[bx,by]=toS(o.x+o.w/2,o.y+o.h/2,36);bar(bx-14,by,28,o.hp/100,C.bad);}
  // burning tanks: smoke and flames. Bryan saw these turn the whole screen orange-red and lag near the
  // back of the map: a fire behind or under the camera made its blobs huge. Now a fire that's behind the camera or well off
  // screen is skipped, and their size is capped.
  for(const f of tankFires){
    const age=simT-f.t0;if(age>45)continue;
    toSBack=false;const[ax,ay]=toS(f.x,f.y),[bx,by]=toS(f.x+10,f.y);
    if(toSBack||ax<-150||ay<-150||ax>cw+150||ay>ch+150)continue;
    const k=Math.min(7,hyp(bx-ax,by-ay)/10);
    f.emit-=rdt;if(f.emit<=0){f.emit=.08;f.puffs.push({x:f.x+(Math.random()-.5)*f.r,y:f.y+(Math.random()-.5)*f.r,t:0,life:2.5+Math.random()});}
    for(let i=f.puffs.length-1;i>=0;i--){const p=f.puffs[i];p.t+=rdt;if(p.t>=p.life){f.puffs.splice(i,1);continue;}toSBack=false;const q=p.t/p.life,[sx,sy]=toS(p.x,p.y,30+p.t*22);if(toSBack)continue;ox.fillStyle=`rgba(90,86,82,${(.45*(1-q)).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,k*(5+q*14),0,TAU);ox.fill();}
    if(age<30){ox.globalCompositeOperation='lighter';
      for(let i=0;i<9;i++){toSBack=false;const fl=Math.random(),[fx,fy]=toS(f.x+(Math.random()-.5)*f.r*1.4,f.y+(Math.random()-.5)*f.r*1.4,10+fl*24),r=k*(4+fl*7);if(toSBack)continue;
        const gr=ox.createRadialGradient(fx,fy,0,fx,fy,r);gr.addColorStop(0,'rgba(255,240,190,.9)');gr.addColorStop(.45,'rgba(255,140,40,.6)');gr.addColorStop(1,'rgba(200,40,10,0)');ox.fillStyle=gr;ox.beginPath();ox.arc(fx,fy,r,0,TAU);ox.fill();}
      ox.globalCompositeOperation='source-over';}
  }
}
