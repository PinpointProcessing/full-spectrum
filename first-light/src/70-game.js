/* Game rules: you, the zombies, the people who follow you, and how fights resolve. */
let state='intro',paused=false,simT=0,hitStop=0,slowT=0,shakeAmt=0,hurtFlash=0;
let L=null,ents=[],zeds=[],allies=[],survs=[],civs=[],items=[],corpses=[],debris=[],humans=[];
let EV={},stats={kills:0,shots:0};
const input={mx:0,my:0,atkP:false,shootP:false,shootH:false,dashP:false,aimX:null,aimY:null};
const _fs={x:0,y:0};
const MELEE={
  fists:{name:'Fists',dmg:[9,13],range:15,arc:.95,dur:.24,kb:55},
  bat:{name:'Bat',dmg:[24,32],range:23,arc:1.1,dur:.36,kb:110,uses:60},
  club:{name:'7-iron',dmg:[17,23],range:21,arc:.9,dur:.44,kb:80,uses:45},
  board:{name:'Skateboard',dmg:[11,15],range:19,arc:.9,dur:.32,kb:60,uses:30},
  iron:{name:'Tire iron',dmg:[14,18],range:19,arc:.9,dur:.4,kb:70,uses:55},
  baton:{name:'Baton',dmg:[14,18],range:19,arc:.9,dur:.38,kb:65,uses:50},
  knife:{name:'Butcher knife',dmg:[15,20],range:16,arc:.8,dur:.25,kb:35,uses:50},
  pan:{name:'Frying pan',dmg:[16,21],range:18,arc:1.05,dur:.36,kb:130,uses:40},
  ciron:{name:'Clothes iron',dmg:[26,34],range:15,arc:.8,dur:.46,kb:90,uses:35},
  hammer:{name:'Hammer',dmg:[20,26],range:17,arc:.85,dur:.34,kb:75,uses:55},
};
/* ---- what You carry: up to two melee weapons, one in hand. They wear out with every hit that lands and then break. ---- */
function giveMelee(kind,left){
  const u=L,W={kind,left:left===undefined?MELEE[kind].uses:left};let dropped=null;
  if(u.bag.length<2)u.bag.push(W);else{dropped=u.bag[u.hand];u.bag[u.hand]=W;}
  u.hand=u.bag.indexOf(W);u.melee=kind;setWeapon(u.fig,kind);return dropped;
}
function swapMelee(){
  const u=L;if(!u||u.dead||u.atk||u.bag.length<2)return;
  u.hand=1-u.hand;u.melee=u.bag[u.hand].kind;setWeapon(u.fig,u.melee);sfx('pickup');floatText(u,MELEE[u.melee].name.toUpperCase(),'#fff');
}
function wearMelee(n){
  const u=L,W=u.bag[u.hand];if(!W)return;W.left-=n;if(W.left>0)return;
  const name=MELEE[W.kind].name;u.bag.splice(u.hand,1);u.hand=0;u.melee=u.bag.length?u.bag[0].kind:'fists';setWeapon(u.fig,u.melee==='fists'?null:u.melee);
  sfx('crash',u.x,u.y,.7);floatText(u,name.toUpperCase()+' BROKE',COL.bad);caption(u.bag.length?`The ${name.toLowerCase()} breaks. You pull out the ${MELEE[u.melee].name.toLowerCase()}.`:`The ${name.toLowerCase()} breaks. You are down to your fists.`,null,3200);
}
/* start = how far away it begins an attack, lunge = how fast it comes at you during the strike */
const ZT={shambler:{hp:[58,76],speed:[18,24],dmg:[10,14],wind:.42,rec:.75,sight:170,start:24,lunge:95},runner:{hp:[36,44],speed:[72,80],dmg:[7,10],wind:.24,rec:.6,sight:250,start:27,lunge:210},brute:{hp:[330,330],speed:[26,26],dmg:[22,28],wind:.6,rec:.9,sight:220,start:32,lunge:140}};
const turn=(a,b,k)=>a+angDiff(a,b)*Math.min(1,k);

/* ---- HUD text hooks (filled in by the HUD module) ---- */
let capTimer=0;
function caption(text,who,ms){const c=$('#cap');c.innerHTML=(who?`<b>${who}</b>`:'')+text;c.classList.add('show');clearTimeout(capTimer);capTimer=setTimeout(()=>c.classList.remove('show'),ms||3200);}
let bigTimer=0;
function bigText(text,ms){const b=$('#big');b.textContent=text;b.classList.add('show');clearTimeout(bigTimer);bigTimer=setTimeout(()=>b.classList.remove('show'),ms||2200);}
const floats=[];
function floatText(u,text,col){floats.push({x:u.x,y:u.y,h:(u.z||0)+26,text,col:col||'#fff',t:0});}
function shake(a){shakeAmt=Math.min(9,shakeAmt+a);}

/* ---- making things ---- */
function base(kind,x,y,ang,fig){return{kind,x,y,z:0,ang:ang||0,kx:0,ky:0,vx:0,vy:0,spd:0,dead:false,deadT:0,fig,anim:null,stag:0};}
function mkYou(x,y){
  const u=Object.assign(base('you',x,y,-PI/2,makeFig(SPEC.you)),{name:'You',hp:160,maxhp:160,speed:61,slowT:0,melee:'fists',bag:[],hand:0,has:{pistol:false,shotgun:false},ammo:{pistol:0,shotgun:0},aid:0,
    atk:null,combo:0,comboT:0,wantAtk:0,dashT:0,dashCD:0,dvx:0,dvy:0,inv:0,hurtT:0,shootT:9,shootCD:0,lying:false,upT:0,lyingH:0,stepAcc:0,lungeT:0,lvx:0,lvy:0});
  ents.push(u);return u;
}
const SURV={
  walt:{name:'Walt',role:'keeps watch',weapon:'club',hp:115,speed:60,rate:.95,line:'About time! I’ve been up here since the six o’clock news.',help:['HEY! Up here!','I’ve got a 7-iron and nothing to lose!','Somebody! Anybody!']},
  jules:{name:'Jules',role:'scout',weapon:'board',hp:85,speed:72,rate:.6,line:'You’re real? Okay. Okay. I’m coming with you.',help:['Help! They can climb!','Get them off me!']},
  marisol:{name:'Marisol',role:'medic',weapon:'knife',hp:100,speed:63,rate:.8,medic:1,line:'I’m a nurse. Keep them off me and I’ll keep you standing.',help:['']},
  dunn:{name:'Dunn',role:'guard',weapon:'baton',gun:1,ammo:14,hp:125,speed:62,rate:.8,line:'Officer Dunn. Whatever your plan is, it beats mine.',help:['Stay back! Get off the street!']},
};
function mkSurv(key,x,y,ang,extra){
  const S=SURV[key],u=Object.assign(base('surv',x,y,ang,makeFig(SPEC[key])),{key,name:S.name,role:S.role,hp:S.hp,maxhp:S.hp,speed:S.speed,melee:S.weapon,rate:S.rate,medic:!!S.medic,gun:!!S.gun,ammo:S.ammo||0,
    atk:null,atkCD:0,shootCD:0,shootT:9,foe:null,senseT:Math.random()*.3,safe:false,safeR:0,hidden:false,yellT:rand(2,5),recruited:false,far:0,hurtT:0},extra||{});
  setWeapon(u.fig,u.gun?'pistol':S.weapon);ents.push(u);survs.push(u);return u;
}
function mkCiv(x,y,path,speed){
  const u=Object.assign(base('civ',x,y,0,makeFig(civSpec())),{hp:30,maxhp:30,path,speed:speed||60,anim:'panic',turnT:0});
  ents.push(u);civs.push(u);return u;
}
function mkZed(type,x,y,extra){
  if(!isFree(x,y,6)){const c=cellOf(x,y);if(c<0)return null;x=(c%GW)*CS+5;y=((c/GW)|0)*CS+5;}
  const Z=ZT[type],look=extra&&extra.look;
  const u=Object.assign(base('z',x,y,Math.random()*TAU,makeFig(zSpec(type,look))),{ztype:type,hp:rand(Z.hp[0],Z.hp[1]),speed:rand(Z.speed[0],Z.speed[1]),windDur:Z.wind,recDur:Z.rec,sight:Z.sight,
    state:'idle',tgt:null,goal:null,path:null,repath:0,lost:0,direct:false,track:0,as:null,at:0,atkCD:rand(0,.4),struck:false,senseT:Math.random()*.3,wt:rand(1,5),far:false,burning:false,groanT:rand(2,9)},extra||{});
  u.maxhp=u.hp;ents.push(u);zeds.push(u);return u;
}
/* bodies already lying in the street: posed once and never animated again, so they cost one draw each */
let corpseFigs=[];
function mkCorpse(x,y,ang){
  const u=Object.assign(base('prop',x,y,ang,makeFig(civSpec())),{dead:true,deadT:9,fallDir:Math.random()<.5?1:-1}),f=u.fig;
  figAnim(f,u,1,0);figAnim(f,u,1,0);f.mesh.castShadow=false;corpseFigs.push(f);
  decal(x,y,rand(16,24),1);
}
const ITEMG={aid:()=>[bx(6,4,4,0,0,0,0xe8e8e8),bx(2.4,.9,4.1,0,0,0,0xd2332a),bx(.9,2.4,4.1,0,0,0,0xd2332a)],ammo:()=>[bx(5,3,3.4,0,0,0,0x3a4a36),bx(5.1,.8,3.5,0,.6,0,0xd0b040)],shells:()=>[bx(5,3,3.4,0,0,0,0x8a2a1e),bx(5.1,.8,3.5,0,.6,0,0xd0b040)]};
const ITEMN={bat:'Baseball bat',pistol:'Pistol',shotgun:'Shotgun',aid:'First aid',ammo:'9mm rounds',shells:'Shells',club:'7-iron',board:'Skateboard',iron:'Tire iron',baton:'Baton',knife:'Butcher knife',pan:'Frying pan',ciron:'Clothes iron',hammer:'Hammer'};
function mkItem(kind,x,y,left){
  // weapons lie in the world as the same model you end up holding
  const W=WEAP[kind],m=new T.Mesh(W?weapGeo(kind):merge(ITEMG[kind]()),W?WMAT:vmat({roughness:.5,metalness:.2}));m.castShadow=true;m.position.set(x,9,y);
  if(W){m.scale.setScalar(W.gun?1.4:W.two?1.15:1.5);if(!W.gun)m.rotation.z=1.1;}scene.add(m);
  const g=glowAt(x,6,y,kind==='aid'?0x7dffb0:0xffd98a,26);
  const it={kind,x,y,m,g,taken:false,left};items.push(it);return it;
}

/* ---- noise: gunfire, alarms and breaking glass pull in anything that isn't already chasing someone ---- */
function makeNoise(x,y,r){
  for(const z of zeds){
    if(z.dead||z.script||z.state==='chase'||z.anim==='tramp')continue;
    const d=hyp(z.x-x,z.y-y);if(d>r)continue;
    z.state='seek';z.goal={x:x+rand(-24,24),y:y+rand(-24,24)};z.path=null;z.anim=null;
  }
}

/* ---- damage ---- */
function hitZ(z,dmg,src,ang,kb,crit){
  if(z.dead)return;
  z.hp-=dmg;z.fig.flash=1;z.stag=Math.max(z.stag,z.ztype==='brute'?.1:.28);z.anim=z.anim==='tramp'?'tramp':null;
  // most hits knock the attack out of them; some shrug it off and finish the lunge
  if(z.ztype!=='brute'&&(z.as!=='wind'||Math.random()<.6||dmg>45)){z.as=null;z.at=0;z.atkCD=Math.max(z.atkCD,.4);}
  const m=z.ztype==='brute'?.25:1;z.kx+=Math.cos(ang)*kb*m;z.ky+=Math.sin(ang)*kb*m;
  fxBlood(z.x,z.y,13+(z.z||0),Math.cos(ang),Math.sin(ang),crit?18:8,crit);
  if(Math.random()<.6)decal(z.x+Math.cos(ang)*rand(6,18),z.y+Math.sin(ang)*rand(6,18),rand(5,11),.85);
  if(src&&z.state!=='chase'&&!z.script){z.state='chase';z.tgt=src;z.lost=0;}
  if(z.hp<=0)killZ(z,src,ang,crit);
}
function killZ(z,src,ang,crit){
  if(z.dead)return;
  z.dead=true;z.deadT=0;z.hp=0;z.as=null;z.spd=0;stats.kills++;
  z.fallDir=Math.abs(angDiff(z.ang,ang))<PI/2?-1:1;
  z.kx*=1.5;z.ky*=1.5;z.z=0;
  decal(z.x,z.y,rand(14,22),1);
  if(z.fig.eyes)z.fig.eyes.visible=false;
  const h=crit&&popHead(z.fig);
  if(h){ // head comes off
    debris.push({o:h,vx:Math.cos(ang)*rand(60,120),vy:Math.sin(ang)*rand(60,120),vz:rand(70,120),sx:rand(-9,9),sz:rand(-9,9),t:0});
    for(let i=0;i<3;i++)fxBlood(z.x,z.y,16,rand(-1,1),rand(-1,1),8,true);
    sfx('pop',z.x,z.y,1);if(src===L)floatText(z,pick(['POP','OUT OF THE PARK','CLEAN OFF']),'#ffd24a');
  }
  if(z.boss){bigText('Big Earl is down',2400);shake(4);}
  corpses.push(z);
  if(corpses.length>12){const c=corpses.shift();c.gone=true;removeFig(c.fig);}
}
function hurt(h,dmg,z){
  if(h.dead)return false;
  if(h===L&&(L.inv>0||L.dashT>0||state!=='play'))return false;
  if(h.kind==='surv'){if((h.safeT||0)>simT)return false;dmg*=.4;h.safeT=simT+.7;}   // followers can't be chewed down by a pile-on
  h.hp-=dmg;h.fig.flash=.8;h.hurtT=.25;
  const a=z?Math.atan2(h.y-z.y,h.x-z.x):0;
  fxBlood(h.x,h.y,13,Math.cos(a),Math.sin(a),6,false);
  if(h===L){L.inv=.45;L.kx+=Math.cos(a)*70;L.ky+=Math.sin(a)*70;shake(3);hurtFlash=1;sfx('hurt');sfx('bite');L.atk=null;}
  else{sfx('bite',h.x,h.y,.8);if(Math.random()<.4)sfx(h.kind==='civ'?'scream':'hurt',h.x,h.y,.8);}
  if(h.hp<=0)die(h,a);
  return true;
}
function die(h,a){
  h.hp=0;h.dead=true;h.deadT=0;h.fallDir=1;h.atk=null;h.spd=0;decal(h.x,h.y,22,1);
  if(h===L){gameOver();return;}
  if(h.kind==='surv'){
    sfx('scream',h.x,h.y,1);
    caption(`${h.name} is gone.`,null,3600);floatText(h,`${h.name.toUpperCase()} IS DEAD`,COL.bad);
    allies=allies.filter(x=>x!==h);rebuildHumans();hudAllies();
  }else if(h.kind==='civ'){sfx('scream',h.x,h.y,1);h.turnT=rand(5,8);}
}
function rebuildHumans(){humans=[L,...survs.filter(s=>!s.dead&&!s.hidden&&!s.quiet),...civs.filter(c=>!c.dead)];}

/* ---- you ---- */
function getUp(){
  if(!L.lying)return;
  L.lying=false;L.upT=.9;L.upFrom={x:L.x,y:L.y};L.upTo={x:324,y:1368};EV.up=true;
  if(bedBlanket)bedBlanket.position.set(0,-1.4,6);
}
function aimDir(){
  if(input.aimX!==null)return Math.atan2(input.aimY-L.y,input.aimX-L.x);
  if(hyp(input.mx,input.my)>.3)return Math.atan2(input.my,input.mx);
  return L.ang;
}
function meleeTarget(dir,reach){
  let best=null,bs=1e9;
  for(const z of zeds){
    if(z.dead||z.far)continue;const d=hyp(z.x-L.x,z.y-L.y);if(d>reach)continue;
    const da=Math.abs(angDiff(dir,Math.atan2(z.y-L.y,z.x-L.x)));if(da>1.5&&d>16)continue;
    const s=d+da*26;if(s<bs){bs=s;best=z;}
  }
  return best;
}
function startAttack(){
  const u=L,W=MELEE[u.melee],fists=u.melee==='fists';
  const type=fists?u.combo%2:u.combo%3;u.combo++;
  let dir=aimDir();const t=meleeTarget(dir,54);
  if(t){dir=Math.atan2(t.y-u.y,t.x-u.x);const d=hyp(t.x-u.x,t.y-u.y),lunge=clamp(d-W.range+7,0,26);u.lungeT=.09;u.lvx=Math.cos(dir)*lunge/.09;u.lvy=Math.sin(dir)*lunge/.09;}
  else{u.lungeT=.08;u.lvx=Math.cos(dir)*70;u.lvy=Math.sin(dir)*70;}
  u.ang=dir;u.atk={t:0,dur:W.dur*(type===2?1.3:1),type,hit:false,swung:false};u.wantAtk=0;u.comboT=9;
}
function meleeResolve(a){
  const u=L,W=MELEE[u.melee],smash=a.type===2&&u.melee!=='fists';
  const range=W.range+(smash?4:0),arc=smash?.75:W.arc;let hits=0,crits=0;
  fxArc(u.x,u.y,smash?4:12,u.ang-arc,u.ang+arc,range-10,range+2,u.melee==='fists'?0xcfd8e0:0xfff1d0,.15);
  for(const p of PORTALS)if(!p.open&&!p.door&&hyp(p.cx-u.x,p.cy-u.y)<range+10&&Math.abs(angDiff(u.ang,Math.atan2(p.cy-u.y,p.cx-u.x)))<1.2)breakPortal(p);      // a swing at a window breaks it
  for(const z of zeds){
    if(z.dead||z.far)continue;const d=hyp(z.x-u.x,z.y-u.y);if(d>range+5)continue;
    const dir=Math.atan2(z.y-u.y,z.x-u.x);if(d>8&&Math.abs(angDiff(u.ang,dir))>arc)continue;
    const crit=u.melee!=='fists'&&Math.random()<(smash?.34:.14);
    hitZ(z,rand(W.dmg[0],W.dmg[1])*(smash?1.55:1)*(crit?2.2:1),u,dir,W.kb*(smash?1.6:1),crit);
    if(smash)z.stag=Math.max(z.stag,.8);
    hits++;if(crit)crits++;
  }
  if(smash){fxDust(u.x+Math.cos(u.ang)*range*.7,u.y+Math.sin(u.ang)*range*.7,6);shake(1.2);}
  if(hits&&u.melee!=='fists')wearMelee(smash?2:1);
  if(hits){
    hitStop=crits?.12:smash?.09:.055;shake(crits?4:smash?3:1.6);
    sfx(u.melee==='fists'?'punch':crits||smash?'crack':'hit');makeNoise(u.x,u.y,60);
  }
}
function shootTarget(dir){
  let best=null,bs=1e9;
  for(const z of zeds){
    if(z.dead||z.far)continue;const d=hyp(z.x-L.x,z.y-L.y);if(d>270)continue;
    const da=Math.abs(angDiff(dir,Math.atan2(z.y-L.y,z.x-L.x)));
    if(input.aimX!==null?da>.5:da>2.2)continue;
    if(!los(L.x,L.y,z.x,z.y))continue;
    const s=d+da*(input.aimX!==null?300:70)-(z.state==='chase'&&z.tgt===L?40:0);if(s<bs){bs=s;best=z;}
  }
  return best;
}
function tryShoot(){
  const u=L,dir0=aimDir(),t=shootTarget(dir0);
  const d=t?hyp(t.x-u.x,t.y-u.y):999;
  let gun=null;
  if(u.has.shotgun&&u.ammo.shotgun>0&&(d<=130||!(u.has.pistol&&u.ammo.pistol>0)))gun='shotgun';
  else if(u.has.pistol&&u.ammo.pistol>0)gun='pistol';
  if(!gun){if(input.shootP){sfx('dry');if(u.has.pistol||u.has.shotgun)floatText(u,'EMPTY',COL.warn);}u.shootCD=.25;return;}
  const dir=t?Math.atan2(t.y-u.y,t.x-u.x):dir0;
  u.ang=dir;u.shootT=0;u.ammo[gun]--;stats.shots++;u.atk=null;
  setWeapon(u.fig,gun);
  const mx=u.x+Math.cos(dir)*9,my=u.y+Math.sin(dir)*9;
  fxMuzzle(mx,my,13.5,dir);
  emit(pDrop,u.x,u.y,13,Math.cos(dir+1.6)*30,Math.sin(dir+1.6)*30,50,1.3,.8,.9,.75,.3,1,300,0,0,1);
  if(gun==='pistol'){
    u.shootCD=.3;sfx('gun');shake(1.1);makeNoise(u.x,u.y,340);
    if(t){
      const hitP=clamp(.95-d/700,.4,.95);
      if(Math.random()<hitP){const crit=Math.random()<.24;fxTracer(mx,my,13.5,t.x,t.y,crit?17:12);hitZ(t,rand(38,52)*(crit?2.6:1),u,dir,70,crit);hitStop=crit?.07:.03;}
      else fxTracer(mx,my,13.5,t.x+rand(-10,10)+Math.cos(dir)*60,t.y+rand(-10,10)+Math.sin(dir)*60,10);
    }else fxTracer(mx,my,13.5,u.x+Math.cos(dir)*260,u.y+Math.sin(dir)*260,10);
  }else{
    u.shootCD=.85;sfx('shotgun');shake(4);makeNoise(u.x,u.y,440);hitStop=.05;
    u.kx-=Math.cos(dir)*40;u.ky-=Math.sin(dir)*40;
    for(let i=0;i<7;i++){const a=dir+rand(-.3,.3),r=rand(80,135);fxTracer(mx,my,13.5,u.x+Math.cos(a)*r,u.y+Math.sin(a)*r,rand(8,14));}
    for(const z of zeds){
      if(z.dead||z.far)continue;const dz=hyp(z.x-u.x,z.y-u.y);if(dz>135)continue;
      const a=Math.atan2(z.y-u.y,z.x-u.x);if(Math.abs(angDiff(dir,a))>.34&&dz>14)continue;
      if(!los(u.x,u.y,z.x,z.y))continue;
      const crit=dz<60&&Math.random()<.4;hitZ(z,rand(60,85)*(1-dz/135*.5)*(crit?1.8:1),u,a,230,crit);z.stag=Math.max(z.stag,.6);
    }
  }
}
function useAid(){
  if(!L||L.dead||L.aid<=0||L.hp>=L.maxhp)return;
  L.aid--;L.hp=Math.min(L.maxhp,L.hp+70);sfx('heal');floatText(L,'+70',COL.good);
  for(let i=0;i<10;i++)emit(pFire,L.x+rand(-5,5),L.y+rand(-5,5),rand(2,14),0,0,rand(10,30),3,.7,.4,1,.6,.9,0,0,0);
}
function youUpdate(dt){
  if(L.vault){vaultStep(L,dt);L.atk=null;return;}      // halfway through a window: nothing else until you are over the sill
  const u=L;if(u.dead){u.deadT+=dt;return;}
  u.inv=Math.max(0,u.inv-dt);u.hurtT=Math.max(0,u.hurtT-dt);u.shootT+=dt;u.shootCD-=dt;u.dashCD-=dt;u.comboT-=dt;u.wantAtk-=dt;
  if(u.lying){u.spd=0;if(hyp(input.mx,input.my)>.3||input.atkP||input.dashP)getUp();return;}
  if(u.upT>0){u.upT-=dt;const k=ease(1-Math.max(0,u.upT)/.9);u.x=lerp(u.upFrom.x,u.upTo.x,k);u.y=lerp(u.upFrom.y,u.upTo.y,k);u.ang=lerp(-PI/2,-PI/2+.5,k);u.spd=0;if(u.upT<=0){u.upT=0;u.lyingH=0;caption('…what time is it?','You',2200);}return;}
  const mag=Math.min(1,hyp(input.mx,input.my)),moving=mag>.15;
  // dash
  if(input.dashP&&u.dashCD<=0){
    const a=moving?Math.atan2(input.my,input.mx):u.ang;
    u.dashT=.2;u.dashCD=.8;u.dvx=Math.cos(a)*235;u.dvy=Math.sin(a)*235;u.inv=Math.max(u.inv,.3);u.atk=null;u.ang=a;
    sfx('dash');fxDust(u.x,u.y,5);
  }
  if(u.dashT>0){
    u.dashT-=dt;slide(u,u.dvx*dt,u.dvy*dt,5.5);u.spd=235;u.vx=u.dvx*.3;u.vy=u.dvy*.3;
    if(Math.random()<.5)emit(pSmoke,u.x,u.y,2,rand(-8,8),rand(-8,8),6,6,.4,.5,.5,.5,.3,0,2,12);
    return;
  }
  // cranking the valve
  u.anim=null;
  if(EV.channel&&!EV.open&&!u.atk&&!moving&&hyp(u.x-VALVE.x,u.y-VALVE.y)<20){u.anim='crank';u.ang=turn(u.ang,-PI/2,dt*10);}
  // attacks
  if(input.atkP)u.wantAtk=.22;
  u.atkLock=Math.max(0,(u.atkLock||0)-dt);
  if(u.wantAtk>0&&u.atkLock<=0&&(!u.atk||u.atk.t>u.atk.dur*.74)&&u.shootT>.15)startAttack();
  if(u.atk){
    const a=u.atk;a.t+=dt;
    if(!a.swung&&a.t>=a.dur*.16){a.swung=true;sfx('swing');}
    if(!a.hit&&a.t>=a.dur*.3){a.hit=true;meleeResolve(a);}
    if(a.t>=a.dur){u.atk=null;u.comboT=.5;if(a.type===2||(u.melee==='fists'&&a.type===1)){u.atkLock=.3;u.combo=0;}}
  }else if(u.comboT<=0)u.combo=0;
  if((input.shootP||input.shootH)&&u.shootCD<=0&&(u.has.pistol||u.has.shotgun||input.shootP))tryShoot();
  if(u.shootT>1.1&&u.fig.wname!==(u.melee==='fists'?null:u.melee))setWeapon(u.fig,u.melee==='fists'?null:u.melee);
  // movement
  u.slowT=Math.max(0,u.slowT-dt);
  const top=(u.atk?20:u.shootT<.22?26:u.anim==='crank'?0:u.speed)*(u.slowT>0?.5:1);
  const tx=moving?input.mx/mag*top*mag:0,ty=moving?input.my/mag*top*mag:0;
  u.vx=damp(u.vx,tx,16,dt);u.vy=damp(u.vy,ty,16,dt);
  let mx=u.vx+u.kx,my=u.vy+u.ky;
  if(u.lungeT>0){u.lungeT-=dt;mx+=u.lvx;my+=u.lvy;}
  slide(u,mx*dt,my*dt,5.5);
  // push into a broken window and you climb through it
  if(moving&&!u.atk&&u.dashT<=0){const m=hyp(input.mx,input.my)||1,uin=inHouse(u.x,u.y);
    for(const p of PORTALS){if(p.door||!p.open)continue;const n=uin?p.in:p.out,f=uin?p.out:p.in;
      if(Math.abs(p.hz?u.x-p.cx:u.y-p.cy)<(p.hz?p.o.w:p.o.h)/2-3&&Math.abs(p.hz?u.y-p.cy:u.x-p.cx)<14&&((f.x-n.x)*input.mx+(f.y-n.y)*input.my)/m>12){u.vault={t:0,dur:.75,ax:u.x,ay:u.y,bx:f.x,by:f.y,h:7};sfx('step');break;}}}
  const kk=Math.exp(-8*dt);u.kx*=kk;u.ky*=kk;
  u.spd=hyp(u.vx,u.vy);
  if(!u.atk&&u.shootT>.35&&moving&&u.anim!=='crank')u.ang=turn(u.ang,Math.atan2(input.my,input.mx),dt*14);
  u.stepAcc+=u.spd*dt;if(u.stepAcc>19){u.stepAcc=0;sfx('step');if(u.y>176&&u.y<204&&u.y<262){sfx('splash',undefined,undefined,.5);for(let i=0;i<4;i++)emit(pDrop,u.x,u.y,1,rand(-20,20),rand(-20,20),rand(20,40),1.5,.4,.7,.8,.9,.7,200,0,0,2);}}
  // pick things up by walking over them
  for(const it of items){
    if(it.taken)continue;const near=hyp(it.x-u.x,it.y-u.y)<=15;
    if(it.hold){if(!near)it.hold=false;continue;}      // something you just put down: step away before it can be picked up again
    if(!near)continue;
    it.taken=true;scene.remove(it.m);scene.remove(it.g);sfx('pickup');
    if(MELEE[it.kind]){      // a melee weapon: you carry two. A third replaces the one in your hand, which is left where this one lay
      const full=u.bag.length>=2,old=giveMelee(it.kind,it.left);floatText(u,MELEE[it.kind].name.toUpperCase(),COL.good);EV.armed=true;
      if(old)mkItem(old.kind,it.x,it.y,old.left).hold=true;
      if(u.bag.length===2&&!EV.swapTip){EV.swapTip=true;caption('You carry two weapons. SWAP (or Q) changes which is in your hand. They wear out.',null,5200);}
    }
    else if(it.kind==='pistol'){u.has.pistol=true;u.ammo.pistol+=8;floatText(u,'PISTOL · 8 ROUNDS',COL.good);}
    else if(it.kind==='ammo'){u.ammo.pistol+=8;floatText(u,'+8 ROUNDS',COL.good);}
    else if(it.kind==='shotgun'){u.has.shotgun=true;u.ammo.shotgun+=5;floatText(u,'SHOTGUN · 5 SHELLS',COL.good);}
    else if(it.kind==='shells'){u.ammo.shotgun+=4;floatText(u,'+4 SHELLS',COL.good);}
    else if(it.kind==='aid'){u.aid++;floatText(u,'FIRST AID',COL.good);}
  }
}

/* ---- zombies ---- */
function zSense(z){
  const feeding=z.anim==='feed'||z.anim==='bang',sight=feeding?75:z.sight;
  let best=null,bd=1e9;
  for(const h of humans){
    if(h.dead)continue;const d=hyp(h.x-z.x,h.y-z.y);
    if(d>sight||(h.safe&&d>95))continue;
    if(d>26&&!los(z.x,z.y,h.x,h.y))continue;
    const s=d*(h===L?.7:h.recruited?1.3:1);if(s<bd){bd=s;best=h;}
  }
  if(best){
    if(z.state!=='chase'){if(hyp(z.x-L.x,z.y-L.y)<260)sfx(z.ztype==='runner'?'snarl':z.ztype==='brute'?'roar':'groan',z.x,z.y,.9);if(z.boss&&!EV.earl){EV.earl=true;bigText('Big Earl',2200);shake(3);}}
    z.state='chase';z.tgt=best;z.lost=0;if(!best.safe)z.anim=null;
    z.direct=bd<150&&!best.safe&&clearLine(z.x,z.y,best.x,best.y);
  }else if(z.state==='chase'){
    z.direct=false;if(z.track>simT&&z.tgt&&!z.tgt.dead)return;
    z.lost+=.3;if(z.lost>4||!z.tgt||z.tgt.dead){z.state=z.tgt&&!z.tgt.dead?'seek':'idle';z.goal=z.tgt?{x:z.tgt.x,y:z.tgt.y}:null;z.path=null;z.tgt=null;}
  }
}
function zUpdate(z,dt){
  if(z.dead){
    z.deadT+=dt;
    if(z.kx||z.ky){slide(z,z.kx*dt,z.ky*dt,4);const k=Math.exp(-6*dt);z.kx*=k;z.ky*=k;if(Math.abs(z.kx)+Math.abs(z.ky)<3)z.kx=z.ky=0;}
    return;
  }
  const dl=hyp(z.x-L.x,z.y-L.y);
  z.far=dl>540&&!z.script;if(z.far){z.spd=0;return;}
  z.stag=Math.max(0,z.stag-dt);z.atkCD-=dt;
  if(z.kx||z.ky){slide(z,z.kx*dt,z.ky*dt,5);const k=Math.exp(-7*dt);z.kx*=k;z.ky*=k;if(Math.abs(z.kx)+Math.abs(z.ky)<3)z.kx=z.ky=0;}
  if(z.burning){
    z.hp-=4*dt;if(Math.random()<dt*26)emit(pFire,z.x+rand(-3,3),z.y+rand(-3,3),rand(8,18),rand(-6,6),rand(-6,6),rand(18,34),rand(6,10),rand(.3,.6),1,rand(.4,.6),.12,.9,0,.5,-8);
    if(z.hp<=0){killZ(z,null,z.ang+PI,false);return;}
  }
  z.groanT-=dt;if(z.groanT<=0){z.groanT=rand(5,13);if(dl<300)sfx('groan',z.x,z.y,.5);}
  if(z.anim==='tramp'){z.z=Math.abs(Math.sin(simT*3+1))*13;z.spd=0;return;}
  if(z.stag>0){z.spd=0;return;}
  z.senseT-=dt;if(z.senseT<=0&&!z.script){z.senseT=.3;zSense(z);}
  if(z.script&&z.script(z,dt)!==true)return;
  if(z.vault){vaultStep(z,dt);return;}
  if(z.state==='chase'&&z.tgt&&!z.tgt.dead&&!z.tgt.safe&&!z.as&&breach(z,z.tgt,dt,z.speed,true))return;
  if(REST&&z.state==='chase'&&!z.as&&!inRoom(REST,z.x,z.y)){      // you are shut in a house: it goes to the door and pounds on it
    const o=REST.out;if(hyp(o.x-z.x,o.y-z.y)>10){z.anim=null;goTo(z,o.x,o.y,z.speed,dt);}
    else{z.spd=0;z.anim='bang';z.ang=turn(z.ang,Math.atan2(REST.inn.y-o.y,REST.inn.x-o.x),dt*8);z.bangT=(z.bangT||0)-dt;if(z.bangT<=0){z.bangT=rand(.6,.9);if(REST.t>10)REST.hp-=z.ztype==='brute'?45:6;sfx('bang',o.x,o.y,.9);}}      /* the first ten seconds are yours whatever is outside */
    return;
  }
  // attack: wind up (you can see it coming), strike, recover
  if(z.as){
    z.at+=dt;z.spd=0;const t=z.tgt,Z=ZT[z.ztype];
    if(z.as==='wind'){
      if(t)z.ang=turn(z.ang,Math.atan2(t.y-z.y,t.x-z.x),dt*10);
      if(z.ztype==='runner'&&t&&!t.safe){slide(z,Math.cos(z.ang)*z.speed*dt,Math.sin(z.ang)*z.speed*dt,5);z.spd=z.speed;}   // runners don't stop to wind up
      if(z.at>=z.windDur){z.as='strike';z.at=0;z.struck=false;}
    }else if(z.as==='strike'){
      // it throws itself forward; the first person it reaches gets hit. Miss, and it's wide open while it recovers.
      const sp=t&&t.safe?0:Z.lunge*(1-z.at/.3);
      slide(z,Math.cos(z.ang)*sp*dt,Math.sin(z.ang)*sp*dt,5);z.spd=sp*.25;
      if(!z.struck&&t&&!t.dead){const d=hyp(t.x-z.x,t.y-z.y);
        if(t.safe){if(z.at>=.08){z.struck=true;sfx('bang',t.x,t.y,.7);if(t.shakeObj)t.shakeObj.shakeT=.25;}}
        else if(d<=13.5+(z.ztype==='brute'?6:0)){z.struck=true;
          if(hurt(t,rand(Z.dmg[0],Z.dmg[1])*(z.burning?1.4:1),z)){if(t===L)L.slowT=z.ztype==='runner'?.8:.55;if(z.ztype==='brute'){t.kx+=Math.cos(z.ang)*160;t.ky+=Math.sin(z.ang)*160;shake(4);}}}}
      if(z.at>=.24){z.as='rec';z.at=0;}
    }else if(z.at>=z.recDur){z.as=null;z.atkCD=rand(.2,.6);}
    return;
  }
  let tx,ty,speed=0;const t=z.tgt;
  if(z.state==='chase'&&t&&!t.dead){
    const d=hyp(t.x-z.x,t.y-z.y),reach=t.safe?t.safeR:11+(z.ztype==='brute'?5:0);
    if(z.atkCD<=0&&d<=(t.safe?t.safeR:ZT[z.ztype].start)&&(t.safe||z.direct||d<26)){
      z.as='wind';z.at=0;z.ang=Math.atan2(t.y-z.y,t.x-z.x);if(t.safe)z.anim='bang';if(Math.random()<.5)sfx('snarl',z.x,z.y,.7);return;
    }
    if(d<=reach){z.ang=turn(z.ang,Math.atan2(t.y-z.y,t.x-z.x),dt*9);z.spd=0;if(t.safe)z.anim='bang';return;}
    speed=z.speed;
    if(z.direct&&d<150){tx=t.x;ty=t.y;}
    else if(t===L&&flowStep(z.x,z.y,_fs)){tx=_fs.x;ty=_fs.y;}
    else{
      z.repath-=dt;if(z.repath<=0||!z.path){z.repath=rand(.6,1);z.path=findPath(z.x,z.y,t.x,t.y)||[];}
      while(z.path.length&&hyp(z.path[0].x-z.x,z.path[0].y-z.y)<6)z.path.shift();
      if(z.path.length){tx=z.path[0].x;ty=z.path[0].y;}else{tx=t.x;ty=t.y;}
    }
  }else if(z.state==='seek'&&z.goal){
    if(!z.path)z.path=findPath(z.x,z.y,z.goal.x,z.goal.y)||[];
    while(z.path.length&&hyp(z.path[0].x-z.x,z.path[0].y-z.y)<6)z.path.shift();
    if(z.path.length){tx=z.path[0].x;ty=z.path[0].y;speed=z.speed*.8;}else{z.state='idle';z.goal=null;z.path=null;}
  }else if(!z.anim){
    z.wt-=dt;
    if(z.wt<=0){z.wt=rand(3,8);const a=Math.random()*TAU,r=rand(16,44),x=z.x+Math.cos(a)*r,y=z.y+Math.sin(a)*r;if(isFree(x,y,7)&&clearLine(z.x,z.y,x,y))z.wander={x,y};}
    if(z.wander){if(hyp(z.wander.x-z.x,z.wander.y-z.y)<5)z.wander=null;else{tx=z.wander.x;ty=z.wander.y;speed=z.speed*.42;}}
  }
  if(speed>0){
    const dx=tx-z.x,dy=ty-z.y,d=hyp(dx,dy)||1;
    z.ang=turn(z.ang,Math.atan2(dy,dx),dt*(z.ztype==='runner'?10:5));
    const sp=Math.min(speed,d/dt);
    slide(z,Math.cos(z.ang)*sp*dt,Math.sin(z.ang)*sp*dt,5);z.spd=sp;
  }else z.spd=0;
}
/* ---- the shell of your house: walls stop everyone. The front door and the windows are the only ways through.
   A window has to be broken first and is then climbed through; a shut door gets pounded on until it gives. ---- */
let PORTALS=[],REST=null;
const portalOf=o=>PORTALS.find(p=>p.o===o);
function setupPortals(){
  if(!PORTALS.length)for(const o of objs)if(o.home&&(o.kind==='window'||o.kind==='fwin'||o.kind==='door')){
    const hz=o.w>o.h,cx=o.x+o.w/2,cy=o.y+o.h/2,s=hz?(cy<(HS.y0+HS.y1)/2?1:-1):(cx<(HS.x0+HS.x1)/2?1:-1);
    PORTALS.push({o,door:o.kind==='door',cx,cy,hz,gi:hz?{x:cx,y:cy+s*13}:{x:cx+s*13,y:cy},go:hz?{x:cx,y:cy-s*13}:{x:cx-s*13,y:cy}});
  }
  // where you land on each side: the nearest clear floor that is still on that side of the wall
  const land=(g,inside)=>{for(let r=0;r<=44;r+=6){const n=Math.max(1,Math.round(r*.9));for(let k=0;k<n;k++){const a=k/n*TAU,x=g.x+Math.cos(a)*r,y=g.y+Math.sin(a)*r;if(inHouse(x,y)===inside&&isFree(x,y,7))return{x,y};}}return g;};
  for(const p of PORTALS){p.open=false;p.hp=p.door?130:30;p.rattle=0;p.in=land(p.gi,true);p.out=land(p.go,false);if(p.o.glass)p.o.glass.visible=true;}
}
function breakPortal(p,quiet){
  if(!p||p.open)return;p.open=true;p.hp=0;
  if(p.door){EV.doorOpen=true;removeObj(fdoor);if(!quiet){sfx('crash',p.cx,p.cy,1);shake(2);caption('The front door gives way.',null,2600);makeNoise(p.cx,p.cy,160);}}
  else{if(p.o.glass)p.o.glass.visible=false;
    if(!quiet){sfx('glass',p.cx,p.cy,1,700);makeNoise(p.cx,p.cy,200);
      for(let i=0;i<22;i++)emit(pDrop,p.cx+rand(-16,16)*(p.hz?1:.15),p.cy+rand(-16,16)*(p.hz?.15:1),rand(10,20),rand(-30,30),rand(-30,30),rand(0,40),rand(1.2,2.4),rand(.5,1),.8,.9,1,.9,260,0,0,1);
      for(let i=0;i<5;i++)decal(p.in.x+rand(-10,10),p.in.y+rand(-8,8),rand(2,4),.5,0xbfd8e6);}}
}
function hitPortal(p,dmg){if(p.open)return;p.hp-=dmg;p.rattle=.25;sfx('bang',p.cx,p.cy,.8);if(p.hp<=0)breakPortal(p);}
/* walk to a point, round corners if the straight line is blocked */
function goTo(u,x,y,speed,dt){
  let tx=x,ty=y;
  if(!clearLine(u.x,u.y,x,y)){
    if(!u.bp||u.bpT<simT||hyp(u.bpx-x,u.bpy-y)>12){u.bp=findPath(u.x,u.y,x,y);u.bpT=simT+1.5;u.bpx=x;u.bpy=y;u.bi=0;}
    const P=u.bp;if(P&&P.length){while(u.bi<P.length-1&&hyp(P[u.bi].x-u.x,P[u.bi].y-u.y)<8)u.bi++;tx=P[u.bi].x;ty=P[u.bi].y;}
  }
  const dx=tx-u.x,dy=ty-u.y,d=hyp(dx,dy)||1,sp=Math.min(speed,d/dt);
  u.ang=turn(u.ang,Math.atan2(dy,dx),dt*8);slide(u,dx/d*sp*dt,dy/d*sp*dt,5);u.spd=sp;
}
function vaultStep(u,dt){
  const v=u.vault;v.t+=dt;const k=clamp(v.t/v.dur,0,1),e=ease(k);
  u.x=lerp(v.ax,v.bx,e);u.y=lerp(v.ay,v.by,e);u.z=Math.sin(PI*k)*v.h;u.ang=Math.atan2(v.by-v.ay,v.bx-v.ax);u.spd=0;u.vx=u.vy=0;
  if(k>=1){u.z=0;u.vault=null;}
}
/* u wants to reach t on the other side of the house wall. Returns true while it is busy getting through. */
function breach(u,t,dt,speed,bang){
  const uin=inHouse(u.x,u.y),tin=inHouse(t.x,t.y);
  if(uin===tin){if(u.port){u.port=null;if(u.anim==='bang')u.anim=null;}return false;}
  let p=u.port;
  if(!p||(u.portT||0)<simT){let bc=1e9,was=p;p=null;
    for(const q of PORTALS){if(u.doorOnly&&!q.door)continue;if(!bang&&!q.open)continue;
      const n=uin?q.in:q.out,f=uin?q.out:q.in,c=hyp(n.x-u.x,n.y-u.y)+hyp(f.x-t.x,f.y-t.y)+(q.open?0:q.door?q.hp*1.6:55)+(q===was?-25:0);if(c<bc){bc=c;p=q;}}
    u.port=p;u.portT=simT+2;}
  if(!p)return false;
  const n=uin?p.in:p.out,f=uin?p.out:p.in,d=hyp(n.x-u.x,n.y-u.y);
  if(d>6){if(u.anim==='bang')u.anim=null;goTo(u,n.x,n.y,speed,dt);return true;}
  u.ang=turn(u.ang,Math.atan2(f.y-n.y,f.x-n.x),dt*10);u.spd=0;
  if(p.open){if(u.anim==='bang')u.anim=null;u.vault={t:0,dur:p.door?.5:u.kind==='z'?(u.ztype==='runner'?.8:1.5):.75,ax:u.x,ay:u.y,bx:f.x,by:f.y,h:p.door?0:7};u.port=null;}
  else{u.anim='bang';u.bangT=(u.bangT||0)-dt;if(u.bangT<=0){u.bangT=u.ztype==='brute'?.7:rand(.55,.9);hitPortal(p,u.ztype==='brute'?45:u.ztype==='runner'?9:7);}}
  return true;
}
function separate(){
  const zs=zeds.filter(z=>!z.dead&&!z.far&&z.anim!=='tramp');
  for(let i=0;i<zs.length;i++){
    const a=zs[i],ra=a.ztype==='brute'?8:5;
    for(let j=i+1;j<zs.length;j++){
      const b=zs[j],dx=b.x-a.x,dy=b.y-a.y,d=hyp(dx,dy),min=ra+(b.ztype==='brute'?8:5);
      if(d>0&&d<min){const k=(min-d)/2/d,ax=a.x-dx*k,ay=a.y-dy*k,bx2=b.x+dx*k,by2=b.y+dy*k;if(isFree(ax,ay,4.5)){a.x=ax;a.y=ay;}if(isFree(bx2,by2,4.5)){b.x=bx2;b.y=by2;}}
    }
    for(const h of humans){
      if(h.dead||h.safe||(h===L&&(L.dashT>0||L.lying||L.upT>0)))continue;
      const dx=a.x-h.x,dy=a.y-h.y,d=hyp(dx,dy),min=ra+5.5;
      if(d>0&&d<min){const k=(min-d)/d,ax=a.x+dx*k,ay=a.y+dy*k;if(isFree(ax,ay,4.5)){a.x=ax;a.y=ay;}}
    }
  }
  const as=allies.filter(a=>!a.dead);
  for(let i=0;i<as.length;i++){
    const a=as[i];
    for(const b of[L,...as.slice(i+1)]){const dx=a.x-b.x,dy=a.y-b.y,d=hyp(dx,dy);if(d>0&&d<10){const k=(10-d)/d*.5,ax=a.x+dx*k,ay=a.y+dy*k;if(isFree(ax,ay,5))a.x=ax,a.y=ay;}}
  }
}

/* ---- the people who follow you ---- */
function recruit(s){
  s.recruited=true;s.safe=false;s.hidden=false;s.anim=null;s.z=0;s.fig.g.visible=true;
  if(s.exit){s.x=s.exit.x;s.y=s.exit.y;}
  const sp=isFree(s.x,s.y,6)?s:openSpot(s.x,s.y,null,60);if(sp){s.x=sp.x;s.y=sp.y;}
  allies.push(s);rebuildHumans();hudAllies();
  sfx('join');caption(SURV[s.key].line,s.name,4200);speak(s.key,SURV[s.key].line,4);floatText(s,`${s.name.toUpperCase()} JOINED`,COL.ally);
  EV.joinT=simT+9;EV.joinWho=s.name;
  if(!EV.joinTip){EV.joinTip=true;setTimeout(()=>{if(state==='play')caption(`${s.name} follows you and fights on their own. Just keep moving. Their health is under yours.`,null,5600);},4400);}
  for(const z of zeds)if(z.tgt===s)z.anim=null;
}
function survIdle(s,dt){
  // waiting to be rescued
  if(s.shakeObj&&s.shakeObj.shakeT>0){s.shakeObj.shakeT-=dt;s.shakeObj.grp.rotation.z=Math.sin(simT*40)*.02;}
  const dl=hyp(s.x-L.x,s.y-L.y);
  if(dl<420&&!s.hidden){s.yellT-=dt;if(s.yellT<=0){s.yellT=rand(5,8);const t=pick(SURV[s.key].help);if(t)floatText(s,t,COL.ally);}}
  if(s.hold)allyFight(s,dt,true);
  s.senseT-=dt;
  if(s.senseT<=0){
    s.senseT=.3;
    const near=dl<(s.hold?55:80),clearR=s.hold?45:62;
    if(near&&!zeds.some(z=>!z.dead&&hyp(z.x-s.x,z.y-s.y)<clearR))recruit(s);
  }
}
function allyFoe(a){
  let best=null,bd=a.gun&&a.ammo>0?175:64;
  for(const z of zeds){
    if(z.dead||z.far||z.anim==='tramp')continue;const d=hyp(z.x-a.x,z.y-a.y);
    if(d<bd&&los(a.x,a.y,z.x,z.y)){bd=d;best=z;}
  }
  return best;
}
function allyFight(a,dt,hold){
  // returns true when busy fighting
  a.atkCD-=dt;a.shootCD-=dt;a.shootT+=dt;
  const W=MELEE[a.melee];
  if(a.atk){
    a.atk.t+=dt;
    if(!a.atk.hit&&a.atk.t>=a.atk.dur*.35){a.atk.hit=true;const z=a.foe;
      if(z&&!z.dead&&hyp(z.x-a.x,z.y-a.y)<=W.range+6){const dir=Math.atan2(z.y-a.y,z.x-a.x);hitZ(z,rand(W.dmg[0],W.dmg[1])*(a.recruited&&hyp(a.x-L.x,a.y-L.y)<110?1.35:1),a,dir,W.kb,false);sfx('hit',a.x,a.y,.7);
        if(z.dead&&a.key==='walt'&&Math.random()<.6)floatText(a,'FORE!',COL.ally);}}
    if(a.atk.t>=a.atk.dur){a.atk=null;a.atkCD=a.rate*rand(.8,1.2);}
    return true;
  }
  a.senseT-=dt;if(a.senseT<=0||(a.foe&&a.foe.dead)){a.senseT=.25;a.foe=allyFoe(a);}
  const z=a.foe;if(!z||z.dead)return false;
  const d=hyp(z.x-a.x,z.y-a.y),dir=Math.atan2(z.y-a.y,z.x-a.x);
  if(a.gun&&a.ammo>0&&d>24){
    a.ang=turn(a.ang,dir,dt*12);
    if(a.shootCD<=0&&Math.abs(angDiff(a.ang,dir))<.2){
      a.shootCD=rand(.8,1.2);a.shootT=0;a.ammo--;setWeapon(a.fig,'pistol');
      fxMuzzle(a.x+Math.cos(dir)*9,a.y+Math.sin(dir)*9,13.5,dir);sfx('gun',a.x,a.y,.8);makeNoise(a.x,a.y,300);
      if(Math.random()<clamp(.8-d/400,.3,.8)){fxTracer(a.x,a.y,13.5,z.x,z.y,12);hitZ(z,rand(26,34),a,dir,50,false);}
      else fxTracer(a.x,a.y,13.5,z.x+rand(-12,12)+Math.cos(dir)*50,z.y+rand(-12,12)+Math.sin(dir)*50,10);
      if(a.ammo<=0){floatText(a,'OUT OF AMMO',COL.warn);setWeapon(a.fig,a.melee);}
    }
    a.spd=0;return true;
  }
  if(d<=W.range){a.ang=turn(a.ang,dir,dt*12);a.spd=0;if(a.atkCD<=0){a.atk={t:0,dur:W.dur,type:Math.random()<.5?0:1,hit:false};sfx('swing',a.x,a.y,.5);}return true;}
  if(hold)return false;
  if(d<60&&clearLine(a.x,a.y,z.x,z.y)){moveTo(a,z.x,z.y,a.speed,dt);return true;}
  return false;
}
function moveTo(a,tx,ty,speed,dt){
  const dx=tx-a.x,dy=ty-a.y,d=hyp(dx,dy)||1,sp=Math.min(speed,d/dt);
  a.ang=turn(a.ang,Math.atan2(dy,dx),dt*11);
  slide(a,dx/d*sp*dt,dy/d*sp*dt,5);a.spd=sp;
}
const SLOTS=[[-22,13],[-22,-13],[-40,26],[-40,-26],[-56,0]];
function allyUpdate(a,dt,i){
  if(a.vault){vaultStep(a,dt);return;}
  if(a.recruited&&!a.dead&&!a.safe&&!a.hold&&breach(a,L,dt,a.speed,false))return;      // follow you through an open door or a broken window
  if(a.dead){a.deadT+=dt;return;}
  a.hurtT=Math.max(0,a.hurtT-dt);
  if(a.kx||a.ky){slide(a,a.kx*dt,a.ky*dt,5);const k=Math.exp(-8*dt);a.kx*=k;a.ky*=k;}
  const dL=hyp(L.x-a.x,L.y-a.y);
  if(a.medic&&!zeds.some(z=>!z.dead&&!z.far&&z.state==='chase'&&hyp(z.x-L.x,z.y-L.y)<140)){
    a.healAcc=(a.healAcc||0)+dt;if(a.healAcc>1){a.healAcc=0;for(const h of[L,...allies])if(!h.dead&&h.hp<h.maxhp&&hyp(h.x-a.x,h.y-a.y)<90){h.hp=Math.min(h.maxhp,h.hp+3);emit(pFire,h.x,h.y,18,0,0,14,2.5,.7,.4,1,.6,.8,0,0,0);}}
  }
  if(a.shootT>1.2&&a.fig.wname==='pistol'&&a.ammo<=0)setWeapon(a.fig,a.melee);
  if(a.hp<a.maxhp&&!zeds.some(z=>!z.dead&&!z.far&&hyp(z.x-a.x,z.y-a.y)<90))a.hp=Math.min(a.maxhp,a.hp+2*dt);   // catch their breath when it's quiet
  const weak=a.hp<a.maxhp*.35&&dL>30;   // badly hurt: stop picking fights and get back to you
  if(!weak&&dL<170&&allyFight(a,dt,false))return;
  if(dL>=170)a.foe=null;
  // fall in behind you
  const s=SLOTS[i%SLOTS.length],ca=Math.cos(L.ang),sa=Math.sin(L.ang);
  let sx=L.x+ca*s[0]-sa*s[1],sy=L.y+sa*s[0]+ca*s[1];
  if(!isFree(sx,sy,6)||!clearLine(L.x,L.y,sx,sy)){sx=L.x-ca*14;sy=L.y-sa*14;}
  const d=hyp(sx-a.x,sy-a.y);
  if(d>9){
    let tx=sx,ty=sy;
    if(!clearLine(a.x,a.y,tx,ty)&&flowStep(a.x,a.y,_fs)){tx=_fs.x;ty=_fs.y;}
    moveTo(a,tx,ty,d>80?a.speed*1.3:d>26?a.speed*1.05:a.speed*.55,dt);
  }else{a.spd=0;a.ang=turn(a.ang,L.ang,dt*4);}
  // never get left behind for good
  if(dL>380){a.far+=dt;if(a.far>3){const sp=openSpot(L.x-ca*30,L.y-sa*30,null,60);if(sp){a.x=sp.x;a.y=sp.y;a.far=0;}}}else a.far=0;
}
function civUpdate(c,dt){
  if(c.dead){
    c.deadT+=dt;
    if(c.turnT>0){c.turnT-=dt;if(c.turnT<=0){const z=mkZed('shambler',c.x,c.y,{state:'idle'});if(z){z.stag=1;sfx('groan',c.x,c.y,1);}c.gone=true;removeFig(c.fig);}}
    return;
  }
  if(!c.path||!c.path.length){c.gone=true;removeFig(c.fig);return;}
  const p=c.path[0];if(hyp(p.x-c.x,p.y-c.y)<8){c.path.shift();return;}
  moveTo(c,p.x,p.y,c.speed,dt);
}
