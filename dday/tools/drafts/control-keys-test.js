const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
(async()=>{const port=9931,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:1100,height:680});
await page.evaluate(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));ddmSave();window.requestAnimationFrame=()=>0;startCounter();});
await page.waitForTimeout(800);const ev=(f,a)=>page.evaluate(f,a);const log=async(l,f)=>console.log(l+':',await ev(f));
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};RUN(3);select(players.filter(p=>p.team==='A'));});
await page.keyboard.press('KeyF');await log('in',()=>dd.fp&&dd.fp.u.name+' a '+dd.fp.a.toFixed(2));
await page.mouse.move(500,300);await page.mouse.move(560,320,{steps:4});await log('mouse look',()=>'a '+dd.fp.a.toFixed(2)+' p '+dd.fp.p.toFixed(2));
await page.mouse.down();await log('mouse down',()=>'fire '+dd.fp.fire);await ev(()=>RUN(.5));await page.mouse.up();await log('mouse up',()=>'fire '+dd.fp.fire+' clip '+dd.fp.clip);
await page.keyboard.down('KeyW');await log('W',()=>{const u=dd.fp.u,y=u.y,x=u.x;RUN(1);return 'moved '+Math.round(hyp(u.x-x,u.y-y));});await page.keyboard.up('KeyW');
await page.keyboard.press('KeyV');await log('V',()=>dd.fp.view);await page.keyboard.press('KeyG');await log('G',()=>'gren '+dd.fp.u.grenade+' nades '+nades.length);
// mounted MG: clean hit test, the target held still
await log('mg',()=>{const F=dd.fp,u=F.u,g=dd.dc.guns.find(g=>g.k==='n3');if(g.man){g.man.onGun=null;g.man.gunner=false;g.man.dcGun=null;g.man=null;}u.x=g.x+10;u.y=g.y+30;u.path=[];RUN(.1);fpUse();RUN(4);if(!u.onGun)return'not on gun';
  for(const p of units)if(p!==u&&p.side==='P')p.cool=1e9;const e=enemies.filter(q=>!beaten(q))[0],ex=u.x+30,ey=u.y-220;e.hp=100;let n=0;F.fire=true;while(!e.dead&&n++<90){e.x=ex;e.y=ey;e.path=[];const gg=gndH(ex,ey)+12;for(let i=0;i<3;i++){const P=fpPose();F.a=Math.atan2(ey-P.O.z,ex-P.O.x);F.p=Math.atan2(gg-P.O.y,hyp(ex-P.O.x,ey-P.O.z))-F.kick;}RUN(1/30);}F.fire=false;return `dead ${e.dead} in ${(n/30).toFixed(1)}s clip ${F.clip} los ${los(u.x,u.y,ex,ey)} cover ${coverAt(ex,ey,u.x,u.y)}`;});
await page.keyboard.press('Escape');await log('out',()=>''+dd.fp);
// the whole battle still runs by itself afterwards
await log('battle 40s',()=>{RUN(40);return `ph ${dd.dc.ph} foes ${enemies.filter(e=>!beaten(e)).length} ours ${players.filter(alive).length}`;});
console.log('errors',errors.length,errors.slice(0,5));await b.close();srv.close();})();
