"use strict";
/* Bridge drafts for the road east (Bryan, after v112: "The bridge is just a flat road, it looks like it's floating. Can we draft some
   different bridge types? I'm thinking the south side of the bridge can be more of the warehouse level."). Loaded into the game page by
   bridges.js once the road east is built, the water let down (road.js's WATER_Y) so what holds each bridge up shows:
   bridgeDraft(kind) puts one of four on the crossing in place of the plain deck's beam and piers, dockDraft() turns the bay south of it
   into a dockyard like the warehouse level's. Drawn only: nothing here is walkable, and the game's own bridge is untouched. Since v114
   the game has A and the dockyard built in (road.js's bridgeMesh and dockMesh): bdHide takes the game's piers away for the others. */
const BD={grp:null,hidden:[],dock:null};
const bdM=(c,r=.8,m=.1,o={})=>new THREE.MeshStandardMaterial(Object.assign({color:c,roughness:r,metalness:m},o));
function bdBox(g,w,h,d,mat,x,y,z,ry=0){const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);o.position.set(x,y,z);o.rotation.y=ry;o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function bdCyl(g,r0,r1,h,mat,x,y,z,seg=14){const o=new THREE.Mesh(new THREE.CylinderGeometry(r0,r1,h,seg),mat);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;}
function bdBeam(g,a,b,t,mat){   // a square bar from a to b ([x, y, z])
  const A=new THREE.Vector3(...a),B=new THREE.Vector3(...b),o=new THREE.Mesh(new THREE.BoxGeometry(t,A.distanceTo(B),t),mat);
  o.position.copy(A).add(B).multiplyScalar(.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),B.clone().sub(A).normalize());o.castShadow=true;g.add(o);return o;}
const BDK=()=>({L:RBR.x1-RBR.x0,cx:(RBR.x0+RBR.x1)/2,cz:(RBR.y0+RBR.y1)/2,D:RBR.y1-RBR.y0,W:WATER_Y});
function bdTex(w,h,draw,rx,ry){const t=canvasTex(w,h,draw);t.repeat.set(rx,ry);return t;}

// take the game's beam and piers away (its deck stays: the road's surface), and its railings for a bridge with walls of its own
function bdReset(){if(BD.grp&&BD.grp.parent)BD.grp.parent.remove(BD.grp);BD.grp=null;for(const m of BD.hidden)m.visible=true;BD.hidden=[];}
function bdHide(rails){
  const{L,cz}=BDK();EAST.grp.children.forEach(m=>{if(m.name==='bridge-under'){m.visible=false;BD.hidden.push(m);return;}   // (the game's own since v114: draft A, built in)
    if(!m.isMesh||!m.geometry||m.geometry.type!=='BoxGeometry')return;const p=m.geometry.parameters,q=m.position;
    if(q.x<RBR.x0-20||q.x>RBR.x1+20||Math.abs(q.z-cz)>80||q.y>=-1)return;
    if((Math.abs(p.width-L)<1&&p.height===5)||(p.width===12&&p.height===2)||(p.width===8&&p.height===8&&p.depth===8)){m.visible=false;BD.hidden.push(m);}});
  if(rails)for(const o of EAST.objs)if(o.kind==='rail')for(const m of o.meshes||[]){m.visible=false;BD.hidden.push(m);}
}

/* ---------- A. a concrete beam bridge on piers: deep edge beams, girders under the deck, pairs of round columns on footings ---------- */
function bdConcrete(g){
  const{L,cx,cz,D,W}=BDK(),c=bdM(0x8d8f8a,.9,.02),cd=bdM(0x6c6e69,.94,.02),dark=bdM(0x3a3c3b,.95,.02);
  for(const s of[-1,1]){bdBox(g,L,7,5,c,cx,-3.2,cz+s*(D/2+1.5));bdBox(g,L,.8,5.6,dark,cx,-6.9,cz+s*(D/2+1.6));}   // the deck's edge beams, a drip line under each
  for(const dz of[-34,0,34])bdBox(g,L-10,8,7,cd,cx,-6.6,cz+dz);   // the girders
  const n=6;for(let k=1;k<n;k++){const x=RBR.x0+L*k/n;bdBox(g,12,6,D+6,c,x,-13.5,cz);   // the pier caps
    for(const dz of[-30,30])bdCyl(g,5,5.8,-16-(W-6),cd,x,(-16+W-6)/2,cz+dz,18);   // two columns each, down into the water
    bdBox(g,20,5,D-22,cd,x,W+.8,cz);for(const dz of[-30,30])bdCyl(g,9,10,5,cd,x,W+.8,cz+dz,18);}   // a footing at the water
  for(const x of[RBR.x0+5,RBR.x1-5])bdBox(g,12,-W+6,D+18,cd,x,(W-6)/2,cz);   // the abutments at each end
}
/* ---------- B. a steel truss: low trusses either side (nothing overhead, the squad stays in sight), on concrete piers ---------- */
function bdTruss(g){
  const{L,cx,cz,D,W}=BDK(),st=bdM(0x41604c,.5,.55),c=bdM(0x7f817c,.92,.02),H=34,P=34,spans=4,sl=L/spans;
  for(let k=0;k<spans;k++){const x0=RBR.x0+k*sl,x1=x0+sl;
    for(const s of[-1,1]){const z=cz+s*(D/2+3.5);
      bdBeam(g,[x0,.6,z],[x1,.6,z],2.8,st);bdBeam(g,[x0+P,H,z],[x1-P,H,z],3.2,st);bdBeam(g,[x0,.6,z],[x0+P,H,z],3.2,st);bdBeam(g,[x1,.6,z],[x1-P,H,z],3.2,st);   // the chords and the end posts
      let i=0;for(let x=x0+P;x<x1-P-1;x+=P,i++){bdBeam(g,[x,.6,z],[x,H,z],1.8,st);bdBeam(g,i%2?[x,H,z]:[x,.6,z],i%2?[x+P,.6,z]:[x+P,H,z],2.2,st);}}   // the verticals and the diagonals
    for(let x=x0+2;x<=x1-1;x+=P)bdBox(g,3,4,D+12,st,x,-2.4,cz);   // the floor beams
    bdBox(g,sl-4,5,4,st,(x0+x1)/2,-2.4,cz-D/2-3.5);bdBox(g,sl-4,5,4,st,(x0+x1)/2,-2.4,cz+D/2+3.5);}
  for(let k=0;k<=spans;k++){const x=RBR.x0+k*sl,end=k===0||k===spans,h=-4-(W-6);
    bdBox(g,end?14:16,h,D+20,c,x,(W-6-4)/2,cz);if(!end)for(const s of[-1,1]){const cw=bdBox(g,12,h,12,c,x,(W-6-4)/2,cz+s*(D/2+16));cw.rotation.y=Math.PI/4;}}   // the piers, cutwaters up and downstream
}
/* ---------- C. stone arches: eight of them, stone spandrels, piers with cutwaters, stone parapets in place of the railings ---------- */
function bdStone(g){
  const{L,cx,cz,D,W}=BDK(),n=8,sp=L/n,R=Math.min(sp*.4,-W-5),B=W-6,top=-2.2;   // (its top under the deck's slab: the road stays the road)
  const stone=bdTex(256,256,(x,w,h)=>{const r=rng(31);x.fillStyle='#77736a';x.fillRect(0,0,w,h);for(let row=0;row<8;row++){const y=row*h/8,off=row%2?w/8:0;for(let k=-1;k<4;k++){const bx=off+k*w/4;x.fillStyle=`rgb(${100+r()*40|0},${96+r()*36|0},${86+r()*30|0})`;x.fillRect(bx+2,y+2,w/4-4,h/8-4);}}
    for(let i=0;i<1600;i++){x.fillStyle=r()<.5?'rgba(0,0,0,.12)':'rgba(255,255,255,.05)';x.fillRect(r()*w,r()*h,1.5,1.5);}},1/48,1/24);
  const sm=new THREE.MeshStandardMaterial({map:stone,roughness:.95,metalness:0}),sh=new THREE.Shape();
  sh.moveTo(0,B);sh.lineTo(L,B);sh.lineTo(L,top);sh.lineTo(0,top);sh.lineTo(0,B);
  for(let k=0;k<n;k++){const ax=(k+.5)*sp,h=new THREE.Path();h.moveTo(ax-R,B+1);h.lineTo(ax+R,B+1);h.lineTo(ax+R,W);h.absarc(ax,W,R,0,Math.PI,false);h.lineTo(ax-R,B+1);sh.holes.push(h);}
  const geo=new THREE.ExtrudeGeometry(sh,{depth:D+8,bevelEnabled:false,curveSegments:16}),body=new THREE.Mesh(geo,sm);body.position.set(RBR.x0,0,cz-(D+8)/2);body.castShadow=body.receiveShadow=true;g.add(body);
  for(const s of[-1,1]){bdBox(g,L,11.2,4,sm,cx,3.4,cz+s*(D/2+2));bdBox(g,L,1.6,6,bdM(0x8a867c,.9,0),cx,9.6,cz+s*(D/2+2));}   // the parapets, down to the stonework, and their coping
  for(let k=1;k<n;k++){const x=RBR.x0+k*sp;for(const s of[-1,1]){const cw=bdBox(g,13,-B+W+R*.5,13,sm,x,(B+W+R*.5)/2,cz+s*(D/2+8));cw.rotation.y=Math.PI/4;}}   // cutwaters
}
/* ---------- D. a steel lift bridge: plate girders on piers either side of a span that lifts between four lattice towers ---------- */
function bdLift(g){
  const{L,cx,cz,D,W}=BDK(),st=bdM(0x5b6670,.5,.55),dk=bdM(0x2b3136,.6,.5),c=bdM(0x7f817c,.92,.02),red=new THREE.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}),warm=new THREE.MeshBasicMaterial({color:0xffc070,toneMapped:false});
  const X0=1300,X1=1424,H=190;
  for(const[a,b]of[[RBR.x0,X0-8],[X1+8,RBR.x1]]){const m=(a+b)/2;for(const s of[-1,1])bdBox(g,b-a,9,3,st,m,-4.6,cz+s*(D/2+1));for(const dz of[-26,26])bdBox(g,b-a,8,4,dk,m,-5,cz+dz);}   // the approaches' plate girders
  for(let x=RBR.x0+70;x<X0-30;x+=86)bdBox(g,14,-6-(W-6),D+10,c,x,(W-6-6)/2,cz);for(let x=X1+60;x<RBR.x1-20;x+=86)bdBox(g,14,-6-(W-6),D+10,c,x,(W-6-6)/2,cz);   // their piers
  for(const x of[X0,X1])bdBox(g,30,-8-(W-8),D+44,c,x,(W-8-8)/2,cz);   // the towers' piers, wider
  for(const x of[X0,X1])for(const s of[-1,1]){const z=cz+s*(D/2+14);   // four lattice towers
    for(const[dx,dz]of[[-6,-6],[6,-6],[-6,6],[6,6]])bdBox(g,2.6,H,2.6,st,x+dx,H/2,z+dz);
    for(let y=0;y<H-10;y+=26){bdBeam(g,[x-6,y,z-6],[x+6,y+26,z-6],1.2,st);bdBeam(g,[x+6,y,z-6],[x-6,y+26,z-6],1.2,st);bdBeam(g,[x-6,y,z+6],[x+6,y+26,z+6],1.2,st);bdBeam(g,[x+6,y,z+6],[x-6,y+26,z+6],1.2,st);
      bdBeam(g,[x-6,y,z-6],[x-6,y+26,z+6],1.2,st);bdBeam(g,[x+6,y,z-6],[x+6,y+26,z+6],1.2,st);}
    bdBox(g,18,12,18,dk,x,H+6,z);const lr=new THREE.Mesh(new THREE.SphereGeometry(1.4,8,6),red);lr.position.set(x,H+13.5,z);g.add(lr);   // the machinery house on top, a red light
    bdBox(g,10,26,10,c,x,H*.55,z);}   // the counterweight inside
  for(const x of[X0,X1])bdBox(g,6,8,D+40,st,x,H+2,cz);   // across the road at the top
  const sx0=X0+8,sx1=X1-8;for(const s of[-1,1]){const z=cz+s*(D/2+3);bdBeam(g,[sx0,1,z],[sx1,1,z],3,st);bdBeam(g,[sx0+14,24,z],[sx1-14,24,z],3,st);bdBeam(g,[sx0,1,z],[sx0+14,24,z],3,st);bdBeam(g,[sx1,1,z],[sx1-14,24,z],3,st);
    for(let x=sx0+14;x<sx1-14;x+=24)bdBeam(g,[x,1,z],[x+12,24,z],1.6,st);for(const x of[sx0+14,sx1-14]){bdBeam(g,[x,24,z],[x-8,H,z],.5,dk);}}   // the lifting span's truss, its cables up to the towers
  bdBox(g,16,12,12,bdM(0x6b4a3a,.85,.05),X0,30,cz-D/2-28);for(const dx of[-4,4])bdBox(g,4,3,.4,warm,X0+dx,32,cz-D/2-21.9);   // the operator's cabin on the north-west tower, lit
}
function bridgeDraft(kind){
  bdReset();bdHide(kind==='stone');const g=new THREE.Group();EAST.grp.add(g);BD.grp=g;
  ({concrete:bdConcrete,truss:bdTruss,stone:bdStone,lift:bdLift})[kind](g);
}

/* ---------- the south side: a dockyard like the warehouse level's (quays round the basin under the bridge, warehouses, stacked
   containers, a gantry crane on a pier, a tug at the quay, lamps) ---------- */
function dockDraft(){
  if(BD.dock||EAST.grp.getObjectByName('dock'))return;   // (in the game itself since v114: road.js's dockMesh)
  const g=new THREE.Group();EAST.grp.add(g);BD.dock=g;const W=WATER_Y;
  const top=bdTex(256,256,(x,w,h)=>{const r=rng(5);x.fillStyle='#5d5e5b';x.fillRect(0,0,w,h);x.strokeStyle='rgba(0,0,0,.35)';x.lineWidth=2;for(let i=0;i<=4;i++){x.beginPath();x.moveTo(i*w/4,0);x.lineTo(i*w/4,h);x.stroke();x.beginPath();x.moveTo(0,i*h/4);x.lineTo(w,i*h/4);x.stroke();}
    for(let i=0;i<2400;i++){x.fillStyle=r()<.5?'rgba(0,0,0,.15)':'rgba(255,255,255,.04)';x.fillRect(r()*w,r()*h,1.6,1.6);}for(let i=0;i<9;i++){const px=r()*w,py=r()*h,gr=x.createRadialGradient(px,py,0,px,py,20);gr.addColorStop(0,'rgba(20,24,28,.5)');gr.addColorStop(1,'rgba(0,0,0,0)');x.fillStyle=gr;x.fillRect(px-20,py-20,40,40);}},1/80,1/80);
  const quay=new THREE.MeshStandardMaterial({map:top,roughness:.7,metalness:.15}),wall=bdM(0x4d4e4b,.95,.02),fend=bdM(0x141414,.8,.1),bol=bdM(0x2c2f33,.5,.6);
  const slab=(x0,y0,x1,y1)=>{const q=quay.clone();q.map=top.clone();q.map.needsUpdate=true;q.map.repeat.set((x1-x0)/80,(y1-y0)/80);bdBox(g,x1-x0,-W+4,y1-y0,[wall,wall,q,wall,wall,wall],(x0+x1)/2,(W-4)/2,(y0+y1)/2);};
  slab(1000,150,1200,920);slab(1200,60,1660,920);slab(1380,-110,1446,60);   // the quays: west of the canal's mouth, east of it, and a pier out into the basin
  for(const[x0,x1,y]of[[1000,1200,150],[1200,1380,60],[1446,1652,60]])for(let x=x0+12;x<x1-6;x+=30){bdBox(g,6,4,2,fend,x,-3,y-1);bdCyl(g,1.6,2,3,bol,x+12,1.5,y+4,10);}   // fenders and bollards along the quay edges
  for(const y of[-100,-60,-20,20])for(const x of[1380,1446]){bdBox(g,2,4,6,fend,x+(x<1400?-1:1),-3,y);}
  // two warehouses, corrugated walls, roll doors to the quay, a lamp over each door
  const corr=bdTex(64,64,(x,w,h)=>{x.fillStyle='#6a7176';x.fillRect(0,0,w,h);for(let i=0;i<w;i+=8){x.fillStyle='rgba(0,0,0,.28)';x.fillRect(i,0,3,h);x.fillStyle='rgba(255,255,255,.07)';x.fillRect(i+4,0,2,h);}},1/12,1/30);
  const cm=new THREE.MeshStandardMaterial({map:corr,roughness:.6,metalness:.4}),roof=bdM(0x3b4146,.6,.45),door=bdM(0x2a2f33,.55,.5),lampM=new THREE.MeshBasicMaterial({color:0xffd9a0,toneMapped:false});
  for(const[x0,y0,w,d]of[[1222,104,150,96],[1474,96,160,104]]){const cx=x0+w/2,cy=y0+d/2,H=34;bdBox(g,w,H,d,cm,cx,H/2,cy);
    const rs=new THREE.Shape();rs.moveTo(-d/2-3,0);rs.lineTo(0,10);rs.lineTo(d/2+3,0);rs.lineTo(-d/2-3,0);const rg=new THREE.ExtrudeGeometry(rs,{depth:w+4,bevelEnabled:false});rg.translate(0,0,-(w+4)/2);const rm=new THREE.Mesh(rg,roof);rm.rotation.y=Math.PI/2;rm.position.set(cx,H,cy);rm.castShadow=true;g.add(rm);
    for(const dx of[-w/4,w/4]){bdBox(g,34,24,1,door,cx+dx,12,y0-.6);bdBox(g,4,1.4,2.4,lampM,cx+dx,27,y0-1.5);lamps.push({x:cx+dx,y:y0-10,h:27,c:0xffd9a0,i:1.4,d:170,east:1});}}
  // stacked containers on the quays, and a few by the pier
  const list=[],C=(x,y,w,h,col,stack=1)=>list.push({kind:'container',x,y,w,h,col,stack,east:1});
  C(1030,200,104,34,'#2e5759',2);C(1030,240,104,34,'#6a3324');C(1030,300,104,34,'#5b5f2c',2);C(1140,190,34,104,'#3c4a6b',2);
  C(1220,250,104,34,'#7a5a24',2);C(1330,250,104,34,'#2e5759');C(1460,240,104,34,'#6a3324',2);C(1570,240,34,104,'#3f4f3a',2);C(1392,40,34,60,'#7a2e2a');
  const keep=scene;scene=g;try{meshObjs(list);}finally{scene=keep;}
  // a gantry crane on the pier: two portal legs on rails, the girder across, its boom out over the basin
  const y1=bdM(0xc89a28,.55,.5);for(const y of[-40,10]){for(const x of[1384,1442]){bdBox(g,4,72,4,y1,x,36,y);}bdBox(g,64,5,5,y1,1413,72,y);}
  bdBox(g,6,6,150,y1,1413,76,-60);bdBox(g,12,10,12,bdM(0x3a3f44,.6,.4),1413,66,-90);for(const dz of[-60,-120])bdBeam(g,[1413,76,dz],[1413,46,dz],.5,bdM(0x1c1c1c,.6,.5));
  // a tug at the west quay
  const hull=new THREE.Mesh(new THREE.SphereGeometry(1,16,8,0,Math.PI*2,Math.PI/2,Math.PI/2),bdM(0x7a2620,.6,.2,{side:THREE.DoubleSide}));hull.scale.set(26,10,9);hull.position.set(1100,W+2,128);hull.castShadow=true;g.add(hull);
  bdBox(g,40,2,16,bdM(0x2a2c2e,.7,.2),1100,W+2.5,128);bdBox(g,14,9,10,bdM(0xd8d4c8,.7,.05),1092,W+8,128);bdCyl(g,2,2.4,8,bdM(0x1a1a1a,.6,.3),1102,W+14,128,10);
  // lamp posts along the quays
  const pole=bdM(0x1d2124,.6,.6);for(const[x,y]of[[1060,160],[1300,70],[1560,70],[1446,-90]]){bdCyl(g,1.2,1.6,36,pole,x,18,y,8);bdBox(g,6,2,4,lampM,x,35.6,y-2);lamps.push({x,y:y-4,h:35,c:0xffd9a0,i:1.5,d:200,east:1});}
}
