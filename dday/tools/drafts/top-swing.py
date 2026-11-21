# top-swing.js's three pictures for two copies of the game, one row each: python3 top-swing.py BEFORE_DIR AFTER_DIR [OUT.jpg]
# (each holds ramp.png, top.png and on.png)
import sys
from PIL import Image, ImageDraw, ImageFont
B,A=sys.argv[1],sys.argv[2];OUT=sys.argv[3] if len(sys.argv)>3 else 'top-swing.jpg'
cols=[('ramp','On the ramp'),('top','At the top of the ramp'),('on','On up')]
rows=[(B,'Version 185','(before)'),(A,'Version 186','(now)')]
W,H=390,760;s=0.62;w,h=int(W*s),int(H*s);pad=34;lab=140;gap=12
sheet=Image.new('RGB',(lab+w*len(cols)+gap*(len(cols)-1)+8,pad+(h+pad)*2),'#101418');d=ImageDraw.Draw(sheet)
try:f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',14);f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',17)
except Exception:f=f2=ImageFont.load_default()
for j,(t,c) in enumerate(cols):d.text((lab+j*(w+gap)+4,10),c,fill='#e8edf0',font=f)
for i,(D,name,note) in enumerate(rows):
  y=pad+i*(h+pad);d.text((8,y+h//2-12),name,fill='#ffe14a' if i else '#e8edf0',font=f2);d.text((8,y+h//2+10),note,fill='#c8d0d6',font=f)
  for j,(t,c) in enumerate(cols):sheet.paste(Image.open(f'{D}/{t}.png').convert('RGB').resize((w,h)),(lab+j*(w+gap),y))
sheet.save(OUT,quality=88);print(OUT,sheet.size)
