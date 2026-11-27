// Bryan's camera from four landmarks (two boulders, the two ends of the sandbag line by his squad), then his lines on the ground
const {chromium}=require('playwright');const {serve,open}=require('../harness.js');
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',9753);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page}=await open(b,'http://localhost:9753/index.html?gfx=0');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.click('#ddBtn');await page.waitForTimeout(600);
const r=await page.evaluate(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);ddFrame(1/30,simT);
  const ray=(sx,sy)=>{const o=new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld),d=new THREE.Vector3(sx/cw*2-1,-(sy/ch)*2+1,.5).unproject(camera).sub(o).normalize();for(let t=0;t<6000;t+=1){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<=ddH(x,z))return[Math.round(x-DDX),Math.round(z),Math.round(ddH(x,z))];}return null;};
  zoom=8.5;yaw=-.85;tilt=ddTilt(8.5,.38);camT.x=DDX+560;camT.z=170;camShift=0;updateCamera();
  const r1=ray(170,295),r2=ray(117,172);
  return{r1,r2};});
console.log(JSON.stringify(r));
// the fit is done at Bryan's screen shape
await page.setViewportSize({width:390,height:709});await page.waitForTimeout(300);
const f=await page.evaluate(({r1,r2})=>{window.dispatchEvent(new Event('resize'));
  const K=2.369,P=(x,y)=>[x/K,(y-240)/K],L=[[r1[0],r1[1],P(480,1262)],[r2[0],r2[1],P(432,1060)],[500,195,P(385,1500)],[566,195,P(555,1412)]];
  let best=null;
  for(let zm=7;zm<=10.1;zm+=.5)for(let pt=.1;pt<=.6;pt+=.03)for(let yw=-1.6;yw<=.4;yw+=.05)for(let cx=380;cx<=720;cx+=10)for(let cz=0;cz<=340;cz+=10){
    zoom=zm;yaw=yw;tilt=ddTilt(zm,pt);camT.x=DDX+cx;camT.z=cz;camShift=0;updateCamera();let e=0;
    for(const[x,y,s]of L){const q=toS(x+DDX,y);e+=Math.hypot(q[0]-s[0],q[1]-s[1]);}
    if(!best||e<best.e)best={e:+e.toFixed(1),zm,pt:+pt.toFixed(2),yw:+yw.toFixed(2),cx,cz};}
  zoom=best.zm;yaw=best.yw;tilt=ddTilt(best.zm,best.pt);camT.x=DDX+best.cx;camT.z=best.cz;updateCamera();
  const o=new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld),G=(sx,sy)=>{const d=new THREE.Vector3(sx/cw*2-1,-(sy/ch)*2+1,.5).unproject(camera).sub(o).normalize();for(let t=0;t<6000;t+=1){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<=ddH(x,z))return[Math.round(x-DDX),Math.round(z),Math.round(ddH(x,z))];}return null;};
  const S=[[355,860],[375,900],[395,950],[410,1000],[430,1045],[440,1060],[500,1058],[560,1040],[610,1020],[660,1010],[550,878]];
  return{best,cw,ch,pts:S.map(p=>G(...P(...p)))};},r);
console.log(JSON.stringify(f));await b.close();srv.close();process.exit(0);})();
