// @ts-nocheck — reference skeleton, not real source. Imports point at placeholder paths or modules that aren't installed in this skills repo. See examples/INDEX.md.
// Canonical PRPL setup-tracking endpoint (Astro API route) — copy verbatim
// into src/pages/api/app/track-setup-completed.ts. Replaces tracking.web.ts.
//
// Called from the dashboard on the FIRST successful save. The `.is(null)`
// filter makes this safe to call on every save — `setup_completed_at` is
// updated exactly once.
//
//   import { httpClient } from '@wix/essentials';
//   httpClient.fetchWithAuth('/api/app/track-setup-completed', { method: 'POST' });

import type { APIRoute } from 'astro';
import { appInstances } from '@wix/app-management';
import { auth } from '@wix/essentials';
import { getSupabase } from '../../../extensions/_shared/supabase-client';

const elevatedGetAppInstance = auth.elevate(appInstances.getAppInstance);

// Prefer the auth token (always present for a webMethod caller) and fall
// back to the AppInstance API. The AppInstance lookup returns a PARTIAL
// response in editor / panel contexts, so reading `instance?.instanceId`
// alone is the #1 cause of "Save failed: no-instance" — always start with
// `auth.getTokenInfo()`.
async function resolveInstanceId(): Promise<string | null> {
  try {
    const tokenInfo = await auth.getTokenInfo();
    if (tokenInfo?.instanceId) return tokenInfo.instanceId;
  } catch (tokenErr) {
    console.warn('[tracking] getTokenInfo failed:', tokenErr);
  }
  try {
    const { instance } = await elevatedGetAppInstance();
    return instance?.instanceId ?? null;
  } catch (instErr) {
    console.warn('[tracking] getAppInstance failed:', instErr);
    return null;
  }
}

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

    console.log('[tracking] setup_completed tracked:', instanceId);
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
