"use strict";
/* D-Day, Version 213: the weapon in your hands in first person. Bryan, on the pictures of first person as it was: "The 1st person looks bad. The
   gun looks to archaic and really bad graphics"; then: "If you can improve the first person mode from what you showed me before that would be
   awesome". It was the few boxes made for the rifles on the bunks (ddmeta.js's ddmGun). These are modelled for the view from behind them: a
   shaped walnut stock, the receiver, sights you can aim through, the barrel and what hangs under it, and the soldier's two arms and hands on it.
   fpGunModel(kind): 'garand' the M1 rifle, 'bar' the automatic rifle, 'spring' the scoped Springfield. The barrel lies along +x, up is +y,
   +z is the shooter's right. userData.flash is the muzzle flash, userData.sight the height of the line of sight above the model's origin. */
function fpGunTex(){
  if(fpGunTex.t)return fpGunTex.t;const T=THREE,r=rng(7719);
  const wood=canvasTex(256,64,(q,w,h)=>{const g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,'#7a4a26');g.addColorStop(.5,'#5e3418');g.addColorStop(1,'#4a2810');q.fillStyle=g;q.fillRect(0,0,w,h);
    for(let i=0;i<70;i++){q.strokeStyle=`rgba(${r()<.5?'30,14,4':'150,92,48'},${.06+r()*.16})`;q.lineWidth=.5+r()*1.6;q.beginPath();let y=r()*h;q.moveTo(0,y);for(let x=0;x<=w;x+=32){y+=(r()-.5)*5;q.lineTo(x,y);}q.stroke();}
    for(let i=0;i<5;i++){q.fillStyle=`rgba(28,12,4,${.12+r()*.14})`;q.beginPath();q.ellipse(r()*w,r()*h,10+r()*18,2+r()*3,0,0,7);q.fill();}});
  const cloth=canvasTex(64,64,(q,w,h)=>{q.fillStyle='#5b5f3e';q.fillRect(0,0,w,h);for(let i=0;i<900;i++){q.fillStyle=`rgba(${r()<.5?'20,24,10':'150,154,110'},${.05+r()*.1})`;q.fillRect(r()*w,r()*h,1,1+r()*2);}});
  wood.wrapS=wood.wrapT=cloth.wrapS=cloth.wrapT=T.RepeatWrapping;return fpGunTex.t={wood,cloth};
}
function fpGunModel(kind){
  const T=THREE,g=new T.Group(),X=fpGunTex();
  const wood=new T.MeshStandardMaterial({map:X.wood,color:0xffffff,roughness:.5,metalness:.05}),steel=new T.MeshStandardMaterial({color:0x565c63,roughness:.5,metalness:.45}),
    dark=new T.MeshStandardMaterial({color:0x2e3236,roughness:.55,metalness:.35}),skin=new T.MeshStandardMaterial({color:0xc9997a,roughness:.75}),
    sleeve=new T.MeshStandardMaterial({map:X.cloth,color:0xffffff,roughness:.95}),web=new T.MeshStandardMaterial({color:0x8a8256,roughness:.9});
  const A=(geo,m,x,y,z,rx,ry,rz)=>{const q=new T.Mesh(geo,m);q.position.set(x,y,z);q.rotation.set(rx||0,ry||0,rz||0);q.frustumCulled=false;g.add(q);return q;};
  const tube=(m,x0,x1,y,z,r0,r1,n)=>A(new T.CylinderGeometry(r1==null?r0:r1,r0,x1-x0,n||14),m,(x0+x1)/2,y,z,0,0,-Math.PI/2);   // (a cylinder along x, r0 at x0)
  const limb=(m,a,b,r0,r1)=>{const va=new T.Vector3(...a),vb=new T.Vector3(...b),d=vb.clone().sub(va),q=new T.Mesh(new T.CylinderGeometry(r1,r0,d.length(),12),m);   // (a tapered cylinder from a to b)
    q.position.copy(va).addScaledVector(d,.5);q.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),d.clone().normalize());q.frustumCulled=false;g.add(q);return q;};
  const bar=kind==='bar',spr=kind==='spring',L=bar?14.6:spr?13.4:13;   // (where the muzzle is)
  // the stock: its side shape, pushed through and rounded off
  {const s=new T.Shape(),P=bar?[[-10.6,-2.5],[-10.6,.5],[-6.4,1],[-4.2,.55],[-2.2,.8],[2.2,.8],[2.2,-.55],[-2,-.8],[-3.4,-2.4],[-4.6,-2.5],[-4.9,-1.2],[-6.4,-1.5]]
      :[[-11,-2.6],[-11,.4],[-6.6,.92],[-4.3,.5],[-2.2,.75],[8.2,.75],[8.2,-.3],[1.2,-.62],[-2,-.9],[-3.5,-1.55],[-5,-1.25],[-6.6,-1.55]];
    s.moveTo(P[0][0],P[0][1]);for(const p of P.slice(1))s.lineTo(p[0],p[1]);s.closePath();
    const geo=new T.ExtrudeGeometry(s,{depth:1.25,bevelEnabled:true,bevelSize:.2,bevelThickness:.2,bevelSegments:3,steps:1});geo.translate(0,0,-.625);
    {const uv=geo.attributes.uv;for(let i=0;i<uv.count;i++)uv.setXY(i,uv.getX(i)/9,uv.getY(i)/3.2);}A(geo,wood,0,0,0);
    A(new T.BoxGeometry(.3,3.1,1.5),dark,P[0][0]-.1,-1.05,0);}                                              // the butt plate
  if(bar){   // the automatic rifle: a deep steel receiver, a wooden forend under the barrel, the magazine, a folded bipod, a flash hider
    A(new T.BoxGeometry(6.4,2.1,1.35),steel,-.6,1.1,0);A(new T.BoxGeometry(6,.35,1.1),dark,-.6,2.2,0);
    A(new T.BoxGeometry(1.5,3,1),dark,.4,-1.4,0,0,0,.06);A(new T.BoxGeometry(1.7,.4,1.15),steel,.4,-2.9,0,0,0,.06);
    tube(wood,2.6,7.4,.5,0,.92,.8,10).scale.set(1,1,1.25);tube(steel,2.6,L-1.6,1.45,0,.4,.36);tube(dark,L-1.6,L,1.45,0,.52,.6,12);
    tube(steel,3,9.6,.95,0,.3);for(const s of[-1,1]){limb(dark,[9.8,1.3,s*.5],[L-1.9,.6,s*.75],.16,.16);A(new T.BoxGeometry(.6,.2,.5),dark,L-1.8,.5,s*.8);}
    A(new T.BoxGeometry(.9,.5,1.5),dark,9.8,1.35,0);
  }else{   // the rifles: the receiver, the handguard over the barrel, the barrel
    A(new T.BoxGeometry(5.2,.85,1.3),steel,-1,1.17,0);A(new T.BoxGeometry(2.6,.3,1.1),dark,-2.2,1.72,0);
    tube(wood,spr?1.8:2.4,spr?6.4:8,1.12,0,.68,.6,10);tube(steel,1.4,L,1.25,0,.36,.3);
    if(!spr){tube(steel,8.2,L-.5,.62,0,.31);A(new T.BoxGeometry(.5,1,.9),steel,8.5,.95,0);A(new T.BoxGeometry(.45,.9,.8),steel,L-.75,.95,0);   // the gas cylinder under it, and its two bands
      A(new T.CylinderGeometry(.16,.16,.9,8),steel,-.5,1.3,.85,Math.PI/2);A(new T.SphereGeometry(.24,8,6),steel,-.5,1.3,1.3);}                    // the operating handle
    else{limb(steel,[-2.6,1.2,.6],[-3.1,.5,1.5],.14,.14);A(new T.SphereGeometry(.3,10,8),steel,-3.15,.42,1.6);}                                    // the bolt handle, turned down
  }
  // under it: the trigger guard and the trigger
  {const tg=new T.Mesh(new T.TorusGeometry(.72,.09,6,14,Math.PI),dark);tg.position.set(bar?-2.2:-1.2,bar?-.8:-.72,0);tg.rotation.set(0,0,Math.PI);tg.frustumCulled=false;g.add(tg);
    A(new T.BoxGeometry(.14,.6,.2),dark,bar?-2.3:-1.3,bar?-1.15:-1.05,0,0,0,.25);}
  // the sights: an aperture at the back between two ears, a blade at the front between two wings (the Springfield has its scope instead)
  let sight=2.12;
  if(spr){sight=2.75;tube(dark,-3.6,4,2.75,0,.52);tube(dark,-4.6,-3.6,2.75,0,.7,.56);tube(dark,4,5.4,2.75,0,.56,.78);
    for(const x of[-2.2,2.2]){A(new T.BoxGeometry(.5,1,.5),dark,x,1.95,0);A(new T.TorusGeometry(.56,.1,6,14),dark,x,2.75,0,0,Math.PI/2);}A(new T.CylinderGeometry(.22,.22,.5,8),dark,.2,3.4,0);
  }else{const rx=bar?-3:-3.1;A(new T.BoxGeometry(.9,.36,1.1),dark,rx,1.6,0);for(const s of[-1,1])A(new T.BoxGeometry(.4,.5,.1),dark,rx,1.98,s*.46);
    A(new T.TorusGeometry(.27,.04,6,20),dark,rx,sight,0,0,Math.PI/2);
    const fx=L-(bar?2.2:.9);A(new T.BoxGeometry(.7,.42,.7),dark,fx,1.68,0);A(new T.BoxGeometry(.5,.62,.1),dark,fx,sight-.02,0);for(const s of[-1,1])A(new T.BoxGeometry(.5,.7,.1),dark,fx,2.05,s*.36,s*-.3);}
  // the sling, along the left side
  limb(web,[-9.6,-1.9,-.72],[6.6,-.5,-.72],.11,.11);
  // his arms: the right hand round the wrist of the stock, a finger at the trigger; the left under the forend
  {const gx=bar?-4.1:-4,gy=bar?-1.7:-1.25;
    limb(sleeve,[-13,-7.5,6.5],[gx-1.2,gy-.7,1.5],2.1,1.35);limb(web,[gx-2.1,gy-1.3,2],[gx-1.2,gy-.7,1.5],1.42,1.38);                     // the forearm, and a cuff
    const h=A(new T.SphereGeometry(1,12,9),skin,gx,gy,.55);h.scale.set(1.15,1.25,1);                                                        // the hand
    limb(skin,[gx+.5,gy+.5,.8],[gx+2.3,gy+.55,.5],.3,.25);limb(skin,[gx+.2,gy+.9,.5],[gx+.9,gy+1.7,.2],.32,.27);                           // the trigger finger, the thumb over the wrist
    for(let k=0;k<3;k++)limb(skin,[gx-.2+k*.42,gy-.3-k*.12,.95],[gx-.1+k*.42,gy-.9-k*.1,-.5],.29,.26);                                     // the other fingers, wrapped round
    const fx=bar?5:4.6,fy=bar?-.55:-.45;
    limb(sleeve,[-5,-8.5,-7.5],[fx-.9,fy-1.3,-1.1],2,1.3);limb(web,[fx-1.8,fy-2.1,-1.9],[fx-.9,fy-1.3,-1.1],1.36,1.32);
    const p=A(new T.SphereGeometry(1,12,9),skin,fx,fy-.25,-.1);p.scale.set(1.5,.62,1.05);                                                   // the palm under the forend
    for(let k=0;k<4;k++)limb(skin,[fx-.9+k*.55,fy-.2,.55],[fx-.85+k*.55,fy+.75,.82],.28,.24);                                              // his fingers up its right side
    limb(skin,[fx-.4,fy-.1,-.8],[fx+.5,fy+.85,-.86],.31,.26);}                                                                              // his thumb up its left
  // the muzzle flash
  {const fm=new T.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.92,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),f=new T.Group();f.position.set(L+1.6,bar?1.45:1.25,0);
    for(const r of[0,Math.PI/3,-Math.PI/3]){const q=new T.Mesh(new T.PlaneGeometry(4.2,1.7),fm);q.rotation.x=r;q.frustumCulled=false;f.add(q);}
    const c=new T.Mesh(new T.CircleGeometry(1.1,10),fm);c.rotation.y=Math.PI/2;c.frustumCulled=false;f.add(c);f.visible=false;g.add(f);g.userData.flash=f;}
  g.userData.own=true;g.userData.sight=sight;g.userData.hand=true;return g;
}
