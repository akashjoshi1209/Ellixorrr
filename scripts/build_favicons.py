"""
Build favicon/apple-touch assets from the optimized ELLIXORRR emblem.

Outputs (src/app/):
  icon.svg        — SVG favicon: charcoal rounded plate + emblem (transparent corners)
  icon.png        — 32x32 PNG of the same plate
  apple-icon.png  — 180x180 PNG of the same plate
  favicon.ico     — multi-size ICO (16/32/48)

The emblem artwork itself is untouched: groups are re-used verbatim, only
scaled/translated to sit centered on the plate.
"""
import re
from pathlib import Path
from playwright.sync_api import sync_playwright
from PIL import Image
import io

ROOT = Path(r"C:\Users\joshi\ellixorrr")
EMBLEM = ROOT / "brand-assets" / "ellixorrr-emblem.svg"
APP = ROOT / "src" / "app"
CHROME = r"C:\Users\joshi\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe"

CANVAS = 512
PLATE_RADIUS = 110
EMBLEM_W = 384  # emblem width on plate (~75%)
PLATE = "#171717"  # brand charcoal

svg = EMBLEM.read_text(encoding="utf-8")
m = re.search(r'viewBox="([\d.]+) ([\d.]+) ([\d.]+) ([\d.]+)"', svg)
vx, vy, vw, vh = (float(x) for x in m.groups())
inner = re.sub(r"^<svg[^>]*>|</svg>\s*$", "", svg.strip()).strip()

s = EMBLEM_W / vw
tx = (CANVAS - EMBLEM_W) / 2 - vx * s
ty = (CANVAS - vh * s) / 2 - vy * s
print(f"emblem viewBox {vx},{vy} {vw}x{vh}; scale {s:.4f} translate {tx:.2f},{ty:.2f}")

plate_svg = (
    f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {CANVAS} {CANVAS}" '
    f'width="{CANVAS}" height="{CANVAS}" role="img" aria-label="ELLIXORRR">\n'
    f'<rect width="{CANVAS}" height="{CANVAS}" rx="{PLATE_RADIUS}" fill="{PLATE}"/>\n'
    f'<g transform="translate({tx:.2f} {ty:.2f}) scale({s:.6f})">\n'
    f"{inner}\n"
    f"</g>\n</svg>\n"
)
(APP / "icon.svg").write_text(plate_svg, encoding="utf-8")
print(f"wrote {APP/'icon.svg'} ({(APP/'icon.svg').stat().st_size} bytes)")

html = (
    "<!doctype html><html><body style='margin:0;background:transparent'>"
    + plate_svg.replace(
        f'width="{CANVAS}" height="{CANVAS}"', f'width="{{S}}" height="{{S}}"'
    ).replace(
        'width="{S}" height="{S}"', f'width="{CANVAS}" height="{CANVAS}"'
    )
    + "</body></html>"
)

def render(size: int) -> Image.Image:
    doc = html.replace(f'width="{CANVAS}" height="{CANVAS}"', f'width="{size}" height="{size}"', 1)
    with sync_playwright() as pw:
        b = pw.chromium.launch(executable_path=CHROME)
        p = b.new_page(viewport={"width": size, "height": size}, device_scale_factor=1)
        p.set_content(doc)
        el = p.query_selector("svg")
        buf = el.screenshot(omit_background=True)
        b.close()
    return Image.open(io.BytesIO(buf)).convert("RGBA")

img512 = render(CANVAS)
img256 = img512.resize((256, 256), Image.LANCZOS)

img512.resize((180, 180), Image.LANCZOS).save(APP / "apple-icon.png")
img512.resize((32, 32), Image.LANCZOS).save(APP / "icon.png")
ico_sizes = [(16, 16), (32, 32), (48, 48)]
img256.save(APP / "favicon.ico", sizes=ico_sizes)

for f in ["apple-icon.png", "icon.png", "favicon.ico"]:
    print(f"wrote {APP/f} ({(APP/f).stat().st_size} bytes)")
