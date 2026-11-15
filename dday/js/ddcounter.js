/* ddcounter.js: Chapter 2, the counterattack on the base the player took (Version 159). Bryan, after Version 157: "Next up is a counter
   attack on the base the player just took"; his answers: from inland, a large force seen marching toward the base ahead of time, tanks and
   troops; the base has MGs the player can put troops on by selecting them; leaving the barracks triggers it, about 20 seconds to set up;
   artillery and MG nests in the field in front of the base; three waves, hold until all of them are dead; the other troops fight too;
   the forward nests as drawn (strong, exposed); reserve men come out of the barracks as replacements; a loss is a retry; a field gun fires
   where it's told, or by itself if ignored. Draft: docs/drafts/counterattack-draft.png.

   The same engine and scene builder as the beach with DD_MODE 'counter' (dday.js asks dcHeights, dcObjects, dcPaint, dcScenery, dcBuild):
   the base at the south facing inland (north), a field, a hedgerow, a farm and an orchard, the tree line, one road. `dd.counter` is true
   and ddTick hands over to dcTick. `dd.dc` is the fight: ph 'intro' (the camera up the road to the column) -> 'setup' (DCA.setup s) ->
   'w1' -> 'lull' -> 'w2' -> 'lull' -> 'w3' -> won. DCA.guns are the mounted guns (three forward nests, two on the wall, two field guns): a
   tap on one with a squad picked sends its nearest free man (dcTap, dcMan), the other troops take what's left (dcNpc). */
const DCA={x0:200,x1:1200,wallY:556,gate:[640,760],road:700,setup:20,lull:15,gunHit:42,
  cp:{x:1000,y:650,w:120,h:110},cpZone:{x0:950,y0:600,x1:1170,y1:810},
  barracks:[{x:260,y:660,w:170,h:50},{x:260,y:740,w:170,h:50}],door:{x:460,y:700},
  armory:{x:250,y:812,w:110,h:56},depot:{x:1004,y:812,w:150,h:56},   // (in the south corners: between the camera and the square they hid it)
  square:{x:700,y:640},
  trenchY:300,hedgeY:-70,treeY:-430,
  guns:[{k:'n1',n:'MG NEST 1',x:450,y:250,t:'mg',arc:1.15},{k:'n2',n:'MG NEST 2',x:950,y:250,t:'mg',arc:1.15},{k:'n3',n:'MG NEST 3',x:590,y:345,t:'mg',arc:1.15},
    {k:'w1',n:'WALL MG',x:520,y:578,t:'mg',arc:1.0},{k:'w2',n:'WALL MG',x:880,y:578,t:'mg',arc:1.0},
    {k:'a1',n:'FIELD GUN A',x:330,y:470,t:'art'},{k:'a2',n:'FIELD GUN B',x:1070,y:470,t:'art'}],
  art:{min:170,max:960,reload:9,auto:6,R:84,D:150},
  waves:[{inf:22,tanks:[]},{inf:16,tanks:['road'],mortar:true},{inf:20,tanks:['west','east']}],
  ways:{road:[[700,-80],[700,260],[700,540],[700,620],[1000,700]],west:[[540,-430],[540,-60],[400,150],[350,300],[350,500],[660,524],[700,620],[1000,700]],east:[[860,-430],[860,-60],[1020,150],[1060,300],[1060,500],[740,524],[700,620],[1000,700]]}};
const dcIn=(u,z)=>u.x>z.x0&&u.x<z.x1&&u.y>z.y0&&u.y<z.y1;

/* ---------- the ground ---------- */
function dcHeights(){
  const{nx,ny}=DDG,a=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=i*10,y=DDB.y0+j*10;
    let h=Math.max(0,-90-y)*.036+Math.sin(x*.011+1)*Math.cos(y*.009)*1.6;                       // the land rises a little to the tree line
    if(y>DCA.trenchY+2&&y<DCA.trenchY+26&&x>370&&x<1030&&Math.abs(x-DCA.road)>46)h-=5.5;            // the trench behind its parapet
    if(y>530)h=0;a[j*nx+i]=h;}
  return a;
}
function dcObjects(){
  const L=[],o=(kind,x,y,w,h,ex)=>{const q=Object.assign({kind,x,y,w,h,full:false},ex||{});L.push(q);return q;};
  o('drop',0,-760,200,1660);o('drop',1200,-760,600,1660);
  // the base: bank and wire across the north with the gate, wire down the sides and the back
  for(const[x0,x1]of[[240,DCA.gate[0]],[DCA.gate[1],1160]]){o('dcbank',x0,DCA.wallY,x1-x0,12,{cover:2});for(let x=x0;x<x1;x+=50)o('ddwire',x,DCA.wallY-18,Math.min(50,x1-x)-.01,8,{hp:60,tag:'wire'});}
  for(const x of[232,1160])o('dcside',x,DCA.wallY-18,8,340,{full:false});
  o('dcside',240,884,920,8,{ew:1});
  for(const b of DCA.barracks)o('ddbarr',b.x,b.y,b.w,b.h,{full:true});
  o('dcbld',DCA.armory.x,DCA.armory.y,DCA.armory.w,DCA.armory.h,{full:true,look:'store'});o('dcbld',DCA.depot.x,DCA.depot.y,DCA.depot.w,DCA.depot.h,{full:true,look:'shed'});
  o('dcbld',DCA.cp.x,DCA.cp.y,DCA.cp.w,DCA.cp.h,{full:true,look:'cp'});
  o('sandbag',DCA.gate[0]-4,DCA.wallY+40,10,40);o('sandbag',DCA.gate[1]-6,DCA.wallY+40,10,40);o('sandbag',940,690,10,44);
  for(const[x,y]of[[560,620],[820,640],[610,690],[880,720],[330,610],[1060,600],[780,820],[470,830]])o('ddcrate',x,y,22,20,{cover:1});
  // the forward nests, the wall guns' bags, the field guns' pits, the trench's parapet
  for(const g of DCA.guns){if(g.t==='mg'&&g.k[0]==='n'){o('sandbag',g.x-24,g.y-20,48,10);o('sandbag',g.x-30,g.y-16,10,28);o('sandbag',g.x+20,g.y-16,10,28);}
    else if(g.t==='art'){o('sandbag',g.x-34,g.y-36,68,10);o('sandbag',g.x-40,g.y-30,10,34);o('sandbag',g.x+30,g.y-30,10,34);}}
  for(const[x0,x1]of[[380,560],[620,654],[746,1020]])o('sandbag',x0,DCA.trenchY-8,x1-x0,10);
  // the field: a little cover for them, the hedgerow with its gaps, the farm's walls
  for(const[x,y]of[[560,40],[840,80],[390,130],[1020,10],[300,-10],[1100,120],[620,170],[790,-20]])o('ddbould',x,y,18,15,{cover:1});
  for(const[x0,x1]of[[220,520],[560,640],[760,840],[880,1180]])o('dchedge',x0,DCA.hedgeY,x1-x0,14,{full:true,cover:2});
  o('ddconc',330,-262,104,8,{full:true,cover:2});o('ddconc',330,-254,8,66,{full:true,cover:2});o('ddconc',426,-254,8,36,{full:true,cover:2});
  for(const[x,y]of[[300,-420],[430,-400],[560,-430],[840,-420],[960,-400],[1090,-430]])o('ddbould',x,y,20,16,{cover:1});
  return L;
}
function dcPaint(g){
  const S=DDS,r=rng(1945);g.setTransform(S,0,0,S,0,-DDB.y0*S);
  g.fillStyle='#6f8a4b';g.fillRect(0,DDB.y0,1400,1660);
  for(let i=0;i<5200;i++){const x=r()*1400,y=DDB.y0+r()*1660;g.fillStyle=`rgba(${r()<.5?'58,82,40':'150,170,96'},${.06+r()*.12})`;g.fillRect(x,y,3+r()*9,2+r()*5);}
  // plough land and pasture beyond the hedgerow
  g.fillStyle='rgba(132,156,84,.55)';g.fillRect(230,-330,300,250);g.fillStyle='rgba(150,150,86,.5)';g.fillRect(760,-340,400,260);
  g.strokeStyle='rgba(70,60,40,.18)';g.lineWidth=2;for(let x=236;x<530;x+=9){g.beginPath();g.moveTo(x,-330);g.lineTo(x,-82);g.stroke();}
  // the road in from inland, worn and rutted
  g.fillStyle='#b4a47c';g.fillRect(DCA.road-30,DDB.y0,60,1660-300);
  g.fillStyle='rgba(90,80,58,.45)';for(let y=DDB.y0;y<560;y+=7){g.fillRect(DCA.road-13+Math.sin(y*.05)*2,y,2,5);g.fillRect(DCA.road+11+Math.sin(y*.043)*2,y,2,5);}
  // trampled earth round the nests, the guns and the trench
  for(const q of DCA.guns){const gr=g.createRadialGradient(q.x,q.y,4,q.x,q.y,q.t==='art'?58:44);gr.addColorStop(0,'rgba(120,100,66,.85)');gr.addColorStop(1,'rgba(120,100,66,0)');g.fillStyle=gr;g.fillRect(q.x-60,q.y-60,120,120);}
  g.fillStyle='rgba(74,60,40,.75)';g.fillRect(372,DCA.trenchY+2,274,24);g.fillRect(746,DCA.trenchY+2,284,24);
  // the base: hard-packed yard, the parade square
  g.fillStyle='#a69c7e';g.fillRect(238,DCA.wallY-6,924,340);
  for(let i=0;i<2400;i++){g.fillStyle=`rgba(${r()<.5?'70,64,48':'214,204,172'},${.05+r()*.1})`;g.fillRect(238+r()*924,DCA.wallY-6+r()*340,2+r()*5,2+r()*4);}
  g.fillStyle='#b6ad90';g.fillRect(620,590,160,110);g.strokeStyle='rgba(240,236,220,.6)';g.lineWidth=2;g.strokeRect(624,594,152,102);
  g.fillStyle='rgba(60,54,40,.45)';g.fillRect(240,DCA.wallY+12,400,10);g.fillRect(760,DCA.wallY+12,400,10);
}
function dcScenery(sc){
  const far=new T.Mesh(new T.PlaneGeometry(9000,5000),new T.MeshStandardMaterial({color:0x6f8a4b,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(700,-1.2,0);far.receiveShadow=true;sc.add(far);
  const hill=new T.Mesh(new T.PlaneGeometry(9000,1800),new T.MeshStandardMaterial({color:0x5b7340,roughness:1}));hill.rotation.x=-Math.PI/2+.06;hill.position.set(700,60,DDB.y0-880);sc.add(hill);
}
function dcBuild(G,sc,M,add){
  const earth=M(0x6a5c40,1),turf=M(0x7d8a4c,1),wall=M(0x9a9482,.95),roofM=M(0x55584e,.9),cpM=M(0x8d9298,.9),dark=M(0x26282a,.7,.5),wood=M(0x5d4a34,.95),steel=M(0x3a3632,.6,.7),wm=M(0x55504a,.5,.7),hedge=new T.MeshStandardMaterial({color:0x35542c,roughness:1,flatShading:true}),leaf=new T.MeshStandardMaterial({color:0x3f6a34,roughness:1,flatShading:true}),leaf2=new T.MeshStandardMaterial({color:0x577a3a,roughness:1,flatShading:true});
  const H=(x,y)=>ddH(x,y);
  for(const o of DD.objs){const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=H(cx,cy);
    if(o.kind==='dcbank')o.meshes=[add(new T.BoxGeometry(o.w,9,o.h+4),earth,cx,g0+4.5,cy),add(new T.BoxGeometry(o.w-2,3,o.h-2),turf,cx,g0+10,cy)];
    else if(o.kind==='dcside'){o.meshes=[];if(o.ew){for(let x=o.x;x<=o.x+o.w;x+=25)o.meshes.push(add(new T.BoxGeometry(1,19,1),wood,x,g0+9.5,cy));for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(o.w,.35,.35),wm,cx,g0+hh,cy));}
      else{for(let y=o.y;y<=o.y+o.h;y+=25)o.meshes.push(add(new T.BoxGeometry(1,19,1),wood,cx,g0+9.5,y));for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(.35,.35,o.h),wm,cx,g0+hh,cy));}}
    else if(o.kind==='dcbld'){const cp=o.look==='cp',h=cp?40:30;o.meshes=[add(new T.BoxGeometry(o.w,h,o.h),cp?cpM:wall,cx,g0+h/2,cy),add(new T.BoxGeometry(o.w+8,4,o.h+8),roofM,cx,g0+h+2,cy)];
      if(cp){o.meshes.push(add(new T.BoxGeometry(1.6,22,18),dark,o.x-.6,g0+11,cy));const pole=add(new T.CylinderGeometry(.6,.6,44,6),steel,cx,g0+h+24,cy);o.meshes.push(pole,add(new T.BoxGeometry(16,9,.5),M(0x2b4a8a,.8),cx+8.5,g0+h+40,cy));}
      else if(o.look==='shed'){for(let k=0;k<3;k++)o.meshes.push(add(new T.BoxGeometry(o.w/3-8,22,1.4),dark,o.x+o.w*(k+.5)/3,g0+11,o.y-.5));}
      else o.meshes.push(add(new T.BoxGeometry(14,18,1.4),dark,cx,g0+9,o.y-.5));}
    else if(o.kind==='dchedge'){o.meshes=[];const r=rng(Math.round(o.x));for(let x=o.x+7;x<o.x+o.w;x+=13){const m=add(new T.DodecahedronGeometry(9,0),hedge,x,H(x,cy)+7+r()*2,cy+(r()-.5)*3,r()*6);m.scale.set(1.1,1+r()*.5,.95);o.meshes.push(m);}}
  }
  // watchtowers at the north corners, the flag on the square
  for(const[tx,ty]of[[256,586],[1144,586]]){for(const[dx,dz]of[[-7,-7],[7,-7],[-7,7],[7,7]])add(new T.BoxGeometry(1.6,30,1.6),wood,tx+dx,15,ty+dz);
    add(new T.BoxGeometry(18,1.6,18),wood,tx,30,ty);for(const[dx,dz,w,d]of[[0,-9,18,1],[-9,0,1,18],[9,0,1,18]])add(new T.BoxGeometry(w,7,d),wood,tx+dx,34,ty+dz);add(new T.BoxGeometry(22,1.4,22),roofM,tx,50,ty);for(const[dx,dz]of[[-8,-8],[8,-8],[-8,8],[8,8]])add(new T.BoxGeometry(1,20,1),wood,tx+dx,40,ty+dz);}
  add(new T.CylinderGeometry(.7,.7,60,6),steel,DCA.square.x,30,DCA.square.y);add(new T.BoxGeometry(22,12,.5),M(0x2b4a8a,.8),DCA.square.x+12,52,DCA.square.y);
  // the guns: a machine gun on its tripod, or a field gun on its carriage (its group turns to where it fires)
  const gm=M(0x2a2c2e,.5,.7),ol=M(0x4d5540,.9);DD.dcGuns={};
  for(const q of DCA.guns){const g=new T.Group();g.position.set(q.x,H(q.x,q.y),q.y-(q.t==='art'?14:9));g.rotation.y=Math.PI/2;const P=(geo,m,x,y,z,rz,rx)=>{const b=new T.Mesh(geo,m);b.position.set(x,y,z);if(rz)b.rotation.z=rz;if(rx)b.rotation.x=rx;b.castShadow=true;g.add(b);return b;};
    if(q.t==='mg'){P(new T.CylinderGeometry(.75,.75,17,7),gm,9,11.6,0,Math.PI/2);P(new T.CylinderGeometry(1.25,1.25,7,8),gm,3,11.6,0,Math.PI/2);P(new T.BoxGeometry(5,3,2.2),gm,-2,11.2,0);P(new T.BoxGeometry(3,2.4,4.6),gm,1,10.6,2.6);
      for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,13,5),gm);l.position.set(Math.cos(a)*3.4,5.4,Math.sin(a)*3.4);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}}
    else{P(new T.BoxGeometry(22,5,14),ol,-2,8,0);P(new T.BoxGeometry(3,16,26),ol,6,13,0);const b=P(new T.CylinderGeometry(1.9,2.4,58,8),gm,30,15,0,Math.PI/2-.16);b.userData.rest=30;g.userData.barrel=b;
      for(const z of[-12,12]){const w=P(new T.CylinderGeometry(8,8,3,14),gm,0,8,z,0,Math.PI/2);w.castShadow=true;}P(new T.BoxGeometry(34,2.4,3),ol,-20,4,6);P(new T.BoxGeometry(34,2.4,3),ol,-20,4,-6);}
    G.add(g);DD.dcGuns[q.k]=g;}
  // trees: the tree line across the north, the orchard, a few along the road and round the farm
  const tr=rng(77),tree=(x,y,s,m)=>{const g0=H(x,y);add(new T.CylinderGeometry(1.4*s,2*s,16*s,6),wood,x,g0+8*s,y);const c=add(new T.DodecahedronGeometry(13*s,0),m,x,g0+24*s,y,tr()*6);c.scale.y=1.2;add(new T.DodecahedronGeometry(9*s,0),m,x+5*s,g0+33*s,y-3*s,tr()*6);};
  for(let x=-200;x<1640;x+=30){if(Math.abs(x-DCA.road)<52)continue;for(let k=0;k<2;k++)tree(x+(tr()-.5)*20,DCA.treeY-30-k*46+(tr()-.5)*30,1.2+tr()*.7,tr()<.5?leaf:leaf2);}
  for(let i=0;i<6;i++)for(let j=0;j<3;j++)tree(800+i*56,-300+j*60,.7,leaf2);
  for(const[x,y]of[[300,-290],[470,-230],[250,-130],[1130,-120],[640,-560],[770,-610]])tree(x,y,1,leaf);
  // the ruined farm's fallen roof and chimney
  add(new T.BoxGeometry(60,3,40),M(0x7a4a36,.9),384,6,-226,.2).rotation.z=.18;add(new T.BoxGeometry(10,34,10),M(0x8a7f6e,.95),338,17,-250);
}

/* ---------- starting it ---------- */
function startCounter(retry){
  if(!ddRoster)ddRoster=ddmRead();
  if(retry&&startCounter.snap){ddRoster=JSON.parse(startCounter.snap);ddmSave();}   // (a loss is a retry: the roster as it was when they left the barracks)
  if(!ddmFit().length){banner('Nobody fit in the squads: treat the wounded, or bring men in from the reserve.',3200);return;}
  startCounter.snap=JSON.stringify(ddRoster);
  reset();DD_MODE='counter';$('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  enterCounter();state='play';endAt=0;
  bigText('Chapter 2: Hold the base','chapter');hud();
}
function enterCounter(){
  buildDDay();stashOut(players);
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap({objs:DD.objs,hq:DD.hq,slow:[],lamps:DD.lamps,scene:DD.scene,lights:DD.lights,x1:NAV_W});
  tankFires=[];rockets=[];charges=[];units=[];players=[];enemies=[];civs=[];
  MAPID='dd';LEVEL=5;groundH=ddH;
  dd={counter:true,t0:simT,pool:ddmReserveFit().length,lost:0,queue:[],npcs:[],npcN:0,nid:0,eid:0,active:'A',idle:{A:0,B:0},hop:{A:0,B:0},wp:{A:0,B:0},front:800,won:false,over:false,
    land:{t:0,done:true},boats:[],waveT:0,spawnT:1e9,aiT:0,npcT:0,shellT:{},oob:0,ambT:0,killed:0,npcLost:0,blown:{},labels0:{},tanks:[],held:{},wires:[],
    dc:{ph:'intro',t:0,wave:0,cpT:0,guns:DCA.guns.map(g=>({...g,man:null,going:null,fireT:0,orderT:-99,aim:null,hits:0,dead:false,smokeT:0})),art:null,col:[],shells:[]}};
  for(const k in DD_LABELS){dd.labels0[k]=WEAPON[k].label;WEAPON[k].label=DD_LABELS[k];}
  dd.rpg0=SPECIALS.rpg.label;SPECIALS.rpg.label='Bazooka';dd.rpgR=PRPG.range;PRPG.range=900;dd.rpgA=PRPG.aim;PRPG.aim=1.15;
  // the squads on the parade square, the other troops along the wall
  ['A','B'].forEach((t,ti)=>[0,1,2,3].forEach(i=>{const rm=ddmSlotMan(t,i);if(!rm)return;const u=ddNewMan(t,t+(i+1),rm.role,DCA.square.x+(ti?26:-74)+i*16,DCA.square.y+(ti?14:-6),rm);u.inBoat=false;u.seen=true;}));
  players=units.filter(u=>u.side==='P'&&!u.npc);
  for(let i=0;i<10;i++){const u=ddNpc(280+i*94+(i>3?60:0),DCA.wallY+22+(i%2)*10);u.inBoat=false;u.seen=true;u.post={x:u.x,y:u.y};}
  // the column on the road: the first wave's men marching in, the tanks behind them
  const W=DCA.waves[0];for(let i=0;i<W.inf;i++){const e=ddFoe('w1',DCA.road-DDX+((i%3)-1)*13,-560-((i/3)|0)*22,{ang:Math.PI/2,nade:i%7===0?1:0});e.lane=250+(i/(W.inf-1))*900;e.cool=99;e.stage=-1;
    const p=findPath(e.x,e.y,e.lane,DCA.treeY+30+((i%2)*18),FOOT);if(p)e.path=p;e.zone={x0:e.lane-80,x1:e.lane+80,y0:DCA.treeY-20,y1:DCA.treeY+90};}
  ddTankSpawn({x:DCA.road,y:-700,ang:Math.PI/2,hold:true,way:DCA.ways.road,name:'Tank'}).w=2;
  ddTankSpawn({x:DCA.road-6,y:-770,ang:Math.PI/2,hold:true,way:DCA.ways.west,name:'Tank'}).w=3;
  ddTankSpawn({x:DCA.road+6,y:-840,ang:Math.PI/2,hold:true,way:DCA.ways.east,name:'Tank'}).w=3;
  enemies=units.filter(u=>u.side==='E');
  contact=true;clearTeams();teamSeen.A=true;teamSeen.B=true;teamSeen.N=true;
  mission.t0=simT;sel=[];cardGroup=[];
  VB={x0:DCA.x0,z0:-720,x1:DCA.x1,z1:900};FIT.w=1040;FIT.h=1560;fitDist();
  MAXZ=11;camShift=0;zoom=DD_CAM.zoom;yaw=0;tilt=ddTilt(DD_CAM.zoom);camT={x:DCA.square.x,z:DCA.square.y+DD_CAM.look};clampCam();updateCamera();
  document.body.classList.add('dd');ddSky(.35);DD.day=.35;DD.dayShown=.35;
  updateObjUI();setStatus();buildCards();hud();
  select(players.filter(p=>p.team==='A').length?players.filter(p=>p.team==='A'):players.filter(p=>p.team==='B'));dd.track=null;
  // the look up the road: there they are; then back, and the clock starts
  camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:DCA.road,z:-470+DD_CAM.look,zoom:6.5},t:0,dur:2.2};
  banner('A column on the road: infantry and tanks. They are coming for the base.',5200);
}

/* ---------- the guns ---------- */
const dcGunAt=(x,y,r=30)=>dd.dc.guns.reduce((b,g)=>{const d=hyp(x-g.x,y-g.y);return d<r&&(!b||d<hyp(x-b.x,y-b.y))?g:b;},null);
function dcSeat(g){return{x:g.x,y:g.y+(g.t==='art'?12:0)};}
function dcMan(u,g){   // send him to it; he takes it when he gets there (dcGunsTick)
  const s=dcSeat(g),p=findPath(u.x,u.y,s.x,s.y);if(!p)return false;
  if(g.man&&g.man!==u&&g.man.npc){g.man.onGun=null;g.man.gunner=false;g.man.dcGun=null;g.man=null;}   // (one of the other troops gives it up to a squad man)
  if(u.dcGun&&u.dcGun!==g){u.dcGun.man=u.dcGun.man===u?null:u.dcGun.man;u.dcGun.going=null;}
  Object.assign(u,{path:p,lastOrder:simT,watch:null,supT:null,focus:null,onGun:null,gunner:false,dcGun:g});g.going=u;g.goT=simT;return true;
}
function dcTap(wx,wy){
  const C=dd.dc;if(C.ph==='intro')return true;
  if(C.art){const g=C.art;C.art=null;const d=hyp(wx-g.x,wy-g.y);   // a field gun told where to fire
    if(d<DCA.art.min){banner('Too close for the gun.',1800);return true;}if(d>DCA.art.max){banner('Out of the gun\'s reach.',1800);return true;}
    g.aim={x:wx,y:wy};g.orderT=simT;if(simT<g.fireT)banner(`${g.n} is reloading: it fires there when it is ready.`,2200);return true;}
  const g=dcGunAt(wx,wy);if(!g)return false;
  if(g.dead){banner(`${g.n} is knocked out.`,1800);return true;}
  if(g.t==='art'&&g.man&&!g.man.npc){C.art=g;banner(`${g.n}: tap where to shell.`,2600);return true;}
  const c=sel.filter(u=>alive(u)&&!u.onGun&&!u.carry).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y));
  if(g.man&&!g.man.npc){banner(`${g.man.name} is on it.`,1600);return true;}
  if(!c.length){banner('Pick a squad first, then tap the gun.',2000);return true;}
  if(dcMan(c[0],g))callout(c[0],g.t==='art'?'To the field gun':'To the gun',C0());return true;
}
const C0=()=>typeof C!=='undefined'&&C.good?C.good:'#5fe08e';
function dcFire(g,x,y){
  g.fireT=simT+DCA.art.reload;g.aim=null;const by=g.man;
  nades.push({x0:g.x,y0:g.y-14,x1:x,y1:y,t:0,dur:clamp(hyp(x-g.x,y-g.y)/520,.7,1.9),by,R:DCA.art.R,D:DCA.art.D,shell:true});
  flashes.push({x:g.x,y:g.y-44,t:0});if(typeof sfxCannon==='function')sfxCannon(g.x,g.y);shake(.35);
  const m=DD.dcGuns&&DD.dcGuns[g.k];if(m){m.rotation.y=-Math.atan2(y-g.y,x-g.x);m.userData.kick=1;}
}
// a tank's shell on a gun (Bryan, after Version 159: "A tank can knock a gun out, in three hits. You can see it smoke after one, then dark smoke
// after 2"): a shell landing within DCA.gunHit of it is a hit; one and it smokes, two and the smoke is dark, three and it's wrecked for the fight
function dcGunHit(g){
  if(g.dead)return;g.hits++;const m=DD.dcGuns&&DD.dcGuns[g.k];
  if(g.hits<3){banner(g.hits===1?`${g.n} is hit and smoking. Two more and it is gone.`:`${g.n} is hit again: one more and it is gone.`,3000);return;}
  g.dead=true;g.aim=null;if(dd.dc.art===g)dd.dc.art=null;
  for(const u of[g.man,g.going])if(u){if(u.onGun){u.onGun=null;u.gunner=false;}if(u.dcGun===g)u.dcGun=null;}g.man=null;g.going=null;
  if(m){m.rotation.z=.32;m.rotation.x=.12;m.position.y-=2;m.traverse(o=>{if(o.material){o.material=o.material.clone();o.material.color.setHex(0x1b1a18);}});}
  for(let q=0;q<3;q++)booms.push({x:g.x+(Math.random()-.5)*24,y:g.y+(Math.random()-.5)*20,t:-q*.1,size:1});tankFires.push({x:g.x,y:g.y-8,r:9,t0:simT,puffs:[],emit:0});
  shake(.6);if(typeof sfxBoom==='function')sfxBoom(g.x,g.y,1.1);banner(`${g.n} is knocked out.`,3200);
}
function dcGunsTick(dt){
  const C=dd.dc,foes=enemies.filter(e=>!beaten(e)),tanks=ddTanksUp();
  for(const sh of C.shells.slice())if(simT>=sh.at){C.shells.splice(C.shells.indexOf(sh),1);for(const g of C.guns)if(hyp(sh.x-g.x,sh.y-g.y)<DCA.gunHit)dcGunHit(g);}
  for(const g of C.guns){
    if(g.hits&&(g.smokeT-=dt)<=0&&DD.rk&&DD.rk.puff){g.smokeT=g.hits>=2?.11:.22;const h=ddH(g.x,g.y)+(g.t==='art'?16:12);   // one hit: thin grey smoke; two: thick and dark; wrecked: black
      DD.rk.puff(g.x+(Math.random()-.5)*8,h,g.y-8+(Math.random()-.5)*8,g.hits>=2?7+Math.random()*4:4+Math.random()*2.5,g.hits>=2?3.4:2.4,g.hits>=3?0x161514:g.hits===2?0x2b2927:0x9a9690,g.hits>=2?13:9);}
    if(g.dead)continue;
    const m=g.man;if(m&&alive(m)&&m.dcGun===g&&m.path.length&&!(m.lastOrder>g.manT+.01)){m.path=[];m.x=dcSeat(g).x;m.y=dcSeat(g).y;}   // (he stays on it under fire: only an order of the player's takes him off)
    if(m&&(!alive(m)||m.path.length||m.dcGun!==g)){if(m.onGun){m.onGun=null;m.gunner=false;}if(m.dcGun===g)m.dcGun=null;g.man=null;if(C.art===g)C.art=null;}
    const u=g.going;if(u){const s=dcSeat(g);if(!alive(u)||u.dcGun!==g||simT-g.goT>40)g.going=null;
      else if(!u.path.length){g.going=null;if(hyp(u.x-s.x,u.y-s.y)<16&&!g.man){g.man=u;g.manT=simT;u.x=s.x;u.y=s.y;u.ang=-Math.PI/2;u.aimT=simT;
        if(g.t==='mg'){u.onGun={x:g.x,y:g.y,ang:-Math.PI/2,arc:g.arc};u.gunner=true;}if(!u.npc)callout(u,g.t==='art'?'On the field gun':'On the gun',C0());}else if(u.dcGun===g)u.dcGun=null;}}
    const mesh=DD.dcGuns&&DD.dcGuns[g.k];if(mesh&&mesh.userData.barrel){const k=mesh.userData.kick=Math.max(0,(mesh.userData.kick||0)-dt*2.5);mesh.userData.barrel.position.x=30-k*9;}
    if(g.t!=='art'||!g.man||simT<g.fireT||C.ph==='setup'||C.ph==='intro')continue;
    if(g.aim){dcFire(g,g.aim.x,g.aim.y);continue;}
    if(!g.man.npc&&simT-g.orderT<DCA.art.auto)continue;   // (the player's gun waits a moment for him; ignored, it picks its own target)
    // by itself: the nearest tank in reach, else where their men are thickest
    let best=null,bs=0;for(const K of tanks){const d=hyp(K.x-g.x,K.y-g.y);if(d>DCA.art.min&&d<DCA.art.max&&K.y>DCA.treeY-40){const s=900-d;if(s>bs){bs=s;best={x:K.x+Math.cos(K.ang)*30,y:K.y+Math.sin(K.ang)*30};}}}
    if(!best)for(const e of foes){const d=hyp(e.x-g.x,e.y-g.y);if(d<DCA.art.min||d>DCA.art.max||e.y<DCA.treeY-20)continue;const n=foes.filter(o=>hyp(o.x-e.x,o.y-e.y)<70).length;
      if(dd.allies.some(a=>hyp(a.x-e.x,a.y-e.y)<110))continue;if(n>bs){bs=n;best={x:e.x,y:e.y};}}
    if(best&&(bs>=2||tanks.length))dcFire(g,best.x+(Math.random()-.5)*36,best.y+(Math.random()-.5)*36);
  }
}
// the other troops: at their posts on the wall, and onto any gun the squads have left empty once the setting-up is over
function dcNpc(){
  const C=dd.dc;if(C.ph==='intro')return;
  for(const u of dd.npcs)if(alive(u)&&!u.path.length&&!u.dcGun&&u.post&&hyp(u.x-u.post.x,u.y-u.post.y)>30&&simT>(u.hopT||0)){const p=findPath(u.x,u.y,u.post.x,u.post.y);if(p)u.path=p;u.hopT=simT+4;}
  if(C.ph==='setup'&&C.t<DCA.setup-6)return;
  for(const g of C.guns){if(g.man||g.going)continue;if(g.dead)continue;
    const free=dd.npcs.filter(u=>alive(u)&&!u.dcGun&&!u.path.length).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(free)dcMan(free,g);}
}

/* ---------- the enemy ---------- */
function dcSpawnWave(n){
  const W=DCA.waves[n-1],tag='w'+n;
  if(n>1)for(let i=0;i<W.inf;i++){const lane=n===2?560+(i/(W.inf-1))*280:(i%2?250+(i/W.inf)*260:890+(i/W.inf)*260);
    const e=ddFoe(tag,lane-DDX+(Math.random()-.5)*30,DCA.treeY-60-Math.random()*90,{ang:Math.PI/2,nade:i%5===0?1:0});e.lane=lane;e.stage=-1;enemies.push(e);}
  for(const e of enemies)if(e.tag===tag){e.cool=Math.min(e.cool,1+Math.random()*2);e.stage=0;e.advT=simT+Math.random()*3;e.gait=null;}
  for(const K of dd.tanks)if(K.w===n&&K.hp>0){K.hold=false;K.i=0;}
  banner(n===1?'Here they come: infantry across the whole field.':n===2?'Second wave: a tank down the road, infantry behind it. Mortars on the forward nests.':'Third wave: two tanks, one on each flank. Everything they have left.',4600);
}
// each man works his way down the field in bounds: the hedgerow, the open ground, the trench, the wire, then the gate and the command post
const DC_STAGE=[-96,90,240,430];
function dcEnemy(){
  const C=dd.dc,taken=enemies.filter(o=>!o.dead).map(destOf);
  for(const e of enemies){if(beaten(e)||e.stage==null||e.stage<0||e.path.length||simT<(e.advT||0))continue;
    if(e.sup>.7){e.advT=simT+1.5;continue;}
    let tx,ty;const st=e.stage;
    if(st<DC_STAGE.length){ty=DC_STAGE[st]+(Math.random()-.5)*40;const pull=st/DC_STAGE.length;tx=e.lane+(DCA.road-e.lane)*pull*.75+(Math.random()-.5)*50;}
    else if(st===DC_STAGE.length){tx=DCA.road+(Math.random()-.5)*70;ty=DCA.wallY+50+Math.random()*30;}
    else{tx=DCA.cp.x-30+Math.random()*-40;ty=DCA.cp.y+20+Math.random()*90;}
    const s=openSpot(clamp(tx,DCA.x0+30,DCA.x1-30),ty,taken)||{x:tx,y:ty},p=findPath(e.x,e.y,s.x,s.y,FOOT);
    if(p&&p.length){e.path=p;e.zone={x0:s.x-110,x1:s.x+110,y0:s.y-90,y1:s.y+90};e.stage=Math.min(st+1,DC_STAGE.length+1);e.advT=simT+(st>=DC_STAGE.length?2:3.5+Math.random()*4.5);}
    else e.advT=simT+2;}
  // mortars with the second wave: a shell now and then on a manned forward nest
  if(C.ph==='w2'&&simT>(C.mortT||0)){C.mortT=simT+7+Math.random()*5;const L=C.guns.filter(g=>g.k[0]==='n'&&g.man);if(L.length){const g=L[(Math.random()*L.length)|0];ddShell({x:g.x+(Math.random()-.5)*300,y:DCA.treeY-200,side:'E',name:'Mortar',stats:{}},g.x+(Math.random()-.5)*56,g.y+(Math.random()-.5)*56,44,62,2.4);}}
}
// a man lost, and somebody in the reserve: he comes out of the barracks for him
function dcReplace(){
  for(const q of dd.queue.slice()){if(simT<q.at)continue;if(q.body&&players.some(m=>m.raise&&m.raise.t===q.body)){q.at=simT+2;continue;}
    dd.queue.splice(dd.queue.indexOf(q),1);if(q.body)q.body.noRev=true;const rm=ddmTakeReserve();dd.pool=ddmReserveFit().length;if(!rm)continue;
    const sp=openSpot(DCA.door.x,DCA.door.y,players.filter(p=>!p.dead).map(destOf))||DCA.door,u=ddNewMan(q.team,q.id,rm.role,sp.x,sp.y,rm);u.inBoat=false;u.seen=true;players.push(u);players.sort((a,b)=>a.id<b.id?-1:1);buildCards();
    banner(`${u.name} (${DD_ROLES[u.ddRole].n}) comes out of the barracks for ${teamName(q.team)}.`,3200);}
}

/* ---------- the fight's clock ---------- */
function dcTick(dt){
  const C=dd.dc;C.t+=dt;
  ddDeadTick();dd.pool=ddmReserveFit().length;
  dcGunsTick(dt);ddHot();ddTankTick(dt);
  if((dd.aiT-=dt)<=0){dd.aiT=1;ddMedics();}
  if((dd.npcT-=dt)<=0){dd.npcT=.5;dcNpc();dcEnemy();dcReplace();ddHelpers();ddTidy();updateObjUI();}
  const left=n=>enemies.filter(e=>e.tag==='w'+n&&!beaten(e)).length+dd.tanks.filter(K=>K.w===n&&K.hp>0).length;
  if(C.ph==='intro'){if(C.t>4.2&&!C.back){C.back=1;camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:DCA.square.x,z:DCA.square.y-60+DD_CAM.look,zoom:DD_CAM.zoom},t:0,dur:1.6};}
    if(C.t>6){C.ph='setup';C.t=0;banner(`${DCA.setup} seconds. Put your men on the guns: pick a squad, tap a nest, a wall gun or a field gun.`,6000);}}
  else if(C.ph==='setup'){if(C.t>=DCA.setup){C.ph='w1';C.wave=1;C.t=0;dcSpawnWave(1);}}
  else if(C.ph==='lull'){if(C.t>=DCA.lull){C.wave++;C.ph='w'+C.wave;C.t=0;dcSpawnWave(C.wave);}}
  else if(C.t>4&&left(C.wave)===0){
    if(C.wave>=3){if(!dd.won){dd.won=true;endAt=performance.now()+2200;banner('The last of them is down. The base is held.',5000);}}
    else{C.ph='lull';C.t=0;banner(`Wave ${C.wave} broken. ${DCA.lull} seconds: get the wounded up, re-man the guns.`,5000);}}
  // the command post: theirs if they stand in it for 20 s with none of ours there
  const inCp=enemies.filter(e=>!beaten(e)&&dcIn(e,DCA.cpZone)).length+dd.tanks.filter(K=>K.hp>0&&dcIn(K,DCA.cpZone)).length,ours=dd.allies.filter(u=>alive(u)&&dcIn(u,DCA.cpZone)).length;
  C.cpT=inCp&&!ours?C.cpT+dt:Math.max(0,C.cpT-dt*2);C.cpN=inCp;
  if(!endAt&&!dd.won){
    if(C.cpT>=20){dd.over=true;dd.why='cp';endAt=performance.now()+1500;}
    else if(!players.some(alive)&&!dd.queue.length&&players.every(p=>p.dead||p.revive===0)){dd.over=true;dd.why='dead';endAt=performance.now()+1800;}}
}
function dcHint(){
  const C=dd.dc;
  if(C.ph==='intro')return'The column is still a way off. In a moment the men are yours.';
  if(C.ph==='setup')return'Pick a squad and tap a gun to put its nearest man on it. The forward nests see the most and are the most exposed; the wall guns are safer. The other troops take whatever you leave empty.';
  if(C.art)return'Tap where the field gun should shell. Not closer than 17 m.';
  return'Tap a field gun you hold, then where to shell: it is the answer to a tank, with the Demo men\'s bazookas. Left alone it picks its own target. Any move order takes a man off his gun.';
}
function dcDraw(){
  const C=dd.dc,lab=(x,y,h,text,col,sz=9)=>{toSBack=false;const[sx,sy]=toS(x,y,h);if(!toSBack&&sx>-40&&sx<cw+40&&sy>0&&sy<ch)label(text,sx,sy,col,sz,700);};
  for(const g of C.guns){const m=g.man,mine=m&&!m.npc;
    if(g.dead){lab(g.x,g.y,24,`${g.n} · KNOCKED OUT`,'#8b949c');continue;}
    lab(g.x,g.y,g.t==='art'?34:24,m?(g.t==='art'?(simT<g.fireT?`${g.n} · RELOADING ${Math.ceil(g.fireT-simT)}`:mine?(C.art===g?`${g.n} · TAP A TARGET`:`${g.n} · TAP TO AIM`):g.n):mine?`${g.n} · ${m.name.toUpperCase()}`:g.n):(g.going?`${g.n} · ON HIS WAY`:`${g.n} · TAP TO MAN`)+(g.hits?` · HIT ${g.hits}/3`:''),g.hits===2?'#ff8a6a':m?(mine?'#8fd0ff':'#cfd6dc'):'#ffcf4a');}
  if(C.art){const g=C.art;gPath(g.x,g.y,DCA.art.max);ox.strokeStyle='rgba(255,207,74,.5)';ox.lineWidth=1.5;ox.setLineDash([8,6]);ox.stroke();ox.setLineDash([]);}
  for(const K of dd.tanks)if(K.hp>0&&K.y>DCA.treeY-60)lab(K.x,K.y,44,`TANK ${Math.round(K.hp/K.hp0*100)}%`,'#ff8a6a');
  if(C.cpN)lab(DCA.cp.x+60,DCA.cp.y+50,54,C.cpT>1?`COMMAND POST · THEIRS IN ${Math.max(1,Math.ceil(20-C.cpT))}`:'COMMAND POST · THEY ARE IN','#ff5a4a',11);
  // the clock, top centre
  const t=C.ph==='setup'?`THEY ATTACK IN ${Math.max(0,Math.ceil(DCA.setup-C.t))}`:C.ph==='lull'?`WAVE ${C.wave+1} IN ${Math.max(0,Math.ceil(DCA.lull-C.t))}`:C.ph==='intro'?'':`WAVE ${C.wave} OF 3 · ${enemies.filter(e=>e.tag==='w'+C.wave&&!beaten(e)).length} MEN${dd.tanks.some(K=>K.w===C.wave&&K.hp>0)?' · '+dd.tanks.filter(K=>K.w===C.wave&&K.hp>0).length+' TANK'+(dd.tanks.filter(K=>K.w===C.wave&&K.hp>0).length>1?'S':''):''}`;
  if(t)label(t,cw/2,58,C.ph==='setup'||C.ph==='lull'?'#ffcf4a':'#ff8a6a',13,800);
  for(const m of players)if(m.raise&&m.raise.p>0&&alive(m)){const c=m.raise.t,[sx,sy]=toS(c.x,c.y,20);label(`REVIVING ${Math.round(m.raise.p/12*100)}%`,sx,sy,'#5fe08e',10,700);}
}
function dcFinishLost(){
  state='end';setStatus();$('#status').textContent='Lost';
  $('#endEyebrow').textContent='Base lost';$('#endTitle').textContent=dd.why==='cp'?'They took the command post':'The squads are gone';
  $('#endText').textContent=`The counterattack got through in wave ${dd.dc.wave||1}. Your men and your reserve are as they were when you left the barracks: try it again. Field guns and bazookas for the tanks, machine guns for the men in the open.`;
  {const q=$('#sq');if(q)q.hidden=true;}$('#againBtn').textContent='Try the counterattack again';$('#retryBtn').hidden=true;$('#end').hidden=false;
}
