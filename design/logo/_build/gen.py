import numpy as np, time, json, sys
from PIL import Image
from scipy import ndimage as ndi
import potrace
from fit import contours,resample,csmooth,fit_closed,path_d

OPTI=False
SMOOTH=2.0
CS=10
CLOSE=0
S=4                     # supersample factor (bitmap px per ref px)
X0,Y0,W,H=110,140,520,470
im=np.array(Image.open('/workspace/traced-refs/logo-ref.jpg').convert('L')).astype(float)
im=ndi.gaussian_filter(im,1.3)[Y0:Y0+H,X0:X0+W]
up=np.array(Image.fromarray(im).resize((W*S,H*S),Image.BICUBIC))
ink=up<128
ink=ndi.binary_fill_holes(ink)          # body without hole; hole is re-cut as a true circle
sdf=(ndi.distance_transform_edt(~ink)-ndi.distance_transform_edt(ink))/S   # ref-px units, <0 inside
def redist(mask): return (ndi.distance_transform_edt(~mask)-ndi.distance_transform_edt(mask))/S
sdf=ndi.gaussian_filter(sdf,SMOOTH*S)
# morphological closing: rounds the concave neck/blob junctions with a min radius CLOSE
if CLOSE: sdf=redist(redist(sdf<CLOSE)<-CLOSE)
if CLOSE: sdf=ndi.gaussian_filter(sdf,0.8*S)
yy,xx=np.mgrid[0:H*S,0:W*S]
X=xx/S+X0; Y=yy/S+Y0                     # ref coordinates

def circ(cx,cy,r): return np.hypot(X-cx,Y-cy)-r
def rbox(cx,cy,hw,hh,rad,ang):
    c,s=np.cos(ang),np.sin(ang)
    u=(X-cx)*c+(Y-cy)*s; v=-(X-cx)*s+(Y-cy)*c
    qx=np.abs(u)-hw+rad; qy=np.abs(v)-hh+rad
    return np.hypot(np.maximum(qx,0),np.maximum(qy,0))+np.minimum(np.maximum(qx,qy),0)-rad
def ucap(ax,ay,ra,bx,by,rb):
    # iq's uneven capsule: tapered segment from a (radius ra) to b (radius rb)
    px,py=X-ax,Y-ay; bx,by=bx-ax,by-ay; h=bx*bx+by*by
    qx=np.abs((px*by-py*bx)/h); qy=(px*bx+py*by)/h
    bb=ra-rb; cx,cy=np.sqrt(h-bb*bb),bb
    k=cx*qy-cy*qx; m=cx*qx+cy*qy; n=qx*qx+qy*qy
    return np.where(k<0,np.sqrt(h*n)-ra,np.where(k>cx,np.sqrt(np.maximum(h*(n+1-2*qy),0))-rb,m-ra))
def smin(a,b,k):
    h=np.clip(.5+.5*(b-a)/k,0,1); return b*(1-h)+a*h-k*h*(1-h)
def smax(a,b,k): return -smin(-a,-b,k)

HOLE=(370.65,384.64,45.3)
UL=(273,228,42.7); RT=(547,269,31.9); LL=(241.5,518,31.8); LF=(181.5,313,24.5)

PADT0,PADT1,PADH,PADR=12,54,28,7.5
def body(): return sdf.copy()
def cut_hole(d): return np.maximum(d,-circ(*HOLE))

def variant(name):
    d=body()
    if name=='ref':
        d=cut_hole(d)
    elif name=='a':     # via ring: concentric dot in the centre hole
        d=cut_hole(d)
        d=np.minimum(d,circ(HOLE[0],HOLE[1],17.5))
    elif name=='b':     # right terminal morphs from a round blob into a square SMD pad
        cx,cy,r=RT
        ai=np.radians(146.5); ux,uy=np.cos(ai),np.sin(ai)
        t=(X-cx)*ux+(Y-cy)*uy                  # distance back along the arm
        w=np.clip((PADT1-t)/(PADT1-PADT0),0,1); w=w*w*(3-2*w)   # 1 at the pad, 0 down the neck
        pad=rbox(cx,cy,PADH,PADH,PADR,ai)
        d=d+w*(pad-circ(cx,cy,r))               # swap circle metric for square metric locally
        d=cut_hole(d)
    elif name=='c':     # source via: the big upper-left terminal is drilled like a via
        d=cut_hole(d)
        d=np.maximum(d,-circ(UL[0],UL[1],16.5))
    elif name=='c32':   # small-size cut of C: arms thickened ~3px, via kept
        d=cut_hole(d-3.0)
        d=np.maximum(d,-circ(UL[0],UL[1],17))
    elif name=='c16':   # 16px cut of C: arms thickened ~7px, via dropped (sub-pixel at 16px)
        d=np.maximum(d-7.0,-circ(HOLE[0],HOLE[1],HOLE[2]-2))
    return d

def trace(d):
    bm=potrace.Bitmap(d>=0)
    pl=bm.trace(turdsize=50,turnpolicy=potrace.POTRACE_TURNPOLICY_MINORITY,alphamax=1.25,opticurve=OPTI,opttolerance=0.15)
    return pl

# output frame: ref coords -> 512 viewBox
def frame(pl):
    pts=[]
    for c in pl:
        pts.append(c.start_point)
        for s in c.segments:
            pts.append(s.end_point)
            if s.is_corner: pts.append(s.c)
            else: pts+= [s.c1,s.c2]
    pts=np.array([(p.x,p.y) if hasattr(p,'x') else p for p in pts],float)
    return pts.min(0),pts.max(0)

def todpath(pl,sc,ox,oy):
    f=lambda p:(f"{(p[0] if not hasattr(p,'x') else p.x)*sc+ox:.2f},{(p[1] if not hasattr(p,'y') else p.y)*sc+oy:.2f}")
    out=[]
    for c in pl:
        out.append('M'+f(c.start_point))
        for s in c.segments:
            if s.is_corner: out.append('L'+f(s.c)+'L'+f(s.end_point))
            else: out.append('C'+f(s.c1)+' '+f(s.c2)+' '+f(s.end_point))
        out.append('Z')
    return ''.join(out)

if __name__=='__main__':
    names=sys.argv[1:] or ['ref','a','b','c']
    TOL=0.12
    fits={}
    for n in names:
        cs=[csmooth(resample(c,0.5),CS) for c in contours(variant(n),S,X0,Y0)]
        fits[n]=[fit_closed(c,TOL) for c in cs]
    refc=contours(variant('ref'),S,X0,Y0)
    allp=np.vstack(refc); lo,hi=allp.min(0),allp.max(0)
    size=hi-lo; sc=440/size.max()
    ox=(512-size[0]*sc)/2-lo[0]*sc; oy=(512-size[1]*sc)/2-lo[1]*sc
    f=lambda p:f"{p[0]*sc+ox:.2f} {p[1]*sc+oy:.2f}"
    try: paths=json.load(open('paths.json'))
    except Exception: paths={}
    for n,fl in fits.items():
        paths[n]=path_d(fl,f); print(n,len(paths[n]),[len(x) for x in fl])
    json.dump(paths,open('paths.json','w'))
