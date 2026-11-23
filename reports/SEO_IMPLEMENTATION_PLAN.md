# SEO Implementation Plan — Ellixorrr

**Project:** Ellixorrr (`C:\Users\joshi\ellixorrr`)
**Branch:** `master`
**Commit:** `87949c2` (GTM integration)
**Production domain:** `https://ellixorrr.dpdns.org`
**Status:** Phase 0 complete — pre-implementation verification done

---

## 1. Current Git State

| Item | Value |
|---|---|
| Branch | `master` |
| HEAD | `87949c2` (feat: integrate Google Tag Manager) |
| Working tree | Clean (only untracked: `reports/TECHNICAL_SEO_DISCOVERABILITY_AUDIT.md`) |
| Related reports | `reports/STAGE_2D_REPORT.md`, `reports/TECHNICAL_SEO_DISCOVERABILITY_AUDIT.md` |

No unrelated uncommitted changes exist. Safe to proceed.

---

## 2. Existing Implementation Inventory

### Installed dependencies relevant to SEO
- `@next/third-parties@16.4.6` — installed (GoogleTagManager component available)
- `next@16.4.6` — supports App Router sitemap/robots metadata API natively

### Already implemented (from audit)
| Item | Status | Location |
|---|---|---|
| Per-locale metadata (title, description) | Implemented | `src/app/[locale]/layout.tsx` lines 27–28 |
| hreflang alternates (en/hi/mr) | Implemented | `src/app/[locale]/layout.tsx` lines 31–35 |
| Open Graph (type, siteName, title, description, locale) | Partially implemented | `src/app/[locale]/layout.tsx` lines 37–44 |
| JSON-LD ProfessionalService | Implemented | `src/app/[locale]/layout.tsx` lines 72–91 |
| GTM integration | Implemented | `src/app/[locale]/layout.tsx` line 67 |
| `getAppOrigin()` helper | Implemented | `src/lib/navigation.ts` lines 138–143 |
| Semantic HTML, heading hierarchy | Implemented | Multiple component files |
| Skip-to-content link | Implemented | `src/app/[locale]/layout.tsx` lines 92–97 |

### Known gaps (from audit)
| # | Gap | Severity |
|---|---|---|
| C1 | No `sitemap.xml` | Critical |
| C2 | No `robots.txt` | Critical |
| C3 | Relative canonical URL (`/{locale}`) | Critical |
| C4 | Global `index: follow` on private routes | Critical |
| H1 | No Open Graph images | High |
| H2 | No Twitter Cards | High |
| H3 | No absolute `openGraph.url` | High |
| H4 | No `next/image` optimization | High |
| M1 | No `llms.txt` | Medium |
| M2 | Limited structured data types | Medium |
| M3 | JSON-LD domain uses `ellixorrr.com` instead of `ellixorrr.dpdns.org` | Medium |
| L1 | No default locale fallback | Low |
| L2 | Hardcoded copyright year | Low |

---

## 3. Confirmed Audit Findings

### Routes requiring `noindex`
All routes under `/auth`, `/dashboard`, `/admin` must carry `robots: { index: false, follow: true }`:
- `/[locale]/auth/login`
- `/[locale]/auth/register`
- `/[locale]/auth/forgot-password`
- `/[locale]/auth/reset-password`
- `/[locale]/dashboard` and all children
- `/[locale]/admin` and all children

### Routes that are indexable
Only `/[locale]` (homepage) for en, hi, mr.

### Domain configuration
- Current production domain: `https://ellixorrr.dpdns.org`
- JSON-LD currently references `https://ellixorrr.com/${locale}` — **wrong domain**, must be fixed
- Centralized `NEXT_PUBLIC_SITE_URL` env var required per task spec

---

## 4. Files Expected to Change

### New files
| File | Purpose |
|---|---|
| `src/lib/site-config.ts` | Centralized `NEXT_PUBLIC_SITE_URL` configuration |
| `src/app/sitemap.ts` | Next.js App Router sitemap (public pages only) |
| `src/app/robots.ts` | Next.js App Router robots.txt |
| `src/app/llms.ts` | llms.txt for AI crawlers |
| `reports/PHASE_1_TECHNICAL_SEO_REPORT.md` | Phase 1 report |
| `reports/PHASE_2_SOCIAL_METADATA_REPORT.md` | Phase 2 report |
| `reports/PHASE_3_STRUCTURED_DATA_REPORT.md` | Phase 3 report |
| `reports/PHASE_4_AEO_GEO_REPORT.md` | Phase 4 report |
| `reports/PHASE_5_PERFORMANCE_REPORT.md` | Phase 5 report |
| `reports/PHASE_6_SEARCH_CONSOLE_READINESS_REPORT.md` | Phase 6 report |
| `reports/FINAL_SEO_AEO_GEO_IMPLEMENTATION_REPORT.md` | Final report |

### Modified files
| File | Expected changes |
|---|---|
| `src/app/[locale]/layout.tsx` | Absolute canonical, noindex on private routes, OG images, Twitter Cards, corrected JSON-LD domain |
| `src/lib/navigation.ts` | Add `getSiteUrl()` helper (or extend `getAppOrigin()`) |

### Not changing (per constraints)
- `.env.local` — never accessed
- Supabase/migrations — untouched
- Authentication/authorization — untouched
- GTM/GA4 integration — preserved as-is
- Existing tests — preserved
- Logo/brand assets — untouched

---

## 5. Implementation Order

| Phase | Focus | Dependencies |
|---|---|---|
| 0 | Pre-implementation verification (this document) | None |
| 1 | Technical SEO foundation: site-config, sitemap, robots, canonical, hreflang, noindex | Phase 0 |
| 2 | Social metadata: Open Graph images, Twitter Cards | Phase 1 |
| 3 | Structured data: Organization, WebSite, ProfessionalService, Service, BreadcrumbList | Phase 2 |
| 4 | AEO/GEO: llms.txt, AI crawler policy, content clarity | Phase 3 |
| 5 | Performance: images, LCP/INP/CLS audit | Phase 4 |
| 6 | Search Console readiness: checklist, important URLs | Phase 5 |
| 7 | Final validation: tsc, eslint, vitest, next build, route checks | All phases |

---

## 6. Risks

| Risk | Mitigation |
|---|---|
| `NEXT_PUBLIC_SITE_URL` not set in Render | Fallback to `https://ellixorrr.dpdns.org` |
| Next.js sitemap/robots API compatibility | Next.js 16.4.6 supports `sitemap.ts`/`robots.ts` natively |
| JSON-LD escaping issues | Preserve existing `.replace()` escaping pattern |
| Private route indexing | Test that `noindex` applies only to non-public routes |
| Domain hardcoding in JSON-LD | Fix `ellixorrr.com` → `ellixorrr.dpdns.org` via site config |

---

## 7. Phase 0 Deliverable

This document (`reports/SEO_IMPLEMENTATION_PLAN.md`) serves as the Phase 0 deliverable.

**Verification complete:**
- [x] Git branch is `master`
- [x] Working tree is clean (no unrelated modifications)
- [x] HEAD commit `87949c2` is the GTM integration commit
- [x] Audit report read and understood
- [x] Existing metadata implementation inspected
- [x] Existing JSON-LD inspected (domain error confirmed: `ellixorrr.com`)
- [x] Authentication/private route boundaries inspected
- [x] GTM integration confirmed installed and active
- [x] No SEO changes made since the audit

Ready to proceed to Phase 1.

---
