import React, { useCallback, useEffect, useState } from 'react';
import { httpClient } from '@wix/essentials';
import { DEFAULT_SETTINGS, type AppSettings } from '../../../../_shared/app-settings-types';
import { PricingCardsView } from '../../../../_shared/PricingCardsView';
import type { PricingPlanRecord } from '../../../../_shared/pricing-plans-types';
import { getApiBase, isLikelyEditorPreview } from '../../../../_shared/widget-api';

interface WidgetPayload {
  settings: AppSettings;
  plans: PricingPlanRecord[];
  isPremium: boolean;
  showWatermark: boolean;
}

export const PlanPricingWidget: React.FC = () => {
  const [data, setData] = useState<WidgetPayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const editorPreview = isLikelyEditorPreview();

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await httpClient.fetchWithAuth(`${getApiBase()}/api/widget/settings`);
        if (!res.ok) throw new Error('load failed');
        const json = (await res.json()) as WidgetPayload;
        if (!cancelled) setData(json);
      } catch (e) {
        console.error('[widget] load failed', e);
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
    if (plan.ctaMode === 'custom_url' && plan.ctaTarget) {
      window.open(plan.ctaTarget, '_blank', 'noopener,noreferrer');
      return;
    }
    if (plan.ctaMode === 'contact_us') {
      window.open(plan.ctaTarget || '/contact', '_self');
      return;
    }
    if (plan.ctaMode === 'wix_plan' && plan.wixPricingPlanId) {
      try {
        const mod = await import('@wix/pricing-plans');
        const customPurchaseFlow = (mod as { customPurchaseFlow?: { navigateToCheckout: (opts: { planId: string }) => Promise<void> } }).customPurchaseFlow;
        if (customPurchaseFlow?.navigateToCheckout) {
          await customPurchaseFlow.navigateToCheckout({ planId: plan.wixPricingPlanId });
          return;
        }
      } catch (e) {
        console.warn('[widget] pricing-plans SDK fallback', e);
      }
      window.location.href = `/pricing-plans/checkout/${plan.wixPricingPlanId}`;
    }
  }, []);

  if (loading) {
    return (
      <div style={{ padding: 24, textAlign: 'center', minHeight: 320 }}>
        Loading pricing plans…
      </div>
    );
  }

  if (editorPreview && !data?.plans?.length) {
    return (
      <div
        style={{
          padding: 32,
          border: '2px dashed #d1d5db',
          borderRadius: 12,
          textAlign: 'center',
          minHeight: 320,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Inter", "Segoe UI", Roboto, Arial, sans-serif',
        }}
      >
        Pricing Plans Compare preview — add plans in the app dashboard to see cards here.
      </div>
    );
  }

  if (error || !data) {
    return (
      <div style={{ padding: 24, textAlign: 'center', color: '#b91c1c' }}>
        Unable to load pricing plans.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '100%', minHeight: 320 }}>
      <PricingCardsView
        plans={data.plans}
        settings={data.settings ?? DEFAULT_SETTINGS}
        isPremium={data.isPremium}
        showWatermark={data.showWatermark}
        onCtaClick={handleCta}
        emptyMessage="Add your first plan in the dashboard"
      />
    </div>
  );
};
