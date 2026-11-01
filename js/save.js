"use strict";
/* Saving the campaign. At each milestone (warehouse secured, depot unlocked, checkpoint secured) the game stores where you
   are, each soldier's health and grenades, who's dead, and the jeep. Continue on the intro screen (or Retry from last save
   after a lost fight) restores it; New game starts over with everyone alive. Bryan: the dead stay dead unless the game is
   restarted, and wounds are kept. A soldier who is down when it saves is stored badly wounded (5 HP) rather than bleeding
   out. XP and ranks are saved separately (progress.js) and survive a New game. */
const SAVE_KEY='warehouseYard.save.v1';
const STAGES={hq:'Warehouse secured',depot:'Depot unlocked',hq2:'Checkpoint secured'};
function readSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s&&STAGES[s.stage]?s:null;}catch(e){return null;}}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
let savedTimer=0;
function saveGame(stage){
  const j=wave.jeep;
  const data={v:1,stage,when:Date.now(),
    squad:Object.fromEntries(players.map(p=>[p.id,{dead:p.dead,hp:p.dead?0:Math.max(5,Math.round(p.hp)),grenade:p.grenade,launcher:p.launcher??null}])),
    road:!!(road&&road.phase==='done'),   // the trucks and the tank beaten
    jeep:j&&j.owner==='P'?{x:Math.round(j.x),y:Math.round(j.y),heading:+j.heading.toFixed(3),hp:Math.round(j.hp),state:j.state==='broken'?'wreck':j.state}:null};
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){return;}
  const c=$('#savedChip');c.textContent=`Saved · ${STAGES[stage]}`;c.hidden=false;clearTimeout(savedTimer);savedTimer=setTimeout(()=>{c.hidden=true;},2600);
}

// put the game back at the saved milestone
function continueGame(){
  const s=readSave();if(!s)return false;
  reset();state='play';contact=false;
  for(const e of enemies){e.dead=true;e.hp=0;e.seen=false;}                         // the warehouse, cleared
  spawnJeep();const g=gunnerOf();if(g){Object.assign(g,{dead:true,hp:0,seen:false,gunner:false,elev:0});}   // its crew dealt with
  wave.phase='hq';hq={t0:simT,arrow:false,patrol:null};
  parkJeepAt(MOTOR.x,MOTOR.y);smashGate(true);   // the gun jeep came in through the gate
  if(s.stage!=='hq'){
    hq.patrol='done';openArea();
    for(const e of enemies)if(e.wave===2&&!garrison.includes(e)){e.dead=true;e.seen=false;}
  }
  if(s.stage==='hq2'){for(const e of garrison){e.dead=true;e.hp=0;e.seen=false;}wave.phase='hq2';hq.arrow=false;hq.noArrow=true;addHQ2Zones();}
  // the squad: the dead stay gone, the living keep their wounds
  const at={hq:{x:300,y:430},depot:{x:540,y:110},hq2:{x:930,y:-372}}[s.stage],taken=[];
  for(const p of players){
    const d=s.squad[p.id];
    if(!d||d.dead){Object.assign(p,{dead:true,hp:0,gone:true});continue;}
    const spot=openSpot(at.x,at.y,taken)||at;taken.push(spot);
    Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,grenade:d.grenade});if(d.launcher!=null)p.launcher=d.launcher;   // the captured RPG
  }
  const j=wave.jeep;
  if(s.jeep&&j){
    unparkObstacle(j);Object.assign(j,{x:s.jeep.x,y:s.jeep.y,heading:s.jeep.heading,hp:s.jeep.hp});
    j.m.g.position.set(j.x,0,j.y);j.m.g.rotation.y=Math.PI/2-j.heading;
    if(s.jeep.state==='wreck'){j.state='wreck';j.hp=0;j.wreckT=simT-60;wreckLook(j);}
    parkObstacle(j);
  }
  if(s.stage==='hq2'){if(s.road)road={phase:'done'};else if(!players.some(p=>p.launcher!=null))dropRPG(965,-290);}   // the launcher lies where the RPG gunner fell, unless someone carries it
  zoom=2.2;yaw=0;tilt=0;camT={x:at.x,z:at.y};clampCam();updateCamera();
  $('#intro').hidden=true;$('#end').hidden=true;
  setStatus();buildCards();hud();banner(`Continuing: ${STAGES[s.stage]}.`,2400);
  return true;
}
// intro and end screens: offer Continue / Retry when there's a save
function refreshSaveButtons(){
  const s=readSave();
  $('#continueBtn').hidden=!s;if(s)$('#continueBtn').textContent=`Continue · ${STAGES[s.stage]}`;
  $('#startBtn').textContent=s?'New game':'Deploy';
  $('#retryBtn').hidden=!s;$('#againBtn').textContent=s?'New game':'Run it again';
}
