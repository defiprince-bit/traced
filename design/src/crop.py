# trim trailing background rows from full-page shots: crop.py file [margin]
import sys
from PIL import Image
f=sys.argv[1]; m=int(sys.argv[2]) if len(sys.argv)>2 else 40
im=Image.open(f).convert('RGB'); w,h=im.size; px=im.load()
bg=px[w-2,h-2]
def blank(y): return all(sum(abs(a-b) for a,b in zip(px[x,y],bg))<12 for x in range(0,w,3))
y=h-1
while y>0 and blank(y): y-=1
im.crop((0,0,w,min(h,y+m))).save(f)
