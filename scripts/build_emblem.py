"""
Build the optimized production ELLIXORRR emblem SVG from the approved source.

- Keeps every layer with fill-opacity >= KEEP_MIN (drops invisible / near-invisible
  trace artifacts, incl. the 46 fully transparent background groups).
- Does NOT touch path data, fills, colors or stacking order.
- Tightens the viewBox to the union bbox of kept layers + padding.
"""
import re
import xml.etree.ElementTree as ET
from pathlib import Path

ET.register_namespace("", "http://www.w3.org/2000/svg")

SRC = Path(r"C:\Users\joshi\ellixorrr\brand-assets\source\ellixorrr-emblem-source.svg")
OUT = Path(r"C:\Users\joshi\ellixorrr\brand-assets\ellixorrr-emblem.svg")
KEEP_MIN = 0.10
PAD = 6.0
NS = "{http://www.w3.org/2000/svg}"

NUM = re.compile(r"-?\d+\.?\d*")

def bbox(d: str):
    nums = [float(x) for x in NUM.findall(d)]
    xs, ys = nums[0::2], nums[1::2]
    return min(xs), min(ys), max(xs), max(ys)

tree = ET.parse(SRC)
root = tree.getroot()
src_attrs = dict(root.attrib)

kept = []
for g in root.findall(NS + "g"):
    fo = float(g.get("fill-opacity", "1"))
    if fo < KEEP_MIN:
        continue
    kept.append(g)
    # count paths
print(f"kept groups: {len(kept)}")

x0 = y0 = 1e9
x1 = y1 = -1e9
for g in kept:
    for p in g.findall(NS + "path"):
        bx0, by0, bx1, by1 = bbox(p.get("d"))
        x0, y0 = min(x0, bx0), min(y0, by0)
        x1, y1 = max(x1, bx1), max(y1, by1)

vx0 = round(x0 - PAD, 1)
vy0 = round(y0 - PAD, 1)
vw = round((x1 - x0) + 2 * PAD, 1)
vh = round((y1 - y0) + 2 * PAD, 1)
print(f"tight bbox: {x0:.1f},{y0:.1f} -> {x1:.1f},{y1:.1f}; viewBox {vx0} {vy0} {vw} {vh}")

# Re-serialize: a fresh svg root with the kept groups in original order.
def ser(el):
    return ET.tostring(el, encoding="unicode")

groups_xml = "\n".join(ser(g) for g in kept)
svg = (
    f'<svg xmlns="{NS[1:-1]}" viewBox="{vx0} {vy0} {vw} {vh}" '
    f'width="{vw}" height="{vh}" role="img" aria-label="ELLIXORRR emblem">\n'
    + groups_xml
    + "\n</svg>\n"
)
OUT.write_text(svg, encoding="utf-8")
print(f"wrote {OUT} ({OUT.stat().st_size} bytes)")
