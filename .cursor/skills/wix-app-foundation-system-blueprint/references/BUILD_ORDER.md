# Build Order — Strict Sequence

This is the **exact order** to scaffold a new PRPL Wix CLI (Astro) app from zero. Do NOT skip phases. Each phase must be complete before the next begins.

---

## Phase 0 — Preflight

1. Read [SKILL.md](../SKILL.md) — confirm checklist.
2. Capture from the user (or ask):
   - `APP_NAME` (e.g. "Frequently Bought Together")
   - `APP_SLUG` (e.g. `fbt`)
   - `APP_NS` (e.g. `@prpl/fbt`)
   - `APP_ID` (UUID from Dev Center; if not yet created, ask user to create the app first)
3. Decide: new app vs migration. Migration → ask the user for the existing App ID + namespace and reuse them when running `npx wix init`.

---

## Phase 1 — Bootstrap

```bash
npx wix init
# Pick the @wix/astro template
# Paste the EXISTING App ID + namespace if migrating
```

Install house dependencies:

```bash
npm i @wix/business-tools @supabase/supabase-js
# If using a custom-element widget:
npm i react-to-webcomponent
# Translation:
npm i react-intl
```

Pin `@wix/essentials@^1.0.6` if migrating.

---

## Phase 2 — App Identity Constants

Create `src/extensions/_shared/app-config.ts`:

```ts
export const APP_ID        = '<your-app-id>';
export const APP_SLUG      = '<lowercase-slug>';
export const APP_NAME      = '<Human Readable Name>';
export const APP_NS        = '@<vendor>/<app-name>';
export const REVIEW_URL    = `https://www.wix.com/app-market/add-review/${APP_ID}`;
export const SUPPORT_EMAIL = 'apps-support@prpl.io';

export const LS_ONBOARDING = `${APP_SLUG}_onboarding_done`;
export const LS_REVIEW     = `${APP_SLUG}_review_shown_v1`;
```

This is the **single source of truth** for all branding / namespacing.

---

## Phase 3 — Supabase + Secrets

1. Create `src/extensions/_shared/supabase-client.ts` — see [APP_EVENTS.md](APP_EVENTS.md) for full code.
2. Add to `.gitignore` BEFORE first commit:
   ```
   # secrets
   src/extensions/_shared/supabase-client.ts
   ```
3. Verify: `git check-ignore -v src/extensions/_shared/supabase-client.ts` → must print the rule.

---

## Phase 4 — Astro Config

Edit `astro.config.mjs`:

```js
import { defineConfig } from 'astro/config';
import wix from '@wix/astro';
import react from '@astrojs/react';
import cloudflare from '@astrojs/cloudflare';

export default defineConfig({
  output: 'server',
  adapter: cloudflare(),
  integrations: [wix(), react()],
  security: { checkOrigin: false },
  vite: {
    server: {
      cors: {
        origin: true,
        credentials: true,
        methods: ['GET','POST','PUT','PATCH','DELETE','OPTIONS'],
        allowedHeaders: ['Content-Type','Authorization'],
      },
    },
  },
});
```

`security: { checkOrigin: false }` is mandatory — Astro 5+ rejects every backend event webhook with 403 otherwise.

---

## Phase 5 — Backend Events (3 extensions)

In this exact order:

1. `src/extensions/backend/events/app-installed/` — see [APP_EVENTS.md § app-installed](APP_EVENTS.md#app-installed).
2. `src/extensions/backend/events/app-removed/` — see [APP_EVENTS.md § app-removed](APP_EVENTS.md#app-removed).
3. `src/extensions/backend/events/plan-changed/` — handles BOTH `onAppInstancePaidPlanPurchased` and `onAppInstancePaidPlanChanged` in one file. See [APP_EVENTS.md § plan-changed](APP_EVENTS.md#plan-changed-both-events).

Generate fresh UUIDs for each `.extension.ts` file. NEVER copy a UUID.

---

## Phase 6 — API Routes

Astro app:

```
src/pages/api/
  app/
    check-premium.ts            # GET
    plans.ts                    # GET
    track-setup-completed.ts    # POST
```

Plus app-specific routes (`/api/secret/*`, `/api/<provider>/*`, `/api/usage/*`) as needed.

Every route exports `OPTIONS` + the verb handler. See `examples/advanced-product-file-uploader/api-check-plan.ts` for a canonical route body (CORS preflight + GET handler).

Non-Astro app: use `.web.ts` web methods with `"Anyone" as any` literal. See `wix-editor-pick-app/SKILL.md`.

---

## Phase 7 — Data Collections (if needed)

Decide: does the app store per-site config? If yes:

- Create a `DATA_COMPONENT` extension at `src/extensions/data/extensions.ts`.
- Permissions: `PRIVILEGED` for everything (every read/write goes through `auth.elevate()` from the API routes).

Reference: `wix-app` skill → `references/DATA_COLLECTION.md`.

---

## Phase 8 — Dashboard Page (4 tabs)

Create `src/extensions/dashboard/pages/<page-name>/page.tsx`. See [TABS_BLUEPRINT.md](TABS_BLUEPRINT.md) for the exact layout.

Tabs in this order:
1. **Manage** (default, `id: 0`)
2. **Plan** (`id: 1`) — pricing tiers + dynamic plan reading
3. **Settings** (`id: 2`) — app preferences
4. **How to Use** (`id: 3`) — steps + GuideJar iframe (optional) + FAQ accordion (optional)

State at the page level:
```tsx
const [activeTab, setActiveTab] = useState(0);
const [savedConfigs, setSavedConfigs] = useState<Config[]>([]);
const [onboardingDismissed, setOnboardingDismissed] = useLocalStorageBool(LS_ONBOARDING);
const [premium, setPremium] = useState<{ isPremium: boolean; planStatus: string; packageName?: string }>({ isPremium: false, planStatus: 'free' });
```

Branded header:
- Page title = `APP_NAME`
- Subtitle = short tagline
- Header suffix: `<Loader />` while premium loads → `<Badge />` with plan name → `<Button>Upgrade</Button>` for free/cancelled

---

## Phase 9 — Onboarding

Implement the 4-slide slideshow. See [ONBOARDING.md](ONBOARDING.md). Wrap all dashboard content in:

```tsx
{(!isFirstTime || onboardingDismissed || loading) && (<>...</>)}
```

So onboarding hides the dashboard until the user dismisses it. Persist via `localStorage[LS_ONBOARDING]`.

---

## Phase 10 — Review popup

Implement `src/extensions/dashboard/_shared/rate-popup.ts`. See [REVIEW_POPUP.md](REVIEW_POPUP.md). Wire it in the dashboard:

```tsx
useEffect(() => { ensureRatePopupRegistered(); }, []);

const triggerReviewOnce = useCallback(() => {
  try {
    if (localStorage.getItem(LS_REVIEW)) return;
    localStorage.setItem(LS_REVIEW, '1');
    setTimeout(() => openRatePopup(REVIEW_URL), 2000);
  } catch {}
}, []);
```

Trigger from the FIRST successful save handler:

```tsx
const handleSave = async () => {
  await saveConfig(...);
  await fetch('/api/app/track-setup-completed', { method: 'POST' }).catch(() => {});
  triggerReviewOnce();
  setShowCelebration(true);   // also trigger the green celebration banner
};
```

The 2-second delay lets the green celebration banner / toast land before the modal pops.

---

## Phase 11 — Site extension (the actual functionality)

Decide once with `wix-app` (load its `references/<EXTENSION>.md` accordingly):

- **Custom Element Widget** (`references/CUSTOM_ELEMENT_WIDGET.md`) — draggable, per-instance settings, includes editor panel.
- **Embedded Script** (`references/EMBEDDED_SCRIPT.md`) — site-wide injection (analytics, password gate, head snippets).
- **Site Plugin** (`references/SITE_PLUGIN.md`) — fixed slot inside an existing Wix app page (e.g. checkout, side cart for FBT).
- **Editor React Component** (`references/EDITOR_REACT_COMPONENT.md`) — React component with editor manifest.

Build it after the dashboard exists, so the dashboard's `Settings` tab can configure the widget's defaults.

---

## Phase 12 — More Apps + Support

Add the "More Apps by Us" section + Help / Support card at the bottom of every dashboard page tab. See [MORE_APPS.md](MORE_APPS.md).

```tsx
<MoreAppsCard exclude={APP_SLUG} />
<SupportCard />
```

---

## Phase 13 — Localization

Set up `react-intl` with the 17 PRPL house locales (see `wix-cli-howto-faq/SKILL.md`):
- `da, de, en, es, fr, he, it, ja, ko, nl, pl, pt, ru, th, tr, uk, zh`

Create `src/intl/messages/<locale>.json` with every user-facing string. Validate JSON after every batch:

```bash
for f in src/intl/messages/*.json; do
  node -e "JSON.parse(require('fs').readFileSync('$f','utf8'))" 2>&1 && echo "$f: ok" || echo "$f: INVALID"
done
```

Curly / smart quotes inside JSON values break `wix build`. Replace `„…"`, `"…"`, `«…»` with straight quotes.

---

## Phase 14 — Optional: GuideJar + FAQ

If the user provides a GuideJar embed URL → load `wix-cli-howto-faq` and add the iframe + FAQ accordion to the **How to Use** tab.

---

## Phase 15 — Validation

```bash
npx tsc --noEmit -p .
npx wix build
npx wix dev          # verify dashboard loads, onboarding shows, save → review popup
```

Then follow `wix-app` → `references/APP_VALIDATION.md` for the preview deploy step.

---

## Phase 16 — Manual Steps Surfaced

Aggregate and present at the very end, e.g.:

1. Create the Supabase `app_installations` table — schema in [APP_EVENTS.md § supabase schema](APP_EVENTS.md#supabase-schema).
2. Set `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` in `src/extensions/_shared/supabase-client.ts`.
3. In Dev Center → Monetization → App Plans, configure `monthly` + `yearly` benefits and prices.
4. In Dev Center → Webhooks, register the 3 backend events.
5. In Dev Center, set the app permissions scopes (Wix Data read/write, Embedded Scripts, etc.).
6. (Optional) Replace placeholder GuideJar URL with real embed URL.
7. Run `npx wix release` after first manual QA.

---

## Order of operations — TL;DR

```
0  Preflight + capture identity
1  npx wix init (Astro template)
2  app-config.ts constants
3  Supabase client + .gitignore
4  astro.config.mjs (CSRF off + Vite CORS)
5  Backend events (3) → Supabase
6  API routes (check-premium, plans, track-setup, app-specific)
7  Data collection (if needed; reuse compId on migration)
8  Dashboard page with 4 tabs
9  Onboarding slideshow + LS gating
10 Review popup + LS gating + first-save trigger
11 Site extension (widget / plugin / script)
12 More Apps + Support
13 Localization (17 locales)
14 GuideJar + FAQ (optional)
15 Validation (tsc, build, dev, validation skill)
16 Surface manual steps
```
