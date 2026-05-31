import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { getSupabase } from '../../_shared/supabase-client';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

async function syncBillingToSupabase(instanceId: string) {
  const { instance } = await elevatedGetAppInstance();
  const inst = instance as Record<string, unknown>;
  const billing = inst?.billing as Record<string, unknown> | undefined;
  const supabase = getSupabase();

  await supabase
    .from('app_installations')
    .update({
      is_free: (inst?.isFree as boolean) ?? true,
      package_name: billing?.packageName ?? null,
      billing_cycle: billing?.billingCycle ?? null,
      billing_started_at: billing?.timeStamp ?? null,
      billing_expiration_date: billing?.expirationDate ?? null,
      auto_renewing: billing?.autoRenewing ?? null,
      free_trial_status: (billing?.freeTrialInfo as { status?: string })?.status ?? null,
    })
    .eq('instance_id', instanceId);
}

export default appInstances.onAppInstancePaidPlanChanged(async (event) => {
  try {
    const instanceId = event.metadata?.instanceId;
    if (!instanceId) return;
    await syncBillingToSupabase(instanceId);
    console.log('[plan-changed] tracked:', instanceId);
  } catch (error) {
    console.error('[plan-changed] failed:', error);
  }
});
