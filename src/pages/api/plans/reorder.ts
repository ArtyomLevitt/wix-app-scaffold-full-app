import type { APIRoute } from 'astro';
import { corsHeaders, jsonResponse } from '../../../extensions/_shared/api-helpers';
import { reorderPricingPlans } from '../../../extensions/_shared/plans-store';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const POST: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const body = (await request.json()) as { ids?: string[] };
    const ids = body.ids ?? [];
    if (!Array.isArray(ids) || ids.length === 0) {
      return jsonResponse({ error: 'invalid-ids' }, 400, headers);
    }
    const plans = await reorderPricingPlans(ids);
    return jsonResponse({ plans }, 200, headers);
  } catch (error) {
    console.error('[plans reorder]', error);
    return jsonResponse({ error: 'reorder-failed' }, 500, headers);
  }
};
