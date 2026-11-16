// Cover for four (Bryan, after Version 174: "Cover should be able to always cover 4 men. Will that be hard or unrealistic? Or at least have two covers
// close by fit enough for two men each. Or should we make squads smaller?"): how many men each piece of cover on the beach (and up the bluff) takes,
// how many of those spots are out of the line of every gun that can reach them, and what a group move of four gets when the piece is tapped;
// today, and with three drafts:
//   spill: a group move fills the piece tapped, then the next cover within 9 m, instead of the open beside it (ASSIGN_R 4.5 m today)
//   pairs: a second hedgehog 3 m beside each one on the sand (two pieces, two men each)
//   holes: six more shell holes the size of the one by the wreck along the way up the sand, each a shelter for four
// node dday-cover-draft.js [OUT] [PORT] [pics] -> the numbers; with pics, OUT/cov-*.png (dday-cover-compose.py makes the sheet)
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const OUT=process.argv[2]||'.',PO=+process.argv[3]||0,PICS=process.argv[4]==='pics',W=390,H=760;
const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');
// the extra shell holes of the draft (dx, y, radius): staggered left and right of the way up, 12-20 m apart
const HOLES=[[240,622,30],[560,606,30],[470,540,30],[720,522,28],[360,432,28],[600,452,28]];
(async()=>{const port=9985+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:PICS?2:1});const page=await ctx.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
const ev=(f,a)=>page.evaluate(f,a);
// a fresh page with the beach landed (and, for the draft, the extra holes in before the map is built)
const beach=async holes=>{
  await page.goto(`http://localhost:${port}/index.html?gfx=${PICS?2:0}`);await page.waitForTimeout(2500);
  await ev(holes=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
    ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
    Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(31);window.requestAnimationFrame=()=>0;
    window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
    damage=()=>undefined;
    for(const[x,y,r]of holes)DD_HOLES.push({x,y,r,c:1,draft:1});},holes);
  await page.click('#ddBtn');await page.waitForTimeout(400);
  await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(4);RUN(20);   // (a while on the beach: the guns the squad knows about are the ones it would know)
    const KIND={ddhog:'hedgehog',ddrim:'shell hole',ddwreck:'wreck',ddbould:'boulder',ddcrate:'crate',dddrum:'drum',sandbag:'sandbags'};
    window.KIND=KIND;window.PIECES=()=>objs.filter(o=>KIND[o.kind]&&o.y>-560&&o.y<760&&!o.gone);
    // the spots behind a piece: its cover spots on the side away from the bunker line (south), where a man puts it between him and them
    window.BEHIND=o=>coverPts.filter(c=>c.o===o&&c.y>o.y+o.h);
    // the guns that can reach a spot and see it; covered = every one of them has something in the way
    const guns=()=>enemies.filter(e=>!beaten(e)&&e.side==='E');
    window.HITTERS=(x,y)=>guns().filter(e=>hyp(e.x-x,e.y-y)<=ddFireR(e)&&los(e.x,e.y,x,y));
    window.SAFE=(c)=>HITTERS(c.x,c.y).every(e=>coverAt(c.x,c.y,e.x,e.y)>0);
    window.SQ=players.filter(u=>u.team==='A'&&alive(u)).slice(0,4);
    // the draft rule: a man down in a shell hole is covered from every side (from anyone outside it), not only by the rim on its far side
    const c0=coverAt;window.ROUND=false;window.coverAt=function(tx,ty,sx,sy){const v=c0.apply(this,arguments);if(!ROUND||MAPID!=='dd')return v;
      for(const h of DD_HOLES){const hx=h.x+DDX;if(hyp(tx-hx,ty-h.y)<h.r&&hyp(sx-hx,sy-h.y)>h.r+10)return Math.max(v,h.c||1);}return v;};
    // four men tapped at the middle of the spots behind a piece, coming up from the water's side
    window.TAP4=o=>{const B=BEHIND(o),m=B.length?{x:B.reduce((a,c)=>a+c.x,0)/B.length,y:B[0].y}:{x:o.x+o.w/2,y:o.y+o.h+12};
      for(const u of SQ){u.x=m.x+(Math.random()-.5)*60;u.y=m.y+60+Math.random()*30;u.path=[];}const as=makeAssign(SQ,m.x,m.y);
      return{m,as,cov:as.filter(a=>a.cov).length,safe:as.filter(a=>SAFE(a)).length};};
    window.SURVEY=label=>{const rows=PIECES().map(o=>{const B=BEHIND(o),t=TAP4(o);return{kind:KIND[o.kind],o,fit:B.length,safe:B.filter(SAFE).length,cov4:t.cov,safe4:t.safe};});
      const hist=(L,k)=>{const h=[0,0,0,0,0];for(const r of L)h[Math.min(4,r[k])]++;return h;};
      const by={};for(const r of rows)(by[r.kind]=by[r.kind]||[]).push(r);
      return{label,known:threats().length,n:rows.length,fit:hist(rows,'fit'),safe:hist(rows,'safe'),cov4:hist(rows,'cov4'),safe4:hist(rows,'safe4'),
        by:Object.fromEntries(Object.entries(by).map(([k,L])=>[k,{n:L.length,fit:hist(L,'fit'),safe:hist(L,'safe'),cov4:hist(L,'cov4'),safe4:hist(L,'safe4')}]))};};});};
const show=s=>{console.log(`== ${s.label}: ${s.n} pieces, ${s.known} guns known`);
  console.log('   pieces by 0/1/2/3/4+ men:  fit behind',s.fit.join('/'),' | spots out of every gun\'s line',s.safe.join('/'),' | four tapped: green ghosts',s.cov4.join('/'),' really out of every line',s.safe4.join('/'));
  for(const[k,v]of Object.entries(s.by))console.log(`   ${k.padEnd(10)} ${String(v.n).padStart(2)}  fit ${v.fit.join('/')}  out of every line ${v.safe.join('/')}  four tapped: green ${v.cov4.join('/')}  really ${v.safe4.join('/')}`);};
const GAPS=()=>ev(()=>{const big=PIECES().filter(o=>BEHIND(o).length>=4).map(o=>({x:o.x+o.w/2,y:o.y+o.h/2}));const out=[];
  for(let y=720;y>=340;y-=40){const row=[];for(let x=DDX+120;x<=DDX+880;x+=190){const d=Math.min(...big.map(p=>hyp(p.x-x,p.y-y)));row.push(Math.round(d/10));}out.push(y+': '+row.join(' '));}return{n:big.length,rows:out};});
// --- today, spill and pairs
await beach([]);
const res=await ev(()=>{const out=[SURVEY('today')];
  const r3=ASSIGN_R[3],r4=ASSIGN_R[4];ASSIGN_R[3]=ASSIGN_R[4]=90;out.push(SURVEY('spill (spots out to 9 m)'));ASSIGN_R[3]=r3;ASSIGN_R[4]=r4;
  const added=[];for(const o of objs.filter(q=>q.kind==='ddhog'&&q.y>320)){for(const dx of[34,-34]){const q=Object.assign({},o,{x:o.x+dx,meshes:null,pair:o});if(objs.some(z=>z!==o&&rectDist(q.x+q.w/2,q.y+q.h/2,z)<20))continue;if(!isFree(q.x+q.w/2,q.y+q.h/2,10))continue;addObstacle(q);added.push(q);break;}}
  out.push(SURVEY('pairs (a second hedgehog 3 m beside each)'));for(const q of added)removeObstacle(q,[]);
  ROUND=true;out.push(SURVEY('craters cover all round (no new holes)'));ROUND=false;
  return out;});
res.forEach(show);
{const g=await GAPS();console.log('   today, pieces that fit four on the sand and up:',g.n,'; metres to the nearest one, by row (y) across the beach:');for(const r of g.rows)console.log('     ',r);}
// the pictures of today: the beach with how many fit behind each piece; four tapped at a hedgehog; four tapped at the big shell hole
const label=async(file,fn,arg)=>{await ev(fn,arg);await page.waitForTimeout(300);await ev(()=>{render(.001,simT);hud();drawOverlay(.03,simT);if(window.MARKS)MARKS();});await page.screenshot({path:`${OUT}/${file}.png`});console.log('  picture',file);};
const PICSET=async tag=>{
  await ev(()=>{const st=document.createElement('style');st.id='covst';st.textContent=`#bigText,#banner{display:none!important}
    .camtag{position:absolute;left:8px;top:8px;z-index:9;pointer-events:none;font:800 12px/1 var(--font-hud);letter-spacing:.08em;color:#0b0f13;background:#ffcf4a;border-radius:8px;padding:6px 10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5)}`;
    if(!document.getElementById('covst'))document.head.appendChild(st);if(!window.TAGEL){const t=document.createElement('div');t.className='camtag';document.body.appendChild(t);window.TAGEL=t;}
    // a number over each piece: how many fit behind it (1 red, 2 amber, 3 yellow, 4+ green); a ring when one of its spots is out of every gun's line
    window.FITMARKS=()=>{for(const o of PIECES()){const B=BEHIND(o);if(!B.length)continue;const n=B.length,s=B.filter(SAFE).length;toSBack=false;const[x,y]=toS(o.x+o.w/2,o.y+o.h/2,o.kind==='ddrim'?2:16);if(toSBack||x<-20||x>cw+20||y<-20||y>ch+20)continue;
      const col=n>=4?'#5be37a':n===3?'#ffe066':n===2?'#ffb347':'#ff6a55';ox.save();ox.beginPath();ox.arc(x,y,10,0,TAU);ox.fillStyle='rgba(8,11,14,.88)';ox.fill();ox.lineWidth=2.2;ox.strokeStyle=col;ox.stroke();
      if(s){ox.beginPath();ox.arc(x,y,14,0,TAU);ox.lineWidth=1.6;ox.strokeStyle='rgba(255,255,255,.9)';ox.stroke();}
      ox.fillStyle=col;ox.font=`800 12px ${HUDFONT}`;ox.textAlign='center';ox.textBaseline='middle';ox.fillText(n>=4?'4+':String(n),x,y+.5);ox.restore();}};});
  // the beach from above the water, the squad's half of it, every piece numbered
  await label(`cov-${tag}-beach`,tag=>{dd.track=null;camPan=null;CAMOVR=null;sel=[];preview=null;yaw=0;zoom=2.2;tilt=0;camShift=0;camT.x=DDX+470;camT.z=455;clampCam();updateCamera();window.MARKS=FITMARKS;
    TAGEL.textContent=tag==='today'?'TODAY · HOW MANY FIT BEHIND EACH':'DRAFT · SHELL HOLES FOR FOUR';},tag);
  // four tapped at a hedgehog, then at a big shell hole: the game's own ghosts (green in cover, red in the open)
  const shot=async(file,pick,text)=>label(file,([pick,text])=>{const o=pick==='hog'?PIECES().filter(q=>q.kind==='ddhog'&&q.y>420&&q.y<620).sort((a,c)=>Math.abs(a.x-DDX-450)-Math.abs(c.x-DDX-450))[0]
      :pick==='newhole'?PIECES().filter(q=>q.kind==='ddrim').sort((a,c)=>hyp(a.x+a.w/2-DDX-560,a.y-576)-hyp(c.x+c.w/2-DDX-560,c.y-576))[0]
      :PIECES().filter(q=>q.kind==='ddrim').sort((a,c)=>c.w-a.w)[0];
    const t=TAP4(o);selectTeam('A');sel=SQ.slice();preview={x:t.m.x,y:t.m.y,as:t.as};
    dd.track=null;camPan=null;yaw=0;zoom=6.2;tilt=Math.max(0,basePitch()-.5);camShift=0;camT.x=t.m.x;camT.z=t.m.y-10;clampCam();updateCamera();window.MARKS=null;TAGEL.textContent=text;
    window.LAST={green:t.cov,really:t.safe};},[pick,text]);
  await shot(`cov-${tag}-hog`,'hog',tag==='today'?'TODAY · FOUR SENT TO A HEDGEHOG':'DRAFT · FOUR SENT TO A HEDGEHOG');
  console.log('   ',JSON.stringify(await ev(()=>LAST)));
  await shot(`cov-${tag}-hole`,tag==='today'?'hole':'newhole',tag==='today'?'TODAY · FOUR SENT TO THE BIG SHELL HOLE':'DRAFT · FOUR SENT TO A NEW SHELL HOLE');
  console.log('   ',JSON.stringify(await ev(()=>LAST)));};
if(PICS){await ev(()=>{window.CAMOVR=null;});await PICSET('today');}
// --- the draft: six more shell holes for four along the way up the sand
await beach(HOLES);
const dh=await ev(()=>{const a=SURVEY('holes (six more shell holes for four), rims as today');ROUND=true;const b2=SURVEY('holes, and a man in a hole covered all round');return[a,b2];});dh.forEach(show);
// the way up the sand: from the water's edge to the wire, how far it is to the nearest piece that four fit behind
const gaps=await GAPS();console.log('   pieces that fit four on the sand and up:',gaps.n,'; metres to the nearest one, by row (y) across the beach:');for(const r of gaps.rows)console.log('     ',r);
if(PICS){await ev(()=>{window.CAMOVR=null;window.TAGEL=null;});await PICSET('draft');}
// --- the village: how many fit behind each piece there (its walls, hedges and houses)
const vg=await ev(()=>{startVillage({skip:true});for(let i=0;i<30;i++){update(1/30);}
  const by={};const C=new Map();for(const c of coverPts){if(!C.has(c.o))C.set(c.o,[]);C.get(c.o).push(c);}
  for(const[o,L]of C){const side=[L.filter(c=>c.y<o.y).length,L.filter(c=>c.y>o.y+o.h).length,L.filter(c=>c.x<o.x).length,L.filter(c=>c.x>o.x+o.w).length],n=Math.max(...side);
    const k=o.kind;by[k]=by[k]||[0,0,0,0,0];by[k][Math.min(4,n)]++;}
  const all=[0,0,0,0,0];for(const v of Object.values(by))v.forEach((n,i)=>all[i]+=n);return{all,by};});
console.log('== the village: pieces by how many fit along their best side 0/1/2/3/4+:',vg.all.join('/'));for(const[k,v]of Object.entries(vg.by))console.log(`   ${k.padEnd(10)} ${v.join('/')}`);
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
