"use strict";
/* Combat rules (hit chance, bursts, suppression, grenades), cover-aware move assignment, enemy and squad AI, and the sim step. */
/* ---------- peeking round corners ---------- */
// A soldier hugging a wall or container leans out past its edge to see, shoot or throw (leanPts in map.js).
// After firing from a lean he stays leaned out for PEEK_T: enemies can see and hit him there, and he counts as half cover.
const PEEK_T=1.2;
function peekOf(u){return u.peek&&simT<u.peek.until&&alive(u)&&!u.path.length?u.peek:null;}
// where u can fire at (tx,ty) from. Leaning out only when standing still, and not while he keeps his head down (shy: just
// revived, or badly hurt and being hit; Bryan saw a weak soldier at a wall's edge go down, get revived, lean out and go down
// again). Nobody sees into or out of the tunnel.
const shy=u=>u.side==='P'&&simT<(u.shyT||0);
function sightOf(u,tx,ty){if(hideAt(u.x,u.y)!==hideAt(tx,ty))return null;return u.path.length||shy(u)?(los(u.x,u.y,tx,ty)?{x:u.x,y:u.y}:null):sightFrom(u.x,u.y,tx,ty);}
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
// pinned above PINNED suppression; badly hurt below SHY_HP (keeps his head down SHY_T s after a hit); a downed soldier
// bleeds out in BLEED_T s (Bryan: a 60 s window to get to him; carrying him out or a medic kit after that comes later)
const PINNED=0.65,SHY_HP=40,SHY_T=4,BLEED_T=60;
// Bryan: the squad died too fast (the bridge above all). Vests: the squad takes 20% less (the freed prisoners have none); the
// enemy aims a little worse; the enemy sniper hits less hard and fires half as often (he did a third of the bridge's damage)
const SQUAD_VEST=.8,ENEMY_AIM=.15,ESNIPER={dmg:.35,slow:1.5};
/* ---------- downed soldiers (Bryan): 60 s to revive him by hand, then critical ---------- */
// For BLEED_T s a teammate standing beside him (not pinned) revives him. After that he's critical for CRIT_T s: no hand revive.
// A medic kit (MEDKIT_T s beside him, not pinned; up at 50 HP) saves him, or carrying him into a medical box (up after
// BOXREV_T s there). The carrier moves at sneaking speed and can't shoot or climb. Otherwise he's KIA.
const CRIT_T=120,MEDKIT_T=5,PICKUP_T=1,BOXREV_T=3,HEAL_T=3;   // (HEAL_T: a kit on a man who's still up, back to 100: below)
const hasKit=u=>u.spec==='medkit'&&u.specN>0;
function nearSpot(u,t){return openSpot(t.x,t.y,players.filter(o=>o!==u&&o!==t&&!o.dead).map(destOf))||{x:t.x,y:t.y};}
function goBeside(u,t){const s=nearSpot(u,t);return hyp(u.x-t.x,u.y-t.y)<20?[]:findPath(u.x,u.y,s.x,s.y);}
function orderMedkit(u,t){
  if(!hasKit(u)){banner(`${u.name} has no medic kit.`,1600);return false;}
  if(!t.downed){   // a man who's hurt but still up, or the medic himself: back to 100 in HEAL_T s (Bryan, after v100: "The med pack should cure players to 100% health while they stand")
    if(t.hp>=100){banner(`${t.name} isn't hurt.`,1600);return false;}
    const p=t===u?[]:goBeside(u,t);if(!p){banner('No way to reach him from here.');return false;}
    u.path=p;u.lastOrder=simT;u.supT=null;u.focus=null;u.carryGo=null;u.medGo={t,prog:0,heal:true,lo:simT};if(t!==u)markRet(u);callout(u,t===u?'Patching myself up':'Medic kit, coming',C.good);return true;
  }
  const p=goBeside(u,t);if(!p){banner('No way to reach him from here.');return false;}
  u.path=p;u.lastOrder=simT;u.supT=null;u.focus=null;u.carryGo=null;u.medGo={t,prog:0};markRet(u);callout(u,'Medic kit, coming',C.good);return true;
}
function orderCarry(u,t){
  if(u.carry){banner(`${u.name} is already carrying someone.`,1600);return false;}
  const p=goBeside(u,t);if(!p){banner('No way to reach him from here.');return false;}
  u.path=p;u.lastOrder=simT;u.supT=null;u.focus=null;u.medGo=null;u.carryGo={t,prog:0};callout(u,'Getting him out',C.good);return true;
}
function putDown(u){const t=u.carry;if(!t)return;t.carriedBy=null;u.carry=null;callout(u,'Setting him down',C.good);}
function reviveUp(p,hp,by){
  if(p.carriedBy)putDown(p.carriedBy);
  Object.assign(p,{downed:false,critical:false,hp,revive:0,boxRev:0,bleed:BLEED_T,sup:.3,shyT:simT+SHY_T+1});
  if(by){by.stats.revives++;if(by.ret){p.ret={ids:by.ret.ids.filter(id=>id!==p.id),lo:p.lastOrder,at:0,t0:simT};backSoon(p,1);}backSoon(by);}   // (sent over to do it: back to the others, and the man he got up with him: retTick)
  if(typeof onRevive==='function')onRevive(p);   // (Marsh's first time up: office.js)
  if(!chatRevived(p,by))callout(p,'Back in it',C.good);   // he thanks whoever got him up (chatter.js), or just this
}
function medTick(dt){   // medic kits being used, men being picked up, and carried men riding along
  for(const u of players){
    for(const k of['medGo','carryGo']){
      const g=u[k];if(!g)continue;const t=g.t,dd=destOf(u);
      if(g.heal&&t.downed){g.heal=false;g.prog=0;const p=t!==u&&goBeside(u,t);if(p)u.path=p;}   // he went down before the kit reached him: it gets him up instead
      if(g.heal){   // a man who's up: the medic goes to him, keeping up if he's on the move; another order calls it off
        if(!alive(u)||t.dead||t.hp>=100||u.lastOrder!==g.lo){u.medGo=null;continue;}
        if(t!==u){const end=u.path.length?u.path[u.path.length-1]:u;
          if(hyp(end.x-t.x,end.y-t.y)>24&&simT>=(g.re||0)){g.re=simT+.4;const p=goBeside(u,t);if(!p){u.medGo=null;banner('No way to reach him from here.');continue;}u.path=p;}
          if(u.path.length||hyp(u.x-t.x,u.y-t.y)>28)continue;}
        if(u.sup>PINNED)continue;g.prog+=dt;
        if(g.prog>=HEAL_T){u.medGo=null;u.specN--;u.stats.items++;t.hp=100;t.shyT=0;callout(t,'Good as new',C.good);if(t!==u)backSoon(u);}
        continue;
      }
      if(!alive(u)||!t.downed||t.dead||(k==='carryGo'&&t.carriedBy)||(u.path.length&&hyp(dd.x-t.x,dd.y-t.y)>30)){u[k]=null;continue;}
      if(u.path.length)continue;
      if(hyp(u.x-t.x,u.y-t.y)>28){u[k]=null;continue;}
      if(k==='medGo'){if(u.sup>PINNED)continue;g.prog+=dt;if(g.prog>=MEDKIT_T){u.medGo=null;u.specN--;u.stats.items++;reviveUp(t,isCls(u,'medic')?CLS.kitHp:50,u);callout(u,'Patched up',C.good);}}
      else{g.prog+=dt;if(g.prog>=PICKUP_T){u.carryGo=null;u.carry=t;t.carriedBy=u;callout(u,'Got him',C.good);if(typeof sfxCloth==='function')sfxCloth(u.x,u.y);}}
    }
    if(u.carry){
      const t=u.carry;if(!alive(u)||t.dead||!t.downed){putDown(u);continue;}
      t.x=u.x-Math.cos(u.ang)*4;t.y=u.y-Math.sin(u.ang)*4;t.ang=u.ang+Math.PI/2;t.path=[];
      const z=zoneAt(u.x,u.y);if(z&&z.k==='med'){putDown(u);t.x=u.x;t.y=u.y;}   // into a medical box: set down there, up in BOXREV_T s
    }
  }
}
// the squad's weapons (Bryan): M4s, and B1 carries a heavy machine gun (long bursts that pin people down, worse on the move).
// The sniper rifle is picked up off the watchtower's sniper (mission.js). The shotgun is kept for later: list soldier IDs in
// SHOTGUNNERS (e.g. ['A2','B2']) to hand them out again. n: rounds a burst, cool: s between bursts, sup: suppression per round
const WEAPON={
  rifle:  {label:'M4',range:380,n:3,cool:[1.6,2.2],dmg:[11,16],sup:.06},
  m4s:    {label:'M4 SD',range:380,n:3,cool:[1.6,2.2],dmg:[11,16],sup:.06,quiet:true},   // (Bryan: silenced assault rifles for the data center mission: quiet like a silencer, and it never wears out; the equip screen hands them out, equip.js)
  hmg:    {label:'M240',range:420,n:6,cool:[1.5,2.1],dmg:[10,14],sup:.11,acc:-.06,move:-.12},
  sniper: {label:'Sniper',range:700,n:1,cool:[2.4,3.1],dmg:[85,110],sup:.3,far:true},
  shotgun:{label:'Shotgun',range:200,n:1,cool:[1.1,1.5],sup:.14}},SHOTGUNNERS=[],DEFAULT_WEAPON={B1:'hmg'};
const wOf=u=>WEAPON[u.weapon||'rifle']||WEAPON.rifle;
// a second gun (the sniper rifle off the tower: his own goes on his back, mission.js): tap the gun on his card to swap (cards.js)
function swapWeapon(u){
  if(!u||!u.weapon2||!alive(u)||u.climb||u.carry||u.inVeh)return false;
  [u.weapon,u.weapon2]=[u.weapon2,u.weapon];u.cool=Math.max(u.cool||0,.8);u.silent=null;
  callout(u,WEAPON[u.weapon].label,C.good);return true;
}
function wRange(u){return u.gunner?440:wOf(u).range;}
function hitChance(s,t,L){
  L=L||lineOf(s,t);
  const ob=s.side==='P'?(s.watch&&inWatch(s,t)?WATCH.bonus:0)+(simT<(s.breachT||0)?BREACH.bonus:0):0;   // Watch and Breach (orders.js)
  const d=hyp(L.tx-L.fx,L.ty-L.fy);
  const sg=s.weapon==='shotgun';
  const W=wOf(s);let c=sg?1-Math.max(0,d-80)/150:W.far?0.92-d/2600:0.86-d/900;   // a shotgun: near-certain within 8 m, falling off fast beyond; a sniper rifle barely falls off
  c+=W.acc||0;if(s.path.length)c+=W.move||0;
  let cov=shotCover(L);if(t.inVeh||t.onTower)cov=Math.max(cov,1);   // inside the jeep, or up the watchtower behind its rails: partial cover
  if(cov===1)c-=sg?0.2:0.28;else if(cov===2)c-=sg?0.3:0.42;   // the pellet spread makes cover count for less
  c-=s.sup>0.65?0.25:s.sup*0.15;
  if(s.side==='P'&&ambushing(s))c+=AMBUSH_BONUS;
  if(s.path.length||(s.inVeh&&s.inVeh.moving))c-=isCls(s,'assault')?CLS.moveAim:0.15;
  if(t.path.length)c-=0.08;
  if(s.side==='P')c+=rankAim(s)+ob+(nearCaptain(s)?CLS.leadAim:0)+(s.rallyT>simT?SKILL.rally.aim:0);   // (a Captain's rally: skills.js)   // rank: steadier aim; on Watch / breaching: a bonus
  if(s.side==='E')c-=ENEMY_AIM+(s.aimPen??(s.l1?L1E.aim:0));   // (Level 1's and Level 2's guards: worse still, level1.js, level2.js)
  if(s.gunner)c-=0.05;   // machine gun: sprays
  return clamp(c,0.05,0.95);
}
function threats(){
  const t=[];
  for(const e of enemies)if(!beaten(e)&&e.seen&&(e.vis||e.last))t.push(e.vis?{x:e.x,y:e.y}:e.last);
  if(!t.length)t.push(MAPID==='l1'?l1Threat():MAPID==='l2'?l2Threat():MAPID==='hq'?{x:500,y:240}:MAPID==='tun'?{x:720,y:-380}:MAPID==='l4'?l4Threat():MAPID==='in'?inThreat():wave.phase==='fight1'?{x:310,y:540}:wavePhase('clear','count','fight2','done')?COUNTER_AT:obj>=4?OBJ_THREAT[Math.min(obj,7)]:AREA_THREAT[nearArea()]);   // before anyone's seen: the warehouse door, the checkpoint, or where the gun jeep parks
  return t;
}
// before anyone's seen at the later objectives: where previews judge cover from
const OBJ_THREAT={1:{x:476,y:30},2:{x:800,y:-180},3:{x:245,y:-420},4:{x:850,y:-600},5:{x:850,y:-600},6:{x:850,y:-600},7:{x:1280,y:-480}};   // (7: the road east, the tunnel's mouth: road.js)
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
// a tap on water (the canal, the dock) means the bank on the soldiers' side, not across it
function nearBank(tx,ty,list){
  if(!objs.some(o=>o.kind==='water'&&rectDist(tx,ty,o)<=0))return{x:tx,y:ty};
  let cx=0,cy=0;for(const u of list){cx+=u.x/list.length;cy+=u.y/list.length;}
  const d=hyp(cx-tx,cy-ty);
  for(let k=4;k<d;k+=4){const x=tx+(cx-tx)*k/d,y=ty+(cy-ty)*k/d;if(isFree(x,y,8))return{x,y};}
  return{x:tx,y:ty};
}
function makeAssign(list,tx,ty){
  ({x:tx,y:ty}=nearBank(tx,ty,list));
  const box=zoneAt(tx,ty);if(box){const r=boxAssign(list,box,tx,ty);if(r)return r;}   // a medical or supply box: everyone inside it
  const th=threats(),n=list.length,R=n>4?62:ASSIGN_R[n];   // (five or more: the freed prisoners joined, office.js)
  const others=players.filter(p=>!p.dead&&!list.includes(p)).map(destOf);
  const cands=[];
  const add=(x,y,cp,pen=0)=>{
    if(cands.some(c=>hyp(c.x-x,c.y-y)<6)||!los(tx,ty,x,y))return;
    if(others.some(o=>hyp(o.x-x,o.y-y)<(cp?SPACE_COVER:SPACE_OPEN)))return;
    const st=protStats({x,y},th);
    cands.push({x,y,cp,cov:st.prot===th.length,expo:(st.see?1:0)+(st.prot<th.length?1:0),v:st.prot/th.length*2+st.see*0.3-hyp(x-tx,y-ty)/12-pen});
  };
  for(const c of coverPts)if(hyp(c.x-tx,c.y-ty)<=R)add(c.x,c.y,true);
  let ne=th[0];for(const t of th)if(hyp(t.x-tx,t.y-ty)<hyp(ne.x-tx,ne.y-ty))ne=t;
  const dl=hyp(ne.x-tx,ne.y-ty)||1,fx=(ne.x-tx)/dl,fy=(ne.y-ty)/dl;
  for(const[a,b]of[[0,0],[1,0],[-1,0],[2,0],[-2,0],[0,-1],[1,-1],[-1,-1],...(n>4?[[3,0],[-3,0],[2,-1],[-2,-1],[0,-2],[1,-2],[-1,-2]]:[])]){
    const x=tx-fy*a*SPACE_OPEN+fx*b*SPACE_OPEN,y=ty+fx*a*SPACE_OPEN+fy*b*SPACE_OPEN;
    if(isFree(x,y,8))add(x,y,false,b<0?0.5:0);   // back row only when the front line is full
  }
  const C=cands.sort((p,q)=>q.v-p.v).slice(0,n>4?18:10);
  // Bryan: the healthier man goes in front. How exposed a spot is (it sees or peeks at the enemy: 1, it isn't fully covered: 1
  // more) weighs on who takes it: the more exposed, the more it goes to whoever has more health than the group's average,
  // and the badly hurt keep back when the group has somewhere else to stand
  const avgHp=list.reduce((a,u)=>a+u.hp,0)/n,frontBias=u=>(u.hp-avgHp)/50-(n>1&&u.hp<SHY_HP+5?.3:0);
  let best=null,bs=-1e9;const pick=[];
  const step=(u,c,picked)=>{if(picked.includes(c)||picked.some(q=>hyp(q.x-c.x,q.y-c.y)<(q.cp&&c.cp?SPACE_COVER:SPACE_OPEN)))return null;
    let sc=c.v-hyp(u.x-c.x,u.y-c.y)/150+c.expo*frontBias(u);for(const q of picked){const d=hyp(q.x-c.x,q.y-c.y);if(d>30)sc-=(d-30)/20;}return sc;};
  if(n<=4)(function search(i,score){   // up to four: every arrangement
    if(i===n){if(score>bs){bs=score;best=pick.slice();}return;}
    const u=list[i];
    for(const c of C){const sc=step(u,c,pick);if(sc==null)continue;pick.push(c);search(i+1,score+sc);pick.pop();}
  })(0,0);
  else{   // more (the freed prisoners): a beam of the best partial arrangements, so eight men don't take millions of tries
    let beam=[{p:[],s:0}];
    for(let i=0;i<n;i++){const u=list[i],next=[];for(const b of beam)for(const c of C){const sc=step(u,c,b.p);if(sc!=null)next.push({p:[...b.p,c],s:b.s+sc});}
      next.sort((a,b)=>b.s-a.s);beam=next.slice(0,60);if(!beam.length)break;}
    if(beam.length&&beam[0].p.length===n){best=beam[0].p;bs=beam[0].s;}
  }
  const res=[];
  list.forEach((u,i)=>{
    let c=best&&best[i],path=c&&findPath(u.x,u.y,c.x,c.y);
    if(!path){c=openSpot(tx,ty,[...res,...others]);path=c&&findPath(u.x,u.y,c.x,c.y);if(c)c={x:c.x,y:c.y,cp:false,cov:isCovered(c,th)};}
    if(path)res.push({u,x:c.x,y:c.y,cp:!!c.cp,path,cov:c.cov});
  });
  return res;
}
// spots inside a medical or supply box (hq.js) for everyone selected: a grid of free spots 20 apart, nearest the tap first
function boxAssign(list,z,tx,ty){   // everyone selected into a station's ring (round the station, not on it)
  const others=players.filter(p=>!p.dead&&!list.includes(p)).map(destOf),slots=[];
  for(let y=z.y-z.r+10;y<=z.y+z.r-10;y+=19)for(let x=z.x-z.r+10;x<=z.x+z.r-10;x+=19){const d=hyp(x-z.x,y-z.y);if(d>z.r-9||d<16)continue;if(isFree(x,y,8)&&!others.some(o=>hyp(o.x-x,o.y-y)<SPACE_OPEN))slots.push({x,y});}
  if(slots.length<list.length)return null;
  slots.sort((a,b)=>hyp(a.x-tx,a.y-ty)-hyp(b.x-tx,b.y-ty));
  const take=slots.slice(0,list.length),res=[],th=threats();
  for(const u of list.slice().sort((a,b)=>hyp(a.x-tx,a.y-ty)-hyp(b.x-tx,b.y-ty))){   // the nearest soldier first, to the nearest spot left
    let bi=0;for(let i=1;i<take.length;i++)if(hyp(take[i].x-u.x,take[i].y-u.y)<hyp(take[bi].x-u.x,take[bi].y-u.y))bi=i;
    const c=take.splice(bi,1)[0],path=findPath(u.x,u.y,c.x,c.y);if(!path)return null;
    res.push({u,x:c.x,y:c.y,cp:false,path,cov:isCovered(c,th)});
  }
  return res;
}
// A route drawn with a finger (input.js: hold a soldier, then drag) turned into a walkable one that keeps its shape: skip points
// inside objects, route round any stretch that cuts through something, and settle the end onto cover if there is some close by
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
      const head=pts.slice(0,k),from=k?head[k-1]:start,br=findPath(from.x,from.y,p.x,p.y,TRAIL);if(!br)continue;
      const r=head.concat(br),l=(len(r)-shared)*(k===pts.length?0.85:1);if(l<bl){bl=l;best=r;}   // keep the drawn line unless cutting it saves 15% here
    }
    if(!best)continue;
    pts.length=0;pts.push(...best);last=pts[pts.length-1];
  }
  if(!pts.length)return null;
  const th=threats(),others=players.filter(o=>o!==u&&!o.dead).map(destOf);
  let end=pts[pts.length-1];
  const taken=(p,gap=SPACE_OPEN)=>others.some(o=>hyp(o.x-p.x,o.y-p.y)<gap);
  let snap=null,bs=taken(end)?-1e9:protStats(end,th).prot/(th.length||1)*3;
  for(const c of coverPts){
    const d=hyp(c.x-end.x,c.y-end.y);if(d>18||taken(c,SPACE_COVER))continue;
    const s=protStats(c,th).prot/(th.length||1)*3-d/6;if(s>bs){bs=s;snap=c;}
  }
  if(!snap&&taken(end))snap=openSpot(end.x,end.y,others);
  if(snap){
    const prev=pts.length>1?pts[pts.length-2]:{x:u.x,y:u.y};
    if(clearLine(prev.x,prev.y,snap.x,snap.y))pts[pts.length-1]={x:snap.x,y:snap.y};
    else{const br=findPath(end.x,end.y,snap.x,snap.y,TRAIL);if(br)pts.push(...br);}
    end=pts[pts.length-1];
  }
  return{u,path:pts,x:end.x,y:end.y,cov:isCovered(end,th)};
}
function commit(as){if(as&&as[0]&&!chatMove(as)&&Math.random()<.3)say(as[0].u,'ack_move');   // (a group move: often the lead calls his partner instead: chatter.js)
  for(const a of as){a.u.path=a.path;a.u.lastOrder=simT;a.u.supT=null;a.u.exposeT=0;a.u.watch=null;a.u.ret=null;}   // (a move ends a Watch: orders.js; and any way back to the group, below)
}

/* ---------- back to the group after a job (Bryan, after v91: "any time a unit does an action, they run back to the group if
   they were originally with them. If not, they move independently, until the squad is back together") ----------
   A soldier sent off to do something (the bio scanner, a thing to use, a zip tie, a revive or a medic kit, a takedown, a throw
   he walks for) who was with others when he went goes back to them once it's done: to where they are by then, the way a group
   move places a man (cover if there's any). One who was already off on his own stays where he finishes. Another order on the
   way or in the moment after (lastOrder moves on) and he does that instead. The gun, the tower and a door he opens to look
   through are posts: he stays. */
const GROUP_LINK=80;   // within 8 m of one of them (who's within 8 m of another...): together
function groupOf(u){
  const ok=p=>alive(p)&&!p.offMap&&!p.away&&!p.inBoat&&!p.inHeli&&(MAPID!=='in'||floorOf(p.x,p.y)===floorOf(u.x,u.y));
  const g=[u];for(let i=0;i<g.length;i++)for(const p of players)if(!g.includes(p)&&ok(p)&&hyp(p.x-g[i].x,p.y-g[i].y)<GROUP_LINK)g.push(p);
  return g.slice(1);
}
function markRet(u){const m=groupOf(u);u.ret=m.length?{ids:m.map(p=>p.id),lo:u.lastOrder,at:0,t0:simT}:null;}   // (as he's given the job: after its lastOrder)
function backSoon(u,delay,fresh){   // the job's done: back in a moment (fresh: the job itself just set lastOrder, a throw)
  const r=u.ret;if(!r)return;if(!fresh&&u.lastOrder!==r.lo||simT-(r.t0??simT)>120){u.ret=null;return;}   // (ordered elsewhere since, or a job long since dropped)
  r.lo=u.lastOrder;r.at=simT+(delay??.6);
}
function retTick(){
  for(const u of players){const r=u.ret;if(!r||!r.at||simT<r.at)continue;u.ret=null;
    if(u.lastOrder!==r.lo||!alive(u)||u.carry||u.inVeh||u.onGun||u.manGo||u.onTower||u.climb||u.tk||u.silent||u.path.length||onTask(u))continue;   // (something new to do)
    const mates=players.filter(p=>r.ids.includes(p.id)&&alive(p)&&!p.offMap&&!p.away&&(MAPID!=='in'||floorOf(p.x,p.y)===floorOf(u.x,u.y)));if(!mates.length)continue;
    const ds=mates.map(destOf);let n=ds[0];for(const d of ds)if(hyp(d.x-u.x,d.y-u.y)<hyp(n.x-u.x,n.y-u.y))n=d;   // where the nearest of them is going, and whoever's with him
    if(hyp(n.x-u.x,n.y-u.y)<GROUP_LINK*.5)continue;   // (still with them)
    const near=ds.filter(d=>hyp(d.x-n.x,d.y-n.y)<GROUP_LINK*1.5),c={x:near.reduce((a,d)=>a+d.x,0)/near.length,y:near.reduce((a,d)=>a+d.y,0)/near.length};
    const at=isFree(c.x,c.y,8)?c:n,as=makeAssign([u],at.x,at.y);
    let path=as.length?as[0].path:null;if(!path){const s=openSpot(at.x,at.y,players.filter(p=>p!==u&&!p.dead).map(destOf));path=s&&findPath(u.x,u.y,s.x,s.y);}
    if(path&&path.length){u.path=path;u.lastOrder=simT;u.exposeT=0;u.watch=null;callout(u,'Regrouping',C.good);}
  }
}

function callout(u,text,col){callouts.push({x:u.x,y:u.y,text,col:col||'#e6ecf0',t:0});if(u.side==='P'&&CALLOUT_VOICE[text])say(u,CALLOUT_VOICE[text]);}   // soldiers say their callouts over the radio (voice.js)
// Contact. If the squad struck first (ambush) the enemy is caught flat-footed: slow to fire back for a moment,
// and the squad's opening shots get AMBUSH_BONUS for AMBUSH_T.
const AMBUSH_T=1.5,AMBUSH_BONUS=0.15;
// open/wall: how far it carries in sight and through walls (left out: a normal shot); room=false: not the whole room (a silenced shot)
function alertAll(msg,ambush,x,y,x2,y2,lk,open,wall,room,who){   // noise is local everywhere (hunt.js outdoors, interior.js inside): only those who'd hear it; who: whose team it gives away (else whoever's near lk)
  if(x==null)return;
  if(MAPID==='in')alertNear(x,y,msg,ambush,x2,y2,lk,open,wall,room,who);else alertOut(x,y,msg,ambush,x2,y2,lk,open,wall,who);
}
// one of ours made a noise: his team's quiet spell starts over, and men already alerted (fighting the other team) who hear it
// know where it came from, so a covert team that fires gives itself away (hunt.js: teamNoiseT, heardNow)
function squadNoise(u,x,y,open,wall){
  if(!u||u.side!=='P')return;teamNoiseT[u.team]=simT;
  if(contact&&!caught(u)&&heardNow(x,y,open??OUT_HEAR_OPEN,wall??OUT_HEAR_WALL))startContact(null,false,u);
}
function ambushing(u){return u?(!caught(u)||simT<(teamAmbT[u.team]??-9)):(!contact||simT<ambushT);}   // (per soldier: his team undetected, or in its first moments after striking first)
const beaten=e=>e.dead||e.surr||!!e.dormant;   // out of the fight: dead, or he gave up (layers.js), or a monster still waiting in its room (fortress.js)

// a kill streak is kills no more than STREAK_GAP s apart
const STREAK_GAP=8;
function creditKill(u){const s=u.stats;s.kills++;s.streak=simT-s.lastKill<=STREAK_GAP?s.streak+1:1;s.lastKill=simT;s.best=Math.max(s.best,s.streak);}
// src: who did it (credited with the kill for the after-action report)
function damage(t,dmg,src){
  if(t.dead||t.downed)return;
  if(t.veh){t.hp-=dmg;t.hitFlash=.25;if(t.hp<=0)truckWreck(t,src);return;}   // the gun jeep (mission.js): bullets (at GJEEP.bullet) and blasts
  if(t.side==='E'&&!t.dog&&alertStage()>=2)dmg*=.8;   // the base's Alert II: helmets and vests (layers.js)
  if(t.dmgIn)dmg*=t.dmgIn;else if(t.l1)dmg*=L1E.dmgIn;   // Level 1's and Level 2's guards go down faster (level1.js, level2.js)
  if(t.side==='P')t.firedOnT=simT;
  if(t.unarmored)dmg*=1.3;   // a freed prisoner: no vest (office.js)
  else if(t.side==='P')dmg*=SQUAD_VEST;   // the squad's vests
  if(isCls(t,'defender'))dmg*=CLS.defArmor;   // (a Defender's heavy armour: classes.js)
  t.hp-=dmg;t.hitFlash=.25;
  if(t.side==='P'&&!t.offMap&&!offFloor(t))hitCue(t.hp<=0?.85:Math.min(.6,.22+dmg/50));
  if(t.side==='P'&&t.hp>0&&t.hp<SHY_HP)t.shyT=simT+SHY_T;   // badly hurt and still being hit: he keeps his head down
  if(t.side==='E'&&t.hp>0&&!t.dog&&Math.random()<.5&&typeof sfxPain==='function')sfxPain(t,t.hp<40);
  if(t.mon&&t.hp>0)monHurt(t);   // a monster's shriek, or the Brood Mother's roar and her next phase (monsters.js, fortress.js)   // a cry of pain, a scream once he's badly hurt (Bryan: screaming, not a voice saying "ow, my leg")
  if(t.hp<=0){
    t.hp=0;
    if(t.side==='P'){
      if(typeof sfxScream==='function'){if(Math.random()<.65)sfxScream(t);else sfxGrunt(t,true);sfxBodyFall(t.x,t.y);}   // he goes down screaming
      t.downed=true;t.wasDown=true;downCount++;t.stats.downs++;t.bleed=BLEED_T;t.critical=false;t.noBleed=false;t.revive=0;t.boxRev=0;t.path=[];t.supT=null;t.medGo=null;t.carryGo=null;if(t.carry)putDown(t);if(t.cargo&&typeof dropCargo==='function')dropCargo(t);
      callout(t,'Man down!',C.bad);banner(`${t.name} is down. Get a teammate to him.`);
      chatDown(t);   // "Hayes is down!" ... "Hang on, Hayes, I've got you." (chatter.js)
      sel=sel.filter(x=>x!==t);preview=null;
    }else{
      t.dead=true;t.path=[];callout(t,t.mon?'Got it':'Tango down',C.good);if(typeof sfxBodyFall==='function'){sfxBodyFall(t.x,t.y);if(!t.dog){const r=Math.random();if(r<.35)sfxScream(t,.85);else if(r<.65)sfxGrunt(t,true);}}
      {const o=enemies.find(q=>q!==t&&!q.dead&&!q.dog&&q.alerted&&hyp(q.x-t.x,q.y-t.y)<220);if(o)bark(o,'down');}
      if(src&&src.side==='P'){creditKill(src);if(Math.random()<.25)say(src,'kill');chatKill(src);}
      if(t.mon)monDied(t);else paintDecal({k:'body',x:t.x,y:t.y,a:t.ang,r:Math.random()});addBody(t);enemyDown(t);   // (a body someone may find: layers.js; the sniper's rifle: mission.js)
    }
  }
}

function pickTarget(u){
  // undetected, the squad holds fire except at a hostile you've told them to shoot (or into a room they're breaching)
  if(u.side==='P'&&volleyHeld(u))return null;   // the silencers are about to take him: wait for it
  let foes=u.side==='P'?(caught(u)||simT<(u.breachT||0)?enemies.filter(e=>!beaten(e)):u.focus&&!beaten(u.focus)?[u.focus]:u.watch?enemies.filter(e=>inWatch(u,e)):[]):players.filter(p=>alive(p)&&(!contact||caught(p)));
  if(u.side==='E'&&u.l4&&!u.mon)foes=foes.concat(enemies.filter(m=>m.mon&&!beaten(m)));
  else if(u.side==='P'&&MAPID==='l4'&&!caught(u))foes=foes.concat(enemies.filter(m=>m.mon&&!beaten(m)&&!foes.includes(m)));   // (Level 4: a hidden team still fights off the brood; the monsters don't tell their men where it is)   // Level 4: the summit's men shoot the monsters too (level4.js)   // on Watch: whoever comes into his cone (orders.js)   // a jeep is shot at through its driver (hits go to the jeep)
  let best=null,bs=-1;const R=u.reach?Math.min(u.reach,wRange(u)):wRange(u);   // (a hostile with a reach of his own shoots no further than he sees: Level 2's guards, level2.js)
  for(const f of foes){
    if(hyp(f.x-u.x,f.y-u.y)>R)continue;
    if(u.onGun){let da=Math.atan2(f.y-u.onGun.y,f.x-u.onGun.x)-u.onGun.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>u.onGun.arc)continue;}   // a mounted gun only swings so far
    const L=fireLine(u,f);if(!L)continue;
    let c=hitChance(u,f,L);if(u.focus===f)c+=1;if(u.watch&&inWatch(u,f))c+=.5;
    if(c>bs){bs=c;best={t:f,L};}
  }
  return best;
}
// who a soldier sees: 36 m round him; with a sniper rifle, 70 m the way he's looking (all round when he's the one selected)
function canSee(p,e){
  const d=hyp(p.x-e.x,p.y-e.y),rc=isCls(p,'recon');if(d<=360+(rc?CLS.seeMore:0)+(e.mon==='boss'?900:0))return!!fireLine(p,e);   // (the Brood Mother is huge: seen wherever there's a line to her, fortress.js)
  if(p.weapon!=='sniper'||d>700+(rc?CLS.sniperMore:0))return false;   // (Recon sees further: classes.js)
  let da=Math.atan2(e.y-p.y,e.x-p.x)-p.ang;da=Math.atan2(Math.sin(da),Math.cos(da));
  return(Math.abs(da)<.45||(sel.length===1&&sel[0]===p))&&!!fireLine(p,e);
}
function burst(u,t,L){
  if(t.side==='P')t.firedOnT=simT;   // (under fire: the squads apart can't be left while it lasts, input.js)
  if(u.side==='E')u.revealT=simT+3;else if(t.side==='E')t.revealT=Math.max(t.revealT||0,simT+1.6);   // a muzzle flash gives him away; and you can see who your men are shooting at
  if(u.gunner&&hyp(u.x-camT.x,u.y-camT.z)<260)shake(.14);
  if(u.heavy&&++u.rounds>=HEAVY.bursts){u.rounds=0;u.reloadT=simT+HEAVY.reload+1;bark(u,'reload',true);if(typeof sfxReload==='function')setTimeout(()=>sfxReload(u.x,u.y),600);}   // the run's heavy gun: a reload after this burst
  u.target=t;u.aimT=simT;if(u.veh)u.aimA=Math.atan2(L.ty-L.fy,L.tx-L.fx);else{u.ang=Math.atan2(L.ty-L.fy,L.tx-L.fx);leanOut(u,L);}
  const c=hitChance(u,t,L);
  const n=u.gunner?5:wOf(u).n;   // machine guns fire long bursts, rifles 3-round bursts, a shotgun or a sniper rifle one round
  const q=silenced(u);if(q&&u.weapon!=='m4s'){u.specN--;if(!u.specN)callout(u,'Silencer worn out',C.warn);}   // a silencer: a quiet burst, and it wears a little (a silenced rifle doesn't)
  for(let i=0;i<n;i++)shots.push({at:simT+i*(u.gunner||n>3?0.07:0.08),u,t,L,hit:Math.random()<c,quiet:q});
  if(u.side==='P'&&t.alerted&&!t.mon&&simT>t.flankCD&&shotCover(L)===0){t.flankCD=simT+6;callout(t,'Flanked',C.good);}   // (not a monster: they don't take cover)
}
function resolveShot(s){
  const u=s.u,t=s.t;if(u.dead||u.downed||t.dead)return;
  // plain shots track both soldiers through the burst; a lean or peek spot stays where it was
  const L=s.L,fx=L.lean?L.fx:u.x,fy=L.lean?L.fy:u.y,tx=L.atPeek?L.tx:t.x,ty=L.atPeek?L.ty:t.y;
  let ex=tx,ey=ty;
  if(!s.hit){
    const cov=shotCover({fx,fy,tx,ty,atPeek:L.atPeek});
    const a=Math.atan2(ty-fy,tx-fx),d=hyp(tx-fx,ty-fy);
    if(cov&&Math.random()<.7){ex=fx+Math.cos(a)*(d-10);ey=fy+Math.sin(a)*(d-10);sparks.push({x:ex,y:ey,t:0});if(typeof sfxImpact==='function')sfxImpact(ex,ey);}   // it hit his cover: what it sounds like depends on what it is
    else if(t.side==='P'&&Math.random()<.5&&typeof sfxImpact==='function')sfxImpact(ex,ey,'ground');   // incoming: the near misses smack the ground round him
    else{const aa=a+(Math.random()-.5)*0.22,dd=d+Math.random()*40-8;ex=fx+Math.cos(aa)*dd;ey=fy+Math.sin(aa)*dd;}
  }
  const sg=u.weapon==='shotgun';   // a shotgun: a spread of pellets, hard hits close, less with range
  if(sg){const a=Math.atan2(ey-fy,ex-fx),d=hyp(ex-fx,ey-fy);for(let k=0;k<4;k++){const aa=a+(Math.random()-.5)*0.16;tracers.push({x1:fx,y1:fy,x2:fx+Math.cos(aa)*d,y2:fy+Math.sin(aa)*d,t:0,col:'255,231,163'});}}   // a spread of pellets
  else tracers.push({x1:fx,y1:fy,x2:ex,y2:ey,t:0,col:u.side==='P'?'255,231,163':'255,140,100',q:s.quiet});
  if(s.quiet)lastNoiseT=simT;else flashes.push({x:fx,y:fy,t:0,u});   // a silencer hides the flash
  t.sup=Math.min(1.2,t.sup+(u.gunner?0.08:wOf(u).sup)*(t.side==='P'?rankNerve(t)*(nearCaptain(t)?CLS.leadNerve:1):1)*(isCls(u,'support')?CLS.supMul:1));   // machine guns, sniper rounds and shotgun blasts pin people down (a Support harder; a Captain steadies the men near him: classes.js)
  if(s.hit&&t.veh){sparks.push({x:tx,y:ty,t:0});if(typeof sfxImpact==='function')sfxImpact(tx,ty,'metal');}   // the jeep: rounds spark off its body, and some find the crew
  else if(s.hit&&typeof sfxFlesh==='function'){sfxFlesh(tx,ty);if(t.side==='P'&&Math.random()<.45)sfxGrunt(t,false);}   // (an enemy's cry is in damage())   // a hit: the thud, and often a grunt
  if(s.hit){const W=wOf(u),dm=sg?(38+Math.random()*12)*clamp(1-(hyp(tx-fx,ty-fy)-60)/200,.35,1):(W.dmg[0]+Math.random()*(W.dmg[1]-W.dmg[0]))*(u.side==='E'?(u.heavy?HEAVY.dmg:u.gunner?0.45:W.far?ESNIPER.dmg:0.6):1);if(t.seat==='driver')vehHit(t.inVeh,dm,u);else damage(t,t.veh?dm*GJEEP.bullet:dm,u);}
  if(u.side==='P'){alertAll('Contact. Weapons free.',true,fx,fy,ex,ey,{x:fx,y:fy},s.quiet?SIL.open:undefined,s.quiet?SIL.wall:undefined,!s.quiet,u);squadNoise(u,fx,fy,s.quiet?SIL.open:undefined,s.quiet?SIL.wall:undefined);}   // they'll think the squad is where the shot came from (a silenced shot: only close by)
  else alertAll(null,false,fx,fy,ex,ey,t.mon?t:{x:t.x,y:t.y});   // (at a monster, Level 4: their men hear it, but it gives none of ours away)   // their own gunfire is heard nearby too
  if(t.side==='E'&&!t.alerted)t.alerted=true;
}
function suppressShot(u){
  const a=u.supT;
  if(!enemies.some(e=>!beaten(e)&&hyp(e.x-a.x,e.y-a.y)<55)){u.supT=null;callout(u,'Area clear',C.good);return;}
  const tg=[];
  for(const e of enemies){if(beaten(e)||hyp(e.x-a.x,e.y-a.y)>=55)continue;const L=fireLine(u,e);if(L)tg.push({e,L});}
  let L=null,t=null;
  if(tg.length){const k=tg[(Math.random()*tg.length)|0];t=k.e;L=k.L;}
  else{
    const f=sightOf(u,a.x,a.y);
    if(!f){u.cool=.6;if(++u.noLine>4){u.supT=null;callout(u,'No line of fire',C.warn);}return;}
    L={fx:f.x,fy:f.y,tx:a.x,ty:a.y,lean:f.x!==u.x||f.y!==u.y,atPeek:false};
  }
  u.noLine=0;u.ang=Math.atan2(L.ty-L.fy,L.tx-L.fx);u.aimT=simT;leanOut(u,L);
  const q=silenced(u);if(q&&u.weapon!=='m4s'){u.specN--;if(!u.specN)callout(u,'Silencer worn out',C.warn);}
  const hit=t&&Math.random()<hitChance(u,t,L)*0.35;
  const aa=u.ang+(Math.random()-.5)*0.12,dd=hyp(L.tx-L.fx,L.ty-L.fy)+(hit?0:Math.random()*20-14);
  const ex=hit?L.tx:L.fx+Math.cos(aa)*dd,ey=hit?L.ty:L.fy+Math.sin(aa)*dd;
  tracers.push({x1:L.fx,y1:L.fy,x2:ex,y2:ey,t:0,col:'255,231,163',q});if(q)lastNoiseT=simT;else flashes.push({x:L.fx,y:L.fy,t:0,u});
  if(typeof sfxShot==='function'&&q)sfxShot(u,true);
  if(!hit&&Math.random()<.6)sparks.push({x:ex,y:ey,t:0});
  const hv=u.weapon==='hmg',sm=isCls(u,'support')?CLS.supMul:1;for(const{e}of tg){e.sup=Math.min(1.2,e.sup+(hv?0.24:0.17)*sm);e.alerted=true;}   // (the heavy gun pins harder, and faster)
  if(hit)damage(t,12,u);
  alertAll('Contact. Weapons free.',true,u.x,u.y,ex,ey,{x:u.x,y:u.y},q?SIL.open:undefined,q?SIL.wall:undefined,!q,u);squadNoise(u,u.x,u.y,q?SIL.open:undefined,q?SIL.wall:undefined);
  u.cool=hv?.26+Math.random()*.08:.42+Math.random()*.12;
}
/* what a throw or a rocket needs (Bryan, after v70: smoke and the RPG walked him off instead of firing). A frag or a smoke can
   is lobbed: over anything up to a container's height outdoors (not over a building's walls, and indoors only through
   doorways), and through smoke. A rocket flies straight (round a corner he can lean past), and through smoke too. */
const LOB_H=30,NO_LOB=new Set(['wall','window','owall','iwall','liftwall','steeldoor','liftdoor','carddoor','office','garage','booth','gatehouse','dcblock','bars']);
function lobOK(x,y,tx,ty){
  for(const o of objs){if(!o.full||!segHitsRect(x,y,tx,ty,o,0)||inRect(x,y,o)||inRect(tx,ty,o))continue;if(MAPID==='in'||NO_LOB.has(o.kind)||objHeight(o)>LOB_H)return false;}
  return true;
}
// a rocket flies from his shoulder (1.5 m) to its mark's height: up the side of something tall (a mast, a tower), so it clears
// whatever is lower than its path on the way (the radio hut in front of Level 1's mast); at a man or the ground it stays low
const RPG_SH=15;
function rocketAim(tx,ty){const o=objs.find(o=>objHeight(o)>30&&rectDist(tx,ty,o)<=12),h=o?objHeight(o):0;return h>30?Math.min(h*.6,40):8;}   // (on or right by something tall: up its side)
function rocketHits(x,y,tx,ty,z0,z1){   // the first full object the path runs into below its height, or null (smoke doesn't stop it)
  const dx=tx-x,dy=ty-y,L2=dx*dx+dy*dy||1;
  for(const o of objs){if(!o.full||!segHitsRect(x,y,tx,ty,o,0)||inRect(x,y,o)||inRect(tx,ty,o))continue;
    let t=1;for(const[cx,cy]of[[o.x,o.y],[o.x+o.w,o.y],[o.x,o.y+o.h],[o.x+o.w,o.y+o.h]])t=Math.min(t,((cx-x)*dx+(cy-y)*dy)/L2);   // (where it meets it at the earliest: lowest)
    if(objHeight(o)>=z0+(z1-z0)*Math.max(0,t))return o;}
  return null;
}
function throwFrom(u,tx,ty,kind){   // where he throws or fires from (his spot, or leaned out round a corner), or null
  if(hideAt(u.x,u.y)!==hideAt(tx,ty))return null;
  if(kind==='rpg'){const th=rocketAim(tx,ty),ok=(x,y)=>!rocketHits(x,y,tx,ty,RPG_SH,th);
    if(ok(u.x,u.y))return{x:u.x,y:u.y};if(u.path.length||shy(u))return null;for(const p of leanPts(u.x,u.y,tx,ty))if(ok(p.x,p.y))return p;return null;}
  if(lobOK(u.x,u.y,tx,ty))return{x:u.x,y:u.y};
  return u.path.length||shy(u)?(los(u.x,u.y,tx,ty,true)?{x:u.x,y:u.y}:null):sightFrom(u.x,u.y,tx,ty,true);
}
/* the M203 (Bryan: a bonus find in Level 4, "an M203 grenade launcher attachment (goes in the place of the grenade - goes farther
   and is stronger)"): a soldier who has one (u.gl) fires 40 mm grenades from under his rifle where his frag would be thrown:
   M203.rounds of them, refilled at ammo drops, out to M203.range, a bigger blast (explode's R and D), a flatter, quicker arc */
const M203={range:360,rounds:3,R:68,D:120,dur:.55};
const nadeRange=u=>u&&u.gl?M203.range:170;
const nadeFull=u=>u.gl?M203.rounds:isCls(u,'assault')?CLS.frags:1;   // (stations refill to this: hq.js)
function throwNade(u,tx,ty){
  const gl=!!u.gl;
  if(hyp(tx-u.x,ty-u.y)>nadeRange(u)){banner(gl?'Out of range for the M203. Fire inside the circle.':'Too far. Throw inside the circle.');return false;}
  const f=throwFrom(u,tx,ty,'nade');
  if(!f){banner('No clear throw from here.');return false;}
  const L={fx:f.x,fy:f.y,tx,ty,lean:f.x!==u.x||f.y!==u.y};
  u.grenade=Math.max(0,(u.grenade||0)-1);u.lastOrder=simT;u.nadeT=simT;u.throwT=simT;u.ang=Math.atan2(ty-f.y,tx-f.x);u.aimT=simT;leanOut(u,L);   // (one frag of his: an Assault carries two, classes.js)
  if(gl){nades.push({x0:f.x,y0:f.y,x1:tx,y1:ty,t:0,dur:M203.dur*(.6+.4*hyp(tx-f.x,ty-f.y)/M203.range),by:u,R:M203.R,D:M203.D,gl:true});u.stats.items++;flashes.push({x:f.x,y:f.y,t:0,u});if(typeof playSample==='function')playSample('launch',u.x,u.y,.32,1.7);callout(u,'Grenade out!',C.warn);return true;}   // (a thump, a little flash at the muzzle)
  nades.push({x0:f.x,y0:f.y,x1:tx,y1:ty,t:0,dur:.9,by:u});u.stats.items++;if(typeof sfxPin==='function')sfxPin(u.x,u.y);
  callout(u,'Frag out!',C.warn);
  return true;
}
// a smoke grenade: thrown like the frag, it pops a cloud that blocks sight both ways (SMOKE in map.js). Quiet: no alarm
function throwSmoke(u,tx,ty){
  if(u.spec!=='smoke'||!u.specN){banner(`${u.name} has no smoke.`,1600);return false;}
  if(hyp(tx-u.x,ty-u.y)>SMOKE.range){banner('Too far. Throw inside the circle.');return false;}
  const f=throwFrom(u,tx,ty,'smoke');
  if(!f){banner('No clear throw from here.');return false;}
  const L={fx:f.x,fy:f.y,tx,ty,lean:f.x!==u.x||f.y!==u.y};
  u.specN--;u.lastOrder=simT;u.nadeT=simT;u.throwT=simT;u.ang=Math.atan2(ty-f.y,tx-f.x);u.aimT=simT;leanOut(u,L);
  nades.push({x0:f.x,y0:f.y,x1:tx,y1:ty,t:0,dur:.9,by:u,smoke:true});u.stats.items++;if(typeof sfxPin==='function')sfxPin(u.x,u.y);
  callout(u,'Smoke out!',C.warn);
  return true;
}
function popSmoke(x,y){smokes.push({x,y,t0:simT});if(typeof sfxSmoke==='function')sfxSmoke(x,y);}
/* ---------- the RPG (Bravo's special item, Bryan): a rocket at a spot, a big blast; loud ---------- */
const PRPG={range:380,min:60,aim:.6,blast:55,dmg:120,speed:300};
function fireRPG(u,tx,ty){
  if(u.spec!=='rpg'||!u.specN){banner(`${u.name} has no rockets left.`,1600);return false;}
  const d=hyp(tx-u.x,ty-u.y);if(d<PRPG.min){banner('Too close for a rocket.',1600);return false;}
  if(d>PRPG.range){banner('Out of range for the RPG.',1600);return false;}
  const f=throwFrom(u,tx,ty,'rpg');if(!f){banner('No clear shot from here: something’s in the way.');return false;}
  u.specN--;u.lastOrder=simT;u.nadeT=simT;u.ang=Math.atan2(ty-f.y,tx-f.x);u.aimT=simT+PRPG.aim+.5;leanOut(u,{fx:f.x,fy:f.y,tx,ty,lean:f.x!==u.x||f.y!==u.y});
  u.rpgAim={x:tx,y:ty,f,at:simT+PRPG.aim,th:rocketAim(tx,ty)};callout(u,'Rocket!',C.warn);return true;
}
/* ---------- getting into position (Bryan: tap where to throw or fire; if he can't from where he is, he moves to where he can,
   and says so if there's no safe way). Allies never block a throw (only walls and the like do). ---------- */
const routeLen=(u,p)=>{let L=0,x=u.x,y=u.y;for(const q of p){L+=hyp(q.x-x,q.y-y);x=q.x;y=q.y;}return L;};
// would an enemy they know about see this spot? (an unaware one in his cone or close by, an alerted one all round)
function watched(x,y,skip){
  return enemies.some(e=>{if(e===skip||beaten(e)||e.dog||!e.seen)return false;const d=hyp(x-e.x,y-e.y);if(d>(e.alerted?(e.reach||380):eyeR()))return false;
    if(!e.alerted&&d>80){let da=Math.atan2(y-e.y,x-e.x)-e.ang;da=Math.atan2(Math.sin(da),Math.cos(da));if(Math.abs(da)>1.08)return false;}
    return los(e.x,e.y,x,y);});
}
function fireSpot(u,tx,ty,range,minD=0,kind='nade',maxWalk=360){
  const ok=(x,y)=>{const d=hyp(tx-x,ty-y);return d<=range&&d>=minD&&hideAt(x,y)===hideAt(tx,ty)&&(kind==='rpg'?!rocketHits(x,y,tx,ty,RPG_SH,rocketAim(tx,ty)):lobOK(x,y,tx,ty)||!!sightFrom(x,y,tx,ty,true));};
  {const d=hyp(tx-u.x,ty-u.y);if(d<=range&&d>=minD&&throwFrom(u,tx,ty,kind))return{here:true};}
  const th=threats(),safe=c=>caught(u)?isCovered(c,th):!watched(c.x,c.y),cand=[];
  for(const c of coverPts)if(hyp(c.x-u.x,c.y-u.y)<340)cand.push({x:c.x,y:c.y});
  for(const r of[range*.5,range*.8])for(let k=0;k<16;k++){const a=k/16*TAU;cand.push({x:tx+Math.cos(a)*r,y:ty+Math.sin(a)*r});}
  for(const r of[45,90])for(let k=0;k<12;k++){const a=k/12*TAU;cand.push({x:u.x+Math.cos(a)*r,y:u.y+Math.sin(a)*r});}   // (a step or two from where he is)
  const others=players.filter(o=>o!==u&&!o.dead).map(destOf);
  const good=cand.filter(c=>isFree(c.x,c.y,7)&&ok(c.x,c.y)&&!others.some(o=>hyp(o.x-c.x,o.y-c.y)<10)&&safe(c)).map(c=>({...c,d:hyp(c.x-u.x,c.y-u.y)})).sort((a,b)=>a.d-b.d).slice(0,6);
  for(const c of good){const p=findPath(u.x,u.y,c.x,c.y);if(p){const L=routeLen(u,p);if(L<=maxWalk&&L<=c.d*1.7+60)return{x:c.x,y:c.y,path:p};}}
  return null;
}
// kind: 'nade', 'smoke' or 'rpg'
function orderThrow(u,tx,ty,kind){
  u.ret=null;   // (marked again below if he has to walk for it: retTick)
  const R=kind==='rpg'?PRPG.range:kind==='smoke'?SMOKE.range:nadeRange(u),minD=kind==='rpg'?PRPG.min:0;   // (an M203 reaches further than a frag)
  const d=hyp(tx-u.x,ty-u.y);
  if(kind!=='nade'){   // smoke and the rocket go from where he stands, never walking him off towards it (Bryan, after v70); a miss keeps the aim
    if(d>R){banner(kind==='rpg'?'Out of range for the RPG. Fire inside the circle.':'Too far for smoke. Throw inside the circle.',1800);return false;}
    if(d>=minD&&throwFrom(u,tx,ty,kind))return doThrow(u,tx,ty,kind);
    if(kind==='rpg'){   // too close, or a building in the way: a few steps (18 m at most) to where he can fire, then the rocket
      const s=fireSpot(u,tx,ty,R,minD,kind,180);
      if(s&&!s.here){u.path=s.path;u.lastOrder=simT;u.watch=null;u.supT=null;u.focus=null;u.exposeT=0;u.throwGo={x:tx,y:ty,kind,t0:simT};markRet(u);callout(u,d<minD?'Backing off':'Getting a shot',C.warn);return true;}
    }
    banner(kind==='rpg'?(d<minD?'Too close for a rocket.':'No clear shot from here: something’s in the way.'):'No clear throw from here.',1800);return false;
  }
  const s=fireSpot(u,tx,ty,R,minD,kind);
  if(!s){if(typeof gen==='function')chat('nadeno',5,gen(u,'nadeno'));banner(kind==='rpg'?`${u.name} can’t get a safe shot at that.`:`${u.name} can’t get a safe throw at that.`,2000);return false;}
  if(s.here)return doThrow(u,tx,ty,kind);
  u.path=s.path;u.lastOrder=simT;u.watch=null;u.supT=null;u.focus=null;u.exposeT=0;u.throwGo={x:tx,y:ty,kind,t0:simT};markRet(u);
  if(typeof gen==='function')chat('nadego',6,gen(u,'nadego'));callout(u,kind==='rpg'?'Getting a shot':'Getting an angle',C.warn);
  return true;
}
function doThrow(u,tx,ty,kind){return kind==='rpg'?fireRPG(u,tx,ty):kind==='smoke'?throwSmoke(u,tx,ty):throwNade(u,tx,ty);}
function throwTick(){
  for(const u of players){
    const g=u.throwGo;
    if(g){if(!alive(u)||u.carry||u.lastOrder>g.t0+.01)u.throwGo=null;   // (another order since: forget it)
      else if(!u.path.length){u.throwGo=null;if(!doThrow(u,g.x,g.y,g.kind)){callout(u,'No angle',C.warn);backSoon(u,.6,true);}else if(g.kind!=='rpg')backSoon(u,.9,true);}}   // (thrown: back to the others; a rocket once it's gone, below)
    const a=u.rpgAim;if(!a||simT<a.at)continue;u.rpgAim=null;if(!alive(u))continue;   // the rocket goes
    const dd=hyp(a.x-a.f.x,a.y-a.f.y)||1;
    rockets.push({x:a.f.x,y:a.f.y,dx:(a.x-a.f.x)/dd,dy:(a.y-a.f.y)/dd,left:dd,total:dd,z0:RPG_SH,z1:a.th??8,by:u,trail:[],spec:PRPG,speed:PRPG.speed});u.rpgT=simT;
    flashes.push({x:a.f.x,y:a.f.y,t:0});u.stats.items++;backSoon(u,.7,true);if(typeof gen==='function')chat('rpgout',3,gen(u,'rpgout'));
    alertAll('Contact. Weapons free.',true,a.f.x,a.f.y,a.x,a.y,{x:a.f.x,y:a.f.y},undefined,undefined,undefined,u);squadNoise(u,a.f.x,a.f.y);
  }
}
// quiet: no alarm (an explosion with nobody left to hear it)
function explode(x,y,by,quiet,R=58,D=95){   // (R, D: the blast's reach and its damage at the middle; an M203's is bigger)
  booms.push({x,y,t:0,size:R>58?1.25:1});shake(clamp(1.1-hyp(x-camT.x,y-camT.z)/450,0,1));paintDecal({k:'scorch',x,y,r:Math.random()});
  tankBlast(x,y,by);
  const jv=jeepOf();if(jv){const d=hyp(jv.x-x,jv.y-y);if(d>1&&d<60)vehBlast(jv,70*(1-d/62));}
  for(const v of units){
    if(v.dead||v.seat==='driver'||v.side==='C')continue;const d=hyp(v.x-x,v.y-y);if(d>R)continue;   // (nobody harms the scientists or the men still locked up: office.js)   // the driver is shielded; riders and the gunner sit in the open
    if(!los(x,y,v.x,v.y)||hideAt(v.x,v.y)!==hideAt(x,y))continue;   // the tunnel shelters whoever's inside
    v.sup=Math.min(1.2,v.sup+0.8);
    if(!v.downed)damage(v,D*(1-d/(R+4)),by);
    if(v.side==='E'&&!v.surr)v.alerted=true;
  }
  const theirs=!!by&&by.side==='E';   // an enemy grenade (layers.js): no ambush for the squad, and the base doesn't count its own
  if(!quiet){alertAll('Contact. Weapons free.',!theirs,x,y,null,null,{x,y},undefined,undefined,undefined,theirs?null:by);if(by&&by.side==='P')squadNoise(by,x,y);}   // (our blast gives away the thrower's team, not whoever's near it)
  if(by&&by.side==='P')raiseAlert(1,'blast',false);
}

/* ---------- stealth ---------- */
// Gait is automatic: sneak while undetected with a live enemy within SNEAK_R, otherwise run. The gait button flips it (gaitForce).
const SNEAK_R=300,RUN_SPEED=54,SNEAK_SPEED=24,CRAWL_SPEED=13;   // crawling through the sewer pipe: about 6 s end to end
function gaitOf(p){return p.carry||p.cargo?'sneak':p.gaitForce||autoGait(p);}   // carrying a man: always at sneaking speed
function autoGait(p){
  if(MAPID==='in'){const f=floorOf(p.x,p.y);return !caught(p)&&enemies.some(e=>!beaten(e)&&e.floor===f&&hyp(e.x-p.x,e.y-p.y)<SNEAK_R&&(hyp(e.x-p.x,e.y-p.y)<120||gridSight(p.x,p.y,e.x,e.y)))?'sneak':'run';}   // indoors there's always someone behind a wall: sneak when one's close or in sight
  return !caught(p)&&enemies.some(e=>!beaten(e)&&hyp(e.x-p.x,e.y-p.y)<SNEAK_R&&sameFloor(e.x,e.y,p.x,p.y))?'sneak':'run';   // (a covert team keeps sneaking while the other fights)
}
// An unaware enemy builds awareness (0..1) instead of spotting the squad instantly. Seeing a soldier in his cone
// (or very close) raises it faster the closer, faster and more exposed the soldier is; running is also heard through walls.
// It fades slowly when there's nothing to notice. Past AWARE_LOOK he turns towards what he noticed; at 1 he raises the alarm.
const SEE_RATE=1.6,NOISE_R=110,AWARE_FADE=0.15,AWARE_LOOK=0.35;
function sense(e,dt){
  if(e.dog){dogSense(e,dt);return;}
  let gain=0,best=0,src=null;const{r:R,cone:CONE}=eyeOf(e);   // on alert their eyes reach further (layers.js); the sniper's and the truck's are their own
  const fwd=e.veh&&e.drive&&e.drive.parked?e.aimA:e.ang;
  for(const p of players){
    if(!alive(p))continue;const d=hyp(p.x-e.x,p.y-e.y);let g=0;
    if(d<=R){
      let da=Math.atan2(p.y-e.y,p.x-e.x)-fwd;da=Math.atan2(Math.sin(da),Math.cos(da));
      const cone=Math.abs(da)<CONE;
      if((cone||(d<80&&!e.onTower))&&fireLine(e,p)){   // (up the watchtower he watches his cone: men sneaking round the foot of it, behind him, aren't noticed; Bryan, "hugging the left side all the way down will get to it")
        g=SEE_RATE*(1-d/(R*1.1));
        if(cone)g*=p.path.length?(p.gait==='sneak'?0.6:1.3):(coverAt(p.x,p.y,e.x,e.y)>0?0.3:0.45);   // moving draws the eye; still in cover least (in the sewer pipe nobody can see him at all: fireLine)
        else g*=p.path.length?(p.gait==='sneak'?0.04:0.65):0.03;   // close behind him: a man creeping up is hard to notice (takedowns), one running up isn't
        if(p.gait==='sneak'&&isCls(p,'specops'))g*=CLS.sneakSpot;   // (Spec Ops: harder to spot sneaking, classes.js)
      }
    }
    if(p.path.length&&p.gait==='run'&&d<NOISE_R)g+=0.5*(1-d/NOISE_R);
    gain+=g;if(g>best){best=g;src=p;}
  }
  if(e.jumpy)gain*=1.3;   // the checkpoint garrison is on edge
  if(e.heavy&&!HEAVY.dark)gain*=1.5;   // the run's searchlight (dark once Level 2's power's cut: level2.js)
  if(gain>0){e.aware=Math.min(1,e.aware+gain*dt);e.susp={x:src.x,y:src.y};}
  else e.aware=Math.max(0,e.aware-AWARE_FADE*dt);
  if(e.aware>=AWARE_LOOK&&!e.wary){e.wary=true;if(e.vis)callout(e,'?',C.warn);chatHush(e);}   // ("Freeze. He heard something.": chatter.js)
  else if(e.aware<0.2&&e.wary){e.wary=false;chatClear();}
  if(e.aware>=1){callout(src,'Spotted!',C.bad);shout(e,src);}   // he shouts: those near him know too (hunt.js)
}
// The team that's still hidden while the other fights (Bryan): an alerted man doesn't see its soldiers all round; he notices
// them the way an unaware man does (his cone, or close behind him), only quicker; then that team is caught too
function senseCovert(e,dt){
  if(e.dog||e.surr)return;
  let gain=0,best=0,src=null;const R=e.eye?e.eye.r*EYE_K:eyeR(),CONE=e.eye?e.eye.cone:1.08,fwd=e.veh&&e.drive&&e.drive.parked?e.aimA:e.ang;
  for(const p of players){
    if(!alive(p)||p.offMap||caught(p))continue;const d=hyp(p.x-e.x,p.y-e.y);if(d>R)continue;let g=0;
    let da=Math.atan2(p.y-e.y,p.x-e.x)-fwd;da=Math.atan2(Math.sin(da),Math.cos(da));const cone=Math.abs(da)<CONE;
    if((cone||(d<80&&!e.onTower))&&fireLine(e,p)){
      g=SEE_RATE*1.5*(1-d/(R*1.1));
      g*=cone?(p.path.length?(p.gait==='sneak'?0.6:1.3):(coverAt(p.x,p.y,e.x,e.y)>0?0.3:0.45)):(p.path.length?(p.gait==='sneak'?0.1:0.8):0.06);
      if(p.gait==='sneak'&&isCls(p,'specops'))g*=CLS.sneakSpot;
    }
    if(p.path.length&&p.gait==='run'&&d<NOISE_R)g+=0.5*(1-d/NOISE_R);
    gain+=g;if(g>best){best=g;src=p;}
  }
  if(gain>0)e.awareC=Math.min(1,(e.awareC||0)+gain*dt);else e.awareC=Math.max(0,(e.awareC||0)-.3*dt);
  if(e.awareC>=1&&src){e.awareC=0;e.lkp={x:src.x,y:src.y,t:simT};e.sawT=simT;callout(src,'Spotted!',C.bad);bark(e,'spot',true);startContact(null,false,src);}
}
// detection meter for the HUD: the most suspicious live enemy, full once there's contact
function detection(){const mine=sel.filter(alive).length?sel.filter(alive):players.filter(alive);if(contact&&mine.every(caught))return 1;let a=0;for(const e of enemies)if(!beaten(e))a=Math.max(a,e.alerted?(contact?(e.awareC||0):.85):e.aware);return a;}   // (the team selected still hidden while the other fights: how close they are to noticing it)   // hunting you without contact: high, but not spotted

/* ---------- takedowns (Bryan: silently kill a man you get behind unseen) ---------- */
// One soldier selected and a hostile who hasn't noticed anyone, within TK_RANGE, with his back to him (the soldier is
// outside his view cone): the hostile's label says TAKEDOWN and tapping him sends the soldier sneaking up behind him
// (forced sneak; he follows if the man moves). Close behind him he grabs him (TK_TIME s, the man frozen) and kills him
// silently: no shot, no blast, no alarm; it counts as a kill. If the man is alerted on the way in, it's off and the
// soldier stops where he is. Not a sentry inside a structure (the pillbox).
const TK_RANGE=140,TK_REACH=10,TK_TIME=.6;
function behindSpot(e){   // a free spot at his back: straight behind first, then round to either side, still outside his cone (his back may be to a wall)
  for(const r of[TK_REACH,TK_REACH+4])for(const da of[0,.6,-.6,1.1,-1.1,1.5,-1.5]){const a=e.ang+Math.PI+da,x=e.x+Math.cos(a)*r,y=e.y+Math.sin(a)*r;if(isFree(x,y,7)&&los(e.x,e.y,x,y))return{x,y};}
  return null;
}
function canTakedown(u,e){
  if(!u||!e||!alive(u)||u.inVeh||u.crawl||u.tk||e.dead||e.dog||e.veh||e.alerted||caught(u)||!e.vis||e.elev||e.grabbed)return false;
  const d=hyp(u.x-e.x,u.y-e.y);if(d>TK_RANGE)return false;
  let da=Math.atan2(u.y-e.y,u.x-e.x)-e.ang;da=Math.atan2(Math.sin(da),Math.cos(da));
  return Math.abs(da)>1.08&&!!behindSpot(e);   // he's not looking his way
}
function orderTakedown(u,e){
  const sp=behindSpot(e),p=sp&&findPath(u.x,u.y,sp.x,sp.y);
  if(!p||pathTime(p,u.x,u.y)>TK_RANGE*1.7){banner('Can\u2019t get behind him from here.',1800);return false;}
  u.path=p;u.lastOrder=simT;u.focus=null;u.supT=null;u.focusTank=null;u.plant=null;u.gaitForce='sneak';u.tk={e,spot:sp,t:simT,re:simT};markRet(u);
  callout(u,'Moving in',C.good);return true;
}
function takedownTick(dt){
  for(const u of players){
    const k=u.tk;if(!k)continue;const e=k.e;
    const end=u.path.length?u.path[u.path.length-1]:null;
    if(!alive(u)||e.dead||(end&&!k.strike&&hyp(end.x-k.spot.x,end.y-k.spot.y)>4)){endTakedown(u,false);continue;}   // down, he's gone, or ordered elsewhere
    if(e.alerted&&!k.strike){endTakedown(u,false);u.path=[];continue;}   // spotted on the way in: off, and he stops where he is
    if(k.strike){if(simT-k.strike>=(isCls(u,'specops')?CLS.tkGrab:TK_TIME)){silentKill(e,u);endTakedown(u,true);backSoon(u,.9);}continue;}
    const d=hyp(u.x-e.x,u.y-e.y);
    if(d<=TK_REACH+6){   // right behind him: grab
      k.strike=simT;e.grabbed=true;u.path=[];u.ang=Math.atan2(e.y-u.y,e.x-u.x);u.aimT=simT;callout(u,'Takedown',C.good);continue;
    }
    if(simT-k.re>.3){   // he's moved or turned: follow him round to his back
      k.re=simT;const sp=behindSpot(e);
      if(sp&&hyp(sp.x-k.spot.x,sp.y-k.spot.y)>12){const p=findPath(u.x,u.y,sp.x,sp.y);if(p){u.path=p;k.spot=sp;}}
      else if(!u.path.length&&sp){const p=findPath(u.x,u.y,sp.x,sp.y);if(p){u.path=p;k.spot=sp;}}
    }
  }
}
function endTakedown(u,done){const e=u.tk&&u.tk.e;if(e&&!done)e.grabbed=false;u.tk=null;if(u.gaitForce==='sneak')u.gaitForce=null;}
/* ---------- the silencer (Bryan: a special item that wears out) ---------- */
// A soldier carrying one fires quietly while it lasts: his gunfire is heard only close by (SIL.open in sight, SIL.wall through
// walls, not the whole room inside) and shows no muzzle flash. Each burst, suppressing shot or silent shot wears it by one
// (six to start, topped up at supply boxes). With just him selected, a hostile who hasn't noticed the squad, in his sight
// within SIL.range, shows SILENT SHOT and the chance (an aimed shot: +SIL.bonus): tapping him, he takes aim for SIL.aim s
// and fires once. A hit drops him without a sound (a body others may find: layers.js); a miss alerts him and anyone right by
// him. If the man notices the squad first, the shot's off.
const SIL={range:200,aim:.45,bonus:.2,open:90,wall:40,missOpen:70,missWall:30};
const silenced=u=>!!u&&u.side==='P'&&(u.weapon==='m4s'||u.spec==='silencer'&&u.specN>0);   // a silenced rifle, or the silencer item while it lasts
function canSilent(u,e){
  if(!u||!e||!alive(u)||!silenced(u)||u.inVeh||u.carry||u.crawl||u.tk||u.climb||e.dead||e.veh||e.surr||e.alerted||!e.vis||e.grabbed)return false;
  return hyp(u.x-e.x,u.y-e.y)<=SIL.range&&!!fireLine(u,e);
}
function silentChance(u,e){const L=fireLine(u,e);return L?clamp(hitChance(u,e,L)+SIL.bonus,.05,.95):0;}
function orderSilent(u,e){
  Object.assign(u,{path:[],focus:null,supT:null,focusTank:null,watch:null,medGo:null,carryGo:null,silent:{e,t:simT},lastOrder:simT,aimT:simT});
  u.ang=Math.atan2(e.y-u.y,e.x-u.x);callout(u,'Taking aim',C.good);return true;
}
function silentTick(){
  volleyCheck();
  const due=new Map();   // the man → the shots that go now: a volley's shots land together, so one man's miss can't call off the others'
  for(const u of players){
    const k=u.silent;if(!k)continue;const e=k.e;
    if(!alive(u)||u.path.length||e.dead||e.surr||!silenced(u)){u.silent=null;continue;}   // down, given a move, or the man's gone
    if(e.alerted){u.silent=null;callout(u,'He\u2019s seen us',C.warn);continue;}   // too late: no quiet shot now
    const L=fireLine(u,e);if(!L){u.silent=null;callout(u,'Lost the shot',C.warn);continue;}
    u.ang=Math.atan2(L.ty-L.fy,L.tx-L.fx);u.aimT=simT;
    if(k.hold||simT<(k.at??k.t+SIL.aim))continue;   // (hold: on him, waiting for the others to get set: volleyCheck)
    u.silent=null;if(!due.has(e))due.set(e,[]);due.get(e).push({u,L});
  }
  for(const[e,shots]of due){
    let killer=null,miss=null;
    for(const{u,L}of shots){
      if(u.weapon!=='m4s')u.specN--;leanOut(u,L);   // (a silenced rifle doesn't wear; the silencer as an item does)
      const hit=Math.random()<clamp(hitChance(u,e,L)+SIL.bonus,.05,.95),mx=hit?0:(Math.random()-.5)*18,my=hit?0:(Math.random()-.5)*18;
      tracers.push({x1:L.fx,y1:L.fy,x2:L.tx+mx,y2:L.ty+my,t:0,col:'214,228,238',q:true});lastNoiseT=simT;
      if(typeof sfxShot==='function')sfxShot(u,true);
      if(hit){if(!killer)killer=u;}else miss={u,L,mx,my};
      if(u.weapon!=='m4s'&&!u.specN)callout(u,'Silencer worn out',C.warn);
    }
    if(killer)silentKill(e,killer);
    else{const{u,L,mx,my}=miss;alertOne(e,{x:u.x,y:u.y},false);alertAll(null,false,L.fx,L.fy,L.tx+mx,L.ty+my,{x:u.x,y:u.y},SIL.missOpen,SIL.missWall,false);callout(u,'Missed',C.warn);setStatus();}
  }
  if(volley&&volley.at!=null&&simT>=volley.at&&!volley.by.some(u=>u.silent)){   // the volley's gone: a word if it was clean
    const v=volley;volley=null;if(v.by.length>1&&v.targets.every(e=>e.dead)&&!contact&&typeof gen==='function'){const w=v.by.find(alive);if(w)chat('volleyok',10,gen(partnerOf(w)||w,'volleyok'));}
  }
}
/* ---------- silenced volleys (Bryan: two or more with silencers take their shots at the same time) ----------
   A hostile who hasn't noticed them, tapped with silenced soldiers selected: the ones who can take him aim, the ones who
   can't yet move up to where they can (unseen, inside SIL.range), and when they're all set (or after VOLLEY_WAIT s) they fire
   together on the lead's count. Tapping him again fires at once with whoever's ready. Anyone selected without a silencer
   holds his fire until the volley goes (pickTarget), then joins in. Their shots land together (silentTick). */
let volley=null;   // {by: aiming, movers: on their way, e, t0, at: when they fire (null: not yet)}
const VOLLEY_WAIT=6;
const volleyCrew=list=>list.filter(u=>silenced(u)&&alive(u));
function canVolley(list,e){return list.filter(u=>canSilent(u,e)).length>1;}
const canQuiet=(list,e)=>list.some(u=>canSilent(u,e));   // at least one of them can take him silently
const volleyHeld=u=>!!volley&&(volley.at==null||simT<volley.at)&&volley.targets.includes(u.focus)&&!caught(u)&&!u.silent;   // (a man without a silencer waits for the silent shots)
function orderVolley(crew,e,movers=[]){
  if(volley&&volley.at==null)volleyCheck(true);   // (another team's volley still getting set: it goes now rather than hang)
  for(const u of crew){orderSilent(u,e);u.silent.hold=true;}
  volley={by:[...crew],movers:[...movers],e,t0:simT,at:null,targets:[e]};volleyCheck();return true;
}
function volleyCheck(now){
  const v=volley;if(!v||v.at!=null)return;
  for(const u of[...v.movers]){
    const gone=!alive(u)||u.lastOrder>v.t0+.01;if(!gone&&u.path.length)continue;   // (another order since: he's out of it)
    v.movers.splice(v.movers.indexOf(u),1);
    if(!gone&&canSilent(u,v.e)){orderSilent(u,v.e);u.silent.hold=true;v.by.push(u);}
    else if(!gone)u.focus=v.e;   // no quiet shot from there after all: he fires with the rest
  }
  v.by=v.by.filter(u=>u.silent&&v.targets.includes(u.silent.e));
  if(!now&&!v.e.dead&&!v.e.alerted&&v.movers.length&&simT-v.t0<VOLLEY_WAIT)return;
  for(const u of v.movers)u.focus=v.e;v.movers=[];
  if(!v.by.length){v.at=simT;return;}
  const lead=v.by.find(u=>/1$/.test(u.id))||v.by[0];let d=SIL.aim+.2;
  if(v.by.length>1){const l=typeof gen==='function'?gen(lead,'volley'):null;if(l&&chat('volley',4,l)){const c=VSPR&&VSPR.speakers[lead.id]&&VSPR.speakers[lead.id].clips[l.clip];d=clamp(c?c[2]-.1:1,SIL.aim,1.8);}}   // they fire on the count
  v.at=Math.max(simT+(now?.15:d),...v.by.map(u=>u.silent.t+SIL.aim));for(const u of v.by){u.silent.hold=false;u.silent.at=v.at;}
}
const volleyNow=()=>volleyCheck(true);
const volleyPending=()=>!!volley&&(volley.at==null||simT<volley.at);
// a second man tapped while they get set: they split, one each (at least one on each man), and still fire on the same count
function volleySplit(e2){
  const v=volley;if(!volleyPending()||v.targets.includes(e2)||e2.alerted)return false;
  const crew=v.by.filter(u=>u.silent);if(crew.length<2)return false;
  const can=crew.filter(u=>canSilent(u,e2)).sort((a,b)=>(silentChance(b,e2)-silentChance(b,v.e))-(silentChance(a,e2)-silentChance(a,v.e)));if(!can.length)return false;
  for(const u of can.slice(0,Math.max(1,Math.floor(crew.length/2)))){u.silent.e=e2;u.silent.t=simT;u.ang=Math.atan2(e2.y-u.y,e2.x-u.x);callout(u,'On him',C.good);}
  v.targets.push(e2);if(v.at!=null){v.at=Math.max(v.at,simT+SIL.aim);for(const u of v.by)if(u.silent)u.silent.at=v.at;}
  return true;
}
/* ---------- the fire order (Bryan: tap a hostile and whoever's selected opens fire on him; anyone without a clear shot goes
   and finds one) ----------
   Unseen, against a man who hasn't noticed them: the volley above. Otherwise everyone gets him as their focus: from where
   they are if they have a line, else from the nearest spot that has one, a short walk away (in a fight, in cover if there is
   any; unseen, out of the hostiles' sight). */
function lineSpot(u,e,range,quiet){
  const t=e.vis||!e.last?{x:e.x,y:e.y}:e.last,R=range||Math.min(wRange(u),360)*.95,ok=(x,y)=>hyp(t.x-x,t.y-y)<=R&&hideAt(x,y)===hideAt(t.x,t.y)&&!!sightFrom(x,y,t.x,t.y);
  const th=threats(),cg=caught(u),cand=[];
  for(const c of coverPts)if(hyp(c.x-u.x,c.y-u.y)<300)cand.push({x:c.x,y:c.y});
  for(let dx=-200;dx<=200;dx+=20)for(let dy=-200;dy<=200;dy+=20)if(dx*dx+dy*dy<=200*200)cand.push({x:u.x+dx,y:u.y+dy});   // and the ground round him
  const others=players.filter(o=>o!==u&&!o.dead).map(destOf);
  // cheapest: a short walk; in a fight, in cover; unseen, out of the hostiles' sight (for a quiet shot, his too) and behind something; never right on top of him
  const cost=c=>{const dt=hyp(t.x-c.x,t.y-c.y);return hyp(c.x-u.x,c.y-u.y)+(dt<(quiet?60:110)?((quiet?60:110)-dt)*2:0)+(cg?(isCovered(c,th)?0:90):(watched(c.x,c.y,quiet?null:e)?220:0)+(coverAt(c.x,c.y,t.x,t.y)?0:30));};
  const good=cand.filter(c=>isFree(c.x,c.y,7)&&!others.some(o=>hyp(o.x-c.x,o.y-c.y)<12)&&ok(c.x,c.y)).map(c=>({...c,cost:cost(c)})).sort((a,b)=>a.cost-b.cost).slice(0,8);
  for(const c of good){const p=findPath(u.x,u.y,c.x,c.y);if(p){const L=routeLen(u,p);if(L<=330&&L<=hyp(c.x-u.x,c.y-u.y)*1.8+60)return{x:c.x,y:c.y,path:p};}}
  return null;
}
function orderFire(list,e){
  const go=list.filter(u=>alive(u)&&!u.inVeh&&!u.carry);if(!go.length)return null;
  for(const u of go){if(u.tk)endTakedown(u,false);Object.assign(u,{focus:null,supT:null,focusTank:null,silent:null,fireGo:null,throwGo:null});}
  const crew=[],moveQ=[],fire=[],move=[],none=[];
  if(!e.alerted&&!e.veh&&!e.surr)for(const u of go){   // he hasn't noticed them: the silencers take him together
    if(!silenced(u)||u.onGun||u.onTower||u.climb||u.crawl||caught(u))continue;
    if(canSilent(u,e)){crew.push(u);continue;}
    const s=lineSpot(u,e,SIL.range*.9,true);
    if(s){Object.assign(u,{path:s.path,lastOrder:simT,watch:null,exposeT:0});moveQ.push(u);callout(u,'Moving up',C.good);}
  }
  if(crew.length||moveQ.length)orderVolley(crew,e,moveQ);
  for(const u of go){
    if(crew.includes(u)||moveQ.includes(u))continue;
    u.focus=e;
    if(u.onGun||u.onTower||u.climb){fire.push(u);continue;}   // on a gun or up the tower: he fires from there if he can
    if(fireLine(u,e)&&hyp(e.x-u.x,e.y-u.y)<=wRange(u)){fire.push(u);continue;}
    const s=lineSpot(u,e);
    if(s){Object.assign(u,{path:s.path,lastOrder:simT,watch:null,exposeT:0,fireGo:{e,t0:simT,tries:1}});move.push(u);callout(u,'Getting a line',C.warn);}
    else none.push(u);
  }
  if(!crew.length&&!moveQ.length&&!fire.length&&!move.length)banner(go.length>1?'Nobody can get a clear shot at him from here.':`${go[0].name} can\u2019t get a clear shot at him from here.`,2000);
  return{crew,moveQ,fire,move,none};
}
function fireGoTick(){   // on his way to a spot with a line: there, he fires (his focus); the man moved, he looks again (once)
  for(const u of players){
    const g=u.fireGo;if(!g)continue;
    if(!alive(u)||u.carry||u.lastOrder>g.t0+.01||u.focus!==g.e||beaten(g.e)){u.fireGo=null;continue;}
    if(u.path.length)continue;
    if(fireLine(u,g.e)&&hyp(g.e.x-u.x,g.e.y-u.y)<=wRange(u)){u.fireGo=null;continue;}
    const s=g.tries<2&&lineSpot(u,g.e);if(!s){u.fireGo=null;callout(u,'No line',C.warn);continue;}
    u.path=s.path;u.lastOrder=g.t0=simT;g.tries++;
  }
}
function silentKill(e,u){   // like damage(), but quiet: nobody hears it
  e.grabbed=false;e.hp=0;e.dead=true;e.path=[];callout(e,'Silent kill',C.good);creditKill(u);if(typeof sfxCloth==='function'){sfxCloth(e.x,e.y);sfxBodyFall(e.x,e.y);}
  paintDecal({k:'body',x:e.x,y:e.y,a:e.ang,r:Math.random()});addBody(e);enemyDown(e);chatTakedown(u);   // nobody heard it, but someone may find him (layers.js)
}

/* ---------- AI ---------- */
let spotBannerT=-99,coverTick=0;   // one "Hostile spotted" banner at a time, not one per man
function computeVis(){
  for(const c of civs)c.vis=players.some(p=>alive(p)&&!p.offMap&&hyp(p.x-c.x,p.y-c.y)<=360&&los(p.x,p.y,c.x,c.y));   // the people who aren't soldiers: shown once seen (office.js)
  for(const e of enemies){
    if(e.dead||e.dormant){e.vis=false;continue;}   // (a monster still in its room: fortress.js)
    e.vis=players.some(p=>alive(p)&&canSee(p,e))||(simT<(e.revealT||0)&&!offFloor(e));   // (revealT: he gave himself away firing at us, or one of ours is shooting at him; Bryan couldn't find who was shooting)
    if(e.vis){
      if(!e.seen){e.seen=true;callout(e,e.mon==='boss'?'Brood Mother':e.mon?(e.kind==='crawler'?'The Crawler!':e.kind==='young'?'Her young!':'Hunter!'):'Hostile!',C.bad);if(!contact&&simT-spotBannerT>4){spotBannerT=simT;banner(e.grp===0?'Hostile spotted inside the warehouse.':'Hostile spotted.');}}
      e.last={x:e.x,y:e.y};
    }
    {let n=null,nd=1e9;for(const p of players){if(!alive(p))continue;const d=hyp(p.x-e.x,p.y-e.y);if(d<nd){nd=d;n=p;}}e.coverNow=!!n&&e.alerted&&coverAt(e.x,e.y,n.x,n.y)>0;}
    if(e.surr)continue;   // he gave up (layers.js)
    if(!e.alerted&&!e.grabbed){sense(e,0.1);seeBodies(e);}   // (a body he didn't know about: layers.js)
    else if(e.alerted&&!e.grabbed&&!(MAPID==='l4'&&e.mon)){const p=seenBy(e);if(p){e.sawT=simT;e.lkp={x:p.x,y:p.y,t:simT};if(e.hunt){e.hunt=null;e.huntT0=0;e.path=[];bark(e,'spot');}startContact('Contact.',false,p);}if(contact&&!(e.l4wait&&e.path.length))senseCovert(e,0.1);}   // (Level 4: running to the bunker the lift's coming up into, his mind's on that, level4.js)   // an alerted man who sees the squad: contact goes on, and he knows where they are (it ends when nobody has for a while: hunt.js)
  }
}
// where an alerted enemy may shift between cover: inside the warehouse, unless he has his own zone (the checkpoint garrison)
const WH_ZONE={x0:182,x1:438,y0:272,y1:548};
function enemyThink(e){
  if(e.dead||e.dog||e.surr||!e.alerted||e.path.length||e.gunner||e.post)return;   // posts (tower sentries) never move; dogs: hunt.js
  if(e.sup>0.65){e.exposeT=0;if(moraleBreak(e))return;if(Math.random()<.05)bark(e,'pinned');return;}   // hurt, pinned and alone, he may give up (layers.js)
  if(enemyNade(e))return;   // a soldier who's sat in one spot too long gets a grenade (layers.js)
  if(e.wave===2){assaultThink(e);return;}
  if(e.lkp&&simT-(e.sawT??-99)>LOST_T){huntThink(e);return;}   // they've lost you: the hunt (hunt.js)
  e.hunt=null;e.huntT0=0;
  const vis=players.filter(p=>alive(p)&&hyp(p.x-e.x,p.y-e.y)<=(e.reach||380)&&los(e.x,e.y,p.x,p.y));
  const exposed=vis.some(p=>coverAt(e.x,e.y,p.x,p.y)===0);
  e.exposeT=exposed?e.exposeT+.4:0;
  const hurt=e.hp<40&&!e.fell;
  if(flankThink(e,vis,hurt))return;
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
    const p=findPath(e.x,e.y,best.x,best.y,FOOT);
    if(p){e.path=p;e.moveCool=simT+5;e.exposeT=0;if(hurt)e.fell=true;if(e.vis)callout(e,hurt?'Falling back':'Shifting',C.bad);}
  }else e.moveCool=simT+2;
}
function playerThink(p){
  if(!alive(p)||p.path.length||p.inVeh||p.onTower||p.climb||p.onGun||!caught(p)||p.sup>0.65||p.supT||(breach&&breach.team.includes(p))||simT-(p.nadeT??-99)<6){p.exposeT=0;return;}   // a soldier suppressing holds his spot, and one who's just thrown a grenade stays put (Bryan: those orders mustn't move them)
  if(simT-p.lastOrder<4)return;
  const vis=enemies.filter(e=>!e.dead&&!e.dormant&&e.alerted&&hyp(e.x-p.x,e.y-p.y)<=380&&los(p.x,p.y,e.x,e.y));
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
  if(u.inHeli||u.away)return;   // still in Level 1's helicopter (level1.js), or off screen for a moment (u.away: fortress.js's ending)
  if(u.dead||u.grabbed)return;   // grabbed from behind (a takedown): he's done
  if(u.side==='C'){civTick(u,dt);return;}   // a prisoner still locked up, a scientist: office.js
  if(u.surr){u.hitFlash=Math.max(0,u.hitFlash-dt);u.sup=Math.max(0,u.sup-0.18*dt);u.path=[];return;}   // he gave up: kneeling, hands up (layers.js)
  if(u.side==='P')u.gait=gaitOf(u);
  u.hitFlash=Math.max(0,u.hitFlash-dt);u.sup=Math.max(0,u.sup-0.18*dt);
  if(u.side==='P'){if(u.sup>0.65&&!u.saidPinned&&alive(u)){u.saidPinned=true;say(u,'pinned');}else if(u.sup<0.4)u.saidPinned=false;}
  // vaulting through a window (pathfinding.js): slow over the sill, a hop up and down, no shooting until he's through
  const vw=u.path.length&&u.path[0].vault,vd=vw?Math.abs((vw.vert?u.x:u.y)-vw.c):99;
  {const z=slowAt(u.x,u.y);u.crawl=!!(z&&z.crawl)&&!u.inVeh;}   // in the sewer pipe: prone, crawling
  u.vaultK=vw&&vd<VAULT_HALF&&!u.downed?1-(vd/VAULT_HALF)**2:0;
  if(u.side==='P'&&!u.inVeh&&!u.inBoat&&!u.onTower&&!u.climb){const e0=u.elev||0;u.elev=e0+((u.carriedBy?6:VAULT_H*u.vaultK)-e0)*Math.min(1,dt*16);}   // carried: over his shoulder
  if(u.downed)return;
  if(u.side==='P'&&simT<(u.stunT||0))return;   // knocked off his feet by a dog
  if(u.seat==='driver')return;   // the driver drives; riders and the gunner fight from the jeep
  if((u.carry||u.cargo)&&u.path.some(q=>q.vault)){const d0=u.path[u.path.length-1],np=findPath(u.x,u.y,d0.x,d0.y,FOOT);u.path=np||[];if(!np)callout(u,"Can't climb with him",C.warn);}   // carrying a man: no vaulting, the long way round
  if(u.path.length){u.peek=null;
    const p=u.path[0],dx=p.x-u.x,dy=p.y-u.y,d=hyp(dx,dy);
    const sz=slowAt(u.x,u.y),held=doorWait(u,p,dt),sp=held?0:(u.veh?GJEEP.speed:u.crawl?CRAWL_SPEED:vd<VAULT_HALF?VAULT_SPEED:u.side==='P'?(u.gait==='sneak'?SNEAK_SPEED:RUN_SPEED):u.mon?(u.monSpd||(u.mon==='boss'?BOSS.walk:HOUND.run)):u.dog?(u.alerted?DOG.run:DOG.walk):u.alerted?46:26)*   // an unaware patrol strolls
      (u.sup>0.65?0.7:1)*(sz?sz.k:1)*dt;   // the broken rail bridge is slow going; the sewer pipe is a crawl
    if(held){}else if(d<=sp){u.x=p.x;u.y=p.y;u.path.shift();}else{u.x+=dx/d*sp;u.y+=dy/d*sp;}   // (held: opening a door in his way, orders.js)
    if(u.veh)u.ang=turn(u.ang,Math.atan2(dy,dx),dt*3);   // the jeep swings round
    else if(simT-u.aimT>0.8&&d>0.5)u.ang=turn(u.ang,Math.atan2(dy,dx),dt*8);
  }else if(simT-u.aimT>2){
    if(u.side==='P'){const th=threats();let n=th[0],nd=1e9;for(const t of th){const d=hyp(t.x-u.x,t.y-u.y);if(d<nd){nd=d;n=t;}}u.ang=turn(u.ang,Math.atan2(n.y-u.y,n.x-u.x),dt*3);}
    else if(!u.alerted&&u.aware>=AWARE_LOOK&&u.susp)u.ang=turn(u.ang,Math.atan2(u.susp.y-u.y,u.susp.x-u.x),dt*2);
    else if(u.alerted){const ps=players.filter(p=>alive(p)&&!p.away&&sameFloor(p.x,p.y,u.x,u.y));if(ps.length){let n=ps[0],nd=1e9;for(const t of ps){const d=hyp(t.x-u.x,t.y-u.y);if(d<nd){nd=d;n=t;}}if(u.veh)u.aimA=turn(u.aimA,Math.atan2(n.y-u.y,n.x-u.x),dt*3);else u.ang=turn(u.ang,Math.atan2(n.y-u.y,n.x-u.x),dt*3);}}
  }
  u.cool-=dt*(u.sup>0.65?0.4:1);
  if(u.rpg&&u.alerted&&u.aimAt)rpgThink(u);   // mid-aim: fire when ready
  if(u.cool<=0&&!u.vaultK&&!u.carry&&!u.cargo&&!u.dog&&!(u.reloadT>simT)&&!(u.dazeT>simT)&&u.weapon!==null){   // (dazed by a flashbang: skills.js)   // (carrying a man: hands full; a freed prisoner without a rifle yet: office.js)
    if(u.side==='E'&&!u.alerted)u.cool=.3;
    else if(u.rpg)rpgThink(u);
    else if(u.focusTank&&shootTank(u)){}   // ordered to shoot a fuel tank
    else if(u.supT)suppressShot(u);
    else if(wOf(u).far&&u.path.length)u.cool=.3;   // a sniper rifle: not on the move
    else{const pt=pickTarget(u);if(pt){burst(u,pt.t,pt.L);const W=wOf(u);u.cool=u.gunner?1.3+Math.random()*.5:(W.cool[0]+Math.random()*(W.cool[1]-W.cool[0]))*(u.side==='E'&&W.far?ESNIPER.slow:1);}else u.cool=.25;}
  }
}
function turn(a,b,k){let d=Math.atan2(Math.sin(b-a),Math.cos(b-a));return a+d*Math.min(1,k);}

function update(dt){
  simT+=dt;
  for(let i=shots.length-1;i>=0;i--)if(shots[i].at<=simT){const s=shots[i];shots.splice(i,1);s.u.shotT=simT;sfxShot(s.u,s.quiet);resolveShot(s);}   // (shotT: his rifle kicks: figure.js)
  visTick-=dt;if(visTick<=0){visTick=.1;computeVis();}
  for(const u of units)updateUnit(u,dt);
  medTick(dt);retTick();huntTick(dt);watchTick();breachTick();roomDoorTick(dt);buildTick(dt);skillTick(dt);layersTick(dt);officeEvery(dt);banterTick(dt);tutTick(dt);   // (layers.js: the base's alert, bodies, surrender, enemy grenades, the contact sensor)
  aiTick-=dt;if(aiTick<=0){aiTick=.4;for(const e of enemies)enemyThink(e);for(const p of players)playerThink(p);}
  for(const p of players){
    if(!p.downed||p.dead||p.offMap)continue;   // (one left downed outside the office building waits, frozen)
    if(!p.carriedBy){const z=zoneAt(p.x,p.y);if(z&&z.k==='med'){p.boxRev+=dt;if(p.boxRev>=BOXREV_T){reviveUp(p,35,null);continue;}}else p.boxRev=0;}   // lying in a medical box: back up
    if(!p.critical){
      const hs=players.filter(o=>alive(o)&&!o.path.length&&!o.inVeh&&!o.carry&&hyp(o.x-p.x,o.y-p.y)<24&&o.sup<=PINNED),helper=hs.find(o=>isCls(o,'medic'))||hs[0];   // Bryan: no reviving while pinned (a Medic beside him does it if there is one)
      if(helper){const md=isCls(helper,'medic');p.revive+=dt;p.reviveNeed=md?CLS.reviveT:3;if(p.revive>=p.reviveNeed)reviveUp(p,md?CLS.reviveHp:35,helper);}   // (a Medic: quicker, and he comes up better: classes.js)
      else{p.revive=Math.max(0,p.revive-dt);if(!(typeof hqCalm==='function'&&hqCalm()))p.bleed-=dt;if(p.bleed<=0){p.critical=true;p.crit=CRIT_T;p.revive=0;callout(p,'Critical',C.bad);banner(`${p.name} is critical. Use a medic kit on him, or carry him to a medical box.`,3400);}}
    }else{
      if(!p.noBleed&&!(typeof hqCalm==='function'&&hqCalm()))p.crit-=dt;   // (the man off the basement wall has no clock: office.js; nor anyone while the Headquarters' end plays: fortress.js)
      if(p.crit<=0){if(p.carriedBy)putDown(p.carriedBy);p.dead=true;p.downed=false;p.critical=false;callout(p,'KIA',C.bad);banner(`${p.name} didn't make it.`);}
    }
  }
  for(let i=nades.length-1;i>=0;i--){const n=nades[i];n.t+=dt;if(n.t>=n.dur){nades.splice(i,1);if(n.smoke)popSmoke(n.x1,n.y1);else explode(n.x1,n.y1,n.by,false,n.R,n.D);}}
  if(smokes.length)smokes=smokes.filter(c=>simT-c.t0<SMOKE.life);
  for(const arr of [tracers,flashes,sparks,booms,callouts])for(const f of arr)f.t+=dt;
  if(flashes.some(f=>f.t<=dt+1e-6)||booms.some(b=>b.t<=dt+1e-6))lastNoiseT=simT;   // a shot or a blast this tick: a location's quiet spell starts over (mission.js)
  tracers=tracers.filter(f=>f.t<.12);flashes=flashes.filter(f=>f.t<.07);sparks=sparks.filter(f=>f.t<.22);booms=booms.filter(f=>f.t<.6);callouts=callouts.filter(f=>f.t<(f.dur||1.7));
  if((coverTick-=dt)<=0){coverTick=.25;for(const p of players)if(alive(p))p.covered=isCovered(p,threats());}   // four times a second is plenty (it was every tick)
  for(const u of units)if(u.focus&&beaten(u.focus))u.focus=null;
  takedownTick(dt);silentTick();throwTick();fireGoTick();manTick();
  missionFx(dt);
  if(state==='play'&&!endAt){
    vehTick(dt);waveTick(dt);l1Tick(dt);l2Tick(dt);monTick(dt);hqTickWin();baseTick(dt);roadTick(dt);l4Tick(dt);   // (the monsters and the Headquarters: monsters.js, fortress.js)   // (Level 1: level1.js) cleared the warehouse? then the reinforcements; cleared those? mission complete
    if(!endAt&&players.every(p=>!alive(p))&&players.every(p=>p.dead||p.revive===0))endAt=performance.now()+1500;
  }
}
