"use strict";
/* DOM HUD: status chip, banner, squad rows, action buttons, keyboard, end screen. */
let bannerTimer=0;
function banner(text,ms=2400){const b=$('#banner');b.textContent=text;b.classList.add('show');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>b.classList.remove('show'),ms);}
function setStatus(){
  const s=$('#status');
  if(state==='end'){s.className='chip';return;}
  if(wave.phase==='hq'){s.textContent='HQ secured';s.className='chip';return;}
  if(wavePhase('clear','count')){s.textContent=wave.phase==='count'?'Incoming':'All clear';s.className='chip'+(wave.phase==='count'?' contact':'');return;}
  s.textContent=contact?'Contact':'Undetected';s.className='chip'+(contact?' contact':'');
}
function finish(){
  const win=enemies.every(e=>e.dead);
  state='end';setStatus();$('#status').textContent=win?'Secured':'Lost';
  if(win){bigText('Mission complete!','complete');setTimeout(showAAR,2600);return;}   // then the after-action report, then the HQ
  const t=Math.floor(simT),mm=Math.floor(t/60),ss=String(t%60).padStart(2,'0');
  const kia=players.filter(p=>p.dead).length;
  $('#endEyebrow').textContent=win?'Mission complete':'Mission failed';
  $('#endTitle').textContent=win?'Warehouse secured':'Squad lost';
  $('#endText').textContent=win
    ?`Cleared in ${mm}:${ss}. ${downCount} time${downCount===1?'':'s'} a soldier went down, ${kia} killed in action.`
    :`The squad held out for ${mm}:${ss}. Try pinning one side of the room with Suppress while a fire team works around to the west window or the east door.`;
  $('#end').hidden=false;
}
/* ---------- HUD ---------- */
function hud(){
  updateCards();
  const act=sel.filter(alive);
  $('#supBtn').disabled=!act.length||!enemies.some(e=>!e.dead&&e.seen);
  $('#supBtn').classList.toggle('on',mode==='suppress');
  $('#pauseBtn').textContent=paused?'Resume':'Pause';
  {const gb=$('#gaitBtn'),forced=act.some(u=>u.gaitForce),g=act.length?gaitOf(act.find(u=>u.gaitForce)||act[0]):'sneak';
   gb.disabled=!act.length;gb.classList.toggle('on',forced);gb.setAttribute('aria-pressed',forced);
   gb.querySelector('span').textContent=g==='sneak'?'Sneak':'Run';gb.querySelector('small').textContent=forced?'Manual':'Auto';
   gb.setAttribute('aria-label',`${g==='sneak'?'Sneaking':'Running'}, ${forced?'manual':'automatic'}. Press to ${forced?'go back to automatic':g==='sneak'?'run':'sneak'}.`);}
  const ts=timeScale();
  const sp=$('#speed');sp.hidden=!(state==='play'&&ts<1);sp.textContent=paused?'Paused':'Slow-mo';
  let h;
  if(ptr&&ptr.kind==='lasso')h='Draw a loop round the soldiers you want.';
  else if(mode==='suppress')h='Tap an enemy to pin him down. Pinned enemies barely shoot back.';
  else if(ptr&&ptr.kind==='draw')h=`Draw ${ptr.unit.name}'s route. Lift your finger to go. The end settles on cover nearby.`;
  else if(mode==='grenade')h='Tap inside the dashed circle to throw. Tap the grenade on his card again to cancel.';
  else if(wave.phase==='hq'&&!preview&&!act.length)h='Free time. Heal in the red + box and restock in the supply box. The next area is to the north-east.';
  else if(wave.phase==='count'&&!preview)h='Reinforcements are coming through the north gate. Get the squad into cover facing north.';
  else if(preview)h='Green is in cover, red is exposed. Tap the marker again to move.';
  else if(!act.length)h='Drag the map to look around. Tap a team tab or a soldier to select. Hold empty ground to lasso.';
  else if(act.length===1)h=`Drag from ${act[0].name} to draw his route, or tap ground to send him. Grenade is on his card.`;
  else h=contact?'Tap the ground to preview positions. Tap an enemy to focus fire.':'Tap the ground to preview positions. Tap a hostile to open fire.';
  $('#hint').textContent=h;
}
// detection indicator, updated every frame
let alertShown=-1;
function alertMeter(){
  const el=$('#alert');el.hidden=state!=='play'||wavePhase('clear','count','done','hq');if(el.hidden)return;   // the countdown takes its place
  const a=detection(),k=Math.round(a*100);
  if(k===alertShown)return;alertShown=k;
  el.classList.toggle('spotted',a>=1);el.classList.toggle('hot',a>=0.7&&a<1);
  // faint and see-through at first; more solid, redder, brighter and glowing as he closes in on finding you
  const c=Math.pow(a,1.4),lerp=(p,q)=>p+(q-p)*c;
  const arc=$('#alertArc');arc.setAttribute('stroke-dashoffset',(94.25*(1-a)).toFixed(2));arc.style.opacity=a>0.005?1:0;
  arc.setAttribute('stroke',`rgba(255,${lerp(225,52)|0},${lerp(215,36)|0},${lerp(.5,1).toFixed(2)})`);
  const ring=el.querySelector('.ring');
  ring.style.fill=`rgba(${lerp(0,110)|0},${lerp(0,8)|0},${lerp(0,4)|0},${lerp(.22,.42).toFixed(2)})`;
  ring.style.stroke=`rgba(255,${lerp(255,90)|0},${lerp(255,80)|0},${lerp(.1,.3).toFixed(2)})`;
  el.querySelector('svg').style.filter=c>0.02?`drop-shadow(0 0 ${(1+7*c).toFixed(1)}px rgba(255,45,30,${(.9*c).toFixed(2)}))`:'none';
  el.setAttribute('aria-label',a>=1?'Spotted':`Detection ${k}%`);
}
function startView(){zoom=2.4;yaw=0;tilt=0;camT={x:190,z:700};clampCam();updateCamera();}
function bindHud(){
  for(const tab of document.querySelectorAll('.tab[data-team]'))tab.addEventListener('click',()=>{if(state!=='play')return;selectTeam(tab.dataset.team);hud();});
  $('#allBtn').addEventListener('click',()=>{if(state!=='play')return;select(players.filter(alive));preview=null;mode=null;hud();});
  $('#gaitBtn').addEventListener('click',()=>{if(state!=='play')return;toggleGait();hud();});
  $('#supBtn').addEventListener('click',()=>{if(state!=='play')return;mode=mode==='suppress'?null:'suppress';preview=null;hud();});
  $('#clearBtn').addEventListener('click',()=>{if(mode||preview){mode=null;preview=null;}else select([]);hud();});
  $('#pauseBtn').addEventListener('click',()=>{if(state!=='play')return;paused=!paused;hud();});
  $('#startBtn').addEventListener('click',()=>{startView();$('#intro').hidden=true;state='play';banner('Move up. The warehouse is straight ahead.',3000);hud();});
  $('#aarBtn').addEventListener('click',startHQ);
  $('#hqBtn').addEventListener('click',()=>{$('#hqPop').hidden=true;paused=false;hud();});
  $('#resetXpBtn').addEventListener('click',()=>{resetProgress();banner('Squad XP and ranks reset.',1600);});
  $('#againBtn').addEventListener('click',()=>{startView();$('#end').hidden=true;reset();state='play';hud();});
  addEventListener('keydown',e=>{
    if(state!=='play')return;
    if(e.code==='Space'){e.preventDefault();paused=!paused;hud();}
    else if(e.key==='Escape'){$('#clearBtn').click();}
    else if(e.key==='r'||e.key==='R'){toggleGait();hud();}
    else if(e.key==='q'||e.key==='Q')turnCam(-Math.PI/12);else if(e.key==='e'||e.key==='E')turnCam(Math.PI/12);
    else if(e.key==='1'){selectTeam('A');hud();}else if(e.key==='2'){selectTeam('B');hud();}
  });
}
