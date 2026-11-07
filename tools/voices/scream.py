"""Turn a shouted take into a scream (Bryan: "scream it, not say it loudly, but scream it"). Zonos shouts, it doesn't scream:
its takes of "What the hell was that?!" came out at a man's speaking pitch (95-155 Hz) in under a second. With the WORLD
vocoder (pyworld) each take is pulled apart into pitch, spectral envelope and breath, and put back together as a scream:
the pitch raised into a scream's range (rising through the line, highest on the last word, with a waver and the odd crack),
the last word drawn out, the throat strained (more breath and rasp, the mouth opened wider: the formants a little higher,
the upper mids pushed, the lows thinned), then driven. His own formants stay under it, so it's still his voice.
  python scream.py IN.wav OUT.wav [target_hz] [seed]
needs: pip install pyworld soundfile scipy numpy "setuptools<81" (pyworld 0.3.5 imports pkg_resources)"""
import sys,numpy as np,soundfile as sf,pyworld as pw
from scipy.signal import butter,sosfilt
IN,OUT=sys.argv[1],sys.argv[2];TARGET=float(sys.argv[3]) if len(sys.argv)>3 else 330.;SEED=int(sys.argv[4]) if len(sys.argv)>4 else 1
rng=np.random.default_rng(SEED);FP=5.   # (frame period, ms)
x,sr=sf.read(IN,dtype='float64')
if x.ndim>1:x=x.mean(1)
f0,t=pw.harvest(x,sr,f0_floor=60,f0_ceil=900,frame_period=FP);sp=pw.cheaptrick(x,f0,t,sr);ap=pw.d4c(x,f0,t,sr)
v=f0>0;idx=np.flatnonzero(v)
if not len(idx):sys.exit('no voice found in '+IN)
# the last voiced run is the last word ("that"): draw it out
runs=np.split(idx,np.flatnonzero(np.diff(idx)>3)+1);last=runs[-1];a,b=last[0],last[-1]+1
STRETCH=1.7;seg=np.arange(a,b);n2=int(len(seg)*STRETCH)
src=np.concatenate([np.arange(a),np.interp(np.arange(n2),[0,n2-1],[a,b-1]),np.arange(b,len(f0))])
def take(M,s):i0=np.floor(s).astype(int);i1=np.minimum(i0+1,len(M)-1);w=(s-i0)[:,None] if M.ndim>1 else s-i0;return M[i0]*(1-w)+M[i1]*w
f0n=take(f0,src);spn=take(sp,src);apn=take(ap,src);vn=take(v.astype(float),src)>.5;f0n[~vn]=0
N=len(f0n);nv=np.flatnonzero(vn);la,lb=a,a+n2   # (the drawn-out word's frames, after the stretch)
# the pitch: his own rise and fall kept but squeezed, lifted into a scream; climbing to the last word, which peaks and breaks
med=np.median(f0[v]);p=np.clip((np.arange(N)-nv[0])/max(1,lb-nv[0]),0,1)
shape=(f0n/med).clip(.5,2)**.45*(.80+.26*p**1.4)
q=np.clip((np.arange(N)-la)/max(1,lb-la),0,1);arc=np.where((np.arange(N)>=la)&(np.arange(N)<lb),1+.16*np.sin(np.pi*np.minimum(1,q*1.25))-.10*q**3,1)
tt=np.arange(N)*FP/1000;wav=1+.045*np.sin(2*np.pi*6.2*tt+rng.uniform(0,6))+.02*rng.standard_normal(N)   # (a waver, and jitter)
f0s=TARGET*shape*arc*wav
for _ in range(2):   # a crack or two: the voice flips up for a few frames
    if len(nv)>40:c=rng.choice(nv[len(nv)//3:]);f0s[c:c+rng.integers(4,9)]*=1.22
f0s[~vn]=0
# the throat: the formants up a little (the jaw wide open), the upper mids pushed, the lows thinner, more breath and rasp
fr=np.linspace(0,sr/2,sp.shape[1]);W=1.07
spw=np.stack([np.interp(fr/W,fr,r) for r in spn])
tilt=10**((5*np.exp(-((fr-2600)/1300)**2)-6*np.exp(-(fr/260)**2))/10);spw*=tilt[None,:]   # (a power spectrum: 10^(dB/10))
apn=np.clip(apn**.75+.04,0,1)
y=pw.synthesize(np.ascontiguousarray(f0s),np.ascontiguousarray(spw),np.ascontiguousarray(apn),sr,FP)
# shimmer, drive, a touch of brightness, level
sh=sosfilt(butter(2,28,'low',fs=sr,output='sos'),rng.standard_normal(len(y)));y*=1+.9*sh/np.abs(sh).max()*.12
y/=np.abs(y).max()+1e-9;K=2.6;y=np.tanh(K*y)/np.tanh(K)
y=y+.35*sosfilt(butter(2,2200,'high',fs=sr,output='sos'),y);y*=.89/np.abs(y).max()
fade=int(sr*.02);y[-fade:]*=np.linspace(1,0,fade)
sf.write(OUT,y.astype(np.float32),sr)
print(OUT.split('/')[-1],f'{len(x)/sr:.2f}s -> {len(y)/sr:.2f}s, pitch {med:.0f} -> {np.median(f0s[f0s>0]):.0f} Hz (top {np.percentile(f0s[f0s>0],95):.0f})')
