// Draw calls, triangles and rough frame cost per chapter, for comparing graphics changes (software WebGL: the ms are only relative).
// node perf-probe.js PORT [GFX]   DDROOT=<a copy's dday folder>. Prints one JSON line per scene.
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const PO=+process.argv[2]||0,GFX=process.argv[3]!=null?+process.argv[3]:1;
(async()=>{const port=9790+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=${GFX}`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(77);window.requestAnimationFrame=()=>0;
  window.CLK=0;const pn=performance.now.bind(performance);performance.now=()=>pn()+CLK*1000;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);CLK+=1/30;}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.PROBE=name=>{renderer.info.autoReset=false;const r=[];for(let k=0;k<6;k++){renderer.info.reset();const t0=pn();update(1/30);ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);const t1=pn();CLK+=1/30;r.push({ms:t1-t0,calls:renderer.info.render.calls,tris:renderer.info.render.triangles,pts:renderer.info.render.points});}
    renderer.info.autoReset=true;const m=a=>a.reduce((x,y)=>x+y,0)/a.length;let meshes=0,inst=0;(DD&&DD.scene||scene).traverse(o=>{if(o.isMesh)meshes++;if(o.isInstancedMesh)inst+=o.count;});
    return{scene:name,calls:Math.round(m(r.map(q=>q.calls))),tris:Math.round(m(r.map(q=>q.tris))),points:Math.round(m(r.map(q=>q.pts))),msFrame:+m(r.slice(2).map(q=>q.ms)).toFixed(1),meshes,instances:inst,geometries:renderer.info.memory.geometries,textures:renderer.info.memory.textures,programs:(renderer.info.programs||[]).length,postTier:POST.tier};};});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>RUN(7));console.log(JSON.stringify(await ev(()=>PROBE('ride'))));
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.25);RUN(9);});console.log(JSON.stringify(await ev(()=>PROBE('beach'))));
await ev(()=>{const SQ=t=>players.filter(p=>p.team===t&&!p.dead&&!p.inBoat&&!p.joining);dd.front=Math.min(dd.front,-460);for(const u of SQ('A')){u.x=560+(Math.random()-.5)*40;u.y=-500;u.path=[];}ddGoSquad('A');RUN(8);});console.log(JSON.stringify(await ev(()=>PROBE('top'))));
await ev(()=>{ddRoster.stage=1;ddmSave();startCounter();});await page.waitForTimeout(500);await page.waitForTimeout(800);await ev(()=>{for(let i=0;i<20&&!(dd&&dd.dc);i++)RUN(.25);for(let i=0;i<120&&dd.dc&&!/^w/.test(dd.dc.ph);i++)RUN(.5);RUN(8);});console.log(JSON.stringify(await ev(()=>PROBE('counter'))));
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(500);await ev(()=>RUN(12));console.log(JSON.stringify(await ev(()=>PROBE('village'))));
console.log('errors',errors.length,JSON.stringify(errors.slice(0,4)));await b.close();srv.close();})();
