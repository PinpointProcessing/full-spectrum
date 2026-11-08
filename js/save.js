"use strict";
/* Saving the campaign. At each checkpoint (an area cleared: the warehouse, the bridge, the maze, the data center's front; getting
   inside the data center; out of the building with the scientists; the drawbridge down) the game
   stores where you are, each soldier's health, grenade and charge, and who's dead. Continue on the intro screen (or
   Retry from last save after a lost fight) restores it; New game starts over with everyone alive. Bryan: the dead stay
   dead unless the game is restarted, and wounds are kept. A soldier who is down when it saves is stored badly wounded
   (5 HP) rather than bleeding out. XP and ranks are saved separately (progress.js) and survive a New game. */
const SAVE_KEY='warehouseYard.save.v3';   // (v3: the checkpoints rework; older saves are ignored)
const STAGES={wh:'Warehouse cleared',br:'Bridge cleared',maze:'Container maze cleared',dco:'Data center front cleared',dci:'Inside the data center',sci:'Scientists detained',hqf:'In front of the Headquarters',dc:'Drawbridge down',gate:'The gate cleared',won:'The Brood Mother dead',base:'The Headquarters',road:'The road east',hill:'Inside the hill',summit:'The summit',home:'Back with the parts'};   // (the last three: Level 4, level4.js)
const STAGE_OBJ={wh:3,br:3,maze:3,dco:3,dci:3,sci:4,hqf:4,dc:5,gate:5,won:5,base:6,road:7,hill:8,summit:8,home:9};   // obj (mission.js) after each
const STAGE_AT={wh:{x:300,y:430},br:{x:476,y:172},maze:{x:140,y:-10},dco:{x:600,y:-330},dci:{x:245,y:-410},sci:{x:245,y:-410},hqf:{x:860,y:-462},dc:{x:700,y:-470},gate:{x:850,y:-470},won:{x:850,y:-470},base:{x:500,y:600},road:{x:850,y:-392},hill:{x:1520,y:-275},summit:{x:1520,y:-275},home:{x:1290,y:-280}};   // (hqf: at the drawbridge with the scientists, before the bio scanner: monsters.js's hqfTick)
const AREA_STAGE=['wh','br','maze','dco'];   // the areas' checkpoints (AREAS in mission.js)
function readSave(){
  try{const s=JSON.parse(localStorage.getItem(SAVE_KEY));if(s&&STAGES[s.stage])return s;}catch(e){}
  try{const o=JSON.parse(localStorage.getItem('warehouseYard.save.v2'));if(!o)return null;   // a save from before the checkpoints: carried over (Bryan was in the data center)
    const stage={wh:'wh',br:'br',dep:'maze',dco:'dco',sci:'sci',key:'sci',dc:'dc'}[o.stage];if(!stage)return null;
    return Object.assign({},o,{v:3,stage,cleared:{wh:[0],br:[0,1],maze:[0,1,2]}[stage]||[0,1,2,3]});}catch(e){return null;}
}
function clearSave(){try{localStorage.removeItem(SAVE_KEY);localStorage.removeItem('warehouseYard.save.v2');}catch(e){}}
let savedTimer=0;
function saveGame(stage,quiet){   // (quiet: no Saved chip, the drawbridge coming down: mission.js)
  const data={v:3,stage,when:Date.now(),sci:sciOut,cleared:[0,1,2,3].filter(n=>finished[n]),   // (sci: scientists brought out of the data center: office.js; cleared: the areas that are checkpoints)
    alert:{t:alertT,max:alertMax},crew:hqCrew,l4:typeof l4Save==='function'&&MAPID==='l4'?l4Save():null,   // (Level 4: the parts taken, the crates, the radio log, the generator, the Crawler: level4.js)   // the base's alert level only goes up within the mission (layers.js)
    squad:Object.fromEntries(players.map(p=>[p.id,{dead:p.dead,hp:p.dead?0:Math.max(5,Math.round(p.hp)),grenade:p.grenade,spec:p.spec,specN:p.specN,charges:p.charges,weapon:p.weapon,weapon2:p.weapon2||null,gl:!!p.gl,sil:p.weapon==='m4s'?Math.round(p.sil??silMax(p)):null,   // (gl: an M203 in his grenade's place, Level 4's find)
      ...(p.joined?{joined:true,name:p.name,weapon:p.weapon,kitted:!!p.kitted}:{})}]))};   // (joined: a freed prisoner, office.js; kitted: kitted out at the Headquarters, a soldier like the four, base.js)
  try{localStorage.setItem(SAVE_KEY,JSON.stringify(data));}catch(e){return;}
  if(quiet)return;const c=$('#savedChip');c.textContent=`Saved · ${STAGES[stage]}`;c.hidden=false;clearTimeout(savedTimer);savedTimer=setTimeout(()=>{c.hidden=true;},2600);
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
  if(n>=6){   // from the Headquarters on the freed men are soldiers of the squad, kitted out (since v120, base.js's kitFreed): a save from v110 to v119 had them as its crew, one from before v110 in the squad unkitted
    for(const c of s.crew||[])if(!s.squad[c.id])s.squad[c.id]={dead:false,hp:100,grenade:1,joined:true,name:c.name||c.id,weapon:'m4s'};
    for(const d of Object.values(s.squad))if(d.joined)d.kitted=true;s.crew=[];}
  hqCrew=CREW_ON&&n>=6&&s.crew?s.crew.slice():[];   // (the crew's dormant: base.js)
  for(const[id,d]of Object.entries(s.squad))if(d.joined&&!players.some(p=>p.id===id))rejoin(id,d,at0);   // the freed prisoners who joined (office.js; from the HQ on, only if none of the four is left: base.js)
  if(n>=6){sciOut=s.sci||1;if(typeof preloadVoices==='function')preloadVoices(['S1','S2','S3','S4']);}   // (the Headquarters' staff now: they're inside it, base.js)
  else if(n>=4)sciBack(s.sci||1,at0);if(['hqf','dc','gate','won','base','road','hill','summit','home'].includes(s.stage))mon.hqf=true;   // the scientists brought out follow the squad again (to the bio scanner, then onto the drawbridge: monsters.js)
  if(n>=5){setBridge(1);if(s.stage!=='dc')addZones(REST_ZONES.dc);}   // (from 'dc' they pour out again first: the stations once the gate's clear, monsters.js)
  objDone=n>=6?4:n>=5?3:n>=4?2:0;
  startMissionAreas();obj=n;updateObjUI();
  // the squad: the dead stay gone, the living keep their wounds
  const at=at0,taken=[];
  for(const p of players){
    const d=s.squad[p.id];
    if(d&&d.spec==='silencer'){d.spec='smoke';d.specN=null;if(!d.weapon||d.weapon==='rifle')d.weapon='m4s';}   // (a save from before v122: the silencer was a special item; it's on his M4 now, combat.js)
    if(!d||d.dead){Object.assign(p,{dead:true,hp:0,gone:true});continue;}
    const spot=openSpot(at.x,at.y,taken)||at;taken.push(spot);
    if(d.joined&&!d.kitted){Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,weapon:d.weapon||null,weapon2:d.weapon2||null,gl:!!d.gl,path:[]});if(d.gl)p.grenade=d.grenade;continue;}   // a freed prisoner: no gear (but what he found in Level 4)
    Object.assign(p,{x:spot.x,y:spot.y,hp:d.hp,grenade:d.grenade,spec:d.spec||DEFAULT_SPEC[p.id]||'smoke',specN:d.specN??specFull({spec:d.spec||DEFAULT_SPEC[p.id]||'smoke'}),charges:d.charges??1,weapon:d.weapon||p.weapon,weapon2:d.weapon2||null,gl:!!d.gl,path:[]});
    if(d.joined)kitFreed(p);   // (kitted out at the Headquarters: the squad's look and gear, base.js)
    if(p.weapon==='m4s')p.sil=d.sil??silMax(p);if(p.m)figRefresh(p);   // (the silencer's wear: combat.js)
  }
  zoom=2.2;yaw=0;tilt=0;camT={x:at.x,z:at.y};clampCam();updateCamera();
  $('#intro').hidden=true;$('#end').hidden=true;
  setStatus();buildCards();hud();if(s.stage!=='dc'&&s.stage!=='won')banner(cpNote||`Continuing: ${STAGES[s.stage]}.`,cpNote?4200:2400);cpNote=null;   // (from 'dc' they pour out again at once: nothing on screen, Bryan; from 'won', "Headquarters taken" says it; a start's own line: startCheckpoint)
  if(s.stage==='dci')setTimeout(()=>{if(state==='play'&&MAPID==='out')enterBuilding(true);},60);
  if(s.stage==='base')setTimeout(()=>{if(state==='play'&&MAPID==='out')enterBase();},60);   // the finished Headquarters: straight back in (base.js)
  if(s.stage==='road')roadContinue();   // outside it, the road east open (road.js)
  if(s.stage==='hill'||s.stage==='summit'){roadContinue();const d=s.l4,st=s.stage;setTimeout(()=>{if(state==='play'&&MAPID==='out')enterHill({cont:st,l4:d});},60);}   // Level 4: back into the hill (level4.js)
  if(s.stage==='home'){roadContinue();homeContinue();}   // back on the bridge with the parts
  if(s.stage==='dc')monGateStart();   // the drawbridge down: they come out again (monsters.js)
  if(s.stage==='gate'||s.stage==='won'){mon.out={t0:simT-60,spawned:MON_FLOOD.n,roared:true,done:true};if(typeof railNow==='function')railNow();updateObjUI();}   // the gate cleared: gather at the drawbridge to go in, the scientists tied on its railings
  if(s.stage==='won')setTimeout(()=>{if(state==='play'&&MAPID==='out')enterHQ(true);},60);   // her death: inside, the fight over, the scientists still on the drawbridge to be fetched (fortress.js's hqAftermath; the Level 4 button, hud.js)
  return true;
}
// intro and end screens: offer Continue / Retry when there's a save
function refreshSaveButtons(){
  const s=readSave();buildCheckpoints();
  $('#continueBtn').hidden=!s;if(s)$('#continueBtn').textContent=`Level ${['base','road','hill','summit','home'].includes(s.stage)?4:3} · Continue · ${STAGES[s.stage]}`;   // (Level 4 starts in the finished Headquarters since v117)
  $('#startBtn').textContent=s?'Level 3 · New game':'Level 3 · The Data Center';
  $('#retryBtn').hidden=!s;$('#againBtn').textContent=s?'New game':'Run it again';
}

/* ---------- starting Level 3 at any of its checkpoints (Bryan: "set me up in front of the HQ with both squads (from the
   prisoners-armed) and the scientists... This wouldn't be a separate level, just a checkpoint"; and "if players exit and
   come back to the game they can start off at checkpoints or have a decision to start the level over"). On the intro card
   under Level 3: Continue (the last save) and New game as before, and the list of checkpoints, every one open for now, like
   the levels. A checkpoint starts with everyone at full health and the loadout from the between-missions screen; from the
   scientists to the gate, with the four freed men armed and all four scientists; from the Headquarters on the freed men are
   soldiers of the squad, kitted out like the four (base.js, since v120). It becomes the save. ---------- */
const CP_ORDER=['wh','br','maze','dco','dci','sci','hqf','dc','gate','won','base','road','hill','summit','home'];
let cpNote=null;   // (a start's own first line in place of "Continuing: ...": the Level 4 button, hud.js)
function startCheckpoint(st,note){
  const n=STAGE_OBJ[st],after=n>=4,lo=typeof loadout!=='undefined'?loadout:DEFAULT_LOADOUT,squad={};
  for(const id of['A1','A2','B1','B2']){const l=lo[id]||DEFAULT_LOADOUT[id];squad[id]={dead:false,hp:100,grenade:1,spec:l.spec,weapon:l.weapon};}
  const freed=[['A3','Abara'],['A4','Brennan'],['B3','Lindqvist'],['B4','Marsh']],crew=[];
  if(after&&n<6)for(const[id,name]of freed)squad[id]={dead:false,hp:100,grenade:0,joined:true,name,weapon:'rifle'};   // (the freed men, each with a rifle off a body)
  if(n>=6)for(const[id,name]of freed)squad[id]={dead:false,hp:100,grenade:1,spec:'smoke',joined:true,kitted:true,name,weapon:'m4s'};   // (from the Headquarters on: soldiers, kitted out like the four, base.js)
  const cleared={wh:[0],br:[0,1],maze:[0,1,2]}[st]||[0,1,2,3];
  try{localStorage.setItem(SAVE_KEY,JSON.stringify({v:3,stage:st,when:Date.now(),cleared,alert:0,sci:after?4:0,squad,crew}));}catch(e){return;}
  cpNote=note||null;continueGame();refreshSaveButtons();
}
function buildCheckpoints(){
  const box=$('#cpBtns');if(!box||box.childElementCount)return;
  for(const st of CP_ORDER){const b=document.createElement('button');b.type='button';b.className='cp';b.textContent=STAGES[st];b.addEventListener('click',()=>startCheckpoint(st));box.appendChild(b);}
}
