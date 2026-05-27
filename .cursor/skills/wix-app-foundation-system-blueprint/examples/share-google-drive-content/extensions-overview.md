# Share Google Drive Content — Full Extension Map

Source: `~/Documents/Wix apps Backup/share-google-drive-content/`

## Dashboard

| File | What it does |
|------|--------------|
| `src/dashboard/pages/page.tsx` (1187 lines) | 3 tabs. Manage tab is mostly a "Test a link" preview using the same `parseDriveUrl` + `buildEmbedUrl` as the widget. |
| `src/dashboard/pages/page.json` | `{ id, title }`. The id here is what the widget links to via `behaviors.dashboard.dashboardPageComponentId`. |
| `src/dashboard/_shared/rate-popup.ts` | See `examples/_shared/rate-popup.ts`. |

## Custom Element Widget

| File | What it does |
|------|--------------|
| `src/site/widgets/custom-elements/google-drive-viewer/element.tsx` (233 lines) | The widget. See `element.tsx` here (verbatim). |
| `src/site/widgets/custom-elements/google-drive-viewer/element.json` | Default size, presets, dashboard link. See `element.json`. |
| `src/site/widgets/custom-elements/google-drive-viewer/element.module.css` | CSS modules for the widget (NOT WDS — site widgets cannot use WDS). |
| `src/site/widgets/custom-elements/google-drive-viewer/panel.tsx` (475 lines) | Editor settings panel. See `panel-skeleton.tsx` (distilled). |
| `src/site/widgets/custom-elements/google-drive-viewer/watermark-logo.png` | Watermark image — bundled and imported via Astro `?url` syntax. |

## Backend

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
| `src/intl/messages/en.json` (~150 keys) | See `intl-en.json`. |
| `src/intl/messages/{de,es,fr,it,ja,ko,nl,pl,pt,ru,th,tr,uk,zh,da}.json` | 15 translations + en. |
| `src/intl/withIntlProvider.tsx` | Dashboard HOC + exports `loadMessages` and `getLocaleSafe` for the widget. |
