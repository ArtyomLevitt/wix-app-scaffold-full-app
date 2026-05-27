# Custom Additional Fees

**App ID:** `<APP_ID>`
**App Slug:** `caf`
**App Namespace:** `@s21797/custom-additional-fees`
**Vertical:** Stores / Checkout
**Stack:** Legacy CLI (no Astro)
**Source path:** `~/Documents/Wix apps Backup/custom-additional-fees/`

## What it does

Adds custom fees (e.g. "Cold Items handling +$5") at checkout based on which collection a product belongs to. The merchant defines fees in the dashboard with `{ name, description, price, collectionId }`. When a customer reaches checkout, Wix calls our **`additionalFees.calculateAdditionalFees` service plugin handler**, we look up matching fees, and Wix adds them to the cart total.

## Extensions registered

| Extension | Path | Purpose |
|-----------|------|---------|
| Dashboard Page | `src/dashboard/pages/page.tsx` (1314 lines) | 3 tabs: Manage fees / Plan & Settings / How to Use |
| Dashboard Modal | `src/dashboard/modals/add-fee/modal.tsx` | "Add / Edit fee" modal opened from the Manage tab |
| Service Plugin | `src/backend/service-plugins/ecom-additional-fees/additional-fee/plugin.ts` (55 lines) | The `additionalFees.calculateAdditionalFees` handler — runs at checkout |
| Service Plugin Config | `src/backend/service-plugins/ecom-additional-fees/additional-fee/plugin.json` | `$schema: ecom-additional-fees.json`, just `id` + `name` |
| Site Plugin (Custom Element) | `src/site/plugins/custom-elements/custom-fee-indicator/plugin.tsx` | Shows "+ $5 fee will be added" on the product page |
| HTTP API | `src/backend/api/custom-additional-fees/api.ts` (124 lines) | `GET / POST / PUT / DELETE` for fees CRUD (used by dashboard) |
| HTTP API | `src/backend/api/product-fee/api.ts` (30 lines) | `GET ?productId=X` — used by site plugin to figure out which fee applies to the displayed product |
| Backend Web Methods | `check-premium-plan.web.ts`, `app-plans.web.ts`, `order-stats.web.ts` | Premium + plans + per-fee analytics |
| Backend Events | `app-installed`, `app-removed`, `plan-changed` | See `examples/_shared/events/`. |
| Data Collection | `@s21797/custom-additional-fees/custom-additional-fees` | Stores fees: `{ _id, name, description, collectionId, price }` |

## Key patterns to copy

1. **Service Plugin handler shape** — `additionalFees.provideHandlers({ calculateAdditionalFees: async ({ request, metadata }) => { ... } })`. The handler receives `request.lineItems` (cart contents) and `metadata.currency`. It MUST return `{ additionalFees: [...], currency }`.
2. **Plugin config is tiny** — `plugin.json` is just `{ $schema, id, name }`. The `$schema` URL determines which Wix slot the plugin fills (here: `ecom-additional-fees.json`).
3. **Match fees to products via collection** — Each fee declares ONE `collectionId`. At checkout, we query all products in the cart, gather their collection IDs, and intersect with fee collections. A magic `'all-products'` (`ALL_PRODUCTS_ID` constant) means "applies to every product".
4. **Stable IDs end-to-end** — `createFee()` uses `_id: fee.id` so the dashboard, site plugin, and service plugin all reference the same row by the same UUID. **Never let Wix Data auto-generate `_id` for shared records.** Use `crypto.randomUUID()` server-side.
5. **`auth.elevate` for every items.* call** — The fees-store helper wraps every `items.query`, `items.insert`, `items.update`, `items.get`, `items.remove` with `auth.elevate(...)`. Without elevation, the calls fail when the dashboard isn't in elevated context.
6. **Graceful collection-missing handling** — `listFees()` catches WDE0025 ("collection does not exist") and returns `[]` instead of crashing. Useful when the data extension hasn't yet auto-created the collection on first install.
7. **HTTP API for dashboard CRUD** — Dashboard talks to a REST API (`api/custom-additional-fees/api.ts`) instead of web methods. This is the modern approach: easier to call from React (`fetch('/api/custom-additional-fees', { method: 'POST', body })`), easier to debug, no `webMethod` boilerplate. Consider this for new apps.
8. **A separate, focused HTTP API for the site plugin** — `api/product-fee/api.ts` returns the single fee that applies to a given productId. Different audience (storefront), different shape, different file.

## localStorage keys

```ts
const REVIEW_SHOWN_KEY = 'caf_review_shown_v1';
const ONBOARDING_KEY   = 'caf_onboarding_done';
```

## Constants

```ts
export const APP_NAMESPACE      = '@<APP_NS>/custom-additional-fees';
export const FEES_ID_SUFFIX     = 'custom-additional-fees';
export const FEES_COLLECTION_ID = `${APP_NAMESPACE}/${FEES_ID_SUFFIX}`;
export const ALL_PRODUCTS_ID    = 'all-products';   // sentinel for "applies to every product"
```

## Files in this folder

- `extensions-overview.md` — full file map
- `service-plugin.ts` — the `additionalFees.calculateAdditionalFees` handler (verbatim, scrubbed)
- `service-plugin.plugin.json` — service plugin config
- `api-fees-crud.ts` — REST CRUD for fees (verbatim, scrubbed)
- `api-product-fee.ts` — site-plugin lookup endpoint (verbatim, scrubbed)
- `fees-store.ts` — Wix Data wrapper with `auth.elevate` everywhere (verbatim, scrubbed)
- `intl-en.json` — full English translations

## When to use as reference

- Apps that hook into Wix's eCom service plugins (`additionalFees`, `taxes`, `shippingRates`, `validations`)
- Apps where a dashboard manages config rows that the storefront (or service plugin) reads in real time
- Apps with HTTP API CRUD instead of web methods
- Apps with a "magic ID" sentinel (`'all-products'`) for "applies to all" semantics
