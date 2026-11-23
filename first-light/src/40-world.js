/* World rendering systems: materials, lights, particles, decals, see-through walls. The level itself is assembled in 45-build.js. */
const WALLH=27;
const world={fade:[],emit:[],fires:[],tick:[],homeRoof:null};
function vmat(o){return new T.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.88,metalness:0},o||{}));}
function tmat(tex,rx,ry,o){const t=tex.clone();t.needsUpdate=true;t.repeat.set(rx,ry);return new T.MeshStandardMaterial(Object.assign({map:t,roughness:.93},o||{}));}
function emat(o){return new T.MeshBasicMaterial(Object.assign({vertexColors:true,toneMapped:false},o||{}));}
function add(geo,mat,x,y,z,noShadow){const m=new T.Mesh(geo,mat);m.position.set(x||0,y||0,z||0);m.castShadow=!noShadow;m.receiveShadow=true;scene.add(m);return m;}
function ground(x,y,w,h,tex,rep,col,yy,rough){
  const m=new T.Mesh(new T.PlaneGeometry(w,h),tmat(tex,w/rep,h/rep,{color:col||0xffffff,roughness:rough||.95}));
  m.rotation.x=-PI/2;m.position.set(x+w/2,yy||0,y+h/2);m.receiveShadow=true;scene.add(m);return m;
}
function fadeable(o,mats,fr){world.fade.push({o,mats,cur:1,fr:fr||4});}
function glowAt(x,h,y,c,size){
  const s=new T.Sprite(new T.SpriteMaterial({map:TX.glow,color:c,blending:T.AdditiveBlending,depthWrite:false,transparent:true}));
  s.scale.set(size,size,1);s.position.set(x,h,y);scene.add(s);return s;
}
/* light sources: there are many, but only the nearest few get a real light each frame */
function emitter(x,y,h,c,i,d,flick,glow){
  const e={x,y,h,c,i,d,flick:flick||0,on:true,k:1,sprite:null,gs:glow||0};
  if(glow)e.sprite=glowAt(x,h,y,c,glow);
  world.emit.push(e);return e;
}
const POOLN=6,pool=[];
let sun,hemi,flashL,tvLight;
function buildLights(){
  hemi=new T.HemisphereLight(0x5d6fa2,0x2a2420,.56);scene.add(hemi);
  sun=new T.DirectionalLight(0xffb27a,1.15);sun.castShadow=true;sun.shadow.mapSize.set(2048,2048);
  Object.assign(sun.shadow.camera,{left:-300,right:300,top:300,bottom:-300,near:50,far:1500});sun.shadow.bias=-0.0006;sun.shadow.normalBias=.6;
  scene.add(sun,sun.target);
  const fill=new T.DirectionalLight(0xc4d2ff,.4);fill.position.set(-.5,.75,1);scene.add(fill);
  for(let i=0;i<POOLN;i++){const l=new T.PointLight(0xffffff,0,200,1.5);scene.add(l);pool.push({l,e:null,k:0});}
  flashL=new T.PointLight(0xffd9a0,0,160,1.8);scene.add(flashL);
  tvLight=new T.PointLight(0x8fb4ff,0,150,1.6);tvLight.position.set(TVPOS.x,TVPOS.h,TVPOS.y+10);scene.add(tvLight);
}
const SUNDIR=new T.Vector3(.38,.42,-.82).normalize();
let poolT=0;
function lightsTick(dt,now,fx,fy){
  sun.target.position.set(Math.round(fx/8)*8,0,Math.round(fy/8)*8);
  sun.position.copy(sun.target.position).addScaledVector(SUNDIR,760);
  // flicker
  for(const e of world.emit){
    let k=e.on?1:0;
    if(k&&!reduced){
      if(e.flick===1)k=.72+Math.sin(now*17+e.x)*.14+Math.random()*.2;          // fire
      else if(e.flick===2){const f=Math.sin(now*13.1+e.y)+Math.sin(now*7.3+e.x);k=f>1.55?.15:1;}   // dying lamp
      else if(e.flick===3)k=(Math.floor(now*3.2+e.ph)%2)?1:0;                     // police bar
    }
    e.k=k;
    if(e.sprite){e.sprite.material.opacity=k*.85;e.sprite.visible=k>.02;}
  }
  poolT-=dt;
  if(poolT<=0){
    poolT=.2;
    const cand=world.emit.filter(e=>e.on&&e.i>0).map(e=>({e,s:hyp(e.x-fx,e.y-fy)/Math.sqrt(e.i)})).sort((a,b)=>a.s-b.s).slice(0,POOLN).map(c=>c.e);
    for(const p of pool)if(p.e&&!cand.includes(p.e))p.e=null;
    for(const e of cand){if(pool.some(p=>p.e===e))continue;const p=pool.find(p=>!p.e&&p.k<.05)||pool.find(p=>!p.e);if(p){p.e=e;p.k=0;p.l.position.set(e.x,e.h,e.y);p.l.color.setHex(e.c);p.l.distance=e.d;}}
  }
  for(const p of pool){
    p.k=damp(p.k,p.e?1:0,8,dt);
    p.l.intensity=p.e?p.e.i*p.e.k*p.k:p.l.intensity*.8;
    if(p.e&&p.e.moving)p.l.position.set(p.e.x,p.e.h,p.e.y);
  }
  flashL.intensity=Math.max(0,flashL.intensity-dt*(flashL.slow?9:40));
}
function flash(x,h,y,i,col,slow){flashL.position.set(x,h,y);flashL.intensity=i;flashL.color.setHex(col||0xffd9a0);flashL.distance=slow?420:170;flashL.slow=!!slow;}

/* ---- particles ---- */
const PVS='attribute float size;attribute vec4 pcol;varying vec4 vC;uniform float scale;void main(){vC=pcol;vec4 mv=modelViewMatrix*vec4(position,1.0);gl_PointSize=size*scale/-mv.z;gl_Position=projectionMatrix*mv;}';
const PFS='uniform sampler2D map;varying vec4 vC;void main(){vec4 t=texture2D(map,gl_PointCoord);gl_FragColor=vec4(vC.rgb*t.rgb,vC.a*t.a);}';
function makeParts(max,tex,additive){
  const g=new T.BufferGeometry(),P=new Float32Array(max*3),K=new Float32Array(max*4),S=new Float32Array(max);
  g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('pcol',new T.BufferAttribute(K,4));g.setAttribute('size',new T.BufferAttribute(S,1));
  const m=new T.ShaderMaterial({uniforms:{map:{value:tex},scale:{value:600}},vertexShader:PVS,fragmentShader:PFS,transparent:true,depthWrite:false,blending:additive?T.AdditiveBlending:T.NormalBlending});
  const pts=new T.Points(g,m);pts.frustumCulled=false;pts.renderOrder=additive?6:5;scene.add(pts);
  return{max,P,K,S,g,m,list:[],free:[]};
}
let pFire,pSmoke,pDrop;
function buildParts(){pSmoke=makeParts(360,TX.puff,false);pDrop=makeParts(420,TX.glow,false);pFire=makeParts(520,TX.glow,true);}
/* x,y = ground position, z = height. grav pulls down, grow changes size per second, bounce keeps drops on the ground. */
function emit(ps,x,y,z,vx,vy,vz,size,life,r,g,b,a,grav,drag,grow,bounce){
  if(ps.list.length>=ps.max)return;
  const p=ps.free.pop()||{};
  p.x=x;p.y=y;p.z=z;p.vx=vx;p.vy=vy;p.vz=vz;p.size=size;p.life=life;p.age=0;p.r=r;p.g=g;p.b=b;p.a=a;p.grav=grav||0;p.drag=drag||0;p.grow=grow||0;p.bounce=bounce||0;
  ps.list.push(p);
}
function partsTick(ps,dt){
  const L=ps.list;let n=0;
  for(let i=0;i<L.length;i++){
    const p=L[i];p.age+=dt;
    if(p.age>=p.life){ps.free.push(p);continue;}
    p.vz-=p.grav*dt;
    if(p.drag){const k=Math.exp(-p.drag*dt);p.vx*=k;p.vy*=k;p.vz*=k;}
    p.x+=p.vx*dt;p.y+=p.vy*dt;p.z+=p.vz*dt;p.size+=p.grow*dt;
    if(p.z<.4&&p.grav){if(p.bounce===2){if(p.onLand)p.onLand(p);ps.free.push(p);continue;}p.z=.4;p.vz=p.bounce?-p.vz*.3:0;p.vx*=.4;p.vy*=.4;}
    const k=p.age/p.life,f=k<.12?k/.12:1-(k-.12)/.88;
    ps.P[n*3]=p.x;ps.P[n*3+1]=p.z;ps.P[n*3+2]=p.y;
    ps.K[n*4]=p.r;ps.K[n*4+1]=p.g;ps.K[n*4+2]=p.b;ps.K[n*4+3]=p.a*f;
    ps.S[n]=Math.max(.1,p.size);
    L[n++]=p;
  }
  L.length=n;
  ps.g.setDrawRange(0,n);ps.g.attributes.position.needsUpdate=true;ps.g.attributes.pcol.needsUpdate=true;ps.g.attributes.size.needsUpdate=true;
}
/* ---- effects built from particles ---- */
function fxBlood(x,y,z,dx,dy,n,big){
  for(let i=0;i<n;i++){
    const a=Math.atan2(dy,dx)+rand(-.9,.9),sp=rand(20,big?150:90);
    const p=emit(pDrop,x,y,z+rand(-2,3),Math.cos(a)*sp,Math.sin(a)*sp,rand(10,big?120:70),rand(1.4,big?4:2.6),rand(.5,1.1),.42,.02,.02,1,260,.6,0,2);
  }
  // some drops leave a mark where they land
  const L=pDrop.list;for(let i=L.length-Math.min(n,3);i<L.length;i++)if(L[i])L[i].onLand=p=>decal(p.x,p.y,rand(3,7),.5);
}
function fxSpark(x,y,z,n,col){for(let i=0;i<n;i++){const a=rand(0,TAU),sp=rand(20,120);emit(pFire,x,y,z,Math.cos(a)*sp,Math.sin(a)*sp,rand(20,120),rand(1.5,3),rand(.25,.6),col?col[0]:1,col?col[1]:.8,col?col[2]:.4,1,300,1.5,-2,1);}}
function fxDust(x,y,n){for(let i=0;i<n;i++){const a=rand(0,TAU);emit(pSmoke,x,y,1.5,Math.cos(a)*rand(6,22),Math.sin(a)*rand(6,22),rand(3,10),rand(6,10),rand(.4,.8),.45,.42,.4,.35,0,2,14);}}
function fxMuzzle(x,y,z,ang){
  for(let i=0;i<5;i++)emit(pFire,x,y,z,Math.cos(ang)*rand(40,200),Math.sin(ang)*rand(40,200),rand(-10,20),rand(4,9),.07,1,.85,.5,1,0,6,-30);
  emit(pSmoke,x,y,z,Math.cos(ang)*18,Math.sin(ang)*18,8,5,.6,.6,.6,.6,.3,0,2,16);
  flash(x,z,y,5.5);
}
function fxBoom(x,y){
  for(let i=0;i<70;i++){const a=rand(0,TAU),sp=rand(20,190),up=rand(20,170);emit(pFire,x+rand(-8,8),y+rand(-8,8),rand(4,16),Math.cos(a)*sp,Math.sin(a)*sp,up,rand(12,30),rand(.35,.95),1,rand(.45,.8),.18,1,60,2.2,10);}
  for(let i=0;i<34;i++){const a=rand(0,TAU),sp=rand(10,80);emit(pSmoke,x,y,rand(6,26),Math.cos(a)*sp,Math.sin(a)*sp,rand(26,70),rand(16,30),rand(1.6,3.4),.08,.07,.07,.75,0,.9,22);}
  fxSpark(x,y,10,40);
  for(let i=0;i<8;i++)decal(x+rand(-34,34),y+rand(-34,34),rand(14,30),.85,0x0c0b0b);
  flash(x,26,y,26,0xffa050,true);
}
function fireTick(dt,fx,fy){
  for(const f of world.fires){
    if(!f.on)continue;const d=hyp(f.x-fx,f.y-fy);if(d>620)continue;
    f.acc+=dt*f.rate*(d>380?.45:1)*(Q.level<2?.6:1);
    while(f.acc>1){
      f.acc-=1;const x=f.x+rand(-f.r,f.r),y=f.y+rand(-f.r,f.r);
      emit(pFire,x,y,f.h+rand(0,4),rand(-5,5),rand(-5,5),rand(16,34)*f.s,rand(9,17)*f.s,rand(.4,.85),1,rand(.38,.62),.12,.9,0,.5,-9*f.s);
      if(Math.random()<.3)emit(pSmoke,x,y,f.h+12*f.s,rand(-4,10),rand(-6,3),rand(18,34),rand(10,18)*f.s,rand(1.8,3.6),.07,.06,.07,.5,0,.2,9);
      if(Math.random()<.25)emit(pFire,x,y,f.h+6,rand(-16,30),rand(-22,10),rand(30,80),rand(1.2,2.4),rand(1,2.4),1,.6,.2,1,-8,.4,0);
    }
  }
}
function fireAt(x,y,h,r,rate,s,light){
  const f={x,y,h,r,rate,s:s||1,acc:0,on:true};world.fires.push(f);
  if(light)f.e=emitter(x,y,h+10,0xff6a20,light,light>3?340:220,1,28*(s||1));
  return f;
}

/* ---- decals: blood and scorch marks, a ring buffer of flat quads ---- */
const DECN=260;let decMesh,decI=0;const _dm=new T.Matrix4(),_dq=new T.Quaternion(),_dc=new T.Color();
function buildDecals(){
  const g=new T.PlaneGeometry(1,1);g.rotateX(-PI/2);
  const m=new T.MeshStandardMaterial({map:TX.splat,alphaMap:TX.splat,transparent:true,depthWrite:false,roughness:.35,metalness:.1,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2});
  decMesh=new T.InstancedMesh(g,m,DECN);decMesh.frustumCulled=false;decMesh.receiveShadow=true;
  _dm.makeScale(0,0,0);for(let i=0;i<DECN;i++){decMesh.setMatrixAt(i,_dm);decMesh.setColorAt(i,_dc.setHex(0x5a0806));}
  decMesh.renderOrder=2;scene.add(decMesh);
}
function decal(x,y,size,a,col){
  _dq.setFromAxisAngle(_v.set(0,1,0),Math.random()*TAU);
  _dm.compose(_p.set(x,.25+decI*.0006,y),_dq,_v.set(size,1,size*rand(.7,1.1)));
  decMesh.setMatrixAt(decI,_dm);decMesh.setColorAt(decI,_dc.setHex(col||0x4c0605).multiplyScalar(rand(.6,1)));
  decMesh.instanceMatrix.needsUpdate=true;decMesh.instanceColor.needsUpdate=true;decI=(decI+1)%DECN;
}

/* ---- short-lived streaks: swing arcs and bullet tracers ---- */
const streaks=[];
function buildStreaks(){
  for(let i=0;i<10;i++){
    const m=new T.Mesh(new T.BufferGeometry(),new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false}));
    m.frustumCulled=false;m.visible=false;scene.add(m);streaks.push({m,t:0,life:0});
  }
}
function streakGet(){let s=streaks.find(s=>!s.m.visible);if(!s)s=streaks[0];return s;}
function fxArc(x,y,h,a0,a1,r0,r1,col,life){
  const s=streakGet(),g=new T.RingGeometry(r0,r1,14,1,-a1,a1-a0);g.rotateX(-PI/2);
  s.m.geometry.dispose();s.m.geometry=g;s.m.position.set(x,h,y);s.m.rotation.set(0,0,0);s.m.material.color.setHex(col||0xffffff);s.m.visible=true;s.t=0;s.life=life||.16;s.peak=.75;
}
function fxTracer(x1,y1,h1,x2,y2,h2,col){
  const s=streakGet(),g=new T.BufferGeometry();
  const dx=x2-x1,dy=y2-y1,L=hyp(dx,dy)||1,nx=-dy/L*.5,ny=dx/L*.5;
  g.setAttribute('position',new T.BufferAttribute(new Float32Array([x1+nx,h1,y1+ny,x1-nx,h1,y1-ny,x2-nx,h2,y2-ny,x1+nx,h1,y1+ny,x2-nx,h2,y2-ny,x2+nx,h2,y2+ny, x1,h1+.5,y1,x1,h1-.5,y1,x2,h2-.5,y2,x1,h1+.5,y1,x2,h2-.5,y2,x2,h2+.5,y2]),3));
  s.m.geometry.dispose();s.m.geometry=g;s.m.position.set(0,0,0);s.m.material.color.setHex(col||0xffe6a8);s.m.visible=true;s.t=0;s.life=.08;s.peak=1;
}
function streaksTick(dt){for(const s of streaks){if(!s.m.visible)continue;s.t+=dt;if(s.t>=s.life){s.m.visible=false;continue;}s.m.material.opacity=s.peak*(1-s.t/s.life);}}

/* ---- see-through: anything tall standing between the camera and you fades out ---- */
function fadeTick(dt,cx,cy,fx,fy,inside){
  const dx=cx-fx,dy=cy-fy,d=hyp(dx,dy)||1,sx=fx+dx/d*7,sy=fy+dy/d*7;
  const bx0=dx/d,by0=dy/d;
  for(const f of world.fade){
    let hit=segHitsRect(sx,sy,cx,cy,f.o,f.fr);
    if(!hit&&inside&&f.o.home){const ox=f.o.x+f.o.w/2-fx,oy=f.o.y+f.o.h/2-fy,al=ox*bx0+oy*by0,lat=Math.abs(ox*by0-oy*bx0);hit=al>4&&al<d&&lat<95+Math.max(f.o.w,f.o.h)/2;}
    f.cur=damp(f.cur,hit?(f.o.home?.34:.1):1,hit?14:7,dt);      // house walls stay a little more solid, so the rooms still read (Bryan)
    const tr=f.cur<.985;
    for(const m of f.mats){m.opacity=f.cur;if(m.transparent!==tr){m.transparent=tr;m.needsUpdate=true;}m.depthWrite=f.cur>.5;}
  }
  if(world.homeRoof){
    const hide=inside||(cx>HS.x0-30&&cx<HS.x1+30&&cy>HS.y0-30&&cy<HS.y1+60);
    const r=world.homeRoof;r.cur=damp(r.cur,hide?0:1,hide?12:3,dt);r.m.visible=r.cur>.02;r.m.material.opacity=r.cur;
  }
}
