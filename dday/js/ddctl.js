"use strict";
/* Version 168: the two control drafts after Version 167, playable. Bryan, after 167: "It's still a bit chaotic and confusing. Switching the
   teams is a little difficult and chaotic. Throwing grenades and shooting is a little confusing"; on the drafts (docs/drafts/
   dday-controls-draft-1.png and -2.png): "Can you link both drafts so I can test it". Each can be switched off on the start card (DDC, kept in
   localStorage 'warehouseYard.ddctl.v1'), which brings the Version 167 controls back.

   Draft 1, lead one squad and the other backs you up (DDC.lead): the team tabs go (body.ddlead); a swap button and FOLLOW / HOLD for the
   other squad sit over the squad's bar, bottom right (#ddSwap, ddcHud). The other squad (ddcSupport, once a second, in place of ddplay.js's
   ddSquadAI on the beach and ddvillage.js's vgFollow in the village; in the counterattack too): its own wounded first, its kit as the
   village's follow used it (ddfp.js's fpTools), the man your squad is shooting as its target, and
   - FOLLOW: cover 10-15 m behind yours and a little to one side ("behind" as seen from where you're going: the objective, else the enemy you
     know of, else north), moved up when yours has moved on;
   - HOLD: it stays where it is (in cover near there), pinning down whatever yours is shooting, else the nearest machine gun it can see.
   Both start on FOLLOW, the counterattack too (Version 169, Bryan: "Follow by default"). Lose the squad you lead (everyone down) and you take over the other (ddcLeadCheck).
   Draft 2, the target first (DDC.ring): a tap on an enemy has your squad open fire as before and brings up a ring of what you can do to him
   (Suppress, Grenade, Rifle grenade, Bazooka, each saying who would do it and how far; greyed if nobody can), on a tank and on the wire the
   same (the wire's has MOVE HERE too); the game at quarter speed while it's up (state.js's timeScale asks ddcSlow), gone after 4.5 s or a tap
   anywhere else (ddcTap from ddplay.js's ddTap, ddcRingFrame from the overlay). The bar's grenade, rifle grenade, smoke, Bazooka and medic
   kit are dragged onto the map instead of held in hand: who, the arc and where it lands show while you drag, red if it can't be done; let go to
   throw, back over the bar to cancel (ddcDrag*). Nothing is held, so no dead taps after a throw. Thin lines from your men to the man they're
   shooting and an eye over any of them who can't see him, while his ring is up and for 4 s after the order (ddcLines). */
const DDC=(()=>{const o={lead:true,ring:true};try{const s=JSON.parse(localStorage.getItem('warehouseYard.ddctl.v1')||'null');if(s&&typeof s==='object'){if(typeof s.lead==='boolean')o.lead=s.lead;if(typeof s.ring==='boolean')o.ring=s.ring;}}catch(e){}return o;})();
function ddcSave(){try{localStorage.setItem('warehouseYard.ddctl.v1',JSON.stringify(DDC));}catch(e){}}
const ddcOn=()=>MAPID==='dd'&&!!dd&&state==='play'&&!!dd.land&&dd.land.done&&!dd.seq;
const ddcLead=()=>ddcOn()&&DDC.lead&&!dd.fp;
const ddcRing=()=>ddcOn()&&DDC.ring&&!dd.fp;
const ddcName=t=>t==='A'?'Alpha':'Bravo',ddcOther=()=>dd.active==='A'?'B':'A',ddcCol=t=>t==='A'?C.alpha:C.bravo;
function ddcMid(L){return{x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length};}
// the game slowed to a quarter while a ring is up or something is being dragged (state.js's timeScale)
let ddcR=null;
function ddcSlow(){return ddcOn()&&(!!ddcR&&performance.now()-ddcR.t0<4600||!!dd.drag);}

/* ---------- Draft 1: the other squad backs you up ---------- */
function ddcMode(t){const S=dd.sup||(dd.sup={A:'follow',B:'follow'});return S[t]||'follow';}   // (FOLLOW to start everywhere, the counterattack too: Bryan, after Version 168, "Follow by default")
const ddcBusy=u=>!!(u.medGo||u.throwGo||u.rpgAim||u.carry||u.carryGo||u.helpGo||u.raise||u.onGun||u.dcGun||u.build||u.fp||u.joining)||simT-(u.lastOrder??-99)<4;   // (on a job, or given an order of yours a moment ago)
// where a squad may be sent: the beach's strip (off it a man dies of it after 10 s: ddplay.js's ddTick), the village's ground, else the camera's bounds
function ddcBound(x,y){
  const Y=clamp(y,VB.z0+20,VB.z1-20);
  if(dd.vil&&typeof VG!=='undefined')return[clamp(x,VG.x0+30,VG.x1-30),Math.min(870,Y)];
  if(!dd.counter)return[clamp(x,DDX+16,Y<-440?1780:DDX+DDW-16),Y];
  return[clamp(x,VB.x0+20,VB.x1-20),Y];
}
function ddcSupport(t){
  const m=players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);if(!m.length)return;
  const A=dd.supA||(dd.supA={});
  if(dd.supLast!==dd.active){dd.supLast=dd.active;   // (just swapped: the squad you've let go stays put until yours moves on)
    const L0=players.filter(p=>p.team!==t&&alive(p)&&!p.inBoat);if(L0.length){const c=ddcMid(L0),M0=ddcMid(m);A[t]={x:c.x,y:c.y,px:M0.x,py:M0.y,t:simT};}}
  // their own wounded first (as ddplay.js's ddSquadAI does)
  for(const d of players.filter(p=>p.team===t&&p.downed&&!p.dead&&!p.carriedBy)){
    const free=m.filter(u=>!u.path.length&&!u.medGo&&!pinnedNow(u)&&!u.onGun).sort((a,b)=>hyp(a.x-d.x,a.y-d.y)-hyp(b.x-d.x,b.y-d.y));if(!free.length)break;
    if(d.critical){const k=free.find(hasKit);if(k&&!m.some(u=>u.medGo&&u.medGo.t===d))orderMedkit(k,d);continue;}
    if(helperOf(d))continue;const h=free[0];if(hyp(h.x-d.x,h.y-d.y)>22){const p=goBeside(h,d);if(p&&p.length){h.path=p;h.gaitForce=null;}}
  }
  if(typeof fpTools==='function')fpTools(m,m[0]);   // its kit: a rocket at a tank, a grenade where they're bunched or dug in, smoke when pinned (ddfp.js)
  const lead=players.filter(p=>p.team!==t&&alive(p)&&!p.inBoat&&!p.joining),mode=ddcMode(t),free=m.filter(u=>!ddcBusy(u)&&!pinnedNow(u));
  // the man your squad is shooting is theirs too, for those who can see him
  const F=lead.map(u=>u.focus).find(e=>e&&!beaten(e));
  if(F)for(const u of free)if(u.focus!==F&&hyp(u.x-F.x,u.y-F.y)<=wRange(u)&&fireLine(u,F))u.focus=F;
  if(mode==='hold'){   // holding: they pin it down (or the nearest machine gun they can see)
    const T=F||enemies.filter(e=>e.gunner&&!beaten(e)&&(e.seen||e.vis)).sort((a,b)=>hyp(a.x-m[0].x,a.y-m[0].y)-hyp(b.x-m[0].x,b.y-m[0].y))[0];
    if(T)for(const u of free)if(!u.supT&&!u.path.length&&hyp(u.x-T.x,u.y-T.y)<=wRange(u)&&fireLine(u,T))Object.assign(u,{supT:{x:T.x,y:T.y},noLine:0});
    return;
  }
  if(!lead.length||!free.length||free.some(u=>u.path.length))return;   // (on their way already)
  const L=ddcMid(lead),M=ddcMid(free),a=A[t];
  if(a&&simT-a.t<3)return;
  if(a&&hyp(L.x-a.x,L.y-a.y)<60&&hyp(M.x-a.px,M.y-a.py)<90)return;   // (yours hasn't moved on, and they're about where they were sent)
  // behind yours as seen from where you're going: the objective, else the enemy you know of, else north; and a little to one side
  let fx=0,fy=-1;const O=typeof ddObjective==='function'?ddObjective():null;
  if(O&&O.x!=null&&hyp(O.x-L.x,O.y-L.y)>40){const d=hyp(O.x-L.x,O.y-L.y);fx=(O.x-L.x)/d;fy=(O.y-L.y)/d;}
  else{const th=enemies.filter(e=>!beaten(e)&&(e.seen||e.vis)&&hyp(e.x-L.x,e.y-L.y)<600);if(th.length){const c=ddcMid(th),d=hyp(c.x-L.x,c.y-L.y)||1;fx=(c.x-L.x)/d;fy=(c.y-L.y)/d;}}
  const side=t==='B'?1:-1,[tx,ty]=ddcBound(L.x-fx*120-fy*side*45,L.y-fy*120+fx*side*45);
  if(hyp(M.x-tx,M.y-ty)<70){A[t]={x:L.x,y:L.y,px:M.x,py:M.y,t:simT};return;}   // (already about there)
  const as=makeAssign(free,tx,ty);if(!as.length){A[t]={x:L.x,y:L.y,px:M.x,py:M.y,t:simT};return;}
  for(const q of as)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0,supT:null});
  A[t]={x:L.x,y:L.y,px:tx,py:ty,t:simT};
}
// everyone you lead is down and the other squad has men up: you lead that one now
function ddcLeadCheck(){
  if(!ddcLead())return;const a=dd.active,o=ddcOther();
  if(players.some(p=>p.team===a&&alive(p))||!players.some(p=>p.team===o&&alive(p)&&!p.inBoat))return;
  selectTeam(o);banner(`${ddcName(a)} is down. You lead ${ddcName(o)}.`,2600);
}
// FOLLOW / HOLD for the other squad over the swap button, bottom right over the squad's bar
let ddcSw=null;
function ddcSwapEl(){
  if(ddcSw)return ddcSw;const st=$('#stage');if(!st)return null;
  const d=document.createElement('div');d.id='ddSwap';d.hidden=true;
  d.innerHTML='<div class="ddc-seg"><button type="button" data-m="follow">FOLLOW</button><button type="button" data-m="hold">HOLD</button></div>'+
    '<button type="button" class="ddc-swap"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/></svg><span><b></b><small>TAP TO LEAD</small><i class="ddc-pips"></i></span></button>';
  st.appendChild(d);
  d.addEventListener('click',ev=>{
    const b=ev.target.closest('button');if(!b||!ddcLead()||ddBusy())return;const o=ddcOther();
    if(b.classList.contains('ddc-swap')){
      if(!players.some(p=>p.team===o&&alive(p)&&!p.inBoat)){banner(`${ddcName(o)} has nobody up.`,1500);return;}
      ddcClose();ddToolEnd();preview=null;mode=null;selectTeam(o);}
    else if(b.dataset.m&&ddcMode(o)!==b.dataset.m){
      dd.sup[o]=b.dataset.m;if(dd.supA)dd.supA[o]=null;
      if(b.dataset.m==='hold'){   // they settle into cover where they are
        const m=players.filter(p=>p.team===o&&alive(p)&&!p.inBoat&&!ddcBusy(p));
        if(m.length){const c=ddcMid(m),as=makeAssign(m,c.x,c.y);for(const q of as)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0});}}
      banner(b.dataset.m==='hold'?`${ddcName(o)} holds here.`:`${ddcName(o)} follows you.`,1600);}
    ddcHud();hud();});
  return ddcSw=d;
}
function ddcHud(){
  document.body.classList.toggle('ddlead',MAPID==='dd'&&!!dd&&DDC.lead);
  const d=ddcSwapEl();if(!d)return;const on=ddcLead()&&!dd.fp&&!!sel.length;
  if(d.hidden===on){d.hidden=!on;d._new=on;}if(!on)return;
  const o=ddcOther(),mode=ddcMode(o),men=players.filter(p=>p.team===o),pip=u=>u.dead?'#4a5056':u.downed?'#ff5a48':u.hp>=70?'#5fe08e':u.hp>=35?'#ffcf4a':'#ff9a4a';
  const key=o+mode+men.map(pip).join('');
  if(d.dataset.k!==key){d.dataset.k=key;d.style.setProperty('--c',ddcCol(o));d.querySelector('.ddc-swap b').textContent=ddcName(o).toUpperCase();
    d.querySelector('.ddc-swap').setAttribute('aria-label',`Lead ${ddcName(o)}`);
    for(const b of d.querySelectorAll('.ddc-seg button'))b.classList.toggle('on',b.dataset.m===mode);
    d.querySelector('.ddc-pips').innerHTML=men.map(u=>`<u style="--p:${pip(u)}"></u>`).join('');}
  const now=performance.now();if(now-(d._t||0)<250&&!d._new)return;d._t=now;d._new=false;   // (where the bar's top is, looked up four times a second)
  const sq=$('#sq'),st=$('#stage');if(sq&&st&&!sq.hidden){const r=sq.getBoundingClientRect(),s=st.getBoundingClientRect();const b=Math.round(s.bottom-r.top+8)+'px';if(d.style.bottom!==b)d.style.bottom=b;}
}
// over the other squad: who they are and what they're doing
function ddcLabel(){
  if(!ddcLead())return;const o=ddcOther(),m=players.filter(p=>p.team===o&&alive(p)&&!p.inBoat);if(!m.length)return;
  const c=ddcMid(m);toSBack=false;const[x,y]=toS(c.x,c.y,34);if(toSBack)return;const B=ddBox();
  if(x<B.l||x>B.r||y<B.top||y>B.bot)return;   // (off the screen: the swap button says where they stand)
  pill(`${ddcName(o).toUpperCase()} · ${ddcMode(o)==='hold'?'HOLDING':'FOLLOWING'}`,clamp(x,70,cw-70),y,ddcCol(o));
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
/* dragging a tool from the bar onto the map: grenade, rifle grenade, smoke, Bazooka (a spot), medic kit (a man) */
const DDC_DRAG={nade:'nade',rgl:'nade',smoke:'smoke',rpg:'rpg',medkit:'medkit'};
const ddcDraggable=k=>!!DDC_DRAG[k];
function ddcDragBind(){
  const box=$('#sq');if(!box||box.dataset.ddc)return;box.dataset.ddc=1;
  box.addEventListener('pointerdown',ev=>{
    if(!ddcRing()||ddBusy()||dd.drag)return;const t=ev.target.closest('.sq-tool');if(!t||t.disabled||!ddcDraggable(t.dataset.k))return;
    ev.preventDefault();ev.stopPropagation();ddcClose();ddToolEnd();preview=null;mode=null;
    dd.drag={k:t.dataset.k,id:ev.pointerId,x0:ev.clientX,y0:ev.clientY,moved:false,pt:null,u:null,ok:false,btn:t};t.classList.add('ddc-press');
    window.addEventListener('pointermove',ddcDragMove,true);window.addEventListener('pointerup',ddcDragUp,true);window.addEventListener('pointercancel',ddcDragUp,true);
  },true);
}
function ddcDragOff(){window.removeEventListener('pointermove',ddcDragMove,true);window.removeEventListener('pointerup',ddcDragUp,true);window.removeEventListener('pointercancel',ddcDragUp,true);}
function ddcLocal(ev){const s=$('#stage').getBoundingClientRect();return[ev.clientX-s.left,ev.clientY-s.top];}
function ddcDragMove(ev){
  const D=dd&&dd.drag;if(!D){ddcDragOff();return;}if(ev.pointerId!==D.id)return;ev.stopPropagation();ev.preventDefault();
  if(hyp(ev.clientX-D.x0,ev.clientY-D.y0)>10)D.moved=true;
  const[sx,sy]=ddcLocal(ev),sq=$('#sq'),st=$('#stage').getBoundingClientRect(),top=sq&&!sq.hidden?sq.getBoundingClientRect().top-st.top-6:ch;
  if(sy>=top||sx<0||sx>cw||sy<0){D.pt=null;D.ok=false;return;}   // (back over the bar: let go there and it's put away)
  const[wx,wy]=toW(sx,sy);toSBack=false;const[bx,by]=toS(wx,wy);if(toSBack||hyp(bx-sx,by-sy)>6){D.pt=null;D.ok=false;return;}   // (not on the ground: the sky)
  D.pt={x:wx,y:wy,sx,sy};ddcDragEval(D);
}
function ddcDragEval(D){
  const T=DD_TOOLS.find(t=>t.k===D.k);D.u=null;D.ok=false;D.why='';if(!T||!D.pt)return;
  const P=D.pt,L=ddToolFree(T),near=(x,y)=>L.slice().sort((a,b)=>hyp(a.x-x,a.y-y)-hyp(b.x-x,b.y-y))[0];
  if(D.k==='medkit'){const t=unitAtScreen(P.sx,P.sy,false),man=t&&t.side==='P'&&!t.npc&&!t.dead&&(t.downed||t.hp<100)?t:null;D.man=man;D.u=man?near(man.x,man.y):L[0]||null;
    D.ok=!!(man&&D.u);D.why=!L.length?'Nobody free with one':!man?'Drop it on a hurt man':'';return;}
  const kind=DDC_DRAG[D.k],u=near(P.x,P.y);D.u=u||null;if(!u){D.why='Nobody free with one';return;}
  const{R,minD}=throwReach(u,kind),d=hyp(P.x-u.x,P.y-u.y),walk=kind==='nade'?NADE_WALK:ACT_R;
  D.d=d;D.R=R;D.walk=d>R||d<minD;D.ok=d<=R+walk;D.why=d>R+walk?'Too far':'';   // (a rocket too close: he backs off first, combat.js's fireSpot)
  if(!D.ok)return;   // in reach: is there somewhere to throw it from? (asked again once the finger has moved 2 m and 0.3 s have gone by)
  const now=performance.now(),c=D.sc;
  if(!c||c.u!==u||hyp(c.x-P.x,c.y-P.y)>20&&now-c.t>300){let s=null;try{s=fireSpot(u,P.x,P.y,R,minD,kind);}catch(e){s={here:true};}D.sc={u,x:P.x,y:P.y,t:now,s};}
  const s=D.sc.s;if(!s){D.ok=false;D.why=kind==='rpg'?'No spot to fire from':'No spot to throw from';}else D.walk=!s.here;
}
function ddcDragUp(ev){
  const D=dd&&dd.drag;if(!D){ddcDragOff();return;}if(ev.pointerId!==D.id)return;ev.stopPropagation();ddcDragOff();dd.drag=null;if(D.btn)D.btn.classList.remove('ddc-press');
  if(ev.type==='pointercancel')return;
  if(!D.moved){banner(D.k==='medkit'?'Drag the kit onto a hurt man.':'Drag it onto the map to use it.',1600);return;}
  if(!D.pt)return;   // (let go over the bar: put away)
  if(!D.ok){dd.tapW={x:D.pt.x,y:D.pt.y,t:performance.now()};if(D.why)ddNote(D.why);return;}
  const u=D.u;
  if(D.k==='medkit'){if(orderMedkit(u,D.man)){u.lastOrder=simT;u.hotT=simT+6;}}
  else if(orderThrow(u,D.pt.x,D.pt.y,DDC_DRAG[D.k])){u.lastOrder=simT;u.hotT=simT+6;}
  hud();
}
// what's being dragged: who, his reach, the arc, where it lands, and what letting go does
function ddcDragDraw(){
  const D=dd&&dd.drag;if(!D||!D.pt)return;const u=D.u,P=D.pt;
  if(D.k==='medkit'){if(D.man){gPath(D.man.x,D.man.y,16);ox.strokeStyle=D.ok?'#5fe08e':'#ff5a48';ox.lineWidth=3;ox.stroke();}
    pill(D.ok?`${u.name} treats ${D.man.name}`:D.why,P.sx,P.sy-58,D.ok?'#5fe08e':'#ff6a55');pill(D.ok?'LET GO TO TREAT · BACK TO THE BAR TO CANCEL':'LET GO HERE AND NOTHING HAPPENS',P.sx,P.sy-40,'#dfe5ea');if(u)u.hotT=simT+.3;return;}
  if(!u){pill(D.why||'Nobody free with one',P.sx,P.sy-50,'#ff6a55');return;}
  u.hotT=simT+.3;   // (his orange outline: ddplay.js's ddHot)
  const kind=DDC_DRAG[D.k],blast=kind==='smoke'?SMOKE.r:kind==='rpg'?(PRPG.blast||55):u.gl?68:58,ok=D.ok,col=!ok?'255,80,64':kind==='smoke'?'215,222,228':'255,170,70';
  gPath(u.x,u.y,D.R);ox.save();ox.setLineDash([6,6]);ox.strokeStyle=`rgba(${col},.5)`;ox.lineWidth=1.5;ox.stroke();ox.restore();
  toSBack=false;const[ax,ay]=toS(u.x,u.y,18),[bx,by]=toS(P.x,P.y,0),[mx,my]=toS((u.x+P.x)/2,(u.y+P.y)/2,kind==='rpg'?18:hyp(P.x-u.x,P.y-u.y)*.32+20);
  if(!toSBack){ox.save();ox.setLineDash([2,7]);ox.lineCap='round';ox.strokeStyle=ok?'rgba(255,236,200,.95)':'rgba(255,150,140,.95)';ox.lineWidth=3;ox.beginPath();ox.moveTo(ax,ay);ox.quadraticCurveTo(2*mx-(ax+bx)/2,2*my-(ay+by)/2,bx,by);ox.stroke();ox.restore();}
  gPath(P.x,P.y,blast);ox.fillStyle=`rgba(${col},.26)`;ox.fill();ox.strokeStyle=`rgba(${col},.95)`;ox.lineWidth=2.2;ox.stroke();
  const m=Math.round(D.d/10),verb=kind==='rpg'?'fires':kind==='smoke'?'throws smoke':'throws';
  pill(ok?`${u.name} ${verb} · ${m} m${D.walk?kind==='rpg'&&D.d<PRPG.min?' · backs off first':' · moves up first':''}`:`${D.why.toUpperCase()} · ${m} m`,P.sx,P.sy-62,ok?'#ffb347':'#ff6a55');
  pill(ok?'LET GO TO THROW · BACK TO THE BAR TO CANCEL':'LET GO HERE AND NOTHING IS THROWN',P.sx,P.sy-44,'#dfe5ea');
}

/* ---------- each frame (from the overlay), the start card's switches, the first word ---------- */
function ddcFrame(now){
  ddcHud();
  if(!ddcOn()){if(ddcR)ddcClose();return;}
  ddcLabel();if(DDC.ring&&!dd.fp){ddcLines();ddcRingFrame();ddcDragDraw();}
  if(!dd.ddcSaid&&(DDC.lead||DDC.ring)){dd.ddcSaid=simT+3;}   // a word on the test controls, a few seconds in
  else if(dd.ddcSaid>0&&simT>dd.ddcSaid){dd.ddcSaid=-1;banner(DDC.lead&&DDC.ring?'Test controls: ⇄ swaps squads. Tap an enemy for actions; drag a grenade onto the map.':DDC.lead?'Test controls: ⇄ swaps squads; the other follows you.':'Test controls: tap an enemy for actions; drag a grenade onto the map.',4200);}
}
function ddcBind(){
  const a=$('#ddCtlLead'),b=$('#ddCtlRing');
  if(a){a.checked=DDC.lead;a.addEventListener('change',()=>{DDC.lead=a.checked;ddcSave();});}
  if(b){b.checked=DDC.ring;b.addEventListener('change',()=>{DDC.ring=b.checked;ddcSave();});}
  ddcDragBind();
}
