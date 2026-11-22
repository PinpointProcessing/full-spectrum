/* Character lab, round 3: sculpted figures.
   A body is no longer assembled from separate tubes. It is described as one solid (trunk, limbs, hands and head blended
   into each other like clay) and a surface is wrapped round that solid, so shoulders, hips, neck and wrists flow together
   with no seams. Clothes and the face are painted on afterwards as a texture, which keeps every colour edge crisp.
   Two body families share one skeleton and one set of animations:
     "anat"  - human proportions measured in head units (the Grounded design), with a softness dial
     "troop" - the Full Spectrum trooper body (leg column or stout legs, barrel torso, ball head), given arms and hands */
const PK=['by','br','lean','twist','hz','hy','sLz','sLx','sRz','sRx','eL','eR','wR','hL','hR','kL','kR'];
const BONE={body:0,hips:1,chest:2,head:3,sL:4,eL:5,haL:6,sR:7,eR:8,haR:9,hL:10,kL:11,hR:12,kR:13,faL:14,fbL:15,thL:16,faR:17,fbR:18,thR:19};
function vmat(o){return new T.MeshStandardMaterial(Object.assign({vertexColors:true,roughness:.86,metalness:0},o||{}));}
const _k1=new T.Color();
const lin=(hex,out)=>(out||_k1).set(hex).convertSRGBToLinear();
const css=h=>'#'+h.toString(16).padStart(6,'0');
const sstep=(a,b,x)=>{const t=clamp((x-a)/(b-a),0,1);return t*t*(3-2*t);};
/* smooth lookup: rows are [key,...values]; every column is interpolated with a cubic through its neighbours */
function tabS(pts,f){
  const n=pts.length,asc=pts[0][0]<pts[n-1][0],lo=asc?0:n-1,hi=asc?n-1:0;
  if(f<=pts[lo][0])return pts[lo];if(f>=pts[hi][0])return pts[hi];
  let i=0;for(;i<n-2;i++){const a=pts[i][0],b=pts[i+1][0];if((f>=a&&f<=b)||(f<=a&&f>=b))break;}
  const p1=pts[i],p2=pts[i+1],p0=pts[i-1]||p1,p3=pts[i+2]||p2,h=p2[0]-p1[0],t=(f-p1[0])/h,t2=t*t,t3=t2*t,o=[f];
  const h00=2*t3-3*t2+1,h10=t3-2*t2+t,h01=-2*t3+3*t2,h11=t3-t2;
  for(let k=1;k<p1.length;k++){
    const m1=p0===p1?(p2[k]-p1[k])/h:(p2[k]-p0[k])/(p2[0]-p0[0]),m2=p3===p2?(p2[k]-p1[k])/h:(p3[k]-p1[k])/(p3[0]-p1[0]);
    o.push(h00*p1[k]+h10*h*m1+h01*p2[k]+h11*h*m2);
  }
  return o;
}

/* ================= 1. solids ================= */
const BIG=9;
/* union of two shapes with the join rounded over a distance k */
const smin=(a,b,k)=>{if(k<1e-4)return a<b?a:b;const h=Math.max(k-Math.abs(a-b),0)/k;return Math.min(a,b)-h*h*k*.25;};
/* a limb or trunk as a run of rounded cross-sections. rows are [t, c, rA, rB, rz, n].
   ax 'y': t = height, c = centre x, rA/rB = front/back reach, rz = half width, n = 2 for an ellipse, more for boxier.
   ax 'x': t = x, c = centre y, rA/rB = up/down reach. z0 is the centre line's z. */
function loft(ax,rows,z0,pad){
  const N=120,ka=rows[0][0],kb=rows[rows.length-1][0],lo=Math.min(ka,kb),hi=Math.max(ka,kb),st=(hi-lo)/N,D=new Float32Array((N+1)*5),vert=ax==='y';
  let c0=1e9,c1=-1e9,zm=0;pad=pad||1.2;
  for(let i=0;i<=N;i++){const p=tabS(rows,lo+st*i),a=i*5;D[a]=p[1];D[a+1]=Math.max(.012,p[2]);D[a+2]=Math.max(.012,p[3]);D[a+3]=Math.max(.012,p[4]);D[a+4]=p[5]||2;
    c0=Math.min(c0,p[1]-D[a+2]);c1=Math.max(c1,p[1]+D[a+1]);zm=Math.max(zm,D[a+3]);}
  // how fast the centre and the radii change along the axis, for turning the radial measure into a true distance
  const G=new Float32Array((N+1)*4);for(let i=0;i<=N;i++){const a=Math.max(0,i-1)*5,b=Math.min(N,i+1)*5,h=(b-a)/5*st;for(let k=0;k<4;k++)G[i*4+k]=(D[b+k]-D[a+k])/h;}
  return{d(px,py,pz){
    const t=vert?py:px,u=vert?px:py;
    if(t<lo-pad||t>hi+pad||u<c0-pad||u>c1+pad||pz<z0-zm-pad||pz>z0+zm+pad)return BIG;
    const tc=t<lo?lo:t>hi?hi:t,f=(tc-lo)/st,i=f>=N?N-1:f|0,w=f-i,a=i*5,g=i*4,fr=u-(D[a]+(D[a+5]-D[a])*w)>=0?1:2;
    const du=u-(D[a]+(D[a+5]-D[a])*w),dv=pz-z0,ru=D[a+fr]+(D[a+5+fr]-D[a+fr])*w,rv=D[a+3]+(D[a+8]-D[a+3])*w,n=D[a+4]+(D[a+9]-D[a+4])*w;
    const qu=Math.abs(du)/ru,qv=Math.abs(dv)/rv,rho=n<2.0001?Math.sqrt(qu*qu+qv*qv):Math.pow(Math.pow(qu,n)+Math.pow(qv,n),1/n),len=Math.sqrt(du*du+dv*dv);
    let dr=-Math.min(ru,rv);
    if(rho>1e-5){const cu=du/len,cv=dv/len,sl=(G[g+fr]+(G[g+4+fr]-G[g+fr])*w)*cu*cu+(G[g+3]+(G[g+7]-G[g+3])*w)*cv*cv+(G[g]+(G[g+4]-G[g])*w)*cu;dr=(len-len/rho)/Math.sqrt(1+sl*sl);}
    if(t!==tc){const da=Math.abs(t-tc);dr=dr>0?Math.sqrt(dr*dr+da*da):da;}
    else{const e=t-lo<hi-t?lo-t:t-hi;if(e>dr)dr=e;}
    return dr;
  }};
}
function ell(cx,cy_,cz,rx,ry,rz,rotZ,rotY){
  const cZ=Math.cos(rotZ||0),sZ=Math.sin(rotZ||0),cY=Math.cos(rotY||0),sY=Math.sin(rotY||0),R=Math.max(rx,ry,rz)+1.2,R2=R*R,rm=Math.min(rx,ry,rz);
  return{d(px,py,pz){
    const x=px-cx,y=py-cy_,z=pz-cz;if(x*x+y*y+z*z>R2)return BIG;
    const x1=x*cY-z*sY,z1=x*sY+z*cY,x2=x1*cZ+y*sZ,y2=-x1*sZ+y*cZ,a=x2/rx,b=y2/ry,c=z1/rz,k0=Math.sqrt(a*a+b*b+c*c),k1=Math.sqrt(a*a/(rx*rx)+b*b/(ry*ry)+c*c/(rz*rz));
    return k1<1e-9?-rm:k0*(k0-1)/k1;
  }};
}
function cone(ax,ay,az,bx_,by_,bz,r1,r2){
  const dx=bx_-ax,dy=by_-ay,dz=bz-az,L2=dx*dx+dy*dy+dz*dz||1e-9,mx=(ax+bx_)/2,my=(ay+by_)/2,mz=(az+bz)/2,R=Math.sqrt(L2)/2+Math.max(r1,r2)+1.2,R2=R*R;
  return{d(px,py,pz){
    const ex=px-mx,ey=py-my,ez=pz-mz;if(ex*ex+ey*ey+ez*ez>R2)return BIG;
    const x=px-ax,y=py-ay,z=pz-az;let t=(x*dx+y*dy+z*dz)/L2;t=t<0?0:t>1?1:t;
    const qx=x-dx*t,qy=y-dy*t,qz=z-dz*t;return Math.sqrt(qx*qx+qy*qy+qz*qz)-(r1+(r2-r1)*t);
  }};
}
/* everything on the side of a tilted plane that (nx,ny) points to: used to cut the hairline */
function half(x0,y0,nx,ny){return{d(x,y){return-((x-x0)*nx+(y-y0)*ny);}};}
/* a solid is a list of shapes. Each is blended into what is already there over its own distance k (a number, or a function of
   position so a limb can melt into the trunk at its root and stay separate further down), and each says which bones move it. */
function Solid(){this.P=[];this.dv=[];}
Solid.prototype.add=function(p,k,w){p.k=k;p.w=w;this.P.push(p);return p;};
Solid.prototype.cut=function(p,k){p.k=k;p.sub=1;this.P.push(p);return p;};
Solid.prototype.d=function(x,y,z){
  const P=this.P;let d=BIG;
  for(let i=0;i<P.length;i++){const p=P[i],v=p.d(x,y,z);if(v>BIG-1)continue;
    if(p.sub)d=-smin(-d,v,p.k);else d=smin(d,v,typeof p.k==='function'?p.k(x,y,z):p.k);}
  return d;
};
const _acc=new Float32Array(20),_sk={i:[0,0,0,0],w:[0,0,0,0]},_uv=[0,0];
/* bone weights at a point: the nearest shape decides, and shapes that are being blended in there share the vertex */
Solid.prototype.skin=function(x,y,z,o){
  const P=this.P,dv=this.dv,acc=_acc;let m=-1,dm=BIG;acc.fill(0);
  for(let i=0;i<P.length;i++){if(P[i].sub){dv[i]=BIG;continue;}const v=dv[i]=P[i].d(x,y,z);if(v<dm){dm=v;m=i;}}
  if(m<0)m=0;
  const kf=p=>p===P[0]?1e9:typeof p.k==='function'?p.k(x,y,z):p.k,km=kf(P[m]);
  for(let i=0;i<P.length;i++){
    const v=dv[i];let g=1;if(i!==m){if(v>BIG-1)continue;const tau=Math.min(kf(P[i]),km)*.6;if(tau<.02)continue;g=1-(v-dm)/tau;if(g<=0)continue;g*=g;}
    const w=P[i].w;if(typeof w==='number')acc[w]+=g;else{const r=w(x,y,z);acc[r[0]]+=g*(1-r[2]);acc[r[1]]+=g*r[2];}
  }
  let s=0;for(let c=0;c<4;c++){let b=0;for(let j=1;j<20;j++)if(acc[j]>acc[b])b=j;o.i[c]=b;o.w[c]=Math.max(0,acc[b]);s+=o.w[c];acc[b]=-1;}
  for(let c=0;c<4;c++)o.w[c]/=s||1;
};

/* ================= 2. wrapping a surface round a solid ================= */
function newAcc(){return{pos:[],nrm:[],uv:[],si:[],sw:[]};}
/* Surface nets: sample the solid on a grid of cell size h inside box, put one vertex in every cell the surface passes through, and
   join neighbours. Normals come from the solid itself, so shading is smooth whatever the grid. skip() leaves out cells that a finer
   pass will cover; uvOf() says where on the paint sheet each triangle looks. */
function polygonize(F,box,h,skip,uvOf,A,sink){
  const x0=box[0],y0=box[1],z0=box[2],nx=Math.ceil((box[3]-x0)/h)+1,ny=Math.ceil((box[4]-y0)/h)+1,nz=Math.ceil((box[5]-z0)/h)+1,sy=nx,sz=nx*ny;
  const V=new Float32Array(nx*ny*nz);
  for(let k=0,q=0;k<nz;k++)for(let j=0;j<ny;j++)for(let i=0;i<nx;i++,q++)V[q]=F.d(x0+i*h,y0+j*h,z0+k*h);
  const id=new Int32Array(V.length).fill(-1),vp=[],CO=[0,1,sy,sy+1,sz,sz+1,sz+sy,sz+sy+1],EA=[0,2,4,6,0,1,4,5,0,1,2,3],EB=[1,3,5,7,2,3,6,7,4,5,6,7];
  for(let k=0;k<nz-1;k++)for(let j=0;j<ny-1;j++)for(let i=0;i<nx-1;i++){
    const q=i+j*sy+k*sz;let m=0;for(let c=0;c<8;c++)if(V[q+CO[c]]<0)m|=1<<c;
    if(m===0||m===255)continue;
    if(skip&&skip(x0+(i+.5)*h,y0+(j+.5)*h,z0+(k+.5)*h))continue;
    let px=0,py=0,pz=0,n=0;
    for(let e=0;e<12;e++){const a=EA[e],b=EB[e];if(((m>>a)&1)===((m>>b)&1))continue;const va=V[q+CO[a]],t=va/(va-V[q+CO[b]]),ax=a&1,ay=(a>>1)&1,az=a>>2;
      px+=ax+((b&1)-ax)*t;py+=ay+(((b>>1)&1)-ay)*t;pz+=az+((b>>2)-az)*t;n++;}
    id[q]=vp.length/3;vp.push(x0+(i+px/n)*h,y0+(j+py/n)*h,z0+(k+pz/n)*h);
  }
  const nv=vp.length/3,vn=new Float32Array(nv*3),vi=new Uint8Array(nv*4),vw=new Float32Array(nv*4),e=.012;
  for(let v=0;v<nv;v++){const x=vp[v*3],y=vp[v*3+1],z=vp[v*3+2],gx=F.d(x+e,y,z)-F.d(x-e,y,z),gy=F.d(x,y+e,z)-F.d(x,y-e,z),gz=F.d(x,y,z+e)-F.d(x,y,z-e),l=Math.hypot(gx,gy,gz)||1;
    vn[v*3]=gx/l;vn[v*3+1]=gy/l;vn[v*3+2]=gz/l;F.skin(x,y,z,_sk);if(sink){const o=sink(x,y,z);if(o>0){vp[v*3]-=gx/l*o;vp[v*3+1]-=gy/l*o;vp[v*3+2]-=gz/l*o;}}for(let c=0;c<4;c++){vi[v*4+c]=_sk.i[c];vw[v*4+c]=_sk.w[c];}}
  const put=(a,nxa,cyc)=>{uvOf(vp[a*3],vp[a*3+1],vp[a*3+2],nxa,cyc,_uv);A.pos.push(vp[a*3],vp[a*3+1],vp[a*3+2]);A.nrm.push(vn[a*3],vn[a*3+1],vn[a*3+2]);A.uv.push(_uv[0],_uv[1]);
    A.si.push(vi[a*4],vi[a*4+1],vi[a*4+2],vi[a*4+3]);A.sw.push(vw[a*4],vw[a*4+1],vw[a*4+2],vw[a*4+3]);};
  const tri=(a,b,c)=>{
    const ax=vp[a*3],ay=vp[a*3+1],az=vp[a*3+2],ux=vp[b*3]-ax,uy=vp[b*3+1]-ay,uz=vp[b*3+2]-az,wx=vp[c*3]-ax,wy=vp[c*3+1]-ay,wz=vp[c*3+2]-az;
    const sx=vn[a*3]+vn[b*3]+vn[c*3],sy2=vn[a*3+1]+vn[b*3+1]+vn[c*3+1],sz2=vn[a*3+2]+vn[b*3+2]+vn[c*3+2];
    if((uy*wz-uz*wy)*sx+(uz*wx-ux*wz)*sy2+(ux*wy-uy*wx)*sz2<0){const t=b;b=c;c=t;}
    const cyc=(ay+vp[b*3+1]+vp[c*3+1])/3,nxa=sx/3;put(a,nxa,cyc);put(b,nxa,cyc);put(c,nxa,cyc);
  };
  const d2=(a,b)=>{const x=vp[a*3]-vp[b*3],y=vp[a*3+1]-vp[b*3+1],z=vp[a*3+2]-vp[b*3+2];return x*x+y*y+z*z;};
  const quad=(a,b,c,d)=>{if(a<0||b<0||c<0||d<0)return;if(d2(a,c)<=d2(b,d)){tri(a,b,c);tri(a,c,d);}else{tri(a,b,d);tri(b,c,d);}};
  for(let k=1;k<nz-1;k++)for(let j=1;j<ny-1;j++)for(let i=1;i<nx-1;i++){
    const q=i+j*sy+k*sz,s=V[q]<0;
    if((V[q+1]<0)!==s)quad(id[q-sy-sz],id[q-sz],id[q],id[q-sy]);
    if((V[q+sy]<0)!==s)quad(id[q-sz-1],id[q-1],id[q],id[q-sz]);
    if((V[q+sz]<0)!==s)quad(id[q-1-sy],id[q-sy],id[q],id[q-1]);
  }
}
function accGeo(A){
  const g=new T.BufferGeometry();
  g.setAttribute('position',new T.Float32BufferAttribute(A.pos,3));g.setAttribute('normal',new T.Float32BufferAttribute(A.nrm,3));g.setAttribute('uv',new T.Float32BufferAttribute(A.uv,2));
  g.setAttribute('skinIndex',new T.Uint16BufferAttribute(A.si,4));g.setAttribute('skinWeight',new T.Float32BufferAttribute(A.sw,4));return g;
}

/* ================= 3. the paint sheet ================= */
/* One 2048 sheet per figure. The body is painted twice as seen from the front and from behind (z across, height up, 80 px a unit),
   the face once from the front (400 px a head). Bands of colour are level lines, so they wrap cleanly round the body. */
const TEX=2048;
function paintBody(g,L,P){
  const sb=P.sb,zd=P.zDiv,WW=6.2;
  for(const[X0,front]of[[512,1],[1536,0]]){
    const X=z=>X0+z*sb,Yp=y=>1410-y*sb,R=(za,zb,ya,yb,col)=>{g.fillStyle=col;g.fillRect(X(za),Yp(yb),(zb-za)*sb,(yb-ya)*sb);};
    R(-zd,zd,P.shoeTop,P.hem,css(L.pants));
    R(-zd,zd,P.hem,P.ySide,css(L.tee));R(-WW,WW,P.sleeve,P.ySide,css(L.tee));
    if(P.stripe)R(-zd,zd,P.stripe[0],P.stripe[1],css(L.trim));
    if(P.sleeveTrim){R(-WW,-zd,P.sleeve,P.sleeve+P.sleeveTrim,css(L.trim));R(zd,WW,P.sleeve,P.sleeve+P.sleeveTrim,css(L.trim));}
    const gr=g.createLinearGradient(0,Yp(P.hem),0,Yp(P.hem-.45));gr.addColorStop(0,'rgba(0,0,0,.3)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(X(-zd),Yp(P.hem),2*zd*sb,.45*sb);
    const dip=front?P.ySide-P.yFront:0,wd=P.nw*.8,cy_=z=>P.ySide-(Math.abs(z)<wd?dip*Math.pow(Math.cos(PI*z/(2*wd)),2):0);
    g.beginPath();g.moveTo(X(-WW),Yp(P.top));g.lineTo(X(-WW),Yp(P.ySide));for(let z=-wd;z<=wd+1e-6;z+=wd/24)g.lineTo(X(z),Yp(cy_(z)));g.lineTo(X(WW),Yp(P.ySide));g.lineTo(X(WW),Yp(P.top));g.closePath();g.fillStyle=css(L.skin);g.fill();
    g.beginPath();g.moveTo(X(-WW),Yp(P.ySide));for(let z=-wd;z<=wd+1e-6;z+=wd/24)g.lineTo(X(z),Yp(cy_(z)));g.lineTo(X(WW),Yp(P.ySide));g.strokeStyle=css(L.trim);g.lineWidth=P.rib*sb;g.lineJoin='round';g.stroke();
    R(-WW,WW,-.4,P.shoeTop,css(L.shoe));R(-WW,WW,-.4,P.sole,css(L.sole));
    if(P.cuff>P.shoeTop)R(-zd,zd,P.shoeTop,P.cuff,css(L.sock));
  }
}
function paintFace(g,L,hd,eyeY,eyeZ){
  const X=zn=>420+zn*400,Yp=yn=>1940-yn*400,eS=hd.eye||1,rd=hd.round||0;
  for(const s of[1,-1]){const ccx=X(s*(eyeZ+.05)),ccy=Yp(eyeY-.13),gr=g.createRadialGradient(ccx,ccy,0,ccx,ccy,50);gr.addColorStop(0,'rgba(214,104,84,.2)');gr.addColorStop(1,'rgba(214,104,84,0)');g.fillStyle=gr;g.fillRect(ccx-52,ccy-52,104,104);}
  for(const s of[1,-1]){
    g.fillStyle=css(L.eye);g.beginPath();g.ellipse(X(s*eyeZ),Yp(eyeY),.027*eS*400,.041*eS*400,0,0,TAU);g.fill();
    g.fillStyle='#ffffff';g.beginPath();g.ellipse(X(s*eyeZ-.009*eS),Yp(eyeY+.015*eS),.008*eS*400,.011*eS*400,0,0,TAU);g.fill();
    if(hd.brow){const yb=eyeY+.05*eS+.035,bw=hd.brow*Math.max(1,eS*.8);g.strokeStyle=css(L.brow);g.lineWidth=.017*400;g.lineCap='round';g.beginPath();
      g.moveTo(X(s*(eyeZ-.052*bw)),Yp(yb-.004));g.quadraticCurveTo(X(s*eyeZ),Yp(yb+.018),X(s*(eyeZ+.06*bw)),Yp(yb-.012));g.stroke();}
  }
  if(hd.mouth){const m=hd.mouth,my=lerp(.2,.19,rd);g.strokeStyle=css(L.lip);g.lineWidth=.012*400;g.lineCap='round';g.beginPath();g.moveTo(X(-.055*m),Yp(my+.008));g.quadraticCurveTo(X(0),Yp(my-.014),X(.055*m),Yp(my+.008));g.stroke();}
}
function figTexture(L,P,hd,HD){
  const c=document.createElement('canvas');c.width=c.height=TEX;const g=c.getContext('2d');
  g.fillStyle=css(L.skin);g.fillRect(0,0,TEX,TEX);
  paintBody(g,L,P);paintFace(g,L,hd,HD.eyeY,HD.eyeZ);
  g.fillStyle=css(L.hair);g.fillRect(1150,1600,300,300);
  const t=new T.CanvasTexture(c);t.encoding=T.sRGBEncoding;t.anisotropy=4;return t;
}

/* ================= 4. the drafts ================= */
const STYLES=[
  {id:'smooth',name:'Grounded, smoothed',family:'anat',blurb:'The Grounded build as one continuous sculpt: rounded shoulders that run into the arms, mitten hands, a simple clean face.',
    heads:6.6,wSh:1.02,wChest:1.03,wWaist:1.13,wHip:.96,depth:1.08,neck:1.06,thArm:1.12,thFore:1.14,thLeg:1.18,hand:1.05,foot:1.16,soft:.3,head:{jaw:.9,chin:1,cran:1,round:.12,eye:1.05,nose:.9,mouth:1,brow:1,ears:1}},
  {id:'soft',name:'Soft',family:'anat',blurb:'Shorter and rounder, about 5 heads tall. Thicker limbs, bigger head, almost no waist. Halfway between a person and the trooper.',
    heads:5.1,legK:.94,armK:.95,wSh:.93,wChest:1.06,wWaist:1.2,wHip:1.06,depth:1.08,neck:1.2,thArm:1.3,thFore:1.42,thLeg:1.28,hand:1.2,foot:1.25,soft:.7,head:{jaw:1.02,chin:1.2,cran:1.02,round:.5,eye:1.25,nose:.6,mouth:.8,brow:1,ears:.9}},
  {id:'troop',name:'Trooper',family:'troop',blurb:'The Full Spectrum trooper body: barrel torso, stout legs, ball head, team band round the chest. Given arms and mitten hands so it can hold and swing.',
    head:{round:.93,eye:1.5,nose:0,mouth:.7,brow:.9,ears:0}},
  {id:'pawn',name:'Pawn',family:'troop',column:true,float:true,blurb:'Closest to the Full Spectrum piece: one leg column, barrel body, ball head, no arms. Two floating hands carry the bat. It hops instead of walking.',
    head:{round:.95,eye:1.5,nose:0,mouth:0,brow:0,ears:0}},
];
const LOOK={skin:0xdcab86,tee:0xdedbd2,trim:0xa8332c,pants:0x303c58,shoe:0xe9e6dd,sole:0x5f5b54,sock:0xcfcfcf,hair:0x30231a,brow:0x2b1f17,eye:0x15171b,lip:0x8a4a40};
const handBones=(K,L)=>L?{e:K.eL,h:K.haL,fa:K.faL,fb:K.fbL,th:K.thL}:{e:K.eR,h:K.haR,fa:K.faR,fb:K.fbR,th:K.thR};

/* a mitten: palm and fingers as one shape with a thumb. Two finger bones curl it into a fist. The palm faces the leg. */
function mitt(F,s,wy,zs,wr,Lh,Wh,Th,bn,out,closed){
  const M=[[-.12,(closed?.3:.8)*wr[0]/Wh,(closed?.4:.8)*wr[1]/Th,0],[0,wr[0]/Wh,wr[1]/Th,0],[.1,.78,1.12,.04],[.28,.95,1.06,.1],[.48,1,1,.15],[.62,.98,.95,.2],[.76,.9,.88,.26],[.88,.74,.76,.31],[.96,.5,.56,.34],[1,.2,.26,.35]];
  F.add(loft('y',M.map(p=>[wy-p[0]*Lh,p[3]*Wh,p[1]*Wh,p[1]*Wh*.94,p[2]*Th,lerp(2,2.5,sstep(0,.3,p[0]))]),zs,.9),.06,
    (x,y)=>{const t=(wy-y)/Lh;return t<.4?[bn.e,bn.h,sstep(-.04,.1,t)]:t<.62?[bn.h,bn.fa,sstep(.4,.56,t)]:[bn.fa,bn.fb,sstep(.68,.82,t)];});
  const TH=[[.1,.5,.36],[.2,.8,.38],[.3,1.12,.34],[.4,1.38,.29],[.48,1.52,.24],[.54,1.6,.16]];
  F.add(loft('y',TH.map(p=>[wy-p[0]*Lh,p[1]*Wh,p[2]*Wh,p[2]*Wh,p[2]*Wh*.9,2]),zs-s*Th*.3,.9),.08,(x,y)=>[bn.h,bn.th,sstep(.1,.22,(wy-y)/Lh)]);
  Object.assign(out,{fa:[.15*Wh,-.48*Lh],fbDy:-.26*Lh,th:[.55*Wh,-.13*Lh,Th*.3],grip:{x:.15*Wh,y:-.32*Lh,z:Th+.07},gap:2.15*Wh,d0:[1.03*Wh,-.4*Lh]});
}
/* the head, added to the body's solid so the neck runs into it. Returns the hair as a solid of its own. */
function sculptHead(F,hd,Hh,chinY,cx0,K){
  const rd=hd.round||0,jaw=hd.jaw||1,chin=hd.chin||1,cran=hd.cran||1;
  // profile: height (0 chin, 1 crown), front, back, half width, boxiness
  const HP=[[0,.31,.19,.07,2],[.035,.395,.05,.15*chin,2.2],[.11,.42,-.12,.215*jaw,2.4],[.21,.43,-.25,.25*jaw,2.5],[.31,.435,-.35,lerp(.285,.285*jaw,.6),2.4],[.43,.43,-.42,.31,2.3],
    [.55,.43,-.455,.33*cran,2.25],[.68,.42,-.46,.34*cran,2.2],[.8,.37,-.44,.325*cran,2.1],[.9,.27,-.36,.27*cran,2],[.97,.13,-.2,.16*cran,2],[1,.03,-.07,.04,2]];
  const hp=yn=>{const p=tabS(HP,yn).slice();if(rd){const q=Math.sqrt(Math.max(.0004,1-Math.pow(2*yn-1,2)));p[1]=lerp(p[1],.45*q,rd);p[2]=lerp(p[2],-.45*q,rd);p[3]=lerp(p[3],.42*q,rd);p[4]=lerp(p[4],2,rd);}return p;};
  const rows=[];for(let i=0;i<=28;i++){const yn=.5-.5*Math.cos(PI*i/28),p=hp(yn),r=Math.max(.012,(p[1]-p[2])/2);rows.push([chinY+yn*Hh,cx0+(p[1]+p[2])/2*Hh,r*Hh,r*Hh,Math.max(.012,p[3])*Hh,p[4]]);}
  const skull=loft('y',rows,0,.9),eyeY=lerp(.5,.46,rd),eyeZ=.15*(1+.26*rd),fx=yn=>cx0+hp(yn)[1]*Hh,hw=yn=>hp(yn)[3]*Hh;
  F.add(skull,.09*Hh,K.head);
  if(hd.nose)F.add(cone(fx(.47)-.035*Hh,chinY+.47*Hh,0,fx(.375)+.03*hd.nose*Hh,chinY+.375*Hh,0,.028*Hh,.043*hd.nose*Hh),.055*Hh,K.head);
  if(hd.ears)for(const s of[1,-1]){const ey=eyeY-.06;F.add(ell(cx0-.04*Hh,chinY+ey*Hh,s*(hw(ey)+.004*Hh),.043*hd.ears*Hh,.078*hd.ears*Hh,.026*Hh,.2,s*-.25),.035*Hh,K.head);}
  /* hair: a layer over the skull with some lift at the front, then the face, the ears and the neck are cut out of it */
  const HS=new Solid(),th=(hd.hairT||.046)*Hh,ey=eyeY-.06;
  {const ym=chinY+.52*Hh,xm=cx0-.02*Hh,sc=1+th/(.42*Hh),sv=sc+.035;HS.add(loft('y',rows.map(r=>[ym+(r[0]-ym)*sv,xm+(r[1]-xm)*sc,r[2]*sc,r[3]*sc,r[4]*sc,r[5]]),0,.9),0,K.head);}
  HS.cut(ell(cx0+.45*Hh,chinY+lerp(.33,.3,rd)*Hh,0,.5*Hh,lerp(.5,.47,rd)*Hh,.6*Hh),.04*Hh);
  for(const s of[1,-1])HS.cut(ell(cx0-.05*Hh,chinY+ey*Hh,s*hw(ey),.085*Hh,.125*Hh,.2*Hh),.035*Hh);
  {const bX=cx0+hp(.17)[2]*Hh,bY=chinY+.17*Hh,eX=cx0-.1*Hh,eY=chinY+.32*Hh,l=Math.hypot(eX-bX,eY-bY);HS.cut(half(bX,bY,(eY-bY)/l,-(eX-bX)/l),.04*Hh);}
  return{hp,eyeY,eyeZ,hair:HS};
}
/* wrap the solid: a coarse pass for the body, finer passes for the head and hands, then the hair, then paint */
function finish(F,HD,rig,L,S,P,boxes,ext){
  const Hh=rig.Hh,chinY=rig.chinY,cx0=rig.headCx,A=newAcc(),hc=.14,m=.15,splitY=chinY-.02*Hh;
  const hb=[cx0-.68*Hh,rig.hbY,-.58*Hh,cx0+.8*Hh,chinY+1.17*Hh,.58*Hh,Hh*.019],fine=boxes.concat([hb]);
  const skip=(x,y,z)=>{for(const b of fine)if(x>b[0]+m&&x<b[3]-m&&y>b[1]+m&&y<b[4]-m&&z>b[2]+m&&z<b[5]-m)return true;return false;};
  P.nw=0;for(let x=-2.5;x<=2.5;x+=.1){let z=0;while(z<6&&F.d(x,P.ySide,z)<0)z+=.02;if(z>P.nw)P.nw=z;}      // real half width of the neck where the collar crosses its side
  const uv=(x,y,z,nx,cyc,o)=>{
    if(cyc>splitY){if(nx>-.35){o[0]=(420+z/Hh*400)/TEX;o[1]=1-(1940-(y-chinY)/Hh*400)/TEX;}else{o[0]=1000/TEX;o[1]=1-1750/TEX;}}
    else{o[0]=((nx>=0?512:1536)+z*P.sb)/TEX;o[1]=1-(1410-y*P.sb)/TEX;}
  };
  const sink=(x,y,z)=>{let o=0;for(const b of fine){const dp=Math.min(x-b[0],b[3]-x,y-b[1],b[4]-y,z-b[2],b[5]-z)-b[6]*1.5;if(dp>0)o=Math.max(o,Math.min(.045,dp*.6));}return o;};
  polygonize(F,[ext[0],-.3,ext[1],ext[2],hb[1]+3*hc,-ext[1]],hc,skip,uv,A,sink);
  for(const b of fine)polygonize(F,b,b[6],null,uv,A);
  polygonize(HD.hair,hb,hb[6],null,(x,y,z,nx,cyc,o)=>{o[0]=1300/TEX;o[1]=1-1750/TEX;},A);
  return{geo:accGeo(A),rig,tex:figTexture(L,P,S.head,HD),tris:A.pos.length/9,F};
}

/* ---- family 1: human proportions, in head units ---- */
function sculptAnat(S,L){
  const K=BONE,T0=20,Hh=T0/S.heads,B=(T0-Hh)/6.5,HF=3.95,legK=S.legK||1,armK=S.armK||1,hipY=HF*B*legK,chinY=T0-Hh,soft=S.soft||0;
  const Y=f=>f>=HF?hipY+(f-HF)/(6.5-HF)*(chinY-hipY):f/HF*hipY;
  const wC=S.wChest,wW=S.wWaist,wH=S.wHip,dK=S.depth||1,nK=S.neck||1,nn=n=>lerp(n,2.1,soft),headCx=.1*B;
  /* arm: height against radius. It starts inside the shoulder and must hang clear of the trunk below the sleeve. */
  const AP=[[6.31,.05],[6.27,.15],[6.15,.225],[5.95,.235],[5.7,.22],[5.3,.2],[5.02,.178],[4.8,.17],[4.68,.168],[4.52,.186],[4.3,.184],[3.95,.156],[3.7,.128],[3.55,.118],[3.47,.09]];
  const aR=f=>{const up=f>4.74,th=up?S.thArm:S.thFore;let r=tabS(AP,f)[1]*th;if(f<6.1)r=lerp(r,(up?.205:.165)*th,soft*.6);return r*B;};
  const trunkW=Math.max(.72*wH,.745*wC)*B,sh=Math.max((.98*S.wSh+.03)*B,trunkW+aR(5.3)*1.05+.06*B),wS=sh/B,shY=Y(6.15),hz=.36*wH*B;
  /* torso: height, centre x, front, back, half width, boxiness. The last row is the neck running up into the skull. */
  const TP=[[3.58,0,.16,.2,.2,2],[3.68,0,.33*dK,.38*dK,.5*wH,nn(2.2)],[3.95,0,.4*dK,.47*dK,.72*wH,nn(2.3)],[4.25,0,.41*dK,.43*dK,.68*wH,nn(2.3)],[4.55,.02,.39*dK,.36*dK,.58*wW,nn(2.2)],
    [4.95,.03,.43*dK,.4*dK,.64*wC,nn(2.3)],[5.4,.04,.5*dK,.43*dK,.73*wC,nn(2.4)],[5.75,.03,.49*dK,.46*dK,.79*wC,nn(2.4)],[5.98,.02,.46*dK,.46*dK,.77*wC,nn(2.3)],
    [6.15,0,.4*dK,.43*dK,.67*wC,2.2],[6.27,-.01,.33*dK,.38*dK,.52*wC,2.1],[6.38,-.03,.27*nK,.32*nK,.38*nK,2],[6.47,-.03,.25*nK,.27*nK,.3*nK,2],[6.6,0,.225*nK,.235*nK,.235*nK,2]]
    .map(r=>[Y(r[0]),r[1]*B,r[2]*B,r[3]*B,r[4]*B,r[5]]);
  TP.push([chinY+.34*Hh,headCx-.07*Hh,.2*B*nK,.2*B*nK,.2*B*nK,2]);
  const F=new Solid(),yA=Y(4.3),yB=Y(4.95),yN=Y(6.42);
  F.add(loft('y',TP,0),0,(x,y)=>y<yB?[K.hips,K.chest,sstep(yA,yB,y)]:[K.chest,K.head,sstep(yN,chinY+.28*Hh,y)*.85]);
  for(const s of[1,-1])F.add(cone(-.04*B,Y(6.41),s*.2*B,-.01*B,shY+.01*B,s*(sh-.03*B),.25*B*nK,.215*B*S.thArm),.22*B,K.chest);
  const HD=sculptHead(F,S.head,Hh,chinY,headCx,K);
  const la=1.47*B*armK,lf=1.13*B*armK,rig={hips:[0,Y(4.15)],chest:[0,Y(4.6)],sh,shY,la,lf,hz,hipY:Y(HF),lt:Y(HF)-Y(2.1),B,Hh,chinY,headCx,headPivot:[headCx-.06*Hh,chinY+.1*Hh],hand:{},front:0,hbY:chinY-.09};
  const aY=f=>shY-(6.15-f)*B*armK,kS=.3*B,kH=.2*B,yP0=Y(5.45),yP1=Y(5.95),yC0=Y(3.4),yC1=Y(3.75),U=B*S.hand,Lh=.74*U,Wh=.185*U,Th=.092*U,wy=aY(3.55),ft=S.foot*B,boxes=[];
  const LP=[[4.12,.1,.1,0],[4,.33,.28,0],[3.8,.36,.31,0],[3.6,.375,.345,0],[3.3,.345,.31,.01],[2.85,.295,.265,.02],[2.4,.25,.228,.02],[2.15,.232,.218,.03],[2.02,.225,.212,.02],[1.75,.235,.215,-.03],[1.5,.245,.22,-.05],[1.1,.2,.185,-.02],[.6,.17,.16,0],[.3,.165,.155,0]];
  const FP=[[-.3,.13,.05,.07,.06],[-.26,.15,.15,.15,.14],[-.1,.17,.2,.17,.17],[.12,.165,.19,.165,.185],[.38,.13,.13,.13,.195],[.6,.1,.1,.1,.18],[.76,.085,.07,.085,.12],[.81,.07,.03,.05,.05]];
  for(const s of[1,-1]){
    const Lf=s<0,bn=handBones(K,Lf),sB=Lf?K.sL:K.sR,tB=Lf?K.hL:K.hR,kB=Lf?K.kL:K.kR,zs=s*sh,zl=s*hz;
    F.add(loft('y',AP.map(r=>{const q=aR(r[0]);return[aY(r[0]),0,q*1.05,q*1.05,q*.97,2];}),zs),(x,y)=>kS*sstep(yP0,yP1,y),(x,y)=>[sB,bn.e,1-sstep(aY(4.42),aY(4.96),y)]);
    mitt(F,s,wy,zs,[aR(3.55)*1.05,aR(3.55)*.97],Lh,Wh,Th,bn,rig.hand,0);
    boxes.push([-.85*Wh-.32,wy-Lh-.32,zs-Th-.32,1.98*Wh+.32,wy+.45,zs+Th+.32,Wh*.11]);
    F.add(loft('y',LP.map(p=>{const t=S.thLeg*B;let rx=p[1]*t,rz=p[2]*t;if(p[0]<3.7){const mm=(p[0]>2.1?.27:.2)*t;rx=lerp(rx,mm*1.04,soft*.55);rz=lerp(rz,mm*.96,soft*.55);}return[Y(p[0]),p[3]*B*(1-soft),rx,rx,rz,2];}),zl),
      (x,y)=>kH*sstep(yC0,yC1,y),(x,y)=>[tB,kB,1-sstep(Y(1.85),Y(2.4),y)]);
    F.add(loft('x',FP.map(p=>[p[0]*ft,p[1]*ft,p[2]*ft,p[3]*ft,p[4]*ft,2.4]),zl),.14,kB);
  }
  const P={sb:80,zDiv:trunkW+.03*B,hem:Y(3.8),ySide:Y(6.43),yFront:Y(6.31),rib:.024*B,stripe:[Y(5.2),Y(5.44)],sleeve:aY(5.3),sleeveTrim:.075*B,shoeTop:1.05,cuff:1.05,sole:.24,top:chinY+.2};
  return finish(F,HD,rig,L,S,P,boxes,[-2.4,-(sh+1.3),3.2]);
}

/* ---- family 2: the Full Spectrum trooper body. Model units, 20 tall. ---- */
function sculptTroop(S,L){
  const K=BONE,B=3.03,Hh=5.3,chinY=14.62,headCx=.12,shY=12.75,sh=4.4,la=3.2,lf=3,hz=1.55,F=new Solid();
  // barrel torso: height, half depth, half width. The top rows are the neck.
  const TP=[[5.5,.8,.9],[5.72,2.05,2.3],[6.2,2.5,2.8],[7.5,2.66,2.96],[10,2.8,3.1],[12.2,2.92,3.25],[13.5,2.84,3.16],[14.2,2.55,2.84],[14.62,1.95,2.12],[14.95,1.42,1.48],[15.4,1.22,1.24],[16.5,1.15,1.15]].map(r=>[r[0],0,r[1],r[1],r[2],2.12]);
  F.add(loft('y',TP,0),0,(x,y)=>y<9.8?[K.hips,K.chest,sstep(7.4,9.8,y)]:[K.chest,K.head,sstep(14.7,16,y)*.85]);
  const HD=sculptHead(F,S.head,Hh,chinY,headCx,K);
  const rig={hips:[0,6.4],chest:[0,8.6],sh,shY,la,lf,hz,hipY:6,lt:2.7,B,Hh,chinY,headCx,headPivot:[headCx-.06*Hh,chinY+.1*Hh],hand:{},front:4.1,hbY:chinY+.2},wy=shY-la-lf,boxes=[];
  if(S.column){const CP=[[6.3,1.4],[5.9,2.5],[5.2,2.66],[3,2.6],[1.2,2.52],[.5,2.5],[.14,2.36],[0,1.9]];F.add(loft('y',CP.map(r=>[r[0],0,r[1]*.92,r[1]*.92,r[1],2.12]),0),.4,K.hips);}
  for(const s of[1,-1]){
    const Lf=s<0,bn=handBones(K,Lf),sB=Lf?K.sL:K.sR,tB=Lf?K.hL:K.hR,kB=Lf?K.kL:K.kR,zs=s*sh,zl=s*hz;
    if(!S.float){const AR=[[-.97,.04],[-.9,.36],[-.72,.69],[-.3,.94],[0,.99],[1.6,.97],[3.2,.93],[4.8,.86],[6.2,.8],[6.45,.6]];
      F.add(loft('y',AR.map(r=>[shY-r[0],0,r[1],r[1],r[1],2]),zs),(x,y)=>.95*sstep(10.4,11.9,y),(x,y)=>[sB,bn.e,1-sstep(shY-la-.6,shY-la+.6,y)]);}
    mitt(F,s,wy,zs,[.8,.8],1.75,.82,.62,bn,rig.hand,S.float);
    boxes.push([-1.02,wy-2.07,zs-.94,1.95,wy+.5,zs+.94,.09]);
    if(!S.column){
      const LG=[[6.7,.5],[6.4,1.15],[5.9,1.4],[4.5,1.44],[3.3,1.4],[2,1.32],[1.05,1.28],[.7,1.26]];
      F.add(loft('y',LG.map(r=>[r[0],0,r[1],r[1],r[1],2]),zl),(x,y)=>.6*sstep(4.3,5.3,y),(x,y)=>[tB,kB,1-sstep(2.7,3.9,y)]);
      const FT=[[-1.5,.75,.3,.45,.5],[-1.25,.85,.75,.8,1.15],[-.5,.9,.88,.86,1.34],[.5,.86,.84,.82,1.38],[1.5,.7,.66,.66,1.3],[2.25,.55,.45,.5,1],[2.6,.45,.2,.3,.4]];
      F.add(loft('x',FT.map(p=>[p[0],p[1],p[2],p[3],p[4],2.3]),zl),.2,kB);
    }
  }
  const P={sb:80,zDiv:3.34,hem:7.1,ySide:14.48,yFront:14.12,rib:.09,stripe:[11.2,12.5],sleeve:11.2,sleeveTrim:.5,shoeTop:S.column?1.05:1.2,cuff:0,sole:.24,top:14.9};
  return finish(F,HD,rig,L,S,P,boxes,[-3.4,-(sh+1.4),3.6]);
}

/* ---- put one together ---- */
function makeFig(sp){
  const S=sp.style||STYLES[0],L=Object.assign({},LOOK,S.look||{},sp.look||{}),t0=performance.now();
  const body=(S.family==='troop'?sculptTroop:sculptAnat)(S,L),r=body.rig,mat=new T.MeshStandardMaterial({map:body.tex,skinning:true,roughness:.8,metalness:0});
  const f={sp,S,mat,g:new T.Group(),j:{},cur:{},tgt:{},ph:0,seed:3.3,weap:{},wname:null,two:0,gR:.1,gL:.1,rig:r,tris:body.tris,F:body.F};
  for(const k of PK){f.cur[k]=0;f.tgt[k]=0;}
  const J=f.j,bones=[],hn=r.hand;
  f.scale=(sp.h||1)*.975;f.g.scale.setScalar(f.scale);
  const bone=(name,par,x,y,z)=>{const b=new T.Bone();b.position.set(x,y,z);if(par)par.add(b);J[name]=b;bones[BONE[name]]=b;return b;};
  bone('body',null,0,0,0);bone('hips',J.body,0,r.hips[1],0);bone('chest',J.hips,0,r.chest[1]-r.hips[1],0);
  bone('head',J.chest,r.headPivot[0],r.headPivot[1]-r.chest[1],0);
  bone('sL',J.chest,0,r.shY-r.chest[1],-r.sh);bone('eL',J.sL,0,-r.la,0);bone('haL',J.eL,0,-r.lf,0);
  bone('sR',J.chest,0,r.shY-r.chest[1],r.sh);bone('eR',J.sR,0,-r.la,0);bone('haR',J.eR,0,-r.lf,0);
  bone('hL',J.hips,0,r.hipY-r.hips[1],-r.hz);bone('kL',J.hL,0,-r.lt,0);bone('hR',J.hips,0,r.hipY-r.hips[1],r.hz);bone('kR',J.hR,0,-r.lt,0);
  for(const[x,s]of[['L',-1],['R',1]]){bone('fa'+x,J['ha'+x],hn.fa[0],hn.fa[1],0);bone('fb'+x,J['fa'+x],0,hn.fbDy,0);bone('th'+x,J['ha'+x],hn.th[0],hn.th[1],-s*hn.th[2]);}
  J.handR=J.haR;J.body.updateMatrixWorld(true);
  f.grip={x:hn.grip.x,y:hn.grip.y,z:hn.grip.z,gap:hn.gap};
  f.reach=clamp((r.la+r.lf)/(2.6*r.B),.55,1);
  const d0=new T.Vector3(hn.d0[0],hn.d0[1],0).normalize();
  f.thQ={R:new T.Quaternion().setFromUnitVectors(d0,new T.Vector3(-.72,-.34,-.6).normalize()),L:new T.Quaternion().setFromUnitVectors(d0,new T.Vector3(-.72,-.34,.6).normalize())};
  const mesh=new T.SkinnedMesh(body.geo,mat);mesh.castShadow=mesh.receiveShadow=true;mesh.frustumCulled=false;
  f.skel=new T.Skeleton(bones);mesh.add(J.body);mesh.bind(f.skel);f.g.add(mesh);f.mesh=mesh;
  f.ms=performance.now()-t0;
  scene.add(f.g);return f;
}
/* the Full Spectrum trooper exactly as it is in warehouse-yard.html, for comparison */
function makeTrooperRef(){
  const g=new T.Group(),cloth=new T.MeshStandardMaterial({color:0x485a5f,roughness:.9}),gear=new T.MeshStandardMaterial({color:0x262d30,roughness:.75}),band=new T.MeshStandardMaterial({color:0x5ec8ff,emissive:0x5ec8ff,emissiveIntensity:.5,roughness:.6});
  for(const[geo,mat,x,y,z]of[[new T.CylinderGeometry(2.5,2.3,6,8),gear,0,3,0],[new T.CylinderGeometry(3.3,2.9,8,8),cloth,0,10,0],[new T.CylinderGeometry(3.45,3.45,1.8,8),band,0,12.3,0],[new T.SphereGeometry(2.3,10,8),gear,.3,16.2,0],
    [new T.SphereGeometry(2.8,10,6,0,TAU,0,PI/2),gear,.2,16.6,0],[new T.BoxGeometry(3,5.5,5),gear,-3.5,10.5,0],[new T.BoxGeometry(11,1.3,1.4),gear,5,11.5,2.2]]){const m=new T.Mesh(geo,mat);m.position.set(x,y,z);m.castShadow=true;g.add(m);}
  scene.add(g);return g;
}
/* a bat turned on a lathe, to real size */
function batGeo(){
  const pts=[[0,0],[.25,.03],[.27,.14],[.17,.24],[.155,.6],[.155,2.9],[.19,3.8],[.27,5.1],[.37,6.4],[.42,7.6],[.42,9],[.37,9.3],[0,9.4]].map(p=>new T.Vector2(p[0],p[1]));
  const g=new T.LatheGeometry(pts,24),p=g.attributes.position,k=new Float32Array(p.count*3),c=new T.Color();
  for(let i=0;i<p.count;i++){lin(p.getY(i)>.25&&p.getY(i)<2.95?0x1b1b1f:0xc49c6a,c);k[i*3]=c.r;k[i*3+1]=c.g;k[i*3+2]=c.b;}
  g.setAttribute('color',new T.BufferAttribute(k,3));g.rotateZ(-PI/2);g.computeVertexNormals();return g;
}
const WEAP={bat:{geo:batGeo,two:1}};
function setWeapon(f,name){
  if(f.wname===name)return;f.wname=name;
  for(const k in f.weap)f.weap[k].visible=false;
  if(!name||!WEAP[name])return;
  if(!f.weap[name]){
    // big-handed bodies get a bigger bat, so there is always room on the handle for two hands
    const W=WEAP[name],m=new T.Mesh(W.geo(),vmat({roughness:.55})),G=f.grip,ws=Math.max(f.rig.B/2.63,(2*G.gap+.1)/2.7),hold=.27*ws+G.gap*1.5+.08;m.castShadow=true;
    m.scale.setScalar(ws);m.position.set(G.x-hold,G.y,-G.z);f.j.haR.add(m);f.weap[name]=m;
  }
  f.weap[name].visible=true;
}

/* ---- two hands on one handle: the swing is a grip position and a bat direction in the chest's space; both arms are solved to it ---- */
const SW={
  ready:{p:[.7,1.02,.34],b:[-.28,.93,.22],tw:0,ln:0,by:0},
  h:[{p:[.62,1.42,.6],b:[-.72,.62,.3],tw:-.8,ln:.04,by:0},{p:[.88,1.2,.42],b:[.1,.22,.97],tw:-.2,ln:-.08,by:0},{p:[1.05,1,-.12],b:[.86,.02,-.5],tw:.55,ln:-.2,by:-.3},{p:[.5,1.3,-.9],b:[-.45,.5,-.74],tw:1,ln:-.12,by:0}],
  v:[{p:[.5,2.25,.2],b:[-.7,.7,.12],tw:0,ln:.25,by:.3},{p:[.75,1.9,.1],b:[.35,.93,.05],tw:0,ln:.05,by:0},{p:[1.1,.78,0],b:[.9,-.42,0],tw:0,ln:-.5,by:-1.2},{p:[.92,.5,0],b:[.78,-.62,0],tw:0,ln:-.55,by:-1.4}],
};
const SWT=[.22,.34,.46,.62,1];
function swingAt(atk){
  const k=clamp(atk.t/atk.dur,0,1),K=atk.type===2?SW.v:SW.h,seq=[SW.ready,K[0],K[1],K[2],K[3],SW.ready];
  let i=0;while(i<4&&k>SWT[i])i++;
  const t0=i?SWT[i-1]:0,u=(k-t0)/(SWT[i]-t0),t=i===0?ease(u):i===4?ease(u):i<3?Math.pow(u,i===1?1.5:1):1-Math.pow(1-u,1.6),m=atk.type===1?-1:1;
  return{A:seq[i],B:seq[i+1],t,ma:i===0?1:m,mb:i===4?1:m};
}
const _gp=new T.Vector3(),_gb=new T.Vector3(),_P=new T.Vector3(),_Pl=new T.Vector3(),_Wr=new T.Vector3(),_b=new T.Vector3(),_y=new T.Vector3(),_z=new T.Vector3(),_t=new T.Vector3(),_tn=new T.Vector3(),_w0=new T.Vector3(),_el=new T.Vector3(),_pp=new T.Vector3(),_cr=new T.Vector3();
const _qc=new T.Quaternion(),_qh=new T.Quaternion(),_qa=new T.Quaternion(),_qs=new T.Quaternion(),_qe=new T.Quaternion(),_mb=new T.Matrix4();
function armIK(f,s,W,w){
  const J=f.j,sB=s>0?J.sR:J.sL,eB=s>0?J.eR:J.eL,la=f.rig.la,lf=f.rig.lf;
  _t.copy(W);J.chest.worldToLocal(_t);_t.sub(sB.position);
  const d=clamp(_t.length(),Math.abs(la-lf)+.02,la+lf-.02),phi=PI-Math.acos(clamp((la*la+lf*lf-d*d)/(2*la*lf),-1,1));
  _w0.set(lf*Math.sin(phi),-la-lf*Math.cos(phi),0).normalize();_tn.copy(_t).normalize();
  _qa.setFromUnitVectors(_w0,_tn);
  _el.set(0,-1,0).applyQuaternion(_qa);_el.addScaledVector(_tn,-_el.dot(_tn));
  _pp.set(-.15,-1,s*.5);_pp.addScaledVector(_tn,-_pp.dot(_tn));
  if(_el.lengthSq()>1e-6&&_pp.lengthSq()>1e-6){_qs.setFromAxisAngle(_tn,Math.atan2(_cr.crossVectors(_el,_pp).dot(_tn),_el.dot(_pp)));_qa.premultiply(_qs);}
  sB.quaternion.slerp(_qa,w);eB.rotation.set(0,0,lerp(eB.rotation.z,phi,w));
  sB.updateMatrixWorld(true);
}
function handFrame(f,s,b,P,out){
  const J=f.j,B=f.rig.B;_y.set(-.45*B,.65*B,s*1.05*B);J.chest.localToWorld(_y);_y.sub(P);
  _y.addScaledVector(b,-_y.dot(b));if(_y.lengthSq()<1e-6)_y.set(0,1,0);_y.normalize();
  _z.crossVectors(b,_y);out.setFromRotationMatrix(_mb.makeBasis(b,_y,_z));
}
function setHand(f,s,Qh,w){
  const J=f.j,eB=s>0?J.eR:J.eL,hB=s>0?J.haR:J.haL;
  eB.getWorldQuaternion(_qe);_qe.invert().multiply(Qh);hB.quaternion.slerp(_qe,w);hB.updateMatrixWorld(true);
}
function twoHand(f,u,w){
  const J=f.j,B=f.rig.B,sc=f.scale,G=f.grip,rk=f.reach;
  if(u.atk){const k=swingAt(u.atk);_gp.set(lerp(k.A.p[0],k.B.p[0],k.t),lerp(k.A.p[1],k.B.p[1],k.t),lerp(k.A.p[2]*k.ma,k.B.p[2]*k.mb,k.t));_gb.set(lerp(k.A.b[0],k.B.b[0],k.t),lerp(k.A.b[1],k.B.b[1],k.t),lerp(k.A.b[2]*k.ma,k.B.b[2]*k.mb,k.t)).normalize();}
  else{_gp.fromArray(SW.ready.p);_gb.fromArray(SW.ready.b).normalize();}
  // short-armed bodies keep the same swing pulled in toward the shoulders, and never put their hands inside a barrel chest
  _P.set(_gp.x*rk,1.55+(_gp.y-1.55)*rk,_gp.z*rk).multiplyScalar(B);if(f.rig.front)_P.x=Math.max(_P.x,f.rig.front);
  J.chest.localToWorld(_P);
  J.chest.getWorldQuaternion(_qc);_b.copy(_gb).applyQuaternion(_qc).normalize();
  _P.addScaledVector(_b,G.gap*.5*sc);handFrame(f,1,_b,_P,_qh);
  _Wr.set(G.x,G.y,-G.z).multiplyScalar(sc).applyQuaternion(_qh);_Wr.subVectors(_P,_Wr);
  armIK(f,1,_Wr,w);setHand(f,1,_qh,w);
  _Pl.set(G.x-G.gap,G.y,-G.z);J.haR.localToWorld(_Pl);_b.set(1,0,0).transformDirection(J.haR.matrixWorld);
  handFrame(f,-1,_b,_Pl,_qh);
  _Wr.set(G.x,G.y,G.z).multiplyScalar(sc).applyQuaternion(_qh);_Wr.subVectors(_Pl,_Wr);
  armIK(f,-1,_Wr,w);setHand(f,-1,_qh,w);
}

/* ---- animation ---- */
function figAnim(f,u,dt,now){
  const p=f.tgt,J=f.j,S=f.S,bk=f.rig.B/2.6;for(const k of PK)p[k]=0;
  f.g.position.set(u.x,0,u.y);f.g.rotation.set(0,-u.ang,0);
  const sp=u.spd||0;let rate=22;
  f.ph+=sp*dt*.15;
  const s=Math.sin(f.ph),c=Math.cos(f.ph),A=clamp(sp/52,0,1),run=clamp((sp-30)/30,0,1);
  p.hL=s*(.62+.3*run)*A;p.hR=-s*(.62+.3*run)*A;p.kL=-(Math.max(0,c)*(.9+.45*run)+.1)*A;p.kR=-(Math.max(0,-c)*(.9+.45*run)+.1)*A;
  p.sLz=-s*(.5+.4*run)*A+.03;p.sRz=s*(.5+.4*run)*A+.03;p.sLx=.07;p.sRx=-.07;p.eL=p.eR=.18+(.3+.5*run)*A;p.lean=-(.07+.14*run)*A;
  p.by=(Math.abs(c)*(.45+.45*run)*A-.2*A+Math.sin(now*2+f.seed)*.07*(1-A))*bk;p.twist=s*.12*A;
  if(S.column){p.by=Math.abs(Math.sin(f.ph))*(1.3+.9*run)*A;p.lean=-(.12+.2*run)*A;p.br=s*.1*A;p.twist=0;}      // the pawn hops
  if(A<.1)p.hy=Math.sin(now*.7+f.seed)*.2;
  const armed=!!f.wname,twoW=armed&&WEAP[f.wname].two;
  if(armed){p.sRz=.2+s*.15*A;p.sRx=-.14;p.eR=1.95;p.wR=.15;}
  if(u.atk){
    rate=40;
    if(twoW){const k=swingAt(u.atk),m=u.atk.type===1?-1:1,st=sstep(.3,.46,u.atk.t/u.atk.dur)*(1-sstep(.62,.95,u.atk.t/u.atk.dur));
      p.twist=lerp(k.A.tw*(k.A===SW.ready?1:m),k.B.tw*(k.B===SW.ready?1:m),k.t);p.lean=lerp(k.A.ln,k.B.ln,k.t);p.by=lerp(k.A.by,k.B.by,k.t)*bk;
      p.hy=-p.twist*.55;p.hL=.5*st*m;p.hR=-.42*st*m;p.kL=-.3*st;p.kR=-.3*st;}
    else{const k=u.atk.t/u.atk.dur,R=u.atk.type!==1,a=Math.sin(Math.min(1,k/.45)*PI);p[R?'sRz':'sLz']=.4+1.2*a;p[R?'eR':'eL']=1.4-1.3*a;p.twist=(R?1:-1)*.5*a;p[R?'sLz':'sRz']=.5;p[R?'eL':'eR']=1.6;p.lean=-.18;p.hL=.4;p.hR=-.3;}
  }
  const k=1-Math.exp(-rate*dt),cu=f.cur;
  for(const key of PK)cu[key]+=(p[key]-cu[key])*k;
  J.body.position.y=cu.by;J.body.rotation.x=cu.br;
  J.chest.rotation.set(0,cu.twist,cu.lean);J.head.rotation.set(0,cu.hy,cu.hz);
  J.sL.rotation.set(cu.sLx,0,cu.sLz);J.sR.rotation.set(cu.sRx,0,cu.sRz);J.eL.rotation.set(0,0,cu.eL);J.eR.rotation.set(0,0,cu.eR);
  J.haR.rotation.set(0,0,cu.wR);J.haL.rotation.set(0,0,0);
  J.hL.rotation.z=cu.hL;J.hR.rotation.z=cu.hR;J.kL.rotation.z=cu.kL;J.kR.rotation.z=cu.kR;
  f.two=damp(f.two,twoW&&(u.atk||u.ready)?1:0,u.atk?30:9,dt);
  if(f.two>.003){f.g.updateMatrixWorld(true);twoHand(f,u,ease(f.two));}
  const fistR=armed||(u.atk&&!armed)?1:.08,fistL=Math.max(f.two,u.atk&&!armed?1:0,.08);
  f.gR=damp(f.gR,fistR,16,dt);f.gL=damp(f.gL,fistL,16,dt);
  J.faR.rotation.x=.12+1.36*f.gR;J.fbR.rotation.x=.2+1.5*f.gR;J.thR.quaternion.identity().slerp(f.thQ.R,f.gR);
  J.faL.rotation.x=-(.12+1.36*f.gL);J.fbL.rotation.x=-(.2+1.5*f.gL);J.thL.quaternion.identity().slerp(f.thQ.L,f.gL);
}
