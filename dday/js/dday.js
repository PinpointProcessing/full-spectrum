"use strict";
/* D-Day test (docs/dday-test.md; Bryan's drawing, docs/dday-map-draft.jpg): a Normandy beach as its own map, MAPID 'dd',
   swapped in like Level 1's. This file: the map (its ground has real height: groundH in scene.js), its objects, its look.
   The rules, the troops and the HUD are in ddplay.js.
   The play area is x DDX..DDX+DDW (1000 wide); 200 either side of it is the edge of the battle next door (walkable, but
   out of bounds: ddplay.js), and beyond that mirror copies of the land, for looks only.
   Bottom to top (south to north), as drawn: the sea, the beach with its shell holes, wire and obstacles; a line of gate,
   sandbags, concrete wall, gate, concrete wall and the mountain's rock wall; behind the left gate a pillbox; from the middle
   gate the only way up, a broad draw climbing to the left between the mountain face and the rock; on the rock to the right
   two machine gun nests; at the top a flat base: the heavy gun on the left, a long position along the back (sniper, cannon,
   machine gun), the mortars and the barracks on the right. Rock is a 'drop': it stops feet, not eyes (everything up there
   looks down on the beach). */
const DDB={x0:0,x1:1400,y0:-760,y1:900},DDX=200,DDW=1000,DDS=1.2;
let DD=null,DD_MODE='beach';   // (DD_MODE 'counter': the base and the field inland of it, ddcounter.js; the same scene builder with its own ground, objects and props)
const DD_FACE=[[0,120],[600,85],[120,-320],[0,-320]],   // (until Version 133 a block of it came down to the beach at dx 330-470; Bryan circled it: "Remove the circled part and make it a road")
  DD_RWALL=[[600,316],[600,280],[740,40],[1000,40],[1000,316]],
  DD_RRIGHT=[[316,-312],[440,-435],[1000,-435],[1000,-95],[752,-95]];
function ddIn(poly,x,y){let c=false;for(let i=0,j=poly.length-1;i<poly.length;j=i++){const[xi,yi]=poly[i],[xj,yj]=poly[j];if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)c=!c;}return c;}
const ddMx=x=>{let d=x-DDX;if(d<0)d=-d;if(d>DDW)d=2*DDW-d;return clamp(d,0,DDW);};   // the play area's x (0..1000) for any x: the edges mirror it
const DD_LEDGE={x0:598,x1:1000,y0:212,y1:300},ddPathH=dx=>28+clamp((dx-598)/402,0,1)*40;   // since Version 129 one path along the foot of the mountain's face, at the beach's edge, from the first bunker up to the second (Bryan: "The current mountain between them should be a path running horizontally to both bases"); it climbs 4 m on the way   // the first bunker's shelf, cut into the foot of the hill the nests stand on (Bryan: "The first bunker should share the same hill going up to the second bunker, just at the edge of the beach")
const ddLedge=(dx,y)=>dx>=DD_LEDGE.x0&&dx<=DD_LEDGE.x1&&y>=DD_LEDGE.y0&&y<DD_LEDGE.y1;
// since Version 132 the top of the hill on the right is ground too (Bryan: "Artillery and another bunker are on top of the hill on the right too.
// Right now it's empty"): reached from the draw by the old nests' shelf, a rim of rock left between it and the path below
// (Version 155, Bryan's pick of the draft: the hill bunker on the cliff's lip, over the path. `DD_TER` carries the hilltop south through the rock rim to the edge)
const DD_TER={x0:800,x1:964,y0:170,y1:208};
const DD_TOP={x0:770,x1:986,y0:40,y1:170},ddTop=(dx,y)=>dx>=DD_TOP.x0&&dx<=DD_TOP.x1&&y>=DD_TOP.y0&&y<DD_TOP.y1||dx>=DD_TER.x0&&dx<=DD_TER.x1&&y>=DD_TER.y0&&y<DD_TER.y1;
// (Version 137) the second hill, behind and above it, has a top too: the artillery's, reached from the base (Bryan: "Artillery should be on the second hill and should rain down on the beach")
const DD_TOP2={x0:640,x1:900,y0:-436,y1:-336},ddTop2=(dx,y)=>dx>=DD_TOP2.x0&&dx<=DD_TOP2.x1&&y>=DD_TOP2.y0&&y<DD_TOP2.y1;
const ddRock=(dx,y)=>ddLedge(dx,y)||ddTop(dx,y)||ddTop2(dx,y)?0:ddIn(DD_FACE,dx,y)?1:ddIn(DD_RWALL,dx,y)?2:ddIn(DD_RRIGHT,dx,y)?3:0;
const ddRamp=y=>18+clamp((300-y)/620,0,1)*132;   // the draw's floor: 1.8 m at the gate to 15 m at the top
const DD_HOLES=[{x:380,y:520,r:34,c:2,n:'deep'},{x:640,y:560,r:30,c:1},{x:820,y:470,r:20,c:1},{x:250,y:400,r:18,c:1},{x:545,y:392,r:18,c:1},{x:130,y:600,r:20,c:1},{x:900,y:640,r:22,c:1},
  // Version 176 (Bryan: "Cover should be able to always cover 4 men"; the draft after Version 174, docs/drafts/dday-cover-draft.jpg): six more, each a
  // shelter for four, staggered either side of the way up 12-20 m apart (only the two biggest above took four before)
  {x:240,y:622,r:30,c:1},{x:560,y:606,r:30,c:1},{x:470,y:540,r:30,c:1},{x:720,y:522,r:28,c:1},{x:360,y:432,r:28,c:1},{x:600,y:452,r:28,c:1}];
function ddRawH(dx,y){
  if(dx>=DD_LEDGE.x0&&dx<=DD_LEDGE.x1&&y>=DD_LEDGE.y0&&y<318)return ddPathH(dx);   // the path, and its lip down to the sand
  if(ddTop(dx,y))return 96;
  if(ddTop2(dx,y))return 178;
  if(y>=316)return y<700?16*(700-y)/384:y<770?-7*(y-700)/70:Math.max(-20,-7-(y-770)*.16);
  const r=ddRock(dx,y),n=Math.sin(dx*.071+y*.043)*7+Math.sin(dx*.023-y*.061)*9;
  if(r===1)return Math.min(ddRamp(y)+58,172)+n;
  if(r===2)return 104+n*.7;
  if(r===3)return Math.min(ddRamp(y)+52,182)+n;
  if(dx<600&&y>=100){const road=20+(316-y)*.03,k=clamp((dx-440)/130,0,1);return road+(ddRamp(y)-road)*k*k*(3-2*k);}   // the road along the top of the beach, from the left edge to the draw's mouth, where it meets the path
  if(dx>=752&&y>=-95&&y<=40)return 92;              // the nests' shelf
  if(y<-320)return 152;                             // the base at the top
  return ddRamp(y);
}
const DDG={nx:141,ny:167,h:null};
function ddBuildH(){
  if(DD_MODE==='counter'){DDG.h=dcHeights();return;}
  if(DD_MODE==='village'){DDG.h=vgHeights();return;}   // (Chapter 3: the woods, the field and the village, ddvillage.js)
  const{nx,ny}=DDG;let a=new Float32Array(nx*ny),b=new Float32Array(nx*ny);
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++)a[j*nx+i]=i*10>=1290&&DDB.y0+j*10<=-330?152:ddRawH(ddMx(i*10),DDB.y0+j*10);   // (east of the old play area the top is flat ground, not a mirror image: the road on to their base, ddbase.js)
  for(let p=0;p<2;p++){   // soften the cliffs a little (a wall of stretched triangles otherwise)
    for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){let s=0,n=0;for(let v=-1;v<=1;v++)for(let u=-1;u<=1;u++){const x=i+u,y=j+v;if(x<0||y<0||x>=nx||y>=ny)continue;s+=a[y*nx+x];n++;}b[j*nx+i]=s/n;}
    [a,b]=[b,a];
  }
  for(let j=0;j<ny;j++)for(let i=0;i<nx;i++){const dx=ddMx(i*10),y=DDB.y0+j*10;   // the shell holes
    for(const h of DD_HOLES){const d=hyp(dx-h.x,y-h.y);if(d<h.r+8)a[j*nx+i]-=(h.c===2?11:6.5)*Math.max(0,1-(d/(h.r+8))**2);}}
  DDG.h=a;
}
function ddH(x,y){
  const g=DDG.h;if(!g)return 0;
  const fx=clamp(x/10,0,DDG.nx-1.001),fy=clamp((y-DDB.y0)/10,0,DDG.ny-1.001),i=fx|0,j=fy|0,u=fx-i,v=fy-j,k=j*DDG.nx+i;
  return(g[k]*(1-u)+g[k+1]*u)*(1-v)+(g[k+DDG.nx]*(1-u)+g[k+DDG.nx+1]*u)*v;
}

// the ground in the way (Version 154, Bryan: "Bullets go through the hill at the top. Enemies can shoot right through it"): rock was only a
// 'drop', which stops feet and not eyes, so every hill was glass. A line from eye to eye is blocked where the ground rises above it.
const DD_EYE=15;
function ddSightOK(ax,ay,bx,by){
  if(!DDG.h)return true;const d=Math.hypot(bx-ax,by-ay);if(d<40)return true;
  if(DD_MODE==='village'&&typeof vgSightOK==='function'&&!vgSightOK(ax,ay,bx,by))return false;   // (the woods' leaves: ddvillage.js)
  const ha=ddH(ax,ay)+DD_EYE,hb=ddH(bx,by)+DD_EYE,n=Math.min(48,Math.ceil(d/16));
  for(let i=1;i<n;i++){const t=i/n;if(t*d<14||(1-t)*d<14)continue;if(ddH(ax+(bx-ax)*t,ay+(by-ay)*t)>ha+(hb-ha)*t+3)return false;}
  return true;
}

/* ---------- the map's objects (play-area coordinates dx 0..1000, then moved over by DDX) ---------- */
const DD_SPOT={   // where things are (dx,y): ddplay.js posts the defenders by these
  // (Version 139, Bryan: "add more stationary machine tunes in each one": three in each bunker on the path, fanned out, each with a narrow swing, so
  // between them a bunker covers what its one gun did; two on the hill; a light one at the top of the way up)
  pill:{x:668,y:280,ang:Math.PI/2,arc:.36},pillMGs:[{x:644,y:280,ang:Math.PI/2+.62,arc:.36},{x:692,y:280,ang:Math.PI/2-.62,arc:.36}],
  leftMG:{x:342,y:280,ang:Math.PI/2,arc:.34},leftMGs:[{x:318,y:280,ang:Math.PI/2+.6,arc:.34},{x:366,y:280,ang:Math.PI/2-.6,arc:.34}],
  nests:[{x:858,y:280,ang:Math.PI/2+.66,arc:.38},{x:906,y:280,ang:Math.PI/2,arc:.36},{x:954,y:280,ang:Math.PI/2-.5,arc:.36}],
  hillMG2:{x:912,y:186,ang:Math.PI/2-.55,arc:.62},hillMG3:{x:880,y:188,ang:Math.PI/2,arc:.62},pathMG:{x:292,y:-424,ang:1.32,arc:.8},sniper2:{x:206,y:-590},
  hillMG:{x:848,y:186,ang:Math.PI/2+.75,arc:.62},art:{x:756,y:-384},heavy:{x:90,y:-398},heavyMGs:[{x:137,y:-420,ang:.3,arc:.95,up:.1,arcUp:1},{x:137,y:-392,ang:.3,arc:.95,up:.1,arcUp:1}],cannon:{x:240,y:-594},topMG:{x:350,y:-588,ang:Math.PI/2,arc:1.3},drawMG:{x:466,y:-140,ang:1.35,arc:.85},sniper:{x:122,y:-590},
  mortars:[{x:862,y:-478},{x:922,y:-468},{x:974,y:-480}],barracks:{x:400,y:-715,w:240,h:60},door:{x:520,y:-640},   // (Version 152, Bryan: "The upper right barracks is awkward to turn too. Can we make it more direct on the path?": it stood at dx 700-940, a long way east along the top; now it's straight ahead where the way up comes out, beside the other one)
  
  barr2:{x:112,y:-716,w:250,h:58},door2:{x:236,y:-646},door3:{x:1085,y:-600},tankWay:[[1085,-600],[930,-578],[800,-565]],   // (Version 145: a second barracks behind the highest bunker; since Version 148 the counterattack comes out of their base's gate, ddbase.js)
  gateL:{x:24,w:86},gateM:{x:474,w:62},boat:{x:500,y:772}};
function ddObjects(){
  if(DD_MODE==='counter')return dcObjects();
  if(DD_MODE==='village')return vgObjects();
  const L=[],o=(kind,dx,y,w,h,ex)=>{const q=Object.assign({kind,x:dx+DDX,y,w,h,full:false},ex||{});L.push(q);return q;};
  // rock: rows of 'drop' 20 deep, from the three masses (and their mirror images in the edges)
  for(let y=-440;y<320;y+=20){let run=null;
    for(let dx=0;dx<=1000;dx+=10){const inR=dx<1000&&ddRock(dx+5,y+10)>0;
      if(inR&&run==null)run=dx;
      if(!inR&&run!=null){o('drop',run,y,dx-run,20,{rock:1});run=null;}}}
  o('drop',0,300,24,16,{rock:1});
  // the line at the top of the beach: gate, sandbags, concrete, gate, concrete (the rock wall carries on to the right)
  for(const x of[120,190])o('sandbag',x,304,66,10);
  // the left bunker, on the road at the map's centre left (Bryan: "move the bunker more the right so it's at the center left of the map")
  o('ddpb',300,290,84,8,{cover:2,bk:'p0'});o('ddpb',300,250,8,40,{cover:2,full:true,bk:'p0'});o('ddpb',376,250,8,40,{cover:2,full:true,bk:'p0'});
  for(const x of[404])o('sandbag',x,304,62,10);   // (concrete walls stood here until Version 131; Bryan: "No wall divides the bunker on the left with the bunker on the right")
  // the wire: a fence of barbed wire right across the beach, between the sand and everything else. It can be climbed, which cuts
  // (ddplay.js), or blown open a stretch at a time (Bryan: "A fence blocks all access and has to be climbed or blown up")
  for(let x=0;x<1000;x+=50)o('ddwire',x,340,50,8,{hp:40,tag:'wire'});
  o('sandbag',540,304,52,10);
  // the pillbox behind the left gate: concrete to the front and sides, open at the back
  o('ddpb',626,290,84,8,{cover:2,bk:'p1'});o('ddpb',626,250,8,40,{cover:2,full:true,bk:'p1'});o('ddpb',702,250,8,40,{cover:2,full:true,bk:'p1'});   // (bk: a closed bunker: a slit in its front wall, side walls that block sight, open at the back)
  o('sandbag',716,286,22,10);o('sandbag',236,262,10,40);o('ddcrate',190,190,22,20,{cover:1});   // (the pocket behind the left gate, where the bunker was: a sandbag line)
  // the two machine gun nests on the rock to the right: open on the draw's side
  o('ddpb',826,290,160,8,{cover:2,bk:'p2'});o('ddpb',826,250,8,40,{cover:2,full:true,bk:'p2'});o('ddpb',978,250,8,40,{cover:2,full:true,bk:'p2'});
  // the top of the hill on the right: a third bunker at its south rim, over the path and the beach, and an artillery piece behind sandbags
  o('ddpb',826,194,108,8,{cover:2,bk:'p3'});o('ddpb',826,154,8,40,{cover:2,full:true,bk:'p3'});o('ddpb',926,154,8,40,{cover:2,full:true,bk:'p3'});
  o('sandbag',946,124,34,10);o('sandbag',790,124,44,10);
  if(typeof ddPostObjects==='function')ddPostObjects(o);   // (Version 198: the checkpoint at the top of the first path, ddpost.js)
  // the artillery, two guns on the second hill's top looking out over everything
  o('ddgun',690,-392,24,22,{cover:1,hp:200,tag:'art'});o('ddgun',800,-392,24,22,{cover:1,hp:200,tag:'art'});o('sandbag',676,-352,58,10);o('sandbag',786,-352,58,10);o('ddcrate',748,-420,22,20,{cover:1});
  // the nest up the draw: bags round three sides of its gun, which looks straight down the way up (Bryan: "The hill up should have a mg nest facing downwards")
  o('sandbag',420,-158,10,38);o('sandbag',498,-158,10,38);o('ddcrate',850,66,22,20,{cover:1});o('ddcrate',930,60,22,20,{cover:1});
  // the draw: sandbags across it at three heights, and boulders
  for(const[x,y]of[[500,190],[430,-130],[520,-152],[230,-270]])o('sandbag',x,y,66,10);
  for(const[x,y]of[[590,120],[660,20],[540,-40],[430,-80],[610,-100],[380,-190],[500,-215],[310,-245],[420,-262],[640,-170],[560,250],[520,105]])o('ddbould',x,y,18,15,{cover:1});
  // the base at the top: the heavy gun's emplacement, the long position along the back, the mortar pits, crates, the barracks
  // (Version 210, Bryan: "make the top bunker face towards the hill and have two MG nests on it as well, facing the second bunker at the bottom of
  // the hill": the heavy gun's bunker faced the sea, its front along y -372; now its front is its east wall, toward the way up, its north and south
  // walls solid, its back open to the west, and two machine guns on its roof look down at the checkpoint: DD_SPOT.heavyMGs)
  // (Version 212, Bryan: "the bunker should have a larger opening so the MGs can turn down the hill and towards the tank. The large gun won't be
  // useful because it shoots out toward the water"; "two MG nests in the pill box, not on top of it": the big gun looks out to sea through its south
  // front again; the whole east side is a second opening with two machine guns in it, DD_SPOT.heavyMGs; the north wall solid, the west open: the way in)
  // (Version 217, Bryan: "The MGs should be more accessible to the player to enter after killing them and reaching the top": a doorway in the south wall right behind the machine guns, x 112-142, on the side you come up; the west end is still open)
  o('ddpb',30,-372,82,8,{cover:2,bk:'hv'});o('ddpb',142,-372,8,8,{cover:2,bk:'hv'});o('ddpb',142,-432,8,60,{cover:2,bk:'hv',front:1});o('ddpb',30,-440,120,8,{cover:2,full:true,bk:'hv',front:0});
  o('ddgun',78,-402,24,22,{cover:1,hp:200,tag:'heavy'});   // (Version 212: 0.6 m further south, so there's a way past it along the north wall to the machine guns)
  o('ddpb',90,-572,300,8,{cover:2,bk:'tp'});o('ddpb',90,-620,8,48,{cover:2,full:true,bk:'tp'});o('ddpb',382,-620,8,48,{cover:2,full:true,bk:'tp'});   // the highest bunker: closed in like the others since Version 139
  o('sandbag',262,-410,58,10);o('sandbag',256,-440,10,34);o('sandbag',322,-440,10,34);   // the light machine gun's nest at the top of the way up, in front of it
  o('ddgun',228,-600,24,20,{cover:1,hp:200,tag:'cannon'});
  for(const[x,y]of[[840,-462],[900,-452],[952,-464]])o('sandbag',x,y,44,10);
  for(const[x,y]of[[450,-520],[560,-560],[640,-500],[520,-462],[760,-540],[330,-470],[250,-500]])o('ddcrate',x,y,22,20,{cover:1});
  o('ddbarr',DD_SPOT.barracks.x,DD_SPOT.barracks.y,DD_SPOT.barracks.w,DD_SPOT.barracks.h,{full:true,hp:380,tag:'barracks'});
  {const b=DD_SPOT.barr2;o('ddbarr',b.x,b.y,b.w,b.h,{full:true,hp:380,tag:'barr2'});}
  // the base's vehicles, tents, drums and radio mast (their looks: ddlook.js)
  o('ddtruck',958,-648,26,58,{full:true});o('ddtruck',700,-712,26,58,{full:true});o('ddtent',790,-724,40,46,{full:true});o('ddtent',850,-720,40,46,{full:true});o('ddtent',180,-520,40,46,{full:true});
  for(const[x,y]of[[668,-650],[946,-724],[300,-548],[560,-470]])o('dddrum',x,y,16,16,{cover:1});
  o('ddmast',676,-742,8,8,{});
  // the beach: obstacles, wire, the holes' forward lips (cover from up the hill), two wrecks
  for(const[x,y]of[[150,640],[330,650],[520,660],[700,640],[880,655],[240,560],[450,600],[760,585],[120,430],[690,405],[930,540],[60,520],[470,470]])o('ddhog',x,y,14,14,{cover:1});
  for(const h of DD_HOLES)o('ddrim',h.x-h.r,h.y-h.r-3,h.r*2,6,{cover:h.c});
  o('ddwreck',296,488,46,26,{full:true});o('ddwreck',838,596,24,56,{full:true,lc:1});
  // the edges: mirror images of the rock that reaches them, so the cliffs carry on (nobody fights there)
  for(const q of L.slice()){if(q.kind!=='drop')continue;const dx=q.x-DDX;
    if(dx<200)L.push(Object.assign({},q,{x:DDX-dx-q.w}));
    if(dx+q.w>800)L.push(Object.assign({},q,{x:DDX+2*DDW-dx-q.w}));}
  L.push({kind:'drop',x:0,y:300,w:DDX,h:16,full:false,rock:1},{kind:'drop',x:DDX+DDW,y:300,w:DDX,h:16,full:false,rock:1});   // the line carries on as rock across the edges
  L.push({kind:'water',x:0,y:776,w:1400,h:124,full:false});
  if(typeof ddBaseObjects==='function')for(const q of ddBaseObjects())L.push(q);   // (their base east of the top: ddbase.js)
  return L;
}
VAULTABLE.add('ddgate');VAULTABLE.add('ddwire');   // a gate can be climbed (pathfinding.js), or blown open (ddBlast in ddplay.js)

/* ---------- the ground's picture ---------- */
function paintDDGround(g){
  if(DD_MODE==='counter'){dcPaint(g);return;}
  if(DD_MODE==='village'){vgPaint(g);return;}
  const W0=DDW,r=rng(1944),c=document.createElement('canvas');c.width=Math.round(W0*DDS);c.height=Math.round((DDB.y1-DDB.y0)*DDS);
  const x=c.getContext('2d');x.setTransform(DDS,0,0,DDS,0,-DDB.y0*DDS);
  // the ground, a picture worked out point by point (2 units a point): what it is (sand, wet sand, rock face, grass on the
  // tops, worn earth in the draw) from its height and steepness, lit from the sun's side, darker in the hollows
  {const SW=W0/2|0,SH=(DDB.y1-DDB.y0)/2|0,sc2=document.createElement('canvas');sc2.width=SW;sc2.height=SH;const s2=sc2.getContext('2d'),img=s2.createImageData(SW,SH),D=img.data;
    const gN=64,gv=new Float32Array(gN*gN);for(let i=0;i<gv.length;i++)gv[i]=r();
    const vn=(px,py)=>{const x0=Math.floor(px),y0=Math.floor(py),tx=px-x0,ty=py-y0,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty),v=(i,j)=>gv[((j%gN+gN)%gN)*gN+((i%gN+gN)%gN)];return(v(x0,y0)*(1-sx)+v(x0+1,y0)*sx)*(1-sy)+(v(x0,y0+1)*(1-sx)+v(x0+1,y0+1)*sx)*sy;};
    const fbm=(px,py)=>vn(px,py)*.55+vn(px*2.3+7,py*2.3+3)*.3+vn(px*5.1+1,py*5.1+9)*.15;
    const mix=(A,B,k)=>[A[0]+(B[0]-A[0])*k,A[1]+(B[1]-A[1])*k,A[2]+(B[2]-A[2])*k];
    // (Version 188: a fuller palette. The sand: paler and drier up the beach, bands of darker sand along the shore, a dark wet band
    // with a lighter sheen where the last wave ran up; the rock in beds of grey and ochre limestone with dark seams and lit ledges)
    const SAND=[204,180,130],SAND2=[184,160,114],DRYS=[214,198,156],SANDW=[126,110,84],SHEEN=[158,148,124],BED=[104,124,114],ROCK=[168,150,118],ROCKD=[110,96,76],ROCKL=[192,180,152],GRASS=[98,132,60],GRASS2=[72,106,46],DIRT=[156,128,88],DRY=[156,150,88];
    for(let j=0;j<SH;j++)for(let i=0;i<SW;i++){
      const dx=i*2+1,y=DDB.y0+j*2+1,wx=dx+DDX,h=ddH(wx,y),hx=(ddH(wx+4,y)-ddH(wx-4,y))/8,hy=(ddH(wx,y+4)-ddH(wx,y-4))/8,sl=Math.hypot(hx,hy);
      const n1=fbm(dx*.02,y*.02),n2=fbm(dx*.07+40,y*.07+11);let c;
      if(y>316&&!ddRock(dx,y)){const band=fbm(dx*.004+3,y*.034+9),up=clamp((430-y)/110,0,1),wet=clamp((y-636)/60,0,1);
        c=mix(SAND,SAND2,clamp(band*1.9-.55,0,1));c=mix(c,DRYS,up*.55*(.6+n1*.6));c=mix(c,SAND2,clamp(n2*2.2-1.3,0,1)*.5);
        c=mix(c,SANDW,wet*.9);c=mix(c,SHEEN,Math.exp(-(((y-694)/8)**2))*.45);if(y>706)c=mix(c,BED,clamp((y-706)/50,0,1));
        const rip=Math.sin((y+Math.sin(dx*.02)*12)*.55+n1*5);c=mix(c,[c[0]*.93,c[1]*.93,c[2]*.92],clamp(rip,0,1)*.6);}   // ripples in the sand
      else{const steep=clamp((sl-.28)/.35,0,1);
        let g2=mix(GRASS,GRASS2,clamp(n1*1.6-.3,0,1));g2=mix(g2,DRY,clamp(n2*2-1.1,0,1)*.7);
        const flat=ddRock(dx,y)?g2:(y<-320?mix(g2,DIRT,clamp(n2*1.8-.55,0,1)*.6):mix(DIRT,g2,clamp(n1*2.2-.75,0,1)*.8));
        const band=.5+.5*Math.sin(h*.42+n1*4);let rk=mix(ROCKD,ROCK,band*.15+n2*.55+.15);rk=mix(rk,ROCKL,clamp(n1*2-1.1,0,1)*.5);   // (the beds themselves are drawn by ddground.js's shader, sharp at any distance: in this picture they blurred into streaks down the faces)
        c=mix(flat,rk,steep);}
      const lit=clamp(.92+(-hy*.55)*.9,.66,1.22);                    // the light from the south, a little (Version 188: from the south only: an east-west term turned dark where the picture is mirrored at the play area's edges, a seam down every slope; the sun itself does the rest)
      const hol=(ddH(wx-10,y)+ddH(wx+10,y)+ddH(wx,y-10)+ddH(wx,y+10))/4-h,ao=clamp(1-hol*.03,.72,1.06);
      const k=(j*SW+i)*4,f=lit*ao*(.94+n2*.12);D[k]=clamp(c[0]*f,0,255);D[k+1]=clamp(c[1]*f,0,255);D[k+2]=clamp(c[2]*f,0,255);D[k+3]=255;}
    s2.putImageData(img,0,0);x.imageSmoothingEnabled=true;x.imageSmoothingQuality='high';x.drawImage(sc2,0,DDB.y0,W0,DDB.y1-DDB.y0);}
  // rock faces: cracks running down them and ledges catching the light where it's steep; clumps of gorse and grass on the tops;
  // and along the top of every face the turf hanging over its edge (Version 188)
  const slAt=(px,py)=>{const wx=px+DDX;return Math.hypot(ddH(wx+5,py)-ddH(wx-5,py),ddH(wx,py+5)-ddH(wx,py-5))/10;};
  for(let i=0;i<2400;i++){const px=r()*W0,py=-460+r()*780;if(!ddRock(px,py))continue;const wx=px+DDX,sl=slAt(px,py);
    if(sl>.3){const gx=ddH(wx+5,py)-ddH(wx-5,py),gy=ddH(wx,py+5)-ddH(wx,py-5),gl=Math.hypot(gx,gy)||1,ux=-gx/gl,uy=-gy/gl;   // downhill
      if(r()<.3){let qx=px,qy=py;x.strokeStyle=`rgba(44,38,30,${.14+r()*.18})`;x.lineWidth=.4+r()*.6;x.beginPath();x.moveTo(qx,qy);for(let k=0;k<3;k++){qx+=ux*(1.5+r()*3)+(r()-.5)*2.5;qy+=uy*(1.5+r()*3)+(r()-.5)*2.5;x.lineTo(qx,qy);}x.stroke();}
      else{const l=8+r()*26;x.strokeStyle=`rgba(${r()<.5?'48,40,30':'222,212,186'},${.14+r()*.22})`;x.lineWidth=.6+r()*1.4;x.beginPath();x.moveTo(px,py);x.lineTo(px-uy*l,py+ux*l);x.stroke();}}
    else if(r()<.5){x.fillStyle=`rgba(${r()<.5?'50,84,34':'128,142,62'},${.3+r()*.4})`;x.beginPath();x.ellipse(px,py,4+r()*10,3+r()*7,r()*3,0,7);x.fill();}}
  for(let i=0;i<9000;i++){const px=r()*W0,py=-460+r()*780;if(!ddRock(px,py)||slAt(px,py)>.22)continue;const wx=px+DDX;
    const gx=ddH(wx+9,py)-ddH(wx-9,py),gy=ddH(wx,py+9)-ddH(wx,py-9),gl=Math.hypot(gx,gy);if(gl<3)continue;const ux=-gx/gl,uy=-gy/gl;if(slAt(px+ux*9,py+uy*9)<.34)continue;   // the lip: flat here, steep just below
    for(let k=0;k<3;k++){const ox=px+(r()-.5)*5,oy=py+(r()-.5)*5,l=3+r()*9;x.strokeStyle=`rgba(${r()<.6?'46,74,30':'96,118,50'},${.5+r()*.4})`;x.lineWidth=1+r()*1.6;x.beginPath();x.moveTo(ox,oy);x.lineTo(ox+ux*l+(r()-.5)*2,oy+uy*l+(r()-.5)*2);x.stroke();}
    if(r()<.3){x.fillStyle='rgba(84,64,40,.35)';x.beginPath();x.ellipse(px+ux*4,py+uy*4,2+r()*3,1.5+r()*2,r()*3,0,7);x.fill();}}   // bare earth where it's crumbling
  // speckle: grit and shell in the sand, tufts in the grass
  for(let i=0;i<16000;i++){const px=r()*W0,py=-760+r()*1660,s=.6+r()*1.4;x.fillStyle=py>316?`rgba(${r()<.55?'96,80,56':'240,230,204'},${.1+r()*.2})`:`rgba(${r()<.6?'44,72,30':'160,170,90'},${.1+r()*.2})`;x.fillRect(px,py,s,s);}
  // shingle under the wall, the tide's lines of weed and wrack, the worn way up the draw
  for(let i=0;i<5000;i++){const px=r()*W0,py=318+r()*r()*46,s=1+r()*2.4;x.fillStyle=`rgba(${r()<.5?'96,92,84':'150,146,136'},${.5+r()*.4})`;x.beginPath();x.arc(px,py,s,0,7);x.fill();}
  for(const[yy,a]of[[690,.36],[655,.2],[612,.12]]){x.strokeStyle=`rgba(52,46,34,${a})`;x.lineWidth=2.4;x.beginPath();for(let px=0;px<=W0;px+=12)x.lineTo(px,yy+Math.sin(px*.03+yy)*5+Math.sin(px*.11)*2+(r()-.5)*1.4);x.stroke();
    for(let k=0;k<160;k++){const px=r()*W0,py=yy+Math.sin(px*.03+yy)*5+(r()-.5)*7;x.fillStyle=`rgba(${r()<.6?'44,50,30':'88,70,46'},${a+.15})`;x.save();x.translate(px,py);x.rotate(r()*3);x.fillRect(-1-r()*3,-.5,2+r()*6,1+r()*.8);x.restore();}}
  x.strokeStyle='rgba(176,146,98,.55)';x.lineWidth=46;x.lineCap='round';x.lineJoin='round';x.beginPath();x.moveTo(505,300);x.lineTo(560,150);x.lineTo(520,10);x.lineTo(380,-150);x.lineTo(230,-300);x.lineTo(240,-400);x.lineTo(520,-520);x.lineTo(800,-600);x.stroke();
  x.strokeStyle='rgba(120,96,64,.22)';x.lineWidth=18;x.beginPath();x.moveTo(505,300);x.lineTo(560,150);x.lineTo(520,10);x.lineTo(380,-150);x.lineTo(230,-300);x.lineTo(240,-400);x.lineTo(520,-520);x.lineTo(800,-600);x.stroke();   // (Version 188: the trodden middle of it)
  // the path along the cliff's foot: one worn track from the draw's mouth past both bunkers (Bryan: "The bunker on the left needs to be on the path")
  x.fillStyle='rgba(186,158,108,.5)';x.fillRect(598,214,402,84);
  x.strokeStyle='rgba(190,160,108,.8)';x.lineWidth=34;x.beginPath();x.moveTo(-10,236);x.lineTo(300,232);x.lineTo(520,240);x.lineTo(600,236);x.stroke();   // the road: on left from the path, behind the left bunker, to the map's edge
  x.strokeStyle='rgba(96,78,52,.45)';x.lineWidth=2.2;for(const oy of[-8,8]){x.beginPath();x.moveTo(-10,236+oy);x.lineTo(300,232+oy);x.lineTo(520,240+oy);x.lineTo(600,236+oy);x.stroke();}
  x.strokeStyle='rgba(190,160,108,.75)';x.lineWidth=30;x.beginPath();x.moveTo(520,286);x.lineTo(600,236);x.lineTo(1000,232);x.stroke();
  x.strokeStyle='rgba(96,78,52,.45)';x.lineWidth=2.2;for(const oy of[-7,7]){x.beginPath();x.moveTo(524,286+oy);x.lineTo(602,236+oy);x.lineTo(1000,232+oy);x.stroke();}
  // (Version 188) the beach that thousands crossed this morning: trodden trails up from the water, boot prints, the treads of a tank
  // that came ashore, the wrack of the landing along the water's edge, and the smaller scorches where shells burst in the open
  for(let t=0;t<46;t++){let px=20+r()*960,py=700+r()*40;const ty=330+r()*260,wob=r()*6;x.lineCap='round';
    const pts=[];while(py>ty){pts.push([px,py]);py-=6;px+=Math.sin(py*.02+wob)*1.6+(r()-.5)*2.2;}
    x.strokeStyle='rgba(118,98,66,.09)';x.lineWidth=5+r()*4;x.beginPath();pts.forEach(([a,b],k)=>k?x.lineTo(a,b):x.moveTo(a,b));x.stroke();
    for(let k=0;k<pts.length;k++){const[a,b]=pts[k],s=k%2?1:-1;x.fillStyle=`rgba(96,80,56,${.14+r()*.12})`;x.beginPath();x.ellipse(a+s*1.6+(r()-.5),b+(r()-.5)*2,.8,1.4,0,0,7);x.fill();}}
  {const tk=[[319,512],[326,560],[340,620],[352,690],[360,760]];for(const off of[-13,13]){const P=tk.map(([a,b])=>[a+off,b]);x.strokeStyle='rgba(96,80,56,.28)';x.lineWidth=8;x.beginPath();P.forEach(([a,b],k)=>k?x.lineTo(a,b):x.moveTo(a,b));x.stroke();
    x.strokeStyle='rgba(70,58,40,.35)';x.lineWidth=1;for(let k=1;k<P.length;k++){const[a0,b0]=P[k-1],[a1,b1]=P[k],L=Math.hypot(a1-a0,b1-b0),ux=(a1-a0)/L,uy=(b1-b0)/L;for(let d=0;d<L;d+=2.6){const cx=a0+ux*d,cy=b0+uy*d;x.beginPath();x.moveTo(cx-uy*4,cy+ux*4);x.lineTo(cx+uy*4,cy-ux*4);x.stroke();}}}}
  for(let i=0;i<420;i++){const px=r()*W0,py=672+r()*36+Math.sin(px*.05)*4;x.save();x.translate(px,py);x.rotate(r()*3.2);const k=r();
    x.fillStyle=k<.4?`rgba(${70+r()*30},${54+r()*20},${36},${.5+r()*.3})`:k<.7?`rgba(52,56,44,${.45+r()*.3})`:`rgba(30,28,26,${.4+r()*.3})`;x.fillRect(-1-r()*4,-.6,2+r()*9,1+r()*1.6);x.restore();}   // planks, rope, kit, oil
  for(let i=0;i<34;i++){const px=40+r()*920,py=380+r()*300;if(DD_HOLES.some(h=>Math.hypot(h.x-px,h.y-py)<h.r+26))continue;const R=5+r()*7;
    const gq=x.createRadialGradient(px,py,0,px,py,R*1.7);gq.addColorStop(0,'rgba(58,48,36,.42)');gq.addColorStop(.55,'rgba(96,82,60,.2)');gq.addColorStop(1,'rgba(70,60,46,0)');x.fillStyle=gq;x.beginPath();x.arc(px,py,R*1.7,0,7);x.fill();
    x.strokeStyle='rgba(84,70,52,.14)';x.lineWidth=2;for(let k=0;k<6;k++){const a=r()*TAU,l=R*(1.3+r()*1.4);x.beginPath();x.moveTo(px+Math.cos(a)*R*.5,py+Math.sin(a)*R*.5);x.lineTo(px+Math.cos(a)*l,py+Math.sin(a)*l);x.stroke();}}
  // the shell holes (Version 188, proper craters: they were dark smudges): sand thrown out in rays and lumps, a churned rim, dark damp sand
  // down the sides, scorched black on one side, and seep water in the bottom of the ones near the sea
  for(const h of DD_HOLES){const R=h.r;
    for(let k=0;k<18;k++){const a=r()*TAU,l=R*(1.2+r()*.9);x.strokeStyle=`rgba(${r()<.5?'112,94,66':'134,114,82'},${.08+r()*.1})`;x.lineWidth=3+r()*6;x.beginPath();x.moveTo(h.x+Math.cos(a)*R*.85,h.y+Math.sin(a)*R*.85);x.lineTo(h.x+Math.cos(a)*l,h.y+Math.sin(a)*l);x.stroke();}
    let gr=x.createRadialGradient(h.x,h.y,1,h.x,h.y,R+6);gr.addColorStop(0,'rgba(44,38,30,.9)');gr.addColorStop(.42,'rgba(66,56,42,.82)');gr.addColorStop(.8,'rgba(104,88,64,.55)');gr.addColorStop(1,'rgba(104,88,64,0)');x.fillStyle=gr;x.beginPath();x.arc(h.x,h.y,R+6,0,7);x.fill();
    const sa=r()*TAU;gr=x.createRadialGradient(h.x+Math.cos(sa)*R*.5,h.y+Math.sin(sa)*R*.5,1,h.x+Math.cos(sa)*R*.5,h.y+Math.sin(sa)*R*.5,R*.95);gr.addColorStop(0,'rgba(20,18,16,.55)');gr.addColorStop(1,'rgba(20,18,16,0)');x.fillStyle=gr;x.beginPath();x.arc(h.x+Math.cos(sa)*R*.5,h.y+Math.sin(sa)*R*.5,R*.95,0,7);x.fill();
    if(h.y>540||h.c===2){x.fillStyle='rgba(54,58,50,.62)';x.beginPath();x.ellipse(h.x+(r()-.5)*4,h.y+(r()-.5)*3,R*.32,R*.24,r()*3,0,7);x.fill();x.fillStyle='rgba(150,160,150,.12)';x.beginPath();x.ellipse(h.x-R*.08,h.y-R*.06,R*.16,R*.08,0,0,7);x.fill();}
    for(let k=0;k<70;k++){const a=r()*TAU,d=R*(.9+r()*r()*.6),s=.7+r()*1.8;x.fillStyle=r()<.4?`rgba(84,70,50,${.25+r()*.25})`:`rgba(220,202,160,${.25+r()*.3})`;x.beginPath();x.ellipse(h.x+Math.cos(a)*d,h.y+Math.sin(a)*d,s,s*.7,a,0,7);x.fill();}}
  // onto the map's canvas: the play area, and its mirror image in each edge and beyond
  g.setTransform(1,0,0,1,0,0);g.drawImage(c,DDX*DDS,0);
  g.save();g.translate(DDX*DDS,0);g.scale(-1,1);g.drawImage(c,0,0,DDX*DDS,c.height,0,0,DDX*DDS,c.height);g.restore();
  g.save();g.translate((DDX+2*DDW)*DDS,0);g.scale(-1,1);g.drawImage(c,(DDW-DDX)*DDS,0,DDX*DDS,c.height,(DDW-DDX)*DDS,0,DDX*DDS,c.height);g.restore();
}

/* ---------- the scene ---------- */
function disposeDD(){
  if(!DD||!DD.scene)return;
  DD.scene.traverse(o=>{if(o.geometry)o.geometry.dispose();if(o.material){for(const m of[].concat(o.material)){if(m.map&&m.map!==DD.tex)m.map.dispose();m.dispose();}}});
  if(DD.tex)DD.tex.dispose();if(DD.concH)DD.concH.dispose();DD=null;   // (Version 189: the bunkers' bump picture too)
}
// the time of day, 0 dawn .. 1 evening (it goes by as the squads climb: ddplay.js sets DD.day)
// Version 188: [t, the horizon's haze (the fog and the sky's foot, as shown on screen), the sky overhead (as shown), the soft light from the sky, its strength,
// the sun's colour, its strength, where the sun stands (degrees round from east toward the south), how high (degrees)]. A bright overcast morning with a
// real sun, a little golden (warm light against the sky's cooler fill in the shadows): from the right of the usual camera and a little behind it, so faces and the sides of things read and shadows fall away to the left; the sky's
// light softer and a little bluer than before (it was nearly the sun's strength, and the shadows were faint); a golden afternoon by evening, the sun round to the south-west
const DD_SKY=[[0,0xc4ced6,0x6f8db2,0xb0c4da,.54,0xffe8c8,1.42,18,31],[.5,0xccd8e2,0x5d86ba,0xb8cce0,.56,0xfff3e0,1.5,62,46],[1,0xdcc6aa,0x6c80a6,0xc8c0b8,.54,0xffd2a0,1.42,128,28]];
let _dsc=null;
function ddSky(t){
  let a=DD_SKY[0],b=DD_SKY[DD_SKY.length-1];for(let i=0;i<DD_SKY.length-1;i++)if(t>=DD_SKY[i][0]&&t<=DD_SKY[i+1][0]){a=DD_SKY[i];b=DD_SKY[i+1];}
  _dsc=_dsc||new T.Color();const k=b[0]>a[0]?clamp((t-a[0])/(b[0]-a[0]),0,1):0,L=DD.lights,mix=(o,i)=>o.setHex(a[i]).lerp(_dsc.setHex(b[i]),k),num=i=>a[i]+(b[i]-a[i])*k;
  const S=DD.sky||(DD.sky={hor:new T.Color(),zen:new T.Color(),sunC:new T.Color(),sun:new T.Vector3(0,1,0),t:0});S.t=t;   // (DD.sky: what the sky is now, for the dome, the smoke and anything else that wants it)
  mix(S.hor,1);mix(S.zen,2);DD.scene.background.copy(S.hor);if(DD.scene.fog)DD.scene.fog.color.copy(S.hor);
  mix(L.hemi.color,3);L.hemi.userData.base=num(4);mix(L.moon.color,5);L.moon.intensity=num(6);S.sunC.copy(L.moon.color);
  const az=num(7)*Math.PI/180,el=num(8)*Math.PI/180;S.sun.set(Math.cos(el)*Math.cos(az),Math.sin(el),Math.cos(el)*Math.sin(az));   // (ddlight.js's ddSunFrame puts the sun there)
  if(DD.sea&&DD.sea.material&&DD.sea.material.color){DD.sea.material.color.setHex(0x2f7890).lerp(_dsc.setHex(0x7a6258),Math.max(0,t-.5)*2);if(typeof ddLinCol==='function')ddLinCol(DD.sea.material.color);}
  if(typeof ddLightSky==='function')ddLightSky(S);
}
function buildDDay(){
  disposeDD();ddBuildH();
  const objsL=ddObjects();
  DD={objs:objsL,lamps:[],hq:[],scene:null,lights:null,canvas:null,tex:null,props:null,sea:null,gibs:[],boats:[],day:0,dayShown:-1};
  const sc=new T.Scene();sc.background=new T.Color(0xc4ced6);sc.fog=new T.Fog(0xc4ced6,1200,5500);DD.scene=sc;   // (Version 188: a haze with a near end, kept past the battle by ddlight.js; it was thick enough to pale the battle itself)
  const fc=document.createElement('canvas');fc.width=Math.round((DDB.x1-DDB.x0)*DDS);fc.height=Math.round((DDB.y1-DDB.y0)*DDS);
  paintDDGround(fc.getContext('2d'));
  const tex=new T.CanvasTexture(fc);tex.encoding=T.sRGBEncoding;tex.anisotropy=4;DD.canvas=fc;DD.tex=tex;
  const keep=scene;scene=sc;
  try{
    // the land: one sheet with the heights in it; a mirror image either side (the battle next door)
    const gw=DDB.x1-DDB.x0,gd=DDB.y1-DDB.y0,geo=new T.PlaneGeometry(gw,gd,DDG.nx-1,DDG.ny-1),pos=geo.attributes.position;
    for(let k=0;k<pos.count;k++){const i=k%DDG.nx,j=(k/DDG.nx)|0;pos.setZ(k,DDG.h[j*DDG.nx+i]);}
    geo.computeVertexNormals();
    const gmat=new T.MeshStandardMaterial({map:tex,roughness:.96,metalness:0});
    const land=new T.Mesh(geo,gmat);land.rotation.x=-Math.PI/2;land.position.set(gw/2,0,(DDB.y0+DDB.y1)/2);land.receiveShadow=true;sc.add(land);
    for(const s of[-1,1]){const m=new T.Mesh(geo,gmat);m.rotation.x=-Math.PI/2;m.scale.x=-1;m.position.set(s<0?-gw/2:gw*1.5,0,(DDB.y0+DDB.y1)/2);m.receiveShadow=true;sc.add(m);(DD.bo=DD.bo||[]).push(m);}
    // far land behind the base, and the sea bed out to the horizon
    const far=new T.Mesh(new T.PlaneGeometry(9000,3000),typeof ddgFarMat==='function'?ddgFarMat(9000,3000):new T.MeshStandardMaterial({color:0x6f9440,roughness:1}));far.rotation.x=-Math.PI/2;far.position.set(700,151,DDB.y0-1500);sc.add(far);DD.bo.push(far);   // (Version 190: fields and hedgerows fading into the haze, ddground.js)
    // the sea, its bed and its surf: ddsea.js's ddSeaBuild since Version 188 (one sheet of water: the swell, the breakers, the swash and the wet sand in its shader)
    // a sky to look at when the camera's tilted down: a big dome the colour of the haze
    const dome=new T.Mesh(new T.SphereGeometry(5200,24,12),new T.MeshBasicMaterial({color:0x8e9aa2,side:T.BackSide,fog:false,depthWrite:false}));dome.position.set(700,0,0);sc.add(dome);DD.dome=dome;
    ddProps(sc,objsL);
    if(DD_MODE==='counter'){for(const m of DD.bo)m.visible=false;dcScenery(sc);}else
    if(DD_MODE==='village'){for(const m of DD.bo)m.visible=false;vgScenery(sc);}else
    if(typeof ddScenery==='function')ddScenery(sc);   // (ddlook.js: sky, ships, balloons, the landings either side)
    // the light: a bright overcast morning (ddSky moves it on through the day; ddlight.js's ddSunFrame aims the sun and fits its shadows to the view)
    const hemi=new T.HemisphereLight(0xb8c6d4,0x8a7a5c,.6);hemi.userData.base=.6;sc.add(hemi);
    const sun=new T.DirectionalLight(0xfff0dc,1.2);sun.position.set(330,640,420);sun.target.position.set(700,0,100);
    const phone=matchMedia('(pointer:coarse)').matches;sun.castShadow=true;sun.shadow.mapSize.set(phone?1024:2048,phone?1024:2048);
    Object.assign(sun.shadow.camera,{left:-640,right:640,top:640,bottom:-640,near:50,far:2000});sun.shadow.bias=-0.0012;sc.add(sun,sun.target);
    const pool=[];for(let k=0;k<LAMP_POOL;k++){const p=new T.PointLight(0xffffff,0,100,1.4);sc.add(p);pool.push(p);}
    const mz=[];for(let k=0;k<2;k++){const m=new T.PointLight(0xffcf8a,0,95,2);sc.add(m);mz.push(m);}
    const bl=new T.PointLight(0xffa050,0,300,1.6);sc.add(bl);
    DD.lights={hemi,moon:sun,lampPool:pool,muzzle:mz,boomL:bl};
    ddGibPool(sc);
    for(const f of['ddLightBuild','ddSeaBuild','ddFxBuild','ddGroundBuild'])if(typeof window[f]==='function')window[f](sc);   // (Version 188: each of the looks' own build: ddlight.js, ddsea.js, ddfx.js, ddground.js; every chapter, the lights made)
  }finally{scene=keep;}
}
// poured concrete: the marks of the boards it was cast against, rain streaks, stains and a few cracks. Version 188: twice the size, the
// form ties' holes in rows, lichen and damp low down, soot, and pocked by bullets and shell splinters (chips of fresh grey, dark in the middle);
// a height picture of the same (DD.concH) for the light to catch the boards and the chips
function ddConcTex(){const H=document.createElement('canvas');H.width=H.height=512;const hq=H.getContext('2d');hq.fillStyle='#808080';hq.fillRect(0,0,512,512);
  const t=canvasTex(512,512,(q,w,h)=>{const r=rng(31);q.fillStyle='#c4c0b2';q.fillRect(0,0,w,h);
    for(let y=0;y<h;y+=24){const sh=r();q.fillStyle=`rgba(${sh<.5?'70,66,58':'235,232,222'},${.05+r()*.1})`;q.fillRect(0,y,w,24);q.fillStyle='rgba(60,56,50,.42)';q.fillRect(0,y,w,1.5);hq.fillStyle='#5a5a5a';hq.fillRect(0,y,w,2);
      for(let x=r()*60;x<w;x+=50+r()*70){q.fillStyle='rgba(60,56,50,.18)';q.fillRect(x,y,1,24);}
      for(let k=0;k<10;k++){q.fillStyle='rgba(120,116,104,.12)';q.fillRect(0,y+2+r()*20,w,1);}}
    for(let y=36;y<h;y+=96)for(let x=24;x<w;x+=64){q.fillStyle='rgba(40,38,34,.55)';q.beginPath();q.arc(x+(r()-.5)*3,y,2.2,0,7);q.fill();hq.fillStyle='#3a3a3a';hq.beginPath();hq.arc(x,y,2.6,0,7);hq.fill();}   // the form ties
    for(let i=0;i<120;i++){const x=r()*w,l=30+r()*170;const g=q.createLinearGradient(0,0,0,l);g.addColorStop(0,`rgba(50,48,42,${.1+r()*.22})`);g.addColorStop(1,'rgba(50,48,42,0)');q.fillStyle=g;q.fillRect(x,r()*h*.5,2+r()*9,l);}   // rain streaks
    {const g=q.createLinearGradient(0,h*.62,0,h);g.addColorStop(0,'rgba(70,74,52,0)');g.addColorStop(1,'rgba(70,74,52,.42)');q.fillStyle=g;q.fillRect(0,h*.62,w,h*.38);}   // damp low down
    for(let i=0;i<46;i++){q.fillStyle=`rgba(${r()<.5?'86,104,58':'104,96,70'},${.12+r()*.18})`;q.beginPath();q.ellipse(r()*w,h*.45+r()*h*.55,10+r()*34,6+r()*20,r()*3,0,7);q.fill();}   // lichen and moss
    for(let i=0;i<8;i++){const x=r()*w,y=r()*h,g=q.createRadialGradient(x,y,2,x,y,30+r()*50);g.addColorStop(0,'rgba(24,22,20,.35)');g.addColorStop(1,'rgba(24,22,20,0)');q.fillStyle=g;q.fillRect(x-80,y-80,160,160);}   // soot
    q.strokeStyle='rgba(40,38,34,.55)';q.lineWidth=1.2;for(let i=0;i<12;i++){let x=r()*w,y=r()*h;q.beginPath();q.moveTo(x,y);hq.strokeStyle='#404040';hq.lineWidth=2;hq.beginPath();hq.moveTo(x,y);for(let k=0;k<7;k++){x+=(r()-.5)*36;y+=8+r()*20;q.lineTo(x,y);hq.lineTo(x,y);}q.stroke();hq.stroke();}
    for(let i=0;i<150;i++){const x=r()*w,y=r()*h,R=1.5+r()*r()*7;q.fillStyle=`rgba(226,224,214,${.4+r()*.3})`;q.beginPath();q.arc(x,y,R*1.5,0,7);q.fill();q.fillStyle='rgba(60,58,52,.7)';q.beginPath();q.arc(x,y,R*.6,0,7);q.fill();   // pocks
      const g=hq.createRadialGradient(x,y,0,x,y,R*1.5);g.addColorStop(0,'#202020');g.addColorStop(1,'rgba(128,128,128,0)');hq.fillStyle=g;hq.beginPath();hq.arc(x,y,R*1.5,0,7);hq.fill();}
    for(let i=0;i<2400;i++){q.fillStyle=`rgba(${r()<.5?'40,38,34':'250,248,240'},${.05+r()*.12})`;q.fillRect(r()*w,r()*h,1.4,1.4);}});
  t.wrapS=t.wrapT=T.RepeatWrapping;t.repeat.set(2,1);const ht=new T.CanvasTexture(H);ht.wrapS=ht.wrapT=T.RepeatWrapping;ht.repeat.set(2,1);DD.concH=ht;return t;}
// everything standing on the land: built into one group, and copied (mirrored) either side for the battle next door
function ddProps(sc,objsL){
  const G=new T.Group();DD.props=G;sc.add(G);
  const M=(c,r=.9,m=0)=>new T.MeshStandardMaterial({color:c,roughness:r,metalness:m}),
    conc=M(0xb4b0a4,.95),concD=M(0x8a877c,.95),bag=M(0xb8a372,1),steel=M(0x3a3632,.6,.7),rust=M(0x5a4030,.8,.4),wood=M(0x5d4a34,.95),rockM=new T.MeshStandardMaterial({color:0x857a68,roughness:1,flatShading:true}),olive=M(0x4d5540,.9),dark=M(0x26282a,.7,.5);
  const add=(geo,mat,x,y,z,ry,rx,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(ry)m.rotation.y=ry;if(rx)m.rotation.x=rx;if(rz)m.rotation.z=rz;m.castShadow=true;m.receiveShadow=true;G.add(m);return m;};
  const box=(o,h,mat,lift=0)=>{const g0=ddH(o.x+o.w/2,o.y+o.h/2);const m=add(new T.BoxGeometry(o.w,h,o.h),mat,o.x+o.w/2,g0+h/2+lift,o.y+o.h/2);(o.meshes=o.meshes||[]).push(m);return m;};
  const bagG=new T.SphereGeometry(1,7,5),bagGeo=ddgBagGeo(),bagM=new T.MeshStandardMaterial({map:ddgTex('burlap'),roughness:1,vertexColors:true}),crateM=new T.MeshStandardMaterial({map:ddgTex('crate'),roughness:.88,vertexColors:true}),hogM=new T.MeshStandardMaterial({map:ddgTex('rust'),roughness:.8,metalness:.12}),wireM=new T.MeshStandardMaterial({vertexColors:true,roughness:.62,metalness:.45}),r=rng(66),BK=DD.bk={},concT=ddConcTex(),bkM=(k,v=0)=>{const L=BK[k]||(BK[k]=[]);return L[v]||(L[v]=v===2?new T.MeshStandardMaterial({color:0x7a6a48,roughness:1,transparent:true}):v===3?new T.MeshStandardMaterial({color:0xffffff,map:ddgTex('turf'),roughness:1,transparent:true}):new T.MeshStandardMaterial({color:v?0x8f8b80:0xd0ccc0,map:concT,bumpMap:DD.concH,bumpScale:.7,roughness:.95,transparent:true}));};
  for(const o of objsL){
    if(o.hid)continue;   // (drawn elsewhere: ddpost.js's walls)
    const cx=o.x+o.w/2,cy=o.y+o.h/2,g0=ddH(cx,cy);
    if(o.kind==='sandbag'){   // two courses of bags (Version 188: burlap sacks, fat in the middle and tied at the ends, each its own shade; one mesh a line)
      const horiz=o.w>=o.h,n=Math.round((horiz?o.w:o.h)/8),dep=horiz?o.h:o.w,P=[];
      for(let c=0;c<2;c++)for(let k=0;k<n-c;k++){const t=(k+.5+c*.5)/n,x=horiz?o.x+t*o.w:cx,y=horiz?cy:o.y+t*o.h,j=.94+r()*.12,tone=.8+r()*.26;
        P.push({g:bagGeo,p:[x-cx,ddH(x,y)+2.3+c*3.7-g0,y-cy],r:[0,(horiz?0:Math.PI/2)+(r()-.5)*.24,(r()-.5)*.08],s:[8.9*j,9.6*j,dep*1.55*j],c:new T.Color(tone,tone*(.97+r()*.05),tone*(.92+r()*.1))});}
      const m=add(ddgMerge(P,true),bagM,cx,g0,cy);o.meshes=[m];
    }else if(o.kind==='ddconc'){box(o,24,conc);const cap=add(new T.BoxGeometry(o.w+2,2.4,o.h+3),concD,cx,g0+25,cy);o.meshes.push(cap);}
    else if(o.kind==='ddpb'){   // a bunker's wall (their look redone for Version 131, Bryan: "the pillboxes look bad"): board-marked, stained concrete
      // thick at the foot, the front leaning back to a deep firing slit with a stepped throat, earth banked up the sides; each bunker's
      // parts share materials of its own, so the whole of it can go clear with one of ours inside (ddFrame)
      if(!o.bk)box(o,15,conc);
      else{const m=bkM(o.bk),md=bkM(o.bk,1),me=bkM(o.bk,2);o.meshes=o.meshes||[];const P=(geo,mat,x,y,z,ry,rx,rz)=>{const q=add(geo,mat,x,y,z,ry,rx,rz);o.meshes.push(q);return q;};
        const front=o.front!=null?!!o.front:o.w>o.h;
        if(front&&o.h>o.w){   // (Version 210) a front that runs north-south, facing east: the low wall, the lintel and its drip edge, a pier at each end
          P(new T.BoxGeometry(o.w+5,6.5,o.h+6),m,cx+1,g0+3.25,cy);P(new T.BoxGeometry(o.w+2,5.5,o.h+12),m,cx,g0+21.8,cy);P(new T.BoxGeometry(o.w+7,1.4,o.h+14),md,cx+1,g0+18.6,cy);
          for(const fy of[0,1])P(new T.BoxGeometry(o.w+2,12.6,6),m,cx,g0+12.6,o.y-1+fy*(o.h+2));
        }else if(!front&&o.w>o.h){P(new T.BoxGeometry(o.w+4,24.5,o.h+2),m,cx,g0+12.2,cy);   // (Version 210) a solid side wall that runs east-west, earth banked against it outside
          const out=cy<-406?-1:1,be=P(new T.SphereGeometry(1,10,7),me,cx-10,g0+1,cy+out*9);be.scale.set(o.w*.5,14,12);
        }else if(o.w>o.h){   // the front: a battered lower wall, the slit, a heavy lintel, piers at the ends and the middle
          const sh=new T.Shape();sh.moveTo(-o.h/2-4,0);sh.lineTo(o.h/2+1,0);sh.lineTo(o.h/2+1,6.5);sh.lineTo(-o.h/2,6.5);sh.closePath();   // (since Version 139 a low wall and a tall opening: Bryan, "The bunker's embrasure should be much larger, the player can see inside the bunker from the ground")
          const low=P(new T.ExtrudeGeometry(sh,{depth:o.w+6,bevelEnabled:false}),m,o.x-3,g0,cy,Math.PI/2);
          P(new T.BoxGeometry(o.w+6,5.5,o.h+2),m,cx,g0+21.8,cy);                         // the lintel
          P(new T.BoxGeometry(o.w+10,1.4,o.h+7),md,cx,g0+18.6,cy+1);                      // its drip edge over the opening
          for(const fx of(o.w>200?[0,.25,.5,.75,1]:[0,1]))P(new T.BoxGeometry(6,12.6,o.h+2),m,o.x+3+fx*(o.w-6),g0+12.6,cy);
        }else{P(new T.BoxGeometry(o.w+2,24.5,o.h+4),m,cx,g0+12.2,cy+1);
          const east=cx>DDX+({p0:342,p1:668,p2:906,p3:880,tp:240}[o.bk]||90)?1:-1;if(!((o.bk==='p1'&&east>0)||(o.bk==='p2'&&east<0))){const be=P(new T.SphereGeometry(1,10,7),me,cx+east*9,g0+1,cy+4);be.scale.set(13,15,o.h*.62);   // earth banked against the side
          const tf=P(new T.SphereGeometry(1,8,6),bkM(o.bk,3),cx+east*10,g0+13,cy+6);tf.scale.set(8,4.5,o.h*.4);}}
      }}
    else if(o.kind==='ddgate'){   // a steel frame gate with cross bars
      o.meshes=[];const n=Math.round(o.w/14);
      for(let k=0;k<=n;k++)o.meshes.push(add(new T.BoxGeometry(1.6,17,1.6),steel,o.x+k*o.w/n,g0+8.5,cy));
      for(const hh of[4,10,16])o.meshes.push(add(new T.BoxGeometry(o.w,1.2,1.2),steel,cx,g0+hh,cy));
      for(let k=0;k<n;k++)o.meshes.push(add(new T.BoxGeometry(hyp(o.w/n,12),1,1),rust,o.x+(k+.5)*o.w/n,g0+10,cy,0,0,(k%2?1:-1)*Math.atan2(12,o.w/n)));
    }else if(o.kind==='ddbould'){   // (Version 190: not dice: one of three jittered, rounder stones, shaded darker at the foot, sunk a little; the same random draws as before)
      const v=Math.abs((cx*7+cy*13)|0)%3,k='bouldG'+v,g=DD[k]||(DD[k]=typeof ddgJitter==='function'?ddgShade(ddgJitter(new T.IcosahedronGeometry(10,1),3.4,11+v),.6,1.1,.1,21+v):new T.DodecahedronGeometry(10,0));
      const bm=DD.bouldM||(DD.bouldM=new T.MeshStandardMaterial({color:0x837868,roughness:1,flatShading:true,vertexColors:!!g.attributes.color}));
      const m=add(g,bm,cx,g0+2.6,cy,r()*6);m.scale.set(1.08,.74+r()*.24,.94);(o.meshes=[]).push(m);}
    else if(o.kind==='ddcrate'){o.meshes=[add(ddgCrates(o.w,13,o.h,r),crateM,cx,g0,cy)];}   // (Version 188: a stack of ammunition boxes, not one plain block)
    else if(o.kind==='ddhog'){   // a steel hedgehog: three girders crossed
      // (Version 188: angle-iron girders, chunky and rusted, riveted plates where they cross; one mesh)
      const P=[];for(const[rx,rz]of[[.6,.6],[-.6,.6],[0,-1.0]]){const ry=r()*.4,a1=new T.BoxGeometry(3.6,23,1),a2=new T.BoxGeometry(1,23,3.6);a1.translate(0,0,1.3);a2.translate(1.3,0,0);P.push({g:a1,r:[rx,ry,rz]},{g:a2,r:[rx,ry,rz]});}
      P.push({g:new T.BoxGeometry(5,5,1.2),r:[0,.3,0]},{g:new T.BoxGeometry(1.2,5,5),r:[0,.3,0]});
      o.meshes=[add(ddgMerge(P,false),hogM,cx,g0+7,cy)];
    }else if(o.kind==='ddwire'){   // the fence: posts, three strands and a coil of barbed wire along the top
      // (Version 188: one mesh a stretch: weathered posts and iron pickets, three strands, and concertina coiled along the top and the foot)
      o.meshes=[add(ddgWire(o,r),wireM,cx,g0,cy)];
    }else if(o.kind==='fence'){   // coils of barbed wire on stakes
      o.meshes=[];const n=Math.round(o.w/7),wm=M(0x55504a,.5,.7);
      for(let k=0;k<n;k++){const x=o.x+k*7+3.5,t=add(new T.TorusGeometry(4,.3,4,9),wm,x,ddH(x,cy)+4.2,cy,Math.PI/2+.35);o.meshes.push(t);}
      for(let x=o.x;x<=o.x+o.w;x+=38)o.meshes.push(add(new T.BoxGeometry(1,9,1),wood,x,ddH(x,cy)+4.5,cy));
    }else if(o.kind==='ddwreck'){
      if(o.lc){o.meshes=[ddBoatMesh(G,true)];o.meshes[0].position.set(cx,g0-1,cy);o.meshes[0].rotation.set(.05,.3,.22);}
      else if(typeof ddgTankWreckGeo==='function'){   // (Version 190: a knocked-out tank, not three black boxes: on the beach a Sherman, olive drab sooted, its star still showing; in the village a burnt Panzer; the turret turned, the gun down; the same footprint)
        const pz=DD_MODE==='village',W=ddgTankWreckGeo(pz?'panzer':'sherman'),k='wreckM'+(pz?1:0),ms=DD[k]||(DD[k]=ddgTankMats(pz?'burnt':'shermanw')),along=o.w>=o.h,sc=Math.min(Math.max(o.w,o.h)/64,Math.min(o.w,o.h)/36),ry=(along?0:-Math.PI/2)+(Math.abs(cx*13+cy*7)%10/10-.5)*.2;
        o.meshes=[add(W.paint,ms[0],cx,g0-1,cy,ry,.03,-.04),add(W.trk,ms[1],cx,g0-1,cy,ry,.03,-.04)];for(const m of o.meshes)m.scale.setScalar(sc);}
      else{box(o,14,dark);o.meshes.push(add(new T.BoxGeometry(22,9,18),dark,cx+4,g0+18,cy),add(new T.CylinderGeometry(1.4,1.4,30,6),dark,cx+22,g0+19,cy-2,0,0,Math.PI/2-.25));}
    }else if(o.kind==='ddgun'){   // a gun on its mount, barrel out over the beach
      if(o.east){o.meshes=[add(new T.BoxGeometry(o.w,9,o.h),steel,cx,g0+4.5,cy),add(new T.BoxGeometry(3,12,20),olive,cx+7,g0+13,cy)];const b=add(new T.CylinderGeometry(1.7,2.2,64,8),steel,cx+36,g0+15,cy,0,0,-(Math.PI/2-.07));o.meshes.push(b);o.barrel=b;}   // (Version 210: the heavy gun turned east)
      else{o.meshes=[add(new T.BoxGeometry(o.w,9,o.h),steel,cx,g0+4.5,cy),add(new T.BoxGeometry(20,12,3),olive,cx,g0+13,cy+7)];
      const b=add(new T.CylinderGeometry(1.7,2.2,o.tag==='heavy'?64:o.tag==='art'?70:46,8),steel,cx,g0+(o.tag==='art'?24:15),cy+(o.tag==='heavy'?36:o.tag==='art'?30:27),0,Math.PI/2-(o.tag==='art'?.55:.07));o.meshes.push(b);o.barrel=b;}
    }else if(o.kind==='ddbarr'){   // the barracks: a long hut, pitched roof, door and windows to the south
      // (Version 188: weatherboarded walls on a concrete footing, a tiled roof with its ridge, stovepipes, the door and windows framed)
      o.meshes=[add(ddgBoxUV(o.w,26,o.h,32,[.5,.02]),ddgMat('boards'),cx,g0+13,cy),add(new T.BoxGeometry(o.w+2,3,o.h+2),concD,cx,g0+1.2,cy)];
      const rs=new T.Shape();rs.moveTo(-o.h/2-5,0);rs.lineTo(o.h/2+5,0);rs.lineTo(0,17);rs.closePath();const roof=add(new T.ExtrudeGeometry(rs,{depth:o.w+12,bevelEnabled:false}),M(0x5a4a3a,.95),o.x-6,g0+26,cy,Math.PI/2);o.meshes.push(roof);
      o.meshes.push(add(ddgRoof(o.h+10,o.w+14,17),ddgMat('tiles'),cx,g0+26,cy));
      for(const fx of[.22,.7])o.meshes.push(add(new T.CylinderGeometry(1.1,1.1,9,7),dark,o.x+o.w*fx,g0+40,cy-o.h*.18));
      o.meshes.push(add(new T.BoxGeometry(18,20,1.5),dark,cx,g0+10,o.y+o.h+.6),add(new T.BoxGeometry(22,2,2.4),wood,cx,g0+21,o.y+o.h+.9));
      for(const dxw of[-80,-40,40,80])o.meshes.push(add(new T.BoxGeometry(15,10.5,.8),wood,cx+dxw,g0+15,o.y+o.h+.3),add(new T.BoxGeometry(15,1.2,2),wood,cx+dxw,g0+9.6,o.y+o.h+.9));
      for(const dxw of[-80,-40,40,80])o.meshes.push(add(new T.BoxGeometry(12,8,1.2),new T.MeshBasicMaterial({color:0xd9b46a}),cx+dxw,g0+15,o.y+o.h+.5));
    }
  }
  if(DD_MODE==='counter'){DD.roofs=[];dcBuild(G,sc,M,add);return;}
  if(DD_MODE==='village'){DD.roofs=[];vgBuild(G,sc,M,add);return;}   // (Chapter 3's own props: ddvillage.js)   // (the counterattack's own props: ddcounter.js)
  // roofs over the pillbox and the nests (they fade when one of ours is inside: ddFrame), the heavy gun's and the cannon's shields
  // a bunker's roof: a thick slab with a chamfered edge, turf and a few sandbags on top, a vent pipe; all in the bunker's own materials
  const slab=(dx0,y0,w,d,hh,bk)=>{const x=dx0+DDX+w/2,y=y0+d/2,g0=ddH(x,y),rm=bkM(bk,1),m=add(new T.BoxGeometry(w+12,5,d+12),rm,x,g0+hh,y);
    const parts=[add(new T.BoxGeometry(w+6,2.2,d+6),bkM(bk,0),x,g0+hh+3.4,y)];   // (parts: everything on the roof, so the whole of it can be hidden: ddpost.js)
    const tf=add(new T.SphereGeometry(1,10,6),bkM(bk,3),x-w*.12,g0+hh+4.2,y-d*.1);tf.scale.set(w*.34,2.6,d*.34);parts.push(tf);
    for(let k=0;k<5;k++){const b=add(bagG,bkM(bk,2),x-w/2+6+k*8.5,g0+hh+6.4,y+d/2+1);b.scale.set(4.4,2.2,3);parts.push(b);}
    parts.push(add(new T.CylinderGeometry(1.1,1.1,7,7),bkM(bk,1),x+w*.3,g0+hh+7,y-d*.25));m.userData.parts=parts;m.userData.bk=bk;
    m.userData.b={x0:dx0+DDX,x1:dx0+DDX+w,y0,y1:y0+d};m.userData.top=g0+hh+8;m.userData.walls=BK[bk]||null;return m;};
  DD.roofs=[slab(300,250,84,48,25,'p0'),slab(626,250,84,48,25,'p1'),slab(826,250,160,48,25,'p2'),slab(826,154,108,48,25,'p3'),slab(90,-620,300,56,25,'tp'),slab(30,-440,120,76,25,'hv')];
  for(const m of DD.roofs)m.castShadow=true;
  // the machine guns themselves: a barrel on a tripod at every gun's place, pointing where it covers
  {const gm=M(0x2a2c2e,.5,.7);for(const sp of[DD_SPOT.leftMG,...DD_SPOT.leftMGs,DD_SPOT.pill,...DD_SPOT.pillMGs,...DD_SPOT.nests,DD_SPOT.topMG,DD_SPOT.drawMG,DD_SPOT.hillMG,DD_SPOT.hillMG2,DD_SPOT.hillMG3,DD_SPOT.pathMG,...DD_SPOT.heavyMGs]){const x=sp.x+DDX,y=sp.y,g0=ddH(x,y)+(sp.elev||0),g=new T.Group();g.position.set(x,g0,y);g.rotation.y=-sp.ang;sp.g=g;
      const q=(geo,px,py,pz,rz,ry)=>{const b=new T.Mesh(geo,gm);b.position.set(px,py,pz);if(rz)b.rotation.z=rz;if(ry)b.rotation.y=ry;b.castShadow=true;g.add(b);};
      q(new T.CylinderGeometry(.75,.75,17,7),9,11.6,0,Math.PI/2);q(new T.CylinderGeometry(1.25,1.25,7,8),3,11.6,0,Math.PI/2);q(new T.BoxGeometry(5,3,2.2),-2,11.2,0);q(new T.BoxGeometry(3,2.4,4.6),1,10.6,2.6);
      for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,13,5),gm);l.position.set(Math.cos(a)*3.4,5.4,Math.sin(a)*3.4);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}
      G.add(g);}}
  if(DD_MODE==='beach'&&typeof ddPostBuild==='function')ddPostBuild(G,add,M);   // (Version 198: the checkpoint)
  if(typeof ddDress==='function')ddDress(G,sc,M);   // (ddlook.js: grass, bushes, trees, stones, clutter)
  // the battle next door: the same works, mirrored
  for(const s of[-1,1]){const c=G.clone(true);c.scale.x=-1;c.position.x=s<0?0:2*(DDB.x1-DDB.x0);sc.add(c);
    for(const m of c.children)if(!m.isInstancedMesh&&m.position.z<-330&&m.position.x>(s<0?1200:860))m.visible=false;}   // (no mirror image where their base stands, or of it: ddbase.js)
  if(typeof ddBaseBuild==='function')ddBaseBuild(sc);
}
// a landing craft: a steel box of a hull, a ramp at the bow (north, -z) that drops (Version 188: its look is ddground.js's LCVP, one mesh and the ramp)
function ddBoatMesh(parent,wreck){
  const L=ddgLCVP(),g=new T.Group(),mat=wreck?L.mw:L.m;
  const hull=new T.Mesh(L.hull,mat);hull.castShadow=true;hull.receiveShadow=true;g.add(hull);
  const ramp=new T.Group();ramp.position.set(0,3,-52);const rp=new T.Mesh(L.ramp,mat);rp.castShadow=true;rp.receiveShadow=true;ramp.add(rp);g.add(ramp);g.userData.ramp=ramp;
  (parent||scene).add(g);return g;
}
// bits of men (ddplay.js's gore): a pool of small blocks thrown about, then lying where they land. Version 190: flat chunks, not cubes, their colours
// taken toward light as ddlight.js takes the rest (set after its sweep, they showed as bright red debug boxes), and they sink into the ground after 8 s
function ddGibPool(sc){
  DD.gibs=[];const geos=[new T.BoxGeometry(2.4,1.3,3.2),new T.BoxGeometry(2.8,1.2,2.4),new T.BoxGeometry(4,1.7,3),new T.SphereGeometry(1.2,5,4).scale(1,.5,1)];
  for(let i=0;i<44;i++){const mt=new T.MeshStandardMaterial({color:0x6a1410,roughness:.85});mt.userData.ddKeep=true;const m=new T.Mesh(geos[i%geos.length],mt);m.visible=false;m.castShadow=true;sc.add(m);DD.gibs.push({m,on:false,v:[0,0,0],w:[0,0,0],t:0});}
}
function ddGib(x,y,n,cloth,pow=1){
  if(!DD)return;let k=0;
  for(const g of DD.gibs){if(k>=n)break;if(g.on&&g.t<14)continue;const a=Math.random()*TAU,s=(30+Math.random()*70)*pow;
    g.on=true;g.t=0;g.m.visible=true;g.m.position.set(x+(Math.random()-.5)*6,ddH(x,y)+8+Math.random()*8,y+(Math.random()-.5)*6);
    g.v=[Math.cos(a)*s,60+Math.random()*90*pow,Math.sin(a)*s];g.w=[Math.random()*9-4.5,Math.random()*9-4.5,Math.random()*9-4.5];
    const c=g.m.material.color.set(k%3===1&&cloth?cloth:k%4===3?0x9a7a62:0x5a1410);if(typeof ddLinCol==='function')ddLinCol(c);k++;}
}
// water thrown up: by a shell in the sea, by bullets round the boats (ddplay.js's ride in). Since Version 188 white columns of spray that rise, hang and
// fall back, with a crown round the foot and a ring of foam left on the water (ddsea.js's ddSeaSplash); the old cone's pool (DD.spl) stays empty
function ddSplash(x,y,s=1){if(DD&&typeof ddSeaSplash==='function')ddSeaSplash(x,y,s);}
// blood on the ground (Version 167, Bryan: "way to confusing and messy"): small and gone again in about half a minute. Flat
// sprites lying on the slope from a pool of 48 (the oldest reused), not paint baked into the ground's picture for good
function ddBlood(x,y,s=1){
  if(!DD||!DD.scene)return;
  if(!DD.blood){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d');
    for(let i=0;i<7;i++){const a=i*2.4,d=i?6+Math.random()*12:0,cx=32+Math.cos(a)*d,cy=32+Math.sin(a)*d,r=i?5+Math.random()*7:17;const gr=g.createRadialGradient(cx,cy,0,cx,cy,r);gr.addColorStop(0,'rgba(255,255,255,1)');gr.addColorStop(.7,'rgba(255,255,255,.9)');gr.addColorStop(1,'rgba(255,255,255,0)');g.fillStyle=gr;g.beginPath();g.arc(cx,cy,r,0,TAU);g.fill();}
    const tex=new T.CanvasTexture(c),geo=new T.PlaneGeometry(1,1);geo.rotateX(-Math.PI/2);DD.blood=[];DD.bloodI=0;
    for(let i=0;i<48;i++){const m=new T.Mesh(geo,new T.MeshBasicMaterial({map:tex,color:0x4a0705,transparent:true,opacity:0,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-2,polygonOffsetUnits:-2}));m.visible=false;m.renderOrder=1;DD.scene.add(m);DD.blood.push({m,on:false,t:0,r:1});}}
  const q=DD.blood[DD.bloodI++%DD.blood.length],e=4,n=new T.Vector3(-(ddH(x+e,y)-ddH(x-e,y))/(2*e),1,-(ddH(x,y+e)-ddH(x,y-e))/(2*e)).normalize();
  q.on=true;q.t=0;q.r=(7+Math.random()*5)*s;q.m.visible=true;q.m.position.set(x,ddH(x,y)+.3,y);
  q.m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),n).multiply(new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.random()*TAU));
}
// a bullet on steel: a white-hot flash and a few sparks thrown off (the boats' hulls and helmets on the ride in; steel obstacles and wrecks in the fight)
function ddSpark(x,h,y,k=1){
  if(!DD)return;const P=DD.spk||(DD.spk=[]);let q=P.find(o=>!o.on);
  if(!q){if(P.length>=16)return;const g=new T.Group(),fm=new T.MeshBasicMaterial({color:0xffeeb0,transparent:true,fog:false,depthWrite:false}),f=new T.Mesh(new T.OctahedronGeometry(1,0),fm);g.add(f);
    const bits=[];for(let i=0;i<5;i++){const m=new T.Mesh(new T.BoxGeometry(.32,.32,2.6),new T.MeshBasicMaterial({color:0xffb040,transparent:true,fog:false,depthWrite:false}));g.add(m);bits.push({m,v:[0,0,0]});}
    DD.scene.add(g);q={g,f,bits,on:false};P.push(q);}
  q.on=true;q.t=0;q.k=k;q.g.visible=true;q.g.position.set(x,h,y);
  for(const b of q.bits){const a=Math.random()*TAU,s=30+Math.random()*60;b.v=[Math.cos(a)*s,25+Math.random()*70,Math.sin(a)*s*.6+18];b.m.position.set(0,0,0);}
}
// every frame (from render): the sea, the boats, the bits, the day going by, the roofs over our men
// Our rockets in 3D (Bryan: "watch a rocket go through the air"): a fat rocket with fins and a burning tail, a white smoke trail left behind it,
// and at the launch a flash at the muzzle and the blast out of the back of the tube
function ddRockets(rdt){
  const T=THREE,R=DD.rk||(DD.rk={pool:[],puffs:[],n:0});
  if(!R.geo){R.geo=new T.SphereGeometry(1,7,5);
    R.mk=()=>{const g=new T.Group(),bm=new T.MeshStandardMaterial({color:0x4a5038,roughness:.6,metalness:.3}),fm=new T.MeshBasicMaterial({color:0xffc060,transparent:true,opacity:.95,fog:false});
      const b=new T.Mesh(new T.CylinderGeometry(.75,.75,5.2,10),bm);b.rotation.z=-Math.PI/2;g.add(b);
      const n=new T.Mesh(new T.ConeGeometry(1.05,2.6,10),bm);n.rotation.z=-Math.PI/2;n.position.x=3.9;g.add(n);
      for(let i=0;i<4;i++){const f=new T.Mesh(new T.BoxGeometry(1.8,1.7,.14),bm);f.position.set(-2.6,0,0);const h=new T.Group();h.rotation.x=i*Math.PI/2;f.position.y=.9;h.add(f);g.add(h);}
      const fl=new T.Mesh(new T.ConeGeometry(1.0,6,8),fm);fl.rotation.z=Math.PI/2;fl.position.x=-5.6;g.add(fl);g.userData.fl=fl;
      const gl=new T.Mesh(R.geo,new T.MeshBasicMaterial({color:0xffe6a0,transparent:true,opacity:.9,fog:false}));gl.scale.setScalar(1.5);gl.position.x=-3.2;g.add(gl);
      g.scale.setScalar(2.1);DD.scene.add(g);return g;};
    R.puff=(x,h,y,s,life,col,vy)=>{if(typeof ddFxPuff==='function'&&ddFxPuff(x,h,y,s,life,col,vy,Math.random(),Math.random(),Math.random()))return;let p=R.puffs.find(q=>q.t>=q.life);if(!p){if(R.puffs.length>260)return;const m=new T.Mesh(R.geo,new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,depthWrite:false}));DD.scene.add(m);p={m,t:0,life:0};R.puffs.push(p);}
      p.t=0;p.life=life;p.s=s;p.vy=vy||3;p.m.material.color.setHex(col);p.m.position.set(x+(Math.random()-.5)*2,h+(Math.random()-.5)*2,y+(Math.random()-.5)*2);p.m.visible=true;};
  }
  let i=0;
  for(const r of rockets){if(!r.by||r.by.side!=='P'||!r.total)continue;
    const f=1-r.left/r.total,sx=r.x-r.dx*(r.total-r.left),sy=r.y-r.dy*(r.total-r.left),ex=r.x+r.dx*r.left,ey=r.y+r.dy*r.left;
    const h0=ddH(sx,sy)+(r.z0||15)*1.3,h1=ddH(ex,ey)+(r.z1||8),h=Math.max(h0+(h1-h0)*f+Math.sin(f*Math.PI)*Math.min(26,r.total*.05),ddH(r.x,r.y)+4);
    const g=R.pool[i]||(R.pool[i]=R.mk());i++;g.visible=true;
    if(!r.dd3){r.dd3={h};   // the launch: the flash, and the back-blast behind the man
      for(let k=0;k<7;k++)R.puff(sx-r.dx*(10+k*5),h0-1,sy-r.dy*(10+k*5),5+k*1.6,.9+k*.12,k<2?0xffb040:0xd8d4c8,5);
      for(let k=0;k<3;k++)R.puff(sx+r.dx*(12+k*4),h0,sy+r.dy*(12+k*4),4,.35,0xffd070,2);}
    const dh=h-r.dd3.h;r.dd3.h=h;g.position.set(r.x,h,r.y);g.rotation.set(0,-Math.atan2(r.dy,r.dx),0);g.rotateZ(Math.atan2(dh,Math.max(.01,(r.speed||300)*Math.max(rdt,.001))));
    g.userData.fl.scale.set(1,.8+Math.random()*.7,1);
    r.dd3.e=(r.dd3.e||0)+rdt;while(r.dd3.e>0){r.dd3.e-=.012;R.puff(r.x-r.dx*(9+Math.random()*4),h,r.y-r.dy*(9+Math.random()*4),4.2,1.8,0xe8e6de,4);}
  }
  for(;i<R.pool.length;i++)R.pool[i].visible=false;
  for(const p of R.puffs){if(p.t>=p.life){if(p.m.visible)p.m.visible=false;continue;}p.t+=rdt;const q=Math.min(1,p.t/p.life);p.m.scale.setScalar(p.s*(.55+q*1.5));p.m.position.y+=p.vy*rdt;p.m.material.opacity=.7*(1-q)*(1-q);}
}
// does a bunker's roof (and its walls) stand between the camera and man p? The line from the camera to his chest crosses the roof's footprint below
// its top (Liang-Barsky on the footprint, then the line's height where it goes in and comes out)
function ddRoofHides(m,p){
  const b=m.userData.b,C=camera.position,x0=C.x,y0=C.z,dx=p.x-x0,dy=p.y-y0;let t0=0,t1=1;
  for(const[q,r]of[[-dx,x0-b.x0],[dx,b.x1-x0],[-dy,y0-b.y0],[dy,b.y1-y0]]){if(q===0){if(r<0)return false;continue;}const t=r/q;if(q<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}
  const ph=gndH(p.x,p.y)+14,h=t=>C.y+(ph-C.y)*t;return Math.min(h(t0),h(t1))<(m.userData.top||0);
}
function ddFrame(rdt,now){
  if(!DD)return;
  ddRockets(rdt);
  // (the sea moves in its own shader since Version 188: ddSeaFrame, below)
  // (and so does the surf: ddsea.js's shore break)
  if(Math.abs(DD.day-DD.dayShown)>.004){DD.dayShown+=clamp(DD.day-DD.dayShown,-rdt*.05,rdt*.05);ddSky(DD.dayShown);}
  if(DD.dome)DD.dome.position.set(camera.position.x,0,camera.position.z);
  // (Version 175: also while it stands between the camera and a man of the squad you play: the camera that turns with the route looks past bunkers from the side; ddRoofHides)
  const sq=DD.roofs&&DD.roofs.length?players.filter(p=>alive(p)&&p.team===dd.active&&!p.inBoat):[];
  for(const m of DD.roofs||[]){const b=m.userData.b,inside=players.some(p=>alive(p)&&p.x>b.x0&&p.x<b.x1&&p.y>b.y0&&p.y<b.y1)||sq.some(p=>ddRoofHides(m,p));m.material.opacity+=((inside?.18:1)-m.material.opacity)*Math.min(1,rdt*8);m.material.depthWrite=m.material.opacity>.95;const w=m.userData.walls;if(w)for(const q of w)if(q&&q!==m.material){q.opacity=m.material.opacity;q.depthWrite=m.material.depthWrite;}}   // (a bunker with one of ours inside goes clear, walls and roof: Bryan, "the wall goes transparent when they get in there")
  const dt=Math.min(.05,rdt)*(typeof timeScale==='function'&&state==='play'?timeScale():1);
  for(const g of DD.gibs){if(!g.on)continue;g.t+=dt;const p=g.m.position;
    if(g.v){g.v[1]-=260*dt;p.x+=g.v[0]*dt;p.y+=g.v[1]*dt;p.z+=g.v[2]*dt;g.m.rotation.x+=g.w[0]*dt;g.m.rotation.y+=g.w[1]*dt;g.m.rotation.z+=g.w[2]*dt;
      const fl=ddH(p.x,p.z)+1.2;if(p.y<=fl){p.y=fl;if(Math.abs(g.v[1])>50){g.v[1]*=-.3;g.v[0]*=.5;g.v[2]*=.5;}else g.v=null;}}   // (no blood where it bounces: Version 167)
    if(g.t>12){g.on=false;g.m.visible=false;}}
  for(const q of DD.blood||[]){if(!q.on)continue;q.t+=dt;if(q.t>=28){q.on=false;q.m.visible=false;continue;}const k=Math.min(1,q.t/.5);q.m.scale.set(q.r*(.55+.45*k),1,q.r*(.55+.45*k)*.8);q.m.material.opacity=.82*Math.min(1,(28-q.t)/6);}   // (blood: spreads, then fades out from 22 s)
  for(const q of DD.spl||[]){if(!q.on)continue;q.t+=dt;const D=.5+q.s*.45,k=q.t/D;if(k>=1){q.on=false;q.m.visible=false;continue;}
    const up=Math.sin(Math.min(1,k*1.5)*Math.PI/2)*(1-k*k*.6);q.m.scale.set(q.s*(3+k*7),Math.max(.01,q.s*26*up),q.s*(3+k*7));q.m.material.opacity=.85*(1-k);}
  for(const q of DD.spk||[]){if(!q.on)continue;q.t+=dt;const k=q.t/.32;if(k>=1){q.on=false;q.g.visible=false;continue;}
    const fl=Math.max(0,1-q.t/.07);q.f.scale.setScalar(.01+q.k*2.3*fl);q.f.rotation.z=q.t*40;
    for(const b of q.bits){b.v[1]-=220*dt;b.m.position.x+=b.v[0]*dt;b.m.position.y+=b.v[1]*dt;b.m.position.z+=b.v[2]*dt;b.m.lookAt(q.g.position.x+b.m.position.x+b.v[0],q.g.position.y+b.m.position.y+b.v[1],q.g.position.z+b.m.position.z+b.v[2]);b.m.material.opacity=1-k;}}
  if(typeof ddLookFrame==='function')ddLookFrame(dt,now);
  if(typeof ddMarkFrame==='function')ddMarkFrame(rdt);
  if(typeof ddLightFrame==='function')ddLightFrame(rdt,now);   // (Version 188: the light and sky, ddlight.js)
  if(typeof ddSeaFrame==='function')ddSeaFrame(rdt,now,dt);   // (Version 188: the sea and the shore, ddsea.js)
  if(typeof ddFxFrame==='function')ddFxFrame(rdt,now,dt);   // (Version 188: blasts, smoke, dust and fire, ddfx.js)
  if(typeof ddGroundFrame==='function')ddGroundFrame(rdt,now,dt);   // (Version 188: the ground's dressing, ddground.js)
  if(DD_MODE==='village'&&typeof vgFrame==='function')vgFrame(rdt,now);   // (the canopy opens over our men, ddvillage.js)
  if(typeof ddCam==='function')ddCam(rdt);   // (ddplay.js: the camera keeps with the squad)
}
