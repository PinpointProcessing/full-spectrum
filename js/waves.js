"use strict";
/* Second wave. When the warehouse is cleared: "All clear!" fades in and out, a 5 s "Incoming!" countdown takes the
   detection ring's place, then "Enemy inbound!" flashes and a gun jeep drives in through the north gate. Its gunner
   stays on the machine gun laying down cover fire while four hostiles dismount and push towards the squad.
   Clearing them ends the mission. Timings run on game time, so pause and slow-mo stretch them. */
const JEEP={x:475,y0:-80,y1:190,w:24,l:46,speed:60};   // drives south through the gate and parks here (centre)
const CLEAR_T=2.6,COUNT_T=5;
let wave={phase:'fight1',t:0};   // phases: fight1 → clear → count → drive → fight2 → done → hq (after the report)
function wavePhase(...ps){return ps.includes(wave.phase);}
function resetWaves(){
  if(wave.jeep){scene.remove(wave.jeep.m.g);if(wave.jeep.obj)removeObstacle(wave.jeep.obj,wave.jeep.gone);}
  if(jeepLight)jeepLight.intensity=0;
  wave={phase:'fight1',t:0};bigText(null);cdShown=-1;hq=null;camPan=null;
}
function goWave(ph){wave.phase=ph;wave.t=simT;setStatus();hud();}
function waveTick(dt){
  const el=simT-wave.t;
  if(wave.phase==='fight1'&&enemies.every(e=>e.dead)){goWave('clear');bigText('All clear!','clear');}
  else if(wave.phase==='clear'&&el>=CLEAR_T)goWave('count');
  else if(wave.phase==='count'&&el>=COUNT_T){bigText('Enemy inbound!','inbound');spawnJeep();goWave('drive');}
  else if(wave.phase==='drive')driveJeep(dt);
  else if(wave.phase==='hq')hqTick(dt);
  else if(wave.phase==='fight2'&&enemies.every(e=>e.dead)){goWave('done');bigText('All clear!','clear');endAt=performance.now()+CLEAR_T*1000;}
}

/* ---------- the jeep ---------- */
function gunnerOf(){return enemies.find(e=>e.gunner);}
function spawnJeep(){
  const j={x:JEEP.x,y:JEEP.y0,m:makeJeep()};wave.jeep=j;
  const g=mk('E','E','E5','Gunner',j.x,j.y-8,Math.PI/2);
  Object.assign(g,{gunner:true,elev:9,alerted:true,aware:1,cool:99});
  makeSoldier(g);enemies=units.filter(u=>u.side==='E');
  placeJeep();
}
function placeJeep(){
  const j=wave.jeep;j.m.g.position.set(j.x,0,j.y);
  jeepLight.intensity=3.2;jeepLight.position.set(j.x,10,j.y+22);jeepLight.target.position.set(j.x,0,j.y+140);
  const g=gunnerOf();if(g&&!g.dead){g.x=j.x;g.y=j.y-8;}
}
function driveJeep(dt){
  const j=wave.jeep;j.y=Math.min(JEEP.y1,j.y+JEEP.speed*dt);placeJeep();
  if(j.y<JEEP.y1)return;
  // parked: it becomes half cover, the gunner opens up and the squad dismounts
  j.obj={kind:'jeep',x:JEEP.x-JEEP.w/2,y:JEEP.y1-JEEP.l/2,w:JEEP.w,h:JEEP.l,full:false};
  j.gone=addObstacle(j.obj);
  const g=gunnerOf();if(g)g.cool=0.6;
  [[-22,-10],[22,-10],[-22,14],[22,14]].forEach(([dx,dy],i)=>{
    const u=mk('E','E','E'+(6+i),'Hostile',JEEP.x+dx,JEEP.y1+dy,Math.PI/2);
    Object.assign(u,{wave:2,alerted:true,aware:1,cool:0.8+Math.random(),moveCool:simT+0.4+i*0.5});
    makeSoldier(u);
  });
  enemies=units.filter(u=>u.side==='E');
  goWave('fight2');
}
// keep the machine gun pointing where the gunner aims (called every frame)
function aimTurret(){
  const j=wave.jeep,g=gunnerOf();if(!j||!g||g.dead)return;
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
