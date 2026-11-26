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
const DDRC={gun:0x303235,gunD:0x222426,gunL:0x44474b,bake:0x4a2c1c,wood:0x7a4a26,woodD:0x5e3418,brass:0xb89040,brassD:0x8a6c30,
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
  B.tube(st,C.gunL,[-1.3*k,.05*k,.3*k],[-1.3*k,.05*k,.58*k],.06*k,.06*k,6).cyl(st,C.gunL,.08*k,.36*k,-1.3*k,.05*k,.62*k,'x',L>1?10:6);
  // the grip (bakelite) and the trigger guard; the butt, fish-tailed
  B.ext('matte',C.bake,P([[-1.75,-.36],[-1.2,-.36],[-1.36,-1.26],[-1.98,-1.26]]),.34*k,0,0,0,0,0,0,.08*k);
  B.tube(st,C.gunD,[-1.2*k,-.4*k,0],[-.7*k,-.4*k,0],.035*k,.035*k,4).tube(st,C.gunD,[-.7*k,-.4*k,0],[-.66*k,-.76*k,0],.035*k,.035*k,4).tube(st,C.gunD,[-.66*k,-.76*k,0],[-1.3*k,-.84*k,0],.035*k,.035*k,4);
  B.ext('wood',o.butt||C.woodD,P([[-2.25,.28],[-3.1,.22],[-4.2,.36],[-4.6,.36],[-4.6,-.62],[-4.25,-.62],[-3.3,-.34],[-2.25,-.3]]),.36*k,0,0,0,0,0,0,.1*k);
  // the belt coming in from the left
  if(!o.noBelt)ddrBelt(B,k,L>1?13:L?10:6,-.3,.3,-.72,.06,.75,L>1);
  if(L>1){   // from behind the gun: the cover's ribs, hinge and latch, the sight's notch, the front sight's ears, the butt's plate, the feed tray
    B.both(s=>B.box(st,C.gun,2.0*k,.05*k,.08*k,-.75*k,.555*k,s*.2*k));
    B.box(st,C.gunD,.2*k,.12*k,.3*k,-1.95*k,.5*k,0).cyl(st,C.gunD,.07*k,.74*k,.42*k,.44*k,0,'z',8);
    B.both(s=>B.box(st,C.black,.06*k,.16*k,.1*k,.6*k,.82*k,s*.1*k)).both(s=>B.box(st,C.gunD,.22*k,.3*k,.03*k,6.5*k,.48*k,s*.13*k));
    B.box(st,C.gunD,.08*k,.98*k,.38*k,-4.62*k,-.13*k,0).box(st,C.gunD,.95*k,.06*k,.7*k,-.3*k,.2*k,-.62*k);
    B.both(s=>B.tube(st,C.gunD,[1.4*k,-.36*k,s*.14*k],[5.4*k,-.4*k,s*.16*k],.05*k,.05*k,5));
    B.cyl(st,C.gunL,.36*k,.16*k,-2.27*k,0,0,'x',12);}
  return B;
}
// a belt of cartridges hanging off to the left of the feed: n rounds from x0,y0,z0 (in gun units, times k), each r thick and len long; full: bullets and links too
function ddrBelt(B,k,n,x0,y0,z0,r,len,full,by){
  const C=DDRC,yy=by||0;
  for(let i=0;i<n;i++){const t=i/(n-1),x=(x0-.05*i*(6/n))*k,y=yy+(y0-.25*t-1.5*t*t)*k,z=(z0-.17*i*(6/n)*1.4)*k;
    if(full){B.cyl('brass',C.brass,r*k,len*.72*k,x-len*.14*k,y,z,'x',8).cyl('brass',0x9a6038,r*.9*k,len*.3*k,x+len*.36*k,y,z,'x',8,r*.25*k).box('steel',C.gunD,len*.3*k,r*2.5*k,r*1.2*k,x-len*.1*k,y,z+r*1.1*k);}
    else B.cyl('brass',C.brass,r*k,len*k,x,y,z,'x',5);}
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
// a whole gun on its mount: g (fixed: the legs, the ammunition box), g.ddrTop (turns with the gun: the cradle and the gun), the bore h off the ground.
// (Parts are kept as plain properties, not in userData: three's clone() copies userData through JSON, and the beach's scenery is cloned for the battle next door.)
function ddrMG42(lod,o){
  o=o||{};const S=o.S||DDR_S,h=o.h||11.2;
  const M=ddrModel('mg42|'+(lod||0)+'|'+S+'|'+h,()=>{
    const base=ddrB(lod),top=ddrB(lod),C=DDRC;
    ddrLafetteParts(base,S,h);ddrCradleParts(top,S);
    base.rbox('paint',C.feldD,3.6*S,1.7*S,.85*S,.08*S,-.4*S,.86*S,-2.7*S).tube('steel',C.gunD,[-1.2*S,1.75*S,-2.7*S],[.4*S,1.75*S,-2.7*S],.05*S,.05*S,4);
    ddrMG42Parts(top,S);
    return{base:base.geos(),top:top.geos({lo:.92}),pivot:h};});
  const g=new THREE.Group(),b=ddrPart(M.base),t=ddrPart(M.top);t.position.y=M.pivot;g.add(b);g.add(t);g.ddrTop=t;g.userData.real=true;return g;
}

/* ---------- the Browning M1919A4 (our .30 calibre gun: the nests in Chapter 2) ----------
   The pivot (the pintle under the front of the receiver) at the origin, the bore along +x .25 above it; the grip at the back. */
function ddrM1919Parts(B,S,o){
  o=o||{};const C=DDRC,st='steel',L=B.lod,k=S,by=.25*k,P=a=>a.map(p=>[p[0]*k,p[1]*k+by]);
  // the receiver: a deep flat-sided box, the top cover and its latch, the back plate with the buffer and the pistol grip
  B.rbox(st,C.gun,2.9*k,1.05*k,.5*k,.06*k,-1.45*k,by+.02*k,0);
  B.rbox(st,C.gunL,2.2*k,.14*k,.54*k,.04*k,-1.25*k,by+.62*k,0).box(st,C.gunD,.3*k,.2*k,.4*k,-2.5*k,by+.6*k,0);
  B.cyl(st,C.gunD,.13*k,.36*k,-3.05*k,by+.26*k,0,'x',6);
  B.ext('matte',C.black,P([[-2.9,-.3],[-2.5,-.3],[-2.95,-1.2],[-3.4,-1.2]]),.34*k,0,0,0,0,0,0,.08*k);
  B.tube(st,C.gunD,[-2.5*k,by-.5*k,0],[-2.1*k,by-.56*k,0],.035*k,.035*k,4);
  // the trunnion block, the jacket with its rows of holes, the muzzle bearing, the barrel's tip
  B.rbox(st,C.gun,.62*k,.9*k,.56*k,.05*k,.3*k,by,0);
  B.cyl(st,C.gun,.24*k,4.5*k,2.85*k,by,0,'x',L?14:8);
  {const rows=L?[[.7,.7],[-.7,.7],[.7,-.7],[-.7,-.7],[0,1],[1,0],[-1,0]]:[[0,1],[1,0],[-1,0]],n=L?9:7;
    for(const[z,y]of rows)for(let i=0;i<n;i++)B.box(st,C.black,.2*k,(y?.03:.18)*k+(y&&z?.1*k:0),(z?.03:.18)*k+(y&&z?.1*k:0),(1.0+i*4.0/n+(z&&y?.2:0))*k,by+y*.235*k,z*.235*k);}
  B.cyl(st,C.gunD,.2*k,.34*k,5.27*k,by,0,'x',L?12:8).cyl(st,C.gunD,.1*k,.26*k,5.55*k,by,0,'x',6);
  // the sights: a blade on the trunnion block, a leaf at the back of the receiver; the bolt handle on the right
  B.box(st,C.gunD,.08*k,.34*k,.06*k,.45*k,by+.62*k,0).box(st,C.gunD,.34*k,.1*k,.4*k,-2.45*k,by+.7*k,.05*k);
  if(L>1){   // (from behind the gun the leaf sight lies folded forward on the receiver: standing, it filled the view)
    B.box(st,C.gunD,.5*k,.05*k,.24*k,-2.2*k,by+.78*k,.08*k).box(st,C.gunL,.1*k,.1*k,.1*k,-2.45*k,by+.78*k,.28*k);
    // the cover's latch at the back, the feed's bracket on the left, lines of rivets along the side plates' tops
    B.box(st,C.gunD,.24*k,.08*k,.3*k,-2.2*k,by+.72*k,0).box(st,C.gunD,.7*k,.1*k,.2*k,-.5*k,by+.6*k,-.34*k);
    for(let i=0;i<7;i++)B.both(s=>B.cyl(st,C.gunL,.035*k,.03*k,(-2.6+i*.38)*k,by+.5*k,s*.262*k,'z',6));}
  else B.box(st,C.gunD,.3*k,.5*k,.08*k,-2.45*k,by+.92*k,.12*k);
  B.tube(st,C.gunL,[-.9*k,by+.05*k,.25*k],[-.9*k,by+.05*k,.56*k],.06*k,.06*k,5).ball(st,C.gunL,.09*k,-.9*k,by+.05*k,.6*k);
  // the cloth belt coming in from the left
  if(!o.noBelt){ddrBelt(B,k,L>1?13:L?10:6,-.35,.34,-.6,.055,.72,L>1,by);B.box('matte',0xb8b294,.3*k,.05*k,1.5*k,-.5*k,by+.06*k,-1.0*k,.9,0,0);}
  if(L>1){   // from behind: the cover's latch and hinge, the leaf sight's window, the back plate's bolts
    B.cyl(st,C.gunD,.06*k,.58*k,-.2*k,by+.62*k,0,'z',8);
    B.both(s=>B.cyl(st,C.gunL,.05*k,.04*k,-2.92*k,by+.36*k*s,.16*k,'x',6)).both(s=>B.cyl(st,C.gunL,.05*k,.04*k,-2.92*k,by+.36*k*s,-.16*k,'x',6));}
  return B;
}
// its tripod: a head on a pintle, one leg to the front, two behind with the traversing bar between them, and the screw that sets the gun's height
function ddrTripodParts(B,S,h,col,big){
  const C=DDRC,p='paint',c=col||C.od,k=S,hy=h-.75*k,w=big?1.25:1;
  B.cyl(p,c,.36*k*w,.7*k,0,hy,0,'y',8).cyl('steel',C.gunD,.17*k*w,.6*k,0,hy+.45*k,0,'y',6);
  B.tube(p,c,[.2*k,hy-.2*k,0],[4.4*k,.3,0],.27*k*w,.2*k*w,6).box(p,c,.9*k,.2*k,.8*k,4.5*k,.12,0);
  B.both(s=>B.tube(p,c,[-.2*k,hy-.2*k,s*.25*k],[-4.2*k,.3,s*3.1*k],.27*k*w,.2*k*w,6).box(p,c,.9*k,.2*k,.8*k,-4.3*k,.12,s*3.15*k,0,s*.6,0));
  const bx=-2.6*k,bz=1.85*k,byy=hy*.45;
  B.tube(p,c,[bx,byy,-bz],[bx,byy,bz],.11*k*w,.11*k*w,5).tube('steel',C.gunD,[bx,byy,0],[bx+.3*k,h-.55*k,0],.07*k,.07*k,5).cyl('steel',C.gunL,.2*k,.1*k,bx+.2*k,(byy+h)*.52,0,'y',8);
  return B;
}
function ddrM1919(lod,o){
  o=o||{};const S=o.S||DDR_S,h=o.h||11.2;
  const M=ddrModel('m1919|'+(lod||0)+'|'+S+'|'+h,()=>{
    const base=ddrB(lod),top=ddrB(lod),C=DDRC;
    ddrTripodParts(base,S,h);
    base.rbox('paint',C.odD,2.8*S,1.8*S,.95*S,.08*S,-.3*S,.9*S,-2.5*S).tube('steel',C.gunD,[-1*S,1.86*S,-2.5*S],[.4*S,1.86*S,-2.5*S],.05*S,.05*S,4);
    ddrM1919Parts(top,S);
    return{base:base.geos(),top:top.geos({lo:.92}),pivot:h-.25*S};});
  const g=new THREE.Group(),b=ddrPart(M.base),t=ddrPart(M.top);t.position.y=M.pivot;g.add(b);g.add(t);g.ddrTop=t;g.userData.real=true;return g;
}

/* ---------- the Browning M2 (our .50 calibre gun: the heavy machine gun in Chapter 2) ---------- */
function ddrM2Parts(B,S,o){
  o=o||{};const C=DDRC,st='steel',L=B.lod,k=S,by=.4*k;
  // the receiver, long and deep; the top cover; the back plate with the two spade grips and the trigger between them
  B.rbox(st,C.gun,5.6*k,1.4*k,.8*k,.07*k,-2.2*k,by,0);
  B.rbox(st,C.gunL,2.6*k,.16*k,.84*k,.05*k,-1.0*k,by+.8*k,0).box(st,C.gunD,.3*k,.22*k,.5*k,-2.4*k,by+.8*k,0);
  B.both(s=>{B.tube(st,C.gunD,[-5.0*k,by+.45*k,s*.3*k],[-5.7*k,by+.45*k,s*.36*k],.07*k,.07*k,5).tube(st,C.gunD,[-5.0*k,by-.45*k,s*.3*k],[-5.7*k,by-.45*k,s*.36*k],.07*k,.07*k,5);
    B.cyl('wood',C.woodD,.17*k,.9*k,-5.7*k,by,s*.36*k,'y',L?10:6);});
  B.box(st,C.gunL,.12*k,.5*k,.36*k,-5.2*k,by,0);
  // the barrel support with its holes, the heavy barrel, its carrying handle
  B.cyl(st,C.gun,.42*k,2.3*k,1.75*k,by,0,'x',L?14:8);
  {const rows=L?[[0,1],[1,0],[-1,0],[.7,.7],[-.7,.7]]:[[0,1],[1,0],[-1,0]];for(const[z,y]of rows)for(let i=0;i<4;i++)B.box(st,C.black,.3*k,(y?.03:.3)*k+(y&&z?.16*k:0),(z?.03:.3)*k+(y&&z?.16*k:0),(1.0+i*.5)*k,by+y*.415*k,z*.415*k);}
  B.lathe(st,C.gunD,[[0,.3*k],[.6*k,.27*k],[8.3*k,.22*k],[8.5*k,.22*k]],2.9*k,by,0,'x',L?12:8);
  if(L)B.tube(st,C.gunD,[4.2*k,by+.25*k,0],[4.2*k,by+.7*k,.3*k],.05*k,.05*k,4).cyl('wood',C.woodD,.1*k,.8*k,4.2*k,by+.75*k,.5*k,'z',6);
  // the sights, the charging handle on the right
  B.box(st,C.gunD,.1*k,.4*k,.08*k,.5*k,by+.9*k,0).box(st,C.gunD,.4*k,.6*k,.1*k,-3.9*k,by+1.0*k,0).box(st,C.gunD,.5*k,.12*k,.5*k,-3.9*k,by+.76*k,0);
  B.tube(st,C.gunL,[-2.0*k,by-.2*k,.4*k],[-2.0*k,by-.2*k,.8*k],.07*k,.07*k,5).cyl('wood',C.woodD,.11*k,.4*k,-2.0*k,by-.2*k,.9*k,'x',6);
  // the belt from its box on the left
  if(!o.noBelt)ddrBelt(B,k,L>1?11:L?9:5,-.2,.5,-.75,.085,1.1,L>1,by);
  if(L>1){B.cyl(st,C.gunD,.07*k,.9*k,.2*k,by+.8*k,0,'z',8).box(st,C.black,.04*k,.3*k,.14*k,-3.72*k,by+1.1*k,0);
    B.both(s=>B.box(st,C.gunL,.1*k,.16*k,.14*k,-5.28*k,by+.1*k,s*.1*k));}
  return B;
}
function ddrM2(lod,o){
  o=o||{};const S=o.S||DDR_S*.82,h=o.h||11.4;
  const M=ddrModel('m2|'+(lod||0)+'|'+S+'|'+h,()=>{
    const base=ddrB(lod),top=ddrB(lod),C=DDRC;
    ddrTripodParts(base,S*1.15,h,null,true);
    base.rbox('paint',C.odD,3.2*S,2.0*S,1.6*S,.08*S,-.2*S,1.0*S,-3.0*S).tube('steel',C.gunD,[-1.2*S,2.06*S,-3.0*S],[.8*S,2.06*S,-3.0*S],.06*S,.06*S,4);
    ddrM2Parts(top,S);
    return{base:base.geos(),top:top.geos({lo:.92}),pivot:h-.4*S};});
  const g=new THREE.Group(),b=ddrPart(M.base),t=ddrPart(M.top);t.position.y=M.pivot;g.add(b);g.add(t);g.ddrTop=t;g.userData.real=true;return g;
}

/* ---------- first person behind a mounted gun ----------
   The gun you look along is the real one: it stands on its mount where the gun stands in the world and turns on its pivot as you aim; the camera rides
   behind and above its back end (ddfp.js's fpPose and fpCam ask ddrFpRig and ddrFpFrame). A finer model than the battle's (lod 2), with your hands on it. */
// where the eye is from the gun's pivot, in gun units: eb behind it, eh above it; mz, by: where the muzzle is
const DDR_FP={mg42:{eb:5.8,eh:1.95,mz:7.9,by:0},m1919:{eb:4.7,eh:2.1,mz:5.7,by:.25},m2:{eb:7.4,eh:2.5,mz:11.5,by:.4}};
// a forearm in its sleeve from the elbow e to the wrist w, the palm p and fingers [[a,b],...] (all in gun units, times k)
function ddrArm(B,k,e,w,palm,fingers,o){
  o=o||{};const sk=o.skin||0xb48c6e,cl=o.cloth||0x857f5a,m='matte',K=a=>a.map(v=>v*k),mix=(a,b,t)=>a.map((v,i)=>v+(b[i]-v)*t);
  B.tube(m,cl,K(e),K(mix(e,w,.93)),.72*k,.37*k,12).tube(m,0x6f6a4a,K(mix(e,w,.9)),K(mix(e,w,.955)),.4*k,.38*k,12).tube(m,sk,K(mix(e,w,.94)),K(w),.27*k,.25*k,10);
  B.ball(m,sk,1,palm[0]*k,palm[1]*k,palm[2]*k,(palm[3]||.45)*k,(palm[4]||.2)*k,(palm[5]||.45)*k,10);
  for(const f of fingers){const r0=(f[2]||.1)*k,r1=(f[3]||.085)*k;B.tube(m,sk,K(f[0]),K(f[1]),r0,r1,7);if(f[4])B.tube(m,sk,K(f[1]),K(f[4]),r1,r1*.9,7);const t=f[4]||f[1];B.ball(m,sk,r1*(f[4]?.9:1),t[0]*k,t[1]*k,t[2]*k);B.ball(m,sk,r1,f[1][0]*k,f[1][1]*k,f[1][2]*k);}
  return B;
}
function ddrFpHands(B,kind,k){
  // a finger: from the knuckle a over b to the tip c
  const fg=(a,b,c,r0,r1)=>[a,b,r0||.1,r1||.085,c];
  if(kind==='mg42'){
    // the right hand round the grip, a finger along the guard (the left is under the butt, out of the view: drawn on top of it, it hid the gun)
    ddrArm(B,k,[-6.4,-3.6,3.0],[-2.1,-1.0,.62],[-1.66,-.8,.3,.34,.42,.26],[fg([-1.52,-.52,.3],[-1.16,-.5,.26],[-.95,-.56,.08],.09,.08),fg([-1.46,-.74,.34],[-1.3,-.78,.06],[-1.44,-.8,-.2]),fg([-1.5,-.92,.33],[-1.36,-.96,.06],[-1.5,-.98,-.2]),fg([-1.56,-1.08,.3],[-1.44,-1.12,.06],[-1.56,-1.14,-.18],.09,.08),[[-1.86,-.54,.2],[-1.72,-.4,-.14],.11,.1]]);
  }else if(kind==='m1919'){
    // the right hand on the pistol grip at the back (the left is down at the belt's box, out of the view)
    ddrArm(B,k,[-7.0,-3.4,3.0],[-3.6,-.42,.62],[-3.16,-.3,.3,.34,.42,.26],[fg([-3.0,-.02,.3],[-2.68,-.06,.26],[-2.5,-.12,.08],.09,.08),fg([-2.96,-.24,.34],[-2.82,-.28,.06],[-2.96,-.3,-.2]),fg([-3.02,-.42,.33],[-2.9,-.46,.06],[-3.02,-.48,-.2]),fg([-3.08,-.6,.3],[-2.98,-.64,.06],[-3.08,-.66,-.18],.09,.08),[[-3.36,-.04,.2],[-3.24,.1,-.14],.11,.1]]);
  }else{
    // both hands on the spade grips, the thumbs on the trigger between them
    for(const s of[-1,1])ddrArm(B,k,[-9.4,-2.8,s*3.4],[-6.3,.32,s*.86],[-5.96,.4,s*.52,.26,.42,.3],[fg([-5.76,.72,s*.56],[-5.5,.72,s*.34],[-5.6,.72,s*.14]),fg([-5.74,.52,s*.58],[-5.46,.52,s*.34],[-5.58,.52,s*.12]),fg([-5.74,.32,s*.58],[-5.46,.32,s*.34],[-5.58,.32,s*.12]),fg([-5.76,.12,s*.56],[-5.5,.12,s*.34],[-5.6,.12,s*.14],.09,.08),[[-5.94,.7,s*.26],[-5.5,.46,s*.1],.11,.1]]);
  }
  return B;
}
function ddrFpGun(kind,o){
  o=o||{};const T=THREE,S=o.S||(kind==='m2'?DDR_S*.82:DDR_S),h=o.h||(kind==='m2'?11.4:11.2),key='fp|'+kind+'|'+S+'|'+h;
  const M=DDR.geo[key]||(DDR.geo[key]=(()=>{const base=ddrB(2),cr=ddrB(2),gun=ddrB(2),C=DDRC;let pivot=h,by=0,mz=7.9;
    if(kind==='mg42'){ddrLafetteParts(base,S,h);ddrCradleParts(cr,S);ddrMG42Parts(gun,S);}
    else if(kind==='m1919'){ddrTripodParts(base,S,h);ddrM1919Parts(gun,S);pivot=h-.25*S;by=.25;mz=5.7;}
    else{ddrTripodParts(base,S*1.15,h,null,true);ddrM2Parts(gun,S);pivot=h-.4*S;by=.4;mz=11.5;}
    ddrFpHands(gun,kind,S);
    return{base:base.geos(),cr:cr.count()?cr.geos({lo:.95}):null,gun:gun.geos({lo:.95,tile:7}),pivot,by,mz};})());
  const g=new T.Group(),b=ddrPart(M.base),top=new T.Group(),rec=ddrPart(M.gun);top.position.y=M.pivot;g.add(b);g.add(top);top.add(rec);if(M.cr)top.add(ddrPart(M.cr));
  // (the flash and the smoke at the muzzle are the battle's own: ddfx.js, from ddrMuzzle)
  const f=new T.Group();f.visible=false;rec.add(f);
  g.traverse(q=>{q.frustumCulled=false;});
  g.ddrTop=top;g.ddr={top,rec,flash:f,S,h,pivot:M.pivot};g.userData={kind,own:true,real:true};return g;
}

/* ---------- the guns that stand in the world: who is on each, the gun turning with its gunner ----------
   ddrGun(kind,x,y,h0,ang,o) makes one and remembers it; ddrGunsFrame() each frame turns each gun's top to where its gunner aims. */
function ddrGunMake(kind,lod,o){return kind==='m1919'?ddrM1919(lod,o):kind==='m2'?ddrM2(lod,o):ddrMG42(lod,o);}
function ddrGun(kind,x,y,g0,ang,o){
  const g=ddrGunMake(kind,0,o);g.position.set(x,g0,y);g.rotation.y=-ang;g.userData.kind=kind;
  DDR.guns.set(g,{g,kind,x,y,g0,man:null});return g;
}
// a gun that can glow (the checkpoint's, gold while it's yours to take): its own copies of its materials, and one handle that sets them all
function ddrGlow(g){
  const M=[];g.traverse(o=>{if(o.isMesh&&o.material){o.material=o.material.clone();o.material.userData.ddKeep=true;if(typeof DDL_SEEN!=='undefined')DDL_SEEN.add(o.material);M.push(o.material);}});
  return{emissive:{setHex:h=>{for(const m of M)m.emissive.setHex(h);}},set emissiveIntensity(v){for(const m of M)m.emissiveIntensity=v*.45;},get emissiveIntensity(){return M[0]?M[0].emissiveIntensity/.45:0;}};
}
function ddrReset(){DDR.guns.clear();DDR.t=0;}
// made once while a chapter is built, so the first tank or truck to appear in a fight doesn't cost a long frame (a tank's shapes and paint take a fifth of a second here)
function ddrWarm(){if(!ddReal())return;try{if(typeof ddrTank==='function')ddrTank('panzer');if(typeof ddrVehTruck==='function'&&typeof DD_MODE!=='undefined'&&DD_MODE==='village')ddrVehTruck('opel',0);}catch(e){}}
function ddrGunOf(u){
  if(!u||!u.onGun)return null;let best=null,bd=20;
  for(const G of DDR.guns.values()){if(!G.g.parent)continue;const d=Math.hypot(G.g.position.x-u.onGun.x,G.g.position.z-u.onGun.y);if(d<bd){bd=d;best=G;}}
  return best;
}
function ddrGunsFrame(rdt){
  if(!DDR.guns.size)return;DDR.t-=rdt;
  if(DDR.t<=0){DDR.t=.3;for(const G of DDR.guns.values()){if(!G.g.parent){DDR.guns.delete(G.g);continue;}G.man=null;}
    if(typeof units!=='undefined')for(const u of units){if(!u.onGun||u.dead||u.downed){u.ddrG=null;continue;}const G=ddrGunOf(u);if(G&&!G.man)G.man=u;u.ddrG=G&&G.man===u?G:null;}}
  const k=Math.min(1,rdt*9);
  for(const G of DDR.guns.values()){const t=G.g.ddrTop;if(!t)continue;const u=G.man;let want=0,rec=0;
    if(u&&u.onGun&&!u.dead){const a0=-G.g.rotation.y;want=-Math.atan2(Math.sin(u.ang-a0),Math.cos(u.ang-a0));if(typeof simT!=='undefined'&&simT-(u.shotT??-9)<.07)rec=.35;}
    t.rotation.y+=(want-t.rotation.y)*k;t.position.x=-rec*Math.cos(t.rotation.y);t.position.z=rec*Math.sin(t.rotation.y);}
}
// where his gun's muzzle is in the world (post.js's muzzleAt asks: the flash and the smoke come from the real barrel's end)
function ddrMuzzle(u,out){
  if(!ddReal()||!u||!u.onGun)return null;const F=typeof dd!=='undefined'&&dd&&dd.fp&&dd.fp.u===u?dd.fp:null,m=F&&F.rg?F.rg:u.ddrG&&u.ddrG.g;if(!m||!m.ddrTop)return null;
  const E=DDR_FP[m.userData.kind]||DDR_FP.mg42,S=m.userData.kind==='m2'?DDR_S*.82:DDR_S,t=F&&F.rg?m.ddr.rec:m.ddrTop;t.updateWorldMatrix(true,false);return t.localToWorld(out.set((E.mz+.4)*S,E.by*S,0));
}
// first person: the gun this man is on, if it's one of these
function ddrFpRig(u){
  if(!ddReal()||!u||!u.onGun)return null;const G=ddrGunOf(u);if(!G)return null;
  const E=DDR_FP[G.kind]||DDR_FP.mg42,S=G.kind==='m2'?DDR_S*.82:DDR_S,top=G.g.ddrTop;
  return{G,x:G.g.position.x,y:G.g.position.y+(top?top.position.y:11),z:G.g.position.z,eb:E.eb*S,eh:E.eh*S,S};
}
function ddrFpFrame(F,P,shot){
  const R=P.rig,G=R.G,T=THREE;
  if(!F.rg||F.rgG!==G){ddrFpOff(F);F.rg=ddrFpGun(G.kind);F.rgG=G;(G.g.parent||scene).add(F.rg);}
  const m=F.rg,U=m.ddr;G.g.visible=false;m.visible=true;m.position.copy(G.g.position);m.rotation.y=G.g.rotation.y;
  const a0=-G.g.rotation.y,pe=F.p+F.kick;U.top.rotation.set(0,-Math.atan2(Math.sin(F.a-a0),Math.cos(F.a-a0)),pe,'YZX');
  F.rk=(F.rk||0)*.72+(shot?.5:0);U.rec.position.x=-F.rk*U.S*.5;U.flash.visible=!!shot;if(shot)U.flash.rotation.x=Math.random()*6;
}
function ddrFpOff(F){if(!F||!F.rg)return;if(F.rg.parent)F.rg.parent.remove(F.rg);if(F.rgG&&F.rgG.g)F.rgG.g.visible=true;F.rg=null;F.rgG=null;}

/* ---------- wiring the other pieces in (the builders are in ddrart.js, ddrtank.js, ddrveh.js; missing, the old model is drawn) ---------- */
const ddrHas=f=>ddReal()&&typeof window[f]==='function';
const ddrMeshes=g=>{const L=[];g.traverse(o=>{if(o.isMesh)L.push(o);});return L;};
// a piece that goes into the beach's scenery, which three's clone() copies for the battle next door, userData through JSON: anything in its userData that
// isn't plain (a part, a function) is moved to a property of the same name with 'ddr_' in front
function ddrPlain(g){g.traverse(o=>{const U=o.userData;for(const k in U){const v=U[k];if(v&&(typeof v==='function'||v.isObject3D||v.isMaterial||v.isBufferGeometry)){o['ddr_'+k]=v;delete U[k];}}});return g;}
// a gun of theirs on the beach's top (dday.js's 'ddgun' objects, by tag): the piece, pointing out to sea (south) or east
function ddrPlaceGun(o,cx,cy,g0,G){
  const f={heavy:'ddrArtCoast',art:'ddrArtLeFH18',cannon:'ddrArtPak40',aa:'ddrArtFlak38'}[o.tag];if(!f||!ddrHas(f))return null;
  const g=window[f](0);g.position.set(cx,g0,cy);g.rotation.y=o.east?0:-Math.PI/2;g.ddrBarrel=g.userData.barrel||null;ddrPlain(g);g.userData.real=true;G.add(g);o.real=g;o.meshes=ddrMeshes(g);o.barrel=null;return g;
}
// knocked out by a blast (ddplay.js's ddBlast): burnt, askew, the barrel down
function ddrGunWreck(o){const g=o.real;if(!g)return false;ddrBurn(g);g.rotation.z+=.1;g.rotation.x+=.05;g.position.y-=.6;const b=g.ddrBarrel;if(b)b.rotation.z-=.22;return true;}
// a mortar by its crew: the tube, and the crate of bombs beside it; ang the way it throws
function ddrPlaceMortar(x,y,g0,ang,G){
  if(!ddrHas('ddrArtMortar'))return null;const g=ddrPlain(ddrArtMortar(0));g.position.set(x,g0,y);g.rotation.y=-ang;g.userData.real=true;G.add(g);
  if(typeof ddrArtMortarKit==='function'){const k=ddrPlain(ddrArtMortarKit(0));k.position.set(x-Math.sin(ang)*9,g0,y+Math.cos(ang)*9);k.rotation.y=-ang+.5;G.add(k);}
  return g;
}

/* ---------- the ships off the beach (ddlook.js's ddScenery): a destroyer and a transport, far out in the haze, so shape before detail ---------- */
function ddrShip(kind){
  const M=ddrModel('ship|'+kind,()=>{const B=ddrB(0),p='paint',dd2=kind==='destroyer',L=dd2?400:440,W=dd2?40:58,H=dd2?20:30,hull=0x7a858e,deck=0x5c646a,dk=0x4a5258,hz=Math.PI/2;
    // the hull from above: a fine bow, a rounded stern; pushed up to the deck's height, a darker strake at the waterline, the deck on top
    const plan=[[L/2,0],[L*.39,W*.3],[L*.22,W/2],[-L*.4,W/2],[-L/2,W*.3],[-L/2,-W*.3],[-L*.4,-W/2],[L*.22,-W/2],[L*.39,-W*.3]];
    B.ext(p,hull,plan,H,0,H/2,0,-hz,0,0).ext(p,0x3c4248,plan.map(q=>[q[0]*1.002,q[1]*1.01]),3,0,1.6,0,-hz,0,0).ext(p,deck,plan.map(q=>[q[0]*.985,q[1]*.94]),1,0,H+.3,0,-hz,0,0);
    B.ext(p,hull,[[L/2,0],[L*.3,W*.42],[L*.3,-W*.42]],6,L*.01,H+3,0,-hz,0,0);
    if(dd2){   // a destroyer: the bridge, two raked funnels, the gun houses fore and aft, a mast, depth-charge racks
      B.box(p,hull,L*.2,16,W*.6,L*.1,H+8,0).box(p,hull,L*.1,12,W*.5,L*.12,H+22,0).box(p,dk,L*.1,2,W*.56,L*.12,H+29,0);
      for(const x of[-L*.03,-L*.15])B.cyl(p,dk,9,26,x,H+14,0,'y',10,8).put(p,new THREE.CylinderGeometry(8.4,8.4,1.4,10),0x2e3236,x,H+27.5,0);
      for(const[x,h]of[[L*.3,6],[L*.23,12],[-L*.3,6],[-L*.37,6]]){B.box(p,hull,22,10,20,x,H+h,0).tube('steel',DDRC.gunD,[x+(x>0?8:-8),H+h+1,0],[x+(x>0?34:-34),H+h+5,0],1.6,1.3,6);}
      B.tube(p,dk,[L*.08,H+28,0],[L*.07,H+78,0],1.6,.9,5).tube(p,dk,[L*.075,H+60,-14],[L*.075,H+60,14],.8,.8,4).box(p,dk,L*.14,8,W*.5,-L*.24,H+4,0);
    }else{   // a transport: the house amidships with its funnel, masts and derricks over the holds, landing craft on the davits along its sides
      B.box(p,0x8a949c,L*.26,20,W*.7,-L*.04,H+10,0).box(p,0x8a949c,L*.16,12,W*.56,-L*.02,H+26,0).box(p,dk,L*.16,2,W*.62,-L*.02,H+33,0);
      B.cyl(p,dk,13,34,-L*.08,H+44,0,'y',10,11).put(p,new THREE.CylinderGeometry(11.6,11.6,2,10),0x2e3236,-L*.08,H+62,0);
      for(const x of[L*.28,L*.14,-L*.24,-L*.36]){B.tube(p,dk,[x,H,0],[x,H+70,0],2.2,1.2,5).both(s=>B.tube(p,dk,[x,H+8,0],[x+(x>0?-1:1)*34,H+48,s*10],1.2,.9,4));}
      B.both(s=>{for(const x of[-L*.14,L*.04])B.box(p,0x6a747c,30,7,9,x,H+12,s*(W/2+3)).tube(p,dk,[x-12,H+2,s*W*.46],[x-12,H+20,s*(W/2+4)],.9,.9,4).tube(p,dk,[x+12,H+2,s*W*.46],[x+12,H+20,s*(W/2+4)],.9,.9,4);});
      B.box(p,deck,L*.12,5,W*.4,L*.2,H+2.5,0).box(p,deck,L*.1,5,W*.4,-L*.3,H+2.5,0);
    }
    return{g:B.geos({lo:.9,tile:60})};});
  const g=ddrPart(M.g,{shadow:false,receive:false});g.userData.real=true;return g;
}
