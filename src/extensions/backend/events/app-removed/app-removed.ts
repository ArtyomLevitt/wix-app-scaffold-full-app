import { getSupabase } from '../../../_shared/supabase-client';
import { appInstances } from '@wix/app-management';

export default appInstances.onAppInstanceRemoved(async (event) => {
  try {
    const instanceId = event.metadata?.instanceId;
    if (!instanceId) {
      console.warn('[app-removed] no instanceId in event');
      return;
    }

    const supabase = getSupabase();
    await supabase
      .from('app_installations')
      .update({
        is_active: false,
        removed_at: new Date().toISOString(),
      })
      .eq('instance_id', instanceId);

    console.log('[app-removed] tracked:', instanceId);
  } catch (error) {
    console.error('[app-removed] failed:', error);
  }
});
