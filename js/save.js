"use strict";
/* Saving the campaign. At each milestone (warehouse taken, bridge taken, fuel depot destroyed, drawbridge down) the game
   stores where you are, each soldier's health, grenade and charge, and who's dead. Continue on the intro screen (or
   Retry from last save after a lost fight) restores it; New game starts over with everyone alive. Bryan: the dead stay
   dead unless the game is restarted, and wounds are kept. A soldier who is down when it saves is stored badly wounded
   (5 HP) rather than bleeding out. XP and ranks are saved separately (progress.js) and survive a New game. */
const SAVE_KEY='warehouseYard.save.v2';
const STAGES={wh:'Warehouse taken',br:'Bridge taken',dep:'Fuel depot destroyed',dc:'Drawbridge down'};
const STAGE_OBJ={wh:1,br:2,dep:3,dc:5};   // the objective that's current after each milestone
const STAGE_AT={wh:{x:300,y:430},br:{x:620,y:70},dep:{x:760,y:-30},dc:{x:700,y:-470}};
function readSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s&&STAGES[s.stage]?s:null;}catch(e){return null;}}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
let savedTimer=0;
function saveGame(stage){
  const data={v:2,stage,when:Date.now(),
    squad:Object.fromEntries(players.map(p=>[p.id,{dead:p.dead,hp:p.dead?0:Math.max(5,Math.round(p.hp)),grenade:p.grenade,charges:p.charges}]))};
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){return;}
  const c=$('#savedChip');c.textContent=`Saved · ${STAGES[stage]}`;c.hidden=false;clearTimeout(savedTimer);savedTimer=setTimeout(()=>{c.hidden=true;},2600);
}

// put the game back at the saved milestone
function continueGame(){
  const s=readSave();if(!s)return false;
  reset();state='play';contact=false;landing=null;
  for(const e of enemies){e.dead=true;e.hp=0;e.seen=false;e.gone=true;}   // the warehouse, cleared
  wave.phase='hq';hq={t0:simT,tour:null};mission={name:'north',t0:simT};addZones(WH_ZONES);
  const n=STAGE_OBJ[s.stage];
  if(n>=2)addZones([{k:'med',x:590,y:22,w:56,h:44},{k:'sup',x:650,y:22,w:56,h:44}]);
  if(n>=3){addZones([{k:'med',x:716,y:-44,w:56,h:40},{k:'sup',x:780,y:-44,w:56,h:40}]);
    for(const o of objs)if(o.kind==='tank'){o.burst=true;o.hp=0;if(o.meshes)for(const m of o.meshes){if(m.userData.c0==null)m.userData.c0=m.material.color.getHex();m.material.color.setHex(0x1a1816);}}}
  if(n>=5){CORE.done=true;if(CORE.mesh)CORE.mesh.material.emissive.setHex(0);setBridge(1);addZones([{k:'med',x:640,y:-520,w:56,h:44},{k:'sup',x:700,y:-520,w:56,h:44}]);}
  startObjective(n,true);
  // the squad: the dead stay gone, the living keep their wounds
  const at=STAGE_AT[s.stage],taken=[];
  for(const p of players){
    const d=s.squad[p.id];
    if(!d||d.dead){Object.assign(p,{dead:true,hp:0,gone:true});continue;}
    const spot=openSpot(at.x,at.y,taken)||at;taken.push(spot);
    Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,grenade:d.grenade,charges:d.charges??1,path:[]});
  }
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
