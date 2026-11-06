"use strict";
/* creatures.js: the monsters' bodies, second round (Bryan: they "look like a kids drawing", "a pink blob"; "black, grey and
   brown - natural colors... If it looks blocky and childlike we'd lose players after this battle"). Original designs: the
   Brood Mother is a giant centipede (Bryan: "a large indoor centipede"), her brood smaller things of the same stock. Smooth
   swept tubes and domed plates instead of boxes, wet chitin (a clear coat over dark brown, a faint cool rim so black still
   reads in the dark), legs that reach the floor (two-bone IK) and move in a wave down the body. The Headquarters gets her
   nest: resin over the walls, wet resin sheets over the floor, egg clutches. DRAFT for Bryan to judge: warehouse-yard.html
   doesn't load this file yet and the game still uses monsters.js's bodies. tools/drafts renders the pictures in
   docs/drafts (docs/monster-drafts.md). */
const CR={env:null,tex:{},mats:{},geo:{}};
// how finely the shapes are made: 1 for close-ups (tools/drafts); the game's pools build theirs coarser (a hunter at full
// detail was ~31,000 triangles: twenty of them, and their shadows, came to 1.6 million)
let CR_DET=1;const crD=(n,min)=>Math.max(min,Math.round(n*CR_DET));

/* ---------- noise ---------- */
const crSm=t=>t*t*(3-2*t);
const crS=(a,b,x)=>crSm(Math.min(1,Math.max(0,(x-a)/(b-a))));
function crH(x,y,z){let h=Math.imul(x|0,374761393)^Math.imul(y|0,668265263)^Math.imul(z|0,1274126177);h=Math.imul(h^(h>>>13),1274126177);return((h^(h>>>16))>>>0)/4294967296;}
function crN(x,y,z){const xi=Math.floor(x),yi=Math.floor(y),zi=Math.floor(z),u=crSm(x-xi),v=crSm(y-yi),w=crSm(z-zi);let r=0;
  for(let c=0;c<8;c++){const a=c&1,b=c>>1&1,d=c>>2&1;r+=crH(xi+a,yi+b,zi+d)*(a?u:1-u)*(b?v:1-v)*(d?w:1-w);}return r;}
function crF(x,y,z,o=4){let a=.5,f=1,r=0,n=0;for(let i=0;i<o;i++){r+=a*crN(x*f+i*17.13,y*f+i*5.7,z*f);n+=a;a*=.5;f*=2.07;}return r/n;}
// tileable (period P cells at the base frequency) for textures
function crP(x,y,P,s){const xi=Math.floor(x),yi=Math.floor(y),u=crSm(x-xi),v=crSm(y-yi),m=k=>((k%P)+P)%P;
  return crH(m(xi),m(yi),s)*(1-u)*(1-v)+crH(m(xi+1),m(yi),s)*u*(1-v)+crH(m(xi),m(yi+1),s)*(1-u)*v+crH(m(xi+1),m(yi+1),s)*u*v;}
function crPF(x,y,P,s,o=4){let a=.5,f=1,r=0,n=0;for(let i=0;i<o;i++){r+=a*crP(x*f,y*f,P*f,s+i*31);n+=a;a*=.5;f*=2;}return r/n;}
const crLin=h=>{const c=new T.Color(h).convertSRGBToLinear();return[c.r,c.g,c.b];};
const crMix=(a,b,k)=>[a[0]+(b[0]-a[0])*k,a[1]+(b[1]-a[1])*k,a[2]+(b[2]-a[2])*k];

/* ---------- textures: fine relief as normal maps (tileable) ---------- */
function crNormalTex(key,size,hf,k=2){
  if(CR.tex[key])return CR.tex[key];
  const H=new Float32Array(size*size);for(let y=0;y<size;y++)for(let x=0;x<size;x++)H[y*size+x]=hf(x/size,y/size);
  const cv=document.createElement('canvas');cv.width=cv.height=size;const g=cv.getContext('2d'),im=g.createImageData(size,size),d=im.data,at=(i,j)=>H[((j+size)%size)*size+((i+size)%size)];
  for(let y=0;y<size;y++)for(let x=0;x<size;x++){const dx=(at(x+1,y)-at(x-1,y))*k*size/64,dy=(at(x,y+1)-at(x,y-1))*k*size/64,l=Math.hypot(dx,dy,1),o=(y*size+x)*4;
    d[o]=(-dx/l*.5+.5)*255;d[o+1]=(dy/l*.5+.5)*255;d[o+2]=(1/l*.5+.5)*255;d[o+3]=255;}
  g.putImageData(im,0,0);const t=new T.CanvasTexture(cv);t.wrapS=t.wrapT=T.RepeatWrapping;t.anisotropy=4;return CR.tex[key]=t;}
// chitin: a fine grain, shallow pits and faint growth lines across the plate
const crChitinH=(u,v)=>{const w=crPF(u*6,v*6,6,7,2);return .55*crPF(u*32,v*32,32,11,3)+.35*Math.pow(1-crPF(u*14,v*14,14,19,2),3)+.1*Math.pow(Math.abs(Math.sin((v*5+w*1.3)*Math.PI)),4);};
// soft parts: wrinkles round the limb, mottled
const crSkinH=(u,v)=>.18*Math.pow(Math.abs(Math.sin((u*10+crPF(u*8,v*4,8,3,2)*3)*Math.PI)),2)+.82*crPF(u*20,v*10,20,5,3);
// goo: lumps and runs that hang downward
const crGooH=(u,v)=>.5*crPF(u*8,v*8,8,41,4)+.35*crPF(u*24,v*5,24,43,3)+.15*crPF(u*48,v*48,48,47,2);

/* ---------- reflections: a dim room with the Headquarters' lights in it ---------- */
function crEnv(){
  if(CR.env)return CR.env;
  const sc=new T.Scene();sc.background=new T.Color(0x010101);
  const add=(c,k,x,y,z,w,h,d)=>{const m=new T.Mesh(new T.BoxGeometry(w,h,d),new T.MeshBasicMaterial({color:new T.Color(c).multiplyScalar(k)}));m.position.set(x,y,z);sc.add(m);};
  add(0xff4a3a,1.1,-30,8,-40,10,4,2);add(0xff4a3a,.8,40,8,30,2,4,10);   // the red emergency lamps
  add(0xffa45a,.9,10,-2,40,16,3,2);   // a warm glow low down (the eggs)
  add(0xdde6ff,1.6,0,32,0,30,1,3);add(0xdde6ff,1.2,-25,26,20,4,1,4);   // a cold strip light overhead, a bare bulb
  add(0x0b0907,1,0,-20,0,150,1,150);   // the floor's bounce
  sc.add(new T.Mesh(new T.SphereGeometry(90,32,16),new T.MeshBasicMaterial({color:0x020202,side:T.BackSide})));   // (a dark dome all round: the empty background came out white here)
  const pm=new T.PMREMGenerator(renderer);const rt=pm.fromScene(sc,.03);pm.dispose();
  return CR.env=rt.texture;}

/* ---------- materials: wet chitin with a cool rim ---------- */
function crMat(key,o={}){
  if(CR.mats[key])return CR.mats[key];
  const m=new T.MeshPhysicalMaterial({vertexColors:true,roughness:o.rough??.36,metalness:0,clearcoat:o.coat??1,clearcoatRoughness:o.coatR??.12,
    normalMap:o.nmap??null,normalScale:new T.Vector2(o.ns??.55,o.ns??.55),envMap:crEnv(),envMapIntensity:o.env??1,
    transparent:o.alpha!=null,opacity:o.alpha??1,depthWrite:o.alpha==null,emissive:new T.Color(o.emis??0),side:o.side??T.FrontSide});
  const U={uRim:{value:new T.Color(o.rim??0x8494a6).convertSRGBToLinear().multiplyScalar(o.rimK??.2)},uFill:{value:o.fill??.025}};
  m.onBeforeCompile=s=>{Object.assign(s.uniforms,U);
    s.fragmentShader=s.fragmentShader.replace('#include <common>','#include <common>\nuniform vec3 uRim;uniform float uFill;')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n {float f=1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.);totalEmissiveRadiance+=uRim*(f*f*f)+diffuseColor.rgb*uFill;}');};
  m.customProgramCacheKey=()=>'cr-'+key;m.userData.U=U;return CR.mats[key]=m;}

/* ---------- shapes ---------- */
// a tube along a centreline (parallel-transport frames), its radius per point or a function of the way along (0..1);
// col(u,v) gives vertex colours; flat squashes the section (1 = round)
function crSweep(pts,rad,{sides=10,col=null,flat=1,cap0=true,cap1=true}={}){
  const n=pts.length,Tg=[],Nr=[],Bn=[];
  for(let i=0;i<n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n-1,i+1)];Tg.push(new T.Vector3().subVectors(b,a).normalize());}
  const nr=Math.abs(Tg[0].y)<.9?new T.Vector3(0,1,0):new T.Vector3(1,0,0);nr.addScaledVector(Tg[0],-Tg[0].dot(nr)).normalize();
  for(let i=0;i<n;i++){if(i){const ax=new T.Vector3().crossVectors(Tg[i-1],Tg[i]),l=ax.length();if(l>1e-7)nr.applyAxisAngle(ax.divideScalar(l),Math.atan2(l,Tg[i-1].dot(Tg[i])));nr.addScaledVector(Tg[i],-Tg[i].dot(nr)).normalize();}
    Nr.push(nr.clone());Bn.push(new T.Vector3().crossVectors(Tg[i],nr).normalize());}
  const P=[],UV=[],C=[],I=[],Ls=[0];for(let i=1;i<n;i++)Ls.push(Ls[i-1]+pts[i].distanceTo(pts[i-1]));const L=Ls[n-1]||1;
  const R=i=>typeof rad==='function'?rad(Ls[i]/L,i):rad[i];
  for(let i=0;i<n;i++){const u=Ls[i]/L,r=R(i);
    for(let j=0;j<=sides;j++){const th=j/sides*Math.PI*2,c=Math.cos(th),s=Math.sin(th),q=pts[i].clone().addScaledVector(Nr[i],c*r*flat).addScaledVector(Bn[i],s*r);
      P.push(q.x,q.y,q.z);UV.push(u,j/sides);if(col)C.push(...col(u,j/sides));}}
  for(let i=0;i<n-1;i++)for(let j=0;j<sides;j++){const a=i*(sides+1)+j,b=a+sides+1;I.push(a,a+1,b,b,a+1,b+1);}
  const cap=(i,out)=>{const r=R(i),c=pts[i].clone().addScaledVector(Tg[i],out*r*.7),k=P.length/3;P.push(c.x,c.y,c.z);UV.push(i?1:0,.5);if(col)C.push(...col(i?1:0,.5));
    for(let j=0;j<sides;j++){const a=i*(sides+1)+j;if(out>0)I.push(a,a+1,k);else I.push(a+1,a,k);}};
  if(cap0)cap(0,-1);if(cap1)cap(n-1,1);
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(UV,2));
  if(col)g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
  const nm=g.attributes.normal;for(let i=0;i<n;i++){const a=i*(sides+1),b=a+sides,x=nm.getX(a)+nm.getX(b),y=nm.getY(a)+nm.getY(b),z=nm.getZ(a)+nm.getZ(b),l=Math.hypot(x,y,z)||1;nm.setXYZ(a,x/l,y/l,z/l);nm.setXYZ(b,x/l,y/l,z/l);}   // (no seam)
  return g;}
// a smooth curve through a few points, n samples
function crCurve(ctrl,n){const c=new T.CatmullRomCurve3(ctrl.map(p=>p.isVector3?p:new T.Vector3(...p)),false,'centripetal');return c.getPoints(n-1);}
// merge geometries that carry the same attributes
function crMerge(gs){const A={position:3,normal:3,uv:2,color:3},arr={},I=[];let base=0;for(const k in A)arr[k]=[];
  for(const g of gs){const n=g.attributes.position.count;
    for(const k in A){const a=g.attributes[k];if(a)for(let i=0;i<n*A[k];i++)arr[k].push(a.array[i]);else for(let i=0;i<n*A[k];i++)arr[k].push(k==='color'?1:0);}
    const ix=g.index?g.index.array:Array.from({length:n},(_,i)=>i);for(const i of ix)I.push(i+base);base+=n;}
  const out=new T.BufferGeometry();for(const k in A)out.setAttribute(k,new T.Float32BufferAttribute(arr[k],A[k]));out.setIndex(I);return out;}
// a domed plate (a centipede's back plate, its head): a sphere squared off at the corners (sq), flattened below, with paired
// keels down the back, a raised hind margin and a front edge that tucks under the plate ahead. Local: x across (-1..1),
// y up, z forward (-1..1). col(ax,bz,top) gives its colour from how far out (0..1), how far back (-1..1) and top/bottom.
function crPlate({sq=4,dome=.55,keel=.12,rim=.16,front=.75,under=.35,seg=null,col}={}){
  seg=seg||[crD(40,10),crD(20,6)];const g=new T.SphereGeometry(1,seg[0],seg[1]),p=g.attributes.position,uv=g.attributes.uv,C=[];
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const hr=Math.hypot(x,z);if(hr>1e-6){const a=Math.atan2(z,x),ca=Math.abs(Math.cos(a)),sa=Math.abs(Math.sin(a)),k=1/Math.pow(Math.pow(ca,sq)+Math.pow(sa,sq),1/sq);x*=k;z*=k;}
    const ax=Math.abs(x),top=y>0;let yy=top?Math.pow(y,dome):y*under;
    if(top){const e=Math.min(1,y*4);yy+=keel*Math.exp(-Math.pow((ax-.3)/.1,2))*e;yy+=rim*crS(.5,1,-z)*e;if(z>0)yy*=1-(1-front)*crS(.25,1,z);}
    p.setXYZ(i,x,yy,z);uv.setXY(i,x*.5+.5,z*.5+.5);if(col)C.push(...col(Math.min(1,Math.max(ax,Math.abs(z)*.9)),z,top?1:0,x));}
  if(col)g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeVertexNormals();return g;}

/* ---------- the palettes: black, grey and brown (Bryan) ---------- */
const CR_PAL={
  mother:{c:'#0c0907',m:'#22160e',e:'#6b4a2c',under:'#4a423a',under2:'#241e1a',leg0:'#33261b',leg1:'#0f0b08',joint:'#7a5a3a',tip:'#1a120c',eye:'#030303'},
  hunter:{c:'#0a0908',m:'#1f1712',e:'#463424',under:'#40160f',under2:'#1e0a07',leg0:'#2e241c',leg1:'#100c0a',joint:'#3a2617',tip:'#120d0a',eye:'#030303'},
  brood:{c:'#131110',m:'#2b2622',e:'#544a40',under:'#5c554d',under2:'#332e29',leg0:'#544c44',leg1:'#1f1b18',joint:'#82786c',tip:'#0e0c0b',eye:'#050505'}};

/* ---------- a centipede: the Brood Mother and her brood ---------- */
const MOTHER={pal:'mother',n:21,seg:6.4,head:{w:21,l:16,h:9.5},w:u=>17+4.5*Math.sin(Math.PI*Math.min(1,u*1.1))-2.5*u,h:9.5,ride:9,
  leg:{cx:3.2,fe:u=>10.5+2*u,ti:u=>11+3*u,ta:u=>6.5+2*u,r:u=>2+.3*(1-u)},spread:u=>19+5*u,stride:5,lift:3,ult:[19,17,14],ultR:2.5,ant:50,forc:16,spines:true,raise:24};
const BROOD={pal:'brood',n:15,seg:2.3,head:{w:6.2,l:4.8,h:2.6},w:u=>5.8+1.3*Math.sin(Math.PI*u)-.8*u,h:2.8,ride:3.3,
  leg:{cx:1.1,fe:u=>4.3+1*u,ti:u=>4.7+1.3*u,ta:u=>3+.8*u,r:u=>.55},spread:u=>9+3*u,stride:2.2,lift:1.2,ult:[6.6,6.4,5.6],ultR:.8,ant:16,forc:4.4,spines:false,raise:8};

function crCentiGeo(S){
  const key=S.pal+'@'+CR_DET;if(CR.geo[key])return CR.geo[key];
  const P=CR_PAL[S.pal],L=k=>crLin(P[k]);
  const plateCol=(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.4,.8,r)),L('e'),Math.min(1,crS(.82,1,r)*.7+crS(.6,.92,-z)*.8)):L('under2');
  const terg=crPlate({sq:4.2,dome:.5,keel:.16,rim:.2,front:.7,col:plateCol});
  const stern=crPlate({sq:3.2,dome:.8,keel:0,rim:.05,front:.85,col:(r,z,top)=>top?crMix(L('under'),L('under2'),crS(.6,1,r)*.7):L('under2')});
  const core=new T.SphereGeometry(1,crD(18,8),crD(12,6));{const p=core.attributes.position,C=[];for(let i=0;i<p.count;i++){const y=p.getY(i);C.push(...crMix(L('under2'),L('under'),crS(-.2,.6,-y)));}core.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  // the legs: parts along +x, unit length and radius about 1 (the pose stretches and thickens them); paler at each joint
  const part=(prof,{bend=0,c0='leg0',c1='leg1',tip=null,spines=0,aspect=9,sides=crD(9,4)})=>{const n=prof.length,pts=[];for(let i=0;i<n;i++){const u=i/(n-1);pts.push(new T.Vector3(u,-bend*u*u,0));}
    const col=u=>{let c=crMix(L(c0),L(c1),crS(.1,1,u));c=crMix(c,L('joint'),(1-crS(0,.12,u))*.55);if(tip)c=crMix(c,L(tip),crS(.55,1,u));return c;};
    const gs=[crSweep(pts,prof,{sides,col})];
    for(let k=0;k<spines;k++){const u0=.3+k*.55/Math.max(1,spines-1),ri=prof[Math.round(u0*(n-1))];
      const sp=crSweep(crCurve([[0,-ri*.55,0],[-.25,-ri*1.25,.1],[-.65,-ri*1.9,.22]],6),q=>.28*(1-q)+.03,{sides:crD(6,4),col:()=>L('tip'),cap0:false});
      const sq=sp.attributes.position;for(let i=0;i<sq.count;i++)sq.setXYZ(i,u0+sq.getX(i)/aspect,sq.getY(i)-bend*u0*u0,sq.getZ(i)/1);sp.computeVertexNormals();gs.push(sp);}
    return gs.length>1?crMerge(gs):gs[0];};
  const G={terg,stern,core,
    coxa:part([.9,1.08,1.04,.9],{c0:'joint',c1:'leg0'}),
    fem:part([.95,1.04,.94,.86,.8,.82,.92],{bend:-.35,spines:S.spines?1:0}),
    tib:part([.88,.8,.72,.66,.62,.66],{bend:.3,spines:0}),
    tar:part([.6,.52,.44,.36,.26,.14,.03],{bend:2.6,tip:'tip'}),
    ult:part([1,1.08,.98,.9,.86,.92],{c0:'leg0',c1:'leg1',spines:S.spines?3:1,aspect:7})};
  // the head: a flattened, rounded shield, darker and smoother; antennae beaded; the forcipules (the venom claws) curving
  // round the front, black at the points; small glossy eyes in clusters at the front corners
  G.head=crPlate({sq:2.6,dome:.75,keel:.07,rim:0,front:.95,under:.6,seg:[crD(48,12),crD(26,8)],col:(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.55,1,r)*.5),L('e'),crS(.9,1,r)*.3):L('under2')});
  const H=S.head;
  G.forc=crSweep(crCurve([[0,0,0],[.16,-.06,.28],[.2,-.08,.56],[.08,-.06,.82],[-.16,-.02,.96],[-.36,.02,.93]],crD(22,8)).map(p=>p.multiplyScalar(S.forc)),
    u=>S.forc*(.115*Math.pow(1-crS(0,1,u),1.1)+.008)*(1+.12*Math.exp(-Math.pow((u-.18)/.1,2))),{sides:crD(12,6),col:u=>crMix(crMix(L('m'),L('e'),.55*(1-crS(.2,.5,u))),L('tip'),crS(.4,.8,u))});
  const ant=[],na=crD(40,12);for(let i=0;i<na;i++){const u=i/(na-1);ant.push(new T.Vector3(.0,Math.sin(u*Math.PI*.9)*.12,u).multiplyScalar(S.ant));}
  G.ant=crSweep(ant,u=>S.ant*.02*(1-.72*u)*(.9+.1*Math.cos(u*22*Math.PI*2)),{sides:crD(8,4),col:u=>crMix(L('leg0'),L('leg1'),u)});
  G.eye=new T.SphereGeometry(1,crD(12,6),crD(9,5));{const p=G.eye.attributes.position,C=[];for(let i=0;i<p.count;i++)C.push(...L('eye'));G.eye.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  G.maw=new T.SphereGeometry(1,16,10);{const p=G.maw.attributes.position,C=[];for(let i=0;i<p.count;i++)C.push(...crMix(L('tip'),[.08,.02,.015],crS(.2,-1,p.getZ(i))));G.maw.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  G.tooth=crSweep(crCurve([[0,0,0],[0,-.45,.2],[0,-.8,.32]],6),u=>.26*(1-u)+.02,{sides:crD(6,4),col:u=>crMix(L('e'),L('tip'),u)});
  return CR.geo[key]=G;}

function makeCentipede(S){
  const G=crCentiGeo(S),P=S.pal,g=new T.Group(),n=S.n;
  const chit=crMat(P+'-plate',{nmap:crNormalTex('chitin',512,crChitinH),ns:.28,rough:.3,coatR:.08,env:1});
  const headM=crMat(P+'-head',{nmap:crNormalTex('chitin',512,crChitinH),ns:.1,rough:.28,coatR:.06,env:.9});
  const claw=crMat(P+'-claw',{nmap:crNormalTex('chitin',512,crChitinH),ns:.15,rough:.26,coatR:.06,env:.55,rimK:.12});
  const legM=crMat(P+'-leg',{nmap:crNormalTex('chitin',512,crChitinH),ns:.14,rough:.62,coat:.18,coatR:.35,env:.25,rim:0x6a4a30,rimK:.14});
  const soft=crMat(P+'-soft',{nmap:crNormalTex('chitin',512,crChitinH),ns:.25,rough:.6,coat:.3,coatR:.35,rimK:.1,env:.5});
  const eyeM=crMat('eye',{rough:.04,coat:1,coatR:.02,env:2,rimK:.05});
  const IM=(geo,mat,count)=>{const m=new T.InstancedMesh(geo,mat,count);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;g.add(m);return m;};
  const C={S,g,n,terg:IM(G.terg,chit,n),stern:IM(G.stern,soft,n),core:IM(G.core,soft,n),coxa:IM(G.coxa,legM,2*n),fem:IM(G.fem,legM,2*n),tib:IM(G.tib,legM,2*n),tar:IM(G.tar,legM,2*n),ult:IM(G.ult,legM,6)};
  const H=S.head,head=new T.Group();head.matrixAutoUpdate=false;g.add(head);C.head=head;
  const hm=new T.Mesh(G.head,headM);hm.scale.set(H.w/2,H.h*.55,H.l/2);hm.castShadow=true;head.add(hm);
  
  for(const s of[1,-1])for(let k=0;k<3;k++){const t=new T.Mesh(G.tooth,claw);t.scale.setScalar(H.h*.2);t.position.set(s*H.w*(.1+k*.05),-H.h*.32,H.l*(.42-k*.03));t.rotation.z=s*.2;head.add(t);}
  G.mand=G.mand||crSweep(crCurve([[0,0,0],[.1,-.05,.35],[.06,-.08,.7],[-.12,-.06,.9]],crD(12,6)),u=>.13*(1-u)+.012,{sides:crD(8,5),col:u=>crMix(crLin(CR_PAL[P].m),crLin(CR_PAL[P].tip),u)});
  C.mand=[];for(const s of[1,-1]){const pv=new T.Group();pv.position.set(s*H.w*.1,-H.h*.38,H.l*.3);head.add(pv);const m=new T.Mesh(G.mand,claw);m.scale.set(s*H.w*.32,H.w*.32,H.w*.32);pv.add(m);C.mand.push({pv,s});}
  C.forc=[];for(const s of[1,-1]){const pv=new T.Group();pv.position.set(s*H.w*.3,-H.h*.3,H.l*.15);head.add(pv);
    const f=new T.Mesh(G.forc,claw);f.scale.set(s,1,1);f.castShadow=true;pv.add(f);C.forc.push({pv,s});
    for(let k=0;k<2;k++){const a=new T.Vector3(.14*S.forc,-.07*S.forc,(.45+k*.2)*S.forc),b=a.clone().add(new T.Vector3(-.02*S.forc,-(.3+k*.25)*S.forc,.05*S.forc));const d=new T.Mesh(crStrand(a,b,S.forc*.012,0),crGooMat());d.scale.set(s,1,1);pv.add(d);}}
  C.ant=[];for(const s of[1,-1]){const pv=new T.Group();pv.position.set(s*H.w*.36,H.h*.1,H.l*.42);head.add(pv);const a=new T.Mesh(G.ant,legM);a.castShadow=true;pv.add(a);C.ant.push({pv,s});}
  head.updateMatrixWorld(true);const ray=new T.Raycaster();
  for(const s of[1,-1])for(const[x,z,r]of[[.3,.3,.06],[.36,.24,.052],[.27,.22,.05],[.33,.15,.046]]){ray.set(new T.Vector3(s*H.w*x,H.h*3,H.l*z),new T.Vector3(0,-1,0));const h=ray.intersectObject(hm)[0];
    const e=new T.Mesh(G.eye,eyeM);e.scale.set(H.w*r*.62,H.w*r*.42,H.w*r*.62);e.position.set(s*H.w*x,h?h.point.y-H.w*r*.12:H.h*.3,H.l*z);head.add(e);}
  C.time=0;return C;}

// the spine for a pose: a smooth path from the head back (its points in the game's units: x, height, y), sampled so the
// segments sit their own length apart along it
function crSpine(S,ctrl){
  const c=new T.CatmullRomCurve3(ctrl.map(p=>new T.Vector3(p[0],p[1],p[2])),false,'centripetal'),N=1200,pts=c.getSpacedPoints(N),L=c.getLength();
  const at=d=>{const k=Math.min(N,Math.max(0,d/L*N)),i=Math.floor(k),f=k-i;return i>=N?pts[N].clone():pts[i].clone().lerp(pts[i+1],f);};
  const out=[at(0)],gap=S.head.l*.55+S.seg*.5;for(let i=1;i<=S.n;i++)out.push(at(gap+(i-1)*S.seg));
  if(gap+(S.n-1)*S.seg>L)console.warn('crSpine: path too short',L,gap+(S.n-1)*S.seg);
  return out;}

const _cm=new T.Matrix4(),_ca=new T.Vector3(),_cb=new T.Vector3(),_cc=new T.Vector3(),_cd=new T.Vector3(),_ce=new T.Vector3(),_cUp=new T.Vector3(0,1,0);
function crBasis(m,X,Y,Z,sx,sy,sz,p){return m.set(X.x*sx,Y.x*sy,Z.x*sz,p.x, X.y*sx,Y.y*sy,Z.y*sz,p.y, X.z*sx,Y.z*sy,Z.z*sz,p.z, 0,0,0,1);}
// a part from P to Q, round in section (radius r), its local +y turned toward up
function crSeg(m,P,Q,up,r){const X=_ca.subVectors(Q,P),len=X.length()||1e-4;X.divideScalar(len);const Y=_cb.copy(up).addScaledVector(X,-up.dot(X));
  if(Y.lengthSq()<1e-8)Y.set(0,1,0).addScaledVector(X,-X.y);Y.normalize();const Z=_cc.crossVectors(X,Y);return crBasis(m,X,Y,Z,len,r,r,P);}
// two bones from A toward F (lengths a, b), the knee bent toward the pole: the knee into out
function crIK(A,F,a,b,pole,out){const d=_cd.subVectors(F,A);let L=d.length();d.divideScalar(L||1);L=Math.min(Math.max(L,Math.abs(a-b)+1e-3),a+b-1e-3);
  const ca=(a*a+L*L-b*b)/(2*a*L),sa=Math.sqrt(Math.max(0,1-ca*ca)),pp=_ce.copy(pole).addScaledVector(d,-pole.dot(d));if(pp.lengthSq()<1e-8)pp.set(0,1,0);pp.normalize();
  return out.copy(A).addScaledVector(d,a*ca).addScaledVector(pp,a*sa);}

// pose a centipede: pts from crSpine (or crTrailSpine); t drives the legs' wave (time, or distance walked); o.walk 0..1,
// o.jaw 0..1 (the claws open), o.look (head pitch, + = down), o.antL/antR/antUp (antennae), o.flail (raised legs reaching),
// o.dead (legs curled), o.flip (on its back)
const CR_V=Array.from({length:14},()=>new T.Vector3()),CR_FR={},_chm=new T.Matrix4();
function crPoseCentiCore(S,n,pts,t,o,put){
  const fr=CR_FR[n]||(CR_FR[n]={F:Array.from({length:n+1},()=>new T.Vector3()),X:Array.from({length:n+1},()=>new T.Vector3()),Y:Array.from({length:n+1},()=>new T.Vector3())});
  const F=fr.F,X=fr.X,Y=fr.Y,walk=o.walk??0,v=CR_V,flip=o.flip?-1:1,dead=!!o.dead;
  for(let i=0;i<=n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n,i+1)],f=F[i].subVectors(a,b);if(f.lengthSq()<1e-8)f.set(0,0,1);f.normalize();
    const x=X[i].crossVectors(_cUp,f);if(x.lengthSq()<1e-6)x.set(1,0,0);x.normalize().multiplyScalar(flip);Y[i].crossVectors(f,x).normalize();}
  for(let i=1;i<=n;i++){const k=i-1,u=k/(n-1),w=S.w(u),p=pts[i],lt=X[i],up=Y[i],fw=F[i];
    crBasis(_cm,lt,up,fw,w*.52,S.h*.46,S.seg*.82,v[0].copy(p).addScaledVector(up,S.h*.14));put('terg',k,_cm);
    crBasis(_cm,lt,up,fw,w*.45,S.h*.5,S.seg*.74,p);put('core',k,_cm);
    crBasis(_cm,v[1].copy(lt).negate(),v[2].copy(up).negate(),fw,w*.41,S.h*.16,S.seg*.62,v[0].copy(p).addScaledVector(up,-S.h*.42));put('stern',k,_cm);
    const air=dead?1:crS(S.raise*.9,S.raise*1.7,p.y),rk=dead?.45:1;
    for(const s of[1,-1]){const j=k*2+(s>0?0:1),r=S.leg.r(u);
      const hip=v[3].copy(p).addScaledVector(lt,s*w*.4).addScaledVector(up,-S.h*.2);
      const out=v[4].copy(lt).multiplyScalar(s).addScaledVector(up,-.35).normalize(),t0=v[5].copy(hip).addScaledVector(out,S.leg.cx);
      crSeg(_cm,hip,t0,up,r*1.25);put('coxa',j,_cm);
      const ph=t*7-k*.62+(s>0?0:Math.PI),sw=Math.sin(ph)*walk,lift=Math.max(0,Math.cos(ph))*walk;
      const flat=v[6].set(lt.x,0,lt.z).normalize(),fl=v[7].set(fw.x,0,fw.z).normalize(),reach=S.spread(u)*rk;
      const g=v[8].set(p.x,0,p.z).addScaledVector(flat,s*(w*.5+reach)).addScaledVector(fl,S.stride*sw+(.5-u)*S.stride*.5);g.y=S.lift*lift;
      const wig=dead?0:Math.sin(t*5.3+k*1.7+(s>0?0:2))*(o.flail??.4);
      const a=v[9].copy(hip).addScaledVector(lt,s*reach*(.5+wig*.12)).addScaledVector(fw,reach*(.3+wig*.25)).addScaledVector(up,-reach*(.62-wig*.15));
      const tg=v[10].copy(g).lerp(a,air);
      const pole=v[11].copy(_cUp).multiplyScalar(.75).addScaledVector(flat,s*.7).lerp(v[12].copy(lt).multiplyScalar(s).addScaledVector(fw,-.55).addScaledVector(up,.25),air);
      const fe=S.leg.fe(u)*rk,tb=S.leg.ti(u)*rk,ta=S.leg.ta(u)*rk,kn=crIK(t0,tg,fe,tb+ta,pole,v[13]);
      const ft=v[12].subVectors(tg,kn).normalize().multiplyScalar(tb+ta).add(kn);
      const ak=v[1].copy(kn).lerp(ft,tb/(tb+ta)).addScaledVector(pole,(tb+ta)*.06);
      crSeg(_cm,t0,kn,pole,r);put('fem',j,_cm);
      crSeg(_cm,kn,ak,pole,r*.82);put('tib',j,_cm);
      crSeg(_cm,ak,ft,pole,r*.7);put('tar',j,_cm);}}
  // the last pair: long, thick, trailing like pincers
  {const p=pts[n],lt=X[n],up=Y[n],fw=F[n],w=S.w(1);
    for(const s of[1,-1]){let a=v[0].copy(p).addScaledVector(lt,s*w*.3).addScaledVector(fw,-S.seg*.4);
      const dirs=[[-1,.42,.18],[-1,.2,.05],[-1,.05,-.22]];
      S.ult.forEach((len,q)=>{const d=v[1].copy(fw).multiplyScalar(dirs[q][0]).addScaledVector(lt,s*dirs[q][1]).addScaledVector(up,dirs[q][2]+Math.sin(t*1.3+q+s)*.04).normalize();
        const b=v[2].copy(a).addScaledVector(d,len);crSeg(_cm,a,b,up,S.ultR*(1-q*.18));put('ult',(s>0?0:3)+q,_cm);a=v[0].copy(b);});}}
  // the head: on the spine's first point, pitched by o.look
  const f=v[0].copy(F[0]).applyAxisAngle(X[0],(o.look??0)*flip),y=v[1].crossVectors(f,X[0]).normalize();
  return crBasis(_chm,X[0],y,f,1,1,1,pts[0]);}
// the head's moving parts, in the order the pools keep them: the claws (left, right), the antennae, the mandibles
function crHeadRot(o,t){const jaw=o.jaw??.15,au=o.antUp??.25;
  return[[0,jaw*.75-.12,jaw*.1],[0,-(jaw*.75-.12),-jaw*.1],[-au+Math.sin(t*2.1)*.08,(o.antL??.55)+Math.sin(t*1.7)*.1,0],[-au+Math.sin(t*2.1+2)*.08,-(o.antR??.55)+Math.sin(t*1.7+1)*.1,0],[0,jaw*.5,0],[0,-jaw*.5,0]];}
function poseCentipede(C,pts,t,o={}){
  C.head.matrix.copy(crPoseCentiCore(C.S,C.n,pts,t,o,(k,i,m)=>C[k].setMatrixAt(i,m)));C.head.matrixWorldNeedsUpdate=true;
  for(const k of['terg','stern','core','coxa','fem','tib','tar','ult'])C[k].instanceMatrix.needsUpdate=true;
  const R=crHeadRot(o,t);C.forc.forEach(({pv},i)=>pv.rotation.set(...R[i]));C.ant.forEach(({pv},i)=>pv.rotation.set(...R[2+i]));(C.mand||[]).forEach(({pv},i)=>pv.rotation.set(...R[4+i]));}

/* ---------- her nest: the Headquarters overgrown ---------- */
const crGooMat=()=>crMat('goo',{nmap:crNormalTex('goo',512,crGooH),ns:.32,rough:.3,coat:1,coatR:.1,env:.7,rimK:.06,rim:0x8a7056});
const crSlimeMat=()=>crMat('slime',{nmap:crNormalTex('goo',512,crGooH),ns:.04,rough:.1,coat:1,coatR:.04,env:.9,rimK:0,fill:0});
const crEggMat=()=>crMat('egg',{nmap:crNormalTex('chitin',512,crChitinH),ns:.12,rough:.45,coat:.8,coatR:.15,env:.5,rimK:.35,rim:0xc8a070,emis:0x050302,fill:.02});
// a sheet of resin down a wall: w along it (x), up to h high (y), standing off it (z, out into the room); ropes run down it,
// it bulges, its top edge is ragged and its foot pools out over the floor
function crDrape(w,h,seed){
  // a continuous coat: its top edge rises and falls along the wall (in places to the top), thick ropes run down it, lumps
  // swell out of it, it thins toward its top edge and its foot spreads out over the floor
  const nx=Math.max(10,Math.round(w/2.2)),ny=Math.max(10,Math.round(h/1.8)),P=[],C=[],UV=[],I=[];
  for(let j=0;j<=ny;j++)for(let i=0;i<=nx;i++){const u=i/nx,v=j/ny,x=u*w,edge=crS(0,.06,u)*crS(1,.94,u);
    const tf=crF(x*.018,seed,1.3,3),top=h*Math.min(1,.3+1.1*Math.pow(tf,1.3))*(.5+.5*edge),y0=v*top;
    const rope=Math.pow(Math.abs(Math.sin(x*.22+crF(x*.03,y0*.04,seed,2)*5)),2.2),rope2=Math.pow(Math.abs(Math.sin(x*.5+crF(x*.05,y0*.02,seed+2,2)*7)),3)*.6;
    const lump=Math.pow(crS(.45,.85,crF(x*.06,y0*.06,seed+3,3)),1.5);
    let z=(.4+rope*1.4+rope2*.5+lump*4.2)*(crS(top,top*.55,y0)*.95+.05),y=y0;
    if(y0<8){const k=(8-y0)/8;z+=k*k*(5+9*crF(x*.05,seed,9,2));y=y0*(1-k*.8);}
    P.push(x,y,z);UV.push(x/20,y0/20);
    const dark=crMix(crLin('#0a0706'),crLin('#2b1d13'),Math.min(1,rope*.5+lump*.7+rope2*.3));
    C.push(...crMix(dark,crLin('#4b3420'),crS(.66,.92,crF(x*.09,y0*.09,seed+7,2))*.55));}
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const a=j*(nx+1)+i,b=a+nx+1;I.push(a,a+1,b,b,a+1,b+1);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(UV,2));
  g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();return g;}
function crCreep(cx,cz,rx,rz,rot,seed,H=1.6,step=3){
  const P=[],C=[],UV=[],I=[],nx=Math.ceil(rx*2/step)+1,nz=Math.ceil(rz*2/step)+1,ca=Math.cos(rot),sa=Math.sin(rot),inn=[];
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const lx=-rx+i*step,lz=-rz+j*step,a=Math.atan2(lz/rz,lx/rx),rho=Math.hypot(lx/rx,lz/rz),b=.72+.28*crF(Math.cos(a)*1.4+seed,Math.sin(a)*1.4,seed,3);
    const k=crS(b,b*.62,rho),wx=cx+lx*ca-lz*sa,wz=cz+lx*sa+lz*ca,rid=Math.pow(Math.abs(Math.sin((wx*.045+crF(wx*.015,wz*.015,seed,2)*5))*Math.sin(wz*.04+crF(wz*.02,wx*.015,seed+1,2)*4)),1.5);
    const h=k*H*(.35+.65*crF(wx*.03,wz*.03,seed+2,3))+k*rid*H*.35-(1-k)*1.2;inn.push(rho<b*1.12);
    P.push(wx,h+.1,wz);UV.push(wx/30,wz/30);C.push(...crMix(crMix(crLin('#070504'),crLin('#21170f'),rid*.6),crLin('#3a2818'),crS(.68,.9,crF(wx*.08,wz*.08,seed+5,2))*.5*k));}
  for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;if(inn[a]||inn[b]||inn[c]||inn[d])I.push(a,c,b,b,c,d);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(UV,2));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();return g;}
// a blob of slime on the floor: a ragged round outline
function crBlob(R,seed,k=.35){const sh=new T.Shape(),N=40;for(let i=0;i<=N;i++){const a=i/N*Math.PI*2,r=R*(1-k*.5+k*crF(Math.cos(a)*1.6+seed,Math.sin(a)*1.6,seed,3));const x=Math.cos(a)*r,y=Math.sin(a)*r;i?sh.lineTo(x,y):sh.moveTo(x,y);}
  const g=new T.ShapeGeometry(sh,2);const p=g.attributes.position,C=[];for(let i=0;i<p.count;i++){const d=Math.hypot(p.getX(i),p.getY(i))/R;C.push(...crMix(crLin('#17100b'),crLin('#070504'),crS(.2,.9,1-d)));}
  g.setAttribute('color',new T.Float32BufferAttribute(C,3));const uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/48,uv.getY(i)/48);g.rotateX(-Math.PI/2);return g;}
// a vein of resin over the floor: a wandering ridge from (x0,y0) toward (x1,y1)
function crVein(x0,y0,x1,y1,r0,seed){const pts=[],n=Math.max(6,Math.round(Math.hypot(x1-x0,y1-y0)/7));
  for(let i=0;i<=n;i++){const u=i/n,dx=x1-x0,dy=y1-y0,l=Math.hypot(dx,dy)||1,wob=(crF(u*3,seed,2,2)-.5)*l*.35*Math.sin(u*Math.PI);
    pts.push(new T.Vector3(x0+dx*u-dy/l*wob,0,y0+dy*u+dx/l*wob));}
  const rr=u=>(r0*(1-.7*u)+.3)*(.75+.5*crF(u*9,seed,4,2));pts.forEach((p,i)=>{p.y=-rr(i/n)*.45;});
  return crSweep(pts,rr,{sides:8,col:u=>crMix(crLin('#1a120c'),crLin('#080605'),u*.7)});}
// a strand of goo hanging between two points (it sags)
function crStrand(a,b,r,sag){const pts=[];for(let i=0;i<=12;i++){const u=i/12;pts.push(new T.Vector3().lerpVectors(a,b,u).add(new T.Vector3(0,-sag*4*u*(1-u),0)));}
  return crSweep(pts,u=>r*(.55+.45*Math.pow(Math.abs(u-.5)*2,2)),{sides:5,col:()=>crLin('#1c130c'),cap0:false,cap1:false});}
// the eggs: a clutch heaped in a low mound (pale, glossy, a faint warmth in them)
function crClutch(cx,cz,R,n,size,seed,out){const r=rng(seed);for(let i=0;i<n;i++){const a=r()*Math.PI*2,d=Math.sqrt(r())*R,h=Math.max(0,(1-d/R))*R*.22+r()*size*.4;
  out.push({x:cx+Math.cos(a)*d,y:h+size*.7,z:cz+Math.sin(a)*d,s:size*(.75+r()*.45),rx:r()*3,ry:r()*3});}}

const hqInside=(x,y)=>(x>HQ_HALL.x0&&x<HQ_HALL.x1&&y>HQ_HALL.y0&&y<HQ_HALL.y1)||HQ_ROOMS.some(q=>x>q.x0&&x<q.x1&&y>q.y0&&y<q.y1)||(x>400&&x<600&&y>790&&y<930);
// overgrow the Headquarters (its scene sc and objects objs): resin down the walls of the hall and the rooms, veins over the
// floor toward the lair, slime, strands, her clutch in the lair and smaller ones in the rooms
function hqNest(sc,objs){
  const goo=crGooMat(),grp=new T.Group();sc.add(grp);const r=rng(9157),gooG=[],creepG=[];
  const bake=(g,m)=>{m.updateMatrix();g.applyMatrix4(m.matrix);return g;};   // (a piece placed by a stand-in mesh, then merged)
  const inside=hqInside;
  const nestK=(x,y)=>y<790?1:.35;   // the entry hall: less
  let seed=1;
  for(const o of objs){if(o.kind!=='wall')continue;const hz=o.w>=o.h,len=hz?o.w:o.h;
    for(const side of[-1,1]){const nx=hz?0:side,ny=hz?side:0,fx=nx>0?o.x+o.w:nx<0?o.x:0,fy=ny>0?o.y+o.h:ny<0?o.y:0;
      const mx=hz?o.x+o.w/2:fx+nx*3,my=hz?fy+ny*3:o.y+o.h/2;if(!inside(mx,my))continue;
      for(let at=0;at<len;){const w=len,gap=0;
        if(r()<.88*nestK(mx,my)){const g=crDrape(w,14+r()*10,seed++*7.31),m=new T.Object3D();
          m.rotation.y=Math.atan2(nx,ny);   // (the sheet's x runs along the wall, its z out of the face)
          if(ny>0)m.position.set(o.x+at,0,fy+.2);else if(ny<0)m.position.set(o.x+at+w,0,fy-.2);
          else if(nx>0)m.position.set(fx+.2,0,o.y+at+w);else m.position.set(fx-.2,0,o.y+at);
          gooG.push(bake(g,m));}
        at+=w+gap;}}}
  const L={x:500,y:210};   // the lair
  // creep: the lair's floor sheeted over, a skirt along the hall's walls, the rooms' nests, smears out of the doorways
  const cm=crMat('creep',{nmap:crNormalTex('goo',512,crGooH),ns:.22,rough:.3,coat:1,coatR:.12,env:.7,rimK:.04,rim:0x8a7056});
  const creep=(cx,cz,rx,rz,rot,sd,H)=>creepG.push(crCreep(cx,cz,rx,rz,rot,sd,H));
  creep(L.x,L.y+10,150,110,0,1.1,2.4);creep(L.x-40,L.y+120,90,60,.3,2.2,1.8);creep(L.x+60,L.y+110,80,55,-.4,3.3,1.6);
  for(const q of HQ_ROOMS){creep((q.x0+q.x1)/2+q.side*30,(q.y0+q.y1)/2-10,75,60,r(),q.x0*.01+q.y0,1.8);creep(q.door.x-q.side*30,q.door.y,40,16,q.side*.15,q.y0*.07,1.1);}
  // strands: from the resin on the walls down to the floor, and across the rooms' doorways
  for(const q of HQ_ROOMS){const dx=q.door.x,dy=q.door.y;for(let i=0;i<5;i++){const a=new T.Vector3(dx,8+r()*14,dy-22+r()*6),b=new T.Vector3(dx,6+r()*14,dy+16+r()*6);
    gooG.push(crStrand(a,b,.22+r()*.3,3+r()*6));}}
  {const m=new T.Mesh(crMerge(gooG),goo);m.receiveShadow=true;grp.add(m);const c=new T.Mesh(crMerge(creepG),cm);c.receiveShadow=true;grp.add(c);}
  // the clutches
  const eggs=[],clutches=[],cl=(x,z,R,n,sz,sd)=>{const a=eggs.length;crClutch(x,z,R,n,sz,sd,eggs);clutches.push({x,z,R,a,b:eggs.length});};
  cl(L.x,L.y-10,44,230,2.6,77);cl(L.x-95,L.y+58,20,44,2.3,78);cl(L.x+98,L.y+52,19,40,2.3,79);   // (0: her clutch, 1 and 2 beside it, 3-8 the rooms' in HQ_ROOMS order)
  for(const q of HQ_ROOMS)cl((q.x0+q.x1)/2+q.side*40,(q.y0+q.y1)/2-30,16,26,1.8,q.x0+q.y0);
  const eg=new T.SphereGeometry(1,8,6);{const p=eg.attributes.position,C=[];for(let i=0;i<p.count;i++){const y=p.getY(i);C.push(...crMix(crLin('#4e473d'),crLin('#a39a86'),crS(-.9,.8,y)));}eg.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  const E=new T.InstancedMesh(eg,crEggMat(),eggs.length),m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler();E.receiveShadow=true;E.frustumCulled=false;
  const white=new T.Color(1,1,1);eggs.forEach((e,i)=>{q4.setFromEuler(e4.set(e.rx,e.ry,0));m4.compose(new T.Vector3(e.x,e.y,e.z),q4,new T.Vector3(e.s,e.s*1.22,e.s));E.setMatrixAt(i,m4);E.setColorAt(i,white);});grp.add(E);   // (a colour each, so one can split open: crEggBurst)
  grp.userData.eggs={list:eggs,mesh:E,clutches};
  grp.userData.rocks=hqRocks(sc,objs);   // (with the nest, so the clean-up can take them away: base.js)
  return grp;}
// the floor under the nest (fortress.js's ground canvas, its own transform): old concrete gone dark with her secretions,
// drag marks out of the rooms, the lair black and veined
function paintNestGround(g){
  const W=HQB.x1-HQB.x0,H=HQB.y1-HQB.y0,S=1.2,r=rng(4242);g.setTransform(S,0,0,S,-HQB.x0*S,-HQB.y0*S);
  g.fillStyle='#100e0d';g.fillRect(HQB.x0,HQB.y0,W,H);
  g.fillStyle='#2b2724';g.fillRect(340,140,320,640);
  for(const q of HQ_ROOMS){g.fillStyle='#231f1c';g.fillRect(q.x0,q.y0,q.x1-q.x0,q.y1-q.y0);}
  g.fillStyle='#2e2a27';g.fillRect(400,790,200,140);
  g.strokeStyle='rgba(0,0,0,.4)';g.lineWidth=1;for(let x=340;x<=660;x+=40){g.beginPath();g.moveTo(x,140);g.lineTo(x,780);g.stroke();}for(let y=140;y<=780;y+=40){g.beginPath();g.moveTo(340,y);g.lineTo(660,y);g.stroke();}
  for(let i=0;i<6000;i++){const x=HQB.x0+r()*W,y=HQB.y0+r()*H,v=r();g.fillStyle=v<.55?'rgba(0,0,0,.2)':'rgba(255,240,220,.03)';g.fillRect(x,y,1+r()*2,1+r()*2);}
  const blot=(x,y,rx,ry,a,col)=>{g.save();g.translate(x,y);g.rotate(r()*3);g.scale(1,ry/rx);const gr=g.createRadialGradient(0,0,0,0,0,rx);gr.addColorStop(0,`rgba(${col},${a})`);gr.addColorStop(.6,`rgba(${col},${a*.6})`);gr.addColorStop(1,`rgba(${col},0)`);g.fillStyle=gr;g.beginPath();g.arc(0,0,rx,0,7);g.fill();g.restore();};
  // the rooms: soaked dark, the nests' middles black
  for(const q of HQ_ROOMS){const cx=(q.x0+q.x1)/2,cy=(q.y0+q.y1)/2;for(let k=0;k<9;k++)blot(cx+(r()-.5)*150,cy+(r()-.5)*150,40+r()*50,26+r()*30,.7,'14,10,7');blot(cx+q.side*30,cy-20,60,45,.9,'7,5,4');}
  // drag marks: out of each doorway, toward the lair (several streaks side by side, broken)
  for(const q of HQ_ROOMS)for(let k=0;k<4;k++){g.strokeStyle=`rgba(16,11,7,${(.35+r()*.3).toFixed(2)})`;g.lineWidth=3+r()*7;
    g.beginPath();g.moveTo(q.door.x+(r()-.5)*10,q.door.y+(r()-.5)*30);g.bezierCurveTo(q.door.x-q.side*80,q.door.y+(r()-.5)*40,500+(r()-.5)*100,q.door.y-70,500+(r()-.5)*60,240+(r()-.5)*30);g.stroke();}
  g.setLineDash([]);
  // the hall: stains thicken toward the lair; the lair itself black, veined
  for(let i=0;i<60;i++){const y=150+Math.pow(r(),1.6)*600;blot(345+r()*310,y,14+r()*40,8+r()*24,.35+.4*(1-(y-150)/620),'15,11,8');}
  blot(500,215,170,120,.95,'6,4,3');blot(500,250,240,180,.6,'10,7,5');
  for(let i=0;i<120;i++){let x=500+(r()-.5)*40,y=220+(r()-.5)*30;const a=r()*Math.PI*2,L=60+r()*180;g.strokeStyle=`rgba(${8+r()*12|0},${6+r()*8|0},${4+r()*5|0},${(.3+r()*.5).toFixed(2)})`;g.lineWidth=.6+r()*2.4;
    g.beginPath();g.moveTo(x,y);for(let s=0;s<10;s++){x+=Math.cos(a+(r()-.5)*.9)*L/10;y+=Math.sin(a+(r()-.5)*.9)*L/10;g.lineTo(x,y);}g.stroke();}
  // the entry hall: only a little has reached it
  for(let i=0;i<8;i++)blot(420+r()*160,795+r()*60,10+r()*20,6+r()*12,.4,'15,11,8');
}

/* ---------- option B for the brood: the hunter (an original design: an arched, plated back on four long legs, a pair of
   folded scythe arms under the chest, a low wedge of a head with six small eyes and hooked side jaws, a forked tail) ---------- */
// where the hunter's moving parts sit (makeStalker builds it to these; crHunterRig makes bare rigs to them for the game)
const HUNTER_RIG={neck:[0,12.4,8.6],head:[0,-1.5,3],jaw:[2,-.6,7],sh:[2.6,12.2,5.6],el:[0,3,9.6],tail:[0,10.5,-9]};
const HUNTER_LEGS={hips:[[3.4,13,2.8],[-3.4,13,2.8],[3,9,-6.5],[-3,9,-6.5]],len:[[9,9.5,4.5],[9,9.5,4.5],[8,8.5,4.5],[8,8.5,4.5]],feet:[[14,0,10],[-14,0,10],[12.5,0,-12],[-12.5,0,-12]]};
function makeStalker(){
  const P=CR_PAL.hunter,L=k=>crLin(P[k]),root=new T.Group(),g=new T.Group(),body=new T.Group(),legs=new T.Group();root.add(g,legs);g.add(body);
  const chit=crMat('st-plate',{nmap:crNormalTex('chitin',512,crChitinH),ns:.22,rough:.32,coatR:.08,env:.75});
  const legM=crMat('st-leg',{nmap:crNormalTex('chitin',512,crChitinH),ns:.14,rough:.7,coat:.12,coatR:.4,env:.15,rim:0x5a3a2a,rimK:.1});
  const soft=crMat('st-soft',{nmap:crNormalTex('chitin',512,crChitinH),ns:.3,rough:.7,coat:.15,coatR:.4,rimK:.08,env:.25});
  const eyeM=crMat('eye',{rough:.04,coat:1,coatR:.02,env:2,rimK:.05});
  const add=(geo,mat,par=body)=>{const m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;par.add(m);return m;};
  // the spine of the back: hips (z -7) up to the shoulders (z +5), down to the neck
  const spine=crCurve([[0,9,-8],[0,12.5,-4],[0,15.5,1],[0,15.2,5],[0,12.6,8.5]],crD(24,10));
  add(crSweep(spine,u=>(1.5+1.3*Math.sin(Math.PI*Math.min(1,u*1.15)))*(u<.12?.8:1),{sides:crD(14,6),col:u=>crMix(L('under2'),L('under'),.3)}),soft);   // the body under the plates
  const plateG=crPlate({sq:3.6,dome:.55,keel:.1,rim:.28,front:.7,col:(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.4,.85,r)),L('e'),Math.min(1,crS(.85,1,r)*.6+crS(.6,.95,-z)*.7)):L('under2')});
  const spikeG=crSweep(crCurve([[0,0,0],[0,.5,-.4],[0,.8,-1.1]],crD(6,4)),u=>.32*(1-u)+.02,{sides:crD(6,4),col:u=>crMix(L('m'),L('tip'),u)});
  const tg=new T.Vector3();for(let i=0;i<7;i++){const u=.06+i*.14,c=new T.CatmullRomCurve3(spine);const p=c.getPoint(u),t=c.getTangent(u);
    const pl=new T.Group();pl.position.copy(p);pl.lookAt(tg.copy(p).add(t));pl.rotateX(-.08);body.add(pl);   // (lookAt aims +z along the back)
    const w=6.8+2.4*Math.sin(Math.PI*Math.min(1,u*1.1)),m=add(plateG,chit,pl);m.scale.set(w/2,2.3,2.9);m.position.y=.9+Math.sin(Math.PI*u)*.5;
    for(const s of[-1,0,1]){const sp=add(spikeG,chit,pl);sp.scale.setScalar((s?1.5:2.4)*(.7+.5*Math.sin(Math.PI*u)));sp.position.set(s*w*.28,3+(s?0:.4),-2.1);sp.rotation.z=s*.45;}}
  // the head: a low wedge, six eyes in two rows, hooked side jaws, the mouth between them
  const neck=new T.Group();neck.position.set(...HUNTER_RIG.neck);body.add(neck);
  add(crSweep(crCurve([[0,0,-1],[0,-.6,1.2],[0,-1.4,2.8]],crD(8,5)),u=>2.2-u*.5,{sides:crD(12,6),col:()=>L('under2')}),soft,neck);
  const head=new T.Group();head.position.set(...HUNTER_RIG.head);neck.add(head);
  const hm=add(crPlate({sq:2.3,dome:.62,keel:.12,rim:0,front:.98,under:.55,seg:[crD(44,12),crD(22,8)],col:(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.5,1,r)*.4),L('e'),crS(.92,1,r)*.25):L('under2')}),chit,head);
  hm.scale.set(3.4,2.15,5.9);hm.position.z=3.8;
  for(let k=0;k<5;k++){const sp=add(spikeG,chit,head);sp.scale.setScalar(1.3+(2-Math.abs(k-2))*.45);sp.position.set((k-2)*1.15,2.6-Math.abs(k-2)*.3,1.2-Math.abs(k-2)*.4);sp.rotation.set(-.35,0,(k-2)*.28);}   // a crest
  {const mo=add(new T.SphereGeometry(1,crD(16,6),crD(10,5)),crMat('st-mouth',{rough:.25,coat:1,coatR:.08,env:.6,rimK:.02}),head);const C=[];for(let i=0;i<mo.geometry.attributes.position.count;i++)C.push(...crLin('#1c0504'));mo.geometry.setAttribute('color',new T.Float32BufferAttribute(C,3));mo.scale.set(1.25,.55,.7);mo.position.set(0,-1.15,8.1);}   // the mouth, dark red, recessed under the jaws
  for(const s of[1,-1])for(const[x,y,z,r]of[[.6,1.7,7.2,.5],[1.35,1.45,6.8,.44],[2.0,1.05,6.0,.36],[.7,2.05,6.2,.36],[1.45,1.8,5.8,.32],[2.05,1.4,5.1,.27]]){const e=add(new T.SphereGeometry(1,crD(14,6),crD(10,5)),eyeM,head);e.geometry.setAttribute('color',new T.Float32BufferAttribute(new Array(e.geometry.attributes.position.count*3).fill(.004),3));e.scale.setScalar(r);e.position.set(s*x,y,z);}
  const jawG=crSweep(crCurve([[0,0,0],[.6,-.2,1.6],[.5,-.3,3.4],[-.4,-.2,4.7],[-1.3,-.1,4.9]],crD(16,8)),u=>.7*Math.pow(1-u,1.1)+.05,{sides:crD(10,5),col:u=>crMix(L('m'),L('tip'),crS(.3,.8,u))});
  const toothG=crSweep(crCurve([[0,0,0],[-.25,.05,.15],[-.6,.08,.2]],5),u=>.22*(1-u)+.02,{sides:crD(5,3),col:()=>crLin('#2a1a10'),cap0:false});
  const jaws=[];for(const s of[1,-1]){const pv=new T.Group();pv.position.set(s*HUNTER_RIG.jaw[0],HUNTER_RIG.jaw[1],HUNTER_RIG.jaw[2]);head.add(pv);const j=add(jawG,chit,pv);j.scale.set(s*1.35,1.35,1.35);
    for(let k=0;k<4;k++){const t=add(toothG,chit,pv);t.scale.set(s*2.2,2.2,2.2);t.position.set(s*(.75-k*.1),-.25,1.6+k*1.15);}jaws.push({pv,s});}
  add(new T.SphereGeometry(1,crD(14,6),crD(10,5)),soft,head).scale.set(1.2,.8,.9);head.children[head.children.length-1].position.set(0,-.9,7.3);
  // the scythe arms: folded under the chest, spined along the inside of the blade
  const armF=crSweep(crCurve([[0,0,0],[0,2,3],[0,3.2,6.6],[0,3,9.6]],crD(12,6)),u=>1.05-.35*u,{sides:crD(10,5),col:u=>crMix(L('leg0'),L('m'),u)});
  const bladeG=crMerge([crSweep(crCurve([[0,0,0],[0,-1.8,-2.2],[0,-3,-5.4],[0,-3.2,-8],[0,-2.2,-9.4]],crD(14,7)),u=>.75*Math.pow(1-u,.8)+.05,{sides:crD(9,5),col:u=>crMix(L('m'),L('tip'),crS(.4,1,u))}),
    ...[.25,.42,.58,.74].map(u=>crSweep(crCurve([[0,-1.4*u-.2,-u*6],[0,-.2-1.4*u,-u*6+.8],[0,1.1-1.4*u,-u*6+1.3]],5),q=>.2*(1-q)+.02,{sides:crD(5,3),col:()=>L('tip'),cap0:false}))]);
  const arms=[];for(const s of[1,-1]){const sh=new T.Group();sh.position.set(s*HUNTER_RIG.sh[0],HUNTER_RIG.sh[1],HUNTER_RIG.sh[2]);body.add(sh);add(armF,legM,sh);const el=new T.Group();el.position.set(...HUNTER_RIG.el);sh.add(el);add(bladeG,chit,el);arms.push({sh,el,s});}
  // the tail: plated, tapering, forked at the tip
  const tail=new T.Group();tail.position.set(...HUNTER_RIG.tail);body.add(tail);
  const tc=crCurve([[0,0,0],[0,-.8,-4],[0,-1,-8],[0,0,-12],[0,1.6,-15.5]],crD(22,10));add(crSweep(tc,u=>1.9*(1-u*.78),{sides:crD(12,6),col:u=>crMix(L('under2'),L('m'),u*.6)}),soft,tail);
  for(let i=0;i<5;i++){const u=.08+i*.18,c=new T.CatmullRomCurve3(tc),p=c.getPoint(u),t=c.getTangent(u),pl=new T.Group();pl.position.copy(p);pl.lookAt(tg.copy(p).add(t));tail.add(pl);const m=add(plateG,chit,pl);const w=3.6*(1-u*.7);m.scale.set(w,1.2*(1-u*.5),1.9*(1-u*.4));m.position.y=1.2*(1-u*.6);}
  const forkG=crSweep(crCurve([[0,0,0],[.6,.4,-1.6],[1.6,1,-2.8],[2.6,1.2,-3.2]],crD(10,6)),u=>.42*(1-u)+.03,{sides:crD(7,4),col:u=>crMix(L('m'),L('tip'),u)});
  for(const s of[1,-1]){const f=add(forkG,chit,tail);f.position.copy(tc[tc.length-1]);f.scale.set(s*.55,.9,.9);}
  // the legs: two pairs (mid and hind), long and high-kneed, drawn in world space each pose
  const IM=(geo,mat)=>{const m=new T.InstancedMesh(geo,mat,4);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;legs.add(m);return m;};
  const G=crCentiGeo(Object.assign({},BROOD,{pal:'hunter'}));
  const S={root,g,body,neck,head,jaws,arms,tail,coxa:IM(G.coxa,legM),fem:IM(G.fem,legM),tib:IM(G.tib,legM),tar:IM(G.tar,legM),
    ...HUNTER_LEGS};
  return S;}
// x,z on the floor, a heading (radians; 0 = facing +z), t drives the legs (time, or distance walked); o.crouch (front down,
// arms cocked), o.lunge (stretched out, arms reaching), o.threat (the scythes raised), o.jaw (0..1), o.walk (0..1), o.dead
// (on its side, legs folded). R is a model (makeStalker) or a bare rig (crHunterRig); putLeg(i,part,matrix) draws the legs.
function crPoseHunterCore(R,x,z,head,t,o,putLeg){
  const dead=!!o.dead,cr=dead?1:o.crouch??0,lu=dead?0:o.lunge??0,walk=dead?0:o.walk??0;
  R.g.position.set(x,dead?-6.5:0,z);R.g.rotation.set(0,head,dead?.3:0);   // (dead: flat on its belly, a little over on one side)
  R.body.position.set(0,-cr*3.2+lu*1.2,lu*2);R.body.rotation.set(cr*.18-lu*.12,0,dead?0:Math.sin(t*1.3)*.02);
  R.neck.rotation.set(cr*.25-lu*.25+(o.look??0),dead?.3:Math.sin(t*.9)*.12*(1-cr),0);
  R.jaws.forEach(({pv,s})=>pv.rotation.set(0,s*((o.jaw??.2)*.7-.1),0));
  const th=dead?0:o.threat??0;R.arms.forEach(({sh,el,s})=>{sh.rotation.set(dead?.6:-.15+cr*.4-lu*1.4-th*.9,s*(.12+lu*.25+th*.45),s*(.12+th*.3));el.rotation.set(dead?-.4:.1-cr*.3+lu*2.0+th*.9,0,0);});
  R.tail.rotation.set(-.1+cr*.25+(dead?0:Math.sin(t*1.7)*.05),dead?.4:Math.sin(t*1.1)*.25,0);
  R.g.updateMatrixWorld(true);
  const mw=R.body.matrixWorld,gm=R.g.matrixWorld,v=CR_V,up=_cUp;
  HUNTER_LEGS.hips.forEach((h,i)=>{const s=h[0]>0?1:-1,hip=v[0].set(...h).applyMatrix4(mw),out=v[1].set(s,-.4,0).transformDirection(gm),t0=v[2].copy(hip).addScaledVector(out,1.4);
    const ph=t*6+i*Math.PI*.5+(i>1?Math.PI:0),sw=Math.sin(ph)*walk,lf=Math.max(0,Math.cos(ph))*walk;
    const f=HUNTER_LEGS.feet[i],ft=dead?v[3].set(f[0]*1.25,0,f[2]*1.1).applyMatrix4(gm):v[3].set(f[0],0,f[2]+sw*4+lu*(i<2?3:-2)).applyMatrix4(gm);ft.y=dead?.5:lf*2;   // (dead: splayed out)
    const pole=v[4].copy(up).multiplyScalar(.6).addScaledVector(out,.9).normalize(),[a,b,c]=HUNTER_LEGS.len[i],kn=crIK(t0,ft,a,b+c,pole,v[5]);
    const fo=v[6].subVectors(ft,kn).normalize().multiplyScalar(b+c).add(kn),ak=v[7].copy(kn).lerp(fo,b/(b+c)).addScaledVector(pole,(b+c)*.07);
    crSeg(_cm,hip,t0,pole,1.15);putLeg(i,'coxa',_cm);crSeg(_cm,t0,kn,pole,.9);putLeg(i,'fem',_cm);crSeg(_cm,kn,ak,pole,.72);putLeg(i,'tib',_cm);crSeg(_cm,ak,fo,pole,.6);putLeg(i,'tar',_cm);});}
function poseStalker(S,x,z,head,t,o={}){crPoseHunterCore(S,x,z,head,t,o,(i,k,m)=>S[k].setMatrixAt(i,m));for(const k of['coxa','fem','tib','tar'])S[k].instanceMatrix.needsUpdate=true;}

/* ---------- slime rocks (Bryan: "hard purple, black, red, brown slime rocks growing up furniture and walls, extending to the
   ground"): her secretions gone hard, glossy lumps crusted up the old fittings and the walls' feet and out over the floor,
   a broken rim of them round each clutch ---------- */
const CR_ROCK=[['#0b090a','#2b2427'],['#170c22','#33204a'],['#220606','#561410'],['#1c120b','#523620']];   // black, deep purple, dark red, brown (no pink)
function crRockGeo(seed){
  const g=new T.SphereGeometry(1,7,5),p=g.attributes.position,C=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const n1=crF(x*1.3+seed,y*1.3,z*1.3+seed*.7,3),rid=1-Math.abs(2*crF(x*2.4+seed*1.9,y*2.4,z*2.4,2)-1);
    const r=.7+.42*n1+.38*Math.pow(rid,3);let yy=y*r;if(yy<-.25)yy=-.25+(yy+.25)*.25;   // a flattish base where it sits
    p.setXYZ(i,x*r,yy,z*r);const k=crS(.75,1.25,r);C.push(.42+.58*k,.42+.58*k,.42+.58*k);}   // (crevices darker; the colour comes from each lump)
  g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeVertexNormals();return g;}
function crCrust(sdf,x0,z0,x1,z1,reach,H,seed,step=3.2){
  const nx=Math.ceil((x1-x0)/step)+1,nz=Math.ceil((z1-z0)/step)+1,P=[],C=[],UV=[],I=[],cols=CR_ROCK.map(([a,b])=>[crLin(a),crLin(b)]);
  for(let j=0;j<nz;j++)for(let i=0;i<nx;i++){const x=x0+i*step,z=z0+j*step,d=sdf(x,z),R=reach*(.5+.7*crF(x*.035,z*.035,seed,3)),k=1-d/R;
    const rid=1-Math.abs(2*crF(x*.16,z*.16,seed+3,2)-1),h=k>0?H*Math.pow(k,1.3)*(.55+.55*crF(x*.07,z*.07,seed+1,3))+k*rid*rid*2.2:-1.2+k*.5;
    P.push(x,h,z);UV.push(x/26,z/26);
    const f=crF(x*.022,z*.022,seed+9,2),fi=f<.42?0:f<.52?1:f<.6?2:f<.7?3:0,c=crMix(cols[fi][0],cols[fi][1],rid*.6);C.push(...crMix(c,cols[0][0],(1-rid)*.35));}
  for(let j=0;j<nz-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,c=a+nx,d=c+1;if(P[a*3+1]>-1.1||P[b*3+1]>-1.1||P[c*3+1]>-1.1||P[d*3+1]>-1.1)I.push(a,c,b,b,c,d);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('uv',new T.Float32BufferAttribute(UV,2));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();return g;}
function hqRocks(sc,objs){
  const mat=crMat('rock',{nmap:crNormalTex('chitin',512,crChitinH),ns:.2,rough:.38,coat:.85,coatR:.2,env:.7,rimK:.06,rim:0x5a5068});
  const V=[crRockGeo(1.3),crRockGeo(4.7),crRockGeo(8.1)],L=[[],[],[]],r=rng(6061),grpC=new T.Group();sc.add(grpC);
  const fam=()=>{const k=r();return k<.34?0:k<.6?1:k<.8?2:3;};
  const lump=(x,y,z,s,sy=1,nx=0,nz=0)=>L[(r()*3)|0].push({x,y,z,s,sy,sz:nx||nz?.55+r()*.2:1,f:fam(),ry:nx||nz?Math.atan2(nx,nz)+(r()-.5)*.6:r()*7,rx:(r()-.5)*.5});
  // up a fitting: a crust round its foot, a heap of lumps on it, and a few streams of lumps climbing its sides
  const cmat=crMat('crust',{nmap:crNormalTex('chitin',512,crChitinH),ns:.16,rough:.46,coat:.7,coatR:.3,env:.55,rimK:.04,rim:0x5a5068});
  const crustG=[],crust=g=>crustG.push(g);
  const grow=o=>{const H=objHeight(o),round=o.kind==='ctank'||o.kind==='barrel',cx=o.x+o.w/2,cz=o.y+o.h/2,rw=o.w/2,per=round?Math.PI*2*rw:2*(o.w+o.h),big=Math.min(1.3,.6+per/160);
    const reach=10+10*big,sdf=round?(x,z)=>Math.max(0,Math.hypot(x-cx,z-cz)-rw):(x,z)=>Math.hypot(Math.max(o.x-x,0,x-o.x-o.w),Math.max(o.y-z,0,z-o.y-o.h));
    crust(crCrust(sdf,o.x-reach*1.3,o.y-reach*1.3,o.x+o.w+reach*1.3,o.y+o.h+reach*1.3,reach,3.2+2.6*big,o.x*.013+o.y*.007));
    const at=t=>{if(round){const a=t*Math.PI*2;return[cx+Math.cos(a)*rw,cz+Math.sin(a)*rw,Math.cos(a),Math.sin(a)];}
      let d=((t%1)+1)%1*per;if(d<o.w)return[o.x+d,o.y,0,-1];d-=o.w;if(d<o.h)return[o.x+o.w,o.y+d,1,0];d-=o.h;if(d<o.w)return[o.x+o.w-d,o.y+o.h,0,1];d-=o.w;return[o.x,o.y+o.h-d,-1,0];};
    for(let i=0,n=Math.round(per/2.6);i<n;i++){const[px,pz,nx,nz]=at(r()),s=(2.6+r()*3.6)*big;lump(px+nx*s*.45,s*.35+r()*2,pz+nz*s*.45,s,.75+r()*.4);}   // the heap at its foot
    const streams=1+Math.round(per/60);for(let k=0;k<streams;k++){const t0=r(),top=H*(.45+r()*.5);
      for(let h=0;h<top;h+=1.7){const w=(1-h/top),[px,pz,nx,nz]=at(t0+(r()-.5)*.07*w+Math.sin(h*.25+k)*.015),s=(1.8+r()*2.8)*(.5+.5*w)*big;if(r()<.9)lump(px+nx*s*.18,h+s*.15,pz+nz*s*.18,s,.9+r()*.3,nx,nz);}}
    for(let i=0,m=Math.round(per/11);i<m;i++){const[px,pz,nx,nz]=at(r()),d=(.3+Math.pow(r(),1.4)*.8)*reach,s=(1.4+r()*2.4)*(1-d/(reach*1.3));lump(px+nx*d+(r()-.5)*4,s*.15+1,pz+nz*d+(r()-.5)*4,s,.5);}
    if(!round)for(let i=0;i<3;i++)if(r()<.6)lump(o.x+r()*o.w,H+.5,o.y+r()*o.h,1.4+r()*2,.55);};
  for(const o of objs)if(['ctank','xfmr','console','crate','barrel'].includes(o.kind)&&hqInside(o.x+o.w/2,o.y+o.h/2))grow(o);
  // the walls' feet: a crust along them, a heap of lumps on it, streams climbing a fifth to two thirds of the way up
  for(const o of objs){if(o.kind!=='wall')continue;const hz=o.w>=o.h,len=hz?o.w:o.h;
    for(const side of[-1,1]){const nx=hz?0:side,nz=hz?side:0,fx=nx>0?o.x+o.w:nx<0?o.x:0,fz=nz>0?o.y+o.h:nz<0?o.y:0;
      const mx=hz?o.x+o.w/2:fx+nx*3,mz=hz?fz+nz*3:o.y+o.h/2;if(!hqInside(mx,mz)||mz>790)continue;
      const sdf=(x,z)=>{const dx=Math.max(o.x-x,0,x-o.x-o.w),dz=Math.max(o.y-z,0,z-o.y-o.h);if((nx&&(x-fx)*nx<0)||(nz&&(z-fz)*nz<0))return 99;return Math.hypot(dx,dz);};
      const reach=13;crust(crCrust(sdf,hz?o.x:fx-(nx<0?reach*1.3:0),hz?fz-(nz<0?reach*1.3:0):o.y,hz?o.x+o.w:fx+(nx>0?reach*1.3:0),hz?fz+(nz>0?reach*1.3:0):o.y+o.h,reach,4.2,o.x*.011+o.y*.017+side));
      for(let a=0;a<len;a+=3.6){const px=hz?o.x+a:fx,pz=hz?fz:o.y+a;if(r()<.8){const s=3+r()*3.6;lump(px+nx*s*.45,s*.3+r()*1.5,pz+nz*s*.45,s,.75+r()*.4);}}
      for(let k=0,n=Math.round(len/60);k<n;k++){const a0=r()*len,top=24*(.2+.48*r());for(let h=0;h<top;h+=1.7){const w=1-h/top,a=a0+(r()-.5)*7*w+Math.sin(h*.2+k)*2,px=hz?o.x+a:fx,pz=hz?fz:o.y+a,s=(1.8+r()*2.8)*(.5+.5*w);if(a>0&&a<len&&r()<.9)lump(px+nx*s*.18,h+s*.15,pz+nz*s*.18,s,.9+r()*.3,nx,nz);}}
      for(let a=0;a<len;a+=11){const d=(.35+Math.pow(r(),1.4)*.7)*reach,s=(1.4+r()*2.2)*(1-d/(reach*1.3)),px=(hz?o.x+a:fx)+nx*d,pz=(hz?fz:o.y+a)+nz*d;if(r()<.6)lump(px,s*.15+1,pz,s,.5);}}}
  // a broken rim round the lair's clutch, and round each room's nest
  const ring=(cx,cz,R,n,big)=>{for(let i=0;i<n;i++){const a=r()*Math.PI*2,d=R*(.85+r()*.35),s=(big*.6+r()*big)*(1-.3*r());lump(cx+Math.cos(a)*d,s*.3,cz+Math.sin(a)*d,s,.7+r()*.5);}};
  for(const q of HQ_ROOMS)ring((q.x0+q.x1)/2+q.side*40,(q.y0+q.y1)/2-30,26,30,3);
  // one instanced mesh per shape; each lump's colour from its family, its crevices darker
  const grp=new T.Group(),m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler(),col=new T.Color(),tmp=new T.Color();
  L.forEach((list,vi)=>{if(!list.length)return;const M=new T.InstancedMesh(V[vi],mat,list.length);M.receiveShadow=true;M.frustumCulled=false;   // (no shadows cast: thousands of small lumps)
   
    list.forEach((l,i)=>{q4.setFromEuler(e4.set(l.rx,l.ry,0));m4.compose(new T.Vector3(l.x,l.y,l.z),q4,new T.Vector3(l.s*(1.1+((i*5)%4)*.1),l.s*l.sy,l.s*l.sz*(.85+((i*7)%5)*.08)));M.setMatrixAt(i,m4);
      const[a,b]=CR_ROCK[l.f];col.set(a).convertSRGBToLinear().lerp(tmp.set(b).convertSRGBToLinear(),((i*13)%7)/7);M.setColorAt(i,col);});
    M.instanceColor.needsUpdate=true;grp.add(M);});
  {const m=new T.Mesh(crMerge(crustG),cmat);m.receiveShadow=true;grpC.add(m);}
  sc.add(grp);grp.userData.lumps=L[0].length+L[1].length+L[2].length;grp.add(grpC);return grp;}

/* ---------- in the game (Bryan: the hunters come out of the gate; her young fight alongside her inside) ----------
   All the hunters in a scene share one set of instanced meshes, and so do all her young: each part of a model is baked
   once into one geometry (its colours on its vertices), and each monster owns a slot in the set, so twenty of them cost
   about a dozen draw calls. What they're doing (monsters.js's houndThink, fortress.js's bossThink) sets their poses. */
const CR_ZERO=new T.Matrix4().makeScale(0,0,0),_pq=new T.Quaternion(),_pe=new T.Euler(),_pm=new T.Matrix4(),_pw=new T.Matrix4(),_one=new T.Vector3(1,1,1);
let crFrame=0;
// bake a model into one geometry per moving part: each mesh goes to the nearest of the nodes above it, moved into that
// node's space (a mirrored mesh keeps its faces the right way out)
function crBake(root,nodes){
  root.updateMatrixWorld(true);const inv=new T.Matrix4(),rel=new T.Matrix4(),out=nodes.map(()=>[]);
  root.traverse(o=>{if(!o.isMesh||o.isInstancedMesh)return;let p=o,k=-1;while(p&&(k=nodes.indexOf(p))<0)p=p.parent;if(k<0)return;
    rel.copy(inv.copy(nodes[k].matrixWorld).invert()).multiply(o.matrixWorld);const g=o.geometry.clone();g.applyMatrix4(rel);
    if(rel.determinant()<0&&g.index){const ix=g.index;for(let i=0;i<ix.count;i+=3){const a=ix.getX(i+1);ix.setX(i+1,ix.getX(i+2));ix.setX(i+2,a);}}
    out[k].push(g);});
  return out.map(gs=>{const m=gs.length?crMerge(gs):new T.BufferGeometry();m.userData.keep=true;return m;});}
// a scene's pools: young, hunter, mother (made the first time one is needed)
function crPool(sc,kind){const P=sc.userData.crPools||(sc.userData.crPools={});
  return P[kind]||(P[kind]=kind==='hunter'?crHunterPool(24,sc):kind==='young'?crCentiPool(BROOD,36,sc):crCentiPool(MOTHER,1,sc));}
function crPoolBase(cap,sc){const p={cap,g:new T.Group(),owner:new Array(cap).fill(null),seen:new Int32Array(cap).fill(-9),shown:new Uint8Array(cap),m:{}};sc.add(p.g);return p;}
function crIM(p,k,geo,mat,per){const M=new T.InstancedMesh(geo,mat,per*p.cap);M.castShadow=true;M.receiveShadow=true;M.frustumCulled=false;M.userData.per=per;
  for(let i=0;i<M.count;i++)M.setMatrixAt(i,CR_ZERO);M.count=0;p.g.add(M);p.m[k]=M;}
// a slot for u: a free one, or one whose monster is gone from the fight (a Retry starts them afresh)
function crSlotFor(p,u){let i=p.owner.findIndex(o=>!o||o===u||!enemies.includes(o));if(i<0)return -1;p.owner[i]=u;return i;}
function crPut(p,slot,k,i,m){const M=p.m[k];M.setMatrixAt(slot*M.userData.per+i,m);}
function crShown(p,slot){if(slot>=(p.hi||0)){p.hi=slot+1;for(const k in p.m)p.m[k].count=p.hi*p.m[k].userData.per;}for(const k in p.m)p.m[k].instanceMatrix.needsUpdate=true;p.seen[slot]=crFrame;p.shown[slot]=1;}
// after the frame's poses (render, scene.js): any slot nobody posed this frame (out of sight, gone) is hidden
function crPoolsFrame(){
  const P=scene&&scene.userData.crPools;if(P)for(const k in P){const p=P[k];let ch=false;
    for(let s=0;s<p.cap;s++)if(p.shown[s]&&p.seen[s]!==crFrame){p.shown[s]=0;ch=true;for(const q in p.m){const M=p.m[q],per=M.userData.per;for(let i=0;i<per;i++)M.setMatrixAt(s*per+i,CR_ZERO);}}
    if(ch){let hi=0;for(let s=0;s<p.cap;s++)if(p.shown[s])hi=s+1;p.hi=hi;for(const q in p.m){p.m[q].count=hi*p.m[q].userData.per;p.m[q].instanceMatrix.needsUpdate=true;}}}
  crFrame++;}   // (each pool draws only up to its last slot in use)
// centipedes (her young, and the Brood Mother herself: a pool of one)
function crCentiPool(S,cap,sc){
  const det=S===MOTHER?.55:.24,keep=CR_DET;CR_DET=det;let B,G;
  try{const key='cp-'+S.pal+'@'+det;B=CR.geo[key];
    if(!B){const t=makeCentipede(S),hd=t.head,nodes=[hd,t.forc[0].pv,t.forc[1].pv,t.ant[0].pv,t.ant[1].pv,t.mand[0].pv,t.mand[1].pv];
      B=CR.geo[key]={bk:crBake(hd,nodes),pv:nodes.slice(1).map(nd=>nd.position.clone())};}
    G=crCentiGeo(S);for(const k in G)if(G[k]&&G[k].userData)G[k].userData.keep=true;}finally{CR_DET=keep;}
  const P=S.pal,n=S.n,p=crPoolBase(cap,sc);p.S=S;p.n=n;p.pv=B.pv;
  const chit=crMat(P+'-plate'),soft=crMat(P+'-soft'),legM=crMat(P+'-leg'),headM=crMat(P+'-head'),claw=crMat(P+'-claw');
  crIM(p,'terg',G.terg,chit,n);crIM(p,'stern',G.stern,soft,n);crIM(p,'core',G.core,soft,n);for(const k of['coxa','fem','tib','tar'])crIM(p,k,G[k],legM,2*n);crIM(p,'ult',G.ult,legM,6);
  crIM(p,'head',B.bk[0],headM,1);crIM(p,'forcL',B.bk[1],claw,1);crIM(p,'forcR',B.bk[2],claw,1);crIM(p,'antL',B.bk[3],legM,1);crIM(p,'antR',B.bk[4],legM,1);crIM(p,'mandL',B.bk[5],claw,1);crIM(p,'mandR',B.bk[6],claw,1);
  return p;}
const CR_HEADK=['forcL','forcR','antL','antR','mandL','mandR'];
function crCentiSlot(p,slot,pts,t,o){
  const hm=crPoseCentiCore(p.S,p.n,pts,t,o,(k,i,m)=>crPut(p,slot,k,i,m));crPut(p,slot,'head',0,hm);
  const R=crHeadRot(o,t);for(let j=0;j<6;j++){_pq.setFromEuler(_pe.set(...R[j]));_pm.compose(p.pv[j],_pq,_one);_pw.multiplyMatrices(hm,_pm);crPut(p,slot,CR_HEADK[j],0,_pw);}
  crShown(p,slot);}
// hunters
function crHunterRig(){
  const root=new T.Group(),g=new T.Group(),body=new T.Group();root.add(g);g.add(body);const Q=HUNTER_RIG,grp=(par,pos)=>{const o=new T.Group();o.position.set(...pos);par.add(o);return o;};
  const neck=grp(body,Q.neck),head=grp(neck,Q.head);
  return{root,g,body,neck,head,jaws:[1,-1].map(s=>({pv:grp(head,[s*Q.jaw[0],Q.jaw[1],Q.jaw[2]]),s})),
    arms:[1,-1].map(s=>{const sh=grp(body,[s*Q.sh[0],Q.sh[1],Q.sh[2]]);return{sh,el:grp(sh,Q.el),s};}),tail:grp(body,Q.tail)};}
const CR_HUNTK=['body','neck','head','jawL','jawR','shL','elL','shR','elR','tail'];
function crHunterPool(cap,sc){
  const keep=CR_DET;CR_DET=.3;let B,G;
  try{B=CR.geo['hp@.3'];if(!B){const t=makeStalker();B=CR.geo['hp@.3']={bk:crBake(t.g,[t.body,t.neck,t.head,t.jaws[0].pv,t.jaws[1].pv,t.arms[0].sh,t.arms[0].el,t.arms[1].sh,t.arms[1].el,t.tail])};}
    G=crCentiGeo(Object.assign({},BROOD,{pal:'hunter'}));for(const k in G)if(G[k]&&G[k].userData)G[k].userData.keep=true;}finally{CR_DET=keep;}
  const chit=crMat('st-plate'),legM=crMat('st-leg'),p=crPoolBase(cap,sc);
  CR_HUNTK.forEach((k,i)=>crIM(p,k,B.bk[i],k[0]==='s'&&k[1]==='h'?legM:chit,1));for(const k of['coxa','fem','tib','tar'])crIM(p,k,G[k],legM,4);
  return p;}
function crHunterSlot(p,slot,R,x,z,head,t,o){
  crPoseHunterCore(R,x,z,head,t,o,(i,k,m)=>crPut(p,slot,k,i,m));
  const N=[R.body,R.neck,R.head,R.jaws[0].pv,R.jaws[1].pv,R.arms[0].sh,R.arms[0].el,R.arms[1].sh,R.arms[1].el,R.tail];
  N.forEach((nd,i)=>crPut(p,slot,CR_HUNTK[i],0,nd.matrixWorld));crShown(p,slot);}
// a centipede's body follows where its head has been: a trail of points from the head back (pts: the start, from the
// head back; or straight out behind it)
function crTrailInit(u,S,pts){
  if(pts)u.trail=pts.map(q=>({x:q.x,y:q.y}));else{u.trail=[];const L=S.head.l+S.n*S.seg+30;for(let d=0;d<=L;d+=2)u.trail.push({x:u.x-Math.cos(u.ang)*d,y:u.y-Math.sin(u.ang)*d});}
  u.trail[0]={x:u.x,y:u.y};}
function crTrailStep(u,S){
  const tr=u.trail;if(!tr||Math.hypot(u.x-tr[0].x,u.y-tr[0].y)>60){crTrailInit(u,S);return;}
  tr[0]={x:u.x,y:u.y};if(tr.length<2||Math.hypot(u.x-tr[1].x,u.y-tr[1].y)>=1.5)tr.splice(1,0,{x:u.x,y:u.y});
  const need=S.head.l+S.n*S.seg+24;let acc=0;for(let i=1;i<tr.length;i++){acc+=Math.hypot(tr[i].x-tr[i-1].x,tr[i].y-tr[i-1].y);if(acc>need){tr.length=i+1;break;}}}
// the spine from the trail at `lift` off the floor; rear (0..1) lifts the first kR segments in an arc off the kR-th
const CR_SP={},_ra=new T.Vector3(),_rd=new T.Vector3();
function crTrailSpine(u,S,rear,kR,lift){
  const tr=u.trail,n=S.n,gap=S.head.l*.55+S.seg*.5,out=CR_SP[S.pal]||(CR_SP[S.pal]=Array.from({length:n+1},()=>new T.Vector3()));
  let i=0,acc=0;const L=j=>Math.hypot(tr[j+1].x-tr[j].x,tr[j+1].y-tr[j].y);
  for(let s=0;s<=n;s++){const d=s?gap+(s-1)*S.seg:0;
    while(i<tr.length-2&&acc+L(i)<d){acc+=L(i);i++;}
    if(tr.length<2){out[s].set(tr[0].x-Math.cos(u.ang)*d,lift,tr[0].y-Math.sin(u.ang)*d);continue;}
    const l=L(i)||1e-6,f=(d-acc)/l;out[s].set(tr[i].x+(tr[i+1].x-tr[i].x)*f,lift,tr[i].y+(tr[i+1].y-tr[i].y)*f);}
  if(rear>.01){const P=out[kR];_rd.set(out[kR-1].x-P.x,0,out[kR-1].z-P.z);if(_rd.lengthSq()<1e-8)_rd.set(Math.cos(u.ang),0,Math.sin(u.ang));_rd.normalize();_ra.copy(P);const am=rear*1.45;
    for(let s=kR-1;s>=0;s--){const st=s?S.seg:gap,th=am*(kR-s)/kR;_ra.addScaledVector(_rd,Math.cos(th)*st);_ra.y+=Math.sin(th)*st;out[s].copy(_ra);}}
  return out;}
// how far and how fast it's gone since the last frame (its legs keep step with it)
function crGait(u,ref){const dt=Math.max(1e-3,Math.min(.1,simT-(u.gT??simT))),d=Math.hypot(u.x-(u.gx??u.x),u.y-(u.gy??u.y));u.gT=simT;u.gx=u.x;u.gy=u.y;
  if(d<30){u.wph=(u.wph||0)+d;u.spd=(u.spd||0)+((d/dt)-(u.spd||0))*Math.min(1,dt*8);}return Math.min(1,(u.spd||0)/ref);}

// an egg bursts (Bryan: her young come from the side rooms and from the eggs): split open and slumped, darker
function crEggBurst(nest,i){const D=nest.userData.eggs,e=D.list[i];if(!e||e.burst)return;e.burst=true;const m4=new T.Matrix4(),q4=new T.Quaternion().setFromEuler(new T.Euler(e.rx+.6,e.ry,.4));
  m4.compose(new T.Vector3(e.x,Math.max(e.s*.3,e.y-e.s*.45),e.z),q4,new T.Vector3(e.s*1.3,e.s*.45,e.s*1.2));D.mesh.setMatrixAt(i,m4);D.mesh.setColorAt(i,new T.Color(.55,.2,.13));D.mesh.instanceMatrix.needsUpdate=true;if(D.mesh.instanceColor)D.mesh.instanceColor.needsUpdate=true;}   // (slumped where it lay, on top of the heap, so it's still seen; wet and dark inside)
