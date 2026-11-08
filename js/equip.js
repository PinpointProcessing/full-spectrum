"use strict";
/* Between missions (Bryan: "a screen between missions to equip your soldiers... In between the missions, you see your squad
   in the middle of the ocean and can configure the soldiers... it's just so the player can get a feel for it").
   The squad sits in the dinghy at night on open water, the swell lifting it, rain, a far-off light or two, the camera
   drifting round them; over that, the loadout: each soldier's main weapon and his special item. Every rifle is silenced from
   here on (Bryan: "all the units should have silenced assault rifles for this level"); the armory has one M240, one RPG and
   two medic kits. The choice is kept (localStorage) and handed out when the next mission starts (applyLoadout, from
   startLevel2). Everyone carries a frag grenade as before. The frame loop draws this instead of the map while state is
   'equip' (equipFrame, from main.js). */
const LOADOUT_KEY='warehouseYard.loadout.v1';
const ARMORY={weapon:{m4s:9,hmg:1,shotgun:4,sniper:4},spec:{smoke:8,medkit:2,rpg:1,build:4}};   // (smoke for all eight since v121: the freed men are soldiers, base.js)
const EQ_OPTS={weapon:['m4s','hmg','shotgun','sniper'],spec:['smoke','medkit','rpg','build']};
const eqSpecs=id=>['smoke','medkit','rpg',...(classes[id]==='defender'?['build']:[])];   // (the build kit for a Defender: build.js)
const eqWeapons=id=>['m4s','hmg',...(classes[id]==='assault'?['shotgun']:[]),...(classes[id]==='recon'?['sniper']:[])];   // (the shotgun for Assault, the sniper rifle for Recon: classes.js)
const DEFAULT_LOADOUT={A1:{weapon:'m4s',spec:'smoke'},A2:{weapon:'m4s',spec:'medkit'},B1:{weapon:'m4s',spec:'rpg'},B2:{weapon:'m4s',spec:'medkit'},A3:{weapon:'m4s',spec:'smoke'},A4:{weapon:'m4s',spec:'smoke'},B3:{weapon:'m4s',spec:'smoke'},B4:{weapon:'m4s',spec:'smoke'}};   // (the freed men's since v121: picked at the HQ's command center, base.js)
let loadout=readLoadout(),EQ=null,eqNext=null;
function readLoadout(){
  const d=JSON.parse(JSON.stringify(DEFAULT_LOADOUT));
  try{const s=JSON.parse(localStorage.getItem(LOADOUT_KEY)||'null');if(s)for(const id in d){const l=s[id];if(l&&EQ_OPTS.weapon.includes(l.weapon)&&EQ_OPTS.spec.includes(l.spec))d[id]={weapon:l.weapon,spec:l.spec};}}catch(e){}
  for(const k of['weapon','spec'])for(const id in d){const v=d[id][k];if(Object.values(d).filter(l=>l[k]===v).length>ARMORY[k][v])d[id][k]=DEFAULT_LOADOUT[id][k];}   // (over the armory's count: back to his default)
  return d;
}
function saveLoadout(){try{localStorage.setItem(LOADOUT_KEY,JSON.stringify(loadout));}catch(e){}}
const takenBy=(k,v,but)=>Object.keys(loadout).filter(id=>id!==but&&loadout[id][k]===v);
const eqFree=(k,v,id)=>loadout[id][k]===v||takenBy(k,v,id).length<ARMORY[k][v];
function applyLoadout(){   // the next mission's squad gets what was picked (startLevel2)
  for(const p of players){const l=loadout[p.id];if(!l||(p.joined&&!p.kitted)||p.dead)continue;if(!eqWeapons(p.id).includes(l.weapon))l.weapon='m4s';if(!eqSpecs(p.id).includes(l.spec))l.spec=DEFAULT_LOADOUT[p.id].spec;Object.assign(p,{weapon:l.weapon,weapon2:null,spec:l.spec,grenade:p.gl?M203.rounds:1});p.specN=specFull(p);classGear(p);if(p.m)figRefresh(p);}   // (an M203 found in Level 4 stays under his rifle, full)
  buildCards();
}

/* ---------- the ocean ---------- */
const EQ_SEA=2400,EQ_N=110;
function eqWave(x,z,t){   // the swell: a few long waves crossing (units: 10 cm)
  return 3.2*Math.sin(x*.011+t*.9)+2.4*Math.sin(z*.014-t*.75)+1.1*Math.sin((x+z)*.027+t*1.6)+.5*Math.sin((x-z)*.06+t*2.4);
}
function buildEquipScene(){
  const sc=new T.Scene();sc.background=new T.Color(0x04070a);sc.fog=new T.FogExp2(0x060a0e,.0021);
  const hemi=new T.HemisphereLight(0x5d7590,0x05080a,.5);sc.add(hemi);
  const moonL=new T.DirectionalLight(0xa9bfdc,.75);moonL.position.set(-260,300,-420);sc.add(moonL);
  const geo=new T.PlaneGeometry(EQ_SEA,EQ_SEA,EQ_N,EQ_N);geo.rotateX(-Math.PI/2);
  const nt=detailNormalTex().clone();nt.needsUpdate=true;nt.wrapS=nt.wrapT=T.RepeatWrapping;nt.repeat.set(70,70);
  const sea=new T.Mesh(geo,new T.MeshStandardMaterial({color:0x0a1a22,roughness:.2,metalness:.45,normalMap:nt,normalScale:new T.Vector2(.55,.55)}));sc.add(sea);
  const base=Float32Array.from(geo.attributes.position.array);
  const boat=makeDinghy();if(boat.parent)boat.parent.remove(boat);sc.add(boat);
  const wake=new T.Mesh(new T.PlaneGeometry(26,90),new T.MeshBasicMaterial({color:0x9fb8c8,transparent:true,opacity:.08,depthWrite:false}));wake.rotation.x=-Math.PI/2;wake.position.set(0,.6,60);sc.add(wake);   // a faint wake behind
  // far off: a few lights on the horizon (the coast), a red buoy light blinking nearer
  const lights=[];for(const[x,z,c,s]of[[-900,-1000,0xffd9a0,3],[-700,-1100,0xffe2b8,2.2],[-520,-1050,0xffd9a0,2.6],[640,-1150,0xbfe0ff,2],[300,700,0xff3b2a,2.4]]){
    const m=new T.Mesh(new T.SphereGeometry(s,8,6),new T.MeshBasicMaterial({color:c,toneMapped:false,fog:false}));m.position.set(x,8,z);sc.add(m);lights.push(m);}
  // the squad sitting in it (figures of their own, not the units: they look like the next mission's loadout)
  const figs=['A1','A2','B1','B2'].map((id,i)=>{const p=players.find(q=>q.id===id)||{id,name:id,team:id[0]};
    const u={side:'P',team:p.team,id,name:p.name,x:LAND_SEATS[i][0],y:LAND_SEATS[i][1],ang:-Math.PI/2,path:[],inBoat:true,hp:100,level:p.level||1,weapon:loadout[id].weapon,spec:loadout[id].spec,specN:1,lx:0,ly:0};
    makeSoldier(u);moveMesh(u,boat);u.m.g.position.set(u.x,1.2,u.y);u.m.g.rotation.y=-u.ang;if(u.m.spot)u.m.spot.intensity=0;if(u.m.beam)u.m.beam.visible=false;if(u.m.ring)u.m.ring.visible=false;return u;});
  const cam=new T.PerspectiveCamera(38,1,1,6000);
  EQ={scene:sc,sea,base,boat,wake,lights,figs,cam,hemi,t:0,flash:0,nextFlash:8};
}
function equipFrame(rdt,now){
  if(!EQ)return;
  EQ.t+=rdt;const t=EQ.t;simT+=rdt;   // (the figures' idle sway runs on the game clock; the next mission resets it)
  const pos=EQ.sea.geometry.attributes.position,a=pos.array,b=EQ.base;
  for(let i=0;i<a.length;i+=3)a[i+1]=eqWave(b[i],b[i+2],t);
  pos.needsUpdate=true;if(((t*30)|0)%2===0)EQ.sea.geometry.computeVertexNormals();
  EQ.sea.material.normalMap.offset.set(t*.004,t*.006);
  // the boat rides the swell: up and down with it, rolling and pitching with its slope
  const h=eqWave(0,0,t),hx=(eqWave(8,0,t)-eqWave(-8,0,t))/16,hz=(eqWave(0,14,t)-eqWave(0,-14,t))/28;
  EQ.boat.position.set(0,h+.4,0);EQ.boat.rotation.set(Math.atan(hz)*.8,0,-Math.atan(hx)*.8);EQ.wake.position.y=h+.5;
  for(const u of EQ.figs){figRefresh(u);figAnimate(u,u.m);}
  EQ.lights[4].visible=Math.sin(t*3.1)>.6;   // the buoy
  // lightning now and then
  EQ.nextFlash-=rdt;if(EQ.nextFlash<=0&&!reduced){EQ.flash=1;EQ.nextFlash=12+Math.random()*20;if(typeof sfxThunder==='function')sfxThunder();}
  EQ.flash=Math.max(0,EQ.flash-rdt*5);EQ.hemi.intensity=.5+EQ.flash*1.6;
  // the camera drifts round them; the boat sits clear of the panel (above it on a phone, left of it on a wide screen)
  const tall=cw<ch*1.05,c=EQ.cam,ang=t*.07+.6,R=tall?150:96;c.aspect=cw/ch;c.position.set(Math.sin(ang)*R,(tall?44:30)+Math.sin(t*.3)*3,Math.cos(ang)*R);c.lookAt(0,4,0);
  if(tall)c.setViewOffset(cw,ch,0,ch*.33,cw,ch);else c.setViewOffset(cw,ch,cw*.22,0,cw,ch);   // (a phone: in the strip above the panel)
  c.updateProjectionMatrix();
  postRender(EQ.scene,c);
  // rain over it, as outdoors (overlay.js's drops)
  ox.setTransform(dpr,0,0,dpr,0,0);ox.clearRect(0,0,cw,ch);ox.strokeStyle='rgba(170,195,220,.2)';ox.lineWidth=1;ox.beginPath();
  for(const d of rain){d.y+=d.v*rdt;d.x+=d.v*.16*rdt;if(d.y>ch+20){d.y=-20;d.x=Math.random()*cw;}if(d.x>cw+10)d.x=-10;ox.moveTo(d.x,d.y);ox.lineTo(d.x-d.l*.16,d.y-d.l);}
  ox.stroke();if(EQ.flash>0){ox.fillStyle=`rgba(200,215,235,${EQ.flash*.1})`;ox.fillRect(0,0,cw,ch);}
}

/* ---------- the loadout ---------- */
const EQ_LABEL={m4s:'M4 SD',hmg:'M240',shotgun:'Shotgun',sniper:'Sniper',smoke:'Smoke',medkit:'Medkit',rpg:'RPG',build:'Build'};
function eqIcon(k,v){return k==='weapon'?GUN_SVG[v]:SPECIALS[v].svg;}
let eqBuild=null;   // (what the rows were last built for: rebuilt after a class is picked)
function buildEquipUI(box=$('#eqRows'),ids=['A1','A2','B1','B2'],o={boat:true}){   // (the boat's four; since v121 the HQ's command center too, all eight: base.js)
  eqBuild=[box,ids,o];for(const r of document.querySelectorAll('.eq-row[data-id]'))if(!box.contains(r))r.remove();box.innerHTML='';
  for(const id of ids){
    const p=players.find(q=>q.id===id);if(!p||p.dead)continue;if(!loadout[id])loadout[id]={...(DEFAULT_LOADOUT[id]||{weapon:'m4s',spec:'smoke'})};
    const row=document.createElement('div');row.className='eq-row';row.style.setProperty('--tc',teamCol(p));row.dataset.id=id;
    const ck=classes[id];
    row.innerHTML=`<canvas class="eq-face" width="64" height="64"></canvas><div class="eq-who"><b>${id} · ${ck?CLASSES[ck].ab:rankOf(p.level||1).ab}</b><span>${p.name}</span>${o.boat?(ck?'':`<small class="eq-lock">${classesOpen()?'Class · at the HQ':'Class · Unlock HQ first'}</small>`):canPromote(p)?`<button type="button" class="eq-promote" aria-label="Promotion: choose a class for ${p.name}">Promote</button>`:ck?'':`<small class="eq-lock">Lv ${p.level||1} · class at Lv ${CLASS_LEVEL}</small>`}</div>`+
      ['weapon','spec'].map(k=>`<div class="eq-grp" data-k="${k}" role="radiogroup" aria-label="${k==='weapon'?'Weapon':'Special item'}">`+
        (k==='weapon'?eqWeapons(id):eqSpecs(id)).map(v=>`<button type="button" role="radio" data-v="${v}" style="--ic:${k==='spec'?SPECIALS[v].col:'#c9d2d8'}">${eqIcon(k,v)}<span>${EQ_LABEL[v]}</span><i></i></button>`).join('')+'</div>').join('');
    drawFace(row.querySelector('.eq-face'),p);
    row.addEventListener('click',ev=>{if(ev.target.closest('.eq-promote')){classPicker(id,()=>buildEquipUI(...eqBuild),o.host);return;}const bt=ev.target.closest('button[data-v]');if(!bt||bt.disabled)return;const k=bt.parentElement.dataset.k,v=bt.dataset.v;
      if(!eqFree(k,v,id))return;loadout[id][k]=v;const f=EQ&&EQ.figs.find(u=>u.id===id);if(f){f.weapon=loadout[id].weapon;f.spec=loadout[id].spec;}refreshEquipUI();});
    box.appendChild(row);
  }
  refreshEquipUI();
}
function refreshEquipUI(){
  for(const row of document.querySelectorAll('.eq-row[data-id]')){
    const id=row.dataset.id;
    for(const g of row.querySelectorAll('.eq-grp')){const k=g.dataset.k;
      for(const bt of g.querySelectorAll('button')){const v=bt.dataset.v,on=loadout[id][k]===v,free=eqFree(k,v,id),who=takenBy(k,v,id);
        bt.classList.toggle('on',on);bt.setAttribute('aria-checked',on);bt.disabled=!free;
        bt.querySelector('i').textContent=!free&&who.length?(players.find(q=>q.id===who[0])||{}).name||who[0]:'';
        bt.title=!free?`${EQ_LABEL[v]}: the armory has ${ARMORY[k][v]}, taken by ${who.map(w=>(players.find(q=>q.id===w)||{}).name||w).join(', ')}`:EQ_LABEL[v];}}
  }
}
function showEquip(next,title){
  if(!EQ)buildEquipScene();
  eqNext=next;state='equip';paused=false;sel=[];cardGroup=[];preview=null;mode=null;
  for(const u of EQ.figs){const l=loadout[u.id];u.weapon=l.weapon;u.spec=l.spec;}
  $('#intro').hidden=true;$('#aar').hidden=true;$('#end').hidden=true;
  $('#eqNext').textContent=title||'Next: Level 3 · The Data Center';
  buildEquipUI();$('#equip').hidden=false;document.body.classList.add('equipping');hud();
}
function deployFromEquip(){
  saveLoadout();$('#equip').hidden=true;document.body.classList.remove('equipping');
  const n=eqNext;eqNext=null;if(n)n();
}
function bindEquip(){$('#eqGo').addEventListener('click',deployFromEquip);}
