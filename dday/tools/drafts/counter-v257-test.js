// Version 257, Bryan with a screenshot of Version 256 on his phone: "Can we fit the prev and next to the left bottom across from Aim and Fire?"
// PREV and NEXT share the bottom left, their bottom edges on AIM's and FIRE's (AIM and FIRE a little narrower to make the room). Checked on a phone
// with a home bar (the page's bottom padded, as the published page is), a narrower phone, a phone on its side and a desktop, with the row of
// four guns and with the six of it once their checkpoint is ours (two rows of tiles, as in his screenshot).
// node counter-v257-test.js [port] [OUTDIR for pictures]   (DDROOT, HARNESS as counter-v254-test.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9793,OUT=process.argv[3]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const start=async(seed,w,h,pad)=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:w,height:h});const ev=(f,a)=>page.evaluate(f,a);
  if(pad)await page.addStyleTag({content:`html{padding-bottom:${pad}px}`});   // (the home bar: the published page is padded by it at the bottom)
  await ev(seed=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(seed);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message+' @'+(e.stack||'').split('\n')[1]);}}}};
    window.DRAW=()=>{try{updateCamera();if(dd.fp)fpCam(1/30);render(1/30,simT);drawOverlay(1/30,simT);hud();if(dd.fp)fpHud();}catch(e){TKERR.push('draw: '+e.message+' @'+(e.stack||'').split('\n')[1]);}};},seed);
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);return{page,errors,ev};};
const errs=async(ev,errors,what)=>ok(errors.length===0&&(await ev(()=>TKERR.length))===0,what+': no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));
const settle=async(page,ev)=>{await ev(()=>{RUN(.1);DRAW();});await page.waitForTimeout(650);await ev(()=>DRAW());};   // (the row's height is measured again twice a second, in real time)
const look=ev=>ev(()=>{const r=q=>{const n=document.querySelector(q);if(!n)return null;const b=n.getBoundingClientRect(),cs=getComputedStyle(n);return{x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height),r:Math.round(b.right),b:Math.round(b.bottom),vis:cs.display!=='none'&&cs.visibility!=='hidden'&&b.width>0&&b.height>0};};
  // what a finger finds at the middle and along the bottom edge of each button: the button itself, or something over it
  const hit=q=>{const n=document.querySelector(q);if(!n)return false;const b=n.getBoundingClientRect();return[[.5,.5],[.15,.9],[.85,.9],[.5,.95]].every(([fx,fy])=>{const t=document.elementFromPoint(b.x+b.width*fx,b.y+b.height*fy);return !!t&&(t===n||n.contains(t));});};
  const fits=q=>{const n=document.querySelector(q);return !!n&&n.scrollWidth<=n.clientWidth+1;};
  return{on:dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.k,prev:r('#fp [data-a="gprev"]'),next:r('#fp [data-a="gnext"]'),aim:r('#fp [data-a="aim"]'),fire:r('#fp [data-a="fire"]'),ammo:r('#fp .fp-ammo'),bar:r('#dcBar'),keys:r('#fp .fp-keys'),
    hit:{prev:hit('#fp [data-a="gprev"]'),next:hit('#fp [data-a="gnext"]'),aim:hit('#fp [data-a="aim"]'),fire:hit('#fp [data-a="fire"]')},fit:{prev:fits('#fp [data-a="gprev"]'),next:fits('#fp [data-a="gnext"]')},
    tiles:document.querySelectorAll('#dcBar .dcb-t').length,txt:[...document.querySelectorAll('#fp .fp-gnav button')].map(q=>q.textContent),W:innerWidth};});
const across=(L,tag)=>{
  ok(L.on&&L.prev.vis&&L.next.vis&&L.prev.x<=20&&L.prev.r<=L.next.x+1&&Math.abs(L.prev.b-L.aim.b)<=2&&Math.abs(L.next.b-L.aim.b)<=2&&Math.abs(L.aim.b-L.fire.b)<=2,`${tag}: PREV and NEXT at the bottom left (${L.prev.x}..${L.next.r}), across from AIM and FIRE (bottoms ${L.prev.b}, ${L.next.b} / ${L.aim.b}, ${L.fire.b}): "${L.txt.join('" "')}"`);
  ok(L.next.r+6<=L.aim.x&&L.next.r+6<=L.fire.x&&L.ammo.x>=L.next.r,`${tag}: a gap between NEXT and AIM (${L.aim.x-L.next.r} px), the rounds left over AIM and FIRE`);
  ok([L.prev,L.next,L.aim,L.fire].every(q=>q.b<=L.bar.y+1)&&L.hit.prev&&L.hit.next&&L.hit.aim&&L.hit.fire,`${tag}: all four above the row of guns (row at ${L.bar.y}, ${L.tiles} guns), nothing over them where a finger goes`);
  ok(L.fit.prev&&L.fit.next&&L.prev.w>=60&&L.next.w>=60&&L.aim.w>=60&&L.fire.w>=100&&L.fire.h>=50,`${tag}: their words fit (PREV ${L.prev.w}, NEXT ${L.next.w}, AIM ${L.aim.w}, FIRE ${L.fire.w} by ${L.fire.h} wide)`);
  ok(!L.keys.vis||[L.prev,L.next,L.aim,L.fire,L.ammo].every(q=>L.keys.r<=q.x||L.keys.b<=q.y||L.keys.y>=q.b),`${tag}: the keys line (a desktop's) clear of them (${L.keys.vis?'shown':'not shown'})`);};
for(const[W,H,PAD]of[[390,740,34],[360,700,34],[844,390,21],[1280,720,0]]){const {page,errors,ev}=await start(257,W,H,PAD);const tag=`${W}x${H}${PAD?`, a ${PAD} px home bar`:''}`;
  await ev(()=>{const d0=damage;window.damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(7);for(const e of enemies)e.stunT=1e9;for(const g of dd.dc.guns)if(g.going&&!g.man)dcSit(g,g.going);RUN(.4);DRAW();});
  await page.click('#dcBar [data-k="h1"]');await settle(page,ev);across(await look(ev),tag);
  // real clicks: PREV, NEXT, AIM and FIRE near their bottom edges
  const p0=await ev(()=>{const p=dcPrevOf(dd.fp.u);return p&&p.k;});
  const at=async(q,fy)=>{const r=await page.locator(q).boundingBox();await page.mouse.click(r.x+r.width/2,r.y+r.height*fy);await ev(()=>{RUN(.1);DRAW();});};
  await at('#fp [data-a="gprev"]',.9);const c1=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);await at('#fp [data-a="gnext"]',.9);const c2=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
  const aim0=await ev(()=>!!dd.fp.aim);await at('#fp [data-a="aim"]',.9);const aim1=await ev(()=>!!dd.fp.aim);await at('#fp [data-a="aim"]',.5);
  const fb=await page.locator('#fp [data-a="fire"]').boundingBox();await page.mouse.move(fb.x+fb.width/2,fb.y+fb.height*.9);await page.mouse.down();const fire=await ev(()=>!!dd.fp.fire);await page.mouse.up();
  ok(c1===p0&&c2==='h1'&&!aim0&&aim1&&fire,`${tag}: clicks near their bottom edges: PREV to ${c1}, NEXT back to ${c2}, AIM on, FIRE held fires`);
  if(OUT){await ev(()=>DRAW());await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/gun-${W}x${H}-${PAD}.png`});}
  // their checkpoint ours: six guns, two rows of tiles
  if(W<800){await ev(()=>{dcCpTaken();RUN(.3);DRAW();});await settle(page,ev);const L6=await look(ev);across(L6,`${tag}, six guns`);
    if(OUT){await page.waitForTimeout(300);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/gun6-${W}x${H}-${PAD}.png`});}}
  await errs(ev,errors,`the gun screen at ${tag}`);await page.close();}
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();
