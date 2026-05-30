# AI Corrections — Common Mistakes to Avoid

This file is automatically maintained by the App Factory feedback loop.
When an admin fixes an AI-generated file and marks the correction as "global",
it gets appended here so all future builds learn from the mistake.

Format: each correction has a file pattern, what went wrong, and the fix.

---

## 1. WebMethod Permissions — NEVER use Permissions.Anyone

**Files:** `*.web.ts` (all backend web methods)
**Wrong:**
```ts
import { Permissions } from '@wix/web-methods';
export const myMethod = webMethod(Permissions.Anyone, async () => { ... });
```
**Correct:**
```ts
export const myMethod = webMethod(("Anyone" as any), async () => { ... });
```
**Why:** The `@wix/web-methods` package has a type bug. Using `Permissions.Anyone` causes runtime errors. The `"Anyone" as any` workaround is used in all production apps.

---

## 2. React Version — Use React 16, NOT React 18+

**Files:** `package.json`, all React components
**Wrong:**
```ts
import { createRoot } from 'react-dom/client';
createRoot(document.getElementById('root')).render(<App />);
```
**Correct:**
```ts
import ReactDOM from 'react-dom';
ReactDOM.render(<App />, document.getElementById('root'));
```
**Why:** Wix CLI dashboard apps run on React 16. Do not use React 18 APIs like `createRoot`, `useId`, `useSyncExternalStore`, etc.

---

## 3. Shadow DOM Custom Elements — Always use react-to-webcomponent

**Files:** `src/site/` widget/plugin entry points
**Wrong:** Manually creating custom elements with `document.createElement`
**Correct:**
```ts
import r2wc from '@prmichaelsen/react-to-webcomponent';
import React from 'react';
import ReactDOM from 'react-dom';
import { Widget } from './components/Widget';
const WCWidget = r2wc(Widget, React, ReactDOM);
customElements.define('my-widget', WCWidget);
```
**Why:** All site widgets/plugins must use Shadow DOM isolation via `react-to-webcomponent` to prevent CSS conflicts with the host site.

---

## 4. Event Handlers — Must export default with correct naming

**Files:** `src/backend/events/` event handler files
**Wrong:**
```ts
export function onAppInstalled(event) { ... }
```
**Correct:**
```ts
export default async function wixAppInstalled(event: any) { ... }
```
**Why:** Wix CLI event handlers must be default exports and follow the `wix[EventName]` naming convention.

---

## 5. Check Premium — Use elevate() for elevated API calls

**Files:** `src/backend/check-premium.web.ts`
**Wrong:**
```ts
import { orders } from '@wix/pricing-plans';
const result = await orders.listOrders();
```
**Correct:**
```ts
import { orders } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';
const elevatedListOrders = auth.elevate(orders.listOrders);
const result = await elevatedListOrders();
```
**Why:** Backend code checking premium status needs elevated permissions to read order data across all site members.

---

## 6. tsconfig.json — Must extend @wix/cli-app/tsconfig.app.json

**Files:** `tsconfig.json`
**Wrong:**
```json
{
  "compilerOptions": {
    "strict": true,
    "jsx": "react",
    "esModuleInterop": true,
    "skipLibCheck": true
  }
}
```
**Correct:**
```json
{
  "extends": "@wix/cli-app/tsconfig.app.json",
  "compilerOptions": {
    "rootDir": "src",
    "types": ["react"]
  },
  "include": ["src"]
}
```
**Why:** The `@wix/cli-app/tsconfig.app.json` sets `moduleResolution: "Bundler"` and other required options. Without extending it, `@wix/astro/builders` and other Wix build-time modules won't resolve.

---

## 7. @wix/astro — Required devDependency

**Files:** `package.json`
**Wrong:** Missing `@wix/astro` from devDependencies
**Correct:**
```json
{
  "devDependencies": {
    "@wix/astro": "^2.36.0"
  }
}
```
**Why:** The `@wix/astro/builders` module (used in all `extensions.ts` files) requires `@wix/astro` to be installed. Without it, TypeScript cannot resolve the module.

---

## 8. .npmrc — Required for peer dependency resolution

**Files:** `.npmrc` (project root)
**Must include:**
```
legacy-peer-deps=true
```
**Why:** `@wix/astro@2.36.0` declares `react@^18.3.1` as a peer dependency, but Wix CLI apps use React 16. Without this setting, `npm install` fails with ERESOLVE conflicts.

---

## 9. env.d.ts — Must reference vite/client types

**Files:** `src/env.d.ts`
**Wrong:**
```ts
/// <reference types="@wix/cli-app" />
```
**Correct:**
```ts
/// <reference types="@wix/cli-app" />
/// <reference types="vite/client" />
```
**Why:** Without `vite/client` types, TypeScript cannot resolve asset imports like `.png`, `.svg`, `.css` files.

---

## 10. NumberInput.Affix does not exist — Use Input.Affix

**Files:** Any file using `NumberInput` with prefix/suffix
**Wrong:**
```tsx
<NumberInput prefix={<NumberInput.Affix>$</NumberInput.Affix>} />
```
**Correct:**
```tsx
<NumberInput prefix={<Input.Affix>$</Input.Affix>} />
```
**Why:** In the Wix Design System, `Affix` is a sub-component of `Input`, not `NumberInput`. `NumberInput.Affix` does not exist and causes TypeScript errors.

---

## 11. package.json — Must be valid JSON (no trailing commas)

**Files:** `package.json`
**Wrong:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
},
```
**Correct:**
```json
{
  "scripts": {
    "typecheck": "tsc --noEmit"
  }
}
```
**Why:** JSON does not allow trailing commas. A trailing comma after the root closing brace causes `npm install` to fail with EJSONPARSE.

---

## 12. Dashboard page.json — Required for each dashboard page

**Files:** `src/dashboard/pages/page.json`
**Must include:**
```json
{
  "$schema": "https://dev.wix.com/wix-cli/schemas/dashboard-page.json",
  "id": "<UNIQUE-UUID>",
  "title": "<App Title>"
}
```
**Why:** Wix CLI requires a `page.json` alongside each dashboard `page.tsx`. Without it, the dashboard page won't register properly.

---

## 13. App Plans API — Use type assertion for response

**Files:** `src/backend/app-plans.web.ts`
**Wrong:**
```ts
const plans = plansResponse.plans;
```
**Correct:**
```ts
const plans = (plansResponse as any).plans;
```
**Why:** The `ListAppPlansByAppIdResponse` type definition doesn't include `plans` or `currencySymbol` properties. Use `as any` to access them at runtime.

---

## 14. Dashboard Page Title — Don't pass `title` to `<Page.Header>`

**Files:** `src/extensions/dashboard/pages/**/page.tsx`, `src/extensions/dashboard/pages/**/*.tsx`
**Wrong:**
```tsx
<Page.Header
  title="WhatsApp Button"
  subtitle="..."
  actionsBar={...}
/>
```
**Correct:**
```tsx
<Page.Header
  subtitle="..."
  actionsBar={...}
/>
```
**Why:** The page title is already rendered by the Wix dashboard chrome from the extension manifest (`extensions.dashboardPage({ title: 'WhatsApp Button' })` in `*.extension.ts` or `extensions.ts`). When `<Page.Header>` also passes `title`, the title appears **twice** stacked in the dashboard UI. Always omit `title` from `<Page.Header>` and keep `subtitle` + `actionsBar` only. The single source of truth for the page title is the extension manifest.

> Also: `dashboard.setPageTitle('...')` only sets the **browser tab title**, it doesn't render in the page UI — safe to keep.

---

## 14b. One dashboard page — delete `my-page`, don't rename it

**Wrong:** Keeping `src/extensions/dashboard/pages/my-page/` with `title: 'PDF Viewer (legacy stub)'` while also shipping `pages/pdf-viewer/`.

**Correct:** Delete the entire `my-page/` folder when the real page exists. Only one `extensions.dashboardPage` should register.

**Why:** Wix lists every registered dashboard in the Apps sidebar — two entries confuse merchants.

---

## 14c. Pick the right example app — read INDEX, don’t default to Google Drive

**Wrong:** Copying the entire Manage tab from `share-google-drive-content` for every iframe widget, even when the spec requires a **sticky two-column Live Preview** (PDF viewer, calendar, theme/zoom toggles).

**Correct:** Read `examples/INDEX.md` + 1–2 `SUMMARY.md` files. Mix patterns:
- **Dashboard Live Preview (form left, preview right)** → `~/google-calendar/` or `~/age-verification/` layout
- **URL → embed parser, watermark, Connection StatCard** → `share-google-drive-content/` (sections only)
- **Paste API key / OAuth** → `paypal-payment-button/`
- **Password gate** → `password-protected/` only for gate apps

App Factory injects a per-project routing block — follow it.

---

## 15. App Name Renames — Canonicalize, don't write raw `instance.appName`

**Files:** `src/extensions/backend/events/app-installed/app-installed.ts` and any other handler that writes to `app_installations` or `app_reviews`.

**Wrong:**
```ts
await supabase.from('app_installations').upsert({
  instance_id: instanceId,
  app_name: (instance as any)?.appName ?? null,  // raw — captures whatever Wix Dev Center is using TODAY
  ...
});
```

**Correct (defense in depth):**
```ts
const APP_NAME = 'Venmo Pay Button';
await supabase.from('app_installations').upsert({
  instance_id: instanceId,
  app_name: APP_NAME,
  ...
});
```

**Why:** When you rename an app in Wix Dev Center, `getAppInstance().instance.appName` immediately changes for new installations, but **existing rows keep the old name**. Without canonicalization, a single Wix app produces multiple `app_name` values in your database, which then appear as duplicates in dropdowns and split your analytics/charts.

**Architectural fix already in place:** the canonicalization happens at three layers (any one of them is enough; together they're belt-and-braces):

1. **JS side** — `canonicalAppName()` in `purple-wix-connect/server.js` uses the `APP_NAME_ALIASES` map. All `wixApp.name` writes inside the lifecycle webhook handlers go through it.
2. **SQL side** — `public.canonical_app_name()` function + `BEFORE INSERT/UPDATE` triggers on `app_installations` and `app_reviews`. See `sql/canonical-app-name-trigger.sql`. This catches direct writes from any CLI app, even ones bypassing the JS server.
3. **App side** — each CLI app should hardcode its own `APP_NAME` constant rather than reading `instance.appName`. This is the cleanest because it's explicit and self-documenting.

When you rename an app:
- Add the OLD name → NEW name to `APP_NAME_ALIASES` in `server.js`.
- Add the same mapping to the `CASE` block in `sql/canonical-app-name-trigger.sql` and re-run the migration in Supabase.
- Update the per-app `APP_NAME` constant in the CLI app's `app-installed.ts` (and any other place it writes the name).

---

<!-- NEW CORRECTIONS WILL BE APPENDED BELOW THIS LINE -->
