import sys
from PIL import Image
out=sys.argv[1]; names=sys.argv[2:] or ['ref','a','b','c']
ims=[Image.open(f'prev-{n}.png').resize((512,512),Image.LANCZOS) for n in names]
s=Image.new('RGB',(512*len(ims),512),'white')
for i,im in enumerate(ims): s.paste(im,(i*512,0))
s.save(out)
