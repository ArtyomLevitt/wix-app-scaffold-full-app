import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { jsonResponse, optionsResponse } from '../../../extensions/_shared/cors';
import { COLLECTION_APP_SETTINGS, COLLECTION_PRICING_PLANS, SETTINGS_DOC_KEY } from '../../../extensions/_shared/collections';
import {
  applyPremiumGating,
  DEFAULT_SETTINGS,
  migrateSettings,
  type AppSettingsRecord,
} from '../../../extensions/_shared/app-settings-types';
import { getPremiumStatus } from '../../../extensions/_shared/premium-server';
import {
  enforceFreePlanLimit,
  stripPremiumPlanFields,
  type PricingPlanRecord,
} from '../../../extensions/_shared/pricing-plan-types';

const elevatedQuery = auth.elevate(items.query);

export const OPTIONS: APIRoute = async ({ request }) => optionsResponse(request);

export const GET: APIRoute = async ({ request }) => {
  try {
    const { isPremium } = await getPremiumStatus();

    const [plansResult, settingsResult] = await Promise.all([
      elevatedQuery(COLLECTION_PRICING_PLANS).ascending('sortOrder').find(),
      elevatedQuery(COLLECTION_APP_SETTINGS).eq('key', SETTINGS_DOC_KEY).limit(1).find(),
    ]);

    const planItems = (plansResult.items ?? []) as Array<Record<string, unknown>>;
    let plans: PricingPlanRecord[] = planItems.map((item) => ({
      _id: item._id as string,
      name: String(item.name ?? ''),
      price: Number(item.price ?? 0),
      currency: String(item.currency ?? 'USD'),
      period: (item.period as PricingPlanRecord['period']) ?? 'monthly',
      tagline: String(item.tagline ?? ''),
      featuresJson: String(item.featuresJson ?? '[]'),
      badge: (item.badge as PricingPlanRecord['badge']) ?? '',
      isHighlighted: Boolean(item.isHighlighted),
      ctaMode: (item.ctaMode as PricingPlanRecord['ctaMode']) ?? 'wixCheckout',
      ctaTarget: String(item.ctaTarget ?? ''),
      ctaLabel: String(item.ctaLabel ?? 'Get started'),
      sortOrder: Number(item.sortOrder ?? 0),
      wixPlanId: String(item.wixPlanId ?? ''),
    }));

    plans = enforceFreePlanLimit(
      plans.map((plan) => stripPremiumPlanFields(plan, isPremium)),
      isPremium,
    );

    const settingsItem = (settingsResult.items?.[0] ?? null) as Record<string, unknown> | null;
    const advancedDesign = settingsItem?.advancedDesign as AppSettingsRecord['advancedDesign'] | undefined;
    const settings = applyPremiumGating(
      migrateSettings({
        theme: settingsItem?.theme as AppSettingsRecord['theme'],
        fontFamily: String(settingsItem?.fontFamily ?? ''),
        highlightColor: String(settingsItem?.highlightColor ?? DEFAULT_SETTINGS.highlightColor),
        cardStyle: settingsItem?.cardStyle as AppSettingsRecord['cardStyle'],
        showBilledAs: settingsItem?.showBilledAs !== false,
        advancedDesign: advancedDesign ?? DEFAULT_SETTINGS.advancedDesign,
      }),
      isPremium,
    );

    return jsonResponse({ ok: true, plans, settings, isPremium, showWatermark: !isPremium }, request);
  } catch (error) {
    console.error('[widget/data GET]', error);
    return jsonResponse(
      {
        ok: true,
        plans: [],
        settings: applyPremiumGating(migrateSettings({}), false),
        isPremium: false,
        showWatermark: true,
      },
      request,
    );
  }
};
