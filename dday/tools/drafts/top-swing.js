// Version 186 (Bryan, after Version 185: "At the top of the first hill the camera should swing left"): the squad sent up the ramp, then to the
// top of it, then on up, the bunkers at the end of the beach taken; a picture at each, the hills labelled, and the camera's heading logged.
// node top-swing.js PORT OUTDIR [W H]; DDROOT=<an older copy's dday folder> for the version before. top-swing.py makes the sheet
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const PO=+process.argv[2]||0,OUT=process.argv[3]||'.',W=+process.argv[4]||390,H=+process.argv[5]||760;
(async()=>{const port=9870+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(7919);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){for(const u of players)u.sup=0;update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);dashToCover=()=>false;ddDodge=()=>{};
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>{Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null});});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.MOVE=(t,x,y)=>{const as=makeAssign(SQ(t),x,y);if(as.length)commit(as);return as.length;};
  window.WALK=(max)=>{let n=0;while(SQ('A').some(u=>u.path.length)&&n++<max)RUN(.5);RUN(1.5);};
  window.LAB=()=>{const L=[['FIRST HILL (9 m)',1000,40],['SECOND HILL (18 m)',900,-300],['THE DRAW',690,-60],['TOP OF THE RAMP',790,80]];
    for(const[t,x,y]of L){toSBack=false;const[a,c]=toS(x,y,8);if(toSBack)continue;ox.font='bold 14px sans-serif';const w=ox.measureText(t).width;ox.fillStyle='rgba(0,0,0,.72)';ox.fillRect(a-w/2-4,c-14,w+8,19);ox.fillStyle='#ffe14a';ox.fillText(t,a-w/2,c);}};});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);dd.ctr={on:true,sq:4,t:1e12};
  for(const e of enemies)if((e.tag==='left'||e.tag==='pill')&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.held=dd.held||{};dd.held.left=true;dd.held.pill=true;
  PUT('A',745,300);PUT('B',860,320);selectTeam('A');dd.active='A';ddGoSquad('A');RUN(4);});
const deg=a=>Math.round(a*180/Math.PI);
const shot=async(name)=>{const r=await ev(()=>{const u=ddTrackAt();return{lead:[Math.round(u.x),Math.round(u.y)],h:Math.round(groundH(u.x,u.y)),yaw};});
  await ev(()=>{render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(300);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);LAB();});
  await page.screenshot({path:`${OUT}/${name}.png`});console.log(name,JSON.stringify({...r,yaw:deg(r.yaw)}));};
await ev(()=>{MOVE('A',765,190);RUN(3);});await shot('ramp');
await ev(()=>{MOVE('A',790,90);WALK(60);RUN(3);});await shot('top');
await ev(()=>{MOVE('A',735,-30);WALK(60);RUN(3);});await shot('on');
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
