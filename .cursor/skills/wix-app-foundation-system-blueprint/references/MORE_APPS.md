# More Apps by Us — Section + Asset Catalog

Every PRPL dashboard ends with a "More Apps by Us" row promoting our other Wix App Market apps. The 4 cards are picked from the catalog below, **excluding** the app currently being built.

This row lives at the bottom of the **Manage tab only**. Do NOT also render it in Plan & Settings or How to Use — it's a single promo block, not a per-tab decoration, and duplicating it across tabs makes the dashboard feel pushy. Earlier docs said "every dashboard tab" — that was wrong.

> **Visual spec is in [DESIGN_SYSTEM.md § 3](DESIGN_SYSTEM.md#3-more-apps-by-us-card).** This file owns the **catalog + picker logic**; DESIGN_SYSTEM.md owns the **component layout, POWERED BY footer specs, and typography**. The canonical `MoreAppsCard.tsx` is bundled verbatim at [`../examples/_shared/MoreAppsCard.tsx`](../examples/_shared/MoreAppsCard.tsx) — copy that into your project and only edit the `apps` array.

---

## Picker Logic

Always render exactly **4 cards**.
- Exclude the app being built (match by `slug`).
- Prefer apps that share a vertical with the current app:
  - Stores apps → FBT, Custom Additional Fees, Verifying Shipping Addresses, 360 Product Viewer, Advanced Product File Uploader
  - Marketing / content apps → Google Drive Content, Facebook Pages Feed, Password Protected
- If fewer than 4 vertical-matched apps remain after exclusion, fill from the catalog top-down.

```ts
import { MORE_APPS_CATALOG, type MoreApp } from './more-apps-catalog';

export function pickMoreApps(currentSlug: string, vertical?: 'stores' | 'content'): MoreApp[] {
  const pool = MORE_APPS_CATALOG.filter(a => a.slug !== currentSlug);
  const sorted = vertical
    ? [...pool].sort((a, b) => Number(b.vertical === vertical) - Number(a.vertical === vertical))
    : pool;
  return sorted.slice(0, 4);
}
```

---

## Catalog (PRPL apps)

URLs MUST include the affiliate query string `?referral=developer&referralTag=purple&referralSectionName=developer-page`. The catalog object below stores the bare app-market path; the component appends the referral suffix at render time (see the canonical `MoreAppsCard.tsx`).

```ts
// src/dashboard/pages/_shared/more-apps-catalog.ts (legacy CLI layout)
// Astro layout: src/extensions/dashboard/pages/<page>/components/more-apps-catalog.ts
import frequentlyBoughtTogether    from '../assets/frequently-bought-together.png';
import productViewer360            from '../assets/360-product-viewer.png';
import shippingAddressVerifier     from '../assets/verifying-shipping-addresses.png';
import googleDriveContent          from '../assets/google-drive-content.png';
import passwordProtected           from '../assets/password-protected.png';
import customAdditionalFees        from '../assets/custom-additional-fees.png';
import advancedProductFileUploader from '../assets/advanced-product-file-uploader.png';
import facebookFeed                from '../assets/facebook-feed.png';

export type MoreApp = {
  slug: string;
  name: string;
  description: string;
  url: string;        // bare URL — referral suffix is appended at render time
  icon: any;          // image-import value (Astro: { src }, Vite: string)
  vertical: 'stores' | 'content';
};

export const REFERRAL_QS =
  '?referral=developer&referralTag=purple&referralSectionName=developer-page';

export const MORE_APPS_CATALOG: MoreApp[] = [
  {
    slug: 'frequently-bought-together',
    name: 'Frequently Bought Together',
    description: 'Increase AOV with auto-bundles in the cart and product page.',
    url: 'https://www.wix.com/app-market/17d75b11-b574-4b49-9708-4ffa8be777a6',
    icon: frequentlyBoughtTogether,
    vertical: 'stores',
  },
  {
    slug: '360-product-viewer',
    name: '360° Product Viewer',
    description: 'Interactive 3D-style product spinners from a folder of images.',
    url: 'https://www.wix.com/app-market/dd2b43ee-f3e5-4ca2-bb87-73f41be78d18',
    icon: productViewer360,
    vertical: 'stores',
  },
  {
    slug: 'shipping-address-verifier',
    name: 'Verifying Shipping Addresses',
    description: 'Catch broken addresses at checkout before fulfilment.',
    url: 'https://www.wix.com/app-market/shipping-address-verifier',
    icon: shippingAddressVerifier,
    vertical: 'stores',
  },
  {
    slug: 'google-drive-content',
    name: 'Share Google Drive Content',
    description: 'Embed Google Drive folders, docs, slides on any page.',
    url: 'https://www.wix.com/app-market/6d396a1f-1145-4feb-9531-3b520ab4389e',
    icon: googleDriveContent,
    vertical: 'content',
  },
  {
    slug: 'password-protected',
    name: 'Password Protected',
    description: 'Gate any page or element with a password screen.',
    url: 'https://www.wix.com/app-market/password-protected',
    icon: passwordProtected,
    vertical: 'content',
  },
  {
    slug: 'custom-additional-fees',
    name: 'Custom Additional Fees',
    description: 'Add per-product fees and surcharges at checkout.',
    url: 'https://www.wix.com/app-market/90064897-d063-459c-afdb-69856d3e9b08',
    icon: customAdditionalFees,
    vertical: 'stores',
  },
  {
    slug: 'advanced-product-file-uploader',
    name: 'Product File Uploader',
    description: 'Let buyers attach files (artwork, briefs) to product orders.',
    url: 'https://www.wix.com/app-market/advanced-product-file-uploader',
    icon: advancedProductFileUploader,
    vertical: 'stores',
  },
  {
    slug: 'facebook-feed',
    name: 'Facebook Pages Feed',
    description: 'Show your latest Facebook posts on your Wix site.',
    url: 'https://www.wix.com/app-market/facebook-feed-pro',
    icon: facebookFeed,
    vertical: 'content',
  },
];
```

---

## React component (canonical)

**The full canonical `MoreAppsCard.tsx` lives at [`../examples/_shared/MoreAppsCard.tsx`](../examples/_shared/MoreAppsCard.tsx).** Copy verbatim — only the `apps` array (the 4 selected items) is app-specific. The component already handles:

- Centered vertical layout (image → name → description → button), `borderRadius: 8`, `1px solid #E8E8E8`
- 48×48 app icon with `borderRadius: 10`
- "POWERED BY" footer with `letterSpacing: '1.2px'`, `textTransform: 'uppercase'`, purple logo at 20px height
- "Explore more" `<TextButton>` with `<Icons.ExternalLinkSmall />` suffix → `https://www.wix.com/app-market/developer/purple`
- `toUrl(asset)` helper so the same component works on both Astro (`{ src }` objects) and legacy Vite (string)
- `REFERRAL_QS` appended to every URL

See [DESIGN_SYSTEM.md § 3](DESIGN_SYSTEM.md#3-more-apps-by-us-card) for the per-element styling spec (sizes, borders, colors).

---

## Asset Folder

Always create:

```
src/dashboard/pages/assets/
├── purple-logo.png                    # PRPL "POWERED BY" logo
├── frequently-bought-together.png
├── 360-product-viewer.png
├── verifying-shipping-addresses.png
├── google-drive-content.png
├── password-protected.png
├── custom-additional-fees.png
├── advanced-product-file-uploader.png
└── facebook-feed.png
```

Bundled copies of all 9 files ship in this skill's `../assets/` folder. The agent should `cp` them into `src/dashboard/pages/assets/` after scaffolding.

```bash
SKILL_DIR="<absolute path to this skill>"
cp "$SKILL_DIR/assets/"*.png src/dashboard/pages/assets/
```

Tell the user: *"I've copied the canonical PRPL icons into `src/dashboard/pages/assets/`. Replace any of them with your own files if you prefer custom branding."*

---

## Asset usage rules

- Imports go through Vite/Astro asset import (`import x from '../assets/x.png'`) so paths get hashed for cache-busting.
- Card icons are 48×48 with `borderRadius: 10`.
- The "POWERED BY" PRPL logo is **20px tall** (production spec — earlier notes saying 16px are wrong), `display: block`, no opacity change (the muted look comes from the adjacent `<Text secondary>`).
- NEVER inline base64 the icons — bloats the JS bundle and breaks WDS theming.
- Image-import return type differs by stack: Astro returns `{ src: '...' }`, legacy Vite returns the URL string directly. Use the `toUrl()` helper in the canonical component to handle both.

---

## Translation keys

Add to every `src/intl/messages/<locale>.json`:

```json
{
  "moreApps.title":        "More apps by us",
  "moreApps.subtitle":     "Boost your store with our other apps",
  "moreApps.exploreMore":  "Explore more",
  "moreApps.poweredBy":    "Powered by",

  "moreApps.frequentlyBoughtTogether":     "Frequently Bought Together",
  "moreApps.frequentlyBoughtTogetherDesc": "Boost AOV with smart product bundles.",
  "moreApps.shippingAddressVerifier":      "Shipping Address Verifier",
  "moreApps.shippingAddressVerifierDesc":  "Catch bad addresses before you ship.",
  "moreApps.productViewer360":             "360° Product Viewer",
  "moreApps.productViewer360Desc":         "Spin-to-view product images.",
  "moreApps.customAdditionalFees":         "Custom Additional Fees",
  "moreApps.customAdditionalFeesDesc":     "Add handling, gift-wrap, and more.",
  "moreApps.googleDriveContent":           "Share Google Drive Content",
  "moreApps.googleDriveContentDesc":       "Embed Docs, Sheets, Slides, and folders.",
  "moreApps.passwordProtected":            "Password Protected",
  "moreApps.passwordProtectedDesc":        "Gate any page with a password screen.",
  "moreApps.advancedProductFileUploader":  "Product File Uploader",
  "moreApps.advancedProductFileUploaderDesc": "Let buyers attach files to orders.",
  "moreApps.facebookFeed":                 "Facebook Pages Feed",
  "moreApps.facebookFeedDesc":             "Embed your Facebook Page timeline and events.",

  "button.getApp":     "Get app"
}
```

Notes:
- "Powered by" is rendered in CSS `text-transform: uppercase` — translate the **sentence-case** string and let the CSS do the casing. Curly / smart quotes break `wix build` — use straight quotes only.
- The canonical `MoreAppsCard.tsx` references catalog entries by their `moreApps.<slug>` + `moreApps.<slug>Desc` keys. Add only the 4 you actually use to keep translation work bounded.

Translate to all 17 PRPL house locales (`da, de, en, es, fr, he, it, ja, ko, nl, pl, pt, ru, th, tr, uk, zh`).
