# Design System — Visual Language for PRPL Dashboards

The look and feel of every PRPL dashboard is fixed. This file is the **single source of truth** for typography, stat cards, "More Apps by Us" cards, the "POWERED BY" footer, and card chrome. Any agent scaffolding a new PRPL app **must** read this file before writing dashboard JSX.

Cross-verified against the production source of: `paypal-payment-button`, `stripe-payment-button`, `cashapp-payment-button`, `square-payment-button`, `donation-payment-button`, `venmo-payment-button`, `instagram-feed`, `whatsapp-button`. **Identical patterns across all of them — copy verbatim.**

---

## ❌ ANTI-PATTERNS (DO NOT DO)

| ❌ WRONG | ✅ CORRECT |
|---------|-----------|
| Use a `<div>` with raw `font-family` / `font-size` / `font-weight` for dashboard text | Use `<Text>` / `<Heading>` / `<Badge>` from `@wix/design-system` — typography tokens are baked in |
| Pick arbitrary stat-card icon colors | Use the **6-slot palette** below (blue / emerald / amber / rose / purple / neutral). Pairs each background gradient with its matching icon foreground. |
| Inline base64 the More-Apps icons or the purple logo | Import as bundler assets (`import x from '../assets/x.png'`) — paths get hashed for cache-busting |
| Use `<Card.Header title="More apps by us" />` | Use `<Card.Content>` with an inner `<Text size="medium" weight="bold">` — production apps **never** put a Card.Header on this card |
| Forget the `?referral=developer&referralTag=purple&referralSectionName=developer-page` query string on More-Apps URLs | Always include — this is the PRPL affiliate-tracking convention |
| Render "POWERED BY" as `<Text>POWERED BY</Text>` | Render as `<Text size="tiny" secondary style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}>Powered by</Text>` and translate the string |
| Use a 40px / 60px icon circle on stat cards | Always **52×52** circular, `borderRadius: '50%'` |
| Use a CSS framework / Tailwind / styled-components for dashboard | Inline `style={{...}}` for the few non-WDS primitives (stat-card chrome, More-Apps cards). The dashboard is small enough that inline styles + WDS is faster than a CSS pipeline. |

---

## 1. Typography

### Dashboard typography goes through WDS

Every piece of text in a dashboard page MUST be rendered with `@wix/design-system` primitives. **Never** style raw HTML elements with `font-*` properties for dashboard copy.

```tsx
import { Text, Heading, Badge } from '@wix/design-system';
```

| Use case | Component | Props |
|----------|-----------|-------|
| Page title | **Do NOT pass `title` to `<Page.Header>`** — Wix dashboard chrome already renders the title from the extension manifest (`extensions.dashboardPage({ title: APP_NAME })`). Passing it again causes the title to render twice. Use `<Page.Header subtitle="…" actionsBar={…} />` only. |
| Section title in a Card | `<Text size="medium" weight="bold">` | `medium` = 16px |
| Stat-card label (above value) | `<Text size="small" weight="bold" secondary>` | `small` = 14px, secondary = muted color |
| Stat-card value (the number) | `<Text size="medium" weight="bold">` | larger numbers can override `style={{ fontSize: 28, lineHeight: '1.1' }}` |
| Card subtitle / description | `<Text size="tiny" secondary>` | `tiny` = 12px |
| Microcopy / footer / disclaimer | `<Text size="tiny" secondary>` | — |
| Code / token / credential preview | `<Text size="medium" weight="bold" style={{ fontFamily: MONOSPACE_STACK, letterSpacing: '0.5px' }}>` | only for monospace contexts (see § Monospace) |
| Uppercase tiny labels ("POWERED BY", "SAVED CLIENT ID") | `<Text size="tiny" secondary weight="bold" style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}>` | `letterSpacing: '0.4px'` for shorter labels |
| Status pill | `<Badge size="tiny" skin="...">` | skin: `neutralStandard` / `neutralSuccess` / `standard` / `success` / `warning` / `danger` / `premium` |
| Premium badge | `<Badge size="medium" skin="premium" prefixIcon={<Icons.PremiumFilled />}>` | always with the icon |

### Font stacks

Three stacks exist in PRPL apps. Pick by context:

```ts
// 1. DASHBOARD — never touch. WDS provides this via Text/Heading.
//    For shadow-DOM popups (rate-popup.ts), fall back explicitly:
const DASHBOARD_STACK = 'var(--wix-font-family, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif)';

// 2. SITE WIDGET — widgets cannot use WDS, so they declare their own stack.
//    Match the live-site feel.
const WIDGET_STACK = '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif';

// 3. MONOSPACE — credential previews, tokens, code snippets.
const MONOSPACE_STACK = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, 'Liberation Mono', 'Courier New', monospace";
```

> **Rule:** dashboard JSX never imports Google Fonts, never declares `font-family` outside of these 3 cases. WDS handles the rest.

### Letter-spacing conventions

| Context | Value |
|---------|-------|
| `POWERED BY` footer text | `letterSpacing: '1.2px'` + `textTransform: 'uppercase'` |
| Tiny uppercase labels (`SAVED CLIENT ID`, `CONNECTED`) | `letterSpacing: '0.4px'` + `textTransform: 'uppercase'` |
| Monospace credential previews | `letterSpacing: '0.5px'` |
| Stat-card label / value | default (no letter-spacing) |

---

## 2. Stat-card design tokens

The 4-card "Stats Overview" row on the Manage tab follows a strict visual contract.

### Card chrome

```ts
// All stat cards share this base. Mutate per highlight state.
const cardBase: React.CSSProperties = {
  borderRadius: 12,
  background: '#fff',
  border: '1px solid #E4E6EB',
  padding: '20px',
  height: '100%',
  boxSizing: 'border-box',
  boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
};
```

### Highlighted card (current plan / premium / "upgrade" CTA)

When `highlight={true}`:

```ts
{
  ...cardBase,
  background: 'linear-gradient(135deg, #F3E8FF 0%, #EDE7F6 100%)',   // soft purple
  border: '1px solid #D1C4E9',
  boxShadow: '0 2px 12px rgba(107,33,168,0.08)',
}
```

### Icon circle

```ts
const iconWrap = (bg: string): React.CSSProperties => ({
  width: 52,
  height: 52,
  borderRadius: '50%',
  background: bg,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
});
```

### Color palette — pair the gradient with its matching foreground icon color

| Slot | Background gradient | Icon color | When to use |
|------|--------------------|-----------|--------------|
| **Blue** | `linear-gradient(135deg, #DBEAFE, #C3D9F7)` _or_ `linear-gradient(135deg, #E3F2FD, #BBDEFB)` | `#0070BA` / `#1565C0` / `#3B6AEA` | Connection / configuration / count metrics. **Default if unsure.** |
| **Emerald** | `linear-gradient(135deg, #D1FAE5, #A7F3D0)` _or_ `linear-gradient(135deg, #E8F5E9, #C8E6C9)` | `#047857` / `#2E7D32` | Success states, totals, "this month" growth metrics |
| **Amber** | `linear-gradient(135deg, #FEF3C7, #FDE68A)` | `#A16207` | Current plan tile (free / starter), warnings |
| **Rose / Accent** | `linear-gradient(135deg, #FFEEF4, #FFE0E6)` | `#E1306C` | Brand-accent tiles (Instagram → pink, Stripe → indigo, etc.) |
| **Purple (premium)** | `linear-gradient(135deg, #9C27B0, #7B1FA2)` (solid gradient, white icon) | `#fff` | Premium plan highlight tile |
| **Upgrade (CTA)** | bg `linear-gradient(135deg, #FFF8E1 0%, #FFF3E0 100%)` + border `#FFE082` + shadow `0 2px 8px rgba(245,166,35,0.1)`; icon-circle `linear-gradient(135deg, #FFB300, #F5A623)` + white icon | `#fff` | The 4th card on free plans — "Upgrade to remove watermark" |
| **Neutral** | `#F0F4F7` (solid) | `#74788D` | Loading / disabled states |

### Icon size inside the circle

Always **24px**:

```tsx
<Icons.CreditCard size="24px" style={{ color: '#0070BA' }} />
```

Some apps use the default size without `size="24px"` and let the SVG fill — both work, but the explicit 24px keeps every stat card pixel-perfect identical.

### Layout inside the card

```tsx
<Box direction="vertical" gap="8px" align="center">
  <div style={iconWrap(BG_GRADIENT)}>{icon}</div>
  <Text size="small" weight="bold" secondary>{label}</Text>
  <Text size="medium" weight="bold">{value}</Text>
  {badge && <Badge size="tiny" skin="...">{badge.text}</Badge>}
</Box>
```

Vertical, centered, 8px gap. **Always 4 cards** in the row, distributed via `<Cell span={3}>` (12-col grid) or CSS Grid `repeat(4, minmax(0, 1fr))`.

When the user is on a premium plan and you drop the Upgrade card, the layout collapses to 3 cards: `repeat(3, minmax(0, 1fr))`.

### Canonical `StatCard.tsx` component

Drop this verbatim into `src/extensions/dashboard/pages/<page>/components/StatCard.tsx` (Astro layout) or `src/dashboard/pages/_shared/StatCard.tsx` (legacy CLI). A copy also lives bundled at [`examples/_shared/StatCard.tsx`](../examples/_shared/StatCard.tsx).

```tsx
import { type FC, type ReactNode } from 'react';
import { Badge, Box, Loader, Text } from '@wix/design-system';

interface StatCardProps {
  iconBg?: string;
  iconColor?: string;
  icon: ReactNode;
  label: string;
  value?: ReactNode;
  badge?: {
    text: string;
    skin?: 'neutralSuccess' | 'neutralStandard' | 'standard' | 'warning' |
           'success' | 'danger' | 'neutral' | 'premium';
  };
  loading?: boolean;
  highlight?: boolean;
}

export const StatCard: FC<StatCardProps> = ({
  iconBg = '#EDF3FF',
  iconColor = '#3B6AEA',
  icon,
  label,
  value,
  badge,
  loading,
  highlight,
}) => (
  <div
    style={{
      borderRadius: 12,
      background: highlight
        ? 'linear-gradient(135deg, #F3E8FF 0%, #EDE7F6 100%)'
        : '#fff',
      border: highlight ? '1px solid #D1C4E9' : '1px solid #E4E6EB',
      padding: '20px',
      height: '100%',
      boxSizing: 'border-box',
      boxShadow: highlight
        ? '0 2px 12px rgba(107,33,168,0.08)'
        : '0 1px 3px rgba(0,0,0,0.06)',
    }}
  >
    <Box direction="vertical" gap="8px" align="center">
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: '50%',
          background: iconBg,
          color: iconColor,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <Text size="small" weight="bold" secondary>
        {label}
      </Text>
      {loading ? (
        <Loader size="tiny" />
      ) : value !== undefined ? (
        typeof value === 'string' || typeof value === 'number' ? (
          <Text size="medium" weight="bold">{value}</Text>
        ) : (
          value
        )
      ) : null}
      {badge && (
        <Badge size="tiny" skin={badge.skin ?? 'neutralStandard'}>
          {badge.text}
        </Badge>
      )}
    </Box>
  </div>
);
```

### Usage example

```tsx
import { StatCard } from './components/StatCard';
import { CreditCard, PremiumFilled, Statistics } from '@wix/wix-ui-icons-common';

<Cell span={3}>
  <StatCard
    icon={<CreditCard style={{ color: '#0070BA' }} />}
    iconBg="linear-gradient(135deg, #DBEAFE, #C3D9F7)"
    label={t('stats.connection')}
    value={connected ? 'Live' : 'Not connected'}
    badge={{ text: sandboxMode ? 'Sandbox' : 'Live', skin: connected ? 'success' : 'neutral' }}
  />
</Cell>

<Cell span={3}>
  <StatCard
    icon={<PremiumFilled style={{ color: '#A16207' }} />}
    iconBg="linear-gradient(135deg, #FEF3C7, #FDE68A)"
    label={t('stats.currentPlan')}
    value={packageName ?? 'Free'}
    highlight={isPremium}
  />
</Cell>

<Cell span={3}>
  <StatCard
    icon={<Statistics style={{ color: '#047857' }} />}
    iconBg="linear-gradient(135deg, #D1FAE5, #A7F3D0)"
    label={t('stats.thisMonth')}
    value={usageCount.toLocaleString()}
  />
</Cell>

<Cell span={3}>
  {/* 4th slot — pick by app: "Items configured" / "Upgrade CTA" / app-specific metric */}
</Cell>
```

---

## 3. "More Apps by Us" card

### Layout contract

- Outer wrapper: `<Card><Card.Content>` — **no `Card.Header`**. The title is rendered inside the content as a `<Text size="medium" weight="bold">`.
- Container `<Box direction="vertical" gap="18px">` (or `gap="SP4"` in newer WDS).
- 4 cards in a flex row, **centered vertical layout** (image → name → description → button), each with `flex: '1 1 0'`, `padding: 16`, `borderRadius: 8`, `border: '1px solid #E8E8E8'`.
- Footer row: `<TextButton size="small">` "Explore more" on the left, `<Box flex="1" />` spacer, "POWERED BY" + purple logo on the right.

### Per-card design

```ts
{
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',                // CENTERED, not left-aligned
  gap: 8,
  padding: 16,
  borderRadius: 8,
  border: '1px solid #E8E8E8',
  flex: '1 1 0',
  minWidth: 0,                         // some apps add `minWidth: 200` + flexWrap
  boxSizing: 'border-box',
}
```

| Element | Spec |
|---------|------|
| App icon | `<img>` 48×48, `borderRadius: 10` |
| App name | `<Text size="small" weight="bold" align="center">` |
| Description | `<Text size="tiny" secondary align="center">` wrapped in a `flex: 1` div so descriptions of different lengths still align the button at the bottom |
| CTA button | `<Button size="tiny" priority="secondary" as="a" href={app.url} target="_blank">` with text "Get app" (localized) |

### POWERED BY footer row

```tsx
<Box direction="horizontal" verticalAlign="middle" marginTop="6px">
  <Box flex="1">
    <TextButton
      as="a"
      href="https://www.wix.com/app-market/developer/purple"
      target="_blank"
      rel="noopener noreferrer"
      size="small"
      suffixIcon={<Icons.ExternalLinkSmall />}
    >
      {t('moreApps.exploreMore')}
    </TextButton>
  </Box>
  <Box direction="horizontal" verticalAlign="middle" gap="8px">
    <Text
      size="tiny"
      secondary
      style={{ letterSpacing: '1.2px', textTransform: 'uppercase' }}
    >
      {t('moreApps.poweredBy')}
    </Text>
    <img
      src={purpleLogoIcon.src ?? purpleLogoIcon}
      alt="PURPLE"
      style={{ height: 20, display: 'block' }}
    />
  </Box>
</Box>
```

Key specs:
- `letterSpacing: '1.2px'`
- `textTransform: 'uppercase'`
- `secondary` (muted color)
- Logo height **20px** (not 16, despite what older notes say — production is 20)
- `alt="PURPLE"` — accessible label always
- The "Explore more" TextButton suffix icon is `<Icons.ExternalLinkSmall />`, not `<Icons.ExternalLink />`

### Affiliate URL convention

Every "Get app" link MUST include the PRPL affiliate query string:

```
https://www.wix.com/app-market/<app-id-or-slug>?referral=developer&referralTag=purple&referralSectionName=developer-page
```

Some apps additionally include an `appIndex=N` parameter to track which slot the card was in — optional but preferred.

The "Explore more" TextButton always points at:
```
https://www.wix.com/app-market/developer/purple
```

### Canonical `MoreAppsCard.tsx` component

A copy lives bundled at [`examples/_shared/MoreAppsCard.tsx`](../examples/_shared/MoreAppsCard.tsx). The 4 selected apps are app-specific (use [MORE_APPS.md](MORE_APPS.md) § Picker Logic to pick by vertical, excluding the current app's slug).

---

## 4. Card chrome (everything else)

Standard WDS `<Card>` usage everywhere else. Two recurring patterns:

### Help / Support card

```tsx
<Card>
  <Card.Content>
    <Box direction="horizontal" verticalAlign="middle" gap="SP3">
      <Icons.ChatFilled />
      <Box flex="1">
        <Text weight="bold">{t('support.title')}</Text>
        <Text secondary size="small">{t('support.subtitle')}</Text>
      </Box>
      <Button
        as="a"
        href={`mailto:${SUPPORT_EMAIL}`}
        prefixIcon={<Icons.Email />}
        priority="secondary"
      >
        {SUPPORT_EMAIL}
      </Button>
    </Box>
  </Card.Content>
</Card>
```

### Banners (inside or above the Manage tab)

| Banner | Background | Border | Use case |
|--------|-----------|--------|----------|
| **Tip** (informational) | `#EDF3FF` | none / soft blue | "Configure in Dashboard for best experience" |
| **Upgrade** (premium nudge) | `#FFF8E1` | `1px solid #FFE082` | Free / cancelled users — click → scroll to Plan tab |
| **Celebration** (first save) | `#E8F5E9` | `1px solid #C8E6C9` | Green banner shown ~8s on first successful save |
| **Warning** (limit reached) | `#FFF8E1` | `1px solid #FFE082` | "You've hit the X-config limit on the free plan" |

Banner copy uses `<Text size="small">` for the main line and `<Text size="tiny" secondary>` for any sub-line.

---

## 5. Bundled assets

These ship in this skill's `assets/` folder and must be copied into the user's project at scaffolding time. Pick **4** for the current app (excluding itself).

| File | Use | Wix App Market URL |
|------|-----|--------------------|
| `purple-logo.png` | "POWERED BY" footer logo — used **as-is** at 20px height | n/a |
| `frequently-bought-together.png` | More-Apps icon | `https://www.wix.com/app-market/17d75b11-b574-4b49-9708-4ffa8be777a6` |
| `360-product-viewer.png` | More-Apps icon | `https://www.wix.com/app-market/dd2b43ee-f3e5-4ca2-bb87-73f41be78d18` |
| `verifying-shipping-addresses.png` | More-Apps icon | `https://www.wix.com/app-market/shipping-address-verifier` |
| `google-drive-content.png` | More-Apps icon | `https://www.wix.com/app-market/6d396a1f-1145-4feb-9531-3b520ab4389e` |
| `password-protected.png` | More-Apps icon | `https://www.wix.com/app-market/password-protected` |
| `custom-additional-fees.png` | More-Apps icon | `https://www.wix.com/app-market/custom-additional-fees` |
| `advanced-product-file-uploader.png` | More-Apps icon | `https://www.wix.com/app-market/advanced-product-file-uploader` |
| `facebook-feed.png` | More-Apps icon | `https://www.wix.com/app-market/facebook-feed-pro` |

Copy command:

```bash
SKILL_DIR="<absolute path to this skill>"
# Astro layout
mkdir -p src/extensions/dashboard/pages/<page>/assets
cp "$SKILL_DIR/assets/"*.png src/extensions/dashboard/pages/<page>/assets/
# Legacy CLI layout
mkdir -p src/dashboard/pages/assets
cp "$SKILL_DIR/assets/"*.png src/dashboard/pages/assets/
```

Import via the bundler (Vite / Astro) so paths get hashed:

```tsx
// @ts-ignore — image type declarations are app-specific
import purpleLogoIcon from '../assets/purple-logo.png';
// …
<img src={purpleLogoIcon.src ?? purpleLogoIcon} alt="PURPLE" style={{ height: 20 }} />
```

> `purpleLogoIcon.src ?? purpleLogoIcon` handles both Astro (returns `{ src }` object) and legacy Vite (returns string) — keeping the same component portable across both stacks.

---

## 6. Localization keys (canonical)

Add to every `src/intl/messages/<locale>.json`:

```json
{
  "stats.connection":        "Connection",
  "stats.connected":         "Connected",
  "stats.notConnected":      "Not connected",
  "stats.currentPlan":       "Current plan",
  "stats.thisMonth":         "This month",
  "stats.yourPlan":          "Your plan",
  "stats.removeWatermark":   "Remove watermark",
  "stats.goPremium":         "Go premium for unlimited use",

  "badge.free":              "Free",
  "badge.premium":           "Premium",

  "support.title":           "Need Help?",
  "support.subtitle":        "Our team replies within 24h.",

  "moreApps.title":          "More apps by us",
  "moreApps.subtitle":       "Boost your store with our other apps",
  "moreApps.exploreMore":    "Explore more",
  "moreApps.poweredBy":      "Powered by",

  "button.getApp":           "Get app",
  "button.upgrade":          "Upgrade"
}
```

Translate to all PRPL house locales (see `wix-app-blueprint/SKILL.md § Localization`). **Use straight quotes only — curly / smart quotes break `wix build`.**

---

## 7. Checklist — every new PRPL dashboard

- [ ] All dashboard text rendered via `<Text>` / `<Heading>` / `<Badge>` from `@wix/design-system`. No raw `font-family` / `font-size` on `<div>` / `<span>` (except: shadow-DOM popups, SVG brand icons, monospace credential previews).
- [ ] Stats Overview row above the Manage tab content: **4 cards** (3 on premium), `<Cell span={3}>` or CSS Grid `repeat(4, minmax(0, 1fr))`, gap 16px.
- [ ] Each stat card uses the canonical `StatCard` component (or inlines the exact tokens) — `borderRadius: 12`, `padding: 20`, `border: '1px solid #E4E6EB'`, `boxShadow: '0 1px 3px rgba(0,0,0,0.06)'`.
- [ ] Stat-card icon circle: **52×52**, color from the 6-slot palette, matching gradient background.
- [ ] One stat card highlighted (`linear-gradient(135deg, #F3E8FF 0%, #EDE7F6 100%)` + `#D1C4E9` border) when the user is on a premium plan.
- [ ] More-Apps card uses `<Card.Content>` only — no `Card.Header`. Title rendered as `<Text size="medium" weight="bold">` inside.
- [ ] More-Apps individual cards: 48×48 icon with `borderRadius: 10`, centered layout, `borderRadius: 8` outer, `1px solid #E8E8E8` border.
- [ ] More-Apps URLs include `?referral=developer&referralTag=purple&referralSectionName=developer-page`.
- [ ] POWERED BY footer: `letterSpacing: '1.2px'`, `textTransform: 'uppercase'`, `<Text size="tiny" secondary>`, purple logo 20px tall.
- [ ] "Explore more" TextButton points at `https://www.wix.com/app-market/developer/purple` with `<Icons.ExternalLinkSmall />` suffix.
- [ ] Bundled assets copied from this skill's `assets/` into the project's dashboard assets folder.
- [ ] Localization keys above added to `intl/messages/en.json` and translated.
