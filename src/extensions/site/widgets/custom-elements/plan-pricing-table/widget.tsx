import React, { type FC, useCallback, useEffect, useState } from 'react';
import reactToWebComponent from 'react-to-webcomponent';
import ReactDOM from 'react-dom';
import { httpClient } from '@wix/essentials';

import { ErrorBoundary } from '../../../../_shared/error-boundary';
import { PricingCardsView } from '../../../../_shared/PricingCardsView';
import type { AppSettings, PricingPlanRow } from '../../../../_shared/pricing-types';
import { DEFAULT_SETTINGS } from '../../../../_shared/pricing-types';
import { loadMessages, getLocaleSafe } from '../../../../../intl/withIntlProvider';
import { IntlProvider, useIntl } from 'react-intl';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

async function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    return await httpClient.fetchWithAuth(url, { signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

const ContactModal: FC<{
  open: boolean;
  email: string;
  onClose: () => void;
}> = ({ open, email, onClose }) => {
  const intl = useIntl();
  if (!open) return null;
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999,
      }}
      onClick={onClose}
    >
      <div
        style={{ background: '#fff', padding: 24, borderRadius: 12, maxWidth: 400, width: '90%' }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ margin: '0 0 12px' }}>{intl.formatMessage({ id: 'widget.contactTitle' })}</h3>
        <p style={{ margin: '0 0 16px', fontSize: 14 }}>
          {intl.formatMessage({ id: 'widget.contactDesc' })}
        </p>
        <a
          href={`mailto:${email}`}
          style={{
            display: 'inline-block',
            padding: '10px 20px',
            background: '#6B21A8',
            color: '#fff',
            borderRadius: 8,
            textDecoration: 'none',
          }}
        >
          {intl.formatMessage({ id: 'widget.contactSubmit' })}
        </a>
      </div>
    </div>
  );
};

const WidgetInner: FC = () => {
  const intl = useIntl();
  const [loading, setLoading] = useState(true);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [plans, setPlans] = useState<PricingPlanRow[]>([]);
  const [isPremium, setIsPremium] = useState(false);
  const [showWatermark, setShowWatermark] = useState(true);
  const [contactPlan, setContactPlan] = useState<PricingPlanRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const base = getApiBase();
      const res = await fetchWithTimeout(`${base}/api/widget/settings`);
      if (!res.ok) throw new Error('fetch_failed');
      const data = await res.json();
      setSettings(data.settings || DEFAULT_SETTINGS);
      setPlans(data.plans || []);
      setIsPremium(!!data.isPremium);
      setShowWatermark(data.showWatermark !== false && !data.isPremium);
    } catch (e) {
      console.error('[widget] load failed', e);
      setError(intl.formatMessage({ id: 'widget.loadError' }));
    } finally {
      setLoading(false);
    }
  }, [intl]);

  useEffect(() => {
    load();
  }, [load]);

  const handleCta = async (plan: PricingPlanRow) => {
    if (plan.ctaMode === 'customUrl' && plan.customUrl) {
      window.open(plan.customUrl, '_blank', 'noopener,noreferrer');
      return;
    }
    if (plan.ctaMode === 'contactForm') {
      setContactPlan(plan);
      return;
    }
    if (plan.ctaMode === 'wixCheckout' && plan.wixPlanId) {
      try {
        const base = getApiBase();
        const res = await httpClient.fetchWithAuth(`${base}/api/wix-pricing-plans/checkout`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            planId: plan.wixPlanId,
            postFlowUrl: typeof window !== 'undefined' ? window.location.href : undefined,
          }),
        });
        const data = await res.json();
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'no_url');
        }
      } catch (e) {
        console.error('[widget] checkout failed', e);
        alert(intl.formatMessage({ id: 'widget.checkoutError' }));
      }
    }
  };

  if (loading) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
        }}
      >
        {intl.formatMessage({ id: 'widget.loading' })}
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minHeight: 320 }}>
        {error}
        <button type="button" onClick={load} style={{ display: 'block', margin: '12px auto' }}>
          {intl.formatMessage({ id: 'widget.retry' })}
        </button>
      </div>
    );
  }

  return (
    <>
      <PricingCardsView
        settings={settings}
        plans={plans}
        isPremium={isPremium}
        showWatermark={showWatermark}
        onCtaClick={handleCta}
        labels={{
          emptyTitle: intl.formatMessage({ id: 'widget.emptyTitle' }),
          emptyDesc: intl.formatMessage({ id: 'widget.emptyDesc' }),
          watermark: intl.formatMessage({ id: 'widget.watermark' }),
          billedAs: intl.formatMessage({ id: 'widget.billedAs' }),
          badgeMostPopular: intl.formatMessage({ id: 'badge.mostPopular' }),
          badgeNew: intl.formatMessage({ id: 'badge.new' }),
          badgeCrown: intl.formatMessage({ id: 'badge.crown' }),
        }}
      />
      <ContactModal
        open={!!contactPlan}
        email={contactPlan?.contactEmail || ''}
        onClose={() => setContactPlan(null)}
      />
    </>
  );
};

const WidgetWithIntl: FC = () => {
  const [messages, setMessages] = useState<Record<string, string>>({});
  const [locale, setLocale] = useState('en');

  useEffect(() => {
    (async () => {
      const loc = await getLocaleSafe();
      const msgs = await loadMessages(loc);
      setLocale(loc);
      setMessages(msgs);
    })();
  }, []);

  if (!Object.keys(messages).length) {
    return null;
  }

  return (
    <IntlProvider locale={locale} messages={messages} defaultLocale="en">
      <WidgetInner />
    </IntlProvider>
  );
};

const WrappedWidget: FC = () => (
  <ErrorBoundary surface="widget">
    <WidgetWithIntl />
  </ErrorBoundary>
);

const PlanPricingTableElement = reactToWebComponent(WrappedWidget, React, ReactDOM);

if (!customElements.get('plan-pricing-table')) {
  customElements.define('plan-pricing-table', PlanPricingTableElement);
}

export default WrappedWidget;
