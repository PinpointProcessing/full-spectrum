"use strict";
/* Run drafts (Bryan, after v117: "The units run on the bridge pretty awkwardly. There legs move but the upper part of their body is
   stiff."). Loaded into the game page by run.js. Why it looks stiff now (figure.js): while running, the hips' bob and twist are part
   of the pose that figAnimate eases the torso toward (P.rate 16 a second), and at four steps a second that easing takes about half of
   the bob away and puts it late; the chest turns back almost all of the hips' twist (chestE[1] = -0.8 of it), so the shoulders hardly
   move; the rifle is fixed to the chest with both hands on it, so the arms don't move either. Only the legs do.
   RUN.opt picks what's drawn:
   - 'now': the game as it is;
   - 'A' (combat run): both hands on the rifle, carried lower, and the body works: the hips drop at each footfall and rise in the
     stride, they twist with the legs and the shoulders twist back the other way (so the rifle swings a little), the weight shifts over
     the foot that's down, the chest dips at each footfall, the rifle bounces, and the head stays steady and looks ahead;
   - 'B' (sprint): the same body, more of it, the rifle in his right hand down at his side swinging a little and his left arm pumping.
   The cyclic part goes on top of the eased pose each frame (and comes off again before the next), so nothing eases it away. Drawn
   only; nothing here changes the game until Bryan picks. */
const RUN={opt:'now',fill:null};
const RUN_K={   // per option: bob (how far the hips drop at a footfall), twist (the hips' turn), counter (the shoulders' turn back, of it), sway (weight over the foot), dip (the chest at a footfall), bounce (the rifle), lean
  A:{bob:1.15,twist:.24,counter:1.0,sway:.3,dip:.1,bounce:.45,lean:.3,roll:.07},
  B:{bob:1.35,twist:.28,counter:1.1,sway:.35,dip:.12,bounce:.3,lean:.38,roll:.08}};
const rdOn=(u,st,gait)=>RUN.opt!=='now'&&gait&&gait.run&&st==='base'&&u.side==='P'&&!(simT-(u.aimT||-9)<1.4||u.watch||u.supT);

// the pose under the cyclic part: no bob or twist of its own (they come on top, unsmoothed)
const rdPoseTorso0=poseTorso;
window.poseTorso=function(u,F,st,gait,P){
  rdPoseTorso0(u,F,st,gait,P);if(!rdOn(u,st,gait))return;
  const K=RUN_K[RUN.opt],G=P.gun;
  P.hipsP.set(0,gait.hip-K.bob*.35,0);P.hipsE[0]=P.hipsE[1]=0;P.chestE[1]=0;
  P.spineE[2]=-K.lean;P.chestE[2]=-.04;P.headE[2]=K.lean*.75;P.neckE[2]=.05;P.rate=16;
  if(RUN.opt==='A'){G.mode='chest';G.P.set(2.45,.05,.62);G.E[0]=-.18;G.E[1]=.3;G.E[2]=-.5;}   // lower than now: across his front, the muzzle down and out to the left
  else{G.mode='body';G.P.set(3.1,9.75,2.25);G.X.set(.9,-.44,.06).normalize();G.Y.set(.44,.9,0).normalize();}   // in his right hand at his side, the muzzle forward and down
};
// B: his left hand off the rifle, pumping (in time with the right leg, so against his own left leg)
const rdPoseLimbs0=poseLimbs;
window.poseLimbs=function(u,F,st,gait,P){
  rdPoseLimbs0(u,F,st,gait,P);if(RUN.opt!=='B'||!rdOn(u,st,gait))return;
  const a=Math.cos((F.phase+.09)*TAU2),sh=BW_P[7];
  P.hands[0]=P.handT[0].set(sh.x+.6+a*2.6,sh.y-4.1+Math.max(0,a)*1.6-Math.max(0,-a)*.3,sh.z+.75-Math.max(0,a)*.45);
  P.elbows[0].set(-1,-.35,-.45);F.hex[0].copy(P.hands[0]);
};
// the cyclic part: taken off before the pose eases (so it isn't eased away) and put on after
function rdRestore(F,B){const R=F.rd;if(!R||!R.on)return;
  B[1].position.copy(R.hp);B[1].quaternion.copy(R.hq);B[2].quaternion.copy(R.sq);B[3].quaternion.copy(R.cq);B[4].quaternion.copy(R.nq);B[5].quaternion.copy(R.headq);
  if(R.gon){B[20].position.copy(R.gp);B[20].quaternion.copy(R.gq);}R.on=R.gon=false;}
const _rq=new THREE.Quaternion(),_re=new THREE.Euler();
const rdTurn=(q,x,y,z)=>q.multiply(_rq.setFromEuler(_re.set(x,y,z,'YZX')));
function rdLayer(u,F,st,gait,B){
  const on=rdOn(u,st,gait),R=F.rd||(F.rd={hp:new THREE.Vector3(),hq:new THREE.Quaternion(),sq:new THREE.Quaternion(),cq:new THREE.Quaternion(),nq:new THREE.Quaternion(),headq:new THREE.Quaternion(),gp:new THREE.Vector3(),gq:new THREE.Quaternion(),w:0,on:false,gon:false});
  const dt=Math.max(0,Math.min(.1,simT-(R.t??simT)));R.t=simT;R.w+=((on?1:0)-R.w)*Math.min(1,dt*8);if(R.w<.01)return;
  R.hp.copy(B[1].position);R.hq.copy(B[1].quaternion);R.sq.copy(B[2].quaternion);R.cq.copy(B[3].quaternion);R.nq.copy(B[4].quaternion);R.headq.copy(B[5].quaternion);R.on=true;
  const K=RUN_K[RUN.opt]||RUN_K.A,w=R.w,ph=F.phase,TT=TAU2;
  const down=Math.cos((ph-.16)*TT*2);   // 1 with a foot under him (mid-stance: .16 the right, .66 the left), -1 in the air between
  const twist=Math.cos(ph*TT)*K.twist*w;   // + with his right leg out in front
  const shift=Math.cos((ph-.16)*TT)*K.sway*w;   // over the right foot while it's down, the left's after
  B[1].position.y-=K.bob*(down+1)*.5*w;B[1].position.z+=shift;
  rdTurn(B[1].quaternion,Math.cos((ph-.16)*TT)*K.roll*w,twist,0);   // the hips: turned with the legs, the free side dropping a little
  rdTurn(B[2].quaternion,0,-twist*.35,-K.dip*(down+1)*.5*w);   // the spine: bends a little forward at each footfall
  rdTurn(B[3].quaternion,-Math.cos((ph-.16)*TT)*K.roll*.6*w,-twist*(.65+K.counter),0);   // the shoulders: turned back the other way (counter: how far, against the hips' turn)
  rdTurn(B[4].quaternion,0,twist*K.counter*.5,K.dip*.4*(down+1)*.5*w);rdTurn(B[5].quaternion,0,twist*K.counter*.5,K.dip*.4*(down+1)*.5*w);   // the head: steady, looking ahead
  R.down=down;R.twist=twist;
}
function rdGun(u,F,st,gait,B){
  const R=F.rd;if(!R||!R.on||R.w<.01)return;const K=RUN_K[RUN.opt]||RUN_K.A,w=R.w,ph=F.phase;
  R.gp.copy(B[20].position);R.gq.copy(B[20].quaternion);R.gon=true;
  const lag=Math.cos((ph-.21)*TAU2*2);   // (a moment after the footfall: it's carried, so it catches up)
  B[20].position.y-=K.bounce*(lag+1)*.5*w;
  if(RUN.opt==='B'){const a=Math.cos((ph+.59)*TAU2);B[20].position.x+=a*.9*w;B[20].position.y+=Math.max(0,a)*.5*w;rdTurn(B[20].quaternion,0,0,a*.12*w);}   // his right arm swings it a little
  else rdTurn(B[20].quaternion,0,0,-.06*(lag+1)*.5*w);
}
{const src=figAnimate.toString(),need=['poseTorso(u,F,st,gait,P);','BW_P[0].set(0,0,0);','fkBone(B,20);'];
  for(const s of need)if(src.split(s).length!==2)throw new Error('run-page.js: figAnimate has changed ('+s+')');
  (0,eval)('window.figAnimate='+src.replace('poseTorso(u,F,st,gait,P);','rdRestore(F,B);poseTorso(u,F,st,gait,P);').replace('BW_P[0].set(0,0,0);','rdLayer(u,F,st,gait,B);BW_P[0].set(0,0,0);').replace('fkBone(B,20);','rdGun(u,F,st,gait,B);fkBone(B,20);'));}
