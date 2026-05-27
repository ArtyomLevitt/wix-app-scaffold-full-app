// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// ⚠️ LEGACY (non-Astro) — DO NOT USE THIS FILE IN NEW ASTRO APPS ⚠️
// For modern Astro apps use examples/_shared/api-plans.ts instead and put
// it at src/pages/api/app/plans.ts. See banner in
// examples/_shared/check-premium.web.ts for the full rationale.
//
// Canonical PRPL app plans — copy verbatim into src/backend/app-plans.web.ts
// Reads dynamic plans + currency from Wix Dev Center.
// Replace <APP_ID> with your app's UUID.

import { webMethod, Permissions } from '@wix/web-methods';
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

/** Decode HTML entities like &#36; → $ */
function decodeHtmlEntity(str: string): string {
  return str.replace(/&#(\d+);/g, (_, code) => String.fromCharCode(Number(code)));
}

/** Pick the best non-zero price string from the available fields */
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

export const getAppPlans = webMethod(
  Permissions.Anyone,
  async (): Promise<AppPlansResponse> => {
    try {
      let response;
      try {
        const elevatedList = auth.elevate(appPlans.listAppPlansByAppId);
        response = await elevatedList([APP_ID]);
      } catch {
        response = await appPlans.listAppPlansByAppId([APP_ID]);
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
          prices: (plan.prices ?? []).map((p: any) => ({
            price: pickPrice(p),
            priceBeforeTax: String(p.priceBeforeTax ?? '0'),
            totalPrice: String(p.totalPrice ?? '0'),
            // NOTE: prefer billingCycle.cycleDuration.unit (MONTH/YEAR) over cycleType
            // (which is always "RECURRING" — useless). Astro version below handles this properly.
            cycleType: p.billingCycle?.cycleType ?? p.cycleType ?? 'MONTHLY',
          })),
        }));
      });

      return { plans, currency, currencySymbol };
    } catch (error: any) {
      console.error('Failed to fetch app plans:', error?.message || error);
      return {
        plans: [],
        currency: 'USD',
        currencySymbol: '$',
        error: error?.message || String(error),
      };
    }
  },
);
