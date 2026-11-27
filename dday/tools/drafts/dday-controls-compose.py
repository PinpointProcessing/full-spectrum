# The two draft sheets from dday-controls-draft.js's pictures: python3 dday-controls-compose.py IN_DIR OUT_DIR
import sys
from PIL import Image,ImageDraw,ImageFont
IN,OUT=sys.argv[1],sys.argv[2]
B='/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf';R='/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf'
ft,fs,fc=ImageFont.truetype(B,26),ImageFont.truetype(R,15),ImageFont.truetype(B,15)
def wrap(d,text,font,w):
    out,line=[],''
    for word in text.split():
        t=(line+' '+word).strip()
        if d.textlength(t,font=font)<=w:line=t
        else:out.append(line);line=word
    if line:out.append(line)
    return out
def sheet(title,sub,frames,name):
    W,H,G,T=390,760,24,96
    caps=[]
    tmp=ImageDraw.Draw(Image.new('RGB',(10,10)))
    for f,head,body in frames:caps.append([head]+wrap(tmp,body,fs,W-8))
    capH=max(len(c) for c in caps)*21+18
    img=Image.new('RGB',(G+len(frames)*(W+G),T+H+capH+G),(18,22,26));d=ImageDraw.Draw(img)
    d.text((G,20),title,font=ft,fill=(236,240,243));d.text((G,58),sub,font=fs,fill=(160,172,182))
    for i,(f,head,body) in enumerate(frames):
        x=G+i*(W+G);im=Image.open(f'{IN}/{f}.png').convert('RGB');img.paste(im,(x,T))
        d.rectangle([x-1,T-1,x+W,T+H],outline=(70,80,90))
        y=T+H+12;d.text((x,y),caps[i][0],font=fc,fill=(255,207,74));y+=22
        for line in caps[i][1:]:d.text((x,y),line,font=fs,fill=(214,221,226));y+=21
    img.save(f'{OUT}/{name}',optimize=True);print(name,img.size)
sheet('Draft 1 · You lead one squad, the other backs you up','The village field, a phone held upright. Alpha blue, Bravo orange. The team tabs are gone; the swap button and FOLLOW / HOLD sit under your right thumb.',[
  ('d1a','1. Alpha is yours, Bravo follows','Bravo keeps 10-15 m behind you, takes cover near you and fires at what you fire at. It never sets off on a route of its own.'),
  ('d1b','2. Tap the swap button','Bravo is yours now and Alpha follows. The two squads are always close, so the camera only slides a few metres instead of flying across the map.'),
  ('d1c','3. HOLD, then flank','Set Bravo to HOLD: it stays at the wall and pins the machine gun. Then take Alpha round the side; the move shows FLANK where the gun can’t turn on you.')],'dday-controls-draft-1.png')
sheet('Draft 2 · Tap the target, then pick what to do; drag to throw','Same field (and the beach for the wire). The game runs at quarter speed while a ring of actions is up. Nothing stays “in your hand”, so there are no dead taps after a throw.',[
  ('d2a','1. Tap an enemy','Your squad opens fire on him at once: a thin line from each man who can hit him, an eye over one who can’t. His ring offers Suppress, Grenade and Bazooka, each with who would do it and how far. Ignore it and it fades.'),
  ('d2b','2. Tap a thing','The same for things. Tap the wire and you get the ways to break it, with who carries each one: a grenade, a rifle grenade, the Bazooka.'),
  ('d2c','3. Throw at a spot: press and drag','Press Grenade on the bar and drag onto the map. You see who throws, the arc and where it lands. Let go to throw; drag back to the bar to cancel.'),
  ('d2d','4. Too far','The circle turns red and says how far he can throw. Let go there and nothing is thrown.')],'dday-controls-draft-2.png')
