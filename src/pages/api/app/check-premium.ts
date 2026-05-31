import type { APIRoute } from 'astro';
import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';

export type PlanStatus = 'premium' | 'cancelled' | 'free';

export interface PremiumInfo {
  isPremium: boolean;
  planStatus: PlanStatus;
  packageName?: string;
  instanceId?: string;
  metaSiteId?: string;
  siteUrl?: string;
}

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  let tokenSiteId: string | undefined;
  let tokenInstanceId: string | undefined;
  try {
    const tokenInfo = await auth.getTokenInfo();
    tokenSiteId = tokenInfo?.siteId;
    tokenInstanceId = tokenInfo?.instanceId;
  } catch (tokenErr) {
    console.warn('[check-premium] getTokenInfo failed:', tokenErr);
  }

  try {
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const instanceResponse = await elevatedGetAppInstance();
    const instance = (instanceResponse as { instance?: Record<string, unknown> }).instance;
    const billing = instance?.billing as { packageName?: string; autoRenewing?: boolean } | undefined;
    const instanceId = (instance?.instanceId as string | undefined) ?? tokenInstanceId;

    const raw = instanceResponse as Record<string, unknown>;
    const site = (raw?.site ?? {}) as Record<string, unknown>;
    const metaSiteId =
      (site.metaSiteId as string | undefined) ??
      (site.siteId as string | undefined) ??
      tokenSiteId;
    const siteUrl = site.url as string | undefined;
    const packageName = billing?.packageName;

    let result: PremiumInfo;
    if (!packageName || packageName.toLowerCase() === 'basic' || packageName.toLowerCase() === 'free') {
      result = { isPremium: false, planStatus: 'free', packageName, instanceId, metaSiteId, siteUrl };
    } else if (billing?.autoRenewing === false) {
      result = { isPremium: false, planStatus: 'cancelled', packageName, instanceId, metaSiteId, siteUrl };
    } else {
      result = { isPremium: true, planStatus: 'premium', packageName, instanceId, metaSiteId, siteUrl };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[check-premium] failed:', error);
    const fallback: PremiumInfo = {
      isPremium: false,
      planStatus: 'free',
      instanceId: tokenInstanceId,
      metaSiteId: tokenSiteId,
    };
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
