"""Contact integration verification for Ellixorrr Phase 3."""
import json
import sys
from playwright.sync_api import sync_playwright

# The Windows console defaults to a code page that cannot render Devanagari.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa: BLE001
    pass

results = []

# Next.js injects its own visually-hidden route announcer, which carries
# role="alert". It is framework chrome, not application feedback, so it is
# excluded when counting application alert banners.
COUNT_ALERTS_JS = """() => [...document.querySelectorAll('[role="alert"]')]
    .filter((el) => !el.closest('#__next-route-announcer__')).length"""


def count_app_alerts(page):
    """Number of application-level alert banners currently in the DOM."""
    return page.evaluate(COUNT_ALERTS_JS)


def check(name, ok, detail=""):
    results.append({"check": name, "ok": bool(ok), "detail": detail})
    print(("PASS" if ok else "FAIL") + f"  {name}" + (f" — {detail}" if detail else ""))


with sync_playwright() as p:
    exe = (
        "/Users/joshi/Library/Application Support/ms-playwright/chromium-1248/"
        "chrome-win64/chrome.exe"
    )
    import os
    exe = os.path.join(
        os.environ["LOCALAPPDATA"],
        "ms-playwright",
        "chromium-1248",
        "chrome-win64",
        "chrome.exe",
    )
    browser = p.chromium.launch(executable_path=exe)

    for locale in ["en", "hi", "mr"]:
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()
        console_errors = []

        def on_console(m):
            if m.type == "error":
                console_errors.append(m.text)

        page.on("console", on_console)
        page.on("pageerror", lambda e: console_errors.append(str(e)))

        page.goto(f"http://localhost:3000/{locale}", wait_until="networkidle")

        # Scroll to contact section
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(800)

        check(f"{locale}: contact section present", page.locator("#contact").count() == 1)

        # WhatsApp link
        wa = page.locator('a[href*="wa.me/919404044607"]')
        check(f"{locale}: WhatsApp link present", wa.count() >= 1)
        if wa.count() >= 1:
            href = wa.first.get_attribute("href") or ""
            from urllib.parse import unquote
            decoded = unquote(href)
            check(f"{locale}: WhatsApp correct number", "919404044607" in href)
            check(
                f"{locale}: WhatsApp prefilled message",
                "Hello Ellixorrr" in decoded
                or "नमस्ते Ellixorrr" in decoded
                or "नमस्कार Ellixorrr" in decoded,
            )
            check(f"{locale}: WhatsApp opens new tab", wa.first.get_attribute("target") == "_blank")

        # Email link
        email = page.locator('a[href^="mailto:"]')
        check(f"{locale}: Email link present", email.count() >= 1)
        if email.count() >= 1:
            href = email.first.get_attribute("href") or ""
            from urllib.parse import unquote
            decoded = unquote(href)
            check(f"{locale}: Email correct recipient", "ellixorrr@gmail.com" in href)
            check(
                f"{locale}: Email subject present",
                "Project Enquiry" in decoded
                or "प्रोजेक्ट पूछताछ" in decoded
                or "प्रकल्प चौकशी" in decoded,
            )

        # Phone link
        phone = page.locator('a[href^="tel:"]')
        check(f"{locale}: Phone link present", phone.count() >= 1)
        if phone.count() >= 1:
            href = phone.first.get_attribute("href") or ""
            check(f"{locale}: Phone correct number", "+919404044607" in href)

        # Form fields
        check(f"{locale}: Name field present", page.locator("#contact-name").count() == 1)
        check(
            f"{locale}: Email field present", page.locator("#contact-email").count() == 1
        )
        check(
            f"{locale}: Phone field present", page.locator("#contact-phone").count() == 1
        )
        check(
            f"{locale}: Business field present",
            page.locator("#contact-business").count() == 1,
        )
        check(
            f"{locale}: Service select present",
            page.locator("#contact-service").count() == 1,
        )
        check(
            f"{locale}: Description textarea present",
            page.locator("#contact-description").count() == 1,
        )
        check(
            f"{locale}: Submit button present",
            page.locator('button[type="submit"]').count() == 1,
        )

        # Form validation - submit empty.
        # The form carries `noValidate`, so the browser does not raise its
        # own "This field is required." bubbles. Validation is performed
        # server-side by the enquiry action, which redirects back to the
        # localized homepage contact section with a `validation_failed`
        # code that renders a localized alert banner.
        page.click('button[type="submit"]')
        page.wait_for_timeout(2500)
        check(
            f"{locale}: Empty submit is rejected server-side",
            "error=validation_failed" in page.url,
            page.url,
        )
        check(
            f"{locale}: Empty submit stays on the homepage contact section",
            "/contact" not in page.url.split("?")[0].rstrip("/"),
            page.url,
        )
        check(
            f"{locale}: Form shows a localized validation error banner",
            count_app_alerts(page) == 1,
            f"alerts={count_app_alerts(page)}",
        )

        # No console errors
        real_errors = [e for e in console_errors if "favicon" not in e.lower()]
        check(
            f"{locale}: No console errors",
            len(real_errors) == 0,
            "; ".join(real_errors[:3]) if real_errors else "",
        )

        # Header CTA links to contact
        page.evaluate("window.scrollTo(0, 0)")
        page.wait_for_timeout(300)
        header_cta = page.locator('header a[href="#contact"]')
        check(f"{locale}: Header CTA links to contact", header_cta.count() >= 1)

        ctx.close()

    # Mobile
    mctx = browser.new_context(
        viewport={"width": 390, "height": 844}, is_mobile=True, has_touch=True
    )
    mpage = mctx.new_page()
    mpage.goto("http://localhost:3000/en", wait_until="networkidle")
    mpage.evaluate("window.scrollTo(0, document.body.scrollHeight)")
    mpage.wait_for_timeout(800)
    check(
        "mobile: WhatsApp link present",
        mpage.locator('a[href*="wa.me/919404044607"]').count() >= 1,
    )
    check(
        "mobile: Email link present",
        mpage.locator('a[href^="mailto:"]').count() >= 1,
    )
    check(
        "mobile: Phone link present",
        mpage.locator('a[href^="tel:"]').count() >= 1,
    )
    check(
        "mobile: Form fields present",
        mpage.locator("#contact-name").count() == 1
        and mpage.locator("#contact-email").count() == 1,
    )
    mctx.close()

    browser.close()

failed = [r for r in results if not r["ok"]]
print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
with open("qa-screens/contact-results.json", "w", encoding="utf-8") as f:
    json.dump(results, f, indent=2, ensure_ascii=False)
raise SystemExit(1 if failed else 0)
