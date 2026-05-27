# Advanced Product File Uploader — Full Extension Map

Source: `~/Documents/Wix apps Backup/advanced-product-file-uploader/`

This is an **Astro** app — the layout is different from the legacy CLI apps.

## Top level

| File | What it does |
|------|--------------|
| `src/extensions.ts` (27 lines) | Single registration file — `app().use(...)` chain for all extensions. See `extensions.ts`. |
| `astro.config.mjs` (14 lines) | Astro config. **`security: { checkOrigin: false }` is mandatory** for events. See `astro.config.mjs`. |
| `src/env.d.ts` | Astro types. |
| `src/types/assets.d.ts` | PNG/SVG import declarations. |
| `src/consts.ts` | App-wide constants (APP_ID, etc.). |
| `src/types.ts` | Cross-cutting types (`PremiumResult`, `ProductConfig`, etc.). |

## Extensions

### Dashboard
| File | What it does |
|------|--------------|
| `src/extensions/dashboard/pages/my-page/my-page.tsx` | Main app page React component. |
| `src/extensions/dashboard/pages/my-page/my-page.extension.ts` | `extensions.dashboardPage({...})`. See `dashboard-page.extension.ts`. |
| `src/extensions/dashboard/modals/configure-product/configure-product.tsx` | Modal React component. |
| `src/extensions/dashboard/modals/configure-product/configure-product.extension.ts` | `extensions.dashboardModal({...})`. |
| `src/extensions/dashboard/modals/configure-product/configure-product.config.ts` | Modal config (window size, etc.). |
| `src/extensions/dashboard/plugins/order-files/order-files.tsx` | Dashboard plugin (slot in Wix Orders page). |
| `src/extensions/dashboard/plugins/order-files/order-files.extension.ts` | `extensions.dashboardPlugin({...})`. |

### Site
| File | What it does |
|------|--------------|
| `src/extensions/site/plugins/file-uploader/file-uploader.tsx` | Site plugin React component (file picker UI). |
| `src/extensions/site/plugins/file-uploader/file-uploader.panel.tsx` | Editor panel React component. |
| `src/extensions/site/plugins/file-uploader/file-uploader.extension.ts` | `extensions.sitePlugin({...})` with TWO placements (Stores v3 + classic). See `site-plugin.extension.ts`. |
| `src/extensions/site/plugins/checkout-file-label/checkout-file-label.tsx` | Site plugin slotted in checkout summary. |
| `src/extensions/site/plugins/checkout-file-label/checkout-file-label.panel.tsx` | Editor panel. |
| `src/extensions/site/plugins/checkout-file-label/checkout-file-label.extension.ts` | `extensions.sitePlugin({...})`. |
| `src/extensions/site/embedded-scripts/cart-file-label/cart-file-label.extension.ts` | `extensions.embeddedScript({...})` — for the cart (no slot, must inject). |

### Backend events
| File | What it does |
|------|--------------|
| `src/extensions/backend/events/app-installed/app-installed.ts` | Handler. See `app-installed.ts` (verbatim, scrubbed). |
| `src/extensions/backend/events/app-installed/app-installed.extension.ts` | `extensions.event({...})`. See `event.extension.ts`. |
| `src/extensions/backend/events/app-removed/app-removed.{ts,extension.ts}` | onAppInstanceRemoved. |
| `src/extensions/backend/events/plan-changed/plan-changed.{ts,extension.ts}` | onAppInstancePaidPlanChanged. |
| `src/extensions/backend/events/plan-purchased/plan-purchased.{ts,extension.ts}` | onAppInstancePaidPlanPurchased — **NOTE**: split into a separate file in this app, but the canonical pattern in `_shared/events/plan-changed.ts` puts both purchased + changed in ONE file. Either approach works. |
| `src/extensions/backend/events/order-created/order-created.{ts,extension.ts}` | App-specific: handles `orders.onOrderCreated`. |

### Data
| File | What it does |
|------|--------------|
| `src/extensions/data/data.extension.ts` (169 lines) | `extensions.genericExtension({ compType: 'DATA_COMPONENT', compData: { dataComponent: { collections: [...] } } })`. Declares 2 collections (`product-file-configs`, `uploaded-files`) with full schemas. See `data.extension.ts`. |

## API routes

Live at `src/pages/api/<name>.ts`. Each exports `GET`, `POST`, `PUT`, `DELETE` as needed.

| Route | What it does |
|-------|--------------|
| `src/pages/api/check-plan.ts` (56 lines) | Premium check — replaces `check-premium.web.ts` for site-widget callers. See `api-check-plan.ts`. |
| `src/pages/api/products.ts` | Wix Stores list/get wrapper. |
| `src/pages/api/product-configs.ts` | Configs CRUD. |
| `src/pages/api/widget-config.ts` | Single-product config (called by site widget). |
| `src/pages/api/upload.ts` | Multipart file upload handler. Uses `auth.elevate(uploads.generateFileUploadUrl)`. |
| `src/pages/api/uploaded-files.ts` | Lists uploaded files for an order. |

## Backend (web methods — alongside API routes)

| File | What it does |
|------|--------------|
| `src/backend/_shared/supabase-client.ts` | See `examples/_shared/supabase-client.ts`. |
| `src/backend/_shared/tracking.web.ts` | See `examples/_shared/tracking.web.ts`. |
| `src/backend/check-premium.web.ts` | Web method version of premium check (used from dashboard React components). |
| `src/backend/app-plans.web.ts` | See `examples/_shared/app-plans.web.ts`. |
| `src/backend/media-upload.web.ts` | Web method for dashboard-initiated uploads (e.g. configure-product modal). |

## Why both API routes AND web methods?

- **API routes** are HTTP endpoints. Site widgets MUST use them (with `httpClient.fetchWithAuth()`) because direct web method calls don't carry the Wix token in production.
- **Web methods** are RPC-style. Convenient from dashboard React (no fetch boilerplate), and they auto-elevate when called inside a Wix-authenticated dashboard context.

The split is explicit: the dashboard uses web methods; the site uses API routes. There are duplicates (`check-plan.ts` API ≈ `check-premium.web.ts`) — that's intentional, different audiences.

## Internationalization

| File | What it does |
|------|--------------|
| `src/intl/messages/en.json` | See `intl-en.json`. |
| `src/intl/messages/{de,…,zh,da}.json` | 15 translations + en. |
