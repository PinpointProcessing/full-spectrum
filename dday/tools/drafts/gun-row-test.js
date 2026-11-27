// Version 248 (Bryan: "Can you make the most powerful stationary weapon to the left and weakest to the right? ... Also, is there a cycle button so
// the player can switch stationary guns?"): Chapter 2's row of guns strongest first (the field gun, the heavy machine gun, the two nests), and
// NEXT GUN from behind a gun (the button, and Tab): on along the row to the next gun a squad mate is on, round again at the end, past a gun
// that's knocked out or held by one of the other troops; gone when no other gun is manned. The checkpoint's guns in Chapter 1 the same through
// the view's own Next button. Real clicks.   node gun-row-test.js [port] [OUTDIR for pictures]   (DDROOT, HARNESS as real-guns-test.js)
// (Version 255: NEXT GUN is on the gun screen itself, over the rounds left, and BACK is EXIT GUN at the top right; the row under the tiles and
// its LEAVE GUN are gone, ddfp.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9768,OUT=process.argv[3]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const start=async()=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4248);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message);}}}};
    window.DRAW=()=>{try{updateCamera();if(dd.fp)fpCam(1/30);render(1/30,simT);drawOverlay(1/30,simT);hud();if(dd.fp)fpHud();}catch(e){TKERR.push('draw: '+e.message+' @'+(e.stack||'').split('\n')[1]);}};});
  return{page,errors,ev};};
const row=ev=>ev(()=>{DRAW();const T=[...document.querySelectorAll('#dcBar .dcb-row:not(.two) .dcb-t')],r=document.querySelector('#dcBar .dcb-row:not(.two)');
  return{k:T.map(q=>q.dataset.k),n:T.map(q=>q.querySelector('i').textContent),x:T.map(q=>Math.round(q.getBoundingClientRect().left)),w:T.map(q=>Math.round(q.getBoundingClientRect().width)),cols:getComputedStyle(r).gridTemplateColumns.split(' ').length,
    two:[...document.querySelectorAll('#dcBar .dcb-row.two button')].map(q=>q.dataset.k+':'+q.textContent),hd:!!document.querySelector('#dcBar .dcb-hd'),on:dd.fp&&dd.fp.u.dcGun?dd.fp.u.dcGun.k:null,
    nx:(n=>n&&getComputedStyle(n).display!=='none'?(n.disabled?'off:':'')+n.textContent:null)(document.querySelector('#fp [data-a="gnext"]')),ex:(n=>!!n&&getComputedStyle(n).display!=='none')(document.querySelector('#fp [data-a="gexit"]'))};});
// ---- Chapter 2
{const {page,errors,ev}=await start();await page.click('#ddCtrBtn');await page.waitForTimeout(900);
  await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(12);for(const e of enemies)e.stunT=1e9;for(const K of dd.tanks)K.hold=true;});
  const a=await row(ev);console.log('  ',JSON.stringify(a));
  ok(a.k.join()==='a1,h1,n1,n2'&&a.n.join('|')==='FIELD GUN|HEAVY MG|MG NEST 1|MG NEST 2','the row: the field gun first, then the heavy machine gun, then the nests ('+a.n.join(', ')+')');
  ok(a.cols===4&&a.x[0]<a.x[1]&&a.x[1]<a.x[2]&&a.x[2]<a.x[3]&&a.w[0]>80,'four tiles across the screen, left to right, each '+a.w[0]+' px wide');ok(a.hd&&!a.two.length,'the arrow and "Man a Gun" over it, no buttons under it yet');
  if(OUT){await page.waitForTimeout(400);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:OUT+'/row-above.png'});}
  await page.click('#dcBar .dcb-t:first-child');const c=await row(ev);console.log('  ',JSON.stringify(c.two),c.nx,c.ex,c.on);
  ok(c.on==='a1','a real click on the first tile: behind the field gun');
  ok(!c.two.length&&/^Next gun ›heavy MG$/i.test(c.nx||'')&&c.ex,'nothing under the tiles; on the gun screen NEXT GUN (it names the heavy MG) and EXIT GUN');
  if(OUT){await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(400);await page.screenshot({path:OUT+'/row-behind.png'});}
  const seq=[];for(let i=0;i<4;i++){await page.click('#fp [data-a="gnext"]');seq.push((await row(ev)).on);}
  ok(seq.join()==='h1,n1,n2,a1','NEXT GUN four times: the heavy gun, nest 1, nest 2, and round to the field gun again ('+seq.join(' > ')+')');
  await page.keyboard.press('Tab');const t=await row(ev);ok(t.on==='h1','Tab does the same: on to the heavy gun');
  const m=await ev(()=>{const C=dd.dc,by=k=>C.guns.find(g=>g.k===k);return{a1:!!by('a1').man,stay:by('a1').man&&by('a1').man.dcGun===by('a1')};});ok(m.a1&&m.stay,'the man left behind stays on his gun');
  // a gun knocked out, a gun held by one of the other troops: passed over
  const s=await ev(()=>{const C=dd.dc,by=k=>C.guns.find(g=>g.k===k);dcTile('a1');dcGunHit(by('h1'),9999);by('n1').man.npc=true;const n=dcNextOf(dd.fp.u);const r1=n&&n.k;dcNextGun();const on=dd.fp.u.dcGun.k;by('n1').man.npc=false;return{r1,on};});
  ok(s.r1==='n2'&&s.on==='n2','the heavy gun knocked out and nest 1 held by one of the other troops: NEXT GUN goes to nest 2');
  const o=await ev(()=>{const C=dd.dc,by=k=>C.guns.find(g=>g.k===k);dcGunHit(by('n1'),9999);dcGunHit(by('a1'),9999);return{next:dcNextOf(dd.fp.u),on:dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.k};});const r2=await row(ev);
  ok(o.next===null&&/^off:/.test(r2.nx||'')&&r2.ex,'no other gun manned: NEXT GUN greyed ('+r2.nx+'), EXIT GUN still there');
  await page.keyboard.press('Tab');const tb=await ev(()=>({on:dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.k,msg:dd.fp&&dd.fp.msg&&dd.fp.msg.t}));ok(tb.on==='n2'&&/No other gun/.test(tb.msg||''),'Tab then says so and stays ('+tb.msg+')');
  await page.click('#fp [data-a="gexit"]');const bk=await ev(()=>({fp:!!dd.fp,man:!!dd.dc.guns.find(g=>g.k==='n2').man}));ok(!bk.fp&&bk.man,'EXIT GUN: out of the view, he stays on the gun');
  ok(errors.length===0&&(await ev(()=>TKERR.length))===0,'Chapter 2: no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));await page.close();}
// ---- Chapter 1: two of the checkpoint's guns held by the squads' men
{const {page,errors,ev}=await start();await page.click('#ddBtn');await page.waitForTimeout(700);
  const r=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(!dd.land.done&&n++<4000)update(1/30);RUN(1);for(const e of enemies)e.stunT=1e9;
    const S=dd.post;if(!S||S.guns.length<2)return{none:true};const A=players.filter(p=>alive(p)).slice(0,2),G=S.guns.slice(0,2);
    A.forEach((u,i)=>{const g=G[i];u.path=[];u.x=g.x;u.y=g.y;u.ang=g.up;u.postGun=g;g.man=u;g.going=null;u.onGun={x:g.gx,y:g.gy,ang:g.up,arc:g.arc};u.gunner=true;});
    ddPostControl(G[0]);if(!dd.fp)return{fp:false};fpHud();const lab=document.querySelector('#fp [data-a="next"]').textContent,u0=dd.fp.u.name;
    fpNext();fpHud();const u1=dd.fp.u.name,g1=dd.fp.u.postGun===G[1],bk=document.querySelector('#fp [data-a="back"]').textContent;fpNext();const u2=dd.fp.u.name;
    // only one held: Next is the next man again
    ddPostOff(G[1],G[1].man);fpHud();const lab1=document.querySelector('#fp [data-a="next"]').textContent;fpNext();const u3=dd.fp.u,onGun=!!u3.postGun;
    return{lab,u0,u1,g1,u2,bk,lab1,u3:u3.name,onGun,err:TKERR.slice(0,2)};});
  console.log('  ',JSON.stringify(r));
  ok(!r.none&&r.lab==='Next gun ▶','Chapter 1, behind one of the checkpoint\'s guns with a squad mate on another: the view\'s button reads Next gun');
  ok(r.g1&&r.u1!==r.u0&&r.u2===r.u0&&/EXIT/.test(r.bk),'it goes to the other gun and round again ('+r.u0+' > '+r.u1+' > '+r.u2+')');
  ok(r.lab1==='Next man ▶'&&r.u3!==r.u0&&!r.onGun,'with nobody on another gun it is Next man again, as before');
  ok(errors.length===0&&r.err.length===0,'Chapter 1: no errors '+errors.slice(0,2)+r.err);await page.close();}
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();
