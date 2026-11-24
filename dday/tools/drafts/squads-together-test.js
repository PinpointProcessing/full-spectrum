// Version 180 (Bryan, after the follow drafts: side by side; "let the ai/npc determine if a pincer move is a good move at the moment. Let's make
// the squads work together actively"): the team tabs back with a FOLLOW / HOLD switch on the other squad's tab (real clicks), HOLD and FOLLOW,
// side by side, covering fire while yours runs under fire, the pincer when it's safe and not when another gun sees the spot, a grenade at a
// dug-in man, swapping squads (the one let go stays put), you play the other when yours are all down, the village and the counterattack.
// node squads-together-test.js [SEED] [PORT]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const SEED=+process.argv[2]||1,PO=+process.argv[3]||0;
(async()=>{const port=9940+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);let fails=0;
const ok=async(l,f,a)=>{let r;try{r=await ev(f,a);}catch(e){r={ok:false,err:String(e).slice(0,300)};}if(!r||r.ok===false){fails++;console.log('FAIL',l,JSON.stringify(r));}else console.log('ok',l,JSON.stringify(r));return r;};
await ok('start card: no Lead one squad switch, Tap an enemy for actions still there',()=>({ok:!document.querySelector('#ddCtlLead')&&!!document.querySelector('#ddCtlRing'),legend:document.querySelector('fieldset.ddctl legend').textContent}));
await ev(([SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){if(window.HOOK)HOOK();update(1/30);panTick(1/30);ddFrame(1/30,simT);if(i%10===0){drawOverlay(.03,simT);hud();}}};   // (HOOK: a test's own doing every frame)
  const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);   // (nobody of ours hurt)
  window.SQ=t=>players.filter(p=>p.team===t&&alive(p)&&!p.inBoat);
  window.MID=L=>({x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length});
  window.DMID=L=>MID(L.map(destOf));
  window.CLEAR=()=>{for(const e of enemies)if(!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.shellT={heavy:1e12,cannon:1e12,art:1e12};dd.ctr={on:true,sq:4,t:1e12};};   // (and the counterattack kept back)
  window.PUT=(t,x,y)=>{const L=SQ(t);L.forEach((u,k)=>Object.assign(u,{x:x+(k-1.5)*14,y,path:[],inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,ret:null,dash:null,sup:0,lastOrder:-99,focus:null,supT:null}));const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];}};
  window.MOVE=(t,x,y)=>{const as=makeAssign(SQ(t),x,y);if(as.length)commit(as);return as.length;};
  window.FOE=(x,y,ang)=>{const e=ddFoe('t',x-DDX,y,{ang:ang??Math.PI/2});enemies.push(e);Object.assign(e,{seen:true,vis:true,alerted:true,hp:1e6,nade:0});return e;};   // (hard to kill: the squads would drop him in a second and the test would see them already done)
  window.RESET=()=>{dd.supS={};dd.sup={A:'follow',B:'follow'};};},[SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);});
await ok('after landing: the team tabs show, Alpha\'s filled, Bravo\'s carries FOLLOW',()=>{const tabs=getComputedStyle(document.querySelector('.panel')).display!=='none',ta=document.querySelector('.tab[data-team="A"]'),tb=document.querySelector('.tab[data-team="B"]'),cb=tb.querySelector('.ddchip'),ca=ta.querySelector('.ddchip');
  return{ok:tabs&&ta.classList.contains('ddon')&&!!cb&&!cb.hidden&&cb.textContent==='FOLLOW'&&(!ca||ca.hidden)&&!document.querySelector('#ddSwap:not([hidden])'),tabs,chip:cb&&cb.textContent,active:dd.active};});
// HOLD by a real click on the switch: the tab itself isn't tapped (Alpha stays the one played)
const chip=async t=>{const r=await ev(t=>{const c=document.querySelector(`.tab[data-team="${t}"] .ddchip`);if(!c||c.hidden)return null;const q=c.getBoundingClientRect();return[q.left+q.width/2,q.top+q.height/2];},t);if(r)await page.mouse.click(r[0],r[1]);return!!r;};
await ev(()=>{CLEAR();const R=DD_ROUTE;PUT('A',R[1][0]+DDX,R[1][1]);PUT('B',R[1][0]+DDX+100,R[1][1]+10);RESET();RUN(2);});
await chip('B');
await ok('a click on Bravo\'s switch: HOLD, and Alpha is still the squad played',()=>{const c=document.querySelector('.tab[data-team="B"] .ddchip');return{ok:ddcMode('B')==='hold'&&c.textContent==='HOLD'&&c.classList.contains('hold')&&dd.active==='A',mode:ddcMode('B'),active:dd.active};});
await ok('on HOLD: Alpha moves 15 m up, Bravo stays where it is',()=>{const b0=MID(SQ('B'));const R=DD_ROUTE;MOVE('A',R[2][0]+DDX,R[2][1]);RUN(9);const b1=MID(SQ('B'));return{ok:hyp(b1.x-b0.x,b1.y-b0.y)<60,moved:Math.round(hyp(b1.x-b0.x,b1.y-b0.y)/10)};});
await chip('B');
await ok('a second click: FOLLOW again',()=>({ok:ddcMode('B')==='follow'&&document.querySelector('.tab[data-team="B"] .ddchip').textContent==='FOLLOW'}));
// side by side, nobody shooting
await ev(()=>{const R=DD_ROUTE;PUT('A',R[1][0]+DDX,R[1][1]);PUT('B',R[1][0]+DDX+100,R[1][1]+10);RESET();RUN(3);});
await ok('side by side: the moment Alpha is sent 15 m up, Bravo goes too, to beside where Alpha is going',()=>{const R=DD_ROUTE;MOVE('A',R[2][0]+DDX,R[2][1]);RUN(1.5);const going=SQ('B').filter(u=>u.path.length).length;
  const D=DMID(SQ('A')),B=DMID(SQ('B')),f=ddRouteWay(D.x,D.y),fw=(B.x-D.x)*f.x+(B.y-D.y)*f.y,side=(B.x-D.x)*-f.y+(B.y-D.y)*f.x;
  return{ok:going>=3&&side>55&&side<150&&Math.abs(fw)<70,going,side:+(side/10).toFixed(1),forward:+(fw/10).toFixed(1)};});
await ok('and there a few seconds later (Bravo on Alpha\'s right, level with it)',()=>{RUN(8);const A=MID(SQ('A')),B=MID(SQ('B')),f=ddRouteWay(A.x,A.y),fw=(B.x-A.x)*f.x+(B.y-A.y)*f.y,side=(B.x-A.x)*-f.y+(B.y-A.y)*f.x;
  return{ok:side>50&&side<160&&Math.abs(fw)<80,side:+(side/10).toFixed(1),forward:+(fw/10).toFixed(1),act:dd.supS.B.act};});
// covering fire: Alpha sent off while a man is shooting at it
await ok('Alpha sent off under fire: Bravo pins down the man shooting at Alpha (COVERING) and stays put meanwhile',()=>{const A=SQ('A'),R=DD_ROUTE,G=FOE(R[4][0]+DDX+60,R[4][1]-40);window.G1=G;
  const b0=MID(SQ('B'));window.HOOK=()=>{G.target=SQ('A')[0];G.shotAtT=simT;};MOVE('A',R[3][0]+DDX,R[3][1]);RUN(2.4);   // (he keeps shooting at Alpha)
  const pins=SQ('B').filter(u=>u.supT&&hyp(u.supT.x-G.x,u.supT.y-G.y)<60).length,b1=MID(SQ('B'));
  return{ok:dd.supS.B.act==='cover'&&pins>=1&&hyp(b1.x-b0.x,b1.y-b0.y)<40,act:dd.supS.B.act,pinning:pins,moved:Math.round(hyp(b1.x-b0.x,b1.y-b0.y)/10)};});
await ok('once Alpha is there, Bravo moves up beside it',()=>{RUN(10);window.HOOK=null;G1.hp=0;G1.dead=true;RUN(6);const A=MID(SQ('A')),B=MID(SQ('B'));
  return{ok:dd.supS.B.act!=='cover'&&hyp(B.x-A.x,B.y-A.y)<200,act:dd.supS.B.act,apart:Math.round(hyp(B.x-A.x,B.y-A.y)/10)};});
// the pincer on the top: one man behind a crate, nobody else about
const pincer=await ev(()=>{CLEAR();RESET();
  let c=null,dir=null;
  for(const o of objs.filter(o=>o.cover>=1&&!o.full&&o.y<-470&&o.y>-740&&o.x>DDX+100&&o.x<DDX+1050&&o.w<40&&o.h<40)){const cx=o.x+o.w/2,cy=o.y+o.h/2;
    for(const[dx,dy]of[[0,-1],[0,1],[1,0],[-1,0]])for(const k of[18,22,26]){const fx=cx+dx*k,fy=cy+dy*k,ax=cx-dx*170,ay=cy-dy*170,bx=ax-dy*100,by=ay+dx*100;
      if(isFree(fx,fy)&&isFree(ax,ay)&&isFree(bx,by)&&coverAt(fx,fy,ax,ay)>0&&los(ax,ay,fx,fy)){c=o;dir=[dx,dy,k];break;}}if(c)break;}
  if(!c)return null;const cx=c.x+c.w/2,cy=c.y+c.h/2,[dx,dy,k]=dir;window.PZ={cx,cy,dx,dy,k};return{at:[Math.round(cx),Math.round(cy)],dir};});
console.log('  the crate:',JSON.stringify(pincer));
await ev(()=>{window.BAN=[];const b0=banner;banner=function(t){BAN.push(t);return b0.apply(this,arguments);};});
const SETUP=`const{cx,cy,dx,dy,k}=PZ;const ax=cx-dx*170,ay=cy-dy*170;
  dd.ctr={on:true,sq:4,t:1e12};for(const e of enemies)if(e!==window.F1&&!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}   // (nobody else of theirs about: the counterattack kept back)
  for(const n of dd.npcs||[])if(!n.dead)Object.assign(n,{x:DDX+500+(Math.random()-.5)*200,y:640,path:[]});   // (the other troops back on the beach, out of the way)
  if(window.F1){Object.assign(F1,{x:cx+dx*k,y:cy+dy*k,path:[]});window.HOOK=()=>{F1.x=cx+dx*k;F1.y=cy+dy*k;F1.path=[];};}   // (he stays behind his cover: the game moves a man who's been flanked)
  const place=(t,x,y)=>SQ(t).forEach((u,i)=>Object.assign(u,{x:x+(-dy)*(i-1.5)*16,y:y+dx*(i-1.5)*16,path:[],lastOrder:-99,focus:null,supT:null,sup:0,grenade:0,throwGo:null}));
  place('A',ax,ay);place('B',ax-dy*100,ay+dx*100);RESET();dd.track=null;`;
await ok('the man Alpha is shooting dug in behind cover, nobody else about: Bravo flanks him; its gunner stays and pins him down, the others go to cover where he has none',(SETUP)=>{
  const{cx,cy,dx,dy,k}=PZ;const F=FOE(cx+dx*k,cy+dy*k,Math.atan2(-dy,-dx));window.F1=F;eval(SETUP);for(const u of SQ('A'))u.focus=F;BAN.length=0;
  RUN(1.2);const S=dd.supS.B,g=S.fl;if(!g)return{ok:false,act:S.act,why:'no pincer'};
  const gun=g.gun&&players.find(p=>p.id===g.gun),goers=g.ids.map(id=>players.find(p=>p.id===id));
  const clean=goers.filter(u=>{const e=destOf(u);return los(e.x,e.y,F.x,F.y)&&coverAt(F.x,F.y,e.x,e.y)===0;}).length;
  return{ok:S.act==='flank'&&goers.length>=2&&clean>=2&&(!gun||(gun.supT&&hyp(gun.supT.x-F.x,gun.supT.y-F.y)<60&&!gun.path.length))&&BAN.some(t=>/flanks/.test(t)),act:S.act,going:goers.length,cleanShots:clean,gunnerPinning:!!(gun&&gun.supT),banner:BAN.filter(t=>/flank/.test(t))};},SETUP);
// the picture: the arrow and the man marked, for a look
await ev(()=>{const g=dd.supS.B.fl,F=F1,A=MID(SQ('A'));camPan=null;dd.track=null;zoom=3.2;yaw=0;tilt=ddTilt(zoom,DD_CAM.route);camT.x=(F.x+A.x)/2;camT.z=(F.y+A.y)/2+40;clampCam();updateCamera();RUN(.4);render(.03,simT);drawOverlay(.03,simT);hud();});
await page.waitForTimeout(300);await ev(()=>{render(.03,simT);drawOverlay(.03,simT);});await page.screenshot({path:(process.env.OUT||'.')+'/squads-pincer.png'});
await ok('once they\'re in place, all of Bravo shoots him',()=>{RUN(10);const S=dd.supS.B,g=S.fl;if(!g)return{ok:false,why:'pincer over early',act:S.act};const on=SQ('B').filter(u=>u.focus===F1).length;return{ok:!!g.there&&on>=2,there:!!g.there,onHim:on};});
await ok('he goes down: Bravo holds its cover there (no walk back across the ground it flanked over) until Alpha moves on, then comes up beside it',()=>{
  const B0=MID(SQ('B'));window.HOOK=null;F1.hp=0;F1.dead=true;RUN(3);const S=dd.supS.B,B1=MID(SQ('B')),held=!S.fl&&!!S.stay&&hyp(B1.x-B0.x,B1.y-B0.y)<80;
  const{cx,cy,dx,dy}=PZ,A=SQ('A'),tx=MID(A).x-dy*220,ty=MID(A).y+dx*220,as=makeAssign(A,tx,ty);for(const q of as)Object.assign(q.u,{path:q.path,lastOrder:simT});RUN(5);
  const D=DMID(A),Bd=DMID(SQ('B'));return{ok:held&&!S.stay&&as.length>0&&hyp(Bd.x-D.x,Bd.y-D.y)<220,held,stayAfter:!!S.stay,movedWhileHeld:Math.round(hyp(B1.x-B0.x,B1.y-B0.y)/10),apartAfter:Math.round(hyp(Bd.x-D.x,Bd.y-D.y)/10)};});
await ok('a flanker goes down: the pincer is called off and Bravo goes to ground where it is (holds until Alpha moves on)',(SETUP)=>{const{cx,cy,dx,dy,k}=PZ;window.F1=FOE(cx+dx*k,cy+dy*k,Math.atan2(-dy,-dx));const F=F1;eval(SETUP);for(const u of SQ('A'))u.focus=F;BAN.length=0;RUN(1.2);const g=dd.supS.B.fl;if(!g)return{ok:false,why:'no pincer to call off'};
  const u=players.find(p=>p.id===g.ids[0]);Object.assign(u,{downed:true,hp:0});RUN(1.2);const S=dd.supS.B,r={ok:!S.fl&&!!S.stay&&BAN.some(t=>/goes to ground/.test(t)),stay:!!S.stay,act:S.act,banner:BAN.slice(-1)};Object.assign(u,{downed:false,critical:false,hp:90});return r;},SETUP);
await ok('the ground round his side watched by four more guns with nothing to stop them: no pincer, Bravo stays beside Alpha',(SETUP)=>{const F=F1,{dx,dy}=PZ;eval(SETUP);
  const Gs=[];for(const[a,r]of[[1.0,200],[-1.0,200],[1.6,260],[-1.6,260]]){const b=Math.atan2(-dy,-dx)+a,x=F.x+Math.cos(b)*r,y=F.y+Math.sin(b)*r;if(isFree(x,y))Gs.push(FOE(x,y,Math.atan2(F.y-y,F.x-x)));}
  window.GS=Gs;for(const u of SQ('A'))u.focus=F;RUN(2.4);const S=dd.supS.B,A=MID(SQ('A')),B=DMID(SQ('B'));
  return{ok:!S.fl&&S.act!=='flank'&&hyp(B.x-A.x,B.y-A.y)<200,act:S.act,guns:Gs.length,apart:Math.round(hyp(B.x-A.x,B.y-A.y)/10)};},SETUP);
await ok('the same ground watched by four of theirs who haven\'t noticed anyone yet: no pincer (they would see the squad go round); with them gone there is one',(SETUP)=>{const F=F1;eval(SETUP);for(const g of window.GS||[]){g.hp=0;g.dead=true;}
  const{dx,dy}=PZ,Gs=[];for(const[a,r]of[[1.0,200],[-1.0,200],[1.6,260],[-1.6,260]]){const b=Math.atan2(-dy,-dx)+a,x=F.x+Math.cos(b)*r,y=F.y+Math.sin(b)*r;if(isFree(x,y)){const g=FOE(x,y,Math.atan2(F.y-y,F.x-x));Object.assign(g,{alerted:false,seen:false,vis:false});Gs.push(g);}}
  for(const u of SQ('A'))u.focus=F;const free=SQ('B').filter(u=>!ddcBusy(u)&&!pinnedNow(u)),planWith=!!ddcPincerPlan('B',free,SQ('A'),F),unaware=Gs.filter(g=>!g.alerted).length;
  for(const g of Gs){g.hp=0;g.dead=true;}const planWithout=!!ddcPincerPlan('B',free,SQ('A'),F);return{ok:!planWith&&planWithout&&unaware>=3,unaware,planWith,planWithout};},SETUP);
await ok('and a man of Bravo\'s with a grenade in reach throws one at the dug-in man',(SETUP)=>{eval(SETUP);for(const g of window.GS||[]){g.hp=0;g.dead=true;}for(const u of SQ('A'))u.focus=F1;const{dx,dy}=PZ,B=SQ('B');const bx=F1.x-dx*120-dy*60,by=F1.y-dy*120+dx*60;B.forEach((u,i)=>Object.assign(u,{x:bx+(-dy)*(i-1.5)*14,y:by+dx*(i-1.5)*14,grenade:1,nadeT:-99,path:[],lastOrder:-99,sup:0}));const d0=Math.min(...B.map(u=>hyp(u.x-F1.x,u.y-F1.y)));
  dd.supS.B={nadeT:-99,flT:simT};RUN(1.2);const thrown=B.filter(u=>u.throwGo||(u.grenade||0)===0||simT-(u.nadeT??-99)<3).length;return{ok:thrown>=1,thrown,nearest:Math.round(d0/10)};},SETUP);   // (flT: no pincer this moment, the throw's the test)
// swapping squads with the tab: the one let go stays put until yours moves on
await ev(()=>{window.HOOK=null;for(const e of[window.F1,...(window.GS||[])])if(e){e.hp=0;e.dead=true;}CLEAR();const R=DD_ROUTE;PUT('A',R[1][0]+DDX,R[1][1]);PUT('B',R[1][0]+DDX+100,R[1][1]+10);RESET();RUN(2);});
const tab=async t=>{const r=await ev(t=>{const q=document.querySelector(`.tab[data-team="${t}"]`).getBoundingClientRect();return[q.left+q.width/2,q.top+12];},t);await page.mouse.click(r[0],r[1]);};
await tab('B');
await ok('a click on the BRAVO tab: you play Bravo, and Alpha\'s tab now carries the switch',()=>{RUN(.5);const ca=document.querySelector('.tab[data-team="A"] .ddchip'),cb=document.querySelector('.tab[data-team="B"] .ddchip');
  return{ok:dd.active==='B'&&!!ca&&!ca.hidden&&ca.textContent==='FOLLOW'&&(!cb||cb.hidden),active:dd.active};});
await ok('Alpha, just let go, stays where it is until Bravo moves; then it comes along on Bravo\'s left',()=>{const a0=MID(SQ('A'));RUN(5);const a1=MID(SQ('A')),still=hyp(a1.x-a0.x,a1.y-a0.y)<40;
  const R=DD_ROUTE;MOVE('B',R[2][0]+DDX+100,R[2][1]);RUN(9);const A=MID(SQ('A')),B=MID(SQ('B')),f=ddRouteWay(B.x,B.y),side=(A.x-B.x)*-f.y+(A.y-B.y)*f.x;
  return{ok:still&&side<-50&&hyp(A.x-B.x,A.y-B.y)<200,still,side:+(side/10).toFixed(1)};});
await ok('everyone in the squad you play down: you play the other',()=>{for(const u of SQ('B')){u.downed=true;u.hp=0;}RUN(1.5);const r={ok:dd.active==='A',active:dd.active};for(const u of players.filter(p=>p.team==='B'))Object.assign(u,{downed:false,critical:false,hp:80});return r;});
// the village and the counterattack: the switch is there and the other squad comes along
await ev(()=>{startVillage({skip:true});});await page.waitForTimeout(300);
await ok('the village: the switch on the other tab, and a move of yours brings the other squad along',()=>{RUN(3);const o=dd.active==='A'?'B':'A',c=document.querySelector(`.tab[data-team="${o}"] .ddchip`);
  const M=MID(SQ(dd.active)),b0=DMID(SQ(o));MOVE(dd.active,M.x,M.y-140);RUN(1.5);const b1=DMID(SQ(o));return{ok:!!c&&!c.hidden&&hyp(b1.x-b0.x,b1.y-b0.y)>60,chip:c&&c.textContent,moved:Math.round(hyp(b1.x-b0.x,b1.y-b0.y)/10)};});
await ev(()=>{startCounter();});await page.waitForTimeout(300);
await ok('the counterattack: the switch on the other tab, and a move of yours brings the other squad along',()=>{RUN(4);const o=dd.active==='A'?'B':'A',c=document.querySelector(`.tab[data-team="${o}"] .ddchip`);
  const M=MID(SQ(dd.active)),b0=DMID(SQ(o));MOVE(dd.active,M.x+60,M.y-120);RUN(1.5);const b1=DMID(SQ(o));return{ok:!!c&&!c.hidden&&hyp(b1.x-b0.x,b1.y-b0.y)>60,chip:c&&c.textContent,moved:Math.round(hyp(b1.x-b0.x,b1.y-b0.y)/10)};});
await page.screenshot({path:(process.env.OUT||'.')+'/squads-together.png'});
console.log(fails?`${fails} FAILED`:'all passed','errors',errors.length,errors.slice(0,4));await b.close();srv.close();})();
