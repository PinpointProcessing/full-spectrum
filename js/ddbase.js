"use strict";
/* D-Day: their first military base, east of the top (Version 148). Bryan, after Version 147: "Instead of ending the battle. What about adding
   a full military [base] after the tank? The path can continue down that road ... Two more tanks, and 30 more soldiers at the base", and on the
   draft (docs/drafts/dday-base-draft.png): "One hard front but keep the other options and secondary optional entries. The enemy will be still
   sending troops to attack. There is no sneaking in this match"; "Barracks keeps sending men out"; no more replacements for it; "Ammo drop at
   the captured barracks".

   The battle no longer ends at the barracks on the hill: held, it becomes an ammo drop (ddBaseOpen) and the road runs on east along the top to
   the base (map coordinates x 1300-1790, y -752 to -462: past the old play area's east edge, where the ground is now flat and real, dday.js's
   ddBuildH). An earth bank and trench across the west face with the gate in the middle (the hard front), wire at both ends of that face and a
   gap in the south wire by the south-west corner (the other ways in); two barracks that keep sending men, mortars, a fuel dump that goes up, the motor pool, an
   anti-aircraft gun, and the command post at the east end: hold it to win. 30 men and two tanks (one dug in behind the gate, one that rolls
   out of the motor pool). They're posted when the counterattack starts (ddBaseGarrison from ddplay.js's ddCounter).
   The draft's sunken lane round the north isn't here: the map ends at the base's north fence. */
const DB={x0:1300,x1:1790,y0:-752,y1:-462,road:-600,
  cp:{x:1700,y:-644,w:84,h:88,door:{x:1686,y:-600}},
  bA:{x:1380,y:-746,w:120,h:44,door:{x:1440,y:-690}},bB:{x:1530,y:-746,w:120,h:44,door:{x:1590,y:-690}},
  pool:{x:1420,y:-506,w:150,h:40},ammo:{x:1600,y:-506,w:56,h:40},fuel:{x:1730,y:-744,w:50,h:40},
  pit:{x:1404,y:-545},t2:{x:1466,y:-540},towers:[{x:1322,y:-740},{x:1322,y:-474}],
  east:[[1010,-600],[1140,-592],[1250,-600],[1368,-612],[1480,-600],[1600,-600],[1660,-600]]};
function ddBaseObjects(){
  const L=[],o=(kind,x,y,w,h,ex)=>L.push(Object.assign({kind,x,y,w,h,full:false,base:1},ex||{}));
  // nothing to walk on east of the old map but the top
  o('drop',1400,-456,400,1356);   // (the ground drawn out there is the battle next door's, a mirror image: nobody walks on it)
  // the west face: bank, gate gap (y -634 to -566), wire at both ends
  o('ddbank',1300,-700,12,66,{cover:2});o('ddbank',1300,-566,12,54,{cover:2});
  o('ddwire',1300,-752,8,52,{hp:40,tag:'wire',v:1});o('ddwire',1300,-512,8,50,{hp:40,tag:'wire',v:1});
  // the south wire with its back gate (x 1540-1580), the north and east wire
  o('ddwire',1312,-462,38,8,{hp:40,tag:'wire'});for(let x=1400;x<1790;x+=50)o('ddwire',x,-462,Math.min(50,1790-x),8,{hp:40,tag:'wire'});   // (the back gate: the gap at x 1350-1400)
  for(let x=1312;x<1790;x+=50)o('ddwire',x,-758,Math.min(50,1790-x),6,{hp:40,tag:'wire'});
  o('ddwire',1790,-752,8,290,{hp:400,tag:'wire',v:1});
  // the checkpoint in front of the gate
  o('sandbag',1240,-670,10,38);o('sandbag',1240,-568,10,38);
  // cover on the way up to it
  for(const[x,y]of[[1196,-650],[1210,-545],[1160,-600],[1130,-690],[1150,-500],[1225,-720],[1232,-486]])o('ddbould',x,y,18,15,{cover:1});
  // the dug-in tank's pit
  o('sandbag',1366,-570,10,50);o('sandbag',1376,-516,52,10);
  // the two barracks
  o('ddbarr',DB.bA.x,DB.bA.y,DB.bA.w,DB.bA.h,{full:true,hp:380,tag:'bA'});o('ddbarr',DB.bB.x,DB.bB.y,DB.bB.w,DB.bB.h,{full:true,hp:380,tag:'bB'});
  // mortar pits, the fuel dump
  o('sandbag',1662,-744,10,34);o('sandbag',1692,-712,10,34);
  o('ddfuel',DB.fuel.x,DB.fuel.y,DB.fuel.w,DB.fuel.h,{hp:50,tag:'fuel',cover:1});
  // the motor pool, its lorries, the ammo store, the anti-aircraft gun
  o('ddbld',DB.pool.x,DB.pool.y,DB.pool.w,DB.pool.h,{full:true,look:'shed'});o('ddtruck',1528,-566,26,56,{full:true});o('ddtruck',1562,-566,26,56,{full:true});
  o('ddbld',DB.ammo.x,DB.ammo.y,DB.ammo.w,DB.ammo.h,{full:true,look:'store'});
  o('ddgun',1690,-512,24,22,{cover:1,hp:200,tag:'aa'});
  // the command post, a sandbag line in front of its door
  o('ddbld',DB.cp.x,DB.cp.y,DB.cp.w,DB.cp.h,{full:true,look:'cp'});o('sandbag',1640,-642,10,32);o('sandbag',1640,-590,10,32);
  // crates about the yard
  for(const[x,y]of[[1396,-650],[1450,-606],[1500,-668],[1560,-560],[1612,-650],[1600,-585],[1350,-690],[1348,-500]])o('ddcrate',x,y,22,20,{cover:1});
  return L;
}
/* ---------- its look (after dday.js's props and their mirror images) ---------- */
function ddBaseBuild(sc){
  const T=THREE,B=new T.Group();DD.baseG=B;sc.add(B);
  const M=(c,r=.9,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m});
  const add=(geo,mat,x,y,z,ry)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;m.castShadow=true;m.receiveShadow=true;B.add(m);return m;};
  const H=152;
  // the ground: the road from the barracks, the yard, the parade ground (laid just over the land)
  {const X0=1000,Y0=-762,W=800,D=440,S=2,c=document.createElement('canvas');c.width=W*S;c.height=D*S;const q=c.getContext('2d'),r=rng(1948);q.setTransform(S,0,0,S,-X0*S,-Y0*S);
    q.fillStyle='#a69c7e';q.fillRect(DB.x0+4,DB.y0,DB.x1-DB.x0-4,DB.y1-DB.y0);
    for(let i=0;i<2600;i++){q.fillStyle=`rgba(${r()<.5?'70,64,48':'214,204,172'},${.05+r()*.1})`;q.fillRect(DB.x0+r()*(DB.x1-DB.x0),DB.y0+r()*(DB.y1-DB.y0),2+r()*5,2+r()*4);}
    {const g=q.createLinearGradient(1010,0,1110,0);g.addColorStop(0,'rgba(180,164,124,0)');g.addColorStop(1,'rgba(180,164,124,1)');q.fillStyle=g;q.fillRect(1010,DB.road-22,110,44);}
    q.fillStyle='#b4a47c';q.fillRect(1118,DB.road-22,DB.cp.x-1118,44);
    q.fillStyle='rgba(90,80,58,.5)';for(let x=1020;x<DB.cp.x;x+=7){q.fillRect(x,DB.road-12+Math.sin(x*.05)*2,5,2);q.fillRect(x,DB.road+10+Math.sin(x*.043)*2,5,2);}   // wheel ruts
    q.fillStyle='#b6ad90';q.fillRect(1470,-660,150,116);q.strokeStyle='rgba(240,236,220,.6)';q.lineWidth=2;q.strokeRect(1474,-656,142,108);
    q.fillStyle='rgba(60,54,40,.5)';q.fillRect(1312,-702,14,70);q.fillRect(1312,-566,14,56);   // the trench behind the bank
    const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;
    const m=new T.Mesh(new T.PlaneGeometry(W,D),new T.MeshStandardMaterial({map:t,transparent:true,roughness:1,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));
    m.rotation.x=-Math.PI/2;m.position.set(X0+W/2,H+.35,Y0+D/2);m.receiveShadow=true;m.renderOrder=1;B.add(m);}
  const earth=M(0x6a5c40,1),wall=M(0x9a9482,.95),roofM=M(0x55584e,.9),cpM=M(0x8d9298,.9),dark=M(0x26282a,.7,.5),wood=M(0x5d4a34,.95),steel=M(0x3a3632,.6,.7),drum=M(0xa04a1c,.7,.3),wm=M(0x55504a,.5,.7);
  for(const o of DD.objs){if(!o.base)continue;const cx=o.x+o.w/2,cy=o.y+o.h/2;
    if(o.kind==='ddbank'){o.meshes=[add(new T.BoxGeometry(o.w+4,9,o.h),earth,cx,H+4.5,cy),add(new T.BoxGeometry(o.w-4,3,o.h-2),M(0x7d8a4c,1),cx,H+10,cy)];}
    else if(o.kind==='ddbld'){const cp=o.look==='cp',h=cp?40:30;o.meshes=[add(new T.BoxGeometry(o.w,h,o.h),cp?cpM:wall,cx,H+h/2,cy),add(new T.BoxGeometry(o.w+8,4,o.h+8),roofM,cx,H+h+2,cy)];
      if(cp){o.meshes.push(add(new T.BoxGeometry(1.6,22,18),dark,o.x-.6,H+11,DB.road));for(const dz of[-28,28])o.meshes.push(add(new T.BoxGeometry(1.2,9,12),new T.MeshBasicMaterial({color:0xd9b46a}),o.x-.4,H+24,DB.road+dz));
        const pole=add(new T.CylinderGeometry(.6,.6,44,6),steel,cx,H+h+24,cy);o.meshes.push(pole,add(new T.BoxGeometry(16,9,.5),M(0x9a1c1c,.8),cx+8.5,H+h+40,cy));}
      else if(o.look==='shed'){for(let k=0;k<3;k++)o.meshes.push(add(new T.BoxGeometry(o.w/3-8,22,1.4),dark,o.x+o.w*(k+.5)/3,H+11,o.y-.5));}
      else o.meshes.push(add(new T.BoxGeometry(14,18,1.4),dark,cx,H+9,o.y-.5));}
    else if(o.kind==='ddfuel'){o.meshes=[];const r=rng(7);for(let i=0;i<3;i++)for(let j=0;j<3;j++)o.meshes.push(add(new T.CylinderGeometry(6,6,13,10),drum,o.x+9+i*16,H+6.5,o.y+8+j*12+r()*2));
      o.meshes.push(add(new T.CylinderGeometry(6,6,13,10),drum,o.x+17,H+19.5,o.y+14),add(new T.CylinderGeometry(6,6,13,10),drum,o.x+33,H+19.5,o.y+26));}
    else if(o.kind==='ddwire'&&o.v){   // wire that runs north-south: dday.js draws it east-west, so that drawing is taken away and it's drawn here
      for(const m of o.meshes||[])if(m.parent)m.parent.remove(m);o.meshes=[];
      for(let y=o.y;y<=o.y+o.h;y+=25)o.meshes.push(add(new T.BoxGeometry(1,19,1),wood,cx,H+9.5,y));
      for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(.35,.35,o.h),wm,cx,H+hh,cy));
      for(let y=o.y+3;y<o.y+o.h;y+=8)o.meshes.push(add(new T.TorusGeometry(2.6,.28,4,8),wm,cx,H+17.5,y,.4));}
  }
  // watchtowers at the west corners, the gate's barrier arm (up), the parade ground's flag
  for(const t of DB.towers){for(const[dx,dz]of[[-7,-7],[7,-7],[-7,7],[7,7]])add(new T.BoxGeometry(1.6,30,1.6),wood,t.x+dx,H+15,t.y+dz);
    add(new T.BoxGeometry(18,1.6,18),wood,t.x,H+30,t.y);for(const[dx,dz,w,d]of[[0,-9,18,1],[0,9,18,1],[-9,0,1,18]])add(new T.BoxGeometry(w,7,d),wood,t.x+dx,H+34,t.y+dz);
    add(new T.BoxGeometry(22,1.4,22),roofM,t.x,H+50,t.y);for(const[dx,dz]of[[-8,-8],[8,-8],[-8,8],[8,8]])add(new T.BoxGeometry(1,20,1),wood,t.x+dx,H+40,t.y+dz);}
  {add(new T.BoxGeometry(3,12,3),wall,1296,H+6,-640);const arm=add(new T.BoxGeometry(2,2,64),M(0xd8d8d8,.7),1296,H+34,-628);arm.rotation.x=.95;}
  {add(new T.CylinderGeometry(.7,.7,60,6),steel,1545,H+30,-602);add(new T.BoxGeometry(22,12,.5),M(0x9a1c1c,.8),1557,H+52,-602);}
}
/* ---------- the garrison: 30 men, two tanks ---------- */
function ddBaseGarrison(){
  const b=dd.base||(dd.base={});if(b.garr)return;b.garr=true;b.reT=simT+14;
  const n0=enemies.length,F=(tag,x,y,ex)=>{const e=ddFoe(tag,x-DDX,y,Object.assign({ang:Math.PI},ex||{}));enemies.push(e);return e;},
    G=(tag,x,y)=>{const e=ddGunner(tag,{x:x-DDX,y,ang:Math.PI,arc:.7});if(!enemies.includes(e))enemies.push(e);return e;},Z=(x0,y0,x1,y1)=>({x0,y0,x1,y1});
  // the checkpoint (3)
  G('bwest',1256,-652);F('bwest',1256,-552,{post:true});F('bwest',1262,-536,{post:true,nade:1});
  // the towers (2)
  for(const t of DB.towers){const e=F('bwest',t.x,t.y,{post:true,name:'Sniper',weapon:'sniper'});e.elev=31.6;}
  // the trench behind the bank (8)
  F('bwest',1326,-692,{post:true});F('bwest',1326,-672,{post:true,nade:1});G('bwest',1326,-652);F('bwest',1326,-640,{post:true});
  F('bwest',1326,-558,{post:true});G('bwest',1326,-542);F('bwest',1326,-528,{post:true,nade:1});F('bwest',1326,-516,{post:true});
  // by the barracks (6)
  for(const[x,y]of[[1418,-684],[1440,-676],[1464,-684]])F('byard',x,y,{zone:Z(1340,-700,1660,-520),nade:x===1440?1:0});
  for(const[x,y]of[[1568,-684],[1590,-676],[1614,-684]])F('byard',x,y,{zone:Z(1340,-700,1660,-520)});
  // the mortars (2), the motor pool (2), the anti-aircraft gun (2)
  F('bmortar',1680,-730,{post:true,name:'Mortar crew',mortarT:simT+10+Math.random()*6});F('bmortar',1708,-698,{post:true,name:'Mortar crew',mortarT:simT+15+Math.random()*6});
  F('byard',1436,-524,{zone:Z(1340,-560,1620,-470)});F('byard',1594,-526,{zone:Z(1340,-560,1620,-470)});
  F('aa',1678,-494,{post:true,name:'Gun crew'});F('aa',1722,-498,{post:true,name:'Gun crew'});
  // the command post (5)
  G('bcp',1656,-626);F('bcp',1656,-574,{post:true});F('bcp',1680,-652,{post:true,nade:1});F('bcp',1680,-552,{post:true});F('bcp',1676,-600,{zone:Z(1620,-660,1700,-540)});
  b.count=enemies.length-n0;
  b.t1=ddTankSpawn({x:DB.pit.x,y:DB.pit.y,ang:Math.PI,name:'The dug-in tank',range:400,hold:true});
  b.t2=ddTankSpawn({x:DB.t2.x,y:DB.t2.y,ang:Math.PI,name:'The second tank',range:1,hold:true,way:[[1440,-600],[1384,-600]]});
}
// the barracks on the hill is held: an ammo drop there, and on to the base
function ddBaseOpen(){
  const b=dd.base||(dd.base={});if(b.open)return;b.open=true;ddBaseGarrison();
  if(typeof addZones==='function')addZones([{k:'sup',x:DDX+DD_SPOT.door.x-40,y:DD_SPOT.door.y+34}]);
  VB.x1=DB.x1;clampCam();
  bigText('Barracks taken','complete');banner('The barracks is yours: ammunition there now. Their base is down the road on the right. Take its command post.',6000);
}
function ddBaseTick(dt){
  const b=dd.base;if(!b||!b.garr||dd.won)return;
  if(simT<(b.tickT||0))return;b.tickT=simT+.5;
  const up=players.filter(p=>alive(p)&&!p.inBoat);
  // their barracks keep sending men at whoever's coming (Bryan: "Barracks keeps sending men out"), not with ours at the door
  if(b.open&&simT>=b.reT){b.reT=simT+10+Math.random()*5;
    const doors=[[DB.bA.door,'bA'],[DB.bB.door,'bB']].filter(([d,tag])=>!dd.blown[tag]&&!dd.allies.some(u=>!u.inBoat&&hyp(u.x-d.x,u.y-d.y)<150));
    if(doors.length&&up.length&&enemies.filter(e=>e.tag==='breinf'&&!beaten(e)).length<7){
      const d=doors[(b.reN=(b.reN||0)+1)%doors.length][0],e=ddFoe('breinf',d.x-DDX+(Math.random()-.5)*24,d.y,{nade:Math.random()<.3?1:0,ang:Math.PI});enemies.push(e);
      const cx=up.reduce((a,u)=>a+u.x,0)/up.length,cy=up.reduce((a,u)=>a+u.y,0)/up.length,dl=hyp(cx-d.x,cy-d.y)||1,k=Math.max(0,dl-150)/dl;
      const tx=d.x+(cx-d.x)*k+(Math.random()-.5)*70,ty=clamp(d.y+(cy-d.y)*k+(Math.random()-.5)*70,-740,-470),s=openSpot(tx,ty,enemies.filter(o=>o!==e&&!o.dead).map(destOf)),p=s&&findPath(e.x,e.y,s.x,s.y,FOOT);
      if(p){e.path=p;e.zone={x0:s.x-140,x1:s.x+140,y0:s.y-120,y1:s.y+120};}else e.zone={x0:1320,x1:1700,y0:-740,y1:-470};}}
  // the dug-in tank fires on anyone coming up the road; the second rolls out of the motor pool once the gate's lost or one of ours is inside
  if(b.t2&&b.t2.hold&&b.t2.hp>0&&b.open){const west=enemies.filter(e=>e.tag==='bwest'&&!beaten(e)).length;
    if(west<=3||up.some(p=>p.x>1336&&p.y<DB.y1)){b.t2.hold=false;b.t2.range=520;banner('A second tank rolls out of their motor pool.',3600);}}
  // the command post: ours once two of ours have stood at its door for four seconds with nobody of theirs, and no tank, left near it
  if(!b.open)return;
  const d=DB.cp.door,near=up.filter(p=>hyp(p.x-d.x,p.y-d.y)<110).length,foes=enemies.filter(e=>!beaten(e)&&hyp(e.x-d.x,e.y-d.y)<240).length+ddTanksUp().filter(K=>hyp(K.x-d.x,K.y-d.y)<340).length;
  b.holdN=near;b.holdFoes=foes;
  if(near>=2&&!foes){b.holdT=(b.holdT||0)+.5;if(b.holdT>=4){dd.won=true;bigText('Base taken','complete');banner('Their command post is yours. The base is taken.',4000);endAt=performance.now()+4200;updateObjUI();}}
  else b.holdT=0;
}
// the fuel dump goes up: everyone of theirs near it, and a tank beside it
function ddFuelBlast(o,by){
  const cx=o.x+o.w/2,cy=o.y+o.h/2;
  for(let k=0;k<7;k++)booms.push({x:cx+(Math.random()-.5)*70,y:cy+(Math.random()-.5)*60,t:-k*.14,size:1.6});
  tankFires.push({x:cx,y:cy,r:22,t0:simT,puffs:[],emit:0});shake(1.2);if(typeof sfxBoom==='function')sfxBoom(cx,cy,1.6);
  for(const e of enemies.slice()){if(beaten(e))continue;const d=hyp(e.x-cx,e.y-cy);if(d<120)damage(e,280*(1-d/130),by||null);}
  for(const p of dd.allies){if(!alive(p))continue;const d=hyp(p.x-cx,p.y-cy);if(d<80)damage(p,90*(1-d/90),null);}
  ddTankHit(cx,cy,2);
}
/* ---------- the squad that runs itself, and the other troops, on east ---------- */
function ddSquadEast(t,m,cx,cy){
  const lead=players.filter(p=>p.team!==t&&alive(p)&&!p.inBoat),lx=lead.length?Math.max(...lead.map(p=>p.x)):cx;
  const W=DB.east.find(w=>w[0]>cx+50);if(!W||lead.length&&W[0]>lx+170)return;
  const as=makeAssign(m,W[0],W[1]+(t==='B'?40:-30));if(!as.length)return;
  for(const a of as)Object.assign(a.u,{path:a.path,gaitForce:null,exposeT:0});
  dd.hop[t]=simT+16+Math.random()*8;
}
function ddNpcEast(u){
  const lead=players.filter(p=>alive(p)&&!p.inBoat&&!p.joining),lx=lead.length?Math.max(...lead.map(p=>p.x)):u.x,lim=Math.min(DB.x1-40,lx+50);
  if(u.sup>.8){u.hopT=simT+1.5;return;}
  if(u.x>=lim-20){u.hopT=simT+3;return;}
  if(u.laneY==null)u.laneY=-725+Math.random()*245;
  let best=null,bs=-1e9;const th=enemies.filter(e=>!beaten(e)&&hyp(e.x-u.x,e.y-u.y)<520).map(e=>({x:e.x,y:e.y}));
  for(const c of coverPts){
    if(c.x>lim||c.x<u.x+24||c.x>u.x+190||c.y>-444||Math.abs(c.y-u.laneY)>130)continue;
    if(dd.allies.some(o=>o!==u&&hyp(destOf(o).x-c.x,destOf(o).y-c.y)<14))continue;
    const s=th.length?protStats(c,th).prot/th.length:0,sc=s*3-Math.abs(c.y-u.laneY)/160+Math.random()*.6;
    if(sc>bs){bs=sc;best=c;}
  }
  const tgt=best||{x:Math.min(lim,u.x+90+Math.random()*60),y:clamp(u.laneY+(Math.random()-.5)*60,-740,-470)};
  const p=findPath(u.x,u.y,tgt.x,tgt.y);
  if(p&&p.length){u.path=p;u.hopT=simT+2.5+Math.random()*5;}else u.hopT=simT+2;
}
/* ---------- on the overlay, and the hint ---------- */
function ddBaseDraw(lab){
  const b=dd.base;if(!b||!b.garr)return;const dead=tag=>!enemies.some(e=>e.tag===tag&&!beaten(e)),X=x=>x-DDX;
  if(!dd.blown.bA)lab(X(DB.bA.x+60),DB.bA.y+20,46,'BARRACKS A','#ff8a6a');if(!dd.blown.bB)lab(X(DB.bB.x+60),DB.bB.y+20,46,'BARRACKS B','#ff8a6a');
  if(!dd.blown.fuel)lab(X(DB.fuel.x+25),DB.fuel.y+20,34,'FUEL DUMP · BLOW IT UP','#ffcf4a');
  if(!dead('bmortar'))lab(X(1694),-716,24,'MORTARS','#ff8a6a');
  if(!dead('bwest'))lab(X(1300),-600,40,'GATE','#ff8a6a');
  if(!dd.won)lab(X(DB.cp.x+42),DB.cp.y+44,62,!b.open?'COMMAND POST':b.holdT>0?`COMMAND POST · HOLDING ${Math.max(1,Math.ceil(4-b.holdT))}`:b.holdN?(b.holdFoes?`COMMAND POST · ${b.holdFoes} OF THEIRS STILL NEAR`:'COMMAND POST · TWO MEN AT THE DOOR'):'COMMAND POST · TAKE IT','#ffcf4a');
}
function ddBaseHint(){
  return'Their base. The gate is the hard way in: a bank and trench either side and a tank dug in behind it. The wire at both ends of that face and the gap in the south wire are the other ways. Their two barracks keep sending men until they\'re blown up or yours are at the doors; the fuel dump goes up with a rocket. Ammunition is at the barracks you took. Take the command post at the far end: two of yours at its door for four seconds, with none of theirs and no tank left near it.';
}
