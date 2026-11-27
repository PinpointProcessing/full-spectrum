// Version 222 (Bryan: "going up the hill, the circles should appear immediately when the enemy is killed that was occupying them. No arrows"): a gun's gold
// circle, and the gun, are yours the moment its own gunner is down, before its place is taken. node gun-rings-test.js [seed port out]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9789,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const shot=async n=>{await ev(()=>{bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
const a=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};RUN(20);ddWaves=()=>{};ddShelling=()=>{};dd.post.sent=99;for(const e of enemies){e.nade=0;e.mortarT=1e9;}   /* (no new defenders out of the house, no grenades or shells: they drive a man off a gun, which is the game working, but not what's tested here) */for(const u of dd.npcs){u.hp=0;u.dead=true;if(u.m)u.m.g.visible=false;}for(const e of enemies)e.stunT=1e9;
  window.PUT=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  window.GUNNER=g=>enemies.find(e=>e.gunner&&e.onGun&&!beaten(e)&&hyp(e.onGun.x-g.gx,e.onGun.y-g.gy)<16);
  const G=dd.post.guns;return{n:G.length,z:G.map(g=>g.z),crew:G.map(g=>!!GUNNER(g)),free:G.map(g=>ddPostHeld(g))};});
console.log(JSON.stringify(a));ok(a.n===4&&a.crew.every(Boolean)&&a.free.every(v=>!v),'four guns, each with a man of theirs on it, none with a circle');
// the checkpoint: one gunner down while the place is still theirs
const c=await ev(()=>{const G=dd.post.guns,g=G[0],e=GUNNER(g);e.hp=0;e.dead=true;for(const q of enemies)if(q.tag==='outpost'&&!q.dead)q.hp=1e6;   /* (the rest of the checkpoint's men kept alive, so it stays theirs) */PUT('A',700,60);PUT('B',660,90);selectTeam('A');dd.active='A';RUN(.6);
  const free=G.map(q=>ddPostHeld(q));dd.track=null;camPan=null;camT.x=g.gx;camT.z=g.gy+40;return{free,held:!!dd.held.outpost,left:enemies.filter(e=>e.tag==='outpost'&&!beaten(e)).length};});
console.log(JSON.stringify(c));ok(c.free[0]&&!c.free[1]&&!c.held&&c.left>0,'its gunner down: that gun has its circle at once, the other gun not, the checkpoint still theirs ('+c.left+' of them left)');await shot('g1-checkpoint');
const s=await ev(()=>{const g=dd.post.guns[0];DD_POST.noAuto=1;const r=ddPostSend(g);let on=false,t=0;for(;t<120&&!on;t++){RUN(.2);if(g.man&&g.man.onGun&&players.includes(g.man))on=true;}return{r,on,t:+(t*.2).toFixed(1),who:g.man&&g.man.name,held:!!dd.held.outpost};});
console.log(JSON.stringify(s));ok(s.r&&s.on&&!s.held,'tapped: one of yours gets on it, with the checkpoint not yet taken ('+s.t+' s)');
const n=await ev(()=>{const g=dd.post.guns[1],e=GUNNER(g);if(e){e.hp=0;e.dead=true;}for(let k=0;k<3;k++){const u=ddNpc(g.gx+60+k*14,g.gy+70);u.seen=true;}RUN(6);return{free:ddPostHeld(g),man:g.man?(g.man.npc?'npc':'ours'):null,going:g.going?(g.going.npc?'npc':'ours'):null,held:!!dd.held.outpost};});
console.log(JSON.stringify(n));ok(n.free&&n.man!=='npc'&&n.going!=='npc','the other troops do not take a gun by themselves before the place is yours');
// the hilltop bunker, from down the hill
const h=await ev(()=>{const G=dd.post.guns.filter(g=>g.z==="heavy"),e=GUNNER(G[0]);if(e){e.hp=0;e.dead=true;}RUN(.6);return{free:G.map(q=>ddPostHeld(q)),crest:!!dd.held.crest,heavy:!!dd.held.heavy};});
console.log(JSON.stringify(h));ok(h.free[0]&&!h.free[1]&&!h.crest&&!h.heavy,'the hilltop bunker: one gunner down, that gun has its circle with the top of the hill not taken');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
