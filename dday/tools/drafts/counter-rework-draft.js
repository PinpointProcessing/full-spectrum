// Drafts after Version 223 (Bryan: scrap the base and barracks screens after the level-ups; a camp scene, the shelling, the run through the barracks,
// the counterattack met right in front of it; and how the fixed guns should be played): pictures staged on today's counterattack map, with the new
// controls drawn over them as mock-ups. Nothing in the game is changed. node counter-rework-draft.js OUT [port]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');
const OUT=process.argv[2]||'crw',PORT=+process.argv[3]||9801,W=390,H=760;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:W,height:H});const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4011);ddRoster=ddmRead();const R=ddRoster;R.stage=1;R.battles=1;R.minLevel=2;['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,2,false)));ddmSave();window.requestAnimationFrame=()=>0;startCounter();});
await page.waitForTimeout(900);
const shot=async n=>{await ev(()=>{bigText('');updateCamera();ddFrame(1/30,simT);render(.03,simT);drawOverlay(.03,simT);hud();if(window.EXTRA)EXTRA();});await page.waitForTimeout(600);await ev(()=>{updateCamera();render(.001,simT);drawOverlay(.001,simT);if(window.EXTRA)EXTRA();});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});};
const film=async n=>{await ev(()=>{bigText('');sel=[];dd.active='';updateCamera();ddFrame(1/30,simT);render(.03,simT);ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);});await page.waitForTimeout(600);await ev(()=>{updateCamera();render(.001,simT);ox.clearRect(0,0,cw,ch);});await page.waitForTimeout(250);await page.screenshot({path:`${OUT}/${n}.png`});};
await ev(()=>{window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);RUN(1);
  window.HUD=on=>{for(const q of['#sq','.panel','#ddObj','#top','#ddSwap','#hint','#banner','.top','#ddPool','header'])for(const e of document.querySelectorAll(q))e.style.visibility=on?'':'hidden';};
  window.CAM=(x,y,z,p,yw)=>{dd.track=null;camPan=null;zoom=z;yaw=yw||0;tilt=ddTilt(z,p);camT.x=x;camT.z=y;updateCamera();};});
// ---- 1 the camp: the squads round a fire in the yard, the other troops in a bunch to one side
await ev(()=>{const T=THREE,fx=700,fy=668,g=gndH(fx,fy),G=new T.Group();scene.add(G);window.CAMP=G;
  const M=(c,r)=>new T.MeshStandardMaterial({color:c,roughness:r??.9});const add=(geo,m,x,h,y,rx,ry,rz)=>{const q=new T.Mesh(geo,m);q.position.set(x,g+h,y);q.rotation.set(rx||0,ry||0,rz||0);q.castShadow=q.receiveShadow=true;G.add(q);return q;};
  for(let k=0;k<4;k++)add(new T.CylinderGeometry(.9,.9,9,7),M(0x4a3524),fx,1.2,fy,Math.PI/2,k*.8,0);
  for(let k=0;k<9;k++){const a=k*.7;add(new T.DodecahedronGeometry(1.5,0),M(0x77746c),fx+Math.cos(a)*5.4,.8,fy+Math.sin(a)*5.4,k,k,0);}
  for(const[s,h,o]of[[3.2,4.6,.9],[2.1,6.4,.75],[1.2,7.8,.6]]){const f=add(new T.ConeGeometry(s,h,9,1,true),new T.MeshBasicMaterial({color:s>3?0xff6a1c:s>2?0xffa63c:0xffe08a,transparent:true,opacity:o,toneMapped:false,depthWrite:false}),fx,h/2+1,fy);f.castShadow=false;}
  const L=new T.PointLight(0xff8a3c,1.5,150,1.6);L.position.set(fx,g+8,fy);G.add(L);
  for(const dx of[-3.2,3.2])add(new T.CylinderGeometry(.25,.25,13,5),M(0x2a2a2a,.6),fx+dx,6,fy,0,0,dx>0?.38:-.38);add(new T.CylinderGeometry(2.3,1.9,2.6,10),M(0x24262a,.5),fx,9.4,fy);   // the pot on its sticks
  for(let k=0;k<11;k++)add(new T.BoxGeometry(7+((k*5)%3),5.2+((k*3)%2),5.5),M(k%3?0x8d887c:0x777267),fx-58+k*7.6,2.6,fy+34+((k*7)%3)-1,0,((k*13)%7-3)*.04,0);   // the rock wall
  const P=players.slice(),put=(u,x,y,a,o)=>Object.assign(u,{x,y,ang:a,path:[],atEase:false,work:null,sup:0,covered:false,inBoat:false,afloat:false,joining:false,focus:null,target:null,cool:99,aimT:-9,lx:0,ly:0},o||{});
  const at=(k,r)=>[fx+Math.cos(k)*r,fy+Math.sin(k)*r,k+Math.PI];
  [[.3,15,{work:'kneel'}],[1.5,16,{work:'kneel'}],[2.8,15,{work:'stand'}],[4.2,17,{work:'kneel'}],[5.3,20,{atEase:true}]].forEach(([k,r,o],i)=>{const q=at(k,r);put(P[i],q[0],q[1],q[2],o);});
  put(P[5],fx-40,fy+27,Math.PI/2,{atEase:true});put(P[6],fx-18,fy+27,Math.PI/2+.4,{work:'kneel'});put(P[7],fx+34,fy+10,2.6,{atEase:true});
  const N=dd.npcs.filter(u=>!u.dead).slice(0,9);N.forEach((u,i)=>put(u,fx+118+(i%3)*13,fy-22+((i/3)|0)*14,Math.PI+.3*(i%3-1),{atEase:i%2===0,work:i%2?'stand':null}));window.NP=N;
  for(const u of dd.npcs)if(!N.includes(u)){u.x=fx+400;u.y=fy+60;}for(const g2 of dd.dc.guns){g2.man=null;g2.going=null;}for(const u of[...P,...N])figRefresh(u);HUD(false);CAM(fx+2,fy-2,13,.3);});
await film('s1-camp');
await ev(()=>CAM(748,650,6.6,.42));await film('s1-camp-wide');
// ---- 2 the shelling: the bunch of other troops is hit
await ev(()=>{const fx=700,fy=668;for(let k=0;k<5;k++)booms.push({x:fx+118+(k%3)*14,y:fy-20+((k/2)|0)*13,t:-k*.07,size:1.3});for(const u of NP){u.hp=0;u.dead=true;u.deadT=simT;if(Math.random()<.7)ddGore(u,true);}
  for(const u of players){u.atEase=false;u.work=null;u.sup=.8;figRefresh(u);}shake(1);RUN(.28);CAM(770,650,6.6,.42);});
await film('s2-shelling');
// ---- 4 out of the barracks' far door: their men out of the trees, tanks on the road
await ev(()=>{if(window.CAMP)CAMP.visible=false;for(const u of players){u.sup=0;}const en=enemies.filter(e=>!beaten(e));en.forEach((e,i)=>{Object.assign(e,{x:480+((i*53)%440),y:-330+((i*37)%190),path:[],ang:Math.PI/2,stunT:0});e.seen=true;e.vis=true;});
  dd.tanks.forEach((K,i)=>{K.x=700+(i-1)*14;K.y=-360-i*90;K.ang=Math.PI/2;if(K.g){K.g.position.set(K.x,gndH(K.x,K.y),K.y);}});
  players.forEach((u,i)=>Object.assign(u,{x:640+(i%4)*26,y:520+((i/4)|0)*16,ang:-Math.PI/2,path:[]}));CAM(700,330,3.4,.2);});
await film('s4-reveal');
// ---- the guns, as the game has them now, for the control mock-ups: the left of the line in one view
const guns=await ev(()=>{HUD(true);const G=dd.dc.guns,by=k=>G.find(g=>g.k===k),P=players.filter(alive);
  const seat=(u,g)=>{Object.assign(u,{x:g.x,y:g.y+8,path:[],ang:-Math.PI/2});dcMan(u,g);};
  seat(P[0],by('a1'));seat(P[1],by('w1'));seat(P[2],by('n3'));seat(P[3],by('n1'));P.slice(4).forEach((u,i)=>Object.assign(u,{x:430+i*36,y:560+(i%2)*14,path:[],ang:-Math.PI/2}));
  enemies.filter(e=>!beaten(e)).forEach((e,i)=>Object.assign(e,{x:380+((i*61)%330),y:40+((i*29)%150),path:[]}));selectTeam('A');dd.active='A';dcDraw=()=>{};CAM(430,440,4.3,.62);
  window.GN=[['a1','FIELD GUN',P[0].name],['w1','HEAVY MG',P[1].name],['n3','MG · LOWER',P[2].name],['n1','MG · LOWER',P[3].name]];
  RUN(2.5);for(const e of enemies)e.stunT=1e9;window.SEATED=GN.map(([k])=>{const g=by(k);return!!(g.man&&g.man.onGun===g||g.man);});return GN.map(([k])=>{const g=by(k);toSBack=false;const p=toS(g.x,g.y,6);return{k,x:p[0],y:p[1]};});});
console.log(JSON.stringify(guns),JSON.stringify(await ev(()=>SEATED)));
await shot('g0-plain');
// A: Bryan's: a circle round each gun; tap one to get on it; a gun a squad mate holds says who, tap to take his place
await ev(()=>{window.EXTRA=()=>{const now=performance.now()/1000;ox.save();GN.forEach(([k,n,who],i)=>{const g=dd.dc.guns.find(q=>q.k===k);toSBack=false;const p=toS(g.x,g.y,2),you=i===1;
    ox.beginPath();ox.ellipse(p[0],p[1],34,17,0,0,7);ox.lineWidth=3;ox.strokeStyle=you?'#58c4f6':'#ffd76a';ox.setLineDash(you?[]:[7,5]);ox.stroke();ox.setLineDash([]);ox.fillStyle=you?'rgba(88,196,246,.18)':'rgba(255,215,106,.14)';ox.fill();
    ox.font='800 11px system-ui,Arial';const t=you?n+' · YOU':n,s=you?'TAP TO LEAVE':who.toUpperCase()+' · TAP TO TAKE',w=Math.max(ox.measureText(t).width,ox.measureText(s).width)+16,x0=Math.min(Math.max(p[0]-w/2,6),cw-w-6),y0=p[1]-62;
    ox.fillStyle='rgba(10,14,18,.9)';ox.strokeStyle=you?'#58c4f6':'#ffd76a';ox.lineWidth=1.5;ox.beginPath();ox.rect(x0,y0,w,32);ox.fill();ox.stroke();ox.fillStyle=you?'#58c4f6':'#ffd76a';ox.textAlign='left';ox.textBaseline='alphabetic';ox.fillText(t,x0+8,y0+13);ox.fillStyle='#cfd6dc';ox.font='700 9.5px system-ui,Arial';ox.fillText(s,x0+8,y0+26);});ox.restore();};});
await shot('gA-circles');
// B: the guns as seats: a bar of them along the bottom in place of the tools; one tap and you're behind that gun
const BAR=`<div id="mockBar" style="position:absolute;left:0;right:0;bottom:0;z-index:60;background:linear-gradient(rgba(10,15,21,0),#0a0f15 26%);padding:26px 8px 10px;font:12px system-ui,Arial;color:#fff">
 <div style="font-size:9px;font-weight:800;letter-spacing:.1em;color:#ffd76a;margin:0 2px 5px">THE GUNS · TAP ONE TO FIRE IT YOURSELF</div>
 <div style="display:grid;grid-template-columns:repeat(5,1fr);gap:5px">__T__</div>
 <div style="display:flex;gap:6px;margin-top:7px"><div style="flex:1;background:#39424b;border-radius:8px;padding:9px 4px;text-align:center;font-weight:800;font-size:11px">__L__</div><div style="flex:1;background:#39424b;border-radius:8px;padding:9px 4px;text-align:center;font-weight:800;font-size:11px">__R__</div></div></div>`;
const tile=(n,who,st,on,bad)=>`<div style="background:${on?'#1c3550':'#16202b'};border:2px solid ${on?'#58c4f6':bad?'#c0392b':'#3a4b5c'};border-radius:9px;padding:6px 2px;text-align:center;min-width:0"><div style="font-size:8px;font-weight:800;letter-spacing:.06em;color:${on?'#58c4f6':'#9aa6b0'}">${n}</div><div style="font-size:11px;font-weight:800;margin:3px 0 2px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${who}</div><div style="font-size:8px;font-weight:800;color:${bad?'#ff8a7e':st==='FIRING'?'#7ed29a':'#9aa6b0'}">${st}</div></div>`;
const bar=(on,L,R)=>BAR.replace('__T__',[['FIELD GUN','Larkin','LOADED'],['HEAVY MG','Cobb','FIRING'],['MG LOWER L','Rossi','FIRING'],['MG LOWER R','Dalton','RELOAD'],['MG RIGHT','empty','NOBODY ON IT',0,1]].map((t,i)=>tile(t[0],i===on?'YOU':t[1],t[2],i===on,t[4])).join('')).replace('__L__',L).replace('__R__',R);
await ev(h=>{window.EXTRA=null;for(const q of['#sq'])for(const e of document.querySelectorAll(q))e.style.visibility='hidden';const d=document.createElement('div');d.innerHTML=h;document.querySelector('#stage').appendChild(d.firstChild);},bar(-1,'RIFLEMEN · HOLD HERE','FALL BACK UP THE STEPS'));
await shot('gB-bar');
// behind a gun, as the game's first person on a mounted gun is today, with the seats along the bottom
await ev(()=>{const m=document.querySelector('#mockBar');if(m)m.remove();const g=dd.dc.guns.find(q=>q.k==='w1'),u=g.man;enemies.filter(e=>!beaten(e)).forEach((e,i)=>Object.assign(e,{x:g.x-150+((i*47)%300),y:g.y-330+((i*31)%170),path:[],stunT:1e9}));RUN(.2);window.FPU=u?u.name:null;fpEnter(u,'1p');RUN(.4);const F=dd.fp;if(F){F.a=-Math.PI/2;F.p=-.05;}RUN(.2);});
await shot('g1-firstperson-now');
await ev(h=>{const d=document.createElement('div');d.innerHTML=h;const m=d.firstChild;m.style.bottom='auto';m.style.top='86px';m.style.background='rgba(10,15,21,.82)';m.style.padding='7px 8px 8px';document.querySelector('#stage').appendChild(m);for(const e of document.querySelectorAll('#fp button'))if(/NEXT MAN|3RD|ON THE GUN|COMMAND/i.test(e.textContent))e.style.visibility='hidden';},bar(1,'◂ BACK TO THE SQUAD','LEAVE THE GUN'));
await shot('gB-firstperson');
console.log('errors',errors.length,errors.slice(0,4));await b.close();srv.close();process.exit(0);})();
