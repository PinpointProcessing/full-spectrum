"use strict";
/* The road east's land (Bryan, after v112: "The rocks look weird around the tunnel"; "The lighthouse should on a landmass, not a
   rocky land. (It will be a level later on)"). All of it is only drawn: the nav grid's 'cliff', 'void' and 'water' are road.js's
   as before.
   - The hill the tunnel goes into is ground now, not a pile of faceted rocks: a height field (hillMesh, hillH) from a rocky bank
     at the water's edge up over earth and grass, with pines on it (pineMesh). Over the tunnel's mouth the ground dips to a
     saddle just under the centipedes' path (HILL_SADDLE under road.js's CENTI_PATH, and above the tunnel's roof), and either side
     of the headwall it comes down as an embankment into the water. The ground plane is cut away under it (road.js's
     paintEastAlpha), all but the road into the mouth.
   - The rocks along the shores are natural stones now (stoneMesh: rounded, smooth, darker where they're wet, a little moss on
     top). road.js's rockMesh, faceted, is still the tunnel's broken concrete and Level 4's summit.
   - The lighthouse stands on an island in the lake (ISLE, isleMesh): grass over low earth cliffs, the lighthouse inside a low
     stone wall, the keeper's cottage, a boat shed and a jetty with a rowing boat, a few pines. A level later on. */

// noise: a hash, value noise in 2D and 3D, a few octaves of it (0..1)
const thash=(i,j,k,s)=>{const h=Math.sin(i*127.1+j*311.7+k*74.7+s*19.19)*43758.5453;return h-Math.floor(h);};
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
function vn2(x,y,s=0){const i=Math.floor(x),j=Math.floor(y),u=x-i,v=y-j,fx=u*u*(3-2*u),fy=v*v*(3-2*v),a=thash(i,j,0,s),b=thash(i+1,j,0,s),c=thash(i,j+1,0,s),d=thash(i+1,j+1,0,s);return a+(b-a)*fx+(c-a)*fy+(a-b-c+d)*fx*fy;}
function vn3(x,y,z,s=0){
  const i=Math.floor(x),j=Math.floor(y),k=Math.floor(z),u=x-i,v=y-j,w=z-k,fx=u*u*(3-2*u),fy=v*v*(3-2*v),fz=w*w*(3-2*w),L=(a,b,t)=>a+(b-a)*t;
  return L(L(L(thash(i,j,k,s),thash(i+1,j,k,s),fx),L(thash(i,j+1,k,s),thash(i+1,j+1,k,s),fx),fy),L(L(thash(i,j,k+1,s),thash(i+1,j,k+1,s),fx),L(thash(i,j+1,k+1,s),thash(i+1,j+1,k+1,s),fx),fy),fz);
}
function fbm2(x,y,s=0){let v=0,a=.5,f=1;for(let o=0;o<4;o++){v+=a*vn2(x*f,y*f,s+o*17);f*=2.03;a*=.5;}return v/.9375;}

/* ---------- stones ---------- */
let STONE_GEO={};
function stoneGeo(det){   // a unit sphere with its corners shared, so the stones shade smooth
  if(STONE_GEO[det])return STONE_GEO[det];const p=new T.IcosahedronGeometry(1,det).attributes.position,key=new Map(),pos=[],idx=[];
  for(let i=0;i<p.count;i++){const x=p.getX(i),y=p.getY(i),z=p.getZ(i),k=Math.round(x*1e4)+','+Math.round(y*1e4)+','+Math.round(z*1e4);let j=key.get(k);if(j==null){j=pos.length/3;key.set(k,j);pos.push(x,y,z);}idx.push(j);}
  return STONE_GEO[det]={pos,idx};
}
// natural stones, all in one mesh: [x, z, sx, sy, sz, turn, seed, height of its middle] (road.js's rockMesh takes the same list)
function stoneMesh(list,det=2){
  const U=stoneGeo(det),P=[],C=[],I=[],v=new T.Vector3(),m=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),p=new T.Vector3(),up=new T.Vector3(0,1,0),c=new T.Color(),moss=new T.Color(.05,.065,.032);
  for(const[x,z,sx,sy,sz,ry,seed,y0]of list){
    const base=P.length/3,r=rng(seed),hue=.06+r()*.05,sat=.04+r()*.06,lit=.085+r()*.06,o=(seed%997)*.37;
    q.setFromAxisAngle(up,ry);s.set(sx,sy,sz);p.set(x,y0,z);m.compose(p,q,s);
    for(let i=0;i<U.pos.length;i+=3){
      const ux=U.pos[i],uy=U.pos[i+1],uz=U.pos[i+2],n=vn3(ux*1.6+o,uy*1.6,uz*1.6-o,7)*.62+vn3(ux*4.2-o,uy*4.2+o,uz*4.2,9)*.38,k=.62+.7*n;
      v.set(ux*k,uy*k*(uy<0?.45:.8),uz*k).applyMatrix4(m);P.push(v.x,v.y,v.z);
      c.setHSL(hue,sat,lit*(.5+.7*sstep(-.7,.7,uy))*(.85+.3*n));if(uy>.45)c.lerp(moss,.5*sstep(.45,.95,uy)*n);C.push(c.r,c.g,c.b);   // (darker low down where it's wet, a little moss on top)
    }
    for(const j of U.idx)I.push(base+j);
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setAttribute('color',new T.Float32BufferAttribute(C,3));g.setIndex(I);g.computeVertexNormals();
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.86,metalness:.03}));mesh.castShadow=mesh.receiveShadow=true;return mesh;
}

/* ---------- pines ---------- */
// [x, y, height, ground height, seed]: two cones over a short trunk each, all in two instanced meshes
function pineMesh(list){
  const n=list.length,fol=new T.ConeGeometry(1,1,7,1),tr=new T.CylinderGeometry(.1,.14,1,5);fol.translate(0,.5,0);tr.translate(0,.5,0);
  const F=new T.InstancedMesh(fol,new T.MeshStandardMaterial({color:0xffffff,roughness:.92}),n*2),Tr=new T.InstancedMesh(tr,new T.MeshStandardMaterial({color:0x2b2119,roughness:.95}),n);
  const m=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),p=new T.Vector3(),up=new T.Vector3(0,1,0),c=new T.Color();
  list.forEach(([x,y,h,g,seed],i)=>{const r=rng(seed),lean=(r()-.5)*.08,w=h*(.24+r()*.08);q.setFromAxisAngle(up,r()*6).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(1,0,0),lean));
    s.set(w*.9,h*.3,w*.9);p.set(x,g-1,y);m.compose(p,q,s);Tr.setMatrixAt(i,m);
    s.set(w,h*.62,w);p.set(x,g+h*.18,y);m.compose(p,q,s);F.setMatrixAt(i*2,m);
    s.set(w*.68,h*.5,w*.68);p.set(x,g+h*.5,y);m.compose(p,q,s);F.setMatrixAt(i*2+1,m);
    c.setRGB(.04+r()*.02,.066+r()*.022,.042+r()*.014);F.setColorAt(i*2,c);F.setColorAt(i*2+1,c.multiplyScalar(1.15));});
  for(const M of[F,Tr]){M.castShadow=true;M.receiveShadow=true;M.instanceMatrix.needsUpdate=true;}if(F.instanceColor)F.instanceColor.needsUpdate=true;
  return[F,Tr];
}

/* ---------- the hill ---------- */
const HILL_SADDLE=[[10,49],[30,50],[50,53],[88,62],[140,74],[200,86]];   // the ground over the tunnel's mouth: (depth into the hill from its face, height); under CENTI_PATH, over the tunnel's roof (40)
function saddleH(d){const S=HILL_SADDLE;if(d<=S[0][0])return S[0][1];for(let i=1;i<S.length;i++)if(d<=S[i][0]){const a=S[i-1],b=S[i];return a[1]+(b[1]-a[1])*(d-a[0])/(b[0]-a[0]);}return S[S.length-1][1];}
const HILL_MID=()=>(PORTAL.y0+PORTAL.y1)/2;
function hillH(x,y){
  const dy=Math.abs(y-HILL_MID()),d=x-HILL_X+(vn2(y/38,3.1,5)-.5)*12;   // (d: how far into the hill; a ragged shore)
  const foot=WATER_Y-8,bank=foot+(16-foot)*sstep(-14,24,d),rise=d<24?bank:16+200*(1-Math.exp(-(d-24)/260));
  const n=(fbm2(x/110,y/110,1)-.5)*2,amp=3+20*sstep(20,220,d),swell=30*Math.sin(y/240+1.3)*sstep(90,320,d),top=330*Math.exp(-((x-2060)**2+(y+1460)**2)/135200),h0=rise+n*amp+swell+top;   // (top: the summit, Level 4's, where the zip line comes from: level4.js's l4Cable)
  const w=sstep(152,98,dy)*(d<10?1:sstep(250,180,d));if(w<=0)return h0;   // the saddle over the mouth and the embankments beside the headwall
  const hp=d>=10?saddleH(d):foot+(saddleH(10)-foot)*sstep(-42,10,d);
  return h0+(hp-h0)*w;
}
const HILL_HOLE=(x,y)=>x-HILL_X<10&&Math.abs(y-HILL_MID())<99;   // (in front of the headwall: the road, the bridge's end, the water beside it)
function hillMesh(grp){
  const xs=[],ys=[],X0=HILL_X-60,X1=2200,Y0=-1900,Y1=1250;
  for(let x=X0;x<=X1;x+=12)xs.push(x);for(let y=Y0;y<=Y1;y+=12)ys.push(y);   // (one spacing all over: a finer patch by the mouth showed a seam)
  const nx=xs.length,ny=ys.length,P=new Float32Array(nx*ny*3),UV=new Float32Array(nx*ny*2),I=[];
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i,x=xs[i],y=ys[j];P[k*3]=x;P[k*3+1]=hillH(x,y);P[k*3+2]=y;UV[k*2]=(x-X0)/(X1-X0);UV[k*2+1]=(y-Y0)/(Y1-Y0);}
  for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){if(HILL_HOLE((xs[i]+xs[i+1])/2,(ys[j]+ys[j+1])/2))continue;const a=j*nx+i,b=a+1,c=a+nx,d=c+1;I.push(a,c,b,b,c,d);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setAttribute('uv',new T.BufferAttribute(UV,2));g.setIndex(I);g.computeVertexNormals();
  const N=g.attributes.normal,C=new Float32Array(nx*ny*3),col=new T.Color(),grass=new T.Color(.064,.084,.042),earth=new T.Color(.105,.084,.06),rock=new T.Color(.16,.153,.142),wet=new T.Color(.05,.05,.047),Lx=-.39,Ly=.8,Lz=-.52;   // (L: toward the moon, scene.js's: its light baked in a little so the slopes read at night)
  for(let k=0;k<nx*ny;k++){const x=P[k*3],h=P[k*3+1],y=P[k*3+2],slope=1-N.getY(k),n=vn2(x/9,y/9,4)*.6+vn2(x/31,y/31,6)*.4;
    col.copy(earth).lerp(grass,sstep(.24,.1,slope)*sstep(WATER_Y+6,WATER_Y+20,h)*(.6+.5*n)).lerp(rock,sstep(.2,.46,slope)*(.7+.4*n));
    if(h<WATER_Y+5)col.lerp(wet,sstep(WATER_Y+5,WATER_Y-2,h));col.multiplyScalar((.8+.4*n)*(.42+.8*Math.max(0,N.getX(k)*Lx+N.getY(k)*Ly+N.getZ(k)*Lz)));C[k*3]=col.r;C[k*3+1]=col.g;C[k*3+2]=col.b;}
  g.setAttribute('color',new T.BufferAttribute(C,3));
  const grain=canvasTex(128,128,(x,w,h)=>{const q=rng(77);x.fillStyle='#d8d8d8';x.fillRect(0,0,w,h);for(let i=0;i<2600;i++){const v=150+q()*105|0;x.fillStyle=`rgb(${v},${v},${v})`;x.fillRect(q()*w,q()*h,1+q()*2,1+q()*1.4);}});   // (fine grain over the colours: grass and grit up close)
  grain.repeat.set((X1-X0)/36,(Y1-Y0)/36);
  const mat=wetGround(new T.MeshStandardMaterial({map:grain,vertexColors:true,roughness:.93,metalness:.04}),X1-X0,Y1-Y0,30,.5),mesh=new T.Mesh(g,mat);mesh.castShadow=mesh.receiveShadow=true;grp.add(mesh);
  // pines on it, back from the water and off the saddle where the things come over
  const r=rng(2468),T2=[];
  for(let k=0;k<900&&T2.length<190;k++){const x=HILL_X+50+r()*520,y=-1800+r()*2950,d=x-HILL_X;if(Math.abs(y-HILL_MID())<92&&d<230)continue;if(vn2(x/140,y/140,8)<.42)continue;   // (in clumps)
    const h=hillH(x,y),e=8;if(Math.abs(hillH(x+e,y)-h)>e*.9||Math.abs(hillH(x,y+e)-h)>e*.9)continue;T2.push([x,y,20+r()*18,h,(r()*1e5)|0]);}
  for(const m of pineMesh(T2))grp.add(m);
  // stones half sunk in it along the shore and here and there up the slope
  const S=[],sd=()=>(r()*1e5)|0;
  for(let y=-1760;y<1150;y+=40+r()*50){if(Math.abs(y-HILL_MID())<160)continue;const x=HILL_X-2+r()*14,s=3+r()*6;S.push([x,y,s*1.4,s*.7,s,r()*6,sd(),hillH(x,y)]);}
  for(let k=0;k<70;k++){const x=HILL_X+40+r()*400,y=-1700+r()*2800;if(Math.abs(y-HILL_MID())<100&&x-HILL_X<220)continue;const s=4+r()*10;S.push([x,y,s*1.2,s*.7,s,r()*6,sd(),hillH(x,y)]);}
  for(let k=0,n=0;k<600&&n<30;k++){const x=HILL_X+24+r()*360,y=-1700+r()*2800;if(Math.abs(y-HILL_MID())<110&&x-HILL_X<230)continue;const h=hillH(x,y),e=10,sl=Math.hypot(hillH(x+e,y)-h,hillH(x,y+e)-h)/e;if(sl<.55)continue;const s=12+r()*16;S.push([x,y,s*1.4,s*.8,s,r()*6,sd(),h-s*.15]);n++;}   // (bigger outcrops where it's steep)
  for(const[x,y,s]of[[HILL_X+20,PORTAL.wall.y0-14,9],[HILL_X+14,PORTAL.wall.y1+14,8],[HILL_X+40,PORTAL.wall.y0-30,7],[HILL_X+36,PORTAL.wall.y1+28,7]])S.push([x,y,s*1.3,s*.8,s,r()*6,sd(),hillH(x,y)+2]);   // (where the embankments meet the headwall)
  grp.add(stoneMesh(S,1));
}

/* ---------- the shores' banks ---------- */
// a bank along a line, the land on its left: a profile of [how far onto the land, height] laid along it, rough along its length,
// rock where it's steep and grass on top (the lake's west shore between the moat and the water, the far shores)
function bankMesh(grp,line,prof,seed,step=10){
  const pts=[];for(let k=0;k<line.length-1;k++){const a=line[k],b=line[k+1],L=hyp(b[0]-a[0],b[1]-a[1]),n=Math.max(1,Math.round(L/step));for(let i=0;i<n;i++)pts.push([a[0]+(b[0]-a[0])*i/n,a[1]+(b[1]-a[1])*i/n]);}pts.push(line[line.length-1]);
  const P=[],I=[],m=prof.length,amp=prof.map(([o,h])=>h>WATER_Y?Math.min(9,Math.max(2,(h-WATER_Y)*.25)):1);
  pts.forEach((p,k)=>{const q=pts[Math.min(pts.length-1,k+1)],o=pts[Math.max(0,k-1)],dx=q[0]-o[0],dy=q[1]-o[1],l=hyp(dx,dy)||1,lx=dy/l,ly=-dx/l;   // (left of the line: the land)
    prof.forEach(([off,h],j)=>{const n=fbm2(p[0]/60+j*.31,p[1]/60,seed),w=(vn2(k*.37,j*.9,seed+2)-.5)*6;P.push(p[0]+lx*(off+w),h+(n-.5)*2*amp[j],p[1]+ly*(off+w));});});
  for(let k=0;k<pts.length-1;k++)for(let j=0;j<m-1;j++){const a=k*m+j,b=a+1,c=a+m,d=c+1;I.push(a,b,c,b,d,c);}
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();
  const N=g.attributes.normal,C=[],col=new T.Color(),grass=new T.Color(.064,.084,.042),earth=new T.Color(.105,.084,.06),rock=new T.Color(.15,.144,.134),wet=new T.Color(.05,.05,.047);
  for(let k=0;k<P.length/3;k++){const x=P[k*3],h=P[k*3+1],y=P[k*3+2],ny=Math.abs(N.getY(k)),slope=1-ny,n=vn2(x/9,y/9,4)*.6+vn2(x/31,y/31,6)*.4;
    col.copy(earth).lerp(grass,sstep(.26,.1,slope)*sstep(WATER_Y+6,WATER_Y+18,h)).lerp(rock,sstep(.2,.45,slope)*(.7+.4*n));if(h<WATER_Y+4)col.lerp(wet,sstep(WATER_Y+4,WATER_Y-2,h));
    col.multiplyScalar((.8+.4*n)*(.5+.7*Math.max(0,Math.abs(N.getX(k))*.3+ny*.8)));C.push(col.r,col.g,col.b);}
  g.setAttribute('color',new T.Float32BufferAttribute(C,3));
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.93,metalness:.03,side:T.DoubleSide}));mesh.castShadow=mesh.receiveShadow=true;grp.add(mesh);
  return pts;
}
function shoreBanks(grp){
  const r=rng(1357),S=[],sd=()=>(r()*1e5)|0;
  // the lake's west shore, from the gate's corner round the moat to the far north: low, grass on top, rock at the water
  const west=bankMesh(grp,[[ABUT.x1,ABUT.y0],...LAKE_W],[[-18,WATER_Y-8],[-5,WATER_Y+.5],[3,6],[12,11],[30,9],[52,4],[70,0]],21);
  west.forEach((p,k)=>{if(k%2||r()<.3)return;const s=4+r()*7;S.push([p[0]-4-r()*6,p[1]+(r()-.5)*6,s*1.3,s*.7,s,r()*6,sd(),WATER_Y+s*.3]);});   // stones at its water's edge
  // the far shores: north across the lake's head, south across the bay's foot; higher, further off
  bankMesh(grp,[[1290,-1724],[1664,-1724]],[[-20,WATER_Y-8],[-6,WATER_Y+1],[8,14],[40,38],[90,52],[150,40]],23,20);
  bankMesh(grp,[[1664,900],[1000,900]],[[-20,WATER_Y-8],[-6,WATER_Y+1],[8,10],[40,26],[100,36]],25,20);
  grp.add(stoneMesh(S,1));
}

/* ---------- the lighthouse's island ---------- */
const ISLE={x:1494,y:-1214,rx:100,ry:124,get h(){return WATER_Y+22;},n:56,seed:3307};   // out in the lake's north, a channel either side; its top 2.2 m above the water
const ISLE_COT={x:1478,y:-1170,w:36,d:22};   // the keeper's cottage (its door to the south)
const ISLE_JETTY={x:1456,y0:-1108,y1:-1056};   // from the south shore out into the water
function islePts(){
  const P=[],I=ISLE;for(let k=0;k<I.n;k++){const a=k/I.n*Math.PI*2,R=1+.2*(vn2(Math.cos(a)*1.6+5,Math.sin(a)*1.6+5,I.seed)-.5)+.05*Math.sin(3*a+1);P.push([I.x+Math.cos(a)*I.rx*R,I.y+Math.sin(a)*I.ry*R]);}
  return P;
}
function isleTop(P){   // its top: grass, a gravel path from the jetty up to the cottage and on to the lighthouse, the yard round the tower paved
  const xs=P.map(p=>p[0]),ys=P.map(p=>p[1]),x0=Math.min(...xs)-4,x1=Math.max(...xs)+4,y0=Math.min(...ys)-4,y1=Math.max(...ys)+4,bw=x1-x0,bh=y1-y0,S=2;
  const tex=canvasTex(Math.round(bw*S),Math.round(bh*S),(g,w,h)=>{g.setTransform(S,0,0,S,-x0*S,-y0*S);const r=rng(9311);
    g.fillStyle='#3f4a2b';g.fillRect(x0,y0,bw,bh);
    for(let i=0;i<5200;i++){const x=x0+r()*bw,y=y0+r()*bh,s=.5+r()*1.8;g.fillStyle=r()<.5?'rgba(10,14,8,.45)':'rgba(92,104,64,.16)';g.fillRect(x,y,s,s*.7);}
    g.strokeStyle='rgba(18,20,14,.55)';g.lineWidth=7;g.beginPath();g.moveTo(...P[0]);for(const p of P)g.lineTo(...p);g.closePath();g.stroke();   // (rough at the edge)
    const path=[[ISLE_JETTY.x,ISLE_JETTY.y0+4],[ISLE_JETTY.x+8,ISLE_JETTY.y0-14],[ISLE_COT.x-6,ISLE_COT.y+ISLE_COT.d/2+8],[ISLE_COT.x+ISLE_COT.w/2+10,ISLE_COT.y+8],[LIGHTHOUSE.x-14,LIGHTHOUSE.y+6]];
    g.lineCap=g.lineJoin='round';g.strokeStyle='#6b6553';g.lineWidth=5;g.beginPath();g.moveTo(...path[0]);for(const p of path)g.lineTo(...p);g.stroke();
    for(let i=0;i<500;i++){const t=r()*(path.length-1),k=Math.floor(t),f=t-k,a=path[k],b=path[k+1];g.fillStyle=r()<.5?'rgba(0,0,0,.25)':'rgba(140,130,110,.18)';g.fillRect(a[0]+(b[0]-a[0])*f+(r()-.5)*5,a[1]+(b[1]-a[1])*f+(r()-.5)*5,1,1);}
    g.fillStyle='#6b6a65';g.beginPath();g.arc(LIGHTHOUSE.x,LIGHTHOUSE.y,15,0,7);g.fill();g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=.6;for(let a=0;a<6.28;a+=.5){g.beginPath();g.moveTo(LIGHTHOUSE.x,LIGHTHOUSE.y);g.lineTo(LIGHTHOUSE.x+Math.cos(a)*15,LIGHTHOUSE.y+Math.sin(a)*15);g.stroke();}
    g.fillStyle='rgba(8,9,7,.5)';g.fillRect(ISLE_COT.x-ISLE_COT.w/2-3,ISLE_COT.y-ISLE_COT.d/2-3,ISLE_COT.w+6,ISLE_COT.d+6);});   // (the cottage's shadow on the grass)
  tex.wrapS=tex.wrapT=T.ClampToEdgeWrapping;tex.repeat.set(1/bw,1/bh);tex.offset.set(-x0/bw,y1/bh);   // (ShapeGeometry's uvs are map units: x, and -y)
  return tex;
}
function isleMesh(grp){
  const I=ISLE,P=islePts(),g=new T.Group();grp.add(g);
  const sh=new T.Shape();sh.moveTo(P[0][0],-P[0][1]);for(const p of P)sh.lineTo(p[0],-p[1]);
  const top=new T.Mesh(new T.ShapeGeometry(sh),new T.MeshStandardMaterial({map:isleTop(P),roughness:.95,metalness:0}));top.rotation.x=-Math.PI/2;top.position.y=I.h;top.receiveShadow=true;g.add(top);
  // its edge: a low earth cliff, then a stony apron at the water and the slope on down under it
  const rows=[[0,0],[2.5,-3],[7,WATER_Y+1.5-I.h],[18,WATER_Y-16-I.h]],pos=[],col=[],idx=[],n=P.length,c=new T.Color(),earth=new T.Color(.11,.088,.064),stone=new T.Color(.12,.115,.108),wet=new T.Color(.045,.045,.042);
  P.forEach((p,k)=>{const a=Math.atan2((p[1]-I.y)/I.ry,(p[0]-I.x)/I.rx),ox=Math.cos(a),oy=Math.sin(a),j=.8+.5*vn2(k*.7,1.3,I.seed+3);
    rows.forEach(([o,dh],ri)=>{pos.push(p[0]+ox*o*j,I.h+dh,p[1]+oy*o*j);c.copy(ri<2?earth:ri<3?stone:wet).multiplyScalar(.85+.3*vn2(k*.9,ri,11));col.push(c.r,c.g,c.b);});});
  for(let k=0;k<n;k++){const a=k*rows.length,b=((k+1)%n)*rows.length;for(let ri=0;ri<rows.length-1;ri++)idx.push(a+ri,b+ri,a+ri+1,a+ri+1,b+ri,b+ri+1);}
  const eg=new T.BufferGeometry();eg.setAttribute('position',new T.Float32BufferAttribute(pos,3));eg.setAttribute('color',new T.Float32BufferAttribute(col,3));eg.setIndex(idx);eg.computeVertexNormals();
  const edge=new T.Mesh(eg,new T.MeshStandardMaterial({vertexColors:true,roughness:.9,side:T.DoubleSide}));edge.castShadow=edge.receiveShadow=true;g.add(edge);
  const r=rng(5501),S=[];P.forEach((p,k)=>{if(r()<.55){const a=Math.atan2(p[1]-I.y,p[0]-I.x),o=5+r()*5,s=2.5+r()*5;S.push([p[0]+Math.cos(a)*o,p[1]+Math.sin(a)*o,s*1.3,s*.8,s,r()*6,(r()*1e5)|0,WATER_Y+s*.25]);}});g.add(stoneMesh(S,1));   // stones at the water's edge
  // the keeper's cottage: white walls, a slate roof, a chimney, the windows dark
  const wall=new T.MeshStandardMaterial({color:0xaaa497,roughness:.86}),roof=new T.MeshStandardMaterial({color:0x2c3135,roughness:.68,metalness:.1}),dark=new T.MeshStandardMaterial({color:0x0c0f12,roughness:.35,metalness:.4}),wood=new T.MeshStandardMaterial({color:0x3a2c20,roughness:.9});
  const B=(w,h,d,m,x,y,z,ry)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);if(ry)o.rotation.y=ry;o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  const K=ISLE_COT;B(K.w,13,K.d,wall,K.x,I.h+6.5,K.y);
  const rs=new T.Shape();rs.moveTo(-K.d/2-2,0);rs.lineTo(0,9);rs.lineTo(K.d/2+2,0);rs.lineTo(-K.d/2-2,0);
  const rg=new T.ExtrudeGeometry(rs,{depth:K.w+3,bevelEnabled:false});rg.translate(0,0,-(K.w+3)/2);const rm=new T.Mesh(rg,roof);rm.rotation.y=Math.PI/2;rm.position.set(K.x,I.h+13,K.y);rm.castShadow=true;g.add(rm);
  B(4,10,4,wall,K.x+K.w/2-6,I.h+18,K.y-3);B(5,2.5,9,dark,K.x-K.w/2+9,I.h+5,K.y+K.d/2+.2);
  for(const x of[-10,6,13])B(5,4.5,.6,dark,K.x+x,I.h+8,K.y+K.d/2+.1);for(const x of[-10,6])B(5,4.5,.6,dark,K.x+x,I.h+8,K.y-K.d/2-.1);
  // the boat shed and the jetty, a rowing boat tied up at it
  B(16,9,13,new T.MeshStandardMaterial({color:0x4a3b2c,roughness:.9}),ISLE_JETTY.x+20,I.h+4.5,ISLE_JETTY.y0-16);B(18,1.4,15,roof,ISLE_JETTY.x+20,I.h+9.6,ISLE_JETTY.y0-16,.04);
  const J=ISLE_JETTY,jl=J.y1-J.y0;B(8,1.2,jl,wood,J.x,WATER_Y+3.4,(J.y0+J.y1)/2);
  for(let y=J.y0+4;y<=J.y1;y+=10)for(const s of[-1,1]){const pst=new T.Mesh(new T.CylinderGeometry(.7,.7,12,6),wood);pst.position.set(J.x+s*3.6,WATER_Y-1.5,y);g.add(pst);}
  B(3,2.6,4,wood,J.x,WATER_Y+3+(I.h-WATER_Y-3)/2-1.6,J.y0-1);   // (steps up onto the grass)
  const hull=new T.Mesh(new T.SphereGeometry(1,12,6,0,Math.PI*2,Math.PI/2,Math.PI/2),new T.MeshStandardMaterial({color:0x5a2820,roughness:.7,side:T.DoubleSide}));hull.scale.set(3.4,2.4,9);hull.position.set(J.x+9,WATER_Y+1.6,J.y1-14);hull.rotation.y=.06;hull.castShadow=true;g.add(hull);
  // a low stone wall round the lighthouse's yard (open toward the cottage)
  const sw=new T.MeshStandardMaterial({color:0x55534e,roughness:.92});for(let a=0;a<Math.PI*2;a+=.36){const da=Math.atan2(K.y-LIGHTHOUSE.y,K.x-LIGHTHOUSE.x),off=Math.atan2(Math.sin(a-da),Math.cos(a-da));if(Math.abs(off)<.4)continue;B(5.8,3.4,2.2,sw,LIGHTHOUSE.x+Math.cos(a)*16,I.h+1.7,LIGHTHOUSE.y+Math.sin(a)*16,-a+Math.PI/2);}
  // a few pines on its north side
  const T2=[];for(let k=0;k<40&&T2.length<9;k++){const a=-Math.PI*(.12+r()*.76),R=.25+r()*.55,x=I.x+Math.cos(a)*I.rx*R,y=I.y+Math.sin(a)*I.ry*R;if(hyp(x-K.x,y-K.y)<34||hyp(x-LIGHTHOUSE.x,y-LIGHTHOUSE.y)<30)continue;T2.push([x,y,18+r()*14,I.h,(r()*1e5)|0]);}
  for(const m of pineMesh(T2))g.add(m);
}
