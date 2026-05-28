import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { PLAN_LIMITS } from '../../../extensions/_shared/app-config';

export type PlanStatus = 'premium' | 'cancelled' | 'free';

export interface PremiumInfo {
  isPremium: boolean;
  planStatus: PlanStatus;
  packageName?: string;
  instanceId?: string;
  metaSiteId?: string;
  siteUrl?: string;
  maxPlans: number;
}

export async function getPremiumInfo(): Promise<PremiumInfo> {
  let tokenSiteId: string | undefined;
  let tokenInstanceId: string | undefined;
  try {
    const tokenInfo = await auth.getTokenInfo();
    tokenSiteId = tokenInfo?.siteId;
    tokenInstanceId = tokenInfo?.instanceId;
  } catch (tokenErr) {
    console.warn('[premium] getTokenInfo failed:', tokenErr);
  }

  try {
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const instanceResponse = await elevatedGetAppInstance();
    const instance = (instanceResponse as Record<string, unknown>).instance as Record<string, unknown> | undefined;
    const billing = (instance?.billing ?? {}) as Record<string, unknown>;
    const instanceId = (instance?.instanceId as string) ?? tokenInstanceId;
    const raw = instanceResponse as Record<string, unknown>;
    const site = (raw?.site ?? {}) as Record<string, unknown>;
    const metaSiteId =
      (site.metaSiteId as string) ??
      (site.siteId as string) ??
      tokenSiteId;
    const siteUrl = site.url as string | undefined;
    const packageName = billing?.packageName as string | undefined;
    const planKey = (packageName ?? 'free').toLowerCase();
    const maxPlans = PLAN_LIMITS[planKey] ?? PLAN_LIMITS.free;

    if (!packageName || planKey === 'basic' || planKey === 'free') {
      return {
        isPremium: false,
        planStatus: 'free',
        packageName,
        instanceId,
        metaSiteId,
        siteUrl,
        maxPlans,
      };
    }
    if (billing?.autoRenewing === false) {
      return {
        isPremium: false,
        planStatus: 'cancelled',
        packageName,
        instanceId,
        metaSiteId,
        siteUrl,
        maxPlans,
      };
    }
    return {
      isPremium: true,
      planStatus: 'premium',
      packageName,
      instanceId,
      metaSiteId,
      siteUrl,
      maxPlans,
    };
  } catch (error) {
    console.error('[premium] lookup failed:', error);
    return {
      isPremium: false,
      planStatus: 'free',
      instanceId: tokenInstanceId,
      metaSiteId: tokenSiteId,
      maxPlans: PLAN_LIMITS.free,
    };
  }
}
