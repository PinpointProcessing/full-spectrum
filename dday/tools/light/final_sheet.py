# final_sheet.py OUT BASEDIR NEWDIR scale pairs_per_row [scenes] : each scene as a pair, Version 187 left, Version 188 light right
import sys
from PIL import Image,ImageDraw
out,bd,nd,sc,per=sys.argv[1],sys.argv[2],sys.argv[3],float(sys.argv[4]),int(sys.argv[5])
S=(sys.argv[6] if len(sys.argv)>6 else 'ride,ramp,beach,wire,draw,top,counter,village').split(',')
def ld(p):
    im=Image.open(p).convert('RGB');return im.resize((int(im.width*sc),int(im.height*sc)),Image.LANCZOS)
P=[(s,ld(f'{bd}/{s}.png'),ld(f'{nd}/{s}.png')) for s in S]
w,h=P[0][1].size;gap=4;pw=2*w+gap+14;rows=(len(P)+per-1)//per
O=Image.new('RGB',(per*pw,rows*(h+20)),(14,14,14));D=ImageDraw.Draw(O)
for i,(s,a,b) in enumerate(P):
    x=(i%per)*pw;y=(i//per)*(h+20)
    O.paste(a,(x,y+18));O.paste(b,(x+w+gap,y+18))
    D.text((x+3,y+3),f'{s}: Version 187',fill=(200,200,200));D.text((x+w+gap+3,y+3),'Version 188 light',fill=(255,230,150))
O.save(out,quality=88)
