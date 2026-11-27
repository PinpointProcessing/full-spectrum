// Version 238: the field gun on the blockhouse (three hits), wave 1's tank and its second lot. node v238.js [port]
// Version 254 (Bryan: "Heavy units can start appearing at Wave 5"): wave 1 had no tank; its second lot is 8 (24 in all).
// Version 255 (Bryan: "Add one tank to wave 1 and 2"): wave 1 has one tank again, let loose as the wave starts.
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const PORT=+process.argv[2]||9997;
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(91);window.requestAnimationFrame=()=>0;startCounter();});await page.waitForTimeout(700);
const s0=await ev(()=>{const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);let n=0;while(dd.dc.ph!=='w1'&&n++<900)update(1/30);const K=dd.tanks.find(q=>q.w===1);const k0=K&&{x:Math.round(K.x),y:Math.round(K.y),hold:K.hold};for(let i=0;i<360;i++)update(1/30);
  return{ph:dd.dc.ph,tanks:dd.tanks.map(q=>[q.w,!!q.hold,Math.round(q.x),Math.round(q.y)]),k0,k1:K&&{x:Math.round(K.x),y:Math.round(K.y),hp:K.hp},w1:enemies.filter(e=>e.tag==='w1').length,guns:dd.dc.guns.map(g=>[g.k,g.x,g.y])};});console.log(JSON.stringify(s0));
ok(s0.tanks.length===2&&s0.k0&&(s0.k1.y>s0.k0.y+60||s0.k1.hp<=0),'wave 1 has two tanks (Version 256) and the first comes down the road (let loose the tick after the wave starts)');
const s1=await ev(()=>{let n=0;while(!dd.dc.more&&dd.dc.ph==='w1'&&n++<900)update(1/30);return{more:dd.dc.more,w1:enemies.filter(e=>e.tag==='w1').length,t:+dd.dc.t.toFixed(1)};});console.log(JSON.stringify(s1));ok(s1.more&&s1.w1===24,'twenty seconds in, eight more of them come out of the trees (24 in all)');
const s2=await ev(()=>{const C=dd.dc,g=C.guns.find(q=>q.t==='art'),co=objs.find(o=>o.tag==='check'),c=DCA.check,out=[];if(!g.man){const u=players.find(alive);g.man=u;u.dcGun=g;}
  for(let k=0;k<3;k++){dcFire(g,c.x+c.w/2+(k-1)*30,c.y+(k===1?-200:c.h/2));for(let i=0;i<90;i++)update(1/30);out.push([Math.round(co.hp),co.artHits||0,!!co.gone,co.breach||0]);}return out;});console.log(JSON.stringify(s2));
ok(s2[0][1]===1&&!s2[0][2]&&s2[1][1]===2&&!s2[1][2]&&s2[2][2],'the field gun: three shells at the blockhouse (one aimed past it, through it) and it comes down');
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
