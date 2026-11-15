const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
(async()=>{const port=9921,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:420,height:860});
const ev=(f,a)=>page.evaluate(f,a);const log=async(l,f)=>console.log(l+':',await ev(f));
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');window.requestAnimationFrame=()=>0;Math.random=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(11);});
await page.click('#ddBtn');await page.waitForTimeout(800);
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);});
const hist=()=>ev(()=>{const n=dd.npcs.filter(u=>!u.dead&&!u.inBoat),h={beach:0,bunkers:0,draw:0,top:0};for(const u of n){if(u.y>344)h.beach++;else if(u.y>200)h.bunkers++;else if(u.y>-430)h.draw++;else h.top++;}return `front ${Math.round(dd.front)} line ${Math.round(ddLine())} npcs ${n.length} ${JSON.stringify(h)} moving ${n.filter(u=>u.path.length).length}`;});
console.log('ashore',await hist());
// walk both squads up the route step by step, like a player would, enemies left alive
const steps=[[505,336],[545,240],[570,120],[520,0],[420,-110],[320,-230],[230,-340]];
for(const [x,y] of steps){await page.evaluate(([x,y])=>{for(const t of['A','B']){const m=players.filter(p=>p.team===t&&alive(p));const as=makeAssign(m,x+DDX+(t==='B'?40:-20),y);for(const a of as)Object.assign(a.u,{path:a.path,lastOrder:simT});}RUN(14);},[x,y]);console.log(`squads to ${x},${y}:`,await hist());}
await ev(()=>RUN(30));console.log('30s later',await hist());
await ev(()=>RUN(30));console.log('60s later',await hist());
for(let k=0;k<3;k++){await ev(()=>RUN(30));console.log('+30s',await hist(),await ev(()=>dd.npcs.filter(u=>!u.dead&&!u.inBoat&&u.y<200).map(u=>Math.round(u.x-DDX)+','+Math.round(u.y)+(u.path.length?'*':'')+(u.sup>.8?'p':'')).join(' ')));}
console.log('bar has Control',await page.evaluate(()=>{select(players.filter(p=>p.team===dd.active&&alive(p)));ddBar();return !!document.querySelector('.sq-fp');}));
console.log('errors',errors.length,errors.slice(0,5));await b.close();srv.close();})();
