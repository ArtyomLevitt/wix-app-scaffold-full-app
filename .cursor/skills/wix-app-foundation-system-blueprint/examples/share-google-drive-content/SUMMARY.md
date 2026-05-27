# Share Google Drive Content

**App ID:** `<APP_ID>` (original: `6d396a1f-1145-4feb-9531-3b520ab4389e`)
**App Slug:** `gdrive`
**App Namespace:** `@s21797/share-google-drive-content`
**Vertical:** Content / Site Tools
**Stack:** Legacy CLI (no Astro)
**Source path:** `~/Documents/Wix apps Backup/share-google-drive-content/`

## What it does

Renders any Google Drive shareable link as an embedded `<iframe>` on the user's Wix site. Auto-detects content type (Docs / Sheets / Slides / Forms / Drawings / Maps / Folders / Files / PDFs / videos) from the URL and picks the right embed URL format. Adds a "Powered by PURPLE" watermark on free plans (the canonical PRPL freemium pattern).

## Extensions registered

| Extension | Path | Purpose |
|-----------|------|---------|
| Dashboard Page | `src/dashboard/pages/page.tsx` (1187 lines) | 3 tabs: Manage / Plan & Settings / How to Use. Manage tab is mostly a "Test a link" preview. |
| Custom Element Widget | `src/site/widgets/custom-elements/google-drive-viewer/element.tsx` (233 lines) | The site-rendered iframe. Pure react-to-webcomponent. |
| Editor Settings Panel | `src/site/widgets/custom-elements/google-drive-viewer/panel.tsx` (475 lines) | Editor side panel that calls `widget.setProp(...)` for each setting. |
| Element Config | `src/site/widgets/custom-elements/google-drive-viewer/element.json` | Default size, behaviors (links to dashboard page), preset thumbnail. |
| Backend Web Methods | `src/backend/check-premium.web.ts`, `app-plans.web.ts` | See `examples/_shared/`. |
| Backend Events | `src/backend/events/{app-installed,app-removed,plan-changed}/event.ts` | See `examples/_shared/events/`. |

## Key patterns to copy

1. **URL → embed URL transformation table** — Function `parseDriveUrl(url)` regex-matches against 9 Google Drive URL patterns and returns `{ type, id }`. `buildEmbedUrl(info, viewMode)` then maps each type to its embed URL format. **Single source of truth — no scattered regex in the panel and the widget.**
2. **All props are strings** — `reactToWebComponent` only supports string props (DOM attributes are always strings). Booleans pass as `'true'` / `'false'`, numbers as `'600'`. Convert inside the component: `const premium = ispremium === 'true';`.
3. **Editor `widget.getProp` / `widget.setProp`** — The settings panel reads existing values via `widget.getProp(name)` on mount and writes them via `widget.setProp(name, value)`. Use `widget` from `'@wix/editor'`. Both are async.
4. **Premium gating mirrors into a widget prop** — Panel calls `checkPremium()` and then **propagates the result via `widget.setProp('ispremium', String(premium))`** so the widget can hide the watermark instantly without making its own backend call. The widget never calls `checkPremium()` directly — it trusts the prop set by the panel.
5. **Watermark on free plan only** — `{!premium && <div className={styles.watermark}>...</div>}`. Watermark uses a bundled `watermark-logo.png` import. The "Powered by PURPLE" string is hardcoded (not localized — it's a brand mark).
6. **Element JSON behaviors → dashboard link** — `behaviors.dashboard.dashboardPageComponentId` connects a "Manage" button on the editor element to the dashboard page. Get the value from `dashboard/pages/page.json#id`.
7. **`autoAddToSite: true`** — Widget appears on the site automatically on install (no editor drag-and-drop required).
8. **CSS Modules with `element.module.css`** — The widget uses CSS modules (`import styles from './element.module.css'`). Site widgets cannot use the dashboard's `@wix/design-system`, so this is the right styling option.

## localStorage keys

```ts
const REVIEW_SHOWN_KEY = 'gdrive_review_shown_v1';
const ONBOARDING_KEY   = 'gdrive_onboarding_done';
```

## Files in this folder

- `extensions-overview.md` — full file map
- `element.tsx` — verbatim widget (~230 lines, scrubbed)
- `element.json` — widget registration (default sizes, presets, dashboard link)
- `panel-skeleton.tsx` — distilled settings panel showing `widget.getProp`/`setProp` + premium gating + WDS controls (~200 lines from 475)
- `intl-en.json` — full English translations

## When to use as reference

- Any custom-element widget app (iframe embed, video player, calendar, map, social feed)
- Apps where the editor settings panel is the primary configuration UI
- Apps with a watermark / branding element on the free tier
- Apps that auto-detect content type from a URL (parsers + dispatch tables)
