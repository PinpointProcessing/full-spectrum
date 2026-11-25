// the looks by level in the battle's own view: Chapter 2's start with a roster at mixed levels. node lvbattle.js OUT [port W H]  (LOOK=0 for the game as it is)
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const OUT=process.argv[2]||'lvbattle',PORT=+process.argv[3]||9886,W=+process.argv[4]||390,H=+process.argv[5]||760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1&noseq`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
const LV={A:[1,3,5,8],B:[2,4,6,10]};
await ev(([LV,look])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);
  ddRoster=ddmRead();ddmReady(2);for(const t of['A','B'])ddRoster.squads[t].forEach((m,i)=>{if(m)m.level=LV[t][i];});ddmSave();if(look)FIG_LVLOOK=true;},[LV,process.env.LOOK!=='0']);
await page.click('#ddCtrBtn');await page.waitForFunction(()=>typeof dd!=='undefined'&&dd&&dd.counter&&state==='play',null,{timeout:60000});await page.waitForTimeout(2500);
const info=await ev(()=>players.filter(p=>p.rm).map(p=>p.team+':'+p.name+':lv'+p.rm.level+':'+p.m.fig.key));console.log(info.join('\n'));
// the battle's angle (from the south, looking down at about 40 degrees), put on each squad by hand: the chapter's own opening moves the game's camera
await ev(()=>{const uc=updateCamera;window.__c=null;updateCamera=function(){uc();const c=window.__c;if(!c)return;const h=ddH(c.x,c.y),p=c.p*Math.PI/180;camera.position.set(c.x+(c.sx||0),h+c.d*Math.sin(p),c.y+c.d*Math.cos(p));camera.lookAt(c.x,h+8,c.y);camera.updateMatrixWorld();};
  const st=document.createElement('style');st.textContent='#sq,.panel,#ddObj,.top,#hud,#tl,#alert,#banner{visibility:hidden!important}';document.head.appendChild(st);
  for(const e of enemies){e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}for(const n of (dd.npcs||[])){n.x=200;n.y=800;}
  for(const t of['A','B'])players.filter(p=>p.rm&&p.team===t).forEach((p,i)=>{p.x=(t==='A'?560:760)+i*34;p.y=330;p.path=[];p.ang=-Math.PI/2;p.sup=0;});});
for(const [n,c] of [['A-back',{x:611,y:330,d:150,p:36}],['B-back',{x:811,y:330,d:150,p:36}],['A-front',{x:611,y:330,d:150,p:24,flip:1}],['B-front',{x:811,y:330,d:150,p:24,flip:1}]]){
  await ev(c=>{if(c.flip)players.filter(p=>p.rm).forEach(p=>{p.ang=Math.PI/2;p.lastOrder=simT;});window.__c=c;},c);await page.waitForTimeout(2600);await page.screenshot({path:`${OUT}/${n}.png`});}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();process.exit(0);})();
