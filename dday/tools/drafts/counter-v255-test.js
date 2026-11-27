// Version 255, Chapter 2 after Bryan's notes on Version 254: the gun screen (EXIT GUN at the top right, PREV on the left, NEXT GUN over the
// rounds left, the row of guns with who is on them along the bottom; the rest hidden), the waves' tanks (1, 1, 2, 2, 2, 3, 3) and helicopters
// (one in wave 5, two in wave 7), their smoke, the other troops' bazooka men and the 10 s rest. Real clicks and keys on the gun screen at
// 390 by 760 and 844 by 390.   node counter-v255-test.js [port] [OUTDIR for pictures]   (DDROOT, HARNESS as counter-v254-test.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const PORT=+process.argv[2]||9781,OUT=process.argv[3]||null;if(OUT)fs.mkdirSync(OUT,{recursive:true});
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const start=async(seed,w=390,h=760)=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:w,height:h});const ev=(f,a)=>page.evaluate(f,a);
  await ev(seed=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(seed);localStorage.removeItem('warehouseYard.ddmeta.v1');window.TKERR=[];
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){try{update(1/30);}catch(e){TKERR.push('update: '+e.message+' @'+(e.stack||'').split('\n')[1]);}if(i%3==0){try{panTick(.1);ddFrame(.1,simT);}catch(e){TKERR.push('frame: '+e.message+' @'+(e.stack||'').split('\n')[1]);}}}};
    window.DRAW=()=>{try{updateCamera();if(dd.fp)fpCam(1/30);render(1/30,simT);drawOverlay(1/30,simT);hud();if(dd.fp)fpHud();}catch(e){TKERR.push('draw: '+e.message+' @'+(e.stack||'').split('\n')[1]);}};
    window.EV=[];const bt=bigText;window.bigText=(t,c)=>{if(t)EV.push(['big',t,+simT.toFixed(1)]);return bt(t,c);};const bn=banner;window.banner=(t,ms)=>{if(t)EV.push(['banner',t,+simT.toFixed(1)]);return bn(t,ms);};},seed);
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);return{page,errors,ev};};
const errs=async(ev,errors,what)=>ok(errors.length===0&&(await ev(()=>TKERR.length))===0,what+': no errors '+errors.slice(0,2)+(await ev(()=>TKERR.slice(0,2))));
// ---- 1. the gun screen, a phone upright and on its side
for(const[W,H]of[[390,760],[844,390]]){const {page,errors,ev}=await start(255,W,H);
  await ev(()=>{const d0=damage;window.damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(7);for(const e of enemies)e.stunT=1e9;for(const g of dd.dc.guns)if(g.going&&!g.man)dcSit(g,g.going);RUN(.4);DRAW();});
  await page.click('#dcBar [data-k="n1"]');await ev(()=>{RUN(.2);DRAW();});
  const L=await ev(()=>{const r=q=>{const n=document.querySelector(q);if(!n)return null;const b=n.getBoundingClientRect(),cs=getComputedStyle(n);return{x:Math.round(b.x),y:Math.round(b.y),w:Math.round(b.width),h:Math.round(b.height),vis:cs.display!=='none'&&cs.visibility!=='hidden'&&b.width>0&&b.height>0};};
    return{on:dd.fp&&dd.fp.u.dcGun&&dd.fp.u.dcGun.k,W:innerWidth,H:innerHeight,exit:r('#fp [data-a="gexit"]'),prev:r('#fp [data-a="gprev"]'),next:r('#fp [data-a="gnext"]'),ammo:r('#fp .fp-ammo'),fire:r('#fp [data-a="fire"]'),aim:r('#fp [data-a="aim"]'),
      bar:r('#dcBar'),top:r('#fp .fp-top'),reload:r('#fp [data-a="reload"]'),nade:r('#fp [data-a="nade"]'),spec:r('#fp [data-a="spec"]'),stick:r('#fp .fp-stick'),pause:r('#pauseBtn'),pill:r('#ddObj'),two:!!document.querySelector('#dcBar .dcb-row.two'),
      names:[...document.querySelectorAll('#dcBar .dcb-t b')].map(q=>q.textContent),nextTxt:document.querySelector('#fp [data-a="gnext"]').textContent,prevTxt:document.querySelector('#fp [data-a="gprev"]').textContent};});
  console.log('  ',W,JSON.stringify({exit:L.exit,prev:L.prev,next:L.next,ammo:L.ammo,fire:L.fire,bar:L.bar,pill:L.pill,names:L.names,next:L.nextTxt,prev:L.prevTxt}));
  ok(L.on==='n1'&&L.exit.vis&&L.exit.x+L.exit.w>W-30&&L.exit.y<140&&L.exit.y>=L.pause.y+L.pause.h-2,`${W}: one click on MG NEST 1's tile and you're behind it; EXIT GUN at the top right, under PAUSE (${L.exit.x},${L.exit.y})`);
  ok(L.prev.vis&&Math.abs(L.prev.y-L.next.y)<=3&&L.prev.x+L.prev.w<=L.next.x+1,`${W}: PREV left of NEXT GUN, one row (Version 256; on the left halfway down in Version 255) (${L.prev.x},${L.prev.y}): "${L.prevTxt}"`);
  ok(L.next.vis&&L.next.y+L.next.h<=L.ammo.y+2&&L.next.x+L.next.w>W*.6&&/NEXT GUN/i.test(L.nextTxt),`${W}: NEXT GUN over the rounds left, on the right (${L.next.x},${L.next.y}): "${L.nextTxt}"`);
  ok(L.bar.vis&&L.bar.y+L.bar.h>=H-2&&L.bar.y>H*.55&&!L.two&&L.names.includes('YOU')&&L.names.filter(n=>n&&n!=='YOU'&&n!=='empty').length>=2&&L.fire.y+L.fire.h<=L.bar.y+1,`${W}: the row of guns along the bottom, who is on each (${L.names.join(', ')}), no BACK / LEAVE row under it, FIRE over it`);
  ok(!L.top.vis&&!L.reload.vis&&!L.nade.vis&&!L.spec.vis&&!L.stick.vis&&L.aim.vis&&L.fire.vis,`${W}: no name and health panel, Command, reload, grenade, item or stick on the gun; AIM and FIRE`);
  ok(!(L.pill&&L.pill.vis)||L.pill.y>=L.exit.y+L.exit.h-4||L.pill.x+L.pill.w<=L.exit.x,`${W}: the objective pill clear of EXIT GUN`);
  if(OUT){await ev(()=>DRAW());await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/gun-${W}.png`});}
  // real clicks: NEXT GUN, PREV, a tile, EXIT GUN
  const exp=await ev(()=>{const u=dd.fp.u,n=dcNextOf(u);return n&&n.k;});
  await page.click('#fp [data-a="gnext"]');await ev(()=>{RUN(.1);DRAW();});const a1=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
  await page.click('#fp [data-a="gprev"]');await ev(()=>{RUN(.1);DRAW();});const a2=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
  await page.click('#dcBar [data-k="a1"]');await ev(()=>{RUN(.1);DRAW();});const a3=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
  const u3=await ev(()=>{window.U3=dd.fp.u;return U3.name;});
  await page.click('#fp [data-a="gexit"]');await ev(()=>{RUN(1);DRAW();});const a4=await ev(()=>{const g=dd.dc.guns.find(q=>q.k==='a1');return{fp:!!dd.fp,man:g.man===U3,walking:U3.path.length>0};});
  console.log('  ',exp,a1,a2,a3,JSON.stringify(a4));
  ok(a1===exp&&a2==='n1'&&a3==='a1',`${W}: clicks: NEXT GUN to ${a1}, PREV back to ${a2}, the field gun's tile to ${a3}`);
  ok(!a4.fp&&a4.man&&!a4.walking,`${W}: EXIT GUN: out of the gun's view, ${u3} still on the field gun`);
  // keys: Tab, Shift+Tab, Escape
  if(W>800){await page.click('#dcBar [data-k="h1"]');await ev(()=>{RUN(.1);DRAW();});const e0=await ev(()=>{const n=dcNextOf(dd.fp.u),p=dcPrevOf(dd.fp.u);return{n:n&&n.k,p:p&&p.k};});
    await page.keyboard.press('Tab');const k1=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);await page.keyboard.down('Shift');await page.keyboard.press('Tab');await page.keyboard.up('Shift');const k2=await ev(()=>dd.fp&&dd.fp.u.dcGun.k);
    await page.keyboard.press('Escape');const k3=await ev(()=>({fp:!!dd.fp,man:!!dd.dc.guns.find(q=>q.k==='h1').man}));
    ok(k1===e0.n&&k2==='h1'&&!k3.fp&&k3.man,`keys: Tab to ${k1}, Shift+Tab back to ${k2}, Escape out with the heavy MG still manned`);}
  await errs(ev,errors,`the gun screen at ${W}`);await page.close();}
// ---- 2. the waves' tanks, the rest, the bazooka men, their smoke
{const {page,errors,ev}=await start(1255);
  const w=await ev(()=>({lull:DCA.lull,bz:dd.npcs.filter(u=>u.spec==='rpg'&&u.specN===DCA.bz.n).length,fig:dd.npcs.filter(u=>u.spec==='rpg').every(u=>!!u.m)}));
  ok(w.lull===10&&w.bz===2&&w.fig,`the rest between waves 10 s; two of the other troops are bazooka men (${w.bz}), three rockets each`);
  await ev(()=>{const d0=damage;window.damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);window.SM=[];window.RK=[];const seen=new Set();
    window.WATCH5=()=>{for(const n of nades)if(n.smoke&&n.by&&n.by.side==='E'&&!seen.has(n)){seen.add(n);const g=dd.dc.guns.filter(q=>!q.dead&&q.man).reduce((b,q)=>!b||hyp(q.x-n.x0,q.y-n.y0)<hyp(b.x-n.x0,b.y-n.y0)?q:b,null);SM.push({from:Math.round(hyp(g.x-n.x0,g.y-n.y0)),to:Math.round(hyp(g.x-n.x1,g.y-n.y1)),t:+simT.toFixed(1)});}
      for(const r of rockets)if(r.by&&r.by.npc&&!seen.has(r)){seen.add(r);RK.push({t:+simT.toFixed(1),w:dd.dc.wave});}};
    window.RUNW=s=>{for(let i=0;i<s*2;i++){RUN(.5);WATCH5();}};});   // (WATCH5, not WATCH: orders.js has a WATCH)
  const t1=await ev(()=>{RUNW(17);const K=dd.tanks.filter(K=>K.w===1);return{ph:dd.dc.ph,n:K.length,free:K.filter(K=>!K.hold).length};});
  ok(t1.ph==='w1'&&t1.n===2&&t1.free>=1,`wave 1 comes with two tanks (${t1.n}; one in Version 255), the first let loose with it (${t1.free}; the second 7 s later, counter-v256-test.js)`);
  const s1=await ev(()=>{RUNW(70);return{smk:dd.dc.smkN||0,SM:SM.slice(0,4),RK:RK.slice(0,3),clouds:smokes.length};});
  console.log('  ',JSON.stringify(s1));
  ok(s1.smk>=1&&s1.SM.length>=1&&s1.SM.every(q=>q.to<q.from),`their men throw smoke (${s1.smk} in wave 1), each toward our nearest manned gun (from ${s1.SM.map(q=>q.from+' to '+q.to).join(', ')})`);
  const bzk=await ev(()=>{const u=dd.npcs.find(q=>q.spec==='rpg'&&alive(q)&&!q.dcGun);u.specN=3;u.bzT=0;u.path=[];u.x=400;u.y=370;u.sup=0;for(const q of[...players,...dd.npcs])if(q!==u&&alive(q)&&hyp(q.x-400,q.y+20)<90){q.x=560;q.y=520;}
    const K=ddTankSpawn({x:400,y:-20,ang:Math.PI/2,way:[],name:'Tank',range:1});K.w=9;const old=new Set(rockets.filter(r=>r.by===u));let fired=null,left=null;for(let i=0;i<6*30&&!fired;i++){update(1/30);if(rockets.some(r=>r.by===u&&!old.has(r))){fired=+simT.toFixed(1);left=u.specN;}}   // (a new rocket of his, not one still flying at wave 1's tanks; left as he fires: wave 1 can end meanwhile and his rockets be made up)
    const r={fired,left,wave1:RK.length};K.hp=0;return r;});
  console.log('  ',JSON.stringify(bzk));
  ok(bzk.fired&&bzk.left===2,`a bazooka man of the other troops fires at a tank 40 m off by himself (${bzk.left} rockets left; ${bzk.wave1} at wave 1's tank, which the field gun usually has first)`);
  const tp=await ev(()=>{const B=dd.npcs.filter(u=>u.spec==='rpg'&&alive(u));B[0].hp=0;B[0].dead=true;for(const u of B)u.specN=0;dcNpcTopUp();return{bz:dd.npcs.filter(u=>u.spec==='rpg'&&alive(u)).map(u=>u.specN)};});
  ok(tp.bz.length===2&&tp.bz.every(n=>n===3),`between waves: a bazooka man lost is made up from the others, rockets made up (${tp.bz.join(', ')})`);
  // the last of a wave hiding out of reach: 25 s and he falls back into the woods, and the wave is over
  const sg=await ev(()=>{const C=dd.dc;let k=0;while(!/^w/.test(C.ph)&&k++<80)RUN(.5);RUN(3);for(const K of dd.tanks)K.hp=0;C.more=1;const L=enemies.filter(e=>/^w/.test(e.tag)&&!beaten(e)&&e.tag==='w'+C.wave);
    if(!L.length)return{skip:C.ph};for(const e of L.slice(1)){e.dead=true;e.hp=0;}const e=L[0];e.x=300;e.y=-660;e.path=[];e.stunT=1e9;e.advT=1e9;const ph0=C.ph;
    RUN(20);const mid=C.ph;RUN(8);return{ph0,mid,ph:C.ph,gone:e.dead,ban:EV.filter(q=>q[0]==='banner'&&/fall/.test(q[1])).map(q=>q[1])};});
  console.log('  ',JSON.stringify(sg));
  ok(sg.skip||sg.ph0===sg.mid&&sg.ph!==sg.ph0&&sg.gone&&sg.ban.length===1,`the last man of the wave out of reach: still the wave 20 s on (${sg.mid}), then he falls back and the wave is over (${sg.ph}): "${sg.ban&&sg.ban[0]}"`);
  await errs(ev,errors,'the waves');await page.close();}
// ---- 3. the helicopter
{const {page,errors,ev}=await start(7,900,640);
  await ev(()=>{const d0=damage;window.HURT=[];window.damage=(t,d,s)=>{if(t.side==='P'){if(s&&s.air)HURT.push(d);return;}return d0(t,d,s);};});
  const h0=await ev(()=>{const C=dd.dc;RUN(17);for(const e of enemies)if(!e.dead){e.dead=true;e.gone=true;}for(const K of dd.tanks)K.hp=0;C.wave=4;C.ph='lull';C.t=99;RUN(.2);
    for(const e of enemies)if(e.tag==='w5'){e.stunT=1e9;e.cool=1e9;}for(const K of dd.tanks)if(K.w===5)K.hp=0;
    const H=C.helis&&C.helis[0],st0=H&&H.st;RUN(DCA.heli.first+.5);return{n:C.helis.length,st0,st:H.st,e:!!H.e&&enemies.includes(H.e),big:EV.filter(q=>q[0]==='big').map(q=>q[1]).slice(-3),tk:dd.tanks.filter(K=>K.w===5).length};});
  console.log('  ',JSON.stringify(h0));
  ok(h0.n===1&&h0.st0==='wait'&&h0.st==='in'&&h0.e&&h0.big.includes('Helicopter!')&&h0.tk===2,`wave 5: two tanks and a helicopter, in over the trees ${'12'} s after the wave starts, its door gunner one of their men, "Helicopter!"`);
  const h1=await ev(()=>{const C=dd.dc,H=C.helis[0];let i=0;while(H.st==='in'&&i++<600)RUN(.1);RUN(1);DRAW();const O=ddObjective();const v=new THREE.Vector3(H.x,ddH(H.x,H.y)+H.alt,H.y).project(camera);
    return{st:H.st,alt:Math.round(H.alt),obj:O&&O.t,ndc:+v.y.toFixed(2),mesh:!!H.g&&H.g.visible,fig:H.e.m?H.e.m.g.visible:null};});
  console.log('  ',JSON.stringify(h1));
  ok(h1.st==='orbit'&&h1.alt<60&&h1.obj==='Helicopter! Machine guns on it'&&h1.mesh&&h1.fig===false,`it comes down low over the field (${h1.alt}) and circles; "${h1.obj}"; drawn as a helicopter, its gunner part of it`);
  // lines to and from the air: over the hedgerow, past cover; a blast on the ground doesn't reach it; what hurts it, by what fires
  const l=await ev(()=>{const C=dd.dc,H=C.helis[0],e=H.e,m=players.find(p=>alive(p)&&!p.dcGun),x0=H.x,y0=H.y,mx=m.x,my=m.y;m.x=380;m.y=40;m.path=[];H.x=380;H.y=-160;dcHeliPose(H);
    const r={los:los(m.x,m.y,e.x,e.y),line:!!fireLine(m,e),air:(fireLine(m,e)||{}).air,down:(fireLine(e,m)||{}).air,c:+hitChance(m,e,fireLine(m,e)).toFixed(2)};
    const hp=H.hp;explode(e.x,e.y,players[0],true,90,300);r.blast=hp-H.hp;
    const rf=players.find(p=>!p.dcGun),lt=C.guns.find(g=>g.k==='n2').man,hv=C.guns.find(g=>g.k==='h1').man;const k=s=>{const a=H.hp;dcHeliHit(H,10,s);return +(a-H.hp).toFixed(1);};r.k=[k(rf),k(lt),k(hv)];H.x=x0;H.y=y0;m.x=mx;m.y=my;return r;});
  console.log('  ',JSON.stringify(l));
  ok(!l.los&&l.line&&l.air===1&&l.down===2&&l.c>.3,`a man 11 m short of the hedgerow, the helicopter 9 m beyond it: no line on the ground, but one up to it (hit chance ${l.c}) and down from it`);
  ok(l.blast===0&&l.k[0]===3&&l.k[1]===8&&l.k[2]===16,`a blast under it does nothing; 10 of damage does ${l.k.join(', ')} by a rifle, a nest's gun, the heavy gun`);
  // it makes a run: rockets at a manned gun; its gunner shoots our men; our guns shoot it
  const r=await ev(()=>{const C=dd.dc,H=C.helis[0],hp0=H.hp,g0=C.guns.map(g=>g.hp+(g.dead?0:0)).reduce((a,b)=>a+b,0);let fired=0,tg=null,tgHp=0,i=0;
    for(;i<300;i++){RUN(.1);if((C.hrk||[]).length&&!fired){fired=1;tg=H.tg||null;tgHp=tg?tg.hp:0;}if(fired&&!(C.hrk||[]).length)break;}RUN(.3);
    return{fired,t:i/10,tg:tg&&tg.k,dmg:tg?Math.round(tgHp-tg.hp):0,dead:tg&&tg.dead,hp:Math.round(hp0-H.hp),hurt:HURT.length,shot:H.e.shotAtT>0};});
  console.log('  ',JSON.stringify(r));
  ok(r.fired&&(r.dmg>0||r.dead),`a run: rockets at the ${r.tg} (${r.dmg} off it${r.dead?', knocked out':''}) within ${r.t} s`);
  ok(r.shot&&r.hurt>0&&r.hp>0,`its door gunner fires on our men (${r.hurt} hits); our guns hit it (${r.hp} off)`);
  // first person on the heavy gun: the crosshair on it hits it
  const f=await ev(()=>{const C=dd.dc,H=C.helis[0],g=C.guns.find(q=>q.k==='h1');if(g.dead)dcGunUp(g,g.hp0);if(!g.man||g.man.npc)dcSit(g,players.find(p=>alive(p)&&!p.dcGun));dcTile('h1');RUN(.2);const F=dd.fp;if(!F)return{fp:false};
    H.x=g.x;H.y=g.y-280;H.st='orbit';H.runT=1e9;dcHeliPose(H);const hp=H.hp;let n=0;
    for(let k=0;k<12;k++){const P=fpPose(),O=P.O,ty=ddH(H.x,H.y)+H.alt+2;F.a=Math.atan2(H.y-O.z,H.x-O.x);F.p=Math.atan2(ty-O.y,hyp(H.x-O.x,H.y-O.z));F.reloadT=0;F.clip=80;fpShoot();n++;}
    return{fp:true,on:F.u.dcGun.k,hits:Math.round(hp-H.hp),hit:performance.now()-F.hitT<5000,z:tracers.filter(t=>t.z2!=null).length};});
  console.log('  ',JSON.stringify(f));
  ok(f.fp&&f.hits>=200&&f.hit&&f.z>0,`behind the heavy gun, 12 rounds with the crosshair on it: ${f.hits} off it, the hit mark, the tracers going up to it`);
  // it can't be left: the wave waits for it; shot down it spins, falls and burns, its gunner with it, and the wave is over
  const d=await ev(()=>{const C=dd.dc,H=C.helis[0];if(dd.fp)fpExit();for(const e of enemies)if(!e.air&&!e.dead){e.dead=true;e.hp=0;}for(const K of dd.tanks)K.hp=0;C.more=1;RUN(4);const ph1=C.ph;
    H.hp=5;dcHeliHit(H,20,C.guns.find(g=>g.k==='h1').man);const st1=H.st;let i=0;while(H.st==='crash'&&i++<100)RUN(.1);RUN(2.5);
    return{ph1,st1,st:H.st,fall:i/10,gunner:H.e.dead,fire:tankFires.some(f=>hyp(f.x-H.x,f.y-H.y)<5),big:EV.filter(q=>q[0]==='big').map(q=>q[1]).slice(-3),ph:C.ph};});
  console.log('  ',JSON.stringify(d));
  ok(d.ph1==='w5'&&d.st1==='crash'&&d.st==='dead'&&d.gunner&&d.fire&&d.big.includes('Helicopter down')&&d.ph!=='w5',`the wave waits on it (${d.ph1} with everything else down); shot down it falls (${d.fall} s), burns, its gunner gone, "Helicopter down", and the wave is over (${d.ph})`);
  if(OUT){await ev(()=>{const H=dd.dc.helis[0];camT={x:H.x,z:H.y+160};zoom=5;DRAW();});await page.waitForTimeout(500);await ev(()=>DRAW());await page.waitForTimeout(300);await page.screenshot({path:`${OUT}/wreck.png`});}
  // wave 7: two, the second later
  const s7=await ev(()=>{const C=dd.dc;C.wave=6;C.ph='lull';C.t=99;RUN(.2);const L=C.helis.filter(H=>H.w===7);return{n:L.length,gap:L.length===2?Math.round(L[1].relT-L[0].relT):null,tk:dd.tanks.filter(K=>K.w===7).length};});
  ok(s7.n===2&&s7.gap>=15&&s7.tk===3,`wave 7: three tanks and two helicopters, the second ${s7.gap} s after the first`);
  // (after the bots' fights) a tank at the end of its road with nothing in its sights rolls on onto the ground in front of the command post, where
  // it counts for the flag's clock; the test's tank is blind (range 0), not to be killed or held back by our guns meanwhile (hp, ddTankHold), and
  // is knocked out once it's there
  const tr=await ev(()=>{const C=dd.dc,K=dd.tanks.find(Q=>Q.w===7&&Q.hp>0);for(const e of enemies)if(e.tag==='w7'&&!e.air){e.dead=true;e.gone=true;e.hp=0;}for(const Q of dd.tanks)if(Q!==K)Q.hp=0;C.more=1;
    for(const H of C.helis)if(H.w===7)H.relT=1e9;K.hold=false;K.i=K.way.length;const w=K.way[K.way.length-1];K.x=w[0];K.y=w[1];K.range=0;K.hitBy=null;K.hp=K.hp0=1e6;const th=ddTankHold;window.ddTankHold=()=>{};const inZ=()=>dcIn(K,DCA.cpZone);
    const z0=inZ();RUN(DCA.tankRoll-6);const early=!!K.rolled;RUN(8);const rolled=!!K.rolled;let i=0;while(!inZ()&&i++<300)RUN(.1);RUN(1);const cpN=C.cpN;K.hp=0;window.ddTankHold=th;RUN(.5);
    return{z0,early,rolled,inZ:inZ(),t:i/10,cpN,ban:EV.filter(q=>q[0]==='banner'&&/rolls up/.test(q[1])).length,ph:C.ph};});
  console.log('  ',JSON.stringify(tr));
  ok(!tr.z0&&!tr.early&&tr.rolled&&tr.inZ&&tr.cpN>=1&&tr.ban===1&&tr.ph==='w7',`a tank at the end of its road with nothing in its sights for ${'30'} s rolls on in front of the command post (there ${tr.t} s later), "A tank rolls up to the gate!", and it counts for the flag's clock (${tr.cpN} of theirs there)`);
  // ... and a helicopter left to itself turns for home: one after its rocket runs, the other after its time over the field; gone, the wave is over
  const g7=await ev(()=>{const C=dd.dc,[A,B]=C.helis.filter(H=>H.w===7);for(const H of[A,B])H.relT=simT;RUN(.5);let i=0;while((A.st==='in'||B.st==='in')&&i++<900)RUN(.1);
    A.runs=DCA.heli.runs;B.onT=simT-DCA.heli.stay-1;const ph0=C.ph;i=0;while((A.st!=='out'||B.st!=='out')&&A.st!=='gone'&&i++<300)RUN(.1);const st=[A.st,B.st];i=0;while((A.st!=='gone'||B.st!=='gone')&&i++<900)RUN(.1);RUN(1);
    return{ph0,st,end:[A.st,B.st],t:i/10,ban:EV.filter(q=>q[0]==='banner'&&/turns for home/.test(q[1])).map(q=>q[1]),gun:[A.e.dead,B.e.dead],vis:[!!(A.g&&A.g.visible),!!(B.g&&B.g.visible)],ph:C.ph,won:!!dd.won};});
  console.log('  ',JSON.stringify(g7));
  ok(g7.ph0==='w7'&&g7.end.every(s=>s==='gone')&&g7.ban.length===2&&g7.gun.every(Boolean)&&!g7.vis.some(Boolean)&&(g7.ph!=='w7'||g7.won),`left to themselves the helicopters turn for home ("${g7.ban.join('" / "')}"), off north and gone in ${g7.t} s, and the wave is over (${g7.won?'won':g7.ph})`);
  await errs(ev,errors,'the helicopter');await page.close();}
console.log(fails?'FAILED '+fails:'ALL OK');await b.close();srv.close();})();
