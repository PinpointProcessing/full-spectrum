# Version 243's draft sheet: the level-up page's three backdrops, and the drawn medal. python3 sheet243.py OUT.jpg
import sys
from PIL import Image,ImageDraw,ImageFont
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
F=lambda s,b=True:ImageFont.truetype(B if b else R,s)
BG=(13,18,25);W=1900;PAD=14;WH=(255,255,255);GO=(255,215,106);DIM=(190,200,210)
O=lambda p:Image.open(p).convert('RGB')
ph=[O('bgp/%s.png'%n) for n in ['stage','base','field']];pw=384;phh=int(ph[0].size[1]*pw/ph[0].size[0])
ls=[O('bgw/%s.png'%n) for n in ['base','field']];lw=W-PAD*2-(pw+12)*3;lh=int(ls[0].size[1]*lw/ls[0].size[0])
r1=58+max(phh,(lh+30)*2)
md=O('medal/medals.png');md=md.crop((0,10,1960,1030));mw=1120;mh=int(md.size[1]*mw/md.size[0])
r2=58+mh
S=Image.new('RGB',(W,r1+r2+PAD*2+10),BG);D=ImageDraw.Draw(S)
D.text((PAD,12),"The level-up page with three backdrops (the same man, at level 5). In the draft they take turns, a man each.",font=F(22),fill=WH)
caps=["A  The dark stage (as now)","B  The base behind him","C  The battlefield behind him"]
for i in range(3):
    x=PAD+i*(pw+12);D.text((x,44),caps[i],font=F(17),fill=GO);S.paste(ph[i].resize((pw,phh),Image.LANCZOS),(x,72))
x=PAD+(pw+12)*3
for i in range(2):
    y=44+i*(lh+34);D.text((x,y),"Phone on its side:  "+caps[i+1],font=F(16),fill=GO);S.paste(ls[i].resize((lw,lh),Image.LANCZOS),(x,y+26))
y0=r1+PAD+14
D.text((PAD,y0),"The medal, drawn. A is in the game now, wherever medals show. B and C are other shapes if you'd rather.",font=F(22),fill=WH)
S.paste(md.resize((mw,mh),Image.LANCZOS),(PAD,y0+40))
# where it shows
x=PAD+mw+18;D.text((x,y0+44),"Where it shows",font=F(17),fill=GO)
crops=[('med1p/4-base.png',(0,0,390,52),"the medals you own"),('med1p/2-stats.png',(4,110,386,146),"the company's medal"),('med1p/2-stats.png',(4,538,386,592),"REVIVE: cost / owned"),('med1p/5-hospital.png',(4,166,386,332),"the field hospital"),('med1p/7-recruits.png',(232,108,388,384),"recruits' prices")]
cx,cy=x,y0+74;colw=(W-PAD-x-14)//2
for k,(f,box,cap) in enumerate(crops):
    im=O(f).crop(box)
    if k<4:
        s=colw*1.28/im.size[0] if k!=3 else colw*1.28/im.size[0];s=min(s,1.5);im=im.resize((int(im.size[0]*s),int(im.size[1]*s)),Image.LANCZOS)
        D.text((cx,cy),cap,font=F(13,False),fill=DIM);S.paste(im,(cx,cy+18));cy+=im.size[1]+18+12
    else:
        s=min(1.45,(S.size[1]-(y0+74)-30-PAD)/im.size[1]);im=im.resize((int(im.size[0]*s),int(im.size[1]*s)),Image.LANCZOS);xx=W-PAD-im.size[0]
        D.text((xx,y0+74),cap,font=F(13,False),fill=DIM);S.paste(im,(xx,y0+92))
S.save(sys.argv[1] if len(sys.argv)>1 else 'sheet243.jpg',quality=90);print(S.size)
