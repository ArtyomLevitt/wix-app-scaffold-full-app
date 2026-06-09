import type { APIRoute } from 'astro';
import { corsHeaders, jsonResponse } from '../../../extensions/_shared/api-helpers';
import { listPublicPricingPlans } from '../../../extensions/_shared/plans-store';
import { loadAppSettings } from '../../../extensions/_shared/settings-store';
import { getPremiumInfo } from '../_shared/premium';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const GET: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const [settings, plans, premium] = await Promise.all([
      loadAppSettings(true),
      listPublicPricingPlans(),
      getPremiumInfo(),
    ]);
    return jsonResponse(
      {
        settings,
        plans,
        isPremium: premium.isPremium,
        showWatermark: !premium.isPremium,
      },
      200,
      headers,
    );
  } catch (error) {
    console.error('[widget settings GET]', error);
    return jsonResponse({ error: 'load-failed' }, 500, headers);
  }
};
