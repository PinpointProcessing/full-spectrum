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
     east fence across the runway road comes out and the road goes on past it, east over a bridge across the river that
     runs out of the lake to the north, on to the foot of a hill, round a bend to the left and into a tunnel, its mouth black
     and a coach broken down in the left lane with its nose in it; across the lake a lighthouse, its beam turning. The ground,
     the water, the rock, the bridge, the bus, the lighthouse and the tunnel's portal are meshes of its own in the big map's
     scene (buildEast, EAST.grp); the nav grid is wider than the old map for it (NAV_W in core.js) and EAST_X, the edge in
     play, moves out to EXT.x1;
   - the first time out one of the scientists comes out with them and they talk by the drawbridge (story.js's panel; the
     leader ends it: once the radio tower's running they can ask for better kit), the scientist goes back in, and the squad
     sets off east by itself, the camera sliding along with it, over the bridge to where the tunnel's mouth is in sight;
     there a centipede comes down over the portal and into the tunnel along its ceiling (roadCenti); then a save ('road');
   - the tunnel's mouth is a gather area that goes by itself (tunnel.js: its own map, pitch black);
   - the drawbridge's gather area takes them back into the Headquarters (monsters.js's goIn: base.js's enterBase). */
const EXT={x0:1000,x1:1800,y0:TOP,y1:150};   // the ground east of the old map's edge
const RD={y0:-320,y1:-230,cx:1590,cy:-385,R:110,hw:45};   // the road past the fence: 9 m wide (y0-y1), east to x cx, round the bend (centre cx,cy; R to its middle) and north up x cx+R into the tunnel
const PORTAL={x0:1655,x1:1745,y:-482,top:24,arch:16,wall:{x0:1615,x1:1785,h:50}};   // the tunnel's mouth (facing south; its sides stand top high and the arch rises arch more), the concrete headwall round it (y -482 to -472)
const TUN_ZONE={x0:1696,y0:-478,x1:1778,y1:-372};   // the gather area at the mouth: the east lane and the verge (the bus is in the west lane)
const LAKE={x0:1100,x1:1600,y1:-420,W:[[1600,-1720],[1300,-1720],[1345,-1450],[1352,-1000],[1312,-780],[1242,-642],[1152,-522],[1100,-462]]};   // the lake north of the road: its south shore at y1 from x0 to x1, on north past the map's edge between the hill (x1) and the fortress's moat (W: its west shore, north to south)
const RIVER={x0:1200,x1:1320,y0:-420,y1:CANAL.y1};   // the river: out of the lake, under the bridge, south past the canal's end
const RBR={x0:1192,x1:1328,y0:-328,y1:-222};   // the road's bridge over it (the deck between its railings)
const BUS={x:1662,y:-508,w:28,h:110};   // a coach broken down in the left lane, its nose in the tunnel's mouth
const LIGHTHOUSE={x:1470,y:-1160};   // out in the lake on a rock; its beam turning (rendered only: beyond the map's edge)
const ROAD_STOP={x:1520,y:-275};   // where the squad stops the first time out: the tunnel's mouth in sight
const HQ_EXIT={x0:410,y0:858,x1:590,y1:922};   // the gather area in the Headquarters' entry hall, at its south door
const ROAD_OUT={x:850,y:-392};   // where the squad comes to off the drawbridge, just south of its gather area
const ROAD_TALK=["Alright, we need to get our radio communication up.",
  "There's a decommissioned radio tower accessible from the tunnel down the road. You'll probably find the supplies you need from there.",
  "Once we get that radio tower running, we can request more advanced equipment."];   // (Bryan's words; clips road_1, road_2; the last, the leader again, after v96: road_3)
let road=null;   // {open, talked, intro:{t0, ph}, guide}
const EAST={grp:null,objs:null,lamps:null,gate:null,tex:null,rc:null,dirty:false,beam:null,centi:null};   // built once, into the big map's scene (tex: its ground, where scorch marks and blood go: scene.js's paintDecal)
const roadBusy=()=>!!(road&&road.intro);   // (the talk, the walk east and the centipede: no orders, fortress.js's endingBusy)

/* ---------- the map east of the old edge ---------- */
function eastObjects(){
  const o=[],O=(kind,x,y,w,h,ex)=>o.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind),east:1},ex||{}));
  O('void',1000,TOP,LAKE.x1-1000,-560-TOP);   // the moat's edge and the lake's far reaches: nobody goes there
  O('cliff',1000,-560,LAKE.x0-1000,140,{full:true});   // the ridge between the moat and the lake
  O('water',LAKE.x0,-560,LAKE.x1-LAKE.x0,LAKE.y1+560);   // the lake
  O('water',RIVER.x0,RIVER.y0,RIVER.x1-RIVER.x0,RBR.y0-RIVER.y0);O('water',RIVER.x0,RBR.y1,RIVER.x1-RIVER.x0,RIVER.y1-RBR.y1);   // the river, either side of the bridge
  O('rail',RBR.x0,RBR.y0,RBR.x1-RBR.x0,4);O('rail',RBR.x0,RBR.y1-4,RBR.x1-RBR.x0,4);   // the bridge's railings (half cover)
  O('water',1000,CANAL.y0,RIVER.x0-1000,CANAL.y1-CANAL.y0);   // the canal, running into the river
  O('cliff',LAKE.x1,TOP,PORTAL.x0-LAKE.x1,PORTAL.y-TOP,{full:true});O('cliff',PORTAL.x1,TOP,EXT.x1-PORTAL.x1,PORTAL.y-TOP,{full:true});   // the hill, either side of the tunnel, to the headwall's face
  O('void',PORTAL.x0,TOP,PORTAL.x1-PORTAL.x0,PORTAL.y-TOP);   // the tunnel itself, and the hill over it: nobody goes further in than its mouth
  O('cliff',1782,PORTAL.y,EXT.x1-1782,CANAL.y1-PORTAL.y,{full:true});   // the rock down the east side
  O('void',1000,CANAL.y1,NAV_W-1000,H-CANAL.y1);   // south of the canal: nothing
  O('bus',BUS.x,BUS.y,BUS.w,BUS.h);
  // by the road: an empty sentry hut at the gate, concrete barriers, a burnt-out car, boulders to take cover behind
  O('booth',1012,-382,20,20,{dark:1});
  O('barrier',1062,-342,40,6);O('barrier',1100,-222,40,6);O('barrier',1756,-330,6,36);
  O('car',1420,-206,40,20);
  for(const[x,y,w,h]of[[1058,-404,18,14],[1132,-396,14,12],[1342,-402,16,12],[1470,-394,18,14],[1560,-426,14,12],[1612,-360,12,10],[1060,-140,20,14],[1152,-86,14,12],
    [1380,-150,18,14],[1500,-60,20,16],[1640,-120,16,12],[1720,-40,14,12],[1090,14,16,12],[1430,30,14,12],[1764,-262,12,10],[1350,-200,12,10],[1560,-168,14,12]])O('rock',x,y,w,h);
  return o;
}
// the road's outline (canvas), and a line along it: off from its middle, + toward the outside of the bend
function roadPath(c){
  c.beginPath();c.moveTo(1000,-340);c.lineTo(1040,RD.y0);c.lineTo(RD.cx,RD.y0);c.arc(RD.cx,RD.cy,RD.R-RD.hw,Math.PI/2,0,true);c.lineTo(RD.cx+RD.R-RD.hw,PORTAL.y-78);
  c.lineTo(RD.cx+RD.R+RD.hw,PORTAL.y-78);c.lineTo(RD.cx+RD.R+RD.hw,RD.cy);c.arc(RD.cx,RD.cy,RD.R+RD.hw,0,Math.PI/2,false);c.lineTo(1040,RD.y1);c.lineTo(1000,-210);c.closePath();
}
function along(c,off,y1){c.moveTo(1040,(RD.y0+RD.y1)/2+off);c.lineTo(RD.cx,(RD.y0+RD.y1)/2+off);c.arc(RD.cx,RD.cy,RD.R+off,Math.PI/2,0,true);c.lineTo(RD.cx+RD.R+off,y1);}
// the lake's outline (map coordinates): its ragged south shore with the river's mouth in it, the hill's foot, its west shore
function lakePts(){
  const r=rng(6161),P=[];for(let x=LAKE.x0;x<=LAKE.x1;x+=14){const inR=x>RIVER.x0-6&&x<RIVER.x1+6;P.push([x,inR?LAKE.y1+4:LAKE.y1-2+r()*9]);}
  P.push([LAKE.x1+4,LAKE.y1]);for(const p of LAKE.W)P.push(p);return P;
}
function shorePath(c){const P=lakePts();c.beginPath();c.moveTo(...P[0]);for(const p of P)c.lineTo(...p);c.closePath();}
// its ground: rough dark grass and gravel, puddles, scree under the rock, the road (worn lines, tyre marks, dark going into the
// tunnel), the bridge's deck, the shore, the river and the canal (glossy planes over them: buildEast)
function paintEast(g,q,S){
  const X0=EXT.x0,Y0=EXT.y0,w=EXT.x1-EXT.x0,h=EXT.y1-EXT.y0,r=rng(9090);
  g.setTransform(S,0,0,S,-X0*S,-Y0*S);q.setTransform(1,0,0,1,-X0,-Y0);
  g.fillStyle='#3a3d36';g.fillRect(X0,Y0,w,h);q.fillStyle='rgb(190,190,190)';q.fillRect(X0,Y0,w,h);
  for(let i=0;i<140;i++){const x=X0+r()*w,y=Y0+r()*h,rad=10+r()*48,k=r(),gr=g.createRadialGradient(x,y,0,x,y,rad);gr.addColorStop(0,k<.5?'rgba(0,0,0,.3)':k<.8?'rgba(60,72,44,.22)':'rgba(130,118,100,.12)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,rad,0,7);g.fill();}   // dark patches, rough grass, dry gravel
  for(let i=0;i<16000;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.06)':'rgba(0,0,0,.26)';g.fillRect(X0+r()*w,Y0+r()*h,r()*1.6+.4,r()*1.6+.4);}
  for(const[x0,y0,x1,y1]of[[1000,-440,1100,-420],[1600,-500,1660,-470],[1740,-500,1790,-470],[1762,-480,1786,140]])for(let i=0;i<(x1-x0)*(y1-y0)/60;i++){   // scree under the rock
    const x=x0+r()*(x1-x0),y=y0+r()*(y1-y0),s=1+r()*3.2;g.fillStyle=r()<.5?'rgba(20,18,16,.55)':'rgba(120,112,100,.25)';g.fillRect(x,y,s,s*.8);}
  for(let i=0;i<30;i++){const x=1018+r()*760,y=-410+r()*460,rx=8+r()*26,ry=5+r()*12,a=r()*Math.PI;if(y>CANAL.y0-24||(x>RIVER.x0-30&&x<RIVER.x1+30))continue;puddle(g,'col',x,y,rx,ry,a);puddle(q,'rough',x,y,rx,ry,a);}
  // the lake and the river: dark water under their planes, a stony edge, a band of wet stones along the shore
  shorePath(g);g.fillStyle='#0a1015';g.fill();shorePath(q);q.fillStyle='rgb(20,20,20)';q.fill();
  g.fillStyle='#0a1015';g.fillRect(RIVER.x0,RIVER.y0,RIVER.x1-RIVER.x0,RIVER.y1-RIVER.y0);q.fillStyle='rgb(20,20,20)';q.fillRect(RIVER.x0,RIVER.y0,RIVER.x1-RIVER.x0,RIVER.y1-RIVER.y0);
  for(let i=0;i<2600;i++){const x=LAKE.x0+r()*(LAKE.x1-LAKE.x0),y=LAKE.y1+2+r()*26;if(x>RIVER.x0-4&&x<RIVER.x1+4)continue;const s=1+r()*3;g.fillStyle=r()<.5?'rgba(15,15,14,.6)':'rgba(110,105,96,.3)';g.fillRect(x,y,s,s*.8);}
  g.fillStyle='#6c6d68';for(const x of[RIVER.x0-5,RIVER.x1])g.fillRect(x,RIVER.y0,5,RIVER.y1-RIVER.y0);   // the river's stone banks
  // the road
  roadPath(g);g.fillStyle='#26282b';g.fill();roadPath(q);q.fillStyle='rgb(118,118,118)';q.fill();
  g.save();roadPath(g);g.clip();
  for(let i=0;i<5200;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.035)':'rgba(0,0,0,.18)';g.fillRect(1000+r()*790,-560+r()*340,r()*1.4+.3,r()*1.4+.3);}
  g.strokeStyle='rgba(0,0,0,.24)';g.lineWidth=3;for(const off of[-30,-17,17,30]){g.beginPath();along(g,off,PORTAL.y-20);g.stroke();}
  for(let i=0;i<7;i++){const x=1360+r()*360,y=-330+r()*80,rx=6+r()*16,ry=4+r()*8,a=r()*Math.PI;puddle(g,'col',x,y,rx,ry,a);puddle(q,'rough',x,y,rx,ry,a);}
  g.restore();
  g.strokeStyle='rgba(225,228,230,.7)';g.lineWidth=2;g.setLineDash([46,5,20,4]);for(const off of[-40,40]){g.beginPath();along(g,off,PORTAL.y+6);g.stroke();}
  g.beginPath();g.moveTo(1000,-335);g.lineTo(1040,RD.y0+5);g.moveTo(1000,-216);g.lineTo(1040,RD.y1-5);g.stroke();   // (the runway's edge lines, narrowing in)
  g.setLineDash([22,18]);g.strokeStyle='rgba(225,228,230,.6)';g.lineWidth=2.4;g.beginPath();along(g,0,PORTAL.y+2);g.stroke();g.setLineDash([]);
  {const gr=g.createLinearGradient(0,PORTAL.y+14,0,PORTAL.y-56);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(1,'rgba(0,0,0,.97)');g.fillStyle=gr;g.fillRect(PORTAL.x0-6,PORTAL.y-78,PORTAL.x1-PORTAL.x0+12,92);}   // into the tunnel: darker and darker
  // the canal, to the river: dark water between concrete banks
  for(const c of[g,q]){c.fillStyle=c===g?'#0b1216':'rgb(20,20,20)';c.fillRect(1000,CANAL.y0,RIVER.x0-1000,CANAL.y1-CANAL.y0);}
  g.fillStyle='#8a8b86';g.fillRect(1000,CANAL.y0-5,RIVER.x0-1000,5);g.fillRect(1000,CANAL.y1,RIVER.x0-1000,5);g.fillStyle='rgba(228,182,40,.7)';g.fillRect(1000,CANAL.y1+5,RIVER.x0-1000,1.2);g.fillRect(1000,CANAL.y0-6,RIVER.x0-1000,1.2);
  g.fillStyle='rgba(0,0,0,.32)';for(const o of EAST.objs)if(['booth','barrier','car','rock','bus'].includes(o.kind))g.fillRect(o.x-3,o.y-3,o.w+6,o.h+6);
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
  for(let z=-556;z<-424;z+=24){const sy=16+r()*14;L.push([1050+J(10),z+J(8),28+r()*10,sy,22+r()*8,r()*6,sd(),sy*.3]);}   // the ridge between the moat and the lake
  for(const[x,z]of[[1110,-556],[1150,-600],[1196,-640],[1226,-690],[1270,-740],[1130,-500]]){const sy=22+r()*16;L.push([x+J(10),z+J(10),30+r()*10,sy,26+r()*10,r()*6,sd(),sy*.3]);}
  for(let x=LAKE.x0+6;x<LAKE.x1;x+=22){if(x>RIVER.x0-14&&x<RIVER.x1+14)continue;const sy=3+r()*4;L.push([x+J(8),LAKE.y1+J(6),7+r()*6,sy,5+r()*4,r()*6,sd(),sy*.1]);}   // stones along the shore, half in the water
  // the hill the tunnel goes into, either side of its headwall and over it
  for(let x=LAKE.x1+10;x<EXT.x1+30;x+=30){if(x>P.wall.x0-6&&x<P.wall.x1+6)continue;const sy=40+r()*26;L.push([x+J(8),P.y-24+J(10),30+r()*10,sy,30+r()*10,r()*6,sd(),sy*.3]);}
  for(const[x,z,sx,sy,sz,y0]of[[1630,-530,40,52,40,10],[1770,-530,40,56,44,10],[1700,-585,96,62,58,8],[1640,-620,70,70,60,4],[1760,-640,70,72,66,4],[1700,-690,110,90,80,0],[1620,-700,60,60,60,0],[1790,-720,60,70,60,0],[1610,-560,40,46,40,4]])
    L.push([x,z,sx,sy,sz,r()*6,sd(),y0]);
  for(let y=P.y+14;y<CANAL.y1+10;y+=30){const sy=30+r()*14;L.push([1798+J(8),y+J(8),26+r()*10,sy,22+r()*8,r()*6,sd(),sy*.28]);}   // down the east side
  for(const o of EAST.objs)if(o.kind==='rock'){const sy=6+r()*3;L.push([o.x+o.w/2,o.y+o.h/2,o.w*.62,sy,o.h*.62,r()*6,sd(),sy*.42]);}   // the boulders by the road
  return L;
}
// across the lake: the far shore's dark hills and the lighthouse's rock (rendered only)
function farRocks(){
  const r=rng(8181),L=[],sd=()=>(r()*1e4)|0;
  for(let x=1240;x<1700;x+=90){const sy=60+r()*80;L.push([x+(r()-.5)*40,-1790-r()*80,110+r()*60,sy,80+r()*40,r()*6,sd(),sy*.2]);}   // the far shore
  for(let y=-760;y>-1800;y-=70)for(let x=1650;x<2000;x+=90){const sy=70+r()*80+(x-1650)*.2;L.push([x+(r()-.5)*40,y+(r()-.5)*40,80+r()*40,sy,70+r()*40,r()*6,sd(),sy*.25]);}   // the hill, on north over the tunnel
  for(let k=0;k<LAKE.W.length-2;k++){const a=LAKE.W[k+1],b=LAKE.W[k+2];for(let t=0;t<1;t+=.34){const x=a[0]+(b[0]-a[0])*t-26,y=a[1]+(b[1]-a[1])*t,sy=24+r()*24;L.push([x,y,30+r()*14,sy,30+r()*14,r()*6,sd(),sy*.3]);}}   // the ridge along its west shore
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2,R=26+r()*14,sy=10+r()*12;L.push([LIGHTHOUSE.x+Math.cos(a)*R,LIGHTHOUSE.y+Math.sin(a)*R,18+r()*10,sy,16+r()*8,r()*6,sd(),sy*.3]);}
  L.push([LIGHTHOUSE.x,LIGHTHOUSE.y,30,18,28,0,sd(),6]);
  return L;
}
// the tunnel's portal: a concrete headwall round an arched mouth, hazard chevrons either side, dark inside with a red light far in
function portalMesh(grp){
  const P=PORTAL,cx=(P.x0+P.x1)/2,hw=(P.wall.x1-P.wall.x0)/2,ow=(P.x1-P.x0)/2,Hh=P.wall.h,inH=P.top+P.arch,depth=-78;
  const conc=new T.MeshStandardMaterial({color:0x6f716d,roughness:.93}),dark=new T.MeshStandardMaterial({color:0x141516,roughness:.95});
  const sh=new T.Shape();sh.moveTo(-hw,0);sh.lineTo(-ow,0);sh.lineTo(-ow,P.top);sh.absellipse(0,P.top,ow,P.arch,Math.PI,0,true);sh.lineTo(ow,0);sh.lineTo(hw,0);sh.lineTo(hw,Hh);sh.lineTo(-hw,Hh);sh.lineTo(-hw,0);
  const wall=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:10,bevelEnabled:false,curveSegments:18}),conc);wall.position.set(cx,0,P.y);wall.castShadow=wall.receiveShadow=true;grp.add(wall);
  const cor=new T.Mesh(new T.BoxGeometry(hw*2+6,4,14),conc);cor.position.set(cx,Hh+2,P.y+5);cor.castShadow=true;grp.add(cor);
  const sideG=new T.PlaneGeometry(-depth,inH);
  for(const s of[-1,1]){const m=new T.Mesh(sideG,dark);m.rotation.y=-s*Math.PI/2;m.position.set(cx+s*ow,inH/2,P.y+depth/2);grp.add(m);}
  const roof=new T.Mesh(new T.PlaneGeometry(ow*2,-depth),dark);roof.rotation.x=Math.PI/2;roof.position.set(cx,inH,P.y+depth/2);grp.add(roof);
  const back=new T.Mesh(new T.PlaneGeometry(ow*2,inH),new T.MeshBasicMaterial({color:0x000000}));back.position.set(cx,inH/2,P.y+depth+2);grp.add(back);
  const red=new T.Mesh(new T.SphereGeometry(1.1,8,6),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));red.position.set(cx+28,30,P.y+depth+10);grp.add(red);
  const chev=canvasTex(32,128,(x,w,h)=>{x.fillStyle='#d8a52a';x.fillRect(0,0,w,h);x.fillStyle='#141414';for(let y=-w;y<h+w;y+=24){x.beginPath();x.moveTo(0,y);x.lineTo(w,y+w*.75);x.lineTo(w,y+w*.75+12);x.lineTo(0,y+12);x.fill();}});
  for(const s of[-1,1]){const m=new T.Mesh(new T.PlaneGeometry(7,P.top),new T.MeshStandardMaterial({map:chev,roughness:.7,emissive:0x2a2008}));m.position.set(cx+s*(ow+4.5),P.top/2,P.y+10.2);grp.add(m);}
  const br=new T.Mesh(new T.BoxGeometry(2,2,4),dark);br.position.set(cx,inH+5.6,P.y+11);grp.add(br);   // the lamp's bracket over the mouth
}
// the water: the lake (on past the map's edge, round the fortress's moat) and the river, glossy and dark like the canal
function waterMesh(grp){
  const wm=new T.MeshStandardMaterial({color:0x0c1a22,roughness:.14,metalness:.7}),sh=new T.Shape(),P=lakePts(),env=nightEnv();if(env){wm.envMap=env;wm.envMapIntensity=1.4;}   // (the night sky and its glows in it, like the wet ground)
  sh.moveTo(P[0][0],-P[0][1]);for(const p of P)sh.lineTo(p[0],-p[1]);   // (the shape's y is the map's -y: laid flat below)
  const lake=new T.Mesh(new T.ShapeGeometry(sh),wm);lake.rotation.x=-Math.PI/2;lake.position.y=.15;lake.receiveShadow=true;grp.add(lake);
  const rv=new T.Mesh(new T.PlaneGeometry(RIVER.x1-RIVER.x0,RIVER.y1-RIVER.y0+4),wm);rv.rotation.x=-Math.PI/2;rv.position.set((RIVER.x0+RIVER.x1)/2,.15,(RIVER.y0+RIVER.y1)/2);rv.receiveShadow=true;grp.add(rv);
  const st=new T.MeshStandardMaterial({color:0x6c6d68,roughness:.9});
  for(const x of[RIVER.x0-2.5,RIVER.x1+2.5]){const b=new T.Mesh(new T.BoxGeometry(5,2,RIVER.y1-RIVER.y0),st);b.position.set(x,.6,(RIVER.y0+RIVER.y1)/2);b.receiveShadow=true;grp.add(b);}   // the stone banks
  const foam=new T.Mesh(new T.PlaneGeometry(10,CANAL.y1-CANAL.y0-6),new T.MeshBasicMaterial({color:0x8a98a0,transparent:true,opacity:.35,depthWrite:false}));foam.rotation.x=-Math.PI/2;foam.position.set(RIVER.x0+6,.3,(CANAL.y0+CANAL.y1)/2);grp.add(foam);   // where the canal spills in
}
// the road's bridge over the river: a concrete deck (its top painted like the road), railings either side (scene.js's 'rail'), piers, a lamp
function bridgeMesh(grp){
  const b=RBR,cx=(b.x0+b.x1)/2,cz=(b.y0+b.y1)/2,w=b.x1-b.x0,d=b.y1-b.y0;
  const top=canvasTex(256,192,(x,W,H)=>{x.fillStyle='#2a2c2f';x.fillRect(0,0,W,H);const r=rng(5);for(let i=0;i<4000;i++){x.fillStyle=r()<.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.18)';x.fillRect(r()*W,r()*H,1.2,1.2);}
    const k=H/d,mid=(-275-b.y0)*k;x.fillStyle='#7c7e7a';x.fillRect(0,0,W,(RD.y0-b.y0)*k);x.fillRect(0,(RD.y1-b.y0)*k,W,H);   // the kerbs and footways
    x.strokeStyle='rgba(225,228,230,.65)';x.lineWidth=2;x.setLineDash([22*W/w,18*W/w]);x.beginPath();x.moveTo(0,mid);x.lineTo(W,mid);x.stroke();x.setLineDash([]);
    for(const y of[RD.y0+5,RD.y1-5]){x.beginPath();x.moveTo(0,(y-b.y0)*k);x.lineTo(W,(y-b.y0)*k);x.stroke();}
    x.fillStyle='rgba(0,0,0,.5)';for(const xx of[.18,.5,.82])x.fillRect(xx*W,0,2,H);});   // expansion joints
  top.wrapS=top.wrapT=T.ClampToEdgeWrapping;
  const conc=new T.MeshStandardMaterial({color:0x7d7f7a,roughness:.9}),deck=new T.Mesh(new T.BoxGeometry(w,2,d),[conc,conc,new T.MeshStandardMaterial({map:top,roughness:.75,metalness:.1}),conc,conc,conc]);
  deck.position.set(cx,1,cz);deck.castShadow=deck.receiveShadow=true;grp.add(deck);
  const beam=new T.Mesh(new T.BoxGeometry(w,6,d-14),conc);beam.position.set(cx,-3,cz);grp.add(beam);
  for(const x of[cx-30,cx+30]){const p=new T.Mesh(new T.BoxGeometry(8,10,d-24),conc);p.position.set(x,-4,cz);grp.add(p);}
}
// a coach broken down in the left lane, its nose in the tunnel's mouth: dirty cream, a dark window band with panes gone, the door open, a flat tyre
function busMesh(grp,b=BUS){   // (tunnel.js puts the same coach at its south end)
  const g=new T.Group();g.position.set(b.x+b.w/2,0,b.y+b.h/2);g.rotation.z=-.035;grp.add(g);
  const body=new T.MeshStandardMaterial({color:0x9c968a,roughness:.75,metalness:.25}),dark=new T.MeshStandardMaterial({color:0x101417,roughness:.25,metalness:.6}),strip=new T.MeshStandardMaterial({color:0x5a2a26,roughness:.7});
  const glass=new T.MeshStandardMaterial({color:0x1a2730,roughness:.08,metalness:.8,transparent:true,opacity:.85}),tyre=new T.MeshStandardMaterial({color:0x111214,roughness:.9});
  const B=(w,h,d,m,x,y,z)=>{const o=new T.Mesh(new T.BoxGeometry(w,h,d),m);o.position.set(x,y,z);o.castShadow=o.receiveShadow=true;g.add(o);return o;};
  B(b.w,14,b.h,body,0,10,0);B(b.w-.6,1.6,b.h-.6,strip,0,6,0);B(b.w-1,2.2,b.h-3,body,0,24,0);B(b.w-8,2,24,body,0,26,12);   // the body, a stripe, the roof, the air conditioning
  const r=rng(77);for(const s of[-1,1])for(let z=-b.h/2+10;z<b.h/2-6;z+=11){const broke=r()<.3;if(broke&&s>0&&z<-30)continue;B(.6,6,9.4,broke?dark:glass,s*(b.w/2+.05),20,z);}   // the windows, some panes gone
  B(b.w-2,9,.6,glass,0,18,-b.h/2-.1);B(b.w-2,3,.6,dark,0,8,-b.h/2-.1);   // the windscreen, the grille
  B(.8,13,9,dark,b.w/2+.2,10,-b.h/2+16);   // the door, open on the right
  for(const z of[-b.h/2+18,b.h/2-30,b.h/2-18])for(const s of[-1,1]){const t=new T.Mesh(new T.CylinderGeometry(4.4,4.4,3,14),tyre);t.rotation.z=Math.PI/2;t.position.set(s*(b.w/2-1),4.4-(s<0&&z<0?1.4:0),z);t.castShadow=true;g.add(t);}   // (the front left one flat)
  for(const s of[-1,1]){const l=new T.Mesh(new T.BoxGeometry(3,1.6,.4),new T.MeshBasicMaterial({color:0x3a0d08}));l.position.set(s*(b.w/2-4),8,b.h/2+.2);g.add(l);}   // dead tail lights
}
// the lighthouse across the lake: a tower in white and red bands on its rock, the lantern lit, its beam turning (EAST.beam: roadTick)
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
// the centipede that goes into the tunnel the first time the squad sees it (Bryan: "crawling into the tunnel from above it and
// crawls on the ceiling"): one of her young, bigger, its path over the hill, down the headwall's face, under the arch and in
// along the roof upside down (creatures.js's makeCentipede and pose, each segment's up from the surface it's on)
const CENTI_S=2.2,CENTI_V=24;   // its size against her young's, its speed
const CENTI_PATH=[[1738,72,-560,0,1,0],[1724,62,-522,0,1,0],[1713,56,-489,0,1,0],[1707,51,-471,0,.6,.8],[1704,46,-466.5,0,0,1],[1702,42,-466.5,0,0,1],[1700,38.5,-474,0,-.7,.7],[1700,38.5,-496,0,-1,0],[1700,38.5,-620,0,-1,0]];   // x, height, y; its up
function centiStart(){
  if(!EAST.grp)return;let C=EAST.centi;
  if(!C){const keep=scene;scene=EAST.grp;try{C=makeCentipede(BROOD);}finally{scene=keep;}C.g.scale.setScalar(CENTI_S);EAST.grp.add(C.g);
    const curve=new T.CatmullRomCurve3(CENTI_PATH.map(p=>new T.Vector3(p[0]/CENTI_S,p[1]/CENTI_S,p[2]/CENTI_S)),false,'centripetal'),N=1600;
    C.path={curve,pts:curve.getSpacedPoints(N),N,L:curve.getLength()};C.len=BROOD.head.l*.55+BROOD.seg*.5+(BROOD.n-1)*BROOD.seg;EAST.centi=C;}
  C.t0=simT;C.on=true;C.g.visible=true;centiPose(C,0);
}
function centiPose(C,d){   // the head d along the path past where the whole body first lies on it
  const P=C.path,S=BROOD,n=S.n,at=k=>{const f=clamp(k/P.L,0,1)*P.N,i=Math.min(P.N-1,Math.floor(f));return P.pts[i].clone().lerp(P.pts[i+1],f-i);};
  const upAt=k=>{const u=clamp(k/P.L,0,1)*(CENTI_PATH.length-1),i=Math.min(CENTI_PATH.length-2,Math.floor(u)),f=u-i,a=CENTI_PATH[i],b=CENTI_PATH[i+1];return new T.Vector3(a[3]+(b[3]-a[3])*f,a[4]+(b[4]-a[4])*f,a[5]+(b[5]-a[5])*f).normalize();};
  const head=C.len+d,gap=S.head.l*.55+S.seg*.5,pts=[at(head)],ups=[upAt(head)];
  for(let i=1;i<=n;i++){const k=head-gap-(i-1)*S.seg;pts.push(at(k));ups.push(upAt(k));}
  poseCentipede(C,pts,simT,{walk:1,flail:.7,ups,jaw:.25+Math.sin(simT*6)*.1});
  return head-C.len>P.L-C.len*.15;   // (all of it in, past the arch)
}
function centiTick(){
  const C=EAST.centi;if(!C||!C.on)return;
  const d=(simT-C.t0)*CENTI_V/CENTI_S;
  if(centiPose(C,d)){C.on=false;C.g.visible=false;}
}
function buildEast(sc){
  if(EAST.grp){if(EAST.grp.parent!==sc){if(EAST.grp.parent)EAST.grp.parent.remove(EAST.grp);sc.add(EAST.grp);}return;}
  EAST.objs=eastObjects();
  EAST.lamps=[{x:1046,y:-352,h:34,c:0xffa860,i:1.8,d:210,pole:1,flick:1,east:1},   // a sodium lamp by the gate, failing
    {x:(RBR.x0+RBR.x1)/2,y:RBR.y0-6,h:30,c:0xffd9a0,i:1.6,d:200,pole:1,east:1},   // one on the bridge, still working
    {x:(PORTAL.x0+PORTAL.x1)/2,y:PORTAL.y+16,h:44,c:0xffb060,i:1.5,d:170,flick:1,east:1}];   // a work light over the tunnel's mouth
  const grp=new T.Group();grp.visible=false;sc.add(grp);EAST.grp=grp;
  const S=1.5,gw=EXT.x1-EXT.x0,gh=EXT.y1-EXT.y0,gc=document.createElement('canvas'),rc=document.createElement('canvas');
  gc.width=Math.round(gw*S);gc.height=Math.round(gh*S);rc.width=gw;rc.height=gh;paintEast(gc.getContext('2d'),rc.getContext('2d'),S);
  const tex=new T.CanvasTexture(gc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;EAST.tex=tex;EAST.rc=rc;
  const ground=new T.Mesh(new T.PlaneGeometry(gw,gh),wetGround(new T.MeshStandardMaterial({map:tex,roughnessMap:new T.CanvasTexture(rc),roughness:1,metalness:.16}),gw,gh));
  ground.rotation.x=-Math.PI/2;ground.position.set((EXT.x0+EXT.x1)/2,0,(EXT.y0+EXT.y1)/2);ground.receiveShadow=true;grp.add(ground);
  waterMesh(grp);bridgeMesh(grp);busMesh(grp);lighthouseMesh(grp);
  const keep=scene;scene=grp;   // (scene.js's meshes for the hut, the barriers, the car and the bridge's railings, and the gate's two leaves standing open)
  try{meshObjs(EAST.objs.filter(o=>['booth','barrier','car','rail'].includes(o.kind)));
    const leaves=[{kind:'gate',x:1000,y:-354,w:66,h:4},{kind:'gate',x:1000,y:-200,w:66,h:4}];meshObjs(leaves);
    leaves.forEach((o,i)=>{const a=i?.55:-.55,hz=i?-198:-352;if(o.mesh){o.mesh.position.set(1000+Math.cos(a)*33,0,hz+Math.sin(a)*33);o.mesh.rotation.y=-a;}});
  }finally{scene=keep;}
  grp.add(rockMesh(eastRocks()));grp.add(rockMesh(farRocks()));portalMesh(grp);
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
  if(EAST.centi){EAST.centi.on=false;EAST.centi.g.visible=false;}
  EAST_X=W;if(was)rebuildNav();
  if(EAST.dirty){paintEast(EAST.tex.image.getContext('2d'),EAST.rc.getContext('2d'),1.5);EAST.tex.needsUpdate=true;EAST.dirty=false;}   // (clean ground for the next game)
}
function resetRoad(){closeEast();road=null;hqStaff=[];}   // (state.js's reset)

/* ---------- out of the Headquarters, and back in ---------- */
function roadGather(){   // (interior.js's gatherZone: GO OUT in the Headquarters' entry hall, TUNNEL at the tunnel's mouth)
  const need=players.filter(p=>alive(p)&&!p.offMap),down=players.some(p=>p.downed&&!p.dead&&!p.carriedBy),all=z=>need.length>0&&!down&&need.every(p=>inZone(p,z));
  if(MAPID==='hq'&&HQ&&HQ.base&&state==='play'&&!cineOn()&&!talkActive()&&(!HQ.floors||curFloor==='GF'))return{z:HQ_EXIT,ready:all(HQ_EXIT),go:'GO OUT',need,fn:leaveBase};
  if(MAPID==='out'&&road&&road.talked&&state==='play')return{z:TUN_ZONE,ready:all(TUN_ZONE),go:'GOING IN',name:'TUNNEL',auto:'in',need,fn:enterTunnel};   // (auto: it goes by itself, Bryan: "When approaching it it changes to it": tunnel.js)
  if(MAPID==='tun'&&state==='play')return[{z:TUN_IN,ready:all(TUN_IN),go:'GOING OUT',name:'OUT',auto:'out',need,fn:leaveTunnel},{z:TUN_END,ready:all(TUN_END),go:'NEXT MISSION · COMING NEXT',name:'THE RADIO TOWER',auto:'end',need,fn:tunnelEnd}];
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
  if(EAST.beam&&EAST.grp&&EAST.grp.visible)EAST.beam.rotation.y=simT*.7;   // the lighthouse's beam going round
  centiTick();
  if(!road)return;const I=road.intro,g=road.guide;
  if(state==='play'&&!fading&&!I&&(MAPID==='out'||MAPID==='tun')){const A=road.auto||(road.auto={});   // the gather areas that go by themselves: half a second after everyone's in
    for(const G of gatherZones()){if(!G.auto)continue;const a=A[G.auto]||(A[G.auto]={t:0,done:false});if(!G.ready){a.t=0;a.done=false;continue;}a.t+=dt;if(a.t>.5&&!a.done){a.done=true;G.fn();}}}
  if(I&&MAPID==='out'){
    if(contact||state!=='play'){roadIntroEnd(true);return;}   // (trouble on the way: the rest can wait)
    if(I.ph==='walk'&&simT-I.t0>1.3){I.ph='pan';camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:ROAD_OUT.x+40,z:ROAD_OUT.y+30,zoom:2.3},t:0,dur:1.6};}
    else if(I.ph==='pan'&&!camPan){I.t1=I.t1||simT;if(simT-I.t1>.4){I.ph='talk';const lead=roadLead();
      talkStart([{who:lead,to:g,text:ROAD_TALK[0],clip:'road_1'},g&&{who:g,to:lead,text:ROAD_TALK[1],clip:'road_2'},{who:lead,to:g,text:ROAD_TALK[2],clip:'road_3'}],roadTalkDone);}}
    else if(I.ph==='east'){   // the camera slides along with them (Bryan: "the screen slides over with the troops when they move")
      const up=upNow();if(up.length){const m=midOf(up),k=Math.min(1,dt*2.2);camT.x+=(m.x+70-camT.x)*k;camT.z+=(m.y+60-camT.z)*k;zoom+=(1.75-zoom)*Math.min(1,dt*.9);tilt+=(.36-tilt)*Math.min(1,dt*.9);clampCam();updateCamera();}
      if(!up.some(p=>p.path.length)||simT-I.t2>40){I.ph='see';I.t3=simT;camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:1690,z:-420,zoom:2.2},t:0,dur:1.8};}}
    else if(I.ph==='see'&&!camPan){if(!I.c){I.c=1;centiStart();sfxMon('mon_growl',{x:1700,y:-470},.8,.8);}
      if(I.c===1&&simT-I.t3>3.2){I.c=2;const p=roadLead();if(p)callout(p,'Movement! Over the tunnel.',C.warn);}
      if(!EAST.centi||!EAST.centi.on){I.ph='done';roadIntroEnd(false);}}
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
  if(EAST.centi&&cut){EAST.centi.on=false;EAST.centi.g.visible=false;}
  const up=upNow();
  if(!cut&&up.length){const m=midOf(up);camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:m.x+40,z:m.y+40,zoom:2.0},t:0,dur:2.0};}
  obj=Math.max(obj,7);updateObjUI();setStatus();hud();saveGame('road');
}
function roadHint(){
  if(MAPID==='tun')return tunHint();
  if(MAPID!=='out'||!road||road.intro)return'';
  return'The road east runs on past the gate, over the bridge, to a tunnel in the hill: the way to the old radio tower. Walk everyone into its mouth to go in. The green area at the drawbridge takes you back into the Headquarters.';
}
// a Continue from the save on the road: the big map with the road open, the talk done, the squad where it stopped in sight of the tunnel
function roadContinue(){
  openEast(null);road.talked=true;road.intro=null;
  mon.out={t0:simT-60,spawned:MON_FLOOD.n,roared:true,done:true};
  const taken=[];players.filter(p=>!p.dead&&!p.gone).forEach((p,i)=>{const t=openSpot(ROAD_STOP.x-Math.floor(i/2)*24,ROAD_STOP.y+(i%2?16:-16),taken)||ROAD_STOP;taken.push(t);p.x=t.x;p.y=t.y;p.path=[];p.ang=0;});
  VB={x0:0,z0:TOP,x1:EXT.x1,z1:H};camT={x:ROAD_STOP.x+40,z:ROAD_STOP.y+40};zoom=2.0;clampCam();updateCamera();updateObjUI();
}
