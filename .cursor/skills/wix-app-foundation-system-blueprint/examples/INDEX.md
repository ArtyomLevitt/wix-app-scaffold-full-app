# PRPL App Examples — Catalog

This folder bundles **real, production PRPL apps** as reference implementations. When scaffolding a new app, the agent should:

1. **Read this INDEX first** to find the closest-matching reference.
2. **Open that app's `SUMMARY.md`** (~80 lines per app) — it summarises what to copy and the gotchas.
3. **Open the specific files** mentioned in the SUMMARY only when needed.
4. **Always check `_shared/`** — it has the canonical PRPL versions of cross-cutting files (rate popup, premium check, plans, events, Supabase client, tracking) that EVERY app uses verbatim.

**Don't read every app's full source.** The agent's reading path is:
`SKILL.md` → this `INDEX.md` → 1–2 `SUMMARY.md` files → 2–3 specific code files. Bounded context, concrete patterns.

---

## Reading order — start here

Every new app reads these first, in order:

| 1. | `_shared/README.md` | What's canonical and where it goes in your new app |
| 2. | `_shared/rate-popup.ts` | Copy verbatim |
| 3. | `_shared/check-premium.web.ts`, `_shared/app-plans.web.ts` | Copy verbatim |
| 4. | `_shared/events/{app-installed,app-removed,plan-changed}.ts` | Copy verbatim |
| 5. | `_shared/supabase-client.ts` + `_shared/tracking.web.ts` | Copy + scrub secrets, gitignore the supabase client |

Once you have the shared scaffolding in place, pick the example app most similar to what you're building.

---

## Deep-dive examples (7)

Each has a `SUMMARY.md` + 4–7 essential files (verbatim or lightly-distilled, scrubbed of secrets).

### 1. `frequently-bought-together/` — Multi-slot Site Plugin (Stores)

| Field | Value |
|-------|-------|
| **Stack** | Legacy CLI (no Astro) |
| **Vertical** | Stores — checkout / side cart |
| **Extensions** | 2 × Site Plugin (custom-elements), Dashboard Page, Web Methods, Backend Events, 2 × Data Collection |
| **Use as reference for** | Apps that render in checkout / side-cart / product-page slots; per-product rule managers; cross-vendor stores apps |
| **Distinctive patterns** | Settings polling from Wix Data every 3s in editor preview; first-rule celebration → review popup chain; per-plan rule limits (`PLAN_RULE_LIMITS[planName]`); v3+v1 product API fallback |

### 2. `password-protected/` — Embedded Script + HTTP API

| Field | Value |
|-------|-------|
| **Stack** | Legacy CLI (no Astro) |
| **Vertical** | Content / Site Tools |
| **Extensions** | Embedded Script (HEAD), Dashboard Page, Web Methods, HTTP API Route, Backend Events, Data Collection |
| **Use as reference for** | Embedded-script apps (analytics, gates, tag injectors); apps with `{{placeholders}}` templated by `embedScript()`; site widgets calling HTTP APIs via `fetchWithAuth()` |
| **Distinctive patterns** | `scriptType: ESSENTIAL` to bypass cookie banner; base64-encoded JSON in placeholders; client-side SHA-256 verification; localStorage `remember-visitor` with TTL; site-prefix-tolerant path matching |

### 3. `share-google-drive-content/` — Custom Element Widget (iframe)

| Field | Value |
|-------|-------|
| **Stack** | Legacy CLI (no Astro) |
| **Vertical** | Content / Site Tools |
| **Extensions** | Custom Element Widget + Editor Settings Panel, Dashboard Page, Web Methods, Backend Events |
| **Use as reference for** | iframe-based widgets (embeds, players, calendars); apps with watermark on free tier; URL → embed-URL parser tables |
| **Distinctive patterns** | `widget.getProp` / `widget.setProp` two-way binding; premium → `widget.setProp('ispremium', '...')` propagation so widget hides watermark instantly; `behaviors.dashboard` linking widget to dashboard page; CSS modules for site widgets (no WDS) |

### 4. `custom-additional-fees/` — Service Plugin (`additionalFees`)

| Field | Value |
|-------|-------|
| **Stack** | Legacy CLI (no Astro) |
| **Vertical** | Stores — checkout fees |
| **Extensions** | Service Plugin (`ecom-additional-fees`), Site Plugin (indicator), Dashboard Page + Modal, HTTP API CRUD, Backend Events, Data Collection |
| **Use as reference for** | Apps using `additionalFees`, `taxes`, `shippingRates` SPIs; HTTP API CRUD instead of web methods; "applies to all" sentinel collection IDs |
| **Distinctive patterns** | `additionalFees.provideHandlers({ calculateAdditionalFees })`; stable `_id` end-to-end (no auto-generated UUIDs in shared records); `auth.elevate` on every items call; WDE0025 graceful handling on first install |

### 5. `shipping-address-verifier/` — Service Plugin (`validations`)

| Field | Value |
|-------|-------|
| **Stack** | Legacy CLI (no Astro) |
| **Vertical** | Stores — checkout validation |
| **Extensions** | Service Plugin (`ecom-validations`), Dashboard Page, Web Methods (settings), Backend Events, Data Collection |
| **Use as reference for** | Apps using `validations` SPI; cart-vs-checkout severity differentiation; single-row settings collections; address-shape defensive parsing |
| **Distinctive patterns** | `validations.provideHandlers({ getValidationViolations })`; severity by source (`source === 'CHECKOUT' ? 'ERROR' : 'WARNING'`); `validateInCart: true` in plugin.json; defensive payload extraction (5 helpers); `Intl.DisplayNames` for human-readable country names; `MISSING_COLLECTION_HINT` actionable error |

### 6. `advanced-product-file-uploader/` — Modern Astro App

| Field | Value |
|-------|-------|
| **Stack** | **Astro** (`@wix/astro` + Cloudflare adapter) |
| **Vertical** | Stores — file uploads |
| **Extensions** | 11 (Dashboard Page + Modal + Plugin, Site Plugin × 2, Embedded Script, 5 × Backend Events, Data Extension) |
| **Use as reference for** | **Every new Astro app**; multi-extension apps; HTTP API routes (`src/pages/api/*.ts`); declaring data collections in TS via `genericExtension` |
| **Distinctive patterns** | Single `extensions.ts` with `app().use(...)` chain; `<name>.extension.ts` + `<name>.ts` split per extension; `security: { checkOrigin: false }` mandatory; API routes alongside web methods (different audiences); cross-vendor `placements` (Stores v3 + classic) |

### 7. `paypal-payment-button/` — Third-Party SDK + Provider Credentials (Astro)

| Field | Value |
|-------|-------|
| **Stack** | **Astro** (`@wix/astro` + Cloudflare adapter) |
| **Vertical** | Payments / Site Tools |
| **Extensions** | Custom Element Widget + Settings Panel, Dashboard Page, Data Extension, 3 × Backend Events, HTTP API Routes |
| **Use as reference for** | Apps integrating a runtime-loaded **third-party SDK** (Stripe, Klarna, Plaid, Square, Mapbox, Calendly); apps storing **provider credentials** (API keys / OAuth tokens) the merchant pastes once; apps that need to **auto-detect the credential's environment** (sandbox vs live, staging vs prod); apps with **per-month free-tier rate limits**; apps where the widget needs to behave differently in the editor vs the live site |
| **Distinctive patterns** | `<script>` injection of an external SDK with `window.__paypalSdkPromises` cache + `window.fetch` unlock for hardened iframes; **server-side token-kind probe** combining 4 parallel signals (live SDK + sandbox SDK + live OAuth + sandbox OAuth) to detect environment from a single client ID; **single Wix Data collection with `key` discriminator** holding multiple logical docs (credentials + usage counter); `auth.elevate(items.query)` on every Wix Data call (PRIVILEGED collection); **editor-environment detection** rendering a static placeholder instead of the live SDK; **dual-mode widget** (fixed payment / donation with preset chips) driven by a single string prop; per-month usage counter encoded as `<base64-count>~~<base64-month>~~` (resets implicitly when month changes) |

---

## Index-only references (6 more apps)

These apps have similar patterns to the deep-dives but aren't bundled in detail. **Read the source directly at the path below** if a deep-dive doesn't match what you're building.

### `360-product-viewer` (Backup)
- **Path:** `~/Documents/Wix apps Backup/360-product-viewer/`
- **Stack:** Legacy CLI
- **Extensions:** Custom Element Widget + Settings Panel, Dashboard Page, Backend
- **Why interesting:** Image-frame rotation widget (alternative to iframe); premium gating where free is limited to 1 product
- **Compare with:** `share-google-drive-content` (similar custom-element widget pattern)

### `360-product-viewer` (Active in `~/`)
- **Path:** `~/360-product-viewer/`
- **Stack:** Legacy CLI
- **Why interesting:** This is the **active version** the user is currently iterating on — newer than the Backup copy. Worth diff-checking the two when the user asks "how is this app currently structured" vs "how was it built".

### `product-file-uploader`
- **Path:** `~/Documents/Wix apps Backup/product-file-uploader/`
- **Stack:** Astro
- **Why interesting:** Older Astro version of `advanced-product-file-uploader`. Compare the two to see the user's Astro app evolution.
- **Compare with:** `advanced-product-file-uploader` (deep-dive)

### `calendly-integration`
- **Path:** `~/Documents/Wix apps Backup/calendly-integration/`
- **Stack:** Astro
- **Vertical:** Bookings / 3rd-party integration
- **Extensions:** Site Widget, Dashboard, API routes (OAuth callback)
- **Why interesting:** Third-party OAuth pattern + sync across systems
- **Compare with:** `advanced-product-file-uploader` (Astro structure)

### `facebook-feed`
- **Path:** `~/Documents/Wix apps Backup/facebook-feed/`
- **Stack:** Astro
- **Vertical:** Content / Social feeds
- **Extensions:** Site Widget, Dashboard, API routes (Facebook Graph API)
- **Why interesting:** Periodic API sync + caching with TTL; OAuth-less (uses long-lived FB page tokens)

### `tiktok-feed`
- **Path:** `~/Documents/Wix apps Backup/tiktok-feed/`
- **Stack:** Astro
- **Vertical:** Content / Social feeds
- **Extensions:** Site Widget, Dashboard, API routes (TikTok API)
- **Why interesting:** Sibling of `facebook-feed` — same shape, different API. Diff-check the two to extract the "social-feed widget" pattern.

---

## What's NOT in `examples/`

- **`purple-wix-connect`** — This is an Express OAuth bridge, NOT a Wix CLI app. Don't use as a reference for app scaffolding.
- **All-locale `intl/messages/*.json`** — Only `en.json` is bundled per app. For new apps, machine-translate from English with `wix translate` or Claude.
- **Asset folders** (`assets/*.png`, `*.svg`) — Replace with your app's own brand assets when scaffolding.
- **`node_modules/`, `dist/`, `package-lock.json`** — Excluded by definition.

---

## Decision tree — which deep-dive should I read?

```
Is your app primarily a:
├── Site widget that goes IN A SLOT (checkout, side cart, product page details, …)
│   ├── …with TWO+ slots? → frequently-bought-together
│   └── …with ONE slot, simple display? → frequently-bought-together (just one of the plugins)
│
├── Site widget that's a DRAGGABLE element (iframe / video / map / calendar)?
│   ├── Spec asks for dashboard **Live Preview** (form + preview update together)?
│   │   → **google-calendar** (sticky 7/5 Manage layout) + share-google-drive-content (URL parser / watermark only)
│   ├── Spec says config lives mainly in the **editor panel** (light dashboard “test link”)?
│   │   → share-google-drive-content (primary)
│   └── Unsure? Read both SUMMARY.md files (~80 lines each) and pick by spec wording — never copy one app wholesale.
│
├── Site widget that integrates a THIRD-PARTY SDK loaded at runtime (Stripe, Klarna,
│   Plaid, Square, Mapbox, Calendly, …) AND/OR stores provider credentials
│   (API keys, OAuth tokens) the merchant pastes once?
│   → paypal-payment-button
│
├── Embedded script (<script>) injected site-wide (analytics, password gates, head injectors)?
│   → password-protected
│
├── Service plugin running at checkout (additional fees / taxes / shipping rates)?
│   → custom-additional-fees
│
├── Service plugin validating cart/checkout (block addresses, require fields, custom rules)?
│   → shipping-address-verifier
│
└── Anything else (file uploaders, integrations, OR you're building a new app from scratch)?
    → advanced-product-file-uploader (modern Astro template — start here)
```

Multiple matches? Read multiple SUMMARY.md files (each is ~80 lines). Don't read multiple full source trees — context budget.
