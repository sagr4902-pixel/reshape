"""Objective QA of SFX candidates: metrics table, envelopes and ffmpeg spectrogram sheets.

Usage:  python3 sfx_qa.py --png-dir <dir> [--sheet <name.png>] [--cols N] [--env] files...
Metrics are also merged into public/audio/sfx/_takes/qa_metrics.json (keyed by file stem).
"""
import argparse
import json
import pathlib

from sfx_common import TAKES, envelope_line, fmt_metrics, load, metrics, spec_png, tile


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("files", nargs="+")
    ap.add_argument("--png-dir", required=True)
    ap.add_argument("--sheet")
    ap.add_argument("--cols", type=int, default=2)
    ap.add_argument("--env", action="store_true", help="print 20 ms dB envelope")
    ap.add_argument("--w", type=int, default=640)
    ap.add_argument("--h", type=int, default=512)
    a = ap.parse_args()
    out = pathlib.Path(a.png_dir)
    out.mkdir(parents=True, exist_ok=True)
    store_p = TAKES / "qa_metrics.json"
    store = json.loads(store_p.read_text()) if store_p.exists() else {}
    pngs = []
    for f in a.files:
        p = pathlib.Path(f)
        x = load(p)
        mt = metrics(x)
        store[p.stem] = mt
        print(f"{p.stem:<24} {fmt_metrics(mt)}")
        if a.env:
            print("    env:", envelope_line(x))
        png = out / f"{p.stem}.png"
        spec_png(p, png, a.w, a.h, title=p.stem)
        pngs.append(png)
    store_p.write_text(json.dumps(store, indent=1))
    if a.sheet:
        tile(pngs, out / a.sheet, cols=a.cols)
        print("sheet:", out / a.sheet)


if __name__ == "__main__":
    main()
