# Stage 1 — ThreeUI Compatibility Report (research, pre-implementation)

**Scope:** Enhance the existing Ellixorrr homepage with selected ThreeUI Community components.
**This is an enhancement, not a redesign.** Nothing ships before this report is approved.

---

## 1. Existing site assessment (what we must not break)

Stack: Next.js 16.4.6 (App Router, Turbopack), React 19.3, TypeScript, Tailwind 4.3.3, GSAP 3.15.1 (one dynamic import), Motion 14.14, lucide-react. pnpm 12. **`three` is NOT installed.**

Design system (`src/app/globals.css`): Charcoal `#171717`, Forest `#06110c`, Crimson `#a31c1b` / bright `#c93534`, Bone `#f1f0eb`. Utilities: `display-xl/lg/md`, `eyebrow`, `grid-texture`, `forest-glow`, `ghost-numeral`, `noise-overlay`. Global reduced-motion kill-switch at 0.01ms.

Motion infra: `HeroEntrance` (once-on-load, opacity+transform), `Reveal` (whileInView once, amount 0.2), `ParallaxLayer` (GSAP scroll parallax, desktop + fine pointer + reduced-motion-gated), `MotionProvider` (`reducedMotion:"user"`), `usePrefersReducedMotion` (live media query).

Sections: Hero (headline + two CTAs + right-side offset panels with ghost "E", 3 ParallaxLayers) → BrandIntro → Services (4 services, editorial index rows) → WhyEllixorrr (2×2 hairline grid, forest surface) → Process (5 steps, numbered timeline) → Work (3 honest placeholder tiles, forest surface) → ContactCTA (real, disabled button + channels-pending notice). i18n: en/hi/mr via dictionaries — no hardcoded English exists today.

**Quality bar already met by the site:** reveals are opacity/transform only, fired once (fast-scroll safe), reduced-motion paths everywhere, no scroll hijack, no blur on text, one heavy effect max. Any addition must not regress this.

---

## 2. How ThreeUI actually works (verified from source bundles, not the catalogue)

Source bundles fetched from `threeui.com/source-code/<slug>.json` for all 19 candidates. Schema: `files[{path, role, bytes, lines, sha256, code}]`. Three distinct architectures exist:

| Architecture | Components | Runtime reality |
|---|---|---|
| **iframe-baked** ("Neuform batch") | ParticleNetwork, FlowField, TopoField, InterfaceLines, ConnectivityGraph, DefenseLines | Renders a `sandbox="allow-scripts"` **iframe** whose `srcDoc` is the canonical HTML string patched by props. Recolor via CSS `filter: hue-rotate/saturate/brightness` on the iframe. `loading="eager"`. All ~20 raw HTML sources (~250 KB of strings) live in ONE module (`NeuformBatchEffects.tsx`, 41.4 KB / 949 lines) — bundling any one component pulls them all. No built-in off-screen pause in the wrapper. |
| **iframe-baked** ("Neuform isolated") | DotBorderButton, SlidingTextCta, SpinningBorderButton, TactileButton, IgnitionButton (and ~30 more) | Same iframe mechanism, module is **93.9 KB / 2004 lines** with ~30 raw HTML sources. A button = one iframe. |
| **direct canvas/WebGL** | EmeraldHorizonBackground (THREE r128), StructureFlow (r128), Gallery (three ≥0.149), PredictiveArc canvas variants | Real `<canvas>` in the DOM. Emerald Horizon is 3.1 KB component + 1.4 KB shader, DPR capped at 2, **IntersectionObserver pause, `document.hidden` pause, full dispose on unmount** — production-grade patterns. |
| **DOM/CSS** | GalleryHeading, ThreeUIIntro, editorial-intro (SectionElements) | DOM components; editorial-intro drags 35.6 KB TSX + **56.9 KB CSS**. |

Shared style: `threeui.css` (40.7 KB / 1775 lines) — fully **BEM-scoped** (`.threeui-mount`, `.emerald-horizon`…), verified **no `body`/`html`/`:root` globals**, so it cannot collide with Tailwind 4.

npm package `@designcodeio/threeui@1.2.0`: **MIT license**, ESM, `sideEffects: ["**/*.css"]` (tree-shakable), subpath exports `./components/*`, peer react `>=18 <20` (React 19.3 ✓), peer `three >=0.149 <1`, own deps alias `three128 = three@0.128.0` and `three165`. Unpacked 54.7 MB (mostly raw sources/assets — only what you import enters the bundle).

Brand recolor: the documented mechanism is `hue/saturation/brightness` → a `filter` — crude and global. Emerald Horizon is *already* emerald/forest, so it needs `hue=0` and stays on-brand with zero filter cost. Every other candidate would need hue-rotation away from its baked palette, which cannot introduce crimson accents or exact token colors.

---

## 3. Component-by-component verdict

| Component | Verdict | Reason |
|---|---|---|
| **EmeraldHorizonBackground** | ✅ **SELECT — Hero field** | Direct WebGL (no iframe), tiny (≈4.5 KB + three), DPR cap, IntersectionObserver + visibility pause + dispose already built in. Native emerald glow = brand forest green, no filter needed. Supports the headline without competing (soft glow, slow wave). Best-in-bundle runtime hygiene. |
| ParticleNetwork | ❌ | Crisp network look fits the grid aesthetic, but: iframe architecture, ~250 KB raw-string bundle for one module, `loading="eager"`, no wrapper-level off-screen pause, recolor = filter only (stays bone/white, cannot add crimson). Heavier and riskier than Emerald Horizon for the same role. |
| FlowField | ❌ | Baked amber/coral palette — hue-rotate cannot reach forest green cleanly; iframe weight as above. |
| TopoField, InterfaceLines, ConnectivityGraph, DefenseLines | ❌ | Same iframe module; none clears Emerald Horizon's cost/benefit. Connectivity Graph's node-line idea for Process is attractive visually but the readability-first Process section and iframe weight argue against. |
| PredictiveArc | ❌ | Bundle sprawls across 16 files / 5 variant families for one visual; canvas arcs add nothing the hero field doesn't already deliver. |
| StructureFlow | ⏸️ Deferred (not rejected) | 15 000-point WebGL cloud, clean direct-THREE implementation. Could be the Process/Why backdrop later, but a second WebGL scene on the same page needs its own perf budget; decide only if the single Emerald Horizon hero field feels insufficient after Stage 2. |
| DotBorderButton, SlidingTextCta, SpinningBorderButton, TactileButton, IgnitionButton | ❌ | Every "button" is a **sandboxed iframe** (module 93.9 KB + ~30 raw sources for what we need). Focus order and screen-reader output cross a document boundary; the ContactCTA is currently a real `<button disabled>` — replacing native semantics with an iframe for a disabled CTA is an accessibility regression. Our own CSS micro-interactions (hover/press) are the right tool and already half-exist. |
| Outline Typeflow, Morphing Glyph Cloud | ❌ | Canvas-drawn **Latin glyph outlines** — no Devanagari, would hardcode English visual text and break the en/hi/mr rule; also animates/obscures text. |
| Gallery | ❌ | Requires three ≥0.149 + 5 webp assets; Work section is honest placeholders with zero real projects — a 3D image gallery of nothing is weight with no value. GalleryHeading: DOM, but pulls its module for a heading we already render better. |
| Editorial Intro | ❌ | 35.6 KB TSX + 56.9 KB CSS to restyle a section that is already the right editorial shape. Pure cost. |
| Animated Top Dock | ❌ | Duplicates SiteHeader (which Phase 1 just fixed and stabilized). |
| Text Path Studies family | ❌ | Same glyph/i18n issues as Typeflow; 62.9 KB canonical HTML. |

**Summary: 1 component selected (Emerald Horizon), 1 deferred (Structure Flow), 17 rejected** — rejections are architectural (iframe/a11y/bundle/i18n), not taste-based.

---

## 4. Proposed placement — the one enhancement

**Hero, right-side composition.** Behind the existing offset panels (which stay), mount a low-intensity `EmeraldHorizonBackground` filling the hero's right half — `waveScale` low, `glow` ~0.6–0.8, `vignette` on — so the forest glow the hero already implies becomes a slow-moving, real light field. The headline, CTAs and panels render above it; nothing moves text; nothing competes for attention. Mobile: the field is hidden or reduced to the existing static `forest-glow` (parallax layers are already desktop-only — the field follows the same rule).

Integration requirements (each is a small, isolated, removable change):
1. **Dependency:** `pnpm add three@0.149` (+ `@types/three`) for the peer, or vendor-exact route below.
2. **Two delivery options (decision needed):**
   - **A — npm package** (documented pattern): `import { EmeraldHorizonBackground } from "@designcodeio/threeui"; import "@designcodeio/threeui/style.css";` → adds 54.7 MB on disk (not in bundle), 40.7 KB scoped CSS, three128 + three aliases.
   - **B — vendor exact source**: copy the two bundle files byte-exact (`EmeraldHorizonBackground.tsx`, `emeraldHorizonShaders.ts`, sha256-verified), add `"three128": "npm:three@0.128.0"` alias in package.json, import only the needed slice of `threeui.css`. Zero extra node_modules bulk, exact-source compliant, CSS trimmed to the classes actually used. **Recommended** — smaller footprint, same file integrity.
3. **Dynamic import** (`next/dynamic`, ssr:false) so the hero's LCP is unaffected; the field paints after hydration and after first paint.
4. **Reduced motion + no-WebGL fallback:** `usePrefersReducedMotion` and a WebGL-availability check render the existing static `forest-glow` div instead — content identical, just not animated.
5. **WebGL context hygiene:** Emerald Horizon already disposes on unmount and pauses off-screen; we add nothing.
6. **i18n/a11y/copy:** zero text changes in any locale; field is `aria-hidden` decoration; contrast rules untouched (it sits behind panels at low opacity).
7. **Removability:** one file (`components/threeui/EmeraldHorizonField.tsx` wrapper), one Hero line, one CSS import — deleting the wrapper restores today's hero exactly.

Not touching: Services, Why, Process, Work, Contact, nav, footer, dictionaries, favicon/emblem, motion infra.

---

## 5. Performance cost (measured expectations, to be verified in Stage 2)

- JS: +~4.5 KB component/shader + three.js core (≈150 KB gzip for r128 WebGL) — appears only after hydration, dynamically imported, on capable desktop only.
- CSS: option B ≈ 1–2 KB used slice (vs 40.7 KB full).
- GPU: one orthographic full-screen quad shader, DPR ≤ 2, paused when off-screen or tab hidden. Mobile and reduced-motion render the static fallback → no GPU cost there.
- Acceptance gates for Stage 2: LCP delta ≤ 100 ms on desktop profile; no console errors; no WebGL context leak after route changes.

## 6. Risks

1. `three` peer adds a real dependency for one component — mitigated by option B's pinned alias and dynamic import.
2. If the npm route is chosen, 40.7 KB of unused scoped CSS ships — cosmetic, mitigated by route B.
3. Emerald Horizon's `hue` prop is applied via `optionsRef` at render — we set it to 0 and never animate props, avoiding the one props-not-reactive caveat.
4. iframe-baked components would have been the wrong tool — documented above so Stage 2 doesn't drift back into them.

## 7. Stage 2 plan (only after sign-off)

1. Add dependency (option B preferred) → 2. Vendor + verify sha256 → 3. Build `EmeraldHorizonField` wrapper (dynamic, reduced-motion + WebGL fallback, aria-hidden) → 4. Mount in Hero right column behind panels → 5. Trim/import CSS → 6. Verify: TS, ESLint, vitest, build, verify.py 24/24, axe 0 violations (desktop/mobile × en/hi/mr), Playwright screenshots before/after, reduced-motion pass, fallback pass, console clean, LCP measurement → 7. Final 10-point report.

**Approval requested on:** (a) the single-component scope, (b) option A vs B, (c) hero placement.
