import type { APIRoute } from 'astro';
import { getSupabase } from '../../../extensions/_shared/supabase-client';
import { corsHeaders, jsonResponse, resolveInstanceId } from '../../../extensions/_shared/api-helpers';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const POST: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const instanceId = await resolveInstanceId();
    if (!instanceId) {
      return jsonResponse({ ok: false, error: 'no-instance' }, 200, headers);
    }

    const supabase = getSupabase();
    await supabase
      .from('app_installations')
      .update({ setup_completed_at: new Date().toISOString() })
      .eq('instance_id', instanceId)
      .is('setup_completed_at', null);

    return jsonResponse({ ok: true }, 200, headers);
  } catch (e) {
    console.error('[tracking] failed:', e);
    return jsonResponse({ ok: false }, 200, headers);
  }
};
