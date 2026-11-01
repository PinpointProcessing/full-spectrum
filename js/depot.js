"use strict";
/* The checkpoint across the depot's main road: its garrison, the RPG gunner, the fuel tanks, and taking it as the second HQ.
   The garrison spawns when the depot opens (openArea in hq.js). Nine hostiles, unaware but jumpy: a sentry in the guard
   tower (heavy cover) and a lookout on the watchtower (half cover) who never leave their posts, two at the boom gate,
   two at the sandbags, the RPG gunner beside the guard tower, and a two-man patrol walking the main road south.
   The RPG takes RPG.aim s to aim (red reticle on the ground where it's aimed, "RPG!"), then fires a slow, visible rocket
   that lands RPG.spread off target: time to move. A direct hit destroys the jeep. Fuel tanks blow up when shot enough,
   or hit by a grenade, rocket or another tank's blast, and burn afterwards. Clearing the garrison completes the mission:
   report, then the checkpoint becomes a second HQ with its own medical and supply points. */
const RPG={aim:1.3,reload:8,speed:170,spread:[18,42],range:400,blast:40,dmg:85};   // blast: damage radius (smaller than a grenade's)
const CK_ZONE={x0:930,x1:1290,y0:-462,y1:-212};   // where the garrison shifts between cover once alerted
let rockets=[],tankFires=[],tankQueue=[],garrison=[];
let mission={name:'yard',t0:0};

function startDepot(){
  wave.phase='depot';mission={name:'checkpoint',t0:simT};downCount=0;
  for(const p of players)p.stats={kills:0,streak:0,best:0,lastKill:-99,revives:0,items:0,downs:0};
  const S2=Math.PI/2;   // facing south, down the road the squad comes up
  const spec=[
    ['Sentry',1000,-307,S2,{post:true,elev:14}],['Lookout',1099,-323,S2,{post:true,elev:41}],
    ['Hostile',1036,-284,S2,{}],['Hostile',1064,-282,S2,{}],
    ['Hostile',995,-258,S2+0.3,{}],['Hostile',1046,-244,S2,{}],
    ['RPG',965,-290,S2-0.2,{rpg:true}],   // drops his launcher when he dies (dropRPG)   // beside the guard tower, covering the road
    // down the main road past where the curving road joins it, and back
    ['Patrol',1040,-192,S2,{route:[{x:1040,y:18},{x:1040,y:-192}]}],['Patrol',1062,-176,S2,{route:[{x:1062,y:34},{x:1062,y:-176}]}],
  ];
  garrison=spec.map(([name,x,y,ang,extra],i)=>{
    const u=mk('E','E','E'+(20+i),name,x,y,ang);
    Object.assign(u,{zone:CK_ZONE,jumpy:true,ri:0,waitT:0},extra);
    if(u.rpg)u.cool=1;
    makeSoldier(u);
    if(u.rpg){const tube=u.tube=new T.Mesh(new T.CylinderGeometry(1,1,12,8),new T.MeshStandardMaterial({color:0x3b4a2e,roughness:.8}));tube.rotation.z=Math.PI/2;tube.position.set(1,15,-2.5);u.m.pose.add(tube);}
    return u;
  });
  enemies=units.filter(u=>u.side==='E');
  setStatus();hud();
}
function resetDepot(){
  rockets=[];tankFires=[];tankQueue=[];garrison=[];nests=[];panelGo=null;mission={name:'yard',t0:0};
  resetRoad();if(PANEL.button)PANEL.button.material.emissive.setHex(0);
  for(const o of objs)if(o.kind==='tank'){o.hp=100;o.burst=false;if(o.meshes)for(const m of o.meshes)if(m.userData.c0!=null)m.material.color.setHex(m.userData.c0);}
  for(let i=HQ_ZONES.length-1;i>=0;i--)if(HQ_ZONES[i].hq2)HQ_ZONES.splice(i,1);
}

/* ---------- each tick ---------- */
// rockets in flight and tanks waiting to go up in a chain reaction: these keep going even as the battle ends
function depotFx(dt){
  rocketTick(dt);
  for(let i=tankQueue.length-1;i>=0;i--)if(simT>=tankQueue[i].at){const o=tankQueue[i].o;tankQueue.splice(i,1);tankExplode(o,null);}
}
function depotTick(dt){
  // the patrol walks the road and back, pausing at each end
  for(const e of garrison){
    if(e.dead||e.alerted||!e.route||e.path.length)continue;
    if(!e.waitT){e.waitT=simT+2.5;continue;}
    if(simT<e.waitT)continue;
    e.ri=(e.ri+1)%e.route.length;const p=e.route[e.ri],path=findPath(e.x,e.y,p.x,p.y);if(path)e.path=path;e.waitT=0;
  }
  if(RPG_PICKUP)pickupTick();
  // garrison down: "All clear!", then TRUCK_COUNT s later two gun trucks come up the road from the south (Bryan); both stopped: mission complete
  if(wave.phase==='depot'&&!road&&garrison.length&&garrison.every(e=>e.dead)){road={phase:'count',t0:simT,dur:TRUCK_COUNT};contact=false;bigText('All clear!','clear');setStatus();}
  if(wave.phase==='depot'&&road){
    if(road.phase==='count'&&simT-road.t0>=road.dur)spawnTrucks();
    truckTick(dt);
    if(road.phase==='trucks'&&trucks.every(t=>t.dead)){road.phase='done';wave.phase='depotdone';contact=false;bigText('All clear!','clear');endAt=performance.now()+CLEAR_T*1000;setStatus();}
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
  u.aimAt={x:tx,y:ty,until:simT+RPG.aim};u.ang=Math.atan2(ty-u.y,tx-u.x);u.aimT=simT+RPG.aim;
  if(u.vis)callout(u,'RPG!',C.bad);banner('RPG! Get moving!',1600);
}
function rocketTick(dt){
  for(let i=rockets.length-1;i>=0;i--){
    const r=rockets[i],step=Math.min(r.left,(r.speed||RPG.speed)*dt),nx=r.x+r.dx*step,ny=r.y+r.dy*step;
    r.trail.push({x:r.x,y:r.y,t:0});if(r.trail.length>14)r.trail.shift();
    let hitX=null,hitY=null;
    if(!los(r.x,r.y,nx,ny)){hitX=r.x;hitY=r.y;}   // slammed into a container, wall or tank
    const jv=jeepOf(),mine=r.by&&r.by.side==='P';
    if(hitX==null&&!mine&&jv&&jv.state!=='wreck'&&hyp(jv.x-nx,jv.y-ny)<16){hitX=nx;hitY=ny;}
    if(hitX==null&&mine&&(trucks.some(t=>!t.dead&&hyp(t.x-nx,t.y-ny)<16)||(tank&&!tank.dead&&hyp(tank.x-nx,tank.y-ny)<22))){hitX=nx;hitY=ny;}   // our rocket slams into a gun truck or the tank
    r.x=nx;r.y=ny;r.left-=step;
    if(hitX==null&&r.left<=0){hitX=r.x;hitY=r.y;}
    if(hitX!=null){rockets.splice(i,1);rpgBlast(hitX,hitY,r.by,r.spec);}
  }
}
function rpgBlast(x,y,by,spec=RPG){   // spec: RPG, or the tank's shell (TANK)
  const jv=jeepOf();if(jv&&jv.state!=='wreck'&&hyp(jv.x-x,jv.y-y)<30)vehDestroy(jv,'rpg');
  if(by&&by.side==='P'){for(const t of trucks)if(!t.dead&&hyp(t.x-x,t.y-y)<30)truckDestroy(t,by);if(tank&&!tank.dead&&hyp(tank.x-x,tank.y-y)<34)tankArmorHit(by);}
  booms.push({x,y,t:0});paintDecal({k:'scorch',x,y,r:Math.random()});tankBlast(x,y,by);
  for(const v of units){
    if(v.dead||v.seat==='driver')continue;const d=hyp(v.x-x,v.y-y);if(d>spec.blast||!los(x,y,v.x,v.y))continue;
    v.sup=Math.min(1.2,v.sup+0.9);if(!v.downed)damage(v,spec.dmg*(1-d/(spec.blast+4)),by);
  }
}

/* ---------- fuel tanks ---------- */
function tankHit(o,dmg,by){if(o.burst)return;o.hp=(o.hp??100)-dmg;if(o.hp<=0)tankExplode(o,by);}
// a blast near the tanks (from explode): close enough and they go up
function tankBlast(x,y,by){for(const o of objs)if(o.kind==='tank'&&!o.burst){const d=rectDist(x,y,o);if(d<25)tankExplode(o,by);else if(d<45)tankHit(o,80*(1-d/45),by);}}   // right next to it: it goes up
function tankExplode(o,by){
  if(o.burst)return;o.burst=true;o.hp=0;
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
  banner('Fuel tank explosion!',1800);
  if(enemies.some(e=>!e.dead))alertAll('Contact. Weapons free.',!!(by&&by.side==='P'));
}
// soldiers ordered to shoot a tank (u.focusTank, set by tapping it): one burst every 1.6–2.2 s
function shootTank(u){
  const o=u.focusTank;if(o.burst){u.focusTank=null;return false;}
  const cx=o.x+o.w/2,cy=o.y+o.h/2,f=sightOf(u,cx,cy);
  if(!f||hyp(cx-u.x,cy-u.y)>380)return false;
  u.ang=Math.atan2(cy-f.y,cx-f.x);u.aimT=simT;leanOut(u,{lean:f.x!==u.x||f.y!==u.y,fx:f.x,fy:f.y});
  for(let k=0;k<3;k++)tracers.push({x1:f.x,y1:f.y,x2:cx+(Math.random()-.5)*o.w*.6,y2:cy+(Math.random()-.5)*o.h*.6,t:0,col:'255,231,163'});
  flashes.push({x:f.x,y:f.y,t:0});
  if(!contact&&enemies.some(e=>!e.dead))alertAll('Contact. Weapons free.',true);
  tankHit(o,22+Math.random()*8,u);u.cool=1.6+Math.random()*.6;return true;
}

/* ---------- the second HQ ---------- */
function startHQ2(){
  $('#aar').hidden=true;
  state='play';endAt=0;contact=false;paused=true;wave.phase='hq2';hq.arrow=false;hq.noArrow=true;
  for(const p of players)if(alive(p)){p.sup=0;p.supT=null;p.focus=null;p.focusTank=null;}
  addHQ2Zones();
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:960,z:-402,zoom:2.2},t:0,dur:1.4};
  $('#hqPop .eyebrow').textContent='Second temporary HQ';$('#hqPop h1').textContent='Checkpoint secured';
  $('#hqPop p').textContent='The checkpoint is now a temporary HQ. Heal and resupply here before you push on. Hold enough of these and you can establish a permanent HQ.';
  $('#hqPop ul').innerHTML='<li><b>Medical (red +)</b> and <b>Supply</b> points are set up west of the road, behind the checkpoint.</li><li>North of the checkpoint the road forks: left to the office building (machine-gun nests out front), right to the drawbridge.</li>';
  $('#hqPop').hidden=false;setStatus();hud();
  saveGame('hq2');spawnNests();
}
function addHQ2Zones(){HQ_ZONES.push({k:'med',x:874,y:-450,w:72,h:64,col:'255,74,64',label:'MEDICAL',hq2:true},{k:'sup',x:952,y:-450,w:70,h:64,col:'232,186,84',label:'SUPPLY',hq2:true});}

/* ---------- drawn on the overlay ---------- */
function drawDepot(rdt,now){
  drawRoad(rdt,now);
  // the boom gate swings up once the checkpoint's garrison is down, and is down again after a restart
  const up=wavePhase('depotdone','hq2')||(wave.phase==='depot'&&!!road);
  for(const d of decor)if(d.arm){const want=up?1.35:0,k=d.dir==='x'?'z':'x';d.arm.rotation[k]+=(want-d.arm.rotation[k])*Math.min(1,rdt*3);}
  const pulse=(Math.sin(now*9)+1)/2;
  // RPG gunners taking aim: a red reticle where they're aiming (always shown, so you can react) and their aim line if seen
  for(const e of garrison){
    if(e.dead||!e.aimAt)continue;
    const a=e.aimAt;gPath(a.x,a.y,RPG.blast);ox.fillStyle=`rgba(255,40,30,${(.08+pulse*.12).toFixed(3)})`;ox.fill();
    ox.strokeStyle=`rgba(255,70,50,${(.6+pulse*.4).toFixed(2)})`;ox.lineWidth=2;ox.setLineDash([6,5]);ox.stroke();ox.setLineDash([]);
    const[rx,ry]=toS(a.x,a.y);label('RPG',rx,ry,'#ff5040',11,700);
    if(e.vis){ox.strokeStyle='rgba(255,60,40,.55)';ox.lineWidth=1.2;ox.setLineDash([3,4]);ox.beginPath();ox.moveTo(...toS(e.x,e.y,14));ox.lineTo(...toS(a.x,a.y,2));ox.stroke();ox.setLineDash([]);}
  }
  // rockets: a bright head and a smoke trail
  for(const r of rockets){
    for(const t of r.trail){t.t+=rdt;const[sx,sy]=toS(t.x,t.y,10);ox.fillStyle=`rgba(170,170,170,${Math.max(0,.35-t.t*.4).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,2+t.t*6,0,TAU);ox.fill();}
    const[hx,hy]=toS(r.x,r.y,10);ox.globalCompositeOperation='lighter';
    const gr=ox.createRadialGradient(hx,hy,0,hx,hy,12);gr.addColorStop(0,'rgba(255,250,220,1)');gr.addColorStop(.35,'rgba(255,170,60,.85)');gr.addColorStop(1,'rgba(255,80,20,0)');
    ox.fillStyle=gr;ox.beginPath();ox.arc(hx,hy,12,0,TAU);ox.fill();ox.globalCompositeOperation='source-over';
  }
  // damaged tanks show how close they are to going up; burst ones burn and smoke
  for(const o of objs)if(o.kind==='tank'&&!o.burst&&o.hp<100){const[bx,by]=toS(o.x+o.w/2,o.y+o.h/2,36);bar(bx-14,by,28,o.hp/100,C.bad);}
  for(const f of tankFires){
    const age=simT-f.t0;if(age>45)continue;
    const[ax,ay]=toS(f.x,f.y),[bx,by]=toS(f.x+10,f.y),k=hyp(bx-ax,by-ay)/10;
    f.emit-=rdt;if(f.emit<=0){f.emit=.08;f.puffs.push({x:f.x+(Math.random()-.5)*f.r,y:f.y+(Math.random()-.5)*f.r,t:0,life:2.5+Math.random()});}
    for(let i=f.puffs.length-1;i>=0;i--){const p=f.puffs[i];p.t+=rdt;if(p.t>=p.life){f.puffs.splice(i,1);continue;}const q=p.t/p.life,[sx,sy]=toS(p.x,p.y,30+p.t*22);ox.fillStyle=`rgba(90,86,82,${(.45*(1-q)).toFixed(3)})`;ox.beginPath();ox.arc(sx,sy,k*(5+q*14),0,TAU);ox.fill();}
    if(age<30){ox.globalCompositeOperation='lighter';
      for(let i=0;i<9;i++){const fl=Math.random(),[fx,fy]=toS(f.x+(Math.random()-.5)*f.r*1.4,f.y+(Math.random()-.5)*f.r*1.4,10+fl*24),r=k*(4+fl*7);
        const gr=ox.createRadialGradient(fx,fy,0,fx,fy,r);gr.addColorStop(0,'rgba(255,240,190,.9)');gr.addColorStop(.45,'rgba(255,140,40,.6)');gr.addColorStop(1,'rgba(200,40,10,0)');ox.fillStyle=gr;ox.beginPath();ox.arc(fx,fy,r,0,TAU);ox.fill();}
      ox.globalCompositeOperation='source-over';}
  }
}

/* ---------- the captured RPG, the gun trucks and the tank (Bryan's design) ----------
   The garrison's RPG gunner drops his launcher where he falls (dropRPG): it floats there, spinning and glowing cyan, from
   that moment. The first soldier on foot to reach it carries it (u.launcher = rockets on him, at most LAUNCHER.ammo = 2;
   the supply point tops them up, hq.js) and a live tutorial starts at quarter speed: tap RPG on his card (left of the
   grenade), then tap a target. Once the checkpoint is secured (second HQ, popup closed) and someone has the RPG, two gun
   trucks drive up the main road from the south. Both destroyed: a 10 s countdown, then a tank rolls down the left branch
   from the north-west. It takes 3 rocket hits; its machine gunner on top can be shot like the truck gunners, but its crew
   only dies with the tank. Its main gun aims at a soldier for TANK.aim s (red reticle) and fires a fast shell.
   Tank down: "All clear!" and the game saves. */
const RPG_PICKUP=false;   // Bryan: no player RPG (or tank) just yet; the trucks come straight after the checkpoint instead. true brings it all back
const LAUNCHER={ammo:2,range:400,spread:9};
const TRUCKS=[{x:1040,y0:150,y1:-40},{x:1062,y0:215,y1:20}],TRUCK_SPEED=60,TANK_COUNT=10,TRUCK_COUNT=10;
const TANK={route:[{x:846,y:-832},{x:930,y:-695},{x:978,y:-618}],speed:30,hits:3,w:30,l:54,aim:2,reload:6,speed2:320,spread:[10,34],blast:44,dmg:80,range:460};
let pickup=null,trucks=[],tank=null,tut=null,tutDone=false,road=null;
function resetRoad(){
  if(pickup&&pickup.m)scene.remove(pickup.m);pickup=null;
  for(const t of trucks){scene.remove(t.m.g);if(t.obj)removeObstacle(t.obj,t.gone);}
  if(tank){scene.remove(tank.m.g);if(tank.obj)removeObstacle(tank.obj,tank.gone);}
  trucks=[];tank=null;road=null;tutDone=false;setTut(null);
}
// the RPG gunner is dead: his launcher drops where he fell (moved clear if that spot is blocked, e.g. by the jeep)
function dropRPG(x,y){
  if(pickup||players.some(p=>p.launcher!=null))return;
  const sp=isFree(x,y,6)?{x,y}:(openSpot(x,y,[])||{x,y});
  const g=new T.Group(),glow=new T.MeshBasicMaterial({color:0x4df3ff,toneMapped:false}),body=new T.MeshStandardMaterial({color:0x2d4a3a,emissive:0x1aa0b0,emissiveIntensity:.9,roughness:.5});
  const tube=new T.Mesh(new T.CylinderGeometry(1.3,1.3,15,10),body);tube.rotation.z=Math.PI/2;g.add(tube);
  const head=new T.Mesh(new T.ConeGeometry(2.6,6,10),glow);head.rotation.z=-Math.PI/2;head.position.x=10;g.add(head);
  const grip=new T.Mesh(new T.BoxGeometry(1.4,3.4,1.4),body);grip.position.set(-1,-2.6,0);g.add(grip);
  g.position.set(sp.x,10,sp.y);scene.add(g);pickup={m:g,x:sp.x,y:sp.y,r:14,taken:false};
}
// every tick in the depot and at the second HQ: the dropped launcher, and who picks it up
function pickupTick(){
  if(!pickup&&!players.some(p=>p.launcher!=null)){const g=garrison.find(e=>e.rpg);if(g&&g.dead){if(g.tube){g.m.pose.remove(g.tube);g.tube=null;}dropRPG(g.x,g.y);}}
  if(!pickup||pickup.taken)return;
  const u=players.find(p=>alive(p)&&!p.inVeh&&hyp(p.x-pickup.x,p.y-pickup.y)<pickup.r);
  if(!u)return;
  pickup.taken=true;scene.remove(pickup.m);u.launcher=LAUNCHER.ammo;callout(u,'Got the RPG!',C.good);
  select([u]);preview=null;mode=null;setTut({step:1,u});hud();
}
function spawnTrucks(){
  road={phase:'trucks',t0:simT};contact=true;
  trucks=TRUCKS.map((d,i)=>{
    const t={x:d.x,y:d.y0,y1:d.y1,heading:-Math.PI/2,moving:true,dead:false,m:makeJeep()};
    const g=mk('E','E','E'+(40+i),'Gunner',t.x,t.y+8,-Math.PI/2);
    Object.assign(g,{gunner:true,elev:9,alerted:true,aware:1,cool:99});makeSoldier(g);t.gunner=g;
    placeTruck(t);return t;
  });
  enemies=units.filter(u=>u.side==='E');
  bigText('Enemy inbound!','inbound');banner(RPG_PICKUP?'Two gun trucks coming up the road from the south!':'Two gun trucks coming up the road from the south! Take out the gunners.',3000);setStatus();
  const c=players.find(p=>alive(p)&&p.launcher!=null);if(c&&!tutDone&&!tut)setTut({step:1,u:c});
}
function truckTick(dt){
  for(const t of trucks){
    if(t.dead)continue;
    if(t.moving){t.y=Math.max(t.y1,t.y-TRUCK_SPEED*dt);placeTruck(t);
      if(t.y<=t.y1){t.moving=false;t.obj=jeepRect(t);t.gone=addObstacle(t.obj);t.gunner.cool=0.6;}}   // parked: half cover, the gunner opens up
    if(t.gunner.dead){t.dead=true;t.moving=false;}   // gunner shot: the truck's out of the fight
  }
}
function placeTruck(t){
  t.m.g.position.set(t.x,0,t.y);t.m.g.rotation.y=Math.PI/2-t.heading;
  const g=t.gunner;if(g&&!g.dead){g.x=t.x;g.y=t.y+8;}
}
function truckDestroy(t,by){
  if(t.dead)return;t.dead=true;t.moving=false;
  if(t.gunner&&!t.gunner.dead)damage(t.gunner,999,by);
  if(t.gunner)t.gunner.elev=0;
  booms.push({x:t.x,y:t.y,t:0},{x:t.x+6,y:t.y-8,t:-0.08});paintDecal({k:'scorch',x:t.x,y:t.y,r:Math.random()});
  wreckLook(t);tankFires.push({x:t.x,y:t.y,r:12,t0:simT,puffs:[],emit:0});
  if(!t.obj){t.obj=jeepRect(t);t.gone=addObstacle(t.obj);}
  callout(t.gunner||players[0],'Truck destroyed!',C.good);
}
/* ---------- the tank ---------- */
function spawnTank(){
  road.phase='tank';contact=true;
  const r=TANK.route,t={x:r[0].x,y:r[0].y,leg:1,heading:Math.atan2(r[1].y-r[0].y,r[1].x-r[0].x),moving:true,dead:false,hits:0,cool:3,aimAt:null,m:makeTank()};
  const g=mk('E','E','E45','Gunner',t.x,t.y,Math.PI/2);
  Object.assign(g,{gunner:true,elev:19,alerted:true,aware:1,cool:99});makeSoldier(g);t.gunner=g;
  tank=t;placeTank();enemies=units.filter(u=>u.side==='E');
  bigText('Tank inbound!','inbound');banner('Tank from the north-west! 3 RPG hits kill it. Restock rockets at the supply point.',4200);setStatus();hud();
}
function placeTank(){
  const t=tank;t.m.g.position.set(t.x,0,t.y);t.m.g.rotation.y=Math.PI/2-t.heading;
  const g=t.gunner;if(g&&!g.dead){g.x=t.x-Math.cos(t.heading)*4;g.y=t.y-Math.sin(t.heading)*4;}
}
function tankArmorHit(by){
  const t=tank;if(t.dead)return;t.hits++;sparks.push({x:t.x,y:t.y,t:0});sfxClang(t.x,t.y);
  if(t.hits<TANK.hits){callout(t.gunner&&!t.gunner.dead?t.gunner:(by||players[0]),`Hit! ${TANK.hits-t.hits} more`,C.warn);return;}
  t.dead=true;t.moving=false;t.aimAt=null;
  if(t.gunner&&!t.gunner.dead)damage(t.gunner,999,by);if(t.gunner)t.gunner.elev=0;
  if(by&&by.side==='P')creditKill(by);   // the crew inside
  for(let k=0;k<5;k++)booms.push({x:t.x+(Math.random()-.5)*24,y:t.y+(Math.random()-.5)*30,t:-k*0.07,size:k?1:1.8});
  paintDecal({k:'scorch',x:t.x,y:t.y,r:Math.random()});wreckLook(t);t.m.tur.rotation.z=.25;
  tankFires.push({x:t.x,y:t.y,r:16,t0:simT,puffs:[],emit:0});
  if(!t.obj){t.obj=armorRect(t);t.gone=addObstacle(t.obj);}
  callout(by||players[0],'Tank destroyed!',C.good);
}
function armorRect(t){const ew=Math.abs(Math.cos(t.heading))>Math.abs(Math.sin(t.heading)),w=ew?TANK.l:TANK.w,h=ew?TANK.w:TANK.l;return{kind:'armor',x:t.x-w/2,y:t.y-h/2,w,h,full:true};}
function tankTick(dt){
  const t=tank;if(t.dead)return;
  if(t.moving){
    const r=TANK.route,p=r[t.leg],dx=p.x-t.x,dy=p.y-t.y,d=hyp(dx,dy),st=TANK.speed*dt;
    t.heading+=wrapA(Math.atan2(dy,dx)-t.heading)*Math.min(1,dt*3);
    if(d<=st){t.x=p.x;t.y=p.y;t.leg++;}else{t.x+=dx/d*st;t.y+=dy/d*st;}
    if(t.leg>=r.length){t.moving=false;t.obj=armorRect(t);t.gone=addObstacle(t.obj);if(t.gunner&&!t.gunner.dead)t.gunner.cool=0.8;}   // in position: hard cover, it blocks sight
    placeTank();
  }
  // the main gun: pick a soldier (the jeep if it's crewed) it can see, aim, fire a fast shell
  if(t.aimAt){
    t.m.tur.rotation.y=Math.atan2(t.aimAt.x-t.x,t.aimAt.y-t.y)-t.m.g.rotation.y;
    if(simT<t.aimAt.until)return;
    const a=Math.random()*TAU,off=TANK.spread[0]+Math.random()*(TANK.spread[1]-TANK.spread[0]);
    const tx=t.aimAt.x+Math.cos(a)*off,ty=t.aimAt.y+Math.sin(a)*off,ang=Math.atan2(ty-t.y,tx-t.x),mx=t.x+Math.cos(ang)*30,my=t.y+Math.sin(ang)*30,d=hyp(tx-mx,ty-my)||1;
    rockets.push({x:mx,y:my,dx:(tx-mx)/d,dy:(ty-my)/d,left:d,by:null,trail:[],speed:TANK.speed2,spec:TANK});
    flashes.push({x:mx,y:my,t:0});booms.push({x:mx,y:my,t:.35});t.aimAt=null;t.cool=TANK.reload;return;
  }
  t.cool-=dt;if(t.cool>0)return;
  const jv=jeepOf(),c=players.filter(p=>alive(p)&&p.seat!=='pass'&&hyp(p.x-t.x,p.y-t.y)<=TANK.range&&los(t.x,t.y,p.x,p.y));
  if(!c.length){t.cool=.5;return;}
  const tg=c.find(p=>p.inVeh&&p.inVeh===jv)||c.reduce((a,b)=>hyp(a.x-t.x,a.y-t.y)<hyp(b.x-t.x,b.y-t.y)?a:b);
  t.aimAt={x:tg.inVeh?tg.inVeh.x:tg.x,y:tg.inVeh?tg.inVeh.y:tg.y,until:simT+TANK.aim};banner('Tank is aiming! Move!',1500);
}
// from waveTick while the second HQ is up
function roadTick(dt){
  pickupTick();
  if(!road&&$('#hqPop').hidden&&players.some(p=>p.launcher!=null&&!p.dead))spawnTrucks();   // checkpoint secured and someone has the RPG
  truckTick(dt);
  if(!road)return;
  if(road.phase==='trucks'&&trucks.every(t=>t.dead)){road.phase='count';road.t0=simT;contact=false;bigText('All clear!','clear');setStatus();}
  else if(road.phase==='count'&&simT-road.t0>=TANK_COUNT)spawnTank();
  else if(road.phase==='tank'){
    tankTick(dt);
    if(tank.dead){road.phase='done';contact=false;bigText('All clear!','clear');banner('The road is clear.',2600);setStatus();
      setTimeout(()=>{if(state==='play'&&wave.phase==='hq2')saveGame('hq2');},CLEAR_T*1000);}
  }
  if(tut&&tut.step<3&&!alive(tut.u))setTut(null);
}
// fire the RPG at (tx,ty): straight away, if he's in range and has a line (from a lean if need be)
function fireRPG(u,tx,ty){
  if(!u.launcher||!alive(u)||u.inVeh)return false;
  const tr=trucks.find(t=>!t.dead&&hyp(t.x-tx,t.y-ty)<30)||(tank&&!tank.dead&&hyp(tank.x-tx,tank.y-ty)<36?tank:null);
  if(tr){tx=tr.x;ty=tr.y;if(tr.moving&&trucks.includes(tr)){const lead=hyp(tx-u.x,ty-u.y)/RPG.speed;ty=Math.max(tr.y1,ty-TRUCK_SPEED*lead);}}   // leads a moving truck
  if(hyp(tx-u.x,ty-u.y)>LAUNCHER.range){banner('Out of range. Get closer.',1600);return false;}
  const f=sightOf(u,tx,ty)||(tr===tank&&tank?sightFrom(u.x,u.y,tx-Math.sign(tx-u.x)*16,ty-Math.sign(ty-u.y)*16):null);   // the tank blocks sight to its own centre
  if(!f){banner(`${u.name} has no clear shot from there.`,1600);return false;}
  const a=Math.random()*TAU,off=Math.random()*LAUNCHER.spread,ax=tx+Math.cos(a)*off,ay=ty+Math.sin(a)*off,d=hyp(ax-f.x,ay-f.y)||1;
  rockets.push({x:f.x,y:f.y,dx:(ax-f.x)/d,dy:(ay-f.y)/d,left:d,by:u,trail:[]});
  flashes.push({x:f.x,y:f.y,t:0});u.ang=Math.atan2(ay-f.y,ax-f.x);u.aimT=simT;leanOut(u,{lean:f.x!==u.x||f.y!==u.y,fx:f.x,fy:f.y});
  u.launcher--;u.lastOrder=simT;callout(u,'RPG out!',C.warn);
  if(!contact&&enemies.some(e=>!e.dead))alertAll('Contact. Weapons free.',true);
  if(tut&&tut.u===u){setTut({step:3,u});tutDone=true;}
  return true;
}
// the live tutorial box (steps: 1 tap RPG on the card, 2 tap a target, 3 done); the game runs at quarter speed during 1-2
function setTut(t){
  tut=t;const el=$('#tut');if(!el)return;clearTimeout(setTut.timer);
  if(!t){el.hidden=true;return;}
  const n=t.u.name;
  el.innerHTML=t.step===1?`<small>Tutorial · RPG</small><b>${n}</b> has the RPG${trucks.length?' and gun trucks are coming up the road':''}! Tap <b>RPG</b> on his card, left of the grenade.`
    :t.step===2?`<small>Tutorial · RPG</small>The cyan circle is his range. Now <b>tap a target</b> to fire: a vehicle, or hostiles in cover. He leads a moving truck for you.`
    :`<small>Tutorial · RPG</small>Rocket away! ${t.u.launcher} left. He carries 2 at most: restock at the <b>supply</b> point, even mid-fight.`;
  el.hidden=false;
  if(t.step===3)setTut.timer=setTimeout(()=>{if(tut===t)setTut(null);},5000);
  hud();
}
function tutSlow(){return !!tut&&tut.step<3;}
// every frame: the floating launcher spins and bobs with a glow on the ground; turrets follow their gunners; the tank's aim
function drawRoad(rdt,now){
  const pulse=(Math.sin(now*4)+1)/2;
  if(pickup&&!pickup.taken){
    pickup.m.rotation.y+=rdt*2.2;pickup.m.position.y=10+Math.sin(now*2.4)*2;
    gPath(pickup.x,pickup.y,pickup.r+pulse*5);
    ox.fillStyle=`rgba(77,243,255,${(.1+pulse*.12).toFixed(3)})`;ox.fill();ox.strokeStyle=`rgba(77,243,255,${(.5+pulse*.5).toFixed(2)})`;ox.lineWidth=2;ox.stroke();
    const[lx,ly]=below(pickup.x,pickup.y+pickup.r,6);label('RPG · PICK UP',lx,ly,'#4df3ff',10,700);
  }
  for(const t of trucks){const g=t.gunner;if(!t.dead&&g&&!g.dead)t.m.tur.rotation.y=-g.ang-t.m.g.rotation.y;}
  if(tank){
    const t=tank;if(t.gunner&&!t.gunner.dead){const ga=t.gunner.ang;t.m.mg.rotation.y=Math.atan2(Math.cos(ga),Math.sin(ga))-t.m.g.rotation.y-t.m.tur.rotation.y;}
    if(!t.dead){const[bx,by]=toS(t.x,t.y,34);bar(bx-16,by,32,1-t.hits/TANK.hits,C.bad);label(`TANK · ${TANK.hits-t.hits} HITS`,bx,by-9,'#ff8a70',9,700);}
    if(t.aimAt){const a=t.aimAt;gPath(a.x,a.y,TANK.blast);ox.fillStyle=`rgba(255,40,30,${(.1+pulse*.14).toFixed(3)})`;ox.fill();
      ox.strokeStyle=`rgba(255,70,50,${(.6+pulse*.4).toFixed(2)})`;ox.lineWidth=2;ox.setLineDash([6,5]);ox.stroke();ox.setLineDash([]);
      const[rx,ry]=toS(a.x,a.y);label('TANK',rx,ry,'#ff5040',11,700);}
  }
}

/* ---------- north of the fork (Bryan): the office's machine-gun nests and the drawbridge panel ----------
   Two gunners behind sandbags in front of the office, facing the forecourt. They open fire as soon as a soldier comes
   within NEST_WAKE with a line of sight (or on anything that alerts them first). The building itself is solid for now.
   The drawbridge's control panel: tap it with a soldier selected and he walks over; it tells you the power is off. */
const NEST_WAKE=320;
let nests=[],panelGo=null;
function spawnNests(){
  if(nests.length)return;
  nests=NESTS.map((n,i)=>{
    const u=mk('E','E','E'+(50+i),'Gunner',n.x,n.y,Math.PI/2);Object.assign(u,{gunner:true,post:true,jumpy:true,nest:true});makeSoldier(u);
    const mg=new T.Group(),dm=new T.MeshStandardMaterial({color:0x1b1e1b,roughness:.7,metalness:.45});   // the gun on its tripod, in front of him
    const barrel=new T.Mesh(new T.BoxGeometry(14,1.4,1.4),dm);barrel.position.set(9,9.5,0);mg.add(barrel);
    for(const a of[0,2.1,4.2]){const leg=new T.Mesh(new T.CylinderGeometry(.35,.35,9,4),dm);leg.position.set(8+Math.cos(a)*2,4.5,Math.sin(a)*2);leg.rotation.z=Math.cos(a)*.3;leg.rotation.x=Math.sin(a)*.3;mg.add(leg);}
    u.m.pose.add(mg);return u;
  });
  GUARDS.forEach((g,i)=>{const u=mk('E','E','E'+(52+i),'Hostile',g.x,g.y,Math.PI/2);Object.assign(u,{zone:OFFICE_ZONE,jumpy:true,nest:true});makeSoldier(u);nests.push(u);});   // riflemen in cover round the entrance
  enemies=units.filter(u=>u.side==='E');
}
// every tick at the second HQ
function northTick(){
  if(nests.some(e=>!e.dead&&!e.alerted)&&players.some(p=>alive(p)&&nests.some(e=>!e.dead&&hyp(p.x-e.x,p.y-e.y)<NEST_WAKE&&los(e.x,e.y,p.x,p.y)))){
    alertAll('The office entrance opens up!');for(const e of nests)if(!e.dead){e.alerted=true;e.cool=Math.min(e.cool,.4);}
  }
  if(nests.length&&!nests.done&&nests.every(e=>e.dead)){nests.done=true;contact=false;bigText('All clear!','clear');banner('Entrance cleared. The inside comes next (its own map).',4000);setStatus();}
  if(panelGo){
    const u=panelGo;
    if(!alive(u)||(!u.path.length&&hyp(u.x-PANEL.x,u.y-PANEL.y)>26))panelGo=null;
    else if(hyp(u.x-PANEL.x,u.y-PANEL.y)<=22){panelGo=null;banner('Turn on the power to access drawbridge controls',4000);callout(u,'No power',C.warn);if(PANEL.button)PANEL.button.material.emissive.setHex(0x991a10);}
  }
}
function tapPanel(){
  const foot=sel.filter(u=>alive(u)&&!u.inVeh).sort((a,b)=>hyp(a.x-PANEL.x,a.y-PANEL.y)-hyp(b.x-PANEL.x,b.y-PANEL.y));
  if(!foot.length){banner('Select a soldier, then tap the control panel.',2000);return;}
  const u=foot[0],s=openSpot(PANEL.x,PANEL.y+14,players.filter(p=>p!==u&&!p.dead).map(destOf))||{x:PANEL.x,y:PANEL.y+14},p=findPath(u.x,u.y,s.x,s.y);
  if(p){u.path=p;u.lastOrder=simT;callout(u,'Checking the controls',C.good);panelGo=u;}else banner('No way to reach the panel from here.',2000);
}
