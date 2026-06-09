import type { APIRoute } from 'astro';
import { appPlans } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { APP_ID } from '../../../extensions/_shared/app-config';

export interface AppPlan {
  vendorId: string;
  name: string;
  benefits: string[];
  prices: Array<{
    price: string;
    priceBeforeTax: string;
    totalPrice: string;
    cycleType: string;
  }>;
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
  const candidates = [p.price, p.totalPrice, p.priceBeforeTax];
  for (const val of candidates) {
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
      const elevatedList = auth.elevate(appPlans.listAppPlansByAppId);
      response = (await elevatedList([APP_ID])) as Record<string, unknown>;
    } catch {
      response = (await appPlans.listAppPlansByAppId([APP_ID])) as Record<string, unknown>;
    }

    const currency = (response.currency as string) ?? 'USD';
    const rawSymbol = (response.currencySymbol as string) ?? '$';
    const currencySymbol = decodeHtmlEntity(rawSymbol);
    const allAppPlans = (response.appPlans as Array<Record<string, unknown>>) ?? [];

    const plans: AppPlan[] = allAppPlans.flatMap((appPlanGroup) => {
      const groupPlans = (appPlanGroup.plans as Array<Record<string, unknown>>) ?? [];
      return groupPlans.map((plan) => ({
        vendorId: (plan.vendorId as string) ?? '',
        name: (plan.name as string) ?? '',
        benefits: ((plan.benefits as string[]) ?? []).filter((b) => b && b.trim() !== ''),
        prices: ((plan.prices as Array<Record<string, unknown>>) ?? []).map((p) => {
          const billingCycle = p.billingCycle as Record<string, unknown> | undefined;
          const cycleDuration = billingCycle?.cycleDuration as Record<string, unknown> | undefined;
          const unit = String(cycleDuration?.unit ?? p.cycleType ?? '')
            .toUpperCase();
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
