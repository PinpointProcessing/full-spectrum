// Version 176 (Bryan, after the brainstorm: "Do you think we should add the cover that takes four? And we should add the smarter cover"): the six
// shell holes for four (dday.js's DD_HOLES), a man down in one covered from every side (ddplay.js's ddHoleCover through map.js's coverAt), four sent
// to each new hole all green, and the smarter dodge (ddDodge: only from inside the blast, toward cover). node cover4-test.js [SEED] [PORT]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,PO=+process.argv[3]||0;
(async()=>{const port=9905+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'&&!t.npc?undefined:d0(t,d,s);
  window.NEW=[[240,622],[560,606],[470,540],[720,522],[360,432],[600,452]];},[SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(8);});
await ok('thirteen shell holes on the beach, each with its rim',()=>{const rims=objs.filter(o=>o.kind==='ddrim').length;return{ok:DD_HOLES.length===13&&rims===13,holes:DD_HOLES.length,rims};});
await ok('a man down in a new hole is covered from every side; just outside it he isn\'t',()=>{
  const h=DD_HOLES.find(q=>q.x===470&&q.y===540),cx=h.x+DDX,cy=h.y,out=[];
  for(let a=0;a<6.28;a+=Math.PI/4){const sx=cx+Math.cos(a)*400,sy=cy+Math.sin(a)*400;out.push(coverAt(cx,cy+6,sx,sy));}
  const ox=cx+h.r+30,oy=cy;let openOut=0;for(let a=0;a<6.28;a+=Math.PI/4){const sx=ox+Math.cos(a)*400,sy=oy+Math.sin(a)*400;if(coverAt(ox,oy,sx,sy)===0)openOut++;}
  return{ok:out.every(v=>v>=1)&&openOut>0,inside:out,openOutside:openOut};});
await ok('four sent to each new hole: four green ghosts (in cover from the guns the squad knows)',()=>{for(const e of enemies)if(!beaten(e)){e.seen=true;e.vis=true;}
  const A=players.filter(u=>u.team==='A'&&alive(u)).slice(0,4),res=[],near=[];
  for(const u of players)if(u.team!=='A'){for(const[x,y]of NEW)if(hyp(u.x-x-DDX,u.y-y)<45)near.push(u.id);Object.assign(u,{x:DDX+960,y:720,path:[]});}   // (the other squad out of the way: a hole for four is full with one of them in it)
  for(const[x,y]of NEW){const cx=x+DDX;for(const u of A){u.x=cx+(Math.random()-.5)*60;u.y=y+70+Math.random()*20;u.path=[];}const as=makeAssign(A,cx,y);res.push(as.filter(a=>a.cov).length+'/'+as.length);}
  return{ok:res.every(r=>r==='4/4'),res,otherSquadWasIn:near};});
await ok('a shell 6.5 m off (outside its blast): nobody moves for it',()=>{const u=players.find(p=>p.team==='A'&&alive(p));u.path=[];u.lastOrder=-99;const R=50,x=u.x+R+15,y=u.y;
  nades.push({x0:x,y0:y-300,x1:x,y1:y,t:0,dur:2.6,by:enemies.find(e=>!beaten(e))||{x,y:y-300,side:'E'},enemy:true,R,D:78});dodgeTick();return{ok:!u.path.length,moved:u.path.length>0};});
await ok('a shell on a man: he gets out of the blast, to the spot fewest guns can see',()=>{const u=players.find(p=>p.team==='A'&&alive(p));u.path=[];u.lastOrder=-99;const R=50,x=u.x+12,y=u.y;
  nades.push({x0:x,y0:y-300,x1:x,y1:y,t:0,dur:2.6,by:enemies.find(e=>!beaten(e))||{x,y:y-300,side:'E'},enemy:true,R,D:78});dodgeTick();
  const e=u.path.length?u.path[u.path.length-1]:null;return{ok:!!e&&hyp(e.x-x,e.y-y)>R,to:e&&[Math.round(e.x),Math.round(e.y)],out:e&&Math.round(hyp(e.x-x,e.y-y)),openThere:e&&ddOpenN(e.x,e.y),openHere:ddOpenN(u.x,u.y)};});
await ok('the village and the counterattack: no shell-hole cover there (the beach\'s holes only)',()=>{startVillage({skip:true});RUN(1);const h=DD_HOLES[0];return{ok:ddHoleCover(h.x+DDX,h.y,h.x+DDX+400,h.y)===0&&DD_MODE==='village'};});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();
