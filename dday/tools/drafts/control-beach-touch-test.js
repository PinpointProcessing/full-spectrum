const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||844,H=+process.argv[3]||390,PO=+process.argv[4]||0;
(async()=>{const port=9940+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},hasTouch:true});
const {page,errors}=await open(ctx,`http://localhost:${port}/index.html?noseq&gfx=2`);
await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);const log=async(l,f,a)=>console.log(l+':',await ev(f,a));
// the beach: land, then take a man over
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');window.requestAnimationFrame=()=>0;Math.random=(s=>()=>(s=(s*16807)%2147483647)/2147483647)(7);});
await page.click('#ddBtn');await page.waitForTimeout(800);
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(4);});
const shot=async n=>{await ev(()=>{updateCamera();render(.03,simT);drawOverlay(.03,simT);hud();});await page.waitForTimeout(700);await ev(()=>{updateCamera();render(.001,simT);drawOverlay(.001,simT);});await page.screenshot({path:`fpb_${n}_${W}.png`});};
await log('landed',()=>`done ${dd.land.done} A ${players.filter(p=>p.team==='A'&&alive(p)).map(p=>Math.round(p.x)+','+Math.round(p.y)).join(' ')}`);
await ev(()=>{select(players.filter(p=>p.team===dd.active&&alive(p)));hud();drawOverlay(.03,simT);});
await shot('0bar');
await ev(()=>{const u=players.find(p=>p.team===dd.active&&alive(p)&&p.ddRole==='rifle');fpEnter(u);window.SAFE=true;const d0=damage;damage=(t,d,s)=>SAFE&&t.side==='P'&&!t.npc?undefined:d0(t,d,s);for(const p of players)p.nerveK=.001;for(const p of dd.npcs)p.cool=1e9;});
await ev(()=>{dd.fp.a=-Math.PI/2;RUN(.2);});await shot('1third');
// run north up the beach 12 s: over the wire?
await log('run north',()=>{const F=dd.fp,u=F.u,r=[];F.keys.w=true;for(let i=0;i<8;i++){RUN(2);r.push(Math.round(u.x)+','+Math.round(u.y)+(u.path.length?'v':'')+(u.vaultK?'V':''));}F.keys.w=false;const m=players.filter(p=>p.team===u.team&&p!==u&&alive(p));return r.join(' ')+' | mates '+m.map(p=>Math.round(hyp(p.x-u.x,p.y-u.y))).join(' ')+' hp '+Math.round(u.hp);});
await shot('2up');
// clean shooting test: freeze everyone else's guns, stand an enemy 150 ahead with a clear line
await log('shoot',()=>{const F=dd.fp,u=F.u;for(const p of units)if(p!==u&&p.side==='P')p.cool=1e9;let e=null;for(const q of enemies){if(beaten(q))continue;for(const d of[120,90,160,60]){for(const a of[-Math.PI/2,-1,-2.2,0,Math.PI]){const x=u.x+Math.cos(a)*d,y=u.y+Math.sin(a)*d;if(isFree(x,y)&&los(u.x,u.y,x,y)&&coverAt(x,y,u.x,u.y)===0){e=q;e.x=x;e.y=y;break;}}if(e)break;}break;}
  if(!e)return'no spot';e.path=[];e.post=true;e.dazeT=1e9;const hp0=e.hp;const aim=()=>{const g=gndH(e.x,e.y)+(e.elev||0)+12;F.a=Math.atan2(e.y-u.y,e.x-u.x);F.p=0;for(let i=0;i<4;i++){const P2=fpPose();F.a=Math.atan2(e.y-P2.O.z,e.x-P2.O.x);F.p=Math.atan2(g-P2.O.y,hyp(e.x-P2.O.x,e.y-P2.O.z))-F.kick;}};
  window.TE=e;const r=[];for(const v of['3p','1p']){F.view=v;e.hp=100;e.dead=false;F.clip=8;F.reloadT=0;F.cool=0;aim();const ex=e.x,ey=e.y;F.fire=true;let n=0;while(!e.dead&&n++<60){aim();RUN(1/30);e.x=ex;e.y=ey;}F.fire=false;r.push(`${v}: dead ${e.dead} after ${(n/30).toFixed(1)}s clip ${F.clip} hit ${F.hitT>0}`);if(v==='3p'){e.dead=false;e.hp=100;}}
  return r.join(' | ')+` kills ${u.stats&&u.stats.kills}`;});
await log('miss',()=>{const F=dd.fp,u=F.u,e=enemies.filter(q=>!beaten(q))[0];e.x=window.TE.x;e.y=window.TE.y;e.path=[];e.dazeT=1e9;const hp0=e.hp;F.a=Math.atan2(e.y-u.y,e.x-u.x)+.35;F.p=0;F.clip=8;F.reloadT=0;F.fire=true;RUN(1.2);F.fire=false;return `hp ${hp0}->${Math.round(e.hp)} sup ${e.sup.toFixed(2)} clip ${F.clip}`;});
await ev(()=>{dd.fp.view='1p';dd.fp.p=-.02;RUN(.1);});await shot('3first');
// touch
const cdp=await ctx.newCDPSession(page);
const touch=(type,pts)=>cdp.send('Input.dispatchTouchEvent',{type,touchPoints:pts.map(p=>({x:p[0],y:p[1],id:p[2]}))});
await ev(()=>{window.LG=[];for(const n of['pointerdown','pointermove','pointerup','pointercancel'])$('#fp').addEventListener(n,e=>LG.push(n[7]+e.pointerId+':'+Math.round(e.clientX)),true);});
await log('before',()=>`a ${dd.fp.a.toFixed(2)} p ${dd.fp.p.toFixed(2)}`);
await touch('touchStart',[[W-300,150,5]]);await touch('touchMove',[[W-240,170,5]]);await touch('touchMove',[[W-200,180,5]]);
await log('one finger look',()=>`a ${dd.fp.a.toFixed(2)} p ${dd.fp.p.toFixed(2)} ev ${LG.join(' ')}`);await touch('touchEnd',[]);
await ev(()=>{LG.length=0;});
await touch('touchStart',[[120,H-120,1]]);await touch('touchMove',[[120,H-180,1]]);
await log('stick up',()=>`mv ${dd.fp.mv.x.toFixed(2)},${dd.fp.mv.y.toFixed(2)}`);
await touch('touchStart',[[120,H-180,1],[W-300,150,2]]);await touch('touchMove',[[120,H-180,1],[W-240,170,2]]);await touch('touchMove',[[120,H-180,1],[W-200,190,2]]);
await log('stick + look',()=>`a ${dd.fp.a.toFixed(2)} p ${dd.fp.p.toFixed(2)} mv ${dd.fp.mv.y.toFixed(2)} ev ${LG.join(' ')}`);
await touch('touchEnd',[]);
await log('released',()=>`mv ${dd.fp.mv.x},${dd.fp.mv.y} fire ${dd.fp.fire}`);
const fb=await page.locator('#fp .fp-fire').boundingBox();
await touch('touchStart',[[fb.x+fb.width/2,fb.y+fb.height/2,3]]);await log('fire held',()=>`fire ${dd.fp.fire}`);await touch('touchEnd',[]);await log('fire up',()=>`fire ${dd.fp.fire}`);
await page.tap('#fp [data-a="view"]');await log('view tap',()=>dd.fp.view);
await page.tap('#fp [data-a="next"]');await log('next tap',()=>dd.fp.u.name+' '+dd.fp.u.ddRole);
await page.tap('#fp [data-a="back"]');await log('back tap',()=>`fp ${dd.fp} sel ${sel.length}`);
await ev(()=>RUN(2.5));await shot('4command');
await log('down',()=>{fpEnter();const u=dd.fp.u;SAFE=false;u.hp=1;damage(u,40,null);RUN(.2);return `downed ${u.downed||u.dead} fp ${dd.fp} banner ${$('#banner').textContent}`;});
console.log('errors',errors.length,errors.slice(0,6));
await b.close();srv.close();})();
