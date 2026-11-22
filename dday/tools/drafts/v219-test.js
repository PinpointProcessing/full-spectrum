// Version 219 (Bryan: "sometimes when I click a tool it doesn't go to it... I then try to use it but just end up moving players"; "they run the other way
// for a second and then reroute"; out of the first hole "the units go left or right out of the hole instead of straight"; at the first bunker "one unit
// goes all the way inside around the other side"). Finger taps through CDP touch events. node v219-test.js [port]   (DDROOT for another copy)
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const PO=+process.argv[2]||9781,W=390,H=760;const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PO);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true,deviceScaleFactor:1});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
await page.goto(`http://localhost:${PO}/index.html?gfx=0`);await page.waitForTimeout(2500);
const ev=(f,a)=>page.evaluate(f,a);let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const cdp=await ctx.newCDPSession(page);
const touch=(type,x,y)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:type==='touchEnd'?[]:[{x,y,id:1}]});
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4001);window.requestAnimationFrame=()=>0;});
await page.click('#ddBtn');await page.waitForTimeout(500);
await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%3===0){panTick(.1);ddFrame(.1,simT);hud();ddBar();}}};RUN(22);for(const e of enemies)e.stunT=1e9;
  window.PUTAT=(t,L)=>players.filter(p=>p.team===t&&alive(p)).forEach((u,k)=>Object.assign(u,{x:DDX+L[k%L.length][0],y:L[k%L.length][1],path:[],inBoat:false,afloat:false,joining:false,sup:0}));
  window.FRESH=()=>{if(dd.toolK)ddToolEnd();mode=null;preview=null;fireOrderAt=-1e9;dd.usedAt=-1e9;PUTAT('B',[[100,700]]);PUTAT('A',[[370,528],[392,528],[370,512],[392,512]]);for(const u of players){u.grenade=Math.max(u.grenade||0,2);u.throwGo=null;}selectTeam('A');dd.active='A';dd.track={team:'A'};ddGoSquad('A');RUN(1.5);dd.track=null;render(.03,simT);drawOverlay(.03,simT);hud();ddBar();};
  window.MID=sel=>{const e=document.querySelector(sel);if(!e)return null;const r=e.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];};FRESH();});
// 1) a tool tapped while the bar is rebuilt under the finger
{const p=await ev(()=>MID('#sq .sq-tool[data-k="nade"]'));await touch('touchStart',p[0],p[1]);await page.waitForTimeout(60);
  await ev(()=>{const B=document.querySelector('#sq .sq-tools');B.dataset.h='';ddBar();});   // (what a count or a name changing does every few moments in a fight)
  await page.waitForTimeout(40);await touch('touchEnd');await page.waitForTimeout(150);
  const r=await ev(()=>({k:dd.toolK,mode,sel:sel.length}));console.log(JSON.stringify(r));ok(r.k==='nade'&&r.mode==='grenade','a tool tapped while the bar redraws under the finger is in hand');}
// 2) with it in hand, a slow press on the map near one of ours still throws it
{const r=await ev(()=>{const u=dd.toolU,q=toS(u.x+60,u.y-110);return{x:q[0],y:q[1],g:players.filter(p=>p.team==='A').reduce((n,p)=>n+(p.grenade||0),0)};});
  await touch('touchStart',r.x,r.y);await page.waitForTimeout(520);await touch('touchEnd');await page.waitForTimeout(150);
  const a=await ev(()=>{const A=players.filter(p=>p.team==='A'),o={k:dd.toolK,mode,thr:A.filter(p=>p.throwGo).length,moving:A.filter(p=>p.path.length&&!p.throwGo).length};RUN(1.5);o.g=A.reduce((n,p)=>n+(p.grenade||0),0);o.thr2=A.filter(p=>p.throwGo).length;return o;});
  console.log(JSON.stringify(r),JSON.stringify(a));ok(a.g<r.g||a.thr>0||a.thr2>0,'a slow press (half a second) on the map with a grenade in hand throws it');ok(a.moving<=1,'nobody is sent walking by it');}
// 3) a slow press right on one of ours with a tool in hand doesn't put it away
{await ev(()=>FRESH());const p=await ev(()=>MID('#sq .sq-tool[data-k="nade"]'));await touch('touchStart',p[0],p[1]);await page.waitForTimeout(50);await touch('touchEnd');await page.waitForTimeout(120);
  const q=await ev(()=>{const u=players.find(p=>p.team==='A'&&alive(p)&&p!==dd.toolU),s=toS(u.x,u.y,8);return{x:s[0],y:s[1],k:dd.toolK};});
  await touch('touchStart',q.x,q.y);await page.waitForTimeout(520);await touch('touchEnd');await page.waitForTimeout(120);
  const r=await ev(()=>({sel:sel.length,k:dd.toolK,mode,ban:(document.querySelector('#banner')||{}).textContent}));console.log(JSON.stringify(q),JSON.stringify(r));
  ok(q.k==='nade'&&!(r.sel===1&&!r.k&&!r.mode),'a slow press on one of ours with a tool in hand does not leave one man picked and the tool gone');await ev(()=>{if(dd.toolK)ddToolEnd();});}
// 4) out of the deep hole, north: straight
const mv=(tx,ty,from)=>ev(([tx,ty,from])=>{if(dd.toolK)ddToolEnd();mode=null;PUTAT('B',[[100,700]]);PUTAT('A',from);RUN(.2);const m=players.filter(p=>p.team==='A'&&alive(p));selectTeam('A');const as=makeAssign(m,DDX+tx,ty);if(!as.length)return[];commit(as);
  const R=as.map(a=>({n:a.u.name,f:[a.u.x,a.u.y],to:[Math.round(a.x-DDX),Math.round(a.y)],walk:(()=>{let L=0,x=a.u.x,y=a.u.y;for(const w of a.path){L+=Math.hypot(w.x-x,w.y-y);x=w.x;y=w.y;}return Math.round(L);})(),str:Math.round(Math.hypot(a.x-a.u.x,a.y-a.u.y))}));
  RUN(.6);as.forEach((a,k)=>{const r=R[k],sx=a.x-r.f[0],sy=a.y-r.f[1],dx=a.u.x-r.f[0],dy=a.u.y-r.f[1];r.off=Math.round(Math.acos(Math.max(-1,Math.min(1,(sx*dx+sy*dy)/(Math.hypot(sx,sy)||1)/(Math.hypot(dx,dy)||1))))*57.3);delete r.f;});return R;},[tx,ty,from]);
const HOLE=[[370,528],[392,528],[370,512],[392,512]],SAND=[[330,370],[352,370],[330,386],[352,386]];
for(const[tx,ty] of [[380,440],[380,470],[250,400],[545,392]]){const R=await mv(tx,ty,HOLE);console.log(tx,ty,JSON.stringify(R));
  ok(R.length===4&&R.every(r=>r.off<=30&&r.walk<=r.str*1.15+12),`out of the first hole to (${tx},${ty}): every man sets off toward his spot (off by ${R.map(r=>r.off)} degrees, walks ${R.map(r=>r.walk)} for ${R.map(r=>r.str)} straight)`);}
// 5) against the left bunker's front, its men gone: nobody is sent inside it
await ev(()=>{for(const e of enemies)if(e.tag==='left'){e.hp=0;e.dead=true;}});
for(const[tx,ty] of [[342,306],[320,304],[370,304],[342,300],[330,301],[360,301],[342,296]]){const R=await mv(tx,ty,SAND),ins=R.filter(r=>r.to[0]>300&&r.to[0]<384&&r.to[1]>250&&r.to[1]<292);console.log(tx,ty,JSON.stringify(R));
  ok(R.length===4&&!ins.length&&R.every(r=>r.walk<=r.str*1.5+30),`a tap on the left bunker's front at (${tx},${ty}): all four in front of it, none inside (${R.map(r=>r.to.join(','))})`);}
// a tap inside it still puts them inside
{const R=await mv(342,272,SAND),ins=R.filter(r=>r.to[0]>300&&r.to[0]<384&&r.to[1]>244&&r.to[1]<292);console.log(JSON.stringify(R));ok(ins.length>=2,'a tap inside the bunker still sends them inside ('+ins.length+' of '+R.length+')');}
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
