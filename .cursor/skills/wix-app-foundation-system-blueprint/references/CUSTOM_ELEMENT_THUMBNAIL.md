# Custom Element Widget — Editor Thumbnail (`presets.thumbnailUrl`)

The Wix Editor **Add Elements → Apps** tile loads `presets[].thumbnailUrl` from your app manifest. If this is wrong, users see an **empty grey tile**, **`500`** responses in DevTools, or broken previews — even though the widget script itself works.

This applies to **Wix CLI + Astro** (`@wix/astro`) apps. The CLI evaluates extension configs with Vite **`publicDir: false`**, so you cannot rely on `import thumb from "./x.png"` inside `*.extension.ts` to bundle the thumbnail; the supported pattern is a **file in `public/`** referenced by URL string.

---

## Rules (must-follow)

| Requirement | Detail |
|-------------|--------|
| **Put the image in `public/`** | e.g. `public/my-widget-thumbnail.png` |
| **URL in extension** | `thumbnailUrl: "{{BASE_URL}}/my-widget-thumbnail.png"` |
| **Never use `/public/` in the URL** | ❌ `{{BASE_URL}}/public/my-widget-thumbnail.png` — Astro/Vite serves `public/` files at the **CDN root**. The `/public/...` path **does not exist** in production → empty tile / errors. |
| **Match widget footprint** | Resize the PNG to roughly **`defaultWidth` × `defaultHeight`** from the same `extensions.customElement({ ... })` block (e.g. 900×500). Huge poster-sized images (e.g. 1500×1000, multi‑MB) often fail to render in the small picker tile even when the URL returns 200. |
| **Prefer RGB over RGBA** | Flatten transparency onto a solid background. RGBA-only artwork has caused inconsistent rendering on the static CDN / editor preview in production feeds (Instagram / Facebook). |
| **Keep bytes reasonable** | Aim for **≤ ~500 KB** after resizing (often 30–250 KB is enough). |
| **Release + cache** | After changing the file or URL, **`npm run build && npm run release`** and **hard-refresh** the editor (or another browser) — manifests and CDN assets are cached aggressively. |

---

## Verify locally after `npm run build`

1. **`dist/<your-thumbnail>.png` exists** at the **root** of `dist/` (copied from `public/`).
2. **`dist/_routes.json`** lists `"/<your-thumbnail>.png"` under **`exclude`** so Cloudflare serves it as a **static asset**, not via the worker-only route.
3. **`dist/_wix/app-manifest.json`** — find `CUSTOM_ELEMENT_WIDGET` → `customElementWidget.presets[]` → `thumbnailUrl` should be  
   `http://_wix_statics_url_placeholder_/<your-thumbnail>.png`  
   (placeholder is rewritten at deploy time).

---

## Relationship to official docs

Wix CLI docs sometimes show:

```ts
thumbnailUrl: '{{BASE_URL}}/public/thumb.png'
```

For **Astro-based CLI apps**, treat that as **outdated**: files from `public/` are **not** exposed under a `/public/` URL segment; use **`{{BASE_URL}}/thumb.png`** instead.

Site-plugin `logoUrl` migrations (`{{PUBLIC_URL}}` → relative `src/assets` paths) are a **different** mechanism — custom-element **preset thumbnails** stay on **`public/` + `{{BASE_URL}}/filename`**.

---

## Reference implementations

- `instagram-feed`: `public/instagram-feed-thumbnail.png` + `{{BASE_URL}}/instagram-feed-thumbnail.png`
- `facebook-feed`: `public/facebook-feed-thumbnail.png` + `{{BASE_URL}}/facebook-feed-thumbnail.png`
- `tiktok-feed`: `public/tiktok-feed-thumbnail.png` + `{{BASE_URL}}/tiktok-feed-thumbnail.png`
