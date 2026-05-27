# Frequently Bought Together (FBT)

**App ID:** `<APP_ID>` (replaced — original is `17d75b11-...` from App Market URL)
**App Slug:** `fbt`
**App Namespace:** `@s21797/frequently-bought-together`
**Vertical:** Stores
**Stack:** Legacy CLI (no Astro)
**Source path:** `~/Documents/Wix apps Backup/frequently-bought-together/`

## What it does

Boosts AOV by showing "frequently bought together" recommendations in two slots — the side cart and the checkout summary — based on rules the merchant defines from a dashboard. Also shows smart fallback recommendations when no rule matches the cart.

## Extensions registered

| Extension | Path | Purpose |
|-----------|------|---------|
| Dashboard Page | `src/dashboard/pages/page.tsx` | 3 tabs: Manage rules / Plan & Settings / How to Use |
| Site Plugin (Checkout) | `src/site/plugins/custom-elements/fbt-checkout/plugin.tsx` | Renders recs in the Checkout `summary:lineItems:after` slot |
| Site Plugin (Side Cart) | `src/site/plugins/custom-elements/fbt-side-cart/plugin.tsx` | Renders recs in the Side Cart slot |
| Backend Web Methods | `src/backend/recommendations.web.ts`, `check-premium-plan.web.ts`, `app-plans.web.ts` | Recommendations engine + premium + dynamic plans |
| Backend Events | `src/backend/events/{app-installed,app-removed,plan-changed}/event.ts` | Supabase sync — see `examples/_shared/events/` |
| Data Collection | `@s21797/frequently-bought-together/fbt-rules` | Stores recommendation rules (source product → recommended products + placement + status) |
| Data Collection | `@s21797/frequently-bought-together/fbt-settings` | Stores per-site display settings (read by site plugins via `items.query` polling) |

## Key patterns to copy

1. **Two site plugins, ONE app** — The same recommendation logic renders in two different slots (`checkout:summary:lineItems:after` and the side-cart slot). Each plugin is its own `custom-elements/<name>/plugin.tsx` with its own `plugin.json`. Both call into a shared `backend/recommendations.web.ts`.
2. **Settings live in a data collection, not props** — The site plugins poll `items.query('@s21797/frequently-bought-together/fbt-settings')` every 3 seconds in editor preview, so panel changes appear in real time. In production they read once on mount.
3. **Premium + dynamic plans + rule-limit gating** — The dashboard reads `checkPremium()` for plan name, then looks up `PLAN_RULE_LIMITS[currentPlanName.toLowerCase()]` to enforce a per-plan rule cap. Free = 1 rule, Starter = 5, Standard = unlimited, etc. "Limit reached" buttons scroll to pricing instead of disabling.
4. **Catalog v1 + v3 dual fetch** — `productsV3.queryProducts()` first, fallback to `products.queryProducts()`. Paginate via `result.hasNext()` + `result.next()`.
5. **First-rule celebration → review popup chain** — `handleSave` checks `rules.length === 0` BEFORE insert. On first insert, calls `triggerCelebrationOnce()` which shows the green banner for 2s, THEN calls `triggerReviewPopupOnce()`. Both gated by separate localStorage keys.
6. **Onboarding inside the Manage tab** — `dashboardTab === 'manage' && isFirstTime && !onboardingDismissed`. Hides ALL manage-tab content (stats, table, form) until dismissed. Plan & Settings + How to Use tabs remain accessible.
7. **3 tabs, not 4** — Plan and Settings are combined into one tab labelled `Plan & Settings`. The blueprint's "4 tabs" prescription is the upper bound; FBT proves the lower bound (3) is also fine when settings are minimal.

## localStorage keys

```ts
const REVIEW_SHOWN_KEY      = 'fbt_review_shown_v1';
const CELEBRATION_SHOWN_KEY = 'fbt_celebration_v1';
// onboarding has its own key inside the dashboard:
//   'fbt_onboarding_done' (read in useState initializer, set by setOnboardingDismissed)
```

## Constants from the dashboard

```ts
const APP_ID                  = '<APP_ID>';
const COLLECTION_ID           = '@s21797/frequently-bought-together/fbt-rules';
const SETTINGS_COLLECTION     = '@s21797/frequently-bought-together/fbt-settings';
const ITEMS_PER_PAGE          = 10;
const MAX_RECOMMENDED_PRODUCTS = 3;
const REVIEW_URL              = `https://www.wix.com/app-market/add-review/${APP_ID}`;
```

## Per-plan rule limits

```ts
const PLAN_RULE_LIMITS: Record<string, number> = {
  free:     1,
  basic:    1,
  starter:  5,
  standard: 25,
  advanced: Infinity,   // unlimited
  premium:  Infinity,
};
```

## Site plugin slot IDs

| Plugin | `appDefinitionId` | `widgetId` | `slotId` |
|--------|-------------------|------------|----------|
| FBT Checkout | `1380b703-ce81-ff05-f115-39571d94dfcd` (Wix Stores) | `14fd5970-8072-c276-1246-058b79e70c1a` | `checkout:summary:lineItems:after` |
| FBT Side Cart | `1380b703-ce81-ff05-f115-39571d94dfcd` | side-cart widget | side-cart slot |

## Files in this folder

- `extensions-overview.md` — list of every plugin/component file in the original repo (so you know what to copy/adapt)
- `dashboard-skeleton.tsx` — stripped 3-tab dashboard structure (~250 lines, distilled from the 2403-line original)
- `site-plugin-checkout.tsx` — the FBT Checkout site plugin (verbatim, scrubbed)
- `site-plugin-checkout.plugin.json` — slot registration
- `intl-en.json` — full English translation key set (use as starting point for new apps)

## When to use as reference

- Multi-slot site plugin apps (e.g. checkout + side cart, checkout + product page)
- Stores apps with per-product rules (recommendations, badges, upsells)
- Apps that need plan-tier-based caps (rules / configs / events / etc.)
- Apps where the site plugin must read editor settings live
