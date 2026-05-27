# Password Protected Site Page

**App ID:** `<APP_ID>` (original: `ce829d74-d8e7-4ea8-a42e-6d6dee21758d`)
**App Slug:** `pp`
**App Namespace:** `@s21797/stored-passwords` (and `@s21797/password-protected` for app-level data)
**Vertical:** Content / Site Tools
**Stack:** Legacy CLI (no Astro)
**Source path:** `~/Documents/Wix apps Backup/password-protected/`

## What it does

Lets a site owner protect any page (or the entire site) with a password — without a widget on the page. The protection is enforced via an **embedded script in the HEAD**, which renders a full-screen overlay that blocks rendering of the page until the visitor enters the right password. Password verification happens client-side via SHA-256 (no network round-trip), and the password hash + per-page config is pushed into the embedded script's parameters.

## Extensions registered

| Extension | Path | Purpose |
|-----------|------|---------|
| Dashboard Page | `src/dashboard/pages/page.tsx` (2543 lines) | 3 tabs: Manage protected pages / Plan & Settings / How to Use |
| Embedded Script | `src/site/embedded-scripts/page-lock/embedded.html` (635 lines) | The full lock-screen overlay — HTML + CSS + JS, with `{{placeholders}}` replaced by `embedScript()`. |
| Embedded Script Config | `src/site/embedded-scripts/page-lock/embedded.json` | Registers as `scriptType: ESSENTIAL`, `placement: HEAD`. |
| Embedded Script Dev Params | `src/site/embedded-scripts/page-lock/params.dev.json` | Dev-time defaults for the placeholders (used in `wix dev`). |
| Web Method | `src/backend/embed-script.web.ts` | `pushEmbeddedScript(params)` — calls `embeddedScripts.embedScript()` to update the lock config on the live site. |
| Web Method | `src/backend/app-instance.web.ts` | `getAppInstance()` + `verifyLockPassword(req)` (legacy entry — site widgets prefer the HTTP API). |
| HTTP API Route | `src/backend/api/verify-lock-password/api.ts` | `POST /api/verify-lock-password` — site widgets MUST call this via `httpClient.fetchWithAuth()` so the request includes the Wix token. |
| Backend Events | `src/backend/events/{app-installed,app-removed,plan-changed}/event.ts` | Supabase sync — see `examples/_shared/events/`. |
| Data Collection | `@s21797/stored-passwords/lock-passwords` | Plain-text passwords keyed by lock key (used by HTTP API for stronger verification). |

## Key patterns to copy

1. **Embedded Script with HEAD placement** — `embedded.json` declares `scriptType: "ESSENTIAL"` and `placement: "HEAD"`. The HTML is injected into every page's `<head>`.
2. **Three `{{placeholder}}` parameters** — `protectedPages`, `siteWideLock`, `enabled` are templated into the HTML as `data-*` attributes on a hidden `<div id="pp-lock-config">`. Values are **base64-encoded JSON** (so the embed-script param API stays string-typed).
3. **Pushing config from the dashboard** — Dashboard calls `pushEmbeddedScript({ protectedPages, siteWideLock, enabled })` which calls the elevated `embeddedScripts.embedScript()`. Each call replaces the entire parameter blob.
4. **Client-side SHA-256 verification** — The lock script reads the entered password, hashes it with `crypto.subtle.digest("SHA-256")`, and compares to the stored hash. **No network round-trip.** This makes the lock instant but trades a weaker security model (the hash is in plain HTML).
5. **HTTP API alternative for stronger lookups** — When the password is too sensitive to ship in HTML, the HTTP API at `src/backend/api/verify-lock-password/api.ts` is called. Site widgets MUST use `httpClient.fetchWithAuth()` (NOT direct `webMethod` calls — those don't carry the Wix access token in production).
6. **Path matching for per-page locks** — `pathMatches(stored, current)` strips Wix-site prefixes (`/mysite-name/about` → `/about`) and supports trailing wildcards (`/blog` matches `/blog/post-1`). Critical for path-based locks.
7. **localStorage "remember visitor"** — Per-page key `@<NS>:remember:<path>` stores either a TTL timestamp or `0` (forever). Site-wide lock uses `__site_wide__` as the key.
8. **`scriptType: ESSENTIAL`** — Critical: anything other than `ESSENTIAL` lets Wix's cookie banner gate the script, defeating the lock. ESSENTIAL bypasses consent.

## localStorage keys (in the dashboard)

```ts
const REVIEW_SHOWN_KEY    = 'pp_review_shown_v1';
const CELEBRATION_KEY     = 'pp_celebration_v1';
const ONBOARDING_KEY      = 'pp_onboarding_done';
```

## localStorage keys (on the storefront, written by the embedded script)

```ts
const STORAGE_PREFIX = '@<NS>:remember';      // value: timestamp (epoch ms) or 0 = forever
// example key:    @<NS>:remember:/about      → '1735689600000'
//                 @<NS>:remember:__site_wide__ → '0'
```

## Files in this folder

- `extensions-overview.md` — full file map
- `embedded.html` — condensed lock-screen skeleton (~250 lines, distilled from 635-line original)
- `embedded.json` — embedded script registration
- `params.dev.json` — dev-time placeholder defaults
- `embed-script.web.ts` — `pushEmbeddedScript()` web method (verbatim, scrubbed)
- `api-verify-lock-password.ts` — HTTP API route (verbatim)
- `app-instance.web.ts` — `getAppInstance()` + `verifyLockPasswordLogic()` shared logic
- `intl-en.json` — full English translation key set

## When to use as reference

- Any app whose extension is an **Embedded Script** rather than a widget (analytics, gates, head-tag injectors)
- Apps that need to push site-wide config from the dashboard via `embeddedScripts.embedScript()`
- Apps that need to expose an HTTP API consumed from the storefront via `httpClient.fetchWithAuth()`
- Apps with a Data Collection where the dashboard owns the data and the script reads it via API
