"""Cut the game's recorded sound effects into one mp3 per kind (sounds/sfx/<kind>.mp3) plus sounds/sfx/manifest.json
(start and length of each clip). Sources: CC0 packs from Kenney and OpenGameArt (see sounds/CREDITS.md), unpacked under
SRC. Usage: python build_sfx.py <SRC folder> <out folder>"""
import sys, os, json, numpy as np, soundfile as sf, lameenc
from scipy.signal import resample_poly
SRC,OUT=sys.argv[1],sys.argv[2];os.makedirs(OUT,exist_ok=True);SR=44100
K='k_impact-sounds/x/Audio/';R='k_rpg-audio/x/Audio/';SF='k_sci-fi-sounds/x/Audio/'
# kind: (clips, max length s, peak) ; a clip is a path or (path, start s, length s)
KINDS={
 'foot_out':([f'sfx100b/x/sfx100v2_footstep_wet_0{i}.ogg' for i in (1,2,3)]+[f'{K}footstep_concrete_00{i}.ogg' for i in range(5)]+[(f'gravel/x/Corsica_S-Walking_in_Snow/Corsica_S-Walking_on_snow_covered_gravel_0{i}.flac',0,.32) for i in (1,3,5,7)],.3,.7),
 'foot_in':([f'{K}footstep_carpet_00{i}.ogg' for i in range(5)]+[f'{K}footstep_concrete_00{i}.ogg' for i in range(3)],.25,.6),
 'gear':([f'gear/x/footsteps/step_cloth{i}.ogg' for i in (1,2,3,4)]+[f'gear/x/footsteps/step_lth{i}.ogg' for i in ('1','2','4')]+[f'gear/x/footsteps/step_metal{s}.ogg' for s in ('',' (2)',' (3)',' (4)')],.25,.5),
 'hit_metal':([f'{K}impactMetal_light_00{i}.ogg' for i in range(5)]+[f'{K}impactPlate_light_00{i}.ogg' for i in range(3)],.45,.85),
 'hit_wood':([f'{K}impactWood_light_00{i}.ogg' for i in range(5)]+[f'{K}impactPlank_medium_00{i}.ogg' for i in range(2)],.4,.85),
 'hit_ground':([f'{K}impactGeneric_light_00{i}.ogg' for i in range(5)],.25,.8),
 'flesh':([f'{K}impactPunch_medium_00{i}.ogg' for i in range(5)],.3,.7),
 'bodyfall':([f'{K}impactSoft_heavy_00{i}.ogg' for i in range(5)],.6,.9),
 'grunt':([f'pain1/x/slightscream-{i:02d}.flac' for i in range(1,16)],.8,.9),
 'grunt_down':([f'pain3/x/{n}' for n in sorted(os.listdir(os.path.join(SRC,'pain3/x'))) if n.endswith('.ogg')]+[('pain2/death pain grunts.wav',s,d) for s,d in ((.5,1.2),(5.0,.95),(14.6,1.15),(35.95,.7),(47.5,.75))],1.3,.95),
 'dog':([f'dog2/x/Dog/Dog Bark {i}.wav' for i in (1,2,3)]+['dog2/x/Dog/Dog Bark.wav']+[('dog1/dog_barking.wav',s,d) for s,d in ((1.36,.7),(3.4,.58),(4.28,.6),(5.6,.52))],.75,.95),
 'siren':([('siren/siren.mp3',0,7.2)],7.2,.8),
 'static':([('static/ScatterNoise1.mp3',s,.35) for s in (5.0,12.0,20.0,26.0)],.35,.6),
 'steel':(['mech/mechanical1.wav','metalwood/x/metal_open_01.ogg'],2.0,.85),
 'slam':(['metalwood/x/metal_slam_01.ogg','metalwood/x/metal_close_01.ogg'],1.2,.9),
 'lift_ding':(['lift/elevatording.ogg'],1.0,.7),
 'lift_door':([('lift/old_elevator_door.mp3',.9,1.6)],1.6,.8),
 'cell':(['metalwood/x/lock_open_01.ogg','mech/clank1.wav',f'{R}metalLatch.ogg'],1.0,.85),
 'zip':([('zipper/zipper-1.wav',0,.55)],.55,.7),
 'glass':([f'sfx100/x/glass_0{i}.ogg' for i in range(1,6)],1.0,.85),
 'smash':(['metalwood/x/metal_falling_01.ogg','metalwood/x/metal_falling_02.ogg','metalwood/x/metal_hit_01.ogg','metalwood/x/metal_hit_03.ogg'],1.0,.9),
 'thunder':([('rain/rain-thunder.ogg',21.8,7.5),'sfx100b/x/sfx100v2_thunder_01.ogg'],7.5,.95),
 'pin':([f'{R}metalClick.ogg',f'{R}metalLatch.ogg'],.5,.7),
 'reload':([f'{R}metalLatch.ogg','mech/lightclunk1.wav','mech/lightclunk2.wav'],.5,.8),
 'cloth':([f'{R}cloth{i}.ogg' for i in (1,2,3,4)],.6,.7),
 'computer':([f'{SF}computerNoise_00{i}.ogg' for i in range(4)],1.2,.6),
 'scan':([f'{SF}forceField_00{i}.ogg' for i in range(2)],1.6,.6),
}
def load(c):
    p,s,d=(c,0,None) if isinstance(c,str) else c
    a,sr=sf.read(os.path.join(SRC,p),always_2d=True);a=a.mean(1).astype(np.float32)
    if sr!=SR:
        from math import gcd;g=gcd(SR,sr);a=resample_poly(a,SR//g,sr//g).astype(np.float32)
    a=a[int(s*SR):(int((s+d)*SR) if d else None)]
    return a
def tidy(a,maxlen,peak):
    pk=float(np.abs(a).max()) or 1;idx=np.where(np.abs(a)>pk*.03)[0]
    if len(idx):a=a[max(0,idx[0]-int(.004*SR)):idx[-1]+int(.03*SR)]
    a=a[:int(maxlen*SR)].copy();f=min(len(a),int(.02*SR))
    if f:a[-f:]*=np.linspace(1,0,f)
    return a/(np.abs(a).max() or 1)*peak
man={}
GAP=np.zeros(int(.15*SR),np.float32)
for kind,(clips,maxlen,peak) in KINDS.items():
    parts=[GAP];t=len(GAP)/SR;spans=[]
    for c in clips:
        a=tidy(load(c),maxlen,peak);d=len(a)/SR
        spans.append([round(max(0,t-.01),3),round(d+.04,3)]);parts+=[a,GAP];t+=d+len(GAP)/SR
    pcm=(np.clip(np.concatenate(parts),-1,1)*32767).astype(np.int16)
    e=lameenc.Encoder();e.set_bit_rate(64);e.set_in_sample_rate(SR);e.set_channels(1);e.set_quality(2)
    mp3=e.encode(pcm.tobytes())+e.flush();open(f'{OUT}/{kind}.mp3','wb').write(mp3);man[kind]=spans
    print(f'{kind:11s} {len(spans):2d} clips {t:5.1f}s {len(mp3)//1024:4d}KB')
json.dump(man,open(f'{OUT}/manifest.json','w'),separators=(',',':'))
print('total',sum(os.path.getsize(f'{OUT}/{k}.mp3') for k in man)//1024,'KB')
