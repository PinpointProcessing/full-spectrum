// a bot that plays Chapter 3: the played squad moves up a route in bounds, holds while it sees enemies, throws and fires rockets now and then
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,ROUTE=process.argv[3]||'west',PO=+process.argv[4]||0,MAXT=+process.argv[5]||1200;
(async()=>{const port=9880+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:420,height:860});
const ev=(f,a)=>page.evaluate(f,a);
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(SEED*7919+13);ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));for(const r of['rifle','gunner','medic','demo'])R.reserve.push(ddmNewMan(r,3,false));ddmSave();window.requestAnimationFrame=()=>0;},[SEED]);
await ev(()=>{startVillage({skip:true});window.DMG={};const d0=damage;damage=function(t,d,src){if(t&&t.side==='P'&&!t.npc&&players.includes(t)){const k=(src?(src.tag||src.name||src.id||'?'):'blast')+(src&&src.weapon==='sniper'?'/sn':'')+(src&&src.gunner?'/mg':'');const ph=dd&&dd.vg?dd.vg.ph:'?';DMG[ph+':'+k]=(DMG[ph+':'+k]||0)+d;}return d0.apply(this,arguments);};});await page.waitForTimeout(400);
await ev(([ROUTE])=>{
  const W={west:[[690,780],[655,690],[650,600],[690,520],[726,450],[722,380],[700,330],[600,270],[470,230],[360,170],[330,60],[323,-20],[360,-130],[460,-220],[600,-300],[700,-330],[700,-430],[700,-520],[560,-620],[860,-640],[700,-520]],
    road:[[690,780],[655,690],[650,600],[690,520],[726,450],[722,380],[700,330],[700,240],[690,150],[700,60],[700,-10],[700,-90],[700,-200],[700,-300],[700,-430],[700,-520],[560,-620],[860,-640],[700,-520]],
    east:[[690,780],[655,690],[650,600],[690,520],[726,450],[800,420],[880,380],[950,330],[930,250],[960,190],[1030,170],[1031,60],[1031,-20],[1000,-130],[900,-230],[800,-300],[700,-330],[700,-430],[700,-520],[860,-640],[560,-620],[700,-520]]}[ROUTE];
  window.BOT={W,i:0,t:0,nadeT:0,rpgT:0,log:[],stuck:0,lastC:null};
  window.BOTSTEP=()=>{const B=BOT,m=players.filter(p=>p.team===dd.active&&alive(p)&&!p.joining);if(!m.length){const o=players.filter(p=>alive(p));if(o.length)select(players.filter(p=>p.team===o[0].team&&alive(p)));return;}
    const cx=m.reduce((a,u)=>a+u.x,0)/m.length,cy=m.reduce((a,u)=>a+u.y,0)/m.length;
    const vis=enemies.filter(e=>!beaten(e)&&e.vis&&hyp(e.x-cx,e.y-cy)<360);
    // tools: a grenade at the nearest one seen in reach, a rocket at a gunner or the tank
    if(simT>B.nadeT&&vis.length){const g=m.find(u=>(u.grenade||0)>0&&!u.throwGo&&!pinnedNow(u));if(g){const t=vis.filter(e=>hyp(e.x-g.x,e.y-g.y)<nadeRange(g)+20).sort((a,c)=>hyp(a.x-g.x,a.y-g.y)-hyp(c.x-g.x,c.y-g.y))[0];if(t&&orderThrow(g,t.x,t.y,'nade'))B.nadeT=simT+10;}}
    if(simT>B.rpgT){const r=m.find(u=>u.spec==='rpg'&&u.specN>0&&!u.throwGo&&!u.rpgAim&&!pinnedNow(u));if(r){const K=ddTanksUp().find(K=>hyp(K.x-r.x,K.y-r.y)<600&&hyp(K.x-r.x,K.y-r.y)>PRPG.min+10)||vis.find(e=>e.gunner&&hyp(e.x-r.x,e.y-r.y)<500&&hyp(e.x-r.x,e.y-r.y)>PRPG.min+10);if(K&&orderThrow(r,K.x,K.y,'rpg'))B.rpgT=simT+8;}}
    if(vis.length||m.some(u=>u.path.length))return;   // hold while there's someone to shoot, or while moving
    // the village: the next place not yet ours
    if(dd.vg.ph==='village'){const z=VG.zones.find(z=>!dd.vg.held[z.k]);if(z&&B.i>=B.W.length-5){B.W[B.i]=[z.lx,z.ly+20];}}
    const w=B.W[Math.min(B.i,B.W.length-1)];
    if(hyp(cx-w[0],cy-w[1])<55&&B.i<B.W.length-1){B.i++;return;}
    const as=makeAssign(m,w[0],w[1]);if(as.length){for(const q of as)Object.assign(q.u,{path:q.path,lastOrder:simT});}else{B.stuck++;if(B.stuck>3&&B.i<B.W.length-1){B.i++;B.stuck=0;}}
  };
  window.RUNB=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);ddFrame(1/30,simT);if(i%30===0)BOTSTEP();if(endAt)break;}};
  window.STAT=()=>{const V=dd.vg,grp=t=>enemies.filter(e=>e.tag.startsWith(t)&&!beaten(e)).length;
    return `t ${Math.round(V.t)} ph ${V.ph} front ${Math.round(V.front)} wp ${BOT.i} sq ${players.filter(alive).length}/${players.length} down ${players.filter(p=>p.downed).length} res ${ddRoster.reserve.length} lost ${dd.lost} | w ${grp('w')} f ${grp('f')} v ${grp('v')} r1 ${grp('r1')} r2 ${grp('r2')} tanks ${ddTanksUp().length} trucks ${V.trucks.map(K=>K.ph).join('/')} | npc ${dd.npcs.filter(alive).length}/${dd.npcs.length} held ${Object.keys(V.held).join(',')} won ${dd.won} over ${dd.over} endAt ${!!endAt}`;};
},[ROUTE]);
const t0=Date.now();let last='';
for(let k=0;k<MAXT/10;k++){const s=await ev(()=>{const a=performance.now();RUNB(10);return STAT()+` | ${Math.round(performance.now()-a)}ms`;});if(k%3===2||s.includes('won true')||s.includes('over true'))console.log(s);last=s;if(/endAt true/.test(s))break;}
console.log('tank',await ev(()=>dd.tanks.map(K=>Math.round(K.hp)).join(',')+' rockets by npc '+(window.NPCR||0)));
console.log('dmg',await ev(()=>Object.entries(DMG).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>k+' '+Math.round(v)).join(' | ')));
console.log('final',last,'real',Math.round((Date.now()-t0)/1000),'s');
console.log('errors',errors.length,errors.slice(0,6));
await b.close();srv.close();})();
