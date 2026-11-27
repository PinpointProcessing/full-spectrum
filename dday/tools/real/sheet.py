import sys,os
from PIL import Image,ImageDraw,ImageFont
# python3 sheet.py OUT.jpg cols tileW img1 img2 ...   (labels from file names)
out,cols,tw=sys.argv[1],int(sys.argv[2]),int(sys.argv[3]);files=sys.argv[4:]
ims=[Image.open(f).convert('RGB') for f in files];th=int(tw*ims[0].height/ims[0].width)
rows=(len(ims)+cols-1)//cols;S=Image.new('RGB',(cols*tw,rows*(th+18)),(18,20,22));d=ImageDraw.Draw(S)
try:f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',12)
except: f=ImageFont.load_default()
for i,im in enumerate(ims):
    x,y=(i%cols)*tw,(i//cols)*(th+18);S.paste(im.resize((tw,th),Image.LANCZOS),(x,y+18));d.text((x+4,y+2),os.path.basename(files[i]).replace('.png',''),fill=(230,230,220),font=f)
S.save(out,quality=88);print(out,S.size)
