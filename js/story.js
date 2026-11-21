/* ---------- conversations outside battle (Bryan, after v85: "Do you think we can handle longer conversations? Or do you
   think we should fall back to text conversations outside of battle?") ----------
   A conversation plays in a panel along the bottom of the map: the speaker's portrait, his name and his words, typed on
   quickly. A tap shows the rest of the line, or goes on to the next; Skip ends it; Space or Enter go on, Escape skips. A line
   plays its voice too once it has one (voiceClip; until then the words alone), out loud rather than over the radio: they're
   face to face. In battle the squad keeps to short lines over the radio (voice.js, chatter.js, the scene after the gate in
   monsters.js). */
const talk={on:false,q:[],i:-1,done:null,full:'',typed:0,src:null,timer:0};
const talkActive=()=>talk.on;
// lines: [{who: the one speaking, text, clip: his voice line if there is one, to: whom he turns to}]
function talkStart(lines,done){
  talk.q=lines.filter(l=>l&&l.who&&!l.who.dead);talk.i=-1;talk.done=done;
  if(!talk.q.length){if(done)done();return;}
  talk.on=true;select([]);preview=null;mode=null;$('#cards').hidden=true;$('#talk').hidden=false;
  clearInterval(talk.timer);talk.timer=setInterval(talkType,30);
  talkNext();
}
function talkType(){   // (two letters every 30 ms: about 65 a second)
  if(!talk.on||talk.typed>=talk.full.length)return;
  talk.typed=Math.min(talk.full.length,talk.typed+2);$('#talk .tk-text').textContent=talk.full.slice(0,talk.typed);
  if(talk.typed>=talk.full.length)$('#talk').classList.add('more');
}
function talkNext(){
  if(!talk.on)return;
  if(talk.typed<talk.full.length){talk.typed=talk.full.length;$('#talk .tk-text').textContent=talk.full;$('#talk').classList.add('more');return;}   // (a tap while the words are coming: all of them)
  talkHush();talk.i++;if(talk.i>=talk.q.length){talkEnd();return;}
  const l=talk.q[talk.i],w=l.who,el=$('#talk'),sci=!!w.sci;
  if(l.to)w.ang=Math.atan2(l.to.y-w.y,l.to.x-w.x);   // (he turns to whoever he's talking to)
  el.style.setProperty('--tc',sci?'#cfd9df':teamCol(w));
  el.querySelector('.tk-name').textContent=sci?w.name:`${w.id} · ${w.name}`;
  (sci?drawSciFace:drawFace)(el.querySelector('.tk-face'),w);
  talk.full=l.text;talk.typed=0;el.querySelector('.tk-text').textContent='';el.classList.remove('more');
  if(l.clip&&typeof voiceClip==='function')voiceClip(sci?speakerOf(w):w.id,l.clip,{x:w.x,y:w.y,vol:1.1,onSrc:s=>{talk.src=s;}});
}
function talkHush(){if(talk.src){try{talk.src.stop();}catch(e){}talk.src=null;}}   // (the line still being said, when the player taps on)
function talkStop(){talkHush();clearInterval(talk.timer);talk.on=false;talk.q=[];talk.full='';talk.typed=0;talk.done=null;$('#talk').hidden=true;$('#talk').classList.remove('more');}
function talkEnd(){const d=talk.done;talkStop();hud();if(d)d();}
function bindTalk(){   // (at boot)
  const el=$('#talk');
  el.addEventListener('pointerdown',ev=>{ev.preventDefault();ev.stopPropagation();if(!talk.on)return;if(ev.target.closest('.tk-skip'))talkEnd();else talkNext();});
  addEventListener('keydown',ev=>{if(!talk.on)return;
    if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();ev.stopImmediatePropagation();talkNext();}
    else if(ev.key==='Escape'){ev.preventDefault();ev.stopImmediatePropagation();talkEnd();}},true);
}

// a scientist's portrait, drawn like the soldiers' (cards.js's drawFace): bare-headed, glasses, a white coat over shirt and tie
function drawSciFace(c,u){
  const g=c.getContext('2d'),w=c.width,h=c.height;
  let s=11;for(const ch of `${u.id}${u.sciN||0}`)s=(s*31+ch.charCodeAt(0))|0;const r=rng(s);
  const skin=['#e6bf9f','#d2a07c','#a8734f','#7a4b2e'][(r()*4)|0],hair=['#77726c','#3b2f27','#9a948c','#2a2421'][(r()*4)|0];
  const bg=g.createLinearGradient(0,0,0,h);bg.addColorStop(0,'#2a333a');bg.addColorStop(1,'#0c1013');g.fillStyle=bg;g.fillRect(0,0,w,h);
  g.fillStyle='#d6dce0';g.beginPath();g.moveTo(2,h);g.quadraticCurveTo(6,h*.74,w*.5,h*.71);g.quadraticCurveTo(w-6,h*.74,w-2,h);g.fill();   // the coat
  g.fillStyle='#aab3b9';g.beginPath();g.moveTo(w*.33,h);g.lineTo(w*.43,h*.74);g.lineTo(w*.5,h*.86);g.lineTo(w*.57,h*.74);g.lineTo(w*.67,h);g.fill();   // lapels
  g.fillStyle='#9fb4c4';g.beginPath();g.moveTo(w*.43,h*.74);g.lineTo(w*.5,h*.86);g.lineTo(w*.57,h*.74);g.fill();                                // shirt
  g.fillStyle='#2b3a4c';g.beginPath();g.moveTo(w*.48,h*.8);g.lineTo(w*.52,h*.8);g.lineTo(w*.54,h);g.lineTo(w*.46,h);g.fill();                    // tie
  g.fillStyle='#e9eef2';g.fillRect(w*.64,h*.86,w*.1,h*.06);g.fillStyle='#4a6070';g.fillRect(w*.65,h*.87,w*.08,h*.02);                            // ID badge
  g.fillStyle=shade(skin,-.22);g.fillRect(w*.42,h*.6,w*.16,h*.14);                                                                               // neck
  g.fillStyle=skin;g.beginPath();g.ellipse(w*.5,h*.5,w*.17,h*.21,0,0,7);g.fill();                                                                 // face
  g.fillStyle=shade(skin,-.18);g.beginPath();g.ellipse(w*.56,h*.53,w*.1,h*.17,0,-1.2,1.2);g.fill();                                               // side shadow
  g.fillStyle=hair;g.beginPath();g.ellipse(w*.5,h*.34,w*.18,h*.09,0,Math.PI,0);g.fill();g.fillRect(w*.32,h*.33,w*.04,h*.16);g.fillRect(w*.64,h*.33,w*.04,h*.16);   // hair, the sides
  if(r()<.35){g.fillStyle=hair;g.beginPath();g.ellipse(w*.5,h*.62,w*.07,h*.025,0,0,7);g.fill();}                                                  // a moustache
  g.fillStyle='#120e0b';g.fillRect(w*.41,h*.48,w*.06,h*.03);g.fillRect(w*.53,h*.48,w*.06,h*.03);                                                  // eyes
  g.fillStyle='rgba(20,14,10,.5)';g.fillRect(w*.39,h*.44,w*.09,h*.02);g.fillRect(w*.52,h*.44,w*.09,h*.02);                                        // brows
  g.strokeStyle='#1d2328';g.lineWidth=w*.022;g.strokeRect(w*.37,h*.455,w*.12,h*.075);g.strokeRect(w*.51,h*.455,w*.12,h*.075);                     // glasses
  g.beginPath();g.moveTo(w*.49,h*.49);g.lineTo(w*.51,h*.49);g.stroke();
  g.fillStyle='rgba(170,200,220,.18)';g.fillRect(w*.38,h*.46,w*.1,h*.03);g.fillRect(w*.52,h*.46,w*.1,h*.03);                                      // a glint on them
  g.strokeStyle='rgba(60,30,25,.55)';g.lineWidth=w*.015;g.beginPath();g.moveTo(w*.45,h*.6);g.quadraticCurveTo(w*.5,h*.585,w*.55,h*.6);g.stroke();   // a tight mouth
}
