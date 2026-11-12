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
   - The lake opens out to the sea since v115 (Bryan, after v113: "the lighthouse should be fairly off in the distance, and on a
     large island. The water is mean to go on and on? Like an ocean's horizon"; on the drafts, docs/ocean-drafts.md: "Your sample
     in the notes is perfect", option A): north of the Headquarters the land ends in a coast that runs away west (SEA_W, a bank
     down to the water: shoreBanks), the hill's north end comes down into the water (SEA_E, seaFall in hillH), and the lighthouse
     stands on a large island far out (ISLE, isleMesh: a height field of low cliffs and hills with pines on it, the keeper's
     cottage with a window lit), its east end in the gap between the Headquarters and the hill with open sea to the right of it.
     The water itself, the haze it fades into and the sky are road.js's and scene.js's. A level later on (Bryan, after v112). */

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

/* ---------- the coasts (since v115) ---------- */
const SEA_W=[[1300,-1720],[1250,-1660],[1180,-1590],[1060,-1545],[900,-1520],[720,-1530],[540,-1565],[340,-1600],[60,-1640],[-300,-1700],[-800,-1760],[-1500,-1800],[-2600,-1830]];   // north of the Headquarters' fortress, from the lake's head (road.js's LAKE_W ends there) away west: the land south of it
const SEA_E=[[1640,-1700],[1662,-1790],[1700,-1880],[1780,-1950],[1900,-2000],[2080,-2030],[2330,-2000],[2600,-2060],[2950,-2130],[3300,-2090],[3700,-2150]];   // where the hill comes down to the sea, west to east (the summit, Level 4's, is well south of it)
function seaCoastY(x){const P=SEA_E;if(x<=P[0][0])return P[0][1];for(let i=1;i<P.length;i++)if(x<=P[i][0]){const a=P[i-1],b=P[i];return a[1]+(b[1]-a[1])*(x-a[0])/(b[0]-a[0]);}return P[P.length-1][1];}
function seaFall(x,y,h){const yc=seaCoastY(x);if(y>yc+230)return h;const f=WATER_Y-26;return f+(h-f)*sstep(yc-30,yc+230,y);}   // (the ground falling away under the water past the coast)
const HILL_GROUND={x1:2700,y0:-2428};   // the hill's ground out to the coast and on east (since v115; it stopped at x 2200 and y -1900)

/* ---------- the hill ---------- */
const HILL_SADDLE=[[10,49],[30,50],[50,53],[88,62],[140,74],[200,86]];   // the ground over the tunnel's mouth: (depth into the hill from its face, height); under CENTI_PATH, over the tunnel's roof (40)
function saddleH(d){const S=HILL_SADDLE;if(d<=S[0][0])return S[0][1];for(let i=1;i<S.length;i++)if(d<=S[i][0]){const a=S[i-1],b=S[i];return a[1]+(b[1]-a[1])*(d-a[0])/(b[0]-a[0]);}return S[S.length-1][1];}
const HILL_MID=()=>(PORTAL.y0+PORTAL.y1)/2;
function hillH(x,y){
  const dy=Math.abs(y-HILL_MID()),d=x-HILL_X+(vn2(y/38,3.1,5)-.5)*12;   // (d: how far into the hill; a ragged shore)
  const foot=WATER_Y-8,bank=foot+(16-foot)*sstep(-14,24,d),rise=d<24?bank:16+200*(1-Math.exp(-(d-24)/260));
  const n=(fbm2(x/110,y/110,1)-.5)*2,amp=3+20*sstep(20,220,d),swell=30*Math.sin(y/240+1.3)*sstep(90,320,d),top=330*Math.exp(-((x-2060)**2+(y+1460)**2)/135200),h0=rise+n*amp+swell+top;   // (top: the summit, Level 4's, where the zip line comes from: level4.js's l4Cable)
  const w=sstep(152,98,dy)*(d<10?1:sstep(250,180,d));if(w<=0)return seaFall(x,y,h0);   // the saddle over the mouth and the embankments beside the headwall
  const hp=d>=10?saddleH(d):foot+(saddleH(10)-foot)*sstep(-42,10,d);
  return seaFall(x,y,h0+(hp-h0)*w);
}
const HILL_HOLE=(x,y)=>x-HILL_X<10&&Math.abs(y-HILL_MID())<99;   // (in front of the headwall: the road, the bridge's end, the water beside it)
function hillMesh(grp){
  const xs=[],ys=[],X0=HILL_X-60,X1=HILL_GROUND.x1,Y0=HILL_GROUND.y0,Y1=1250;
  for(let x=X0;x<=X1;x+=x<2190?12:24)xs.push(x);for(let y=Y0;y<=Y1;y+=y<-1910?24:12)ys.push(y);   // (12 apart where it's seen close, as before, 24 out east and north to the coast: one grid, so no seam; a finer separate patch by the mouth once showed one)
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
  {const r2=rng(8642);for(let k=0;k<2400&&T2.length<340;k++){const x=HILL_X+50+r2()*960,y=-2300+r2()*3450;if(x<HILL_X+570&&y>-1800)continue;if(vn2(x/140,y/140,8)<.42)continue;   // (and out east and north to the coast since v115)
    const h=hillH(x,y),e=8;if(h<WATER_Y+14)continue;if(Math.abs(hillH(x+e,y)-h)>e*.9||Math.abs(hillH(x,y+e)-h)>e*.9)continue;T2.push([x,y,20+r2()*18,h,(r2()*1e5)|0]);}}
  for(const m of pineMesh(T2))grp.add(m);
  // stones half sunk in it along the shore and here and there up the slope
  const S=[],sd=()=>(r()*1e5)|0;
  for(let y=-1760;y<1150;y+=40+r()*50){if(Math.abs(y-HILL_MID())<160)continue;const x=HILL_X-2+r()*14,s=3+r()*6;S.push([x,y,s*1.4,s*.7,s,r()*6,sd(),hillH(x,y)]);}
  for(let k=0;k<70;k++){const x=HILL_X+40+r()*400,y=-1700+r()*2800;if(Math.abs(y-HILL_MID())<100&&x-HILL_X<220)continue;const s=4+r()*10;S.push([x,y,s*1.2,s*.7,s,r()*6,sd(),hillH(x,y)-s*.2]);}
  for(let k=0,n=0;k<600&&n<18;k++){const x=HILL_X+24+r()*360,y=-1700+r()*2800;if(Math.abs(y-HILL_MID())<110&&x-HILL_X<230)continue;const h=hillH(x,y),e=10,sl=Math.hypot(hillH(x+e,y)-h,hillH(x,y+e)-h)/e;if(sl<.55)continue;const s=10+r()*12;S.push([x,y,s*1.3,s*.7,s,r()*6,sd(),h-s*.38]);n++;}   // (bigger outcrops where it's steep, sunk well in: since v114, from the low camera on the walk across, standing proud they looked like grey saucers stuck on the slope)
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
  const west=bankMesh(grp,[[ABUT.x1,ABUT.y0],...LAKE_W,...SEA_W.slice(1)],[[-18,WATER_Y-8],[-5,WATER_Y+.5],[3,6],[12,11],[30,9],[52,4],[70,0]],21);   // (on round the coast north of the fortress since v115)
  west.forEach((p,k)=>{if(k%2||r()<.3)return;const s=4+r()*7;S.push([p[0]-4-r()*6,p[1]+(r()-.5)*6,s*1.3,s*.7,s,r()*6,sd(),WATER_Y+s*.3]);});   // stones at its water's edge
  // the far shore south across the bay's foot, behind the dockyard (the one north across the lake's head went with v115: the sea)
  bankMesh(grp,[[1664,900],[1000,900]],[[-20,WATER_Y-8],[-6,WATER_Y+1],[8,10],[40,26],[100,36]],25,20);
  grp.add(stoneMesh(S,1));
}

/* ---------- the lighthouse's island, far out in the sea ---------- */
// its east end, the lighthouse on it (road.js's LIGHTHOUSE, 55 in from the shore), about 330 m north of the bridge in the gap
// between the Headquarters and the hill; the rest of it runs away west behind the Headquarters (the drafts' option A: about 200 m
// of it shows). h: the ground at the lighthouse
const ISLE={x:405,y:-3740,rx:1000,ry:250,hills:230,seed:71,get h(){return isleH(LIGHTHOUSE.x,LIGHTHOUSE.y);}};
function isleShore(a){const c=ISLE;return 1+.2*(vn2(Math.cos(a)*1.8+11,Math.sin(a)*1.8+11,c.seed)-.5)*2+.07*Math.sin(3*a+.7)+.04*Math.sin(7*a+2);}   // (how far out the shore is that way, against the ellipse)
function isleH(x,y){const c=ISLE,dx=(x-c.x)/c.rx,dy=(y-c.y)/c.ry,e=Math.hypot(dx,dy)/isleShore(Math.atan2(dy,dx)),d=e<1e-3?2000:Math.min(2000,Math.hypot(x-c.x,y-c.y)*(1/e-1));   // (d: how far in from the shore along the line to its middle)
  return WATER_Y-24+54*sstep(-8,14,d)+c.hills*sstep(16,c.ry*1.1,d)*(.35+.8*fbm2(x/340+c.seed,y/340,c.seed))+(fbm2(x/50,y/50,c.seed+5)-.5)*8*sstep(0,60,d);}   // (a low cliff at the water, 3 m, the bottom shelving away under it; hills over it)
function isleMesh(grp){
  const c=ISLE,X0=c.x-c.rx*1.32,X1=c.x+c.rx*1.32,Y0=c.y-c.ry*1.32,Y1=c.y+c.ry*1.32,st=20,xs=[],ys=[];
  for(let x=X0;x<=X1;x+=st)xs.push(x);for(let y=Y0;y<=Y1;y+=st)ys.push(y);
  const nx=xs.length,ny=ys.length,P=new Float32Array(nx*ny*3),I=[];
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const k=j*nx+i;P[k*3]=xs[i];P[k*3+1]=isleH(xs[i],ys[j]);P[k*3+2]=ys[j];}
  for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){const a=j*nx+i,b=a+1,q=a+nx,d=q+1;if(Math.max(P[a*3+1],P[b*3+1],P[q*3+1],P[d*3+1])<WATER_Y-10)continue;I.push(a,q,b,b,q,d);}   // (nothing far under the water)
  const g=new T.BufferGeometry();g.setAttribute('position',new T.BufferAttribute(P,3));g.setIndex(I);g.computeVertexNormals();
  const N=g.attributes.normal,C=new Float32Array(nx*ny*3),col=new T.Color(),grass=new T.Color(.064,.084,.042),earth=new T.Color(.105,.084,.06),rock=new T.Color(.16,.153,.142),wet=new T.Color(.05,.05,.047),Lx=-.39,Ly=.8,Lz=-.52;   // (hillMesh's colours, the moon's light baked in a little)
  for(let k=0;k<nx*ny;k++){const x=P[k*3],h=P[k*3+1],y=P[k*3+2],slope=1-N.getY(k),q=vn2(x/9,y/9,4)*.6+vn2(x/31,y/31,6)*.4;
    col.copy(earth).lerp(grass,sstep(.24,.1,slope)*sstep(WATER_Y+6,WATER_Y+20,h)*(.6+.5*q)).lerp(rock,sstep(.2,.46,slope)*(.7+.4*q));
    if(h<WATER_Y+5)col.lerp(wet,sstep(WATER_Y+5,WATER_Y-2,h));col.multiplyScalar((.8+.4*q)*(.42+.8*Math.max(0,N.getX(k)*Lx+N.getY(k)*Ly+N.getZ(k)*Lz)));C[k*3]=col.r;C[k*3+1]=col.g;C[k*3+2]=col.b;}
  g.setAttribute('color',new T.BufferAttribute(C,3));
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:.02}));mesh.receiveShadow=true;grp.add(mesh);
  // pines in clumps over it: a ragged treeline against the sky
  const r=rng(c.seed*7),T2=[];
  for(let k=0;k<5000&&T2.length<320;k++){const x=X0+r()*(X1-X0),y=Y0+r()*(Y1-Y0),h=isleH(x,y);if(h<WATER_Y+40)continue;if(vn2(x/180,y/180,c.seed+9)<.38)continue;if(Math.hypot(x-LIGHTHOUSE.x,y-LIGHTHOUSE.y)<90)continue;T2.push([x,y,34+r()*30,h,(r()*1e5)|0]);}
  for(const m of pineMesh(T2)){m.castShadow=false;grp.add(m);}   // (too far out for the moon's shadows)
  // the keeper's cottage by the lighthouse, a window lit (seen from the bridge as a speck of warm light)
  const L=LIGHTHOUSE,cx=L.x-70,cz=L.y-20,ch=isleH(cx,cz),wall=new T.MeshStandardMaterial({color:0xaaa497,roughness:.86}),roof=new T.MeshStandardMaterial({color:0x2c3135,roughness:.68,metalness:.1});
  const hs=new T.Mesh(new T.BoxGeometry(52,22,32),wall);hs.position.set(cx,ch+11,cz);grp.add(hs);
  const rf=new T.Mesh(new T.ConeGeometry(34,16,4),roof);rf.rotation.y=Math.PI/4;rf.scale.set(1,1,.66);rf.position.set(cx,ch+30,cz);grp.add(rf);
  for(const dx of[-12,10]){const w=new T.Mesh(new T.PlaneGeometry(7,6),new T.MeshBasicMaterial({color:dx<0?0xffc878:0x4a3a22,toneMapped:false,fog:false}));w.position.set(cx+dx,ch+12,cz+16.2);grp.add(w);}
}
