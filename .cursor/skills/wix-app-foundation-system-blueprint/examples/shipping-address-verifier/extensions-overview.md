# Shipping Address Verifier — Full Extension Map

Source: `~/Documents/Wix apps Backup/shipping-address-verifier/`

## Dashboard

| File | What it does |
|------|--------------|
| `src/dashboard/pages/page.tsx` (1533 lines) | 3 tabs: Configure / Plan & Settings / How to Use. UI for blocked/allowed country CSVs + regex + state-zip toggle. |
| `src/dashboard/pages/page.json` | Dashboard page id + title. |
| `src/dashboard/_shared/rate-popup.ts` | See `examples/_shared/rate-popup.ts`. |

## Service Plugin (eCom Validations)

| File | What it does |
|------|--------------|
| `src/backend/service-plugins/ecom-validations/my-service-plugin/plugin.ts` (205 lines) | The `validations.getValidationViolations` handler. See `service-plugin.ts`. |
| `src/backend/service-plugins/ecom-validations/my-service-plugin/plugin.json` | `$schema` + `validateInCart: true`. See `service-plugin.plugin.json`. |
| `src/backend/service-plugins/ecom-validations/my-service-plugin/settings.ts` | Wix Data wrapper with single-row pattern. See `settings.ts`. |
| `src/backend/service-plugins/ecom-validations/my-service-plugin/settings.web.ts` | Web methods that wrap the data layer. See `settings.web.ts`. |
| `src/backend/service-plugins/ecom-validations/my-service-plugin/us-zip-states.ts` | US ZIP code prefix → state mapping (large lookup table). |

## Backend (web methods + events)

| File | What it does |
|------|--------------|
| `src/backend/check-premium.web.ts` | See `examples/_shared/check-premium.web.ts`. |
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
| `@purple/shipping-address-verifier/ShippingAddressVerifierSettings` | Single-row settings (`_id: 'settings'`). |
