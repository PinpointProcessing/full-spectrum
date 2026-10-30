"use strict";
/* A* on a 10-unit grid with string-pulling, and the cover points generated around object edges. */
const CS=10,GW=W/CS,GH=H/CS,blk=new Uint8Array(GW*GH);
for(let gy=0;gy<GH;gy++)for(let gx=0;gx<GW;gx++)blk[gy*GW+gx]=isFree(gx*CS+5,gy*CS+5)?0:1;
function nearestFreeCell(gx,gy){
  for(let r=0;r<7;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){
    if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;
    const x=gx+dx,y=gy+dy;if(x<0||y<0||x>=GW||y>=GH)continue;
    if(!blk[y*GW+x])return y*GW+x;
  }
  return -1;
}
function cellOf(x,y){const gx=clamp(Math.floor(x/CS),0,GW-1),gy=clamp(Math.floor(y/CS),0,GH-1);let i=gy*GW+gx;if(blk[i])i=nearestFreeCell(gx,gy);return i;}
function clearLine(ax,ay,bx,by){for(const o of objs)if(segHitsRect(ax,ay,bx,by,o,6.5))return false;return true;}
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
    if(++iter>6000)break;
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

/* ---------- cover points ---------- */
const coverPts=[];
(function(){
  const add=(x,y,o)=>{if(!isFree(x,y,8))return;if(coverPts.some(p=>hyp(p.x-x,p.y-y)<9))return;coverPts.push({x,y,o});};
  for(const o of objs){
    if(o.kind==='fence')continue;
    const off=11,step=14,nx=Math.max(1,Math.round(o.w/step)),ny=Math.max(1,Math.round(o.h/step));
    for(let i=0;i<nx;i++){const x=o.x+(i+.5)*o.w/nx;add(x,o.y-off,o);add(x,o.y+o.h+off,o);}
    for(let i=0;i<ny;i++){const y=o.y+(i+.5)*o.h/ny;add(o.x-off,y,o);add(o.x+o.w+off,y,o);}
  }
})();
