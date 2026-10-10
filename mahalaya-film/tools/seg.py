import numpy as np
from PIL import Image, ImageFilter
im = Image.open('tools/character_sheet.png').convert('RGB')
a = np.asarray(im.filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
R,G,B = a[...,0],a[...,1],a[...,2]
H,W = R.shape
# edge magnitude
gray = a.mean(2)
gx = np.zeros_like(gray); gy = np.zeros_like(gray)
gx[:,1:-1] = gray[:,2:]-gray[:,:-2]; gy[1:-1] = gray[2:]-gray[:-2]
edge = np.hypot(gx,gy)
# chroma edge too
ce = np.zeros_like(gray)
for c in range(3):
    ch=a[...,c]; e=np.zeros_like(ch); e[:,1:-1]=np.abs(ch[:,2:]-ch[:,:-2]); e[1:-1]=np.maximum(e[1:-1],np.abs(ch[2:]-ch[:-2])); ce=np.maximum(ce,e)
cand = (R>195)&(R-B>48)&(R-B<125)&(G>150)&(edge<14)&(ce<18)
seed = np.zeros((H,W),bool)
seed[0,:]=seed[-1,:]=seed[:,0]=seed[:,-1]=True
m = seed & cand
for i in range(3000):
    n = m.copy()
    n[1:]|=m[:-1]; n[:-1]|=m[1:]; n[:,1:]|=m[:,:-1]; n[:,:-1]|=m[:,1:]
    n &= cand
    if (n==m).all(): break
    m = n
print('iters',i, 'bg frac', m.mean())
np.save('work/bgmask.npy', m)
Image.fromarray((m*255).astype(np.uint8)).save('work/bgmask.png')
