// Version 221 (Bryan, after Version 220, with a picture from the hilltop bunker's gun: "a crap ton of troops were conglomerating. Way to many and it looked
// weird and congested"): the squads on the top with the way up clear, 90 s: how many of the other troops are up there and how tightly packed.
// node top-crowd-test.js [seed port out]   (DDROOT for another copy)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const SEED=+process.argv[2]||1,PORT=+process.argv[3]||9785,OUT=process.argv[4]||'.';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(s=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4000+s);localStorage.removeItem('warehouseYard.ddmeta.v1');},SEED);
await page.click('#ddBtn');await page.waitForTimeout(600);
const r=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%10==0){panTick(1/3);ddFrame(1/3,simT);}}};RUN(20);
  // everything below the top is taken, the top's own men are down but for the barracks' (so the base isn't open): the squads on the top
  for(const e of enemies)if(e.y>-470||e.tag==='crest'||e.tag==='heavy'||e.tag==='art'){e.hp=0;e.dead=true;}
  for(const k of['beach','left','nest','hill','outpost','draw','crest','heavy','art'])dd.held[k]=true;dd.heldOrder=['beach','left','outpost','draw','crest'];
  const put=(t,x,y)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+x+(k%2)*12,y:y+((k/2)|0)*12,path:[],inBoat:false,afloat:false,joining:false}));
  put('A',120,-400);put('B',200,-380);selectTeam('A');dd.active='A';dd.sup&&(dd.sup.B='hold');for(const e of enemies)e.stunT=1e9;
  const S=[];for(let t=0;t<90;t+=10){RUN(10);const np=dd.npcs.filter(u=>!u.dead&&!u.inBoat),top=np.filter(u=>u.y<-300);
    const off=np.filter(u=>u.y<330);let pack=0;for(const u of off){const c=off.filter(o=>hyp(o.x-u.x,o.y-u.y)<80).length;pack=Math.max(pack,c);}   // (off the sand: a boat unloading is packed by nature)
    S.push({t:t+10,up:np.length,top:top.length,pack,open:!!(dd.base&&dd.base.open)});}
  window.TOPS=dd.npcs.filter(u=>!u.dead&&!u.inBoat&&u.y<-300).map(u=>[Math.round(u.x-DDX),Math.round(u.y)]);return S;});
for(const s of r)console.log(JSON.stringify(s));const L=r[r.length-1],M=Math.max(...r.map(s=>s.pack)),T=Math.max(...r.map(s=>s.top));
console.log('on the top at the end',JSON.stringify(await ev(()=>TOPS)));
ok(T<=12,'no more than a dozen of the other troops on the top while it is a dead end (most: '+T+')');ok(M<=9,'never more than nine of them within 8 m of one another, off the sand (most: '+M+'; 20 before)');ok(L.up>=10,'troops still about ('+L.up+' up)');
await ev(()=>{dd.track=null;camPan=null;const u=players.find(p=>p.team==='A'&&alive(p));camT.x=DDX+250;camT.z=-380;yaw=0;bigText('');ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(450);
await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.waitForTimeout(200);await page.screenshot({path:OUT+'/top-crowd.png'});
// the setting: Auto cover from grenades
const g=await ev(()=>{const A=players.filter(p=>p.team==='A'&&alive(p)),B=players.filter(p=>p.team==='B'&&alive(p));const go=()=>{for(const u of players){u.path=[];u.lastOrder=-99;}const a=A[0],b2=B[0];ddDodge({x1:a.x+4,y1:a.y+4,R:58});ddDodge({x1:b2.x+4,y1:b2.y+4,R:58});return[A.filter(u=>u.path.length).length,B.filter(u=>u.path.length).length];};
  const on0=DDC.dodge;DDC.dodge=true;const on=go();DDC.dodge=false;const off=go();DDC.dodge=on0;paused=true;hud();const pan=!document.querySelector('#ddSet').hidden;paused=false;hud();return{on,off,pan,hid:document.querySelector('#ddSet').hidden,card:!!document.querySelector('#ddCtlDodge')};});
console.log(JSON.stringify(g));ok(g.on[0]>0&&g.on[1]>0,'auto cover on: both squads run out of a blast');ok(g.off[0]===0&&g.off[1]>0,'off: the squad you play stays, the other still runs');ok(g.pan&&g.hid&&g.card,'the setting is on the start card and on a panel while paused');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
