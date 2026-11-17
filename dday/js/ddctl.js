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
const DDC=(()=>{const o={lead:true,ring:true};try{const s=JSON.parse(localStorage.getItem('warehouseYard.ddctl.v1')||'null');if(s&&typeof s==='object'){if(typeof s.ring==='boolean')o.ring=s.ring;}}catch(e){}return o;})();   // (lead: since Version 180 always, the start card's switch gone; ring: Tap an enemy for actions)
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
     pincer when it's safe (FLANKING): round to a spot at his side where his cover doesn't help him, that no other gun of theirs has an open
     shot at (ddplay.js's ddOpenN leaving him out), by a way with no more than one 4 m stretch open to any of them (ddcWayOK), no more than
     38 m to walk, with none of its men down and most of them free; back beside yours once he's down, yours shoots someone else, or after 25 s.
   Tried first in tools/drafts/dday-follow-draft.js (variants line and safe). */
const DDC_SIDE=100,DDC_CATCH=70;
function ddcS(t){const S=dd.supS||(dd.supS={});return S[t]||(S[t]={});}
function ddcFwd(D){   // the way they're going, from where yours is going
  const w=typeof ddRouteWay==='function'?ddRouteWay(D.x,D.y):null;if(w)return w;
  const O=typeof ddObjective==='function'?ddObjective():null;if(O&&O.x!=null&&hyp(O.x-D.x,O.y-D.y)>40){const d=hyp(O.x-D.x,O.y-D.y);return{x:(O.x-D.x)/d,y:(O.y-D.y)/d};}
  const th=enemies.filter(e=>!beaten(e)&&(e.seen||e.vis)&&hyp(e.x-D.x,e.y-D.y)<600);if(th.length){const c=ddcMid(th),d=hyp(c.x-D.x,c.y-D.y)||1;return{x:(c.x-D.x)/d,y:(c.y-D.y)/d};}
  return{x:0,y:-1};
}
function ddcSend(free,cands){for(const[x,y]of cands){const[tx,ty]=ddcBound(x,y),as=makeAssign(free,tx,ty);if(as.length){for(const q of as)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0,supT:null});return{x:tx,y:ty};}}return null;}
function ddcPin(free,T){if(!T)return 0;let n=0;for(const u of free)if(!u.path.length&&hyp(u.x-T.x,u.y-T.y)<=wRange(u)&&fireLine(u,T)){if(!u.supT||hyp(u.supT.x-T.x,u.supT.y-T.y)>40)Object.assign(u,{supT:{x:T.x,y:T.y},noLine:0});n++;}return n;}
function ddcWayOK(x0,y0,path,skip){   // the way's length, or -1 if more than one 4 m stretch of it is open to a gun of theirs (leaving out skip)
  let bad=0,L=0,px=x0,py=y0;
  for(const q of path){const d=hyp(q.x-px,q.y-py),n=Math.max(1,Math.round(d/40));for(let k=1;k<=n;k++){const x=px+(q.x-px)*k/n,y=py+(q.y-py)*k/n;if(ddOpenN(x,y,skip)>0&&++bad>1)return -1;}L+=d;px=q.x;py=q.y;}
  return L;
}
// the squad's places at a pincer spot: a short line across his way, 4 m apart, each with a clean shot at him that his cover doesn't stop and out
// of every other gun's sight (the usual group move tucks men behind whatever hides them best, which here hid him from them too); a man to each
// place, nearest first, by a way the nav grid finds
function ddcFlankPlaces(free,x,y,F){
  const dx=F.x-x,dy=F.y-y,d=hyp(dx,dy)||1,px=-dy/d,py=dx/d,bx=-dx/d,by=-dy/d,P=[];
  for(const k of[0,1,-1,2,-2,3,-3]){if(P.length>=free.length)break;
    for(const back of[0,20,40]){const qx=x+px*k*40+bx*back,qy=y+py*k*40+by*back;
      if(isFree(qx,qy)&&los(qx,qy,F.x,F.y)&&coverAt(F.x,F.y,qx,qy)===0&&ddOpenN(qx,qy,F)===0&&!P.some(o=>hyp(o.x-qx,o.y-qy)<30)){P.push({x:qx,y:qy});break;}}}
  const left=free.slice(),as=[];
  for(const q of P){left.sort((a,b)=>hyp(a.x-q.x,a.y-q.y)-hyp(b.x-q.x,b.y-q.y));for(let i=0;i<left.length;i++){const p=findPath(left[i].x,left[i].y,q.x,q.y);if(p&&p.length){as.push({u:left[i],path:p});left.splice(i,1);break;}}}
  return as;
}
function ddcFlankSpot(t,free,lead,F){   // a safe spot round F's side and the squad's places there ({x,y,as}), or null
  const Am=ddcMid(lead),Bm=ddcMid(free),a0=Math.atan2(Am.y-F.y,Am.x-F.x),s=t==='B'?1:-1;let tries=0;
  for(const sd of[s,-s])for(const da of[1.1,.8,1.4,.6])for(const r of[220,170,280,130]){
    if(tries>=4)return null;
    const x=F.x+Math.cos(a0+sd*da)*r,y=F.y+Math.sin(a0+sd*da)*r,[bx,by]=ddcBound(x,y);
    if(hyp(bx-x,by-y)>1||!isFree(x,y)||!los(x,y,F.x,F.y)||coverAt(F.x,F.y,x,y)>0||ddOpenN(x,y,F)>0)continue;   // (from there his cover doesn't help him, and no other gun sees it)
    tries++;const p=findPath(Bm.x,Bm.y,x,y);if(!p||!p.length)continue;const L=ddcWayOK(Bm.x,Bm.y,p,F);if(L<0||L>380)continue;
    const as=ddcFlankPlaces(free,x,y,F);if(as.length<Math.min(3,free.length))continue;
    return{x,y,as};
  }
  return null;
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
  if(S.fl){const g=S.fl;if(!beaten(g.F)&&lead.some(u=>u.focus===g.F)&&simT-g.t<25){S.act='flank';return;}S.fl=null;S.t=-99;S.stay=false;}   // (done: back beside yours)
  if(dug&&!players.some(p=>p.team===t&&p.downed&&!p.dead)&&free.length>=Math.min(3,m.length)&&simT-(S.flT??-99)>2){S.flT=simT;
    const spot=ddcFlankSpot(t,free,lead,F);if(spot){for(const q of spot.as)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0,supT:null});Object.assign(S,{fl:{F,t:simT,to:{x:spot.x,y:spot.y}},wait:null,stay:false,act:'flank'});return;}}
  // side by side; covering yours first while it's being shot at on its way
  const D=ddcMid(lead.map(destOf)),f=ddcFwd(D),rx=-f.y,ry=f.x,s=t==='B'?1:-1,want={x:D.x+rx*s*DDC_SIDE,y:D.y+ry*s*DDC_SIDE},B=ddcMid(free.map(destOf));
  const fresh=lead.some(u=>simT-(u.lastOrder??-99)<1.5)&&(!S.D||hyp(D.x-S.D.x,D.y-S.D.y)>30);
  if(fresh){S.D=D;S.stay=false;S.wait=lead.some(u=>u.path.length&&shootersOf(u).length)?{t:simT}:null;}
  if(S.wait){
    if(lead.some(u=>u.path.length&&simT-(u.lastOrder??-99)<8)&&simT-S.wait.t<6){S.act='cover';const sh=lead.flatMap(u=>shootersOf(u)).sort((a,b)=>hyp(a.x-Am.x,a.y-Am.y)-hyp(b.x-Am.x,b.y-Am.y));ddcPin(free,sh[0]||F);return;}
    S.wait=null;S.t=-99;}   // (yours is there, or long enough: up beside it now)
  else if(!fresh&&(S.stay||simT-(S.t??-99)<3||hyp(B.x-want.x,B.y-want.y)<DDC_CATCH||free.some(u=>u.path.length)))return;
  S.t=simT;
  S.to=ddcSend(free,[[0,DDC_SIDE],[0,80],[-12,120],[12,70],[-20,135],[0,-DDC_SIDE],[0,-80]].map(([fw,of])=>[D.x+f.x*fw+rx*s*of,D.y+f.y*fw+ry*s*of]))||S.to;
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
  for(const e of enemies){if(e.dead||e.surr||!e.vis||beaten(e))continue;toSBack=false;const[x,y]=toS(e.x+(e.lx||0),e.y+(e.ly||0),8+(e.elev||0));if(toSBack)continue;const d=hyp(x-sx,y-sy);if(d<bd){bd=d;best=e;}}
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
  ddcLabel();if(DDC.ring&&!dd.fp){ddcLines();ddcRingFrame();}
  if(dd.toolK&&DDC_KIND[dd.toolK]&&!dd.fp)ddcReach(dd.toolK,dd.toolU,performance.now());   // (a tool in hand: its reach; real milliseconds, now is the game's clock)
  if(!dd.ddcSaid){dd.ddcSaid=simT+3;}   // a word on the squads, a few seconds in
  else if(dd.ddcSaid>0&&simT>dd.ddcSaid){dd.ddcSaid=-1;banner(`${ddcName(ddcOther())} fights beside you. FOLLOW or HOLD on its tab.`,4200);}
}
function ddcBind(){
  const b=$('#ddCtlRing');
  if(b){b.checked=DDC.ring;b.addEventListener('change',()=>{DDC.ring=b.checked;ddcSave();});}
}
