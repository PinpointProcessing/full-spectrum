// Close looks at one model in the game's own light and render: the counterattack's map, the model put on flat open ground with a man beside it.
// node look.js OUT "name=EXPR;;name2=EXPR2" [port]      EXPR is evaluated in the page and must give a THREE.Group (or {g:Group})
// env: DDROOT (the dday folder), SIZE (1 a gun, 2.5 a truck, 3 a tank: scales the camera distances), MAN=gunner|stand|none, SHOTS=game,q,side,rear,close,top, W,H, GFX, Q (extra query), PRE (js run first)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'/tmp/claude-0/-home-user-full-spectrum/06534f05-c23e-508f-8c0c-c1774a77e081/scratchpad/harness.js');const fs=require('fs');
const OUT=process.argv[2]||'look',MODELS=(process.argv[3]||'').split(';;').filter(Boolean).map(s=>{const i=s.indexOf('=');return[s.slice(0,i),s.slice(i+1)];}),PORT=+process.argv[4]||9751;
const W=+process.env.W||640,H=+process.env.H||480,SIZE=+process.env.SIZE||1,MAN=process.env.MAN||'gunner',SH=(process.env.SHOTS||'game,q,side,rear,close').split(',');
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&real=1&gfx=${process.env.GFX||2}${process.env.Q||''}`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4242);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};damage=()=>{};});
await page.click('#ddCtrBtn');await page.waitForTimeout(900);
const spot=await ev(()=>{RUN(.5);for(const e of units)e.stunT=1e9;
  // flat open ground in the field
  let best=null;for(let x=560;x<=860;x+=20)for(let y=120;y<=360;y+=20){let lo=1e9,hi=-1e9;for(let a=0;a<6.3;a+=.7)for(const d of[0,30,60]){const h=ddH(x+Math.cos(a)*d,y+Math.sin(a)*d);lo=Math.min(lo,h);hi=Math.max(hi,h);}
    if(!isFree(x,y,40))continue;const sc=hi-lo;if(!best||sc<best.sc)best={x,y,sc};}
  for(const u of units){if(u.m)u.m.g.visible=false;u.away=true;}
  return best;});
console.log('spot',JSON.stringify(spot));
const shot=async(name,c)=>{await ev(c=>{window._cam=c;if(!window._uc0)window._uc0=updateCamera;updateCamera=()=>{const c=window._cam;camera.fov=c[6]||38;camera.near=1;camera.aspect=cw/ch;camera.updateProjectionMatrix();camera.position.set(c[0],c[1],c[2]);camera.lookAt(c[3],c[4],c[5]);camera.updateMatrixWorld();};
    if(!window._dc)window._dc=ddCam;ddCam=()=>{};for(const s of ['#sq','.panel','#ddObj','#hint','#banner','#big','#tl','#obj','#fp','#dcBar','#ddSwap','#top','#dcNoRe'])for(const el of document.querySelectorAll(s))el.style.visibility='hidden';
    render(1/30,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);},c);await page.waitForTimeout(300);
  await ev(()=>{render(1/30,simT);ox.setTransform(1,0,0,1,0,0);ox.clearRect(0,0,9999,9999);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${name}.png`});};
// (the model points north, -y: az -1.57 is from straight ahead of it, 0 from its right (east), 1.57 from behind it)
const CAMS={game:[1.15,95,80,6,38],q:[-.75,38,18,9,34],side:[0,36,9,9,34],rear:[2.3,36,22,9,34],close:[-.5,21,12,10,30],top:[1.2,20,60,6,34],front:[-1.45,38,12,8,34],low:[-.9,30,5,9,34],left:[3.14,36,10,9,34],q2:[-2.4,38,18,9,34]};
for(const[name,expr]of MODELS){
  const info=await ev(([expr,spot,MAN])=>{if(window._mdl){DD.scene.remove(window._mdl);}let m;try{m=eval(expr);}catch(e){return{err:String(e)+' '+(e.stack||'').split('\n')[1]};}
    const g=m.isObject3D?m:m.g;g.position.set(spot.x,ddH(spot.x,spot.y),spot.y);g.rotation.y=Math.PI/2;DD.scene.add(g);window._mdl=g;   // (pointing north, -y on the map)
    const u=players[0];if(MAN!=='none'&&u&&u.m){u.away=false;u.m.g.visible=true;u.stunT=0;u.path=[];u.ang=-Math.PI/2;
      if(MAN==='gunner'){u.x=spot.x;u.y=spot.y+7.5;u.onGun={x:spot.x,y:spot.y,ang:-Math.PI/2,arc:1};u.gunner=true;}else{u.x=spot.x+(+MAN.split(':')[1]||16);u.y=spot.y+4;u.onGun=null;u.gunner=false;}
      u.lx=0;u.ly=0;for(let i=0;i<4;i++){syncUnits&&0;}}
    let n=0,dc=0;g.traverse(o=>{if(o.isMesh){dc++;n+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3;}});return{tris:Math.round(n),meshes:dc};},[expr,spot,MAN]);
  console.log(name,JSON.stringify(info));if(info.err)continue;
  const g0=await ev(s=>ddH(s.x,s.y),spot);
  for(const k of SH){const c=CAMS[k];if(!c)continue;const d=c[1]*(k==='game'?1:SIZE),h=c[2]*(k==='game'?1:SIZE),lh=c[3]*(k==='game'?1:Math.max(1,SIZE*.7));
    await shot(`${name}-${k}`,[spot.x+Math.cos(c[0])*d,g0+h,spot.y+Math.sin(c[0])*d,spot.x,g0+lh,spot.y,c[4]]);}
}
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();process.exit(0);})();
