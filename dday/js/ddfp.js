/* ddfp.js: taking one man over (Version 161). Bryan: "Let's do follow view and maybe first person on mounted objects... I would like it to
   turn into an actual 3rd or 1st person shooter when switching to it. So it can switch back and forth to team control or individual control",
   and of the rest of his squad: "Follow him. But they fight on their own, throw grenades and use items when needed".
   dd.fp is the man being played ({u, view '3p'|'1p', a heading, p pitch, ...}); u.fp marks him for combat.js (updateUnit moves him by fpUnit
   and never fires for him; playerThink leaves him alone). fpTick from ddTick, fpCam from ddCam, the HUD is DOM (#fp, built here). */
const FPC={fov1:66,fov3:52,back:64,side:11,sens:.0042,msens:.0021,follow:70};
const FP_W={   // the guns as he fires them himself: one round a press (held, they repeat), a clip, a reload
  rifle:{cool:.3,dmg:[30,42],clip:8,reload:1.7,spread:.007,kick:.012,range:520,sup:.1},
  hmg:{cool:.105,dmg:[13,18],clip:20,reload:2.3,spread:.017,kick:.006,range:520,sup:.07},
  sniper:{cool:1.25,dmg:[85,110],clip:5,reload:2.4,spread:.0015,kick:.03,range:900,sup:.3,zoom:.3},
  shotgun:{cool:.9,dmg:[38,50],clip:5,reload:2.4,spread:.03,kick:.03,range:220,sup:.14},
  mg:{cool:.085,dmg:[12,17],clip:60,reload:2.6,spread:.02,kick:.004,range:620,sup:.09}};
const fpArt=u=>dd&&dd.counter&&u.dcGun&&u.dcGun.man===u&&u.dcGun.t==='art'?u.dcGun:null;
const fpWK=u=>u.onGun?'mg':FP_W[u.weapon]?u.weapon:'rifle';
const fpOK=()=>!!dd&&state==='play'&&dd.land.done&&!endAt&&!dd.seq;   // (not during the sequence before Chapter 3: ddvillage.js)
function fpPick(){
  if(sel.length===1&&alive(sel[0])&&!sel[0].npc)return sel[0];
  const m=players.filter(p=>p.team===dd.active&&alive(p)&&!p.inBoat&&!p.joining);if(!m.length)return null;
  const t=ddTrackAt();return t&&m.includes(t)?t:m[0];
}
function fpEnter(u,view){
  if(!fpOK())return false;u=u||fpPick();if(!u||!alive(u)||u.inBoat){banner('Nobody to take over.',1500);return false;}
  fpBuild();
  const old=dd.fp;if(old){old.u.fp=false;if(old.u.m)old.u.m.g.visible=true;}
  if(dd.toolK)ddToolEnd();mode=null;preview=null;
  select([u]);
  let H=20;try{const b=new T.Box3().setFromObject(u.m.g);if(b.max.y-b.min.y>8)H=Math.min(30,b.max.y-b.min.y);}catch(e){}
  const F=dd.fp={u,view:view||(old?old.view:'3p'),a:u.ang,p:-.1,kick:0,mv:{x:0,y:0},keys:{},fire:false,aim:false,cool:0,clip:0,wk:null,reloadT:0,aiT:.3,anchor:null,H,
    fov:old?old.fov:camera.fov,fov0:old?old.fov0:camera.fov,near0:old?old.near0:camera.near,gun:old?old.gun:null,gunK:old?old.gunK:null,hitT:0,killT:0,msg:null};
  u.fp=true;u.path=[];u.supT=null;u.focus=null;u.watch=null;u.gaitForce=null;dd.track=null;camPan=null;
  document.body.classList.add('fp');$('#fp').hidden=false;
  if(!old)banner(`You are ${u.name}. The squad follows you.`,2200);
  fpHud();return true;
}
function fpExit(why){
  const F=dd&&dd.fp;if(!F)return;const u=F.u;u.fp=false;dd.fp=null;
  camera.fov=F.fov0;camera.near=F.near0;camera.updateProjectionMatrix();
  if(F.gun&&F.gun.parent)F.gun.parent.remove(F.gun);if(u.m)u.m.g.visible=true;
  document.body.classList.remove('fp','fp-scope');const el=$('#fp');if(el)el.hidden=true;
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  if(MAPID!=='dd'||state!=='play')return;
  const m=players.filter(p=>p.team===u.team&&alive(p));if(m.length)select(m);
  camT.x=u.x-Math.sin(yaw)*DD_CAM.look;camT.z=u.y-Math.cos(yaw)*DD_CAM.look;dd.track={team:u.team};
  const C=dd.cam||(dd.cam={k:1,p:null,q:null});C.k=0;C.p=camera.position.clone();C.q=camera.quaternion.clone();   // (out to the usual view the way they come off the boat)
  if(why||!(endAt||dd.won))banner(why||'Back in command of the squad.',2000);hud();   // (not over the win's banner)
}
function fpNext(){
  const F=dd.fp;if(!F)return;const m=players.filter(p=>p.team===F.u.team&&alive(p)&&!p.inBoat&&!p.joining);if(m.length<2)return;
  const n=m[(m.indexOf(F.u)+1)%m.length];if(fpEnter(n))banner(`You are ${n.name}.`,1400);
}
/* where the eye is and where it looks: first person from his head (always on a mounted gun), else from behind his right shoulder */
function fpPose(){
  const F=dd.fp,u=F.u,g=gndH(u.x,u.y)+(u.elev||0),A=fpArt(u),mt=!!u.onGun||!!A,one=mt||F.view==='1p';
  const p=F.p+F.kick,cp=Math.cos(p),D=new T.Vector3(Math.cos(F.a)*cp,Math.sin(p),Math.sin(F.a)*cp),R=new T.Vector3(-Math.sin(F.a),0,Math.cos(F.a));
  let O;
  if(one)O=new T.Vector3(u.x+Math.cos(F.a)*2.5,g+F.H*.9+(A?5:0),u.y+Math.sin(F.a)*2.5);
  else{O=new T.Vector3(u.x,g+F.H+7,u.y).addScaledVector(D,-FPC.back).addScaledVector(R,FPC.side);const gh=gndH(O.x,O.z)+3;if(O.y<gh)O.y=gh;}
  return{O,D,R,one,mt,A};
}
function fpGround(O,D){   // where a ray meets the ground: walked along, then halved (as scene.js's toW does)
  const under=q=>O.y+D.y*q<=gndH(O.x+D.x*q,O.z+D.z*q);let a=0,b=-1;
  for(let q=6;q<1600;q+=q<600?6:18){if(under(q)){b=q;break;}a=q;}
  if(b<0)return null;for(let i=0;i<8;i++){const m=(a+b)/2;if(under(m))b=m;else a=m;}
  return{x:O.x+D.x*b,y:O.z+D.z*b,t:b};
}
function fpAimPoint(max,min){   // the spot on the ground under the crosshair, kept within a reach of him
  const F=dd.fp,u=F.u,P=fpPose(),G=fpGround(P.O,P.D)||{x:u.x+Math.cos(F.a)*max,y:u.y+Math.sin(F.a)*max};
  const ox=P.A?P.A.x:u.x,oy=P.A?P.A.y:u.y;let dx=G.x-ox,dy=G.y-oy,d=hyp(dx,dy)||1;const k=clamp(d,min||0,max)/d;return{x:ox+dx*k,y:oy+dy*k,d};
}
/* one round, where the crosshair is: it hits whoever is on that line (their cover still stops some), not a roll of the dice */
function fpShoot(){
  const F=dd.fp,u=F.u,P=fpPose(),W=FP_W[fpWK(u)],O=P.O,D=P.D.clone();
  const sp=W.spread*(F.aim?.5:1)*(F.moving?1.8:1)*(1+Math.min(1,u.sup));
  D.x+=(Math.random()-.5)*2*sp;D.y+=(Math.random()-.5)*2*sp;D.z+=(Math.random()-.5)*2*sp;D.normalize();
  const tmin=P.one?0:FPC.back*.9,G=fpGround(O,D),tG=G?G.t:1500;
  let best=null,bt=tG+6;
  for(const e of enemies){if(e.dead||e.surr||e.dormant||e.gone)continue;const g=gndH(e.x,e.y)+(e.elev||0);
    for(const h of[5,12,19]){const vx=e.x-O.x,vy=g+h-O.y,vz=e.y-O.z,t=vx*D.x+vy*D.y+vz*D.z;if(t<tmin||t>=bt)continue;
      if(Math.hypot(vx-D.x*t,vy-D.y*t,vz-D.z*t)<4.2+t*.011){best=e;bt=t;break;}}}
  let tank=null;for(const K of ddTanksUp()){const vx=K.x-O.x,vy=gndH(K.x,K.y)+12-O.y,vz=K.y-O.z,t=vx*D.x+vy*D.y+vz*D.z;if(t<tmin||t>=bt)continue;if(Math.hypot(vx-D.x*t,vy-D.y*t,vz-D.z*t)<24){tank=K;best=null;bt=t-20;}}
  const reach=Math.min(bt,W.range+tmin);let ex=O.x+D.x*reach,ey=O.z+D.z*reach;
  if(best&&(hyp(best.x-u.x,best.y-u.y)>W.range||!los(u.x,u.y,best.x,best.y)))best=null;
  if(best){ex=best.x;ey=best.y;const c=coverAt(best.x,best.y,u.x,u.y);best.revealT=Math.max(best.revealT||0,simT+1.6);
    best.sup=Math.min(1.2,best.sup+W.sup*(u.supK||1)*(best.nerveK||1));if(!best.alerted)best.alerted=true;
    if(c&&Math.random()<(c>=2?.45:.25)){sparks.push({x:ex,y:ey,t:0});if(typeof sfxImpact==='function')sfxImpact(ex,ey);}
    else{const hs=u.weapon==='shotgun'?clamp(1-(hyp(ex-u.x,ey-u.y)-60)/200,.35,1):1;if(typeof sfxFlesh==='function')sfxFlesh(ex,ey);damage(best,(W.dmg[0]+Math.random()*(W.dmg[1]-W.dmg[0]))*hs,u);F.hitT=performance.now();if(best.dead)F.killT=F.hitT;}}
  else{if(tank){sparks.push({x:ex,y:ey,t:0});if(typeof sfxImpact==='function')sfxImpact(ex,ey,'metal');}else if(G&&Math.random()<.5&&typeof sfxImpact==='function')sfxImpact(ex,ey);
    for(const e of enemies)if(!beaten(e)&&hyp(e.x-ex,e.y-ey)<28)e.sup=Math.min(1.2,e.sup+W.sup*.7);}
  tracers.push({x1:u.x+Math.cos(F.a)*14,y1:u.y+Math.sin(F.a)*14,x2:ex,y2:ey,t:0,col:'255,231,163'});
  flashes.push({x:u.x+Math.cos(F.a)*6,y:u.y+Math.sin(F.a)*6,t:0,u});u.shotT=simT;u.aimT=simT;u.target=best||null;sfxShot(u);
  F.kick=Math.min(.12,F.kick+W.kick);if(u.onGun)shake(.06);
  if(--F.clip<=0){F.reloadT=simT+W.reload;if(typeof sfxReload==='function')setTimeout(()=>sfxReload(u.x,u.y),350);}
}
function fpReload(){const F=dd.fp;if(!F||F.reloadT||fpArt(F.u))return;const W=FP_W[fpWK(F.u)];if(F.clip>=W.clip)return;F.reloadT=simT+W.reload;if(typeof sfxReload==='function')sfxReload(F.u.x,F.u.y);}
function fpSay(t){const F=dd.fp;if(F)F.msg={t,until:performance.now()+1600};}
/* his grenade and his item go where the crosshair meets the ground */
function fpNade(){
  const F=dd.fp;if(!F)return;const u=F.u;if(u.onGun||fpArt(u)){fpSay('Leave the gun first');return;}
  if(!(u.grenade>0)){fpSay(u.gl?'No rifle grenades left':'No grenades left');return;}
  const p=fpAimPoint(nadeRange(u)-4,34);if(!throwNade(u,p.x,p.y))fpSay('No clear throw');
}
function fpSpec(){
  const F=dd.fp;if(!F)return;const u=F.u;if(u.onGun||fpArt(u)){fpSay('Leave the gun first');return;}
  if(!u.spec||!(u.specN>0)){fpSay('Nothing left');return;}
  if(u.spec==='smoke'){const p=fpAimPoint(SMOKE.range-4,34);if(!throwSmoke(u,p.x,p.y))fpSay('No clear throw');}
  else if(u.spec==='rpg'){const p=fpAimPoint(PRPG.range-4,PRPG.min+4);if(!fireRPG(u,p.x,p.y))fpSay('No clear shot');}
  else if(u.spec==='medkit'){const mates=players.filter(p=>p.team===u.team&&!p.dead&&p!==u&&!p.inBoat),by=(a,b)=>hyp(a.x-u.x,a.y-u.y)-hyp(b.x-u.x,b.y-u.y);
    const t=mates.filter(p=>p.downed&&hyp(p.x-u.x,p.y-u.y)<160).sort(by)[0]||(u.hp<75?u:mates.filter(p=>alive(p)&&p.hp<65&&hyp(p.x-u.x,p.y-u.y)<90).sort(by)[0]||(u.hp<96?u:null));
    if(!t){fpSay('Nobody needs it');return;}orderMedkit(u,t);fpSay(t===u?'Patching yourself up':`Medic kit: ${t.name}`);}
  else fpSay('Not from here');
}
/* a gun to man (the counterattack's nests and field guns): walk up, Use; the stick pushed takes him off it */
function fpGunNear(){const u=dd.fp.u;if(!dd.counter||!dd.dc)return null;let b=null,bd=70;for(const g of dd.dc.guns){if(g.dead||g.man&&!g.man.npc&&g.man!==u)continue;const d=hyp(g.x-u.x,g.y-u.y);if(d<bd){bd=d;b=g;}}return b;}
function fpLeaveGun(){const F=dd.fp,u=F.u;if(u.postGun)return;   /* (the checkpoint's guns: EXIT, not the stick) */
  if(!u.onGun&&!u.dcGun)return;u.onGun=null;u.gunner=false;u.dcGun=null;F.offT=0;F.clip=0;F.wk=null;if(isFree(u.x,u.y+12,5))u.y+=12;fpSay('Off the gun');}
function fpUse(){
  const F=dd.fp;if(!F)return;const u=F.u;if(u.postGun&&typeof ddPostOff==='function'){ddPostOff(u.postGun,u,'Off the gun.');return;}   // (LEAVE THE GUN on one of the checkpoint's: off it and back to the squads)
  if(u.onGun||fpArt(u)){fpLeaveGun();return;}
  const g=fpGunNear();if(!g){fpSay('Nothing to use here');return;}
  if(dcMan(u,g)){fpSay(g.t==='art'?'Taking the field gun':'Taking the gun');F.a=-Math.PI/2;F.p=-.03;}else fpSay('Can’t reach it');
}
/* his feet: the stick or WASD, relative to where he looks; things in the way stop him, and what the squad can climb he climbs */
function fpUnit(u,dt){
  const F=dd&&dd.fp;if(!F||F.u!==u){u.fp=false;return;}
  const K=F.keys;let sx=F.mv.x+((K.d?1:0)-(K.a?1:0)),sy=F.mv.y+((K.w?1:0)-(K.s?1:0));const l=hyp(sx,sy);if(l>1){sx/=l;sy/=l;}
  u.ang=F.a;u.aimT=simT;F.moving=l>.15;
  if(u.onGun||fpArt(u)){if(l>.7){F.offT=(F.offT||0)+dt;if(F.offT>.35)fpLeaveGun();}else F.offT=0;F.moving=false;return;}
  if(u.dcGun&&l>.5)u.dcGun=null;
  if(!F.moving||simT-(u.throwT??-9)<.45||u.rpgAim||u.carry)return;
  const fx=Math.cos(F.a),fy=Math.sin(F.a),z=slowAt(u.x,u.y),sp=RUN_SPEED*(u.spdK||1)*(u.sup>.65?.7:1)*(z?z.k:1)*(sy<-.3?.6:1)*(F.aim?.45:1)*dt;
  const dx=(fx*sy-fy*sx)*sp,dy=(fy*sy+fx*sx)*sp,pad=isFree(u.x,u.y,5)?5:1.5;
  if(isFree(u.x+dx,u.y+dy,pad)){u.x+=dx;u.y+=dy;return;}
  if(sy>.5&&simT>(F.vaultT||0)){F.vaultT=simT+.5;const tx=u.x+fx*36,ty=u.y+fy*36;   // over the wire, the bags, a wall's gap: the squad's own way across
    if(isFree(tx,ty)){const p=findPath(u.x,u.y,tx,ty);let L=0,q=u;if(p)for(const w of p){L+=hyp(w.x-q.x,w.y-q.y);q=w;}if(p&&p.some(w=>w.vault)&&L<95){u.path=p;return;}}}
  // round it: the same push turned a little to one side, then more (the side that worked last is tried first)
  for(const k of[.7,1.25,1.57])for(const sg of[F.slide||1,-(F.slide||1)]){const c=Math.cos(k*sg),n=Math.sin(k*sg),ax=(dx*c-dy*n)*.85,ay=(dx*n+dy*c)*.85;
    if(isFree(u.x+ax,u.y+ay,pad)){u.x+=ax;u.y+=ay;F.slide=sg;return;}}
}
/* the rest of his squad: they keep with him and fight by themselves, and use what they carry when it's needed */
function fpMates(){
  if(dd.fp.u.postGun)return;   // (on one of the checkpoint's guns: his squad stays where it is, ddpost.js)
  const F=dd.fp,u=F.u,m=players.filter(p=>p!==u&&p.team===u.team&&alive(p)&&!p.inBoat&&!p.joining);if(!m.length)return;
  const free=m.filter(p=>!p.medGo&&!p.throwGo&&!p.rpgAim&&!p.dcGun&&!p.onGun&&!pinnedNow(p));
  const A=F.anchor,moved=!A||hyp(u.x-A.x,u.y-A.y)>FPC.follow,far=free.filter(p=>!p.path.length&&hyp(p.x-u.x,p.y-u.y)>130),list=moved?free:far;
  if(list.length){let tx=u.x-Math.cos(F.a)*24,ty=u.y-Math.sin(F.a)*24;if(!isFree(tx,ty)){tx=u.x;ty=u.y;}
    const as=makeAssign(list,tx,ty);for(const a of as)Object.assign(a.u,{path:a.path,gaitForce:null,exposeT:0});if(moved)F.anchor={x:u.x,y:u.y};}
  fpTools(m,u);
}
function fpTools(m,u){
  const foes=enemies.filter(e=>!beaten(e)&&hyp(e.x-u.x,e.y-u.y)<520),ready=p=>!p.path.length&&!p.throwGo&&!p.rpgAim&&!p.medGo&&!pinnedNow(p)&&simT-(p.nadeT??-99)>5;
  const by=p=>(a,b)=>hyp(a.x-p.x,a.y-p.y)-hyp(b.x-p.x,b.y-p.y),near=(x,y,r)=>dd.allies.some(q=>hyp(q.x-x,q.y-y)<r);
  // a rocket at a tank whenever there is one; at a gun now and then
  const dm=m.find(p=>p.spec==='rpg'&&p.specN>0&&ready(p));
  if(dm){const K=ddTanksUp().filter(k=>{const d=hyp(k.x-dm.x,k.y-dm.y);return d>PRPG.min+10&&d<PRPG.range&&ddRocketClear(k.x,k.y,d);}).sort(by(dm))[0];
    if(K){if(Math.random()<.5&&orderThrow(dm,K.x,K.y,'rpg'))callout(dm,'Rocket on the tank!',C.warn);return;}
    const gun=foes.filter(e=>e.gunner||e.tag==='heavy'||e.tag==='cannon'||e.tag==='art'||e.tag==='mortar').filter(e=>{const d=hyp(e.x-dm.x,e.y-dm.y);return d>PRPG.min+10&&d<PRPG.range+40&&ddRocketClear(e.x,e.y,d);}).sort(by(dm))[0];
    if(gun&&Math.random()<.14){orderThrow(dm,gun.x,gun.y,'rpg');return;}}
  // a grenade where they're bunched or dug in
  const g=m.find(p=>(p.grenade||0)>0&&ready(p));
  if(g&&Math.random()<.3){const tg=foes.filter(e=>hyp(e.x-g.x,e.y-g.y)<nadeRange(g)+30&&!near(e.x,e.y,75)&&(foes.filter(o=>hyp(o.x-e.x,o.y-e.y)<55).length>=2||coverAt(e.x,e.y,g.x,g.y)>0||e.gunner)).sort(by(g))[0];
    if(tg){orderThrow(g,tg.x,tg.y,'nade');return;}}
  // smoke when they're being pinned
  const s=m.find(p=>p.spec==='smoke'&&p.specN>0&&!p.path.length&&!p.throwGo),all=[u,...m],pin=all.reduce((a,p)=>a+p.sup,0)/all.length;
  if(s&&(pin>.45||u.sup>.7)&&!smokes.some(c=>hyp(c.x-u.x,c.y-u.y)<160)){const mg=foes.sort(by(u)).find(e=>e.gunner)||foes[0];
    if(mg){const d=hyp(mg.x-u.x,mg.y-u.y)||1,k=Math.min(90,d*.5);orderThrow(s,u.x+(mg.x-u.x)/d*k,u.y+(mg.y-u.y)/d*k,'smoke');}}
}
function fpTick(dt){
  const F=dd.fp;if(!F)return;const u=F.u;
  if(!u||u.dead||u.downed){fpExit(u?`${u.name} is down. You are back in command.`:null);return;}
  if(endAt||dd.won||dd.over){fpExit();return;}
  u.lastOrder=simT;u.supT=null;u.focus=null;
  const wk=fpWK(u),W=FP_W[wk];if(F.wk!==wk){F.wk=wk;F.clip=W.clip;F.reloadT=0;F.cool=.25;}
  F.kick*=Math.exp(-dt*9);F.cool-=dt;if(F.reloadT&&simT>=F.reloadT){F.reloadT=0;F.clip=W.clip;}
  const A=fpArt(u);
  if(A){A.orderT=simT;   // (his gun waits for him: it doesn't pick its own target while he's on it)
    if(F.fire&&simT>=A.fireT&&dd.dc.ph!=='intro'&&dd.dc.ph!=='setup'){const p=fpAimPoint(DCA.art.max,DCA.art.min);dcFire(A,p.x,p.y);F.kick=.1;F.fire=false;}}
  else if(F.fire&&!F.reloadT&&F.cool<=0&&!u.path.length&&!u.vaultK&&!u.carry&&!u.rpgAim&&simT-(u.throwT??-9)>.5){fpShoot();F.cool=W.cool;}
  if((F.aiT-=dt)<=0){F.aiT=1;fpMates();}
}
const _fpq=typeof T!=='undefined'?new T.Quaternion().setFromAxisAngle(new T.Vector3(0,1,0),Math.PI/2):null;
function fpCam(rdt){
  const F=dd.fp;if(!F)return false;if(state!=='play'){fpExit();return false;}
  const u=F.u,P=fpPose(),W=FP_W[fpWK(u)],scope=P.one&&F.aim&&!!W.zoom&&!P.mt;
  const want=(P.one?FPC.fov1:FPC.fov3)*(F.aim?(scope?W.zoom:.64):1);F.fov+=(want-F.fov)*Math.min(1,rdt*12);
  camera.fov=F.fov;camera.near=1.5;camera.updateProjectionMatrix();if(camShiftOn){camera.clearViewOffset();camShiftOn=false;}camShift=0;
  const bob=P.one&&F.moving&&!P.mt?Math.sin(simT*11)*.35:0;
  camera.position.copy(P.O);camera.position.y+=bob;camera.up.set(0,1,0);
  camera.lookAt(P.O.x+P.D.x*300,P.O.y+bob+P.D.y*300,P.O.z+P.D.z*300);camera.updateMatrixWorld();
  camT.x=u.x;camT.z=u.y;if(typeof glide!=='undefined'&&glide)glide.vx=glide.vz=0;camPan=null;
  if(u.m)u.m.g.visible=!P.one;
  if(P.mt){const cx=Math.cos(F.a),cy=Math.sin(F.a);   // (Version 207, on a gun: your own side's men standing beside it or just in front aren't drawn; they filled the view. scene.js shows them again each frame)
    for(const q of units){if(q===u||!q.m||q.side==='E'||q.dead)continue;const dx=q.x-u.x,dy=q.y-u.y,d=hyp(dx,dy);if(d<30||(d<95&&(dx*cx+dy*cy)/d>.72))q.m.g.visible=false;}}
  // the gun in his hands, first person
  const kind=P.mt?'minigun':u.weapon==='hmg'?'bar':u.weapon==='sniper'?'spring':'garand';
  if(P.one&&!P.A&&!scope){
    if(!F.gun||F.gunK!==kind+(P.mt?'m':'')||F.gun.parent!==scene){if(F.gun&&F.gun.parent)F.gun.parent.remove(F.gun);F.gun=P.mt&&typeof ddPostFpGun==='function'?ddPostFpGun():ddmGun(kind);F.gunK=kind+(P.mt?'m':'');const own=F.gun.userData.own;F.gun.traverse(o=>{o.frustumCulled=false;o.castShadow=false;if(P.mt&&!own&&o.material)o.material.color.setHex(0x2a2c30);});scene.add(F.gun);}
    const g=F.gun,up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion),rt=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),fw=new T.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    const dip=F.reloadT?Math.min(1.6,(F.reloadT-simT)*2,(simT-(F.reloadT-W.reload))*6):0;
    g.visible=true;g.scale.setScalar(P.mt?.8:.5);
    g.position.copy(camera.position).addScaledVector(fw,(P.mt?9.5:7.5)-F.kick*22).addScaledVector(rt,P.mt?0:F.aim?0:2.2).addScaledVector(up,(P.mt?-3.6:F.aim?-1.35:-2.5)-dip+bob*.3);
    g.quaternion.copy(camera.quaternion).multiply(_fpq);if(g.userData.flash){g.userData.flash.visible=F.cool>W.cool-.05&&!F.reloadT;g.userData.flash.rotation.x=simT*37;g.scale.setScalar(.74);g.position.addScaledVector(fw,1.5).addScaledVector(up,.5);}
  }else if(F.gun)F.gun.visible=false;
  document.body.classList.toggle('fp-scope',scope);
  fpHud();return true;
}
/* ---------- the HUD and the controls ---------- */
function fpBuild(){
  if($('#fp'))return;const sq=$('#sq'),el=document.createElement('div');el.id='fp';el.hidden=true;
  el.innerHTML=`<div class="fp-scopeV" aria-hidden="true"></div><div class="fp-x" aria-hidden="true"><i></i><i></i><i></i><i></i><b></b></div>
<div class="fp-top"><button type="button" data-a="back">◀ Command</button><div class="fp-who"><b></b><span></span><i><u></u></i></div><button type="button" data-a="view"></button><button type="button" data-a="next">Next man ▶</button></div>
<div class="fp-msg" hidden></div>
<div class="fp-stick" aria-hidden="true"><i></i></div>
<div class="fp-btns"><div class="fp-ammo"></div><button type="button" data-a="use" hidden></button><button type="button" data-a="reload">Reload</button><button type="button" data-a="spec"></button><button type="button" data-a="nade"></button><button type="button" data-a="aim">Aim</button><button type="button" data-a="fire" class="fp-fire">FIRE</button></div>
<div class="fp-keys">WASD move · mouse look · click fire · right click aim · R reload · G grenade · Q item · E use · V view · Tab next man · F command</div>`;
  (sq?sq.parentNode:document.body).appendChild(el);
  const ptrs={},stick=el.querySelector('.fp-stick'),knob=stick.firstElementChild;
  const look=(dx,dy,s)=>{const F=dd&&dd.fp;if(!F)return;const u=F.u,k=s*clamp(F.fov/FPC.fov1,.25,1);F.a+=dx*k;F.p=clamp(F.p-dy*k,-1.05,.8);
    const g=u.onGun||(fpArt(u)?{ang:-Math.PI/2,arc:1.0}:null);if(g){const d=Math.atan2(Math.sin(F.a-g.ang),Math.cos(F.a-g.ang));F.a=g.ang+clamp(d,-g.arc,g.arc);}};
  const act=a=>{const F=dd&&dd.fp;if(!F)return;if(a==='back')fpExit();else if(a==='view'){if(F.u.onGun||fpArt(F.u))fpSay('First person on a gun');else F.view=F.view==='1p'?'3p':'1p';}
    else if(a==='next')fpNext();else if(a==='use')fpUse();else if(a==='spec')fpSpec();else if(a==='nade')fpNade();else if(a==='aim')F.aim=!F.aim;else if(a==='reload')fpReload();};
  el.addEventListener('click',ev=>{const b=ev.target.closest('button');if(b&&b.dataset.a!=='fire'){ev.stopPropagation();act(b.dataset.a);}});
  el.addEventListener('contextmenu',ev=>ev.preventDefault());
  el.addEventListener('pointerdown',ev=>{const F=dd&&dd.fp;if(!F)return;const b=ev.target.closest('button');
    if(b&&b.dataset.a!=='fire')return;ev.preventDefault();try{el.setPointerCapture(ev.pointerId);}catch(e){}
    const P=ptrs[ev.pointerId]={x:ev.clientX,y:ev.clientY,x0:ev.clientX,y0:ev.clientY,k:'look'};
    if(b){P.fire=true;F.fire=true;return;}
    if(ev.pointerType==='mouse'){if(ev.button===2){F.aim=true;P.aimHold=true;}else{F.fire=true;P.fire=true;}
      if(document.pointerLockElement!==el&&el.requestPointerLock)try{const r=el.requestPointerLock();if(r&&r.catch)r.catch(()=>{});}catch(e){}return;}
    if(F.u.onGun||fpArt(F.u))return;   // (Version 207, on a gun: a finger anywhere turns it. The left of the screen was still the walking stick, which does nothing on a gun, so a drag there didn't move the view: Bryan, "I couldn't move the viewpoint")
    if(ev.clientX<innerWidth*.42&&!Object.values(ptrs).some(q=>q.k==='stick')){P.k='stick';stick.style.left=ev.clientX+'px';stick.style.top=ev.clientY+'px';stick.classList.add('on');knob.style.transform='';}});
  el.addEventListener('pointermove',ev=>{const F=dd&&dd.fp,P=ptrs[ev.pointerId];if(!F)return;
    if(ev.pointerType==='mouse'){if(document.pointerLockElement!==el)look(ev.movementX||0,ev.movementY||0,FPC.msens);return;}   // (the mouse looks whether or not the browser let it be locked)
    if(!P)return;
    if(P.k==='stick'){let dx=(ev.clientX-P.x0)/46,dy=(ev.clientY-P.y0)/46;const l=hyp(dx,dy);if(l>1){dx/=l;dy/=l;}F.mv.x=dx;F.mv.y=-dy;knob.style.transform=`translate(${dx*34}px,${dy*34}px)`;return;}
    if(document.pointerLockElement===el)return;look(ev.clientX-P.x,ev.clientY-P.y,FPC.sens);P.x=ev.clientX;P.y=ev.clientY;});
  const up=ev=>{const F=dd&&dd.fp,P=ptrs[ev.pointerId];if(!P)return;delete ptrs[ev.pointerId];if(!F)return;
    if(P.k==='stick'){F.mv.x=F.mv.y=0;stick.classList.remove('on');}if(P.fire&&!Object.values(ptrs).some(q=>q.fire))F.fire=false;if(P.aimHold)F.aim=false;};
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  document.addEventListener('mousemove',ev=>{if(document.pointerLockElement===el)look(ev.movementX||0,ev.movementY||0,FPC.msens);});
  const KEY={KeyW:'w',KeyA:'a',KeyS:'s',KeyD:'d',ArrowUp:'w',ArrowLeft:'a',ArrowDown:'s',ArrowRight:'d'},ACT={KeyG:'nade',KeyQ:'spec',KeyE:'use',KeyV:'view',Tab:'next',KeyF:'back',Escape:'back',KeyR:'reload'};
  addEventListener('keydown',ev=>{if(MAPID!=='dd'||!dd)return;const F=dd.fp;
    if(!F){if(ev.code==='KeyF'&&fpOK()&&!ev.repeat&&!(ev.target&&/INPUT|TEXTAREA/.test(ev.target.tagName))){ev.preventDefault();ev.stopPropagation();fpEnter();}return;}
    if(KEY[ev.code]){F.keys[KEY[ev.code]]=true;ev.preventDefault();ev.stopPropagation();}
    else if(ACT[ev.code]){ev.preventDefault();ev.stopPropagation();if(!ev.repeat)act(ACT[ev.code]);}},true);
  addEventListener('keyup',ev=>{const F=dd&&dd.fp;if(F&&KEY[ev.code])F.keys[KEY[ev.code]]=false;},true);
  addEventListener('blur',()=>{const F=dd&&dd.fp;if(F){F.keys={};F.fire=false;F.mv.x=F.mv.y=0;}});
}
function fpHud(){
  const F=dd.fp,el=$('#fp');if(!F||!el)return;const u=F.u,A=fpArt(u),mt=!!u.onGun||!!A,W=FP_W[fpWK(u)],now=performance.now();
  const set=(q,h)=>{const n=el.querySelector(q);if(n&&n.dataset.h!==h){n.dataset.h=h;n.innerHTML=h;}return n;};
  const hp=Math.max(0,Math.round(u.hp));
  set('.fp-who b',`${u.role||''} · ${u.name}`);set('.fp-who span',`${teamName(u.team)} · ${hp}${u.sup>.65?' · PINNED':''}`);
  {const b=el.querySelector('.fp-who u');b.style.width=hp+'%';b.style.background=hp>=70?'#5fe08e':hp>=35?'#ffcf4a':'#ff7a4a';}
  set('[data-a="view"]',mt?'On the gun':F.view==='1p'?'3rd person':'1st person');
  const gname=A?'Field gun':u.onGun?'Machine gun':(typeof WEAPON!=='undefined'&&WEAPON[u.weapon||'rifle']?WEAPON[u.weapon||'rifle'].label:'Rifle');
  set('.fp-ammo',A?`<b>${simT>=A.fireT?'READY':'LOADING '+Math.ceil(A.fireT-simT)}</b><span>${gname}</span>`:`<b>${F.reloadT?'RELOADING':F.clip+' / '+W.clip}</b><span>${gname}</span>`);
  const nb=set('[data-a="nade"]',`${u.gl?'Rifle grenade':'Grenade'} <b>${u.grenade||0}</b>`);nb.disabled=!(u.grenade>0)||mt;
  const sn={smoke:'Smoke',rpg:'Bazooka',medkit:'Medic kit',build:'Barricade'}[u.spec]||'Item',sb=set('[data-a="spec"]',`${sn} <b>${u.spec?u.specN||0:0}</b>`);sb.disabled=!u.spec||!(u.specN>0)||mt;sb.hidden=!u.spec;
  const ub=el.querySelector('[data-a="use"]'),g=mt?null:fpGunNear(),ut=mt?'Leave the gun':g?'Enter':'';if(ub.hidden!==!ut)ub.hidden=!ut;if(ut&&ub.textContent!==ut)ub.textContent=ut;
  el.querySelector('[data-a="reload"]').hidden=!!A;el.querySelector('[data-a="aim"]').classList.toggle('on',F.aim);
  const x=el.querySelector('.fp-x');x.classList.toggle('hit',now-F.hitT<150);x.classList.toggle('kill',now-F.killT<320);x.style.setProperty('--gap',(5+Math.min(14,(F.moving?5:0)+F.kick*90+u.sup*5)).toFixed(1)+'px');
  const m=el.querySelector('.fp-msg'),on=!!F.msg&&now<F.msg.until;if(m.hidden===on)m.hidden=!on;if(on&&m.textContent!==F.msg.t)m.textContent=F.msg.t;
}
