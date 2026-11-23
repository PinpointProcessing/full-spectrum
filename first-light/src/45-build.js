/* Builds the 3D neighborhood from the map objects, plus scenery that has no collision. */
const tvCan=document.createElement('canvas');tvCan.width=384;tvCan.height=216;
const tvTex=new T.CanvasTexture(tvCan);tvTex.encoding=T.sRGBEncoding;
let MARKS=[],safeDoorGrp,doorPivot,fwinGlass,grateGrp,valveWheel,hydrantFx=null,tvScreen,bedBlanket,copBars=[],pipeLamp;

function vehicle(o){
  const hz=o.w>=o.h,L=hz?o.w:o.h,Wd=hz?o.h:o.w,g=new T.Group(),it=[],lit=[];
  const col=o.burn&&o.wreck?0x241c18:o.col,dk=0x121418,glass=0x141c26;
  const wheels=(xs,r,y)=>{for(const x of xs)for(const s of[-1,1])it.push(cy(r,r,2.6,10,x,y||r,s*(Wd/2-.4),0x101112,PI/2,0,0));};
  if(o.kind==='car'){
    it.push(bx(L,5.6,Wd,0,5.6,0,col),bx(L*.5,5,Wd-2.4,-L*.05,10.8,0,glass),bx(L*.46,.9,Wd-2.8,-L*.05,13.6,0,col),bx(1.4,2.4,Wd+.4,L/2,4.2,0,dk),bx(1.4,2.4,Wd+.4,-L/2,4.2,0,dk));
    if(o.police)it.push(bx(L*.34,5.8,Wd+.3,-L*.03,5.6,0,0x15181c),bx(3,1,Wd*.7,-L*.05,14.4,0,0x222222));
    if(o.wreck)it.push(bx(L*.26,.8,Wd-1,L*.36,10.2,0,col,0,0,.7));
    wheels([-L*.31,L*.31],3.5);
    for(const s of[-1,1]){lit.push(bx(.7,1.5,3,L/2+.5,6.4,s*(Wd/2-2.6),o.wreck&&!o.police?0x554d3a:0xfff0c0));lit.push(bx(.7,1.3,3,-L/2-.5,6.6,s*(Wd/2-2.6),0x8a1410));}
  }else if(o.kind==='van'){
    it.push(bx(L,14.5,Wd,0,10.5,0,col),bx(1,6,Wd-3,L/2-.2,13,0,glass),bx(L*.2,5,Wd+.3,L*.3,13.5,0,glass),bx(1.4,2.4,Wd+.4,L/2,4.2,0,dk),bx(L*.5,.6,Wd*.7,-L*.1,18,0,0xb9b6ae));
    wheels([-L*.32,L*.32],3.6);
  }else if(o.kind==='truck'){
    it.push(bx(L-28,22,Wd,-14,15,0,col),bx(24,14,Wd-2,L/2-12,10,0,0x3f6a8a),bx(1,6,Wd-4,L/2,12.5,0,glass),bx(L-28,3,Wd+.4,-14,5,0,0x2a2a2a));
    wheels([-L*.36,-L*.2,L*.36],4.2);
  }else if(o.kind==='bus'){
    it.push(bx(L,18,Wd,0,13,0,col),bx(L*.9,6,Wd+.4,0,16.5,0,glass),bx(L,1.6,Wd+.5,0,9.5,0,0x1c1c1c),bx(L*.96,1,Wd*.9,0,22.4,0,0xefc04a),bx(1,7,Wd-3,L/2,15.5,0,glass));
    wheels([-L*.34,L*.34],4.4);
    lit.push(bx(1,2,3,-L/2-.4,20,Wd/2-3,0xff3020),bx(1,2,3,-L/2-.4,20,-Wd/2+3,0xff3020));
  }else if(o.kind==='ambo'){
    it.push(bx(L*.62,20,Wd,-L*.19,13.5,0,col),bx(L*.38,13,Wd-1,L*.31,10,0,col),bx(L*.62,2.6,Wd+.4,-L*.19,10,0,0xd2332a),bx(1,5.5,Wd-4,L/2,12.5,0,glass),
      bx(1,18,Wd*.48,-L/2-6,12.5,Wd*.42,col,0,-.9,0),bx(1,18,Wd*.48,-L/2-6,12.5,-Wd*.42,col,0,.9,0));
    wheels([-L*.3,L*.32],3.9);
    lit.push(bx(3,1.6,Wd*.8,L*.14,24.3,0,0xff3020));
  }
  const body=new T.Mesh(merge(it),vmat({roughness:o.wreck?.75:.42,metalness:o.wreck?.2:.45}));body.castShadow=body.receiveShadow=true;g.add(body);
  if(lit.length){const lm=new T.Mesh(merge(lit),emat());g.add(lm);}
  const cx=o.x+o.w/2,cz=o.y+o.h/2;
  g.position.set(cx,0,cz);g.rotation.y=(hz?0:-PI/2)-(o.rot||0);
  if(o.wreck&&o.kind==='car')g.rotation.z=.04;
  scene.add(g);o.grp=g;
  if(KIND[o.kind]&&KIND[o.kind].tall)fadeable(o,[body.material]);
  if(o.police){
    for(const[c,s]of[[0xff2020,-1],[0x2060ff,1]]){
      const m=new T.Mesh(new T.BoxGeometry(2.4,1.6,Wd*.32),new T.MeshBasicMaterial({color:c,toneMapped:false}));m.position.set(-L*.05,15.6,s*Wd*.2);g.add(m);
      const e=emitter(cx+s*3,cz,17,c,3.2,190,3,30);e.ph=s>0?0:1;copBars.push({m,e,c});
    }
  }
  if(o.burn){o.fx=fireAt(cx+(hz?8:0),cz+(hz?0:8),9,7,24,1,3.4);}
  if(o.kind==='ambo'){const e=emitter(cx,cz,26,0xff3020,2.2,170,3,22);e.ph=0;}
  if(o.kind==='bus'){const e=emitter(cx,o.y+o.h+4,20,0xff3020,1.6,120,3,16);e.ph=.5;}
  if(o.kind==='car'&&!o.wreck&&o.style){/* parked, dark */}
  else if(o.kind==='car'&&o.wreck&&!o.burn){const a=g.rotation.y;for(const s of[-1,1])glowAt(cx+Math.cos(a)*(L/2+2)+Math.sin(a)*s*(Wd/2-3),6.5,cz-Math.sin(a)*(L/2+2)+Math.cos(a)*s*(Wd/2-3),0xfff0c0,13);}
  return g;
}

function buildHouse(o){
  const cx=o.x+o.w/2,cz=o.y+o.h/2,hh=30,ridgeX=o.ridge==='x';
  const face=o.y>1200?'n':cx<360?'e':'w';
  const col=o.fire?0x3b2c25:o.col,trim=o.fire?0x4a3d36:0xe8e2d4;
  const it=[bx(o.w,hh,o.h,cx,hh/2,cz,col),bx(o.w+2,3,o.h+2,cx,1.5,cz,0x55524c),bx(o.w+3,1.4,o.h+3,cx,hh-.4,cz,trim)];
  it.push(bx(9,18,9,cx+(ridgeX?o.w*.26:5),hh+13,cz+(ridgeX?5:o.h*.26),0x6b4a40));
  // porch, door and garage on the street side
  const fx=face==='e'?1:face==='w'?-1:0,fz=face==='n'?-1:0;
  const px=cx+fx*(o.w/2+7),pz=cz+fz*(o.h/2+7),along=fx?'z':'x';
  const P=(w,h,d,ox,oy,oz,c)=>it.push(along==='z'?bx(d,h,w,px+oz,oy,pz+ox,c):bx(w,h,d,px+ox,oy,pz+oz,c));
  P(44,1.6,14,-18,.8,0,0x8a8478);P(46,1.4,16,-18,19.5,0,o.roof);P(1.6,18,1.6,-39,10,5,trim);P(1.6,18,1.6,3,10,5,trim);
  P(11,19,1,-18,9.5,-6.6,o.fire?0x1a1412:0x5a3526);
  P(46,17,1,34,8.5,-6.6,o.fire?0x2b2420:0xd9d5ca);
  const walls=add(merge(it,1/32),vmat({map:TX.siding}),0,0,0);
  const roofM=vmat({map:TX.shingle,roughness:.95});
  const roof=add(merge([part(roofGeo((ridgeX?o.w:o.h)+12,(ridgeX?o.h:o.w)+14,21),cx,hh,cz,o.roof,0,ridgeX?0:PI/2,0)],1/20),roofM,0,0,0);
  // windows: lit, dark or burning
  const wi=[],r=rng(o.x*13+o.y),W0=13,Hh=11;
  const win=(x,z,rot,lit)=>{const c=o.fire?0xff7a2a:lit?0xffcf8a:0x1a2230;it2.push(rot?bx(.8,Hh+2,W0+2,x,16,z,trim):bx(W0+2,Hh+2,.8,x,16,z,trim));wi.push(rot?bx(1,Hh,W0,x+(rot>0?.3:-.3),16,z,c):bx(W0,Hh,1,x,16,z+(lit===-9?0:0),c));};
  const it2=[];
  for(const side of['n','s','e','w']){
    const horiz=side==='n'||side==='s',len=horiz?o.w:o.h,n=Math.max(2,Math.floor(len/42));
    for(let k=0;k<n;k++){
      const t=(k+.5)/n,lit=r()<.4;
      if(side===face&&Math.abs(t-.5)<.36&&k>0)continue;   // leave room for door and garage
      if(side==='s')win(o.x+t*o.w,o.y+o.h+.3,0,lit);else if(side==='n')win(o.x+t*o.w,o.y-.3,0,lit);
      else if(side==='e')win(o.x+o.w+.3,o.y+t*o.h,1,lit);else win(o.x-.3,o.y+t*o.h,-1,lit);
    }
  }
  const frames=add(merge(it2),vmat(),0,0,0,1);
  const wm=emat({transparent:true});const wmesh=add(merge(wi),wm,0,0,0,1);wmesh.castShadow=false;
  fadeable(o,[walls.material,roofM,frames.material,wm]);
  if(o.fire){
    o.winMat=wm;
    fireAt(cx-20,cz-10,hh+14,22,34,1.7,5);fireAt(cx+30,cz+26,hh+8,18,22,1.3,0);fireAt(o.x-4,cz+10,14,6,12,1,3);fireAt(cx,o.y+o.h+3,16,30,16,1,3.5);
  }else if(r()<.8){
    emitter(px-(along==='z'?0:18),pz-(along==='z'?18:0),17,0xffc890,1.5,120,r()<.3?2:0,10);   // porch light
  }
}

function buildTree(o,burnt,i){
  const cx=o.x+4,cz=o.y+4,r=rng(i*31+7);
  const it=[cy(1.8,3,26,7,cx,13,cz,burnt?0x15110f:0x3d2e22)];
  add(merge(it),vmat(),0,0,0);
  if(burnt){
    const br=[];for(let k=0;k<5;k++){const a=r()*TAU;br.push(cy(.5,1.1,14,5,cx+Math.cos(a)*5,28+r()*4,cz+Math.sin(a)*5,0x15110f,Math.sin(a)*.8,0,-Math.cos(a)*.8));}
    add(merge(br),vmat(),0,0,0);fireAt(cx,cz,26,6,9,.8,1.6);return;
  }
  const cs=[];
  for(let k=0;k<4;k++){const g=new T.IcosahedronGeometry(11+r()*6,0);cs.push(part(g,cx+r()*14-7,30+r()*10,cz+r()*14-7,[0x35542f,0x2d4a2b,0x426237,0x4d5e2c][k%4],r()*3,r()*3,0));}
  const m=vmat({flatShading:true,roughness:1});add(merge(cs),m,0,0,0);
  fadeable(o,[m],18);
}

function buildHome(){
  // floors
  ground(HS.x0,HS.y0,HS.x1-HS.x0,HS.y1-HS.y0,TX.concrete,60,0x3a3a3a,.1);
  ground(256,1226,208,78,TX.wood,26,0xb89a78,.16,.7);
  ground(256,1310,102,84,TX.carpet,24,0x8a8296,.16);
  ground(364,1310,100,84,TX.tile,16,0xd8dbd8,.16,.5);
  ground(318,1304,30,6,TX.wood,26,0x8a7458,.16);ground(358,1326,6,30,TX.tile,16,0xb8bbb8,.16);ground(346,1220,30,6,TX.wood,26,0x6a5848,.16);
  ground(276,1322,60,26,TX.carpet,30,0x7a3838,.2);      // bedroom rug
  ground(286,1246,50,42,TX.carpet,30,0x3d5066,.2);      // living room rug
  // walls, each with its own material so it can fade when it blocks the view
  for(const o of objs){
    if(!o.home)continue;
    const cx=o.x+o.w/2,cz=o.y+o.h/2;
    if(o.kind==='wall'){
      const m=vmat({roughness:.95});
      add(merge([bx(o.w,WALLH,o.h,cx,WALLH/2,cz,0xbfb5a2),bx(o.w+.6,2.4,o.h+.6,cx,1.2,cz,0xe9e4d8),bx(o.w+.4,1,o.h+.4,cx,WALLH+.5,cz,0x4a433c)]),m,0,0,0);
      fadeable(o,[m]);
    }else if(o.kind==='window'||o.kind==='fwin'){
      const hz=o.w>o.h,m=vmat({roughness:.95});
      const it=[bx(o.w,9,o.h,cx,4.5,cz,0xbfb5a2),bx(o.w,6,o.h,cx,WALLH-3,cz,0xbfb5a2),bx(o.w+.8,1,o.h+.8,cx,9.5,cz,0xe9e4d8),bx(o.w+.4,1,o.h+.4,cx,WALLH+.5,cz,0x4a433c)];
      // curtains
      if(hz){it.push(bx(5,12,1,o.x+2.5,15,cz+2.4,0x6d7f95),bx(5,12,1,o.x+o.w-2.5,15,cz+2.4,0x6d7f95));}
      add(merge(it),m,0,0,0);
      const gl=new T.Mesh(hz?new T.BoxGeometry(o.w,11,.6):new T.BoxGeometry(.6,11,o.h),new T.MeshStandardMaterial({color:0x9fc4e0,transparent:true,opacity:.2,roughness:.05,metalness:.3,depthWrite:false}));
      gl.position.set(cx,15,cz);scene.add(gl);
      o.glass=gl;if(o.kind==='fwin')fwinGlass=gl;
      fadeable(o,[m]);
    }else if(o.kind==='door'){
      const m=vmat();add(merge([bx(o.w,5,o.h,cx,WALLH-2.5,cz,0xbfb5a2),bx(o.w+.4,1,o.h+.4,cx,WALLH+.5,cz,0x4a433c)]),m,0,0,0);
      doorPivot=new T.Group();doorPivot.position.set(o.x+1,0,cz);
      const d=new T.Mesh(merge([bx(28,22,1.6,14,11,0,0x6a3d2b),bx(8,6,1.9,14,16,0,0x7b4a35),bx(1.4,1.4,2.6,25,10.5,0,0xd8c27a)]),vmat({roughness:.6}));d.castShadow=true;doorPivot.add(d);scene.add(doorPivot);
      fadeable(o,[m,d.material]);
    }else if(o.kind==='bed'){
      add(merge([bx(o.w,4,o.h,cx,2.4,cz,0x5a4030),bx(o.w,5,2.5,cx,6,o.y+o.h-1.2,0x4a3326),bx(o.w-1.5,3,o.h-3,cx,5.6,cz-1,0xa9a69e),bx(o.w-12,2,7,cx,7.6,o.y+o.h-8,0xc4c1b8)]),vmat(),0,0,0);
      bedBlanket=add(merge([bx(o.w-.6,2.2,o.h-15,cx,7.2,o.y+13.5,0x3c5878),bx(o.w-.6,.9,3,cx,8,o.y+o.h-14.5,0xdcd8cc)]),vmat({roughness:1}),0,0,0);
    }else if(o.kind==='fridge'){
      const m=vmat({roughness:.4,metalness:.3});add(merge([bx(o.w,23,o.h,cx,11.5,cz,0xdfe1e2),bx(.8,8,1,o.x-.3,14,cz-4,0x9a9a9a)]),m,0,0,0);fadeable(o,[m]);
    }else if(o.kind==='furn'){
      const it=[],f=o.f;
      if(f==='night'){it.push(bx(o.w,8,o.h,cx,4,cz,0x6a4a36),cy(1.2,1.8,3,8,cx,9.5,cz,0x2a2a2a),cy(3.2,4.2,4.5,10,cx,13,cz,0xf1d9a6));emitter(cx,cz,14,0xffb060,.5,80,0,10);}
      else if(f==='dresser'){it.push(bx(o.w,10,o.h,cx,5,cz,0x5c4232),bx(o.w-2,.6,o.h+.6,cx,7,cz,0x3f2c20),bx(o.w-2,.6,o.h+.6,cx,3.6,cz,0x3f2c20),bx(27,16.5,1.6,cx,19,cz-1,0x0d0d0f),bx(8,1.2,5,cx,10.6,cz-1,0x0d0d0f));
        tvScreen=new T.Mesh(new T.PlaneGeometry(25,14.1),new T.MeshBasicMaterial({map:tvTex,toneMapped:false}));tvScreen.position.set(cx,19,cz-.1);scene.add(tvScreen);}
      else if(f==='tub')it.push(bx(o.w,7,o.h,cx,3.5,cz,0xe6e8e8),bx(o.w-5,1,o.h-5,cx,7,cz,0x9fc2cc));
      else if(f==='sink')it.push(bx(o.w,9,o.h,cx,4.5,cz,0xcfd3d2),bx(o.w,10,1,cx,18,o.y+o.h-.6,0x9fb7c8));
      else if(f==='sofa'){if(o.w<o.h)it.push(bx(o.w,5,o.h,cx,3.5,cz,0x54657a),bx(4,7,o.h,o.x+2,8.5,cz,0x4a5a6e),bx(o.w,4,4,cx,7,o.y+2,0x4a5a6e),bx(o.w,4,4,cx,7,o.y+o.h-2,0x4a5a6e));
        else it.push(bx(o.w,5,o.h,cx,3.5,cz,0x6a5a4a),bx(o.w,7,4,cx,8.5,o.y+2,0x5a4b3d),bx(4,4,o.h,o.x+2,7,cz,0x5a4b3d),bx(4,4,o.h,o.x+o.w-2,7,cz,0x5a4b3d));}
      else if(f==='cot'){const lw=o.w>o.h;it.push(bx(o.w,4,o.h,cx,2.4,cz,0x4a3326),bx(o.w-1.5,3,o.h-1.5,cx,5.6,cz,0xa9a69e),lw?bx(o.w*.6,2.2,o.h-.6,cx+o.w*.18,7,cz,0x6a4a52):bx(o.w-.6,2.2,o.h*.6,cx,7,cz+o.h*.18,0x6a4a52),lw?bx(7,2,o.h-10,o.x+6,7.6,cz,0xc4c1b8):bx(o.w-10,2,7,cx,7.6,o.y+6,0xc4c1b8));}
      else if(f==='chest')it.push(bx(o.w,11,o.h,cx,5.5,cz,0x5c4232),bx(o.w+.6,.6,o.h+.6,cx,7.6,cz,0x3f2c20),bx(o.w+.6,.6,o.h+.6,cx,3.8,cz,0x3f2c20),bx(o.w+1,.8,o.h+1,cx,11.2,cz,0x6e5140),bx(4,5,3,cx-o.w*.2,14,cz,0x8a9aa4));
      else if(f==='shelf'){it.push(bx(o.w,21,o.h,cx,10.5,cz,0x4a3828));for(let k=0;k<4;k++)it.push(bx(o.w+.5,.7,o.h+.5,cx,2+k*5.4,cz,0x2e2218),bx(o.w>o.h?o.w*.7:o.w+.7,3.4,o.w>o.h?o.h+.7:o.h*.7,cx,4.2+k*5.4,cz,[0x7a3b32,0x3d5a6e,0x8a7d4a,0x4d6a48][k]));}
      else if(f==='table')it.push(bx(o.w,1.2,o.h,cx,5,cz,0x6a4a36),bx(o.w-4,4,o.h-4,cx,2.2,cz,0x4a3326),bx(5,1,7,cx-2,6,cz+3,0xd8d2c0));
      else it.push(bx(o.w,9.5,o.h,cx,4.75,cz,0x494540),bx(o.w+1,1,o.h+1,cx,10,cz,0xd4cec2));
      add(merge(it),vmat(),0,0,0);
    }
  }
  // exterior shell colour on the outside faces is skipped: the walls fade whenever they'd matter.
  // roof: only shown from outside
  const rm=vmat({map:TX.shingle,transparent:true,roughness:.95});
  const roof=add(merge([part(roofGeo(HS.x1-HS.x0+14,HS.y1-HS.y0+14,24),(HS.x0+HS.x1)/2,WALLH+1,(HS.y0+HS.y1)/2,0x3a332f),bx(HS.x1-HS.x0+2,1.2,HS.y1-HS.y0+2,(HS.x0+HS.x1)/2,WALLH+1,(HS.y0+HS.y1)/2,0x2a2522)],1/20),rm,0,0,0);
  world.homeRoof={m:roof,cur:0};roof.visible=false;
  // hall light, porch light, some clutter
  emitter(361,1262,24,0xffd2a0,1.1,150,0,0);
  emitter(361,1214,20,0xffc890,1.6,130,2,10);
  add(merge([bx(44,1.4,12,361,.7,1214,0x8a8478),bx(4,9,4,382,4.5,1232,0x3b2f28),bx(10,7,6,440,13.5,1232,0x8a8f96),bx(3,4,3,410,12,1270,0xc8442e)]),vmat(),0,0,0);
}

function buildWorld(){
  { // the barricade on Ruth's garage: planks nailed across the doorway
    safeDoorGrp=new T.Group();const cx=safeDoor.x+3,cz=safeDoor.y+10,it=[bx(2.4,21,20,cx,10.5,cz,0x5a4030)];
    for(let i=0;i<4;i++)it.push(bx(3.6,2.6,24,cx+.4,4+i*4.6,cz,0x8a6a42,rand(-.12,.12),0,0));
    const m=new T.Mesh(merge(it),vmat({roughness:.9}));m.castShadow=true;safeDoorGrp.add(m);scene.add(safeDoorGrp);
    glowAt(SAFE.dx+6,16,SAFE.dy,0xffd98a,22);
  }
  // a red ring turning on the ground wherever there is a way in
  const ring=(x,y)=>{const m=new T.Mesh(new T.RingGeometry(7,9.2,28,1,0,PI*1.55),new T.MeshBasicMaterial({color:0xff3324,transparent:true,opacity:.9,side:T.DoubleSide,depthWrite:false}));m.rotation.x=-PI/2;m.position.set(x,.7,y);scene.add(m);MARKS.push(m);glowAt(x,3,y,0xff3324,26);return m;};
  ring(SAFE.dx+12,SAFE.dy);
  for(const R of ROOMS){
    const H=R.H,cx=H.x+H.w/2,cz=H.y+H.h/2,hz=R.side==='s';
    const fl=new T.Mesh(merge([bx(H.w-8,.5,H.h-8,cx,.3,cz,0x6a5138)]),vmat({roughness:.9}));fl.receiveShadow=true;scene.add(fl);
    R.roof=new T.Mesh(merge([bx(H.w+10,3,H.h+10,cx,WALLH+2.5,cz,H.roof),bx(H.w*.72,7,H.h*.72,cx,WALLH+7,cz,H.roof),bx(H.w*.4,6,H.h*.4,cx,WALLH+13,cz,H.roof)]),vmat({roughness:.95}));R.roof.castShadow=true;scene.add(R.roof);
    const d=R.door,dx=d.x+d.w/2,dz=d.y+d.h/2;R.grp=new T.Mesh(merge([bx(hz?d.w:2,21,hz?2:d.h,dx,10.5,dz,0x6a3d2b),bx(hz?8:2.4,6,hz?2.4:8,dx,16,dz,0x7b4a35)]),vmat({roughness:.6}));R.grp.castShadow=true;scene.add(R.grp);
    ring(R.out.x,R.out.y);
    for(const q of R.lamp){emitter(q[0],q[1],19,0xffc98a,1.25,150,0,0);}
  }
  { const it=[];for(const[x,y,w,h,c]of RUGS)it.push(bx(w,.3,h,x+w/2,.7,y+h/2,c),bx(w-5,.34,h-5,x+w/2,.72,y+h/2,(c&0xfefefe)>>1));
    const m=new T.Mesh(merge(it),vmat({roughness:1}));m.receiveShadow=true;scene.add(m); }
  { // road flares
    const it=[];for(const[x,y]of FLARES){it.push(cy(.5,.5,5,6,x,.6,y,0xb3261e,0,0,PI/2));glowAt(x+2.5,2.5,y,0xff4a30,20);}
    scene.add(new T.Mesh(merge(it),vmat({roughness:.7})));
  }
  for(const[x,y,dir]of SIGNS){ // evacuation signs
    const tex=canvasTex(256,128,(g,w,h)=>{g.fillStyle='#e8791c';g.fillRect(0,0,w,h);g.strokeStyle='#1a1410';g.lineWidth=8;g.strokeRect(6,6,w-12,h-12);g.fillStyle='#1a1410';g.textAlign='center';g.font='bold 30px sans-serif';g.fillText('EVACUATION',w/2,46);
      g.font='bold 24px sans-serif';g.fillText('STORM DRAIN',w/2,80);g.font='bold 34px sans-serif';g.fillText(dir<0?'\u2190':'\u2191',w/2,116);},true);
    const p=new T.Mesh(new T.PlaneGeometry(24,12),new T.MeshBasicMaterial({map:tex}));p.position.set(x,17,y);scene.add(p);
    scene.add(new T.Mesh(merge([bx(1,22,1,x-8,11,y-.4,0x4a4a4a),bx(1,22,1,x+8,11,y-.4,0x4a4a4a)]),vmat()));
  }
  buildLights();buildParts();buildDecals();buildStreaks();
  /* ground */
  ground(-900,-700,2520,2900,TX.grass,64,0xffffff,-.2);
  ground(300,340,120,760,TX.asphalt,64,0xffffff,.02,.86);
  ground(-400,1100,1520,60,TX.asphalt,64,0xffffff,.02,.86);
  ground(288,340,144,62,TX.asphalt,64,0xdddddd,.015,.86);
  for(const[x,y,w,h]of[[288,402,12,686],[420,402,12,686],[-400,1088,688,12],[432,1088,688,12],[-400,1160,1520,12]])ground(x,y,w,h,TX.concrete,24,0xd0d0cc,.5);
  for(const[x,y,w,h]of[[210,965,78,70],[432,975,68,75],[200,700,88,60],[432,812,108,40],[210,470,78,60],[432,470,68,60],[400,1172,46,48],[352,1172,18,48],[200,1172,40,60],[480,1172,40,60]])ground(x,y,w,h,TX.concrete,24,0xb4b4ae,.06);
  const dash=canvasTex(8,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.fillStyle='#d8b84a';g.fillRect(1,6,6,34);});
  const dm=new T.Mesh(new T.PlaneGeometry(2.2,700),new T.MeshStandardMaterial({map:dash,transparent:true,roughness:.8,depthWrite:false}));dm.material.map.repeat.set(1,24);dm.rotation.x=-PI/2;dm.position.set(360,.08,740);scene.add(dm);
  const dm2=dm.clone();dm2.rotation.z=PI/2;dm2.scale.y=1.6;dm2.position.set(360,.08,1130);scene.add(dm2);
  // skid marks and old blood
  for(const[x,y,s,c]of[[352,1004,34,0x0b0b0b],[330,930,26,0x0b0b0b],[366,880,40,0x0b0b0b],[352,560,30,0x0b0b0b],[340,300,28,0x0b0b0b]])decal(x,y,s,1,c);
  for(const[x,y,s]of[[340,1070,16],[392,960,12],[316,880,20],[380,700,14],[330,610,18],[404,520,13],[360,420,16],[300,1140,12],[450,1128,15],[240,860,12],[612,850,13],[360,230,18],[344,150,12]])decal(x,y,s,1);
  /* storm channel and the pipe */
  ground(-400,120,1520,142,TX.concrete,48,0x9a9a94,.05,.8);
  const wtex=TX.water.clone();wtex.needsUpdate=true;wtex.repeat.set(30,1);
  const wat=new T.Mesh(new T.PlaneGeometry(1520,26),new T.MeshStandardMaterial({map:wtex,transparent:true,opacity:.82,roughness:.12,metalness:.5}));wat.rotation.x=-PI/2;wat.position.set(360,.3,190);scene.add(wat);
  world.tick.push((dt)=>{wtex.offset.x-=dt*.12;});
  const conc=tmat(TX.concrete,1,1,{color:0x8d8d86});
  const hw=[bx(730,64,14,-35,32,114,0x8d8d86),bx(730,64,14,755,32,114,0x8d8d86),bx(1520,3,18,360,65,114,0x6f6f69)];
  add(merge(hw,1/48),tmat(TX.concrete,1,1,{color:0xffffff,vertexColors:true}),0,0,0);
  { // the wall panel around the pipe mouth
    const sh=new T.Shape();sh.moveTo(-30,0);sh.lineTo(30,0);sh.lineTo(30,64);sh.lineTo(-30,64);sh.lineTo(-30,0);
    const hole=new T.Path();hole.absarc(0,29.5,28.6,0,TAU,true);sh.holes.push(hole);
    const m=new T.Mesh(new T.ShapeGeometry(sh,28),new T.MeshStandardMaterial({color:0x8d8d86,roughness:.95}));m.position.set(360,0,121);m.receiveShadow=true;scene.add(m);
    const pipe=new T.Mesh(new T.CylinderGeometry(29,29,116,26,1,true),tmat(TX.concrete,7,3,{color:0x4a4743,roughness:.95,side:T.BackSide}));pipe.rotation.x=PI/2;pipe.position.set(360,29.5,63);pipe.receiveShadow=true;scene.add(pipe);
    const rim=new T.Mesh(new T.TorusGeometry(29.6,2.4,8,30),new T.MeshStandardMaterial({color:0x5e5a54,roughness:.8}));rim.position.set(360,29.5,121.5);scene.add(rim);
    const cap=new T.Mesh(new T.CircleGeometry(29,20),new T.MeshBasicMaterial({color:0x020203}));cap.position.set(360,29.5,6);scene.add(cap);
    ground(334,6,52,116,TX.concrete,40,0x55534e,.9);
    // rust streaks and a tag
    const tag=canvasTex(256,64,(g,w,h)=>{g.clearRect(0,0,w,h);g.font='700 34px "Oswald","Arial Narrow",sans-serif';g.fillStyle='rgba(190,30,24,.85)';g.textBaseline='middle';g.fillText('NO HELP COMING',8,34);g.fillStyle='rgba(190,30,24,.5)';g.fillRect(20,52,3,12);g.fillRect(150,50,3,14);},1);
    const tm=new T.Mesh(new T.PlaneGeometry(92,23),new T.MeshBasicMaterial({map:tag,transparent:true,depthWrite:false}));tm.position.set(470,34,121.3);scene.add(tm);
    // grate
    grateGrp=new T.Group();grateGrp.position.set(360,0,123);
    const gi=[];for(let x=-26;x<=26;x+=6.5)gi.push(cy(.9,.9,58,6,x,29.5,0,0x3a342c));gi.push(bx(58,2,2,0,12,0,0x3a342c),bx(58,2,2,0,46,0,0x3a342c));
    const gm=new T.Mesh(merge(gi),vmat({roughness:.6,metalness:.6}));gm.castShadow=true;grateGrp.add(gm);scene.add(grateGrp);
    // valve wheel on the wall
    add(merge([cy(1.2,1.2,10,8,VALVE.x,16,124,0x4a4640,PI/2,0,0),bx(8,8,3,VALVE.x,16,121.5,0x5a554e)]),vmat({metalness:.5,roughness:.6}),0,0,0);
    valveWheel=new T.Mesh(merge([part(new T.TorusGeometry(6.5,1,6,18),0,0,0,0xb5372a),bx(13,1.2,1.2,0,0,0,0xb5372a),bx(1.2,13,1.2,0,0,0,0xb5372a)]),vmat({metalness:.4,roughness:.5}));
    valveWheel.position.set(VALVE.x,16,129.5);valveWheel.castShadow=true;scene.add(valveWheel);
    pipeLamp=emitter(360,54,16,0xffb060,0,170,1,0);pipeLamp.on=false;
    emitter(360,150,58,0xffb46a,2.6,300,2,22);emitter(250,140,50,0xbfd4ff,1.6,240,0,16);emitter(480,140,50,0xbfd4ff,1.6,240,2,16);
    add(merge([bx(10,2,5,360,63,124,0x2b2f33),bx(6,2,4,250,54,123,0x2b2f33),bx(6,2,4,480,54,123,0x2b2f33)]),vmat(),0,0,0);
    add(merge([cy(2.2,2.6,5,8,360,2.5,40,0x2a2a2a),cy(1.6,1.6,4,8,360,7,40,0xffd9a0)]),vmat(),0,0,0);
  }
  // the highway that runs over the drain, jammed with abandoned cars
  ground(-500,-300,1720,402,TX.asphalt,64,0x9a9a9a,66);
  { const it=[],lit=[],r=rng(404);
    it.push(bx(1720,5,3,360,69,104,0x9a9a94));
    for(let i=0;i<13;i++){const x=-420+i*128+r()*40,z=70-r()*120,c=[0x3a4654,0x5a3a34,0x6a6a64,0x2f3a2f,0x7a7468][i%5];
      it.push(bx(42,7,20,x,71,z,c),bx(22,6,18,x-2,77,z,0x12181f));
      if(r()<.6){lit.push(bx(1,2,3,x+21.5,72,z-6,0xfff0c0),bx(1,2,3,x+21.5,72,z+6,0xfff0c0));if(Math.abs(x-360)<500)glowAt(x+24,72,z,0xfff0c0,22);}
      else lit.push(bx(1,2,3,x-21.5,72,z-6,0xff3020),bx(1,2,3,x-21.5,72,z+6,0xff3020));}
    add(merge(it),vmat({roughness:.6}),0,0,0);add(merge(lit),emat(),0,0,0,1);
    fireAt(150,40,76,10,16,1.6,0);glowAt(150,90,40,0xff6a20,120);fireAt(610,-20,76,9,12,1.4,0);glowAt(610,88,-20,0xff6a20,90);
  }
  // channel bank wall and steps
  { const it=[];for(const o of objs)if(o.kind==='cwall')it.push(bx(o.w,8,o.h,o.x+o.w/2,4,o.y+o.h/2,0x8d8d86));
    it.push(bx(730,8,6,-335,4,265,0x8d8d86),bx(730,8,6,1055,4,265,0x8d8d86));
    add(merge(it,1/40),tmat(TX.concrete,1,1,{vertexColors:true}),0,0,0); }

  buildHome();
  let ti=0;
  for(const o of objs){
    if(o.home)continue;
    const cx=o.x+o.w/2,cz=o.y+o.h/2,hz=o.w>=o.h;
    switch(o.kind){
      case'house':buildHouse(o);break;
      case'car':case'van':case'truck':case'bus':case'ambo':vehicle(o);break;
      case'tree':buildTree(o,TREES[ti]&&TREES[ti][2],ti);ti++;break;
      case'shed':{const m=vmat({map:TX.plank});add(merge([bx(o.w,18,o.h,cx,9,cz,0x8a6a4c),bx(o.w+4,1.6,o.h+4,cx,18.8,cz,0x4a3d34),bx(12,15,.8,cx,7.5,o.y+o.h+.4,0x5a4030)],1/20),m,0,0,0);fadeable(o,[m]);break;}
      case'fence':{const m=tmat(TX.plank,(hz?o.w:o.h)/16,1,{color:0x8a6b4e});const b=add(new T.BoxGeometry(hz?o.w:2.4,17,hz?2.4:o.h),m,cx,8.5,cz);fadeable(o,[m]);break;}
      case'hedge':{const m=tmat(TX.leaf,o.w/20,1,{color:0xffffff});add(new T.BoxGeometry(o.w,13,o.h),m,cx,6.5,cz);fadeable(o,[m]);break;}
      case'bin':add(merge([cy(4.4,3.9,11,10,cx,5.5,cz,0x2f4634),cy(4.8,4.8,1,10,cx,11.3,cz,0x24362a)]),vmat({roughness:.6}),0,0,0);break;
      case'barrier':add(merge([bx(o.w,9,o.h,cx,4.5,cz,0xb9b6ac),bx(o.w+.4,2.4,o.h+.2,cx,6.5,cz,0xd9772e)]),vmat(),0,0,0);break;
      case'rail':{const it=[bx(o.w,3,1.2,cx,7,cz,0xb4b8bc)];for(let x=o.x+4;x<o.x+o.w;x+=18)it.push(bx(1.6,8,1.6,x,4,cz,0x6a6e72));add(merge(it),vmat({metalness:.6,roughness:.45}),0,0,0);break;}
      case'hydrant':add(merge([cy(2,2.4,7,8,cx,3.5,cz,0xc8372a),cy(1.4,2,2,8,cx,8,cz,0xc8372a),bx(5.5,1.6,1.6,cx,5.5,cz,0xc8372a)]),vmat({roughness:.5}),0,0,0);break;
      case'tramp':add(merge([cy(19,19,1,18,cx,7,cz,0x15161a),part(new T.TorusGeometry(19,1.3,6,20),cx,7,cz,0x3a6fb0,PI/2,0,0),...[0,1,2,3].map(k=>cy(.7,.7,7,5,cx+Math.cos(k*PI/2+.8)*17,3.5,cz+Math.sin(k*PI/2+.8)*17,0x8a8f96))]),vmat(),0,0,0);break;
    }
  }
  // street lamps
  { const it=[];
    for(const[x,y,st]of LAMPS){const s=x<360?1:-1;it.push(cy(.9,1.5,46,7,x,23,y,0x2b2f33),bx(16,1.2,1.2,x+s*8,46,y,0x2b2f33),bx(7,1.6,3.4,x+s*15,45.4,y,0x3a3f44));
      if(st)emitter(x+s*15,y,43,0xffb46a,2.6,280,st===2?2:0,26);}
    // power poles and the wires between them
    const poles=[[440,1094],[440,884],[440,634],[440,398]];
    for(const[x,y]of poles)it.push(cy(1.3,1.8,58,6,x,29,y,0x3d2e22),bx(16,1.4,1.4,x,54,y,0x3d2e22));
    for(let i=0;i<poles.length-1;i++){const a=poles[i],b=poles[i+1],len=a[1]-b[1];for(const s of[-6,6])it.push(bx(.35,.35,len,a[0]+s,53,(a[1]+b[1])/2,0x0c0c0c));}
    add(merge(it),vmat({roughness:.6,metalness:.3}),0,0,0);
    world.sparkAt={x:432,y:846,t:1};
  }
  // yard clutter: mailboxes, flamingos, cones, luggage, a bike
  { const it=[],r=rng(909);
    for(const[x,y]of[[284,1040],[436,960],[284,720],[436,700],[284,470],[436,520],[384,1176]])it.push(cy(.6,.6,9,5,x,4.5,y,0x3a3028),bx(5,3.5,3,x,10,y,0x2c3540),bx(.5,2.5,.5,x+2,12.5,y+1.6,0xd2332a));
    for(const[x,y]of[[236,1060],[244,1066],[228,1070],[470,790],[110,860]])it.push(cy(.3,.3,7,4,x,3.5,y,0x222),bx(3.2,2.6,1.6,x,8,y,0xf06fa0),bx(1,3,1,x+1.4,10,y,0xf06fa0));
    for(const[x,y]of[[322,1090],[340,1096],[398,1092],[352,846],[368,842],[306,344],[420,344]])it.push(cy(.6,2.6,7,8,x,3.5,y,0xe8642a),bx(6,.8,6,x,.4,y,0xe8642a));
    for(const[x,y,c]of[[330,1066,0x6a3a3a],[402,934,0x2f4a66],[318,800,0x55524c],[384,610,0x7a6a3a],[338,470,0x3a5a4a],[300,1150,0x444]])it.push(bx(8,5.5,5,x,2.75,y,c,0,r()*3,0));
    it.push(bx(14,1,1,262,6,1010,0xc8372a,0,.5,0),cy(4,4,.8,10,256,4,1006,0x111,PI/2,.5,0),cy(4,4,.8,10,268,4,1013,0x111,PI/2,.5,0));
    add(merge(it),vmat(),0,0,0);
  }
  // far scenery so the edges aren't empty: dark blocks of more houses beyond the fences
  { const it=[],lit=[],r=rng(55);
    for(let y=-100;y<1500;y+=190)for(const x of[-150,-330,870,1050]){const w=120+r()*40,d=110+r()*30,h=28;it.push(bx(w,h,d,x,h/2,y+r()*40,0x2a2a30),part(roofGeo(d+10,w+12,18),x,h,y+r()*40,0x1c1a1c,0,PI/2,0));
      if(r()<.5)lit.push(bx(12,9,1,x+r()*40-20,15,y+d/2+r()*40+.6,0xffcf8a));}
    for(let x=-420;x<1140;x+=170){const w=130,d=110,z=1560+r()*30;it.push(bx(w,28,d,x,14,z,0x2a2a30),part(roofGeo(w+10,d+12,18),x,28,z,0x1c1a1c));}
    add(merge(it),vmat(),0,0,0);add(merge(lit),emat(),0,0,0,1);
    for(const[x,y,s]of[[-240,700,1.6],[960,420,1.9],[-200,1250,1.3],[940,1180,1.5]]){fireAt(x,y,34,26,14,2.2*s,0);glowAt(x,60,y,0xff6a20,170*s);}
  }
  // sky
  const sky=new T.Mesh(new T.SphereGeometry(4200,32,16),new T.MeshBasicMaterial({map:TX.sky,side:T.BackSide,fog:false,depthWrite:false}));
  sky.rotation.y=PI;sky.position.set(360,-40,700);sky.renderOrder=-1;scene.add(sky);world.sky=sky;
}
