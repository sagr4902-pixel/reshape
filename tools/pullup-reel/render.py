import os, sys, math, subprocess
import numpy as np
from PIL import Image, ImageDraw, ImageFont, ImageFilter
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from anat import draw_lats, lat_polys

SP = os.path.dirname(os.path.abspath(__file__))
W, H = 1080, 1920
FPS = 30000/1001

# ---------- timeline ----------
F_HERO   = 502           # freeze frame used for the intro anatomy card
F_START  = 108           # first live frame
F_END    = 979           # last live frame (bottom of rep 20)
INTRO    = 122           # frames  (~4.07 s)
OUTRO    = 54            # frames  (~1.80 s)
MAIN     = F_END - F_START + 1
TOTAL    = INTRO + MAIN + OUTRO

# rep completion frames (source indices), verified by motion analysis
REPS = [171,200,228,257,286,316,348,380,411,444,477,511,545,580,616,653,744,784,882,979]
REP_OUT = [INTRO + (f - F_START) for f in REPS]      # output-frame index per rep

# ---------- fonts ----------
FB = "/usr/share/fonts/opentype/inter/InterDisplay-Black.otf"
FC = "/usr/share/fonts/truetype/roboto/unhinted/RobotoCondensed-Bold.ttf"
_fc = {}
def font(path, size):
    k = (path, int(size))
    if k not in _fc: _fc[k] = ImageFont.truetype(path, int(size))
    return _fc[k]

ACCENT = (255, 62, 58)
GREEN  = (44, 214, 120)

# ---------- easing ----------
def clamp(t, a=0.0, b=1.0): return max(a, min(b, t))
def ease_out_cubic(t): return 1 - (1-t)**3
def ease_out_back(t, s=1.9): return 1 + (s+1)*(t-1)**3 + s*(t-1)**2
def smoothstep(t): t = clamp(t); return t*t*(3-2*t)

# ---------- text helpers ----------
def text_mask(txt, fnt, tracking=0):
    """Render text to an L mask; returns (mask, w, h)."""
    if tracking == 0:
        bb = fnt.getbbox(txt)
        w, h = bb[2]-bb[0], bb[3]-bb[1]
        m = Image.new("L", (w+8, h+8), 0)
        ImageDraw.Draw(m).text((4-bb[0], 4-bb[1]), txt, font=fnt, fill=255)
        return m, w+8, h+8
    widths = [fnt.getlength(c) for c in txt]
    total = int(sum(widths) + tracking*(len(txt)-1)) + 8
    bb = fnt.getbbox(txt)
    m = Image.new("L", (total, bb[3]-bb[1]+8), 0)
    d = ImageDraw.Draw(m); x = 4.0
    for c, cw in zip(txt, widths):
        d.text((x, 4-bb[1]), c, font=fnt, fill=255)
        x += cw + tracking
    return m, m.width, m.height

def paste_mask(layer, mask, cx, cy, color, alpha=1.0, shadow=True,
               shadow_blur=16, shadow_alpha=0.55, shadow_dy=5, scale=1.0):
    if alpha <= 0.003: return
    if scale != 1.0:
        nw, nh = max(1,int(mask.width*scale)), max(1,int(mask.height*scale))
        mask = mask.resize((nw, nh), Image.LANCZOS)
    x, y = int(cx - mask.width/2), int(cy - mask.height/2)
    if shadow:
        sh = mask.filter(ImageFilter.GaussianBlur(shadow_blur))
        sh = sh.point(lambda v: int(v*shadow_alpha*alpha))
        blk = Image.new("RGBA", mask.size, (0,0,0,255)); blk.putalpha(sh)
        layer.alpha_composite(blk, (x, y+shadow_dy))
    m = mask if alpha >= 0.999 else mask.point(lambda v: int(v*alpha))
    col = Image.new("RGBA", mask.size, color+(255,)); col.putalpha(m)
    layer.alpha_composite(col, (x, y))

def vgrad(size, top_a, bot_a, color=(0,0,0)):
    w,h = size
    g = np.linspace(top_a, bot_a, h).reshape(h,1)
    a = np.repeat(g, w, axis=1)
    img = Image.new("RGBA",(w,h), color+(255,))
    img.putalpha(Image.fromarray(np.clip(a*255,0,255).astype(np.uint8)))
    return img

# ---------- counter HUD ----------
CX        = W//2
NUM_CY    = 392
NUM_SIZE  = 214
LBL_CY    = 540
BAR_Y     = 604
SEG_W, SEG_H, SEG_GAP = 15, 5, 6
BAR_W = 20*SEG_W + 19*SEG_GAP

# soft radial glow used for the counter impact flash
_GR = 235
def _make_glow():
    y, x = np.ogrid[-_GR:_GR, -_GR:_GR]
    d = np.sqrt(x*x + y*y) / _GR
    return np.clip(1.0 - d, 0, 1) ** 2.4
_GLOW = _make_glow()
def _glow(a):
    img = Image.new("RGBA", (_GR*2, _GR*2), (255, 255, 255, 255))
    img.putalpha(Image.fromarray((_GLOW * a * 255).astype(np.uint8)))
    return img

_lbl_cache = {}
def hud(layer, count, since_pop, alpha=1.0):
    """Draw the rep counter. since_pop = seconds since last increment (or None)."""
    pop = 0.0
    if since_pop is not None and since_pop < 0.34:
        pop = 1 - ease_out_cubic(clamp(since_pop/0.34))
    scale = 1.0 + 0.30*(ease_out_back(clamp(1-pop)) - 1.0) if pop > 0 else 1.0
    if since_pop is not None and since_pop < 0.30:
        t = clamp(since_pop/0.30)
        scale = 1.0 + 0.32*(1-ease_out_back(t))
        scale = max(scale, 1.0)
    # soft radial flash behind the number
    if since_pop is not None and since_pop < 0.26:
        fa = (1 - clamp(since_pop/0.26))**2 * 0.20 * alpha
        if fa > 0.004:
            layer.alpha_composite(_glow(fa), (CX-_GR, NUM_CY-_GR))
    txt = str(count)
    if ("n",txt) not in _lbl_cache:
        _lbl_cache[("n",txt)] = text_mask(txt, font(FB, NUM_SIZE))[0]
    paste_mask(layer, _lbl_cache[("n",txt)], CX, NUM_CY, (255,255,255), alpha,
               shadow_blur=22, shadow_alpha=0.5, shadow_dy=7, scale=scale)
    if ("l","REPS") not in _lbl_cache:
        _lbl_cache[("l","REPS")] = text_mask("REPS", font(FC, 46), tracking=17)[0]
    la = alpha*(0.80 + (0.20 if (since_pop is not None and since_pop < 0.2) else 0.0))
    paste_mask(layer, _lbl_cache[("l","REPS")], CX, LBL_CY, (255,255,255), min(la,1.0),
               shadow_blur=10, shadow_alpha=0.45, shadow_dy=3)
    # 20-segment progress bar
    d = ImageDraw.Draw(layer)
    x0 = CX - BAR_W//2
    for i in range(20):
        x = x0 + i*(SEG_W+SEG_GAP)
        if i < count:
            a = 235
            if since_pop is not None and i == count-1 and since_pop < 0.25:
                a = 255
            col = (255,255,255,int(a*alpha))
        else:
            col = (255,255,255,int(60*alpha))
        d.rounded_rectangle((x, BAR_Y, x+SEG_W, BAR_Y+SEG_H), radius=2, fill=col)

# ---------- intro graphics ----------
def arrow(layer, p0, p1, ctrl, t, color, width=9, alpha=1.0):
    """Progressively drawn quadratic-bezier arrow with a head at p1."""
    if t <= 0 or alpha <= 0.01: return
    t = clamp(t)
    N = 60
    pts = []
    for i in range(N+1):
        u = (i/N)*t
        x = (1-u)**2*p0[0] + 2*(1-u)*u*ctrl[0] + u**2*p1[0]
        y = (1-u)**2*p0[1] + 2*(1-u)*u*ctrl[1] + u**2*p1[1]
        pts.append((x,y))
    lay = Image.new("RGBA", layer.size, (0,0,0,0))
    d = ImageDraw.Draw(lay)
    d.line(pts, fill=color+(255,), width=width, joint="curve")
    if t > 0.93:
        (ax,ay),(bx,by) = pts[-6], pts[-1]
        ang = math.atan2(by-ay, bx-ax); L, Wd = 40, 19
        h = [(bx, by),
             (bx - L*math.cos(ang) + Wd*math.sin(ang), by - L*math.sin(ang) - Wd*math.cos(ang)),
             (bx - L*math.cos(ang) - Wd*math.sin(ang), by - L*math.sin(ang) + Wd*math.cos(ang))]
        d.polygon(h, fill=color+(255,))
    a = np.array(lay.split()[3]).astype(float)
    glow = np.array(Image.fromarray(a.astype(np.uint8)).filter(ImageFilter.GaussianBlur(14))).astype(float)*0.55
    a = np.clip(np.maximum(a, glow)*alpha, 0, 255).astype(np.uint8)
    lay.putalpha(Image.fromarray(a))
    layer.alpha_composite(lay)

def build_intro(hero):
    """Yield INTRO composited RGB frames."""
    tm_mask  = text_mask("TARGET MUSCLE", font(FC, 52), tracking=19)[0]
    lats_m   = text_mask("LATS", font(FB, 250))[0]
    ld_mask  = text_mask("LATISSIMUS DORSI", font(FB, 78))[0]
    pt_mask  = text_mask("PRIMARY TARGET", font(FC, 42), tracking=13)[0]
    scrim    = vgrad((W, 520), 0.0, 0.78)
    for i in range(INTRO):
        t = i/FPS
        # background darkening: heavier during the anatomy beat
        d1 = smoothstep(clamp((t-0.05)/0.35))*0.52                    # card beat
        d2 = smoothstep(clamp((t-1.42)/0.45))*0.14                    # anatomy beat (a bit deeper)
        lift = smoothstep(clamp((t-3.72)/0.30))                       # release before the cut
        dk = (d1+d2)*(1-lift)
        base = hero.convert("RGBA")
        if dk > 0.002:
            base = Image.alpha_composite(base, Image.new("RGBA",(W,H),(6,8,16,int(dk*255))))
        lay = Image.new("RGBA",(W,H),(0,0,0,0))
        # beat A -- TARGET MUSCLE / LATS
        aA = smoothstep(clamp((t-0.18)/0.30)) * (1-smoothstep(clamp((t-1.34)/0.26)))
        if aA > 0.004:
            rise = (1-ease_out_cubic(clamp((t-0.18)/0.55)))*36
            paste_mask(lay, tm_mask, CX, 452+rise*0.5, (255,255,255), aA*0.92,
                       shadow_blur=14, shadow_alpha=0.5, shadow_dy=4)
            s = 0.94 + 0.06*ease_out_cubic(clamp((t-0.22)/0.5))
            paste_mask(lay, lats_m, CX, 612+rise, (255,255,255), aA,
                       shadow_blur=26, shadow_alpha=0.5, shadow_dy=8, scale=s)
            d = ImageDraw.Draw(lay)
            lw = int(150*ease_out_cubic(clamp((t-0.30)/0.45)))
            if lw > 2:
                d.rounded_rectangle((CX-lw, 782, CX+lw, 788), radius=3,
                                    fill=ACCENT+(int(235*aA),))
        # beat B -- anatomy
        aB = smoothstep(clamp((t-1.50)/0.42)) * (1-smoothstep(clamp((t-3.74)/0.28)))
        if aB > 0.004:
            pulse = 0.86 + 0.14*math.sin((t-1.50)*3.1)
            lay = Image.alpha_composite(lay, draw_lats((W,H), aB*pulse, ACCENT))
            at = clamp((t-1.86)/0.52)
            arrow(lay, (118,1436), (349,1299), (206,1418), ease_out_cubic(at),
                  (255,255,255), 9, aB*0.95)
            arrow(lay, (962,1436), (731,1299), (874,1418), ease_out_cubic(at),
                  (255,255,255), 9, aB*0.95)
            ta = smoothstep(clamp((t-2.14)/0.38)) * (1-smoothstep(clamp((t-3.74)/0.28)))
            if ta > 0.004:
                sc = scrim.copy()
                sc.putalpha(sc.split()[3].point(lambda v:int(v*ta)))
                lay.alpha_composite(sc, (0, H-520))
                ry = (1-ease_out_cubic(clamp((t-2.14)/0.6)))*22
                d = ImageDraw.Draw(lay)
                lw = int(46*ease_out_cubic(clamp((t-2.14)/0.4)))
                if lw > 2:
                    d.rounded_rectangle((CX-lw,1586,CX+lw,1592), radius=3, fill=ACCENT+(int(240*ta),))
                paste_mask(lay, ld_mask, CX, 1664+ry, (255,255,255), ta,
                           shadow_blur=20, shadow_alpha=0.6, shadow_dy=6)
                paste_mask(lay, pt_mask, CX, 1742+ry*0.6, ACCENT, ta,
                           shadow_blur=12, shadow_alpha=0.5, shadow_dy=4)
        out = Image.alpha_composite(base, lay)
        # open on black
        fi = clamp(t/0.34)
        if fi < 1.0:
            out = Image.blend(Image.new("RGBA",(W,H),(0,0,0,255)), out, smoothstep(fi))
        yield out.convert("RGB")

# ---------- outro card ----------
def check_badge(size, color):
    s = size
    m = Image.new("L",(s,s),0); d = ImageDraw.Draw(m)
    d.ellipse((0,0,s-1,s-1), fill=255)
    lay = Image.new("RGBA",(s,s),(0,0,0,0))
    lay.putalpha(m)
    lay.paste(Image.new("RGBA",(s,s),color+(255,)), (0,0), m)
    d2 = ImageDraw.Draw(lay)
    d2.line([(s*0.27,s*0.52),(s*0.44,s*0.69),(s*0.75,s*0.33)],
            fill=(255,255,255,255), width=max(4,int(s*0.095)), joint="curve")
    return lay

def main():
    hero = Image.open(f"{SP}/hero_intro.png").convert("RGB")
    last = Image.open(f"{SP}/hero_last.png").convert("RGB")

    dec = subprocess.Popen(
        ["ffmpeg","-v","error","-i",f"{SP}/src.mov",
         "-vf", f"select='between(n\\,{F_START}\\,{F_END})',scale={W}:{H}:flags=lanczos",
         "-vsync","0","-pix_fmt","rgb24","-f","rawvideo","-"],
        stdout=subprocess.PIPE, bufsize=10**8)
    enc = subprocess.Popen(
        ["ffmpeg","-v","error","-y","-f","rawvideo","-pix_fmt","rgb24",
         "-s",f"{W}x{H}","-r","30000/1001","-i","-",
         "-an","-c:v","libx264","-preset","slow","-crf","17",
         "-pix_fmt","yuv420p","-profile:v","high","-level","4.2",
         "-x264-params","keyint=60:min-keyint=30",
         "-movflags","+faststart", f"{SP}/video_only.mp4"],
        stdin=subprocess.PIPE, bufsize=10**8)

    rep_set = {f:i+1 for i,f in enumerate(REP_OUT)}
    card_m  = text_mask("20 REPS", font(FB, 156))[0]
    badge   = check_badge(122, GREEN)
    FRAME_BYTES = W*H*3
    count, last_pop = 0, None

    for i, im in enumerate(build_intro(hero)):
        enc.stdin.write(im.tobytes())

    for k in range(MAIN + OUTRO):
        oi = INTRO + k
        if k < MAIN:
            buf = dec.stdout.read(FRAME_BYTES)
            if len(buf) < FRAME_BYTES: raise RuntimeError(f"short read at {k}")
            base = Image.frombytes("RGB",(W,H),buf).convert("RGBA")
            out_t = 0.0
        else:
            base = last.convert("RGBA")
            out_t = (k-MAIN)/FPS
        if oi in rep_set:
            count = rep_set[oi]; last_pop = oi
        since = (oi-last_pop)/FPS if last_pop is not None else None

        lay = Image.new("RGBA",(W,H),(0,0,0,0))
        if k < MAIN:
            hud(lay, count, since, 1.0)
        else:
            # counter cross-fades into the completion card
            hf = 1-smoothstep(clamp((out_t-0.26)/0.22))
            cf = smoothstep(clamp((out_t-0.30)/0.30))
            if hf > 0.004: hud(lay, count, since, hf)
            dk = smoothstep(clamp(out_t/0.45))*0.34
            base = Image.alpha_composite(base, Image.new("RGBA",(W,H),(6,8,16,int(dk*255))))
            if cf > 0.004:
                sc = 1.0 + 0.16*(1-ease_out_back(clamp((out_t-0.30)/0.42)))
                sc = max(sc, 1.0)
                gap, bw = 34, badge.width
                tw = card_m.width*sc
                total = tw + gap + bw
                tx = CX - total/2 + tw/2
                paste_mask(lay, card_m, tx, 430, (255,255,255), cf,
                           shadow_blur=24, shadow_alpha=0.55, shadow_dy=8, scale=sc)
                b = badge.copy()
                b.putalpha(b.split()[3].point(lambda v:int(v*cf)))
                bs = max(1, int(bw*(0.8+0.2*smoothstep(clamp((out_t-0.36)/0.3)))))
                b = b.resize((bs,bs), Image.LANCZOS)
                lay.alpha_composite(b, (int(CX-total/2+tw+gap+(bw-bs)/2), int(430-bs/2)))
            # gentle fade to black at the very end
            fo = smoothstep(clamp((out_t-1.42)/0.36))
            if fo > 0:
                base = Image.alpha_composite(base, Image.new("RGBA",(W,H),(0,0,0,int(fo*255))))
        out = Image.alpha_composite(base, lay)
        if k >= MAIN:
            fo = smoothstep(clamp((out_t-1.42)/0.36))
            if fo > 0:
                out = Image.blend(out, Image.new("RGBA",(W,H),(0,0,0,255)), fo*0.96)
        enc.stdin.write(out.convert("RGB").tobytes())
        if oi % 120 == 0: print("frame", oi, "/", TOTAL, flush=True)

    enc.stdin.close(); enc.wait(); dec.wait()
    print("video frames:", TOTAL, "dur", TOTAL/FPS)

if __name__ == "__main__":
    main()
