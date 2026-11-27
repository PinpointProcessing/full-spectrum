// Close looks at the stationary weapons and vehicles of each chapter, drawn through the game's own render (light, post) with a camera put where it's wanted.
// node survey.js OUT [port] [chapters=beach,counter,village] ; DDROOT = the dday folder ; W,H env for the tile size ; ONLY=name,name to limit the shots
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const OUT=process.argv[2]||'before',PORT=+process.argv[3]||9741,CH=(process.argv[4]||'beach,counter,village').split(','),W=+process.env.W||640,H=+process.env.H||480,ONLY=process.env.ONLY?process.env.ONLY.split(','):null;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
for(const ch of CH){
  const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=${process.env.GFX||2}${process.env.Q||''}`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
  await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);});
  if(process.env.PRE)await ev(process.env.PRE);
  const shot=async(name,c,o)=>{if(ONLY&&!ONLY.includes(name))return;o=o||{};await ev(([c,o])=>{window._cam=c;if(!window._uc0)window._uc0=updateCamera;updateCamera=()=>{const c=window._cam;camera.fov=c[6]||38;camera.near=1;camera.aspect=cw/ch;camera.updateProjectionMatrix();camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);camera.updateMatrixWorld();};
      if(typeof ddCam==='function'&&!window._dc)window._dc=ddCam;ddCam=()=>{};
      document.body.classList.add('shotclean');for(const s of ['#sq','.panel','#ddObj','#hint','#banner','#big','#tl','#obj','#fp','#dcBar','#ddSwap'])for(const el of document.querySelectorAll(s))el.style.visibility='hidden';
      render(1/30,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);},[c,o]);await page.waitForTimeout(350);
    await ev(()=>{render(1/30,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${ch}-${name}.png`});console.log('shot',ch,name);};
  // a camera looking at (x,y) from az (radians, 0 = from the east, PI/2 = from the south), d away, h above the ground there, at a point lh up
  const at=async(name,x,y,az,d,h,lh,fov)=>{const g=await ev(([x,y])=>ddH(x,y),[x,y]);await shot(name,[x+Math.cos(az)*d,g+h,y+Math.sin(az)*d,x,g+(lh==null?8:lh),y,fov||38]);};
  const fpshot=async(name,setup,arg)=>{if(ONLY&&!ONLY.includes(name))return;await ev(()=>{if(window._uc0)updateCamera=window._uc0;if(window._dc)ddCam=window._dc;});const ok=await ev(setup,arg);if(ok===false){console.log('fp setup failed',name);return;}
    await ev(()=>{bigText('');flashes.length=0;for(let i=0;i<3;i++)update(1/600);for(let i=0;i<30;i++)fpCam(1/30);render(1/30,simT);hud();ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);for(const s of ['#fp','#dcBar','#ddObj','#banner','#big','#hint'])for(const el of document.querySelectorAll(s))el.style.visibility='hidden';});await page.waitForTimeout(450);
    await ev(()=>{if(window.FIRE){fpShoot();dd.fp.cool=FP_W.mg.cool;for(let i=0;i<2;i++)update(1/120);}fpCam(1/600);render(1/30,simT);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${ch}-${name}.png`});console.log('shot',ch,name);await ev(()=>{if(dd.fp)fpExit();});};
  if(ch==='beach'){
    await page.click('#ddBtn');await page.waitForTimeout(500);
    // the ride in: the boats
    await ev(()=>{RUN(2.5);});const B=await ev(()=>{const b=dd.boats.find(b=>b.own)||dd.boats[0];return{x:b.x,y:b.y,h:b.m.position.y};});
    await shot('boat',[B.x+85,B.h+50,B.y+95,B.x,B.h+8,B.y,38]);await shot('boat-in',[B.x+10,B.h+34,B.y+78,B.x,B.h+10,B.y-20,50]);
    await ev(()=>{let n=0;while(!dd.land.done&&n++<300)RUN(.25);RUN(1);for(const e of enemies)e.stunT=1e9;});
    const S=await ev(()=>({mg:[DD_SPOT.leftMG,DD_SPOT.nests[0],DD_SPOT.topMG,DD_SPOT.hillMG].map(s=>({x:s.x+DDX,y:s.y,a:s.ang})),guns:objs.filter(o=>o.kind==='ddgun').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2,t:o.tag,e:!!o.east})),
      trucks:objs.filter(o=>o.kind==='ddtruck').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2})),wr:objs.filter(o=>o.kind==='ddwreck').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2,lc:!!o.lc})),mort:DD_SPOT.mortars.map(m=>({x:m.x+DDX,y:m.y})),post:(dd.post&&dd.post.guns||[]).map(g=>({x:g.gx,y:g.gy,z:g.z}))}));
    console.log(JSON.stringify(S));
    await ev(()=>{for(const m of DD.roofs||[]){m.visible=false;for(const p of m.userData.parts||[])p.visible=false;}window._noRoof=1;const f0=ddFrame;});
    // the roofs come back each frame (ddFrame): keep them off for the pictures
    await ev(()=>{const f=ddFrame;ddFrame=function(){f.apply(this,arguments);for(const m of DD.roofs||[]){m.visible=false;for(const p of m.userData.parts||[])p.visible=false;}};});
    let i=0;for(const m of S.mg){await at('mg'+(i++),m.x,m.y,m.a+Math.PI*.78,42,26,10,34);}
    {const C={art:[Math.PI*.5+.8,95,52],heavy:[1.05,78,30],cannon:[-.75,74,40],aa:[Math.PI*.5+.8,80,44]};let n=0;
      for(const g of S.guns){const c=C[g.t]||C.art;await at('gun-'+g.t+(g.t==='art'&&n++?'2':''),g.x,g.y,c[0],c[1],c[2],12,38);}}
    if(S.post.length)await at('postgun',S.post[0].x,S.post[0].y,Math.PI*.5+.9,44,26,10,34);
    if(S.trucks[0])await at('truck',S.trucks[0].x,S.trucks[0].y,.9,90,48,10,38);
    for(const w of S.wr.slice(0,2))await at('wreck'+(w.lc?'-lc':''),w.x,w.y,.85,100,52,8,38);
    if(S.mort[0])await at('mortar',S.mort[0].x,S.mort[0].y+6,-2.4,44,26,6,36);
    const K=await ev(()=>{const K=ddTankSpawn({x:820,y:-560,ang:Math.PI*.8,name:'Test',hold:true});K.tur.rotation.y=.3;return{x:K.x,y:K.y};});
    await at('tank',K.x,K.y,.9,96,44,12,38);await at('tank-low',K.x,K.y,2.2,80,16,12,38);await at('tank-top',K.x,K.y,1.2,150,170,10,38);
    await ev(()=>{const K=dd.tanks[dd.tanks.length-1];ddTankHit(K.x,K.y,3);RUN(4);});await at('tank-dead',K.x,K.y,.9,96,44,12,38);
    {const X=await ev(()=>DDX);await shot('ships',[X+500,70,700,X+500,60,2400,30]);}
  }
  if(ch==='counter'){
    await page.click('#ddCtrBtn');await page.waitForTimeout(900);await ev(()=>{RUN(1.5);for(const e of enemies)e.stunT=1e9;});
    const S=await ev(()=>({guns:DCA.guns.map(g=>({k:g.k,x:g.x,y:g.y,t:g.t,hv:!!g.hv})),eg:(DCA.eguns||[]).map(e=>({x:e.x,y:e.y})),trucks:objs.filter(o=>o.kind==='ddtruck').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2})),tanks:(dd.tanks||[]).map(K=>({x:K.x,y:K.y}))}));console.log(JSON.stringify(S));
    for(const g of S.guns)await at('gun-'+g.k,g.x,g.y-(g.t==='art'?6:4),Math.PI*.5+.75,g.t==='art'?90:46,g.t==='art'?46:27,10,g.t==='art'?38:34);
    if(S.eg[0])await at('egun',S.eg[0].x,S.eg[0].y,Math.PI*.5+.8,42,26,9,34);
    if(S.trucks[0])await at('truck',S.trucks[0].x,S.trucks[0].y,.9,90,48,10,38);
    if(S.tanks[0])await at('tank',S.tanks[0].x,S.tanks[0].y,.9,96,44,12,38);
    // first person behind a machine gun, the game's own view
    // first person behind the guns, the game's own view
    await ev(()=>{RUN(14);});
    for(const k of S.guns.map(g=>g.k)){await fpshot('fp-'+k,k=>{const g=dd.dc.guns.find(q=>q.k===k);if(!g||!g.man)return false;window.FIRE=0;dcTile(k);if(!dd.fp)return false;dd.fp.p=-.02;return true;},k);
      if(k===S.guns[0].k)await fpshot('fp-'+k+'-fire',k=>{const g=dd.dc.guns.find(q=>q.k===k);if(!g||!g.man)return false;window.FIRE=1;dcTile(k);if(!dd.fp)return false;dd.fp.p=-.02;return true;},k);}
  }
  if(ch==='village'){
    await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(1200);await ev(()=>{RUN(1.5);for(const e of enemies)e.stunT=1e9;});
    const S=await ev(()=>({guns:VG_GUNS.map(g=>({x:g.x,y:g.y,a:g.ang})),cars:objs.filter(o=>o.kind==='vgcar').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2,l:o.look||''})),wr:objs.filter(o=>o.kind==='ddwreck').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2})),cart:objs.filter(o=>o.kind==='vgcart').map(o=>({x:o.x+o.w/2,y:o.y+o.h/2}))}));console.log(JSON.stringify(S));
    await at('mg',S.guns[1].x,S.guns[1].y,S.guns[1].a+Math.PI*.78,42,26,10,34);
    await at('mortar',560,-238,Math.PI*.5+.6,44,26,6,36);
    for(const c of S.cars)await at('car-'+(c.l||'car'),c.x,c.y,.9,80,42,8,38);
    if(S.wr[0])await at('wreck',S.wr[0].x,S.wr[0].y,.85,100,52,8,38);
    const T=await ev(()=>{const K=vgTruck({way:[[700,120],[700,60]],men:0,goal:[700,0]});K.ph='parked';RUN(.7);return{x:K.x,y:K.y};});   // (parked, and a moment for the light's colour sweep to reach it)
    await at('truck',T.x,T.y,.6,90,46,12,38);await at('truck-rear',T.x,T.y,2.4,84,40,12,38);
  }
  console.log(ch,'errors',errors.length,errors.slice(0,3));await page.close();
}
await b.close();srv.close();process.exit(0);})();
