// Camera drafts for Bryan (after Version 174: "is there a way we can make the view point of the player easier. Like follows the map. I have two
// solutions. Maybe a fixed camera view for each section (at least in D-Day and other big maps) or make it third person view from being the squad,
// or the leader of the squad."): three moments on the beach map, each seen four ways, on a phone held upright.
//   A today: behind the man furthest ahead, always facing north (a drag of the map lets go of him).
//   B a set view for each section: framed by hand for each stretch of the map; it glides to the next one when the squad gets there.
//   C the squad's view: today's camera turned to look along the route, so the way ahead is always up the screen; it turns as the route turns.
//   D over the leader's shoulder: low behind one man of the squad, looking where the squad is going (Full Spectrum Warrior's camera).
// node dday-camera-draft.js [OUT] [PORT] -> OUT/cam-<1|2|3>-<A|B|C|D>.png; dday-camera-compose.py makes the sheet
const {chromium}=require('playwright');const fs=require('fs');const {serve,S}=require('./harness.js');
const OUT=process.argv[2]||'.',PO=+process.argv[3]||0,W=390,H=760;
const THREE_SRC=fs.readFileSync(S+'/deps/node_modules/three/build/three.min.js');
(async()=>{const port=9981+PO,srv=await serve(process.env.DDROOT||'/home/user/full-spectrum/dday',port);
const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const ctx=await b.newContext({viewport:{width:W,height:H},deviceScaleFactor:2});const page=await ctx.newPage();
const errors=[];page.on('pageerror',e=>errors.push(String(e)));
await page.route('**/*',r=>{const u=r.request().url();if(u.includes('cdnjs.cloudflare.com'))return r.fulfill({body:THREE_SRC,contentType:'text/javascript'});if(u.includes('fonts.g'))return r.abort();return r.continue();});
await page.goto(`http://localhost:${port}/index.html?noseq&gfx=2`);await page.waitForTimeout(2500);
const ev=(f,a)=>page.evaluate(f,a);
await ev(()=>{localStorage.removeItem('warehouseYard.ddmeta.v1');localStorage.removeItem('warehouseYard.ddctl.v1');ddRoster=ddmRead();const R=ddRoster;R.stage=2;R.battles=2;R.minLevel=3;
  ['A','B'].forEach(t=>['medic','gunner','rifle','demo'].forEach((r,i)=>R.squads[t][i]=ddmNewMan(r,3,false)));ddmSave();
  Math.random=(x=>()=>(x=(x*16807)%2147483647)/2147483647)(21);window.requestAnimationFrame=()=>0;
  window.RUN=s=>{for(let i=0;i<Math.round(s*30);i++){update(1/30);panTick(1/30);ddFrame(1/30,simT);}};
  damage=()=>undefined;   // (nobody hurt while the pictures are set up)
  const st=document.createElement('style');st.textContent=`#bigText,#banner{display:none!important}
    .camtag{position:absolute;left:8px;top:8px;z-index:9;pointer-events:none;font:800 12px/1 var(--font-hud);letter-spacing:.08em;color:#0b0f13;background:#ffcf4a;border-radius:8px;padding:6px 10px;white-space:nowrap;box-shadow:0 2px 8px rgba(0,0,0,.5)}`;
  document.head.appendChild(st);
  const tag=document.createElement('div');tag.className='camtag';document.body.appendChild(tag);window.TAGEL=tag;
  // a camera set by hand (D): kept through every render until the picture is taken
  window.CAMOVR=null;const uc=updateCamera;window.updateCamera=function(){const c=CAMOVR;if(!c)return uc.apply(this,arguments);
    if(camShiftOn){camera.clearViewOffset();camShiftOn=false;}camera.fov=c.fov;camera.updateProjectionMatrix();camera.position.copy(c.O);camera.lookAt(c.O.x+c.D.x*300,c.O.y+c.D.y*300,c.O.z+c.D.z*300);camera.updateMatrixWorld();};
  window.FOV0=camera.fov;});
await page.click('#ddBtn');await page.waitForTimeout(400);
await ev(()=>{let n=0;while(!dd.land.done&&n++<200)RUN(.5);RUN(6);});
// the three moments: Alpha (played) at a point of the route, Bravo following behind; the way ahead is the route two points on
const MOMENTS=[{i:1,name:'beach'},{i:6,name:'way up'},{i:10,name:'top'}];
// the set views, one per section (framed by hand): where the view's centre is, which way it faces, how close
const SECTION=[{cx:560,cy:430,yaw:-.5,zoom:3.1,tilt:.12},{cx:440,cy:-140,yaw:.55,zoom:3.3,tilt:.16},{cx:430,cy:-560,yaw:-1.05,zoom:3.3,tilt:.16}];
for(let m=0;m<MOMENTS.length;m++){
  const info=await ev(([i,S0])=>{
    const R=DD_ROUTE.map(([x,y])=>({x:x+DDX,y})),p=R[i],q=R[Math.min(R.length-1,i+2)];let hx=q.x-p.x,hy=q.y-p.y;const hl=Math.hypot(hx,hy)||1;hx/=hl;hy/=hl;
    const A=players.filter(u=>u.team==='A'&&alive(u)),B=players.filter(u=>u.team==='B'&&alive(u));
    // each man put at his spot of a group move there, with nothing left over from the beach (a throw or a kit he was walking for, a way back to the group)
    const clear=u=>{u.inBoat=false;u.afloat=false;u.joining=false;u.path=[];u.throwGo=null;u.medGo=null;u.rpgAim=null;u.helpGo=null;u.ret=null;u.raise=null;u.dash=null;u.lastOrder=simT;};
    const spots=new Map();
    const put=(L,x,y)=>{L.forEach((u,k)=>{clear(u);u.x=x+(k-1.5)*14;u.y=y;});const as=makeAssign(L,x,y);for(const a of as){const e=a.path&&a.path.length?a.path[a.path.length-1]:null;if(e){a.u.x=e.x;a.u.y=e.y;}a.u.path=[];a.u.ang=Math.atan2(hy,hx);}L.forEach(u=>spots.set(u,{x:u.x,y:u.y}));};
    put(A,p.x,p.y);put(B,p.x-hx*140,p.y-hy*140);
    selectTeam('A');dd.active='A';camPan=null;dd.track={team:'A'};
    for(const e of enemies)e.alerted=true;
    RUN(.8);for(const u of [...A,...B]){const s=spots.get(u);if(s&&hyp(u.x-s.x,u.y-s.y)>30){u.x=s.x;u.y=s.y;}clear(u);}RUN(.2);camPan=null;
    smokes.length=0;   // (a smoke grenade thrown meanwhile would grey the closest pictures)
    window.MOM={p,hx,hy,A,B,S0};return{at:[Math.round(p.x),Math.round(p.y)],heading:[+hx.toFixed(2),+hy.toFixed(2)],A:A.map(u=>[Math.round(u.x),Math.round(u.y),u.inBoat?'boat':'',u.carriedBy?'carried':''])};},[MOMENTS[m].i,SECTION[m]]);
  console.log('moment',m+1,JSON.stringify(info));
  for(const cam of['A','B','C','D']){
    const r=await ev(cam=>{
      const M=MOM,A=M.A.filter(alive);dd.track=null;camPan=null;
      const ahead=q=>q.y<-440?3000+q.x:-q.y,lead=A.reduce((a,q)=>ahead(q)>ahead(a)?q:a),mid={x:A.reduce((s,u)=>s+u.x,0)/A.length,y:A.reduce((s,u)=>s+u.y,0)/A.length};
      let custom=null;
      if(cam==='A'){yaw=0;zoom=DD_CAM.zoom;tilt=ddTilt(zoom);camShift=DD_CAM.shift;camT.x=lead.x-Math.sin(yaw)*DD_CAM.look;camT.z=lead.y-Math.cos(yaw)*DD_CAM.look;TAGEL.textContent='A · TODAY';}
      else if(cam==='B'){const s=M.S0;yaw=s.yaw;zoom=s.zoom;tilt=s.tilt;camShift=0;camT.x=s.cx+DDX;camT.z=s.cy;TAGEL.textContent='B · SET VIEW';}
      else if(cam==='C'){yaw=Math.atan2(-M.hx,-M.hy);zoom=DD_CAM.zoom;tilt=Math.max(0,basePitch()-.38);camShift=DD_CAM.shift;camT.x=mid.x+M.hx*DD_CAM.look;camT.z=mid.y+M.hy*DD_CAM.look;TAGEL.textContent='C · ALONG THE ROUTE';}   // (a little higher than today's .29: turned along the route, the low camera ends up behind the hill's shoulders)
      else{// the man at the back of the squad: the rest of it is in front of the camera
        const near=A.filter(q=>hyp(q.x-M.p.x,q.y-M.p.y)<200),back=(near.length?near:A).reduce((a,q)=>(q.x*M.hx+q.y*M.hy)<(a.x*M.hx+a.y*M.hy)?q:a),a=Math.atan2(M.hy,M.hx),pt=-.2,cp=Math.cos(pt);
        const D=new T.Vector3(Math.cos(a)*cp,Math.sin(pt),Math.sin(a)*cp),Rv=new T.Vector3(-Math.sin(a),0,Math.cos(a));
        const O=new T.Vector3(back.x,gndH(back.x,back.y)+20+16,back.y).addScaledVector(D,-84).addScaledVector(Rv,14);const gh=gndH(O.x,O.z)+3;if(O.y<gh)O.y=gh;
        custom={O,D,fov:52};camShift=0;camT.x=back.x;camT.z=back.y;TAGEL.textContent='D · LEADER’S SHOULDER';}
      CAMOVR=custom;if(!custom)clampCam();
      for(let k=0;k<3;k++)render(.001,simT);hud();drawOverlay(.03,simT);
      const faded=objs.filter(o=>(o.meshes||[]).some(m=>{const L=Array.isArray(m.material)?m.material:[m.material];return L.some(q=>q&&q.transparent&&q.opacity<.9);})).map(o=>o.kind+(o.tag?':'+o.tag:'')+'@'+Math.round(o.x)+','+Math.round(o.y)).slice(0,6);
      return{cam,yaw:+yaw.toFixed(2),zoom:+zoom.toFixed(2),pitch:+(Math.max(PITCH_MIN,basePitch()-tilt)*180/Math.PI).toFixed(1),faded};},cam);
    await page.waitForTimeout(300);
    await ev(()=>{render(.001,simT);hud();drawOverlay(.03,simT);});   // (the frame again: a frame drawn from a test can miss the screenshot)
    await page.screenshot({path:`${OUT}/cam-${m+1}-${cam}.png`});console.log(' ',cam,JSON.stringify(r));
    await ev(()=>{CAMOVR=null;camera.fov=FOV0;camera.updateProjectionMatrix();});
  }
}
console.log('errors',errors.length,errors.slice(0,3));await b.close();srv.close();})();
