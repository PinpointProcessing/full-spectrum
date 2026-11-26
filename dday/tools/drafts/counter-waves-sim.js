// Version 254: Chapter 2's seven waves left to themselves (the squad on the guns by itself, nobody playing) or with a bot that fills empty guns and
// turns them on tanks (counter-guns-sim.js's bot): the phases, the other troops' lines, the guns and the checkpoint every 15 s of game time, every
// banner, big text and bubble, the damage the squad took on and off the guns, the end.
// node counter-waves-sim.js SEED [port] [secs] [idle|bot] [noseq|seq]   (DDROOT = the dday folder; HARNESS = the scratchpad's harness.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9920,SECS=+process.argv[4]||900,MODE=process.argv[5]||'idle',SQ=process.argv[6]||'noseq',ROOT=process.env.DDROOT||'/home/user/full-spectrum/dday';
(async()=>{const srv=await serve(ROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?${SQ==='noseq'?'noseq&':''}gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(SEED=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919+13);window.requestAnimationFrame=()=>0;startCounter();
  window.EV=[];window.TKERR=[];const bn=banner;window.banner=(t,ms)=>{if(t)EV.push([+simT.toFixed(1),'banner',t]);return bn(t,ms);};const bt=bigText;window.bigText=(t,c)=>{if(t)EV.push([+simT.toFixed(1),'big',t]);return bt(t,c);};
  const bb=bubble;window.bubble=(u,t,c,ms)=>{EV.push([+simT.toFixed(1),'bubble',(u&&u.name)+': '+t]);return bb(u,t,c,ms);};
  window.HURT={};const d0=damage;window.damage=(t,dmg,src)=>{const on=t&&t.dcGun&&t.dcGun.man===t,hp0=t&&t.hp;const r=d0(t,dmg,src);if(t&&t.side==='P'&&!t.npc){const H=HURT[t.id]||(HURT[t.id]={n:t.name,on:0,off:0,min:100});if(on)H.on+=hp0-t.hp;else H.off+=hp0-t.hp;H.min=Math.min(H.min,t.hp);}return r;};},SEED);
await page.waitForTimeout(800);
const r=await ev(({SECS,MODE})=>{const C=dd.dc,T0=simT,L=[];let last=-99,ph=C.ph;
  const bot=()=>{for(const g of C.guns)if(!g.off&&!g.dead&&!g.man&&!g.going)dcTile(g.k);if(dd.fp)fpExit();const K=ddTanksUp().filter(k=>!k.hold)[0];if(K&&!C.focusK)dcFocus(null,K);};
  for(let i=0;i<SECS*30&&!endAt;i++){try{update(1/30);}catch(e){TKERR.push(e.message+' '+(e.stack||'').split('\n')[1]);if(TKERR.length>5)break;}
    if(MODE==='bot'&&i%15===0)bot();
    if(C.ph!==ph){L.push([+(simT-T0).toFixed(1),'PH',ph+'>'+C.ph]);ph=C.ph;}
    if(simT-T0-last>=15){last=simT-T0;const npcs=dd.npcs.filter(alive),lines=[0,0,0,0,0];for(const u of npcs)lines[u.ln||0]++;
      L.push([+(simT-T0).toFixed(1),C.ph,'w'+C.wave,'foes',enemies.filter(e=>!beaten(e)&&/^w|cp/.test(e.tag)).length,'tanks',ddTanksUp().filter(k=>!k.hold).length,'npc',npcs.length,'lines',lines.join(''),'storm',npcs.filter(u=>u.cpGo).length,
        'guns',C.guns.filter(g=>!g.off).map(g=>g.k+(g.dead?'X':g.man?(g.man.npc?'n':'m'):'-')+Math.round(g.hp)).join(' '),'sq',players.filter(alive).length+'/'+players.length,'cp',C.cpOurs?'OURS':C.cpGo?'GO '+(C.czN||'')+' '+C.capT.toFixed(1):'-']);}}
  return{L,end:{t:+(simT-T0).toFixed(1),won:dd.won,over:dd.over,why:dd.why,wave:C.wave,ph:C.ph,spawned:C.spawned,dead:players.filter(p=>p.dead).map(p=>p.name),down:players.filter(p=>p.downed&&!p.dead).map(p=>p.name)}};},{SECS,MODE});
for(const l of r.L)console.log(JSON.stringify(l));
for(const e of await ev(()=>EV))console.log('  ',JSON.stringify(e));
console.log('HURT',JSON.stringify(await ev(()=>HURT)));
console.log('END',JSON.stringify(r.end));console.log('errors',errors.slice(0,4),await ev(()=>TKERR.slice(0,4)));await b.close();srv.close();})();
