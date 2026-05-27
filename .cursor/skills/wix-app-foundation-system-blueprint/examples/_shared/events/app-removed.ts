// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// Canonical PRPL app-removed event handler.
// Legacy CLI layout: place at src/backend/events/app-removed/event.ts
// Astro layout: place at src/extensions/backend/events/app-removed/app-removed.ts
//
// We don't delete rows on uninstall — flips is_active=false + sets removed_at
// so we can analyse churn.

import { appInstances } from "@wix/app-management";
import { getSupabase } from "../../_shared/supabase-client";

// Wix Astro requires the listener call to be the DEFAULT export. Bare
// `appInstances.onX(...)` calls fail `astro build` with "Expected event
// listener call to be the default export" — see app-installed.ts header.
export default appInstances.onAppInstanceRemoved(async (event) => {
  try {
    const instanceId = event.metadata?.instanceId;

    if (!instanceId) {
      console.warn("[app-removed] no instanceId in event");
      return;
    }

    const supabase = getSupabase();

    await supabase
      .from("app_installations")
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
      })
      .eq("instance_id", instanceId);

    console.log("[app-removed] tracked:", instanceId);
  } catch (error) {
    console.error("[app-removed] failed:", error);
  }
});
