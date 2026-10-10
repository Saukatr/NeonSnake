import numpy as np
from PIL import Image
rng=np.random.default_rng(7)
def fbm(h,w,octaves=6,base=4,persist=0.55,seed=0):
    r=np.random.default_rng(seed); out=np.zeros((h,w)); amp=1; tot=0
    for o in range(octaves):
        f=base*2**o
        g=r.random((f+1,int(f*w/h)+2))
        img=Image.fromarray((g*255).astype('uint8')).resize((w,h),Image.BICUBIC)
        out+=amp*np.asarray(img)/255; tot+=amp; amp*=persist
    return out/tot
H,W=1024,2560
n=fbm(H,W,seed=1); n=(n-n.min())/(n.max()-n.min())
a=np.clip((n-0.45)/0.35,0,1)**1.3
Image.fromarray((a*255).astype('uint8'),'L').save('public/clouds_a.png')
n=fbm(H,W,seed=2,base=3); n=(n-n.min())/(n.max()-n.min())
a=np.clip((n-0.5)/0.3,0,1)**1.1
Image.fromarray((a*255).astype('uint8'),'L').save('public/clouds_b.png')
# mist: horizontally stretched
n=fbm(512,2560,seed=3,base=2,octaves=5); n=(n-n.min())/(n.max()-n.min())
y=np.linspace(0,1,512)[:,None]; band=np.exp(-((y-0.5)/0.28)**2)
a=np.clip((n-0.3)/0.5,0,1)*band
Image.fromarray((a*255).astype('uint8'),'L').save('public/mist.png')
print('ok')
