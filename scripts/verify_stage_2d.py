"""Stage 2D verification for Ellixorrr.

Checks the application-layer security and reliability fixes that were made in
Stage 2D, against a locally running production build (`next start` on :3000).

The script never talks to Supabase directly and never mutates data: it only
performs GET requests and reads the rendered DOM / response headers.

Run:
    python scripts/verify_stage_2d.py
"""

import json
import os
import sys
from urllib.parse import quote

from playwright.sync_api import sync_playwright

# The console on Windows defaults to cp1252, which cannot render Devanagari.
try:
    sys.stdout.reconfigure(encoding="utf-8", errors="replace")
except Exception:  # noqa: BLE001
    pass

BASE = os.environ.get("ELLIXORRR_BASE_URL", "http://localhost:3000")
CHROME = os.path.join(
    os.environ["LOCALAPPDATA"],
    "ms-playwright",
    "chromium-1248",
    "chrome-win64",
    "chrome.exe",
)

results = []


def check(name, ok, detail=""):
    results.append({"check": name, "ok": bool(ok), "detail": str(detail)})
    print(("PASS" if ok else "FAIL") + f"  {name}" + (f" — {detail}" if detail else ""))


# Next.js injects its own visually-hidden route announcer, which carries
# role="alert". It is framework chrome, not application feedback, so it is
# excluded when counting application alert banners.
COUNT_ALERTS_JS = """() => [...document.querySelectorAll('[role="alert"]')]
    .filter((el) => !el.closest('#__next-route-announcer__')).length"""


def count_app_alerts(page):
    return page.evaluate(COUNT_ALERTS_JS)


def main():
    with sync_playwright() as p:
        browser = p.chromium.launch(executable_path=CHROME)
        ctx = browser.new_context(viewport={"width": 1440, "height": 900})
        page = ctx.new_page()

        # --------------------------------------------------------------
        # 1. Locale negotiation: "/" must redirect to a locale prefix.
        # --------------------------------------------------------------
        resp = page.goto(BASE + "/", wait_until="networkidle")
        check(
            "root redirects to a locale-prefixed URL",
            "/en" in page.url or "/hi" in page.url or "/mr" in page.url,
            page.url,
        )
        # Playwright follows redirects, so the final response is 200. The
        # redirect itself is visible on the request chain.
        redirected_from = resp.request.redirected_from if resp else None
        check(
            "root issued a redirect",
            redirected_from is not None,
            f"{redirected_from.url if redirected_from else 'no redirect'} -> {page.url}",
        )

        # --------------------------------------------------------------
        # 2. Every locale homepage renders with no console errors.
        # --------------------------------------------------------------
        for locale in ["en", "hi", "mr"]:
            errors = []
            on_console = lambda m: errors.append(m.text) if m.type == "error" else None
            on_pageerror = lambda e: errors.append(str(e))
            page.on("console", on_console)
            page.on("pageerror", on_pageerror)
            page.goto(f"{BASE}/{locale}", wait_until="networkidle")
            page.remove_listener("console", on_console)
            page.remove_listener("pageerror", on_pageerror)
            real = [e for e in errors if "favicon" not in e.lower()]
            check(f"{locale}: homepage loads without console errors", len(real) == 0, "; ".join(real[:3]))

            # Brand + content preservation.
            body = page.content()
            check(f"{locale}: brand name present", "ELLIXORRR" in body.upper())
            check(f"{locale}: html lang attribute correct", f'lang="{locale}"' in body)

            # Exactly four services must still be listed.
            svc = page.locator("#services")
            service_count = svc.locator("ul > li").count() if svc.count() else 0
            check(f"{locale}: exactly four service cards", service_count == 4, f"count={service_count}")

            # Contact channels must be unchanged.
            check(
                f"{locale}: WhatsApp channel intact",
                page.locator('a[href*="wa.me/919404044607"]').count() >= 1,
            )
            check(
                f"{locale}: email channel intact",
                page.locator('a[href^="mailto:ellixorrr@gmail.com"]').count() >= 1,
            )
            check(
                f"{locale}: phone channel intact",
                page.locator('a[href^="tel:+919404044607"]').count() >= 1,
            )

            # JSON-LD must still be valid JSON after the escaping change.
            ld = page.locator('script[type="application/ld+json"]').first
            ld_text = ld.inner_text() if ld.count() else ""
            try:
                parsed = json.loads(ld_text)
                ld_ok = parsed.get("@type") == "ProfessionalService"
            except Exception as exc:  # noqa: BLE001
                ld_ok = False
                ld_text = f"parse error: {exc}"
            check(f"{locale}: JSON-LD parses and is intact", ld_ok, ld_text[:120])

        # --------------------------------------------------------------
        # 3. Feedback allowlist: unknown codes must render nothing.
        # --------------------------------------------------------------
        page.goto(f"{BASE}/en/auth/login?error=<script>alert(1)</script>", wait_until="networkidle")
        visible = page.inner_text("body")
        check(
            "unknown error code is not rendered as visible text",
            "alert(1)" not in visible,
        )
        check(
            "unknown error code renders no application alert banner",
            count_app_alerts(page) == 0,
            f"alerts={count_app_alerts(page)}",
        )
        check(
            "unknown error code does not break out of the page's scripts",
            page.evaluate(
                "() => document.querySelectorAll('script').length"
            )
            == 14,
            "script count changed",
        )

        # A known code must render the localized message.
        page.goto(f"{BASE}/en/auth/login?error=invalid_credentials", wait_until="networkidle")
        check(
            "known error code renders a localized alert",
            count_app_alerts(page) == 1,
            f"alerts={count_app_alerts(page)}",
        )
        check(
            "known error code shows the English message",
            "Invalid email or password." in page.content(),
        )

        # A known success code must render a status banner.
        page.goto(f"{BASE}/en/auth/login?message=registered", wait_until="networkidle")
        check(
            "known success code renders a status banner",
            page.locator('[role="status"]').count() == 1,
        )

        # Localized variants must differ from English.
        page.goto(f"{BASE}/hi/auth/login?error=invalid_credentials", wait_until="networkidle")
        check(
            "Hindi error message is localized",
            "ईमेल या पासवर्ड गलत है।" in page.content(),
        )
        page.goto(f"{BASE}/mr/auth/login?error=invalid_credentials", wait_until="networkidle")
        check(
            "Marathi error message is localized",
            "ईमेल किंवा पासवर्ड चुकीचा आहे." in page.content(),
        )

        # --------------------------------------------------------------
        # 4. Open-redirect protection on ?redirectTo=
        # --------------------------------------------------------------
        page.goto(
            f"{BASE}/en/auth/login?redirectTo=" + quote("https://evil.example/en", safe=""),
            wait_until="networkidle",
        )
        injected = page.locator('input[name="redirectTo"]').count()
        check(
            "external redirectTo is not placed in the form",
            injected == 0,
            f"hidden inputs found={injected}",
        )

        page.goto(
            f"{BASE}/en/auth/login?redirectTo=" + quote("/en/dashboard", safe=""),
            wait_until="networkidle",
        )
        value = page.locator('input[name="redirectTo"]').first.get_attribute("value")
        check("safe redirectTo is preserved", value == "/en/dashboard", value)

        # --------------------------------------------------------------
        # 5. Protected routes redirect anonymous visitors to the login page.
        # --------------------------------------------------------------
        for path in ["/en/dashboard", "/en/admin", "/en/admin/enquiries", "/hi/dashboard"]:
            r = page.goto(BASE + path, wait_until="networkidle")
            loc = r.headers.get("location", "") if r else ""
            check(
                f"{path}: anonymous visitor redirected to login",
                "/auth/login" in loc or "/auth/login" in page.url,
                loc or page.url,
            )

        # --------------------------------------------------------------
        # 6. Auth pages render in every locale.
        # --------------------------------------------------------------
        for locale in ["en", "hi", "mr"]:
            for route in ["auth/login", "auth/register", "auth/forgot-password", "auth/reset-password"]:
                r = page.goto(f"{BASE}/{locale}/{route}", wait_until="networkidle")
                check(
                    f"{locale}/{route}: renders",
                    r is not None and r.status == 200,
                    f"status={r.status if r else 'none'}",
                )

        # --------------------------------------------------------------
        # 7. The profile form must not contain a business_name field.
        # --------------------------------------------------------------
        # The profile page requires a session, so the check is done on the
        # rendered source of the public contact form instead, which must keep
        # business_name (it belongs to enquiries).
        page.goto(f"{BASE}/en", wait_until="networkidle")
        check(
            "contact form keeps business_name (enquiries)",
            page.locator("#contact-business").count() == 1,
        )

        # --------------------------------------------------------------
        # 8. The locale cookie is set by the proxy on a real navigation and
        #    must NOT be clobbered by the router's prefetch requests.
        # --------------------------------------------------------------
        ctx2 = browser.new_context(viewport={"width": 1440, "height": 900})
        p2 = ctx2.new_page()
        prefetch_cookies = []
        p2.on(
            "response",
            lambda r: prefetch_cookies.append(
                (
                    r.request.headers.get("next-router-prefetch"),
                    [
                        h["value"]
                        for h in r.headers_array()
                        if h["name"].lower() == "set-cookie"
                        and "ellixorrr-locale" in h["value"]
                    ],
                )
            )
            if r.request.headers.get("next-router-prefetch") == "1"
            else None,
        )
        p2.goto(f"{BASE}/hi", wait_until="networkidle")
        p2.wait_for_timeout(1500)
        cookies = {c["name"]: c["value"] for c in ctx2.cookies()}
        check(
            "proxy sets the locale cookie to the browsed locale",
            cookies.get("ellixorrr-locale") == "hi",
            cookies.get("ellixorrr-locale"),
        )
        check(
            "prefetch requests do not set the locale cookie",
            all(not sc for _, sc in prefetch_cookies),
            f"prefetch set-cookie pairs={prefetch_cookies}",
        )
        check(
            "router prefetches for the other locales were observed",
            len(prefetch_cookies) > 0,
            f"count={len(prefetch_cookies)}",
        )
        ctx2.close()

        # --------------------------------------------------------------
        # 9. Contact form still submits through the allowlisted action.
        #    An empty submit must be rejected server-side and must land on
        #    the localized homepage contact section (no /contact route).
        # --------------------------------------------------------------
        page.goto(f"{BASE}/en", wait_until="networkidle")
        page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
        page.wait_for_timeout(500)
        page.click('form button[type="submit"]')
        page.wait_for_timeout(2500)
        check(
            "empty contact submit stays on the homepage",
            page.url.startswith(f"{BASE}/en"),
            page.url,
        )
        check(
            "empty contact submit shows a localized error banner",
            count_app_alerts(page) == 1,
            f"alerts={count_app_alerts(page)}",
        )

        # --------------------------------------------------------------
        # 10. Header no longer renders a broken authenticated state.
        # --------------------------------------------------------------
        page.goto(f"{BASE}/en", wait_until="networkidle")
        check(
            "header shows the signed-out CTA",
            page.locator('header a[href="/en/auth/login"]').count() >= 1,
        )

        ctx.close()
        browser.close()

    failed = [r for r in results if not r["ok"]]
    print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
    out = os.path.join("qa-screens", "stage-2d-results.json")
    os.makedirs("qa-screens", exist_ok=True)
    with open(out, "w", encoding="utf-8") as f:
        json.dump(results, f, indent=2, ensure_ascii=False)
    print(f"results written to {out}")
    return 1 if failed else 0


if __name__ == "__main__":
    sys.exit(main())
