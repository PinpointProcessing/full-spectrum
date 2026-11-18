# Levels of an offline render (4ch f32 44.1k: 0-1 the mix, 2-3 the bed): python3 -I ana.py DIR seg [seg...]
import sys,numpy as np,subprocess,os
D=sys.argv[1];SR=44100
def db(x):return 20*np.log10(max(x,1e-9))
def bands(x):
    n=len(x);X=np.abs(np.fft.rfft(x*np.hanning(n)))**2;f=np.fft.rfftfreq(n,1/SR);tot=X.sum()+1e-20
    return ' '.join(f"{lo}-{hi}:{10*np.log10(X[(f>=lo)&(f<hi)].sum()/tot+1e-12):.0f}" for lo,hi in [(20,150),(150,400),(400,1000),(1000,3000),(3000,8000),(8000,20000)])
for s in sys.argv[2:]:
    a=np.fromfile(f'{D}/{s}.f32',dtype=np.float32).reshape(-1,4)
    mix=a[:,:2];bed=a[:,2:]*.9  # (the bed tap is before the master's 0.9)
    w=int(SR*.4)
    def st(x):
        m=x.mean(1);n=len(m)//w;r=np.sqrt((m[:n*w].reshape(n,w)**2).mean(1));return r
    rm,rb=st(mix),st(bed)
    print(f"== {s} {len(a)/SR:.1f}s  MIX peak {db(np.abs(mix).max()):.1f} rms {db(np.sqrt((mix**2).mean())):.1f} st400ms p10/50/90 {db(np.percentile(rm,10)):.1f}/{db(np.percentile(rm,50)):.1f}/{db(np.percentile(rm,90)):.1f} clip>0.99 {(np.abs(mix)>.99).sum()}")
    print(f"   BED peak {db(np.abs(bed).max()):.1f} rms {db(np.sqrt((bed**2).mean())):.1f} st400ms p10/50/90 {db(np.percentile(rb,10)):.1f}/{db(np.percentile(rb,50)):.1f}/{db(np.percentile(rb,90)):.1f} silent-windows {(rb<1e-4).sum()}/{len(rb)}  L/R corr {np.corrcoef(bed[:,0],bed[:,1])[0,1]:.2f}")
    def phone(x):
        X=np.fft.rfft(x.mean(1));f=np.fft.rfftfreq(len(x),1/SR);X[(f<300)|(f>8000)]=0;y=np.fft.irfft(X,len(x));n=len(y)//w;r=np.sqrt((y[:n*w].reshape(n,w)**2).mean(1));return y,r
    py,pr=phone(bed);my,mr=phone(mix)
    print(f"   PHONE(300-8k) mix rms {db(np.sqrt((my**2).mean())):.1f} p10/50/90 {db(np.percentile(mr,10)):.1f}/{db(np.percentile(mr,50)):.1f}/{db(np.percentile(mr,90)):.1f} | bed rms {db(np.sqrt((py**2).mean())):.1f} p10/50/90 {db(np.percentile(pr,10)):.1f}/{db(np.percentile(pr,50)):.1f}/{db(np.percentile(pr,90)):.1f}")
    print(f"   bed bands(dB of total) {bands(bed.mean(1))}")
    print(f"   mix bands(dB of total) {bands(mix.mean(1))}")
