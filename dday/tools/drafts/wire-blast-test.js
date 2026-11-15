// Version 167 (Bryan: "Blow wire shouldn't be a thing. They should blow up from just a regular explosive"): node wire-blast-test.js [W H PORT]
// No Blow wire button on the squad's bar; a tap on the wire is an ordinary tap (a move); the Grenade tool tapped onto the wire throws a
// plain grenade that breaks it and opens the way; a Bazooka rocket does too; a blast further off leaves it standing.
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
(async()=>{const port=9930+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{const r=await ev(f,a);if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));};
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(3);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);for(const e of enemies)e.sup=1;});   // (their men kept pinned: the test is the wire, not the fight)
await ok('no Blow wire button on the bar',()=>{ddBar();const t=[...document.querySelectorAll('#sq .sq-tool')].map(b=>b.dataset.k);return{ok:!t.includes('wire')&&t.includes('nade'),tools:t};});
// a stretch of beach wire in front of the squad
await ev(()=>{const m=players.filter(p=>p.team===dd.active&&alive(p));const cx=m.reduce((a,u)=>a+u.x,0)/m.length;
  window.WIRE=(dd.wires||[]).filter(o=>o.y===340&&!o.gone).sort((a,b)=>Math.abs(a.x+a.w/2-cx)-Math.abs(b.x+b.w/2-cx))[0];
  // put the squad 14 m south of it, nobody in the wire
  m.forEach((u,i)=>{u.x=WIRE.x+WIRE.w/2-30+i*20;u.y=WIRE.y+140;u.path=[];});RUN(.2);});
await ok('a tap on the wire is a plain tap: the wire stays',()=>{const[sx,sy]=toS(WIRE.x+WIRE.w/2,WIRE.y+4);tap(sx,sy);RUN(.1);const r={ok:!WIRE.gone&&!players.some(p=>p.throwGo||p.rpgAim),gone:!!WIRE.gone};preview=null;return r;});
await ok('a grenade from the Grenade tool, tapped onto the wire, breaks it',async()=>{ddToolUse('nade');const u=dd.toolU;if(!u)return{ok:false,why:'no thrower'};const n0=u.grenade;
  const[sx,sy]=toS(WIRE.x+WIRE.w/2,WIRE.y+4);tap(sx,sy);for(let i=0;i<20&&!WIRE.gone;i++)RUN(.5);
  const blocked=!isFree(WIRE.x+WIRE.w/2,WIRE.y+4,3);return{ok:!!WIRE.gone&&u.grenade===n0-1&&!blocked,thrower:u.name,gone:!!WIRE.gone,grenades:[n0,u.grenade],walkable:!blocked};});
await ok('a rocket breaks another stretch',()=>{const o=(dd.wires||[]).filter(q=>q.y===340&&!q.gone).sort((a,b)=>Math.abs(a.x-WIRE.x)-Math.abs(b.x-WIRE.x))[1];const u=players.find(p=>p.team===dd.active&&alive(p)&&p.spec==='rpg'&&p.specN>0)||players.find(p=>alive(p)&&p.spec==='rpg'&&p.specN>0);
  if(!o||!u)return{ok:false,why:'no wire or bazooka'};u.x=o.x+o.w/2;u.y=o.y+160;u.path=[];const r=orderThrow(u,o.x+o.w/2,o.y+4,'rpg');for(let i=0;i<20&&!o.gone;i++)RUN(.5);return{ok:!!o.gone,ordered:r,gone:!!o.gone};});
await ok('a blast 8 m off leaves it standing',()=>{const o=(dd.wires||[]).filter(q=>q.y===340&&!q.gone)[0];const hp=o.hp;explode(o.x+o.w/2,o.y+4+80,players.find(p=>alive(p)),false,58,95);return{ok:!o.gone&&o.hp===hp,hp:[hp,o.hp]};});
await ok('the objective tells you what to do with the wire',()=>{const o=ddObjective();return{ok:/wire/.test(o&&o.t||''),t:o&&o.t};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();
