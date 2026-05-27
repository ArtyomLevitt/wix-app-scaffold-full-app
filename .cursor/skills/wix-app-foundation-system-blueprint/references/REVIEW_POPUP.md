# Review Popup — PRPL House Style

A custom-element shadow-DOM modal that pops up on **first** successful save / configuration. Loads the Wix App Market review URL in an iframe. Gated by localStorage so it appears at most once per browser per app.

This is the same pattern used in `frequently-bought-together`, `password-protected`, `share-google-drive-content`, and the `square-payment-button` migration.

---

## Trigger Rules

- **When**: After the FIRST successful save / configuration (per user's choice in the blueprint).
- **Delay**: 2 seconds after the save completes — lets the green celebration banner / success toast land first.
- **Frequency**: Once per browser per app, EVER. Gated by `localStorage[LS_REVIEW]` (= `${APP_SLUG}_review_shown_v1`).
- **Where**: Dashboard only. NEVER from the site widget or editor panel.

```tsx
import { ensureRatePopupRegistered, openRatePopup } from '../_shared/rate-popup';
import { LS_REVIEW, REVIEW_URL } from '../_shared/app-config';

useEffect(() => { ensureRatePopupRegistered(); }, []);

const triggerReviewOnce = useCallback(() => {
  try {
    if (localStorage.getItem(LS_REVIEW)) return;
    localStorage.setItem(LS_REVIEW, '1');
    setTimeout(() => openRatePopup(REVIEW_URL), 2000);
  } catch { /* localStorage blocked */ }
}, []);

const handleSave = async () => {
  await saveConfig(...);
  fetch('/api/app/track-setup-completed', { method: 'POST' }).catch(() => {});
  setShowCelebration(true);
  triggerReviewOnce();
};
```

---

## File: `src/extensions/dashboard/_shared/rate-popup.ts`

```ts
const DEFAULT_REVIEW_URL =
  'https://www.wix.com/app-market/add-review/<APP_ID>'; // override via attribute

class RatePopup extends HTMLElement {
  static get observedAttributes() { return ['open', 'review-url']; }
  private _rendered = false;
  private _portalHost: HTMLDivElement | null = null;
  private _root: ShadowRoot | null = null;
  private $overlay: HTMLDivElement | null = null;
  private $iframe:  HTMLIFrameElement | null = null;
  private $close:   HTMLButtonElement | null = null;
  private _onKeyDown: (e: KeyboardEvent) => void;
  private _lastFocused: Element | null = null;

  constructor() {
    super();
    this._onKeyDown = (e) => {
      if (!this._isOpen()) return;
      if (e.key === 'Escape') { e.preventDefault(); this._close(); }
    };
  }

  connectedCallback() {
    if (!this._portalHost) this._mountPortal();
    if (this.hasAttribute('open')) this._sync();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeyDown, true);
  }

  attributeChangedCallback(name: string) {
    if (!this._rendered) return;
    if (name === 'open' || (name === 'review-url' && this.hasAttribute('open'))) this._sync();
  }

  private _mountPortal() {
    this._portalHost = document.createElement('div');
    Object.assign(this._portalHost.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',          // int max — sits above every Wix UI layer
      pointerEvents: 'none',
    });
    document.body.appendChild(this._portalHost);
    this._root = this._portalHost.attachShadow({ mode: 'open' });
    this._root.innerHTML = `
      <style>
        :host { all: initial; }
        .overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.55);
          display: none; align-items: center; justify-content: center;
          padding: 24px; box-sizing: border-box; pointer-events: auto;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif;
        }
        .overlay[data-open="true"] { display: flex; }
        .dialog {
          width: min(770px, calc(100vw - 48px));
          height: min(650px, calc(100vh - 48px));
          background: #fff;
          border-radius: 16px;
          box-shadow: 0 18px 60px rgba(0,0,0,0.25);
          overflow: hidden;
          display: grid; grid-template-rows: auto 1fr;
        }
        .header {
          display: flex; align-items: center; justify-content: space-between;
          padding: 14px 16px;
          border-bottom: 1px solid rgba(0,0,0,0.12);
        }
        .title { font-size: 14px; font-weight: 600; }
        button.icon {
          appearance: none;
          border: 1px solid rgba(0,0,0,0.12); background: transparent;
          width: 34px; height: 34px; border-radius: 10px;
          display: grid; place-items: center; cursor: pointer;
        }
        button.icon:hover { background: rgba(0,0,0,0.04); }
        iframe { width: 100%; height: 100%; border: 0; background: #fff; }

        @media (max-width: 520px) {
          .overlay { padding: 12px; }
          .dialog {
            width: calc(100vw - 24px);
            height: calc(100vh - 24px);
            border-radius: 14px;
          }
        }
      </style>
      <div class="overlay" aria-hidden="true">
        <div class="dialog" role="dialog" aria-modal="true" aria-label="Review">
          <div class="header">
            <div class="title">How are you liking our app?</div>
            <button class="icon" type="button" aria-label="Close">
              <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
                <path d="M4 4l8 8M12 4L4 12" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
              </svg>
            </button>
          </div>
          <iframe referrerpolicy="no-referrer-when-downgrade"></iframe>
        </div>
      </div>
    `;
    this.$overlay = this._root.querySelector('.overlay');
    this.$iframe  = this._root.querySelector('iframe');
    this.$close   = this._root.querySelector('button.icon');
    this.$close?.addEventListener('click', () => this._close());
    this.$overlay?.addEventListener('mousedown', (e: any) => {
      if (e.target === this.$overlay) this._close();
    });
    this._rendered = true;
  }

  private _sync() {
    const src = this.getAttribute('review-url') || DEFAULT_REVIEW_URL;
    if (this.$iframe) this.$iframe.src = src;
    if (this.$overlay) {
      this.$overlay.dataset.open = 'true';
      this.$overlay.setAttribute('aria-hidden', 'false');
    }
    if (this._portalHost) this._portalHost.style.pointerEvents = 'auto';
    document.addEventListener('keydown', this._onKeyDown, true);
    this._lastFocused = document.activeElement;
    queueMicrotask(() => this.$close?.focus?.());
  }

  private _close() {
    if (this.$overlay) {
      this.$overlay.dataset.open = 'false';
      this.$overlay.setAttribute('aria-hidden', 'true');
    }
    document.removeEventListener('keydown', this._onKeyDown, true);
    this.$iframe?.removeAttribute('src');                     // unload iframe
    if (this._portalHost) this._portalHost.style.pointerEvents = 'none';
    queueMicrotask(() => (this._lastFocused as any)?.focus?.());
  }

  private _isOpen() { return this.$overlay?.dataset.open === 'true'; }
}

export function ensureRatePopupRegistered() {
  if (typeof window === 'undefined') return;
  if (customElements.get('rate-popup')) return;
  customElements.define('rate-popup', RatePopup);
}

export function openRatePopup(reviewUrl?: string) {
  if (typeof window === 'undefined') return;
  ensureRatePopupRegistered();
  let el = document.querySelector('rate-popup') as HTMLElement | null;
  if (!el) { el = document.createElement('rate-popup'); document.body.appendChild(el); }
  if (reviewUrl) el.setAttribute('review-url', reviewUrl);
  el.setAttribute('open', String(Date.now()));   // bump value forces attribute change
}
```

---

## Why a Custom Element + Portal

- **Z-index**: `2147483647` (int max) sits above every Wix UI layer, including the dashboard's sticky header. NEVER use lower values like `99999` — those get covered.
- **Shadow DOM** isolates the modal's CSS from the Wix Design System styles (and vice-versa).
- **Iframe** renders the live Wix App Market review form, with stars + comment input + submission, on the user's behalf. We don't have to build a rating UI.
- **Portal-mounted via `document.body.appendChild`**: works inside the dashboard's iframe without z-index conflicts.

---

## What NOT to do

| ❌ WRONG | ✅ CORRECT |
|---------|-----------|
| Use WDS `<Modal />` for the review popup | Use the shadow-DOM `<rate-popup>` custom element — WDS modals can't reliably escape the dashboard's z-index stack |
| Trigger on dashboard mount | Trigger on FIRST successful save (or whatever explicit "happy moment" the app has) |
| Show every save | localStorage gate on `${APP_SLUG}_review_shown_v1` |
| Build your own star-rating UI | Use the Wix App Market review iframe (`https://www.wix.com/app-market/add-review/{APP_ID}`) |
| Hardcode `<APP_ID>` in `rate-popup.ts` | Pass via `setAttribute('review-url', ...)` from the dashboard, sourcing `REVIEW_URL` from `app-config.ts` |
| Set localStorage AFTER opening (race) | Set localStorage **before** the `setTimeout` opens the modal (otherwise rapid double-saves can fire it twice) |
| Open without a delay | Always `setTimeout(open, 2000)` so the celebration banner / toast lands first |
| Reuse the popup element from the editor settings panel | Dashboard ONLY — the editor panel runs in a different iframe and doesn't need it |

---

## Testing

1. Clear localStorage: `localStorage.removeItem('<APP_SLUG>_review_shown_v1')`.
2. Save a config → expect green celebration banner immediately, then review popup ~2s later.
3. Save another config → no popup.
4. Refresh page → no popup.
5. Clear localStorage again → save → popup re-appears.
6. Press Esc → modal closes, focus returns to trigger.
7. Click backdrop → modal closes.

---

## App Market URLs (canonical)

```ts
// app-config.ts
export const APP_ID     = '<your-app-id>';
export const REVIEW_URL = `https://www.wix.com/app-market/add-review/${APP_ID}`;
```

Examples (real apps):
- FBT: `https://www.wix.com/app-market/add-review/17d75b11-b574-4b49-9708-4ffa8be777a6`
- Google Drive Content: `https://www.wix.com/app-market/add-review/6d396a1f-1145-4feb-9531-3b520ab4389e`
- Password Protected: `https://www.wix.com/app-market/add-review/<id>`
- Instagram Feed: `https://www.wix.com/app-market/add-review/a5dd7ce8-07c2-4251-8d58-9657c1a43163`
