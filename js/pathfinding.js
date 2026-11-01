"use strict";
/* A* on a 10-unit grid with string-pulling, and the cover points generated around object edges. The squad can also vault
   through windows (Bryan) when that's the quickest or safest way, and its routes keep out of known enemies' sight when a
   hidden way isn't much longer. */
// cell (gx,gy) covers x gx*CS.., y TOP+gy*CS.. (the map starts at y TOP, north of the yard)
const CS=10,GW=W/CS,GH=(H-TOP)/CS,blk=new Uint8Array(GW*GH);
const cx0=gx=>gx*CS+5,cy0=gy=>TOP+gy*CS+5;   // a cell's centre
for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++)blk[gy*GW+gx]=isFree(cx0(gx),cy0(gy))?0:1;
// Foot soldiers use blk. Vehicles use vblk (built on demand, see buildVehGrid): free only where something jeep-sized fits.
const vblk=new Uint8Array(GW*GH);
// FOOT: plain walking (the enemy). SQUAD: the squad's moves (windows, and the safest way when it isn't much longer).
// TRAIL: a drawn route's gaps (windows, but no detours: it follows your line).
const FOOT={blk,pad:6.5,end:7},VEH={blk:vblk,pad:15,end:16},SQUAD={blk,pad:6.5,end:7,vault:true,safe:true},TRAIL={blk,pad:6.5,end:7,vault:true};
function buildVehGrid(){for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++)vblk[gy*GW+gx]=isFree(cx0(gx),cy0(gy),VEH.end)?0:1;}
function nearestFreeCell(gx,gy,b=blk){
  for(let r=0;r<7;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=gx+dx,y=gy+dy;if(x<0||y<0||x>=GW||y>=GH)continue;
    if(!b[y*GW+x])return y*GW+x;
  }
  return -1;
}
function cellOf(x,y,b=blk){const gx=clamp(Math.floor(x/CS),0,GW-1),gy=clamp(Math.floor((y-TOP)/CS),0,GH-1);let i=gy*GW+gx;if(b[i])i=nearestFreeCell(gx,gy,b);return i;}
function clearLine(ax,ay,bx,by,pad=6.5){for(const o of objs)if(segHitsRect(ax,ay,bx,by,o,pad))return false;return true;}
const gS=new Float32Array(GW*GH),came=new Int32Array(GW*GH),cameW=new Int16Array(GW*GH),seenSt=new Int32Array(GW*GH),closedSt=new Int32Array(GW*GH);let stampN=0;

/* ---------- windows, sandbags and barriers: the squad vaults over them ---------- */
// Each one gets vault links: pairs of free cells straight across it (where a body fits over it and nothing else is in the
// way), which A* treats as a step costing the distance plus VAULT_EXTRA (the climb is slow: VAULT_SPEED within VAULT_HALF
// of its middle line, a hop of VAULT_H over the sill or the bags). Waypoints after a vault carry .vault (an entry of WINDOWS,
// which despite the name holds every vaultable object).
const VAULT_EXTRA=4.5,VAULT_HALF=13,VAULT_SPEED=20,VAULT_H=10,VAULTABLE=new Set(['window','sandbag','barrier']);
const WINDOWS=[],vaultLinks=new Map();   // cell -> [{j,len,w,mid}]
function buildVaultLinks(){
  WINDOWS.length=0;vaultLinks.clear();
  for(const o of objs){
    if(!VAULTABLE.has(o.kind))continue;
    const vert=o.h>o.w,w={o,vert,c:vert?o.x+o.w/2:o.y+o.h/2,id:WINDOWS.length};WINDOWS.push(w);   // vert: runs north-south, crossed east-west
    const a0=(vert?o.y:o.x)+6,a1=(vert?o.y+o.h:o.x+o.w)-6,mid=Math.floor((vert?w.c:w.c-TOP)/CS);   // the row or column of cells the window sits in
    for(let g=0;g<(vert?GH:GW);g++){
      const a=vert?cy0(g):cx0(g);if(a<a0||a>a1)continue;
      const at=k=>vert?g*GW+k:k*GW+g,free=k=>k>=0&&k<(vert?GW:GH)&&!blk[at(k)];
      let lo=-1,hi=-1;for(let k=mid-1;k>=mid-3;k--)if(free(k)){lo=k;break;}for(let k=mid+1;k<=mid+3;k++)if(free(k)){hi=k;break;}
      if(lo<0||hi<0)continue;
      const p=vert?[cx0(lo),a,cx0(hi),a]:[a,cy0(lo),a,cy0(hi)];
      if(!throughOpening({x:p[0],y:p[1]},{x:p[2],y:p[3]},w))continue;   // a wall end or a crate in the way
      const i=at(lo),j=at(hi),len=hi-lo;
      for(const[x,y]of[[i,j],[j,i]]){if(!vaultLinks.has(x))vaultLinks.set(x,[]);vaultLinks.get(x).push({j:y,len,w,mid:at(mid)});}
    }
  }
}
// does the straight line a-b cross w (a window's opening, a run of sandbags) clear of its ends, with nothing else in the way?
function throughOpening(a,b,w){
  const o=w.o,da=w.vert?b.x-a.x:b.y-a.y;if(!da)return false;
  const t=(w.c-(w.vert?a.x:a.y))/da;if(t<0||t>1)return false;
  const at=w.vert?a.y+(b.y-a.y)*t:a.x+(b.x-a.x)*t,lo=(w.vert?o.y:o.x)+6,hi=(w.vert?o.y+o.h:o.x+o.w)-6;
  return at>=lo&&at<=hi&&!objs.some(q=>q!==o&&segHitsRect(a.x,a.y,b.x,b.y,q,4));
}
buildVaultLinks();

/* ---------- keeping out of sight ---------- */
// A cell in sight of a known enemy (one the squad has seen, where it was last seen; within rifle range) costs more to walk
// through, up to x(1+SAFE_W*3). Sight here is a quick check on a grid of the sight-blocking objects (sightBlk), cached
// until the known enemies move. The safe route is only taken if it's at most SAFE_DETOUR longer than the quickest.
const SAFE_W=1,SAFE_R=380,SAFE_DETOUR=[1.5,40];
const sightBlk=new Uint8Array(GW*GH),dVal=new Float32Array(GW*GH),dSt=new Int32Array(GW*GH);let dEpoch=0,dKey='',dThreats=[];
for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++){const x=cx0(gx),y=cy0(gy);sightBlk[gy*GW+gx]=objs.some(o=>o.full&&(o.disk?rectDist(x,y,o)<=0:inRect(x,y,o)))?1:0;}
function gridSight(ax,ay,bx,by){   // can a soldier at a see b? (ignoring what's right next to a: a sentry in his pillbox sees out)
  const d=hyp(bx-ax,by-ay),n=Math.ceil(d/7);
  for(let k=1;k<n;k++){
    const t=k/n;if(t*d<14)continue;
    const x=ax+(bx-ax)*t,y=ay+(by-ay)*t,gx=Math.floor(x/CS),gy=Math.floor((y-TOP)/CS);
    if(gx>=0&&gy>=0&&gx<GW&&gy<GH&&sightBlk[gy*GW+gx])return false;
  }
  return true;
}
function routeThreats(){   // the enemies the squad knows about, where it last saw them
  const t=[];
  for(const e of enemies)if(!e.dead&&e.seen&&(e.vis||e.last)){const p=e.vis?e:e.last;t.push({x:p.x,y:p.y,w:e.gunner?1.5:1});}
  const key=t.map(q=>Math.round(q.x/10)+','+Math.round(q.y/10)).join(';');   // re-work the costs once they've moved a metre
  if(key!==dKey){dKey=key;dEpoch++;dThreats=t;}
  return t;
}
function dangerAt(i){
  if(dSt[i]===dEpoch)return dVal[i];
  const x=cx0(i%GW),y=cy0((i/GW)|0);let d=0;
  for(const t of dThreats){const r=hyp(t.x-x,t.y-y);if(r<=SAFE_R&&gridSight(t.x,t.y,x,y))d+=t.w;}
  dSt[i]=dEpoch;return dVal[i]=Math.min(3,d);
}

// A* from cell s to g; vault links only if links, sight costs only if safe. Returns the cells (and the window used to reach each).
function astar(s,g,b,links,safe){
  stampN++;const heap=[];
  const push=(f,i)=>{heap.push([f,i]);let k=heap.length-1;while(k>0){const p=(k-1)>>1;if(heap[p][0]<=heap[k][0])break;const t=heap[p];heap[p]=heap[k];heap[k]=t;k=p;}};
  const pop=()=>{const top=heap[0],last=heap.pop();if(heap.length){heap[0]=last;let k=0;for(;;){const l=2*k+1,r=l+1;let m=k;if(l<heap.length&&heap[l][0]<heap[m][0])m=l;if(r<heap.length&&heap[r][0]<heap[m][0])m=r;if(m===k)break;const t=heap[m];heap[m]=heap[k];heap[k]=t;k=m;}}return top;};
  const gx2=g%GW,gy2=(g/GW)|0;
  const h=i=>{const dx=Math.abs(i%GW-gx2),dy=Math.abs(((i/GW)|0)-gy2);return dx+dy-0.5858*Math.min(dx,dy);};
  const step=(i,j,ng,w)=>{if(seenSt[j]!==stampN||ng<gS[j]){seenSt[j]=stampN;gS[j]=ng;came[j]=i;cameW[j]=w;push(ng+h(j),j);}};
  seenSt[s]=stampN;gS[s]=0;came[s]=-1;cameW[s]=-1;push(h(s),s);
  let found=false,iter=0;
  while(heap.length){
    const i=pop()[1];
    if(closedSt[i]===stampN)continue;closedSt[i]=stampN;
    if(i===g){found=true;break;}
    if(++iter>40000)break;   // the map is 100 x 166 cells
    const x=i%GW,y=(i/GW)|0;
    for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){
      if(!dx&&!dy)continue;const nx=x+dx,ny=y+dy;
      if(nx<0||ny<0||nx>=GW||ny>=GH)continue;
      const j=ny*GW+nx;if(b[j]||closedSt[j]===stampN)continue;
      if(dx&&dy&&(b[y*GW+nx]||b[ny*GW+x]))continue;
      step(i,j,gS[i]+(dx&&dy?1.4142:1)*(safe?1+SAFE_W*dangerAt(j):1),-1);
    }
    const L=links&&vaultLinks.get(i);
    if(L)for(const l of L)if(!b[l.j]&&closedSt[l.j]!==stampN)step(i,l.j,gS[i]+l.len*(safe?1+SAFE_W*dangerAt(l.j):1)+VAULT_EXTRA*(safe?1+SAFE_W*dangerAt(l.mid):1),l.w.id);
  }
  if(!found)return null;
  const cells=[];for(let i=g;i!==-1;i=came[i])cells.push({i,w:cameW[i]});cells.reverse();
  return cells;
}
function findPath(sx,sy,tx,ty,nav=SQUAD){
  const b=nav.blk,s=cellOf(sx,sy,b),g=cellOf(tx,ty,b);if(s<0||g<0)return null;
  const quick=buildPath(astar(s,g,b,!!nav.vault,false),sx,sy,tx,ty,nav,false);
  if(!quick||!nav.safe||!routeThreats().length)return quick;
  const safe=buildPath(astar(s,g,b,true,true),sx,sy,tx,ty,nav,true);
  return safe&&pathTime(safe,sx,sy)<=pathTime(quick,sx,sy)*SAFE_DETOUR[0]+SAFE_DETOUR[1]?safe:quick;
}
// how long a route takes, in units walked: its length plus the time the vaults cost
function pathTime(p,sx,sy){let t=0,a={x:sx,y:sy};for(const q of p){t+=hyp(q.x-a.x,q.y-a.y)+(q.vault?VAULT_EXTRA*CS:0);a=q;}return t;}
// the most exposed cell along a straight line (for string-pulling a safe route: a shortcut mustn't step into more sight)
function lineDanger(ax,ay,bx,by){const n=Math.max(1,Math.ceil(hyp(bx-ax,by-ay)/CS));let m=0;for(let k=0;k<=n;k++){const t=k/n;m=Math.max(m,dangerAt(cellOf(ax+(bx-ax)*t,ay+(by-ay)*t)));}return m;}
// cells to waypoints, then string-pulled; a vault keeps its two ends (the line across a window never counts as clear)
function buildPath(cells,sx,sy,tx,ty,nav,safe){
  if(!cells)return null;
  const pts=[{x:sx,y:sy}];
  for(let k=1;k<cells.length;k++){
    const c=cells[k],w=c.w>=0?WINDOWS[c.w]:null;
    const p={x:cx0(c.i%GW),y:cy0((c.i/GW)|0)};if(w)p.vault=w;
    if(w&&k===1&&!throughOpening(pts[0],p,w))pts.push({x:cx0(cells[0].i%GW),y:cy0((cells[0].i/GW)|0)});   // vaulting from the very first cell: line up with the window first
    pts.push(p);
  }
  const e=isFree(tx,ty,nav.end)?{x:tx,y:ty}:null,last=pts[pts.length-1];
  if(pts.length===1)pts.push(e||{x:last.x,y:last.y});
  else if(e){
    if(!last.vault)pts[pts.length-1]=e;
    else{   // ending just past a window: land there rather than overshoot and step back, if the line still goes through the opening
      const w=last.vault,side=v=>Math.sign((w.vert?v.x:v.y)-w.c);
      if(side(e)===side(last)&&throughOpening(pts[pts.length-2],e,w)){e.vault=w;pts[pts.length-1]=e;}else pts.push(e);
    }
  }
  const dz=safe?pts.map(p=>dangerAt(cellOf(p.x,p.y))):null;
  const out=[];let a=0;
  while(a<pts.length-1){
    let bb=pts.length-1;
    const ok=bb=>{
      if(!clearLine(pts[a].x,pts[a].y,pts[bb].x,pts[bb].y,nav.pad))return false;
      for(let k=a+1;k<=bb;k++)if(pts[k].vault)return false;   // never cut a vault short
      if(!safe)return true;
      let m=0;for(let k=a;k<=bb;k++)m=Math.max(m,dz[k]);return lineDanger(pts[a].x,pts[a].y,pts[bb].x,pts[bb].y)<=m;
    };
    while(bb>a+1&&!ok(bb))bb--;
    out.push(pts[bb]);a=bb;
  }
  return out;
}

/* ---------- cover points ---------- */
const coverPts=[];
function addCoverPts(o){
  const add=(x,y)=>{if(!isFree(x,y,8))return;if(coverPts.some(p=>hyp(p.x-x,p.y-y)<6))return;coverPts.push({x,y,o});};
  const off=11,step=14,nx=Math.max(1,Math.round(o.w/step)),ny=Math.max(1,Math.round(o.h/step));
  for(let i=0;i<nx;i++){const x=o.x+(i+.5)*o.w/nx;add(x,o.y-off);add(x,o.y+o.h+off);}
  for(let i=0;i<ny;i++){const y=o.y+(i+.5)*o.h/ny;add(o.x-off,y);add(o.x+o.w+off,y);}
}
for(const o of objs)if(o.kind!=='fence'&&o.kind!=='water'&&o.kind!=='pit'&&o.kind!=='fortwall')addCoverPts(o);

/* ---------- objects placed mid-battle (the parked jeep) ---------- */
function regrid(o){   // re-mark the nav cells around o
  const g0=Math.max(0,Math.floor((o.x-12)/CS)),g1=Math.min(GW-1,Math.floor((o.x+o.w+12)/CS));
  const h0=Math.max(0,Math.floor((o.y-12-TOP)/CS)),h1=Math.min(GH-1,Math.floor((o.y+o.h+12-TOP)/CS));
  for(let gy=h0;gy<=h1;gy++)for(let gx=g0;gx<=g1;gx++)blk[gy*GW+gx]=isFree(cx0(gx),cy0(gy))?0:1;
}
// returns the cover points it displaced, to hand back to removeObstacle
function addObstacle(o){
  objs.push(o);
  const gone=coverPts.filter(p=>rectDist(p.x,p.y,o)<8);for(const p of gone)coverPts.splice(coverPts.indexOf(p),1);
  regrid(o);addCoverPts(o);return gone;
}
function removeObstacle(o,gone){
  objs.splice(objs.indexOf(o),1);
  for(let i=coverPts.length-1;i>=0;i--)if(coverPts[i].o===o)coverPts.splice(i,1);
  coverPts.push(...gone);regrid(o);
}
