import sys,wave,numpy as np
def load(p):
    import subprocess
    raw=subprocess.run(['ffmpeg','-v','error','-i',p,'-f','f32le','-ac','1','-ar','44100','-'],capture_output=True).stdout
    return np.frombuffer(raw,dtype=np.float32)
for p in sys.argv[1:]:
    x=load(p);sr=44100
    env=np.abs(x);
    # 5ms rms frames
    hop=220;n=len(x)//hop
    fr=np.sqrt(np.mean(x[:n*hop].reshape(n,hop)**2,axis=1))
    db=20*np.log10(fr+1e-9)
    pk=db.max()
    ons=[];last=-99
    for i in range(1,n):
        if db[i]>pk-25 and db[i]-db[i-1]>12 and (i-last)*hop/sr>0.04:
            ons.append((round(i*hop/sr,3),round(db[i],1)));last=i
    print(p.split('/')[-1],'len',round(len(x)/sr,2),'peak',round(20*np.log10(np.abs(x).max()),1),'n',len(ons),ons[:40])
