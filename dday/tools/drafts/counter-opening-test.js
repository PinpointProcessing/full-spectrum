// Version 228: Chapter 2's opening, stepped in game time with a picture at each beat. node seq228.js OUT [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'seq228',PORT=+process.argv[3]||9890;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;startCounter();});await page.waitForTimeout(900);
const to=async t=>ev(t=>{let n=0;while(dd.seq&&dd.seq.t<t&&n++<900){update(1/30);ddCam(1/30);panTick(1/30);}return dd.seq?{ph:dd.seq.ph,t:+dd.seq.t.toFixed(2)}:{ph:'done',cph:dd.dc.ph};},t);
const shot=async n=>{await ev(()=>{bigText('');for(let i=0;i<2;i++){if(dd.seq)ddCam(.03);render(.03,simT);if(!(dd.seq&&dd.seq.ph==='hut'))drawOverlay(.03,simT);}hud();});await page.waitForTimeout(700);await ev(()=>{if(dd.seq)ddCam(.001);render(.001,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
const s0=await ev(()=>({seq:!!dd.seq,dc:dd.seq&&dd.seq.dc,ph:dd.seq&&dd.seq.ph,busy:ddBusy(),cls:document.body.classList.contains('ddseq'),y:players.map(p=>Math.round(p.y)),doom:dd.seq.doom.length,skip:!!document.querySelector('#vgSkip:not([hidden])')}));console.log(JSON.stringify(s0));
ok(s0.seq&&s0.dc&&s0.busy&&s0.cls&&s0.y.every(y=>y>650)&&!s0.skip,'it starts: the squad in the square, no orders, no Skip');
console.log(JSON.stringify(await to(3)));await shot('1-camp');
console.log(JSON.stringify(await to(4.9)));await shot('2-shells');ok(await ev(()=>dd.seq.doom.every(u=>u.dead)&&players.every(alive)),'the shells kill the bunch to one side; the squad is unhurt');
console.log(JSON.stringify(await to(7.2)));await shot('3-run');
for(const[t,n]of[[8.5,'4-hut-in'],[9.6,'5-hut-mid'],[10.6,'6-hut-hit'],[11.5,'7-hut-door']]){console.log(JSON.stringify(await to(t)));await shot(n);}
ok(await ev(()=>dd.seq.hut.guard[0].dead&&dd.seq.hut.guard.slice(1).every(u=>!u.dead)),'one of the men at the windows is shot');
console.log(JSON.stringify(await to(12.1)));await shot('8-out-low');
const o=await ev(()=>({foesAdv:enemies.filter(e=>!beaten(e)&&e.stage>=0).length,npcOut:dd.npcs.filter(u=>alive(u)&&u.y<DCA.wallY-20).length,fired:dd.npcs.filter(u=>alive(u)&&simT-(u.shotAtT||-99)<6).length+enemies.filter(e=>simT-(e.shotAtT||-99)<6).length,py:players.map(p=>Math.round(p.y))}));console.log(JSON.stringify(o));
ok(o.foesAdv>0&&o.npcOut>=4&&o.py.every(y=>y<562),'outside: their men are coming, the other troops are out in the field, the squad is out in front of the command post');
console.log(JSON.stringify(await to(13.6)));await shot('9-out-rise');
const e=await to(99);console.log(JSON.stringify(e));for(let i=0;i<3;i++)await ev(()=>{for(let k=0;k<30;k++)update(1/30);});await shot('10-battle');
const s1=await ev(()=>({seq:!!dd.seq,ph:dd.dc.ph,cls:document.body.classList.contains('ddseq'),guns:dd.dc.guns.filter(g=>g.man||g.going).length,up:players.filter(alive).length,camp:players.filter(p=>p.y>700).length}));console.log(JSON.stringify(s1));
ok(!s1.seq&&s1.ph==='w1'&&!s1.cls&&s1.guns>=3&&s1.up===8&&!s1.camp,'it ends in the first wave: guns being manned, all eight up');
// a retry has no sequence
await ev(()=>{startCounter(true);});await page.waitForTimeout(600);ok(await ev(()=>!dd.seq&&dd.dc.ph==='intro'),'a retry starts without it');
console.log('errors',errors.length,errors.slice(0,4));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
