// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
//
// ⚠️ LEGACY (non-Astro) — DO NOT USE THIS FILE IN NEW ASTRO APPS ⚠️
// For modern Astro apps use examples/_shared/api-track-setup-completed.ts
// instead and put it at src/pages/api/app/track-setup-completed.ts. See
// banner in examples/_shared/check-premium.web.ts for the full rationale.
//
// Canonical PRPL setup-tracking — copy verbatim into src/backend/_shared/tracking.web.ts
// Called from the dashboard on the FIRST successful save.
// Updates `setup_completed_at` ONCE thanks to the `.is(null)` filter — safe to call on every save.
//
// NOTE: Uses "Anyone" as any (string literal) instead of Permissions.Anyone — the literal works
// across all @wix/web-methods versions, while Permissions.Anyone silently crashes on <= 1.0.5.

import { webMethod } from "@wix/web-methods";
import { appInstances } from "@wix/app-management";
import { auth } from "@wix/essentials";
import { getSupabase } from "./supabase-client";

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

// Resolve the active instanceId, preferring the auth token (virtually always
// available — required by every webMethod caller) and falling back to the
// AppInstance API. This order matters: `appInstances.getAppInstance()` can
// return a partial response in editor / panel / cross-context calls, so
// using ONLY `instance?.instanceId` is the #1 cause of "Save failed:
// no-instance" errors on writes that look like they should work.
async function resolveInstanceId(): Promise<string | null> {
  try {
    const tokenInfo = await auth.getTokenInfo();
    if (tokenInfo?.instanceId) return tokenInfo.instanceId;
  } catch (tokenErr) {
    console.warn("[tracking] getTokenInfo failed:", tokenErr);
  }
  try {
    const { instance } = await elevatedGetAppInstance();
    return instance?.instanceId ?? null;
  } catch (instErr) {
    console.warn("[tracking] getAppInstance failed:", instErr);
    return null;
  }
}

export const trackSetupCompleted = webMethod(
  "Anyone" as any,
  async (): Promise<{ ok: boolean }> => {
    try {
      const instanceId = await resolveInstanceId();
      if (!instanceId) return { ok: false };

      const supabase = getSupabase();
      await supabase
        .from("app_installations")
        .update({ setup_completed_at: new Date().toISOString() })
        .eq("instance_id", instanceId)
        .is("setup_completed_at", null);

      console.log("[tracking] setup_completed tracked:", instanceId);
      return { ok: true };
    } catch (e) {
      console.error("[tracking] trackSetupCompleted failed:", e);
      return { ok: false };
    }
  }
);
