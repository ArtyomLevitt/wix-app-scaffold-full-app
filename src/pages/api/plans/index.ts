import type { APIRoute } from 'astro';
import { corsHeaders, jsonResponse } from '../../../extensions/_shared/api-helpers';
import {
  createPricingPlan,
  listPricingPlans,
  sanitizePlanInput,
} from '../../../extensions/_shared/plans-store';
import { createEmptyPlan } from '../../../extensions/_shared/pricing-plans-types';
import { getPremiumInfo } from '../_shared/premium';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const GET: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const plans = await listPricingPlans();
    const premium = await getPremiumInfo();
    const gated = premium.isPremium
      ? plans
      : plans.map((p) => ({ ...p, badge: '' as const }));
    return jsonResponse({ plans: gated, maxPlans: premium.maxPlans, isPremium: premium.isPremium }, 200, headers);
  } catch (error) {
    console.error('[plans GET]', error);
    return jsonResponse({ plans: [], error: 'load-failed' }, 500, headers);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const premium = await getPremiumInfo();
    const body = (await request.json()) as Record<string, unknown>;
    const existing = await listPricingPlans();
    const data = sanitizePlanInput(body, premium.isPremium);
    const plan = await createPricingPlan(
      { ...createEmptyPlan(existing.length), ...data },
      premium.maxPlans,
    );
    return jsonResponse({ plan }, 200, headers);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message === 'plan-limit-reached') {
      return jsonResponse({ error: 'plan-limit-reached' }, 403, headers);
    }
    console.error('[plans POST]', error);
    return jsonResponse({ error: 'create-failed' }, 500, headers);
  }
};
