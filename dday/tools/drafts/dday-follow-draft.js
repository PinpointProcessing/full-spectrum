// Drafts for the squad you aren't playing (Bryan, after Version 177: "I like how I originally selected the squads, but I want Bravo to follow by
// default, closer and more aggressive. Almost like I am using a 16 person team when using Alpha - but not quite. I would also like the option to
// hold Bravo back. Same with Bravo. Let's experiment with ideas give me some drafts on how we can do it"). The team tabs as they were (the start
// card's Lead one squad off) and the other squad run by one of these, once a second, in place of ddplay.js's ddSquadAI:
//   today  the game's FOLLOW (ddctl.js's ddcSupport, Version 168): about 12 m behind yours, moved up once yours has gone 6 m
//   shadow close behind: the moment yours is sent somewhere, to cover about 5 m behind where yours is going and 3 m to one side
//   line   side by side: the moment yours is sent, to cover level with where yours is going, about 8 m to one side: both on the front line
//   leap   leapfrog: while yours moves it pins down what yours is shooting (or the nearest gun that can see yours); when yours stops, it moves up
//          past it, to cover up to 10 m further on and to one side; then yours goes past it, and so on
//   flank  pincer: close behind (as shadow) until yours opens fire on a man; then it works round to cover off to one side of him, about 60
//          degrees round from yours at the same range, and throws a grenade at him once it's in reach
//   safe   side by side, and the pincer only where it's safe: a spot round the man yours is shooting (while he's behind cover from yours) that no
//          other gun of theirs has an open shot at, by a way that stays out of their fire, within 38 m (Bryan, on the pincer)
// Every variant: its own wounded first, its kit (ddfp.js's fpTools: rockets at tanks and guns, grenades on the bunched and dug in, smoke when
// pinned), and the man yours is shooting taken up by any of its men who can see him; HOLD (the tab's chip) stays where it is and pins him down.
// Alpha is played by a bot: every 7 s, once it's got where it was going, a move 15 m further along the route (a group move, as a tap and a tap on
// its marker do), and fire on the nearest enemy it can see. Same seed, same bot: only the other squad differs.
// node dday-follow-draft.js MODE VARIANT SEED [OUT] [PORT] [SECS] [FPS] [DPR]
//   MODE film: nobody of ours hurt, frames to OUT/00001.jpg ...;  sim: real fighting, the numbers as JSON on the last line
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const MODE=process.argv[2]||'sim',VAR=process.argv[3]||'shadow',SEED=+process.argv[4]||1,OUT=process.argv[5]||'.',PO=+process.argv[6]||0,SECS=+process.argv[7]||(MODE==='film'?60:150),FPS=+process.argv[8]||8,DPR=+process.argv[9]||1.5,W=390,H=760;
const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');
if(MODE==='film')fs.mkdirSync(OUT,{recursive:true});
(async()=>{const port=9920+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:MODE==='film'?DPR:1});const page=await ctx.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
await page.goto(`http://localhost:${port}/index.html?gfx=${MODE==='film'?2:0}`);await page.waitForTimeout(2500);
const ev=(f,a)=>page.evaluate(f,a);
await ev(([MODE,VAR,SEED])=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  DDC.lead=false;   // (the team tabs, as before Version 168)
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(SEED*7919+3);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  window.DMG={A:0,B:0};const d0=damage;damage=function(t,d,s){if(MODE==='film'&&t.side==='P'&&!t.npc)return;const h0=t.hp;const r=d0.apply(this,arguments);if(t.side==='P'&&!t.npc&&DMG[t.team]!=null)DMG[t.team]+=Math.max(0,h0-Math.max(0,t.hp||0));return r;};
  // the other squad's brain
  const midOf=L=>({x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length});
  const fwdAt=(x,y)=>{const w=ddRouteWay(x,y);if(!w)return{x:0,y:-1};const l=hyp(w.x,w.y)||1;return{x:w.x/l,y:w.y/l};};
  const ST={};window.HOLD={A:false,B:false};window.SENT={A:0,B:0};
  const send=(t,free,cands)=>{for(const[x,y]of cands){const[tx,ty]=ddcBound(x,y),as=makeAssign(free,tx,ty);if(as.length){for(const q of as)Object.assign(q.u,{path:q.path,gaitForce:null,exposeT:0,supT:null});SENT[t]++;return{x:tx,y:ty};}}return null;};
  const pin=(free,T)=>{if(T)for(const u of free)if(!u.supT&&!u.path.length&&hyp(u.x-T.x,u.y-T.y)<=wRange(u)&&fireLine(u,T))Object.assign(u,{supT:{x:T.x,y:T.y},noLine:0});};
  function prelude(t){
    const m=players.filter(p=>p.team===t&&alive(p)&&!p.inBoat&&!p.joining);if(!m.length)return null;
    for(const d of players.filter(p=>p.team===t&&p.downed&&!p.dead&&!p.carriedBy)){   // (their own wounded first, as ddcSupport does)
      const fr=m.filter(u=>!u.path.length&&!u.medGo&&!pinnedNow(u)&&!u.onGun).sort((a,c)=>hyp(a.x-d.x,a.y-d.y)-hyp(c.x-d.x,c.y-d.y));if(!fr.length)break;
      if(d.critical){const k=fr.find(hasKit);if(k&&!m.some(u=>u.medGo&&u.medGo.t===d))orderMedkit(k,d);continue;}
      if(helperOf(d))continue;const h=fr[0];if(hyp(h.x-d.x,h.y-d.y)>22){const p=goBeside(h,d);if(p&&p.length){h.path=p;h.gaitForce=null;}}}
    fpTools(m,m[0]);
    const lead=players.filter(p=>p.team!==t&&alive(p)&&!p.inBoat&&!p.joining),free=m.filter(u=>!ddcBusy(u)&&!pinnedNow(u));
    const F=lead.map(u=>u.focus).find(e=>e&&!beaten(e));
    if(F)for(const u of free)if(u.focus!==F&&hyp(u.x-F.x,u.y-F.y)<=wRange(u)&&fireLine(u,F))u.focus=F;
    if(HOLD[t]){pin(free,F||enemies.filter(e=>e.gunner&&!beaten(e)&&(e.seen||e.vis)).sort((a,c)=>hyp(a.x-m[0].x,a.y-m[0].y)-hyp(c.x-m[0].x,c.y-m[0].y))[0]);return null;}
    if(!lead.length||!free.length)return null;
    return{m,free,lead,F,S:ST[t]||(ST[t]={}),s:t==='B'?1:-1};}
  // where yours is going (its men's ends of path); a new order when that moves by 3 m
  const goingTo=lead=>midOf(lead.map(destOf));
  const V={};
  V.today=t=>{const f0=dd.supS&&dd.supS[t]&&dd.supS[t].fl;ddcSupport(t);const f1=dd.supS&&dd.supS[t]&&dd.supS[t].fl;if(f1&&f1!==f0){FLANKS[t]++;if(f1.smoke)SMOKES[t]++;}};   // (the game's own: since Version 180 side by side and the pincer; its pincers counted)
  const shadowP=(t,P)=>{const{free,lead,S,s}=P;const D=goingTo(lead),f=fwdAt(D.x,D.y),rx=-f.y,ry=f.x,B=midOf(free.map(destOf));
    const fresh=(!S.D||hyp(D.x-S.D.x,D.y-S.D.y)>30)&&lead.some(u=>simT-(u.lastOrder??-99)<1.5),want={x:D.x-f.x*55+rx*s*30,y:D.y-f.y*55+ry*s*30};
    if(!fresh&&(simT-S.t<3||hyp(B.x-want.x,B.y-want.y)<70))return;   // (off where it should be by 7 m: it catches up, every 3 s at most)
    S.D=D;S.t=simT;if(free.some(u=>u.path.length)&&!fresh)return;
    S.to=send(t,free,[[55,30],[40,48],[75,18],[30,62],[95,0]].map(([bk,of])=>[D.x-f.x*bk+rx*s*of,D.y-f.y*bk+ry*s*of]))||S.to;};
  V.shadow=t=>{const P=prelude(t);if(P)shadowP(t,P);};
  const lineP=(t,P)=>{const{free,lead,S,s}=P;const D=goingTo(lead),f=fwdAt(D.x,D.y),rx=-f.y,ry=f.x,B=midOf(free.map(destOf));
    const fresh=(!S.D||hyp(D.x-S.D.x,D.y-S.D.y)>30)&&lead.some(u=>simT-(u.lastOrder??-99)<1.5),want={x:D.x+rx*s*85,y:D.y+ry*s*85};
    if(!fresh&&(simT-S.t<3||hyp(B.x-want.x,B.y-want.y)<70))return;   // (off where it should be by 7 m: it catches up, every 3 s at most)
    S.D=D;S.t=simT;if(free.some(u=>u.path.length)&&!fresh)return;
    S.to=send(t,free,[[0,85],[0,70],[-12,100],[12,60],[-20,115],[0,-85],[0,-70]].map(([fw,of])=>[D.x+f.x*fw+rx*s*of,D.y+f.y*fw+ry*s*of]))||S.to;};
  V.line=t=>{const P=prelude(t);if(P)lineP(t,P);};
  // safe: side by side, and the pincer only where it's safe (Bryan, on the pincer: "Can bravo/alpha do it if it would be safe?"): when the man
  // yours is shooting is behind cover from yours, it swings round to his side only to a spot no other gun of theirs has an open shot at (the
  // count the game's dodge uses, ddplay.js's ddOpenN, leaving him out), by a way where at most one stretch of 4 m is open to any of them, no
  // further than 38 m to walk, with no man of its own down and most of it free to move; otherwise it stays beside yours. Back beside yours once
  // he's down, yours shoots someone else, or after 25 s
  const openBy=(x,y,skip)=>{let n=0;for(const e of enemies){if(e===skip||beaten(e)||e.side!=='E'||e.mon||e.dormant||!e.alerted)continue;if(hyp(e.x-x,e.y-y)>ddFireR(e)||!los(e.x,e.y,x,y))continue;if(coverAt(x,y,e.x,e.y)===0)n++;}return n;};
  const wayOK=(x0,y0,path,skip)=>{let bad=0,L=0,px=x0,py=y0;for(const q of path){const d=hyp(q.x-px,q.y-py),n=Math.max(1,Math.round(d/40));for(let k=1;k<=n;k++){const x=px+(q.x-px)*k/n,y=py+(q.y-py)*k/n;if(openBy(x,y,skip)>0&&++bad>1)return-1;}L+=d;px=q.x;py=q.y;}return L;};
  window.FLANKS={A:0,B:0};window.SMOKES={A:0,B:0};
  V.safe=t=>{const P=prelude(t);if(!P)return;const{free,lead,F,S,s,m}=P;
    const Am=midOf(lead);
    if(S.fl){const g=S.fl;   // swung round already: stay there while it's worth it
      if(!beaten(g.F)&&lead.some(u=>u.focus===g.F)&&simT-g.t<25){const th=free.find(u=>(u.grenade||0)>0&&!u.path.length&&simT-(u.nadeT??-99)>5&&hyp(u.x-g.F.x,u.y-g.F.y)<nadeRange(u)&&!dd.allies.some(q=>hyp(q.x-g.F.x,q.y-g.F.y)<75));if(th)orderThrow(th,g.F.x,g.F.y,'nade');return;}
      S.fl=null;S.D=null;}   // (back beside yours: the next tick sends it)
    const down=players.some(p=>p.team===t&&p.downed&&!p.dead);
    if(F&&(F.seen||F.vis)&&!down&&free.length>=Math.min(3,m.length)&&coverAt(F.x,F.y,Am.x,Am.y)>0&&simT-(S.flT||-99)>2){S.flT=simT;
      const Bm=midOf(free),a0=Math.atan2(Am.y-F.y,Am.x-F.x);let tries=0,go=null;
      for(const sd of[s,-s]){for(const da of[1.1,.8,1.4,.6])for(const r of[220,170,280,130]){if(go||tries>=4)break;
        const x=F.x+Math.cos(a0+sd*da)*r,y=F.y+Math.sin(a0+sd*da)*r;
        if(!isFree(x,y)||!los(x,y,F.x,F.y)||coverAt(F.x,F.y,x,y)>0||openBy(x,y,F)>0)continue;   // (from there he has no cover, and no other gun sees it)
        tries++;const p=findPath(Bm.x,Bm.y,x,y);if(!p||!p.length)continue;const L=wayOK(Bm.x,Bm.y,p,F);if(L<0||L>380)continue;go={x,y};}
        if(go)break;}
      if(go){const to=send(t,free,[[go.x,go.y]]);if(to){S.fl={F,t:simT,to};FLANKS[t]++;return;}}}
    lineP(t,P);};
  V.leap=t=>{const P=prelude(t);if(!P)return;const{free,lead,F,S,s}=P;const Am=midOf(lead);
    // yours on its way somewhere you sent it (a move of yours in the last 8 s, not a man ducking a shell): cover it
    const ord=Math.max(...lead.map(u=>u.lastOrder??-99));
    if(lead.some(u=>u.path.length)&&simT-ord<8){
      const T=F||enemies.filter(e=>!beaten(e)&&(e.seen||e.vis)&&hyp(e.x-Am.x,e.y-Am.y)<640&&los(e.x,e.y,Am.x,Am.y)).sort((a,c)=>hyp(a.x-Am.x,a.y-Am.y)-hyp(c.x-Am.x,c.y-Am.y))[0];pin(free,T);return;}
    if(S.ord===ord||free.some(u=>u.path.length))return;   // (once for each move of yours)
    const f=fwdAt(Am.x,Am.y),rx=-f.y,ry=f.x;
    const to=send(t,free,[[100,40],[80,55],[120,30],[60,62],[40,70],[100,-40]].map(([fw,of])=>[Am.x+f.x*fw+rx*s*of,Am.y+f.y*fw+ry*s*of]));S.ord=ord;if(to)S.to=to;};
  V.flank=t=>{const P=prelude(t);if(!P)return;const{free,lead,F,S,s}=P;
    if(!F||!(F.seen||F.vis)){S.F=null;return shadowP(t,P);}
    const g=free.find(u=>(u.grenade||0)>0&&!u.path.length&&simT-(u.nadeT??-99)>5&&hyp(u.x-F.x,u.y-F.y)<nadeRange(u)&&!dd.allies.some(q=>hyp(q.x-F.x,q.y-F.y)<75));
    if(g&&orderThrow(g,F.x,F.y,'nade'))return;
    const Am=midOf(lead),B=midOf(free.map(destOf));if(S.F===F&&S.to&&hyp(B.x-S.to.x,B.y-S.to.y)<60)return;if(S.F===F&&simT-S.t<4)return;
    const a0=Math.atan2(Am.y-F.y,Am.x-F.x),d=clamp(hyp(Am.x-F.x,Am.y-F.y),150,300);S.F=F;S.t=simT;
    S.to=send(t,free,[[1.1,1],[.8,1],[1.1,.8],[1.4,1],[.6,.9],[-1.1,1]].map(([da,k])=>[F.x+Math.cos(a0+s*da)*d*k,F.y+Math.sin(a0+s*da)*d*k]))||S.to;};
  const sq0=ddSquadAI;window.ddSquadAI=t=>{if(t===dd.active)return sq0(t);return V[VAR](t);};window.V=V;window.ST=ST;
  // the player: Alpha, a bot that moves on along the route and fires on what it sees
  window.BOT={next:0,moves:0};
  window.BOTTICK=()=>{const A=players.filter(p=>p.team==='A'&&alive(p)&&!p.inBoat&&!p.joining);if(!A.length)return;
    if(!A.some(u=>u.focus&&!beaten(u.focus))){const e=enemies.filter(e=>!beaten(e)&&(e.seen||e.vis)&&A.some(u=>hyp(u.x-e.x,u.y-e.y)<=wRange(u)&&fireLine(u,e))).sort((a,c)=>hyp(a.x-A[0].x,a.y-A[0].y)-hyp(c.x-A[0].x,c.y-A[0].y))[0];if(e)orderFire(A,e);}
    if(simT<BOT.next||A.some(u=>u.path.length))return;
    const M=midOf(A),s0=PROG(M.x,M.y);for(const k of[150,110,190,70]){const q=AT(Math.min(ROUTE.len,s0+k)),as=makeAssign(A,q.x,q.y);if(as.length){commit(as);BOT.moves++;break;}}
    BOT.next=simT+7;};},[MODE,VAR,SEED]);
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(([MODE])=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(2);
  const R=DD_ROUTE.map(([x,y])=>({x:x+DDX,y})),cum=[0];for(let i=1;i<R.length;i++)cum.push(cum[i-1]+hyp(R[i].x-R[i-1].x,R[i].y-R[i-1].y));
  window.ROUTE={R,cum,len:cum[cum.length-1]};
  window.PROG=(x,y)=>{let best=1e9,s=0;for(let i=1;i<R.length;i++){const a=R[i-1],c=R[i],L=cum[i]-cum[i-1],t=clamp(((x-a.x)*(c.x-a.x)+(y-a.y)*(c.y-a.y))/(L*L),0,1),px=a.x+(c.x-a.x)*t,py=a.y+(c.y-a.y)*t,d=hyp(x-px,y-py);if(d<best){best=d;s=cum[i-1]+t*L;}}return s;};
  window.AT=s=>{s=clamp(s,0,ROUTE.len);let i=1;while(i<R.length-1&&cum[i]<s)i++;const a=R[i-1],c=R[i],t=(s-cum[i-1])/(cum[i]-cum[i-1]||1);return{x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t};};
  selectTeam('A');dd.active='A';
  // the numbers, sampled twice a second
  window.NUM={t0:simT,n:0,gap:0,gapMax:0,ahead:0,far:0,downs:{A:0,B:0},down0:{},maxS:0,wireT:null};
  window.SAMPLE=()=>{const A=players.filter(p=>p.team==='A'&&alive(p)&&!p.inBoat),B=players.filter(p=>p.team==='B'&&alive(p)&&!p.inBoat);
    for(const u of players){const k=u.id;if(u.downed&&!NUM.down0[k]){NUM.down0[k]=1;NUM.downs[u.team]++;}if(!u.downed)NUM.down0[k]=0;}
    if(!A.length||!B.length)return;const ma={x:A.reduce((a,u)=>a+u.x,0)/A.length,y:A.reduce((a,u)=>a+u.y,0)/A.length},mb={x:B.reduce((a,u)=>a+u.x,0)/B.length,y:B.reduce((a,u)=>a+u.y,0)/B.length};
    const g=hyp(ma.x-mb.x,ma.y-mb.y)/10;NUM.n++;NUM.gap+=g;NUM.gapMax=Math.max(NUM.gapMax,g);if(g>20)NUM.far++;
    const sa=PROG(ma.x,ma.y),sb=PROG(mb.x,mb.y);if(sb>sa+20)NUM.ahead++;NUM.maxS=Math.max(NUM.maxS,sa,sb);if(NUM.wireT==null&&Math.max(sa,sb)>=330)NUM.wireT=simT-NUM.t0;};},[MODE]);
if(MODE==='probe'){   // the safe pincer on its own: one man of theirs behind cover on the top, nobody else about; then a second gun that sees the flank
  const r=await ev(()=>{const res={};
    for(const e of enemies)if(!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}dd.ctr={on:true,sq:4,t:1e12};dd.shellT={heavy:1e12,cannon:1e12,art:1e12};
    const A=players.filter(u=>u.team==='A'&&alive(u)),B=players.filter(u=>u.team==='B'&&alive(u));
    // a piece of half cover on the top (a crate or a drum): the man behind it on one side, Alpha 15 m off on the other, Bravo 9.5 m beside Alpha
    let c=null,dir=null;
    for(const o of objs.filter(o=>o.cover>=1&&!o.full&&o.y<-470&&o.y>-740&&o.x>DDX+100&&o.x<DDX+1050&&o.w<40&&o.h<40)){const cx=o.x+o.w/2,cy=o.y+o.h/2;
      for(const[dx,dy]of[[0,-1],[0,1],[1,0],[-1,0]])for(const k of[18,22,26]){const fx=cx+dx*k,fy=cy+dy*k,ax=cx-dx*170,ay=cy-dy*170,bx=ax-dy*95,by=ay+dx*95;   // (cover counts within 1.5 m of him: right behind it)
        if(isFree(fx,fy)&&isFree(ax,ay)&&isFree(bx,by)&&coverAt(fx,fy,ax,ay)>0&&los(ax,ay,fx,fy)){c=o;dir=[dx,dy,k];break;}}if(c)break;}
    if(!c)return{ok:false,why:'no cover piece found'};
    const cx=c.x+c.w/2,cy=c.y+c.h/2,[dx,dy,kk]=dir,F=ddFoe('probe',cx+dx*kk-DDX,cy+dy*kk,{ang:Math.atan2(-dy,-dx)});enemies.push(F);Object.assign(F,{seen:true,vis:true,alerted:true,cool:1e9});
    const place=(L,x,y,px,py)=>L.forEach((u,k)=>Object.assign(u,{x:x+px*(k-1.5)*16,y:y+py*(k-1.5)*16,path:[],inBoat:false,joining:false,lastOrder:-99,sup:0,focus:null}));
    const ax=cx-dx*170,ay=cy-dy*170;window.PB=()=>place(B,ax-dy*95,ay+dx*95,-dy,dx);place(A,ax,ay,-dy,dx);PB();for(const u of A)u.focus=F;
    const Am={x:A.reduce((a,u)=>a+u.x,0)/A.length,y:A.reduce((a,u)=>a+u.y,0)/A.length};
    res.cover={kind:c.kind,at:[Math.round(cx),Math.round(cy)],side:dir,fromAlpha:coverAt(F.x,F.y,Am.x,Am.y)};
    FLANKS.B=0;for(const k in ST)delete ST[k];V.safe('B');
    const ends=B.map(destOf),mid={x:ends.reduce((a,q)=>a+q.x,0)/4,y:ends.reduce((a,q)=>a+q.y,0)/4};
    res.alone={flanked:FLANKS.B,to:[Math.round(mid.x),Math.round(mid.y)],hisCoverFromThere:coverAt(F.x,F.y,mid.x,mid.y),otherGunsSee:0};
    // a second gun off to the side the squad would swing to, with that ground in view
    PB();for(const k in ST)delete ST[k];FLANKS.B=0;
    // a second gun with a clear view of the ground round the man's side: 20 m beyond the spot Bravo picked, looking at it
    const gx=mid.x+(mid.x-F.x)*.0+dx*200,gy=mid.y+dy*200,G=ddFoe('probe2',gx-DDX,gy,{ang:Math.atan2(mid.y-gy,mid.x-gx)});enemies.push(G);Object.assign(G,{seen:true,vis:true,alerted:true,cool:1e9});
    V.safe('B');const ends2=B.map(destOf),mid2={x:ends2.reduce((a,q)=>a+q.x,0)/4,y:ends2.reduce((a,q)=>a+q.y,0)/4};
    res.watched={flanked:FLANKS.B,to:[Math.round(mid2.x),Math.round(mid2.y)],besideAlpha:Math.round(hyp(mid2.x-Am.x,mid2.y-Am.y)/10),gunSeesOldSpot:los(G.x,G.y,mid.x,mid.y)&&coverAt(mid.x,mid.y,G.x,G.y)===0};
    res.ok=res.cover.fromAlpha>0&&res.alone.flanked===1&&res.alone.hisCoverFromThere===0&&res.watched.flanked===0;return res;});
  console.log(JSON.stringify(r));console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();return;}
if(MODE==='sim'){
  const r=await ev(([SECS])=>{for(let t=0;t<SECS*2;t++){RUN(.5);BOTTICK();SAMPLE();if(endAt||dd.over)break;}
    const kills=t=>players.filter(p=>p.team===t).reduce((a,u)=>a+((u.stats&&u.stats.kills)||0),0);
    return{secs:Math.round(simT-NUM.t0),gap:+(NUM.gap/Math.max(1,NUM.n)).toFixed(1),gapMax:Math.round(NUM.gapMax),farPct:Math.round(100*NUM.far/Math.max(1,NUM.n)),aheadPct:Math.round(100*NUM.ahead/Math.max(1,NUM.n)),
      killsA:kills('A'),killsB:kills('B'),dmgA:Math.round(DMG.A),dmgB:Math.round(DMG.B),downsA:NUM.downs.A,downsB:NUM.downs.B,deadA:players.filter(p=>p.team==='A'&&p.dead).length,deadB:players.filter(p=>p.team==='B'&&p.dead).length,
      progress:Math.round(NUM.maxS/10),wireT:NUM.wireT==null?null:Math.round(NUM.wireT),foesDown:enemies.filter(e=>beaten(e)).length,sentB:SENT.B,moves:BOT.moves,flanksB:FLANKS.B,smokesB:SMOKES.B};},[SECS]);
  console.log(JSON.stringify({variant:VAR,seed:SEED,...r}));console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();return;}
// the film: a camera that keeps both squads on the screen, turned with the route, the other squad's men ringed in orange and their way drawn
await ev(([VAR])=>{
  const st=document.createElement('style');st.textContent=`#bigText,#banner{display:none!important}
    .camtag{position:absolute;left:8px;top:8px;z-index:9;pointer-events:none;display:flex;flex-direction:column;gap:4px;align-items:flex-start;max-width:250px}
    .camtag b{font:800 12px/1 var(--font-hud);letter-spacing:.08em;color:#0b0f13;background:#ffcf4a;border-radius:8px;padding:6px 10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5)}
    .camtag i{font:700 10px/1.3 var(--font-hud);font-style:normal;letter-spacing:.06em;color:#e8edf0;background:rgba(8,11,14,.82);border-radius:6px;padding:4px 8px}
    .tab .ddchip{font:800 9px/1 var(--font-hud);letter-spacing:.08em;color:#0b0f13;background:var(--tc);border-radius:5px;padding:3px 5px;margin-top:2px}
    .tab .ddchip.hold{background:#e8edf0}`;
  document.head.appendChild(st);const t=document.createElement('div');t.className='camtag';t.innerHTML='<b></b><i></i>';document.body.appendChild(t);
  const NAME={today:['TODAY · FOLLOW','12 m behind, moves once yours has gone 6 m'],shadow:['1 · CLOSE BEHIND','moves when yours does, 5 m behind'],line:['2 · SIDE BY SIDE','moves when yours does, level with it, 8 m aside'],leap:['3 · LEAPFROG','covers while yours moves, then goes past it'],flank:['4 · PINCER','close behind; works round the man yours is shooting'],safe:['5 · SIDE BY SIDE + SAFE PINCER','beside yours; round the man yours shoots only where no other gun sees']}[VAR];
  t.children[0].textContent=NAME[0];t.children[1].textContent=NAME[1];
  // the tab's chip (a draft of the control): FOLLOW or HOLD on the squad you aren't playing
  const tb=document.querySelector('.tab[data-team="B"]');if(tb&&!tb.querySelector('.ddchip')){const c=document.createElement('span');c.className='ddchip';c.textContent='FOLLOW';tb.appendChild(c);}
  window.FCAM=null;
  const wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  const fits=(yw,x,z,zm,P)=>{yaw=yw;zoom=zm;tilt=ddTilt(zm,DD_CAM.route);camShift=DD_CAM.shift;camT.x=x;camT.z=z;updateCamera();
    for(const p of P){toSBack=false;const s=toS(p.x,p.y,8);if(toSBack||s[0]<cw*.08||s[0]>cw*.92||s[1]<ch*.17||s[1]>ch*.7)return false;}return true;};
  window.CAMSTEP=dt=>{const L=players.filter(p=>(p.team==='A'||p.team==='B')&&alive(p)&&!p.inBoat);if(!L.length)return;
    const A=L.filter(p=>p.team==='A'),ma=A.length?{x:A.reduce((a,u)=>a+u.x,0)/A.length,y:A.reduce((a,u)=>a+u.y,0)/A.length}:L[0];
    const m={x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length},w=ddRouteWay(ma.x,ma.y),yw=w?Math.atan2(-w.x,-w.y):0;
    const C=FCAM||(FCAM={yaw:yw,x:m.x,z:m.y,zoom:6.5});const k=Math.min(1,dt*1.5);C.yaw+=wrap(yw-C.yaw)*Math.min(1,dt*1.2);C.x+=(m.x-C.x)*k;C.z+=(m.y-C.z)*k;
    let zt=4;for(let z=7;z>=4;z-=.25)if(fits(C.yaw,C.x,C.z,z,L)){zt=z;break;}C.zoom+=(zt-C.zoom)*Math.min(1,dt*1.2);};
  window.SHOOT=()=>{const C=FCAM;dd.track=null;camPan=null;shakeK=0;yaw=C.yaw;zoom=C.zoom;tilt=ddTilt(zoom,DD_CAM.route);camShift=DD_CAM.shift;camT.x=C.x;camT.z=C.z;
    render(.0001,simT);drawOverlay(.03,simT);
    // the other squad's way, dashed in its colour, and a ring where each man is going (the game doesn't draw it)
    ox.save();ox.setLineDash([6,5]);ox.lineWidth=2.4;ox.strokeStyle=C0.bravo;ox.fillStyle=C0.bravo;
    for(const u of players.filter(p=>p.team==='B'&&alive(p)&&p.path.length)){toSBack=false;let s=toS(u.x,u.y,2);if(toSBack)continue;ox.beginPath();ox.moveTo(s[0],s[1]);
      for(const q of u.path){toSBack=false;const r=toS(q.x,q.y,2);if(toSBack)break;ox.lineTo(r[0],r[1]);s=r;}ox.stroke();ox.setLineDash([]);ox.beginPath();ox.arc(s[0],s[1],7,0,6.3);ox.stroke();ox.setLineDash([6,5]);}
    // Bravo's men marked (the game draws the squad you aren't playing faintly): an orange ring on the ground round each, a dot over his head
    ox.lineWidth=2.6;ox.strokeStyle=C0.bravo;ox.fillStyle=C0.bravo;
    for(const u of players.filter(p=>p.team==='B'&&!p.dead&&!p.inBoat)){ox.beginPath();let ok=true;
      for(let k=0;k<=16;k++){const a=k/16*Math.PI*2;toSBack=false;const r=toS(u.x+Math.cos(a)*9,u.y+Math.sin(a)*9,1);if(toSBack){ok=false;break;}k?ox.lineTo(r[0],r[1]):ox.moveTo(r[0],r[1]);}
      if(ok)ox.stroke();toSBack=false;const h=toS(u.x,u.y,u.downed?8:30);if(!toSBack){ox.beginPath();ox.arc(h[0],h[1]-6,3.6,0,6.3);ox.fill();}}
    ox.restore();};
  window.C0=C;},[VAR]);
const nfr=Math.ceil(SECS*FPS);const t0=Date.now();
for(let f=0;f<nfr;f++){
  await ev(([dt,first])=>{if(!first){const n=Math.round(dt*30);for(let i=0;i<n;i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);if((window.BT=(window.BT||0)+1/30)>=.5){BT=0;BOTTICK();SAMPLE();}}}CAMSTEP(first?1:dt);hud();SHOOT();},[1/FPS,f===0]);   // (the bot and the numbers twice a second, as in sim)
  await page.screenshot({path:`${OUT}/${String(f+1).padStart(5,'0')}.jpg`,type:'jpeg',quality:84});
  if(f%40===0)console.log('  frame',f+1,'/',nfr,((Date.now()-t0)/1000/(f+1)).toFixed(2),'s a frame');
}
const r=await ev(()=>({gap:+(NUM.gap/Math.max(1,NUM.n)).toFixed(1),aheadPct:Math.round(100*NUM.ahead/Math.max(1,NUM.n)),kills:{A:players.filter(p=>p.team==='A').reduce((a,u)=>a+((u.stats&&u.stats.kills)||0),0),B:players.filter(p=>p.team==='B').reduce((a,u)=>a+((u.stats&&u.stats.kills)||0),0)},moves:BOT.moves,sentB:SENT.B}));
fs.writeFileSync(`${OUT}/info.json`,JSON.stringify({variant:VAR,seed:SEED,fps:FPS,frames:nfr,...r}));
console.log('film',VAR,JSON.stringify(r),'errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
