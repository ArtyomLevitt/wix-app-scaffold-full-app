import type { APIRoute } from 'astro';
import { auth } from '@wix/essentials';
import { plans } from '@wix/pricing-plans';
import { corsHeaders, jsonResponse } from '../../../extensions/_shared/api-helpers';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const GET: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const elevatedQuery = auth.elevate(plans.queryPublicPlans);
    const result = await elevatedQuery({});
    const items = ((result as { items?: Array<Record<string, unknown>> }).items ?? []).map((plan) => ({
      id: plan._id as string,
      name: (plan.name as string) ?? '',
      slug: (plan.slug as string) ?? '',
    }));
    return jsonResponse({ plans: items }, 200, headers);
  } catch (error) {
    console.error('[wix-pricing-plans]', error);
    return jsonResponse({ plans: [] }, 200, headers);
  }
};
