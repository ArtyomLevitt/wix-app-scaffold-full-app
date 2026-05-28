import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import {
  COLLECTION_APP_SETTINGS,
  COLLECTION_PRICING_PLANS,
  SETTINGS_DOC_KEY,
} from './collections';
import {
  applyPremiumGating,
  applyPlanPremiumGating,
  DEFAULT_SETTINGS,
  migrateSettings,
  type AppSettings,
  type PricingPlanRow,
} from './pricing-types';

const elevatedQuery = auth.elevate(items.query);
const elevatedInsert = auth.elevate(items.insert);
const elevatedUpdate = auth.elevate(items.update);
const elevatedRemove = auth.elevate(items.remove);

export async function loadAppSettings(): Promise<AppSettings> {
  const res = await elevatedQuery(COLLECTION_APP_SETTINGS)
    .eq('key', SETTINGS_DOC_KEY)
    .limit(1)
    .find();
  const row = res.items[0] as { settings?: Record<string, unknown> } | undefined;
  if (!row?.settings) return { ...DEFAULT_SETTINGS };
  return migrateSettings(row.settings);
}

export async function saveAppSettings(settings: AppSettings): Promise<void> {
  const res = await elevatedQuery(COLLECTION_APP_SETTINGS)
    .eq('key', SETTINGS_DOC_KEY)
    .limit(1)
    .find();
  const payload = { key: SETTINGS_DOC_KEY, settings, v: String(settings.v) };
  if (res.items.length > 0) {
    await elevatedUpdate(COLLECTION_APP_SETTINGS, {
      ...payload,
      _id: res.items[0]._id,
    });
  } else {
    await elevatedInsert(COLLECTION_APP_SETTINGS, payload);
  }
}

export async function loadPricingPlans(): Promise<PricingPlanRow[]> {
  const res = await elevatedQuery(COLLECTION_PRICING_PLANS).ascending('sortOrder').find();
  return (res.items as PricingPlanRow[]).map((row) => ({
    ...row,
    featuresJson: row.featuresJson || '[]',
  }));
}

export async function savePricingPlans(plans: PricingPlanRow[]): Promise<void> {
  const existing = await elevatedQuery(COLLECTION_PRICING_PLANS).find();
  const existingIds = new Set(existing.items.map((i) => i._id));

  for (const plan of plans) {
    const payload = { ...plan };
    if (plan._id && existingIds.has(plan._id)) {
      await elevatedUpdate(COLLECTION_PRICING_PLANS, payload);
      existingIds.delete(plan._id);
    } else {
      const { _id, ...insertPayload } = payload;
      await elevatedInsert(COLLECTION_PRICING_PLANS, insertPayload);
    }
  }

  for (const orphanId of existingIds) {
    if (orphanId) await elevatedRemove(COLLECTION_PRICING_PLANS, orphanId);
  }
}

export async function getWidgetPayload(isPremium: boolean): Promise<{
  settings: AppSettings;
  plans: PricingPlanRow[];
}> {
  const [settings, plans] = await Promise.all([loadAppSettings(), loadPricingPlans()]);
  return {
    settings: applyPremiumGating(settings, isPremium),
    plans: plans.map((p) => applyPlanPremiumGating(p, isPremium)),
  };
}
