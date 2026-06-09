import type { APIRoute } from 'astro';
import { getSupabase } from '../../../extensions/_shared/supabase-client';
import { resolveInstanceId } from '../../../extensions/_shared/api-helpers';

export const OPTIONS: APIRoute = async () =>
  new Response(null, { status: 204 });

export const POST: APIRoute = async () => {
  try {
    const instanceId = await resolveInstanceId();
    if (!instanceId) {
      return new Response(JSON.stringify({ ok: false }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const supabase = getSupabase();
    await supabase
      .from('app_installations')
      .update({ setup_completed_at: new Date().toISOString() })
      .eq('instance_id', instanceId)
      .is('setup_completed_at', null);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    console.error('[tracking] trackSetupCompleted failed:', e);
    return new Response(JSON.stringify({ ok: false }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
