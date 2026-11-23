"""Encode the public imagery from the owner-supplied design renders.

The owner does not want the interior design or layout shown. Only the facade
and tight "teaser" crops of single details are published; full renders stay in
input-assets/ (git-ignored). Requires Pillow with AVIF support.

  python3 scripts/dev/encode-renders.py
"""
import json, os
from PIL import Image

SRC = 'input-assets'
OUT = 'public/assets/design'
# id: (deck page, centre x, centre y, width as a fraction of the render, aspect w/h)
TEASERS = {
    't-juice': (10, 0.34, 0.71, 0.42, 4 / 3),
    't-rig': (25, 0.58, 0.55, 0.40, 4 / 3),
    't-strength': (38, 0.52, 0.72, 0.36, 4 / 3),
    't-turf': (29, 0.55, 0.76, 0.34, 4 / 3),
    't-functional': (39, 0.62, 0.52, 0.38, 4 / 3),
    't-vanity': (64, 0.50, 0.60, 0.40, 4 / 3),
    't-lockers': (51, 0.30, 0.50, 0.30, 4 / 3),
    't-chevron': (62, 0.30, 0.66, 0.50, 4 / 3),
    't-warrior': (29, 0.24, 0.285, 0.38, 5 / 2),
}
for f in os.listdir(OUT):
    os.remove(os.path.join(OUT, f))
manifest = {}

def save(im, name, widths):
    manifest[name] = {'w': im.width, 'h': im.height, 'files': {}}
    for w in widths:
        w = min(w, im.width)
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if w != im.width else im
        for ext, kw in (('avif', dict(quality=52, speed=4)), ('webp', dict(quality=76, method=6))):
            path = f'{OUT}/{name}-{w}.{ext}'
            r.save(path, **kw)
            manifest[name]['files'][f'{w}.{ext}'] = os.path.getsize(path)

for name, (page, cx, cy, wf, ar) in TEASERS.items():
    im = Image.open(f'{SRC}/renders/deck-{page:02d}.png').convert('RGB')
    w = wf * im.width
    h = w / ar
    box = (round(cx * im.width - w / 2), round(cy * im.height - h / 2), round(cx * im.width + w / 2), round(cy * im.height + h / 2))
    assert box[0] >= 0 and box[1] >= 0 and box[2] <= im.width and box[3] <= im.height, (name, box)
    save(im.crop(box), name, sorted({480, round(w)}))
save(Image.open(f'{SRC}/exterior/facade-render.png').convert('RGB'), 'facade', [480, 800, 1100, 1672])
manifest = {k: manifest[k] for k in sorted(manifest)}
json.dump(manifest, open(f'{OUT}/manifest.json', 'w'), indent=1)
print(len(manifest), 'images', round(sum(sum(v['files'].values()) for v in manifest.values()) / 1024), 'KiB')
