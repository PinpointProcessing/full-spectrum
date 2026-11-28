// Version 254: Chapter 2's seven waves left to themselves (the squad on the guns by itself, nobody playing) or with a bot that fills empty guns and
// turns them on tanks (counter-guns-sim.js's bot): the phases, the other troops' lines, the guns and the checkpoint every 15 s of game time, every
// banner, big text and bubble, the damage the squad took on and off the guns, the end.
// node counter-waves-sim.js SEED [port] [secs] [idle|bot] [noseq|seq]   (DDROOT = the dday folder; HARNESS = the scratchpad's harness.js)
// (Version 255: the log also has each helicopter's state and health, how many smoke grenades their men have thrown, the bazooka men's rockets)
// (Version 259: the end says whether their blockhouse came down and how many men came out of it; mode botbh is the bot that also brings it down
// with the field gun as soon as wave BHW (env, default 1) is on)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9920,SECS=+process.argv[4]||900,MODE=process.argv[5]||'idle',SQ=process.argv[6]||'noseq',ROOT=process.env.DDROOT||'/home/user/full-spectrum/dday';
(async()=>{const srv=await serve(ROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?${SQ==='noseq'?'noseq&':''}gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
await ev(([SEED,OVR])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919+13);window.requestAnimationFrame=()=>0;
  const mrg=(o,v)=>{for(const k in v){if(v[k]&&typeof v[k]==='object'&&!Array.isArray(v[k])&&o[k])mrg(o[k],v[k]);else o[k]=v[k];}};if(OVR)mrg(DCA,OVR);startCounter();   // (Version 255: OVR, a JSON object merged into DCA, to try numbers)
  window.REGEN=0;const sl=dcSpawnLot;window.dcSpawnLot=(n,c,a)=>{if(a)REGEN+=c;return sl(n,c,a);};   // (Version 259: the blockhouse's own men, ddcounter.js's dcRegen)
  window.EV=[];window.TKERR=[];const bn=banner;window.banner=(t,ms)=>{if(t)EV.push([+simT.toFixed(1),'banner',t]);return bn(t,ms);};const bt=bigText;window.bigText=(t,c)=>{if(t)EV.push([+simT.toFixed(1),'big',t]);return bt(t,c);};
  const bb=bubble;window.bubble=(u,t,c,ms)=>{EV.push([+simT.toFixed(1),'bubble',(u&&u.name)+': '+t]);return bb(u,t,c,ms);};
  window.HURT={};window.BY={};window.GUNBY={};const d0=damage;window.damage=(t,dmg,src)=>{const on=t&&t.dcGun&&t.dcGun.man===t,hp0=t&&t.hp,dn0=t&&(t.downed||t.dead);const r=d0(t,dmg,src);if(t&&t.side==='P'&&!t.npc){const H=HURT[t.id]||(HURT[t.id]={n:t.name,on:0,off:0,min:100});if(on)H.on+=hp0-t.hp;else H.off+=hp0-t.hp;H.min=Math.min(H.min,t.hp);
    const k=!src?'none':src.air?'heli':src.onTank?'tankmg':(dd.tanks||[]).includes(src)?'tank':src.name==='Mortar'?'mortar':src.tag==='cp'?'checkpoint':src.gunner?'mg':src.side==='E'?'rifle':'other',B=BY[k]||(BY[k]={hp:0,down:0});B.hp+=Math.max(0,hp0-t.hp);if(!dn0&&(t.downed||t.dead))B.down++;}return r;};
  const gh=dcGunHit;window.dcGunHit=(g,d)=>{const h0=g.hp,dead0=g.dead;gh(g,d);const k=(new Error().stack||'').includes('dcHeliRockets')?'heli':(new Error().stack||'').includes('dcShield')?'shot':'shell';const B=GUNBY[k]||(GUNBY[k]={hp:0,out:0});B.hp+=Math.max(0,h0-g.hp);if(!dead0&&g.dead)B.out++;};},[SEED,process.env.OVR?JSON.parse(process.env.OVR):null]);   // (Version 255: what hurts the squad, and what knocks out the guns)
await page.waitForTimeout(800);
const r=await ev(({SECS,MODE,BHW})=>{const C=dd.dc,T0=simT,L=[];let last=-99,ph=C.ph;
  const bot=()=>{for(const g of C.guns)if(!g.off&&!g.dead&&!g.man&&!g.going)dcTile(g.k);if(dd.fp)fpExit();const K=ddTanksUp().filter(k=>!k.hold)[0];if(K&&!C.focusK)dcFocus(null,K);
    const co=objs.find(o=>o.tag==='check'&&!o.gone),a=C.guns.find(g=>g.t==='art'&&!g.dead&&g.man&&!g.man.fp),c=DCA.check;if(MODE==='botbh'&&co&&a&&C.wave>=BHW&&/^w/.test(C.ph)&&simT>=a.fireT)dcFire(a,c.x+c.w/2,c.y+c.h/2);};
  for(let i=0;i<SECS*30&&!endAt;i++){try{update(1/30);}catch(e){TKERR.push(e.message+' '+(e.stack||'').split('\n')[1]);if(TKERR.length>5)break;}
    if((MODE==='bot'||MODE==='botbh')&&i%15===0)bot();
    if(C.ph!==ph){L.push([+(simT-T0).toFixed(1),'PH',ph+'>'+C.ph]);ph=C.ph;}
    if(simT-T0-last>=15){last=simT-T0;const npcs=dd.npcs.filter(alive),lines=[0,0,0,0,0];for(const u of npcs)lines[u.ln||0]++;
      L.push([+(simT-T0).toFixed(1),C.ph,'w'+C.wave,'foes',enemies.filter(e=>!beaten(e)&&/^w|cp/.test(e.tag)).length,'tanks',ddTanksUp().filter(k=>!k.hold).length,'npc',npcs.length,'lines',lines.join(''),'storm',npcs.filter(u=>u.cpGo).length,
        'guns',C.guns.filter(g=>!g.off).map(g=>g.k+(g.dead?'X':g.man?(g.man.npc?'n':'m'):'-')+Math.round(g.hp)).join(' '),'sq',players.filter(alive).length+'/'+players.length,'cp',C.cpOurs?'OURS':C.cpGo?'GO '+(C.czN||'')+' '+C.capT.toFixed(1):'-',
        'heli',(C.helis||[]).map(H=>H.st+Math.round(H.hp)).join(' ')||'-','smk',C.smkN||0,'bz',dd.npcs.filter(u=>alive(u)&&u.spec==='rpg').map(u=>u.specN).join('')]);}}   // (Version 255: the helicopters, their smoke, the bazooka men's rockets)
  return{L,end:{t:+(simT-T0).toFixed(1),won:dd.won,over:dd.over,why:dd.why,wave:C.wave,ph:C.ph,spawned:C.spawned,dead:players.filter(p=>p.dead).map(p=>p.name),down:players.filter(p=>p.downed&&!p.dead).map(p=>p.name),bh:{gone:!!(objs.find(o=>o.tag==='check')||{}).gone,regen:REGEN}}};},{SECS,MODE,BHW:+process.env.BHW||1});
for(const l of r.L)console.log(JSON.stringify(l));
for(const e of await ev(()=>EV))console.log('  ',JSON.stringify(e));
console.log('HURT',JSON.stringify(await ev(()=>HURT)));console.log('BY',JSON.stringify(await ev(()=>BY)));console.log('GUNBY',JSON.stringify(await ev(()=>GUNBY)));
console.log('END',JSON.stringify(r.end));console.log('errors',errors.slice(0,4),await ev(()=>TKERR.slice(0,4)));await b.close();srv.close();})();
