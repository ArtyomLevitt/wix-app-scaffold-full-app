# PayPal Pay Button — Full Extension Map

Source: `~/paypal-payment-button/`

This is an **Astro** app (modern PRPL stack) — register every extension once via `app().use(...)` in `src/extensions.ts`, with `<name>.extension.ts` + `<name>.ts` (or `.tsx`) per extension.

## Top level

| File | What it does |
|------|--------------|
| `src/extensions.ts` (16 lines) | Single registration file — `app().use(...)` chain for every extension. See `extensions.ts`. |
| `astro.config.mjs` (24 lines) | **`security: { checkOrigin: false }` is mandatory** for events; CORS configured for `/api/*`. |
| `src/middleware.ts` | Astro middleware (auth wrapping). |
| `src/env.d.ts` | Astro types. |

## Extensions

### Site widget (Custom Element)

| File | What it does |
|------|--------------|
| `src/extensions/site/widgets/custom-elements/paypal-pay-button/paypal-pay-button.extension.ts` | `extensions.customElement({...})` registration. `installation.autoAdd: true` so the widget appears on the site automatically. See `paypal-pay-button.extension.ts`. |
| `src/extensions/site/widgets/custom-elements/paypal-pay-button/widget.tsx` (~820 lines) | The site widget. Loads PayPal SDK, renders Smart Buttons, handles `createOrder` / `onApprove` / `onError`. Detects editor environment and renders a static placeholder there. See `widget.tsx`. |
| `src/extensions/site/widgets/custom-elements/paypal-pay-button/panel.tsx` (~540 lines) | Editor settings panel — mode toggle (fixed/donation), currency dropdown, color pickers, premium-gated note field. Calls `widget.setProp(...)` per change. See distilled `panel-skeleton.tsx`. |
| `…/components/paypal-sdk-loader.ts` | Third-party SDK loader: injects `<script>` into `document.head`, deduplicates by URL, unlocks `window.fetch` for hardened iframes. See `paypal-sdk-loader.ts`. |
| `…/components/PaymentBrands.tsx` | SVG icons for Visa / Mastercard / Amex / Discover + the PayPal wordmark. Pure presentation — no Wix-specific bits. |
| `…/components/ColorPickerField.tsx` | Wraps `@wix/design-system` ColorPicker with a hex preview swatch. |

### Dashboard

| File | What it does |
|------|--------------|
| `src/extensions/dashboard/pages/my-page/my-page.extension.ts` | `extensions.dashboardPage({...})`. |
| `src/extensions/dashboard/pages/my-page/my-page.tsx` (~1.5K lines) | 3-tab dashboard (Manage / Plan & Settings / How to Use). Manage tab is the **PayPal connection card** — paste client ID → server probes → stores result + auto-detected `sandboxMode`. |
| `…/components/StatCard.tsx`, `PlansCard.tsx`, `MoreAppsCard.tsx`, `PaymentBrands.tsx`, `AccessTokenSteps.tsx` | Sub-components for the Manage tab. |
| `src/extensions/dashboard/_shared/rate-popup.ts` | See `examples/_shared/rate-popup.ts`. |

### Data

| File | What it does |
|------|--------------|
| `src/extensions/data/extensions.ts` | `extensions.genericExtension({ compType: 'DATA_COMPONENT', ... })`. **One** collection (`paypal-pay-button-data`) with fields `key`, `clientId`, `sandboxMode`, `v` — discriminated by `key` so a single collection holds both credentials and the usage counter. `PRIVILEGED` for all CRUD. See `data.extension.ts`. |

### `_shared/` (app-internal helpers)

| File | What it does |
|------|--------------|
| `src/extensions/_shared/collections.ts` | `APP_NAMESPACE`, `COLLECTION_DATA`, `CREDENTIALS_DOC_KEY`, `SYSTEM_DOC_KEY` constants. |
| `src/extensions/_shared/credentials.ts` | Get / save / probe PayPal client ID. PRIVILEGED Wix Data CRUD with `auth.elevate(...)`. See `credentials.ts`. |
| `src/extensions/_shared/paypal-token-probe.ts` | **The centerpiece.** Combines 4 probes (live SDK + sandbox SDK + live OAuth + sandbox OAuth) to detect environment from a single client ID. See `paypal-token-probe.ts`. |
| `src/extensions/_shared/paypal-impl.ts` | Composes a SDK URL (`https://www.paypal.com/sdk/js?client-id=…`) from stored credentials + currency. Used by `paypal/client-config.ts`. |
| `src/extensions/_shared/usage.ts` | Per-month usage counter packed as `<base64-count>~~<base64-month>~~`. Resets implicitly when month changes. |
| `src/extensions/_shared/supabase-client.ts` | See `examples/_shared/supabase-client.ts` (gitignored, scrub before commit). |

### Backend events

| File | What it does |
|------|--------------|
| `src/extensions/backend/events/app-installed/app-installed.{ts,extension.ts}` | See `examples/_shared/events/app-installed.ts`. |
| `src/extensions/backend/events/app-removed/app-removed.{ts,extension.ts}` | See `examples/_shared/events/app-removed.ts`. |
| `src/extensions/backend/events/plan-changed/plan-changed.{ts,extension.ts}` | Co-located `paidPlanPurchased` + `paidPlanChanged`. See `examples/_shared/events/plan-changed.ts`. |

## API routes

Live at `src/pages/api/<group>/<name>.ts`. Each exports `OPTIONS` + `GET`/`POST` as needed.

| Route | What it does |
|-------|--------------|
| `src/pages/api/paypal/client-config.ts` | **Called from the site widget.** Returns `{ ok, clientId, sandboxMode, sdkUrl }`. Aborts with `aborted: true` if free-tier monthly cap is hit. |
| `src/pages/api/paypal/test-connection.ts` | Manual "Test connection" button on the dashboard — runs the token probe and returns the kind. |
| `src/pages/api/secret/save.ts` | Validates client ID format → token-probes → persists with the auto-detected `sandboxMode`. See `secret-save.ts`. |
| `src/pages/api/secret/check.ts` | Returns `{ connected, sandboxMode, clientIdPreview, tokenKind }` for the dashboard "PayPal connected" card. Optional `?probe=1` re-probes and **auto-corrects the stored `sandboxMode`** if PayPal flipped environments. |
| `src/pages/api/usage/count.ts` | Current month's payment count (free tier: 6). |
| `src/pages/api/usage/increment.ts` | Called by the widget after a successful PayPal `capture()`. |
| `src/pages/api/app/check-premium.ts` | Standard PRPL premium check. See `examples/_shared/check-premium.web.ts` (this app's version is the API-route equivalent). |
| `src/pages/api/app/plans.ts` | Standard PRPL pricing-plans endpoint. See `examples/_shared/app-plans.web.ts`. |
| `src/pages/api/app/track-setup-completed.ts` | Standard PRPL setup-completion tracker. See `examples/_shared/tracking.web.ts`. |

## Why no web methods?

This app uses API routes for **everything** — both site-widget calls (which require HTTP endpoints because direct web-method calls don't carry the Wix token off-host) AND dashboard calls. It's a deliberate simplification vs. `advanced-product-file-uploader` which keeps both API routes and web methods. For new apps, the API-route-only approach is cleaner unless a dashboard component genuinely benefits from RPC ergonomics.

## What's NOT bundled into `examples/paypal-payment-button/`

- `my-page.tsx` (1.5K lines) — most of it is the standard 3-tab dashboard with Manage/Plan & Settings/How to Use, the rate popup, more-apps cards, plans card, etc. **All those patterns already live in `examples/_shared/` and the other deep-dives.** What's distinctive here is the connection card (paste client ID → probe → confirm), and that pattern is fully demonstrated by `secret-save.ts` + `credentials.ts` + `paypal-token-probe.ts`.
- `panel.tsx` full source — distilled into `panel-skeleton.tsx` (~200 lines) showing mode toggle + premium gating + `widget.setProp` calls.
- `app-installed.ts`, `app-removed.ts`, `plan-changed.ts` — identical to `examples/_shared/events/`.
- `check-premium.ts`, `plans.ts`, `track-setup-completed.ts` — same shape as `_shared/check-premium.web.ts`, `_shared/app-plans.web.ts`, `_shared/tracking.web.ts`.
- All `assets/*.png|svg` and full `intl/messages/*.json` — replace with your app's own brand assets / translations.

## Internationalization

This app is **not** internationalized at the time of bundling — strings are hardcoded English. When productionizing, wire every user-facing string through `react-intl` and add `src/intl/messages/*.json` files (see `advanced-product-file-uploader/intl-en.json` for the canonical shape).
