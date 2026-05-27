// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// Lives at: src/extensions/site/widgets/custom-elements/paypal-pay-button/widget.tsx
//
// The site-rendered custom element. Three distinctive patterns:
//   1. Detects the editor environment (`isEditorEnvironment`) and renders a
//      static placeholder there — PayPal's iframes don't always survive
//      Wix editor sandboxing.
//   2. Loads the PayPal SDK at runtime by fetching `/api/paypal/client-config`
//      (returns `{ clientId, sandboxMode, sdkUrl }` from server-stored creds),
//      then `loadPayPalSdk(sdkUrl)` injects the script.
//   3. Single widget supports two modes: `fixed` (single payment) and
//      `donation` (preset amount chips + free-form input). Different sections
//      render based on `mode` + `payButtonStyle` props.

import React, { type FC, useState, useEffect, useMemo, useRef } from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';
import { httpClient } from '@wix/essentials';
import { loadPayPalSdk } from './paypal-sdk-loader.ts';
// PaymentBrands.tsx is omitted from this bundle — it's just SVG icons for
// Visa / Mastercard / Amex / Discover plus the PayPal wordmark. Replace with
// your own brand chips or copy from the source app.
import { AcceptedCardsRow, PoweredByPayPal } from './payment-brands.tsx';

/**
 * Detect whether the widget is being rendered inside the Wix editor (or
 * Editor X / Studio) instead of a published live site. We avoid loading and
 * rendering the actual PayPal Smart Buttons in the editor because PayPal's
 * SDK doesn't always behave well inside the editor's nested iframes (CSP /
 * sandbox / fetch-locking) — and editor users don't need a real button to
 * preview their layout. We render a static placeholder instead.
 */
function isEditorEnvironment(): boolean {
  if (typeof window === 'undefined') return false;
  const editorMarkers = ['editor.wix.com', 'wixstudio.com', 'wix.com/_partials'];

  try {
    const ancestors = window.location.ancestorOrigins;
    if (ancestors) {
      for (let i = 0; i < ancestors.length; i++) {
        const origin = ancestors[i] || '';
        if (editorMarkers.some((m) => origin.includes(m))) return true;
      }
    }
  } catch {
    /* ignore */
  }

  try {
    const ref = document.referrer || '';
    if (editorMarkers.some((m) => ref.includes(m))) return true;
  } catch {
    /* ignore */
  }

  try {
    if (
      typeof window.location !== 'undefined' &&
      typeof window.location.href === 'string' &&
      editorMarkers.some((m) => window.location.href.includes(m))
    ) {
      return true;
    }
  } catch {
    /* ignore */
  }

  return false;
}

type PayPalButtonColor = 'gold' | 'blue' | 'silver' | 'white' | 'black';

type PayPalButtonLabel = 'paypal' | 'checkout' | 'buynow' | 'pay' | 'donate';

function pickPayPalColor(hex: string | undefined): PayPalButtonColor {
  const value = (hex || '').trim().toLowerCase();
  if (!value) return 'gold';
  if (value === '#ffffff' || value === '#fff') return 'white';
  if (value === '#000000' || value === '#000') return 'black';
  if (value.startsWith('#ffc') || value.startsWith('#ffd') || value.startsWith('#ffb'))
    return 'gold';
  if (value.startsWith('#0070ba') || value.includes('blue') || value.startsWith('#1'))
    return 'blue';
  if (value.startsWith('#c') || value.startsWith('#d') || value.startsWith('#e'))
    return 'silver';
  return 'gold';
}

function pickPayPalLabel(
  isDonationMode: boolean,
  buttonLabel: string,
): PayPalButtonLabel {
  if (isDonationMode) return 'donate';
  const lower = (buttonLabel || '').toLowerCase();
  if (lower.includes('buy')) return 'buynow';
  if (lower.includes('checkout')) return 'checkout';
  if (lower.includes('pay')) return 'pay';
  return 'paypal';
}

interface ClientConfigResponse {
  ok: boolean;
  message?: string;
  aborted?: boolean;
  clientId?: string;
  sandboxMode?: boolean;
  sdkUrl?: string;
}

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

const incrementUsage = async (): Promise<void> => {
  try {
    await httpClient.fetchWithAuth(`${getApiBase()}/api/usage/increment`, {
      method: 'POST',
    });
  } catch {
    // Best-effort — do not block UX on usage tracking.
  }
};

interface WidgetProps {
  productName?: string;
  defaultAmount?: string;
  currencyCode?: string;
  buttonLabel?: string;
  buttonColor?: string;
  buttonTextColor?: string;
  customAmountEnabled?: string;
  customNoteEnabled?: string;
  mode?: string;
  presetAmounts?: string;
  donationPrompt?: string;
  showCardIcons?: string;
  showPoweredBy?: string;
  payButtonStyle?: string;
}

// All widget props are strings — `reactToWebComponent` only supports string
// props because DOM attributes are always strings. Convert here.
const isTrue = (v: string | undefined): boolean => v === 'true' || v === '1';

const parsePresets = (raw: string | undefined): number[] => {
  if (!raw) return [];
  return raw
    .split(',')
    .map((p) => Number(p.trim()))
    .filter((n) => Number.isFinite(n) && n > 0)
    .slice(0, 6);
};

const formatPresetLabel = (amount: number, currencyCode: string): string => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: currencyCode || 'USD',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `${currencyCode} ${amount}`;
  }
};

const formatTotal = (amt: string | number, code: string): string => {
  const num = typeof amt === 'number' ? amt : parseFloat(amt);
  if (!Number.isFinite(num) || num <= 0) return '';
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: code || 'USD',
    }).format(num);
  } catch {
    return `${code} ${num.toFixed(2)}`;
  }
};

const PayPalPayWidget: FC<WidgetProps> = ({
  productName = 'My Product',
  defaultAmount = '1',
  currencyCode = 'USD',
  buttonLabel = '',
  buttonColor = '#0070BA',
  buttonTextColor = '#ffffff',
  customAmountEnabled = 'false',
  customNoteEnabled = 'false',
  mode = 'fixed',
  presetAmounts = '5,10,25,50',
  donationPrompt = 'Choose an amount to donate',
  showCardIcons = 'true',
  showPoweredBy = 'true',
  payButtonStyle = 'native',
}) => {
  const isDonationMode = mode === 'donation';
  const presets = useMemo(() => parsePresets(presetAmounts), [presetAmounts]);
  const allowCustomAmount = isDonationMode || isTrue(customAmountEnabled);
  const allowCustomNote = isTrue(customNoteEnabled);
  const productLabel = isDonationMode ? productName || 'Donation' : productName;

  const paypalColor = useMemo<PayPalButtonColor>(
    () => (payButtonStyle === 'paypal' ? 'gold' : pickPayPalColor(buttonColor)),
    [payButtonStyle, buttonColor],
  );
  const paypalLabel = useMemo<PayPalButtonLabel>(
    () => pickPayPalLabel(isDonationMode, buttonLabel),
    [isDonationMode, buttonLabel],
  );

  const [amount, setAmount] = useState<string>('');
  const [note, setNote] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string>('');
  const [showSuccess, setShowSuccess] = useState(false);

  const isEditor = useMemo(() => isEditorEnvironment(), []);

  const [config, setConfig] = useState<ClientConfigResponse | null>(null);
  const [configLoading, setConfigLoading] = useState(true);
  const [paypalReady, setPaypalReady] = useState(false);
  const [paypalSdk, setPaypalSdk] = useState<any>(null);

  const paypalContainerRef = useRef<HTMLDivElement | null>(null);
  const buttonsInstanceRef = useRef<any>(null);
  const amountRef = useRef<string>('');
  const noteRef = useRef<string>('');
  amountRef.current = amount;
  noteRef.current = note;

  // 1. Fetch config from /api/paypal/client-config (returns the SDK URL with
  //    the merchant's client ID baked in). 2. Inject the PayPal SDK script.
  // Skip both in editor — render a static placeholder instead.
  useEffect(() => {
    let cancelled = false;
    setConfigLoading(true);
    httpClient
      .fetchWithAuth(
        `${getApiBase()}/api/paypal/client-config?currencyCode=${encodeURIComponent(currencyCode)}`,
      )
      .then((res) => res.json())
      .then((data: ClientConfigResponse) => {
        if (cancelled) return;
        setConfig(data);
        if (!data.ok) {
          if (!isEditor) {
            setErrorMsg(data.message || 'PayPal is not connected.');
          }
          setConfigLoading(false);
          return;
        }
        if (isEditor) {
          setConfigLoading(false);
          return;
        }
        if (!data.sdkUrl) {
          setErrorMsg('PayPal SDK URL is missing.');
          setConfigLoading(false);
          return;
        }
        return loadPayPalSdk(data.sdkUrl).then((result) => {
          if (cancelled) return;
          if (!result.ok) {
            setErrorMsg(result.error || 'Failed to load PayPal SDK.');
            return;
          }
          setPaypalSdk(result.paypal);
          setPaypalReady(true);
        });
      })
      .catch((err) => {
        if (cancelled) return;
        const msg = err instanceof Error ? err.message : 'Failed to fetch PayPal config.';
        setErrorMsg(msg);
      })
      .finally(() => {
        if (!cancelled) setConfigLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [currencyCode, isEditor]);

  const numericAmount = Number(amount);
  const selectedPreset =
    Number.isFinite(numericAmount) && numericAmount > 0 ? numericAmount : null;

  const fixedTotal = !isDonationMode ? formatTotal(defaultAmount, currencyCode) : '';

  const computePayAmount = (): number | null => {
    const raw = allowCustomAmount ? amountRef.current : defaultAmount;
    const asNumber = Number(raw);
    if (!Number.isFinite(asNumber) || asNumber <= 0) return null;
    return Math.round(asNumber * 100) / 100;
  };
  const computePayAmountRef = useRef(computePayAmount);
  computePayAmountRef.current = computePayAmount;

  // Mount the PayPal Smart Buttons once the SDK is ready. The `buttons.close()`
  // cleanup in the return handles re-rendering when style props change.
  useEffect(() => {
    if (isEditor) return;
    if (!paypalReady || !paypalSdk?.Buttons) return;
    if (!paypalContainerRef.current) return;

    if (buttonsInstanceRef.current) {
      try {
        buttonsInstanceRef.current.close();
      } catch {
        /* ignore */
      }
      buttonsInstanceRef.current = null;
    }

    const container = paypalContainerRef.current;
    container.innerHTML = '';

    const buttons = paypalSdk.Buttons({
      style: {
        layout: 'vertical',
        shape: 'rect',
        color: paypalColor,
        label: paypalLabel,
        height: 48,
        tagline: false,
      },
      onClick: (_data: any, actions: any) => {
        const amt = computePayAmountRef.current();
        if (amt === null) {
          setErrorMsg(
            isDonationMode
              ? 'Please enter a donation amount.'
              : 'Please enter a valid amount.',
          );
          return actions.reject();
        }
        setErrorMsg('');
        setShowSuccess(false);
        return actions.resolve();
      },
      createOrder: (_data: any, actions: any) => {
        const amt = computePayAmountRef.current();
        if (amt === null) return null;
        const purchaseUnit: any = {
          amount: { value: amt.toFixed(2), currency_code: currencyCode },
          description: productLabel,
        };
        const noteValue = noteRef.current;
        if (allowCustomNote && noteValue) {
          purchaseUnit.custom_id = noteValue.slice(0, 120);
        }
        return actions.order.create({
          intent: 'CAPTURE',
          purchase_units: [purchaseUnit],
        });
      },
      onApprove: async (_data: any, actions: any) => {
        try {
          await actions.order.capture();
          setShowSuccess(true);
          setAmount('');
          setNote('');
          void incrementUsage().catch(() => undefined);
        } catch (err) {
          console.error('PayPal capture failed:', err);
          setErrorMsg('Payment could not be completed. Please try again.');
        }
      },
      onError: (err: unknown) => {
        console.error('PayPal error:', err);
        setErrorMsg('PayPal reported an error. Please try again.');
      },
      onCancel: () => {
        setErrorMsg('');
      },
    });

    buttonsInstanceRef.current = buttons;
    if (buttons.isEligible?.() === false) {
      setErrorMsg('PayPal is not available for this configuration.');
      return;
    }
    buttons.render(container).catch((err: unknown) => {
      console.error('PayPal render failed:', err);
      setErrorMsg('Failed to render PayPal button.');
    });

    return () => {
      try {
        buttons.close();
      } catch {
        /* ignore */
      }
    };
  }, [
    isEditor,
    paypalReady,
    paypalSdk,
    paypalColor,
    paypalLabel,
    productLabel,
    currencyCode,
    allowCustomNote,
    isDonationMode,
  ]);

  // Scoped CSS — site widgets cannot use `@wix/design-system`, so we inline
  // styles. Use a class prefix (`ppwb-`) to avoid collisions with site CSS.
  // Full <style> block omitted from this bundle for brevity — see source app.
  const scopedStyles = `/* … see source app for the full ~250 lines of styles … */`;

  const showHeader = !isDonationMode && !allowCustomAmount && !!fixedTotal;

  return (
    <div className="ppwb-wrap">
      <style>{scopedStyles}</style>

      {config?.ok && config.sandboxMode && (
        <div className="ppwb-sandbox-badge">Sandbox mode</div>
      )}

      {showHeader && (
        <div className="ppwb-header">
          <div className="ppwb-product">{productLabel}</div>
          <div className="ppwb-total">{fixedTotal}</div>
        </div>
      )}

      {isDonationMode && donationPrompt && (
        <div className="ppwb-prompt">{donationPrompt}</div>
      )}

      {/* Donation-mode preset chips — parsed from "5,10,25,50" string prop. */}
      {isDonationMode && presets.length > 0 && (
        <div className="ppwb-chips" role="group" aria-label="Suggested amounts">
          {presets.map((preset) => {
            const isSelected = selectedPreset === preset;
            return (
              <button
                key={preset}
                type="button"
                className="ppwb-chip"
                onClick={() => {
                  setAmount(String(preset));
                  setErrorMsg('');
                }}
                aria-pressed={isSelected}
              >
                {formatPresetLabel(preset, currencyCode)}
              </button>
            );
          })}
        </div>
      )}

      {allowCustomAmount && (
        <div className="ppwb-field">
          <span className="ppwb-field-prefix">{currencyCode}</span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            placeholder={isDonationMode ? 'Enter amount' : 'Amount'}
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="ppwb-input ppwb-input--with-prefix"
            inputMode="decimal"
          />
        </div>
      )}

      {allowCustomNote && (
        <div className="ppwb-field">
          <input
            type="text"
            placeholder={isDonationMode ? 'Add a message (optional)' : 'Add a note (optional)'}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="ppwb-input"
            maxLength={120}
          />
        </div>
      )}

      {/* Editor → static placeholder. Live site → real PayPal Smart Buttons. */}
      <div className="ppwb-paypal-buttons-wrap">
        {isEditor ? (
          <div
            className="ppwb-placeholder-button"
            role="img"
            aria-label="PayPal button preview (editor)"
          >
            <span className="ppwb-placeholder-label">
              {paypalLabel === 'donate' ? 'Donate' : 'Pay with PayPal'}
            </span>
          </div>
        ) : (
          <>
            {(configLoading || !paypalReady) && !errorMsg && (
              <div className="ppwb-button-skeleton" aria-label="Loading PayPal…">
                <span className="ppwb-spinner" aria-hidden="true" />
                <span>Loading PayPal…</span>
              </div>
            )}
            <div
              ref={paypalContainerRef}
              className="ppwb-paypal-buttons"
              style={{
                display: paypalReady && !errorMsg ? 'block' : 'none',
              }}
            />
          </>
        )}
      </div>
      {isEditor && (
        <div className="ppwb-editor-note">
          Live PayPal button only renders on your published site.
        </div>
      )}

      {errorMsg && (
        <div className="ppwb-message ppwb-message--error" role="alert">
          {errorMsg}
        </div>
      )}

      {showSuccess && (
        <div className="ppwb-message ppwb-message--success" role="status">
          {isDonationMode
            ? 'Thank you for your donation!'
            : 'Payment successful. Thank you!'}
        </div>
      )}

      <div className="ppwb-trust">
        <svg width="11" height="11" viewBox="0 0 16 16" aria-hidden="true">
          <path
            d="M8 1.5a3.5 3.5 0 0 0-3.5 3.5V7H4a1 1 0 0 0-1 1v5.5a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1h-.5V5A3.5 3.5 0 0 0 8 1.5zm-2 5.5V5a2 2 0 1 1 4 0v2H6z"
            fill="currentColor"
          />
        </svg>
        <span>Secure checkout encrypted by PayPal</span>
      </div>

      {(isTrue(showCardIcons) || isTrue(showPoweredBy)) && (
        <div className="ppwb-footer">
          {isTrue(showCardIcons) && <AcceptedCardsRow />}
          {isTrue(showPoweredBy) && <PoweredByPayPal />}
        </div>
      )}
    </div>
  );
};

// `reactToWebComponent` only supports string props. Booleans pass as
// 'true'/'false', numbers as '600'. Convert inside the component.
const customElement = reactToWebComponent(PayPalPayWidget, React, ReactDOM, {
  props: {
    productName: 'string',
    defaultAmount: 'string',
    currencyCode: 'string',
    buttonLabel: 'string',
    buttonColor: 'string',
    buttonTextColor: 'string',
    customAmountEnabled: 'string',
    customNoteEnabled: 'string',
    mode: 'string',
    presetAmounts: 'string',
    donationPrompt: 'string',
    showCardIcons: 'string',
    showPoweredBy: 'string',
    payButtonStyle: 'string',
  },
});

export default customElement;
