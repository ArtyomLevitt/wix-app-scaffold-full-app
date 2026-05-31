import type { APIRoute } from 'astro';
import { appPlans } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { APP_ID } from '../../../extensions/_shared/app-config';

export interface AppPlan {
  vendorId: string;
  name: string;
  benefits: string[];
  prices: Array<{ price: string; priceBeforeTax: string; totalPrice: string; cycleType: string }>;
}

export interface AppPlansResponse {
  plans: AppPlan[];
  currency: string;
  currencySymbol: string;
  error?: string;
}

function decodeHtmlEntity(str: string): string {
  return str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

function pickPrice(p: Record<string, unknown>): string {
  for (const key of ['price', 'totalPrice', 'priceBeforeTax']) {
    const val = p[key];
    if (val != null) {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (!isNaN(num) && num > 0) return String(val);
    }
  }
  return '0';
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    let response: Record<string, unknown>;
    try {
      const elevatedList = auth.elevate((appPlans as { listAppPlansByAppId: (ids: string[]) => Promise<unknown> }).listAppPlansByAppId);
      response = (await elevatedList([APP_ID])) as Record<string, unknown>;
    } catch {
      response = (await (appPlans as { listAppPlansByAppId: (ids: string[]) => Promise<unknown> }).listAppPlansByAppId([APP_ID])) as Record<string, unknown>;
    }

    const currency = (response.currency as string) ?? 'USD';
    const rawSymbol = (response.currencySymbol as string) ?? '$';
    const currencySymbol = decodeHtmlEntity(rawSymbol);
    const allAppPlans = (response.appPlans as Array<{ plans?: unknown[] }>) ?? [];

    const plans: AppPlan[] = allAppPlans.flatMap((group) => {
      const groupPlans = (group.plans ?? []) as Array<Record<string, unknown>>;
      return groupPlans.map((plan) => ({
        vendorId: String(plan.vendorId ?? ''),
        name: String(plan.name ?? ''),
        benefits: ((plan.benefits as string[]) ?? []).filter((b) => b && b.trim()),
        prices: ((plan.prices as Array<Record<string, unknown>>) ?? []).map((p) => {
          const unit = String(
            (p.billingCycle as { cycleDuration?: { unit?: string } })?.cycleDuration?.unit ??
              p.cycleType ??
              '',
          ).toUpperCase();
          let cycleType = unit;
          if (!cycleType || cycleType === 'RECURRING') cycleType = 'MONTHLY';
          else if (cycleType === 'MONTH') cycleType = 'MONTHLY';
          else if (cycleType === 'YEAR') cycleType = 'YEARLY';
          return {
            price: pickPrice(p),
            priceBeforeTax: String(p.priceBeforeTax ?? '0'),
            totalPrice: String(p.totalPrice ?? '0'),
            cycleType,
          };
        }),
      }));
    });

    return new Response(JSON.stringify({ plans, currency, currencySymbol }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('[app-plans] failed:', message);
    return new Response(
      JSON.stringify({ plans: [], currency: 'USD', currencySymbol: '$', error: message }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
