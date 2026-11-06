"""The scream after the gate, screamed (Bryan, after v92: "Can't the 'What the hell was that!?' be screamed?").
Zonos shouts rather than screams: with any emotion and pitch settings, and even continuing from a recorded scream as an
audio prefix, its takes of "What the hell was that?!" stayed at a man's shouting pitch (115-155 Hz). It copies a voice from a
reference clip, though, and a reference of a man screaming brings his scream with it: refs/SCREAM.flac is five of HaelDB's CC0
yells ("Male Grunt/Yelling sounds" on OpenGameArt: 3yell1, 3yell2, 3yell6, 3yell9 and 3yell11, one man at 300-330 Hz) end to
end. Its speaker embedding is blended with the soldier's own (w: how much of the screamer; at 0.6 a soldier keeps some of his
own voice, and 1.0 is the screamer's alone), and the takes come out screamed at 280-400 Hz with every word heard. Nothing is
reshaped afterwards. Several takes per blend into CACHE/<speaker>/; pick by check_zonos.py's words and the pitch (README.md).
Run as gen_zonos.py is run (its venv and environment):
  python gen_scream.py CACHE SPEAKER [w,w,...] [takes]"""
import json,os,sys,time,zlib,torch,torchaudio
os.chdir(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,'.')
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
CACHE,SP=sys.argv[1:3];WS=[float(w) for w in sys.argv[3].split(',')] if len(sys.argv)>3 else [.6,.75,1.0];NT=int(sys.argv[4]) if len(sys.argv)>4 else 3
torch.set_num_threads(int(os.environ.get('ZONOS_THREADS','4')));T0=time.time()
m=Zonos.from_pretrained('Zyphra/Zonos-v0.1-transformer',device='cpu');SR=m.autoencoder.sampling_rate
#        happiness sadness disgust fear surprise anger other neutral
TERROR=[.00,.05,.00,1.0,.85,.35,.10,.00];LINE="What the hell was that?!"
def emb(f):w,sr=torchaudio.load(f);return m.make_speaker_embedding(w.mean(0,keepdim=True),sr)
E_scr,E_me=emb('refs/SCREAM.flac'),emb(f'refs/{SP}.flac')
d=f'{CACHE}/{SP}';os.makedirs(d,exist_ok=True);mf=f'{d}/meta.json';meta=json.load(open(mf)) if os.path.exists(mf) else {}
base=zlib.crc32(SP.encode())%1000
for wi,wv in enumerate(WS):
    spk=wv*E_scr+(1-wv)*E_me
    for k in range(NT):
        nm=f'w{int(wv*100)}_{k}'
        if nm in meta:continue
        torch.manual_seed(base+97*k+13*wi+500)
        c=m.prepare_conditioning(make_cond_dict(text=LINE,speaker=spk,language='en-us',emotion=TERROR,pitch_std=300,speaking_rate=13.))
        a=m.autoencoder.decode(m.generate(c,max_new_tokens=int(86*min(20,2+len(LINE)/9)),cfg_scale=2.5,disable_torch_compile=True,progress_bar=False)).cpu()[0]
        torchaudio.save(f'{d}/{nm}.wav',a,SR);meta[nm]={'w':wv,'secs':round(a.shape[-1]/SR,2)};json.dump(meta,open(mf,'w'),indent=0)
        print(SP,nm,round(a.shape[-1]/SR,2),'s',round(time.time()-T0),'s so far',flush=True)
print('done')
