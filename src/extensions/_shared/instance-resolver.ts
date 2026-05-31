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

export async function resolvePremium(): Promise<{
  isPremium: boolean;
  packageName?: string;
}> {
  try {
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const instanceResponse = await elevatedGetAppInstance();
    const instance = (instanceResponse as { instance?: { billing?: { packageName?: string; autoRenewing?: boolean } } }).instance;
    const packageName = instance?.billing?.packageName;
    if (
      !packageName ||
      packageName.toLowerCase() === 'basic' ||
      packageName.toLowerCase() === 'free'
    ) {
      return { isPremium: false, packageName };
    }
    if (instance?.billing?.autoRenewing === false) {
      return { isPremium: false, packageName };
    }
    return { isPremium: true, packageName };
  } catch {
    return { isPremium: false };
  }
}
