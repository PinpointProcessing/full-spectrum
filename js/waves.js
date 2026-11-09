"use strict";
/* The warehouse fight (objective 1) and its counterattack. When the warehouse is cleared: "All clear!" fades in and out,
   a 5 s "Incoming!" countdown takes the detection ring's place, then "Enemy inbound!" and five hostiles come south over
   the main bridge and push towards the squad. Clearing them ends the warehouse with its report; then the mission goes on
   (hq.js, mission.js). Also the opening dinghy landing. Timings run on game time, so pause and slow-mo stretch them. */
const COUNTER=[[466,40],[486,40],[466,70],[486,70],[476,100]],COUNTER_AT={x:476,y:260};   // where they come from, and where previews judge cover from while counting down
const CLEAR_T=3.6,COUNT_T=5;   // CLEAR_T: after "Location secured", once the crossed-off objective list has closed (OBJ_LIST_T in mission.js)
let wave={phase:'fight1',t:0};   // phases: fight1 (before the landing is over) → hq (the mission); count/fight2/done: the old counterattack, dormant
function wavePhase(...ps){return ps.includes(wave.phase);}
function resetWaves(){
  outage=null;{const c=$('#outChip');if(c)c.hidden=true;const n=$('#notice');if(n)n.hidden=true;}
  wave={phase:'fight1',t:0};bigText(null);cdShown=-1;hq=null;camPan=null;VB={x0:0,z0:TOP,x1:W,z1:H};resetMission();
}
function goWave(ph){wave.phase=ph;wave.t=simT;setStatus();hud();}
function waveTick(dt){
  if(landing)landTick(dt);outageTick();
  const el=simT-wave.t;
  if(wave.phase==='hq')hqTick(dt);   // the mission (from the end of the landing: hq.js, mission.js)
  else if(wave.phase==='count'&&el>=COUNT_T){bigText('Enemy inbound!','inbound');spawnCounter();goWave('fight2');}   // (the counterattack: dormant)
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
  startMissionAreas();if(LEVEL===3){startOutage(0);outageIntro();}else banner('Ashore. Get into the Bio Lab, up north. The warehouse ahead is guarded.',3200);hud();
  setTimeout(()=>{if(state==='play'&&typeof gen==='function'){const a=players.find(p=>p.id==='A1'&&alive(p));if(a)chat('dark',60,gen(a,'dark'));}},2600);   // "Let's go dark" (chatter.js)
}

/* ---------- Level 3's start (Bryan, after v124: "after knocking out the lights and the alarms, can the next base be out of
   communications. Walkie Talkie's work but reinforcements don't come"; "When the warehouse starts, a popup should appear,
   light and communications are out but are being repaired - work quickly. After 45 seconds communications go back up and a
   loud beep and test alarm with an announcement over the loudspeaker is heard. Another 60 seconds later, the lights turn on";
   "at the beginning of the warehouse map the camera can pan to the data warehouse with a popup that says Breach the Bio Lab")
   Ashore, the camera goes up to the Bio Lab's doors and back; then the clock: comms down OUT_T.comms s of game time (a radio
   call alerts their own men but brings nobody and sounds no alarm: hunt.js's callIn), then the loudspeakers, then the front's
   lights OUT_T.lights s later (level2.js's darkFront). A Continue carries the clock on (save.js's outage). */
const OUT_T={comms:45,lights:105};
let outage=null;   // {t0, comms: back on, lights: back on}
const commsDown=()=>LEVEL===3&&!!outage&&!outage.comms;
function notice(title,text,ms=5200){   // a small card under the ring at the top (a tap closes it); not a pause
  const el=$('#notice');if(!el)return;el.innerHTML=`<b>${title}</b>${text?`<span>${text}</span>`:''}`;el.hidden=false;el.classList.remove('in');void el.offsetWidth;el.classList.add('in');
  clearTimeout(notice.t);notice.t=setTimeout(()=>{el.hidden=true;},ms);
}
function startOutage(t=0){outage={t0:simT-t,comms:t>=OUT_T.comms,lights:t>=OUT_T.lights};darkFront(!outage.lights);}
function outageIntro(){   // the pan up to the Bio Lab and back, then the outage notice
  const back={x:camT.x,z:camT.z,zoom},to={x:DC_DOOR.x+DC_DOOR.w/2,z:DC.y+DC.h+60,zoom:Math.max(zoom,1.8)};
  camPan={from:{...back},to,t:0,dur:1.6};
  notice('Breach the Bio Lab','Get inside, find the scientists and bring them out.',4200);
  setTimeout(()=>{if(state!=='play'||MAPID!=='out')return;camPan={from:{x:camT.x,z:camT.z,zoom},to:back,t:0,dur:1.2};
    setTimeout(()=>{if(state==='play'&&commsDown())notice('Lights and comms are out','They\'re being repaired. Work quickly.',5600);},1300);},3400);
}
function outageTick(){
  if(!outage||LEVEL!==3)return;const el=simT-outage.t0;
  if(!outage.comms&&el>=OUT_T.comms){outage.comms=true;
    const x=DC_DOOR.x+DC_DOOR.w/2,y=DC.y+DC.h+20;if(typeof sfxPA==='function')sfxPA(MAPID==='out'?x:null,MAPID==='out'?y:null);
    setTimeout(()=>{if(state==='play'&&typeof sfxSiren==='function')sfxSiren(x,y);},1200);
    notice('Loudspeaker','"Communications restored. This is a test of the alarm system. All posts, radio check."',6000);
    setTimeout(()=>{if(state==='play')banner('Their radios are back: a call that goes out now brings reinforcements.',3400);},6200);}
  if(outage.comms&&!outage.lights&&el>=OUT_T.lights&&MAPID==='out'){outage.lights=true;darkFront(false);if(typeof sfxClang==='function')sfxClang(DC_DOOR.x,DC.y+DC.h);banner('The Bio Lab\'s lights are back on.',3000);}
  outageHud(el);
}
function outageHud(el){
  const c=$('#outChip');if(!c)return;const on=state==='play'&&LEVEL===3&&outage&&!outage.lights;c.hidden=!on;if(!on)return;
  const left=Math.max(0,Math.ceil((outage.comms?OUT_T.lights:OUT_T.comms)-el)),t=`${outage.comms?'Lights out':'Comms down'} · ${Math.floor(left/60)}:${String(left%60).padStart(2,'0')}`;
  if(c.textContent!==t)c.textContent=t;
}

function gunnerOf(){return enemies.find(e=>e.gunner&&!e.dead);}
// keep a jeep's machine gun pointing where its gunner aims (called every frame; no jeep in this version)
function aimTurret(){
  if(MAPID==='out'&&PBOX.mesh){const m=gunMan();if(m){let da=m.ang-PBOX.gun.ang;da=clamp(Math.atan2(Math.sin(da),Math.cos(da)),-PBOX.gun.arc,PBOX.gun.arc);PBOX.mesh.rotation.y=-(PBOX.gun.ang+da);}}   // the pillbox's gun follows whoever's on it
  aimJeep();
}
function aimJeep(){const j=wave.jeep,g=j&&j.owner==='P'?seatOf(j,'gunner'):null;if(!j||!g||g.dead||j.state==='wreck')return;j.m.tur.rotation.y=-g.ang-j.m.g.rotation.y;}

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
  const path=best&&findPath(e.x,e.y,best.x,best.y,FOOT);
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
  if(!on&&threatOn())return;   // a radio call or reinforcements are using it (hunt.js)
  cd.hidden=!on;if(!on){cdShown=-1;return;}
  cd.querySelector('small').textContent='Incoming!';
  const left=Math.max(0,COUNT_T-(simT-wave.t)),n=Math.ceil(left);
  cd.querySelector('b').textContent=left.toFixed(2);   // counts down in hundredths
  if(n===cdShown)return;cdShown=n;
  cd.setAttribute('aria-label',`Incoming in ${n}`);
  cd.classList.remove('tick');void cd.offsetWidth;cd.classList.add('tick');   // pulse on every whole second
}
