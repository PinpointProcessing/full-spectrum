// Draft after Version 219 (Bryan: "Can we have all the ai troops advance continuously, let them get progressively weaker as they advance, so much so that
// they die with just one bullet or even suppressive fire the farther they venture ahead. It just would look better to see troops moving everywhere instead
// of just stopping mid way and waiting for the player. They can even help slightly so the enemy just doesn't focus on the player's position constantly.
// (It should still stay relatively hard - it's mostly for the visual effect)"). Nothing in the game is changed: the variant is patched into the page.
//   now    the game as it is: the other troops keep 5 to 9 m behind the squads' front
//   surge  they keep going up the way; every metre a man is ahead of the squads' front he takes more from a hit (x2 at 8 m), any hit kills from 25 m,
//          and from 40 m being shot at is enough; his own aim falls off faster (next to nothing from 16 m); they don't take places; more of them keep landing (and, off the beach, come up from the
//          place held before the last)
// node troops-surge-draft.js MODE VARIANT SEED [OUT] [PORT] [SECS] [FPS]
//   MODE sim: real fighting, a bot plays Alpha (a move 15 m up the way every 7 s, fire on what it sees), the numbers as JSON on the last line
//        film: the same fight, the squads taking a quarter of the damage so it lasts, frames to OUT/00001.jpg ... from a camera over Alpha
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const MODE=process.argv[2]||'sim',VAR=process.argv[3]||'surge',SEED=+process.argv[4]||1,OUT=process.argv[5]||'.',PO=+process.argv[6]||0,SECS=+process.argv[7]||(MODE==='film'?50:180),FPS=+process.argv[8]||6,W=390,H=760;
const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');if(MODE==='film')fs.mkdirSync(OUT,{recursive:true});
(async()=>{const port=9930+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:MODE==='film'?1.25:1});const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
await page.goto(`http://localhost:${port}/index.html?gfx=${MODE==='film'?1:0}`);await page.waitForTimeout(2500);const ev=(f,a)=>page.evaluate(f,a);
await ev(([MODE,VAR,SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(7000+SEED);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);if((window.BT=(window.BT||0)+1/30)>=.5){BT=0;if(window.TICK)TICK();}}};
  // what's counted
  window.N={dmg:{A:0,B:0},byNpc:0,bySq:0,npcDead:0,n:0,alive:0,ahead:0,lead:0,leadMax:0,shotsNpc:0,shotsSq:0,downs:0,down0:{}};
  const d0=damage;damage=function(t,d,s){if(MODE==='film'&&t.side==='P'&&!t.npc)d*=.25;const h0=t.hp,dead0=t.dead;const r=d0.apply(this,arguments);
    if(t.side==='P'&&!t.npc&&N.dmg[t.team]!=null)N.dmg[t.team]+=Math.max(0,h0-Math.max(0,t.hp||0));
    if(t.side==='E'&&!dead0&&(t.dead||t.hp<=0)&&s){if(s.npc)N.byNpc++;else if(s.side==='P')N.bySq++;}return r;};},[MODE,VAR,SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(([MODE,VAR])=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);
  const R=DD_ROUTE.map(([x,y])=>({x:x+DDX,y})),cum=[0];for(let i=1;i<R.length;i++)cum.push(cum[i-1]+hyp(R[i].x-R[i-1].x,R[i].y-R[i-1].y));window.ROUTE={R,cum,len:cum[cum.length-1]};
  window.PROG=(x,y)=>{let best=1e9,s=0;for(let i=1;i<R.length;i++){const a=R[i-1],c=R[i],L=cum[i]-cum[i-1],t=clamp(((x-a.x)*(c.x-a.x)+(y-a.y)*(c.y-a.y))/(L*L),0,1),px=a.x+(c.x-a.x)*t,py=a.y+(c.y-a.y)*t,d=hyp(x-px,y-py);if(d<best){best=d;s=cum[i-1]+t*L;}}return s;};
  window.AT=s=>{s=clamp(s,0,ROUTE.len);let i=1;while(i<R.length-1&&cum[i]<s)i++;const a=R[i-1],c=R[i],t=(s-cum[i-1])/(cum[i]-cum[i-1]||1);return{x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t};};
  selectTeam('A');dd.active='A';const mid=L=>({x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length});
  // the player: Alpha, a bot
  window.BOT={next:0,moves:0};
  const bot=()=>{const A=players.filter(p=>p.team==='A'&&alive(p)&&!p.inBoat&&!p.joining);if(!A.length)return;
    if(!A.some(u=>u.focus&&!beaten(u.focus))){const e=enemies.filter(e=>!beaten(e)&&(e.seen||e.vis)&&A.some(u=>hyp(u.x-e.x,u.y-e.y)<=wRange(u)&&fireLine(u,e))).sort((a,c)=>hyp(a.x-A[0].x,a.y-A[0].y)-hyp(c.x-A[0].x,c.y-A[0].y))[0];if(e)orderFire(A,e);}
    if(simT<BOT.next||A.some(u=>u.path.length))return;
    const M=mid(A),s0=PROG(M.x,M.y);for(const k of[150,110,190,70]){const q=AT(Math.min(ROUTE.len,s0+k)),as=makeAssign(A,q.x,q.y);if(as.length){commit(as);BOT.moves++;break;}}BOT.next=simT+7;};
  // ---- the draft ----
  const SG={k:+(window.SGK||80),kill:250,sup:400,aimPer:250,aim:.65,cap:34,every:[6,9]};window.SG=SG;const lead=u=>dd.front-u.y;   // (how far north of the squads' front, in units of 10 cm)
  if(VAR==='surge'){
    ddLine=()=>DD_LINES[DD_LINES.length-1];                                    // no waiting on the squads: up the way as far as it goes
    const D0=ddDamage;ddDamage=function(t,dmg,src){if(t.npc&&!t.inBoat){const L=lead(t);if(L>0)dmg*=L>=SG.kill?60:1+L/SG.k;}return D0.call(this,t,dmg,src);};
    const Z0=ddZones;ddZones=function(){const a=dd.allies;dd.allies=a.filter(u=>!u.npc||u.raid);try{return Z0.apply(this,arguments);}finally{dd.allies=a;}};   // (a place is taken by the squads, or by the troops sent for a bunker the squads went past, not by whoever wandered in)
    const W0=ddWaves;ddWaves=function(){const live=dd.npcs.filter(u=>!u.dead).length;
      if(simT>(SG.next||0)&&live<SG.cap&&!dd.won&&simT>dd.t0+30){SG.next=simT+SG.every[0]+Math.random()*(SG.every[1]-SG.every[0]);const from=dd.front<150?ddSpawnAt():null;
        if(from){for(let k=0;k<5;k++){const sp=openSpot(from.x+(Math.random()-.5)*60,from.y+(Math.random()-.5)*40,dd.allies.map(destOf))||from,u=ddNpc(sp.x,sp.y);u.seen=true;}}
        else{const lanes=[90,200,300,400,600,700,800,910].filter(x=>!dd.boats.some(b=>Math.abs(b.x-DDX-x)<70));if(lanes.length)ddBoat(lanes[(Math.random()*lanes.length)|0]+(Math.random()-.5)*40,ddCrew(6+((Math.random()*3)|0)));}}
      return W0.apply(this,arguments);};}
  window.TICK=()=>{bot();const np=dd.npcs.filter(u=>!u.dead&&!u.inBoat);
    if(VAR==='surge')for(const u of np){const L=lead(u);u.aimK=-.1-clamp(L/SG.aimPer,0,SG.aim);if(L>=SG.sup&&(u.sup||0)>.45)ddDamage(u,999,null);}   // (that far ahead, being shot at is enough)
    N.n++;N.alive+=np.length;const ah=np.filter(u=>lead(u)>30);N.ahead+=ah.length;for(const u of ah){N.lead+=lead(u)/10;N.leadMax=Math.max(N.leadMax,lead(u)/10);}N.aheadN=(N.aheadN||0)+ah.length;
    for(const e of enemies){if(beaten(e)||!e.target||simT-(e.shotAtT??-99)>.6)continue;if(e.target.npc)N.shotsNpc++;else if(e.target.side==='P')N.shotsSq++;}
    for(const u of players){if(u.downed&&!N.down0[u.id]){N.down0[u.id]=1;N.downs++;}if(!u.downed)N.down0[u.id]=0;}};
  window.OUTN=()=>{const A=players.filter(p=>p.team==='A'&&alive(p));return{secs:Math.round(simT-dd.t0),npcLost:dd.npcLost,npcAlive:+(N.alive/N.n).toFixed(1),npcAhead:+(N.ahead/N.n).toFixed(1),leadAvg:+(N.lead/Math.max(1,N.aheadN)).toFixed(1),leadMax:Math.round(N.leadMax),
    enemyDownByTroops:N.byNpc,enemyDownBySquads:N.bySq,enemyLeft:enemies.filter(e=>!beaten(e)).length,shotsAtTroopsPct:Math.round(100*N.shotsNpc/Math.max(1,N.shotsNpc+N.shotsSq)),squadDamage:Math.round(N.dmg.A+N.dmg.B),squadDowns:N.downs,squadLost:dd.lost,pool:dd.pool,
    progress:Math.round((A.length?PROG(mid(A).x,mid(A).y):0)/10),held:Object.keys(dd.held||{}).filter(k=>dd.held[k]).join(' '),moves:BOT.moves};};},[MODE,VAR]);
if(MODE==='sim'){for(let t=0;t<SECS;t+=10){await ev(()=>RUN(10));}const r=await ev(()=>OUTN());console.log(JSON.stringify({variant:VAR,seed:SEED,...r,errors:errors.length}));if(errors.length)console.log(errors.slice(0,3));await b.close();srv.close();return;}
// film
await ev(([VAR])=>{window.SHOOT=()=>{const A=players.filter(p=>p.team==='A'&&alive(p)&&!p.inBoat),M=A.length?{x:A.reduce((a,u)=>a+u.x,0)/A.length,y:A.reduce((a,u)=>a+u.y,0)/A.length}:window.LASTM||{x:DDX+400,y:600};window.LASTM=M;
    const C=window.FC||(window.FC={x:M.x,z:M.y-150});C.x+=(M.x-C.x)*.08;C.z+=(M.y-150-C.z)*.08;
    dd.track=null;camPan=null;shakeK=0;yaw=0;zoom=3.3;tilt=ddTilt(zoom,DD_CAM.route);camShift=DD_CAM.shift;camT.x=C.x;camT.z=C.z;render(.0001,simT);drawOverlay(.03,simT);
    ox.save();ox.font='800 20px system-ui,Arial';ox.fillStyle='rgba(8,12,16,.75)';ox.fillRect(0,0,cw,34);ox.fillStyle=VAR==='surge'?'#ffce60':'#cfd8e0';ox.fillText(VAR==='surge'?'DRAFT · TROOPS KEEP ADVANCING':'NOW',10,24);
    const np=dd.npcs.filter(u=>!u.dead&&!u.inBoat);ox.font='700 13px system-ui,Arial';ox.fillStyle='#e8edf2';ox.fillText(`${np.length} other troops up · ${dd.npcLost} lost`,10,cw>400?52:52);ox.restore();};},[VAR]);
await ev(()=>RUN(8));const nfr=Math.ceil(SECS*FPS),t0=Date.now();
for(let f=0;f<nfr;f++){await ev(([dt,first])=>{if(!first)RUN(dt);hud();SHOOT();},[1/FPS,f===0]);await page.screenshot({path:`${OUT}/${String(f+1).padStart(5,'0')}.jpg`,type:'jpeg',quality:82});
  if(f%60===0)console.log('  frame',f+1,'/',nfr,((Date.now()-t0)/1000/(f+1)).toFixed(2),'s a frame');}
const r=await ev(()=>OUTN());fs.writeFileSync(`${OUT}/info.json`,JSON.stringify({variant:VAR,seed:SEED,fps:FPS,frames:nfr,...r}));console.log('film',VAR,JSON.stringify(r),'errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
