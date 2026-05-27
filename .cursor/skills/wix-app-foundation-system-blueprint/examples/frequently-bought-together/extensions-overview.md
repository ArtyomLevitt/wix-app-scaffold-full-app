# FBT — Full Extension Map

Use this as a reference for what files exist in the original repo at `~/Documents/Wix apps Backup/frequently-bought-together/`. All paths are relative to that folder.

## Dashboard

| File | What it does |
|------|--------------|
| `src/dashboard/pages/page.tsx` (2403 lines) | Main dashboard — 3 tabs (Manage / Plan & Settings / How to Use). See `dashboard-skeleton.tsx` for the distilled structure. |
| `src/dashboard/pages/page.json` | `{ id, title }`. Title becomes the dashboard nav label. |
| `src/dashboard/_shared/rate-popup.ts` | Shadow-DOM review popup. See `examples/_shared/rate-popup.ts`. |
| `src/dashboard/pages/assets/*.png` | Onboarding images, more-apps icons, demo product photos. |

## Site plugins (custom-elements)

| File | What it does |
|------|--------------|
| `src/site/plugins/custom-elements/fbt-checkout/plugin.tsx` (404 lines) | Checkout slot plugin. See `site-plugin-checkout.tsx` for the distilled version. |
| `src/site/plugins/custom-elements/fbt-checkout/plugin.json` | Slot registration: `slotId: "checkout:summary:lineItems:after"`. |
| `src/site/plugins/custom-elements/fbt-checkout/panel.tsx` (370 lines) | Editor settings panel for the Checkout plugin (uses `@wix/dashboard-react` and reads/writes the settings collection). |
| `src/site/plugins/custom-elements/fbt-side-cart/plugin.tsx` (462 lines) | Side-cart slot plugin (mirror of checkout, but reads cart instead of checkout). |
| `src/site/plugins/custom-elements/fbt-side-cart/plugin.json` | Slot registration for the side-cart slot. |
| `src/site/plugins/custom-elements/fbt-side-cart/panel.tsx` (370 lines) | Editor settings panel for the Side Cart plugin. |

## Backend (web methods + events)

| File | What it does |
|------|--------------|
| `src/backend/recommendations.web.ts` | The recommendations engine. Two methods: `getCheckoutRecommendations(checkoutId)` and `getSmartRecommendations(productNames, location)`. |
| `src/backend/check-premium-plan.web.ts` (57 lines) | Premium check. See `examples/_shared/check-premium.web.ts`. |
| `src/backend/app-plans.web.ts` (95 lines) | Dynamic plans. See `examples/_shared/app-plans.web.ts`. |
| `src/backend/_shared/supabase-client.ts` | Supabase client — gitignored. See `examples/_shared/supabase-client.ts`. |
| `src/backend/_shared/tracking.web.ts` | Setup-completed tracker. See `examples/_shared/tracking.web.ts`. |
| `src/backend/events/app-installed/event.ts` (72 lines) | onAppInstanceInstalled handler. See `examples/_shared/events/app-installed.ts`. |
| `src/backend/events/app-removed/event.ts` (27 lines) | onAppInstanceRemoved handler. See `examples/_shared/events/app-removed.ts`. |
| `src/backend/events/plan-changed/event.ts` (53 lines) | Both onPaidPlanPurchased and onPaidPlanChanged. See `examples/_shared/events/plan-changed.ts`. |

## Internationalization

| File | What it does |
|------|--------------|
| `src/intl/messages/en.json` (~270 keys) | Source-of-truth English. See `intl-en.json` here. |
| `src/intl/messages/{de,es,fr,it,ja,ko,nl,pl,pt,ru,th,tr,uk,zh,da}.json` | 15 translations + en. |
| `src/intl/load-messages.ts` | Helper that picks the right locale via `i18n.getLocale()`. Used by both dashboard and site plugins. |
| `src/intl/withIntlProvider.tsx` | Dashboard HOC that wraps the page in `IntlProvider`. Site plugins do their own `IntlProvider` because `withIntlProvider` only works in the dashboard tree. |

## Data Collections (declared via `wix.config.json` or auto-created on first write)

| Collection ID | Purpose |
|---------------|---------|
| `@s21797/frequently-bought-together/fbt-rules` | Recommendation rules (one row per source product). |
| `@s21797/frequently-bought-together/fbt-settings` | Per-site display settings (`displayName`, `maxItems`, etc.). Polled by site plugins every 3s in editor preview. |

## What's NOT in this folder (and not bundled in `examples/`)

- `panel.tsx` for the FBT plugins — for editor panels, see the official `wix-app/references/CUSTOM_ELEMENT_WIDGET.md`.
- The full `src/intl/messages/{de,es,…}.json` — out of scope for the agent (auto-translate via `wix translate` or copy structure from `en.json`).
- `src/dashboard/pages/assets/` — replace with your app's own assets when scaffolding.
