import { REVIEW_URL } from '../../extensions/_shared/app-config';

const DEFAULT_REVIEW_URL = REVIEW_URL;

class RatePopup extends HTMLElement {
  static get observedAttributes() {
    return ['open', 'review-url'];
  }

  private _rendered = false;
  private _lastFocused: Element | null = null;
  private _portalHost: HTMLDivElement | null = null;
  private _root: ShadowRoot | null = null;
  private $overlay: HTMLDivElement | null = null;
  private $dialog: HTMLDivElement | null = null;
  private $close: HTMLButtonElement | null = null;
  private $iframe: HTMLIFrameElement | null = null;
  private _onKeyDown: (e: KeyboardEvent) => void;

  constructor() {
    super();
    this._onKeyDown = (e: KeyboardEvent) => {
      if (!this._isOpen()) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        this._close();
      }
      if (e.key === 'Tab') this._trapFocus(e);
    };
  }

  connectedCallback() {
    if (!this._portalHost) this._mountPortal();
    if (this.hasAttribute('open')) this._syncFromAttrsAndOpen();
  }

  disconnectedCallback() {
    document.removeEventListener('keydown', this._onKeyDown, true);
  }

  attributeChangedCallback(name: string) {
    if (!this._rendered) return;
    if (name === 'open' || name === 'review-url') this._syncFromAttrsAndOpen();
  }

  private _mountPortal() {
    this._portalHost = document.createElement('div');
    this._portalHost.setAttribute('data-rate-popup-portal', 'true');
    Object.assign(this._portalHost.style, {
      position: 'fixed',
      inset: '0',
      zIndex: '2147483647',
      pointerEvents: 'none',
    });
    document.body.appendChild(this._portalHost);
    this._root = this._portalHost.attachShadow({ mode: 'open' });
    this._renderIntoPortal();
    this._rendered = true;
  }

  private _renderIntoPortal() {
    if (!this._root) return;
    this._root.innerHTML = `<style>
      .overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.55); display: none; align-items: center; justify-content: center; padding: 24px; pointer-events: auto; }
      .overlay[data-open="true"] { display: flex; }
      .dialog { width: min(770px, calc(100vw - 48px)); height: min(650px, calc(100vh - 48px)); background: #fff; border-radius: 16px; overflow: hidden; display: grid; grid-template-rows: auto 1fr; }
      .header { display: flex; justify-content: space-between; padding: 14px 16px; border-bottom: 1px solid #eee; }
      iframe { width: 100%; height: 100%; border: 0; }
      button.icon { cursor: pointer; border: 1px solid #ddd; background: #fff; border-radius: 8px; width: 34px; height: 34px; }
    </style>
    <div class="overlay" aria-hidden="true">
      <div class="dialog" role="dialog" aria-modal="true">
        <div class="header"><div>How are you liking our app?</div><button class="icon" type="button" aria-label="Close">×</button></div>
        <iframe referrerpolicy="no-referrer-when-downgrade"></iframe>
      </div>
    </div>`;
    this.$overlay = this._root.querySelector('.overlay');
    this.$dialog = this._root.querySelector('.dialog');
    this.$close = this._root.querySelector('button.icon');
    this.$iframe = this._root.querySelector('iframe');
    this.$close?.addEventListener('click', () => this._close());
    this.$overlay?.addEventListener('mousedown', (e) => {
      if (e.target === this.$overlay) this._close();
    });
  }

  private _syncFromAttrsAndOpen() {
    const src = this.getAttribute('review-url') || DEFAULT_REVIEW_URL;
    if (this.$iframe) this.$iframe.src = src;
    this._open();
  }

  private _open() {
    if (this._isOpen()) return;
    this._lastFocused = document.activeElement;
    if (this._portalHost) this._portalHost.style.pointerEvents = 'auto';
    if (this.$overlay) {
      this.$overlay.dataset.open = 'true';
      this.$overlay.setAttribute('aria-hidden', 'false');
    }
    document.addEventListener('keydown', this._onKeyDown, true);
  }

  private _close() {
    if (!this._isOpen()) return;
    if (this.$overlay) {
      this.$overlay.dataset.open = 'false';
      this.$overlay.setAttribute('aria-hidden', 'true');
    }
    document.removeEventListener('keydown', this._onKeyDown, true);
    this.$iframe?.removeAttribute('src');
    if (this._portalHost) this._portalHost.style.pointerEvents = 'none';
    (this._lastFocused as HTMLElement | null)?.focus?.();
  }

  private _isOpen() {
    return this.$overlay?.dataset.open === 'true';
  }

  private _trapFocus(e: KeyboardEvent) {
    if (!this._root) return;
    const focusable = Array.from(
      this._root.querySelectorAll('button, [href], input, select, textarea'),
    );
    if (!focusable.length) return;
    const first = focusable[0] as HTMLElement;
    const last = focusable[focusable.length - 1] as HTMLElement;
    const active = document.activeElement;
    if (e.shiftKey && active === first) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && active === last) {
      e.preventDefault();
      first.focus();
    }
  }
}

export function ensureRatePopupRegistered() {
  if (!customElements.get('rate-popup')) customElements.define('rate-popup', RatePopup);
}

export function openRatePopup(reviewUrl?: string) {
  ensureRatePopupRegistered();
  let el = document.querySelector('rate-popup') as RatePopup | null;
  if (!el) {
    el = document.createElement('rate-popup') as RatePopup;
    document.body.appendChild(el);
  }
  if (reviewUrl) el.setAttribute('review-url', reviewUrl);
  el.setAttribute('open', String(Date.now()));
}
