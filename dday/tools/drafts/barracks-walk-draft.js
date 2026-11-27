// the barracks' camera dragged along the bunks: checks and pictures. node bk223.js W H TAG [port] [film]
const {chromium}=require('playwright');const {serve,open}=require('./harness.js');const fs=require('fs');const W=+process.argv[2]||390,Hh=+process.argv[3]||760,T=process.argv[4]||'p',PORT=+process.argv[5]||9794,FILM=process.argv[6]==='film';
(async()=>{const OUT=process.env.OUT||'.';fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT,PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?noseq&gfx=1`);await page.setViewportSize({width:W,height:Hh});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};
const ev=(f,a)=>page.evaluate(f,a);
const act=async(sel,w)=>{const r=await page.evaluate(s=>{const e=document.querySelector(s);if(!e)return 'none';try{ddmClick({target:e,clientX:0,clientY:0});return 'ok';}catch(x){return 'ERR '+x.message;}},sel);if(r!=='ok')console.log(sel,r);await page.waitForTimeout(w||1500);return r;};
const settle=async()=>{await ev(()=>{for(let i=0;i<40;i++){const r=ddm.room,S=ddm.slot,to=S?ddmStopOf(S[0],S[1]):ddmStopWide();if(r.walk&&!r.walk.drag)r.walk.s=to;}ddmRoomFrame(.1);ddmPlace();});await page.waitForTimeout(700);};
const shot=async n=>{await page.screenshot({path:`${OUT}/b-${T}-${n}.png`});};
await page.click('#ddAfterBtn');await page.waitForFunction(()=>typeof ddm!=='undefined'&&ddm&&ddm.ph==='report',null,{timeout:60000});await page.waitForTimeout(1500);
await ev(()=>{ddm.stepT=2;ddm.swT=0;});await act('.ddm-vic');await act('[data-a=award]',2500);await act('.ddm-skip');await act('[data-a=base]',3000);await act('[data-a=barracks]',3500);
await ev(()=>{window.requestAnimationFrame=()=>0;});await page.waitForTimeout(600);   // (the frames are drawn by hand from here: the headless page draws about one a second)
await settle();
const st=await ev(()=>({ph:ddm.ph,slot:ddm.slot,s:ddm.room.walk&&ddm.room.walk.s,wide:ddmStopWide(),stops:ddmWalkStops().map(q=>[q.s,q.slot&&q.slot.join('')]),ta:getComputedStyle(document.querySelector('#ddm')).touchAction}));
console.log(JSON.stringify(st));ok(st.ph==='barracks'&&!st.slot&&Math.abs(st.s-st.wide)<.5,'the barracks opens down the aisle, nobody chosen');ok(st.stops.length===9&&st.ta==='pan-y','nine places to settle (eight men and the aisle); sideways drags are the room\'s');await shot('0-aisle');
// a real drag with the mouse across the room, toward Alpha (the finger goes left)
const y=Math.round(Hh*.36);
await page.mouse.move(W*.75,y);await page.mouse.down();for(let k=1;k<=6;k++){await page.mouse.move(W*.75-k*W*.1,y);await page.waitForTimeout(40);}
const d1=await ev(()=>{for(let i=0;i<4;i++)ddmRoomFrame(.05);ddmPlace();return{drag:ddm.room.walk.drag,s:+ddm.room.walk.s.toFixed(1),slot:ddm.slot&&ddm.slot.join(''),cls:document.querySelector('#ddm').className,op:+getComputedStyle(document.querySelector('.ddm-stats')||document.body).opacity};});
console.log(JSON.stringify(d1));ok(d1.drag&&d1.s<st.wide-10&&/drag/.test(d1.cls),'a drag left moves the camera toward Alpha\'s bunks with the finger ('+(st.wide-d1.s).toFixed(0)+' units for '+(W*.6).toFixed(0)+' px)');
await page.waitForTimeout(400);await ev(()=>{ddmRoomFrame(.05);ddmPlace();});await page.waitForTimeout(500);await shot('1-dragging');
await page.mouse.up();await page.waitForTimeout(200);await settle();
const d2=await ev(()=>({drag:ddm.room.walk.drag,slot:ddm.slot&&ddm.slot.join(''),s:+ddm.room.walk.s.toFixed(1),name:document.querySelector('.ddm-name b')?.textContent,kit:!!document.querySelector('.ddm-bar.man .ddm-kit'),cls:document.querySelector('#ddm').className}));
console.log(JSON.stringify(d2));ok(!d2.drag&&d2.slot&&d2.slot[0]==='A'&&d2.kit&&!/drag/.test(d2.cls),'let go: it settles on the man it was nearest ('+d2.slot+', '+d2.name+') with his kit and numbers');await shot('2-settled');
// along the same wall: the next man
await page.mouse.move(W*.8,y);await page.mouse.down();for(let k=1;k<=5;k++){await page.mouse.move(W*.8-k*W*.09,y);await page.waitForTimeout(40);}await page.mouse.up();await page.waitForTimeout(200);await settle();
const d3=await ev(()=>ddm.slot&&ddm.slot.join(''));ok(d3&&d3[0]==='A'&&d3!==d2.slot,'dragging on the same way: the next man along, '+d3+' (from '+d2.slot+')');
// a tap on a man in the picture chooses him
const tp=await ev(()=>{const r=ddm.room,S=ddm.slot.join('');let best=null;for(const u of r.men){if(!u.m.g.visible||u.slotK===S)continue;r.v.set(u.x,16,u.y).project(r.cam);const x=(r.v.x+1)*cw/2,y=(1-r.v.y)*ch/2;if(r.v.z<1&&x>20&&x<cw-20&&y>120&&y<ch*.5)best={k:u.slotK,x,y};}return best;});
if(tp){await page.mouse.click(tp.x,tp.y);await page.waitForTimeout(300);await settle();const d4=await ev(()=>ddm.slot&&ddm.slot.join(''));ok(d4===tp.k,'a tap on another man in the picture chooses him ('+tp.k+')');}else console.log('no second man in the picture to tap');
// right round to the other squad, by dragging on
const far=async()=>{for(let n=0;n<9;n++){await page.mouse.move(W*.2,y);await page.mouse.down();for(let k=1;k<=6;k++){await page.mouse.move(W*.2+k*W*.11,y);await page.waitForTimeout(30);}await page.mouse.up();await page.waitForTimeout(120);await settle();const s=await ev(()=>ddm.slot&&ddm.slot.join(''));if(s&&s[0]==='B')return s;}return null;};
const d5=await far();ok(!!d5,'dragging on goes round the end of the aisle to Bravo\'s bunks ('+d5+')');await shot('3-bravo');
// the squares still jump, and the camera walks there; ALL EIGHT goes back to the aisle
await act('.ddm-sq[data-t="A"][data-i="0"]',300);const j=await ev(()=>({slot:ddm.slot.join(''),s:ddm.room.walk.s,to:ddmStopOf('A',0)}));ok(j.slot==='A0'&&Math.abs(j.s-j.to)>30,'a square tapped: the camera sets off for him along the bunks (not a cut)');await settle();
await act('[data-a=wide]',300);await settle();const w2=await ev(()=>({slot:ddm.slot,s:ddm.room.walk.s,wide:ddmStopWide()}));ok(!w2.slot&&Math.abs(w2.s-w2.wide)<.5,'SQUADS: back to the aisle');
// with a kit list open the room doesn't move
await act('.ddm-sq[data-t="A"][data-i="1"]',300);await settle();await act('.ddm-kit [data-k=t]',400);const s0=await ev(()=>ddm.room.walk.s);await page.mouse.move(W*.6,y);await page.mouse.down();await page.mouse.move(W*.2,y,{steps:5});await page.mouse.up();await page.waitForTimeout(200);
const s1=await ev(()=>({s:ddm.room.walk.s,swap:ddm.swap,slot:ddm.slot.join('')}));ok(s1.s===s0&&s1.swap==='t'&&s1.slot==='A1','a kit list open: a drag moves nothing');
if(FILM){   // the whole walk, a frame every few units: for the storyboard and the film
  await ev(()=>{ddm.swap=null;ddm.room.walk.drag=true;});const end=await ev(()=>ddmStopOf('B',0)),N=+(process.env.FRAMES||72);
  for(let k=0;k<N;k++){const s=end*k/(N-1);await ev(s=>{const W=ddm.room.walk;W.drag=true;W.s=s;ddmWalkPick(s);ddmRoomFrame(.05);ddmPlace();},s);await page.waitForTimeout(260);await ev(()=>{ddmRoomFrame(.05);ddmPlace();});await page.waitForTimeout(160);await page.screenshot({path:`${OUT}/f-${T}-${String(k).padStart(3,'0')}.png`});}
}
console.log('errors',errors.length,errors.slice(0,3));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
