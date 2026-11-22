/* The lab stage: the cast or the zombies side by side, or one figure at a time on a turntable. Figures are sculpted one per frame so the page stays alive while they build. */
scene.fog=null;scene.background=new T.Color(0x24272e);
renderer.toneMappingExposure=1.0;
let pose='stand',spin=-.45,spinOn=false,gameView=false,slow=false,camPitch=.1,zoomK=1,swingT=0,focus='cast';
{
  const floor=new T.Mesh(new T.CircleGeometry(500,64),new T.ShadowMaterial({opacity:.4}));floor.rotation.x=-PI/2;floor.receiveShadow=true;scene.add(floor);
  const disc=new T.Mesh(new T.CircleGeometry(500,64),new T.MeshBasicMaterial({color:0x2d3139}));disc.rotation.x=-PI/2;disc.position.y=-.05;scene.add(disc);
  scene.add(new T.HemisphereLight(0xe6ecff,0x3a332d,.78));
  const key=new T.DirectionalLight(0xfff3e4,.9);key.position.set(70,130,110);key.castShadow=true;key.shadow.mapSize.set(2048,2048);
  Object.assign(key.shadow.camera,{left:-46,right:46,top:44,bottom:-25,near:20,far:400});key.shadow.bias=-.0008;key.shadow.normalBias=.3;key.shadow.radius=3;scene.add(key);
  const fill=new T.DirectionalLight(0xb4c8ff,.34);fill.position.set(-90,40,70);scene.add(fill);
  const rim=new T.DirectionalLight(0xffd0a0,.5);rim.position.set(-30,70,-120);scene.add(rim);
}
const SHOW=STYLES.filter(S=>S.lab),GAP=12,GROUPS={cast:'The cast',zed:'Zombies'},figs=SHOW.map(()=>null),units=SHOW.map(S=>({x:0,y:0,ang:PI/2,spd:0,atk:null,ready:false,kind:S.zed?'z':'surv',ztype:S.zed===2?'runner':S.zed===3?'brute':'shambler'}));
const members=g=>SHOW.map((S,i)=>i).filter(i=>SHOW[i].group===g);
const mkLbl=(n,t)=>{const d=document.createElement('div');d.className='lbl';d.innerHTML='<b>'+n+'</b><span>'+t+'</span>';stage.appendChild(d);return d;};
const lbls=SHOW.map((S,i)=>mkLbl(i+1,S.name));
const tabs=$('#tabs'),tabB={};
const mkTab=(key,html)=>{const b=document.createElement('button');b.innerHTML=html;b.addEventListener('click',()=>setFocus(key));tabs.appendChild(b);tabB[key]=b;};
for(const g in GROUPS)mkTab(g,GROUPS[g]);
SHOW.forEach((S,i)=>mkTab(i,'<b>'+(i+1)+'</b>'+S.name));
function setFocus(k){
  focus=k;for(const key in tabB)tabB[key].classList.toggle('on',String(key)===String(k));
  const grp=typeof k==='string',ids=grp?members(k):[k];
  $('#info .n').textContent=grp?'As they are in the game':(SHOW[k].group==='zed'?'Zombie':'Survivor')+' · '+(SHOW[k].build==='brawler'?'Brawler build':'round-head build')+(SHOW[k].weapon?' · '+({bat:'bat',club:'golf club',board:'skateboard',knife:'butcher knife',pistol:'pistol'})[SHOW[k].weapon]:'');
  $('#info h2').textContent=grp?GROUPS[k]:SHOW[k].name;
  $('#info p').textContent=grp?(k==='cast'?'You, Walt and Officer Dunn are on the Brawler build. Jules and Marisol are on the slimmer round-headed build. Pick a number to see one up close.':'A shambler on the round-headed build, a runner on a leaner Brawler, and Big Earl, the Brawler scaled up.'):SHOW[k].blurb;
  SHOW.forEach((S,i)=>{const on=ids.includes(i);if(figs[i])figs[i].g.visible=on;units[i].x=on?(ids.indexOf(i)-(ids.length-1)/2)*GAP:0;units[i].on=on;});
}
function setPose(p){pose=p;swingT=0;for(const o of document.querySelectorAll('#poses [data-pose]'))o.classList.toggle('on',o.dataset.pose===p);}
for(const b of document.querySelectorAll('#poses [data-pose]'))b.addEventListener('click',()=>setPose(b.dataset.pose));
const tog=(id,fn)=>$(id).addEventListener('click',()=>{$(id).classList.toggle('on',fn());});
/* the weapon button steps through everything a survivor can carry, starting with each person's own */
const WLIST=['own','bat','club','board','knife','pan','ciron','hammer','iron','baton','pistol','shotgun','none'];
const WNAME={own:'Own weapon',bat:'Bat',club:'Golf club',board:'Skateboard',knife:'Butcher knife',pan:'Frying pan',ciron:'Clothes iron',hammer:'Hammer',iron:'Tire iron',baton:'Baton',pistol:'Pistol',shotgun:'Shotgun',none:'Empty hands'};
let wi=0;
const arm=f=>{if(f&&!f.S.zed){const w=WLIST[wi];setWeapon(f,w==='own'?f.S.weapon:w==='none'?null:w);}};
const setW=i=>{wi=(i+WLIST.length)%WLIST.length;figs.forEach(arm);$('#batBtn').textContent=WNAME[WLIST[wi]];$('#batBtn').classList.toggle('on',WLIST[wi]!=='none');};
$('#batBtn').addEventListener('click',()=>setW(wi+1));
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
/* sculpt the figures one at a time, the ones on show first */
let built=0;const order=members('cast').concat(members('zed'));
function buildNext(){
  if(built>=order.length){$('#busy').hidden=true;window.__ready=true;return;}
  const i=order[built];$('#busy').textContent='Sculpting '+SHOW[i].name+' ('+(built+1)+' of '+order.length+')';
  setTimeout(()=>{const f=figs[i]=makeFig(SHOW[i]);arm(f);f.g.visible=!!units[i].on;built++;buildNext();},30);
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
  let hMax=1,n=0;
  figs.forEach((f,i)=>{const u=units[i];if(!f||!u.on)return;n++;hMax=Math.max(hMax,(f.S.h||1)*.87);const z=f.S.zed;const gun=f.wname&&WEAP[f.wname].gun;u.ang=ang;u.spd=pose==='walk'?(z?14:26):pose==='run'?(z===2?62:z?20:62):0;u.ready=ready&&!z;u.atk=z||gun?null:atk;u.shootT=gun&&(ready||atk)?.5:9;figAnim(f,u,dt,simNow);});
  const tanH=Math.tan(camera.fov*PI/360),tanW=tanH*camera.aspect,all=typeof focus==='string',narrow=cw<700,cnt=all?members(focus).length:1;
  // on a phone the name sits above the figure and the buttons run along the bottom, so leave room for both
  let ty=(all?8.6:narrow?11.3:10.2)*hMax,td=(all?Math.max(((cnt-1)/2*GAP+9)/tanW,16.5*hMax/tanH):Math.max(9.5*hMax/tanW,(narrow?19:14)*hMax/tanH))/zoomK,tp=camPitch;
  if(gameView){td=all?190:150;tp=.42;ty=8;}
  const k=1-Math.exp(-rdt*6);cam.y+=(ty-cam.y)*k;cam.d+=(td-cam.d)*k;cam.p+=(tp-cam.p)*k;
  camera.position.set(0,cam.y+Math.sin(cam.p)*cam.d,Math.cos(cam.p)*cam.d);camera.lookAt(0,cam.y,0);
  if(window.__cam){const c=window.__cam;camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);}
  camera.updateMatrixWorld();
  const lab=all&&!gameView&&!window.__cam;lbls.forEach((l,i)=>place(l,units[i].x,lab&&units[i].on));
  renderer.render(scene,camera);
}
new ResizeObserver(resize).observe(stage);resize();
setFocus(cw<720?0:'cast');
buildNext();
requestAnimationFrame(frame);
