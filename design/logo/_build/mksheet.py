import json, io, re, cairosvg
from PIL import Image, ImageDraw, ImageFont
exec(open('build.py').read())
GEIST='/usr/share/fonts/truetype/sand-box/google/Geist/Geist-VariableFont_wght.ttf'
def F(path,size,w):
    f=ImageFont.truetype(path,size)
    try: f.set_variation_by_axes([w])
    except Exception: pass
    return f
mono=F(GM,20,500); monos=F(GM,16,500); body=F(GEIST,22,500); head=F(HG,46,600); sub=F(GEIST,20,400)
def r(svgs,w,h=None):
    return Image.open(io.BytesIO(cairosvg.svg2png(bytestring=svgs.encode(),output_width=w,output_height=h or w))).convert('RGBA')
def mk(d,fill,size): return r(svg(512,512,placed(d,fill,36,36,440)),size)
W=1800; cols=4; cw=W//cols
rows=[]
H=3000
S=Image.new('RGB',(W,H),'#FFFFFF'); D=ImageDraw.Draw(S)
D.text((60,48),'Traced mark',font=head,fill=INK)
D.text((60,110),'Douglas\'s reference, retraced, plus three subtle Traced changes. Chosen: A, via ring. Lume #C8FF6A on #0B0B0B.',font=sub,fill='#5A6058')
labels={'ref':('REFERENCE','Douglas\'s jpg, as sent'),'a':('A  VIA RING','dot in the centre hole'),
        'b':('B  SMD PAD','right arm ends in a square pad'),'c':('C  SOURCE VIA','big terminal drilled like a via')}
order=['ref','a','b','c']
# row 1 white
y=170; ch=420
refimg=Image.open('/workspace/traced-refs/logo-ref.jpg').convert('RGB')
for i,n in enumerate(order):
    x=i*cw
    if n=='ref':
        im=refimg.crop((120,150,610,600)).resize((380,349),Image.LANCZOS); S.paste(im,(x+(cw-380)//2,y+20))
    else:
        im=mk(P[n],INK,380); S.paste(im,(x+(cw-380)//2,y),im)
    t,s=labels[n]; D.text((x+50,y+ch-20),t,font=mono,fill=INK); D.text((x+50,y+ch+8),s,font=sub,fill='#5A6058')
    if n==REC:
        D.rounded_rectangle((x+cw-160,y+ch-24,x+cw-50,y+ch+6),radius=4,fill=INK); D.text((x+cw-146,y+ch-21),'CHOSEN',font=monos,fill=LUME)
# row 2 dark
y2=y+ch+60; dh=520
D.rectangle((0,y2,W,y2+dh),fill=BG)
for i,n in enumerate(order):
    x=i*cw
    im=mk(P[n],LUME if n!='ref' else FG,380); S.paste(im,(x+(cw-380)//2,y2+20),im)
    t,_=labels[n]; D.text((x+50,y2+dh-70),t+('  (retraced vector)' if n=='ref' else ''),font=mono,fill=FG3 if n!=REC else LUME)
# row 3 lockups
y3=y2+dh+50
D.text((60,y3),'LOCKUP  Host Grotesk 600, outlined. Secondary: Geist Mono caps.',font=mono,fill='#5A6058')
y3+=44
D.rectangle((0,y3,W,y3+300),fill=BG)
a=r(L['lockup-on-dark.svg'],640,None) if False else None
def rl(name,width):
    s=L[name]; w=int(re.search(r'width="(\d+)"',s).group(1)); h=int(re.search(r'height="(\d+)"',s).group(1))
    return r(s,width,int(width*h/w))
for k,x in (('lockup-on-dark.svg',60),('lockup-tapeout-on-dark.svg',960)):
    im=rl(k,720); S.paste(im,(x,y3+(300-im.height)//2),im)
y4=y3+320
for k,x in (('lockup-black.svg',60),('lockup-tapeout-black.svg',960)):
    im=rl(k,720); S.paste(im,(x,y4),im)
# row 4 small sizes
y5=y4+300
D.text((60,y5),'SMALL SIZES  actual pixels 16 / 24 / 32, then the same pixels zoomed (4x, 4x, 3x)',font=mono,fill='#5A6058')
y5+=50
pick=lambda n,sz: n if n!='cs' else (f'{REC}16' if sz==16 else f'{REC}32')
labels['cs']=('A  FAVICON CUTS','')
for n in order+['cs']:
    yy=y5
    D.text((60,yy+60),labels[n][0],font=monos,fill=INK)
    if n=='cs': D.text((60,yy+84),'thickened, used <=32px',font=monos,fill='#5A6058')
    for k,(bgc,fg) in enumerate((('#F4F5F2',INK),(BG,LUME))):
        x0=300+k*750
        D.rectangle((x0,yy,x0+730,yy+150),fill=bgc)
        xx=x0+24
        for sz in (16,24,32):
            im=mk(P[pick(n,sz)],fg,round(sz*512/440)); S.paste(im,(xx,yy+75-im.height//2),im); xx+=im.width+14
        xx+=30
        for sz in (16,24,32):
            im=mk(P[pick(n,sz)],fg,round(sz*512/440)); z=4 if sz<32 else 3
            big=im.resize((im.width*z,im.height*z),Image.NEAREST); S.paste(big,(xx,yy+75-big.height//2),big); xx+=big.width+16
    y5+=166
yy=y5
S=S.crop((0,0,W,yy+40))
S.save('/workspace/traced/design/logo/logo-sheet.png'); print(S.size, yy)
