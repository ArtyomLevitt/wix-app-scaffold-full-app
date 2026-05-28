# `examples/_shared/` — Canonical PRPL Files

These are the **single source of truth** for cross-cutting code that every PRPL app ships. They're extracted verbatim from production apps (FBT, password-protected, share-google-drive-content, custom-additional-fees, shipping-address-verifier, advanced-product-file-uploader) with secrets scrubbed.

When scaffolding a new app, copy-adapt from here first. Per-app folders only override what's app-specific.

## Files

| File | Where it goes in a new app | Notes |
|------|-----------------------------|-------|
| `rate-popup.ts` | `src/dashboard/_shared/rate-popup.ts` | Shadow-DOM review modal. Replace `<APP_ID>` in `DEFAULT_REVIEW_URL`. |
| `supabase-client.ts` | `src/backend/_shared/supabase-client.ts` (legacy) — or `src/extensions/_shared/` + `src/extensions/backend/_shared/` (Astro) | **Commit this file** (env-based, no secrets). Real `SUPABASE_URL` + `SUPABASE_SERVICE_KEY` live in `.env.local`, which IS gitignored. |
| `tracking.web.ts` | `src/backend/_shared/tracking.web.ts` | `trackSetupCompleted` web method, called once on first save. |
| `check-premium.web.ts` | `src/backend/check-premium.web.ts` | Returns `{ isPremium, planStatus, packageName, instanceId, metaSiteId }`. |
| `app-plans.web.ts` | `src/backend/app-plans.web.ts` | Reads `appPlans.listAppPlansByAppId`. Replace `<APP_ID>`. |
| `events/app-installed.ts` | `src/backend/events/app-installed/event.ts` | Upserts row into Supabase `app_installations` on install. |
| `events/app-removed.ts` | `src/backend/events/app-removed/event.ts` | Flips `is_active=false`, sets `removed_at`. |
| `events/plan-changed.ts` | `src/backend/events/plan-changed/event.ts` | Handles BOTH `paidPlanPurchased` + `paidPlanChanged` in one file. |
| `StatCard.tsx` | Astro: `src/extensions/dashboard/pages/<page>/components/StatCard.tsx`<br>Legacy: `src/dashboard/pages/_shared/StatCard.tsx` | Canonical stat-card with 52px icon circle, 12px borderRadius, highlight state for premium. See `references/DESIGN_SYSTEM.md` § 2. |
| `MoreAppsCard.tsx` | Astro: `src/extensions/dashboard/pages/<page>/components/MoreAppsCard.tsx`<br>Legacy: `src/dashboard/pages/_shared/MoreAppsCard.tsx` | 4-card row + "POWERED BY" footer with purple logo. Pair with the `purple-logo.png` + 4 More-Apps icons from the skill's `assets/` folder. See `references/DESIGN_SYSTEM.md` § 3 and `references/MORE_APPS.md` for picker logic. |

## Per-extension event registration files

Each event extension also needs a sibling file (Astro projects only):
- `app-installed.extension.ts`
- `app-removed.extension.ts`
- `plan-changed.extension.ts`

For legacy CLI projects (non-Astro), the events live under `src/backend/events/<name>/event.ts` with no `.extension.ts` file — registration is implicit by folder structure.

## Scrubbed values

| Placeholder | Replace with |
|-------------|-------------|
| `<APP_ID>` | The UUID from Wix Dev Center (e.g. `17d75b11-b574-4b49-9708-4ffa8be777a6`) |
| `<SUPABASE_URL>` | `https://<your-project>.supabase.co` |
| `<SUPABASE_SERVICE_KEY>` | The service role key (NEVER ship to client) |

## `Permissions.Anyone` vs `"Anyone" as any`

The PRPL apps in production currently use `Permissions.Anyone` (imported from `@wix/web-methods`) for `check-premium` and `app-plans`. This works on `@wix/web-methods >= 1.0.6`.

For older versions (`<= 1.0.5`), `Permissions` is undefined → silent crash. If targeting older versions, switch to the string literal `"Anyone" as any` (see `tracking.web.ts` for the literal style).
