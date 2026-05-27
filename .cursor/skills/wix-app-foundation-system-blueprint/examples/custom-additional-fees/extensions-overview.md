# Custom Additional Fees — Full Extension Map

Source: `~/Documents/Wix apps Backup/custom-additional-fees/`

## Dashboard

| File | What it does |
|------|--------------|
| `src/dashboard/pages/page.tsx` (1314 lines) | 3 tabs: fees table / Plan & Settings / How to Use. Calls `/api/custom-additional-fees` for CRUD. |
| `src/dashboard/pages/page.json` | `{ id, title }`. |
| `src/dashboard/modals/add-fee/modal.tsx` | "Add / Edit fee" modal — uses `dashboard.openModal()` from the page. |
| `src/dashboard/modals/add-fee/modal.json` | Modal id + title. |
| `src/dashboard/_shared/rate-popup.ts` | See `examples/_shared/rate-popup.ts`. |

## Site Plugin (custom element)

| File | What it does |
|------|--------------|
| `src/site/plugins/custom-elements/custom-fee-indicator/plugin.tsx` (235 lines) | "Custom fee will be added at checkout" indicator on product page. Calls `/api/product-fee?productId=…` to look up the applicable fee. |
| `src/site/plugins/custom-elements/custom-fee-indicator/plugin.json` | Plugin slot config. |
| `src/site/plugins/custom-elements/custom-fee-indicator/panel.tsx` | Editor panel for indicator styling. |

## Service Plugin

| File | What it does |
|------|--------------|
| `src/backend/service-plugins/ecom-additional-fees/additional-fee/plugin.ts` (55 lines) | The `additionalFees.calculateAdditionalFees` SPI handler. See `service-plugin.ts`. |
| `src/backend/service-plugins/ecom-additional-fees/additional-fee/plugin.json` | `$schema: ecom-additional-fees.json`, `id`, `name`. See `service-plugin.plugin.json`. |

## Backend (web methods + API + events)

| File | What it does |
|------|--------------|
| `src/backend/api/custom-additional-fees/api.ts` | REST CRUD for fees. See `api-fees-crud.ts`. |
| `src/backend/api/product-fee/api.ts` | Per-product fee lookup for site plugin. See `api-product-fee.ts`. |
| `src/backend/_shared/fees-store.ts` | Wix Data wrapper with `auth.elevate` + WDE0025 grace. See `fees-store.ts`. |
| `src/types.ts` | `AdditionalFee` type. |
| `src/consts.ts` | Demo seed fees (referenced by the UI, not auto-inserted). |
| `src/backend/order-stats.web.ts` | Per-fee analytics. |
| `src/backend/check-premium-plan.web.ts` | See `examples/_shared/check-premium.web.ts`. |
| `src/backend/app-plans.web.ts` | See `examples/_shared/app-plans.web.ts`. |
| `src/backend/_shared/supabase-client.ts` | See `examples/_shared/supabase-client.ts`. |
| `src/backend/_shared/tracking.web.ts` | See `examples/_shared/tracking.web.ts`. |
| `src/backend/events/{app-installed,app-removed,plan-changed}/event.ts` | See `examples/_shared/events/`. |

## Internationalization

| File | What it does |
|------|--------------|
| `src/intl/messages/en.json` | See `intl-en.json`. |
| `src/intl/messages/{de,…,zh,da}.json` | 15 translations + en. |

## Data Collections

| Collection ID | Purpose |
|---------------|---------|
| `@s21797/custom-additional-fees/custom-additional-fees` | Stores fees. Auto-created on first insert. Read by both API and service plugin via `auth.elevate(items.query)`. |
