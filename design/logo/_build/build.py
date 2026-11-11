import json, re, io, os
import numpy as np, cairosvg, uharfbuzz as hb
from fontTools.ttLib import TTFont
from fontTools.varLib import instancer
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.pens.boundsPen import BoundsPen
from PIL import Image, ImageDraw, ImageFont

OUT='/workspace/traced/design/logo'
LUME='#C8FF6A'; BG='#0B0B0B'; FG='#F2F4EF'; FG3='#7E847C'; INK='#0B0B0B'
REC='c'
P=json.load(open('paths.json'))
NOTE={'a':'Variant A - via ring: a concentric via dot sits in the centre hole',
      'b':'Variant B - SMD pad: the long right arm ends in a rounded-square pad instead of a round blob',
      'c':'Variant C - source via: the big upper-left terminal is drilled like a via (the source)',
      'ref':'Reference retrace'}

def bbox(d):
    n=[float(v) for v in re.findall(r'-?\d+\.?\d*',d)]; xs,ys=n[0::2],n[1::2]
    return min(xs),min(ys),max(xs),max(ys)
BB=bbox(P['ref'])

def svg(w,h,body,vb=None):
    vb=vb or f'0 0 {w} {h}'
    return f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="{vb}">{body}</svg>\n'
def pathel(d,fill,title=None):
    t=f'<title>{title}</title>' if title else ''
    return f'{t}<path fill="{fill}" fill-rule="evenodd" d="{d}"/>'
def write(name,s):
    open(os.path.join(OUT,name),'w').write(s)
def png(s,name,w,h=None):
    cairosvg.svg2png(bytestring=s.encode(),write_to=os.path.join(OUT,name),output_width=w,output_height=h or w)

def placed(d,fill,x,y,size):
    """mark scaled so its larger bbox side = size, centred in a size box at x,y"""
    x0,y0,x1,y1=BB; w,h=x1-x0,y1-y0; s=size/max(w,h)
    tx=x+(size-w*s)/2-x0*s; ty=y+(size-h*s)/2-y0*s
    return f'<path fill="{fill}" fill-rule="evenodd" transform="translate({tx:.3f} {ty:.3f}) scale({s:.5f})" d="{d}"/>'

# ---------- marks ----------
for v in ['a','b','c']:
    write(f'mark-{v}.svg',svg(512,512,pathel(P[v],INK,NOTE[v])))
M=P[REC]
write('mark.svg',svg(512,512,pathel(M,INK,'Traced mark')))
write('mark-green.svg',svg(512,512,pathel(M,LUME,'Traced mark, lume')))
write('mark-mono-white.svg',svg(512,512,pathel(M,'#FFFFFF','Traced mark, white')))
def tile(d,size=512,rx=112,pad=0.13,full=False):
    r='' if full else f' rx="{rx*size/512:.2f}"'
    inner=size*(1-2*pad)
    return svg(size,size,f'<rect width="{size}" height="{size}"{r} fill="{BG}"/>'+placed(d,LUME,size*pad,size*pad,inner))
write('mark-on-dark.svg',tile(M))

# ---------- favicons + avatar ----------
fav_small=lambda d: tile(d,512,rx=96,pad=0.06)       # 16/32: mark as large as possible
M16,M32=P['c16'],P['c32']       # optically thickened small-size cuts of the recommended mark
write('mark-small-16.svg',svg(512,512,pathel(M16,INK,'Traced mark, 16px cut')))
write('mark-small-32.svg',svg(512,512,pathel(M32,INK,'Traced mark, 24-32px cut')))
write('favicon.svg',fav_small(M32))
png(fav_small(M16),'favicon-16.png',16); png(fav_small(M32),'favicon-32.png',32)
png(tile(M,512,rx=0,pad=0.13,full=True),'favicon-180.png',180)   # apple-touch: iOS rounds it
png(tile(M),'favicon-512.png',512)
png(tile(M,400,pad=0.2,full=True),'x-avatar-400.png',400)          # X crops to a circle
png(tile(M,512),'mark-on-dark.png',1024)

# ---------- wordmark outlines ----------
def text_outline(fontfile, text, wght, size, tracking=0.0, upper=False):
    tt=TTFont(fontfile); tt=instancer.instantiateVariableFont(tt,{'wght':wght})
    upem=tt['head'].unitsPerEm; gs=tt.getGlyphSet(); order=tt.getGlyphOrder()
    blob=hb.Blob.from_file_path(fontfile); face=hb.Face(blob); font=hb.Font(face)
    font.set_variations({'wght':wght})
    buf=hb.Buffer(); buf.add_str(text.upper() if upper else text); buf.guess_segment_properties()
    hb.shape(font,buf,{'kern':True,'liga':True})
    sc=size/upem; x=0; pen=SVGPathPen(gs); bp=BoundsPen(gs)
    for info,pos in zip(buf.glyph_infos,buf.glyph_positions):
        g=order[info.codepoint]
        tp=TransformPen(pen,(sc,0,0,-sc,(x+pos.x_offset)*sc,-pos.y_offset*sc)); gs[g].draw(tp)
        tb=TransformPen(bp,(sc,0,0,-sc,(x+pos.x_offset)*sc,-pos.y_offset*sc)); gs[g].draw(tb)
        x+=pos.x_advance+tracking*upem
    cap=tt['OS/2'].sCapHeight*sc
    return pen.getCommands(), bp.bounds, cap   # baseline at y=0

HG='HostGrotesk.ttf'; GM='/usr/share/fonts/truetype/sand-box/google/Geist Mono/GeistMono-VariableFont_wght.ttf'
WM_D,WM_B,CAP=text_outline(HG,'Traced',600,100,tracking=-0.03)
SUB_D,SUB_B,SUBCAP=text_outline(GM,'for TapeOut',500,30,tracking=0.08,upper=True)

def lockup(markfill,wordfill,subfill,sub=False,bg=None):
    MH=128                                  # mark box size
    gap=30
    # wordmark: cap height = 0.5 * mark box, vertically centred on mark
    s=0.5*MH/CAP
    wx=MH+gap-WM_B[0]*s
    if not sub:
        base=MH/2+CAP*s/2
        H=MH; parts=[placed(M,markfill,0,0,MH),
               f'<path fill="{wordfill}" transform="translate({wx:.2f} {base:.2f}) scale({s:.4f})" d="{WM_D}"/>']
        W=MH+gap+(WM_B[2]-WM_B[0])*s
    else:
        ss=s*0.62
        block=CAP*s+18+SUBCAP*ss*1.0
        top=(MH-block)/2
        base=top+CAP*s; sbase=base+18+SUBCAP*ss
        parts=[placed(M,markfill,0,0,MH),
               f'<path fill="{wordfill}" transform="translate({wx:.2f} {base:.2f}) scale({s:.4f})" d="{WM_D}"/>',
               f'<path fill="{subfill}" transform="translate({MH+gap+2-SUB_B[0]*ss:.2f} {sbase:.2f}) scale({ss:.4f})" d="{SUB_D}"/>']
        W=MH+gap+max((WM_B[2]-WM_B[0])*s,(SUB_B[2]-SUB_B[0])*ss+2)
        H=MH
    pad=24; W=W+2*pad; H=H+2*pad
    b=(f'<rect width="{W:.0f}" height="{H:.0f}" rx="20" fill="{bg}"/>' if bg else '')
    return svg(round(W),round(H),b+f'<g transform="translate({pad} {pad})">'+''.join(parts)+'</g>')

L={
 'lockup-on-dark.svg':lockup(LUME,FG,FG3),
 'lockup-black.svg':lockup(INK,INK,'#5A6058'),
 'lockup-white.svg':lockup('#FFFFFF','#FFFFFF','#A6ABA3'),
 'lockup-tapeout-on-dark.svg':lockup(LUME,FG,FG3,sub=True),
 'lockup-tapeout-black.svg':lockup(INK,INK,'#5A6058',sub=True),
 'lockup-on-dark-tile.svg':lockup(LUME,FG,FG3,bg=BG),
 'lockup-tapeout-on-dark-tile.svg':lockup(LUME,FG,FG3,sub=True,bg=BG),
}
for k,v in L.items():
    write(k,v)
    w=int(re.search(r'width="(\d+)"',v).group(1)); h=int(re.search(r'height="(\d+)"',v).group(1))
    if 'tile' in k: png(v,k.replace('.svg','.png'),w*3,h*3)
print('ok', CAP, SUBCAP)
