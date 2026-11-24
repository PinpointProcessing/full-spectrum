const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const MODE=process.argv[2]||'look',W=+process.argv[3]||390,H=+process.argv[4]||760;
(async()=>{const port=9980+(MODE==='sim'?1:0)+(+process.argv[5]||0),srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=${MODE==='sim'?0:2}`);
await page.setViewportSize({width:W,height:H});
await page.evaluate(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;R.minLevel=2;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));for(const r of['rifle','sharp','gunner'])R.reserve.push(ddmNewMan(r,2,false));ddmSave();window.requestAnimationFrame=()=>0;startCounter();});
await page.waitForTimeout(800);const ev=(f,a)=>page.evaluate(f,a);
const shot=async n=>{await ev(()=>{updateCamera();render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(600);await ev(()=>{updateCamera();render(.001,simT);drawOverlay(.001,simT);});await page.screenshot({path:`ca_${n}_${W}.png`});};
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};});
const st=()=>ev(()=>{const C=dd.dc;return `t ${Math.round(simT-dd.t0)} ph ${C.ph} wave ${C.wave} foes ${enemies.filter(e=>!beaten(e)).length} tanks ${dd.tanks.filter(K=>K.hp>0).map(K=>Math.round(K.x)+','+Math.round(K.y)+':'+Math.round(K.hp)).join(' ')} ours ${players.filter(alive).length}/${players.length} npc ${dd.npcs.filter(alive).length} res ${ddRoster.reserve.length} guns ${C.guns.map(g=>g.k+(g.man?(g.man.npc?'n':'P'):'-')).join(' ')} cp ${C.cpT.toFixed(0)} state ${state} won ${dd.won}`;});
if(MODE==='look'){
  console.log(await ev(()=>'start: players '+players.length+' npcs '+dd.npcs.length+' enemies '+enemies.length+' tanks '+dd.tanks.length+' mode '+DD_MODE));
  await ev(()=>RUN(2.5));await shot('1column');
  await ev(()=>RUN(5));console.log(await st());await shot('2setup');
  // man a nest and a field gun by taps
  console.log(await ev(()=>{const r=[];select(players.filter(p=>p.team==='A'));r.push('tap nest1: '+ddTap(450,250)+' going '+(dd.dc.guns[0].going&&dd.dc.guns[0].going.name));select(players.filter(p=>p.team==='B'));ddTap(330,470);r.push('gun A going '+(dd.dc.guns[5].going&&dd.dc.guns[5].going.name));RUN(13);r.push('manned: '+dd.dc.guns.map(g=>g.k+':'+(g.man?g.man.name+(g.man.npc?'(npc)':''):'-')).join(' '));return r.join('\n');}));
  await ev(()=>{camPan=null;dd.track=null;zoom=3.2;tilt=ddTilt(3.2);camT.x=700;camT.z=330;});await shot('3field');
  await ev(()=>RUN(14));console.log(await st());
  console.log(await ev(()=>{const g=dd.dc.guns[5];ddTap(g.x,g.y);const a=dd.dc.art===g;const e=enemies.filter(x=>!beaten(x)).sort((p,q)=>q.y-p.y)[0];ddTap(e.x,e.y);RUN(3);return 'field gun: aim mode '+a+' fired, reload in '+Math.round(g.fireT-simT)+' s';}));
  await ev(()=>RUN(10));await ev(()=>{zoom=5;tilt=ddTilt(5);camT.x=700;camT.z=260;});await shot('4wave1');console.log(await st());
}else{
  for(let k=0;k<70;k++){await ev(()=>{RUN(6);
    // a simple player: before the first wave, put Alpha's gunner and rifleman on nests 1 and 2, Bravo's on the wall guns, the demo men by the gate; keep field guns to the other troops
    if(!window.SET&&dd.dc.ph==='setup'){window.SET=1;const P=id=>players.find(p=>p.id===id);const G=dd.dc.guns;for(const[id,k]of[['A2',0],['B2',1],['A3',2]])if(P(id))dcMan(P(id),G[k]);
      for(const[id,x,y]of[['A4',660,500],['B4',740,500],['A1',640,530],['B1',760,530],['B3',700,520]])if(P(id)){const p=findPath(P(id).x,P(id).y,x,y);if(p)P(id).path=p;}}
    if(endAt&&!window.FIN){window.FIN=1;finish();}
    // a field gun left empty with a tank about: the nearest free squad man who isn't a demo man takes it
    if(dd.tanks.some(k=>k.hp>0&&!k.hold))for(const g of dd.dc.guns)if(g.t==='art'&&!g.man&&!g.going){const u=players.filter(p=>alive(p)&&!p.dcGun&&p.spec!=='rpg').sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(u)dcMan(u,g);}
    // demo men fire at the nearest tank in reach
    for(const u of players)if(alive(u)&&u.spec==='rpg'&&u.specN>0&&!u.rpgAim&&simT>(u.botT||0)){const K=dd.tanks.filter(k=>k.hp>0&&hyp(k.x-u.x,k.y-u.y)<620&&k.y>-200)[0];if(K){u.botT=simT+6;orderThrow(u,K.x,K.y,'rpg');}}});
    const s=await st();if(k%4===3||/state end|state ddmeta/.test(s))console.log(s);if(/state end|state ddmeta/.test(s))break;}
  console.log(await ev(()=>state==='ddmeta'?'WON: rows '+ddm.rows.length+' dead '+ddm.dead.length+' '+ddm.sum+' stage '+ddRoster.stage:'LOST: '+document.querySelector('#endTitle').textContent+' / '+dd.why));
  if(await ev(()=>state==='ddmeta')){await ev(()=>{for(let i=0;i<6;i++)ddMetaFrame(.05,1);});await page.waitForTimeout(2500);await ev(()=>ddMetaFrame(.02,1));await page.screenshot({path:`ca_5report_${W}.png`});await page.click('#ddm [data-a="base"]');await ev(()=>{for(let i=0;i<6;i++)ddMetaFrame(.05,1);});await page.waitForTimeout(600);await ev(()=>ddMetaFrame(.02,1));await page.screenshot({path:`ca_6base_${W}.png`});}
}
console.log('errors',JSON.stringify(errors).slice(0,700));await b.close();srv.close();})();
