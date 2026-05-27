// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// Canonical PRPL premium check (Astro API route) — copy verbatim into
// src/pages/api/app/check-premium.ts in every Astro Wix app.
//
// This file REPLACES the legacy src/extensions/backend/check-premium.web.ts.
// Reason: @wix/web-methods v1.x does NOT have a working server-side transform
// in Astro apps — the webMethod() wrapper is a no-op so the function body
// runs IN THE BROWSER, and the first call to `auth.elevate(...)` or
// `auth.getTokenInfo()` throws "Unable to get the currently active token" /
// "An elevated client is required to use elevated modules". Astro API routes
// run server-side with full elevated access.
//
// Returns: { isPremium, planStatus, packageName, instanceId, metaSiteId, siteUrl }
// Called from the dashboard via:
//   import { httpClient } from '@wix/essentials';
//   const res = await httpClient.fetchWithAuth('/api/app/check-premium');
//   const premium: PremiumInfo = await res.json();

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

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  // Capture identifiers from the auth token FIRST. `tokenInfo.siteId` is
  // typed as a REQUIRED field by @wix/essentials — if the caller has any
  // valid token at all, we have a usable site id. We use both as fallbacks
  // for `appInstances.getAppInstance()` which can return a partial response
  // in editor / panel contexts. Captured outside the main try block so the
  // catch path can still surface them — that way the widget settings
  // panel's "Manage in dashboard" URL always has a usable identifier.
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
    const instance = (instanceResponse as any).instance;
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

    let result: PremiumInfo;
    if (
      !packageName ||
      packageName.toLowerCase() === 'basic' ||
      packageName.toLowerCase() === 'free'
    ) {
      result = {
        isPremium: false,
        planStatus: 'free',
        packageName,
        instanceId,
        metaSiteId,
        siteUrl,
      };
    } else if (billing?.autoRenewing === false) {
      result = {
        isPremium: false,
        planStatus: 'cancelled',
        packageName,
        instanceId,
        metaSiteId,
        siteUrl,
      };
    } else {
      result = {
        isPremium: true,
        planStatus: 'premium',
        packageName,
        instanceId,
        metaSiteId,
        siteUrl,
      };
    }

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('[check-premium] AppInstance lookup failed:', error);
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
