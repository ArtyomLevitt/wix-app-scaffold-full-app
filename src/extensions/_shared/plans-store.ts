import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { COLLECTION_PRICING_PLANS } from './collections';
import { parsePlanItem, type PricingPlanRecord } from './pricing-plans-types';
import { getPremiumInfo } from '../../pages/api/_shared/premium';

const elevatedQuery = auth.elevate(items.query);
const elevatedInsert = auth.elevate(items.insert);
const elevatedUpdate = auth.elevate(items.update);
const elevatedRemove = auth.elevate(items.remove);

export async function listPricingPlans(): Promise<PricingPlanRecord[]> {
  const res = await elevatedQuery(COLLECTION_PRICING_PLANS).ascending('sortOrder').limit(100).find();
  return (res.items ?? []).map((item) => parsePlanItem(item as Record<string, unknown>));
}

export async function listPublicPricingPlans(): Promise<PricingPlanRecord[]> {
  const premium = await getPremiumInfo();
  const plans = await listPricingPlans();
  if (premium.isPremium) return plans;
  return plans.map((p) => ({ ...p, badge: '' as const }));
}

export function sanitizePlanInput(
  body: Record<string, unknown>,
  isPremium: boolean,
): Partial<PricingPlanRecord> {
  const patch: Partial<PricingPlanRecord> = {};
  if (body.name !== undefined) patch.name = String(body.name);
  if (body.price !== undefined) patch.price = String(body.price);
  if (body.period !== undefined) patch.period = body.period as PricingPlanRecord['period'];
  if (body.tagline !== undefined) patch.tagline = String(body.tagline);
  if (body.featuresJson !== undefined) patch.featuresJson = body.featuresJson as PricingPlanRecord['featuresJson'];
  if (body.ctaMode !== undefined) patch.ctaMode = body.ctaMode as PricingPlanRecord['ctaMode'];
  if (body.ctaLabel !== undefined) patch.ctaLabel = String(body.ctaLabel);
  if (body.ctaTarget !== undefined) patch.ctaTarget = String(body.ctaTarget);
  if (body.wixPricingPlanId !== undefined) patch.wixPricingPlanId = String(body.wixPricingPlanId);
  if (body.sortOrder !== undefined) patch.sortOrder = Number(body.sortOrder);
  if (body.isHighlighted !== undefined) patch.isHighlighted = Boolean(body.isHighlighted);
  if (body.badge !== undefined) {
    patch.badge = isPremium ? (body.badge as PricingPlanRecord['badge']) : '';
  }
  return patch;
}

export async function createPricingPlan(
  data: Partial<PricingPlanRecord>,
  maxPlans: number,
): Promise<PricingPlanRecord> {
  const existing = await listPricingPlans();
  if (existing.length >= maxPlans) {
    throw new Error('plan-limit-reached');
  }
  const sortOrder = data.sortOrder ?? existing.length;
  const created = await elevatedInsert(COLLECTION_PRICING_PLANS, {
    ...data,
    sortOrder,
  });
  return parsePlanItem(created as Record<string, unknown>);
}

export async function updatePricingPlan(
  id: string,
  data: Partial<PricingPlanRecord>,
): Promise<PricingPlanRecord> {
  const updated = await elevatedUpdate(COLLECTION_PRICING_PLANS, { _id: id, ...data });
  return parsePlanItem(updated as Record<string, unknown>);
}

export async function deletePricingPlan(id: string): Promise<void> {
  await elevatedRemove(COLLECTION_PRICING_PLANS, id);
}

export async function reorderPricingPlans(ids: string[]): Promise<PricingPlanRecord[]> {
  const updates = ids.map((id, index) =>
    elevatedUpdate(COLLECTION_PRICING_PLANS, { _id: id, sortOrder: index }),
  );
  const results = await Promise.all(updates);
  return results.map((item) => parsePlanItem(item as Record<string, unknown>));
}
