"use strict";
/* Map data and geometry queries (line of sight, cover, free space). One mission, five objectives, south to north
   (Bryan): 1 take the warehouse, 2 take the bridge over the canal, 3 destroy the fuel depot's tanks, 4 sabotage the data
   center (inside) and lower the fortress drawbridge, 5 take the Headquarters (to come). */
const objs=[];
const FULL=new Set(['container','wall','truck','rack','fence','gate','booth','tower','tank','armor','office','garage','fortwall','gatehouse','gtower','bridge','pylon']);
function O(kind,x,y,w,h,extra){objs.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind)},extra||{}));}
const CK=[['#2e5759','TCNU'],['#6a3324','MSKU'],['#4a5230','CMAU'],['#5b2f2a','HLXU'],['#2c4a63','OOLU'],['#4f565b','TGHU'],['#7a5a22','CXDU'],['#3b3f6b','EGHU']];
const box=(x,y,w,h,k,stack=1)=>O('container',x,y,w,h,{col:CK[k%CK.length][0],tag:`${CK[k%CK.length][1]} ${(1000+k*397)%9000+1000}`,stack});
// perimeter fence (open at the dock in the south-west corner, where the water is; the fortress fills the north-east)
O('fence',175,H-8,W-175,8);O('fence',0,TOP,8,852-TOP);O('fence',W-8,TOP+200,8,H-TOP-200);O('fence',0,TOP,460,8);
// the dock in the south-west corner, where the squad comes ashore by dinghy: water either side of a short wooden pier
O('water',0,852,120,48);O('water',142,852,33,48);
const DOCK={pier:{x:120,y:852,w:22,h:40},moor:{x:96,y:872},quay:852};

/* ---------- objective 1: the warehouse yard (south) ---------- */
// warehouse shell (x170-450, y260-560)
O('wall',170,260,115,10);O('wall',325,260,125,10);           // north, back door 285-325
O('wall',170,550,90,10);O('wall',360,550,90,10);             // south, roll door 260-360
O('wall',170,270,10,125);O('window',170,395,10,60);O('wall',170,455,10,95);   // west + window
O('wall',440,270,10,110);O('window',440,380,10,40);O('wall',440,420,10,30);O('wall',440,500,10,50); // east + window, door 450-500
O('crate',258,470,30,14);O('crate',332,470,30,14);O('crate',210,505,24,14);O('crate',386,505,24,14);
O('crate',300,382,20,20);O('rack',205,300,80,14);O('rack',335,300,80,14);
O('container',40,700,104,34,{col:'#2e5759',tag:'TCNU 4410'});
O('container',184,742,34,104,{col:'#6a3324',tag:'MSKU 0927'});
O('sandbag',170,618,70,12);O('sandbag',170,630,12,30);O('sandbag',228,630,12,30);
O('sandbag',140,622,22,12);O('sandbag',250,622,22,12);
O('barrier',290,712,52,12);
O('truck',396,640,46,90,{col:'#3a4433'});
O('barrel',474,428,16,16,{col:'#3a5160'});O('barrel',474,446,16,16,{col:'#6b3a28'});
O('crate',508,520,28,28);
O('container',40,330,34,110,{col:'#4a5230',tag:'CMAU 7731'});
O('pallet',100,410,30,20);
O('barrel',110,520,16,16,{col:'#3a5160'});
O('container',520,240,34,110,{col:'#2c4a63',tag:'OOLU 5519'});
O('container',470,800,100,34,{col:'#4f565b',tag:'TGHU 3302'});
O('barrel',300,808,16,16,{col:'#6b3a28'});
// east of the yard: scattered containers on open ground
box(680,300,34,100,4,2);box(760,420,110,34,6);box(880,520,34,100,1);box(700,640,110,34,3,2);box(820,760,110,34,7);box(640,520,34,70,5);
O('barrel',900,330,16,16,{col:'#3a5160'});O('crate',760,560,26,26);

/* ---------- the canal and its crossings ---------- */
// three ways over: the main bridge (defended, objective 2), a sewer pipe in the west to crawl through (Bryan: small, you
// crawl; close enough to the bridge to make you nervous but out of its guards' sight: the west rifleman's view cone ends
// just short of its south mouth; nobody sees or shoots into or out of it) and a broken rail bridge (slow, exposed) in the
// east. CULVERT is the pipe's floor (16 wide: one nav cell's worth), TUNNEL the pipe from mouth to mouth.
const CANAL={y0:70,y1:134},MAINBR={x0:440,x1:512},CULVERT={x0:87,x1:103},RAILBR={x0:850,x1:890};
const TUNNEL={x0:CULVERT.x0,x1:CULVERT.x1,y0:CANAL.y0-6,y1:CANAL.y1+6};
O('water',0,CANAL.y0,CULVERT.x0,64);O('water',CULVERT.x1,CANAL.y0,MAINBR.x0-CULVERT.x1,64);O('water',MAINBR.x1,CANAL.y0,RAILBR.x0-MAINBR.x1,64);O('water',RAILBR.x1,CANAL.y0,W-RAILBR.x1,64);
const SLOW=[{x:TUNNEL.x0,y:TUNNEL.y0,w:TUNNEL.x1-TUNNEL.x0,h:TUNNEL.y1-TUNNEL.y0,k:1,hide:true,crawl:true},{x:RAILBR.x0,y:CANAL.y0-4,w:40,h:72,k:.5}];   // speed factor; in the pipe you crawl (CRAWL_SPEED) and can't be seen
function slowAt(x,y){return SLOW.find(z=>x>=z.x&&x<=z.x+z.w&&y>=z.y&&y<=z.y+z.h);}
function hideAt(x,y){const z=slowAt(x,y);return z&&z.hide?z:null;}   // inside the sewer pipe

/* ---------- objective 2: the bridge's north end ---------- */
// (Bryan: moved back north, away from the warehouse, so its guards don't engage you the moment you've taken it)
O('booth',540,-2,32,32);                                            // pillbox (a sentry inside, heavy cover)
// MG nest covering the bridge, set back from its end so you can walk round it on either side (Bryan), or hop the bags
O('sandbag',456,34,40,10);O('sandbag',456,12,10,22);O('sandbag',486,12,10,22);
O('sandbag',388,42,44,10);O('sandbag',596,48,44,10);O('barrier',360,-10,52,12);O('crate',620,0,26,22);
const BR_ZONE={x0:330,x1:660,y0:-40,y1:62};

/* ---------- the container yard (between the bridge and the depot / data center) ---------- */
box(280,-80,110,34,1);box(520,-80,110,34,3);box(430,-125,34,80,2,2);
box(300,-175,34,70,5,2);box(560,-175,110,34,7,2);box(655,-125,34,70,4,2);
box(380,-220,110,34,6);box(470,-285,34,60,0);box(300,-285,90,30,1,2);box(590,-275,34,80,2);
O('pallet',350,-125,30,20);O('barrel',520,-110,16,16,{col:'#6b3a28'});O('crate',622,-222,26,26);
const YARD2_ZONE={x0:270,x1:700,y0:-290,y1:-40};

/* ---------- objective 3: the fuel depot (north-east) ---------- */
O('fence',700,-300,280,6);O('fence',700,-300,6,100);O('fence',700,-160,6,100);O('fence',700,-66,100,6);O('fence',860,-66,132,6);   // chain-link round it: a gate on the west side, a gap in the south
O('tank',740,-280,48,48,{col:'#c9c6bc'});O('tank',815,-280,48,48,{col:'#b9b4a6'});O('tank',890,-280,48,48,{col:'#c9c6bc'});
O('tank',770,-200,44,44,{col:'#b9b4a6'});O('tank',860,-195,44,44,{col:'#c9c6bc'});
O('barrel',930,-180,16,16,{col:'#8a2f22'});O('barrel',948,-176,16,16,{col:'#8a2f22'});O('crate',760,-120,26,20);O('crate',900,-110,30,24);O('sandbag',820,-110,44,10);
const DEP_ZONE={x0:706,x1:990,y0:-296,y1:-70};

/* ---------- objective 4: the data center (north-west), inside and out ---------- */
// outer walls with three ways in (the front doors, a west door and an east door), a lobby, an office and the server room
const DC={x:30,y:-620,w:430,h:190};
O('wall',30,-620,430,10);                                                         // north
O('wall',30,-610,10,10);O('wall',30,-560,10,130);                                 // west, door y -600..-560 into the office
O('wall',450,-610,10,95);O('wall',450,-475,10,45);                                // east, door y -515..-475 into the lobby
O('wall',30,-440,60,10);O('window',90,-440,60,10);O('wall',150,-440,70,10);       // front (south), main doors x 220..270
O('wall',270,-440,70,10);O('window',340,-440,60,10);O('wall',400,-440,60,10);
O('wall',40,-530,75,10);O('wall',155,-530,170,10);O('wall',365,-530,85,10);       // corridor wall, doors x 115..155 (office) and 325..365 (server room)
O('wall',160,-610,10,80);                                                         // office | server room
O('rack',180,-603,80,12);O('rack',180,-562,80,12);O('rack',362,-603,78,12);O('rack',362,-562,78,12);   // server racks
const CORE=objs[objs.push({kind:'core',x:295,y:-592,w:36,h:30,full:false})-1];   // the server core: plant the charge here
O('desk',60,-592,44,16);O('desk',60,-558,44,16);O('desk',196,-492,90,16);O('crate',80,-482,20,20);O('rack',380,-508,50,12);
const DC_IN={x0:40,x1:450,y0:-610,y1:-440};
// the container wall across the approach, two openings (x 120..200, 330..410), each covered by a machine-gun nest just behind it
box(30,-390,90,26,3,2);box(200,-390,70,26,5);box(270,-390,60,26,6,2);box(410,-390,60,26,1);box(470,-390,60,26,7,2);
const DC_NESTS=[{x:145,y:-410},{x:355,y:-410}];
for(const n of DC_NESTS){O('sandbag',n.x-20,n.y+12,40,10);O('sandbag',n.x-20,n.y-10,10,22);O('sandbag',n.x+10,n.y-10,10,22);}
O('car',220,-330,40,22);O('barrier',60,-320,52,12);O('barrier',420,-325,52,12);
const DC_OUT={x0:20,x1:540,y0:-432,y1:-300};

/* ---------- objective 5 (to come): the fortress gate behind its moat (north-east) ---------- */
const FORT={cx:850,cy:-1000,r0:380,r1:440},BRIDGE={x:815,y:FORT.cy+FORT.r1,w:70,len:74},PANEL={x:930,y:-548};
O('pit',FORT.cx-FORT.r1,FORT.cy-FORT.r1,FORT.r1*2,FORT.r1*2,{disk:{cx:FORT.cx,cy:FORT.cy,r:FORT.r1}});
O('fortwall',FORT.cx-FORT.r0,FORT.cy-FORT.r0,FORT.r0*2,FORT.r0*2,{disk:{cx:FORT.cx,cy:FORT.cy,r:FORT.r0}});
O('gatehouse',780,-656,140,46);O('gtower',742,-650,34,34);O('gtower',924,-650,34,34);
O('bridge',BRIDGE.x,BRIDGE.y-8,BRIDGE.w,8);O('pylon',BRIDGE.x-14,BRIDGE.y-11,10,10);O('pylon',BRIDGE.x+BRIDGE.w+4,BRIDGE.y-11,10,10);
O('panel',PANEL.x-6,PANEL.y-4,12,8);
// decoration that doesn't block anything
const decor=[{kind:'wire',x0:20,x1:110,y:-292},{kind:'wire',x0:190,x1:330,y:-292},{kind:'wire',x0:400,x1:540,y:-292},{kind:'flood',x:70,y:-436},{kind:'flood',x:420,y:-436}];
// paths drawn on the ground (from the bridge north to the depot, the data center and the fortress)
const PATHS=[[{x:476,y:60},{x:476,y:-30},{x:510,y:-150},{x:640,y:-190},{x:700,y:-180}],[{x:476,y:-30},{x:420,y:-150},{x:245,y:-300},{x:245,y:-432}],[{x:640,y:-190},{x:760,y:-360},{x:850,y:-500}]];

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
  return{wall:24,window:24,truck:24,rack:20,barrel:10,pallet:7,barrier:8,sandbag:9,jeep:12,gate:18,booth:34,tower:46,tank:32,armor:20,office:90,garage:26,bridge:74,pylon:80,panel:12,gatehouse:110,gtower:130,car:12,core:18,desk:9}[o.kind]||0;
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
