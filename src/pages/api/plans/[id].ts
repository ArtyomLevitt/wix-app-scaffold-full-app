import type { APIRoute } from 'astro';
import { corsHeaders, jsonResponse } from '../../../extensions/_shared/api-helpers';
import {
  deletePricingPlan,
  sanitizePlanInput,
  updatePricingPlan,
} from '../../../extensions/_shared/plans-store';
import { getPremiumInfo } from '../_shared/premium';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const PATCH: APIRoute = async ({ request, params }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  const id = params.id;
  if (!id) return jsonResponse({ error: 'missing-id' }, 400, headers);
  try {
    const premium = await getPremiumInfo();
    const body = (await request.json()) as Record<string, unknown>;
    const data = sanitizePlanInput(body, premium.isPremium);
    const plan = await updatePricingPlan(id, data);
    return jsonResponse({ plan }, 200, headers);
  } catch (error) {
    console.error('[plans PATCH]', error);
    return jsonResponse({ error: 'update-failed' }, 500, headers);
  }
};

export const DELETE: APIRoute = async ({ request, params }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  const id = params.id;
  if (!id) return jsonResponse({ error: 'missing-id' }, 400, headers);
  try {
    await deletePricingPlan(id);
    return jsonResponse({ ok: true }, 200, headers);
  } catch (error) {
    console.error('[plans DELETE]', error);
    return jsonResponse({ error: 'delete-failed' }, 500, headers);
  }
};
