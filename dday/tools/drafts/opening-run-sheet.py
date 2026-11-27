# a contact sheet of opening-run-film.js's frames: python3 opening-run-sheet.py DIR OUT.jpg [every=2] [cols=8] [tile width=195] [from frame] [to frame]
import sys,os,json
from PIL import Image,ImageDraw,ImageFont
d,out=sys.argv[1],sys.argv[2];ev=int(sys.argv[3]) if len(sys.argv)>3 else 2;cols=int(sys.argv[4]) if len(sys.argv)>4 else 8;tw=int(sys.argv[5]) if len(sys.argv)>5 else 195
f0=int(sys.argv[6]) if len(sys.argv)>6 else 0;f1=int(sys.argv[7]) if len(sys.argv)>7 else 10**6
fs=sorted(f for f in os.listdir(d) if f.startswith('f-') and f.endswith('.png'));ph=json.load(open(os.path.join(d,'phases.json'))) if os.path.exists(os.path.join(d,'phases.json')) else []
sel=[(i,f) for i,f in enumerate(fs) if f0<=i<=f1 and (i-f0)%ev==0]
im0=Image.open(os.path.join(d,sel[0][1]));th=int(tw*im0.height/im0.width);rows=(len(sel)+cols-1)//cols
S=Image.new('RGB',(cols*(tw+4)+4,rows*(th+4)+4),(17,19,21));dr=ImageDraw.Draw(S);F=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',11)
for k,(i,f) in enumerate(sel):
    x=4+(k%cols)*(tw+4);y=4+(k//cols)*(th+4);S.paste(Image.open(os.path.join(d,f)).convert('RGB').resize((tw,th),Image.LANCZOS),(x,y))
    t='%d %s'%(i,ph[i] if i<len(ph) else '');w=dr.textlength(t,font=F);dr.rectangle([x,y,x+w+8,y+15],fill=(0,0,0));dr.text((x+4,y+1),t,fill=(255,220,120),font=F)
S.save(out,quality=86);print(out,S.size,len(sel))
