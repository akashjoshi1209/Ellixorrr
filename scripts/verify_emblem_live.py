"""Visual verification of the new ELLIXORRR emblem in the live site header/footer."""
import sys
from playwright.sync_api import sync_playwright

OUT = r"C:\Users\joshi\ellixorrr\qa-screens"
BASE = "http://localhost:3100"
CHROME = r"C:\Users\joshi\AppData\Local\ms-playwright\chromium-1248\chrome-win64\chrome.exe"

from pathlib import Path
Path(OUT).mkdir(parents=True, exist_ok=True)

VIEWPORTS = [
    ("desktop", 1440, 900),
    ("tablet", 834, 1112),
    ("mobile", 390, 844),
]

with sync_playwright() as pw:
    browser = pw.chromium.launch(executable_path=CHROME)
    for name, w, h in VIEWPORTS:
        page = browser.new_page(viewport={"width": w, "height": h}, device_scale_factor=2)
        page.goto(f"{BASE}/en", wait_until="networkidle")
        page.wait_for_timeout(800)
        page.screenshot(path=f"{OUT}/header_{name}.png", clip={"x": 0, "y": 0, "width": w, "height": 140})
        # scrolled state (solid header bg)
        page.evaluate("window.scrollTo(0, 600)")
        page.wait_for_timeout(900)
        page.screenshot(path=f"{OUT}/header_{name}_scrolled.png", clip={"x": 0, "y": 0, "width": w, "height": 140})
        # footer (element screenshot — footer is taller than a viewport slice)
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(900)
        page.locator("footer").screenshot(path=f"{OUT}/footer_{name}.png")
        if name == "mobile":
            # open drawer
            page.evaluate("window.scrollTo(0, 0)")
            page.wait_for_timeout(400)
            page.get_by_role("button").first.click()
            page.wait_for_timeout(700)
            page.screenshot(path=f"{OUT}/drawer_mobile.png", clip={"x": 0, "y": 0, "width": w, "height": 420})
        page.close()

    # head links + asset availability
    page = browser.new_page(viewport={"width": 1200, "height": 800})
    page.goto(f"{BASE}/en", wait_until="networkidle")
    links = page.evaluate(
        "() => Array.from(document.querySelectorAll('link[rel*=icon], link[rel=apple-touch-icon]')).map(l => l.outerHTML)"
    )
    print("HEAD ICON LINKS:")
    for l in links:
        print("  ", l)
    for path in ["/favicon.ico", "/icon.svg", "/icon.png", "/apple-icon.png", "/ellixorrr-emblem.svg"]:
        resp = page.request.get(f"{BASE}{path}")
        print(f"{path} -> {resp.status} {resp.headers.get('content-type')}")
    browser.close()
print("done")
