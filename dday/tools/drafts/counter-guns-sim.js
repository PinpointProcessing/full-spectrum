// Version 224: the reworked counterattack left to itself (the squad on the guns, nobody playing), or with a bot that fills empty guns and turns
// the guns on tanks: how it ends, in how long, who is down, which guns are lost. node counter-guns-sim.js SEED [idle|bot] [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,MODE=process.argv[3]||'idle',PORT=+process.argv[4]||9806;
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(5000+s);ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;R.minLevel=2;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));ddmSave();window.requestAnimationFrame=()=>0;startCounter();},SEED);await page.waitForTimeout(700);
let out=null;
for(let k=0;k<70&&!out;k++){out=await ev(mode=>{const C=dd.dc;for(let i=0;i<300&&!dd.won&&!dd.over;i++){update(1/30);if(i%15==0){panTick(.5);ddFrame(.5,simT);}
      if(mode==='bot'&&i%30==0&&C.ph!=='intro'){for(const g of C.guns)if(!g.dead&&!g.man&&!g.going)dcTile(g.k);if(dd.fp)fpExit();const K=ddTanksUp().filter(q=>!q.hold&&q.y>-200)[0];if(K&&C.focusK!==K)dcFocus(null,K);}}
    const S={t:Math.round(simT-dd.t0),ph:C.ph,wave:C.wave,foes:enemies.filter(e=>!beaten(e)).length,tanks:dd.tanks.filter(K=>K.hp>0).length,up:players.filter(alive).length,down:players.filter(p=>p.downed&&!p.dead).length,dead:players.filter(p=>p.dead).length,
      guns:C.guns.map(g=>g.dead?'X':g.man?(g.man.npc?'n':'S'):'-').join(''),npc:dd.npcs.filter(alive).length,flag:+C.cpT.toFixed(1)};
    if(dd.won||dd.over){S.end=dd.won?'WON':'LOST '+dd.why;return S;}window.LAST=S;return null;},MODE);
  if(!out&&k%3===2)console.log(JSON.stringify(await ev(()=>LAST)));}
console.log('END',JSON.stringify(out||await ev(()=>LAST)),'errors',errors.length,errors.slice(0,2));await b.close();srv.close();process.exit(0);})();
