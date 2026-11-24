// Version 226: the Engineer repairs a knocked-out gun; the report goes straight to the next mission; nobody is left wounded. node v226.js [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const PORT=+process.argv[2]||9830;
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
const act=async(sel,w)=>{const r=await ev(s=>{const e=document.querySelector(s);if(!e)return 'none';ddmClick({target:e,clientX:0,clientY:0});return 'ok';},sel);await page.waitForTimeout(w||1200);return r;};
// the report: nobody wounded, NEXT MISSION opens the briefing there, START goes into the counterattack
await page.click('#ddAfterBtn');await page.waitForFunction(()=>typeof ddm!=='undefined'&&ddm&&ddm.ph==='report',null,{timeout:60000});await page.waitForTimeout(1500);
await ev(()=>{ddm.stepT=2;ddm.swT=0;});await act('.ddm-vic');await act('[data-a=award]',2500);await act('.ddm-skip');
const r=await ev(()=>({hurt:ddmAll().filter(m=>m.hurt).length,rowsHurt:ddm.rows.filter(q=>q.hurt).length,base:!!document.querySelector('[data-a=base]'),go:!!document.querySelector('.ddm-fbot [data-a=go]'),steps:document.querySelector('.ddm-steps')?.textContent}));console.log(JSON.stringify(r));
ok(r.hurt===0&&r.rowsHurt===0,'nobody is wounded after the battle');ok(!r.base&&r.go&&!/BASE/.test(r.steps),'no base step: NEXT MISSION on the report');
await act('.ddm-fbot [data-a=go]');ok(await ev(()=>ddm.ph==='report'&&!!document.querySelector('.ddm-brief')),'the briefing opens on the report');await page.screenshot({path:'v225out/brief.png'});
await act('[data-a=gox]');ok(await ev(()=>!document.querySelector('.ddm-brief')),'NOT YET closes it');
await act('.ddm-fbot [data-a=go]');await ev(()=>{window.requestAnimationFrame=()=>0;});await act('[data-a=start]',2500);
ok(await ev(()=>dd&&dd.counter&&players.length===8),'START: the counterattack with all eight');
// a gun knocked out, then repaired by the Engineer
const step=n=>ev(n=>{for(let i=0;i<n&&!dd.won&&!dd.over;i++)update(1/30);},n);
await ev(()=>{for(const e of enemies){e.hold=1;e.x=700;e.y=-1500;e.path=[];e.stunT=1e9;}for(const K of dd.tanks)K.hold=true;window.damage0=damage;});
await step(400);
const g0=await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='n2');dcGunHit(g,9999);return{dead:g.dead,eng:players.filter(u=>u.ddRole==='demo'&&alive(u)).length,ph:C.ph};});console.log(JSON.stringify(g0));ok(g0.dead,'the MG nest is knocked out');
await ev(()=>{for(const u of players)if(u.downed){u.downed=false;u.critical=false;u.hp=60;}});
let t=0,S=null;for(;t<60;t++){await step(30);S=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='n2');return{dead:g.dead,fix:g.fix?{u:g.fix.u.name,t:+g.fix.t.toFixed(1),d:Math.round(Math.hypot(g.fix.u.x-g.x,g.fix.u.y-g.y))}:null,hp:g.hp,hp0:g.hp0,man:g.man?g.man.name:g.going?'going':null};});if(t%6===0)console.log(t,JSON.stringify(S));if(!S.dead)break;}
ok(!S.dead&&S.hp===Math.round(S.hp0*.6),'an Engineer went by himself and has it working again at 60% ('+t+' s)');
await step(240);const S2=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='n2');return{man:g.man?g.man.name:null,going:!!g.going,rot:DD.dcGuns.n2.rotation.z};});console.log(JSON.stringify(S2));ok((S2.man||S2.going)&&S2.rot===0,'it is manned again and stands upright');
// a tap on a knocked-out gun sends an Engineer off his own gun
const T=await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='h2');const E=players.filter(u=>u.ddRole==='demo'&&alive(u));for(const u of E)if(!u.dcGun){const f=C.guns.find(q=>!q.dead&&!q.man&&!q.going&&q!==g);if(f){f.man=u;u.dcGun=f;}}dcGunHit(g,9999);for(const u of players)if(u.downed){u.downed=false;u.hp=60;}dcTile('h2');return{fix:g.fix?g.fix.u.name:null,onGun:g.fix?!!g.fix.u.dcGun:null};});console.log(JSON.stringify(T));ok(T.fix&&T.onGun===false,'a tap sends '+T.fix+' off his gun to repair it');
// Version 227: two repairs an Engineer, then his supplies are gone
const L=await ev(()=>{const C=dd.dc,E=players.filter(u=>u.ddRole==='demo');for(const g of C.guns)g.fix=null;E.forEach(u=>u.fixN=2);const g=C.guns.find(q=>q.dead)||C.guns[0];if(!g.dead)dcGunHit(g,9999);for(const u of players)if(u.downed){u.downed=false;u.hp=60;}
  return{sent:dcFixSend(g,true),left:dcFixLeft(),fix:!!g.fix,ban:document.querySelector('#banner')?.textContent};});console.log(JSON.stringify(L));ok(!L.sent&&!L.left&&!L.fix,'both Engineers have used their two repairs: nobody goes');
const L2=await ev(()=>{const C=dd.dc,u=players.find(q=>q.ddRole==='demo'&&alive(q));u.fixN=1;const g=C.guns.find(q=>q.dead);const s=dcFixSend(g,true);u.x=g.x;u.y=g.y+10;u.path=[];u.sup=0;for(let i=0;i<300&&g.dead;i++)update(1/30);return{s,dead:g.dead,n:u.fixN};});console.log(JSON.stringify(L2));ok(L2.s&&!L2.dead&&L2.n===2,'one left: he repairs it and that was his last');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
