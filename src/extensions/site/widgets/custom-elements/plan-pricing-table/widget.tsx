import React, { type FC, useCallback, useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import reactToWebComponent from 'react-to-webcomponent';
import { httpClient } from '@wix/essentials';
import { customPurchaseFlow } from '@wix/site-pricing-plans';
import { ErrorBoundary } from '../../../../_shared/error-boundary';
import { migrateSettings, type AppSettingsRecord } from '../../../../_shared/app-settings-types';
import { PlanCardsRenderer } from '../../../../_shared/plan-cards-renderer';
import type { PricingPlanRecord } from '../../../../_shared/pricing-plan-types';

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

function detectSandboxedFrame(): boolean {
  try {
    localStorage.getItem('__probe__');
    return false;
  } catch {
    return true;
  }
}

function isLikelyEditorPreview(): boolean {
  if (typeof window === 'undefined') return false;
  const markers = ['editor.wix.com', 'wixstudio.com', 'wix.com/_partials'];
  try {
    const ancestors = window.location.ancestorOrigins;
    if (ancestors) {
      for (let i = 0; i < ancestors.length; i++) {
        if (markers.some((m) => (ancestors[i] || '').includes(m))) return true;
      }
    }
  } catch {
    /* ignore */
  }
  try {
    const ref = document.referrer || '';
    if (markers.some((m) => ref.includes(m))) return true;
  } catch {
    /* ignore */
  }
  return detectSandboxedFrame();
}

interface WidgetData {
  plans: PricingPlanRecord[];
  settings: AppSettingsRecord;
  isPremium: boolean;
  showWatermark: boolean;
}

const WidgetInner: FC = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<WidgetData | null>(null);
  const [error, setError] = useState(false);
  const editorPreview = isLikelyEditorPreview();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetchWithTimeout(`${getApiBase()}/api/widget/data`);
        const json = await res.json();
        if (cancelled) return;
        setData({
          plans: json.plans ?? [],
          settings: migrateSettings(json.settings ?? {}),
          isPremium: Boolean(json.isPremium),
          showWatermark: Boolean(json.showWatermark),
        });
      } catch (err) {
        console.error('[widget] load failed', err);
        if (!cancelled) setError(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleCta = useCallback(async (plan: PricingPlanRecord) => {
    if (plan.ctaMode === 'customUrl' && plan.ctaTarget) {
      window.open(plan.ctaTarget, '_blank', 'noopener,noreferrer');
      return;
    }
    if (plan.ctaMode === 'contact') {
      if (plan.ctaTarget) {
        window.open(plan.ctaTarget, '_blank', 'noopener,noreferrer');
      }
      return;
    }
    const planId = plan.wixPlanId || plan.ctaTarget;
    if (!planId) return;
    try {
      await customPurchaseFlow.navigateToCheckout({ planId });
    } catch (err) {
      console.error('[widget] checkout failed', err);
    }
  }, []);

  if (editorPreview && !loading) {
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
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          background: '#F8FAFC',
          border: '1px dashed #CBD5E1',
          borderRadius: 12,
          color: '#475569',
          textAlign: 'center',
        }}
      >
        Pricing Plans Compare preview — publish your site to see live plan cards.
      </div>
    );
  }

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
          color: '#64748B',
        }}
      >
        Loading…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 24, color: '#64748B', minHeight: 320 }}>
        Unable to load pricing plans.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 320 }}>
      <PlanCardsRenderer
        plans={data.plans}
        settings={data.settings}
        isPremium={data.isPremium}
        showWatermark={data.showWatermark}
        emptyMessage="Add your first plan in the dashboard"
        onCtaClick={handleCta}
      />
    </div>
  );
};

const WidgetWithBoundary: FC = () => (
  <ErrorBoundary surface="widget">
    <WidgetInner />
  </ErrorBoundary>
);

const WebComponent = reactToWebComponent(WidgetWithBoundary, React, ReactDOM);

if (typeof customElements !== 'undefined' && !customElements.get('plan-pricing-table')) {
  customElements.define('plan-pricing-table', WebComponent);
}

export default WidgetWithBoundary;
