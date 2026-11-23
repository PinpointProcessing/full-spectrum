/* Controls and HUD. Touch: left thumb moves (stick appears where you press), buttons on the right. Keyboard and mouse work too. */
const keys={};let stick=null,aimHold=0,mouseDown=false,camMode=0,camYaw=-PI/2;
let muted=false;
function toS(x,y,h){_v.set(x,h||0,y).project(camera);return[(_v.x+1)/2*cw,(1-_v.y)/2*ch,_v.z];}
const _ro=new T.Vector3(),_rd=new T.Vector3();
function toW(sx,sy){
  _ro.setFromMatrixPosition(camera.matrixWorld);
  _rd.set(sx/cw*2-1,-(sy/ch)*2+1,.5).unproject(camera).sub(_ro).normalize();
  if(_rd.y>-1e-4)return null;
  const t=-(_ro.y-10)/_rd.y;return[_ro.x+_rd.x*t,_ro.z+_rd.z*t];
}
addEventListener('keydown',e=>{
  if(e.target&&e.target.tagName==='INPUT')return;
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.code))e.preventDefault();
  if(e.repeat)return;
  keys[e.code]=true;
  if(state==='tv'){if(e.code==='Escape'||e.code==='KeyE'||e.code==='Enter')closeTV();return;}
  if(state!=='play')return;
  if(e.code==='Space'||e.code==='KeyJ')input.atkP=true;
  else if(e.code==='KeyF'||e.code==='KeyK')input.shootP=true;
  else if(e.code==='ShiftLeft'||e.code==='ShiftRight'||e.code==='KeyL')input.jumpP=true;
  else if(e.code==='KeyE'||e.code==='Enter')input.actP=true;
  else if(e.code==='KeyH')useAid();
  else if(e.code==='KeyC')$('#camBtn').click();
  else if(e.code==='KeyQ')swapMelee();
  else if(e.code==='KeyM')$('#muteBtn').click();
  else if(e.code==='KeyP'||e.code==='Escape')$('#pauseBtn').click();
});
addEventListener('keyup',e=>{keys[e.code]=false;});
addEventListener('blur',()=>{for(const k in keys)keys[k]=false;stick=null;input.shootH=false;input.atkH=false;});
function localXY(e){const r=ov.getBoundingClientRect();return[e.clientX-r.left,e.clientY-r.top];}
ov.addEventListener('pointerdown',e=>{
  if(state!=='play')return;
  const[sx,sy]=localXY(e);
  try{ov.setPointerCapture(e.pointerId);}catch(_){}
  if(e.pointerType==='mouse'){
    const w=toW(sx,sy);if(w){input.aimX=w[0];input.aimY=w[1];aimHold=.6;}
    if(e.button===2){input.shootP=true;input.shootH=true;}else{input.atkP=true;input.atkH=true;}
    mouseDown=true;return;
  }
  if(!stick&&sx<cw*.62)stick={id:e.pointerId,ox:sx,oy:sy,x:sx,y:sy};
  else if(!stick||e.pointerId!==stick.id)input.atkP=true;
});
ov.addEventListener('pointermove',e=>{
  const[sx,sy]=localXY(e);
  if(stick&&e.pointerId===stick.id){stick.x=sx;stick.y=sy;}
  else if(e.pointerType==='mouse'&&mouseDown){const w=toW(sx,sy);if(w){input.aimX=w[0];input.aimY=w[1];aimHold=.6;}}
});
function ptrEnd(e){if(stick&&e.pointerId===stick.id)stick=null;if(e.pointerType==='mouse'){mouseDown=false;input.shootH=false;input.atkH=false;}}
ov.addEventListener('pointerup',ptrEnd);ov.addEventListener('pointercancel',ptrEnd);
ov.addEventListener('contextmenu',e=>e.preventDefault());
let camZoom=1;
ov.addEventListener('wheel',e=>{e.preventDefault();camZoom=clamp(camZoom*Math.exp(e.deltaY*.0012),.6,1.5);},{passive:false});
function holdBtn(sel,down,up){
  const b=$(sel);
  b.addEventListener('pointerdown',e=>{e.preventDefault();if(state!=='play')return;b.classList.add('held');try{b.setPointerCapture(e.pointerId);}catch(_){}down();});
  const end=()=>{b.classList.remove('held');if(up)up();};
  b.addEventListener('pointerup',end);b.addEventListener('pointercancel',end);b.addEventListener('contextmenu',e=>e.preventDefault());
}
holdBtn('#atkBtn',()=>{input.atkP=true;input.atkH=true;input.aimX=null;},()=>{input.atkH=false;});
holdBtn('#shootBtn',()=>{input.shootP=true;input.shootH=true;input.aimX=null;},()=>{input.shootH=false;});
holdBtn('#jumpBtn',()=>{input.jumpP=true;});
holdBtn('#actBtn',()=>{input.actP=true;});
$('#swapBtn').addEventListener('click',swapMelee);
holdBtn('#healBtn',()=>useAid());
$('#camBtn').addEventListener('click',()=>{camMode=(camMode+1)%4;caption(['Camera: close','Camera: over the shoulder','Camera: wide','Camera: high'][camMode],null,1400);});
$('#muteBtn').addEventListener('click',()=>{muted=!muted;auMute(muted);$('#muteBtn').textContent=muted?'Unmute':'Mute';});
$('#pauseBtn').addEventListener('click',()=>{if(state!=='play')return;paused=!paused;$('#pauseBtn').textContent=paused?'Resume':'Pause';});
$('#bubble').addEventListener('click',()=>openTV());
$('#tvskip').addEventListener('click',()=>closeTV());
function pollInput(dt){
  let kx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),ky=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  if(stick){const dx=stick.x-stick.ox,dy=stick.y-stick.oy,d=hyp(dx,dy),R=44;if(d>R){stick.ox+=dx/d*(d-R);stick.oy+=dy/d*(d-R);}kx=clamp(dx/R,-1,1);ky=clamp(dy/R,-1,1);if(hyp(kx,ky)<.16)kx=ky=0;}
  const m=hyp(kx,ky);if(m>1){kx/=m;ky/=m;}
  if(camMode===1&&!reduced)camYaw+=kx*dt*1.5*(ky>0?-1:1)*(Math.abs(ky)>.2||Math.abs(kx)>.5?1:0);
  else if(camMode!==1)camYaw=-PI/2;
  const c=Math.cos(camYaw),s=Math.sin(camYaw);
  input.mx=-s*kx+c*(-ky);input.my=c*kx+s*(-ky);
  if(keys.Space||keys.KeyJ)input.atkH=true;else if(!mouseDown&&!$('#atkBtn').classList.contains('held'))input.atkH=false;
  if(input.atkH)input.atkP=true;
  if(keys.KeyF||keys.KeyK)input.shootH=true;else if(!mouseDown&&!$('#shootBtn').classList.contains('held'))input.shootH=false;
  if(aimHold>0){aimHold-=dt;if(aimHold<=0)input.aimX=null;}
}

/* ---- watching the TV ---- */
const tvc=$('#tvc').getContext('2d');
function openTV(){
  if(state!=='play'||tv.done)return;
  state='tv';tv.watch=true;EV.tvSeen=true;$('#tvview').hidden=false;$('#bubble').hidden=true;$('#hud').hidden=true;
  if(tv.mode!=='cast')tvStartCast();
  auInit();
}
function closeTV(){
  if(state!=='tv')return;
  state='play';tv.watch=false;$('#tvview').hidden=true;$('#hud').hidden=false;
  if(!tv.done&&AU.ctx)shutUp();
}

/* ---- HUD panels ---- */
function hudAllies(){
  const box=$('#allies');box.innerHTML='';
  for(const s of survs){
    if(!s.recruited)continue;
    const d=document.createElement('div');d.className='ally'+(s.dead?' dead':'');d.innerHTML=`<span>${s.name}</span><span class="hp"><i></i></span>`;box.appendChild(d);s.row=d;
  }
}
let hudTgt=null;
function hud(){
  if(!L)return;
  $('#youHp').firstElementChild.style.width=clamp(L.hp/L.maxhp*100,0,100)+'%';
  const kit=L.bag.length?L.bag.map((w,i)=>(i===L.hand?'':'(')+MELEE[w.kind].name+' '+Math.ceil(w.left/MELEE[w.kind].uses*100)+'%'+(i===L.hand?'':')')):[MELEE[L.melee].name];$('#swapBtn').hidden=L.bag.length<2;if(L.has.pistol)kit.push('Pistol '+L.ammo.pistol);if(L.has.shotgun)kit.push('Shotgun '+L.ammo.shotgun);
  $('#youKit').textContent=kit.join(' · ');
  for(const s of survs)if(s.row){s.row.classList.toggle('dead',s.dead);s.row.querySelector('i').style.width=clamp(s.hp/s.maxhp*100,0,100)+'%';}
  const sb=$('#shootBtn'),gun=L.has.pistol||L.has.shotgun;sb.hidden=!gun;
  if(gun)sb.lastElementChild.textContent=L.has.shotgun&&L.ammo.shotgun?`${L.ammo.pistol} + ${L.ammo.shotgun}`:L.ammo.pistol;
  const hb=$('#healBtn');hb.hidden=!L.aid;hb.lastElementChild.textContent='×'+L.aid;
  { const ac=state==='play'?actionFor():null,b=$('#actBtn');b.textContent=ac?ac.label:'Action';b.classList.toggle('cool',!ac);b.classList.toggle('hot',!!ac&&ac.label!=='Looking'); }
  $('#atkBtn').textContent=L.anim==='crank'?'Turning':'Attack';
  // the bubble over the TV
  const showB=state==='play'&&!tv.done&&(tv.mode==='alert'||tv.mode==='cast')&&inHouse(L.x,L.y);
  $('#bubble').hidden=!showB;
  hudTgt=state==='play'&&(L.has.pistol&&L.ammo.pistol||L.has.shotgun&&L.ammo.shotgun)?shootTarget(aimDir()):null;
  const low=L.hp/L.maxhp<.3&&!L.dead;
  $('#hurt').style.opacity=Math.max(hurtFlash,low?.35+Math.sin(performance.now()/160)*.15:0).toFixed(2);
}
function label(text,x,y,col,size,weight){
  ox.font=`${weight||600} ${size||11}px ${HUDFONT}`;ox.textAlign='center';ox.textBaseline='middle';
  ox.lineWidth=3;ox.strokeStyle='rgba(0,0,0,.85)';ox.strokeText(text,x,y);ox.fillStyle=col;ox.fillText(text,x,y);
}
function bar(x,y,w,frac,col){ox.fillStyle='rgba(0,0,0,.7)';ox.fillRect(x-1,y-1,w+2,5);ox.fillStyle=col;ox.fillRect(x,y,w*clamp(frac,0,1),3);}
function edgeArrow(sx,sy,behind,col,text){
  // an arrow pinned to the screen edge, pointing at something out of view
  const cx=cw/2,cy=ch/2;let dx=sx-cx,dy=sy-cy;if(behind){dx=-dx;dy=Math.abs(dy)+ch;}
  const m=44,k=Math.min((cx-m)/Math.abs(dx||1e-6),(cy-m)/Math.abs(dy||1e-6)),px=cx+dx*k,py=cy+dy*k,a=Math.atan2(dy,dx);
  ox.save();ox.translate(px,py);ox.rotate(a);ox.fillStyle=col;ox.strokeStyle='rgba(0,0,0,.8)';ox.lineWidth=2;
  ox.beginPath();ox.moveTo(12,0);ox.lineTo(-6,-8);ox.lineTo(-2,0);ox.lineTo(-6,8);ox.closePath();ox.stroke();ox.fill();ox.restore();
  if(text)label(text,clamp(px-Math.cos(a)*26,40,cw-40),clamp(py-Math.sin(a)*22,16,ch-16),col,10,700);
}
function onScreen(p){return p[2]<1&&p[0]>10&&p[0]<cw-10&&p[1]>10&&p[1]<ch-10;}
function drawOverlay(now){
  ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
  if(!L||state==='intro'||state==='tv'||state==='shelter'||state==='end'||state==='escape')return;
  const pulse=(Math.sin(now*5)+1)/2;
  // where to go
  if(EV.out&&!L.dead){
    const g=!EV.channel?[365,250]:!EV.open?[VALVE.x,VALVE.y]:[360,60];
    const p=toS(g[0],g[1],EV.channel&&!EV.open?16:10),d=Math.round(hyp(g[0]-L.x,g[1]-L.y)/10);
    if(onScreen(p)){if(EV.channel){ox.beginPath();ox.arc(p[0],p[1],10+pulse*4,0,TAU);ox.strokeStyle=COL.warn;ox.lineWidth=2;ox.stroke();label(EV.open?'INSIDE':'TURN THE WHEEL',p[0],p[1]-22,COL.warn,11,700);}}
    else edgeArrow(p[0],p[1],p[2]>1,'#ffd9a0',(EV.channel?'':'DRAIN ')+d+' m');
  }
  // things within reach that have not been gone through yet, and the search in progress
  if(state==='play'&&!L.dead){
    const near=L.search?L.search.o:searchNear();
    for(const o of SEARCH){if(o.searched||o===near)continue;const cx=o.x+o.w/2,cy=o.y+o.h/2;if(hyp(cx-L.x,cy-L.y)>70)continue;const p=toS(cx,cy,o.tall?24:12);if(!onScreen(p))continue;ox.beginPath();ox.arc(p[0],p[1],3,0,TAU);ox.fillStyle='rgba(255,236,190,.55)';ox.fill();}
    if(near){const p=toS(near.x+near.w/2,near.y+near.h/2,near.tall?26:14);
      ox.lineWidth=4;ox.strokeStyle='rgba(0,0,0,.55)';ox.beginPath();ox.arc(p[0],p[1],11,0,TAU);ox.stroke();
      if(L.search){ox.strokeStyle=COL.good;ox.beginPath();ox.arc(p[0],p[1],11,-PI/2,-PI/2+clamp(L.search.t/L.search.dur,0,1)*TAU);ox.stroke();}
      else{ox.lineWidth=2;ox.strokeStyle='rgba(255,236,190,'+(.55+pulse*.4).toFixed(2)+')';ox.beginPath();ox.arc(p[0],p[1],11,0,TAU);ox.stroke();label('SEARCH',p[0],p[1]-20,'#ffecbe',10,700);}}
  }
  // valve progress and fuse
  if(EV.channel&&!EV.open&&EV.crank>0){const p=toS(VALVE.x,VALVE.y,30);ox.lineWidth=5;ox.strokeStyle='rgba(0,0,0,.6)';ox.beginPath();ox.arc(p[0],p[1],16,0,TAU);ox.stroke();ox.strokeStyle=COL.good;ox.beginPath();ox.arc(p[0],p[1],16,-PI/2,-PI/2+EV.crank*TAU);ox.stroke();label(Math.round(EV.crank*100)+'%',p[0],p[1],'#fff',10,700);}
  if(EV.fuse>0&&!EV.boomed){const p=toS(411,871,34);if(onScreen(p))label('!  '+EV.fuse.toFixed(1),p[0],p[1]-pulse*3,COL.bad,15,700);}
  // people waiting for help
  for(const s of survs){
    if(s.recruited||s.dead)continue;const d=hyp(s.x-L.x,s.y-L.y);if(d>460||!EV.out)continue;
    const p=toS(s.x,s.y,(s.z||0)+30);
    if(onScreen(p)){label(s.hidden?'SOMEONE’S IN THE CAR':s.quiet?'':'HELP',p[0],p[1]-6-pulse*3,COL.ally,11,700);
      if(d<110&&zeds.some(z=>!z.dead&&hyp(z.x-s.x,z.y-s.y)<62))label('clear them off',p[0],p[1]+8,'#fff',10,500);}
    else if(!s.quiet)edgeArrow(p[0],p[1],p[2]>1,COL.ally,'HELP');
  }
  // items close by
  for(const it of items){if(it.taken)continue;const d=hyp(it.x-L.x,it.y-L.y);if(d>130)continue;const p=toS(it.x,it.y,17);if(onScreen(p))label(ITEMN[it.kind],p[0],p[1],'#f4e3b6',10,600);}
  // zombies: health once hurt, warning arrows for the ones coming from off-screen
  for(const z of zeds){
    if(z.dead||z.far)continue;const d=hyp(z.x-L.x,z.y-L.y);
    const p=toS(z.x,z.y,(z.z||0)+(z.ztype==='brute'?30:23));
    if(onScreen(p)){
      if(z.hp<z.maxhp&&d<300)bar(p[0]-(z.boss?20:9),p[1]-4,z.boss?40:18,z.hp/z.maxhp,COL.bad);
      if(z.boss&&d<300)label('BIG EARL',p[0],p[1]-13,'#ffb020',10,700);
      if(z.as==='wind'&&z.tgt===L){ox.beginPath();ox.arc(p[0],p[1]-14,4+pulse*2,0,TAU);ox.fillStyle=COL.bad;ox.fill();}
      if(z===hudTgt){const q=toS(z.x,z.y,12),r=11;ox.strokeStyle='rgba(255,210,74,.95)';ox.lineWidth=2;for(let i=0;i<4;i++){const a=i*PI/2+now*2;ox.beginPath();ox.arc(q[0],q[1],r,a,a+.8);ox.stroke();}}
    }else if(z.state==='chase'&&z.tgt===L&&d<170)edgeArrow(p[0],p[1],p[2]>1,COL.bad);
  }
  // your people
  for(const a of allies){if(a.dead)continue;const p=toS(a.x,a.y,24);if(!onScreen(p))continue;label(a.name,p[0],p[1]-7,COL.ally,10,700);if(a.hp<a.maxhp)bar(p[0]-9,p[1],18,a.hp/a.maxhp,COL.ally);}
  for(const f of floats){const life=f.text.length>18?2.6:1.5,p=toS(f.x,f.y,f.h),k=f.t/life;if(p[2]>1)continue;ox.globalAlpha=1-Math.max(0,k-.6)/.4;label(f.text,clamp(p[0],60,cw-60),p[1]-k*22,f.col,12,700);ox.globalAlpha=1;}
  // the stick
  if(stick){ox.beginPath();ox.arc(stick.ox,stick.oy,44,0,TAU);ox.fillStyle='rgba(255,255,255,.06)';ox.fill();ox.strokeStyle='rgba(255,255,255,.28)';ox.lineWidth=1.5;ox.stroke();
    ox.beginPath();ox.arc(stick.x,stick.y,20,0,TAU);ox.fillStyle='rgba(255,255,255,.3)';ox.fill();}
  if(paused){ox.fillStyle='rgba(0,0,0,.45)';ox.fillRect(0,0,cw,ch);label('PAUSED',cw/2,ch/2,'#fff',26,700);}
}

/* ---- after the level: who made it, and what do they call you ---- */
function showEnd(){
  state='end';
  const saved=allies.filter(a=>!a.dead),lost=survs.filter(s=>s.recruited&&s.dead),left=survs.filter(s=>!s.recruited&&!s.dead).length;
  const t=Math.floor(simT),mm=Math.floor(t/60),ss=String(t%60).padStart(2,'0');
  $('#endEyebrow').textContent='Day one · the storm drain';$('#endTitle').textContent='You made it';
  $('#endText').textContent=(saved.length?`The grate holds. ${saved.length===1?saved[0].name+' is':saved.map(a=>a.name).join(', ').replace(/, ([^,]*)$/,' and $1')+' are'} looking at you, waiting for what comes next.`:'The grate holds. It’s just you and the dark.')+' What do they call you?';
  $('#endStats').innerHTML=`<div><b>${mm}:${ss}</b><span>Time</span></div><div><b>${saved.length}/4</b><span>Rescued</span></div><div><b>${stats.kills}</b><span>Kills</span></div><div><b>${stats.shots}</b><span>Shots</span></div>`;
  $('#nameForm').hidden=false;$('#roster').hidden=true;$('#againBtn').hidden=true;
  let prev='';try{prev=localStorage.getItem('fl-name')||'';}catch(e){}
  $('#nameInput').value=prev;$('#end').hidden=false;
  showEnd.data={saved,lost,left};
}
$('#nameForm').addEventListener('submit',e=>{
  e.preventDefault();
  const name=($('#nameInput').value||'').trim().replace(/[<>&]/g,'')||'You';
  L.name=name;$('#youName').textContent=name;try{localStorage.setItem('fl-name',name);}catch(_){}
  const{saved,lost,left}=showEnd.data;
  $('#endTitle').textContent='Shelter';
  $('#endText').textContent=`${name} leads ${saved.length?saved.length+(saved.length===1?' survivor':' survivors'):'nobody but themselves'} out of Sycamore Court. The drain is dry, hidden, and has one way in. It will do for a first base.`+(left?` ${left} ${left===1?'person was':'people were'} left calling for help.`:'');
  $('#roster').innerHTML=`<li class="lead"><b>${name}</b><span>leader</span></li>`+saved.map(a=>`<li><b>${a.name}</b><span>${a.role}</span></li>`).join('')+lost.map(a=>`<li class="lost"><b>${a.name}</b><span>didn’t make it</span></li>`).join('');
  $('#nameForm').hidden=true;$('#roster').hidden=false;$('#againBtn').hidden=false;sfx('join');
});
function startGame(fromDoor){
  auInit();
  for(const id of['#intro','#dead','#end'])$(id).hidden=true;
  reset(fromDoor);state='play';$('#hud').hidden=false;camSnap=true;
}
$('#startBtn').addEventListener('click',()=>startGame(false));
$('#retryBtn').addEventListener('click',()=>startGame(false));
$('#retryDoorBtn').addEventListener('click',()=>startGame(true));
$('#againBtn').addEventListener('click',()=>startGame(false));
