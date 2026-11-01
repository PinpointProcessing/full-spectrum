"use strict";
/* 3D scene: renderer, camera, world meshes, lights, soldier models, per-frame render.
   Everything that needs THREE is created in initGL() so main.js can bail out cleanly without WebGL. */
const T=window.THREE;
const FOG=0x06090d;
let renderer,scene,camera,_v,_o,_d,gtex,rtex,SG;
function initGL(){
  if(!T)return false;
  try{renderer=new T.WebGLRenderer({canvas:cv,antialias:true,powerPreference:'high-performance'});}
  catch(e){return false;}
  renderer.outputEncoding=T.sRGBEncoding;
  renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.2;
  renderer.shadowMap.enabled=true;renderer.shadowMap.type=T.PCFSoftShadowMap;
  scene=new T.Scene();
  scene.background=new T.Color(FOG);scene.fog=new T.FogExp2(FOG,0.00042);
  camera=new T.PerspectiveCamera(34,1,10,6000);
  _v=new T.Vector3();_o=new T.Vector3();_d=new T.Vector3();
  gtex=new T.CanvasTexture(gcan);rtex=new T.CanvasTexture(rcan);
  gtex.encoding=T.sRGBEncoding;
  SG={legs:new T.CylinderGeometry(2.5,2.3,6,8),body:new T.CylinderGeometry(3.3,2.9,8,8),head:new T.SphereGeometry(2.3,10,8),
    helm:new T.SphereGeometry(2.8,10,6,0,Math.PI*2,0,Math.PI/2),rifle:new T.BoxGeometry(11,1.3,1.4),pack:new T.BoxGeometry(3,5.5,5),
    band:new T.CylinderGeometry(3.45,3.45,1.8,8),ring:new T.RingGeometry(5.8,7.4,36)};
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
  camT.x=clamp(camT.x,VB.x0-CAM_OVER,VB.x1+CAM_OVER);camT.z=clamp(camT.z,VB.z0-CAM_OVER,VB.z1+CAM_OVER);
  const fb=$('#fitBtn');if(fb)fb.hidden=zoom<1.02&&Math.abs(yaw)<0.02&&tilt<0.02;
}
function toS(x,y,h=0){_v.set(x,h,y).project(camera);return[(_v.x+1)/2*cw,(1-_v.y)/2*ch];}
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
function zoomAround(sx,sy,nz){
  const[wx,wz]=toW(sx,sy);zoom=clamp(nz,1,MAXZ);updateCamera();
  const[ax,az]=toW(sx,sy);camT.x+=wx-ax;camT.z+=wz-az;clampCam();updateCamera();
}
/* ---------- 3D scene ---------- */
function canvasTex(w,h,draw){
  const c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);
  const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}
function texMat(tex,rx,ry,opts){const t=tex.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return new T.MeshStandardMaterial(Object.assign({map:t},opts));}

/* ground: painted once, decals painted in as the fight happens */
const gcan=document.createElement('canvas'),rcan=document.createElement('canvas'),acan=document.createElement('canvas'),GS=1;   // ground texture: 1 px per unit (the map is 1300 x 2350); acan: the ground's alpha (the moat is a hole)
function drawGround(){
  const MH=H-TOP;   // painted in world units: the canvas starts at y TOP
  gcan.width=Math.round(W*GS);gcan.height=Math.round(MH*GS);rcan.width=W;rcan.height=MH;
  const g=gcan.getContext('2d'),q=rcan.getContext('2d');g.setTransform(GS,0,0,GS,0,-TOP*GS);q.setTransform(1,0,0,1,0,-TOP);
  const r=rng(1337);
  g.fillStyle='#4c4f52';g.fillRect(0,TOP,W,MH);q.fillStyle='rgb(210,210,210)';q.fillRect(0,TOP,W,MH);
  for(let y=TOP;y<H;y+=75)for(let x=0;x<W;x+=75){g.fillStyle=(r()<.5?'rgba(255,255,255,':'rgba(0,0,0,')+(0.03+r()*0.07).toFixed(3)+')';g.fillRect(x,y,75,75);}
  g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=1;
  for(let x=0;x<=W;x+=75){g.beginPath();g.moveTo(x+.5,TOP);g.lineTo(x+.5,H);g.stroke();}
  for(let y=TOP;y<=H;y+=75){g.beginPath();g.moveTo(0,y+.5);g.lineTo(W,y+.5);g.stroke();}
  for(let i=0;i<15000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.22)';g.fillRect(r()*W,TOP+r()*MH,r()*1.6+.4,r()*1.6+.4);}
  for(let i=0;i<60;i++){const x=r()*W,y=TOP+r()*MH,rad=8+r()*34,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(0,0,0,.4)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}
  for(let i=0;i<28;i++){
    const x=20+r()*(W-40),y=TOP+20+r()*(MH-40),rx=10+r()*32,ry=6+r()*16,a=r()*Math.PI;
    for(const[c,fill]of[[g,'rgba(40,52,64,.2)'],[q,'rgb(30,30,30)']]){c.save();c.translate(x,y);c.rotate(a);c.fillStyle=fill;c.beginPath();c.ellipse(0,0,rx,ry,0,0,7);c.fill();c.restore();}
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
  // the depot: wet asphalt roads (the curve from the smashed gate, the main road north, the fork's two branches) with
  // lane markings, a stop line south of the checkpoint, and container bays
  const curve=c=>{c.beginPath();c.moveTo(CURVE.a.x-30,CURVE.a.y);c.lineTo(CURVE.a.x,CURVE.a.y);c.quadraticCurveTo(CURVE.c.x,CURVE.c.y,CURVE.b.x,CURVE.b.y);};
  for(const c of[g,q]){
    c.fillStyle=c.strokeStyle=c===g?'#2c2f33':'rgb(70,70,70)';
    c.fillRect(MAIN.x0,MAIN.y0-10,MAIN.x1-MAIN.x0,H-8-MAIN.y0+10);
    curve(c);c.lineWidth=CURVE.hw*2;c.lineCap='butt';c.stroke();
    for(const rd of[LEFT_RD,RIGHT_RD]){c.beginPath();c.moveTo(rd.a.x,rd.a.y);c.quadraticCurveTo(rd.c.x,rd.c.y,rd.b.x,rd.b.y);c.lineWidth=rd.hw*2;c.stroke();}
    c.beginPath();c.arc(FORK.x,FORK.y,25,0,TAU);c.fill();
    c.fillRect(PLAZA.x,PLAZA.y,PLAZA.w,PLAZA.h);   // the office forecourt
  }
  g.strokeStyle='rgba(222,186,70,.6)';g.lineWidth=2;g.setLineDash([14,12]);g.beginPath();
  const cx=(MAIN.x0+MAIN.x1)/2;
  g.moveTo(cx,H-10);g.lineTo(cx,FORK.y+26);
  g.stroke();for(const rd of[LEFT_RD,RIGHT_RD]){g.beginPath();for(let t=.08;t<=.95;t+=.02){const p=quadPt(rd,t);t>.09?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);}g.stroke();}g.beginPath();for(let t=0;t<=.8;t+=.02){const p=curvePt(t);t?g.lineTo(p.x,p.y):g.moveTo(p.x,p.y);}g.stroke();g.setLineDash([]);
  g.strokeStyle='rgba(235,235,235,.6)';g.lineWidth=3;g.beginPath();g.moveTo(MAIN.x0+3,CKPT.y+12);g.lineTo(MAIN.x1-3,CKPT.y+12);g.stroke();
  g.strokeStyle='rgba(230,230,230,.1)';g.lineWidth=1;for(let y=300;y<880;y+=90)for(let x=625;x<990;x+=130)g.strokeRect(x,y,120,44);
  // tyre marks where the gun jeep came through the gate
  g.strokeStyle='rgba(0,0,0,.28)';g.lineWidth=3;for(const o of[-8,8]){g.beginPath();g.moveTo(640,57+o);g.bezierCurveTo(560,57+o,520,90+o,500,140+o);g.stroke();}
  // the dock: dark water (a lit plane over it, see buildWorld), a concrete quay edge and bollards
  for(const c of[g,q]){c.fillStyle=c===g?'#0b1216':'rgb(20,20,20)';c.fillRect(0,DOCK.quay,175,H-DOCK.quay);}
  g.fillStyle='#8a8b86';g.fillRect(0,DOCK.quay-6,178,6);g.fillRect(175,DOCK.quay-6,4,H-DOCK.quay+6);
  g.fillStyle='rgba(228,182,40,.8)';g.fillRect(0,DOCK.quay-7,178,1.4);
  // the office forecourt: parking bays and a painted drop-off box in front of the doors
  g.strokeStyle='rgba(230,230,230,.16)';g.lineWidth=1.2;for(let x=PLAZA.x+60;x<PLAZA.x+PLAZA.w-60;x+=26){if(x>OFFICE.door.x-30&&x<OFFICE.door.x+OFFICE.door.w+30)continue;g.strokeRect(x,PLAZA.y+70,24,46);}
  g.strokeStyle='rgba(222,186,70,.5)';g.lineWidth=2;g.strokeRect(OFFICE.door.x-10,PLAZA.y+6,OFFICE.door.w+20,40);
  // the fort's island: riveted steel deck plates
  g.save();g.beginPath();g.arc(FORT.cx,FORT.cy,FORT.r0,0,TAU);g.clip();g.fillStyle='#3b4044';g.fillRect(FORT.cx-FORT.r0,FORT.cy-FORT.r0,FORT.r0*2,FORT.r0*2);
  g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1;for(let k=-FORT.r0;k<FORT.r0;k+=24){g.beginPath();g.moveTo(FORT.cx+k,FORT.cy-FORT.r0);g.lineTo(FORT.cx+k,FORT.cy+FORT.r0);g.moveTo(FORT.cx-FORT.r0,FORT.cy+k);g.lineTo(FORT.cx+FORT.r0,FORT.cy+k);g.stroke();}g.restore();
  // the moat's edge: a concrete lip with a yellow-black warning band
  g.lineWidth=5;g.strokeStyle='#8a8b86';g.beginPath();g.arc(FORT.cx,FORT.cy,FORT.r1+2.5,0,TAU);g.stroke();
  g.lineWidth=2;g.setLineDash([8,8]);g.strokeStyle='rgba(228,182,40,.85)';g.beginPath();g.arc(FORT.cx,FORT.cy,FORT.r1+6,0,TAU);g.stroke();g.setLineDash([]);
  for(const o of objs){if(o.kind==='fence'||o.kind==='water'||o.kind==='pit'||o.kind==='fortcore')continue;g.fillStyle='rgba(0,0,0,.32)';g.fillRect(o.x-3,o.y-3,o.w+6,o.h+6);}
  // alpha: the moat is cut out of the ground so you look down into it
  acan.width=Math.round(W/2);acan.height=Math.round(MH/2);const a=acan.getContext('2d');a.setTransform(.5,0,0,.5,0,-TOP*.5);
  a.fillStyle='#fff';a.fillRect(0,TOP,W,MH);a.fillStyle='#000';a.beginPath();a.arc(FORT.cx,FORT.cy,FORT.r1,0,TAU);a.arc(FORT.cx,FORT.cy,FORT.r0,0,TAU,true);a.fill('evenodd');
  gtex.needsUpdate=true;rtex.needsUpdate=true;
}
function paintDecal(d){
  const g=gcan.getContext('2d');g.setTransform(GS,0,0,GS,0,-TOP*GS);
  if(d.k==='scorch'){const gr=g.createRadialGradient(d.x,d.y,0,d.x,d.y,26);gr.addColorStop(0,'rgba(0,0,0,.75)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(d.x,d.y,26,0,7);g.fill();}
  else{g.fillStyle='rgba(80,8,6,.7)';g.beginPath();g.ellipse(d.x+2,d.y+1,9+d.r*4,6+d.r*3,d.r*3,0,7);g.fill();}
  gtex.needsUpdate=true;
}

const HGT={container:26,wall:24,crate:11,barrel:10,truck:22,pallet:7,barrier:8,rack:20};
function addMesh(geo,mat,x,y,z,ry){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;scene.add(m);return m;}
const lamps=[
  {x:310,y:566,h:22,c:0xffa860,i:3.4,d:260,flick:1},
  {x:30,y:560,h:40,c:0xffa860,i:2.8,d:300,pole:1},
  {x:570,y:200,h:40,c:0xc4d6ff,i:2.4,d:300,pole:1},
  {x:560,y:870,h:40,c:0xffa860,i:2.4,d:280,pole:1},
  {x:310,y:410,h:30,c:0xffd9a8,i:2.4,d:260},
  {x:150,y:846,h:14,c:0xffc27a,i:1.6,d:150,pole:1},   // the dock, at the pier
  {x:1084,y:-270,h:40,c:0xffa860,i:2.6,d:300,pole:1},   // depot: the checkpoint
  {x:1088,y:-150,h:40,c:0xc4d6ff,i:2.2,d:280,pole:1},   // depot: where the curving road meets the main road
  {x:600,y:-994,h:24,c:0xffd9a8,i:2.4,d:240},            // north: the office entrance
  {x:1132,y:-1003,h:44,c:0xc4d6ff,i:2.4,d:300,pole:1},   // north: the drawbridge
];
let hemi,muzzle=[],boomL,jeepLight,moon,dinghy;
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
  const ground=new T.Mesh(new T.PlaneGeometry(W,H-TOP),new T.MeshStandardMaterial({map:gtex,roughnessMap:rtex,roughness:1,metalness:.18,alphaMap:atex,alphaTest:.5}));
  ground.rotation.x=-Math.PI/2;ground.position.set(W/2,0,(H+TOP)/2);ground.receiveShadow=true;scene.add(ground);
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

  const wallMat=texMat(corrTex,1,1,{color:0x59616a,roughness:.65,metalness:.35});
  const concrete=new T.MeshStandardMaterial({color:0x8d8e8a,roughness:.95});
  const darkMetal=new T.MeshStandardMaterial({color:0x2a2e33,roughness:.6,metalness:.5});
  const glass=new T.MeshStandardMaterial({color:0x9fc4dd,transparent:true,opacity:.16,roughness:.1,metalness:.2,depthWrite:false});
  const bagGeo=new T.SphereGeometry(1,10,6),bagList=[];

  for(const o of objs){
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
      const gl=new T.Mesh(new T.BoxGeometry(len,10,1),glass);gl.position.set(cx,14,cz);gl.rotation.y=ry;scene.add(gl);
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
    }else if(o.kind==='booth'){   // guard tower: a raised concrete sentry hut with a lit window band
      const conc=new T.MeshStandardMaterial({color:0x7d7f7a,roughness:.95});
      addMesh(new T.BoxGeometry(o.w,12,o.h),conc,cx,6,cz);
      addMesh(new T.BoxGeometry(o.w-4,16,o.h-4),new T.MeshStandardMaterial({color:0x5c6157,roughness:.85}),cx,20,cz);
      const win=new T.Mesh(new T.BoxGeometry(o.w-3.4,4,o.h-3.4),new T.MeshBasicMaterial({color:0xffcf8a,toneMapped:false}));win.position.set(cx,23,cz);scene.add(win);
      addMesh(new T.BoxGeometry(o.w+4,2,o.h+4),darkMetal,cx,29,cz);
    }else if(o.kind==='tower'){   // watchtower: four legs, a railed platform, a pitched roof, a ladder and a searchlight down the road
      const leg=new T.BoxGeometry(1.8,40,1.8),wood=new T.MeshStandardMaterial({color:0x4a3b2c,roughness:.9});
      for(const sx of[-1,1])for(const sz of[-1,1])addMesh(leg,wood,cx+sx*8,20,cz+sz*8);
      addMesh(new T.BoxGeometry(24,1.6,24),wood,cx,40,cz);
      for(const[w2,d2,ox,oz]of[[24,1,0,-12],[24,1,0,12],[1,24,-12,0],[1,24,12,0]])addMesh(new T.BoxGeometry(w2,5,d2),wood,cx+ox,43.3,cz+oz);
      const roof=addMesh(new T.ConeGeometry(18,7,4),new T.MeshStandardMaterial({color:0x2a2d30,roughness:.7,metalness:.4}),cx,53,cz);roof.rotation.y=Math.PI/4;
      addMesh(new T.BoxGeometry(1,40,5),darkMetal,cx-10.5,20,cz);
      const lamp=new T.Mesh(new T.CylinderGeometry(1.6,2.2,3,10),new T.MeshBasicMaterial({color:0xfff4d6,toneMapped:false}));lamp.position.set(cx-6,46,cz+11);scene.add(lamp);
      const sl=new T.SpotLight(0xfff1d6,2.4,420,.22,.5,1.1);sl.position.set(cx-6,46,cz+11);sl.target.position.set(CKPT.x,0,CKPT.y+330);scene.add(sl,sl.target);
    }else if(o.kind==='tank'){   // fuel tank: white cylinder, domed top, a red band, a ladder and a pipe
      const r=o.w/2;
      o.meshes=[addMesh(new T.CylinderGeometry(r,r,30,28),new T.MeshStandardMaterial({color:o.col,roughness:.55,metalness:.35}),cx,15,cz)];   // blackened when it blows (depot.js)
      const top=addMesh(new T.SphereGeometry(r,28,8,0,Math.PI*2,0,Math.PI/2),new T.MeshStandardMaterial({color:o.col,roughness:.55,metalness:.35}),cx,30,cz);top.scale.y=.22;o.meshes.push(top);
      addMesh(new T.CylinderGeometry(r+.15,r+.15,3,28),new T.MeshStandardMaterial({color:0x9c2a1e,roughness:.6}),cx,22,cz);
      addMesh(new T.BoxGeometry(1,30,4),darkMetal,cx,15,cz+r+.6);
      addMesh(new T.BoxGeometry(14,2,2),darkMetal,cx-r-6,3,cz);
    }else if(o.kind==='office'){   // the office / data building: four floors of windows (a few lit), doors on every side, kit on the roof
      const winTex=canvasTex(128,64,(g,w,h)=>{g.fillStyle='#4a4f53';g.fillRect(0,0,w,h);const r=rng(77);
        for(let y=0;y<4;y++)for(let x=0;x<8;x++){const lit=r()<.18;g.fillStyle=lit?(r()<.5?'#f2d9a0':'#b8d6ef'):'#141a1f';g.fillRect(x*16+3,y*16+4,10,8);g.fillStyle='rgba(255,255,255,.06)';g.fillRect(x*16+3,y*16+4,10,2);}
        g.fillStyle='rgba(0,0,0,.25)';for(let y=0;y<4;y++)g.fillRect(0,y*16+14,w,2);});
      const sideW=texMat(winTex,o.w/128,1,{roughness:.6,metalness:.25}),sideD=texMat(winTex,o.h/128,1,{roughness:.6,metalness:.25}),roof=new T.MeshStandardMaterial({color:0x2b2f33,roughness:.9});
      addMesh(new T.BoxGeometry(o.w,60,o.h),[sideD,sideD,roof,roof,sideW,sideW],cx,30,cz);
      const glassD=new T.MeshStandardMaterial({color:0x0c1418,roughness:.15,metalness:.6}),lampM=new T.MeshBasicMaterial({color:0xffe2b0,toneMapped:false});
      const D=OFFICE.door;addMesh(new T.BoxGeometry(D.w,18,1.2),glassD,D.x+D.w/2,9,o.y+o.h+.6);                // main entrance, glass doors
      addMesh(new T.BoxGeometry(D.w+30,2,22),concrete,D.x+D.w/2,21,o.y+o.h+11);                                   // canopy
      for(const sx of[-1,1]){addMesh(new T.BoxGeometry(2,20,2),darkMetal,D.x+D.w/2+sx*(D.w/2+12),10,o.y+o.h+20);const l=new T.Mesh(new T.BoxGeometry(5,1,3),lampM);l.position.set(D.x+D.w/2+sx*20,19.9,o.y+o.h+12);scene.add(l);}
      for(const[x,z,ry]of[[o.x-.6,o.y+140,Math.PI/2],[o.x+o.w+.6,o.y+190,Math.PI/2],[o.x+90,o.y-.6,0],[o.x+260,o.y-.6,0]])addMesh(new T.BoxGeometry(ry?1.2:20,16,ry?20:1.2),darkMetal,x,8,z);   // side and back doors (more ways in)
      addMesh(new T.BoxGeometry(46,22,1.2),texMat(hazTex,3,1,{color:0x9aa0a4,roughness:.6}),o.x+o.w-60,11,o.y+o.h+.6);   // loading door, front right
      for(const[x,z]of[[o.x+60,o.y+60],[o.x+120,o.y+60],[o.x+o.w-80,o.y+90],[o.x+200,o.y+200]])addMesh(new T.BoxGeometry(26,8,18),new T.MeshStandardMaterial({color:0x6c7277,roughness:.7,metalness:.4}),x,64,z);   // roof plant
      for(const[x,z]of[[o.x+o.w-40,o.y+40],[o.x+40,o.y+o.h-50]]){const d=addMesh(new T.SphereGeometry(9,16,8,0,TAU,0,Math.PI/2.4),new T.MeshStandardMaterial({color:0xc9ccce,roughness:.5,side:T.DoubleSide}),x,66,z);d.rotation.x=-.9;}   // satellite dishes
      addMesh(new T.CylinderGeometry(.8,1.2,40,6),darkMetal,o.x+o.w/2,80,o.y+50);const tip=new T.Mesh(new T.SphereGeometry(1.6,8,6),new T.MeshBasicMaterial({color:0xff3020,toneMapped:false}));tip.position.set(o.x+o.w/2,100.5,o.y+50);scene.add(tip);   // radio mast
    }else if(o.kind==='garage'){   // long garage with roll-up doors facing the forecourt
      addMesh(new T.BoxGeometry(o.w,26,o.h),texMat(corrTex,o.h/7,1,{color:0x5d6468,roughness:.65,metalness:.35}),cx,13,cz);
      addMesh(new T.BoxGeometry(o.w+6,2,o.h+6),darkMetal,cx,27,cz);
      const shutter=canvasTex(32,32,(g,w,h)=>{g.fillStyle='#8c9296';g.fillRect(0,0,w,h);g.fillStyle='rgba(0,0,0,.35)';for(let y=0;y<h;y+=4)g.fillRect(0,y,w,1.2);});
      for(let k=0;k<5;k++)addMesh(new T.BoxGeometry(1,19,38),texMat(shutter,1,4,{roughness:.6,metalness:.5}),o.x-.6,9.5,o.y+20+k*50+19);
    }else if(o.kind==='bridge'){   // the drawbridge, raised: a steel deck standing up at the moat's edge, leaning back on its hinge
      const deck=canvasTex(64,128,(g,w,h)=>{g.fillStyle='#55595c';g.fillRect(0,0,w,h);g.strokeStyle='rgba(0,0,0,.45)';g.lineWidth=2;for(let y=0;y<h;y+=16){g.beginPath();g.moveTo(0,y);g.lineTo(w,y);g.stroke();}
        g.fillStyle='rgba(222,186,70,.7)';for(let y=4;y<h;y+=24)g.fillRect(w/2-1.5,y,3,12);g.fillStyle='rgba(255,255,255,.05)';g.fillRect(0,0,6,h);g.fillRect(w-6,0,6,h);});
      const grp=new T.Group();grp.position.set(cx,0,o.y+o.h);grp.rotation.x=-.12;scene.add(grp);
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
    }else if(o.kind==='fence'){
      const fm=texMat(linkTex,len/6,3,{color:0x9aa2a8,transparent:true,alphaTest:.35,side:T.DoubleSide,roughness:.6,metalness:.6});
      const pl=new T.Mesh(new T.PlaneGeometry(len,18),fm);pl.position.set(cx,9,cz);pl.rotation.y=ry;scene.add(pl);
      const pg=new T.CylinderGeometry(.9,.9,20,6);
      for(let k=0;k<=len;k+=50){const px=hz?o.x+k:cx,pz=hz?cz:o.y+k;addMesh(pg,darkMetal,px,10,pz);}
    }
  }
  // sandbags as one instanced mesh
  const bagMat=new T.MeshStandardMaterial({color:0xffffff,roughness:1});
  const bags=new T.InstancedMesh(bagGeo,bagMat,bagList.length);
  const m4=new T.Matrix4(),q=new T.Quaternion(),pv=new T.Vector3(),sv=new T.Vector3(),col=new T.Color(),br=rng(21);
  bagList.forEach((b,i)=>{pv.set(b.x,b.y,b.z);sv.set(b.sx,1.9,b.sz);m4.compose(pv,q,sv);bags.setMatrixAt(i,m4);col.setRGB(.55+br()*.08,.49+br()*.07,.34+br()*.05);bags.setColorAt(i,col);});
  bags.castShadow=bags.receiveShadow=true;scene.add(bags);
  // the round metal fort on its island, and the moat: walls dropping away into darkness (the ground has a hole cut for it)
  {const F=FORT,wallM=texMat(corrTex,F.r0*TAU/9,1,{color:0x5a6066,roughness:.55,metalness:.55,side:T.DoubleSide});
   addMesh(new T.CylinderGeometry(F.r0-3,F.r0-3,46,72,1,true),wallM,F.cx,23,F.cy);
   addMesh(new T.TorusGeometry(F.r0-3,2.4,6,72),darkMetal,F.cx,46,F.cy).rotation.x=Math.PI/2;
   for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2,x=F.cx+Math.cos(a)*(F.r0-6),z=F.cy+Math.sin(a)*(F.r0-6);
     addMesh(new T.CylinderGeometry(13,14,60,20),texMat(corrTex,9,1,{color:0x50565c,roughness:.55,metalness:.55}),x,30,z);
     addMesh(new T.ConeGeometry(15,10,20),darkMetal,x,65,z);
     const w=new T.Mesh(new T.CylinderGeometry(13.3,13.3,2,20,1,true),new T.MeshBasicMaterial({color:0xffc98a,toneMapped:false,side:T.DoubleSide}));w.position.set(x,48,z);scene.add(w);}
   addMesh(new T.BoxGeometry(BRIDGE.w+6,40,4),new T.MeshStandardMaterial({color:0x1d2124,roughness:.5,metalness:.6}),F.cx,20,F.cy+F.r0-4);   // the gate, facing the bridge
   addMesh(new T.CylinderGeometry(30,34,74,28),texMat(corrTex,22,1,{color:0x464c52,roughness:.6,metalness:.5}),F.cx,37,F.cy-10);   // central keep
   const shade=(geo)=>{const p=geo.attributes.position,c=[];for(let i=0;i<p.count;i++){const t=Math.pow((p.getY(i)+300)/600,3);c.push(.42*t,.44*t,.46*t);}geo.setAttribute('color',new T.Float32BufferAttribute(c,3));return geo;};
   const pitM=o=>new T.MeshStandardMaterial({vertexColors:true,roughness:.95,side:o});
   const outerW=new T.Mesh(shade(new T.CylinderGeometry(F.r1,F.r1,600,72,16,true)),pitM(T.BackSide));outerW.position.set(F.cx,-300,F.cy);scene.add(outerW);
   const innerW=new T.Mesh(shade(new T.CylinderGeometry(F.r0,F.r0,600,72,16,true)),pitM(T.FrontSide));innerW.position.set(F.cx,-300,F.cy);scene.add(innerW);}
  // roll door housing over the south door, door frame posts
  addMesh(new T.BoxGeometry(100,5,6),wallMat,310,21.5,555);
  // decoration: the checkpoint's striped boom barrier across the road
  for(const d of decor){
    const ax=d.dir==='x';   // the arm runs along x (across a north-south road) or along y
    addMesh(new T.BoxGeometry(3,11,3),darkMetal,ax?d.x-2:d.x,5.5,ax?d.y:d.y-2);
    addMesh(new T.BoxGeometry(ax?5:4,4,ax?4:5),darkMetal,ax?d.x-5:d.x,9,ax?d.y:d.y-5);
    const pv=new T.Group();pv.position.set(d.x,9,d.y);scene.add(pv);d.arm=pv;   // the arm swings up on this pivot once the checkpoint is taken (depot.js)
    const arm=new T.Mesh(new T.BoxGeometry(ax?d.len:1.4,1.4,ax?1.4:d.len),texMat(hazTex,d.len/12,1,{color:0xffd0c8,roughness:.6}));arm.position.set(ax?d.len/2:0,0,ax?0:d.len/2);arm.castShadow=true;pv.add(arm);
  }

  // lights
  hemi=new T.HemisphereLight(0x5a6e96,0x140f0b,.24);scene.add(hemi);
  moon=new T.DirectionalLight(0x9fb4ff,.32);moon.position.set(FIT.w/2-300,620,FIT.h/2-400);moon.target.position.set(FIT.w/2,0,FIT.h/2);   // follows the camera (render)
  moon.castShadow=true;moon.shadow.mapSize.set(2048,2048);
  Object.assign(moon.shadow.camera,{left:-620,right:620,top:620,bottom:-620,near:50,far:1900});moon.shadow.bias=-0.0008;
  scene.add(moon,moon.target);
  const poleM=new T.MeshStandardMaterial({color:0x1d2124,roughness:.6,metalness:.6});
  for(const L of lamps){
    const p=new T.PointLight(L.c,L.i,L.d,1.4);p.position.set(L.x,L.h,L.y);scene.add(p);L.light=p;
    const hd=new T.Mesh(new T.BoxGeometry(6,2,4),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(L.x,L.h+1.6,L.y);scene.add(hd);
    if(L.pole)addMesh(new T.CylinderGeometry(1.2,1.6,L.h+2,8),poleM,L.x,(L.h+2)/2,L.y);
  }
  for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);scene.add(m);muzzle.push(m);}
  boomL=new T.PointLight(0xffa050,0,280,1.6);scene.add(boomL);
  jeepLight=new T.SpotLight(0xfff1d6,0,300,.5,.55,1.2);scene.add(jeepLight,jeepLight.target);   // jeep headlights, off until it arrives (made now so adding it later doesn't stall)
}

/* soldiers */
function makeSoldier(u){
  const P=u.side==='P',col=new T.Color(teamCol(u));
  const g=new T.Group(),pose=new T.Group();g.add(pose);
  const cloth=new T.MeshStandardMaterial({color:P?0x485a5f:0x5a4434,roughness:.9});
  const gear=new T.MeshStandardMaterial({color:P?0x262d30:0x2a201b,roughness:.75});
  const band=new T.MeshStandardMaterial({color:col,emissive:col,emissiveIntensity:.7,roughness:.6});
  const parts=[[SG.legs,gear,0,3,0],[SG.body,cloth,0,10,0],[SG.band,band,0,12.3,0],[SG.head,gear,.3,16.2,0],[SG.helm,gear,.2,16.6,0],[SG.pack,gear,-3.5,10.5,0],[SG.rifle,gear,5,11.5,2.2]];
  for(const[geo,mat,x,y,z]of parts){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;pose.add(m);}
  const ring=new T.Mesh(SG.ring,new T.MeshBasicMaterial({color:col,transparent:true,opacity:.85,depthWrite:false,toneMapped:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.5;g.add(ring);
  let spot=null;
  if(P){spot=new T.SpotLight(0xd8e8ff,2.6,210,.42,.5,1.2);spot.position.set(4,14,0);const tg=new T.Object3D();tg.position.set(60,0,0);pose.add(spot,tg);spot.target=tg;}
  scene.add(g);u.m={g,pose,ring,spot};
}
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
    m.g.position.set(u.x+u.lx,u.elev||0,u.y+u.ly);m.g.rotation.y=-u.ang;
    m.g.visible=!u.gone&&((u.side==='P'&&u.seat!=='driver')||u.vis||(u.dead&&u.seen)||!!u.gunner);   // the jeep gunner is always in plain view; riders sit visible, the driver is hidden
    const lying=u.downed||u.dead;
    m.pose.rotation.z+=((lying?Math.PI/2:0)-m.pose.rotation.z)*.2;
    const sneak=!lying&&u.path.length&&u.gait==='sneak';   // low, slow steps
    m.pose.position.y=lying?2.6:(u.path.length?Math.abs(Math.sin(t*(sneak?6:11)+u.x))*(sneak?.4:.9):0);
    const crouch=!lying&&!u.gunner&&(u.inVeh||u.inBoat?true:!u.path.length&&(u.side==='P'?u.covered&&contact:u.coverNow));   // riders sit low
    m.pose.scale.y+=((crouch?.7:sneak?.8:1)-m.pose.scale.y)*.15;
    m.ring.visible=!u.dead;m.ring.material.opacity=u.downed?.35:.85;
    if(m.spot)m.spot.intensity=lying?0:2.6;
  }
}
function render(rdt,now){
  updateCamera();syncUnits(now);
  if(dinghy){dinghy.rotation.z=reduced?0:Math.sin(now*1.7)*.035;dinghy.rotation.x=reduced?0:Math.sin(now*1.1)*.02;}   // bobbing on the water
  moon.position.set(camT.x-300,620,camT.z-400);moon.target.position.set(camT.x,0,camT.z);   // the shadow box follows the view: the map is bigger than one shadow map
  for(const L of lamps){let i=L.i;if(L.flick&&!reduced){const f=Math.sin(now*13.1)+Math.sin(now*7.3);if(f>1.85)i*=.3;}L.light.intensity=i;}
  hemi.intensity=.24+storm*1.6;
  const fl=flashes.slice(-2);
  for(let k=0;k<2;k++){const m=muzzle[k],f=fl[k];if(f){m.position.set(f.x,13,f.y);m.intensity=3.2*(1-f.t/.07);}else m.intensity=0;}
  const b=booms[booms.length-1];if(b){boomL.position.set(b.x,18,b.y);boomL.intensity=7*(1-b.t/.6);}else boomL.intensity=0;
  renderer.render(scene,camera);
  drawOverlay(rdt,now);
}
