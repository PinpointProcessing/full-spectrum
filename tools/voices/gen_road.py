"""The two lines on the road east, out of the finished Headquarters (Bryan, after v95: "The leader says, alright, we need to
get our radio communication up. Then a scientist responds, there's a decommissioned radio tower accessible from the tunnel
down the road. You'll probably find the supplies you need from there."; road.js): road_1 for Reyes and Hayes (A1, B1:
whoever leads), road_2 for each scientist (S1-S4: whichever comes out with them). Made with Zonos like the rest (gen_zonos.py;
no pause at a comma, its `spoken`), several takes each into a cache check_zonos.py can score; add_lines.py puts the best on
the end of the speakers' voice files (README.md, "Lines made on their own"). Run as gen_zonos.py is run (its venv and
environment):
  python gen_road.py CACHE [takes] [speakers, e.g. S2,S4]"""
import json,os,re,sys,time,zlib,torch,torchaudio
os.chdir(os.path.dirname(os.path.abspath(__file__)));sys.path.insert(0,'.')
from zonos.model import Zonos
from zonos.conditioning import make_cond_dict
CACHE=sys.argv[1];NT=int(sys.argv[2]) if len(sys.argv)>2 else 3;ONLY=sys.argv[3].split(',') if len(sys.argv)>3 else None
#            happiness sadness disgust fear surprise anger other neutral, pitch range, speaking rate
STYLE={'firm':([.00,.00,.00,.00,.05,.15,.15,.65],40,14.),   # (the leader: steady, decided)
       'tell':([.00,.10,.00,.12,.00,.00,.15,.63],50,14.5)}   # (the scientist: telling them what he knows, still wary of them)
LEAD="Alright, we need to get our radio communication up."
SCI="There's a decommissioned radio tower accessible from the tunnel down the road. You'll probably find the supplies you need from there."
LINES=[(sp,'road_1',LEAD,'firm') for sp in ('A1','B1')]+[(sp,'road_2',SCI,'tell') for sp in ('S1','S2','S3','S4')]
if ONLY:LINES=[l for l in LINES if l[0] in ONLY]
spoken=lambda t:re.sub(r',\s*',' ',t)   # (Bryan, after v71: no pause at a comma)
RATE={'S4':16.}   # (S4's voice runs slower: at 14.5 every take stopped at about 8 s, before the last word)
torch.set_num_threads(int(os.environ.get('ZONOS_THREADS','4')));T0=time.time()
m=Zonos.from_pretrained('Zyphra/Zonos-v0.1-transformer',device='cpu');SR=m.autoencoder.sampling_rate
for sp,key,text,st in LINES:
    d=f'{CACHE}/{sp}';os.makedirs(d,exist_ok=True);mf=f'{d}/meta.json';meta=json.load(open(mf)) if os.path.exists(mf) else {}
    mt=meta.setdefault(key,{'text':text,'style':st,'takes':[]})
    w,sr=torchaudio.load(f'refs/{sp}.flac');emo,pr,rate=STYLE[st];rate=RATE.get(sp,rate) if key=='road_2' else rate;say=spoken(text)
    c=m.prepare_conditioning(make_cond_dict(text=say,speaker=m.make_speaker_embedding(w,sr),language='en-us',emotion=emo,pitch_std=pr,speaking_rate=rate))
    while len(mt['takes'])<NT:
        n=len(mt['takes'])
        for tries in range(4):
            torch.manual_seed(1000*n+zlib.crc32((sp+key).encode())%1000+7919*tries)
            a=m.autoencoder.decode(m.generate(c,max_new_tokens=int(86*min(20,2+len(say)/9)),cfg_scale=2.5,disable_torch_compile=True,progress_bar=False)).cpu()[0]
            if a.shape[-1]>.25*SR:break
        fn=f'{key}.wav' if n==0 else f'{key}_t{n}.wav';torchaudio.save(f'{d}/{fn}',a,SR);mt['takes'].append(fn)
        json.dump(meta,open(mf,'w'),indent=0)
        print(sp,key,st,round(a.shape[-1]/SR,2),'s',round(time.time()-T0),'s so far',flush=True)
print('done')
