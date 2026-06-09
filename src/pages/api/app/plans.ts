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

function pickPrice(p: any): string {
  const candidates = [p.price, p.totalPrice, p.priceBeforeTax];
  for (const val of candidates) {
    if (val != null) {
      const num = typeof val === 'number' ? val : parseFloat(String(val));
      if (!isNaN(num) && num > 0) return String(val);
    }
  }
  return '0';
}

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    let response: any;
    try {
      const elevatedList = auth.elevate((appPlans as any).listAppPlansByAppId);
      response = await elevatedList([APP_ID]);
    } catch {
      response = await (appPlans as any).listAppPlansByAppId([APP_ID]);
    }

    const currency = response.currency ?? 'USD';
    const rawSymbol = response.currencySymbol ?? '$';
    const currencySymbol = decodeHtmlEntity(rawSymbol);

    const allAppPlans = response.appPlans ?? [];

    const plans: AppPlan[] = allAppPlans.flatMap((appPlanGroup: any) => {
      const groupPlans = appPlanGroup.plans ?? [];
      return groupPlans.map((plan: any) => ({
        vendorId: plan.vendorId ?? '',
        name: plan.name ?? '',
        benefits: (plan.benefits ?? []).filter((b: string) => b && b.trim() !== ''),
        prices: (plan.prices ?? []).map((p: any) => {
          const unit: string = (
            p.billingCycle?.cycleDuration?.unit ??
            p.cycleType ??
            ''
          )
            .toString()
            .toUpperCase();
          let cycleType = unit;
          if (!cycleType || cycleType === 'RECURRING') {
            cycleType = 'MONTHLY';
          } else if (cycleType === 'MONTH') {
            cycleType = 'MONTHLY';
          } else if (cycleType === 'YEAR') {
            cycleType = 'YEARLY';
          }
          return {
            price: pickPrice(p),
            priceBeforeTax: String(p.priceBeforeTax ?? '0'),
            totalPrice: String(p.totalPrice ?? '0'),
            cycleType,
          };
        }),
      }));
    });

    const result: AppPlansResponse = { plans, currency, currencySymbol };
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[app-plans] failed:', error?.message || error);
    const fallback: AppPlansResponse = {
      plans: [],
      currency: 'USD',
      currencySymbol: '$',
      error: error?.message || String(error),
    };
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
