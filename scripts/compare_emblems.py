"""Compare optimized emblems against the source cropped to the same viewBox."""
import re
from pathlib import Path
import numpy as np
from PIL import Image

SRC = Path(r"C:\Users\joshi\ellixorrr\brand-assets\source\ellixorrr-emblem-source.svg").read_text(encoding="utf-8")
D = r"C:\Users\joshi\AppData\Local\Temp\opencode\svgcheck"

variants = [
    ("ellixorrr-emblem.svg", "134.0 382.2 864.0 563.6"),
    ("ellixorrr-emblem-strict.svg", "134.5 388.0 861.1 557.8"),
]

def render_batch(files, bg, tag):
    from render_svg import render  # noqa: handles sys.path when run from project? we import manually below
    raise SystemExit("use playwright inline")

import sys
sys.path.insert(0, r"C:\Users\joshi\ellixorrr\scripts")
from render_svg import render

for name, vb in variants:
    cropped = SRC.replace('viewBox = "0 0 1168 1347"', f'viewBox="{vb}"', 1)
    assert f'viewBox="{vb}"' in cropped
    cp = Path(D) / f"crop_{name}"
    cp.write_text(cropped, encoding="utf-8")

for bg, bgt in [("#171717", "171717"), ("#F1F0EB", "F1F0EB")]:
    files = [Path(D) / f"crop_{n}" for n, _ in variants] + [Path(r"C:\Users\joshi\ellixorrr\brand-assets") / n for n, _ in variants]
    render([str(f) for f in files], D, bg=bg)

def load(p):
    return np.asarray(Image.open(p).convert("RGB"), dtype=float)

for name, _ in variants:
    for bgt in ["171717", "F1F0EB"]:
        a = load(Path(D) / f"crop_{name[:-4]}_svgcheck_{bgt}.png")
        b = load(Path(D) / f"{name[:-4]}_svgcheck_{bgt}.png")
        h, w = min(a.shape[0], b.shape[0]), min(a.shape[1], b.shape[1])
        a, b = a[:h, :w], b[:h, :w]
        diff = np.abs(a - b)
        ys, xs = np.where(diff.max(axis=2) > 8)
        bbox = (int(xs.min()), int(ys.min()), int(xs.max()), int(ys.max())) if len(ys) else None
        print(f"{name} [{bgt}] mean {diff.mean():.4f} max {diff.max():.0f} px>8 {(diff.max(axis=2)>8).sum()} bbox {bbox}")
