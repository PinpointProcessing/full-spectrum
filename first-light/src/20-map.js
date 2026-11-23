/* Map: collision rectangles for everything solid, line of sight, and pathfinding.
   Layout, south to north: your house (y 1220-1400) -> cross street (1100-1160) -> Sycamore Court running north (x 300-420)
   past three rows of houses -> guardrail (334) -> grass bank -> concrete storm channel (120-262) -> the big pipe (x 330-390, y 10-108). */
const objs=[];
const KIND={wall:{full:1,tall:1},door:{full:1,tall:1},house:{full:1,tall:1},shed:{full:1,tall:1},van:{full:1,tall:1},truck:{full:1,tall:1},bus:{full:1,tall:1},ambo:{full:1,tall:1},
  fence:{full:1,tall:1},fridge:{full:1,tall:1},headwall:{full:1,tall:1},pwall:{full:1},tree:{},hedge:{tall:1}};
function O(kind,x,y,w,h,extra){const k=KIND[kind]||{};const o=Object.assign({kind,x,y,w,h,full:!!k.full,tall:!!k.tall},extra||{});objs.push(o);return o;}

/* ---- your house ---- */
const HS={x0:250,y0:1220,x1:470,y1:1400};
O('wall',250,1220,40,6);const fwin=O('fwin',290,1220,40,6);O('wall',330,1220,16,6);const fdoor=O('door',346,1220,30,6);O('wall',376,1220,24,6);O('window',400,1220,40,6);O('wall',440,1220,30,6);
O('wall',250,1394,35,6);O('window',285,1394,40,6);O('wall',325,1394,145,6);
O('wall',250,1226,6,114);O('window',250,1340,6,30);O('wall',250,1370,6,24);
O('wall',464,1226,6,168);
O('wall',256,1304,62,6);O('wall',348,1304,116,6);        // bedroom door gap 318-348
O('wall',358,1310,6,16);O('wall',358,1356,6,38);         // bathroom door gap 1326-1356
const bed=O('bed',280,1350,32,42);
O('furn',260,1378,14,14,{f:'night'});
const dresser=O('furn',272,1311,40,10,{f:'dresser'});
O('furn',430,1312,32,26,{f:'tub'});
O('furn',366,1378,22,14,{f:'sink'});
O('furn',260,1238,14,52,{f:'sofa'});
O('furn',292,1254,16,26,{f:'table'});
O('furn',404,1227,48,11,{f:'counter'});
O('furn',452,1238,11,44,{f:'counter'});
O('furn',400,1262,30,16,{f:'island'});
O('fridge',446,1284,16,18);
for(const o of objs)o.home=1;
const TVPOS={x:292,y:1317,h:19};
/* ---- around the house ---- */
O('fence',230,1432,260,6);
O('house',40,1232,160,150,{col:0x8a8f80,roof:0x3a3431,ridge:'x'});
O('house',520,1232,160,150,{col:0x7f8794,roof:0x2f3238,ridge:'x'});
O('car',412,1170,24,46,{col:0x2f4a66,style:'sedan'});
/* ---- cross street, both ends jammed ---- */
O('barrier',36,1100,10,28);O('barrier',36,1132,10,28);O('car',62,1120,46,22,{col:0x3b3b3b,wreck:1,burn:1,rot:.3});
O('barrier',676,1100,10,28);O('barrier',676,1132,10,28);O('car',618,1128,46,22,{col:0x6a6257,wreck:1,rot:-.2});
const hydrant=O('hydrant',538,1090,6,6);
/* ---- row A (y 890-1088) ---- */
O('house',60,930,150,120,{col:0x9a8f7a,roof:0x3b302a,ridge:'y'});
const waltVan=O('van',226,972,26,56,{col:0xd8d5cc});
O('house',500,920,160,130,{col:0x6b5a4c,roof:0x241c18,ridge:'y',fire:1});
O('car',446,985,24,46,{col:0x7a2b25,style:'sedan'});
O('car',306,1010,24,46,{col:0x56624a,style:'sedan'});
O('car',350,948,46,22,{col:0x8f8f95,wreck:1,rot:.25});
/* ---- the pile-up that blocks the road, and the fences either side ---- */
const boxTruck=O('truck',290,856,95,28,{col:0xd9d2c0});
const bombCar=O('car',388,860,46,22,{col:0x8c3a1e,wreck:1,burn:1,bomb:1});
O('car',334,894,46,22,{col:0x35506b,wreck:1,rot:-.3});
O('fence',30,866,196,8);O('fence',262,866,26,8);       // gap 226-262 (broken planks)
O('fence',432,866,168,8);O('fence',636,866,54,8);      // gate 600-636
/* ---- row B (y 640-862) ---- */
O('house',50,690,150,120,{col:0x86907f,roof:0x33302c,ridge:'y'});
const shed=O('shed',214,790,38,34);
O('house',540,680,140,120,{col:0x94897c,roof:0x3a2e2a,ridge:'y'});
const nurseCar=O('car',470,822,46,22,{col:0x2d6a66,style:'sedan'});
const tramp=O('tramp',452,716,40,40);
O('bus',310,650,28,92,{col:0xe2a820});
O('car',394,735,24,46,{col:0x4a4f5a,style:'sedan'});
O('hedge',30,626,190,10);O('hedge',486,626,204,10);
/* ---- row C (y 400-622) ---- */
O('house',60,450,150,120,{col:0x7d8590,roof:0x2c3036,ridge:'y'});
O('house',500,450,150,120,{col:0x988b6f,roof:0x3b332a,ridge:'y'});
const cruiser=O('car',336,520,24,46,{col:0xe9e9e9,police:1,rot:.3});
const ambo=O('ambo',380,430,28,62,{col:0xf0f0ec});
O('car',306,410,24,46,{col:0x6b4a58,style:'sedan'});
O('fence',30,392,258,8);O('fence',432,392,258,8);
/* ---- Ruth's garage: a barricaded room half way up the street, a place to stop and breathe ---- */
const SAFE={x0:222,y0:518,x1:278,y1:566,dx:281,dy:542};
{const a=objs.length;O('wall',216,512,68,6);O('wall',216,566,68,6);O('wall',216,518,6,48);O('wall',278,518,6,14);O('wall',278,552,6,14);O('furn',224,520,30,9,{f:'counter'});for(let i=a;i<objs.length;i++)objs[i].home=2;}
const safeDoor=O('bdoor',278,532,6,20,{full:true,tall:true,home:2});
const inSafe=(x,y)=>x>SAFE.x0&&x<SAFE.x1&&y>SAFE.y0&&y<SAFE.y1;
/* ---- houses you can go into: the box is taken out of the map and replaced by four walls and a door ---- */
const ROOMS=[],RUGS=[];
/* A house you can go into. It is laid out from the front door: a front room (sofa, low table, kitchen counter and fridge along the inner wall)
   and a back room behind an inner wall with its own doorway (bed, drawers, shelves). a runs along the door wall, d is depth from the far wall. */
function enterable(H,side,loot){
  objs.splice(objs.indexOf(H),1);
  const n0=objs.length,x=H.x,y=H.y,w=H.w,h=H.h,t=6,g=26,cx=x+w/2,cy=y+h/2;let door;
  const sides={n:[x,y,w,t,1],s:[x,y+h-t,w,t,1],w:[x,y+t,t,h-2*t,0],e:[x+w-t,y+t,t,h-2*t,0]};
  for(const k in sides){const[X,Y,Wd,Ht,hz]=sides[k];if(k!==side){O('wall',X,Y,Wd,Ht);continue;}
    if(hz){O('wall',X,Y,Wd/2-g/2,t);O('wall',cx+g/2,Y,Wd/2-g/2,t);door=O('bdoor',cx-g/2,Y,g,t,{full:true,tall:true});}
    else{O('wall',X,Y,t,Ht/2-g/2);O('wall',X,cy+g/2,t,Ht/2-g/2);door=O('bdoor',X,cy-g/2,t,g,{full:true,tall:true});}}
  const out=side==='s'?{x:cx,y:y+h+15}:side==='w'?{x:x-15,y:cy}:{x:x+w+15,y:cy},inn=side==='s'?{x:cx,y:y+h-22}:side==='w'?{x:x+22,y:cy}:{x:x+w-22,y:cy};
  const A=side==='s'?w:h,D=side==='s'?h:w;
  const R=(a,d,la,ld)=>side==='s'?[x+a,y+d,la,ld]:side==='w'?[x+w-d-ld,y+a,ld,la]:[x+d,y+a,ld,la];
  const put=(kind,a,d,la,ld,ex)=>{const q=R(a,d,la,ld);return O(kind,q[0],q[1],q[2],q[3],ex);};
  put('wall',6,46,14,6);put('wall',46,46,A-52,6);                       // the inner wall, doorway from a=20 to 46
  put('furn',A-46,6,40,30,{f:'cot'});put('furn',26,6,24,10,{f:'chest'});put('furn',6,6,12,24,{f:'shelf',tall:true});      // back room
  put('fridge',A-22,52,16,14);put('furn',A-76,52,54,11,{f:'counter'});                                                       // kitchen side of the front room
  put('furn',A-20,72,14,40,{f:'sofa'});put('furn',A-52,78,16,20,{f:'table'});
  RUGS.push(R(A-58,72,34,34).concat(0x5a3d3a),R(36,20,34,22).concat(0x3d5066));
  for(let i=n0;i<objs.length;i++)objs[i].home=2;
  const lamp=[R(A/2-6,31,0,0),R(A/2,D-36,0,0)];
  ROOMS.push({H,side,loot,door,out,inn,lamp,x0:x+t,y0:y+t,x1:x+w-t,y1:y+h-t});
}
const inRoom=(R,x,y)=>x>R.x0&&x<R.x1&&y>R.y0&&y<R.y1;
enterable(objs.find(o=>o.kind==='house'&&o.x===60&&o.y===930),'s',['pan','aid']);
enterable(objs.find(o=>o.kind==='house'&&o.x===540&&o.y===680),'w',['hammer','ammo']);
enterable(objs.find(o=>o.kind==='house'&&o.x===500&&o.y===450),'w',['ciron','shells','aid']);
/* flares someone dropped on the way to the drain, and the signs the county put up: the way through, without anyone saying it */
const FLARES=[[360,1150],[352,1068],[300,962],[250,902],[244,846],[272,790],[356,706],[362,604],[300,548],[362,470],[362,400],[366,338],[366,272],[366,196]];
const SIGNS=[[396,1178,0],[268,908,-1],[396,612,0],[404,300,0]];
/* ---- street end, bank, channel, pipe ---- */
O('rail',250,334,95,6);O('rail',385,334,85,6);
O('car',314,276,24,46,{col:0x4b5d3f,wreck:1,rot:-.35});
O('cwall',30,262,300,6);O('cwall',400,262,290,6);       // steps down 330-400
O('headwall',30,108,300,12);O('headwall',390,108,300,12);
const grate=O('grate',330,108,60,6);
O('pwall',322,6,8,102);O('pwall',390,6,8,102);O('pwall',322,0,76,8);
O('bin',520,150,10,10);O('bin',180,228,12,10);
const VALVE={x:410,y:132};
const PIPE={x0:330,x1:390,yIn:70};
/* ---- map edges, lamps, bins, trees ---- */
O('fence',22,268,8,820);O('fence',690,268,8,820);
const LAMPS=[[294,1062,1],[426,930,0],[294,780,2],[426,640,1],[294,500,1],[426,376,2]];   // 1 = lit, 2 = flickering, 0 = dead
for(const[x,y]of LAMPS)O('pole',x-2,y-2,4,4);
for(const[x,y]of[[278,1056],[268,1056],[438,1010],[280,760],[440,600],[444,470]])O('bin',x,y,9,9);
const TREES=[[190,900],[250,700],[110,650],[240,438],[44,884],[470,900,1],[664,652],[470,648],[482,424],[676,884],[120,300],[560,302],[640,290],[62,312],[222,1192],[500,1196],[250,1078],[472,1078],[236,330]];
for(const[x,y]of TREES)O('tree',x-4,y-4,8,8);

/* ---- geometry helpers ---- */
function rectDist(x,y,o){const dx=Math.max(o.x-x,0,x-(o.x+o.w)),dy=Math.max(o.y-y,0,y-(o.y+o.h));return Math.hypot(dx,dy);}
function segHitsRect(x1,y1,x2,y2,o,pad){
  const rx=o.x-pad,ry=o.y-pad,rw=o.w+2*pad,rh=o.h+2*pad;
  let t0=0,t1=1;const dx=x2-x1,dy=y2-y1;
  const p0=-dx,p1=dx,p2=-dy,p3=dy,q0=x1-rx,q1=rx+rw-x1,q2=y1-ry,q3=ry+rh-y1;
  for(let i=0;i<4;i++){
    const p=i===0?p0:i===1?p1:i===2?p2:p3,q=i===0?q0:i===1?q1:i===2?q2:q3;
    if(p===0){if(q<0)return false;}
    else{const t=q/p;if(p<0){if(t>t1)return false;if(t>t0)t0=t;}else{if(t<t0)return false;if(t<t1)t1=t;}}
  }
  return true;
}
function los(ax,ay,bx,by){for(const o of objs){if(o.full&&segHitsRect(ax,ay,bx,by,o,0))return false;}return true;}
function clearLine(ax,ay,bx,by){for(const o of objs)if(segHitsRect(ax,ay,bx,by,o,6))return false;return true;}
/* spatial buckets so "is this spot free" stays cheap with many moving bodies */
const BS=48,BW=Math.ceil(W/BS),BH=Math.ceil(H/BS);let buckets=[];
const CS=10,GW=W/CS,GH=H/CS,blk=new Uint8Array(GW*GH);
function inBounds(x,y,pad){return!(x<30+pad||x>W-30-pad||y<8+pad||y>H-6-pad);}
function isFree(x,y,pad=7){
  if(!inBounds(x,y,0))return false;
  const b=buckets[((y/BS)|0)*BW+((x/BS)|0)];
  if(b)for(let i=0;i<b.length;i++)if(rectDist(x,y,b[i])<pad)return false;
  return true;
}
function rebuildIndex(){
  buckets=new Array(BW*BH);
  for(const o of objs){
    const x0=clamp(((o.x-16)/BS)|0,0,BW-1),x1=clamp(((o.x+o.w+16)/BS)|0,0,BW-1),y0=clamp(((o.y-16)/BS)|0,0,BH-1),y1=clamp(((o.y+o.h+16)/BS)|0,0,BH-1);
    for(let by=y0;by<=y1;by++)for(let bx=x0;bx<=x1;bx++)(buckets[by*BW+bx]||(buckets[by*BW+bx]=[])).push(o);
  }
  for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++)blk[gy*GW+gx]=isFree(gx*CS+5,gy*CS+5,7.5)?0:1;
}
rebuildIndex();
function removeObj(o){const i=objs.indexOf(o);if(i>=0){objs.splice(i,1);rebuildIndex();}}
function addObj(o){if(!objs.includes(o)){objs.push(o);rebuildIndex();}}
const inHouse=(x,y)=>x>HS.x0&&x<HS.x1&&y>HS.y0&&y<HS.y1;

/* ---- pathfinding ---- */
function nearestFreeCell(gx,gy){
  for(let r=0;r<8;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=gx+dx,y=gy+dy;if(x<0||y<0||x>=GW||y>=GH)continue;
    if(!blk[y*GW+x])return y*GW+x;
  }
  return -1;
}
function cellOf(x,y){const gx=clamp(Math.floor(x/CS),0,GW-1),gy=clamp(Math.floor(y/CS),0,GH-1);let i=gy*GW+gx;if(blk[i])i=nearestFreeCell(gx,gy);return i;}
const gS=new Float32Array(GW*GH),came=new Int32Array(GW*GH),seenSt=new Int32Array(GW*GH),closedSt=new Int32Array(GW*GH);let stampN=0;
function findPath(sx,sy,tx,ty){
  const s=cellOf(sx,sy),g=cellOf(tx,ty);if(s<0||g<0)return null;
  stampN++;const heap=[];
  const push=(f,i)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;const t=heap[p];heap[p]=heap[k];heap[k]=t;k=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;const t=heap[m];heap[m]=heap[k];heap[k]=t;k=m;}}return top;};
  const gx2=g%GW,gy2=(g/GW)|0;
  const h=i=>{const dx=Math.abs(i%GW-gx2),dy=Math.abs(((i/GW)|0)-gy2);return dx+dy-0.5858*Math.min(dx,dy);};
  seenSt[s]=stampN;gS[s]=0;came[s]=-1;push(h(s),s);
  let found=false,iter=0;
  while(heap.length){
    const i=pop()[1];
    if(closedSt[i]===stampN)continue;closedSt[i]=stampN;
    if(i===g){found=true;break;}
    if(++iter>5000)break;
    const x=i%GW,y=(i/GW)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
      const j=ny*GW+nx;if(blk[j]||closedSt[j]===stampN)continue;
      if(dx&&dy&&(blk[y*GW+nx]||blk[ny*GW+x]))continue;
      const ng=gS[i]+(dx&&dy?1.4142:1);
      if(seenSt[j]!==stampN||ng<gS[j]){seenSt[j]=stampN;gS[j]=ng;came[j]=i;push(ng+h(j),j);}
    }
  }
  if(!found)return null;
  const cells=[];for(let i=g;i!==-1;i=came[i])cells.push(i);cells.reverse();
  const pts=[{x:sx,y:sy}];
  for(let k=1;k<cells.length;k++){const i=cells[k];pts.push({x:(i%GW)*CS+5,y:((i/GW)|0)*CS+5});}
  const end=isFree(tx,ty,7)?{x:tx,y:ty}:pts[pts.length-1];
  if(pts.length>1)pts[pts.length-1]=end;else pts.push(end);
  const out=[];let a=0;
  while(a<pts.length-1){let b=pts.length-1;while(b>a+1&&!clearLine(pts[a].x,pts[a].y,pts[b].x,pts[b].y))b--;out.push(pts[b]);a=b;}
  return out;
}
/* flow field: walking distance from every cell to the leader. One flood fill serves every zombie and follower. */
const flow=new Uint16Array(GW*GH),flowQ=new Int32Array(GW*GH);
function buildFlow(x,y){
  flow.fill(65535);const s=cellOf(x,y);if(s<0)return;
  let qh=0,qt=0;flow[s]=0;flowQ[qt++]=s;
  while(qh<qt){
    const i=flowQ[qh++],d=flow[i]+1,cx=i%GW,cy=(i/GW)|0;
    if(cx>0){const j=i-1;if(!blk[j]&&flow[j]>d){flow[j]=d;flowQ[qt++]=j;}}
    if(cx<GW-1){const j=i+1;if(!blk[j]&&flow[j]>d){flow[j]=d;flowQ[qt++]=j;}}
    if(cy>0){const j=i-GW;if(!blk[j]&&flow[j]>d){flow[j]=d;flowQ[qt++]=j;}}
    if(cy<GH-1){const j=i+GW;if(!blk[j]&&flow[j]>d){flow[j]=d;flowQ[qt++]=j;}}
  }
}
/* next point to walk to when heading for the leader from (x,y) */
function flowStep(x,y,out){
  let i=cellOf(x,y);if(i<0||flow[i]===65535)return false;
  for(let k=0;k<3;k++){
    const cx=i%GW,cy=(i/GW)|0;let best=i,bd=flow[i];
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
      const j=ny*GW+nx;if(blk[j])continue;
      if(dx&&dy&&(blk[cy*GW+nx]||blk[ny*GW+cx]))continue;
      if(flow[j]<bd){bd=flow[j];best=j;}
    }
    if(best===i)break;i=best;
    if(k===0){out.x=(i%GW)*CS+5;out.y=((i/GW)|0)*CS+5;}
    else{const nx=(i%GW)*CS+5,ny=((i/GW)|0)*CS+5;if(clearLine(x,y,nx,ny)){out.x=nx;out.y=ny;}else break;}
  }
  return true;
}
function openSpot(x,y,taken,maxR){
  for(let r=0;r<=(maxR||70);r+=8){
    const n=Math.max(1,Math.round(r*0.8));
    for(let k=0;k<n;k++){
      const a=k/n*TAU,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
      if(!isFree(px,py,8))continue;
      if(taken&&taken.some(t=>hyp(t.x-px,t.y-py)<16))continue;
      return{x:px,y:py};
    }
  }
  return null;
}
/* move a circle, sliding along anything solid. You also round the corner of whatever you clip instead of stopping dead on it. */
function slide(u,dx,dy,r){
  const bx0=dx&&!isFree(u.x+dx,u.y,r),by0=dy&&!isFree(u.x,u.y+dy,r);
  if(dx&&!bx0)u.x+=dx;else if(dx)u.vx=0;
  if(dy&&!by0&&isFree(u.x,u.y+dy,r))u.y+=dy;else if(dy)u.vy=0;
  if(u.kind!=='you'||bx0===by0)return;
  const m=Math.abs(bx0?dx:dy)*.7;
  if(bx0&&Math.abs(dy)<Math.abs(dx)*.6){for(const q of[1,-1])if(isFree(u.x+dx,u.y+q*5,r)&&isFree(u.x,u.y+q*m,r)){u.y+=q*m;break;}}
  else if(by0&&Math.abs(dx)<Math.abs(dy)*.6){for(const q of[1,-1])if(isFree(u.x+q*5,u.y+dy,r)&&isFree(u.x+q*m,u.y,r)){u.x+=q*m;break;}}
}
/* anyone who ends up closer to something solid than they can walk (shoved, set down, stood up) is put on the nearest clear floor */
function unstick(u,r){
  if(isFree(u.x,u.y,r))return false;
  const side=inHouse(u.x,u.y);
  for(let d=2;d<=60;d+=2){const n=Math.max(6,Math.round(d*1.2));
    for(let k=0;k<n;k++){const a=k/n*TAU,px=u.x+Math.cos(a)*d,py=u.y+Math.sin(a)*d;if(isFree(px,py,r+.4)&&inHouse(px,py)===side){u.x=px;u.y=py;return true;}}}
  return false;
}
