import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { getSupabase } from '../../_shared/supabase-client';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

async function syncBillingToSupabase(instanceId: string, logPrefix: string) {
  const { instance } = await elevatedGetAppInstance();
  const supabase = getSupabase();

  await supabase
    .from('app_installations')
    .update({
      is_free: (instance as any)?.isFree ?? true,
      package_name: (instance as any)?.billing?.packageName ?? null,
      billing_cycle: (instance as any)?.billing?.billingCycle ?? null,
      billing_started_at: (instance as any)?.billing?.timeStamp ?? null,
      billing_expiration_date: (instance as any)?.billing?.expirationDate ?? null,
      auto_renewing: (instance as any)?.billing?.autoRenewing ?? null,
      free_trial_status: (instance as any)?.billing?.freeTrialInfo?.status ?? null,
    })
    .eq('instance_id', instanceId);

  console.log(`[${logPrefix}] tracked:`, instanceId);
}

export default appInstances.onAppInstancePaidPlanChanged(async (event) => {
  try {
    const instanceId = event.metadata?.instanceId;
    if (!instanceId) {
      console.warn('[plan-changed] no instanceId in event');
      return;
    }
    await syncBillingToSupabase(instanceId, 'plan-changed');
  } catch (error) {
    console.error('[plan-changed] failed:', error);
  }
});
