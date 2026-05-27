// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// Canonical PRPL dynamic-plans endpoint (Astro API route) — copy verbatim into
// src/pages/api/app/plans.ts. Replaces the legacy app-plans.web.ts.
//
// Why an Astro route and not a webMethod: see notes at the top of
// examples/_shared/api-check-premium.ts. @wix/web-methods v1.x is a no-op
// wrapper in Astro apps, so .web.ts files bundle into the client and crash
// the first time they touch `auth.elevate(...)`.
//
// Called from the dashboard via:
//   import { httpClient } from '@wix/essentials';
//   const res = await httpClient.fetchWithAuth('/api/app/plans');
//   const { plans, currency, currencySymbol } = await res.json();

import type { APIRoute } from 'astro';
import { appPlans } from '@wix/app-management';
import { auth } from '@wix/essentials';

const APP_ID = '<APP_ID>';

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
        benefits: (plan.benefits ?? []).filter(
          (b: string) => b && b.trim() !== '',
        ),
        prices: (plan.prices ?? []).map((p: any) => {
          // `cycleDuration.unit` is the source of truth on modern apps; older
          // shapes fall through to `p.cycleType`. We normalize everything to
          // a single user-facing word so the dashboard's pricing card
          // doesn't have to branch on raw enum values.
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
          } else if (cycleType === 'WEEK') {
            cycleType = 'WEEKLY';
          } else if (cycleType === 'DAY') {
            cycleType = 'DAILY';
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
