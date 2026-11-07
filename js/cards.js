"use strict";
/* Unit cards floating over the bottom of the map for the selected team (all four when both teams are selected),
   and the team tabs' health pips. Each card: portrait, name, status, his health (0-100, a bar and the number: Bryan
   dropped the heart monitor for it), his weapon and his gear (big buttons).
   Tapping a card selects just that soldier (the group's cards stay up), tapping it again goes back to selecting the whole group on show;
   tapping his grenade readies a throw. */
const C4_ON=false;   // Bryan: no demolition charges in this level (the code stays for later); the smoke grenade takes its slot
const SMOKE_SVG='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="5.2" y="8" width="5.6" height="7" rx="1"/><circle cx="4.6" cy="5.4" r="2.3"/><circle cx="8.3" cy="3.6" r="2.7"/><circle cx="11.6" cy="5.6" r="2.1"/></svg>';
const SILENCER_SVG='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1.4" y="5.6" width="10.2" height="4.8" rx="1.7"/><rect x="11.2" y="6.8" width="3.4" height="2.4" rx=".5"/><path d="M4.2 5.6v4.8M7 5.6v4.8" stroke="#10151a" stroke-width=".9"/></svg>';
const RPG_SVG='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="1" y="6.6" width="9.6" height="2.8" rx=".6"/><path d="M10.4 5.2 14.8 8l-4.4 2.8z"/><rect x="4" y="9.2" width="1.6" height="3" rx=".4"/><rect x="6.6" y="9.2" width="1.4" height="2.4" rx=".4"/></svg>';
const MEDKIT_SVG='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x="2" y="4.6" width="12" height="9" rx="1.6"/><rect x="5.7" y="2.5" width="4.6" height="2.6" rx=".8" fill="none" stroke="currentColor" stroke-width="1.2"/><path d="M8 6.7v4.8M5.6 9.1h4.8" stroke="#10151a" stroke-width="1.9"/></svg>';
// the special item each soldier carries beside his grenade (Bryan); swapped by tapping it in a supply box. n: how many he gets
// (the silencer's count is how many quiet shots or bursts it has left before it's worn out). C4 and others can join later
const SPECIALS={smoke:{label:'Smoke',a:'smoke',svg:SMOKE_SVG,col:'#cfd6dc',n:2},medkit:{label:'Medic kit',a:'a medic kit',svg:MEDKIT_SVG,col:'#ff8a7e',n:1},
  silencer:{label:'Silencer',a:'a silencer',svg:SILENCER_SVG,col:'#a9c4d6',n:6},rpg:{label:'RPG',a:'an RPG',svg:RPG_SVG,col:'#ffb36b',n:2},
  build:{label:'Build kit',a:'a build kit',svg:'<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M1 2.5h6.4v3.2H1zM8.4 2.5H15v3.2H8.4zM1 6.7h3v3.2H1zM5 6.7h6v3.2H5zM12 6.7h3v3.2h-3zM1 10.9h6.4v3.2H1zM8.4 10.9H15v3.2H8.4z"/></svg>',col:'#d9b46a',n:3}},SPEC_ORDER=['smoke','medkit','silencer','rpg','build'];   // (the build kit: a Defender's, build.js)
const specFull=u=>u.spec==='medkit'&&isCls(u,'medic')?CLS.kits:u.spec==='rpg'&&isCls(u,'support')?CLS.rockets:(SPECIALS[u.spec]||{}).n||1;   // (a Medic's kits, a Support's rockets: classes.js)
const fmtT=s=>{const t=Math.max(0,Math.ceil(s));return `${Math.floor(t/60)}:${String(t%60).padStart(2,'0')}`;};
const inSupply=u=>{const z=alive(u)&&zoneAt(u.x,u.y);return !!(z&&z.k==='sup');};
const NADE_SVG='<svg viewBox="0 0 16 16" aria-hidden="true"><ellipse cx="7.5" cy="10" rx="4.6" ry="5"/><rect x="5.8" y="2.6" width="3.4" height="2.6" rx=".6"/><path d="M9.2 3.6h2.6v1.6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
const M203_SVG='<svg viewBox="0 0 16 16" aria-hidden="true"><rect x=".8" y="5.2" width="10.6" height="5.6" rx="1.4"/><rect x="11" y="6.4" width="4.2" height="3.2" rx=".6"/><rect x="3.4" y="10.4" width="2.2" height="3.6" rx=".5"/><rect x="6.6" y="3" width="1.6" height="2.4" rx=".3"/></svg>';   // (the M203: a launcher under the rifle, Level 4's find)
// weapon silhouettes for the cards (our own drawings): an assault rifle with a curved magazine, a pump shotgun
const GUN_SVG={
  rifle:'<svg viewBox="0 0 48 16" aria-hidden="true"><path d="M0 6.2 8.5 5H11v5H8.5L1 12.2z"/><path d="M11 4h19v5.2H11z"/><path d="M13 2.4h7.5v1.6H13z"/><path d="M15.5 9.2h3.4l-1 4.8h-3.3z"/><path d="M21 9.2h4.2l1.4 4.6-3.2 1.2z"/><path d="M30 4.6h8.5v3.6H30z"/><path d="M38.5 5.6H47v1.3h-8.5z"/><path d="M34.6 2.8h1.2v1.8h-1.2z"/></svg>',
  m4s:'<svg viewBox="0 0 48 16" aria-hidden="true"><path d="M0 6.2 8.5 5H11v5H8.5L1 12.2z"/><path d="M11 4h17v5.2H11z"/><path d="M13 2.4h7.5v1.6H13z"/><path d="M15.5 9.2h3.4l-1 4.8h-3.3z"/><path d="M21 9.2h4.2l1.4 4.6-3.2 1.2z"/><path d="M28 4.6h6v3.6h-6z"/><rect x="34" y="4.2" width="13.6" height="4.4" rx="1.4"/><path d="M31.6 2.8h1.2v1.8h-1.2z"/></svg>',   // (an M4 with a suppressor on the muzzle)
  hmg:'<svg viewBox="0 0 48 16" aria-hidden="true"><path d="M0 6 7.5 4.8H10v5H7.5L1 11.6z"/><path d="M10 3.6h16v5.6H10z"/><path d="M12 1.8h9v1.8h-9z"/><path d="M14 9.2h7v3.6h-7z"/><path d="M22 9.2h3l.8 3.8-2.6.8z"/><path d="M26 4.4h6v3.8h-6z"/><path d="M32 5.4h15v1.6H32z"/><path d="M36.5 7l-2.4 7h1.2l2.6-6.4zM38 7l2.6 6.8h1.2L39.2 7z"/></svg>',
  sniper:'<svg viewBox="0 0 48 16" aria-hidden="true"><path d="M0 7 9 5.6h3v4.6H9L1 12.4z"/><path d="M12 6h15v3.6H12z"/><path d="M14 2.2h12v2.6H14z"/><path d="M13 2.8h2v1.4h-2zM25 2.8h2.4v1.4H25z"/><path d="M18.5 4.8h2v1.2h-2z"/><path d="M16 9.6h3l-.6 3.4h-2.8z"/><path d="M27 6.8h20v1.2H27z"/><path d="M22 9.6h2.6l1 2.6-2.2.6z"/></svg>',
  shotgun:'<svg viewBox="0 0 48 16" aria-hidden="true"><path d="M0 6.4 10 5h1v4.4h-1L1 12z"/><path d="M11 4.6h9.5v4.8H11z"/><path d="M13.8 9.4h3.2l-1 4.2h-3.1z"/><path d="M20.5 5h26.5v1.5H20.5z"/><path d="M20.5 7h19.5v1.5H20.5z"/><path d="M24 6.3h9.5v3.4H24z"/><path d="M45.6 3.9h1v1.1h-1z"/></svg>'};
// the gun row: his weapon, and with a second gun (the sniper rifle off the tower) a SWAP tag naming the other one: tap to swap
function gunHTML(u){
  if(!u.weapon)return'<b class="unarmed">Unarmed</b>';   // (a freed prisoner until he picks one up: office.js)
  return `${GUN_SVG[u.weapon]}<b>${WEAPON[u.weapon].label}</b>`+(u.weapon2?`<i class="uc-swap">&#8644; ${WEAPON[u.weapon2].label}</i>`:'');
}
function hpCol(u){return u.dead?'#5b636a':u.downed?'#ff3b2a':u.hp>=70?C.good:u.hp>=35?C.warn:'#ff8a3d';}
function shade(hex,k){const n=parseInt(hex.slice(1),16),f=v=>clamp(Math.round(v*(1+k)),0,255);return`rgb(${f(n>>16)},${f(n>>8&255)},${f(n&255)})`;}
// a small procedural portrait: helmeted head and shoulders, skin tone and details varied per soldier
function drawFace(c,u){
  const g=c.getContext('2d'),w=c.width,h=c.height;
  let s=7;for(const ch of u.id+u.name)s=(s*31+ch.charCodeAt(0))|0;const r=rng(s);
  const skin=['#e3b896','#c99268','#a06a45','#74472b','#d6a07a'][(r()*5)|0],helm=['#3d4a3c','#45463a','#363f44'][(r()*3)|0];
  const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#24303a');bg.addColorStop(1,'#0a0e11');g.fillStyle=bg;g.fillRect(0,0,w,h);
  g.fillStyle='#2c362f';g.beginPath();g.moveTo(2,h);g.quadraticCurveTo(6,h*.74,w*.5,h*.72);g.quadraticCurveTo(w-6,h*.74,w-2,h);g.fill();   // shoulders
  g.fillStyle='#1d241f';g.fillRect(w*.3,h*.8,w*.4,h*.2);                                                                                   // vest
  g.fillStyle=teamCol(u);g.fillRect(w*.36,h*.86,w*.28,h*.05);                                                                              // team patch
  g.fillStyle=shade(skin,-.22);g.fillRect(w*.42,h*.6,w*.16,h*.15);                                                                         // neck
  g.fillStyle=skin;g.beginPath();g.ellipse(w*.5,h*.52,w*.17,h*.2,0,0,7);g.fill();                                                          // face
  g.fillStyle=shade(skin,-.18);g.beginPath();g.ellipse(w*.56,h*.55,w*.1,h*.16,0,-1.2,1.2);g.fill();                                        // side shadow
  if(r()<.6){g.fillStyle='rgba(25,18,12,.3)';g.beginPath();g.ellipse(w*.5,h*.63,w*.13,h*.08,0,0,Math.PI);g.fill();}                       // stubble
  g.fillStyle='#120e0b';g.fillRect(w*.4,h*.5,w*.07,h*.03);g.fillRect(w*.53,h*.5,w*.07,h*.03);                                              // eyes
  g.fillStyle='rgba(20,14,10,.55)';g.fillRect(w*.39,h*.465,w*.09,h*.02);g.fillRect(w*.52,h*.465,w*.09,h*.02);                              // brows
  g.fillStyle=helm;g.beginPath();g.ellipse(w*.5,h*.43,w*.24,h*.2,0,Math.PI,0);g.fill();g.fillRect(w*.26,h*.41,w*.48,h*.05);               // helmet
  g.fillStyle='rgba(255,255,255,.08)';g.beginPath();g.ellipse(w*.42,h*.33,w*.1,h*.05,-.3,0,7);g.fill();                                    // helmet sheen
  g.fillStyle='#1c221d';g.fillRect(w*.45,h*.25,w*.1,h*.07);                                                                                // NVG mount
  if(r()<.5){g.fillStyle='#15191a';g.fillRect(w*.33,h*.36,w*.34,h*.06);g.fillStyle='rgba(120,170,200,.35)';g.fillRect(w*.36,h*.37,w*.11,h*.04);g.fillRect(w*.53,h*.37,w*.11,h*.04);}   // goggles up
  g.strokeStyle='#1a1f1b';g.lineWidth=w*.025;g.beginPath();g.moveTo(w*.3,h*.46);g.quadraticCurveTo(w*.34,h*.66,w*.44,h*.72);g.moveTo(w*.7,h*.46);g.quadraticCurveTo(w*.66,h*.66,w*.56,h*.72);g.stroke();   // chin strap
}

function buildCards(){
  const box=$('#cards');box.innerHTML='';
  for(const u of players){
    const el=document.createElement('div');el.className='ucard';el.style.setProperty('--tc',teamCol(u));
    el.setAttribute('role','button');el.tabIndex=0;el.setAttribute('aria-label',`${u.id} ${u.name}`);
    el.innerHTML=`<div class="uc-top"><canvas class="uc-face" width="64" height="64"></canvas><div class="uc-id"><b>${u.id} · ${classOf(u)?CLASSES[classOf(u)].ab:rankOf(u.level).ab}</b><span class="uc-name">${u.name}</span><span class="uc-st">Ready</span></div></div>`+
      `<div class="uc-hpb"><i></i><span class="uc-hp">100</span></div>`+
      `<div class="uc-gun"></div>`+   // (filled by updateCards: gunHTML)
      `<div class="uc-bot">${C4_ON?'<button class="uc-rpg" aria-label="Demolition charge">C4<i>1</i></button>':''}<button class="uc-skill" aria-label="Class skill" hidden></button><button class="uc-spec" aria-label="Special item"></button><button class="uc-nade" aria-label="Grenade">${NADE_SVG}<i>1</i></button></div>`;
    const act=ev=>{
      if(state!=='play'||!alive(u))return;
      const g=ev&&ev.target.closest('.uc-rpg,.uc-skill,.uc-spec,.uc-nade,.uc-gun.swap');   // (Level 1's tutorial lets through only what it asks for: level1.js)
      if(!tutAllows(g?'gear':'card',g?{u,id:u.id,item:g.classList.contains('uc-nade')?'nade':g.classList.contains('uc-spec')?'spec':g.classList.contains('uc-gun')?'gun':'c4'}:u))return;
      if(g&&g.classList.contains('uc-gun')){if(mode==='silent')mode=null;swapWeapon(u);hud();return;}   // his second gun (the sniper rifle): swap, nothing else changes
      if(!selectAway(sel.length===1&&sel[0]===u&&!g?cardGroup.filter(alive):[u])){hud();return;}   // (a man somewhere else: the camera goes to him, not while the men on screen are under fire: input.js)
      preview=null;
      if(ev&&ev.target.closest('.uc-rpg')){select([u]);if(u.charges&&!u.inVeh)mode=mode==='charge'?null:'charge';else{mode=null;banner(`${u.name} has no charge left. Restock at a supply box.`,1800);}}   // demolition charge
      else if(ev&&ev.target.closest('.uc-skill')){select([u]);useSkill(u);}   // his class's skill (skills.js)
      else if(ev&&ev.target.closest('.uc-spec')){   // his special item: use it (Bryan: ammo drops refill it, no swapping)
        select([u]);const sp=SPECIALS[u.spec];
        if(!u.specN||u.inVeh){mode=null;banner(`${u.name} has no ${sp.label==='RPG'?'rockets':sp.label.toLowerCase()} left. Refill at an ammo drop.`,1800);}
        else if(u.spec==='build')mode=mode==='build'?(u.specN>=BUILD.wall.cost?'buildwall':null):mode==='buildwall'?null:'build';   // the build kit: a barricade; tap again for a wall, again to cancel (build.js)
        else{const m={medkit:'medkit',silencer:'silent',rpg:'rpg'}[u.spec]||'smoke';mode=mode===m?null:m;}   // (the silencer: tap a hostile who hasn't seen him; the RPG: tap where: combat.js)
      }
      else if(ev&&ev.target.closest('.uc-nade')){select([u]);if(u.grenade)mode=mode==='grenade'?null:'grenade';else{mode=null;banner(u.gl?`${u.name} has no M203 rounds left. Refill at an ammo drop.`:`${u.name} has no grenades left.`,1600);}}
      else mode=null;   // tap him again: back to the whole group on show (picked above)
      hud();
    };
    el.addEventListener('click',act);
    el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();act(null);}});
    box.appendChild(el);
    u.card={el,idb:el.querySelector('.uc-id b'),gun:el.querySelector('.uc-gun'),st:el.querySelector('.uc-st'),hp:el.querySelector('.uc-hp'),nade:el.querySelector('.uc-nade'),spec:el.querySelector('.uc-spec'),skill:el.querySelector('.uc-skill'),rpg:el.querySelector('.uc-rpg'),hpb:el.querySelector('.uc-hpb')};
    drawFace(el.querySelector('.uc-face'),u);
  }
}
function statusText(u){
  if(u.dead)return['KIA','down'];
  if(u.offMap)return['Outside','down'];   // left downed outside the office building: frozen until the squad comes back out
  if(u.downed)return[u.carriedBy?'Carried':u.critical?(u.noBleed?'Critical':`Critical ${fmtT(u.crit)}`):u.revive>0?'Reviving':`Down ${Math.ceil(u.bleed)}s`,'down'];
  if(simT<(u.stunT||0))return['Knocked down','pin'];
  if(u.carry)return['Carrying',''];
  if(u.cargo)return['Carrying '+u.cargo.label.toLowerCase(),''];   // (Level 4's parts: level4.js)
  if(u.onGun)return['On the gun',''];
  if(u.climb)return['Climbing',''];
  if(u.onTower)return[u.weapon==='sniper'?'Sniping':'On the tower',''];
  if(u.climbGo)return['To the tower',''];
  if(u.manGo)return['To the gun',''];
  if(u.breaching||simT<(u.breachT||0))return['Breaching',''];
  if(breach&&breach.team.includes(u))return['Stacking up',''];
  if(u.medGo)return[u.path.length?'To the wounded':'Medic kit',''];
  if(u.carryGo)return['Getting him',''];
  if(u.inVeh)return[{driver:'Driving',gunner:'On the gun',pass:'Riding'}[u.seat],''];
  if(u.boarding)return['Mounting up',''];
  if(u.inBoat)return['In the boat',''];
  if(u.crawl)return[u.path.length?'Crawling':'In the pipe',''];
  if(u.tk)return[u.tk.strike?'Takedown':'Sneaking up',''];
  if(u.doorT>0)return['Opening door',''];
  if(u.deploy)return['Setting up',''];
  if(u.bar)return['Barring door',''];
  if(u.build)return[u.build.p>0?'Building':'Going to build',''];if(u.pack)return['Packing up',''];
  if(u.silent)return['Taking aim',''];
  if(u.sup>0.65)return['Pinned','pin'];
  if(u.supT)return['Suppressing',''];
  if(u.vaultK)return['Vaulting',''];
  if(u.path.length)return[u.gait==='sneak'?'Sneaking':'Running',''];
  if(caught(u))return[peekOf(u)?'Peeking':u.covered?'In cover':'Exposed',''];
  if(contact)return['Hidden',''];   // (his team still unseen while the other fights: hunt.js)
  return['Ready',''];
}
// called from hud(): which cards show, and their text
function updateCards(){
  const act=sel.filter(alive),shown=cardGroup;
  const box=$('#cards');box.hidden=!shown.length||state!=='play';box.style.setProperty('--n',Math.min(4,shown.length)||1);box.classList.toggle('narrow',shown.length>2);box.classList.toggle('compact',shown.length>4);   // more than four (the freed prisoners): two rows of small cards
  const compact=shown.length>4;
  for(const u of players){
    const c=u.card;if(!c)continue;
    c.el.hidden=!shown.includes(u);
    // more than four on show (up to eight: two squads of four, Bryan): Alpha's row on top, Bravo's under it, each man always in
    // his own slot (A3 third along); the name goes up beside the callsign and the rank comes off, a line less per row
    const ck=compact?'c':'n';if(c.el.dataset.k!==ck){c.el.dataset.k=ck;const n=+u.id.slice(1)||1;
      c.el.style.gridRow=compact?(u.team==='A'?'1':'2'):'';c.el.style.gridColumn=compact?String(Math.min(4,n)):'';
      c.idb.textContent=compact?u.name:`${u.id} · ${classOf(u)?CLASSES[classOf(u)].ab:rankOf(u.level).ab}`;}
    c.el.classList.toggle('sel',sel.includes(u));c.el.classList.toggle('downed',u.downed);c.el.classList.toggle('kia',u.dead);
    const[t,cls]=statusText(u);c.st.textContent=t;c.st.className='uc-st'+(cls?' '+cls:'');
    c.hp.textContent=u.dead?'KIA':`${Math.ceil(u.hp)}`;c.hp.classList.toggle('kia',u.dead);
    c.hpb.style.setProperty('--hp',(u.dead?0:clamp(u.hp,0,100))+'%');c.hpb.style.setProperty('--hc',hpCol(u));
    const gk=(u.weapon||'-')+'|'+(u.weapon2||'');if(c.gun.dataset.k!==gk){c.gun.dataset.k=gk;c.gun.innerHTML=gunHTML(u);c.gun.classList.toggle('swap',!!u.weapon2);c.gun.title=u.weapon2?`Swap to the ${WEAPON[u.weapon2].label}`:u.weapon?WEAPON[u.weapon].label:'Unarmed';}
    if(c.nade.dataset.gl!==String(!!u.gl)){c.nade.dataset.gl=String(!!u.gl);c.nade.innerHTML=(u.gl?M203_SVG:NADE_SVG)+'<i></i>';c.nade.setAttribute('aria-label',u.gl?'M203 grenade launcher':'Grenade');c.nade.classList.toggle('gl',!!u.gl);}   // (the M203 in the grenade's place)
    c.nade.querySelector('i').textContent=u.grenade;c.nade.disabled=!alive(u)||!u.grenade||!!u.inVeh;
    c.nade.classList.toggle('on',mode==='grenade'&&sel[0]===u);
    c.spec.hidden=!u.spec;c.nade.hidden=!!u.joined&&!u.grenade;   // a freed prisoner has no gear
    if(u.spec){const sp=SPECIALS[u.spec]||SPECIALS.smoke,sw=false;   // his special item, left of the frag
     if(c.spec.dataset.k!==u.spec){c.spec.dataset.k=u.spec;c.spec.innerHTML=`${sp.svg}<i></i>`;c.spec.style.setProperty('--ic',sp.col);c.spec.setAttribute('aria-label',sp.label);}
     c.spec.querySelector('i').textContent=u.specN||0;c.spec.disabled=!alive(u)||(!u.specN&&!sw)||!!u.inVeh;
     c.spec.classList.toggle('on',(mode==='smoke'||mode==='medkit'||mode==='silent'||mode==='rpg'||mode==='build'||mode==='buildwall')&&sel[0]===u);}
    {const k=skillOf(u);c.skill.hidden=!k;c.skill.parentElement.classList.toggle('three',!!k&&!c.spec.hidden);if(k){   // his class's skill, left of his special item (skills.js)
      if(c.skill.dataset.k!==k){c.skill.dataset.k=k;c.skill.innerHTML=`${SKILL_SVG[k]}<i></i>`;c.skill.setAttribute('aria-label',SKILL[k].label);c.skill.title=SKILL[k].label;}
      const cd=SKILL[k].cd?Math.max(0,Math.ceil((u.skillT||0)-simT)):0;c.skill.querySelector('i').textContent=SKILL[k].cd?(cd?cd+'s':''):(u.skillN||0);
      c.skill.disabled=!alive(u)||!skillReady(u)||!!u.inVeh;c.skill.classList.toggle('on',mode===k&&sel[0]===u||!!u.deploy);}}
    if(c.rpg){c.rpg.querySelector('i').textContent=u.charges||0;c.rpg.disabled=!alive(u)||!u.charges||!!u.inVeh;c.rpg.classList.toggle('on',mode==='charge'&&sel[0]===u);}   // the demolition charge (off in this level)
  }
  $('#stage').style.setProperty('--cards-h',box.hidden?'0px':box.offsetHeight+6+'px');
  for(const tab of document.querySelectorAll('.tab')){
    const t=tab.dataset.team,team=t?players.filter(p=>p.team===t):players,live=team.filter(alive);
    const pips=tab.querySelector('.pips');
    if(pips.children.length!==team.length)pips.innerHTML=team.map(()=>'<i></i>').join('');
    pips.classList.toggle('many',team.length>4);
    team.forEach((u,k)=>{pips.children[k].style.background=hpCol(u);});
    const all=live.length>0&&live.every(p=>sel.includes(p)),some=live.some(p=>sel.includes(p));
    tab.classList.toggle('sel',all&&(t?true:act.length===live.length));tab.classList.toggle('part',!all&&some);
  }
}
