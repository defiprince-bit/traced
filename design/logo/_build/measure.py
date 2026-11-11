import numpy as np
from PIL import Image
from scipy import ndimage as ndi
im=np.array(Image.open('/workspace/traced-refs/logo-ref.jpg').convert('L')).astype(float)
b=im<128
dist=ndi.distance_transform_edt(b)
# local maxima of distance = blob centers
mx=ndi.maximum_filter(dist,size=25)
pk=np.argwhere((dist==mx)&(dist>12))
for y,x in pk: print('peak',x,y,round(dist[y,x],1))
# hole
lab,n=ndi.label(~b)
for i in range(1,n+1):
    ys,xs=np.where(lab==i)
    if len(xs)<20000: print('hole',xs.mean(),ys.mean(),np.sqrt(len(xs)/np.pi))
