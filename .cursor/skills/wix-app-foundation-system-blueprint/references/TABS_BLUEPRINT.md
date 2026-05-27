# Tabs Blueprint — Manage / Plan & Settings / How to Use

Every PRPL dashboard page ships with these **3 tabs** in this exact order. The IDs are stable strings.

> **Visual spec for every card / typography / icon in this file lives in [DESIGN_SYSTEM.md](DESIGN_SYSTEM.md).** This file owns the **structure** (which cards, in which order, on which tab); DESIGN_SYSTEM.md owns the **look** (sizes, colors, fonts, icon palette). Read both before scaffolding the dashboard.

```ts
type DashboardTab = 'manage' | 'planSettings' | 'howToUse';

const TABS = [
  { id: 'manage',       title: 'Manage' },
  { id: 'planSettings', title: 'Plan & Settings' },
  { id: 'howToUse',     title: 'How to Use' },
] as const;
```

```tsx
<Tabs
  items={TABS}
  activeId={dashboardTab}
  onClick={(t) => setDashboardTab(t.id as DashboardTab)}
/>
```

> **Why 3 tabs, not 4?** Every PRPL app in `examples/` (FBT, Password Protected, Google Drive, Custom Additional Fees, Shipping Address Verifier, Advanced Product File Uploader) combines Plan + Settings into ONE tab. Splitting them is only justified when settings are LARGE (multiple sections, 20+ controls) AND fully independent of the plan tab. **Default is 3.** If you need 4, document why in code.

> **Note on tab IDs:** Older PRPL code used numeric IDs (`0..3`) — newer code uses string IDs for clarity. New apps SHOULD use string IDs. Both work.

---

## Top-of-page (always visible)

These render **above** the tabs, regardless of which tab is active:

1. **Page Header** — `<Page.Header>` with `subtitle` and `actionsBar` (premium badge + Upgrade button). **Do NOT pass `title` to `<Page.Header>`** — Wix dashboard chrome already renders the title from the extension manifest (`extensions.dashboardPage({ title: APP_NAME })`); passing it again duplicates the title visually.
2. **Celebration Banner** (conditional) — green banner shown for ~8s on the first save. See `wix-editor-pick-app/SKILL.md § 1`.
3. **Onboarding Slideshow** (conditional) — replaces the entire dashboard for first-time users until dismissed. See [ONBOARDING.md](ONBOARDING.md).
4. **Stats Overview** (4 cards, `span={3}` each) — only on the **Manage** tab.

---

## Tab 0 — Manage

**Purpose:** Primary work surface. Where the user creates / loads / edits / deletes app configurations.

Order of cards within the Manage tab:

1. **Stats Overview** — **4 cards** (3 if the user is on a premium tier and you drop the Upgrade card), `span={3}` each, equal height. **Use the canonical `StatCard` component** at [`../examples/_shared/StatCard.tsx`](../examples/_shared/StatCard.tsx) and the design tokens in [`DESIGN_SYSTEM.md` § 2](DESIGN_SYSTEM.md#2-stat-card-design-tokens). Do NOT roll your own — every PRPL app uses the same `StatCard` and the same 6-slot color palette (blue / emerald / amber / rose / purple / neutral).
   - **Card 1 — Connection / primary status:** blue gradient + `<Icons.Catalog />` (or app-specific). Value = count or status text.
   - **Card 2 — Current plan:** amber gradient + `<Icons.PremiumFilled />`. `highlight={isPremium}` switches the card to the purple-gradient highlighted state.
   - **Card 3 — Usage metric:** emerald gradient + `<Icons.Statistics />`. Optional `<LinearProgressBar />` showing X / total.
   - **Card 4 — Either** a second app-specific metric (same neutral / blue treatment) **or** the "Upgrade" CTA card (yellow gradient + `<Icons.PremiumFilled />` icon in a saturated amber circle) — show the Upgrade card only when `!isPremium` and drop it (`repeat(3, ...)`) on premium tiers.

2. **Search bar** — show only if items > 3 (`<Search />` from WDS).

3. **Main data table** with skeleton loading rows (NOT `<Loader />`), 10 items per page, status badges (green "Configured" / neutral "Not set"). See `wix-editor-pick-app/SKILL.md § 4`.

4. **Saved Configurations table** with Load + Delete actions. Delete opens a confirmation modal.

5. **Configuration Form** — dynamic title `Configure — {item.name}`. "Clear Selection" in header suffix. Tabs for input methods (e.g. "Paste URLs" / "URL Pattern Generator").

6. **Save Section** — yellow `#FFF8E1` warning banner if at limit. Save button with loading state. Shows "Update" vs "Save" based on existing config.

7. **Configuration Form + Live Preview (two-column, sticky)** — long-scrolling form on the LEFT (`<Cell span={7}>` or `span={6}`), live preview on the RIGHT (`<Cell span={5}>` or `span={6}`). The form is naturally tall (many fields, accordion sections); the preview MUST stick to the top of the viewport as the user scrolls the form so they can see settings update in real time.

   **THREE mandatory pieces** — miss any one and sticky silently breaks OR sticks at the wrong offset:
   1. The root `<Page>` MUST have `height="100vh"`. Without it, scroll happens at the iframe body and `position: sticky` has NO scrolling ancestor to bind to, so it falls back to `relative` (which is exactly what "preview not sticky" looks like).
   2. The `<Tabs>` MUST live in a `<Box marginBottom="24px">` placed DIRECTLY in `Page.Content` (NOT as a `<Cell span={12}>` inside the Layout). If you put the Tabs inside the Layout grid, the Layout's row gap adds visual space ABOVE the sticky pin position, so when the preview pins it appears "a bit lower" than the top of the visible area. Putting Tabs outside the Layout means the Layout starts flush at the top of Page.Content's scroll area and sticky pins exactly at the top.
   3. The right-column `Cell` MUST wrap the preview Card in `<div style={{ position: 'sticky', top: 64 }}>`. The Card alone does NOT stick — sticky needs a containing block ancestor, and `Cell` is implemented as `display: contents` in the WDS grid, so the sticky has to live on a `<div>` between Cell and Card. **Use `top: 64`, NOT `top: 0`** — Wix Dashboard apps run inside an iframe with the Wix chrome header on top (Page.Header + the dashboard's own sticky breadcrumb bar), so a sticky element at `top: 0` gets HIDDEN behind that chrome. `top: 64` clears it. Tune up to `top: 80`–`96` if your `Page.Header` has a tall `actionsBar` or you have additional sticky banners (e.g. `<Notification type="sticky">`); tune down to `top: 48` only if you have NO `actionsBar`.

   Canonical reference: `~/age-verification/src/extensions/dashboard/pages/age-verification/age-verification.tsx` (line 233 `<Page height="100vh">`, lines 282–294 `<Page.Content>` then `<Box marginBottom="24px"><Tabs ... type="compact" /></Box>` BEFORE `<Layout>`, lines 517–521 `<Cell span={6}><div style={{ position: 'sticky', top: 64 }}>`). Also see `examples/password-protected/`. **Note**: the original reference files historically use `top: 0`, but that hides the sticky preview behind the Wix chrome — always emit `top: 64` in new code.

   ```tsx
   <WixDesignSystemProvider features={{ newColorsBranding: true }}>
     <ErrorBoundary>
       <Page height="100vh">{/* ← REQUIRED #1: 100vh makes Page.Content the scrolling ancestor */}
         <Page.Header title="App Name" subtitle="…" />
         <Page.Content>
           {/* REQUIRED #2: Tabs OUTSIDE the Layout, in a Box with marginBottom, type="compact". */}
           <Box marginBottom="24px">
             <Tabs activeId={tab} items={[...]} onClick={(item) => setTab(item.id)} type="compact" />
           </Box>

           <Layout>
             {/* LEFT — form (long, scrollable) */}
             <Cell span={7}>
               <div ref={configFormRef} style={{ height: '100%' }}>
                 <Card stretchVertically>
                   <Card.Header title="Configure your <thing>" subtitle="…" />
                   <Card.Divider />
                   <Card.Content>{/* FormFields / accordion / save button */}</Card.Content>
                 </Card>
               </div>
             </Cell>

             {/* RIGHT — preview (sticks below the Wix chrome while form scrolls) */}
             <Cell span={5}>
               {/* REQUIRED #3: sticky wrapper between Cell and Card. top: 64 clears the dashboard chrome + Page.Header — NOT top: 0. */}
               <div style={{ position: 'sticky', top: 64 }}>
                 <Card stretchVertically>
                   <Card.Header
                     title="Preview"
                     subtitle="Updates as you change settings."
                     suffix={
                       <SegmentedToggle
                         size="small"
                         selected={previewDevice}
                         onClick={(_e, val) => setPreviewDevice(val as 'desktop' | 'mobile')}
                       >
                         <SegmentedToggle.Button value="desktop" prefixIcon={<Icons.Desktop />} />
                         <SegmentedToggle.Button value="mobile" prefixIcon={<Icons.Mobile />} />
                       </SegmentedToggle>
                     }
                   />
                   <Card.Divider />
                   <Card.Content>
                     {loading ? (
                       <Skeleton width="100%" height={340} radius={12} />
                     ) : (
                       <LivePreview settings={settings} device={previewDevice} />
                     )}
                   </Card.Content>
                 </Card>
               </div>
             </Cell>
           </Layout>
         </Page.Content>
       </Page>
     </ErrorBoundary>
   </WixDesignSystemProvider>
   ```

   And `LivePreview` accepts a `device` prop and wraps its outer container in the desktop/mobile responsive wrapper:

   ```tsx
   const LivePreview: FC<{
     settings: WidgetSettings;
     device?: 'desktop' | 'mobile';
   }> = ({ settings, device = 'desktop' }) => (
     <div style={{
       maxWidth: device === 'mobile' ? 375 : 'none',
       margin: device === 'mobile' ? '0 auto' : undefined,
       transition: 'max-width 0.3s ease',
       /* existing preview chrome */
     }}>
       {/* preview body */}
     </div>
   );
   ```

   Constraints:
   - **`<Page height="100vh">` is non-negotiable.** Without it, sticky DOES NOT WORK regardless of the wrapper. #1 cause of "I added position:sticky and it still scrolls away".
   - **Tabs MUST be outside the Layout grid** in a `<Box marginBottom="24px">` block. Tabs inside `<Cell span={12}>` cause the visible top of the pinned preview to sit "a bit lower" than the viewport top.
   - **NEVER omit the `<div style={{ position: 'sticky', top: 64 }}>` wrapper** on the right Cell. The Card alone does not stick.
   - **NEVER wrap any ancestor of the sticky element in `overflow: hidden` / `overflow: auto`** — sticky silently falls back to `relative`.
   - **Use `top: 64`, NOT `top: 0`** — the Wix Dashboard chrome (its own breadcrumb header) + your `Page.Header` together occupy ~56-80px at the top of the iframe. A sticky element at `top: 0` gets HIDDEN behind that chrome. `top: 64` is a safe default that clears typical Page.Header + actionsBar; bump to `top: 80` if you have a tall actionsBar or sticky `<Notification>`.
   - The **desktop/mobile switcher is mandatory** on every preview card. Add a `previewDevice` `useState<'desktop' | 'mobile'>('desktop')` in the parent component, render the `SegmentedToggle` in the Card.Header `suffix`, and pass `device={previewDevice}` to the preview component which wraps its body in `<div style={{ maxWidth: device === 'mobile' ? 375 : 'none', margin: device === 'mobile' ? '0 auto' : undefined, transition: 'max-width 0.3s ease' }}>`. Icons: `Icons.Desktop` and `Icons.Mobile`.
   - The LEFT form's outer `<div>` should use `style={{ height: '100%' }}` and the Card should use `stretchVertically`.

8. **Live Preview body — realistic, view-aware, settings-reactive.** A generic 4×7 grid of grey numbered boxes with one repeating "Event" label looks like a placeholder and gives admins zero confidence the settings they're toggling actually do anything. The preview body MUST do four things:

   **(a) Look like the real product.** For a calendar app: weekday header row (`S M T W T F S`), a 6-week month matrix with leading/trailing days from adjacent months dimmed to ~45% opacity, the current date highlighted with a colored circle (filled with `primaryColor`, white text, 700 weight), and 4–6 realistic mock events with TIME prefixes (`9:00 Standup`, `12:00 Lunch`) and varying brand-friendly accent colors (NOT all `primaryColor` — use a 5-color palette like `[primary, '#1B998B', '#F4A261', '#9B5DE5', '#E63946']` so different event types are visually distinct). For other domains, mirror the same level of fidelity: a product card preview shows actual product image + title + price; a chat widget preview shows real-looking messages with timestamps; a form preview shows actual labeled inputs.

   **(b) Honor `settings.view` (or analogous discriminator).** A `view: 'month' | 'week' | 'agenda'` setting MUST render three visually distinct layouts — admins will toggle between them in 2 seconds and expect to see the preview change. Render the appropriate sub-component (`<PreviewMonth>`, `<PreviewWeek>`, `<PreviewAgenda>`). The same principle applies to any enum-style setting that visually reshapes the widget (`layout: 'grid' | 'list' | 'masonry'`, `style: 'minimal' | 'card' | 'banner'`, etc.).

   **(c) Honor `settings.mobileListView` when `device === 'mobile'`.** Many widgets ship a phone-specific layout (vertical list with date headers, swipeable card stack, etc.). When the preview is in mobile mode AND a `mobileListView`-style setting is enabled, render that mobile layout — do NOT just narrow the desktop grid into a 375px column. In mobile mode also swap the outer frame: 320px width, 22px border-radius, 8px dark border to mimic a phone bezel, and a soft shadow. This makes the device-switcher feel meaningful instead of cosmetic.

   **(d) Visually realize style enums.** Settings like `headerStyle: 'standard' | 'minimal' | 'bold'` or `eventChipStyle: 'flat' | 'rounded' | 'gradient'` MUST produce visibly different output. The pattern:

   ```tsx
   const PreviewHeader: FC<{ settings: WidgetSettings; ... }> = ({ settings, ... }) => {
     if (settings.headerStyle === 'minimal') return <div style={{ background: '#fff', borderBottom: `2px solid ${primary}`, ... }}>...</div>;
     if (settings.headerStyle === 'bold') return <div style={{ background: `linear-gradient(135deg, ${primary}, ${shadeHex(primary, -25)})`, ... }}>...</div>;
     return <div style={{ background: primary, color: '#fff', ... }}>...</div>; // standard
   };
   ```

   Use a `shadeHex(hex, percent)` helper (lighten/darken by parsing the hex, mixing with white/black, re-stringifying) to derive secondary brand colors for gradients and borders WITHOUT hardcoding additional palette values. If you ship an `eventChipStyle` setting, vary `borderRadius` (`flat: 2px`, `rounded: 6px`, `gradient: 6px + boxShadow + linear-gradient`) so the visual difference is obvious in the preview.

   **Other production requirements:**

   - **Smooth view transitions.** When `settings.view` or `device` changes, wrap the swapped sub-component in a `<div key={transitionKey} style={{ animation: 'gc-preview-fade 0.25s ease-out' }}>` so it fades in instead of snapping. Inject a one-time `<style>{`@keyframes <slug>-preview-fade { from { opacity: 0; transform: translateY(2px); } to { opacity: 1; transform: translateY(0); } }`}</style>` at the bottom of the preview component.
   - **Subtle metadata strip** at the bottom — when `settings.timezoneMode === 'fixed'` show `TZ · <timezone>` on the left, and on free plans show `Powered by <APP_NAME>` on the right. Use 10px text in `#9CA3AF` on a 4px-padding strip with a top border. This gives the timezone picker AND the premium-gating affordance visible confirmation in the preview.
   - **Resolved height** — clamp `settings.height` to `Math.max(320, Math.min(settings.height, 540))` on desktop and `Math.max(420, Math.min(settings.height, 560))` on mobile so an admin entering `height: 10000` doesn't blow up the preview Card.
   - **Resolved width** — desktop respects `widthUnit + widthValue` (e.g., `100%` or `400px`); mobile uses a fixed 320px frame width (the phone bezel) regardless of `widthValue`. Show the resolved value in the "Live preview" label suffix: `Desktop · 100%` or `Mobile · 375px`.
   - **`useMemo` for mock events.** `const events = useMemo(() => buildMockEvents(safePrimary), [safePrimary]);` — without memoization the events array re-builds on every keystroke in the form, which can cause noticeable jank on slower laptops with heavy view sub-components.
   - **Color palette safety.** When parsing user-entered hex (`primaryColor`), default to `'#3B6AEA'` if empty. Build the `shadeHex` helper to handle both `#abc` (3-char) and `#aabbcc` (6-char) forms, otherwise the gradient header crashes if an admin types `#fff`.
   - Canonical reference: `~/google-calendar/src/extensions/dashboard/pages/google-calendar/google-calendar.tsx` — see `LivePreview`, `PreviewMonth`, `PreviewWeek`, `PreviewAgenda`, `PreviewMobileList`, `PreviewHeader`, `EventChip`, `shadeHex`, `buildMockEvents`, `buildMonthMatrix`.

5. **Save action group — REQUIRED bottom row of the Manage tab config form.** Every config form ends with the canonical FULLY-JOINED 3-button row: `[ Save | View Editor | Live Site ]`, with a "Last saved <relative-time> ✓" status indicator placed to the LEFT of Save (NEVER between the buttons). All three buttons fuse into ONE segmented control via `gap="0px"` on the container + per-button border-radius overrides. Save keeps default (primary/filled) skin to preserve hierarchy; View Editor + Live Site use `priority="secondary"` (outlined). Admins need a one-click jump to the Wix Editor (to drop the widget on a page) and to the published site (to verify the widget renders live) without leaving the dashboard. The "Last saved" indicator gives them persistent confidence the save actually stuck — toast notifications disappear in 3 seconds, this indicator survives page reloads.

   Wire-up:
   - Add `siteId` + `siteUrl` to component state: `const [siteId, setSiteId] = useState<string>('')` and `const [siteUrl, setSiteUrl] = useState<string>('')`.
   - Populate both from `checkPremium()` — the canonical `check-premium.web.ts` returns `metaSiteId` AND `siteUrl`. Inside the load `useEffect`: `if (p.metaSiteId) setSiteId(p.metaSiteId); if (p.siteUrl) setSiteUrl(p.siteUrl);`.
   - Add `` LS_LAST_SAVED = `${APP_SLUG}_last_saved_at` `` constant to `_shared/app-config.ts` alongside `LS_ONBOARDING` / `LS_REVIEW`, then import it in the dashboard page.
   - Add `lastSavedAt` state (seeded from localStorage so it survives page reloads) and a `setNowTick` hook so the relative time updates every 30s:
     ```tsx
     const [lastSavedAt, setLastSavedAt] = useState<number | null>(() => {
       try {
         const raw = localStorage.getItem(LS_LAST_SAVED);
         const n = raw ? parseInt(raw, 10) : NaN;
         return Number.isFinite(n) && n > 0 ? n : null;
       } catch { return null; }
     });
     const [, setNowTick] = useState(0);

     useEffect(() => {
       if (lastSavedAt === null) return;
       const id = setInterval(() => setNowTick((n) => n + 1), 30_000);
       return () => clearInterval(id);
     }, [lastSavedAt]);

     const formatLastSaved = useCallback((ts: number): string => {
       const d = Math.floor((Date.now() - ts) / 1000);
       if (d < 10) return 'just now';
       if (d < 60) return `${d}s ago`;
       const m = Math.floor(d / 60);
       if (m < 60) return `${m}m ago`;
       const h = Math.floor(m / 60);
       if (h < 24) return `${h}h ago`;
       return `${Math.floor(h / 24)}d ago`;
     }, []);
     ```
   - On successful save, persist + update state:
     ```tsx
     const now = Date.now();
     setLastSavedAt(now);
     try { localStorage.setItem(LS_LAST_SAVED, String(now)); } catch { /* ignore */ }
     ```
   - Import `Tooltip` from `@wix/design-system`.

   ```tsx
   <Box direction="horizontal" align="right" gap="0px" verticalAlign="middle" marginTop="12px">
     <Box direction="horizontal" marginRight="12px" verticalAlign="middle" gap="6px">
       {saving ? (
         <>
           <Loader size="tiny" />
           <Text size="tiny" secondary>{'Saving…'}</Text>
         </>
       ) : lastSavedAt ? (
         <>
           <Icons.StatusComplete style={{ width: 14, height: 14, color: '#27AE60' }} />
           <Text size="tiny" secondary>Last saved {formatLastSaved(lastSavedAt)}</Text>
         </>
       ) : null}
     </Box>
     <Button
       onClick={handleSave}
       disabled={saving}
       prefixIcon={<Icons.Confirm />}
       style={{ borderTopRightRadius: 0, borderBottomRightRadius: 0 }}
     >
       {saving ? 'Saving…' : hasSaved ? 'Update' : 'Save'}
     </Button>
     <Button
       priority="secondary"
       prefixIcon={<Icons.ExternalLinkSmall />}
       as="a"
       href={siteId ? `https://manage.wix.com/editor/${siteId}` : undefined}
       target="_blank"
       disabled={!siteId}
       style={{ borderRadius: 0, borderRight: '1px solid #dfe1e5' }}
     >
       View Editor
     </Button>
     <Tooltip content={<span>{siteUrl ? 'Open your published site in a new tab.' : 'Publish your site to see the widget live.'}</span>}>
       <div>
         <Button
           priority="secondary"
           prefixIcon={<Icons.Globe />}
           as="a"
           href={siteUrl || undefined}
           target="_blank"
           disabled={!siteUrl}
           style={{ borderTopLeftRadius: 0, borderBottomLeftRadius: 0 }}
         >
           View Live Site
         </Button>
       </div>
     </Tooltip>
   </Box>
   ```

   Constraints:
   - **All three buttons share ONE `<Box>` with `gap="0px"`** — they MUST touch and fuse. Do NOT wrap the view pair in its own inner `<Box>`; keep all three siblings in the outer container.
   - **Border-radius per button**: Save → kill right radius; View Editor → `borderRadius: 0` + right border; Live Site → kill left radius. This produces the segmented-control look.
   - **Tooltip MUST wrap a `<div>`, not the `<Button>` directly** — Tooltip can't bind to a disabled button, the tooltip silently disappears.
   - **The "Last saved" status `<Box>` goes BEFORE Save** with its own `marginRight: 12px` — NEVER between Save and the view pair, otherwise the visual fusion breaks.
   - **NEVER write `Saving\u2026` as raw JSX text** between tags — JSX renders raw text literally and the backslash escape becomes visible. Wrap in a string expression: `{'Saving\u2026'}`.
   - **Seed `lastSavedAt` from localStorage AND persist on save** — without rehydration the indicator disappears on every page reload even though the data is still saved server-side.
   - **30s setInterval tick is required** — without it the "Last saved 2m ago" text freezes at the original save moment and never updates.
   - **Never ship Manage tab Save without the view pair OR without the Last saved indicator** — admins lose the "edit → preview live" loop and the persistent save-confirmation UX.
   - Canonical reference: `~/google-calendar/src/extensions/dashboard/pages/google-calendar/google-calendar.tsx`.

6. **Preview empty state — REQUIRED min-height wrapper.** When the Live Preview Card has nothing to render (user hasn't entered the required input yet — calendar ID, API key, feed URL, etc.), do NOT let `<EmptyState>` collapse to its natural ~120px height. A short empty state inside a tall sticky Card leaves a huge whitespace gap below it that looks like a layout bug. Wrap it in a min-height container so the empty state's footprint matches a populated preview:

   ```tsx
   {settings.calendarId ? (
     <LivePreview settings={settings} device={previewDevice} />
   ) : (
     <div
       style={{
         minHeight: 480,
         display: 'flex',
         alignItems: 'center',
         justifyContent: 'center',
         width: '100%',
       }}
     >
       <EmptyState
         theme="page-no-border"
         title="No calendar yet"
         subtitle="Add a Google Calendar ID on the left to see your live preview."
       />
     </div>
   )}
   ```

   Constraints:
   - **`minHeight: 480` is the canonical default** — matches the typical populated preview height. Tune to 360–600 only if the populated preview is unusually short/tall.
   - **NEVER render `<EmptyState>` directly inside `Card.Content`** without the wrapper — the empty state will collapse to ~120px while the sticky Card stays full-height, creating a giant whitespace gap below.

---

## Tab 1 — Plan & Settings (combined)

**Purpose:** Show pricing tiers + per-app settings in one scrollable tab. Top half is "Plan", bottom half is "Settings", separated by a `<Divider />`.

> If you split into separate tabs (Plan and Settings), use IDs `'plan'` and `'settings'`. Default is the combined version.

### Plan section — top half

Reads from `/api/app/plans` (Astro) or `getAppPlans()` (legacy CLI).

> **REQUIRED fallback:** `getAppPlans()` returns `[]` until the developer publishes paid tiers in the Wix Dev Center — almost always the case during foundation setup. Always render a `buildFallbackPlans(currencySymbol)` array (Free + Premium with reasonable benefits) when the API returns empty, so this tab is NEVER blank. NEVER show `<EmptyState title="Plans loading" />` here — that ships as the final visible state for every unpublished app.

```ts
interface PricingTier {
  name: string;
  monthlyPrice: string;
  yearlyPrice: string | null;
  features: string[];
  popular: boolean;
}

function buildFallbackPlans(sym = '$'): PricingTier[] {
  return [
    {
      name: 'Free',
      monthlyPrice: `${sym}0`,
      yearlyPrice: null,
      features: [
        '<App> widget',
        'Default colors and fonts',
        'Mobile-friendly layout',
        'Basic settings only',
      ],
      popular: false,
    },
    {
      name: 'Premium',
      monthlyPrice: `${sym}3.99`,
      yearlyPrice: `${sym}${(3.99 * 10).toFixed(2)}`,
      features: [
        'Everything in Free',
        'Custom colors & branding',
        'No watermark',
        'Priority support',
      ],
      popular: true,
    },
  ];
}

// In the page component:
useEffect(() => {
  getAppPlans()
    .then((response) => {
      const sym = response.currencySymbol || '$';
      const fromApi = response.plans.map(p => apiPlanToTier(p, sym));
      setPricingTiers(fromApi.length > 0 ? fromApi : buildFallbackPlans(sym));
    })
    .catch(() => setPricingTiers(buildFallbackPlans('$')))
    .finally(() => setPlansLoading(false));
}, []);
```

Adjust feature copy + the Premium price to fit your app. Keep the same shape so the tier-card renderer doesn't need to know whether the data came from the API or the fallback.

Order of cards:

1. **Pricing Tiers Card** — 4 tiers in a flex row (Free, Starter, Standard, Advanced — or whatever the Dev Center returns). Each tier:
   - Tier name
   - Price (monthly + yearly toggle)
   - Item-limit badge
   - Feature list (✓ / ✗)
   - CTA button: "Current Plan" (disabled) / "Get [Plan Name]"
   - Badges: "MOST POPULAR" (green) on Standard, "CURRENT PLAN" (blue) on the active plan
   - Match active plan by **`packageName`** (case-insensitive) from `getAppInstance()`, NOT by `id`

2. **Plan FAQ** (optional, small accordion) — common billing questions.

> "Help / Support" does NOT belong here. It goes in the **How to Use tab only** — duplicating it across tabs is noise. If a user needs support they switch tabs once.
>
> "More Apps by Us" does NOT belong here either. It goes in the **Manage tab only** (see [MORE_APPS.md](MORE_APPS.md)).

---

### Settings section — bottom half

**Purpose:** Per-app preferences. Defaults that propagate to the widget / embedded script.

Render BELOW the Plan section, separated by a `<Divider />`. Same scroll surface, no tab switch.

Always include these sections in this order, with section icons. See `wix-editor-pick-app/SKILL.md § Settings Panel Structure` for the toggle layout pattern.

1. **Tip banner** (blue `#EDF3FF`) — "Configure in Dashboard for best experience" + "Open Dashboard" button. Only shown in the editor settings panel; in the dashboard tab, replace with a regular intro Card.
2. **Upgrade banner** (yellow `#FFF8E1`) — for free / cancelled users; click → scrolls to Plan tab.
3. **CONNECTION** section (`<Icons.Globe />`) — primary input + connection status badge.
4. **MANUAL OVERRIDE** section (`<Icons.Replace />`) — image URLs / data overrides with count badges.
5. **BEHAVIOR** section (`<Icons.Refresh />`) — toggle rows with subtitle descriptions; speed as range slider (NOT NumberInput).
6. **APPEARANCE** section (`<Icons.ColorDrop />`) — color picker with Reset, transparent BG toggle.
7. **Help footer** — link to `apps-support@prpl.io`.

Toggle layout pattern:
```tsx
<Box direction="horizontal" verticalAlign="middle">
  <Box flex="1">
    <Text size="small">Auto-Rotate</Text>
    <Text size="tiny" secondary>Spin automatically on load</Text>
  </Box>
  <ToggleSwitch checked={value} onChange={handler} size="small" />
</Box>
```

Save button at the bottom, with `<Loader size="tiny" />` prefix while saving. "Update" vs "Save" label based on existing config.

---

## Tab 2 — How to Use

**Purpose:** Documentation, tutorial, FAQ.

Order of cards (from top):

1. **Interactive Guide** (optional) — GuideJar iframe; loaded via the `wix-cli-howto-faq` skill. **Critical**: `zIndex: 0` on the iframe wrapper, NEVER `99999`.

2. **FAQ Accordion** (optional) — `<Accordion multiple size="small" items={...} />`. Translation keys via `t("faq.qN")` and `t("faq.aN")`.

3. **How to Use steps** (always) — **FULL WIDTH `<Cell span={12}>`** card. Each step is a row with a circular blue icon container (40×40, `#EDF3FF` background, `#3B6AEA` icon color) + bold title + secondary description. NOT a numbered "1 2 3" list — those look like ugly footnotes on a wide card. Pick a meaningful icon per step (e.g. `Icons.Date` for "make calendar public", `Icons.Link` for "copy ID", `Icons.Settings` for "paste in Manage tab", `Icons.Add` for "add to site"). Add a soft blue tip box (`#E8F0FE` bg, `#C2D7FE` border) at the bottom of the steps card for the "editor preview tip".

   ```tsx
   <Cell span={12}>
     <Card>
       <Card.Header title="How to Use" subtitle="…" />
       <Card.Divider />
       <Card.Content>
         <Box direction="vertical" gap="20px">
           {steps.map((step, i) => (
             <Box key={i} direction="horizontal" gap="16px" verticalAlign="top">
               <div style={{ width: 40, height: 40, borderRadius: "50%",
                             backgroundColor: "#EDF3FF", color: "#3B6AEA",
                             display: "flex", alignItems: "center",
                             justifyContent: "center", flexShrink: 0 }}>
                 {step.icon}
               </div>
               <Box direction="vertical" gap="4px">
                 <Text size="small" weight="bold">{step.title}</Text>
                 <Text size="small" secondary>{step.desc}</Text>
               </Box>
             </Box>
           ))}
         </Box>
       </Card.Content>
     </Card>
   </Cell>
   ```

4. **Tips + Domain card (side-by-side)** (always) — two **`<Cell span={6}>`** cards. Both must use `stretchVertically` so heights match.
   - **Left — "Tips"** — colored pill rows. Each tip is `<div>` with a soft pastel background (`#EDF3FF`, `#FFF8E1`, `#F3E8FD`, `#E8F5E9`) + a 28×28 white circle holding a 16×16 colored icon + secondary text.
   - **Right — Domain card** — pick a name that fits the app, NOT "Tips" again. Examples: "Calendar views" for a calendar app, "Supported file types" for a file app, "Form field types" for a forms app, "Review sources" for a reviews app. Render a 2-column CSS grid (`gridTemplateColumns: 'repeat(2, 1fr)'`) of small cards: 1px border, white-ish bg (`#fafbfc`), 32×32 tinted icon box, bold small title + tiny secondary description.

   This pairing makes the tab feel content-rich and balanced. **NEVER** use the old 8/4 split with a numbered text list — it looks like a debug screen.

5. **Help / Support** — `<Icons.ChatFilled />` + email button to `apps-support@prpl.io`. Full width `<Cell span={12}>`.

   **DO NOT** put "More Apps by Us" in this tab. It belongs ONLY in the Manage tab (see [MORE_APPS.md](MORE_APPS.md)).

---

## Help & Support card (How to Use tab ONLY)

Layout spec lives in [DESIGN_SYSTEM.md § 4 "Help / Support card"](DESIGN_SYSTEM.md#help--support-card). Render exactly ONCE, in the **How to Use** tab. Do NOT also render it in the Plan & Settings or Manage tab — three copies of the same support card across tabs looks like padding and pushes real content below the fold.

---

## State boundaries between tabs

- All state is hoisted to the page-level component, NOT to individual tabs.
- Tabs are render-only switches; the data is fetched once on mount.
- `setActiveTab` should also call `dashboard.setPageTitle(`${APP_NAME} — ${TABS[id].title}`)` for browser tab clarity.
- `LinearProgressBar` skin: `'success' | 'warning' | 'standard' | 'premium' | 'neutral'` — there is NO `'error'`.
- `Badge` skin array: cast as `as 'neutral' | 'standard' | 'success' | 'premium'` to avoid `as const` issues.

---

## Tab navigation requirements

- Onboarding "Configure Your First Product" button → set `activeTab = 0` and scroll to the configuration form.
- Onboarding "Try a Demo" button → set `activeTab = 0` and scroll to the live preview.
- "Limit reached" / "Upgrade" buttons anywhere → set `activeTab = 1` and scroll to top of pricing tiers.
- Settings panel "Open Dashboard" button → `dashboard.navigate(...)` to the dashboard page with `?tab=2`.

---

## Localization keys (canonical)

Every PRPL app's `src/intl/messages/*.json` must include at minimum:

```
tabs.manage          → "Manage"
tabs.plan            → "Plan"
tabs.settings        → "Settings"
tabs.howToUse        → "How to Use"

page.title           → APP_NAME
page.subtitle        → APP_TAGLINE

upgrade.cta          → "Upgrade"
upgrade.banner       → "Upgrade to unlock more configurations"

save.create          → "Save"
save.update          → "Update"
save.saving          → "Saving…"

celebration.title    → "🎉 First config saved!"
celebration.subtitle → "Your widget is live."

onboarding.slide1.title    → ...
onboarding.slide1.subtitle → ...
onboarding.cta.start       → "Get Started"
onboarding.cta.skip        → "Skip to Dashboard"

guide.title       → "Interactive Guide"
guide.subtitle    → "Follow along step by step"
faq.title         → "Frequently Asked Questions"

support.title     → "Need Help?"
support.subtitle  → "Our team replies within 24h."

moreApps.title    → "More Apps by Us"
moreApps.cta      → "Get App"
moreApps.explore  → "Explore more apps"
moreApps.poweredBy → "POWERED BY"
```
