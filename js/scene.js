"use strict";
/* 3D scene: renderer, camera, world meshes, lights, soldier models, per-frame render.
   Everything that needs THREE is created in initGL() so main.js can bail out cleanly without WebGL. */
const T=window.THREE;
const FOG=0x06090d;
let renderer,scene,camera,_v,_o,_d,gtex,rtex,SG;
function initGL(){
  if(!T)return false;
  // with WebGL2 the post-processing draws the scene with its own 4x anti-aliasing (post.js), so the page's canvas needn't pay for it too
  let gl2=false;try{const t=document.createElement('canvas').getContext('webgl2');gl2=!!t;if(t){const x=t.getExtension('WEBGL_lose_context');if(x)x.loseContext();}}catch(e){}
  try{renderer=new T.WebGLRenderer({canvas:cv,antialias:!gl2,powerPreference:'high-performance'});}
  catch(e){return false;}
  renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFShadowMap;   // plain PCF: soft shadows cost too much on a phone
  scene=new T.Scene();
  scene.background=new T.Color(FOG);scene.fog=new T.FogExp2(FOG,0.00042);
  camera=new T.PerspectiveCamera(34,1,10,6000);
  _v=new T.Vector3();_o=new T.Vector3();_d=new T.Vector3();
  gtex=new T.CanvasTexture(gcan);rtex=new T.CanvasTexture(rcan);
  gtex.encoding=T.sRGBEncoding;
  SG={legs:new T.CylinderGeometry(2.5,2.3,6,8),body:new T.CylinderGeometry(3.3,2.9,8,8),head:new T.SphereGeometry(2.3,10,8),
    helm:new T.SphereGeometry(2.8,10,6,0,Math.PI*2,0,Math.PI/2),rifle:new T.BoxGeometry(11,1.3,1.4),pack:new T.BoxGeometry(3,5.5,5),
    band:new T.CylinderGeometry(3.45,3.45,1.8,8),ring:new T.RingGeometry(5.8,7.4,36)};
  {const L=120,g=new T.ConeGeometry(L*Math.tan(.3),L,18,1,true);g.rotateZ(Math.PI/2);g.translate(L/2,0,0);SG.beam=g;   // apex at the lens, opening along +x
   const c=document.createElement('canvas');c.width=4;c.height=128;const x=c.getContext('2d'),gr=x.createLinearGradient(0,0,0,128);
   gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.25,'rgba(255,255,255,.45)');gr.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=gr;x.fillRect(0,0,4,128);
   SG.beamMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(c),color:0xcfe0ff,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false});}
  return true;
}

/* camera: angled, like a tactics game; from the south when yaw is 0 (a two-finger twist turns it). zoom tilts it lower. */
// The camera distance is fitted to the yard's size (FIT); VB is where it may roam: the yard, then the whole map once the depot opens.
const FIT={w:YARD_W,h:H};let VB={x0:0,z0:0,x1:YARD_W,z1:H};   // VB z runs TOP..H once the whole map is open
const MAXZ=4,CAM_OVER=220;let zoom=1,camT={x:FIT.w/2,z:FIT.h/2},dist0=1200,yaw=0,tilt=0;
const PITCH0=60*Math.PI/180,PITCH1=46*Math.PI/180,PITCH_MIN=14*Math.PI/180;   // tilt lowers the camera towards the horizon, down to PITCH_MIN
function basePitch(){return PITCH0+(PITCH1-PITCH0)*(zoom-1)/(MAXZ-1);}
function updateCamera(){
  const dist=dist0/zoom,p=Math.max(PITCH_MIN,basePitch()-tilt);
  const hd=dist*Math.cos(p);
  camera.position.set(camT.x+Math.sin(yaw)*hd,dist*Math.sin(p),camT.z+Math.cos(yaw)*hd);
  camera.lookAt(camT.x,0,camT.z);camera.updateMatrixWorld();
}
function clampCam(){
  // Bryan: the view may go past the map's edge; the centre stays within CAM_OVER of the area that's open
  const over=MAPID==='in'?40:CAM_OVER;   // inside, the view stays on the floor you're looking at
  camT.x=clamp(camT.x,VB.x0-over,VB.x1+over);camT.z=clamp(camT.z,VB.z0-over,VB.z1+over);
  const fb=$('#fitBtn');if(fb)fb.hidden=zoom<1.02&&Math.abs(yaw)<0.02&&tilt<0.02;
}
// world -> screen. A point behind the camera can't be drawn: it comes back far off screen and sets toSBack, so shapes that
// touch one (view cones, area outlines, fires) skip themselves instead of turning inside out across the whole screen
let toSBack=false;
function toS(x,y,h=0){_v.set(x,h,y).project(camera);if(_v.z>1){toSBack=true;return[-1e4,-1e4];}return[(_v.x+1)/2*cw,(1-_v.y)/2*ch];}
function toW(sx,sy){
  _o.setFromMatrixPosition(camera.matrixWorld);
  _d.set(sx/cw*2-1,-(sy/ch)*2+1,0.5).unproject(camera).sub(_o).normalize();
  if(_d.y>-1e-4)return[camT.x,camT.z];
  const t=-_o.y/_d.y;return[_o.x+_d.x*t,_o.z+_d.z*t];
}
// Where a tap points. On open ground that's just the ground point. If the tap lands on the side or top of a wall,
// container, crate or sandbag first, it's the spot just in front of that face (towards the camera), so tapping the
// side of the warehouse means "stand against this side" rather than the ground hidden behind it.
function tapTarget(sx,sy){
  _o.setFromMatrixPosition(camera.matrixWorld);
  _d.set(sx/cw*2-1,-(sy/ch)*2+1,0.5).unproject(camera).sub(_o).normalize();
  const org=[_o.x,_o.y,_o.z],dir=[_d.x,_d.y,_d.z];
  let bt=_d.y<-1e-4?-_o.y/_d.y:1e9,best=null;
  for(const o of objs){
    const h=o.kind==='tower'?0:objHeight(o);if(!h)continue;   // the watchtower stands on open legs: taps go through to the road behind it
    const mn=[o.x,0,o.y],mx=[o.x+o.w,h,o.y+o.h];
    let t0=0,t1=bt,ax=-1,sg=0,miss=false;
    for(let k=0;k<3;k++){
      if(Math.abs(dir[k])<1e-9){if(org[k]<mn[k]||org[k]>mx[k]){miss=true;break;}continue;}
      let a=(mn[k]-org[k])/dir[k],b=(mx[k]-org[k])/dir[k],s=-1;   // s: which way the face the ray enters points
      if(a>b){const q=a;a=b;b=q;s=1;}
      if(a>t0){t0=a;ax=k;sg=s;}
      if(b<t1)t1=b;
      if(t0>t1){miss=true;break;}
    }
    if(!miss&&ax>=0&&t0<bt){bt=t0;best={o,ax,sg};}
  }
  if(!best){const[x,y]=toW(sx,sy);return{x,y,obj:null};}
  const o=best.o,hx=_o.x+_d.x*bt,hz=_o.z+_d.z*bt;
  let nx=0,nz=0;
  if(best.ax===0)nx=best.sg;else if(best.ax===2)nz=best.sg;
  else{const cx=_o.x-hx,cz=_o.z-hz,l=hyp(cx,cz)||1;nx=cx/l;nz=cz/l;}   // top: step off towards the camera
  let x=hx,y=hz;for(let i=0;i<80&&rectDist(x,y,o)<11;i++){x+=nx;y+=nz;}
  return{x,y,obj:o};
}
function fitDist(){
  const sz=zoom,sy=yaw,stl=tilt,st={x:camT.x,z:camT.z};zoom=1;yaw=0;tilt=0;camT={x:FIT.w/2,z:FIT.h/2};
  let lo=200,hi=9000;
  for(let i=0;i<30;i++){
    const mid=(lo+hi)/2;dist0=mid;updateCamera();let ok=true;
    for(const[x,z]of[[0,0],[FIT.w,0],[0,FIT.h],[FIT.w,FIT.h]]){_v.set(x,0,z).project(camera);if(Math.abs(_v.x)>.99||Math.abs(_v.y)>.99){ok=false;break;}}
    if(ok)hi=mid;else lo=mid;
  }
  dist0=hi;zoom=sz;yaw=sy;tilt=stl;camT=st;clampCam();updateCamera();
}
// a ground point under the screen point that's near enough to the view to anchor a zoom on (null for sky / far horizon,
// where a tiny finger movement means a huge distance: that's what sent the camera flying off)
function nearGround(sx,sy){const[x,z]=toW(sx,sy);return hyp(x-camT.x,z-camT.z)<=FIT.h/zoom?[x,z]:null;}
function zoomAround(sx,sy,nz){
  const w=nearGround(sx,sy);zoom=clamp(nz,1,MAXZ);updateCamera();
  if(w){const a=nearGround(sx,sy);if(a){camT.x+=w[0]-a[0];camT.z+=w[1]-a[1];}}clampCam();updateCamera();
}
/* ---------- 3D scene ---------- */
function canvasTex(w,h,draw){
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}
function texMat(tex,rx,ry,opts){const t=tex.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return new T.MeshStandardMaterial(Object.assign({map:t},opts));}

/* ground: painted once, decals painted in as the fight happens */
const gcan=document.createElement('canvas'),rcan=document.createElement('canvas'),acan=document.createElement('canvas'),GS=1.5;   // ground texture: 1.5 px per unit (the map is 1000 x 1660); acan: the ground's alpha (the moat is a hole)
function drawGround(){
  const MH=H-TOP;   // painted in world units: the canvas starts at y TOP
  gcan.width=Math.round(W*GS);gcan.height=Math.round(MH*GS);rcan.width=W;rcan.height=MH;
  const g=gcan.getContext('2d'),q=rcan.getContext('2d');g.setTransform(GS,0,0,GS,0,-TOP*GS);q.setTransform(1,0,0,1,0,-TOP);
  const r=rng(1337);
  g.fillStyle='#4c4f52';g.fillRect(0,TOP,W,MH);q.fillStyle='rgb(182,182,182)';q.fillRect(0,TOP,W,MH);
  for(let y=TOP;y<H;y+=75)for(let x=0;x<W;x+=75){g.fillStyle=(r()<.5?'rgba(255,255,255,':'rgba(0,0,0,')+(0.03+r()*0.07).toFixed(3)+')';g.fillRect(x,y,75,75);}
  g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=1;
  for(let x=0;x<=W;x+=75){g.beginPath();g.moveTo(x+.5,TOP);g.lineTo(x+.5,H);g.stroke();}
  for(let y=TOP;y<=H;y+=75){g.beginPath();g.moveTo(0,y+.5);g.lineTo(W,y+.5);g.stroke();}
  for(let i=0;i<15000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.22)';g.fillRect(r()*W,TOP+r()*MH,r()*1.6+.4,r()*1.6+.4);}
  for(let i=0;i<60;i++){const x=r()*W,y=TOP+r()*MH,rad=8+r()*34,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(0,0,0,.4)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}
  for(let i=0;i<56;i++){   // puddles: darker, and smooth enough to catch the lamps
    const x=20+r()*(W-40),y=TOP+20+r()*(MH-40),rx=10+r()*32,ry=6+r()*16,a=r()*Math.PI;
    puddle(g,'col',x,y,rx,ry,a);puddle(q,'rough',x,y,rx,ry,a);
  }
  g.setLineDash([16,14]);g.strokeStyle='rgba(222,186,70,.55)';g.lineWidth=3;g.beginPath();g.moveTo(310,890);g.lineTo(310,585);g.stroke();g.setLineDash([]);
  g.strokeStyle='rgba(0,0,0,.3)';g.lineWidth=4;
  for(const o of [-9,9]){g.beginPath();g.moveTo(420+o,892);g.bezierCurveTo(424+o,820,420+o,760,419+o,732);g.stroke();}
  g.save();g.beginPath();g.rect(260,560,100,9);g.clip();g.fillStyle='rgba(228,182,40,.85)';
  for(let x=250;x<370;x+=10){g.beginPath();g.moveTo(x,569);g.lineTo(x+5,569);g.lineTo(x+14,560);g.lineTo(x+9,560);g.fill();}
  g.restore();
  g.fillStyle='#64676b';g.fillRect(180,270,260,280);q.fillStyle='rgb(150,150,150)';q.fillRect(180,270,260,280);
  g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;
  for(let x=180;x<=440;x+=26){g.beginPath();g.moveTo(x+.5,270);g.lineTo(x+.5,550);g.stroke();}
  for(let y=270;y<=550;y+=28){g.beginPath();g.moveTo(180,y+.5);g.lineTo(440,y+.5);g.stroke();}
  for(let i=0;i<8;i++){const x=190+r()*240,y=280+r()*260,rad=8+r()*18,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}
  g.strokeStyle='rgba(225,185,60,.6)';g.lineWidth=2;g.strokeRect(194,284,232,252);
  // north of the warehouse: worn tracks from the bridge to the depot, the data center and the fortress
  for(const c of[g,q]){c.strokeStyle=c===g?'#34373b':'rgb(90,90,90)';c.lineWidth=34;c.lineCap='round';c.lineJoin='round';
    for(const pa of PATHS){c.beginPath();pa.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.stroke();}}
  g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=2;for(const pa of PATHS)for(const o of[-7,7]){g.beginPath();pa.forEach((p,i)=>i?g.lineTo(p.x+o,p.y):g.moveTo(p.x+o,p.y));g.stroke();}
  // the canal: dark water between concrete banks (a glossy plane over it, see buildWorld)
  for(const c of[g,q]){c.fillStyle=c===g?'#0b1216':'rgb(20,20,20)';c.fillRect(0,CANAL.y0,W,CANAL.y1-CANAL.y0);}
  g.fillStyle='#8a8b86';g.fillRect(0,CANAL.y0-5,W,5);g.fillRect(0,CANAL.y1,W,5);g.fillStyle='rgba(228,182,40,.7)';g.fillRect(0,CANAL.y1+5,W,1.2);g.fillRect(0,CANAL.y0-6,W,1.2);
  // the runway road in front of the data center (Bryan: "like a runway road, not small"): dark asphalt, smoother (wetter) than
  // the ground round it, white edge lines, a dashed centre line, threshold stripes at both ends, tyre marks. The container
  // yard's floor darker and oil-stained.
  {const R_=ROAD,rh=R_.y1-R_.y0,cy=(R_.y0+R_.y1)/2;
   for(const c of[g,q]){c.fillStyle=c===g?'#26282b':'rgb(118,118,118)';c.fillRect(R_.x0,R_.y0,R_.x1-R_.x0,rh);}
   for(let i=0;i<2600;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.18)';g.fillRect(r()*W,R_.y0+r()*rh,r()*1.4+.3,r()*1.4+.3);}
   g.strokeStyle='rgba(0,0,0,.26)';g.lineWidth=3;for(const yy of[cy-30,cy-17,cy+17,cy+30]){g.beginPath();g.moveTo(0,yy);for(let x=0;x<=W;x+=50)g.lineTo(x,yy+Math.sin(x*.013+yy)*2);g.stroke();}
   g.fillStyle='rgba(225,228,230,.78)';g.fillRect(R_.x0,R_.y0+5,W,2);g.fillRect(R_.x0,R_.y1-7,W,2);
   for(let x=40;x<W-40;x+=40)g.fillRect(x,cy-1.2,22,2.4);
   for(const x0 of[10,W-36])for(let k=0;k<6;k++)g.fillRect(x0,R_.y0+14+k*18,26,9);}
  g.fillStyle='rgba(0,0,0,.14)';g.fillRect(CONT_ZONE.x0,CONT_ZONE.y0,CONT_ZONE.x1-CONT_ZONE.x0,CONT_ZONE.y1-CONT_ZONE.y0);
  // the data center: tiled floor inside, a painted apron and hazard stripes in front of the doors
  g.fillStyle='#5e6266';g.fillRect(DC.x+10,DC.y+10,DC.w-20,DC.h-20);q.fillStyle='rgb(150,150,150)';q.fillRect(DC.x+10,DC.y+10,DC.w-20,DC.h-20);
  g.strokeStyle='rgba(0,0,0,.18)';g.lineWidth=1;for(let x=DC.x+10;x<DC.x+DC.w-10;x+=20){g.beginPath();g.moveTo(x+.5,DC.y+10);g.lineTo(x+.5,DC.y+DC.h-10);g.stroke();}
  for(let y=DC.y+10;y<DC.y+DC.h-10;y+=20){g.beginPath();g.moveTo(DC.x+10,y+.5);g.lineTo(DC.x+DC.w-10,y+.5);g.stroke();}
  g.fillStyle='#3a3d40';g.fillRect(170,-610,280,80);   // the server room's raised floor
  g.save();g.beginPath();g.rect(DC.x,DC.y+DC.h,DC.w,7);g.clip();g.fillStyle='rgba(228,182,40,.7)';for(let x=DC.x;x<DC.x+DC.w;x+=14){g.beginPath();g.moveTo(x,DC.y+DC.h+7);g.lineTo(x+7,DC.y+DC.h+7);g.lineTo(x+14,DC.y+DC.h);g.lineTo(x+7,DC.y+DC.h);g.fill();}g.restore();
  // the dock: dark water (a lit plane over it, see buildWorld), a concrete quay edge and bollards
  for(const c of[g,q]){c.fillStyle=c===g?'#0b1216':'rgb(20,20,20)';c.fillRect(0,DOCK.quay,175,H-DOCK.quay);}
  g.fillStyle='#8a8b86';g.fillRect(0,DOCK.quay-6,178,6);g.fillRect(175,DOCK.quay-6,4,H-DOCK.quay+6);
  g.fillStyle='rgba(228,182,40,.8)';g.fillRect(0,DOCK.quay-7,178,1.4);
  // the fortress approach: a concrete apron before the moat
  for(const c of[g,q]){c.fillStyle=c===g?'#57595a':'rgb(150,150,150)';c.beginPath();c.arc(FORT.cx,FORT.cy,FORT.r1+70,0,TAU);c.arc(FORT.cx,FORT.cy,FORT.r1,0,TAU,true);c.fill('evenodd');}
  // the fort's island: riveted steel deck plates
  g.save();g.beginPath();g.arc(FORT.cx,FORT.cy,FORT.r0,0,TAU);g.clip();g.fillStyle='#3b4044';g.fillRect(FORT.cx-FORT.r0,FORT.cy-FORT.r0,FORT.r0*2,FORT.r0*2);
  g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1;for(let k=-FORT.r0;k<FORT.r0;k+=24){g.beginPath();g.moveTo(FORT.cx+k,FORT.cy-FORT.r0);g.lineTo(FORT.cx+k,FORT.cy+FORT.r0);g.moveTo(FORT.cx-FORT.r0,FORT.cy+k);g.lineTo(FORT.cx+FORT.r0,FORT.cy+k);g.stroke();}g.restore();
  // the moat's edge: a concrete lip with a yellow-black warning band
  g.lineWidth=5;g.strokeStyle='#8a8b86';g.beginPath();g.arc(FORT.cx,FORT.cy,FORT.r1+2.5,0,TAU);g.stroke();
  g.lineWidth=2;g.setLineDash([8,8]);g.strokeStyle='rgba(228,182,40,.85)';g.beginPath();g.arc(FORT.cx,FORT.cy,FORT.r1+6,0,TAU);g.stroke();g.setLineDash([]);
  for(const o of objs){if(o.kind==='fence'||o.kind==='water'||o.kind==='pit'||o.kind==='fortwall')continue;g.fillStyle='rgba(0,0,0,.32)';g.fillRect(o.x-3,o.y-3,o.w+6,o.h+6);}
  // alpha: the moat is cut out of the ground so you look down into it
  acan.width=Math.round(W/2);acan.height=Math.round(MH/2);const a=acan.getContext('2d');a.setTransform(.5,0,0,.5,0,-TOP*.5);
  a.fillStyle='#fff';a.fillRect(0,TOP,W,MH);a.fillStyle='#000';a.beginPath();a.arc(FORT.cx,FORT.cy,FORT.r1,0,TAU);a.arc(FORT.cx,FORT.cy,FORT.r0,0,TAU,true);a.fill('evenodd');
  gtex.needsUpdate=true;rtex.needsUpdate=true;
}
function decalOn(g,d){
  if(d.k==='scorch'){const gr=g.createRadialGradient(d.x,d.y,0,d.x,d.y,26);gr.addColorStop(0,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(d.x,d.y,26,0,7);g.fill();}
  else{g.fillStyle='rgba(80,8,6,.7)';g.beginPath();g.ellipse(d.x+2,d.y+1,9+d.r*4,6+d.r*3,d.r*3,0,7);g.fill();}
}
function paintDecal(d){
  if(MAPID==='l1'&&L1){const g=L1.canvas.getContext('2d');g.setTransform(L1S,0,0,L1S,-L1B.x0*L1S,-L1B.y0*L1S);decalOn(g,d);L1.tex.needsUpdate=true;return;}   // Level 1's own ground (level1.js)
  if(MAPID==='hq'&&HQ&&HQ.tex){const g=HQ.tex.image.getContext('2d');g.setTransform(1.2,0,0,1.2,-HQB.x0*1.2,-HQB.y0*1.2);decalOn(g,d);HQ.tex.needsUpdate=true;return;}   // the Headquarters' own floor (fortress.js; they landed on the big map's ground before)
  if(MAPID==='l2'&&L2){const g=L2.canvas.getContext('2d');g.setTransform(L2S,0,0,L2S,-L2B.x0*L2S,-L2B.y0*L2S);decalOn(g,d);L2.tex.needsUpdate=true;return;}   // Level 2's (level2.js)
  const inside=MAPID==='in'&&IN,s=inside?1:GS,g=(inside?IN.canvas:gcan).getContext('2d');g.setTransform(s,0,0,s,0,-TOP*s);   // inside, onto the building's own floor
  decalOn(g,d);
  if(inside){IN.tex.needsUpdate=true;IN.marked=true;}else gtex.needsUpdate=true;
}

const HGT={container:26,wall:24,crate:11,barrel:10,truck:22,pallet:7,barrier:8,rack:20};
// a checkpoint's station (Bryan: make them look like what they are): a field medic station (a stretcher, white crates with red
// crosses, a flag on a pole) or an ammo drop (olive ammo crates strapped on a pallet, a parachute heap, an orange strobe)
let crossTex=null;
function stationMesh(z){
  const g=new T.Group();g.position.set(z.x,0,z.y);
  const B=(w,h,d,m,x,y,zz,ry)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,zz);if(ry)o.rotation.y=ry;o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  if(z.k==='med'){
    crossTex=crossTex||canvasTex(32,32,(c,w,h)=>{c.fillStyle='#e8ece8';c.fillRect(0,0,w,h);c.fillStyle='#d4231c';c.fillRect(12,5,8,22);c.fillRect(5,12,22,8);});
    const white=new T.MeshStandardMaterial({map:crossTex,roughness:.7}),metal=new T.MeshStandardMaterial({color:0x8d9499,roughness:.4,metalness:.6}),canvas=new T.MeshStandardMaterial({color:0x5d6b4a,roughness:.9});
    B(22,1,8,canvas,-4,5,6);for(const sx of[-1,1])for(const sz of[-1,1])B(.8,5,.8,metal,-4+sx*10,2.5,6+sz*3.5);   // the stretcher
    B(9,7,7,white,8,3.5,-4);B(8,6,6,white,8.5,10,-4.5,.3);B(10,6,7,white,-9,3,-6,-.2);   // crates
    B(.6,24,.6,metal,13,12,6);const flag=new T.Mesh(new T.PlaneGeometry(8,6),new T.MeshStandardMaterial({map:crossTex,side:T.DoubleSide,roughness:.8}));flag.position.set(17,21,6);g.add(flag);
  }else{
    const wood=new T.MeshStandardMaterial({color:0x9a7650,roughness:.9}),olive=new T.MeshStandardMaterial({color:0x4b5534,roughness:.75,metalness:.1}),strap=new T.MeshStandardMaterial({color:0x22262a,roughness:.6});
    B(22,2,16,wood,0,1,0);
    for(const[x,y,zz,ry]of[[-5,5,-3,0],[5.5,5,-3,0],[0,5,4,0],[-1,12,-.5,.15]]){B(10,6,6,olive,x,y,zz,ry);B(10.4,6.2,.8,strap,x,y,zz,ry);}
    const chute=new T.Mesh(new T.SphereGeometry(7,10,6,0,TAU,0,Math.PI/2),new T.MeshStandardMaterial({color:0xd8d4c4,roughness:.95}));chute.scale.set(1.2,.35,.9);chute.position.set(-15,0,6);g.add(chute);
    const strobe=new T.Mesh(new T.BoxGeometry(1.6,1.6,1.6),new T.MeshBasicMaterial({color:0xff9a3a,toneMapped:false}));strobe.position.set(6,16,4);g.add(strobe);g.userData.strobe=strobe;
  }
  return g;
}
// the pillbox: a slab, waist-high concrete walls, window glass above them in thin frames, a roof on corner posts, the back open,
// and the machine gun on a post in the front window (PBOX.mesh turns to follow whoever's on it: aimTurret in waves.js)
function buildPillbox(){
  const{x0,y0,x1,y1,gun}=PBOX,w=x1-x0,d=y1-y0,cx=(x0+x1)/2,cz=(y0+y1)/2;
  const conc=new T.MeshStandardMaterial({color:0x8a8c86,roughness:.95}),frame=new T.MeshStandardMaterial({color:0x2c3033,roughness:.6,metalness:.5});
  const glass=new T.MeshStandardMaterial({color:0x8fb3c4,roughness:.15,metalness:.2,transparent:true,opacity:.28,depthWrite:false});
  addMesh(new T.BoxGeometry(w,1,d),conc,cx,.5,cz);
  const WALL=11,TOPH=24;
  const walls=[[w,4,cx,y1-2],[4,d-4,x0+2,y0+(d-4)/2],[4,d-4,x1-2,y0+(d-4)/2]];
  for(const[ww,dd,px,pz]of walls){
    addMesh(new T.BoxGeometry(ww,WALL,dd),conc,px,WALL/2,pz);
    const g=new T.Mesh(new T.BoxGeometry(ww-1,TOPH-WALL,dd-1),glass);g.position.set(px,(WALL+TOPH)/2,pz);g.renderOrder=2;scene.add(g);
    addMesh(new T.BoxGeometry(ww+.4,1,dd+.4),frame,px,TOPH,pz);addMesh(new T.BoxGeometry(ww+.4,1,dd+.4),frame,px,WALL+.4,pz);
  }
  for(const[px,pz]of[[x0+2,y0+2],[x1-2,y0+2],[x0+2,y1-2],[x1-2,y1-2],[cx-9,y1-2],[cx+9,y1-2]])addMesh(new T.BoxGeometry(2.2,TOPH,2.2),frame,px,TOPH/2,pz);
  addMesh(new T.BoxGeometry(w+6,2.4,d+6),conc,cx,TOPH+1.6,cz);   // the roof: well above a man's head
  addMesh(new T.CylinderGeometry(.8,1.2,12,8),frame,gun.x,6,gun.y);   // the post
  const g=new T.Group(),dm=new T.MeshStandardMaterial({color:0x1b1e1b,roughness:.6,metalness:.5});
  const body=new T.Mesh(new T.BoxGeometry(9,3,3),dm);body.position.set(1.5,0,0);g.add(body);
  const barrel=new T.Mesh(new T.CylinderGeometry(.55,.55,15,8),dm);barrel.rotation.z=Math.PI/2;barrel.position.set(12,.4,0);g.add(barrel);
  const box=new T.Mesh(new T.BoxGeometry(3,3,3.4),new T.MeshStandardMaterial({color:0x3e4a2c,roughness:.8}));box.position.set(1,-.4,-3.2);g.add(box);
  const grip=new T.Mesh(new T.BoxGeometry(1.2,3,1.2),dm);grip.position.set(-3.5,-1.8,0);g.add(grip);
  for(const m of g.children){m.castShadow=true;}
  g.position.set(gun.x,12.6,gun.y);g.rotation.y=-gun.ang;scene.add(g);PBOX.mesh=g;
}
// our two pillboxes by the canal (OUR_BOXES in map.js): built like theirs, without a gun, the front wall to the north, open at
// the back; the roof fades while one of our men is inside so you can see him (like the sewer pipe)
let ourRoofs=[];
function buildOurBoxes(){
  const conc=new T.MeshStandardMaterial({color:0x8f918b,roughness:.95}),frame=new T.MeshStandardMaterial({color:0x2c3033,roughness:.6,metalness:.5});
  const glass=new T.MeshStandardMaterial({color:0x8fb3c4,roughness:.15,metalness:.2,transparent:true,opacity:.28,depthWrite:false});
  ourRoofs=[];
  for(const b of OUR_BOXES){
    const{x0,y0,x1,y1}=b,w=x1-x0,d=y1-y0,cx=(x0+x1)/2,cz=(y0+y1)/2,WALL=11,TOPH=24;
    addMesh(new T.BoxGeometry(w,1,d),conc,cx,.5,cz);
    for(const[ww,dd,px,pz]of[[w,4,cx,y0+2],[4,d-4,x0+2,y0+4+(d-4)/2],[4,d-4,x1-2,y0+4+(d-4)/2]]){
      addMesh(new T.BoxGeometry(ww,WALL,dd),conc,px,WALL/2,pz);
      const g=new T.Mesh(new T.BoxGeometry(ww-1,TOPH-WALL,dd-1),glass);g.position.set(px,(WALL+TOPH)/2,pz);g.renderOrder=2;scene.add(g);
      addMesh(new T.BoxGeometry(ww+.4,1,dd+.4),frame,px,TOPH,pz);addMesh(new T.BoxGeometry(ww+.4,1,dd+.4),frame,px,WALL+.4,pz);
    }
    for(const[px,pz]of[[x0+2,y0+2],[x1-2,y0+2],[x0+2,y1-2],[x1-2,y1-2],[cx-9,y0+2],[cx+9,y0+2]])addMesh(new T.BoxGeometry(2.2,TOPH,2.2),frame,px,TOPH/2,pz);
    const rm=new T.MeshStandardMaterial({color:0x8f918b,roughness:.95,transparent:true,opacity:1});
    const roof=addMesh(new T.BoxGeometry(w+6,2.4,d+6),rm,cx,TOPH+1.6,cz);ourRoofs.push({roof,b});
  }
}
function addMesh(geo,mat,x,y,z,ry){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;scene.add(m);if(meshOwner)(meshOwner.meshes=meshOwner.meshes||[]).push(m);return m;}
// See-through cover (Bryan: "When my players are behind a wall or object, that object should turn translucent. I think Dark
// Descent did this"): a few times a second, anything tall standing between the camera and one of our men fades to
// see-through, and comes back once he's clear. Inside the office building the walls are cut low already.
let meshOwner=null;   // the map object meshObjs is building: addMesh files its meshes under it (o.meshes)
const SEE_H=15,SEE_SKIP=new Set(['gate','tower','wtower','pylon','bridge','gatehouse','gtower','fortwall','pit','relay','void','water']),fadeObjs=new Set();let seeT=0;
function segHitsBox(ax,ay,az,bx,by,bz,x0,y0,z0,x1,y1,z1){   // does the segment a-b pass through the box? (slabs)
  let t0=0,t1=1;const d=[bx-ax,by-ay,bz-az],o=[ax,ay,az],lo=[x0,y0,z0],hi=[x1,y1,z1];
  for(let k=0;k<3;k++){
    if(Math.abs(d[k])<1e-9){if(o[k]<lo[k]||o[k]>hi[k])return false;continue;}
    let ta=(lo[k]-o[k])/d[k],tb=(hi[k]-o[k])/d[k];if(ta>tb){const q=ta;ta=tb;tb=q;}
    t0=Math.max(t0,ta);t1=Math.min(t1,tb);if(t0>t1)return false;
  }
  return t1>0&&t0<.97;   // (not the bit right at his feet)
}
function seeThrough(rdt){
  seeT-=rdt;
  if(seeT<=0){
    seeT=.12;const c=camera.position,hit=new Set();
    if(MAPID!=='in')for(const p of players){
      if(p.dead||p.offMap||p.carriedBy)continue;const ty=(p.downed?3:p.crawl?2:11)+(p.elev||0);
      for(const o of objs){if(!o.meshes||SEE_SKIP.has(o.kind)||objHeight(o)<SEE_H)continue;if(segHitsBox(c.x,c.y,c.z,p.x,ty,p.y,o.x,0,o.y,o.x+o.w,objHeight(o),o.y+o.h))hit.add(o);}
    }
    for(const o of hit){if(!fadeObjs.has(o)){fadeObjs.add(o);for(const m of o.meshes)if(!m.userData.ownMat){m.material=m.material.clone();m.userData.ownMat=true;}}o.fadeTo=.28;}   // (its own materials, so nothing else fades with it)
    for(const o of fadeObjs)if(!hit.has(o))o.fadeTo=1;
  }
  for(const o of fadeObjs){
    o.fadeA=(o.fadeA??1)+((o.fadeTo??1)-(o.fadeA??1))*Math.min(1,rdt*7);const done=o.fadeTo===1&&o.fadeA>.985;
    for(const m of o.meshes){const mt=m.material;mt.opacity=done?1:o.fadeA;mt.transparent=!done;mt.depthWrite=done||o.fadeA>.9;}
    if(done){o.fadeA=1;fadeObjs.delete(o);}
  }
}
const lamps=[   // (front: the data center's front, dark once Level 2's power is cut: darkFront in level2.js)
  {x:310,y:566,h:22,c:0xffa860,i:3.4,d:260,flick:1},
  {x:30,y:560,h:40,c:0xffa860,i:2.8,d:300,pole:1},
  {x:570,y:240,h:40,c:0xc4d6ff,i:2.4,d:300,pole:1},   // the yard's north end, by the canal
  {x:560,y:870,h:40,c:0xffa860,i:2.4,d:280,pole:1},
  {x:310,y:410,h:30,c:0xffd9a8,i:2.4,d:260},
  {x:150,y:846,h:14,c:0xffc27a,i:1.6,d:150,pole:1},   // the dock, at the pier
  {x:525,y:56,h:30,c:0xffa860,i:2.6,d:280,pole:1},    // the bridge's north end
  {x:640,y:-190,h:40,c:0xc4d6ff,i:2.2,d:280,pole:1},  // the container yard's east block
  {x:495,y:-338,h:30,c:0xffa860,i:2.4,d:240,pole:1,front:1},  // over the front's machine-gun nest
  {x:245,y:-424,h:24,c:0xffd9a8,i:2.6,d:260,front:1},          // the data center's doors
  {x:916,y:-560,h:44,c:0xc4d6ff,i:2.2,d:280,pole:1},   // the drawbridge
];
let hemi,muzzle=[],boomL,jeepLight=null,moon,dinghy,tunnelRoof=null,meshObjs=null;const FLOOD_HEADS=[];   // (the floodlights' lamp material: darkFront)   // (meshObjs: set by buildWorld)
// Every light costs every pixel on screen (a phone feels it), so the street lamps share LAMP_POOL lights: each frame the lamps
// nearest the middle of the view get them, the one at the edge of the set fading so nothing pops (lampLights in render)
const LAMP_POOL=6;let lampPool=[];   // (the interior has its own pool and lights: interior.js swaps these)
function buildWorld(){
  const corrTex=canvasTex(64,64,(g,w,h)=>{
    for(let x=0;x<w;x+=8){const gr=g.createLinearGradient(x,0,x+8,0);gr.addColorStop(0,'#8a8a8a');gr.addColorStop(.5,'#f0f0f0');gr.addColorStop(1,'#8a8a8a');g.fillStyle=gr;g.fillRect(x,0,8,h);}
    const r=rng(5);for(let i=0;i<46;i++){g.fillStyle=`rgba(${120+r()*40|0},${62+r()*20|0},30,${.15+r()*.3})`;g.fillRect(r()*w,r()*h,1+r()*3,1+r()*6);}
  });
  const woodTex=canvasTex(64,64,(g,w,h)=>{
    g.fillStyle='#c9a578';g.fillRect(0,0,w,h);const r=rng(9);
    for(let y=0;y<h;y+=16){g.fillStyle=`rgba(0,0,0,${.05+r()*.14})`;g.fillRect(0,y,w,16);g.fillStyle='rgba(40,25,10,.6)';g.fillRect(0,y,w,1.5);
      for(let i=0;i<5;i++){g.strokeStyle='rgba(90,60,30,.25)';g.beginPath();const yy=y+3+r()*10;g.moveTo(0,yy);g.lineTo(w,yy+r()*2-1);g.stroke();}}
  });
  const hazTex=canvasTex(64,16,(g,w,h)=>{g.fillStyle='#b9b9b2';g.fillRect(0,0,w,h);g.fillStyle='#d9772e';for(let x=-16;x<w+16;x+=16){g.beginPath();g.moveTo(x,h);g.lineTo(x+8,h);g.lineTo(x+16,0);g.lineTo(x+8,0);g.fill();}});
  const shelfTex=canvasTex(128,32,(g,w,h)=>{g.fillStyle='#2a2f34';g.fillRect(0,0,w,h);const r=rng(3);for(let x=2;x<w-8;x+=10+r()*6){const t=110+r()*80|0;g.fillStyle=`rgb(${t},${t*.75|0},${t*.5|0})`;g.fillRect(x,4,8+r()*4,h-8);}g.fillStyle='#55606a';g.fillRect(0,0,w,2);g.fillRect(0,h-2,w,2);});
  const linkTex=canvasTex(32,32,(g,w,h)=>{g.strokeStyle='#c8cdd2';g.lineWidth=1.6;g.beginPath();g.moveTo(0,0);g.lineTo(w,h);g.moveTo(w,0);g.lineTo(0,h);g.stroke();});
  drawGround();
  const atex=new T.CanvasTexture(acan);
  const ground=new T.Mesh(new T.PlaneGeometry(W,H-TOP),wetGround(new T.MeshStandardMaterial({map:gtex,roughnessMap:rtex,roughness:1,metalness:.18,alphaMap:atex,alphaTest:.5}),W,H-TOP));
  ground.rotation.x=-Math.PI/2;ground.position.set(W/2,0,(H+TOP)/2);ground.receiveShadow=true;scene.add(ground);
  // the runway's edge lights: small glowing studs along both edges, amber at the ends (they bloom; no real lights)
  {const pts=[];for(let x=30;x<=W-30;x+=60)for(const y of[ROAD.y0+2,ROAD.y1-2])pts.push([x,y,x<60||x>W-60]);
   const geo=new T.BoxGeometry(2.4,1.4,2.4),mk=(col,list)=>{const m=new T.InstancedMesh(geo,new T.MeshBasicMaterial({color:col,toneMapped:false}),list.length),o=new T.Object3D();
     list.forEach(([x,y],i)=>{o.position.set(x,.8,y);o.updateMatrix();m.setMatrixAt(i,o.matrix);});scene.add(m);};
   mk(0xcfe2ff,pts.filter(p=>!p[2]));mk(0xffb347,pts.filter(p=>p[2]));}
  // the ground beyond the map: four strips round it (not one big plane under it, so the moat stays bottomless)
  {const om=new T.MeshStandardMaterial({color:0x1c1f22,roughness:1}),E=2500;
   for(const[x0,z0,x1,z1]of[[-E,TOP-E,W+E,TOP],[-E,H,W+E,H+E],[-E,TOP,0,H],[W,TOP,W+E,H]]){const m=new T.Mesh(new T.PlaneGeometry(x1-x0,z1-z0),om);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,-.3,(z0+z1)/2);scene.add(m);}}
  // the dock: glossy black water running off the map's south-west corner, a wooden pier with bollards, and the dinghy the squad lands in (landing in state.js)
  const water=new T.Mesh(new T.PlaneGeometry(420,330),new T.MeshStandardMaterial({color:0x0a141b,roughness:.12,metalness:.7}));
  water.rotation.x=-Math.PI/2;water.position.set(175-210,.15,DOCK.quay+165);water.receiveShadow=true;scene.add(water);
  {const pr=DOCK.pier,wm=texMat(woodTex,1,2,{color:0x7a6248,roughness:.9});
   addMesh(new T.BoxGeometry(pr.w,1.2,pr.h+4),wm,pr.x+pr.w/2,.6,pr.y+pr.h/2-2);
   for(const sx of[pr.x+1.5,pr.x+pr.w-1.5])for(const sz of[pr.y+8,pr.y+pr.h-2])addMesh(new T.CylinderGeometry(1.4,1.4,6,8),wm,sx,-1.5,sz);
   for(const bx of[30,80,165])addMesh(new T.CylinderGeometry(1.6,2,3,10),new T.MeshStandardMaterial({color:0x2a2e33,roughness:.6,metalness:.5}),bx,1.5,DOCK.quay-3);}
  dinghy=makeDinghy();dinghy.position.set(DOCK.moor.x,.2,DOCK.moor.y);
  // the canal: glossy water, the main bridge (a concrete deck with railings), the sewer pipe in the west (a crawl-sized
  // concrete pipe with low headwalls; it fades while a soldier is inside, see render) and the broken rail bridge (two rails
  // on a twisted girder with gaps)
  {const cw2=CANAL.y1-CANAL.y0,wm=new T.MeshStandardMaterial({color:0x0a141b,roughness:.12,metalness:.7});
   const cv=new T.Mesh(new T.PlaneGeometry(W+400,cw2),wm);cv.rotation.x=-Math.PI/2;cv.position.set(W/2,.15,(CANAL.y0+CANAL.y1)/2);cv.receiveShadow=true;scene.add(cv);
   const bw=MAINBR.x1-MAINBR.x0,conc=new T.MeshStandardMaterial({color:0x7d7f7a,roughness:.9}),rail=new T.MeshStandardMaterial({color:0x2a2e33,roughness:.6,metalness:.5});
   addMesh(new T.BoxGeometry(bw,2,cw2+14),conc,(MAINBR.x0+MAINBR.x1)/2,1,(CANAL.y0+CANAL.y1)/2);
   addMesh(new T.BoxGeometry(bw+8,8,6),conc,(MAINBR.x0+MAINBR.x1)/2,-3,(CANAL.y0+CANAL.y1)/2);
   {const tw=TUNNEL.x1-TUNNEL.x0,tl=TUNNEL.y1-TUNNEL.y0,tx=(TUNNEL.x0+TUNNEL.x1)/2,tz=(TUNNEL.y0+TUNNEL.y1)/2,R=tw/2-.5,cy=R-3.5;   // a crawl-sized pipe, half sunk
    const tc=new T.MeshStandardMaterial({color:0x6f716d,roughness:.95}),dark=new T.MeshBasicMaterial({color:0x050607});
    addMesh(new T.BoxGeometry(tw-3,.5,tl),new T.MeshStandardMaterial({color:0x26282a,roughness:.9}),tx,.3,tz);         // the wet floor inside
    const pipe=new T.Mesh(new T.CylinderGeometry(R,R,tl,20,1,true),new T.MeshStandardMaterial({color:0x6a6c68,roughness:.95,side:T.DoubleSide,transparent:true,opacity:1}));
    pipe.rotation.x=Math.PI/2;pipe.position.set(tx,cy,tz);pipe.castShadow=pipe.receiveShadow=true;scene.add(pipe);tunnelRoof=pipe;
    for(let k=1;k<5;k++){const ring=new T.Mesh(new T.TorusGeometry(R+.4,.7,6,20),tc);ring.position.set(tx,cy,TUNNEL.y0+tl*k/5);scene.add(ring);}   // the joints between pipe sections
    for(const z of[TUNNEL.y0,TUNNEL.y1]){   // the mouths: a low concrete headwall round a dark opening
      const out=z===TUNNEL.y0?-1:1;
      addMesh(new T.BoxGeometry(tw+16,cy+R+3,3),tc,tx,(cy+R+3)/2,z+out*1.5);
      const m=new T.Mesh(new T.CircleGeometry(R-.6,20),dark);m.position.set(tx,cy,z+out*3.1);m.rotation.y=out<0?Math.PI:0;scene.add(m);
    }}
   const rw=RAILBR.x1-RAILBR.x0,steel=new T.MeshStandardMaterial({color:0x3d3a36,roughness:.7,metalness:.5});
   for(let k=0;k<6;k++){if(k===2)continue;const z=CANAL.y0-4+k*(cw2+8)/6;const m=addMesh(new T.BoxGeometry(rw,2,(cw2+8)/6-2),steel,(RAILBR.x0+RAILBR.x1)/2,1+(k===3?-1.2:0),z+(cw2+8)/12);m.rotation.z=k===3?.12:0;}
   for(const x of[RAILBR.x0+8,RAILBR.x1-8])addMesh(new T.BoxGeometry(1.4,1.4,cw2+8),rail,x,2.6,(CANAL.y0+CANAL.y1)/2);}

  const wallMat=texMat(corrTex,1,1,{color:0x59616a,roughness:.65,metalness:.35});
  const concrete=new T.MeshStandardMaterial({color:0x8d8e8a,roughness:.95});
  const darkMetal=new T.MeshStandardMaterial({color:0x2a2e33,roughness:.6,metalness:.5});
  const bagGeo=new T.SphereGeometry(1,10,6);
  // every map object by its kind, into the current scene (a function so Level 1's own map can use it: level1.js)
  meshObjs=list=>{
  const bagList=[];
  for(const o of list){
    meshOwner=o;o.meshes=null;   // (see-through cover: seeThrough)
    const cx=o.x+o.w/2,cz=o.y+o.h/2,hz=o.w>=o.h,len=hz?o.w:o.h,th=hz?o.h:o.w,ry=hz?0:Math.PI/2;
    if(o.kind==='container'){
      const m=texMat(corrTex,len/7,1,{color:o.col,roughness:.6,metalness:.35});
      addMesh(new T.BoxGeometry(len,26,th),m,cx,13,cz,ry);
      if(o.stack>1){   // a second container stacked on top, a different colour
        const m2=texMat(corrTex,len/7,1,{color:new T.Color(o.col).offsetHSL(.09,-.05,.06),roughness:.6,metalness:.35});
        addMesh(new T.BoxGeometry(len-2,26,th),m2,cx,39,cz,ry);
      }
      const endM=new T.MeshStandardMaterial({color:new T.Color(o.col).multiplyScalar(.55),roughness:.7,metalness:.3});
      const de=hz?[cx+len/2+.4,cz]:[cx,cz+len/2+.4];
      addMesh(new T.BoxGeometry(hz?1:th-2,24,hz?th-2:1),endM,de[0],12,de[1]);
    }else if(o.kind==='wall'){
      const m=texMat(corrTex,len/5,1,{color:0x59616a,roughness:.65,metalness:.35});
      addMesh(new T.BoxGeometry(len,24,th),m,cx,12,cz,ry);
    }else if(o.kind==='window'){
      addMesh(new T.BoxGeometry(len,9,th),concrete,cx,4.5,cz,ry);
      addMesh(new T.BoxGeometry(len,5,th),wallMat,cx,21.5,cz,ry);
      // the glass is broken out (they get shot and climbed through): a few jagged bits left in the frame
      const shardM=new T.MeshStandardMaterial({color:0x9fc4dd,transparent:true,opacity:.32,roughness:.1,metalness:.2,depthWrite:false,side:T.DoubleSide}),rnd=rng(o.x*7+o.y);
      for(let k=0;k<Math.round(len/7);k++){
        const along=-len/2+3+rnd()*(len-6),top=rnd()<.5,hh=2+rnd()*3.2,sh=new T.Mesh(new T.ConeGeometry(1.4+rnd()*1.4,hh,3),shardM);
        sh.scale.z=.18;sh.rotation.z=top?Math.PI:0;sh.position.set(hz?cx+along:cx,top?19-hh/2:9+hh/2,hz?cz:cz+along);sh.rotation.y=ry;scene.add(sh);
      }
    }else if(o.kind==='crate'){
      const hh=o.w*o.h>=400?14:11;
      addMesh(new T.BoxGeometry(o.w,hh,o.h),texMat(woodTex,1,1,{color:0x9a7650,roughness:.9}),cx,hh/2,cz);
    }else if(o.kind==='pallet'){
      addMesh(new T.BoxGeometry(o.w,7,o.h),texMat(woodTex,1,.5,{color:0xb89a6e,roughness:.95}),cx,3.5,cz);
    }else if(o.kind==='barrel'){
      addMesh(new T.CylinderGeometry(o.w/2,o.w/2,10,16),new T.MeshStandardMaterial({color:o.col,roughness:.45,metalness:.55}),cx,5,cz);
      addMesh(new T.TorusGeometry(o.w/2-.6,.5,6,16),darkMetal,cx,10,cz).rotation.x=Math.PI/2;
    }else if(o.kind==='barrier'){
      const m=texMat(hazTex,len/16,1,{roughness:.9});
      addMesh(new T.BoxGeometry(len,8,th),m,cx,4,cz,ry);
    }else if(o.kind==='rail'){   // a guardrail: a steel beam on short posts (half cover)
      const steel=new T.MeshStandardMaterial({color:0x9aa2a8,roughness:.45,metalness:.7});
      addMesh(new T.BoxGeometry(len,2.4,1.2),steel,cx,6,cz,ry);addMesh(new T.BoxGeometry(len,1.2,1),steel,cx,3.6,cz,ry);
      for(let t=4;t<len;t+=12){const px=hz?o.x+t:cx,pz=hz?cz:o.y+t;addMesh(new T.BoxGeometry(1.6,7,1.6),darkMetal,px,3.5,pz);}
    }else if(o.kind==='rack'){
      const m=texMat(shelfTex,len/80,1,{roughness:.8});
      addMesh(new T.BoxGeometry(len,20,th),m,cx,10,cz,ry);
    }else if(o.kind==='truck'){
      const body=new T.MeshStandardMaterial({color:o.col,roughness:.7,metalness:.3});
      const cabM=new T.MeshStandardMaterial({color:new T.Color(o.col).multiplyScalar(1.25),roughness:.6,metalness:.3});
      addMesh(new T.BoxGeometry(o.w,20,o.h-26),body,cx,14,o.y+26+(o.h-26)/2);
      addMesh(new T.BoxGeometry(o.w-6,15,22),cabM,cx,11.5,o.y+12);
      const ws=new T.Mesh(new T.BoxGeometry(o.w-10,5,.6),new T.MeshStandardMaterial({color:0x101a22,roughness:.1,metalness:.6}));ws.position.set(cx,15,o.y+1);scene.add(ws);
      const wg=new T.CylinderGeometry(5,5,4,14),wm=new T.MeshStandardMaterial({color:0x111214,roughness:.9});
      for(const z of [o.y+12,o.y+o.h-12,o.y+o.h-24])for(const s of [-1,1]){const w=addMesh(wg,wm,cx+s*(o.w/2-1),5,z);w.rotation.z=Math.PI/2;}
    }else if(o.kind==='sandbag'){
      const n=Math.max(1,Math.round(len/11)),bl=len/n;
      for(let L=0;L<3;L++)for(let i=0;i<n;i++){
        const c=(i+.5)*bl+(L%2?bl*.25:0);if(c>len)continue;
        const lx=-len/2+c;
        bagList.push({x:cx+(hz?lx:0),z:cz+(hz?0:lx),y:1.7+L*3,sx:hz?bl/2+.6:th/2,sz:hz?th/2:bl/2+.6});
      }
    }else if(o.kind==='gate'){   // chain-link gate in a steel frame; the wave-two gun jeep knocks it flat (smashGate in hq.js)
      const gg=new T.Group();gg.position.set(cx,0,cz);scene.add(gg);o.mesh=gg;
      const gm=texMat(linkTex,len/6,3,{color:0xb2b8bc,transparent:true,alphaTest:.35,side:T.DoubleSide,roughness:.6,metalness:.6});
      const pl=new T.Mesh(new T.PlaneGeometry(len,17),gm);pl.position.y=9.5;pl.rotation.y=ry;gg.add(pl);
      const rail=new T.BoxGeometry(hz?len:1.2,1.2,hz?1.2:len),post=new T.BoxGeometry(1.2,18,1.2);
      for(const y of[1,17.5]){const m=new T.Mesh(rail,darkMetal);m.position.y=y;m.castShadow=true;gg.add(m);}
      for(const sd of[-1,1]){const m=new T.Mesh(post,darkMetal);m.position.set(hz?sd*len/2:0,9,hz?0:sd*len/2);m.castShadow=true;gg.add(m);}
    }else if(o.kind==='pbwall'){   // (the pillboxes are built in one go: buildPillbox, buildOurBoxes)
    }else if(o.kind==='booth'){   // guard tower: a raised concrete sentry hut with a lit window band
      const conc=new T.MeshStandardMaterial({color:0x7d7f7a,roughness:.95});
      addMesh(new T.BoxGeometry(o.w,12,o.h),conc,cx,6,cz);
      addMesh(new T.BoxGeometry(o.w-4,16,o.h-4),new T.MeshStandardMaterial({color:0x5c6157,roughness:.85}),cx,20,cz);
      const win=new T.Mesh(new T.BoxGeometry(o.w-3.4,4,o.h-3.4),new T.MeshBasicMaterial({color:0xffcf8a,toneMapped:false}));win.position.set(cx,23,cz);scene.add(win);
      addMesh(new T.BoxGeometry(o.w+4,2,o.h+4),darkMetal,cx,29,cz);
    }else if(o.kind==='tower'||o.kind==='wtower'){   // watchtower: four legs, a railed platform, a pitched roof, a ladder and a searchlight down the road
      const leg=new T.BoxGeometry(1.8,40,1.8),wood=new T.MeshStandardMaterial({color:0x4a3b2c,roughness:.9});
      for(const sx of[-1,1])for(const sz of[-1,1])addMesh(leg,wood,cx+sx*8,20,cz+sz*8);
      addMesh(new T.BoxGeometry(24,1.6,24),wood,cx,40,cz);
      for(const[w2,d2,ox,oz]of[[24,1,0,-12],[24,1,0,12],[1,24,-12,0],[1,24,12,0]])addMesh(new T.BoxGeometry(w2,5,d2),wood,cx+ox,43.3,cz+oz);
      const roof=addMesh(new T.ConeGeometry(18,7,4),new T.MeshStandardMaterial({color:0x2a2d30,roughness:.7,metalness:.4}),cx,53,cz);roof.rotation.y=Math.PI/4;
      if(o.kind==='wtower'){addMesh(new T.BoxGeometry(5,40,1),darkMetal,cx,20,cz-11);   // the canal's watchtower: its ladder on the north side, a lamp (no real light: phones)
        const lamp=new T.Mesh(new T.CylinderGeometry(1.4,2,2.6,10),new T.MeshBasicMaterial({color:0xfff4d6,toneMapped:false}));lamp.position.set(cx-9,46,cz+9);scene.add(lamp);
      }else{addMesh(new T.BoxGeometry(1,40,5),darkMetal,cx-10.5,20,cz);
      const lamp=new T.Mesh(new T.CylinderGeometry(1.6,2.2,3,10),new T.MeshBasicMaterial({color:0xfff4d6,toneMapped:false}));lamp.position.set(cx-6,46,cz+11);scene.add(lamp);
      const sl=new T.SpotLight(0xfff1d6,2.4,420,.22,.5,1.1);sl.position.set(cx-6,46,cz+11);sl.target.position.set(CKPT.x,0,CKPT.y+330);scene.add(sl,sl.target);}
    }else if(o.kind==='tank'){   // fuel tank: white cylinder, domed top, a red band, a ladder and a pipe
      const r=o.w/2;
      o.meshes=[addMesh(new T.CylinderGeometry(r,r,30,28),new T.MeshStandardMaterial({color:o.col,roughness:.55,metalness:.35}),cx,15,cz)];   // blackened when it blows (depot.js)
      const top=addMesh(new T.SphereGeometry(r,28,8,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:o.col,roughness:.55,metalness:.35}),cx,30,cz);top.scale.y=.22;o.meshes.push(top);
      addMesh(new T.CylinderGeometry(r+.15,r+.15,3,28),new T.MeshStandardMaterial({color:0x9c2a1e,roughness:.6}),cx,22,cz);
      addMesh(new T.BoxGeometry(1,30,4),darkMetal,cx,15,cz+r+.6);
      addMesh(new T.BoxGeometry(14,2,2),darkMetal,cx-r-6,3,cz);
    }else if(o.kind==='office'){   // the office / data complex: a long block with a taller central tower, both running off the map's edge
      const winTex=canvasTex(128,64,(g,w,h)=>{g.fillStyle='#474c50';g.fillRect(0,0,w,h);const r=rng(77);
        for(let y=0;y<4;y++)for(let x=0;x<8;x++){const lit=r()<.22;g.fillStyle=lit?(r()<.5?'#f2d9a0':'#b8d6ef'):'#141a1f';g.fillRect(x*16+3,y*16+4,10,8);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x*16+3,y*16+4,10,2);}
        g.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<4;y++)g.fillRect(0,y*16+14,w,2);});
      const roof=new T.MeshStandardMaterial({color:0x2b2f33,roughness:.9}),side=(len,hgt)=>texMat(winTex,len/128,hgt/64,{roughness:.6,metalness:.25});
      addMesh(new T.BoxGeometry(o.w,90,o.h),[side(o.h,90),side(o.h,90),roof,roof,side(o.w,90),side(o.w,90)],cx,45,cz);
      const Tw=OFFICE.tower;addMesh(new T.BoxGeometry(Tw.w,170,Tw.h),[side(Tw.h,170),side(Tw.h,170),roof,roof,side(Tw.w,170),side(Tw.w,170)],Tw.x+Tw.w/2,85,Tw.y+Tw.h/2);
      const glassD=new T.MeshStandardMaterial({color:0x0c1418,roughness:.15,metalness:.6}),lampM=new T.MeshBasicMaterial({color:0xffe2b0,toneMapped:false}),front=o.y+o.h;
      const D=OFFICE.door;addMesh(new T.BoxGeometry(D.w,24,1.2),glassD,D.x+D.w/2,12,front+.6);                     // the glass atrium doors
      addMesh(new T.BoxGeometry(D.w+50,3,30),concrete,D.x+D.w/2,27,front+15);                                       // canopy on columns
      for(const sx of[-1,-.33,.33,1])addMesh(new T.BoxGeometry(3,26,3),concrete,D.x+D.w/2+sx*(D.w/2+20),13,front+28);
      for(const sx of[-1,1]){const l=new T.Mesh(new T.BoxGeometry(8,1,4),lampM);l.position.set(D.x+D.w/2+sx*28,25.4,front+16);scene.add(l);}
      for(const x of[o.x+40,o.x+o.w-140])addMesh(new T.BoxGeometry(50,26,1.2),texMat(hazTex,3,1,{color:0x9aa0a4,roughness:.6}),x,13,front+.6);   // loading doors
      for(const x of[o.x+170,o.x+470])addMesh(new T.BoxGeometry(14,18,1.2),darkMetal,x,9,front+.6);   // side entrances
      addMesh(new T.BoxGeometry(o.w-8,10,2),new T.MeshStandardMaterial({color:0x2f3438,roughness:.7}),cx,95,front-1);   // parapet
      for(const[x,z]of[[Tw.x+60,Tw.y+Tw.h-60],[Tw.x+Tw.w-60,Tw.y+Tw.h-50]]){const d=addMesh(new T.SphereGeometry(12,16,8,0,TAU,0,Math.PI/2.4),new T.MeshStandardMaterial({color:0xc9ccce,roughness:.5,side:T.DoubleSide}),x,176,z);d.rotation.x=-.9;}
      addMesh(new T.CylinderGeometry(1,1.6,60,6),darkMetal,Tw.x+Tw.w/2,200,Tw.y+Tw.h-40);const tip=new T.Mesh(new T.SphereGeometry(2,8,6),new T.MeshBasicMaterial({color:0xff3020,toneMapped:false}));tip.position.set(Tw.x+Tw.w/2,231,Tw.y+Tw.h-40);scene.add(tip);
      for(const[x,z]of[[o.x+60,front-50],[o.x+o.w-60,front-60],[o.x+o.w-120,front-130]])addMesh(new T.BoxGeometry(30,10,22),new T.MeshStandardMaterial({color:0x6c7277,roughness:.7,metalness:.4}),x,95,z);
    }else if(o.kind==='garage'){   // long garage with roll-up doors facing the road
      addMesh(new T.BoxGeometry(o.w,26,o.h),texMat(corrTex,o.w/7,1,{color:0x5d6468,roughness:.65,metalness:.35}),cx,13,cz);
      addMesh(new T.BoxGeometry(o.w+6,2,o.h+6),darkMetal,cx,27,cz);
      const shutter=canvasTex(32,32,(g,w,h)=>{g.fillStyle='#8c9296';g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.35)';for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1.2);});
      for(let k=0;k<4;k++)addMesh(new T.BoxGeometry(34,19,1),texMat(shutter,1,4,{roughness:.6,metalness:.5}),o.x+22+k*42,9.5,o.y+o.h+.6);
    }else if(o.kind==='dcblock'){   // the data center from outside: a closed block with lit and dark windows, a flat roof and glass front doors (you go in there: interior.js)
      const winTex=canvasTex(128,64,(g,w,h)=>{g.fillStyle='#3f4448';g.fillRect(0,0,w,h);const r=rng(41);
        for(let y=0;y<3;y++)for(let x=0;x<8;x++){const lit=r()<.25;g.fillStyle=lit?(r()<.5?'#e8d3a0':'#a9cbe6'):'#11171c';g.fillRect(x*16+3,y*20+6,10,10);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(x*16+3,y*20+6,10,2);}
        g.fillStyle='rgba(0,0,0,.28)';for(let y=0;y<3;y++)g.fillRect(0,y*20+18,w,2);});
      const roof=new T.MeshStandardMaterial({color:0x24282b,roughness:.9}),side=len=>texMat(winTex,len/96,1,{roughness:.6,metalness:.25});
      addMesh(new T.BoxGeometry(o.w,60,o.h),[side(o.h),side(o.h),roof,roof,side(o.w),side(o.w)],cx,30,cz);
      addMesh(new T.BoxGeometry(o.w+4,3,o.h+4),new T.MeshStandardMaterial({color:0x1a1d1f,roughness:.8}),cx,61,cz);   // roof edge
      const front=o.y+o.h,dx=DC_DOOR.x+DC_DOOR.w/2;
      addMesh(new T.BoxGeometry(DC_DOOR.w,22,1.4),new T.MeshStandardMaterial({color:0x1d2a30,roughness:.1,metalness:.6,emissive:0x0b1a20}),dx,11,front+.7);   // the glass front doors
      addMesh(new T.BoxGeometry(DC_DOOR.w+30,2.5,22),concrete,dx,25,front+11);                                                   // canopy
      for(const sx of[-1,1])addMesh(new T.BoxGeometry(2.4,24,2.4),concrete,dx+sx*(DC_DOOR.w/2+12),12,front+20);
      const strip=new T.Mesh(new T.BoxGeometry(DC_DOOR.w-6,1,3),new T.MeshBasicMaterial({color:0xffe2b0,toneMapped:false}));strip.position.set(dx,23.6,front+6);scene.add(strip);
    }else if(o.kind==='car'){   // burnt-out car
      const burnt=new T.MeshStandardMaterial({color:0x1d1b19,roughness:.95,metalness:.2});
      addMesh(new T.BoxGeometry(o.w,7,o.h),burnt,cx,5,cz);addMesh(new T.BoxGeometry(o.w*.5,6,o.h-4),burnt,cx-2,11,cz);
      const wg=new T.CylinderGeometry(3.2,3.2,2.4,10);for(const sx of[-1,1])for(const sz of[-1,1])addMesh(wg,darkMetal,cx+sx*(o.w/2-7),2.6,cz+sz*(o.h/2)).rotation.x=Math.PI/2;
    }else if(o.kind==='gatehouse'){   // the fortress gatehouse: a massive block with a recessed gate and lit slits
      const steel=texMat(corrTex,o.w/9,2,{color:0x4e545a,roughness:.55,metalness:.55});
      addMesh(new T.BoxGeometry(o.w,110,o.h),steel,cx,55,cz);
      addMesh(new T.BoxGeometry(BRIDGE.w+4,64,3),new T.MeshStandardMaterial({color:0x16191b,roughness:.4,metalness:.7}),cx,32,o.y+o.h+1);   // the gate
      addMesh(new T.BoxGeometry(BRIDGE.w+16,8,8),darkMetal,cx,68,o.y+o.h+3);
      const slit=new T.MeshBasicMaterial({color:0xffc98a,toneMapped:false});for(let k=-2;k<=2;k++){const m=new T.Mesh(new T.BoxGeometry(6,2.4,.6),slit);m.position.set(cx+k*24,92,o.y+o.h+.4);scene.add(m);}
      for(let k=-3;k<=3;k++)addMesh(new T.BoxGeometry(14,10,o.h),steel,cx+k*23,115,cz);   // battlements
    }else if(o.kind==='gtower'){   // the great towers either side of the gate
      addMesh(new T.CylinderGeometry(o.w/2+6,o.w/2+9,130,24),texMat(corrTex,14,2,{color:0x4a5056,roughness:.55,metalness:.55}),cx,65,cz);
      addMesh(new T.CylinderGeometry(o.w/2+10,o.w/2+10,8,24),darkMetal,cx,134,cz);
      const band=new T.Mesh(new T.CylinderGeometry(o.w/2+6.4,o.w/2+6.4,2.4,24,1,true),new T.MeshBasicMaterial({color:0xffc98a,toneMapped:false,side:T.DoubleSide}));band.position.set(cx,112,cz);scene.add(band);
      {const from=new T.Vector3(cx,136,cz+o.h/2),to=new T.Vector3(850,0,-420),dir=to.clone().sub(from),L=dir.length(),R=L*.2;dir.normalize();   // searchlight beams onto the approach: a glowing cone and a pool of light, no real light (cheaper)
       const beamM=new T.MeshBasicMaterial({color:0xdfe9ff,transparent:true,opacity:.07,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
       const cg=new T.ConeGeometry(R,L,20,1,true);cg.translate(0,-L/2,0);const beam=new T.Mesh(cg,beamM);beam.position.copy(from);beam.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),dir);scene.add(beam);
       const pool=new T.Mesh(new T.CircleGeometry(R,24),new T.MeshBasicMaterial({color:0xdfe9ff,transparent:true,opacity:.1,blending:T.AdditiveBlending,depthWrite:false}));pool.rotation.x=-Math.PI/2;pool.position.set(to.x,.6,to.z);scene.add(pool);}
    }else if(o.kind==='bridge'){   // the drawbridge, raised: a steel deck standing up at the moat's edge, leaning back on its hinge
      const deck=canvasTex(64,128,(g,w,h)=>{g.fillStyle='#55595c';g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=2;for(let y=0;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
        g.fillStyle='rgba(222,186,70,.7)';for(let y=4;y<h;y+=24)g.fillRect(w/2-1.5,y,3,12);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,0,6,h);g.fillRect(w-6,0,6,h);});
      const grp=new T.Group();grp.position.set(cx,0,o.y+o.h);grp.rotation.x=-.12;scene.add(grp);BRIDGE.grp=grp;   // lowered by setBridge (mission.js)
      const slab=new T.Mesh(new T.BoxGeometry(o.w,BRIDGE.len,4),[darkMetal,darkMetal,darkMetal,darkMetal,texMat(deck,1,1,{roughness:.7,metalness:.5}),darkMetal]);slab.position.set(0,BRIDGE.len/2,-2);slab.castShadow=true;grp.add(slab);
      for(const y of[12,34,56]){const gd=new T.Mesh(new T.BoxGeometry(o.w+2,3,3),darkMetal);gd.position.set(0,y,-5);grp.add(gd);}
    }else if(o.kind==='pylon'){   // lifting tower with a counterweight and a warning light; cables to the raised deck
      addMesh(new T.BoxGeometry(o.w,70,o.h),darkMetal,cx,35,cz);addMesh(new T.BoxGeometry(o.w+4,10,o.h+6),new T.MeshStandardMaterial({color:0x3d4246,roughness:.6,metalness:.5}),cx,52,cz);
      const wl=new T.Mesh(new T.SphereGeometry(1.4,8,6),new T.MeshBasicMaterial({color:0xffb030,toneMapped:false}));wl.position.set(cx,71.5,cz);scene.add(wl);
      const side=cx<BRIDGE.x+BRIDGE.w/2?-1:1,tx=BRIDGE.x+BRIDGE.w/2+side*(BRIDGE.w/2-3),ty=Math.cos(.12)*BRIDGE.len,tz=BRIDGE.y-Math.sin(.12)*BRIDGE.len-2;
      const dx=tx-cx,dy=ty-66,dz=tz-cz,len=Math.hypot(dx,dy,dz),cab=addMesh(new T.CylinderGeometry(.35,.35,len,5),darkMetal,(cx+tx)/2,(66+ty)/2,(cz+tz)/2);
      cab.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),new T.Vector3(dx/len,dy/len,dz/len));
    }else if(o.kind==='panel'){   // the drawbridge control panel: a pedestal, a screen, a big red button (glows when pressed, power off)
      addMesh(new T.BoxGeometry(o.w,12,o.h),new T.MeshStandardMaterial({color:0x4a5155,roughness:.6,metalness:.5}),cx,6,cz);
      addMesh(new T.BoxGeometry(o.w-2,5,1),new T.MeshStandardMaterial({color:0x0b1216,roughness:.2,metalness:.4}),cx,10,cz+o.h/2+.3);
      const b=new T.Mesh(new T.CylinderGeometry(1.6,1.6,1.2,12),new T.MeshStandardMaterial({color:0x7a1510,emissive:0x000000,roughness:.4}));b.position.set(cx,12.6,cz);scene.add(b);PANEL.button=b;
    }else if(o.kind==='desk'){   // office desk with a monitor
      addMesh(new T.BoxGeometry(o.w,8,o.h),new T.MeshStandardMaterial({color:0x5a4c3e,roughness:.8}),cx,4,cz);
      const mon=new T.Mesh(new T.BoxGeometry(8,5,1),new T.MeshBasicMaterial({color:0x6fb8e0,toneMapped:false}));mon.position.set(cx,11,cz);scene.add(mon);
    }else if(o.kind==='xfmr'){   // Level 2's transformer: a ribbed steel tank on a plinth, cooling fins down its long sides, three insulators on top
      const steel=new T.MeshStandardMaterial({color:0x5b6458,roughness:.55,metalness:.55}),hz2=o.w>=o.h;
      addMesh(new T.BoxGeometry(o.w,2,o.h),concrete,cx,1,cz);addMesh(new T.BoxGeometry(o.w-4,15,o.h-6),steel,cx,9.5,cz);
      for(let k=0;k<6;k++){const t=-((hz2?o.w:o.h)-8)/2+k*((hz2?o.w:o.h)-8)/5;for(const sd of[-1,1])addMesh(new T.BoxGeometry(hz2?1:3,12,hz2?3:1),steel,hz2?cx+t:cx+sd*(o.w/2-1.5),8.5,hz2?cz+sd*(o.h/2-1.5):cz+t);}
      const por=new T.MeshStandardMaterial({color:0xc9c2b0,roughness:.35,metalness:.1});for(const k of[-1,0,1])addMesh(new T.CylinderGeometry(1.1,1.5,6,8),por,hz2?cx+k*(o.w/4):cx,20,hz2?cz:cz+k*(o.h/4));
      addMesh(new T.BoxGeometry(hz2?7:.4,5,hz2?.4:7),new T.MeshStandardMaterial({color:0xd8b23a,roughness:.6}),cx,10,hz2?cz+o.h/2-2.8:cz);   // the warning plate
    }else if(o.kind==='ctank'){   // Level 2's cooling tank: a pale steel drum, two bands, a pipe off its top
      const tm=new T.MeshStandardMaterial({color:0xa9adaa,roughness:.5,metalness:.45}),R=Math.min(o.w,o.h)/2;
      addMesh(new T.CylinderGeometry(R,R,28,20),tm,cx,14,cz);for(const y of[8,20])addMesh(new T.CylinderGeometry(R+.4,R+.4,1.4,20),darkMetal,cx,y,cz);
      addMesh(new T.CylinderGeometry(R*.9,R,2,20),tm,cx,29,cz);const p=addMesh(new T.CylinderGeometry(1.4,1.4,R*1.6,8),darkMetal,cx+R*.5,30,cz);p.rotation.z=Math.PI/2;
    }else if(o.kind==='console'){   // Level 2's generator panel: a steel desk of switches and dials, screens above, a big red lever
      addMesh(new T.BoxGeometry(o.w,10,o.h),new T.MeshStandardMaterial({color:0x4a5155,roughness:.6,metalness:.5}),cx,5,cz);
      for(const k of[-1,0,1]){const m=new T.Mesh(new T.BoxGeometry(o.w/3-2,5,1),new T.MeshBasicMaterial({color:0x6fb8e0,toneMapped:false}));m.position.set(cx+k*o.w/3,14,cz-o.h/2+1);scene.add(m);}
      const lv=new T.Mesh(new T.BoxGeometry(1,5,1),new T.MeshStandardMaterial({color:0xb01e14,roughness:.4}));lv.position.set(cx+o.w/2-4,12.5,cz);scene.add(lv);o.lever=lv;
    }else if(o.kind==='core'){   // the server core: a glowing cabinet bank, the sabotage target
      addMesh(new T.BoxGeometry(o.w,18,o.h),new T.MeshStandardMaterial({color:0x1d2328,roughness:.4,metalness:.6}),cx,9,cz);
      const glow=new T.Mesh(new T.BoxGeometry(o.w+.4,3,o.h+.4),new T.MeshStandardMaterial({color:0x0b2a36,emissive:0x0a5a7a,emissiveIntensity:1.4,roughness:.3}));glow.position.set(cx,14,cz);scene.add(glow);o.mesh=glow;
    }else if(o.kind==='relay'){   // Level 1's radio relay (level1.js): a lattice mast with dishes, a blinking red light on top, its equipment cabinet
      const grp=new T.Group();grp.position.set(cx,0,cz);scene.add(grp);o.mesh=grp;const H1=72,st=new T.MeshStandardMaterial({color:0x6c7176,roughness:.5,metalness:.6});
      const bar=(w,h,d,x,y,z,rz,rx)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),st);m.position.set(x,y,z);if(rz)m.rotation.z=rz;if(rx)m.rotation.x=rx;m.castShadow=true;grp.add(m);return m;};
      for(const[sx,sz]of[[-1,-1],[1,-1],[-1,1],[1,1]])bar(1.1,H1,1.1,sx*3.4,H1/2,sz*3.4,-sx*.05,sz*.05);   // four legs leaning in
      for(let k=1;k<8;k++){const y=k*H1/8,s=5.2-3.6*y/H1;bar(s*2,.5,.5,0,y,s,0,0);bar(s*2,.5,.5,0,y,-s,0,0);bar(.5,.5,s*2,s,y,0,0,0);bar(.5,.5,s*2,-s,y,0,0,0);}   // the rungs
      for(const[a,y]of[[0,52],[2.1,60],[4.2,46]]){const dish=new T.Mesh(new T.CylinderGeometry(3.2,2.4,1.2,14),new T.MeshStandardMaterial({color:0xd8dcdc,roughness:.6}));dish.position.set(Math.cos(a)*4,y,Math.sin(a)*4);dish.rotation.z=Math.PI/2;dish.rotation.y=-a;grp.add(dish);}
      bar(.5,12,.5,0,H1+6,0,0,0);   // the whip aerial
      const li=new T.Mesh(new T.SphereGeometry(1.3,10,8),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));li.position.set(0,H1+1,0);grp.add(li);o.light=li;
      const cab=new T.Mesh(new T.BoxGeometry(9,12,7),new T.MeshStandardMaterial({color:0x3d4a3a,roughness:.7,metalness:.3}));cab.position.set(15,6,4);cab.castShadow=true;scene.add(cab);cab.position.add(grp.position);
      const led=new T.Mesh(new T.BoxGeometry(5,1,.4),new T.MeshBasicMaterial({color:0x37e08a,toneMapped:false}));led.position.set(cx+15,9,cz+7.7);scene.add(led);o.led=led;
    }else if(o.kind==='fence'){
      const fm=texMat(linkTex,len/6,3,{color:0x9aa2a8,transparent:true,alphaTest:.35,side:T.DoubleSide,roughness:.6,metalness:.6});
      const pl=new T.Mesh(new T.PlaneGeometry(len,18),fm);pl.position.set(cx,9,cz);pl.rotation.y=ry;scene.add(pl);
      const pg=new T.CylinderGeometry(.9,.9,20,6);
      for(let k=0;k<=len;k+=50){const px=hz?o.x+k:cx,pz=hz?cz:o.y+k;addMesh(pg,darkMetal,px,10,pz);}
    }
  }
  // sandbags as one instanced mesh
  meshOwner=null;
  if(!bagList.length)return;
  const bagMat=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
  const bags=new T.InstancedMesh(bagGeo,bagMat,bagList.length);
  const m4=new T.Matrix4(),q=new T.Quaternion(),pv=new T.Vector3(),sv=new T.Vector3(),col=new T.Color(),br=rng(21);
  bagList.forEach((b,i)=>{pv.set(b.x,b.y,b.z);sv.set(b.sx,1.9,b.sz);m4.compose(pv,q,sv);bags.setMatrixAt(i,m4);col.setRGB(.55+br()*.08,.49+br()*.07,.34+br()*.05);bags.setColorAt(i,col);});
  bags.castShadow=bags.receiveShadow=true;scene.add(bags);
  };
  buildPillbox();buildOurBoxes();
  meshObjs(objs);
  // the fortress wall (a giant ring, mostly beyond the map) and the moat: walls dropping away into darkness (the ground has a hole cut for it)
  {const F=FORT,wallM=texMat(corrTex,F.r0*TAU/11,3,{color:0x51575d,roughness:.55,metalness:.55});
   addMesh(new T.CylinderGeometry(F.r0,F.r0,96,160,1,true),wallM,F.cx,48,F.cy);
   addMesh(new T.TorusGeometry(F.r0,3,6,160),darkMetal,F.cx,96,F.cy).rotation.x=Math.PI/2;
   for(let k=-6;k<=6;k++){if(Math.abs(k)<2)continue;const a=Math.PI/2+k*.075,x=F.cx+Math.cos(a)*(F.r0+4),z=F.cy+Math.sin(a)*(F.r0+4);   // buttresses along the visible stretch
     addMesh(new T.BoxGeometry(16,100,14),texMat(corrTex,2,2,{color:0x464c52,roughness:.6,metalness:.5}),x,50,z,-a+Math.PI/2);}
   const shade=(geo)=>{const p=geo.attributes.position,c=[];for(let i=0;i<p.count;i++){const t=Math.pow((p.getY(i)+300)/600,3);c.push(.42*t,.44*t,.46*t);}geo.setAttribute('color',new T.Float32BufferAttribute(c,3));return geo;};
   const pitM=o=>new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:o});
   const outerW=new T.Mesh(shade(new T.CylinderGeometry(F.r1,F.r1,600,180,16,true)),pitM(T.BackSide));outerW.position.set(F.cx,-300,F.cy);scene.add(outerW);
   const innerW=new T.Mesh(shade(new T.CylinderGeometry(F.r0,F.r0,600,180,16,true)),pitM(T.FrontSide));innerW.position.set(F.cx,-300,F.cy);scene.add(innerW);}
  // roll door housing over the south door, door frame posts
  addMesh(new T.BoxGeometry(100,5,6),wallMat,310,21.5,555);
  // decoration: the checkpoint's striped boom barrier across the road
  for(const d of decor){
    if(d.kind==='wire'){   // coiled razor wire on low stakes
      const wm=new T.MeshStandardMaterial({color:0x9aa2a8,roughness:.4,metalness:.8}),n=Math.round((d.x1-d.x0)/6);
      for(let k=0;k<n;k++){const t=new T.Mesh(new T.TorusGeometry(3.2,.25,4,10),wm);t.position.set(d.x0+k*6+3,3.4,d.y);t.rotation.y=Math.PI/2+.4;scene.add(t);}
      for(let x=d.x0;x<=d.x1;x+=30)addMesh(new T.BoxGeometry(.8,7,.8),darkMetal,x,3.5,d.y);continue;}
    if(d.kind==='flood'){   // floodlight mast with a bank of lamps aimed at the approach (glow only, no extra light)
      addMesh(new T.CylinderGeometry(1,1.4,44,6),darkMetal,d.x,22,d.y);
      const lm=new T.MeshBasicMaterial({color:0xfff3d6,toneMapped:false});FLOOD_HEADS.push({material:lm});for(const o of[-4,0,4]){const m=new T.Mesh(new T.BoxGeometry(3.4,2.6,1),lm);m.position.set(d.x+o,44,d.y+1.6);m.rotation.x=-.5;scene.add(m);}
      continue;}
    const ax=d.dir==='x';   // the arm runs along x (across a north-south road) or along y
    addMesh(new T.BoxGeometry(3,11,3),darkMetal,ax?d.x-2:d.x,5.5,ax?d.y:d.y-2);
    addMesh(new T.BoxGeometry(ax?5:4,4,ax?4:5),darkMetal,ax?d.x-5:d.x,9,ax?d.y:d.y-5);
    const pv=new T.Group();pv.position.set(d.x,9,d.y);scene.add(pv);d.arm=pv;   // the arm swings up on this pivot once the checkpoint is taken (depot.js)
    const arm=new T.Mesh(new T.BoxGeometry(ax?d.len:1.4,1.4,ax?1.4:d.len),texMat(hazTex,d.len/12,1,{color:0xffd0c8,roughness:.6}));arm.position.set(ax?d.len/2:0,0,ax?0:d.len/2);arm.castShadow=true;pv.add(arm);
  }

  // lights
  hemi=new T.HemisphereLight(0x5a6e96,0x140f0b,.17);hemi.userData.base=.17;scene.add(hemi);   // a dark night: the lamps and torches carve it (docs/feel-plan.md)
  moon=new T.DirectionalLight(0x9fb4ff,.24);moon.position.set(FIT.w/2-300,620,FIT.h/2-400);moon.target.position.set(FIT.w/2,0,FIT.h/2);   // follows the camera (render)
  const phone=matchMedia('(pointer:coarse)').matches;moon.castShadow=true;moon.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);   // a smaller shadow map on phones
  Object.assign(moon.shadow.camera,{left:-620,right:620,top:620,bottom:-620,near:50,far:1900});moon.shadow.bias=-0.0008;
  scene.add(moon,moon.target);
  const poleM=new T.MeshStandardMaterial({color:0x1d2124,roughness:.6,metalness:.6});
  for(const L of lamps){   // the lamp heads and poles; their light comes from the shared pool (lampLights)
    const hd=new T.Mesh(new T.BoxGeometry(6,2,4),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(L.x,L.h+1.6,L.y);scene.add(hd);L.head=hd;
    if(L.pole)addMesh(new T.CylinderGeometry(1.2,1.6,L.h+2,8),poleM,L.x,(L.h+2)/2,L.y);
  }
  for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);scene.add(p);lampPool.push(p);}
  for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);scene.add(m);muzzle.push(m);}
  boomL=new T.PointLight(0xffa050,0,280,1.6);scene.add(boomL);
  // (no jeep headlights while the jeep is out: every light, even switched off, costs every pixel)
}

/* soldiers: built and animated in figure.js (Bryan's stylized squad) */
function makeSoldier(u){return makeFigure(u);}
// the reinforcement gun jeep: open tub, hood, wheels, roll bar, and a pintle machine gun on a turret ring at the back.
// Front is +z (it drives south). The turret group turns to follow the gunner's aim.
function makeJeep(){
  const g=new T.Group(),body=new T.MeshStandardMaterial({color:0x4b513b,roughness:.75,metalness:.3}),dark=new T.MeshStandardMaterial({color:0x1b1e1b,roughness:.7,metalness:.45});
  const part=(geo,mat,x,y,z,par=g)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;par.add(m);return m;};
  part(new T.BoxGeometry(22,6,44),body,0,7,0);
  part(new T.BoxGeometry(21,3,13),body,0,11.2,15.5);
  part(new T.BoxGeometry(20,6,.8),dark,0,13.5,8.6);
  part(new T.BoxGeometry(22,1.2,3),dark,0,8,22.3);
  const wg=new T.CylinderGeometry(5,5,4,14),wm=new T.MeshStandardMaterial({color:0x111214,roughness:.9});
  for(const z of[-14,14])for(const s of[-1,1])part(wg,wm,s*11.5,5,z).rotation.z=Math.PI/2;
  for(const s of[-1,1])part(new T.BoxGeometry(1,9,1),dark,s*10,14.5,-2);
  part(new T.BoxGeometry(21,1,1),dark,0,19,-2);
  const tur=new T.Group();tur.position.set(0,13,-8);g.add(tur);
  part(new T.TorusGeometry(5,.6,6,18),dark,0,0,0,tur).rotation.x=Math.PI/2;
  part(new T.CylinderGeometry(.7,.7,4,6),dark,0,2,0,tur);
  part(new T.BoxGeometry(16,1.5,1.5),dark,7,4.5,0,tur);
  part(new T.BoxGeometry(4,2.4,2.2),dark,1,4.5,0,tur);
  part(new T.BoxGeometry(1,5,8),body,4,5,0,tur);
  const lamp=new T.MeshBasicMaterial({color:0xfff1d6,toneMapped:false});
  for(const s of[-1,1])part(new T.BoxGeometry(3,2,.6),lamp,s*7,9.5,22.2);
  scene.add(g);return{g,tur};
}
// the enemy tank: hull, tracks with road wheels, a turret with a long gun (m.tur, turned to aim) and a pintle machine gun
// on top for its exposed gunner (m.mg). Front is +z, like the jeep.
function makeTank(){
  const g=new T.Group(),hull=new T.MeshStandardMaterial({color:0x3d4332,roughness:.8,metalness:.35}),dark=new T.MeshStandardMaterial({color:0x17191a,roughness:.75,metalness:.4});
  const part=(geo,mat,x,y,z,par=g)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;par.add(m);return m;};
  for(const s of[-1,1]){part(new T.BoxGeometry(7,8,54),dark,s*12,4.5,0);for(let k=-2;k<=2;k++)part(new T.CylinderGeometry(3.2,3.2,7.4,12),dark,s*12,3.4,k*10).rotation.z=Math.PI/2;}
  part(new T.BoxGeometry(18,7,50),hull,0,9,0);
  const glacis=part(new T.BoxGeometry(18,2,10),hull,0,11.2,22);glacis.rotation.x=-.35;
  const tur=new T.Group();tur.position.set(0,12.5,-3);g.add(tur);
  part(new T.BoxGeometry(17,6,20),hull,0,3,0,tur);
  part(new T.CylinderGeometry(1.3,1.6,30,10),dark,0,3.4,24,tur).rotation.x=Math.PI/2;
  part(new T.CylinderGeometry(2,2,4,10),dark,0,3.4,10.5,tur).rotation.x=Math.PI/2;
  const mg=new T.Group();mg.position.set(-4,6,-3);tur.add(mg);
  part(new T.CylinderGeometry(.6,.6,3,6),dark,0,1.5,0,mg);part(new T.BoxGeometry(1.2,1.2,9),dark,0,3,3,mg);
  scene.add(g);return{g,tur,mg};
}
// the squad's inflatable boat: two grey tubes meeting at a raised bow, a wooden floor, an outboard motor. Bow is -z (north).
// Level 1's helicopter (level1.js): a utility helicopter in olive drab, nose to +z: the cabin with its doors open, the
// cockpit glass, the tail boom, fin and tail rotor, skids, a two-blade main rotor with a faint blur disc, and its lights
// (red and green on the sides, a white strobe on the tail, a red beacon on top). Rotors and lights are animated by level1.js.
function makeHeli(){
  const g=new T.Group(),body=new T.MeshStandardMaterial({color:0x3b4132,roughness:.68,metalness:.25}),dark=new T.MeshStandardMaterial({color:0x14171a,roughness:.6,metalness:.4}),
    glass=new T.MeshStandardMaterial({color:0x16242e,roughness:.12,metalness:.7}),inside=new T.MeshStandardMaterial({color:0x0b0d0f,roughness:.9});
  const part=(geo,mat,x,y,z,par=g)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;par.add(m);return m;};
  part(new T.BoxGeometry(19,15,40),body,0,0,2);                                   // the cabin
  for(const sx of[-1,1])part(new T.BoxGeometry(.4,10,20),inside,sx*9.6,-.5,4);     // its doors, open: dark inside
  const nose=part(new T.SphereGeometry(10,14,10),body,0,-.5,22);nose.scale.set(.95,.78,1.15);
  const cg=part(new T.SphereGeometry(9.4,14,10,0,TAU,0,Math.PI*.55),glass,0,1.2,23);cg.scale.set(.98,.8,1.1);cg.rotation.x=-.35;   // the cockpit glass
  part(new T.BoxGeometry(15,5,22),body,0,9.5,-2);                                 // the engine housing on the roof
  const boom=part(new T.CylinderGeometry(2.2,4.2,62,10),body,0,3.5,-48);boom.rotation.x=Math.PI/2;
  part(new T.BoxGeometry(1.4,15,9),body,0,10,-77).rotation.x=-.25;               // the fin
  part(new T.BoxGeometry(14,1,5),body,0,4,-66);                                  // the tail plane
  const tr=new T.Group();tr.position.set(1.4,12,-79);g.add(tr);for(let k=0;k<2;k++){const b=part(new T.BoxGeometry(.3,13,1.6),dark,0,0,0,tr);b.rotation.x=k*Math.PI/2;}
  for(const sx of[-1,1]){part(new T.CylinderGeometry(.9,.9,52,8),dark,sx*11,-12.5,2).rotation.x=Math.PI/2;   // the skids and their struts
    for(const z of[-10,14])part(new T.BoxGeometry(1.2,6,1.4),dark,sx*9.5,-9.5,z).rotation.z=sx*.35;}
  part(new T.CylinderGeometry(1.3,1.6,6,8),dark,0,14,0);                          // the mast
  const rotor=new T.Group();rotor.position.set(0,17.5,0);g.add(rotor);
  for(let k=0;k<2;k++){const b=part(new T.BoxGeometry(148,.5,5),dark,0,0,0,rotor);b.rotation.y=k*Math.PI;}
  const disc=new T.Mesh(new T.CircleGeometry(74,40),new T.MeshBasicMaterial({color:0x8a949c,transparent:true,opacity:.07,depthWrite:false,side:T.DoubleSide}));disc.rotation.x=-Math.PI/2;disc.position.y=17.4;g.add(disc);
  const L=(c,x,y,z,r=.9)=>{const m=new T.Mesh(new T.SphereGeometry(r,8,6),new T.MeshBasicMaterial({color:c,toneMapped:false}));m.position.set(x,y,z);g.add(m);return m;};
  L(0xff2a1a,-9.8,2,8);L(0x2aff6a,9.8,2,8);const strobe=L(0xffffff,0,17,-80,1.1),beacon=L(0xff3020,0,12.6,-8,1.1);
  const lamp=new T.SpotLight(0xdfe8ff,0,320,.5,.6,1.4);lamp.position.set(0,-6,20);const lt=new T.Object3D();lt.position.set(0,-60,40);g.add(lamp,lt);lamp.target=lt;   // a landing light under the nose
  scene.add(g);g.userData={rotor,tr,strobe,beacon,lamp,disc};return g;
}
function makeDinghy(){
  const g=new T.Group(),tube=new T.MeshStandardMaterial({color:0x34383a,roughness:.55,metalness:.1}),dark=new T.MeshStandardMaterial({color:0x151719,roughness:.6,metalness:.4});
  const part=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=m.receiveShadow=true;g.add(m);return m;};
  const tg=new T.CylinderGeometry(2.6,2.6,30,12);
  for(const s of[-1,1]){const t=part(tg,tube,s*6,2.6,2);t.rotation.x=Math.PI/2;t.rotation.y=s*.07;}
  const bow=part(new T.SphereGeometry(4.6,12,8),tube,0,3,-14);bow.scale.set(1.5,.62,1.1);
  part(new T.BoxGeometry(10,1,30),new T.MeshStandardMaterial({color:0x5a4a38,roughness:.9}),0,1,2);
  part(new T.BoxGeometry(14,4,1.4),tube,0,2.6,17);
  part(new T.BoxGeometry(3.4,6,3.4),dark,0,6,19.5);part(new T.BoxGeometry(1.2,6,1.6),dark,0,1,20);
  scene.add(g);return g;
}
function syncUnits(t){
  for(const u of units){
    const m=u.m;if(!m)continue;
    const pk=peekOf(u);u.lx+=((pk?pk.x-u.x:0)-u.lx)*.25;u.ly+=((pk?pk.y-u.y:0)-u.ly)*.25;  // step out to the lean spot and back
    m.g.position.set(u.x+u.lx,(u.elev||0)+(MAPID==='in'?stairElev(u.x,u.y):0),u.y+u.ly);m.g.rotation.y=-u.ang;   // (on the office stairs: up or down with the steps, interior.js)
    m.g.visible=!u.gone&&!u.inHeli&&!u.away&&!offFloor(u)&&((u.side==='P'&&u.seat!=='driver')||u.vis||(u.dead&&u.seen)||(!!u.gunner&&u.side==='P')||(u.side==='C'&&!!u.detained));   // (a detained scientist is always with the squad: office.js)   // our jeep gunner is always in plain view (an enemy machine gunner only once seen); riders sit visible, the driver is hidden
    if(u.mon){monPose(u,t);continue;}   // (monsters.js)
    if(u.dog){dogPose(u,t);continue;}   // (hunt.js)
    if(u.veh){truckPose(u);continue;}   // the gun truck (mission.js)
    const lying=u.downed||u.dead||simT<(u.stunT||0),cr=!lying&&u.crawl;
    if(m.fig){if(u.carriedBy)figCarried(u,m);figRefresh(u);figAnimate(u,m);}
    m.ring.visible=!u.dead&&!u.carriedBy;m.ring.material.opacity=u.downed?.35:m.person&&u.side!=='P'?.45:.85;
    if(m.spot)m.spot.intensity=lying||cr?0:2.6;   // no torch while lying or crawling
    if(m.beam)m.beam.visible=!(lying||cr);
  }
  for(const s of extraFigs)if(s.m&&s.m.g.parent){s.m.g.position.set(s.x,0,s.y);s.m.g.rotation.y=-s.ang;figAnimate(s,s.m);}   // (Level 1's wounded scout)
}
function lampLights(now){   // hand the pooled lights to the lamps nearest the view's centre
  const by=lamps.filter(L=>!L.floor||L.floor===curFloor).map(L=>({L,d:hyp(L.x-camT.x,L.y-camT.z)})).sort((a,b)=>a.d-b.d),edge=by[LAMP_POOL]?by[LAMP_POOL].d:1e9;
  lampPool.forEach((p,k)=>{const q=by[k];if(!q){p.intensity=0;return;}const L=q.L;let i=L.off?0:L.i*clamp((edge-q.d)/80,0,1);   /* (off: Level 2's lamps once the power's cut, the data center's front after it) */
    if(L.flick&&!reduced){const f=Math.sin(now*13.1)+Math.sin(now*7.3);if(f>1.85)i*=.3;}
    p.color.setHex(L.c);p.intensity=i;p.distance=L.d;p.position.set(L.x,L.h,L.y);});
}
let shakeK=0;
function shake(k){if(!reduced)shakeK=Math.min(1.2,Math.max(shakeK,k*(timeScale()<1?.4:1)));}   // blasts and machine guns nearby (muted in slow-mo)
function render(rdt,now){
  updateCamera();syncUnits(now);if(typeof crPoolsFrame==='function')crPoolsFrame();seeThrough(rdt);   // (monsters out of sight: their slots hidden, creatures.js)
  if(shakeK>.002){const a=shakeK*4;camera.position.x+=(Math.random()-.5)*a;camera.position.y+=(Math.random()-.5)*a*.6;camera.position.z+=(Math.random()-.5)*a;camera.updateMatrixWorld();shakeK=Math.max(0,shakeK-rdt*3);}
  if(tunnelRoof){const m=tunnelRoof.material,inside=players.some(p=>alive(p)&&hideAt(p.x,p.y));m.opacity+=((inside?.22:1)-m.opacity)*Math.min(1,rdt*8);m.depthWrite=m.opacity>.95;}   // see your men in the sewer pipe
  for(const{roof,b}of ourRoofs){const m=roof.material,inside=players.some(p=>alive(p)&&p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1);m.opacity+=((inside?.15:1)-m.opacity)*Math.min(1,rdt*8);m.depthWrite=m.opacity>.95;}   // see your men in our pillboxes
  if(dinghy){dinghy.rotation.z=reduced?0:Math.sin(now*1.7)*.035;dinghy.rotation.x=reduced?0:Math.sin(now*1.1)*.02;}   // bobbing on the water
  if(moon){moon.position.set(camT.x-300,620,camT.z-400);moon.target.position.set(camT.x,0,camT.z);}   // the shadow box follows the view: the map is bigger than one shadow map (no moon indoors)
  lampLights(now);
  hemi.intensity=(hemi.userData.base??.24)+storm*1.6+(MAPID==='in'?Math.max(0,2.2-zoom)*.16:0);   // inside: more ambient light zoomed out, where the pooled lamps can't reach every room
  const fl=flashes.slice(-2);
  for(let k=0;k<2;k++){const m=muzzle[k],f=fl[k];if(f){m.position.set(f.x,13,f.y);m.intensity=(MAPID==='in'?6:4.5)*(1-f.t/.07);}else m.intensity=0;}   // muzzle flashes light the scene up (most of all indoors)
  const b=booms[booms.length-1];if(b){boomL.position.set(b.x,18,b.y);boomL.intensity=7*(1-b.t/.6);}else boomL.intensity=0;
  fxFrame();postRender(scene,camera);   // (post.js: bloom, the grade, vignette, grain; or straight to the screen)
  drawOverlay(rdt,now);
}
