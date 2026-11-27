"use strict";
/* Version 168: the two control drafts after Version 167, playable. Bryan, after 167: "It's still a bit chaotic and confusing. Switching the
   teams is a little difficult and chaotic. Throwing grenades and shooting is a little confusing"; on the drafts (docs/drafts/
   dday-controls-draft-1.png and -2.png): "Can you link both drafts so I can test it". Each can be switched off on the start card (DDC, kept in
   localStorage 'warehouseYard.ddctl.v1'), which brings the Version 167 controls back.

   Draft 1, lead one squad and the other backs you up (DDC.lead, Versions 168 to 179): the team tabs went and a swap button with FOLLOW / HOLD
   sat over the squad's bar. Since Version 180 (Bryan: "I like how I originally selected the squads, but I want Bravo to follow by default,
   closer and more aggressive"; then "Let's make the squads work together actively") the start card's switch is gone and it's always on:
   the team tabs are back, the other squad's tab carries FOLLOW / HOLD (ddcHud, ddcChip, ddcToggle), and the other squad fights beside yours
   (ddcSupport, below). Lose everyone in the squad you play and you play the other (ddcLeadCheck).
   Draft 2, the target first (DDC.ring): a tap on an enemy has your squad open fire as before and brings up a ring of what you can do to him
   (Suppress, Grenade, Rifle grenade, Bazooka, each saying who would do it and how far; greyed if nobody can), on a tank and on the wire the
   same (the wire's has MOVE HERE too); the game at quarter speed while it's up (state.js's timeScale asks ddcSlow), gone after 4.5 s or a tap
   anywhere else (ddcTap from ddplay.js's ddTap, ddcRingFrame from the overlay). Thin lines from your men to the man they're shooting and an eye over
   any of them who can't see him, while his ring is up and for 4 s after the order (ddcLines). Versions 168 to 172 had the bar's tools dragged onto the
   map; since Version 173 (Bryan: "No finger dragging. I am clicking") a tool is tapped into hand and the map tapped, as before, and while it's in hand
   the ground the man holding it can reach is filled orange (ddcReach, below). */
const DDC=(()=>{const o={lead:true,ring:true,dodge:true};try{const s=JSON.parse(localStorage.getItem('warehouseYard.ddctl.v1')||'null');if(s&&typeof s==='object'){if(typeof s.ring==='boolean')o.ring=s.ring;if(typeof s.dodge==='boolean')o.dodge=s.dodge;}}catch(e){}return o;})();   // (lead: since Version 180 always, the start card's switch gone; ring: Tap an enemy for actions)
function ddcSave(){try{localStorage.setItem('warehouseYard.ddctl.v1',JSON.stringify(DDC));}catch(e){}}
const ddcOn=()=>MAPID==='dd'&&!!dd&&state==='play'&&!!dd.land&&dd.land.done&&!dd.seq;
const ddcLead=()=>ddcOn()&&DDC.lead&&!dd.fp;
const ddcRing=()=>ddcOn()&&DDC.ring&&!dd.fp;
const ddcName=t=>t==='A'?'Alpha':'Bravo',ddcOther=()=>dd.active==='A'?'B':'A',ddcCol=t=>t==='A'?C.alpha:C.bravo;
function ddcMid(L){return{x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length};}
// the game slowed to a quarter while a ring is up (state.js's timeScale)
let ddcR=null;
function ddcSlow(){return ddcOn()&&!!ddcR&&performance.now()-ddcR.t0<4600;}

/* ---------- the squad you aren't playing ---------- */
function ddcMode(t){const S=dd.sup||(dd.sup={A:'follow',B:'follow'});return S[t]||'follow';}   // (FOLLOW to start everywhere, the counterattack too: Bryan, after Version 168, "Follow by default")
const ddcBusy=u=>!!(u.medGo||u.throwGo||u.rpgAim||u.carry||u.carryGo||u.helpGo||u.raise||u.onGun||u.dcGun||u.build||u.fp||u.joining)||simT-(u.lastOrder??-99)<4;   // (on a job, or given an order of yours a moment ago)
// where a squad may be sent: the beach's strip (off it a man dies of it after 10 s: ddplay.js's ddTick), the village's ground, else the camera's bounds
function ddcBound(x,y){
  const Y=clamp(y,VB.z0+20,VB.z1-20);
  if(dd.vil&&typeof VG!=='undefined')return[clamp(x,VG.x0+30,VG.x1-30),Math.min(870,Y)];
  if(!dd.counter)return[clamp(x,DDX+16,Y<-440?1780:DDX+DDW-16),Y];
  return[clamp(x,VB.x0+20,VB.x1-20),Y];
}
/* Version 180 (Bryan, on the follow drafts, docs/drafts/hill-follow/: side by side, then "let the ai/npc determine if a pincer move is a good
   move at the moment. Let's make the squads work together actively"): once a second (from ddplay.js's ddTick, ddvillage.js's vgTick and
   ddcounter.js's dcTick) for the squad you aren't playing, either way round:
   - its own wounded first, its kit (ddfp.js's fpTools), and the man yours is shooting taken up by any of its men who can see him;
   - HOLD: it stays where it is and pins him down, else the nearest machine gun it can see;
   - FOLLOW, side by side: when you send yours somewhere it goes to cover level with where yours is going, about 10 m to one side (Bravo on
     Alpha's right, Alpha on Bravo's left, as seen from where they're going: the route on the beach, else the objective, else the enemy; the
     other side if nothing fits there), and catches up when it's 7 m off that (every 3 s at most). If yours is being shot at on its way, it
     first pins down whoever's shooting at yours (COVERING), and moves up once yours is there or after 6 s;
   - the man yours is shooting dug in behind cover from yours: a grenade at him from one of its men in reach (every 8 s at most), and the
     pincer (FLANKING): in Version 180 only to ground no other gun could see, which on the beach never came up; since Version 181 under fire
     too, to cover on his side, with the gunner pinning him down and smoke on an exposed way (ddcPincerPlan, below).
   Tried first in tools/drafts/dday-follow-draft.js (variants line and safe). */
const DDC_SIDE=100,DDC_CATCH=70;
function ddcS(t){const S=dd.supS||(dd.supS={});return S[t]||(S[t]={});}
function ddcFwd(D){   // the way they're going, from where yours is going
  const w=typeof ddRouteWay==='function'?ddRouteWay(D.x,D.y):null;if(w)return w;
  const O=typeof ddObjective==='function'?ddObjective():null;if(O&&O.x!=null&&hyp(O.x-D.x,O.y-D.y)>40){const d=hyp(O.x-D.x,O.y-D.y);return{x:(O.x-D.x)/d,y:(O.y-D.y)/d};}
  const th=enemies.filter(e=>!beaten(e)&&(e.seen||e.vis)&&hyp(e.x-D.x,e.y-D.y)<600);if(th.length){const c=ddcMid(th),d=hyp(c.x-D.x,c.y-D.y)||1;return{x:(c.x-D.x)/d,y:(c.y-D.y)/d};}
  return{x:0,y:-1};
}
// Version 192 (Bryan: "when I move one team, the other team runs out in the open when side by side. The units should look for cover always, if following
// the lead squad"): every place tried, and the one that puts the most of them behind cover taken (the first with everyone covered at once); any man still
// left in the open goes to the nearest cover point by his place instead (within 16 m of it, not one a mate is taking), covered from the enemy first
function ddcSend(free,cands){
  let best=null,bn=-1,bt=null;
  for(let i=0;i<cands.length;i++){const[tx,ty]=ddcBound(cands[i][0],cands[i][1]),as=makeAssign(free,tx,ty);if(!as.length)continue;
    const n=as.filter(q=>q.cp||q.cov).length-(free.length-as.length)-i*.15;if(n>bn){bn=n;best=as;bt={x:tx,y:ty};}if(as.length===free.length&&as.every(q=>q.cp||q.cov))break;}
  if(!best)return null;
  const th=threats(),taken=[...best.map(q=>({x:q.x,y:q.y})),...players.filter(p=>!p.dead&&!free.includes(p)).map(destOf)];
  for(const q of best){if(q.cp||q.cov)continue;let bc=null,bs=1e9;
    for(const c of coverPts){const d=hyp(c.x-q.x,c.y-q.y);if(d>160)continue;if(taken.some(o=>o!==q&&hyp(o.x-c.x,o.y-c.y)<10&&!(o.x===q.x&&o.y===q.y)))continue;const sc=d+(isCovered(c,th)?0:60);if(sc<bs){bs=sc;bc=c;}}
    if(bc){const path=findPath(q.u.x,q.u.y,bc.x,bc.y);if(path){const k=taken.findIndex(o=>o.x===q.x&&o.y===q.y);if(k>=0)taken[k]={x:bc.x,y:bc.y};q.x=bc.x;q.y=bc.y;q.path=path;q.cp=true;}}}
  for(const q of best)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0,supT:null});return bt;
}
function ddcPin(free,T){if(!T)return 0;let n=0;for(const u of free)if(!u.path.length&&hyp(u.x-T.x,u.y-T.y)<=wRange(u)&&fireLine(u,T)){if(!u.supT||hyp(u.supT.x-T.x,u.supT.y-T.y)>40)Object.assign(u,{supT:{x:T.x,y:T.y},noLine:0});n++;}return n;}
// Version 181 (Bryan, after Version 180: "Pincer move can happen under fire only when the ai thinks it's safe-ish. And there is cover available.
// Make up your own mind on how this can be made effective. I want the player to see the teams working together while they are controlling it"):
// the pincer's target is the man yours is shooting while he's dug in behind cover from yours, or a machine gun shooting at yours that is. The
// squad goes to cover spots on his side (the map's cover points, coverPts, 12 to 30 m from him and 35 to 90 degrees round from yours) from
// which he has no cover and no other gun of theirs has an open shot (ddcOpenAll, below, leaving him out), its own side first and spots with
// cover from him too first. The way there (the squad's usual route, which keeps out of known guns' sight where it can) may be open to their
// other guns for 16 m all told (DDC_PINCER.expose, 4 m at a time, gun by gun), or up to 40 m when one of the squad has smoke: he throws it on
// the most exposed stretch and the others go behind it. Its machine gunner stays where he is and pins the man down while the others go (fire
// and movement); once they're in place all of them shoot him. Called off if one of them goes down (the rest go to ground where they are);
// once he's down they hold that cover until yours moves on; over too once yours shoots someone else while he isn't shooting at yours, or after
// 25 s. Not with a man of its own down, or fewer than two over half health to go. Every gun of theirs counts, noticed or not; he counts too
// on the way unless the gunner stays on him or he's kept down; no other man of theirs within 20 m of a place, no tank near it. On the
// screen (ddcCoopDraw): an arrow on the ground from them to the spot while they go, the man ringed and marked FLANKED, lines from both squads
// to him once they're in place; one banner as it starts
const DDC_PINCER={near:120,far:300,arcLo:.6,arcHi:1.57,walk:450,expose:4,smoke:10,every:2,again:20,max:25,reach:520,clear:200,hp:50,supp:.4,tank:500};
// (safe-ish, as measured in the village, 18 fights a version: counting only their alerted guns, the squad swung round toward men who hadn't
// noticed it yet, early in the woods and at the field's guns, and its men went down there: so every gun of theirs that could shoot counts,
// noticed or not, no other man of theirs within 20 m of a spot, no tank near it, and only men over half health go)
function ddcOpenAll(x,y,skip){   // their guns with an open shot at (x,y), alerted or not, leaving out skip
  let n=0;for(const e of enemies){if(e===skip||beaten(e)||e.side!=='E'||e.mon||e.dormant)continue;if(hyp(e.x-x,e.y-y)>ddFireR(e)||!los(e.x,e.y,x,y))continue;if(coverAt(x,y,e.x,e.y)===0)n++;}return n;}
function ddcSpotOK(x,y,T){   // a pincer place: a clean shot at him, no other gun with an open shot, nobody else of theirs close, no tank near
  const P=DDC_PINCER;
  if(!los(x,y,T.x,T.y)||coverAt(T.x,T.y,x,y)>0||ddcOpenAll(x,y,T)>0)return false;
  if(enemies.some(e=>e!==T&&!beaten(e)&&e.side==='E'&&!e.mon&&!e.dormant&&hyp(e.x-x,e.y-y)<P.clear))return false;
  return !(typeof ddTanksUp==='function'&&ddTanksUp().some(K=>!K.hold&&hyp(K.x-x,K.y-y)<P.tank&&los(K.x,K.y,x,y)));
}
function ddcExposure(x0,y0,path,skip){   // the 4 m stretches of a way open to a gun of theirs (noticed or not, leaving out skip), counted gun by gun; its length; where the worst gun sees it
  let n=0,L=0,px=x0,py=y0;const by=new Map();
  for(const q of path){const d=hyp(q.x-px,q.y-py),k=Math.max(1,Math.round(d/40));
    for(let i=1;i<=k;i++){const x=px+(q.x-px)*i/k,y=py+(q.y-py)*i/k;
      for(const e of enemies){if(e===skip||beaten(e)||e.side!=='E'||e.mon||e.dormant)continue;if(hyp(e.x-x,e.y-y)>ddFireR(e)||!los(e.x,e.y,x,y)||coverAt(x,y,e.x,e.y)>0)continue;
        n++;const b=by.get(e)||{n:0,x:0,y:0};b.n++;b.x+=x;b.y+=y;by.set(e,b);}}
    L+=d;px=q.x;py=q.y;}
  let w=null;for(const b of by.values())if(!w||b.n>w.n)w=b;
  return{open:n,len:L,smokeAt:w?{x:w.x/w.n,y:w.y/w.n}:null};
}
function ddcPincerPlan(t,free,lead,T){   // {to, spots, gun, smoke, goers} or null
  const P=DDC_PINCER,Am=ddcMid(lead),a0=Math.atan2(Am.y-T.y,Am.x-T.x),s=t==='B'?1:-1;
  const gun=free.find(u=>(u.weapon==='hmg'||u.ddRole==='gunner')&&hyp(u.x-T.x,u.y-T.y)<=wRange(u)&&fireLine(u,T))||null;   // (he stays and pins him down)
  const go=free.filter(u=>u!==gun&&u.hp>=P.hp);if(go.length<2)return null;   // (only men over half health go)
  const Gm=ddcMid(go),cand=[];
  for(const c of coverPts){const d=hyp(c.x-T.x,c.y-T.y);if(d<P.near||d>P.far)continue;
    let da=Math.atan2(c.y-T.y,c.x-T.x)-a0;while(da>Math.PI)da-=TAU;while(da<-Math.PI)da+=TAU;const ad=Math.abs(da);if(ad<P.arcLo||ad>P.arcHi)continue;
    const[bx,by]=ddcBound(c.x,c.y);if(hyp(bx-c.x,by-c.y)>1)continue;
    if(!ddcSpotOK(c.x,c.y,T))continue;
    cand.push({x:c.x,y:c.y,sd:da>0?1:-1,v:coverAt(c.x,c.y,T.x,T.y)*1.5+((da>0?1:-1)===s?.6:0)-hyp(c.x-Gm.x,c.y-Gm.y)/250});}
  if(cand.length<2)return null;
  cand.sort((a,b)=>b.v-a.v);
  for(const best of cand.slice(0,3)){
    const spots=[best];for(const c of cand){if(spots.length>=go.length)break;if(c!==best&&c.sd===best.sd&&hyp(c.x-best.x,c.y-best.y)<110&&spots.every(q=>hyp(q.x-c.x,q.y-c.y)>=15))spots.push(c);}
    if(spots.length<go.length){   // (places beside the best one, across his way: each with a clean shot at him and no other gun's open shot)
      const ux=T.x-best.x,uy=T.y-best.y,ul=hyp(ux,uy)||1,px=-uy/ul,py=ux/ul;
      for(const[a,b]of[[30,0],[-30,0],[60,0],[-60,0],[30,-25],[-30,-25],[0,-30]]){if(spots.length>=go.length)break;const x=best.x+px*a-ux/ul*-b,y=best.y+py*a-uy/ul*-b;
        if(isFree(x,y)&&ddcSpotOK(x,y,T)&&spots.every(q=>hyp(q.x-x,q.y-y)>=15))spots.push({x,y,sd:best.sd});}}
    if(spots.length<2)continue;
    const p=findPath(Gm.x,Gm.y,best.x,best.y);if(!p||!p.length)continue;
    const ex=ddcExposure(Gm.x,Gm.y,p,gun||(T.sup||0)>P.supp?T:null);if(ex.len>P.walk)continue;   // (he counts too unless our gunner stays on him or he's kept down)
    let smoke=null;
    if(ex.open>P.expose){if(ex.open>P.smoke||!ex.smokeAt)continue;const sm=go.find(u=>u.spec==='smoke'&&u.specN>0&&!u.throwGo);if(!sm)continue;smoke={u:sm,x:ex.smokeAt.x,y:ex.smokeAt.y};}
    return{to:best,spots,gun,smoke,go,exposure:ex.open};
  }
  return null;
}
function ddcPincerGo(t,S,T,plan,lead){   // the men to their spots, the gunner on him, the smoke if any; the banner
  const left=plan.go.filter(u=>!plan.smoke||u!==plan.smoke.u),ids=[],spare=[];
  for(const q of plan.spots){if(!left.length){spare.push(q);continue;}left.sort((a,b)=>hyp(a.x-q.x,a.y-q.y)-hyp(b.x-q.x,b.y-q.y));let sent=false;
    for(let i=0;i<left.length;i++){const p=findPath(left[i].x,left[i].y,q.x,q.y);if(p&&p.length){Object.assign(left[i],{path:p,gaitForce:null,exposeT:0,supT:null});ids.push(left[i].id);left.splice(i,1);sent=true;break;}}
    if(!sent)spare.push(q);}
  if(ids.length<1)return false;
  if(plan.gun)Object.assign(plan.gun,{supT:{x:T.x,y:T.y},noLine:0,path:[]});
  if(plan.smoke)orderThrow(plan.smoke.u,plan.smoke.x,plan.smoke.y,'smoke');
  for(const u of left)if(!u.path.length&&hyp(u.x-T.x,u.y-T.y)<=wRange(u)&&fireLine(u,T))Object.assign(u,{supT:{x:T.x,y:T.y},noLine:0});   // (anyone without a spot helps the gunner)
  Object.assign(S,{fl:{T,t:simT,to:{x:plan.to.x,y:plan.to.y},ids,gun:plan.gun&&plan.gun.id,spare,smoke:!!plan.smoke,there:0,D0:ddcMid(lead.map(destOf))},wait:null,stay:false,act:'flank',sentT:simT});
  banner(`${ddcName(t)} ${plan.smoke?'pops smoke and ':''}flanks ${T.gunner||T.onGun?'the machine gun':'him'}.`,2200);
  return true;
}
function ddcSupport(t){
  const m=players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);if(!m.length)return;
  const S=ddcS(t),lead=players.filter(p=>p.team!==t&&alive(p)&&!p.inBoat&&!p.joining);
  if(dd.supLast!==dd.active){dd.supLast=dd.active;Object.assign(S,{fl:null,wait:null,stay:true,D:lead.length?ddcMid(lead.map(destOf)):null});}   // (just swapped: the squad you've let go stays put until yours moves on)
  // their own wounded first
  for(const d of players.filter(p=>p.team===t&&p.downed&&!p.dead&&!p.carriedBy)){
    const fr=m.filter(u=>!u.path.length&&!u.medGo&&!pinnedNow(u)&&!u.onGun).sort((a,b)=>hyp(a.x-d.x,a.y-d.y)-hyp(b.x-d.x,b.y-d.y));if(!fr.length)break;
    if(d.critical){const k=fr.find(hasKit);if(k&&!m.some(u=>u.medGo&&u.medGo.t===d))orderMedkit(k,d);continue;}
    if(helperOf(d))continue;const h=fr[0];if(hyp(h.x-d.x,h.y-d.y)>22){const p=goBeside(h,d);if(p&&p.length){h.path=p;h.gaitForce=null;}}
  }
  if(typeof fpTools==='function')fpTools(m,m[0]);   // its kit: a rocket at a tank, a grenade where they're bunched or dug in, smoke when pinned (ddfp.js)
  const mode=ddcMode(t),free=m.filter(u=>!ddcBusy(u)&&!pinnedNow(u));
  const F=lead.map(u=>u.focus).find(e=>e&&!beaten(e));   // the man yours is shooting is theirs too, for those who can see him
  if(F)for(const u of free)if(u.focus!==F&&hyp(u.x-F.x,u.y-F.y)<=wRange(u)&&fireLine(u,F))u.focus=F;
  S.act=mode;
  if(mode==='hold'){S.fl=null;S.wait=null;ddcPin(free,F||enemies.filter(e=>e.gunner&&!beaten(e)&&(e.seen||e.vis)).sort((a,b)=>hyp(a.x-m[0].x,a.y-m[0].y)-hyp(b.x-m[0].x,b.y-m[0].y))[0]);return;}
  if(!lead.length||!free.length)return;
  const Am=ddcMid(lead),dug=!!F&&(F.seen||F.vis)&&coverAt(F.x,F.y,Am.x,Am.y)>0;
  // the man yours is shooting, dug in: a grenade at him, and the pincer if it's safe
  if(dug&&simT-(S.nadeT??-99)>8){const g=free.find(u=>(u.grenade||0)>0&&!u.path.length&&simT-(u.nadeT??-99)>5&&hyp(u.x-F.x,u.y-F.y)<nadeRange(u)&&!dd.allies.some(q=>hyp(q.x-F.x,q.y-F.y)<75));if(g&&orderThrow(g,F.x,F.y,'nade'))S.nadeT=simT;}
  // the pincer under way: called off if one of them goes down; over once he's down, yours has let him be, or it's taken too long
  if(S.fl){const g=S.fl,T=g.T,goers=g.ids.map(id=>players.find(p=>p.id===id)).filter(Boolean);
    const hold=()=>{const D=ddcMid(lead.map(destOf));Object.assign(S,{fl:null,t:-99,stay:!(g.D0&&hyp(D.x-g.D0.x,D.y-g.D0.y)>100),D});};   // (in cover where they are until yours moves on, no walk back across the ground they flanked over; unless yours already has)
    if(goers.some(u=>u.downed||u.dead)){hold();S.failT={T,t:simT};banner(`${ddcName(t)} takes a hit and goes to ground.`,1800);}
    else if(beaten(T))hold();
    else if(simT-g.t>DDC_PINCER.max||(!lead.some(u=>u.focus===T)&&!lead.some(u=>shootersOf(u).includes(T)))){S.fl=null;S.t=-99;S.stay=false;}
    else{S.act='flank';
      if(!g.there&&(goers.filter(u=>!u.path.length).length>=Math.max(1,goers.length-1)||simT-g.t>12))g.there=simT;   // (in place: all but one there, or long enough)
      if(g.there){for(const u of m)if(!u.path.length&&hyp(u.x-T.x,u.y-T.y)<=wRange(u)&&fireLine(u,T)){u.focus=T;u.supT=null;}}   // (in place: everyone on him)
      else{const gu=g.gun&&players.find(p=>p.id===g.gun);if(gu&&alive(gu)&&!gu.path.length&&(!gu.supT||hyp(gu.supT.x-T.x,gu.supT.y-T.y)>40))Object.assign(gu,{supT:{x:T.x,y:T.y},noLine:0});}
      for(const u of free)if(!g.ids.includes(u.id)&&u.id!==g.gun&&!u.path.length&&!u.throwGo&&g.spare.length){const q=g.spare.shift(),p=findPath(u.x,u.y,q.x,q.y);if(p&&p.length){u.path=p;g.ids.push(u.id);}}   // (the man who threw the smoke goes once it's out)
      return;}}
  // a new pincer: the man yours is shooting dug in, or a machine gun dug in and shooting at yours
  const T=(dug?F:null)||lead.flatMap(u=>shootersOf(u)).filter(e=>(e.gunner||e.onGun)&&(e.seen||e.vis)&&coverAt(e.x,e.y,Am.x,Am.y)>0).sort((a,b)=>hyp(a.x-Am.x,a.y-Am.y)-hyp(b.x-Am.x,b.y-Am.y))[0]||null;
  if(T&&simT-(S.flT??-99)>DDC_PINCER.every&&!players.some(p=>p.team===t&&p.downed&&!p.dead)&&!(S.failT&&S.failT.T===T&&simT-S.failT.t<DDC_PINCER.again)){S.flT=simT;
    const M=ddcMid(free);if(hyp(M.x-T.x,M.y-T.y)<DDC_PINCER.reach){const plan=ddcPincerPlan(t,free,lead,T);if(plan&&ddcPincerGo(t,S,T,plan,lead))return;}}
  // side by side; covering yours first while it's being shot at on its way
  const D=ddcMid(lead.map(destOf)),f=ddcFwd(D),rx=-f.y,ry=f.x,s=t==='B'?1:-1,want={x:D.x+rx*s*DDC_SIDE,y:D.y+ry*s*DDC_SIDE},B=ddcMid(free.map(destOf));
  const fresh=lead.some(u=>simT-(u.lastOrder??-99)<1.5)&&(!S.D||hyp(D.x-S.D.x,D.y-S.D.y)>30);
  if(fresh){S.D=D;S.stay=false;S.wait=lead.some(u=>u.path.length&&shootersOf(u).length)?{t:simT}:null;}
  if(S.wait){
    if(lead.some(u=>u.path.length&&simT-(u.lastOrder??-99)<8)&&simT-S.wait.t<6){S.act='cover';const sh=lead.flatMap(u=>shootersOf(u)).sort((a,b)=>hyp(a.x-Am.x,a.y-Am.y)-hyp(b.x-Am.x,b.y-Am.y));ddcPin(free,sh[0]||F);return;}
    S.wait=null;S.t=-99;}   // (yours is there, or long enough: up beside it now)
  else if(!fresh&&(S.stay||simT-(S.t??-99)<3||hyp(B.x-want.x,B.y-want.y)<DDC_CATCH||free.some(u=>u.path.length)))return;
  S.t=simT;S.sentT=simT;
  S.to=ddcSend(free,[[0,DDC_SIDE],[0,80],[-12,120],[12,70],[-20,135],[-30,100],[-45,70],[25,110],[0,-DDC_SIDE],[0,-80],[-30,-100]].map(([fw,of])=>[D.x+f.x*fw+rx*s*of,D.y+f.y*fw+ry*s*of]))||S.to;
}
// everyone you play down and the other squad has men up: you play that one now
function ddcLeadCheck(){
  if(!ddcLead())return;const a=dd.active,o=ddcOther();
  if(players.some(p=>p.team===a&&alive(p))||!players.some(p=>p.team===o&&alive(p)&&!p.inBoat))return;
  selectTeam(o);banner(`${ddcName(a)} is down. You play ${ddcName(o)} now.`,2600);
}
// Version 180: the team tabs as they were before Version 168 (Bryan: "I like how I originally selected the squads"); the other squad's tab
// carries a small FOLLOW / HOLD switch (.ddchip): a tap on it switches, a tap on the rest of the tab plays that squad (hud.js's tabSelect)
function ddcToggle(o){
  if(!ddcLead()||ddBusy())return;const md=ddcMode(o)==='hold'?'follow':'hold';dd.sup[o]=md;Object.assign(ddcS(o),{fl:null,wait:null,stay:false,D:null,t:-99});
  if(md==='hold'){   // they settle into cover where they are
    const m=players.filter(p=>p.team===o&&alive(p)&&!p.inBoat&&!ddcBusy(p));
    if(m.length){const c=ddcMid(m),as=makeAssign(m,c.x,c.y);for(const q of as)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0});}}
  banner(md==='hold'?`${ddcName(o)} holds here.`:`${ddcName(o)} follows you.`,1600);ddcHud();hud();
}
function ddcChip(tab,t){
  let c=tab.querySelector('.ddchip');if(c)return c;
  c=document.createElement('span');c.className='ddchip';c.setAttribute('role','button');c.tabIndex=0;tab.appendChild(c);
  const go=ev=>{ev.stopPropagation();ev.preventDefault();ddcToggle(t);};   // (not the tab's own tap: that plays the squad)
  c.addEventListener('click',go);c.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' ')go(ev);});
  return c;
}
function ddcHud(){
  const on=ddcLead();
  for(const tab of document.querySelectorAll('.tab[data-team]')){const t=tab.dataset.team;if(t!=='A'&&t!=='B')continue;
    let c=tab.querySelector('.ddchip');
    if(!on||t===dd.active){if(c&&!c.hidden)c.hidden=true;continue;}
    c=ddcChip(tab,t);if(c.hidden)c.hidden=false;
    const md=ddcMode(t),txt=md==='hold'?'HOLD':'FOLLOW';
    if(c.textContent!==txt){c.textContent=txt;c.classList.toggle('hold',md==='hold');c.setAttribute('aria-label',`${ddcName(t)}: ${md==='hold'?'holding, tap to follow':'following, tap to hold'}`);}
  }
}
// over the other squad: who they are and what they're doing
// Version 181: the squads working together, on the screen (ddcFrame, each frame): the pincer's arrow while they go, its man ringed and marked
// FLANKED (PINCER in Version 181; Bryan: "flank everywhere because I didn't know what pincer meant"), lines from both squads to him once they're in place; while it covers yours, thin lines from its men to the man they pin down; for a
// moment after it's sent beside yours, faint rings where its men are going (the other squad's routes aren't drawn otherwise)
function ddcCoopDraw(){
  if(!ddcLead())return;const o=ddcOther(),S=dd.supS&&dd.supS[o];if(!S)return;const col=ddcCol(o),mine=ddcCol(dd.active);
  const P=(x,y,h)=>{toSBack=false;const p=toS(x,y,h||0);return toSBack?null:p;},pulse=.5+.5*Math.sin(performance.now()/160);
  ox.save();ox.lineCap='round';ox.lineJoin='round';
  if(S.fl&&S.fl.T&&!beaten(S.fl.T)){const g=S.fl,T=g.T,goers=g.ids.map(id=>players.find(p=>p.id===id)).filter(u=>u&&alive(u));
    if(!g.there&&goers.length){   // the arrow: a bend from where they are to the spot, its head toward him
      const a=ddcMid(goers),b=g.to,mx=(a.x+b.x)/2,my=(a.y+b.y)/2,dx=b.x-a.x,dy=b.y-a.y,L=hyp(dx,dy)||1,side=((T.x-a.x)*dy-(T.y-a.y)*dx)>0?-1:1,cx=mx-dy/L*L*.22*side,cy=my+dx/L*L*.22*side,pts=[];
      for(let i=0;i<=16;i++){const k=i/16,x=(1-k)*(1-k)*a.x+2*(1-k)*k*cx+k*k*b.x,y=(1-k)*(1-k)*a.y+2*(1-k)*k*cy+k*k*b.y,q=P(x,y,2);if(q)pts.push(q);}
      if(pts.length>2){for(const[w,c]of[[7,'rgba(8,11,14,.55)'],[3.5,col]]){ox.lineWidth=w;ox.strokeStyle=c;ox.setLineDash(w>5?[]:[10,7]);ox.beginPath();pts.forEach((q,i)=>i?ox.lineTo(q[0],q[1]):ox.moveTo(q[0],q[1]));ox.stroke();}
        ox.setLineDash([]);const e=pts[pts.length-1],f=pts[pts.length-3],an=Math.atan2(e[1]-f[1],e[0]-f[0]);ox.fillStyle=col;ox.strokeStyle='rgba(8,11,14,.6)';ox.lineWidth=2;ox.beginPath();
        ox.moveTo(e[0]+Math.cos(an)*9,e[1]+Math.sin(an)*9);ox.lineTo(e[0]+Math.cos(an+2.4)*11,e[1]+Math.sin(an+2.4)*11);ox.lineTo(e[0]+Math.cos(an-2.4)*11,e[1]+Math.sin(an-2.4)*11);ox.closePath();ox.stroke();ox.fill();}}
    const q=P(T.x,T.y,10),qh=P(T.x,T.y,24);if(q){ox.lineWidth=2.5;ox.strokeStyle=col;ox.globalAlpha=.55+.45*pulse;ox.beginPath();ox.arc(q[0],q[1],13+3*pulse,0,TAU);ox.stroke();ox.globalAlpha=1;if(qh)ddcPill('FLANKED',qh[0],qh[1]-32,col);}   // (the tag above his health bar and PINNED: overlay.js puts them 6 and 14 px over his head)
    if(g.there&&q){const A=players.filter(p=>p.team===dd.active&&alive(p)),B=goers;   // both squads on him
      for(const[L,c]of[[A,mine],[B,col]]){if(!L.length)continue;const m=ddcMid(L),r=P(m.x,m.y,14);if(!r)continue;ox.lineWidth=2;ox.strokeStyle=c;ox.globalAlpha=.75;ox.setLineDash([6,5]);ox.beginPath();ox.moveTo(r[0],r[1]);ox.lineTo(q[0],q[1]);ox.stroke();}
      ox.setLineDash([]);ox.globalAlpha=1;}}
  if(S.act==='cover'){ox.lineWidth=1.6;ox.strokeStyle=col;ox.globalAlpha=.7;ox.setLineDash([5,5]);   // pinning down whoever shoots at yours
    for(const u of players.filter(p=>p.team===o&&alive(p)&&p.supT)){const a=P(u.x,u.y,14),b=P(u.supT.x,u.supT.y,10);if(a&&b){ox.beginPath();ox.moveTo(a[0],a[1]);ox.lineTo(b[0],b[1]);ox.stroke();}}
    ox.setLineDash([]);ox.globalAlpha=1;}
  if(S.sentT!=null&&simT-S.sentT<2.5){const k=1-(simT-S.sentT)/2.5;ox.lineWidth=2;ox.strokeStyle=col;ox.globalAlpha=.6*k;   // where they're going
    for(const u of players.filter(p=>p.team===o&&alive(p)&&p.path.length)){const e=u.path[u.path.length-1],r=P(e.x,e.y,1);if(r){ox.beginPath();ox.arc(r[0],r[1],9,0,TAU);ox.stroke();}}
    ox.globalAlpha=1;}
  ox.restore();
}
function ddcLabel(){
  if(!ddcLead())return;const o=ddcOther(),m=players.filter(p=>p.team===o&&alive(p)&&!p.inBoat);if(!m.length)return;
  const c=ddcMid(m);toSBack=false;const[x,y]=toS(c.x,c.y,34);if(toSBack)return;const B=ddBox();
  if(x<B.l||x>B.r||y<B.top||y>B.bot)return;
  const a=(dd.supS&&dd.supS[o]&&dd.supS[o].act)||ddcMode(o);
  pill(`${ddcName(o).toUpperCase()} · ${a==='hold'?'HOLDING':a==='cover'?'COVERING':a==='flank'?'FLANKING':'FOLLOWING'}`,clamp(x,70,cw-70),y,ddcCol(o));
}

/* ---------- Draft 2: the target first ---------- */
const DDC_SUP_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 12h4M17 12h4M12 3v4M12 17v4"/><circle cx="12" cy="12" r="6"/><path d="M8.5 15.5l7-7"/></svg>';
const DDC_MOVE_SVG='<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 20V5M6 11l6-6 6 6"/></svg>';
function ddcPt(R){return R.kind==='enemy'?{x:R.e.x,y:R.e.y,h:14+(R.e.elev||0)}:R.kind==='tank'?{x:R.K.x,y:R.K.y,h:22}:{x:R.o.x+R.o.w/2,y:R.o.y+R.o.h/2,h:4};}
function ddcEnemyAt(sx,sy){
  if(unitAtScreen(sx,sy,false))return null;   // (one of ours under the finger: that's him)
  let best=null,bd=36;
  for(const e of enemies){if(e.dead||e.surr||!e.vis||beaten(e))continue;toSBack=false;const[x,y]=toS(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));if(toSBack)continue;const d=hyp(x-sx,y-sy);if(e.onTank&&d>(typeof DD_TANKMG!=='undefined'?DD_TANKMG.tap:16))continue;if(d<bd){bd=d;best=e;}}   // (the man on a tank: only a tap right on him, else the tap is for the tank)
  return best;
}
// a tap on the map (ddplay.js's ddTap asks first): true if it was for a ring, null to go on as usual
function ddcTap(wx,wy,sx,sy){
  if(!ddcRing()||sx==null)return null;
  const had=!!ddcR;
  const en=ddcEnemyAt(sx,sy);
  if(en&&sel.length){ddcClose();const r=orderFire(sel,en);preview=null;dd.fireAt=performance.now();   // (as input.js's tap on a hostile, then the ring)
    if(r&&(r.fire.length||r.move.length)){callout(en,'Focus fire',C.warn);say(sel[0],'ack_attack');}
    ddcOpen({kind:'enemy',e:en});hud();return true;}
  const K=ddTanksUp().find(q=>{toSBack=false;const[tx,ty]=toS(q.x,q.y,16);return!toSBack&&hyp(tx-sx,ty-sy)<46;});
  if(K&&sel.length){ddcClose();preview=null;ddcOpen({kind:'tank',K});return true;}
  const o=(dd.wires||[]).find(q=>!q.gone&&rectDist(wx,wy,q)<7);
  if(o&&sel.length){ddcClose();preview=null;ddcOpen({kind:'wire',o});return true;}
  if(had){ddcClose();return true;}   // a tap anywhere else puts the ring away, and does nothing more
  return null;
}
// what can be done to it, by whom, from how far (worked out again every 0.3 s while it's up)
function ddcItems(R){
  const P=ddcPt(R),m=ddSquad().filter(alive),d=u=>hyp(u.x-P.x,u.y-P.y),D=u=>`${Math.round(d(u)/10)} m`,by=(a,b)=>d(a)-d(b);
  const ready=u=>!u.throwGo&&!u.rpgAim&&!u.medGo&&!u.carry&&!u.fp,items=[];
  if(R.kind==='enemy'){const L=m.filter(u=>d(u)<=wRange(u)&&!!fireLine(u,R.e));
    items.push({k:'sup',col:'#ffcf4a',svg:DDC_SUP_SVG,cls:'sup',label:'SUPPRESS',sub:L.length?`${L.length===m.length?'all '+L.length:L.length+' of '+m.length} · pins him`:'no line to him',off:!L.length,why:'No line to him'});}
  const nade=gl=>{const L=m.filter(u=>!!u.gl===gl&&(u.grenade||0)>0);if(!L.length)return null;
    const u=L.filter(q=>ready(q)&&!pinnedNow(q)).sort(by)[0]||L.filter(ready).sort(by)[0]||L.slice().sort(by)[0],r=nadeRange(u),far=d(u)>r+NADE_WALK,busy=!ready(u);
    const s=far||busy?null:ddcSpot(R,u,'nade',P,r,0),none=!far&&!busy&&!s,pin=!!s&&!s.here&&pinnedNow(u);   // (pinned, he only throws from where he stands)
    return{k:gl?'rgl':'nade',u,col:gl?'#d7e59a':'#e8ecef',svg:gl?M203_SVG:NADE_SVG,label:gl?'RIFLE GRENADE':'GRENADE',sub:far?`too far · ${D(u)}`:busy?`${u.name} · busy`:none?'no spot to throw from':pin?`${u.name} · pinned`:`${u.name} · ${D(u)}${s.here?'':' · moves up'}`,off:far||busy||none||pin,why:far?'Too far':busy?'Busy':none?'No spot to throw from':'Pinned'};};
  const bz=()=>{const L=m.filter(u=>u.spec==='rpg'&&u.specN>0);if(!L.length)return null;
    const u=L.filter(q=>ready(q)&&!pinnedNow(q)).sort(by)[0]||L.filter(ready).sort(by)[0]||L.slice().sort(by)[0],far=d(u)>PRPG.range+ACT_R,busy=!ready(u);
    const s=far||busy?null:ddcSpot(R,u,'rpg',P,PRPG.range,PRPG.min),none=!far&&!busy&&!s,pin=!!s&&!s.here&&pinnedNow(u);   // (too close, he backs off first: combat.js's fireSpot)
    return{k:'rpg',u,col:'#ffb36b',svg:SPECIALS.rpg.svg,label:'BAZOOKA',sub:far?`too far · ${D(u)}`:busy?`${u.name} · busy`:none?'no spot to fire from':pin?`${u.name} · pinned`:`${u.name} · ${D(u)}${s.here?'':d(u)<PRPG.min?' · backs off':' · moves up'}`,off:far||busy||none||pin,why:far?'Too far':busy?'Busy':none?'No spot to fire from':'Pinned'};};
  const g=nade(false),rg=nade(true),b=bz();
  if(R.kind==='tank'){if(b)items.push(b);if(g)items.push(g);if(rg)items.push(rg);}
  else{if(g)items.push(g);if(rg)items.push(rg);if(b)items.push(b);}
  if(R.kind==='wire')items.push({k:'move',col:'#8fd0ff',svg:DDC_MOVE_SVG,cls:'mv',label:'MOVE HERE',sub:'up to the wire'});
  if(!items.length)items.push({k:'none',col:'#9aa3a9',svg:DDC_SUP_SVG,cls:'sup',label:'NOTHING TO USE',sub:'no explosives left',off:true,why:'Nothing left to use on it'});
  return items.slice(0,4);
}
// where he'd throw or fire from (combat.js's fireSpot, as orderThrow will ask): {here}, a spot to walk to, or null; kept 2.5 s while neither he nor
// the target moves (it looks for paths)
function ddcSpot(R,u,kind,P,range,minD){
  const C=R.can||(R.can={}),k=u.id+kind,c=C[k],now=performance.now();
  if(c&&now-c.t<2500&&hyp(u.x-c.x,u.y-c.y)<40&&hyp(P.x-c.px,P.y-c.py)<30)return c.s;
  let s=null;try{s=fireSpot(u,P.x,P.y,range,minD,kind);}catch(e){s={here:true};}
  C[k]={s,t:now,x:u.x,y:u.y,px:P.x,py:P.y};return s;
}
function ddcRingEl(){
  let box=$('#ddRing');if(box)return box;const st=$('#stage');if(!st)return null;
  box=document.createElement('div');box.id='ddRing';box.hidden=true;st.appendChild(box);
  box.addEventListener('click',ev=>{const b=ev.target.closest('.ddc-act');if(!b||!ddcR)return;ev.stopPropagation();const it=ddcR.items.find(i=>i.k===b.dataset.k);if(!it)return;
    if(it.off){const P=ddcPt(ddcR);dd.tapW={x:P.x,y:P.y,t:performance.now()};if(it.why)ddNote(it.why);return;}
    ddcAct(ddcR,it);});
  return box;
}
function ddcOpen(R){R.t0=performance.now();R.items=ddcItems(R);R.it=R.t0;R.key='';ddcR=R;ddcRingFrame();}
function ddcClose(){ddcR=null;const box=$('#ddRing');if(box&&!box.hidden){box.hidden=true;box.innerHTML='';}}
function ddcAct(R,it){
  const P=ddcPt(R);
  if(it.k==='sup'){orderSuppress(sel.length?sel:ddSquad(),{x:R.e.x,y:R.e.y});}
  else if(it.k==='move'){   // up to the wire, on the near side of it
    const m=(sel.length?sel:ddSquad()).filter(alive);if(m.length){const c=ddcMid(m),o=R.o,as=makeAssign(m,clamp(c.x,o.x+10,o.x+o.w-10),c.y>o.y+o.h/2?o.y+o.h+16:o.y-16);if(as.length)commit(as);else banner('Can’t get there.',1400);}}
  else if(it.u){const u=it.u;if(orderThrow(u,P.x,P.y,it.k==='rpg'?'rpg':'nade')){u.lastOrder=simT;u.hotT=simT+6;if(R.kind==='tank'){dd.tankAim=simT+7;dd.tankAimK=R.K;}}}
  ddcClose();hud();
}
// each frame (from the overlay): the ring kept on its target, round it above (below near the top of the screen), and gone with it
function ddcRingFrame(){
  const R=ddcR,box=ddcRingEl();if(!box)return;
  if(!R)return;if(!ddcRing()){ddcClose();return;}
  const now=performance.now();
  if(now-R.t0>4500||R.kind==='enemy'&&(R.e.dead||beaten(R.e)||!R.e.vis)||R.kind==='tank'&&R.K.hp<=0||R.kind==='wire'&&R.o.gone){ddcClose();return;}
  const P=ddcPt(R);toSBack=false;const[sx,sy]=toS(P.x,P.y,P.h);if(toSBack){ddcClose();return;}
  if(now-R.it>300){R.it=now;R.items=ddcItems(R);}
  const key=R.items.map(i=>i.k+(i.off?0:1)+i.sub).join('|');
  if(key!==R.key){R.key=key;box.innerHTML=R.items.map(i=>`<button type="button" class="ddc-act${i.off?' off':''}${i.cls?' '+i.cls:''}" data-k="${i.k}" style="--c:${i.col}" aria-label="${i.label}: ${i.sub}">${i.svg}<span>${i.label}<i>${i.sub}</i></span></button>`).join('');}
  // round it in an arc above (or below, near the top of the screen); with no room for either (a phone on its side), in a row over or under it
  const n=R.items.length,B=ddBox(),bs=box.children,put=(i,x,y)=>{if(bs[i]){bs[i].style.left=x.toFixed(1)+'px';bs[i].style.top=y.toFixed(1)+'px';}};
  let arc=null;for(const r of n>2?[100,84]:[88,76]){const st=n>2?(r>90?1.12:1.3):(r>80?1.1:1.25);if(sy-r-40>B.top){arc={r,st,up:true};break;}if(sy+r+40<B.bot){arc={r,st,up:false};break;}}
  if(arc){const{r,st}=arc,cx=clamp(sx,r+50,cw-r-50),a0=(arc.up?-Math.PI/2:Math.PI/2)-(n-1)*.5*st;for(let i=0;i<n;i++){const a=a0+i*st;put(i,cx+Math.cos(a)*r,sy+Math.sin(a)*r);}}
  else{const gap=94,half=(n-1)*gap/2+47,cx=clamp(sx,half+8,cw-half-8),above=sy-B.top>B.bot-sy,y=above?Math.max(B.top+40,sy-66):Math.min(B.bot-40,sy+66);for(let i=0;i<n;i++)put(i,cx-(n-1)*gap/2+i*gap,y);}
  if(box.hidden)box.hidden=false;
}
// thin lines from your men to the man they're shooting, an eye over any who can't see him (his ring up, or 4 s after the order)
function ddcLines(){
  const now=performance.now(),F=ddcR&&ddcR.kind==='enemy'?ddcR.e:now-(dd.fireAt||-1e9)<4000?ddSquad().map(u=>u.focus).find(e=>e&&!beaten(e)):null;if(!F||F.dead)return;
  toSBack=false;const[ex,ey]=toS(F.x,F.y,14);if(toSBack)return;
  for(const u of ddSquad()){if(!alive(u)||u.inBoat)continue;
    const c=u._fl&&u._fl.e===F&&now-u._fl.t<250?u._fl:(u._fl={e:F,t:now,ok:hyp(u.x-F.x,u.y-F.y)<=wRange(u)&&!!fireLine(u,F)});
    toSBack=false;const[ux,uy]=toS(u.x,u.y,14);if(toSBack)continue;
    if(c.ok){ox.save();ox.strokeStyle=teamCol(u);ox.globalAlpha=.7;ox.lineWidth=1.6;ox.beginPath();ox.moveTo(ux,uy);ox.lineTo(ex,ey);ox.stroke();ox.restore();}
    else{const[hx,hy]=toS(u.x,u.y,30);const x=hx-22,y=hy-26;ox.save();ox.beginPath();ox.arc(x,y,10,0,TAU);ox.fillStyle='rgba(8,11,14,.9)';ox.fill();ox.strokeStyle='#ff9a7a';ox.lineWidth=1.5;ox.stroke();
      ox.beginPath();ox.ellipse(x,y,6,3.6,0,0,TAU);ox.strokeStyle='#ffd2c4';ox.stroke();ox.beginPath();ox.moveTo(x-6,y+5);ox.lineTo(x+6,y-5);ox.strokeStyle='#ff5a48';ox.lineWidth=2;ox.stroke();ox.restore();}}
}
/* ---------- a tool in hand (Version 173, Bryan: "No finger dragging. I am clicking. I don't want the finger drag I want to click rpg and click where I
   shoot it"): a tool from the bar is tapped into hand and the map tapped where to use it (ddplay.js's ddToolUse, input.js's aiming modes), as before
   Version 168; while it's in hand the ground the man holding it can reach is filled orange (ddcReach, from ddcFrame). Versions 168 to 172 dragged it
   onto the map instead. ---------- */
const DDC_KIND={nade:'nade',rgl:'nade',smoke:'smoke',rpg:'rpg',medkit:'medkit'};
// who of the squad you play could use tool T: up, has one, not on another throw, a kit or a build, pinned or not (Version 172: on the beach under fire
// nearly everyone is pinned, and a pinned man still throws from where he stands, as combat.js's orderThrow lets him)
function ddcCarriers(T){return ddSquad().filter(u=>alive(u)&&T.n(u)>0&&u.card&&!u.throwGo&&!u.rpgAim&&!u.build&&!u.medGo);}
const ddcWalk=(u,kind)=>pinnedNow(u)?0:kind==='rpg'?ACT_R:NADE_WALK;   // (pinned, he won't leave his spot for it; a frag, a rifle grenade and, since Version 174, smoke walk up to 36 m, combat.js's fireSpot)
// a circle on the ground, cut where it runs behind the camera (gPath draws nothing once any of it is; the Bazooka reaches 90 m): ddhud.js's ddDepth
function ddcRingPath(x,y,r,add){   // (add: onto the path already begun)
  const n=48,lim=Math.max(2,camera.near*3),P=[],D=[],C=[];
  for(let i=0;i<n;i++){const a=i/n*TAU,px=x+Math.cos(a)*r,py=y+Math.sin(a)*r;P.push([px,py]);D.push(ddDepth(px,py));}
  for(let i=0;i<n;i++){const j=(i+1)%n,ia=D[i]>=lim,ib=D[j]>=lim;if(ia)C.push(P[i]);if(ia!==ib){const t=(lim-D[i])/(D[j]-D[i]);C.push([P[i][0]+(P[j][0]-P[i][0])*t,P[i][1]+(P[j][1]-P[i][1])*t]);}}
  if(!add)ox.beginPath();let k=0;for(const c of C){toSBack=false;const q=toS(c[0],c[1],1);if(toSBack)continue;if(k++)ox.lineTo(q[0],q[1]);else ox.moveTo(q[0],q[1]);}
  if(k>2)ox.closePath();return k>2;
}
// a circle's edge on the ground (the stretch behind the camera left out, so a cut circle has no line along the cut), stroked in the current style;
// given several, only their outside edge
function ddcUnionEdge(U){
  const lim=Math.max(2,camera.near*3);ox.beginPath();
  for(let i=0;i<U.length;i++){const a=U[i];let pen=false;
    for(let s=0;s<=64;s++){const t=s/64*TAU,x=a.x+Math.cos(t)*a.r,y=a.y+Math.sin(t)*a.r;
      if(U.some((b,j)=>j!==i&&hyp(x-b.x,y-b.y)<b.r-1)||ddDepth(x,y)<lim){pen=false;continue;}
      toSBack=false;const q=toS(x,y,1);if(toSBack){pen=false;continue;}
      if(pen)ox.lineTo(q[0],q[1]);else{ox.moveTo(q[0],q[1]);pen=true;}}}
  ox.stroke();
}
// how far the squad you play can use the tool in hand (Version 170, Bryan: "There should be a circle around the players to show the distance the tool can be used";
// Version 171: "filled in with orange. Lighter than the placement, but dark enough to see"): where any man who has one reaches from where he stands, filled
// orange as one shape; how far once he's moved up for it, dashed (not a pinned man: he throws from where he stands); a rocket's too close, a small red ring;
// one label with the names and distances, by the man nearest the middle of the screen, or an arrow at the screen's edge toward him when he's off it
// (Version 174: whoever of them can, throws, ddcThrower). The medic kit: the hurt and the downed ringed green
function ddcReach(k,u,now){
  const T=DD_TOOLS.find(t=>t.k===k);if(!T)return;
  if(k==='medkit'){const a=(.55+.35*Math.sin(now/170)).toFixed(2);for(const t of players)if(!t.dead&&!t.npc&&!t.inBoat&&(t.downed||t.hp<100)){gPath(t.x,t.y,18);ox.strokeStyle=`rgba(95,224,142,${a})`;ox.lineWidth=2.5;ox.stroke();}return;}
  const kind=DDC_KIND[k],L=ddcCarriers(T);if(u&&alive(u)&&T.n(u)>0&&!L.includes(u))L.push(u);if(!L.length)return;
  const U=L.map(q=>({x:q.x,y:q.y,r:throwReach(q,kind).R})),Wk=L.filter(q=>ddcWalk(q,kind)>0).map(q=>({x:q.x,y:q.y,r:throwReach(q,kind).R+ddcWalk(q,kind)}));
  ox.beginPath();let any=false;for(const c of U)if(ddcRingPath(c.x,c.y,c.r,true))any=true;
  if(any){ox.fillStyle='rgba(255,140,30,.2)';ox.fill('nonzero');}
  ox.strokeStyle='rgba(255,150,40,.95)';ox.lineWidth=2.6;ddcUnionEdge(U);
  if(Wk.length){ox.save();ox.setLineDash([6,7]);ox.strokeStyle='rgba(255,160,60,.6)';ox.lineWidth=1.6;ddcUnionEdge(Wk);ox.restore();}
  for(const q of L){const{minD}=throwReach(q,kind);if(minD>0){ox.strokeStyle='rgba(255,90,72,.8)';ox.lineWidth=1.5;ddcUnionEdge([{x:q.x,y:q.y,r:minD}]);}}
  // the label, by the man nearest the middle of the screen: at his ring's far edge, else over his head, else an arrow at the edge toward him
  const B=ddBox(),mid=toW((B.l+B.r)/2,(B.top+B.bot)/2),C=L.slice().sort((a,b)=>hyp(a.x-mid[0],a.y-mid[1])-hyp(b.x-mid[0],b.y-mid[1]))[0];
  const{R}=throwReach(C,kind),walk=Wk.length?Math.max(...L.map(q=>ddcWalk(q,kind))):0,nm=L.length>3?`${L.length} men`:L.map(q=>q.name).join(', ');
  const t=`${nm} · ${Math.round(R/10)} m${walk?` · ${Math.round((R+walk)/10)} m moving up`:' · pinned'}`,on=(x,y)=>x>=B.l&&x<=B.r&&y>=B.top+10&&y<=B.bot-10;
  toSBack=false;let[lx,ly]=toS(C.x,C.y-R,0);
  if(toSBack||!on(lx,ly)){toSBack=false;[lx,ly]=toS(C.x,C.y,40);if(toSBack||!on(lx,ly)){const w=ddWhere(C.x,C.y,10);if(!w.on)ddEdgeArrow(w.dx,w.dy,'#ffb347',C.name,12);return;}}
  ddcPill(t,lx,ly-10,'#ffb347');
}
// the tap with a tool in hand (input.js's aiming modes): it goes to whoever of the squad you play can use it there, the nearest who isn't pinned first
// (Version 174, Bryan, after Version 173: "I'm trying to throw smoke and it says too far": it had been handed to a man across the map). Nobody can:
// how far, at the finger and over the nearest of them, and it stays in hand (false). The man to use, or null to leave it to the one it was handed to
function ddcThrower(u,tx,ty,kind){
  if(!dd||!dd.toolK)return null;const T=DD_TOOLS.find(t=>t.k===dd.toolK);if(!T||!DDC_KIND[T.k]||T.k==='medkit')return null;
  const L=ddcCarriers(T);if(u&&alive(u)&&T.n(u)>0&&!L.includes(u))L.push(u);if(!L.length)return null;
  const fits=q=>{const{R,minD}=throwReach(q,kind),d=hyp(tx-q.x,ty-q.y),w=ddcWalk(q,kind);return d<=R+w&&(w>0||d>=minD);},by=(a,b)=>hyp(a.x-tx,a.y-ty)-hyp(b.x-tx,b.y-ty);
  const v=L.filter(q=>!pinnedNow(q)&&fits(q)).sort(by)[0]||L.filter(fits).sort(by)[0];
  if(v){dd.toolU=v;return v;}
  const n=L.slice().sort(by)[0],{R}=throwReach(n,kind),far=Math.round((R+ddcWalk(n,kind))/10);
  dd.tapW={x:tx,y:ty,t:performance.now()};ddNote(`Too far · ${Math.round(hyp(tx-n.x,ty-n.y)/10)} m (${far} m at most)`);bubble(n,'Too far',C.warn);return false;
}
// a pill kept inside the screen (overlay.js's pill is centred where it's put)
function ddcPill(text,x,y,col){ox.font=`700 10px ${HUDFONT}`;const w=ox.measureText(text).width+10;pill(text,clamp(x,w/2+6,cw-w/2-6),clamp(y,12,ch-12),col);}

/* ---------- each frame (from the overlay), the start card's switches, the first word ---------- */
function ddcFrame(now){
  ddcHud();
  if(!ddcOn()){if(ddcR)ddcClose();return;}
  ddcLabel();ddcCoopDraw();if(DDC.ring&&!dd.fp){ddcLines();ddcRingFrame();}
  if(dd.toolK&&DDC_KIND[dd.toolK]&&!dd.fp)ddcReach(dd.toolK,dd.toolU,performance.now());   // (a tool in hand: its reach; real milliseconds, now is the game's clock)
  if(!dd.ddcSaid){dd.ddcSaid=simT+3;}   // a word on the squads, a few seconds in
  else if(dd.ddcSaid>0&&simT>dd.ddcSaid){dd.ddcSaid=-1;banner(`${ddcName(ddcOther())} fights beside you. FOLLOW or HOLD on its tab.`,4200);}
}
function ddcBind(){
  const b=$('#ddCtlRing');
  if(b){b.checked=DDC.ring;b.addEventListener('change',()=>{DDC.ring=b.checked;ddcSave();});}
  // Version 221, Bryan: "in the setting, we should allow the user to toggle auto cover on and off when a grenade encircles the player's units": DDC.dodge, read by
  // ddplay.js's ddDodge for the squad you play (the squad that runs itself always dodges); on the start card and, in a battle, on a small panel while paused
  const d=$('#ddCtlDodge'),st=$('#stage');
  if(st&&!$('#ddSet')){const el=document.createElement('div');el.id='ddSet';el.hidden=true;el.innerHTML='<b>PAUSED</b><label><input type="checkbox" id="ddSetDodge"><span>Auto cover from grenades<small>Off: your men stay in the circle until you move them</small></span></label>';st.appendChild(el);}
  {const r=$('#ddCtlReal');if(r&&typeof ddReal==='function'){r.checked=ddReal();r.addEventListener('change',()=>ddrSet(r.checked));}}   // (Version 246, a draft: the new guns and vehicles, ddreal.js)
  const d2=$('#ddSetDodge'),set=v=>{DDC.dodge=v;ddcSave();if(d)d.checked=v;if(d2)d2.checked=v;};
  if(d){d.checked=DDC.dodge;d.addEventListener('change',()=>set(d.checked));}if(d2){d2.checked=DDC.dodge;d2.addEventListener('change',()=>set(d2.checked));}
}
function ddcPausePanel(){const el=$('#ddSet');if(!el)return;const on=MAPID==='dd'&&!!dd&&state==='play'&&paused&&!dd.seq&&!dd.fp;if(el.hidden===on)el.hidden=!on;}
