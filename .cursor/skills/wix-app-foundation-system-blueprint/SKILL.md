---
name: wix-app-blueprint
description: "BLOCKING PREFLIGHT — invoke FIRST, before any other Wix skill, when the user asks to create / build / scaffold / start / generate ANY Wix CLI (Astro) app. This is the PRPL house style blueprint: enforces 3-tab dashboard (Manage / Plan & Settings / How to Use), onboarding slideshow with localStorage gating, review popup on first save with localStorage gating, premium check, dynamic pricing plans, Supabase backend events (app installed / removed / plan changed), 'More Apps by Us' section with bundled assets and 'POWERED BY' purple-logo footer, Stats Overview row with the canonical 4-card StatCard (52px icon circle, 6-slot color palette), WDS typography (no raw font-family on dashboard text), support footer (apps-support@prpl.io), and Astro CSRF fix. Bundles 7 deep-dive reference apps (FBT, Password Protected, Google Drive Content, Custom Additional Fees, Shipping Address Verifier, Advanced Product File Uploader, PayPal Pay Button) plus 6 index-only entries — see `examples/INDEX.md`. Design language source of truth: `references/DESIGN_SYSTEM.md`. Trigger phrases: 'new wix app', 'create wix app', 'build a wix app', 'scaffold wix app', 'start a wix app', 'wix app from scratch', 'PRPL app', 'editor's pick app'."
compatibility: Requires Wix CLI (Astro) development environment. Must be loaded BEFORE wix-app (official orchestrator from wix/skills), wix-design-system, wix-editor-pick-app, wix-cli-howto-faq. May invoke wix-manage for REST API recipes (stores/bookings/contacts/etc.). Bundled assets live in this skill's `assets/` folder. Bundled reference apps live in `examples/` — read `examples/INDEX.md` before scaffolding anything.
---

# Wix App Blueprint — PRPL House Style (Preflight)

This skill is the **single source of truth** for how a Wix CLI (Astro) app is built in our house style. Any agent that intends to scaffold, extend, or migrate an app **must** load this skill first, then follow its checklist.

It does **not** implement features. It enforces *which* features ship by default and *in what order*, and points at the exact reference files / sub-skills that contain the implementation.

---

## How to think (read before the checklist)

You are a senior product designer **and** engineer shipping a real, paid app to real Wix merchants and their visitors — not a checklist robot. Before writing code, picture the actual person using **this specific** app: what are they trying to do, on what screen, in what order? Then build the experience that genuinely serves them best.

- **Rules encode taste, not bureaucracy.** Every rule below has a "because…". Treat them as strong defaults plus the reasoning behind them. Understand the intent and apply it to the app in front of you — don't tick boxes blindly.
- **Adapt deliberately when a default doesn't fit.** The patterns cover the common case; your job is the *right* case. (Example: a wide multi-card pricing grid wants a stacked full-width preview, not the narrow side-by-side one — same intent "preview stays useful", smarter choice for this layout.) Optimize for the merchant's and end-user's real experience, not for matching a template.
- **Know what's non-negotiable vs. yours to decide.** Hard technical constraints (valid imports, export shapes, permissions, "the icon must exist") are fixed — breaking them crashes the build. UX, layout, copy, and information architecture are **yours to reason about**: pick what looks and feels best for this product.
- **Ship something coherent and polished.** Handle empty/loading/error states, write copy a real merchant would respect, no half-built sections, no redundant panels. If it would feel awkward or broken to a real user, fix it before you call it done — don't wait to be told.
- **Think one step ahead.** Anticipate the rough edges a thoughtful designer catches up front: overflow/clipping, tiny tap targets, confusing empty states, duplicated UI, things that look fine with seed data but break with real data.

The checklist below is the floor, not the ceiling. Clear every box — then make it genuinely good.

---

## ⚠️ MANDATORY WORKFLOW CHECKLIST ⚠️

**Before reporting completion to the user, ALL boxes MUST be checked.**

### Step 0 — Preflight (this skill)

- [ ] Loaded `wix-app-blueprint` (this skill) FIRST.
- [ ] Read [references/BUILD_ORDER.md](references/BUILD_ORDER.md) — full step-by-step order.
- [ ] Read [examples/INDEX.md](examples/INDEX.md) — picked the 1–2 reference apps closest to what's being built.
- [ ] Read those apps' `SUMMARY.md` files (NOT their full source) — extracted the patterns to follow.
- [ ] Read [examples/_shared/README.md](examples/_shared/README.md) — confirmed which canonical files to copy verbatim.
- [ ] Confirmed app name, app namespace, App ID with the user (or asked for them).
- [ ] Confirmed which existing extension types the app needs (dashboard page is mandatory; widget / embedded script / site plugin / service plugin / event extension as needed).

### Step 1 — Decide extension topology (delegate)

- [ ] Loaded `wix-app` (official orchestrator from `wix/skills`) and let it decide extension types + read the matching `references/<EXTENSION>.md` file.
- [ ] If the app needs REST API automation (provisioning bookings, bulk-labeling contacts, creating sites, etc.) → loaded `wix-manage` and read the relevant recipe.

### Step 2 — Mandatory baseline features (this skill enforces)

Every PRPL app must include these by default. Skip ONLY if the user explicitly opts out:

- [ ] **Design system loaded** — read [references/DESIGN_SYSTEM.md](references/DESIGN_SYSTEM.md) BEFORE writing any dashboard JSX. This file is the source of truth for typography, the stat-card color palette, the "More Apps by Us" layout, and the "POWERED BY" footer.
- [ ] **Assets folder** at `src/dashboard/pages/assets/` (legacy CLI) or `src/extensions/dashboard/pages/<page>/assets/` (Astro) with `purple-logo.png` + 4 more-apps icons. See [references/MORE_APPS.md](references/MORE_APPS.md).
- [ ] **Dashboard page with 3 tabs**: `Manage`, `Plan & Settings`, `How to Use`. (Combine Plan and Settings unless they're truly independent and large.) See [references/TABS_BLUEPRINT.md](references/TABS_BLUEPRINT.md). Reference: every app in `examples/` uses the 3-tab structure.
- [ ] **Stats Overview row** at the top of the Manage tab: **4 cards** (3 on premium), using the canonical `StatCard` component from [`examples/_shared/StatCard.tsx`](examples/_shared/StatCard.tsx). Each card: 52×52 icon circle, color from the 6-slot palette in `DESIGN_SYSTEM.md § 2`. NEVER hand-roll the stat card.
- [ ] **All dashboard typography via WDS** — `<Text>` / `<Heading>` / `<Badge>` from `@wix/design-system`. NEVER raw `font-family` / `font-size` on `<div>`. See `DESIGN_SYSTEM.md § 1`. Site widgets (which can't use WDS) use the canonical font stack: `-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif`. Monospace credential previews: `ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace`.
- [ ] **Onboarding slideshow** (4 slides) gated by localStorage key `<APP_SLUG>_onboarding_done`. See [references/ONBOARDING.md](references/ONBOARDING.md).
- [ ] **Review popup** triggered on **first** successful save / configuration. Custom-element shadow-DOM modal that loads `https://www.wix.com/app-market/add-review/<APP_ID>` in an iframe. Gated by localStorage key `<APP_SLUG>_review_shown_v1`. See [references/REVIEW_POPUP.md](references/REVIEW_POPUP.md).
- [ ] **Backend endpoints — ASTRO API ROUTES ONLY for Astro apps** — In Wix Astro apps (every PRPL app since the `@wix/astro` adoption), `.web.ts` files DO NOT WORK. `@wix/web-methods` v1.x is a no-op wrapper — the function body bundles into the React client tree and crashes the first time it calls `auth.elevate(...)` or `auth.getTokenInfo()` with `"Unable to get the currently active token"` or `"An elevated client is required to use elevated modules"`. Symptom: dashboard shows `"Save failed: no-instance"`, network tab shows 403s. The ONLY supported backend pattern is `src/pages/api/<area>/<name>.ts` Astro routes called via `httpClient.fetchWithAuth` from `@wix/essentials`. Required Astro routes for every PRPL app:
  - `src/pages/api/app/check-premium.ts` (GET) — see [`examples/_shared/api-check-premium.ts`](examples/_shared/api-check-premium.ts).
  - `src/pages/api/app/plans.ts` (GET) — see [`examples/_shared/api-plans.ts`](examples/_shared/api-plans.ts).
  - `src/pages/api/app/track-setup-completed.ts` (POST) — see [`examples/_shared/api-track-setup-completed.ts`](examples/_shared/api-track-setup-completed.ts).
  - `src/pages/api/widget/dashboard-settings.ts` (GET + POST + OPTIONS) — reads/writes the widget's stored settings on behalf of the dashboard. Canonical reference: `~/google-calendar/src/pages/api/widget/dashboard-settings.ts`.
  - Pure types live in `src/extensions/_shared/<name>-types.ts` — NO server imports allowed (the React bundle must be able to safely import this file). Both the API route and the React bundle import from here.

  Anti-patterns (always fail):
  - ❌ `src/extensions/backend/<x>.web.ts` (the legacy webMethod pattern).
  - ❌ `import { webMethod } from '@wix/web-methods'` outside of `src/extensions/backend/events/*` event handlers.
  - ❌ `import { ... } from '../backend/<x>.web'` in dashboard / panel / widget React code.
  - ❌ Raw `fetch('/api/...')` from a dashboard / panel — must use `httpClient.fetchWithAuth`.

- [ ] **Premium check** endpoint returning `{ isPremium, planStatus, packageName, instanceId }`. Astro app → `src/pages/api/app/check-premium.ts`. Non-Astro → `check-premium.web.ts` with `"Anyone" as any`.
- [ ] **Instance ID resolver** — EVERY backend helper that needs the active `instanceId` (saves, reads, tracking, plan checks, anything that joins on Supabase) MUST try `auth.getTokenInfo()` FIRST and only fall back to `appInstances.getAppInstance()`. The AppInstance API returns a PARTIAL response in editor / widget panel / cross-context calls, so reading `instance?.instanceId` directly is the #2 cause of "Save failed: no-instance" errors (the #1 cause is using `.web.ts` instead of Astro routes — see the previous bullet). Canonical helper:

  ```ts
  async function resolveInstanceId(): Promise<string | null> {
    try {
      const tokenInfo = await auth.getTokenInfo();
      if (tokenInfo?.instanceId) return tokenInfo.instanceId;
    } catch (tokenErr) { console.warn('getTokenInfo failed:', tokenErr); }
    try {
      const { instance } = await elevatedGetAppInstance();
      return instance?.instanceId ?? null;
    } catch (instErr) { console.warn('getAppInstance failed:', instErr); return null; }
  }
  ```

  Reference: [`examples/_shared/tracking.web.ts`](examples/_shared/tracking.web.ts) and [`examples/_shared/check-premium.web.ts`](examples/_shared/check-premium.web.ts).
- [ ] **Dynamic pricing plans** endpoint reading `appPlans.listAppPlansByAppId` with the `cycleDuration.unit` parsing fix. Astro → `src/pages/api/app/plans.ts`. Non-Astro → `app-plans.web.ts`.
- [ ] **Backend events** (3 extensions): `app-installed`, `app-removed`, `plan-changed` (handles BOTH `onAppInstancePaidPlanPurchased` and `onAppInstancePaidPlanChanged` in one file). All write to Supabase `app_installations` table. See [references/APP_EVENTS.md](references/APP_EVENTS.md).
- [ ] **Setup tracking** endpoint `track-setup-completed` flips `setup_completed_at` ONCE on first save.
- [ ] **"More Apps by Us"** section with 4 cards using the canonical `MoreAppsCard` component from [`examples/_shared/MoreAppsCard.tsx`](examples/_shared/MoreAppsCard.tsx). Picker logic + catalog in [references/MORE_APPS.md](references/MORE_APPS.md); layout spec in [references/DESIGN_SYSTEM.md § 3](references/DESIGN_SYSTEM.md). MUST be centered cards (image → name → description → button), 48×48 icons with `borderRadius: 10`. All URLs append `?referral=developer&referralTag=purple&referralSectionName=developer-page`.
- [ ] **"POWERED BY" footer** inside the More-Apps card: `<Text size="tiny" secondary>` with `letterSpacing: '1.2px'`, `textTransform: 'uppercase'`, paired with the `purple-logo.png` at 20px height. NEVER skip — this is the PRPL brand mark.
- [ ] **Help / Support** section with `apps-support@prpl.io`.
- [ ] **Pricing tiers card** in the Plan tab with "MOST POPULAR" + "CURRENT PLAN" badges.
- [ ] **Astro CSRF fix** — `security: { checkOrigin: false }` in `astro.config.mjs` (otherwise webhook events 403).
- [ ] **CORS** — every `/api/*` route exports `OPTIONS`; `astro.config.mjs` has `vite.server.cors`.
- [ ] **Supabase client** at `src/extensions/_shared/supabase-client.ts` AND `src/extensions/backend/_shared/supabase-client.ts` (the two canonical Astro paths — web methods, event handlers, and API routes resolve `_shared/` differently). Use the env-based pattern from [`examples/_shared/supabase-client.ts`](examples/_shared/supabase-client.ts): read `process.env.SUPABASE_URL` + `process.env.SUPABASE_SERVICE_KEY`, throw a helpful error inside `getSupabase()` if either is missing. **COMMIT this file** (no secrets in it) — gitignoring it means every fresh `git clone && npm install && wix dev` crashes with "Cannot find module" because the agent's `app-installed.ts` event handler imports it. Credentials live in `.env.local` (which IS gitignored) and the user fills them in once per machine.
- [ ] **API CORS middleware (`src/middleware.ts`)** — Required when site widgets call `/api/*` cross-origin via `httpClient.fetchWithAuth`. Copy from [`~/paypal-payment-button/src/middleware.ts`](https://github.com/): intercept all `/api/*` paths, short-circuit `OPTIONS` with 204 + CORS headers that **echo the request `Origin`** (NOT `*`) and set `Access-Control-Allow-Credentials: true`. Also add `vite.server.cors` to `astro.config.mjs` for local dev. Without this, DevTools shows `blocked by CORS policy: No 'Access-Control-Allow-Origin' header` and the live-site widget renders nothing. Per-route `OPTIONS` exports alone are insufficient when `fetchWithAuth` sends credentials.
- [ ] **Upgrade buttons open Wix's checkout (`/apps/upgrade/${APP_ID}`)** — Every dashboard "Upgrade", "Go Premium", and per-tier "Get \<Plan\>" button MUST navigate to `https://www.wix.com/apps/upgrade/${APP_ID}?appInstanceId=${instanceId}` in a NEW TAB via the WDS Button's `as="a" href={upgradeUrl} target="_blank"` pattern. Buttons with no handler, or with handlers that just scroll to a local Plans section, are the #1 cause of "I clicked Upgrade and nothing happened" tickets. Derive `upgradeUrl` once via `useMemo` from `instanceId` (returned by `/api/app/check-premium`) and reuse it across EVERY upgrade-intent button — header CTA, in-card nudges, Premium-lock overlay, and each pricing-card "Get \<Plan\>". `target="_blank"` is required because Wix's checkout sets `X-Frame-Options: DENY`. Canonical references: [`~/paypal-payment-button/src/extensions/dashboard/pages/my-page/my-page.tsx`](https://github.com/) (`upgradeUrl` definition) + [`~/google-calendar/src/extensions/dashboard/pages/google-calendar/google-calendar.tsx`](https://github.com/) (multi-CTA wiring).
- [ ] **Free-tier watermark is the "Powered by" + Purple-logo lockup — NEVER the app name** — The free-plan watermark rendered in the live-site widget (and mirrored in the dashboard Live Preview) is brand attribution for Purple, the app vendor — NOT `Powered by {APP_NAME}` / the app's own title (printing "Powered by Pricing Plans Showcase" is meaningless to the visitor and looks like a bug). Render it as a centered horizontal lockup: a small uppercase `Powered by` label (`fontSize: 11`, `fontWeight: 600`, `letterSpacing: '1.1px'`, `textTransform: 'uppercase'`, muted color) + the **`purple-logo.png` image** (~18px tall, `display: block`, `draggable={false}`) — the same lockup as the dashboard "More Apps by Us" footer, so it reads as a real brand mark rather than plain grey text. Bundle the logo: the dashboard imports it from its page `assets/purple-logo.png`; for the live widget, COPY `purple-logo.png` into the widget's own `assets/` folder (custom elements can't reach the dashboard page's assets) and import it relatively (`import purpleLogoImg from './assets/purple-logo.png'`, then `src={typeof purpleLogoImg === 'string' ? purpleLogoImg : purpleLogoImg.src}`). The watermark MUST disappear when `isPremium` (gate behind `{!isPremium && ...}`), and the dashboard preview MUST match the widget exactly. Canonical references: [`examples/share-google-drive-content/element.tsx`](examples/share-google-drive-content/element.tsx) (widget watermark = logo + "Powered by PURPLE") + [`examples/_shared/MoreAppsCard.tsx`](examples/_shared/MoreAppsCard.tsx) (the "Powered by" + purple-logo footer lockup).
- [ ] **No user-facing size controls for Wix custom-element widgets** — `WidgetSettings` MUST NOT declare `width`, `widthValue`, `widthUnit`, `height`, `size`, or `dimensions` fields. The dashboard Manage tab MUST NOT render a "Size" SectionTitle / Width+Height FormField pair. The editor settings panel MUST NOT render a `<SummaryRow label="Size">`. The widget wrapper MUST be `width: 100%; height: 100%; minHeight: 320` — the iframe inside MUST be `width: 100%; height: 100%; border: 0`. Wix Editor's native resize handles ALREADY size custom-element widgets via the canvas bounding box — exposing app-side size controls creates duplicate, contradictory inputs (merchants set "Width: 100%" in the dashboard, drag the widget to half-page in the editor, then ticket us with "your size setting doesn't work"). If a previous build persisted size fields, add `widthValue` / `widthUnit` / `height` to `DEPRECATED_KEYS` and bump `SETTINGS_VERSION` so `migrateSettings` strips stored values on next load. Smoke check: `no_size_controls_for_custom_element_widget`.
- [ ] **Multi-card grids MUST be overflow-safe (`minmax(0, 1fr)` + `minWidth: 0`)** — Any layout that places cards side-by-side with CSS grid (pricing tables, plan comparisons, feature grids, stat rows, galleries) — in BOTH the dashboard Live Preview AND the live-site widget — MUST size tracks with `gridTemplateColumns: repeat(N, minmax(0, 1fr))`, NOT `repeat(N, 1fr)`. A bare `1fr` track is implicitly `minmax(auto, 1fr)`, and grid ITEMS default to `min-width: auto`, so a card whose content is wider than its share (a long price like `$1,299`, a wide CTA label, an unbroken word, a badge) FORCES the track wider than its container — the whole row overflows the panel and the rightmost card(s) get clipped. Symptom the merchant reports: "the plans are spilling out / getting cut off in the preview". Apply ALL of: (a) `repeat(N, minmax(0, 1fr))` on the track, (b) `minWidth: 0` on each card div, (c) `wordBreak: 'break-word'` on the name / price / tagline text, (d) reserve top padding on the grid container when cards use absolutely-positioned badges (`top: -12`) or a highlighted-card `translateY(-8px)` lift so they don't clip. The dashboard preview and the widget MUST use the SAME track sizing so the preview matches the live site. Smoke check: `grid_overflow_safe`.
- [ ] **No literal `\uXXXX` escapes leaking into JSX text content** — JSX does NOT process `\u####` escape sequences inside text nodes; they render LITERALLY on screen as the seven characters "\u2014" instead of the intended em-dash. The bug is silent in type-check (valid JSX) but catastrophic in the rendered UI. Three valid options: (a) use the real unicode character directly (`—`, `'`, `…`), (b) wrap in a string expression (`{'Saving\u2026'}`), (c) use an HTML entity (`&mdash;`, `&rsquo;`, `&hellip;`). Apply this everywhere — Text components, Button labels, Card subtitles, FormField placeholders. Smoke check: `no_literal_unicode_escape_in_jsx_text`.
- [ ] **"Need Help?" support Card uses vertical stacking with `gap="SP1"`** — The title `Need Help?` and subtitle `Our team replies within 24h — Premium gets VIP priority.` MUST be wrapped in `<Box direction="vertical" gap="SP1" flex="1">`, NEVER a plain `<Box flex="1">` (defaults to horizontal — crams the two lines side-by-side with no breathing room). One standalone Card at the bottom of How to Use is the canonical pattern (NOT folded into the FAQ Card); the only correction needed is the inner Box direction. Canonical reference: [`~/google-calendar/src/extensions/dashboard/pages/google-calendar/google-calendar.tsx`](https://github.com/) — the howToUse branch ends with the "Need Help?" Card using `<Box direction="vertical" gap="SP1" flex="1">` for the stacked title + subtitle.
- [ ] **Plan & Settings tab contains ONLY the pricing card** — The "Settings" word in the canonical "Plan & Settings" tab label is a Wix-marketplace convention paired with "Plans" — NOT a license to render a second settings form. Every editable setting (calendarId, primary color, font, mobile list toggle, advanced design controls, Save / View Editor / Live Site button group, last-saved indicator, live preview, support email footer) lives EXCLUSIVELY in the Manage tab. Putting them in BOTH tabs creates two save buttons writing to the same Wix Data row — admins save in one tab, switch tabs, see the OTHER tab's stale form, and ticket "the dashboard isn't saving". Audit yourself before emitting: open the file, grep for `activeTab === 'planSettings'`, its JSX block should contain a SINGLE `<Card>` (the per-tier pricing card). Smoke check: `plan_settings_no_duplicate_form`.
- [ ] **Pricing card disables downgrade button when on a paid plan** — Wix's App Market does NOT support self-serve downgrades — clicking "Get Free" after upgrading to Premium either no-ops or sends the merchant to a confusing checkout error. Every per-tier "Get \<Plan\>" button on a LOWER-priced plan than the active one MUST render as a DISABLED grey button labeled "Included in your plan" with a Tooltip explaining downgrades go through Wix subscription settings. The downgrade card itself MUST also be dimmed (`opacity: 0.55`, `background: '#F7F8FA'`) so it reads as "out of reach from here" rather than a broken CTA. Three states (not two): current plan → disabled "Current Plan", lower-priced plan → disabled "Included in your plan", higher-priced plan → working `as="a" href={upgradeUrl} target="_blank"` upgrade button. Compute `activePrice` once in an IIFE (not per-plan) using a numeric-price helper (`extractMonthlyPriceNumber`) sibling to `formatMonthlyPrice`. NEVER hide the downgrade card entirely — the merchant needs to see the full ladder. Canonical reference: [`~/google-calendar/src/extensions/dashboard/pages/google-calendar/google-calendar.tsx`](https://github.com/) — search for `isDowngrade` + `extractMonthlyPriceNumber`. Smoke check: `pricing_card_disables_downgrade`.
- [ ] **Plan downgrade normalizes Premium fields on GET (not just POST)** — Plan-gate Premium fields in BOTH the dashboard GET handler AND the live-site widget GET handler. The widget reads settings via GET, never POST, so gating only on POST silently strands Premium values after a downgrade — the merchant downgrades, the widget keeps rendering Premium styles forever, and the app effectively gives away paid features. Export a shared `applyPremiumGating(settings, isPremium)` helper from `widget-settings-types.ts` that overwrites every `PREMIUM_FIELDS` entry with its `DEFAULT_SETTINGS` value when `!isPremium`. Call it on the GET response, on the POST's loaded base BEFORE merging the incoming patch, and on the POST's incoming patch via `PREMIUM_FIELDS` strip. Canonical reference: [`~/google-calendar/src/extensions/_shared/widget-settings-types.ts`](https://github.com/) (`applyPremiumGating`) + [`~/google-calendar/src/pages/api/widget/dashboard-settings.ts`](https://github.com/) (GET + POST base) + [`~/google-calendar/src/pages/api/widget/settings.ts`](https://github.com/) (live-site GET). Smoke check: `premium_gating_on_get`.
- [ ] **Settings schema migration on every load** — Storage keeps the old shape forever; saved rows accumulate dead keys (from removed fields) and miss newly-added defaults. `{ ...DEFAULT_SETTINGS, ...stored }` alone fills missing fields but never drops stale ones. Export `SETTINGS_VERSION` (integer, bump on every shape change) AND a `migrateSettings(stored)` helper from `widget-settings-types.ts` that whitelists known keys, drops `DEPRECATED_KEYS`, stamps `_v: SETTINGS_VERSION`, and returns a clean `WidgetSettings`. Call it inside every loader function (dashboard `loadSettings()`, widget `loadStoredSettings()`). MUST be idempotent — safe to call on already-migrated rows. Whenever you remove or rename a field, append the old name to `DEPRECATED_KEYS` and bump `SETTINGS_VERSION`. Canonical reference: [`~/google-calendar/src/extensions/_shared/widget-settings-types.ts`](https://github.com/) (`SETTINGS_VERSION`, `DEPRECATED_KEYS`, `migrateSettings`). Smoke check: `settings_schema_migration`.
- [ ] **React ErrorBoundary at every dashboard / panel / widget root** — A single uncaught render error (broken settings JSON, undefined nested prop, third-party WDS bug, `react-to-webcomponent` quirk) erases the React subtree, and the Wix dashboard / panel / custom-element iframes all swallow it silently with no console hint. Without a boundary the merchant sees a blank white card and tickets us. Ship a shared `ErrorBoundary` class component at `src/extensions/_shared/error-boundary.tsx` — NO WDS imports (boundaries must never throw themselves), plain HTML + inline styles only, with three actions: "Try again" (resets boundary state), "Reload page" (`window.location.reload`), "Report issue" (`mailto:SUPPORT_EMAIL`). Wrap EVERY root: dashboard page inside the `WixDesignSystemProvider`, panel default export via an HOC, widget component BEFORE `reactToWebComponent`. Surface prop drives copy tone (`"dashboard" | "panel" | "widget"`). Canonical reference: [`~/google-calendar/src/extensions/_shared/error-boundary.tsx`](https://github.com/) + the panel + widget wrapper exports. Smoke check: `error_boundary_at_roots`.
- [ ] **Premium "Advanced design" controls MUST reach the rendered widget** — Every field listed in `PREMIUM_FIELDS` (the server-side plan-gating array in `widget-settings-types.ts`) MUST be consumed by EITHER (a) the production widget tsx, OR (b) a shared embed-URL / config builder helper that the widget calls. Premium-locked design fields that toggle in the dashboard but do NOTHING on the visitor's site are the worst-case Premium regression — the admin upgrades, fiddles knobs, sees no change, and tickets the team accusing the app of breaking their plan. For third-party iframe widgets (Google Calendar, Google Maps, YouTube, Spotify, Vimeo, etc.), the field MUST map to either (1) a REAL provider embed-URL parameter (look up the public embed-params doc first — `showTitle`, `showTabs`, `bgcolor`, `wkst`, `color` for Google Calendar; `controls`, `autoplay`, `color` for YouTube; etc.) or (2) a wrapper-side style WE own (border-radius, border-color, box-shadow, padding around the iframe). Inventing names like `eventChipStyle`, `headerGradient`, `customCss`, `cardHoverEffect`, `fontFamily` (when the widget IS a cross-origin iframe) silently fails — you cannot inject CSS into a cross-origin iframe. The dashboard `LivePreview` and the live widget MUST call the SAME shared builder + apply the SAME wrapper styles, so the preview is what the visitor sees. Canonical reference: [`~/google-calendar/src/extensions/_shared/widget-settings-types.ts`](https://github.com/) (`PREMIUM_FIELDS` = real Google embed params + a `frameStyle` wrapper preset) + [`~/google-calendar/src/extensions/_shared/calendar-id.ts`](https://github.com/) (`buildCalendarEmbedUrl` reads every premium param) + [`~/google-calendar/src/extensions/dashboard/pages/google-calendar/google-calendar.tsx`](https://github.com/) (`LivePreview` calls the same builder + applies the same `FRAME_PRESETS` wrapper). Smoke check: `premium_design_fields_reach_widget`.
- [ ] **Editor-preview sandbox fallback for embed widgets** — Every widget that renders an `<iframe>` pointing at a third-party provider (Google Calendar, Google Maps, YouTube, Vimeo, Spotify, Twitch, SoundCloud, Calendly, Typeform) MUST detect the Wix editor preview sandbox and show a placeholder card instead of the iframe. The editor preview iframe is sandboxed without `allow-same-origin`, so the third-party embed throws `Failed to read the 'localStorage' property from 'Window'` and the widget appears stuck on "Loading…" — admins report "I can't see it in editor" even though the live site works. Use `localStorage` probe + URL/referrer markers to detect, and wrap `httpClient.fetchWithAuth` with a 6s `AbortController` timeout so the loading state can never hang forever. Canonical reference: [`~/google-calendar/src/extensions/site/widgets/custom-elements/google-calendar/google-calendar.tsx`](https://github.com/) — search for `detectSandboxedFrame`, `isLikelyEditorPreview`, `fetchWithTimeout`, and the `isEditorPreview && embedUrl` placeholder branch.
- [ ] **Cross-origin backend calls from widgets & editor panels** — Site widgets (`src/extensions/site/widgets/custom-elements/*`) and editor settings panels (`panel.tsx`) run on the published Wix site / inside the Wix editor — NOT on the app's Astro origin. Raw `fetch('/api/...')` or `httpClient.fetchWithAuth('/api/...')` from these contexts hits the WRONG origin (the merchant's site / the editor host), returns 404 / HTML, and the widget silently renders nothing. Symptom: "editor panel says connected but I can't see the calendar" + "published site doesn't show the widget". Fix: derive the app's origin from the bundle's URL — `const getApiBase = () => { try { return new URL(import.meta.url).origin; } catch { return ''; } };` — and always call `httpClient.fetchWithAuth(\`${getApiBase()}/api/...\`)` (NOT raw `fetch`). The Astro API route MUST also export `OPTIONS` with permissive CORS headers (`Access-Control-Allow-Origin: '*'`, `Access-Control-Allow-Methods: 'GET, POST, OPTIONS'`, `Access-Control-Allow-Headers: 'Content-Type, Authorization'`) — the live site fires a preflight before every GET/POST. **Dashboard pages (`src/extensions/dashboard/pages/*`) are EXEMPT** — the Wix dashboard iframe proxies relative paths correctly. Canonical references: [`~/google-calendar/src/extensions/site/widgets/custom-elements/google-calendar/google-calendar.tsx`](https://github.com/) (widget), [`~/google-calendar/src/extensions/site/widgets/custom-elements/google-calendar/panel.tsx`](https://github.com/) (panel), [`~/paypal-payment-button/src/extensions/site/widgets/custom-elements/paypal-pay-button/widget.tsx`](https://github.com/) (original reference).
- [ ] **User-input validation for provider IDs / URLs** — Every text input the merchant fills in that ends up inside an iframe `src=`, a third-party SDK constructor, or a server-side fetch URL (Google Calendar IDs, PayPal client IDs, YouTube channel/video IDs, Spotify URIs, Stripe publishable keys, custom CSS, profile usernames) MUST be validated in THREE places using ONE shared helper. The helper lives at `src/extensions/_shared/<field>-id.ts` and exports both `normalize<Field>(raw)` and `validate<Field>(raw): { ok, normalized, reason, code }`. Wire it into (1) the dashboard FormField for live error feedback + Save-button gating, (2) the POST API route for server-side defense + persisting the normalized value, and (3) the widget renderer so anything that passed the validator is guaranteed to render. Canonical reference: [`~/google-calendar/src/extensions/_shared/calendar-id.ts`](https://github.com/) with the dashboard, API route, and widget all importing the same `normalizeCalendarId` / `validateCalendarId`. Anti-patterns the smoke harness rejects: a POST handler that reads `calendarId` / `clientId` / `channelId` / `embedUrl` / `apiKey` from the body and persists it without calling a `validate*` / `normalize*` / `isValid*` helper first.
- [ ] **Storage decision rule (Supabase vs Wix Data)** — Supabase is reserved for the SHARED `app_installations` analytics table (written from the 3 event handlers + `/api/app/track-setup-completed`). EVERY per-instance need (widget settings, third-party credentials, usage counters, merchant content) goes through **Wix Data** via the app's data extension. Picking wrong throws `Could not find the table 'public.<x>' in the schema cache` on the first save because the Foundation does NOT provision per-app Supabase tables. Anti-patterns the smoke harness rejects: `supabase.from('widget_settings')`, `supabase.from('credentials')`, `supabase.from('usage_counter')`, or any non-`app_installations` table name. Canonical per-instance pattern: [`~/paypal-payment-button/src/extensions/_shared/credentials.ts`](https://github.com/) (Wix Data + `auth.elevate(items.query/insert/update)` + single-collection key-discriminator).
- [ ] **Wix CMS data extension** at `src/extensions/data/extensions.ts` declaring at least one private `<slug>-data` collection via `extensions.genericExtension({ compType: 'DATA_COMPONENT' })`, registered in `src/extensions.ts`, with companion `src/extensions/_shared/collections.ts` exporting `COLLECTION_DATA = \`${APP_NS}/<slug>-data\`` + row-key constants. **REQUIRED on every app** — without this file Wix doesn't enable the installed site's code editor, so the `@wix/data` APIs (`items.query`/`items.insert`/`items.update`) are silently locked and every backend write returns empty results. Default to a single private collection with a `{ key, ... }` row pattern (holds multiple logical docs keyed by `key`) — extra collections from the spec's "Data Collections" section go into the SAME `collections: [ ... ]` array. `compId` MUST be a static UUID v4 baked in (NEVER `randomUUID()`). Every `OBJECT` field MUST include `objectOptions: {}`. Canonical reference: [`examples/paypal-payment-button/data-extension.ts`](examples/paypal-payment-button/data-extension.ts) (when present) or `~/paypal-payment-button/src/extensions/data/extensions.ts` + `~/google-calendar/src/extensions/data/extensions.ts`. See also [wix-cli-data-collection SKILL.md](../wix-cli-data-collection/SKILL.md).
- [ ] **Localization** — every user-facing string goes through `react-intl` and translation JSON files. Validate JSON after every batch (curly-quotes break `wix build`).
- [ ] **Custom Element preset thumbnail** — if the app ships a site widget (`extensions.customElement`), every preset MUST set `thumbnailUrl` per [references/CUSTOM_ELEMENT_THUMBNAIL.md](references/CUSTOM_ELEMENT_THUMBNAIL.md): PNG in `public/`, `{{BASE_URL}}/<file>` (**no** `/public/` segment), dimensions ≈ widget defaults, RGB, modest file size — otherwise the Editor **Add widget** tile stays empty in prod.

### Step 3 — UX quality patterns (delegate to `wix-editor-pick-app`)

- [ ] Loaded `wix-editor-pick-app` for celebration banner, stats cards, skeleton loading, search, pagination, scroll behavior, settings panel structure, widget best practices.

### Step 4 — Component imports (delegate to `wix-design-system`)

- [ ] Loaded `wix-design-system` (official from `wix/skills`) BEFORE writing the first `.tsx`/`.jsx` that imports `@wix/design-system`.
- [ ] Used the bundled `node $WDS component <Name>` / `node $WDS testkit <Name>` lookups instead of grepping `node_modules` blindly.
- [ ] Verified icon imports come from `@wix/wix-ui-icons-common`, NOT `@wix/design-system/icons`.

### Step 5 — Optional add-ons

- [ ] If the user wants a GuideJar interactive guide + FAQ → loaded `wix-cli-howto-faq`.
- [ ] If the user wants Wix REST automation (e.g. provision a Bookings service, bulk-label contacts, upload media via REST) → loaded `wix-manage` and read the matching `references/<topic>/<recipe>.md`.

### Step 6 — Validation (delegate)

- [ ] Followed `wix-app`'s validation step (its `references/APP_VALIDATION.md`).
- [ ] `npx tsc --noEmit -p .` clean.
- [ ] `wix build` clean (especially: validate every `src/intl/messages/*.json` before build).
- [ ] Verified `supabase-client.ts` reads from `process.env.SUPABASE_URL` + `process.env.SUPABASE_SERVICE_KEY` and is COMMITTED (not gitignored). Verified `.env.local` IS gitignored.

### Step 7 — Surface manual action items

- [ ] Listed every manual step the user must perform: Dev Center plan/permission setup, Supabase table creation, App ID configuration in events files, GuideJar URL, App Market review link.

🛑 **STOP**: If any box above is unchecked, do NOT report "done".

---

## ❌ ANTI-PATTERNS (DO NOT DO)

| ❌ WRONG | ✅ CORRECT |
|---------|-----------|
| Implement code before loading this skill | Load `wix-app-blueprint` FIRST, read `examples/INDEX.md`, then orchestrator, then implement |
| Invent your own dashboard layout / tab structure | Copy the 3-tab structure (Manage / Plan & Settings / How to Use) from any `examples/<app>/dashboard-skeleton.tsx` |
| Skip the 3-tab structure ("just one page is fine") | All PRPL apps ship with Manage / Plan & Settings / How to Use |
| Show onboarding every visit | Gate with `localStorage.getItem('<APP_SLUG>_onboarding_done')` |
| Show review popup every visit | Gate with `localStorage.getItem('<APP_SLUG>_review_shown_v1')`, trigger ONLY on first save |
| Trigger review popup on dashboard mount | Trigger AFTER first successful save / configuration action |
| Use `Permissions.Anyone` from `@wix/web-methods` | Use the string literal `"Anyone" as any` (older versions don't export `Permissions`) |
| Use `webMethod` for elevated calls in `@wix/astro` apps | Use Astro API routes (`src/pages/api/*.ts`) — webMethods leak server imports into the client bundle |
| Skip `OPTIONS` handler on an `/api/*` route | Always export `OPTIONS` — Astro's auto OPTIONS has no CORS headers |
| Skip `security: { checkOrigin: false }` in `astro.config.mjs` | Always include — otherwise every backend event webhook 403s |
| Read `pr.billingCycle.cycleType` for monthly/yearly | Read `pr.billingCycle.cycleDuration.unit` (`MONTH` / `YEAR`) — `cycleType` is always `"RECURRING"` |
| Display yearly price as returned (per-month) | Multiply by 12 — yearly prices come back per-month from `appPlans.listAppPlansByAppId` |
| Match "current plan" badge by tier `id` | Match by `packageName` (case-insensitive) from `getAppInstance` |
| Hardcode `$3.99` or any currency / price | Pull from `/api/app/plans`, fallback to `Intl.NumberFormat` for currency symbol |
| Hardcode strings in JSX | Wire every string through `react-intl` + JSON files from day one |
| Curly / smart quotes inside JSON values (`„…"`, `"…"`, `«…»`) | Use straight quotes; validate JSON after every batch edit |
| Custom-element `thumbnailUrl: '{{BASE_URL}}/public/...'` or missing preset thumbnail | PNG in `public/` + `{{BASE_URL}}/filename.png` only — see [references/CUSTOM_ELEMENT_THUMBNAIL.md](references/CUSTOM_ELEMENT_THUMBNAIL.md) |
| Multi-card grid with `gridTemplateColumns: repeat(N, 1fr)` (cards overflow + clip) | `repeat(N, minmax(0, 1fr))` on the track + `minWidth: 0` on each card + `wordBreak: 'break-word'` on price/name text |
| Hardcode `SUPABASE_URL` / `SUPABASE_SERVICE_KEY` constants in `supabase-client.ts` and gitignore the file | Read from `process.env`, throw a helpful error if missing, COMMIT the file (credentials live in `.env.local` which IS gitignored) |
| Two `onAppInstancePaidPlanPurchased` handlers in different files | Co-locate `purchased` + `changed` in one `plan-changed.ts` file |
| Hand-roll your own stat cards with arbitrary sizes / colors / fonts | Copy [`examples/_shared/StatCard.tsx`](examples/_shared/StatCard.tsx) verbatim. Use the 6-slot color palette in `DESIGN_SYSTEM.md § 2`. |
| Use raw `<div style={{ fontFamily: '...', fontSize: 14 }}>` for dashboard text | Use `<Text size="small">` / `<Heading>` / `<Badge>` from `@wix/design-system`. The only allowed `fontFamily` overrides are monospace credential previews. |
| Use a `<Card.Header title="More apps by us" />` on the More-Apps card | Use `<Card.Content>` only, with an inner `<Text size="medium" weight="bold">` for the title — this is the canonical PRPL pattern across all 7+ production apps. |
| Use `<Text>POWERED BY</Text>` (no letter-spacing, no uppercase CSS) | Use `<Text size="tiny" secondary style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}>Powered by</Text>` + purple-logo.png at 20px. |
| Forget the `?referral=developer&referralTag=purple&referralSectionName=developer-page` query string on More-Apps URLs | Always include — affiliate tracking convention for every PRPL app. |
| Render the purple logo at 16px (older notes are wrong) | Production height is **20px**. |
| Inline base64 the More-Apps icons or the purple logo | Bundler import (`import x from '../assets/x.png'`) — paths get hashed for cache-busting. |

---

## Skills the Blueprint Orchestrates

The canonical skill names below match the official `wix/skills` GitHub manifest plus our local PRPL skills. If your editor's skill manifest pins different versions, treat the names as logical roles (orchestrator / WDS / management / etc.).

| Skill | Source | When to load | Purpose |
|-------|--------|--------------|---------|
| `wix-app-blueprint` (this) | local | FIRST, always | Enforces PRPL house-style baseline + workflow order |
| `wix-app` | `wix/skills` (official) | After preflight | Decides which extension types to scaffold; inlines per-extension references (DASHBOARD_PAGE, BACKEND_EVENT, SERVICE_PLUGIN, …) + APP_VALIDATION + STORES_VERSIONING + APP_IDENTIFIERS + EXTENSION_REGISTRATION |
| `wix-design-system` | `wix/skills` (official) | BEFORE first `.tsx`/`.jsx` that imports `@wix/design-system` | Component / props / examples / icons / testkit lookups via bundled `scripts/wds.cjs` |
| `wix-manage` | `wix/skills` (official) | When the app needs REST API automation (provision bookings, contacts, media, sites, payments, CMS, etc.) | REST recipes — read `references/<topic>/<recipe>.md` |
| `wix-editor-pick-app` | local | While building dashboard / settings / widget | UX quality patterns, premium check, dynamic plans (PRPL-specific) |
| `wix-cli-howto-faq` | local | If user requests GuideJar guide + FAQ | iframe + Accordion FAQ in How to Use tab |

`wix-app` consolidates everything that used to live in `wix-cli-orchestrator` + each `wix-cli-<extension>` skill + `wix-cli-app-validation` + `wix-stores-versioning` + `wix-cli-extension-registration`. You no longer load those individually — instead, `wix-app` opens its own `references/<EXTENSION>.md` files when needed.

---

## Mandatory App Identity

Before scaffolding, capture and persist these constants somewhere central (e.g. `src/extensions/_shared/app-config.ts`):

```ts
export const APP_ID       = '<your-app-id>';                      // from Dev Center
export const APP_SLUG     = '<lowercase-slug>';                   // e.g. 'fbt', 'password-protected', 'google-drive'
export const APP_NAME     = '<Human Readable Name>';              // e.g. 'Frequently Bought Together'
export const APP_NS       = '@<vendor>/<app-name>';               // e.g. '@prpl/fbt'
export const REVIEW_URL   = `https://www.wix.com/app-market/add-review/${APP_ID}`;
export const SUPPORT_EMAIL = 'apps-support@prpl.io';
```

These constants drive: dashboard branding, review popup URL, localStorage namespacing, Supabase `app_name` column, and `apps-support@prpl.io` support links.

---

## Bundled Assets

This skill ships an `assets/` folder containing the canonical PRPL "More Apps by Us" icons + the purple logo. Copy the relevant files into the user's project at `src/dashboard/pages/assets/` (legacy CLI) or `src/extensions/dashboard/pages/<page>/assets/` (Astro).

Visual usage rules (image sizes, `purple-logo.png` at 20px height with `letterSpacing: '1.2px'` POWERED BY treatment, etc.) are in [`references/DESIGN_SYSTEM.md` § 5](references/DESIGN_SYSTEM.md#5-bundled-assets).

| File | Purpose | Wix App Market URL |
|------|---------|--------------------|
| `purple-logo.png` | PRPL company logo (footer "POWERED BY") | n/a |
| `frequently-bought-together.png` | More-apps card | https://www.wix.com/app-market/17d75b11-b574-4b49-9708-4ffa8be777a6 |
| `360-product-viewer.png` | More-apps card | https://www.wix.com/app-market/dd2b43ee-f3e5-4ca2-bb87-73f41be78d18 |
| `verifying-shipping-addresses.png` | More-apps card | https://www.wix.com/app-market/shipping-address-verifier |
| `google-drive-content.png` | More-apps card | https://www.wix.com/app-market/6d396a1f-1145-4feb-9531-3b520ab4389e |
| `password-protected.png` | More-apps card | https://www.wix.com/app-market/password-protected |
| `custom-additional-fees.png` | More-apps card | https://www.wix.com/app-market/custom-additional-fees |
| `advanced-product-file-uploader.png` | More-apps card | https://www.wix.com/app-market/advanced-product-file-uploader |
| `facebook-feed.png` | More-apps card | https://www.wix.com/app-market/facebook-feed-pro |

Always pick **4 cards** for the "More Apps by Us" row, and exclude the app being built. See [references/MORE_APPS.md](references/MORE_APPS.md) for the full picker logic.

---

## Reference Files

Deep-dive references — loaded by the implementing sub-agent on demand, not all up-front.

| File | Contents |
|------|----------|
| [references/BUILD_ORDER.md](references/BUILD_ORDER.md) | Phase-by-phase build sequence, copy-paste from preflight to release |
| [references/DESIGN_SYSTEM.md](references/DESIGN_SYSTEM.md) | **READ BEFORE WRITING DASHBOARD JSX** — Typography (WDS Text/Heading; monospace + site-widget font stacks), stat-card design tokens + 6-slot color palette, More-Apps card layout, POWERED BY footer spec, card chrome, bundled assets, canonical localization keys |
| [references/TABS_BLUEPRINT.md](references/TABS_BLUEPRINT.md) | 3-tab structure (Manage / Plan & Settings / How to Use) — what goes in each tab (visual spec → DESIGN_SYSTEM.md) |
| [references/ONBOARDING.md](references/ONBOARDING.md) | 4-slide slideshow, dot indicators, localStorage gating |
| [references/REVIEW_POPUP.md](references/REVIEW_POPUP.md) | Shadow-DOM `<rate-popup>` web component + first-save trigger |
| [references/APP_EVENTS.md](references/APP_EVENTS.md) | `app-installed` / `app-removed` / `plan-changed` + Supabase schema |
| [references/MORE_APPS.md](references/MORE_APPS.md) | "More Apps by Us" **picker logic + catalog + translation keys** (component layout → DESIGN_SYSTEM.md § 3; canonical component → `examples/_shared/MoreAppsCard.tsx`) |
| [references/EXAMPLE_APPS.md](references/EXAMPLE_APPS.md) | High-level overview of FBT / Password Protected / Google Drive Content (use `examples/` for code-level depth) |
| [references/LOCALSTORAGE_KEYS.md](references/LOCALSTORAGE_KEYS.md) | All localStorage keys we use, namespaced by app slug |
| [references/CUSTOM_ELEMENT_THUMBNAIL.md](references/CUSTOM_ELEMENT_THUMBNAIL.md) | **Add-widget tile**: `presets.thumbnailUrl`, `public/` vs `{{BASE_URL}}`, no `/public/` path, PNG sizing (RGB, widget footprint, ≤~500 KB), `dist/_routes.json` verification |

### Bundled reference apps (`examples/`)

| Folder | Contents |
|--------|----------|
| [examples/INDEX.md](examples/INDEX.md) | **READ FIRST** — catalog of 7 deep-dive apps + 6 index-only apps + decision tree for picking the closest match |
| [examples/_shared/](examples/_shared/) | Canonical PRPL files every app copies verbatim: `rate-popup.ts`, `check-premium.web.ts`, `app-plans.web.ts`, `tracking.web.ts`, `supabase-client.ts`, the 3 backend events, **`StatCard.tsx`, `MoreAppsCard.tsx`** |
| [examples/frequently-bought-together/](examples/frequently-bought-together/) | Multi-slot Site Plugin (checkout + side cart), per-plan rule limits, settings polling. Legacy CLI. |
| [examples/password-protected/](examples/password-protected/) | Embedded Script (HEAD), `{{placeholders}}`, client-side SHA-256, HTTP API for site widgets. Legacy CLI. |
| [examples/share-google-drive-content/](examples/share-google-drive-content/) | Custom Element Widget + Editor Settings Panel, watermark on free tier. Legacy CLI. |
| [examples/custom-additional-fees/](examples/custom-additional-fees/) | Service Plugin (`additionalFees`), HTTP API CRUD, "applies to all" sentinel. Legacy CLI. |
| [examples/shipping-address-verifier/](examples/shipping-address-verifier/) | Service Plugin (`validations`), cart-vs-checkout severity, single-row settings. Legacy CLI. |
| [examples/advanced-product-file-uploader/](examples/advanced-product-file-uploader/) | **Modern Astro app template** — 11 extensions, single `extensions.ts`, API routes alongside web methods. Use for every NEW app. |
| [examples/paypal-payment-button/](examples/paypal-payment-button/) | **Third-party SDK + provider credentials** — runtime `<script>` injection, server-side sandbox/live token probe, single Wix Data collection with `key` discriminator, editor-environment detection. Astro. |

---

## Cost / Token Optimization

- **Don't read every reference up front** — read only what's needed for the current step.
- **Don't re-read existing references** that `wix-app` opens on its own (e.g. `references/DASHBOARD_PAGE.md`).
- When delegating to a sub-agent, include **only** the user requirements + the relevant reference paths, never the full text.
- The mandatory baseline features must always be enforced — if a sub-agent skips one, escalate and re-prompt.

---

## TL;DR

1. Load this skill first.
2. **Read `examples/INDEX.md`** — pick the 1–2 closest reference apps (FBT / Password Protected / Google Drive / Custom Additional Fees / Shipping Address Verifier / Advanced Product File Uploader / PayPal Payment Button). Read their `SUMMARY.md`, then **only the specific files** they mention.
3. **Read `references/DESIGN_SYSTEM.md`** — required before writing any dashboard JSX (typography, stat-card palette, More-Apps layout, POWERED BY footer).
4. Capture `APP_ID`, `APP_SLUG`, `APP_NAME`, `APP_NS`.
5. Walk the checklist in order.
6. Delegate extension-type decisions to `wix-app`.
7. Delegate WDS / icon / testkit lookups to `wix-design-system`.
8. Delegate UX patterns to `wix-editor-pick-app`.
9. Use `wix-manage` when the app needs REST API automation (bookings, contacts, sites, media, …).
10. Always include the 3 mandatory tabs (Manage / Plan & Settings / How to Use), onboarding, review popup, premium check, dynamic plans, 3 backend events, Stats Overview row + canonical `StatCard`, More-Apps card + POWERED BY footer, support footer, Astro CSRF fix.
11. Copy `examples/_shared/*` verbatim — every app uses these (including `StatCard.tsx` + `MoreAppsCard.tsx`).
12. Validate via `wix-app`'s `APP_VALIDATION.md`.
13. Surface manual steps at the very end.
