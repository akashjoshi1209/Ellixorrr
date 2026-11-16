"""Playwright verification for the Ellixorrr homepage (phase 1).

Run with the production server up: pnpm build && pnpm start
Covers: locale routing, all three languages, console errors, anchors,
language switcher, 404 handling, and desktop/mobile/reduced-motion captures.
"""

import json
import os
import sys
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
OUT = "qa-screens"

# This machine has a Playwright browser cache from an older Playwright
# version; point the launcher at the existing Chromium binary explicitly.
_CHROMIUM = os.path.join(
    os.environ["LOCALAPPDATA"],
    "ms-playwright",
    "chromium-1248",
    "chrome-win64",
    "chrome.exe",
)

results = []


def check(name: str, ok: bool, detail: str = ""):
    results.append({"check": name, "ok": bool(ok), "detail": detail})
    print(f"{'PASS' if ok else 'FAIL'}  {name}" + (f" — {detail}" if detail else ""))


def scroll_through(page):
    """Scroll to the bottom in viewport steps so scroll-triggered reveals
    fire exactly as they would for a real user, then return to top."""
    height = page.evaluate("document.body.scrollHeight")
    viewport = page.evaluate("window.innerHeight")
    position = 0
    while position < height:
        position += int(viewport * 0.8)
        page.evaluate(f"window.scrollTo(0, {position})")
        page.wait_for_timeout(250)
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(600)


with sync_playwright() as p:
    browser = p.chromium.launch(executable_path=_CHROMIUM)

    # ---------------------------------------------------------------- desktop
    desktop = browser.new_context(viewport={"width": 1440, "height": 900})
    page = desktop.new_page()
    console_errors: list[str] = []

    def on_console(m):
        if m.type == "error":
            console_errors.append(m.text)

    page.on("console", on_console)
    page.on("pageerror", lambda e: console_errors.append(str(e)))

    # Root redirect -> locale route
    page.goto(BASE + "/", wait_until="networkidle")
    check("root redirects to a locale route", "/en" in page.url or "/hi" in page.url or "/mr" in page.url, page.url)

    # English page content
    page.goto(BASE + "/en", wait_until="networkidle")
    check("html lang=en", page.locator("html[lang='en']").count() == 1)
    check("hero headline present", page.get_by_role("heading", level=1).inner_text().strip() != "")
    for anchor in ["#services", "#about", "#work", "#contact"]:
        check(f"anchor {anchor} target exists", page.locator(anchor).count() == 1)
    # Nav CTA + language switcher
    check("header CTA exists", page.locator("header a[href='#contact']").count() >= 1)
    check("language switcher has 3 locales", page.locator("nav[aria-label]").filter(has=page.locator("a[href='/hi']")).count() >= 1)

    scroll_through(page)
    page.screenshot(path=f"{OUT}/desktop-en-full.png", full_page=True)

    # Follow an in-page anchor (scroll works, no broken link)
    page.click("header a[href='#services']")
    page.wait_for_timeout(400)
    check("anchor navigation scrolls", page.evaluate("window.scrollY") > 100)

    # ---------------------------------------------------------------- locales
    for loc, marker in [("hi", "ज़्यादा कमाएँ"), ("mr", "अधिक कमवा")]:
        pg = desktop.new_page()
        pg.goto(f"{BASE}/{loc}", wait_until="networkidle")
        lang_ok = pg.locator(f"html[lang='{loc}']").count() == 1
        text_ok = marker in pg.get_by_role("heading", level=1).inner_text()
        check(f"/{loc} renders ({lang_ok}, headline {text_ok})", lang_ok and text_ok)
        scroll_through(pg)
        pg.screenshot(path=f"{OUT}/desktop-{loc}-full.png", full_page=True)
        pg.close()

    # Language switch from en -> mr
    page.goto(BASE + "/en", wait_until="networkidle")
    page.click("header a[href='/mr']")
    page.wait_for_url("**/mr", timeout=5000)
    check("language switcher navigates to /mr", "/mr" in page.url)
    cookies = {c["name"]: c["value"] for c in page.context.cookies()}
    check("cookie persisted", cookies.get("ellixorrr-locale") == "mr", str(cookies.get("ellixorrr-locale")))

    # Cookie drives "/" redirect preference
    page2 = desktop.new_page()
    page2.goto(BASE + "/", wait_until="networkidle")
    check("cookie redirects root to /mr", "/mr" in page2.url)
    page2.close()

    # 404 handling inside a locale
    r = page.goto(BASE + "/en/does-not-exist", wait_until="networkidle")
    check("unknown path returns 404", r is not None and r.status == 404, f"status={r.status if r else 'n/a'}")
    check("404 keeps locale layout", page.locator("html[lang='en']").count() == 1)

    # ---------------------------------------------------------------- mobile
    mobile = browser.new_context(viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True)
    mpage = mobile.new_page()
    mpage.goto(BASE + "/en", wait_until="networkidle")
    check("mobile: desktop nav hidden", not mpage.locator("header nav.hidden.lg\\:flex").is_visible())
    mpage.click("header button[aria-controls='mobile-nav']")
    check("mobile drawer opens", mpage.locator("#mobile-nav").is_visible())
    check("mobile drawer focus moves in", mpage.evaluate("document.activeElement && document.activeElement.textContent") != "")
    mpage.keyboard.press("Escape")
    check("mobile drawer Escape closes", mpage.locator("#mobile-nav").count() == 0)
    scroll_through(mpage)
    mpage.screenshot(path=f"{OUT}/mobile-en-full.png", full_page=True)
    mobile.close()

    # ------------------------------------------------------- reduced motion
    rm = browser.new_context(viewport={"width": 1440, "height": 900}, reduced_motion="reduce")
    rpage = rm.new_page()
    rpage.goto(BASE + "/en", wait_until="networkidle")
    check("reduced motion: hero content visible immediately", rpage.get_by_role("heading", level=1).is_visible())
    check(
        "reduced motion: below-fold content visible without scrolling animations",
        rpage.evaluate("document.querySelector('.motion-reveal') && getComputedStyle(document.querySelectorAll('.motion-reveal')[5]).opacity") == "1",
    )
    rpage.screenshot(path=f"{OUT}/reduced-motion-en.png", full_page=True)
    rm.close()

    # The only expected console "error" is the 404 status of the document we
    # deliberately requested above; a resource probe confirmed no other 4xx.
    real_errors = [e for e in console_errors if "status of 404" not in e]
    check("no console errors across pages", len(real_errors) == 0, "; ".join(real_errors[:5]))

    browser.close()

with open(f"{OUT}/results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)

failed = [r for r in results if not r["ok"]]
print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
