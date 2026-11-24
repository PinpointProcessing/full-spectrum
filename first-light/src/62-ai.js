/* Spoken voices. When the page can reach Claude's speech (the tts capability on claude.ai) people talk in those voices;
   otherwise the device's own speech is used (see say() in 10-audio.js). The words themselves are always the set lines:
   Bryan wants AI for the sound of the voices, not for writing what is said. */
const AI={tts:null};
function aiInit(){
  try{if(!window.claude||typeof window.claude.use!=='function')return;window.claude.use('tts').then(t=>{AI.tts=t||null;}).catch(()=>{});}catch(e){}
}
/* who sounds like what: [Claude voice, higher device voice?] */
const VOICE={hal:['rounded',false],denise:['airy',true],ruth:['glassy',true],walt:['buttery',false],dunn:['rounded',false],jules:['airy',true],marisol:['glassy',true]};
function speak(who,text,dur){const v=VOICE[who]||VOICE.hal;say.full=who!=='hal'&&who!=='denise';return say(text,v[1],dur||3,v[0])||0;}
