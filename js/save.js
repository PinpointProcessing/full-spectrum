"use strict";
/* Saving the campaign. At each milestone (warehouse taken, bridge taken, container yard taken, the data center's yard, out of
   the building with the scientists, drawbridge down) the game
   stores where you are, each soldier's health, grenade and charge, and who's dead. Continue on the intro screen (or
   Retry from last save after a lost fight) restores it; New game starts over with everyone alive. Bryan: the dead stay
   dead unless the game is restarted, and wounds are kept. A soldier who is down when it saves is stored badly wounded
   (5 HP) rather than bleeding out. XP and ranks are saved separately (progress.js) and survive a New game. */
const SAVE_KEY='warehouseYard.save.v2';
const STAGES={wh:'Warehouse taken',br:'Bridge taken',dep:'Container yard taken',dco:'Data center yard taken',sci:'Scientists detained',key:'Scientists detained',dc:'Drawbridge down'};   // ('key': saves from before the scientists)
const STAGE_OBJ={wh:1,br:2,dep:3,dco:3,sci:4,key:4,dc:5};   // the objective that's current after each milestone
const STAGE_AT={wh:{x:300,y:430},br:{x:476,y:172},dep:{x:740,y:0},dco:{x:245,y:-410},sci:{x:245,y:-410},key:{x:245,y:-410},dc:{x:700,y:-470}};
function readSave(){try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));return s&&STAGES[s.stage]?s:null;}catch(e){return null;}}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);}catch(e){}}
let savedTimer=0;
function saveGame(stage){
  const data={v:2,stage,when:Date.now(),sci:sciOut,   // (sci: scientists brought out of the data center: office.js)
    alert:{t:alertT,max:alertMax},   // the base's alert level only goes up within the mission (layers.js)
    squad:Object.fromEntries(players.map(p=>[p.id,{dead:p.dead,hp:p.dead?0:Math.max(5,Math.round(p.hp)),grenade:p.grenade,spec:p.spec,specN:p.specN,charges:p.charges,
      ...(p.joined?{joined:true,name:p.name,weapon:p.weapon}:{})}]))};   // (joined: a freed prisoner, office.js)
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){return;}
  const c=$('#savedChip');c.textContent=`Saved · ${STAGES[stage]}`;c.hidden=false;clearTimeout(savedTimer);savedTimer=setTimeout(()=>{c.hidden=true;},2600);
}

// put the game back at the saved milestone
function continueGame(){
  const s=readSave();if(!s)return false;
  reset();state='play';contact=false;landing=null;
  if(s.alert){alertT=s.alert.t||0;alertMax=s.alert.max||0;}
  for(const e of enemies){e.dead=true;e.hp=0;e.seen=false;e.gone=true;}   // the warehouse, cleared
  wave.phase='hq';hq={t0:simT,tour:null};addZones(WH_ZONES);
  const n=STAGE_OBJ[s.stage];
  if(n>=2)addZones(REST_ZONES.br);
  if(n>=3){addZones(REST_ZONES.dep);
    for(const o of objs)if(o.kind==='tank'){o.burst=true;o.hp=0;if(o.meshes)for(const m of o.meshes){if(m.userData.c0==null)m.userData.c0=m.material.color.getHex();m.material.color.setHex(0x1a1816);}}}
  if(s.stage==='dco'||n>=4)dcTaken=true;   // the data center's yard was taken: its guards don't come back, the front doors are open
  const at0=STAGE_AT[s.stage];
  for(const[id,d]of Object.entries(s.squad))if(d.joined&&!players.some(p=>p.id===id))rejoin(id,d,at0);   // the freed prisoners who joined (office.js)
  if(n>=4&&n<5)sciBack(s.sci||1,at0);else if(n>=5)sciOut=s.sci||1;   // the scientists brought out follow the squad again
  if(n>=5){setBridge(1);addZones(REST_ZONES.dc);}
  objDone={wh:1,br:2,dep:3,dco:3,sci:3,key:3,dc:4}[s.stage];startObjective(n,true);
  // the squad: the dead stay gone, the living keep their wounds
  const at=STAGE_AT[s.stage],taken=[];
  for(const p of players){
    const d=s.squad[p.id];
    if(!d||d.dead){Object.assign(p,{dead:true,hp:0,gone:true});continue;}
    const spot=openSpot(at.x,at.y,taken)||at;taken.push(spot);
    if(d.joined){Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,weapon:d.weapon||null,path:[]});continue;}   // a freed prisoner: no gear
    Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,grenade:d.grenade,spec:d.spec||DEFAULT_SPEC[p.id]||'smoke',specN:d.specN??d.smoke??specFull({spec:d.spec||DEFAULT_SPEC[p.id]||'smoke'}),charges:d.charges??1,path:[]});
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
