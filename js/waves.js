"use strict";
/* Second wave. When the warehouse is cleared: "All clear!" fades in and out, a 5 s "Incoming!" countdown takes the
   detection ring's place, then "Enemy inbound!" flashes and a gun jeep comes down the road from the depot and smashes
   through the gate at the north end of the yard's east fence (it stays broken: later the squad drives out that way). Its gunner
   stays on the machine gun laying down cover fire while four hostiles dismount and push towards the squad.
   Clearing them ends the mission. Timings run on game time, so pause and slow-mo stretch them. */
// its route in (centre points): west along the road, through the gate, then turning south to park facing the yard
const JEEP={route:[{x:720,y:57},{x:600,y:57},{x:545,y:72},{x:508,y:108},{x:500,y:150}],w:24,l:46,speed:60};
JEEP.park=JEEP.route[JEEP.route.length-1];
const CLEAR_T=2.6,COUNT_T=5;
let wave={phase:'fight1',t:0};   // phases: fight1 → clear → count → drive → fight2 → done → hq (after the report)
function wavePhase(...ps){return ps.includes(wave.phase);}
function resetWaves(){
  if(wave.jeep){scene.remove(wave.jeep.m.g);if(wave.jeep.obj)removeObstacle(wave.jeep.obj,wave.jeep.gone);}
  if(jeepLight)jeepLight.intensity=0;
  wave={phase:'fight1',t:0};bigText(null);cdShown=-1;hq=null;camPan=null;lockArea();resetDepot();
}
function goWave(ph){wave.phase=ph;wave.t=simT;setStatus();hud();}
function waveTick(dt){
  if(landing)landTick(dt);
  const el=simT-wave.t;
  if(wave.phase==='fight1'&&enemies.every(e=>e.dead)){goWave('clear');bigText('All clear!','clear');}
  else if(wave.phase==='clear'&&el>=CLEAR_T)goWave('count');
  else if(wave.phase==='count'&&el>=COUNT_T){bigText('Enemy inbound!','inbound');spawnJeep();goWave('drive');}
  else if(wave.phase==='drive')driveJeep(dt);
  else if(wave.phase==='hq')hqTick(dt);
  else if(wave.phase==='hq2'){hqTick(dt);roadTick(dt);}
  else if(wave.phase==='depot'||wave.phase==='depotdone'){hqTick(dt);depotTick(dt);}
  else if(wave.phase==='fight2'&&enemies.every(e=>e.dead)){goWave('done');bigText('All clear!','clear');endAt=performance.now()+CLEAR_T*1000;}
}

/* ---------- the landing: the squad comes ashore by dinghy at the dock in the south-west corner ----------
   The boat motors in from off the map's south edge and pulls up at the quay beside the pier (LAND_T s, game time), the
   squad sitting in it; then they hop out onto the quay and move up to the containers. No orders until they're ashore. */
const LAND_T=4.5,LAND_SEATS=[[-3,-8],[3,-3],[-3,2],[3,7]];
let landing=null;
function startLanding(){
  landing={t:0};
  players.forEach((p,i)=>{p.start={x:p.x,y:p.y};p.inBoat=true;p.ang=-Math.PI/2;});
  landTick(0);
}
function landTick(dt){
  landing.t+=dt;const k=Math.min(1,landing.t/LAND_T),e=1-Math.pow(1-k,3);   // eases in to the quay
  const bx=DOCK.moor.x,by=DOCK.moor.y+170*(1-e);
  dinghy.position.set(bx,.2,by);
  players.forEach((p,i)=>{p.x=bx+LAND_SEATS[i][0];p.y=by+LAND_SEATS[i][1];p.elev=1.2;p.path=[];});
  if(k<1)return;
  // ashore: each steps up onto the quay, then walks to his spot by the containers
  landing=null;
  players.forEach((p,i)=>{
    p.inBoat=false;p.elev=0;const q={x:p.x,y:DOCK.quay-10},path=findPath(q.x,q.y,p.start.x,p.start.y);
    p.path=[q,...(path||[p.start])];p.lastOrder=simT;
  });
  banner('Ashore. Move up: the warehouse is straight ahead.',3000);hud();
}

/* ---------- the jeep ---------- */
function gunnerOf(){return enemies.find(e=>e.gunner);}
function spawnJeep(){
  const r=JEEP.route,j={x:r[0].x,y:r[0].y,heading:Math.PI,leg:1,m:makeJeep()};wave.jeep=j;
  const g=mk('E','E','E5','Gunner',j.x+8,j.y,Math.PI);
  Object.assign(g,{gunner:true,elev:9,alerted:true,aware:1,cool:99});
  makeSoldier(g);enemies=units.filter(u=>u.side==='E');
  placeJeep();
}
function placeJeep(){
  const j=wave.jeep,c=Math.cos(j.heading),s=Math.sin(j.heading);
  j.m.g.position.set(j.x,0,j.y);j.m.g.rotation.y=Math.PI/2-j.heading;
  jeepLight.intensity=3.2;jeepLight.position.set(j.x+c*22,10,j.y+s*22);jeepLight.target.position.set(j.x+c*140,0,j.y+s*140);
  const g=gunnerOf();if(g&&!g.dead){g.x=j.x-c*8;g.y=j.y-s*8;}
}
function driveJeep(dt){
  const j=wave.jeep,r=JEEP.route;let step=JEEP.speed*dt;
  while(step>0&&j.leg<r.length){
    const p=r[j.leg],dx=p.x-j.x,dy=p.y-j.y,d=hyp(dx,dy);
    if(d>.01){const want=Math.atan2(dy,dx);j.heading+=wrapA(want-j.heading)*Math.min(1,dt*6);}
    if(d<=step){j.x=p.x;j.y=p.y;step-=d;j.leg++;}else{j.x+=dx/d*step;j.y+=dy/d*step;step=0;}
  }
  if(!area.smashed&&j.x-23<depotGate.x+depotGate.w)smashGate();   // the bumper hits the gate
  if(j.leg>=r.length)j.heading=Math.PI/2;   // parked facing south, into the yard
  placeJeep();
  if(j.leg<r.length)return;
  // parked: it becomes half cover, the gunner opens up and the squad dismounts
  j.obj=jeepRect(j);
  j.gone=addObstacle(j.obj);
  const g=gunnerOf();if(g)g.cool=0.6;
  [[-22,-10],[22,-10],[-22,14],[22,14]].forEach(([dx,dy],i)=>{
    const u=mk('E','E','E'+(6+i),'Hostile',JEEP.park.x+dx,JEEP.park.y+dy,Math.PI/2);
    Object.assign(u,{wave:2,alerted:true,aware:1,cool:0.8+Math.random(),moveCool:simT+0.4+i*0.5});
    makeSoldier(u);
  });
  enemies=units.filter(u=>u.side==='E');
  goWave('fight2');
}
// keep the machine gun pointing where the gunner aims (called every frame)
function aimTurret(){
  const j=wave.jeep,g=j&&j.owner==='P'?seatOf(j,'gunner'):gunnerOf();if(!j||!g||g.dead||j.state==='wreck')return;
  j.m.tur.rotation.y=-g.ang-j.m.g.rotation.y;
}

/* ---------- wave-two hostiles push ---------- */
// Hop from cover to cover towards the nearest soldier; hold where they have a covered shot within ~24 m.
function assaultThink(e){
  if(simT<e.moveCool)return;
  const ps=players.filter(alive);if(!ps.length)return;
  let tg=ps[0];for(const p of ps)if(hyp(p.x-e.x,p.y-e.y)<hyp(tg.x-e.x,tg.y-e.y))tg=p;
  const d0=hyp(tg.x-e.x,tg.y-e.y),th=ps.map(p=>({x:p.x,y:p.y}));
  const shot=ps.some(p=>hyp(p.x-e.x,p.y-e.y)<=380&&fireLine(e,p));
  if(shot&&d0<240&&protStats(e,th).prot===th.length){e.moveCool=simT+2.5;return;}
  const others=enemies.filter(o=>o!==e&&!o.dead).map(destOf);
  let best=null,bs=-1e9;
  for(const c of coverPts){
    const d=hyp(c.x-e.x,c.y-e.y);if(d>130||d<15)continue;
    const dt=hyp(c.x-tg.x,c.y-tg.y);if(dt<70)continue;   // don't charge right into them
    if(others.some(o=>hyp(o.x-c.x,o.y-c.y)<14))continue;
    const st=protStats(c,th),sc=st.prot/th.length*2+st.see*0.6+(d0-dt)/40-d/120;
    if(sc>bs){bs=sc;best=c;}
  }
  const path=best&&findPath(e.x,e.y,best.x,best.y);
  if(path){e.path=path;e.moveCool=simT+3+Math.random()*2;if(e.vis)callout(e,'Moving!',C.bad);}
  else e.moveCool=simT+1.5;
}

/* ---------- on-screen ---------- */
function bigText(text,cls){
  const el=$('#bigText');el.className='';el.textContent=text||'';
  if(text){void el.offsetWidth;el.className=cls;sfxSting(cls);}   // restart the fade
}
let cdShown=-1;
function waveHud(){
  const tankCd=road&&road.phase==='count',cd=$('#countdown'),on=state==='play'&&(wave.phase==='count'||tankCd);   // also before the tank
  cd.hidden=!on;if(!on){cdShown=-1;return;}
  const left=Math.max(0,tankCd?TANK_COUNT-(simT-road.t0):COUNT_T-(simT-wave.t)),n=Math.ceil(left);
  cd.querySelector('b').textContent=left.toFixed(2);   // counts down in hundredths
  if(n===cdShown)return;if(cdShown>=0)sfxSting('tick');cdShown=n;
  cd.setAttribute('aria-label',`Incoming in ${n}`);
  cd.classList.remove('tick');void cd.offsetWidth;cd.classList.add('tick');   // pulse on every whole second
}
