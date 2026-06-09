import type { APIRoute } from 'astro';
import { plans as wixPlans } from '@wix/pricing-plans';
import { auth } from '@wix/essentials';
import { jsonResponse } from '../../../extensions/_shared/api-helpers';

const elevatedListPlans = auth.elevate(wixPlans.listPlans);

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const result = await elevatedListPlans({});
    const list =
      ((result as Record<string, unknown>).plans as Record<string, unknown>[]) ??
      ((result as Record<string, unknown>).items as Record<string, unknown>[]) ??
      [];
    const plans = list.map((p) => ({
      id: String(p._id ?? p.id ?? ''),
      name: String(p.name ?? 'Untitled plan'),
    }));
    return jsonResponse({ plans });
  } catch (error) {
    console.error('[wix-pricing-plans/list]', error);
    return jsonResponse({ plans: [], error: 'list_failed' });
  }
};
