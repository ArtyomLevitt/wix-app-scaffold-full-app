import type { APIRoute } from 'astro';
import { resolvePremiumFromInstance } from '../../../extensions/_shared/instance';
import { getWidgetPayload } from '../../../extensions/_shared/pricing-store';

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const { isPremium } = await resolvePremiumFromInstance();
    const { settings, plans } = await getWidgetPayload(isPremium);
    return new Response(
      JSON.stringify({
        settings,
        plans,
        isPremium,
        showWatermark: !isPremium,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[widget/settings] GET failed:', error);
    return new Response(JSON.stringify({ settings: {}, plans: [], isPremium: false, showWatermark: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
