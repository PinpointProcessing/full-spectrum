"use strict";
/* D-Day, Version 246 (a draft, behind a switch): the stationary weapons and the vehicles made to look like the real things.
   Bryan, with a picture of a first-person view from a bunker behind a machine gun: "Can you make the vehicles and stationary weapons look more
   real? Look at the example I attached. Graphics like this would be awesome". Until now they were a few boxes and cylinders in one dark colour
   (a metal with nothing to reflect, so it drew black).

   This file is the kit everything new is made with, and the machine guns:
   - ddReal(): the switch (Settings on the start card, "New guns and vehicles (draft)"; localStorage warehouseYard.ddreal.v1; ?real=1|0 in the
     address for the tests). Off, nothing here is used and the game draws what it always did.
   - ddrEnv(): the day's sky as a reflection picture, so steel and paint have something to shine with.
   - ddrTex(k), ddrMat(k): the shared pictures (wear and scratches, how rough) and the few materials every model is drawn in:
     'steel' bare gun steel, 'paint' painted metal, 'matte' wood, canvas, rubber, leather, 'glass'. Colours are per part (vertex colours), so a
     whole gun or truck is two or three draw calls.
   - ddrB(lod): a builder. Parts are added by material and colour (box, rbox, tube, cyl, lathe, ext, ball, torus, put), then geos() merges them
     into one geometry a material with the wear picture laid over them by where they are, and a little shade toward the ground.
     lod 0 is the model for the battle's camera (few sides, no rounding), lod 1 the one you see close up or from behind the gun.
   - ddrModel(key, build): made once a page and shared; ddrInst(model) a Group of meshes from it.
   Frame for every model: +x the way it points, +y up, +z its right; the origin on the ground under its pivot. 1 unit = 10 cm. */
const DDR={on:false,env:null,tex:{},mats:{},geo:{},guns:new Map(),t:0};
(function(){try{const q=new URLSearchParams(location.search).get('real'),s=localStorage.getItem('warehouseYard.ddreal.v1');DDR.on=q!=null?q!=='0':s==='1';}catch(e){}})();
const ddReal=()=>DDR.on;
function ddrSet(v){DDR.on=!!v;try{localStorage.setItem('warehouseYard.ddreal.v1',v?'1':'0');}catch(e){}}

/* ---------- the sky to reflect ---------- */
function ddrEnv(){
  if(DDR.env)return DDR.env;if(typeof renderer==='undefined'||!renderer)return null;
  try{const T=THREE,sc=new T.Scene(),g=new T.SphereGeometry(100,48,24),pa=g.attributes.position,C=[],v=new T.Vector3();
    const sun=new T.Vector3(.5,.6,.62).normalize(),zen=new T.Color(.22,.36,.62),hor=new T.Color(.74,.8,.86),gnd=new T.Color(.3,.27,.19),c=new T.Color();
    for(let i=0;i<pa.count;i++){v.fromBufferAttribute(pa,i).normalize();const h=v.y;
      if(h>=0)c.copy(hor).lerp(zen,1-Math.exp(-h*3));else c.copy(hor).lerp(gnd,Math.min(1,-h*7));
      const s=Math.max(0,v.dot(sun)),k=Math.pow(s,40)*3+Math.pow(s,5)*.3;c.r+=k;c.g+=k*.92;c.b+=k*.78;
      // a few clouds' worth of brighter patches, so a curved surface has something to pick up
      const cl=Math.max(0,Math.sin(v.x*5.1+v.z*3.3)*Math.sin(v.z*4.7-v.x*2.1))*Math.max(0,h)*(1-h)*1.2;c.r+=cl*.5;c.g+=cl*.5;c.b+=cl*.48;
      C.push(c.r,c.g,c.b);}
    g.setAttribute('color',new T.Float32BufferAttribute(C,3));sc.add(new T.Mesh(g,new T.MeshBasicMaterial({vertexColors:true,side:T.BackSide})));
    const pm=new T.PMREMGenerator(renderer),rt=pm.fromScene(sc,.04);pm.dispose();g.dispose();DDR.env=rt.texture;}catch(e){DDR.env=null;}
  return DDR.env;
}

/* ---------- pictures: wear (what the colour is multiplied by) and how rough ---------- */
// a picture drawn on a canvas (srgb: a colour picture; not: numbers, like how rough)
function ddrCanvas(w,h,draw,srgb){const T=THREE,c=document.createElement('canvas');c.width=w;c.height=h;draw(c.getContext('2d'),w,h);const x=new T.CanvasTexture(c);x.wrapS=x.wrapT=T.RepeatWrapping;x.encoding=srgb?T.sRGBEncoding:T.LinearEncoding;x.anisotropy=4;return x;}
// the marks painted on things, one picture cut into cells (ddrB's decal(cell,...)): cell -> [u0,v0,u1,v1]
const DDR_MARK={star:[0,.75,.25,1],starc:[.25,.75,.5,1],cross:[.5,.75,.75,1],redx:[.75,.75,1,1],usa:[0,.625,.5,.75],wh:[.5,.625,1,.75],pa:[0,.5,.5,.625],tac:[.5,.5,.625,.625],n3:[.625,.5,.75,.625],stripe:[.75,.5,1,.5625]};
function ddrTex(k){
  if(DDR.tex[k])return DDR.tex[k];const T=THREE,r=rng(k==='wear'?9311:k==='rough'?9317:k==='wood'?9323:9331);let t;
  const cv=ddrCanvas;
  // strokes that wrap round the picture's edges, so the tile has no seam
  const wrap=(q,w,h,fn)=>{for(const ox of[0,-w,w])for(const oy of[0,-h,h]){q.save();q.translate(ox,oy);fn();q.restore();}};
  if(k==='wear')t=cv(256,256,(q,w,h)=>{q.fillStyle='#e6e6e6';q.fillRect(0,0,w,h);
    for(let i=0;i<5200;i++){const v=r()<.5?255:0;q.fillStyle=`rgba(${v},${v},${v},${.02+r()*.05})`;q.fillRect(r()*w,r()*h,1+r()*1.6,1+r()*1.6);}
    for(let i=0;i<26;i++){const x=r()*w,y=r()*h,R=14+r()*34,a=r()*6;wrap(q,w,h,()=>{const g=q.createRadialGradient(x,y,1,x,y,R);g.addColorStop(0,`rgba(0,0,0,${.05+r()*.07})`);g.addColorStop(1,'rgba(0,0,0,0)');q.fillStyle=g;q.beginPath();q.ellipse(x,y,R,R*.6,a,0,7);q.fill();});}
    for(let i=0;i<70;i++){const x=r()*w,y=r()*h,a=r()*6,l=6+r()*40,lt=r()<.7;wrap(q,w,h,()=>{q.strokeStyle=lt?`rgba(255,255,255,${.1+r()*.22})`:`rgba(0,0,0,${.08+r()*.12})`;q.lineWidth=.5+r()*.7;q.beginPath();q.moveTo(x,y);q.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);q.stroke();});}
    for(let i=0;i<90;i++){q.fillStyle=`rgba(255,255,255,${.12+r()*.2})`;q.fillRect(r()*w,r()*h,1+r()*2.4,1+r()*1.2);}},true);
  else if(k==='rough')t=cv(256,256,(q,w,h)=>{q.fillStyle='rgb(255,128,255)';q.fillRect(0,0,w,h);   // (green is how rough; blue left full, the metal's own number stands)
    const r2=rng(9311);   // the same marks as the wear picture, so a scratch is both lighter and shinier
    for(let i=0;i<5200;i++){r2();r2();r2();r2();r2();r2();}
    for(let i=0;i<4200;i++){const v=r()<.5?70:190;q.fillStyle=`rgba(255,${v},255,${.05+r()*.08})`;q.fillRect(r()*w,r()*h,1+r()*2,1+r()*2);}
    for(let i=0;i<30;i++){const x=r()*w,y=r()*h,R=16+r()*38,a=r()*6,up=r()<.6;wrap(q,w,h,()=>{const g=q.createRadialGradient(x,y,1,x,y,R);g.addColorStop(0,`rgba(255,${up?200:60},255,${.25+r()*.25})`);g.addColorStop(1,`rgba(255,${up?200:60},255,0)`);q.fillStyle=g;q.beginPath();q.ellipse(x,y,R,R*.6,a,0,7);q.fill();});}
    for(let i=0;i<80;i++){const x=r()*w,y=r()*h,a=r()*6,l=6+r()*40;wrap(q,w,h,()=>{q.strokeStyle=`rgba(255,48,255,${.3+r()*.4})`;q.lineWidth=.6+r()*.8;q.beginPath();q.moveTo(x,y);q.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);q.stroke();});}},false);
  else if(k==='wood')t=cv(256,128,(q,w,h)=>{const g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,'#f2f2f2');g.addColorStop(.5,'#d8d8d8');g.addColorStop(1,'#ececec');q.fillStyle=g;q.fillRect(0,0,w,h);
    for(let i=0;i<150;i++){let y=r()*h;const dk=r()<.6;q.strokeStyle=dk?`rgba(40,20,6,${.08+r()*.22})`:`rgba(255,240,220,${.06+r()*.14})`;q.lineWidth=.5+r()*1.8;q.beginPath();q.moveTo(-2,y);for(let x=0;x<=w+8;x+=16){y+=(r()-.5)*4;q.lineTo(x,y);}q.stroke();}
    for(let i=0;i<7;i++){const x=r()*w,y=r()*h;wrap(q,w,h,()=>{q.fillStyle=`rgba(30,14,4,${.14+r()*.16})`;q.beginPath();q.ellipse(x,y,9+r()*16,2+r()*3,0,0,7);q.fill();});}},true);
  else if(k==='marks')t=cv(512,512,(q,w,h)=>{q.clearRect(0,0,w,h);const W='#e8e6da',cell=(c,fn)=>{const m=DDR_MARK[c];q.save();q.translate(m[0]*w,(1-m[3])*h);fn((m[2]-m[0])*w,(m[3]-m[1])*h);q.restore();};
    const star=(cx,cy,R)=>{q.beginPath();for(let i=0;i<10;i++){const a=-Math.PI/2+i*Math.PI/5,rr=i%2?R*.4:R;q.lineTo(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr);}q.closePath();q.fill();};
    cell('star',(a,b)=>{q.fillStyle=W;star(a/2,b/2+3,a*.44);});
    cell('starc',(a,b)=>{q.fillStyle=W;star(a/2,b/2+2,a*.34);q.strokeStyle=W;q.lineWidth=7;q.beginPath();q.arc(a/2,b/2,a*.42,0,7);q.stroke();});
    cell('cross',(a,b)=>{q.fillStyle=W;q.fillRect(a*.34,a*.08,a*.32,a*.84);q.fillRect(a*.08,a*.34,a*.84,a*.32);q.fillStyle='#161616';q.fillRect(a*.4,a*.12,a*.2,a*.76);q.fillRect(a*.12,a*.4,a*.76,a*.2);});
    cell('redx',(a,b)=>{q.fillStyle=W;q.beginPath();q.arc(a/2,b/2,a*.46,0,7);q.fill();q.fillStyle='#a02018';q.fillRect(a*.4,a*.16,a*.2,a*.68);q.fillRect(a*.16,a*.4,a*.68,a*.2);});
    const text=(c,str,col,bg,font)=>cell(c,(a,b)=>{if(bg){q.fillStyle=bg;q.fillRect(2,4,a-4,b-8);}q.fillStyle=col;q.font=font||`700 ${Math.round(b*.6)}px Arial,Helvetica,sans-serif`;q.textAlign='center';q.textBaseline='middle';q.fillText(str,a/2,b/2+2,a-10);});
    text('usa','USA 4718256',W);text('wh','WH-271 386','#161616',W);text('pa','PA 26-12',W);
    cell('tac',(a,b)=>{q.fillStyle='#d8b820';q.beginPath();q.arc(a/2,b/2,a*.44,0,7);q.fill();q.fillStyle='#161616';q.font=`700 ${Math.round(b*.6)}px Arial,sans-serif`;q.textAlign='center';q.textBaseline='middle';q.fillText('9',a/2,b/2+2);});
    text('n3','321',W,null,'700 34px Arial,sans-serif');
    cell('stripe',(a,b)=>{q.fillStyle=W;q.fillRect(0,0,a,b);});
    // worn: bits of the paint gone
    q.globalCompositeOperation='destination-out';for(let i=0;i<2600;i++){q.fillStyle=`rgba(0,0,0,${.25+r()*.5})`;q.fillRect(r()*w,r()*h*.5,1+r()*2.5,1+r()*2);}q.globalCompositeOperation='source-over';},true);
  return DDR.tex[k]=t;
}

/* ---------- the materials ----------
   r is multiplied by the rough picture (about .5), m how metallic, e how much of the sky it shows; a model may add its own with ddrMatDef (a camouflage
   picture, say: map, and tile, how many units the picture covers, laid over the model by where its parts are). */
const DDR_DEF={steel:{r:.86,m:.82,e:1},paint:{r:1.22,m:.3,e:.6},matte:{r:1.7,m:0,e:.22},wood:{r:1.25,m:0,e:.3,map:'wood'},glass:{r:.3,m:.2,e:1.4},brass:{r:.7,m:.95,e:1.1},
  decal:{r:1.5,m:.05,e:.2,map:'marks',alphaTest:.35,decal:1,noRough:1}};
function ddrMatDef(k,o){DDR_DEF[k]=o;delete DDR.mats[k];delete DDR.mats['burnt_'+k];return k;}
function ddrMat(k){
  if(DDR.mats[k])return DDR.mats[k];const T=THREE,env=ddrEnv(),O=DDR_DEF[k]||{r:1.2,m:.2,e:.5};
  const map=O.map&&O.map.isTexture?O.map:ddrTex(O.map||'wear');
  const m=new T.MeshStandardMaterial({color:O.color==null?0xffffff:O.color,vertexColors:true,map,roughnessMap:O.noRough?null:ddrTex('rough'),roughness:O.noRough?O.r*.5:O.r,metalness:O.m,envMap:env,envMapIntensity:O.e,side:O.side||T.FrontSide});
  if(O.alphaTest){m.alphaTest=O.alphaTest;m.transparent=false;}
  if(O.decal){m.polygonOffset=true;m.polygonOffsetFactor=-2;m.polygonOffsetUnits=-2;}
  if(O.normalMap){m.normalMap=O.normalMap;m.normalScale=new T.Vector2(O.ns||.5,O.ns||.5);}
  m.userData.ddKeep=true;m.userData.ddr=k;return DDR.mats[k]=m;
}
// the same material gone to char and rust (a knocked-out gun or vehicle): its own copy, the colours pulled to burnt brown-grey, never black
function ddrBurnt(k){
  const key='burnt_'+k;if(DDR.mats[key])return DDR.mats[key];const m=ddrMat(k).clone();m.color.setRGB(.5,.4,.33);m.roughness=1.9;m.metalness=Math.min(.25,m.metalness);m.envMapIntensity=.15;m.userData.ddKeep=true;
  if(typeof DDL_SEEN!=='undefined')DDL_SEEN.add(m);return DDR.mats[key]=m;
}

/* ---------- merging parts ---------- */
function ddrMerge(parts){
  const T=THREE,P=[],N=[],C=[],U=[],v=new T.Vector3(),m4=new T.Matrix4(),n3=new T.Matrix3(),q=new T.Quaternion(),e=new T.Euler(),s3=new T.Vector3(),col=new T.Color(),I=[0,1,2],J=[0,2,1];
  for(const p of parts){const g=p.g.index?p.g.toNonIndexed():p.g,pa=g.attributes.position,na=g.attributes.normal,ua=g.attributes.uv;
    if(p.m)m4.copy(p.m);else{e.set(p.r[0],p.r[1],p.r[2]);q.setFromEuler(e);m4.compose(v.set(p.p[0],p.p[1],p.p[2]),q,s3.set(p.s[0],p.s[1],p.s[2]));}
    n3.getNormalMatrix(m4);col.set(p.c==null?0xffffff:p.c).convertSRGBToLinear();const ord=m4.determinant()<0?J:I;
    for(let t=0;t<pa.count;t+=3)for(const o of ord){const i=t+o;
      v.fromBufferAttribute(pa,i).applyMatrix4(m4);P.push(v.x,v.y,v.z);v.fromBufferAttribute(na,i).applyMatrix3(n3).normalize();N.push(v.x,v.y,v.z);C.push(col.r,col.g,col.b);
      // a part that brings its own picture coordinates says so (uv: [su,sv,ou,ov]); the rest get theirs from where they are (ddrProject)
      if(p.uv&&ua)U.push(ua.getX(i)*p.uv[0]+p.uv[2],ua.getY(i)*p.uv[1]+p.uv[3],1);else U.push(0,0,0);}
    if(g!==p.g)g.dispose();if(!p.keep)p.g.dispose();}
  const G=new T.BufferGeometry();G.setAttribute('position',new T.Float32BufferAttribute(P,3));G.setAttribute('normal',new T.Float32BufferAttribute(N,3));G.setAttribute('color',new T.Float32BufferAttribute(C,3));
  G.userData.uvw=U;return G;
}
// picture coordinates from where each corner is, by the way its face looks: the wear runs on across the parts (tile: units a picture)
function ddrProject(G,tile,wood){
  const pa=G.attributes.position,na=G.attributes.normal,W=G.userData.uvw||[],U=[];
  for(let i=0;i<pa.count;i++){if(W[i*3+2]){U.push(W[i*3],W[i*3+1]);continue;}
    const x=pa.getX(i),y=pa.getY(i),z=pa.getZ(i),ax=Math.abs(na.getX(i)),ay=Math.abs(na.getY(i)),az=Math.abs(na.getZ(i));
    if(wood)U.push(x/(tile*2.2),(y+z*.8)/(tile*.7));   // (the grain runs along the piece)
    else if(ax>=ay&&ax>=az)U.push(z/tile,y/tile);else if(ay>=az)U.push(x/tile,z/tile);else U.push(x/tile,y/tile);}
  G.setAttribute('uv',new THREE.Float32BufferAttribute(U,2));delete G.userData.uvw;return G;
}

/* ---------- the builder ---------- */
function ddrB(lod){
  const T=THREE,L={},B={lod:lod||0},hz=Math.PI/2,_a=new T.Vector3(),_b=new T.Vector3(),_d=new T.Vector3(),_up=new T.Vector3(0,1,0),_q=new T.Quaternion(),_m=new T.Matrix4(),_s=new T.Vector3(1,1,1);
  const N=(n0,n1)=>B.lod?(n1||Math.round(n0*1.8)):n0;   // how many sides: the battle's camera, close up
  B.N=N;
  B.put=(mk,g,c,x,y,z,rx,ry,rz,sx,sy,sz,o)=>{(L[mk]||(L[mk]=[])).push(Object.assign({g,c,p:[x||0,y||0,z||0],r:[rx||0,ry||0,rz||0],s:[sx??1,sy??1,sz??1]},o||{}));return B;};
  B.box=(mk,c,w,h,d,x,y,z,rx,ry,rz)=>B.put(mk,new T.BoxGeometry(w,h,d),c,x,y,z,rx,ry,rz);
  // a box with its edges rounded off (close up only: at the battle's distance a plain box, a ninth of the triangles)
  B.rbox=(mk,c,w,h,d,r,x,y,z,rx,ry,rz)=>B.put(mk,B.lod&&typeof rbox==='function'?rbox(w,h,d,r):new T.BoxGeometry(w,h,d),c,x,y,z,rx,ry,rz);
  // a round bar from a to b, ra thick at a and rb at b (n sides)
  B.tube=(mk,c,a,b,ra,rb,n,open)=>{_a.set(a[0],a[1],a[2]);_b.set(b[0],b[1],b[2]);_d.subVectors(_b,_a);const l=_d.length();if(l<1e-4)return B;
    _q.setFromUnitVectors(_up,_d.normalize());_m.compose(_a.addScaledVector(_d,l/2),_q,_s);
    (L[mk]||(L[mk]=[])).push({g:new T.CylinderGeometry(rb==null?ra:rb,ra,l,N(n||8),1,!!open),c,m:_m.clone()});return B;};
  // a cylinder along an axis ('x','y','z'), centred at x,y,z
  B.cyl=(mk,c,r,len,x,y,z,ax,n,r2)=>B.put(mk,new T.CylinderGeometry(r2==null?r:r2,r,len,N(n||10)),c,x,y,z,ax==='z'?hz:0,0,ax==='x'?-hz:0);
  // a turned shape: prof [[t,r],...] along the axis from x,y,z (t along the axis, r the radius there)
  B.lathe=(mk,c,prof,x,y,z,ax,n)=>{const g=new T.LatheGeometry(prof.map(p=>new T.Vector2(Math.max(.0001,p[1]),p[0])),N(n||10));return B.put(mk,g,c,x,y,z,ax==='z'?hz:0,0,ax==='x'?-hz:0);};
  // an outline (x,y points) pushed through th along z, centred on z; bev rounds its edges close up
  B.ext=(mk,c,pts,th,x,y,z,rx,ry,rz,bev)=>{const s=new T.Shape();s.moveTo(pts[0][0],pts[0][1]);for(let i=1;i<pts.length;i++)s.lineTo(pts[i][0],pts[i][1]);s.closePath();
    const bv=B.lod&&bev?Math.min(bev,th*.45):0,g=new T.ExtrudeGeometry(s,{depth:th-bv*2,bevelEnabled:bv>0,bevelSize:bv,bevelThickness:bv,bevelSegments:2,steps:1});g.translate(0,0,-(th-bv*2)/2);return B.put(mk,g,c,x,y,z,rx,ry,rz);};
  B.ball=(mk,c,r,x,y,z,sx,sy,sz,n)=>B.put(mk,new T.SphereGeometry(r,N(n||8),Math.max(4,Math.round(N(n||8)*.7))),c,x,y,z,0,0,0,sx,sy,sz);
  B.torus=(mk,c,R,r,x,y,z,rx,ry,rz,arc,n,m)=>B.put(mk,new T.TorusGeometry(R,r,N(m||5),N(n||12),arc||Math.PI*2),c,x,y,z,rx,ry,rz);
  // a painted mark (a cell of the marks picture) w by h, flat, facing +z before it's turned: a star, a cross, a number
  B.decal=(cell,w,h,x,y,z,rx,ry,rz,c)=>{const m=DDR_MARK[cell]||DDR_MARK.star;return B.put('decal',new T.PlaneGeometry(w,h),c==null?0xdcdace:c,x,y,z,rx,ry,rz,1,1,1,{uv:[m[2]-m[0],m[3]-m[1],m[0],m[1]]});};
  // a road wheel on its axle along z, centred at x,y,z: the tyre, the rim in col, the hub (w wide, r the tyre's radius; o.spokes a spoked rim, o.dual two tyres side by side)
  B.wheel=(col,r,w,x,y,z,o)=>{o=o||{};const n=N(o.n||12,18),C=DDRC,rr=r*(o.rim||.62),one=(zz,ww)=>{
      B.lathe('matte',C.rubber,[[-ww/2,rr*.96],[-ww/2,r*.9],[-ww*.36,r],[ww*.36,r],[ww/2,r*.9],[ww/2,rr*.96]],x,y,zz,'z',n);
      B.lathe('paint',col,[[-ww*.3,.01],[-ww*.34,rr*.5],[-ww*.42,rr],[ww*.42,rr],[ww*.34,rr*.5],[ww*.3,.01]],x,y,zz,'z',n);
      B.cyl('paint',col,r*.16,ww*1.05,x,y,zz,'z',8);};
    if(o.dual){one(z-w*.27,w*.48);one(z+w*.27,w*.48);}else one(z,w);
    if(B.lod&&!o.plain)for(let i=0;i<5;i++){const a=i*Math.PI*2/5;for(const s of[-1,1])B.cyl('steel',C.gunD,r*.035,w*.06,x+Math.cos(a)*r*.3,y+Math.sin(a)*r*.3,z+s*w*.45*(o.dual?1.1:1),'z',5);}
    return B;};
  // the same thing on both sides: fn(s) is called with s -1 and 1
  B.both=fn=>{for(const s of[-1,1])fn(s);return B;};
  B.count=()=>{let n=0;for(const k in L)for(const p of L[k]){const g=p.g;n+=(g.index?g.index.count:g.attributes.position.count)/3;}return n;};
  // merged: {material: geometry}, shaded a little darker toward the ground (lo at the bottom, hi at the top) and under overhangs
  B.geos=(o)=>{o=o||{};const out={};let y0=1e9,y1=-1e9;
    for(const k in L){const G=ddrMerge(L[k]),D=DDR_DEF[k]||{};ddrProject(G,D.tile||o.tile||(B.lod?9:13),k==='wood');out[k]=G;const pa=G.attributes.position;for(let i=0;i<pa.count;i++){const y=pa.getY(i);if(y<y0)y0=y;if(y>y1)y1=y;}}
    const lo=o.lo??.8,hi=o.hi??1.04;
    for(const k in out){const G=out[k],pa=G.attributes.position,na=G.attributes.normal,ca=G.attributes.color;
      for(let i=0;i<pa.count;i++){const t=clamp((pa.getY(i)-y0)/((y1-y0)||1),0,1),ny=na.getY(i),s=(lo+(hi-lo)*Math.pow(t,.7))*(ny<-.4?.8:1);ca.setXYZ(i,ca.getX(i)*s,ca.getY(i)*s,ca.getZ(i)*s);}
      G.computeBoundingSphere();G.computeBoundingBox();}
    return out;};
  return B;
}
// a model, made once and shared: build() returns {part:{material:geometry}} (parts that move apart from each other: 'base', 'top'...) and anything else it wants kept
function ddrModel(key,build){return DDR.geo[key]||(DDR.geo[key]=build());}
// meshes for one part of a model, in a group
function ddrPart(geos,o){
  const T=THREE,g=new T.Group();o=o||{};
  for(const k in geos){const m=new T.Mesh(geos[k],o.burnt?ddrBurnt(k):ddrMat(k));m.castShadow=o.shadow!==false;m.receiveShadow=o.receive!==false;m.userData.ddrK=k;g.add(m);}
  return g;
}
// knocked out: every mesh under g drawn in its material's burnt copy
function ddrBurn(g){if(g)g.traverse(o=>{if(o.isMesh&&o.userData.ddrK&&o.material)o.material=ddrBurnt(o.userData.ddrK);});}
const ddrTris=g=>{let n=0;g.traverse(o=>{if(o.isMesh&&o.geometry)n+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;});return n;};

// how much bigger than life the guns on mounts are drawn: the men are chunky, and a gun at its true size reads as a stick beside them
const DDR_S=1.45;
/* ---------- colours ---------- */
const DDRC={gun:0x34373b,gunD:0x25272a,gunL:0x4a4e54,bake:0x4a2c1c,wood:0x7a4a26,woodD:0x5e3418,brass:0xb89040,brassD:0x8a6c30,
  feld:0x565f52,feldD:0x3e463c,gelb:0xb59a5c,gelbD:0x8f7846,od:0x5a6038,odD:0x454a2c,odL:0x6d7346,canvas:0x8f8a62,canvasD:0x6f6a48,web:0x8a8256,
  rubber:0x1f1f1e,leather:0x5a3c24,rust:0x7a4a2c,black:0x18191a,white:0xe6e4d8,red:0x8a2a20,tan:0xa89a6c};

/* ---------- the MG42 (the German machine gun: every gun of theirs on the beach, at the checkpoint, in the village) ----------
   S is how much bigger than life it's drawn (the men are chunky; a gun at its true size reads as a stick). The gun's own frame: the bore along +x,
   the pivot (where it sits on its mount) at the origin, the grip behind it. */
function ddrMG42Parts(B,S,o){
  o=o||{};const C=DDRC,st='steel',L=B.lod,k=S,P=a=>a.map(p=>[p[0]*k,p[1]*k]);
  // the jacket over the barrel: a squared tube with its cooling slots, the muzzle's cone, the front sight
  B.rbox(st,C.gun,6.1*k,.62*k,.56*k,.1*k,4.05*k,0,0);
  for(let i=0;i<5;i++)B.both(s=>B.box(st,C.black,.78*k,.22*k,.03*k,(2.0+i*1.02)*k,0,s*.285*k));
  if(L)for(let i=0;i<5;i++)B.box(st,C.black,.78*k,.03*k,.2*k,(2.0+i*1.02)*k,.315*k,0);
  B.lathe(st,C.gunD,[[0,.2*k],[.25*k,.2*k],[.3*k,.3*k],[.75*k,.36*k],[.8*k,.3*k],[.82*k,.16*k]],7.05*k,0,0,'x',L?14:8);
  B.box(st,C.gunD,.14*k,.42*k,.1*k,6.5*k,.5*k,0).box(st,C.gunD,.34*k,.1*k,.3*k,6.5*k,.33*k,0);
  // the receiver, its top cover and the feed on the left, the rear sight, the cocking handle on the right
  B.rbox(st,C.gun,3.3*k,.74*k,.6*k,.1*k,-.62*k,-.02*k,0);
  B.rbox(st,C.gunL,2.3*k,.2*k,.7*k,.06*k,-.75*k,.44*k,0);
  B.box(st,C.gunD,.9*k,.16*k,.5*k,-.3*k,.3*k,-.5*k).box(st,C.gunD,.5*k,.5*k,.12*k,-.3*k,0,-.36*k);
  B.box(st,C.gunD,.5*k,.26*k,.16*k,.75*k,.48*k,0).box(st,C.gunD,.1*k,.3*k,.3*k,.6*k,.6*k,0);
  B.tube(st,C.gunL,[-1.3*k,.05*k,.3*k],[-1.3*k,.05*k,.62*k],.07*k,.07*k,6).cyl(st,C.gunL,.1*k,.3*k,-1.3*k,.05*k,.66*k,'x',6);
  // the grip (bakelite) and the trigger guard; the butt, fish-tailed
  B.ext('matte',C.bake,P([[-1.75,-.36],[-1.2,-.36],[-1.36,-1.26],[-1.98,-1.26]]),.34*k,0,0,0,0,0,0,.08*k);
  B.tube(st,C.gunD,[-1.2*k,-.4*k,0],[-.7*k,-.4*k,0],.035*k,.035*k,4).tube(st,C.gunD,[-.7*k,-.4*k,0],[-.66*k,-.76*k,0],.035*k,.035*k,4).tube(st,C.gunD,[-.66*k,-.76*k,0],[-1.3*k,-.84*k,0],.035*k,.035*k,4);
  B.ext('wood',o.butt||C.woodD,P([[-2.25,.28],[-3.1,.22],[-4.2,.36],[-4.6,.36],[-4.6,-.62],[-4.25,-.62],[-3.3,-.34],[-2.25,-.3]]),.36*k,0,0,0,0,0,0,.1*k);
  // the belt coming in from the left
  if(!o.noBelt){const n=L?10:6;for(let i=0;i<n;i++){const t=i/(n-1);B.cyl('brass',C.brass,.06*k,.75*k,(-.3-.05*i)*k,(.3-.25*t-1.5*t*t)*k,(-.72-.17*i*(6/n)*1.4)*k,'x',5);}}
  return B;
}
// the Lafette-style mount: a head on a pivot over a sturdy frame, two padded legs to the front and two behind, braced; h is how high the bore is off the ground
function ddrLafetteParts(B,S,h,col){
  const C=DDRC,p='paint',c=col||C.feld,k=S,top=h-1.0*k,hy=top-.9*k;
  B.cyl(p,c,.46*k,.6*k,0,top-.1*k,0,'y',8).cyl('steel',C.gunD,.26*k,.9*k,0,top-.65*k,0,'y',6);
  B.rbox(p,c,2.0*k,.34*k,1.3*k,.06*k,0,hy,0);
  B.both(s=>{B.tube(p,c,[.7*k,hy,s*.5*k],[4.6*k,.3,s*3.5*k],.3*k,.24*k,6).box('matte',C.leather,1.2*k,.3*k,.9*k,4.7*k,.18,s*3.55*k,0,-s*.6,0);
    B.tube(p,c,[-.7*k,hy,s*.5*k],[-4.0*k,.3,s*2.7*k],.3*k,.24*k,6).box(p,c,1.0*k,.22*k,.8*k,-4.1*k,.13,s*2.75*k,0,s*.55,0);
    B.tube(p,c,[2.65*k,hy*.5,s*2.0*k],[-2.35*k,hy*.5,s*1.6*k],.12*k,.12*k,4);});
  B.tube(p,c,[2.65*k,hy*.5,-2.0*k],[2.65*k,hy*.5,2.0*k],.12*k,.12*k,4).tube(p,c,[-2.35*k,hy*.5,-1.6*k],[-2.35*k,hy*.5,1.6*k],.12*k,.12*k,4);
  return B;
}
// the cradle the gun lies in, and what aims it (these turn with the gun)
function ddrCradleParts(B,S,col){
  const C=DDRC,p='paint',c=col||C.feld,k=S;
  B.box(p,c,3.6*k,.16*k,.56*k,.6*k,-.52*k,0).both(s=>B.box(p,c,3.6*k,.32*k,.08*k,.6*k,-.4*k,s*.38*k));
  B.cyl('steel',C.gunD,.14*k,1.5*k,-1.9*k,-.66*k,0,'x',6).box(p,c,.56*k,.5*k,.56*k,-1.0*k,-.78*k,0);
  if(B.lod)B.cyl('steel',C.gunL,.2*k,.14*k,-1.0*k,-.78*k,.34*k,'z',8);
  return B;
}
// a whole gun on its mount: g (fixed: the legs, the ammunition box), g.userData.top (turns with the gun: the cradle and the gun), the bore h off the ground
function ddrMG42(lod,o){
  o=o||{};const S=o.S||DDR_S,h=o.h||11.2;
  const M=ddrModel('mg42|'+(lod||0)+'|'+S+'|'+h,()=>{
    const base=ddrB(lod),top=ddrB(lod),C=DDRC;
    ddrLafetteParts(base,S,h);ddrCradleParts(top,S);
    base.rbox('paint',C.feldD,3.6*S,1.7*S,.85*S,.08*S,-.4*S,.86*S,-2.7*S).tube('steel',C.gunD,[-1.2*S,1.75*S,-2.7*S],[.4*S,1.75*S,-2.7*S],.05*S,.05*S,4);
    ddrMG42Parts(top,S);
    return{base:base.geos(),top:top.geos({lo:.92}),pivot:h};});
  const g=new THREE.Group(),b=ddrPart(M.base),t=ddrPart(M.top);t.position.y=M.pivot;g.add(b);g.add(t);g.userData.top=t;g.userData.real=true;return g;
}
