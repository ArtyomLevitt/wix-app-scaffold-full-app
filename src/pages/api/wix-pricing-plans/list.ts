import type { APIRoute } from 'astro';
import { plans } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const elevatedQuery = auth.elevate(plans.queryPublicPlans);
    const result = await elevatedQuery({});
    const items = ((result as any).items ?? (result as any).plans ?? []).map((plan: any) => ({
      _id: plan._id,
      name: plan.name ?? '',
      slug: plan.slug ?? '',
      pricing: plan.pricing ?? null,
    }));
    return new Response(JSON.stringify({ plans: items, installed: items.length > 0 }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[wix-pricing-plans] list failed:', error);
    return new Response(
      JSON.stringify({ plans: [], installed: false, error: error?.message || 'not_installed' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
