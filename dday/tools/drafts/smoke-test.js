// Version 174 (Bryan, after Version 173: "I'm trying to throw smoke and it says too far"): a tool in hand goes to whoever of the squad can use it where
// the map is tapped (ddctl.js's ddcThrower), smoke walks up for a throw like a frag (combat.js's fireSpot), the orange reach covers every man who has
// one, an arrow points to him when he's off the screen, and too far says how far. Real clicks. node smoke-test.js [W H PORT]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const W=+process.argv[2]||390,H=+process.argv[3]||760,PO=+process.argv[4]||0;
(async()=>{const port=9970+PO,srv=await serve('/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:W,height:H});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);for(const p of players)p.sup=0;if(i%6===0)drawOverlay(.03,simT);}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.SCR=(x,y,h)=>{toSBack=false;const p=toS(x,y,h||0);return toSBack?null:p;};
  window.VIEW=(x,y,z)=>{dd.track=null;camPan=null;zoom=z||2.4;camT.x=x;camT.z=y-40;updateCamera();render(.001,simT);hud();drawOverlay(.03,simT);};});
await page.click('#ddBtn');await page.waitForTimeout(400);
// two men of the squad with smoke, far apart on the sand (as in Bryan's picture: the one it's handed to off the screen)
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);const L=players.filter(p=>p.team===dd.active&&alive(p));
  const A=L[0],B=L[1];for(const u of L)if(u.spec==='smoke')u.specN=0;
  Object.assign(A,{spec:'smoke',specN:3,x:DDX+300,y:640,path:[]});Object.assign(B,{spec:'smoke',specN:1,x:DDX+760,y:600,path:[]});window.SA=A;window.SB=B;RUN(.2);});
const btn=k=>ev(k=>{hud();drawOverlay(.03,simT);const b=document.querySelector(`#sq .sq-tool[data-k="${k}"]`);if(!b||b.disabled)return null;const r=b.getBoundingClientRect();return[r.left+r.width/2,r.top+r.height/2];},k);
{const a=await btn('smoke');await page.mouse.click(a[0],a[1]);
 await ok('smoke in hand: handed to the man with the most',()=>({ok:dd.toolK==='smoke'&&dd.toolU===SA,to:dd.toolU&&dd.toolU.name,SA:SA.name,SB:SB.name}));
 await ok('the orange reach covers both men who carry it',()=>{VIEW(SB.x,SB.y,2.4);let n=0;const r0=ddcRingPath;window.ddcRingPath=function(){const k=r0.apply(this,arguments);if(k)n++;return k;};drawOverlay(.03,simT);window.ddcRingPath=r0;return{ok:n>=2,rings:n};});
 // the view on the second man, the first off the screen: a tap 15 m from the second
 const p=await ev(()=>{VIEW(SB.x,SB.y,2.4);window.NS=nades.length;return SCR(SB.x+40,SB.y-140,0);});
 await page.mouse.click(p[0],p[1]);
 await ok('a tap far from the man it was handed to: the man near it throws',()=>{drawOverlay(.03,simT);const by=nades.slice(NS).find(n=>n.smoke||n.by)||null;const g=[SA,SB].find(u=>u.throwGo);return{ok:!dd.toolK&&(!!g&&g===SB||!!by&&by.by===SB||SB.specN===0),thrower:g&&g.name||by&&by.by&&by.by.name,SBleft:SB.specN,SAleft:SA.specN};});}
{await ev(()=>{RUN(4);for(const u of [SA,SB]){u.throwGo=null;u.path=[];}SB.specN=0;});   // (only the first man has smoke now)
 const a=await btn('smoke');await page.mouse.click(a[0],a[1]);
 const p=await ev(()=>{VIEW(SA.x,SA.y-200,1.8);return SCR(SA.x+60,SA.y-420,0);});   // (43 m from him: past his 26 m, inside 62 m once he moves up)
 await page.mouse.click(p[0],p[1]);
 await ok('smoke 43 m off: he walks up for it (not "too far")',()=>{drawOverlay(.03,simT);return{ok:!!SA.throwGo&&SA.path.length>0&&!dd.toolK,walking:!!SA.throwGo,inHand:dd.toolK};});}
{await ev(()=>{RUN(2);SA.throwGo=null;SA.path=[];SA.specN=2;});const a=await btn('smoke');await page.mouse.click(a[0],a[1]);
 const p=await ev(()=>{VIEW(SA.x,SA.y-420,1.4);return SCR(SA.x,SA.y-900,0);});   // (90 m off: past anyone's reach)
 if(p){await page.mouse.click(p[0],p[1]);
  await ok('90 m off: "Too far" with the distance, the smoke kept in hand',()=>{const n=(dd.notes||[]).map(q=>q.text);return{ok:dd.toolK==='smoke'&&n.some(t=>/Too far · \d+ m \(\d+ m at most\)/.test(t))&&!SA.throwGo,notes:n,inHand:dd.toolK};});}
 else console.log('skip: the far spot not on screen');}
await ok('the man holding it off the screen: an arrow at the edge toward him',()=>{if(!dd.toolK){ddToolUse('smoke');}VIEW(SA.x,SA.y-1200,1.4);let n=0;const a0=ddEdgeArrow;window.ddEdgeArrow=function(dx,dy,col,text){if(text===SA.name)n++;return a0.apply(this,arguments);};drawOverlay(.03,simT);window.ddEdgeArrow=a0;ddToolEnd();return{ok:n>0,arrows:n};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();
