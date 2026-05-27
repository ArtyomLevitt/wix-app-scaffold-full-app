// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// Lives at: src/extensions/site/widgets/custom-elements/paypal-pay-button/components/paypal-sdk-loader.ts
//
// Pattern: load a third-party JS SDK at runtime via <script> injection.
// Reuse this for Stripe, Klarna, Plaid, Square, Mapbox, Calendly, etc. —
// any SDK that needs runtime config (a client ID, a publishable key) baked
// into the script URL and therefore can't be pre-bundled at build time.
//
// Two non-obvious things:
//   1. Window-level promise cache (`window.__paypalSdkPromises`) deduplicates
//      multiple widget instances trying to load the same SDK URL.
//   2. `unlockWindowFetch()` redefines `window.fetch` as writable+configurable
//      because PayPal's anti-fraud bundle (`frame_ant.js`) wraps fetch, and
//      Wix runtime (especially in nested iframes) sometimes marks fetch as
//      non-writable. Without this, the SDK throws
//      `Cannot assign to read only property 'fetch'`.

declare global {
  interface Window {
    paypal?: any;
    __paypalSdkPromises?: Record<string, Promise<any>>;
    __paypalFetchUnlocked?: boolean;
  }
}

export interface PayPalSdkLoadResult {
  ok: boolean;
  paypal?: any;
  error?: string;
}

const SCRIPT_DATA_ATTR = 'data-paypal-sdk-key';

/**
 * PayPal's anti-fraud bundle (`frame_ant.js`) replaces `window.fetch` with a
 * wrapped version. Some host environments (Wix runtime, locked-down embeds)
 * mark `window.fetch` as non-writable / non-configurable, which crashes the
 * SDK with `Cannot assign to read only property 'fetch'`.
 *
 * We pre-emptively redefine the property as writable + configurable. If the
 * environment forbids redefining at all we silently no-op — the SDK will try
 * and just emit a recoverable error in the console, but the buttons still
 * render.
 */
function unlockWindowFetch(): void {
  if (typeof window === 'undefined') return;
  if (window.__paypalFetchUnlocked) return;
  try {
    const descriptor = Object.getOwnPropertyDescriptor(window, 'fetch');
    if (descriptor && descriptor.writable && descriptor.configurable) {
      window.__paypalFetchUnlocked = true;
      return;
    }
    const original = window.fetch;
    Object.defineProperty(window, 'fetch', {
      configurable: true,
      writable: true,
      enumerable: descriptor?.enumerable ?? false,
      value: original,
    });
    window.__paypalFetchUnlocked = true;
  } catch {
    /* environment forbids redefinition; PayPal will fall back gracefully */
  }
}

export async function loadPayPalSdk(sdkUrl: string): Promise<PayPalSdkLoadResult> {
  if (typeof window === 'undefined') {
    return { ok: false, error: 'PayPal SDK can only load in the browser.' };
  }

  unlockWindowFetch();

  if (!window.__paypalSdkPromises) {
    window.__paypalSdkPromises = {};
  }

  const cached = window.__paypalSdkPromises[sdkUrl];
  if (cached) {
    try {
      const paypal = await cached;
      return { ok: true, paypal };
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to load PayPal SDK';
      return { ok: false, error };
    }
  }

  const promise = new Promise<any>((resolve, reject) => {
    const existing = document.querySelector(
      `script[${SCRIPT_DATA_ATTR}="${CSS.escape(sdkUrl)}"]`,
    ) as HTMLScriptElement | null;

    if (existing && window.paypal) {
      resolve(window.paypal);
      return;
    }

    const script = document.createElement('script');
    script.src = sdkUrl;
    script.async = true;
    script.setAttribute(SCRIPT_DATA_ATTR, sdkUrl);
    script.onload = () => {
      if (window.paypal) {
        resolve(window.paypal);
      } else {
        reject(new Error('PayPal SDK loaded but window.paypal is missing.'));
      }
    };
    script.onerror = () => {
      reject(new Error('Failed to load PayPal SDK script.'));
    };
    document.head.appendChild(script);
  });

  window.__paypalSdkPromises[sdkUrl] = promise;

  try {
    const paypal = await promise;
    return { ok: true, paypal };
  } catch (err) {
    delete window.__paypalSdkPromises[sdkUrl];
    const error = err instanceof Error ? err.message : 'Failed to load PayPal SDK';
    return { ok: false, error };
  }
}
