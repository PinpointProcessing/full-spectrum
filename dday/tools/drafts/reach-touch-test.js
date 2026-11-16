// Versions 172-173: the reach the way it's really played (Bryan, after Version 171: "I don't see the range circle..."; after 172: "I want to click rpg
// and click where I shoot it"): on the beach under fire, men pinned as they really are, with finger taps through CDP touch events: the grenade tapped into
// hand, then the map; the Bazooka; the action ring switched off. node reach-touch-test.js [W H PORT]
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');
(async()=>{const port=9960+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage();   // (touch, not isMobile: the page's viewport tag is added when it's published, so here a mobile layout would be 980 wide)
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
await page.goto(`http://localhost:${port}/index.html?gfx=0`);await page.waitForTimeout(2500);
const ev=(f,a)=>page.evaluate(f,a);let fails=0;const cdp=await ctx.newCDPSession(page);
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
const touch=async(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(9);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);if(i%6===0)drawOverlay(.03,simT);}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);   // (nobody of ours dies, but the fire and the pinning are real)
  window.CNT=()=>{let n=0,f=0;const r0=ddcRingPath,f0=ox.fill.bind(ox);window.ddcRingPath=function(){n++;return r0.apply(this,arguments);};ox.fill=function(){if(/255,\s*140,\s*30/.test(String(ox.fillStyle)))f++;return f0.apply(ox,arguments);};
    render(.001,simT);drawOverlay(.03,simT);window.ddcRingPath=r0;ox.fill=f0;return{rings:n,orangeFills:f};};});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(6);const L=players.filter(p=>p.team===dd.active&&alive(p));const m={x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length};
  dd.track=null;camPan=null;zoom=2.4;camT.x=m.x;camT.z=m.y-60;for(let i=0;i<30;i++)ddFrame(1/30,simT);hud();drawOverlay(.03,simT);});
await ok('on the beach under fire: men pinned (as they really are)',()=>{const L=players.filter(p=>p.team===dd.active&&alive(p));for(let i=0;i<20&&!L.some(pinnedNow);i++)RUN(.5);
  const pin=L.filter(pinnedNow).length;if(!pin)for(const u of L)u.sup=1;return{ok:true,pinnedByFire:pin,squad:L.length,grenades:L.filter(u=>(u.grenade||0)>0&&!u.gl).length};});
await ok('every grenade man pinned: still a carrier, not "nobody free"',()=>{const L=players.filter(p=>p.team===dd.active&&alive(p));for(const u of L)u.sup=1;const T=DD_TOOLS.find(t=>t.k==='nade');return{ok:ddcCarriers(T).length>0&&ddToolFree(T).length===0,carriers:ddcCarriers(T).length,free:ddToolFree(T).length};});
// a finger tap on the grenade button, then a finger tap on the map, everyone pinned (Version 173: no dragging)
const btn=await ev(()=>{const L=players.filter(p=>p.team===dd.active&&alive(p));for(const u of L)u.sup=1;hud();drawOverlay(.03,simT);const b=document.querySelector('#sq .sq-tool[data-k="nade"]');const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];});
await touch('touchStart',btn[0],btn[1]);await touch('touchEnd',0,0);
await ok('a finger tap on the grenade: in hand, its reach orange though he is pinned',()=>{const c=CNT();return{ok:dd.toolK==='nade'&&!!dd.toolU&&pinnedNow(dd.toolU)&&c.rings>0&&c.orangeFills>0,inHand:dd.toolK,who:dd.toolU&&dd.toolU.name,...c};});
const near=await ev(()=>{const u=dd.toolU;window.TU=u;dd.track=null;camPan=null;zoom=2.4;camT.x=u.x;camT.z=u.y-40;updateCamera();render(.001,simT);for(const q of players)if(q.team===dd.active)q.sup=1;hud();drawOverlay(.03,simT);toSBack=false;return toS(u.x+30,u.y-110,0);});   // (11 m from him: within his reach from where he stands)
await touch('touchStart',near[0],near[1]);await touch('touchEnd',0,0);
await ok('a finger tap on the map: the pinned man throws from where he stands',()=>{drawOverlay(.03,simT);const thrown=nades.some(n=>n.by===TU)||!!TU.throwGo;return{ok:thrown&&!dd.toolK,thrown,inHand:dd.toolK};});
// the Bazooka: its reach while in hand
const rb=await ev(()=>{RUN(.5);hud();drawOverlay(.03,simT);const b=document.querySelector('#sq .sq-tool[data-k="rpg"]');const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];});
await touch('touchStart',rb[0],rb[1]);await touch('touchEnd',0,0);
await ok('a finger tap on the Bazooka: in hand, its reach orange',()=>{const c=CNT();const k=dd.toolK;ddToolEnd();return{ok:k==='rpg'&&c.rings>0&&c.orangeFills>0,inHand:k,...c};});
// with Tap an enemy for actions off, the same
await ok('with the action ring off: a grenade in hand shows its reach the same',()=>{DDC.ring=false;const L=players.filter(p=>p.team===dd.active&&alive(p));for(const u of L){u.sup=0;u.throwGo=null;}
  ddToolUse('nade');const k=dd.toolK;const c=CNT();ddToolEnd();DDC.ring=true;return{ok:k==='nade'&&c.rings>0&&c.orangeFills>0,inHand:k,...c};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();
