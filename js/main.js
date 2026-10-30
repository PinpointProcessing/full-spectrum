"use strict";
/* Entry point, loaded last: viewport resize, the frame loop, and boot. */
function resize(){
  const r=stage.getBoundingClientRect();
  cw=Math.max(1,r.width);ch=Math.max(1,r.height);
  dpr=Math.min(2,window.devicePixelRatio||1);
  renderer.setPixelRatio(Math.min(1.5,dpr));renderer.setSize(cw,ch,false);
  ov.width=Math.round(cw*dpr);ov.height=Math.round(ch*dpr);
  camera.aspect=cw/ch;camera.updateProjectionMatrix();
  fitDist();initRain();
}

/* ---------- loop ---------- */
let last=performance.now(),hudT=0;
function frame(nowMs){
  const rdt=Math.min(.05,(nowMs-last)/1000);last=nowMs;
  if(state==='play'){
    const dt=rdt*timeScale();if(dt>0)update(dt);
    if(!reduced&&!paused){stormT-=rdt;if(stormT<=0){storm=1;stormT=18+Math.random()*25;}}
    if(endAt&&nowMs>=endAt)finish();
  }
  if(!ptr&&!pinch&&(Math.abs(inertia.vx)+Math.abs(inertia.vy))>3){camT.x+=inertia.vx*rdt;camT.z+=inertia.vy*rdt;clampCam();const k=Math.exp(-rdt*5);inertia.vx*=k;inertia.vy*=k;}
  storm=Math.max(0,storm-rdt*6);
  edgePan(rdt);alertMeter();drawCards(rdt);waveHud();aimTurret();
  render(rdt,nowMs/1000);
  hudT-=rdt;if(hudT<=0){hudT=.15;hud();}
  requestAnimationFrame(frame);
}

/* ---------- boot ---------- */
if(!initGL())$('#nogl').hidden=false;
else{
  bindInput();bindHud();
  buildWorld();reset();
  new ResizeObserver(resize).observe(stage);resize();
  hud();
  requestAnimationFrame(frame);
}
