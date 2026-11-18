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
       '   if(gSteep>0.){float hz=abs(wn.x)>abs(wn.z)?vGWp.z:vGWp.x;vec2 sv=vec2(hz,vGWp.y*1.3)/56.;vec3 d3=texture2D(uGDet,sv).rgb-.5,d4=texture2D(uGDet,sv*.41+vec2(.13,.71)).rgb-.5;d1=mix(d1,d3,gSteep);d2=mix(d2,d4,gSteep);\n'+
       '    float yy=vGWp.y+6.*sin(hz*.011+1.3)+2.5*sin(hz*.037),sh=yy*.072+.5*sin(yy*.05+1.7)+.4*sin(yy*.021+hz*.003)+d3.b*.7,f=fract(sh),hb=fract(sin(floor(sh)*91.7)*43758.5),hb2=fract(sin(floor(sh)*37.3+2.)*24634.6);\n'+   // beds of rock along the face, dipping and swelling along it, no two as thick:
       '    vec3 st=vec3(.84+hb*.3)*(1.-.4*(1.-smoothstep(0.,.05+hb2*.14,f)))*(1.+.1*smoothstep(.82,1.,f));if(hb>.64)st*=vec3(1.08,1.01,.9);else if(hb<.22)st*=vec3(.93,.96,1.02);\n'+   // each its own shade (ochre, grey), a dark seam of its own depth under it, its top edge lit
       '    st*=1.+(texture2D(uGDet,vec2(hz*.03,vGWp.y*.0035)).b-.5)*.42;\n'+   // and streaks of weathering run down it (the detail read stretched tall)
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
  if(lin)mat.userData.ddKeep=true;   // (its colours already in the light's terms: ddlight.js's sweep would take them darker again)
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
    q.strokeStyle='rgba(84,66,40,.45)';q.lineWidth=1.4;q.setLineDash([3,2]);q.beginPath();q.moveTo(w*.25,0);q.lineTo(w*.25,h);q.stroke();q.setLineDash([]);});
  else if(k==='rust')t=canvasTex(128,128,(q,w,h)=>{q.fillStyle='#3e3732';q.fillRect(0,0,w,h);   // steel left in the sea: dark iron, rust blooming orange through it, streaks running down, scale flaking, bright metal where it's scraped
    for(let i=0;i<46;i++){q.fillStyle=`rgba(${r()<.5?'58,56,54':'30,26,24'},${.3+r()*.3})`;q.beginPath();q.ellipse(r()*w,r()*h,4+r()*16,3+r()*10,r()*3,0,7);q.fill();}
    for(let i=0;i<60;i++){q.fillStyle=`rgba(${r()<.5?'156,78,34':'122,62,30'},${.3+r()*.4})`;q.beginPath();q.ellipse(r()*w,r()*h,2+r()*10,2+r()*6,r()*3,0,7);q.fill();}
    for(let i=0;i<40;i++){const x=r()*w,g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,`rgba(176,88,36,${.2+r()*.3})`);g.addColorStop(1,'rgba(176,88,36,0)');q.fillStyle=g;q.fillRect(x,r()*h*.6,1+r()*2.5,20+r()*60);}
    for(let i=0;i<600;i++){q.fillStyle=`rgba(${r()<.5?'20,16,14':'196,110,56'},${.15+r()*.35})`;q.fillRect(r()*w,r()*h,1+r()*1.5,1+r()*1.5);}
    for(let i=0;i<14;i++){q.strokeStyle=`rgba(150,148,140,${.25+r()*.25})`;q.lineWidth=.8;q.beginPath();const x=r()*w,y=r()*h;q.moveTo(x,y);q.lineTo(x+(r()-.5)*20,y+(r()-.5)*6);q.stroke();}});
  else if(k==='turf')t=canvasTex(128,128,(q,w,h)=>{q.fillStyle='#53703a';q.fillRect(0,0,w,h);   // turf laid on a bunker's roof: grass in clumps, bare earth showing, darker where it's damp
    for(let i=0;i<40;i++){q.fillStyle=`rgba(${r()<.5?'40,58,28':'104,124,62'},${.25+r()*.3})`;q.beginPath();q.ellipse(r()*w,r()*h,4+r()*14,3+r()*9,r()*3,0,7);q.fill();}
    for(let i=0;i<10;i++){q.fillStyle=`rgba(96,78,52,${.3+r()*.3})`;q.beginPath();q.ellipse(r()*w,r()*h,2+r()*7,2+r()*4,r()*3,0,7);q.fill();}
    for(let i=0;i<900;i++){const x=r()*w,y=r()*h;q.strokeStyle=`rgba(${r()<.55?'34,52,24':'140,156,84'},${.3+r()*.4})`;q.lineWidth=1;q.beginPath();q.moveTo(x,y);q.lineTo(x+(r()-.5)*3,y-2-r()*4);q.stroke();}});
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
  else if(k==='lcvp')t=canvasTex(512,512,(q,w,h)=>{   // the landing craft (an LCVP, a Higgins boat), its faces in eight rows of 64 points: 0 and 1 the hull's outside
    // (the boat's number toward the bow, one each side), 2 the inside, 3-4 the deck, 5 the ramp's outside, 6 its inside, 7 the stern and plain colours
    const row=(k,col)=>{q.fillStyle=col;q.fillRect(0,k*64,w,64);};
    const grime=(y0,y1,n,a)=>{for(let i=0;i<n;i++){q.fillStyle=`rgba(${r()<.5?'30,34,32':'160,170,164'},${a*(.3+r()*.7)})`;q.fillRect(r()*w,y0+r()*(y1-y0),1+r()*3,1+r()*2);}};
    for(const k of[0,1]){const y=k*64;row(k,'#6c7873');
      q.fillStyle='rgba(30,40,38,.55)';q.fillRect(0,y+46,w,18);q.fillStyle='rgba(60,80,52,.35)';q.fillRect(0,y+52,w,12);   // the wet band and weed low down
      q.fillStyle='rgba(30,34,32,.6)';for(let x=40;x<w;x+=118)q.fillRect(x,y,2,64);q.fillRect(0,y+24,w,1.5);q.fillStyle='rgba(200,206,200,.25)';q.fillRect(0,y+1,w,2);
      for(let i=0;i<40;i++){const x=r()*w,g=q.createLinearGradient(0,y,0,y+64);g.addColorStop(0,'rgba(120,70,40,.4)');g.addColorStop(1,'rgba(120,70,40,0)');q.fillStyle=g;q.fillRect(x,y+r()*20,1+r()*2,20+r()*40);}   // rust run from the fittings
      for(let i=0;i<30;i++){q.strokeStyle=`rgba(170,178,172,${.2+r()*.3})`;q.lineWidth=.8;q.beginPath();const x=r()*w,yy=y+8+r()*40;q.moveTo(x,yy);q.lineTo(x+8+r()*30,yy+(r()-.5)*6);q.stroke();}   // scrapes
      grime(y,y+64,500,.3);
      q.fillStyle='rgba(232,232,222,.9)';q.font='bold 22px sans-serif';q.textAlign='center';q.fillText('PA 26-12',k?96:w-96,y+34);}
    {const y=128;row(2,'#84908a');for(let x=8;x<w;x+=46){q.fillStyle='rgba(40,48,44,.55)';q.fillRect(x,y,7,64);q.fillStyle='rgba(190,198,192,.25)';q.fillRect(x+7,y,1.5,64);}   // the inside: its frames, scuffed by boots and rifles
      q.fillStyle='rgba(40,46,42,.5)';q.fillRect(0,y+40,w,24);grime(y,y+64,900,.35);}
    {const y=192;q.fillStyle='#5e5446';q.fillRect(0,y,w,128);for(let x=0;x<w;x+=32){const t=(r()-.5)*16;q.fillStyle=`rgb(${92+t},${82+t},${68+t})`;q.fillRect(x+1,y,30,128);q.fillStyle='rgba(30,26,22,.8)';q.fillRect(x,y,1.5,128);}   // the deck's planks, wet and trodden
      for(let i=0;i<14;i++){q.fillStyle=`rgba(40,46,48,${.2+r()*.25})`;q.beginPath();q.ellipse(r()*w,y+r()*128,10+r()*30,4+r()*10,0,0,7);q.fill();}grime(y,y+128,1500,.3);}
    {const y=320;row(5,'#6c736f');for(let x=10;x<w;x+=24)for(let yy=y+6;yy<y+64;yy+=14){q.fillStyle='rgba(30,30,28,.6)';q.fillRect(x,yy,2,2);}   // the ramp's outside: plate, rivets, rust, bullet strikes
      for(let i=0;i<30;i++){const g=q.createLinearGradient(0,y,0,y+64);g.addColorStop(0,'rgba(130,72,38,.5)');g.addColorStop(1,'rgba(130,72,38,0)');q.fillStyle=g;q.fillRect(r()*w,y,1+r()*3,30+r()*34);}
      for(let i=0;i<40;i++){const x=r()*w,yy=y+r()*64;q.fillStyle='rgba(200,200,190,.5)';q.beginPath();q.arc(x,yy,2.2,0,7);q.fill();q.fillStyle='rgba(20,20,18,.8)';q.beginPath();q.arc(x,yy,1,0,7);q.fill();}grime(y,y+64,400,.3);}
    {const y=384;row(6,'#7c847e');for(let yy=y+4;yy<y+64;yy+=9){q.fillStyle='rgba(40,44,40,.6)';q.fillRect(0,yy,w,3);q.fillStyle='rgba(190,196,190,.3)';q.fillRect(0,yy+3,w,1);}grime(y,y+64,600,.35);}   // its inside: cleats for the boots
    {const y=448;q.fillStyle='#2e3432';q.fillRect(0,y,64,64);q.fillStyle='#5a6460';q.fillRect(64,y,64,64);q.fillStyle='#2a2c2e';q.fillRect(128,y,64,64);q.fillStyle='#64706a';q.fillRect(192,y,64,64);   // plain: the bottom, the gunwale, gun metal, a frame
      q.fillStyle='#68746e';q.fillRect(256,y,256,64);q.fillStyle='rgba(30,34,32,.7)';q.fillRect(300,y+12,60,40);q.fillRect(392,y+10,90,6);q.fillRect(392,y+22,90,6);q.fillRect(392,y+34,90,6);grime(y,y+64,400,.3);}});   // the stern: a hatch, the engine's grille
  else if(k==='boards')t=canvasTex(256,256,(q,w,h)=>{   // a hut's weatherboards, 8 to a tile of 32 units: paint gone dull, darker where the rain splashes, streaked under the eaves
    for(let y=0;y<h;y+=32){const t=(r()-.5)*14;q.fillStyle=`rgb(${150+t},${140+t},${112+t})`;q.fillRect(0,y,w,32);q.fillStyle='rgba(40,34,26,.75)';q.fillRect(0,y+29,w,3);q.fillStyle='rgba(230,224,200,.3)';q.fillRect(0,y,w,2);
      for(let i=0;i<10;i++){q.fillStyle=`rgba(${r()<.5?'90,80,60':'200,192,166'},${.08+r()*.12})`;q.fillRect(0,y+3+r()*24,w,1);}}
    for(let x=r()*30;x<w;x+=40+r()*60){q.fillStyle='rgba(40,34,26,.35)';q.fillRect(x,0,1.5,h);}
    for(let i=0;i<24;i++){const x=r()*w,g=q.createLinearGradient(0,0,0,h*.7);g.addColorStop(0,`rgba(50,44,34,${.12+r()*.2})`);g.addColorStop(1,'rgba(50,44,34,0)');q.fillStyle=g;q.fillRect(x,0,3+r()*8,h*.7);}
    for(let i=0;i<1500;i++){q.fillStyle=`rgba(${r()<.5?'40,36,28':'240,236,220'},${.06+r()*.1})`;q.fillRect(r()*w,r()*h,1.5,1.5);}});
  else if(k==='tiles'||k==='slate')t=canvasTex(256,256,(q,w,h)=>{const sl=k==='slate';   // a roof, a tile of 12 units: courses running along it, each tile its own shade, lichen and soot
    q.fillStyle=sl?'#3e4448':'#6a3a26';q.fillRect(0,0,w,h);const R=sl?8:6,C=sl?10:8;
    for(let j=0;j<R;j++){const y=j*h/R,off=(j%2)*w/C/2;for(let i=-1;i<=C;i++){const x=i*w/C+off,t=(r()-.5)*(sl?22:34);
      q.fillStyle=sl?`rgb(${86+t},${94+t},${102+t})`:`rgb(${158+t},${84+t*.7},${54+t*.5})`;q.fillRect(x+1,y+1,w/C-2,h/R-2);
      const g=q.createLinearGradient(0,y,0,y+h/R);g.addColorStop(0,'rgba(0,0,0,0)');g.addColorStop(1,'rgba(0,0,0,.35)');q.fillStyle=g;q.fillRect(x+1,y+1,w/C-2,h/R-2);
      if(!sl){q.fillStyle='rgba(255,220,180,.12)';q.fillRect(x+w/C*.3,y+2,w/C*.3,h/R-4);}}}
    for(let i=0;i<30;i++){q.fillStyle=`rgba(${r()<.6?'96,110,60':'40,36,32'},${.12+r()*.2})`;q.beginPath();q.ellipse(r()*w,r()*h,4+r()*18,3+r()*10,r()*3,0,7);q.fill();}});
  else if(k==='stone')t=canvasTex(256,256,(q,w,h)=>{   // Norman stone, cream limestone in courses of rough blocks, a tile of 24 units: mortar, weather, a few darker stones
    q.fillStyle='#8a8070';q.fillRect(0,0,w,h);let y=0;while(y<h){const ch=18+r()*16;let x=-r()*30;while(x<w){const cw=24+r()*40,t=(r()-.5)*26,dk=r()<.12?-30:0;
      q.fillStyle=`rgb(${206+t+dk},${196+t+dk},${172+t+dk})`;q.fillRect(x+2,y+2,cw-3,ch-3);
      const g=q.createLinearGradient(0,y,0,y+ch);g.addColorStop(0,'rgba(255,255,240,.15)');g.addColorStop(1,'rgba(60,50,40,.22)');q.fillStyle=g;q.fillRect(x+2,y+2,cw-3,ch-3);x+=cw;}y+=ch;}
    for(let i=0;i<20;i++){const x=r()*w,g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,`rgba(60,56,46,${.1+r()*.15})`);g.addColorStop(1,'rgba(60,56,46,0)');q.fillStyle=g;q.fillRect(x,0,4+r()*10,h);}
    for(let i=0;i<1600;i++){q.fillStyle=`rgba(${r()<.5?'70,64,52':'250,246,230'},${.06+r()*.12})`;q.fillRect(r()*w,r()*h,1.5,1.5);}});
  else if(k==='plaster')t=canvasTex(256,256,(q,w,h)=>{   // a limewashed render over rubble stone, a tile of 32 units: the wash gone patchy and grey, fallen away in places to the stone beneath, streaked from the sills, damp and green at the foot
    q.fillStyle='#d8cfb8';q.fillRect(0,0,w,h);
    for(let i=0;i<30;i++){q.fillStyle=`rgba(${r()<.5?'150,144,128':'240,236,222'},${.08+r()*.14})`;q.beginPath();q.ellipse(r()*w,r()*h,14+r()*40,10+r()*30,r()*3,0,7);q.fill();}
    for(let i=0;i<7;i++){const x=r()*w,y=r()*h,rw=10+r()*26,rh=8+r()*16;q.save();q.beginPath();q.ellipse(x,y,rw,rh,r()*3,0,7);q.clip();q.fillStyle='#8e8370';q.fillRect(x-rw,y-rh,rw*2,rh*2);
      for(let yy=y-rh;yy<y+rh;yy+=6+r()*4)for(let xx=x-rw-r()*6;xx<x+rw;xx+=7+r()*8){const t=(r()-.5)*26;q.fillStyle=`rgb(${176+t},${166+t},${144+t})`;q.fillRect(xx+1,yy+1,5+r()*5,4+r()*3);}q.restore();
      q.strokeStyle='rgba(120,112,96,.6)';q.lineWidth=1.2;q.beginPath();q.ellipse(x,y,rw,rh,0,0,7);q.stroke();}
    for(let i=0;i<26;i++){const x=r()*w,g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,`rgba(90,84,70,${.08+r()*.14})`);g.addColorStop(1,'rgba(90,84,70,0)');q.fillStyle=g;q.fillRect(x,r()*h*.5,2+r()*7,h*.6);}
    {const g=q.createLinearGradient(0,h*.7,0,h);g.addColorStop(0,'rgba(96,100,70,0)');g.addColorStop(1,'rgba(96,100,70,.35)');q.fillStyle=g;q.fillRect(0,h*.7,w,h*.3);}
    for(let i=0;i<1800;i++){q.fillStyle=`rgba(${r()<.5?'90,84,70':'255,252,240'},${.05+r()*.1})`;q.fillRect(r()*w,r()*h,1.5,1.5);}});
  else if(k==='wire')t=null;
  return DDG_TEX[k]=t;
}
// a sandbag: a rounded, fat-middled pillow, flat underneath (a sphere pushed out toward a box). Unit size: 1 long, .5 high, .62 deep
function ddgBagGeo(){
  const g=new THREE.SphereGeometry(1,8,5).rotateZ(Math.PI/2),pa=g.attributes.position;   // (its poles at the ends, where a sack is tied: the picture darkens there)
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
  const coil=(y0,z0,R,pitch)=>{const pts=[];for(let x=o.x;x<=o.x+o.w;x+=pitch/7){const a=(x-o.x)/pitch*TAU,j=1+(r()-.5)*.25;pts.push(new THREE.Vector3(x-cx,gh(x)+y0+Math.sin(a)*R*j,z0+Math.cos(a)*R*j));}
    P.push({g:new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts),Math.round(pts.length*1.4),.22,3,false),c:0x625a50});};
  coil(17.2,0,2.9,4.6);coil(2.6,5,2.5,4.2);
  return ddgMerge(P,true);
}
// a box whose faces each show a piece of an atlas (px nx py ny pz nz; [u0,v0,u1,v1], or a [u,v] point for a plain colour)
function ddgAtlasBox(w,h,d,R){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv;
  for(let i=0;i<uv.count;i++){const f=R[(i/4)|0];if(f.length===2)uv.setXY(i,f[0],f[1]);else uv.setXY(i,f[0]+uv.getX(i)*(f[2]-f[0]),f[1]+uv.getY(i)*(f[3]-f[1]));}return g;
}
// the landing craft's shapes, made once a chapter and shared by every boat (Version 188: an LCVP, a Higgins boat: painted plywood with its
// number on the bow, frames inside, a planked deck, a steel ramp riveted outside and cleated inside, the gunwales capped, the coxswain's
// house at the stern with a .30 calibre gun each side). The same sizes as the old steel box, so the men and the ride sit as before.
function ddgLCVP(){
  if(DD.lcvp)return DD.lcvp;
  const V=k=>[0,1-(k+1)/8,1,1-k/8],OUTR=V(0),OUTL=V(1),IN=V(2),DECK=[0,1-5/8,1,1-3/8],ROUT=V(5),RIN=V(6),STERN=[.5,0,1,1/8],BOT=[.06,.06],CAP=[.19,.06],GUN=[.31,.06],FR=[.44,.06];
  const P=[{g:ddgAtlasBox(34,3,104,[BOT,BOT,DECK,BOT,BOT,BOT]),p:[0,1.5,0]},
    {g:ddgAtlasBox(2.4,15,104,[OUTR,IN,CAP,CAP,CAP,CAP]),p:[17,9,0]},{g:ddgAtlasBox(2.4,15,104,[IN,OUTL,CAP,CAP,CAP,CAP]),p:[-17,9,0]},
    {g:ddgAtlasBox(34,15,2.4,[CAP,CAP,CAP,CAP,STERN,IN]),p:[0,9,52]},{g:ddgAtlasBox(30,9,18,[STERN,STERN,STERN,BOT,STERN,STERN]),p:[0,13,42]},
    {g:ddgAtlasBox(3.4,1.4,105,[CAP,CAP,CAP,CAP,CAP,CAP]),p:[17,17.1,0]},{g:ddgAtlasBox(3.4,1.4,105,[CAP,CAP,CAP,CAP,CAP,CAP]),p:[-17,17.1,0]},
    {g:ddgAtlasBox(4,16.4,7,[OUTR,IN,CAP,CAP,CAP,CAP]),p:[15.6,9.6,-48.8]},{g:ddgAtlasBox(4,16.4,7,[IN,OUTL,CAP,CAP,CAP,CAP]),p:[-15.6,9.6,-48.8]}];   // the bow's shoulders either side of the ramp
  for(let z=-40;z<=28;z+=9.7)for(const sd of[-1,1])P.push({g:ddgAtlasBox(1.1,13.5,1.4,[FR,FR,FR,FR,FR,FR]),p:[sd*15.3,9.4,z]});   // the frames inside
  for(const sd of[-1,1]){P.push({g:ddgAtlasBox(1.2,5,1.2,[GUN,GUN,GUN,GUN,GUN,GUN]),p:[sd*13,20,47]},{g:ddgAtlasBox(1.6,2,6.5,[GUN,GUN,GUN,GUN,GUN,GUN]),p:[sd*13,23,45.5]});
    const b=new THREE.CylinderGeometry(.35,.35,9,6);b.rotateX(Math.PI/2);P.push({g:b,p:[sd*13,23.2,38],at:GUN});
    const sh=ddgAtlasBox(5,4,.5,[CAP,CAP,CAP,CAP,CAP,CAP]);P.push({g:sh,p:[sd*13,24.5,41.5]});}   // the guns, their shields
  const R=[{g:ddgAtlasBox(33,16,2,[CAP,CAP,CAP,CAP,RIN,ROUT]),p:[0,8,0]}];for(let y=2.5;y<15;y+=2.6)R.push({g:ddgAtlasBox(31,.8,1,[RIN,RIN,RIN,RIN,RIN,RIN]),p:[0,y,1.4]});
  return DD.lcvp={hull:ddgMerge(P,false),ramp:ddgMerge(R,false),m:new THREE.MeshStandardMaterial({map:ddgTex('lcvp'),roughness:.82,metalness:.08}),mw:new THREE.MeshStandardMaterial({map:ddgTex('lcvp'),color:0x4a4644,roughness:.95,metalness:.05})};
}
// a box with its pictures at a steady size on every face (uvs in tiles of `tile` units), so one material serves every building
function ddgBoxUV(w,h,d,tile,top){
  const g=new THREE.BoxGeometry(w,h,d),uv=g.attributes.uv,S=[[d,h],[d,h],[w,d],[w,d],[w,h],[w,h]];
  for(let i=0;i<uv.count;i++){const f=(i/4)|0;if(top&&(f===2||f===3)){uv.setXY(i,top[0],top[1]);continue;}uv.setXY(i,uv.getX(i)*S[f][0]/tile,uv.getY(i)*S[f][1]/tile);}return g;
}
// a pitched roof's two slopes (the ridge along x, the eaves at 0, centred), for laying over a building's own roof shape: tiles or slates
// with their courses along the roof, a tile of 12 units
function ddgRoof(span,len,rise,th=1){
  const half=span/2,sl=Math.hypot(half,rise),a=Math.atan2(rise,half),P=[];
  for(const sd of[-1,1])P.push({g:ddgBoxUV(len,th,sl+1.5,12),p:[0,rise/2+th*.5*Math.cos(a),sd*(half/2+th*.5*Math.sin(a))],r:[sd*a,0,0]});
  P.push({g:ddgBoxUV(len,1.6,2.2,12),p:[0,rise+.6,0]});   // the ridge
  return ddgMerge(P,false);
}
// the land's own colour anywhere, as painted (sRGB, 0..1; its picture read back once a chapter at 2 units a point), for things laid on it
// to meet it without a seam
function ddgLandCol(){
  if(DD.landCol)return DD.landCol;
  const W=Math.round((DDB.x1-DDB.x0)/2),H=Math.round((DDB.y1-DDB.y0)/2),c=document.createElement('canvas');c.width=W;c.height=H;const q=c.getContext('2d');q.drawImage(DD.canvas,0,0,W,H);
  const d=q.getImageData(0,0,W,H).data;
  return DD.landCol=(x,y,o)=>{const i=clamp(((x-DDB.x0)/2)|0,0,W-1),j=clamp(((y-DDB.y0)/2)|0,0,H-1),k=(j*W+i)*4;return o.setRGB(d[k]/255,d[k+1]/255,d[k+2]/255);};
}
// the banks thrown up round shell holes (Version 188; they were a pale ring like a life belt, then a smooth orange one): for each hole {x,y,r}
// (world units) a ring of churned ground: its outer edge the land's own colour, so it meets the land without a seam, fresh spoil heaped
// along the crest in lumps, dark damp earth down the inside, scorched black on the side the blast threw its flash, and the inside meeting
// the hole as painted. o: {spoil, earth} the thrown and the dug colours as [r,g,b] 0..255 (sRGB), lift (how high the crest), seed. One mesh.
function ddgCraters(G,holes,o){
  o=o||{};const r=rng(o.seed||188),L=ddgLandCol(),S=48,P=[],C=[],I=[],ca=new T.Color(),cb=new T.Color(),sp=new T.Color(),ea=new T.Color(),ch=new T.Color(44/255,38/255,32/255),lift=o.lift||1;
  for(const hh of holes){const R=hh.r,base=P.length/3,sa=r()*TAU,ph1=r()*6,ph2=r()*6,ph3=r()*6;
    // [radius, height above the ground, colour: 0 the hole as painted, 1 dug earth, 2 the crest's spoil, 3 spoil into land, 4 the land]
    const rows=[[R*.55,0,0],[R*.8,.45,1],[R*.97,1.8,1.5],[R+2.6,2.9,2],[R+6.2,1.4,3],[R+11,-.3,4]];
    for(let i=0;i<S;i++){const a=i/S*TAU,cs=Math.cos(a),sn=Math.sin(a),n=Math.max(.35,1+.3*Math.sin(a*3+ph1)+.22*Math.sin(a*7+ph2)+.16*Math.sin(a*13+ph3)+(r()-.5)*.4),burn=Math.max(0,Math.cos(a-sa))**2;
      L(hh.x+cs*(R+16),hh.y+sn*(R+16),sp);if(o.spoil)sp.setRGB(o.spoil[0]/255,o.spoil[1]/255,o.spoil[2]/255).lerp(L(hh.x+cs*(R+16),hh.y+sn*(R+16),cb),.25);else sp.multiplyScalar(1.07);
      if(o.earth)ea.setRGB(o.earth[0]/255,o.earth[1]/255,o.earth[2]/255);else ea.copy(sp).multiplyScalar(.58);
      for(const[rr,hg,k]of rows){const churn=k>=1&&k<=3,rad=rr+(churn?(r()-.5)*2.4:0),x=hh.x+cs*rad,y=hh.y+sn*rad;
        if(k===0||k===4)L(x,y,ca);else if(k===1)L(x,y,ca).lerp(ea,.6);else if(k===1.5)ca.copy(ea).lerp(sp,.35+r()*.2);else if(k===2)ca.copy(sp).lerp(ea,r()<.25?.5:r()*.15);else ca.copy(sp).lerp(L(x,y,cb),.55);
        if(k>=1&&k<=2)ca.lerp(ch,burn*(k===2?.55:.8));
        if(churn)ca.multiplyScalar(.9+r()*.2);
        P.push(x,ddH(x,y)+hg*lift*(k===4||k===0?1:n)+(churn?(r()-.5)*.9*lift:0),y);ca.convertSRGBToLinear();C.push(ca.r,ca.g,ca.b);}}
    for(let i=0;i<S;i++){const i2=(i+1)%S;for(let j=0;j<rows.length-1;j++){const a=base+i*rows.length+j,b=base+i2*rows.length+j;I.push(a,b,a+1,b,b+1,a+1);}}}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
  const m=new T.Mesh(g,new T.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true}));m.material.userData.ddKeep=true;m.castShadow=true;m.receiveShadow=true;G.add(m);return m;
}
// lumps thrown out of the holes: [{x,y,c}] the instances, c a colour (sRGB). Round the rims, sized by the hole
function ddgClods(holes,r,n,spoil,earth){
  const L=ddgLandCol(),out=[],a=new T.Color(),b=new T.Color();
  for(const hh of holes)for(let k=0;k<n*hh.r/26;k++){const an=r()*TAU,d=hh.r*(.95+r()*r()*1.1)+2,x=hh.x+Math.cos(an)*d,y=hh.y+Math.sin(an)*d;L(x,y,a);
    if(spoil)a.lerp(b.setRGB(spoil[0]/255,spoil[1]/255,spoil[2]/255),.6);else a.multiplyScalar(1.05);if(r()<.4)a.lerp(earth?b.setRGB(earth[0]/255,earth[1]/255,earth[2]/255):b.copy(a).multiplyScalar(.6),.7);
    out.push({x,y,h:ddH(x,y)+.3,ry:r()*6,rx:r()*3,sx:.6+r()*r()*2.2,sy:.45+r()*.6,c:a.clone()});}
  return out;
}
function ddgMat(k,o){const key='mat_'+k;if(DD[key])return DD[key];return DD[key]=new THREE.MeshStandardMaterial(Object.assign({map:ddgTex(k),roughness:.92},o||{}));}
// the same picture for a shape whose uvs are in plain units (an extruded gable, say): its tile `tile` units across
function ddgMatRep(k,tile){const key='matr_'+k+tile;if(DD[key])return DD[key];const t=ddgTex(k).clone();t.needsUpdate=true;t.repeat.set(1/tile,1/tile);return DD[key]=new THREE.MeshStandardMaterial({map:t,roughness:.92});}
// a tuft of grass blades (Version 188: the tufts were pale cones, specks at the game's distance): six blades splayed from a dark root to lit
// tips, the shading baked in (the colour attribute multiplies the tuft's own colour); shared by every chapter, drawn double-sided
function ddgTuftGeo(seed){
  const r=rng(seed||5),P=[],C=[];for(let k=0;k<6;k++){const a=k*1.05+r()*.5,l=k?.7+r()*.5:.1,hh=k?2.4+r()*1.4:3.6,ca=Math.cos(a),sa=Math.sin(a),w=.32;
    P.push(-sa*w,0,ca*w, sa*w,0,-ca*w, ca*l*1.4,hh,sa*l*1.4);C.push(.42,.42,.42,.42,.42,.42,1.15,1.15,1.15);}
  const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(P,3));g.setAttribute('color',new THREE.Float32BufferAttribute(C,3));g.computeVertexNormals();return g;
}
function ddGroundBuild(sc){
  if(!DD)return;
  ddgLand(sc);
}
function ddGroundFrame(rdt,now,dt){}
