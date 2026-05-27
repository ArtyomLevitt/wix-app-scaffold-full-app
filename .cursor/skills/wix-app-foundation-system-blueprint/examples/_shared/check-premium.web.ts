// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// ⚠️ LEGACY (non-Astro) — DO NOT USE THIS FILE IN NEW ASTRO APPS ⚠️
// For modern Astro apps (every PRPL app since the @wix/astro adoption),
// use examples/_shared/api-check-premium.ts instead and put it at
// src/pages/api/app/check-premium.ts. @wix/web-methods v1.x is a no-op
// wrapper in Astro mode — `.web.ts` files bundle into the browser and
// crash the first time they touch `auth.elevate(...)` /
// `auth.getTokenInfo()`. Symptom: "Save failed: no-instance" toast,
// 403 on save, "Unable to get the currently active token" in console.
//
// Canonical PRPL premium check — copy verbatim into src/backend/check-premium.web.ts
// Returns: { isPremium, planStatus, packageName, instanceId, metaSiteId, siteUrl }
// Used by the dashboard header badge, pricing card "Current Plan" highlight, limit checks,
// AND the Manage tab's 3-button action group (Save / View Editor / View Live Site).
// metaSiteId → `https://manage.wix.com/editor/${metaSiteId}` for "View Editor"
// siteUrl    → href for "View Live Site" (disabled with tooltip if site not published)
//
// Style note: This file uses Permissions.Anyone (works on @wix/web-methods >= 1.0.6).
// On older versions, switch to "Anyone" as any string literal.

import { webMethod, Permissions } from '@wix/web-methods';
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

export const checkPremium = webMethod(
  Permissions.Anyone,
  async (): Promise<PremiumInfo> => {
    // Capture identifiers from the auth token FIRST. `tokenInfo.siteId` is
    // typed as a REQUIRED field by @wix/essentials — if the caller has any
    // valid token at all, we get a usable site id. We use both as fallbacks
    // for `appInstances.getAppInstance()` which can return a partial
    // response in editor / panel contexts. Captured outside the main try
    // block so the catch path can still surface them to the caller — that
    // way the widget settings panel's "Manage in dashboard" URL always has
    // a usable identifier even when the AppInstance API hiccups, and the
    // button is virtually always visible.
    let tokenSiteId: string | undefined;
    let tokenInstanceId: string | undefined;
    try {
      const tokenInfo = await auth.getTokenInfo();
      tokenSiteId = tokenInfo?.siteId;
      tokenInstanceId = tokenInfo?.instanceId;
    } catch (tokenErr) {
      console.warn('[checkPremium] getTokenInfo failed:', tokenErr);
    }

    try {
      const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
      const instanceResponse = await elevatedGetAppInstance();
      const instance = instanceResponse.instance;
      const billing = instance?.billing;
      const instanceId = instance?.instanceId ?? tokenInstanceId ?? undefined;

      const raw = instanceResponse as any;
      const site = raw?.site ?? {};
      const metaSiteId: string | undefined =
        site.metaSiteId ??
        site.siteId ??
        raw?.instance?.metaSiteId ??
        tokenSiteId ??
        undefined;
      const siteUrl: string | undefined = site.url ?? undefined;

      const packageName = billing?.packageName ?? undefined;

      if (
        !packageName ||
        packageName.toLowerCase() === 'basic' ||
        packageName.toLowerCase() === 'free'
      ) {
        return { isPremium: false, planStatus: 'free', packageName, instanceId, metaSiteId, siteUrl };
      }

      if (billing?.autoRenewing === false) {
        return { isPremium: false, planStatus: 'cancelled', packageName, instanceId, metaSiteId, siteUrl };
      }

      return { isPremium: true, planStatus: 'premium', packageName, instanceId, metaSiteId, siteUrl };
    } catch (error) {
      console.error('[checkPremium] AppInstance lookup failed:', error);
      return {
        isPremium: false,
        planStatus: 'free',
        instanceId: tokenInstanceId,
        metaSiteId: tokenSiteId,
      };
    }
  },
);
