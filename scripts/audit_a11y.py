"""axe-core accessibility audit for all three locales (desktop + mobile)."""

import json
import os
from playwright.sync_api import sync_playwright

BASE = "http://localhost:3000"
AXE = os.path.join("node_modules", "axe-core", "axe.min.js")

with open(AXE, "r", encoding="utf-8") as f:
    axe_source = f.read()

summary = {}

with sync_playwright() as p:
    exe = os.path.join(
        os.environ["LOCALAPPDATA"], "ms-playwright", "chromium-1248", "chrome-win64", "chrome.exe"
    )
    browser = p.chromium.launch(executable_path=exe)
    for label, vw, vh, mob in [
        ("desktop", 1440, 900, False),
        ("mobile", 390, 844, True),
    ]:
        for locale in ["en", "hi", "mr"]:
            ctx = browser.new_context(viewport={"width": vw, "height": vh}, is_mobile=mob, has_touch=mob)
            page = ctx.new_page()
            page.goto(f"{BASE}/{locale}", wait_until="networkidle")
            page.evaluate(axe_source)
            results = page.evaluate(
                """async () => (await axe.run(document, {resultTypes: ['violations']})).violations"""
            )
            key = f"{label}-{locale}"
            summary[key] = [
                {"id": v["id"], "impact": v["impact"], "nodes": len(v["nodes"]), "help": v["help"]}
                for v in results
            ]
            ctx.close()
    browser.close()

total = sum(len(v) for v in summary.values())
print(json.dumps(summary, indent=2, ensure_ascii=False))
print(f"\nTotal violations: {total}")
