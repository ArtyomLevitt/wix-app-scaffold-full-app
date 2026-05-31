import type { APIRoute } from 'astro';
import { loadWidgetSettings } from '../../../extensions/_shared/settings-store';
import { resolvePremium } from '../../../extensions/_shared/instance-resolver';
import {
  applyPremiumGating,
  toPublicSettings,
} from '../../../extensions/_shared/widget-settings-types';

export const OPTIONS: APIRoute = async () =>
  new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  });

export const GET: APIRoute = async () => {
  try {
    const { isPremium } = await resolvePremium();
    const settings = await loadWidgetSettings();
    const gated = applyPremiumGating(settings, isPremium);
    const publicSettings = toPublicSettings(gated, isPremium);

    return new Response(JSON.stringify(publicSettings), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (err) {
    console.error('[widget-settings] GET failed:', err);
    return new Response(JSON.stringify({ error: 'load_failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
