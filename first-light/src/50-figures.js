/* Figures: jointed low-poly people. Each body is ~11 meshes sharing one material (vertex colours), animated by setting joint angles. Model faces +x; +z is its right. */
const PK=['by','br','lean','twist','hz','hy','sLz','sLx','sRz','sRx','eL','eR','wR','hL','hR','kL','kR'];
const SKINS=[0xd9a57e,0xc68f68,0x9b6a48,0x70492f,0xe6b996];
function hairParts(st,c,o){
  const h=[];
  if(st==='short'||st==='pony'||st==='curl'||st==='long')h.push(bx(4,1.5,3.9,-.05,4.3,0,c),bx(1.4,2.8,3.9,-1.4,3,0,c));
  if(st==='long')h.push(bx(1.5,5.4,4,-1.7,.9,0,c),bx(2.6,3,.7,-.4,2.4,1.9,c),bx(2.6,3,.7,-.4,2.4,-1.9,c));
  if(st==='pony')h.push(bx(1.2,1.3,1.3,-2.5,3.5,0,c),bx(1,3.6,1.1,-3,1.6,0,c));
  if(st==='side')h.push(bx(2.2,1.7,4,-.9,2.5,0,c));
  if(st==='cap')h.push(bx(4.1,1.5,4,0,4.3,0,c),bx(2.2,.45,3.4,2.7,3.8,0,c));
  if(st==='beanie')h.push(bx(4.1,2.2,4,0,4,0,c));
  if(st==='curl')for(const[x,z]of[[.8,-1],[.8,1],[-.8,-1],[-.8,1],[0,0]])h.push(cy(.6,.6,1.6,6,x,5.3,z,0xf08ab0,PI/2,0,0));
  if(st==='band')h.push(bx(4,1.5,3.9,-.05,4.3,0,c),bx(3.9,.8,3.95,.1,3.2,0,o||0xe8e8e8));
  return h;
}
function makeFig(sp){
  const mat=vmat({roughness:.82}),f={sp,mat,g:new T.Group(),j:{},cur:{},tgt:{},ph:Math.random()*TAU,seed:Math.random()*10,flash:0,weap:{},wname:null,eyes:null};
  for(const k of PK){f.cur[k]=0;f.tgt[k]=0;}
  f.scale=(sp.h||1)*.88;f.g.scale.setScalar(f.scale);
  const J=f.j,bw=sp.bw||1,skin=sp.skin,top=sp.top,pants=sp.pants,sleeve=sp.sleeve===undefined?top:sp.sleeve,fore=sp.fore===undefined?skin:sp.fore,shin=sp.shin===undefined?pants:sp.shin,shoe=sp.shoe||0x1c1c1e;
  const grp=(par,x,y,z)=>{const g=new T.Group();g.position.set(x,y,z);par.add(g);return g;};
  const msh=(par,items)=>{const m=new T.Mesh(merge(items),mat);m.castShadow=true;par.add(m);return m;};
  J.body=grp(f.g,0,0,0);J.hips=grp(J.body,0,8.9,0);
  const pel=[bx(3.1,2.6,5.2*bw,0,.2,0,pants)];
  if(sp.belt)pel.push(bx(3.3,.9,5.4*bw,0,1.3,0,sp.belt));
  if(sp.robe)pel.push(bx(3.7,7.4,5.9*bw,0,-3.5,0,sp.robe));
  msh(J.hips,pel);
  J.chest=grp(J.hips,0,1.4,0);
  const tor=[bx(3.2,3.5,5.2*bw,0,1.6,0,top),bx(3.7,3.5,6.3*bw,0,4.9,0,top),bx(1.7,1.3,1.9,0,7.1,0,skin)];
  if(sp.torso)for(const t of sp.torso)tor.push(bx(...t));
  msh(J.chest,tor);
  J.head=grp(J.chest,0,7.5,0);
  const hd=[bx(3.7,4,3.6,.15,2.1,0,skin),...hairParts(sp.hair,sp.hairC||0x2b2019,sp.hairX)];
  const ec=sp.eye===undefined?0x16181c:sp.eye;
  hd.push(bx(.3,.6,.75,2,2.6,.9,ec),bx(.3,.6,.75,2,2.6,-.9,ec));
  if(sp.zed)hd.push(bx(.5,1.3,2.3,1.9,.85,0,0x3a0605),bx(.35,1.8,1.2,2,1.6,-1.3,0x5a0806));
  if(sp.stache)hd.push(bx(.4,.6,2,2.05,1.3,0,sp.stache));
  if(sp.face)for(const t of sp.face)hd.push(bx(...t));
  msh(J.head,hd);
  if(sp.glow){const e=new T.Mesh(merge([bx(.25,.55,.7,2.12,2.6,.9,sp.glow),bx(.25,.55,.7,2.12,2.6,-.9,sp.glow)]),emat());J.head.add(e);f.eyes=e;}
  for(const[s,n]of[[-1,'L'],[1,'R']]){
    if(sp.noArm===n){J['s'+n]=grp(J.chest,0,5.7,s*(3.15*bw+1));J['e'+n]=grp(J['s'+n],0,-3.9,0);if(n==='R')J.handR=grp(J.eR,0,-4.4,0);msh(J['s'+n],[bx(1.9,1.6,1.9,0,-.3,0,0x4a0806)]);continue;}
    const sh=J['s'+n]=grp(J.chest,0,5.7,s*(3.15*bw+1));
    msh(sh,[bx(1.8,4.3,1.8,0,-1.8,0,sleeve)]);
    const el=J['e'+n]=grp(sh,0,-3.9,0);
    msh(el,[bx(1.55,3.8,1.55,0,-1.8,0,fore),bx(1.7,1.6,1.85,0,-4.2,0,skin)]);
    if(n==='R')J.handR=grp(el,0,-4.4,0);
    const hp=J['h'+n]=grp(J.hips,0,-.9,s*1.45*bw);
    msh(hp,[bx(2.5,4.3,2.5,0,-2,0,pants)]);
    const kn=J['k'+n]=grp(hp,0,-4,0);
    msh(kn,[bx(2.15,3.5,2.15,0,-1.65,0,shin),bx(3.7,1.3,2.35,.7,-3.35,0,shoe)]);
  }
  if(sp.noArm){for(const n of['L','R'])if(!J['h'+n]){const s=n==='L'?-1:1;const hp=J['h'+n]=grp(J.hips,0,-.9,s*1.45*bw);msh(hp,[bx(2.5,4.3,2.5,0,-2,0,pants)]);const kn=J['k'+n]=grp(hp,0,-4,0);msh(kn,[bx(2.15,3.5,2.15,0,-1.65,0,shin),bx(3.7,1.3,2.35,.7,-3.35,0,shoe)]);}}
  scene.add(f.g);return f;
}
const WEAPG={
  bat:()=>[cy(.5,1,12,6,6,0,0,0xb89468,0,0,PI/2),bx(1,1.3,1.3,-.2,0,0,0x222222)],
  club:()=>[cy(.3,.3,13,5,6.5,0,0,0x9aa0a8,0,0,PI/2),bx(1.3,2.6,1.1,13,-.9,0,0x9aa0a8)],
  board:()=>[bx(14,.7,3.8,6,0,0,0x7a3fb0),bx(1,1.2,3.4,2,-.8,0,0x222),bx(1,1.2,3.4,10,-.8,0,0x222)],
  iron:()=>[cy(.42,.42,11,5,5.5,0,0,0x30343a,0,0,PI/2),bx(1,2.2,1,11,.7,0,0x30343a)],
  baton:()=>[cy(.45,.45,9,5,4.5,0,0,0x15171a,0,0,PI/2)],
  pistol:()=>[bx(3.8,1.5,1,1.7,-.3,0,0x1c1e22),bx(1.2,2.1,1,.3,-1.6,0,0x1c1e22)],
  shotgun:()=>[bx(13,1.4,1.4,5.5,0,0,0x1f1b18),bx(4.5,1.9,1.5,-1,-.5,0,0x5a4030),bx(4,1.1,1.6,6,-1,0,0x5a4030)],
};
function setWeapon(f,name){
  if(f.wname===name)return;f.wname=name;
  for(const k in f.weap)f.weap[k].visible=false;
  if(!name||!WEAPG[name])return;
  if(!f.weap[name]){const m=new T.Mesh(merge(WEAPG[name]()),vmat({roughness:.55,metalness:.25}));m.castShadow=true;f.j.handR.add(m);f.weap[name]=m;}
  f.weap[name].visible=true;
}
function removeFig(f){scene.remove(f.g);f.g.traverse(o=>{if(o.geometry)o.geometry.dispose();});f.mat.dispose();}

/* ---- who looks like what ---- */
const SPEC={
  you:{skin:0xd0a07a,top:0x9aa1a8,sleeve:0x9aa1a8,pants:0x39445c,shoe:0xe8e4da,hair:'short',hairC:0x2a1e16,bw:1.08,h:1.03,torso:[[.3,2.4,3.4,1.75,4.6,0,0x858c94]]},
  walt:{skin:0xd9ab8c,top:0x6d2a34,pants:0x6d2a34,fore:0x6d2a34,shin:0xd9ab8c,shoe:0x8a6a4a,robe:0x6d2a34,belt:0x4a1a22,hair:'side',hairC:0xdcdcdc,stache:0xdcdcdc,bw:1.1,h:.97,torso:[[.3,6,1.6,1.9,3.4,0,0xe6e0d0]]},
  jules:{skin:0x9b6a48,top:0x3f7a5a,pants:0x2b2e36,shoe:0xd84a3a,hair:'beanie',hairC:0xd9a03a,bw:.86,h:.9,torso:[[2.4,5,4.6,-2.6,3.6,0,0x2a3550]]},
  marisol:{skin:0xc68f68,top:0x3fa39a,sleeve:0x3fa39a,pants:0x3fa39a,shoe:0xf0f0f0,hair:'pony',hairC:0x1c1412,bw:.9,h:.93,torso:[[.3,1.2,1.6,1.9,5.2,-1.6,0xf0f0f0]]},
  dunn:{skin:0x70492f,top:0x1f2a44,sleeve:0x1f2a44,pants:0x161d30,shoe:0x0c0c0e,belt:0x0c0c0e,hair:'cap',hairC:0x1f2a44,bw:1.05,h:1,torso:[[.3,1.1,1.1,1.9,5.2,1.7,0xe0c24a]]},
};
const CIVTOPS=[0xb04a3a,0x3a6ea5,0xd9c34a,0x6a8a4a,0xb86aa0,0xe0e0e0,0x4a4a4a];
function civSpec(r){return{skin:pick(SKINS),top:pick(CIVTOPS),pants:pick([0x2b3348,0x3a3a3a,0x5a4a3a]),hair:pick(['short','long','pony','cap']),hairC:pick([0x1c1412,0x4a3020,0x8a6a3a,0x2a2a2a]),bw:rand(.88,1.08),h:rand(.9,1.02)};}
const ZSKIN=[0x8c967c,0x7f8a80,0x9a9486,0x758070];
const ZLOOK=[
  ()=>({top:0xcfd3d6,pants:0x55607a,hair:'short',torso:[[.3,3,.9,1.9,4,0,0x8a1a16]]}),                                   // office: shirt and tie
  ()=>({top:0xd97fa8,pants:0xd97fa8,fore:0xd97fa8,robe:0xd97fa8,shin:null,hair:'curl',hairC:0x8a8a8a}),                  // robe and curlers
  ()=>({top:0x4a78b0,sleeve:0x4a78b0,pants:0x30405a,hair:'cap',hairC:0x30405a,torso:[[2.2,4,2.6,-.4,2.2,3.6,0x7a5a3a]]}), // mail carrier with bag
  ()=>({top:0xe8e04a,sleeve:null,pants:0x18181c,shin:null,hair:'band',hairX:0xe8e04a,shoe:0xe85a2a}),                    // jogger
  ()=>({top:0xdedad0,sleeve:null,pants:0x7a94b8,shin:null,hair:'side',bw:1.25,shoe:0x6a5a4a}),                           // tank top and boxers
  ()=>({top:0x5a6e52,pants:0x3a3a40,hair:'long',hairC:0x5a3a22}),
  ()=>({top:0x6b4636,pants:0x2a2c30,hair:'short',hairC:0x6a5a3a}),
  ()=>({top:0x2f6f88,sleeve:0x2f6f88,pants:0x2f6f88,hair:'pony'}),                                                       // scrubs
];
function zSpec(type,look){
  const L=(look!==undefined?ZLOOK[look]:pick(ZLOOK))(),skin=pick(ZSKIN);
  const sp=Object.assign({skin,hairC:0x2b2019,zed:1,eye:type==='shambler'?0xe6e2c0:0x1a0a08,shoe:0x24201c},L);
  if(sp.sleeve===null)sp.sleeve=skin;if(sp.shin===null)sp.shin=skin;
  sp.torso=(sp.torso||[]).concat([[.35,rand(1.5,3.2),rand(1.6,3.4),1.8,rand(2,5.4),rand(-1.6,1.6),0x5a0806],[rand(1,2.4),rand(1,2.2),.4,rand(-.8,.8),rand(2,5),(Math.random()<.5?-1:1)*3.2*(sp.bw||1),0x4a0605]]);
  if(type==='runner'){sp.glow=0xff3a20;sp.bw=(sp.bw||1)*.92;sp.h=rand(.95,1.03);}
  else if(type==='brute'){sp.glow=0xffb020;sp.bw=1.55;sp.h=1.32;sp.top=0xdedad0;sp.sleeve=skin;sp.pants=0x4a5a7a;sp.hair='side';sp.robe=undefined;}
  else{sp.h=rand(.92,1.04);if(Math.random()<.14)sp.noArm=Math.random()<.5?'L':'R';}
  return sp;
}

/* ---- animation: work out target joint angles from what the unit is doing, then ease toward them ---- */
function figAnim(f,u,dt,now){
  const p=f.tgt;for(const k of PK)p[k]=0;
  const sp=u.spd||0;let rate=22;
  if(u.dead){
    p.sLz=.5;p.sRz=-.35;p.sLx=-.9;p.sRx=.9;p.hL=.3;p.hR=-.15;p.kR=-.5;p.hz=.3;p.eL=.5;rate=9;
  }else if(u.kind==='z'){
    const t=u.ztype,run=t==='runner';
    f.ph+=sp*dt*(run?.15:.24);
    const s=Math.sin(f.ph),c=Math.cos(f.ph);
    if(run){const A=clamp(sp/50,0,1);
      p.hL=s*1.1*A;p.hR=-s*1.1*A;p.kL=-(Math.max(0,c)*1.3+.15)*A;p.kR=-(Math.max(0,-c)*1.3+.15)*A;
      p.lean=-.2-.42*A;p.sLz=.7-s*1.05*A;p.sRz=.7+s*1.05*A;p.eL=p.eR=1.1;p.hz=.5;p.by=Math.abs(c)*1.1*A;p.hy=Math.sin(now*9+f.seed)*.15;
    }else{const A=clamp(sp/15,0,1),br=t==='brute';
      p.hL=s*.5*A;p.hR=-s*.3*A;p.kL=-Math.max(0,c)*.7*A;p.kR=-.12;p.by=Math.abs(c)*.5*A;p.br=s*.13*A+(f.seed>5?.09:-.07);
      p.lean=-.26+Math.sin(now*1.3+f.seed)*.05;
      p.sLz=1.28+Math.sin(now*1.7+f.seed)*.14;p.sRz=(f.seed%2>1?1.1:.35)+Math.sin(now*1.3+f.seed*2)*.16;p.eL=.25;p.eR=.4;p.hz=.22;p.hy=Math.sin(now*.9+f.seed)*.3+(f.seed-5)*.06;
      if(br){p.sLx=.55;p.sRx=-.55;p.sLz=.9;p.sRz=.9;p.lean=-.18;}
    }
    if(u.anim==='feed'){p.by=-6.3;p.hL=p.hR=1.65;p.kL=p.kR=-2.5;p.lean=-.95+Math.sin(now*5+f.seed)*.08;p.sLz=p.sRz=.9;p.eL=.6+Math.sin(now*7)*.3;p.eR=.6+Math.cos(now*7)*.3;p.hz=-.25;}
    else if(u.anim==='bang'){p.sLz=1.75+Math.sin(now*9+f.seed)*.55;p.sRz=1.75+Math.sin(now*9+f.seed+PI)*.55;p.eL=p.eR=.4;p.lean=-.32;}
    else if(u.anim==='tramp'){p.sLz=2.6+Math.sin(now*6)*.5;p.sRz=2.6+Math.cos(now*6)*.5;p.hL=.3;p.hR=-.3;}
    if(u.burning){p.sLz=2.4+Math.sin(now*11+f.seed)*.6;p.sRz=2.4+Math.cos(now*10)*.6;}
    if(u.as==='wind'){const w=clamp(u.at/u.windDur,0,1);p.lean=-.05+.3*w;p.sLz=p.sRz=1.4+1*w;p.eL=p.eR=.7;p.hz=-.15;rate=18;}
    else if(u.as==='strike'){p.lean=-.8;p.sLz=p.sRz=1.25;p.eL=p.eR=.1;p.by=-.9;p.hz=.55;p.hL=.6;p.hR=-.5;rate=34;}
    if(u.stag>0){const k=Math.min(1,u.stag/.25);p.lean=.55*k;p.sLz=p.sRz=1.9;p.hz=-.5*k;p.hL=.45*k;p.hR=.1;p.by=-.3;rate=30;}
  }else{
    f.ph+=sp*dt*.165;
    const s=Math.sin(f.ph),c=Math.cos(f.ph),A=clamp(sp/52,0,1);
    p.hL=s*.95*A;p.hR=-s*.95*A;p.kL=-(Math.max(0,c)*1.25+.12)*A;p.kR=-(Math.max(0,-c)*1.25+.12)*A;
    p.sLz=-s*.85*A+.03;p.sRz=s*.85*A+.03;p.eL=p.eR=.2+.75*A;p.lean=-.2*A;p.by=Math.abs(c)*.9*A-.2*A+Math.sin(now*2+f.seed)*.1*(1-A);p.twist=s*.12*A;
    if(A<.1)p.hy=Math.sin(now*.7+f.seed)*.22;
    const melee=f.wname&&f.wname!=='pistol'&&f.wname!=='shotgun';
    if(melee){p.sRz=.3+s*.2*A;p.sRx=-.12;p.eR=1.5;p.wR=-.25;}
    if(u.anim==='wave'){p.sLz=2.9+Math.sin(now*9)*.25;p.sLx=Math.sin(now*9)*.3;p.sRz=melee?2.5+Math.sin(now*4)*.2:2.9+Math.cos(now*9)*.25;p.eR=.3;p.eL=.2;p.wR=-.9;}
    else if(u.anim==='panic'){p.sLz=2.7+s*.45;p.sRz=2.7-s*.45;p.eL=p.eR=.35;p.sLx=-.3;p.sRx=.3;}
    else if(u.anim==='cower'){p.by=-5.4;p.hL=p.hR=1.5;p.kL=p.kR=-2.3;p.lean=-.6;p.sLz=p.sRz=2.4;p.eL=p.eR=2;p.hz=-.4;}
    else if(u.anim==='crank'){p.sRz=1.25+Math.sin(now*7)*.45;p.sLz=1.25+Math.sin(now*7+PI)*.45;p.eR=p.eL=.7;p.lean=-.22;p.wR=0;}
    if(u.shootT!==undefined&&u.shootT<.9){
      const rc=u.shootT<.13?1-u.shootT/.13:0;
      p.sRz=1.5+rc*.5;p.sRx=.28;p.eR=.06;p.wR=0;p.sLz=1.45+rc*.4;p.sLx=-.5;p.eL=.25;p.lean=.14*rc;p.twist=0;
    }
    if(u.atk){
      const k=u.atk.t/u.atk.dur,ty=u.atk.type,w=clamp(k/.22,0,1),st=clamp((k-.22)/.26,0,1),rc=clamp((k-.55)/.45,0,1);
      rate=40;
      if(!melee){ // fists
        const R=ty!==1;p[R?'sRz':'sLz']=.4+1.2*Math.sin(Math.min(1,k/.45)*PI);p[R?'eR':'eL']=1.4-1.3*Math.sin(Math.min(1,k/.45)*PI);p.twist=(R?1:-1)*.5*Math.sin(Math.min(1,k/.5)*PI);p[R?'sLz':'sRz']=.5;p[R?'eL':'eR']=1.6;p.lean=-.18;p.hL=.4;p.hR=-.3;
      }else if(ty===2){ // overhead smash
        const up=1-st;p.sRz=.75+2.25*up*w;p.sLz=.75+2.1*up*w;p.sRx=.35;p.sLx=-.45;p.eR=.45*up;p.eL=.5;p.wR=-.9*st-.2;p.lean=.28*w*up-.6*st*(1-rc);p.by=-1.4*st*(1-rc);p.hL=.55*st;p.hR=-.45*st;
      }else{
        const dir=ty===0?1:-1,tw=(-.95*w+1.95*st)*(1-rc);
        p.twist=dir*tw;p.sRz=1.35;p.sRx=dir>0?(-.95*w+1.7*st)*(1-rc*.6):(.85*w-1.75*st)*(1-rc*.6);p.eR=.3;p.wR=-1.25;
        p.sLz=1.05;p.sLx=-.6;p.eL=.7;p.lean=-.16;p.hL=.5*st;p.hR=-.4*st;
      }
    }
    if(u.dashT>0){p.lean=-.75;p.hL=.95;p.hR=-.85;p.kR=-1.3;p.sLz=-1;p.sRz=melee?.3:-1;p.by=-1;rate=40;}
    if(u.hurtT>0){p.lean+=.35;p.hz=-.35;}
    if(u.lying){for(const k of PK)p[k]=0;p.sLx=-.25;p.sRx=.25;rate=40;}
  }
  const k=1-Math.exp(-rate*dt),cu=f.cur,J=f.j;
  for(const key of PK)cu[key]+=(p[key]-cu[key])*k;
  J.body.position.y=cu.by;J.body.rotation.x=cu.br;
  J.chest.rotation.z=cu.lean;J.chest.rotation.y=cu.twist;
  J.head.rotation.z=cu.hz;J.head.rotation.y=cu.hy;
  J.sL.rotation.z=cu.sLz;J.sL.rotation.x=cu.sLx;J.sR.rotation.z=cu.sRz;J.sR.rotation.x=cu.sRx;
  J.eL.rotation.z=cu.eL;J.eR.rotation.z=cu.eR;J.handR.rotation.z=cu.wR;
  J.hL.rotation.z=cu.hL;J.hR.rotation.z=cu.hR;J.kL.rotation.z=cu.kL;J.kR.rotation.z=cu.kR;
  // root: position, facing, falling over
  let fall=0,lift=0;
  if(u.dead){const kk=ease(Math.min(1,u.deadT/.42));fall=(u.fallDir||1)*kk*PI/2;lift=1.9*kk;}
  else if(u.lying){fall=PI/2;lift=u.lyingH||0;}
  else if(u.upT>0){const kk=ease(u.upT/.9);fall=kk*PI/2;lift=(u.lyingH||0)*kk;}
  f.g.position.set(u.x,(u.z||0)+lift,u.y);f.g.rotation.set(0,-u.ang,fall);
  if(f.flash>0){f.flash=Math.max(0,f.flash-dt*7);f.mat.emissive.setScalar(f.flash*.9);}
}
