# Shipping Address Verifier

**App ID:** `<APP_ID>`
**App Slug:** `sav`
**App Namespace:** `@purple/shipping-address-verifier`
**Vertical:** Stores / Checkout
**Stack:** Legacy CLI (no Astro)
**Source path:** `~/Documents/Wix apps Backup/shipping-address-verifier/`

## What it does

Lets a merchant block / allow shipping addresses at checkout based on country, postal-code regex, and US state-vs-ZIP consistency. Implements the **`validations.getValidationViolations`** SPI handler. Behaviour differs by source: **`CART` → WARNING** (informational), **`CHECKOUT` → ERROR** (blocks the "Place Order & Pay" button).

## Extensions registered

| Extension | Path | Purpose |
|-----------|------|---------|
| Dashboard Page | `src/dashboard/pages/page.tsx` (1533 lines) | 3 tabs: Configure / Plan & Settings / How to Use |
| Service Plugin | `src/backend/service-plugins/ecom-validations/my-service-plugin/plugin.ts` (205 lines) | The `validations.getValidationViolations` handler |
| Service Plugin Config | `plugin.json` | `$schema: ecom-validations.json`, plus `validateInCart: true` so we get cart-time calls |
| Service Plugin Settings (web methods) | `settings.web.ts` (72 lines) | `getSettings()` + `saveSettings()` + `getDiagnostics()` |
| Service Plugin Settings (data layer) | `settings.ts` (151 lines) | Wix Data wrapper for the settings object (single row keyed `_id: 'settings'`) |
| Backend Web Methods | `check-premium.web.ts`, `app-plans.web.ts` | See `examples/_shared/`. |
| Backend Events | `app-installed`, `app-removed`, `plan-changed` | See `examples/_shared/events/`. |
| Data Collection | `@purple/shipping-address-verifier/ShippingAddressVerifierSettings` | Single-row settings object |

## Key patterns to copy

1. **Service Plugin handler shape (validations)** — `validations.provideHandlers({ getValidationViolations: async (payload) => { return { violations } } })`. Returns an array of `{ severity, target, description }`. Severity is **`'ERROR'` (blocks order) or `'WARNING'` (informational only)**.
2. **`validateInCart: true` in plugin.json** — Without this, the handler is only called at checkout. With it, you get cart-time calls too — letting you show informational warnings before the customer is committed.
3. **Defensive payload extraction** — Wix's runtime shape varies: sometimes the SDK wrapper is `{ request: { validationInfo, sourceInfo } }`, sometimes the validation info is at the top level. Five `extract*` helpers tolerate every known shape. Copy this pattern verbatim — without it, plugins silently break across runtime versions.
4. **Cart vs checkout severity** — `source === 'CHECKOUT' ? 'ERROR' : 'WARNING'`. Same business rule, different UX. ERROR in cart is too aggressive; WARNING in checkout is too soft. The pattern is severity = function(source).
5. **Single-row settings collection** — `_id: 'settings'` (a fixed string, not a UUID). `items.save({ _id: 'settings', ...settings })` upserts. Avoid managing a list when the app has exactly one settings object.
6. **`Permissions` workaround** — `const DASHBOARD_PERMISSION: any = "Anyone";` — avoids the `Permissions.Anyone` import that crashes silently on older `@wix/web-methods`. The `as any` cast keeps TypeScript happy.
7. **Diagnostics web method** — `getDiagnostics()` returns `{ status: 'ok' | 'missing-collection' | 'error', errorMessage, collectionId, settingsId }` so the dashboard can show "Collection not yet provisioned, click here to retry" instead of a cryptic error.
8. **MISSING_COLLECTION_HINT constant** — Long, actionable error message embedded in the data layer. When the collection doesn't exist (which happens if Data Collections extension wasn't created), the error message tells the dev exactly which extension to add and which fields to declare.
9. **CSV normalization** — `parseCsv("us, gb, FR")` → `["US", "GB", "FR"]`. Trim, uppercase, filter-empty. Handles user-typed input forgivingly.
10. **`Intl.DisplayNames` for human-readable error** — "We cannot ship to Iraq" instead of "We cannot ship to IQ". Use `new Intl.DisplayNames(['en'], { type: 'region' })` for ISO country code → name conversion. Falls back to the code if `Intl.DisplayNames` isn't available (some older runtimes).

## localStorage keys

```ts
const REVIEW_SHOWN_KEY = 'sav_review_shown_v1';
const ONBOARDING_KEY   = 'sav_onboarding_done';
```

## Constants

```ts
const COLLECTION_ID = '@<APP_NS>/shipping-address-verifier/ShippingAddressVerifierSettings';
const SETTINGS_ID   = 'settings';
```

## Files in this folder

- `extensions-overview.md` — full file map
- `service-plugin.ts` — the `validations.getValidationViolations` handler (verbatim, scrubbed)
- `service-plugin.plugin.json` — service plugin config with `validateInCart: true`
- `settings.web.ts` — settings web methods (verbatim)
- `settings.ts` — settings Wix Data wrapper (verbatim, scrubbed)
- `intl-en.json` — full English translations

## When to use as reference

- Apps that hook into `ecom-validations` (cart / checkout validation, address checking, restriction rules)
- Apps with a single settings object (not a list of rows)
- Apps where one event is dispatched at both `cart` and `checkout` and behaviour must differ
- Apps that need defensive runtime shape handling for SDK envelope changes
