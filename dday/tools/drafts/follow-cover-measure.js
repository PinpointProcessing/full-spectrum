// Version 192: when Alpha moves, where do Bravo's men end up? node cov.js ROOT PORT
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
(async()=>{const srv=await serve(process.argv[2],+process.argv[3]);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${process.argv[3]}/index.html?gfx=0`);const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);}};const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);});
await page.click('#ddBtn');await page.waitForTimeout(400);
const r=await ev(()=>{let n=0;while(!dd.land.done&&n++<300)RUN(.25);RUN(2);selectTeam('A');dd.active='A';
  let tot=0,cov=0,cp=0;const R=DD_ROUTE;
  for(let k=1;k<9;k++){const A=players.filter(p=>p.team==='A'&&alive(p)),w=R[Math.min(k,R.length-1)],tx=w[0]+DDX,ty=w[1];
    const as=makeAssign(A,tx,ty);if(!as.length)continue;commit(as);RUN(9);
    const th=threats();for(const u of players.filter(p=>p.team==='B'&&alive(p))){const d=destOf(u);tot++;if(isCovered(d,th))cov++;if(coverPts.some(c=>hyp(c.x-d.x,c.y-d.y)<4))cp++;}}
  return{tot,cov,cp};});
console.log(JSON.stringify(r),'errors',errors.length);await b.close();srv.close();process.exit(0);})();
