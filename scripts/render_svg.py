"""Rasterize one or more SVG files with Playwright Chromium for visual inspection."""
import re
import sys
from pathlib import Path
from playwright.sync_api import sync_playwright

CHROME = r"C:\Users\joshi\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe"

def render(svgs, out_dir, bg="#171717", width=1200, pad=40):
    out = Path(out_dir); out.mkdir(parents=True, exist_ok=True)
    shots = []
    with sync_playwright() as pw:
        browser = pw.chromium.launch(executable_path=CHROME)
        page = browser.new_page(viewport={"width": width, "height": 1400}, device_scale_factor=1)
        for i, svg_path in enumerate(svgs):
            svg = Path(svg_path).read_text(encoding="utf-8")
            # strip intrinsic width/height + force fluid sizing so every variant
            # renders at identical box size for pixel comparison
            svg = re.sub(r'(<svg[^>]*?)\s+width="[^"]*"', r"\1", svg, count=1)
            svg = re.sub(r'(<svg[^>]*?)\s+height="[^"]*"', r"\1", svg, count=1)
            svg = re.sub(r"<svg ", '<svg preserveAspectRatio="xMidYMid meet" style="height:520px;width:auto;display:block;margin:auto" ', svg, count=1)
            html = f"""<!doctype html><html><body style="margin:0;background:{bg};
              display:flex;align-items:center;justify-content:center;height:100vh">
              <div style="display:flex;justify-content:center">{svg}</div></body></html>"""
            page.set_content(html, wait_until="networkidle")
            p = out / f"{Path(svg_path).stem}_{Path(out_dir).name}_{bg.lstrip('#')}.png"
            page.screenshot(path=str(p), full_page=True)
            shots.append(str(p))
        browser.close()
    return shots

if __name__ == "__main__":
    svgs = sys.argv[1:]
    r1 = render(svgs, r"C:\Users\joshi\AppData\Local\Temp\opencode\svgcheck", bg="#171717")
    r2 = render(svgs, r"C:\Users\joshi\AppData\Local\Temp\opencode\svgcheck", bg="#F1F0EB")
    print("\n".join(r1 + r2))
