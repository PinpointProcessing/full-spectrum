"""The monsters' sounds (Bryan: "roars and screams, genuinely scary"): built from CC0 creature recordings on OpenGameArt by
layering two or three of them, slowing them down (bigger, deeper), driving them a little into distortion and giving them a
room, so they're our own. Adds these kinds to sounds/sfx (one mp3 per kind) and its manifest.json, leaving the others alone.

Sources (all CC0, unpacked each into its own folder under SRC; authors in sounds/CREDITS.md):
  rubberduck1/x  "80 CC0 creature SFX" (rubberduck)        rubberduck2/x  "80 CC0 creture SFX #2" (rubberduck)
  ogrebane1/x    "Monster Sound Effects Pack" (Ogrebane)   ogrebane2/x    "Monster Sound Effects 2" (Ogrebane)
  ogrebane3/x    "Monster Sound Pack, Volume 1" (Ogrebane) deeproar       "CC0 Deep Monster Roar" (trazzz123)
  snarls         "Monster snarls" (Darsycho)               alienscream    "Insect or alien scream" (qubodup)
  alienchirp     "Alien Sounds" (EZduzziteh)
plus the game's own sounds/boom-1.wav for the boss's slam.
  python build_monsters.py <SRC> ../../sounds/sfx      (numpy, scipy, soundfile, lameenc; ffmpeg on the path)"""
import sys,os,json,subprocess,numpy as np,lameenc
from scipy.signal import butter,lfilter,fftconvolve
SRC,OUT=sys.argv[1],sys.argv[2];SR=44100;rng=np.random.default_rng(7)
REPO=os.path.abspath(os.path.join(os.path.dirname(__file__),'..','..'))
def load(p,s=0,d=None):
    f=p if os.path.isabs(p) else os.path.join(SRC,p)
    a=np.frombuffer(subprocess.run(['ffmpeg','-v','error','-i',f,'-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout,dtype=np.float32)
    return a[int(s*SR):(int((s+d)*SR) if d else None)].copy()
def vari(a,f):   # slower and lower together (a bigger throat), like a tape slowed down
    n=int(len(a)/f);return np.interp(np.arange(n)*f,np.arange(len(a)),a).astype(np.float32)
def filt(a,kind,hz,order=2):b,c=butter(order,hz/(SR/2),kind);return lfilter(b,c,a).astype(np.float32)
def sat(a,drive):return (np.tanh(a/ (np.abs(a).max() or 1)*drive)/np.tanh(drive)).astype(np.float32)
def room(a,t60,mix):   # a dark room: decaying noise for the tail
    n=int(t60*SR);ir=(rng.standard_normal(n)*np.exp(-6.9*np.arange(n)/n)).astype(np.float32);ir=filt(ir,'low',3500);ir/=np.abs(ir).sum()**.5*8
    d=np.concatenate([a,np.zeros(n,np.float32)]);w=np.zeros(len(d),np.float32);c=fftconvolve(a,ir)[:len(d)];w[:len(c)]=c
    return d*(1-mix)+w/(np.abs(w).max() or 1)*np.abs(a).max()*mix
def lay(*parts):   # (clip, gain, offset s)
    n=max(int(o*SR)+len(c) for c,g,o in parts);out=np.zeros(n,np.float32)
    for c,g,o in parts:i=int(o*SR);out[i:i+len(c)]+=c/(np.abs(c).max() or 1)*g
    return out
def tidy(a,peak=.92,maxlen=None):
    pk=float(np.abs(a).max()) or 1;idx=np.where(np.abs(a)>pk*.02)[0]
    if len(idx):a=a[max(0,idx[0]-int(.005*SR)):idx[-1]+int(.05*SR)]
    if maxlen:a=a[:int(maxlen*SR)]
    a=a.copy();f=min(len(a),int(.04*SR));a[-f:]*=np.linspace(1,0,f);return a/(np.abs(a).max() or 1)*peak
def sub(a,f0,f1,g=.5):   # a sub-bass growl under the roar, following its loudness
    n=len(a);env=np.convolve(np.abs(a),np.ones(2048)/2048,'same');env/=env.max() or 1
    ph=2*np.pi*np.cumsum(np.linspace(f0,f1,n))/SR;return (np.sin(ph)*env*g).astype(np.float32)
R1,R2,O1,O2,O3='rubberduck1/x/','rubberduck2/x/','ogrebane1/x/','ogrebane2/x/','ogrebane3/x/'
def snarl_cuts():   # the strongest snarls in Darsycho's long take
    a=load('snarls/monster-snarl-5.ogg');hop=1024;e=np.array([np.sqrt(np.mean(a[i:i+hop]**2)) for i in range(0,len(a)-hop,hop)])
    on=e>e.max()*.18;segs=[];s=None
    for i,v in enumerate(on):
        if v and s is None:s=i
        if not v and s is not None:
            if (i-s)*hop/SR>.35:segs.append((s*hop,i*hop,float(e[s:i].max())))
            s=None
    segs.sort(key=lambda t:-t[2]);return [a[x:min(y,x+int(1.1*SR))] for x,y,_ in segs[:6]]
K={}
# the pack hunters: growls while they stalk, a snarl as the warning before a lunge, a screech as they strike, hurt, death
K['mon_growl']=[tidy(room(filt(sat(vari(load(p),.82),1.6),'low',4200),.5,.18)) for p in (O1+'monster-1.wav',O1+'monster-6.wav',O1+'monster-8.wav',O1+'monster-10.wav',O2+'monster-1.wav',R2+'monster_20.ogg')]
hiss=load('alienchirp/alien_hiss.mp3')
K['mon_snarl']=[tidy(room(sat(lay((vari(c,.9),1,0),(vari(hiss,.8),.25,.05)),2.0),.45,.2)) for c in snarl_cuts()]
K['mon_scream']=[tidy(room(sat(lay((vari(load(a),fa),1,0),(vari(load(b),fb),.55,0.03)),1.8),.55,.25)) for a,fa,b,fb in (
  ('alienscream/insectoralien.flac',.85,R1+'roar_02.ogg',.7),('alienscream/insectoralienshort_0.flac',.9,R1+'monster_06.ogg',.75),
  (R1+'scream_01.ogg',.88,R2+'grunt_07.ogg',.7),(R1+'scream_02.ogg',.85,R2+'roar_04.ogg',.7),
  (R2+'alien_07.ogg',.8,R2+'monster_12.ogg',.75),(R2+'monster_19.ogg',.85,R2+'roar_05.ogg',.7))]
K['mon_hurt']=[tidy(sat(vari(load(p),.85),1.5),.85) for p in (R1+'hurt_01.ogg',R1+'hurt_02.ogg',R1+'hurt_05.ogg',O3+'Monster-4.wav',O3+'Monster-7.wav',O3+'Monster-8.wav')]
K['mon_die']=[tidy(room(lay((vari(load(p),.8),1,0),(vari(load(O1+'monster-8.wav'),.7),.4,.25)),1.0,.3)) for p in (R2+'die_01.ogg',R2+'die_02.ogg',R2+'die_03.ogg',R2+'die_04.ogg')]
# the pour-out: a pack screaming as it comes, further off and in a big space
def horde():
    pool=K['mon_scream']+K['mon_snarl']+K['mon_growl'];parts=[(pool[int(rng.integers(len(pool)))],float(rng.uniform(.3,.75)),float(rng.uniform(0,3.4))) for _ in range(11)]
    return tidy(filt(room(lay(*parts),1.6,.45),'low',5200),.9,5.5)
K['mon_horde']=[horde(),horde()]
# the boss: a roar from deep in the chest (Trazzz's sandworm under rubberduck's roars, a screech for an edge, sub-bass), hurt, the slam, steps, death
def boss_roar(s,d,rr,tex):
    base=vari(load('deeproar/monster_roar.wav',s,d),.9);m=lay((base,1,0),(vari(load(R2+rr),.55),.55,.1),(vari(load(tex),.5),.18,.2))
    m=m+sub(m,48,34,.45);return tidy(room(sat(m,1.3),1.6,.35),.95,4.6)
K['boss_roar']=[boss_roar(.2,3.6,'roar_05.ogg','alienscream/insectoralien.flac'),boss_roar(2.4,3.6,'roar_06.ogg',R2+'monster_19.ogg')]
K['boss_hurt']=[tidy(room(sat(vari(load(p),f),1.4),.8,.25)) for p,f in ((R2+'roar_04.ogg',.6),(R2+'roar_06.ogg',.6),(R1+'troll_02.ogg',.6),(R2+'grunt_07.ogg',.55))]
boom=filt(load(os.path.join(REPO,'sounds/boom-1.wav')),'low',700)
K['boss_slam']=[tidy(room(lay((vari(load(R2+'stomp_01.ogg'),f),1,0),(boom,.8,0)),.9,.25),.95,2.2) for f in (.6,.55)]
K['boss_step']=[tidy(filt(vari(load(R2+'stomp_01.ogg'),f),'low',900),.7) for f in (.55,.6,.66)]
K['boss_die']=[tidy(room(lay((vari(load('deeproar/monster_roar.wav'),.8),1,0),(vari(load(R2+'die_04.ogg'),.5),.5,.6),(vari(load(R2+'roar_06.ogg'),.5),.5,1.4)),2.2,.4),.95,7.0)]
# out: one mp3 per kind, clips one after another, and their spans in the manifest
man=json.load(open(f'{OUT}/manifest.json'));GAP=np.zeros(int(.15*SR),np.float32)
for kind,clips in K.items():
    buf=[];spans=[];t=0.0
    for c in clips:spans.append([round(t,3),round(len(c)/SR,3)]);buf+=[c,GAP];t+=(len(c)+len(GAP))/SR
    pcm=(np.clip(np.concatenate(buf),-1,1)*32767).astype(np.int16)
    e=lameenc.Encoder();e.set_bit_rate(64);e.set_in_sample_rate(SR);e.set_channels(1);e.set_quality(2)
    open(f'{OUT}/{kind}.mp3','wb').write(e.encode(pcm.tobytes())+e.flush());man[kind]=spans
    print(kind,len(clips),'clips',round(t,1),'s')
json.dump(man,open(f'{OUT}/manifest.json','w'),separators=(',',':'))
