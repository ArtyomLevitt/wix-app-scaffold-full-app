# Pricing Plans Compare – Wix App

Side-by-side pricing plan cards with native Wix Pricing Plans checkout — no payment wiring needed.

## Features

- **Pricing table widget** – Responsive plan cards with features, badges, highlights, and CTAs
- **Native Wix checkout** – Map each card to a Wix Pricing Plan via `@wix/site-pricing-plans`
- **Dashboard editor** – Manage tab with live preview, plan list, and per-plan configuration
- **Design controls** – Themes (Light/Dark/Minimal/Brand), fonts, card styles, and Premium Advanced Design
- **Freemium tiers** – Free: 3 plans + watermark; Premium: unlimited plans, badges, Advanced Design
- **Event tracking** – App install, removal, and plan changes tracked in Supabase `app_installations`

## Project Structure

```
src/
├── extensions.ts
├── extensions/
│   ├── data/extensions.ts          # pricingPlans + appSettings collections
│   ├── _shared/                    # Types, styles, shared components
│   ├── backend/events/             # app-installed, app-removed, plan-changed
│   ├── dashboard/pages/plan-pricing-table/
│   └── site/widgets/custom-elements/plan-pricing-table/
├── pages/api/                      # Astro API routes (premium, plans, CRUD)
├── intl/messages/en.json
└── middleware.ts                   # CORS for widget API calls
```

## Manual Setup

1. Replace placeholder `APP_ID` in `src/extensions/_shared/app-config.ts` and `wix.config.json` with your Dev Center app ID.
2. Set `SUPABASE_SERVICE_KEY` in `src/extensions/_shared/supabase-client.ts` (file is gitignored).
3. Run `npx wix env pull` for local development credentials.
4. Configure app permissions: Wix Data read/write, Pricing Plans read.
5. Create Free and Premium monetization plans in Dev Center.

## Development

```bash
npm install
npm run dev
npm run build
```

Support: apps-support@prpl.io
