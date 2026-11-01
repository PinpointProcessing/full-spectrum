"use strict";
/* The warehouse fight (objective 1) and its counterattack. When the warehouse is cleared: "All clear!" fades in and out,
   a 5 s "Incoming!" countdown takes the detection ring's place, then "Enemy inbound!" and five hostiles come south over
   the main bridge and push towards the squad. Clearing them ends the warehouse with its report; then the mission goes on
   (hq.js, mission.js). Also the opening dinghy landing. Timings run on game time, so pause and slow-mo stretch them. */
const COUNTER=[[466,40],[486,40],[466,70],[486,70],[476,100]],COUNTER_AT={x:476,y:260};   // where they come from, and where previews judge cover from while counting down
const CLEAR_T=2.6,COUNT_T=5;
let wave={phase:'fight1',t:0};   // phases: fight1 → clear → count → fight2 → done → hq (after the report; the rest of the mission)
function wavePhase(...ps){return ps.includes(wave.phase);}
function resetWaves(){
  wave={phase:'fight1',t:0};bigText(null);cdShown=-1;hq=null;camPan=null;VB={x0:0,z0:TOP,x1:W,z1:H};resetMission();
}
function goWave(ph){wave.phase=ph;wave.t=simT;setStatus();hud();}
function waveTick(dt){
  if(landing)landTick(dt);
  const el=simT-wave.t;
  if(wave.phase==='fight1'&&enemies.every(e=>e.dead)){goWave('clear');bigText('Location secured','clear');say(players.find(alive),'objective');}
  else if(wave.phase==='clear'&&el>=CLEAR_T)startHQ();   // Bryan: a checkpoint and a rest, no counterattack (spawnCounter is kept for later)
  else if(wave.phase==='count'&&el>=COUNT_T){bigText('Enemy inbound!','inbound');spawnCounter();goWave('fight2');}
  else if(wave.phase==='hq')hqTick(dt);
  else if(wave.phase==='fight2'&&enemies.every(e=>e.dead)){goWave('done');bigText('All clear!','clear');say(players.find(alive),'objective');endAt=performance.now()+CLEAR_T*1000;}
}
function spawnCounter(){
  COUNTER.forEach(([x,y],i)=>{
    const u=mk('E','E','E'+(6+i),'Hostile',x,y,Math.PI/2);
    Object.assign(u,{wave:2,alerted:true,aware:1,cool:0.8+Math.random(),moveCool:simT+0.2+i*0.4});makeSoldier(u);
  });
  enemies=units.filter(u=>u.side==='E');banner('Counterattack over the bridge!',2600);
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

function gunnerOf(){return enemies.find(e=>e.gunner&&!e.dead);}
// keep a jeep's machine gun pointing where its gunner aims (called every frame; no jeep in this version)
function aimTurret(){const j=wave.jeep,g=j&&j.owner==='P'?seatOf(j,'gunner'):null;if(!j||!g||g.dead||j.state==='wreck')return;j.m.tur.rotation.y=-g.ang-j.m.g.rotation.y;}

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
  if(text){void el.offsetWidth;el.className=cls;}   // restart the fade
}
let cdShown=-1;
function waveHud(){
  const cd=$('#countdown'),on=state==='play'&&wave.phase==='count';
  cd.hidden=!on;if(!on){cdShown=-1;return;}
  const left=Math.max(0,COUNT_T-(simT-wave.t)),n=Math.ceil(left);
  cd.querySelector('b').textContent=left.toFixed(2);   // counts down in hundredths
  if(n===cdShown)return;cdShown=n;
  cd.setAttribute('aria-label',`Incoming in ${n}`);
  cd.classList.remove('tick');void cd.offsetWidth;cd.classList.add('tick');   // pulse on every whole second
}
