"use strict";
/* Saving the campaign. At each checkpoint (an area cleared: the warehouse, the bridge, the maze, the data center's front; getting
   inside the data center; out of the building with the scientists; the drawbridge down) the game
   stores where you are, each soldier's health, grenade and charge, and who's dead. Continue on the intro screen (or
   Retry from last save after a lost fight) restores it; New game starts over with everyone alive. Bryan: the dead stay
   dead unless the game is restarted, and wounds are kept. A soldier who is down when it saves is stored badly wounded
   (5 HP) rather than bleeding out. XP and ranks are saved separately (progress.js) and survive a New game. */
const SAVE_KEY='warehouseYard.save.v3';   // (v3: the checkpoints rework; older saves are ignored)
const STAGES={wh:'Warehouse cleared',br:'Bridge cleared',maze:'Container maze cleared',dco:'Data center front cleared',dci:'Inside the data center',sci:'Scientists detained',dc:'Drawbridge down',gate:'The gate cleared'};
const STAGE_OBJ={wh:3,br:3,maze:3,dco:3,dci:3,sci:4,dc:5,gate:5};   // obj (mission.js) after each
const STAGE_AT={wh:{x:300,y:430},br:{x:476,y:172},maze:{x:140,y:-10},dco:{x:600,y:-330},dci:{x:245,y:-410},sci:{x:245,y:-410},dc:{x:700,y:-470},gate:{x:850,y:-470}};
const AREA_STAGE=['wh','br','maze','dco'];   // the areas' checkpoints (AREAS in mission.js)
function readSave(){
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&STAGES[s.stage])return s;}catch(e){}
  try{const o=JSON.parse(localStorage.getItem('warehouseYard.save.v2'));if(!o)return null;   // a save from before the checkpoints: carried over (Bryan was in the data center)
    const stage={wh:'wh',br:'br',dep:'maze',dco:'dco',sci:'sci',key:'sci',dc:'dc'}[o.stage];if(!stage)return null;
    return Object.assign({},o,{v:3,stage,cleared:{wh:[0],br:[0,1],maze:[0,1,2]}[stage]||[0,1,2,3]});}catch(e){return null;}
}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem('warehouseYard.save.v2');}catch(e){}}
let savedTimer=0;
function saveGame(stage){
  const data={v:3,stage,when:Date.now(),sci:sciOut,cleared:[0,1,2,3].filter(n=>finished[n]),   // (sci: scientists brought out of the data center: office.js; cleared: the areas that are checkpoints)
    alert:{t:alertT,max:alertMax},   // the base's alert level only goes up within the mission (layers.js)
    squad:Object.fromEntries(players.map(p=>[p.id,{dead:p.dead,hp:p.dead?0:Math.max(5,Math.round(p.hp)),grenade:p.grenade,spec:p.spec,specN:p.specN,charges:p.charges,weapon:p.weapon,weapon2:p.weapon2||null,
      ...(p.joined?{joined:true,name:p.name,weapon:p.weapon}:{})}]))};   // (joined: a freed prisoner, office.js)
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){return;}
  const c=$('#savedChip');c.textContent=`Saved · ${STAGES[stage]}`;c.hidden=false;clearTimeout(savedTimer);savedTimer=setTimeout(()=>{c.hidden=true;},2600);
}

// put the game back at the saved checkpoint: the areas cleared stay cleared (their stations back), the rest get fresh defenders
function continueGame(){
  const s=readSave();if(!s)return false;
  reset();LEVEL=3;state='play';contact=false;clearTeams();landing=null;darkFront(l2Done());   // (the data center: Level 3; its front dark once Level 2's power was cut, level2.js)
  if(s.alert){alertT=s.alert.t||0;alertMax=s.alert.max||0;}
  const cleared=new Set(s.cleared||[]);
  hq={t0:simT,tour:null,toured:true};
  for(const n of cleared){finished[n]=true;addZones(REST_ZONES[AREA_STAGE[n]]);}
  if(cleared.has(0))for(const e of enemies){e.dead=true;e.hp=0;e.seen=false;e.gone=true;}   // the warehouse's four
  const n=STAGE_OBJ[s.stage],at0=STAGE_AT[s.stage];
  for(const[id,d]of Object.entries(s.squad))if(d.joined&&!players.some(p=>p.id===id))rejoin(id,d,at0);   // the freed prisoners who joined (office.js)
  if(n>=4)sciBack(s.sci||1,at0);   // the scientists brought out follow the squad again (to the bio scanner, then onto the drawbridge: monsters.js)
  if(n>=5){setBridge(1);addZones(REST_ZONES.dc);}
  objDone=n>=5?3:n>=4?2:0;
  startMissionAreas();obj=n;updateObjUI();
  // the squad: the dead stay gone, the living keep their wounds
  const at=at0,taken=[];
  for(const p of players){
    const d=s.squad[p.id];
    if(!d||d.dead){Object.assign(p,{dead:true,hp:0,gone:true});continue;}
    const spot=openSpot(at.x,at.y,taken)||at;taken.push(spot);
    if(d.joined){Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,weapon:d.weapon||null,path:[]});continue;}   // a freed prisoner: no gear
    Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,grenade:d.grenade,spec:d.spec||DEFAULT_SPEC[p.id]||'smoke',specN:d.specN??specFull({spec:d.spec||DEFAULT_SPEC[p.id]||'smoke'}),charges:d.charges??1,weapon:d.weapon||p.weapon,weapon2:d.weapon2||null,path:[]});
  }
  zoom=2.2;yaw=0;tilt=0;camT={x:at.x,z:at.y};clampCam();updateCamera();
  $('#intro').hidden=true;$('#end').hidden=true;
  setStatus();buildCards();hud();banner(`Continuing: ${STAGES[s.stage]}.`,2400);
  if(s.stage==='dci')setTimeout(()=>{if(state==='play'&&MAPID==='out')enterBuilding(true);},60);
  if(s.stage==='dc')monGateStart();   // the drawbridge down: they come out again (monsters.js)
  if(s.stage==='gate'){mon.out={t0:simT-60,spawned:12,wave:MON_WAVES.length,roared:true,done:true};if(typeof railNow==='function')railNow();updateObjUI();}   // the gate cleared: gather at the drawbridge to go in   // the checkpoint inside the data center: straight back in (interior.js)
  return true;
}
// intro and end screens: offer Continue / Retry when there's a save
function refreshSaveButtons(){
  const s=readSave();
  $('#continueBtn').hidden=!s;if(s)$('#continueBtn').textContent=`Level 3 · Continue · ${STAGES[s.stage]}`;
  $('#startBtn').textContent=s?'Level 3 · New game':'Level 3 · The Data Center';
  $('#retryBtn').hidden=!s;$('#againBtn').textContent=s?'New game':'Run it again';
}
