"use strict";
/* The mission after the warehouse (Bryan): 2 take the bridge, 3 destroy the fuel tanks, 4 sabotage the data center
   and lower the drawbridge, 5 take the Headquarters (to come). Each objective's defenders spawn when it becomes the
   current one (so a fight at one doesn't alert the next); a finished objective gets a medical and a supply box (hq.js)
   and the game saves. Also: demolition charges (one per soldier, restocked at supply boxes) for the fuel tanks and the
   server core, the enemy RPG gunner and his rockets, fuel tanks that chain-explode, the drawbridge and its panel, the
   objective tracker, and their overlay drawing. */
const OBJECTIVES=['Take the warehouse','Take the bridge','Destroy the fuel tanks','Sabotage the data center','Lower the drawbridge','Take the Headquarters'];
// indexes into OBJECTIVES: 0 warehouse, 1 bridge, 2 fuel tanks, 3 data center, 4 drawbridge (still objective 4 for the player), 5 HQ
const RPG={aim:1.3,reload:8,speed:170,spread:[18,42],range:400,blast:40,dmg:85};
const CHARGE={plant:3,fuse:8,away:130,coreAway:80};
let rockets=[],tankFires=[],tankQueue=[],charges=[],obj=0,groups={},finished={},panelGo=null,bridgeDown=0,pendingSpawns=[];
let mission={name:'yard',t0:0};
function resetMission(){
  rockets=[];tankFires=[];tankQueue=[];charges=[];obj=0;objDone=0;groups={};finished={};panelGo=null;mission={name:'yard',t0:0};pendingSpawns=[];
  secure={t:0,state:null,said:false,left:-1};lastNoiseT=-99;spotBannerT=-99;
  HQ_ZONES.length=0;
  for(const o of objs)if(o.kind==='tank'){o.hp=100;o.burst=false;if(o.meshes)for(const m of o.meshes)if(m.userData.c0!=null)m.material.color.setHex(m.userData.c0);}
  CORE.done=false;if(CORE.mesh)CORE.mesh.material.emissive.setHex(0x0a5a7a);
  setBridge(0);if(PANEL.button)PANEL.button.material.emissive.setHex(0);
  updateObjUI();
}
/* ---------- objectives ---------- */
// spawn helpers: a rifleman, an MG gunner on a tripod gun (never moves), a sentry inside a structure
function hostile(id,x,y,extra){const u=mk('E','E',id,extra.name||'Hostile',x,y,extra.ang??Math.PI/2);Object.assign(u,{jumpy:true},extra);makeSoldier(u);return u;}
function mgGunner(id,x,y){
  const u=hostile(id,x,y,{name:'Gunner',gunner:true,post:true});
  const mg=new T.Group(),dm=new T.MeshStandardMaterial({color:0x1b1e1b,roughness:.7,metalness:.45});
  const barrel=new T.Mesh(new T.BoxGeometry(14,1.4,1.4),dm);barrel.position.set(9,9.5,0);mg.add(barrel);
  for(const a of[0,2.1,4.2]){const leg=new T.Mesh(new T.CylinderGeometry(.35,.35,9,4),dm);leg.position.set(8+Math.cos(a)*2,4.5,Math.sin(a)*2);leg.rotation.z=Math.cos(a)*.3;leg.rotation.x=Math.sin(a)*.3;mg.add(leg);}
  u.m.pose.add(mg);return u;
}
// Each objective's defenders: [x,y,make] for each post. They take their posts when the objective starts, but never in front
// of the squad (Bryan: no troops turning up in the area you've just taken): a post a soldier could see (within 360, the
// range he'd spot a man at) or that's within 100 of one waits (pendingSpawns) until it isn't; after SPAWN_WAIT s the man
// turns up out of sight nearby instead and walks to his post.
function groupSpecs(n){
  const g=[];
  if(n===1){   // the bridge: an MG nest at its north end, a sentry in the pillbox, riflemen behind sandbags; calm, not on edge
    g.push([476,20,()=>mgGunner('E20',476,20)],[556,14,()=>hostile('E21',556,14,{name:'Sentry',post:true,elev:14}),true]);   // true: inside the pillbox, he never walks in
    for(const[i,[x,y]]of[[422,30],[614,38],[372,12]].entries())g.push([x,y,()=>hostile('E'+(22+i),x,y,{zone:BR_ZONE})]);
    for(const q of g){const make0=q[2];q[2]=()=>{const u=make0();u.jumpy=false;return u;};}
  }else if(n===2){   // the container yard: men posted in its aisles and a two-man patrol walking them; then the depot's guards and its RPG gunner
    // behind the first row of containers, looking every which way; none in sight of the rest spot at the bridge's south end
    for(const[i,[x,y]]of[[437,-136],[450,-150],[600,-110],[345,-140],[560,-105],[620,-120],[440,-250],[550,-240],[340,-230]].entries())g.push([x,y,()=>hostile('E'+(60+i),x,y,{zone:YARD2_ZONE,ang:Math.random()*TAU})]);
    g.push([345,-235,()=>hostile('E70',345,-235,{name:'Patrol',zone:YARD2_ZONE,route:[{x:660,y:-235},{x:345,y:-235}],ri:0,waitT:0})],[515,-220,()=>hostile('E71',515,-220,{name:'Patrol',zone:YARD2_ZONE,route:[{x:515,y:-290},{x:515,y:-220}],ri:0,waitT:0})]);
    for(const[i,[x,y]]of[[730,-110],[880,-130],[955,-235],[836,-216]].entries())g.push([x,y,()=>hostile('E'+(33+i),x,y,{zone:DEP_ZONE})]);
    g.push([742,-150,()=>{const r=hostile('E37',742,-150,{name:'RPG',zone:DEP_ZONE,rpg:true,cool:1});
      const tube=new T.Mesh(new T.CylinderGeometry(1,1,12,8),new T.MeshStandardMaterial({color:0x3b4a2e,roughness:.8}));tube.rotation.z=Math.PI/2;tube.position.set(1,15,-2.5);r.m.pose.add(tube);return r;}]);
  }else if(n===3){   // the data center: MG nests behind the container wall, riflemen outside, more inside
    for(const[i,p]of DC_NESTS.entries())g.push([p.x,p.y,()=>mgGunner('E'+(40+i),p.x,p.y)]);
    for(const[i,[x,y]]of[[60,-412],[255,-412],[490,-412]].entries())g.push([x,y,()=>hostile('E'+(42+i),x,y,{zone:DC_OUT})]);
    for(const[i,[x,y]]of[[180,-466],[330,-466],[132,-575],[340,-540],[420,-577]].entries())g.push([x,y,()=>hostile('E'+(45+i),x,y,{zone:DC_IN})]);
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
    if(!u)continue;
    groups[s.n].push(u);pendingSpawns.splice(i--,1);any=true;
  }
  if(any)enemies=units.filter(u=>u.side==='E');
}
function groupDone(n){return !!groups[n]&&groups[n].every(e=>e.dead)&&!pendingSpawns.some(s=>s.n===n);}
function groupLeft(n){return (groups[n]||[]).filter(e=>!e.dead).length+pendingSpawns.filter(s=>s.n===n).length;}

/* ---------- taking a location (Bryan): the whole place, then a quiet spell ---------- */
// The warehouse, the bridge and the fuel depot are only secured once their defenders are all down (the depot's tanks gone
// too), a soldier is inside the area and nothing has fired or blown up for QUIET_T s. A ring at the top fills meanwhile, and
// the area is marked on the ground (drawSecure). extra: spots that count as inside too (the warehouse's doorways and windows,
// so a man fighting from the door needn't walk in).
const QUIET_T=5;
const LOCS={
  0:{zone:{x0:176,x1:444,y0:266,y1:554},name:'the warehouse',done:()=>enemies.every(e=>e.dead),left:()=>enemies.filter(e=>!e.dead).length,
    extra:[{x0:285,x1:325,y0:240,y1:276},{x0:260,x1:360,y0:548,y1:578},{x0:150,x1:182,y0:395,y1:455},{x0:438,x1:470,y0:380,y1:420},{x0:438,x1:470,y0:450,y1:500}]},
  1:{zone:{x0:330,x1:660,y0:-40,y1:100},name:'the bridge\'s north end',done:()=>groupDone(1),left:()=>groupLeft(1)},   // its north end and the north half of the bridge
  2:{zone:DEP_ZONE,name:'the fuel depot',done:()=>groupDone(2)&&objs.every(o=>o.kind!=='tank'||o.burst)&&!tankQueue.length,left:()=>groupLeft(2)},
};
let secure={t:0,state:null,said:false,left:-1},lastNoiseT=-99;
function inZone(p,z){return p.x>=z.x0&&p.x<=z.x1&&p.y>=z.y0&&p.y<=z.y1;}
function inLoc(p,L){return inZone(p,L.zone)||!!L.extra&&L.extra.some(z=>inZone(p,z));}
function tanksGone(){return objs.every(o=>o.kind!=='tank'||o.burst);}
// on the objective pill: how many hostiles are left once it's down to the last few (or the tanks are gone), or that it's being taken
function locNote(){
  if(!LOCS[obj]||objDone>obj||state!=='play')return '';
  if(secure.state==='hold')return ' · securing';
  if(secure.state==='move')return ' · move in';
  const n=secure.left;return n>0&&(n<=3||(obj===2&&tanksGone()))?` · ${n} left`:'';
}
// every tick while location n is the objective; true once it's taken
function secureTick(n,dt){
  const L=LOCS[n];if(!L)return false;
  const left=L.left();if(left!==secure.left){secure.left=left;updateObjUI();}
  const st=!L.done()?null:players.some(p=>alive(p)&&inLoc(p,L))?'hold':'move';
  if(st!==secure.state){secure.state=st;updateObjUI();}
  if(st!=='hold'){
    secure.t=0;
    if(st==='move'&&!secure.said){secure.said=true;banner(`Area clear. Move a soldier into the green area to take ${L.name}.`,3500);}
    return false;
  }
  secure.t=Math.min(secure.t+dt,simT-lastNoiseT);   // the quiet spell restarts with every shot or blast
  if(secure.t<QUIET_T)return false;
  secure={t:0,state:null,said:false,left:-1};updateObjUI();return true;
}
const OBJ_INTRO={1:'Objective 2: take the bridge. The tunnel in the far west (out of sight) and the broken rail bridge in the east are other ways over.',
  2:'Objective 3: destroy the fuel tanks. Plant a charge (on a soldier\'s card) or shoot them from a safe distance.',
  3:'Objective 4: get inside the data center and blow the server core. Three ways in: the front, the west door, the east door.',
  4:'Now lower the drawbridge: send a soldier to the control panel.'};
function startObjective(n,quiet){
  obj=n;if(n<=3&&!groups[n])spawnGroup(n);
  updateObjUI();setStatus();hud();
  if(quiet||!OBJ_INTRO[n])return;
  banner(OBJ_INTRO[n],5000);   // no camera fly-over (Bryan: the map jumping elsewhere was disorienting)
}
// a finished objective is a checkpoint and a rest (Bryan): "Location secured", heal/resupply boxes, a save; the next one's defenders
// take their posts a few seconds later, unaware
// (Bryan: no box tutorial after the first; the next objective's message waits until the crossed-off list has closed)
function finishObjective(zones,stage,next,big='Location secured'){
  if(finished[next-1])return;finished[next-1]=true;objCompleted(next);   // once only, while the next one waits to start; crossed off the list
  contact=false;bigText(big,'clear');say(players.find(alive),'objective');
  if(zones)addZones(zones);saveGame(stage);setStatus();
  setTimeout(()=>{if(state==='play'&&obj===next-1)startObjective(next);},OBJ_LIST_T+200);
}
// every tick once the warehouse is taken (from hqTick)
function missionTick(dt){
  chargeTick(dt);
  if(pendingSpawns.length&&(spawnTick-=dt)<=0){spawnTick=.5;spawnPending();}   // twice a second is plenty
  for(const e of enemies){   // patrols walk their route and back, pausing at each end, until they're alerted
    if(e.dead||e.alerted||!e.route||e.path.length)continue;
    if(!e.waitT){e.waitT=simT+2.5;continue;}
    if(simT<e.waitT)continue;
    e.ri=(e.ri+1)%e.route.length;const p=e.route[e.ri],path=findPath(e.x,e.y,p.x,p.y,FOOT);if(path)e.path=path;e.waitT=0;
  }
  if(obj===1&&!finished[1]&&secureTick(1,dt))finishObjective([{k:'med',x:376,y:150,w:50,h:40},{k:'sup',x:526,y:150,w:50,h:40}],'br',2);
  else if(obj===2&&!finished[2]&&secureTick(2,dt))finishObjective([{k:'med',x:716,y:-44,w:56,h:40},{k:'sup',x:780,y:-44,w:56,h:40}],'dep',3,'Fuel depot destroyed');
  else if(obj===3&&CORE.done){obj=4;bigText('Server core destroyed','clear');banner(OBJ_INTRO[4],4500);updateObjUI();setStatus();}
  if(panelGo){
    const u=panelGo;
    if(!alive(u)||(!u.path.length&&hyp(u.x-PANEL.x,u.y-PANEL.y)>26))panelGo=null;
    else if(hyp(u.x-PANEL.x,u.y-PANEL.y)<=22){
      panelGo=null;
      if(obj<4){banner('Turn on the power to access drawbridge controls',4000);callout(u,'No power',C.warn);if(PANEL.button)PANEL.button.material.emissive.setHex(0x991a10);}
      else if(obj===4){callout(u,'Lowering the bridge',C.good);if(PANEL.button)PANEL.button.material.emissive.setHex(0x1a9930);bridgeDown=simT;obj=5;
        bigText('Drawbridge down!','unlock');objCompleted(4);addZones([{k:'med',x:640,y:-520,w:56,h:44},{k:'sup',x:700,y:-520,w:56,h:44}]);saveGame('dc');updateObjUI();
        setTimeout(()=>{if(state==='play'&&obj===5){banner('Objective 5: take the Headquarters. That part comes next.',5000);endAt=performance.now()+600;}},OBJ_LIST_T+200);}
    }
  }
}
// rockets in flight, tanks waiting to go up in a chain reaction, the drawbridge coming down: these run every tick
function missionFx(dt){
  rocketTick(dt);
  for(let i=tankQueue.length-1;i>=0;i--)if(simT>=tankQueue[i].at){const o=tankQueue[i].o;tankQueue.splice(i,1);tankExplode(o,null);}
  if(bridgeDown&&BRIDGE.lower<1)setBridge(Math.min(1,(simT-bridgeDown)/3));
}
function setBridge(k){BRIDGE.lower=k;if(BRIDGE.grp)BRIDGE.grp.rotation.x=-.12-(Math.PI/2-.12)*(k<1?k*k*(3-2*k):1);if(!k)bridgeDown=0;}
function tapPanel(){
  const foot=sel.filter(u=>alive(u)&&!u.inVeh).sort((a,b)=>hyp(a.x-PANEL.x,a.y-PANEL.y)-hyp(b.x-PANEL.x,b.y-PANEL.y));
  if(!foot.length){banner('Select a soldier, then tap the control panel.',2000);return;}
  const u=foot[0],s=openSpot(PANEL.x,PANEL.y+14,players.filter(p=>p!==u&&!p.dead).map(destOf))||{x:PANEL.x,y:PANEL.y+14},p=findPath(u.x,u.y,s.x,s.y);
  if(p){u.path=p;u.lastOrder=simT;callout(u,'Checking the controls',C.good);panelGo=u;}else banner('No way to reach the panel from here.',2000);
}

/* ---------- demolition charges ---------- */
// tap the charge on a soldier's card, then a fuel tank or the server core: he walks up, plants it (CHARGE.plant s),
// runs clear by himself, and it goes off CHARGE.fuse s later. Quiet until it blows.
function chargeTargetAt(x,y){
  const t=objs.find(o=>o.kind==='tank'&&!o.burst&&rectDist(x,y,o)<26);if(t)return t;
  if(!CORE.done&&rectDist(x,y,CORE)<26)return CORE;return null;
}
function orderCharge(u,x,y){
  const t=chargeTargetAt(x,y);if(!t){banner(obj===2||obj===3?'Tap a fuel tank or the server core.':'Charges are for the fuel tanks and the server core.',2000);return false;}
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
      const away=t===CORE?CHARGE.coreAway:CHARGE.away,cx=t.x+t.w/2,cy=t.y+t.h/2;let best=null,bs=-1e9;
      for(const c of coverPts){const d=hyp(c.x-cx,c.y-cy);if(d<away||d>away+120)continue;const sc=(los(cx,cy,c.x,c.y)?0:2)-hyp(c.x-u.x,c.y-u.y)/80;if(sc>bs){bs=sc;best=c;}}
      const p=best&&findPath(u.x,u.y,best.x,best.y);if(p){u.path=p;u.lastOrder=simT;u.gaitForce='run';}
      for(const o of players)if(o!==u&&alive(o)&&!o.path.length&&hyp(o.x-cx,o.y-cy)<away)callout(o,'Too close!',C.bad);
    }
  }
  for(let i=charges.length-1;i>=0;i--){
    const c=charges[i];if(simT<c.at)continue;charges.splice(i,1);
    if(c.t===CORE){CORE.done=true;explode(c.x,c.y,c.by);if(CORE.mesh)CORE.mesh.material.emissive.setHex(0);for(let k=0;k<8;k++)sparks.push({x:CORE.x+Math.random()*CORE.w,y:CORE.y+Math.random()*CORE.h,t:0});tankFires.push({x:CORE.x+CORE.w/2,y:CORE.y+CORE.h/2,r:10,t0:simT,puffs:[],emit:0});}
    else{booms.push({x:c.x,y:c.y,t:0});tankExplode(c.t,c.by);}
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
  u.aimAt={x:tx,y:ty,until:simT+RPG.aim};u.ang=Math.atan2(ty-u.y,tx-u.x);u.aimT=simT+RPG.aim;
  if(u.vis)callout(u,'RPG!',C.bad);banner('RPG! Get moving!',1600);say(t.inVeh?crewOf(t.inVeh)[0]:t,'rpg');
}
function rocketTick(dt){
  for(let i=rockets.length-1;i>=0;i--){
    const r=rockets[i],step=Math.min(r.left,(r.speed||RPG.speed)*dt),nx=r.x+r.dx*step,ny=r.y+r.dy*step;
    r.trail.push({x:r.x,y:r.y,t:0});if(r.trail.length>14)r.trail.shift();
    let hitX=null,hitY=null;
    if(!los(r.x,r.y,nx,ny)){hitX=r.x;hitY=r.y;}   // slammed into a container, wall or tank
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
const OBJ_LIST=['Take the warehouse','Take the bridge','Destroy the fuel tanks','Sabotage the data center and lower the drawbridge','Take the Headquarters'];
const OBJ_LIST_T=3400;   // how long the list stays open with the newly crossed-off objective (ms); the next messages wait for it
let objDone=0,objFlashT=0;   // objectives finished (0..4); the list pops open for a few seconds to cross the new one off
function objCompleted(n){
  if(n<=objDone)return;objDone=n;updateObjUI(true);
  const el=$('#obj');if(!el)return;el.classList.add('open');clearTimeout(objFlashT);objFlashT=setTimeout(()=>{el.classList.remove('open');el.setAttribute('aria-expanded','false');},OBJ_LIST_T);
}
function updateObjUI(flash){
  const el=$('#obj');if(!el)return;
  const num=Math.min(objDone+1,5),label=objDone===3&&CORE.done?'Lower the drawbridge':objDone===2&&tanksGone()?'Clear the fuel depot':OBJ_LIST[num-1];
  el.querySelector('b').textContent=`Objective ${num}/5`;el.querySelector('span').textContent=label+(num===5?' (coming next)':locNote());
  el.querySelector('ol').innerHTML=OBJ_LIST.map((t,i)=>`<li class="${i<objDone?'done':''}${flash&&i===objDone-1?' justdone':''}${i===objDone?' now':''}">${t}</li>`).join('');
  el.hidden=state!=='play';
}

/* ---------- drawn on the overlay ---------- */
// the area to take, marked on the ground once its defenders are down (Bryan: new players wouldn't know to go in): a pulsing
// dashed green outline with MOVE IN while nobody's in it; solid and filling up, with a bar, while the quiet spell runs
function drawSecure(now){
  const st=secure.state,L=LOCS[obj];if(!st||!L||state!=='play')return;
  const z=L.zone,c=[[z.x0,z.y0],[z.x1,z.y0],[z.x1,z.y1],[z.x0,z.y1]].map(([x,y])=>toS(x,y,.4)),pulse=(Math.sin(now*4.5)+1)/2,k=clamp(secure.t/QUIET_T,0,1);
  ox.beginPath();ox.moveTo(...c[0]);for(const p of c)ox.lineTo(...p);ox.closePath();
  if(st==='move'){
    ox.fillStyle=`rgba(95,224,142,${(.05+pulse*.09).toFixed(3)})`;ox.fill();
    ox.setLineDash([12,8]);ox.lineDashOffset=-now*16;ox.strokeStyle=`rgba(95,224,142,${(.55+pulse*.45).toFixed(2)})`;ox.lineWidth=2.6;ox.stroke();ox.setLineDash([]);
  }else{ox.fillStyle=`rgba(95,224,142,${(.07+k*.17).toFixed(3)})`;ox.fill();ox.strokeStyle='rgba(95,224,142,.95)';ox.lineWidth=2.8;ox.stroke();}
  const[lx,ly]=toS((z.x0+z.x1)/2,(z.y0+z.y1)/2,.4);
  label(st==='move'?'MOVE IN':'SECURING',lx,ly,'#5fe08e',13,700);
  if(st==='hold')bar(lx-26,ly+11,52,k,'#5fe08e');
}
function drawMission(rdt,now){
  drawSecure(now);
  const pulse=(Math.sin(now*9)+1)/2,slow=(Math.sin(now*3)+1)/2;
  // objective markers: the tanks while they're the target, the server core, the panel once it works
  const mark=(x,y,r,text,col)=>{gPath(x,y,r+slow*4);ox.strokeStyle=col;ox.lineWidth=2;ox.setLineDash([5,5]);ox.lineDashOffset=-now*10;ox.stroke();ox.setLineDash([]);const[lx,ly]=below(x,y+r,6);label(text,lx,ly,col,9,700);};
  if(obj===2)for(const o of objs)if(o.kind==='tank'&&!o.burst)mark(o.x+o.w/2,o.y+o.h/2,o.w/2+6,'DESTROY','#ffcf4a');
  if(obj===3&&!CORE.done)mark(CORE.x+CORE.w/2,CORE.y+CORE.h/2,24,'SERVER CORE','#ffcf4a');
  if(obj===4)mark(PANEL.x,PANEL.y,14,'CONTROL PANEL','#5fe08e');
  // charges: planting progress, then a countdown on the charge itself
  for(const u of players)if(u.plant&&!u.path.length&&alive(u)){gPath(u.x,u.y,14,-Math.PI/2,-Math.PI/2+u.plant.prog/CHARGE.plant*TAU);ox.strokeStyle='#ffcf4a';ox.lineWidth=2.4;ox.stroke();}
  for(const c of charges){const left=Math.max(0,c.at-simT),[sx,sy]=toS(c.x,c.y,4);ox.fillStyle=pulse>.5?'#ff3b2a':'#7a1510';ox.beginPath();ox.arc(sx,sy,4,0,TAU);ox.fill();label(left.toFixed(1),sx,sy-12,'#ff6a50',10,700);gPath(c.x,c.y,c.t===CORE?58:100);ox.strokeStyle='rgba(255,70,50,.35)';ox.setLineDash([4,6]);ox.lineWidth=1.2;ox.stroke();ox.setLineDash([]);}
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
