// Chapter 2's opening, stepped in game time with a picture at each beat (Version 228). Version 249: Bryan's script at the fire, the three quiet seconds,
// INCOMING!!!!! from the group the shell lands on, and the scramble to the front (the yard, the dash through the command post, out of its door).
// node counter-opening-test.js OUT [port]   (run from a folder with a harness.js shim, or HARNESS=...; DDROOT = the dday folder)
const {chromium}=require('playwright');const {serve,open}=require(process.env.HARNESS||'./harness.js');const fs=require('fs');const OUT=process.argv[2]||'seq249',PORT=+process.argv[3]||9890;
(async()=>{fs.mkdirSync(OUT,{recursive:true});const srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',PORT);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page,errors}=await open(b,`http://localhost:${PORT}/index.html?gfx=1`);await page.setViewportSize({width:390,height:760});let fails=0;const ok=(c,m)=>{if(!c)fails++;console.log((c?'ok   ':'FAIL ')+m);};const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(4012);window.requestAnimationFrame=()=>0;startCounter();});await page.waitForTimeout(900);
const to=async t=>ev(t=>{let n=0;while(dd.seq&&dd.seq.t<t&&n++<1800){update(1/30);ddCam(1/30);panTick(1/30);}return dd.seq?{ph:dd.seq.ph,t:+dd.seq.t.toFixed(2)}:{ph:'done',cph:dd.dc.ph};},t);
const toPh=async ph=>ev(ph=>{let n=0;while(dd.seq&&dd.seq.ph!==ph&&n++<3000){update(1/60);ddCam(1/60);panTick(1/60);}return dd.seq?{ph:dd.seq.ph,t:+dd.seq.t.toFixed(2)}:{ph:'done'};},ph);
const shot=async n=>{await ev(()=>{bigText('');for(let i=0;i<2;i++){if(dd.seq)ddCam(.03);render(.03,simT);if(!(dd.seq&&dd.seq.ph==='hut'))drawOverlay(.03,simT);}hud();});await page.waitForTimeout(700);await ev(()=>{if(dd.seq)ddCam(.001);render(.001,simT);});await page.waitForTimeout(200);await page.screenshot({path:`${OUT}/${n}.png`});};
const T=await ev(()=>DCS.T);console.log(JSON.stringify(T));
const s0=await ev(()=>({seq:!!dd.seq,dc:dd.seq&&dd.seq.dc,ph:dd.seq&&dd.seq.ph,busy:ddBusy(),cls:document.body.classList.contains('ddseq'),y:players.map(p=>Math.round(p.y)),doom:dd.seq.doom.length,skip:!!document.querySelector('#vgSkip:not([hidden])'),n:players.length,name:players[1].name}));console.log(JSON.stringify(s0));
ok(s0.seq&&s0.dc&&s0.busy&&s0.cls&&s0.y.every(y=>y>650)&&!s0.skip,'it starts: the squad in the square, no orders, no Skip');
// the talk at the fire: Bryan's six lines, the two at the fire turn about, the second called by his own name
const WANT=["We finally took those bastards.","What a hell of a fight. We lost too many good men.","Hey, at least you're still standing.","Yeah? But for how long?",`Listen, ${s0.name}. Keep it together. We finally get to rest, so rest up buddy.`,"Yeah, maybe I'll catch some ZZZs."];
const chat=await ev(()=>DCS.chat.map(l=>[l[0],l[1],l[2]]));const said=[];
for(let i=0;i<6;i++){await to((chat[i][1]+chat[i][2])/2);const L=await ev(()=>{const L=dcSeqLine(dd.seq);return L&&{who:L.who,text:L.text,sh:L.sh,id:L.u.id,at:[Math.round(L.u.x-DCS.camp.x),Math.round(L.u.y-DCS.camp.y)]};});said.push(L);if(i===0||i===4)await shot('1-line'+(i+1));}
console.log(JSON.stringify(said));
ok(said.every((L,i)=>L&&L.text===WANT[i]&&L.who===i%2&&!L.sh),'the six lines as written, said turn about by the two at the fire');
ok(said.every(L=>L&&Math.abs(L.at[0])<12&&Math.abs(L.at[1])<6)&&said[0].id!==said[1].id&&said[4].text.includes(s0.name)&&!said[4].text.includes('{'),'both sit at the fire; the fifth line names the man spoken to');
// three seconds with nobody speaking and the far guns quiet
const h0=await to(chat[5][2]+.3),hq=await ev(()=>({hush:!!dd.seq.hush,line:!!dcSeqLine(dd.seq)}));const h1=await to(T.inc-.3),hq1=await ev(()=>({hush:!!dd.seq.hush,line:!!dcSeqLine(dd.seq),inc:!!dd.seq.inc}));await shot('2-hush');console.log(JSON.stringify([h0,hq,h1,hq1]));
ok(Math.abs((T.inc-chat[5][2])-3)<.05&&hq.hush&&!hq.line&&hq1.hush&&!hq1.line&&!hq1.inc,'then three seconds of quiet: nobody speaks, the far guns stop');
// INCOMING!!!!! from the group by the corner, the camera on them
await to(T.inc+.8);const inc=await ev(()=>{const S=dd.seq,L=dcSeqLine(S);return{inc:!!S.inc,hush:!!S.hush,who:L&&L.who,text:L&&L.text,sh:L&&L.sh,doom0:L&&L.u===S.doom[0],camX:Math.round(S.camX),alive:S.doom.filter(alive).length};});console.log(JSON.stringify(inc));await shot('3-incoming');
ok(inc.inc&&!inc.hush&&inc.who==='d'&&inc.text==='INCOMING!!!!!'&&inc.sh&&inc.doom0&&inc.camX>780&&inc.alive===3,'INCOMING!!!!! is shouted by one of the three the shell lands on, the camera on their corner');
console.log(JSON.stringify(await to(T.shell+.5)));await shot('4-shells');ok(await ev(()=>dd.seq.doom.every(u=>u.dead)&&players.every(alive)),'the shells kill the bunch to one side; the squad is unhurt');
const n0=await ev(()=>({go:dd.npcs.filter(u=>alive(u)&&u.path.length).length,fr:dd.npcs.filter(u=>alive(u)&&u.frantic).length,n:dd.npcs.filter(alive).length,ks:[...new Set(dd.npcs.filter(alive).map(u=>(u.rushK||1).toFixed(2)))].length}));console.log(JSON.stringify(n0));
ok(n0.fr===n0.n&&n0.go>=2&&n0.go<n0.n&&n0.ks>=6,'the other troops bolt for the front, each on his own beat and at his own speed ('+n0.go+' of '+n0.n+' off half a second after the shell)');
// the scramble across the yard
console.log(JSON.stringify(await toPh('run')));const r0=await ev(()=>{for(let i=0;i<6;i++){update(1/60);ddCam(1/60);}return{go:players.filter(u=>u.path.length).length,n:players.length};});
await ev(()=>{for(let i=0;i<24;i++){update(1/60);ddCam(1/60);}});await shot('5-run');
const r1=await ev(()=>({fr:players.filter(u=>u.frantic>=1&&u.frantic<=3).length,ks:[...new Set(players.map(u=>(u.rushK||1).toFixed(2)))].length,kmin:Math.min(...players.map(u=>u.rushK||1)),kmax:Math.max(...players.map(u=>u.rushK||1)),styles:[...new Set(players.map(u=>u.frantic))].length,spd:players.map(u=>u.spdK),
  go:players.filter(u=>u.path.length).length,n:players.length}));console.log(JSON.stringify(r0),JSON.stringify(r1));
ok(r0.go>=2&&r0.go<r0.n,'they do not set off together: '+r0.go+' of '+r0.n+' running a tenth of a second in');
ok(r1.fr===r1.n&&r1.ks>=5&&r1.kmin>=1.1&&r1.kmax<=1.5&&r1.styles>=2,'each at his own speed ('+r1.kmin.toFixed(2)+' to '+r1.kmax.toFixed(2)+' of a run), '+r1.styles+' ways of running');
// the dash through the command post
const hin=await toPh('hut');console.log(JSON.stringify(hin));
const tab=await ev(()=>{const H=dd.seq.hut,F=H.FRONT;let mn=1e9,at=0;for(let ht=0;ht<=DCS.T.hutDur;ht+=.02){const P=H.squad.map(u=>dcHutAt(u.hutR,ht,F));for(let i=0;i<P.length;i++)for(let j=i+1;j<P.length;j++){const d=Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]);if(d<mn&&(P[i][1]>F-75||P[j][1]>F-75)){mn=d;at=ht;}}}
  const td=H.squad.map(u=>{for(let t=0;t<4;t+=.005)if(dcHutAt(u.hutR,t,F)[1]<F)return t;return 99;}),z0=H.squad.map(u=>u.hutR[1]);let pass=0;for(let i=0;i<td.length;i++)for(let j=i+1;j<td.length;j++)if((z0[i]-z0[j])*(td[i]-td[j])<0)pass++;
  return{mn:+mn.toFixed(2),at:+at.toFixed(2),first:+Math.min(...td).toFixed(2),last:+Math.max(...td).toFixed(2),pass,v:H.squad.map(u=>u.hutR[2]),lanes:H.squad.map(u=>u.hutR[0]),styles:[...new Set(H.squad.map(u=>u.frantic))].length,openT:+H.openT.toFixed(2),rows:new Set(H.squad.map(u=>u.hutR)).size,n:H.squad.length};});console.log(JSON.stringify(tab));
ok(tab.rows===tab.n&&tab.mn>=8.5,'inside nobody runs through anybody: never nearer than '+tab.mn+' (shoulder to shoulder is about 9)');
ok(Math.max(...tab.v)-Math.min(...tab.v)>=15&&Math.max(...tab.lanes)-Math.min(...tab.lanes)>=18&&tab.pass>=2&&tab.styles>=3&&Math.min(...tab.v)>=54,'a scramble, not two files: speeds '+Math.min(...tab.v)+' to '+Math.max(...tab.v)+' (a run is 54), lanes '+(Math.max(...tab.lanes)-Math.min(...tab.lanes)).toFixed(0)+' wide, '+tab.pass+' get past someone');
ok(tab.last-tab.first<1.1&&tab.last<T.hutDur-.3,'all through the door inside '+(tab.last-tab.first).toFixed(2)+' s, the last '+(T.hutDur-tab.last).toFixed(2)+' s before the shot ends');
const hutT=await ev(()=>dd.seq.hutT);const door=[];
for(const[dt,n]of[[.18,'6-hut-in'],[tab.openT+.3,'7-hut-door'],[.95,'8-hut-hit'],[1.45,'9-hut-last']]){console.log(JSON.stringify(await to(hutT+dt)));await shot(n);door.push(await ev(()=>+dd.seq.hut.door.rotation.y.toFixed(2)));}
console.log(JSON.stringify(door));ok(door[0]===0&&door[1]>1.2&&door[3]>1.5,'the door is shut until the first of them is at it, then banged open outward');
ok(await ev(()=>dd.seq.hut.guard[2].dead&&dd.seq.hut.guard.filter(u=>u.dead).length===1),'one of the men firing from inside is shot as they go by: the one beside the door');
// out of the door
const oin=await toPh('out');console.log(JSON.stringify(oin));await ev(()=>{for(let i=0;i<18;i++){update(1/60);ddCam(1/60);}});await shot('10-out-low');
const o0=await ev(()=>({xs:players.map(p=>Math.round(p.x-DCA.door.x)),ys:players.map(p=>Math.round(p.y-DCA.door.y)),go:players.filter(u=>u.path.length).length,fr:players.filter(u=>u.frantic).length,n:players.length}));console.log(JSON.stringify(o0));
ok(o0.fr===o0.n&&o0.go>=2&&new Set(o0.xs.map(x=>Math.round(x/3))).size>=4,'out of the door in a crush, not two files: '+new Set(o0.xs.map(x=>Math.round(x/3))).size+' places across the doorway');
await to(oin.t+1.7);
const o=await ev(()=>({foesAdv:enemies.filter(e=>!beaten(e)&&e.stage>=0).length,npcOut:dd.npcs.filter(u=>alive(u)&&u.y<DCA.wallY-20).length,py:players.map(p=>Math.round(p.y))}));console.log(JSON.stringify(o));
ok(o.foesAdv>0&&o.npcOut>=4&&o.py.every(y=>y<562),'outside: their men are coming, the other troops are out in the field, the squad is out in front of the command post');
console.log(JSON.stringify(await to(oin.t+2.6)));await shot('11-out-rise');
const e=await to(999);console.log(JSON.stringify(e));for(let i=0;i<3;i++)await ev(()=>{for(let k=0;k<30;k++)update(1/30);});await shot('12-battle');
const s1=await ev(()=>({seq:!!dd.seq,ph:dd.dc.ph,cls:document.body.classList.contains('ddseq'),guns:dd.dc.guns.filter(g=>g.man||g.going).length,up:players.filter(alive).length,camp:players.filter(p=>p.y>700).length}));console.log(JSON.stringify(s1));
ok(!s1.seq&&s1.ph==='w1'&&!s1.cls&&s1.guns>=3&&s1.up>=7&&!s1.camp,'it ends in the first wave: guns being manned, the squad up (three seconds into the fight)');
for(let i=0;i<16;i++)await ev(()=>{for(let k=0;k<30;k++)update(1/30);});
const s2=await ev(()=>({fr:dd.allies.filter(u=>u.frantic).length,rush:dd.allies.filter(u=>(u.rushK||1)!==1).length,spd:players.map(u=>+u.spdK.toFixed(2))}));console.log(JSON.stringify(s2),JSON.stringify(r1.spd));
ok(s2.fr===0&&s2.rush===0&&JSON.stringify(s2.spd)===JSON.stringify(r1.spd.map(v=>+v.toFixed(2))),'sixteen seconds on nobody is scrambling any more, and every man has his own speed back');
// a retry has no sequence; its other troops still bolt for their posts each on his own beat
await ev(()=>{startCounter(true);});await page.waitForTimeout(600);const rt=await ev(()=>({seq:!!dd.seq,ph:dd.dc.ph,fr:dd.npcs.filter(u=>u.frantic).length,n:dd.npcs.length,hops:new Set(dd.npcs.map(u=>(u.hopT-simT).toFixed(1))).size}));console.log(JSON.stringify(rt));
ok(!rt.seq&&rt.ph==='intro','a retry starts without it');ok(rt.fr===rt.n&&rt.hops>=5,'on a retry the other troops run out each when he is ready ('+rt.hops+' different moments)');
console.log('errors',errors.length,errors.slice(0,4));console.log('fails:',fails);await b.close();srv.close();process.exit(0);})();
