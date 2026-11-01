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
// the squad's weapons: everyone carries an assault rifle for now (Bryan). The shotgun is kept for later: list soldier IDs
// in SHOTGUNNERS (e.g. ['A2','B2'], one per fire team) to hand them out again
const WEAPON={rifle:{label:'Rifle',range:380},shotgun:{label:'Shotgun',range:200}},SHOTGUNNERS=[];
function wRange(u){return u.gunner?440:WEAPON[u.weapon||'rifle'].range;}
function hitChance(s,t,L){
  L=L||lineOf(s,t);
  const d=hyp(L.tx-L.fx,L.ty-L.fy);
  const sg=s.weapon==='shotgun';
  let c=sg?1-Math.max(0,d-80)/150:0.86-d/900;   // a shotgun: near-certain within 8 m, falling off fast beyond
  let cov=shotCover(L);if(t.inVeh)cov=Math.max(cov,1);   // inside the jeep: partial cover
  if(cov===1)c-=sg?0.2:0.28;else if(cov===2)c-=sg?0.3:0.42;   // the pellet spread makes cover count for less
  c-=s.sup>0.65?0.25:s.sup*0.15;
  if(s.side==='P'&&ambushing())c+=AMBUSH_BONUS;
  if(s.path.length||(s.inVeh&&s.inVeh.moving))c-=0.15;
  if(t.path.length)c-=0.08;
  if(s.side==='P')c+=rankAim(s);   // rank: steadier aim
  if(s.side==='E')c-=0.1;
  if(s.gunner)c-=0.05;   // machine gun: sprays
  return clamp(c,0.05,0.95);
}
function threats(){
  const t=[];
  for(const e of enemies)if(!e.dead&&e.seen&&(e.vis||e.last))t.push(e.vis?{x:e.x,y:e.y}:e.last);
  if(!t.length)t.push(wave.phase==='fight1'?{x:310,y:540}:wavePhase('clear','count','fight2','done')?COUNTER_AT:OBJ_THREAT[obj]||{x:476,y:100});   // before anyone's seen: the warehouse door, the checkpoint, or where the gun jeep parks
  return t;
}
// before anyone's seen at the later objectives: where previews judge cover from
const OBJ_THREAT={1:{x:476,y:30},2:{x:800,y:-180},3:{x:245,y:-420},4:{x:850,y:-600},5:{x:850,y:-600}};
function protStats(p,th){
  let prot=0,see=0;
  for(const t of th){const l=los(t.x,t.y,p.x,p.y);if(l||sightFrom(p.x,p.y,t.x,t.y))see=1;if(!l||coverAt(p.x,p.y,t.x,t.y)>0)prot++;}
  return{prot,see};
}
function isCovered(p,th){return protStats(p,th).prot===th.length;}
function destOf(u){return u.path.length?u.path[u.path.length-1]:{x:u.x,y:u.y};}

// Spacing between soldiers' spots: 2 m apart in the open, shoulder to shoulder (1 m) when both are at cover,
// so a fire team can share a short bit of cover like a single sandbag.
const SPACE_OPEN=20,SPACE_COVER=10;
function openSpot(x,y,taken){
  for(let r=0;r<=48;r+=8){
    const n=Math.max(1,Math.round(r*0.8));
    for(let k=0;k<n;k++){
      const a=k/n*Math.PI*2,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;
      if(!isFree(px,py,8))continue;
      if(taken.some(t=>hyp(t.x-px,t.y-py)<SPACE_OPEN))continue;
      return{x:px,y:py};
    }
  }
  return null;
}
// Where a soldier or group stands when you tap (tx,ty). Spots stay close to the tap, on the same side of any wall,
// and cover only wins if it's close too. All the soldiers' spots are chosen together: each arrangement is scored on
// cover, closeness to the tap, how far each man walks and how spread out the team is, so nobody runs off on his own.
// On open ground the slots form a short line across the enemy's line of sight, with a second row behind.
const ASSIGN_R=[0,14,32,45,45];   // how far from the tap a spot may be, by group size
function makeAssign(list,tx,ty){
  const th=threats(),n=list.length,R=ASSIGN_R[Math.min(n,4)];
  const others=players.filter(p=>!p.dead&&!list.includes(p)).map(destOf);
  const cands=[];
  const add=(x,y,cp,pen=0)=>{
    if(cands.some(c=>hyp(c.x-x,c.y-y)<6)||!los(tx,ty,x,y))return;
    if(others.some(o=>hyp(o.x-x,o.y-y)<(cp?SPACE_COVER:SPACE_OPEN)))return;
    const st=protStats({x,y},th);
    cands.push({x,y,cp,cov:st.prot===th.length,v:st.prot/th.length*2+st.see*0.3-hyp(x-tx,y-ty)/12-pen});
  };
  for(const c of coverPts)if(hyp(c.x-tx,c.y-ty)<=R)add(c.x,c.y,true);
  let ne=th[0];for(const t of th)if(hyp(t.x-tx,t.y-ty)<hyp(ne.x-tx,ne.y-ty))ne=t;
  const dl=hyp(ne.x-tx,ne.y-ty)||1,fx=(ne.x-tx)/dl,fy=(ne.y-ty)/dl;
  for(const[a,b]of[[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,-1],[1,-1],[-1,-1]]){
    const x=tx-fy*a*SPACE_OPEN+fx*b*SPACE_OPEN,y=ty+fx*a*SPACE_OPEN+fy*b*SPACE_OPEN;
    if(isFree(x,y,8))add(x,y,false,b<0?0.5:0);   // back row only when the front line is full
  }
  const C=cands.sort((p,q)=>q.v-p.v).slice(0,10);
  let best=null,bs=-1e9;const pick=[];
  (function search(i,score){
    if(i===n){if(score>bs){bs=score;best=pick.slice();}return;}
    const u=list[i];
    for(const c of C){
      if(pick.includes(c)||pick.some(q=>hyp(q.x-c.x,q.y-c.y)<(q.cp&&c.cp?SPACE_COVER:SPACE_OPEN)))continue;
      let sc=c.v-hyp(u.x-c.x,u.y-c.y)/150;
      for(const q of pick){const d=hyp(q.x-c.x,q.y-c.y);if(d>30)sc-=(d-30)/20;}
      pick.push(c);search(i+1,score+sc);pick.pop();
    }
  })(0,0);
  const res=[];
  list.forEach((u,i)=>{
    let c=best&&best[i],path=c&&findPath(u.x,u.y,c.x,c.y);
    if(!path){c=openSpot(tx,ty,[...res,...others]);path=c&&findPath(u.x,u.y,c.x,c.y);if(c)c={x:c.x,y:c.y,cp:false,cov:isCovered(c,th)};}
    if(path)res.push({u,x:c.x,y:c.y,cp:!!c.cp,path,cov:c.cov});
  });
  return res;
}
function commit(as){if(as&&as[0])say(as[0].u,'ack_move');
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
  const taken=(p,gap=SPACE_OPEN)=>others.some(o=>hyp(o.x-p.x,o.y-p.y)<gap);
  let snap=null,bs=taken(end)?-1e9:protStats(end,th).prot/th.length*3;
  for(const c of coverPts){
    const d=hyp(c.x-end.x,c.y-end.y);if(d>18||taken(c,SPACE_COVER))continue;
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

function callout(u,text,col){callouts.push({x:u.x,y:u.y,text,col:col||'#e6ecf0',t:0});if(u.side==='P'&&CALLOUT_VOICE[text])say(u,CALLOUT_VOICE[text]);}   // soldiers say their callouts over the radio (voice.js)
// Contact. If the squad struck first (ambush) the enemy is caught flat-footed: slow to fire back for a moment,
// and the squad's opening shots get AMBUSH_BONUS for AMBUSH_T.
const AMBUSH_T=1.5,AMBUSH_BONUS=0.15;
function alertAll(msg,ambush){
  if(contact)return;contact=true;say(players.find(alive),ambush?'ack_attack':'contact');
  for(const e of enemies)if(!e.dead){e.alerted=true;e.aware=1;if(ambush)e.cool=Math.max(e.cool,1.4+Math.random()*.6);}
  if(ambush){ambushT=simT+AMBUSH_T;msg='Ambush! They never saw it coming.';}
  banner(msg||'Contact. They know you are here.');setStatus();
}
function ambushing(){return!contact||simT<ambushT;}

// a kill streak is kills no more than STREAK_GAP s apart
const STREAK_GAP=8;
function creditKill(u){const s=u.stats;s.kills++;s.streak=simT-s.lastKill<=STREAK_GAP?s.streak+1:1;s.lastKill=simT;s.best=Math.max(s.best,s.streak);}
// src: who did it (credited with the kill for the after-action report)
function damage(t,dmg,src){
  if(t.dead||t.downed)return;
  t.hp-=dmg;t.hitFlash=.25;
  if(t.hp<=0){
    t.hp=0;
    if(t.side==='P'){
      t.downed=true;t.wasDown=true;downCount++;t.stats.downs++;t.bleed=45;t.revive=0;t.path=[];t.supT=null;
      callout(t,'Man down!',C.bad);banner(`${t.name} is down. Get a teammate to him.`);
      {const m=players.filter(o=>o!==t&&alive(o)).sort((a,b)=>hyp(a.x-t.x,a.y-t.y)-hyp(b.x-t.x,b.y-t.y))[0];say(m,'man_down');}
      sel=sel.filter(x=>x!==t);preview=null;
    }else{
      t.dead=true;t.path=[];callout(t,'Tango down',C.good);
      if(src&&src.side==='P'){creditKill(src);if(Math.random()<.6)say(src,'kill');}
      paintDecal({k:'body',x:t.x,y:t.y,a:t.ang,r:Math.random()});
    }
  }
}

function pickTarget(u){
  // undetected, the squad holds fire except at a hostile you've told them to shoot
  const foes=u.side==='P'?(contact?enemies.filter(e=>!e.dead):u.focus&&!u.focus.dead?[u.focus]:[]):players.filter(alive);   // a jeep is shot at through its driver (hits go to the jeep)
  let best=null,bs=-1;
  for(const f of foes){
    if(hyp(f.x-u.x,f.y-u.y)>wRange(u))continue;
    const L=fireLine(u,f);if(!L)continue;
    let c=hitChance(u,f,L);if(u.focus===f)c+=1;
    if(c>bs){bs=c;best={t:f,L};}
  }
  return best;
}
function burst(u,t,L){
  u.target=t;u.aimT=simT;u.ang=Math.atan2(L.ty-L.fy,L.tx-L.fx);leanOut(u,L);
  const c=hitChance(u,t,L);
  const n=u.gunner?5:u.weapon==='shotgun'?1:3;   // machine guns fire long bursts, rifles 3-round bursts, a shotgun one blast
  for(let i=0;i<n;i++)shots.push({at:simT+i*(u.gunner?0.07:0.08),u,t,L,hit:Math.random()<c});
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
  const sg=u.weapon==='shotgun';   // a shotgun: a spread of pellets, hard hits close, less with range
  if(sg){const a=Math.atan2(ey-fy,ex-fx),d=hyp(ex-fx,ey-fy);for(let k=0;k<4;k++){const aa=a+(Math.random()-.5)*0.16;tracers.push({x1:fx,y1:fy,x2:fx+Math.cos(aa)*d,y2:fy+Math.sin(aa)*d,t:0,col:'255,231,163'});}}   // a spread of pellets
  else tracers.push({x1:fx,y1:fy,x2:ex,y2:ey,t:0,col:u.side==='P'?'255,231,163':'255,140,100'});
  flashes.push({x:fx,y:fy,t:0});
  t.sup=Math.min(1.2,t.sup+(u.gunner?0.08:sg?0.14:0.06)*(t.side==='P'?rankNerve(t):1));   // machine guns and shotgun blasts pin people down
  if(s.hit){const dm=sg?(38+Math.random()*12)*clamp(1-(hyp(tx-fx,ty-fy)-60)/200,.35,1):(11+Math.random()*5)*(u.side==='E'?(u.gunner?0.45:0.6):1);if(t.seat==='driver')vehHit(t.inVeh,dm,u);else damage(t,dm,u);}
  if(u.side==='P')alertAll('Contact. Weapons free.',true);
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
  if(hit)damage(t,12,u);
  alertAll('Contact. Weapons free.',true);
  u.cool=.42+Math.random()*.12;
}
function throwNade(u,tx,ty){
  if(hyp(tx-u.x,ty-u.y)>170){banner('Too far. Throw inside the circle.');return false;}
  const f=sightOf(u,tx,ty);
  if(!f){banner('No clear throw from here.');return false;}
  const L={fx:f.x,fy:f.y,tx,ty,lean:f.x!==u.x||f.y!==u.y};
  u.grenade=0;u.lastOrder=simT;u.ang=Math.atan2(ty-f.y,tx-f.x);u.aimT=simT;leanOut(u,L);
  nades.push({x0:f.x,y0:f.y,x1:tx,y1:ty,t:0,dur:.9,by:u});u.stats.items++;
  callout(u,'Frag out!',C.warn);
  return true;
}
// quiet: no alarm (an explosion with nobody left to hear it)
function explode(x,y,by,quiet){
  booms.push({x,y,t:0});paintDecal({k:'scorch',x,y,r:Math.random()});
  tankBlast(x,y,by);
  const jv=jeepOf();if(jv){const d=hyp(jv.x-x,jv.y-y);if(d>1&&d<60)vehBlast(jv,70*(1-d/62));}
  for(const v of units){
    if(v.dead||v.seat==='driver')continue;const d=hyp(v.x-x,v.y-y);if(d>58)continue;   // the driver is shielded; riders and the gunner sit in the open
    if(!los(x,y,v.x,v.y))continue;
    v.sup=Math.min(1.2,v.sup+0.8);
    if(!v.downed)damage(v,95*(1-d/62),by);
    if(v.side==='E')v.alerted=true;
  }
  if(!quiet)alertAll('Contact. Weapons free.',true);
}

/* ---------- stealth ---------- */
// Gait is automatic: sneak while undetected with a live enemy within SNEAK_R, otherwise run. The gait button flips it (gaitForce).
const SNEAK_R=300,RUN_SPEED=54,SNEAK_SPEED=24;
function gaitOf(p){return p.gaitForce||autoGait(p);}
function autoGait(p){return !contact&&enemies.some(e=>!e.dead&&hyp(e.x-p.x,e.y-p.y)<SNEAK_R)?'sneak':'run';}
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
        const sz=slowAt(p.x,p.y);if(sz&&sz.hide)g*=0.15;   // in the culvert: very hard to see
      }
    }
    if(p.path.length&&p.gait==='run'&&d<NOISE_R)g+=0.5*(1-d/NOISE_R);
    gain+=g;if(g>best){best=g;src=p;}
  }
  if(e.jumpy)gain*=1.3;   // the checkpoint garrison is on edge
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
// where an alerted enemy may shift between cover: inside the warehouse, unless he has his own zone (the checkpoint garrison)
const WH_ZONE={x0:182,x1:438,y0:272,y1:548};
function enemyThink(e){
  if(e.dead||!e.alerted||e.path.length||e.gunner||e.post)return;   // posts (tower sentries) never move
  if(e.sup>0.65){e.exposeT=0;return;}
  if(e.wave===2){assaultThink(e);return;}
  const vis=players.filter(p=>alive(p)&&hyp(p.x-e.x,p.y-e.y)<=380&&los(e.x,e.y,p.x,p.y));
  const exposed=vis.some(p=>coverAt(e.x,e.y,p.x,p.y)===0);
  e.exposeT=exposed?e.exposeT+.4:0;
  const hurt=e.hp<40&&!e.fell;
  if(!((e.exposeT>=1.2||hurt)&&simT>e.moveCool))return;
  const th=players.filter(alive).map(p=>({x:p.x,y:p.y}));if(!th.length)return;
  const others=enemies.filter(o=>o!==e&&!o.dead).map(destOf);
  let best=null,bs=-1e9;
  for(const c of coverPts){
    const z=e.zone||WH_ZONE;if(c.x<z.x0||c.x>z.x1||c.y<z.y0||c.y>z.y1)continue;
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
  if(!alive(p)||p.path.length||p.inVeh||!contact||p.sup>0.65){p.exposeT=0;return;}
  if(simT-p.lastOrder<4)return;
  const vis=enemies.filter(e=>!e.dead&&e.alerted&&hyp(e.x-p.x,e.y-p.y)<=380&&los(p.x,p.y,e.x,e.y));
  const exposed=vis.some(e=>coverAt(p.x,p.y,e.x,e.y)===0);
  p.exposeT=exposed?p.exposeT+.4:0;
  if(p.exposeT<2)return;
  const th=vis.map(e=>({x:e.x,y:e.y}));
  const others=players.filter(o=>o!==p&&!o.dead).map(destOf);
  let best=null,bs=-1e9;
  for(const c of coverPts){
    const d=hyp(c.x-p.x,c.y-p.y);if(d>50)continue;   // auto-move: only nearby cover, never a long run
    if(others.some(o=>hyp(o.x-c.x,o.y-c.y)<SPACE_COVER))continue;
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
  if(u.side==='P'){if(u.sup>0.65&&!u.saidPinned&&alive(u)){u.saidPinned=true;say(u,'pinned');}else if(u.sup<0.4)u.saidPinned=false;}
  if(u.downed)return;
  if(u.seat==='driver')return;   // the driver drives; riders and the gunner fight from the jeep
  if(u.path.length){u.peek=null;
    const p=u.path[0],dx=p.x-u.x,dy=p.y-u.y,d=hyp(dx,dy);
    const sz=slowAt(u.x,u.y),sp=(u.side==='P'?(u.gait==='sneak'?SNEAK_SPEED:RUN_SPEED):u.alerted?46:26)*   // an unaware patrol strolls
      (u.sup>0.65?0.7:1)*(sz?sz.k:1)*dt;   // the culvert and the broken rail bridge are slow going
    if(d<=sp){u.x=p.x;u.y=p.y;u.path.shift();}else{u.x+=dx/d*sp;u.y+=dy/d*sp;}
    if(simT-u.aimT>0.8&&d>0.5)u.ang=turn(u.ang,Math.atan2(dy,dx),dt*8);
  }else if(simT-u.aimT>2){
    if(u.side==='P'){const th=threats();let n=th[0],nd=1e9;for(const t of th){const d=hyp(t.x-u.x,t.y-u.y);if(d<nd){nd=d;n=t;}}u.ang=turn(u.ang,Math.atan2(n.y-u.y,n.x-u.x),dt*3);}
    else if(!u.alerted&&u.aware>=AWARE_LOOK&&u.susp)u.ang=turn(u.ang,Math.atan2(u.susp.y-u.y,u.susp.x-u.x),dt*2);
    else if(u.alerted){const ps=players.filter(alive);if(ps.length){let n=ps[0],nd=1e9;for(const t of ps){const d=hyp(t.x-u.x,t.y-u.y);if(d<nd){nd=d;n=t;}}u.ang=turn(u.ang,Math.atan2(n.y-u.y,n.x-u.x),dt*3);}}
  }
  u.cool-=dt*(u.sup>0.65?0.4:1);
  if(u.rpg&&u.alerted&&u.aimAt)rpgThink(u);   // mid-aim: fire when ready
  if(u.cool<=0){
    if(u.side==='E'&&!u.alerted)u.cool=.3;
    else if(u.rpg)rpgThink(u);
    else if(u.focusTank&&shootTank(u)){}   // ordered to shoot a fuel tank
    else if(u.supT)suppressShot(u);
    else{const pt=pickTarget(u);if(pt){burst(u,pt.t,pt.L);u.cool=u.gunner?1.3+Math.random()*.5:u.weapon==='shotgun'?1.1+Math.random()*.4:1.6+Math.random()*.6;}else u.cool=.25;}
  }
}
function turn(a,b,k){let d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*Math.min(1,k);}

function update(dt){
  simT+=dt;
  for(let i=shots.length-1;i>=0;i--)if(shots[i].at<=simT){const s=shots[i];shots.splice(i,1);sfxShot(s.u);resolveShot(s);}
  visTick-=dt;if(visTick<=0){visTick=.1;computeVis();}
  for(const u of units)updateUnit(u,dt);
  aiTick-=dt;if(aiTick<=0){aiTick=.4;for(const e of enemies)enemyThink(e);for(const p of players)playerThink(p);}
  for(const p of players){
    if(!p.downed||p.dead)continue;
    const helper=players.find(o=>alive(o)&&!o.path.length&&!o.inVeh&&hyp(o.x-p.x,o.y-p.y)<24);
    if(helper){p.revive+=dt;if(p.revive>=3){p.downed=false;p.hp=35;p.revive=0;p.sup=.3;callout(p,'Back in it',C.good);helper.stats.revives++;}}
    else{p.revive=Math.max(0,p.revive-dt);p.bleed-=dt;if(p.bleed<=0){p.dead=true;p.downed=false;callout(p,'KIA',C.bad);banner(`${p.name} didn't make it.`);}}
  }
  for(let i=nades.length-1;i>=0;i--){const n=nades[i];n.t+=dt;if(n.t>=n.dur){nades.splice(i,1);explode(n.x1,n.y1,n.by);}}
  for(const arr of [tracers,flashes,sparks,booms,callouts])for(const f of arr)f.t+=dt;
  tracers=tracers.filter(f=>f.t<.12);flashes=flashes.filter(f=>f.t<.07);sparks=sparks.filter(f=>f.t<.22);booms=booms.filter(f=>f.t<.6);callouts=callouts.filter(f=>f.t<1.7);
  for(const p of players){if(alive(p)){p.covered=isCovered(p,threats());}}
  for(const u of units)if(u.focus&&u.focus.dead)u.focus=null;
  missionFx(dt);
  if(state==='play'&&!endAt){
    vehTick(dt);waveTick(dt);   // cleared the warehouse? then the reinforcements; cleared those? mission complete
    if(!endAt&&players.every(p=>!alive(p))&&players.every(p=>p.dead||p.revive===0))endAt=performance.now()+1500;
  }
}
