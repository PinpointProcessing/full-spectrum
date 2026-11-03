"""Make the game's voice sprites with Kokoro-82M (Apache-2.0): one mp3 per speaker, all his lines in a row, plus manifest.json.
Lines come from lines.json (extract.js pulls them out of the game's code)."""
import json, sys, time, numpy as np, lameenc
from kokoro_onnx import Kokoro
OUT=sys.argv[1] if len(sys.argv)>1 else 'out'
import os; os.makedirs(OUT,exist_ok=True)
L=json.load(open('lines.json'))
k=Kokoro('kokoro-v1.0.onnx','voices-v1.0.bin')
def V(*mix):   # a voice, or a blend of voices [(name,weight),...]
    if len(mix)==1 and isinstance(mix[0],str): return mix[0]
    return sum(k.get_voice_style(n)*w for n,w in mix)
# who sounds like whom (lang: en-us or en-gb)
CAST={
 'A1':(V('am_michael'),'en-us'),'A2':(V('am_fenrir'),'en-us'),'B1':(V('am_puck'),'en-us'),'B2':(V('bm_george'),'en-gb'),
 'A3':(V('bm_lewis'),'en-gb'),'A4':(V('bm_fable'),'en-gb'),'B3':(V('am_liam'),'en-us'),'B4':(V('am_onyx'),'en-us'),
 'S1':(V('af_nicole'),'en-us'),'S2':(V('bf_emma'),'en-gb'),'S3':(V('af_sarah'),'en-us'),'S4':(V('am_eric'),'en-us'),
 'E1':(V('am_echo'),'en-us'),'E2':(V('bm_daniel'),'en-gb'),'E3':(V(('am_echo',.5),('bm_daniel',.5)),'en-gb'),
}
VOICE_NAME={'E3':'am_echo+bm_daniel'}
SHOUT={'contact','man_down','hit_down','pinned','rpg','frag','charge','suppress','ack_attack','breach','zip','cry','plead','scan',
       'bark_spot','bark_grenade','bark_pinned','bark_down','bark_surrender','bark_backup','bark_flank','bark_body','bark_dog'}
SPEED={'silent':.95,'takedown':.95,'end':.88,'bye':.95,'up':.88,'escort':1.0,'objective':1.0,'kill':1.0}
def speed_of(group): return SPEED.get(group,1.15 if group in SHOUT else 1.04)
# each speaker's lines: (clip key, text, group)
def lines_for(sp):
    out=[]
    if sp[0] in 'AB':
        for key,arr in L['squad'].items():
            for i,t in enumerate(arr): out.append((f'{key}_{i+1}',t,key))
    if sp in ('A3','A4','B3','B4'):
        name={'A3':'Abara','A4':'Brennan','B3':'Lindqvist','B4':'Marsh'}[sp]
        for i,t in enumerate(L['prison']['cry']): out.append((f'cry_{i+1}',t,'cry'))
        for i,t in enumerate(L['prison']['loot']): out.append((f'loot_{i+1}',t,'loot'))
        if name in L['prison']['freed']: out.append(('freed_1',L['prison']['freed'][name],'freed'))
        if name in L['prison']['bye']: out.append(('bye_1',L['prison']['bye'][name],'bye'))
        if name=='Marsh': out.append(('up_1',L['prison']['up'],'up'))
    if sp[0]=='S':
        for g,arr in L['sci'].items():
            for i,t in enumerate(arr): out.append((f'{g}_{i+1}',t,g))
    if sp[0]=='E':
        for g,arr in L['barks'].items():
            for i,t in enumerate(arr): out.append((f'bark_{g}_{i+1}',t,'bark_'+g))
    return out
SR=24000
def tidy(a,shout):
    a=np.asarray(a,dtype=np.float32);pk=float(np.abs(a).max()) or 1.0
    idx=np.where(np.abs(a)>pk*.02)[0]
    if len(idx): a=a[max(0,idx[0]-int(.03*SR)):min(len(a),idx[-1]+int(.08*SR))]
    a=a/(np.abs(a).max() or 1)
    if shout: a=np.tanh(2.0*a)/np.tanh(2.0)   # pushed a little harder: more urgent, more presence
    return (a*.89).astype(np.float32)
only=set(sys.argv[2].split(',')) if len(sys.argv)>2 else None
man={'v':2,'model':'Kokoro-82M (Apache-2.0), via kokoro-onnx','speakers':{}}
if os.path.exists(OUT+'/manifest.json'): man=json.load(open(OUT+'/manifest.json'))
GAP=np.zeros(int(.35*SR),dtype=np.float32)
t00=time.time()
for sp,(voice,lang) in CAST.items():
    if only and sp not in only: continue
    parts=[GAP];clips={};t=len(GAP)/SR
    for key,text,g in lines_for(sp):
        a,sr=k.create(text,voice=voice,speed=speed_of(g),lang=lang);assert sr==SR
        a=tidy(a,g in SHOUT);d=len(a)/SR
        clips[key]=[round(max(0,t-.03),3),round(d+.09,3)]
        parts+= [a,GAP];t+=d+len(GAP)/SR
    pcm=np.concatenate(parts);pcm16=(np.clip(pcm,-1,1)*32767).astype(np.int16)
    enc=lameenc.Encoder();enc.set_bit_rate(40);enc.set_in_sample_rate(SR);enc.set_channels(1);enc.set_quality(2)
    mp3=enc.encode(pcm16.tobytes())+enc.flush()
    open(f'{OUT}/{sp}.mp3','wb').write(mp3)
    man['speakers'][sp]={'file':f'{sp}.mp3','voice':VOICE_NAME.get(sp,voice if isinstance(voice,str) else 'blend'),'clips':clips}
    print(sp,len(clips),'lines',round(len(pcm)/SR,1),'s',round(len(mp3)/1024),'KB',round(time.time()-t00),'s so far',flush=True)
json.dump(man,open(OUT+'/manifest.json','w'),separators=(',',':'))
print('done',round(time.time()-t00),'s')
