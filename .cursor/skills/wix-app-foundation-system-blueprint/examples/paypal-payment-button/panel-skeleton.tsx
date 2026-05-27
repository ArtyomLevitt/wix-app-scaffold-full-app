// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// SKELETON — distilled from paypal-payment-button/src/extensions/site/widgets/custom-elements/paypal-pay-button/panel.tsx (~540 lines).
// Goes at: src/extensions/site/widgets/custom-elements/<slug>/panel.tsx
//
// Distinctive PRPL panel patterns demonstrated here:
//   1. widget.getProp() on mount → seed local state from existing widget props (all strings)
//   2. widget.setProp() on every change → push back to the live widget
//   3. /api/app/check-premium → propagate to UI; gate "premium-only" controls with a <Premium> badge
//   4. Mode toggle ("fixed" vs "donation") makes whole sections appear/disappear
//   5. Style toggle ("native" vs "paypal") swaps which controls are relevant
//   6. SectionHelper banner pointing the merchant at the dashboard for connection setup
//   7. metaSiteId from /api/app/check-premium → "Manage in dashboard" deep link

import React, { type FC, type ReactNode, useCallback, useEffect, useState } from 'react';
import { widget } from '@wix/editor';
import { httpClient } from '@wix/essentials';
import {
  Badge, Box, Button, Dropdown, FormField, Input, Loader, NumberInput,
  SectionHelper, SidePanel, Text, ToggleSwitch, WixDesignSystemProvider,
} from '@wix/design-system';
import { ExternalLink } from '@wix/wix-ui-icons-common';
import '@wix/design-system/styles.global.css';
// ColorPickerField wraps WDS ColorPicker with a hex preview swatch — see source app for the full ~80-line component.
import { ColorPickerField } from './color-picker-field.tsx';

type PaymentMode = 'fixed' | 'donation';
type PayButtonStyle = 'native' | 'paypal';

const APP_DEF_ID = '<APP_ID>';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

const LabelWithBadge: FC<{ label: string; badge: ReactNode }> = ({ label, badge }) => (
  <Box align="space-between" verticalAlign="middle" gap="6px" width="100%">
    <Text size="small" weight="normal">{label}</Text>
    {badge}
  </Box>
);

const PremiumBadge: FC = () => (
  <Badge skin="premium" size="tiny" type="solid" uppercase>Premium</Badge>
);

const DEFAULTS = {
  productName: 'My Product',
  defaultAmount: 1,
  currencyCode: 'USD',
  buttonColor: '#0070BA',
  buttonTextColor: '#ffffff',
  customAmountEnabled: false,
  customNoteEnabled: false,
  mode: 'fixed' as PaymentMode,
  presetAmounts: '5,10,25,50',
  donationPrompt: 'Choose an amount to donate',
  showCardIcons: true,
  showPoweredBy: true,
  payButtonStyle: 'native' as PayButtonStyle,
};

const Panel: FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isPremium, setIsPremium] = useState(false);
  const [dashboardUrl, setDashboardUrl] = useState<string | null>(null);

  // Local state mirrors widget props. ALL widget props are strings — convert
  // booleans/numbers here.
  const [productName, setProductName] = useState(DEFAULTS.productName);
  const [defaultAmount, setDefaultAmount] = useState<number>(DEFAULTS.defaultAmount);
  const [currencyCode, setCurrencyCode] = useState(DEFAULTS.currencyCode);
  const [buttonColor, setButtonColor] = useState(DEFAULTS.buttonColor);
  const [buttonTextColor, setButtonTextColor] = useState(DEFAULTS.buttonTextColor);
  const [customAmountEnabled, setCustomAmountEnabled] = useState(DEFAULTS.customAmountEnabled);
  const [customNoteEnabled, setCustomNoteEnabled] = useState(DEFAULTS.customNoteEnabled);
  const [mode, setMode] = useState<PaymentMode>(DEFAULTS.mode);
  const [presetAmounts, setPresetAmounts] = useState(DEFAULTS.presetAmounts);
  const [donationPrompt, setDonationPrompt] = useState(DEFAULTS.donationPrompt);
  const [showCardIcons, setShowCardIcons] = useState(DEFAULTS.showCardIcons);
  const [showPoweredBy, setShowPoweredBy] = useState(DEFAULTS.showPoweredBy);
  const [payButtonStyle, setPayButtonStyle] = useState<PayButtonStyle>(DEFAULTS.payButtonStyle);

  // (1) Hydrate state from existing widget props on mount. The full app calls
  //     `widget.getProp(...)` for every single prop in parallel; here we only
  //     show a representative subset to keep the skeleton readable.
  useEffect(() => {
    Promise.all([
      widget.getProp('product-name'),
      widget.getProp('default-amount'),
      widget.getProp('currency-code'),
      widget.getProp('mode'),
      widget.getProp('preset-amounts'),
      widget.getProp('custom-note-enabled'),
      widget.getProp('pay-button-style'),
      // … the rest of the props (color, label, etc.) follow the same pattern.
    ])
      .then(([pn, da, cc, m, pa, cne, pbs]) => {
        setProductName(pn || DEFAULTS.productName);
        setDefaultAmount(da ? Number(da) : DEFAULTS.defaultAmount);
        setCurrencyCode(cc || DEFAULTS.currencyCode);
        setMode(m === 'donation' ? 'donation' : 'fixed');
        setPresetAmounts(pa || DEFAULTS.presetAmounts);
        setCustomNoteEnabled(cne === 'true');
        setPayButtonStyle(pbs === 'paypal' ? 'paypal' : 'native');
      })
      .catch((err) => console.error('Failed to load widget props', err))
      .finally(() => setIsLoading(false));
  }, []);

  // (2) Premium check + dashboard deep-link. `metaSiteId` (or `instanceId`
  //     fallback) lets us build a "Manage in dashboard" link that opens the
  //     app page with the right site context.
  useEffect(() => {
    let cancelled = false;
    httpClient
      .fetchWithAuth(`${getApiBase()}/api/app/check-premium`)
      .then(async (res) => {
        if (!res.ok) return;
        const data = (await res.json()) as {
          isPremium?: boolean;
          instanceId?: string;
          metaSiteId?: string;
        };
        if (cancelled) return;
        setIsPremium(!!data.isPremium);
        const siteRef = data.metaSiteId || data.instanceId;
        if (siteRef) {
          setDashboardUrl(`https://manage.wix.com/dashboard/${siteRef}/app/${APP_DEF_ID}`);
        }
      })
      .catch(() => setIsPremium(false));
    return () => { cancelled = true; };
  }, []);

  // (3) Every change handler updates local state AND pushes via widget.setProp.
  //     Booleans → 'true'/'false'. Numbers → String(n).
  const onProductNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setProductName(e.target.value);
    widget.setProp('product-name', e.target.value);
  }, []);

  const onAmountChange = useCallback((v: number | null) => {
    const next = typeof v === 'number' && Number.isFinite(v) ? v : 0;
    setDefaultAmount(next);
    widget.setProp('default-amount', String(next));
  }, []);

  const onModeChange = useCallback((opt: { id: string | number } | null) => {
    if (!opt) return;
    const v: PaymentMode = opt.id === 'donation' ? 'donation' : 'fixed';
    setMode(v);
    widget.setProp('mode', v);
  }, []);

  const onCustomNoteToggle = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setCustomNoteEnabled(e.target.checked);
    widget.setProp('custom-note-enabled', String(e.target.checked));
  }, []);

  const onPayButtonStyleChange = useCallback((opt: { id: string | number } | null) => {
    if (!opt) return;
    const v: PayButtonStyle = opt.id === 'paypal' ? 'paypal' : 'native';
    setPayButtonStyle(v);
    widget.setProp('pay-button-style', v);
  }, []);

  const isDonationMode = mode === 'donation';

  return (
    <WixDesignSystemProvider>
      <SidePanel width="320" height="100vh">
        <SidePanel.Header
          title="PayPal Pay button"
          subtitle="Accept payments with PayPal Smart Buttons"
        />
        <SidePanel.Content noPadding stretchVertically>
          {isLoading ? (
            <Box direction="vertical" align="center" verticalAlign="middle" gap="12px" padding="48px 16px">
              <Loader size="medium" />
              <Text size="small" secondary>Loading settings…</Text>
            </Box>
          ) : (
            <>
              {/* (4) Manage-in-dashboard deep link from check-premium response */}
              {dashboardUrl && (
                <SidePanel.Field>
                  <Button size="small" priority="secondary" prefixIcon={<ExternalLink />}
                    onClick={() => window.open(dashboardUrl, '_blank')} fullWidth>
                    Manage in dashboard
                  </Button>
                </SidePanel.Field>
              )}

              {/* (5) Banner pointing at the dashboard for the one-time PayPal connection step */}
              <SidePanel.Field>
                <SectionHelper skin="standard" size="small" title="Connect PayPal in the dashboard">
                  Add your PayPal client ID from the app dashboard to start accepting live payments.
                </SectionHelper>
              </SidePanel.Field>

              {/* (6) Mode toggle — controls which sections render below */}
              <SidePanel.Section title="Mode">
                <SidePanel.Field>
                  <FormField label="Button purpose">
                    <Dropdown
                      selectedId={mode}
                      onSelect={onModeChange}
                      options={[
                        { id: 'fixed', value: 'Single payment' },
                        { id: 'donation', value: 'Donation' },
                      ]}
                    />
                  </FormField>
                </SidePanel.Field>
              </SidePanel.Section>

              {/* (7) Mode-aware sections — Price for fixed, Suggested amounts for donation */}
              <SidePanel.Section title={isDonationMode ? 'Donation' : 'Product'}>
                <SidePanel.Field>
                  <FormField label={isDonationMode ? 'Cause name' : 'Product name'} required>
                    <Input value={productName} onChange={onProductNameChange} />
                  </FormField>
                </SidePanel.Field>

                {!isDonationMode && (
                  <SidePanel.Field>
                    <FormField label="Price" required>
                      <NumberInput value={defaultAmount} onChange={onAmountChange} min={0} step={1} hideStepper />
                    </FormField>
                  </SidePanel.Field>
                )}

                {isDonationMode && (
                  <SidePanel.Field>
                    <FormField label="Suggested amounts"
                      infoContent="Comma-separated, e.g. 5,10,25,50.">
                      <Input value={presetAmounts}
                        onChange={(e) => { setPresetAmounts(e.target.value); widget.setProp('preset-amounts', e.target.value); }}
                        placeholder="5,10,25,50" />
                    </FormField>
                  </SidePanel.Field>
                )}
              </SidePanel.Section>

              {/* (8) Premium gating — disabled toggle + Premium badge + helpful infoContent */}
              <SidePanel.Section title="Customer choices">
                <SidePanel.Field>
                  <FormField
                    label={<LabelWithBadge label="Let customers add a note" badge={<PremiumBadge />} />}
                    infoContent={
                      isPremium
                        ? 'Adds an optional note field that is sent to PayPal with the payment.'
                        : 'Available on a paid plan. Upgrade to let visitors send a note.'
                    }
                  >
                    <ToggleSwitch
                      checked={customNoteEnabled}
                      disabled={!isPremium}
                      onChange={onCustomNoteToggle}
                    />
                  </FormField>
                </SidePanel.Field>
              </SidePanel.Section>

              {/* (9) Style toggle — swaps which controls are relevant below */}
              <SidePanel.Section title="Button style">
                <SidePanel.Field>
                  <FormField label="Pay button"
                    infoContent='"Native" shows your branded button. "PayPal Smart Button" shows the official PayPal-branded button.'>
                    <Dropdown
                      selectedId={payButtonStyle}
                      onSelect={onPayButtonStyleChange}
                      options={[
                        { id: 'native', value: 'Custom branded button' },
                        { id: 'paypal', value: 'PayPal Smart Button' },
                      ]}
                    />
                  </FormField>
                </SidePanel.Field>
              </SidePanel.Section>

              {/* Color pickers ONLY make sense for the native button — hide them for the PayPal Smart Button */}
              {payButtonStyle === 'native' && (
                <SidePanel.Section title="Colors">
                  <ColorPickerField label="Button color" value={buttonColor}
                    onChange={(v) => { setButtonColor(v); widget.setProp('button-color', v); }} />
                  <ColorPickerField label="Text color" value={buttonTextColor}
                    onChange={(v) => { setButtonTextColor(v); widget.setProp('button-text-color', v); }} />
                </SidePanel.Section>
              )}

              {/* … remaining sections (footer toggles for card icons, "Powered by PayPal", etc.) follow the same pattern … */}
            </>
          )}
        </SidePanel.Content>
      </SidePanel>
    </WixDesignSystemProvider>
  );
};

export default Panel;
