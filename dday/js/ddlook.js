"use strict";
/* D-Day test, the dressing (Bryan, after the first playable: "The drafts you are sending me look very barren and ugly. The
   graphics are very bad. If we can have something like Tiny Troopers but not as cute looking"): a bright, chunky, busy
   battlefield of our own. Everything here is looks only, on top of dday.js's map:
   - ddDress (from ddProps, before the land's props are mirrored to the sides): grass tufts, gorse and bushes on the cliff
     tops, hedgerow trees, stones on the rock faces and at their feet, stakes in the surf, lips round the shell holes,
     crates and helmets on the sand, mine signs, the base's trucks, tents and drums (their blocks are in ddObjects).
   - ddScenery (once, into the scene): a sky with clouds, ships on the horizon, barrage balloons, landing craft and men
     going up the beaches either side (ddCrowd: one instanced figure, cheap).
   - ddLookFrame (from ddFrame): the crowd, the balloons. (The surf is ddsea.js's since Version 188.) */
const ddHm=(x,y)=>ddH(x<0?-x:x>DDB.x1?2*DDB.x1-x:x,y);   // the ground's height anywhere, the mirrored sides too
function ddGroundAt(x,y){   // 'sand' | 'rock' | 'top' (grass on the cliff tops) | 'grass' (the base) | 'dirt' (the draw)
  const dx=ddMx(x);if(y>316&&!ddRock(dx,y))return y>700?'sea':'sand';
  const sl=Math.hypot(ddH(x+5,y)-ddH(x-5,y),ddH(x,y+5)-ddH(x,y-5))/10;
  if(sl>.3)return'rock';if(ddRock(dx,y))return'top';return y<-320?'grass':'dirt';
}
function ddInst(G,geo,mat,L,shadow){
  if(!L.length)return null;const m=new T.InstancedMesh(geo,mat,L.length),d=new T.Object3D(),c=new T.Color();
  L.forEach((q,i)=>{d.position.set(q.x,q.h,q.y);d.rotation.set(q.rx||0,q.ry||0,q.rz||0);d.scale.set(q.sx||1,q.sy||q.sx||1,q.sz||q.sx||1);d.updateMatrix();m.setMatrixAt(i,d.matrix);if(q.c!=null)m.setColorAt(i,c.set(q.c));});
  m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;m.castShadow=!!shadow;m.receiveShadow=true;m.frustumCulled=false;G.add(m);return m;
}
function ddDress(G,sc,M){
  const r=rng(606),X1=DDB.x1,pick=a=>a[(r()*a.length)|0];
  const tufts=[],bush=[],trunk=[],crown=[],crown2=[],stone=[],peb=[],stake=[],mine=[],can=[],pack=[],plank=[],helm=[],clod=[];
  // grass and gorse: thick on the tops and the base, thin in the draw (Version 188: tufts of blades, dark at the root and in deeper greens, so
  // they read as grass and not as pale specks)
  for(let i=0;i<5200;i++){const x=r()*X1,y=-756+r()*1070,k=ddGroundAt(x,y);if(k==='sand'||k==='sea'||k==='rock')continue;if(k==='dirt'&&r()<.75)continue;
    tufts.push({x,y,h:ddH(x,y)-.2,ry:r()*6,sx:.8+r()*.9,sy:.7+r()*1.1,c:pick([0x648a3c,0x749444,0x587e36,0x88904a,0x709042,0x989462])});}
  // (Version 188) turf hanging over the top of every face: a fringe of grass where the flat top breaks into the steep, hanging down the face
  const drape=[];for(let i=0;i<14000&&drape.length<900;i++){const x=r()*X1,y=-470+r()*790,k=ddGroundAt(x,y);if(k!=='top'&&k!=='dirt'&&k!=='grass')continue;
    const gx=ddH(x+6,y)-ddH(x-6,y),gy=ddH(x,y+6)-ddH(x,y-6),gl=Math.hypot(gx,gy);if(gl<2.2)continue;const ux=-gx/gl,uy=-gy/gl,below=(ddH(x+ux*4,y+uy*4)-ddH(x+ux*10,y+uy*10))/6;if(below<.75)continue;   // (only over a real face: on a slope the fringe stood out in the air)
    drape.push({x,y,h:ddH(x,y)-.3,ry:Math.atan2(-uy,ux)+(r()-.5)*.6,rz:-Math.atan(below)*.55,sx:.7+r()*.6,sy:.6+r()*.6,c:pick([0x587e36,0x648a3c,0x4e7230,0x6e8c40,0x7a8a46])});}
  for(let i=0;i<900;i++){const x=r()*X1,y=-756+r()*1070;if(ddGroundAt(x,y)!=='top')continue;
    bush.push({x,y,h:ddH(x,y)+2.2,ry:r()*6,sx:3.4+r()*4.5,sy:2.6+r()*2.8,c:pick([0x5b7c43,0x68894b,0x50703d,0x72854d,0x7f8b50])});}
  // trees: on the tops well back from their edges, and a hedgerow along the back of the base
  const tree=(x,y,s)=>{const h=ddH(x,y);trunk.push({x,y,h:h+7*s,sx:s,ry:r()*6});crown.push({x:x+(r()-.5)*3,y:y+(r()-.5)*3,h:h+19*s,sx:s*(1+r()*.25),sy:s*(.85+r()*.25),ry:r()*6,c:pick([0x4d6e37,0x5a7c3e,0x405f31,0x678543])});crown2.push({x:x+(r()-.5)*9*s,y:y+(r()-.5)*9*s,h:h+14*s+r()*4,sx:s*.72,ry:r()*6,c:pick([0x55773a,0x496837,0x698745])});};
  for(let i=0,n=0;i<700&&n<70;i++){const x=r()*X1,y=-440+r()*740;if(ddGroundAt(x,y)!=='top')continue;let ok=true;for(const[ox,oy]of[[26,0],[-26,0],[0,26],[0,-26]])if(ddGroundAt(x+ox,y+oy)!=='top')ok=false;if(!ok)continue;tree(x,y,.9+r()*.7);n++;}
  for(let x=10;x<X1;x+=24+r()*20)tree(x,-752+r()*10,1+r()*.6);
  // stones: tumbled down the faces and at their feet; shingle under the wall
  for(let i=0;i<2600&&stone.length<230;i++){const x=r()*X1,y=-460+r()*800,k=ddGroundAt(x,y);if(k!=='rock')continue;
    stone.push({x,y,h:ddH(x,y)-.5,ry:r()*6,rx:r()*2,sx:2+r()*r()*6,sy:1.4+r()*3,c:pick([0xa89a80,0x988a74,0xb4a68a,0x8a7e6c])});}
  for(let i=0;i<340;i++){const x=r()*X1,y=322+r()*r()*40;if(ddGroundAt(x,y)!=='sand')continue;peb.push({x,y,h:ddH(x,y)+.5,ry:r()*6,sx:1+r()*2.4,sy:.7+r(),c:pick([0xaaa498,0x96908a,0xc4beb2,0x88837a])});}
  // the surf's obstacles: stakes leaning seaward, some with a mine on top (Version 188: the mines drawn, Teller mines wired to the tops); and
  // what an army drops on a beach: ammunition boxes, packs, helmets, and the timbers of wrecked boats along the water's edge
  for(let x=14;x<X1;x+=17+r()*16){const y=716+r()*46,rx=.34+r()*.2,ry=(r()-.5)*.5,sy=.8+r()*.5,h=ddH(x,y)+6;stake.push({x,y,h,rx,ry,sx:1,sy});
    if(r()<.45){const L=7.6*sy,sz=L*Math.sin(rx),sh=L*Math.cos(rx);mine.push({x,y:y+sz,h:h+sh,rx,ry,sx:1});}}
  for(let i=0;i<150;i++){const x=r()*X1,y=350+r()*340;if(ddGroundAt(x,y)!=='sand')continue;const k=r();
    if(k<.3)can.push({x,y,h:ddH(x,y)+1.3,ry:r()*6,rz:(r()-.5)*.3,sx:.8+r()*.4,c:pick([0x6e744c,0x7a7650,0x646c48])});
    else if(k<.55)pack.push({x,y,h:ddH(x,y)+1,ry:r()*6,rz:(r()-.5)*.4,sx:.9+r()*.3,c:pick([0x6a6a4a,0x5e6446,0x74704e])});
    else helm.push({x,y,h:ddH(x,y)+.3,ry:r()*6,rz:(r()-.5)*1.2,sx:1,c:pick([0x5d6a42,0x4f5a3c])});}
  for(let i=0;i<70;i++){const x=r()*X1,y=640+r()*70;if(ddGroundAt(x,y)!=='sand')continue;plank.push({x,y,h:ddH(x,y)+.5,ry:r()*6,rz:(r()-.5)*.1,sx:.6+r()*1.2,sy:1,sz:.7+r()*.6,c:pick([0x7a6a52,0x685a46,0x8a7a5e,0x5e5c56])});}
  // the clods round each shell hole: the sand and the earth under it thrown out in lumps
  const holesW=DD_HOLES.map(h=>({x:h.x+DDX,y:h.y,r:h.r}));clod.push(...ddgClods(holesW,r,34,null,[104,88,64]));
  const lam=(c)=>new T.MeshLambertMaterial({color:c}),lamV=o=>new T.MeshLambertMaterial(Object.assign({color:0xffffff,vertexColors:true},o));
  // the shapes, each with its shading baked in (darker underneath) and its corners pulled about a little
  ddgInst(G,ddgTuftGeo(606),lamV({side:T.DoubleSide}),tufts,false);
  {const P=[],C=[];for(let k=0;k<14;k++){const z=(k/13-.5)*6+(r()-.5)*.6,l=1.6+r()*2,d=1+r()*2.6,w=.24,j=(r()-.5)*.8;   // a fringe: blades out over the edge and hanging down it
      P.push(0,0,z-w, 0,0,z+w, l*.55,.7,z+j*.5, l*.55,.7,z-w*.7+j*.5, l*.55,.7,z+w*.7+j*.5, l,-d,z+j);C.push(.42,.42,.42, .42,.42,.42, 1.1,1.1,1.1, 1.1,1.1,1.1, 1.1,1.1,1.1, .78,.78,.78);}
    const dg=new T.BufferGeometry();dg.setAttribute('position',new T.Float32BufferAttribute(P,3));dg.setAttribute('color',new T.Float32BufferAttribute(C,3));dg.computeVertexNormals();
    ddgInst(G,dg,lamV({side:T.DoubleSide}),drape,false);}
  ddgInst(G,ddgShade(ddgSmooth(ddgJitter(new T.IcosahedronGeometry(1,0),.22,4)),.5,1.12),lamV(),bush,true);
  ddInst(G,new T.CylinderGeometry(1.1,1.7,14,6),lam(0x5a4630),trunk,true);
  ddInst(G,ddgShade(ddgSmooth(ddgJitter(new T.IcosahedronGeometry(9,1),1.9,6)),.5,1.12),lamV(),crown,true);
  ddInst(G,ddgShade(ddgSmooth(ddgJitter(new T.IcosahedronGeometry(8,0),1.4,7)),.55,1.12),lamV(),crown2,true);
  const stG=ddgShade(ddgJitter(new T.DodecahedronGeometry(1,0),.18,8),.6,1.1);
  ddgInst(G,stG,new T.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true}),stone,true);
  ddgInst(G,stG,new T.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true}),peb,false);
  ddgInst(G,ddgShade(ddgJitter(new T.DodecahedronGeometry(1,0),.25,9),.55,1.05),new T.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true}),clod,false);
  ddInst(G,new T.CylinderGeometry(.9,1.1,15,5),lam(0x4d3c2a),stake,true);
  {const mg=new T.CylinderGeometry(1.7,1.7,1,10);mg.translate(0,.5,0);ddInst(G,mg,new T.MeshStandardMaterial({color:0x4e5240,roughness:.7,metalness:.4}),mine,true);}
  ddgInst(G,ddgMerge([{g:new T.BoxGeometry(5,2.8,2.4),c:0xffffff},{g:new T.BoxGeometry(5.2,.5,2.6),p:[0,1.5,0],c:0xd0d0c4},{g:new T.BoxGeometry(2,.6,.5),p:[0,2,0],c:0x8a8a80},{g:new T.BoxGeometry(5.3,.35,2.5),p:[0,-.6,0],c:0xa8a8a0}],true),new T.MeshStandardMaterial({color:0xffffff,roughness:.8,metalness:.05,vertexColors:true}),can,true);   // (dull painted steel: with any shine and nothing to reflect they came out black)
  {const pg=ddgBagGeo();pg.scale(5,4.6,6.4);ddgInst(G,ddgShade(pg,.6,1.08),lamV(),pack,true);}
  ddgInst(G,ddgShade(new T.BoxGeometry(14,1,2.4),.7,1.05),lamV(),plank,true);
  {const hg=ddgMerge([{g:new T.SphereGeometry(1.5,8,5,0,TAU,0,Math.PI*.5),c:0xffffff},{g:new T.CylinderGeometry(2.05,2.1,.25,10),p:[0,.05,0],c:0xc8c8c0}],true);   // (a helmet, its brim; they were green peas)
    ddgInst(G,ddgShade(hg,.55,1.1),new T.MeshStandardMaterial({color:0xffffff,roughness:.7,vertexColors:true}),helm,false);}
  // the lips of thrown sand round each shell hole (Version 188: a churned, uneven bank, dark and scorched on the inside, meeting the sand
  // in the sand's own colour, all of them one mesh: ddground.js's ddgCraters; it was a pale ring like a life belt)
  const one=(geo,mat,x,h,y,ry,rx,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,h,y);m.rotation.set(rx||0,ry||0,rz||0);m.castShadow=true;m.receiveShadow=true;G.add(m);return m;};
  ddgCraters(G,holesW,{seed:606});
  // mine signs by the wire and the gates
  const signT=canvasTex(96,64,(q,w,h)=>{q.fillStyle='#e9e2c8';q.fillRect(0,0,w,h);q.strokeStyle='#1c1a16';q.lineWidth=5;q.strokeRect(3,3,w-6,h-6);q.fillStyle='#1c1a16';q.font='bold 19px sans-serif';q.textAlign='center';q.fillText('ACHTUNG',w/2,27);q.fillStyle='#a3231a';q.font='bold 22px sans-serif';q.fillText('MINEN',w/2,52);});
  for(const[dx,y,ry]of[[150,478,.1],[40,340,-.2],[450,336,.15],[590,340,-.1]]){const x=dx+DDX,h=ddH(x,y);one(new T.BoxGeometry(.9,13,.9),lam(0x4d3c2a),x,h+6.5,y);const p=one(new T.BoxGeometry(11,7.4,.7),new T.MeshLambertMaterial({map:signT}),x,h+11,y+.7,ry);p.castShadow=false;}
  // the base's vehicles, tents, drums and its mast (blocks from ddObjects)
  // (Version 188: the trucks' canvas tilts and the tents in army canvas, the trucks with a windscreen, bumper and white star; the drums ribbed, chipped and rusting)
  const olive=M(0x5f6a44,.9),canvas=new T.MeshStandardMaterial({map:ddgTex('canvas'),color:0x9c9a6c,roughness:1}),tentM=new T.MeshStandardMaterial({map:ddgMatRep('canvas',24).map,color:0xb0a678,roughness:1}),tyre=M(0x1e1e1c,.9),drumC=[0x5a6a48,0x8a3a26,0x4a5258],drumM=drumC.map(c=>new T.MeshStandardMaterial({map:ddgTex('drum'),color:c,roughness:.6,metalness:.15})),glassM=M(0x2a3034,.3,.4),starM=new T.MeshStandardMaterial({color:0xe8e6dc,roughness:.8});
  for(const o of DD.objs){const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=ddH(cx,cy);
    if(o.kind==='ddtruck'&&typeof ddrHas==='function'&&ddrHas('ddrVehTruck')){   // (Version 246, the draft: ddrveh.js's lorry; theirs on the beach's top, ours once the base is)
      const t=ddrPlain(ddrVehTruck(DD_MODE==='beach'?'opel':'gmc',0));t.position.set(cx,g0,cy);t.rotation.y=o.h>=o.w?-Math.PI/2:0;t.scale.setScalar(Math.min(1,Math.max(o.w,o.h)/62));t.userData.real=true;G.add(t);o.meshes=ddrMeshes(t);}
    else if(o.kind==='ddtruck'){o.meshes=[one(new T.BoxGeometry(o.w-4,5,o.h),olive,cx,g0+7,cy),one(new T.BoxGeometry(o.w-4,13,o.h*.26),olive,cx,g0+15,o.y+o.h*.86),one(ddgBoxUV(o.w-2,15,o.h*.62,24),canvas,cx,g0+17,o.y+o.h*.33)];
      o.meshes.push(one(new T.BoxGeometry(o.w-7,5,.5),glassM,cx,g0+18,o.y+o.h*.73-.3),one(new T.BoxGeometry(o.w,1.6,1.6),M(0x3a3e30,.8),cx,g0+5,o.y+o.h+.4),one(new T.BoxGeometry(.4,6,6),starM,cx+o.w/2-1.8,g0+16,o.y+o.h*.86));
      for(const sx of[-1,1])for(const fz of[.16,.5,.86]){const w=one(new T.CylinderGeometry(4.6,4.6,3.4,10),tyre,cx+sx*(o.w/2-2),g0+4.6,o.y+o.h*fz,0,0,Math.PI/2);o.meshes.push(w);}}
    else if(o.kind==='ddtent'){const sh=new T.Shape();sh.moveTo(-o.w/2,0);sh.lineTo(o.w/2,0);sh.lineTo(0,o.w*.5);sh.closePath();const t=one(new T.ExtrudeGeometry(sh,{depth:o.h,bevelEnabled:false}),tentM,cx,g0,o.y);o.meshes=[t];}
    else if(o.kind==='dddrum'){o.meshes=[];for(let k=0;k<5;k++){const a=k*1.26,x=cx+Math.cos(a)*(k?6:0),y=cy+Math.sin(a)*(k?6:0);o.meshes.push(one(new T.CylinderGeometry(3.3,3.3,9.5,12),drumM[k%3],x,g0+4.8,y,k*1.7));}}
    else if(o.kind==='ddmast'){o.meshes=[one(new T.CylinderGeometry(.7,1.2,150,6),M(0x6a6e70,.6,.6),cx,g0+75,cy)];for(const hh of[40,80,120])o.meshes.push(one(new T.BoxGeometry(13,.8,.8),M(0x6a6e70,.6,.6),cx,g0+hh,cy));
      for(const a of[.5,2.6,4.7])o.meshes.push(one(new T.CylinderGeometry(.18,.18,150,3),M(0x40423f,.7),cx+Math.cos(a)*34,g0+68,cy+Math.sin(a)*34,-a,0,.46));}
  }
}
/* ---------- beyond the map: sky, ships, balloons, the landings either side ---------- */
function ddScenery(sc){
  const r=rng(1944),X1=DDB.x1;
  // (the sky: ddlight.js's ddDome since Version 188)
  const one=(geo,mat,x,h,z,p)=>{const m=new T.Mesh(geo,mat);m.position.set(x,h,z);(p||sc).add(m);return m;};
  // ships out at sea, and barrage balloons over them
  const hull=new T.MeshLambertMaterial({color:0x56626c});
  for(let i=0;i<9;i++){const L=260+r()*260;
    if(typeof ddReal==='function'&&ddReal()&&typeof ddrShip==='function'){   // (Version 246, the draft: ships with a ship's shape, ddreal.js; the same draws of the dice as the boxes, so the rest of the scenery lands where it did)
      const rg=ddrShip(i%3===1?'transport':'destroyer');r();r();rg.scale.setScalar(L/400);rg.position.set(-2400+i*720+r()*300,0,1900+r()*1300);rg.rotation.y=(r()-.5)*.5+(i%2?Math.PI:0);sc.add(rg);continue;}
    const g=new T.Group();one(new T.BoxGeometry(L,26,44),hull,0,10,0,g);one(new T.BoxGeometry(L*.3,30,30),hull,(r()-.5)*L*.3,38,0,g);one(new T.CylinderGeometry(6,8,34,8),hull,(r()-.5)*L*.2,66,0,g);one(new T.BoxGeometry(L*.18,10,10),hull,-L*.3,28,0,g);
    g.position.set(-2400+i*720+r()*300,0,1900+r()*1300);g.rotation.y=(r()-.5)*.5;sc.add(g);}
  DD.balloons=[];const bm=new T.MeshLambertMaterial({color:0xc4c8c6});
  for(let i=0;i<7;i++){const g=new T.Group(),b=one(new T.SphereGeometry(1,12,8),bm,0,0,0,g);b.scale.set(52,20,20);for(const a of[0,2.1,4.2]){const f=one(new T.BoxGeometry(22,16,2),bm,-42,Math.cos(a)*13,Math.sin(a)*13,g);f.rotation.x=a;}
    const hh=250+r()*150;one(new T.CylinderGeometry(.5,.5,hh,3),new T.MeshBasicMaterial({color:0x40464a}),0,-hh/2,0,g);
    g.position.set(-1500+i*650+r()*300,hh,1050+r()*900);g.rotation.y=.4+r()*.5;sc.add(g);DD.balloons.push(g);}
  // landing craft on the beaches either side, some coming in
  DD.sideBoats=[];
  for(const s of[-1,1])for(let k=0;k<4;k++){const m=ddBoatMesh(sc,k===3),x=s<0?-110-k*230-r()*60:X1+110+k*230+r()*60;m.position.set(x,1.2,806+(k%2)*8);if(k===3){m.rotation.set(.04,.5,.2);}else{m.userData.ramp.rotation.x=-1.75;DD.sideBoats.push({m,x,ph:r()*30});}}
  DD.surf=[];   // (the surf: ddsea.js's shore break since Version 188)
  ddCrowd(sc);
}
// the men going up the beaches next door: one instanced body and head each, run on a little state of their own
function ddCrowd(sc){
  const N=96,body=new T.BoxGeometry(4.6,8.4,3.2);body.translate(0,6.6,0);const head=new T.SphereGeometry(2.3,7,5);head.translate(0,12.6,0);
  const B=new T.InstancedMesh(body,new T.MeshLambertMaterial({color:0x7a7a4c}),N),Hd=new T.InstancedMesh(head,new T.MeshLambertMaterial({color:0x5d6a42}),N);
  for(const m of[B,Hd]){m.frustumCulled=false;m.castShadow=true;sc.add(m);}
  const r=rng(77),L=[];for(let i=0;i<N;i++){const q={side:i%2?1:-1};ddCrowdSpawn(q,r,true);L.push(q);}
  DD.crowd={B,Hd,L,r,d:new T.Object3D()};
}
function ddCrowdSpawn(q,r,any){
  const off=40+r()*880;q.x=q.side<0?-off:DDB.x1+off;q.y=any?330+r()*440:760+r()*30;q.spd=30+r()*26;q.st='run';q.t=1+r()*4;q.ph=r()*6;q.goal=326+r()*110;
}
function ddLookFrame(dt,now){
  if(!DD)return;
  for(const g of DD.balloons||[])g.rotation.y+=Math.sin(now*.2+g.position.x)*.0006;
  for(const b of DD.sideBoats||[])b.m.position.y=1.2+Math.sin(now*1.5+b.ph)*.4;
  const C=DD.crowd;if(!C)return;const d=C.d;
  C.L.forEach((q,i)=>{
    q.t-=dt;
    if(q.st==='run'){q.y-=q.spd*dt;q.ph+=dt*11;if(q.y<=q.goal){q.st='hold';q.t=6+C.r()*14;}else if(q.t<=0){if(C.r()<.16){q.st='dead';q.t=9+C.r()*8;}else{q.st='prone';q.t=.8+C.r()*2.4;}}}
    else if(q.st==='prone'){if(q.t<=0){q.st='run';q.t=1.5+C.r()*4;}}
    else if(q.t<=0)ddCrowdSpawn(q,C.r);
    const h=ddHm(q.x,q.y);d.position.set(q.x,Math.max(h,-3)+(q.st==='run'?Math.abs(Math.sin(q.ph))*1.3:0),q.y);
    d.rotation.set(q.st==='dead'?-Math.PI/2:q.st==='run'?-.22:0,0,0);d.scale.set(1.25,q.st==='prone'||q.st==='hold'?.7:1.25,1.25);if(q.st==='dead')d.position.y=Math.max(h,-3)+2;
    d.updateMatrix();C.B.setMatrixAt(i,d.matrix);C.Hd.setMatrixAt(i,d.matrix);});
  C.B.instanceMatrix.needsUpdate=true;C.Hd.instanceMatrix.needsUpdate=true;
}
