# The demo reel: python3 -I reel2.py DIR OUT.mp3 [bed]  (the ride in, the beach, the top with a tank coming, the woods, the village;
# crossfaded; 'bed' = ddamb.js's bed alone, without the guns)
import sys,numpy as np,subprocess
D=sys.argv[1];OUT=sys.argv[2];bed=len(sys.argv)>3;SR=44100
cuts=[('ride',0.3,21.0),('beach',1.6,20.0),('top',1.6,21.0),('woods',1.0,12.5),('village',1.6,22.0)]
xf=int(SR*1.2);y=None
for s,a,b in cuts:
    x=np.fromfile(f'{D}/{s}.f32',dtype=np.float32).reshape(-1,4)
    x=(x[:,2:]*.9 if bed else x[:,:2])[int(a*SR):int(b*SR)].copy()
    if y is None:y=x;continue
    r=np.linspace(0,1,xf)[:,None];y=np.concatenate([y[:-xf],y[-xf:]*np.sqrt(1-r)+x[:xf]*np.sqrt(r),x[xf:]])
f=int(SR*.6);y[:f]*=np.linspace(0,1,f)[:,None];f=int(SR*2);y[-f:]*=np.linspace(1,0,f)[:,None]
pk=np.abs(y).max()
if pk>.98:y*=.98/pk
print('reel',round(len(y)/SR,1),'s peak',round(20*np.log10(np.abs(y).max()),1),'dB rms',round(20*np.log10(np.sqrt((y**2).mean())),1))
subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','2','-i','-','-c:a','libmp3lame','-b:a','160k',OUT],input=y.astype(np.float32).tobytes())
