// D-Day, Version 198: the checkpoint at the top of the first path (Bryan, after Version 197: "build a machine gun nest and a fortified outpost
// on the top of the first hill, which is a controllable objective. The camera wouldn't switch up the second hill until the second objective is
// taken"; the look settled over fourteen drafts, docs/drafts/v198-outpost-draft-*.jpg, from his own drawing: two walls of sandbags meeting at
// the boulder at the top of the hill, two machine guns on the front one, field-stone walls along the back and the right, an open stone
// shelter in the back corner, boxes and equipment about, a concrete house off to the right for men to come out of, no tent).
// Everything is in beach coordinates (dx, y): add DDX for the world's x.
const DD_POST={A:[743,-69],B:[679,17],F0:[686,19],F1:[739,28],C:[747,30],D:[826,-62],L1:[727,-47],   // (L1: where the left wall of bags stops, short of the stone at the back: the way in from the path)
  sh:{x:796,y:-50,rot:-.84,w:32,d:22},house:{x:886,y:-36,w:36,d:54},door:[854,-36],flag:[684,32],c:[742,-14],
  mg:[{x:712,y:16,ang:Math.PI/2+.3,arc:.8},{x:731,y:19,ang:Math.PI/2-.05,arc:.8}],
  men:[[718,-4,1.9],[746,-24,2.2],[784,-40,2.4]],zone:[664,-92,846,42],reinf:4,every:14};
const ddPostMid=(P,Q,t)=>[P[0]+(Q[0]-P[0])*t,P[1]+(Q[1]-P[1])*t];
// the shelter's corners on the map (its long side turned sh.rot)
function ddPostSh(lx,lz){const S=DD_POST.sh,c=Math.cos(S.rot),s=Math.sin(S.rot);return[S.x+lx*c+lz*s,S.y-lx*s+lz*c];}
function ddPostShWalls(){const S=DD_POST.sh,w=S.w/2,d=S.d/2;return[[ddPostSh(-w,-d),ddPostSh(w,-d)],[ddPostSh(-w,-d),ddPostSh(-w,d)],[ddPostSh(w,-d),ddPostSh(w,d)]];}
// what stands in the way and gives cover: the walls as short runs of low cover (they're drawn by ddPostBuild, so `hid`), the shelter's walls
// and the house solid, two stacks of ammunition boxes (the game's own, drawn as usual)
function ddPostObjects(o){
  const P=DD_POST,run=(A,B,kind,ex)=>{const L=Math.hypot(B[0]-A[0],B[1]-A[1]),n=Math.max(1,Math.ceil(L/10));for(let i=0;i<n;i++){const q=ddPostMid(A,B,(i+.5)/n);o(kind,Math.round(q[0]-5),Math.round(q[1]-5),10,10,Object.assign({hid:true,post:1},ex||{}));}};
  run(P.L1,P.B,'sandbag');run(P.F0,P.F1,'sandbag');
  run(P.A,P.D,'sandbag',{stone:1});run(P.C,ddPostMid(P.C,P.D,.3),'sandbag',{stone:1});run(ddPostMid(P.C,P.D,.6),P.D,'sandbag',{stone:1});
  for(const[a,b]of ddPostShWalls())run(a,b,'ddconc',{full:true,cover:2,stone:1});
  const H=P.house;o('ddconc',H.x-H.w/2,H.y-H.d/2,H.w,H.d,{hid:true,post:1,full:true,cover:2});
  o('ddcrate',724,-36,18,14,{cover:1});
}
function ddPostStoneTex(){
  if(ddPostStoneTex.t)return ddPostStoneTex.t;const r=rng(4471);
  const t=canvasTex(128,128,(q,w,h)=>{q.fillStyle='#a8a294';q.fillRect(0,0,w,h);
    for(let i=0;i<1300;i++){const v=r();q.fillStyle=v<.5?`rgba(50,46,40,${.1+r()*.2})`:v<.8?`rgba(214,208,192,${.05+r()*.12})`:`rgba(104,112,84,${.05+r()*.1})`;q.beginPath();q.ellipse(r()*w,r()*h,.6+r()*3.4,.6+r()*2.4,r()*3,0,7);q.fill();}
    for(let i=0;i<9;i++){q.strokeStyle=`rgba(40,36,30,${.18+r()*.2})`;q.lineWidth=.6+r()*.6;q.beginPath();let x=r()*w,y=r()*h;q.moveTo(x,y);for(let k=0;k<4;k++){x+=(r()-.5)*26;y+=(r()-.5)*26;q.lineTo(x,y);}q.stroke();}
    for(let i=0;i<14;i++){q.fillStyle=`rgba(96,108,70,${.1+r()*.14})`;q.beginPath();q.ellipse(r()*w,r()*h,3+r()*8,2+r()*5,r()*3,0,7);q.fill();}   // lichen
    const g=q.createLinearGradient(0,0,0,h);g.addColorStop(0,'rgba(255,250,236,.1)');g.addColorStop(1,'rgba(30,26,20,.22)');q.fillStyle=g;q.fillRect(0,0,w,h);});
  t.wrapS=t.wrapT=THREE.RepeatWrapping;return ddPostStoneTex.t=t;
}
// the look, from ddProps (G its group; add, M and the bag's shape are its own)
function ddPostBuild(G,add,M){
  const T=THREE,P=DD_POST,r=rng(911),X=x=>x+DDX,gh=(x,y)=>ddH(X(x),y);
  // the bags: three courses along the two walls, one mesh
  {const bagGeo=ddgBagGeo(),bagM=new T.MeshStandardMaterial({map:ddgTex('burlap'),roughness:1,vertexColors:true}),L=[];
    const wall=(A,B,cs)=>{const len=Math.hypot(B[0]-A[0],B[1]-A[1]),a=Math.atan2(B[1]-A[1],B[0]-A[0]),n=Math.max(2,Math.round(len/8.4));
      for(let c=0;c<cs;c++)for(let k=0;k<n-(c%2);k++){const q=ddPostMid(A,B,(k+.5+(c%2)*.5)/n),j=.94+r()*.12,tone=.8+r()*.26;
        L.push({g:bagGeo,p:[X(q[0]),gh(q[0],q[1])+2.3+c*3.7,q[1]],r:[0,-a+(r()-.5)*.2,(r()-.5)*.08],s:[8.9*j,9.6*j,15.5*j],c:new T.Color(tone,tone*(.97+r()*.05),tone*(.92+r()*.1))});}};
    wall(P.L1,P.B,3);wall(P.F0,P.F1,3);
    for(let k=0;k<7;k++){const x=766+(k%3)*5.6,y=16-((k/3)|0)*4;L.push({g:bagGeo,p:[X(x),gh(x,y)+2.3+((k/3)|0)*3.6,y],r:[0,.3,0],s:[8.9,9.6,15.5],c:new T.Color(.9,.88,.84)});}   // a pile of spare ones
    add(ddgMerge(L,true),bagM,0,0,0);}
  // the stone: field stones laid in courses, each its own size and shade, one mesh
  {const box=new T.BoxGeometry(1,1,1),stM=new T.MeshStandardMaterial({map:ddPostStoneTex(),roughness:.97,vertexColors:true}),L=[];
    const sh=()=>{const v=.5+r()*.34,w=r();return new T.Color(v*(w<.3?1.04:1),v*(w<.3?.98:1),v*(w<.3?.88:.95));};
    const stone=(A,B,hh,th)=>{const len=Math.hypot(B[0]-A[0],B[1]-A[1]),a=Math.atan2(B[1]-A[1],B[0]-A[0]),cs=Math.round(hh/3.4);
      for(let c=0;c<cs;c++){let t=-(c%2)*2.6;while(t<len){const w=4.6+r()*5.4,m=clamp(t+w/2,1.5,len-1.5),q=ddPostMid(A,B,m/len),top=c===cs-1,h=3.3+(top?r()*1.6-.3:0);
          L.push({g:box,p:[X(q[0]),gh(q[0],q[1])+1.7+c*3.4+(top?(h-3.3)/2:0),q[1]],r:[(r()-.5)*.05,-a+(r()-.5)*.1,(r()-.5)*.05],s:[w-.45,h,th*(.84+r()*.3)],c:sh()});t+=w;}}};
    stone(P.A,P.D,10.5,5.4);stone(P.C,ddPostMid(P.C,P.D,.3),10.5,5.4);stone(ddPostMid(P.C,P.D,.6),P.D,10.5,5.4);
    for(const[a,b]of ddPostShWalls())stone(a,b,20.4,5.8);
    add(ddgMerge(L,true),stM,0,0,0);}
  const wood=M(0x6a5438,.9,0),steel=M(0x2a2c2e,.5,.7);
  // the shelter's timbers, the radio on its table, a box stack inside
  {const S=P.sh,g0=gh(S.x,S.y);
    for(let k=0;k<5;k++){const q=ddPostSh(-S.w/2+3+k*(S.w-6)/4,1);add(new T.BoxGeometry(2.2,2.2,S.d+8),wood,X(q[0]),g0+21.6,q[1],S.rot);}
    const t=ddPostSh(-4,-5);add(new T.BoxGeometry(15,1.2,8),wood,X(t[0]),g0+7.4,t[1],S.rot);for(const[ax,az]of[[-10,-8],[2,-8],[-10,-2],[2,-2]]){const q=ddPostSh(ax,az);add(new T.CylinderGeometry(.5,.5,7,5),wood,X(q[0]),g0+3.5,q[1]);}
    const rd=ddPostSh(-6,-5);add(new T.BoxGeometry(6,4.4,3.4),M(0x2e3a30,.6,.3),X(rd[0]),g0+10.2,rd[1],S.rot);const an=ddPostSh(-8,-4);add(new T.CylinderGeometry(.18,.18,18,4),steel,X(an[0]),g0+20,an[1]);
    const cr=ddPostSh(9,-5);add(ddgCrates(14,13,10,r),new T.MeshStandardMaterial({map:ddgTex('crate'),roughness:.88,vertexColors:true}),X(cr[0]),g0,cr[1],S.rot);}
  // drums, jerrycans, a coil of wire
  {const drum=M(0x3c4a36,.7,.3),drum2=M(0x5a3a2a,.8,.2),can=M(0x4a5238,.7,.2);
    for(const[x,y,m]of[[806,-34,drum],[811,-38,drum],[808,-29,drum2]])add(new T.CylinderGeometry(3.1,3.1,9,10),m,X(x),gh(x,y)+4.5,y);
    for(const[x,y,ry]of[[697,6,.3],[700,9,.5],[703,5,-.2]])add(new T.BoxGeometry(3.4,5,1.7),can,X(x),gh(x,y)+2.5,y,ry);
    const c=add(new T.TorusGeometry(4.4,1.3,6,14),M(0x6a6058,.6,.6),X(752),gh(752,-52)+1.4,-52);c.rotation.x=Math.PI/2;}
  // the house: thick concrete, a flat roof with an overhang, an open doorway and a slit either side facing the checkpoint, bags on the roof
  {const H=P.house,conc=new T.MeshStandardMaterial({map:ddConcTex(),color:0xb9b7ae,roughness:.95}),dark=M(0x14161a,1,0),lint=M(0x77766e,.95,0),g=new T.Group(),h0=gh(H.x,H.y)-2;g.position.set(X(H.x),h0,H.y);g.rotation.y=-Math.PI/2;G.add(g);
    const hb=(geo,mat,x,y,z)=>{const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;g.add(m);return m;};
    hb(new T.BoxGeometry(H.d,26,H.w),conc,0,13,0);hb(new T.BoxGeometry(H.d+8,4.5,H.w+8),conc,0,28,0);hb(new T.BoxGeometry(H.d+4,3,H.w+4),lint,0,2,0);
    hb(new T.BoxGeometry(11,19,3),dark,0,9.5,H.w/2-.6);hb(new T.BoxGeometry(15,2.4,2),lint,0,20.2,H.w/2+.4);for(const sx of[-17,17])hb(new T.BoxGeometry(10,2.6,1.2),dark,sx,16,H.w/2+.2);
    hb(new T.CylinderGeometry(1.2,1.2,8,7),M(0x4a4d4a,.6,.5),18,34,-8);
    const bm=new T.MeshStandardMaterial({map:ddgTex('burlap'),color:0xd8c9a0,roughness:1}),bg=new T.SphereGeometry(1,7,5);for(let k=0;k<6;k++){const b=hb(bg,bm,-22+k*8.8,32,H.w/2+2);b.scale.set(4.6,2.1,2.9);}}
  // the flag: theirs red, ours blue once it's taken (ddPostTick)
  {const[fx,fy]=P.flag,f0=gh(fx,fy);add(new T.CylinderGeometry(.5,.5,46,6),M(0x3c3226,.9,0),X(fx),f0+23,fy);
    const fm=new T.MeshStandardMaterial({color:0xb02222,roughness:.9,side:T.DoubleSide,emissive:0xb02222,emissiveIntensity:.25});add(new T.PlaneGeometry(20,12),fm,X(fx)+7,f0+39,fy+7,-Math.PI/4);DD.postFlag=fm;}
  // the two guns on their tripods, pointing down the path; turned up the hill once they're ours
  DD.postGuns=P.mg.map(sp=>{const g=new T.Group();g.position.set(X(sp.x),gh(sp.x,sp.y),sp.y);g.rotation.y=-sp.ang;
    const q=(geo,px,py,pz,rz)=>{const b=new T.Mesh(geo,steel);b.position.set(px,py,pz);if(rz)b.rotation.z=rz;b.castShadow=true;g.add(b);};
    q(new T.CylinderGeometry(.75,.75,17,7),9,11.6,0,Math.PI/2);q(new T.CylinderGeometry(1.25,1.25,7,8),3,11.6,0,Math.PI/2);q(new T.BoxGeometry(5,3,2.2),-2,11.2,0);q(new T.BoxGeometry(3,2.4,4.6),1,10.6,2.6);
    for(const a of[0,2.3,-2.3]){const l=new T.Mesh(new T.CylinderGeometry(.4,.4,13,5),steel);l.position.set(Math.cos(a)*3.4,5.4,Math.sin(a)*3.4);l.rotation.set(Math.sin(a)*.5,0,-Math.cos(a)*.5);g.add(l);}
    G.add(g);return g;});
}
/* ---------- the fight for it ---------- */
// its defenders, with the beach's others (ddplay.js): a gunner on each gun and three riflemen. A handful (Bryan: "Handful of men and a gun is
// just fine. The points should get harder as the map progresses, this is still relatively early on the map")
function ddPostSpawn(){
  const P=DD_POST;for(const g of P.mg)ddGunner('outpost',g);for(const[x,y,a]of P.men)ddFoe('outpost',x,y,{post:true,ang:a});
  dd.post={sent:0,t:6,done:false,guns:P.mg.map(g=>({gx:g.x+DDX,gy:g.y,x:g.x+DDX,y:g.y-7,man:null,going:null,goT:0}))};
}
const DD_POST_UP=-Math.PI/2-.35;   // (up the hill and onto the draw's gun: north, a little west)
// twice a second, with the other troops' thinking (ddplay.js)
function ddPostTick(){
  const S=dd&&dd.post;if(!S||dd.counter||dd.vil)return;const P=DD_POST,held=!!(dd.held||{}).outpost,cx=P.c[0]+DDX,cy=P.c[1];
  if(!held){   // a few more of theirs out of the house, one at a time, once the fight for it has started
    const mine=enemies.filter(e=>e.tag==='outpost'&&!beaten(e)).length;
    if(S.sent<P.reinf&&mine&&mine<5&&dd.allies.some(u=>!u.dead&&!u.inBoat&&hyp(u.x-cx,u.y-cy)<300)&&(S.t-=.5)<=0){
      S.t=P.every;S.sent++;const u=ddFoe('outpost',P.door[0],P.door[1],{ang:Math.PI,name:'Defender'});enemies.push(u);const to=[[752,-14],[740,0],[766,-30],[758,-44]][S.sent%4];
      u.path=findPath(u.x,u.y,to[0]+DDX,to[1])||[];}
    return;}
  if(!S.done){S.done=true;if(DD.postFlag){DD.postFlag.color.setHex(0x2f6fd0);DD.postFlag.emissive.setHex(0x2f6fd0);}for(const g of DD.postGuns||[])g.rotation.y=-DD_POST_UP;}
  // ours now: one of the other troops takes each gun by himself and turns it up the hill (Bryan: "It can be automatically entered by an AI
  // troop and provide mostly an increase in suppression fire"); how the squads' own men work a fixed gun is still to be settled
  ddPostMen(S);
  for(const g of S.guns){
    const m=g.man;if(ddPostMine(m))continue;   // (one of the squads' own men holds it: ddPostMen)
    if(m&&(!alive(m)||m.path.length||m.postGun!==g)){if(m.postGun===g){m.onGun=null;m.gunner=false;m.postGun=null;}g.man=null;}
    const u=g.going;
    if(u){if(!alive(u)||u.postGun!==g||simT-g.goT>40){if(u.postGun===g)u.postGun=null;g.going=null;}
      else if(!u.path.length){g.going=null;if(hyp(u.x-g.x,u.y-g.y)<20&&!g.man){g.man=u;g.idleT=simT;g.manT=simT;u.x=g.x;u.y=g.y;u.ang=DD_POST_UP;u.aimT=simT;u.onGun={x:g.gx,y:g.gy,ang:DD_POST_UP,arc:1.15};u.gunner=true;}else if(g.man||(u.lastOrder??-99)>g.goT+.01)u.postGun=null;   // (taken meanwhile, or you've sent him somewhere else)
        else{const p=findPath(u.x,u.y,g.x,g.y);if(p&&p.length){u.path=p;g.going=u;}else u.postGun=null;}}   // (stopped short of it: on again)
      continue;}
    if(g.man)continue;
    const c=dd.npcs.filter(q=>alive(q)&&!q.inBoat&&!q.onGun&&!q.postGun&&!q.raid&&hyp(q.x-g.x,q.y-g.y)<420).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];if(!c)continue;
    const p=findPath(c.x,c.y,g.x,g.y);if(!p)continue;c.path=p;c.postGun=g;g.going=c;g.goT=simT;}
}

/* ---------- Version 199: the squads' own men on the guns ----------
   Bryan: "A grey circle turns around the empty gun nest and says Enter. Once a unit enters it, the circle turns blue and says control. The
   words will be below the circle. Controlling it enters a first person view that the player can shoot while the squads advance or hold...
   To exit from the enter, either the team just advances to the next location and no more enemies are left to shoot at, or the individual
   unit is dragged off. From control, there is an exit button that exits the pov view. The player will abandon the gun nest if a grenade or
   explosion highlights the area (like normal). Make sure the graphics look nice in POV view" */
const ddPostMine=u=>!!u&&!u.npc&&u.side==='P';
function ddPostOff(g,u,why){   // he's off it (and out of first person if it was him)
  if(!u)return;if(u.postGun===g)u.postGun=null;u.onGun=null;u.gunner=false;if(g.man===u)g.man=null;if(g.going===u)g.going=null;
  if(dd.fp&&dd.fp.u===u&&typeof fpExit==='function')fpExit(why||null);
}
// who he could shoot from it: theirs, up, within its reach and swing, in sight
function ddPostTargets(g){const a=DD_POST_UP;return enemies.filter(e=>!beaten(e)&&e.side==='E'&&hyp(e.x-g.gx,e.y-g.gy)<640&&Math.abs(Math.atan2(Math.sin(Math.atan2(e.y-g.gy,e.x-g.gx)-a),Math.cos(Math.atan2(e.y-g.gy,e.x-g.gx)-a)))<1.15&&los(g.gx,g.gy,e.x,e.y));}
// the squads' men on the guns, with the rest of ddPostTick: seated when he gets there, kept on it while there's something to shoot, off it
// when you order him alone, when his squad has moved on and nothing's left to shoot, or when a shell is coming down on it
function ddPostMen(S){
  for(const g of S.guns){const m=g.man;if(!ddPostMine(m))continue;
    if(!alive(m)||m.postGun!==g){ddPostOff(g,m);continue;}
    if(m.fp){g.manT=simT+.2;continue;}   // (yours to shoot: he stays until EXIT or a shell)
    const T=ddPostTargets(g).length;if(T)g.idleT=simT;
    if(m.path.length||!m.onGun){const ordered=(m.lastOrder??-99)>(g.manT??0)+.01;   // (an order of yours since he sat down; a shift to cover of his own isn't one)
      if(ordered&&(sel.length===1&&sel[0]===m||!T)){ddPostOff(g,m);continue;}
      m.path=[];m.x=g.x;m.y=g.y;m.ang=DD_POST_UP;m.onGun={x:g.gx,y:g.gy,ang:DD_POST_UP,arc:1.15};m.gunner=true;if(ordered)g.manT=simT;}   // (a move of his squad's leaves him on it while there's anything to shoot)
    const o=players.filter(p=>p!==m&&p.team===m.team&&alive(p)&&!p.inBoat&&!p.joining);
    if(o.length&&!T&&simT-(g.idleT??simT)>4){const n=o.slice().sort((a,b)=>hyp(a.x-m.x,a.y-m.y)-hyp(b.x-m.x,b.y-m.y))[0];   // (his nearest squad-mate: one walking up from the beach to join doesn't count as the squad having gone)
      if(hyp(n.x-m.x,n.y-m.y)>200){const p=findPath(m.x,m.y,n.x,n.y+14);ddPostOff(g,m);if(p)m.path=p;}}}
}
// a shell or grenade coming down on a gun: whoever of the squads is on it gets off, so the usual dodge takes him (ddplay.js's ddDodge)
function ddPostBlast(n){
  const S=dd&&dd.post;if(!S||!(dd.held||{}).outpost)return;const R=(n.R||58)+6;
  for(const g of S.guns){const m=g.man;if(!ddPostMine(m)||hyp(g.x-n.x1,g.y-n.y1)>R)continue;ddPostOff(g,m,'Incoming! Off the gun.');m.lastOrder=simT-2;}
}
// a tap on a gun's circle: the nearest free man of the squad you play goes to it (one of the other troops on it gives way); a tap on one
// your man holds takes you into first person on it
function ddPostTap(wx,wy,sx,sy){
  const S=dd&&dd.post;if(!S||!(dd.held||{}).outpost||dd.fp)return false;
  let g=null,bd=40;for(const q of S.guns){toSBack=false;const a=toS(q.gx,q.gy,8),b=toS(q.gx,q.gy+26);if(toSBack)continue;const d=Math.min(hyp(a[0]-sx,a[1]-sy),hyp(b[0]-sx,b[1]-sy+10));if(d<bd){bd=d;g=q;}}
  if(!g)return false;
  if(ddPostMine(g.man)){const u=g.man;u.ang=DD_POST_UP;if(typeof fpEnter==='function'&&fpEnter(u,'1p')){dd.fp.a=DD_POST_UP;dd.fp.p=-.03;const b=document.querySelector('#fp [data-a="back"]');if(b)b.textContent='◀ EXIT';banner('On the gun. EXIT to go back to the squads.',2400);}return true;}
  if(ddPostMine(g.going))return true;
  const c=players.filter(p=>p.team===dd.active&&alive(p)&&!p.inBoat&&!p.joining&&!p.onGun&&!p.postGun&&!p.carry).sort((a,b)=>hyp(a.x-g.x,a.y-g.y)-hyp(b.x-g.x,b.y-g.y))[0];
  if(!c){banner('Nobody free to take the gun.',1800);return true;}
  const p=findPath(c.x,c.y,g.x,g.y);if(!p){banner('Can’t get to the gun.',1800);return true;}
  for(const u of[g.man,g.going])if(u&&u.npc)ddPostOff(g,u);
  Object.assign(c,{path:p,lastOrder:simT,postGun:g,watch:null,supT:null,focus:null});g.going=c;g.goT=simT;return true;
}
// the circles round the guns once the checkpoint is ours: grey and ENTER while none of the squads' men holds it, blue and CONTROL once one does
function ddPostDraw(now){
  const S=dd&&dd.post;if(!S||!(dd.held||{}).outpost||dd.fp||dd.counter||dd.vil)return;
  for(const g of S.guns){const mine=ddPostMine(g.man),going=ddPostMine(g.going),pu=.5+.5*Math.sin(now*4);
    const col=mine?'88,196,246':'205,210,216',a=mine?.95:going?.55+pu*.4:.8;
    gPath(g.gx,g.gy,19);if(toSBack)continue;const q0=toS(g.gx,g.gy),q1=toS(g.gx+19,g.gy),R=Math.max(14,Math.hypot(q1[0]-q0[0],q1[1]-q0[1])),seg=R*Math.PI*2/6;   // a thick ring in six pieces that turns, nothing filled
    ox.save();ox.lineCap='butt';ox.lineWidth=Math.max(4.5,R*.2);ox.strokeStyle='rgba(8,12,16,.45)';ox.stroke();ox.setLineDash([seg*.72,seg*.28]);ox.lineDashOffset=-now*R*(mine?1.5:.8);ox.lineWidth=Math.max(3.5,R*.15);ox.strokeStyle=`rgba(${col},${a})`;ox.stroke();ox.restore();
    toSBack=false;const q=toS(g.gx,g.gy+23);if(toSBack)continue;label(mine?'CONTROL':going?'ENTERING':'ENTER',q[0],q[1]+10,`rgb(${col})`,12,800);}
}
// the gun as you see it from behind it: a belt-fed machine gun on its mount (its barrel along +x, the sights on the line of the eye)
function ddPostFpGun(){
  const T=THREE,g=new T.Group(),gm=new T.MeshStandardMaterial({color:0x33373c,roughness:.42,metalness:.75}),dk=new T.MeshStandardMaterial({color:0x1c1e21,roughness:.5,metalness:.6}),br=new T.MeshStandardMaterial({color:0xb48a38,roughness:.35,metalness:.85}),ol=new T.MeshStandardMaterial({color:0x4a5238,roughness:.8,metalness:.1}),wd=new T.MeshStandardMaterial({color:0x5a4028,roughness:.7});
  const a=(geo,m,x,y,z,rz,rx)=>{const q=new T.Mesh(geo,m);q.position.set(x,y,z);if(rz)q.rotation.z=rz;if(rx)q.rotation.x=rx;q.frustumCulled=false;g.add(q);return q;};
  a(new T.BoxGeometry(9,2.3,1.9),gm,-1.5,0,0);a(new T.BoxGeometry(7.4,.7,2.1),dk,-1.2,1.45,0);                     // the receiver and its top cover
  a(new T.CylinderGeometry(1,1,17,12),gm,11.5,.1,0,Math.PI/2);                                                      // the barrel's jacket
  for(let k=0;k<7;k++)for(const s of[-1,1])a(new T.BoxGeometry(1.5,.5,.25),dk,5+k*2.1,.1,s*.98);                  // its cooling slots
  for(let k=0;k<7;k++)a(new T.BoxGeometry(1.5,.25,.5),dk,5+k*2.1,1.08,0);
  a(new T.CylinderGeometry(1.25,.8,2.2,12),dk,21,.1,0,Math.PI/2);a(new T.CylinderGeometry(.45,.45,.6,8),dk,22.3,.1,0,Math.PI/2);   // the muzzle
  a(new T.BoxGeometry(.5,1.3,.22),dk,18.6,1.75,0);a(new T.BoxGeometry(.9,.3,.8),dk,18.6,1.15,0);                    // the front sight
  for(const s of[-1,1])a(new T.BoxGeometry(.4,.7,.16),dk,-.4,2.1,s*.26);a(new T.BoxGeometry(.7,.25,.9),dk,-.4,1.85,0);          // the rear sight's notch
  a(new T.BoxGeometry(4.6,1.5,1.5),wd,-8.2,-.9,0);a(new T.BoxGeometry(1,2.6,1.2),dk,-4.6,-2,0,.25);                 // the butt and the grip
  a(new T.BoxGeometry(2.2,.5,3.4),dk,.6,.6,-2.4);                                                                    // the feed tray, the belt, the ammunition box
  for(let k=0;k<9;k++)a(new T.CylinderGeometry(.24,.24,1.9,6),br,.6+Math.sin(k*.5)*.25,.9-k*.72-(k>3?(k-3)*.1:0),-2.4-k*.42,Math.PI/2);
  a(new T.BoxGeometry(3.2,3.6,4.4),ol,.6,-7.2,-5.4);
  a(new T.CylinderGeometry(.7,.7,3.4,8),dk,3.5,-2.4,0);a(new T.BoxGeometry(5,.8,3.6),dk,3.5,-4.3,0);                // the mount under it
  for(const[x,z]of[[7.5,0],[.5,3],[.5,-3]]){const l=a(new T.CylinderGeometry(.42,.42,9,6),dk,x,-7.6,z);l.rotation.z=x>3?-.5:.22;l.rotation.x=z?(z>0?-.35:.35):0;}
  const fm=new T.MeshBasicMaterial({color:0xffd27a,transparent:true,opacity:.92,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
  const f=new T.Group();f.position.set(24.5,.1,0);for(const r of[0,Math.PI/3,-Math.PI/3]){const q=new T.Mesh(new T.PlaneGeometry(4.6,1.9),fm);q.rotation.x=r;q.frustumCulled=false;f.add(q);}
  const fc=new T.Mesh(new T.CircleGeometry(1.2,10),fm);fc.rotation.y=Math.PI/2;fc.frustumCulled=false;f.add(fc);f.visible=false;g.add(f);
  g.userData.flash=f;g.userData.own=true;return g;
}
