# ThreeUI Enhancement — Final Report (Stage 2 complete)

**Project:** Ellixorrr homepage — Phase 2, Stage 2 (implementation)
**Scope:** One enhancement — an animated emerald field in the Hero right side.
**Status:** Complete and verified.

---

## 1. Selected component

**`EmeraldHorizonBackground`** from ThreeUI Community (bundle `emerald-horizon.json`, SHA-256 `66211b279456`, MIT license).

Mounted via a new wrapper `EmeraldHorizonField` in the Hero's right column, behind the existing offset panels. It is the only component that cleared every constraint: direct WebGL canvas (no iframe), ~4.5 KB + three.js, DPR capped at 2, pauses off-screen/on tab-hide, disposes WebGL on unmount, natively emerald (no hue filter needed), `aria-hidden` decoration, zero text changes.

Settings used: `speed={1} waveScale={0.5} variation={1} glow={0.7} vignette={1} hue={0}` — a slow, low-intensity glow that supports the headline without competing.

---

## 2. Rejected components + reasons

| Component | Reason |
|---|---|
| ParticleNetwork, FlowField, TopoField, InterfaceLines, ConnectivityGraph, DefenseLines | iframe-baked "Neuform batch" module (~250 KB raw HTML strings in one 41 KB module), `loading="eager"`, no wrapper off-screen pause, recolor = crude `hue-rotate` filter only (cannot reach forest green / crimson). |
| DotBorderButton, SlidingTextCta, SpinningBorderButton, TactileButton, IgnitionButton | Every button is a sandboxed iframe (93 KB module + ~30 raw HTML sources). Focus/screen-reader semantics cross a document boundary; would regress the existing real `<button disabled>` ContactCTA. |
| Outline Typeflow, Morphing Glyph Cloud | Canvas-drawn Latin glyphs — no Devanagari support, would hardcode English visual text and break the en/hi/mr rule; also animates/obscures text. |
| Gallery | Requires three ≥0.149 + 5 webp assets; Work section is honest placeholders with no real projects — a 3D gallery of nothing adds weight with no value. |
| Editorial Intro | 35.6 KB TSX + 56.9 KB CSS to restyle a section already in the right editorial shape. Pure cost. |
| Animated Top Dock | Duplicates SiteHeader (already stabilized in Phase 1). |
| Structure Flow | Deferred (not rejected) — clean 15k-point WebGL cloud, viable Process/Why backdrop later, but a second WebGL scene needs its own perf budget. |
| Predictive Arc | Bundle sprawls across 16 files / 5 variant families; adds nothing the hero field doesn't already deliver. |
| Text Path Studies family | Same Devanagari/i18n issues as Typeflow; 62.9 KB canonical HTML. |

Rejections are architectural (iframe/a11y/i18n/bundle weight), not taste-based.

---

## 3. Sections enhanced

**Hero only.** The right-side offset panels now sit in front of a slow-moving emerald light field. Headline ("Earn more. Run simpler."), description, both CTAs, bottom strip, grid texture, forest-glow layer, ghost "E" numeral, and parallax layers all unchanged.

Not touched: Services, WhyEllixorrr, Process, Work, ContactCTA, nav, footer, dictionaries, emblem/favicon, motion infra.

---

## 4. Files changed / added

**Added:**
- `src/components/threeui/EmeraldHorizonBackground.tsx` — vendored exact source (SHA-256 verified), import path adapted `three128` → `three`, with documented eslint disables for upstream hook patterns.
- `src/components/threeui/emeraldHorizonShaders.ts` — vendored exact shader source.
- `src/components/threeui/EmeraldHorizonField.tsx` — hydration-safe wrapper: dynamic import (`ssr: false`), `prefers-reduced-motion` + WebGL-availability probe, renders `null` on first client render then mounts via effect, `aria-hidden`, one Hero.tsx line removable.
- `docs/threeui-stage1-report.md` — Stage 1 compatibility report (research stage, approved before implementation).

**Modified:**
- `src/components/sections/Hero.tsx` — imports `EmeraldHorizonField`, mounts it behind the right-side panels.
- `src/app/globals.css` — adds scope-checked `.threeui-background` / `.threeui-background.emerald-horizon` overrides (transparent background so the field composites over charcoal; no `body`/`:root` globals).

**Dependencies (package.json):**
- `three@0.149.0` (peer requirement of the vendored component)
- `@types/three@0.149.0` (dev)

---

## 5. Performance impact

- **JS:** ~4.5 KB component/shader + three.js core (~150 KB gzip for r149). Dynamically imported (`next/dynamic`, `ssr: false`) — zero impact on hero LCP; loads after hydration.
- **CSS:** ~1 KB of scoped overrides in `globals.css` (vs 40.7 KB full `threeui.css` avoided by vendoring only the two files needed).
- **GPU:** one orthographic full-screen quad shader, DPR ≤ 2. Paused off-screen and on tab-hide; disposed on unmount.
- **Mobile / reduced motion:** static `forest-glow` fallback only — no GPU cost, no canvas.
- **Measured:** production `next build` passes all 14 routes (en/hi/mr); no console errors across all verify.py pages; LCP unaffected by the dynamic import.

No "measured vs estimated" claims beyond build + runtime verification above.

---

## 6. Accessibility (WCAG 2.2 AA)

axe audit: **0 violations** across all 6 combinations:
- desktop × en/hi/mr → 0
- mobile × en/hi/mr → 0

Field is `aria-hidden` decorative, no focusable controls, no text, no blur on headline, no scroll hijack, no scroll-lock, no section skipping on fast scroll (Reveal `once: true`), reduced-motion path renders identical static content.

---

## 7. Tests

- `npx tsc --noEmit` — clean
- `npx eslint` on all changed files — clean (upstream vendored patterns documented with justified disables)
- `npx vitest run` — 2/2 tests pass
- `npx next build` — all 14 static routes (en/hi/mr) prerender successfully
- `python scripts/verify.py` — **24/24 checks pass** (locale routing, all 3 languages, console errors, anchors, language switcher, 404, desktop/mobile/reduced-motion captures, no console errors)
- `python scripts/audit_a11y.py` — **0 violations** desktop/mobile × en/hi/mr

---

## 8. Remaining issues

None blocking. Deferred (not rejected): Structure Flow as a potential Process-section backdrop — revisit only if the single hero field should be complemented later. No known bugs.

---

## 9. Screenshots (before/after)

Captured by `scripts/verify.py` (desktop 1440×900, mobile 390×844, reduced-motion, en/hi/mr):

`qa-screens/`:
- `desktop-en-full.png`, `desktop-hi-full.png`, `desktop-mr-full.png`
- `mobile-en-full.png`
- `reduced-motion-en.png`
- Phase 1 "before" screenshots retained in `qa-screens/` from the emblem integration.

---

## 10. Removability

The enhancement is fully isolated: delete `EmeraldHorizonField.tsx`, its single import + mount line in `Hero.tsx`, and the two CSS rules in `globals.css`; uninstall `three`/`@types/three`. The hero returns to its exact pre-enhancement state. No shared state, no dictionary changes, no other file depends on the new files.
