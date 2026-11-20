// Bryan's two lines put on the ground: anchored at the boulder at their corner, in the view of shots.js's 'game' picture
const {chromium}=require('playwright');const {serve,open}=require('../harness.js');
(async()=>{const srv=await serve('/home/user/full-spectrum/dday',9751);const b=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const {page}=await open(b,'http://localhost:9751/index.html?gfx=0');await page.setViewportSize({width:390,height:760});
await page.evaluate(()=>{window.requestAnimationFrame=()=>0;});await page.click('#ddBtn');await page.waitForTimeout(600);
const r=await page.evaluate(()=>{damage=()=>{};let n=0;while(!dd.land.done&&n++<4000)update(1/30);ddFrame(1/30,simT);
  zoom=8.5;yaw=-.85;tilt=ddTilt(8.5,.38);camT.x=DDX+560;camT.z=170;camShift=0;updateCamera();
  const o=new THREE.Vector3().setFromMatrixPosition(camera.matrixWorld),G=(sx,sy)=>{const d=new THREE.Vector3(sx/cw*2-1,-(sy/ch)*2+1,.5).unproject(camera).sub(o).normalize();for(let t=0;t<6000;t+=1){const x=o.x+d.x*t,y=o.y+d.y*t,z=o.z+d.z*t;if(y<=ddH(x,z))return[Math.round(x-DDX),Math.round(z),Math.round(ddH(x,z))];}return null;};
  const S=[[355,860],[375,900],[395,950],[410,1000],[430,1045],[440,1060],[500,1058],[560,1040],[610,1020],[660,1010],[550,878]],B=[432,1060],A=[170,295];
  const out={rock:G(...A)};for(const k of[.7,.8,.9])out['k'+k]=S.map(p=>G(A[0]+(p[0]-B[0])/2.369/k,A[1]+(p[1]-B[1])/2.369/k));out.lip=[G(290,268),G(280,272),G(300,265)];out.h=[[560,60],[580,40],[600,20],[620,0],[560,100],[540,120]].map(p=>p+":"+Math.round(ddH(p[0]+DDX,p[1])));return out;});
console.log(JSON.stringify(r));await b.close();srv.close();process.exit(0);})();
