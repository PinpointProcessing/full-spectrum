// Camera samples in motion (Bryan, after the camera drafts: "Can you show me some samples for the new camera ideas?"): one advance of Alpha up the
// beach map, every frame of the game drawn four times, once by each camera, so the four films show the very same moments:
//   A today: behind the man furthest ahead, always facing north (ddplay.js's ddTrack, eased the same)
//   B a set view for each section: framed by hand; when the squad gets into the next section the view glides there (1.6 s)
//   C turns with the route: today's distance, a little higher (22°), turned to face the route about 18 m ahead of the lead man, eased
//   D over the leader's shoulder: low behind one man (here the one at the back of the squad), looking where the squad is going
// Three stretches, cut between: the sand to the wire; the way up (the route turns north-west); the top (it turns east to the barracks).
// The squad runs the route by itself (no orders, nobody hurt, no running for cover or dodging), Bravo following as it does in the game.
// node dday-camera-video.js [OUT] [PORT] [FPS] [DPR] [STRETCHES e.g. 123] -> OUT/A..D/00001.jpg ...; dday-camera-video.py makes the films
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const OUT=process.argv[2]||'.',PO=+process.argv[3]||0,FPS=+process.argv[4]||15,DPR=+process.argv[5]||1.5,ONLY=(process.argv[6]||'123').split('').map(Number),W=390,H=760;   // (ONLY: which stretches, e.g. 2: they can be filmed in parallel, each into its own OUT)
const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');
for(const k of'ABCD')fs.mkdirSync(`${OUT}/${k}`,{recursive:true});
(async()=>{const port=9991+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:DPR});const page=await ctx.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
await page.goto(`http://localhost:${port}/index.html?gfx=2`);await page.waitForTimeout(2500);
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(23);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  damage=()=>undefined;   // (nobody hurt)
  const st=document.createElement('style');st.textContent=`#bigText,#banner{display:none!important}
    .camtag{position:absolute;left:8px;top:8px;z-index:9;pointer-events:none;display:flex;flex-direction:column;gap:4px;align-items:flex-start}
    .camtag b{font:800 12px/1 var(--font-hud);letter-spacing:.08em;color:#0b0f13;background:#ffcf4a;border-radius:8px;padding:6px 10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5)}
    .camtag i{font:700 10px/1 var(--font-hud);font-style:normal;letter-spacing:.08em;color:#e8edf0;background:rgba(8,11,14,.82);border-radius:6px;padding:4px 8px}`;
  document.head.appendChild(st);const t=document.createElement('div');t.className='camtag';t.innerHTML='<b></b><i></i>';document.body.appendChild(t);window.TAGB=t.children[0];window.TAGI=t.children[1];
  // a camera set by hand (D): kept through every render
  window.CAMOVR=null;const uc=updateCamera;window.updateCamera=function(){const c=CAMOVR;if(!c)return uc.apply(this,arguments);
    if(camShiftOn){camera.clearViewOffset();camShiftOn=false;}camera.fov=c.fov;camera.updateProjectionMatrix();camera.position.copy(c.O);camera.lookAt(c.O.x+c.D.x*300,c.O.y+c.D.y*300,c.O.z+c.D.z*300);camera.updateMatrixWorld();};
  window.FOV0=camera.fov;
  // no running for cover, no dodging: the squads go where they're sent, so the films show the cameras, not the men's own moves
  const p0=playerThink;window.playerThink=function(p){if(p&&p.side==='P'&&!p.npc){p.exposeT=0;return;}return p0.apply(this,arguments);};
  window.dodgeTick=function(){for(const n of nades)n.dodged=true;};});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(3);
  // the route as a line with distances along it
  const R=DD_ROUTE.map(([x,y])=>({x:x+DDX,y})),cum=[0];for(let i=1;i<R.length;i++)cum.push(cum[i-1]+hyp(R[i].x-R[i-1].x,R[i].y-R[i-1].y));
  window.ROUTE={R,cum,len:cum[cum.length-1]};
  window.PROG=(x,y)=>{let best=1e9,s=0;for(let i=1;i<R.length;i++){const a=R[i-1],b2=R[i],L=cum[i]-cum[i-1],t=clamp(((x-a.x)*(b2.x-a.x)+(y-a.y)*(b2.y-a.y))/(L*L),0,1),px=a.x+(b2.x-a.x)*t,py=a.y+(b2.y-a.y)*t,d=hyp(x-px,y-py);if(d<best){best=d;s=cum[i-1]+t*L;}}return s;};
  window.AT=s=>{s=clamp(s,0,ROUTE.len);let i=1;while(i<R.length-1&&cum[i]<s)i++;const a=R[i-1],b2=R[i],t=(s-cum[i-1])/(cum[i]-cum[i-1]||1);return{x:a.x+(b2.x-a.x)*t,y:a.y+(b2.y-a.y)*t};};
  window.SQ=players.filter(u=>u.team==='A'&&alive(u));window.SQB=players.filter(u=>u.team==='B'&&alive(u));
  selectTeam('A');dd.active='A';
  // each man's place in the advance: across the route, and how far behind its front
  window.FORM=[[-16,0],[10,12],[-6,22],[16,32]];
  // the set views (B): from where along the route each holds, and the view
  window.SECT=[{s:0,cx:560,cy:440,yaw:-.5,zoom:3.1,tilt:.12,n:'the sand'},{s:400,cx:575,cy:130,yaw:.25,zoom:3.3,tilt:.16,n:'the bluff'},{s:700,cx:440,cy:-150,yaw:.55,zoom:3.3,tilt:.16,n:'the draw'},{s:1150,cx:430,cy:-560,yaw:-1.05,zoom:3.3,tilt:.16,n:'the top'}];});
// one stretch: the squads put at the start, sent along the route to its end; every frame drawn by the four cameras
let frame=0;
const STRETCH=[{from:0,to:262,n:'1 · THE SAND'},{from:452,to:1010,n:'2 · THE WAY UP'},{from:1152,to:1556,n:'3 · THE TOP'}];
for(const st of STRETCH.filter((q,i)=>ONLY.includes(i+1))){
  const nfr=await ev(([st,FPS])=>{
    const smooth=(a,b2,k)=>a+(b2-a)*k,wrap=a=>{while(a>Math.PI)a-=2*Math.PI;while(a<-Math.PI)a+=2*Math.PI;return a;};
    // the squads to the start: Alpha in its places at the start of the stretch, Bravo 14 m behind it
    const p0=AT(st.from),p1=AT(st.from+20);let hx=p1.x-p0.x,hy=p1.y-p0.y;const hl=hyp(hx,hy)||1;hx/=hl;hy/=hl;
    const place=(u,lat,back,extra)=>{const x=p0.x-hy*lat-hx*(back+extra),y=p0.y+hx*lat-hy*(back+extra),s=openSpot(x,y,[])||{x,y};Object.assign(u,{x:s.x,y:s.y,path:[],ang:Math.atan2(hy,hx),inBoat:false,afloat:false,joining:false,throwGo:null,medGo:null,rpgAim:null,helpGo:null,ret:null,dash:null,sup:0});};
    SQ.forEach((u,i)=>place(u,FORM[i][0],FORM[i][1],0));SQB.forEach((u,i)=>place(u,FORM[i][0],FORM[i][1],140));
    // Alpha's way: the route from the start to the end, each man at his place across it, walked by the nav grid between points
    for(let i=0;i<SQ.length;i++){const u=SQ[i],[lat,back]=FORM[i];let path=[],cx=u.x,cy=u.y;
      for(let s=st.from+60;s<=st.to+.1;s+=60){const q=AT(Math.min(s,st.to)),q2=AT(Math.min(s,st.to)+15);let dx=q2.x-q.x,dy=q2.y-q.y;const dl=hyp(dx,dy)||1;dx/=dl;dy/=dl;
        if(Math.min(s,st.to)>=st.to-1){dx=hx;dy=hy;}
        const tx=q.x-dy*lat-dx*back,ty=q.y+dx*lat-dy*back,o=openSpot(tx,ty,[])||{x:tx,y:ty},seg=findPath(cx,cy,o.x,o.y);if(seg&&seg.length){path=path.concat(seg);cx=o.x;cy=o.y;}}
      u.path=path;u.gaitForce='run';u.lastOrder=simT;}
    for(const e of enemies)if(!beaten(e))e.alerted=true;
    smokes.length=0;
    // the cameras' own state, snapped to where they'd be at the start
    const lead=()=>{const ahead=q=>q.y<-440?3000+q.x:-q.y;return SQ.reduce((a,q)=>ahead(q)>ahead(a)?q:a);};
    const mid=()=>({x:SQ.reduce((a,u)=>a+u.x,0)/SQ.length,y:SQ.reduce((a,u)=>a+u.y,0)/SQ.length});
    const head=s=>{const L=lead(),q=AT(PROG(L.x,L.y)+180);let x=q.x-L.x,y=q.y-L.y;const l=hyp(x,y)||1;return{x:x/l,y:y/l};};
    const sectAt=s=>{let k=0;for(let i=0;i<SECT.length;i++)if(s>=SECT[i].s)k=i;return k;};
    const L0=lead(),h0=head();
    window.CAMS={A:{x:L0.x,z:L0.y-DD_CAM.look},
      B:{k:sectAt(PROG(mid().x,mid().y)),from:null,t:1},
      C:{yaw:Math.atan2(-h0.x,-h0.y),x:L0.x+h0.x*DD_CAM.look,z:L0.y+h0.y*DD_CAM.look},
      D:{a:Math.atan2(h0.y,h0.x),O:null}};
    window.STEP=dt=>{   // the game on by dt, then each camera's state on by dt
      for(let i=0;i<Math.round(dt*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}
      smokes.length=0;
      const L=lead(),M=mid(),h=head(),k=Math.min(1,dt*1.6);
      // A: the game's own follow (ddTrack), facing north
      CAMS.A.x+=(L.x-CAMS.A.x)*k;CAMS.A.z+=(L.y-DD_CAM.look-CAMS.A.z)*k;
      // B: the section the squad's middle is in; a new one glides in
      const sk=sectAt(PROG(M.x,M.y));if(sk!==CAMS.B.k){CAMS.B.from=CAMS.B.cur||SECT[CAMS.B.k];CAMS.B.k=sk;CAMS.B.t=0;}CAMS.B.t=Math.min(1,CAMS.B.t+dt/1.6);
      {const to=SECT[CAMS.B.k],f=CAMS.B.from||to,e=CAMS.B.t*CAMS.B.t*(3-2*CAMS.B.t);CAMS.B.cur={cx:smooth(f.cx,to.cx,e),cy:smooth(f.cy,to.cy,e),yaw:f.yaw+wrap(to.yaw-f.yaw)*e,zoom:smooth(f.zoom,to.zoom,e),tilt:smooth(f.tilt,to.tilt,e)};}
      // C: turned toward the route ahead, eased; following like A
      const yw=Math.atan2(-h.x,-h.y);CAMS.C.yaw+=wrap(yw-CAMS.C.yaw)*Math.min(1,dt*1.4);
      const fx=-Math.sin(CAMS.C.yaw),fz=-Math.cos(CAMS.C.yaw);CAMS.C.x+=(L.x+fx*DD_CAM.look-CAMS.C.x)*k;CAMS.C.z+=(L.y+fz*DD_CAM.look-CAMS.C.z)*k;
      // D: behind the man at the back of the squad, turned with the route ahead, eased
      const u=SQ[3],a=Math.atan2(h.y,h.x);CAMS.D.a+=wrap(a-CAMS.D.a)*Math.min(1,dt*1.8);
      const pt=-.2,cp=Math.cos(pt),D=new T.Vector3(Math.cos(CAMS.D.a)*cp,Math.sin(pt),Math.sin(CAMS.D.a)*cp),Rv=new T.Vector3(-Math.sin(CAMS.D.a),0,Math.cos(CAMS.D.a));
      const O=new T.Vector3(u.x,gndH(u.x,u.y)+36,u.y).addScaledVector(D,-84).addScaledVector(Rv,14);const gh=gndH(O.x,O.z)+3;if(O.y<gh)O.y=gh;
      if(!CAMS.D.O)CAMS.D.O=O;else CAMS.D.O.lerp(O,Math.min(1,dt*5));CAMS.D.D=D;};
    window.SHOOT=(cam,label)=>{   // set one camera, draw the frame
      dd.track=null;camPan=null;shakeK=0;CAMOVR=null;
      if(cam==='A'){yaw=0;zoom=DD_CAM.zoom;tilt=ddTilt(zoom);camShift=DD_CAM.shift;camT.x=CAMS.A.x;camT.z=CAMS.A.z;TAGB.textContent='A · TODAY';}
      else if(cam==='B'){const v=CAMS.B.cur||SECT[CAMS.B.k];yaw=v.yaw;zoom=v.zoom;tilt=v.tilt;camShift=0;camT.x=v.cx+DDX;camT.z=v.cy;TAGB.textContent='B · SET VIEW PER SECTION';}
      else if(cam==='C'){yaw=CAMS.C.yaw;zoom=DD_CAM.zoom;tilt=Math.max(0,basePitch()-.38);camShift=DD_CAM.shift;camT.x=CAMS.C.x;camT.z=CAMS.C.z;TAGB.textContent='C · TURNS WITH THE ROUTE';}
      else{CAMOVR={O:CAMS.D.O,D:CAMS.D.D,fov:52};camShift=0;TAGB.textContent='D · LEADER’S SHOULDER';}
      TAGI.textContent=label;
      render(.0001,simT);drawOverlay(.03,simT);};
    STEP(0);hud();
    // frames: the time it takes the man at the back to get to the end, and a second more
    const far=SQ.reduce((a,u)=>{let L=0,x=u.x,y=u.y;for(const q of u.path){L+=hyp(q.x-x,q.y-y);x=q.x;y=q.y;}return Math.max(a,L);},0);
    return Math.ceil((far/RUN_SPEED+1.2)*FPS);},[st,FPS]);
  console.log(st.n,'frames',nfr);
  const t0=Date.now();
  for(let f=0;f<nfr;f++){
    if(f)await ev(dt=>{STEP(dt);hud();},1/FPS);
    for(const cam of'ABCD'){await ev(([cam,n])=>SHOOT(cam,n),[cam,st.n]);await page.screenshot({path:`${OUT}/${cam}/${String(frame+1).padStart(5,'0')}.jpg`,type:'jpeg',quality:84});}
    frame++;if(f%20===0)console.log('  frame',frame,((Date.now()-t0)/1000/(f+1)).toFixed(2),'s a frame');
  }
}
await ev(()=>{CAMOVR=null;camera.fov=FOV0;camera.updateProjectionMatrix();});
console.log('frames',frame,'errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
