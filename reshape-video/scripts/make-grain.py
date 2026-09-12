"""Regenerate the film-grain tile used by FilmTexture.

256x256 gaussian noise, tiled and jittered per frame at render time.
Run from the project root: python3 scripts/make-grain.py
"""
import pathlib
import random

from PIL import Image

random.seed(11)
SIZE = 256

im = Image.new("LA", (SIZE, SIZE))
im.putdata([(max(0, min(255, int(random.gauss(128, 46)))), 255) for _ in range(SIZE * SIZE)])

out = pathlib.Path("public/brand/grain.png")
out.parent.mkdir(parents=True, exist_ok=True)
im.save(out, optimize=True)
print(out, out.stat().st_size, "bytes")
