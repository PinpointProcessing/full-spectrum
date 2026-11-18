/* ddvillage.js: Chapter 3, the advance on the village (Version 164). Bryan, after Version 163: "Can you build the next level after the
   defense. I want the troops to attack the neighboring village and take control. Basically an advance. Woods and a field before the
   village with fire fights then a large battle with reinforcements at the village. Leading to the village only has the player's squads.
   I would like a sequence before they set out ... after the counter attack."

   The same scene builder as the beach and the counterattack with DD_MODE 'village' (dday.js asks vgHeights, vgObjects, vgPaint,
   vgScenery, vgBuild; vgFrame each frame for the canopy and the trucks). South to north: the woods (the squads alone: pickets, a
   clearing with a hut, a machine gun dug in behind logs, a sniper, the edge), the field (a hedgerow across it with their machine gun in
   the gap on the road, an orchard on the left and a farm with a gun on the right, mortars behind), then the village (a barricade at its
   edge, houses along the main street, the square, the church with a sniper in its tower, the town hall). At the village Fox Company comes
   up behind the squads (the other troops, `dd.npcs`) and their reinforcements come in: two trucks, then a tank and men on foot.
   `dd.vil` is true and ddTick hands over to vgTick; `dd.vg` is the fight (ph 'woods' -> 'field' -> 'village'). Taking the barricade,
   the square, the church and the town hall (none of theirs left in it, one of ours there) and beating both of their reinforcements wins.

   Before it, the sequence (`dd.seq`, on the counterattack's map): the squads at ease on the parade square, the captain's briefing in the
   talk panel (story.js), then the column out of the gate and up the road, a fade, and the woods. */
const VG={x0:200,x1:1200,road:700,start:{x:700,y:852},
  clearA:{x:440,y:525,r:80},clearB:{x:950,y:448,r:68},
  hedgeY:-50,gaps:[[300,346],[672,728],[1008,1054]],villageY:-280,
  square:{x0:640,y0:-590,x1:760,y1:-450},
  zones:[{k:'gate',n:'THE BARRICADE',x0:596,y0:-362,x1:804,y1:-276,lx:700,ly:-300},{k:'square',n:'THE SQUARE',x0:636,y0:-596,x1:764,y1:-446,lx:700,ly:-520},
    {k:'church',n:'THE CHURCH',x0:408,y0:-760,x1:624,y1:-598,lx:500,ly:-640},{k:'hall',n:'THE TOWN HALL',x0:780,y0:-724,x1:962,y1:-582,lx:865,ly:-640}],
  // where the meta screens look once the village is theirs (ddmeta.js's ddmSpots): the town hall the barracks, the garage the depot
  meta:{bk:[865,-650],ar:[485,-456],vd:[1060,-422],hs:[500,-686]}};   // (the church the field hospital, Version 165)
if(typeof VAULTABLE!=='undefined'){VAULTABLE.add('vglog');VAULTABLE.add('vgwall');}   // (logs and low walls are climbed over, like sandbags: pathfinding.js)
const VG_TRACK=[[700,910],[688,800],[652,700],[648,600],[690,520],[728,450],[722,380],[700,320],[700,-770]];
const vgEdge=x=>318+18*Math.sin(x*.021)+10*Math.sin(x*.057+1);   // the woods' north edge
function vgTrackD(x,y){let b=1e9;for(let i=1;i<VG_TRACK.length;i++){const[a1,b1]=VG_TRACK[i-1],[a2,b2]=VG_TRACK[i],dx=a2-a1,dy=b2-b1,L=dx*dx+dy*dy||1,t=clamp(((x-a1)*dx+(y-b1)*dy)/L,0,1);b=Math.min(b,hyp(x-a1-dx*t,y-b1-dy*t));}return b;}
const vgTrackX=y=>{for(let i=1;i<VG_TRACK.length;i++){const[a1,b1]=VG_TRACK[i-1],[a2,b2]=VG_TRACK[i];if(y<=b1&&y>=b2){const t=(b1-y)/((b1-b2)||1);return a1+(a2-a1)*t;}}return VG.road;};
// the logs: half cover you can climb (the pickets', the clearings', the sniper's hide, and some for the squads on the way)
const VG_LOGS=[[592,560,38,8],[782,544,42,8],[408,562,44,8],[462,554,38,8],[482,494,30,14],[918,478,64,9],[892,470,24,8],[984,472,28,8],[746,416,34,8],
  [560,762,52,8],[820,742,46,8],[470,690,42,8],[900,646,48,8],[640,560,8,42],[350,642,44,8],[1080,562,42,8],[560,442,46,8],[862,520,8,42],[1060,702,42,8],[300,782,42,8],[1130,452,8,40],[300,470,44,8]];
const VG_FOX=[[520,346],[880,352],[742,340]];   // the woods' edge: foxholes, bags to the south
let VG_TREES=null;
function vgTrees(){
  if(VG_TREES)return VG_TREES;const r=rng(4242),L=[];
  const keep=[[610,548],[800,532],[430,545],[470,535],[400,520],[950,462],[912,455],[990,452],[762,402],...VG_FOX,[700,860],[650,850],[760,850]];
  const bad=(x,y)=>vgTrackD(x,y)<40||hyp(x-VG.clearA.x,y-VG.clearA.y)<VG.clearA.r||hyp(x-VG.clearB.x,y-VG.clearB.y)<VG.clearB.r||hyp(x-VG.start.x,y-VG.start.y)<95||keep.some(([kx,ky])=>hyp(x-kx,y-ky)<24)||VG_LOGS.some(([lx,ly,w,h])=>x>lx-12&&x<lx+w+12&&y>ly-12&&y<ly+h+12)||(x>380&&x<442&&y>466&&y<510);
  for(let i=0;i<12000&&L.length<235;i++){const x=VG.x0+14+r()*(VG.x1-VG.x0-28),e=vgEdge(x),y=e+16+r()*(886-e-16);if(bad(x,y))continue;if(L.some(t=>hyp(t.x-x,t.y-y)<37))continue;L.push({x,y,s:.85+r()*.6,k:'w'});}
  for(let x=246;x<=394;x+=37)for(let y=226;y>=10;y-=38)L.push({x:x+(r()-.5)*6,y:y+(r()-.5)*6,s:.5+r()*.14,k:'o'});   // the orchard
  return VG_TREES=L;
}
const VG_HOUSES=[[570,-400,80,70,48,'h'],[556,-492,80,64,52,'h'],[440,-402,90,60,46,'h'],[450,-484,70,56,48,'h'],[280,-382,100,60,44,'h'],
  [760,-400,80,70,50,'h'],[764,-492,80,64,48,'h'],[880,-412,90,70,52,'h'],[890,-492,70,60,46,'h'],[1010,-462,100,80,54,'g'],[1020,-362,80,50,42,'h'],
  [260,-642,100,70,48,'h'],[280,-742,100,60,46,'h'],[960,-652,100,70,50,'h'],[1080,-702,80,100,52,'h']];
const VG_BALES=[[470,236],[612,198],[848,232],[962,176],[378,60],[650,88],[760,22],[904,8],[540,-8],[1000,-112],[420,-128],[824,-140]];

/* ---------- the ground ---------- */
function vgHeights(){
  const{nx,ny}=DDG,a=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const x=i*10,y=DDB.y0+j*10;
    let h=Math.sin(x*.013+.7)*Math.cos(y*.011)*2.2;   // the woods' floor rolls a little
    if(y<330)h*=clamp((y+60)/390,0,1);               // the field smoother, the village flat
    h+=clamp((300-y)/560,0,1)*7;                      // up to the village's low rise
    a[j*nx+i]=h;}
  return a;
}
function vgObjects(){
  const L=[],o=(kind,x,y,w,h,ex)=>{const q=Object.assign({kind,x,y,w,h,full:false},ex||{});L.push(q);return q;};
  o('drop',0,-760,200,1660);o('drop',1200,-760,600,1660);
  // the woods: a trunk is heavy cover; a log is half cover you can climb over
  for(const t of vgTrees())o('vgtree',t.x-4,t.y-4,8,8,{cover:2,ht:14,tree:t});   // (not 'full': sight in the woods is cut by the leaves instead, vgSightOK; a trunk in every line of sight cost too much)
  for(const[x,y,w,h]of VG_LOGS)o('vglog',x,y,w,h,{cover:1,ht:8});
  o('vghut',380,468,58,38,{full:true,cover:2,ht:30});
  for(const[x,y]of VG_FOX){o('sandbag',x-16,y+12,32,8);o('sandbag',x-22,y-6,8,18);o('sandbag',x+14,y-6,8,18);}
  // the field: the hedgerow with its three gaps, the walls, bales, a cart, a tank knocked out the day before; the farm; the mortar pits
  {let x0=200;for(const[a,b]of VG.gaps){o('vghedge',x0,VG.hedgeY,a-x0,14,{full:true,cover:2,ht:22});x0=b;}o('vghedge',x0,VG.hedgeY,1200-x0,14,{full:true,cover:2,ht:22});}
  o('sandbag',684,-30,32,8);   // the gun's bags in the road's gap
  o('vgwall',420,150,180,7,{cover:1,ht:9});o('vgwall',790,80,140,7,{cover:1,ht:9});o('vgwall',556,-172,92,7,{cover:1,ht:9});
  for(const[x,y]of VG_BALES)o('vgbale',x-7,y-7,14,14,{cover:1,ht:11});
  o('vgcart',548,34,30,14,{cover:1,ht:12});o('ddwreck',818,186,54,30,{full:true,cover:2,ht:22});
  o('vghouse',990,50,90,62,{full:true,cover:2,ht:44,look:'farm'});o('vghouse',1100,-8,84,104,{full:true,cover:2,ht:52,look:'barn'});
  o('vgwall',996,128,64,7,{cover:1,ht:9});o('sandbag',1074,150,36,8);
  for(const[x,y]of[[560,-232],[860,-226]]){o('sandbag',x-18,y+12,36,8);o('sandbag',x-24,y-8,8,20);o('sandbag',x+16,y-8,8,20);}
  // the village: the barricade across the road, the houses, a ruin, the church and its tower, the town hall, the square
  o('sandbag',642,-312,44,9);o('sandbag',716,-306,48,9);o('vgcar',764,-334,40,20,{cover:2,ht:14,look:'car'});
  for(const[x,y,w,h,ht,look]of VG_HOUSES)o('vghouse',x,y,w,h,{full:true,cover:2,ht,look});
  for(const[x,y,w,h]of[[300,-472,70,8],[300,-464,8,30],[326,-410,74,8],[392,-464,8,26]])o('vgruin',x,y,w,h,{cover:2,ht:16});
  o('vghouse',440,-720,120,80,{full:true,cover:2,ht:64,look:'nave'});o('vghouse',560,-680,40,40,{full:true,cover:2,ht:124,look:'tower'});
  o('vgwall',410,-756,8,148,{cover:1,ht:9});o('vgwall',410,-608,136,7,{cover:1,ht:9});
  o('vghouse',800,-690,130,80,{full:true,cover:2,ht:58,look:'hall'});o('sandbag',838,-588,44,8);
  o('vgwell',693,-537,14,14,{cover:1,ht:10});o('sandbag',656,-468,32,8);o('sandbag',712,-464,32,8);o('vgcar',740,-566,36,18,{cover:2,ht:14,look:'truck'});
  for(const[x,y,w]of[[282,-312,96],[442,-334,86],[880,-334,90],[1012,-300,86],[1084,-560,70],[300,-560,90]])o('vgwall',x,y,w,7,{cover:1,ht:9});
  for(const[x,y]of[[688,-418],[930,-528],[478,-528],[1100,-522],[612,-354]])o('ddbould',x,y,18,15,{cover:1});
  for(const[x,y]of[[786,-440],[598,-446],[1150,-430]])o('ddcrate',x,y,22,20,{cover:1});
  return L;
}
function vgPaint(g){
  const S=DDS,r=rng(1946);g.setTransform(S,0,0,S,0,-DDB.y0*S);
  const blot=(n,x0,y0,w,h,cols,a0,a1,sz,ok)=>{for(let i=0;i<n;i++){const x=x0+r()*w,y=y0+r()*h;if(ok&&!ok(x,y))continue;g.fillStyle=`rgba(${cols[(r()*cols.length)|0]},${a0+r()*(a1-a0)})`;g.fillRect(x,y,sz*(.4+r()),sz*(.3+r()*.7));}};
  // the field and the pasture round everything
  g.fillStyle='#7c8f4c';g.fillRect(0,DDB.y0,1400,1660);blot(5200,0,DDB.y0,1400,1660,['58,82,40','150,170,96','104,124,62'],.05,.16,8);
  // the woods' floor: dark, leaf litter and moss
  const inWood=(x,y)=>y>vgEdge(x)-4;
  g.fillStyle='#4a5331';g.beginPath();g.moveTo(0,910);for(let x=0;x<=1400;x+=10)g.lineTo(x,vgEdge(x)-6);g.lineTo(1400,910);g.closePath();g.fill();
  blot(9000,0,280,1400,630,['92,70,40','120,86,46','70,84,40','150,110,60','52,60,34'],.12,.34,6,inWood);
  for(const t of vgTrees()){if(t.k!=='w')continue;const gr=g.createRadialGradient(t.x,t.y,2,t.x,t.y,26*t.s);gr.addColorStop(0,'rgba(30,34,20,.55)');gr.addColorStop(1,'rgba(30,34,20,0)');g.fillStyle=gr;g.fillRect(t.x-30,t.y-30,60,60);}
  for(const c of[VG.clearA,VG.clearB]){const gr=g.createRadialGradient(c.x,c.y,6,c.x,c.y,c.r+16);gr.addColorStop(0,'rgba(132,140,78,.9)');gr.addColorStop(1,'rgba(132,140,78,0)');g.fillStyle=gr;g.fillRect(c.x-c.r-20,c.y-c.r-20,c.r*2+40,c.r*2+40);}
  blot(260,380,480,120,90,['196,170,120','170,140,92'],.25,.6,3);   // sawdust round the woodcutters' hut
  // the track through the woods and on as the road: packed dirt, two ruts, the odd puddle
  const line=(w,col,dx)=>{g.strokeStyle=col;g.lineWidth=w;g.lineJoin='round';g.lineCap='round';g.beginPath();VG_TRACK.forEach(([x,y],i)=>i?g.lineTo(x+dx,y):g.moveTo(x+dx,y));g.stroke();};
  line(58,'#7a6a4a',0);line(46,'#8f7d58',0);line(3,'rgba(60,50,34,.55)',-12);line(3,'rgba(60,50,34,.55)',12);
  for(const[x,y]of[[694,780],[656,640],[700,505],[724,410],[700,180],[704,-90]]){g.fillStyle='rgba(70,80,84,.55)';g.beginPath();g.ellipse(x,y,9,5,0,0,7);g.fill();}
  // the field: wheat, a ploughed strip, the hedgerow's bank in shadow, shell holes; the farmyard; the orchard
  g.fillStyle='#c4ad62';g.fillRect(420,62,236,200);g.strokeStyle='rgba(150,120,60,.45)';g.lineWidth=2;for(let x=424;x<656;x+=7){g.beginPath();g.moveTo(x,62);g.lineTo(x,262);g.stroke();}
  g.fillStyle='#8b7350';g.fillRect(764,110,226,170);g.strokeStyle='rgba(60,46,30,.35)';g.lineWidth=2.4;for(let y=114;y<280;y+=8){g.beginPath();g.moveTo(764,y);g.lineTo(990,y);g.stroke();}
  g.fillStyle='rgba(40,46,28,.5)';g.fillRect(200,VG.hedgeY+14,1000,8);
  for(const[x,y,rr]of[[600,150,16],[782,-100,14],[480,40,12],[930,250,18],[660,-200,14],[350,-90,12],[1100,200,13]]){const gr=g.createRadialGradient(x,y,2,x,y,rr+8);gr.addColorStop(0,'rgba(40,34,24,.85)');gr.addColorStop(.7,'rgba(90,76,52,.6)');gr.addColorStop(1,'rgba(90,76,52,0)');g.fillStyle=gr;g.fillRect(x-rr-10,y-rr-10,rr*2+20,rr*2+20);}
  g.fillStyle='#9a8a62';g.fillRect(978,-14,214,170);blot(600,978,-14,214,170,['70,60,40','190,176,140'],.08,.2,5);
  g.fillStyle='rgba(96,124,60,.6)';g.fillRect(232,-6,172,252);
  // the village: gravel and earth, gardens, the cobbled streets and the square's paving, the churchyard
  g.fillStyle='#8c846e';g.fillRect(226,-760,948,486);blot(3000,226,-760,948,486,['70,64,50','190,180,150'],.06,.16,5);
  for(const[x,y,w,h]of[[290,-470,120,140],[440,-470,100,60],[880,-470,100,50],[1000,-560,160,80],[260,-560,140,50],[960,-740,100,80]]){g.fillStyle='rgba(96,128,62,.75)';g.fillRect(x,y,w,h);g.strokeStyle='rgba(70,56,36,.4)';g.lineWidth=2;for(let yy=y+8;yy<y+h;yy+=9){g.beginPath();g.moveTo(x+4,yy);g.lineTo(x+w-4,yy);g.stroke();}}
  const cob=(x,y,w,h)=>{g.fillStyle='#77746b';g.fillRect(x,y,w,h);for(let i=0;i<w*h/26;i++){g.fillStyle=`rgba(${r()<.5?'48,46,42':'170,166,156'},${.15+r()*.25})`;g.fillRect(x+r()*w,y+r()*h,2+r()*2.4,1.6+r()*2);}};
  cob(668,-760,64,500);cob(226,-542,948,44);
  g.fillStyle='#a49c88';g.fillRect(VG.square.x0,VG.square.y0,VG.square.x1-VG.square.x0,VG.square.y1-VG.square.y0);g.strokeStyle='rgba(80,74,62,.35)';g.lineWidth=1.2;
  for(let x=VG.square.x0;x<=VG.square.x1;x+=12){g.beginPath();g.moveTo(x,VG.square.y0);g.lineTo(x,VG.square.y1);g.stroke();}for(let y=VG.square.y0;y<=VG.square.y1;y+=12){g.beginPath();g.moveTo(VG.square.x0,y);g.lineTo(VG.square.x1,y);g.stroke();}
  g.fillStyle='#6d8446';g.fillRect(414,-756,206,150);
  for(const[x,y,w,h]of VG_HOUSES){g.fillStyle='rgba(40,36,30,.5)';g.fillRect(x-4,y-4,w+8,h+8);}
  // the road through the field and into the village
  g.fillStyle='#a08e66';g.fillRect(680,-280,40,600);
}
function vgScenery(sc){
  const far=new T.Mesh(new T.PlaneGeometry(9000,5000),new T.MeshStandardMaterial({color:0x667d44,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(700,-1.2,0);far.receiveShadow=true;sc.add(far);
  const hill=new T.Mesh(new T.PlaneGeometry(9000,1800),new T.MeshStandardMaterial({color:0x58703f,roughness:1}));hill.rotation.x=-Math.PI/2+.05;hill.position.set(700,50,DDB.y0-900);sc.add(hill);
}

/* ---------- the props: the village's buildings, the hedgerow, walls, logs, bales; the trees (instanced, see vgFrame) ---------- */
function vgBuild(G,sc,M,add){
  const H=(x,y)=>ddH(x,y),r=rng(808),pick=a=>a[(r()*a.length)|0];
  const stoneC=[0xcfc5b0,0xbdb39c,0xd8cdb8,0xb4aa94,0xc8bca2],roofC=[0x4c525a,0x5a5e62,0x8a4a34,0x7a4630,0x4a4e50],shutC=[0x51708a,0x5d7a52,0x7a5236,0x8a8a7a];
  const dark=M(0x26282a,.7,.3),glass=new T.MeshStandardMaterial({color:0x2a3238,roughness:.25,metalness:.4}),wood=M(0x5d4a34,.95),earth=M(0x5e5236,1);
  const hedgeM=[0x35542c,0x3f5e30,0x2f4c28].map(c=>new T.MeshStandardMaterial({color:c,roughness:1,flatShading:true}));
  const roofOn=(o,g0,ht,rm,pitch)=>{   // a pitched roof along the building's long side
    const along=o.w>=o.h,span=(along?o.h:o.w)+8,len=(along?o.w:o.h)+8,rh=span*(pitch||.42),sh=new T.Shape();sh.moveTo(-span/2,0);sh.lineTo(span/2,0);sh.lineTo(0,rh);sh.closePath();
    const m=add(new T.ExtrudeGeometry(sh,{depth:len,bevelEnabled:false}),rm,along?o.x-4:o.x+o.w/2,g0+ht,along?o.y+o.h/2:o.y-4,along?Math.PI/2:0);return m;};
  const winRow=(o,g0,ht,face,n,hh,w,h,shut)=>{const L=[],cx=o.x+o.w/2,cy=o.y+o.h/2;
    for(let k=0;k<n;k++){const t=(k+.5)/n;let x,y,ry=0;if(face==='s'){x=o.x+t*o.w;y=o.y+o.h+.6;}else if(face==='n'){x=o.x+t*o.w;y=o.y-.6;}else if(face==='e'){x=o.x+o.w+.6;y=o.y+t*o.h;ry=Math.PI/2;}else{x=o.x-.6;y=o.y+t*o.h;ry=Math.PI/2;}
      L.push(add(new T.BoxGeometry(w,h,1.2),glass,x,g0+hh,y,ry));
      if(shut){const sm=M(shut,.85);for(const s of[-1,1]){const ox=ry?0:s*(w/2+2.2),oz=ry?s*(w/2+2.2):0;L.push(add(new T.BoxGeometry(ry?1.4:4,h+1,ry?4:1.4),sm,x+ox,g0+hh,y+oz,0));}}}
    return L;};
  for(const o of DD.objs){const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=H(cx,cy);
    if(o.kind==='vghouse'){const lk=o.look,ht=o.ht;o.meshes=[];const P=m=>{o.meshes.push(m);return m;};
      if(lk==='tower'){   // the church tower: solid to the belfry, four corner piers round the open belfry (the sniper is up there), then the spire
        const sm=M(0xbcb29a,.95);P(add(ddgBoxUV(o.w,58,o.h,24,[.5,.02]),ddgMat('stone'),cx,g0+29,cy));
        for(const[dx,dz]of[[-1,-1],[1,-1],[-1,1],[1,1]])P(add(new T.BoxGeometry(8,18,8),sm,cx+dx*(o.w/2-4),g0+67,cy+dz*(o.h/2-4)));
        P(add(new T.BoxGeometry(o.w,2,o.h),M(0x6a5a44,.9),cx,g0+59,cy));
        P(add(ddgBoxUV(o.w+2,22,o.h+2,24,[.5,.02]),ddgMat('stone'),cx,g0+87,cy));P(add(new T.BoxGeometry(o.w+5,3,o.h+5),M(0x9a907a,.95),cx,g0+99,cy));
        const sp=P(add(new T.ConeGeometry(o.w*.62,62,4),M(0x4a5056,.8),cx,g0+131,cy));sp.rotation.y=Math.PI/4;
        P(add(new T.BoxGeometry(.8,10,.8),M(0x2a2a2a,.5,.6),cx,g0+167,cy));P(add(new T.BoxGeometry(6,.8,.8),M(0x2a2a2a,.5,.6),cx,g0+169,cy));
        const clock=P(add(new T.CylinderGeometry(6,6,1,16),M(0xe8e2d0,.6),cx,g0+87,o.y+o.h+1.6,0,Math.PI/2));clock.castShadow=false;continue;}
      // (Version 188: Norman limestone in courses, roofs of slate or of tiles with their courses and ridges, laid over the old roof's shape)
      const sc0=lk==='barn'?0x7a5a3a:lk==='hall'?0xd2c8b0:pick(stoneC),stone=M(sc0,.95),rc0=lk==='nave'?0x50565c:lk==='barn'?0x6a4a34:pick(roofC),slate=(rc0>>16)<0x70;
      const wk=lk==='barn'?'boards':(lk==='h'||lk==='farm')&&r()<.4?'plaster':'stone',wt=wk==='stone'?28:32,wallM=ddgMat(wk),rm=ddgMatRep(wk,wt),roofT=lk==='barn'||!slate?ddgMat('tiles'):ddgMat('slate');   // (some houses limewashed; the gable ends the wall's own stone, not a cream triangle)
      P(add(ddgBoxUV(o.w,ht,o.h,wt,[.5,.02]),wallM,cx,g0+ht/2,cy));
      const slopes=(base,pitch)=>{const along=o.w>=o.h,span=(along?o.h:o.w)+8,len=(along?o.w:o.h)+8;return P(add(ddgRoof(span,len+1,span*(pitch||.42)),roofT,cx,g0+base,cy,along?0:Math.PI/2));};
      if(lk==='hall'){P(add(new T.BoxGeometry(o.w+6,4,o.h+6),M(0x8a826e,.9),cx,g0+ht+2,cy));const m=roofOn(o,g0,ht+4,rm,.3);P(m);slopes(ht+4,.3);
        P(add(new T.BoxGeometry(30,4,10),M(0xa8a090,.9),cx,g0+2,o.y+o.h+5));P(add(new T.BoxGeometry(14,22,1.4),dark,cx,g0+11,o.y+o.h+.7));
        const ck=P(add(new T.CylinderGeometry(5,5,1,16),M(0xe8e2d0,.6),cx,g0+ht-8,o.y+o.h+.9,0,Math.PI/2));ck.castShadow=false;
        o.meshes.push(...winRow(o,g0,ht,'s',6,ht*.32,7,13,0),...winRow(o,g0,ht,'s',6,ht*.68,7,11,0));continue;}
      if(lk==='nave'){P(roofOn(o,g0,ht,rm,.7));slopes(ht,.7);for(let k=0;k<4;k++){const x=o.x+14+k*(o.w-28)/3;for(const y of[o.y-.7,o.y+o.h+.7])P(add(new T.BoxGeometry(6,22,1.2),glass,x,g0+ht*.55,y));}
        P(add(new T.BoxGeometry(1.2,26,14),dark,o.x-.7,g0+13,cy));continue;}
      if(lk==='barn'){P(roofOn(o,g0,ht,rm,.5));slopes(ht,.5);P(add(new T.BoxGeometry(1.4,30,34),dark,o.x-.7,g0+15,cy));for(let y=o.y+6;y<o.y+o.h;y+=10)P(add(new T.BoxGeometry(o.w+.6,.6,.6),M(0x5a4028,.95),cx,g0+ht*.5,y));continue;}
      if(lk==='g'){P(add(new T.BoxGeometry(o.w+4,3,o.h+4),M(0x6a6660,.9),cx,g0+ht+1.5,cy));P(add(new T.BoxGeometry(40,30,1.4),M(0x3a3c3a,.8),cx,g0+15,o.y+o.h+.7));
        o.meshes.push(...winRow(o,g0,ht,'s',4,ht*.78,7,9,0));continue;}
      // a house: two storeys, shutters, a door on the street side, a chimney
      P(roofOn(o,g0,ht,rm));slopes(ht);const sh=pick(shutC);
      for(const f of['s','n'])o.meshes.push(...winRow(o,g0,ht,f,Math.max(2,Math.round(o.w/30)),ht*.3,6,10,sh),...winRow(o,g0,ht,f,Math.max(2,Math.round(o.w/30)),ht*.72,6,10,sh));
      for(const f of['e','w'])o.meshes.push(...winRow(o,g0,ht,f,Math.max(1,Math.round(o.h/34)),ht*.72,6,10,sh));
      const doorF=Math.abs(cx-VG.road)<160?(cx<VG.road?'e':'w'):'s';
      P(doorF==='s'?add(new T.BoxGeometry(10,20,1.4),M(0x4a3626,.9),cx+o.w*.2,g0+10,o.y+o.h+.7):add(new T.BoxGeometry(1.4,20,10),M(0x4a3626,.9),doorF==='e'?o.x+o.w+.7:o.x-.7,g0+10,cy+o.h*.15));
      P(add(new T.BoxGeometry(8,16,8),stone,o.x+o.w*.75,g0+ht+(o.h+8)*.3,cy-o.h*.15));
    }
    else if(o.kind==='vghut'){o.meshes=[add(new T.BoxGeometry(o.w,o.ht,o.h),M(0x6a5236,.95),cx,g0+o.ht/2,cy)];o.meshes.push(roofOn(o,g0,o.ht,M(0x4a3a2a,.9),.5),add(new T.BoxGeometry(12,18,1.2),dark,cx+10,g0+9,o.y+o.h+.6));}
    else if(o.kind==='vghedge'){o.meshes=[add(new T.BoxGeometry(o.w,7,o.h+6),earth,cx,g0+3.5,cy)];
      for(let x=o.x+6;x<o.x+o.w-2;x+=11){const m=add(new T.DodecahedronGeometry(8.5,0),hedgeM[(r()*3)|0],x,H(x,cy)+12+r()*3,cy+(r()-.5)*3,r()*6);m.scale.set(1.15,1.05+r()*.55,1);o.meshes.push(m);}}
    else if(o.kind==='vgwall'||o.kind==='vgruin'){const hh=o.ht,m=add(ddgBoxUV(o.w,hh,o.h,28),ddgMat('stone'),cx,g0+hh/2,cy);o.meshes=[m];   // (Version 188: the walls in the houses' stone)
      if(o.kind==='vgwall')o.meshes.push(add(new T.BoxGeometry(o.w+1.5,1.6,o.h+1.5),M(0x8f8672,.95),cx,g0+hh+.8,cy));
      else for(let k=0;k<3;k++){const along=o.w>o.h,t=r(),x=along?o.x+t*o.w:cx,y=along?cy:o.y+t*o.h;o.meshes.push(add(new T.BoxGeometry(along?8:o.w,6+r()*7,along?o.h:8),M(0xa89e88,.98),x,g0+hh+2,y));}}
    else if(o.kind==='vglog'){o.meshes=[];const along=o.w>=o.h,len=along?o.w:o.h,n=o.w*o.h>300?3:2;
      for(let k=0;k<n;k++){const off=(k-(n-1)/2)*3.4,up=k===n-1&&n===3?3.4:0,m=add(new T.CylinderGeometry(3.3,3.3,len,8),M(0x6a5236,.95),along?cx:cx+off,g0+3.3+up,along?cy+off:cy,along?0:0,along?0:Math.PI/2,along?Math.PI/2:0);o.meshes.push(m);}}
    else if(o.kind==='vgbale'){const m=add(new T.CylinderGeometry(7,7,12,14),M(0xc9b066,1),cx,g0+7,cy,r()*3,0,Math.PI/2);o.meshes=[m];}
    else if(o.kind==='vgcart'){o.meshes=[add(new T.BoxGeometry(o.w,4,o.h),wood,cx,g0+8,cy),add(new T.BoxGeometry(o.w,6,1),wood,cx,g0+12,o.y),add(new T.BoxGeometry(o.w,6,1),wood,cx,g0+12,o.y+o.h)];
      for(const z of[o.y-1,o.y+o.h+1])o.meshes.push(add(new T.CylinderGeometry(7,7,1.4,12),M(0x4a3a28,.95),cx+4,g0+7,z,0,Math.PI/2));o.meshes.push(add(new T.BoxGeometry(26,1.4,1.4),wood,o.x-11,g0+5,cy-3,0,0,.18));}
    else if(o.kind==='vgcar'){const burnt=M(0x2e2a26,.9,.3),body=o.look==='truck'?[o.w,10,o.h]:[o.w,8,o.h];
      o.meshes=[add(new T.BoxGeometry(...body),burnt,cx,g0+7,cy),add(new T.BoxGeometry(o.look==='truck'?12:o.w*.5,7,o.h-2),burnt,o.look==='truck'?o.x+8:cx-2,g0+14,cy)];
      for(const[dx,dz]of[[-.35,-.5],[.35,-.5],[-.35,.5],[.35,.5]])o.meshes.push(add(new T.CylinderGeometry(3.2,3.2,2,10),M(0x1a1a1a,.9),cx+dx*o.w,g0+3.2,cy+dz*o.h,0,Math.PI/2));}
    else if(o.kind==='vgwell'){o.meshes=[add(new T.CylinderGeometry(7,7.4,8,14),M(0xb0a68e,.95),cx,g0+4,cy),add(new T.CylinderGeometry(5.6,5.6,8.4,14),dark,cx,g0+4.4,cy)];
      for(const s of[-1,1])o.meshes.push(add(new T.BoxGeometry(1,16,1),wood,cx+s*6,g0+12,cy));o.meshes.push(add(new T.BoxGeometry(16,1.2,9),M(0x6a4a34,.9),cx,g0+20,cy,0,0,.0));}
  }
  // the enemy's machine guns on their tripods, and the field guns' mortar tubes, facing where their men face
  const gm=M(0x2a2c2e,.5,.7);DD.vgGuns=[];
  for(const q of VG_GUNS){const g=new T.Group();g.position.set(q.x,H(q.x,q.y),q.y);g.rotation.y=-q.ang;const P=(geo,x,y,z,rz)=>{const b=new T.Mesh(geo,gm);b.position.set(x,y,z);if(rz)b.rotation.z=rz;b.castShadow=true;g.add(b);return b;};
    P(new T.CylinderGeometry(.75,.75,17,7),9,11.6,0,Math.PI/2);P(new T.CylinderGeometry(1.25,1.25,7,8),3,11.6,0,Math.PI/2);P(new T.BoxGeometry(5,3,2.2),-2,11.2,0);
    for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,13,5),gm);l.position.set(Math.cos(a)*3.4,5.4,Math.sin(a)*3.4);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}
    G.add(g);DD.vgGuns.push(g);}
  for(const[x,y]of[[560,-238],[860,-232]]){const t=add(new T.CylinderGeometry(1.6,2,16,8),gm,x,H(x,y)+7,y,0,-.7);t.castShadow=true;add(new T.CylinderGeometry(4,4,1,10),gm,x,H(x,y)+.5,y+4);}
  // the churchyard's graves, café tables in the square, washing on a line, the farm's wood pile
  for(let k=0;k<16;k++){const x=420+(k%8)*16+r()*4,y=-634+((k/8)|0)*14;add(new T.BoxGeometry(5,8+r()*4,1.6),M(0x9a9688,.95),x,H(x,y)+4,y,(r()-.5)*.2);}
  for(const[x,y]of[[652,-576],[668,-584],[754,-582]]){add(new T.CylinderGeometry(4,4,.6,10),M(0x8a8478,.7,.3),x,H(x,y)+8,y);add(new T.CylinderGeometry(.5,.5,8,5),dark,x,H(x,y)+4,y);}
  // the trees (instanced): trunks, two crowns each; then the woods' ferns and brush, more trees beyond the edges, the wheat
  const inst=(geo,mat,L,sh)=>typeof ddInst==='function'?ddInst(G,geo,mat,L,sh):null,lam=c=>new T.MeshLambertMaterial({color:c});
  const trunk=[],crown=[],crown2=[],fern=[],brush=[],wheat=[],tuft=[];
  const tree=(t,far)=>{const h=H(t.x,t.y),s=t.s,o=t.k==='o';trunk.push({x:t.x,y:t.y,h:h+(o?5:11)*s,sx:s*(o?.8:1),sy:s*(o?.7:1.5),ry:r()*6});
    crown.push({x:t.x+(r()-.5)*3,y:t.y+(r()-.5)*3,h:h+(o?14:30)*s,sx:s*(o?1.05:1.15)*(1+r()*.2),sy:s*(o?.8:1)*(.9+r()*.25),ry:r()*6,c:o?pick([0x5d8a36,0x6a9440,0x55803a]):pick([0x3f6a2a,0x4c7a2e,0x365e26,0x557f32]),far});
    crown2.push({x:t.x+(r()-.5)*10*s,y:t.y+(r()-.5)*10*s,h:h+(o?19:40)*s+r()*4,sx:s*(o?.65:.8),ry:r()*6,c:o?pick([0x6a9a3e,0x77a046]):pick([0x46742c,0x3c6628,0x5a8634]),far});};
  for(const t of vgTrees())tree(t,false);
  for(let i=0;i<520;i++){const x=-500+r()*2400,y=300+r()*640;if(x>VG.x0-8&&x<VG.x1+8)continue;tree({x,y,s:.9+r()*.7,k:'w'},true);}
  for(let i=0;i<160;i++){const side=r()<.5,x=side?100+r()*96:1204+r()*120,y=-760+r()*1060;tree({x,y,s:.8+r()*.6,k:'w'},true);}
  for(let i=0;i<120;i++){const x=-400+r()*2200,y=-1000+r()*230;tree({x,y,s:1+r()*.6,k:'w'},true);}
  for(let i=0;i<900;i++){const x=VG.x0+r()*(VG.x1-VG.x0),y=vgEdge(x)+r()*(900-vgEdge(x));if(vgTrackD(x,y)<32)continue;
    (r()<.7?fern:brush).push({x,y,h:H(x,y)+1.2,ry:r()*6,sx:1.4+r()*1.6,sy:1+r()*1.2,c:pick([0x4f7a30,0x5d8a36,0x6a8a3a,0x46682c])});}
  for(let i=0;i<1400;i++){const x=424+r()*230,y=64+r()*196;wheat.push({x,y,h:H(x,y)+1,ry:r()*6,sx:.9+r()*.4,sy:1+r()*.5,c:pick([0xd8c070,0xc8ae5c,0xe0c87a])});}
  for(let i=0;i<2200;i++){const x=VG.x0+r()*(VG.x1-VG.x0),y=-280+r()*600;if(y>vgEdge(x)-4||(x>420&&x<656&&y>62&&y<262)||Math.abs(x-VG.road)<26)continue;tuft.push({x,y,h:H(x,y)-.2,ry:r()*6,sx:.8+r()*.8,sy:.7+r()*1.1,c:pick([0x5e8a38,0x6c9240,0x527c32,0x7a9044,0x8a9050])});}
  const lamV=()=>new T.MeshLambertMaterial({color:0xffffff,vertexColors:true});   // (Version 188: trunks and crowns shaded darker underneath, each crown's corners pulled about)
  inst(ddgShade(new T.CylinderGeometry(1.3,2,14,6),.45,1.05),new T.MeshLambertMaterial({color:0x5a4836,vertexColors:true}),trunk,true);
  const cA=inst(ddgShade(ddgJitter(new T.IcosahedronGeometry(11,0),1.8,21),.5,1.12),lamV(),crown,true),cB=inst(ddgShade(ddgJitter(new T.IcosahedronGeometry(8.5,0),1.4,22),.55,1.12),lamV(),crown2,true);
  const fg=new T.ConeGeometry(1.6,3.6,4);fg.translate(0,.8,0);inst(fg,lam(0xffffff),fern,false);inst(new T.IcosahedronGeometry(2.4,0),lam(0xffffff),brush,false);
  const wg=new T.ConeGeometry(.6,7,3);wg.translate(0,2.6,0);inst(wg,lam(0xffffff),wheat,false);
  inst(ddgTuftGeo(808),new T.MeshLambertMaterial({color:0xffffff,vertexColors:true,side:T.DoubleSide}),tuft,false);   // (Version 188: tufts of blades, not pale cones)
  DD.vgCanopy={sets:[[cA,crown],[cB,crown2]],k:crown.map(()=>1),k2:crown2.map(()=>1),t:0};
}
// the enemy's machine-gun positions (their gunners stand at these; the tripods are drawn here)
const VG_GUNS=[{x:950,y:462,ang:Math.PI/2,arc:1.1,tag:'w3'},{x:700,y:-64,ang:Math.PI/2,arc:1.05,tag:'fh'},{x:1092,y:140,ang:2.3,arc:1.0,tag:'ff'},
  {x:664,y:-324,ang:Math.PI/2,arc:1.0,tag:'vb'},{x:858,y:-600,ang:2.0,arc:1.15,tag:'vh'}];

/* ---------- each frame: the canopy over our men opens (a crown between the camera and one of ours, or one of theirs in sight, shrinks
   away and grows back once it's clear), the trucks and the tank's dust ---------- */
function vgFrame(rdt,now){
  const C=DD&&DD.vgCanopy;if(!C||!camera)return;
  const cx=camera.position.x,cz=camera.position.z,cy=camera.position.y,look=[];
  for(const p of players)if(!p.dead&&!p.inBoat)look.push(p);
  if(dd&&dd.vil)for(const e of enemies)if(!e.dead&&e.vis&&hyp(e.x-camT.x,e.y-camT.z)<700)look.push(e);
  const d=new T.Object3D(),k=Math.min(1,rdt*6);
  C.sets.forEach(([mesh,L],si)=>{if(!mesh)return;const K=si?C.k2:C.k;let dirty=false;
    for(let i=0;i<L.length;i++){const q=L[i];let cut=false;
      if(!q.far||hyp(q.x-cx,q.y-cz)<500)for(const u of look){const vx=cx-u.x,vz=cz-u.y,L2=vx*vx+vz*vz||1,t=((q.x-u.x)*vx+(q.y-u.y)*vz)/L2;if(t<-.02||t>1)continue;
        const lat=hyp(q.x-u.x-vx*t,q.y-u.y-vz*t),hLine=(ddH(u.x,u.y)+10)+(cy-ddH(u.x,u.y)-10)*t;if(lat<12*q.sx+6&&q.h+14*q.sy>hLine-4){cut=true;break;}}
      const to=cut?.0:1;if(Math.abs(K[i]-to)<.01)continue;K[i]+=(to-K[i])*k;if(Math.abs(K[i]-to)<.02)K[i]=to;dirty=true;
      const s=Math.max(.001,K[i]);d.position.set(q.x,q.h,q.y);d.rotation.set(0,q.ry||0,0);d.scale.set((q.sx||1)*s,(q.sy||q.sx||1)*s,(q.sz||q.sx||1)*s);d.updateMatrix();mesh.setMatrixAt(i,d.matrix);}
    if(dirty)mesh.instanceMatrix.needsUpdate=true;});
}

/* ---------- the woods' sight: leaves, not trunks, stop eyes. About 30 m of trees and nothing is seen (dday.js's ddSightOK asks) ---------- */
function vgSightOK(ax,ay,bx,by){
  const d=hyp(bx-ax,by-ay);if(d<280)return true;
  const n=Math.ceil(d/40);let inside=0;
  for(let i=0;i<=n;i++){const t=i/n,x=ax+(bx-ax)*t,y=ay+(by-ay)*t;if(y>vgEdge(x)+12)inside++;}
  return inside/(n+1)*d<300;
}

/* ---------- starting it: the sequence on the base first (not on a retry), then the woods ---------- */
function startVillage(o){
  o=o||{};
  if(!ddRoster)ddRoster=ddmRead();
  if(o.retry&&startVillage.snap){ddRoster=JSON.parse(startVillage.snap);ddmSave();}   // (a loss is a retry: the roster as it was when they left the barracks)
  if(!o.retry&&typeof ddmReady==='function')ddmReady(3);   // (from the start card before it's reached: squads made for it, ddmeta.js, Version 178)
  if(!ddmFit().length){banner('Nobody fit: treat the wounded or add reserves.',3200);return;}
  if(!o.retry)startVillage.snap=JSON.stringify(ddRoster);
  if(o.retry||o.skip){vgBattle();return;}
  vgSeqStart();
}
// the base after the counterattack: the squads at ease on the parade square, the captain in front of them, a few of the others about
function vgSeqStart(){
  reset();DD_MODE='counter';$('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;{const bn=$('#banner');if(bn)bn.classList.remove('show');}
  buildDDay();stashOut(players);
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap({objs:DD.objs,hq:DD.hq,slow:[],lamps:DD.lamps,scene:DD.scene,lights:DD.lights,x1:NAV_W});
  tankFires=[];rockets=[];charges=[];units=[];players=[];enemies=[];civs=[];
  MAPID='dd';LEVEL=5;groundH=ddH;
  dd={seq:{ph:'intro',t:0,cap:null,cp:null,cl:null},t0:simT,pool:ddmReserveFit().length,lost:0,queue:[],npcs:[],npcN:0,nid:0,eid:0,active:'A',idle:{A:0,B:0},hop:{A:0,B:0},wp:{A:0,B:0},front:800,won:false,over:false,
    land:{t:0,done:true},boats:[],waveT:0,spawnT:1e9,aiT:0,npcT:0,shellT:{},oob:0,ambT:0,killed:0,npcLost:0,blown:{},labels0:{},tanks:[],held:{},wires:[]};
  for(const k in DD_LABELS){dd.labels0[k]=WEAPON[k].label;WEAPON[k].label=DD_LABELS[k];}
  dd.rpg0=SPECIALS.rpg.label;SPECIALS.rpg.label='Bazooka';dd.rpgR=PRPG.range;PRPG.range=900;dd.rpgA=PRPG.aim;PRPG.aim=1.15;
  const sq=DCA.square;
  ['A','B'].forEach((t,ti)=>[0,1,2,3].forEach(i=>{const rm=ddmSlotMan(t,i);if(!rm)return;const u=ddNewMan(t,t+(i+1),rm.role,sq.x-26+i*17+(ti?4:0),sq.y+(ti?70:50),rm);
    Object.assign(u,{inBoat:false,seen:true,ang:-Math.PI/2,atEase:true});figRefresh(u);}));
  players=units.filter(u=>u.side==='P'&&!u.npc);
  const cap=ddNpc(sq.x,sq.y+8);Object.assign(cap,{id:'CPT',name:'Hale',ang:Math.PI/2,seen:true,inBoat:false,captain:true,hopT:1e9});dd.seq.cap=cap;   // (in front of the flag, facing the men)
  for(let i=0;i<7;i++){const u=ddNpc(300+i*120+(i>2?90:0),DCA.wallY+30+(i%2)*8);Object.assign(u,{seen:true,inBoat:false,atEase:true,hopT:1e9,ang:-Math.PI/2+(Math.random()-.5)*.8});figRefresh(u);}
  contact=false;clearTeams();mission.t0=simT;sel=[];cardGroup=[];
  VB={x0:DCA.x0,z0:-720,x1:DCA.x1,z1:900};FIT.w=1040;FIT.h=1560;fitDist();
  MAXZ=11;camShift=0;zoom=DD_CAM.zoom;yaw=0;tilt=ddTilt(DD_CAM.zoom);camT={x:sq.x,z:sq.y};clampCam();updateCamera();
  document.body.classList.add('dd','ddseq');ddSky(.62);DD.day=.62;DD.dayShown=.62;
  state='play';endAt=0;updateObjUI();setStatus();buildCards();hud();
  vgSkipBtn(true);
}
function vgSeqLines(){
  const S=dd.seq,C=S.cap,a=players.find(p=>p.team==='A'&&!p.dead)||players[0],b=players.find(p=>p.team==='B'&&!p.dead)||a;
  return[{who:C,to:a,text:"That's the last of them. The base is ours, and it stays ours. Good work, every one of you."},
    {who:C,to:a,text:"We don't sit on it. There's a village three kilometres inland, on the crossroads. Every road their armor can use to reach the coast runs through it."},
    {who:a,to:C,text:"What's between us and it, sir?"},
    {who:C,to:a,text:"Woods first. They have pickets in the trees, a machine gun dug in somewhere in there, and a sniper. Then open fields, and a hedgerow they've dug in behind."},
    {who:b,to:C,text:"Just the eight of us, sir?"},
    {who:C,to:b,text:"Just you, as far as the village. You clear the way, and Fox Company comes up behind you. When you hit the village, they'll be with you."},
    {who:C,to:a,text:"The barricade, the square, the church and the town hall. Take them and hold them. Move out."},
    {who:a,to:b,text:"You heard the captain. Alpha, on me. Bravo, take the rear."}];
}
function vgSeqTick(dt){
  const S=dd.seq;S.t+=dt;
  for(const u of units)if(!u.path.length)u.aimT=simT;   // (nobody turns to a threat: there isn't one)
  if(S.ph==='intro'&&S.t>1.4){S.ph='talk';S.t=0;talkStart(vgSeqLines(),()=>vgSeqMarch());}
  else if(S.ph==='march'){
    for(const m of S.go||[])if(!m.sent&&S.t>=m.at&&!m.u.dead){m.sent=true;const p=findPath(m.u.x,m.u.y,m.tx,m.ty);if(p)m.u.path=p;}
    const L=players.filter(p=>!p.dead);if(S.cap)S.cap.ang=turn(S.cap.ang,Math.atan2(DCA.wallY-S.cap.y,DCA.road-S.cap.x),dt*2);
    if(!S.out&&(S.t>11||L.length&&L.every(p=>p.y<DCA.wallY-60))){S.out=true;vgFade(vgBattle);}}
}
// the column: two files out of the gate and up the road, at a walk
function vgSeqMarch(){
  const S=dd.seq;if(!S||S.ph==='march')return;S.ph='march';S.t=0;
  const m=players.filter(p=>!p.dead).sort((a,b)=>(a.team<b.team?-1:a.team>b.team?1:a.id<b.id?-1:1));
  S.go=m.map((u,i)=>{u.atEase=false;figRefresh(u);u.spdK=.56*(u.spdK||1);const col=i%2,row=(i/2)|0;return{u,at:row*.55,tx:DCA.road-10+col*20,ty:150-row*20,sent:false};});
}
// the sequence's camera: a wide shot, then the one speaking from over the shoulder of the one he speaks to, then behind the column
function vgSeqCam(rdt){
  const S=dd.seq;rdt=Math.min(rdt||0,.1);let pos,look;const V3=(x,h,y)=>new T.Vector3(x,h,y),gh=(x,y)=>ddH(x,y);
  if(S.ph==='march'||S.ph==='out'){const m=players.filter(p=>!p.dead);if(!m.length)return true;
    const cx=m.reduce((a,u)=>a+u.x,0)/m.length,last=m.reduce((a,u)=>u.y>a.y?u:a),lead=m.reduce((a,u)=>u.y<a.y?u:a);
    pos=V3(cx+30,gh(cx,last.y)+40,last.y+104);look=V3(cx,gh(cx,lead.y)+14,lead.y-80);}
  else if(S.ph==='intro'||!talk.on){const C=S.cap;pos=V3(C.x+150,gh(C.x,C.y)+92,C.y+290);look=V3(C.x-8,10,C.y+38);}
  else{const l=talk.q[talk.i]||{},w=l.who||S.cap,to=l.to||players[0]||w,big=w===S.cap;
    const dx=w.x-to.x,dy=w.y-to.y,d=hyp(dx,dy)||1,nx=dx/d,ny=dy/d,back=big?62:34,side=big?16:12;
    pos=V3(to.x-nx*back-ny*side,gh(to.x,to.y)+(big?36:28),to.y-ny*back+nx*side);look=V3(w.x,gh(w.x,w.y)+18,w.y);}
  if(!S.cp){S.cp=pos.clone();S.cl=look.clone();}
  const k=Math.min(1,rdt*(S.ph==='march'?3:2.2));S.cp.lerp(pos,k);S.cl.lerp(look,k);
  if(camShiftOn){camera.clearViewOffset();camShiftOn=false;}camShift=0;
  camera.position.copy(S.cp);camera.lookAt(S.cl);camera.updateMatrixWorld();camT.x=S.cl.x;camT.z=S.cl.z;
  return true;
}
function vgFade(fn){
  const f=$('#fade');if(!f){fn();return;}f.hidden=false;void f.offsetWidth;f.classList.add('on');
  setTimeout(()=>{try{fn();}finally{setTimeout(()=>{f.classList.remove('on');setTimeout(()=>{if(!f.classList.contains('on'))f.hidden=true;},420);},160);}},430);
}
function vgSkipBtn(on){
  let b=$('#vgSkip');
  if(!b&&on){b=document.createElement('button');b.id='vgSkip';b.type='button';b.textContent='Skip ▸';
    b.addEventListener('click',ev=>{ev.stopPropagation();if(!dd||!dd.seq||dd.seq.out)return;dd.seq.out=true;if(talk.on)talkStop();vgFade(vgBattle);});
    (typeof stage!=='undefined'&&stage?stage:document.body).appendChild(b);}
  if(b)b.hidden=!on;
}
function vgCleanup(){   // (from leaveDDayNow: the sequence's bits put away)
  if(dd&&dd.seq&&talk.on)talkStop();vgSkipBtn(false);document.body.classList.remove('ddseq');
}

/* ---------- the battle ---------- */
function vgBattle(){
  vgSkipBtn(false);if(talk.on)talkStop();
  reset();DD_MODE='village';$('#intro').hidden=true;$('#end').hidden=true;$('#aar').hidden=true;
  vgEnter();state='play';endAt=0;
  bigText('Chapter 3: The Village','chapter');hud();
}
function vgEnter(){
  buildDDay();stashOut(players);
  for(const u of units)if(u.m&&u.m.g.parent)u.m.g.parent.remove(u.m.g);
  useMap({objs:DD.objs,hq:DD.hq,slow:[],lamps:DD.lamps,scene:DD.scene,lights:DD.lights,x1:NAV_W});
  tankFires=[];rockets=[];charges=[];units=[];players=[];enemies=[];civs=[];
  MAPID='dd';LEVEL=5;groundH=ddH;
  dd={vil:true,t0:simT,pool:ddmReserveFit().length,lost:0,queue:[],npcs:[],npcN:0,nid:0,eid:0,active:'A',idle:{A:0,B:0},hop:{A:0,B:0},wp:{A:0,B:0},front:900,won:false,over:false,
    land:{t:0,done:true},boats:[],waveT:0,spawnT:1e9,aiT:0,npcT:0,shellT:{},oob:0,ambT:0,killed:0,npcLost:0,blown:{},labels0:{},tanks:[],held:{},wires:[],
    vg:{ph:'woods',t:0,vT:0,front:900,held:{},r1:null,r2:null,trucks:[],follow:{},mortT:{},said:{}}};
  for(const k in DD_LABELS){dd.labels0[k]=WEAPON[k].label;WEAPON[k].label=DD_LABELS[k];}
  dd.rpg0=SPECIALS.rpg.label;SPECIALS.rpg.label='Bazooka';dd.rpgR=PRPG.range;PRPG.range=900;dd.rpgA=PRPG.aim;PRPG.aim=1.15;
  // the squads where the track comes into the woods: Alpha left of it, Bravo right
  ['A','B'].forEach((t,ti)=>[0,1,2,3].forEach(i=>{const rm=ddmSlotMan(t,i);if(!rm)return;const u=ddNewMan(t,t+(i+1),rm.role,VG.start.x+(ti?16:-64)+i*16,VG.start.y+(i%2)*12,rm);u.inBoat=false;u.seen=true;}));
  players=units.filter(u=>u.side==='P'&&!u.npc);
  vgSpawn();enemies=units.filter(u=>u.side==='E');dd.vg.spawned=enemies.length;   // (counted as they come: ddTidy drops the oldest bodies from the list)
  for(const o of objs){if(o.kind==='vgcar')tankFires.push({x:o.x+o.w/2,y:o.y+o.h/2,r:6,t0:simT-20,puffs:[],emit:0});if(o.kind==='ddwreck')tankFires.push({x:o.x+o.w/2,y:o.y+o.h/2,r:10,t0:simT-30,puffs:[],emit:0});}
  contact=true;clearTeams();teamSeen.A=true;teamSeen.B=true;teamSeen.N=true;
  mission.t0=simT;sel=[];cardGroup=[];
  VB={x0:VG.x0,z0:-740,x1:VG.x1,z1:900};FIT.w=1040;FIT.h=1560;fitDist();
  MAXZ=11;camShift=0;zoom=DD_CAM.zoom;yaw=0;tilt=ddTilt(DD_CAM.zoom);camT={x:VG.start.x,z:VG.start.y-DD_CAM.look};clampCam();updateCamera();
  document.body.classList.add('dd');ddSky(.22);DD.day=.22;DD.dayShown=.22;
  updateObjUI();setStatus();buildCards();hud();
  select(players.filter(p=>p.team==='A').length?players.filter(p=>p.team==='A'):players.filter(p=>p.team==='B'));
  dd.track={team:dd.active};
  banner('Pickets in the woods: move from tree to tree.',4500);
}
// their men: the woods and the field not yet alerted (they notice, or hear the shooting), the village waiting for it
function vgSpawn(){
  const Z=(x0,y0,x1,y1)=>({x0,y0,x1,y1}),F=(tag,x,y,ex)=>ddFoe(tag,x-DDX,y,Object.assign({ang:Math.PI/2},ex||{}));
  const quiet={alerted:false,aware:0,dmgIn:.95,aimPen:.04,eye:210},vil={alerted:false,aware:0,dmgIn:.85,aimPen:.05};
  const gun=(tag,i,ex)=>{const G=VG_GUNS[i],u=F(tag,G.x,G.y-6,Object.assign({name:'Machine gunner',gunner:true,post:true,ang:G.ang},ex));u.onGun={x:G.x,y:G.y,ang:G.ang,arc:G.arc};return u;};
  // the woods
  F('w1',610,548,{...quiet,zone:Z(560,500,680,600)});F('w1',800,532,{...quiet,zone:Z(750,490,860,590),nade:1});
  F('w2',430,545,{...quiet,zone:Z(370,470,520,600)});F('w2',470,535,{...quiet,zone:Z(370,470,520,600),nade:1});F('w2',400,520,{...quiet,zone:Z(370,470,520,600)});
  gun('w3',0,quiet);F('w3',912,455,{...quiet,zone:Z(880,410,1030,500)});F('w3',990,452,{...quiet,zone:Z(880,410,1030,500)});
  F('w4',762,402,{...quiet,post:true,name:'Sniper',weapon:'sniper'});
  for(const[x,y]of VG_FOX)F('w5',x,y,{...quiet,post:true});
  // the field: the gun in the road's gap, men at the other gaps and behind the hedge, the farm's gun, the orchard, the mortars
  gun('fh',1,quiet);F('fh',323,-66,{...quiet,zone:Z(290,-110,360,-56)});F('fh',1031,-66,{...quiet,zone:Z(1000,-110,1070,-56),nade:1});
  F('fh',520,-76,{...quiet,zone:Z(440,-120,600,-62)});F('fh',880,-76,{...quiet,zone:Z(800,-120,960,-62)});
  gun('ff',2,quiet);F('ff',980,124,{...quiet,zone:Z(960,96,1090,160)});F('fo',316,96,{...quiet,zone:Z(240,0,400,240)});
  for(const[x,y]of[[560,-246],[860,-240]])F('fm',x,y,{...quiet,post:true,name:'Mortar crew'});
  // the village
  gun('vb',3,vil);F('vb',734,-320,{...vil,zone:Z(596,-362,804,-290)});F('vb',612,-332,{...vil,zone:Z(596,-362,804,-290),nade:1});
  for(const[x,y]of[[556,-322],[850,-322],[538,-416],[866,-420]])F('vs',x,y,{...vil,zone:Z(x-60,y-60,x+60,y+40)});
  F('vq',668,-478,{...vil,zone:Z(636,-596,764,-446)});F('vq',726,-474,{...vil,zone:Z(636,-596,764,-446),nade:1});F('vq',746,-580,{...vil,zone:Z(636,-596,764,-446)});
  F('vc',580,-645,{...vil,post:true,name:'Sniper',weapon:'sniper',elev:60,aimPen:.14});F('vc',520,-618,{...vil,zone:Z(414,-636,620,-600)});F('vc',432,-622,{...vil,zone:Z(414,-660,560,-600)});   // (the tower's sniper sees the whole square, so he's a poor shot)
  gun('vh',4,vil);F('vh',812,-604,{...vil,zone:Z(784,-620,962,-584)});F('vh',948,-600,{...vil,zone:Z(900,-640,1000,-580),nade:1});
  F('vs',1046,-300,{...vil,zone:Z(980,-340,1120,-280)});F('vs',300,-300,{...vil,zone:Z(240,-340,400,-280)});
}

/* ---------- the other squad keeps with the one being played, fights by itself and uses what it carries (as ddfp.js's mates do) ---------- */
function vgFollow(){
  const a=dd.active,o=a==='A'?'B':'A',F=dd.vg.follow;
  const lead=players.filter(p=>p.team===a&&alive(p)&&!p.joining),m=players.filter(p=>p.team===o&&alive(p)&&!p.joining);
  if(!m.length)return;if(typeof fpTools==='function')fpTools(m,m[0]);
  if(!lead.length)return;
  const lx=lead.reduce((s,u)=>s+u.x,0)/lead.length,ly=lead.reduce((s,u)=>s+u.y,0)/lead.length,mx=m.reduce((s,u)=>s+u.x,0)/m.length,my=m.reduce((s,u)=>s+u.y,0)/m.length;
  const free=m.filter(p=>!p.medGo&&!p.throwGo&&!p.rpgAim&&!p.carry&&!p.helpGo&&!p.raise&&simT-p.lastOrder>4&&!pinnedNow(p));
  if(!free.length||free.some(p=>p.path.length))return;
  if(F.a&&hyp(lx-F.a.x,ly-F.a.y)<55&&hyp(mx-lx,my-ly)<150)return;
  const side=Math.sign(mx-lx)||(o==='B'?1:-1),tx=clamp(lx+side*58,VG.x0+30,VG.x1-30),ty=Math.min(870,ly+36);
  const as=makeAssign(free,tx,ty);if(!as.length)return;
  for(const q of as)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0});F.a={x:lx,y:ly};
}

/* ---------- Fox Company (the other troops, dd.npcs): from the woods up through the field into the village, to whatever isn't taken ---------- */
function vgCompany(n,y0,platoon){
  const L=[];for(let i=0;i<n;i++){const x=VG.x0+90+((i+.5)/n)*(VG.x1-VG.x0-180)+(Math.random()-.5)*40,y=y0+Math.random()*60;
    const s=openSpot(x,y,dd.allies.map(destOf))||{x,y},u=ddNpc(s.x,s.y);Object.assign(u,{inBoat:false,seen:true,hopT:simT+Math.random()*1.5,platoon});L.push(u);
    if(i===2||i===n-3){u.spec='rpg';u.specN=2;u.bzT=0;figRefresh(u);}}   // (two bazooka men a platoon: they go for the tank, vgBazooka)
  return L;
}
function vgNpcs(){
  const V=dd.vg,todo=VG.zones.filter(z=>!V.held[z.k]),taken=dd.allies.map(destOf);
  for(const u of dd.npcs){if(u.dead||u.downed||u.path.length||simT<(u.hopT||0)||u.captain)continue;
    if(u.sup>.8){u.hopT=simT+1.5;continue;}
    if(!u.goal||V.held[u.goal.k]&&todo.length)u.goal=todo.length?todo[(Math.random()*todo.length)|0]:VG.zones[1];
    const z=u.goal,gx=z.lx+(u.side2||(u.side2=(Math.random()-.5)*90)),gy=z.ly+(u.side3||(u.side3=(Math.random()-.5)*50)),d0=hyp(u.x-gx,u.y-gy);
    if(d0<44){u.hopT=simT+4;continue;}
    const th=enemies.filter(e=>!beaten(e)&&e.seen&&hyp(e.x-u.x,e.y-u.y)<460).slice(0,10).map(e=>({x:e.x,y:e.y}));
    let best=null,bs=-1e9,n=0;
    for(const c of coverPts){const dc=hyp(c.x-u.x,c.y-u.y);if(dc<22||dc>170)continue;const dg=hyp(c.x-gx,c.y-gy);if(dg>d0-28)continue;
      if(taken.some(q=>hyp(q.x-c.x,q.y-c.y)<14))continue;if(++n>36)break;
      const s=th.length?protStats(c,th).prot/th.length:0,sc=s*2.4-dg/240+Math.random()*.5;if(sc>bs){bs=sc;best=c;}}
    let tgt=best;if(!tgt){const k=Math.min(1,150/d0);tgt=openSpot(u.x+(gx-u.x)*k,u.y+(gy-u.y)*k,taken)||{x:gx,y:gy};}
    const p=findPath(u.x,u.y,tgt.x,tgt.y);if(p&&p.length){u.path=p;u.hopT=simT+2.5+Math.random()*3;taken.push(tgt);}else u.hopT=simT+2;}
}

/* ---------- their reinforcements: trucks that unload where they stop, then the tank and men on foot ---------- */
function vgTruckMesh(){
  const g=new T.Group(),M=(c,r=.85,m=.1)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}),ol=M(0x5a5e48),cv=M(0x7a7a5a,1),dk=M(0x1e1e1c,.9),gl=M(0x2a3238,.3,.4);
  const P=(geo,m,x,y,z)=>{const q=new T.Mesh(geo,m);q.position.set(x,y,z);q.castShadow=true;g.add(q);return q;};
  P(new T.BoxGeometry(60,4,22),dk,-2,8,0);P(new T.BoxGeometry(18,14,21),ol,22,17,0);P(new T.BoxGeometry(1,6,17),gl,31.2,20,0);P(new T.BoxGeometry(12,8,22),ol,33,12,0);
  P(new T.BoxGeometry(40,18,23),cv,-11,21,0);P(new T.BoxGeometry(40,2,22),ol,-11,11,0);
  for(const x of[24,-8,-24])for(const z of[-11,11]){const w=P(new T.CylinderGeometry(5,5,4,12),dk,x,5,z);w.rotation.x=Math.PI/2;}
  return{g,mats:[ol,cv]};
}
function vgTruck(o){
  const V=dd.vg,{g,mats}=vgTruckMesh();DD.scene.add(g);const[x,y]=o.way[0],[x1,y1]=o.way[1];
  const K={g,mats,way:o.way,i:1,x,y,ang:Math.atan2(y1-y,x1-x),men:o.men,goal:o.goal,ph:'drive',t:0,n:0,hp:1};V.trucks.push(K);
  g.position.set(x,ddH(x,y),y);g.rotation.y=-K.ang;return K;
}
function vgTrucks(dt){
  const V=dd.vg;
  for(const K of V.trucks){
    if(K.ph==='drive'){const W=K.way[K.i];if(!W){K.ph='unload';K.t=0;continue;}const dx=W[0]-K.x,dy=W[1]-K.y,d=hyp(dx,dy);
      if(d<3){K.i++;continue;}K.ang=Math.atan2(dy,dx);const s=Math.min(d,(d<60?24:46)*dt);K.x+=dx/d*s;K.y+=dy/d*s;}
    else if(K.ph==='unload'){K.t+=dt;if(K.t>.5&&K.n<K.men&&K.t>.5+K.n*.45){K.n++;
      const tx=K.x-Math.cos(K.ang)*36+(Math.random()-.5)*8,ty=K.y-Math.sin(K.ang)*36+(Math.random()-.5)*8,e=ddFoe('r1',clamp(tx,VG.x0+12,VG.x1-12)-DDX,clamp(ty,-750,880),{reinf:1,ang:K.ang+Math.PI,dmgIn:.85,aimPen:.06,nade:K.n===2?1:0,seen:false});
      enemies.push(e);dd.vg.spawned++;vgSend(e,K.goal[K.n%K.goal.length]);}
      if(K.n>=K.men&&K.t>1){K.ph='parked';if(V.trucks.every(q=>q.ph!=='drive'&&q.ph!=='unload'))V.r1&&(V.r1.done=true);}}
    K.g.position.set(K.x,ddH(K.x,K.y),K.y);K.g.rotation.y=-K.ang;
  }
}
// a blast by one of ours by a truck: it burns, and nobody else gets out of it (ddplay.js's ddBlast calls this)
function vgBlast(x,y){
  if(!dd||!dd.vil)return;
  for(const K of dd.vg.trucks){if(K.hp<=0||hyp(x-K.x,y-K.y)>44)continue;K.hp=0;if(K.ph==='unload'||K.ph==='drive'){K.ph='parked';K.men=K.n;}
    for(const m of K.mats)m.color.setHex(0x1b1a18);tankFires.push({x:K.x,y:K.y,r:9,t0:simT,puffs:[],emit:0});booms.push({x:K.x,y:K.y,t:0,size:1.2});
    if(typeof sfxBoom==='function')sfxBoom(K.x,K.y,1.1);banner('A truck goes up.',2200);if(dd.vg.trucks.every(q=>q.ph==='parked'))dd.vg.r1&&(dd.vg.r1.done=true);}
}
// one of theirs sent to a place (a zone of the village, by its key, or a spot): there, he fights from cover round it
function vgSend(e,goal){
  const z=typeof goal==='string'?VG.zones.find(q=>q.k===goal):null,gx=z?z.lx+(Math.random()-.5)*90:goal.x,gy=z?z.ly+(Math.random()-.5)*60:goal.y;
  const s=openSpot(clamp(gx,VG.x0+20,VG.x1-20),gy,enemies.filter(o=>o!==e&&!o.dead).map(destOf))||{x:gx,y:gy},p=findPath(e.x,e.y,s.x,s.y,FOOT);
  if(p)e.path=p;e.zone={x0:s.x-110,x1:s.x+110,y0:s.y-90,y1:s.y+90};e.alerted=true;e.aware=1;e.advT=simT+12+Math.random()*8;
}
// their reinforcements, once they're in: now and then a bound toward the nearest of ours in the village
function vgEnemyPush(){
  for(const e of enemies){if(!e.reinf||beaten(e)||e.path.length||e.gunner||simT<(e.advT||0))continue;
    if(e.sup>.7){e.advT=simT+2;continue;}
    let n=null,nd=420;for(const u of dd.allies){if(!alive(u)||u.y>-160)continue;const d=hyp(u.x-e.x,u.y-e.y);if(d<nd){nd=d;n=u;}}
    if(!n||nd<90){e.advT=simT+6;continue;}const k=Math.min(1,100/nd);vgSend(e,{x:e.x+(n.x-e.x)*k,y:e.y+(n.y-e.y)*k});}
}
function vgWaves(){
  const V=dd.vg;if(V.ph!=='village'||dd.won)return;const t=V.t-V.vT;
  if(!V.r1&&t>26){V.r1={at:V.t,done:false};
    vgTruck({way:[[650,-880],[650,-690]],men:6,goal:['square','church']});vgTruck({way:[[1290,-522],[1090,-522]],men:6,goal:['hall','square']});
    banner('Enemy trucks coming from the north and east.',3600);}
  if(V.r1&&!V.r2){const left=enemies.filter(e=>e.reinf===1&&!beaten(e)).length;
    if(t>95||(V.r1.done&&V.t-V.r1.at>30&&left<=3)){V.r2={at:V.t};
      ddTankSpawn({x:722,y:-880,ang:Math.PI/2,way:[[722,-700],[722,-560],[716,-450],[712,-390]],name:'Tank'}).node='gate';
      for(let i=0;i<6;i++){const e=ddFoe('r2',290+i*14-DDX,-748+(i%2)*10,{reinf:2,ang:Math.PI/2,dmgIn:.85,aimPen:.06,nade:i%3===0?1:0});enemies.push(e);dd.vg.spawned++;vgSend(e,i%2?'church':'square');}
      vgCompany(10,330,2);
      banner('A tank down the main street, men from the west.',4000);}}
}
function vgBazooka(){
  for(const u of dd.npcs){if(u.spec!=='rpg'||!alive(u)||!(u.specN>0))continue;
    if(u.bzAim){if(simT<u.bzAim.at)continue;const a=u.bzAim;u.bzAim=null;const d=hyp(a.x-u.x,a.y-u.y)||1;u.specN--;
      rockets.push({x:u.x,y:u.y,dx:(a.x-u.x)/d,dy:(a.y-u.y)/d,left:d,total:d,z0:RPG_SH,z1:12,by:u,trail:[],spec:PRPG,speed:PRPG.speed});flashes.push({x:u.x,y:u.y,t:0});u.rpgT=simT;
      if(typeof playSample==='function')playSample('launch',u.x,u.y,.5,1);continue;}
    if(simT<(u.bzT||0)||u.sup>.7)continue;
    const K=ddTanksUp().filter(k=>{const d=hyp(k.x-u.x,k.y-u.y);return d>PRPG.min+10&&d<480&&los(u.x,u.y,k.x,k.y,true)&&!dd.allies.some(o=>hyp(o.x-k.x,o.y-k.y)<60);}).sort((a,b)=>hyp(a.x-u.x,a.y-u.y)-hyp(b.x-u.x,b.y-u.y))[0];
    if(!K)continue;u.bzT=simT+7+Math.random()*3;u.path=[];u.ang=Math.atan2(K.y-u.y,K.x-u.x);u.aimT=simT;u.bzAim={x:K.x+Math.cos(K.ang)*14,y:K.y+Math.sin(K.ang)*14,at:simT+1.3};callout(u,'Bazooka!',C.warn);}
}
// the tank keeps to the streets (the main street and the one across at the square) and goes where our men are; the last of their
// men down and the village ours, it pulls back up the north road rather than sit there (the battle doesn't wait on it)
const VG_TANK={n:[712,-700],sq:[712,-524],gate:[712,-372],w:[330,-522],e:[1080,-522]};
function vgTankThink(){
  for(const K of dd.tanks){if(K.hp<=0||K.left)continue;
    if(K.retreat){if(K.y<-905){K.left=true;K.hp=0;if(K.g.parent)K.g.parent.remove(K.g);banner('The tank pulls back up the north road.',3000);}continue;}
    if(K.i<K.way.length||simT<(K.thinkT||0))continue;K.thinkT=simT+9;
    let n=null,nd=1e9;for(const u of dd.allies){if(!alive(u)||u.y>-200)continue;const d=hyp(u.x-K.x,u.y-K.y);if(d<nd){nd=d;n=u;}}if(!n)continue;
    let best='sq',bd=1e9;for(const k in VG_TANK){const[x,y]=VG_TANK[k],d=hyp(x-n.x,y-n.y);if(d<bd){bd=d;best=k;}}
    const cur=K.node||'gate';if(best===cur)continue;K.way=(cur!=='sq'&&best!=='sq'?[VG_TANK.sq]:[]).concat([VG_TANK[best]]);K.i=0;K.node=best;}
}
function vgTankOut(K){K.retreat=true;K.way=(K.node&&K.node!=='sq'&&K.node!=='n'?[VG_TANK.sq]:[]).concat([VG_TANK.n,[712,-960]]);K.i=0;}
// their mortars behind the hedgerow: on our men out in the field, while they're crewed
function vgMortars(){
  const V=dd.vg;if(V.ph==='village'&&V.t-V.vT>20)return;
  for(const e of enemies){if(e.tag!=='fm'||beaten(e)||!e.alerted)continue;if(simT<(V.mortT[e.id]||0))continue;V.mortT[e.id]=simT+11+Math.random()*5;
    const tg=players.filter(p=>alive(p)&&p.y<vgEdge(p.x)+30&&p.y>VG.hedgeY+12);if(!tg.length)continue;const p=tg[(Math.random()*tg.length)|0];
    ddShell(e,p.x+(Math.random()-.5)*60,p.y+(Math.random()-.5)*60,44,62,2.4);
    if(!V.said.mort){V.said.mort=1;banner('Mortars! Don\'t stay in the open.',3200);}}
}
// the village's places: ours once none of theirs is in it and one of ours is
function vgZones(){
  const V=dd.vg;if(V.ph!=='village')return;
  for(const z of VG.zones){if(V.held[z.k])continue;const inZ=u=>u.x>z.x0&&u.x<z.x1&&u.y>z.y0&&u.y<z.y1;
    if(enemies.some(e=>!beaten(e)&&inZ(e)))continue;if(!dd.allies.some(u=>alive(u)&&inZ(u)))continue;
    V.held[z.k]=true;const n=z.n.toLowerCase().replace(/^the /,'');banner(`The ${n} is yours.`,2800);
    if(z.k==='gate')vgRally({x:700,y:-280,n:'the barricade'});}
}
const vgRally=p=>{(dd.vg.rally||(dd.vg.rally=[])).push(p);};
// a man lost, and somebody in the reserve: he comes up from the nearest place already ours and makes for his squad
function vgReplace(){
  for(const q of dd.queue.slice()){if(simT<q.at)continue;if(q.body&&players.some(m=>m.raise&&m.raise.t===q.body)){q.at=simT+2;continue;}
    dd.queue.splice(dd.queue.indexOf(q),1);if(q.body)q.body.noRev=true;let rm=ddmTakeReserve();dd.pool=ddmReserveFit().length;const fox=!rm&&dd.vg.ph==='village'&&(dd.vg.foxR||0)>0;if(!rm&&!fox)continue;if(fox)dd.vg.foxR--;
    const b=vgFrom();
    const sp=openSpot(b.x,b.y,players.filter(p=>!p.dead).map(destOf))||b,u=ddNewMan(q.team,q.id,rm?rm.role:ddPickRole(q.team),sp.x,sp.y,rm||undefined);Object.assign(u,{inBoat:false,seen:true,joining:true});
    players.push(u);players.sort((a,c)=>a.id<c.id?-1:1);buildCards();if(ddRushing())ddRushSay(`come up from ${b.n}`);else banner(fox?`${u.name} from Fox Company joins ${teamName(q.team)}.`:`${u.name} joins ${teamName(q.team)} from ${b.n}.`,2600);ddReselect(q.team);}
}
// where he comes up (Version 170, Bryan: "The previously controlled area should produce the reinforcements, not the most recent"): the rally point before the
// last one gained (the track, the edge of the woods, the hedgerow, the barricade), or the nearest behind it with no enemy within 26 m (until Version 170: the one nearest his squad)
function vgFrom(){
  const all=[{x:VG.road,y:874,n:'the track'},...(dd.vg.rally||[])],safe=p=>!enemies.some(e=>!beaten(e)&&hyp(e.x-p.x,e.y-p.y)<260);
  for(let i=Math.max(0,all.length-2);i>0;i--)if(safe(all[i]))return all[i];
  return all[0];
}
function vgGiveUp(e){
  Object.assign(e,{surr:true,path:[],alerted:false,aware:0,wary:false,call:null,hunt:null,huntT0:0,lkp:null,flanking:false,bodyGo:null});
  if(e.onGun){e.onGun=null;e.gunner=false;}callout(e,'Nicht schießen!','#ffcf4a');
}

/* ---------- the fight's clock ---------- */
function vgTick(dt){
  const V=dd.vg;V.t+=dt;
  ddAllDown();ddDeadTick();dd.pool=ddmReserveFit().length+(V.ph==='village'?(V.foxR||0):0);   // (in the village, Fox Company can spare a few men once the reserve's gone)
  for(const p of players)if(p.joining)ddJoin(p);
  ddHot();ddTankTick(dt);stationTick(dt);vgTrucks(dt);vgMortars();vgWaves();vgBazooka();vgTankThink();
  const up=players.filter(p=>alive(p)&&!p.joining);
  if(up.length){V.front=Math.min(V.front,...up.map(p=>p.y));DD.day=clamp(.22+(870-V.front)/1600*.36,.22,.58);}
  if(V.ph==='woods'&&V.front<vgEdge(VG.road)+10){V.ph='field';vgRally({x:VG.road,y:300,n:'the edge of the woods'});
    banner('MG in the hedgerow gap: go round, or smoke it.',4500);}
  if(V.ph==='field'&&(V.front<VG.hedgeY-14||(V.front<120&&!enemies.some(e=>(e.tag==='fh'||e.tag==='ff')&&!beaten(e))))){
    V.ph='village';V.vT=V.t;vgRally({x:VG.road,y:20,n:'the hedgerow'});
    for(const e of enemies)if(!beaten(e)&&e.tag[0]==='v'){e.alerted=true;e.aware=1;}
    vgCompany(16,320,1);dd.vg.foxR=4;
    if(typeof addZones==='function')addZones([{k:'med',x:620,y:262},{k:'sup',x:780,y:268}]);
    bigText('The village','complete');
    banner('Take the barricade, square, church and town hall.',4500);}
  if((dd.aiT-=dt)<=0){dd.aiT=1;ddMedics();if(typeof ddcLead==='function'&&ddcLead()){ddcLeadCheck();ddcSupport(dd.active==='A'?'B':'A');}else vgFollow();}   // (Version 168: ddctl.js)
  if((dd.npcT-=dt)<=0){dd.npcT=.5;vgNpcs();vgEnemyPush();vgReplace();vgZones();ddHelpers();ddTidy();updateObjUI();}
  // won: everything taken, their reinforcements in and beaten, the tank out; the last of them give up
  if(V.ph==='village'&&V.r2&&!dd.won&&!endAt){
    const all=VG.zones.every(z=>V.held[z.k]),left=enemies.filter(e=>!beaten(e)&&e.y<-160),tk=ddTanksUp().filter(K=>!K.retreat);
    if(all&&left.length<=2&&tk.length){V.tankOutT=V.tankOutT||V.t+22;if(V.t>V.tankOutT)for(const K of tk)vgTankOut(K);}
    if(all&&!tk.length&&left.length<=2&&V.trucks.every(K=>K.ph==='parked')){
      for(const e of enemies)if(!beaten(e))vgGiveUp(e);
      dd.won=true;endAt=performance.now()+3600;bigText('The village is yours','complete');}}
  if(!endAt&&!dd.won&&!players.some(alive)&&!dd.queue.length&&players.every(p=>p.dead||p.revive===0)){dd.over=true;dd.why='dead';endAt=performance.now()+1800;}
}
function vgHint(){
  const V=dd.vg;
  if(V.ph==='woods')return'The woods: a trunk or a log is cover, and you only see about 30 m through the leaves. Their pickets are in small groups; a machine gun somewhere on the right, a sniper by the track. Pick a squad and move it trunk to trunk: the other squad follows and fights by itself.';
  if(V.ph==='field')return'The field is open: the hay bales, the walls, the cart and the wrecked tank are cover. Their machine gun is in the hedgerow\'s gap on the road: smoke it, or go round by the orchard on the left or the farm on the right. Mortars hit men who stay in the open.';
  return'Take the barricade, the square, the church and the town hall: clear their men out and put one of yours in each. Fox Company fights with you. A sniper is in the church tower. The tank needs the bazooka or grenades. The aid post and ammunition are back at the edge of the woods.';
}
function vgDraw(){
  const V=dd.vg,lab=(x,y,h,text,col,sz=9)=>{toSBack=false;const[sx,sy]=toS(x,y,h);if(!toSBack&&sx>-40&&sx<cw+40&&sy>0&&sy<ch)label(text,sx,sy,col,sz,700);};
  const up=tag=>enemies.filter(e=>e.tag===tag&&!beaten(e));
  // (Version 167: the machine guns show their fields of fire on the ground and the objective pill says where to go, ddhud.js: what's left here is short)
  for(const e of enemies)if(e.weapon==='sniper'&&!beaten(e)&&e.seen)lab(e.x,e.y,(e.elev||0)+30,'SNIPER','#ff8a6a');
  if(V.ph==='village')for(const z of VG.zones){const h=V.held[z.k];if(h)ddBlueRect(z.x0,z.y0,z.x1,z.y1,true);lab(z.lx,z.ly,h?36:44,h?`${z.n} · OURS`:z.n,h?'#8fd0ff':'#ffcf4a',9);}   // (ours: blue on the ground too, Version 170)
  for(const m of players)if(m.raise&&m.raise.p>0&&alive(m)){const c=m.raise.t,[sx,sy]=toS(c.x,c.y,20);label(`REVIVING ${Math.round(m.raise.p/12*100)}%`,sx,sy,'#5fe08e',10,700);}
  for(const p of players)if(p.joining&&alive(p)){const[sx,sy]=toS(p.x,p.y,26);label('JOINING',sx,sy,teamCol(p),9,700);}
}
function vgFinishLost(){
  state='end';setStatus();$('#status').textContent='Lost';
  $('#endEyebrow').textContent='The advance failed';$('#endTitle').textContent='The squads are gone';
  $('#endText').textContent=`Both squads were lost${dd.vg.ph==='village'?' in the village':dd.vg.ph==='field'?' in the field':' in the woods'}, with nobody left in the reserve. Your men and your reserve are as they were when you left the barracks: try it again. Keep to the trees and the hedgerows, smoke the machine guns, and let Fox Company draw their fire in the village.`;
  {const q=$('#sq');if(q)q.hidden=true;}$('#againBtn').textContent='Try the village again';$('#retryBtn').hidden=true;$('#end').hidden=false;
}
