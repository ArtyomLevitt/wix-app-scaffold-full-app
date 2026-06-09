import { getSupabase } from '../../../_shared/supabase-client';
import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

async function syncBillingToSupabase(instanceId: string, logPrefix: string) {
  const { instance } = await elevatedGetAppInstance();
  const supabase = getSupabase();
  const inst = instance as Record<string, unknown>;
  const billing = inst?.billing as Record<string, unknown> | undefined;
  const freeTrialInfo = billing?.freeTrialInfo as Record<string, unknown> | undefined;

  await supabase
    .from('app_installations')
    .update({
      is_free: (inst?.isFree as boolean) ?? true,
      package_name: (billing?.packageName as string) ?? null,
      billing_cycle: (billing?.billingCycle as string) ?? null,
      billing_started_at: (billing?.timeStamp as string) ?? null,
      billing_expiration_date: (billing?.expirationDate as string) ?? null,
      auto_renewing: (billing?.autoRenewing as boolean) ?? null,
      free_trial_status: (freeTrialInfo?.status as string) ?? null,
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
