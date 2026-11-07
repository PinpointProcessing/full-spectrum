"use strict";
/* Entry point, loaded last: viewport resize, the frame loop, and boot. */
function resize(){
  const r=stage.getBoundingClientRect();
  cw=Math.max(1,r.width);ch=Math.max(1,r.height);
  dpr=Math.min(2,window.devicePixelRatio||1);
  renderer.setPixelRatio(POST.tier===0?1:Math.min(1.5,dpr));renderer.setSize(cw,ch,false);
  ov.width=Math.round(cw*dpr);ov.height=Math.round(ch*dpr);
  camera.aspect=cw/ch;camera.updateProjectionMatrix();
  fitDist();initRain();postSize();
}

/* ---------- loop ---------- */
let last=performance.now(),hudT=0;
/* The next frame is asked for first, and each part of a frame runs on its own (guard): an error in one used to stop the loop
   for good, the picture frozen on its last frame (Bryan, v108: "The game froze when I was at the sniper tower": the see-through
   fade threw on the data center's block). Now that frame's part is skipped, the game carries on, and the error is shown once,
   short, so a screenshot says where (gameError), and kept in localStorage (warehouseYard.lastError). */
const ERR={seen:new Set(),t:-1e9};
function gameError(where,err){
  const msg=String(err&&err.message||err),key=where+':'+msg;if(ERR.seen.has(key))return;ERR.seen.add(key);
  const at=String(err&&err.stack||'').split('\n').map(l=>l.trim()).find(l=>/\.js:\d+/.test(l))||'';
  const spot=(at.match(/([\w-]+\.js):(\d+)/)||[]).slice(1).join(':');
  console.error('[game]',where,err);
  try{localStorage.setItem('warehouseYard.lastError',JSON.stringify({where,msg,at:spot,stack:String(err&&err.stack||'').split('\n').slice(0,6).join(' | '),when:Date.now()}));}catch(e){}
  const now=performance.now();if(now-ERR.t<8000)return;ERR.t=now;
  try{banner(`Something went wrong (${where}${spot?' · '+spot:''}: ${msg.slice(0,90)}). The game carried on.`,7000);}catch(e){}
}
function guard(where,f){try{f();}catch(err){gameError(where,err);}}
function frame(nowMs){
  requestAnimationFrame(frame);   // (first: whatever goes wrong below, the next frame still comes)
  const raw=(nowMs-last)/1000,rdt=Math.min(.05,raw);last=nowMs;guard('frame',()=>postWatch(raw));
  if(state==='equip'){guard('equip',()=>{equipFrame(rdt,nowMs/1000);audioFrame();markAlive(rdt);});return;}   // between missions: the squad at sea (equip.js)
  if(state==='play')guard('update',()=>{
    const dt=rdt*timeScale();if(dt>0)update(dt);
    if(!reduced&&!paused&&MAPID!=='in'&&MAPID!=='tun'&&!hqIndoors()&&!l4In()){stormT-=rdt;if(stormT<=0){storm=1;stormT=18+Math.random()*25;sfxThunder();}}   // no lightning indoors
    if(endAt&&nowMs>=endAt)finish();
  });
  guard('frame',()=>{
    if(!ptr&&!pinch&&(Math.abs(inertia.vx)+Math.abs(inertia.vy))>3){camT.x+=inertia.vx*rdt;camT.z+=inertia.vy*rdt;clampCam();const k=Math.exp(-rdt*5);inertia.vx*=k;inertia.vy*=k;}
    storm=Math.max(0,storm-rdt*6);
    edgePan(rdt);alertMeter();waveHud();threatHud();alertHud();aimTurret();panTick(rdt);audioFrame();markAlive(rdt);   // (edgePan: a route being drawn near the view's edge, input.js)
  });
  guard('render',()=>render(rdt,nowMs/1000));
  hudT-=rdt;if(hudT<=0){hudT=.15;guard('hud',hud);}
}

/* ---------- an unexpected restart ----------
   A phone that runs out of memory reloads the page (Bryan hit it in the office building's basement: "the game went haywire
   and went into a menu"). While a game is on, where the squad is gets noted for this tab every few seconds; a normal close or
   reload clears it, so if it's still there at boot the last run ended without warning, and the intro card says so. */
let aliveT=0;
function markAlive(rdt){
  if((aliveT-=rdt)>0)return;aliveT=3;
  try{if(state!=='play'){sessionStorage.removeItem('wy.alive');return;}
    sessionStorage.setItem('wy.alive',MAPID==='l4'?`in Level 4, ${{SU:'the summit',ST:'the stairs',PL:'the plant'}[curFloor]||'the hill'}`:MAPID==='l1'?'in Level 1':MAPID==='l2'?'in Level 2':MAPID==='in'?`inside the data center, ${{GF:'ground floor',B1:'basement','1F':'top floor'}[curFloor]||curFloor}`:`outside, objective ${Math.min(5,obj+1)}`);}catch(e){}
}
function crashNote(){
  try{const w=sessionStorage.getItem('wy.alive');if(!w)return;const n=$('#crashNote');
    n.textContent=`The game restarted unexpectedly (you were ${w}). That usually means the phone ran low on memory. ${w==='in Level 1'?'Level 1 starts again from the beach.':w==='in Level 2'?'Level 2 starts again from the cove.':'Continue picks up at the last save.'}`;n.hidden=false;}catch(e){}
}
addEventListener('pagehide',()=>{try{sessionStorage.removeItem('wy.alive');}catch(e){}});

/* ---------- boot ---------- */
if(!initGL())$('#nogl').hidden=false;
else{
  postInit();
  bindInput();bindHud();bindAudio();bindVoice();bindFloors();bindEquip();bindTalk();refreshSaveButtons();crashNote();
  buildWorld();reset();
  new ResizeObserver(resize).observe(stage);resize();
  hud();
  requestAnimationFrame(frame);
}
