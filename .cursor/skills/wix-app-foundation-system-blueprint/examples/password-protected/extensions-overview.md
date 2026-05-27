# Password Protected — Full Extension Map

Source: `~/Documents/Wix apps Backup/password-protected/`

## Dashboard

| File | What it does |
|------|--------------|
| `src/dashboard/pages/page.tsx` (2543 lines) | 3 tabs: Manage protected pages / Plan & Settings / How to Use. Adds/edits per-page locks AND the site-wide lock. Calls `pushEmbeddedScript()` after every save. |
| `src/dashboard/pages/page.json` | `{ id, title }` — dashboard nav entry. |
| `src/dashboard/_shared/rate-popup.ts` | See `examples/_shared/rate-popup.ts`. |

## Embedded Script

| File | What it does |
|------|--------------|
| `src/site/embedded-scripts/page-lock/embedded.html` (635 lines) | The lock-screen overlay — HTML/CSS/JS injected into the HEAD of every page. See `embedded.html` (skeleton) here. |
| `src/site/embedded-scripts/page-lock/embedded.json` | Registers as `scriptType: ESSENTIAL`, `placement: HEAD`. See `embedded.json`. |
| `src/site/embedded-scripts/page-lock/params.dev.json` | Dev-time placeholder defaults for `wix dev`. See `params.dev.json`. |

## Backend

| File | What it does |
|------|--------------|
| `src/backend/embed-script.web.ts` | `pushEmbeddedScript(params)` + `getEmbeddedScriptStatus()`. See `embed-script.web.ts`. |
| `src/backend/app-instance.web.ts` | `getAppInstance()` + `verifyLockPasswordLogic()` shared logic + `verifyLockPassword()` web method. See `app-instance.web.ts`. |
| `src/backend/api/verify-lock-password/api.ts` | HTTP API for site-widget verification. See `api-verify-lock-password.ts`. |
| `src/backend/check-premuim.web.ts` (note typo) | See `examples/_shared/check-premium.web.ts`. |
| `src/backend/app-plans.web.ts` | See `examples/_shared/app-plans.web.ts`. |
| `src/backend/_shared/supabase-client.ts` | See `examples/_shared/supabase-client.ts`. |
| `src/backend/_shared/tracking.web.ts` | See `examples/_shared/tracking.web.ts`. |
| `src/backend/events/{app-installed,app-removed,plan-changed}/event.ts` | See `examples/_shared/events/`. |

## Internationalization

| File | What it does |
|------|--------------|
| `src/intl/messages/en.json` (~180 keys) | See `intl-en.json`. |
| `src/intl/messages/{de,es,fr,it,ja,ko,nl,pl,pt,ru,th,tr,uk,zh,da,he}.json` | 16 translations + en. (he = Hebrew, unique to this app vs FBT.) |

## Data Collections

| Collection ID | Purpose |
|---------------|---------|
| `@s21797/stored-passwords/lock-passwords` | Plain-text passwords keyed by lock key, used by HTTP API verification (when client-side hash isn't enough). |
| `@s21797/password-protected/protected-pages` | Per-page lock configs (path, hash, options). The dashboard mirrors this into `protectedPages` placeholder. |
| `@s21797/password-protected/site-wide-lock` | Single-row site-wide lock config. The dashboard mirrors this into `siteWideLock` placeholder. |
