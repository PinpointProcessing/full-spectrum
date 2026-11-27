# spectrogram + envelope sheet for audio files: python3 -I spec.py OUT.png file1 [file2 ...] [--max SECS]
import sys,subprocess,numpy as np
from PIL import Image,ImageDraw
args=sys.argv[1:];out=args.pop(0);mx=None
if '--max' in args:i=args.index('--max');mx=float(args[i+1]);del args[i:i+2]
SR=22050
def load(f):
    cmd=['ffmpeg','-v','error','-i',f]+(['-t',str(mx)] if mx else [])+['-ac','1','-ar',str(SR),'-f','f32le','-']
    return np.frombuffer(subprocess.run(cmd,capture_output=True).stdout,dtype=np.float32)
rows=[]
for f in args:
    x=load(f);n=1024;h=256
    if len(x)<n:x=np.pad(x,(0,n))
    fr=np.lib.stride_tricks.sliding_window_view(x,n)[::h]*np.hanning(n)
    S=20*np.log10(np.abs(np.fft.rfft(fr,axis=1))+1e-6).T  # freq x time
    # log-frequency rows 30Hz..11kHz
    fb=np.fft.rfftfreq(n,1/SR);H=180;lf=np.geomspace(30,11000,H)
    idx=np.searchsorted(fb,lf).clip(0,len(fb)-1)
    img=S[idx][::-1];img=np.clip((img+20)/70,0,1)
    W=max(200,min(1400,img.shape[1]))
    im=Image.fromarray((img*255).astype(np.uint8)).resize((W,H))
    rms=np.sqrt(np.convolve(x**2,np.ones(int(SR*.05))/int(SR*.05),'same'))
    pk=np.abs(x).max();r=20*np.log10(np.sqrt((x**2).mean())+1e-9)
    canvas=Image.new('RGB',(W,H+70),(20,20,20));canvas.paste(im.convert('RGB'),(0,0))
    d=ImageDraw.Draw(canvas)
    env=20*np.log10(rms+1e-6);xs=np.linspace(0,len(env)-1,W).astype(int)
    pts=[(i,H+68-int(np.clip((env[j]+60)/60,0,1)*60)) for i,j in enumerate(xs)]
    d.line(pts,fill=(255,200,80))
    d.text((4,H+2),f"{f.split('/')[-1][:60]} {len(x)/SR:.1f}s peak {20*np.log10(pk+1e-9):.1f}dB rms {r:.1f}dB",fill=(255,255,255))
    rows.append(canvas)
Wm=max(r.width for r in rows);sheet=Image.new('RGB',(Wm,sum(r.height for r in rows)),(0,0,0));y=0
for r in rows:sheet.paste(r,(0,y));y+=r.height
sheet.save(out)
