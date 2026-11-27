// Version 246 (a draft): the real-looking guns and vehicles behind the Settings switch, and the view from behind a gun.
// node real-guns-test.js [port]   (DDROOT = the dday folder; HARNESS = the scratchpad's harness.js)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');
const PORT=+process.argv[2]||9766;
(async()=>{const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const start=async(q)=>{const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1${q||''}`);await page.setViewportSize({width:390,height:760});const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{window.requestAnimationFrame=()=>0;Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4246);localStorage.removeItem('warehouseYard.ddmeta.v1');
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);if(i%3==0){panTick(.1);ddFrame(.1,simT);}}};
    window.REAL=()=>{let n=0;DD.scene.traverse(o=>{if(o.userData&&o.userData.real)n++;});return n;};});
  return{page,errors,ev};};
// ---- 1. the switch off (as shipped): nothing of the draft is used
{const {page,errors,ev}=await start('');
  const s0=await ev(()=>({has:typeof ddReal==='function',on:ddReal(),box:!!document.querySelector('#ddCtlReal'),checked:document.querySelector('#ddCtlReal').checked}));
  ok(s0.has&&!s0.on&&s0.box&&!s0.checked,'the switch is on the start card, off to begin with');
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);
  const s1=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(14);for(const e of enemies)e.stunT=1e9;const g=dd.dc.guns.find(q=>q.t==='mg'&&q.man);if(g)dcTile(g.k);
    for(let i=0;i<5;i++)fpCam(1/30);return{real:REAL(),guns:DDR.guns.size,fp:!!dd.fp,rg:!!(dd.fp&&dd.fp.rg),old:!!(dd.fp&&dd.fp.gun)};});
  ok(s1.real===0&&s1.guns===0,'off: no new models in Chapter 2 ('+s1.real+', '+s1.guns+')');ok(s1.fp&&!s1.rg&&s1.old,'off: behind a gun it is the old view');
  ok(errors.length===0,'off: no errors '+errors.slice(0,2));
  // a real click on the switch
  await ev(()=>{if(dd.fp)fpExit();});await page.goto(`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.waitForTimeout(2000);
  await page.click('fieldset.ddctl summary, fieldset.ddctl legend').catch(()=>{});
  await ev(()=>{const el=document.querySelector('#ddCtlReal');el.scrollIntoView();el.click();});
  const s2=await ev(()=>({on:ddReal(),ls:localStorage.getItem('warehouseYard.ddreal.v1')}));ok(s2.on&&s2.ls==='1','ticking the switch turns the draft on and remembers it');
  await ev(()=>{localStorage.removeItem('warehouseYard.ddreal.v1');});await page.close();}
// ---- 2. Chapter 2 with the draft on
{const {page,errors,ev}=await start('&real=1');
  await page.click('#ddCtrBtn');await page.waitForTimeout(900);
  const s=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(14);for(const e of enemies)e.stunT=1e9;
    const mg=dd.dc.guns.filter(q=>q.t==='mg'),art=dd.dc.guns.find(q=>q.t==='art');
    return{guns:DDR.guns.size,want:mg.length+(DCA.eguns||[]).length,kinds:mg.map(q=>DD.dcGuns[q.k].userData.kind).join(','),manned:mg.filter(q=>q.man).length,artReal:!!(art&&DD.dcGuns[art.k].userData.real),hasArt:typeof ddrArtM1AT==='function',
      tanks:(dd.tanks||[]).length,tankReal:(dd.tanks||[]).every(K=>K.g.userData.real||K.g.userData.ddrTank),hasTank:typeof ddrTank==='function'};});
  ok(s.guns===s.want,'the machine guns are the new ones: '+s.guns+' of '+s.want+' ('+s.kinds+')');
  ok(!s.hasArt||s.artReal,'the field gun is the new one'+(s.hasArt?'':' (its model is not in yet)'));
  ok(!s.hasTank||s.tankReal,'the tanks are the new ones ('+s.tanks+')'+(s.hasTank?'':' (model not in yet)'));
  // a gun's top turns with its gunner
  const t=await ev(()=>{const g=dd.dc.guns.find(q=>q.t==='mg'&&q.man),m=DD.dcGuns[g.k],u=g.man;u.ang=-Math.PI/2+.5;u.stunT=1e9;for(let i=0;i<40;i++)ddrGunsFrame(1/30);return{y:+m.ddrTop.rotation.y.toFixed(2),k:g.k};});
  ok(Math.abs(t.y+.5)<.06,'a gun turns on its mount with its gunner ('+t.y+')');
  // behind a gun
  const f=await ev(()=>{const g=dd.dc.guns.find(q=>q.t==='mg'&&q.man);g.man.stunT=0;dcTile(g.k);if(!dd.fp)return null;const F=dd.fp;F.a=-Math.PI/2+.3;F.p=-.1;for(let i=0;i<6;i++)fpCam(1/30);const P=fpPose(),m=DD.dcGuns[g.k];
    const piv=new THREE.Vector3(m.position.x,m.position.y+m.ddrTop.position.y,m.position.z),d=P.O.clone().sub(piv),fw=d.dot(P.D);
    return{rig:!!P.rig,rg:!!F.rg,hidden:!m.visible,inScene:!!(F.rg&&F.rg.parent),back:+(-fw).toFixed(1),up:+(P.O.y-piv.y).toFixed(1),yaw:+F.rg.ddr.top.rotation.y.toFixed(2),pitch:+F.rg.ddr.top.rotation.z.toFixed(2),cam:camera.position.distanceTo(P.O)<.01,old:!!(F.gun&&F.gun.visible)};});
  ok(f&&f.rig&&f.rg&&f.inScene&&f.hidden,'behind a gun: the gun in view is the real one on its mount, the battle\'s copy hidden');
  ok(f&&f.back>4&&f.back<14&&f.up>1.5&&f.up<5&&f.cam,'the eye rides behind and above its back end ('+(f&&f.back)+' back, '+(f&&f.up)+' up)');
  ok(f&&Math.abs(f.yaw+.3)<.02&&Math.abs(f.pitch+.1)<.03&&!f.old,'it turns and tips with your aim ('+(f&&f.yaw)+', '+(f&&f.pitch)+')');
  // a shot along the crosshair hits
  const h=await ev(()=>{const F=dd.fp,P=fpPose(),e=enemies.find(q=>!beaten(q))||null;if(!e)return{none:1};e.stunT=1e9;const d=60;e.x=P.O.x+Math.cos(F.a)*d;e.y=P.O.z+Math.sin(F.a)*d;e.path=[];const gh=ddH(e.x,e.y);
    F.p=Math.atan2(gh+9-P.O.y,d);F.kick=0;const hp=e.hp;window._d0=damage;let hit=0;const dm=damage;damage=(t,dd2,s)=>{if(t===e)hit++;};F.clip=30;F.reloadT=0;for(let i=0;i<6;i++){F.kick=0;fpShoot();}damage=dm;return{hit,p:+F.p.toFixed(2)};});
  ok(h.none||h.hit>=3,'firing along the crosshair hits the man in it ('+JSON.stringify(h)+')');
  const c=await ev(()=>{const F=dd.fp;const el=document.querySelector('#fp');F.p=.3;const ev2=new PointerEvent('pointermove');return{p:F.p};});
  const x=await ev(()=>{const F=dd.fp,G=F.rgG;fpExit();return{vis:G.g.visible,rg:!!F.rg,fp:!!dd.fp};});ok(x.vis&&!x.rg&&!x.fp,'BACK: the battle\'s gun is drawn again');
  // knocked out and repaired
  const k=await ev(()=>{const g=dd.dc.guns.find(q=>q.t==='mg');const m=DD.dcGuns[g.k];dcGunHit(g,9999);const z=m.rotation.z;return{dead:g.dead,tilt:z!==0};});ok(k.dead&&k.tilt,'a gun knocked out tips over, no errors');
  await ev(()=>{RUN(3);});ok(errors.length===0,'Chapter 2: no errors '+errors.slice(0,2));await page.close();}
// ---- 3. Chapter 1 with the draft on
{const {page,errors,ev}=await start('&real=1');
  await page.click('#ddBtn');await page.waitForTimeout(700);
  const s=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);const boat=dd.boats[0]&&dd.boats[0].m;const br=!!(boat&&boat.userData.real),ramp=!!(boat&&(boat.userData.ramp||boat.ddr_ramp));
    let n=0;while(!dd.land.done&&n++<4000)update(1/30);RUN(3);
    const gun=objs.filter(o=>o.kind==='ddgun'),tr=objs.filter(o=>o.kind==='ddtruck'),wr=objs.filter(o=>o.kind==='ddwreck');
    const gn=enemies.find(e=>e.onGun&&!beaten(e));let turn=null;if(gn){gn.stunT=1e9;for(let i=0;i<12;i++)ddrGunsFrame(.1);const G=gn.ddrG;turn=G?+G.g.ddrTop.rotation.y.toFixed(2):null;}
    return{guns:DDR.guns.size,boatReal:br,ramp,hasBoat:typeof ddrVehLCVP==='function',gunReal:gun.filter(o=>o.real).length,gunN:gun.length,hasGun:typeof ddrArtPak40==='function',
      truckReal:tr.filter(o=>o.meshes&&o.meshes[0]&&o.meshes[0].parent&&(o.meshes[0].parent.userData.real||(o.meshes[0].parent.parent&&o.meshes[0].parent.parent.userData.real))).length,truckN:tr.length,hasTruck:typeof ddrVehTruck==='function',wr:wr.length,turn};});
  ok(s.guns>=17,'the beach: '+s.guns+' machine guns are the new ones');ok(s.turn!=null,'a German gunner\'s gun follows him ('+s.turn+')');
  ok(!s.hasBoat||(s.boatReal&&s.ramp),'the landing craft is the new one, with its ramp'+(s.hasBoat?'':' (model not in yet)'));
  ok(!s.hasGun||s.gunReal===s.gunN,'their guns on the top are the new ones ('+s.gunReal+' of '+s.gunN+')'+(s.hasGun?'':' (models not in yet)'));
  ok(!s.hasTruck||s.truckReal===s.truckN,'the parked lorries are the new ones ('+s.truckReal+' of '+s.truckN+')'+(s.hasTruck?'':' (model not in yet)'));
  // a tank made, knocked out, and a gun on the top blown up
  const t=await ev(()=>{const K=ddTankSpawn({x:820,y:-560,ang:Math.PI*.8,name:'Test',hold:true});RUN(.3);const real=!!(K.g.userData.real||K.g.userData.ddrTank);ddTankHit(K.x,K.y,3,9);RUN(1);
    const o=objs.find(q=>q.kind==='ddgun');let blown=false;if(o){ddBlast(o.x+o.w/2,o.y+o.h/2,60,400,{side:'P'});RUN(.5);blown=true;}return{real,dead:K.hp<=0,wreck:!!K.wreck,blown};});
  ok(t.dead&&t.wreck,'a tank knocked out is a wreck you can hide behind'+(t.real?' (the new tank)':''));
  await ev(()=>{RUN(2);});ok(errors.length===0,'Chapter 1: no errors '+errors.slice(0,2));await page.close();}
// ---- 4. Chapter 3 with the draft on
{const {page,errors,ev}=await start('&real=1');
  await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(1300);
  const s=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(2);const K=vgTruck({way:[[700,120],[700,60]],men:0,goal:[700,0]});RUN(.5);
    const cars=objs.filter(o=>o.kind==='vgcar');vgBlast(K.x,K.y);RUN(.5);
    return{guns:DDR.guns.size,want:VG_GUNS.length,truckReal:!!K.g.userData.real,hasTruck:typeof ddrVehTruck==='function',burnt:K.hp<=0,cars:cars.length};});
  ok(s.guns===s.want,'the village: its '+s.want+' machine guns are the new ones');ok(!s.hasTruck||s.truckReal,'a truck driving in is the new one'+(s.hasTruck?'':' (model not in yet)'));ok(s.burnt,'a truck blown up burns, no errors');
  await ev(()=>{RUN(2);});ok(errors.length===0,'Chapter 3: no errors '+errors.slice(0,2));await page.close();}
console.log(fails?`${fails} FAILED`:'all passed');await b.close();srv.close();process.exit(fails?1:0);})();
