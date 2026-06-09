import type { APIRoute } from 'astro';
import { FREE_PLAN_LIMIT } from '../../../extensions/_shared/app-config';
import { resolveInstanceId, resolvePremiumFromInstance } from '../../../extensions/_shared/instance';
import {
  applyPremiumGating,
  migrateSettings,
  stripPremiumFieldsFromPatch,
  stripPremiumPlanFields,
  type AppSettings,
  type PricingPlanRow,
} from '../../../extensions/_shared/pricing-types';
import {
  getWidgetPayload,
  loadAppSettings,
  loadPricingPlans,
  saveAppSettings,
  savePricingPlans,
} from '../../../extensions/_shared/pricing-store';

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const { isPremium } = await resolvePremiumFromInstance();
    const [settings, plans] = await Promise.all([loadAppSettings(), loadPricingPlans()]);
    return new Response(
      JSON.stringify({
        settings: applyPremiumGating(settings, isPremium),
        plans: plans.map((p) => stripPremiumPlanFields(p, isPremium)),
        isPremium,
        maxPlans: isPremium ? Infinity : FREE_PLAN_LIMIT,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  } catch (error) {
    console.error('[dashboard-settings] GET failed:', error);
    return new Response(JSON.stringify({ error: 'load_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const instanceId = await resolveInstanceId();
    if (!instanceId) {
      return new Response(JSON.stringify({ error: 'no-instance' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { isPremium } = await resolvePremiumFromInstance();
    const body = await request.json();
    const { settings: settingsPatch, plans: plansPatch } = body as {
      settings?: Partial<AppSettings>;
      plans?: PricingPlanRow[];
    };

    if (settingsPatch) {
      const base = applyPremiumGating(await loadAppSettings(), isPremium);
      const patch = stripPremiumFieldsFromPatch(settingsPatch, isPremium);
      const merged = migrateSettings({ ...base, ...patch } as Record<string, unknown>);
      await saveAppSettings(applyPremiumGating(merged, isPremium));
    }

    if (plansPatch) {
      if (!isPremium && plansPatch.length > FREE_PLAN_LIMIT) {
        return new Response(JSON.stringify({ error: 'plan_limit', maxPlans: FREE_PLAN_LIMIT }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      const sanitized = plansPatch.map((p, idx) =>
        stripPremiumPlanFields({ ...p, sortOrder: idx }, isPremium),
      );
      await savePricingPlans(sanitized);
    }

    const payload = await getWidgetPayload(isPremium);
    return new Response(JSON.stringify({ ok: true, ...payload, isPremium }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[dashboard-settings] POST failed:', error);
    return new Response(JSON.stringify({ error: 'save_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
