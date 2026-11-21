"""Encode the owner-supplied design renders for the web.

Reads full-resolution PNGs extracted from the design decks (git-ignored, in
input-assets/) and writes AVIF + WebP derivatives to public/assets/design/.
Requires Pillow with AVIF support.

  python3 scripts/dev/encode-renders.py            # everything
  python3 scripts/dev/encode-renders.py facade d25  # only these ids (manifest is merged)
"""
import json, os, sys
from PIL import Image

SRC = 'input-assets'
OUT = 'public/assets/design'
DECK = [3, 4, 6, 9, 10, 12, 16, 19, 21, 24, 25, 27, 29, 33, 34, 35, 37, 38, 39, 42, 46, 48, 49, 50, 51, 53, 62, 64]
# 240 = thumbnails, 480 = tiles, 800/1200 = phones and cards, 1600 = desktop viewer
jobs = [(f'{SRC}/renders/deck-{n:02d}.png', f'd{n:02d}', [240, 480, 800, 1200, 1600]) for n in DECK]
# The facade is the homepage hero (1100/1672) and also a tile, a viewer image and a thumbnail.
jobs.append((f'{SRC}/exterior/facade-render.png', 'facade', [240, 480, 800, 1100, 1672]))
only = set(sys.argv[1:])
if only:
    unknown = only - {name for _, name, _ in jobs}
    if unknown:
        sys.exit(f'unknown image id(s): {sorted(unknown)}')
    jobs = [j for j in jobs if j[1] in only]

WEBP_WIDTHS = {240, 800, 1200, 1100, 1672}
manifest = json.load(open(f'{OUT}/manifest.json')) if only else {}
for src, name, widths in jobs:
    im = Image.open(src).convert('RGB')
    manifest[name] = {'w': im.width, 'h': im.height, 'files': {}}
    for w in widths:
        w = min(w, im.width)
        r = im.resize((w, round(im.height * w / im.width)), Image.LANCZOS) if w != im.width else im
        for ext, kw in (('avif', dict(quality=52, speed=4)), ('webp', dict(quality=76, method=6))):
            if ext == 'webp' and w not in WEBP_WIDTHS:
                continue  # WebP is only the fallback for browsers without AVIF
            path = f'{OUT}/{name}-{w}.{ext}'
            r.save(path, **kw)
            manifest[name]['files'][f'{w}.{ext}'] = os.path.getsize(path)
manifest = {k: manifest[k] for k in sorted(manifest)}
json.dump(manifest, open(f'{OUT}/manifest.json', 'w'), indent=1)
tot = sum(sum(v['files'].values()) for v in manifest.values())
print(len(manifest), 'images', round(tot / 1024), 'KiB total')
