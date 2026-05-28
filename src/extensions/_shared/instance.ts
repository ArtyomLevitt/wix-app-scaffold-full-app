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

export async function resolvePremiumFromInstance(): Promise<{
  isPremium: boolean;
  packageName?: string;
}> {
  try {
    const { instance } = await elevatedGetAppInstance();
    const billing = (instance as any)?.billing;
    const packageName = billing?.packageName ?? undefined;
    if (
      !packageName ||
      packageName.toLowerCase() === 'basic' ||
      packageName.toLowerCase() === 'free'
    ) {
      return { isPremium: false, packageName };
    }
    if (billing?.autoRenewing === false) {
      return { isPremium: false, packageName };
    }
    return { isPremium: true, packageName };
  } catch {
    return { isPremium: false };
  }
}
