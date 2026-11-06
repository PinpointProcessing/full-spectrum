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
function crPlate({sq=4,dome=.55,keel=.12,rim=.16,front=.75,under=.35,seg=[40,20],col}={}){
  const g=new T.SphereGeometry(1,seg[0],seg[1]),p=g.attributes.position,uv=g.attributes.uv,C=[];
  for(let i=0;i<p.count;i++){let x=p.getX(i),y=p.getY(i),z=p.getZ(i);
    const hr=Math.hypot(x,z);if(hr>1e-6){const a=Math.atan2(z,x),ca=Math.abs(Math.cos(a)),sa=Math.abs(Math.sin(a)),k=1/Math.pow(Math.pow(ca,sq)+Math.pow(sa,sq),1/sq);x*=k;z*=k;}
    const ax=Math.abs(x),top=y>0;let yy=top?Math.pow(y,dome):y*under;
    if(top){const e=Math.min(1,y*4);yy+=keel*Math.exp(-Math.pow((ax-.3)/.1,2))*e;yy+=rim*crS(.5,1,-z)*e;if(z>0)yy*=1-(1-front)*crS(.25,1,z);}
    p.setXYZ(i,x,yy,z);uv.setXY(i,x*.5+.5,z*.5+.5);if(col)C.push(...col(Math.min(1,Math.max(ax,Math.abs(z)*.9)),z,top?1:0,x));}
  if(col)g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.computeVertexNormals();return g;}

/* ---------- the palettes: black, grey and brown (Bryan) ---------- */
const CR_PAL={
  mother:{c:'#0c0907',m:'#22160e',e:'#6b4a2c',under:'#4a423a',under2:'#241e1a',leg0:'#33261b',leg1:'#0f0b08',joint:'#7a5a3a',tip:'#1a120c',eye:'#030303'},
  hunter:{c:'#0b0a09',m:'#211a14',e:'#4a3a2a',under:'#3a332d',under2:'#1d1915',leg0:'#3d3329',leg1:'#14110e',joint:'#6a5a48',tip:'#1a140f',eye:'#030303'},
  brood:{c:'#131110',m:'#2b2622',e:'#544a40',under:'#5c554d',under2:'#332e29',leg0:'#544c44',leg1:'#1f1b18',joint:'#82786c',tip:'#0e0c0b',eye:'#050505'}};

/* ---------- a centipede: the Brood Mother and her brood ---------- */
const MOTHER={pal:'mother',n:21,seg:6.4,head:{w:21,l:16,h:9.5},w:u=>17+4.5*Math.sin(Math.PI*Math.min(1,u*1.1))-2.5*u,h:9.5,ride:9,
  leg:{cx:3.2,fe:u=>10.5+2*u,ti:u=>11+3*u,ta:u=>6.5+2*u,r:u=>2+.3*(1-u)},spread:u=>19+5*u,stride:5,lift:3,ult:[19,17,14],ultR:2.5,ant:50,forc:16,spines:true,raise:24};
const BROOD={pal:'brood',n:15,seg:2.3,head:{w:6.2,l:4.8,h:2.6},w:u=>5.8+1.3*Math.sin(Math.PI*u)-.8*u,h:2.8,ride:3.3,
  leg:{cx:1.1,fe:u=>4.3+1*u,ti:u=>4.7+1.3*u,ta:u=>3+.8*u,r:u=>.55},spread:u=>9+3*u,stride:2.2,lift:1.2,ult:[6.6,6.4,5.6],ultR:.8,ant:16,forc:4.4,spines:false,raise:8};

function crCentiGeo(S){
  const key=S.pal;if(CR.geo[key])return CR.geo[key];
  const P=CR_PAL[S.pal],L=k=>crLin(P[k]);
  const plateCol=(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.4,.8,r)),L('e'),Math.min(1,crS(.82,1,r)*.7+crS(.6,.92,-z)*.8)):L('under2');
  const terg=crPlate({sq:4.2,dome:.5,keel:.16,rim:.2,front:.7,col:plateCol});
  const stern=crPlate({sq:3.2,dome:.8,keel:0,rim:.05,front:.85,col:(r,z,top)=>top?crMix(L('under'),L('under2'),crS(.6,1,r)*.7):L('under2')});
  const core=new T.SphereGeometry(1,18,12);{const p=core.attributes.position,C=[];for(let i=0;i<p.count;i++){const y=p.getY(i);C.push(...crMix(L('under2'),L('under'),crS(-.2,.6,-y)));}core.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  // the legs: parts along +x, unit length and radius about 1 (the pose stretches and thickens them); paler at each joint
  const part=(prof,{bend=0,c0='leg0',c1='leg1',tip=null,spines=0,aspect=9,sides=9})=>{const n=prof.length,pts=[];for(let i=0;i<n;i++){const u=i/(n-1);pts.push(new T.Vector3(u,-bend*u*u,0));}
    const col=u=>{let c=crMix(L(c0),L(c1),crS(.1,1,u));c=crMix(c,L('joint'),(1-crS(0,.12,u))*.55);if(tip)c=crMix(c,L(tip),crS(.55,1,u));return c;};
    const gs=[crSweep(pts,prof,{sides,col})];
    for(let k=0;k<spines;k++){const u0=.3+k*.55/Math.max(1,spines-1),ri=prof[Math.round(u0*(n-1))];
      const sp=crSweep(crCurve([[0,-ri*.55,0],[-.25,-ri*1.25,.1],[-.65,-ri*1.9,.22]],6),q=>.28*(1-q)+.03,{sides:6,col:()=>L('tip'),cap0:false});
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
  G.head=crPlate({sq:2.6,dome:.75,keel:.07,rim:0,front:.95,under:.6,seg:[48,26],col:(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.55,1,r)*.5),L('e'),crS(.9,1,r)*.3):L('under2')});
  const H=S.head;
  G.forc=crSweep(crCurve([[0,0,0],[.16,-.06,.28],[.2,-.08,.56],[.08,-.06,.82],[-.16,-.02,.96],[-.36,.02,.93]],22).map(p=>p.multiplyScalar(S.forc)),
    u=>S.forc*(.115*Math.pow(1-crS(0,1,u),1.1)+.008)*(1+.12*Math.exp(-Math.pow((u-.18)/.1,2))),{sides:12,col:u=>crMix(crMix(L('m'),L('e'),.55*(1-crS(.2,.5,u))),L('tip'),crS(.4,.8,u))});
  const ant=[];for(let i=0;i<40;i++){const u=i/39;ant.push(new T.Vector3(.0,Math.sin(u*Math.PI*.9)*.12,u).multiplyScalar(S.ant));}
  G.ant=crSweep(ant,u=>S.ant*.02*(1-.72*u)*(.9+.1*Math.cos(u*22*Math.PI*2)),{sides:8,col:u=>crMix(L('leg0'),L('leg1'),u)});
  G.eye=new T.SphereGeometry(1,12,9);{const p=G.eye.attributes.position,C=[];for(let i=0;i<p.count;i++)C.push(...L('eye'));G.eye.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  G.maw=new T.SphereGeometry(1,16,10);{const p=G.maw.attributes.position,C=[];for(let i=0;i<p.count;i++)C.push(...crMix(L('tip'),[.08,.02,.015],crS(.2,-1,p.getZ(i))));G.maw.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  G.tooth=crSweep(crCurve([[0,0,0],[0,-.45,.2],[0,-.8,.32]],6),u=>.26*(1-u)+.02,{sides:6,col:u=>crMix(L('e'),L('tip'),u)});
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
  G.mand=G.mand||crSweep(crCurve([[0,0,0],[.1,-.05,.35],[.06,-.08,.7],[-.12,-.06,.9]],12),u=>.13*(1-u)+.012,{sides:8,col:u=>crMix(crLin(CR_PAL[P].m),crLin(CR_PAL[P].tip),u)});
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

// pose a centipede: pts from crSpine; t the time (legs walk in a wave down the body); o.walk 0..1, o.jaw 0..1 (the claws
// open), o.look (head pitch, + = down), o.antL/antR (antennae spread), o.flail (raised legs reaching)
function poseCentipede(C,pts,t,o={}){
  const S=C.S,n=C.n,F=[],X=[],Y=[],walk=o.walk??0,v=[];for(let i=0;i<14;i++)v.push(new T.Vector3());
  for(let i=0;i<=n;i++){const a=pts[Math.max(0,i-1)],b=pts[Math.min(n,i+1)],f=new T.Vector3().subVectors(a,b).normalize();
    const x=new T.Vector3().crossVectors(_cUp,f);if(x.lengthSq()<1e-6)x.set(1,0,0);x.normalize();F.push(f);X.push(x);Y.push(new T.Vector3().crossVectors(f,x).normalize());}
  for(let i=1;i<=n;i++){const k=i-1,u=k/(n-1),w=S.w(u),p=pts[i],lt=X[i],up=Y[i],fw=F[i];
    crBasis(_cm,lt,up,fw,w*.52,S.h*.46,S.seg*.82,v[0].copy(p).addScaledVector(up,S.h*.14));C.terg.setMatrixAt(k,_cm);
    crBasis(_cm,lt,up,fw,w*.45,S.h*.5,S.seg*.74,p);C.core.setMatrixAt(k,_cm);
    crBasis(_cm,v[1].copy(lt).negate(),v[2].copy(up).negate(),fw,w*.41,S.h*.16,S.seg*.62,v[0].copy(p).addScaledVector(up,-S.h*.42));C.stern.setMatrixAt(k,_cm);
    const hgt=p.y,air=crS(S.raise*.9,S.raise*1.7,hgt);
    for(const s of[1,-1]){const j=k*2+(s>0?0:1),r=S.leg.r(u);
      const hip=v[3].copy(p).addScaledVector(lt,s*w*.4).addScaledVector(up,-S.h*.2);
      const out=v[4].copy(lt).multiplyScalar(s).addScaledVector(up,-.35).normalize(),t0=v[5].copy(hip).addScaledVector(out,S.leg.cx);
      crSeg(_cm,hip,t0,up,r*1.25);C.coxa.setMatrixAt(j,_cm);
      const ph=t*7-k*.62+(s>0?0:Math.PI),sw=Math.sin(ph)*walk,lift=Math.max(0,Math.cos(ph))*walk;
      const flat=v[6].set(lt.x,0,lt.z).normalize(),fl=v[7].set(fw.x,0,fw.z).normalize(),reach=S.spread(u);
      const g=v[8].set(p.x,0,p.z).addScaledVector(flat,s*(w*.5+reach)).addScaledVector(fl,S.stride*sw+(.5-u)*S.stride*.5);g.y=S.lift*lift;
      const wig=Math.sin(t*5.3+k*1.7+(s>0?0:2))*(o.flail??.4);
      const a=v[9].copy(hip).addScaledVector(lt,s*reach*(.5+wig*.12)).addScaledVector(fw,reach*(.3+wig*.25)).addScaledVector(up,-reach*(.62-wig*.15));
      const tg=v[10].copy(g).lerp(a,air);
      const pole=v[11].copy(_cUp).multiplyScalar(.75).addScaledVector(flat,s*.7).lerp(v[12].copy(lt).multiplyScalar(s).addScaledVector(fw,-.55).addScaledVector(up,.25),air);
      const fe=S.leg.fe(u),tb=S.leg.ti(u),ta=S.leg.ta(u),kn=crIK(t0,tg,fe,tb+ta,pole,v[13]);
      const ft=v[12].subVectors(tg,kn).normalize().multiplyScalar(tb+ta).add(kn);
      const ak=v[1].copy(kn).lerp(ft,tb/(tb+ta)).addScaledVector(pole,(tb+ta)*.06);
      crSeg(_cm,t0,kn,pole,r);C.fem.setMatrixAt(j,_cm);
      crSeg(_cm,kn,ak,pole,r*.82);C.tib.setMatrixAt(j,_cm);
      crSeg(_cm,ak,ft,pole,r*.7);C.tar.setMatrixAt(j,_cm);}}
  // the last pair: long, thick, trailing like pincers
  {const p=pts[n],lt=X[n],up=Y[n],fw=F[n],w=S.w(1);
    for(const s of[1,-1]){let a=v[0].copy(p).addScaledVector(lt,s*w*.3).addScaledVector(fw,-S.seg*.4);
      const dirs=[[-1,.42,.18],[-1,.2,.05],[-1,.05,-.22]];
      S.ult.forEach((len,q)=>{const d=v[1].copy(fw).multiplyScalar(dirs[q][0]).addScaledVector(lt,s*dirs[q][1]).addScaledVector(up,dirs[q][2]+Math.sin(t*1.3+q+s)*.04).normalize();
        const b=v[2].copy(a).addScaledVector(d,len);crSeg(_cm,a,b,up,S.ultR*(1-q*.18));C.ult.setMatrixAt((s>0?0:3)+q,_cm);a=v[0].copy(b);});}}
  for(const k of['terg','stern','core','coxa','fem','tib','tar','ult'])C[k].instanceMatrix.needsUpdate=true;
  // the head: on the spine's first point, pitched by o.look
  {const f=v[0].copy(F[0]).applyAxisAngle(X[0],o.look??0),x=X[0],y=v[1].crossVectors(f,x).normalize();
    crBasis(C.head.matrix,x,y,f,1,1,1,pts[0]);C.head.matrixWorldNeedsUpdate=true;
    const jaw=o.jaw??.15;C.forc.forEach(({pv,s})=>{pv.rotation.set(0,s*(jaw*.75-.12),s*jaw*.1);});(C.mand||[]).forEach(({pv,s})=>{pv.rotation.set(0,s*jaw*.5,0);});
    C.ant.forEach(({pv,s},i)=>{pv.rotation.set(-(o.antUp??.25)+Math.sin(t*2.1+i*2)*.08,s*((i?o.antR:o.antL)??.55)+Math.sin(t*1.7+i)*.1,0);});}
}

/* ---------- her nest: the Headquarters overgrown ---------- */
const crGooMat=()=>crMat('goo',{nmap:crNormalTex('goo',512,crGooH),ns:.32,rough:.3,coat:1,coatR:.1,env:.7,rimK:.06,rim:0x8a7056});
const crSlimeMat=()=>crMat('slime',{nmap:crNormalTex('goo',512,crGooH),ns:.04,rough:.1,coat:1,coatR:.04,env:.9,rimK:0,fill:0});
const crEggMat=()=>crMat('egg',{nmap:crNormalTex('chitin',512,crChitinH),ns:.12,rough:.45,coat:.8,coatR:.15,env:.5,rimK:.35,rim:0xc8a070,emis:0x050302,fill:.02});
// a sheet of resin down a wall: w along it (x), up to h high (y), standing off it (z, out into the room); ropes run down it,
// it bulges, its top edge is ragged and its foot pools out over the floor
function crDrape(w,h,seed){
  // a continuous coat: its top edge rises and falls along the wall (in places to the top), thick ropes run down it, lumps
  // swell out of it, it thins toward its top edge and its foot spreads out over the floor
  const nx=Math.max(10,Math.round(w/1.1)),ny=Math.max(12,Math.round(h/1.0)),P=[],C=[],UV=[],I=[];
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
    const h=k*H*(.35+.65*crF(wx*.03,wz*.03,seed+2,3))+k*rid*H*.35;inn.push(rho<b);
    P.push(wx,h+.08,wz);UV.push(wx/30,wz/30);C.push(...crMix(crMix(crLin('#070504'),crLin('#21170f'),rid*.6),crLin('#3a2818'),crS(.68,.9,crF(wx*.08,wz*.08,seed+5,2))*.5*k));}
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

// overgrow the Headquarters (its scene sc and objects objs): resin down the walls of the hall and the rooms, veins over the
// floor toward the lair, slime, strands, her clutch in the lair and smaller ones in the rooms
function hqNest(sc,objs){
  const goo=crGooMat(),slime=crSlimeMat(),grp=new T.Group();sc.add(grp);const r=rng(9157);
  const inside=(x,y)=>(x>HQ_HALL.x0&&x<HQ_HALL.x1&&y>HQ_HALL.y0&&y<HQ_HALL.y1)||HQ_ROOMS.some(q=>x>q.x0&&x<q.x1&&y>q.y0&&y<q.y1)||(x>400&&x<600&&y>790&&y<930);
  const nestK=(x,y)=>y<790?1:.35;   // the entry hall: less
  let seed=1;
  for(const o of objs){if(o.kind!=='wall')continue;const hz=o.w>=o.h,len=hz?o.w:o.h;
    for(const side of[-1,1]){const nx=hz?0:side,ny=hz?side:0,fx=nx>0?o.x+o.w:nx<0?o.x:0,fy=ny>0?o.y+o.h:ny<0?o.y:0;
      const mx=hz?o.x+o.w/2:fx+nx*3,my=hz?fy+ny*3:o.y+o.h/2;if(!inside(mx,my))continue;
      for(let at=0;at<len;){const w=len,gap=0;
        if(r()<.88*nestK(mx,my)){const m=new T.Mesh(crDrape(w,14+r()*10,seed++*7.31),goo);m.receiveShadow=true;m.castShadow=true;
          m.rotation.y=Math.atan2(nx,ny);   // (the sheet's x runs along the wall, its z out of the face)
          if(ny>0)m.position.set(o.x+at,0,fy+.2);else if(ny<0)m.position.set(o.x+at+w,0,fy-.2);
          else if(nx>0)m.position.set(fx+.2,0,o.y+at+w);else m.position.set(fx-.2,0,o.y+at);
          grp.add(m);}
        at+=w+gap;}}}
  const L={x:500,y:210};   // the lair
  // creep: the lair's floor sheeted over, a skirt along the hall's walls, the rooms' nests, smears out of the doorways
  const cm=crMat('creep',{nmap:crNormalTex('goo',512,crGooH),ns:.22,rough:.3,coat:1,coatR:.12,env:.7,rimK:.04,rim:0x8a7056});
  const creep=(cx,cz,rx,rz,rot,sd,H)=>{const m=new T.Mesh(crCreep(cx,cz,rx,rz,rot,sd,H),cm);m.receiveShadow=true;grp.add(m);};
  creep(L.x,L.y+10,150,110,0,1.1,2.4);creep(L.x-40,L.y+120,90,60,.3,2.2,1.8);creep(L.x+60,L.y+110,80,55,-.4,3.3,1.6);
  for(const[x,s0]of[[352,1],[648,-1]])for(let y=170;y<760;y+=95+r()*40)creep(x+s0*6,y,18+r()*8,40+r()*20,0,y*.13+x,1.4);
  for(const q of HQ_ROOMS){creep((q.x0+q.x1)/2+q.side*30,(q.y0+q.y1)/2-10,75,60,r(),q.x*.01+q.y,1.8);creep(q.door.x-q.side*30,q.door.y,40,16,q.side*.15,q.y*.07,1.1);}
  // slime: puddles over the floor (glossy: the lamps glint off them), most round the lair and the rooms' doorways
  const blobs=[];for(let i=0;i<12;i++)blobs.push([L.x+(r()-.5)*240,L.y-30+r()*200,6+r()*14]);
  for(const q of HQ_ROOMS)blobs.push([q.door.x-q.side*14,q.door.y+(r()-.5)*20,8+r()*8]);

  blobs.forEach(([x,y,R],i)=>{const m=new T.Mesh(crBlob(R,i*1.7),slime);m.position.set(x,.14+(i%7)*.02,y);m.receiveShadow=true;grp.add(m);});
  // strands: from the resin on the walls down to the floor, and across the rooms' doorways
  for(const q of HQ_ROOMS){const dx=q.door.x,dy=q.door.y;for(let i=0;i<5;i++){const a=new T.Vector3(dx,8+r()*14,dy-22+r()*6),b=new T.Vector3(dx,6+r()*14,dy+16+r()*6);
    const m=new T.Mesh(crStrand(a,b,.22+r()*.3,3+r()*6),goo);grp.add(m);}}
  // the clutches
  const eggs=[];crClutch(L.x,L.y-10,46,240,2.6,77,eggs);crClutch(L.x-70,L.y+30,22,50,2.3,78,eggs);crClutch(L.x+75,L.y+20,20,44,2.3,79,eggs);
  for(const q of HQ_ROOMS)crClutch((q.x0+q.x1)/2+q.side*40,(q.y0+q.y1)/2-30,16,26,1.8,q.x+q.y,eggs);
  const eg=new T.SphereGeometry(1,16,12);{const p=eg.attributes.position,C=[];for(let i=0;i<p.count;i++){const y=p.getY(i);C.push(...crMix(crLin('#4e473d'),crLin('#a39a86'),crS(-.9,.8,y)));}eg.setAttribute('color',new T.Float32BufferAttribute(C,3));}
  const E=new T.InstancedMesh(eg,crEggMat(),eggs.length),m4=new T.Matrix4(),q4=new T.Quaternion(),e4=new T.Euler();E.castShadow=true;E.receiveShadow=true;E.frustumCulled=false;
  eggs.forEach((e,i)=>{q4.setFromEuler(e4.set(e.rx,e.ry,0));m4.compose(new T.Vector3(e.x,e.y,e.z),q4,new T.Vector3(e.s,e.s*1.22,e.s));E.setMatrixAt(i,m4);});grp.add(E);
  return grp;}
// the floor under the nest (fortress.js's ground canvas, its own transform): old concrete gone dark with her secretions,
// drag marks out of the rooms, the lair black and veined
function paintNestGround(g){
  const W=HQB.x1-HQB.x0,H=HQB.y1-HQB.y0,S=1.2,r=rng(4242);g.setTransform(S,0,0,S,-HQB.x0*S,-HQB.y0*S);
  g.fillStyle='#121315';g.fillRect(HQB.x0,HQB.y0,W,H);
  g.fillStyle='#3a3b40';g.fillRect(340,140,320,640);
  for(const q of HQ_ROOMS){g.fillStyle='#2e2c30';g.fillRect(q.x0,q.y0,q.x1-q.x0,q.y1-q.y0);}
  g.fillStyle='#37383d';g.fillRect(400,790,200,140);
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
const STALKER={pal:'brood',len:1};
function makeStalker(){
  const P=CR_PAL.hunter,L=k=>crLin(P[k]),root=new T.Group(),g=new T.Group(),body=new T.Group(),legs=new T.Group();root.add(g,legs);g.add(body);
  const chit=crMat('st-plate',{nmap:crNormalTex('chitin',512,crChitinH),ns:.22,rough:.32,coatR:.08,env:.75});
  const legM=crMat('st-leg',{nmap:crNormalTex('chitin',512,crChitinH),ns:.14,rough:.6,coat:.2,coatR:.35,env:.25,rim:0x6a5440,rimK:.14});
  const soft=crMat('st-soft',{nmap:crNormalTex('chitin',512,crChitinH),ns:.3,rough:.7,coat:.15,coatR:.4,rimK:.08,env:.25});
  const eyeM=crMat('eye',{rough:.04,coat:1,coatR:.02,env:2,rimK:.05});
  const add=(geo,mat,par=body)=>{const m=new T.Mesh(geo,mat);m.castShadow=true;m.receiveShadow=true;par.add(m);return m;};
  // the spine of the back: hips (z -7) up to the shoulders (z +5), down to the neck
  const spine=crCurve([[0,9,-8],[0,12.5,-4],[0,15.5,1],[0,15.2,5],[0,12.6,8.5]],24);
  add(crSweep(spine,u=>(1.5+1.3*Math.sin(Math.PI*Math.min(1,u*1.15)))*(u<.12?.8:1),{sides:14,col:u=>crMix(L('under2'),L('under'),.3)}),soft);   // the body under the plates
  const plateG=crPlate({sq:3.6,dome:.55,keel:.1,rim:.28,front:.7,col:(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.4,.85,r)),L('e'),Math.min(1,crS(.85,1,r)*.6+crS(.6,.95,-z)*.7)):L('under2')});
  const spikeG=crSweep(crCurve([[0,0,0],[0,.5,-.4],[0,.8,-1.1]],6),u=>.32*(1-u)+.02,{sides:6,col:u=>crMix(L('m'),L('tip'),u)});
  const tg=new T.Vector3();for(let i=0;i<7;i++){const u=.06+i*.14,c=new T.CatmullRomCurve3(spine);const p=c.getPoint(u),t=c.getTangent(u);
    const pl=new T.Group();pl.position.copy(p);pl.lookAt(tg.copy(p).add(t));pl.rotateX(-.08);body.add(pl);   // (lookAt aims +z along the back)
    const w=6.8+2.4*Math.sin(Math.PI*Math.min(1,u*1.1)),m=add(plateG,chit,pl);m.scale.set(w/2,2.3,2.9);m.position.y=.9+Math.sin(Math.PI*u)*.5;
    for(const s of[-1,0,1]){const sp=add(spikeG,chit,pl);sp.scale.setScalar(s?1.1:1.6);sp.position.set(s*w*.28,3+(s?0:.4),-2.1);sp.rotation.z=s*.35;}}
  // the head: a low wedge, six eyes in two rows, hooked side jaws, the mouth between them
  const neck=new T.Group();neck.position.set(0,12.4,8.6);body.add(neck);
  add(crSweep(crCurve([[0,0,-1],[0,-.6,1.2],[0,-1.4,2.8]],8),u=>2.2-u*.5,{sides:12,col:()=>L('under2')}),soft,neck);
  const head=new T.Group();head.position.set(0,-1.5,3);neck.add(head);
  const hm=add(crPlate({sq:2.3,dome:.62,keel:.12,rim:0,front:.98,under:.55,seg:[44,22],col:(r,z,top)=>top?crMix(crMix(L('c'),L('m'),crS(.5,1,r)*.4),L('e'),crS(.92,1,r)*.25):L('under2')}),chit,head);
  hm.scale.set(2.9,2.4,4.6);hm.position.z=3.4;
  for(const s of[1,-1])for(const[x,y,z,r]of[[.55,1.85,6.4,.42],[1.25,1.6,6.0,.36],[1.85,1.2,5.3,.3],[.62,2.15,5.4,.3],[1.32,1.9,5.0,.26],[1.9,1.5,4.4,.22]]){const e=add(new T.SphereGeometry(1,14,10),eyeM,head);e.geometry.setAttribute('color',new T.Float32BufferAttribute(new Array(e.geometry.attributes.position.count*3).fill(.004),3));e.scale.setScalar(r);e.position.set(s*x,y,z);}
  const jawG=crSweep(crCurve([[0,0,0],[.6,-.2,1.6],[.5,-.3,3.4],[-.4,-.2,4.7],[-1.3,-.1,4.9]],16),u=>.7*Math.pow(1-u,1.1)+.05,{sides:10,col:u=>crMix(L('m'),L('tip'),crS(.3,.8,u))});
  const jaws=[];for(const s of[1,-1]){const pv=new T.Group();pv.position.set(s*1.6,-.6,5.6);head.add(pv);const j=add(jawG,chit,pv);j.scale.set(s,1,1);jaws.push({pv,s});}
  add(new T.SphereGeometry(1,14,10),soft,head).scale.set(1.2,.8,.9);head.children[head.children.length-1].position.set(0,-.9,7.3);
  // the scythe arms: folded under the chest, spined along the inside of the blade
  const armF=crSweep(crCurve([[0,0,0],[0,2,3],[0,3.2,6.6],[0,3,9.6]],12),u=>1.05-.35*u,{sides:10,col:u=>crMix(L('leg0'),L('m'),u)});
  const bladeG=crMerge([crSweep(crCurve([[0,0,0],[0,-1.8,-2.2],[0,-3,-5.4],[0,-3.2,-8],[0,-2.2,-9.4]],14),u=>.75*Math.pow(1-u,.8)+.05,{sides:9,col:u=>crMix(L('m'),L('tip'),crS(.4,1,u))}),
    ...[.25,.42,.58,.74].map(u=>crSweep(crCurve([[0,-1.4*u-.2,-u*6],[0,-.2-1.4*u,-u*6+.8],[0,1.1-1.4*u,-u*6+1.3]],5),q=>.2*(1-q)+.02,{sides:5,col:()=>L('tip'),cap0:false}))]);
  const arms=[];for(const s of[1,-1]){const sh=new T.Group();sh.position.set(s*2.6,12.2,5.6);body.add(sh);add(armF,legM,sh);const el=new T.Group();el.position.set(0,3,9.6);sh.add(el);add(bladeG,chit,el);arms.push({sh,el,s});}
  // the tail: plated, tapering, forked at the tip
  const tail=new T.Group();tail.position.set(0,10.5,-9);body.add(tail);
  const tc=crCurve([[0,0,0],[0,-.8,-4],[0,-1,-8],[0,0,-12],[0,1.6,-15.5]],22);add(crSweep(tc,u=>1.9*(1-u*.78),{sides:12,col:u=>crMix(L('under2'),L('m'),u*.6)}),soft,tail);
  for(let i=0;i<5;i++){const u=.08+i*.18,c=new T.CatmullRomCurve3(tc),p=c.getPoint(u),t=c.getTangent(u),pl=new T.Group();pl.position.copy(p);pl.lookAt(tg.copy(p).add(t));tail.add(pl);const m=add(plateG,chit,pl);const w=3.6*(1-u*.7);m.scale.set(w,1.2*(1-u*.5),1.9*(1-u*.4));m.position.y=1.2*(1-u*.6);}
  const forkG=crSweep(crCurve([[0,0,0],[.6,.4,-1.6],[1.6,1,-2.8],[2.6,1.2,-3.2]],10),u=>.42*(1-u)+.03,{sides:7,col:u=>crMix(L('m'),L('tip'),u)});
  for(const s of[1,-1]){const f=add(forkG,chit,tail);f.position.copy(tc[tc.length-1]);f.scale.set(s*.55,.9,.9);}
  // the legs: two pairs (mid and hind), long and high-kneed, drawn in world space each pose
  const IM=(geo,mat)=>{const m=new T.InstancedMesh(geo,mat,4);m.castShadow=true;m.receiveShadow=true;m.frustumCulled=false;legs.add(m);return m;};
  const G=crCentiGeo(Object.assign({},BROOD,{pal:'hunter'}));
  const S={root,g,body,neck,head,jaws,arms,tail,coxa:IM(G.coxa,legM),fem:IM(G.fem,legM),tib:IM(G.tib,legM),tar:IM(G.tar,legM),
    hips:[[3.4,13,2.8],[-3.4,13,2.8],[3,9,-6.5],[-3,9,-6.5]],len:[[9,9.5,4.5],[9,9.5,4.5],[8,8.5,4.5],[8,8.5,4.5]],feet:[[14,0,10],[-14,0,10],[12.5,0,-12],[-12.5,0,-12]]};
  return S;}
// x,z on the floor, a heading (radians; 0 = facing +z), t the time; o.crouch (front down, arms cocked), o.lunge (stretched out,
// arms reaching), o.jaw (0..1), o.walk (0..1)
function poseStalker(S,x,z,head,t,o={}){
  const cr=o.crouch??0,lu=o.lunge??0,walk=o.walk??0;
  S.g.position.set(x,0,z);S.g.rotation.set(0,head,0);
  S.body.position.set(0,-cr*3.2+lu*1.2,lu*2);S.body.rotation.set(cr*.18-lu*.12,0,Math.sin(t*1.3)*.02);
  S.neck.rotation.set(cr*.25-lu*.25+(o.look??0),Math.sin(t*.9)*.12*(1-cr),0);
  S.jaws.forEach(({pv,s})=>pv.rotation.set(0,s*((o.jaw??.2)*.7-.1),0));
  S.arms.forEach(({sh,el,s})=>{sh.rotation.set(-.15+cr*.4-lu*1.4,s*(.12+lu*.25),s*.12);el.rotation.set(.1-cr*.3+lu*2.0,0,0);});
  S.tail.rotation.set(-.1+cr*.25+Math.sin(t*1.7)*.05,Math.sin(t*1.1)*.25,0);
  S.g.updateMatrixWorld(true);
  const mw=S.body.matrixWorld,gm=S.g.matrixWorld,v=[0,1,2,3,4,5,6,7].map(()=>new T.Vector3()),up=new T.Vector3(0,1,0);
  S.hips.forEach((h,i)=>{const s=h[0]>0?1:-1,hip=v[0].set(...h).applyMatrix4(mw),out=v[1].set(s,-.4,0).transformDirection(gm),t0=v[2].copy(hip).addScaledVector(out,1.4);
    const ph=t*6+i*Math.PI*.5+(i>1?Math.PI:0),sw=Math.sin(ph)*walk,lf=Math.max(0,Math.cos(ph))*walk;
    const f=S.feet[i],ft=v[3].set(f[0],0,f[2]+sw*4+lu*(i<2?3:-2)).applyMatrix4(gm);ft.y=lf*2;
    const pole=v[4].copy(up).multiplyScalar(.6).addScaledVector(out,.9).normalize(),[a,b,c]=S.len[i],kn=crIK(t0,ft,a,b+c,pole,v[5]);
    const fo=v[6].subVectors(ft,kn).normalize().multiplyScalar(b+c).add(kn),ak=v[7].copy(kn).lerp(fo,b/(b+c)).addScaledVector(pole,(b+c)*.07);
    crSeg(_cm,hip,t0,pole,1.15);S.coxa.setMatrixAt(i,_cm);crSeg(_cm,t0,kn,pole,.9);S.fem.setMatrixAt(i,_cm);crSeg(_cm,kn,ak,pole,.72);S.tib.setMatrixAt(i,_cm);crSeg(_cm,ak,fo,pole,.6);S.tar.setMatrixAt(i,_cm);});
  for(const k of['coxa','fem','tib','tar'])S[k].instanceMatrix.needsUpdate=true;}
