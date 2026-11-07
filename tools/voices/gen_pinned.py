"""A soldier who's pinned and told to do something that means leaving his spot says he can't (Bryan, after v104: "The only
time someone can't do an action is if they are pinned and it would say I'm Pinned, I can't do that! And it should be a voice
bubble above them, maybe even have them say it"): cant_1 for all eight (voice.js's VOICE_LINES.cant), said under fire like the
other pinned lines ('urgent', gen_zonos.py's style for them; Reyes from his shouted reference). Made with Zonos like the rest,
several takes each into a cache check_zonos.py can score; add_lines.py puts the best on the end of the speakers' voice files.
Run as gen_zonos.py is run (its venv and environment):
  python gen_pinned.py CACHE [takes] [speakers, e.g. A1,B1]"""
import json,os,re,sys,time,zlib,torch,torchaudio
os.chdir(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,'.')
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
CACHE=sys.argv[1];NT=int(sys.argv[2]) if len(sys.argv)>2 else 2;ONLY=sys.argv[3].split(',') if len(sys.argv)>3 else None
#            happiness sadness disgust fear surprise anger other neutral, pitch range, speaking rate
STYLE={'urgent':([.00,.15,.00,.55,.10,.15,.05,.00],90,17.)}   # (gen_zonos.py's: the pinned lines, "I'm pinned!", were made with it)
CANT="I'm pinned! I can't do that!"   # (Bryan's words)
LINES=[(sp,'cant_1',CANT,'urgent') for sp in ('A1','A2','B1','B2','A3','A4','B3','B4')]
if ONLY:LINES=[l for l in LINES if l[0] in ONLY]
torch.set_num_threads(int(os.environ.get('ZONOS_THREADS','4')));T0=time.time()
m=Zonos.from_pretrained('Zyphra/Zonos-v0.1-transformer',device='cpu');SR=m.autoencoder.sampling_rate
def emb(name):
    w,sr=torchaudio.load(f'refs/{name}.flac');return m.make_speaker_embedding(w,sr)
for sp,key,text,st in LINES:
    d=f'{CACHE}/{sp}';os.makedirs(d,exist_ok=True);mf=f'{d}/meta.json';meta=json.load(open(mf)) if os.path.exists(mf) else {}
    mt=meta.setdefault(key,{'text':text,'style':st,'takes':[]})
    E=emb('A1_hot' if sp=='A1' else sp)   # (Reyes: his shouted clip for the intense lines, as gen_zonos.py does)
    while len(mt['takes'])<NT:
        n=len(mt['takes']);emo,pr,rate=STYLE[st]
        if n>=2:pr,rate=pr*.65,rate-2   # (later takes a little softer: short hard lines are the ones that come out empty or garbled)
        c=m.prepare_conditioning(make_cond_dict(text=text,speaker=E,language='en-us',emotion=emo,pitch_std=pr,speaking_rate=rate))
        for tries in range(4):
            torch.manual_seed(1000*n+zlib.crc32((sp+key).encode())%1000+7919*tries)
            a=m.autoencoder.decode(m.generate(c,max_new_tokens=int(86*min(20,2+len(text)/9)),cfg_scale=2.5,disable_torch_compile=True,progress_bar=False)).cpu()[0]
            if a.shape[-1]>.25*SR:break
        fn=f'{key}.wav' if n==0 else f'{key}_t{n}.wav';torchaudio.save(f'{d}/{fn}',a,SR);mt['takes'].append(fn)
        json.dump(meta,open(mf,'w'),indent=0)
        print(sp,key,st,round(a.shape[-1]/SR,2),'s',round(time.time()-T0),'s so far',flush=True)
print('done')
