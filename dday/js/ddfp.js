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
  mg:{cool:.085,dmg:[12,17],clip:60,reload:2.6,spread:.02,kick:.004,range:620,sup:.09},
  // (Version 254, Chapter 2's guns, Bryan: "Can the light machine guns have a higher rate of fire, 2x faster. The heavy machine gun can stay slow but
  // has more damage. The light machine guns should have a very fast rate of fire": the nests twice the rounds a second with a longer belt; the
  // heavy gun a round every 0.15 s, each more than twice as hard, and more off a tank: tank, of DCA.hv.tank a round, ddcounter.js's dcHvTank)
  lmg:{cool:.0425,dmg:[12,17],clip:150,reload:2.6,spread:.022,kick:.003,range:620,sup:.09},
  hvmg:{cool:.15,dmg:[30,40],clip:80,reload:3,spread:.013,kick:.009,range:620,sup:.16,tank:.8}};
const fpArt=u=>dd&&dd.counter&&u.dcGun&&u.dcGun.man===u&&u.dcGun.t==='art'?u.dcGun:null;
const fpWK=u=>u.onGun?(u.onGun.hv?'hvmg':u.onGun.lt?'lmg':'mg'):FP_W[u.weapon]?u.weapon:'rifle';
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
  if(dd.counter&&u.dcGun)banner(`${u.dcGun.n}: ${u.name}.`,1600);else if(!old)banner(`You are ${u.name}. The squad follows you.`,2200);
  fpHud();return true;
}
function fpExit(why){
  const F=dd&&dd.fp;if(!F)return;const u=F.u;u.fp=false;dd.fp=null;
  camera.fov=F.fov0;camera.near=F.near0;camera.updateProjectionMatrix();
  if(F.gun&&F.gun.parent)F.gun.parent.remove(F.gun);if(u.m)u.m.g.visible=true;if(typeof ddrFpOff==='function')ddrFpOff(F);
  document.body.classList.remove('fp','fp-scope');const el=$('#fp');if(el)el.hidden=true;
  try{if(document.pointerLockElement)document.exitPointerLock();}catch(e){}
  if(MAPID!=='dd'||state!=='play')return;
  const m=players.filter(p=>p.team===u.team&&alive(p));if(m.length)select(m);
  camT.x=u.x-Math.sin(yaw)*DD_CAM.look;camT.z=u.y-Math.cos(yaw)*DD_CAM.look;dd.track={team:u.team};
  const C=dd.cam||(dd.cam={k:1,p:null,q:null});C.k=0;C.p=camera.position.clone();C.q=camera.quaternion.clone();   // (out to the usual view the way they come off the boat)
  if(why||!(endAt||dd.won))banner(why||'Back in command of the squad.',2000);hud();   // (not over the win's banner)
}
function fpNext(){
  const F=dd.fp;if(!F)return;
  // (Version 248: behind a gun, Next is the next gun one of the squads' men is on: Chapter 2's along its row, the checkpoint's in their own order)
  if(dd.counter&&F.u.dcGun){if(typeof dcNextGun!=='function'||!dcNextGun())fpSay('No other gun manned');return;}
  if(F.u.postGun&&typeof ddPostNext==='function'&&ddPostNext())return;
  const m=players.filter(p=>p.team===F.u.team&&alive(p)&&!p.inBoat&&!p.joining);if(m.length<2)return;
  const n=m[(m.indexOf(F.u)+1)%m.length];if(fpEnter(n))banner(`You are ${n.name}.`,1400);
}
/* where the eye is and where it looks: first person from his head (always on a mounted gun), else from behind his right shoulder */
function fpPose(){
  const F=dd.fp,u=F.u,g=gndH(u.x,u.y)+(u.elev||0),A=fpArt(u),mt=!!u.onGun||!!A,one=mt||F.view==='1p';
  const p=F.p+F.kick,cp=Math.cos(p),D=new T.Vector3(Math.cos(F.a)*cp,Math.sin(p),Math.sin(F.a)*cp),R=new T.Vector3(-Math.sin(F.a),0,Math.cos(F.a));
  let O,rig=null;
  // (Version 246, the draft's guns: the eye rides behind and above the back of the real gun, round its pivot: ddreal.js)
  if(mt&&!A&&typeof ddrFpRig==='function'&&(rig=ddrFpRig(u))){const sp=Math.sin(p);O=new T.Vector3(rig.x,rig.y,rig.z).addScaledVector(D,-rig.eb).add(new T.Vector3(-Math.cos(F.a)*sp,cp,-Math.sin(F.a)*sp).multiplyScalar(rig.eh));return{O,D,R,one,mt,A,rig};}
  // (the draft's field gun: the eye above and behind its breech, looking along the barrel over the shield, and the gun turned to where you look)
  const am=A&&typeof ddReal==='function'&&ddReal()&&typeof DD!=='undefined'&&DD.dcGuns&&DD.dcGuns[A.k];
  if(am&&am.userData.real&&!A.dead){am.rotation.y=-F.a;O=new T.Vector3(am.position.x-Math.cos(F.a)*15,am.position.y+20,am.position.z-Math.sin(F.a)*15);return{O,D,R,one,mt,A};}
  if(one)O=new T.Vector3(u.x+Math.cos(F.a)*2.5,g+F.H*.9+(A?5:0),u.y+Math.sin(F.a)*2.5);
  else{O=new T.Vector3(u.x,g+F.H+7,u.y).addScaledVector(D,-FPC.back).addScaledVector(R,FPC.side);const gh=gndH(O.x,O.z)+3;if(O.y<gh)O.y=gh;}
  return{O,D,R,one,mt,A};
}
// (Version 259, Bryan: "Bullets, and missiles/field guns drop with distance") a round falls as it flies: q along the line it has dropped
// fpDrop(q,v), with v the speed it leaves the muzzle at (FP_DROP.v, units a second, slower than life so the fall shows) and FP_DROP.g: a machine
// gun's round has dropped half a metre at 60 m and 2 m at 115 m, the bazooka's rocket 1 m at 40 m and 5 m at its 90 m (much as a real one),
// the field gun's shell 1.4 m at 96 m (a shot at the middle of a tank's hull still lands at any range; one at its tracks far out falls short).
// Aim above a far man
const FP_DROP={g:98,v:{rifle:2200,hmg:2200,sniper:4000,shotgun:1500,mg:1800,lmg:1800,hvmg:1800,rocket:900,shell:1800}};
const fpDrop=(q,v)=>v?.5*FP_DROP.g*(q/v)*(q/v):0;
function fpGround(O,D,v){   // where a ray meets the ground: walked along, then halved (as scene.js's toW does); v: a round's speed, the line falling (fpDrop)
  const under=q=>O.y+D.y*q-fpDrop(q,v)<=gndH(O.x+D.x*q,O.z+D.z*q);let a=0,b=-1;
  for(let q=6;q<1600;q+=q<600?6:18){if(under(q)){b=q;break;}a=q;}
  if(b<0)return null;for(let i=0;i<8;i++){const m=(a+b)/2;if(under(m))b=m;else a=m;}
  return{x:O.x+D.x*b,y:O.z+D.z*b,t:b};
}
function fpAimPoint(max,min,v){   // the spot on the ground under the crosshair, kept within a reach of him (v: where a falling round meets it instead, fpDrop)
  const F=dd.fp,u=F.u,P=fpPose(),G=fpGround(P.O,P.D,v)||{x:u.x+Math.cos(F.a)*max,y:u.y+Math.sin(F.a)*max};
  const ox=P.A?P.A.x:u.x,oy=P.A?P.A.y:u.y;let dx=G.x-ox,dy=G.y-oy,d=hyp(dx,dy)||1;const k=clamp(d,min||0,max)/d;return{x:ox+dx*k,y:oy+dy*k,d};
}
// a ray against a box turned ang about the vertical (a tank's hull and turret): half sizes hx along it, hy up, hz across; how far along the ray, or null
function fpRayBox(O,D,cx,cy,cz,ang,hx,hy,hz){
  const ca=Math.cos(ang),sa=Math.sin(ang),rx=O.x-cx,ry=O.y-cy,rz=O.z-cz,o=[rx*ca+rz*sa,ry,-rx*sa+rz*ca],d=[D.x*ca+D.z*sa,D.y,-D.x*sa+D.z*ca],h=[hx,hy,hz];let t0=0,t1=1e9;
  for(let i=0;i<3;i++){if(Math.abs(d[i])<1e-6){if(Math.abs(o[i])>h[i])return null;continue;}let a=(-h[i]-o[i])/d[i],b=(h[i]-o[i])/d[i];if(a>b){const q=a;a=b;b=q;}t0=Math.max(t0,a);t1=Math.min(t1,b);if(t0>t1)return null;}
  return t0;
}
/* Version 247 (Bryan: "The field gun was not doing anything to the tank"): what the field gun's crosshair is on. Its shell used to go to the spot on
   the ground under the crosshair (fpAimPoint): aimed at a tank's hull or turret that spot is far behind the tank (at 89 m the shell landed 11 to
   14 m past it), so only a shot at the ground at its feet, led by a tank's length, ever hurt it. Now the first thing on the crosshair's line takes
   it: a tank (its hull and turret as a box, a little bigger with distance), one of their men (the man on a tank: the tank), else the ground. */
function fpArtAim(){
  const F=dd.fp,P=fpPose(),O=P.O,D=P.D,V=FP_DROP.v.shell,G=fpGround(O,D,V);let bt=G?G.t:1e9,best=null;   // (V: the shell falls, Version 259)
  for(const K of ddTanksUp()){const m=hyp(K.x-O.x,K.y-O.z)*.006,cy=gndH(K.x,K.y)+17,t=fpRayBox(O,D,K.x,cy+fpDrop(Math.hypot(K.x-O.x,cy-O.y,K.y-O.z),V),K.y,K.ang,36+m,18+m,21+m);if(t!=null&&t<bt){bt=t;best={x:K.x,y:K.y,tank:K};}}   // (the box raised by the shell's drop that far: the same as the line lowered)
  if(best)return best;   // (a tank on the line takes it even with a man nearer on that line: the blast has him too)
  for(const e of enemies){if(e.dead||e.surr||e.dormant||e.gone||e.air)continue;const g=gndH(e.x,e.y)+(e.elev||0);   // (not Chapter 2's helicopter: a shell bursts on the ground)
    for(const h of[5,12,19]){const vx=e.x-O.x,vy=g+h-O.y,vz=e.y-O.z,t=vx*D.x+vy*D.y+vz*D.z;if(t<0||t>=bt)continue;
      if(Math.hypot(vx-D.x*t,vy-D.y*t+fpDrop(t,V),vz-D.z*t)<3.5+t*.004){bt=t;const K=e.onTank&&e.onTank.hp>0?e.onTank:null;best=K?{x:K.x,y:K.y,tank:K}:{x:e.x,y:e.y};break;}}}
  return best||fpAimPoint(DCA.art.max,DCA.art.min,V);
}
/* one round, where the crosshair is: it hits whoever is on that line (their cover still stops some), not a roll of the dice */
function fpShoot(){
  const F=dd.fp,u=F.u,P=fpPose(),W=FP_W[fpWK(u)],O=P.O,D=P.D.clone();
  const sp=W.spread*(F.aim?.5:1)*(F.moving?1.8:1)*(1+Math.min(1,u.sup))*(u.postGun?.6:1);   // (the checkpoint's guns are steadier: at 73 m four rounds in sixty hit, Version 211)
  D.x+=(Math.random()-.5)*2*sp;D.y+=(Math.random()-.5)*2*sp;D.z+=(Math.random()-.5)*2*sp;D.normalize();
  const tmin=P.one?0:FPC.back*.9,V=FP_DROP.v[fpWK(u)]||FP_DROP.v.rifle,G=fpGround(O,D,V),tG=G?G.t:1500;   // (V: the round falls as it flies, Version 259: fpDrop below)
  let best=null,bt=tG+6;
  // (Version 255) Chapter 2's helicopter: its nose, cabin, boom and tail on the line, a little more forgiving with distance. A hit is its door gunner's, and combat.js's damage hands it on
  if(typeof dcHeliUp==='function')for(const H of dcHeliUp()){if(!H.e||H.e.dead)continue;const c=Math.cos(H.ang),s=Math.sin(H.ang),g=gndH(H.x,H.y)+H.alt;
    for(const[f,r]of[[18,9],[2,11],[-22,7],[-46,6]]){const vx=H.x+c*f-O.x,vy=g+2-O.y,vz=H.y+s*f-O.z,t=vx*D.x+vy*D.y+vz*D.z;if(t<tmin||t>=bt)continue;
      if(Math.hypot(vx-D.x*t,vy-D.y*t+fpDrop(t,V),vz-D.z*t)<r+t*.011){best=H.e;bt=t;break;}}}
  for(const e of enemies){if(e.dead||e.surr||e.dormant||e.gone||e.air)continue;const g=gndH(e.x,e.y)+(e.elev||0);
    for(const h of[5,12,19]){const vx=e.x-O.x,vy=g+h-O.y,vz=e.y-O.z,t=vx*D.x+vy*D.y+vz*D.z;if(t<tmin||t>=bt)continue;
      if(Math.hypot(vx-D.x*t,vy-D.y*t+fpDrop(t,V),vz-D.z*t)<4.2+t*.011){best=e;bt=t;break;}}}
  let tank=null;for(const K of ddTanksUp()){if(best&&best.onTank===K)continue;const vx=K.x-O.x,vy=gndH(K.x,K.y)+12-O.y,vz=K.y-O.z,t=vx*D.x+vy*D.y+vz*D.z;if(t<tmin||t>=bt)continue;if(Math.hypot(vx-D.x*t,vy-D.y*t+fpDrop(t,V),vz-D.z*t)<24){tank=K;best=null;bt=t-20;}}
  // (Version 211, Bryan: "the MG nest from the top of the hill can reach the lowers MG nests and vice versa. It seems like I was unable to hit them
  // from the bottom MG nest": a gun's reach in your hands was 62 m and the roof's guns are 72 to 75 m off, so every round stopped short. One of the
  // checkpoint's guns reaches 90 m now; and a man up on a roof is hit over whatever stands between on the ground)
  const GR=u.onGun&&u.gunW&&u.gunW.reach,R=u.postGun?900:GR?GR.r:W.range,reach=Math.min(bt,R+tmin);let ex=O.x+D.x*reach,ey=O.z+D.z*reach;   // (GR: Chapter 2's machine guns, Version 258: out to 115 m, weaker past 44 m, gunFarDmg below)
  if(best&&(hyp(best.x-u.x,best.y-u.y)>R||!(best.air||(best.elev||0)>20&&u.postGun)&&!los(u.x,u.y,best.x,best.y)))best=null;
  if(best&&!best.air&&MAPID==='dd'&&smokes.length&&smokeBlocks(u.x,u.y,best.x,best.y)&&Math.random()<SMOKE.ddFp)best=null;   // (Version 259: through smoke some rounds go wide, not all: map.js's SMOKE.ddFp)
  let z2=null;if(best&&best.air){ex=O.x+D.x*bt;ey=O.z+D.z*bt;z2=O.y+D.y*bt;}else if(!best&&!tank&&!G){z2=O.y+D.y*reach-fpDrop(reach,V);}   // (up at the helicopter, or into the sky: the tracer goes there, not to the ground under it)
  if(best){if(!best.air){ex=best.x;ey=best.y;}const c=best.air?0:coverAt(best.x,best.y,u.x,u.y);best.revealT=Math.max(best.revealT||0,simT+1.6);
    best.sup=Math.min(1.2,best.sup+W.sup*(u.supK||1)*(best.nerveK||1));if(!best.alerted)best.alerted=true;
    if(c&&Math.random()<(c>=2?.45:.25)){sparks.push({x:ex,y:ey,t:0});if(typeof sfxImpact==='function')sfxImpact(ex,ey);}
    else{const hs=u.weapon==='shotgun'?clamp(1-(hyp(ex-u.x,ey-u.y)-60)/200,.35,1):1;if(best.air){if(Math.random()<.5&&typeof sfxImpact==='function')sfxImpact(ex,ey,'metal');}else if(typeof sfxFlesh==='function')sfxFlesh(ex,ey);damage(best,(W.dmg[0]+Math.random()*(W.dmg[1]-W.dmg[0]))*hs*gunFarDmg(u,hyp(best.x-u.x,best.y-u.y)),u);F.hitT=performance.now();if(best.dead)F.killT=F.hitT;}}
  else{if(tank){sparks.push({x:ex,y:ey,t:0});if(typeof sfxImpact==='function')sfxImpact(ex,ey,'metal');if(u.dcGun&&u.dcGun.hv&&typeof dcHvTank==='function'){dcHvTank(tank,W.tank||.34,u);F.hitT=performance.now();}}else if(G&&Math.random()<.5&&typeof sfxImpact==='function')sfxImpact(ex,ey);   // (a heavy machine gun in your hands marks a tank: ddcounter.js. Version 247: the miss's sound on the ground had been swallowed by this note since Version 224)
    for(const e of enemies)if(!beaten(e)&&hyp(e.x-ex,e.y-ey)<28)e.sup=Math.min(1.2,e.sup+W.sup*.7);}
  tracers.push({x1:u.x+Math.cos(F.a)*14,y1:u.y+Math.sin(F.a)*14,x2:ex,y2:ey,t:0,col:'255,231,163',z2});
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
  else if(u.spec==='rpg'){const p=fpAimPoint(PRPG.range-4,PRPG.min+4,FP_DROP.v.rocket);   // (the rocket falls short of the crosshair the further it goes, Version 259)
   if(!fireRPG(u,p.x,p.y))fpSay('No clear shot');}
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
  if(dd.fp.u.postGun||dd.counter&&dd.fp.u.dcGun)return;   // (on one of the checkpoint's guns, or the counterattack's: his squad stays where it is, ddpost.js, ddcounter.js)
  const F=dd.fp,u=F.u,m=players.filter(p=>p!==u&&p.team===u.team&&alive(p)&&!p.inBoat&&!p.joining);if(!m.length)return;
  const free=m.filter(p=>!p.medGo&&!p.throwGo&&!p.rpgAim&&!p.dcGun&&!p.onGun&&!pinnedNow(p));
  const A=F.anchor,moved=!A||hyp(u.x-A.x,u.y-A.y)>FPC.follow,far=free.filter(p=>!p.path.length&&hyp(p.x-u.x,p.y-u.y)>130),list=moved?free:far;
  if(list.length){let tx=u.x-Math.cos(F.a)*24,ty=u.y-Math.sin(F.a)*24;if(!isFree(tx,ty)){tx=u.x;ty=u.y;}
    const as=makeAssign(list,tx,ty);for(const a of as)Object.assign(a.u,{path:a.path,gaitForce:null,exposeT:0});if(moved)F.anchor={x:u.x,y:u.y};}
  fpTools(m,u);
}
function fpTools(m,u){
  const foes=enemies.filter(e=>!beaten(e)&&!e.air&&hyp(e.x-u.x,e.y-u.y)<520),ready=p=>!p.path.length&&!p.throwGo&&!p.rpgAim&&!p.medGo&&!p.dcGun&&!pinnedNow(p)&&simT-(p.nadeT??-99)>5&&simT>(p.toolNoT??-99);   // (Version 254: not a man on one of Chapter 2's guns; and after a throw he couldn't make, not again for 6 s: the refusals came up over him every second)
  const by=p=>(a,b)=>hyp(a.x-p.x,a.y-p.y)-hyp(b.x-p.x,b.y-p.y),near=(x,y,r)=>dd.allies.some(q=>hyp(q.x-x,q.y-y)<r);
  // a rocket at a tank whenever there is one; at a gun now and then
  const dm=m.find(p=>p.spec==='rpg'&&p.specN>0&&ready(p));
  if(dm){const K=ddTanksUp().filter(k=>{const d=hyp(k.x-dm.x,k.y-dm.y);return d>PRPG.min+10&&d<PRPG.range&&ddRocketClear(k.x,k.y,d);}).sort(by(dm))[0];
    if(K){if(Math.random()<.5){if(orderThrow(dm,K.x,K.y,'rpg'))callout(dm,'Rocket on the tank!',C.warn);else dm.toolNoT=simT+6;}return;}
    const gun=foes.filter(e=>e.gunner||e.tag==='heavy'||e.tag==='cannon'||e.tag==='art'||e.tag==='mortar').filter(e=>{const d=hyp(e.x-dm.x,e.y-dm.y);return d>PRPG.min+10&&d<PRPG.range+40&&ddRocketClear(e.x,e.y,d);}).sort(by(dm))[0];
    if(gun&&Math.random()<.14){if(!orderThrow(dm,gun.x,gun.y,'rpg'))dm.toolNoT=simT+6;return;}}
  // a grenade where they're bunched or dug in
  const g=m.find(p=>(p.grenade||0)>0&&ready(p));
  if(g&&Math.random()<.3){const tg=foes.filter(e=>hyp(e.x-g.x,e.y-g.y)<nadeRange(g)+30&&!near(e.x,e.y,75)&&(foes.filter(o=>hyp(o.x-e.x,o.y-e.y)<55).length>=2||coverAt(e.x,e.y,g.x,g.y)>0||e.gunner)).sort(by(g))[0];
    if(tg){if(!orderThrow(g,tg.x,tg.y,'nade'))g.toolNoT=simT+6;return;}}
  // smoke when they're being pinned
  const s=m.find(p=>p.spec==='smoke'&&p.specN>0&&!p.path.length&&!p.throwGo),all=[u,...m],pin=all.reduce((a,p)=>a+p.sup,0)/all.length;
  if(s&&(pin>.45||u.sup>.7)&&!smokes.some(c=>hyp(c.x-u.x,c.y-u.y)<160)){const mg=foes.sort(by(u)).find(e=>e.gunner)||foes[0];
    if(mg){const d=hyp(mg.x-u.x,mg.y-u.y)||1,k=Math.min(90,d*.5);if(!orderThrow(s,u.x+(mg.x-u.x)/d*k,u.y+(mg.y-u.y)/d*k,'smoke'))s.toolNoT=simT+6;}}
}
function fpTick(dt){
  const F=dd.fp;if(!F)return;const u=F.u;
  if(!u||u.dead||u.downed){fpExit(u?`${u.name} is down. You are back in command.`:null);return;}
  if(endAt||dd.won||dd.over){fpExit();return;}
  u.lastOrder=simT;u.supT=null;u.focus=null;
  const wk=fpWK(u),W=FP_W[wk];if(F.wk!==wk){F.wk=wk;F.clip=W.clip;F.reloadT=0;F.cool=.25;}
  F.kick*=Math.exp(-dt*9);F.cool=Math.max(F.cool-dt,-.05);if(F.reloadT&&simT>=F.reloadT){F.reloadT=0;F.clip=W.clip;}
  const A=fpArt(u);
  if(A){A.orderT=simT;   // (his gun waits for him: it doesn't pick its own target while he's on it)
    if(F.fire&&simT>=A.fireT&&dd.dc.ph!=='intro'&&dd.dc.ph!=='setup'){const p=fpArtAim();dcFire(A,p.x,p.y,{direct:true,tank:p.tank});F.kick=.1;F.fire=false;}}
  else if(F.fire&&!F.reloadT&&F.cool<=0&&!u.path.length&&!u.vaultK&&!u.carry&&!u.rpgAim&&simT-(u.throwT??-9)>.5){let k=0;do{fpShoot();F.cool+=W.cool;}while(F.cool<=0&&!F.reloadT&&++k<3);}   // (Version 254: two rounds in one tick when the frames are slow, so the light guns' 0.0425 s keeps its rate)
  if((F.aiT-=dt)<=0){F.aiT=1;fpMates();}
}
const _fpl=typeof T!=='undefined'?new T.Quaternion():null,_fpe=typeof T!=='undefined'?new T.Euler():null;
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
  if(P.one&&!P.mt)for(const q of units){if(q===u||!q.m||q.side==='E'||q.dead)continue;if(hyp(q.x-u.x,q.y-u.y)<13)q.m.g.visible=false;}   // (Version 213: a man of yours standing at your shoulder filled the corner of the view)
  if(P.mt){const cx=Math.cos(F.a),cy=Math.sin(F.a);   // (Version 207, on a gun: your own side's men standing beside it or just in front aren't drawn; they filled the view. scene.js shows them again each frame)
    for(const q of units){if(q===u||!q.m||q.side==='E'||q.dead)continue;const dx=q.x-u.x,dy=q.y-u.y,d=hyp(dx,dy);if(d<30||(d<95&&(dx*cx+dy*cy)/d>.72))q.m.g.visible=false;}}
  // the gun in his hands, first person
  const kind=P.mt?'minigun':u.weapon==='hmg'?'bar':u.weapon==='sniper'?'spring':'garand';
  if(P.rig){if(F.gun)F.gun.visible=false;const W2=W;ddrFpFrame(F,P,F.cool>W2.cool-.05&&!F.reloadT);}
  else if(F.rg&&typeof ddrFpOff==='function')ddrFpOff(F);
  if(P.rig){}
  else if(P.one&&!P.A&&!scope){
    if(!F.gun||F.gunK!==kind+(P.mt?'m':'')||F.gun.parent!==scene){if(F.gun&&F.gun.parent)F.gun.parent.remove(F.gun);F.gun=P.mt&&typeof ddPostFpGun==='function'?ddPostFpGun():typeof fpGunModel==='function'&&!P.mt?fpGunModel(kind):ddmGun(kind);F.gunK=kind+(P.mt?'m':'');const own=F.gun.userData.own;F.gun.traverse(o=>{o.frustumCulled=false;o.castShadow=false;if(P.mt&&!own&&o.material)o.material.color.setHex(0x2a2c30);});scene.add(F.gun);}
    const g=F.gun,up=new T.Vector3(0,1,0).applyQuaternion(camera.quaternion),rt=new T.Vector3(1,0,0).applyQuaternion(camera.quaternion),fw=new T.Vector3(0,0,-1).applyQuaternion(camera.quaternion);
    const dip=F.reloadT?Math.min(1.6,(F.reloadT-simT)*2,(simT-(F.reloadT-W.reload))*6):0,shot=F.cool>W.cool-.05&&!F.reloadT;
    g.visible=true;
    if(g.userData.hand){   // (Version 213) the rifle in his hands: held low and to the right, brought up to the eye to aim, swaying as he breathes and walks, lagging a little behind a turn, kicking when it fires (ddfpgun.js)
      const S=.5,dt=Math.min(.05,rdt||.016),ads=F.ads=(F.ads||0)+((F.aim?1:0)-(F.ads||0))*Math.min(1,dt*11),k=1-ads*.88;
      const da=Math.atan2(Math.sin(F.a-(F.pa??F.a)),Math.cos(F.a-(F.pa??F.a))),dp=F.p-(F.pp??F.p);F.pa=F.a;F.pp=F.p;
      F.lx=clamp((F.lx||0)*Math.max(0,1-dt*9)+da*4,-.8,.8);F.ly=clamp((F.ly||0)*Math.max(0,1-dt*9)+dp*4,-.6,.6);
      if(shot)F.vk=1;F.vk=(F.vk||0)*Math.max(0,1-dt*11);
      const t=performance.now()/1000,mv=F.moving?1:0,sx=Math.sin(t*1.3)*.06+mv*Math.sin(simT*5.5)*.2,sy=Math.sin(t*1.9)*.045+mv*Math.abs(Math.sin(simT*5.5))*.16;
      g.scale.setScalar(S);
      const tall=camera.aspect<1;   // (a phone held upright: the view is narrow and the buttons fill its lower right, so the rifle is held higher and nearer the middle)
      g.position.copy(camera.position).addScaledVector(fw,(tall?5.4:6.4)*(1-ads)+6.3*ads-F.vk*.85-F.kick*6).addScaledVector(rt,(tall?1.25:2.25)*(1-ads)+(sx-F.lx*1.1)*k).addScaledVector(up,(tall?-1.35:-2.3)*(1-ads)-g.userData.sight*S*ads+(sy+F.ly*.9)*k-dip*1.5);
      g.quaternion.copy(camera.quaternion).multiply(_fpq).multiply(_fpl.setFromEuler(_fpe.set(-.07*(1-ads)+dip*.25,(tall?.11:.05)*(1-ads)+F.lx*.1*k,(tall?.05:0)*(1-ads)+F.vk*.06+F.ly*.1*k-dip*.35,'YZX')));
      if(g.userData.flash){g.userData.flash.visible=shot;g.userData.flash.rotation.x=simT*37;}
    }else{g.scale.setScalar(P.mt?.8:.5);
      g.position.copy(camera.position).addScaledVector(fw,(P.mt?9.5:7.5)-F.kick*22).addScaledVector(rt,P.mt?0:F.aim?0:2.2).addScaledVector(up,(P.mt?-3.6:F.aim?-1.35:-2.5)-dip+bob*.3);
      g.quaternion.copy(camera.quaternion).multiply(_fpq);if(g.userData.flash){g.userData.flash.visible=shot;g.userData.flash.rotation.x=simT*37;g.scale.setScalar(.74);g.position.addScaledVector(fw,1.5).addScaledVector(up,.5);}}
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
<button type="button" data-a="gexit" class="fp-gexit">Exit gun</button>
<div class="fp-stick" aria-hidden="true"><i></i></div>
<div class="fp-btns"><div class="fp-ammo"></div><button type="button" data-a="use" hidden></button><button type="button" data-a="reload">Reload</button><button type="button" data-a="spec"></button><button type="button" data-a="nade"></button><button type="button" data-a="aim">Aim</button><button type="button" data-a="fire" class="fp-fire">FIRE</button></div>
<div class="fp-gnav"><button type="button" data-a="gprev" class="fp-gprev">‹ Prev<small></small></button><button type="button" data-a="gnext" class="fp-gnext">Next ›<small></small></button></div>
<div class="fp-keys">WASD move · mouse look · click fire · right click aim · R reload · G grenade · Q item · E use · V view · Tab next man · F command</div>`;
  (sq?sq.parentNode:document.body).appendChild(el);
  const ptrs={},stick=el.querySelector('.fp-stick'),knob=stick.firstElementChild;
  const look=(dx,dy,s)=>{const F=dd&&dd.fp;if(!F)return;const u=F.u,k=s*clamp(F.fov/FPC.fov1,.25,1);F.a+=dx*k;F.p=clamp(F.p-dy*k,-1.05,.8);
    const g=u.onGun||(fpArt(u)?{ang:-Math.PI/2,arc:1.0}:null);if(g){const d=Math.atan2(Math.sin(F.a-g.ang),Math.cos(F.a-g.ang));F.a=g.ang+clamp(d,-g.arc,g.arc);}
    if(u.onGun&&typeof ddReal==='function'&&ddReal())F.p=clamp(F.p,-.42,.5);};   // (the draft's guns: a gun on its mount only tips so far)
  const act=a=>{const F=dd&&dd.fp;if(!F)return;if(a==='back')fpExit();else if(a==='view'){if(F.u.onGun||fpArt(F.u))fpSay('First person on a gun');else F.view=F.view==='1p'?'3p':'1p';}
    else if(a==='next'||a==='gnext')fpNext();else if(a==='gexit')fpExit();else if(a==='gprev'){if(typeof dcPrevGun!=='function'||!dcPrevGun())fpSay('No other gun manned');}else if(a==='use')fpUse();else if(a==='spec')fpSpec();else if(a==='nade')fpNade();else if(a==='aim')F.aim=!F.aim;else if(a==='reload')fpReload();};
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
    else if(ACT[ev.code]){ev.preventDefault();ev.stopPropagation();if(!ev.repeat)act(ev.code==='Tab'&&ev.shiftKey&&dd.counter&&F.u.dcGun?'gprev':ACT[ev.code]);}},true);
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
  set('[data-a="next"]',u.postGun&&typeof ddPostNextOf==='function'&&ddPostNextOf(u)?'Next gun ▶':'Next man ▶');
  // (Version 255, Bryan: "The screen is too busy. The next gun button can be above the count of bullets. On the left side of the screen it can be
  // previous. The bottom can show the teammates that are on the guns. On the top right there is an exit gun button"): on one of Chapter 2's guns
  // (#fp.dcg) only EXIT GUN at the top right, PREV and NEXT at the bottom left across from AIM and FIRE (Version 257), the rounds left over AIM and
  // FIRE, and the row of guns along the bottom
  // (ddcounter.js's dcBar). The man's name and health, Command, the view, reload, grenade and item are hidden there (css/style.css)
  {const cg=!!(dd.counter&&u.dcGun);el.classList.toggle('dcg',cg);
    if(cg){const nx=typeof dcNextOf==='function'?dcNextOf(u):null,pv=typeof dcPrevOf==='function'?dcPrevOf(u):null,nb=el.querySelector('[data-a="gnext"]'),pb=el.querySelector('[data-a="gprev"]');
      set('[data-a="gnext"] small',nx?dcName(nx):'');if(nb.disabled!==!nx)nb.disabled=!nx;set('[data-a="gprev"] small',pv?dcName(pv):'');if(pb.disabled!==!pv)pb.disabled=!pv;}
    set('.fp-keys',cg?'mouse aim · click fire · right click zoom · Tab next gun · Shift+Tab previous · Esc exit gun':'WASD move · mouse look · click fire · right click aim · R reload · G grenade · Q item · E use · V view · Tab next man · F command');}
  const gname=A?'Field gun':u.onGun?'Machine gun':(typeof WEAPON!=='undefined'&&WEAPON[u.weapon||'rifle']?WEAPON[u.weapon||'rifle'].label:'Rifle');
  set('.fp-ammo',A?`<b>${simT>=A.fireT?'READY':'LOADING '+Math.ceil(A.fireT-simT)}</b><span>${gname}</span>`:`<b>${F.reloadT?'RELOADING':F.clip+' / '+W.clip}</b><span>${gname}</span>`);
  const nb=set('[data-a="nade"]',`${u.gl?'Rifle grenade':'Grenade'} <b>${u.grenade||0}</b>`);nb.disabled=!(u.grenade>0)||mt;
  const sn={smoke:'Smoke',rpg:'Bazooka',medkit:'Medic kit',build:'Barricade'}[u.spec]||'Item',sb=set('[data-a="spec"]',`${sn} <b>${u.spec?u.specN||0:0}</b>`);sb.disabled=!u.spec||!(u.specN>0)||mt;sb.hidden=!u.spec;
  const ub=el.querySelector('[data-a="use"]'),g=mt?null:fpGunNear(),ut=dd.counter&&u.dcGun?'':mt?'Leave the gun':g?'Enter':'';if(ub.hidden!==!ut)ub.hidden=!ut;if(ut&&ub.textContent!==ut)ub.textContent=ut;
  el.querySelector('[data-a="reload"]').hidden=!!A;el.querySelector('[data-a="aim"]').classList.toggle('on',F.aim);
  const x=el.querySelector('.fp-x');x.classList.toggle('hit',now-F.hitT<150);x.classList.toggle('kill',now-F.killT<320);x.style.setProperty('--gap',(5+Math.min(14,(F.moving?5:0)+F.kick*90+u.sup*5)).toFixed(1)+'px');
  const m=el.querySelector('.fp-msg'),on=!!F.msg&&now<F.msg.until;if(m.hidden===on)m.hidden=!on;if(on&&m.textContent!==F.msg.t)m.textContent=F.msg.t;
}
