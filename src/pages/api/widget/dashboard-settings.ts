import type { APIRoute } from 'astro';
import { saveWidgetSettings } from '../../../extensions/_shared/settings-store';
import { resolveInstanceId, resolvePremium } from '../../../extensions/_shared/instance-resolver';
import { validatePdfUrl } from '../../../extensions/_shared/pdf-url';
import {
  applyPremiumGating,
  migrateSettings,
  stripPremiumFieldsFromPatch,
  type WidgetSettings,
} from '../../../extensions/_shared/widget-settings-types';

export const OPTIONS: APIRoute = async () => new Response(null, { status: 204 });

export const GET: APIRoute = async () => {
  try {
    const { isPremium } = await resolvePremium();
    const settings = await loadSettingsSafe(isPremium);
    return new Response(JSON.stringify({ settings, isPremium }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[dashboard-settings] GET failed:', err);
    return new Response(JSON.stringify({ error: 'load_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const instanceId = await resolveInstanceId();
    if (!instanceId) {
      return new Response(JSON.stringify({ error: 'no-instance' }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const patch = (await request.json().catch(() => ({}))) as Partial<WidgetSettings>;
    const { isPremium } = await resolvePremium();
    const { loadWidgetSettings } = await import('../../../extensions/_shared/settings-store');
    const base = applyPremiumGating(await loadWidgetSettings(), isPremium);
    const stripped = stripPremiumFieldsFromPatch(patch, isPremium);

    if (stripped.pdfUrl !== undefined && stripped.pdfUrl.trim()) {
      const validation = validatePdfUrl(stripped.pdfUrl);
      if (!validation.ok) {
        return new Response(JSON.stringify({ error: 'invalid_pdf_url', reason: validation.reason }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      stripped.pdfUrl = validation.normalized;
    }

    const merged = migrateSettings({ ...base, ...stripped });
    const saved = await saveWidgetSettings(merged);
    const gated = applyPremiumGating(saved, isPremium);

    return new Response(JSON.stringify({ settings: gated, isPremium }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[dashboard-settings] POST failed:', err);
    return new Response(JSON.stringify({ error: 'save_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

async function loadSettingsSafe(isPremium: boolean) {
  const { loadWidgetSettings } = await import('../../../extensions/_shared/settings-store');
  const settings = await loadWidgetSettings();
  return applyPremiumGating(settings, isPremium);
}
