"use strict";
/* The road east (Bryan, after v95: "When the user exits, the map now extends to the right. The road continues out to a dark
   tunnel. The leader says, alright, we need to get our radio communication up. Then a scientist responds, there's a
   decommissioned radio tower accessible from the tunnel down the road. You'll probably find the supplies you need from
   there. And that opens up to the next mission."):
   - in the finished Headquarters everyone who's up gathers at the entry hall's south door (GO OUT: a gather area like the
     office's LEAVE; interior.js's gatherZone asks roadGather) and a tap takes them out over the drawbridge (leaveBase);
   - the big map grows east (openEast; once open it stays open for the rest of the game, saves included): the piece of the
     east fence across the runway road comes out and the road goes on past it, narrower, round a bend to the left and into a
     tunnel in a hillside, its mouth black; rock along the north and east sides, the canal along the south. The ground, the
     rock, the hill and the tunnel's portal are meshes of its own in the big map's scene (buildEast, EAST.grp); the nav grid
     is wider than the old map for it (NAV_W in core.js) and EAST_X, the edge in play, moves out to EXT.x1;
   - the first time out one of the scientists comes out with them; the camera goes down the road to the tunnel and the
     leader and the scientist talk (story.js's panel), then back to the squad; the scientist goes back in; a save ('road');
   - the tunnel's mouth is a gather area (TUNNEL n/m, TAP TO GO IN) for the next mission, the old radio tower: not built yet,
     and it says so;
   - the drawbridge's gather area takes them back into the Headquarters (monsters.js's goIn: base.js's enterBase). */
const EXT={x0:1000,x1:1440,y0:-640,y1:150};   // the ground east of the old map's edge (what's walkable ends at the rock, x 1350, and the canal)
const RD={y0:-320,y1:-230,cx:1170,cy:-385,R:110,hw:45};   // the road past the fence: 9 m wide (y0-y1), east to x cx, round the bend (centre cx,cy; R to its middle) and north up x cx+R into the tunnel
const PORTAL={x0:1235,x1:1325,y:-482,top:24,arch:16,wall:{x0:1200,x1:1360,h:50}};   // the tunnel's mouth (facing south; its sides stand top high and the arch rises arch more), the concrete headwall round it (y -482 to -472)
const TUN_ZONE={x0:1238,y0:-472,x1:1322,y1:-394};   // the gather area at the mouth
const HQ_EXIT={x0:410,y0:858,x1:590,y1:922};   // the gather area in the Headquarters' entry hall, at its south door
const ROAD_OUT={x:850,y:-392};   // where the squad comes to off the drawbridge, just south of its gather area
const ROAD_TALK=["Alright, we need to get our radio communication up.",
  "There's a decommissioned radio tower accessible from the tunnel down the road. You'll probably find the supplies you need from there."];   // (Bryan's words; clips road_1, road_2)
let road=null;   // {open, talked, intro:{t0, ph}, guide}
const EAST={grp:null,objs:null,lamps:null,gate:null};   // built once, into the big map's scene
const roadBusy=()=>!!(road&&road.intro);   // (the camera down the road and the talk: no orders, fortress.js's endingBusy)

/* ---------- the map east of the old edge ---------- */
function eastObjects(){
  const o=[],O=(kind,x,y,w,h,ex)=>o.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind),east:1},ex||{}));
  O('void',1000,TOP,NAV_W-1000,-560-TOP);   // beyond the moat's edge
  O('cliff',1000,-560,180,98,{full:true});   // the slope up to the moat, north of the road (y -560 to -462)
  O('cliff',1180,-560,PORTAL.x0-1180,88,{full:true});O('cliff',PORTAL.x1,-560,NAV_W-PORTAL.x1,88,{full:true});   // the hill either side of the tunnel, to the headwall's face
  O('void',PORTAL.x0,-560,PORTAL.x1-PORTAL.x0,78);   // the tunnel itself: dark; nobody goes further in than its mouth
  O('cliff',1350,-472,NAV_W-1350,622,{full:true});   // the rock down the east side, to the canal
  O('water',1000,CANAL.y0,350,CANAL.y1-CANAL.y0);   // the canal, running on into the rock
  O('void',1000,CANAL.y1,NAV_W-1000,H-CANAL.y1);   // south of it: nothing
  // by the road: an empty sentry hut at the gate, concrete barriers, a burnt-out car, boulders to take cover behind
  O('booth',1012,-382,20,20,{dark:1});
  O('barrier',1062,-342,40,6);O('barrier',1112,-222,40,6);O('barrier',1335,-446,6,36);
  O('car',1192,-210,40,20);
  for(const[x,y,w,h]of[[1058,-432,18,14],[1122,-446,14,12],[1196,-352,12,10],[1060,-140,20,14],[1152,-86,14,12],[1246,-150,18,14],[1300,-60,20,16],[1090,14,16,12],[1204,30,14,12],[1318,-196,12,10]])O('rock',x,y,w,h);
  return o;
}
// the road's outline (canvas), and a line along it: off from its middle, + toward the outside of the bend
function roadPath(c){
  c.beginPath();c.moveTo(1000,-340);c.lineTo(1040,RD.y0);c.lineTo(RD.cx,RD.y0);c.arc(RD.cx,RD.cy,RD.R-RD.hw,Math.PI/2,0,true);c.lineTo(RD.cx+RD.R-RD.hw,-560);
  c.lineTo(RD.cx+RD.R+RD.hw,-560);c.lineTo(RD.cx+RD.R+RD.hw,RD.cy);c.arc(RD.cx,RD.cy,RD.R+RD.hw,0,Math.PI/2,false);c.lineTo(1040,RD.y1);c.lineTo(1000,-210);c.closePath();
}
function along(c,off,y1){c.moveTo(1040,(RD.y0+RD.y1)/2+off);c.lineTo(RD.cx,(RD.y0+RD.y1)/2+off);c.arc(RD.cx,RD.cy,RD.R+off,Math.PI/2,0,true);c.lineTo(RD.cx+RD.R+off,y1);}
// its ground: rough dark gravel, puddles, scree under the rock, the road (worn lines, tyre marks, dark going into the tunnel), the canal
function paintEast(g,q,S){
  const X0=EXT.x0,Y0=EXT.y0,w=EXT.x1-EXT.x0,h=EXT.y1-EXT.y0,r=rng(9090);
  g.setTransform(S,0,0,S,-X0*S,-Y0*S);q.setTransform(1,0,0,1,-X0,-Y0);
  g.fillStyle='#3f413d';g.fillRect(X0,Y0,w,h);q.fillStyle='rgb(190,190,190)';q.fillRect(X0,Y0,w,h);
  for(let i=0;i<80;i++){const x=X0+r()*w,y=Y0+r()*h,rad=10+r()*44,dk=r()<.62,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,dk?'rgba(0,0,0,.3)':'rgba(130,118,100,.12)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}
  for(let i=0;i<9000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.26)';g.fillRect(X0+r()*w,Y0+r()*h,r()*1.6+.4,r()*1.6+.4);}
  for(const[x0,y0,x1,y1]of[[1000,-486,1235,-450],[1325,-486,1362,-440],[1334,-470,1362,150]])for(let i=0;i<(x1-x0)*(y1-y0)/60;i++){   // scree under the rock
    const x=x0+r()*(x1-x0),y=y0+r()*(y1-y0),s=1+r()*3.2;g.fillStyle=r()<.5?'rgba(20,18,16,.55)':'rgba(120,112,100,.25)';g.fillRect(x,y,s,s*.8);}
  for(let i=0;i<24;i++){const x=1018+r()*320,y=-452+r()*500,rx=8+r()*26,ry=5+r()*12,a=r()*Math.PI;if(y>CANAL.y0-24)continue;puddle(g,'col',x,y,rx,ry,a);puddle(q,'rough',x,y,rx,ry,a);}
  // the road
  roadPath(g);g.fillStyle='#26282b';g.fill();roadPath(q);q.fillStyle='rgb(118,118,118)';q.fill();
  g.save();roadPath(g);g.clip();
  for(let i=0;i<2600;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.18)';g.fillRect(1000+r()*330,-560+r()*340,r()*1.4+.3,r()*1.4+.3);}
  g.strokeStyle='rgba(0,0,0,.24)';g.lineWidth=3;for(const off of[-30,-17,17,30]){g.beginPath();along(g,off,-500);g.stroke();}
  for(let i=0;i<5;i++){const x=1220+r()*120,y=-360+r()*120,rx=6+r()*16,ry=4+r()*8,a=r()*Math.PI;puddle(g,'col',x,y,rx,ry,a);puddle(q,'rough',x,y,rx,ry,a);}
  g.restore();
  g.strokeStyle='rgba(225,228,230,.7)';g.lineWidth=2;g.setLineDash([46,5,20,4]);for(const off of[-40,40]){g.beginPath();along(g,off,-476);g.stroke();}
  g.beginPath();g.moveTo(1000,-335);g.lineTo(1040,RD.y0+5);g.moveTo(1000,-216);g.lineTo(1040,RD.y1-5);g.stroke();   // (the runway's edge lines, narrowing in)
  g.setLineDash([22,18]);g.strokeStyle='rgba(225,228,230,.6)';g.lineWidth=2.4;g.beginPath();along(g,0,-480);g.stroke();g.setLineDash([]);
  {const gr=g.createLinearGradient(0,-468,0,-538);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.97)');g.fillStyle=gr;g.fillRect(PORTAL.x0-6,-560,PORTAL.x1-PORTAL.x0+12,94);}   // into the tunnel: darker and darker
  // the canal: dark water between concrete banks (a glossy plane over it, buildEast)
  for(const c of[g,q]){c.fillStyle=c===g?'#0b1216':'rgb(20,20,20)';c.fillRect(1000,CANAL.y0,w,CANAL.y1-CANAL.y0);}
  g.fillStyle='#8a8b86';g.fillRect(1000,CANAL.y0-5,w,5);g.fillRect(1000,CANAL.y1,w,5);g.fillStyle='rgba(228,182,40,.7)';g.fillRect(1000,CANAL.y1+5,w,1.2);g.fillRect(1000,CANAL.y0-6,w,1.2);
  g.fillStyle='rgba(0,0,0,.32)';for(const o of EAST.objs)if(['booth','barrier','car','rock'].includes(o.kind))g.fillRect(o.x-3,o.y-3,o.w+6,o.h+6);
}
// faceted rock, all in one mesh: [x, z, sx, sy, sz, turn, seed, height of its middle]
function rockMesh(list){
  const pos=[],col=[],v=new T.Vector3(),m=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),p=new T.Vector3(),c=new T.Color(),up=new T.Vector3(0,1,0);
  const bp=new T.DodecahedronGeometry(1,1).attributes.position;
  for(const[x,z,sx,sy,sz,ry,seed,y0]of list){
    const r=rng(seed);c.setHSL(.07+r()*.04,.07+r()*.07,.085+r()*.055);q.setFromAxisAngle(up,ry);s.set(sx,sy,sz);p.set(x,y0,z);m.compose(p,q,s);
    for(let i=0;i<bp.count;i++){
      const bx=bp.getX(i),by=bp.getY(i),bz=bp.getZ(i),hv=Math.sin(Math.round(bx*1e3)*12.9898+Math.round(by*1e3)*78.233+Math.round(bz*1e3)*37.719+seed*1.37)*43758.5453,f=hv-Math.floor(hv),k=.8+f*.38;   // (the same push for a corner every face shares: no cracks)
      v.set(bx*k,by*k*(by<0?.6:1),bz*k).applyMatrix4(m);pos.push(v.x,v.y,v.z);const sh=.82+.36*f;col.push(c.r*sh,c.g*sh,c.b*sh);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:.04,flatShading:true}));mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
function eastRocks(){
  const r=rng(4711),L=[],J=a=>(r()-.5)*a,sd=()=>(r()*1e4)|0;
  for(let x=1014;x<1180;x+=26){const sy=14+r()*12;L.push([x+J(8),-500+J(8),18+r()*8,sy,26+r()*8,r()*6,sd(),sy*.3]);}   // the slope up to the moat: a low row,
  for(let x=1020;x<1200;x+=34){const sy=26+r()*18;L.push([x+J(10),-544+J(10),24+r()*12,sy,30+r()*10,r()*6,sd(),sy*.25]);}   // and a taller one behind it
  for(const[x,z,sx,sy,sz,y0]of[[1206,-522,28,40,36,8],[1352,-522,30,44,40,8],[1405,-515,44,50,44,6],[1212,-605,70,58,60,2],[1300,-635,92,76,72,0],[1400,-610,72,56,70,2],[1150,-600,58,40,48,2],[1280,-542,54,18,44,52]])
    L.push([x,z,sx,sy,sz,r()*6,sd(),y0]);   // the hill the tunnel goes into (the last one over the tunnel, clear of its roof)
  for(let y=-452;y<160;y+=30){const k=clamp((y+460)/600,0,1),sy=40-k*22+r()*10;L.push([1394+J(10),y+J(8),32+r()*12,sy,22+r()*8,r()*6,sd(),sy*.28]);}   // down the east side to the canal
  for(const o of EAST.objs)if(o.kind==='rock'){const sy=6+r()*3;L.push([o.x+o.w/2,o.y+o.h/2,o.w*.62,sy,o.h*.62,r()*6,sd(),sy*.42]);}   // the boulders by the road
  return L;
}
// the tunnel's portal: a concrete headwall round an arched mouth, hazard chevrons either side, dark inside with a red light far in
function portalMesh(grp){
  const P=PORTAL,cx=(P.x0+P.x1)/2,hw=(P.wall.x1-P.wall.x0)/2,ow=(P.x1-P.x0)/2,Hh=P.wall.h,inH=P.top+P.arch,depth=-560-P.y;
  const conc=new T.MeshStandardMaterial({color:0x6f716d,roughness:.93}),dark=new T.MeshStandardMaterial({color:0x141516,roughness:.95});
  const sh=new T.Shape();sh.moveTo(-hw,0);sh.lineTo(-ow,0);sh.lineTo(-ow,P.top);sh.absellipse(0,P.top,ow,P.arch,Math.PI,0,true);sh.lineTo(ow,0);sh.lineTo(hw,0);sh.lineTo(hw,Hh);sh.lineTo(-hw,Hh);sh.lineTo(-hw,0);
  const wall=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:10,bevelEnabled:false,curveSegments:18}),conc);wall.position.set(cx,0,P.y);wall.castShadow=wall.receiveShadow=true;grp.add(wall);
  const cor=new T.Mesh(new T.BoxGeometry(hw*2+6,4,14),conc);cor.position.set(cx,Hh+2,P.y+5);cor.castShadow=true;grp.add(cor);
  const sideG=new T.PlaneGeometry(-depth,inH);
  for(const s of[-1,1]){const m=new T.Mesh(sideG,dark);m.rotation.y=-s*Math.PI/2;m.position.set(cx+s*ow,inH/2,P.y+depth/2);grp.add(m);}
  const roof=new T.Mesh(new T.PlaneGeometry(ow*2,-depth),dark);roof.rotation.x=Math.PI/2;roof.position.set(cx,inH,P.y+depth/2);grp.add(roof);
  const back=new T.Mesh(new T.PlaneGeometry(ow*2,inH),new T.MeshBasicMaterial({color:0x000000}));back.position.set(cx,inH/2,-558);grp.add(back);
  const red=new T.Mesh(new T.SphereGeometry(1.1,8,6),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));red.position.set(cx+28,30,-550);grp.add(red);
  const chev=canvasTex(32,128,(x,w,h)=>{x.fillStyle='#d8a52a';x.fillRect(0,0,w,h);x.fillStyle='#141414';for(let y=-w;y<h+w;y+=24){x.beginPath();x.moveTo(0,y);x.lineTo(w,y+w*.75);x.lineTo(w,y+w*.75+12);x.lineTo(0,y+12);x.fill();}});
  for(const s of[-1,1]){const m=new T.Mesh(new T.PlaneGeometry(7,P.top),new T.MeshStandardMaterial({map:chev,roughness:.7,emissive:0x2a2008}));m.position.set(cx+s*(ow+4.5),P.top/2,P.y+10.2);grp.add(m);}
  const br=new T.Mesh(new T.BoxGeometry(2,2,4),dark);br.position.set(cx,inH+5.6,P.y+11);grp.add(br);   // the lamp's bracket over the mouth
}
function buildEast(sc){
  if(EAST.grp){if(EAST.grp.parent!==sc){if(EAST.grp.parent)EAST.grp.parent.remove(EAST.grp);sc.add(EAST.grp);}return;}
  EAST.objs=eastObjects();
  EAST.lamps=[{x:1046,y:-352,h:34,c:0xffa860,i:1.8,d:210,pole:1,flick:1,east:1},   // a sodium lamp by the gate, failing
    {x:(PORTAL.x0+PORTAL.x1)/2,y:-466,h:44,c:0xffb060,i:1.5,d:170,flick:1,east:1}];   // a work light over the tunnel's mouth
  const grp=new T.Group();grp.visible=false;sc.add(grp);EAST.grp=grp;
  const S=1.5,gw=EXT.x1-EXT.x0,gh=EXT.y1-EXT.y0,gc=document.createElement('canvas'),rc=document.createElement('canvas');
  gc.width=Math.round(gw*S);gc.height=Math.round(gh*S);rc.width=gw;rc.height=gh;paintEast(gc.getContext('2d'),rc.getContext('2d'),S);
  const tex=new T.CanvasTexture(gc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;
  const ground=new T.Mesh(new T.PlaneGeometry(gw,gh),wetGround(new T.MeshStandardMaterial({map:tex,roughnessMap:new T.CanvasTexture(rc),roughness:1,metalness:.16}),gw,gh));
  ground.rotation.x=-Math.PI/2;ground.position.set((EXT.x0+EXT.x1)/2,0,(EXT.y0+EXT.y1)/2);ground.receiveShadow=true;grp.add(ground);
  const cw=new T.Mesh(new T.PlaneGeometry(170,CANAL.y1-CANAL.y0),new T.MeshStandardMaterial({color:0x0a141b,roughness:.12,metalness:.7}));   // the canal's water on to the rock (the big map's runs to x 1200)
  cw.rotation.x=-Math.PI/2;cw.position.set(1285,.15,(CANAL.y0+CANAL.y1)/2);cw.receiveShadow=true;grp.add(cw);
  const keep=scene;scene=grp;   // (scene.js's meshes for the hut, the barriers and the car, and the gate's two leaves standing open)
  try{meshObjs(EAST.objs.filter(o=>['booth','barrier','car'].includes(o.kind)));
    const leaves=[{kind:'gate',x:1000,y:-354,w:66,h:4},{kind:'gate',x:1000,y:-200,w:66,h:4}];meshObjs(leaves);
    leaves.forEach((o,i)=>{const a=i?.55:-.55,hz=i?-198:-352;if(o.mesh){o.mesh.position.set(1000+Math.cos(a)*33,0,hz+Math.sin(a)*33);o.mesh.rotation.y=-a;}});
  }finally{scene=keep;}
  grp.add(rockMesh(eastRocks()));portalMesh(grp);
  const poleM=new T.MeshStandardMaterial({color:0x1d2124,roughness:.6,metalness:.6});
  for(const L of EAST.lamps){const hd=new T.Mesh(new T.BoxGeometry(6,2,4),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(L.x,L.h+1.6,L.y);grp.add(hd);L.head=hd;
    if(L.pole){const pm=new T.Mesh(new T.CylinderGeometry(1.2,1.6,L.h+2,8),poleM);pm.position.set(L.x,(L.h+2)/2,L.y);pm.castShadow=true;grp.add(pm);}}
}
function eastShow(o,v){if(o.fencePl)o.fencePl.visible=v;for(const m of o.meshes||[])m.visible=v;}
// open it: on the big map in play (st null) or put away (STASH.out) while the squad is inside the Headquarters
function openEast(st){
  const live=!st,sc=live?scene:st.scene,O=live?objs:st.objs,L=live?lamps:st.lamps;
  buildEast(sc);EAST.grp.visible=true;
  const g=O.find(o=>o.eastGate);if(g){O.splice(O.indexOf(g),1);EAST.gate=g;eastShow(g,false);}   // (the east fence's piece across the road)
  for(const o of EAST.objs)if(!O.includes(o))O.push(o);
  for(const l of EAST.lamps)if(!L.includes(l))L.push(l);
  if(live){EAST_X=EXT.x1;rebuildNav();VB.x1=EXT.x1;}else{st.x1=EXT.x1;st.vb.x1=EXT.x1;}
  if(!road)road={open:true,talked:false,intro:null,guide:null};road.open=true;
}
function closeEast(){   // (a new game, a Retry, another level: reset, once the big map is back in play)
  if(!EAST.grp)return;const was=EAST.grp.visible||EAST.objs.some(o=>objs.includes(o));EAST.grp.visible=false;
  for(const o of EAST.objs){const i=objs.indexOf(o);if(i>=0)objs.splice(i,1);}
  for(const l of EAST.lamps){const i=lamps.indexOf(l);if(i>=0)lamps.splice(i,1);}
  if(EAST.gate){if(!objs.includes(EAST.gate))objs.push(EAST.gate);eastShow(EAST.gate,true);}
  EAST_X=W;if(was)rebuildNav();
}
function resetRoad(){closeEast();road=null;hqStaff=[];}   // (state.js's reset)

/* ---------- out of the Headquarters, and back in ---------- */
function roadGather(){   // (interior.js's gatherZone: GO OUT in the Headquarters' entry hall, TUNNEL at the tunnel's mouth)
  const need=players.filter(p=>alive(p)&&!p.offMap),down=players.some(p=>p.downed&&!p.dead&&!p.carriedBy),all=z=>need.length>0&&!down&&need.every(p=>inZone(p,z));
  if(MAPID==='hq'&&HQ&&HQ.base&&state==='play'&&!cineOn()&&!talkActive())return{z:HQ_EXIT,ready:all(HQ_EXIT),go:'GO OUT',need,fn:leaveBase};
  if(MAPID==='out'&&road&&road.talked&&state==='play')return{z:TUN_ZONE,ready:all(TUN_ZONE),go:'GO IN',name:'TUNNEL',need,fn:tunnelGo};
  return null;
}
function leaveBase(){
  if(MAPID!=='hq'||!STASH.out)return;
  fadeThen(()=>{
    const out=STASH.out,first=!road||!road.talked;
    openEast(out);
    for(const u of out.units)if(u.sci&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);   // the scientists left on the drawbridge are the Headquarters' staff now
    out.units=out.units.filter(u=>!u.sci);if(road)road.guide=null;
    for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);   // (the Headquarters' own people stay in)
    hqEnd=null;base=null;$('#app').classList.remove('cine');talkStop();
    useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';
    if(!mon.out||!mon.out.done)mon.out={t0:simT-60,spawned:MON_FLOOD.n,roared:true,done:true};   // (after a Continue into the HQ: the drawbridge's gather area, the way back in)
    obj=Math.max(obj,7);   // (the road east: hud.js's objHint asks roadHint)
    for(const p of players){p.offMap=false;moveMesh(p,out.scene);Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,throwGo:null,medGo:null,work:null,away:false,ret:null});}
    const taken=[];players.filter(p=>!p.dead&&!p.gone&&!p.carriedBy).forEach((p,i)=>{   // out of the gate two by two, over the deck to just south of its gather area
      p.x=838+(i%2)*24;p.y=-620+Math.floor(i/2)*15;p.ang=Math.PI/2;
      const k=i?(i%2?1:-1)*Math.ceil(i/2):0,t=openSpot(ROAD_OUT.x+k*22,ROAD_OUT.y+(i>4?22:0),taken)||{x:ROAD_OUT.x,y:ROAD_OUT.y};taken.push(t);
      p.path=[{x:p.x,y:-556},{x:DECK.x+(p.x-850)*.5,y:DECK.y},...(findPath(DECK.x,DECK.y,t.x,t.y)||[{x:t.x,y:t.y}])];p.lastOrder=simT;});
    units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=units.filter(u=>u.side==='C');
    VB={x0:0,z0:TOP,x1:EXT.x1,z1:H};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();disposeHQ();
    contact=false;clearTeams();sel=[];cardGroup=[];preview=null;mode=null;
    zoom=2.2;yaw=0;tilt=0;camT={x:850,z:-470};camPan=null;clampCam();updateCamera();
    if(first)roadIntro();
    updateObjUI();setStatus();buildCards();hud();
  });
}
// the first time out: one of the scientists comes out with them, the camera goes down the road to the tunnel, they talk
function roadIntro(){
  const s0=hqStaff[0]||{id:'S1',name:'Scientist',sciN:0},g=sciCopy(s0,850,-634,Math.PI/2);
  g.staff=true;g.path=[{x:850,y:-556},{x:DECK.x,y:DECK.y},...(findPath(DECK.x,DECK.y,ROAD_OUT.x+40,ROAD_OUT.y-26,FOOT)||[])];
  road.guide=g;road.intro={t0:simT,ph:'walk'};select([]);
  if(typeof preloadVoices==='function')preloadVoices([speakerOf(g)]);
}
function roadLead(){const up=players.filter(p=>alive(p)&&!p.offMap);return['A1','B1'].map(id=>up.find(p=>p.id===id)).find(Boolean)||up[0]||null;}
function roadTick(dt){   // (every tick: combat.js's update)
  if(!road)return;const I=road.intro,g=road.guide;
  if(I&&MAPID==='out'){
    if(contact||state!=='play'){roadIntroEnd(true);return;}   // (trouble on the way: the talk can wait)
    if(I.ph==='walk'&&simT-I.t0>1.3){I.ph='pan';camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:1238,z:-402,zoom:1.75},t:0,dur:3.4};}
    else if(I.ph==='pan'&&!camPan){I.t1=I.t1||simT;if(simT-I.t1>.6){I.ph='talk';const lead=roadLead();
      talkStart([{who:lead,to:g,text:ROAD_TALK[0],clip:'road_1'},g&&{who:g,to:lead,text:ROAD_TALK[1],clip:'road_2'}],()=>roadIntroEnd(false));}}
  }
  if(g&&road.back&&MAPID==='out'&&!g.path.length){   // back in through the gate
    if(g.m&&g.m.g.parent)g.m.g.parent.remove(g.m.g);units=units.filter(u=>u!==g);civs=civs.filter(c=>c!==g);road.guide=null;road.back=false;}
}
function roadIntroEnd(cut){
  if(!road||!road.intro)return;if(cut&&talkActive())talkStop();road.intro=null;road.talked=true;
  const g=road.guide;if(g&&!g.dead){g.path=[...(findPath(g.x,g.y,DECK.x,DECK.y,FOOT)||[]),{x:DECK.x,y:DECK.y},{x:850,y:-560},{x:850,y:-634}];g.hold={ang:-Math.PI/2};road.back=true;}
  const up=players.filter(p=>alive(p)&&!p.offMap);
  if(!cut&&up.length)camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:up.reduce((s,p)=>s+p.x,0)/up.length,z:up.reduce((s,p)=>s+p.y,0)/up.length+30,zoom:2.1},t:0,dur:2.2};
  obj=Math.max(obj,7);updateObjUI();setStatus();hud();saveGame('road');
}
function tunnelGo(){banner('Next mission: the old radio tower, through the tunnel. It isn\'t built yet: coming next.',3800);}
function roadHint(){
  if(MAPID!=='out'||!road||road.intro)return'';
  return'The road east runs on past the gate to a tunnel in the hillside: the way to the old radio tower. Gather everyone at its mouth. The green area at the drawbridge takes you back into the Headquarters.';
}
// a Continue from the save on the road: the big map with the road open, the talk done, the drawbridge's gather area back to the HQ
function roadContinue(){
  openEast(null);road.talked=true;road.intro=null;
  mon.out={t0:simT-60,spawned:MON_FLOOD.n,roared:true,done:true};
  VB={x0:0,z0:TOP,x1:EXT.x1,z1:H};clampCam();updateCamera();updateObjUI();
}
