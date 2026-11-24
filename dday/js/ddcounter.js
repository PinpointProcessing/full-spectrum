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
// Version 231 (Bryan's plan, docs/drafts/v231-base-defence-plan-2.jpg): Chapter 2 is fought from the D-Day base, looking down the road their
// reinforcements come along, the beach down a cliff on the right. Drawn here turned a quarter: the story's east is this map's north, so the camera,
// the waves and the guns keep working as they did. South to north: the square, the two barracks on its left, the command post in the gap of the
// north bank with the road through it; the guns outside (two nests on the left, the field gun and the heavy MG on the right by the cliff); the
// field; the fork (left into the woods, right down the cliffs to the beach); their checkpoint between the branches.
const DCA={x0:200,x1:1010,wallY:556,gate:[624,776],road:700,setup:10,fixT:8,fixN:2,lull:15,gunHit:42,flagT:14,dug:.6,   // (dug: a man on a gun takes this share of what hits him)
  cliffX:1010,beachH:-78,
  cp:{x:658,y:562,w:84,h:80},cpZone:{x0:620,y0:462,x1:780,y1:558},flag:{x:756,y:548},   // (the ground in front of the command post: theirs for flagT s with none of ours in it and the base is lost)
  barracks:[{x:396,y:600,w:46,h:118},{x:396,y:742,w:46,h:118}],door:{x:700,y:550},cpIn:{x:700,y:650},   // (the right-hand barracks is the first, by the command post; door: where the squad comes out of the command post)
  armory:{x:900,y:626,w:84,h:56},depot:{x:876,y:790,w:108,h:60},
  square:{x:700,y:756},
  hedgeY:-70,treeY:-430,forkY:-150,checkHp:650,slit:{range:520,every:[1.3,2.3],rounds:4,hit:.42,dmg:[7,12]},   // (the blockhouse's machine guns: Version 233)
  check:{x:694,y:-316,w:84,h:54,zone:{x0:600,y0:-360,x1:850,y1:-200}},eguns:[{x:612,y:-116},{x:578,y:-162}],   // (eguns: their light machine guns left of the fork, pointed at the beach until they're turned on us)   // (their checkpoint: the woods road runs through its left side)
  guns:[{k:'n1',n:'MG NEST',x:540,y:516,t:'mg',arc:1.15,hp:260},{k:'n2',n:'MG NEST',x:604,y:468,t:'mg',arc:1.15,hp:260},
    {k:'h1',n:'HEAVY MG',x:900,y:440,t:'mg',hv:1,arc:1.5,hp:340,face:0},{k:'a1',n:'FIELD GUN',x:858,y:520,t:'art',hp:420,face:0}],   // (face 0: it stands pointing at the beach until it's turned)
  hold:[[668,520],[700,496],[736,522]],   // (where the men not on a gun stand: in front of the command post)
  posts:[[450,264],[940,250],[430,318],[520,318],[632,318],[790,318],[880,318],[960,330],[590,362],[830,362]],   // (the other troops' forward posts, out in the field)
  hv:{tank:9,every:1.1,range:560,shell:130,mortar:70,man:.5},
  art:{min:170,max:960,reload:7.5,auto:6,R:84,D:150},
  waves:[{inf:18,tanks:[]},{inf:14,tanks:['road'],mortar:true},{inf:18,tanks:['west','east']}],
  roads:{west:[[700,-150],[672,-210],[640,-262],[560,-330],[420,-400],[250,-470],[60,-560]],east:[[700,-150],[790,-190],[900,-250],[990,-320],[1040,-380],[1120,-470],[1200,-520]]},   // (the fork's two branches, as drawn)
  ways:{road:[[700,-80],[700,260],[700,440],[700,500]],west:[[420,-400],[560,-330],[640,-262],[690,-150],[660,150],[640,300],[690,440],[700,500]],east:[[700,-240],[740,-60],[790,150],[770,300],[712,440],[700,500]]}};
const dcIn=(u,z)=>u.x>z.x0&&u.x<z.x1&&u.y>z.y0&&u.y<z.y1;

/* ---------- the ground ---------- */
function dcHeights(){
  const{nx,ny}=DDG,a=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=i*10,y=DDB.y0+j*10;
    let h=Math.max(0,-90-y)*.036+Math.sin(x*.011+1)*Math.cos(y*.009)*1.6;                       // the land rises a little to the tree line
    if(y>530)h=0;
    if(x>DCA.cliffX){const k=clamp((x-DCA.cliffX)/46,0,1);h=h*(1-k)+(DCA.beachH+Math.min(6,(x-DCA.cliffX-46)*-.012))*k*k*(3-2*k)+Math.sin(y*.05)*3*k*(1-k)*4;}   // (Version 231: the cliff down to the beach, the sand shelving to the water)
    a[j*nx+i]=h;}
  return a;
}
function dcObjects(){
  const L=[],o=(kind,x,y,w,h,ex)=>{const q=Object.assign({kind,x,y,w,h,full:false},ex||{});L.push(q);return q;};
  o('drop',0,-760,200,1660);o('drop',DCA.cliffX,-760,800,1660);   // (the cliff: nobody goes down it)
  // the base: bank and wire across the north either side of the command post, wire down the sides and the back
  for(const[x0,x1]of[[384,DCA.gate[0]],[DCA.gate[1],996]]){o('dcbank',x0,DCA.wallY,x1-x0,12,{cover:2});for(let x=x0;x<x1;x+=50)o('ddwire',x,DCA.wallY-18,Math.min(50,x1-x)-.01,8,{hp:60,tag:'wire'});}
  for(const x of[376,996])o('dcside',x,DCA.wallY-18,8,340,{full:false});
  o('dcside',384,884,612,8,{ew:1});
  for(const b of DCA.barracks)o('ddbarr',b.x,b.y,b.w,b.h,{full:true});
  o('dcbld',DCA.armory.x,DCA.armory.y,DCA.armory.w,DCA.armory.h,{full:true,look:'store'});o('dcbld',DCA.depot.x,DCA.depot.y,DCA.depot.w,DCA.depot.h,{full:true,look:'shed'});
  o('dcbld',DCA.cp.x,DCA.cp.y,DCA.cp.w,DCA.cp.h,{full:true,look:'cp'});
  for(const[x,y]of[[560,620],[840,700],[610,690],[790,598],[470,668],[560,850],[780,850],[470,850],[850,740]])o('ddcrate',x,y,22,20,{cover:1});
  // the guns' bags; a short line either side of the road in front of the command post
  for(const g of DCA.guns){if(g.t==='mg'){o('sandbag',g.x-24,g.y-20,48,10);o('sandbag',g.x-30,g.y-16,10,28);o('sandbag',g.x+20,g.y-16,10,28);if(g.face===0)o('sandbag',g.x+26,g.y-6,10,30);}
    else{o('sandbag',g.x-34,g.y-36,68,10);o('sandbag',g.x-40,g.y-30,10,34);o('sandbag',g.x+30,g.y-30,10,44);}}
  o('sandbag',640,470,40,10);o('sandbag',722,470,40,10);
  for(const[x,y]of[[450,250],[940,236]]){o('sandbag',x-24,y-20,48,10);o('sandbag',x-30,y-16,10,28);o('sandbag',x+20,y-16,10,28);}o('sandbag',566,344,48,10);o('sandbag',806,344,48,10);   // (the other troops' forward posts)
  // the field: boulders, the hedgerow with its gaps
  for(const[x,y]of[[560,40],[840,80],[390,130],[960,10],[300,-10],[930,140],[620,170],[790,-20],[480,-200],[900,-120]])o('ddbould',x,y,18,15,{cover:1});
  for(const[x0,x1]of[[220,520],[560,640],[760,840],[880,1000]])o('dchedge',x0,DCA.hedgeY,x1-x0,14,{full:true,cover:2});
  // their checkpoint between the fork's branches: a blockhouse, bags, a wall along its right; the woods road through its left
  // (after Version 231, Bryan: "No walls blocking any roadway (it looks like it blocks beach access)": nothing of it stands on either branch)
  {const c=DCA.check;o('dcbld',c.x,c.y,c.w,c.h,{full:true,look:'check',hp:DCA.checkHp,tag:'check'});
    o('sandbag',c.x-4,c.y+c.h+16,c.w+8,10);o('sandbag',c.x-12,c.y+c.h+2,10,24);o('sandbag',c.x+c.w+2,c.y+c.h+2,10,24);   // a breastwork in front of it, facing the base
    o('sandbag',c.x-22,c.y+6,10,40);o('sandbag',c.x+c.w+14,c.y+6,10,40);                                                  // short lines at its sides
    for(const[x,y]of[[c.x+c.w+34,c.y+46],[c.x+c.w+40,c.y-6],[c.x-34,c.y-14]])o('ddcrate',x,y,22,20,{cover:1});
    for(const e of DCA.eguns){o('sandbag',e.x+16,e.y-18,10,36);o('sandbag',e.x-18,e.y+16,36,10);}}                          // their light machine guns' bags: toward the beach, and toward us
  for(const[x,y]of[[300,-420],[430,-440],[560,-450],[860,-430],[950,-410]])o('ddbould',x,y,20,16,{cover:1});
  return L;
}
function dcPaint(g){
  const S=DDS,r=rng(1945);g.setTransform(S,0,0,S,0,-DDB.y0*S);
  g.fillStyle='#6f8a4b';g.fillRect(0,DDB.y0,1400,1660);
  for(let i=0;i<420;i++){const x=r()*1400,y=DDB.y0+r()*1660,k=r();g.fillStyle=k<.4?`rgba(62,92,44,${.12+r()*.16})`:k<.75?`rgba(136,158,82,${.1+r()*.14})`:`rgba(150,146,84,${.1+r()*.14})`;g.beginPath();g.ellipse(x,y,20+r()*70,12+r()*40,r()*3,0,7);g.fill();}   // (Version 188) the meadow in patches: lusher, paler, gone to seed
  for(let i=0;i<5200;i++){const x=r()*1400,y=DDB.y0+r()*1660;g.fillStyle=`rgba(${r()<.5?'58,82,40':'150,170,96'},${.06+r()*.12})`;g.fillRect(x,y,3+r()*9,2+r()*5);}
  // plough land and pasture beyond the hedgerow
  g.fillStyle='rgba(132,156,84,.55)';g.fillRect(230,-330,300,250);g.fillStyle='rgba(150,150,86,.5)';g.fillRect(830,-130,170,50);
  g.strokeStyle='rgba(70,60,40,.18)';g.lineWidth=2;for(let x=236;x<530;x+=9){g.beginPath();g.moveTo(x,-330);g.lineTo(x,-82);g.stroke();}
  // the road in from inland, worn and rutted
  g.fillStyle='#b4a47c';g.fillRect(DCA.road-30,DCA.forkY,60,DCA.wallY-DCA.forkY+10);
  for(const k of['west','east']){const P=DCA.roads[k];g.strokeStyle='#b4a47c';g.lineWidth=k==='west'?54:46;g.lineJoin='round';g.lineCap='round';g.beginPath();g.moveTo(P[0][0],P[0][1]+12);for(const p of P.slice(1))g.lineTo(p[0],p[1]);g.stroke();}
  {const gr=g.createLinearGradient(DCA.cliffX,0,DCA.cliffX+60,0);gr.addColorStop(0,'rgba(128,112,88,0)');gr.addColorStop(.35,'#857458');gr.addColorStop(1,'#d8c696');g.fillStyle=gr;g.fillRect(DCA.cliffX,DDB.y0,60,1660);g.fillStyle='#d8c696';g.fillRect(DCA.cliffX+60,DDB.y0,400,1660);
    for(let i=0;i<2600;i++){g.fillStyle=`rgba(${r()<.5?'150,132,96':'236,222,180'},${.1+r()*.2})`;g.fillRect(DCA.cliffX+50+r()*340,DDB.y0+r()*1660,2+r()*6,1+r()*3);}
    for(let i=0;i<70;i++){const x=DCA.cliffX+70+r()*250,y=DDB.y0+60+r()*1500;g.fillStyle='rgba(60,52,40,.5)';g.beginPath();g.ellipse(x,y,5+r()*4,2+r()*2,r()*3,0,7);g.fill();}}
  g.fillStyle='rgba(90,80,58,.45)';for(let y=DCA.forkY;y<560;y+=7){g.fillRect(DCA.road-13+Math.sin(y*.05)*2,y,2,5);g.fillRect(DCA.road+11+Math.sin(y*.043)*2,y,2,5);}
  // trampled earth round the nests, the guns and the trench
  for(const q of DCA.guns){const gr=g.createRadialGradient(q.x,q.y,4,q.x,q.y,q.t==='art'?58:44);gr.addColorStop(0,'rgba(120,100,66,.85)');gr.addColorStop(1,'rgba(120,100,66,0)');g.fillStyle=gr;g.fillRect(q.x-60,q.y-60,120,120);}
  // the base: hard-packed yard, the parade square
  g.fillStyle='#a69c7e';g.fillRect(382,DCA.wallY-6,616,340);
  for(let i=0;i<2400;i++){g.fillStyle=`rgba(${r()<.5?'70,64,48':'214,204,172'},${.05+r()*.1})`;g.fillRect(382+r()*616,DCA.wallY-6+r()*340,2+r()*5,2+r()*4);}
  g.fillStyle='#b6ad90';g.fillRect(610,690,180,130);g.strokeStyle='rgba(240,236,220,.6)';g.lineWidth=2;g.strokeRect(614,694,172,122);g.fillStyle='#b4a47c';g.fillRect(DCA.road-22,640,44,52);
  g.fillStyle='rgba(60,54,40,.45)';g.fillRect(384,DCA.wallY+12,240,10);g.fillRect(776,DCA.wallY+12,220,10);
  // (Version 188) the yard's gravel and oil stains, wheel tracks off the road, the field churned by yesterday's shelling: craters with their
  // thrown earth, scorched grass, a few trodden paths out to the nests
  for(let i=0;i<3000;i++){g.fillStyle=`rgba(${r()<.5?'80,74,60':'200,194,170'},${.12+r()*.2})`;g.fillRect(382+r()*616,DCA.wallY-6+r()*340,1+r()*1.6,1+r()*1.6);}
  for(let i=0;i<14;i++){const x=400+r()*580,y=DCA.wallY+10+r()*300,gr=g.createRadialGradient(x,y,1,x,y,8+r()*14);gr.addColorStop(0,'rgba(30,28,24,.5)');gr.addColorStop(1,'rgba(30,28,24,0)');g.fillStyle=gr;g.fillRect(x-24,y-24,48,48);}
  for(const sd of[-1,1]){g.strokeStyle='rgba(84,72,50,.3)';g.lineWidth=7;g.beginPath();g.moveTo(DCA.road+sd*44,-300);g.bezierCurveTo(DCA.road+sd*60,0,DCA.road+sd*30,300,DCA.road+sd*14,560);g.stroke();}
  for(const[x,y]of[[450,250],[940,236],[590,345],[540,516],[900,440]]){g.strokeStyle='rgba(120,102,70,.35)';g.lineWidth=6;g.beginPath();g.moveTo(x,y+20);g.quadraticCurveTo((x+700)/2+(r()-.5)*60,(y+560)/2,700+(r()-.5)*100,DCA.wallY);g.stroke();}
  DD.dcHoles=[];for(let i=0;i<16;i++){const x=260+r()*720,y=-60+r()*340,R=7+r()*9;if(Math.abs(x-DCA.road)<40)continue;DD.dcHoles.push({x,y,r:R});
    for(let k=0;k<12;k++){const a=r()*TAU,l=R*(1.3+r());g.strokeStyle='rgba(92,76,50,.2)';g.lineWidth=2+r()*3;g.beginPath();g.moveTo(x+Math.cos(a)*R*.8,y+Math.sin(a)*R*.8);g.lineTo(x+Math.cos(a)*l,y+Math.sin(a)*l);g.stroke();}
    const gr=g.createRadialGradient(x,y,1,x,y,R+4);gr.addColorStop(0,'rgba(40,32,22,.85)');gr.addColorStop(.6,'rgba(84,68,44,.6)');gr.addColorStop(1,'rgba(84,68,44,0)');g.fillStyle=gr;g.beginPath();g.arc(x,y,R+4,0,7);g.fill();
    for(let k=0;k<30;k++){const a=r()*TAU,d=R*(.9+r()*.6);g.fillStyle=r()<.5?'rgba(60,48,32,.5)':'rgba(140,120,84,.45)';g.fillRect(x+Math.cos(a)*d,y+Math.sin(a)*d,1.5+r()*2,1.5+r()*2);}}
  for(let i=0;i<9000;i++){const x=r()*DCA.cliffX,y=DDB.y0+r()*(DCA.wallY-DDB.y0);g.fillStyle=`rgba(${r()<.6?'44,64,30':'170,176,104'},${.08+r()*.14})`;g.fillRect(x,y,1+r()*1.5,1+r()*2);}
}
function dcScenery(sc){
  const far=new T.Mesh(new T.PlaneGeometry(9000,5000),typeof ddgFarMat==='function'?ddgFarMat(9000,5000):new T.MeshStandardMaterial({color:0x6f8a4b,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(DCA.cliffX-4500,-1.2,0);far.receiveShadow=true;sc.add(far);   // (Version 190: bocage fading into the haze, ddground.js)
  const hill=new T.Mesh(new T.PlaneGeometry(9000,1800),typeof ddgFarMat==='function'?ddgFarMat(9000,1800,0xe4e8dc):new T.MeshStandardMaterial({color:0x5b7340,roughness:1}));hill.rotation.x=-Math.PI/2+.06;hill.position.set(DCA.cliffX-4500,60,DDB.y0-880);sc.add(hill);
  // (Version 231) down the cliff on the right: the sand running on north and south, the sea, the cliff's face beyond the map
  const sand=new T.Mesh(new T.PlaneGeometry(700,9000),new T.MeshStandardMaterial({color:0xd8c696,roughness:1}));sand.rotation.x=-Math.PI/2;sand.position.set(DCA.cliffX+350,DCA.beachH-1.5,0);sand.receiveShadow=true;sc.add(sand);
  const sea=new T.Mesh(new T.PlaneGeometry(9000,9000),new T.MeshStandardMaterial({color:0x3f7f96,roughness:.35,metalness:.1}));sea.rotation.x=-Math.PI/2;sea.position.set(DCA.cliffX+330+4500,DCA.beachH+1.2,0);sc.add(sea);
  const foam=new T.Mesh(new T.PlaneGeometry(14,9000),new T.MeshBasicMaterial({color:0xf2f6f4,transparent:true,opacity:.7}));foam.rotation.x=-Math.PI/2;foam.position.set(DCA.cliffX+332,DCA.beachH+1.4,0);sc.add(foam);
  for(const[z,l]of[[DDB.y0-2250,4500],[900+2250,4500]]){const face=new T.Mesh(new T.PlaneGeometry(l,90),new T.MeshStandardMaterial({color:0x857458,roughness:1}));face.rotation.y=Math.PI/2;face.position.set(DCA.cliffX+10,DCA.beachH/2,z);sc.add(face);}
}
function dcBuild(G,sc,M,add){
  const earth=M(0x6a5c40,1),turf=M(0x7d8a4c,1),wall=M(0x9a9482,.95),roofM=M(0x55584e,.9),cpM=M(0x8d9298,.9),dark=M(0x26282a,.7,.5),wood=M(0x5d4a34,.95),steel=M(0x3a3632,.6,.7),wm=M(0x55504a,.5,.7),hedge=new T.MeshStandardMaterial({color:0x35542c,roughness:1}),leaf=new T.MeshStandardMaterial({color:0x3f6a34,roughness:1,flatShading:true}),leaf2=new T.MeshStandardMaterial({color:0x577a3a,roughness:1,flatShading:true});
  const H=(x,y)=>ddH(x,y);
  for(const o of DD.objs){const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=H(cx,cy);
    if(o.kind==='dcbank')o.meshes=[add(ddgBoxUV(o.w,9,o.h+4,24),ddgMat('earth'),cx,g0+4.5,cy),add(ddgBoxUV(o.w-2,3,o.h-2,24),ddgMat('turf'),cx,g0+10,cy)];   // (Version 188: dug earth, turf along the top)
    else if(o.kind==='dcside'){o.meshes=[];if(o.ew){for(let x=o.x;x<=o.x+o.w;x+=25)o.meshes.push(add(new T.BoxGeometry(1,19,1),wood,x,g0+9.5,cy));for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(o.w,.35,.35),wm,cx,g0+hh,cy));}
      else{for(let y=o.y;y<=o.y+o.h;y+=25)o.meshes.push(add(new T.BoxGeometry(1,19,1),wood,cx,g0+9.5,y));for(const hh of[5,10,15])o.meshes.push(add(new T.BoxGeometry(.35,.35,o.h),wm,cx,g0+hh,cy));}}
    else if(o.kind==='dcbld'){const cp=o.look==='cp'||o.look==='check',h=o.look==='check'?26:cp?40:30;o.meshes=[add(ddgBoxUV(o.w,h,o.h,cp?24:32,[.5,.02]),ddgMat(cp?'stone':'boards'),cx,g0+h/2,cy),add(new T.BoxGeometry(o.w+8,4,o.h+8),roofM,cx,g0+h+2,cy),add(new T.BoxGeometry(o.w+2,3,o.h+2),dark,cx,g0+1.2,cy)];   // (Version 188: weatherboards, the post in stone)
      if(o.look==='cp'){o.meshes.push(add(new T.BoxGeometry(18,22,1.6),dark,cx,g0+11,o.y-.6),add(new T.BoxGeometry(18,22,1.6),dark,cx,g0+11,o.y+o.h+.6));const pole=add(new T.CylinderGeometry(.6,.6,44,6),steel,cx,g0+h+24,cy);o.meshes.push(pole,add(new T.BoxGeometry(16,9,.5),M(0x2b4a8a,.8),cx+8.5,g0+h+40,cy));}
      else if(o.look==='check'){o.meshes.push(add(new T.BoxGeometry(12,17,1.4),dark,cx-28,g0+8.5,o.y-.5));}
      else if(o.look==='shed'){for(let k=0;k<3;k++)o.meshes.push(add(new T.BoxGeometry(o.w/3-8,22,1.4),dark,o.x+o.w*(k+.5)/3,g0+11,o.y-.5));}
      else o.meshes.push(add(new T.BoxGeometry(14,18,1.4),dark,cx,g0+9,o.y-.5));}
    else if(o.kind==='dchedge'){o.meshes=[];const r=rng(Math.round(o.x));for(let x=o.x+7;x<o.x+o.w;x+=13){const m=add(DD.hedgeG||(DD.hedgeG=ddgSmooth(ddgJitter(new T.DodecahedronGeometry(9,0),1.2,31))),hedge,x,H(x,cy)+7+r()*2,cy+(r()-.5)*3,r()*6);m.scale.set(1.1,1+r()*.5,.95);o.meshes.push(m);}}
  }
  // watchtowers at the north corners, the flag on the square
  for(const[tx,ty]of[[400,580],[980,580]]){for(const[dx,dz]of[[-7,-7],[7,-7],[-7,7],[7,7]])add(new T.BoxGeometry(1.6,30,1.6),wood,tx+dx,15,ty+dz);
    add(new T.BoxGeometry(18,1.6,18),wood,tx,30,ty);for(const[dx,dz,w,d]of[[0,-9,18,1],[-9,0,1,18],[9,0,1,18]])add(new T.BoxGeometry(w,7,d),wood,tx+dx,34,ty+dz);add(new T.BoxGeometry(22,1.4,22),roofM,tx,50,ty);for(const[dx,dz]of[[-8,-8],[8,-8],[-8,8],[8,8]])add(new T.BoxGeometry(1,20,1),wood,tx+dx,40,ty+dz);}
  add(new T.CylinderGeometry(.7,.7,60,6),steel,DCA.flag.x,30,DCA.flag.y);DD.dcFlag=add(new T.BoxGeometry(22,12,.5),M(0x2b4a8a,.8),DCA.flag.x+12,52,DCA.flag.y);
  // (Version 231) the barrier across the woods road at their checkpoint, its sentry box; the lost landing down on the beach: craft wrecked in the
  // surf, burnt black, and the dead on the sand and up the cliff's foot
  {const c=DCA.check,bx=626,by=-250;
    // the barrier across the woods road with its counterweight and sentry box, off the road's edge
    add(new T.BoxGeometry(2,10,2),wood,bx+34,5+H(bx+34,by),by);const bar=add(new T.BoxGeometry(60,1.5,1.5),M(0xe8e4d8,.8),bx+6,9.4+H(bx,by),by);bar.rotation.z=.03;for(let k=0;k<5;k++)add(new T.BoxGeometry(6,1.6,1.6),M(0xb02a22,.8),bx-18+k*12,9.4+H(bx,by),by);
    add(new T.BoxGeometry(5,5,5),steel,bx+38,7+H(bx,by),by);add(new T.BoxGeometry(10,22,10),wood,bx+48,11+H(bx+48,by+14),by+14);add(new T.BoxGeometry(13,1.6,13),roofM,bx+48,23+H(bx+48,by+14),by+14);
    // the blockhouse dressed: a thick roof slab, firing slits toward the base and the roads, a lookout post on stilts behind it, their flag, an aerial, stores, wire
    const cx=c.x+c.w/2,cy=c.y+c.h/2,g0=H(cx,cy),co=DD.objs.find(q=>q.tag==='check'),cm=m=>{if(co&&co.meshes)co.meshes.push(m);return m;};co.roof=cm(add(new T.BoxGeometry(c.w+14,5,c.h+14),M(0x7d8076,.95),cx,g0+29,cy));cm(add(new T.BoxGeometry(c.w-20,6,c.h-18),M(0x6c7066,.95),cx,g0+34,cy));
    for(const dx of[-24,0,24])cm(add(new T.BoxGeometry(14,2.6,1.2),dark,cx+dx,g0+17,c.y+c.h+.7));for(const dz of[-12,12]){cm(add(new T.BoxGeometry(1.2,2.6,14),dark,c.x-.7,g0+17,cy+dz));cm(add(new T.BoxGeometry(1.2,2.6,14),dark,c.x+c.w+.7,g0+17,cy+dz));}
    {const tx=c.x+c.w-12,ty=c.y-26;for(const[dx,dz]of[[-7,-7],[7,-7],[-7,7],[7,7]])add(new T.BoxGeometry(1.6,40,1.6),wood,tx+dx,20+H(tx,ty),ty+dz);add(new T.BoxGeometry(18,1.6,18),wood,tx,40+H(tx,ty),ty);
      for(const[dx,dz,w,d]of[[0,9,18,1],[-9,0,1,18],[9,0,1,18],[0,-9,18,1]])add(new T.BoxGeometry(w,7,d),wood,tx+dx,44+H(tx,ty),ty+dz);add(new T.BoxGeometry(22,1.4,22),roofM,tx,58+H(tx,ty),ty);for(const[dx,dz]of[[-8,-8],[8,-8],[-8,8],[8,8]])add(new T.BoxGeometry(1,14,1),wood,tx+dx,51+H(tx,ty),ty+dz);}
    add(new T.CylinderGeometry(.7,.7,54,6),steel,c.x+10,g0+27,c.y+c.h+30);add(new T.BoxGeometry(20,11,.5),M(0xa8201c,.8),c.x+21,g0+47,c.y+c.h+30);add(new T.BoxGeometry(6,6,.6),M(0xf0f0ea,.8),c.x+21,g0+47,c.y+c.h+30.2);
    add(new T.CylinderGeometry(.25,.25,30,5),steel,c.x+c.w-8,g0+50,c.y+8);
    for(const[x,y,w,h2,d]of[[c.x-40,c.y+30,16,12,12],[c.x-44,c.y+46,12,9,10],[c.x+c.w+54,c.y+20,18,12,12]])add(new T.BoxGeometry(w,h2,d),M(0x5a6248,.9),x,h2/2+H(x,y),y);
    for(let k=0;k<3;k++){const b=add(new T.CylinderGeometry(4,4,10,10),M(0x4a4e44,.7),c.x+c.w+50+k*9,5+H(c.x+c.w+50,c.y+44),c.y+44+(k%2)*6);}
    // their light machine guns left of the fork: on tripods, pointed at the beach
    DD.dcEGuns=[];for(const e of DCA.eguns){const g=new T.Group();g.position.set(e.x,H(e.x,e.y),e.y);g.rotation.y=0;const P=(geo,m,x,y,z,rz)=>{const b=new T.Mesh(geo,m);b.position.set(x,y,z);if(rz)b.rotation.z=rz;b.castShadow=true;g.add(b);return b;};
      P(new T.CylinderGeometry(.7,.7,16,7),steel,8,10.6,0,Math.PI/2);P(new T.BoxGeometry(5,3,2.2),steel,-2,10.4,0);P(new T.BoxGeometry(3,2.4,4.4),steel,1,9.8,2.4);
      for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,12,5),steel);l.position.set(Math.cos(a)*3.2,5,Math.sin(a)*3.2);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}G.add(g);DD.dcEGuns.push(g);}
    const burnt=M(0x2a2826,.95),rust=M(0x4a3a30,.95),r2=rng(231);
    for(const[x,y,a,tilt]of[[1330,380,.4,.2],[1352,120,-.3,-.25],[1318,-160,.9,.15],[1360,-420,-.6,.3],[1300,620,1.3,-.2],[1390,-20,.2,.1]]){const g=new T.Group();g.position.set(x,DCA.beachH+2,y);g.rotation.set(tilt,a,tilt*.6);
      for(const[w,hh,dd2,px,py,pz]of[[70,10,26,0,5,0],[70,12,1.6,0,10,13],[70,12,1.6,0,10,-13],[1.6,14,26,35,9,0],[10,9,16,-28,12,0]]){const b=new T.Mesh(new T.BoxGeometry(w,hh,dd2),px<0?rust:burnt);b.position.set(px,py,pz);b.castShadow=true;g.add(b);}G.add(g);}
    const dead=[];for(let i=0;i<64;i++){const x=DCA.cliffX+30+r2()*290,y=DDB.y0+80+r2()*1480;dead.push({x,y,h:ddH(Math.min(x,1390),y)+.8,ry:r2()*6,sx:1,c:r2()<.8?0x5a6240:0x3a3a36});}
    ddgInst(G,new T.BoxGeometry(11,2.2,4.4),new T.MeshLambertMaterial({color:0xffffff,vertexColors:true}),dead,true,400,false);}
  // the guns: a machine gun on its tripod, or a field gun on its carriage (its group turns to where it fires)
  const gm=M(0x2a2c2e,.5,.7),ol=M(0x4d5540,.9);DD.dcGuns={};
  for(const q of DCA.guns){const g=new T.Group();g.position.set(q.x,H(q.x,q.y),q.y-(q.t==='art'?14:9));g.rotation.y=q.face===0?0:Math.PI/2;const P=(geo,m,x,y,z,rz,rx)=>{const b=new T.Mesh(geo,m);b.position.set(x,y,z);if(rz)b.rotation.z=rz;if(rx)b.rotation.x=rx;b.castShadow=true;g.add(b);return b;};
    if(q.t==='mg'){if(q.hv){P(new T.CylinderGeometry(1.15,1.15,22,8),gm,12,11.6,0,Math.PI/2);P(new T.BoxGeometry(.9,10,13),ol,5.5,12.4,0);P(new T.BoxGeometry(5,4,5),ol,0,10.6,-3.4);}   // (a heavy one: a longer, thicker barrel, a shield, a bigger box)
      P(new T.CylinderGeometry(.75,.75,17,7),gm,9,11.6,0,Math.PI/2);P(new T.CylinderGeometry(1.25,1.25,7,8),gm,3,11.6,0,Math.PI/2);P(new T.BoxGeometry(5,3,2.2),gm,-2,11.2,0);P(new T.BoxGeometry(3,2.4,4.6),gm,1,10.6,2.6);
      for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,13,5),gm);l.position.set(Math.cos(a)*3.4,5.4,Math.sin(a)*3.4);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}}
    else{P(new T.BoxGeometry(22,5,14),ol,-2,8,0);P(new T.BoxGeometry(3,16,26),ol,6,13,0);const b=P(new T.CylinderGeometry(1.9,2.4,58,8),gm,30,15,0,Math.PI/2-.16);b.userData.rest=30;g.userData.barrel=b;
      for(const z of[-12,12]){const w=P(new T.CylinderGeometry(8,8,3,14),gm,0,8,z,0,Math.PI/2);w.castShadow=true;}P(new T.BoxGeometry(34,2.4,3),ol,-20,4,6);P(new T.BoxGeometry(34,2.4,3),ol,-20,4,-6);}
    G.add(g);DD.dcGuns[q.k]=g;}
  // trees: the tree line across the north, the orchard, a few along the road and round the farm
  // (Version 188: instanced, a few draw calls for all of them where there were three a tree, each crown shaded darker underneath and its own shape)
  const tr=rng(77),TK=[],C1=[],C2=[],tree=(x,y,s,m)=>{const g0=H(x,y),c=m===leaf?[0x3f6a34,0x456e36,0x3a6230]:[0x577a3a,0x5e8240,0x4e7034],pc=()=>c[(tr()*3)|0];TK.push({x,y,h:g0+8*s,sx:s,ry:tr()*6});
    C1.push({x,y,h:g0+24*s,sx:13*s,sy:15.6*s,sz:13*s,ry:tr()*6,c:pc()});C2.push({x:x+5*s,y:y-3*s,h:g0+33*s,sx:9*s,ry:tr()*6,c:pc()});};
  const onRoad=(x,y)=>['west','east'].some(k=>{const P=DCA.roads[k];for(let i=0;i<P.length-1;i++){const[ax,ay]=P[i],[bx,by]=P[i+1],t=clamp(((x-ax)*(bx-ax)+(y-ay)*(by-ay))/((bx-ax)**2+(by-ay)**2),0,1);if(hyp(x-ax-(bx-ax)*t,y-ay-(by-ay)*t)<44)return true;}return false;});
  for(let x=-600;x<DCA.cliffX-20;x+=30)for(let k=0;k<2;k++){const tx=x+(tr()-.5)*20,ty=DCA.treeY-30-k*46+(tr()-.5)*30;if(!onRoad(tx,ty))tree(tx,ty,1.2+tr()*.7,tr()<.5?leaf:leaf2);}
  for(let i=0;i<260;i++){const tx=-500+tr()*1120,ty=-1250+tr()*960;if(ty>-330-(620-tx)*.12||onRoad(tx,ty)||hyp(tx-DCA.check.x-40,ty-DCA.check.y)<130)continue;tree(tx,ty,1.1+tr()*.8,tr()<.6?leaf:leaf2);}   // (the woods the left branch goes into)
  for(const[x,y]of[[300,-290],[470,-180],[250,-130],[930,-200],[880,-40]])tree(x,y,1,leaf);
  {const lv=new T.MeshLambertMaterial({vertexColors:true});
    ddgInst(G,ddgShade(new T.CylinderGeometry(1.4,2,16,6),.5,1.05),new T.MeshLambertMaterial({color:0x5d4a34,vertexColors:true}),TK,true,350,false);
    ddgInst(G,ddgShade(ddgSmooth(ddgJitter(new T.DodecahedronGeometry(1,0),.16,11)),.48,1.12),lv,C1,true,350,false);ddgInst(G,ddgShade(ddgSmooth(ddgJitter(new T.DodecahedronGeometry(1,0),.16,12)),.55,1.12),lv,C2,true,350,false);}
  // (Version 188) grass in tufts over the fields, and banks of thrown earth round yesterday's shell holes (dcPaint's DD.dcHoles), clods about them
  {const tr2=rng(1188),tf=[],pk=a=>a[(tr2()*a.length)|0];for(let i=0;i<4600;i++){const x=tr2()*(DCA.cliffX-6),y=DDB.y0+tr2()*(DCA.wallY-DDB.y0-10);if(Math.abs(x-DCA.road)<36)continue;
      tf.push({x,y,h:H(x,y)-.2,ry:tr2()*6,sx:.8+tr2()*.9,sy:.7+tr2()*1.2,c:pk([0x5c8238,0x6a8c40,0x527a32,0x7e8a44,0x668a3c,0x8e8c56])});}
    ddgInst(G,ddgTuftGeo(1188),new T.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide}),tf,false);
    if(DD.dcHoles&&DD.dcHoles.length){const earthC=[96,78,52],spoilC=[128,108,74];ddgCraters(G,DD.dcHoles,{seed:1945,spoil:spoilC,earth:earthC,lift:.75});
      ddgInst(G,ddgShade(ddgJitter(new T.DodecahedronGeometry(1,0),.25,9),.55,1.05),new T.MeshStandardMaterial({color:0xffffff,roughness:1,vertexColors:true}),ddgClods(DD.dcHoles,tr2,30,spoilC,earthC),false);}}
}

/* ---------- starting it ---------- */
function startCounter(retry){
  if(!ddRoster)ddRoster=ddmRead();
  if(retry&&startCounter.snap){ddRoster=JSON.parse(startCounter.snap);ddmSave();}   // (a loss is a retry: the roster as it was when they left the barracks)
  if(!retry&&typeof ddmReady==='function')ddmReady(2);   // (from the start card before it's reached: squads made for it, ddmeta.js, Version 178)
  if(!ddmFit().length){banner('Nobody fit: treat the wounded or add reserves.',3200);return;}
  startCounter.snap=JSON.stringify(ddRoster);
  startCounter.noSeq=!!retry;reset();DD_MODE='counter';$('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
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
    dc:{ph:'intro',t:0,wave:0,cpT:0,guns:DCA.guns.map(g=>({...g,hp0:g.hp,man:null,going:null,fireT:0,orderT:-99,aim:null,hits:0,dead:false,smokeT:0,hvT:0})),art:null,col:[],shells:[],focus:null,focusK:null,picked:false}};
  for(const k in DD_LABELS){dd.labels0[k]=WEAPON[k].label;WEAPON[k].label=DD_LABELS[k];}
  dd.rpg0=SPECIALS.rpg.label;SPECIALS.rpg.label='Bazooka';dd.rpgR=PRPG.range;PRPG.range=900;dd.rpgA=PRPG.aim;PRPG.aim=1.15;ddBaz(1);
  // the squads on the parade square, the other troops along the wall
  ['A','B'].forEach((t,ti)=>[0,1,2,3].forEach(i=>{const rm=ddmSlotMan(t,i);if(!rm)return;const u=ddNewMan(t,t+(i+1),rm.role,DCA.square.x+(ti?26:-74)+i*16,DCA.square.y+(ti?14:-6),rm);u.inBoat=false;u.seen=true;}));
  players=units.filter(u=>u.side==='P'&&!u.npc);
  for(let i=0;i<10;i++){const u=ddNpc(i<5?400+i*44:790+(i-5)*40,DCA.wallY+22+(i%2)*10);u.inBoat=false;u.seen=true;u.back={x:u.x,y:u.y};u.post={x:DCA.posts[i][0],y:DCA.posts[i][1]};u.hopT=simT+.3+i*.25;}   // (Version 224: they run out to forward posts in the field as it starts, and fall back to the line when it gets too close: dcNpc)
  dd.pool=0;dd.sup={A:'hold',B:'hold'};   // (both squads hold: nobody follows anybody off the line)
  // the column on the road: the first wave's men marching in, the tanks behind them
  const W=DCA.waves[0];for(let i=0;i<W.inf;i++){const e=ddFoe('w1',DCA.road-DDX+((i%3)-1)*13,-560-((i/3)|0)*22,{ang:Math.PI/2,nade:i%7===0?1:0});e.lane=250+(i/(W.inf-1))*720;e.cool=99;e.stage=-1;
    const p=findPath(e.x,e.y,e.lane,DCA.treeY+30+((i%2)*18),FOOT);if(p)e.path=p;e.zone={x0:e.lane-80,x1:e.lane+80,y0:DCA.treeY-20,y1:DCA.treeY+90};}
  ddTankSpawn({x:DCA.road,y:-700,ang:Math.PI/2,hold:true,way:DCA.ways.road,name:'Tank'}).w=2;
  ddTankSpawn({x:DCA.road-6,y:-770,ang:Math.PI/2,hold:true,way:DCA.ways.west,name:'Tank'}).w=3;
  ddTankSpawn({x:DCA.road+6,y:-840,ang:Math.PI/2,hold:true,way:DCA.ways.east,name:'Tank'}).w=3;
  enemies=units.filter(u=>u.side==='E');
  contact=true;clearTeams();teamSeen.A=true;teamSeen.B=true;teamSeen.N=true;
  mission.t0=simT;sel=[];cardGroup=[];
  VB={x0:DCA.x0,z0:-720,x1:DCA.x1+150,z1:900};FIT.w=1040;FIT.h=1560;fitDist();
  MAXZ=11;camShift=0;zoom=DD_CAM.zoom;yaw=0;tilt=ddTilt(DD_CAM.zoom);camT={x:DCA.square.x,z:DCA.wallY-10+DD_CAM.look};clampCam();updateCamera();   // (Version 224: on the line of guns, the barracks behind the camera)
  document.body.classList.add('dd');ddSky(.35);DD.day=.35;DD.dayShown=.35;
  updateObjUI();setStatus();buildCards();hud();
  select(players.filter(p=>p.team==='A').length?players.filter(p=>p.team==='A'):players.filter(p=>p.team==='B'));dd.track=null;
  // the look up the road: there they are; then back, and the clock starts
  if(typeof dcSeqStart==='function'&&dcSeqStart())return;   // (Version 228: the opening sequence, ddcseq.js; not on a retry)
  dcAuto();camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:DCA.road,z:-470+DD_CAM.look,zoom:6.5},t:0,dur:2.2};
  banner('They are coming out of the woods. Tanks on the road.',4000);
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
// Version 224 (Bryan): the squad takes the guns itself as it starts; a tap on an empty gun, on the map or on its tile, sends the nearest free squad
// mate, and one of the other troops only when no squad mate is left ("it only says NPC if no squad mates are left"); a tap on a gun a squad mate
// holds puts the player behind it (first person, ddfp.js); from there BACK leaves the view with him still on it and LEAVE GUN takes him off it.
const dcFreeMen=()=>players.filter(u=>alive(u)&&!u.dcGun&&!u.onGun&&!u.carry&&!u.fp&&!u.inBoat);
function dcFill(g){
  const by=(a,b)=>(a.ddRole==='medic')-(b.ddRole==='medic')||hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y);
  for(const u of dcFreeMen().sort(by))if(dcMan(u,g)){callout(u,g.t==='art'?'To the field gun':'To the gun',C0());return u;}
  if(g.man||g.going)return null;
  for(const u of dd.npcs.filter(u=>alive(u)&&!u.dcGun).sort(by))if(dcMan(u,g))return u;
  return null;
}
// as it starts: the gunners to the heavy guns, a Demo man to the field gun, the riflemen to the nests; then whoever is left (a medic last)
function dcAuto(){
  const C=dd.dc,want={a1:'demo',h1:'gunner',n1:'rifle',n2:'rifle'},free=()=>players.filter(u=>alive(u)&&!u.dcGun);
  for(const g of C.guns){const u=free().filter(q=>q.ddRole===want[g.k]).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(u)dcMan(u,g);}
  for(const g of C.guns)if(!g.going){const u=free().sort((a,b)=>(a.ddRole==='medic')-(b.ddRole==='medic')||hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(u&&players.filter(alive).length>C.guns.filter(q=>q.going).length+2)dcMan(u,g);}
  free().forEach((u,i)=>{const s=DCA.hold[i%DCA.hold.length],p=findPath(u.x,u.y,s[0],s[1]);if(p)u.path=p;});   // (the rest at the flag: it's lost if none of ours is by it)
}
function dcLeave(g){const u=g&&g.man;if(!u)return;if(u.onGun){u.onGun=null;u.gunner=false;}u.dcGun=null;g.man=null;if(isFree(u.x,u.y+14,5))u.y+=14;}
function dcTile(k){
  const C=dd.dc,g=C.guns.find(q=>q.k===k);if(!g||C.ph==='intro'||state!=='play'||endAt)return;C.picked=true;
  if(g.dead){dcFixSend(g,true);return;}
  const m=g.man;
  if(m&&!m.npc){if(typeof fpEnter==='function'&&(!dd.fp||dd.fp.u!==m)){fpEnter(m,'1p');if(dd.fp){dd.fp.a=-Math.PI/2;dd.fp.p=-.04;}}return;}
  if(g.going&&!g.going.npc)return;
  if(!dcFill(g)&&!(g.man||g.going))banner('Nobody left to man it.',1600);
}
function dcTap(wx,wy){const C=dd.dc;if(C.ph==='intro')return true;const g=dcGunAt(wx,wy);if(!g)return false;dcTile(g.k);return true;}
// a thumb on one of theirs, from above: every gun that can bear turns on him until he's down (dcGunsTick); a tank the same
function dcFocus(e,K){const C=dd.dc;C.focus=e||null;C.focusK=K||null;C.focusT=simT;}
const C0=()=>typeof C!=='undefined'&&C.good?C.good:'#5fe08e';
function dcFire(g,x,y){
  g.fireT=simT+DCA.art.reload;g.aim=null;const by=g.man;
  nades.push({x0:g.x,y0:g.y-14,x1:x,y1:y,t:0,dur:clamp(hyp(x-g.x,y-g.y)/520,.7,1.9),by,R:DCA.art.R,D:DCA.art.D,shell:true});
  flashes.push({x:g.x,y:g.y-44,t:0});if(typeof sfxCannon==='function')sfxCannon(g.x,g.y);shake(.35);
  const m=DD.dcGuns&&DD.dcGuns[g.k];if(m){m.rotation.y=-Math.atan2(y-g.y,x-g.x);m.userData.kick=1;}
}
// a tank's shell on a gun (Bryan, after Version 159: "A tank can knock a gun out, in three hits. You can see it smoke after one, then dark smoke
// after 2"): a shell landing within DCA.gunHit of it is a hit; one and it smokes, two and the smoke is dark, three and it's wrecked for the fight
function dcGunHit(g,d){
  if(g.dead)return;g.hp-=d??DCA.hv.shell;const m=DD.dcGuns&&DD.dcGuns[g.k],h0=g.hits;g.hits=g.hp<=0?3:g.hp<g.hp0*.4?2:g.hp<g.hp0*.75?1:0;
  if(g.hp>0){if(g.hits>h0)banner(g.hits===1?`${g.n} is hit.`:`${g.n} is badly hit.`,2200);return;}
  // (Version 224, Bryan: "Stationary guns can be destroyed ... they can blow up, incapacitating the squad mate (can be healed by a medic)")
  g.dead=true;g.aim=null;if(dd.dc.art===g)dd.dc.art=null;const man=g.man;
  for(const u of[g.man,g.going])if(u){if(u.onGun){u.onGun=null;u.gunner=false;}if(u.dcGun===g)u.dcGun=null;}g.man=null;g.going=null;
  if(man&&alive(man)){if(man.fp&&typeof fpExit==='function')fpExit(`${g.n} is knocked out.`);if(isFree(man.x,man.y+12,5))man.y+=12;man.hp=Math.min(man.hp,1);damage(man,30,null);}
  if(m){m.rotation.z=.32;m.rotation.x=.12;m.position.y-=2;m.traverse(o=>{if(o.material){o.userData.dcM0=o.material;o.material=o.material.clone();if(typeof ddgBurnMat==='function')ddgBurnMat(o.material);else o.material.color.setHex(0x1b1a18);}});}   // (Version 190: charred brown-grey, not black)
  for(let q=0;q<3;q++)booms.push({x:g.x+(Math.random()-.5)*24,y:g.y+(Math.random()-.5)*20,t:-q*.1,size:1});tankFires.push({x:g.x,y:g.y-8,r:9,t0:simT,puffs:[],emit:0});
  shake(.6);if(typeof sfxBoom==='function')sfxBoom(g.x,g.y,1.1);banner(`${g.n} is knocked out.`,3200);
}
// a heavy machine gun on a tank: a little off it each burst, and its next shot put back while it's being hit
function dcHvTank(K,k){if(!K||K.hp<=0)return;K.hp-=DCA.hv.tank*(k||1);K.fireT=Math.max(K.fireT||0,simT+1.6);if(K.hp<=0){K.hp=1;ddTankHit(K.x,K.y,1,3);}}
// Version 226 (Bryan, asked whether the Engineer should repair destroyed guns: "yes"): a knocked-out gun is put right by an Engineer (the bazooka
// man) standing at it DCA.fixT seconds. A tap on the gun sends the nearest one (off his own gun if need be); one with nothing to do goes by himself.
function dcFixSend(g,say){
  if(!g.dead)return false;if(g.fix&&alive(g.fix.u)){if(say)banner(`${g.fix.u.name} is repairing the ${g.n.toLowerCase()}.`,1600);return true;}
  const E=players.filter(u=>alive(u)&&u.ddRole==='demo'&&!u.fp&&(u.fixN||0)<DCA.fixN&&!dd.dc.guns.some(q=>q.fix&&q.fix.u===u)).sort((a,b)=>(!!a.dcGun-!!b.dcGun)||hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y));
  const u=say?E[0]:E.find(q=>!q.dcGun);if(!u){if(say)banner(players.some(q=>alive(q)&&q.ddRole==='demo'&&(q.fixN||0)<DCA.fixN)?'No Engineer free to repair it.':'The Engineers are out of repair supplies.',2000);return false;}
  if(u.dcGun){const o=u.dcGun;if(o.man===u)dcLeave(o);else{o.going=null;u.dcGun=null;}}
  const p=findPath(u.x,u.y,g.x,g.y+16)||findPath(u.x,u.y,g.x+16,g.y+10);if(p){u.path=p;u.lastOrder=simT;}g.fix={u,t:0};
  if(say)banner(`${u.name} goes to repair the ${g.n.toLowerCase()}.`,2000);return true;}
const dcFixLeft=()=>players.some(q=>alive(q)&&q.ddRole==='demo'&&(q.fixN||0)<DCA.fixN);
function dcFixTick(dt){
  const C=dd.dc;C.fixT=(C.fixT||0)-dt;const look=C.fixT<=0;if(look)C.fixT=1.5;
  for(const g of C.guns){if(!g.dead){g.fix=null;continue;}const f=g.fix;
    if(!f){if(look&&C.ph!=='intro')dcFixSend(g,false);continue;}
    const u=f.u;if(!alive(u)||u.dcGun||u.fp){g.fix=null;continue;}
    u.lastOrder=simT;if(hyp(u.x-g.x,u.y-g.y)>34){if(!u.path||!u.path.length){f.w=(f.w||0)+dt;if(f.w>2)g.fix=null;}continue;}
    u.lastOrder=simT;if(u.sup>PINNED)continue;f.t+=dt;
    if(f.t>=DCA.fixT){g.dead=false;g.fix=null;g.hp=Math.round(g.hp0*.6);g.hits=1;g.mhp=null;g.fireT=simT+2;
      const m=DD.dcGuns&&DD.dcGuns[g.k];if(m){m.rotation.z=0;m.rotation.x=0;m.position.y+=2;m.traverse(o=>{if(o.userData.dcM0){o.material=o.userData.dcM0;o.userData.dcM0=null;}});}
      for(let i=tankFires.length-1;i>=0;i--)if(hyp(tankFires[i].x-g.x,tankFires[i].y+8-g.y)<4)tankFires.splice(i,1);
      u.fixN=(u.fixN||0)+1;banner(`${u.name} has the ${g.n.toLowerCase()} working again. ${u.fixN>=DCA.fixN?'He is out of supplies.':(DCA.fixN-u.fixN)+' repair left.'}`,3000);dcFill(g);}}}
// Version 233 (Bryan: "light machine guns shooting through the windows. Keep them as small slits as now. The building can be destroyed with
// explosions, that's how you kill them"): the blockhouse's three slits toward the base each hold a light machine gun. Nothing reaches the men
// inside but a blast: it takes DCA.checkHp of our explosions (ddplay.js's ddBlast, as any object with hp; ddWreck hands it to dcCheckWreck).
function dcSlits(){const C=dd.dc,c=DCA.check;return C.slits||(C.slits=[-24,0,24].map((dx,i)=>({x:c.x+c.w/2+dx,y:c.y+c.h+3,t:2+i*.6})));}
function dcSlitTick(dt){
  const C=dd.dc,co=objs.find(o=>o.tag==='check');if(!co||co.gone||C.ph==='intro'&&!(dd.seq&&dd.seq.dc))return;const P=DCA.slit;
  for(const s of dcSlits()){if((s.t-=dt)>0)continue;s.t=P.every[0]+Math.random()*(P.every[1]-P.every[0]);
    let best=null,bd=P.range;for(const u of[...players,...dd.npcs]){if(!alive(u)||u.y<s.y+10)continue;const d=hyp(u.x-s.x,u.y-s.y);if(d<bd&&Math.abs(u.x-s.x)<d*.85&&los(s.x,s.y+6,u.x,u.y)){bd=d;best=u;}}
    if(!best){s.t=.5;continue;}
    const cv=coverAt(best.x,best.y,s.x,s.y),k=cv>=2?.4:cv>=1?.65:1,p=clamp(P.hit*(1-bd/(P.range*1.25))*k,.05,.4);
    for(let r=0;r<P.rounds;r++){const hit=Math.random()<p,tx=best.x+(hit?0:(Math.random()-.5)*26),ty=best.y+(hit?0:(Math.random()-.5)*26);tracers.push({x1:s.x,y1:s.y,x2:tx,y2:ty,t:-r*.07,col:'255,140,100'});
      if(hit)damage(best,P.dmg[0]+Math.random()*(P.dmg[1]-P.dmg[0]),null);}
    best.sup=Math.min(1,(best.sup||0)+.1);best.firedOnT=simT;if(typeof ddSpark==='function')ddSpark(s.x,ddH(s.x,s.y)+17,s.y,1);
    try{if(typeof sfxShotDD==='function')sfxShotDD({x:s.x,y:s.y,side:'E',id:'SL'+s.x,weapon:'mg',gunner:true});}catch(e){}}
}
function dcCheckWreck(o){
  const C=dd.dc;C.checkDead=true;const cx=o.x+o.w/2,cy=o.y+o.h/2;
  for(const m of o.meshes||[]){if(m.material&&m.material.color){m.material=m.material.clone();if(typeof ddgBurnMat==='function')ddgBurnMat(m.material);else m.material.color.setHex(0x2a2826);}}
  if(o.roof){o.roof.rotation.z=.16;o.roof.rotation.x=-.1;o.roof.position.y-=7;}
  for(let k=0;k<4;k++)booms.push({x:cx+(Math.random()-.5)*o.w,y:cy+(Math.random()-.5)*o.h,t:-k*.14,size:1.3});tankFires.push({x:cx,y:cy,r:o.w/3,t0:simT,puffs:[],emit:0});
  dd.killed=(dd.killed||0)+3;shake(1);if(typeof sfxBoom==='function')sfxBoom(cx,cy,1.4);banner('Their blockhouse is destroyed. Its machine guns are silent.',3200);
}
function dcGunsTick(dt){
  dcFixTick(dt);dcSlitTick(dt);
  const C=dd.dc,foes=enemies.filter(e=>!beaten(e)),tanks=ddTanksUp();
  for(const p of dd.allies||[]){const on=!!(p.dcGun&&p.dcGun.man===p);if(on&&!p.dug){p.dug=1;p.dmgIn=(p.dmgIn||1)*DCA.dug;}else if(!on&&p.dug){p.dug=0;p.dmgIn=(p.dmgIn||1)/DCA.dug;}}   // (behind his gun's bags)
  for(const sh of C.shells.slice())if(simT>=sh.at){C.shells.splice(C.shells.indexOf(sh),1);for(const g of C.guns)if(hyp(sh.x-g.x,sh.y-g.y)<DCA.gunHit)dcGunHit(g,sh.D||DCA.hv.shell);}
  if(C.focus&&beaten(C.focus))C.focus=null;if(C.focusK&&!(C.focusK.hp>0))C.focusK=null;
  for(const g of C.guns){
    if(g.hits&&(g.smokeT-=dt)<=0&&DD.rk&&DD.rk.puff){g.smokeT=g.hits>=2?.11:.22;const h=ddH(g.x,g.y)+(g.t==='art'?16:12);   // one hit: thin grey smoke; two: thick and dark; wrecked: black
      DD.rk.puff(g.x+(Math.random()-.5)*8,h,g.y-8+(Math.random()-.5)*8,g.hits>=2?7+Math.random()*4:4+Math.random()*2.5,g.hits>=2?3.4:2.4,g.hits>=3?0x161514:g.hits===2?0x2b2927:0x9a9690,g.hits>=2?13:9);}
    if(g.dead)continue;
    const m=g.man;if(m&&alive(m)&&m.dcGun===g&&m.path.length){m.path=[];m.x=dcSeat(g).x;m.y=dcSeat(g).y;}   // (he stays on it: only LEAVE GUN, or a tap that sends him to another gun, takes him off: Version 224)
    if(m&&alive(m)&&m.dcGun===g){if(g.mhp!=null&&m.hp<g.mhp)dcGunHit(g,(g.mhp-m.hp)*DCA.hv.man);g.mhp=m.hp;if(g.dead)continue;   // (what hits its man hits the gun too)
      if(g.t==='mg'&&!m.fp){if(C.focus&&m.focus!==C.focus)m.focus=C.focus;   // (every gun on the one the player put his thumb on)
        const K=g.hv?(C.focusK||(simT-(m.shotAtT||-9)<1.5?null:tanks.filter(q=>!q.hold&&hyp(q.x-g.x,q.y-g.y)<DCA.hv.range&&q.y<g.y).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0])):null;
        if(K&&simT>=g.hvT&&hyp(K.x-g.x,K.y-g.y)<DCA.hv.range&&Math.abs(Math.atan2(Math.sin(Math.atan2(K.y-g.y,K.x-g.x)+Math.PI/2),Math.cos(Math.atan2(K.y-g.y,K.x-g.x)+Math.PI/2)))<g.arc){g.hvT=simT+DCA.hv.every;dcHvTank(K);m.ang=Math.atan2(K.y-g.y,K.x-g.x);m.aimT=simT;
          for(let q=0;q<4;q++)tracers.push({x1:g.x,y1:g.y-8,x2:K.x+(Math.random()-.5)*26,y2:K.y+(Math.random()-.5)*20,t:-q*.05,col:'255,231,163'});flashes.push({x:g.x,y:g.y-10,t:0});sparks.push({x:K.x,y:K.y,t:0});if(typeof sfxShotDD==='function')sfxShotDD(m);}}}
    else g.mhp=null;
    if(m&&(!alive(m)||m.path.length||m.dcGun!==g)){if(m.onGun){m.onGun=null;m.gunner=false;}if(m.dcGun===g)m.dcGun=null;g.man=null;if(C.art===g)C.art=null;}
    const u=g.going;if(u){const s=dcSeat(g);if(!alive(u)||u.dcGun!==g||simT-g.goT>40)g.going=null;
      else if(!u.path.length){g.going=null;if(hyp(u.x-s.x,u.y-s.y)<16&&!g.man){g.man=u;g.manT=simT;u.x=s.x;u.y=s.y;u.ang=-Math.PI/2;u.aimT=simT;
        if(g.t==='mg'){u.onGun={x:g.x,y:g.y,ang:-Math.PI/2,arc:g.arc};u.gunner=true;}if(!u.npc)callout(u,g.t==='art'?'On the field gun':'On the gun',C0());}else if(u.dcGun===g)u.dcGun=null;}}
    const mesh=DD.dcGuns&&DD.dcGuns[g.k];if(mesh&&mesh.userData.barrel){const k=mesh.userData.kick=Math.max(0,(mesh.userData.kick||0)-dt*2.5);mesh.userData.barrel.position.x=30-k*9;}
    if(g.t!=='art'||!g.man||simT<g.fireT||C.ph==='setup'||C.ph==='intro')continue;
    if(g.man.fp)continue;   // (the player is behind it: it fires when he does, ddfp.js)
    if(g.aim){dcFire(g,g.aim.x,g.aim.y);continue;}
    {const fo=C.focusK?{x:C.focusK.x+Math.cos(C.focusK.ang)*30,y:C.focusK.y+Math.sin(C.focusK.ang)*30}:C.focus?{x:C.focus.x,y:C.focus.y}:null;   // (the one the player put his thumb on, first)
      if(fo){const d=hyp(fo.x-g.x,fo.y-g.y);if(d>DCA.art.min&&d<DCA.art.max&&!dd.allies.some(a=>hyp(a.x-fo.x,a.y-fo.y)<100)){dcFire(g,fo.x+(Math.random()-.5)*24,fo.y+(Math.random()-.5)*24);continue;}}}
    // by itself: the nearest tank in reach, else where their men are thickest
    let best=null,bs=0;for(const K of tanks){const d=hyp(K.x-g.x,K.y-g.y);if(d>DCA.art.min&&d<DCA.art.max&&K.y>DCA.treeY-40){const s=900-d;if(s>bs){bs=s;best={x:K.x+Math.cos(K.ang)*30,y:K.y+Math.sin(K.ang)*30};}}}
    if(!best)for(const e of foes){const d=hyp(e.x-g.x,e.y-g.y);if(d<DCA.art.min||d>DCA.art.max||e.y<DCA.treeY-20)continue;const n=foes.filter(o=>hyp(o.x-e.x,o.y-e.y)<70).length;
      if(dd.allies.some(a=>hyp(a.x-e.x,a.y-e.y)<110))continue;if(n>bs){bs=n;best={x:e.x,y:e.y};}}
    if(best&&(bs>=2||tanks.length))dcFire(g,best.x+(Math.random()-.5)*36,best.y+(Math.random()-.5)*36);
  }
}
// the other troops: at their posts on the wall, and onto any gun the squads have left empty once the setting-up is over
function dcNpc(){
  const C=dd.dc,foes=enemies.filter(e=>!beaten(e));
  for(const u of dd.npcs){if(!alive(u)||u.dcGun||!u.post)continue;
    if(u.post!==u.back&&u.back&&(u.hp<70||foes.some(e=>hyp(e.x-u.post.x,e.y-u.post.y)<260)||dd.tanks.some(K=>K.hp>0&&!K.hold&&hyp(K.x-u.post.x,K.y-u.post.y)<230))){u.post=u.back;u.hopT=0;}   // (it's on top of him: back to the line)
    if(!u.path.length&&hyp(u.x-u.post.x,u.y-u.post.y)>30&&simT>(u.hopT||0)){const p=findPath(u.x,u.y,u.post.x,u.post.y);if(p)u.path=p;u.hopT=simT+4;}}
  if(C.ph==='intro'||C.ph==='setup')return;
  if(dcFreeMen().length)return;   // (a squad mate is free: the gun waits for the player's tap)
  for(const g of C.guns){if(g.man||g.going||g.dead)continue;
    const free=dd.npcs.filter(u=>alive(u)&&!u.dcGun).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(free)dcMan(free,g);}
}

/* ---------- the enemy ---------- */
function dcSpawnWave(n){
  const W=DCA.waves[n-1],tag='w'+n;
  if(n>1)for(let i=0;i<W.inf;i++){const lane=n===2?560+(i/(W.inf-1))*280:(i%2?250+(i/W.inf)*260:720+(i/W.inf)*250);
    const e=ddFoe(tag,lane-DDX+(Math.random()-.5)*30,DCA.treeY-60-Math.random()*90,{ang:Math.PI/2,nade:i%5===0?1:0});e.lane=lane;e.stage=-1;enemies.push(e);}
  for(const e of enemies)if(e.tag===tag){e.cool=Math.min(e.cool,1+Math.random()*2);e.stage=0;e.advT=simT+Math.random()*3;e.gait=null;}
  for(const K of dd.tanks)if(K.w===n&&K.hp>0){K.hold=false;K.i=0;}
  banner(n===1?'Here they come: infantry across the whole field.':n===2?'Wave 2: a tank on the road, mortars on the nests.':'Wave 3: two tanks, one on each flank.',3600);
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
    else{tx=DCA.flag.x+(Math.random()-.5)*90;ty=DCA.flag.y+(Math.random()-.5)*60;}   // (the flag)
    const s=openSpot(clamp(tx,DCA.x0+30,DCA.x1-30),ty,taken)||{x:tx,y:ty},p=findPath(e.x,e.y,s.x,s.y,FOOT);
    if(p&&p.length){e.path=p;e.zone={x0:s.x-110,x1:s.x+110,y0:s.y-90,y1:s.y+90};e.stage=Math.min(st+1,DC_STAGE.length+1);e.advT=simT+(st>=DC_STAGE.length?2:3.5+Math.random()*4.5);}
    else e.advT=simT+2;}
  // mortars with the second wave: a shell now and then on a manned forward nest
  if(C.ph==='w2'&&simT>(C.mortT||0)){C.mortT=simT+7+Math.random()*5;const L=C.guns.filter(g=>g.k[0]==='n'&&g.man);if(L.length){const g=L[(Math.random()*L.length)|0],mx=g.x+(Math.random()-.5)*56,my=g.y+(Math.random()-.5)*56;ddShell({x:g.x+(Math.random()-.5)*300,y:DCA.treeY-200,side:'E',name:'Mortar',stats:{}},mx,my,44,62,2.4);C.shells.push({x:mx,y:my,at:simT+2.4,D:DCA.hv.mortar});}}
}
// a man lost, and somebody in the reserve: he comes out of the barracks for him
function dcReplace(){   // (Version 224, Bryan: "No reinforcements this time": nobody comes out of the barracks for a man lost)
  for(const q of dd.queue)if(q.body)q.body.noRev=true;dd.queue.length=0;dd.pool=0;
}
function dcNoRe(){let el=$('#dcNoRe');if(!el){el=document.createElement('div');el.id='dcNoRe';el.textContent='NO REINFORCEMENTS';stage.appendChild(el);}el.classList.remove('on');void el.offsetWidth;el.classList.add('on');}

/* ---------- the fight's clock ---------- */
function dcTick(dt){
  const C=dd.dc;C.t+=dt;
  ddAllDown();ddDeadTick();dd.pool=0;
  dcGunsTick(dt);ddHot();ddTankTick(dt);
  if((dd.aiT-=dt)<=0){dd.aiT=1;ddMedics();if(!dd.seq&&typeof ddcLead==='function'&&ddcLead()){ddcLeadCheck();ddcSupport(dd.active==='A'?'B':'A');}}   // (Version 168: ddctl.js)
  if((dd.npcT-=dt)<=0){dd.npcT=.5;dcNpc();dcEnemy();dcReplace();ddHelpers();ddTidy();updateObjUI();}
  const left=n=>enemies.filter(e=>e.tag==='w'+n&&!beaten(e)).length+dd.tanks.filter(K=>K.w===n&&K.hp>0).length;
  if(dd.seq&&dd.seq.dc){dcSeqTick(dt);}   // (Version 228: the opening, ddcseq.js; it ends in the first wave)
  else if(C.ph==='intro'){if(C.t>4.2&&!C.back){C.back=1;camPan={from:{x:camT.x,z:camT.z,zoom},to:{x:DCA.square.x,z:DCA.wallY-34+DD_CAM.look,zoom:7.4},t:0,dur:1.6};}
    if(C.t>6){C.ph='setup';C.t=0;dcNoRe();}}
  else if(C.ph==='setup'){if(C.t>=DCA.setup){C.ph='w1';C.wave=1;C.t=0;dcSpawnWave(1);}}
  else if(C.ph==='lull'){if(C.t>=DCA.lull){C.wave++;C.ph='w'+C.wave;C.t=0;dcSpawnWave(C.wave);}}
  else if(C.t>4&&left(C.wave)===0){
    if(C.wave>=3){if(!dd.won){dd.won=true;if(dd.fp&&typeof fpExit==='function')fpExit('The last of them is down.');endAt=performance.now()+2200;banner('The last of them is down. Base held.',4000);}}
    else{C.ph='lull';C.t=0;banner(`Wave ${C.wave} broken. ${DCA.lull} s before the next.`,3600);}}
  // the flag: theirs if they stand at it for DCA.flagT s with none of ours there (it was the command post, and 20 s, until Version 224)
  const inCp=enemies.filter(e=>!beaten(e)&&dcIn(e,DCA.cpZone)).length+dd.tanks.filter(K=>K.hp>0&&dcIn(K,DCA.cpZone)).length,ours=dd.allies.filter(u=>alive(u)&&dcIn(u,DCA.cpZone)).length;
  C.cpT=inCp&&!ours?C.cpT+dt:Math.max(0,C.cpT-dt*2);C.cpN=inCp;
  if(!endAt&&!dd.won){
    if(C.cpT>=DCA.flagT){dd.over=true;dd.why='cp';if(dd.fp&&typeof fpExit==='function')fpExit('They have the flag.');endAt=performance.now()+1500;}
    else if(!players.some(alive)&&!dd.queue.length&&players.every(p=>p.dead||p.revive===0)){dd.over=true;dd.why='dead';endAt=performance.now()+1800;}}
}
function dcHint(){
  const C=dd.dc;
  if(C.ph==='intro')return'They are coming. In a moment the guns are yours.';
  return'Your men are on the guns. Tap a gun, on the map or in the row at the bottom, to fire it yourself; an empty one, to send a man to it. A thumb on one of theirs turns every gun on him. The field gun and the bazookas are for the tanks. Nobody comes to replace the fallen: lose the flag, or everyone, and it is lost.';
}
function dcDraw(){
  const C=dd.dc,lab=(x,y,h,text,col,sz=9)=>{toSBack=false;const[sx,sy]=toS(x,y,h);if(!toSBack&&sx>-40&&sx<cw+40&&sy>0&&sy<ch)label(text,sx,sy,col,sz,700);};
  {const co=objs.find(o=>o.tag==='check');if(co){const c=DCA.check;lab(c.x+c.w/2,c.y+c.h/2,48,co.gone?'BLOCKHOUSE · DESTROYED':co.hp<DCA.checkHp?`BLOCKHOUSE · ${Math.max(1,Math.round(co.hp/DCA.checkHp*100))}%`:'BLOCKHOUSE · BLOW IT UP',co.gone?'#8b949c':'#ff8a7e');}}
  // each gun's circle: gold and dashed for one to man, the squad's blue for one a squad mate holds, grey for one knocked out (not from behind a gun)
  if(!dd.fp)for(const g of C.guns){const m=g.man,mine=m&&!m.npc;toSBack=false;const p=toS(g.x,g.y,1);if(toSBack||p[0]<-60||p[0]>cw+60||p[1]<0||p[1]>ch)continue;
    ox.save();ox.beginPath();ox.ellipse(p[0],p[1],30,15,0,0,7);ox.lineWidth=2.5;ox.strokeStyle=g.dead?'rgba(139,148,156,.7)':mine?'rgba(88,196,246,.9)':m?'rgba(255,138,126,.9)':'rgba(255,215,106,.95)';if(!m&&!g.dead)ox.setLineDash([7,5]);ox.stroke();ox.restore();
    lab(g.x,g.y,g.t==='art'?34:24,g.dead?(g.fix&&hyp(g.fix.u.x-g.x,g.fix.u.y-g.y)<=34?`${g.n} · REPAIRING ${Math.max(1,Math.ceil(DCA.fixT-g.fix.t))}`:g.fix?`${g.n} · ENGINEER COMING`:dcFixLeft()?`${g.n} · TAP TO REPAIR`:`${g.n} · KNOCKED OUT`):m?(mine?`${g.n} · ${m.name.toUpperCase()}`:`${g.n} · NPC`):g.going?`${g.n} · ON HIS WAY`:`${g.n} · TAP TO MAN`,g.dead?'#8b949c':m?(mine?'#8fd0ff':'#ff8a7e'):'#ffcf4a');
    if(!g.dead&&g.hp<g.hp0){toSBack=false;const q=toS(g.x,g.y,g.t==='art'?44:33);if(!toSBack)bar(q[0]-16,q[1],32,Math.max(0,g.hp/g.hp0),g.hp<g.hp0*.4?'#ff7a4a':'#ffcf4a');}}
  // the one every gun is on
  {const e=dd.fp?null:C.focusK||C.focus;if(e){toSBack=false;const q=toS(e.x,e.y,C.focusK?18:10);if(!toSBack){ox.save();ox.strokeStyle='rgba(255,179,107,.8)';ox.lineWidth=1.6;ox.setLineDash([7,6]);
      for(const g of C.guns){if(g.dead||!g.man)continue;toSBack=false;const p=toS(g.x,g.y,8);if(toSBack)continue;ox.beginPath();ox.moveTo(p[0],p[1]);ox.lineTo(q[0],q[1]);ox.stroke();}
      ox.setLineDash([]);ox.lineWidth=3;ox.strokeStyle='#ff5a4e';ox.beginPath();ox.arc(q[0],q[1],16,0,7);ox.stroke();for(const[a,b]of[[0,-1],[0,1],[-1,0],[1,0]]){ox.beginPath();ox.moveTo(q[0]+a*10,q[1]+b*10);ox.lineTo(q[0]+a*25,q[1]+b*25);ox.stroke();}ox.restore();}}}
  // (Version 167: the tanks' health is ddplay.js's ddDrawTargets' bar; the flag and its clock are in the objective pill, ddhud.js)
  for(const m of players)if(m.raise&&m.raise.p>0&&alive(m)){const c=m.raise.t,[sx,sy]=toS(c.x,c.y,20);label(`REVIVING ${Math.round(m.raise.p/12*100)}%`,sx,sy,'#5fe08e',10,700);}
  dcBar();
}
// the row of guns (Bryan's pick of the drafts, docs/drafts/v225-guns.jpg): a tile a gun, who is on it and what it's doing; a white arrow and
// "Man a Gun" until the player has picked his first; along the bottom from above, along the top from behind a gun
function dcBar(){
  let el=$('#dcBar');const C=dd&&dd.dc,show=!!C&&state==='play'&&C.ph!=='intro'&&!dd.seq&&!endAt;
  if(!el){if(!show){document.body.classList.remove('dcg');return;}el=document.createElement('div');el.id='dcBar';stage.appendChild(el);
    el.addEventListener('click',ev=>{const b=ev.target.closest('[data-k]');if(!b||!dd||!dd.dc)return;ev.stopPropagation();if(b.dataset.k==='back'){if(dd.fp)fpExit();}else if(b.dataset.k==='leave'){if(dd.fp){const g=dd.fp.u.dcGun;fpExit('Off the gun.');if(g)dcLeave(g);}}else dcTile(b.dataset.k);dcBar();});
    for(const t of['pointerdown','pointerup','touchstart'])el.addEventListener(t,ev=>ev.stopPropagation());}
  if(el.hidden!==!show)el.hidden=!show;document.body.classList.toggle('dcg',show);if(!show)return;   // (dcg: the squad's own bar gives way to the guns')
  const fpU=dd.fp?dd.fp.u:null,foc=!!(C.focus||C.focusK);
  const h=(C.picked||fpU?'':'<div class="dcb-hd"><svg viewBox="0 0 22 26"><path d="M8 0h6v14h6L11 26 2 14h6z" fill="#fff"/></svg>Man a Gun</div>')+'<div class="dcb-row">'+C.guns.map(g=>{const m=g.man,you=!!fpU&&m===fpU,npc=!!m&&m.npc;
    const who=g.dead?'destroyed':you?'YOU':m?(npc?'Private':m.name):g.going?'coming':'empty',st=g.dead?(g.fix?'REPAIRING':dcFixLeft()?'TAP TO REPAIR':'KNOCKED OUT'):!m?(g.going?'ON HIS WAY':'TAP TO MAN'):g.t==='art'?(simT<g.fireT?'RELOAD '+Math.ceil(g.fireT-simT):foc?'ON TARGET':'LOADED'):foc?'ON TARGET':simT-(m.shotT||-9)<1.6||simT<g.hvT+.4?'FIRING':'READY';
    return`<button type="button" data-k="${g.k}" class="dcb-t${you?' you':''}${g.dead?' dead':''}${!m&&!g.dead&&!g.going?' empty':''}${foc&&m&&!g.dead?' tg':''}">${npc?'<u>NPC</u>':''}<i>${g.n}${g.k==='n1'?' 1':g.k==='n2'?' 2':''}</i><b>${who}</b><span>${st}</span><em style="width:${Math.max(0,Math.round(g.hp/g.hp0*100))}%"></em></button>`;}).join('')+'</div>'
    +(fpU&&fpU.dcGun?'<div class="dcb-row two"><button type="button" data-k="back">‹ BACK<small>he stays on the gun</small></button><button type="button" data-k="leave">LEAVE GUN<small>he gets off it</small></button></div>':'');
  if(el.dataset.h!==h){el.dataset.h=h;el.innerHTML=h;}
}
function dcFinishLost(){
  state='end';setStatus();$('#status').textContent='Lost';
  $('#endEyebrow').textContent='Base lost';$('#endTitle').textContent=dd.why==='cp'?'They took the flag':'The squads are gone';{const b=$('#dcBar');if(b)b.hidden=true;}
  $('#endText').textContent=`The counterattack got through in wave ${dd.dc.wave||1}. Your men are as they were when it began: try it again. The field gun and the bazookas for the tanks, the machine guns for the men in the open.`;
  {const q=$('#sq');if(q)q.hidden=true;}$('#againBtn').textContent='Try the counterattack again';$('#retryBtn').hidden=true;$('#end').hidden=false;
}
