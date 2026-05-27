// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// VERBATIM (scrubbed) from advanced-product-file-uploader/src/extensions/backend/events/app-installed/app-installed.ts.
// Goes at: src/extensions/backend/events/app-installed/app-installed.ts
//
// In Astro layout, the handler MUST `export default appInstances.onXxx(...)`.
// In legacy CLI layout (frequently-bought-together, password-protected, etc.) the handler
// is a top-level appInstances.onXxx(...) call with no export.
//
// The internals are otherwise identical to the canonical version in examples/_shared/events/app-installed.ts —
// upserts the install into Supabase with site properties enrichment.
//
// Note the relative path to supabase-client: `../../../../backend/_shared/supabase-client`.
// The deeper nesting is because Astro extensions live in src/extensions/, but _shared
// stays in src/backend/ to be reachable from both web methods and event handlers.

import { appInstances } from "@wix/app-management";
import { siteProperties } from "@wix/business-tools";
import { auth } from "@wix/essentials";
import { getSupabase } from "../../../../backend/_shared/supabase-client";

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);
const elevatedGetSiteProps = auth.elevate(siteProperties.getSiteProperties);

export default appInstances.onAppInstanceInstalled(async (event) => {
  try {
    const instanceId = event.metadata?.instanceId;
    const siteId = event.metadata?.accountInfo?.siteId;

    const { instance, site } = await elevatedGetAppInstance();

    let businessName: string | null = null;
    let phone: string | null = null;
    let country: string | null = null;
    let city: string | null = null;
    let category: string | null = null;
    let subCategory: string | null = null;
    try {
      const props = await elevatedGetSiteProps();
      const p = props as any;
      businessName = p?.properties?.businessName ?? null;
      phone = p?.properties?.phone ?? null;
      country = p?.properties?.address?.country ?? null;
      city = p?.properties?.address?.city ?? null;
      category = p?.properties?.categories?.primary ?? null;
      subCategory = p?.properties?.categories?.secondary?.[0] ?? null;
    } catch (err) {
      console.warn("[app-installed] getSiteProperties failed:", err);
    }

    const supabase = getSupabase();

    await supabase.from("app_installations").upsert(
      {
        instance_id: instanceId,
        app_name: (instance as any)?.appName ?? null,
        site_id: site?.siteId ?? siteId,
        owner_email: site?.ownerInfo?.email ?? null,
        business_name: businessName,
        phone,
        country,
        city,
        category,
        sub_category: subCategory,
        site_display_name: site?.siteDisplayName ?? null,
        site_url: (site as any)?.url ?? null,
        site_locale: (site as any)?.locale ?? null,
        is_free: (instance as any)?.isFree ?? true,
        package_name: (instance as any)?.billing?.packageName ?? null,
        billing_cycle: (instance as any)?.billing?.billingCycle ?? null,
        billing_started_at: (instance as any)?.billing?.timeStamp ?? null,
        billing_expiration_date:
          (instance as any)?.billing?.expirationDate ?? null,
        auto_renewing: (instance as any)?.billing?.autoRenewing ?? null,
        free_trial_status:
          (instance as any)?.billing?.freeTrialInfo?.status ?? null,
        installed_at: new Date().toISOString(),
        removed_at: null,
        is_active: true,
      },
      { onConflict: "instance_id" }
    );

    console.log("[app-installed] tracked:", instanceId);
  } catch (error) {
    console.error("[app-installed] failed:", error);
  }
});
