import type { APIRoute } from 'astro';
import { items } from '@wix/data';
import { auth } from '@wix/essentials';
import { corsHeaders, jsonResponse, optionsResponse } from '../../../extensions/_shared/cors';
import { COLLECTION_PRICING_PLANS } from '../../../extensions/_shared/collections';
import { getPremiumStatus } from '../../../extensions/_shared/premium-server';
import {
  enforceFreePlanLimit,
  stripPremiumPlanFields,
  type PricingPlanRecord,
} from '../../../extensions/_shared/pricing-plan-types';

const elevatedQuery = auth.elevate(items.query);
const elevatedInsert = auth.elevate(items.insert);
const elevatedUpdate = auth.elevate(items.update);
const elevatedRemove = auth.elevate(items.remove);

function mapItem(item: Record<string, unknown>): PricingPlanRecord {
  return {
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
  };
}

export const OPTIONS: APIRoute = async ({ request }) => optionsResponse(request);

export const GET: APIRoute = async ({ request }) => {
  try {
    const { isPremium } = await getPremiumStatus();
    const result = await elevatedQuery(COLLECTION_PRICING_PLANS).ascending('sortOrder').find();
    const itemsList = (result.items ?? []) as Array<Record<string, unknown>>;
    let plans = itemsList.map(mapItem).map((plan) => stripPremiumPlanFields(plan, isPremium));
    plans = enforceFreePlanLimit(plans, isPremium);
    return jsonResponse({ ok: true, plans, isPremium }, request);
  } catch (error) {
    console.error('[pricing-plans GET]', error);
    return jsonResponse({ ok: true, plans: [], isPremium: false }, request);
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const { isPremium } = await getPremiumStatus();
    const body = (await request.json()) as { plans?: PricingPlanRecord[] };
    let incoming = body.plans ?? [];

    if (!isPremium && incoming.length > 3) {
      return jsonResponse({ ok: false, error: 'free_plan_limit' }, request, 400);
    }

    incoming = incoming.map((plan, index) => ({
      ...stripPremiumPlanFields(plan, isPremium),
      sortOrder: index,
    }));

    if (!isPremium) {
      incoming = incoming.slice(0, 3);
    }

    const existing = await elevatedQuery(COLLECTION_PRICING_PLANS).find();
    const existingItems = (existing.items ?? []) as Array<Record<string, unknown>>;
    for (const item of existingItems) {
      if (item._id) {
        await elevatedRemove(COLLECTION_PRICING_PLANS, item._id as string);
      }
    }

    for (const plan of incoming) {
      const payload = {
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
        wixPlanId: plan.wixPlanId ?? '',
      };
      await elevatedInsert(COLLECTION_PRICING_PLANS, payload);
    }

    return jsonResponse({ ok: true, plans: incoming }, request);
  } catch (error) {
    console.error('[pricing-plans POST]', error);
    return jsonResponse({ ok: false, error: 'save_failed' }, request, 500);
  }
};

export const PUT: APIRoute = async ({ request }) => {
  return POST({ request } as Parameters<typeof POST>[0]);
};
