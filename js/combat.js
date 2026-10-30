"use strict";
/* Combat rules (hit chance, bursts, suppression, grenades), cover-aware move assignment, enemy and squad AI, and the sim step. */
/* ---------- peeking round corners ---------- */
// A soldier hugging a wall or container leans out past its edge to see, shoot or throw (leanPts in map.js).
// After firing from a lean he stays leaned out for PEEK_T: enemies can see and hit him there, and he counts as half cover.
const PEEK_T=1.2;
function peekOf(u){return u.peek&&simT<u.peek.until&&alive(u)&&!u.path.length?u.peek:null;}
// where u can fire at (tx,ty) from. Leaning out only when standing still.
function sightOf(u,tx,ty){return u.path.length?(los(u.x,u.y,tx,ty)?{x:u.x,y:u.y}:null):sightFrom(u.x,u.y,tx,ty);}
// line of fire from a to b: from a's spot or lean (fx,fy) to b, or to b's peek spot if b is leaned out. null if none.
function fireLine(a,b){
  const pk=peekOf(b);
  for(const t of pk?[b,pk]:[b]){
    const f=sightOf(a,t.x,t.y);
    if(f)return{fx:f.x,fy:f.y,tx:t.x,ty:t.y,lean:f.x!==a.x||f.y!==a.y,atPeek:t===pk};
  }
  return null;
}
function lineOf(s,t){return{fx:s.x,fy:s.y,tx:t.x,ty:t.y,lean:false,atPeek:false};}
function shotCover(L){return L.atPeek?1:coverAt(L.tx,L.ty,L.fx,L.fy);}
function leanOut(u,L){if(L.lean)u.peek={x:L.fx,y:L.fy,until:simT+PEEK_T};}

/* ---------- combat helpers ---------- */
function hitChance(s,t,L){
  L=L||lineOf(s,t);
  const d=hyp(L.tx-L.fx,L.ty-L.fy);
  let c=0.86-d/900;
  const cov=shotCover(L);
  if(cov===1)c-=0.28;else if(cov===2)c-=0.42;
  c-=s.sup>0.65?0.25:s.sup*0.15;
  if(s.path.length)c-=0.15;
  if(t.path.length)c-=0.08;
  if(s.side==='E')c-=0.1;
  return clamp(c,0.05,0.95);
}
function threats(){
  const t=[];
  for(const e of enemies)if(!e.dead&&e.seen)t.push(e.vis?{x:e.x,y:e.y}:e.last);
  if(!t.length)t.push({x:310,y:540});
  return t;
}
function protStats(p,th){
  let prot=0,see=0;
  for(const t of th){const l=los(t.x,t.y,p.x,p.y);if(l||sightFrom(p.x,p.y,t.x,t.y))see=1;if(!l||coverAt(p.x,p.y,t.x,t.y)>0)prot++;}
  return{prot,see};
}
function scorePt(p,th,tx,ty){const s=protStats(p,th);return s.prot/th.length*3+s.see*0.9-hyp(p.x-tx,p.y-ty)/45;}
function isCovered(p,th){return protStats(p,th).prot===th.length;}
function destOf(u){return u.path.length?u.path[u.path.length-1]:{x:u.x,y:u.y};}

function openSpot(x,y,taken){
  for(let r=0;r<=48;r+=8){
    const n=Math.max(1,Math.round(r*0.8));
    for(let k=0;k<n;k++){
      const a=k/n*Math.PI*2,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
      if(!isFree(px,py,8))continue;
      if(taken.some(t=>hyp(t.x-px,t.y-py)<20))continue;
      return{x:px,y:py};
    }
  }
  return null;
}
function makeAssign(list,tx,ty,radius){
  const th=threats();
  const others=players.filter(p=>!p.dead&&!list.includes(p)).map(destOf);
  const cands=[];
  for(const c of coverPts){
    if(hyp(c.x-tx,c.y-ty)>radius)continue;
    if(others.some(o=>hyp(o.x-c.x,o.y-c.y)<20))continue;
    cands.push({x:c.x,y:c.y,s:scorePt(c,th,tx,ty)});
  }
  if(isFree(tx,ty,8))cands.push({x:tx,y:ty,s:scorePt({x:tx,y:ty},th,tx,ty)-0.3});
  cands.sort((a,b)=>b.s-a.s);
  const res=[];
  const ord=[...list].sort((a,b)=>hyp(a.x-tx,a.y-ty)-hyp(b.x-tx,b.y-ty));
  for(const u of ord){
    let pick=null,path=null;
    for(const c of cands){
      if(res.some(q=>hyp(q.x-c.x,q.y-c.y)<20))continue;
      const p=findPath(u.x,u.y,c.x,c.y);if(!p)continue;
      pick=c;path=p;break;
    }
    if(!pick){const o=openSpot(tx,ty,[...res,...others]);if(o){const p=findPath(u.x,u.y,o.x,o.y);if(p){pick=o;path=p;}}}
    if(pick)res.push({u,x:pick.x,y:pick.y,path,cov:isCovered(pick,th)});
  }
  return res;
}
function commit(as){
  for(const a of as){a.u.path=a.path;a.u.lastOrder=simT;a.u.supT=null;a.u.exposeT=0;}
}
// Turn a finger-drawn trail into a walkable route that keeps its shape: skip points inside objects,
// route round any stretch that cuts through something, and settle the end onto cover if there is some close by.
function routeFromTrail(u,trail){
  const start={x:u.x,y:u.y},pts=[];let last=start;
  const len=a=>{let s=0,q=start;for(const p of a){s+=hyp(p.x-q.x,p.y-q.y);q=p;}return s;};
  for(const p of trail){
    if(hyp(p.x-last.x,p.y-last.y)<10||!isFree(p.x,p.y,7))continue;
    if(clearLine(last.x,last.y,p.x,p.y)){pts.push({x:p.x,y:p.y});last=p;continue;}
    // blocked: go round from whichever recent point is shortest overall, dropping any bit of line that led into a dead end
    const k0=Math.max(0,pts.length-12),shared=len(pts.slice(0,k0));
    let best=null,bl=1e9;
    for(let k=pts.length;k>=k0;k--){
      const head=pts.slice(0,k),from=k?head[k-1]:start,br=findPath(from.x,from.y,p.x,p.y);if(!br)continue;
      const r=head.concat(br),l=(len(r)-shared)*(k===pts.length?0.85:1);if(l<bl){bl=l;best=r;}   // keep the drawn line unless cutting it saves 15% here
    }
    if(!best)continue;
    pts.length=0;pts.push(...best);last=pts[pts.length-1];
  }
  if(!pts.length)return null;
  const th=threats(),others=players.filter(o=>o!==u&&!o.dead).map(destOf);
  let end=pts[pts.length-1];
  const taken=p=>others.some(o=>hyp(o.x-p.x,o.y-p.y)<20);
  let snap=null,bs=taken(end)?-1e9:protStats(end,th).prot/th.length*3;
  for(const c of coverPts){
    const d=hyp(c.x-end.x,c.y-end.y);if(d>18||taken(c))continue;
    const s=protStats(c,th).prot/th.length*3-d/6;if(s>bs){bs=s;snap=c;}
  }
  if(!snap&&taken(end))snap=openSpot(end.x,end.y,others);
  if(snap){
    const prev=pts.length>1?pts[pts.length-2]:{x:u.x,y:u.y};
    if(clearLine(prev.x,prev.y,snap.x,snap.y))pts[pts.length-1]={x:snap.x,y:snap.y};
    else{const br=findPath(end.x,end.y,snap.x,snap.y);if(br)pts.push(...br);}
    end=pts[pts.length-1];
  }
  return{u,path:pts,x:end.x,y:end.y,cov:isCovered(end,th)};
}

function callout(u,text,col){callouts.push({x:u.x,y:u.y,text,col:col||'#e6ecf0',t:0});}
function alertAll(msg){
  if(contact)return;contact=true;
  for(const e of enemies)if(!e.dead){e.alerted=true;e.aware=1;}
  banner(msg||'Contact. They know you are here.');setStatus();
}

function damage(t,dmg){
  if(t.dead||t.downed)return;
  t.hp-=dmg;t.hitFlash=.25;
  if(t.hp<=0){
    t.hp=0;
    if(t.side==='P'){
      t.downed=true;t.wasDown=true;downCount++;t.bleed=45;t.revive=0;t.path=[];t.supT=null;
      callout(t,'Man down!',C.bad);banner(`${t.name} is down. Get a teammate to him.`);
      sel=sel.filter(x=>x!==t);preview=null;
    }else{
      t.dead=true;t.path=[];callout(t,'Tango down',C.good);
      paintDecal({k:'body',x:t.x,y:t.y,a:t.ang,r:Math.random()});
    }
  }
}

function pickTarget(u){
  const foes=u.side==='P'?enemies.filter(e=>!e.dead):players.filter(alive);
  let best=null,bs=-1;
  for(const f of foes){
    if(hyp(f.x-u.x,f.y-u.y)>380)continue;
    const L=fireLine(u,f);if(!L)continue;
    let c=hitChance(u,f,L);if(u.focus===f)c+=1;
    if(c>bs){bs=c;best={t:f,L};}
  }
  return best;
}
function burst(u,t,L){
  u.target=t;u.aimT=simT;u.ang=Math.atan2(L.ty-L.fy,L.tx-L.fx);leanOut(u,L);
  const c=hitChance(u,t,L);
  for(let i=0;i<3;i++)shots.push({at:simT+i*0.08,u,t,L,hit:Math.random()<c});
  if(u.side==='P'&&t.alerted&&simT>t.flankCD&&shotCover(L)===0){t.flankCD=simT+6;callout(t,'Flanked',C.good);}
}
function resolveShot(s){
  const u=s.u,t=s.t;if(u.dead||u.downed||t.dead)return;
  // plain shots track both soldiers through the burst; a lean or peek spot stays where it was
  const L=s.L,fx=L.lean?L.fx:u.x,fy=L.lean?L.fy:u.y,tx=L.atPeek?L.tx:t.x,ty=L.atPeek?L.ty:t.y;
  let ex=tx,ey=ty;
  if(!s.hit){
    const cov=shotCover({fx,fy,tx,ty,atPeek:L.atPeek});
    const a=Math.atan2(ty-fy,tx-fx),d=hyp(tx-fx,ty-fy);
    if(cov&&Math.random()<.7){ex=fx+Math.cos(a)*(d-10);ey=fy+Math.sin(a)*(d-10);sparks.push({x:ex,y:ey,t:0});}
    else{const aa=a+(Math.random()-.5)*0.22,dd=d+Math.random()*40-8;ex=fx+Math.cos(aa)*dd;ey=fy+Math.sin(aa)*dd;}
  }
  tracers.push({x1:fx,y1:fy,x2:ex,y2:ey,t:0,col:u.side==='P'?'255,231,163':'255,140,100'});
  flashes.push({x:fx,y:fy,t:0});
  t.sup=Math.min(1.2,t.sup+0.06);
  if(s.hit)damage(t,(11+Math.random()*5)*(u.side==='E'?0.6:1));
  if(u.side==='P')alertAll('Contact. Weapons free.');
  else if(!t.alerted){}
  if(t.side==='E'&&!t.alerted)t.alerted=true;
}
function suppressShot(u){
  const a=u.supT;
  if(!enemies.some(e=>!e.dead&&hyp(e.x-a.x,e.y-a.y)<55)){u.supT=null;callout(u,'Area clear',C.good);return;}
  const tg=[];
  for(const e of enemies){if(e.dead||hyp(e.x-a.x,e.y-a.y)>=55)continue;const L=fireLine(u,e);if(L)tg.push({e,L});}
  let L=null,t=null;
  if(tg.length){const k=tg[(Math.random()*tg.length)|0];t=k.e;L=k.L;}
  else{
    const f=sightOf(u,a.x,a.y);
    if(!f){u.cool=.6;if(++u.noLine>4){u.supT=null;callout(u,'No line of fire',C.warn);}return;}
    L={fx:f.x,fy:f.y,tx:a.x,ty:a.y,lean:f.x!==u.x||f.y!==u.y,atPeek:false};
  }
  u.noLine=0;u.ang=Math.atan2(L.ty-L.fy,L.tx-L.fx);u.aimT=simT;leanOut(u,L);
  const hit=t&&Math.random()<hitChance(u,t,L)*0.35;
  const aa=u.ang+(Math.random()-.5)*0.12,dd=hyp(L.tx-L.fx,L.ty-L.fy)+(hit?0:Math.random()*20-14);
  const ex=hit?L.tx:L.fx+Math.cos(aa)*dd,ey=hit?L.ty:L.fy+Math.sin(aa)*dd;
  tracers.push({x1:L.fx,y1:L.fy,x2:ex,y2:ey,t:0,col:'255,231,163'});flashes.push({x:L.fx,y:L.fy,t:0});
  if(!hit&&Math.random()<.6)sparks.push({x:ex,y:ey,t:0});
  for(const{e}of tg){e.sup=Math.min(1.2,e.sup+0.17);e.alerted=true;}
  if(hit)damage(t,12);
  alertAll('Contact. Weapons free.');
  u.cool=.42+Math.random()*.12;
}
function throwNade(u,tx,ty){
  if(hyp(tx-u.x,ty-u.y)>170){banner('Too far. Throw inside the circle.');return false;}
  const f=sightOf(u,tx,ty);
  if(!f){banner('No clear throw from here.');return false;}
  const L={fx:f.x,fy:f.y,tx,ty,lean:f.x!==u.x||f.y!==u.y};
  u.grenade=0;u.lastOrder=simT;u.ang=Math.atan2(ty-f.y,tx-f.x);u.aimT=simT;leanOut(u,L);
  nades.push({x0:f.x,y0:f.y,x1:tx,y1:ty,t:0,dur:.9});
  callout(u,'Frag out!',C.warn);
  return true;
}
function explode(x,y){
  booms.push({x,y,t:0});paintDecal({k:'scorch',x,y,r:Math.random()});
  for(const v of units){
    if(v.dead)continue;const d=hyp(v.x-x,v.y-y);if(d>58)continue;
    if(!los(x,y,v.x,v.y))continue;
    v.sup=Math.min(1.2,v.sup+0.8);
    if(!v.downed)damage(v,95*(1-d/62));
    if(v.side==='E')v.alerted=true;
  }
  alertAll('Contact. Weapons free.');
}

/* ---------- stealth ---------- */
// Gait is automatic: sneak while undetected with a live enemy within SNEAK_R, otherwise run.
const SNEAK_R=300,RUN_SPEED=54,SNEAK_SPEED=24;
function gaitOf(p){return !contact&&enemies.some(e=>!e.dead&&hyp(e.x-p.x,e.y-p.y)<SNEAK_R)?'sneak':'run';}
// An unaware enemy builds awareness (0..1) instead of spotting the squad instantly. Seeing a soldier in his cone
// (or very close) raises it faster the closer, faster and more exposed the soldier is; running is also heard through walls.
// It fades slowly when there's nothing to notice. Past AWARE_LOOK he turns towards what he noticed; at 1 he raises the alarm.
const SEE_RATE=1.6,NOISE_R=110,AWARE_FADE=0.15,AWARE_LOOK=0.35;
function sense(e,dt){
  let gain=0,best=0,src=null;
  for(const p of players){
    if(!alive(p))continue;const d=hyp(p.x-e.x,p.y-e.y);let g=0;
    if(d<=300){
      let da=Math.atan2(p.y-e.y,p.x-e.x)-e.ang;da=Math.atan2(Math.sin(da),Math.cos(da));
      const cone=Math.abs(da)<1.08;
      if((cone||d<80)&&fireLine(e,p)){
        g=SEE_RATE*(1-d/330)*(cone?1:0.5);
        g*=p.path.length?(p.gait==='sneak'?0.6:1.3):(coverAt(p.x,p.y,e.x,e.y)>0?0.3:0.45);   // moving draws the eye; still in cover least
      }
    }
    if(p.path.length&&p.gait==='run'&&d<NOISE_R)g+=0.5*(1-d/NOISE_R);
    gain+=g;if(g>best){best=g;src=p;}
  }
  if(gain>0){e.aware=Math.min(1,e.aware+gain*dt);e.susp={x:src.x,y:src.y};}
  else e.aware=Math.max(0,e.aware-AWARE_FADE*dt);
  if(e.aware>=AWARE_LOOK&&!e.wary){e.wary=true;if(e.vis)callout(e,'?',C.warn);}
  else if(e.aware<0.2)e.wary=false;
  if(e.aware>=1){callout(src,'Spotted!',C.bad);alertAll('Contact. You have been spotted.');}
}
// detection meter for the HUD: the most suspicious live enemy, full once there's contact
function detection(){if(contact)return 1;let a=0;for(const e of enemies)if(!e.dead)a=Math.max(a,e.aware);return a;}

/* ---------- AI ---------- */
function computeVis(){
  for(const e of enemies){
    if(e.dead){e.vis=false;continue;}
    e.vis=players.some(p=>alive(p)&&hyp(p.x-e.x,p.y-e.y)<=360&&fireLine(p,e));
    if(e.vis){
      if(!e.seen){e.seen=true;callout(e,'Hostile!',C.bad);if(!contact)banner('Hostile spotted inside the warehouse.');}
      e.last={x:e.x,y:e.y};
    }
    {let n=null,nd=1e9;for(const p of players){if(!alive(p))continue;const d=hyp(p.x-e.x,p.y-e.y);if(d<nd){nd=d;n=p;}}e.coverNow=!!n&&e.alerted&&coverAt(e.x,e.y,n.x,n.y)>0;}
    if(!e.alerted)sense(e,0.1);
  }
}
function enemyThink(e){
  if(e.dead||!e.alerted||e.path.length)return;
  if(e.sup>0.65){e.exposeT=0;return;}
  const vis=players.filter(p=>alive(p)&&hyp(p.x-e.x,p.y-e.y)<=380&&los(e.x,e.y,p.x,p.y));
  const exposed=vis.some(p=>coverAt(e.x,e.y,p.x,p.y)===0);
  e.exposeT=exposed?e.exposeT+.4:0;
  const hurt=e.hp<40&&!e.fell;
  if(!((e.exposeT>=1.2||hurt)&&simT>e.moveCool))return;
  const th=players.filter(alive).map(p=>({x:p.x,y:p.y}));if(!th.length)return;
  const others=enemies.filter(o=>o!==e&&!o.dead).map(destOf);
  let best=null,bs=-1e9;
  for(const c of coverPts){
    if(c.x<182||c.x>438||c.y<272||c.y>548)continue;
    const d=hyp(c.x-e.x,c.y-e.y);if(d>150)continue;
    if(others.some(o=>hyp(o.x-c.x,o.y-c.y)<14))continue;
    const s=protStats(c,th);
    let sc=s.prot/th.length*3+(hurt?0:s.see*0.8)-d/60;
    if(hurt){let near=1e9;for(const t of th)near=Math.min(near,hyp(t.x-c.x,t.y-c.y));sc+=near/120;}
    if(sc>bs){bs=sc;best=c;}
  }
  if(best&&hyp(best.x-e.x,best.y-e.y)>6){
    const p=findPath(e.x,e.y,best.x,best.y);
    if(p){e.path=p;e.moveCool=simT+5;e.exposeT=0;if(hurt)e.fell=true;if(e.vis)callout(e,hurt?'Falling back':'Shifting',C.bad);}
  }else e.moveCool=simT+2;
}
function playerThink(p){
  if(!alive(p)||p.path.length||!contact||p.sup>0.65){p.exposeT=0;return;}
  if(simT-p.lastOrder<4)return;
  const vis=enemies.filter(e=>!e.dead&&e.alerted&&hyp(e.x-p.x,e.y-p.y)<=380&&los(p.x,p.y,e.x,e.y));
  const exposed=vis.some(e=>coverAt(p.x,p.y,e.x,e.y)===0);
  p.exposeT=exposed?p.exposeT+.4:0;
  if(p.exposeT<2)return;
  const th=vis.map(e=>({x:e.x,y:e.y}));
  const others=players.filter(o=>o!==p&&!o.dead).map(destOf);
  let best=null,bs=-1e9;
  for(const c of coverPts){
    const d=hyp(c.x-p.x,c.y-p.y);if(d>80)continue;
    if(others.some(o=>hyp(o.x-c.x,o.y-c.y)<20))continue;
    const s=protStats(c,th);if(s.prot<th.length)continue;
    const sc=s.see*0.8-d/40;if(sc>bs){bs=sc;best=c;}
  }
  if(best){const path=findPath(p.x,p.y,best.x,best.y);if(path){p.path=path;p.lastOrder=simT;p.exposeT=0;callout(p,'Moving to cover',C.warn);}}
  else p.exposeT=0;
}

/* ---------- update ---------- */
function updateUnit(u,dt){
  if(u.dead)return;
  if(u.side==='P')u.gait=gaitOf(u);
  u.hitFlash=Math.max(0,u.hitFlash-dt);u.sup=Math.max(0,u.sup-0.18*dt);
  if(u.downed)return;
  if(u.path.length){u.peek=null;
    const p=u.path[0],dx=p.x-u.x,dy=p.y-u.y,d=hyp(dx,dy);
    const sp=(u.side==='P'?(u.gait==='sneak'?SNEAK_SPEED:RUN_SPEED):46)*(u.sup>0.65?0.7:1)*dt;
    if(d<=sp){u.x=p.x;u.y=p.y;u.path.shift();}else{u.x+=dx/d*sp;u.y+=dy/d*sp;}
    if(simT-u.aimT>0.8&&d>0.5)u.ang=turn(u.ang,Math.atan2(dy,dx),dt*8);
  }else if(simT-u.aimT>2){
    if(u.side==='P'){const th=threats();let n=th[0],nd=1e9;for(const t of th){const d=hyp(t.x-u.x,t.y-u.y);if(d<nd){nd=d;n=t;}}u.ang=turn(u.ang,Math.atan2(n.y-u.y,n.x-u.x),dt*3);}
    else if(!u.alerted&&u.aware>=AWARE_LOOK&&u.susp)u.ang=turn(u.ang,Math.atan2(u.susp.y-u.y,u.susp.x-u.x),dt*2);
    else if(u.alerted){const ps=players.filter(alive);if(ps.length){let n=ps[0],nd=1e9;for(const t of ps){const d=hyp(t.x-u.x,t.y-u.y);if(d<nd){nd=d;n=t;}}u.ang=turn(u.ang,Math.atan2(n.y-u.y,n.x-u.x),dt*3);}}
  }
  u.cool-=dt*(u.sup>0.65?0.4:1);
  if(u.cool<=0){
    if(u.side==='E'&&!u.alerted)u.cool=.3;
    else if(u.supT)suppressShot(u);
    else{const pt=pickTarget(u);if(pt){burst(u,pt.t,pt.L);u.cool=1.6+Math.random()*.6;}else u.cool=.25;}
  }
}
function turn(a,b,k){let d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*Math.min(1,k);}

function update(dt){
  simT+=dt;
  for(let i=shots.length-1;i>=0;i--)if(shots[i].at<=simT){const s=shots[i];shots.splice(i,1);resolveShot(s);}
  visTick-=dt;if(visTick<=0){visTick=.1;computeVis();}
  for(const u of units)updateUnit(u,dt);
  aiTick-=dt;if(aiTick<=0){aiTick=.4;for(const e of enemies)enemyThink(e);for(const p of players)playerThink(p);}
  for(const p of players){
    if(!p.downed||p.dead)continue;
    const helper=players.find(o=>alive(o)&&!o.path.length&&hyp(o.x-p.x,o.y-p.y)<24);
    if(helper){p.revive+=dt;if(p.revive>=3){p.downed=false;p.hp=35;p.revive=0;p.sup=.3;callout(p,'Back in it',C.good);}}
    else{p.revive=Math.max(0,p.revive-dt);p.bleed-=dt;if(p.bleed<=0){p.dead=true;p.downed=false;callout(p,'KIA',C.bad);banner(`${p.name} didn't make it.`);}}
  }
  for(let i=nades.length-1;i>=0;i--){const n=nades[i];n.t+=dt;if(n.t>=n.dur){nades.splice(i,1);explode(n.x1,n.y1);}}
  for(const arr of [tracers,flashes,sparks,booms,callouts])for(const f of arr)f.t+=dt;
  tracers=tracers.filter(f=>f.t<.12);flashes=flashes.filter(f=>f.t<.07);sparks=sparks.filter(f=>f.t<.22);booms=booms.filter(f=>f.t<.6);callouts=callouts.filter(f=>f.t<1.7);
  for(const p of players){if(alive(p)){p.covered=isCovered(p,threats());}}
  for(const u of units)if(u.focus&&u.focus.dead)u.focus=null;
  if(state==='play'&&!endAt){
    if(enemies.every(e=>e.dead))endAt=performance.now()+1500;
    else if(players.every(p=>!alive(p))&&players.every(p=>p.dead||p.revive===0))endAt=performance.now()+1500;
  }
}
