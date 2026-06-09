import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { FREE_PLAN_LIMIT } from '../../../extensions/_shared/app-config';
import {
  COLLECTION_PRICING_PLANS,
} from '../../../extensions/_shared/collections';
import {
  getPremiumInfo,
  jsonResponse,
  resolveInstanceId,
} from '../../../extensions/_shared/api-helpers';
import {
  normalizePlan,
  planRecordToPlan,
  type PricingPlan,
} from '../../../extensions/_shared/pricing-types';

const elevatedQuery = auth.elevate(items.query);
const elevatedInsert = auth.elevate(items.insert);
const elevatedUpdate = auth.elevate(items.update);
const elevatedRemove = auth.elevate(items.remove);

async function loadPlans(): Promise<PricingPlan[]> {
  const res = await elevatedQuery(COLLECTION_PRICING_PLANS)
    .ascending('sortOrder')
    .limit(100)
    .find();
  return (res.items ?? []).map((item) =>
    planRecordToPlan(item as Record<string, unknown>),
  );
}

function stripBadgesForFree(plans: PricingPlan[], isPremium: boolean): PricingPlan[] {
  if (isPremium) return plans;
  return plans.map((p) => ({ ...p, badge: '' as const }));
}

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const premium = await getPremiumInfo();
    const plans = stripBadgesForFree(await loadPlans(), premium.isPremium);
    return jsonResponse({ plans, isPremium: premium.isPremium });
  } catch (error) {
    console.error('[pricing-plans GET]', error);
    return jsonResponse({ plans: [], isPremium: false, error: 'load_failed' });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const instanceId = await resolveInstanceId();
    if (!instanceId) return jsonResponse({ ok: false, error: 'no-instance' }, 403);

    const premium = await getPremiumInfo();
    const body = (await request.json()) as { plans?: Partial<PricingPlan>[] };
    const incoming = (body.plans ?? []).map((p, idx) =>
      normalizePlan({ ...p, sortOrder: p.sortOrder ?? idx }),
    );

    if (!premium.isPremium && incoming.length > FREE_PLAN_LIMIT) {
      return jsonResponse(
        { ok: false, error: 'plan_limit', limit: FREE_PLAN_LIMIT },
        400,
      );
    }

    const sanitized = incoming.map((p) => {
      if (premium.isPremium) return p;
      return { ...p, badge: '' as const };
    });

    const existing = await loadPlans();
    const existingIds = new Set(existing.map((p) => p._id).filter(Boolean));

    for (const plan of sanitized) {
      const record = {
        name: plan.name,
        price: plan.price,
        currency: plan.currency,
        period: plan.period,
        tagline: plan.tagline,
        featuresJson: plan.featuresJson,
        badge: plan.badge,
        isHighlighted: plan.isHighlighted,
        ctaMode: plan.ctaMode,
        ctaTarget: plan.ctaTarget,
        ctaLabel: plan.ctaLabel,
        sortOrder: plan.sortOrder,
      };

      if (plan._id && existingIds.has(plan._id)) {
        await elevatedUpdate(COLLECTION_PRICING_PLANS, { ...record, _id: plan._id });
      } else {
        await elevatedInsert(COLLECTION_PRICING_PLANS, record);
      }
    }

    const incomingIds = new Set(sanitized.map((p) => p._id).filter(Boolean));
    for (const old of existing) {
      if (old._id && !incomingIds.has(old._id)) {
        await elevatedRemove(COLLECTION_PRICING_PLANS, old._id);
      }
    }

    return jsonResponse({ ok: true, plans: await loadPlans() });
  } catch (error) {
    console.error('[pricing-plans POST]', error);
    return jsonResponse({ ok: false, error: 'save_failed' }, 500);
  }
};
