"""Contact sheet: python3 contact.py out.jpg cols scale img1 img2 ..."""
import sys
from PIL import Image, ImageDraw
out, cols, scale = sys.argv[1], int(sys.argv[2]), float(sys.argv[3])
files = sys.argv[4:]
ims = [Image.open(f).convert('RGB') for f in files]
w, h = int(ims[0].width * scale), int(ims[0].height * scale)
rows = (len(ims) + cols - 1) // cols
sheet = Image.new('RGB', (cols * w + (cols - 1) * 6, rows * h + (rows - 1) * 6), (90, 90, 90))
for i, (im, f) in enumerate(zip(ims, files)):
    im = im.resize((w, h), Image.LANCZOS)
    d = ImageDraw.Draw(im)
    label = f.rsplit('_', 1)[-1].split('.')[0]
    d.rectangle([0, 0, 70, 24], fill=(0, 0, 0))
    d.text((6, 5), label, fill=(255, 255, 255))
    sheet.paste(im, ((i % cols) * (w + 6), (i // cols) * (h + 6)))
sheet.save(out, quality=88)
print(out, sheet.size)
