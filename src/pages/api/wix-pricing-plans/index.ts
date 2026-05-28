import type { APIRoute } from 'astro';
import { plans } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';
import { jsonResponse, optionsResponse } from '../../../extensions/_shared/cors';

const elevatedListPlans = auth.elevate(plans.queryPublicPlans);

export const OPTIONS: APIRoute = async ({ request }) => optionsResponse(request);

export const GET: APIRoute = async ({ request }) => {
  try {
    const response = await elevatedListPlans({});
    const list = (response as Record<string, unknown>).plans as Array<Record<string, unknown>> | undefined;
    const options = (list ?? []).map((plan) => ({
      _id: String(plan._id ?? ''),
      name: String(plan.name ?? ''),
      description: String(plan.description ?? ''),
    }));
    return jsonResponse({ ok: true, plans: options }, request);
  } catch (error) {
    console.error('[wix-pricing-plans GET]', error);
    return jsonResponse({ ok: true, plans: [] }, request);
  }
};
