"use strict";
/* DOM HUD: status chip, banner, squad rows, action buttons, keyboard, end screen. */
let bannerTimer=0;
function banner(text,ms=2400){const b=$('#banner');b.textContent=text;b.classList.add('show');clearTimeout(bannerTimer);bannerTimer=setTimeout(()=>b.classList.remove('show'),ms);}
function setStatus(){
  const s=$('#status');
  if(state==='end'){s.className='chip';return;}
  s.textContent=contact?'Contact':'Undetected';s.className='chip'+(contact?' contact':'');
}
function finish(){
  const win=enemies.every(e=>e.dead);
  state='end';setStatus();$('#status').textContent=win?'Secured':'Lost';
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
function buildRows(){
  for(const sec of document.querySelectorAll('.team')){
    const t=sec.dataset.team,rows=sec.querySelector('.rows');rows.innerHTML='';
    for(const u of players.filter(p=>p.team===t)){
      const b=document.createElement('button');b.className='row';b.dataset.id=u.id;
      b.innerHTML=`<span class="nm"><b>${u.id}</b>${u.name}</span><span class="hp"><i></i></span><span class="st">Ready</span>`;
      b.addEventListener('click',()=>{if(state!=='play'||!alive(u))return;sel=[u];preview=null;mode=null;hud();});
      rows.appendChild(b);u.row=b;
    }
  }
}
function hud(){
  for(const u of players){
    if(!u.row)continue;
    u.row.classList.toggle('sel',sel.includes(u));
    const i=u.row.querySelector('i'),st=u.row.querySelector('.st');
    i.style.width=(u.dead?0:u.hp)+'%';i.style.background=u.hp>60?'var(--good)':u.hp>30?'var(--warn)':'var(--bad)';
    let txt='Ready',cls='st';
    if(u.dead){txt='KIA';cls+=' kia';}
    else if(u.downed){txt=u.revive>0?'Reviving':`Down ${Math.ceil(u.bleed)}s`;cls+=' down';}
    else if(u.sup>0.65){txt='Pinned';cls+=' pin';}
    else if(u.supT)txt='Suppress';
    else if(u.path.length)txt=u.gait==='sneak'?'Sneaking':'Running';
    else if(contact)txt=peekOf(u)?'Peeking':u.covered?'In cover':'Exposed';
    st.textContent=txt;st.className=cls;
  }
  for(const sec of document.querySelectorAll('.team')){
    const team=players.filter(p=>p.team===sec.dataset.team&&alive(p));
    sec.classList.toggle('sel',team.length>0&&team.every(p=>sel.includes(p)));
  }
  const act=sel.filter(alive);
  $('#supBtn').disabled=!act.length||!enemies.some(e=>!e.dead&&e.seen);
  $('#supBtn').classList.toggle('on',mode==='suppress');
  const one=act.length===1?act[0]:null;
  $('#nadeBtn').disabled=!one||!one.grenade;
  $('#nadeBtn').textContent=one?`Grenade ×${one.grenade}`:'Grenade';
  $('#nadeBtn').classList.toggle('on',mode==='grenade');
  $('#pauseBtn').textContent=paused?'Resume':'Pause';
  $('#boxBtn').classList.toggle('on',boxMode);
  const ts=timeScale();
  const sp=$('#speed');sp.hidden=!(state==='play'&&ts<1);sp.textContent=paused?'Paused':'Slow-mo';
  let h;
  if(boxMode)h='Drag across the map to box-select soldiers.';
  else if(mode==='suppress')h='Tap an enemy to pin him down. Pinned enemies barely shoot back.';
  else if(ptr&&ptr.kind==='draw')h=`Draw ${ptr.unit.name}'s route. Lift your finger to go. The end settles on cover nearby.`;
  else if(mode==='grenade')h='Tap inside the dashed circle to throw.';
  else if(preview)h='Green is in cover, red is exposed. Tap the marker again to move.';
  else if(!act.length)h='Drag the map to look around. Drag from a soldier to draw his route. Tap a soldier for his team.';
  else if(act.length===1)h=`Drag from ${act[0].name} to draw his route, or tap ground to send him. Tap a downed man to revive him.`;
  else h='Tap the ground to preview positions. Tap an enemy to focus fire.';
  $('#hint').textContent=h;
}
// detection indicator, updated every frame
let alertShown=-1;
function alertMeter(){
  const el=$('#alert');el.hidden=state!=='play';if(el.hidden)return;
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
function startView(){zoom=2.4;camT={x:190,z:700};clampCam();updateCamera();}
function bindHud(){
  for(const sec of document.querySelectorAll('.team'))sec.querySelector('header').addEventListener('click',()=>{if(state!=='play')return;selectTeam(sec.dataset.team);hud();});
  $('#boxBtn').addEventListener('click',()=>{if(state!=='play')return;boxMode=!boxMode;mode=null;preview=null;hud();});
  $('#allBtn').addEventListener('click',()=>{if(state!=='play')return;sel=players.filter(alive);preview=null;mode=null;hud();});
  $('#supBtn').addEventListener('click',()=>{if(state!=='play')return;mode=mode==='suppress'?null:'suppress';preview=null;hud();});
  $('#nadeBtn').addEventListener('click',()=>{if(state!=='play')return;sel=sel.filter(alive);if(sel.length!==1)return;mode=mode==='grenade'?null:'grenade';preview=null;hud();});
  $('#clearBtn').addEventListener('click',()=>{if(mode||preview){mode=null;preview=null;}else sel=[];hud();});
  $('#pauseBtn').addEventListener('click',()=>{if(state!=='play')return;paused=!paused;hud();});
  $('#startBtn').addEventListener('click',()=>{startView();$('#intro').hidden=true;state='play';banner('Move up. The warehouse is straight ahead.',3000);hud();});
  $('#againBtn').addEventListener('click',()=>{startView();$('#end').hidden=true;reset();state='play';hud();});
  addEventListener('keydown',e=>{
    if(state!=='play')return;
    if(e.code==='Space'){e.preventDefault();paused=!paused;hud();}
    else if(e.key==='Escape'){$('#clearBtn').click();}
    else if(e.key==='1'){selectTeam('A');hud();}else if(e.key==='2'){selectTeam('B');hud();}
  });
}
