import numpy as np
from PIL import Image, ImageFilter
im = Image.open('tools/character_sheet.png').convert('RGB')
bg = np.load('work/bgmask.npy')
fg = (~bg).astype(np.uint8)*255
for (x0,y0,x1,y1) in [(80,652,220,716),(325,652,465,716),(555,805,765,885),(1180,652,1330,716),(1450,652,1595,716),(1025,860,1200,915)]:
    fg[y0:y1,x0:x1]=0
A = Image.fromarray(fg).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
# defringe: pull edge colors from interior
rgb = im.copy()
crops = {
 'ganesha':(10,140,295,650),'lakshmi':(295,140,555,650),'durga_trio':(540,0,1250,872),
 'saraswati':(1095,105,1400,650),'kartikeya':(1400,140,1655,645),'mahishasura':(790,505,1250,872),
}
for k,(x0,y0,x1,y1) in crops.items():
    fgk=fg.copy()
    if k in ('durga_trio','mahishasura'): fgk[0:690,1093:]=0
    Ak=Image.fromarray(fgk).filter(ImageFilter.MinFilter(3)).filter(ImageFilter.GaussianBlur(0.9))
    c = rgb.crop((x0,y0,x1,y1)); a = Ak.crop((x0,y0,x1,y1))
    if k=='mahishasura':
        # keep only demon+buffalo: drop lion/Durga region (left of a diagonal) 
        aa=np.asarray(a).astype(float); h,w=aa.shape
        yy,xx=np.mgrid[0:h,0:w]
        keep = np.clip((xx-48)/22,0,1)
        a = Image.fromarray((aa*keep).astype('uint8'))
    out = c.convert('RGBA'); out.putalpha(a)
    W,H = out.size
    out = out.resize((W*2,H*2), Image.LANCZOS)
    r,g,b,al = out.split()
    rgbu = Image.merge('RGB',(r,g,b)).filter(ImageFilter.UnsharpMask(2,60,2))
    out = rgbu.convert('RGBA'); out.putalpha(al)
    out.save(f'public/{k}.png', optimize=True)
    print(k, out.size)
# bells for temple ornaments
b = rgb.crop((30,0,125,145)).convert('RGBA'); b.putalpha(A.crop((30,0,125,145))); b.resize((190,290),Image.LANCZOS).save('public/bell.png')
