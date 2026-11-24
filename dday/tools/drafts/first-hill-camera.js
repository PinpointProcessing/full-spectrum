// Version 185 (Bryan: "Camera still turns into the second hill before I even reach the top of the first"): the squad walked up from the end
// of the beach to the top as a player would (moves 15 m up the way every 6 s, the bunkers at the end of the beach taken first so the objective is
// the way up), a picture each time the man the camera follows gets another 6 m up (the hills labelled) and the camera logged every second.
// node first-hill-camera.js PORT OUTDIR [W H]; DDROOT=<an older copy's dday folder> for the version before. first-hill-camera.py makes the sheet
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const PO=+process.argv[2]||0,OUT=process.argv[3]||'.',W=+process.argv[4]||390,H=+process.argv[5]||760;
(async()=>{const port=9840+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(7919);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){for(const u of players)u.sup=0;update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.MOVE=(t,x,y)=>{const as=makeAssign(SQ(t),x,y);if(as.length)commit(as);return as.length;};
  window.LAB=()=>{const L=[['FIRST HILL (9 m)',1000,40],['SECOND HILL (18 m)',900,-300],['LEFT HILL',420,-20],['HILL BUNKER',1080,186],['THE DRAW',690,-60],['THE TOP',560,-560]];
    for(const[t,x,y]of L){toSBack=false;const[a,c]=toS(x,y,8);if(toSBack)continue;ox.font='bold 14px sans-serif';const w=ox.measureText(t).width;ox.fillStyle='rgba(0,0,0,.72)';ox.fillRect(a-w/2-4,c-14,w+8,19);ox.fillStyle='#ffe14a';ox.fillText(t,a-w/2,c);}};});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);dd.ctr={on:true,sq:4,t:1e12};
  for(const e of enemies)if((e.tag==='left'||e.tag==='pill')&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.held=dd.held||{};dd.held.left=true;dd.held.pill=true;
  const R=DD_ROUTE;PUT('A',R[3][0]+DDX,R[3][1]);PUT('B',R[3][0]+DDX+110,R[3][1]+20);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(3);
  const RR=DD_ROUTE.map(([x,y])=>({x:x+DDX,y})),cum=[0];for(let i=1;i<RR.length;i++)cum.push(cum[i-1]+hyp(RR[i].x-RR[i-1].x,RR[i].y-RR[i-1].y));
  window.AT=s=>{let i=1;while(i<RR.length-1&&cum[i]<s)i++;const a=RR[i-1],c=RR[i],t=(s-cum[i-1])/(cum[i]-cum[i-1]||1);return{x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t};};
  window.PROG=(x,y)=>{let best=1e9,s=0;for(let i=1;i<RR.length;i++){const a=RR[i-1],c=RR[i],L=cum[i]-cum[i-1],t=clamp(((x-a.x)*(c.x-a.x)+(y-a.y)*(c.y-a.y))/(L*L),0,1),d=hyp(x-a.x-(c.x-a.x)*t,y-a.y-(c.y-a.y)*t);if(d<best){best=d;s=cum[i-1]+t*L;}}return s;};
  window.LEN=cum[cum.length-1];window.BOT={next:0};});
const deg=a=>Math.round(a*180/Math.PI);let shots=[300,240,180,120,60,0,-60,-120,-180,-240,-300,-360,-420];
for(let k=0;k<200;k++){
  const r=await ev(()=>{const A=SQ('A');if(simT>=BOT.next&&!A.some(u=>u.path.length)){const M={x:A.reduce((a,u)=>a+u.x,0)/A.length,y:A.reduce((a,u)=>a+u.y,0)/A.length},s=PROG(M.x,M.y),q=AT(Math.min(LEN,s+150));MOVE('A',q.x,q.y);BOT.next=simT+6;}
    RUN(1);const u=ddTrackAt(),w=ddRouteWay(u.x,u.y),O=ddObjective();return{t:Math.round(simT),lead:[Math.round(u.x),Math.round(u.y)],h:Math.round(groundH(u.x,u.y)),yaw,way:w?Math.atan2(-w.x,-w.y):null,obj:O&&O.t,go:dd.cam.go?{off:Math.round(ddRouteOff(dd.cam.go.x,dd.cam.go.y)),done:!!dd.cam.go.done}:null};});
  console.log(JSON.stringify({...r,yaw:deg(r.yaw),way:r.way==null?null:deg(r.way)}));
  if(shots.length&&r.lead[1]<=shots[0]){const tag=shots.shift();await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(300);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);LAB();});await page.screenshot({path:`${OUT}/up-${tag}.png`});console.log('shot',tag);}
  if(r.lead[1]<-460)break;
}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
