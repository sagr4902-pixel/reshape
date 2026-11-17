"""Blur faces in the Higgsfield B-roll stills: python3 blur_faces.py <src_dir> <out_dir>
Boxes (x, y, w, h) on the 752x1344 originals were set by hand after YuNet detection (false hits removed)."""
import sys, pathlib, cv2, numpy as np
BOXES = {
    "01_pullup": [(292, 40, 129, 167)],
    "02_handstand": [(336, 851, 83, 73)],
    "03_lever": [(55, 501, 48, 66)],
    "04_kids_highfive": [(203, 251, 88, 126), (569, 326, 89, 136)],
    "05_coach_spot": [(195, 485, 74, 116), (385, 860, 150, 190)],
}
def blur(im, boxes, pad=0.35):
    h, w = im.shape[:2]
    mask = np.zeros((h, w), np.float32)
    for x, y, bw, bh in boxes:
        cx, cy = x + bw / 2, y + bh / 2
        cv2.ellipse(mask, (int(cx), int(cy)), (int(bw * (0.5 + pad)), int(bh * (0.5 + pad))), 0, 0, 360, 1.0, -1)
    k = max(31, int(max(b[2] for b in boxes) * 0.6) | 1)
    soft = cv2.GaussianBlur(mask, (0, 0), k / 6)[..., None]
    # pixelate then blur: no identity survives, and it still reads as a natural soft blur
    small = cv2.resize(im, (max(1, w // 24), max(1, h // 24)), interpolation=cv2.INTER_AREA)
    obl = cv2.GaussianBlur(cv2.resize(small, (w, h), interpolation=cv2.INTER_LINEAR), (0, 0), 9)
    return (im * (1 - soft) + obl * soft).astype(np.uint8)
if __name__ == "__main__":
    src, out = pathlib.Path(sys.argv[1]), pathlib.Path(sys.argv[2]); out.mkdir(parents=True, exist_ok=True)
    for name, boxes in BOXES.items():
        cv2.imwrite(str(out / f"{name}.png"), blur(cv2.imread(str(src / f"{name}.png")), boxes))
        print(name, len(boxes), "face(s)")
