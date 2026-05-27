# Advanced Product File Uploader

**App ID:** `<APP_ID>`
**App Slug:** `apfu`
**App Namespace:** (Astro app — uses Wix's data-extension `idSuffix` not a custom NS)
**Vertical:** Stores
**Stack:** **Astro** (`@wix/astro` + Cloudflare adapter)
**Source path:** `~/Documents/Wix apps Backup/advanced-product-file-uploader/`

## What it does

Lets shoppers upload files (images, PDFs, design files) on the product page before adding to cart. The file URL is attached to the line-item, surfaced in the cart, the checkout, and the merchant's "Order Files" dashboard plugin in the Orders page. Per-product configuration (max files, allowed types, max size, instructions) lives in a custom data collection.

## Extensions registered

This app's `src/extensions.ts` is the canonical Astro `app().use(...)` orchestrator — register every extension once, in one file, in dependency order. Eleven extensions:

| Extension | Type | Purpose |
|-----------|------|---------|
| `myPage` | dashboard page | Main app page — list products + configure per-product |
| `configureProductModal` | dashboard modal | "Configure file upload for product" form |
| `orderFilesPlugin` | dashboard plugin | Slot in the Orders page that shows the files for each line item |
| `dataExtension` | DATA_COMPONENT | Declares 2 data collections (configs + uploaded files) |
| `appInstalled` / `appRemoved` / `planChanged` / `planPurchased` / `orderCreated` | events | Backend event handlers |
| `fileUploaderPlugin` | site plugin | The actual upload widget (slotted into product-page-details-2) |
| `checkoutFileLabel` | site plugin | Shows the uploaded file in the checkout summary |
| `cartFileLabelScript` | site embedded script | Same idea but injected into the cart (which doesn't expose slots) |

## Astro layout (different from legacy CLI)

```
src/
├── extensions.ts                    ← Registers all extensions via app().use(...) chain
├── astro.config.mjs                 ← MUST have security.checkOrigin: false for events
├── env.d.ts                         ← Astro types
├── consts.ts                        ← APP_ID, etc
├── types.ts                         ← Cross-cutting types
│
├── extensions/                      ← All extensions live here in the Astro layout
│   ├── data/data.extension.ts       ← Data collections defined as TS, not JSON
│   ├── backend/events/
│   │   └── <name>/
│   │       ├── <name>.ts            ← The handler
│   │       └── <name>.extension.ts  ← Registration via extensions.event(...)
│   ├── dashboard/
│   │   ├── pages/<name>/<name>.tsx + .extension.ts
│   │   ├── modals/<name>/<name>.tsx + .extension.ts + .config.ts
│   │   └── plugins/<name>/<name>.tsx + .extension.ts
│   └── site/
│       ├── plugins/<name>/<name>.tsx + .panel.tsx + .extension.ts
│       └── embedded-scripts/<name>/<name>.extension.ts
│
├── pages/api/                       ← Astro API routes (HTTP endpoints)
│   ├── check-plan.ts                ← Premium check (replaces check-premium.web.ts)
│   ├── products.ts                  ← Wix Stores wrapper
│   ├── product-configs.ts           ← Configs CRUD
│   ├── widget-config.ts             ← Single-product config for widget
│   ├── upload.ts                    ← File upload handler (multipart)
│   └── uploaded-files.ts            ← List uploaded files
│
├── backend/                         ← Web methods (legacy-style, used from dashboard)
│   ├── _shared/{supabase-client,tracking}.ts
│   ├── check-premium.web.ts         ← Available alongside the API route
│   ├── app-plans.web.ts
│   └── media-upload.web.ts
│
├── dashboard/_shared/rate-popup.ts
└── intl/{withIntlProvider.tsx, load-messages.ts, messages/*.json}
```

## Key patterns to copy

1. **Single `extensions.ts` registration file** — Every extension declares itself separately in a `<name>.extension.ts` file via `extensions.<type>({...})` from `@wix/astro/builders`. Then `src/extensions.ts` chains `app().use(...)` for each. The order doesn't matter functionally, but keep it grouped (dashboard first, data second, events third, site last).
2. **`<name>.extension.ts` + `<name>.ts` split** — The `.extension.ts` file is the metadata wrapper (id, source, slot ids); the bare file is the actual handler/component. Without this split, Astro can't compile per-extension bundles.
3. **`security: { checkOrigin: false }` is mandatory** — Wix events come from external origins. Astro's CSRF protection blocks them by default; you must turn it off explicitly. **This is the #1 reason events appear to "not fire" on Astro apps.**
4. **API routes vs web methods** — Astro apps have BOTH:
    - **API routes** at `src/pages/api/*.ts` — HTTP endpoints. Use for anything called from a site widget (`fetchWithAuth()`), or from React useEffects.
    - **Web methods** at `src/backend/*.web.ts` — RPC-style. Use only for dashboard-internal calls. Don't call from site widgets in production.
5. **Data extension as TS** — `extensions.genericExtension({ compType: 'DATA_COMPONENT', compData: { dataComponent: { collections: [...] } } })`. Each collection has `idSuffix`, `displayField`, `fields[]` (with `key, displayName, type, description, unique`), and `dataPermissions` (`itemRead`, `itemInsert`, `itemUpdate`, `itemRemove`). This is the canonical way to declare collections in Astro apps — replaces wix.config.json data-collection blocks.
6. **Two-collection split** — Per-product configs live in one collection, uploaded files in another. Configs are dashboard-managed (`itemRead: ANYONE`, `itemInsert: CMS_EDITOR`); uploaded files are visitor-written (`itemInsert: ANYONE`). Keep audiences separate.
7. **`auth.elevate` in API routes** — Same pattern as web methods. `const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);` then call it.
8. **API route returns plain `Response`** — Use `new Response(JSON.stringify(...), { status: 200, headers: { 'Content-Type': 'application/json' } })` or `Response.json(...)`. NOT a `NextResponse` (this isn't Next.js).
9. **Per-plan limits in the API response** — `check-plan.ts` returns `{ isPremium, planStatus, planName, maxProducts }` — the limit is computed server-side from `planLimits[packageName.toLowerCase()]`. Frontend just reads the limit, no separate "what's my limit" call.
10. **`tagName` on site plugins** — `extensions.sitePlugin({ tagName: 'file-uploader-plugin', ... })`. The tagName must be globally unique across all your apps because Wix mounts the custom element by tag.
11. **TWO `placements` for cross-vendor compatibility** — `appDefinitionId: 'a0c68605-...'` (Wix Stores Catalog v3) AND `'1380b703-...'` (Wix Stores classic). Different stores apps have different IDs but use the same slot. List both to support all installations.

## localStorage keys

```ts
const REVIEW_SHOWN_KEY = 'apfu_review_shown_v1';
const ONBOARDING_KEY   = 'apfu_onboarding_done';
```

## Files in this folder

- `extensions-overview.md` — full file map
- `extensions.ts` — top-level extension registration (verbatim)
- `astro.config.mjs` — verbatim, with the critical CSRF setting
- `dashboard-page.extension.ts` — example of a dashboard page registration
- `site-plugin.extension.ts` — example of a site plugin registration with two placements
- `event.extension.ts` — example of an event extension registration
- `app-installed.ts` — the event handler (imports the canonical Supabase + site-properties pattern; see `examples/_shared/events/app-installed.ts`)
- `data.extension.ts` — Data Collections declared as TypeScript (verbatim, scrubbed)
- `api-check-plan.ts` — `/api/check-plan` route returning premium + per-plan limit (verbatim)
- `intl-en.json` — full English translations

## When to use as reference

- Every NEW Wix CLI app (Astro is the modern stack — strongly preferred over the legacy CLI structure)
- Apps with many extensions (5+) that benefit from the `app().use(...)` registration pattern
- Apps that need both API routes (for site-widget callers) and web methods (for dashboard callers)
- Apps that declare their data collections via the Astro `genericExtension({ compType: 'DATA_COMPONENT' })` pattern
- Apps deployed to Cloudflare Workers (the canonical PRPL adapter)
