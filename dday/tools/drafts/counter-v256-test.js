// Version 256, after Bryan's screenshot of Version 255 on his phone: PREV to the left of NEXT GUN; the gun screen's buttons above the row of guns
// on a phone with a home bar (there AIM and FIRE were under the row: the published page is padded at the bottom for the home bar, so the row sits
// that much higher, while the gun screen covers the whole screen); the field gun loaded when you get behind it after its crew fired it; wave 1
// with two tanks.   node counter-v256-test.js [port] [OUTDIR for pictures]   (DDROOT, HARNESS as counter-v254-test.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9791,OUT=process.argv[3]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
// pad: the bottom padding the published page gets on a phone with a home bar (its frame pads the page by the safe area)
const start=async(seed,w,h,pad)=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:w,height:h});const ev=(f,a)=>page.evaluate(f,a);
  if(pad)await page.addStyleTag({content:`html{padding-bottom:${pad}px}`});
  await ev(seed=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(seed);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message+' @'+(e.stack||'').split('\n')[1]);}}}};
    window.DRAW=()=>{try{updateCamera();if(dd.fp)fpCam(1/30);render(1/30,simT);drawOverlay(1/30,simT);hud();if(dd.fp)fpHud();}catch(e){TKERR.push('draw: '+e.message+' @'+(e.stack||'').split('\n')[1]);}};
    window.EV=[];const bn=banner;window.banner=(t,ms)=>{if(t)EV.push(['banner',t,+simT.toFixed(1)]);return bn(t,ms);};},seed);
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);return{page,errors,ev};};
const errs=async(ev,errors,what)=>ok(errors.length===0&&(await ev(()=>TKERR.length))===0,what+': no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));
const settle=async(page,ev)=>{await ev(()=>{RUN(.1);DRAW();});await page.waitForTimeout(650);await ev(()=>DRAW());};   // (the row's height is measured again twice a second, in real time)
// ---- 1. the gun screen: a phone upright and on its side, with and without the home bar's padding
for(const[W,H,PAD]of[[390,740,34],[844,390,21],[390,760,0]]){const {page,errors,ev}=await start(256,W,H,PAD);
  await ev(()=>{const d0=damage;window.damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(7);for(const e of enemies)e.stunT=1e9;for(const g of dd.dc.guns)if(g.going&&!g.man)dcSit(g,g.going);RUN(.4);DRAW();});
  await page.click('#dcBar [data-k="h1"]');await settle(page,ev);
  const L=await ev(()=>{const r=q=>{const n=document.querySelector(q);if(!n)return null;const b=n.getBoundingClientRect(),cs=getComputedStyle(n);return{x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height),vis:cs.display!=='none'&&cs.visibility!=='hidden'&&b.width>0&&b.height>0};};
    // what a finger finds at a few points of each button, the bottom edge too: the button itself, or the row over it
    const hit=q=>{const n=document.querySelector(q);if(!n)return false;const b=n.getBoundingClientRect();return[[.5,.5],[.2,.9],[.8,.9],[.5,.95]].every(([fx,fy])=>{const t=document.elementFromPoint(b.x+b.width*fx,b.y+b.height*fy);return !!t&&(t===n||n.contains(t));});};
    return{on:dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.k,prev:r('#fp [data-a="gprev"]'),next:r('#fp [data-a="gnext"]'),ammo:r('#fp .fp-ammo'),aim:r('#fp [data-a="aim"]'),fire:r('#fp [data-a="fire"]'),bar:r('#dcBar'),exit:r('#fp [data-a="gexit"]'),keys:r('#fp .fp-keys'),
      hit:{prev:hit('#fp [data-a="gprev"]'),next:hit('#fp [data-a="gnext"]'),aim:hit('#fp [data-a="aim"]'),fire:hit('#fp [data-a="fire"]')},dcbh:getComputedStyle(document.body).getPropertyValue('--dcbh').trim(),fpB:Math.round(document.getElementById('fp').getBoundingClientRect().bottom),
      prevTxt:document.querySelector('#fp [data-a="gprev"]').textContent,nextTxt:document.querySelector('#fp [data-a="gnext"]').textContent};});
  console.log('  ',W,H,PAD,JSON.stringify({prev:L.prev,next:L.next,ammo:L.ammo,aim:L.aim,fire:L.fire,bar:L.bar,hit:L.hit,dcbh:L.dcbh,fpB:L.fpB}));
  const tag=`${W}x${H}${PAD?`, a ${PAD} px home bar`:''}`;
  ok(L.on==='h1'&&L.prev.vis&&L.next.vis&&Math.abs(L.prev.y-L.next.y)<=3&&Math.abs(L.prev.h-L.next.h)<=3&&L.prev.x+L.prev.w<=L.next.x+1&&L.next.x-(L.prev.x+L.prev.w)<=14,`${tag}: PREV ("${L.prevTxt}") on the left of NEXT GUN ("${L.nextTxt}"), one row`);
  ok(L.next.y+L.next.h<=L.ammo.y+2&&L.prev.y+L.prev.h<=L.ammo.y+2,`${tag}: both over the rounds left`);
  ok([L.prev,L.next,L.aim,L.fire].every(q=>q.vis&&q.y+q.h<=L.bar.y+1)&&L.hit.prev&&L.hit.next&&L.hit.aim&&L.hit.fire,`${tag}: PREV, NEXT GUN, AIM and FIRE all above the row of guns (row at ${L.bar.y}, FIRE down to ${L.fire.y+L.fire.h}), nothing of the row over them`);
  ok(Math.abs(parseInt(L.dcbh)-(L.fpB-L.bar.y))<=2,`${tag}: the buttons' room measured from the screen's bottom to the row's top (${L.dcbh} for ${L.fpB-L.bar.y})`);
  ok(!L.keys.vis||[L.prev,L.next,L.aim,L.fire].every(q=>L.keys.x+L.keys.w<=q.x||L.keys.y+L.keys.h<=q.y||L.keys.y>=q.y+q.h),`${tag}: the keys line (a desktop's) clear of the buttons (${L.keys.vis?'shown':'not shown'})`);
  if(OUT){await ev(()=>DRAW());await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/gun-${W}x${H}-${PAD}.png`});}
  // real clicks on PREV and AIM
  const p0=await ev(()=>{const p=dcPrevOf(dd.fp.u);return p&&p.k;});
  await page.click('#fp [data-a="gprev"]');await ev(()=>{RUN(.1);DRAW();});const p1=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
  await page.click('#fp [data-a="gnext"]');await ev(()=>{RUN(.1);DRAW();});const p2=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
  const a=await page.locator('#fp [data-a="aim"]').boundingBox();const aim0=await ev(()=>!!dd.fp.aim);await page.mouse.click(a.x+a.width/2,a.y+a.height*.88);await ev(()=>RUN(.1));const aimOn=await ev(()=>!!dd.fp.aim);
  ok(p1===p0&&p2==='h1'&&!aim0&&aimOn,`${tag}: clicks: PREV to ${p1} (${p0} expected), NEXT GUN back to ${p2}, AIM clicked near its bottom edge takes (${aimOn})`);
  await errs(ev,errors,`the gun screen at ${tag}`);await page.close();}
// ---- 2. the field gun loaded when you get behind it, and wave 1's two tanks
{const {page,errors,ev}=await start(1256,390,760,0);
  const w=await ev(()=>{const d0=damage;window.damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);const C=dd.dc;let i=0;while(C.ph!=='w1'&&i++<900)RUN(.1);const t0=simT;
    const T=dd.tanks.filter(K=>K.w===1),gap=T.length===2&&T[1].relT!=null?Math.round(T[1].relT-t0):null;RUN(8.2);   // (relT is cleared as a tank is let loose: the first one is at once)
    return{ph:C.ph,n:T.length,rel:T.filter(K=>!K.hold).length,gap,ban:EV.filter(q=>q[0]==='banner'&&/Here they come/.test(q[1])).map(q=>q[1])};});
  console.log('  ',JSON.stringify(w));
  ok(w.ph==='w1'&&w.n===2&&w.rel===2&&w.gap===7&&w.ban.length===1&&/2 tanks/.test(w.ban[0]),`wave 1 starts with two tanks, let loose ${w.gap} s apart: "${w.ban[0]}"`);
  // the crew fires it by itself; then you get behind it: loaded
  const c=await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.k==='a1');for(const e of enemies)e.stunT=1e9;if(!g.man||g.man.npc)dcSit(g,g.going&&!g.going.npc?g.going:players.find(p=>alive(p)&&!p.dcGun));RUN(.2);const m=g.man;
    const K=dd.tanks.find(Q=>Q.w===1&&Q.hp>0);dcFire(g,K?K.x:g.x,K?K.y:g.y-600);DRAW();return{crew:!!m&&!m.fp,left:+(g.fireT-simT).toFixed(1),fpShot:!!g.fpShot};});
  await page.click('#dcBar [data-k="a1"]');await ev(()=>{RUN(.2);DRAW();});
  const f=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='a1');return{on:dd.fp&&dd.fp.u.dcGun===g,ready:simT>=g.fireT,txt:document.querySelector('#fp .fp-ammo b').textContent,tile:[...document.querySelectorAll('#dcBar .dcb-t')].find(q=>q.dataset.k==='a1').querySelector('span').textContent};});
  console.log('  ',JSON.stringify(c),JSON.stringify(f));
  ok(c.crew&&c.left>5&&!c.fpShot&&f.on&&f.ready&&/READY/.test(f.txt)&&/LOADED|ON TARGET/.test(f.tile),`its crew fired the field gun (${c.left} s of reload left); a click on its tile and you're behind it, loaded: "${f.txt}", the tile "${f.tile}"`);
  // FIRE from behind it: a shell, then its reload; off it and straight back: still loading
  const fb=await page.locator('#fp [data-a="fire"]').boundingBox();await page.mouse.move(fb.x+fb.width/2,fb.y+fb.height/2);await page.mouse.down();await ev(()=>RUN(.2));await page.mouse.up();
  const s=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='a1');return{left:+(g.fireT-simT).toFixed(1),fpShot:!!g.fpShot};});
  await page.click('#fp [data-a="gnext"]');await ev(()=>{RUN(.2);DRAW();});const away=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
  await page.click('#dcBar [data-k="a1"]');await ev(()=>{RUN(.2);DRAW();});
  const back=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='a1');return{on:dd.fp&&dd.fp.u.dcGun===g,left:+(g.fireT-simT).toFixed(1),txt:document.querySelector('#fp .fp-ammo b').textContent};});
  console.log('  ',JSON.stringify(s),away,JSON.stringify(back));
  ok(s.left>6&&s.fpShot&&away&&away!=='a1'&&back.on&&back.left>5&&/LOADING/.test(back.txt),`you fire it (${s.left} s to load), go to ${away} and straight back: still "${back.txt}"`);
  await errs(ev,errors,'the field gun and wave 1');await page.close();}
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();
