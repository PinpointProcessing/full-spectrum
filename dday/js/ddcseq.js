/* ddcseq.js: Chapter 2's opening (Version 228). Bryan: "a video sequence of the team kneeling, cooking, smoking ... Then all of a sudden artillery
   strikes start hitting the area. A bunch of troops conglomerated on one side are blown up ... The player's squad suits up quick and runs through
   the barracks to the other side"; then: "they should be hanging out in the courtyard from the end of the D-Day mission and run through the barracks
   to the field"; "a lower shot. It would be cool if the camera can zoom into the battlefield directly above the squad's heads when entering the
   battlefield"; "Not skippable"; "NPC Units should be running into the field and begin engaging already when the squad reaches the outside"; "While
   running inside the barracks, NPC units can be seen firing from windows at the enemy, if one can get shot and die while the troops are running".
   dd.seq={dc:true,...} while it plays (the battle goes on ticking under it: ddplay.js's ddTick and ddCam ask for .dc). Phases by game time:
   camp -> shells -> run (to the barracks' back door) -> hut (a small set of its own, drawn in place of the map: dcSeqRender from scene.js's render)
   -> out (the camera from just over their heads at the front door up into the battle's own view) -> the first wave's fight. Not on a retry. */
const DCS={camp:{x:700,y:742},doom:{x:604,y:658},   // (draft: the group hit by the shell, at the command post's south-west corner)
  T:{inc:22,shell:23.7,fire:24.1,run:24.6,hutMax:3.0,hutDur:2.0,outDur:3.9,hush:3},   // (the shell's sound and INCOMING!!!!!, the shells, their bullets on the base, the run; then how long at most to the door, inside, and coming out; hush: the quiet before the shell)
  // (dx, dy, the way he faces, at ease, what he's doing, a seat under him: 1 a crate, 2 the wall)
  // (Version 237, Bryan: "Make the rest a little longer. Maybe they can chat via text bubble for a couple of seconds") who says what, and when: [the man's place in spots, from, to, the words]
  // (Version 249, Bryan: "The script is kind of bland", and his own: the six lines below, "Silence for three seconds", then "INCOMING!!!!! (From the
  // group about to get hit)". The two at the fire say them turn about; {1} is the name of the man spoken to, the second of them; 'd': the first of
  // the three by the corner the shell lands on, 1: shouted. Until then: coffee, a lost boot, "Relieved by who?", and INCOMING! from one of the smokers)
  chat:[[0,1.0,3.3,"We finally took those bastards."],[1,3.5,7.2,"What a hell of a fight. We lost too many good men."],[0,7.4,9.8,"Hey, at least you're still standing."],[1,10.0,12.2,"Yeah? But for how long?"],
    [0,12.4,16.9,"Listen, {1}. Keep it together. We finally get to rest, so rest up buddy."],[1,17.1,19.0,"Yeah, maybe I'll catch some ZZZs."],
    ['d',22.2,23.55,"INCOMING!!!!!",1]],
  // (draft 4, Bryan: "still too many troops in frame. They are also all looking towards the camera, it doesn't look natural"; "I like the body
  // structure of game play but we should stop having them focus at the camera"; "no motions between the soldiers should be done at the same time")
  // seen from about as far as in the battle, so they're the size they are in play, with plenty of ground between them: two at the fire, the one
  // on his own with a stick nearer on the left, two smoking further back on the right; the other three out of the shot. Each faces what he's doing,
  // never the camera; (draft 5, Bryan: "The two guys up top look like they're kissing") the two smoking a step and a half apart,
  // one turned to the other, the other looking off past him. The seventh entry, 'f': he faces the fire
  spots:[[-9,-1,0,0,'sit',1,'f'],[9,-3,Math.PI,0,'sit',1,'f'],[-58,40,Math.PI/2,0,'kneel',0],[26,-60,.15,0,'smoke',0],[42,-65,Math.PI+.6,0,'smoke',0],
    [-25.6,55.4,.2,0,'sit',1],[-62,8,-Math.PI/2,0,'kneel',0],[58,6,Math.PI/2,0,'stand',0]],
  view:{dx:.116,dy:-.993},   // (the way the camera looks in the yard: a little east of north)
  // (Version 249, Bryan: "Make sure the troops run frantically to the front, not orderly march - it doesn't look authentic") the dash through the
  // command post, a row a man: where he starts (x, z), his speed, his place in the doorway and which way he breaks outside, a swerve (size, pace,
  // phase) and a surge in his speed (the same). They went through at a walk in two files, in step. Now each has his own lane and speed, three get
  // past someone on the way, and all eight are through the door inside a second, left and right of each other. Found by trial
  // (tools/drafts/hut-scramble-search.js): built back from who is in the doorway when, kept only if nobody is ever nearer another than 8.8, shoulder to shoulder
  hut:[[10.5,5.7,66,-3.1,-23,1.4,5.6,4.2,.4,3.5,5.6],[4.4,16,71,4.6,26,1.8,5.3,.8,.8,5.8,4.5],[-11.7,20.7,65,-3.1,-31,1.9,6.6,6,1.1,4.5,.8],[9.1,41.1,79,4.9,35,.5,5.9,1,1.3,5.9,3.1],
    [-12.4,40,67,-2.7,-30,1.3,4,5.5,.4,3.7,2.4],[-.7,40.3,60,4.5,19,1.5,3.5,2.1,.9,5.5,.7],[-8.4,53.2,64,-2.9,-17,1.2,6.9,1.4,.3,3,1.1],[7.6,52.2,59,4.7,30,1.8,5.2,1.6,.2,4.9,3.2]],
  rush:[1.14,.34]};   // (the scramble's speed: 1.14 to 1.48 of a run, each man his own)
// A man in a scramble (Version 249): his own speed on top of his own (rushK, read by combat.js's updateUnit; spdK is his roster's), one of three ways of
// running (figure.js's figGait, u.frantic: 1 hunched over his rifle, 2 a hand on his helmet, 3 his rifle in one hand and the other arm pumping) and
// his stride started anywhere in its cycle, so no two are in step. Over once he's got where he was going, or after `secs` (dcFranticTick)
function dcFrantic(u,r,secs){r=r||Math.random;u.rushK=DCS.rush[0]+r()*DCS.rush[1];u.frantic=1+Math.floor(r()*3)%3;u.franticT=simT+(secs||12);u.franticA=-4;if(u.m&&u.m.fig)u.m.fig.phase=r();}
function dcFranticTick(){for(const u of dd.allies||[]){if(!u.frantic)continue;
  if(u.path.length&&alive(u)&&simT<u.franticT){u.franticA=0;continue;}
  if(!alive(u)||simT>=u.franticT||(u.franticA=(u.franticA||0)+1)>1){u.frantic=0;u.rushK=1;}}}   // (arrived, at two looks half a second apart: a man between two legs of his way isn't done)
// a man the picture cuts to in the middle of his run: his figure is told he's at that speed already (figure.js works a man's speed out from how far
// he has moved since it last drew him, and eases his pose: cut to, he stood upright for a moment and then leaned into it)
function dcFigRun(u,spd){const F=u.m&&u.m.fig;if(F){F.px=u.x;F.py=u.y;F.lt=simT;F.spd=spd;F.mvx=1;F.mvz=0;F.fresh=true;}}
// where a man of the dash is ht seconds into the shot, in the set's own frame (FRONT: the wall with the door)
function dcHutAt(r,ht,F){
  const sm=u=>u*u*(3-2*u),s=r[2]*ht+r[8]*(Math.sin(r[9]*ht+r[10])-Math.sin(r[10])),z=r[1]-s,k=sm(clamp((z-F-4)/40,0,1)),o=sm(clamp((F-18-z)/60,0,1));
  return[z>=F?r[3]+(r[0]-r[3])*k+r[5]*Math.sin(r[6]*ht+r[7])*k:r[3]+(r[4]-r[3])*o,z];
}
function dcSeqStart(){
  if(startCounter.noSeq||/[?&]noseq\b/.test(location.search))return false;   // (?noseq in the address: the tests that start in the fight)
  const c=DCS.camp,T=THREE,g=ddH(c.x,c.y);
  // where the battle's own camera is: the last shot ends there
  updateCamera();const end={p:camera.position.clone(),q:camera.quaternion.clone(),cx:camT.x,cz:camT.z};
  const S=dd.seq={dc:true,t:0,ph:'camp',end,doom:[],seat:[],G:new T.Group(),rnd:(x=>()=>(x=(x*16807)%2147483647)/2147483647)(90210)};for(const id of['lbT','lbB'])if(!$('#'+id)){const d=document.createElement('div');d.id=id;stage.appendChild(d);}document.body.classList.add('ddseq','cine');scene.add(S.G);   // (rnd: the scene's own shells and shots fall the same way every time, like a film)
  players.forEach((u,i)=>{const s=DCS.spots[i%8];u.sx=u.x;u.sy=u.y;Object.assign(u,{x:c.x+s[0],y:c.y+s[1],ang:s[2],seqA:s[2],seqF:s[6]==='f',path:[],atEase:!!s[3],work:s[4],cool:99});figRefresh(u);S.seat.push(s[5]===1?[u.x,u.y]:null);});
  // a fire, something to sit at
  const M=(col,r)=>new T.MeshStandardMaterial({color:col,roughness:r??.9}),add=(geo,m,x,h,y,rx,ry,rz)=>{const q=new T.Mesh(geo,m);q.position.set(x,g+h,y);q.rotation.set(rx||0,ry||0,rz||0);q.castShadow=q.receiveShadow=true;S.G.add(q);return q;};
  for(let k=0;k<4;k++)add(new T.CylinderGeometry(.9,.9,9,7),M(0x4a3524),c.x,1.2,c.y,Math.PI/2,k*.8,0);for(let k=0;k<9;k++){const a=k*.7;add(new T.DodecahedronGeometry(1.5,0),M(0x77746c),c.x+Math.cos(a)*5.4,.8,c.y+Math.sin(a)*5.4,k,k,0);}
  for(const[r,h,o]of[[3.2,4.6,.9],[2.1,6.4,.75],[1.2,7.8,.6]]){const f=add(new T.ConeGeometry(r,h,9,1,true),new T.MeshBasicMaterial({color:r>3?0xff6a1c:r>2?0xffa63c:0xffe08a,transparent:true,opacity:o,toneMapped:false,depthWrite:false}),c.x,h/2+1,c.y);f.castShadow=false;}
  for(const p of S.seat)if(p)add(new T.BoxGeometry(7,5.2,7),M(0x5f6a44,.8),p[0],2.6,p[1],0,.3,0);                                  // a crate under each man sitting at the fire
  for(const dx of[-3.2,3.2])add(new T.CylinderGeometry(.25,.25,13,5),M(0x2a2a2a,.6),c.x+dx,6,c.y,0,0,dx>0?.38:-.38);add(new T.CylinderGeometry(2.3,1.9,2.6,10),M(0x24262a,.5),c.x,9.4,c.y);   // a pot over the fire
  for(const[x,y,w,h]of[[c.x+50,c.y-74,10,6],[c.x-58,c.y+50,9,6],[c.x-62,c.y-4,10,7],[c.x+60,c.y+16,9,8]])add(new T.BoxGeometry(w,h,8),M(0x5f6a44,.8),x,h/2,y,0,.3,0);
  // the bunch of other troops off to one side: the shells land on them
  // (draft 5, Bryan: "way too many men standing in a circle. Three guys is enough to get shelled") three, loosely: one at the ammo crates, one
  // having a smoke a little way off, one wandering over to him, spread across the corner shot's view so they don't bunch up
  [[0,2,-.4,'stand',0],[16,-10,2.4,'smoke',0],[-15,15,-.9,null,1]].forEach(([dx,dy,a,w,e])=>{const u=ddNpc(DCS.doom.x+dx,DCS.doom.y+dy);Object.assign(u,{inBoat:false,seen:true,post:null,ang:a,seqA:a,atEase:!!e,work:w,cool:99});S.doom.push(u);});
  // (Version 238, Bryan: "The NPCs are all running inside before the artillery lands. Can we make them nonchalantly walking around and talking with one
  // another in the background") the other troops are about the yard in twos, strolling or standing talking, until the shells land; then they run out
  S.idle=dd.npcs.filter(u=>alive(u)&&!S.doom.includes(u));S.idle.forEach((u,i)=>{const pr=i>>1,sp=[[548,712],[800,690],[520,800],[786,812],[600,850]][pr%5];Object.assign(u,{x:sp[0]+(i%2?10:-4),y:sp[1]+(i%2?3:-3),path:[],hopT:1e12,spdK:.42,atEase:true,cool:99,idleT:1.5+pr*2.3,idleP:pr,frantic:0,rushK:1});figRefresh(u);});
  {const st=add(new T.CylinderGeometry(.22,.3,9,5),M(0x6b4a2a,.9),0,0,0);st.castShadow=false;S.stick={m:st,u:players[5]};}   // (a stick for the one on his own: dcSeqStick)
  S.fence=objs.filter(o=>o.kind==='dcside'&&o.ew);for(const o of S.fence)for(const m of o.meshes||[])m.visible=false;   // (the base's south fence: the talk is filmed from out past it; dcSeqFence puts it back)
  dcHutBuild(S);banner('',1);S.warm=3;for(const u of players){u.seqD=u.dmgIn;u.dmgIn=.0001;}   // (nothing hurts the squad until the opening hands over)
  try{renderer.compile(S.hut.sc,S.hut.cam);}catch(e){}   // (warm: the inside is drawn once, unseen, while the camp is on screen, so going in doesn't hitch)   // (their first wave starts across the field at once: the other troops are already shooting when the squad comes out)
  return true;
}
// the hut: a small set of its own, crossed the short way from its back door to its front door; four of the other troops at its front windows
function dcHutBuild(S){
  const T=THREE,sc=new T.Scene();sc.background=new T.Color(0x0a0806);const G=new T.Group();sc.add(G);
  const M=(c,o)=>new T.MeshStandardMaterial(Object.assign({color:c,roughness:.85},o||{}));
  const box=(x,h,z,w,t,d,c,o)=>{const m=new T.Mesh(new T.BoxGeometry(w,t,d),c&&c.isMaterial?c:M(c,o));m.position.set(x,h+t/2,z);m.castShadow=m.receiveShadow=true;G.add(m);return m;};
  const HW=78,HD=31,wall=ddmTex(256,256,ddmPlanks('#7a5a3c','#3d2a1a'),5,1),floor=ddmTex(256,256,ddmPlanks('#5a4530','#2a2018'),9,6),WM=M(0xffffff,{map:wall}),FRONT=-HD;
  const BK=56;   // (Version 249: the room goes this much further back: the camera starts further behind the scramble than it did behind two files)
  box(0,-1.6,BK/2,HW*2+10,1.6,HD*2+60+BK,M(0xffffff,{map:floor,roughness:.7}));
  const DW=9,WX=28,WW=9,SILL=11,TOP=21,HT=34;
  for(const s of[-1,1]){box(s*(DW+(WX-WW-DW)/2),0,FRONT,WX-WW-DW,HT,2.4,WM);box(s*((WX+WW+HW)/2),0,FRONT,HW-WX-WW,HT,2.4,WM);box(s*WX,0,FRONT,WW*2,SILL,2.4,WM);box(s*WX,TOP,FRONT,WW*2,HT-TOP,2.4,WM);
    box(s*WX,SILL,FRONT+1.5,WW*2+2,.8,2.6,0x3d2a1a);box(s*HW,0,BK/2,2.4,HT,HD*2+60+BK,WM);}
  box(0,24,FRONT,DW*2,HT-24,2.4,WM);
  for(const x of[-52,-18,18,52])box(x,HT-2,BK/2,3,3,HD*2+60+BK,0x4a3523);box(0,HT+1,0,HW*2+80,2,520,0x2c2018);
  const lamp=new T.Mesh(new T.SphereGeometry(1.2,10,8),M(0xfff0c0,{emissive:0xffd890,emissiveIntensity:2.2}));lamp.position.set(-40,27,6);G.add(lamp);const LL=new T.PointLight(0xffc98a,.9,120,1.4);LL.position.set(-40,26,6);G.add(LL);
  const sky0=()=>ddmTex(64,64,(q,w,h)=>{const gr=q.createLinearGradient(0,0,0,h);gr.addColorStop(0,'#cfe2f2');gr.addColorStop(.52,'#e9eef0');gr.addColorStop(.53,'#7fa05a');gr.addColorStop(1,'#56783c');q.fillStyle=gr;q.fillRect(0,0,w,h);});
  // (Version 238, Bryan: "Can the interior of the Command post show outside from inside? Right now it's just a green paint slab") behind the door and
  // windows, the real field as it is at that moment: the map drawn from the doorway into a picture a few times a second (dcSeqRender)
  const rt=new T.WebGLRenderTarget(640,320),vcam=new T.PerspectiveCamera(96,2,4,5000),out=new T.Mesh(new T.PlaneGeometry(400,200),new T.MeshBasicMaterial({map:rt.texture,toneMapped:false}));out.position.set(0,14,FRONT-90);G.add(out);
  const door=new T.Group();door.position.set(-DW,0,FRONT);G.add(door);const leaf=new T.Mesh(new T.BoxGeometry(DW*2,24,1),M(0x4a3523));leaf.position.set(DW,12,0);leaf.castShadow=true;door.add(leaf);
  G.add(new T.HemisphereLight(0xa8b8c8,0x3a2c1e,.5));
  const day=new T.SpotLight(0xfff4dc,2.6,260,.55,.5,1);day.position.set(0,26,FRONT-80);day.target.position.set(0,0,30);day.castShadow=true;day.shadow.mapSize.set(1024,1024);day.shadow.bias=-.002;G.add(day,day.target);
  const mk=(id,x,z,ang,o)=>{const u=Object.assign({side:'P',team:id[0]==='B'?'B':'A',id,name:id,x,y:z,ang,path:[],hp:100,level:2,weapon:'rifle',spec:null,specN:0,lx:0,ly:0,cloth:DD_US,ddRole:'rifle',stats:{}},o||{});
    makeSoldier(u);moveMesh(u,G);ddDayFig(u);u.m.g.traverse(q=>{q.frustumCulled=false;});if(u.m.spot)u.m.spot.intensity=0;if(u.m.beam)u.m.beam.visible=false;if(u.m.ring)u.m.ring.visible=false;return u;};
  const squad=players.map((p,i)=>mk(p.id,0,60,-Math.PI/2,{weapon:p.weapon,ddRole:p.ddRole,team:p.team}));
  // (Version 249) the dash: each of them a row of DCS.hut (the squads mixed up: nobody keeps his file), his own way of running, his stride anywhere in its cycle
  const R=S.rnd,rows=DCS.hut.map((r,i)=>i).sort(()=>R()-.5);squad.forEach((u,i)=>{u.hutR=DCS.hut[rows[i%rows.length]];u.frantic=1+i%3;if(u.m.fig)u.m.fig.phase=R();});
  let openT=0;for(;openT<3;openT+=.01)if(squad.some(u=>dcHutAt(u.hutR,openT,FRONT)[1]<FRONT+15))break;   // (the first of them 1.5 m short of the door: it's shouldered open)
  const guard=[mk('N1',-WX+1,FRONT+8,-Math.PI/2,{npc:true}),mk('N2',WX-1,FRONT+8,-Math.PI/2,{npc:true}),mk('N3',-DW-7,FRONT+7,-Math.PI/2+.5,{npc:true}),mk('N4',WX+10,FRONT+9,-Math.PI/2-.3,{npc:true})];
  const flash=guard.map(()=>{const f=new T.Mesh(new T.SphereGeometry(1.5,8,6),new T.MeshBasicMaterial({color:0xffe9a0,toneMapped:false}));f.visible=false;G.add(f);return f;});
  const blood=new T.Mesh(new T.CircleGeometry(7,18),new T.MeshBasicMaterial({color:0x5a0f0c,transparent:true,opacity:.85}));blood.rotation.x=-Math.PI/2;blood.position.set(-DW-9,.15,FRONT+17);blood.visible=false;G.add(blood);
  S.hut={sc,rt,vcam,viewT:0,fl:[],cam:new T.PerspectiveCamera(64,cw/ch,1,900),squad,guard,door,flash,blood,FRONT,WX,HD,DW,openT,hitAt:.62,shotT:guard.map((q,i)=>.2+i*.13)};
}
// the hut's frame: everyone placed from how far through it is (h 0..1), drawn in place of the map
function dcSeqRender(rdt,now){
  const S=dd&&dd.seq;if(!S||!S.dc||!S.hut)return false;const warm=S.ph!=='hut';if(warm){if(!(S.warm>0)||S.t<.25)return false;S.warm--;}const H=S.hut,T=DCS.T,dur=T.hutDur,ht=warm?dur*.4:clamp(S.t-S.hutT,0,dur),h=ht/dur;
  // (draft 4: they start well into the room, not at the lens. Version 249: a scramble, each by his own row of DCS.hut: dcHutAt)
  let zm=0;H.squad.forEach(u=>{const p=dcHutAt(u.hutR,ht,H.FRONT),q=dcHutAt(u.hutR,ht+.05,H.FRONT);u.x=p[0];u.y=p[1];u.ang=Math.atan2(q[1]-p[1],q[0]-p[0]);u.path=[{x:q[0],y:q[1]-40}];
    u.m.g.visible=p[1]>H.FRONT-82;zm+=Math.max(p[1],H.FRONT-30)/H.squad.length;});   // (out in the field a man is gone from the shot before he reaches the picture of it that stands behind the door)
  if(!warm&&!H.go){H.go=1;for(const u of H.squad)dcFigRun(u,u.hutR[2]);}   // (the shot opens on them already running)
  const hit=!warm&&!!H.hit;H.guard.forEach((u,i)=>{if(!u.dead)u.aimT=simT;const f=H.flash[i];f.visible=!warm&&!u.dead&&(H.fl[i]||0)>simT;if(f.visible)f.position.set(u.x+Math.cos(u.ang)*9,13.5,u.y+Math.sin(u.ang)*9);});
  H.blood.visible=hit;
  for(const u of[...H.squad,...H.guard]){u.m.g.position.set(u.x,0,u.y);u.m.g.rotation.y=-u.ang;figRefresh(u);figAnimate(u,u.m);}
  // the door: shouldered open and out by the first man to it, banging back off its stop (it swung in by itself over a second, ahead of two files)
  {const d=warm?0:clamp((ht-H.openT)/.14,0,1),e=1-(1-d)*(1-d)*(1-d),b=Math.sin(clamp((ht-H.openT-.14)/.4,0,1)*Math.PI);H.door.rotation.y=1.72*e-.26*b;
    if(d>0&&!H.bang&&!warm){H.bang=1;try{playSample('slam',DCA.door.x,DCA.door.y+10,.7,1.3);}catch(e){}}}
  // the camera runs in behind them, jolting with its own strides, and falls back as they pull away through the door
  const c=H.cam,cz=clamp(zm+76,H.FRONT+46,H.HD+84),jx=Math.sin(ht*7.1)*1.3,jy=Math.abs(Math.sin(ht*14.2))*1.25,lx=H.lookX=(H.lookX||0)+((hit?-5:0)-(H.lookX||0))*Math.min(1,rdt*5);
  c.position.set(5+jx,26+jy,cz);c.lookAt(lx+jx*.4,10+jy*.3,H.FRONT-10);c.rotateZ(Math.sin(ht*7.1+.6)*.022);c.aspect=cw/ch;c.updateProjectionMatrix();c.updateMatrixWorld();
  if((H.viewT-=rdt)<=0||warm){H.viewT=.3;const D=DCA.door,gy=ddH(D.x,D.y-8),tm=renderer.toneMapping,te=renderer.toneMappingExposure;H.vcam.position.set(D.x,gy+14,D.y-8);H.vcam.lookAt(D.x,gy+14,D.y-600);H.vcam.updateMatrixWorld();
    try{if(typeof DDL_TONE!=='undefined'&&DDL_TONE.map!=null){renderer.toneMapping=DDL_TONE.map;renderer.toneMappingExposure=DDL_TONE.exp;}if(!warm&&typeof syncUnits==='function')syncUnits(now);renderer.setRenderTarget(H.rt);renderer.render(scene,H.vcam);}catch(e){}renderer.setRenderTarget(null);renderer.toneMapping=tm;renderer.toneMappingExposure=te;}
  postRender(H.sc,c);if(warm)return false;   // (the map's own frame is drawn over it straight after)
  ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);
  return true;
}
function dcSeqTick(dt){
  const S=dd.seq,C=dd.dc,T=DCS.T,c=DCS.camp,D=DCA.door,dx=DCS.doom.x-14,dy=DCS.doom.y-6;S.t+=dt;const t=S.t;dcSeqWar(dt);dcSeqFace();
  // (Version 236, Bryan: "Have an artillery whistle come in and a text saying INCOMING!!! The explosion kills the group and then the bullets start firing at the base")
  if(!S.wave&&t>=T.inc-4.2){S.wave=1;dcSpawnWave(1);banner('',1);}   // (their first wave starts across the field while the camp is still quiet: the other troops are shooting by the time the squad comes out)
  S.hush=t>=T.inc-T.hush&&t<T.inc;   // (Version 249, "Silence for three seconds": nobody speaks and the far guns fall quiet, dcSeqWar and ddamb.js's bed)
  if(!S.inc&&t>=T.inc){S.inc=1;dcIncomingSfx(T.shell-T.inc);
    players.slice().sort(()=>S.rnd()-.5).forEach((u,k)=>u.seqDuck=t+.5+k*.13+S.rnd()*.08);   // (the squad ducks at the shout, each on his own beat)
    S.doom.forEach((u,k)=>u.seqDuck=t+(k?.75+k*.22:.12));}   // (the three by the corner: the one who shouts it looks up first, then the other two bolt, too late)
  for(const u of players)if(u.seqDuck&&t>=u.seqDuck){u.seqDuck=0;u.work=null;u.atEase=false;figRefresh(u);}
  S.doom.forEach((u,k)=>{if(!u.seqDuck||t<u.seqDuck||!alive(u))return;u.seqDuck=0;u.work=null;u.atEase=false;figRefresh(u);
    if(!k){u.seqA=Math.atan2(c.y-u.y,c.x-u.x);return;}dcFrantic(u,S.rnd);const a=Math.atan2(u.y-DCS.doom.y,u.x-DCS.doom.x)+(S.rnd()-.5)*.8;u.path=[{x:u.x+Math.cos(a)*70,y:u.y+Math.abs(Math.sin(a))*70}];});
  if(S.ph==='camp'&&t>=T.shell){S.ph='shell';
    booms.push({x:DCS.doom.x,y:DCS.doom.y,t:0,size:1.7});for(let k=1;k<5;k++)booms.push({x:dx+(k%3)*13,y:dy+((k/2)|0)*11,t:-k*.08,size:1.1,snd:1});shake(1.6);   // (the blast's sound comes with it from audio.js; one big one, the rest silent)
    for(const u of S.doom){u.hp=0;u.dead=true;u.deadT=simT;u.downed=false;if(Math.random()<.6&&typeof ddGore==='function')ddGore(u,true);}
    players.slice().sort(()=>S.rnd()-.5).forEach((u,k)=>u.seqTurn=t+.08+k*.1+S.rnd()*.06);   // (each turns to it and gets his head down on his own beat: dcSeqFace)
    (S.idle||[]).forEach((u,i)=>{u.atEase=false;u.spdK=1;u.cool=1;u.path=[];u.hopT=1e12;u.seqHop=t+.05+S.rnd()*1.25;dcFrantic(u,S.rnd);figRefresh(u);});}   // (Version 249: each bolts for the front when his own nerve lets him, at his own speed; they went one every 0.22 s at one speed, a column)
  else if(S.ph==='shell'&&t>=T.run){S.ph='run';S.runT=t;dcSeqFence(S);
    // (Version 249, Bryan: "Make sure the troops run frantically to the front, not orderly march - it doesn't look authentic") they went nearest first,
    // one every 0.16 s, to two files at the door. Now two bolt at once and the rest when they've gathered themselves, in no order, each at his own speed
    players.map((u,i)=>[u,i]).sort(()=>S.rnd()-.5).forEach(([u,i],k)=>{u.seqGo=t+(k<2?0:.06+S.rnd()*.6);u.seqI=i;dcFrantic(u,S.rnd);});
    booms.push({x:DCA.cp.x+DCA.cp.w+26,y:DCA.cp.y-56,t:0,size:1.3});shake(.7);}
  else if(S.ph==='run'&&(t>=S.runT+T.hutMax||players.filter(u=>u.y<DCA.cpIn.y+18).length>=Math.min(3,players.length))){S.ph='hut';S.hutT=t;   // (inside as soon as the first three are at the door: nobody stands waiting)
    players.forEach((u,i)=>{u.x=D.x+(i%2?5:-5);u.y=DCA.cp.y+26+(i>>1)*6;u.path=[];u.ang=-Math.PI/2;u.sup=0;});}   // (under the arch, behind the view out of the door)
  else if(S.ph==='hut'&&t>=S.hutT+T.hutDur){S.ph='out';S.outT=t;S.cp=null;
    // (Version 249) out of the door in a bunch, not two files: nobody nearer another than a body's width, each already running for his own place at his
    // own speed as the shot opens (they came out in pairs, one pair behind the other, and set off in turn)
    // (3 to 6.5 m out from the door: this shot starts from just over the door looking out level, and nearer than that a man is under its frame)
    const put=[];players.slice().sort(()=>S.rnd()-.5).forEach((u,k)=>{let x=D.x,y=D.y-30,n=0;do{x=D.x+(S.rnd()-.5)*32;y=D.y-28-S.rnd()*38;}while(n++<60&&put.some(q=>hyp(q[0]-x,q[1]-y)<9.5));put.push([x,y]);
      u.x=x;u.y=y;const p=findPath(x,y,u.sx,u.sy);u.path=p&&p.length?p:[{x:u.sx,y:u.sy}];u.ang=Math.atan2(u.path[0].y-y,u.path[0].x-x);dcFrantic(u,S.rnd);dcFigRun(u,RUN_SPEED*u.rushK);u.lastOrder=simT;});}
  else if(S.ph==='out'&&t>=S.outT+T.outDur){dcSeqEnd();return;}
  // (the other troops, each on his own beat. After the chain above, not inside it: put between its if and its else, this loop's own if took the else)
  for(const u of S.idle||[])if(u.seqHop&&t>=u.seqHop){u.seqHop=0;u.hopT=simT+4;if(alive(u)&&u.post&&!u.dcGun){const p=findPath(u.x,u.y,u.post.x,u.post.y);if(p)u.path=p;else u.hopT=0;}}   // (dcNpc looks only twice a second: they'd set off in batches)
  if(S.ph==='run')for(const u of players)if(u.seqGo&&t>=u.seqGo){u.seqGo=0;u.lastOrder=simT;u.sup=Math.min(u.sup,.5);   // (each sets off on his own beat, by his own way: a swerve on the way, a place of his own in the crush at the door)
    const ex=D.x+(S.rnd()-.5)*24,ey=DCA.cpIn.y+S.rnd()*16;let mx=(u.x+ex)/2+(S.rnd()-.5)*40,my=(u.y+ey)/2+(S.rnd()-.5)*14;if(hyp(mx-c.x,my-c.y)<16)mx+=mx<c.x?-18:18;   // (not through the fire)
    u.path=hyp(u.x-ex,u.y-ey)>50?[{x:mx,y:my},{x:ex,y:ey}]:[{x:ex,y:ey}];}
  if(S.ph==='camp')for(const u of S.idle||[]){   // a pair walks a little way together, stops, faces each other, walks on
    if(u.path.length)continue;const mate=S.idle.find(q=>q!==u&&q.idleP===u.idleP);if(mate&&!mate.path.length)u.ang=Math.atan2(mate.y-u.y,mate.x-u.x);
    if((u.idleT-=dt)>0||(S.idle.indexOf(u)%2))continue;u.idleT=5+Math.random()*4;const wst=u.x<c.x,tx=clamp(u.x+(Math.random()-.5)*110,wst?560:c.x+55,wst?c.x-55:840),ty=clamp(u.y+(Math.random()-.5)*110,620,862);   // (each pair on its own side of the yard: nobody crosses in front of the camera)
    if(hyp(tx-c.x,ty-c.y)<70||!isFree(tx,ty,6))continue;const p=findPath(u.x,u.y,tx,ty);if(p){u.path=p;if(mate){const q=findPath(mate.x,mate.y,tx+9,ty+5);if(q)mate.path=q;}}}
  // their bullets on the base from just after the shells until the squad is inside: tracers in from the field, sparks and the whine where they strike
  if(t>=T.fire&&(S.ph==='shell'||S.ph==='run')&&(S.bT=(S.bT||0)-dt)<=0){S.bT=.05+S.rnd()*.1;const sx=300+S.rnd()*700,sy=-40+S.rnd()*240,tx=420+S.rnd()*540,ty=DCA.wallY+20+S.rnd()*290;
    tracers.push({x1:sx,y1:sy,x2:tx,y2:ty,t:0,col:'255,140,100'});if(typeof ddSpark==='function')ddSpark(tx,ddH(tx,ty)+1+Math.random()*10,ty,.9);if(Math.random()<.3&&typeof sfxRicochet==='function')sfxRicochet(tx,ty,false);
    if(Math.random()<.35)try{sfxShotDD({x:sx,y:sy,side:'E',id:'F'+((sx/50)|0),weapon:Math.random()<.4?'mg':'rifle',gunner:false});}catch(e){}}
  if(S.ph==='hut'&&S.hut){   // inside: the men at the windows firing, one of them hit as the squad goes by (game logic here; dcSeqRender only draws it)
    // (Version 249: the man beside the door, as they crowd past him, 0.62 s in; it was the one at the left window, at 52% of a 3.6 s walk, whom the new, faster camera had left behind off the side of a phone's screen)
    const H=S.hut,ht=t-S.hutT;if(!H.hit&&ht>H.hitAt){H.hit=1;const u=H.guard[2];Object.assign(u,{dead:true,hp:0,deadT:simT,x:-H.DW-9,y:H.FRONT+17,ang:1.2});
      if(typeof sfxScream==='function')sfxScream({x:D.x-12,y:D.y+18,side:'P'},.3);}   // (it was called with the door's x and y as the man and the volume: a volume of 550)
    H.guard.forEach((u,i)=>{if(u.dead||ht<=H.shotT[i])return;H.shotT[i]=ht+.28+((i*7+Math.floor(ht*10))%5)*.09;H.fl[i]=simT+.07;
      try{sfxShotDD({x:D.x+u.x,y:D.y+8,side:'P',id:u.id,weapon:'rifle'});}catch(e){}});}
  if(S.ph==='out'&&!S.unbar&&t>=S.outT+DCS.T.outDur*.35){S.unbar=1;document.body.classList.remove('cine');}   // (the bars slide away as the camera rises into the battle)
  if(S.ph==='run'||S.ph==='hut'||S.ph==='out')for(const u of players)u.lastOrder=simT;
}
// (draft) while they talk the game's own soldier logic would turn them all one way: each faces what he's doing (draft 4: never the camera); still to the fire at INCOMING!!! (Bryan: "They also shouldn't look at the area of the explosion before it
// happens"), and to the blast once it's gone off
function dcSeqFace(){const S=dd.seq,c=DCS.camp;if(!S||S.ph!=='camp'&&S.ph!=='shell')return;
  for(const u of players){if(!alive(u)||u.path.length)continue;if(S.ph==='shell'&&u.seqTurn&&S.t>=u.seqTurn){u.ang=Math.atan2(DCS.doom.y-u.y,DCS.doom.x-u.x);u.sup=1;continue;}
    u.ang=u.seqF?Math.atan2(c.y-u.y,c.x-u.x):u.seqA;}
  for(const u of S.doom)if(alive(u)&&!u.path.length)u.ang=u.seqA;   // (the three by the corner too: the game's own logic would turn them; not one who's bolting)
  dcSeqStick();}
// (draft 3) the stick in the hands of the one on his own, its end in the dirt in front of him, moving as he draws; dropped at INCOMING!
function dcSeqStick(){const S=dd.seq,K=S&&S.stick;if(!K)return;const u=K.u,m=K.m;if(!u||!alive(u)){m.visible=false;return;}
  const T=THREE,f=new T.Vector3(Math.cos(u.ang),0,Math.sin(u.ang)),sd=new T.Vector3(-f.z,0,f.x),g=ddH(u.x,u.y);let a,b;
  if(u.work!=='sit'){if(!K.drop)K.drop=[u.x+f.x*8,u.y+f.z*8];a=new T.Vector3(K.drop[0]-f.x*4.5,g+.3,K.drop[1]-f.z*4.5);b=new T.Vector3(K.drop[0]+f.x*4.5,g+.3,K.drop[1]+f.z*4.5);}
  else{const w=Math.sin(simT*2.3)*1.4,h=Math.max(0,Math.sin(simT*4.6))*.5;a=new T.Vector3(u.x,g+6.7,u.y).addScaledVector(f,3.1);b=new T.Vector3(u.x,g+.2+h,u.y).addScaledVector(f,10).addScaledVector(sd,w);}
  m.position.copy(a).add(b).multiplyScalar(.5);m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),b.clone().sub(a).normalize());m.scale.set(1,a.distanceTo(b)/9,1);}
// (draft) the war all through the scene, louder as it goes: in the camp, far off (guns rumbling, bursts of fire, the bed's battle up a little:
// ddamb.js); from INCOMING!!! on, shells landing round the base and in the field, never on the squad, and gunfire coming in
function dcSeqWar(dt){
  const S=dd.seq,T=DCS.T,t=S.t,far=t<T.shell;
  if(far&&S.hush)return;   // (the three seconds of quiet before the shell)
  if(far){if((S.farT=(S.farT||1.2)-dt)<=0){S.farT=1.6+S.rnd()*2.4;const x=150+S.rnd()*900;try{if(S.rnd()<.6)ddsFarBoom(x,-1200-S.rnd()*600);else sfxBoom(x,-700,1.2);}catch(e){}}
    if((S.farG=(S.farG||.6)-dt)<=0){S.farG=.25+S.rnd()*1.1;const x=150+S.rnd()*900;try{sfxShotDD({x,y:-260-S.rnd()*300,side:S.rnd()<.6?'E':'P',id:'G'+((x/60)|0),weapon:S.rnd()<.4?'mg':'rifle',gunner:S.rnd()<.4});}catch(e){}}
    return;}
  if((S.nearT=(S.nearT||.4)-dt)<=0){S.nearT=(S.ph==='hut'?.7:.45)+S.rnd()*.6;
    for(let k=0;k<6;k++){const out=S.ph==='out',x=out?300+S.rnd()*640:420+S.rnd()*560,y=out?120+S.rnd()*330:S.ph==='hut'?380+S.rnd()*150:480+S.rnd()*420;
      if(players.some(u=>alive(u)&&hyp(u.x-x,u.y-y)<(out?60:70))||(x>DCA.cp.x-10&&x<DCA.cp.x+DCA.cp.w+10&&y>DCA.cp.y-10&&y<DCA.cp.y+DCA.cp.h+10))continue;
      booms.push({x,y,t:0,size:.8+S.rnd()*.6});if(S.rnd()<.5)shake(.25);break;}}
  if((S.gunT=(S.gunT||.1)-dt)<=0){S.gunT=.07+S.rnd()*.12;const sx=300+S.rnd()*640,sy=-120+S.rnd()*300;
    try{sfxShotDD({x:sx,y:sy,side:S.rnd()<.75?'E':'P',id:'W'+((sx/40)|0),weapon:S.rnd()<.45?'mg':'rifle',gunner:S.rnd()<.4});}catch(e){}}
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
// the line being said just now, if any: who says it and the words ({1}: the name of the man spoken to, the second at the fire)
function dcSeqLine(S){
  const cur=S&&S.ph==='camp'?DCS.chat.filter(l=>S.t>=l[1]&&S.t<=l[2]).pop():null;if(!cur)return null;   // (only the newest line when two overlap)
  const[who,a,b,raw,sh]=cur,u=who==='d'?S.doom[0]:players[who];if(!u||!u.m)return null;
  return{who,u,a,b,sh:!!sh,text:raw.replace('{1}',(players[1]&&players[1].name)||'buddy')};
}
function dcSeqDraw(){
  const S=dd.seq,Ln=dcSeqLine(S);if(!Ln)return;const{who,u,a,b,sh,text}=Ln;toSBack=false;const[sx,sy]=toS(u.x,u.y,26);if(toSBack)return;
  // (Version 249: Bryan's lines are longer, so a bubble wraps to the screen)
  const fs=sh?17:14,lh=fs+4;ox.save();ox.font=(sh?'900 ':'600 ')+fs+'px system-ui,-apple-system,sans-serif';
  const maxW=Math.min(cw-36,sh?330:238),L=[];let ln='';for(const wd of text.split(' ')){const t2=ln?ln+' '+wd:wd;if(ln&&ox.measureText(t2).width>maxW){L.push(ln);ln=wd;}else ln=t2;}if(ln)L.push(ln);
  const w=Math.max(...L.map(q=>ox.measureText(q).width))+20,h=L.length*lh+(sh?14:12),side=who===1?.3:who===0?.7:.5;   // (the two at the fire sit a step apart: each one's bubble leans to his own side)
  const x=clamp(sx-w*side,6,cw-w-6),y=Math.max(ch*.11+8,sy-h-12),k=clamp(Math.min((S.t-a)/.2,(b-S.t)/.25),0,1);ox.globalAlpha=k;
  ox.fillStyle='rgba(250,248,240,.96)';ox.strokeStyle=sh?'#b3261e':'rgba(20,24,30,.85)';ox.lineWidth=sh?3:1.5;ox.beginPath();const r=8;ox.moveTo(x+r,y);ox.arcTo(x+w,y,x+w,y+h,r);ox.arcTo(x+w,y+h,x,y+h,r);ox.lineTo(clamp(sx+7,x+r+14,x+w-r),y+h);ox.lineTo(sx,y+h+9);ox.lineTo(clamp(sx-7,x+r,x+w-r-14),y+h);ox.arcTo(x,y+h,x,y,r);ox.arcTo(x,y,x+w,y,r);ox.closePath();ox.fill();ox.stroke();
  ox.fillStyle=sh?'#b3261e':'#161a20';ox.textAlign='left';ox.textBaseline='middle';L.forEach((q,i)=>ox.fillText(q,x+10,y+(sh?7:6)+lh*(i+.5)+.5));ox.restore();
}
function dcSeqFence(S){for(const o of S.fence||[])for(const m of o.meshes||[])m.visible=true;S.fence=null;}
function dcSeqEnd(){
  const S=dd.seq,C=dd.dc;if(!S||!S.dc)return;dcSeqFence(S);if(S.G&&S.G.parent)S.G.parent.remove(S.G);dd.seq=null;document.body.classList.remove('ddseq','cine');
  for(const u of players){u.cool=Math.min(u.cool,1);if('seqD' in u){u.dmgIn=u.seqD;delete u.seqD;}}
  for(const u of S.idle||[])if(u.seqHop){u.seqHop=0;u.hopT=0;}
  camT.x=S.end.cx;camT.z=S.end.cz;camera.position.copy(S.end.p);camera.quaternion.copy(S.end.q);camera.updateMatrixWorld();updateCamera();
  C.ph='w1';C.wave=1;C.t=0;dcAuto();dcNoRe();if(typeof hud==='function')hud();
}
// its shots (from ddplay.js's ddCam): the yard from the south, behind the run to the back door, then from just over their heads at the front door
// up and out into the battle's own view
function dcSeqCam(rdt){
  const S=dd.seq,T=THREE,c=DCS.camp,D=DCA.door,V=(x,h,y)=>new T.Vector3(x,ddH(x,y)+h,y);rdt=Math.min(rdt||0,.1);let pos,look,k=2.2;
  if(camShiftOn){camera.clearViewOffset();camShiftOn=false;}camShift=0;
  if(S.ph==='camp'||S.ph==='shell'){   // (draft 4) one shot from the south at the battle's distance; a cut after INCOMING!
    // (draft 4) about as far off as the battle's own camera, so they're the size they are in play: the one on his own low on the left, the two at
    // the fire in the middle, the two smoking further back on the right; a slow push in. Out past the base's south fence (hidden meanwhile)
    const T=DCS.T,sm=u=>u*u*(3-2*u),u=sm(clamp(S.t/T.inc,0,1)),vd=DCS.view,f=216-18*u,l=-4+8*u;
    let P=V(c.x-vd.dx*f-vd.dy*l,96-8*u+Math.sin(S.t*.7)*.3,c.y-vd.dy*f+vd.dx*l),Q=V(c.x+vd.dx*8+Math.sin(S.t*.5)*.3,4,c.y+vd.dy*8);
    if(S.t>=T.inc+.12){const v=sm(clamp((S.t-T.inc-.12)/1.6,0,1));P=V(812-v*12,98-v*6,904-v*12);Q=V(642-v*2,5,690-v*2);}   // (a cut as the shout comes: from behind the squad to the corner the shell lands on, the three there in the middle of the picture. Version 249: it came a second after the shout, which was one of the squad's)
    S.camX=P.x;S.camY=P.z;dcSeqFace();
    camera.position.copy(P);camera.lookAt(Q);camera.updateMatrixWorld();camT.x=Q.x;camT.z=Q.z;S.cp=null;return true;}
  // (draft 4: the run filmed from up behind the last of them, about the battle's distance)
  else if(S.ph==='run'){const m=players.filter(alive),mx=m.reduce((a,u)=>a+u.x,0)/m.length,my=m.reduce((a,u)=>a+u.y,0)/m.length;const by=Math.max(...m.map(u=>u.y));pos=V(mx+18,92,by+95);look=V(D.x,10,DCA.cp.y+DCA.cp.h-6);k=4;}
  else if(S.ph==='hut')return true;
  else{const u=(S.t-S.outT)/DCS.T.outDur,e=u<.3?0:(u-.3)/.7,s=e*e*(3-2*e),m=players.filter(alive),ly=m.length?Math.min(...m.map(p=>p.y)):D.y,my=m.length?Math.max(...m.map(p=>p.y)):D.y;
    const p0=V(D.x,0,Math.min(my+20,DCA.cp.y-4));p0.y=ddH(D.x,D.y)+40;const l0=new T.Vector3(D.x,ddH(D.x,ly)+13,ly-240);
    const cam0=S.c0||(S.c0=new T.PerspectiveCamera());cam0.position.copy(p0);cam0.lookAt(l0);
    camera.position.lerpVectors(p0,S.end.p,s);camera.quaternion.copy(cam0.quaternion).slerp(S.end.q,s);camera.updateMatrixWorld();return true;}
  if(!S.cp){S.cp=pos.clone();S.cl=look.clone();}const q=Math.min(1,rdt*k);S.cp.lerp(pos,q);S.cl.lerp(look,q);camT.x=S.cl.x;camT.z=S.cl.z;
  camera.position.copy(S.cp);camera.lookAt(S.cl);camera.updateMatrixWorld();return true;
}
