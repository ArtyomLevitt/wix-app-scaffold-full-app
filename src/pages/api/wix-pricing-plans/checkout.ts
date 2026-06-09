import type { APIRoute } from 'astro';
import { redirects } from '@wix/redirects';
import { auth } from '@wix/essentials';

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const POST: APIRoute = async ({ request }) => {
  try {
    const { planId, postFlowUrl } = (await request.json()) as {
      planId?: string;
      postFlowUrl?: string;
    };
    if (!planId) {
      return new Response(JSON.stringify({ error: 'missing_plan_id' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const elevatedCreate = auth.elevate(redirects.createRedirectSession);
    const session = await elevatedCreate({
      paidPlansCheckout: { planId },
      callbacks: { postFlowUrl: postFlowUrl || 'https://www.wix.com' },
    } as any);

    const url =
      (session as any)?.redirectSession?.fullUrl ||
      (session as any)?.redirectSession?.url ||
      null;

    if (!url) {
      return new Response(JSON.stringify({ error: 'checkout_unavailable' }), {
        status: 502,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ url }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[wix-pricing-plans/checkout] failed:', error);
    return new Response(
      JSON.stringify({ error: error?.message || 'checkout_failed' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
