# Version 242's draft sheet: the look by level (ten on the stage), the level-up page, the battle's view, REVIVE. python3 sheet242.py OUT.jpg
import sys,glob
from PIL import Image,ImageDraw,ImageFont
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F=lambda s,b=True:ImageFont.truetype(B if b else R,s)
BG=(13,18,25);W=1900;PAD=14
KIT=['as he lands','bandolier','vest, bedroll','shoulder guards','steel breastplate','arm + knee guards','goggles, scarf','thigh plates','steel shoulders','a star']
# row 1: the ten levels
fs=sorted(glob.glob('lvS/r3-*.png'));ims=[Image.open(f).convert('RGB') for f in fs];w,h=ims[0].size
cw=(W-PAD*2)//10;cells=[im.crop((25,0,w-25,h)) for im in ims];chh=int(cells[0].size[1]*cw/cells[0].size[0])
r1h=56+chh+46
# row 2: three phone pictures, the battle, REVIVE
ph=[Image.open('rep5p/%s.png'%n).convert('RGB') for n in ['1-first-man','2-level-pick','3-picked-runs-on']]
pw=292;phh=int(ph[0].size[1]*pw/ph[0].size[0])
bt=Image.open('lvbt2/B-back.png').convert('RGB');bw=560;bh=int(bt.size[1]*bw/bt.size[0])
rv=Image.open('rep5p/5b-revive.png').convert('RGB')
r2h=62+phh
S=Image.new('RGB',(W,r1h+r2h+PAD*2+8),BG);D=ImageDraw.Draw(S)
D.text((PAD,12),"A  His look by level: a little more buff each level, and one more piece of kit (levels 1 to 10)",font=F(23),fill=(255,255,255))
for i,c in enumerate(cells):
    x=PAD+i*cw;S.paste(c.resize((cw,chh),Image.LANCZOS),(x,52))
    D.text((x+6,52+chh+4),"LEVEL %d"%(i+1),font=F(15),fill=(255,215,106));D.text((x+6,52+chh+23),KIT[i],font=F(13,False),fill=(190,200,210))
y0=r1h+PAD
caps=["1  His level-up page shows him,","2  At the level his look changes","3  Picked: his bar runs on.","4  In battle they look their level","5  REVIVE: medals it costs /"]
cap2=["himself. His bar starts to climb","on the spot. He picks a perk","The next man comes up","(here levels 2, 4, 6 and 10)","medals you own"]
xs=[PAD,PAD+pw+14,PAD+(pw+14)*2,PAD+(pw+14)*3,PAD+(pw+14)*3]
for i in range(3):
    D.text((xs[i],y0),caps[i],font=F(16),fill=(255,255,255));D.text((xs[i],y0+21),cap2[i],font=F(16),fill=(255,255,255))
    S.paste(ph[i].resize((pw,phh),Image.LANCZOS),(xs[i],y0+52))
x4=xs[3];D.text((x4,y0),caps[3],font=F(16),fill=(255,255,255));D.text((x4,y0+21),cap2[3],font=F(16),fill=(255,255,255))
S.paste(bt.resize((bw,bh),Image.LANCZOS),(x4,y0+52))
# REVIVE: the fallen block of the stats page, enlarged
y5=y0+52+bh+16;D.text((x4,y5),caps[4]+" "+cap2[4],font=F(16),fill=(255,255,255))
import json,os
box=json.load(open('rep5p/revive-box.json')) if os.path.exists('rep5p/revive-box.json') else None
if box:
    l,t,r,b=[int(v) for v in box];crop=rv.crop((max(0,l-6),max(0,t-6),min(rv.size[0],r+6),min(rv.size[1],b+6)));k=min(bw/crop.size[0],(S.size[1]-y5-34-PAD)/crop.size[1]);crop=crop.resize((int(crop.size[0]*k),int(crop.size[1]*k)),Image.LANCZOS);S.paste(crop,(x4,y5+30))
# the space right of the battle picture: the page on a phone on its side
x6=x4+bw+14;rw=W-PAD-x6
ls=Image.open('rep5w/2-level-pick.png').convert('RGB');lh=int(ls.size[1]*rw/ls.size[0])
D.text((x6,y0),"On its side: he stands",font=F(16),fill=(255,255,255));D.text((x6,y0+21),"beside his card",font=F(16),fill=(255,255,255));S.paste(ls.resize((rw,lh),Image.LANCZOS),(x6,y0+52))
bk=Image.open('lvBk/sheet.jpg').convert('RGB');bkh=int(bk.size[1]*rw/bk.size[0]);y7=y0+52+lh+18
D.text((x6,y7),"From behind: levels 1, 3 and 10",font=F(16),fill=(255,255,255));S.paste(bk.resize((rw,bkh),Image.LANCZOS),(x6,y7+28))
S.save(sys.argv[1] if len(sys.argv)>1 else 'sheet242.jpg',quality=90);print(S.size)
