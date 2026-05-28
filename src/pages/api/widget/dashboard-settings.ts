import type { APIRoute } from 'astro';
import { corsHeaders, jsonResponse } from '../../../extensions/_shared/api-helpers';
import { loadAppSettings, saveAppSettings } from '../../../extensions/_shared/settings-store';
import type { AppSettings } from '../../../extensions/_shared/app-settings-types';

export const OPTIONS: APIRoute = async ({ request }) =>
  new Response(null, { status: 204, headers: corsHeaders(request.headers.get('Origin')) });

export const GET: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const settings = await loadAppSettings(false);
    return jsonResponse({ settings }, 200, headers);
  } catch (error) {
    console.error('[dashboard-settings GET]', error);
    return jsonResponse({ error: 'load-failed' }, 500, headers);
  }
};

export const POST: APIRoute = async ({ request }) => {
  const headers = corsHeaders(request.headers.get('Origin'));
  try {
    const body = (await request.json()) as Partial<AppSettings>;
    const settings = await saveAppSettings(body);
    return jsonResponse({ settings }, 200, headers);
  } catch (error) {
    console.error('[dashboard-settings POST]', error);
    return jsonResponse({ error: 'save-failed' }, 500, headers);
  }
};
