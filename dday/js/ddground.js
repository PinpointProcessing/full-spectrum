"use strict";
/* D-Day's look, Version 188: the ground and its dressing. ddGroundBuild(sc) from dday.js's buildDDay (every chapter, after the scenery), ddGroundFrame(rdt,now,dt) from ddFrame
   every frame.
   The land's picture (dday.js's paintDDGround, ddcounter.js's dcPaint, ddvillage.js's vgPaint) is 1.2 points a unit: close behind the squad
   that's a soft blur. So the land's material gets fine detail tiled over it in its own shader (ddgLand): sand ripples, pebbles and shell
   grit on the sand, blades and clumps on the grass, grit, stones and cracks on earth and rock (ddgDetail: one picture, a kind in each
   colour, and a height picture of the same for the light to catch), each kind laid where the land is that kind (ddgMask: a small map of
   which is where, from the land's own picture). Twice, at two sizes, so the tiles don't show. */
let DDG_DET=null,DDG_MASK=null;

// the detail pictures, made once: red sand, green grass, blue earth and rock; each tiles (512 points across 56 units of ground)
function ddgDetail(){
  if(DDG_DET)return DDG_DET;
  const N=512,r=rng(1888),A=()=>new Float32Array(N*N),W=i=>((i%N)+N)%N;
  const vnoise=cells=>{const g=new Float32Array(cells*cells);for(let i=0;i<g.length;i++)g[i]=r();const v=(i,j)=>g[(((j%cells)+cells)%cells)*cells+(((i%cells)+cells)%cells)];
    return(x,y)=>{const fx=x/N*cells,fy=y/N*cells,x0=Math.floor(fx),y0=Math.floor(fy),tx=fx-x0,ty=fy-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);return(v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;};};
  const disc=(a,x,y,rad,v)=>{const R=Math.ceil(rad);for(let j=-R;j<=R;j++)for(let i=-R;i<=R;i++){const d=Math.hypot(i,j)/rad;if(d<1)a[W(Math.round(y)+j)*N+W(Math.round(x)+i)]+=v*(1-d*d);}};
  const seg=(a,x,y,ang,len,v,taper)=>{const c=Math.cos(ang),s=Math.sin(ang);for(let t=0;t<len;t+=.6){a[W(Math.round(y+s*t))*N+W(Math.round(x+c*t))]+=v*(taper?1-t/len*.6:1);}};
  const sC=A(),sH=A(),gC=A(),gH=A(),eC=A(),eH=A();
  // sand: wind and wave ripples running along the shore (gentle on one side, steep on the other, the troughs darker with heavy grains),
  // fading in and out in patches; grit; pebbles and bits of shell
  {const n1=vnoise(4),n2=vnoise(16),n3=vnoise(64),n4=vnoise(8);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=y*N+x,wv=(n1(x,y)-.5)*70+(n2(x,y)-.5)*16,ph=(y+wv)*13/N,p=ph-Math.floor(ph),prof=p<.72?p/.72:(1-p)/.28,m=clamp(n4(x+90,y+40)*1.8-.35,0,1);
      sH[k]=prof*m*.75+n3(x,y)*.25;sC[k]=(prof-.5)*.34*m-(p>.82?.16*m:0)+(n2(x+40,y+13)-.5)*.35+(n3(x+7,y+3)-.5)*.2+(r()-.5)*.22;}
    for(let i=0;i<1100;i++){const x=r()*N,y=r()*N,rad=.7+r()*r()*2.6,dark=r()<.6;disc(sC,x,y,rad,dark?-.9:.8);disc(sH,x,y,rad+.4,.5);}}
  // grass: clumps and the blades of them, darker at their roots, lit at their tips; a few seed heads
  {const c1=vnoise(8),c2=vnoise(32);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=y*N+x,cl=c1(x,y)*.6+c2(x,y)*.4;gC[k]=(cl-.5)*.9+(r()-.5)*.25;gH[k]=cl*.8;}
    for(let i=0;i<16000;i++){const x=r()*N,y=r()*N,a=r()*TAU,l=4+r()*10,cl=c1(x,y);seg(gC,x,y,a,l,(r()<.55?.55:-.6)*(.6+cl*.6),true);seg(gH,x,y,a,l,.35,true);}
    for(let i=0;i<220;i++)disc(gC,r()*N,r()*N,.8+r()*.8,1.1);}
  // earth and rock: grit at three sizes, stones (lit on top, a dark edge), cracks
  {const e1=vnoise(8),e2=vnoise(32),e3=vnoise(128);
    for(let y=0;y<N;y++)for(let x=0;x<N;x++){const k=y*N+x,v=e1(x,y)*.4+e2(x,y)*.35+e3(x,y)*.25;eC[k]=(v-.5)*.9+(r()-.5)*.3;eH[k]=v;}
    for(let i=0;i<420;i++){const x=r()*N,y=r()*N,rad=1.5+r()*r()*6;disc(eC,x+1,y+1,rad*1.15,-.7);disc(eC,x-rad*.25,y-rad*.25,rad*.8,.9);disc(eH,x,y,rad,1.2);}
    for(let i=0;i<60;i++){let x=r()*N,y=r()*N,a=r()*TAU;const n=20+r()*60;for(let s=0;s<n;s++){a+=(r()-.5)*.9;x+=Math.cos(a)*1.4;y+=Math.sin(a)*1.4;eC[W(Math.round(y))*N+W(Math.round(x))]-=.9;eH[W(Math.round(y))*N+W(Math.round(x))]-=.6;}}}
  // each into 0..255: the colour ones about a middle grey (multiplied onto the land's own colour), the heights stretched
  const norm=(a,sd)=>{let m=0,v=0;for(let i=0;i<a.length;i++)m+=a[i];m/=a.length;for(let i=0;i<a.length;i++)v+=(a[i]-m)**2;v=Math.sqrt(v/a.length)||1;const o=new Uint8ClampedArray(a.length);for(let i=0;i<a.length;i++)o[i]=128+(a[i]-m)/v*sd;return o;};
  const pic=(R,G,B)=>{const c=document.createElement('canvas');c.width=c.height=N;const q=c.getContext('2d'),img=q.createImageData(N,N),D=img.data;for(let i=0;i<N*N;i++){D[i*4]=R[i];D[i*4+1]=G[i];D[i*4+2]=B[i];D[i*4+3]=255;}q.putImageData(img,0,0);
    const t=new T.CanvasTexture(c);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return t;};
  DDG_DET={col:pic(norm(sC,34),norm(gC,40),norm(eC,36)),hgt:pic(norm(sH,48),norm(gH,44),norm(eH,48))};
  return DDG_DET;
}
// which kind of ground is where (red sand, green grass, blue earth and rock), a point every 4 units, softened: from the land's picture
// (green is grass), and on the beach its sand where dday.js says it's sand
function ddgMask(){
  const MW=350,MH=415,s=document.createElement('canvas');s.width=MW;s.height=MH;const sq=s.getContext('2d');sq.drawImage(DD.canvas,0,0,MW,MH);
  const src=sq.getImageData(0,0,MW,MH).data,img=sq.createImageData(MW,MH),D=img.data,beach=DD_MODE==='beach'&&typeof ddGroundAt==='function';
  const w=new Float32Array(MW*MH*3);
  for(let j=0;j<MH;j++)for(let i=0;i<MW;i++){const k=j*MW+i,R=src[k*4],G=src[k*4+1],B=src[k*4+2];let sd=0,gr=clamp((G/Math.max(R,1)-.86)/.1,0,1)*clamp((G/Math.max(B,1)-1.15)/.2,0,1);
    if(beach){const t=ddGroundAt((i+.5)*(DDB.x1-DDB.x0)/MW,DDB.y0+(j+.5)*(DDB.y1-DDB.y0)/MH);if(t==='sand'||t==='sea'){sd=1;gr=0;}}
    w[k*3]=sd;w[k*3+1]=gr*(1-sd);w[k*3+2]=(1-gr)*(1-sd);}
  for(let p=0;p<2;p++){const o=new Float32Array(w.length);for(let j=0;j<MH;j++)for(let i=0;i<MW;i++)for(let c=0;c<3;c++){let a=0,n=0;for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){const x=i+u,y=j+v;if(x<0||y<0||x>=MW||y>=MH)continue;a+=w[(y*MW+x)*3+c];n++;}o[(j*MW+i)*3+c]=a/n;}w.set(o);}
  for(let k=0;k<MW*MH;k++){D[k*4]=w[k*3]*255;D[k*4+1]=w[k*3+1]*255;D[k*4+2]=w[k*3+2]*255;D[k*4+3]=255;}
  sq.putImageData(img,0,0);if(DDG_MASK)DDG_MASK.dispose();DDG_MASK=new T.CanvasTexture(s);return DDG_MASK;
}
// the land's material: the detail multiplied onto its colour, and the detail's heights bending the light (three.js's bump map, read at
// the detail's tiling and weighed by the kind of ground). Cheap: three more reads of a small picture where the land is drawn.
function ddgLand(sc){
  let mat=null;sc.traverse(o=>{if(!mat&&o.isMesh&&o.material&&o.material.map&&o.material.map===DD.tex)mat=o.material;});if(!mat)return;
  const D=ddgDetail(),U={uGDet:{value:D.col},uGMask:{value:ddgMask()},uGRep:{value:new T.Vector2((DDB.x1-DDB.x0)/56,(DDB.y1-DDB.y0)/56)},uGAmp:{value:.62}};
  const bump=POST.tier>0;if(bump){mat.bumpMap=D.hgt;mat.bumpScale=.55;}
  mat.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform sampler2D uGDet;uniform sampler2D uGMask;uniform vec2 uGRep;uniform float uGAmp;\nvec3 gW=vec3(0.);')
      .replace('#include <bumpmap_pars_fragment>',T.ShaderChunk.bumpmap_pars_fragment.replace(/vUv/g,'(vUv*uGRep)').replace(/texture2D\( bumpMap, /g,'dot(gW,texture2D( bumpMap, ').replace(/ \)\.x/g,' ).rgb)').replace('return vec2( dBx, dBy );','return vec2( dBx, dBy )*(1.-gSteep*.8);'))
      .replace('#include <map_fragment>','#include <map_fragment>\n  {vec3 mk=texture2D(uGMask,vUv).rgb;gW=mk/max(.001,mk.r+mk.g+mk.b);vec2 du=vUv*uGRep;vec3 d1=texture2D(uGDet,du).rgb-.5,d2=texture2D(uGDet,du*.41+vec2(.31,.17)).rgb-.5;\n'+
       '   vec3 wn=inverseTransformDirection(normalize(vNormal),viewMatrix);gSteep=smoothstep(.55,.85,1.-abs(wn.y));\n'+   // (on a steep face the ground's picture is stretched: there the detail is read from the side instead, along the face)
       '   if(gSteep>0.){vec2 sv=vec2(abs(wn.x)>abs(wn.z)?vGWp.z:vGWp.x,vGWp.y*1.3)/56.;vec3 d3=texture2D(uGDet,sv).rgb-.5,d4=texture2D(uGDet,sv*.41+vec2(.13,.71)).rgb-.5;d1=mix(d1,d3,gSteep);d2=mix(d2,d4,gSteep);\n'+
       '    float sh=vGWp.y*.085+d3.b*.9,f=fract(sh),hb=fract(sin(floor(sh)*91.7)*43758.5);vec3 st=vec3(.9+hb*.2)*(1.-.34*(1.-smoothstep(0.,.11,f)))*(1.+.08*smoothstep(.85,1.,f));if(hb>.72)st*=vec3(1.07,1.03,.95);\n'+   // beds of rock along the face: each its own shade, a dark seam under it, its top edge lit
       '    diffuseColor.rgb*=mix(vec3(1.),st,gSteep*gW.b);}\n'+
       '   diffuseColor.rgb*=clamp(1.+(dot(gW,d1)+dot(gW,d2)*.7)*uGAmp,.5,1.38);}');
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nvarying vec3 vGWp;').replace('#include <fog_vertex>','#include <fog_vertex>\n  vGWp=(modelMatrix*vec4(transformed,1.)).xyz;');
    s.fragmentShader=s.fragmentShader.replace('vec3 gW=vec3(0.);','vec3 gW=vec3(0.);float gSteep=0.;varying vec3 vGWp;');};
  mat.customProgramCacheKey=()=>'ddland'+(bump?1:0);mat.needsUpdate=true;
}
/* ---------- shared makings for the props (dday.js's ddProps, ddlook.js's ddDress, the chapters' own): many parts merged into one mesh
   (one draw call where there were dozens), instanced things in patches the camera can skip, and the pictures they wear ---------- */
const _gM=new THREE.Matrix4(),_gQ=new THREE.Quaternion(),_gE=new THREE.Euler(),_gV=new THREE.Vector3(),_gS=new THREE.Vector3(),_gC=new THREE.Color();
// parts: [{g, p:[x,y,z], r:[rx,ry,rz], s:[sx,sy,sz], c:colour, uv:[su,sv,ou,ov] (its uvs scaled and moved: a piece of an atlas), at:[u,v] (all its uvs one point)}]
function ddgMerge(parts,colours){
  const P=[],N=[],U=[],C=[];
  for(const q of parts){const g=q.g.index?q.g.toNonIndexed():q.g;const pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;
    _gE.set(...(q.r||[0,0,0]));_gQ.setFromEuler(_gE);_gM.compose(_gV.set(...(q.p||[0,0,0])),_gQ,_gS.set(...(q.s||[1,1,1])));const nm=new THREE.Matrix3().getNormalMatrix(_gM);
    if(colours){if(q.c&&q.c.isColor)_gC.copy(q.c);else _gC.set(q.c!=null?q.c:0xffffff).convertSRGBToLinear();}   // (a colour given as a number is the colour it should look; one given as a Color is a plain multiplier)
    for(let i=0;i<pa.count;i++){_gV.fromBufferAttribute(pa,i).applyMatrix4(_gM);P.push(_gV.x,_gV.y,_gV.z);_gV.fromBufferAttribute(na,i).applyMatrix3(nm).normalize();N.push(_gV.x,_gV.y,_gV.z);
      if(q.at)U.push(q.at[0],q.at[1]);else if(ua){const u=ua.getX(i),v=ua.getY(i);U.push(q.uv?u*q.uv[0]+q.uv[2]:u,q.uv?v*q.uv[1]+q.uv[3]:v);}else U.push(0,0);
      if(colours)C.push(_gC.r,_gC.g,_gC.b);}
    if(g!==q.g)g.dispose();}
  const G=new THREE.BufferGeometry();G.setAttribute('position',new THREE.Float32BufferAttribute(P,3));G.setAttribute('normal',new THREE.Float32BufferAttribute(N,3));G.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));
  if(colours)G.setAttribute('color',new THREE.Float32BufferAttribute(C,3));G.computeBoundingSphere();return G;
}
// shading baked into a shape: darker underneath (the light the ground doesn't throw back), a little uneven; the colour attribute multiplies the instance colour
function ddgShade(g,lo=.55,hi=1.1,jit=.08,seed=5){
  const r=rng(seed),pa=g.attributes.position;g.computeBoundingBox();const b=g.boundingBox,C=[];
  for(let i=0;i<pa.count;i++){const t=clamp((pa.getY(i)-b.min.y)/((b.max.y-b.min.y)||1),0,1),k=lo+(hi-lo)*Math.pow(t,.8)+(r()-.5)*jit;C.push(k,k,k);}
  g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));return g;
}
// a shape's corners pulled about a little (shared corners move together), so a hundred copies of it aren't one stamp
function ddgJitter(g,k,seed=3){
  const r=rng(seed),pa=g.attributes.position,seen=new Map();
  for(let i=0;i<pa.count;i++){const key=pa.getX(i).toFixed(3)+','+pa.getY(i).toFixed(3)+','+pa.getZ(i).toFixed(3);let d=seen.get(key);if(!d){d=[(r()-.5)*k,(r()-.5)*k,(r()-.5)*k];seen.set(key,d);}pa.setXYZ(i,pa.getX(i)+d[0],pa.getY(i)+d[1],pa.getZ(i)+d[2]);}
  g.computeVertexNormals();return g;
}
// instanced in patches (a grid of cells over the map, each its own mesh that knows where it is), so the camera skips what it can't see:
// the mirrored copies either side of the play area most of all (ddlook.js's ddInst draws every one of them, always)
// (colours given as they should look on screen: put into the renderer's linear terms here, or a hex colour comes out far paler than it reads)
function ddgInst(G,geo,mat,L,shadow,cell=350,lin=true){
  if(!L.length)return[];const by=new Map(),out=[],d=new THREE.Object3D(),c=new THREE.Color();
  for(const q of L){const k=Math.floor(q.x/cell)+','+Math.floor(q.y/cell);let a=by.get(k);if(!a)by.set(k,a=[]);a.push(q);}
  for(const a of by.values()){const g=geo.clone(),m=new THREE.InstancedMesh(g,mat,a.length);let x0=1e9,x1=-1e9,y0=1e9,y1=-1e9,h0=1e9,h1=-1e9,sz=0;
    a.forEach((q,i)=>{d.position.set(q.x,q.h,q.y);d.rotation.set(q.rx||0,q.ry||0,q.rz||0);d.scale.set(q.sx||1,q.sy||q.sx||1,q.sz||q.sx||1);d.updateMatrix();m.setMatrixAt(i,d.matrix);if(q.c!=null){c.set(q.c);if(lin)c.convertSRGBToLinear();m.setColorAt(i,c);}
      x0=Math.min(x0,q.x);x1=Math.max(x1,q.x);y0=Math.min(y0,q.y);y1=Math.max(y1,q.y);h0=Math.min(h0,q.h);h1=Math.max(h1,q.h);sz=Math.max(sz,(q.sx||1),(q.sy||q.sx||1),(q.sz||q.sx||1));});
    if(!g.boundingSphere)g.computeBoundingSphere();const R=g.boundingSphere.radius*sz+g.boundingSphere.center.length()*sz;
    g.boundingSphere=new THREE.Sphere(new THREE.Vector3((x0+x1)/2,(h0+h1)/2,(y0+y1)/2),Math.hypot(x1-x0,y1-y0,h1-h0)/2+R);
    m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.castShadow=!!shadow;m.receiveShadow=true;G.add(m);out.push(m);}
  return out;
}
// the props' pictures, made once and kept (a chapter's rebuild throws its materials away; a picture thrown away is simply sent again)
const DDG_TEX={};
function ddgTex(k){
  if(DDG_TEX[k])return DDG_TEX[k];const r=rng(k.length*977+k.charCodeAt(0));let t;
  if(k==='burlap')t=canvasTex(128,128,(q,w,h)=>{q.fillStyle='#cbb98e';q.fillRect(0,0,w,h);   // a sack: the weave, dirt and damp low down, darker where it folds at the edges
    for(let y=0;y<h;y+=2){q.fillStyle=`rgba(${r()<.5?'90,74,44':'228,212,170'},${.08+r()*.1})`;q.fillRect(0,y,w,1);}for(let x=0;x<w;x+=2){q.fillStyle=`rgba(90,74,44,${.05+r()*.08})`;q.fillRect(x,0,1,h);}
    for(let i=0;i<26;i++){q.fillStyle=`rgba(${r()<.6?'96,78,50':'70,60,44'},${.06+r()*.12})`;q.beginPath();q.ellipse(r()*w,r()*h,6+r()*20,4+r()*12,r()*3,0,7);q.fill();}
    let g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(60,48,30,.32)');g.addColorStop(.18,'rgba(60,48,30,0)');g.addColorStop(.82,'rgba(60,48,30,0)');g.addColorStop(1,'rgba(60,48,30,.4)');q.fillStyle=g;q.fillRect(0,0,w,h);
    q.strokeStyle='rgba(84,66,40,.45)';q.lineWidth=1.4;q.setLineDash([3,2]);q.beginPath();q.moveTo(0,h*.5);q.lineTo(w,h*.5);q.stroke();q.setLineDash([]);});
  else if(k==='rust')t=canvasTex(128,128,(q,w,h)=>{q.fillStyle='#5e4636';q.fillRect(0,0,w,h);   // steel left in the sea: rust blooms, streaks running down, scale flaking
    for(let i=0;i<70;i++){q.fillStyle=`rgba(${r()<.5?'150,94,54':'120,78,48'},${.25+r()*.35})`;q.beginPath();q.ellipse(r()*w,r()*h,2+r()*12,2+r()*8,r()*3,0,7);q.fill();}
    for(let i=0;i<40;i++){const x=r()*w;q.fillStyle=`rgba(${r()<.5?'170,90,40':'34,24,18'},${.12+r()*.2})`;q.fillRect(x,r()*h,1+r()*2,10+r()*40);}
    for(let i=0;i<500;i++){q.fillStyle=`rgba(${r()<.5?'26,20,16':'190,120,70'},${.15+r()*.3})`;q.fillRect(r()*w,r()*h,1+r()*1.5,1+r()*1.5);}});
  else if(k==='crate')t=canvasTex(256,256,(q,w,h)=>{   // an ammunition box, three faces in one picture: the side (top left), the end (top right), the lid (bottom left); the bottom right is plain rope
    const plank=(x0,y0,pw,ph,n,vert)=>{for(let i=0;i<n;i++){const a=vert?x0+i*pw/n:x0,b=vert?y0:y0+i*ph/n,ww=vert?pw/n:pw,hh=vert?ph:ph/n;const sh=r()*14-7;q.fillStyle=`rgb(${114+sh},${120+sh},${90+sh})`;q.fillRect(a,b,ww,hh);
      for(let k=0;k<14;k++){q.fillStyle=`rgba(${r()<.5?'60,62,44':'130,132,104'},${.15+r()*.2})`;if(vert)q.fillRect(a+r()*ww,b,1,hh);else q.fillRect(a,b+r()*hh,ww,1);}
      for(let k=0;k<5;k++){q.fillStyle=`rgba(150,112,70,${.25+r()*.3})`;q.beginPath();q.ellipse(a+r()*ww,b+r()*hh,2+r()*7,1+r()*3,vert?1.57:0,0,7);q.fill();}   // the paint worn through to the wood
      q.fillStyle='rgba(30,30,22,.75)';if(vert)q.fillRect(a,b,1.5,hh);else q.fillRect(a,b,ww,1.5);}
      q.strokeStyle='rgba(28,28,20,.8)';q.lineWidth=3;q.strokeRect(x0+1.5,y0+1.5,pw-3,ph-3);};
    plank(0,0,128,128,3,false);plank(128,0,128,128,3,false);plank(0,128,128,128,4,true);
    q.fillStyle='rgba(70,74,52,.9)';q.fillRect(0,0,10,128);q.fillRect(118,0,10,128);q.fillRect(128,0,128,10);q.fillRect(128,118,128,10);q.fillRect(0,128,128,10);q.fillRect(0,246,128,10);   // battens
    q.fillStyle='rgba(222,214,184,.82)';q.font='bold 20px monospace';q.textAlign='center';q.fillText('7,92 S.m.K.',64,50);q.font='bold 15px monospace';q.fillText('1500 PATR.',64,74);q.fillText('L 44',64,96);
    q.fillStyle='rgba(222,214,184,.7)';q.font='bold 13px monospace';q.fillText('Nr. 2318',190,40);
    q.strokeStyle='rgba(40,36,28,.9)';q.lineWidth=3;q.beginPath();q.moveTo(166,70);q.quadraticCurveTo(192,104,218,70);q.stroke();   // the rope handle's shadow
    q.fillStyle='#8a7650';q.fillRect(128,128,128,128);for(let i=0;i<300;i++){q.fillStyle=`rgba(${r()<.5?'60,50,32':'170,150,110'},.4)`;q.fillRect(128+r()*128,128+r()*128,2,2);}});
  else if(k==='wire')t=null;
  return DDG_TEX[k]=t;
}
// a sandbag: a rounded, fat-middled pillow, flat underneath (a sphere pushed out toward a box). Unit size: 1 long, .5 high, .62 deep
function ddgBagGeo(){
  const g=new THREE.SphereGeometry(1,10,6),pa=g.attributes.position;
  for(let i=0;i<pa.count;i++){let x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i);const f=v=>Math.sign(v)*Math.pow(Math.abs(v),.62);x=f(x);y=f(y);z=f(z);
    const end=1-.28*Math.pow(Math.abs(x),3);y*=end;z*=end;if(y<0)y*=.7;pa.setXYZ(i,x*.5,y*.25,z*.31);}
  g.computeVertexNormals();return g;
}
// an ammunition box with its faces cut from the crate picture: the stencilled side, the roped end, the lid
function ddgCrateBox(w,h,d){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,R=[[.5,.5],[.5,.5],[0,0],[.5,0],[0,.5],[0,.5]];   // (px nx py ny pz nz: the ends, the lid, the bottom, the sides)
  for(let i=0;i<uv.count;i++){const f=(i/4)|0,[ou,ov]=R[f];uv.setXY(i,ou+uv.getX(i)*.5,ov+uv.getY(i)*.5);}return g;
}
// a stack of them in a crate's place (Version 188: the cover crates were one plain block): two layers, a box gone from the top one, each a
// little askew, rope handles at the ends; w by h by d, its foot at 0
function ddgCrates(w,h,d,r){
  const P=[],bw=w/2-.4,bh=h/2,bd=d/2-.4,skip=(r()*4)|0,rope=new THREE.TorusGeometry(1.8,.38,4,8,Math.PI);
  for(let l=0;l<2;l++)for(let i=0;i<2;i++)for(let j=0;j<2;j++){if(l&&i*2+j===skip)continue;const x=(i-.5)*(bw+.6)+(r()-.5)*.8,z=(j-.5)*(bd+.6)+(r()-.5)*.8,y=bh*(l+.5)-.05,ry=(r()-.5)*.1,t=.82+r()*.24;
    P.push({g:ddgCrateBox(bw,bh-.15,bd),p:[x,y,z],r:[0,ry,0],c:new THREE.Color(t,t,t*(.95+r()*.08))});
    for(const sd of[-1,1])P.push({g:rope,p:[x+sd*(bw/2+.25),y+bh*.08,z],r:[Math.PI,Math.PI/2,0],at:[.75,.25],c:0xffffff});}
  return ddgMerge(P,true);
}
// a stretch of the beach's wire, relative to its middle at the ground (o: the ddwire object): posts of old timber and iron pickets
// turns about, three strands, a concertina coil along the top and another along the foot on the sea's side
function ddgWire(o,r){
  const P=[],cx=o.x+o.w/2,cy=o.y+o.h/2,g0=ddH(cx,cy),gh=x=>ddH(x,cy)-g0;
  for(let x=o.x,k=0;x<o.x+o.w-1;x+=12.5,k++){const px=x+.6-cx,lean=(r()-.5)*.12,lz=(r()-.5)*.1;
    if(k%2)P.push({g:new THREE.BoxGeometry(1.5,17.5,1.5),p:[px,gh(x)+8.5,0],r:[lz,r()*3,lean],c:0x8a7660});
    else{P.push({g:new THREE.BoxGeometry(.9,19,.35),p:[px,gh(x)+9,0],r:[lz,0,lean],c:0x6a625a},{g:new THREE.BoxGeometry(.35,19,.9),p:[px+.3,gh(x)+9,.3],r:[lz,0,lean],c:0x6a625a});}}
  for(const hh of[5,10,15])P.push({g:new THREE.BoxGeometry(o.w,.3,.3),p:[0,hh+(r()-.5)*.6,0],r:[0,0,(r()-.5)*.012],c:0x5a544c});
  const coil=(y0,z0,R,pitch)=>{const pts=[];for(let x=o.x;x<=o.x+o.w;x+=pitch/9){const a=(x-o.x)/pitch*TAU,j=1+(r()-.5)*.25;pts.push(new THREE.Vector3(x-cx,gh(x)+y0+Math.sin(a)*R*j,z0+Math.cos(a)*R*j));}
    P.push({g:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),pts.length*2,.2,3,false),c:0x625a50});};
  coil(17.2,0,2.9,4.6);coil(2.6,5,2.5,4.2);
  return ddgMerge(P,true);
}
function ddGroundBuild(sc){
  if(!DD)return;
  ddgLand(sc);
}
function ddGroundFrame(rdt,now,dt){}
