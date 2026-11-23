/* Claude in the game, when the page can reach it (as in Ashvale): it writes what people say, and it reads the broadcast aloud.
   Everything here is optional. With no Claude the set lines and the device's own speech are used and nothing else changes. */
const AI={sample:null,tts:null,asked:false,banter:null,used:{},talkT:22};
function aiInit(){
  try{if(!window.claude||typeof window.claude.use!=='function')return;
    window.claude.use('sample').then(s=>{AI.sample=s||null;}).catch(()=>{});
    window.claude.use('tts').then(t=>{AI.tts=t||null;}).catch(()=>{});}catch(e){}
}
const aiOff=e=>{const c=e&&e.code;if(['not_granted','sampling_disabled','not_declared','capability_disabled','capability_removed'].includes(c))AI.sample=null;};
const clean=(t,n)=>typeof t==='string'?t.replace(/\s+/g,' ').trim().slice(0,n):'';
/* once, when the game is started: tonight's wording of the broadcast, and a few lines for each survivor */
function aiBrief(){
  if(!AI.sample||AI.asked)return;AI.asked=true;
  const P=['You are writing dialogue for a small zombie-survival game set in an American suburb at dawn. Tone: played straight, a little dry, never jokey.',
    'PART 1, a local TV emergency broadcast read by two anchors, Hal Brenner and Denise Carroway. Calm, flat newsreader voices. Exactly 6 lines, alternating Hal, Denise, Hal, Denise, Hal, Denise:',
    '1 Hal: interrupting for an emergency broadcast (max 10 words). 2 Denise: a highly contagious virus is spreading locally (max 16 words). 3 Hal: the infected lose their minds and attack people (max 15 words). 4 Denise: do not approach them or try to help them, even people you know (max 15 words). 5 Hal: begins advice for anyone bitten, then breaks off because of a noise; must end with the words "what was that?" (max 11 words). 6 Denise: alarmed, to Hal, about the studio door (max 7 words).',
    'PART 2, four survivors the player rescues. For each, 4 short lines (max 14 words each) in their own voice: "join" (just rescued), "fight" (zombies close), "hurt" (wounded), "calm" (a quiet moment walking).',
    'Walt: 70s, bathrobe, golf club, was on his van roof all night, gruff and wry. Jules: teenager, skateboard, scared but quick. Marisol: nurse in scrubs, butcher knife, practical, heals the group. Dunn: police officer, tired, dutiful, low on ammunition.',
    'Reply with only JSON: {"news":["…",6 strings],"banter":{"walt":{"join":"…","fight":"…","hurt":"…","calm":"…"},"jules":{…},"marisol":{…},"dunn":{…}}}'].join('\n');
  AI.sample.json(P,{modelTier:'quick'}).then(r=>{
    if(!r||typeof r!=='object')return;
    if(Array.isArray(r.news)&&r.news.length===6&&tv.mode!=='cast'&&!tv.done)r.news.forEach((t,i)=>{t=clean(t,150);if(t&&t.split(' ').length<=CAST[i].d*3.2+2)CAST[i].text=t;});
    if(r.banter&&typeof r.banter==='object')AI.banter=r.banter;
  }).catch(aiOff);
}
function aiLine(key,kind){
  const b=AI.banter&&AI.banter[key],t=b&&clean(b[kind],110);if(!t||AI.used[key+kind])return '';AI.used[key+kind]=1;return t;
}
/* now and then one of the people with you says something that fits the moment */
function allyTalk(dt){
  if(!AI.banter||SF.in)return;AI.talkT-=dt;if(AI.talkT>0)return;AI.talkT=rand(16,26);
  const a=pick(allies.filter(x=>!x.dead));if(!a)return;
  const close=zeds.some(z=>!z.dead&&!z.far&&hyp(z.x-a.x,z.y-a.y)<70),t=aiLine(a.key,a.hp<a.maxhp*.5?'hurt':close?'fight':'calm');
  if(t){floatText(a,t,COL.ally);}
}
/* Ruth, in her garage, talks about what she can actually see: who you came in with and what state you are in */
function aiRuth(){
  if(!AI.sample)return;
  const who=allies.filter(a=>!a.dead).map(a=>a.name),P=['You are Ruth, 68, a retired school bus driver hiding in her boarded-up garage on Sycamore Court during the first morning of a zombie outbreak. A stranger has just come in off the street and you have barred the door behind them.',
    `What you can see: the stranger is ${L.hp<L.maxhp*.5?'badly hurt':L.hp<L.maxhp*.85?'scratched up':'unhurt'}, carrying ${L.melee==='fists'?'nothing':'a '+MELEE[L.melee].name.toLowerCase()}. ${who.length?'With them: '+who.join(', ')+'.':'They are alone.'} They have put down ${stats.kills} of the infected so far.`,
    'Say four short things, one at a time (max 22 words each), plain and warm and unsentimental: 1) a greeting that reacts to what you see; 2) something you have learned: they follow noise; 3) where to go: the storm drain at the north end, the red wheel by the grate takes a minute to turn, hold them off while it turns; 4) why you are staying (your knees) and a goodbye telling them to bar the door.',
    'Reply with only JSON: {"lines":["…","…","…","…"]}'].join('\n');
  AI.sample.json(P,{modelTier:'quick',cache:false}).then(r=>{
    const ls=r&&Array.isArray(r.lines)?r.lines.map(t=>clean(t,170)).filter(Boolean):[];
    if(ls.length>=3&&SF.in)for(let i=SF.i;i<Math.min(ls.length,SF.lines.length);i++)SF.lines[i]=ls[i];      // lines she has not said yet are replaced
  }).catch(aiOff);
}
