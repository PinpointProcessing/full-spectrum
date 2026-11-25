# Version 244's draft sheet: each chapter's level-up page on the ground just fought over. python3 sheet244.py OUT.jpg
import sys
from PIL import Image,ImageDraw,ImageFont
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf'
F=lambda s:ImageFont.truetype(B,s)
BG=(13,18,25);W=1900;PAD=14;WH=(255,255,255);GO=(255,215,106)
O=lambda p:Image.open(p).convert('RGB')
caps=["After Chapter 1 · D-Day: on the beach","After Chapter 2 · the defence: in the base","After Chapter 3 · the village: on its square"]
ph=[O('k%dp/auto.png'%c) for c in (1,2,3)];ls=[O('k%dw/auto.png'%c) for c in (1,2,3)]
pw=(W-PAD*2-24)//3;phh=int(ph[0].size[1]*pw/ph[0].size[0]);lh=int(ls[0].size[1]*pw/ls[0].size[0])
# the portraits are tall: shown a little smaller, side by side with room for the wide ones under them
pw2=400;ph2=int(ph[0].size[1]*pw2/ph[0].size[0])
S=Image.new('RGB',(W,52+30+ph2+30+26+lh+PAD),BG);D=ImageDraw.Draw(S)
D.text((PAD,12),"Each chapter's after-battle pages are on the ground just fought over",font=F(24),fill=WH)
for i in range(3):
    x=PAD+i*(pw+12);D.text((x,52),caps[i],font=F(17),fill=GO)
    S.paste(ph[i].resize((pw2,ph2),Image.LANCZOS),(x+(pw-pw2)//2,80))
    y=80+ph2+22;D.text((x,y),"Phone on its side",font=F(15),fill=(190,200,210));S.paste(ls[i].resize((pw,lh),Image.LANCZOS),(x,y+24))
S.save(sys.argv[1] if len(sys.argv)>1 else 'sheet244.jpg',quality=90);print(S.size)
