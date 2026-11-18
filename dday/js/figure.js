"use strict";
/* People in 3D. Bryan chose stylized soldiers designed here over downloaded realistic ones ("I'd rather have stylized ones
   that you design yourself"). Each person is ONE skinned mesh built from rounded blocks: rigid parts on a 21-bone skeleton,
   colours per vertex (skin, hair, uniform and team colour come from the material, so one geometry serves many people), and
   a rim of cool light so they read against the dark ground. The squad wears helmets with a glowing team strobe, plate
   carriers, packs and knee pads; the hostiles caps and chest rigs (helmets and vests once the base reaches Alert II); the
   prisoners grey jumpsuits; the scientists white coats.
   Animation is code, not keyframes: a walk cycle whose feet stay planted (leg IK), the rifle held in both hands wherever the
   pose puts it (arm IK to the grips), and a pose for everything the game makes a man do: sneak, run, aim and recoil, kneel in
   cover, lean out, vault, crawl, lie downed or dead, carry and be carried, throw, fire the RPG, revive, give up, cower, be
   grabbed in a takedown, man a mounted gun, climb, sit in the dinghy.
   Frame: x forward, y up, z to his right (the unit faces +x in its group, which syncUnits turns to u.ang). 1 unit = 10 cm. */

const FB=[   // bones: name, parent, rest offset from the parent
  ['root',-1,[0,0,0]],['hips',0,[0,9,0]],['spine',1,[0,.9,0]],['chest',2,[0,2.4,0]],['neck',3,[0,3.0,0]],['head',4,[0,.8,0]],
  ['clavL',3,[0,2.2,-1.1]],['armL',6,[0,.1,-1.15]],['foreL',7,[0,-3.0,0]],['handL',8,[0,-2.7,0]],
  ['clavR',3,[0,2.2,1.1]],['armR',10,[0,.1,1.15]],['foreR',11,[0,-3.0,0]],['handR',12,[0,-2.7,0]],
  ['thighL',1,[0,-.4,-1.0]],['shinL',14,[0,-4.0,0]],['footL',15,[0,-3.8,0]],
  ['thighR',1,[0,-.4,1.0]],['shinR',17,[0,-4.0,0]],['footR',18,[0,-3.8,0]],
  ['gun',3,[2.4,.2,.8]],
];
const BI={};FB.forEach((b,i)=>BI[b[0]]=i);
const FB_REST=[];FB.forEach(([,p,o],i)=>{FB_REST[i]=p<0?o.slice():o.map((v,k)=>v+FB_REST[p][k]);});
const LEG=[4.0,3.8],ARM=[3.0,2.7],ANKLE=.8;
const FIG_GEO=new Map();   // built geometries by look (shared by everyone who looks the same)
const extraFigs=[];        // people drawn and animated who aren't units (Level 1's wounded scout)

/* ---------- building blocks ---------- */
const FC=h=>{const c=new T.Color(h);c.convertSRGBToLinear();return[c.r,c.g,c.b];};
// a block with rounded edges: w along x, h along y, d along z (3 segments a side; the inner grid lines moved to the rounding)
function rbox(w,h,d,r){
  if(r<.12||Math.min(w,h,d)<.5)return new T.BoxGeometry(w,h,d);   // (small bits: a plain box is plenty, and a ninth of the triangles)
  r=Math.max(.001,Math.min(r,w/2-.01,h/2-.01,d/2-.01));
  const g=new T.BoxGeometry(w,h,d,3,3,3),p=g.attributes.position,n=g.attributes.normal,hw=w/2,hh=h/2,hd=d/2;
  const rm=(v,e)=>Math.abs(v)<e-1e-4?Math.sign(v)*(e-r):v;
  for(let i=0;i<p.count;i++){
    const x=rm(p.getX(i),hw),y=rm(p.getY(i),hh),z=rm(p.getZ(i),hd);
    const cx=clamp(x,-hw+r,hw-r),cy=clamp(y,-hh+r,hh-r),cz=clamp(z,-hd+r,hd-r);
    let dx=x-cx,dy=y-cy,dz=z-cz;const l=Math.hypot(dx,dy,dz)||1;dx/=l;dy/=l;dz/=l;
    p.setXYZ(i,cx+dx*r,cy+dy*r,cz+dz*r);n.setXYZ(i,dx,dy,dz);
  }
  return g;
}
const cyl=(rt,rb,h,s=8)=>new T.CylinderGeometry(rt,rb,h,s);
const dome=(r,s=12,rows=5)=>new T.SphereGeometry(r,s,rows,0,Math.PI*2,0,Math.PI/2);
const ball=(r,s=10,rows=7)=>new T.SphereGeometry(r,s,rows);
const ALONG_X=[0,0,Math.PI/2];   // a cylinder turned to lie along x
const GUN_S=1.15;   // weapons a little bigger than life, so they read on a phone

/* ---------- looks ---------- */
const COL={
  vest:'#3c4636',pouch:'#4c5540',web:'#2b2f27',pad:'#2a2e29',boot:'#2b2520',glove:'#202326',helm:'#4a5444',dark:'#18191b',
  pack:'#465040',packD:'#384034',gaiter:'#323830',metal:'#2a2c2f',fde:'#7a6a50',black:'#2e3033',
  rig:'#2c2b27',scarf:'#7c6e57',cap:'#2a2a28',red:'#9e2f27',eboot:'#2a2420',ehelm:'#3b3a32',evest:'#33332c',wood:'#7a4a28',
  shoe:'#3a3c3e',trouser:'#2b2f36',shirt:'#8fa6c4',tie:'#5a2f3a',olive:'#4a4f38',
};
const SKINS=['#e3b896','#c99268','#a06a45','#74472b','#d6a07a'],HAIRS=['#1a1410','#3a2a1c','#6b5a44','#2b2b2b'];
const ECLOTH=['#6e6450','#5f6048','#4f4b42','#6a5a48'];
function seedOf(u){let s=7;for(const ch of u.id+u.name)s=(s*31+ch.charCodeAt(0))|0;return s;}   // (the same as the card portraits, so skin tones match)
// what someone wears and carries; the geometry key is built from it
function figLook(u){
  const r=rng(seedOf(u)),skin=SKINS[(r()*5)|0];r();   // (the portrait draws the helmet colour next)
  const k=u.kind==='sci'?'sci':u.kind==='prisoner'?'pri':u.side==='E'?'en':'sq';
  const L={k,skin,hair:HAIRS[(r()*4)|0],cloth:u.cloth||(k==='sq'?'#5d6b58':k==='pri'?'#7d8184':k==='sci'?'#d8dcd6':ECLOTH[(r()*4)|0]),hat:(r()*3)|0,team:teamCol(u)};   // (u.cloth: the dead in the tunnel, their own clothes: tunnel.js)
  return L;
}
// the weapon and gear he has right now (the key changes when he picks up the sniper rifle, a freed man finds a rifle, the
// silencer wears out, the base goes to Alert II...)
function figKitKey(u,L){
  let w='none';
  if(L.k==='sq'&&u.atEase)w='none';   // (off duty in the barracks, his gun on his bunk: ddmeta.js)
  else if(L.k==='sq')w=u.weapon==='hmg'?'hmg':u.weapon==='sniper'?'sniper':u.weapon==='shotgun'?'shotgun':(u.weapon==='m4s'&&(u.sil??1)>0?'m4s':'m4');   // (the silencer on the muzzle: a silenced rifle, or the silencer item while it lasts)
  else if(L.k==='en')w=u.noGun?'none':u.weapon==='sniper'||(u.post&&/sniper/i.test(u.name||''))?'sniper':'ak';
  else if(L.k==='pri')w=u.weapon?(u.weapon==='sniper'?'sniper':'ak'):'none';
  // D-Day (Version 190): 1944's guns in their hands, not the horror game's: the M1 Garand for a rifle, the BAR for the gunner, the Springfield's wood
  // for the sharpshooter (the 'sniper' model on D-Day), the Kar98k for the Germans (the weapons themselves, and how they fire, are as they were)
  if(typeof MAPID!=='undefined'&&MAPID==='dd'){if(w==='m4'||w==='m4s')w='m1';else if(w==='hmg')w='bar';else if(w==='ak')w='kar';}
  const helm=L.k==='en'&&(u.gunner||u.helm||(typeof alertStage==='function'&&alertStage()>=2));
  const role=L.k==='sq'?(u.id==='A1'?'lead':u.id==='B2'||u.spec==='med'?'med':u.id==='B1'?'mg':''):'';
  return`${L.k}|${w}|${helm?'h':''}${u.radio?'r':''}${u.gl&&(w==='m4'||w==='m4s'||w==='m1')?'g':''}${typeof MAPID!=='undefined'&&MAPID==='dd'?'S':''}|${L.k==='en'?(helm?3:L.hat):0}|${role}`;   // (g: an M203 under the rifle, Level 4's find)
}

/* ---------- the parts ---------- */
function figParts(key){
  const [k,w,flags,hatS,role]=key.split('|'),hat=+hatS,helm=flags.includes('h'),radio=flags.includes('r'),gl=flags.includes('g');
  const out=[],E=new T.Euler(),Q=new T.Quaternion(),V=new T.Vector3(),S=new T.Vector3(1,1,1);
  // add(bone, geometry, colour, kind, x,y,z, [rx,ry,rz], [sx,sy,sz]); kind: 0 colour as given, 1 skin, 2 team colour (glows), 9 team colour as paint,
  // 3 hair, 4 gun metal, 5 gun furniture, 7 lamp lens, 8 uniform (the colour multiplies the person's cloth colour)
  const add=(b,g,col,mid,x=0,y=0,z=0,rot,sc)=>{E.set(...(rot||[0,0,0]),'YZX');Q.setFromEuler(E);V.set(x,y,z);if(sc)S.set(...sc);else S.set(1,1,1);
    out.push({b:BI[b],g,c:FC(col),mid,m:new T.Matrix4().compose(V,Q,S)});};
  const sq=k==='sq',en=k==='en',civ=k==='pri'||k==='sci',sci=k==='sci',W='#ffffff',Wd='#c9c9c9';
  // D-Day (the 'S' flag, Version 190): 1944 kit, not the horror game's: our men in M1 helmets with the team's colour painted on the back, the field jacket,
  // webbing (suspenders, a cartridge belt), canvas leggings and bare hands, no plate carrier, strobe, night-vision mount or ear defenders; the Germans in
  // the Stahlhelm with its flared skirt, Y-straps, cartridge pouches and the gas-mask canister, no armband or vest. The stocky build is kept (STOCKY).
  const dd=flags.includes('S'),ddS=dd&&sq,ddE=dd&&en,WEB='#6e6748',JK='#e4e4e4';
  // legs
  for(const s of[-1,1]){const S_=s<0?'L':'R';
    if(sci){add('thigh'+S_,cyl(1.02,.84,4.2),COL.trouser,0,0,-2,0);add('shin'+S_,cyl(.82,.7,3.9),COL.trouser,0,0,-1.95,0);}
    else{add('thigh'+S_,cyl(1.14,.9,4.2),W,8,0,-2,0);add('shin'+S_,cyl(.9,.74,3.9),W,8,0,-1.95,0);}
    if(sq||en)add('thigh'+S_,rbox(.55,1.25,.95,.18),Wd,8,.05,-1.9,s*.95);   // cargo pocket
    if(ddS)add('shin'+S_,cyl(.94,.84,1.75,8),'#958a66',0,0,-2.95,0);       // canvas leggings
    else if(sq)add('shin'+S_,rbox(.8,1.2,1.15,.3),COL.pad,0,.62,-.12,0);      // knee pad
    if(sq&&s>0)add('thigh'+S_,rbox(.95,1.5,.55,.18),COL.web,0,.15,-1.3,1.05); // holster
    const shoe=sq?COL.boot:en?COL.eboot:sci?'#1d1d1f':COL.shoe;
    add('foot'+S_,rbox(civ?2.3:2.6,civ?.85:1.05,civ?1.1:1.25,.32),shoe,0,.5,-.38,0);
    add('foot'+S_,cyl(.74,.78,civ?.6:1.1),shoe,0,0,civ?0:.22,0);
  }
  // hips, belly, chest
  add('hips',rbox(2.4,1.9,3.2,.5),W,8,0,-.35,0);
  if(sci){add('hips',cyl(1.95,2.35,3.4,12,1),W,8,0,-1.5,0);}   // the lab coat's skirts
  if(sq||en){add('hips',rbox(2.55,.6,3.35,.25),ddS?WEB:COL.web,0,0,.55,0);add('hips',rbox(.85,1.0,1.1,.25),sq?COL.pouch:COL.rig,0,-1.05,.25,0);}
  if(ddS)for(const z of[-1.2,-.55,.55,1.2])add('hips',rbox(.4,.62,.56,.1),WEB,0,1.38,.5,z);        // the cartridge belt's pockets
  if(ddE){for(const z of[-1.35,-.95,-.55,.55,.95,1.35])add('hips',rbox(.42,.6,.38,.1),'#2c2620',0,1.38,.52,z);   // cartridge pouches either side of the buckle
    add('hips',cyl(.44,.44,1.7,10),'#5d6555',0,-1.15,-.2,1.25,[0,0,.35]);}                         // the gas-mask canister
  add('spine',rbox(2.1,2.6,2.9,.6),W,8,0,1.2,0);
  add('chest',rbox(2.4,3.2,3.3,.75),W,8,0,1.3,0);
  const vest=!dd&&(sq||(en&&helm));
  if(vest){const vc=sq?COL.vest:COL.evest;
    add('spine',rbox(2.65,1.5,3.25,.45),vc,0,0,1.25,0);               // cummerbund
    add('chest',rbox(3.0,3.0,3.45,.55),vc,0,0,1.15,0);                // plate carrier
    for(const z of[-.95,0,.95])add('chest',rbox(.75,1.15,.82,.22),sq?COL.pouch:COL.rig,0,1.65,.25,z);   // magazine pouches
    add('chest',rbox(.9,1.3,.75,.25),sq?COL.pouch:COL.rig,0,-.2,.9,-1.95);   // radio pouch
  }else if(dd&&(sq||en)){
    add('spine',rbox(2.45,1.5,3.15,.45),JK,8,0,1.25,0);               // the field jacket, cut full (the stocky build)
    add('chest',rbox(2.75,2.95,3.4,.6),JK,8,0,1.2,0);
    for(const s of[-1,1])add('chest',rbox(.1,2.75,.32,.04),ddS?WEB:'#2c2620',0,1.42,1.2,s*(ddS?.75:.62),ddE?[s*.2,0,0]:null);   // suspenders; the German Y-straps
  }else if(en){
    add('chest',rbox(1.1,1.7,3.0,.3),COL.rig,0,1.25,.45,0);           // chest rig
    for(const z of[-.8,0,.8])add('chest',rbox(.6,1.0,.72,.18),COL.rig,0,1.85,.5,z);
    for(const s of[-1,1])add('chest',rbox(2.9,.28,.55,.1),COL.rig,0,0,2.55,s*1.0);   // straps
  }else if(k==='pri'){
    add('chest',rbox(.1,.7,1.1,.04),COL.dark,0,1.22,1.7,.6);           // the stencilled number
  }else if(sci){
    add('chest',rbox(.1,1.5,.9,.04),COL.shirt,0,1.22,1.75,0);         // shirt in the coat's V
    add('chest',rbox(.14,1.25,.3,.05),COL.tie,0,1.3,1.6,0);
    add('chest',rbox(.1,.55,.4,.03),'#e8e8e0',0,1.22,1.4,.95);        // ID badge
  }
  if(dd&&(sq||en))for(const s of[-1,1])add('clav'+(s<0?'L':'R'),rbox(1.3,.95,1.5,.4),JK,8,0,-.05,s*.15);   // the jacket's shoulders
  else if(sq||(en&&helm))for(const s of[-1,1])add('clav'+(s<0?'L':'R'),rbox(1.3,.95,1.5,.4),sq?COL.vest:COL.evest,0,0,-.05,s*.15);   // shoulder straps
  // the pack, or the radio
  if(sq){
    add('chest',rbox(1.7,3.1,2.7,.5),role==='mg'?COL.olive:COL.pack,0,-2.25,1.25,0);
    add('chest',rbox(1.8,.6,2.8,.25),COL.packD,0,-2.25,2.85,0);
    if(!dd)add('chest',rbox(.14,.4,1.7,.06),W,2,-3.12,2.15,0);         // team stripe (glows)
    if(role==='med'){add('chest',rbox(.12,.9,.3,.03),'#c8302a',0,-3.12,1.2,0);add('chest',rbox(.12,.3,.9,.03),'#c8302a',0,-3.12,1.2,0);}   // a red cross
    if(role==='lead')add('chest',cyl(.07,.07,5.5,4),COL.dark,0,-2.6,5.0,-.9,[0,0,-.12]);   // the team leader's radio antenna
    if(role==='mg')add('chest',rbox(1.0,1.0,1.0,.2),COL.olive,0,-2.4,-.4,1.2);              // spare ammo
  }
  if(radio){add('chest',rbox(1.5,2.6,2.4,.35),COL.olive,0,-2.1,1.1,0);add('chest',cyl(.08,.08,6.5,4),COL.dark,0,-2.5,5.2,-.8,[0,0,-.1]);}
  // neck and head
  add('neck',cyl(.8,.95,1.1),ddS?'#ffffff':sq?COL.gaiter:en?COL.scarf:'#ffffff',(sq&&!dd)||en?0:1,0,.35,0);
  if(en)add('neck',cyl(1.15,1.3,.9),COL.scarf,0,0,-.1,0);
  add('head',rbox(2.25,2.4,2.05,.85),W,1,.15,1.05,0);
  for(const s of[-1,1])add('head',rbox(.18,.26,.5,.06),COL.dark,0,1.27,1.2,s*.45);   // eyes
  if(!sq||dd)for(const s of[-1,1])add('head',rbox(.5,.7,.25,.1),Wd,1,.05,1.0,s*1.05);   // ears
  if(ddS){
    add('head',dome(1.68,14,5),COL.helm,0,0,1.38,0,null,[1.16,.9,1.16]);                    // the M1 helmet: a round, wide dome
    add('head',cyl(1.99,2.08,.16,16),COL.helm,0,0,1.4,0);                                     // ...its rim
    add('head',rbox(.08,.36,.82,.04),W,9,-1.71,2.14,0,[0,0,-.64]);                          // the team's colour painted on the back (kind 9: matte, no glow)
    for(const s of[-1,1])add('head',rbox(.14,1.2,.14,.04),WEB,0,.42,.82,s*1.1,[s*.12,0,0]); // the chinstrap
  }else if(sq){
    add('head',dome(1.68,12,5),COL.helm,0,-.05,1.38,0,null,[1.1,.95,1.08]);   // helmet
    add('head',rbox(.55,.5,.75,.15),COL.dark,0,1.62,2.0,0);                  // night-vision mount
    add('head',rbox(.5,.42,.42,.12),W,2,-1.62,2.15,0);                         // IR strobe (glows)
    for(const s of[-1,1])add('head',cyl(.4,.4,.3,10),'#3a4236',0,0,.95,s*1.08,[Math.PI/2,0,0]);   // ear protection
  }else if(ddE){
    add('head',figStahlhelm(),'#4f554d',0,.05,1.48,0,[0,0,.16]);                             // the Stahlhelm, tipped back so its visor clears the eyes
  }else if(en){
    if(hat===3){add('head',dome(1.6,12,5),COL.ehelm,0,-.05,1.45,0,null,[1.08,.9,1.06]);}
    else if(hat===1){add('head',dome(1.42,10,5),COL.cap,0,-.05,1.7,0,null,[1.05,1.05,1.05]);}   // beanie
    else{add('head',dome(1.42,10,5),COL.cap,0,-.05,1.72,0,null,[1.05,.75,1.05]);add('head',rbox(1.25,.14,1.5,.06),COL.cap,0,1.3,1.78,0);}   // cap and brim
    if(hat===2)add('head',rbox(.9,1.0,2.0,.4),COL.scarf,0,.95,.35,0);       // shemagh over the face
  }else{
    add('head',dome(1.28,10,4),W,3,0,1.95,0,null,[1.12,.62,1.08]);          // hair
    if(sci)add('head',rbox(.2,.26,1.55,.05),'#111111',0,1.28,1.22,0);       // glasses
  }
  // arms
  for(const s of[-1,1]){const S_=s<0?'L':'R';
    add('arm'+S_,cyl(.8,.7,3.1),W,8,0,-1.5,0);
    if(sq)add('arm'+S_,rbox(.95,.8,.14,.05),W,2,0,-1.0,s*.78);                // team patch (glows)
    if(en&&s<0&&!dd)add('arm'+S_,cyl(.84,.84,.55),COL.red,0,0,-.95,0);       // red armband
    add('fore'+S_,cyl(.7,.6,2.7),W,8,0,-1.35,0);
    if(sq&&!dd)add('fore'+S_,rbox(.85,.85,.9,.3),COL.pad,0,-.35,-.15,0);     // elbow pad
    add('hand'+S_,rbox(.72,1.05,.62,.25),sq&&!dd?COL.glove:'#ffffff',sq&&!dd?0:1,0,-.5,0);
  }
  // the weapon (the gun bone: receiver at 0, barrel along +x)
  const G=(g,c,mid,x,y,z,rot,sc)=>add('gun',g,c,mid,x,y,z,rot,sc);
  if(w==='m4'||w==='m4s'){
    G(rbox(3.0,.95,.58,.15),COL.metal,4,.55,0,0);G(rbox(1.9,.85,.52,.2),COL.fde,5,-1.95,-.2,0,[0,0,-.08]);G(cyl(.2,.2,1.2),COL.metal,4,-.85,.08,0,ALONG_X);
    G(rbox(.42,1.05,.45,.12),COL.fde,5,-.1,-.85,0,[0,0,-.35]);G(rbox(.55,1.45,.42,.1),COL.metal,4,.75,-1.05,0,[0,0,-.18]);
    G(rbox(2.2,.78,.72,.2),COL.fde,5,3.0,-.02,0);G(cyl(.13,.13,1.4,6),COL.metal,4,4.75,.05,0,ALONG_X);
    G(rbox(.9,.5,.42,.12),COL.metal,4,.75,.75,0);G(cyl(.2,.2,.8),COL.metal,4,3.35,-.15,.45,ALONG_X);G(cyl(.16,.16,.06),W,7,3.77,-.15,.45,ALONG_X);
    if(w==='m4s')G(cyl(.28,.28,2.1),COL.metal,4,5.9,.05,0,ALONG_X);           // the silencer
    if(gl){G(cyl(.34,.34,2.0,10),COL.metal,4,3.05,-.72,0,ALONG_X);G(rbox(.36,.62,.3,.08),COL.metal,4,1.75,-1.1,0,[0,0,-.2]);}   // an M203 under the handguard, its trigger
  }else if(w==='m1'){   // D-Day: the M1 Garand: a one-piece walnut stock with its upper handguard, the receiver, the barrel and its front sight; with rifle grenades, the M7 launcher on the muzzle and a grenade on it
    const wd=COL.wood;
    G(rbox(2.4,1.0,.5,.2),wd,5,-2.15,-.3,0,[0,0,-.1]);G(rbox(1.0,.72,.48,.16),wd,5,-.55,-.22,0,[0,0,-.06]);G(rbox(1.9,.66,.5,.12),COL.metal,4,.6,.1,0);
    G(rbox(2.7,.62,.52,.18),wd,5,2.55,-.12,0);G(rbox(1.9,.3,.42,.1),wd,5,2.7,.3,0);G(cyl(.13,.13,2.0,6),COL.metal,4,4.85,.12,0,ALONG_X);
    G(rbox(.18,.42,.16,.04),COL.metal,4,5.7,.36,0);G(rbox(.32,.32,.32,.06),COL.metal,4,1.15,.52,0);G(rbox(.62,.3,.42,.08),COL.metal,4,.35,-.52,0);
    G(rbox(.16,.7,.56,.04),COL.metal,4,3.85,-.02,0);
    if(gl){G(cyl(.2,.2,1.3,8),COL.metal,4,6.3,.12,0,ALONG_X);G(cyl(.42,.3,1.0,8),COL.olive,5,7.2,.12,0,ALONG_X);}
  }else if(w==='bar'){   // D-Day: the Browning Automatic Rifle: a wooden butt, a long squared receiver, the box magazine under it, the wooden fore-end, a heavy barrel with its gas tube, the flash hider and a folded bipod
    const wd=COL.wood;
    G(rbox(2.3,1.0,.55,.2),wd,5,-2.3,-.28,0,[0,0,-.08]);G(rbox(3.3,1.0,.62,.15),COL.metal,4,.6,0,0);G(rbox(.78,1.15,.5,.08),COL.metal,4,.85,-1.0,0);
    G(rbox(.45,1.0,.46,.12),wd,5,-.55,-.8,0,[0,0,-.3]);G(rbox(1.7,.78,.62,.2),wd,5,3.0,-.1,0);G(cyl(.17,.17,3.0),COL.metal,4,5.0,.08,0,ALONG_X);
    G(cyl(.11,.11,2.0,6),COL.metal,4,4.3,-.28,0,ALONG_X);G(cyl(.23,.2,.55,8),COL.metal,4,6.75,.08,0,ALONG_X);
    for(const s of[-1,1])G(rbox(2.0,.14,.14,.04),COL.metal,4,4.7,-.42,s*.2,[0,s*.06,0]);
  }else if(w==='kar'){   // D-Day: the Kar98k: a long wooden stock right up under the barrel, the bolt handle turned down, the bands, the front sight
    const wd='#6a4428';
    G(rbox(2.4,1.05,.5,.2),wd,5,-2.2,-.3,0,[0,0,-.1]);G(rbox(1.0,.72,.46,.16),wd,5,-.55,-.22,0,[0,0,-.06]);G(rbox(1.6,.62,.46,.1),COL.metal,4,.55,.08,0);
    G(rbox(3.4,.6,.5,.18),wd,5,2.8,-.12,0);G(cyl(.12,.12,1.5,6),COL.metal,4,5.2,.1,0,ALONG_X);G(rbox(.16,.38,.14,.04),COL.metal,4,5.85,.3,0);
    G(cyl(.07,.07,.62,5),COL.metal,4,.3,.1,.38,[Math.PI/2,0,0]);G(rbox(.24,.24,.24,.06),COL.metal,4,.3,.02,.7);G(rbox(.6,.3,.4,.08),COL.metal,4,.3,-.5,0);
    for(const x of[2.2,4.2])G(rbox(.16,.7,.56,.04),COL.metal,4,x,-.08,0);
  }else if(w==='hmg'){
    G(rbox(3.6,1.25,.85,.2),COL.metal,4,.6,0,0);G(rbox(2.3,1.05,.6,.25),COL.black,5,-2.3,-.15,0);G(rbox(.45,1.05,.5,.12),COL.black,5,-.3,-.95,0,[0,0,-.35]);
    G(cyl(.21,.21,4.4),COL.metal,4,4.8,.1,0,ALONG_X);G(rbox(1.3,.28,.28,.08),COL.metal,4,3.1,.85,0);G(rbox(2.0,.2,.22,.06),COL.metal,4,4.4,-.35,0);
    G(rbox(1.3,1.25,.9,.15),COL.olive,5,.7,-.95,-.65);G(rbox(1.5,.35,.8,.1),COL.metal,4,.6,.78,0);
  }else if(w==='sniper'){   // (on D-Day the wood the Springfield's is, ours too: flags 'S')
    const sw=en||flags.includes('S')?COL.wood:COL.fde;
    G(rbox(3.0,.85,.55,.14),COL.metal,4,.5,0,0);G(rbox(2.7,1.15,.55,.25),sw,5,-2.1,-.25,0);G(rbox(1.2,.35,.6,.12),sw,5,-1.7,.45,0);
    G(rbox(.42,1.0,.45,.12),COL.black,5,-.1,-.8,0,[0,0,-.35]);G(cyl(.16,.16,4.8),COL.metal,4,4.4,.05,0,ALONG_X);
    G(cyl(.32,.32,2.6,10),COL.dark,4,.6,.95,0,ALONG_X);G(cyl(.42,.36,.5,10),COL.dark,4,1.95,.95,0,ALONG_X);G(cyl(.36,.4,.4,10),COL.dark,4,-.75,.95,0,ALONG_X);
    G(rbox(.6,.9,.42,.1),COL.metal,4,.6,-.75,0);for(const s of[-1,1])G(rbox(.15,1.6,.15,.05),COL.metal,4,2.6,-.75,s*.25,[s*.25,0,.15]);
  }else if(w==='shotgun'){   // a pump shotgun (Assault: classes.js): black furniture, a tube magazine under the barrel, the pump on it
    G(rbox(2.5,.95,.58,.15),COL.metal,4,.45,0,0);G(rbox(2.2,.9,.5,.2),COL.black,5,-2.0,-.25,0,[0,0,-.1]);G(rbox(.42,1.0,.45,.12),COL.black,5,-.1,-.85,0,[0,0,-.35]);
    G(cyl(.18,.18,4.3),COL.metal,4,3.75,.18,0,ALONG_X);G(cyl(.15,.15,3.3),COL.metal,4,3.2,-.22,0,ALONG_X);G(rbox(1.5,.6,.62,.22),COL.black,5,2.7,-.2,0);
    G(rbox(.18,.22,.18,.05),COL.metal,4,5.8,.42,0);
  }else if(w==='ak'){
    G(rbox(3.0,.9,.56,.12),COL.metal,4,.5,0,0);G(rbox(2.3,.8,.46,.2),COL.wood,5,-1.95,-.38,0,[0,0,-.13]);G(rbox(.42,1.0,.45,.12),COL.wood,5,-.15,-.85,0,[0,0,-.3]);
    G(rbox(1.8,.78,.66,.25),COL.wood,5,2.4,-.05,0);G(rbox(1.6,.3,.35,.1),COL.metal,4,2.4,.45,0);G(cyl(.13,.13,1.9,6),COL.metal,4,4.3,0,0,ALONG_X);
    G(rbox(.2,.5,.2,.05),COL.metal,4,4.6,.3,0);G(rbox(.62,1.0,.45,.12),COL.metal,4,.95,-.95,0,[0,0,.15]);G(rbox(.62,.9,.45,.12),COL.metal,4,1.3,-1.75,0,[0,0,.45]);
  }
  return out;
}
// the German helmet (D-Day, Version 190): a lathe of its profile, from the skirt's edge up to the crown: the skirt flared out over the ears and neck, the
// step where it meets the dome, the dome (made fresh each time: figGeometry disposes what it merges)
function figStahlhelm(){
  const P=[[1.98,-.42],[1.9,-.3],[1.76,-.12],[1.66,0],[1.62,.08],[1.68,.18],[1.7,.42],[1.64,.72],[1.48,1.02],[1.2,1.28],[.82,1.44],[.4,1.52],[.001,1.55]];
  return new T.LatheGeometry(P.map(([r,y])=>new T.Vector2(r,y)),14);
}
// the grips (where his wrists go, in the gun's frame) and the back of the stock, per weapon
const GRIP={m4:{R:[-.3,-.45,.22],L:[2.9,-.5,-.25],butt:-2.9},m4s:{R:[-.3,-.45,.22],L:[2.9,-.5,-.25],butt:-2.9},hmg:{R:[-.45,-.55,.25],L:[2.3,-.75,-.3],butt:-3.4},
  sniper:{R:[-.3,-.45,.22],L:[2.6,-.5,-.25],butt:-3.4},shotgun:{R:[-.3,-.45,.22],L:[2.7,-.45,-.25],butt:-3.1},ak:{R:[-.3,-.5,.22],L:[2.4,-.5,-.25],butt:-3.1},m1:{R:[-.3,-.45,.22],L:[2.6,-.45,-.25],butt:-3.25},bar:{R:[-.45,-.55,.25],L:[2.5,-.6,-.3],butt:-3.4},kar:{R:[-.3,-.45,.22],L:[2.5,-.45,-.25],butt:-3.3},none:{R:[-.3,-.45,.22],L:[2.6,-.5,-.25],butt:-2.9}};
// the D-Day test's build (Bryan, of the three drafts: "Let's go with stocky for now"): each bone's parts made thicker (a limb
// runs along its bone's y), the head, hands and boots bigger; ddplay.js makes the whole man a little wider than tall on top
const STOCKY={head:[1.5,1.5,1.5],neck:[1.3,1,1.3],arm:[1.45,1,1.45],fore:[1.45,1,1.45],hand:[1.55,1.4,1.55],thigh:[1.4,1,1.38],shin:[1.45,1,1.45],foot:[1.3,1.35,1.5],
  hips:[1.2,1,1.2],spine:[1.24,1,1.24],chest:[1.24,1,1.24],clav:[1.2,1.1,1.2],gun:[GUN_S*1.12,GUN_S*1.25,GUN_S*1.25]};
let FIG_INK=null;
function figInk(){   // an ink line round him: the same mesh drawn again, its back faces only, pushed out along its normals
  if(FIG_INK)return FIG_INK;const m=new T.MeshBasicMaterial({color:0x17130f,side:T.BackSide,skinning:true});
  m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  transformed+=normalize(normal)*.2;');};m.customProgramCacheKey=()=>'figink';return FIG_INK=m;
}
let FIG_INK_HOT=null;
function figInkHot(){   // the same line in orange and thicker: the man who's doing the job just ordered (D-Day's squad bar)
  if(FIG_INK_HOT)return FIG_INK_HOT;const m=new T.MeshBasicMaterial({color:0xff5a00,side:T.BackSide,skinning:true,fog:false});
  m.onBeforeCompile=s=>{s.vertexShader=s.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  transformed+=normalize(normal)*1.15;');};m.customProgramCacheKey=()=>'figinkhot';return FIG_INK_HOT=m;
}
function figGeometry(key){
  let G=FIG_GEO.get(key);if(G)return G;
  const parts=figParts(key),stocky=key.split('|')[2].includes('S');let nv=0,ni=0;
  for(const p of parts){nv+=p.g.attributes.position.count;ni+=p.g.index?p.g.index.count:p.g.attributes.position.count;}
  const pos=new Float32Array(nv*3),nor=new Float32Array(nv*3),col=new Float32Array(nv*3),mid=new Float32Array(nv),si=new Uint16Array(nv*4),sw=new Float32Array(nv*4),idx=new Uint32Array(ni);
  const M=new T.Matrix4(),N=new T.Matrix3(),v3=new T.Vector3();let v=0,k=0;
  for(const p of parts){
    const g=p.g,P=g.attributes.position,Nn=g.attributes.normal,base=v,R=FB_REST[p.b];
    M.makeTranslation(R[0],R[1],R[2]);const sc=p.b===BI.gun?GUN_S:p.b===BI.head?1.1:1;if(stocky){const q=STOCKY[FB[p.b][0].replace(/[LR]$/,'')]||[1,1,1];M.multiply(new T.Matrix4().makeScale(q[0],q[1],q[2]));}else if(sc!==1)M.multiply(new T.Matrix4().makeScale(sc,sc,sc));M.multiply(p.m);N.getNormalMatrix(M);
    for(let i=0;i<P.count;i++,v++){
      v3.fromBufferAttribute(P,i).applyMatrix4(M);pos[v*3]=v3.x;pos[v*3+1]=v3.y;pos[v*3+2]=v3.z;
      v3.fromBufferAttribute(Nn,i).applyMatrix3(N).normalize();nor[v*3]=v3.x;nor[v*3+1]=v3.y;nor[v*3+2]=v3.z;
      col[v*3]=p.c[0];col[v*3+1]=p.c[1];col[v*3+2]=p.c[2];mid[v]=p.mid;si[v*4]=p.b;sw[v*4]=1;
    }
    if(g.index)for(let i=0;i<g.index.count;i++)idx[k++]=base+g.index.getX(i);else for(let i=0;i<P.count;i++)idx[k++]=base+i;
    g.dispose();
  }
  G=new T.BufferGeometry();
  G.setAttribute('position',new T.BufferAttribute(pos,3));G.setAttribute('normal',new T.BufferAttribute(nor,3));G.setAttribute('color',new T.BufferAttribute(col,3));
  G.setAttribute('mid',new T.BufferAttribute(mid,1));G.setAttribute('skinIndex',new T.Uint16BufferAttribute(si,4));G.setAttribute('skinWeight',new T.BufferAttribute(sw,4));
  G.setIndex(new T.BufferAttribute(idx,1));G.boundingSphere=new T.Sphere(new T.Vector3(0,7,0),16);G.boundingBox=new T.Box3(new T.Vector3(-16,-2,-16),new T.Vector3(16,20,16));
  FIG_GEO.set(key,G);return G;
}

/* ---------- the material: one per person (their skin, hair, cloth and team colour), one shader program for everyone ---------- */
function figMaterial(L,side){
  const m=new T.MeshStandardMaterial({vertexColors:true,skinning:true,roughness:.8,metalness:.04});
  const c=h=>new T.Color(h).convertSRGBToLinear();
  const dd=typeof MAPID!=='undefined'&&MAPID==='dd';   // (Version 190, D-Day's daylight: skin matte, not shiny (its sheen burnt white in the sun); a hit a short warm flash at the edges, not a white fill)
  const U={uSkin:{value:c(L.skin)},uHair:{value:c(L.hair)},uCloth:{value:c(L.cloth)},uTeam:{value:c(L.team)},uGlow:{value:side==='P'?1.6:0},
    uRim:{value:c(side==='E'?'#5a3a32':side==='P'?'#3a5a80':'#4a4f55').multiplyScalar(side==='P'?.42:.32)},uFill:{value:side==='P'?.16:.12},uHit:{value:0},uLamp:{value:c('#dfeaff').multiplyScalar(2.2)},
    uSkR:{value:dd?.86:.58},uHitC:{value:dd?new T.Color(1,.45,.3):new T.Color(1,1,1)},uHitR:{value:dd?1:0}};
  m.userData.U=U;
  m.onBeforeCompile=s=>{
    Object.assign(s.uniforms,U);
    s.vertexShader=s.vertexShader.replace('#include <common>','#include <common>\nattribute float mid;\nvarying float vMid;').replace('#include <begin_vertex>','#include <begin_vertex>\nvMid=mid;');
    s.fragmentShader=s.fragmentShader
      .replace('#include <common>','#include <common>\nvarying float vMid;\nuniform vec3 uSkin,uHair,uCloth,uTeam,uRim,uLamp,uHitC;\nuniform float uGlow,uHit,uFill,uSkR,uHitR;')
      .replace('#include <color_fragment>','#include <color_fragment>\n  if(abs(vMid-1.)<.5)diffuseColor.rgb=uSkin*vColor;else if(abs(vMid-2.)<.5)diffuseColor.rgb=uTeam*.6;else if(abs(vMid-3.)<.5)diffuseColor.rgb=uHair*vColor;else if(abs(vMid-8.)<.5)diffuseColor.rgb=uCloth*vColor;else if(abs(vMid-9.)<.5)diffuseColor.rgb=uTeam*.3;')
      .replace('#include <metalnessmap_fragment>','#include <metalnessmap_fragment>\n  if(abs(vMid-4.)<.5){roughnessFactor=.36;metalnessFactor=.65;}else if(abs(vMid-5.)<.5){roughnessFactor=.6;}else if(abs(vMid-1.)<.5){roughnessFactor=uSkR;}')
      .replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  {float f=1.-clamp(dot(normal,normalize(vViewPosition)),0.,1.);totalEmissiveRadiance+=uRim*(f*f*(3.-2.*f))+diffuseColor.rgb*uFill+uHitC*uHit*mix(1.,.25+.75*f*f,uHitR);}\n  if(abs(vMid-2.)<.5)totalEmissiveRadiance+=uTeam*uGlow;if(abs(vMid-7.)<.5)totalEmissiveRadiance+=uLamp;');
  };
  m.customProgramCacheKey=()=>'fig1';
  return m;
}

/* ---------- making one ---------- */
function makeFigure(u){
  const L=figLook(u),key=figKitKey(u,L),P=u.side==='P'&&L.k==='sq';
  const g=new T.Group(),pose=new T.Group();g.add(pose);
  const mat=figMaterial(L,L.k==='sq'?'P':L.k==='en'?'E':'C'),mesh=new T.SkinnedMesh(figGeometry(key),mat);
  const bones=FB.map(([n,,o])=>{const b=new T.Bone();b.name=n;b.position.set(...o);return b;});
  FB.forEach(([,p],i)=>{if(p>=0)bones[p].add(bones[i]);});
  mesh.add(bones[0]);mesh.bind(new T.Skeleton(bones));mesh.castShadow=true;pose.add(mesh);
  let ink=null;if(key.split('|')[2].includes('S')){ink=new T.SkinnedMesh(mesh.geometry,figInk());ink.bind(mesh.skeleton,mesh.bindMatrix);ink.frustumCulled=false;pose.add(ink);}
  const col=new T.Color(teamCol(u)),civ=L.k==='pri'||L.k==='sci';
  const ring=new T.Mesh(SG.ring,new T.MeshBasicMaterial({color:u.side==='P'||!civ?col:new T.Color(L.k==='pri'?'#9aa3a8':'#e8ecef'),transparent:true,opacity:u.side==='P'||!civ?.85:.45,depthWrite:false,toneMapped:false}));
  ring.rotation.x=-Math.PI/2;ring.position.y=.5;g.add(ring);
  let spot=null,beam=null,launcher=null;
  if(P&&!u.freed){   // a light on his chest rig (not the freed men's, kitted out at the HQ: eight spot lights cost every material; base.js): the beam goes where he faces
    const ch=bones[BI.chest];spot=new T.SpotLight(0xd8e8ff,2.6,210,.42,.5,1.2);spot.position.set(1.9,1.3,1.0);const tg=new T.Object3D();tg.position.set(60,-14,0);ch.add(spot,tg);spot.target=tg;
    beam=new T.Mesh(SG.beam,SG.beamMat);beam.position.set(2.0,1.2,1.0);beam.rotation.z=-.24;beam.renderOrder=2;ch.add(beam);
  }
  if(u.spec==='rpg'){   // the RPG on his back until he fires it (it rides on the chest bone, shown while he aims)
    const lm=new T.MeshStandardMaterial({color:0x3f4430,roughness:.7,metalness:.2});launcher=new T.Group();
    const tube=new T.Mesh(new T.CylinderGeometry(.55,.55,7.2,10),lm);tube.rotation.z=Math.PI/2;launcher.add(tube);
    const head=new T.Mesh(new T.ConeGeometry(.9,2.2,10),lm);head.rotation.z=-Math.PI/2;head.position.x=4.6;launcher.add(head);
    const grip=new T.Mesh(new T.BoxGeometry(.4,1.1,.4),lm);grip.position.set(.4,-.8,0);launcher.add(grip);
    if(MAPID==='dd'){   // D-Day: a big M1 Bazooka, a long tube over the shoulder (Bryan: "Can we draw a large bazooka and see the player actually use it")
      launcher.remove(tube,head,grip);const wm=new T.MeshStandardMaterial({color:0x6a4526,roughness:.8}),dk=new T.MeshStandardMaterial({color:0x1c1f18,roughness:.6,metalness:.4});
      const add=(geo,mat,x,y,z,rz)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);if(rz)m.rotation.z=rz;launcher.add(m);return m;};
      add(new T.CylinderGeometry(.72,.72,15,12,1,true),lm,.6,0,0,Math.PI/2).material.side=T.DoubleSide;   // the tube, open both ends
      add(new T.CylinderGeometry(1.05,.72,1.3,12,1,true),lm,8.6,0,0,-Math.PI/2);   // the flared muzzle
      add(new T.CylinderGeometry(.95,.95,.5,12),dk,-6.6,0,0,Math.PI/2);   // the wire guard ring at the back
      add(new T.BoxGeometry(2.6,1.5,.7),wm,-2.4,-1.2,0);   // the wooden shoulder stock
      add(new T.BoxGeometry(.5,1.5,.5),wm,.9,-1.3,0);add(new T.BoxGeometry(.5,1.4,.5),wm,3.0,-1.25,0);   // two grips
      add(new T.BoxGeometry(.25,1.0,.25),dk,2.2,1.05,0);   // the sight
      launcher.scale.setScalar(1.12);
    }
    for(const o of launcher.children)o.castShadow=true;launcher.position.set(.6,2.65,1.7);launcher.visible=false;bones[BI.chest].add(launcher);
  }
  scene.add(g);
  const F={mesh,ink,bones,mat,L,key,launcher,lt:simT,px:u.x,py:u.y,spd:0,mvx:1,mvz:0,phase:0,state:'',blendT:-9,seed:(seedOf(u)>>>0)%1000/1000,
    foot:[new T.Vector3(.2,ANKLE,-1.1),new T.Vector3(-.3,ANKLE,1.1)],hex:[new T.Vector3(),new T.Vector3()],hw:[1,1],hq:[new T.Quaternion(),new T.Quaternion()],fresh:true};
  u.m={g,pose,ring,spot,beam,rifle:null,fig:F,person:civ};
  return u.m;
}
// change what he wears/carries: the same skeleton, another geometry
function figRefresh(u){const F=u.m&&u.m.fig;if(!F)return;const key=figKitKey(u,F.L);if(key!==F.key){F.key=key;F.mesh.geometry=figGeometry(key);if(F.ink)F.ink.geometry=F.mesh.geometry;}}

/* ---------- the pose solver ---------- */
const _fq=[...Array(8)].map(()=>new T.Quaternion()),_fv=[...Array(12)].map(()=>new T.Vector3()),_fe=new T.Euler(),_fmx=new T.Matrix4();
const BW_P=FB.map(()=>new T.Vector3()),BW_Q=FB.map(()=>new T.Quaternion());   // bones in the body's frame (the root bone's)
const qE=(q,x,y,z)=>q.setFromEuler(_fe.set(x,y,z,'YZX'));
function fkBone(B,i){const p=FB[i][1];BW_Q[i].copy(BW_Q[p]).multiply(B[i].quaternion);BW_P[i].copy(B[i].position).applyQuaternion(BW_Q[p]).add(BW_P[p]);}
// a limb's rotation: its -y along dir, its +x toward hint (away from it if flip)
function basisQ(out,dir,hint,flip){
  const y=_fv[8].copy(dir).negate(),x=_fv[9].copy(hint).addScaledVector(y,-hint.dot(y));
  if(x.lengthSq()<1e-8)x.set(1,0,0).addScaledVector(y,-y.x);x.normalize();if(flip)x.negate();
  const z=_fv[10].crossVectors(x,y);_fmx.makeBasis(x,y,z);return out.setFromRotationMatrix(_fmx);
}
// a rotation whose +x is X and +y is (as near as can be) Y
function axesQ(out,X,Y){const x=_fv[8].copy(X).normalize(),y=_fv[9].copy(Y).addScaledVector(x,-Y.dot(x)).normalize(),z=_fv[10].crossVectors(x,y);_fmx.makeBasis(x,y,z);return out.setFromRotationMatrix(_fmx);}
// two bones from S reaching for W (lengths a, b), bending toward hint: the upper and lower bones' rotations in the body frame
function ik2(S,W,a,b,hint,Qa,Qb,flip){
  const u=_fv[4].subVectors(W,S);let L=u.length();L=clamp(L,Math.abs(a-b)+.02,a+b-.01);u.normalize();
  const h=_fv[5].copy(hint).addScaledVector(u,-hint.dot(u));if(h.lengthSq()<1e-8)h.set(0,1,0).addScaledVector(u,-u.y);h.normalize();
  const ca=clamp((a*a+L*L-b*b)/(2*a*L),-1,1),sa=Math.sqrt(1-ca*ca);
  const E=_fv[6].copy(S).addScaledVector(u,a*ca).addScaledVector(h,a*sa);
  const d1=_fv[7].subVectors(E,S).divideScalar(a);basisQ(Qa,d1,hint,flip);
  const d2=_fv[11].copy(S).addScaledVector(u,L).sub(E).divideScalar(b);basisQ(Qb,d2,hint,flip);
}
const _P={rootP:new T.Vector3(),rootE:[0,0,0],hipsP:new T.Vector3(),hipsE:[0,0,0],spineE:[0,0,0],chestE:[0,0,0],neckE:[0,0,0],headE:[0,0,0],clavLE:[0,0,0],clavRE:[0,0,0],
  gun:{mode:'chest',P:new T.Vector3(),E:[0,0,0],X:new T.Vector3(),Y:new T.Vector3()},feet:[new T.Vector3(),new T.Vector3()],knees:[new T.Vector3(),new T.Vector3()],footE:[null,null],
  hands:[null,null],handT:[new T.Vector3(),new T.Vector3()],elbows:[new T.Vector3(),new T.Vector3()],handE:[null,null],launcher:false,rate:18,feetRate:14,footA:[[0,0,0],[0,0,0]]};
const smooth=x=>x*x*(3-2*x),TAU2=Math.PI*2;

// what he's doing, for the pose
function figState(u){
  if(u.carriedBy)return'carried';
  if(u.dead)return'dead';
  if(u.downed)return'downed';
  if(simT<(u.stunT||0))return'stun';
  if(u.atEase&&!u.path.length)return'ease';   // (standing about in the barracks: ddmeta.js)
  if(u.strapped&&!u.joined)return'strapped';
  if(u.railed&&!u.path.length)return'tied';   // (a scientist tied to the drawbridge's railings: monsters.js)
  if(u.grabbed)return'grabbed';
  if(u.work&&!u.path.length)return u.work==='kneel'?'kneelwork':'standwork';   // (at work in the montage after the Headquarters: base.js)
  if(u.climb)return'climb';
  if(u.crawl)return'crawl';
  if(u.inBoat)return u.driving?'drive':'boat';
  if(u.surr)return u.tied?'tied':'surr';
  if(u.cower&&!u.detained)return'cower';
  if(u.tk&&u.tk.strike)return'grab';
  if(u.gunner)return'gunner';
  if(u.carry)return'carry';
  if(u.rpgAim||simT-(u.rpgT||-9)<(MAPID==='dd'?1.0:.5))return'rpg';
  if(simT-(u.throwT||-9)<.75)return'throw';
  if((u.medGo&&u.medGo.prog>0)||(u.carryGo&&u.carryGo.prog>0)||(typeof zipOf==='function'&&zipOf(u)&&!u.path.length)||u.plant||reviving(u))return'kneelwork';
  if(typeof useOf==='function'&&(g=>g&&!u.path.length&&g.a.secs)(useOf(u)))return'standwork';
  return'base';
}
function reviving(u){if(u.side!=='P'||u.path.length)return false;for(const p of players)if(p!==u&&p.downed&&!p.dead&&p.revive>0&&hyp(p.x-u.x,p.y-u.y)<26)return true;return false;}

// every frame for everyone on show (from syncUnits)
function figAnimate(u,m){
  const F=m.fig,B=F.bones,t=simT;let dt=t-F.lt;F.lt=t;if(dt<0||dt>.25)dt=0;
  const dx=u.x-F.px,dy=u.y-F.py,d=Math.hypot(dx,dy);F.px=u.x;F.py=u.y;
  if(d>30){F.spd=0;}else if(dt>0){F.spd+=(d/dt-F.spd)*Math.min(1,dt*12);if(d>.01){const c=Math.cos(u.ang),s=Math.sin(u.ang);F.mvx+=((dx*c+dy*s)/d-F.mvx)*Math.min(1,dt*10);F.mvz+=((-dx*s+dy*c)/d-F.mvz)*Math.min(1,dt*10);}}
  const st=figState(u);if(st!==F.state){if(F.state)F.blendT=t;F.state=st;}
  const P=_P,gait=figGait(u,F,st);
  if(gait.S>0&&d<30)F.phase=(F.phase+d/gait.S)%1;
  if(!m.g.visible&&!F.fresh)return;   // (out of sight: the stride is kept up, nothing else)
  runRestore(F,B);poseTorso(u,F,st,gait,P);
  // damp the torso toward the pose (slower just after a change of what he's doing: falls, getting up)
  const k=F.fresh?1:1-Math.exp(-dt*(t-F.blendT<.45?(st==='dead'||st==='downed'?5:8):P.rate));
  B[0].position.lerp(P.rootP,k);B[0].quaternion.slerp(qE(_fq[0],...P.rootE),k);
  B[1].position.lerp(P.hipsP,k);B[1].quaternion.slerp(qE(_fq[0],...P.hipsE),k);
  B[2].quaternion.slerp(qE(_fq[0],...P.spineE),k);B[3].quaternion.slerp(qE(_fq[0],...P.chestE),k);
  B[4].quaternion.slerp(qE(_fq[0],...P.neckE),k);B[5].quaternion.slerp(qE(_fq[0],...P.headE),k);
  B[6].quaternion.slerp(qE(_fq[0],...P.clavLE),k);B[10].quaternion.slerp(qE(_fq[0],...P.clavRE),k);
  runLayer(u,F,st,gait,B);BW_P[0].set(0,0,0);BW_Q[0].identity();for(const i of[1,2,3,4,5,6,7,10,11,14,17])fkBone(B,i);
  // the gun: in the chest's frame, or placed in the body's frame (aiming: the stock in his shoulder, the barrel on the target)
  const G=P.gun;
  if(G.mode==='aim'){   // the back of the stock in the pocket of his right shoulder
    axesQ(_fq[1],G.X,G.Y);const butt=(GRIP[F.key.split('|')[1]]||GRIP.m4).butt;
    G.P.set(.45,-.05,-.85).applyQuaternion(BW_Q[3]).add(BW_P[11]).sub(_fv[1].set(butt*GUN_S,-.15,0).applyQuaternion(_fq[1]));
  }
  if(G.mode==='body'||G.mode==='aim'){
    const qb=axesQ(_fq[1],G.X,G.Y);
    _fq[2].copy(BW_Q[3]).invert();const ql=_fq[3].copy(_fq[2]).multiply(qb);
    const pl=_fv[1].copy(G.P).sub(BW_P[3]).applyQuaternion(_fq[2]);
    B[20].position.lerp(pl,F.fresh?1:1-Math.exp(-dt*30));B[20].quaternion.slerp(ql,F.fresh?1:1-Math.exp(-dt*30));
  }else{B[20].position.lerp(G.P,F.fresh?1:1-Math.exp(-dt*22));B[20].quaternion.slerp(qE(_fq[0],...G.E),F.fresh?1:1-Math.exp(-dt*22));}
  runGun(u,F,st,gait,B);fkBone(B,20);
  if(F.launcher)F.launcher.visible=P.launcher;
  poseLimbs(u,F,st,gait,P);
  // legs: feet where the pose wants them (smoothed between poses; nearly exact while walking)
  const kf=F.fresh?1:1-Math.exp(-dt*P.feetRate);
  for(let s=0;s<2;s++){
    const th=s?17:14,f=F.foot[s];f.lerp(P.feet[s],kf);
    ik2(BW_P[th],f,LEG[0],LEG[1],P.knees[s],_fq[4],_fq[5],false);
    B[th].quaternion.copy(_fq[2].copy(BW_Q[1]).invert().multiply(_fq[4]));
    B[th+1].quaternion.copy(_fq[3].copy(_fq[4]).invert().multiply(_fq[5]));
    if(P.footE[s]){qE(_fq[6],...P.footE[s]);B[th+2].quaternion.copy(_fq[3].copy(_fq[5]).invert().multiply(_fq[6]));}
    else B[th+2].quaternion.slerp(qE(_fq[6],0,0,.15),kf);
  }
  // arms: hands on the gun's grips, or where the pose puts them (blended between the two)
  const gp=GRIP[F.key.split('|')[1]]||GRIP.m4;
  for(let s=0;s<2;s++){
    const arm=s?11:7,want=P.hands[s],w=want?0:1,kh=F.fresh?1:1-Math.exp(-dt*16);
    F.hw[s]+=(w-F.hw[s])*kh;
    const grip=_fv[2].fromArray(s?gp.R:gp.L).multiplyScalar(GUN_S).applyQuaternion(BW_Q[20]).add(BW_P[20]);
    if(want)F.hex[s].lerp(want,F.fresh?1:kh);else F.hex[s].lerp(grip,F.fresh?1:kh);
    const tgt=_fv[3].copy(F.hex[s]).lerp(grip,F.hw[s]);
    ik2(BW_P[arm],tgt,ARM[0],ARM[1],P.elbows[s],_fq[4],_fq[5],true);
    B[arm].quaternion.copy(_fq[2].copy(BW_Q[arm-1]).invert().multiply(_fq[4]));
    B[arm+1].quaternion.copy(_fq[3].copy(_fq[4]).invert().multiply(_fq[5]));
    // the hand: turned to the grip, or as the pose says (else in line with the forearm)
    const hq=_fq[6];
    if(F.hw[s]>.01)hq.copy(BW_Q[20]).multiply(qE(_fq[7],s?.25:-1.2,0,s?.3:.15));else hq.copy(_fq[5]);
    if(P.handE[s]&&F.hw[s]<.99){qE(_fq[7],...P.handE[s]);hq.slerp(_fq[7],1-F.hw[s]);}
    else if(!P.handE[s]&&F.hw[s]<.99)hq.slerp(_fq[5],1-F.hw[s]);
    B[arm+2].quaternion.copy(_fq[3].copy(_fq[5]).invert().multiply(hq));
  }
  // a hit: a white flash on him for a moment (D-Day, Version 190: a tenth of a second of warm light at his edges from each new hit, as hitFlash jumps; held
  // white for as long as hitFlash lasted, a man under fire, and every dead one, whose hitFlash never runs down, stood chalk-white)
  if(MAPID==='dd'){const h=u.hitFlash||0;if(h>(F.hf||0)+.01)F.hitT=simT;F.hf=h;const k=Math.max(0,1-(simT-(F.hitT??-9))/.1);F.mat.userData.U.uHit.value=k*k*.5;}
  else F.mat.userData.U.uHit.value=Math.max(0,(u.hitFlash||0))*.9;
  F.fresh=false;
}

/* ---------- the run (Bryan, after v117: "There legs move but the upper part of their body is stiff"; his pick of the drafts, A,
   the combat run, docs/run-queen-drafts.md) ---------- */
// The stride's bob and twist were part of the pose the torso eases toward, and at four steps a second the easing took half of it
// away; the chest turned back almost all of the hips' twist. Now they go on top of the eased pose each frame and come off again
// before the next: the hips drop at each footfall and twist with the legs, the shoulders twist back the other way (so the rifle
// swings a little), the weight shifts over the foot that's down, the chest dips, the rifle bounces, the head stays level.
const RUN_K={bob:1.15,twist:.24,counter:1.0,sway:.3,dip:.1,bounce:.45,lean:.3,roll:.07};
const runOn=(u,st,gait,F)=>gait&&gait.run&&st==='base'&&!(simT-(u.aimT||-9)<1.4||u.watch||u.supT||u.silent||u.breach);
function runRestore(F,B){const R=F.rn;if(!R||!R.on)return;
  B[1].position.copy(R.hp);B[1].quaternion.copy(R.hq);B[2].quaternion.copy(R.sq);B[3].quaternion.copy(R.cq);B[4].quaternion.copy(R.nq);B[5].quaternion.copy(R.headq);
  if(R.gon){B[20].position.copy(R.gp);B[20].quaternion.copy(R.gq);}R.on=R.gon=false;}
const _rnq=new T.Quaternion(),_rne=new T.Euler();
const runTurn=(q,x,y,z)=>q.multiply(_rnq.setFromEuler(_rne.set(x,y,z,'YZX')));
function runLayer(u,F,st,gait,B){
  const R=F.rn||(F.rn={hp:new T.Vector3(),hq:new T.Quaternion(),sq:new T.Quaternion(),cq:new T.Quaternion(),nq:new T.Quaternion(),headq:new T.Quaternion(),gp:new T.Vector3(),gq:new T.Quaternion(),w:0,on:false,gon:false});
  const dt=Math.max(0,Math.min(.1,simT-(R.t??simT)));R.t=simT;R.w+=((runOn(u,st,gait,F)?1:0)-R.w)*(F.fresh?1:Math.min(1,dt*8));if(R.w<.01)return;
  R.hp.copy(B[1].position);R.hq.copy(B[1].quaternion);R.sq.copy(B[2].quaternion);R.cq.copy(B[3].quaternion);R.nq.copy(B[4].quaternion);R.headq.copy(B[5].quaternion);R.on=true;
  const K=RUN_K,w=R.w,ph=F.phase;
  const down=Math.cos((ph-.16)*TAU2*2);   // 1 with a foot under him (mid-stance), -1 in the air between
  const twist=Math.cos(ph*TAU2)*K.twist*w;   // + with his right leg out in front
  B[1].position.y-=K.bob*(down+1)*.5*w;B[1].position.z+=Math.cos((ph-.16)*TAU2)*K.sway*w;
  runTurn(B[1].quaternion,Math.cos((ph-.16)*TAU2)*K.roll*w,twist,0);
  runTurn(B[2].quaternion,0,-twist*.35,-K.dip*(down+1)*.5*w);
  runTurn(B[3].quaternion,-Math.cos((ph-.16)*TAU2)*K.roll*.6*w,-twist*(.65+K.counter),0);
  runTurn(B[4].quaternion,0,twist*K.counter*.5,K.dip*.4*(down+1)*.5*w);runTurn(B[5].quaternion,0,twist*K.counter*.5,K.dip*.4*(down+1)*.5*w);
}
function runGun(u,F,st,gait,B){
  const R=F.rn;if(!R||!R.on||R.w<.01)return;const w=R.w,lag=Math.cos((F.phase-.21)*TAU2*2);   // (a moment after the footfall: it's carried, so it catches up)
  R.gp.copy(B[20].position);R.gq.copy(B[20].quaternion);R.gon=true;
  B[20].position.y-=RUN_K.bounce*(lag+1)*.5*w;runTurn(B[20].quaternion,0,0,-.06*(lag+1)*.5*w);
}

/* ---------- gaits ---------- */
// S: the distance of one full stride (two steps); sf: the share of it a foot is on the ground; lift: how high a foot swings
function figGait(u,F,st){
  const mv=F.spd>3,run=F.spd>38;
  if(!mv||st==='climb'||st==='boat'||st==='drive'||st==='carried'||st==='dead'||st==='downed'||st==='stun'||st==='grabbed'||st==='strapped')return{mv:false,S:0,run:false,sneak:false};
  if(st==='crawl')return{mv:true,S:9,sf:.5,lift:0,crawl:true};
  if(st==='carry')return{mv:true,S:13,sf:.62,lift:1.1,run:false,sneak:false,hip:8.4,lean:.2};
  if(run)return{mv:true,S:26,sf:.32,lift:2.4,run:true,hip:7.9,lean:.24};
  const sneak=u.side==='P'&&u.gait==='sneak'&&!F.L.k.match(/pri|sci/);
  if(sneak)return{mv:true,S:17,sf:.55,lift:1.2,sneak:true,hip:7.0,lean:.3};
  return{mv:true,S:14,sf:.6,lift:1.0,hip:8.55,lean:.06};
}
function stepFoot(F,gait,side){   // a foot's place in the walk cycle, along the way he's moving
  const ph=(F.phase+(side?0:.5))%1,l=gait.sf*gait.S;let x,y,pitch=0;
  if(ph<gait.sf){x=l/2-l*(ph/gait.sf);y=ANKLE;pitch=ph>gait.sf*.7?-(ph-gait.sf*.7)/(gait.sf*.3)*.5:0;}
  else{const s=(ph-gait.sf)/(1-gait.sf);x=-l/2+l*smooth(s);y=ANKLE+gait.lift*Math.sin(Math.PI*s);pitch=-.5*(1-s)*(1-s)+.28*Math.sin(Math.PI*s);}
  return{x,y,pitch,ph};
}

/* ---------- the torso: hips, spine, head, and where the gun is ---------- */
function poseTorso(u,F,st,gait,P){
  const t=simT,sd=F.seed;
  P.rootP.set(0,0,0);P.rootE[0]=P.rootE[1]=P.rootE[2]=0;
  for(const e of[P.hipsE,P.spineE,P.chestE,P.neckE,P.headE,P.clavLE,P.clavRE])e[0]=e[1]=e[2]=0;
  P.hipsP.set(0,8.85,0);P.rate=18;P.launcher=false;P.feetRate=gait.mv?60:14;
  const G=P.gun,armed=F.key.split('|')[1]!=='none';
  G.mode='chest';G.aimed=false;
  const lowReady=()=>{G.P.set(2.4,.15,.75);G.E[0]=-.15;G.E[1]=.22;G.E[2]=-.55;},slung=()=>{G.P.set(-2.0,1.3,.2);G.E[0]=1.45;G.E[1]=0;G.E[2]=1.15;};
  const breathe=Math.sin(t*1.7+sd*9)*.018;
  if(st==='dead'||st==='downed'||st==='stun'){
    const back=st!=='dead'||sd<.55;   // the dead lie on their backs or on their faces
    P.rootE[2]=back?Math.PI/2:-Math.PI/2;P.rootP.set(back?9:-9,back?1.45:1.35,0);P.hipsP.set(0,9,0);
    if(st==='dead'){P.headE[1]=(sd-.5)*1.6;P.chestE[0]=(sd-.5)*.3;P.hipsE[0]=(sd-.5)*-.2;}
    else{const w=Math.sin(t*.9+sd*5);P.chestE[2]=breathe*(u.critical?2.6:1.4)+(back?.04:0);P.headE[1]=.5+w*.25;P.headE[2]=.15;P.spineE[0]=w*.05;}
    if(st==='dead'||!armed){G.mode='body';G.P.set(back?-1.25:1.25,13.5,back?4.6:-4.6);G.X.set(0,-1,.2).normalize();G.Y.set(back?1:-1,0,0);}   // the rifle on the ground by him
    else{G.P.set(2.2,-.2,-.6);G.E[0]=-.4;G.E[1]=.55;G.E[2]=-.95;}   // downed: he hugs it
    P.rate=back?6:6;return;
  }
  if(st==='crawl'){
    P.rootE[2]=-Math.PI/2;P.rootP.set(-9,1.4,0);P.hipsP.set(0,9,0);
    const c=Math.sin(F.phase*TAU2);P.hipsE[1]=c*.12;P.spineE[1]=-c*.1;P.headE[2]=.75;P.neckE[2]=.35;
    G.mode='body';G.P.set(1.55,15.5,1.0);G.X.set(-.1,1,.12).normalize();G.Y.set(1,0,0);P.rate=10;return;   // the rifle along his forearms
  }
  if(st==='carried'){
    P.rootE[2]=-Math.PI/2;P.rootP.set(-9,0,0);P.hipsP.set(0,9,0);P.spineE[2]=-.65;P.chestE[2]=-.6;P.neckE[2]=-.4;P.headE[1]=.3;
    slung();P.rate=10;return;
  }
  if(st==='drive'){P.hipsP.set(-.4,3.2,0);P.spineE[2]=-.08;P.chestE[2]=breathe;P.headE[1]=Math.sin(t*.5+sd*4)*.25;slung();return;}   // at the wheel
  if(st==='boat'){P.hipsP.set(-.4,3.2,0);P.spineE[2]=-.12;P.chestE[2]=-.05+breathe;G.mode='body';G.P.set(2.6,7.6,.5);G.X.set(.35,1,0).normalize();G.Y.set(-1,.35,0).normalize();P.headE[1]=(sd-.5)*.6;return;}
  if(st==='climb'){P.hipsP.set(-.6,8.8,0);P.chestE[2]=.05;P.headE[2]=.35;slung();return;}
  if(st==='surr'||st==='tied'){
    P.hipsP.set(-.6,5.3,0);P.chestE[2]=st==='tied'?-.12:.05;P.headE[2]=st==='tied'?-.35:-.1;P.chestE[0]=Math.sin(t*7+sd*4)*.012;
    G.mode='body';G.P.set(4.2,.35,.6);G.X.set(1,0,.25).normalize();G.Y.set(0,1,0);return;   // his rifle on the ground in front of him
  }
  if(st==='ease'){   // at ease: weight from foot to foot, a look round, and now and then a stretch or his hands at something (Bryan: "standing, fidgeting with their hands, stretching, etc.")
    const e=easeG(sd,t),sw=Math.sin(t*.55+sd*11);P.hipsP.set(0,8.85+Math.sin(t*1.7+sd*9)*.05,sw*.28);P.hipsE[0]=sw*.05;P.spineE[0]=-sw*.04;P.chestE[2]=breathe;
    P.headE[1]=Math.sin(t*.37+sd*7)*.45;P.headE[2]=Math.sin(t*.23+sd*3)*.08;P.rate=8;
    if(e.g===1){P.headE[2]-=.3*e.k;P.headE[1]*=1-e.k;P.chestE[2]-=.06*e.k;}                      // looking down at his hands
    else if(e.g===2){P.spineE[2]+=.14*e.k;P.chestE[2]+=.12*e.k;P.headE[2]+=.3*e.k;P.hipsP.y+=.25*e.k;}   // a stretch, arms up
    else if(e.g===3){P.headE[0]=Math.sin(t*1.6)*.35*e.k;P.neckE[0]=Math.sin(t*1.6)*.2*e.k;}         // rolling his neck
    else if(e.g===4){P.chestE[1]=Math.sin(t*1.1)*.3*e.k;P.hipsE[1]=Math.sin(t*1.1)*.12*e.k;}        // twisting at the waist
    slung();return;
  }
  if(st==='cower'){P.hipsP.set(-.8,4.3,0);P.spineE[2]=-.4;P.chestE[2]=-.35;P.headE[2]=-.45;P.chestE[0]=Math.sin(t*23+sd*7)*.02;slung();return;}
  if(st==='strapped'){P.hipsP.set(0,9,0);P.headE[2]=-.42+Math.sin(t*.7)*.06;P.headE[1]=Math.sin(t*.4+1)*.2;P.chestE[0]=Math.sin(t*.9)*.04;slung();return;}
  if(st==='grabbed'){P.hipsP.set(-.8,8.2,0);P.spineE[2]=.3;P.chestE[2]=.25;P.headE[2]=.35;P.headE[0]=Math.sin(t*14)*.08;G.P.set(2.0,-1.5,.9);G.E[0]=0;G.E[1]=.3;G.E[2]=-1.2;return;}
  if(st==='grab'){P.hipsP.set(-.6,8.3,0);P.spineE[2]=.12;P.chestE[2]=.08;P.headE[2]=-.15;slung();return;}
  if(st==='gunner'){P.hipsP.set(-.4,7.9,0);P.spineE[2]=-.2;P.chestE[2]=-.08+(simT-(u.shotT||-9)<.1?.04:0);P.headE[2]=-.08;slung();return;}
  if(st==='kneelwork'){P.hipsP.set(-.5,5.4,.1);P.spineE[2]=-.32;P.chestE[2]=-.25;P.headE[2]=-.35;P.chestE[1]=Math.sin(t*3+sd)*.05;slung();return;}
  if(st==='standwork'){P.hipsP.set(0,8.7,0);P.spineE[2]=-.15;P.chestE[2]=-.1;P.headE[2]=-.3;slung();return;}
  if(st==='rpg'){P.hipsP.set(-.2,8.4,0);P.hipsE[1]=-.3;P.chestE[1]=.1;P.chestE[2]=.02+(simT-(u.rpgT||-9)<.25?.12:0);P.headE[1]=.2;P.headE[0]=.12;P.launcher=true;slung();return;}
  if(st==='throw'){
    const k=clamp((simT-(u.throwT||-9))/.75,0,1);P.hipsP.set(0,8.4,0);
    const wind=k<.16?smooth(k/.16):1-smooth(clamp((k-.16)/.18,0,1)),fol=k>.16?smooth(clamp((k-.16)/.3,0,1)):0;
    P.hipsE[1]=-.35*wind+.25*fol;P.chestE[1]=-.4*wind+.35*fol;P.chestE[2]=.15*wind-.3*fol;P.headE[1]=.4*wind-.3*fol;lowReady();return;
  }
  // base: standing, moving, crouching in cover, aiming, leaning out, vaulting
  const aim=armed&&(simT-(u.aimT||-9)<1.4||!!u.watch||!!u.supT||!!(u.silent)||!!(u.breach));
  const crouch=!gait.mv&&(u.side==='P'?(u.covered&&caught(u)):!!u.coverNow);
  const vk=u.vaultK||0,unarmed=!armed;
  if(gait.mv){
    if(gait.run){P.hipsP.set(0,gait.hip-RUN_K.bob*.35,0);P.spineE[2]=-RUN_K.lean;P.chestE[2]=-.04;P.headE[2]=RUN_K.lean*.75;P.neckE[2]=.05;P.rate=16;}   // running: the bob and twist come on top, unsmoothed (runLayer)
    else{const bob=Math.cos(F.phase*TAU2*2);P.hipsP.set(0,gait.hip-.22*(1+bob)*.5,0);
    P.hipsE[1]=Math.sin(F.phase*TAU2)*.1;P.hipsE[0]=Math.sin(F.phase*TAU2)*.04;
    P.spineE[2]=-gait.lean;P.chestE[1]=-P.hipsE[1]*.8;P.headE[2]=gait.lean*.6;P.rate=16;}
  }else if(crouch){P.hipsP.set(-.55,5.5,.1);P.spineE[2]=-.12;P.chestE[2]=-.05+breathe;}
  else{P.hipsP.set(0,8.85+Math.sin(t*1.7+sd*9)*.05,0);P.hipsE[0]=Math.sin(t*.4+sd*6)*.03;P.chestE[2]=breathe;}
  if(u.detained&&!gait.run){P.spineE[2]-=.18;P.headE[2]-=.25;}
  // the head looks about while he's at ease
  if(!aim&&!gait.run){const at=u.side==='E'&&!u.alerted?1:.35;P.headE[1]=Math.sin(t*.37+sd*7)*.38*at;P.headE[2]+=Math.sin(t*.23+sd*3)*.07*at;}
  // leaning out round a corner: the body tilts toward his side
  {const c=Math.cos(u.ang),s=Math.sin(u.ang),side=((u.lx||0)*-s+(u.ly||0)*c)/14;P.spineE[0]+=clamp(side,-1,1)*.18;P.chestE[0]+=clamp(side,-1,1)*.2;P.headE[0]-=clamp(side,-1,1)*.18;}
  // vaulting a window or sandbags: leaning over it
  if(vk>0){P.spineE[2]-=.45*vk;P.chestE[2]-=.25*vk;P.headE[2]+=.4*vk;}
  // a hit: he jerks back
  const hf=u.hitFlash||0;if(hf>0){P.chestE[2]+=hf*1.2;P.headE[2]+=hf*.8;}
  if(st==='carry'){P.spineE[2]-=.12;if(armed){G.P.set(1.5,-.9,1.55);G.E[0]=.1;G.E[1]=.1;G.E[2]=-1.15;}else slung();return;}
  if(unarmed){slung();return;}
  if(aim){
    const kick=Math.max(0,1-(simT-(u.shotT||-9))/.12)*(F.key.includes('|sniper|')?1.6:F.key.includes('|hmg|')||F.key.includes('|bar|')?1.2:.8);
    P.hipsE[1]-=.3;P.chestE[1]=.05;P.headE[1]=.25;P.headE[2]-=.12+(crouch?.05:0);P.headE[0]+=.12;P.chestE[2]+=kick*.04;
    // pitch to whoever he's shooting at (the tower is high up)
    let pitch=0;const tg=u.target;if(tg&&!tg.dead){const dd=hyp(tg.x-u.x,tg.y-u.y)||1;pitch=clamp(Math.atan2(((tg.elev||0)+12)-((u.elev||0)+15),dd),-.6,.6);}
    G.mode='aim';G.X.set(Math.cos(pitch),Math.sin(pitch)+kick*.05,0).normalize();G.Y.set(-Math.sin(pitch),Math.cos(pitch),0);
    G.aimed=true;return;
  }
  if(gait.run&&!aim){G.P.set(2.45,.05,.62);G.E[0]=-.18;G.E[1]=.3;G.E[2]=-.5;}   // running: across his front, the muzzle down and out to the left (since v119; it was across the chest, the muzzle up)
  else if(gait.sneak||crouch||(u.side==='E'&&u.alerted)){G.P.set(2.55,1.05,.8);G.E[0]=-.08;G.E[1]=.1;G.E[2]=-.2;}   // ready, muzzle low
  else lowReady();
}

/* ---------- arms and legs ---------- */
function poseLimbs(u,F,st,gait,P){
  const t=simT,sd=F.seed,H=P.hands,FT=P.feet,K=P.knees,EL=P.elbows,HT=P.handT;
  H[0]=H[1]=null;P.handE[0]=P.handE[1]=null;P.footE[0]=P.footE[1]=null;
  K[0].set(1,0,-.15);K[1].set(1,0,.15);EL[0].set(.1,-1,-.7);EL[1].set(-.5,-.6,1);
  const flat=s=>{const a=P.footE[s]=P.footA[s];a[0]=0;a[1]=s?-.12:.12;a[2]=0;};
  const shoulder=s=>BW_P[s?11:7],headP=BW_P[5],chestP=BW_P[3];
  const hand=(s,x,y,z)=>{H[s]=HT[s].set(x,y,z);return H[s];};
  const fromSh=(s,x,y,z)=>hand(s,shoulder(s).x+x,shoulder(s).y+y,shoulder(s).z+z);
  // the body's own frame: feet and hands below are in it (for those lying down too: their ground is a side of it)
  if(st==='dead'||st==='downed'||st==='stun'){
    const back=st!=='dead'||sd<.55,g=back?-1.45:1.35,gx=g+(back?.85:-.85);
    if(st==='dead'){FT[0].set(gx,.9,-1.5-sd);FT[1].set(gx,1.1,1.6+sd*.8);K[0].set(1,0,-.3);K[1].set(1,0,.3);
      hand(0,g+(back?.9:-.9),12.5-sd*3,-4.6-sd);hand(1,g+(back?.9:-.9),11+sd*3,4.8+sd*.5);EL[0].set(back?1:-1,.3,-1);EL[1].set(back?1:-1,.3,1);}
    else{FT[0].set(gx,.9,-1.4);FT[1].set(-.6+(back?0:1.2),4.6,1.4);K[0].set(1,0,-.2);K[1].set(back?1:-1,0,.3);
      const w=Math.sin(t*.9+sd*5);hand(0,back?1.6:-1.6,11.8+w*.4,-.2);EL[0].set(back?1:-1,0,-1);
      if(F.key.split('|')[1]==='none')hand(1,g+(back?.9:-.9),12+w*.3,4.6);   // (an empty hand on the ground; armed, he hugs the rifle)
      EL[1].set(back?.5:-.5,0,1);}
    return;
  }
  if(st==='crawl'){
    const c=F.phase*TAU2,a=Math.sin(c),b=Math.sin(c+Math.PI);
    hand(0,1.0,15.2+a*2.2,-2.3);hand(1,1.0,15.2+b*2.2,2.3);EL[0].set(1,.2,-1);EL[1].set(1,.2,1);
    FT[0].set(.6,1.2+Math.max(0,b)*2.2,-1.9-Math.max(0,b)*1.2);FT[1].set(.6,1.2+Math.max(0,a)*2.2,1.9+Math.max(0,a)*1.2);K[0].set(.6,0,-1);K[1].set(.6,0,1);
    return;
  }
  if(st==='carried'){FT[0].set(3.6,6.2,-.9);FT[1].set(3.8,6.6,.9);K[0].set(-1,0,0);K[1].set(-1,0,0);
    hand(0,5.0,14.4,-1.8);hand(1,5.0,14.8,1.8);EL[0].set(0,1,0);EL[1].set(0,1,0);return;}
  if(st==='drive'){FT[0].set(3.6,ANKLE,-1.3);FT[1].set(3.8,ANKLE,1.3);K[0].set(1,1,-.3);K[1].set(1,1,.3);flat(0);flat(1);const w=Math.sin(t*.8+sd)*.25;hand(0,3.5,6.4+w,-1.0);hand(1,3.5,6.4-w,1.0);EL[0].set(-.3,-1,-1);EL[1].set(-.3,-1,1);return;}
  if(st==='boat'){FT[0].set(3.4,ANKLE,-1.3);FT[1].set(3.6,ANKLE,1.3);K[0].set(1,1,-.3);K[1].set(1,1,.3);flat(0);flat(1);return;}   // (hands on the rifle, upright between his knees)
  if(st==='climb'){
    const c=((u.elev||0)/4.5)%1*TAU2;fromSh(0,1.9,1.4+Math.sin(c)*1.3,.9);fromSh(1,1.9,1.4+Math.sin(c+Math.PI)*1.3,-.9);EL[0].set(-1,-1,-.4);EL[1].set(-1,-1,.4);
    FT[0].set(1.4,1.6+Math.max(0,Math.sin(c+Math.PI))*2,-1);FT[1].set(1.4,1.6+Math.max(0,Math.sin(c))*2,1);K[0].set(1,.3,-.1);K[1].set(1,.3,.1);return;
  }
  // feet for the rest
  if(gait.mv){
    const mx=F.mvx,mz=F.mvz,ml=Math.hypot(mx,mz)||1,ux=mx/ml,uz=mz/ml;
    for(let s=0;s<2;s++){const f=stepFoot(F,gait,s),side=s?1:-1,a=P.footE[s]=P.footA[s];FT[s].set(f.x*ux,f.y,f.x*uz+side*(gait.run?.95:1.08));a[0]=0;a[1]=side*-.1;a[2]=f.pitch;K[s].set(1,0,side*.12);}
  }else if(st==='surr'||st==='tied'){FT[0].set(-3.4,.6,-1.1);FT[1].set(-3.4,.6,1.1);K[0].set(1,-.6,-.05);K[1].set(1,-.6,.05);}
  else if(st==='cower'){FT[0].set(.7,ANKLE,-1.4);FT[1].set(.7,ANKLE,1.4);K[0].set(1,0,-.5);K[1].set(1,0,.5);flat(0);flat(1);}
  else if(st==='kneelwork'||(st==='base'&&!gait.mv&&(u.side==='P'?(u.covered&&caught(u)):!!u.coverNow))){
    FT[0].set(1.9,ANKLE,-1.25);K[0].set(1,.25,-.2);flat(0);FT[1].set(-3.1,.72,1.2);K[1].set(1,-.6,.1);
  }else if(st==='strapped'){FT[0].set(.3,ANKLE,-1.3);FT[1].set(.3,ANKLE,1.3);flat(0);flat(1);}
  else if(st==='grabbed'){FT[0].set(1.8,ANKLE,-1.1);FT[1].set(2.2,ANKLE,1.1);flat(0);flat(1);}
  else if(st==='gunner'||st==='rpg'||(P.gun.aimed)){FT[0].set(1.6,ANKLE,-1.25);FT[1].set(-1.4,ANKLE,1.3);flat(0);flat(1);P.footE[0][1]=.35;P.footE[1][1]=-.5;}
  else{FT[0].set(.35,ANKLE,-1.15);FT[1].set(-.35,ANKLE,1.18);flat(0);flat(1);}
  if(u.vaultK>0){const v=u.vaultK;for(let s=0;s<2;s++){FT[s].x-=1.8*v;FT[s].y+=3.2*v;}}   // tucked over the sill
  // hands
  const armed=F.key.split('|')[1]!=='none';
  if(st==='surr'){hand(0,headP.x-.4,headP.y+1.7,-1.0);hand(1,headP.x-.4,headP.y+1.7,1.0);EL[0].set(0,.2,-1);EL[1].set(0,.2,1);return;}
  if(st==='tied'||(st==='base'&&u.detained)){hand(0,chestP.x-1.5,chestP.y-.9,-.35);hand(1,chestP.x-1.5,chestP.y-.9,.35);EL[0].set(-1,0,-.8);EL[1].set(-1,0,.8);return;}
  if(st==='cower'){hand(0,headP.x+.7,headP.y+1.3,-.75);hand(1,headP.x+.7,headP.y+1.3,.75);EL[0].set(1,-.2,-.8);EL[1].set(1,-.2,.8);return;}
  if(st==='strapped'){const w=Math.sin(t*.9)*.3;hand(0,-.5,19.2+w,-4.3);hand(1,-.5,19.2-w,4.3);EL[0].set(0,0,-1);EL[1].set(0,0,1);return;}
  if(st==='grabbed'){hand(0,headP.x+.9,headP.y-.4,-.55);hand(1,headP.x+.9,headP.y-.2,.55);EL[0].set(1,-.3,-1);EL[1].set(1,-.3,1);return;}
  if(st==='grab'){hand(0,3.0,13.8,-.7);hand(1,3.3,14.4,.3);EL[0].set(-.3,-1,-1);EL[1].set(-.3,-1,1);return;}
  if(st==='gunner'){const k=simT-(u.shotT||-9)<.1?-.25:0;hand(0,3.5+k,9.9,-.75);hand(1,3.5+k,9.9,.75);EL[0].set(-.4,-1,-.8);EL[1].set(-.4,-1,.8);return;}
  if(st==='kneelwork'){const w=Math.sin(t*5+sd)*.35;hand(0,3.0+w,3.0,-.8);hand(1,3.1-w,3.1,.75);EL[0].set(-.2,-1,-1);EL[1].set(-.2,-1,1);return;}
  if(st==='standwork'){const w=Math.sin(t*6+sd)*.3;hand(0,3.4,10.4+w,-.8);hand(1,3.4,10.4-w,.8);EL[0].set(-.3,-1,-1);EL[1].set(-.3,-1,1);return;}
  if(st==='rpg'){const L=F.launcher;if(L){hand(1,chestP.x+.9,chestP.y+1.75,1.6);hand(0,chestP.x+3.0,chestP.y+1.85,1.35);}EL[0].set(.2,-1,-1);EL[1].set(-.3,-.5,1);return;}
  if(st==='carry'){hand(0,1.3,15.4,-1.7);EL[0].set(.4,-1,-.4);if(!armed)fromSh(1,.3,-5.2,.3);return;}   // his left arm round the man on his shoulders; the rifle in his right hand
  if(st==='throw'){
    const k=clamp((simT-(u.throwT||-9))/.75,0,1);
    if(k<.16){const a=smooth(k/.16);hand(1,lerp(2.0,-2.2,a),lerp(10,16.8,a),lerp(1.2,2.5,a));}
    else if(k<.34){const a=smooth((k-.16)/.18);hand(1,lerp(-2.2,3.4,a),lerp(16.8,15.8,a),lerp(2.5,1.2,a));}
    else{const a=smooth((k-.34)/.66);hand(1,lerp(3.4,2.4,a),lerp(15.8,10.5,a),lerp(1.2,1.0,a));}
    EL[1].set(-1,-.3,1);return;
  }
  if(st==='ease'){
    const e=easeG(sd,t),k=e.k,w=Math.sin(t*5+sd*3)*.25,sh0=shoulder(0),sh1=shoulder(1);
    let a0=[sh0.x+.35,sh0.y-5.4,sh0.z+.35],a1=[sh1.x+.35,sh1.y-5.4,sh1.z-.35],b0=a0,b1=a1;EL[0].set(-1,0,-.2);EL[1].set(-1,0,.2);
    if(e.g===1){b0=[chestP.x+3.0+w*.3,chestP.y-2.6+w,-.45];b1=[chestP.x+3.1-w*.3,chestP.y-2.5-w,.45];EL[0].set(-.3,-1,-1);EL[1].set(-.3,-1,1);}
    else if(e.g===2){b0=[sh0.x+.3,sh0.y+7.2,sh0.z-1.2];b1=[sh1.x+.3,sh1.y+7.2,sh1.z+1.2];EL[0].set(.2,.2,-1);EL[1].set(.2,.2,1);}
    else if(e.g===5){b1=[headP.x+.4,headP.y+1.5,headP.z+1.3+w*.3];EL[1].set(-.2,.3,1);}               // a scratch of the head
    else if(e.g===6){b0=[chestP.x+2.7,chestP.y-.6,.9];b1=[chestP.x+2.9,chestP.y-1.2,-.9];EL[0].set(-.2,-1,-1);EL[1].set(-.2,-1,1);}   // arms folded
    hand(0,lerp(a0[0],b0[0],k),lerp(a0[1],b0[1],k),lerp(a0[2],b0[2],k));hand(1,lerp(a1[0],b1[0],k),lerp(a1[1],b1[1],k),lerp(a1[2],b1[2],k));return;
  }
  if(u.vaultK>.2)hand(0,3.2,7.0,-1.2);   // a hand down on the sill
  if(!armed){   // nothing in his hands: they swing as he walks
    if(gait.mv){const c=Math.sin(F.phase*TAU2)*(gait.run?2.4:1.6);fromSh(0,.3+c,-5.3+Math.abs(c)*.25,.45);fromSh(1,.3-c,-5.3+Math.abs(c)*.25,-.45);}
    else{fromSh(0,.35,-5.4,.35);fromSh(1,.35,-5.4,-.35);}
    EL[0].set(-1,0,-.2);EL[1].set(-1,0,.2);
  }else if(P.gun.aimed){EL[1].set(-.3,-.35,1);EL[0].set(.2,-1,-.4);}
}
const lerp=(a,b,k)=>a+(b-a)*k;
// what a man at ease is doing just now: every few seconds one of a handful of things (0 nothing, 1 his hands, 2 a stretch, 3 his neck, 4 a twist,
// 5 a scratch, 6 arms folded), eased in and out; each man on his own clock (his seed)
function easeG(sd,t){
  const T0=5.5,x=(t+sd*37)/T0,slot=Math.floor(x),f=x-slot,h=Math.abs(Math.sin(slot*12.9898+sd*78.233)*43758.5453)%1;
  const g=h<.3?0:1+Math.floor((h-.3)/.7*6);return{g,k:g?smooth(clamp(Math.min(f,1-f)*5,0,1)):0};
}

/* ---------- placing the man being carried on his carrier's shoulders (drawn only: the game keeps him where it keeps him) ---------- */
function figCarried(u,m){
  const c=u.carriedBy;if(!c||!c.m)return;
  const a=c.ang;m.g.position.set(c.m.g.position.x-Math.cos(a)*.6,c.m.g.position.y+15.4,c.m.g.position.z-Math.sin(a)*.6);m.g.rotation.y=-(a+Math.PI/2);
}
