"use strict";
/* Map data (every object in the yard and warehouse) plus geometry queries: line of sight, cover, free space. */
const objs=[];
const FULL=new Set(['container','wall','truck','rack','fence']);
function O(kind,x,y,w,h,extra){objs.push(Object.assign({kind,x,y,w,h,full:FULL.has(kind)},extra||{}));}
O('fence',0,0,W,8);O('fence',0,H-8,W,8);O('fence',0,0,8,H);O('fence',W-8,0,8,H);
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

const posts=[{x:30,y:560},{x:570,y:200},{x:560,y:870}];
const lights=[
  {x:310,y:574,r:175,a:.88,warm:1,flick:1},
  {x:30,y:560,r:190,a:.62,warm:1},
  {x:570,y:200,r:210,a:.66},
  {x:560,y:870,r:190,a:.56,warm:1},
  {x:245,y:345,r:115,a:.5},
  {x:375,y:345,r:115,a:.5},
  {x:310,y:470,r:95,a:.42,warm:1},
];

function rectDist(x,y,o){const dx=Math.max(o.x-x,0,x-(o.x+o.w)),dy=Math.max(o.y-y,0,y-(o.y+o.h));return Math.hypot(dx,dy);}
function segHitsRect(x1,y1,x2,y2,o,pad){
  const rx=o.x-pad,ry=o.y-pad,rw=o.w+2*pad,rh=o.h+2*pad;
  let t0=0,t1=1;const dx=x2-x1,dy=y2-y1;
  const p=[-dx,dx,-dy,dy],q=[x1-rx,rx+rw-x1,y1-ry,ry+rh-y1];
  for(let i=0;i<4;i++){
    if(p[i]===0){if(q[i]<0)return false;}
    else{const t=q[i]/p[i];if(p[i]<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}
  }
  return true;
}
function los(ax,ay,bx,by){for(const o of objs){if(o.full&&segHitsRect(ax,ay,bx,by,o,0))return false;}return true;}
// 0 = open, 1 = half cover, 2 = heavy cover, for a target at (tx,ty) shot from (sx,sy)
function coverAt(tx,ty,sx,sy){
  let best=0;
  for(const o of objs){
    if(o.kind==='fence')continue;
    if(rectDist(tx,ty,o)>15)continue;
    if(rectDist(sx,sy,o)<15)continue;
    if(segHitsRect(sx,sy,tx,ty,o,3)){const v=o.full?2:1;if(v>best)best=v;}
  }
  return best;
}
function isFree(x,y,pad=7.5){if(x<10||y<10||x>W-10||y>H-10)return false;for(const o of objs)if(rectDist(x,y,o)<pad)return false;return true;}
// How tall each kind of object stands in the 3D view, for working out what a tap actually landed on. Fences are see-through.
function objHeight(o){
  if(o.kind==='crate')return o.w*o.h>=400?14:11;
  return{container:26,wall:24,window:24,truck:24,rack:20,barrel:10,pallet:7,barrier:8,sandbag:9}[o.kind]||0;
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
    if(lx<10||ly<10||lx>W-10||ly>H-10)continue;
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
