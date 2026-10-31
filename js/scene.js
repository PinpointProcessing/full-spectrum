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
const MAXZ=4;let zoom=1,camT={x:W/2,z:H/2},dist0=1200,yaw=0,tilt=0;
const PITCH0=60*Math.PI/180,PITCH1=46*Math.PI/180,PITCH_MIN=14*Math.PI/180;   // tilt lowers the camera towards the horizon, down to PITCH_MIN
function basePitch(){return PITCH0+(PITCH1-PITCH0)*(zoom-1)/(MAXZ-1);}
function updateCamera(){
  const dist=dist0/zoom,p=Math.max(PITCH_MIN,basePitch()-tilt);
  const hd=dist*Math.cos(p);
  camera.position.set(camT.x+Math.sin(yaw)*hd,dist*Math.sin(p),camT.z+Math.cos(yaw)*hd);
  camera.lookAt(camT.x,0,camT.z);camera.updateMatrixWorld();
}
function clampCam(){
  const lim=1-1/zoom;
  camT.x=clamp(camT.x,W/2-W/2*lim,W/2+W/2*lim);
  camT.z=clamp(camT.z,H/2-H/2*lim,H/2+H/2*lim);
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
    const h=objHeight(o);if(!h)continue;
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
  const sz=zoom,sy=yaw,stl=tilt,st={x:camT.x,z:camT.z};zoom=1;yaw=0;tilt=0;camT={x:W/2,z:H/2};
  let lo=200,hi=9000;
  for(let i=0;i<30;i++){
    const mid=(lo+hi)/2;dist0=mid;updateCamera();let ok=true;
    for(const[x,z]of[[0,0],[W,0],[0,H],[W,H]]){_v.set(x,0,z).project(camera);if(Math.abs(_v.x)>.99||Math.abs(_v.y)>.99){ok=false;break;}}
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
const gcan=document.createElement('canvas'),rcan=document.createElement('canvas');
function drawGround(){
  gcan.width=1200;gcan.height=1800;rcan.width=600;rcan.height=900;
  const g=gcan.getContext('2d'),q=rcan.getContext('2d');g.setTransform(2,0,0,2,0,0);
  const r=rng(1337);
  g.fillStyle='#4c4f52';g.fillRect(0,0,W,H);q.fillStyle='rgb(210,210,210)';q.fillRect(0,0,W,H);
  for(let y=0;y<H;y+=75)for(let x=0;x<W;x+=75){g.fillStyle=(r()<.5?'rgba(255,255,255,':'rgba(0,0,0,')+(0.03+r()*0.07).toFixed(3)+')';g.fillRect(x,y,75,75);}
  g.strokeStyle='rgba(0,0,0,.55)';g.lineWidth=1;
  for(let x=0;x<=W;x+=75){g.beginPath();g.moveTo(x+.5,0);g.lineTo(x+.5,H);g.stroke();}
  for(let y=0;y<=H;y+=75){g.beginPath();g.moveTo(0,y+.5);g.lineTo(W,y+.5);g.stroke();}
  for(let i=0;i<9000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.07)':'rgba(0,0,0,.22)';g.fillRect(r()*W,r()*H,r()*1.6+.4,r()*1.6+.4);}
  for(let i=0;i<34;i++){const x=r()*W,y=r()*H,rad=8+r()*34,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(0,0,0,.4)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}
  for(let i=0;i<16;i++){
    const x=20+r()*(W-40),y=20+r()*(H-40),rx=10+r()*32,ry=6+r()*16,a=r()*Math.PI;
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
  for(const o of objs){if(o.kind==='fence')continue;g.fillStyle='rgba(0,0,0,.32)';g.fillRect(o.x-3,o.y-3,o.w+6,o.h+6);}
  gtex.needsUpdate=true;rtex.needsUpdate=true;
}
function paintDecal(d){
  const g=gcan.getContext('2d');g.setTransform(2,0,0,2,0,0);
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
];
let hemi,muzzle=[],boomL,jeepLight;
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
  const ground=new T.Mesh(new T.PlaneGeometry(W,H),new T.MeshStandardMaterial({map:gtex,roughnessMap:rtex,roughness:1,metalness:.18}));
  ground.rotation.x=-Math.PI/2;ground.position.set(W/2,0,H/2);ground.receiveShadow=true;scene.add(ground);
  const outer=new T.Mesh(new T.PlaneGeometry(4000,4000),new T.MeshStandardMaterial({color:0x1c1f22,roughness:1}));
  outer.rotation.x=-Math.PI/2;outer.position.set(W/2,-.3,H/2);scene.add(outer);

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
  // roll door housing over the south door, door frame posts
  addMesh(new T.BoxGeometry(100,5,6),wallMat,310,21.5,555);

  // lights
  hemi=new T.HemisphereLight(0x5a6e96,0x140f0b,.24);scene.add(hemi);
  const moon=new T.DirectionalLight(0x9fb4ff,.32);moon.position.set(W/2-300,620,H/2-400);moon.target.position.set(W/2,0,H/2);
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
function syncUnits(t){
  for(const u of units){
    const m=u.m;if(!m)continue;
    const pk=peekOf(u);u.lx+=((pk?pk.x-u.x:0)-u.lx)*.25;u.ly+=((pk?pk.y-u.y:0)-u.ly)*.25;  // step out to the lean spot and back
    m.g.position.set(u.x+u.lx,u.elev||0,u.y+u.ly);m.g.rotation.y=-u.ang;
    m.g.visible=(u.side==='P'&&u.seat!=='driver')||u.vis||(u.dead&&u.seen)||!!u.gunner;   // the jeep gunner is always in plain view; riders sit visible, the driver is hidden
    const lying=u.downed||u.dead;
    m.pose.rotation.z+=((lying?Math.PI/2:0)-m.pose.rotation.z)*.2;
    const sneak=!lying&&u.path.length&&u.gait==='sneak';   // low, slow steps
    m.pose.position.y=lying?2.6:(u.path.length?Math.abs(Math.sin(t*(sneak?6:11)+u.x))*(sneak?.4:.9):0);
    const crouch=!lying&&!u.gunner&&(u.inVeh?true:!u.path.length&&(u.side==='P'?u.covered&&contact:u.coverNow));   // riders sit low
    m.pose.scale.y+=((crouch?.7:sneak?.8:1)-m.pose.scale.y)*.15;
    m.ring.visible=!u.dead;m.ring.material.opacity=u.downed?.35:.85;
    if(m.spot)m.spot.intensity=lying?0:2.6;
  }
}
function render(rdt,now){
  updateCamera();syncUnits(now);
  for(const L of lamps){let i=L.i;if(L.flick&&!reduced){const f=Math.sin(now*13.1)+Math.sin(now*7.3);if(f>1.85)i*=.3;}L.light.intensity=i;}
  hemi.intensity=.24+storm*1.6;
  const fl=flashes.slice(-2);
  for(let k=0;k<2;k++){const m=muzzle[k],f=fl[k];if(f){m.position.set(f.x,13,f.y);m.intensity=3.2*(1-f.t/.07);}else m.intensity=0;}
  const b=booms[booms.length-1];if(b){boomL.position.set(b.x,18,b.y);boomL.intensity=7*(1-b.t/.6);}else boomL.intensity=0;
  renderer.render(scene,camera);
  drawOverlay(rdt,now);
}
