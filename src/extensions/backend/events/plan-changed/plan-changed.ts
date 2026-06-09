import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { getSupabase } from '../../../_shared/supabase-client';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

async function syncBillingToSupabase(instanceId: string, logPrefix: string) {
  const { instance } = await elevatedGetAppInstance();
  const supabase = getSupabase();
  const inst = instance as Record<string, unknown>;
  const billing = (inst?.billing ?? {}) as Record<string, unknown>;

  await supabase
    .from('app_installations')
    .update({
      is_free: inst?.isFree ?? true,
      package_name: billing?.packageName ?? null,
      billing_cycle: billing?.billingCycle ?? null,
      billing_started_at: billing?.timeStamp ?? null,
      billing_expiration_date: billing?.expirationDate ?? null,
      auto_renewing: billing?.autoRenewing ?? null,
      free_trial_status: ((billing?.freeTrialInfo as Record<string, unknown>)?.status as string) ?? null,
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
