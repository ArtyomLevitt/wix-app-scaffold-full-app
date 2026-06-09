import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

export async function resolveInstanceId(): Promise<string | null> {
  try {
    const tokenInfo = await auth.getTokenInfo();
    if (tokenInfo?.instanceId) return tokenInfo.instanceId;
  } catch (tokenErr) {
    console.warn('[resolveInstanceId] getTokenInfo failed:', tokenErr);
  }
  try {
    const { instance } = await elevatedGetAppInstance();
    return instance?.instanceId ?? null;
  } catch (instErr) {
    console.warn('[resolveInstanceId] getAppInstance failed:', instErr);
    return null;
  }
}

export async function getPremiumInfo(): Promise<{
  isPremium: boolean;
  planStatus: 'premium' | 'cancelled' | 'free';
  packageName?: string;
  instanceId?: string;
}> {
  let tokenInstanceId: string | undefined;
  try {
    const tokenInfo = await auth.getTokenInfo();
    tokenInstanceId = tokenInfo?.instanceId;
  } catch {
    /* ignore */
  }

  try {
    const { instance } = await elevatedGetAppInstance();
    const inst = instance as Record<string, unknown> | undefined;
    const billing = inst?.billing as Record<string, unknown> | undefined;
    const instanceId = (inst?.instanceId as string) ?? tokenInstanceId;
    const packageName = billing?.packageName as string | undefined;

    if (
      !packageName ||
      packageName.toLowerCase() === 'basic' ||
      packageName.toLowerCase() === 'free'
    ) {
      return { isPremium: false, planStatus: 'free', packageName, instanceId };
    }
    if (billing?.autoRenewing === false) {
      return { isPremium: false, planStatus: 'cancelled', packageName, instanceId };
    }
    return { isPremium: true, planStatus: 'premium', packageName, instanceId };
  } catch (error) {
    console.error('[getPremiumInfo] failed:', error);
    return { isPremium: false, planStatus: 'free', instanceId: tokenInstanceId };
  }
}

export function jsonResponse(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const OPTIONS = async () => new Response(null, { status: 204 });
