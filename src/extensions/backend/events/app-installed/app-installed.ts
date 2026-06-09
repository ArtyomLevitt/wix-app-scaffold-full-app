import { APP_NAME } from '../../../_shared/app-config';
import { getSupabase } from '../../../_shared/supabase-client';
import { appInstances } from '@wix/app-management';
import { siteProperties } from '@wix/business-tools';
import { auth } from '@wix/essentials';

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
      const p = props as Record<string, unknown>;
      const properties = p?.properties as Record<string, unknown> | undefined;
      const address = properties?.address as Record<string, unknown> | undefined;
      const categories = properties?.categories as Record<string, unknown> | undefined;
      businessName = (properties?.businessName as string) ?? null;
      phone = (properties?.phone as string) ?? null;
      country = (address?.country as string) ?? null;
      city = (address?.city as string) ?? null;
      category = (categories?.primary as string) ?? null;
      subCategory = ((categories?.secondary as string[]) ?? [])[0] ?? null;
    } catch (err) {
      console.warn('[app-installed] getSiteProperties failed:', err);
    }

    const supabase = getSupabase();
    const inst = instance as Record<string, unknown>;
    const billing = inst?.billing as Record<string, unknown> | undefined;
    const siteRec = site as Record<string, unknown> | undefined;
    const ownerInfo = siteRec?.ownerInfo as Record<string, unknown> | undefined;
    const freeTrialInfo = billing?.freeTrialInfo as Record<string, unknown> | undefined;

    await supabase.from('app_installations').upsert(
      {
        instance_id: instanceId,
        app_name: APP_NAME,
        site_id: (siteRec?.siteId as string) ?? siteId,
        owner_email: (ownerInfo?.email as string) ?? null,
        business_name: businessName,
        phone,
        country,
        city,
        category,
        sub_category: subCategory,
        site_display_name: (siteRec?.siteDisplayName as string) ?? null,
        site_url: (siteRec?.url as string) ?? null,
        site_locale: (siteRec?.locale as string) ?? null,
        is_free: (inst?.isFree as boolean) ?? true,
        package_name: (billing?.packageName as string) ?? null,
        billing_cycle: (billing?.billingCycle as string) ?? null,
        billing_started_at: (billing?.timeStamp as string) ?? null,
        billing_expiration_date: (billing?.expirationDate as string) ?? null,
        auto_renewing: (billing?.autoRenewing as boolean) ?? null,
        free_trial_status: (freeTrialInfo?.status as string) ?? null,
        installed_at: new Date().toISOString(),
        removed_at: null,
        is_active: true,
      },
      { onConflict: 'instance_id' },
    );

    console.log('[app-installed] tracked:', instanceId);
  } catch (error) {
    console.error('[app-installed] failed:', error);
  }
});
