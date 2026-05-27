# PayPal Pay Button

**App ID:** `<APP_ID>` (original: `ec074ae4-7154-48a4-8603-150030686b7d`)
**App Slug:** `ppwb`
**App Namespace:** `@purple/paypal-pay-button`
**Vertical:** Payments / Site Tools
**Stack:** **Astro** (`@wix/astro` + Cloudflare adapter)
**Source path:** `~/paypal-payment-button/`

## What it does

Drops a PayPal Smart Buttons widget onto any Wix page. The merchant pastes their PayPal client ID into the dashboard once; the app auto-detects whether it's a sandbox or live key, stores it in a Wix Data collection, and the site widget loads the appropriate PayPal SDK at runtime. Two modes: **Single payment** (fixed price) and **Donation** (preset amount chips + free-form input). Free plan caps at 6 payments/month; per-month usage counter lives in the same Wix Data collection.

## Extensions registered

| Extension | Path | Purpose |
|-----------|------|---------|
| Custom Element Widget | `src/extensions/site/widgets/custom-elements/paypal-pay-button/widget.tsx` (~820 lines) | The site widget. Loads PayPal SDK, renders Smart Buttons, handles `createOrder` / `onApprove` lifecycle. |
| Editor Settings Panel | `src/extensions/site/widgets/custom-elements/paypal-pay-button/panel.tsx` (~540 lines) | Mode toggle (fixed/donation), currency, color pickers, premium-gated note field. Calls `widget.setProp(...)` per change. |
| Dashboard Page | `src/extensions/dashboard/pages/my-page/my-page.tsx` (~1.5K lines) | 3-tab dashboard. Manage tab is mostly the **PayPal connection card** (paste client ID → server probes → confirm sandbox vs live). |
| Data Extension | `src/extensions/data/extensions.ts` | **One** Wix Data collection (`paypal-pay-button-data`) holding both `paypal_credentials` and `usage_counter` rows discriminated by a `key` field. `PRIVILEGED` for all CRUD. |
| HTTP API Routes | `src/pages/api/{paypal,secret,usage}/...` | `paypal/client-config`, `secret/save`, `secret/check`, `usage/increment` — all called from widget or dashboard with `httpClient.fetchWithAuth`. |
| Backend Events | `src/extensions/backend/events/{app-installed,app-removed,plan-changed}/` | Standard PRPL events. See `examples/_shared/events/`. |

## Key patterns to copy

1. **Third-party SDK loaded at runtime** — `paypal-sdk-loader.ts` injects `<script src="https://www.paypal.com/sdk/js?...">` into `document.head`, deduplicates by URL via a `window.__paypalSdkPromises` cache, and resolves with `window.paypal`. **Don't pre-bundle external SDKs** — they require a runtime `client-id` in the URL and the merchant's client ID isn't known at build time.
2. **`window.fetch` lock workaround for hardened embeds** — PayPal's anti-fraud bundle (`frame_ant.js`) replaces `window.fetch`. Wix runtime sometimes marks `window.fetch` as non-writable, which crashes the SDK. `unlockWindowFetch()` redefines the property as `writable: true, configurable: true` before the script loads. **Look for this pattern in any third-party SDK that wraps `window.fetch`** (Stripe.js, Klarna, etc.).
3. **Server-side environment auto-detection (sandbox vs live)** — `paypal-token-probe.ts` is the centerpiece. From a single client ID, it fires 4 parallel probes (live SDK, sandbox SDK, live OAuth, sandbox OAuth) and combines the signals: SDK rejection text (`not recognized for production` vs `not recognized for sandbox`), OAuth `invalid_client` responses, and access-token issuance. Returns `{ kind: 'live' | 'sandbox' | 'invalid' | 'unknown' }`. **Reuse this technique whenever a provider has dual environments behind a single ID.**
4. **Single Wix Data collection with `key` discriminator** — Instead of separate collections for credentials and usage counter, ONE collection `@purple/paypal-pay-button/data` holds both, and rows are queried by `eq('key', 'paypal_credentials')` or `eq('key', 'usage_counter')`. **For apps with 2–3 tiny system docs, this is cheaper than declaring N collections and works identically with `auth.elevate(items.query)`.**
5. **`auth.elevate` on every Wix Data call** — Both `getCredentials()` and `getCurrentCount()` wrap `items.query` / `items.insert` / `items.update` in `auth.elevate(...)` even though the route is itself authenticated. **PRIVILEGED collections require elevation; visitor sessions never satisfy permissions on their own.**
6. **Editor environment detection → static placeholder** — `isEditorEnvironment()` checks `window.location.ancestorOrigins`, `document.referrer`, and `window.location.href` against `editor.wix.com`, `wixstudio.com`, `wix.com/_partials`. When detected, the widget renders a static "Pay with PayPal" gold pill instead of loading the live SDK — PayPal's iframes don't always survive editor sandboxing. **Critical for any third-party SDK that has trouble with nested iframes.**
7. **Dual-mode widget (fixed payment / donation)** — Single custom element supports both via a `mode` prop. The panel shows different sections per mode (`{!isDonationMode && <PriceField />}`, `{isDonationMode && <PresetsField />}`). Donation mode also unlocks preset chips parsed from a comma-separated string (`"5,10,25,50"`). **Don't ship two widgets for two near-identical UIs — one widget + a mode toggle is clearer for the merchant and easier to maintain.**
8. **Token probe runs on save AND on status check** — `secret/save.ts` probes before persisting; `secret/check.ts` accepts a `?probe=1` query that re-probes on demand and **auto-corrects the stored `sandboxMode` flag** if the merchant flipped their PayPal account between sandbox and live. Self-healing config beats requiring the merchant to know which environment they're on.
9. **Per-month usage counter encoded as `<base64-count>~~<base64-month>~~`** — Avoids race conditions on a single field by packing both the count and the month into one string. When `monthUtc()` changes, `unpack()` returns `{ count: 0 }`, so the counter "resets" without any cron job. **Cheap idiom for free-tier rate limits without a separate scheduler.**
10. **`installation.autoAdd: true` on a custom element** — Widget appears on the site automatically after install. Combined with `width: { allowStretch: true }` and `defaultHeight: 240`, the merchant gets a working button without dragging anything from the editor's add-panel. Same idea as `share-google-drive-content`'s `autoAddToSite: true`.

## localStorage keys

```ts
const REVIEW_SHOWN_KEY = 'ppwb_review_shown_v1';
const ONBOARDING_KEY   = 'ppwb_onboarding_done';
```

## Files in this folder

- `extensions-overview.md` — full file map
- `extensions.ts` — top-level Astro registration (`app().use(...)`)
- `paypal-pay-button.extension.ts` — custom-element registration with `autoAdd: true`
- `widget.tsx` — verbatim site widget (PayPal SDK lifecycle + editor detection + dual mode)
- `paypal-sdk-loader.ts` — third-party SDK loader with `window.fetch` unlock
- `paypal-token-probe.ts` — server-side sandbox/live detection (4-signal combiner)
- `credentials.ts` — secret storage helper (PRIVILEGED Wix Data collection)
- `secret-save.ts` — `/api/secret/save` route showing token probe → save flow
- `data.extension.ts` — single-collection-with-key schema (verbatim, scrubbed)
- `panel-skeleton.tsx` — distilled settings panel showing mode toggle + premium gating + `widget.setProp` (~200 lines from 540)

## When to use as reference

- Any app integrating a third-party SDK that's loaded at runtime via `<script>` injection (Stripe, Klarna, Plaid, Calendly, Mapbox, Square, etc.)
- Apps storing **provider credentials** the merchant pastes once (API keys, OAuth tokens, secrets)
- Apps that need to **auto-detect environment** (sandbox vs live, staging vs prod) from a single ID
- Apps with **per-month free-tier limits** (counter + plan check before render)
- Apps where the widget needs to behave **differently in the editor** vs the published site
- Apps with **dual-mode UI** driven by a single string prop
- Apps using a **single Wix Data collection** for multiple logical documents (`key` discriminator)
