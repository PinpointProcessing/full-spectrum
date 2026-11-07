"use strict";
/* The tunnel (Bryan, after v96: "The tunnel could be it's own map. When approaching it it changes to it"): its own map
   (MAPID 'tun'), swapped in like the Headquarters (the big map waits in STASH.out). When everyone who's up has walked into
   the mouth at the end of the road east, the big map fades out and the tunnel comes in by itself, no tap (road.js's
   roadGather and its auto zones); walk back to its south end and it goes back out the same way.
   A two-lane road tunnel running north under the hill, about 125 m: walkways along both walls, the walls cut away low like
   the office building's so the floor reads from above. Pitch black (Bryan, after v96: "The tunnel is pitch black... Inside
   the tunnel will have other broken down cars and dead bodies hanging outside the car and on the road. Blood is pools around
   the bodies and trails can be seen"): every wall light dead but one sputtering, the red emergency lights by the
   cross-passage doors, the squad's torches. The coach from outside across the left lane at the way in, the old checkpoint's
   barrier arm, a car slewed across the west lane and a lorry in the east one, more cars left where they stopped, a jet fan
   fallen from the roof, a collapse that leaves one way through on the east side; the dead hanging out of the cars and lying
   in the road, blood pooled round them and dragged off in trails (TUN_DEAD, tunDead; the pools and trails painted on its
   floor, paintTunnel). At the north end the portal opens on the night: the old radio tower's mission, the next one, isn't
   built yet, and the gather area there says so (tunnelEnd). */
const TUNB={x0:560,x1:880,y0:-440,y1:900};   // the map's frame (its ground canvas)
const TW={x0:655,x1:785,walk:12,len:{n:-380,s:880},h:18};   // the inside: wall faces at x0 and x1, walkways walk wide along both, from the north portal (n) to the south one (s); the walls cut away at h
const TUN_IN={x0:702,y0:800,x1:778,y1:878};   // the south end: walk into it to go back out (beside the coach)
const TUN_END={x0:662,y0:-376,x1:778,y1:-300};   // the north end: the way on
const TUN_START=[[690,760],[720,760],[750,760],[705,738],[735,738],[690,716],[720,716],[750,716]];
const TUN_LAMPS=[   // all that's left of the light (dead fixtures line the walls: buildTunnel): pitch black but for these and the squad's torches
  {x:660,y:560,h:12,c:0xff3020,i:.8,d:100},   // red, by the west cross-passage door
  {x:660,y:440,h:14,c:0xffb060,i:.55,d:110,flick:1},   // one tube still sputtering
  {x:780,y:-250,h:12,c:0xff3020,i:.7,d:100,flick:1},   // red, by the east cross-passage door
  {x:720,y:-400,h:34,c:0x8fa4d8,i:1.0,d:200},   // the night beyond the north portal
  {x:720,y:896,h:30,c:0x8fa4d8,i:.6,d:130},    // and behind them, the way they came in
  {x:700,y:486,h:3,c:0xff3414,i:1.5,d:120,flick:1,flare:1},{x:752,y:572,h:3,c:0xff3414,i:1.3,d:110,flick:1,flare:1},{x:708,y:-80,h:3,c:0xff3414,i:1.4,d:120,flick:1,flare:1}];   // road flares someone lit by the wrecks, still burning
// the dead: [x, y, facing, clothes, how: 'out' half out of a car's door (legs still in), 'road' in the road]; and where blood was dragged
const TUN_DEAD=[[704,428,-1.9,'#3c4a5a','out'],[722,598,2.8,'#6a4a3a','road'],[667,586,3.14,'#4a5a3a','road'],[712,318,1.4,'#5a3a4a','road'],[738,150,-.6,'#2e3a44','road'],
  [732,-150,-2.6,'#7a6a52','out'],[714,-30,-1.57,'#4b4b4b','road'],[706,834,-.4,'#5a5040','out']];
const TUN_TRAILS=[[[712,452],[690,500],[668,560],[663,578]],[[725,610],[748,650],[770,668]],[[714,-20],[716,-120],[722,-230],[728,-300],[730,-360]],[[712,846],[722,790],[730,700],[724,640]]];
let TUN=null;   // the map while it's built: {objs, lamps, scene, lights, tex, rtex}

function tunObjects(){
  const o=[],O=(kind,x,y,w,h,ex)=>o.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind)},ex||{}));
  O('void',TUNB.x0,TUNB.y0,TW.x0-10-TUNB.x0,TUNB.y1-TUNB.y0);O('void',TW.x1+10,TUNB.y0,TUNB.x1-TW.x1-10,TUNB.y1-TUNB.y0);   // rock beyond the walls
  O('void',TW.x0-10,TUNB.y0,TW.x1-TW.x0+20,TW.len.n-12-TUNB.y0);   // past the north portal: the way on (the next mission)
  O('void',TW.x0-10,TW.len.s+10,TW.x1-TW.x0+20,TUNB.y1-TW.len.s-10);   // past the south portal: back out (tunnel's own gather area first)
  O('twall',TW.x0-10,TW.len.n-12,10,TW.len.s-TW.len.n+22,{full:true});O('twall',TW.x1,TW.len.n-12,10,TW.len.s-TW.len.n+22,{full:true});
  O('barrier',667,716,52,6);   // the old checkpoint's barrier arm, down across the west lane
  O('barrel',657,596,12,12);O('crate',773,520,12,14);   // by the west door, and a toolbox left on the east walkway
  O('car',672,440,42,20);   // a car slewed across the west lane
  O('bus',667,812,28,110);   // the coach from outside, across the left lane at the way in
  O('car',732,604,22,44,{col:0x4f5d6a,door:-1});O('car',744,-176,22,42,{col:0x6e2a24,door:-1});O('car',668,-230,24,44,{col:0x8a8a84,door:1});   // more left where they stopped, doors open
  O('truck',724,288,46,90,{col:'#4a4237'});   // a lorry left in the east lane, its cab north
  O('fan',690,190,54,18);   // a jet fan down from the roof
  O('rubble',655,58,62,54,{full:true});   // the collapse: a heap of the roof against the west wall,
  for(const[x,y,w,h]of[[704,40,16,14],[716,96,18,16],[722,128,14,12],[666,122,20,16],[690,30,12,10],[730,64,12,12]])O('rock',x,y,w,h);   // and its broken slabs out across the road (the way through is on the east side)
  return o;
}
// the floor: walkways of concrete slabs either side, the road between (worn lines, oil, puddles), grit round the collapse,
// the wet night outside each portal
function paintTunnel(g,q,S){
  const X0=TUNB.x0,Y0=TUNB.y0,w=TUNB.x1-TUNB.x0,h=TUNB.y1-TUNB.y0,r=rng(7070),n=TW.len.n,s=TW.len.s;
  g.setTransform(S,0,0,S,-X0*S,-Y0*S);q.setTransform(1,0,0,1,-X0,-Y0);
  g.fillStyle='#050607';g.fillRect(X0,Y0,w,h);q.fillStyle='rgb(200,200,200)';q.fillRect(X0,Y0,w,h);
  for(const[y0,y1]of[[Y0,n],[s,TUNB.y1]]){g.fillStyle='#1d242b';g.fillRect(TW.x0-30,y0,TW.x1-TW.x0+60,y1-y0);q.fillStyle='rgb(70,70,70)';q.fillRect(TW.x0-30,y0,TW.x1-TW.x0+60,y1-y0);   // outside: wet ground
    for(let i=0;i<500;i++){g.fillStyle=r()<.5?'rgba(160,190,220,.05)':'rgba(0,0,0,.3)';g.fillRect(TW.x0-30+r()*(TW.x1-TW.x0+60),y0+r()*(y1-y0),1.5,1.5);}}
  const wk=TW.walk,rx0=TW.x0+wk,rx1=TW.x1-wk;
  g.fillStyle='#45484a';g.fillRect(TW.x0,n,wk,s-n);g.fillRect(rx1,n,wk,s-n);q.fillStyle='rgb(170,170,170)';q.fillRect(TW.x0,n,wk,s-n);q.fillRect(rx1,n,wk,s-n);
  g.strokeStyle='rgba(0,0,0,.35)';g.lineWidth=1;for(let y=n;y<s;y+=24){for(const x of[TW.x0,rx1]){g.beginPath();g.moveTo(x,y);g.lineTo(x+wk,y);g.stroke();}}
  g.fillStyle='#232527';g.fillRect(rx0,n,rx1-rx0,s-n);q.fillStyle='rgb(120,120,120)';q.fillRect(rx0,n,rx1-rx0,s-n);
  for(let i=0;i<5200;i++){g.fillStyle=r()<.5?'rgba(255,255,255,.04)':'rgba(0,0,0,.22)';g.fillRect(rx0+r()*(rx1-rx0),n+r()*(s-n),r()*1.4+.3,r()*1.4+.3);}
  g.fillStyle='rgba(205,200,180,.55)';g.fillRect(rx0-1.5,n,1.5,s-n);g.fillRect(rx1,n,1.5,s-n);   // the kerbs
  g.fillStyle='rgba(0,0,0,.6)';g.fillRect(rx0,n,2,s-n);g.fillRect(rx1-2,n,2,s-n);   // the gutters
  g.strokeStyle='rgba(225,228,230,.55)';g.lineWidth=2;g.setLineDash([60,4,30,6]);for(const x of[rx0+5,rx1-5]){g.beginPath();g.moveTo(x,n);g.lineTo(x,s);g.stroke();}
  g.setLineDash([22,18]);g.strokeStyle='rgba(225,228,230,.5)';g.lineWidth=2.2;g.beginPath();g.moveTo((rx0+rx1)/2,n);g.lineTo((rx0+rx1)/2,s);g.stroke();g.setLineDash([]);
  g.strokeStyle='rgba(0,0,0,.22)';g.lineWidth=3;for(const x of[rx0+16,rx0+34,rx1-34,rx1-16]){g.beginPath();g.moveTo(x,n);g.lineTo(x,s);g.stroke();}   // tyre marks
  for(let i=0;i<18;i++){const x=rx0+8+r()*(rx1-rx0-16),y=n+20+r()*(s-n-40),a=r()*Math.PI;if(r()<.55){puddle(g,'col',x,y,6+r()*20,4+r()*8,a);puddle(q,'rough',x,y,6+r()*20,4+r()*8,a);}
    else{const gr=g.createRadialGradient(x,y,0,x,y,6+r()*10);gr.addColorStop(0,'rgba(0,0,0,.45)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(x-16,y-16,32,32);}}   // water, and oil
  for(let i=0;i<1400;i++){const x=TW.x0+r()*(TW.x1-TW.x0),y=10+r()*150;g.fillStyle=r()<.6?'rgba(170,165,150,.18)':'rgba(30,28,26,.4)';const sz=.6+r()*2.4;g.fillRect(x,y,sz,sz*.8);}   // grit and chips round the collapse
  g.fillStyle='rgba(0,0,0,.34)';for(const o of TUN.objs)if(['barrier','barrel','crate','car','truck','fan','rock','bus'].includes(o.kind))g.fillRect(o.x-3,o.y-3,o.w+6,o.h+6);
  TUN_TRAILS.forEach((t,i)=>bloodTrail(g,q,t,300+i));TUN_DEAD.forEach(([x,y,a,,how],i)=>bloodPool(g,q,x-Math.cos(a)*(how==='out'?2:6),y-Math.sin(a)*(how==='out'?2:6),10+(i%3)*3,700+i));
}
// blood: a pool, several overlapping blots with spatter round them; a trail where someone was dragged, smeared along its way
function bloodPool(g,q,x,y,R,seed){
  const r=rng(seed);
  for(let k=0;k<7;k++){const a=r()*6.28,d=r()*R*.5,rx=R*(.35+r()*.45),ry=rx*(.5+r()*.5),cx=x+Math.cos(a)*d,cy=y+Math.sin(a)*d,rot=r()*3;
    g.fillStyle=`rgba(${(105+r()*35)|0},${(6+r()*8)|0},${(5+r()*6)|0},${(.8+r()*.18).toFixed(2)})`;g.beginPath();g.ellipse(cx,cy,rx,ry,rot,0,7);g.fill();
    q.fillStyle='rgb(26,26,26)';q.beginPath();q.ellipse(cx,cy,rx,ry,rot,0,7);q.fill();}
  for(let k=0;k<16;k++){const a=r()*6.28,d=R*(.6+r()*.9),z=.5+r()*1.6;g.fillStyle='rgba(118,8,6,.8)';g.beginPath();g.arc(x+Math.cos(a)*d,y+Math.sin(a)*d,z,0,7);g.fill();}
}
function bloodTrail(g,q,pts,seed){
  const r=rng(seed);g.save();g.lineCap='round';g.lineJoin='round';
  for(let k=0;k<3;k++){g.strokeStyle=`rgba(${98+k*14},6,4,${(.55-k*.12).toFixed(2)})`;g.lineWidth=7-k*2;g.beginPath();g.moveTo(...pts[0]);for(const p of pts.slice(1))g.lineTo(p[0]+(r()-.5)*4,p[1]+(r()-.5)*3);g.stroke();}
  for(let i=0;i<pts.length-1;i++){const a=pts[i],b=pts[i+1],n=Math.round(Math.hypot(b[0]-a[0],b[1]-a[1])/7);for(let k=0;k<n;k++){const t=k/n,x=a[0]+(b[0]-a[0])*t+(r()-.5)*7,y=a[1]+(b[1]-a[1])*t+(r()-.5)*7;g.fillStyle='rgba(112,8,6,.55)';g.fillRect(x-1.5,y-1,3+r()*2.5,2);}}   // the smears
  g.restore();q.save();q.strokeStyle='rgb(50,50,50)';q.lineWidth=6;q.lineCap='round';q.beginPath();q.moveTo(...pts[0]);for(const p of pts.slice(1))q.lineTo(...p);q.stroke();q.restore();
}
// a car left where it stopped: faded paint, dark glass, the driver's door hanging open (o.door: -1 its west side, 1 its east)
function carMesh(sc,o){
  const g=new T.Group();g.position.set(o.x+o.w/2,0,o.y+o.h/2);sc.add(g);const L=o.h,Wd=o.w;
  const paint=new T.MeshStandardMaterial({color:o.col,roughness:.55,metalness:.45}),glass=new T.MeshStandardMaterial({color:0x0e1418,roughness:.1,metalness:.8}),tyre=new T.MeshStandardMaterial({color:0x111214,roughness:.9});
  const B=(w,h,d,m,x,y,z)=>{const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);b.castShadow=b.receiveShadow=true;g.add(b);return b;};
  B(Wd,6,L,paint,0,5,0);B(Wd-2,5,L*.5,glass,0,10.5,-L*.04);B(Wd-2.6,.8,L*.48,paint,0,13.2,-L*.04);
  for(const sx of[-1,1])for(const sz of[-1,1]){const t=new T.Mesh(new T.CylinderGeometry(3,3,2.2,10),tyre);t.rotation.z=Math.PI/2;t.position.set(sx*(Wd/2-1),3,sz*(L/2-7));g.add(t);}
  if(o.door){const d=new T.Group();d.position.set(o.door*Wd/2,0,-L*.14);d.rotation.y=o.door*.95;g.add(d);const p=new T.Mesh(new T.BoxGeometry(.7,8,11),paint);p.position.set(0,7.5,5.5);p.castShadow=true;d.add(p);}
}
// the dead (TUN_DEAD): people posed once where they fell and left (no units: nobody moves them); one half out of a car has his legs inside it
function tunDead(sc){
  TUN.dead=[];const keep=scene;scene=sc;
  try{TUN_DEAD.forEach(([x,y,a,cloth,how],i)=>{
    const u={side:'C',team:'C',kind:'prisoner',id:'D'+i,name:'The dead '+i,x,y,ang:a,path:[],dead:true,hp:0,cloth};makeFigure(u);
    const m=u.m;m.ring.visible=false;m.g.position.set(x,how==='out'?1.2:0,y);m.g.rotation.y=-a;figAnimate(u,m);if(how==='out')m.pose.rotation.z=.16;
    TUN.dead.push(u);});}finally{scene=keep;}
}
function disposeTunnel(){
  if(!TUN||!TUN.scene)return;
  TUN.scene.traverse(o=>{if(o.geometry&&!o.geometry.userData.keep)o.geometry.dispose();});
  if(TUN.tex)TUN.tex.dispose();if(TUN.rtex)TUN.rtex.dispose();TUN=null;
}
function buildTunnel(){
  disposeTunnel();
  TUN={objs:tunObjects(),lamps:TUN_LAMPS.map(l=>Object.assign({},l)),scene:null,lights:null,tex:null,rtex:null};
  const sc=new T.Scene();sc.background=new T.Color(0x030405);sc.fog=new T.FogExp2(0x030405,0.0007);TUN.scene=sc;
  const S=1.5,gw=TUNB.x1-TUNB.x0,gh=TUNB.y1-TUNB.y0,gc=document.createElement('canvas'),rc=document.createElement('canvas');
  gc.width=Math.round(gw*S);gc.height=Math.round(gh*S);rc.width=gw;rc.height=gh;paintTunnel(gc.getContext('2d'),rc.getContext('2d'),S);
  TUN.tex=new T.CanvasTexture(gc);TUN.tex.encoding=T.sRGBEncoding;TUN.tex.anisotropy=4;TUN.rtex=new T.CanvasTexture(rc);
  const keep=scene;scene=sc;
  try{
    const ground=new T.Mesh(new T.PlaneGeometry(gw,gh),wetGround(new T.MeshStandardMaterial({map:TUN.tex,roughnessMap:TUN.rtex,roughness:1,metalness:.16}),gw,gh));
    ground.rotation.x=-Math.PI/2;ground.position.set((TUNB.x0+TUNB.x1)/2,0,(TUNB.y0+TUNB.y1)/2);ground.receiveShadow=true;sc.add(ground);
    meshObjs(TUN.objs.filter(o=>['barrier','barrel','crate','car','truck'].includes(o.kind)&&!o.col));
    for(const o of TUN.objs)if(o.kind==='car'&&o.col)carMesh(sc,o);
    {const o=TUN.objs.find(q=>q.kind==='bus');if(o)busMesh(sc,o);}   // (road.js: the same coach as outside)
    tunDead(sc);
    // the flares: a red stick on the road, its tip burning (bloom), a wisp of smoke
    {const stick=new T.MeshStandardMaterial({color:0x8a1c12,roughness:.6}),tip=new T.MeshBasicMaterial({color:0xff5030,toneMapped:false}),smoke=new T.MeshBasicMaterial({color:0x6a3a34,transparent:true,opacity:.18,depthWrite:false});
     for(const L of TUN.lamps)if(L.flare){const g=new T.Group();g.position.set(L.x,.6,L.y);g.rotation.y=L.x*.37;sc.add(g);const b=new T.Mesh(new T.CylinderGeometry(.45,.45,6,8),stick);b.rotation.z=Math.PI/2;g.add(b);
       const t=new T.Mesh(new T.SphereGeometry(.9,8,6),tip);t.position.x=3.2;g.add(t);const sm=new T.Mesh(new T.SphereGeometry(4,8,6),smoke);sm.position.set(4,5,0);sm.scale.set(1,1.6,1);g.add(sm);}}
    // the walls: grimy tiles below, bare concrete above, cut away at TW.h with a pale cap (the office building's look)
    const tile=canvasTex(128,64,(x,w,h)=>{x.fillStyle='#6f6c63';x.fillRect(0,0,w,h);x.fillStyle='#a7a395';x.fillRect(0,h*.28,w,h*.72);
      x.strokeStyle='rgba(40,38,34,.55)';x.lineWidth=1;for(let i=0;i<=w;i+=8){x.beginPath();x.moveTo(i+.5,h*.28);x.lineTo(i+.5,h);x.stroke();}for(let j=h*.28;j<=h;j+=8){x.beginPath();x.moveTo(0,j+.5);x.lineTo(w,j+.5);x.stroke();}
      const gr=x.createLinearGradient(0,h*.55,0,h);gr.addColorStop(0,'rgba(20,18,15,0)');gr.addColorStop(1,'rgba(20,18,15,.75)');x.fillStyle=gr;x.fillRect(0,0,w,h);   // road grime up from the floor
      const rr=rng(31);for(let k=0;k<7;k++){const sx=rr()*w,sw=2+rr()*5;x.fillStyle='rgba(25,22,18,.25)';x.fillRect(sx,0,sw,h*(.4+rr()*.6));}});   // water streaks
    const capM=new T.MeshStandardMaterial({color:0x9a9d9e,roughness:.9});
    for(const o of TUN.objs)if(o.kind==='twall'){const L=o.h,tm=texMat(tile,L/64,1,{roughness:.85});meshOwner=o;o.meshes=null;
      addMesh(new T.BoxGeometry(o.w,TW.h,L),tm,o.x+o.w/2,TW.h/2,o.y+L/2);addMesh(new T.BoxGeometry(o.w+1,1.2,L),capM,o.x+o.w/2,TW.h+.6,o.y+L/2);meshOwner=null;}
    // the wall lights: a fixture every 60 along both walls, dark but for the ones still working (TUN_LAMPS)
    const dead=new T.MeshStandardMaterial({color:0x2a2c2e,roughness:.5,metalness:.4});
    for(let y=TW.len.n+30;y<TW.len.s-10;y+=60)for(const x of[TW.x0+.8,TW.x1-.8]){if(TUN.lamps.some(L=>Math.abs(L.y-y)<30&&Math.abs(L.x-x)<10))continue;const m=new T.Mesh(new T.BoxGeometry(1.2,2,6),dead);m.position.set(x,14,y);sc.add(m);}
    for(const L of TUN.lamps){if(L.h>20||L.flare)continue;const m=new T.Mesh(new T.BoxGeometry(1.2,2,6),new T.MeshBasicMaterial({color:L.c,toneMapped:false}));m.position.set(L.x<720?TW.x0+.8:TW.x1-.8,L.h,L.y);sc.add(m);L.head=m;}
    // studs along both kerbs, glowing faintly (amber on the west, white on the east): the way through, outlined in the dark
    {const pts=[];for(let y=TW.len.n+12;y<TW.len.s-6;y+=24)for(const x of[TW.x0+TW.walk-3,TW.x1-TW.walk+3])pts.push([x,y,x<720]);
     const geo=new T.BoxGeometry(1.6,.8,1.6),mk=(col,list)=>{const m=new T.InstancedMesh(geo,new T.MeshBasicMaterial({color:col,toneMapped:false}),list.length),q=new T.Object3D();list.forEach(([x,y],i)=>{q.position.set(x,.5,y);q.updateMatrix();m.setMatrixAt(i,q.matrix);});sc.add(m);};
     mk(0x3c2a10,pts.filter(p=>p[2]));mk(0x2a3038,pts.filter(p=>!p[2]));}   // (barely there: pitch black)
    // the cross-passage doors: steel, a green sign over each
    const steel=new T.MeshStandardMaterial({color:0x56606a,roughness:.5,metalness:.6}),green=new T.MeshBasicMaterial({color:0x2fe07a,toneMapped:false});
    for(const[x,y,s]of[[TW.x0,575,1],[TW.x1,-235,-1]]){const d=new T.Mesh(new T.BoxGeometry(1,14,16),steel);d.position.set(x+s*.6,7,y);sc.add(d);const sg=new T.Mesh(new T.BoxGeometry(.8,2.4,7),green);sg.position.set(x+s*.6,16,y);sc.add(sg);}
    { const ph=new T.Mesh(new T.BoxGeometry(1.4,5,4),new T.MeshStandardMaterial({color:0xd8661c,roughness:.6}));ph.position.set(TW.x1-.8,9,600);sc.add(ph);}   // an emergency phone
    // the jet fan down on the road: a drum with its brackets torn off
    {const o=TUN.objs.find(q=>q.kind==='fan'),fm=new T.MeshStandardMaterial({color:0x6d7377,roughness:.45,metalness:.7}),fd=new T.MeshStandardMaterial({color:0x1b1d1f,roughness:.8});
     meshOwner=o;o.meshes=null;const d=addMesh(new T.CylinderGeometry(9,9,o.w-6,18,1,true),fm,o.x+o.w/2,9,o.y+o.h/2);d.rotation.z=Math.PI/2;d.material.side=T.DoubleSide;
     for(const sx of[-1,1]){const c=addMesh(new T.CircleGeometry(8.6,18),fd,o.x+o.w/2+sx*(o.w/2-3.2),9,o.y+o.h/2);c.rotation.y=sx*Math.PI/2;}
     const b=addMesh(new T.BoxGeometry(4,2,20),fm,o.x+o.w/2-14,18.5,o.y+o.h/2);b.rotation.z=.4;meshOwner=null;}
    // the collapse, and the rock beyond each portal: rough slabs (road.js's rockMesh), rebar out of the heap
    const rub=TUN.objs.find(q=>q.kind==='rubble'),rr=rng(515),L=[];
    for(let k=0;k<9;k++){const sy=8+rr()*14;L.push([rub.x+8+rr()*(rub.w-16),rub.y+8+rr()*(rub.h-16),10+rr()*12,sy,9+rr()*10,rr()*6,(rr()*1e4)|0,sy*.35]);}
    for(const o of TUN.objs)if(o.kind==='rock'){const sy=5+rr()*3;L.push([o.x+o.w/2,o.y+o.h/2,o.w*.6,sy,o.h*.6,rr()*6,(rr()*1e4)|0,sy*.4]);}
    sc.add(rockMesh(L,[.09,.03,.26]));
    const rebar=new T.MeshStandardMaterial({color:0x5a3a28,roughness:.7,metalness:.5});
    for(let k=0;k<7;k++){const m=new T.Mesh(new T.CylinderGeometry(.35,.35,10+rr()*8,5),rebar);m.position.set(rub.x+10+rr()*(rub.w-20),10+rr()*6,rub.y+10+rr()*(rub.h-20));m.rotation.set(rr()*1.2-.6,0,rr()*1.4-.7);sc.add(m);}
    const out=[];for(const[y0,y1,dir]of[[TUNB.y0,TW.len.n-14,-1],[TW.len.s+14,TUNB.y1,1]])for(let x=TW.x0-60;x<=TW.x1+60;x+=26){
      if(x>TW.x0-6&&x<TW.x1+6)continue;const sy=18+rr()*26;out.push([x+(rr()-.5)*10,(dir<0?y1:y0)+dir*(10+rr()*20),18+rr()*10,sy,16+rr()*10,rr()*6,(rr()*1e4)|0,sy*.3]);}
    sc.add(rockMesh(out));
    // the north portal from inside: a headwall round the way out, the night beyond it
    {const conc=new T.MeshStandardMaterial({color:0x5d605f,roughness:.93}),hw=(TW.x1-TW.x0)/2+30,ow=(TW.x1-TW.x0)/2-2,Hh=46,top=24,arch=16,sh=new T.Shape();
     sh.moveTo(-hw,0);sh.lineTo(-ow,0);sh.lineTo(-ow,top);sh.absellipse(0,top,ow,arch,Math.PI,0,true);sh.lineTo(ow,0);sh.lineTo(hw,0);sh.lineTo(hw,Hh);sh.lineTo(-hw,Hh);sh.lineTo(-hw,0);
     const wall=new T.Mesh(new T.ExtrudeGeometry(sh,{depth:10,bevelEnabled:false,curveSegments:18}),conc);wall.position.set((TW.x0+TW.x1)/2,0,TW.len.n-22);sc.add(wall);}
    const hemi=new T.HemisphereLight(0x7d8a9a,0x1a1612,.05);hemi.userData.base=.05;sc.add(hemi);   // pitch black (Bryan): the torches, a sputtering tube and the red emergency lights
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,280,1.6);sc.add(bl);
    TUN.lights={hemi,moon:null,lampPool:pool,muzzle:mz,boomL:bl};
  }finally{scene=keep;meshOwner=null;}
}
const tunCam=()=>{VB={x0:TW.x0-30,z0:TW.len.n-40,x1:TW.x1+30,z1:TW.len.s+20};FIT.w=TW.x1-TW.x0+80;FIT.h=TW.len.s-TW.len.n+60;fitDist();};
const tunReset=p=>Object.assign(p,{path:[],peek:null,tk:null,plant:null,supT:null,focus:null,elev:0,vaultK:0,crawl:false,lx:0,ly:0,offMap:false,throwGo:null,medGo:null,work:null,away:false,ret:null});
// in: from the mouth at the end of the road east (road.js, when everyone who's up has walked into it)
function enterTunnel(){
  if(MAPID!=='out'||fading)return;
  fadeThen(()=>{
    buildTunnel();stashOut(players);
    useMap({objs:TUN.objs,hq:[],slow:[],lamps:TUN.lamps,scene:TUN.scene,lights:TUN.lights});
    tankFires=[];rockets=[];charges=[];
    for(const p of players){moveMesh(p,TUN.scene);tunReset(p);}
    players.filter(p=>!p.dead&&!p.gone&&!p.carriedBy).forEach((p,i)=>{const s=TUN_START[i]||TUN_START[0];p.x=s[0];p.y=s[1];p.ang=-Math.PI/2;});
    units=[...players];MAPID='tun';enemies=[];civs=[];
    contact=false;clearTeams();sel=[];cardGroup=[];preview=null;mode=null;
    tunCam();zoom=2.3;yaw=0;tilt=0;camT={x:(TW.x0+TW.x1)/2,z:680};camPan=null;clampCam();updateCamera();
    updateObjUI();setStatus();buildCards();hud();
  });
}
// out: back to the mouth on the big map, just short of its gather area
function tunnelOut(){
  const out=STASH.out;if(!out)return;
  for(const u of units)if(u.side!=='P'&&u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap(out);({tankFires,rockets,charges}=out.fx);MAPID='out';
  for(const p of players){moveMesh(p,out.scene);tunReset(p);}
  const taken=[];players.filter(p=>!p.dead&&!p.gone&&!p.carriedBy).forEach((p,i)=>{const k=i?(i%2?1:-1)*Math.ceil(i/2):0,t=openSpot((TUN_ZONE.x0+TUN_ZONE.x1)/2+k*20,TUN_ZONE.y1+18+(i>4?20:0),taken)||{x:1723,y:-350};taken.push(t);p.x=t.x;p.y=t.y;p.ang=Math.PI/2;});
  units=[...out.units,...players.filter(p=>!out.units.includes(p))];enemies=units.filter(u=>u.side==='E');civs=units.filter(u=>u.side==='C');
  VB={...out.vb};FIT.w=out.fit.w;FIT.h=out.fit.h;fitDist();disposeTunnel();
}
function leaveTunnel(){
  if(MAPID!=='tun'||fading)return;
  fadeThen(()=>{tunnelOut();contact=false;clearTeams();sel=[];cardGroup=[];preview=null;mode=null;
    zoom=2.2;yaw=0;tilt=0;camT={x:1700,z:-380};camPan=null;clampCam();updateCamera();updateObjUI();setStatus();buildCards();hud();});
}
function leaveTunnelNow(){if(MAPID==='tun')tunnelOut();}   // (a Retry, a New game: state.js's reset)
// the far end: the old radio tower is the next mission, not built yet
function tunnelEnd(){banner('The old radio tower is through here: the next mission. It isn\'t built yet: coming next.',4200);}
function tunHint(){return'The tunnel runs north under the hill, pitch black: only your torches. At its far end: the old radio tower, the next mission (coming next). Walk back to the south end to go out.';}
