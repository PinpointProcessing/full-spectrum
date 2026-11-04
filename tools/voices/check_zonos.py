"""Listen to the Zonos takes with a speech recogniser (faster-whisper base.en) and score each against its script (0..1), so
pack_zonos.py can keep the best take of each line and gen_zonos.py --redo can make more of the bad ones. Flags a line when its
best take scores under 0.75, or is shorter than a word or far longer than the words need (the model babbling on).
  python check_zonos.py CACHE [A1,A2,...]"""
import json,os,re,sys,difflib,soundfile as sf
from faster_whisper import WhisperModel
CACHE=sys.argv[1];ONLY=sys.argv[2].split(',') if len(sys.argv)>2 else sorted(os.listdir(CACHE))
m=WhisperModel('base.en',device='cpu',compute_type='int8',cpu_threads=2)
HEARD={'haze':'hayes','hays':'hayes','raise':'reyes','race':'reyes','rays':'reyes'}   # how it spells the names
def norm(t):return [HEARD.get(w,w) for w in re.sub(r"[^a-z' ]"," ",t.lower().replace('’',"'")).split()]
for sp in ONLY:
    d=f'{CACHE}/{sp}';mf=f'{d}/meta.json'
    if not os.path.exists(mf):continue
    meta=json.load(open(mf));sc_f=f'{d}/scores.json';sc=json.load(open(sc_f)) if os.path.exists(sc_f) else {};flagged=[]
    for key,mt in meta.items():
        for f in mt['takes']:
            if f in sc:continue
            info=sf.info(f'{d}/{f}');dur=info.frames/info.samplerate
            segs,_=m.transcribe(f'{d}/{f}',beam_size=1,language='en');h=' '.join(x.text for x in segs).strip()
            r=difflib.SequenceMatcher(None,norm(mt['text']),norm(h)).ratio()
            words=len(mt['text'].split());bad=dur<.25 or dur>1.2+words*.75
            sc[f]={'score':round(0 if bad else r,2),'heard':h,'secs':round(dur,2)}
        if mt['takes'] and max(sc[f]['score'] for f in mt['takes'])<.75:flagged.append(key)
    json.dump(sc,open(sc_f,'w'),indent=0);json.dump(flagged,open(f'{d}/flagged.json','w'))
    n=len(meta);print(sp,n,'lines',len(flagged),'flagged',flush=True)
