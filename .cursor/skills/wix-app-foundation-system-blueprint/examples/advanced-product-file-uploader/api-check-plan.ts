// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
import type { APIRoute } from 'astro';
import { auth } from '@wix/essentials';
import { appInstances } from '@wix/app-management';
import type { PremiumResult } from '../../types';

export const GET: APIRoute = async (): Promise<Response> => {
  try {
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const data = await elevatedGetAppInstance();
    const instance = (data as any)?.instance;
    const instanceId: string | undefined = instance?.instanceId ?? undefined;
    const isFree: boolean = instance?.isFree !== false;
    const billing = instance?.billing;
    const packageName: string | undefined = billing?.packageName;

    const planLimits: Record<string, number> = {
      starter: 15,
      standard: 50,
      advanced: 999,
    };

    let result: PremiumResult;

    if (!isFree && packageName) {
      const planKey = packageName.toLowerCase();
      result = {
        isPremium: true,
        planStatus: 'premium',
        instanceId,
        planName: packageName,
        maxProducts: planLimits[planKey] ?? 50,
      };
    } else if (isFree && packageName) {
      result = {
        isPremium: false,
        planStatus: 'cancelled',
        instanceId,
        planName: packageName,
        maxProducts: 3,
      };
    } else {
      result = { isPremium: false, planStatus: 'free', instanceId, maxProducts: 3 };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[check-plan] failed:', err);
    return new Response(
      JSON.stringify({ isPremium: false, planStatus: 'free', maxProducts: 3 }),
      { status: 200, headers: { 'Content-Type': 'application/json' } },
    );
  }
};
