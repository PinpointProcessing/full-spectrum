// Drafts, round 2, after Bryan's notes on the first (docs/drafts/v224-*): the camp with the men spread about doing their own things; the barracks
// as a small hut crossed the short way, back door to front door, with the other troops firing from its windows and one of them hit; the gun tiles
// with a white arrow and "Man a Gun", an NPC tag, a gun knocked out, BACK and LEAVE GUN behind a gun, and every gun turned on a tapped enemy.
// Staged on today's counterattack map and in a set built here; nothing in the game is changed. node counter-rework-draft2.js OUT [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const OUT=process.argv[2]||'crw2',PORT=+process.argv[3]||9802,W=390,H=760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;R.minLevel=2;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));ddmSave();window.requestAnimationFrame=()=>0;startCounter();});
await page.waitForTimeout(900);
const snap=async n=>{await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});};
const shot=async n=>{await ev(()=>{bigText('');updateCamera();ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();if(window.EXTRA)EXTRA();});await page.waitForTimeout(600);await ev(()=>{updateCamera();render(.001,simT);drawOverlay(.001,simT);if(window.EXTRA)EXTRA();});await snap(n);};
const film=async n=>{await ev(()=>{bigText('');sel=[];dd.active='';updateCamera();ddFrame(1/30,simT);render(.03,simT);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);});await page.waitForTimeout(600);await ev(()=>{updateCamera();render(.001,simT);ox.clearRect(0,0,cw,ch);});await snap(n);};
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(1);
  window.HUD=on=>{for(const q of['#sq','.panel','#ddObj','#top','#ddSwap','#hint','#banner','.top','#ddPool','header'])for(const e of document.querySelectorAll(q))e.style.visibility=on?'':'hidden';};
  window.CAM=(x,y,z,p,yw)=>{dd.track=null;camPan=null;zoom=z;yaw=yw||0;tilt=ddTilt(z,p);camT.x=x;camT.z=y;updateCamera();};});
// ---- the camp, spread out: twos and threes and men on their own across the yard
await ev(()=>{const T=THREE,fx=700,fy=668,g=gndH(fx,fy),G=new T.Group();scene.add(G);window.CAMP=G;
  const M=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r??.9});const add=(geo,m,x,h,y,rx,ry,rz)=>{const q=new T.Mesh(geo,m);q.position.set(x,g+h,y);q.rotation.set(rx||0,ry||0,rz||0);q.castShadow=q.receiveShadow=true;G.add(q);return q;};
  const fire=(x,y,s)=>{for(let k=0;k<4;k++)add(new T.CylinderGeometry(.9*s,.9*s,9*s,7),M(0x4a3524),x,1.2,y,Math.PI/2,k*.8,0);for(let k=0;k<9;k++){const a=k*.7;add(new T.DodecahedronGeometry(1.5*s,0),M(0x77746c),x+Math.cos(a)*5.4*s,.8,y+Math.sin(a)*5.4*s,k,k,0);}
    for(const[r,h,o]of[[3.2,4.6,.9],[2.1,6.4,.75],[1.2,7.8,.6]]){const f=add(new T.ConeGeometry(r*s,h*s,9,1,true),new T.MeshBasicMaterial({color:r>3?0xff6a1c:r>2?0xffa63c:0xffe08a,transparent:true,opacity:o,toneMapped:false,depthWrite:false}),x,h*s/2+1,y);f.castShadow=false;}
    const L=new T.PointLight(0xff8a3c,1.3,130,1.6);L.position.set(x,g+8,y);G.add(L);};
  fire(fx,fy,1);for(const dx of[-3.2,3.2])add(new T.CylinderGeometry(.25,.25,13,5),M(0x2a2a2a,.6),fx+dx,6,fy,0,0,dx>0?.38:-.38);add(new T.CylinderGeometry(2.3,1.9,2.6,10),M(0x24262a,.5),fx,9.4,fy);
  for(let k=0;k<12;k++)add(new T.BoxGeometry(7+((k*5)%3),5.2+((k*3)%2),5.5),M(k%3?0x8d887c:0x777267),fx-96+k*7.6,2.6,fy+44+((k*7)%3)-1,0,((k*13)%7-3)*.04,0);   // the rock wall, off to the left
  for(const[x,y,w,h]of[[fx+58,fy+52,12,7],[fx+70,fy+50,9,9],[fx-60,fy-34,11,6],[fx+96,fy-46,10,7]])add(new T.BoxGeometry(w,h,8),M(0x5f6a44,.8),x,h/2,y,0,.3,0);   // crates to sit on and write at
  add(new T.BoxGeometry(22,.8,9),M(0x9aa08a,.9),fx-104,1,fy-6,0,.2,0);                                                                                            // a stretcher
  const P=players.slice(),put=(u,x,y,a,o)=>u&&Object.assign(u,{x,y,ang:a,path:[],atEase:false,work:null,downed:false,sup:0,covered:false,inBoat:false,afloat:false,joining:false,focus:null,target:null,cool:99,aimT:-9,lx:0,ly:0},o||{});
  // the fire: one cooking, one warming his hands, one standing with a mug
  put(P[0],fx+13,fy+5,Math.PI+.3,{work:'kneel'});put(P[1],fx-12,fy+9,-.5,{work:'kneel'});put(P[2],fx+4,fy-17,Math.PI/2,{atEase:true});
  // the wall: two side by side, talking
  put(P[3],fx-70,fy+36,Math.PI/2+.5,{atEase:true});put(P[4],fx-54,fy+37,Math.PI/2-.5,{work:'stand'});
  // on his own at a crate, cleaning his rifle; on his own, a letter
  put(P[5],fx+62,fy+40,-2.2,{work:'kneel'});put(P[6],fx-56,fy-24,1,{work:'kneel'});
  // the medic with a man on the stretcher (one of the other troops)
  put(P[7],fx-98,fy+6,-1.2,{work:'kneel'});
  const N=dd.npcs.filter(u=>!u.dead);N.forEach(u=>{u.x=fx+500;u.y=fy+80;});const n=i=>N[i];
  put(n(0),fx-104,fy-6,.2,{downed:true,hp:30});
  put(n(1),fx+100,fy-34,2.4,{atEase:true});put(n(2),fx+112,fy-52,-2.6,{work:'stand'});                  // two by a crate up the yard
  put(n(3),fx+30,fy+70,-1.2,{atEase:true});                                                              // one alone, smoking
  [[0,0],[13,4],[25,-2],[6,15],[19,17],[31,12]].forEach(([dx,dy],i)=>put(n(4+i),fx+150+dx,fy-6+dy,Math.PI+.25*(i%3-1),{atEase:i%2===0,work:i%2?'stand':null}));window.NP=N.slice(4,10);   // the bunch that's hit
  for(const g2 of dd.dc.guns){g2.man=null;g2.going=null;}for(const u of[...P,...N.slice(0,10)])figRefresh(u);document.body.classList.add('ddseq');HUD(false);CAM(fx+8,fy+18,6.4,.5);});
await film('c1-camp-wide');
await ev(()=>CAM(690,668,11.5,.34));await film('c2-camp-fire');
await ev(()=>CAM(640,704,11.5,.34));await film('c3-camp-wall');
await ev(()=>{const fx=700,fy=668;for(let k=0;k<5;k++)booms.push({x:fx+152+(k%3)*13,y:fy-4+((k/2)|0)*12,t:-k*.07,size:1.3});for(const u of NP){u.hp=0;u.dead=true;u.deadT=simT;if(Math.random()<.7)ddGore(u,true);}
  for(const u of players){u.atEase=false;u.work=null;u.sup=.8;figRefresh(u);}shake(1);RUN(.28);CAM(fx+96,fy+22,6.4,.5);});
await film('c4-shells');
// ---- the hut: crossed the short way, back door to front door. A set of its own, drawn with the game's renderer
const hut=async(n,stage)=>{await ev(stage);await page.waitForTimeout(500);await ev(()=>{HUTDRAW();});await snap(n);};
await ev(()=>{const T=THREE,sc=new T.Scene();sc.background=new T.Color(0x0a0806);const G=new T.Group();sc.add(G);
  const M=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o||{}));
  const box=(x,h,z,w,t,d,c,o)=>{const m=new T.Mesh(new T.BoxGeometry(w,t,d),c&&c.isMaterial?c:M(c,o));m.position.set(x,h+t/2,z);m.castShadow=m.receiveShadow=true;G.add(m);return m;};
  const HW=78,HD=31,wall=ddmTex(256,256,ddmPlanks('#7a5a3c','#3d2a1a'),5,1),floor=ddmTex(256,256,ddmPlanks('#5a4530','#2a2018'),9,4),WM=M(0xffffff,{map:wall}),FRONT=-HD;
  box(0,-1.6,0,HW*2+10,1.6,HD*2+40,M(0xffffff,{map:floor,roughness:.7}));
  // the front wall, with the door in its middle and a window either side: built round the openings
  const DW=9,WX=28,WW=9,SILL=11,TOP=21,HT=34;
  for(const s of[-1,1]){box(s*(DW+(WX-WW-DW)/2),0,FRONT,WX-WW-DW,HT,2.4,WM);box(s*((WX+WW+HW)/2),0,FRONT,HW-WX-WW,HT,2.4,WM);box(s*WX,0,FRONT,WW*2,SILL,2.4,WM);box(s*WX,TOP,FRONT,WW*2,HT-TOP,2.4,WM);
    box(s*WX,SILL,FRONT+1.5,WW*2+2,.8,2.6,0x3d2a1a);box(s*HW,0,0,2.4,HT,HD*2,WM);}
  box(0,24,FRONT,DW*2,HT-24,2.4,WM);
  // the roof's ties and the lamp
  for(const x of[-52,-18,18,52])box(x,HT-2,0,3,3,HD*2,0x4a3523);box(0,HT+1,-70,HW*2+60,2,HD*2+190,0x2c2018);
  const lamp=new T.Mesh(new T.SphereGeometry(1.2,10,8),M(0xfff0c0,{emissive:0xffd890,emissiveIntensity:2.2}));lamp.position.set(-40,27,6);G.add(lamp);const LL=new T.PointLight(0xffc98a,.9,120,1.4);LL.position.set(-40,26,6);G.add(LL);
  // bunks either side of the way through, their long sides to it
  for(const s of[-1,1])for(const bx of[26,48,70])for(const bz of[10])for(const h of[5,16]){const x=s*bx;box(x,h,bz,11,1,34,0x30342c);box(x,h+1,bz,10.2,2.2,32,0xb5ad92);box(x,h+3.2,bz+12,8,1.6,5,0xe6e0cc);box(x,h+3.2,bz-2,10.4,.6,20,0x4f5d3c);
    for(const dx of[-5.5,5.5])for(const dz of[-16.5,16.5])box(x+dx,0,bz+dz,1.1,24,1.1,0x30342c,{metalness:.4});}
  box(-58,0,-20,16,8,9,0x6b4a2c);box(-58,8,-20,18,1,11,0x7a5632);box(60,0,-21,12,6,8,0x46532f);box(61,6,-21,12.5,.7,8.5,0x38432a);   // a table, a trunk
  // outside: bright sky and the field, seen through the door and the windows
  const sky=ddmTex(64,64,(q,w,h)=>{const gr=q.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#cfe2f2');gr.addColorStop(.52,'#e9eef0');gr.addColorStop(.53,'#7fa05a');gr.addColorStop(1,'#56783c');q.fillStyle=gr;q.fillRect(0,0,w,h);});
  const out=new T.Mesh(new T.PlaneGeometry(520,150),new T.MeshBasicMaterial({map:sky,toneMapped:false}));out.position.set(0,34,FRONT-90);G.add(out);
  const door=new T.Group();door.position.set(-DW,0,FRONT);G.add(door);const leaf=new T.Mesh(new T.BoxGeometry(DW*2,24,1),M(0x4a3523));leaf.position.set(DW,12,0);leaf.castShadow=true;door.add(leaf);
  G.add(new T.HemisphereLight(0xa8b8c8,0x3a2c1e,.5));
  const day=new T.SpotLight(0xfff4dc,2.6,260,.55,.5,1);day.position.set(0,26,FRONT-80);day.target.position.set(0,0,30);day.castShadow=true;day.shadow.mapSize.set(1024,1024);day.shadow.bias=-.002;G.add(day,day.target);
  const cam=new T.PerspectiveCamera(66,cw/ch,1,900);
  const mk=(id,x,z,ang,o)=>{const u=Object.assign({side:'P',team:id[0]==='B'?'B':'A',id,name:id,x,y:z,ang,path:[],hp:100,level:2,weapon:'rifle',spec:null,specN:0,lx:0,ly:0,cloth:DD_US,ddRole:'rifle',stats:{}},o||{});
    makeSoldier(u);moveMesh(u,G);ddDayFig(u);u.m.g.traverse(q=>{q.frustumCulled=false;});if(u.m.spot)u.m.spot.intensity=0;if(u.m.beam)u.m.beam.visible=false;if(u.m.ring)u.m.ring.visible=false;return u;};
  const squad=[];for(let i=0;i<8;i++)squad.push(mk((i<4?'A':'B')+(i%4+1),0,0,-Math.PI/2));
  const guard=[mk('N1',-WX+1,FRONT+8,-Math.PI/2,{npc:true}),mk('N2',WX-1,FRONT+8,-Math.PI/2,{npc:true}),mk('N3',-DW-6,FRONT+7,-Math.PI/2+.5,{npc:true}),mk('N4',WX+9,FRONT+9,-Math.PI/2-.3,{npc:true})];
  const flash=[];for(let i=0;i<3;i++){const f=new T.Mesh(new T.SphereGeometry(1.5,8,6),new T.MeshBasicMaterial({color:0xffe9a0,toneMapped:false}));f.visible=false;G.add(f);flash.push(f);}
  const blood=new T.Mesh(new T.CircleGeometry(7,18),new T.MeshBasicMaterial({color:0x5a0f0c,transparent:true,opacity:.85}));blood.rotation.x=-Math.PI/2;blood.position.set(-WX+2,.15,FRONT+20);blood.visible=false;G.add(blood);
  window.HUT={sc,G,cam,squad,guard,door,flash,blood,FRONT,WX};
  // everyone posed by stepping the figures' own clock: the squad at a run toward the front door from where `at` puts each of them
  window.HUTPOSE=(at,o)=>{const S=HUT;o=o||{};for(let k=0;k<14;k++){simT+=1/30;S.squad.forEach((u,i)=>{const p=at(i);u.x=p[0];u.y=p[1]+(13-k)*1.8;u.ang=-Math.PI/2;u.path=[{x:u.x,y:u.y-40}];});
      S.guard.forEach((u,i)=>{if(o.dead===i){Object.assign(u,{dead:true,hp:0,x:-S.WX+3,y:S.FRONT+19,ang:1.2});}else u.aimT=simT;});
      for(const u of[...S.squad,...S.guard]){u.m.g.position.set(u.x,0,u.y);u.m.g.rotation.y=-u.ang;figRefresh(u);figAnimate(u,u.m);}}
    S.door.rotation.y=o.door||0;S.flash.forEach((f,i)=>{const u=S.guard[i];f.visible=!!(o.fire&&o.fire.includes(i)&&!u.dead);f.position.set(u.x+Math.cos(u.ang)*9,13.5,u.y+Math.sin(u.ang)*9);});S.blood.visible=o.dead!=null;
    S.cam.position.set(...(o.cam||[3,27,112]));S.cam.lookAt(...(o.look||[0,10,S.FRONT]));S.cam.aspect=cw/ch;S.cam.fov=o.fov||66;S.cam.updateProjectionMatrix();S.cam.updateMatrixWorld();};
  window.HUTDRAW=()=>{postRender(HUT.sc,HUT.cam);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);};});
const col=(z0,gap)=>i=>[[-3,3,-4,4,-2,3,-4,2][i],z0+i*gap+(i%2)*3];
await hut('h1-in-the-back',()=>HUTPOSE((z=>i=>[(i%2?4.5:-4.5)+(i%3-1),z+(i>>1)*9+(i%2)*3])(4),{fire:[0],door:0}));
await hut('h2-across',()=>HUTPOSE((z=>i=>[(i%2?4.5:-4.5)+(i%3-1),z+(i>>1)*9+(i%2)*3])(-24),{fire:[1,2],door:-1.3}));
await hut('h3-out-the-door',()=>HUTPOSE((z=>i=>[(i%2?3.5:-3.5),z+(i>>1)*9+(i%2)*3])(-52),{fire:[1],door:-1.5,dead:0,cam:[16,27,76],look:[-6,9,HUT.FRONT]}));
// ---- the guns, round 2
const guns=await ev(()=>{document.body.classList.remove('ddseq');if(window.CAMP)CAMP.visible=false;HUD(true);const G=dd.dc.guns,by=k=>G.find(g=>g.k===k),P=players.filter(alive);for(const u of players){u.atEase=false;u.work=null;u.sup=0;}
  const seat=(u,g)=>{Object.assign(u,{x:g.x,y:g.y+8,path:[],ang:-Math.PI/2});dcMan(u,g);};seat(P[0],by('a1'));seat(P[1],by('w1'));seat(P[2],by('n3'));seat(P[3],by('n1'));P.slice(4).forEach((u,i)=>Object.assign(u,{x:430+i*36,y:560+(i%2)*14,path:[],ang:-Math.PI/2}));
  const E=enemies.filter(e=>!beaten(e));E.forEach((e,i)=>Object.assign(e,{x:380+((i*61)%330),y:40+((i*29)%150),path:[],stunT:1e9}));RUN(2.5);for(const e of enemies)e.stunT=1e9;selectTeam('A');dd.active='A';dcDraw=()=>{};CAM(430,440,4.3,.62);
  window.GK=['a1','w1','n3','n1'];window.TG=E[3];return 1;});
const BAR=`<div id="mockBar" style="position:absolute;left:0;right:0;bottom:0;z-index:60;background:linear-gradient(rgba(10,15,21,0),#0a0f15 26%);padding:26px 8px 10px;font:12px system-ui,Arial;color:#fff">__H__
 <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px">__T__</div>__B__</div>`;
const HEAD=`<div style="display:flex;align-items:center;gap:8px;margin:0 2px 7px;font-size:17px;font-weight:800;letter-spacing:.02em;text-shadow:0 1px 3px #000"><svg width="22" height="26" viewBox="0 0 22 26"><path d="M8 0h6v14h6L11 26 2 14h6z" fill="#fff"/></svg>Man a Gun</div>`;
const tile=(n,who,st,o)=>{o=o||{};const bc=o.on?'#58c4f6':o.bad?'#c0392b':o.tg?'#ffb36b':'#3a4b5c';return`<div style="position:relative;background:${o.on?'#1c3550':o.dead?'#231416':'#16202b'};border:2px solid ${bc};border-radius:9px;padding:6px 2px;text-align:center;min-width:0">${o.npc?'<div style="position:absolute;right:-3px;top:-8px;background:#c0392b;color:#fff;font-size:8px;font-weight:900;border-radius:5px;padding:1px 5px">NPC</div>':''}<div style="font-size:8px;font-weight:800;letter-spacing:.06em;color:${o.on?'#58c4f6':'#9aa6b0'}">${n}</div><div style="font-size:11px;font-weight:800;margin:3px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;color:${o.dead?'#ff8a7e':'#fff'}">${who}</div><div style="font-size:8px;font-weight:800;color:${o.bad||o.dead?'#ff8a7e':st==='FIRING'?'#7ed29a':o.tg?'#ffb36b':'#9aa6b0'}">${st}</div></div>`;};
const btns=(L,R)=>`<div style="display:flex;gap:6px;margin-top:7px"><div style="flex:1;background:#39424b;border-radius:8px;padding:9px 4px;text-align:center;font-weight:800;font-size:11px">${L}</div><div style="flex:1;background:#39424b;border-radius:8px;padding:9px 4px;text-align:center;font-weight:800;font-size:11px">${R}</div></div>`;
const put=async(h,top)=>ev(({h,top})=>{const o=document.querySelector('#mockBar');if(o)o.remove();for(const e of document.querySelectorAll('#sq'))e.style.visibility='hidden';const d=document.createElement('div');d.innerHTML=h;const m=d.firstChild;if(top){m.style.bottom='auto';m.style.top='86px';m.style.background='rgba(10,15,21,.84)';m.style.padding='7px 8px 8px';}document.querySelector('#stage').appendChild(m);},{h,top});
// the start: nothing chosen yet, the arrow, one gun empty
await put(BAR.replace('__H__',HEAD).replace('__T__',[tile('FIELD GUN','Larkin','LOADED'),tile('HEAVY MG','Cobb','FIRING'),tile('MG LOWER L','Rossi','FIRING'),tile('MG LOWER R','Dalton','RELOAD'),tile('HEAVY MG R','empty','TAP TO MAN',{bad:1})].join('')).replace('__B__',btns('RIFLEMEN · HOLD HERE','FALL BACK UP THE STEPS')));
await shot('g1-arrow');
// later: an NPC on a gun (no squad mate left for it), a gun knocked out and its man down, every gun turned on the enemy tapped
await ev(()=>{window.EXTRA=()=>{const e=TG;if(!e)return;toSBack=false;const q=toS(e.x,e.y,10);ox.save();ox.strokeStyle='rgba(255,179,107,.9)';ox.lineWidth=2;ox.setLineDash([7,6]);for(const k of GK){const g=dd.dc.guns.find(z=>z.k===k);if(k==='n1')continue;toSBack=false;const p=toS(g.x,g.y,8);ox.beginPath();ox.moveTo(p[0],p[1]);ox.lineTo(q[0],q[1]);ox.stroke();}
    ox.setLineDash([]);ox.lineWidth=3;ox.strokeStyle='#ff5a4e';ox.beginPath();ox.arc(q[0],q[1],17,0,7);ox.stroke();for(const[a,b2]of[[0,-26],[0,26],[-26,0],[26,0]]){ox.beginPath();ox.moveTo(q[0]+a*.6,q[1]+b2*.6);ox.lineTo(q[0]+a,q[1]+b2);ox.stroke();}
    ox.font='800 11px system-ui,Arial';const t='ALL GUNS ON HIM',w=ox.measureText(t).width+14;ox.fillStyle='rgba(10,14,18,.9)';ox.fillRect(q[0]-w/2,q[1]-52,w,20);ox.fillStyle='#ffb36b';ox.textAlign='center';ox.fillText(t,q[0],q[1]-38);
    const g=dd.dc.guns.find(z=>z.k==='n1');toSBack=false;const p=toS(g.x,g.y,8);ox.fillStyle='rgba(10,14,18,.9)';ox.fillRect(p[0]-52,p[1]-44,104,20);ox.fillStyle='#ff8a7e';ox.fillText('KNOCKED OUT',p[0],p[1]-30);ox.restore();};
  const g=dd.dc.guns.find(z=>z.k==='n1'),u=g.man;if(u){u.onGun=null;u.gunner=false;g.man=null;Object.assign(u,{downed:true,hp:20,x:g.x+12,y:g.y+14});}g.dead=true;booms.push({x:g.x,y:g.y,t:0,size:1});tankFires.push({x:g.x,y:g.y,r:6,t0:simT,puffs:[],emit:0});RUN(.5);});
await put(BAR.replace('__H__','').replace('__T__',[tile('FIELD GUN','Larkin','ON TARGET',{tg:1}),tile('HEAVY MG','Cobb','ON TARGET',{tg:1}),tile('MG LOWER L','Rossi','ON TARGET',{tg:1}),tile('MG LOWER R','destroyed','DALTON DOWN',{dead:1}),tile('HEAVY MG R','Private','FIRING',{npc:1})].join('')).replace('__B__',btns('RIFLEMEN · HOLD HERE','FALL BACK UP THE STEPS')));
await shot('g2-target-npc-destroyed');
// behind a gun: BACK (out of the view, he stays on it) and LEAVE GUN (he gets off it)
await ev(()=>{window.EXTRA=null;const m=document.querySelector('#mockBar');if(m)m.remove();const g=dd.dc.guns.find(q=>q.k==='w1'),u=g.man;enemies.filter(e=>!beaten(e)).forEach((e,i)=>Object.assign(e,{x:g.x-150+((i*47)%300),y:g.y-330+((i*31)%170),path:[],stunT:1e9}));RUN(.2);fpEnter(u,'1p');RUN(.4);const F=dd.fp;if(F){F.a=-Math.PI/2;F.p=-.05;}RUN(.2);});
await put(BAR.replace('__H__','').replace('__T__',[tile('FIELD GUN','Larkin','LOADED'),tile('HEAVY MG','YOU','FIRING',{on:1}),tile('MG LOWER L','Rossi','FIRING'),tile('MG LOWER R','destroyed','DALTON DOWN',{dead:1}),tile('HEAVY MG R','Private','FIRING',{npc:1})].join('')).replace('__B__',btns('‹ BACK<div style="font-size:8px;font-weight:700;color:#9aa6b0;margin-top:2px">he stays on the gun</div>','LEAVE GUN<div style="font-size:8px;font-weight:700;color:#9aa6b0;margin-top:2px">he gets off it</div>')),true);
await ev(()=>{for(const e of document.querySelectorAll('#fp button'))if(/NEXT MAN|3RD|ON THE GUN|COMMAND|LEAVE THE GUN/i.test(e.textContent))e.style.visibility='hidden';});
await shot('g3-behind');
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();process.exit(0);})();
