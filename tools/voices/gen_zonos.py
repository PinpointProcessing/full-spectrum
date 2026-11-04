"""Make the game's voice lines with Zonos v0.1 (Zyphra, Apache-2.0; https://github.com/Zyphra/Zonos), one take per line, into a
cache folder (CACHE/<speaker>/<key>.wav, 44.1 kHz) that pack_zonos.py turns into the game's files. Bryan chose it over Kokoro
and Chatterbox: each line gets an emotion mix, a pitch range and a speaking rate from how it's said (shouted, urgent, calm,
low, dry banter, pleading, hit), and the voice is copied from the speaker's clip in refs/ (zonos_refs.py).
About 14 s of computing per second of speech on a 4-core CPU, so the whole cast (~2070 lines) takes about half a day: it
stops cleanly after BUDGET seconds and picks up where it left off when run again.
  python gen_zonos.py CACHE [A1,A2,...] [--budget 6600] [--redo]
--redo makes one more take (_t1, then _t2) of each line check_zonos.py flagged (CACHE/<sp>/flagged.json), up to 3 in all."""
import json,os,sys,time,zlib,torch,torchaudio
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
from voicelib import lines_for,style_of
args=[a for a in sys.argv[1:] if not a.startswith('--')];CACHE=args[0]
ORDER=['A1','A2','B1','B2','E1','E2','E3','S1','S2','S3','S4','A3','A4','B3','B4']
ONLY=args[1].split(',') if len(args)>1 else ORDER
BUDGET=float(sys.argv[sys.argv.index('--budget')+1]) if '--budget' in sys.argv else 1e9;REDO='--redo' in sys.argv
LANG={}   # everyone en-us: Zonos's en-gb mode came out empty or garbled on half the short lines; the British voices keep their accent from refs/
#            happiness sadness disgust fear surprise anger other neutral, pitch range, speaking rate (phonemes/s)
STYLE={'shout': ([.00,.00,.00,.35,.25,.60,.05,.00],110,18.),
       'urgent':([.00,.15,.00,.55,.10,.15,.05,.00], 90,17.),
       'calm':  ([.05,.00,.00,.00,.00,.05,.10,.60], 45,14.),
       'quiet': ([.00,.00,.00,.40,.00,.10,.10,.30], 40,13.),
       'dry':   ([.35,.15,.10,.00,.05,.00,.20,.20], 60,14.),
       'fear':  ([.00,.35,.00,.50,.25,.15,.00,.10], 90,16.),   # (heavy fear comes out breathy)
       'pain':  ([.00,.40,.10,.30,.30,.45,.00,.00],120,17.)}
SAY={'Reyes':'Ray-ess','Lindqvist':'Lindkvist'}   # names said the way they sound (Zonos read Reyes as "raise")
def spoken(t):
    for a,b in SAY.items():t=t.replace(a,b)
    return t
torch.set_num_threads(4);T0=time.time()
m=Zonos.from_pretrained('Zyphra/Zonos-v0.1-transformer',device='cpu')
def emb(name):
    w,sr=torchaudio.load(f'refs/{name}.flac');return m.make_speaker_embedding(w,sr)
for sp in [s for s in ORDER if s in ONLY]:
    d=f'{CACHE}/{sp}';os.makedirs(d,exist_ok=True);meta_f=f'{d}/meta.json'
    meta=json.load(open(meta_f)) if os.path.exists(meta_f) else {}
    flagged=json.load(open(f'{d}/flagged.json')) if REDO and os.path.exists(f'{d}/flagged.json') else []
    E={'base':emb(sp)};E['hot']=emb('A1_hot') if sp=='A1' else E['base']   # (Reyes: his shouted clip for the intense lines)
    for key,text,g in lines_for(sp):
        st=style_of(sp,g);mt=meta.setdefault(key,{'text':text,'style':st,'takes':[]})
        if REDO:
            if key not in flagged or len(mt['takes'])>=3:continue
        elif mt['takes']:continue
        if time.time()-T0>BUDGET:print('budget reached');json.dump(meta,open(meta_f,'w'),indent=0);sys.exit(0)
        emo,pr,rate=STYLE[st];n=len(mt['takes']);hot=st in('shout','urgent','pain','fear')
        if n>=2:pr,rate,hot=pr*.65,rate-2,False   # (later redos a little softer: short hard shouts are the ones that come out empty or garbled)
        c=m.prepare_conditioning(make_cond_dict(text=spoken(text),speaker=E['hot' if hot else 'base'],
            language=LANG.get(sp,'en-us'),emotion=emo,pitch_std=pr,speaking_rate=rate))
        for tries in range(4):   # (an empty take, the model stopping at once, is retried on the spot: it costs a second or two)
            torch.manual_seed(1000*n+zlib.crc32((sp+key).encode())%1000+7919*tries)
            codes=m.generate(c,max_new_tokens=int(86*min(20,2+len(text)/9)),cfg_scale=2.5,disable_torch_compile=True,progress_bar=False)
            a=m.autoencoder.decode(codes).cpu()[0]
            if a.shape[-1]>.25*m.autoencoder.sampling_rate:break
        fn=f'{key}.wav' if n==0 else f'{key}_t{n}.wav'
        torchaudio.save(f'{d}/{fn}',a,m.autoencoder.sampling_rate);mt['takes'].append(fn)
        json.dump(meta,open(meta_f,'w'),indent=0)
        print(sp,key,st,round(a.shape[-1]/m.autoencoder.sampling_rate,2),'s',round(time.time()-T0),'s so far',flush=True)
print('done')
