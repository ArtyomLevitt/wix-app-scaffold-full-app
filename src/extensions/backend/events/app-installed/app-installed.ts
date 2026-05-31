import { appInstances } from '@wix/app-management';
import { siteProperties } from '@wix/business-tools';
import { auth } from '@wix/essentials';
import { APP_NAME } from '../../../_shared/app-config';
import { getSupabase } from '../../_shared/supabase-client';

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
      const p = props as { properties?: Record<string, unknown>; address?: Record<string, unknown> };
      businessName = (p?.properties?.businessName as string) ?? null;
      phone = (p?.properties?.phone as string) ?? null;
      const address = p?.properties?.address as Record<string, unknown> | undefined;
      country = (address?.country as string) ?? null;
      city = (address?.city as string) ?? null;
      const categories = p?.properties?.categories as { primary?: string; secondary?: string[] } | undefined;
      category = categories?.primary ?? null;
      subCategory = categories?.secondary?.[0] ?? null;
    } catch (err) {
      console.warn('[app-installed] getSiteProperties failed:', err);
    }

    const supabase = getSupabase();
    const inst = instance as Record<string, unknown>;
    const billing = inst?.billing as Record<string, unknown> | undefined;

    await supabase.from('app_installations').upsert(
      {
        instance_id: instanceId,
        app_name: APP_NAME,
        site_id: (site as { siteId?: string })?.siteId ?? siteId,
        owner_email: (site as { ownerInfo?: { email?: string } })?.ownerInfo?.email ?? null,
        business_name: businessName,
        phone,
        country,
        city,
        category,
        sub_category: subCategory,
        site_display_name: (site as { siteDisplayName?: string })?.siteDisplayName ?? null,
        site_url: (site as { url?: string })?.url ?? null,
        site_locale: (site as { locale?: string })?.locale ?? null,
        is_free: (inst?.isFree as boolean) ?? true,
        package_name: billing?.packageName ?? null,
        billing_cycle: billing?.billingCycle ?? null,
        billing_started_at: billing?.timeStamp ?? null,
        billing_expiration_date: billing?.expirationDate ?? null,
        auto_renewing: billing?.autoRenewing ?? null,
        free_trial_status: (billing?.freeTrialInfo as { status?: string })?.status ?? null,
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
