/* ddcseq.js: Chapter 2's opening (Version 228). Bryan: "a video sequence of the team kneeling, cooking, smoking ... Then all of a sudden artillery
   strikes start hitting the area. A bunch of troops conglomerated on one side are blown up ... The player's squad suits up quick and runs through
   the barracks to the other side"; then: "they should be hanging out in the courtyard from the end of the D-Day mission and run through the barracks
   to the field"; "a lower shot. It would be cool if the camera can zoom into the battlefield directly above the squad's heads when entering the
   battlefield"; "Not skippable"; "NPC Units should be running into the field and begin engaging already when the squad reaches the outside"; "While
   running inside the barracks, NPC units can be seen firing from windows at the enemy, if one can get shot and die while the troops are running".
   dd.seq={dc:true,...} while it plays (the battle goes on ticking under it: ddplay.js's ddTick and ddCam ask for .dc). Phases by game time:
   camp -> shells -> run (to the barracks' back door) -> hut (a small set of its own, drawn in place of the map: dcSeqRender from scene.js's render)
   -> out (the camera from just over their heads at the front door up into the battle's own view) -> the first wave's fight. Not on a retry. */
const DCS={camp:{x:700,y:756},T:{inc:8.2,shell:9.9,fire:10.3,run:10.9,hutMax:3.4,hutDur:3.6,outDur:3.9},   // (the whistle and INCOMING!!!, the shells, their bullets on the base, the run; then how long at most to the door, inside, and coming out)
  // (dx, dy, the way he faces, at ease, what he's doing, a seat under him: 1 a crate, 2 the wall)
  // (Version 237, Bryan: "Make the rest a little longer. Maybe they can chat via text bubble for a couple of seconds") who says what, and when: [the man's place in spots, from, to, the words]
  chat:[[0,1.0,3.2,"Coffee's nearly hot."],[1,2.7,5.0,"First hot thing since England."],[3,4.6,6.8,"Think they'll send us home now?"],[5,6.2,8.1,"Not a chance."]],
  spots:[[14,2,Math.PI,0,'sit',1],[-13,4,0,0,'sit',1],[1,-15,Math.PI/2,0,'kneel',0],[21,18,-2.4,0,'smoke',0],[-37,14,Math.PI/2-.35,0,'sit',2],[-24,14,Math.PI/2+.35,0,'sit',2],[35,-9,-2.6,0,'kneel',0],[-31,-13,.6,0,'smoke',0]]};
function dcSeqStart(){
  if(startCounter.noSeq||/[?&]noseq\b/.test(location.search))return false;   // (?noseq in the address: the tests that start in the fight)
  const c=DCS.camp,T=THREE,g=ddH(c.x,c.y);
  // where the battle's own camera is: the last shot ends there
  updateCamera();const end={p:camera.position.clone(),q:camera.quaternion.clone(),cx:camT.x,cz:camT.z};
  const S=dd.seq={dc:true,t:0,ph:'camp',end,doom:[],seat:[],G:new T.Group()};document.body.classList.add('ddseq');scene.add(S.G);
  players.forEach((u,i)=>{const s=DCS.spots[i%8];u.sx=u.x;u.sy=u.y;Object.assign(u,{x:c.x+s[0],y:c.y+s[1],ang:s[2],path:[],atEase:!!s[3],work:s[4],cool:99});figRefresh(u);S.seat.push(s[5]===1?[u.x,u.y]:null);});
  // a fire, something to sit at
  const M=(col,r)=>new T.MeshStandardMaterial({color:col,roughness:r??.9}),add=(geo,m,x,h,y,rx,ry,rz)=>{const q=new T.Mesh(geo,m);q.position.set(x,g+h,y);q.rotation.set(rx||0,ry||0,rz||0);q.castShadow=q.receiveShadow=true;S.G.add(q);return q;};
  for(let k=0;k<4;k++)add(new T.CylinderGeometry(.9,.9,9,7),M(0x4a3524),c.x,1.2,c.y,Math.PI/2,k*.8,0);for(let k=0;k<9;k++){const a=k*.7;add(new T.DodecahedronGeometry(1.5,0),M(0x77746c),c.x+Math.cos(a)*5.4,.8,c.y+Math.sin(a)*5.4,k,k,0);}
  for(const[r,h,o]of[[3.2,4.6,.9],[2.1,6.4,.75],[1.2,7.8,.6]]){const f=add(new T.ConeGeometry(r,h,9,1,true),new T.MeshBasicMaterial({color:r>3?0xff6a1c:r>2?0xffa63c:0xffe08a,transparent:true,opacity:o,toneMapped:false,depthWrite:false}),c.x,h/2+1,c.y);f.castShadow=false;}
  for(const p of S.seat)if(p)add(new T.BoxGeometry(7,5.2,7),M(0x5f6a44,.8),p[0],2.6,p[1],0,.3,0);                                  // a crate under each man sitting at the fire
  for(let k=0;k<5;k++)add(new T.BoxGeometry(7+((k*5)%3),5+((k*3)%2)*.4,6),M(k%3?0x8d887c:0x777267),c.x-45+k*7.4,2.5,c.y+14+((k*7)%3)*.5,0,((k*13)%7-3)*.04,0);   // the low stone wall two of them sit on
  for(const dx of[-3.2,3.2])add(new T.CylinderGeometry(.25,.25,13,5),M(0x2a2a2a,.6),c.x+dx,6,c.y,0,0,dx>0?.38:-.38);add(new T.CylinderGeometry(2.3,1.9,2.6,10),M(0x24262a,.5),c.x,9.4,c.y);   // a pot over the fire
  for(const[x,y,w,h]of[[c.x+44,c.y-10,10,6],[c.x-62,c.y-4,10,7],[c.x+60,c.y+16,9,8]])add(new T.BoxGeometry(w,h,8),M(0x5f6a44,.8),x,h/2,y,0,.3,0);
  // the bunch of other troops off to one side: the shells land on them
  [[0,0],[13,4],[25,-2],[6,13],[19,15],[31,10]].forEach(([dx,dy],i)=>{const u=ddNpc(c.x-236+dx,c.y-112+dy);Object.assign(u,{inBoat:false,seen:true,post:null,ang:Math.PI+.25*(i%3-1),atEase:i%2===0,work:i%2?'stand':null,cool:99});S.doom.push(u);});
  dcHutBuild(S);banner('',1);S.warm=3;for(const u of players){u.seqD=u.dmgIn;u.dmgIn=.0001;}   // (nothing hurts the squad until the opening hands over)
  try{renderer.compile(S.hut.sc,S.hut.cam);}catch(e){}   // (warm: the inside is drawn once, unseen, while the camp is on screen, so going in doesn't hitch)   // (their first wave starts across the field at once: the other troops are already shooting when the squad comes out)
  return true;
}
// the hut: a small set of its own, crossed the short way from its back door to its front door; four of the other troops at its front windows
function dcHutBuild(S){
  const T=THREE,sc=new T.Scene();sc.background=new T.Color(0x0a0806);const G=new T.Group();sc.add(G);
  const M=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o||{}));
  const box=(x,h,z,w,t,d,c,o)=>{const m=new T.Mesh(new T.BoxGeometry(w,t,d),c&&c.isMaterial?c:M(c,o));m.position.set(x,h+t/2,z);m.castShadow=m.receiveShadow=true;G.add(m);return m;};
  const HW=78,HD=31,wall=ddmTex(256,256,ddmPlanks('#7a5a3c','#3d2a1a'),5,1),floor=ddmTex(256,256,ddmPlanks('#5a4530','#2a2018'),9,4),WM=M(0xffffff,{map:wall}),FRONT=-HD;
  box(0,-1.6,0,HW*2+10,1.6,HD*2+60,M(0xffffff,{map:floor,roughness:.7}));
  const DW=9,WX=28,WW=9,SILL=11,TOP=21,HT=34;
  for(const s of[-1,1]){box(s*(DW+(WX-WW-DW)/2),0,FRONT,WX-WW-DW,HT,2.4,WM);box(s*((WX+WW+HW)/2),0,FRONT,HW-WX-WW,HT,2.4,WM);box(s*WX,0,FRONT,WW*2,SILL,2.4,WM);box(s*WX,TOP,FRONT,WW*2,HT-TOP,2.4,WM);
    box(s*WX,SILL,FRONT+1.5,WW*2+2,.8,2.6,0x3d2a1a);box(s*HW,0,0,2.4,HT,HD*2+60,WM);}
  box(0,24,FRONT,DW*2,HT-24,2.4,WM);
  for(const x of[-52,-18,18,52])box(x,HT-2,0,3,3,HD*2+60,0x4a3523);box(0,HT+1,0,HW*2+80,2,520,0x2c2018);
  const lamp=new T.Mesh(new T.SphereGeometry(1.2,10,8),M(0xfff0c0,{emissive:0xffd890,emissiveIntensity:2.2}));lamp.position.set(-40,27,6);G.add(lamp);const LL=new T.PointLight(0xffc98a,.9,120,1.4);LL.position.set(-40,26,6);G.add(LL);
  const sky=ddmTex(64,64,(q,w,h)=>{const gr=q.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#cfe2f2');gr.addColorStop(.52,'#e9eef0');gr.addColorStop(.53,'#7fa05a');gr.addColorStop(1,'#56783c');q.fillStyle=gr;q.fillRect(0,0,w,h);});
  const out=new T.Mesh(new T.PlaneGeometry(520,150),new T.MeshBasicMaterial({map:sky,toneMapped:false}));out.position.set(0,34,FRONT-90);G.add(out);
  const door=new T.Group();door.position.set(-DW,0,FRONT);G.add(door);const leaf=new T.Mesh(new T.BoxGeometry(DW*2,24,1),M(0x4a3523));leaf.position.set(DW,12,0);leaf.castShadow=true;door.add(leaf);
  G.add(new T.HemisphereLight(0xa8b8c8,0x3a2c1e,.5));
  const day=new T.SpotLight(0xfff4dc,2.6,260,.55,.5,1);day.position.set(0,26,FRONT-80);day.target.position.set(0,0,30);day.castShadow=true;day.shadow.mapSize.set(1024,1024);day.shadow.bias=-.002;G.add(day,day.target);
  const mk=(id,x,z,ang,o)=>{const u=Object.assign({side:'P',team:id[0]==='B'?'B':'A',id,name:id,x,y:z,ang,path:[],hp:100,level:2,weapon:'rifle',spec:null,specN:0,lx:0,ly:0,cloth:DD_US,ddRole:'rifle',stats:{}},o||{});
    makeSoldier(u);moveMesh(u,G);ddDayFig(u);u.m.g.traverse(q=>{q.frustumCulled=false;});if(u.m.spot)u.m.spot.intensity=0;if(u.m.beam)u.m.beam.visible=false;if(u.m.ring)u.m.ring.visible=false;return u;};
  const squad=players.map((p,i)=>mk(p.id,0,60,-Math.PI/2,{weapon:p.weapon,ddRole:p.ddRole,team:p.team}));
  const guard=[mk('N1',-WX+1,FRONT+8,-Math.PI/2,{npc:true}),mk('N2',WX-1,FRONT+8,-Math.PI/2,{npc:true}),mk('N3',-DW-7,FRONT+7,-Math.PI/2+.5,{npc:true}),mk('N4',WX+10,FRONT+9,-Math.PI/2-.3,{npc:true})];
  const flash=guard.map(()=>{const f=new T.Mesh(new T.SphereGeometry(1.5,8,6),new T.MeshBasicMaterial({color:0xffe9a0,toneMapped:false}));f.visible=false;G.add(f);return f;});
  const blood=new T.Mesh(new T.CircleGeometry(7,18),new T.MeshBasicMaterial({color:0x5a0f0c,transparent:true,opacity:.85}));blood.rotation.x=-Math.PI/2;blood.position.set(-WX+3,.15,FRONT+19);blood.visible=false;G.add(blood);
  S.hut={sc,cam:new T.PerspectiveCamera(64,cw/ch,1,900),squad,guard,door,flash,blood,FRONT,WX,HD,shotT:guard.map((q,i)=>.2+i*.13)};
}
// the hut's frame: everyone placed from how far through it is (h 0..1), drawn in place of the map
function dcSeqRender(rdt,now){
  const S=dd&&dd.seq;if(!S||!S.dc||!S.hut)return false;const warm=S.ph!=='hut';if(warm){if(!(S.warm>0)||S.t<.25)return false;S.warm--;}const H=S.hut,T=DCS.T,dur=T.hutDur,ht=warm?dur*.4:clamp(S.t-S.hutT,0,dur),h=ht/dur;
  const z0=H.HD+20,z1=H.FRONT-70,lead=z0+(z1-z0)*h;
  H.squad.forEach((u,i)=>{const z=lead+(i>>1)*10+(i%2)*3,nx=(i%2?4.5:-4.5)*(z<H.FRONT+16?.75:1)+(i%3-1);u.ang=Math.atan2(z-u.y-.0001,nx-u.x);if(Math.abs(z-u.y)<.01)u.ang=-Math.PI/2;u.x=nx;u.y=z;u.ang=-Math.PI/2;u.path=[{x:u.x,y:u.y-40}];});
  const hit=!warm&&h>.52;H.guard.forEach((u,i)=>{if(warm)return;if(i===0&&hit){if(!u.dead){Object.assign(u,{dead:true,hp:0,deadT:simT,x:-H.WX+3,y:H.FRONT+19,ang:1.2});if(typeof sfxScream==='function')sfxScream(DCA.door.x,DCA.door.y);}}else{u.aimT=simT;
      if(ht>H.shotT[i]){H.shotT[i]=ht+.28+((i*7+Math.floor(ht*10))%5)*.09;H.flash[i].visible=true;H.flash[i].userData.t=.07;if(typeof sfxShotDD==='function')sfxShotDD(u,DCA.door.x+u.x,DCA.door.y);}}
    const f=H.flash[i];if(f.visible){f.position.set(u.x+Math.cos(u.ang)*9,13.5,u.y+Math.sin(u.ang)*9);if((f.userData.t-=rdt)<=0||u.dead)f.visible=false;}});
  H.blood.visible=hit;
  for(const u of[...H.squad,...H.guard]){u.m.g.position.set(u.x,0,u.y);u.m.g.rotation.y=-u.ang;figRefresh(u);figAnimate(u,u.m);}
  H.door.rotation.y=-1.5*clamp((h-.3)/.25,0,1);
  const c=H.cam,cz=clamp(lead+96,H.FRONT+52,H.HD+70);c.position.set(5+Math.sin(ht*9)*.5,26+Math.abs(Math.sin(ht*9))*.7,cz);c.lookAt(hit?-6:0,10,H.FRONT-10);c.aspect=cw/ch;c.updateProjectionMatrix();c.updateMatrixWorld();
  postRender(H.sc,c);if(warm)return false;   // (the map's own frame is drawn over it straight after)
  ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
  return true;
}
function dcSeqTick(dt){
  const S=dd.seq,C=dd.dc,T=DCS.T,c=DCS.camp,D=DCA.door,dx=c.x-234,dy=c.y-110;S.t+=dt;const t=S.t;
  // (Version 236, Bryan: "Have an artillery whistle come in and a text saying INCOMING!!! The explosion kills the group and then the bullets start firing at the base")
  if(!S.wave&&t>=T.inc-4.2){S.wave=1;dcSpawnWave(1);banner('',1);}   // (their first wave starts across the field while the camp is still quiet: the other troops are shooting by the time the squad comes out)
  if(!S.inc&&t>=T.inc){S.inc=1;bigText('INCOMING!!!','incoming');dcIncomingSfx(T.shell-T.inc);
    for(const u of players){u.work=null;u.atEase=false;figRefresh(u);}}   // (they're on their feet at the sound of it)
  if(S.ph==='camp'&&t>=T.shell){S.ph='shell';bigText('');
    for(let k=0;k<5;k++){const x=dx+(k%3)*13,y=dy+((k/2)|0)*11;booms.push({x,y,t:-k*.09,size:1.3});}if(typeof sfxBoom==='function')sfxBoom(dx+14,dy+6,1.4);shake(1);
    for(const u of S.doom){u.hp=0;u.dead=true;u.deadT=simT;u.downed=false;if(Math.random()<.6&&typeof ddGore==='function')ddGore(u,true);}
    for(const u of players)u.sup=.5;}
  else if(S.ph==='shell'&&t>=T.run){S.ph='run';S.runT=t;players.forEach((u,i)=>{u.path=[{x:D.x+(i%2?5:-5),y:DCA.cpIn.y+(i>>1)*3}];u.lastOrder=simT;});
    booms.push({x:DCA.cp.x+DCA.cp.w+26,y:DCA.cp.y-56,t:0,size:1.3});if(typeof sfxBoom==='function')sfxBoom(DCA.cp.x+DCA.cp.w+26,DCA.cp.y-56,1.3);shake(.7);}
  else if(S.ph==='run'&&(t>=S.runT+T.hutMax||players.filter(u=>u.y<DCA.cpIn.y+16).length>=2)){S.ph='hut';S.hutT=t;   // (inside as soon as the first two are at the door: nobody stands waiting)
    players.forEach((u,i)=>{u.x=D.x+(i%2?5:-5);u.y=D.y-4-(i>>1)*2;u.path=[];u.ang=-Math.PI/2;u.sup=0;});}
  else if(S.ph==='hut'&&t>=S.hutT+T.hutDur){S.ph='out';S.outT=t;S.cp=null;
    players.forEach((u,i)=>{u.x=D.x+(i%2?6:-6)+(i%3-1)*2;u.y=D.y-6-(i>>1)*11;const p=findPath(u.x,u.y,u.sx,u.sy);u.path=p||[{x:u.sx,y:u.sy}];u.lastOrder=simT;});}
  else if(S.ph==='out'&&t>=S.outT+T.outDur){dcSeqEnd();return;}
  // their bullets on the base from just after the shells until the squad is inside: tracers in from the field, sparks and the whine where they strike
  if(t>=T.fire&&(S.ph==='shell'||S.ph==='run')&&(S.bT=(S.bT||0)-dt)<=0){S.bT=.05+Math.random()*.1;const sx=300+Math.random()*700,sy=-40+Math.random()*240,tx=420+Math.random()*540,ty=DCA.wallY+20+Math.random()*290;
    tracers.push({x1:sx,y1:sy,x2:tx,y2:ty,t:0,col:'255,140,100'});if(typeof ddSpark==='function')ddSpark(tx,ddH(tx,ty)+1+Math.random()*10,ty,.9);if(Math.random()<.3&&typeof sfxRicochet==='function')sfxRicochet(tx,ty,false);
    if(Math.random()<.35)try{sfxShotDD({x:sx,y:sy,side:'E',id:'F'+((sx/50)|0),weapon:Math.random()<.4?'mg':'rifle',gunner:false});}catch(e){}}
  if(S.ph==='run'||S.ph==='hut'||S.ph==='out')for(const u of players)u.lastOrder=simT;
}
// the sound of a shell coming down (Bryan: "Not an actual whistle, but the sound of an artillery shell coming down ... before explosion"): a rushing
// roar of air that falls in pitch and swells until it lands, a thin falling tone inside it; L seconds, ending as the shells go off
function dcIncomingSfx(L){
  try{if(typeof AC==='undefined'||!AC||!sndOn||!sndMuffle)return;const t0=AC.currentTime,t1=t0+L,n=Math.floor(AC.sampleRate*(L+.1)),buf=AC.createBuffer(1,n,AC.sampleRate),d=buf.getChannelData(0);for(let i=0;i<n;i++)d[i]=Math.random()*2-1;
    const src=AC.createBufferSource();src.buffer=buf;const bp=AC.createBiquadFilter();bp.type='bandpass';bp.Q.value=1.3;bp.frequency.setValueAtTime(3400,t0);bp.frequency.exponentialRampToValueAtTime(420,t1);
    const lp=AC.createBiquadFilter();lp.type='lowpass';lp.frequency.setValueAtTime(5200,t0);lp.frequency.exponentialRampToValueAtTime(1500,t1);
    const g=AC.createGain();g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.12,t0+L*.45);g.gain.exponentialRampToValueAtTime(.9,t1-.03);g.gain.linearRampToValueAtTime(.0001,t1+.04);
    src.connect(bp);bp.connect(lp);lp.connect(g);g.connect(sndMuffle);if(sndVerb){const s=AC.createGain();s.gain.value=.3;g.connect(s);s.connect(sndVerb);}
    const o=AC.createOscillator();o.type='triangle';o.frequency.setValueAtTime(1500,t0);o.frequency.exponentialRampToValueAtTime(330,t1);const og=AC.createGain();og.gain.setValueAtTime(.0001,t0);og.gain.exponentialRampToValueAtTime(.05,t1-.05);og.gain.linearRampToValueAtTime(.0001,t1+.03);o.connect(og);og.connect(sndMuffle);
    src.start(t0);src.stop(t1+.1);o.start(t0);o.stop(t1+.1);}catch(e){}
}
// the talk in the camp: a bubble over whoever is speaking (from overlay.js while the sequence plays)
function dcSeqDraw(){
  const S=dd.seq;if(!S||S.ph!=='camp')return;
  for(const[i,a,b,text]of DCS.chat){if(S.t<a||S.t>b)continue;const u=players[i];if(!u)continue;toSBack=false;const[sx,sy]=toS(u.x,u.y,26);if(toSBack)continue;
    ox.save();ox.font='600 13px system-ui,-apple-system,sans-serif';const w=ox.measureText(text).width+18,h=26,x=clamp(sx-w/2,6,cw-w-6),y=sy-h-12,k=clamp(Math.min((S.t-a)/.2,(b-S.t)/.25),0,1);ox.globalAlpha=k;
    ox.fillStyle='rgba(250,248,240,.96)';ox.strokeStyle='rgba(20,24,30,.85)';ox.lineWidth=1.5;ox.beginPath();const r=8;ox.moveTo(x+r,y);ox.arcTo(x+w,y,x+w,y+h,r);ox.arcTo(x+w,y+h,x,y+h,r);ox.lineTo(clamp(sx+7,x+r+14,x+w-r),y+h);ox.lineTo(sx,y+h+9);ox.lineTo(clamp(sx-7,x+r,x+w-r-14),y+h);ox.arcTo(x,y+h,x,y,r);ox.arcTo(x,y,x+w,y,r);ox.closePath();ox.fill();ox.stroke();
    ox.fillStyle='#161a20';ox.textAlign='left';ox.textBaseline='middle';ox.fillText(text,x+9,y+h/2+.5);ox.restore();}
}
function dcSeqEnd(){
  const S=dd.seq,C=dd.dc;if(!S||!S.dc)return;if(S.G&&S.G.parent)S.G.parent.remove(S.G);dd.seq=null;document.body.classList.remove('ddseq');
  for(const u of players){u.cool=Math.min(u.cool,1);if('seqD' in u){u.dmgIn=u.seqD;delete u.seqD;}}
  camT.x=S.end.cx;camT.z=S.end.cz;camera.position.copy(S.end.p);camera.quaternion.copy(S.end.q);camera.updateMatrixWorld();updateCamera();
  C.ph='w1';C.wave=1;C.t=0;dcAuto();dcNoRe();if(typeof hud==='function')hud();
}
// its shots (from ddplay.js's ddCam): the yard from the south, behind the run to the back door, then from just over their heads at the front door
// up and out into the battle's own view
function dcSeqCam(rdt){
  const S=dd.seq,T=THREE,c=DCS.camp,D=DCA.door,V=(x,h,y)=>new T.Vector3(x,ddH(x,y)+h,y);rdt=Math.min(rdt||0,.1);let pos,look,k=2.2;
  if(camShiftOn){camera.clearViewOffset();camShiftOn=false;}camShift=0;
  if(S.ph==='camp'){const a=Math.min(S.t,DCS.T.inc)*.02;pos=V(c.x+30-a*40,190-a*30,c.y+470-a*60);look=V(c.x-20,8,c.y-16);}   // (Version 236: wider, the whole square and the men about it)
  else if(S.ph==='shell'){pos=V(c.x-60,190,c.y+430);look=V(c.x-130,9,c.y-70);k=4;}
  else if(S.ph==='run'){pos=V(D.x+30,110,c.y+300);look=V(D.x,12,DCA.cpIn.y-10);k=3;}
  else if(S.ph==='hut')return true;
  else{const u=(S.t-S.outT)/DCS.T.outDur,e=u<.3?0:(u-.3)/.7,s=e*e*(3-2*e),m=players.filter(alive),ly=m.length?Math.min(...m.map(p=>p.y)):D.y,my=m.length?Math.max(...m.map(p=>p.y)):D.y;
    const p0=V(D.x,0,Math.min(my+20,DCA.cp.y-4));p0.y=ddH(D.x,D.y)+40;const l0=new T.Vector3(D.x,ddH(D.x,ly)+13,ly-240);
    const cam0=S.c0||(S.c0=new T.PerspectiveCamera());cam0.position.copy(p0);cam0.lookAt(l0);
    camera.position.lerpVectors(p0,S.end.p,s);camera.quaternion.copy(cam0.quaternion).slerp(S.end.q,s);camera.updateMatrixWorld();return true;}
  if(!S.cp){S.cp=pos.clone();S.cl=look.clone();}const q=Math.min(1,rdt*k);S.cp.lerp(pos,q);S.cl.lerp(look,q);camT.x=S.cl.x;camT.z=S.cl.z;
  camera.position.copy(S.cp);camera.lookAt(S.cl);camera.updateMatrixWorld();return true;
}
