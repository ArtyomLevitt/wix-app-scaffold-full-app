import React, { type FC, useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import r2wc from 'react-to-webcomponent';
import { httpClient } from '@wix/essentials';
import { customPurchaseFlow } from '@wix/site-pricing-plans';
import { withIntlProvider } from '../../../../../intl/withIntlProvider';
import { useIntl } from 'react-intl';
import ErrorBoundary from '../../../../_shared/error-boundary';
import PricingCards from '../../../../_shared/PricingCards';
import {
  migrateSettings,
  type AppSettings,
  type PricingPlan,
  type WidgetDataResponse,
} from '../../../../_shared/pricing-types';

const getApiBase = (): string => {
  try {
    return new URL(import.meta.url).origin;
  } catch {
    return '';
  }
};

function fetchWithTimeout(url: string, ms = 6000): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return httpClient
    .fetchWithAuth(url, { signal: controller.signal })
    .finally(() => clearTimeout(timer));
}

function isLikelyEditorPreview(): boolean {
  if (typeof window === 'undefined') return false;
  const markers = ['editor.wix.com', 'wixstudio.com', 'parastorage.com'];
  try {
    const href = window.location.href;
    if (markers.some((m) => href.includes(m))) return true;
    const ref = document.referrer || '';
    if (markers.some((m) => ref.includes(m))) return true;
  } catch {
    /* ignore */
  }
  try {
    localStorage.setItem('__ppt_probe', '1');
    localStorage.removeItem('__ppt_probe');
  } catch {
    return true;
  }
  return false;
}

const WidgetInner: FC = () => {
  const intl = useIntl();
  const t = (id: string) => intl.formatMessage({ id });
  const [loading, setLoading] = useState(true);
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [settings, setSettings] = useState<AppSettings>(migrateSettings(null));
  const [isPremium, setIsPremium] = useState(false);
  const isEditor = isLikelyEditorPreview();

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetchWithTimeout(`${getApiBase()}/api/widget/data`);
      const data = (await res.json()) as WidgetDataResponse;
      setPlans(data.plans ?? []);
      setSettings(migrateSettings(data.settings));
      setIsPremium(Boolean(data.isPremium));
    } catch (e) {
      console.error('[widget] load failed', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCta = async (plan: PricingPlan) => {
    if (isEditor) return;
    try {
      if (plan.ctaMode === 'wix_plan' && plan.ctaTarget) {
        await customPurchaseFlow.navigateToCheckout({ planId: plan.ctaTarget });
        return;
      }
      if (plan.ctaMode === 'custom_url' && plan.ctaTarget) {
        window.open(plan.ctaTarget, '_blank', 'noopener,noreferrer');
        return;
      }
      if (plan.ctaMode === 'contact' && plan.ctaTarget) {
        window.open(plan.ctaTarget, '_blank', 'noopener,noreferrer');
        return;
      }
    } catch (e) {
      console.error('[widget] CTA failed', e);
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
        {t('widget.loading')}
      </div>
    );
  }

  if (isEditor) {
    return (
      <div
        style={{
          width: '100%',
          height: '100%',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
          boxSizing: 'border-box',
          background: '#F3F4F6',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, sans-serif',
          textAlign: 'center',
        }}
      >
        <PricingCards
          plans={plans}
          settings={settings}
          isPremium={isPremium}
          isMobile={false}
          onCtaClick={() => undefined}
          emptyLabel={t('widget.editorPreview')}
          showWatermark={!isPremium}
          watermarkLabel={t('widget.watermark')}
        />
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 320 }}>
      <PricingCards
        plans={plans}
        settings={settings}
        isPremium={isPremium}
        isMobile={typeof window !== 'undefined' && window.innerWidth < 768}
        onCtaClick={handleCta}
        emptyLabel={t('widget.empty')}
        showWatermark={!isPremium}
        watermarkLabel={t('widget.watermark')}
      />
    </div>
  );
};

const WrappedWidget = withIntlProvider(() => (
  <ErrorBoundary surface="widget">
    <WidgetInner />
  </ErrorBoundary>
));

const customElement = r2wc(WrappedWidget, React, ReactDOM, {
  shadow: 'open',
});

export default customElement;
