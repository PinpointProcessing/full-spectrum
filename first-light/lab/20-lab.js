/* The lab stage: the five designs side by side on a turntable, with poses and a "how it looks in play" camera. */
scene.fog=null;scene.background=new T.Color(0x23262d);
renderer.toneMappingExposure=1.08;
const GAP=17,figs=[],units=[];
let sel=-1,pose='stand',spin=0,spinOn=true,gameView=false,dragging=null,camPitch=.1,zoomK=1,swingT=0;
{
  const floor=new T.Mesh(new T.CircleGeometry(500,64),new T.ShadowMaterial({opacity:.42}));floor.rotation.x=-PI/2;floor.receiveShadow=true;scene.add(floor);
  const disc=new T.Mesh(new T.CircleGeometry(500,64),new T.MeshBasicMaterial({color:0x2c3038}));disc.rotation.x=-PI/2;disc.position.y=-.05;scene.add(disc);
  scene.add(new T.HemisphereLight(0xdfe6ff,0x2a2622,.62));
  const key=new T.DirectionalLight(0xfff1e0,1.0);key.position.set(70,130,110);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-70,right:70,top:50,bottom:-30,near:20,far:400});key.shadow.bias=-.0008;key.shadow.normalBias=.4;scene.add(key);
  const fill=new T.DirectionalLight(0xa8c0ff,.36);fill.position.set(-90,40,70);scene.add(fill);
  const rim=new T.DirectionalLight(0xffc890,.55);rim.position.set(-30,70,-120);scene.add(rim);
}
STYLES.forEach((S,i)=>{
  const f=makeFig({style:S});setWeapon(f,'bat');figs.push(f);units.push({x:(i-2)*GAP,y:0,ang:PI/2,spd:0,atk:null,style:S});
  const b=document.createElement('button');b.innerHTML=`<b>${i+1}</b>${S.name}`;b.dataset.i=i;$('#tabs').appendChild(b);
  const l=document.createElement('div');l.className='lbl';l.innerHTML=`<b>${i+1}</b>${S.name}`;$('#labels').appendChild(l);f.lbl=l;
});
{const b=document.createElement('button');b.textContent='All five';b.dataset.i=-1;$('#tabs').prepend(b);}
function choose(i){
  sel=i;for(const b of document.querySelectorAll('#tabs button'))b.classList.toggle('on',+b.dataset.i===sel);
  const S=sel<0?null:STYLES[sel];
  $('#infoN').textContent=S?`Design ${sel+1} of 5`:'Side by side';$('#infoH').textContent=S?S.name:'All five';
  $('#infoP').textContent=S?S.blurb:'Same person, same clothes, same bat, built five different ways. Tap a number to look closer.';
}
$('#tabs').addEventListener('click',e=>{const b=e.target.closest('button');if(b)choose(+b.dataset.i);});
for(const b of document.querySelectorAll('#poses [data-pose]'))b.addEventListener('click',()=>{pose=b.dataset.pose;swingT=0;for(const o of document.querySelectorAll('#poses [data-pose]'))o.classList.toggle('on',o===b);});
$('#gameBtn').addEventListener('click',()=>{gameView=!gameView;$('#gameBtn').classList.toggle('on',gameView);});
$('#spinBtn').addEventListener('click',()=>{spinOn=!spinOn;$('#spinBtn').classList.toggle('on',spinOn);});
const ptrs=new Map();let pinch0=0;
ov.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{ov.setPointerCapture(e.pointerId);}catch(_){}if(ptrs.size===2){const p=[...ptrs.values()];pinch0=hyp(p[0].x-p[1].x,p[0].y-p[1].y)/zoomK;}});
ov.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===2){const q=[...ptrs.values()];zoomK=clamp(hyp(q[0].x-q[1].x,q[0].y-q[1].y)/pinch0,.6,2.6);return;}
  spin-=dx*.012;camPitch=clamp(camPitch+dy*.004,-.05,.7);if(Math.abs(dx)>2&&spinOn){spinOn=false;$('#spinBtn').classList.remove('on');}
});
const pend=e=>ptrs.delete(e.pointerId);ov.addEventListener('pointerup',pend);ov.addEventListener('pointercancel',pend);
ov.addEventListener('wheel',e=>{e.preventDefault();zoomK=clamp(zoomK*Math.exp(-e.deltaY*.0012),.6,2.6);},{passive:false});
addEventListener('keydown',e=>{if(e.key>='1'&&e.key<='5')choose(+e.key-1);else if(e.key==='0'||e.key==='a')choose(-1);});
const cam={x:0,y:10,d:120,p:.1},_t3=new T.Vector3();
function resize(){
  const r=stage.getBoundingClientRect();cw=Math.max(1,r.width);ch=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);
  renderer.setPixelRatio(dpr);renderer.setSize(cw,ch,false);camera.aspect=cw/ch;camera.fov=30;camera.near=2;camera.far=2000;camera.updateProjectionMatrix();
}
let last=performance.now();
function frame(ms){
  requestAnimationFrame(frame);
  const dt=Math.min(.05,(ms-last)/1000),now=ms/1000;last=ms;
  if(spinOn&&!gameView)spin+=dt*.5;
  swingT+=dt;
  units.forEach((u,i)=>{
    u.ang=gameView?-PI/2+Math.sin(now*.5)*.5:PI/2+spin;
    u.spd=pose==='walk'?26:pose==='run'?62:0;
    if(pose==='swing'){const cyc=swingT%1.5,n=Math.floor(swingT/1.5)%3,dur=n===2?.5:.4;u.atk=cyc<dur?{t:cyc,dur,type:n}:null;}else u.atk=null;
    if(window.__atk)u.atk=window.__atk;
    figAnim(figs[i],u,dt,now);
  });
  // camera: frame all five, or one, or pull back to where the game camera sits
  const tanH=Math.tan(camera.fov*PI/360),tanW=tanH*camera.aspect;
  let tx=sel<0?0:units[sel].x,ty=10.4,td,tp=camPitch;
  if(gameView){td=150;tp=.42;ty=8;}
  else if(sel<0)td=Math.max((2*GAP+11)/tanW,13/tanH);
  else td=Math.max(8.5/tanW,13.5/tanH);
  td/=gameView?1:zoomK;
  const k=1-Math.exp(-dt*6);cam.x+=(tx-cam.x)*k;cam.y+=(ty-cam.y)*k;cam.d+=(td-cam.d)*k;cam.p+=(tp-cam.p)*k;
  camera.position.set(cam.x,cam.y+Math.sin(cam.p)*cam.d,Math.cos(cam.p)*cam.d);camera.lookAt(cam.x,cam.y,0);camera.updateMatrixWorld();
  if(window.__cam){const c=window.__cam;camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);camera.updateMatrixWorld();}
  renderer.render(scene,camera);
  figs.forEach((f,i)=>{_t3.set(units[i].x,-.6,0).project(camera);const on=sel<0&&!gameView&&_t3.z<1;f.lbl.hidden=!on;if(on){f.lbl.style.left=((_t3.x+1)/2*cw)+'px';f.lbl.style.top=((1-_t3.y)/2*ch+4)+'px';}});
}
new ResizeObserver(resize).observe(stage);resize();
choose(innerWidth<700?0:-1);
requestAnimationFrame(frame);
