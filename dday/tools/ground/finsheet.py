import sys
from PIL import Image, ImageDraw
# finsheet.py OUT BASEDIR NEWDIR scale pairsPerRow
out,bd,nd=sys.argv[1:4];k=float(sys.argv[4]);per=int(sys.argv[5])
S=['ride','ramp','beach','wire','draw','top','counter','village']
cells=[]
for s in S:
    a=Image.open(f'{bd}/{s}.png').convert('RGB');b=Image.open(f'{nd}/{s}.png').convert('RGB')
    a=a.resize((int(a.width*k),int(a.height*k)));b=b.resize((int(b.width*k),int(b.height*k)))
    c=Image.new('RGB',(a.width*2+6,a.height+20),(18,18,18));c.paste(a,(0,20));c.paste(b,(a.width+6,20))
    d=ImageDraw.Draw(c);d.text((4,4),s+'  v187',fill=(220,220,220));d.text((a.width+10,4),s+'  v188 ground',fill=(255,230,150));cells.append(c)
cw,ch=cells[0].size;rows=(len(cells)+per-1)//per
O=Image.new('RGB',(per*cw+(per-1)*14,rows*ch+(rows-1)*10),(40,40,40))
for i,c in enumerate(cells):O.paste(c,((i%per)*(cw+14),(i//per)*(ch+10)))
O.save(out,quality=88)
