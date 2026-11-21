// The camera on the top of the hill (Bryan, after Version 177: "The camera angles should follow the road better. At the top of the hill it's facing
// forward instead of down the road where the tank is when you are at the top. I like how it tracks the teams but it's focusing on the first bunker
// on the top of the hill rather than the incoming tank"). Alpha comes up onto the top and walks to the barracks' door; the tank and the infantry of
// the counterattack come down the road from the east. Every frame is drawn four times, once by each camera, so the four films show the same moments:
//   A today (Version 177): follows the man furthest ahead, turned along the route; the route ends at the barracks, so on the top it faces
//     east-north-east, at the barracks, and the road the tank comes down is off to the right
//   B down the road: the same, with the route going on along the road east from the top (in the game it does only once the barracks is taken)
//   C turn to the tank: as B, and while a tank is coming within 90 m of the man followed it turns to face from him to the tank, the view's middle
//     moved up to 8 m toward it
//   D frame both: as C, and it pulls back as far as it needs to keep your men and the tank both on the screen
// Nobody of ours is hurt, nobody runs for cover or dodges: the films show the cameras, not the men's own moves.
// node dday-top-camera-video.js [OUT] [PORT] [FPS] [DPR] [SECS] -> OUT/A..D/00001.jpg ...; dday-top-camera-video.py makes the films and the sheet
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const OUT=process.argv[2]||'.',PO=+process.argv[3]||0,FPS=+process.argv[4]||15,DPR=+process.argv[5]||1.5,SECS=+process.argv[6]||24,W=390,H=760;
const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');
for(const k of'ABCD')fs.mkdirSync(`${OUT}/${k}`,{recursive:true});
(async()=>{const port=9971+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:DPR});const page=await ctx.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
await page.goto(`http://localhost:${port}/index.html?gfx=2`);await page.waitForTimeout(2500);
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(31);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  const d0=damage;damage=(t,d,s)=>t.side==='P'?undefined:d0(t,d,s);   // (nobody of ours hurt, the other troops neither)
  const st=document.createElement('style');st.textContent=`#bigText,#banner{display:none!important}
    .camtag{position:absolute;left:8px;top:8px;z-index:9;pointer-events:none;display:flex;flex-direction:column;gap:4px;align-items:flex-start}
    .camtag b{font:800 12px/1 var(--font-hud);letter-spacing:.08em;color:#0b0f13;background:#ffcf4a;border-radius:8px;padding:6px 10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5)}
    .camtag i{font:700 10px/1 var(--font-hud);font-style:normal;letter-spacing:.08em;color:#e8edf0;background:rgba(8,11,14,.82);border-radius:6px;padding:4px 8px}`;
  document.head.appendChild(st);const t=document.createElement('div');t.className='camtag';t.innerHTML='<b></b><i></i>';document.body.appendChild(t);window.TAGB=t.children[0];window.TAGI=t.children[1];
  const p0=playerThink;window.playerThink=function(p){if(p&&p.side==='P'&&!p.npc){p.exposeT=0;return;}return p0.apply(this,arguments);};
  window.dodgeTick=function(){for(const n of nades)n.dodged=true;};});
await page.click('#ddBtn');await page.waitForTimeout(400);
const info=await ev(([SECS,FPS])=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);
  const wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
  // the beach and the top quiet: everyone of theirs down, so the counterattack is the only fight (it comes as Alpha nears the barracks)
  for(const e of enemies)if(!beaten(e)){e.hp=0;e.dead=true;if(e.m&&e.m.g)e.m.g.visible=false;}
  smokes.length=0;dd.shellT={heavy:1e9,cannon:1e9,art:1e9};
  // two routes as lines with distances along them: the game's (A) and the one going on down the road (B, C, D)
  const line=pts=>{const R=pts.map(([x,y])=>({x,y})),cum=[0];for(let i=1;i<R.length;i++)cum.push(cum[i-1]+hyp(R[i].x-R[i-1].x,R[i].y-R[i-1].y));return{R,cum,len:cum[cum.length-1]};};
  const game=line(DD_ROUTE.map(([x,y])=>[x+DDX,y])),road=line([...DD_ROUTE.map(([x,y])=>[x+DDX,y]),...DB.east]);
  const prog=(L,x,y)=>{let best=1e9,s=0;for(let i=1;i<L.R.length;i++){const a=L.R[i-1],c=L.R[i],l=L.cum[i]-L.cum[i-1],t=clamp(((x-a.x)*(c.x-a.x)+(y-a.y)*(c.y-a.y))/(l*l),0,1),px=a.x+(c.x-a.x)*t,py=a.y+(c.y-a.y)*t,d=hyp(x-px,y-py);if(d<best){best=d;s=L.cum[i-1]+t*l;}}return s;};
  const at=(L,s)=>{s=clamp(s,0,L.len);let i=1;while(i<L.R.length-1&&L.cum[i]<s)i++;const a=L.R[i-1],c=L.R[i],t=(s-L.cum[i-1])/(L.cum[i]-L.cum[i-1]||1);return{x:a.x+(c.x-a.x)*t,y:a.y+(c.y-a.y)*t};};
  // the way ahead as the game works it out (ddplay.js's ddRouteWay): from the nearest point to 20 m on, not past the end
  const way=(L,x,y)=>{const s=prog(L,x,y),s0=Math.min(s,L.len-100),a=at(L,s0),c=at(L,s0+200);return{x:c.x-a.x,y:c.y-a.y};};
  const yawOf=w=>Math.atan2(-w.x,-w.y);
  window.SQ=players.filter(u=>u.team==='A'&&alive(u));window.SQB=players.filter(u=>u.team==='B'&&alive(u));
  selectTeam('A');dd.active='A';
  // Alpha on the way up just below the top, Bravo behind; Alpha walks to the barracks' door along the route, each man at his place across it
  const FORM=[[-16,0],[10,12],[-6,22],[16,32]],S0=game.len-330;
  const p0=at(game,S0),p1=at(game,S0+20);let hx=p1.x-p0.x,hy=p1.y-p0.y;const hl=hyp(hx,hy)||1;hx/=hl;hy/=hl;
  const place=(u,lat,back)=>{const x=p0.x-hy*lat-hx*back,y=p0.y+hx*lat-hy*back,s=openSpot(x,y,[])||{x,y};Object.assign(u,{x:s.x,y:s.y,path:[],ang:Math.atan2(hy,hx),inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,rpgAim:null,helpGo:null,ret:null,dash:null,sup:0});};
  SQ.forEach((u,i)=>place(u,FORM[i][0],FORM[i][1]));SQB.forEach((u,i)=>place(u,FORM[i][0],FORM[i][1]+140));
  for(let i=0;i<SQ.length;i++){const u=SQ[i],[lat,back]=FORM[i];let path=[],cx=u.x,cy=u.y;
    for(let s=S0+60;s<=game.len+.1;s+=60){const ss=Math.min(s,game.len),q=at(game,ss);const tx=q.x-hy*lat-hx*back,ty=q.y+hx*lat-hy*back,o=openSpot(tx,ty,[])||{x:tx,y:ty},seg=findPath(cx,cy,o.x,o.y);if(seg&&seg.length){path=path.concat(seg);cx=o.x;cy=o.y;}}
    u.path=path;u.gaitForce='run';u.lastOrder=simT;}
  dd.ctr=null;   // (the counterattack starts by itself as they come near the barracks: ddplay.js's ddCounter)
  const lead=()=>{const ah=q=>q.y<-440?3000+q.x:-q.y;return SQ.filter(alive).reduce((a,q)=>ah(q)>ah(a)?q:a);};
  const mid=()=>{const L=SQ.filter(alive);return{x:L.reduce((a,u)=>a+u.x,0)/L.length,y:L.reduce((a,u)=>a+u.y,0)/L.length};};
  const tank=L=>(dd.tanks||[]).filter(K=>K.hp>0&&hyp(K.x-L.x,K.y-L.y)<900).sort((a,c)=>hyp(a.x-L.x,a.y-L.y)-hyp(c.x-L.x,c.y-L.y))[0]||null;
  const pitch=Math.max(0,basePitch()-DD_CAM.route);
  const L0=lead();
  window.CAMS={A:{yaw:yawOf(way(game,L0.x,L0.y))},B:{yaw:yawOf(way(road,L0.x,L0.y))},C:{yaw:yawOf(way(road,L0.x,L0.y)),off:{x:0,y:0}},D:{yaw:yawOf(way(road,L0.x,L0.y)),off:{x:0,y:0},zoom:DD_CAM.zoom}};
  for(const k of'ABCD'){const c=CAMS[k];c.x=L0.x-Math.sin(c.yaw)*DD_CAM.look;c.z=L0.y-Math.cos(c.yaw)*DD_CAM.look;}
  // D's pull-back: the zoom (not past the game's own) at which the man followed, the squad's middle and the tank all sit inside the screen's
  // safe box (under the top row, over the squad's bar), for a camera at that yaw looking at that point
  const fits=(yw,x,z,zm,P)=>{yaw=yw;zoom=zm;tilt=ddTilt(zm,DD_CAM.route);camShift=DD_CAM.shift;camT.x=x;camT.z=z;updateCamera();
    for(const p of P){toSBack=false;const s=toS(p.x,p.y,8);if(toSBack||s[0]<cw*.1||s[0]>cw*.9||s[1]<ch*.2||s[1]>ch*.8)return false;}return true;};
  window.STEP=dt=>{
    for(let i=0;i<Math.round(dt*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}
    smokes.length=0;
    const L=lead(),M=mid(),K=tank(L),k=Math.min(1,dt*1.6),kt=Math.min(1,dt*1.3);
    const ease=(c,yw,ox,oy)=>{c.yaw+=wrap(yw-c.yaw)*kt;const tx=L.x-Math.sin(c.yaw)*DD_CAM.look+ox,tz=L.y-Math.cos(c.yaw)*DD_CAM.look+oy;c.x+=(tx-c.x)*k;c.z+=(tz-c.z)*k;};
    ease(CAMS.A,yawOf(way(game,L.x,L.y)),0,0);
    ease(CAMS.B,yawOf(way(road,L.x,L.y)),0,0);
    for(const c of[CAMS.C,CAMS.D]){let yw=yawOf(way(road,L.x,L.y)),ox=0,oy=0;
      if(K){yw=yawOf({x:K.x-L.x,y:K.y-L.y});const d=hyp(K.x-L.x,K.y-L.y),f=Math.min(.2,80/d);ox=(K.x-L.x)*f;oy=(K.y-L.y)*f;}   // (at most 8 m toward it: your men stay above the squad's bar)
      c.off.x+=(ox-c.off.x)*k;c.off.y+=(oy-c.off.y)*k;ease(c,yw,c.off.x,c.off.y);}
    {const c=CAMS.D;let zt=DD_CAM.zoom;if(K){const P=[L,M,{x:K.x,y:K.y}];zt=4;for(let z=DD_CAM.zoom;z>=4;z-=.25){if(fits(c.yaw,c.x,c.z,z,P)){zt=z;break;}}}c.zoom+=(zt-c.zoom)*Math.min(1,dt*1.2);}
    window.KNOW={tank:!!K,d:K?Math.round(hyp(K.x-L.x,K.y-L.y)/10):null};};
  window.SHOOT=(cam,label)=>{
    dd.track=null;camPan=null;shakeK=0;const c=CAMS[cam];
    yaw=c.yaw;zoom=cam==='D'?c.zoom:DD_CAM.zoom;tilt=ddTilt(zoom,DD_CAM.route);camShift=DD_CAM.shift;camT.x=c.x;camT.z=c.z;
    TAGB.textContent={A:'A · TODAY',B:'B · DOWN THE ROAD',C:'C · TURN TO THE TANK',D:'D · FRAME BOTH'}[cam];TAGI.textContent=label;
    render(.0001,simT);drawOverlay(.03,simT);};
  STEP(0);hud();
  return{frames:Math.ceil(SECS*FPS),pitch};},[SECS,FPS]);
console.log('frames',info.frames);
const t0=Date.now();let tankAt=null;
for(let f=0;f<info.frames;f++){
  if(f)await ev(dt=>{STEP(dt);hud();},1/FPS);
  const k=await ev(()=>KNOW);if(k.tank&&tankAt==null)tankAt=f;
  const label=k.tank?`THE TANK · ${k.d} M`:'ONTO THE TOP';
  for(const cam of'ABCD'){await ev(([cam,n])=>SHOOT(cam,n),[cam,label]);await page.screenshot({path:`${OUT}/${cam}/${String(f+1).padStart(5,'0')}.jpg`,type:'jpeg',quality:84});}
  if(f%20===0)console.log('  frame',f+1,((Date.now()-t0)/1000/(f+1)).toFixed(2),'s a frame',JSON.stringify(k));
}
fs.writeFileSync(`${OUT}/info.json`,JSON.stringify({fps:FPS,frames:info.frames,tankAt}));
console.log('frames',info.frames,'tank in at frame',tankAt,'errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
