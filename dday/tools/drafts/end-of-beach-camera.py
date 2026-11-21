# the five pictures of end-of-beach-camera.js for two copies of the game, one row each: python3 end-of-beach-camera.py DIR [OUT.jpg]
# (DIR holds before-1.png .. before-5.png and after-1.png .. after-5.png)
import sys
from PIL import Image, ImageDraw, ImageFont
D=sys.argv[1];OUT=sys.argv[2] if len(sys.argv)>2 else D+'/end-of-beach-camera.jpg'
cols=['At the end of the beach','Sent to the pillbox','At the pillbox','Sent up the first hill','On the first hill']
rows=[('before','Version 182 (now)'),('after','Version 183 (fixed)')]
W,H=390,760;s=0.62;w,h=int(W*s),int(H*s);pad=36;lab=150
sheet=Image.new('RGB',(lab+w*5+12*4,pad+(h+pad)*2),'#101418');d=ImageDraw.Draw(sheet)
try:f=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',15);f2=ImageFont.truetype('/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf',17)
except Exception:f=f2=ImageFont.load_default()
for j,c in enumerate(cols):d.text((lab+j*(w+12)+4,10),c,fill='#e8edf0',font=f)
for i,(tag,name) in enumerate(rows):
  y=pad+i*(h+pad);d.text((8,y+h//2-10),name.split(' (')[0],fill='#ffe14a',font=f2);d.text((8,y+h//2+12),'('+name.split(' (')[1],fill='#c8d0d6',font=f)
  for j in range(5):sheet.paste(Image.open(f'{D}/{tag}-{j+1}.png').convert('RGB').resize((w,h)),(lab+j*(w+12),y))
sheet.save(OUT,quality=88);print(OUT,sheet.size)
