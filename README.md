# Pricing Plans Compare – Wix App

Side-by-side pricing plan cards with native Wix Pricing Plans checkout and modern themes.

## Features

- **Pricing plan cards** – Display 3–4 vertical cards side-by-side on desktop, stacked on mobile
- **Native Wix checkout** – Map cards to Wix Pricing Plans for one-click checkout via redirect session
- **Flexible CTAs** – Wix checkout, custom URL, or contact form modal per card
- **Premium plan support** – Free plan allows 3 cards and basic themes; premium unlocks unlimited cards, badges, advanced design, and removes the watermark
- **Multi-language dashboard** – 1 language supported (en)
- **Event tracking** – Tracks app install, removal, and plan changes via Supabase

## Project Structure

```
src/
├── extensions/
│   ├── _shared/                    # App config, types, pricing store, shared UI
│   ├── backend/events/             # app-installed, app-removed, plan-changed
│   ├── dashboard/pages/plan-pricing-table/
│   ├── data/extensions.ts          # pricingPlans + appSettings collections
│   └── site/widgets/custom-elements/plan-pricing-table/
├── pages/api/                      # Astro API routes (premium, plans, settings, checkout)
├── intl/messages/en.json
├── dashboard/_shared/rate-popup.ts
└── middleware.ts                   # CORS for cross-origin widget API calls
```

## How It Works

1. **Dashboard** – Merchants add pricing cards, design settings, and map Wix Pricing Plans in the Manage tab with live preview
2. **Storage** – Plan rows live in `pricingPlans`; global design settings in `appSettings` (Wix Data, elevated writes via API routes)
3. **Site widget** – Custom element fetches gated settings from `/api/widget/settings` and renders responsive pricing cards
4. **Checkout** – Wix checkout CTAs call `/api/wix-pricing-plans/checkout` to create a redirect session to Wix Pricing Plans checkout

## Development

```bash
npm install
npm run dev
npm run typecheck
npm run build
```

Before building locally, pull Wix environment variables:

```bash
npx wix env pull
```

## Tech Stack

- **Wix CLI** (@wix/cli-app, @wix/astro) – App framework and build tooling
- **React 18** – Dashboard and widget UI (Astro build requirement)
- **Wix Design System** (@wix/design-system) – Dashboard components
- **react-intl** – Internationalization
- **Supabase** – Analytics and event tracking (`app_installations` only)
- **@wix/pricing-plans** / **@wix/redirects** – Merchant plan listing and checkout redirect

## Manual Setup

1. Register the app in Wix Dev Center and set `APP_ID` in `src/extensions/_shared/app-config.ts` and `wix.config.json`
2. Add Supabase service role key to `src/extensions/_shared/supabase-client.ts` (gitignored)
3. Configure App Market pricing tiers (Free / Premium)
4. Enable Wix Pricing Plans on merchant sites for checkout CTAs
