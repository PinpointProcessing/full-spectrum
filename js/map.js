"use strict";
/* Map data (the yard and warehouse, and the shipping depot with the checkpoint to the east) plus geometry queries:
   line of sight, cover, free space. */
const objs=[];
const FULL=new Set(['container','wall','truck','rack','fence','gate','booth','tower','tank','armor','office','garage','fortcore','bridge','pylon']);   // armor: the enemy tank once it's in position
function O(kind,x,y,w,h,extra){objs.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind)},extra||{}));}
// outer fence (open at the dock in the south-west corner, x 0-175, where the water is)
O('fence',0,TOP,W,8);O('fence',175,H-8,W-175,8);O('fence',0,TOP,8,852-TOP);O('fence',W-8,TOP,8,H-TOP);
O('fence',0,0,YARD_W,8);   // the yard's north fence
// the yard's east fence, with a gate at its north end (y 22-92). Reinforcements smash through it in their gun jeep (waves.js);
// beyond it a road curves onto the depot's main road. It stays an obstacle (the area is closed) until the depot opens (hq.js).
O('fence',YARD_W-8,0,8,22);O('fence',YARD_W-8,92,8,H-92);
const depotGate=objs[objs.push({kind:'gate',x:YARD_W-8,y:22,w:8,h:70,full:true})-1];
// the dock in the south-west corner, where the squad comes ashore by dinghy: water either side of a short wooden pier
// (x 120-142). Water blocks movement but not sight, and is never cover.
O('water',0,852,120,48);O('water',142,852,33,48);
const DOCK={pier:{x:120,y:852,w:22,h:40},moor:{x:96,y:872},quay:852};
// warehouse shell (x170-450, y260-560)
O('wall',170,260,115,10);O('wall',325,260,125,10);           // north, back door 285-325
O('wall',170,550,90,10);O('wall',360,550,90,10);             // south, roll door 260-360
O('wall',170,270,10,125);O('window',170,395,10,60);O('wall',170,455,10,95);   // west + window
O('wall',440,270,10,110);O('window',440,380,10,40);O('wall',440,420,10,30);O('wall',440,500,10,50); // east + window, door 450-500
// interior
O('crate',258,470,30,14);O('crate',332,470,30,14);O('crate',210,505,24,14);O('crate',386,505,24,14);
O('crate',300,382,20,20);O('rack',205,300,80,14);O('rack',335,300,80,14);
// southwest start
O('container',40,700,104,34,{col:'#2e5759',tag:'TCNU 4410'});
O('container',184,742,34,104,{col:'#6a3324',tag:'MSKU 0927'});
// sandbag nest + single bags
O('sandbag',170,618,70,12);O('sandbag',170,630,12,30);O('sandbag',228,630,12,30);
O('sandbag',140,622,22,12);O('sandbag',250,622,22,12);
// yard
O('barrier',290,712,52,12);
O('truck',396,640,46,90,{col:'#3a4433'});
O('barrel',474,428,16,16,{col:'#3a5160'});O('barrel',474,446,16,16,{col:'#6b3a28'});
O('crate',508,520,28,28);
O('container',40,330,34,110,{col:'#4a5230',tag:'CMAU 7731'});
O('pallet',100,410,30,20);
O('barrel',110,520,16,16,{col:'#3a5160'});
O('container',230,120,110,34,{col:'#5b2f2a',tag:'HLXU 2208'});
O('crate',420,150,26,26);O('pallet',150,170,30,20);
O('container',520,240,34,110,{col:'#2c4a63',tag:'OOLU 5519'});
O('container',470,800,100,34,{col:'#4f565b',tag:'TGHU 3302'});
O('barrel',300,808,16,16,{col:'#6b3a28'});

/* ---------- the shipping depot (east of the yard, and the strip north of it), same rainy night ----------
   From the smashed gate at the yard's north-east corner a road (CURVE) runs east and bends north onto the main road on the
   right side of the map, which runs south to north (x 1025-1075) from the south fence. Up the main road is the checkpoint,
   facing south: a boom gate across the road, a guard tower on its west side, a watchtower on its east side, a sandbagged
   firing position and fuel tanks behind it. Past the checkpoint the road forks (at FORK): the left branch will lead to an
   office building and the right one to a drawbridge (both to come; the ground beside the branches is kept clear for them).
   Rows of single and double-stacked containers on both sides of the main road leave aisles for flanking. */
const MAIN={x0:1025,x1:1075,y0:-500},FORK={x:1050,y:-500},CKPT={x:1050,y:-300};
const CURVE={a:{x:YARD_W-4,y:57},c:{x:1050,y:57},b:{x:1050,y:-150},hw:25};   // quadratic curve from the gate to the main road
function curvePt(t){const u=1-t;return{x:u*u*CURVE.a.x+2*u*t*CURVE.c.x+t*t*CURVE.b.x,y:u*u*CURVE.a.y+2*u*t*CURVE.c.y+t*t*CURVE.b.y};}
const CK=[['#2e5759','TCNU'],['#6a3324','MSKU'],['#4a5230','CMAU'],['#5b2f2a','HLXU'],['#2c4a63','OOLU'],['#4f565b','TGHU'],['#7a5a22','CXDU'],['#3b3f6b','EGHU']];
const box=(x,y,w,h,k,stack=1)=>O('container',x,y,w,h,{col:CK[k%CK.length][0],tag:`${CK[k%CK.length][1]} ${(1000+k*397)%9000+1000}`,stack});
// south of the curving road, west of the main road: the container yard
box(640,215,110,34,3,2);box(780,215,34,70,4);
box(640,300,34,110,6);box(700,330,110,34,7,2);box(860,320,34,110,0);
box(640,470,110,34,1);box(790,450,110,34,2,2);box(930,450,34,110,3);
box(660,560,34,110,4,2);box(740,590,110,34,5);box(880,600,110,34,6,2);
box(700,700,110,34,2);box(900,690,34,90,5,2);
box(640,790,110,34,7);box(800,780,34,100,0,2);box(880,800,110,34,1);
box(700,120,34,70,1);box(820,110,110,34,5,2);
// east of the main road, south to north
box(1120,40,110,34,5);box(1200,140,34,110,1,2);box(1120,250,110,34,7);box(1230,330,34,100,2);
box(1120,390,110,34,2,2);box(1130,470,34,110,3);box(1220,460,34,110,4,2);
box(1120,620,110,34,5);box(1150,700,110,34,6,2);box(1120,800,110,34,7);box(1244,770,34,100,0);
box(1150,-50,80,34,6);box(1250,-20,34,90,0,2);
// north of the curving road: the approach to the checkpoint
box(660,-102,34,110,4,2);box(740,-72,110,34,5);box(850,-96,100,34,6,2);
box(640,-192,110,34,1);box(790,-212,110,34,2,2);box(930,-212,34,110,3);
box(1120,-272,110,34,2,2);box(1130,-192,34,110,3);box(1220,-202,34,110,4,2);
box(640,-447,110,34,3,2);box(780,-447,34,70,4);
box(640,-362,34,110,6);box(700,-332,110,34,7,2);box(860,-342,34,110,0);
// the checkpoint, across the main road and facing south
O('booth',985,-322,30,30);                     // guard tower on the west side of the gate
O('tower',1090,-332,18,18,{cover:1});          // watchtower on the east side (the open platform is half cover)
O('sandbag',972,-248,46,10);O('sandbag',972,-270,10,22);O('sandbag',1008,-270,10,22);   // firing position covering the road south
O('tank',1120,-412,44,44,{col:'#c9c6bc'});O('tank',1180,-412,44,44,{col:'#b9b4a6'});O('tank',1240,-406,36,36,{col:'#c9c6bc'});   // fuel tanks behind it
O('barrel',1135,-350,16,16,{col:'#8a2f22'});O('barrel',1153,-348,16,16,{col:'#8a2f22'});O('crate',1185,-346,26,20);
O('crate',985,-182,26,26);O('pallet',1095,-110,30,20);O('barrel',1100,-30,16,16,{col:'#3a5160'});
/* ---------- north of the fork (Bryan) ----------
   Left road: to the office / data building. Two machine-gun nests guard its front, containers stand front-left and a
   long garage on the right of the entrance (the inside comes later: the building is solid for now, doors drawn on).
   Right road: to a raised drawbridge. Across a bottomless moat (a ring-shaped pit) stands a round metal fort; a control
   panel right of the bridge says the power is off. */
const LEFT_RD={a:{x:1050,y:-500},c:{x:1000,y:-880},b:{x:620,y:-905},hw:25},RIGHT_RD={a:{x:1050,y:-500},c:{x:1090,y:-620},b:{x:1090,y:-992},hw:25};
function quadPt(q,t){const u=1-t;return{x:u*u*q.a.x+2*u*t*q.c.x+t*t*q.b.x,y:u*u*q.a.y+2*u*t*q.c.y+t*t*q.b.y};}
const PLAZA={x:440,y:-1010,w:380,h:130},OFFICE={x:420,y:-1290,w:360,h:280,door:{x:560,w:80}};
const FORT={cx:1090,cy:-1170,r0:115,r1:178},BRIDGE={x:1065,y:FORT.cy+FORT.r1,w:50,len:66},PANEL={x:1145,y:-972};
const NESTS=[{x:530,y:-952},{x:650,y:-952}];
O('office',OFFICE.x,OFFICE.y,OFFICE.w,OFFICE.h);
O('garage',820,-1190,70,270);                                     // long garage right of the entrance, roll-up doors facing the plaza
for(const n of NESTS){O('sandbag',n.x-20,n.y+12,40,10);O('sandbag',n.x-20,n.y-10,10,22);O('sandbag',n.x+10,n.y-10,10,22);}   // MG nests facing south
box(330,-985,110,34,3,2);box(340,-935,34,100,5);box(400,-900,110,34,6,2);   // containers front-left
O('crate',470,-1000,26,22);O('barrel',790,-990,16,16,{col:'#3a5160'});O('barrel',790,-1010,16,16,{col:'#6b3a28'});
// the moat: everything within FORT.r1 of the centre is a pit you can't enter (the fort's island is cut off with it); a
// square inside the fort wall blocks sight; the raised drawbridge stands at the near edge between two pylons
O('pit',FORT.cx-FORT.r1,FORT.cy-FORT.r1,FORT.r1*2,FORT.r1*2,{disk:{cx:FORT.cx,cy:FORT.cy,r:FORT.r1}});
O('fortcore',FORT.cx-80,FORT.cy-80,160,160);
O('bridge',BRIDGE.x,BRIDGE.y-8,BRIDGE.w,8);O('pylon',BRIDGE.x-12,BRIDGE.y-10,9,9);O('pylon',BRIDGE.x+BRIDGE.w+3,BRIDGE.y-10,9,9);
O('panel',PANEL.x-6,PANEL.y-4,12,8);
// decoration that doesn't block anything: the boom barrier arm across the main road
const decor=[{kind:'boom',x:MAIN.x0+2,y:CKPT.y,len:MAIN.x1-MAIN.x0-4,dir:'x'}];

function rectDist(x,y,o){if(o.disk)return Math.max(0,Math.hypot(x-o.disk.cx,y-o.disk.cy)-o.disk.r);const dx=Math.max(o.x-x,0,x-(o.x+o.w)),dy=Math.max(o.y-y,0,y-(o.y+o.h));return Math.hypot(dx,dy);}
function segHitsRect(x1,y1,x2,y2,o,pad){
  if(o.disk){const d=o.disk,dx=x2-x1,dy=y2-y1,l2=dx*dx+dy*dy||1,t=clamp(((d.cx-x1)*dx+(d.cy-y1)*dy)/l2,0,1);return Math.hypot(x1+dx*t-d.cx,y1+dy*t-d.cy)<=d.r+pad;}   // the round pit
  const rx=o.x-pad,ry=o.y-pad,rw=o.w+2*pad,rh=o.h+2*pad;
  let t0=0,t1=1;const dx=x2-x1,dy=y2-y1;
  const p=[-dx,dx,-dy,dy],q=[x1-rx,rx+rw-x1,y1-ry,ry+rh-y1];
  for(let i=0;i<4;i++){
    if(p[i]===0){if(q[i]<0)return false;}
    else{const t=q[i]/p[i];if(p[i]<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}
  }
  return true;
}
// a soldier inside a structure (a sentry in the guard tower, the watchtower lookout) sees out of it, and can be seen
function inRect(x,y,o){return x>=o.x&&x<=o.x+o.w&&y>=o.y&&y<=o.y+o.h;}
function los(ax,ay,bx,by){for(const o of objs){if(o.full&&segHitsRect(ax,ay,bx,by,o,0)&&!inRect(ax,ay,o)&&!inRect(bx,by,o))return false;}return true;}
// 0 = open, 1 = half cover, 2 = heavy cover, for a target at (tx,ty) shot from (sx,sy)
function coverAt(tx,ty,sx,sy){
  let best=0;
  for(const o of objs){
    if(o.kind==='fence'||o.kind==='water'||o.kind==='pit')continue;
    if(rectDist(tx,ty,o)>15)continue;
    if(rectDist(sx,sy,o)<15)continue;
    if(segHitsRect(sx,sy,tx,ty,o,3)){const v=o.cover||(o.full?2:1);if(v>best)best=v;}   // o.cover overrides (the open watchtower platform is half cover)
  }
  return best;
}
function isFree(x,y,pad=7.5){if(x<10||y<TOP+10||x>W-10||y>H-10)return false;for(const o of objs)if(rectDist(x,y,o)<(o.kind==='jeep'&&pad<10?Math.min(pad,4):pad))return false;return true;}   // a parked jeep doesn't seal a gap: you can squeeze past it
// How tall each kind of object stands in the 3D view, for working out what a tap actually landed on. Fences are see-through.
function objHeight(o){
  if(o.kind==='crate')return o.w*o.h>=400?14:11;
  if(o.kind==='container')return 26*(o.stack||1);
  return{wall:24,window:24,truck:24,rack:20,barrel:10,pallet:7,barrier:8,sandbag:9,jeep:12,gate:18,booth:34,tower:46,tank:32,armor:20,office:60,garage:26,bridge:66,pylon:70,panel:12}[o.kind]||0;
}
// Leaning round a corner: when a full object close by blocks the line to (tx,ty), step 8 or 14 sideways past its edge.
const PEEK_REACH=[8,14],PEEK_NEAR=22;
function leanPts(x,y,tx,ty){
  let hug=false;
  for(const o of objs)if(o.full&&rectDist(x,y,o)<=PEEK_NEAR&&segHitsRect(x,y,tx,ty,o,0)){hug=true;break;}
  if(!hug)return[];
  const d=hyp(tx-x,ty-y)||1,px=(y-ty)/d,py=(tx-x)/d,out=[];
  for(const r of PEEK_REACH)for(const s of[1,-1]){
    const lx=x+px*r*s,ly=y+py*r*s;
    if(lx<10||ly<TOP+10||lx>W-10||ly>H-10)continue;
    if(objs.some(o=>rectDist(lx,ly,o)<3))continue;
    if(los(x,y,lx,ly))out.push({x:lx,y:ly});
  }
  return out;
}
// where someone standing at (x,y) can see (tx,ty) from: right there, or leaning out. null if nowhere.
function sightFrom(x,y,tx,ty){
  if(los(x,y,tx,ty))return{x,y};
  for(const p of leanPts(x,y,tx,ty))if(los(p.x,p.y,tx,ty))return p;
  return null;
}
