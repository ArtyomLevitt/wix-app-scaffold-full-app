import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import {
  COLLECTION_APP_SETTINGS,
  COLLECTION_PRICING_PLANS,
  SETTINGS_DOC_KEY,
} from '../../../extensions/_shared/collections';
import {
  applyPremiumGating,
  migrateSettings,
  planRecordToPlan,
  type AppSettings,
} from '../../../extensions/_shared/pricing-types';
import { getPremiumInfo, jsonResponse } from '../../../extensions/_shared/api-helpers';

const elevatedQuery = auth.elevate(items.query);

function recordToSettings(item: Record<string, unknown>): AppSettings {
  return migrateSettings({
    theme: item.theme as AppSettings['theme'],
    fontFamily: item.fontFamily as AppSettings['fontFamily'],
    highlightColor: item.highlightColor as string,
    cardStyle: item.cardStyle as AppSettings['cardStyle'],
    showBilledAs: item.showBilledAs as boolean,
    advancedDesign: item.advancedDesign as AppSettings['advancedDesign'],
    _v: item.v as number,
  });
}

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const premium = await getPremiumInfo();

    const plansRes = await elevatedQuery(COLLECTION_PRICING_PLANS)
      .ascending('sortOrder')
      .limit(100)
      .find();

    let plans = (plansRes.items ?? []).map((item) =>
      planRecordToPlan(item as Record<string, unknown>),
    );

    if (!premium.isPremium) {
      plans = plans.slice(0, 3).map((p) => ({ ...p, badge: '' as const }));
    }

    const settingsRes = await elevatedQuery(COLLECTION_APP_SETTINGS)
      .eq('key', SETTINGS_DOC_KEY)
      .limit(1)
      .find();
    const row = (settingsRes.items?.[0] as Record<string, unknown>) ?? null;
    const settings = applyPremiumGating(
      row ? recordToSettings(row) : migrateSettings(null),
      premium.isPremium,
    );

    return jsonResponse({
      plans,
      settings,
      isPremium: premium.isPremium,
    });
  } catch (error) {
    console.error('[widget/data GET]', error);
    return jsonResponse({
      plans: [],
      settings: migrateSettings(null),
      isPremium: false,
      error: 'load_failed',
    });
  }
};
