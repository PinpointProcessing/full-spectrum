// Chapter 2's opening, the dash through the command post (Version 249): looks for eight paths through the room and its door that never bring two
// men nearer than MIN. Built from the door backwards: who crosses the doorway when and on which side, then each man's speed gives where he starts;
// lanes by trial. Prints the best table found, rows [x0,z0,v,xd,xo,wa,wf,wp,sb,sf,sp], for ddcseq.js's DCS.hut (dcHutAt is the same sum as at() here).
// node hut-scramble-search.js [secs=2.0] [MIN=8.6] [tries=200000] [seed]   (DCS.hut came from: 2.0 8.8 500000 11)
const FRONT=-31,DUR=+process.argv[2]||2.0,N=8,MIN=+process.argv[3]||8.6,TRIES=+process.argv[4]||200000;
let seed=+process.argv[5]||12345;const R=()=>(seed=(seed*16807)%2147483647)/2147483647;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),sm=u=>u*u*(3-2*u),r1=n=>Math.round(n*10)/10;
function at(r,ht){const[x0,z0,v,xd,xo,wa,wf,wp,sb,sf,sp]=r,s=v*ht+sb*(Math.sin(sf*ht+sp)-Math.sin(sp)),z=z0-s,k=sm(clamp((z-FRONT-4)/40,0,1)),o=sm(clamp((FRONT-18-z)/60,0,1));
  return[z>=FRONT?xd+(x0-xd)*k+wa*Math.sin(wf*ht+wp)*k:xd+(xo-xd)*o,z];}
function mk(){
  let t=.5+R()*.14,side=R()<.5?-1:1;const T=[];
  for(let i=0;i<N;i++){
    const v=Math.round(56+R()*25),xd=r1(side<0?-2.7+(R()-.5)*1.0:4.6+(R()-.5)*1.0),sb=r1(R()*1.3),sf=r1(3+R()*3),sp=r1(R()*6.28);
    const z0=r1(FRONT+v*t+sb*(Math.sin(sf*t+sp)-Math.sin(sp)));
    const xo=Math.round(side*(9+R()*27));
    T.push([0,z0,v,xd,xo,r1(.5+R()*1.5),r1(3+R()*4),r1(R()*6.28),sb,sf,sp]);
    t+=.075+R()*.11;side=-side;if(R()<.18)side=-side;   // (now and then two in a row on one side)
  }
  // lanes: far from the door each has his own
  for(let i=0;i<N;i++){let ok=false;for(let k=0;k<60&&!ok;k++){const z=T[i][1],x=r1((R()*2-1)*(z>40?9.5:13));T[i][0]=x;ok=true;for(let j=0;j<i;j++)if(Math.hypot(T[j][0]-x,T[j][1]-z)<9.6){ok=false;break;}}if(!ok)return null;}
  return T;
}
const RJ={lay:0,time:0,min:0,far:0,start:0,mn:0};
function score(T){
  const td=T.map(r=>{for(let t=0;t<=DUR+2;t+=.005)if(at(r,t)[1]<FRONT)return t;return 99;});
  const first=Math.min(...td),last=Math.max(...td);if(first<.45||last>DUR-.4){RJ.time++;return null;}
  const z0s=T.map(r=>r[1]);if(Math.max(...z0s)>60||Math.min(...z0s)<-2){RJ.start++;return null;}
  let mn=1e9;
  for(let t=0;t<=DUR;t+=.02){const p=T.map(r=>at(r,t));for(let i=0;i<N;i++)for(let j=i+1;j<N;j++){const d=Math.hypot(p[i][0]-p[j][0],p[i][1]-p[j][1]),far=p[i][1]<FRONT-75&&p[j][1]<FRONT-75;if(!far&&d<mn)mn=d;if(far&&d<5){RJ.far++;return null;}}}
  if(mn<MIN){RJ.min++;RJ.mn=Math.max(RJ.mn,mn);return null;}
  // order changes on the way: who starts ahead of whom against who's through the door first
  let swaps=0;for(let i=0;i<N;i++)for(let j=i+1;j<N;j++)if((T[i][1]-T[j][1])*(td[i]-td[j])<0)swaps++;
  const vs=T.map(r=>r[2]),spread=Math.max(...vs)-Math.min(...vs),xs=T.map(r=>r[0]),xspread=Math.max(...xs)-Math.min(...xs);
  const s=td.slice().sort((a,b)=>a-b),gaps=s.slice(1).map((v,i)=>v-s[i]);
  return{sc:swaps*3+spread*.12+xspread*.25+(60-Math.max(...z0s))*.05,swaps,mn:+mn.toFixed(2),first:+first.toFixed(2),last:+last.toFixed(2),spread,xspread:+xspread.toFixed(1),zmax:Math.max(...z0s),gaps:gaps.map(g=>+g.toFixed(2))};
}
let best=null,found=0;
for(let k=0;k<TRIES;k++){const T=mk();if(!T){RJ.lay++;continue;}const s=score(T);if(s){found++;if(!best||s.sc>best.s.sc)best={T,s};}}
console.log(JSON.stringify(RJ),'found',found);if(!best){console.log('none');process.exit(1);}
console.log(JSON.stringify(best.s));console.log(JSON.stringify(best.T));
