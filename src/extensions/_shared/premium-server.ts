import type { APIRoute } from 'astro';
import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';

export async function getPremiumStatus(): Promise<{ isPremium: boolean; packageName?: string }> {
  try {
    const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
    const instanceResponse = await elevatedGetAppInstance();
    const instance = (instanceResponse as Record<string, unknown>).instance as
      | Record<string, unknown>
      | undefined;
    const billing = instance?.billing as Record<string, unknown> | undefined;
    const packageName = billing?.packageName as string | undefined;
    if (
      !packageName ||
      packageName.toLowerCase() === 'basic' ||
      packageName.toLowerCase() === 'free' ||
      billing?.autoRenewing === false
    ) {
      return { isPremium: false, packageName };
    }
    return { isPremium: true, packageName };
  } catch {
    return { isPremium: false };
  }
}
