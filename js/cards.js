"use strict";
/* Unit cards floating over the bottom of the map for the selected team (all four when both teams are selected),
   and the team tabs' health pips. Each card: portrait, name, status, a heart-rate monitor and equipment.
   The monitor is green when healthy, yellow when hurt, orange when badly hurt, red when downed and a grey flatline
   when dead; it beats faster under fire, when moving fast or hurt, and goes erratic when downed.
   Tapping a card selects just that soldier; tapping his grenade readies a throw. */
const ECG_SPEED=60;   // how fast the trace sweeps across, px per second
const NADE_SVG='<svg viewBox="0 0 16 16" aria-hidden="true"><ellipse cx="7.5" cy="10" rx="4.6" ry="5"/><rect x="5.8" y="2.6" width="3.4" height="2.6" rx=".6"/><path d="M9.2 3.6h2.6v1.6" fill="none" stroke="currentColor" stroke-width="1.3"/></svg>';
function hpCol(u){return u.dead?'#5b636a':u.downed?'#ff3b2a':u.hp>=70?C.good:u.hp>=35?C.warn:'#ff8a3d';}
function bpmOf(u){
  if(u.dead)return 0;if(u.downed)return 150;
  return clamp(66+u.sup*55+(100-u.hp)*0.45+(u.path.length?(u.gait==='run'?24:8):0)+(contact?10:0),60,175);
}
// one heartbeat, phase 0..1: P wave, QRS spike, T wave
function ecgWave(p){const g=(c,w,a)=>a*Math.exp(-(((p-c)/w)**2));return g(.12,.035,.12)+g(.27,.009,-.14)+g(.3,.011,1)+g(.33,.011,-.32)+g(.56,.05,.24);}

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
    el.innerHTML=`<div class="uc-top"><canvas class="uc-face" width="64" height="64"></canvas><div class="uc-id"><b>${u.id}</b><span class="uc-name">${u.name}</span><span class="uc-st">Ready</span></div></div>`+
      `<canvas class="uc-ecg"></canvas>`+
      `<div class="uc-bot"><span class="uc-hp">100</span><span class="uc-gun">Rifle</span><button class="uc-nade" aria-label="Grenade">${NADE_SVG}<i>1</i></button></div>`;
    const act=ev=>{
      if(state!=='play'||!alive(u))return;
      select([u]);preview=null;
      if(ev&&ev.target.closest('.uc-nade')){if(u.grenade)mode=mode==='grenade'?null:'grenade';else{mode=null;banner(`${u.name} has no grenades left.`,1600);}}
      else mode=null;
      hud();
    };
    el.addEventListener('click',act);
    el.addEventListener('keydown',ev=>{if(ev.key==='Enter'||ev.key===' '){ev.preventDefault();act(null);}});
    box.appendChild(el);
    u.card={el,st:el.querySelector('.uc-st'),hp:el.querySelector('.uc-hp'),nade:el.querySelector('.uc-nade'),ecg:el.querySelector('.uc-ecg'),buf:null,head:0,acc:0,phase:Math.random(),amp:1};
    drawFace(el.querySelector('.uc-face'),u);
  }
}
function statusText(u){
  if(u.dead)return['KIA','down'];
  if(u.downed)return[u.revive>0?'Reviving':`Down ${Math.ceil(u.bleed)}s`,'down'];
  if(u.sup>0.65)return['Pinned','pin'];
  if(u.supT)return['Suppressing',''];
  if(u.path.length)return[u.gait==='sneak'?'Sneaking':'Running',''];
  if(contact)return[peekOf(u)?'Peeking':u.covered?'In cover':'Exposed',''];
  return['Ready',''];
}
// called from hud(): which cards show, and their text
function updateCards(){
  const act=sel.filter(alive),teams=new Set(act.map(u=>u.team)),shown=players.filter(p=>teams.has(p.team));
  const box=$('#cards');box.hidden=!shown.length||state!=='play';box.style.setProperty('--n',shown.length||1);box.classList.toggle('narrow',shown.length>2);
  for(const u of players){
    const c=u.card;if(!c)continue;
    c.el.hidden=!shown.includes(u);
    c.el.classList.toggle('sel',sel.includes(u));c.el.classList.toggle('downed',u.downed);c.el.classList.toggle('kia',u.dead);
    const[t,cls]=statusText(u);c.st.textContent=t;c.st.className='uc-st'+(cls?' '+cls:'');
    c.hp.textContent=u.dead?'—':`${Math.ceil(u.hp)} HP`;c.hp.style.color=hpCol(u);
    c.nade.querySelector('i').textContent=u.grenade;c.nade.disabled=!alive(u)||!u.grenade;
    c.nade.classList.toggle('on',mode==='grenade'&&sel[0]===u);
  }
  $('#stage').style.setProperty('--cards-h',box.hidden?'0px':box.offsetHeight+6+'px');
  for(const tab of document.querySelectorAll('.tab')){
    const t=tab.dataset.team,team=t?players.filter(p=>p.team===t):players,live=team.filter(alive);
    const pips=tab.querySelector('.pips');
    if(pips.children.length!==team.length)pips.innerHTML=team.map(()=>'<i></i>').join('');
    team.forEach((u,k)=>{pips.children[k].style.background=hpCol(u);});
    const all=live.length>0&&live.every(p=>sel.includes(p)),some=live.some(p=>sel.includes(p));
    tab.classList.toggle('sel',all&&(t?true:act.length===live.length));tab.classList.toggle('part',!all&&some);
  }
}
// every frame: sweep the heart monitors of the visible cards
function drawCards(rdt){
  for(const u of players){
    const c=u.card;if(!c||c.el.hidden||c.el.parentNode.hidden)continue;
    const cv2=c.ecg,w=Math.round(cv2.clientWidth),h=Math.round(cv2.clientHeight);if(!w||!h)continue;
    if(cv2.width!==w*dpr||cv2.height!==h*dpr||!c.buf||c.buf.length!==w){cv2.width=w*dpr;cv2.height=h*dpr;c.buf=new Float32Array(w);c.head=0;}
    const bpm=bpmOf(u);
    c.acc+=ECG_SPEED*rdt;
    while(c.acc>=1){
      c.acc-=1;
      let v=0;
      if(!u.dead){
        const prev=c.phase;c.phase+=bpm/60/ECG_SPEED*(u.downed?0.75+Math.random()*0.6:1);
        if(Math.floor(c.phase)!==Math.floor(prev))c.amp=u.downed?0.45+Math.random()*0.5:1;   // downed: uneven beats
        v=ecgWave(c.phase%1)*c.amp+(u.downed?(Math.random()-.5)*.08:0);
      }else v=(Math.random()-.5)*.015;
      c.buf[c.head]=v;c.head=(c.head+1)%w;
    }
    const g=cv2.getContext('2d');g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
    g.strokeStyle='rgba(120,160,170,.08)';g.lineWidth=1;g.beginPath();
    for(let x=10;x<w;x+=10){g.moveTo(x+.5,0);g.lineTo(x+.5,h);}for(let y=7.5;y<h;y+=8){g.moveTo(0,y);g.lineTo(w,y);}g.stroke();
    const col=hpCol(u),base=h*.68,amp=h*.56,gap=10;
    g.strokeStyle=col;g.lineWidth=1.6;g.lineJoin='round';g.shadowColor=col;g.shadowBlur=u.dead?0:5;
    // the trace sweeps left to right, overwriting itself, with a short blank gap just ahead of the write head
    g.beginPath();let pen=false;
    for(let x=0;x<w;x++){
      if((x-c.head+w)%w<gap){pen=false;continue;}
      const y=base-c.buf[x]*amp;if(!pen){g.moveTo(x,y);pen=true;}else g.lineTo(x,y);
    }
    g.stroke();g.shadowBlur=0;
    if(!u.dead){const hx=(c.head-1+w)%w;g.fillStyle='#fff';g.beginPath();g.arc(hx,base-c.buf[hx]*amp,1.6,0,TAU);g.fill();}
    g.font=`700 9px ${HUDFONT}`;g.textAlign='right';g.textBaseline='top';g.fillStyle=col;
    g.fillText(u.dead?'FLAT':`${Math.round(bpm)}`,w-3,2);
  }
}
