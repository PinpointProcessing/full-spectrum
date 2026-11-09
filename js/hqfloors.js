"use strict";
/* The Headquarters' upstairs (Bryan, after v94: "We should give this HQ a second floor that goes to the roof where a helipad
   and the radio tower could go"; his answer 5: both stairs and a lift; after v96: "I think we should build the HQ, and then the
   story to continue to the radio tower"). Once the HQ is the squad's (base.js's makeBase), her old lair at the north end of the
   hall holds a flight of stairs up and a lift, and there are two more floors, built like the office building's (interior.js):
   side by side with the ground floor in the map's frame with 'void' between them, one on screen at a time (the floor chip,
   curFloor), every floor live at once.
   - the second floor (2F): a corridor running north to the stairs up to the roof, the BRIEFING ROOM and the BARRACKS to the
     west of it, two EMPTY ROOMs to the east (for what's built next), and a landing along the south side with the stairs down
     and the lift;
   - the roof (RF): a parapet round it, the stairs' housing, the HELIPAD (Bryan: the class tools are radioed in and flown to
     the roof), the RADIO TOWER's base waiting for parts (the next mission: the old radio tower through the tunnel down the
     road), air conditioning units and vents; outdoors, so rain, wind and lightning.
   The stairs and the lift take everyone selected on that floor, like the office's: each man up or down a flight on his own,
   the lift once everyone sent is in the car (hqGo, hqGoLift; hqFloorTick from base.js's baseTick). */
const HQF={GF:{x0:60,y0:80,x1:940,y1:940},'2F':{x0:1040,y0:240,x1:1700,y1:880},RF:{x0:130,y0:-720,x1:870,y1:10}};
const HQ_FLOOR_IDS=['RF','2F','GF'];
function hqFloorOf(x,y){for(const id of HQ_FLOOR_IDS){const b=HQF[id];if(x>=b.x0&&x<=b.x1&&y>=b.y0&&y<=b.y1)return id;}return null;}
const hqFloors=()=>MAPID==='hq'&&!!HQ&&!!HQ.floors;
const FLOORS_HQ={ids:HQ_FLOOR_IDS,of:(x,y)=>hqFloorOf(x,y),set:(id,at)=>setHQFloor(id,at),get flights(){return HQ.flights;}};   // (interior.js's mapFloors)
const hqRoof=()=>hqFloors()&&curFloor==='RF';        // outdoors: rain on the overlay, the storm's lightning (overlay.js, main.js)
const hqIndoors=()=>hqFloors()&&curFloor!=='RF';     // the rain a hiss on the roof (audio.js)
const HQ_HEMI={GF:.75,'2F':.58,RF:.3};
// the flights (interior.js's buildFlight and stairElev): dir is the way it climbs, or goes down
const HQ_FL={
  gfUp:{x0:412,y0:150,x1:472,y1:240,dir:'n',up:true,floor:'GF'},       // her old lair: up to the second floor, climbing north
  f2Down:{x0:1070,y0:782,x1:1160,y1:842,dir:'w',up:false,floor:'2F'},  // the landing: down to the ground floor, going down to the west
  f2Up:{x0:1345,y0:268,x1:1395,y1:348,dir:'n',up:true,floor:'2F'},     // the corridor's north end: up to the roof
  rfDown:{x0:472,y0:-158,x1:528,y1:-74,dir:'n',up:false,floor:'RF'}};  // in the housing on the roof: down to the second floor, going down to the north
const HQ_TR=[
  {from:'GF',to:'2F',z:HQ_FL.gfUp,arrive:{x:1182,y:812},label:'UP'},
  {from:'2F',to:'GF',z:HQ_FL.f2Down,arrive:{x:442,y:258},label:'DOWN'},
  {from:'2F',to:'RF',z:HQ_FL.f2Up,arrive:{x:500,y:-44},label:'UP TO THE ROOF'},
  {from:'RF',to:'2F',z:HQ_FL.rfDown,arrive:{x:1370,y:366},label:'DOWN'}];
const HQ_CAR={GF:{x0:516,y0:146,x1:586,y1:226},'2F':{x0:1598,y0:780,x1:1674,y1:854}};   // the lift's car on each floor
const HQ_LIFT=[];   // (no lift since v121, Bryan, after v120: "I think we just needs stairs to go up. No lift. We might add a basement later"; its car's spots kept for old code)
const HQ_2F_ROOMS=[{x0:1060,y0:260,x1:1330,y1:500,name:'BRIEFING ROOM'},{x0:1060,y0:510,x1:1330,y1:760,name:'BARRACKS'},
  {x0:1410,y0:260,x1:1680,y1:500,name:'EMPTY ROOM'},{x0:1410,y0:510,x1:1680,y1:760,name:'EMPTY ROOM'}];
const ROOF={x0:150,y0:-700,x1:850,y1:-10},PAD={x:330,y:-470,r:110},MAST={x0:620,y0:-560,x1:760,y1:-440,x:690,y:-500};   // the roof inside the parapet, the helipad, the radio tower's base

/* ---------- building them (from makeBase: the finished HQ) ---------- */
function hqFloorsBuild(){
  if(!HQ||HQ.floors||!HQ.scene)return;
  const sc=HQ.scene,keepL=HQ.lights||{},pools=Object.values(sc.userData.crPools||{}).map(p=>p&&p.g).filter(Boolean),unitG=new Set(units.map(u=>u.m&&u.m.g).filter(Boolean));
  // what's built so far is the ground floor: into its own group (not the lights, the people, the effects or the monsters' pools)
  const G={GF:new T.Group(),'2F':new T.Group(),RF:new T.Group()};
  for(const c of sc.children.slice()){if(c.isLight||c===(keepL.moon&&keepL.moon.target)||c.isSprite||unitG.has(c)||pools.includes(c))continue;G.GF.add(c);}
  for(const k in G)sc.add(G[k]);G['2F'].visible=G.RF.visible=false;
  HQ.groups=G;HQ.floors=true;HQ.flights=Object.values(HQ_FL);HQ.ride=null;
  for(const L of HQ.lamps)if(!L.floor)L.floor='GF';
  // the new objects (walls, furniture, the stairs' rails) and the void between the floors
  const add=[];const O=(floor,kind,x,y,w,h,ex)=>{const o=Object.assign({kind,x,y,w,h,full:FULL.has(kind),floor},ex||{});add.push(o);return o;};
  hqGFObjs(O);hq2FObjs(O);hqRFObjs(O);
  for(const z of HQ.flights)add.push(...flightRails(z,z.floor));
  add.push(...voidRects([HQF.GF,HQF['2F'],HQF.RF],NAV_W));
  objs.push(...add);HQ.objs=objs.slice();EAST_X=NAV_W;rebuildNav();
  // their look
  const M=(c,o={})=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.8,metalness:.1},o)),ML=c=>new T.MeshLambertMaterial({color:c});
  const mat={wall:ML(0x3d434a),owall:ML(0x2c3238),cap:ML(0x8a9097),steel:M(0x5b636a,{metalness:.65,roughness:.38}),dark:M(0x1f2327,{metalness:.4,roughness:.5}),
    wood:ML(0x6a5038),olive:ML(0x4b5536),blanket:ML(0x3c4733),sheet:ML(0xb9b6aa),locker:M(0x58623f,{metalness:.45,roughness:.5}),crate:ML(0x5d6640),
    seat:ML(0x23282d),conc:ML(0x6e706c),parapet:ML(0x55595c),hazard:M(0xc8a02a),ac:M(0x8d9398,{metalness:.5,roughness:.45}),
    screen:new T.MeshBasicMaterial({color:0x5fb8e8,toneMapped:false}),red:new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}),green:new T.MeshBasicMaterial({color:0x37e08a,toneMapped:false})};
  const fm={step:ML(0x5a5f65),nose:ML(0xb79a3c),pit:ML(0x16191c),rail:M(0x8a9097,{metalness:.6,roughness:.4})};
  for(const z of HQ.flights)buildFlight(z,G[z.floor],fm);
  hqGFLook(G.GF,mat);hq2FLook(G['2F'],mat);hqRFLook(G.RF,mat);
  for(const o of add)if(o.look)o.look(G[o.floor],mat,o);
  hqFloorActs();curFloor='GF';floorChip();
}
// a box into a group (shadows on); a flat glowing plane
function hBox(g,w,h,d,m,x,y,z,ry){const b=new T.Mesh(new T.BoxGeometry(w,h,d),m);b.position.set(x,y,z);if(ry)b.rotation.y=ry;b.castShadow=b.receiveShadow=true;g.add(b);return b;}
// a wall cut away at waist height with a light cap (the office's look: the floor plan reads from above)
function hWall(g,o,m,cap,h){const cx=o.x+o.w/2,cz=o.y+o.h/2,a=hBox(g,o.w,h,o.h,m,cx,h/2,cz),b=hBox(g,o.w+.2,1.2,o.h+.2,cap,cx,h+.6,cz);o.meshes=[a,b];return a;}
// a lamp on a floor: in the Headquarters' list and the one in play (scene.js's lamp pool lights the nearest on the floor on screen)
function hLamp(g,x,y,h,c,i,d,floor,head=true){
  const L={x,y,h,c,i,d,floor};HQ.lamps.push(L);if(lamps!==HQ.lamps)lamps.push(L);
  if(head){const hd=new T.Mesh(new T.BoxGeometry(8,1.5,3),new T.MeshBasicMaterial({color:c,toneMapped:false}));hd.position.set(x,h+1,y);g.add(hd);L.head=hd;}return L;
}
// a floor's own ground: a canvas painted per room, on a plane (holes where a flight goes down: alphaTest)
function hGround(g,b,S,paint,wet){
  const fc=document.createElement('canvas');fc.width=Math.round((b.x1-b.x0)*S);fc.height=Math.round((b.y1-b.y0)*S);const x=fc.getContext('2d');x.setTransform(S,0,0,S,-b.x0*S,-b.y0*S);paint(x);
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;
  let m=new T.MeshStandardMaterial({map:tex,roughness:wet?.42:.84,metalness:wet?.16:.06,alphaTest:.5});if(wet)m=wetGround(m,b.x1-b.x0,b.y1-b.y0,24,.5);
  const gr=new T.Mesh(new T.PlaneGeometry(b.x1-b.x0,b.y1-b.y0),m);gr.rotation.x=-Math.PI/2;gr.position.set((b.x0+b.x1)/2,0,(b.y0+b.y1)/2);gr.receiveShadow=true;g.add(gr);return tex;
}
function hStripes(g,x,y,w,h){g.save();g.beginPath();g.rect(x,y,w,h);g.clip();g.fillStyle='rgba(214,170,46,.75)';g.fillRect(x,y,w,h);g.fillStyle='rgba(20,20,20,.85)';
  for(let k=-h-w;k<w+h;k+=8){g.beginPath();g.moveTo(x+k,y);g.lineTo(x+k+4,y);g.lineTo(x+k+4+h,y+h);g.lineTo(x+k+h,y+h);g.fill();}g.restore();}
function hGrid(g,r,s,a){g.strokeStyle=`rgba(0,0,0,${a})`;g.lineWidth=1;g.beginPath();for(let x=r.x0+s;x<r.x1;x+=s){g.moveTo(x,r.y0);g.lineTo(x,r.y1);}for(let y=r.y0+s;y<r.y1;y+=s){g.moveTo(r.x0,y);g.lineTo(r.x1,y);}g.stroke();}
function hShade(g,list){g.save();g.fillStyle='rgba(0,0,0,.55)';for(const o of list){if(o.kind==='void'||o.kind==='srail')continue;g.shadowColor='rgba(0,0,0,.75)';g.shadowBlur=/wall/.test(o.kind)?14:8;g.fillRect(o.x,o.y,o.w,o.h);}g.restore();}

/* --- the ground floor: the stairs up and the lift where her lair was --- */
function hqGFObjs(O){
  O('GF','void',110,80,780,50);O('GF','void',110,790,280,150);O('GF','void',610,790,280,150);   // outside the walls (nobody lands there off the lift)
}
function hqGFLook(g,mat){
  const c=HQ_CAR.GF;
  for(const o of objs.filter(q=>q.lift&&q.floor==='GF')){const cx=o.x+o.w/2,cz=o.y+o.h/2;o.meshes=[hBox(g,o.w,24,o.h,mat.steel,cx,12,cz),hBox(g,o.w+.4,1,o.h+.4,mat.dark,cx,24.5,cz)];}
  // the floor: hazard stripes at the lift's threshold and the foot of the stairs
  if(HQ.tex){const x=HQ.tex.image.getContext('2d');x.setTransform(1.2,0,0,1.2,-HQB.x0*1.2,-HQB.y0*1.2);const f=HQ_FL.gfUp;hStripes(x,f.x0,f.y1,f.x1-f.x0,6);HQ.tex.needsUpdate=true;}
}

/* --- the second floor --- */
function hq2FObjs(O){
  const F='2F';
  O(F,'owall',1050,250,640,10);O(F,'owall',1050,860,640,10);O(F,'owall',1050,260,10,600);O(F,'owall',1680,260,10,600);
  for(const x of[1330,1400]){O(F,'iwall',x,260,10,100);O(F,'iwall',x,410,10,200);O(F,'iwall',x,660,10,100);}   // the corridor, a doorway into each room
  O(F,'iwall',1060,500,270,10);O(F,'iwall',1410,500,270,10);O(F,'iwall',1060,760,270,10);O(F,'iwall',1410,760,270,10);
  O(F,'iwall',1590,770,8,90);   // (the landing's east wall: no lift since v121)
  // the briefing room: a long table
  O(F,'table',1140,365,120,30,{look:(g,m,o)=>{const cx=o.x+o.w/2,cz=o.y+o.h/2;hBox(g,o.w,1.4,o.h,m.wood,cx,7.6,cz);hBox(g,o.w-8,6.6,o.h-10,m.dark,cx,3.3,cz);
    for(let k=0;k<5;k++)for(const s of[-1,1]){const ch=hBox(g,6,1.2,6,m.seat,o.x+14+k*23,5,cz+s*(o.h/2+6));hBox(g,6,6,1,m.seat,o.x+14+k*23,8,cz+s*(o.h/2+9.2));}}});
  // the barracks: bunks along both walls, lockers, a table
  for(const y of[522,556,590,624,658,692])O(F,'bunk',1064,y,26,12,{look:bunkLook});
  for(const y of[522,556,690,724])O(F,'bunk',1300,y,26,12,{look:bunkLook});
  O(F,'locker',1110,512,180,10,{look:(g,m,o)=>{for(let k=0;k<9;k++){const x=o.x+10+k*20;hBox(g,19,18,o.h,m.locker,x,9,o.y+o.h/2);hBox(g,1,7,.4,m.dark,x+5,11,o.y+o.h+.2);}}});
  O(F,'table',1170,612,60,36,{look:(g,m,o)=>{const cx=o.x+o.w/2,cz=o.y+o.h/2;hBox(g,o.w,1.2,o.h,m.wood,cx,7.6,cz);for(const sx of[-1,1])for(const sz of[-1,1])hBox(g,1.4,7,1.4,m.dark,cx+sx*(o.w/2-3),3.5,cz+sz*(o.h/2-3));
    for(const[px,pz]of[[cx-14,o.y-6],[cx+14,o.y-6],[cx-14,o.y+o.h+6],[cx+14,o.y+o.h+6]])hBox(g,6,5,6,m.seat,px,2.5,pz);hBox(g,10,1,6,m.olive,cx-8,8.7,cz);hBox(g,3,2.5,3,m.steel,cx+12,9.4,cz+4);}});
  // the empty rooms: a few crates left over
  for(const[x,y,w,h]of[[1622,278,30,24],[1642,306,24,22],[1430,722,30,26]])O(F,'crate',x,y,w,h,{look:(g,m,o)=>{hBox(g,o.w,11,o.h,m.crate,o.x+o.w/2,5.5,o.y+o.h/2);}});
  O(F,'bench',1250,846,64,8,{look:(g,m,o)=>{hBox(g,o.w,1.4,o.h,m.wood,o.x+o.w/2,4.6,o.y+o.h/2);for(const s of[-1,1])hBox(g,1.4,4,o.h-2,m.dark,o.x+o.w/2+s*(o.w/2-4),2,o.y+o.h/2);}});
}
function bunkLook(g,m,o){   // a two-tier bunk: a steel frame, two mattresses, blankets, a pillow at the wall end
  const cx=o.x+o.w/2,cz=o.y+o.h/2,head=o.x<1200?o.x+3:o.x+o.w-3;
  for(const sx of[-1,1])for(const sz of[-1,1])hBox(g,1,16,1,m.steel,cx+sx*(o.w/2-.5),8,cz+sz*(o.h/2-.5));
  for(const y of[4,12]){hBox(g,o.w,1,o.h,m.dark,cx,y,cz);hBox(g,o.w-2,1.6,o.h-2,m.sheet,cx,y+1.3,cz);hBox(g,o.w-9,.6,o.h-1.5,m.blanket,cx+(head<cx?3.5:-3.5),y+2.3,cz);hBox(g,4,1.2,o.h-4,m.sheet,head+(head<cx?2:-2),y+2.5,cz);}
}
function hq2FLook(g,mat){
  const b=HQF['2F'],S=1.2,fl=objs.filter(o=>o.floor==='2F');
  HQ.tex2=hGround(g,b,S,x=>{
    x.fillStyle='#0b0c0e';x.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);x.fillStyle='#3a3d40';x.fillRect(1060,260,620,600);
    const r=rng(2207),room=(q,c,s,a)=>{x.fillStyle=c;x.fillRect(q.x0,q.y0,q.x1-q.x0,q.y1-q.y0);hGrid(x,q,s,a);};
    room({x0:1060,y0:260,x1:1330,y1:500},'#2f3742',20,.22);   // the briefing room: carpet tiles
    for(let i=0;i<300;i++){x.fillStyle=`rgba(255,255,255,${(r()*.035).toFixed(3)})`;x.fillRect(1060+Math.floor(r()*13.5)*20,260+Math.floor(r()*12)*20,20,20);}
    room({x0:1060,y0:510,x1:1330,y1:760},'#3d4136',24,.2);   // the barracks: lino
    room({x0:1340,y0:260,x1:1400,y1:760},'#46494c',30,.18);x.fillStyle='rgba(255,255,255,.04)';x.fillRect(1362,260,16,500);   // the corridor, a worn path down it
    room({x0:1060,y0:770,x1:1680,y1:860},'#43464a',40,.2);
    for(const q of HQ_2F_ROOMS.slice(2))room(q,'#37393b',40,.25);
    for(let i=0;i<260;i++){const px=1062+r()*616,py=262+r()*596,rr=3+r()*16,gr=x.createRadialGradient(px,py,0,px,py,rr);gr.addColorStop(0,'rgba(10,10,12,.14)');gr.addColorStop(1,'rgba(10,10,12,0)');x.fillStyle=gr;x.fillRect(px-rr,py-rr,rr*2,rr*2);}
    for(const y of[360,610])for(const xx of[1330,1400])hStripes(x,xx,y,10,50);   // the doorways
    
    {const f=HQ_FL.f2Up;hStripes(x,f.x0,f.y1,f.x1-f.x0,6);}
    hShade(x,fl);
    {const f=HQ_FL.f2Down;hStripes(x,f.x1,f.y0,6,f.y1-f.y0);x.clearRect(f.x0,f.y0,f.x1-f.x0,f.y1-f.y0);}   // the hole the stairs go down
  });
  for(const o of fl){if(o.kind==='owall')hWall(g,o,mat.owall,mat.cap,14);else if(o.kind==='iwall')hWall(g,o,mat.wall,mat.cap,12);else if(o.kind==='liftwall')hWall(g,o,mat.steel,mat.dark,14);}
  // the lift's car: a steel floor, the doors slid open, a call panel

  // the briefing room's wall screen (the area's map, a red mark on the old radio tower) and a whiteboard
  {const s=new T.Mesh(new T.PlaneGeometry(64,30),new T.MeshBasicMaterial({map:canvasTex(256,120,(x,w,h)=>{x.fillStyle='#071a1e';x.fillRect(0,0,w,h);x.strokeStyle='rgba(80,200,210,.2)';
      for(let i=0;i<w;i+=16){x.beginPath();x.moveTo(i,0);x.lineTo(i,h);x.stroke();}for(let j=0;j<h;j+=16){x.beginPath();x.moveTo(0,j);x.lineTo(w,j);x.stroke();}
      x.strokeStyle='rgba(120,220,255,.7)';x.lineWidth=3;x.beginPath();x.moveTo(20,96);x.lineTo(110,96);x.quadraticCurveTo(150,96,170,60);x.lineTo(200,34);x.stroke();
      x.fillStyle='rgba(90,160,120,.5)';x.fillRect(14,70,40,40);x.fillStyle='#5cff8a';x.beginPath();x.arc(34,90,5,0,7);x.fill();
      x.fillStyle='#ff4636';x.beginPath();x.arc(214,26,6,0,7);x.fill();x.strokeStyle='#ff4636';x.lineWidth=2;x.beginPath();x.arc(214,26,13,0,7);x.stroke();
      x.fillStyle='rgba(255,255,255,.7)';x.font='bold 11px sans-serif';x.fillText('HQ',28,66);x.fillText('RADIO TOWER',150,52);}),toneMapped:false}));
    s.rotation.y=Math.PI/2;s.position.set(1061.2,20,380);g.add(s);hBox(g,1.2,32,66,mat.dark,1060.6,20,380);
    const wb=new T.Mesh(new T.PlaneGeometry(50,20),new T.MeshStandardMaterial({map:canvasTex(200,80,(x,w,h)=>{x.fillStyle='#e8ece8';x.fillRect(0,0,w,h);x.strokeStyle='#2a4fb0';x.lineWidth=2;
      x.beginPath();x.moveTo(20,60);x.lineTo(70,30);x.lineTo(120,50);x.lineTo(170,20);x.stroke();x.strokeStyle='#c0302a';x.strokeRect(150,10,36,22);x.fillStyle='#333';x.font='10px sans-serif';x.fillText('RECON / ROUTE',14,18);}),roughness:.4}));
    wb.position.set(1200,20,261.2);g.add(wb);}
  // light: the rooms lit, the corridor and the landing; the empty rooms dim
  for(const[x,y,i,d,c]of[[1195,330,1.5,200,0xf2f4f8],[1195,440,1.3,190,0xf2f4f8],[1195,570,1.4,190,0xffe9c8],[1195,700,1.3,190,0xffe9c8],[1370,420,1.2,170,0xf0f2f4],[1370,650,1.2,170,0xf0f2f4],
    [1240,815,1.3,200,0xf0f2f4],[1500,815,1.3,200,0xf0f2f4],[1545,380,.7,150,0xdfe8ff],[1545,635,.7,150,0xdfe8ff]])hLamp(g,x,y,30,c,i,d,'2F');
}

/* --- the roof --- */
function hqRFObjs(O){
  const F='RF',R=ROOF;
  O(F,'parapet',R.x0-8,R.y0-8,R.x1-R.x0+16,8);O(F,'parapet',R.x0-8,R.y1,R.x1-R.x0+16,8);O(F,'parapet',R.x0-8,R.y0,8,R.y1-R.y0);O(F,'parapet',R.x1,R.y0,8,R.y1-R.y0);
  O(F,'wall',460,-172,80,10,{house:1});O(F,'wall',460,-162,10,100,{house:1});O(F,'wall',530,-162,10,100,{house:1});   // the stairs' housing, open to the south
  O(F,'plinth',MAST.x0,MAST.y0,MAST.x1-MAST.x0,MAST.y1-MAST.y0);
  for(const[x,y,w,h]of[[170,-680,50,30],[240,-680,50,30],[790,-262,40,50],[790,-192,40,50]])O(F,'acunit',x,y,w,h);
  for(const[x,y,s]of[[600,-330,12],[400,-250,10],[820,-400,12],[190,-250,12],[640,-130,10]])O(F,'vent',x-s/2,y-s/2,s,s);
}
function hqRFLook(g,mat){
  const b=HQF.RF,R=ROOF,fl=objs.filter(o=>o.floor==='RF');
  hGround(g,b,1,x=>{
    x.fillStyle='#0c0e10';x.fillRect(b.x0,b.y0,b.x1-b.x0,b.y1-b.y0);
    const r=rng(4411);x.fillStyle='#2b2f31';x.fillRect(R.x0-8,R.y0-8,R.x1-R.x0+16,R.y1-R.y0+16);
    for(let i=0;i<2600;i++){x.fillStyle=r()<.5?'rgba(0,0,0,.08)':'rgba(255,255,255,.025)';x.fillRect(R.x0+r()*(R.x1-R.x0),R.y0+r()*(R.y1-R.y0),1+r()*3,1+r()*3);}
    x.strokeStyle='rgba(150,155,150,.13)';x.lineWidth=1.5;for(let y=R.y0+70;y<R.y1;y+=70){x.beginPath();x.moveTo(R.x0,y);x.lineTo(R.x1,y);x.stroke();}   // the membrane's seams
    for(let i=0;i<14;i++){const px=R.x0+40+r()*(R.x1-R.x0-80),py=R.y0+40+r()*(R.y1-R.y0-80),rx=14+r()*40,ry=8+r()*22;x.fillStyle='rgba(8,10,12,.5)';x.beginPath();x.ellipse(px,py,rx,ry,r()*3,0,7);x.fill();}   // puddles
    for(let y=-60;y>-640;y-=22){x.fillStyle='rgba(120,124,124,.35)';x.fillRect(494,y,12,16);}   // walkway pads
    for(let xx=520;xx<620;xx+=22){x.fillStyle='rgba(120,124,124,.35)';x.fillRect(xx,-506,16,12);}
    for(let xx=440;xx<494;xx+=22){x.fillStyle='rgba(120,124,124,.35)';x.fillRect(xx,-476,16,12);}
    // the helipad: a dark deck, the yellow ring, the white H
    x.fillStyle='#262d2a';x.beginPath();x.arc(PAD.x,PAD.y,PAD.r,0,7);x.fill();x.strokeStyle='#d6b23a';x.lineWidth=7;x.beginPath();x.arc(PAD.x,PAD.y,PAD.r-12,0,7);x.stroke();
    x.strokeStyle='rgba(230,232,228,.8)';x.lineWidth=2;x.setLineDash([10,8]);x.beginPath();x.arc(PAD.x,PAD.y,PAD.r-2,0,7);x.stroke();x.setLineDash([]);
    x.fillStyle='#e8eae4';x.fillRect(PAD.x-30,PAD.y-40,14,80);x.fillRect(PAD.x+16,PAD.y-40,14,80);x.fillRect(PAD.x-16,PAD.y-7,32,14);
    x.fillStyle='#4b4f50';x.fillRect(MAST.x0-6,MAST.y0-6,MAST.x1-MAST.x0+12,MAST.y1-MAST.y0+12);
    hShade(x,fl.filter(o=>o.kind!=='parapet'));
    {const f=HQ_FL.rfDown;x.clearRect(f.x0,f.y0,f.x1-f.x0,f.y1-f.y0);}
  },true);
  // far below: the ground round the building, dark (the roof stands over it)
  {const m=new T.Mesh(new T.PlaneGeometry(2600,2400),new T.MeshStandardMaterial({color:0x0b0e11,roughness:1}));m.rotation.x=-Math.PI/2;m.position.set(500,-90,-350);g.add(m);}
  for(const o of fl){
    const cx=o.x+o.w/2,cz=o.y+o.h/2;
    if(o.kind==='parapet'){o.meshes=[hBox(g,o.w,9,o.h,mat.parapet,cx,4.5,cz),hBox(g,o.w+1,1,o.h+1,mat.cap,cx,9.5,cz)];
      hBox(g,o.w,10,o.h,mat.parapet,cx,-5,cz);}   // (and its face below the roof's edge)
    else if(o.house){o.meshes=[hBox(g,o.w,26,o.h,mat.conc,cx,13,cz),hBox(g,o.w+1,1.2,o.h+1,mat.cap,cx,26.6,cz)];}
    else if(o.kind==='acunit'){o.meshes=[hBox(g,o.w,10,o.h,mat.ac,cx,5,cz)];const r=Math.min(o.w,o.h)*.36,f=new T.Mesh(new T.CylinderGeometry(r,r,1,18),mat.dark);f.position.set(cx,10.4,cz);g.add(f);
      hBox(g,o.w>o.h?.8:r*2,.5,o.w>o.h?r*2:.8,mat.steel,cx,11,cz);}   // a fan grille on top
    else if(o.kind==='vent'){const v=new T.Mesh(new T.CylinderGeometry(o.w/2,o.w/2,7,12),mat.steel);v.position.set(cx,3.5,cz);v.castShadow=true;g.add(v);const c=new T.Mesh(new T.ConeGeometry(o.w*.7,3,12),mat.steel);c.position.set(cx,8.5,cz);g.add(c);}
  }
  // the stairs' housing: a lamp over its opening, a sign
  hLamp(g,500,-58,20,0xffe2b0,1.3,160,'RF');
  // the building's walls going down from the roof's edge to the dark ground
  for(const[w,d,x,z]of[[R.x1-R.x0+16,4,(R.x0+R.x1)/2,R.y0-10],[R.x1-R.x0+16,4,(R.x0+R.x1)/2,R.y1+10],[4,R.y1-R.y0+24,R.x0-10,(R.y0+R.y1)/2],[4,R.y1-R.y0+24,R.x1+10,(R.y0+R.y1)/2]])hBox(g,w,90,d,mat.owall,x,-45,z);
  // the helipad: a slightly raised deck edge, green lights round it, a windsock
  {const n=16,geo=new T.BoxGeometry(2.4,1.2,2.4),im=new T.InstancedMesh(geo,new T.MeshBasicMaterial({color:0x5cff8a,toneMapped:false}),n),q=new T.Object3D();
    for(let i=0;i<n;i++){const a=i/n*Math.PI*2;q.position.set(PAD.x+Math.cos(a)*(PAD.r-3),.7,PAD.y+Math.sin(a)*(PAD.r-3));q.updateMatrix();im.setMatrixAt(i,q.matrix);}g.add(im);
    hBox(g,1,30,1,mat.steel,R.x0+18,15,PAD.y-120);const sock=new T.Mesh(new T.ConeGeometry(2.4,12,10,1,true),new T.MeshStandardMaterial({color:0xff7a1a,roughness:.7,side:T.DoubleSide}));
    sock.rotation.z=Math.PI/2;sock.position.set(R.x0+25,28,PAD.y-120);g.add(sock);HQ.sock=sock;}
  // the radio tower's base: a concrete plinth, four steel footings and the stub of a lattice mast, cable on a drum, a red light
  {const cx=MAST.x,cz=MAST.y,pl=hBox(g,MAST.x1-MAST.x0,4,MAST.y1-MAST.y0,mat.conc,(MAST.x0+MAST.x1)/2,2,(MAST.y0+MAST.y1)/2);
    for(const sx of[-1,1])for(const sz of[-1,1]){hBox(g,8,2,8,mat.steel,cx+sx*20,5,cz+sz*20);hBox(g,2,20,2,mat.steel,cx+sx*18,14,cz+sz*18);}
    for(const s of[-1,1]){const b1=hBox(g,38,1.2,1.2,mat.steel,cx,10,cz+s*18);b1.rotation.z=.45*s;const b2=hBox(g,1.2,1.2,38,mat.steel,cx+s*18,10,cz);b2.rotation.x=.45*s;}
    for(const s of[-1,1])hBox(g,38,1.2,1.2,mat.steel,cx,23.4,cz+s*18);for(const s of[-1,1])hBox(g,1.2,1.2,38,mat.steel,cx+s*18,23.4,cz);
    const drum=new T.Mesh(new T.CylinderGeometry(8,8,9,16),mat.wood);drum.rotation.x=Math.PI/2;drum.position.set(MAST.x0+18,8,MAST.y1-16);drum.castShadow=true;g.add(drum);
    hBox(g,14,9,10,mat.olive,MAST.x1-16,6.5,MAST.y1-14);hBox(g,10,5,6,mat.hazard,MAST.x1-30,4.5,MAST.y0+12);
    const red=new T.Mesh(new T.SphereGeometry(1.6,10,8),new T.MeshBasicMaterial({color:0xff2a1a,toneMapped:false}));red.position.set(cx,25.5,cz);g.add(red);HQ.redLight=red;
    hLamp(g,cx,cz,26,0xff3a22,.9,120,'RF',false);}
  for(const[x,y]of[[R.x0+12,R.y0+12],[R.x1-12,R.y0+12],[R.x0+12,R.y1-12],[R.x1-12,R.y1-12]]){hBox(g,1.2,24,1.2,mat.dark,x,12,y);hLamp(g,x,y,26,0xffc98a,1.6,230,'RF');}   // lamps on poles at the corners
  hLamp(g,PAD.x,PAD.y-PAD.r-14,22,0xf0f4ff,1.2,200,'RF');
}

/* ---------- which floor is on screen ---------- */
function setHQFloor(id,at){
  if(!hqFloors()||!HQF[id])return;curFloor=id;const b=HQF[id];
  for(const k in HQ.groups)HQ.groups[k].visible=k===id;
  VB={x0:b.x0,z0:b.y0,x1:b.x1,z1:b.y1};FIT.w=b.x1-b.x0+40;FIT.h=b.y1-b.y0+40;fitDist();
  const L=HQ.lights;if(L&&L.hemi){L.hemi.userData.base=HQ_HEMI[id];L.hemi.intensity=HQ_HEMI[id];}
  if(L&&L.moon){const cx=(b.x0+b.x1)/2,cz=(b.y0+b.y1)/2;L.moon.position.set(cx-200,600,cz-200);L.moon.target.position.set(cx,0,cz);L.moon.target.updateMatrixWorld();}
  camT=at?{x:at.x,z:at.y}:{x:(b.x0+b.x1)/2,z:(b.y0+b.y1)/2};clampCam();updateCamera();floorChip();
}

/* ---------- the stairs and the lift (the things to use: interior.js's ACTS) ---------- */
function hqFloorActs(){
  for(let i=ACTS.length-1;i>=0;i--)if(ACTS[i].hqf)ACTS.splice(i,1);
  const on=()=>hqFloors()&&!!base&&!!base.done&&!(typeof hqManage==='function'&&hqManage());   // (nobody walks the Headquarters since v121: base.js)
  for(const tr of HQ_TR){const z=tr.z;ACTS.push({id:'hqst-'+tr.from+tr.to,hqf:1,map:'hq',floor:tr.from,x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2,r:16,label:tr.label,multi:true,avail:on,go:list=>hqGo(list,tr)});}
  for(const tr of HQ_LIFT){const c=HQ_CAR[tr.from];ACTS.push({id:'hqlift-'+tr.from,hqf:1,map:'hq',floor:tr.from,x:(c.x0+c.x1)/2,y:(c.y0+c.y1)/2,r:16,label:tr.to==='2F'?'LIFT UP':'LIFT DOWN',multi:true,
    avail:()=>on()&&!HQ.ride,go:list=>hqGoLift(list,tr)});}
}
const onHQFloor=(list,f)=>list.filter(u=>hqFloorOf(u.x,u.y)===f);
function hqGo(list,tr){   // everyone selected on this floor up (or down) the whole flight, each on his own
  const go=onHQFloor(list,tr.from);if(!go.length){banner('Select soldiers on this floor first.',1600);return;}
  const z=tr.z,fp=farPart(z),mid={x:(fp.x0+fp.x1)/2,y:(fp.y0+fp.y1)/2},spots=slotsIn(fp,go.length,players.filter(p=>!go.includes(p)&&!p.dead).map(destOf)).filter(s=>inZone(s,fp));
  let n=0;go.forEach((u,i)=>{const s=spots[i]||mid,p=findPath(u.x,u.y,s.x,s.y);if(!p)return;n++;
    Object.assign(u,{path:p,lastOrder:simT,hqStairs:{tr,t0:simT},hqLift:null,watch:null,supT:null,focus:null,silent:null,ret:null});});
  if(!n){banner('No way there from here.',1600);return;}
  callout(go[0],tr.from==='RF'||tr.to==='GF'?'Going down':'Going up',C.good);
}
function hqGoLift(list,tr){   // into the car: it goes once everyone sent is in it
  const go=onHQFloor(list,tr.from);if(!go.length){banner('Select soldiers on this floor first.',1600);return;}
  const z=HQ_CAR[tr.from],spots=slotsIn(z,go.length,[]);
  go.forEach((u,i)=>{const s=spots[i]||{x:(z.x0+z.x1)/2,y:(z.y0+z.y1)/2},p=findPath(u.x,u.y,s.x,s.y);if(!p)return;
    Object.assign(u,{path:p,lastOrder:simT,hqLift:{tr,t0:simT},hqStairs:null,watch:null,supT:null,focus:null,silent:null,ret:null});});
  callout(go[0],'Into the lift',C.good);
}
function hqAfter(to,who){   // the camera follows when nobody selected is left on the floor on screen
  const s=sel.filter(alive);
  if(who.some(u=>sel.includes(u))&&!s.some(u=>hqFloorOf(u.x,u.y)===curFloor)){const on=onHQFloor(s,to);setHQFloor(to,on.length?midOf(on):null);}
  floorChip();hud();
}
function hqFloorTick(){   // (every tick in the Headquarters: base.js's baseTick)
  if(!hqFloors())return;
  if(HQ.redLight)HQ.redLight.visible=(simT%2)<.5;   // the red light on the mast's stub blinks
  if(HQ.sock)HQ.sock.rotation.y=Math.sin(simT*.7)*.35;
  const moved={};
  for(const u of players){
    const st=u.hqStairs;if(!st)continue;
    if(!alive(u)||u.lastOrder>st.t0+.01){u.hqStairs=null;continue;}
    const z=st.tr.z;if(u.path.length&&!onFlight(u,z))continue;u.hqStairs=null;
    if(!inZone(u,{x0:z.x0-10,x1:z.x1+10,y0:z.y0-10,y1:z.y1+10}))continue;   // stopped short (another order)
    transit(u,st.tr.to,st.tr.arrive);(moved[st.tr.to]=moved[st.tr.to]||[]).push(u);
  }
  for(const to in moved)hqAfter(to,moved[to]);
  if(HQ.ride){
    if(simT-HQ.ride.t<LIFT_RIDE)return;
    const R=HQ.ride;HQ.ride=null;const dz=HQ_CAR[R.to],fz=HQ_CAR[R.from],taken=[];
    for(const u of R.units){if(!alive(u))continue;transit(u,R.to,{x:dz.x0+(u.x-fz.x0)*(dz.x1-dz.x0)/(fz.x1-fz.x0),y:dz.y0+(u.y-fz.y0)*(dz.y1-dz.y0)/(fz.y1-fz.y0)},taken);}
    sfxLift((dz.x0+dz.x1)/2,(dz.y0+dz.y1)/2,'ding');hqAfter(R.to,R.units);return;
  }
  for(const u of players)if(u.hqLift&&(!alive(u)||u.lastOrder>u.hqLift.t0+.01))u.hqLift=null;   // down, or given another order: not riding
  const riders=players.filter(u=>u.hqLift);if(!riders.length)return;
  const tr=riders[0].hqLift.tr,z=HQ_CAR[tr.from],set=riders.filter(u=>u.hqLift.tr===tr);
  if(set.some(u=>u.path.length||!inZone(u,{x0:z.x0-6,x1:z.x1+6,y0:z.y0-6,y1:z.y1+6})))return;
  HQ.ride={t:simT,from:tr.from,to:tr.to,units:set};for(const u of set)u.hqLift=null;
  callout(set[0],tr.to==='2F'?'Going up':'Going down',C.good);sfxLift(set[0].x,set[0].y,'door');
}

/* ---------- the labels on the floor on screen (from base.js's drawBase) ---------- */
function drawHQFloors(now){
  if(curFloor==='2F'){for(const q of HQ_2F_ROOMS){toSBack=false;const[x,y]=toS((q.x0+q.x1)/2,(q.y0+q.y1)/2,1);if(toSBack)continue;label(q.name,x,y,q.name==='EMPTY ROOM'?'rgba(200,210,220,.55)':'#8fe6f2',q.name==='EMPTY ROOM'?9:10,700);}}
  else if(curFloor==='RF'){
    toSBack=false;let[x,y]=below(PAD.x,PAD.y+PAD.r,8);if(!toSBack)label('HELIPAD',x,y,'#8fe6f2',10,700);
    toSBack=false;[x,y]=below(MAST.x,MAST.y1,8);if(!toSBack){label('RADIO TOWER',x,y,'#8fe6f2',10,700);label(typeof l4Done==='function'&&l4Done()?'RELAY · ON THE AIR':'RELAY · WAITS ON THE OLD TOWER',x,y+13,'#ffcf4a',9,700);}
  }
  if(HQ.ride){const R=HQ.ride,z=HQ_CAR[R.from];if(R.from===curFloor){const k=(simT-R.t)/LIFT_RIDE,[lx,ly]=toS((z.x0+z.x1)/2,(z.y0+z.y1)/2,30);label(R.to==='2F'?'GOING UP':'GOING DOWN',lx,ly,'#ffcf4a',10,700);bar(lx-20,ly+8,40,k,'#ffcf4a');}}
}
function hqFloorHint(){
  if(curFloor==='2F')return'The second floor: the briefing room and the barracks, and two rooms empty for now. The stairs at the end of the corridor go up to the roof; the stairs on the landing go back down.';
  if(curFloor==='RF')return typeof l4Done==='function'&&l4Done()?'The roof: the helipad, and the radio relay, on the air now through the old radio tower on the hill.':'The roof: the helipad, and the radio relay. It waits on the old radio tower through the tunnel down the road: power that on.';
  return'';
}
