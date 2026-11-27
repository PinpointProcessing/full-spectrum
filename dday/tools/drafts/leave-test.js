// Why do the squads leave where they were put? (Bryan, after Version 174: "The troops run out and away from where I put them too often. Sometimes they
// throw themselves into an open line of fire.") A real fight with no orders after the first: the played squad put in cover, then every move a man makes
// by himself logged with what made it (the function that gave him the path), how far, and whether where he went was in the open to an enemy that's
// shooting. node leave-test.js [MAP beach|village] [SECS] [SEED] [PORT] [VARIANT base|smart|hold]
// The variants are drafts patched in here, not in the game: smart = a shell dodged only from inside its blast and to the spot out of it that the
// fewest guns can see, and the run for cover / shift to cover counting every gun that can reach (not just those within 38 m) and going only where
// none of them has an open shot; hold = the same dodge, and no run or shift at all (they stay where they're put).
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');
const MAP=process.argv[2]||'beach',SECS=+process.argv[3]||120,SEED=+process.argv[4]||1,PO=+process.argv[5]||0,VAR=process.argv[6]||'base';
(async()=>{const port=9975+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${port}/index.html?noseq&gfx=0`);await page.setViewportSize({width:390,height:760});
const ev=(f,a)=>page.evaluate(f,a);
await ev(([SEED,VAR])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=3;R.battles=3;R.minLevel=4;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,4,false)));for(let i=0;i<8;i++)R.reserve.push(ddmNewMan('rifle',4,false));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919);window.requestAnimationFrame=()=>0;
  window.RUN1=()=>{update(1/30);panTick(1/30);ddFrame(1/30,simT);};
  // the log: every function that can give one of ours a path by himself, wrapped; whoever's way's end changed inside it is put down to it
  // how many guns that can reach a spot have an open shot at it
  window.OPENN=(x,y)=>{let n=0;for(const e of enemies){if(beaten(e)||e.side!=='E'||!e.alerted||e.dormant||e.mon)continue;if(hyp(e.x-x,e.y-y)>ddFireR(e)||!los(e.x,e.y,x,y))continue;if(coverAt(x,y,e.x,e.y)===0)n++;}return n;};
  if(VAR==='ride')DD_HOLE_RIDE=true;   // (Version 176: men in a shell hole ride out shells landing outside it; off in the game)
  if(VAR==='smart'||VAR==='hold'){
    // the shell dodge: only from inside its blast, to the spot out of it the fewest guns have an open shot at (cover points within 14 m first)
    window.dodgeTick=function(){for(const n of nades){if(!n.enemy||n.dodged)continue;n.dodged=true;const R=n.R||ENADE.r;
      for(const p of players){if(!alive(p)||p.offMap||p.inBoat||hyp(p.x-n.x1,p.y-n.y1)>R+6||simT-p.lastOrder<1)continue;
        const others=players.filter(o=>o!==p&&!o.dead).map(destOf),C=[];
        for(const c of coverPts){const d=hyp(c.x-p.x,c.y-p.y);if(hyp(c.x-n.x1,c.y-n.y1)<R+14||d>140)continue;if(others.some(o=>hyp(o.x-c.x,o.y-c.y)<SPACE_COVER))continue;C.push({x:c.x,y:c.y,d});}
        const a=Math.atan2(p.y-n.y1,p.x-n.x1);for(const da of[0,.7,-.7,1.4,-1.4]){const x=n.x1+Math.cos(a+da)*(R+16),y=n.y1+Math.sin(a+da)*(R+16);if(isFree(x,y,8))C.push({x,y,d:hyp(x-p.x,y-p.y)});}
        let best=null,bs=1e9;for(const c of C){const sc=OPENN(c.x,c.y)*60+c.d;if(sc<bs){bs=sc;best=c;}}
        const path=best&&findPath(p.x,p.y,best.x,best.y);if(path){p.path=path;p.gaitForce=null;callout(p,'Move!',C.warn);}}}};
    if(VAR==='hold'){const f0=playerThink;window.playerThink=function(p){if(p&&p.side==='P'&&!p.npc){p.exposeT=0;return;}return f0.apply(this,arguments);};}   // (the squads only: the boats' men as they are)
    else{
      // every gun that can reach, not just those within 38 m; and only to a spot none of them has an open shot at
      window.playerThink=(0,eval)('('+playerThink.toString().replace('hyp(e.x-p.x,e.y-p.y)<=380','hyp(e.x-p.x,e.y-p.y)<=ddFireR(e)')+')');
      const d0=dashToCover;window.dashToCover=function(p,sh){const r=d0.apply(this,arguments);if(r&&p.dash&&OPENN(p.dash.x,p.dash.y)>0&&OPENN(p.dash.x,p.dash.y)>=OPENN(p.x,p.y)){p.path=[];p.dash=null;return false;}return r;};
    }
  }
  window.MOVES=[];window.TAG=null;const dest=u=>{const d=destOf(u);return d?Math.round(d.x)+','+Math.round(d.y):''};
  const exposed=(x,y)=>{let open=0,shooters=0;for(const e of enemies){if(beaten(e)||e.side!=='E'||!e.alerted)continue;if(hyp(e.x-x,e.y-y)>ddFireR(e)||!los(e.x,e.y,x,y))continue;shooters++;if(coverAt(x,y,e.x,e.y)===0)open++;}return{open,shooters};};
  window.EXPOSED=exposed;
  const wrap=name=>{const f=window[name];if(typeof f!=='function')return;window[name]=function(){const snap=new Map(players.map(u=>[u,dest(u)]));const outer=TAG;TAG=TAG||name;const r=f.apply(this,arguments);
    if(!outer){for(const u of players){if(u.dead||!snap.has(u))continue;const d=dest(u);if(d!==snap.get(u)&&u.path.length){const e=u.path[u.path.length-1],x0=u.x,y0=u.y,ex=exposed(e.x,e.y),ex0=exposed(x0,y0);
      MOVES.push({t:+simT.toFixed(1),cause:name,id:u.id,team:u.team,played:u.team===dd.active,m:Math.round(hyp(e.x-x0,e.y-y0)/10),fromOpen:ex0.open>0,toOpen:ex.open>0,openFrom:ex0.open,openTo:ex.open,shooters:ex.shooters,hp:Math.round(u.hp)});}}}
    if(!outer)TAG=null;return r;};};
  for(const n of['dashToCover','playerThink','ddHelpers','ddMedics','dodgeTick','retTick','ddJoin','fpTools','ddcSupport','ddSquadAI','vgFollow','throwTick','medTick','ddWaves','vgReplace','ddcLeadCheck'])wrap(n);
  // a move that none of them made (some other rule): caught each tick
  window.TICKCHK=()=>{for(const u of players){if(u.dead)continue;const d=dest(u);if(u._ld!==undefined&&d!==u._ld&&u.path.length&&!MOVES.some(m=>m.id===u.id&&m.t===+simT.toFixed(1))){const e=u.path[u.path.length-1],ex=exposed(e.x,e.y);MOVES.push({t:+simT.toFixed(1),cause:'other',id:u.id,team:u.team,played:u.team===dd.active,m:Math.round(hyp(e.x-u.x,e.y-u.y)/10),toOpen:ex.open>0,shooters:ex.shooters,hp:Math.round(u.hp)});}u._ld=d;}};
},[SEED,VAR]);
if(MAP==='village')await ev(()=>{startVillage({skip:true});});else await page.click('#ddBtn');
await page.waitForTimeout(500);
const r=await ev(([MAP,SECS,VAR])=>{
  if(MAP==='beach'){let n=0;while(!dd.land.done&&n++<300)RUN1();for(let i=0;i<60;i++)RUN1();}else{for(let i=0;i<60;i++)RUN1();}
  // the played squad put in cover a little forward of where it is (the one order of the test), then left alone
  const L=players.filter(p=>p.team===dd.active&&alive(p)),m={x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length};
  const as=makeAssign(L,m.x,m.y-(MAP==='beach'?80:120));if(as.length)commit(as);for(let i=0;i<300;i++)RUN1();   // (10 s to get there)
  MOVES.length=0;for(const u of players)u._ld=undefined;const start=simT;
  let hit=0,downs=0;const dm0=damage;window.damage=function(t,d){const h0=t&&t.hp;const r=dm0.apply(this,arguments);if(t&&t.side==='P'&&t.team===dd.active&&!t.npc&&typeof h0==='number')hit+=Math.max(0,h0-Math.max(0,t.hp));return r;};
  const wasDown=new Map(),spot=new Map(L.map(u=>[u,destOf(u)]));let away=0,far=0,samples=0;   // (where each was put: how far from it they are, sampled every second)   // (where each was sent: the end of his move if he's still on his way)
  for(let i=0;i<SECS*30;i++){RUN1();if(i%3===0){TICKCHK();for(const u of players){if(u.team!==dd.active)continue;const d=!!(u.downed||u.dead);if(d&&!wasDown.get(u))downs++;wasDown.set(u,d);}}
    if(i%30===0)for(const u of L){if(!alive(u))continue;const s0=spot.get(u),d=hyp(u.x-s0.x,u.y-s0.y)/10;away+=d;if(d>4)far++;samples++;}}
  const P=MOVES.filter(m=>m.played),O=MOVES.filter(m=>!m.played),by=L=>{const o={};for(const m of L){const k=m.cause;o[k]=o[k]||{n:0,toOpen:0,metres:0};o[k].n++;if(m.toOpen)o[k].toOpen++;o[k].metres+=m.m;}return o;};
  const worse=P.filter(m=>m.openTo>m.openFrom).length,dead=units.filter(u=>u.corpse&&u.team===dd.active&&u.deadT>=start).length;
  return{map:MAP,secs:SECS,variant:VAR,played:{moves:P.length,toOpen:P.filter(m=>m.toOpen).length,worse,hpLost:Math.round(hit),downs,dead,awayM:+(away/Math.max(1,samples)).toFixed(1),farPct:Math.round(100*far/Math.max(1,samples)),byCause:by(P)},other:{moves:O.length,byCause:by(O)},
    down:players.filter(p=>p.downed).length,lost:dd.lost,sample:P.slice(0,10)};},[MAP,SECS,VAR]);
console.log(JSON.stringify(r,null,1));console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
