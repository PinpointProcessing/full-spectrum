/* The lab stage: the chosen design on a turntable, with poses, a bat on/off switch, slow motion and a game-camera view. */
scene.fog=null;scene.background=new T.Color(0x23262d);
renderer.toneMappingExposure=1.08;
let pose='stand',spin=-.5,spinOn=false,gameView=false,slow=false,bat=true,camPitch=.1,zoomK=1,swingT=0;
{
  const floor=new T.Mesh(new T.CircleGeometry(500,64),new T.ShadowMaterial({opacity:.42}));floor.rotation.x=-PI/2;floor.receiveShadow=true;scene.add(floor);
  const disc=new T.Mesh(new T.CircleGeometry(500,64),new T.MeshBasicMaterial({color:0x2c3038}));disc.rotation.x=-PI/2;disc.position.y=-.05;scene.add(disc);
  scene.add(new T.HemisphereLight(0xdfe6ff,0x2a2622,.62));
  const key=new T.DirectionalLight(0xfff1e0,1.0);key.position.set(70,130,110);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-40,right:40,top:40,bottom:-25,near:20,far:400});key.shadow.bias=-.0008;key.shadow.normalBias=.3;scene.add(key);
  const fill=new T.DirectionalLight(0xa8c0ff,.36);fill.position.set(-90,40,70);scene.add(fill);
  const rim=new T.DirectionalLight(0xffc890,.55);rim.position.set(-30,70,-120);scene.add(rim);
}
const fig=makeFig({style:STYLES[0]}),unit={x:0,y:0,ang:PI/2,spd:0,atk:null,ready:false};
setWeapon(fig,'bat');
function setPose(p){pose=p;swingT=0;for(const o of document.querySelectorAll('#poses [data-pose]'))o.classList.toggle('on',o.dataset.pose===p);}
for(const b of document.querySelectorAll('#poses [data-pose]'))b.addEventListener('click',()=>setPose(b.dataset.pose));
const tog=(id,fn)=>$(id).addEventListener('click',()=>{$(id).classList.toggle('on',fn());});
tog('#batBtn',()=>{bat=!bat;setWeapon(fig,bat?'bat':null);return bat;});
tog('#slowBtn',()=>slow=!slow);tog('#gameBtn',()=>gameView=!gameView);tog('#spinBtn',()=>spinOn=!spinOn);
const ptrs=new Map();let pinch0=0;
ov.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{ov.setPointerCapture(e.pointerId);}catch(_){}if(ptrs.size===2){const p=[...ptrs.values()];pinch0=hyp(p[0].x-p[1].x,p[0].y-p[1].y)/zoomK;}});
ov.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===2){const q=[...ptrs.values()];zoomK=clamp(hyp(q[0].x-q[1].x,q[0].y-q[1].y)/pinch0,.6,4);return;}
  spin-=dx*.012;camPitch=clamp(camPitch+dy*.004,-.15,.9);if(Math.abs(dx)>2&&spinOn){spinOn=false;$('#spinBtn').classList.remove('on');}
});
const pend=e=>ptrs.delete(e.pointerId);ov.addEventListener('pointerup',pend);ov.addEventListener('pointercancel',pend);
ov.addEventListener('wheel',e=>{e.preventDefault();zoomK=clamp(zoomK*Math.exp(-e.deltaY*.0012),.6,4);},{passive:false});
const cam={y:10,d:60,p:.1};
function resize(){
  const r=stage.getBoundingClientRect();cw=Math.max(1,r.width);ch=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);
  renderer.setPixelRatio(dpr);renderer.setSize(cw,ch,false);camera.aspect=cw/ch;camera.fov=30;camera.near=1;camera.far=2000;camera.updateProjectionMatrix();
}
let last=performance.now(),simNow=0;
function frame(ms){
  requestAnimationFrame(frame);
  const rdt=Math.min(.05,(ms-last)/1000),dt=rdt*(slow?.2:1);last=ms;simNow+=dt;
  if(spinOn&&!gameView)spin+=rdt*.5;
  swingT+=dt;
  const u=unit;
  u.ang=gameView?-PI/2+Math.sin(simNow*.5)*.5:PI/2+spin;
  u.spd=pose==='walk'?26:pose==='run'?62:0;u.ready=pose==='ready';u.atk=null;
  if(pose==='swing'||pose==='smash'){const per=1.25,cyc=swingT%per,n=Math.floor(swingT/per),dur=pose==='smash'?.56:.48;u.ready=true;if(cyc<dur)u.atk={t:cyc,dur,type:pose==='smash'?2:n%2};}
  if(window.__atk){u.atk=window.__atk;u.ready=true;}
  figAnim(fig,u,dt,simNow);
  const tanH=Math.tan(camera.fov*PI/360),tanW=tanH*camera.aspect;
  let ty=10.4,td=Math.max(9.5/tanW,14/tanH)/zoomK,tp=camPitch;
  if(gameView){td=150;tp=.42;ty=8;}
  const k=1-Math.exp(-rdt*6);cam.y+=(ty-cam.y)*k;cam.d+=(td-cam.d)*k;cam.p+=(tp-cam.p)*k;
  camera.position.set(0,cam.y+Math.sin(cam.p)*cam.d,Math.cos(cam.p)*cam.d);camera.lookAt(0,cam.y,0);
  if(window.__cam){const c=window.__cam;camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);}
  camera.updateMatrixWorld();
  renderer.render(scene,camera);
}
new ResizeObserver(resize).observe(stage);resize();
requestAnimationFrame(frame);
