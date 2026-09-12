import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SP="/tmp/claude-0/-home-user-reshape/8b25866e-ef91-5793-bf6d-9236cf1024b0/scratchpad"
S=1.5  # 720x1280 -> 1080x1920

def catmull(pts, n=24):
    """Smooth a polyline through points."""
    p=[pts[0]]+list(pts)+[pts[-1]]
    out=[]
    for i in range(len(p)-3):
        p0,p1,p2,p3=p[i],p[i+1],p[i+2],p[i+3]
        for j in range(n):
            t=j/n; t2=t*t; t3=t2*t
            x=0.5*((2*p1[0])+(-p0[0]+p2[0])*t+(2*p0[0]-5*p1[0]+4*p2[0]-p3[0])*t2+(-p0[0]+3*p1[0]-3*p2[0]+p3[0])*t3)
            y=0.5*((2*p1[1])+(-p0[1]+p2[1])*t+(2*p0[1]-5*p1[1]+4*p2[1]-p3[1])*t2+(-p0[1]+3*p1[1]-3*p2[1]+p3[1])*t3)
            out.append((x,y))
    out.append(p[-1])
    return out

# --- Lat regions measured on hero frame 502 (720x1280 source coords) ---
# Frame-LEFT = athlete's RIGHT lat.  Outer edge follows torso silhouette,
# inner edge is the medial border of the visible lat sweep.
L_OUTER=[(220,762),(207,800),(214,842),(233,883),(252,921),(265,947)]
L_INNER=[(291,943),(296,901),(291,859),(283,817),(275,783),(265,759)]
R_OUTER=[(490,764),(503,800),(496,842),(477,883),(460,921),(449,947)]
R_INNER=[(425,943),(420,901),(425,859),(433,817),(441,783),(449,761)]

def lat_polys(scale=S, dx=0.0, dy=0.0):
    def mk(o,i):
        pts=catmull(o)+catmull(i)
        return [((x+dx)*scale,(y+dy)*scale) for x,y in pts]
    return mk(L_OUTER,L_INNER), mk(R_OUTER,R_INNER)

def draw_lats(size, alpha=1.0, color=(255,64,58), glow=True, scale=S, dx=0.0, dy=0.0):
    """Return RGBA layer with both lat regions filled + rim light."""
    W,H=size
    left,right=lat_polys(scale,dx,dy)
    fill=Image.new("L",(W,H),0)
    fd=ImageDraw.Draw(fill)
    for poly in (left,right):
        fd.polygon(poly, fill=255)
    fill=fill.filter(ImageFilter.GaussianBlur(9))
    rim=Image.new("L",(W,H),0)
    rd=ImageDraw.Draw(rim)
    for poly in (left,right):
        rd.line(poly+[poly[0]], fill=255, width=4, joint="curve")
    rim=rim.filter(ImageFilter.GaussianBlur(3))
    layer=Image.new("RGBA",(W,H),(0,0,0,0))
    col=Image.new("RGBA",(W,H),color+(255,))
    a=np.array(fill).astype(float)*0.42 + np.array(rim).astype(float)*0.78
    if glow:
        g=np.array(fill.filter(ImageFilter.GaussianBlur(34))).astype(float)*0.30
        a=np.maximum(a,g)
    a=np.clip(a*alpha,0,255).astype(np.uint8)
    col.putalpha(Image.fromarray(a))
    return col

if __name__=="__main__":
    base=Image.open(f"{SP}/hero_502.png").convert("RGB").resize((1080,1920), Image.LANCZOS)
    for name,col in (("red",(255,62,58)),("cyan",(34,226,214))):
        im=base.copy()
        dark=Image.new("RGBA",im.size,(4,6,14,150))
        im=Image.alpha_composite(im.convert("RGBA"),dark)
        im=Image.alpha_composite(im, draw_lats(im.size,1.0,col))
        im.convert("RGB").save(f"{SP}/prev_{name}.png")
        im.convert("RGB").crop((150,1000,900,1560)).save(f"{SP}/prevc_{name}.png")
    print("ok")
