"use strict";
/* The road east (Bryan, after v95: "When the user exits, the map now extends to the right. The road continues out to a dark
   tunnel. The leader says, alright, we need to get our radio communication up. Then a scientist responds, there's a
   decommissioned radio tower accessible from the tunnel down the road. You'll probably find the supplies you need from
   there. And that opens up to the next mission."; after v96: "So to start the next mission, the soldiers exit the level. And
   move east on the road that now appears, the screen slides over with the troops when they move. It's over a bridge, a
   larger river/lake is north of the soldiers and a lighthouse circling is seen in the distance. The soldiers continue to the
   right/east where they see the tunnel entrance. A centipede monster can be seen crawling into the tunnel from above it and
   crawls on the ceiling. The tunnel is pitch black. A broken down bus is seen on the left lane."):
   - in the finished Headquarters everyone who's up gathers at the entry hall's south door (GO OUT: a gather area like the
     office's LEAVE; interior.js's gatherZone asks roadGather) and a tap takes them out over the drawbridge (leaveBase);
   - the big map grows east (openEast; once open it stays open for the rest of the game, saves included): the piece of the
     east fence across the runway road comes out and the road goes on past it; since v111, from Bryan's drawing (after v110),
     over a long straight bridge east across the water, the lake north of it and a bay south, straight into a tunnel in the
     hill at its far end, its mouth black and facing back along the bridge, a coach broken down in the left-hand lane with
     its nose in it; at the north end of the hill's shore a lighthouse, its beam turning. The ground,
     the water, the rock, the bridge, the bus, the lighthouse and the tunnel's portal are meshes of its own in the big map's
     scene (buildEast, EAST.grp); the nav grid is wider than the old map for it (NAV_W in core.js) and EAST_X, the edge in
     play, moves out to EXT.x1;
   - the first time out one of the scientists comes out with them and they talk by the drawbridge (story.js's panel; the
     leader ends it: once the radio tower's running they can ask for better kit), the scientist goes back in, and the squad
     sets off east by itself over the bridge, the camera locked on it looking north across the lake with the lighthouse on the
     horizon (Bryan, after v110), to where the tunnel's mouth is in sight; there the camera turns to the mouth and five
     centipedes come down over the portal and into the tunnel along its ceiling (centiStart); then a save ('road');
   - the tunnel's mouth is a gather area that goes by itself (tunnel.js: its own map, pitch black);
   - the drawbridge's gather area takes them back into the Headquarters (monsters.js's goIn: base.js's enterBase). */
const EXT={x0:1000,x1:1800,y0:TOP,y1:150};   // the ground east of the old map's edge
// Bryan's drawing, after v110: a long straight bridge from the gate by the Headquarters east over the water to the hill, the
// lake north of it and more water south, the tunnel's mouth at its far end facing back along it, the hill's shore running north
// to the lighthouse
const RD={y0:-320,y1:-230};   // the road over the bridge and into the tunnel: 9 m wide
const ABUT={x0:1000,x1:1040,y0:-400,y1:-200};   // the near shore at the gate: the bridge's west end
const RBR={x0:1040,x1:1652,y0:-328,y1:-222};   // the bridge (its deck between the railings), straight east from the gate to the hill
const HILL_X=1652;   // the hill's west face, the tunnel's mouth in it
const PORTAL={x:HILL_X,y0:-320,y1:-230,top:24,arch:16,depth:78,wall:{y0:-372,y1:-178,h:50}};   // the tunnel's mouth (facing west; its sides stand top high and the arch rises arch more; dark inside for depth), the concrete headwall round it (x HILL_X to HILL_X+10)
const TUN_ZONE={x0:1600,y0:-276,x1:1672,y1:-224};   // the gather area at the mouth: the right-hand lane and its footway (the bus is in the left-hand one)
const WATER_Y=-10;   // the lake and the bay lie a metre below the deck and the shore
const LAKE_W=[[1060,-470],[1100,-520],[1152,-560],[1242,-650],[1312,-780],[1352,-1000],[1345,-1450],[1300,-1720]];   // the lake's west shore, round the fortress's moat, south to north
const BUS={x:1592,y:-318,w:108,h:28,east:true};   // a coach broken down in the left-hand lane, its nose in the tunnel's mouth
const LIGHTHOUSE={x:1580,y:-1170};   // at the north end of the hill's shore, out on its rocks; its beam turning (rendered only: beyond the map's edge)
const ROAD_STOP={x:1470,y:-275};   // where the squad stops the first time out: on the bridge, the tunnel's mouth in sight
const ROAD_LOOK={z:-445,zoom:1.45,tilt:.66};   // the camera while they cross the first time: locked, looking north up the lake (Bryan: "perpendicular to the bridge looking north, so the lighthouse is seen in the horizon")
const HQ_EXIT={x0:410,y0:858,x1:590,y1:922};   // the gather area in the Headquarters' entry hall, at its south door
const ROAD_OUT={x:850,y:-392};   // where the squad comes to off the drawbridge, just south of its gather area
const ROAD_TALK=["Alright, we need to get our radio communication up.",
  "There's a decommissioned radio tower accessible from the tunnel down the road. You'll probably find the supplies you need from there.",
  "Once we get that radio tower running, we can request more advanced equipment."];   // (Bryan's words; clips road_1, road_2; the last, the leader again, after v96: road_3)
let road=null;   // {open, talked, intro:{t0, ph}, guide}
const EAST={grp:null,objs:null,lamps:null,gate:null,tex:null,rc:null,dirty:false,beam:null,centis:null};   // built once, into the big map's scene (tex: its ground, where scorch marks and blood go: scene.js's paintDecal)
const roadBusy=()=>!!(road&&road.intro);   // (the talk, the walk east and the centipedes: no orders, fortress.js's endingBusy)
const camLock=()=>!!(road&&road.intro&&(road.intro.ph==='east'||road.intro.ph==='see'));   // the camera's the game's while they cross and the things go in (input.js, main.js)

/* ---------- the map east of the old edge ---------- */
function eastObjects(){
  const o=[],O=(kind,x,y,w,h,ex)=>o.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind),east:1},ex||{}));
  O('void',1000,TOP,EXT.x1-1000,-600-TOP);   // the moat's edge, the lake's far reaches and the hill: nobody goes there
  O('cliff',ABUT.x0,-600,ABUT.x1-ABUT.x0,600+ABUT.y0,{full:true});   // the rocks between the moat and the lake, north of the gate
  O('water',ABUT.x1,-600,HILL_X-ABUT.x1,600+RBR.y0);   // the lake, north of the bridge
  O('water',ABUT.x0,ABUT.y1,ABUT.x1-ABUT.x0,CANAL.y1-ABUT.y1);O('water',ABUT.x1,RBR.y1,HILL_X-ABUT.x1,CANAL.y1-RBR.y1);   // the bay, south of it
  O('rail',RBR.x0,RBR.y0,RBR.x1-RBR.x0,4);O('rail',RBR.x0,RBR.y1-4,RBR.x1-RBR.x0,4);   // the bridge's railings (half cover)
  O('cliff',HILL_X,-600,EXT.x1-HILL_X,600+PORTAL.y0,{full:true});O('cliff',HILL_X,PORTAL.y1,EXT.x1-HILL_X,CANAL.y1-PORTAL.y1,{full:true});   // the hill, either side of the tunnel's mouth
  O('void',HILL_X+40,PORTAL.y0,EXT.x1-HILL_X-40,PORTAL.y1-PORTAL.y0);   // the tunnel itself: nobody goes further in than its mouth
  O('void',1000,CANAL.y1,NAV_W-1000,H-CANAL.y1);   // south of the canal: nothing
  O('bus',BUS.x,BUS.y,BUS.w,BUS.h);
  O('booth',1012,-394,20,20,{dark:1});   // an empty sentry hut at the gate
  O('car',1232,-264,42,20);   // a car left on the bridge, burnt out
  return o;
}
// the road's outline (canvas): from the runway's width at the gate in to the bridge's, and on into the tunnel's mouth
function roadPath(c){c.beginPath();c.moveTo(1000,-340);c.lineTo(RBR.x0,RBR.y0);c.lineTo(HILL_X+PORTAL.depth,RBR.y0);c.lineTo(HILL_X+PORTAL.depth,RBR.y1);c.lineTo(RBR.x0,RBR.y1);c.lineTo(1000,-210);c.closePath();}
// the water's outline (map coordinates), the lake and the bay in one: down the old map's edge from the south, round the near
// shore at the gate, up the lake's west shore round the moat, across the far north, down the hill's shore and back
function lakePts(){
  const r=rng(6161),P=[[1000,900],[ABUT.x0,ABUT.y1],[ABUT.x1,ABUT.y1],[ABUT.x1,ABUT.y0],...LAKE_W,[1660,-1720]];
  for(let y=-1700;y<900;y+=26)P.push([HILL_X+(r()-.5)*12,y]);   // (ragged along the hill's foot: rocks cover it)
  P.push([HILL_X,900]);return P;
}
function shorePath(c){const P=lakePts();c.beginPath();c.moveTo(...P[0]);for(const p of P)c.lineTo(...p);c.closePath();}
// its ground: the near shore at the gate (rough ground, the road narrowing in to the bridge), scree under the rock, the road on
// into the tunnel's mouth, darker and darker; over the water there's none (cut away: paintEastAlpha), the bridge has a deck of
// its own (bridgeMesh) and the water lies below (waterMesh)
function paintEast(g,q,S){
  const X0=EXT.x0,Y0=EXT.y0,w=EXT.x1-EXT.x0,h=EXT.y1-EXT.y0,r=rng(9090);
  g.setTransform(S,0,0,S,-X0*S,-Y0*S);q.setTransform(1,0,0,1,-X0,-Y0);
  g.fillStyle='#34362f';g.fillRect(X0,Y0,w,h);q.fillStyle='rgb(200,200,200)';q.fillRect(X0,Y0,w,h);
  for(let i=0;i<9000;i++){const x=X0+r()*w,y=Y0+r()*h,s=.6+r()*2.4;g.fillStyle=r()<.5?'rgba(15,14,12,.5)':'rgba(120,112,100,.18)';g.fillRect(x,y,s,s*.8);}   // scree and gravel
  for(let i=0;i<16;i++){const x=ABUT.x0+4+r()*32,y=-398+r()*56,rad=6+r()*14,gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,'rgba(60,72,44,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-rad,y-rad,rad*2,rad*2);}   // rough grass by the hut
  roadPath(g);g.fillStyle='#26282b';g.fill();roadPath(q);q.fillStyle='rgb(118,118,118)';q.fill();
  g.save();roadPath(g);g.clip();
  for(let i=0;i<2600;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.18)';g.fillRect(1000+r()*800,-340+r()*130,r()*1.4+.3,r()*1.4+.3);}
  for(let i=0;i<3;i++){const x=1004+r()*30,y=-310+r()*70,rx=5+r()*9,ry=3+r()*5,a=r()*Math.PI;puddle(g,'col',x,y,rx,ry,a);puddle(q,'rough',x,y,rx,ry,a);}
  g.restore();
  g.strokeStyle='rgba(225,228,230,.7)';g.lineWidth=2;g.beginPath();g.moveTo(1000,-335);g.lineTo(RBR.x0,RD.y0+5);g.moveTo(1000,-216);g.lineTo(RBR.x0,RD.y1-5);g.stroke();   // (the runway's edge lines, narrowing in)
  g.setLineDash([22,18]);g.strokeStyle='rgba(225,228,230,.6)';g.lineWidth=2.4;g.beginPath();g.moveTo(1000,-275);g.lineTo(RBR.x0,-275);g.moveTo(HILL_X,-275);g.lineTo(HILL_X+PORTAL.depth,-275);g.stroke();g.setLineDash([]);
  {const gr=g.createLinearGradient(HILL_X-10,0,HILL_X+60,0);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.97)');g.fillStyle=gr;g.fillRect(HILL_X-10,RBR.y0,PORTAL.depth+20,RBR.y1-RBR.y0);}   // into the tunnel: darker and darker
  g.fillStyle='rgba(0,0,0,.32)';for(const o of EAST.objs)if(['booth','rock'].includes(o.kind))g.fillRect(o.x-3,o.y-3,o.w+6,o.h+6);
}
function paintEastAlpha(a){   // (white: ground; black: water, where the ground is cut away)
  a.setTransform(1,0,0,1,-EXT.x0,-EXT.y0);a.fillStyle='#fff';a.fillRect(EXT.x0,EXT.y0,EXT.x1-EXT.x0,EXT.y1-EXT.y0);
  shorePath(a);a.fillStyle='#000';a.fill();
}
// faceted rock, all in one mesh: [x, z, sx, sy, sz, turn, seed, height of its middle]; tint [hue, saturation, lightness] for another stone (tunnel.js's broken concrete)
function rockMesh(list,tint){
  const pos=[],col=[],v=new T.Vector3(),m=new T.Matrix4(),q=new T.Quaternion(),s=new T.Vector3(),p=new T.Vector3(),c=new T.Color(),up=new T.Vector3(0,1,0);
  const bp=new T.DodecahedronGeometry(1,1).attributes.position;
  for(const[x,z,sx,sy,sz,ry,seed,y0]of list){
    const r=rng(seed);if(tint)c.setHSL(tint[0]+r()*.02,tint[1]+r()*.03,tint[2]+r()*.08);else c.setHSL(.07+r()*.04,.07+r()*.07,.085+r()*.055);q.setFromAxisAngle(up,ry);s.set(sx,sy,sz);p.set(x,y0,z);m.compose(p,q,s);
    for(let i=0;i<bp.count;i++){
      const bx=bp.getX(i),by=bp.getY(i),bz=bp.getZ(i),hv=Math.sin(Math.round(bx*1e3)*12.9898+Math.round(by*1e3)*78.233+Math.round(bz*1e3)*37.719+seed*1.37)*43758.5453,f=hv-Math.floor(hv),k=.8+f*.38;   // (the same push for a corner every face shares: no cracks)
      v.set(bx*k,by*k*(by<0?.6:1),bz*k).applyMatrix4(m);pos.push(v.x,v.y,v.z);const sh=.82+.36*f;col.push(c.r*sh,c.g*sh,c.b*sh);
    }
  }
  const g=new T.BufferGeometry();g.setAttribute('position',new T.Float32BufferAttribute(pos,3));g.setAttribute('color',new T.Float32BufferAttribute(col,3));g.computeVertexNormals();
  const mesh=new T.Mesh(g,new T.MeshStandardMaterial({vertexColors:true,roughness:.95,metalness:.04,flatShading:true}));mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
function eastRocks(){
  const r=rng(4711),L=[],J=a=>(r()-.5)*a,sd=()=>(r()*1e4)|0,P=PORTAL;
  for(let z=-596;z<-404;z+=22){const sy=16+r()*14;L.push([1020+J(10),z+J(8),26+r()*10,sy,22+r()*8,r()*6,sd(),sy*.3]);}   // the rocks between the moat and the lake, north of the gate
  for(let k=0;k<LAKE_W.length-3;k++){const a=LAKE_W[k],b=LAKE_W[k+1];for(let t=0;t<1;t+=.3){const sy=10+r()*12;L.push([a[0]+(b[0]-a[0])*t-10+J(8),a[1]+(b[1]-a[1])*t+J(8),22+r()*10,sy,18+r()*8,r()*6,sd(),WATER_Y+sy*.4]);}}   // and down to the lake's edge
  for(const[x,y]of[[1046,-404],[1046,-382],[1046,-210],[1030,-196],[1010,-196]]){const sy=5+r()*4;L.push([x+J(4),y+J(4),9+r()*6,sy,7+r()*5,r()*6,sd(),WATER_Y+sy*.6]);}   // stones at the near shore's water line
  // the hill's face, either side of the headwall and over it, its foot in the water
  const mid=(P.y0+P.y1)/2;
  for(let y=-596;y<CANAL.y1+30;y+=26){if(y>P.wall.y0-8&&y<P.wall.y1+8)continue;const dy=Math.abs(y-mid),sy=(dy<200?16+dy*.12:32)+r()*(dy<200?10:24);L.push([HILL_X+14+J(10),y+J(8),26+r()*12,sy,26+r()*10,r()*6,sd(),WATER_Y+sy*.32]);}   // (low by the mouth, so the headwall shows from the bridge)
  for(let y=-596;y<CANAL.y1+30;y+=34){if(y>P.wall.y0-40&&y<P.wall.y1+40)continue;const dy=Math.abs(y-mid),sy=(dy<260?34:50)+r()*30;L.push([HILL_X+52+(dy<260?24:0)+J(14),y+J(10),34+r()*12,sy,32+r()*12,r()*6,sd(),sy*.3]);}   // and behind, rising away from it
  for(const[x,z,sx,sy,sz,y0]of[[HILL_X+26,P.wall.y0-8,22,30,24,8],[HILL_X+26,P.wall.y1+8,22,30,24,8],[HILL_X+34,-275,24,16,84,38],[HILL_X+72,-275,40,22,96,44],[HILL_X+118,-275,52,30,110,46],[HILL_X+96,-196,58,56,50,14],[HILL_X+96,-354,58,58,50,14],[HILL_X+170,-275,90,70,140,30]])
    L.push([x,z,sx,sy,sz,r()*6,sd(),y0]);   // (round the headwall and on top of it, the hill the tunnel goes into: low over the mouth, where the things come over)
  for(const o of EAST.objs)if(o.kind==='rock'){const sy=6+r()*3;L.push([o.x+o.w/2,o.y+o.h/2,o.w*.62,sy,o.h*.62,r()*6,sd(),sy*.42]);}
  return L;
}
// further off (rendered only): the lake's far shore, the hill on north to the lighthouse's rocks and south past the bay, the ridge
// along the lake's west shore
function farRocks(){
  const r=rng(8181),L=[],sd=()=>(r()*1e4)|0;
  for(let x=1240;x<1700;x+=90){const sy=60+r()*80;L.push([x+(r()-.5)*40,-1790-r()*80,110+r()*60,sy,80+r()*40,r()*6,sd(),sy*.2]);}   // the far shore
  for(let y=-620;y>-1800;y-=60)for(let x=1680;x<2000;x+=80){const sy=60+r()*70+(x-1680)*.25;L.push([x+(r()-.5)*36,y+(r()-.5)*36,70+r()*40,sy,64+r()*36,r()*6,sd(),sy*.25]);}   // the hill, on north along the lake's east shore
  for(let y=170;y<1100;y+=70)for(let x=1680;x<2000;x+=90){const sy=50+r()*60+(x-1680)*.2;L.push([x+(r()-.5)*36,y+(r()-.5)*36,70+r()*40,sy,60+r()*36,r()*6,sd(),sy*.25]);}   // and south past the bay
  for(let x=1060;x<1660;x+=100){const sy=40+r()*50;L.push([x+(r()-.5)*40,960+r()*80,100+r()*50,sy,70+r()*40,r()*6,sd(),sy*.2]);}   // the bay's far shore
  for(let k=3;k<LAKE_W.length-1;k++){const a=LAKE_W[k],b=LAKE_W[k+1];for(let t=0;t<1;t+=.34){const x=a[0]+(b[0]-a[0])*t-26,y=a[1]+(b[1]-a[1])*t,sy=24+r()*24;L.push([x,y,30+r()*14,sy,30+r()*14,r()*6,sd(),sy*.3]);}}   // the ridge along its west shore
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2,R=26+r()*14,sy=10+r()*12;L.push([LIGHTHOUSE.x+Math.cos(a)*R,LIGHTHOUSE.y+Math.sin(a)*R,18+r()*10,sy,16+r()*8,r()*6,sd(),sy*.3]);}
  L.push([LIGHTHOUSE.x,LIGHTHOUSE.y,30,18,28,0,sd(),6]);
  for(let t=.15;t<1;t+=.17){const x=LIGHTHOUSE.x+(HILL_X+30-LIGHTHOUSE.x)*t,y=LIGHTHOUSE.y+40*(1-t),sy=14+r()*14;L.push([x+(r()-.5)*20,y+(r()-.5)*20,26+r()*12,sy,24+r()*10,r()*6,sd(),sy*.3]);}   // (the spit of rock it stands on, out from the hill's shore)
  return L;
}
// the tunnel's portal: a concrete headwall round an arched mouth, hazard chevrons either side, dark inside with a red light far
// in; built facing south like the old one and turned to face west, back along the bridge
function portalMesh(grp){
  const P=PORTAL,hw=(P.wall.y1-P.wall.y0)/2,ow=(P.y1-P.y0)/2,Hh=P.wall.h,inH=P.top+P.arch,depth=-P.depth;
  const g=new T.Group();g.position.set(P.x+10,0,(P.wall.y0+P.wall.y1)/2);g.rotation.y=-Math.PI/2;grp.add(g);   // (local +z, the road's side, is the map's west; its face at x HILL_X)
  const cy=(P.y0+P.y1)/2-(P.wall.y0+P.wall.y1)/2;   // (the opening's middle across the headwall)
  const conc=new T.MeshStandardMaterial({color:0x6f716d,roughness:.93}),dark=new T.MeshStandardMaterial({color:0x141516,roughness:.95});
  const sh=new T.Shape();sh.moveTo(-hw,0);sh.lineTo(cy-ow,0);sh.lineTo(cy-ow,P.top);sh.absellipse(cy,P.top,ow,P.arch,Math.PI,0,true);sh.lineTo(cy+ow,0);sh.lineTo(hw,0);sh.lineTo(hw,Hh);sh.lineTo(-hw,Hh);sh.lineTo(-hw,0);
  const wall=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:10,bevelEnabled:false,curveSegments:18}),conc);wall.castShadow=wall.receiveShadow=true;g.add(wall);
  const cor=new T.Mesh(new T.BoxGeometry(hw*2+6,4,14),conc);cor.position.set(0,Hh+2,5);cor.castShadow=true;g.add(cor);
  const sideG=new T.PlaneGeometry(-depth,inH);
  for(const s of[-1,1]){const m=new T.Mesh(sideG,dark);m.rotation.y=-s*Math.PI/2;m.position.set(cy+s*ow,inH/2,depth/2);g.add(m);}
  const roof=new T.Mesh(new T.PlaneGeometry(ow*2,-depth),dark);roof.rotation.x=Math.PI/2;roof.position.set(cy,inH,depth/2);g.add(roof);
  const back=new T.Mesh(new T.PlaneGeometry(ow*2,inH),new T.MeshBasicMaterial({color:0x000000}));back.position.set(cy,inH/2,depth+2);g.add(back);
  const red=new T.Mesh(new T.SphereGeometry(1.1,8,6),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));red.position.set(cy+28,30,depth+10);g.add(red);
  const chev=canvasTex(32,128,(x,w,h)=>{x.fillStyle='#d8a52a';x.fillRect(0,0,w,h);x.fillStyle='#141414';for(let y=-w;y<h+w;y+=24){x.beginPath();x.moveTo(0,y);x.lineTo(w,y+w*.75);x.lineTo(w,y+w*.75+12);x.lineTo(0,y+12);x.fill();}});
  for(const s of[-1,1]){const m=new T.Mesh(new T.PlaneGeometry(7,P.top),new T.MeshStandardMaterial({map:chev,roughness:.7,emissive:0x2a2008}));m.position.set(cy+s*(ow+4.5),P.top/2,10.2);g.add(m);}
  const br=new T.Mesh(new T.BoxGeometry(2,2,4),dark);br.position.set(cy,inH+5.6,11);g.add(br);   // the lamp's bracket over the mouth
}
// the water, the lake and the bay in one, a metre below the bridge's deck: glossy and dark like the canal, the night sky in it;
// a quay wall along the old map's edge with the canal spilling over it, the near shore's banks
function waterMesh(grp){
  const wm=new T.MeshStandardMaterial({color:0x11252f,roughness:.22,metalness:.62,normalMap:rippleTex(),normalScale:new T.Vector2(.55,.55)}),sh=new T.Shape(),P=lakePts(),env=nightEnv();if(env){wm.envMap=env;wm.envMapIntensity=1.6;}
  wm.normalMap.repeat.set(1/70,1/70);EAST.water=wm;   // (the ShapeGeometry's uvs are map units: one ripple tile every 7 m; roadTick drifts it)
  sh.moveTo(P[0][0],-P[0][1]);for(const p of P)sh.lineTo(p[0],-p[1]);   // (the shape's y is the map's -y: laid flat below)
  const lake=new T.Mesh(new T.ShapeGeometry(sh),wm);lake.rotation.x=-Math.PI/2;lake.position.y=WATER_Y;lake.receiveShadow=true;grp.add(lake);
  const st=new T.MeshStandardMaterial({color:0x5f605b,roughness:.92}),B=(x,z,w,d)=>{const b=new T.Mesh(new T.BoxGeometry(w,-WATER_Y+3,d),st);b.position.set(x,(WATER_Y-3)/2,z);b.receiveShadow=true;grp.add(b);};
  B(1000,(ABUT.y1+CANAL.y0)/2,4,CANAL.y0-ABUT.y1);B(1000,(CANAL.y1+900)/2,4,900-CANAL.y1);   // the quay wall along the old map's edge (the canal's mouth between)
  B(ABUT.x1,(ABUT.y0+RBR.y0)/2,4,RBR.y0-ABUT.y0);B(ABUT.x1,(RBR.y1+ABUT.y1)/2,4,ABUT.y1-RBR.y1);B((ABUT.x0+ABUT.x1)/2,ABUT.y1,ABUT.x1-ABUT.x0,4);B((ABUT.x0+ABUT.x1)/2,ABUT.y0,ABUT.x1-ABUT.x0,4);   // the near shore's banks
  const fall=new T.Mesh(new T.PlaneGeometry(CANAL.y1-CANAL.y0,-WATER_Y),new T.MeshBasicMaterial({color:0x9aa8b0,transparent:true,opacity:.32,depthWrite:false,side:T.DoubleSide}));
  fall.rotation.y=Math.PI/2;fall.position.set(1001,WATER_Y/2,(CANAL.y0+CANAL.y1)/2);grp.add(fall);   // the canal spilling over the edge into the bay
  const foam=new T.Mesh(new T.PlaneGeometry(14,CANAL.y1-CANAL.y0+6),new T.MeshBasicMaterial({color:0x8a98a0,transparent:true,opacity:.3,depthWrite:false}));foam.rotation.x=-Math.PI/2;foam.position.set(1008,WATER_Y+.3,(CANAL.y0+CANAL.y1)/2);grp.add(foam);
}
// a ripple for the water: a tileable normal map from a few crossing waves (built once)
let RIPPLE=null;
function rippleTex(){
  if(RIPPLE)return RIPPLE;const N=128,c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d'),im=x.createImageData(N,N),TAU2=Math.PI*2;
  const W=[[3,1,.5],[1,4,.35],[5,-2,.22],[-2,7,.16],[7,5,.1]],hgt=(u,v)=>W.reduce((s,[a,b,k])=>s+k*Math.sin(TAU2*(a*u+b*v)/N+a*1.7),0);
  for(let j=0;j<N;j++)for(let i=0;i<N;i++){const dx=hgt(i+1,j)-hgt(i-1,j),dy=hgt(i,j+1)-hgt(i,j-1),l=Math.hypot(dx,dy,1),k=(j*N+i)*4;
    im.data[k]=(-dx/l*.5+.5)*255;im.data[k+1]=(-dy/l*.5+.5)*255;im.data[k+2]=(1/l*.5+.5)*255;im.data[k+3]=255;}
  x.putImageData(im,0,0);RIPPLE=new T.CanvasTexture(c);RIPPLE.wrapS=RIPPLE.wrapT=T.RepeatWrapping;return RIPPLE;
}
// the bridge: a concrete deck the length of the crossing (its top painted like the road, footways either side, an expansion
// joint every so often), a beam under it, piers down into the water, railings either side (scene.js's 'rail')
function bridgeMesh(grp){
  const b=RBR,cx=(b.x0+b.x1)/2,cz=(b.y0+b.y1)/2,w=b.x1-b.x0,d=b.y1-b.y0,TL=64;
  const top=canvasTex(256,212,(x,W,Hh)=>{x.fillStyle='#2a2c2f';x.fillRect(0,0,W,Hh);const r=rng(5);for(let i=0;i<2600;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.18)';x.fillRect(r()*W,r()*Hh,1.2,1.2);}
    const k=Hh/d,u=W/TL;x.fillStyle='#7c7e7a';x.fillRect(0,0,W,(RD.y0-b.y0)*k);x.fillRect(0,(RD.y1-b.y0)*k,W,Hh);   // the kerbs and footways
    x.strokeStyle='rgba(225,228,230,.65)';x.lineWidth=2;for(const y of[RD.y0+5,RD.y1-5]){x.beginPath();x.moveTo(0,(y-b.y0)*k);x.lineTo(W,(y-b.y0)*k);x.stroke();}
    x.fillStyle='rgba(225,228,230,.6)';for(const s of[4,36])x.fillRect(s*u,(-275-b.y0)*k-1.2,22*u,2.4);   // the centre line's dashes
    x.fillStyle='rgba(0,0,0,.18)';for(const y of[RD.y0+18,RD.y0+34,RD.y1-34,RD.y1-18])x.fillRect(0,(y-b.y0)*k-1.5,W,3);   // tyre marks
    x.fillStyle='rgba(0,0,0,.5)';x.fillRect(0,0,2,Hh);});   // an expansion joint
  top.wrapS=T.RepeatWrapping;top.wrapT=T.ClampToEdgeWrapping;top.repeat.set(w/TL,1);
  const conc=new T.MeshStandardMaterial({color:0x7d7f7a,roughness:.9}),deck=new T.Mesh(new T.BoxGeometry(w,2.4,d),[conc,conc,new T.MeshStandardMaterial({map:top,roughness:.75,metalness:.1}),conc,conc,conc]);
  deck.position.set(cx,-.9,cz);deck.castShadow=deck.receiveShadow=true;grp.add(deck);
  const beam=new T.Mesh(new T.BoxGeometry(w,5,d-18),conc);beam.position.set(cx,-4.6,cz);beam.receiveShadow=true;grp.add(beam);
  const dk=new T.MeshStandardMaterial({color:0x4d4f4b,roughness:.95});
  for(let x=b.x0+70;x<b.x1-30;x+=96){const cap=new T.Mesh(new T.BoxGeometry(12,2,d-8),conc);cap.position.set(x,-8,cz);grp.add(cap);
    for(const s of[-1,1]){const p=new T.Mesh(new T.BoxGeometry(8,8,8),dk);p.position.set(x,-12,cz+s*30);p.castShadow=true;grp.add(p);}}   // the piers, down into the water
}
// a coach broken down, its nose in the tunnel's mouth: dirty cream, a dark window band with panes gone, the door open, a flat
// tyre. (b.east: lying east-west, its nose east, in the left-hand lane going in; tunnel.js puts the same coach at its south end,
// lying north-south)
function busMesh(grp,b=BUS){
  const g=new T.Group();g.position.set(b.x+b.w/2,0,b.y+b.h/2);if(b.east)g.rotation.y=-Math.PI/2;grp.add(g);
  const tilt=new T.Group();tilt.rotation.z=-.035;g.add(tilt);
  const Wd=b.east?b.h:b.w,Ln=b.east?b.w:b.h;
  const body=new T.MeshStandardMaterial({color:0x9c968a,roughness:.75,metalness:.25}),dark=new T.MeshStandardMaterial({color:0x101417,roughness:.25,metalness:.6}),strip=new T.MeshStandardMaterial({color:0x5a2a26,roughness:.7});
  const glass=new T.MeshStandardMaterial({color:0x1a2730,roughness:.08,metalness:.8,transparent:true,opacity:.85}),tyre=new T.MeshStandardMaterial({color:0x111214,roughness:.9});
  const B=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;tilt.add(o);return o;};
  B(Wd,14,Ln,body,0,10,0);B(Wd-.6,1.6,Ln-.6,strip,0,6,0);B(Wd-1,2.2,Ln-3,body,0,24,0);B(Wd-8,2,24,body,0,26,12);   // the body, a stripe, the roof, the air conditioning
  const r=rng(77);for(const s of[-1,1])for(let z=-Ln/2+10;z<Ln/2-6;z+=11){const broke=r()<.3;if(broke&&s>0&&z<-30)continue;B(.6,6,9.4,broke?dark:glass,s*(Wd/2+.05),20,z);}   // the windows, some panes gone
  B(Wd-2,9,.6,glass,0,18,-Ln/2-.1);B(Wd-2,3,.6,dark,0,8,-Ln/2-.1);   // the windscreen, the grille
  B(.8,13,9,dark,Wd/2+.2,10,-Ln/2+16);   // the door, open on the right
  for(const z of[-Ln/2+18,Ln/2-30,Ln/2-18])for(const s of[-1,1]){const t=new T.Mesh(new T.CylinderGeometry(4.4,4.4,3,14),tyre);t.rotation.z=Math.PI/2;t.position.set(s*(Wd/2-1),4.4-(s<0&&z<0?1.4:0),z);t.castShadow=true;tilt.add(t);}   // (the front left one flat)
  for(const s of[-1,1]){const l=new T.Mesh(new T.BoxGeometry(3,1.6,.4),new T.MeshBasicMaterial({color:0x3a0d08}));l.position.set(s*(Wd/2-4),8,Ln/2+.2);tilt.add(l);}   // dead tail lights
}
// the lighthouse at the north end of the hill's shore: a tower in white and red bands on its rocks, the lantern lit, its beam turning (EAST.beam: roadTick)
function lighthouseMesh(grp){
  const L=LIGHTHOUSE,g=new T.Group();g.position.set(L.x,0,L.y);grp.add(g);
  const bands=canvasTex(64,256,(x,w,h)=>{x.fillStyle='#d9d6cc';x.fillRect(0,0,w,h);x.fillStyle='#a8302a';for(const y of[24,104,184])x.fillRect(0,y,w,36);});bands.wrapS=bands.wrapT=T.ClampToEdgeWrapping;
  const tw=new T.Mesh(new T.CylinderGeometry(6.5,10,96,20),new T.MeshStandardMaterial({map:bands,roughness:.7}));tw.position.y=18+48;tw.castShadow=true;g.add(tw);
  const dark=new T.MeshStandardMaterial({color:0x22262a,roughness:.5,metalness:.6});
  const gal=new T.Mesh(new T.CylinderGeometry(9.5,9.5,1.6,20),dark);gal.position.y=18+96.8;g.add(gal);
  const lan=new T.Mesh(new T.CylinderGeometry(5,5,8,14),new T.MeshBasicMaterial({color:0xfff0c4,toneMapped:false}));lan.position.y=18+102;g.add(lan);
  const cap=new T.Mesh(new T.ConeGeometry(6.6,7,14),new T.MeshStandardMaterial({color:0x6a2420,roughness:.6}));cap.position.y=18+109.5;g.add(cap);
  const beam=new T.Group();beam.position.y=18+102;g.add(beam);EAST.beam=beam;
  const fade=canvasTex(4,128,(x,w,h)=>{const g=x.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,255,255,1)');g.addColorStop(.45,'rgba(255,255,255,.35)');g.addColorStop(1,'rgba(255,255,255,0)');x.fillStyle=g;x.fillRect(0,0,w,h);});
  fade.wrapS=fade.wrapT=T.ClampToEdgeWrapping;
  const bm=new T.MeshBasicMaterial({color:0xfff2c8,map:fade,transparent:true,opacity:.22,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,toneMapped:false,fog:false});
  for(const s of[1,-1]){const geo=new T.ConeGeometry(26,460,20,1,true);geo.translate(0,-230,0);const c=new T.Mesh(geo,bm);c.rotation.z=s*Math.PI/2;
    const tip=new T.Group();tip.rotation.z=s*-.06;tip.add(c);beam.add(tip);}   // (both ends, bright at the lantern and fading out, tipped down a little onto the water)
}
// the centipedes that go into the tunnel the first time the squad sees it (Bryan: "crawling into the tunnel from above it and
// crawls on the ceiling"; after v110, "The tunnel will have a lot of monsters leading to the entrance"): several of her young,
// bigger, one after another over the hill, down the headwall's face, under the arch and in along the roof upside down
// (creatures.js's makeCentipede and pose, each segment's up from the surface it's on). A path is in the portal's own terms:
// across (+ south of the opening's middle), height, depth (from the headwall's face, + into the hill), and the up there.
const CENTI_V=24;   // their speed
const CENTI_PATH=[[38,72,88,0,1,0],[24,62,50,0,1,0],[13,56,17,0,1,0],[7,51,-1,-.8,.6,0],[4,46,-5.5,-1,0,0],[2,42,-5.5,-1,0,0],[0,38.5,2,-.7,-.7,0],[0,38.5,24,0,-1,0],[0,38.5,148,0,-1,0]];
const CENTI_SET=[[2.2,0,38,4,0],[1.9,.8,-36,-12,-20],[2.4,1.7,8,14,18],[2.0,2.5,-18,-4,8],[1.8,3.3,44,10,-12]];   // each one: its size against her young's, when it comes, where it is across the opening over the hill, down the face and inside
function centiPath(top,face,inside){   // (the template's across values swapped for these: over the hill, down the face, along the roof)
  const cy=(PORTAL.y0+PORTAL.y1)/2,A=[top,(top+face)/2,face,face,face,face,face,(face+inside)/2,inside];
  return CENTI_PATH.map((p,i)=>[HILL_X+p[2],p[1],cy+A[i],p[3],p[4],p[5]]);   // [x, height, y, up]
}
function centiStart(){
  if(!EAST.grp)return;
  if(!EAST.centis){EAST.centis=CENTI_SET.map(([S,delay,top,face,inside])=>{const keep=scene;scene=EAST.grp;let C;try{C=makeCentipede(BROOD);}finally{scene=keep;}C.g.scale.setScalar(S);EAST.grp.add(C.g);
    const pts=centiPath(top,face,inside),curve=new T.CatmullRomCurve3(pts.map(p=>new T.Vector3(p[0]/S,p[1]/S,p[2]/S)),false,'centripetal'),N=1600;
    Object.assign(C,{sc:S,delay,pathUp:pts,path:{curve,pts:curve.getSpacedPoints(N),N,L:curve.getLength()},len:BROOD.head.l*.55+BROOD.seg*.5+(BROOD.n-1)*BROOD.seg});return C;});}
  for(const C of EAST.centis){C.t0=simT+C.delay;C.on=true;C.g.visible=false;}
}
const centiOn=()=>!!EAST.centis&&EAST.centis.some(C=>C.on);
function centiPose(C,d){   // the head d along the path past where the whole body first lies on it
  const P=C.path,S=BROOD,n=S.n,U=C.pathUp,at=k=>{const f=clamp(k/P.L,0,1)*P.N,i=Math.min(P.N-1,Math.floor(f));return P.pts[i].clone().lerp(P.pts[i+1],f-i);};
  const upAt=k=>{const u=clamp(k/P.L,0,1)*(U.length-1),i=Math.min(U.length-2,Math.floor(u)),f=u-i,a=U[i],b=U[i+1];return new T.Vector3(a[3]+(b[3]-a[3])*f,a[4]+(b[4]-a[4])*f,a[5]+(b[5]-a[5])*f).normalize();};
  const head=C.len+d,gap=S.head.l*.55+S.seg*.5,pts=[at(head)],ups=[upAt(head)];
  for(let i=1;i<=n;i++){const k=head-gap-(i-1)*S.seg;pts.push(at(k));ups.push(upAt(k));}
  poseCentipede(C,pts,simT,{walk:1,flail:.7,ups,jaw:.25+Math.sin(simT*6+C.delay*3)*.1});
  return head-C.len>P.L-C.len*.15;   // (all of it in, past the arch)
}
function centiTick(){
  if(!EAST.centis)return;
  for(const C of EAST.centis){if(!C.on||simT<C.t0)continue;C.g.visible=true;if(centiPose(C,(simT-C.t0)*CENTI_V/C.sc)){C.on=false;C.g.visible=false;}}
}
function centiHide(){if(EAST.centis)for(const C of EAST.centis){C.on=false;C.g.visible=false;}}
function buildEast(sc){
  if(EAST.grp){if(EAST.grp.parent!==sc){if(EAST.grp.parent)EAST.grp.parent.remove(EAST.grp);sc.add(EAST.grp);}return;}
  EAST.objs=eastObjects();
  EAST.lamps=[{x:1024,y:-352,h:34,c:0xffa860,i:1.8,d:210,pole:1,flick:1,east:1},   // a sodium lamp by the gate, failing
    {x:1190,y:-332,h:30,c:0xffd9a0,i:1.5,d:200,pole:1,east:1},   // along the bridge's north railing, still working
    {x:1468,y:-218,h:30,c:0xffd9a0,i:1.35,d:190,pole:1,flick:1,east:1},   // and one on its south railing, flickering
    {x:HILL_X-12,y:-275,h:44,c:0xffb060,i:1.5,d:170,flick:1,east:1}];   // a work light over the tunnel's mouth
  const grp=new T.Group();grp.visible=false;sc.add(grp);EAST.grp=grp;
  const S=1.5,gw=EXT.x1-EXT.x0,gh=EXT.y1-EXT.y0,gc=document.createElement('canvas'),rc=document.createElement('canvas'),ac=document.createElement('canvas');
  gc.width=Math.round(gw*S);gc.height=Math.round(gh*S);rc.width=ac.width=gw;rc.height=ac.height=gh;paintEast(gc.getContext('2d'),rc.getContext('2d'),S);paintEastAlpha(ac.getContext('2d'));
  const tex=new T.CanvasTexture(gc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;EAST.tex=tex;EAST.rc=rc;
  const ground=new T.Mesh(new T.PlaneGeometry(gw,gh),wetGround(new T.MeshStandardMaterial({map:tex,roughnessMap:new T.CanvasTexture(rc),alphaMap:new T.CanvasTexture(ac),alphaTest:.5,roughness:1,metalness:.16}),gw,gh));   // (cut away over the water)
  ground.rotation.x=-Math.PI/2;ground.position.set((EXT.x0+EXT.x1)/2,0,(EXT.y0+EXT.y1)/2);ground.receiveShadow=true;grp.add(ground);
  waterMesh(grp);bridgeMesh(grp);busMesh(grp);lighthouseMesh(grp);
  const keep=scene;scene=grp;   // (scene.js's meshes for the hut, the car and the bridge's railings, and the gate's two leaves standing open)
  try{meshObjs(EAST.objs.filter(o=>['booth','car','rail'].includes(o.kind)));
    const leaves=[{kind:'gate',x:1000,y:-354,w:66,h:4},{kind:'gate',x:1000,y:-200,w:66,h:4}];meshObjs(leaves);
    leaves.forEach((o,i)=>{const a=i?.55:-.55,hz=i?-198:-352;if(o.mesh){o.mesh.position.set(1000+Math.cos(a)*33,0,hz+Math.sin(a)*33);o.mesh.rotation.y=-a;}});
  }finally{scene=keep;}
  grp.add(rockMesh(eastRocks()));grp.add(rockMesh(farRocks()));portalMesh(grp);if(typeof l4Cable==='function')l4Cable(grp);   // (the zip line down from the summit to the bridge: level4.js)
  const poleM=new T.MeshStandardMaterial({color:0x1d2124,roughness:.6,metalness:.6}),deadM=new T.MeshStandardMaterial({color:0x2a2c2e,roughness:.5,metalness:.4});
  for(const L of EAST.lamps){const hd=new T.Mesh(new T.BoxGeometry(6,2,4),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));hd.position.set(L.x,L.h+1.6,L.y);grp.add(hd);L.head=hd;
    if(L.pole){const pm=new T.Mesh(new T.CylinderGeometry(1.2,1.6,L.h+2,8),poleM);pm.position.set(L.x,(L.h+2)/2,L.y);pm.castShadow=true;grp.add(pm);}}
  for(const[x,y]of[[1100,-218],[1580,-332]]){const pm=new T.Mesh(new T.CylinderGeometry(1.2,1.6,32,8),poleM);pm.position.set(x,16,y);pm.castShadow=true;grp.add(pm);const hd=new T.Mesh(new T.BoxGeometry(6,2,4),deadM);hd.position.set(x,31.6,y);grp.add(hd);}   // (two that don't work any more)
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
  canalEnd(true);   // (the old map's canal stops at the shore now: it spills into the bay)
  if(!road)road={open:true,talked:false,intro:null,guide:null};road.open=true;
}
function canalEnd(open){const c=typeof CANAL_PLANE!=='undefined'?CANAL_PLANE:null;if(!c)return;const w=W+400;c.scale.x=open?(W+200)/w:1;c.position.x=open?(W-200)/2:W/2;}   // (scene.js's canal water: past the old edge, out over the bay, until the road east opens)
function closeEast(){   // (a new game, a Retry, another level: reset, once the big map is back in play)
  if(!EAST.grp)return;const was=EAST.grp.visible||EAST.objs.some(o=>objs.includes(o));EAST.grp.visible=false;
  for(const o of EAST.objs){const i=objs.indexOf(o);if(i>=0)objs.splice(i,1);}
  for(const l of EAST.lamps){const i=lamps.indexOf(l);if(i>=0)lamps.splice(i,1);}
  if(EAST.gate){if(!objs.includes(EAST.gate))objs.push(EAST.gate);eastShow(EAST.gate,true);}
  centiHide();canalEnd(false);
  EAST_X=W;if(was)rebuildNav();
  if(EAST.dirty){paintEast(EAST.tex.image.getContext('2d'),EAST.rc.getContext('2d'),1.5);EAST.tex.needsUpdate=true;EAST.dirty=false;}   // (clean ground for the next game)
}
function resetRoad(){closeEast();road=null;hqStaff=[];hqCrew=[];aarCrew=[];}   // (state.js's reset; the HQ's people: base.js)

/* ---------- out of the Headquarters, and back in ---------- */
function roadGather(){   // (interior.js's gatherZone: GO OUT in the Headquarters' entry hall, TUNNEL at the tunnel's mouth)
  const need=players.filter(p=>alive(p)&&!p.offMap),down=players.some(p=>p.downed&&!p.dead&&!p.carriedBy),all=z=>need.length>0&&!down&&need.every(p=>inZone(p,z));
  if(MAPID==='hq'&&HQ&&HQ.base&&state==='play'&&!cineOn()&&!talkActive()&&(!HQ.floors||curFloor==='GF'))return{z:HQ_EXIT,ready:all(HQ_EXIT),go:'GO OUT',need,fn:leaveBase};
  if(MAPID==='out'&&road&&road.talked&&state==='play')return{z:TUN_ZONE,ready:all(TUN_ZONE),go:'GOING IN',name:'TUNNEL',auto:'in',need,fn:enterTunnel};   // (auto: it goes by itself, Bryan: "When approaching it it changes to it": tunnel.js)
  if(MAPID==='tun'&&state==='play')return[{z:TUN_IN,ready:all(TUN_IN),go:'GOING OUT',name:'OUT',auto:'out',need,fn:leaveTunnel},...(obj<9?[{z:TUN_SVC,ready:all(TUN_SVC),go:'GOING IN',name:'SERVICE DOOR',auto:'svc',need,fn:()=>enterHill()}]:[])];   // (the service door: into the hill, Level 4: level4.js)
  if(MAPID==='l4')return l4Gather();   // (out by the service door, down the zip line: level4.js)
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
    useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';curFloor='GF';floorChip();
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
/* ---------- the first time out: the talk by the drawbridge, the walk east with the camera, the centipede ---------- */
function roadIntro(){
  const s0=hqStaff[0]||{id:'S1',name:'Scientist',sciN:0},g=sciCopy(s0,850,-634,Math.PI/2);
  g.staff=true;g.path=[{x:850,y:-556},{x:DECK.x,y:DECK.y},...(findPath(DECK.x,DECK.y,ROAD_OUT.x+40,ROAD_OUT.y-26,FOOT)||[])];
  road.guide=g;road.intro={t0:simT,ph:'walk'};select([]);
  if(typeof preloadVoices==='function')preloadVoices([speakerOf(g)]);
}
function roadLead(){const up=players.filter(p=>alive(p)&&!p.offMap);return['A1','B1'].map(id=>up.find(p=>p.id===id)).find(Boolean)||up[0]||null;}
const upNow=()=>players.filter(p=>alive(p)&&!p.offMap);
// the walk east: two by two along the road behind the leader, to where the tunnel's mouth is in sight
function roadSetOff(){
  const up=upNow().sort((a,b)=>(b===roadLead())-(a===roadLead())),taken=[];
  up.forEach((p,i)=>{const t=openSpot(ROAD_STOP.x-Math.floor(i/2)*24,ROAD_STOP.y+(i%2?16:-16),taken)||ROAD_STOP;taken.push(t);p.path=findPath(p.x,p.y,t.x,t.y)||[];p.lastOrder=simT;p.ret=null;});
}
function roadTick(dt){   // (every tick: combat.js's update)
  if(EAST.beam&&EAST.grp&&EAST.grp.visible){EAST.beam.rotation.y=simT*.7;if(EAST.water){const o=EAST.water.normalMap.offset;o.x=simT*.004;o.y=simT*.0025;}}   // the lighthouse's beam going round, the water's ripple drifting
  centiTick();
  if(MAPID==='tun'&&typeof tunTick==='function')tunTick(dt);   // (her young in the tunnel: tunnel.js)
  if(!road)return;const I=road.intro,g=road.guide;
  if(state==='play'&&!fading&&!I&&(MAPID==='out'||MAPID==='tun')){const A=road.auto||(road.auto={});   // the gather areas that go by themselves: half a second after everyone's in
    for(const G of gatherZones()){if(!G.auto)continue;const a=A[G.auto]||(A[G.auto]={t:0,done:false});if(!G.ready){a.t=0;a.done=false;continue;}a.t+=dt;if(a.t>.5&&!a.done){a.done=true;G.fn();}}}
  if(I&&MAPID==='out'){
    if(contact||state!=='play'){roadIntroEnd(true);return;}   // (trouble on the way: the rest can wait)
    if(I.ph==='walk'&&simT-I.t0>1.3){I.ph='pan';camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:ROAD_OUT.x+40,z:ROAD_OUT.y+30,zoom:2.3},t:0,dur:1.6};}
    else if(I.ph==='pan'&&!camPan){I.t1=I.t1||simT;if(simT-I.t1>.4){I.ph='talk';const lead=roadLead();
      talkStart([{who:lead,to:g,text:ROAD_TALK[0],clip:'road_1'},g&&{who:g,to:lead,text:ROAD_TALK[1],clip:'road_2'},{who:lead,to:g,text:ROAD_TALK[2],clip:'road_3'}],roadTalkDone);}}
    else if(I.ph==='east'){   // the camera slides along with them (Bryan: "the screen slides over with the troops when they move"), locked looking north across the bridge, the lake and the lighthouse beyond (after v110: "lock the camera while the troops cross the bridge... perpendicular to the bridge looking north, so the lighthouse is seen in the horizon"; camLock)
      const up=upNow();if(up.length){const m=midOf(up),k=Math.min(1,dt*2.2),e=Math.min(1,dt*1.1);camT.x+=(m.x+30-camT.x)*k;camT.z+=(ROAD_LOOK.z-camT.z)*e;zoom+=(ROAD_LOOK.zoom-zoom)*e;tilt+=(ROAD_LOOK.tilt-tilt)*e;yaw+=wrapA(-yaw)*e;camPan=null;clampCam();updateCamera();}
      if(!up.some(p=>p.path.length)||simT-I.t2>40){I.ph='see';I.t3=simT;camPan={from:{x:camT.x,z:camT.z,zoom,yaw,tilt},to:{x:HILL_X-30,z:-282,zoom:2.2,yaw:-Math.PI/2,tilt:.34},t:0,dur:2.2};}}   // (then round to look at the mouth from the bridge)
    else if(I.ph==='see'&&!camPan){if(!I.c){I.c=1;centiStart();sfxMon('mon_growl',{x:HILL_X+20,y:-275},.8,.8);}
      if(I.c===1&&simT-I.t3>3.2){I.c=2;const p=roadLead();if(p)callout(p,'Movement! Over the tunnel.',C.warn);}
      if(I.c===2&&simT-I.t3>6.5&&!I.c3){I.c3=1;sfxMon('mon_horde',{x:HILL_X+40,y:-275},.7,.9);}   // (and more of them, somewhere in there)
      if(!centiOn()){I.ph='done';roadIntroEnd(false);}}
  }
  if(g&&road.back&&MAPID==='out'&&!g.path.length){   // back in through the gate
    if(g.m&&g.m.g.parent)g.m.g.parent.remove(g.m.g);units=units.filter(u=>u!==g);civs=civs.filter(c=>c!==g);road.guide=null;road.back=false;}
}
function roadTalkDone(){   // the scientist back in; the squad sets off east
  const I=road&&road.intro;if(!I)return;const g=road.guide;
  if(g&&!g.dead){g.path=[...(findPath(g.x,g.y,DECK.x,DECK.y,FOOT)||[]),{x:DECK.x,y:DECK.y},{x:850,y:-560},{x:850,y:-634}];g.hold={ang:-Math.PI/2};road.back=true;}
  I.ph='east';I.t2=simT;roadSetOff();
}
function roadIntroEnd(cut){
  if(!road||!road.intro)return;if(cut&&talkActive())talkStop();const I=road.intro;road.intro=null;road.talked=true;
  const g=road.guide;if(g&&!g.dead&&!road.back){g.path=[...(findPath(g.x,g.y,DECK.x,DECK.y,FOOT)||[]),{x:DECK.x,y:DECK.y},{x:850,y:-560},{x:850,y:-634}];g.hold={ang:-Math.PI/2};road.back=true;}
  if(cut){centiHide();yaw=0;tilt=0;camPan=null;clampCam();updateCamera();}
  const up=upNow();
  if(!cut&&up.length){const m=midOf(up);camPan={from:{x:camT.x,z:camT.z,zoom,yaw,tilt},to:{x:m.x+40,z:m.y+40,zoom:2.0,yaw:0,tilt:0},t:0,dur:2.0};}
  obj=Math.max(obj,7);updateObjUI();setStatus();hud();saveGame('road');
}
function roadHint(){
  if(MAPID==='l4')return l4Hint();   // (level4.js)
  if(MAPID==='tun')return tunHint();
  if(obj>=9&&MAPID==='out'&&road&&!road.intro)return l4AfterHint();
  if(MAPID!=='out'||!road||road.intro)return'';
  return'The road east runs on past the gate over the long bridge to the tunnel in the hill: the way to the old radio tower. Something went in there. Walk everyone into its mouth to go in. The green area at the drawbridge takes you back into the Headquarters.';
}
// a Continue from the save on the road: the big map with the road open, the talk done, the squad where it stopped in sight of the tunnel
function roadContinue(){
  openEast(null);road.talked=true;road.intro=null;
  mon.out={t0:simT-60,spawned:MON_FLOOD.n,roared:true,done:true};
  const taken=[];players.filter(p=>!p.dead&&!p.gone).forEach((p,i)=>{const t=openSpot(ROAD_STOP.x-Math.floor(i/2)*24,ROAD_STOP.y+(i%2?16:-16),taken)||ROAD_STOP;taken.push(t);p.x=t.x;p.y=t.y;p.path=[];p.ang=0;});
  VB={x0:0,z0:TOP,x1:EXT.x1,z1:H};camT={x:ROAD_STOP.x+40,z:ROAD_STOP.y+40};zoom=2.0;clampCam();updateCamera();updateObjUI();
}
