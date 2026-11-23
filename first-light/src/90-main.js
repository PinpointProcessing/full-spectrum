/* Camera, quality scaling, and the frame loop. */
let composer=null,bloom=null,camSnap=true,insideNow=false,inK=0;
const cam={x:296,y:1362,h:12,yaw:-PI/2,pitch:.5,dist:150};
function setupFX(){
  if(!T.EffectComposer||!T.UnrealBloomPass||!T.RenderPass)return;
  try{
    const sz=renderer.getDrawingBufferSize(new T.Vector2());
    const RT=renderer.capabilities.isWebGL2&&T.WebGLMultisampleRenderTarget?T.WebGLMultisampleRenderTarget:T.WebGLRenderTarget;
    const rt=new RT(sz.x,sz.y,{minFilter:T.LinearFilter,magFilter:T.LinearFilter,format:T.RGBAFormat});rt.texture.encoding=T.sRGBEncoding;
    composer=new T.EffectComposer(renderer,rt);
    composer.addPass(new T.RenderPass(scene,camera));
    bloom=new T.UnrealBloomPass(new T.Vector2(sz.x/2,sz.y/2),.62,.55,.8);
    if(bloom.basic)bloom.basic.toneMapped=false;
    composer.addPass(bloom);
  }catch(e){composer=null;}
}
function applyQ(){
  renderer.setPixelRatio(Math.min(Q.level>=2?1.5:1,dpr));renderer.setSize(cw,ch,false);
  if(composer){composer.setPixelRatio(renderer.getPixelRatio());composer.setSize(cw,ch);}
  if(sun){
    const ms=Q.level>=2?2048:1024;
    if(sun.shadow.mapSize.x!==ms){sun.shadow.mapSize.set(ms,ms);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
    sun.castShadow=Q.level>=1;
  }
  for(const ps of[pFire,pSmoke,pDrop])if(ps)ps.m.uniforms.scale.value=ch*renderer.getPixelRatio()*.5/Math.tan(camera.fov*PI/360);
}
function resize(){
  const r=stage.getBoundingClientRect();cw=Math.max(1,r.width);ch=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);
  ov.width=Math.round(cw*dpr);ov.height=Math.round(ch*dpr);
  camera.aspect=cw/ch;camera.fov=cw/ch<1?58:44;camera.updateProjectionMatrix();
  applyQ();
}
function camTick(dt){
  if(state==='shelter'||state==='end'){
    const t=performance.now()/1000;
    camera.position.set(360+Math.sin(t*.25)*4,19+Math.sin(t*.4)*.6,11);camera.lookAt(360,7,84);camera.updateMatrixWorld();return;
  }
  const portrait=cw/ch<1,inside=inHouse(L.x,L.y);
  let tp,td,th=12,lead=.2;
  const indoors=insideNow;
  if(camMode===1){tp=.3;td=84;th=16;lead=.1;}
  else if(camMode===3){tp=1.02;td=portrait?300:250;}
  else if(camMode===2){tp=portrait?.5:.4;td=portrait?178:150;if(indoors){tp+=.16;td*=.74;}}
  else{tp=portrait?.46:.36;td=portrait?118:102;th=14;lead=.3;if(indoors){tp=.92;td=portrait?132:104;th=8;lead=.15;}}      // close: the default
  td*=camZoom;
  let fx=L.x+L.vx*lead,fy=L.y+L.vy*lead;
  if(state==='tv'){fx=TVPOS.x;fy=TVPOS.y+18;tp=.16;td=58;th=17;}
  const k=camSnap?1:1-Math.exp(-dt*(state==='tv'?2.2:7));
  cam.x+=(fx-cam.x)*k;cam.y+=(fy-cam.y)*k;cam.h+=(th-cam.h)*k;
  cam.pitch+=(tp-cam.pitch)*(camSnap?1:1-Math.exp(-dt*3));cam.dist+=(td-cam.dist)*(camSnap?1:1-Math.exp(-dt*3));
  cam.yaw=camSnap?camYaw:cam.yaw+angDiff(cam.yaw,camYaw)*(1-Math.exp(-dt*6));
  camSnap=false;
  const cp=Math.cos(cam.pitch),sp=Math.sin(cam.pitch),cx=cam.x-Math.cos(cam.yaw)*cam.dist*cp,cy=cam.y-Math.sin(cam.yaw)*cam.dist*cp;
  shakeAmt*=Math.exp(-dt*9);
  const sx=reduced?0:(Math.random()-.5)*shakeAmt,sy=reduced?0:(Math.random()-.5)*shakeAmt;
  camera.position.set(cx+sx,cam.h+cam.dist*sp+sy,cy+sx*.5);
  camera.lookAt(cam.x+Math.cos(cam.yaw)*18,cam.h,cam.y+Math.sin(cam.yaw)*18);camera.updateMatrixWorld();
  cam.cx=cx;cam.cy=cy;
}
let inLight=null,last=performance.now(),hudT=0,fireSnd=0;
function frame(nowMs){
  requestAnimationFrame(frame);
  const rdt=Math.min(.05,(nowMs-last)/1000),now=nowMs/1000;last=nowMs;
  let dt=0;
  if(L){
    pollInput(rdt);
    if(state==='play'||state==='dying'){
      dt=rdt;
      if(paused)dt=0;else if(hitStop>0){hitStop-=rdt;dt=0;}else if(slowT>0){slowT-=rdt;dt*=.22;}
      if(dt>0){update(dt);tvTick(dt,inHouse(L.x,L.y)&&state==='play');}
    }else if(state==='tv'){
      tvTick(rdt,true);
      tvc.drawImage(tvCan,0,0,480,270);$('#tvsub').innerHTML=tvSubHTML();
      if(tv.done&&!EV.tvEnd){EV.tvEnd=true;setTimeout(closeTV,1400);}
    }
    input.atkP=input.shootP=input.jumpP=input.actP=false;
    // in-world TV subtitles when you're in the house but not watching
    if(state==='play'&&tv.mode==='cast'&&tv.sub&&inHouse(L.x,L.y)){const c=$('#cap');c.innerHTML=`<b>TV${tv.sub.who?' · '+tv.sub.who:''}</b>`+tv.sub.text;c.classList.add('show');clearTimeout(capTimer);capTimer=setTimeout(()=>c.classList.remove('show'),700);}
    // figures
    const adt=state==='shelter'||state==='end'||state==='tv'?rdt:dt;
    for(const u of ents){
      if(u.gone||!u.fig)continue;
      const du=hyp(u.x-cam.x,u.y-cam.y),vis=!(u.kind==='z'&&u.far)&&!u.hidden&&du<(Q.level<=1?440:580);
      const sh=du<(Q.level>=2?250:150)&&u.kind!=='you'||u.kind==='you';
      if(u.fig.sh!==sh){u.fig.sh=sh;u.fig.g.traverse(o=>{if(o.isMesh&&(o.material===u.fig.mat||o.material===u.fig.hmat))o.castShadow=sh;});}
      if(u.fig.g.visible!==vis)u.fig.g.visible=vis;
      if(!vis||(u.dead&&u.deadT>1.4&&!u.fig.flash))continue;
      if(adt>0||camSnap)figAnim(u.fig,u,adt||.016,now);
    }
    // indoors is its own place: the daylight drops away, the lamps carry the room, the street goes dim and quiet
    insideNow=state==='tv'||inHouse(L.x,L.y)||inSafe(L.x,L.y)||ROOMS.some(R=>inRoom(R,L.x,L.y));
    inK+=((insideNow?1:0)-inK)*(1-Math.exp(-rdt*3));
    if(state==='play'||state==='tv'||state==='dying'){sun.intensity=lerp(1.15,.22,inK);hemi.intensity=lerp(.56,.3,inK);scene.fog.density=lerp(.00135,.0034,inK);inLight.intensity=1.5*inK;inLight.position.set(L.x,21,L.y);}
    else inLight.intensity=0;
    camTick(rdt);
    const wdt=paused?0:rdt;
    lightsTick(wdt,now,cam.x,cam.y);
    if(wdt>0){fireTick(wdt,cam.x,cam.y);partsTick(pFire,wdt);partsTick(pSmoke,wdt);partsTick(pDrop,wdt);streaksTick(wdt);for(const f of world.tick)f(wdt,now);}
    const cpx=camera.position.x,cpz=camera.position.z;
    fadeTick(rdt,cpx,cpz,L.x,L.y,inHouse(L.x,L.y)||inSafe(L.x,L.y)||ROOMS.some(R=>inRoom(R,L.x,L.y))||state==='tv'||(cpx>HS.x0-40&&cpx<HS.x1+40&&cpz>HS.y0-20&&cpz<HS.y1+90));
    // screen glow from the TV, cop lights
    const tvOn=tv.mode!=='dead'||Math.floor(now*2)%2;tvLight.intensity=(tvOn?1.5:.7)+Math.sin(now*11)*.25+Math.random()*.2;
    tvLight.color.setHex(tv.mode==='morning'?0xffc890:tv.mode==='cast'&&tv.t<CAST_STATIC?0x8fb4ff:tv.mode==='cast'&&tv.t<CAST_CARD?0xdddddd:0xff5a48);
    for(const b of copBars)b.m.material.color.setHex(b.e.k>.5?b.c:0x1a0a0a);
    for(const o of objs)if(o.winMat)o.winMat.color.setRGB(1,.75+Math.random()*.25,.6+Math.random()*.2);
    if(wdt>0&&AU.ctx){fireSnd-=wdt;if(fireSnd<=0){fireSnd=rand(.05,.3);let nf=1e9,ff=null;for(const f of world.fires)if(f.on&&f.rate>0){const d=hyp(f.x-L.x,f.y-L.y);if(d<nf){nf=d;ff=f;}}if(ff&&nf<260)sfx('spark',ff.x,ff.y,.25,300);}ambTick();}
    hurtFlash=Math.max(0,hurtFlash-rdt*2.4);
  }else camera.updateMatrixWorld();
  if(world.sky)world.sky.position.set(camera.position.x,-40,camera.position.z);
  if(composer&&Q.level>=3)composer.render();else renderer.render(scene,camera);
  drawOverlay(now);
  // the bubble follows the TV on screen
  if(L&&!$('#bubble').hidden){const p=toS(TVPOS.x,TVPOS.y,TVPOS.h+11);const b=$('#bubble');b.style.left=clamp(p[0],90,cw-90)+'px';b.style.top=clamp(p[1],60,ch-215)+'px';}
  hudT-=rdt;if(hudT<=0){hudT=.1;hud();}
  // drop quality if the device can't keep up
  if(Q.auto&&state==='play'&&!paused){
    Q.warm+=rdt;if(Q.warm>3){Q.acc+=rdt;Q.n++;
      if(Q.n>=90){const avg=Q.acc/Q.n;Q.acc=0;Q.n=0;if(avg>1/27&&Q.level>0){Q.level--;applyQ();Q.warm=1.5;}}}
  }
}
function boot(){
  aiInit();
  buildWorld();buildActors();setupFX();
  inLight=new T.PointLight(0xffcf9a,0,190,1.4);scene.add(inLight);
  new ResizeObserver(resize).observe(stage);resize();
  // everyone in the level is sculpted before it starts, one figure per tick so the title card stays alive
  const btn=$('#startBtn'),label=btn.textContent;btn.disabled=true;
  preloadFigs(STYLES,(i,n)=>{btn.textContent='Sculpting the cast '+(i+1)+' / '+n;},()=>{
    btn.disabled=false;btn.textContent=label;
    reset(false);
    // a still frame behind the title card
    camSnap=true;tvTick(0,false);
    requestAnimationFrame(frame);
  });
}
boot();
