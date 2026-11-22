/* The lab stage: the drafts side by side, or one at a time on a turntable. */
scene.fog=null;scene.background=new T.Color(0x24272e);
renderer.toneMappingExposure=1.0;
let pose='stand',spin=-.45,spinOn=false,gameView=false,slow=false,bat=true,camPitch=.1,zoomK=1,swingT=0,focus=-1;
{
  const floor=new T.Mesh(new T.CircleGeometry(500,64),new T.ShadowMaterial({opacity:.4}));floor.rotation.x=-PI/2;floor.receiveShadow=true;scene.add(floor);
  const disc=new T.Mesh(new T.CircleGeometry(500,64),new T.MeshBasicMaterial({color:0x2d3139}));disc.rotation.x=-PI/2;disc.position.y=-.05;scene.add(disc);
  scene.add(new T.HemisphereLight(0xe6ecff,0x3a332d,.78));
  const key=new T.DirectionalLight(0xfff3e4,.9);key.position.set(70,130,110);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-42,right:42,top:40,bottom:-25,near:20,far:400});key.shadow.bias=-.0008;key.shadow.normalBias=.3;key.shadow.radius=3;scene.add(key);
  const fill=new T.DirectionalLight(0xb4c8ff,.34);fill.position.set(-90,40,70);scene.add(fill);
  const rim=new T.DirectionalLight(0xffd0a0,.5);rim.position.set(-30,70,-120);scene.add(rim);
}
const figs=STYLES.map(S=>makeFig({style:S})),units=figs.map(()=>({x:0,y:0,ang:PI/2,spd:0,atk:null,ready:false})),GAP=11.5;
for(const f of figs)setWeapon(f,'bat');
$('#busy').hidden=true;
const mkLbl=(n,t)=>{const d=document.createElement('div');d.className='lbl';d.innerHTML=(n?'<b>'+n+'</b>':'')+'<span>'+t+'</span>';stage.appendChild(d);return d;};
const lbls=figs.map((f,i)=>mkLbl(i+1,f.S.name));
const tabs=$('#tabs'),mkTab=(i,html)=>{const b=document.createElement('button');b.innerHTML=html;b.addEventListener('click',()=>setFocus(i));tabs.appendChild(b);return b;};
const tabB=[mkTab(-1,'All')].concat(figs.map((f,i)=>mkTab(i,'<b>'+(i+1)+'</b>'+f.S.name)));
function setFocus(i){
  focus=i;tabB.forEach((b,k)=>b.classList.toggle('on',k===i+1));
  $('#info .n').textContent=i<0?'Round 4 · four drafts':'Draft '+(i+1)+' of '+figs.length;
  $('#info h2').textContent=i<0?'Line-up':figs[i].S.name;
  $('#info p').textContent=i<0?'Four body and head types for the main character, all in plain clothes. 1 and 2 are big-headed cartoon builds, 3 and 4 are the smooth mannequin build. Pick a number to see one up close.':figs[i].S.blurb;
  figs.forEach((f,k)=>{f.g.visible=i<0||k===i;units[k].x=i<0?(k-(figs.length-1)/2)*GAP:0;});
}
function setPose(p){pose=p;swingT=0;for(const o of document.querySelectorAll('#poses [data-pose]'))o.classList.toggle('on',o.dataset.pose===p);}
for(const b of document.querySelectorAll('#poses [data-pose]'))b.addEventListener('click',()=>setPose(b.dataset.pose));
const tog=(id,fn)=>$(id).addEventListener('click',()=>{$(id).classList.toggle('on',fn());});
tog('#batBtn',()=>{bat=!bat;for(const f of figs)setWeapon(f,bat?'bat':null);return bat;});
tog('#slowBtn',()=>slow=!slow);tog('#gameBtn',()=>gameView=!gameView);tog('#spinBtn',()=>spinOn=!spinOn);
const ptrs=new Map();let pinch0=0;
ov.addEventListener('pointerdown',e=>{ptrs.set(e.pointerId,{x:e.clientX,y:e.clientY});try{ov.setPointerCapture(e.pointerId);}catch(_){}if(ptrs.size===2){const p=[...ptrs.values()];pinch0=hyp(p[0].x-p[1].x,p[0].y-p[1].y)/zoomK;}});
ov.addEventListener('pointermove',e=>{
  const p=ptrs.get(e.pointerId);if(!p)return;const dx=e.clientX-p.x,dy=e.clientY-p.y;p.x=e.clientX;p.y=e.clientY;
  if(ptrs.size===2){const q=[...ptrs.values()];zoomK=clamp(hyp(q[0].x-q[1].x,q[0].y-q[1].y)/pinch0,.6,5);return;}
  spin-=dx*.012;camPitch=clamp(camPitch+dy*.004,-.15,.9);if(Math.abs(dx)>2&&spinOn){spinOn=false;$('#spinBtn').classList.remove('on');}
});
const pend=e=>ptrs.delete(e.pointerId);ov.addEventListener('pointerup',pend);ov.addEventListener('pointercancel',pend);
ov.addEventListener('wheel',e=>{e.preventDefault();zoomK=clamp(zoomK*Math.exp(-e.deltaY*.0012),.6,5);},{passive:false});
const cam={y:10,d:60,p:.1},_lp=new T.Vector3();
function resize(){
  const r=stage.getBoundingClientRect();cw=Math.max(1,r.width);ch=Math.max(1,r.height);dpr=Math.min(2,window.devicePixelRatio||1);
  renderer.setPixelRatio(dpr);renderer.setSize(cw,ch,false);camera.aspect=cw/ch;camera.fov=30;camera.near=1;camera.far=2000;camera.updateProjectionMatrix();
}
function place(el,x,show){
  if(!show){el.style.display='none';return;}
  _lp.set(x,-1.1,0).project(camera);el.style.display='';el.style.left=((_lp.x*.5+.5)*cw)+'px';el.style.top=((-_lp.y*.5+.5)*ch)+'px';
}
let last=performance.now(),simNow=0;
function frame(ms){
  requestAnimationFrame(frame);
  const rdt=clamp((ms-last)/1000,0,.05),dt=rdt*(slow?.2:1);last=ms;simNow+=dt;
  if(spinOn&&!gameView)spin+=rdt*.5;
  swingT+=dt;
  const ang=gameView?-PI/2+Math.sin(simNow*.5)*.5:PI/2+spin;
  let atk=null,ready=pose==='ready';
  if(pose==='swing'||pose==='smash'){const per=1.25,cyc=swingT%per,n=Math.floor(swingT/per),dur=pose==='smash'?.56:.48;ready=true;if(cyc<dur)atk={t:cyc,dur,type:pose==='smash'?2:n%2};}
  if(window.__atk){atk=window.__atk;ready=true;}
  figs.forEach((f,i)=>{const u=units[i];u.ang=ang;u.spd=pose==='walk'?26:pose==='run'?62:0;u.ready=ready;u.atk=atk;if(f.g.visible)figAnim(f,u,dt,simNow);});
  const tanH=Math.tan(camera.fov*PI/360),tanW=tanH*camera.aspect,all=focus<0;
  const narrow=cw<700;      // on a phone the name sits above the figure and the buttons run along the bottom, so leave room for both
  let ty=all?8.6:narrow?11.3:10.2,td=(all?Math.max((1.5*GAP+9)/tanW,16.5/tanH):Math.max(9.5/tanW,(narrow?19:14)/tanH))/zoomK,tp=camPitch;
  if(gameView){td=all?190:150;tp=.42;ty=8;}
  const k=1-Math.exp(-rdt*6);cam.y+=(ty-cam.y)*k;cam.d+=(td-cam.d)*k;cam.p+=(tp-cam.p)*k;
  camera.position.set(0,cam.y+Math.sin(cam.p)*cam.d,Math.cos(cam.p)*cam.d);camera.lookAt(0,cam.y,0);
  if(window.__cam){const c=window.__cam;camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);}
  camera.updateMatrixWorld();
  const lab=all&&!gameView&&!window.__cam;lbls.forEach((l,i)=>place(l,units[i].x,lab));
  renderer.render(scene,camera);
}
new ResizeObserver(resize).observe(stage);resize();
setFocus(cw<720?0:-1);
requestAnimationFrame(frame);
