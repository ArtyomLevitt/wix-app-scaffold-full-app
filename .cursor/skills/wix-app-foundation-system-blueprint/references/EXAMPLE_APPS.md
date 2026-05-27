# Example Apps — PRPL Reference Implementations

Three canonical PRPL apps already follow the blueprint. Mirror their patterns when scaffolding a new one — they cover all four extension types (site plugin, embedded script, custom-element widget) plus the dashboard tab structure.

---

## 1. Frequently Bought Together (FBT)

**Vertical:** Stores
**Slug:** `fbt`
**App Market:** https://www.wix.com/app-market/17d75b11-b574-4b49-9708-4ffa8be777a6
**Icon:** `assets/frequently-bought-together.png`

### Extensions
- **Site Plugin (Stores Checkout)** — Renders bundle suggestions in the Wix Stores checkout slot. Read `wix-app` → `references/SITE_PLUGIN.md`.
- **Site Plugin (Side Cart)** — Renders bundle suggestions in the side-cart slot. Read `wix-app` → `references/SITE_PLUGIN.md`.
- **Dashboard Page** — 4 tabs: Manage (bundles), Plan, Settings, How to Use.
- **Backend events** — install / remove / plan-changed → Supabase.
- **Web Methods / API routes** — `check-premium`, `app-plans`, bundle CRUD.

### Key patterns
- Bundle limit by plan tier (Free: 3, Starter: 10, Standard: 50, Advanced: unlimited).
- "Limit reached" yellow banner scrolls to the Plan tab (does not open external).
- Search bar appears once `bundles.length > 3`.
- Skeleton rows during fetch (NOT `<Loader />`).
- Auto-detect product context in widget via `window.location.pathname`.
- Live preview side-by-side with the bundle editor (`Cell span={7}` + `Cell span={5}`).

### What to copy when scaffolding a stores-flow app
- 4-tab dashboard skeleton.
- The `check-premium → packageName matching` pattern from PlansCard.
- Site Plugin + Side Cart Plugin **dual** registration in `extensions.ts`.
- The "Catalog v1 vs v3" detection wrapper for stores APIs (read `wix-app` → `references/STORES_VERSIONING.md` — mandatory).

---

## 2. Password Protected

**Vertical:** Content / Marketing
**Slug:** `password-protected`
**App Market:** https://www.wix.com/app-market/password-protected
**Icon:** `assets/password-protected.png`

### Extensions
- **Embedded Script** — Injects a password gate into every page (or selected pages) via `embeddedScripts.embedScript`. Read `wix-app` → `references/EMBEDDED_SCRIPT.md`.
- **Dashboard Page** — 4 tabs: Manage (passwords / pages), Plan, Settings (gate behavior), How to Use.
- **Data Collection** — Stores hashed passwords, allowed paths, theming. Permissions all `PRIVILEGED` (every R/W goes through `auth.elevate`).
- **Backend events** — install / remove / plan-changed → Supabase.

### Key patterns
- Embedded script reads its config via dynamic parameters (`{{passwordHash}}`, `{{redirectUrl}}`, etc.).
- Every parameter sent to `embedScript` MUST have a matching `{{name}}` placeholder in `embedded.html`. Mismatch → script fails silently.
- Settings tab "Open Dashboard" button uses `dashboard.navigate(...)` to deep-link the dashboard from the editor side panel.
- Dashboard sets `setup_completed_at` on first password save → triggers review popup after a 2s delay.

### What to copy when scaffolding a content / gate app
- Embedded script + dynamic parameters wiring (see `wix-app` → `references/DASHBOARD_PAGE.md` and the dynamic parameters section / `references/EMBEDDED_SCRIPT.md`).
- Astro API route for the embed call (`auth.elevate(embeddedScripts.embedScript)`) — NEVER from a `webMethod` in `@wix/astro` apps.

---

## 3. Share Google Drive Content

**Vertical:** Content
**Slug:** `google-drive`
**App Market:** https://www.wix.com/app-market/6d396a1f-1145-4feb-9531-3b520ab4389e
**Icon:** `assets/google-drive-content.png`

### Extensions
- **Custom Element Widget** — Renders an iframe of the user's Google Drive folder / doc / slides. Read `wix-app` → `references/CUSTOM_ELEMENT_WIDGET.md`.
- **Dashboard Page** — 4 tabs: Manage (folders), Plan, Settings (iframe size, theme), How to Use.
- **Backend events** — install / remove / plan-changed → Supabase.

### Key patterns
- Widget = React component wrapped via `react-to-webcomponent` so it can register as a custom element.
- Inline-style only (no external CSS files for site widgets).
- iframe `referrerpolicy="no-referrer-when-downgrade"`.
- Auto-detect Google Drive URL type (folder / document / slide) and rewrite to embeddable format.
- Hide widget when no config found (return `null`) — never show empty placeholder.
- Review popup triggers on first folder save (2s delay).
- Editor settings panel header shows plan badge always (even for free users).

### What to copy when scaffolding an iframe / embed app
- The custom-element widget pattern (with `react-to-webcomponent`).
- Auto-detect via `window.location.pathname` if you want per-page configs.
- The "configName prop → URL slug auto-detect → manual URL" fallback chain.
- Inline styles only inside widget (NEVER external CSS).
- iframe wrapper with `zIndex: 0` (NEVER `99999` — covers dashboard sticky header).

---

## Cross-app patterns shared by all three

| Pattern | Location | Notes |
|---------|----------|-------|
| 4-tab dashboard | `src/extensions/dashboard/pages/<page>/page.tsx` | Manage / Plan / Settings / How to Use |
| Onboarding slideshow | Same file, top of dashboard content | Gated by `localStorage[<APP_SLUG>_onboarding_done]` |
| Review popup | `src/extensions/dashboard/_shared/rate-popup.ts` | Gated by `localStorage[<APP_SLUG>_review_shown_v1]`, triggers on FIRST save |
| Premium check | `/api/app/check-premium.ts` (Astro) or `check-premium.web.ts` (non-Astro) | Returns `packageName`; `Permissions.Anyone` is broken — use `"Anyone" as any` |
| Dynamic plans | `/api/app/plans.ts` | Reads `cycleDuration.unit`, multiplies yearly × 12 for display |
| Setup tracking | `/api/app/track-setup-completed.ts` | Updates `setup_completed_at` ONCE on first save |
| 3 backend events | `src/extensions/backend/events/{installed,removed,plan-changed}/` | Single shared Supabase `app_installations` table |
| More Apps section | `src/dashboard/pages/_shared/MoreAppsCard.tsx` | 4 cards, exclude `currentSlug`, prefer same vertical |
| Help / Support | Plan + How to Use tabs | `mailto:apps-support@prpl.io` |
| Localization | `src/intl/messages/<locale>.json` | 17 locales — `da, de, en, es, fr, he, it, ja, ko, nl, pl, pt, ru, th, tr, uk, zh` |
| Astro CSRF off | `astro.config.mjs` | `security: { checkOrigin: false }` — without this, all webhooks 403 |

---

## Reference skills these apps use

PRPL local skills:
- `wix-app-blueprint` (this skill) — preflight + house-style enforcement
- `wix-editor-pick-app` — UX quality patterns
- `wix-cli-howto-faq` — GuideJar + FAQ in the How to Use tab

Official `wix/skills` (loaded via the GitHub manifest):
- `wix-app` — extension-type decisions + per-extension references + validation. Read its references on demand:
  - `references/DASHBOARD_PAGE.md` — dashboard page registration (used by all 3 apps)
  - `references/DATA_COLLECTION.md` — FBT bundles, Password gate config
  - `references/CUSTOM_ELEMENT_WIDGET.md` — Google Drive Content widget
  - `references/SITE_PLUGIN.md` — FBT side-cart + checkout slots
  - `references/EMBEDDED_SCRIPT.md` — Password Protected gate script
  - `references/BACKEND_EVENT.md` — install / remove / plan-changed handlers
  - `references/BACKEND_API.md` — `/api/app/*` Astro routes
  - `references/STORES_VERSIONING.md` — V1 vs V3 catalog detection (mandatory if using Stores)
  - `references/APP_VALIDATION.md` — final tsc + build + preview deploy
  - `references/EXTENSION_REGISTRATION.md` — `src/extensions.ts` wiring
  - `references/APP_IDENTIFIERS.md` — App namespace / Code Identifier
- `wix-design-system` — WDS components / props / examples / icons / testkit
- `wix-manage` — REST API recipes (only when the app needs server-to-server automation; e.g. provisioning Bookings services or labeling Contacts)
